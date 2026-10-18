import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTradingFees,
  matchOrderAgainstBook,
  updatePositionAfterTrade,
  validateKycCompleteness,
  generateExecutionHash,
  BRVM_FEE_RATE,
  CREPMF_FEE_RATE,
  SGI_FEE_RATE,
} from './tradingEngine.ts';

test('Trading fee calculation applies BRVM, AMF-UMOA, and SGI rates correctly', () => {
  // 10 shares of Sonatel at 18,000 XOF = 180,000 XOF gross
  const fees = calculateTradingFees(10, 18000, 'BUY');

  assert.equal(fees.grossAmount, 180000);
  assert.equal(fees.brvmFee, Math.round(180000 * BRVM_FEE_RATE)); // 360 XOF
  assert.equal(fees.crepmfFee, Math.round(180000 * CREPMF_FEE_RATE)); // 180 XOF
  assert.equal(fees.sgiFee, Math.round(180000 * SGI_FEE_RATE)); // 900 XOF
  assert.equal(fees.totalFees, 360 + 180 + 900); // 1,440 XOF
  assert.equal(fees.netTotal, 180000 + 1440); // 181,440 XOF for BUY
});

test('Trading fee calculation deducts fees on SELL', () => {
  const fees = calculateTradingFees(5, 12000, 'SELL');
  const gross = 60000;
  assert.equal(fees.grossAmount, gross);
  assert.equal(fees.netTotal, gross - fees.totalFees);
});

test('Order matching against book executes matching quantity and price', () => {
  const asks = [
    { price: 18500, quantity: 5, ordersCount: 1 },
    { price: 18600, quantity: 10, ordersCount: 2 },
  ];

  // Limit buy at 18500 for 4 shares
  const result = matchOrderAgainstBook('BUY', 'LIMIT', 4, 18500, asks);
  assert.equal(result.filledQuantity, 4);
  assert.equal(result.remainingQuantity, 0);
  assert.equal(result.executedPrice, 18500);

  // Limit buy at 18400 (below lowest ask of 18500) -> should not match
  const noMatch = matchOrderAgainstBook('BUY', 'LIMIT', 5, 18400, asks);
  assert.equal(noMatch.filledQuantity, 0);
  assert.equal(noMatch.remainingQuantity, 5);

  // Market buy for 8 shares -> matches 5 at 18500 and 3 at 18600
  const marketBuy = matchOrderAgainstBook('BUY', 'MARKET', 8, 0, asks);
  assert.equal(marketBuy.filledQuantity, 8);
  assert.equal(marketBuy.remainingQuantity, 0);
  const expectedAvgPrice = Math.round((5 * 18500 + 3 * 18600) / 8);
  assert.equal(marketBuy.executedPrice, expectedAvgPrice);
});

test('Position calculation updates average buy price and unrealized PnL', () => {
  // First buy
  const pos1 = updatePositionAfterTrade(undefined, 'SNTS', 'BUY', 10, 18000, 18500);
  assert.ok(pos1);
  assert.equal(pos1.shares, 10);
  assert.equal(pos1.averageBuyPrice, 18000);
  assert.equal(pos1.currentValue, 185000);
  assert.equal(pos1.unrealizedPnL, 5000); // 185k - 180k
  assert.ok(pos1.unrealizedPnLPercent > 0);

  // Additional buy at higher price -> dollar cost averaging
  const pos2 = updatePositionAfterTrade(pos1, 'SNTS', 'BUY', 10, 19000, 19500);
  assert.ok(pos2);
  assert.equal(pos2.shares, 20);
  assert.equal(pos2.averageBuyPrice, 18500); // (180k + 190k) / 20 = 18.5k
  assert.equal(pos2.currentValue, 20 * 19500);

  // Partial sell of 5 shares
  const pos3 = updatePositionAfterTrade(pos2, 'SNTS', 'SELL', 5, 19500, 19500);
  assert.ok(pos3);
  assert.equal(pos3.shares, 15);
  assert.equal(pos3.averageBuyPrice, 18500);

  // Full sell of remaining 15 shares -> position closed
  const pos4 = updatePositionAfterTrade(pos3, 'SNTS', 'SELL', 15, 20000, 20000);
  assert.equal(pos4, null);
});

