/**
 * Boom - Redis In-Memory Cache Service
 * Simulates high-performance Redis cache for frequent BRVM market queries, order book snapshots, and session state.
 */

import type { RedisCacheStats } from '../types/index.ts';

interface CacheEntry {
  value: any;
  expiresAt: number;
  sizeBytes: number;
}

class RedisCacheStore {
  private cache = new Map<string, CacheEntry>();
  private hits = 14280;
  private misses = 340;
  private listeners: ((stats: RedisCacheStats) => void)[] = [];

  constructor() {
    // Background TTL cleanup every 10 seconds
    setInterval(() => {
      this.evictExpired();
    }, 10000);
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      this.notify();
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      this.notify();
      return null;
    }

    this.hits++;
    this.notify();
    return entry.value as T;
  }

  public set(key: string, value: any, ttlSeconds: number = 60): void {
    const serialized = JSON.stringify(value);
    const sizeBytes = serialized.length * 2; // rough UTF-16 bytes
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      sizeBytes,
    });
    this.notify();
  }

  public delete(key: string): void {
    this.cache.delete(key);
    this.notify();
  }

  public invalidatePattern(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.notify();
    return count;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    this.notify();
  }

  public getStats(): RedisCacheStats {
    let totalBytes = 0;
    let quoteKeys = 0;
    for (const [key, entry] of this.cache.entries()) {
      totalBytes += entry.sizeBytes;
      if (key.startsWith('quote:') || key.startsWith('orderbook:')) {
        quoteKeys++;
      }
    }

    return {
      hits: this.hits,
      misses: this.misses,
      keyCount: this.cache.size,
      memoryUsedKb: Math.max(128, Math.round(totalBytes / 1024)),
      lastEviction: new Date().toLocaleTimeString(),
      cachedQuotesCount: quoteKeys,
    };
  }

  public subscribe(cb: (stats: RedisCacheStats) => void): () => void {
    this.listeners.push(cb);
    cb(this.getStats());
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    const stats = this.getStats();
    for (const l of this.listeners) {
      try {
        l(stats);
      } catch (err) {
        // silent
      }
    }
  }
}

export const redisCache = new RedisCacheStore();
