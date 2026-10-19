import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Sparkles, Smartphone, Monitor } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadMessagesCount?: number;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTab,
  onTabChange,
  unreadMessagesCount = 0,
}) => {
  const [currentTime, setCurrentTime] = useState('09:42');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const isNative = typeof window !== 'undefined' && (
    Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
    window.location.protocol === 'capacitor:'
  );

  if (isNative) {
    return (
      <div className="w-full h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-16 bg-slate-950 text-slate-100 flex flex-col">
          {children}
        </div>
        <nav
          aria-label="Navigation principale mobile"
          className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-around px-2 z-40"
        >
          <button
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${
              activeTab === 'home' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] tracking-tight">Accueil</span>
          </button>

          <button
            onClick={() => onTabChange('market')}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${
              activeTab === 'market' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-[10px] tracking-tight">Marché</span>
          </button>

          <button
            onClick={() => onTabChange('portfolio')}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${
              activeTab === 'portfolio' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-[10px] tracking-tight">Portefeuille</span>
          </button>

          <button
            onClick={() => onTabChange('kyc')}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-colors relative ${
              activeTab === 'kyc' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-[10px] tracking-tight">KYC</span>
          </button>

          <button
            onClick={() => onTabChange('support')}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-colors relative ${
              activeTab === 'support' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-[10px] tracking-tight">Support</span>
            {unreadMessagesCount > 0 && (
              <span className="absolute top-1 right-3 w-4 h-4 bg-amber-500 text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center">
                {unreadMessagesCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-0 sm:p-4 w-full">
      {/* Android Device Shell */}
      <div className="relative w-full max-w-[420px] h-[780px] sm:h-[840px] bg-slate-950 sm:rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_8px_#1e293b,0_0_0_10px_#334155] sm:border sm:border-slate-700/50 overflow-hidden flex flex-col">
        {/* Top Camera Punch Hole & Speaker */}
        <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-6 z-50 pointer-events-none select-none">
          <span className="text-xs font-semibold text-slate-200 tracking-tight">{currentTime}</span>
          {/* Centered Camera Cutout */}
          <div className="w-3.5 h-3.5 bg-black rounded-full ring-2 ring-slate-800/80 -mt-1 mx-auto flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
          </div>
          {/* Status Icons */}
          <div className="flex items-center gap-1.5 text-slate-200">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-mono">98%</span>
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Screen Content Viewport */}
        <div className="flex-1 overflow-y-auto pt-8 pb-16 bg-slate-950 text-slate-100 flex flex-col">
          {children}
        </div>

        {/* Fixed Android Bottom Tab Bar */}
        <nav
          aria-label="Navigation principale mobile"
          className="absolute bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-around px-2 z-40"
        >
          <button
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${
              activeTab === 'home' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] tracking-tight">Accueil</span>
          </button>

          <button
            onClick={() => onTabChange('market')}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${
              activeTab === 'market' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-[10px] tracking-tight">Marché</span>
          </button>

          <button
            onClick={() => onTabChange('portfolio')}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${
              activeTab === 'portfolio' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-[10px] tracking-tight">Portefeuille</span>
          </button>

          <button
            onClick={() => onTabChange('kyc')}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-colors relative ${
              activeTab === 'kyc' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-[10px] tracking-tight">KYC</span>
          </button>

          <button
            onClick={() => onTabChange('support')}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-colors relative ${
              activeTab === 'support' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {unreadMessagesCount > 0 && (
              <span className="absolute top-1 right-3 w-2 h-2 bg-amber-500 rounded-full" />
            )}
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-[10px] tracking-tight">Support</span>
          </button>
        </nav>

        {/* Android Home Navigation Pill Indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-500/50 rounded-full pointer-events-none z-50" />
      </div>
    </div>
  );
};
