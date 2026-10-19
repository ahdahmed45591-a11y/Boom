import test from 'node:test';
import assert from 'node:assert/strict';
import { dbEngine } from './mockDatabase.ts';
import { wsBroker } from './webSocketBroker.ts';
import { redisCache } from './redisCache.ts';

test('1. Android Mobile -> Backend & DB -> SGI Boom Capital (Flux Ordre de Bourse)', () => {
  let sgiReceivedOrder: any = null;

  // SGI Boom Capital écoute le flux d'ordres via le broker WebSocket
  const unsubSgi = wsBroker.subscribe('orders:flow', msg => {
    if (msg.event === 'ORDER_EXECUTED') {
      sgiReceivedOrder = msg.payload;
    }
  });

  // Mobile déclenche un ordre d'achat de 2 actions Sonatel (SNTS)
  const initialCash = dbEngine.getPortfolio().cashBalanceXof;
  const result = dbEngine.executeOrder({
    symbol: 'SNTS',
    side: 'BUY',
    type: 'MARKET',
    quantity: 2,
    mfaVerified: true,
    biometricVerified: true,
  });

  // Vérification Backend & Base de données
  assert.equal(result.success, true, 'Backend doit accepter et valider l\'ordre');
  assert.ok(result.order, 'Backend doit générer un ordre complet');
  assert.equal(result.order.symbol, 'SNTS');
  assert.equal(result.order.status, 'FILLED');
  assert.ok(result.order.executionHash.length > 0, 'Hash cryptographique SHA-256 généré');
  assert.ok(dbEngine.getPortfolio().cashBalanceXof < initialCash, 'Solde espèces débité du montant net');

  // Vérification Réception par SGI Boom Capital
  assert.ok(sgiReceivedOrder, 'SGI Boom Capital doit avoir reçu l\'ordre en temps réel');
  assert.equal(sgiReceivedOrder.id, result.order.id);
  assert.equal(sgiReceivedOrder.executionHash, result.order.executionHash);
  assert.equal(sgiReceivedOrder.sgiFee > 0, true, 'Commission SGI calculée et perçue');

  unsubSgi();
});

test('2. Android Mobile -> SGI Boom Capital -> Android Mobile (Flux KYC Biométrique)', () => {
  let sgiReceivedKyc: any = null;
  let mobileReceivedKycUpdate: any = null;

  // SGI écoute les dossiers soumis par les investisseurs mobiles
  const unsubSgiKyc = wsBroker.subscribe('kyc:events', msg => {
    if (msg.event === 'KYC_SUBMITTED') {
      sgiReceivedKyc = msg.payload;
    }
  });

  // Mobile écoute les décisions du Desk Conformité SGI
  const unsubMobileKyc = wsBroker.subscribe('kyc:events', msg => {
    if (msg.event === 'KYC_STATUS_UPDATED') {
      mobileReceivedKycUpdate = msg.payload;
    }
  });

  // Mobile soumet son dossier KYC
  const submittedKyc = dbEngine.submitKyc({
    fullName: 'Kouassi Yao',
    idType: 'NATIONAL_ID',
    idNumber: 'CI-2026-99120',
    nationality: 'Ivoirienne',
    dateOfBirth: '1992-05-14',
    residentialAddress: 'Cocody Riviera 3, Abidjan',
    idFrontImage: 'data:image/png;base64,mockIdFront',
    selfieImage: 'data:image/png;base64,mockSelfie',
    signatureDataUrl: 'data:image/png;base64,mockSignature',
  });

  // Backend valide la conformité
  assert.equal(submittedKyc.status, 'SUBMITTED');
  assert.ok(sgiReceivedKyc, 'SGI Desk Conformité a reçu la notification');
  assert.equal(sgiReceivedKyc.idNumber, 'CI-2026-99120');

  // SGI valide le dossier après inspection
  const reviewed = dbEngine.reviewKyc(submittedKyc.id, 'VERIFIED', 'Conformité SGI Boom Capital');
  assert.equal(reviewed?.status, 'VERIFIED');

  // Mobile reçoit la confirmation de validation
  assert.ok(mobileReceivedKycUpdate, 'Mobile a reçu l\'approbation du statut');
  assert.equal(mobileReceivedKycUpdate.status, 'VERIFIED');

  unsubSgiKyc();
  unsubMobileKyc();
});

test('3. Mobile -> Backend / Redis Cache -> SGI Règlement-Livraison (Flux Dépôt Espèces)', () => {
  let sgiReceivedDeposit: any = null;

  const unsubDep = wsBroker.subscribe('deposits:events', msg => {
    if (msg.event === 'DEPOSIT_APPROVED') {
      sgiReceivedDeposit = msg.payload;
    }
  });

  const cards = dbEngine.getUserCards();
  const defaultCard = cards[0];
  const cashBefore = dbEngine.getPortfolio().cashBalanceXof;

  // Mobile recharge son compte via carte bancaire
  const rechargeResult = dbEngine.rechargeWithCard(defaultCard.id, 50000);

  // Backend valide et crédite
  assert.equal(rechargeResult.success, true);
  assert.equal(dbEngine.getPortfolio().cashBalanceXof, cashBefore + 50000);

  // SGI Règlement-Livraison notifié
  assert.ok(sgiReceivedDeposit, 'SGI a reçu l\'accusé de règlement-livraison');
  assert.equal(sgiReceivedDeposit.amountXof, 50000);

  // Redis Cache synchronisé
  const stats = redisCache.getStats();
  assert.ok(stats.hits > 0, 'Redis Cache opérationnel et interrogeable');

  unsubDep();
  setTimeout(() => process.exit(0), 100);
});


