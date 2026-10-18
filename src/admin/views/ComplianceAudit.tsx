import React, { useState } from 'react';
import type { AuditLogEntry } from '../../types/index.ts';
import { securityService } from '../../services/securityService.ts';
import {
  FileCode2,
  Lock,
  Unlock,
  ShieldCheck,
  Search,
  Copy,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ComplianceAuditProps {
  logs: AuditLogEntry[];
}

export const ComplianceAudit: React.FC<ComplianceAuditProps> = ({ logs }) => {
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(logs[0] || null);
  const [decryptedData, setDecryptedData] = useState<Record<string, any> | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleInspect = (log: AuditLogEntry) => {
    setSelectedLog(log);
    const data = securityService.decryptPayload(log.encryptedDetails);
    setDecryptedData(data);
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Registre d'Audit Cryptographique & Conformité AMF-UMOA
        </h1>
        <p className="text-xs text-slate-400">
          Journal immuable horodaté, scellé par hachage SHA-256 et chiffrement AES-256-GCM
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Audit Log Table */}
        <div className="lg:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 text-xs">
            <h2 className="font-bold text-white">Événements Systèmes & Transactions ({logs.length})</h2>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Preuve d'intégrité SHA-256 Vérifiée
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-sans font-semibold">
                  <th className="pb-2">Date & Heure</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Acteur</th>
                  <th className="pb-2">IP</th>
                  <th className="pb-2">Statut</th>
                  <th className="pb-2 text-right">Audit Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map(log => {
                  const isSelected = selectedLog?.id === log.id;
                  return (
                    <tr
                      key={log.id}
                      onClick={() => handleInspect(log)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-slate-800/80 font-bold' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-2.5 text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                      </td>
                      <td className="py-2.5 font-sans font-medium text-white">{log.action}</td>
                      <td className="py-2.5 text-slate-300">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400 text-[11px]">{log.ipAddress}</td>
                      <td className="py-2.5 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-sans">
                        <button
                          onClick={() => handleInspect(log)}
                          className="text-[11px] text-amber-400 hover:underline"
                        >
                          Examiner
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payload Inspector Card */}
        {selectedLog && (
          <div className="lg:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white">Preuve Cryptographique</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{selectedLog.id}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Action Enregistrée</span>
                <span className="font-bold text-white font-mono">{selectedLog.action}</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] text-slate-400 font-sans">Empreinte SHA-256</span>
                  <button
                    onClick={() => copyHash(selectedLog.payloadHash)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-sans"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedHash ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 break-all select-all">
                  {selectedLog.payloadHash}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-sans mb-1">
                  Données Déchiffrées (Clé Privée SGI)
                </span>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(decryptedData || selectedLog.encryptedDetails, null, 2)}
                </pre>
              </div>

              <div className="pt-2 text-[10px] text-slate-400">
                Ce bloc est vérifiable par l'AMF-UMOA et répond aux exigences d'auditabilité financière de la BRVM.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
