
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
    { id: 'poster', label: 'POSTERS' },
    { id: 'comic', label: 'COMICS' },
    { id: 'book', label: 'BOOKS' },
    { id: 'video', label: 'VIDEOS' },
    { id: 'edit', label: 'THE LAB' },
    { id: 'analyze', label: 'INTEL' },
    { id: 'speech', label: 'VOICE' },
    { id: 'live', label: 'LIVE' },
    { id: 'history', label: 'ARCHIVE' },
    { id: 'settings', label: 'SETUP' },
  ];

  const mobileTabs = [
    { id: 'poster', label: 'CREATE' },
    { id: 'video', label: 'ANIMATE' },
    ...(isAdmin ? [{ id: 'analytics', label: 'INTEL' }] : [{ id: 'live', label: 'LIVE' }]),
    { id: 'history', label: 'LIBRARY' },
    { id: 'settings', label: 'YOU' },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden font-sans">
      {/* Desktop Sidebar - Comic Strip Style */}
      <aside className="w-64 border-r-4 border-black bg-zinc-900 flex flex-col hidden lg:flex">
        <div className="p-6 bg-yellow-400 border-b-4 border-black halftone">
          <h1 className="text-4xl font-comic tracking-wider text-black transform -rotate-2 leading-none">SECRET LIFE!</h1>
          <p className="text-[10px] text-black mt-2 uppercase tracking-widest font-bold">Volume 1: The Dark Studio</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as AppView)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-2 border-black transition-all duration-100 font-comic uppercase tracking-wider ${
                activeView === item.id 
                  ? 'bg-cyan-400 text-black translate-x-1 shadow-[2px_2px_0px_0px_#000]' 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white hover:shadow-[4px_4px_0px_0px_#000]'
              }`}
            >
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t-4 border-black space-y-3 bg-magenta-500/5 halftone">
          <div className="p-4 bg-zinc-800 border-2 border-black relative overflow-hidden group/profile shadow-[4px_4px_0px_0px_#000]">
             <div className="flex items-center gap-3 mb-3">
               <div className="w-10 h-10 border-2 border-black bg-zinc-700 flex items-center justify-center overflow-hidden">
                 {user.avatarUrl ? (
                   <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-[10px] font-black uppercase">DIR</span>
                 )}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[8px] font-black uppercase text-zinc-500 italic">EDITOR-IN-CHIEF</p>
                  <p className="text-xs font-bold text-white truncate">{user.username}</p>
               </div>
             </div>

             <div className="flex items-center justify-between bg-zinc-950 p-2 border-2 border-black">
                <div className="flex flex-col">
                  <span className="text-[7px] font-black uppercase text-zinc-500">BUDGET</span>
                  <span className="text-xs font-black text-cyan-400">
                    {isAdmin ? 'UNLIMITED' : user.credits}
                  </span>
                </div>
                {!isAdmin && (
                  <button 
                    onClick={() => setShowPurchase(true)}
                    className="px-2 py-1 bg-yellow-400 text-black text-[9px] font-black uppercase rounded border border-black hover:bg-yellow-300 transition-all"
                  >
                    ADD
                  </button>
                )}
             </div>
          </div>

          <button 
            onClick={onLogout}
            className="w-full py-2 bg-zinc-950 text-zinc-500 text-[9px] font-comic uppercase tracking-widest hover:text-red-400 hover:bg-black transition-all"
          >
            END PRODUCTION
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-zinc-900 border-b-4 border-black sticky top-0 z-50 halftone">
          <h1 className="text-2xl font-comic tracking-wider text-white transform -rotate-1">SECRET LIFE!</h1>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-zinc-800 border-2 border-black text-[10px] font-black uppercase text-cyan-400 shadow-[2px_2px_0px_0px_#000]">
               {isAdmin ? 'INF' : user.credits}
             </div>
             <div className="w-8 h-8 bg-zinc-800 border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_#000]">
               <img src={user.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/3011/3011270.png'} className="w-full h-full object-cover" />
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 safe-pb-nav custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t-4 border-black flex justify-around items-center px-2 safe-bottom h-16 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          {mobileTabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as AppView)}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all ${
                activeView === item.id ? 'bg-cyan-400 text-black border-x-2 border-black' : 'text-zinc-500'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>

      {showPurchase && (
        <CreditPurchase
          userId={user.id}
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
