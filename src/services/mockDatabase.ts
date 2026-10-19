/**
 * Boom - Central State & Relational Microservices Core Engine
 * Manages atomic transactions, order matching, balance calculations, KYC pipeline, and real-time state synchronization.
 */

import { INITIAL_BRVM_STOCKS } from './marketData.ts';
import scrapedData from './scrapedMarketData.json';
import type {
  StockQuote,
  TradeOrder,
  UserPortfolio,
  KycRecord,
  DepositRecord,
  SupportMessage,
  OrderSide,
  OrderType,
  PaymentCard,
  CardBrand,
  CardStatus,
  AuthUser,
  AuthProvider,
} from '../types/index.ts';
import {
  calculateTradingFees,
  matchOrderAgainstBook,
  updatePositionAfterTrade,
  generateExecutionHash,
  evaluateCardRecharge,
  detectCardBrand,
  formatCardNumber,
  validateSocialLogin,
} from './tradingEngine.ts';
import { redisCache } from './redisCache.ts';
import { wsBroker } from './webSocketBroker.ts';
import { securityService } from './securityService.ts';

// Simulated Investor
export const CURRENT_INVESTOR = {
  id: 'usr-investor-001',
  name: 'Amadou Koné',
  email: 'baoufinance@gmail.com', // Synchronized with user session
  phone: '+225 07 48 92 11 04',
  country: 'Côte d\'Ivoire',
  sgiBrokerName: 'SGI Boom Capital Partners (Agrément AMF-UMOA #042/2021)',
};

class CentralDatabaseEngine {
  private currentUser: AuthUser = {
    id: CURRENT_INVESTOR.id,
    name: CURRENT_INVESTOR.name,
    email: CURRENT_INVESTOR.email,
    phone: CURRENT_INVESTOR.phone,
    provider: 'GOOGLE',
    accountNumber: '042-8921-CI',
    sgiBrokerName: CURRENT_INVESTOR.sgiBrokerName,
    kycTier: 2,
    isLoggedIn: true,
  };

  private userCards: PaymentCard[] = [
    {
      id: 'card-sg-01',
      userId: CURRENT_INVESTOR.id,
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
      userId: CURRENT_INVESTOR.id,
      cardholderName: 'AMADOU KONE',
      cardNumberLast4: '8819',
      cardMasked: '5399 •••• •••• 8819',
      brand: 'MASTERCARD',
      expiryMonth: 6,
      expiryYear: 2027,
      isDefault: false,
      bankName: 'Ecobank UEMOA',
      balanceStatus: 'NEEDS_RECHARGE', // Demonstrates a card that is not recharged / insufficient funds!
      availableCardBalanceXof: 5000,
      linkedAt: Date.now() - 86400000 * 8,
    },
    {
      id: 'card-gim-03',
      userId: CURRENT_INVESTOR.id,
      cardholderName: 'AMADOU KONE',
      cardNumberLast4: '1094',
      cardMasked: '9000 •••• •••• 1094',
      brand: 'GIM_UEMOA',
      expiryMonth: 9,
      expiryYear: 2029,
      isDefault: false,
      bankName: 'BOA (Bank of Africa) CI',
      balanceStatus: 'ACTIVE',
      availableCardBalanceXof: 850000,
      linkedAt: Date.now() - 86400000 * 2,
    },
  ];

  private quotes: StockQuote[] = JSON.parse(
    JSON.stringify(
      scrapedData && Array.isArray(scrapedData) && scrapedData.length > 0
        ? (scrapedData as StockQuote[])
        : INITIAL_BRVM_STOCKS
    )
  );

