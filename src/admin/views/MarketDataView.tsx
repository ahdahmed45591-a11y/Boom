import React, { useState } from 'react';
import type { StockQuote, StockSector } from '../../types/index.ts';
import { Search, TrendingUp, TrendingDown, Building, Download } from 'lucide-react';

interface MarketDataViewProps {
  quotes: StockQuote[];
}

export const MarketDataView: React.FC<MarketDataViewProps> = ({ quotes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  const filtered = quotes.filter(q => {
    const matchesSearch =
      q.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'ALL' || q.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Cote BRVM & Statistiques des Titres</h1>
          <p className="text-xs text-slate-400">
            Données fondamentales, ratios PER, dividendes et volumes de la Bourse Régionale d'Abidjan
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par symbole, société ou pays..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto text-xs">
          {['ALL', 'Telecom', 'Banking & Finance', 'Agriculture', 'Industry', 'Energy & Utilities'].map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-colors ${
                selectedSector === sec
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sec === 'ALL' ? 'Tous les secteurs' : sec}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-sans font-semibold">
                <th className="pb-2.5">Symbole</th>
                <th className="pb-2.5">Société Émettrice</th>
                <th className="pb-2.5">Pays</th>
                <th className="pb-2.5">Secteur</th>
                <th className="pb-2.5 text-right">Dernier Cours</th>
                <th className="pb-2.5 text-right">Var. %</th>
                <th className="pb-2.5 text-right">Volume</th>
                <th className="pb-2.5 text-right">PER</th>
                <th className="pb-2.5 text-right">Rendement Div.</th>
                <th className="pb-2.5 text-right">Cap. (Mrd XOF)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(stock => {
                const isUp = stock.changePercent >= 0;
                return (
                  <tr key={stock.symbol} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-bold text-white font-mono text-sm">{stock.symbol}</td>
                    <td className="py-3 font-sans font-medium text-slate-200">{stock.name}</td>
                    <td className="py-3 font-sans text-slate-400">{stock.country}</td>
                    <td className="py-3 font-sans">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {stock.sector}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-white tabular-nums text-sm">
                      {stock.price.toLocaleString('fr-FR')} XOF
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      <span className={`font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-300 tabular-nums">
                      {stock.volume.toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 text-right text-slate-400 tabular-nums">{stock.peRatio}x</td>
                    <td className="py-3 text-right font-bold text-emerald-400 tabular-nums">
                      {stock.dividendYield}%
                    </td>
                    <td className="py-3 text-right text-slate-200 tabular-nums">
                      {(stock.marketCap / 1000).toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
