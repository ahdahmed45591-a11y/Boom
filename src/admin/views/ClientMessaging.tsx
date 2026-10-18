import React, { useState } from 'react';
import type { SupportMessage } from '../../types/index.ts';
import { dbEngine, CURRENT_INVESTOR } from '../../services/mockDatabase.ts';
import { Send, User, MessageSquare, CheckCheck, Clock, ShieldCheck } from 'lucide-react';

interface ClientMessagingProps {
  messages: SupportMessage[];
}

export const ClientMessaging: React.FC<ClientMessagingProps> = ({ messages }) => {
  const [inputText, setInputText] = useState('');

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    dbEngine.sendSupportMessage('SGI_SUPPORT', inputText.trim());
    setInputText('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      {/* Title */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Messagerie & Assistance Clients</h1>
          <p className="text-xs text-slate-400">Canal direct et chiffré entre les conseillers SGI et les investisseurs mobiles</p>
        </div>
      </div>

      {/* 2-Column Split: Conversations list on left, Chat desk on right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left: Active conversations */}
        <div className="md:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col space-y-3">
          <div className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2 flex justify-between items-center">
            <span>Conversations Ouvertes (1)</span>
            <span className="text-[10px] text-emerald-400 font-mono">En direct</span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-amber-500/40 cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">
                    AK
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{CURRENT_INVESTOR.name}</h3>
                    <p className="text-[10px] text-slate-400">Compte 042-8921-CI</p>
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">14:40</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 line-clamp-1">
                {messages[messages.length - 1]?.text || 'Nouvelle conversation'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Active Chat Terminal */}
        <div className="md:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col min-h-0">
          {/* Top Bar of active chat */}
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">
                AK
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{CURRENT_INVESTOR.name}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-normal">
                    Client Vérifié
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">{CURRENT_INVESTOR.email} · {CURRENT_INVESTOR.phone}</p>
              </div>
            </div>

            <div className="text-right text-[11px] font-mono text-slate-400">
              <span>Conseiller assigné: Jean-Marc Kouamé</span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0 pr-2">
            {messages.map(msg => {
              const isBroker = msg.sender === 'SGI_SUPPORT';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isBroker ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-500 mb-1 px-1 font-medium">
                    {msg.senderName} · {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${
                      isBroker
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSend} className="pt-3 border-t border-slate-800 flex gap-2 shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Rédiger une réponse officielle SGI..."
              className="flex-1 py-2.5 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Envoyer</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
