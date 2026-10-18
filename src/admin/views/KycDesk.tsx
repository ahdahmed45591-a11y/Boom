import React, { useState } from 'react';
import type { KycRecord } from '../../types/index.ts';
import { dbEngine } from '../../services/mockDatabase.ts';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Eye,
  Camera,
  PenTool,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface KycDeskProps {
  kycRecords: KycRecord[];
}

export const KycDesk: React.FC<KycDeskProps> = ({ kycRecords }) => {
  const [filter, setFilter] = useState<'ALL' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [selectedKyc, setSelectedKyc] = useState<KycRecord | null>(kycRecords[0] || null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredRecords = kycRecords.filter(r => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const handleReview = (action: 'VERIFIED' | 'REJECTED' | 'INFO_REQUESTED') => {
    if (!selectedKyc) return;
    setIsProcessing(true);
    setTimeout(() => {
      const updated = dbEngine.reviewKyc(
        selectedKyc.id,
        action,
        'Jean-Marc Kouamé (SGI Compliance Officer)',
        rejectionReason || undefined
      );
      setIsProcessing(false);
      if (updated) {
        setSelectedKyc({ ...updated });
        setActionNotice(
          action === 'VERIFIED'
            ? `Compte de ${updated.fullName} validé avec succès ! Plafonds débloqués.`
            : `Dossier marqué comme : ${action}`
        );
        setTimeout(() => setActionNotice(null), 3500);
      }
    }, 600);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Bureau de Conformité & Validation KYC
          </h1>
          <p className="text-xs text-slate-400">
            Contrôle des pièces d'identité, scores biométriques et signatures réglementaires AMF-UMOA
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          {(['ALL', 'SUBMITTED', 'VERIFIED', 'REJECTED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                filter === tab
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab === 'ALL'
                ? 'Tous'
                : tab === 'SUBMITTED'
                ? 'En attente'
                : tab === 'VERIFIED'
                ? 'Validés'
                : 'Rejetés'}
            </button>
          ))}
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main 2-Column Workspace: Queue list on left, Document Inspector on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Submissions Queue */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs font-bold text-slate-300">
            <span>Dossiers d'Investisseurs ({filteredRecords.length})</span>
            <span className="text-[10px] text-slate-500 font-mono">Priorité Chronologique</span>
          </div>

          <div className="space-y-2">
            {filteredRecords.map(record => {
              const isSelected = selectedKyc?.id === record.id;
              return (
                <div
                  key={record.id}
                  onClick={() => setSelectedKyc(record)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{record.fullName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{record.email}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {record.idType} : {record.idNumber}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        record.status === 'VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : record.status === 'SUBMITTED'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {record.status === 'VERIFIED'
                        ? 'Validé'
                        : record.status === 'SUBMITTED'
                        ? 'À traiter'
                        : 'Rejeté'}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Reçu : {new Date(record.submissionDate).toLocaleString('fr-FR')}</span>
                    <span className="text-emerald-400 font-bold">Liveness {record.selfieConfidenceScore}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Full Inspector & Validation Panel */}
        {selectedKyc ? (
          <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider block">
                  Examen Approfondi · AMF-UMOA
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedKyc.fullName}</h2>
                <p className="text-xs text-slate-400">
                  {selectedKyc.nationality} · Né(e) le {selectedKyc.dateOfBirth} · {selectedKyc.residentialAddress}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono">ID Dossier</span>
                <span className="text-xs font-mono font-bold text-slate-200">{selectedKyc.id}</span>
              </div>
            </div>

            {/* Document inspection grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Official National ID / Passport */}
              <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Justificatif CNI / Passeport</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{selectedKyc.idNumber}</span>
                </div>
                <div className="h-36 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                  <img
                    src={selectedKyc.idFrontImage}
                    alt="Recto pièce"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Document officiel CEDEAO</span>
                  <span className="text-emerald-400 font-mono">Lisibilité 100%</span>
                </div>
              </div>

              {/* Card 2: Biometric Selfie with Liveness Score */}
              <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Selfie Biométrique 3D</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    Score : {selectedKyc.selfieConfidenceScore}%
                  </span>
                </div>
                <div className="h-36 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                  <img
                    src={selectedKyc.selfieImage}
                    alt="Selfie"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Concordance faciale</span>
                  <span className="text-emerald-400 font-mono">Test Liveness Réussi</span>
                </div>
              </div>
            </div>

            {/* Electronic Signature Inspection */}
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-amber-400" />
                  <span>Signature Électronique Certifiée</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Standard eIDAS / OHADA</span>
              </div>
              <div className="h-20 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-center p-2">
                <img
                  src={selectedKyc.signatureDataUrl}
                  alt="Signature"
                  className="max-h-full object-contain filter invert opacity-90"
                />
              </div>
            </div>

            {/* Decision Bar */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Décision de Conformité SGI</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleReview('VERIFIED')}
                  disabled={isProcessing || selectedKyc.status === 'VERIFIED'}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valider le Compte Titres (Agrément AMF)</span>
                </button>

                <button
                  onClick={() => handleReview('REJECTED')}
                  disabled={isProcessing}
                  className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs flex items-center gap-2 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rejeter le Dossier</span>
                </button>

                <button
                  onClick={() => handleReview('INFO_REQUESTED')}
                  disabled={isProcessing}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
                >
                  <span>Demander Pièces</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-12 text-center text-slate-400 text-xs">
            Sélectionnez un dossier investisseur pour lancer l'examen de conformité.
          </div>
        )}
      </div>
    </div>
  );
};
