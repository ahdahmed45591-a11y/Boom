import React from 'react';
import type { StockQuote, UserPortfolio, KycRecord, TradeOrder } from '../../types/index.ts';
import { BRVM_INDICES } from '../../services/marketData.ts';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  ArrowDownLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';

interface HomeScreenProps {
  portfolio: UserPortfolio;
  quotes: StockQuote[];
  kycRecord?: KycRecord;
  recentOrders: TradeOrder[];
  currentUser?: import('../../types/index.ts').AuthUser;
  activeCard?: import('../../types/index.ts').PaymentCard;
  onSelectStock: (stock: StockQuote) => void;
  onOpenDeposit: () => void;
  onOpenCardManager: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenSecurity: () => void;
  onOpenAuth: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  portfolio,
  quotes,
  kycRecord,
  recentOrders,
  currentUser,
  activeCard,
  onSelectStock,
  onOpenDeposit,
  onOpenCardManager,
  onNavigateTab,
  onOpenSecurity,
  onOpenAuth,
}) => {
  // Calculations
  const positionsValue = portfolio.positions.reduce((acc, pos) => acc + pos.currentValue, 0);
  const totalNetWorth = portfolio.cashBalanceXof + positionsValue;
  const totalUnrealizedPnL = portfolio.positions.reduce((acc, pos) => acc + pos.unrealizedPnL, 0);
  const totalCost = portfolio.positions.reduce((acc, pos) => acc + pos.totalCost, 0);
  const totalPnLPercent = totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0;

  const topGainers = [...quotes]
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 4);

  const userName = currentUser?.name || 'Amadou Koné';
  const userInitials = userName
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col space-y-4 px-4 py-2">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-amber-400 tracking-wide uppercase">BRVM · UEMOA</span>
            {currentUser?.provider === 'GOOGLE' && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Gmail
              </span>
            )}
            {currentUser?.provider === 'APPLE' && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                iCloud
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-slate-100">{userName}</h1>
          <p className="text-[11px] text-slate-400">
            {currentUser?.email || 'baoufinance@gmail.com'} · #042
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSecurity}
            title="Paramètres de sécurité 2FA & Biométrie"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenAuth}
            title="Compte & Connexion"
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md hover:ring-2 hover:ring-amber-400 transition-all cursor-pointer"
          >
            {userInitials}
          </button>
        </div>
      </div>

      {/* Net Worth Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-800/80 p-4 border border-slate-700/60 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-slate-400 font-medium">Valeur Totale du Compte</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                {totalNetWorth.toLocaleString('fr-FR')}
              </span>
              <span className="text-xs font-semibold text-amber-400">FCFA</span>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
            totalUnrealizedPnL >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
          }`}>
            {totalUnrealizedPnL >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span className="font-mono tabular-nums">
              {totalUnrealizedPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Cash vs Securities Breakdown */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Espèces Disponibles</span>
            <span className="font-mono font-bold text-slate-100 tabular-nums">
              {portfolio.cashBalanceXof.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Titres Évalués</span>
            <span className="font-mono font-bold text-slate-100 tabular-nums">
              {positionsValue.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </div>

        {/* Active Connected Credit Card Indicator */}
        {activeCard && (
          <div
            onClick={onOpenCardManager}
            className="mt-3 py-1.5 px-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-amber-500/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">
                {activeCard.brand}
              </span>
              <span className="font-mono text-slate-300">{activeCard.cardMasked}</span>
              <span className="text-slate-500 text-[10px]">({activeCard.bankName})</span>
            </div>
            <span className="text-[10px] text-amber-400 font-semibold hover:underline">
              Gérer / Changer
            </span>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={onOpenCardManager}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow-sm active:scale-[0.98]"
            title="Recharger le compte par carte bancaire pour acheter des actions"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span className="truncate">Recharger (CB)</span>
          </button>
          <button
            onClick={() => onNavigateTab('market')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-sm active:scale-[0.98]"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="truncate">Acheter</span>
          </button>
        </div>
      </div>

      {/* KYC Alert Banner */}
      {(!kycRecord || kycRecord.status !== 'VERIFIED') && (
        <div
          onClick={() => onNavigateTab('kyc')}
          className="flex items-center justify-between p-3 rounded-xl bg-amber-950/40 border border-amber-600/30 cursor-pointer hover:bg-amber-950/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              {kycRecord?.status === 'SUBMITTED' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-200">
                {kycRecord?.status === 'SUBMITTED'
                  ? 'Dossier KYC en cours d\'examen SGI'
                  : 'Vérifiez votre identité réglementaire'}
              </div>
              <div className="text-[11px] text-amber-300/70">
                {kycRecord?.status === 'SUBMITTED'
                  ? 'Agrément AMF-UMOA en vérification par la SGI'
                  : 'Obligation légale pour négocier sans plafond'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
        </div>
      )}

      {/* BRVM Indices Ticker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Indices BRVM</span>
          <span className="text-[11px] text-slate-500 font-mono">Séance en direct</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {BRVM_INDICES.map(idx => (
            <div key={idx.name} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium truncate">{idx.name}</span>
              <span className="text-xs font-bold font-mono text-slate-100 tabular-nums mt-0.5">
                {idx.value.toFixed(2)}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 mt-0.5">
                +{idx.changePercent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Gainers Horizontal Strip */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Plus Fortes Hausses</span>
          <button
            onClick={() => onNavigateTab('market')}
            className="text-[11px] text-amber-400 hover:underline font-medium"
          >
            Tout voir
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {topGainers.map(stock => (
            <div
              key={stock.symbol}
              onClick={() => onSelectStock(stock)}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-all active:scale-[0.98]"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-xs text-white">{stock.symbol}</span>
                  <span className="block text-[10px] text-slate-400 truncate max-w-[90px]">{stock.name}</span>
                </div>
                <span className={`text-[11px] font-mono font-bold ${
                  stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xs font-bold font-mono text-slate-100 tabular-nums">
                  {stock.price.toLocaleString('fr-FR')}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">XOF</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders Stream */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Ordres Récents</span>
          <button
            onClick={() => onNavigateTab('portfolio')}
            className="text-[11px] text-amber-400 hover:underline font-medium"
          >
            Historique
          </button>
        </div>
        <div className="space-y-1.5">
          {recentOrders.slice(0, 3).map(order => (
            <div
              key={order.id}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/90 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                  order.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {order.side === 'BUY' ? 'A' : 'V'}
                </div>
                <div>
                  <div className="font-semibold text-slate-100">
                    {order.side === 'BUY' ? 'Achat' : 'Vente'} {order.quantity} {order.symbol}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(order.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {order.price.toLocaleString('fr-FR')} XOF
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  order.status === 'FILLED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>
                  {order.status === 'FILLED' ? 'Exécuté' : 'En attente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
