import React, { useState } from 'react';
import type { UserPortfolio, StockQuote, TradeOrder, DepositMethod } from '../../types/index.ts';
import { dbEngine } from '../../services/mockDatabase.ts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Lock,
  X,
  CreditCard,
  Building2,
} from 'lucide-react';

interface PortfolioScreenProps {
  portfolio: UserPortfolio;
  quotes: StockQuote[];
  orders: TradeOrder[];
  cards?: import('../../types/index.ts').PaymentCard[];
  onSelectStock: (stock: StockQuote) => void;
  isDepositModalOpen: boolean;
  onOpenDeposit: () => void;
  onCloseDeposit: () => void;
  onOpenCardManager?: () => void;
}

export const PortfolioScreen: React.FC<PortfolioScreenProps> = ({
  portfolio,
  quotes,
  orders,
  cards = [],
  onSelectStock,
  isDepositModalOpen,
  onOpenDeposit,
  onCloseDeposit,
  onOpenCardManager,
}) => {
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'HISTORY'>('POSITIONS');

  // Deposit state
  const [depositMethod, setDepositMethod] = useState<DepositMethod>('CREDIT_CARD');
  const [depositAmount, setDepositAmount] = useState<number>(100000);
  const [depositPhone, setDepositPhone] = useState<string>('+225 07 48 92 11 04');
  const [selectedCardId, setSelectedCardId] = useState<string>(
    cards.find(c => c.isDefault)?.id || cards[0]?.id || ''
  );
  const [depositSubmitted, setDepositSubmitted] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  const positionsValue = portfolio.positions.reduce((acc, pos) => acc + pos.currentValue, 0);
  const totalNetWorth = portfolio.cashBalanceXof + positionsValue;
  const totalUnrealizedPnL = portfolio.positions.reduce((acc, pos) => acc + pos.unrealizedPnL, 0);
  const totalCost = portfolio.positions.reduce((acc, pos) => acc + pos.totalCost, 0);
  const totalPnLPercent = totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0;

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;
    setDepositError(null);

    if (depositMethod === 'CREDIT_CARD') {
      const card = cards.find(c => c.id === selectedCardId) || cards[0];
      if (!card) {
        setDepositError('Aucune carte bancaire configurée.');
        return;
      }
      const res = dbEngine.rechargeWithCard(card.id, depositAmount);
      if (!res.success) {
        setDepositError(res.errorMessage || 'Carte non rechargée. Solde insuffisant.');
        return;
      }
      setDepositSubmitted(true);
      setTimeout(() => {
        setDepositSubmitted(false);
        onCloseDeposit();
      }, 1600);
    } else {
      dbEngine.submitDeposit(depositMethod, depositAmount, depositPhone);
      setDepositSubmitted(true);
      setTimeout(() => {
        setDepositSubmitted(false);
        onCloseDeposit();
      }, 1600);
    }
  };

  return (
    <div className="flex flex-col space-y-4 px-4 py-2">
      {/* Portfolio Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-100">Mon Portefeuille Titres</h1>
        <p className="text-[11px] text-slate-400">Compte Titres BRVM N° 042-8921-CI</p>
      </div>

      {/* Net Worth Summary Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/90 p-4 border border-slate-700/60 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-slate-400 font-medium">Actif Net Total</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {totalNetWorth.toLocaleString('fr-FR')}
              </span>
              <span className="text-xs font-semibold text-amber-400">XOF</span>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
            totalUnrealizedPnL >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
          }`}>
            {totalUnrealizedPnL >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span className="font-mono tabular-nums">
              {totalUnrealizedPnL >= 0 ? '+' : ''}{totalUnrealizedPnL.toLocaleString('fr-FR')} XOF ({totalPnLPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Strip */}
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[10px]">Liquidités Disponibles</span>
            <span className="font-mono font-bold text-slate-200 tabular-nums">
              {portfolio.cashBalanceXof.toLocaleString('fr-FR')} XOF
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[10px]">Valorisation Actions</span>
            <span className="font-mono font-bold text-slate-200 tabular-nums">
              {positionsValue.toLocaleString('fr-FR')} XOF
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={onOpenCardManager || onOpenDeposit}
            className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Recharger Carte (CB)</span>
          </button>
          <button
            onClick={onOpenDeposit}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Wave / MoMo / Virement</span>
          </button>
        </div>
      </div>

      {/* Tabs: Positions vs History */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('POSITIONS')}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'POSITIONS' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Lignes en Portefeuille ({portfolio.positions.length})
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'HISTORY' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Historique des Ordres ({orders.length})
        </button>
      </div>

      {/* Tab 1: Positions */}
      {activeTab === 'POSITIONS' && (
        <div className="space-y-2">
          {portfolio.positions.map(pos => {
            const quote = quotes.find(q => q.symbol === pos.symbol);
            const isProfit = pos.unrealizedPnL >= 0;
            return (
              <div
                key={pos.symbol}
                onClick={() => quote && onSelectStock(quote)}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">{pos.symbol}</span>
                      <span className="text-[10px] text-slate-400">· {pos.shares} titres</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      PRU: <span className="font-mono text-slate-300">{pos.averageBuyPrice.toLocaleString('fr-FR')} XOF</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-sm text-slate-100 tabular-nums">
                      {pos.currentValue.toLocaleString('fr-FR')} <span className="text-[10px] text-slate-400">XOF</span>
                    </div>
                    <div className={`text-[11px] font-mono font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{pos.unrealizedPnL.toLocaleString('fr-FR')} XOF ({isProfit ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {portfolio.positions.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              Aucune position ouverte. Visitez l'onglet Marché pour acquérir vos premières actions BRVM.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Orders History */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-2">
          {orders.map(order => (
            <div
              key={order.id}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    order.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {order.side === 'BUY' ? 'ACHAT' : 'VENTE'}
                  </span>
                  <span className="font-bold text-white">{order.symbol}</span>
                  <span className="text-slate-400 text-[11px]">({order.quantity} titres)</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {order.status === 'FILLED' ? 'Exécuté' : order.status}
                </span>
              </div>

              <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                <span>Cours: {order.price.toLocaleString('fr-FR')} XOF</span>
                <span className="text-white font-bold">{order.totalCostXof.toLocaleString('fr-FR')} XOF</span>
              </div>

              <div className="pt-1 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>{new Date(order.timestamp).toLocaleString('fr-FR')}</span>
                <span className="truncate max-w-[140px] text-slate-400" title={order.executionHash}>
                  SHA-256: {order.executionHash.substring(0, 10)}...
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-[420px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Alimentation du Compte Titres</h3>
                <p className="text-xs text-slate-400">Rechargement par Carte Bancaire ou Mobile Money</p>
              </div>
              <button
                onClick={onCloseDeposit}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {depositSubmitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Rechargement Confirmé</h4>
                <p className="text-xs text-slate-400">
                  Votre solde de négociation a été crédité. Vous pouvez dès à présent acquérir vos actions sur la BRVM.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                {/* Method selector */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Moyen de Paiement</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(
                      [
                        { id: 'CREDIT_CARD', name: 'Carte Bancaire (CB)', desc: 'Visa, Mastercard, GIM' },
                        { id: 'WAVE', name: 'Wave CI/SN', desc: 'Instantané' },
                        { id: 'ORANGE_MONEY', name: 'Orange Money', desc: 'Instantané' },
                        { id: 'BANK_WIRE', name: 'Virement SGI', desc: 'BCEAO RTGS' },
                      ] as const
                    ).map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setDepositMethod(m.id);
                          setDepositError(null);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          depositMethod === m.id
                            ? 'bg-amber-500/10 border-amber-500 text-white font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-200">{m.name}</div>
                        <div className="text-[10px] text-slate-400">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* If Credit Card selected: Card selection & Switcher */}
                {depositMethod === 'CREDIT_CARD' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-slate-400 font-medium">Carte Bancaire Sélectionnée</label>
                      {onOpenCardManager && (
                        <button
                          type="button"
                          onClick={() => {
                            onCloseDeposit();
                            onOpenCardManager();
                          }}
                          className="text-[11px] font-semibold text-amber-400 hover:underline"
                        >
                          Gérer les cartes
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {cards.map(card => {
                        const isSelected = card.id === selectedCardId;
                        const isLow = card.balanceStatus === 'NEEDS_RECHARGE';
                        return (
                          <div
                            key={card.id}
                            onClick={() => {
                              setSelectedCardId(card.id);
                              setDepositError(null);
                            }}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer flex justify-between items-center transition-all ${
                              isSelected
                                ? 'bg-slate-950 border-amber-500 text-white'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">
                                {card.brand}
                              </span>
                              <span className="font-mono text-xs">{card.cardMasked}</span>
                              <span className="text-[10px] text-slate-500">({card.bankName})</span>
                            </div>
                            <span className={`text-[10px] font-mono font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {card.availableCardBalanceXof.toLocaleString('fr-FR')} XOF
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Deposit Error Message (e.g. Card not recharged / insufficient funds) */}
                {depositError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs space-y-2">
                    <p>{depositError}</p>
                    {onOpenCardManager && (
                      <button
                        type="button"
                        onClick={() => {
                          onCloseDeposit();
                          onOpenCardManager();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                      >
                        Changer de Carte Bancaire
                      </button>
                    )}
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Montant à recharger (FCFA / XOF)</label>
                  <input
                    type="number"
                    min="5000"
                    step="5000"
                    value={depositAmount}
                    onChange={e => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                  <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                    {[50000, 100000, 250000, 500000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDepositAmount(val)}
                        className="py-1 text-[10px] font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                      >
                        {(val / 1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>
                </div>

                {depositMethod !== 'CREDIT_CARD' && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-medium">Numéro de téléphone associé</label>
                    <input
                      type="tel"
                      value={depositPhone}
                      onChange={e => setDepositPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>
                    {depositMethod === 'CREDIT_CARD'
                      ? `Recharger ${depositAmount.toLocaleString('fr-FR')} XOF par Carte`
                      : `Confirmer le Dépôt de ${depositAmount.toLocaleString('fr-FR')} XOF`}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
