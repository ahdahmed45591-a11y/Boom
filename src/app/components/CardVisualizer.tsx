import React from 'react';
import type { CardBrand } from '../../types/index.ts';
import { Wifi } from 'lucide-react';

interface CardVisualizerProps {
  brand: CardBrand;
  cardNumber: string; // raw or formatted
  cardholderName: string;
  expiry: string; // MM/YY or MM
  isDefault?: boolean;
}

export const CardVisualizer: React.FC<CardVisualizerProps> = ({
  brand,
  cardNumber,
  cardholderName,
  expiry,
  isDefault = false,
}) => {
  // Masked or display number
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const displayDigits = cleanNumber
    ? cleanNumber.padEnd(16, '•').substring(0, 16).replace(/(\d{4}|\W{4})(?=\S)/g, '$1 ')
    : '•••• •••• •••• 4821';

  const brandStyles: Record<CardBrand, { bg: string; text: string; label: string; accent: string }> = {
    VISA: {
      bg: 'from-blue-900 via-indigo-950 to-slate-950 border-blue-500/40',
      text: 'text-blue-100',
      label: 'VISA',
      accent: 'text-blue-400',
    },
    MASTERCARD: {
      bg: 'from-amber-950 via-slate-900 to-rose-950 border-rose-500/40',
      text: 'text-amber-100',
      label: 'Mastercard',
      accent: 'text-amber-400',
    },
    GIM_UEMOA: {
      bg: 'from-emerald-950 via-slate-900 to-amber-950 border-emerald-500/40',
      text: 'text-emerald-100',
      label: 'GIM-UEMOA',
      accent: 'text-emerald-400',
    },
  };

  const style = brandStyles[brand] || brandStyles.VISA;

  return (
    <div
      className={`relative w-full h-44 rounded-2xl bg-gradient-to-tr ${style.bg} p-4 border shadow-xl flex flex-col justify-between overflow-hidden text-white font-mono transition-all duration-300`}
    >
      {/* Decorative Background Circles */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute right-12 -bottom-10 w-28 h-28 bg-amber-500/10 rounded-full blur-lg pointer-events-none" />

      {/* Top Card Row: EMV Chip & Brand Badge */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          {/* Metallic Gold Chip */}
          <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 border border-yellow-300 shadow-inner flex flex-col justify-around p-1">
            <div className="w-full h-0.5 bg-yellow-700/60" />
            <div className="w-full h-0.5 bg-yellow-700/60" />
          </div>
          {/* Contactless waves */}
          <Wifi className="w-4 h-4 text-slate-300/80 rotate-90" />
        </div>

        {/* Brand Logo / Wordmark */}
        <div className="text-right">
          {brand === 'VISA' && (
            <span className="text-lg font-black italic tracking-wider text-white drop-shadow">
              VISA
            </span>
          )}
          {brand === 'MASTERCARD' && (
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-rose-500 opacity-90 -mr-2" />
              <div className="w-5 h-5 rounded-full bg-amber-400 opacity-90" />
            </div>
          )}
          {brand === 'GIM_UEMOA' && (
            <div className="flex flex-col items-end">
              <span className="text-xs font-black tracking-tight text-emerald-400">GIM-UEMOA</span>
              <span className="text-[8px] text-amber-300/80 -mt-0.5 uppercase tracking-widest">
                Zone Franc
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Middle Card Row: 16 Digits Number */}
      <div className="z-10 my-auto">
        <div className="text-base sm:text-lg tracking-[0.2em] font-semibold text-slate-100 drop-shadow tabular-nums">
          {displayDigits}
        </div>
        {isDefault && (
          <span className="text-[9px] uppercase tracking-wider font-sans font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block mt-0.5">
            Carte Principale
          </span>
        )}
      </div>

      {/* Bottom Card Row: Cardholder Name & Expiry */}
      <div className="flex justify-between items-end z-10 text-xs">
        <div>
          <span className="text-[8px] uppercase tracking-widest text-slate-400 block font-sans">
            Titulaire de la Carte
          </span>
          <span className="font-bold text-slate-200 tracking-wide font-sans text-xs uppercase truncate max-w-[180px] block">
            {cardholderName || 'AMADOU KONE'}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[8px] uppercase tracking-widest text-slate-400 block font-sans">
            Expire Fin
          </span>
          <span className="font-bold text-slate-200 tabular-nums">
            {expiry || '09/28'}
          </span>
        </div>
      </div>
    </div>
  );
};
