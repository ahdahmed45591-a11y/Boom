/**
 * Boom - Backend API Client & WebSocket Connector
 * Connects the Android Mobile Application and SGI Boom Capital Portal
 * to the real backend running on port 8000.
 */

const API_BASE = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:8000/api';
const WS_URL = (import.meta.env?.VITE_WS_URL as string) || 'ws://localhost:8000';

export const apiClient = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Quotes
  async getQuotes() {
    const res = await fetch(`${API_BASE}/quotes`);
    return res.json();
  },

  // Portfolio
  async getPortfolio() {
    const res = await fetch(`${API_BASE}/portfolio`);
    return res.json();
  },

  // Cards & Wallet
  async getCards() {
    const res = await fetch(`${API_BASE}/cards`);
    return res.json();
  },

  async addCard(data: { cardholderName: string; cardNumber: string; expiryMonth: number; expiryYear: number; bankName?: string; initialBalanceXof?: number }) {
    const res = await fetch(`${API_BASE}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async setDefaultCard(cardId: string) {
    const res = await fetch(`${API_BASE}/cards/${cardId}/default`, { method: 'POST' });
    return res.json();
  },

  async deleteCard(cardId: string) {
    const res = await fetch(`${API_BASE}/cards/${cardId}`, { method: 'DELETE' });
    return res.json();
  },

  async rechargeWallet(amountXof: number, cardId?: string) {
    const res = await fetch(`${API_BASE}/wallet/recharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountXof, cardId }),
    });
    return res.json();
  },

  // Orders
  async getOrders() {
    const res = await fetch(`${API_BASE}/orders`);
    return res.json();
  },

  async placeOrder(order: { symbol: string; side: 'BUY' | 'SELL'; type: 'MARKET' | 'LIMIT'; quantity: number; price?: number; mfaVerified?: boolean; biometricVerified?: boolean }) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return res.json();
  },

  // KYC
  async getKycList() {
    const res = await fetch(`${API_BASE}/kyc`);
    return res.json();
  },

  async submitKyc(data: any) {
    const res = await fetch(`${API_BASE}/kyc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async reviewKyc(id: string, action: 'VERIFIED' | 'REJECTED', reviewedBy?: string) {
    const res = await fetch(`${API_BASE}/kyc/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reviewedBy }),
    });
    return res.json();
  },

  // Real-time WebSocket
  connectRealtime(onMessage: (topic: string, event: string, payload: any) => void) {
    try {
      const ws = new WebSocket(WS_URL);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data.topic, data.event, data.payload);
        } catch (e) {
          // ignore parsing error
        }
      };
      return ws;
    } catch (e) {
      console.warn('WebSocket non connecté:', e);
      return null;
    }
  },
};

