import React, { useState } from 'react';
import { dbEngine } from '../../services/mockDatabase.ts';
import type { AuthUser, AuthProvider } from '../../types/index.ts';
import { ShieldCheck, Lock, Sparkles, CheckCircle2, ChevronRight, ArrowRight } from 'lucide-react';

interface AuthGateScreenProps {
  onAuthenticated: (user: AuthUser) => void;
  onCancel?: () => void;
}

export const AuthGateScreen: React.FC<AuthGateScreenProps> = ({ onAuthenticated, onCancel }) => {
  const [selectedProvider, setSelectedProvider] = useState<AuthProvider | null>(null);
  const [googleAccountPickerOpen, setGoogleAccountPickerOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('baoufinance@gmail.com');
  const [customName, setCustomName] = useState('Amadou Koné');
  const [isLoading, setIsLoading] = useState(false);

  // Available Gmail presets for easy 1-click test
  const googleAccounts = [
    { email: 'baoufinance@gmail.com', name: 'Baou Finance (Compte Principal)', avatar: 'BF' },
    { email: 'amadou.kone@gmail.com', name: 'Amadou Koné (Investisseur)', avatar: 'AK' },
  ];

  const handleGoogleLogin = (email: string, name: string) => {
    setIsLoading(true);
    setTimeout(() => {
      const user = dbEngine.loginWithSocial('GOOGLE', email, name);
      setIsLoading(false);
      onAuthenticated(user);
    }, 700);
  };

  const handleAppleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const user = dbEngine.loginWithSocial('APPLE', 'amadou.kone@icloud.com', 'Amadou Koné');
      setIsLoading(false);
      onAuthenticated(user);
    }, 700);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    setIsLoading(true);
    setTimeout(() => {
      const user = dbEngine.loginWithSocial('EMAIL', customEmail, customName);
      setIsLoading(false);
      onAuthenticated(user);
    }, 600);
  };

  return (
    <div className="min-h-[640px] flex flex-col justify-between p-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Top Branding */}
      <div className="space-y-4 pt-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Agrément AMF-UMOA N° 042/2021 · BRVM</span>
        </div>

        <div>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/20 mb-3">
            B
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">BOOM BRVM</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto">
            La bourse ouest-africaine dans votre poche. Négociez Sonatel, Orange CI et Ecobank en direct.
          </p>
        </div>
      </div>

      {/* Social Auth Buttons */}
      <div className="space-y-3 my-6">
        <div className="text-center mb-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Connexion & Ouverture de Compte
          </span>
        </div>

        {/* 1. Continuer avec Google (Gmail) */}
        <button
          onClick={() => setGoogleAccountPickerOpen(true)}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 shadow-lg shadow-white/5 active:scale-[0.98] transition-all"
        >
          {/* Authentic Google Multi-color G */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.26 21.36 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.41l4.02-3.13z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.26 6.59l4.02 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
            />
          </svg>
          <span>Continuer avec Google (Gmail)</span>
        </button>

        {/* 2. Continuer avec Apple (iCloud) */}
        <button
          onClick={handleAppleLogin}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-slate-900 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all"
        >
          {/* Apple Logo SVG */}
          <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.06-7.66-7.79-11.91-14.2-6.53-9.8-11.58-20.91-15.15-33.34-3.57-12.42-5.36-24.31-5.36-35.67 0-14.37 3.58-26.69 10.74-36.98 7.16-10.28 16.51-15.54 28.05-15.77 4.12 0 8.92 1.05 14.4 3.17 5.48 2.12 9.53 3.29 12.16 3.49 2.12-.2 6.26-1.37 12.43-3.49 6.16-2.12 11.02-3.12 14.57-3 10.73.43 19.64 4.38 26.71 11.84-9.35 5.66-13.9 13.55-13.67 23.68.23 8.04 3.22 14.77 8.97 20.19 5.75 5.42 12.63 8.52 20.64 9.3-2.23 6.96-5.07 14.07-8.52 21.32zM119.22 31.95c0-7.39 2.65-14.28 7.95-20.67 5.3-6.39 11.83-10.42 19.59-12.08.33 1.09.49 2.18.49 3.26 0 7.39-2.73 14.34-8.19 20.85-5.46 6.51-12.05 10.36-19.78 11.55-.06-.98-.06-1.94-.06-2.91z" />
          </svg>
          <span>Continuer avec Apple (iCloud)</span>
        </button>

        {/* 3. Option Email / Formulaire */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-slate-900 px-2 text-slate-500 font-mono">ou avec adresse email</span>
          </div>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-2">
          <input
            type="email"
            value={customEmail}
            onChange={e => setCustomEmail(e.target.value)}
            placeholder="Votre adresse email (ex: baoufinance@gmail.com)"
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span>Ouvrir avec Email & Mot de Passe</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/80 text-center space-y-2">
        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" />
            2FA & Biométrie
          </span>
          <span>·</span>
          <span>Compte Titres SGI</span>
          <span>·</span>
          <span>BCEAO RTGS</span>
        </div>
        <p className="text-[10px] text-slate-500 max-w-[280px] mx-auto">
          En vous connectant, vous acceptez le règlement général de la BRVM et la politique de protection des données financières.
        </p>
      </div>

      {/* Google Account Picker Modal */}
      {googleAccountPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.41l4.02-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.26 6.59l4.02 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
                />
              </svg>
              <div>
                <h3 className="text-xs font-bold text-white">Connexion avec Google</h3>
                <p className="text-[10px] text-slate-400">Sélectionnez un compte pour ouvrir Boom</p>
              </div>
            </div>

            <div className="space-y-1.5">
              {googleAccounts.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => {
                    setGoogleAccountPickerOpen(false);
                    handleGoogleLogin(acc.email, acc.name);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs flex items-center justify-center">
                      {acc.avatar}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white truncate max-w-[170px]">{acc.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[170px]">{acc.email}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setGoogleAccountPickerOpen(false)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
