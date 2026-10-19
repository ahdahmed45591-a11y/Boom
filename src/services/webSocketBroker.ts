/**
 * Boom - WebSocket Real-Time Event Broker
 * Pushes live market ticks, order book depth, trade executions, and messages across user interfaces.
 */

export type WebSocketTopic =
  | 'market:ticks'
  | 'orders:flow'
  | 'orderbook:update'
  | 'kyc:events'
  | 'support:chat'
  | 'deposits:events'
  | 'audit:events'
  | 'auth:events';

export interface WsMessage<T = any> {
  topic: WebSocketTopic;
  event: string;
  payload: T;
  timestamp: number;
}

class WebSocketBrokerService {
  private subscribers: Map<string, Set<(msg: WsMessage) => void>> = new Map();
  private ws: any = null;
  private isConnected = true;
  private messageCount = 0;
  private latencyMs = 12;

  constructor() {
    this.connectNetworkWs();
  }

  private connectNetworkWs() {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;
    const wsUrl = (import.meta.env?.VITE_WS_URL as string) || `ws://${window.location.hostname}:8000`;
    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.onmessage = (event: any) => {
        try {
          const data: WsMessage = JSON.parse(event.data);
          if (data && data.topic) {
            this.dispatchLocal(data.topic, data.event, data.payload, false);
          }
        } catch {
          // ignore malformed message
        }
      };
      this.ws.onclose = () => {
        // Reconnect after 3s
        setTimeout(() => this.connectNetworkWs(), 3000);
      };
    } catch {
      // Offline fallback
    }
  }

  public subscribe<T = any>(topic: WebSocketTopic, callback: (msg: WsMessage<T>) => void): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    const set = this.subscribers.get(topic)!;
    set.add(callback as any);

    return () => {
      set.delete(callback as any);
    };
  }

  private dispatchLocal<T = any>(topic: WebSocketTopic, event: string, payload: T, sendOverNetwork: boolean): void {
    this.messageCount++;
    const message: WsMessage<T> = {
      topic,
      event,
      payload,
      timestamp: Date.now(),
    };

    const set = this.subscribers.get(topic);
    if (set) {
      set.forEach(cb => {
        try {
          cb(message);
        } catch (e) {
          console.error(`WebSocket dispatch error on topic ${topic}:`, e);
        }
      });
    }

    if (sendOverNetwork && this.ws && this.ws.readyState === 1) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch {
        // silent
      }
    }
  }

  public publish<T = any>(topic: WebSocketTopic, event: string, payload: T): void {
    this.dispatchLocal(topic, event, payload, true);
  }

  public getStatus() {
    return {
      connected: this.ws ? this.ws.readyState === 1 : this.isConnected,
      activeChannels: this.subscribers.size,
      totalMessagesSent: this.messageCount,
      latencyMs: this.latencyMs,
    };
  }
}

export const wsBroker = new WebSocketBrokerService();

