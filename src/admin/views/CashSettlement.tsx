import React, { useState } from 'react';
import type { DepositRecord } from '../../types/index.ts';
import { dbEngine } from '../../services/mockDatabase.ts';
import {
  Receipt,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  Building,
  Smartphone,
  CreditCard,
  Check,
} from 'lucide-react';

interface CashSettlementProps {
  deposits: DepositRecord[];
}

export const CashSettlement: React.FC<CashSettlementProps> = ({ deposits }) => {
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleApprove = (depositId: string, amount: number, investor: string) => {
    setApprovingId(depositId);
    setTimeout(() => {
      dbEngine.approveDeposit(depositId, 'Jean-Marc Kouamé (SGI Trésorerie)');
      setApprovingId(null);
      setSuccessToast(`Dépôt de ${amount.toLocaleString('fr-FR')} XOF validé pour ${investor}. Compte espèces crédité.`);
      setTimeout(() => setSuccessToast(null), 3500);
    }, 500);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Règlement des Dépôts & Rapprochement Bancaire
          </h1>
          <p className="text-xs text-slate-400">
            Flux Cartes de Crédit (Visa, Mastercard, GIM-UEMOA 3D-Secure), Mobile Money (Wave, Orange Money) & BCEAO RTGS
          </p>
        </div>
      </div>

      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Table of Deposits */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white">Demandes d'Alimentation Récentes</h2>
          <span className="text-xs text-slate-400 font-mono">Total : {deposits.length} opérations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold">
                <th className="pb-2.5">Date & Heure</th>
                <th className="pb-2.5">Référence</th>
                <th className="pb-2.5">Investisseur</th>
                <th className="pb-2.5">Moyen de Paiement</th>
                <th className="pb-2.5">Détail Règlement</th>
                <th className="pb-2.5 text-right">Montant XOF</th>
                <th className="pb-2.5 text-center">Statut</th>
                <th className="pb-2.5 text-right">Action SGI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {deposits.map(dep => {
                const isPending = dep.status === 'PENDING';
                return (
                  <tr key={dep.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 text-slate-400 text-[11px]">
                      {new Date(dep.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 font-bold text-slate-200">{dep.referenceCode}</td>
                    <td className="py-3 font-sans font-medium text-white">{dep.investorName}</td>
                    <td className="py-3 font-sans">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                        {dep.method === 'CREDIT_CARD' ? (
                          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        ) : dep.method === 'BANK_WIRE' ? (
                          <Building className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>
                          {dep.method === 'CREDIT_CARD'
                            ? `Carte ${dep.cardBrand || 'Bancaire'}`
                            : dep.method.replace('_', ' ')}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 text-[11px] font-sans">
                      {dep.method === 'CREDIT_CARD' ? (
                        <span className="font-mono text-emerald-400">
                          •••• {dep.cardLast4 || '4242'} (3D-Secure OK)
                        </span>
                      ) : (
                        dep.phoneNumber || '-'
                      )}
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-400 text-sm tabular-nums">
                      {dep.amountXof.toLocaleString('fr-FR')} XOF
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                          dep.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {dep.status === 'APPROVED' ? 'Crédité' : 'En attente SGI'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-sans">
                      {isPending ? (
                        <button
                          onClick={() => handleApprove(dep.id, dep.amountXof, dep.investorName)}
                          disabled={approvingId === dep.id}
                          className="py-1 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
                        >
                          {approvingId === dep.id ? 'Validation...' : 'Valider & Créditer'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">
                          Réglé à {dep.approvedAt ? new Date(dep.approvedAt).toLocaleTimeString('fr-FR') : ''}
                        </span>
                      )}
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
