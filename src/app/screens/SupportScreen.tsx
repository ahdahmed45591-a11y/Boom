import React, { useState } from 'react';
import type { SupportMessage } from '../../types/index.ts';
import { dbEngine } from '../../services/mockDatabase.ts';
import { Send, Bot, Headphones, UserCheck, ShieldCheck } from 'lucide-react';

interface SupportScreenProps {
  messages: SupportMessage[];
}

const FAQ_SUGGESTIONS = [
  'Quelles sont les heures de négociation de la BRVM ?',
  'Comment sont calculés les dividendes Sonatel et Orange ?',
  'Quel est le délai de règlement d\'un dépôt Wave ?',
];

export const SupportScreen: React.FC<SupportScreenProps> = ({ messages }) => {
  const [inputText, setInputText] = useState('');

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    dbEngine.sendSupportMessage('INVESTOR', text.trim());
    setInputText('');

    // Auto-reply simulation from SGI Broker advisor after 1.2s
    setTimeout(() => {
      let reply = 'Votre demande a bien été transmise à notre pupitre de négociation SGI Boom Capital.';
      if (text.toLowerCase().includes('heure') || text.toLowerCase().includes('négociation')) {
        reply = 'La séance de cotation officielle de la BRVM se déroule du lundi au vendredi de 09h00 à 15h00 GMT en continu (Fixing et Continu).';
      } else if (text.toLowerCase().includes('dividende')) {
        reply = 'Les dividendes sont versés directement sur votre compte espèces après l\'Assemblée Générale Ordinaire (AGO) des émetteurs cotés.';
      } else if (text.toLowerCase().includes('wave') || text.toLowerCase().includes('dépôt')) {
        reply = 'Les règlements par Wave sont crédités instantanément dès réception de l\'avis de virement par le dépositaire.';
      }
      dbEngine.sendSupportMessage('SGI_SUPPORT', reply);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full space-y-3 px-4 py-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Support SGI Boom Capital</h1>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Négociateurs en ligne (Abidjan & Dakar)
            </p>
          </div>
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[300px]">
        {messages.map(msg => {
          const isMe = msg.sender === 'INVESTOR';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[9px] text-slate-500 mb-0.5 px-1 font-medium">
                {msg.senderName} · {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                  isMe
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick FAQ Suggestion Chips */}
      <div className="space-y-1">
        <span className="text-[10px] text-slate-500 block font-medium">Questions fréquentes :</span>
        <div className="flex flex-wrap gap-1">
          {FAQ_SUGGESTIONS.map((faq, i) => (
            <button
              key={i}
              onClick={() => handleSend(faq)}
              className="text-[10px] text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-2 py-1 text-left transition-colors"
            >
              {faq}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Posez votre question à votre courtier..."
          className="flex-1 py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
        <button
          onClick={() => handleSend()}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
