/**
 * Boom - BRVM Stock Investment Platform
 * Types for Mobile App, SGI Admin Portal, and Microservices Engine
 */

export type StockSector = 'Telecom' | 'Banking & Finance' | 'Agriculture' | 'Industry' | 'Energy & Utilities' | 'Distribution';

export interface OrderBookEntry {
  price: number;
  quantity: number;
  ordersCount: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  country: string; // CI, SN, TG, BF, etc.
  sector: StockSector;
  price: number; // in XOF (FCFA)
  change: number; // price difference
  changePercent: number; // percentage
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number; // in Millions XOF
  peRatio: number;
  dividendYield: number; // percentage
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  chartData: { time: string; price: number; volume: number }[];
}

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT';
export type OrderStatus = 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED';

export interface TradeOrder {
  id: string;
  userId: string;
  investorName: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number; // target price for LIMIT, or executed price for MARKET
  filledQuantity: number;
  status: OrderStatus;
  brvmFee: number; // 0.20%
  crepmfFee: number; // 0.10% AMF-UMOA
  sgiFee: number; // 0.50% SGI Brokerage commission
  totalCostXof: number;
  timestamp: number;
  executionHash: string; // SHA-256 verification hash
  encryptedPayload: string; // E2E encrypted audit record
  mfaVerified: boolean;
  biometricVerified: boolean;
}

export interface PortfolioPosition {
  symbol: string;
  shares: number;
  averageBuyPrice: number; // XOF
  currentPrice: number; // XOF
  totalCost: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface UserPortfolio {
  userId: string;
  cashBalanceXof: number;
  reservedCashXof: number; // Locked in pending buy orders
  positions: PortfolioPosition[];
}

export type KycStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'INFO_REQUESTED';
export type IdType = 'NATIONAL_ID' | 'PASSPORT' | 'RESIDENCE_PERMIT';

export interface KycRecord {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  idType: IdType;
  idNumber: string;
  nationality: string;
  dateOfBirth: string;
  residentialAddress: string;
  idFrontImage: string;
  idBackImage?: string;
  selfieImage: string;
  selfieConfidenceScore: number; // 0-100%
  signatureDataUrl: string;
  status: KycStatus;
  submissionDate: number;
  reviewedDate?: number;
  reviewedBy?: string;
  rejectionReason?: string;
}

export type CardBrand = 'VISA' | 'MASTERCARD' | 'GIM_UEMOA';
export type CardStatus = 'ACTIVE' | 'NEEDS_RECHARGE' | 'EXPIRED';

export interface PaymentCard {
  id: string;
  userId: string;
  cardholderName: string;
  cardNumberLast4: string;
  cardMasked: string; // e.g. "•••• •••• •••• 4242"
  brand: CardBrand;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  bankName: string; // e.g. "Société Générale CI", "Ecobank", "BOA", "Coris Bank"
  balanceStatus: CardStatus;
  availableCardBalanceXof: number; // Simulated card account balance
  linkedAt: number;
}

export type AuthProvider = 'GOOGLE' | 'APPLE' | 'EMAIL' | 'GUEST';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  provider: AuthProvider;
  avatarUrl?: string;
  accountNumber: string;
  sgiBrokerName: string;
  kycTier: number; // 1 = Standard, 2 = Premium, 3 = Institutionnel
  isLoggedIn: boolean;
}

export type DepositMethod = 'CREDIT_CARD' | 'WAVE' | 'MTN_MOMO' | 'MOOV_MONEY' | 'BANK_WIRE';
export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DepositRecord {
  id: string;
  userId: string;
  investorName: string;
  method: DepositMethod;
  amountXof: number;
  phoneNumber?: string;
  referenceCode: string;
  status: DepositStatus;
  timestamp: number;
  approvedAt?: number;
  cardId?: string;
  cardLast4?: string;
  cardBrand?: CardBrand;
  cardBank?: string;
  auth3dSecureRef?: string;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  sender: 'INVESTOR' | 'SGI_SUPPORT';
  senderName: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: string;
  actorId: string;
  actorRole: 'INVESTOR' | 'SGI_ADMIN' | 'ENGINE_MATCHER' | 'SYSTEM';
  ipAddress: string;
  status: 'SUCCESS' | 'FAILED' | 'FLAGGED';
  payloadHash: string;
  encryptedDetails: string;
}

export interface RedisCacheStats {
  hits: number;
  misses: number;
  keyCount: number;
  memoryUsedKb: number;
  lastEviction: string;
  cachedQuotesCount: number;
}

export interface MicroserviceHealth {
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'STANDBY';
  latencyMs: number;
  uptimePercent: number;
  requestsPerSec: number;
  description: string;
}
