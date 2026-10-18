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
import type { StockQuote, TradeOrder, KycRecord, DepositRecord, SupportMessage, AuditLogEntry, RedisCacheStats } from '../types/index.ts';

export const AdminPortal: React.FC = () => {
  const [currentView, setCurrentView] = useState<AdminViewType>('OVERVIEW');
  const [quotes, setQuotes] = useState<StockQuote[]>(dbEngine.getQuotes());
  const [orders, setOrders] = useState<TradeOrder[]>(dbEngine.getOrders());
  const [kycRecords, setKycRecords] = useState<KycRecord[]>(dbEngine.getKycRecords());
  const [deposits, setDeposits] = useState<DepositRecord[]>(dbEngine.getDeposits());
  const [messages, setMessages] = useState<SupportMessage[]>(dbEngine.getSupportMessages());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(securityService.getAuditLogs());
  const [redisStats, setRedisStats] = useState<RedisCacheStats>(redisCache.getStats());

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

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <AdminHeader redisStats={redisStats} pendingKycCount={pendingKycCount} />

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
