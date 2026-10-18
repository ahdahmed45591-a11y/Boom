import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Building,
  MessageSquare,
  FileCode2,
  Server,
  Layers,
} from 'lucide-react';

export type AdminViewType =
  | 'OVERVIEW'
  | 'KYC_DESK'
  | 'ORDER_MONITOR'
  | 'CASH_SETTLEMENT'
  | 'MARKET_DATA'
  | 'MESSAGING'
  | 'AUDIT_LOGS'
  | 'ARCHITECTURE';

interface AdminSidebarProps {
  currentView: AdminViewType;
  onViewChange: (view: AdminViewType) => void;
  pendingKycCount: number;
  pendingDepositsCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentView,
  onViewChange,
  pendingKycCount,
  pendingDepositsCount,
}) => {
  const menuItems = [
    {
      id: 'OVERVIEW' as AdminViewType,
      label: 'Tableau de Bord',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'KYC_DESK' as AdminViewType,
      label: 'Validation KYC',
      icon: ShieldCheck,
      badge: pendingKycCount > 0 ? pendingKycCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'ORDER_MONITOR' as AdminViewType,
      label: 'Carnet d\'Ordres',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'CASH_SETTLEMENT' as AdminViewType,
      label: 'Dépôts & Règlements',
      icon: Receipt,
      badge: pendingDepositsCount > 0 ? pendingDepositsCount : null,
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    },
    {
      id: 'MARKET_DATA' as AdminViewType,
      label: 'Cote BRVM & Valeurs',
      icon: Building,
      badge: '46',
      badgeColor: 'bg-slate-800 text-slate-400',
    },
    {
      id: 'MESSAGING' as AdminViewType,
      label: 'Messagerie Clients',
      icon: MessageSquare,
      badge: null,
    },
    {
      id: 'AUDIT_LOGS' as AdminViewType,
      label: 'Registre d\'Audit & SHA-256',
      icon: FileCode2,
      badge: null,
    },
    {
      id: 'ARCHITECTURE' as AdminViewType,
      label: 'Microservices & Redis',
      icon: Server,
      badge: 'Online',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Gestion de Négociation SGI
        </div>

        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                    item.badgeColor || 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* SGI Broker Regulatory Accreditation Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 m-3 rounded-2xl border border-slate-800">
        <div className="text-[11px] font-bold text-slate-200">SGI Boom Capital Partners</div>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Membre agréé N° 042/2021 de la BRVM et de l'AMF-UMOA (Union Monétaire Ouest Africaine).
        </p>
        <div className="mt-2 text-[9px] font-mono text-emerald-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>BCEAO RTGS Connecté</span>
        </div>
      </div>
    </aside>
  );
};
