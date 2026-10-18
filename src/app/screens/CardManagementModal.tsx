import React, { useState } from 'react';
import type { SavedCreditCard, CardBrand } from '../../types/index.ts';
import { CardVisualizer } from '../components/CardVisualizer.tsx';
import { dbEngine, CURRENT_INVESTOR } from '../../services/mockDatabase.ts';
import {
  detectCardBrand,
  formatCardNumber,
  validateCreditCard,
} from '../../services/tradingEngine.ts';
import {
  CreditCard,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  X,
  Lock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface CardManagementModalProps {
  savedCards: SavedCreditCard[];
  initialAmount?: number;
  initialTab?: 'RECHARGE' | 'CONNECT_CARD' | 'MANAGE';
  onClose: () => void;
  onSuccessRecharge?: (amount: number) => void;
  onNavigateToMarket?: () => void;
}

export const CardManagementModal: React.FC<CardManagementModalProps> = ({
  savedCards,
  initialAmount = 250000,
  initialTab = 'RECHARGE',
  onClose,
  onSuccessRecharge,
  onNavigateToMarket,
}) => {
  const [activeTab, setActiveTab] = useState<'RECHARGE' | 'CONNECT_CARD' | 'MANAGE'>(initialTab);

  // Recharge state
  const [selectedCardId, setSelectedCardId] = useState<string>(
    savedCards.find(c => c.isDefault)?.id || savedCards[0]?.id || 'NEW'
  );
  const [amount, setAmount] = useState<number>(initialAmount);

  // New card input state
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState(CURRENT_INVESTOR.name);
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saveForFuture, setSaveForFuture] = useState(true);

  // 3D-Secure simulation state
  const [isProcessing3DSecure, setIsProcessing3DSecure] = useState(false);
  const [threeDSecureStep, setThreeDSecureStep] = useState<'IDLE' | 'OTP_CHALLENGE' | 'SUCCESS'>('IDLE');
  const [otpCode, setOtpCode] = useState('889922');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rechargeSuccessAmount, setRechargeSuccessAmount] = useState<number>(0);

  const selectedCard = savedCards.find(c => c.id === selectedCardId);
  const brandDetected: CardBrand = detectCardBrand(cardNumber.replace(/\D/g, ''));

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 16);
    setCardNumber(formatCardNumber(raw));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (clean.length > 2) {
      clean = `${clean.substring(0, 2)}/${clean.substring(2)}`;
    }
    setExpiry(clean);
  };

  const handleConnectNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateCreditCard({
      cardNumber,
      cardholderName,
      expiry,
      cvv,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.errors[0]);
      return;
    }

    const created = dbEngine.addCreditCard({
      cardNumber,
      cardholderName,
      expiry,
      cvv,
      isDefault,
    });

    setSelectedCardId(created.id);
    setActiveTab('RECHARGE');
    // Clear inputs
    setCardNumber('');
    setCvv('');
    setExpiry('');
  };

  const handleStartRecharge = () => {
    setErrorMessage(null);
    if (amount <= 0) {
      setErrorMessage('Veuillez sélectionner un montant valide à recharger');
      return;
    }

    if (selectedCardId === 'NEW') {
      const validation = validateCreditCard({
        cardNumber,
        cardholderName,
        expiry,
        cvv,
      });
      if (!validation.isValid) {
        setErrorMessage(validation.errors[0]);
        return;
      }
    }

    // Trigger 3D-Secure challenge
    setIsProcessing3DSecure(true);
    setThreeDSecureStep('OTP_CHALLENGE');
  };

  const handleVerify3DSecure = () => {
    setIsProcessing3DSecure(false);

    if (selectedCardId === 'NEW') {
      const result = dbEngine.rechargeWithCard({
        cardData: {
          cardNumber,
          cardholderName,
          expiry,
          cvv,
          saveCard: saveForFuture,
        },
        amountXof: amount,
      });
      if (result.success) {
        setRechargeSuccessAmount(amount);
        setThreeDSecureStep('SUCCESS');
        if (onSuccessRecharge) onSuccessRecharge(amount);
      }
    } else {
      const result = dbEngine.rechargeWithCard({
        cardId: selectedCardId,
        amountXof: amount,
      });
      if (result.success) {
        setRechargeSuccessAmount(amount);
        setThreeDSecureStep('SUCCESS');
        if (onSuccessRecharge) onSuccessRecharge(amount);
      }
    }
  };

  const handleDeleteCard = (cardId: string) => {
    dbEngine.removeCreditCard(cardId);
    if (selectedCardId === cardId) {
      setSelectedCardId(savedCards[0]?.id || 'NEW');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-[420px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Cartes de Crédit & Rechargement</h2>
              <p className="text-[11px] text-slate-400">Paiement Sécurisé PCI-DSS · AMF-UMOA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-4 pt-3">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('RECHARGE')}
              className={`py-1.5 font-semibold rounded-lg transition-colors ${
                activeTab === 'RECHARGE' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Recharger
            </button>
            <button
              onClick={() => setActiveTab('CONNECT_CARD')}
              className={`py-1.5 font-semibold rounded-lg transition-colors ${
                activeTab === 'CONNECT_CARD' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              + Connecter
            </button>
            <button
              onClick={() => setActiveTab('MANAGE')}
              className={`py-1.5 font-semibold rounded-lg transition-colors ${
                activeTab === 'MANAGE' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mes Cartes ({savedCards.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Recharge with Card */}
        {activeTab === 'RECHARGE' && (
          <div className="p-4 space-y-4 flex-1">
            {/* Card Visualizer Preview */}
            {selectedCardId !== 'NEW' && selectedCard ? (
              <CardVisualizer
                brand={selectedCard.brand}
                cardNumber={`•••• •••• •••• ${selectedCard.last4}`}
                cardholderName={selectedCard.cardholderName}
                expiry={`${selectedCard.expiryMonth}/${selectedCard.expiryYear}`}
                isDefault={selectedCard.isDefault}
              />
            ) : (
              <CardVisualizer
                brand={brandDetected}
                cardNumber={cardNumber || '•••• •••• •••• 1234'}
                cardholderName={cardholderName || 'AMADOU KONE'}
                expiry={expiry || '12/28'}
              />
            )}

            {/* Saved Card Selector dropdown */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Carte de débit / crédit à débiter :
              </label>
              <select
                value={selectedCardId}
                onChange={e => setSelectedCardId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              >
                {savedCards.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.brand} •••• {c.last4} ({c.cardholderName}) {c.isDefault ? '· Défaut' : ''}
                  </option>
                ))}
                <option value="NEW">+ Utiliser une nouvelle carte de crédit...</option>
              </select>
            </div>

            {/* If user picked "NEW", render quick card input fields */}
            {selectedCardId === 'NEW' && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Saisir les coordonnées de la nouvelle carte</span>
                </div>
                <div>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="Numéro de carte (16 chiffres)"
                    maxLength={19}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/AA"
                    maxLength={5}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="password"
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                    placeholder="CVV (3 chiffres)"
                    maxLength={4}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={saveForFuture}
                    onChange={e => setSaveForFuture(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Enregistrer cette carte pour mes prochains rechargements</span>
                </label>
              </div>
            )}

            {/* Amount to Recharge */}
            <div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                <span>Montant à créditer sur le compte</span>
                <span className="text-amber-400 font-semibold">0% de commission carte</span>
              </div>
              <input
                type="number"
                min="5000"
                step="5000"
                value={amount}
                onChange={e => setAmount(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base font-bold font-mono text-white focus:outline-none focus:border-amber-400"
              />
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[50000, 100000, 250000, 500000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="py-1.5 text-[10px] font-mono font-semibold rounded-lg bg-slate-950 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                  >
                    {(val / 1000).toLocaleString('fr-FR')}k F
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Security Notice */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Protocole 3D-Secure (Verified by Visa & Mastercard Identity Check). Les fonds sont crédités instantanément pour l'achat de titres sur la BRVM.
              </span>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleStartRecharge}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Recharger {amount.toLocaleString('fr-FR')} XOF par Carte</span>
            </button>
          </div>
        )}

        {/* Tab 2: Connect New Card */}
        {activeTab === 'CONNECT_CARD' && (
          <form onSubmit={handleConnectNewCard} className="p-4 space-y-4 flex-1">
            <CardVisualizer
              brand={brandDetected}
              cardNumber={cardNumber || '•••• •••• •••• 1234'}
              cardholderName={cardholderName || 'AMADOU KONE'}
              expiry={expiry || '12/28'}
              isDefault={isDefault}
            />

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Numéro de Carte de Crédit / Débit (16 chiffres)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4000 1234 5678 9010"
                    maxLength={19}
                    className="w-full pl-3 pr-20 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {brandDetected}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Nom sur la Carte (Cardholder Name)
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={e => setCardholderName(e.target.value.toUpperCase())}
                  placeholder="EX: AMADOU KONE"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase font-sans placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Date d'Expiration</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/AA"
                    maxLength={5}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Cryptogramme (CVV)</label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>Définir comme carte bancaire principale</span>
              </label>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Enregistrer & Connecter la Carte</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Manage Saved Cards */}
        {activeTab === 'MANAGE' && (
          <div className="p-4 space-y-3 flex-1">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
              <span>Cartes Connectées ({savedCards.length})</span>
              <button
                onClick={() => setActiveTab('CONNECT_CARD')}
                className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {savedCards.map(c => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-mono text-[10px] font-bold text-amber-400">
                      {c.brand}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>•••• •••• •••• {c.last4}</span>
                        {c.isDefault && (
                          <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 font-sans">
                            Défaut
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {c.cardholderName} · Exp: {c.expiryMonth}/{c.expiryYear}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedCardId(c.id);
                        setActiveTab('RECHARGE');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold"
                    >
                      Recharger
                    </button>
                    {savedCards.length > 1 && (
                      <button
                        onClick={() => handleDeleteCard(c.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Supprimer cette carte"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3">
              <button
                onClick={() => setActiveTab('CONNECT_CARD')}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-amber-400 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Connecter une autre Carte Bancaire</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3D-Secure Simulation Modal */}
      {isProcessing3DSecure && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">Vérification 3D-Secure</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Authentification bancaire requise pour le débit de {amount.toLocaleString('fr-FR')} XOF.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-left space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Commerçant</span>
                <span className="text-white font-semibold">SGI Boom Capital BRVM</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Montant Net</span>
                <span className="text-emerald-400 font-bold">{amount.toLocaleString('fr-FR')} XOF</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 block">Code de confirmation SMS reçu :</label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                className="w-32 mx-auto text-center font-mono font-bold text-lg tracking-widest py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={handleVerify3DSecure}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
            >
              Confirmer le Paiement
            </button>
          </div>
        </div>
      )}

      {/* Success Modal with Immediate Action to Buy Stocks */}
      {threeDSecureStep === 'SUCCESS' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Rechargement Effectué !</h3>
              <p className="text-xs text-slate-400 mt-1">
                Votre compte a été crédité de{' '}
                <strong className="text-emerald-400 font-mono">
                  {rechargeSuccessAmount.toLocaleString('fr-FR')} XOF
                </strong>
                .
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-left space-y-1">
              <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                <span>Nouveau Solde Espèces</span>
                <span className="text-white font-bold">
                  {dbEngine.getPortfolio().cashBalanceXof.toLocaleString('fr-FR')} XOF
                </span>
              </div>
              <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                <span>Valeur Totale du Compte</span>
                <span className="text-amber-400 font-bold">
                  {(
                    dbEngine.getPortfolio().cashBalanceXof +
                    dbEngine
                      .getPortfolio()
                      .positions.reduce((acc, p) => acc + p.currentValue, 0)
                  ).toLocaleString('fr-FR')}{' '}
                  XOF
                </span>
              </div>
            </div>

            {/* Direct CTA: Acheter des actions BRVM */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setThreeDSecureStep('IDLE');
                  onClose();
                  if (onNavigateToMarket) onNavigateToMarket();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Acheter des Actions BRVM Maintenant</span>
              </button>

              <button
                onClick={() => {
                  setThreeDSecureStep('IDLE');
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
              >
                Retour au Portefeuille
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
