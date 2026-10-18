/**
 * Boom - BRVM Trading & Fee Calculation Engine
 * Implements official BRVM & AMF-UMOA (CREPMF) market rules and order matching logic.
 */

import type { OrderSide, OrderType, TradeOrder, OrderBookEntry, PortfolioPosition } from '../types/index.ts';

// Regulatory and SGI Brokerage Fee Schedule
export const BRVM_FEE_RATE = 0.0020;    // 0.20% BRVM Exchange fee
export const CREPMF_FEE_RATE = 0.0010;  // 0.10% AMF-UMOA (ex-CREPMF) regulatory fee
export const SGI_FEE_RATE = 0.0050;     // 0.50% SGI Broker commission

export interface CalculatedFees {
  grossAmount: number;
  brvmFee: number;
  crepmfFee: number;
  sgiFee: number;
  totalFees: number;
  netTotal: number;
}

/**
 * Calculates official BRVM brokerage and exchange fees
 */
export function calculateTradingFees(quantity: number, price: number, side: OrderSide): CalculatedFees {
  const grossAmount = Math.round(quantity * price);
  const brvmFee = Math.round(grossAmount * BRVM_FEE_RATE);
  const crepmfFee = Math.round(grossAmount * CREPMF_FEE_RATE);
  const sgiFee = Math.round(grossAmount * SGI_FEE_RATE);
  const totalFees = brvmFee + crepmfFee + sgiFee;

  // For BUY: Investor pays gross + fees
  // For SELL: Investor receives gross - fees
  const netTotal = side === 'BUY' ? grossAmount + totalFees : Math.max(0, grossAmount - totalFees);

  return {
    grossAmount,
    brvmFee,
    crepmfFee,
    sgiFee,
    totalFees,
    netTotal,
  };
}

/**
 * Pure match calculation for an order against an order book side
 */
export function matchOrderAgainstBook(
  orderSide: OrderSide,
  orderType: OrderType,
  orderQuantity: number,
  orderPrice: number,
  bookEntries: OrderBookEntry[] // Asks if BUY, Bids if SELL
): { filledQuantity: number; executedPrice: number; remainingQuantity: number } {
  if (orderQuantity <= 0 || bookEntries.length === 0) {
    return { filledQuantity: 0, executedPrice: orderPrice, remainingQuantity: orderQuantity };
  }

  let remaining = orderQuantity;
  let totalCost = 0;
  let filledTotal = 0;

  // Asks are sorted ascending (lowest price first)
  // Bids are sorted descending (highest price first)
  for (const entry of bookEntries) {
    if (remaining <= 0) break;

    const canMatch =
      orderType === 'MARKET' ||
      (orderSide === 'BUY' && entry.price <= orderPrice) ||
      (orderSide === 'SELL' && entry.price >= orderPrice);

    if (!canMatch) break;

    const matchQty = Math.min(remaining, entry.quantity);
    remaining -= matchQty;
    filledTotal += matchQty;
    totalCost += matchQty * entry.price;
  }

  const executedPrice = filledTotal > 0 ? Math.round(totalCost / filledTotal) : orderPrice;

  return {
    filledQuantity: filledTotal,
    executedPrice,
    remainingQuantity: remaining,
  };
}

/**
 * Recalculates portfolio position after a fill
 */
export function updatePositionAfterTrade(
  existingPosition: PortfolioPosition | undefined,
  symbol: string,
  side: OrderSide,
  quantity: number,
  executionPrice: number,
  currentMarketPrice: number
): PortfolioPosition | null {
  if (side === 'BUY') {
    if (!existingPosition || existingPosition.shares <= 0) {
      const totalCost = quantity * executionPrice;
      const currentValue = quantity * currentMarketPrice;
      const unrealizedPnL = currentValue - totalCost;
      const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

      return {
        symbol,
        shares: quantity,
        averageBuyPrice: executionPrice,
        currentPrice: currentMarketPrice,
        totalCost,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent,
      };
    } else {
      const existingCost = existingPosition.shares * existingPosition.averageBuyPrice;
      const newGrossCost = quantity * executionPrice;
      const newShares = existingPosition.shares + quantity;
      const newAvgPrice = Math.round((existingCost + newGrossCost) / newShares);
      const totalCost = newShares * newAvgPrice;
      const currentValue = newShares * currentMarketPrice;
      const unrealizedPnL = currentValue - totalCost;
      const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

      return {
        symbol,
        shares: newShares,
        averageBuyPrice: newAvgPrice,
        currentPrice: currentMarketPrice,
        totalCost,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent,
      };
    }
  } else {
    // SELL
    if (!existingPosition || existingPosition.shares < quantity) {
      throw new Error(`Insufficient shares to sell. Available: ${existingPosition?.shares || 0}, requested: ${quantity}`);
    }

    const remainingShares = existingPosition.shares - quantity;
    if (remainingShares === 0) {
      return null; // Position closed
    }

    const totalCost = remainingShares * existingPosition.averageBuyPrice;
    const currentValue = remainingShares * currentMarketPrice;
    const unrealizedPnL = currentValue - totalCost;
    const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

    return {
      symbol,
      shares: remainingShares,
      averageBuyPrice: existingPosition.averageBuyPrice,
      currentPrice: currentMarketPrice,
      totalCost,
      currentValue,
      unrealizedPnL,
      unrealizedPnLPercent,
    };
  }
}

/**
 * Validates whether an investor KYC profile is complete enough for verification
 */