  private portfolio: UserPortfolio = {
    userId: CURRENT_INVESTOR.id,
    cashBalanceXof: 2450000, // 2,450,000 FCFA
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
      {
        symbol: 'ETIT',
        shares: 2500,
        averageBuyPrice: 18,
        currentPrice: 19,
        totalCost: 45000,
        currentValue: 47500,
        unrealizedPnL: 2500,
        unrealizedPnLPercent: 5.56,
      },
    ],
  };

  private orders: TradeOrder[] = [
    {
      id: 'ord-bm-9821',
      userId: CURRENT_INVESTOR.id,
      investorName: CURRENT_INVESTOR.name,
      symbol: 'SNTS',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 15,
      price: 18200,
      filledQuantity: 15,
      status: 'FILLED',
      brvmFee: 546,
      crepmfFee: 273,
      sgiFee: 1365,
      totalCostXof: 275184,
      timestamp: Date.now() - 86400000 * 2,
      executionHash: '0x3f99a182b8104d5500e84c9876ef4321',
      encryptedPayload: 'enc:aes256gcm:eyJzeW1ib2wiOiJTTlRTIiwicXR5IjoxNX0=:a8f9',
      mfaVerified: true,
      biometricVerified: true,
    },
    {
      id: 'ord-bm-9822',
      userId: CURRENT_INVESTOR.id,
      investorName: CURRENT_INVESTOR.name,
      symbol: 'ORAC',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 30,
      price: 11500,
      filledQuantity: 30,
      status: 'FILLED',
      brvmFee: 690,
      crepmfFee: 345,
      sgiFee: 1725,
      totalCostXof: 347760,
      timestamp: Date.now() - 86400000,
      executionHash: '0x7b11c9810a9d8c6600a2948712bc8890',
      encryptedPayload: 'enc:aes256gcm:eyJzeW1ib2wiOiJPUkFDIiwicXR5IjozMH0=:5f12',
      mfaVerified: true,
      biometricVerified: true,
    },
  ];

  private kycRecords: KycRecord[] = [
    {
      id: 'kyc-ci-001',
      userId: CURRENT_INVESTOR.id,
      fullName: CURRENT_INVESTOR.name,
      email: CURRENT_INVESTOR.email,
      phone: CURRENT_INVESTOR.phone,
      idType: 'NATIONAL_ID',
      idNumber: 'CI-00482910381',
      nationality: 'Ivoirienne',
      dateOfBirth: '1988-06-14',
      residentialAddress: 'Cocody Riviera 3, Abidjan, Côte d\'Ivoire',
      idFrontImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      idBackImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      selfieImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      selfieConfidenceScore: 98.4,
      signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M10 40 Q 50 10 90 35 T 180 20" stroke="%232563eb" stroke-width="3" fill="none"/></svg>',
      status: 'SUBMITTED', // Pending SGI review!
      submissionDate: Date.now() - 14400000,
    },
    {
      id: 'kyc-sn-002',
      userId: 'usr-investor-002',
      fullName: 'Fatou Diop',
      email: 'fatou.diop@dakar-invest.sn',
      phone: '+221 77 654 32 10',
      idType: 'PASSPORT',
      idNumber: 'SN-P0847291',
      nationality: 'Sénégalaise',
      dateOfBirth: '1992-11-23',
      residentialAddress: 'Almadies, Dakar, Sénégal',
      idFrontImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      selfieImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
      selfieConfidenceScore: 99.1,
      signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M10 30 C 40 5 70 50 120 20 S 180 40 190 25" stroke="%2310b981" stroke-width="3" fill="none"/></svg>',
      status: 'VERIFIED',
      submissionDate: Date.now() - 86400000 * 5,
      reviewedDate: Date.now() - 86400000 * 4,
      reviewedBy: 'SGI Compliance Lead - Jean-Marc Kouamé',
    },
  ];

  private deposits: DepositRecord[] = [
    {
      id: 'dep-wv-101',
      userId: CURRENT_INVESTOR.id,
      investorName: CURRENT_INVESTOR.name,
      method: 'WAVE',
      amountXof: 500000,
      phoneNumber: '+225 07 48 92 11 04',
      referenceCode: 'WAVE-CI-7739104',
      status: 'PENDING',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'dep-om-100',
      userId: CURRENT_INVESTOR.id,
      investorName: CURRENT_INVESTOR.name,
      method: 'WAVE',
      amountXof: 1000000,
      phoneNumber: '+225 07 48 92 11 04',
      referenceCode: 'WV-CI-9948210',
      status: 'APPROVED',
      timestamp: Date.now() - 86400000 * 3,
      approvedAt: Date.now() - 86400000 * 3 + 120000,
    },
  ];

  private supportMessages: SupportMessage[] = [
    {
      id: 'msg-001',
      conversationId: 'conv-001',
      sender: 'SGI_SUPPORT',
      senderName: 'SGI Boom Support Client',
      text: 'Bonjour M. Koné, bienvenue sur Boom BRVM. Notre équipe de négociation est à votre disposition de 08h30 à 16h30 GMT.',
      timestamp: Date.now() - 86400000 * 2,
      read: true,
    },
    {
      id: 'msg-002',
      conversationId: 'conv-001',
      sender: 'INVESTOR',
      senderName: CURRENT_INVESTOR.name,
      text: 'Bonjour, j\'ai soumis mes documents KYC pour vérification. Quel est le délai d\'approbation pour pouvoir négocier sans restriction ?',
      timestamp: Date.now() - 7200000,
      read: true,
    },
    {
      id: 'msg-003',
      conversationId: 'conv-001',
      sender: 'SGI_SUPPORT',
      senderName: 'Conseiller SGI - Sarah Yao',
      text: 'Bonjour M. Koné, vos justificatifs sont actuellement en cours d\'examen par notre service Conformité AMF-UMOA. La validation prend généralement moins de 30 minutes pendant les heures ouvrables.',
      timestamp: Date.now() - 3600000,
      read: false,
    },
  ];

  private listeners: (() => void)[] = [];

  constructor() {
    this.seedRedisCache();
    this.startMarketTickerSimulation();
    this.syncWithBackend();
  }

  private async syncWithBackend() {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    const apiUrl = (import.meta.env?.VITE_API_URL as string) || `http://${window.location.hostname}:8000/api`;
    try {
      const [resQuotes, resPort, resCards, resOrders, resKyc] = await Promise.all([
        fetch(`${apiUrl}/quotes`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/portfolio`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/cards`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/orders`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/kyc`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (resQuotes && Array.isArray(resQuotes) && resQuotes.length > 0) this.quotes = resQuotes;
      if (resPort && resPort.cashBalanceXof !== undefined) this.portfolio = resPort;
      if (resCards && Array.isArray(resCards) && resCards.length > 0) this.userCards = resCards;
      if (resOrders && Array.isArray(resOrders)) this.orders = resOrders;
      if (resKyc && Array.isArray(resKyc) && resKyc.length > 0) this.kycRecords = resKyc;

      this.seedRedisCache();
      this.recalculatePortfolioValues();
      this.notify();
    } catch {
      // Backend not running yet, kept default state
    }
  }

  private seedRedisCache() {
    for (const q of this.quotes) {
      redisCache.set(`quote:${q.symbol}`, q, 120);
      redisCache.set(`orderbook:${q.symbol}`, { bids: q.bids, asks: q.asks }, 60);
    }
  }

  private startMarketTickerSimulation() {
    // Subtle real-time price tick simulation every 4 seconds
    setInterval(() => {
      const randomIndex = Math.floor(Math.random() * this.quotes.length);
      const stock = this.quotes[randomIndex];
      const deltaPercent = (Math.random() - 0.48) * 0.008; // -0.4% to +0.4%
      const priceDelta = Math.round(stock.price * deltaPercent);
      if (priceDelta === 0) return;

      const newPrice = Math.max(1, stock.price + priceDelta);
      stock.price = newPrice;
      stock.change = newPrice - stock.previousClose;
      stock.changePercent = Number(((stock.change / stock.previousClose) * 100).toFixed(2));
      stock.high = Math.max(stock.high, newPrice);
      stock.low = Math.min(stock.low, newPrice);
      stock.volume += Math.floor(Math.random() * 50) + 10;

      // Update bids and asks around new price
      const tick = stock.price > 1000 ? 50 : 1;
      stock.bids[0].price = newPrice - tick;
      stock.asks[0].price = newPrice;

      // Update Redis cache
      redisCache.set(`quote:${stock.symbol}`, stock, 60);
      redisCache.set(`orderbook:${stock.symbol}`, { bids: stock.bids, asks: stock.asks }, 30);

      // Recalculate portfolio current value
      this.recalculatePortfolioValues();

      // Emit WebSocket tick event
      wsBroker.publish('market:ticks', 'QUOTE_TICK', {
        symbol: stock.symbol,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        volume: stock.volume,
      });

      this.notify();
    }, 4000);
  }

  private recalculatePortfolioValues() {
    for (const pos of this.portfolio.positions) {
      const quote = this.quotes.find(q => q.symbol === pos.symbol);
      if (quote) {
        pos.currentPrice = quote.price;
        pos.currentValue = pos.shares * quote.price;
        pos.unrealizedPnL = pos.currentValue - pos.totalCost;
        pos.unrealizedPnLPercent = pos.totalCost > 0 ? Number(((pos.unrealizedPnL / pos.totalCost) * 100).toFixed(2)) : 0;
      }
    }
  }

  // --- Public Getters ---
  public getQuotes(): StockQuote[] {
    return this.quotes;
  }

  public updateQuotes(newQuotes: StockQuote[]): void {
    if (!newQuotes || newQuotes.length === 0) return;
    this.quotes = JSON.parse(JSON.stringify(newQuotes));
    this.seedRedisCache();
    this.recalculatePortfolioValues();
    wsBroker.publish('market:ticks', 'QUOTES_SYNCED', { count: this.quotes.length });
    this.notify();
  }

  public getQuote(symbol: string): StockQuote | undefined {
    // Check Redis first
    const cached = redisCache.get<StockQuote>(`quote:${symbol}`);
    if (cached) return cached;

    const live = this.quotes.find(q => q.symbol === symbol);
    if (live) {
      redisCache.set(`quote:${symbol}`, live, 60);
    }
    return live;
  }

  public getPortfolio(): UserPortfolio {
    return this.portfolio;
  }

  public getOrders(): TradeOrder[] {
    return this.orders;
  }

  public getKycRecords(): KycRecord[] {
    return this.kycRecords;
  }

  public getUserKyc(userId: string = CURRENT_INVESTOR.id): KycRecord | undefined {
    return this.kycRecords.find(k => k.userId === userId);
  }

  public getCurrentUser(): AuthUser {
    return this.currentUser;
  }

  public loginWithSocial(provider: AuthProvider, email: string, name?: string): AuthUser {
    const validated = validateSocialLogin(provider === 'APPLE' ? 'APPLE' : 'GOOGLE', email);
    this.currentUser = {
      id: CURRENT_INVESTOR.id,
      name: name || validated.name,
      email: validated.normalizedEmail,
      phone: CURRENT_INVESTOR.phone,
      provider,
      accountNumber: '042-8921-CI',
      sgiBrokerName: CURRENT_INVESTOR.sgiBrokerName,
      kycTier: 2,
      isLoggedIn: true,
    };

    securityService.recordAudit(`USER_SOCIAL_LOGIN_${provider}`, this.currentUser.id, 'INVESTOR', {
      email: this.currentUser.email,
      provider,
    });

    wsBroker.publish('auth:events', 'USER_LOGGED_IN', this.currentUser);
    this.notify();
    return this.currentUser;
  }

  public logoutUser(): void {
    this.currentUser.isLoggedIn = false;
    securityService.recordAudit('USER_LOGGED_OUT', this.currentUser.id, 'INVESTOR', {
      email: this.currentUser.email,
    });
    wsBroker.publish('auth:events', 'USER_LOGGED_OUT', { userId: this.currentUser.id });
    this.notify();
  }

  public getUserCards(): PaymentCard[] {
    return this.userCards;
  }

  public getCard(cardId: string): PaymentCard | undefined {
    return this.userCards.find(c => c.id === cardId);
  }

  public setDefaultCard(cardId: string): void {
    for (const card of this.userCards) {
      card.isDefault = card.id === cardId;
    }
    this.notify();
  }

  public deleteCard(cardId: string): void {
    this.userCards = this.userCards.filter(c => c.id !== cardId);
    if (this.userCards.length > 0 && !this.userCards.some(c => c.isDefault)) {
      this.userCards[0].isDefault = true;
    }
    this.notify();
  }

  public addCard(cardData: {
    cardholderName: string;
    cardNumber: string;
    expiryMonth: number;
    expiryYear: number;
    bankName: string;
    initialBalanceXof?: number;
  }): PaymentCard {
    const brand = detectCardBrand(cardData.cardNumber);
    const cleanDigits = cardData.cardNumber.replace(/\D/g, '');
    const last4 = cleanDigits.slice(-4) || '1234';
    const cardMasked = `${cleanDigits.slice(0, 4)} •••• •••• ${last4}`;

    const newCard: PaymentCard = {
      id: `card-${Date.now().toString(36)}`,
      userId: this.currentUser.id,
      cardholderName: cardData.cardholderName.toUpperCase().trim(),
      cardNumberLast4: last4,
      cardMasked,
      brand,
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
      isDefault: this.userCards.length === 0,
      bankName: cardData.bankName || (brand === 'VISA' ? 'Société Générale' : 'Ecobank'),
      balanceStatus: 'ACTIVE',
      availableCardBalanceXof: cardData.initialBalanceXof !== undefined ? cardData.initialBalanceXof : 500000,
      linkedAt: Date.now(),
    };

    this.userCards.push(newCard);

    securityService.recordAudit('PAYMENT_CARD_LINKED', this.currentUser.id, 'INVESTOR', {
      cardId: newCard.id,
      brand,
      bankName: newCard.bankName,
      last4,
    });

    this.notify();
    return newCard;
  }

  public rechargeWithCard(cardId: string, amountXof: number): {
    success: boolean;
    deposit?: DepositRecord;
    errorMessage?: string;
    canSwitchCard?: boolean;
    availableCardBalanceXof?: number;
  } {
    const kyc = this.getUserKyc();
    if (!kyc || kyc.status !== 'VERIFIED') {
      const statusMsg = !kyc
        ? "Veuillez soumettre votre dossier KYC (Pièce d'identité, Selfie et Signature)."
        : kyc.status === 'SUBMITTED'
        ? "Votre dossier KYC est en cours d'examen par la conformité SGI. Les dépôts seront débloqués dès validation."
        : "Votre dossier KYC a été rejeté ou nécessite des informations complémentaires.";

      return {
        success: false,
        errorMessage: `Dépôt refusé : Conformité AMF-UMOA non validée. ${statusMsg}`,
        canSwitchCard: false,
      };
    }

    const card = this.getCard(cardId);
    if (!card) {
      return { success: false, errorMessage: 'Carte bancaire introuvable', canSwitchCard: true };
    }

    const evaluation = evaluateCardRecharge(card, amountXof);
    if (!evaluation.success) {
      securityService.recordAudit('CARD_RECHARGE_FAILED', this.currentUser.id, 'INVESTOR', {
        cardId: card.id,
        brand: card.brand,
        last4: card.cardNumberLast4,
        errorCode: evaluation.errorCode,
        errorMessage: evaluation.errorMessage,
        amountXof,
      });

      return {
        success: false,
        errorMessage: evaluation.errorMessage,
        canSwitchCard: evaluation.canSwitchCard,
        availableCardBalanceXof: card.availableCardBalanceXof,
      };
    }

    // Debit card balance
    card.availableCardBalanceXof -= amountXof;
    // Credit trading cash balance
    this.portfolio.cashBalanceXof += amountXof;

    const deposit: DepositRecord = {
      id: `dep-card-${Date.now().toString(36)}`,
      userId: this.currentUser.id,
      investorName: this.currentUser.name,
      method: 'CREDIT_CARD',
      amountXof,
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

    this.deposits.unshift(deposit);

    securityService.recordAudit('CARD_RECHARGE_SUCCESS_3DS', this.currentUser.id, 'INVESTOR', {
      depositId: deposit.id,
      cardId: card.id,
      brand: card.brand,
      last4: card.cardNumberLast4,
      amountXof,
      auth3dSecureRef: evaluation.auth3dSecureRef,
    });

    wsBroker.publish('deposits:events', 'DEPOSIT_APPROVED', deposit);
    this.notify();

    return {
      success: true,
      deposit,
      availableCardBalanceXof: card.availableCardBalanceXof,
    };
  }

  public getDeposits(): DepositRecord[] {
    return this.deposits;
  }

  public getSupportMessages(): SupportMessage[] {
    return this.supportMessages;
  }

  // --- Trading Execution ---
  public executeOrder(params: {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    price?: number;
    mfaVerified: boolean;
    biometricVerified: boolean;
  }): { success: boolean; order?: TradeOrder; message?: string } {
    const quote = this.quotes.find(q => q.symbol === params.symbol);
    if (!quote) {
      return { success: false, message: 'Valeur mobilière introuvable sur la BRVM' };
    }

    const orderPrice = params.type === 'MARKET' ? quote.price : (params.price || quote.price);
    const fees = calculateTradingFees(params.quantity, orderPrice, params.side);

    // Balance & Holdings Verification
    if (params.side === 'BUY') {
      if (this.portfolio.cashBalanceXof < fees.netTotal) {
        return {
          success: false,
          message: `Solde espèces insuffisant. Requis: ${fees.netTotal.toLocaleString('fr-FR')} XOF, Disponible: ${this.portfolio.cashBalanceXof.toLocaleString('fr-FR')} XOF`,
        };
      }
    } else {
      const existingPos = this.portfolio.positions.find(p => p.symbol === params.symbol);
      if (!existingPos || existingPos.shares < params.quantity) {
        return {
          success: false,
          message: `Nombre de titres insuffisant. Disponible: ${existingPos?.shares || 0} titres, Demandé: ${params.quantity}`,
        };
      }
    }

    // Match against Order Book
    const matchResult = matchOrderAgainstBook(
      params.side,
      params.type,
      params.quantity,
      orderPrice,
      params.side === 'BUY' ? quote.asks : quote.bids
    );

    const isFilled = matchResult.filledQuantity === params.quantity;
    const executedPrice = matchResult.executedPrice > 0 ? matchResult.executedPrice : orderPrice;
    const actualFees = calculateTradingFees(params.quantity, executedPrice, params.side);

    const orderId = `ord-bm-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
    const timestamp = Date.now();

    const executionHash = generateExecutionHash({
      id: orderId,
      userId: CURRENT_INVESTOR.id,
      symbol: params.symbol,
      side: params.side,
      quantity: params.quantity,
      price: executedPrice,
      timestamp,
    });

    const encryptedPayload = securityService.encryptPayload({
      orderId,
      investor: CURRENT_INVESTOR.name,
      symbol: params.symbol,
      side: params.side,
      qty: params.quantity,
      price: executedPrice,
      fees: actualFees,
      broker: CURRENT_INVESTOR.sgiBrokerName,
    });

    const newOrder: TradeOrder = {
      id: orderId,
      userId: CURRENT_INVESTOR.id,
      investorName: CURRENT_INVESTOR.name,
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      quantity: params.quantity,
      price: executedPrice,
      filledQuantity: matchResult.filledQuantity,
      status: isFilled ? 'FILLED' : matchResult.filledQuantity > 0 ? 'PARTIALLY_FILLED' : 'PENDING',
      brvmFee: actualFees.brvmFee,
      crepmfFee: actualFees.crepmfFee,
      sgiFee: actualFees.sgiFee,
      totalCostXof: actualFees.netTotal,
      timestamp,
      executionHash,
      encryptedPayload,
      mfaVerified: params.mfaVerified,
      biometricVerified: params.biometricVerified,
    };

    // Update balances & portfolio atomically
    if (params.side === 'BUY') {
      this.portfolio.cashBalanceXof -= actualFees.netTotal;
      const existingPos = this.portfolio.positions.find(p => p.symbol === params.symbol);
      const updatedPos = updatePositionAfterTrade(existingPos, params.symbol, 'BUY', params.quantity, executedPrice, quote.price);
      if (updatedPos) {
        if (existingPos) {
          Object.assign(existingPos, updatedPos);
        } else {
          this.portfolio.positions.push(updatedPos);
        }
      }
    } else {
      this.portfolio.cashBalanceXof += actualFees.netTotal;
      const existingPos = this.portfolio.positions.find(p => p.symbol === params.symbol);
      const updatedPos = updatePositionAfterTrade(existingPos, params.symbol, 'SELL', params.quantity, executedPrice, quote.price);
      if (updatedPos === null) {
        this.portfolio.positions = this.portfolio.positions.filter(p => p.symbol !== params.symbol);
      } else if (existingPos) {
        Object.assign(existingPos, updatedPos);
      }
    }

    this.orders.unshift(newOrder);

    // Invalidate Redis cache for quote and orderbook
    redisCache.delete(`quote:${params.symbol}`);
    redisCache.delete(`orderbook:${params.symbol}`);

    // Record immutable audit log
    securityService.recordAudit(
      `TRADE_ORDER_EXECUTED_${params.side}`,
      CURRENT_INVESTOR.id,
      'INVESTOR',
      {
        orderId,
        symbol: params.symbol,
        quantity: params.quantity,
        price: executedPrice,
        hash: executionHash,
      }
    );

    // Broadcast live WebSocket event to mobile app and SGI broker portal
    wsBroker.publish('orders:flow', 'ORDER_EXECUTED', newOrder);

    this.notify();
    return { success: true, order: newOrder };
  }

  // --- KYC Management ---
  public submitKyc(data: {
    fullName: string;
    idType: KycRecord['idType'];
    idNumber: string;
    nationality: string;
    dateOfBirth: string;
    residentialAddress: string;
    idFrontImage: string;
    idBackImage?: string;
    selfieImage: string;
    signatureDataUrl: string;
  }): KycRecord {
    const existing = this.kycRecords.find(k => k.userId === CURRENT_INVESTOR.id);
    const newRecord: KycRecord = {
      id: existing ? existing.id : `kyc-${Date.now().toString(36)}`,
      userId: CURRENT_INVESTOR.id,
      fullName: data.fullName,
      email: CURRENT_INVESTOR.email,
      phone: CURRENT_INVESTOR.phone,
      idType: data.idType,
      idNumber: data.idNumber,
      nationality: data.nationality,
      dateOfBirth: data.dateOfBirth,
      residentialAddress: data.residentialAddress,
      idFrontImage: data.idFrontImage,
      idBackImage: data.idBackImage,
      selfieImage: data.selfieImage,
      selfieConfidenceScore: 97.8,
      signatureDataUrl: data.signatureDataUrl,
      status: 'SUBMITTED',
      submissionDate: Date.now(),
    };

    if (existing) {
      Object.assign(existing, newRecord);
    } else {
      this.kycRecords.unshift(newRecord);
    }

    securityService.recordAudit('KYC_SUBMISSION_RECEIVED', CURRENT_INVESTOR.id, 'INVESTOR', {
      kycId: newRecord.id,
      idType: newRecord.idType,
      idNumber: newRecord.idNumber,
    });

    wsBroker.publish('kyc:events', 'KYC_SUBMITTED', newRecord);
    this.notify();
    return newRecord;
  }

  public reviewKyc(
    kycId: string,
    action: 'VERIFIED' | 'REJECTED' | 'INFO_REQUESTED',
    reviewedBy: string = 'SGI Broker Officer',
    rejectionReason?: string
  ): KycRecord | null {
    const record = this.kycRecords.find(k => k.id === kycId);
    if (!record) return null;

    record.status = action;
    record.reviewedDate = Date.now();
    record.reviewedBy = reviewedBy;
    if (rejectionReason) {
      record.rejectionReason = rejectionReason;
    }

    securityService.recordAudit(`KYC_STATUS_UPDATED_${action}`, reviewedBy, 'SGI_ADMIN', {
      kycId,
      status: action,
      rejectionReason,
    });

    wsBroker.publish('kyc:events', 'KYC_STATUS_UPDATED', record);
    this.notify();
    return record;
  }

  // --- Deposit & Settlement ---
  public submitDeposit(method: DepositRecord['method'], amountXof: number, phoneNumber?: string): DepositRecord {
    const newDeposit: DepositRecord = {
      id: `dep-${Date.now().toString(36)}`,
      userId: CURRENT_INVESTOR.id,
      investorName: CURRENT_INVESTOR.name,
      method,
      amountXof,
      phoneNumber: phoneNumber || CURRENT_INVESTOR.phone,
      referenceCode: `${method.substring(0, 3)}-${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: 'PENDING',
      timestamp: Date.now(),
    };

    this.deposits.unshift(newDeposit);
    wsBroker.publish('deposits:events', 'DEPOSIT_REQUESTED', newDeposit);
    this.notify();
    return newDeposit;
  }

  public approveDeposit(depositId: string, approvedBy: string = 'SGI Treasury Desk'): DepositRecord | null {
    const deposit = this.deposits.find(d => d.id === depositId);
    if (!deposit || deposit.status === 'APPROVED') return null;

    deposit.status = 'APPROVED';
    deposit.approvedAt = Date.now();

    // Credit investor balance
    this.portfolio.cashBalanceXof += deposit.amountXof;

    securityService.recordAudit('DEPOSIT_SETTLEMENT_APPROVED', approvedBy, 'SGI_ADMIN', {
      depositId,
      amountXof: deposit.amountXof,
      method: deposit.method,
      investor: deposit.investorName,
    });

    wsBroker.publish('deposits:events', 'DEPOSIT_APPROVED', deposit);
    this.notify();
    return deposit;
  }

  // --- Client Messaging Support ---
  public sendSupportMessage(sender: 'INVESTOR' | 'SGI_SUPPORT', text: string): SupportMessage {
    const msg: SupportMessage = {
      id: `msg-${Date.now().toString(36)}`,
      conversationId: 'conv-001',
      sender,
      senderName: sender === 'INVESTOR' ? CURRENT_INVESTOR.name : 'SGI Boom Support Desk',
      text,
      timestamp: Date.now(),
      read: false,
    };

    this.supportMessages.push(msg);
    wsBroker.publish('support:chat', 'MESSAGE_SENT', msg);
    this.notify();
    return msg;
  }

  // --- Subscription ---
  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    for (const cb of this.listeners) {
      try {
        cb();
      } catch (e) {
        // silent
      }
    }
  }
}

export const dbEngine = new CentralDatabaseEngine();
