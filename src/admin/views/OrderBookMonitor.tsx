import React, { useState } from 'react';
import type { StockQuote, TradeOrder } from '../../types/index.ts';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Filter,
  Search,
  Lock,
  Copy,
  CheckCircle2,
  Activity,
} from 'lucide-react';

interface OrderBookMonitorProps {
  quotes: StockQuote[];
  orders: TradeOrder[];
}

export const OrderBookMonitor: React.FC<OrderBookMonitorProps> = ({ quotes, orders }) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('SNTS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FILLED' | 'PENDING'>('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const selectedStock = quotes.find(q => q.symbol === selectedSymbol) || quotes[0];

  const filteredOrders = orders.filter(o => {
    const matchesSymbol = selectedSymbol === 'ALL' || o.symbol === selectedSymbol;
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSymbol && matchesStatus;
  });

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Surveillance du Carnet d'Ordres & Exécutions BRVM
          </h1>
          <p className="text-xs text-slate-400">
            Moteur d'appariement haute performance · Horodatage certifié au niveau microseconde
          </p>
        </div>

        {/* Stock Selector Pill */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {quotes.map(q => (
            <button
              key={q.symbol}
              onClick={() => setSelectedSymbol(q.symbol)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-colors ${
                selectedSymbol === q.symbol
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {q.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Top Section: Live Order Book Depth for selected stock */}
      {selectedStock && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{selectedStock.symbol}</h2>
                <span className="text-xs text-slate-400">· {selectedStock.name}</span>
                <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  {selectedStock.price.toLocaleString('fr-FR')} XOF ({selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent}%)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Carnet centralisé BRVM · 5 Meilleurs Niveaux</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Matching Engine : 1.2ms latency</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Bid Depth */}
            <div className="space-y-2">
              <div className="flex justify-between text-slate-400 text-[11px] font-semibold border-b border-slate-800 pb-1">
                <span>Ordres</span>
                <span>Quantité Achat</span>
                <span className="text-emerald-400">Cours Limite (Bid)</span>
              </div>
              <div className="space-y-1">
                {selectedStock.bids.map((bid, i) => (
                  <div key={i} className="flex justify-between items-center relative py-1 px-2 rounded bg-slate-950/60">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 rounded"
                      style={{ width: `${Math.min(100, (bid.quantity / 2500) * 100)}%` }}
                    />
                    <span className="relative z-10 text-slate-500 text-[11px]">{bid.ordersCount}</span>
                    <span className="relative z-10 text-slate-200 tabular-nums">{bid.quantity.toLocaleString('fr-FR')}</span>
                    <span className="relative z-10 text-emerald-400 font-bold tabular-nums">
                      {bid.price.toLocaleString('fr-FR')} XOF
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ask Depth */}
            <div className="space-y-2">
              <div className="flex justify-between text-slate-400 text-[11px] font-semibold border-b border-slate-800 pb-1">
                <span className="text-rose-400">Cours Limite (Ask)</span>
                <span>Quantité Vente</span>
                <span>Ordres</span>
              </div>
              <div className="space-y-1">
                {selectedStock.asks.map((ask, i) => (
                  <div key={i} className="flex justify-between items-center relative py-1 px-2 rounded bg-slate-950/60">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-rose-500/10 rounded"
                      style={{ width: `${Math.min(100, (ask.quantity / 2500) * 100)}%` }}
                    />
                    <span className="relative z-10 text-rose-400 font-bold tabular-nums">
                      {ask.price.toLocaleString('fr-FR')} XOF
                    </span>
                    <span className="relative z-10 text-slate-200 tabular-nums">{ask.quantity.toLocaleString('fr-FR')}</span>
                    <span className="relative z-10 text-slate-500 text-[11px]">{ask.ordersCount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white">Registre des Ordres & Preuves d'Exécution</h2>
            <p className="text-xs text-slate-400">Tous les ordres transmis avec signature cryptographique</p>
          </div>

          <div className="flex gap-2 text-xs">
            {(['ALL', 'FILLED', 'PENDING'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  statusFilter === s
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s === 'ALL' ? 'Tous' : s === 'FILLED' ? 'Exécutés' : 'En attente'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold">
                <th className="pb-2.5">Horodatage</th>
                <th className="pb-2.5">ID Ordre</th>
                <th className="pb-2.5">Investisseur</th>
                <th className="pb-2.5">Titre</th>
                <th className="pb-2.5">Type & Sens</th>
                <th className="pb-2.5 text-right">Qté</th>
                <th className="pb-2.5 text-right">Cours</th>
                <th className="pb-2.5 text-right">Frais SGI+BRVM</th>
                <th className="pb-2.5 text-right">Total Net</th>
                <th className="pb-2.5 text-center">Sécurité</th>
                <th className="pb-2.5">Hash SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 text-slate-400 text-[11px]">
                    {new Date(order.timestamp).toLocaleTimeString('fr-FR')}
                  </td>
                  <td className="py-2.5 text-slate-300 font-bold">{order.id}</td>
                  <td className="py-2.5 font-sans font-medium text-slate-200">{order.investorName}</td>
                  <td className="py-2.5 font-bold text-white">{order.symbol}</td>
                  <td className="py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      order.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {order.side === 'BUY' ? 'ACHAT' : 'VENTE'} {order.type}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-slate-200 tabular-nums">{order.quantity}</td>
                  <td className="py-2.5 text-right text-slate-200 tabular-nums">{order.price.toLocaleString('fr-FR')}</td>
                  <td className="py-2.5 text-right text-slate-400 tabular-nums">
                    {(order.brvmFee + order.crepmfFee + order.sgiFee).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-2.5 text-right font-bold text-amber-400 tabular-nums">
                    {order.totalCostXof.toLocaleString('fr-FR')} XOF
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-sans">
                      <Lock className="w-2.5 h-2.5" />
                      <span>MFA+Bio</span>
                    </span>
                  </td>
                  <td className="py-2.5">
                    <button
                      onClick={() => copyHash(order.executionHash)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition-colors"
                      title="Copier le hash de l'ordre"
                    >
                      <span>{order.executionHash.substring(0, 10)}...</span>
                      <Copy className="w-3 h-3" />
                      {copiedHash === order.executionHash && (
                        <span className="text-[10px] text-emerald-400 font-sans">Copié</span>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
