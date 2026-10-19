import React from 'react';
import { Wifi, ShieldCheck, Database, RefreshCw, User, Bell } from 'lucide-react';
import type { RedisCacheStats } from '../../types/index.ts';

interface AdminHeaderProps {
  redisStats: RedisCacheStats;
  pendingKycCount: number;
  onLogout?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ redisStats, pendingKycCount, onLogout }) => {
  const hitRatio =
    redisStats.hits + redisStats.misses > 0
      ? ((redisStats.hits / (redisStats.hits + redisStats.misses)) * 100).toFixed(1)
      : '98.2';

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Brand & SGI Identity */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shrink-0">
          SGI
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm tracking-tight text-white whitespace-nowrap">
              SGI Boom Capital
            </span>
            <span className="hidden xl:inline-block text-[10px] text-amber-400 font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 whitespace-nowrap">
              AMF #042
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block -mt-0.5 whitespace-nowrap truncate max-w-[200px]">
            Société de Gestion & d'Intermédiation
          </span>
        </div>
      </div>

      {/* Middle Status Indicators */}
      <div className="hidden 2xl:flex items-center gap-4 text-xs shrink-0">
        {/* Market Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 text-[11px] font-medium">Séance BRVM : Ouverte</span>
        </div>

        {/* WebSocket Stream */}
        <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px] whitespace-nowrap">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span>WSS Feed 12ms</span>
        </div>

        {/* Redis Cache Telemetry */}
        <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px] whitespace-nowrap">
          <Database className="w-3 h-3 text-amber-400" />
          <span>Redis : {hitRatio}% hit</span>
        </div>
      </div>

      {/* Right User & Notifications */}
      <div className="flex items-center gap-3 shrink-0">
        {pendingKycCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold whitespace-nowrap shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{pendingKycCount} KYC en attente</span>
          </div>
        )}

        {/* Broker Agent Lockup */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200 whitespace-nowrap">Jean-Marc K.</div>
            <div className="text-[10px] text-slate-400 whitespace-nowrap">Responsable Marchés</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
            JMK
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="ml-1 text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg border border-slate-800 hover:border-rose-500/30 transition-colors"
              title="Déconnexion"
            >
              Déconnexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
