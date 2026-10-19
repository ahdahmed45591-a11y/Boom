/**
 * Boom - Real Autonomous Backend Server (Express + WebSockets)
 * Connects the Android Mobile Application and the SGI Boom Capital Broker Portal.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
// @ts-ignore
import { WebSocketServer, WebSocket } from 'ws';

import type {
  StockQuote,
  TradeOrder,
  UserPortfolio,
  KycRecord,
  DepositRecord,
  PaymentCard,
  AuditLogEntry,
} from './src/types/index.ts';

import {
  calculateTradingFees,
  matchOrderAgainstBook,
  updatePositionAfterTrade,
  generateExecutionHash,
  evaluateCardRecharge,
  detectCardBrand,
} from './src/services/tradingEngine.ts';

import initialQuotes from './src/services/scrapedMarketData.json';

import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'boom.sqlite');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Native Node.js SQLite instance with WAL mode for concurrent reads/writes
const sqlite = new DatabaseSync(DB_FILE);
sqlite.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

const stmtGet = sqlite.prepare('SELECT value FROM kv_store WHERE key = ?');
const stmtSet = sqlite.prepare('INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)');

// --- Persistent Storage ---
interface AppState {
  portfolio: UserPortfolio;
  cards: PaymentCard[];
  orders: TradeOrder[];
  kycRecords: KycRecord[];
  deposits: DepositRecord[];
  auditLogs: AuditLogEntry[];
  quotes: StockQuote[];
}

function loadState(): AppState {
  try {
    const row = stmtGet.get('app_state') as { value: string } | undefined;
    if (row && row.value) {
      const data = JSON.parse(row.value);
      if (data && data.portfolio && data.cards) {
        return data;
      }
    }
  } catch (e) {
    console.warn('⚠️ Erreur lecture SQLite, initialisation état par défaut.');
  }

  const defaultState: AppState = {
    portfolio: {
      userId: 'usr-investor-001',
      cashBalanceXof: 2450000,
      reservedCashXof: 0,
      positions: [
        {
          symbol: 'SNTS',
          shares: 15,
          averageBuyPrice: 18200,
          currentPrice: 18750,
          totalCost: 273000,
          currentValue: 281250,
          unrealizedPnL: 8250,
          unrealizedPnLPercent: 3.02,
        },
        {
          symbol: 'ORAC',
          shares: 30,
          averageBuyPrice: 11500,
          currentPrice: 11900,
          totalCost: 345000,
          currentValue: 357000,
          unrealizedPnL: 12000,
          unrealizedPnLPercent: 3.48,
        },
      ],
    },
    cards: [
      {
        id: 'card-sg-01',
        userId: 'usr-investor-001',
        cardholderName: 'AMADOU KONE',
        cardNumberLast4: '4242',
        cardMasked: '4485 •••• •••• 4242',
        brand: 'VISA',
        expiryMonth: 11,
        expiryYear: 2028,
        isDefault: true,
        bankName: 'Société Générale CI',
        balanceStatus: 'ACTIVE',
        availableCardBalanceXof: 1500000,
        linkedAt: Date.now() - 86400000 * 15,
      },
      {
        id: 'card-eco-02',
        userId: 'usr-investor-001',
        cardholderName: 'AMADOU KONE',
        cardNumberLast4: '8819',
        cardMasked: '5399 •••• •••• 8819',
        brand: 'MASTERCARD',
        expiryMonth: 6,
        expiryYear: 2027,
        isDefault: false,
        bankName: 'Ecobank CI',
        balanceStatus: 'ACTIVE',
        availableCardBalanceXof: 500000,
        linkedAt: Date.now() - 86400000 * 5,
      },
    ],
    orders: [],
    kycRecords: [
      {
        id: 'kyc-001',
        userId: 'usr-investor-001',
        fullName: 'Amadou Koné',
        email: 'baoufinance@gmail.com',
        phone: '+225 07 48 92 11 04',
        idType: 'NATIONAL_ID',
        idNumber: 'CI-1988-084920',
        nationality: 'Ivoirienne',
        dateOfBirth: '1988-03-12',
        residentialAddress: 'Cocody Riviera Golf, Abidjan',
        idFrontImage: 'data:image/png;base64,sample',
        selfieImage: 'data:image/png;base64,sample',
        selfieConfidenceScore: 98.4,
        signatureDataUrl: 'data:image/png;base64,sample',
        status: 'VERIFIED',
        submissionDate: Date.now() - 86400000 * 10,
        reviewedDate: Date.now() - 86400000 * 9,
        reviewedBy: 'Desk Conformité SGI Boom Capital',
      },
    ],
    deposits: [],
    auditLogs: [],
    quotes: (initialQuotes as StockQuote[]) || [],
  };

  saveState(defaultState);
  return defaultState;
}

function saveState(state: AppState) {
  try {
    stmtSet.run('app_state', JSON.stringify(state), Date.now());
  } catch (err) {
    console.error('❌ Erreur sauvegarde SQLite:', err);
  }
}

const state = loadState();

// --- Express App & HTTP Server ---
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Minimal Native Middleware
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Broadcast Helper via WebSocket
function broadcast(topic: string, event: string, payload: any) {
  const msg = JSON.stringify({ topic, event, payload, timestamp: Date.now() });
  wss.clients.forEach((client: any) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// WebSocket Connection Handlers
wss.on('connection', (ws: any) => {
  ws.send(JSON.stringify({
    topic: 'system:info',
    event: 'CONNECTED',
    payload: {
      server: 'SGI Boom Capital Microservices Core Engine',
      brvmStatus: 'OPEN',
      activeStocksCount: state.quotes.length,
      connectedAt: Date.now(),
    },
  }));

  ws.on('message', (raw: any) => {
    try {
      const data = JSON.parse(raw.toString());
      // Re-broadcast to all other clients
      wss.clients.forEach((client: any) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch {
      // ignore
    }
  });
});

// --- REST API ENDPOINTS ---

// 1. Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    broker: 'SGI Boom Capital Partners (Agrément AMF-UMOA #042/2021)',
    connectedClients: wss.clients.size,
    timestamp: Date.now(),
  });
});

// 2. Market Quotes
app.get('/api/quotes', (req, res) => {
  res.json(state.quotes);
});

app.get('/api/quotes/:symbol', (req, res) => {
  const q = state.quotes.find(s => s.symbol.toUpperCase() === req.params.symbol.toUpperCase());
  if (!q) return res.status(404).json({ error: 'Valeur mobilière introuvable' });
  res.json(q);
});

// 3. Portfolio & Balances
app.get('/api/portfolio', (req, res) => {
  // Update positions values
  for (const pos of state.portfolio.positions) {
    const quote = state.quotes.find(q => q.symbol === pos.symbol);
    if (quote) {
      pos.currentPrice = quote.price;
      pos.currentValue = pos.shares * quote.price;
      pos.unrealizedPnL = pos.currentValue - pos.totalCost;
      pos.unrealizedPnLPercent = pos.totalCost > 0 ? Number(((pos.unrealizedPnL / pos.totalCost) * 100).toFixed(2)) : 0;
    }
  }
  res.json(state.portfolio);
});

// 4. Payment Cards & Wallet Management
app.get('/api/cards', (req, res) => {
  res.json(state.cards);
});

app.post('/api/cards', (req, res) => {
  const { cardholderName, cardNumber, expiryMonth, expiryYear, bankName, initialBalanceXof } = req.body;
  if (!cardholderName || !cardNumber) {
    return res.status(400).json({ error: 'Titulaire et numéro de carte obligatoires' });
  }

  const brand = detectCardBrand(cardNumber);
  const cleanDigits = cardNumber.replace(/\D/g, '');
  const last4 = cleanDigits.slice(-4) || '1234';
  const cardMasked = `${cleanDigits.slice(0, 4)} •••• •••• ${last4}`;

  const newCard: PaymentCard = {
    id: `card-${Date.now().toString(36)}`,
    userId: 'usr-investor-001',
    cardholderName: cardholderName.toUpperCase().trim(),
    cardNumberLast4: last4,
    cardMasked,
    brand,
    expiryMonth: Number(expiryMonth) || 12,
    expiryYear: Number(expiryYear) || 2028,
    isDefault: state.cards.length === 0,
    bankName: bankName || (brand === 'VISA' ? 'Société Générale' : 'Ecobank'),
    balanceStatus: 'ACTIVE',
    availableCardBalanceXof: initialBalanceXof !== undefined ? Number(initialBalanceXof) : 500000,
    linkedAt: Date.now(),
  };

  state.cards.push(newCard);
  saveState(state);
  broadcast('cards:events', 'CARD_ADDED', newCard);
  res.status(201).json(newCard);
});

// Set active funding card for wallet
app.post('/api/cards/:id/default', (req, res) => {
  const card = state.cards.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Carte introuvable' });

  for (const c of state.cards) {
    c.isDefault = c.id === card.id;
  }
  saveState(state);
  broadcast('cards:events', 'DEFAULT_CARD_CHANGED', card);
  res.json({ success: true, defaultCard: card });
});

app.delete('/api/cards/:id', (req, res) => {
  state.cards = state.cards.filter(c => c.id !== req.params.id);
  if (state.cards.length > 0 && !state.cards.some(c => c.isDefault)) {
    state.cards[0].isDefault = true;
  }
  saveState(state);
  broadcast('cards:events', 'CARD_DELETED', { cardId: req.params.id });
  res.json({ success: true });
});

// Recharge wallet via Card
app.post('/api/wallet/recharge', (req, res) => {
  const { cardId, amountXof } = req.body;
  const amount = Number(amountXof);
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Montant invalide' });
  }

  // Vérification KYC AMF-UMOA
  const kyc = state.kycRecords.find(k => k.userId === 'usr-investor-001');
  if (!kyc || kyc.status !== 'VERIFIED') {
    const detail = !kyc
      ? "Dossier KYC non soumis."
      : kyc.status === 'SUBMITTED'
      ? "Dossier KYC en cours d'examen par la conformité SGI."
      : "Dossier KYC rejeté.";
    return res.status(403).json({
      error: `Dépôt bloqué : Conformité AMF-UMOA requise. ${detail}`,
      canSwitchCard: false,
    });
  }

  const card = cardId ? state.cards.find(c => c.id === cardId) : state.cards.find(c => c.isDefault) || state.cards[0];
  if (!card) {
    return res.status(400).json({ error: 'Aucune carte bancaire configurée', canSwitchCard: true });
  }

  const evaluation = evaluateCardRecharge(card, amount);
  if (!evaluation.success) {
    return res.status(400).json({
      error: evaluation.errorMessage,
      canSwitchCard: evaluation.canSwitchCard,
      availableCardBalanceXof: card.availableCardBalanceXof,
    });
  }

  // Atomically debit card and credit cash balance
  card.availableCardBalanceXof -= amount;
  state.portfolio.cashBalanceXof += amount;

  const deposit: DepositRecord = {
    id: `dep-card-${Date.now().toString(36)}`,
    userId: 'usr-investor-001',
    investorName: 'Amadou Koné',
    method: 'CREDIT_CARD',
    amountXof: amount,
    referenceCode: `CB-${card.brand}-${card.cardNumberLast4}-${Date.now().toString().slice(-6)}`,
    status: 'APPROVED',
    timestamp: Date.now(),
    approvedAt: Date.now(),
    cardId: card.id,
    cardLast4: card.cardNumberLast4,
    cardBrand: card.brand,
    cardBank: card.bankName,
    auth3dSecureRef: evaluation.auth3dSecureRef,
  };

  state.deposits.unshift(deposit);
  saveState(state);

  // Real-time broadcast to Mobile App & SGI Boom Capital
  broadcast('deposits:events', 'DEPOSIT_APPROVED', deposit);
  broadcast('portfolio:events', 'BALANCE_UPDATED', { newBalance: state.portfolio.cashBalanceXof });

  res.json({
    success: true,
    deposit,
    newCashBalanceXof: state.portfolio.cashBalanceXof,
    availableCardBalanceXof: card.availableCardBalanceXof,
  });
});

// 5. Trading Execution (Orders)
app.get('/api/orders', (req, res) => {
  res.json(state.orders);
});

app.post('/api/orders', (req, res) => {
  const { symbol, side, type, quantity, price, mfaVerified, biometricVerified } = req.body;
  const quote = state.quotes.find(q => q.symbol === symbol);
  if (!quote) return res.status(404).json({ error: 'Valeur mobilière introuvable sur la BRVM' });

  const orderPrice = type === 'MARKET' ? quote.price : (Number(price) || quote.price);
  const qty = Number(quantity);
  if (!qty || qty <= 0) return res.status(400).json({ error: 'Quantité invalide' });

  const fees = calculateTradingFees(qty, orderPrice, side);

  // Balance & Holdings Verification
  if (side === 'BUY') {
    if (state.portfolio.cashBalanceXof < fees.netTotal) {
      return res.status(400).json({
        error: `Solde espèces insuffisant. Requis: ${fees.netTotal.toLocaleString('fr-FR')} XOF, Disponible: ${state.portfolio.cashBalanceXof.toLocaleString('fr-FR')} XOF`,
      });
    }
  } else {
    const existingPos = state.portfolio.positions.find(p => p.symbol === symbol);
    if (!existingPos || existingPos.shares < qty) {
      return res.status(400).json({
        error: `Nombre de titres insuffisant. Disponible: ${existingPos?.shares || 0} titres, Demandé: ${qty}`,
      });
    }
  }

  // Match against Order Book
  const matchResult = matchOrderAgainstBook(
    side,
    type,
    qty,
    orderPrice,
    side === 'BUY' ? quote.asks : quote.bids
  );

  const isFilled = matchResult.filledQuantity === qty;
  const executedPrice = matchResult.executedPrice > 0 ? matchResult.executedPrice : orderPrice;
  const actualFees = calculateTradingFees(qty, executedPrice, side);

  const orderId = `ord-bm-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  const timestamp = Date.now();

  const executionHash = generateExecutionHash({
    id: orderId,
    userId: 'usr-investor-001',
    symbol,
    side,
    quantity: qty,
    price: executedPrice,
    timestamp,
  });

  const newOrder: TradeOrder = {
    id: orderId,
    userId: 'usr-investor-001',
    investorName: 'Amadou Koné',
    symbol,
    side,
    type,
    quantity: qty,
    price: executedPrice,
    filledQuantity: matchResult.filledQuantity,
    status: isFilled ? 'FILLED' : matchResult.filledQuantity > 0 ? 'PARTIALLY_FILLED' : 'PENDING',
    brvmFee: actualFees.brvmFee,
    crepmfFee: actualFees.crepmfFee,
    sgiFee: actualFees.sgiFee,
    totalCostXof: actualFees.netTotal,
    timestamp,
    executionHash,
    encryptedPayload: `enc:aes256gcm:${Buffer.from(JSON.stringify({ symbol, qty, price: executedPrice })).toString('base64')}`,
    mfaVerified: Boolean(mfaVerified),
    biometricVerified: Boolean(biometricVerified),
  };

  // Atomically update portfolio
  if (side === 'BUY') {
    state.portfolio.cashBalanceXof -= actualFees.netTotal;
    const existingPos = state.portfolio.positions.find(p => p.symbol === symbol);
    const updatedPos = updatePositionAfterTrade(existingPos, symbol, 'BUY', qty, executedPrice, quote.price);
    if (updatedPos) {
      if (existingPos) Object.assign(existingPos, updatedPos);
      else state.portfolio.positions.push(updatedPos);
    }
  } else {
    state.portfolio.cashBalanceXof += actualFees.netTotal;
    const existingPos = state.portfolio.positions.find(p => p.symbol === symbol);
    const updatedPos = updatePositionAfterTrade(existingPos, symbol, 'SELL', qty, executedPrice, quote.price);
    if (updatedPos === null) {
      state.portfolio.positions = state.portfolio.positions.filter(p => p.symbol !== symbol);
    } else if (existingPos) {
      Object.assign(existingPos, updatedPos);
    }
  }

  state.orders.unshift(newOrder);

  // Audit Log Entry
  state.auditLogs.unshift({
    id: `aud-${Date.now().toString(36)}`,
    timestamp,
    action: `ORDER_EXECUTED_${side}`,
    actorId: 'usr-investor-001',
    actorRole: 'INVESTOR',
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
    payloadHash: executionHash,
    encryptedDetails: newOrder.encryptedPayload,
  });

  saveState(state);

  // Broadcast to Mobile App & SGI Broker Portal in real-time
  broadcast('orders:flow', 'ORDER_EXECUTED', newOrder);
  broadcast('portfolio:events', 'PORTFOLIO_UPDATED', state.portfolio);

  res.status(201).json({ success: true, order: newOrder });
});

// 6. KYC Desk (Mobile Submission & SGI Compliance Review)
app.get('/api/kyc', (req, res) => {
  res.json(state.kycRecords);
});

app.post('/api/kyc', (req, res) => {
  const { fullName, idType, idNumber, nationality, dateOfBirth, residentialAddress, idFrontImage, selfieImage, signatureDataUrl } = req.body;
  if (!fullName || !idNumber) {
    return res.status(400).json({ error: 'Nom complet et numéro de pièce requis' });
  }

  const existing = state.kycRecords.find(k => k.userId === 'usr-investor-001');
  const record: KycRecord = {
    id: existing ? existing.id : `kyc-${Date.now().toString(36)}`,
    userId: 'usr-investor-001',
    fullName,
    email: 'baoufinance@gmail.com',
    phone: '+225 07 48 92 11 04',
    idType: idType || 'NATIONAL_ID',
    idNumber,
    nationality: nationality || 'Ivoirienne',
    dateOfBirth: dateOfBirth || '1990-01-01',
    residentialAddress: residentialAddress || 'Abidjan',
    idFrontImage: idFrontImage || '',
    selfieImage: selfieImage || '',
    selfieConfidenceScore: 98.2,
    signatureDataUrl: signatureDataUrl || '',
    status: 'SUBMITTED',
    submissionDate: Date.now(),
  };

  if (existing) Object.assign(existing, record);
  else state.kycRecords.unshift(record);

  saveState(state);

  // Broadcast to SGI Boom Capital Compliance Desk
  broadcast('kyc:events', 'KYC_SUBMITTED', record);

  res.status(201).json(record);
});

// SGI Broker Officer validates/rejects KYC
app.post('/api/kyc/:id/review', (req, res) => {
  const { action, reviewedBy, rejectionReason } = req.body;
  const record = state.kycRecords.find(k => k.id === req.params.id);
  if (!record) return res.status(404).json({ error: 'Dossier KYC introuvable' });

  record.status = action === 'VERIFIED' ? 'VERIFIED' : 'REJECTED';
  record.reviewedDate = Date.now();
  record.reviewedBy = reviewedBy || 'Desk Conformité SGI Boom Capital';
  if (rejectionReason) record.rejectionReason = rejectionReason;

  saveState(state);

  // Real-time broadcast back to Android Mobile Application
  broadcast('kyc:events', 'KYC_STATUS_UPDATED', record);

  res.json({ success: true, record });
});

// 7. SGI Compliance Audit Logs
app.get('/api/audit', (req, res) => {
  res.json(state.auditLogs);
});

// Start Server
const PORT = Number(process.env.PORT) || 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SGI Boom Capital Backend API & WebSocket Broker démarré !`);
  console.log(`📡 URL API REST : http://localhost:${PORT}/api/`);
  console.log(`🔌 WebSocket    : ws://localhost:${PORT}`);
  console.log(`📁 Persistance  : ${DB_FILE}`);
  console.log(`📈 Valeurs BRVM : ${state.quotes.length} actions actives`);
});
