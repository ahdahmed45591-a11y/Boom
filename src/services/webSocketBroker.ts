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
  private isConnected = true;
  private messageCount = 0;
  private latencyMs = 12;

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

  public publish<T = any>(topic: WebSocketTopic, event: string, payload: T): void {
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
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      activeChannels: this.subscribers.size,
      totalMessagesSent: this.messageCount,
      latencyMs: this.latencyMs,
    };
  }
}

export const wsBroker = new WebSocketBrokerService();
