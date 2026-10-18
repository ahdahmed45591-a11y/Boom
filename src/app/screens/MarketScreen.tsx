import React, { useState } from 'react';
import type { StockQuote, StockSector } from '../../types/index.ts';
import { Search, TrendingUp, TrendingDown, Filter } from 'lucide-react';

interface MarketScreenProps {
  quotes: StockQuote[];
  onSelectStock: (stock: StockQuote) => void;
}

const SECTORS: ('Tous' | StockSector)[] = [
  'Tous',
  'Telecom',
  'Banking & Finance',
  'Agriculture',
  'Industry',
  'Energy & Utilities',
];

export const MarketScreen: React.FC<MarketScreenProps> = ({ quotes, onSelectStock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<'Tous' | StockSector>('Tous');

  const filteredQuotes = quotes.filter(stock => {
    const matchesSearch =
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'Tous' || stock.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  return (
    <div className="flex flex-col space-y-3 px-4 py-2">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Cote Officielle BRVM</h1>
          <p className="text-[11px] text-slate-400">46 Titres cotés · Bourse Régionale d'Abidjan</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Marché Ouvert</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher par symbole ou société (ex: Sonatel, ORAC)..."
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-colors"
        />
      </div>

      {/* Sector Filter Scroller */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {SECTORS.map(sec => (
          <button
            key={sec}
            onClick={() => setSelectedSector(sec)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition-colors ${
              selectedSector === sec
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Stock List Rows */}
      <div className="space-y-2 mt-1">
        {filteredQuotes.map(stock => {
          const isUp = stock.changePercent >= 0;
          return (
            <div
              key={stock.symbol}
              onClick={() => onSelectStock(stock)}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800/90 cursor-pointer transition-all flex items-center justify-between active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex flex-col items-center justify-center font-bold text-xs text-amber-400 border border-slate-700/60">
                  <span>{stock.symbol.substring(0, 4)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-100">{stock.symbol}</span>
                    <span className="text-[10px] text-slate-400">· {stock.country}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                    {stock.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Vol: {stock.volume.toLocaleString('fr-FR')} titres
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold font-mono text-sm text-slate-100 tabular-nums">
                  {stock.price.toLocaleString('fr-FR')} <span className="text-[10px] text-slate-400 font-normal">XOF</span>
                </div>
                <div className={`flex items-center justify-end gap-1 text-[11px] font-mono font-semibold ${
                  isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {isUp ? '+' : ''}{stock.change} XOF
                </div>
              </div>
            </div>
          );
        })}

        {filteredQuotes.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs">
            Aucun titre ne correspond à votre recherche.
          </div>
        )}
      </div>
    </div>
  );
};