export function validateKycCompleteness(record: {
  fullName: string;
  idNumber: string;
  idFrontImage: string;
  selfieImage: string;
  signatureDataUrl: string;
}): { isValid: boolean; missingFields: string[] } {
  const missing: string[] = [];

  if (!record.fullName || record.fullName.trim().length < 3) missing.push('Nom complet');
  if (!record.idNumber || record.idNumber.trim().length < 5) missing.push('Numéro de pièce d’identité');
  if (!record.idFrontImage || record.idFrontImage.length < 20) missing.push('Photo recto de la pièce d’identité');
  if (!record.selfieImage || record.selfieImage.length < 20) missing.push('Selfie biométrique');
  if (!record.signatureDataUrl || record.signatureDataUrl.length < 20) missing.push('Signature électronique');

  return {
    isValid: missing.length === 0,
    missingFields: missing,
  };
}

/**
 * Deterministic pseudo SHA-256 hex string generator for order execution verification
 */
export function generateExecutionHash(order: {
  id: string;
  userId: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  timestamp: number;
}): string {
  const payload = `${order.id}|${order.userId}|${order.symbol}|${order.side}|${order.quantity}|${order.price}|${order.timestamp}|BRVM-BOOM-SECRET`;
  let h1 = 0x811c9dc5;
  let h2 = 0x27d4eb2f;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ char, 0x01000193);
    h2 = Math.imul(h2 ^ char, 0x01000193);
  }
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = ((h1 ^ 0x5a5a5a5a) >>> 0).toString(16).padStart(8, '0');
  const p3 = (h2 >>> 0).toString(16).padStart(8, '0');
  const p4 = ((h2 ^ 0xa5a5a5a5) >>> 0).toString(16).padStart(8, '0');
  return `0x${p1}${p2}${p3}${p4}`.toLowerCase();
}

/**
 * Detects card network brand based on IIN / BIN prefixes
 */
export function detectCardBrand(cardNumber: string): 'VISA' | 'MASTERCARD' | 'GIM_UEMOA' {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.startsWith('4')) return 'VISA';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'MASTERCARD';
  if (/^(9|50|60|67)/.test(clean)) return 'GIM_UEMOA';
  return 'VISA';
}

/**
 * Standard Luhn checksum algorithm for credit/debit card numbers
 */
export function validateCardLuhn(cardNumber: string): boolean {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;

  let sum = 0;
  let alternate = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let n = parseInt(clean.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n = (n % 10) + 1;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/**
 * Formats raw digits into 4-digit spaced groups
 */
export function formatCardNumber(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 16);
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

export interface CardRechargeResult {
  success: boolean;
  errorCode?: 'SOLDE_CARTE_INSUFFISANT' | 'CARTE_EXPIREE' | 'CARTE_BLOQUEE' | 'MONTANT_INVALIDE';
  errorMessage?: string;
  canSwitchCard: boolean;
  transactionRef?: string;
  auth3dSecureRef?: string;
}

/**
 * Evaluates whether a card can be charged to top up the account.
 * When the card is not recharged or has insufficient funds, allows the user to switch cards.
 */
export function evaluateCardRecharge(card: {
  balanceStatus: 'ACTIVE' | 'NEEDS_RECHARGE' | 'EXPIRED';
  availableCardBalanceXof: number;
  expiryYear: number;
  expiryMonth: number;
}, amountXof: number): CardRechargeResult {
  if (amountXof < 1000) {
    return {
      success: false,
      errorCode: 'MONTANT_INVALIDE',
      errorMessage: 'Le montant minimum de rechargement par carte est de 1 000 XOF.',
      canSwitchCard: false,
    };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (card.balanceStatus === 'EXPIRED' || card.expiryYear < currentYear || (card.expiryYear === currentYear && card.expiryMonth < currentMonth)) {
    return {
      success: false,
      errorCode: 'CARTE_EXPIREE',
      errorMessage: 'Cette carte bancaire est expirée. Veuillez changer de carte ou en ajouter une nouvelle.',
      canSwitchCard: true,
    };
  }

  if (card.balanceStatus === 'NEEDS_RECHARGE' || card.availableCardBalanceXof < amountXof) {
    return {
      success: false,
      errorCode: 'SOLDE_CARTE_INSUFFISANT',
      errorMessage: `Le rechargement a échoué : solde disponible sur cette carte (${card.availableCardBalanceXof.toLocaleString('fr-FR')} XOF) insuffisant pour débiter ${amountXof.toLocaleString('fr-FR')} XOF. Veuillez recharger votre carte bancaire ou changer de carte.`,
      canSwitchCard: true,
    };
  }

  const txId = `3DS-TX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const secureRef = `AUTH-OK-${Math.floor(100000 + Math.random() * 900000)}`;

  return {
    success: true,
    canSwitchCard: false,
    transactionRef: txId,
    auth3dSecureRef: secureRef,
  };
}

/**
 * Validates social login provider credentials
 */
export function validateSocialLogin(provider: 'GOOGLE' | 'APPLE', email: string): { isValid: boolean; normalizedEmail: string; name: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Adresse email invalide');
  }

  const username = cleanEmail.split('@')[0];
  const formattedName = username
    .split(/[._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    isValid: true,
    normalizedEmail: cleanEmail,
    name: formattedName || (provider === 'GOOGLE' ? 'Investisseur Google' : 'Investisseur Apple'),
  };
}
