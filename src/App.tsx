import React, { useState, useEffect } from 'react';
import { MobileApp } from './app/MobileApp.tsx';
import { AdminPortal } from './admin/AdminPortal.tsx';
import { ArchitectureMonitor } from './admin/views/ArchitectureMonitor.tsx';
import { redisCache } from './services/redisCache.ts';
import { wsBroker } from './services/webSocketBroker.ts';
import type { RedisCacheStats, TradeOrder } from './types/index.ts';
import {
  Smartphone,
  Monitor,
  Columns,
  Server,
  Zap,
  CheckCircle2,
  BellRing,
} from 'lucide-react';

type MasterMode = 'MOBILE' | 'ADMIN' | 'DUAL' | 'ARCHITECTURE';

export default function App() {
  const [mode, setMode] = useState<MasterMode>('DUAL');
  const [redisStats, setRedisStats] = useState<RedisCacheStats>(redisCache.getStats());
  const [liveToast, setLiveToast] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const unsubRedis = redisCache.subscribe(stats => {
      setRedisStats({ ...stats });
    });

    // Listen to WebSocket events to trigger real-time toasts across views
    const unsubOrders = wsBroker.subscribe('orders:flow', msg => {
      if (msg.event === 'ORDER_EXECUTED') {
        const order = msg.payload as TradeOrder;
        setLiveToast({
          title: `Ordre ${order.side === 'BUY' ? 'Achat' : 'Vente'} Exécuté`,
          message: `${order.quantity} ${order.symbol} à ${order.price.toLocaleString('fr-FR')} XOF · SGI Boom Capital`,
        });
        setTimeout(() => setLiveToast(null), 4000);
      }
    });

    const unsubKyc = wsBroker.subscribe('kyc:events', msg => {
      if (msg.event === 'KYC_SUBMITTED') {
        setLiveToast({
          title: 'Nouveau Dossier KYC Soumis',
          message: `${msg.payload.fullName} a transmis ses pièces d'identité et selfie biométrique.`,
        });
        setTimeout(() => setLiveToast(null), 4000);
      } else if (msg.event === 'KYC_STATUS_UPDATED') {
        setLiveToast({
          title: 'Statut KYC Mis à Jour',
          message: `Dossier ${msg.payload.fullName} passé à : ${msg.payload.status}`,
        });
        setTimeout(() => setLiveToast(null), 4000);
      }
    });

    const unsubDep = wsBroker.subscribe('deposits:events', msg => {
      if (msg.event === 'DEPOSIT_APPROVED') {
        const isCard = msg.payload.method === 'CREDIT_CARD';
        setLiveToast({
          title: isCard ? 'Rechargement Carte Réussi (3D Secure)' : 'Dépôt Crédité avec Succès',
          message: `${msg.payload.amountXof.toLocaleString('fr-FR')} XOF crédités sur le compte espèces investisseur.`,
        });
        setTimeout(() => setLiveToast(null), 4000);
      }
    });

    const unsubAuth = wsBroker.subscribe('auth:events', msg => {
      if (msg.event === 'USER_LOGGED_IN') {
        setLiveToast({
          title: `Connexion ${msg.payload.provider === 'GOOGLE' ? 'Google (Gmail)' : msg.payload.provider === 'APPLE' ? 'Apple (iCloud)' : 'SGI Boom'}`,
          message: `Bienvenue ${msg.payload.name} (${msg.payload.email}) sur Boom BRVM.`,
        });
        setTimeout(() => setLiveToast(null), 4000);
      }
    });

    return () => {
      unsubRedis();
      unsubOrders();
      unsubKyc();
      unsubDep();
      unsubAuth();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Master Top Navigation Switcher */}
      <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-4 z-30 shrink-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          <span className="font-extrabold text-sm tracking-tight text-white whitespace-nowrap shrink-0">
            BOOM BRVM
          </span>
          <span className="hidden xl:inline-block text-slate-600">·</span>
          <span className="hidden xl:inline-block text-xs text-slate-400 whitespace-nowrap">
            Plateforme d'Investissement Boursier Ouest-Africain
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs shrink-0">
          <button
            onClick={() => setMode('DUAL')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 ${
              mode === 'DUAL'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Vue double écran synchronisée temps réel"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Double Écran</span>
            <span className="sm:hidden">Duo</span>
          </button>

          <button
            onClick={() => setMode('MOBILE')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 ${
              mode === 'MOBILE'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">App Android</span>
            <span className="sm:hidden">Mobile</span>
          </button>

          <button
            onClick={() => setMode('ADMIN')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 ${
              mode === 'ADMIN'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Portail SGI Admin</span>
            <span className="sm:hidden">SGI</span>
          </button>

          <button
            onClick={() => setMode('ARCHITECTURE')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 ${
              mode === 'ARCHITECTURE'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Microservices</span>
          </button>
        </div>
      </header>

      {/* Real-time Broadcast Toast */}
      {liveToast && (
        <div className="fixed top-14 right-6 z-50 animate-bounce transition-all">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/80 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.3)] text-xs flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">{liveToast.title}</div>
              <div className="text-[11px] text-slate-300 font-mono mt-0.5">{liveToast.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden">
        {mode === 'DUAL' && (
          <div className="w-full h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-y-auto lg:overflow-hidden">
            {/* Left Half: Android Mobile App */}
            <div className="lg:w-[480px] xl:w-[500px] shrink-0 bg-slate-950/80 p-4 flex flex-col items-center justify-start overflow-y-auto">
              <div className="mb-2 text-center">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                  Composant 1 · Android Mobile Application (app/)
                </span>
                <span className="text-xs font-bold text-slate-200">
                  Vue Investisseur Particulier
                </span>
              </div>
              <MobileApp />
            </div>

            {/* Right Half: SGI Administrator Portal */}
            <div className="flex-1 min-w-0 bg-slate-950 flex flex-col overflow-hidden">
              <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 text-xs flex justify-between items-center shrink-0">
                <span className="font-mono text-slate-400 text-[11px]">
                  Composant 2 · Administrator Web Portal (admin/) · Port 3000
                </span>
                <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Synchronisation WSS en continu avec l'application mobile
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <AdminPortal />
              </div>
            </div>
          </div>
        )}

        {mode === 'MOBILE' && (
          <div className="w-full flex-1 overflow-y-auto bg-slate-950 py-6 flex flex-col items-center justify-start">
            <div className="mb-4 text-center">
              <h2 className="text-base font-bold text-white">Application Mobile Android Boom BRVM</h2>
              <p className="text-xs text-slate-400">
                Négociation d'actions BRVM (Sonatel, Orange CI, Ecobank), suivi de portefeuille & KYC biométrique
              </p>
            </div>
            <MobileApp />
          </div>
        )}

        {mode === 'ADMIN' && (
          <div className="w-full flex-1 overflow-hidden">
            <AdminPortal />
          </div>
        )}

        {mode === 'ARCHITECTURE' && (
          <div className="w-full flex-1 overflow-y-auto bg-slate-950 p-6">
            <ArchitectureMonitor redisStats={redisStats} />
          </div>
        )}
      </main>
    </div>
  );
}
