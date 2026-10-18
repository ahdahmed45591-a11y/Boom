import React from 'react';
import type { StockQuote, TradeOrder, KycRecord, DepositRecord } from '../../types/index.ts';
import { BRVM_INDICES } from '../../services/marketData.ts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';

interface AdminOverviewProps {
  quotes: StockQuote[];
  orders: TradeOrder[];
  kycRecords: KycRecord[];
  deposits: DepositRecord[];
  onNavigateView: (view: any) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  quotes,
  orders,
  kycRecords,
  deposits,
  onNavigateView,
}) => {
  const pendingKycCount = kycRecords.filter(k => k.status === 'SUBMITTED').length;
  const pendingDepositsCount = deposits.filter(d => d.status === 'PENDING').length;

  const totalTradedVolumeXof = orders.reduce((acc, o) => acc + o.totalCostXof, 0) + 1482500000;
  const totalOrdersCount = orders.length + 3840;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Quick Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Tableau de Bord de Négociation & Gestion</h1>
          <p className="text-xs text-slate-400">
            Plateforme SGI Boom Capital · Supervision en continu des flux BRVM
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingKycCount > 0 && (
            <button
              onClick={() => onNavigateView('KYC_DESK')}
              className="px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-amber-400 transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Valider {pendingKycCount} Dossier(s) KYC</span>
            </button>
          )}
          <button
            onClick={() => onNavigateView('ORDER_MONITOR')}
            className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            Flux d'Ordres
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
            <span>Volume Négocié (24h)</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {(totalTradedVolumeXof / 1000000).toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-amber-400">M FCFA</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-mono">
            +18.4% vs séance précédente
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
            <span>Actifs sous Gestion (AUM)</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              48.65
            </span>
            <span className="text-xs font-semibold text-blue-400">Mrd FCFA</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            14,892 investisseurs particuliers & institutionnels
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
            <span>Dossiers KYC en File</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {pendingKycCount}
            </span>
            <span className="text-xs text-slate-400">en attente d'agrément</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Délai moyen d'approbation : 18 min
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
            <span>Dépôts à Rapprocher</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {pendingDepositsCount}
            </span>
            <span className="text-xs text-slate-400">Wave & MoMo</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400">
            Rapprochement bancaire RTGS actif
          </div>
        </div>
      </div>

      {/* Indices Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Indices BRVM en Temps Réel :</span>
        <div className="flex flex-wrap items-center gap-6">
          {BRVM_INDICES.map(idx => (
            <div key={idx.name} className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">{idx.name}</span>
              <span className="font-bold font-mono text-white tabular-nums">{idx.value.toFixed(2)} pts</span>
              <span className="text-emerald-400 font-mono font-semibold text-[11px]">+{idx.changePercent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Orders Stream vs BRVM Top Active */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Orders Stream */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Flux des Ordres Négociés</h2>
              <p className="text-xs text-slate-400">Moteur d'appariement en continu · Priorité Prix-Temps</p>
            </div>
            <button
              onClick={() => onNavigateView('ORDER_MONITOR')}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              Afficher le carnet complet
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold">
                  <th className="pb-2">N° Ordre</th>
                  <th className="pb-2">Investisseur</th>
                  <th className="pb-2">Titre</th>
                  <th className="pb-2">Sens</th>
                  <th className="pb-2 text-right">Quantité</th>
                  <th className="pb-2 text-right">Cours</th>
                  <th className="pb-2 text-right">Montant XOF</th>
                  <th className="pb-2 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {orders.slice(0, 6).map(order => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 text-slate-400 text-[11px] font-mono">{order.id}</td>
                    <td className="py-2.5 text-slate-200 font-sans font-medium">{order.investorName}</td>
                    <td className="py-2.5 font-bold text-white">{order.symbol}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        order.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {order.side === 'BUY' ? 'ACHAT' : 'VENTE'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-slate-200 tabular-nums">{order.quantity}</td>
                    <td className="py-2.5 text-right text-slate-200 tabular-nums">{order.price.toLocaleString('fr-FR')}</td>
                    <td className="py-2.5 text-right font-bold text-amber-400 tabular-nums">
                      {order.totalCostXof.toLocaleString('fr-FR')}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {order.status === 'FILLED' ? 'Exécuté' : order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Market Depth Preview & Top Volumes */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <h2 className="text-sm font-bold text-white">Valeurs Phares BRVM</h2>
            <span className="text-[10px] text-slate-500 font-mono">Volume 24h</span>
          </div>

          <div className="space-y-3">
            {quotes.slice(0, 5).map(stock => (
              <div key={stock.symbol} className="flex justify-between items-center text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">{stock.symbol}</span>
                    <span className="text-[10px] text-slate-400">· {stock.country}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold font-mono text-slate-200 tabular-nums">
                    {stock.price.toLocaleString('fr-FR')} XOF
                  </div>
                  <div className={`text-[10px] font-mono font-semibold ${
                    stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => onNavigateView('MARKET_DATA')}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Consulter les 46 Titres BRVM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
