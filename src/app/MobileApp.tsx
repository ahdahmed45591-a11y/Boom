import React, { useState, useEffect } from 'react';
import { AndroidFrame } from './components/AndroidFrame.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';
import { MarketScreen } from './screens/MarketScreen.tsx';
import { StockDetailModal } from './screens/StockDetailModal.tsx';
import { PortfolioScreen } from './screens/PortfolioScreen.tsx';
import { KycScreen } from './screens/KycScreen.tsx';
import { SupportScreen } from './screens/SupportScreen.tsx';
import { SecurityModal } from './screens/SecurityModal.tsx';
import { AuthGateScreen } from './screens/AuthGateScreen.tsx';
import { CardManagerModal } from './screens/CardManagerModal.tsx';
import { dbEngine } from '../services/mockDatabase.ts';
import type {
  StockQuote,
  TradeOrder,
  KycRecord,
  UserPortfolio,
  SupportMessage,
  AuthUser,
  PaymentCard,
} from '../types/index.ts';

interface MobileAppProps {
  onOrderExecutedInMobile?: (order: TradeOrder) => void;
}

export const MobileApp: React.FC<MobileAppProps> = ({ onOrderExecutedInMobile }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'market' | 'portfolio' | 'kyc' | 'support'>('home');
  const [quotes, setQuotes] = useState<StockQuote[]>(dbEngine.getQuotes());
  const [portfolio, setPortfolio] = useState<UserPortfolio>(dbEngine.getPortfolio());
  const [orders, setOrders] = useState<TradeOrder[]>(dbEngine.getOrders());
  const [kycRecord, setKycRecord] = useState<KycRecord | undefined>(dbEngine.getUserKyc());
  const [messages, setMessages] = useState<SupportMessage[]>(dbEngine.getSupportMessages());
  const [currentUser, setCurrentUser] = useState<AuthUser>(dbEngine.getCurrentUser());
  const [cards, setCards] = useState<PaymentCard[]>(dbEngine.getUserCards());

  // Modals
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isCardManagerOpen, setIsCardManagerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync state on database events
  useEffect(() => {
    const unsubscribe = dbEngine.subscribe(() => {
      setQuotes([...dbEngine.getQuotes()]);
      setPortfolio({ ...dbEngine.getPortfolio() });
      setOrders([...dbEngine.getOrders()]);
      setKycRecord(dbEngine.getUserKyc());
      setMessages([...dbEngine.getSupportMessages()]);
      setCurrentUser({ ...dbEngine.getCurrentUser() });
      setCards([...dbEngine.getUserCards()]);
    });
    return () => unsubscribe();
  }, []);

  const handleOrderExecuted = (order: TradeOrder) => {
    setOrders([...dbEngine.getOrders()]);
    setPortfolio({ ...dbEngine.getPortfolio() });
    if (onOrderExecutedInMobile) {
      onOrderExecutedInMobile(order);
    }
  };

  const handleKycUpdated = (record: KycRecord) => {
    setKycRecord(record);
  };

  const unreadMessagesCount = messages.filter(m => m.sender === 'SGI_SUPPORT' && !m.read).length;
  const activeCard = cards.find(c => c.isDefault) || cards[0];

  return (
    <div className="w-full flex items-center justify-center">
      <AndroidFrame
        activeTab={activeTab}
        onTabChange={(tab: any) => setActiveTab(tab)}
        unreadMessagesCount={unreadMessagesCount}
      >
        {/* If user is logged out, show the Auth Onboarding Gate Screen */}
        {!currentUser.isLoggedIn ? (
          <AuthGateScreen
            onAuthenticated={user => {
              setCurrentUser(user);
              setActiveTab('home');
            }}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                portfolio={portfolio}
                quotes={quotes}
                kycRecord={kycRecord}
                recentOrders={orders}
                currentUser={currentUser}
                activeCard={activeCard}
                onSelectStock={stock => setSelectedStock(stock)}
                onOpenDeposit={() => setIsDepositOpen(true)}
                onOpenCardManager={() => setIsCardManagerOpen(true)}
                onNavigateTab={(tab: any) => setActiveTab(tab)}
                onOpenSecurity={() => setIsSecurityOpen(true)}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            )}

            {activeTab === 'market' && (
              <MarketScreen
                quotes={quotes}
                onSelectStock={stock => setSelectedStock(stock)}
              />
            )}

            {activeTab === 'portfolio' && (
              <PortfolioScreen
                portfolio={portfolio}
                quotes={quotes}
                orders={orders}
                cards={cards}
                onSelectStock={stock => setSelectedStock(stock)}
                isDepositModalOpen={isDepositOpen}
                onOpenDeposit={() => setIsDepositOpen(true)}
                onCloseDeposit={() => setIsDepositOpen(false)}
                onOpenCardManager={() => setIsCardManagerOpen(true)}
              />
            )}

            {activeTab === 'kyc' && (
              <KycScreen
                kycRecord={kycRecord}
                onKycUpdated={handleKycUpdated}
              />
            )}

            {activeTab === 'support' && (
              <SupportScreen messages={messages} />
            )}
          </>
        )}
      </AndroidFrame>

      {/* Stock Trading Modal */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          portfolio={portfolio}
          onClose={() => setSelectedStock(null)}
          onOrderExecuted={handleOrderExecuted}
        />
      )}

      {/* Security Modal */}
      {isSecurityOpen && (
        <SecurityModal onClose={() => setIsSecurityOpen(false)} />
      )}

      {/* Credit / Debit Card Manager Modal */}
      {isCardManagerOpen && (
        <CardManagerModal
          cards={cards}
          onClose={() => setIsCardManagerOpen(false)}
          onSelectBuyStocks={() => setActiveTab('market')}
        />
      )}

      {/* Profile & Auth Switcher Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Profil & Authentification</h3>
                <p className="text-[10px] text-slate-400">Compte Boursier SGI Boom Capital</p>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold text-sm shadow-md">
                {currentUser.name
                  .split(' ')
                  .map(p => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">
                    Compte N° {currentUser.accountNumber}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                    {currentUser.provider}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setIsCardManagerOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span>Mes Cartes de Crédit ({cards.length})</span>
                <span className="text-amber-400 text-[11px]">Gérer</span>
              </button>

              <button
                onClick={() => {
                  dbEngine.logoutUser();
                  setIsAuthModalOpen(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors"
              >
                Changer de compte / Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

