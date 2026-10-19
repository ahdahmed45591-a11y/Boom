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

const env = import.meta.env;
const IP_BACKEND = (env.VITE_IP_BACKEND as string) || '172.23.16.1';
const IP_SGI = (env.VITE_IP_SGI as string) || '192.168.1.68';
const IP_MOBILE = (env.VITE_IP_MOBILE as string) || '172.28.112.1';

export const IP_MODE_MAP: Record<string, { mode: MasterMode; title: string; subtitle: string; badge: string }> = {
  [IP_BACKEND]: {
    mode: 'ARCHITECTURE',
    title: 'Backend & Base de données',
    subtitle: 'Moteur de matching, Redis cache & persistance',
    badge: `IP 1 · ${IP_BACKEND}:${window.location.port || 3000}`,
  },
  [IP_SGI]: {
    mode: 'ADMIN',
    title: 'SGI Boom Capital',
    subtitle: 'Portail d\'Administration SGI & Surveillance Réglementaire',
    badge: `IP 2 · ${IP_SGI}:${window.location.port || 3000}`,
  },
  [IP_MOBILE]: {
    mode: 'MOBILE',
    title: 'Android Mobile Application',
    subtitle: 'Application Investisseur Particulier BRVM',
    badge: `IP 3 · ${IP_MOBILE}:${window.location.port || 3000}`,
  },
};

const ipLinks = [
  { ip: IP_BACKEND, label: 'Backend', title: 'IP 1 : Backend & Base de données' },
  { ip: IP_SGI, label: 'SGI', title: 'IP 2 : SGI Boom Capital' },
  { ip: IP_MOBILE, label: 'Android', title: 'IP 3 : Android Mobile Application' },
];

const getInitialMode = (): MasterMode => {
  const urlParam = new URLSearchParams(window.location.search).get('mode')?.toUpperCase();
  if (urlParam === 'BACKEND' || urlParam === 'ARCHITECTURE') return 'ARCHITECTURE';
  if (urlParam === 'ADMIN') return 'ADMIN';
  if (urlParam === 'MOBILE') return 'MOBILE';
  if (urlParam === 'DUAL') return 'DUAL';

  const port = typeof window !== 'undefined' ? window.location.port : '';
  if (port === '3001') return 'ADMIN';
  if (port === '3002') return 'MOBILE';

  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  if (IP_MODE_MAP[host]) {
    return IP_MODE_MAP[host].mode;
  }

  const envMode = (import.meta.env.VITE_APP_MODE as string)?.toUpperCase();
  if (envMode === 'BACKEND' || envMode === 'ARCHITECTURE') return 'ARCHITECTURE';
  if (envMode && ['MOBILE', 'ADMIN', 'DUAL'].includes(envMode)) return envMode as MasterMode;

  return 'DUAL';
};

export default function App() {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const dedicated = IP_MODE_MAP[host];
  const [mode, setMode] = useState<MasterMode>(getInitialMode());
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

  // Port 3001: Portail SGI Admin UNIQUEMENT (Plein écran sans barre de navigation externe)
  if (mode === 'ADMIN') {
    return (
      <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
        {liveToast && (
          <div className="fixed top-4 right-6 z-50 animate-bounce transition-all">
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
        <div className="flex-1 min-h-0 overflow-hidden">
          <AdminPortal />
        </div>
      </div>
    );
  }

  // Port 3002: Application Mobile Android UNIQUEMENT
  if (mode === 'MOBILE') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans py-4 items-center justify-start overflow-y-auto">
        {liveToast && (
          <div className="fixed top-4 right-6 z-50 animate-bounce transition-all">
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
        <MobileApp />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Master Top Navigation Switcher */}
      {dedicated ? (
        <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-extrabold text-sm tracking-tight text-white">{dedicated.title}</span>
            <span className="text-slate-600 hidden md:inline">·</span>
            <span className="text-xs text-slate-400 hidden md:inline">{dedicated.subtitle}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-semibold">
              {dedicated.badge}
            </span>
            <button
              onClick={() => setMode(mode === 'DUAL' ? dedicated.mode : 'DUAL')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Columns className="w-3.5 h-3.5 text-amber-400" />
              <span>{mode === 'DUAL' ? `Mode ${dedicated.badge.split('·')[0].trim()}` : 'Double Écran'}</span>
            </button>
          </div>
        </header>
      ) : (
        <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-3 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 z-30 shrink-0">
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

          {/* Quick links to the 3 IP endpoints */}
          <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
            {ipLinks.map((l, i) => (
              <a
                key={l.ip}
                href={`http://${l.ip}:${window.location.port || 3000}/`}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 whitespace-nowrap"
                title={l.title}
              >
                IP {i + 1} · {l.ip}:{window.location.port || 3000} ({l.label})
              </a>
            ))}
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
      )}

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

        {mode === 'ARCHITECTURE' && (
          <div className="w-full flex-1 overflow-y-auto bg-slate-950 p-6">
            <ArchitectureMonitor redisStats={redisStats} />
          </div>
        )}
      </main>
    </div>
  );
}
