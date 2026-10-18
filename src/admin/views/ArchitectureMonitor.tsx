import React, { useState } from 'react';
import type { RedisCacheStats } from '../../types/index.ts';
import { redisCache } from '../../services/redisCache.ts';
import { wsBroker } from '../../services/webSocketBroker.ts';
import {
  Server,
  Database,
  Wifi,
  Cpu,
  Layers,
  Lock,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  Key,
} from 'lucide-react';

interface ArchitectureMonitorProps {
  redisStats: RedisCacheStats;
}

export const ArchitectureMonitor: React.FC<ArchitectureMonitorProps> = ({ redisStats }) => {
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);
  const wsStatus = wsBroker.getStatus();

  const handleClearCache = () => {
    const count = redisCache.invalidatePattern('quote:');
    setClearedNotice(`Cache Redis invalidé : ${count} clés de cotation réinitialisées.`);
    setTimeout(() => setClearedNotice(null), 3000);
  };

  const hitRatio =
    redisStats.hits + redisStats.misses > 0
      ? ((redisStats.hits / (redisStats.hits + redisStats.misses)) * 100).toFixed(1)
      : '98.4';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Topologie des Microservices & Architecture Backend
          </h1>
          <p className="text-xs text-slate-400">
            Passerelle API REST, Moteur d'Appariement BRVM, Cache Redis & Indexation Base de Données
          </p>
        </div>
        <button
          onClick={handleClearCache}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Invalider le Cache Redis</span>
        </button>
      </div>

      {clearedNotice && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{clearedNotice}</span>
        </div>
      )}

      {/* Microservice Architecture Topology Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Service 1: API Gateway */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">REST API Gateway</h3>
                <span className="text-[10px] text-emerald-400 font-mono">Port 3000 · Actif</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              200 OK
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Point d'entrée unique pour l'application mobile Android et le portail web SGI.
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Routage & Rate Limiting</span>
              <span className="text-white">500 req/s</span>
            </div>
            <div className="flex justify-between">
              <span>Authentification</span>
              <span className="text-white">JWT + 2FA Bearer</span>
            </div>
          </div>
        </div>

        {/* Service 2: Core Matching Engine */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Core Engine BRVM</h3>
                <span className="text-[10px] text-emerald-400 font-mono">Order Book Matcher</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              1.2ms
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Appariement continu prix-temps, calcul des soldes en FCFA et frais AMF-UMOA.
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Algorithme</span>
              <span className="text-white">Price-Time Priority</span>
            </div>
            <div className="flex justify-between">
              <span>Frais réglementaires</span>
              <span className="text-white">BRVM 0.20% · SGI 0.50%</span>
            </div>
          </div>
        </div>

        {/* Service 3: Redis Cache */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Redis In-Memory Cache</h3>
                <span className="text-[10px] text-emerald-400 font-mono">Cluster v7.2</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
              {hitRatio}% Hit
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Mise en cache rapide des cotations BRVM, carnets d'ordres et sessions actives.
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Requêtes Cache</span>
              <span className="text-white">{redisStats.hits.toLocaleString('fr-FR')} Hits / {redisStats.misses} Miss</span>
            </div>
            <div className="flex justify-between">
              <span>Mémoire Allouée</span>
              <span className="text-white">{redisStats.memoryUsedKb} KB</span>
            </div>
          </div>
        </div>

        {/* Service 4: WebSocket Event Broker */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">WebSocket Push Bus</h3>
                <span className="text-[10px] text-emerald-400 font-mono">WSS /ws/v1/market-feed</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
              {wsStatus.latencyMs}ms
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Diffusion temps réel des ticks de marché, carnets de profondeur et notifications.
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Canaux Actifs</span>
              <span className="text-white">{wsStatus.activeChannels} canaux pub/sub</span>
            </div>
            <div className="flex justify-between">
              <span>Messages Diffusés</span>
              <span className="text-white">{wsStatus.totalMessagesSent.toLocaleString('fr-FR')}</span>
            </div>
          </div>
        </div>

        {/* Service 5: Database Schema */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Base Relationnelle Indexée</h3>
                <span className="text-[10px] text-emerald-400 font-mono">PostgreSQL Optimisé</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              B-Tree + Hash
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Schéma relationnel optimisé pour faible latence, concurrence et intégrité financière ACID.
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Index Orders</span>
              <span className="text-white">(symbol, status, created_at)</span>
            </div>
            <div className="flex justify-between">
              <span>Index Portfolio</span>
              <span className="text-white">(user_id, symbol) UNIQUE</span>
            </div>
          </div>
        </div>

        {/* Service 6: Cryptographic & Security Compliance */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sécurité, MFA & Biométrie</h3>
                <span className="text-[10px] text-emerald-400 font-mono">Norme BCEAO / AMF</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              AES-256
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Double authentification (TOTP), signature biométrique FaceID/Fingerprint et E2EE.
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Preuve d'Ordre</span>
              <span className="text-white">SHA-256 Chained Hash</span>
            </div>
            <div className="flex justify-between">
              <span>Chiffrement Payload</span>
              <span className="text-white">AES-256-GCM End-to-End</span>
            </div>
          </div>
        </div>
      </div>

      {/* Relational Database DDL Schema Inspection */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white">Schéma DDL de la Base de Données BRVM</h2>
            <p className="text-xs text-slate-400">Définition SQL avec index composites pour transactions concurrentes</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">ACID · Low-Latency Indexing</span>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`-- Table des Portefeuilles & Soldes Investisseurs
CREATE TABLE portfolios (
    user_id VARCHAR(64) PRIMARY KEY,
    cash_balance_xof NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    reserved_cash_xof NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des Positions Titres BRVM
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL REFERENCES portfolios(user_id),
    symbol VARCHAR(16) NOT NULL,
    shares INT NOT NULL CHECK (shares >= 0),
    average_buy_price NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(16, 2) NOT NULL,
    CONSTRAINT uq_user_symbol UNIQUE(user_id, symbol)
);
CREATE INDEX idx_positions_user ON positions(user_id);

-- Table des Ordres avec Index Composites pour Haute Fréquence
CREATE TABLE trade_orders (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    symbol VARCHAR(16) NOT NULL,
    side VARCHAR(8) NOT NULL, -- BUY, SELL
    type VARCHAR(8) NOT NULL, -- MARKET, LIMIT
    quantity INT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    status VARCHAR(16) NOT NULL, -- PENDING, FILLED, CANCELLED
    brvm_fee NUMERIC(12, 2) NOT NULL,
    sgi_fee NUMERIC(12, 2) NOT NULL,
    execution_hash VARCHAR(66) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_orders_symbol_status_created ON trade_orders(symbol, status, created_at DESC);
CREATE INDEX idx_orders_user_created ON trade_orders(user_id, created_at DESC);`}
        </pre>
      </div>
    </div>
  );
};