test('KYC validation correctly verifies completeness', () => {
  const incomplete = validateKycCompleteness({
    fullName: 'Amadou',
    idNumber: '',
    idFrontImage: '',
    selfieImage: '',
    signatureDataUrl: '',
  });
  assert.equal(incomplete.isValid, false);
  assert.ok(incomplete.missingFields.length > 0);

  const complete = validateKycCompleteness({
    fullName: 'Amadou Koné',
    idNumber: 'CI-2024-998811',
    idFrontImage: 'data:image/jpeg;base64,mockFrontImageContent1234567890',
    selfieImage: 'data:image/jpeg;base64,mockSelfieImageContent1234567890',
    signatureDataUrl: 'data:image/png;base64,mockSignatureImageContent1234567890',
  });
  assert.equal(complete.isValid, true);
  assert.equal(complete.missingFields.length, 0);
});

test('Execution hash produces unique, valid 32-character hex verification hash', () => {
  const hash1 = generateExecutionHash({
    id: 'ord-101',
    userId: 'usr-1',
    symbol: 'SNTS',
    side: 'BUY',
    quantity: 10,
    price: 18500,
    timestamp: 1729000000,
  });
  const hash2 = generateExecutionHash({
    id: 'ord-102',
    userId: 'usr-1',
    symbol: 'SNTS',
    side: 'BUY',
    quantity: 10,
    price: 18500,
    timestamp: 1729000001,
  });
  assert.ok(hash1.startsWith('0x'));
  assert.notEqual(hash1, hash2);
  assert.equal(hash1.length, 34); // '0x' + 32 hex chars
});

test('Card brand detection identifies Visa, Mastercard, and GIM-UEMOA correctly', async () => {
  const { detectCardBrand, validateCardLuhn } = await import('./tradingEngine.ts');
  assert.equal(detectCardBrand('4242 1234 5678 9012'), 'VISA');
  assert.equal(detectCardBrand('5399 1234 5678 9012'), 'MASTERCARD');
  assert.equal(detectCardBrand('2221 0000 0000 0000'), 'MASTERCARD');
  assert.equal(detectCardBrand('9000 1234 5678 9012'), 'GIM_UEMOA');
  assert.equal(detectCardBrand('6001 1234 5678 9012'), 'GIM_UEMOA');

  // Test Luhn validation with standard test numbers
  assert.equal(validateCardLuhn('4242 4242 4242 4242'), true);
  assert.equal(validateCardLuhn('4242 4242 4242 4241'), false);
});

test('Card recharge allows switching card when card is not recharged or has insufficient funds', async () => {
  const { evaluateCardRecharge } = await import('./tradingEngine.ts');

  // Case 1: Card has insufficient funds / needs recharge
  const lowCard = {
    balanceStatus: 'NEEDS_RECHARGE' as const,
    availableCardBalanceXof: 5000,
    expiryYear: 2028,
    expiryMonth: 12,
  };
  const resultLow = evaluateCardRecharge(lowCard, 50000);
  assert.equal(resultLow.success, false);
  assert.equal(resultLow.errorCode, 'SOLDE_CARTE_INSUFFISANT');
  assert.equal(resultLow.canSwitchCard, true); // User must be able to switch card!

  // Case 2: Card is expired
  const expiredCard = {
    balanceStatus: 'EXPIRED' as const,
    availableCardBalanceXof: 100000,
    expiryYear: 2023,
    expiryMonth: 1,
  };
  const resultExpired = evaluateCardRecharge(expiredCard, 20000);
  assert.equal(resultExpired.success, false);
  assert.equal(resultExpired.errorCode, 'CARTE_EXPIREE');
  assert.equal(resultExpired.canSwitchCard, true);

  // Case 3: Valid active card with sufficient funds
  const validCard = {
    balanceStatus: 'ACTIVE' as const,
    availableCardBalanceXof: 500000,
    expiryYear: 2028,
    expiryMonth: 10,
  };
  const resultOk = evaluateCardRecharge(validCard, 100000);
  assert.equal(resultOk.success, true);
  assert.ok(resultOk.transactionRef?.startsWith('3DS-TX-'));
  assert.ok(resultOk.auth3dSecureRef?.startsWith('AUTH-OK-'));
});

test('Social login validates Google and Apple accounts correctly', async () => {
  const { validateSocialLogin } = await import('./tradingEngine.ts');

  const googleLogin = validateSocialLogin('GOOGLE', 'baoufinance@gmail.com');
  assert.equal(googleLogin.isValid, true);
  assert.equal(googleLogin.normalizedEmail, 'baoufinance@gmail.com');
  assert.equal(googleLogin.name, 'Baoufinance');

  const appleLogin = validateSocialLogin('APPLE', 'amadou.kone@icloud.com');
  assert.equal(appleLogin.isValid, true);
  assert.equal(appleLogin.normalizedEmail, 'amadou.kone@icloud.com');
  assert.equal(appleLogin.name, 'Amadou Kone');

  assert.throws(() => validateSocialLogin('GOOGLE', 'invalid-email-string'));
});
