import React, { useState } from 'react';
import type { StockQuote, OrderSide, OrderType, UserPortfolio, TradeOrder } from '../../types/index.ts';
import { calculateTradingFees } from '../../services/tradingEngine.ts';
import { dbEngine } from '../../services/mockDatabase.ts';
import { securityService } from '../../services/securityService.ts';
import {
  X,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Fingerprint,
  Lock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronDown,
} from 'lucide-react';

interface StockDetailModalProps {
  stock: StockQuote;
  portfolio: UserPortfolio;
  onClose: () => void;
  onOrderExecuted: (order: TradeOrder) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  portfolio,
  onClose,
  onOrderExecuted,
}) => {
  const [activeTab, setActiveTab] = useState<'CHART' | 'ORDERBOOK' | 'INFO'>('ORDERBOOK');
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState<number>(5);
  const [limitPrice, setLimitPrice] = useState<number>(stock.price);
  const [timeframe, setTimeframe] = useState<'1J' | '1S' | '1M' | '1A'>('1J');

  // Execution & Biometric states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'IDLE' | 'BIOMETRIC_SCAN' | 'MFA_INPUT' | 'SUCCESS'>('IDLE');
  const [mfaCode, setMfaCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [executedOrder, setExecutedOrder] = useState<TradeOrder | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Fee calculation
  const targetPrice = orderType === 'MARKET' ? stock.price : limitPrice;
  const fees = calculateTradingFees(quantity, targetPrice, side);

  const existingPosition = portfolio.positions.find(p => p.symbol === stock.symbol);
  const availableShares = existingPosition?.shares || 0;

  const handleStartOrder = () => {
    setErrorMessage(null);
    if (quantity <= 0) {
      setErrorMessage('Veuillez saisir une quantité supérieure à 0');
      return;
    }

    if (side === 'BUY' && portfolio.cashBalanceXof < fees.netTotal) {
      setErrorMessage(
        `Solde espèces insuffisant. Requis: ${fees.netTotal.toLocaleString('fr-FR')} XOF, Disponible: ${portfolio.cashBalanceXof.toLocaleString('fr-FR')} XOF`
      );
      return;
    }

    if (side === 'SELL' && availableShares < quantity) {
      setErrorMessage(`Vous ne possédez que ${availableShares} titres ${stock.symbol}`);
      return;
    }

    // Launch Biometric / MFA flow
    if (securityService.isBiometricEnabled()) {
      setVerificationStep('BIOMETRIC_SCAN');
      setIsVerifying(true);
      // Simulate biometric scan
      setTimeout(() => {
        if (securityService.isMfaEnabled()) {
          setVerificationStep('MFA_INPUT');
          setMfaCode(securityService.generateTotpCode()); // Pre-fill with valid TOTP for smooth testing
        } else {
          confirmTrade(true, true);
        }
      }, 900);
    } else if (securityService.isMfaEnabled()) {
      setVerificationStep('MFA_INPUT');
      setIsVerifying(true);
      setMfaCode(securityService.generateTotpCode());
    } else {
      confirmTrade(false, false);
    }
  };

  const confirmTrade = (bioVerified: boolean, mfaVerified: boolean) => {
    setIsVerifying(false);
    const result = dbEngine.executeOrder({
      symbol: stock.symbol,
      side,
      type: orderType,
      quantity,
      price: targetPrice,
      mfaVerified,
      biometricVerified: bioVerified,
    });

    if (result.success && result.order) {
      setExecutedOrder(result.order);
      setVerificationStep('SUCCESS');
      onOrderExecuted(result.order);
    } else {
      setErrorMessage(result.message || 'Échec de l\'exécution de l\'ordre');
      setVerificationStep('IDLE');
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-[420px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-20">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{stock.symbol}</h2>
              <span className="text-xs text-slate-400">· {stock.country}</span>
              <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                {stock.sector}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[240px]">{stock.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 flex-1">
          {/* Price Overview Banner */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {stock.price.toLocaleString('fr-FR')}
              </span>
              <span className="ml-1 text-xs text-amber-400 font-semibold">XOF</span>
            </div>
            <div className={`flex items-center gap-1 font-mono font-semibold text-xs px-2.5 py-1 rounded-lg ${
              stock.changePercent >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
            }`}>
              {stock.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}% ({stock.change >= 0 ? '+' : ''}{stock.change} XOF)</span>
            </div>
          </div>

          {/* Subtabs: Orderbook / Chart / Info */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('ORDERBOOK')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'ORDERBOOK' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Carnet d'Ordres
            </button>
            <button
              onClick={() => setActiveTab('CHART')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'CHART' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Graphique
            </button>
            <button
              onClick={() => setActiveTab('INFO')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'INFO' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Données BRVM
            </button>
          </div>

          {/* Tab 1: Live Order Book Depth */}
          {activeTab === 'ORDERBOOK' && (
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
              <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-2 border-b border-slate-800 pb-1">
                <span className="text-emerald-400">ACHATS (BIDS)</span>
                <span className="text-rose-400">VENTES (ASKS)</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                {/* Bids Column */}
                <div className="space-y-1">
                  {stock.bids.slice(0, 5).map((bid, i) => (
                    <div key={i} className="flex justify-between items-center relative py-0.5 px-1 rounded">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 rounded"
                        style={{ width: `${Math.min(100, (bid.quantity / 2500) * 100)}%` }}
                      />
                      <span className="relative z-10 text-slate-400 text-[11px] tabular-nums">{bid.quantity}</span>
                      <span className="relative z-10 text-emerald-400 font-semibold tabular-nums">{bid.price.toLocaleString('fr-FR')}</span>
                    </div>
                  ))}
                </div>

                {/* Asks Column */}
                <div className="space-y-1">
                  {stock.asks.slice(0, 5).map((ask, i) => (
                    <div key={i} className="flex justify-between items-center relative py-0.5 px-1 rounded">
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-rose-500/10 rounded"
                        style={{ width: `${Math.min(100, (ask.quantity / 2500) * 100)}%` }}
                      />
                      <span className="relative z-10 text-rose-400 font-semibold tabular-nums">{ask.price.toLocaleString('fr-FR')}</span>
                      <span className="relative z-10 text-slate-400 text-[11px] tabular-nums">{ask.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 text-center font-mono">
                Profondeur temps réel synchronisée via WebSocket (WSS)
              </div>
            </div>
          )}

          {/* Tab 2: Price Chart */}
          {activeTab === 'CHART' && (
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">Évolution du cours</span>
                <div className="flex gap-1 text-[10px]">
                  {(['1J', '1S', '1M', '1A'] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2 py-0.5 rounded ${
                        timeframe === tf ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              {/* SVG Sparkline Chart */}
              <div className="h-32 w-full flex items-end pt-4 pb-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,80 50,70 100,75 150,50 200,45 250,30 300,20"
                  />
                  <polygon
                    fill="url(#grad)"
                    points="0,80 50,70 100,75 150,50 200,45 250,30 300,20 300,100 0,100"
                  />
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>09:00</span>
                <span>11:00</span>
                <span>13:00</span>
                <span>14:30 GMT</span>
              </div>
            </div>
          )}

          {/* Tab 3: Key Ratios */}
          {activeTab === 'INFO' && (
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900">
                <span className="text-[10px] text-slate-400 block">Capitalisation</span>
                <span className="font-mono font-bold text-slate-100 tabular-nums">
                  {(stock.marketCap / 1000).toFixed(1)} Mrd XOF
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900">
                <span className="text-[10px] text-slate-400 block">Rendement Dividende</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  {stock.dividendYield}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900">
                <span className="text-[10px] text-slate-400 block">PER (Price Earning)</span>
                <span className="font-mono font-bold text-slate-100 tabular-nums">{stock.peRatio}x</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900">
                <span className="text-[10px] text-slate-400 block">Volume Journalier</span>
                <span className="font-mono font-bold text-slate-100 tabular-nums">
                  {stock.volume.toLocaleString('fr-FR')} titres
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900">
                <span className="text-[10px] text-slate-400 block">Plus Haut 52S</span>
                <span className="font-mono font-bold text-slate-100 tabular-nums">
                  {stock.high.toLocaleString('fr-FR')} XOF
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900">
                <span className="text-[10px] text-slate-400 block">Plus Bas 52S</span>
                <span className="font-mono font-bold text-slate-100 tabular-nums">
                  {stock.low.toLocaleString('fr-FR')} XOF
                </span>
              </div>
            </div>
          )}

          {/* Trade Execution Slip */}
          <div className="rounded-2xl bg-slate-950 p-3.5 border border-slate-800 space-y-3">
            {/* BUY / SELL Switch */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl">
              <button
                onClick={() => setSide('BUY')}
                className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                  side === 'BUY'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Acheter
              </button>
              <button
                onClick={() => setSide('SELL')}
                className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                  side === 'SELL'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vendre {availableShares > 0 && `(${availableShares})`}
              </button>
            </div>

            {/* Order Type Toggle: Market vs Limit */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Type d'ordre:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setOrderType('MARKET')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                    orderType === 'MARKET' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400'
                  }`}
                >
                  Au Marché
                </button>
                <button
                  onClick={() => setOrderType('LIMIT')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                    orderType === 'LIMIT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400'
                  }`}
                >
                  À Cours Limité
                </button>
              </div>
            </div>

            {/* Limit Price Input if LIMIT */}
            {orderType === 'LIMIT' && (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Prix Limite d'Exécution (XOF)</label>
                <input
                  type="number"
                  value={limitPrice}
                  onChange={e => setLimitPrice(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl font-mono text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {/* Quantity Input */}
            <div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                <span>Quantité de titres</span>
                {side === 'SELL' && (
                  <span>Possédé: <strong className="text-white">{availableShares}</strong></span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold hover:bg-slate-800"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="flex-1 py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-center font-mono font-bold text-sm text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold hover:bg-slate-800"
                >
                  +
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-1.5">
                {[1, 5, 10, 50].map(qty => (
                  <button
                    key={qty}
                    onClick={() => setQuantity(qty)}
                    className="py-1 text-[10px] font-mono font-semibold rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  >
                    +{qty}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Fee Breakdown */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Montant Brut ({quantity} × {targetPrice.toLocaleString('fr-FR')} XOF)</span>
                <span className="font-mono text-slate-200 tabular-nums">{fees.grossAmount.toLocaleString('fr-FR')} XOF</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Commission SGI Boom (0.50%)</span>
                <span className="font-mono text-slate-300 tabular-nums">{fees.sgiFee.toLocaleString('fr-FR')} XOF</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Frais BRVM (0.20%) + AMF-UMOA (0.10%)</span>
                <span className="font-mono text-slate-300 tabular-nums">
                  {(fees.brvmFee + fees.crepmfFee).toLocaleString('fr-FR')} XOF
                </span>
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-xs text-white">
                <span>{side === 'BUY' ? 'Total Débité' : 'Total Crédité'}</span>
                <span className="font-mono text-amber-400 tabular-nums">{fees.netTotal.toLocaleString('fr-FR')} XOF</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleStartOrder}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
                side === 'BUY'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {side === 'BUY' ? 'Confirmer l\'Achat de' : 'Confirmer la Vente de'} {quantity} {stock.symbol}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Biometric Verification Modal */}
      {isVerifying && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            {verificationStep === 'BIOMETRIC_SCAN' && (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
                  <Fingerprint className="w-9 h-9" />
                </div>
                <h3 className="text-sm font-bold text-white">Authentification Biométrique</h3>
                <p className="text-xs text-slate-400">
                  Scannez votre empreinte ou FaceID pour signer la transaction réglementaire BRVM.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Module cryptographique sécurisé AMF-UMOA
                </div>
              </>
            )}

            {verificationStep === 'MFA_INPUT' && (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-white">Validation 2FA / OTP</h3>
                <p className="text-xs text-slate-400">
                  Code de sécurité généré sur votre application d'authentification:
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value)}
                  className="w-36 mx-auto text-center font-mono font-bold text-lg tracking-widest py-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => confirmTrade(true, true)}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Valider et Exécuter
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Trade Execution Success Receipt Modal */}
      {verificationStep === 'SUCCESS' && executedOrder && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Ordre Exécuté avec Succès</h3>
              <p className="text-xs text-slate-400">Bourse Régionale des Valeurs Mobilières (BRVM)</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">N° d'Ordre</span>
                <span className="text-slate-200 font-bold">{executedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Titre & Sens</span>
                <span className={executedOrder.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                  {executedOrder.side === 'BUY' ? 'ACHAT' : 'VENTE'} {executedOrder.quantity} {executedOrder.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cours d'Exécution</span>
                <span className="text-white">{executedOrder.price.toLocaleString('fr-FR')} XOF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Frais BRVM + SGI</span>
                <span className="text-slate-300">
                  {(executedOrder.brvmFee + executedOrder.crepmfFee + executedOrder.sgiFee).toLocaleString('fr-FR')} XOF
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1 font-bold">
                <span className="text-slate-300">Montant Net</span>
                <span className="text-amber-400">{executedOrder.totalCostXof.toLocaleString('fr-FR')} XOF</span>
              </div>
            </div>

            {/* SHA-256 Execution Hash */}
            <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800/80 text-[10px] text-left">
              <div className="flex justify-between items-center text-slate-400 mb-0.5">
                <span>Preuve Cryptographique SHA-256</span>
                <button
                  onClick={() => copyHash(executedOrder.executionHash)}
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-sans"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedHash ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <div className="font-mono text-slate-300 truncate">
                {executedOrder.executionHash}
              </div>
            </div>

            <button
              onClick={() => {
                setVerificationStep('IDLE');
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700"
            >
              Fermer et Consulter le Portefeuille
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
