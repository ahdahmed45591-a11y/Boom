import React, { useState } from 'react';
import { dbEngine } from '../../services/mockDatabase.ts';
import type { PaymentCard, CardBrand } from '../../types/index.ts';
import { detectCardBrand, formatCardNumber, validateCardLuhn } from '../../services/tradingEngine.ts';
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  X,
  ShieldCheck,
  RefreshCw,
  Lock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface CardManagerModalProps {
  cards: PaymentCard[];
  onClose: () => void;
  onSelectBuyStocks?: () => void;
}

export const CardManagerModal: React.FC<CardManagerModalProps> = ({
  cards,
  onClose,
  onSelectBuyStocks,
}) => {
  const [activeCardId, setActiveCardId] = useState<string>(
    cards.find(c => c.isDefault)?.id || cards[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'RECHARGE' | 'CARDS_LIST' | 'ADD_CARD'>('RECHARGE');
  const [rechargeAmount, setRechargeAmount] = useState<number>(100000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rechargeResult, setRechargeResult] = useState<{
    success: boolean;
    message?: string;
    canSwitchCard?: boolean;
    auth3dSecureRef?: string;
  } | null>(null);

  // New Card Form State
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardholder, setNewCardholder] = useState('AMADOU KONE');
  const [newExpiryMonth, setNewExpiryMonth] = useState('12');
  const [newExpiryYear, setNewExpiryYear] = useState('2028');
  const [newCvv, setNewCvv] = useState('834');
  const [newBank, setNewBank] = useState('Société Générale CI');

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];

  const handleCardNumberChange = (val: string) => {
    setNewCardNumber(formatCardNumber(val));
  };

  const handleAddNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber || newCardNumber.replace(/\D/g, '').length < 13) return;

    const created = dbEngine.addCard({
      cardholderName: newCardholder,
      cardNumber: newCardNumber,
      expiryMonth: Number(newExpiryMonth),
      expiryYear: Number(newExpiryYear),
      bankName: newBank,
      initialBalanceXof: 500000,
    });

    setActiveCardId(created.id);
    setViewMode('RECHARGE');
  };

  const handlePerformRecharge = () => {
    if (!activeCard) return;
    setIsProcessing(true);
    setRechargeResult(null);

    setTimeout(() => {
      const res = dbEngine.rechargeWithCard(activeCard.id, rechargeAmount);
      setIsProcessing(false);
      if (res.success) {
        setRechargeResult({
          success: true,
          auth3dSecureRef: res.deposit?.auth3dSecureRef || 'AUTH-OK-3DS',
          message: `${rechargeAmount.toLocaleString('fr-FR')} XOF ont été débités de votre carte et crédités sur votre compte titres BRVM.`,
        });
      } else {
        setRechargeResult({
          success: false,
          message: res.errorMessage,
          canSwitchCard: res.canSwitchCard,
        });
      }
    }, 900);
  };

  const handleSwitchCard = (cardId: string) => {
    setActiveCardId(cardId);
    dbEngine.setDefaultCard(cardId);
    setRechargeResult(null);
    setViewMode('RECHARGE');
  };

  const handleDeleteCard = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dbEngine.deleteCard(cardId);
    const remaining = dbEngine.getUserCards();
    if (remaining.length > 0) {
      setActiveCardId(remaining[0].id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-[420px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cartes de Crédit & Débit</h3>
              <p className="text-[10px] text-slate-400">Rechargement instantané pour achat d'actions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => {
              setViewMode('RECHARGE');
              setRechargeResult(null);
            }}
            className={`py-1.5 rounded-lg font-semibold transition-colors ${
              viewMode === 'RECHARGE' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Recharger le Compte
          </button>
          <button
            onClick={() => setViewMode('CARDS_LIST')}
            className={`py-1.5 rounded-lg font-semibold transition-colors ${
              viewMode === 'CARDS_LIST' || viewMode === 'ADD_CARD'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mes Cartes ({cards.length})
          </button>
        </div>

        {/* --- VIEW 1: RECHARGE FLOW --- */}
        {viewMode === 'RECHARGE' && (
          <div className="space-y-4">
            {/* Active Card Virtual Card Display */}
            {activeCard ? (
              <div className="space-y-2">
                <div className="relative overflow-hidden rounded-2xl p-4 text-white shadow-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border border-slate-700/80">
                  {/* Card Background Holographic accents */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                        {activeCard.bankName}
                      </span>
                      <span className="text-xs font-bold text-amber-300">Compte Bancaire UEMOA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        {activeCard.brand}
                      </span>
                    </div>
                  </div>

                  {/* Chip & Contactless */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-6 rounded bg-gradient-to-r from-amber-400 to-yellow-600 border border-yellow-300 shadow-inner" />
                    {/* Contactless waves icon */}
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                      <path d="M12 19a9 9 0 0 0 0-14" />
                    </svg>
                  </div>

                  {/* Masked Card Number */}
                  <div className="font-mono text-base tracking-widest font-bold mb-3 text-slate-100">
                    {activeCard.cardMasked}
                  </div>

                  {/* Footer details */}
                  <div className="flex justify-between items-end text-[11px] font-mono">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Titulaire</span>
                      <span className="font-bold text-slate-200">{activeCard.cardholderName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Expire fin</span>
                      <span className="font-bold text-slate-200">
                        {String(activeCard.expiryMonth).padStart(2, '0')}/{String(activeCard.expiryYear).slice(-2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block uppercase">Solde Carte</span>
                      <span className={`font-bold ${
                        activeCard.balanceStatus === 'NEEDS_RECHARGE' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {activeCard.availableCardBalanceXof.toLocaleString('fr-FR')} XOF
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Status / Switch Button Bar */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {activeCard.balanceStatus === 'NEEDS_RECHARGE' ? (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Solde carte faible ({activeCard.availableCardBalanceXof.toLocaleString('fr-FR')} XOF)
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Carte active & vérifiée 3D Secure
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setViewMode('CARDS_LIST')}
                    className="text-[11px] font-semibold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Changer de carte</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-400">Aucune carte bancaire connectée.</p>
                <button
                  onClick={() => setViewMode('ADD_CARD')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Connecter une carte
                </button>
              </div>
            )}

            {/* Recharge Result Box */}
            {rechargeResult && (
              <div
                className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                  rechargeResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {rechargeResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-bold">
                      {rechargeResult.success
                        ? 'Rechargement Réussi · Compte Titres Crédité'
                        : 'Rechargement Échoué · Carte non rechargée'}
                    </div>
                    <p className="text-[11px] mt-0.5 text-slate-300">{rechargeResult.message}</p>
                    {rechargeResult.auth3dSecureRef && (
                      <div className="text-[10px] font-mono text-emerald-300 mt-1">
                        Réf 3D-Secure : {rechargeResult.auth3dSecureRef}
                      </div>
                    )}
                  </div>
                </div>

                {/* If card failed or needs recharge: Button to CHANGE CARD immediately */}
                {!rechargeResult.success && rechargeResult.canSwitchCard && (
                  <div className="pt-2 border-t border-rose-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-300">
                      Vous pouvez utiliser une autre carte :
                    </span>
                    <button
                      onClick={() => setViewMode('CARDS_LIST')}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Changer de Carte</span>
                    </button>
                  </div>
                )}

                {/* If success: CTA to buy stocks */}
                {rechargeResult.success && onSelectBuyStocks && (
                  <div className="pt-2 border-t border-emerald-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-300">
                      Liquidités disponibles immédiatement pour négocier :
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onSelectBuyStocks();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Acheter des Actions BRVM</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Recharge Amount Form */}
            {!rechargeResult?.success && activeCard && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">
                    Montant à Recharger sur le Compte Titres (FCFA / XOF)
                  </label>
                  <input
                    type="number"
                    min="5000"
                    step="5000"
                    value={rechargeAmount}
                    onChange={e => setRechargeAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-base font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                  {/* Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {[25000, 50000, 100000, 250000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setRechargeAmount(amt)}
                        className={`py-1 text-[11px] font-mono rounded-lg border transition-all ${
                          rechargeAmount === amt
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {(amt / 1000).toFixed(0)}k XOF
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3D Secure Guarantee Notice */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 text-[11px] text-slate-400">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Transaction sécurisée par 3D Secure 2.0 (Visa Secure / Mastercard Identity Check / GIM-UEMOA).
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handlePerformRecharge}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authentification 3D Secure en cours...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>
                        Recharger {rechargeAmount.toLocaleString('fr-FR')} XOF avec cette Carte
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 2: CARDS LIST (SWITCH / REMOVE / ADD) --- */}
        {viewMode === 'CARDS_LIST' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400 font-medium">Cartes Bancaires Enregistrées</span>
              <button
                onClick={() => setViewMode('ADD_CARD')}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une carte</span>
              </button>
            </div>

            <div className="space-y-2">
              {cards.map(card => {
                const isSelected = card.id === activeCardId;
                const isLow = card.balanceStatus === 'NEEDS_RECHARGE';
                return (
                  <div
                    key={card.id}
                    onClick={() => handleSwitchCard(card.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-950 border-amber-500 ring-1 ring-amber-500/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                          {card.brand === 'VISA' ? 'VISA' : card.brand === 'MASTERCARD' ? 'MC' : 'GIM'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{card.cardMasked}</span>
                            {card.isDefault && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-400">
                                Par défaut
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {card.bankName} · Exp: {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {cards.length > 1 && (
                          <button
                            onClick={e => handleDeleteCard(card.id, e)}
                            className="p-1 rounded-md text-slate-500 hover:text-rose-400 transition-colors"
                            title="Supprimer la carte"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleSwitchCard(card.id)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {isSelected ? 'Sélectionnée' : 'Choisir'}
                        </button>
                      </div>
                    </div>

                    {/* Card balance alert */}
                    <div className="mt-2 pt-2 border-t border-slate-900 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Solde disponible sur la carte :</span>
                      <span className={`font-mono font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {card.availableCardBalanceXof.toLocaleString('fr-FR')} XOF{' '}
                        {isLow ? '(À recharger)' : '(Actif)'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setViewMode('ADD_CARD')}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 text-slate-300 hover:border-amber-400 hover:text-amber-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Connecter une Nouvelle Carte de Crédit / Débit</span>
            </button>
          </div>
        )}

        {/* --- VIEW 3: ADD NEW CARD FORM --- */}
        {viewMode === 'ADD_CARD' && (
          <form onSubmit={handleAddNewCard} className="space-y-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400 font-medium">Connecter une Nouvelle Carte Bancaire</span>
              <button
                type="button"
                onClick={() => setViewMode('CARDS_LIST')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Retour aux cartes
              </button>
            </div>

            {/* Live Card Preview */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-slate-950 to-indigo-950 border border-slate-700/80 text-white font-mono text-xs space-y-2">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>{newBank}</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                  {detectCardBrand(newCardNumber || '4242')}
                </span>
              </div>
              <div className="text-sm font-bold tracking-widest text-slate-100">
                {newCardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-300 pt-1">
                <span>{newCardholder || 'NOM DU TITULAIRE'}</span>
                <span>
                  {newExpiryMonth}/{newExpiryYear}
                </span>
              </div>
            </div>

            {/* Cardholder */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nom sur la Carte</label>
              <input
                type="text"
                required
                value={newCardholder}
                onChange={e => setNewCardholder(e.target.value.toUpperCase())}
                placeholder="AMADOU KONE"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Numéro de Carte (16 chiffres)</label>
              <input
                type="text"
                required
                maxLength={19}
                value={newCardNumber}
                onChange={e => handleCardNumberChange(e.target.value)}
                placeholder="4242 1234 5678 9012"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Mois (MM)</label>
                <select
                  value={newExpiryMonth}
                  onChange={e => setNewExpiryMonth(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Année (YYYY)</label>
                <select
                  value={newExpiryYear}
                  onChange={e => setNewExpiryYear(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {[2026, 2027, 2028, 2029, 2030, 2031].map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">CVV (3 chiffres)</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={newCvv}
                  onChange={e => setNewCvv(e.target.value)}
                  placeholder="834"
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-amber-400 text-center"
                />
              </div>
            </div>

            {/* Bank */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Banque Émettrice</label>
              <select
                value={newBank}
                onChange={e => setNewBank(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Société Générale CI">Société Générale CI</option>
                <option value="Ecobank UEMOA">Ecobank UEMOA</option>
                <option value="BOA (Bank of Africa)">BOA (Bank of Africa)</option>
                <option value="NSIA Banque">NSIA Banque</option>
                <option value="Coris Bank International">Coris Bank International</option>
                <option value="UBA (United Bank for Africa)">UBA</option>
                <option value="Banque Internationale (Autre)">Autre Banque (Visa / Mastercard)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Valider & Enregistrer la Carte</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
