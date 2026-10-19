import React, { useState, useEffect } from 'react';
import { AdminHeader } from './components/AdminHeader.tsx';
import { AdminSidebar, type AdminViewType } from './components/AdminSidebar.tsx';
import { AdminOverview } from './views/AdminOverview.tsx';
import { KycDesk } from './views/KycDesk.tsx';
import { OrderBookMonitor } from './views/OrderBookMonitor.tsx';
import { CashSettlement } from './views/CashSettlement.tsx';
import { MarketDataView } from './views/MarketDataView.tsx';
import { ClientMessaging } from './views/ClientMessaging.tsx';
import { ComplianceAudit } from './views/ComplianceAudit.tsx';
import { ArchitectureMonitor } from './views/ArchitectureMonitor.tsx';
import { dbEngine } from '../services/mockDatabase.ts';
import { redisCache } from '../services/redisCache.ts';
import { securityService } from '../services/securityService.ts';
import { Lock, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import type { StockQuote, TradeOrder, KycRecord, DepositRecord, SupportMessage, AuditLogEntry, RedisCacheStats } from '../types/index.ts';

export const AdminPortal: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('boom_sgi_auth') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState('admin@sgi-boom.ci');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [currentView, setCurrentView] = useState<AdminViewType>('OVERVIEW');
  const [quotes, setQuotes] = useState<StockQuote[]>(dbEngine.getQuotes());
  const [orders, setOrders] = useState<TradeOrder[]>(dbEngine.getOrders());
  const [kycRecords, setKycRecords] = useState<KycRecord[]>(dbEngine.getKycRecords());
  const [deposits, setDeposits] = useState<DepositRecord[]>(dbEngine.getDeposits());
  const [messages, setMessages] = useState<SupportMessage[]>(dbEngine.getSupportMessages());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(securityService.getAuditLogs());
  const [redisStats, setRedisStats] = useState<RedisCacheStats>(redisCache.getStats());

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setAuthError('Identifiant et mot de passe requis.');
      return;
    }
    // Authentification immédiate SGI Admin (ou mot de passe 'admin' / démo)
    localStorage.setItem('boom_sgi_auth', 'true');
    setIsAuthenticated(true);
    setAuthError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('boom_sgi_auth');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const unsubDb = dbEngine.subscribe(() => {
      setQuotes([...dbEngine.getQuotes()]);
      setOrders([...dbEngine.getOrders()]);
      setKycRecords([...dbEngine.getKycRecords()]);
      setDeposits([...dbEngine.getDeposits()]);
      setMessages([...dbEngine.getSupportMessages()]);
      setAuditLogs([...securityService.getAuditLogs()]);
    });

    const unsubRedis = redisCache.subscribe(stats => {
      setRedisStats({ ...stats });
    });

    return () => {
      unsubDb();
      unsubRedis();
    };
  }, []);

  const pendingKycCount = kycRecords.filter(k => k.status === 'SUBMITTED').length;
  const pendingDepositsCount = deposits.filter(d => d.status === 'PENDING').length;

  // Écran d'authentification Portail SGI
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-4 select-none">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shrink-0">
              SGI
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight">SGI Boom Capital</h1>
              <p className="text-[11px] text-slate-400">Portail Supervision & Conformité AMF-UMOA</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Identifiant Agent SGI</label>
              <input
                type="text"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                placeholder="agent@sgi-boom.ci"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mot de passe sécurisé</label>
              <input
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>

            {authError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              <span>Accéder au Bureau de Surveillance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Agrément AMF #042/2021
            </span>
            <span className="font-mono text-[10px]">Session SSL 256-bit</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <AdminHeader redisStats={redisStats} pendingKycCount={pendingKycCount} onLogout={handleLogout} />

      {/* Main Layout: Sidebar + Viewport */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <AdminSidebar
          currentView={currentView}
          onViewChange={view => setCurrentView(view)}
          pendingKycCount={pendingKycCount}
          pendingDepositsCount={pendingDepositsCount}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {currentView === 'OVERVIEW' && (
            <AdminOverview
              quotes={quotes}
              orders={orders}
              kycRecords={kycRecords}
              deposits={deposits}
              onNavigateView={view => setCurrentView(view)}
            />
          )}

          {currentView === 'KYC_DESK' && (
            <KycDesk kycRecords={kycRecords} />
          )}

          {currentView === 'ORDER_MONITOR' && (
            <OrderBookMonitor quotes={quotes} orders={orders} />
          )}

          {currentView === 'CASH_SETTLEMENT' && (
            <CashSettlement deposits={deposits} />
          )}

          {currentView === 'MARKET_DATA' && (
            <MarketDataView quotes={quotes} />
          )}

          {currentView === 'MESSAGING' && (
            <ClientMessaging messages={messages} />
          )}

          {currentView === 'AUDIT_LOGS' && (
            <ComplianceAudit logs={auditLogs} />
          )}

          {currentView === 'ARCHITECTURE' && (
            <ArchitectureMonitor redisStats={redisStats} />
          )}
        </main>
      </div>
    </div>
  );
};
