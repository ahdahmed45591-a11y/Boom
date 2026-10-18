import React, { useState } from 'react';
import { securityService } from '../../services/securityService.ts';
import { ShieldCheck, Fingerprint, Lock, Key, X, Check, Copy } from 'lucide-react';

interface SecurityModalProps {
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ onClose }) => {
  const [isMfaActive, setIsMfaActive] = useState(securityService.isMfaEnabled());
  const [isBioActive, setIsBioActive] = useState(securityService.isBiometricEnabled());
  const [totpCode, setTotpCode] = useState(securityService.generateTotpCode());
  const [copiedKey, setCopiedKey] = useState(false);

  const toggleMfa = () => {
    const next = !isMfaActive;
    setIsMfaActive(next);
    securityService.setMfaEnabled(next);
  };

  const toggleBio = () => {
    const next = !isBioActive;
    setIsBioActive(next);
    securityService.setBiometricEnabled(next);
  };

  const copyKey = () => {
    navigator.clipboard.writeText('JBSWY3DPEHPK3PXP');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-[400px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sécurité & Conformité Réglementaire</h3>
              <p className="text-[11px] text-slate-400">Standards AMF-UMOA / BCEAO</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Biometrics Toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Signature Biométrique</h4>
              <p className="text-[10px] text-slate-400">FaceID / Empreinte digitale lors de chaque ordre</p>
            </div>
          </div>
          <button
            onClick={toggleBio}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              isBioActive ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isBioActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 2FA MFA Toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Double Authentification (2FA / TOTP)</h4>
              <p className="text-[10px] text-slate-400">Google Authenticator ou SMS OTP obligatoire</p>
            </div>
          </div>
          <button
            onClick={toggleMfa}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              isMfaActive ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isMfaActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Active TOTP Code Preview for Easy Testing */}
        {isMfaActive && (
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Code TOTP actuel (30s) :</span>
              <span className="font-mono font-bold text-sm text-amber-400 tracking-wider">
                {totpCode}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>Clé secrète: JBSWY3DPEHPK3PXP</span>
              <button
                onClick={copyKey}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-sans"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedKey ? 'Copié' : 'Copier'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Encryption Audit Note */}
        <div className="p-3 rounded-xl bg-slate-950 text-[11px] text-slate-400 border border-slate-800/80 space-y-1">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Chiffrement de Bout-en-Bout (E2EE)</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Toutes les transactions et pièces d'identité KYC sont scellées avec des clés cryptographiques AES-GCM et hachées en SHA-256 dans le registre d'audit de la SGI.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700"
        >
          Enregistrer et Fermer
        </button>
      </div>
    </div>
  );
};
