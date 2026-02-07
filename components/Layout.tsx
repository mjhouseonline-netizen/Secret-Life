
import React, { useState } from 'react';
import { AppView, User } from '../types';
import { CreditPurchase } from './CreditPurchase';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  user: User;
  onLogout: () => void;
  onAddCredits: (credits: number) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, user, onLogout, onAddCredits }) => {
  const [showPurchase, setShowPurchase] = useState(false);

  const isAdmin = user.role === 'admin';

  const navItems = [
    { id: 'home', label: 'DASHBOARD' },
    { id: 'poster', label: 'POSTERS' },
    { id: 'comic', label: 'COMICS' },
    { id: 'book', label: 'BOOKS' },
    { id: 'video', label: 'VIDEOS' },
    { id: 'video-editor', label: 'VIDEO EDIT' },
    { id: 'edit', label: 'THE LAB' },
    { id: 'analyze', label: 'INTEL' },
    { id: 'speech', label: 'VOCAL' },
    { id: 'history', label: 'ARCHIVE' },
    { id: 'settings', label: 'SETUP' },
  ];

  const mobileTabs = [
    { id: 'home', label: 'HOME' },
    { id: 'poster', label: 'CREATE' },
    { id: 'video', label: 'ANIMATE' },
    { id: 'history', label: 'LIBRARY' },
    { id: 'settings', label: 'YOU' },
  ];

  return (
    <div className="flex h-screen bg-action-blue text-white overflow-hidden font-sans">
      <div className="absolute inset-0 comic-hatch opacity-10 pointer-events-none"></div>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r-4 border-black bg-white flex flex-col hidden lg:flex relative z-10 shadow-[8px_0px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="p-8 bg-yellow-400 border-b-4 border-black cursor-pointer relative overflow-hidden" onClick={() => setActiveView('home')}>
          <h1 className="text-4xl font-comic tracking-wider text-black transform -rotate-2 leading-none stroke-black-thin">SECRET LIFE!</h1>
          <p className="text-[10px] text-black mt-3 uppercase tracking-widest font-black italic">EST. 2025 STUDIO</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as AppView)}
              className={`w-full flex items-center gap-4 px-5 py-3 border-4 border-black transition-all duration-100 font-comic uppercase tracking-wider ${
                (activeView === item.id || (item.id === 'speech' && activeView === 'live'))
                  ? 'bg-cyan-400 text-black translate-x-1 shadow-[4px_4px_0px_0px_#000]' 
                  : 'bg-white text-zinc-500 hover:bg-zinc-100 hover:text-black hover:translate-x-1'
              }`}
            >
              <span className="text-lg">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t-4 border-black space-y-4 bg-zinc-50">
          <div className="p-5 bg-white border-4 border-black relative overflow-hidden shadow-[6px_6px_0px_0px_#000]">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 border-3 border-black bg-zinc-100 flex items-center justify-center overflow-hidden">
                 {user.avatarUrl ? (
                   <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-xs font-black text-black uppercase">DIR</span>
                 )}
               </div>
               <div className="flex-1 min-w-0 text-black">
                  <p className="text-[8px] font-black uppercase text-zinc-400 italic mb-1">DIRECTOR</p>
                  <p className="text-sm font-black truncate uppercase">{user.username}</p>
               </div>
             </div>

             <div className="flex items-center justify-between bg-zinc-100 p-2 border-2 border-black">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-zinc-400">CREDITS</span>
                  <span className="text-sm font-black text-blue-600">
                    {isAdmin ? 'INF' : user.credits}
                  </span>
                </div>
                {!isAdmin && (
                  <button 
                    onClick={() => setShowPurchase(true)}
                    className="px-2 py-1 bg-yellow-400 text-black text-[9px] font-black uppercase border-2 border-black hover:bg-white transition-all"
                  >
                    ADD
                  </button>
                )}
             </div>
          </div>

          <button 
            onClick={onLogout}
            className="w-full py-3 text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] hover:text-red-500 transition-all"
          >
            DISCONNECT
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-5 bg-white border-b-4 border-black sticky top-0 z-50">
          <h1 className="text-3xl font-comic tracking-wider text-black transform -rotate-1 cursor-pointer" onClick={() => setActiveView('home')}>SECRET LIFE!</h1>
          <div className="flex items-center gap-4">
             <div className="px-4 py-1.5 bg-zinc-100 border-3 border-black text-[11px] font-black uppercase text-blue-600 shadow-[4px_4px_0px_0px_#000]">
               {isAdmin ? 'INF' : user.credits}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 safe-pb-nav custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black flex justify-around items-center px-4 safe-bottom h-20 z-50">
          {mobileTabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as AppView)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
                activeView === item.id ? 'bg-cyan-400 text-black border-x-2 border-black' : 'text-zinc-400'
              }`}
            >
              <span className="text-[12px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>

      {showPurchase && (
        <CreditPurchase 
          onPurchaseComplete={(credits) => {
            onAddCredits(credits);
            setShowPurchase(false);
          }}
          onClose={() => setShowPurchase(false)}
        />
      )}
    </div>
  );
};
