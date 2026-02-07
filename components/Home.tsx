
import React from 'react';
import { AppView, User, GeneratedContent } from '../types';

interface HomeProps {
  user: User;
  history: GeneratedContent[];
  setActiveView: (view: AppView) => void;
}

export const Home: React.FC<HomeProps> = ({ user, history, setActiveView }) => {
  const stats = [
    { label: 'Productions', value: history.length, icon: '🎬' },
    { label: 'Credits', value: user.role === 'admin' ? '∞' : user.credits, icon: '🪙' },
    { label: 'Studio Rank', value: history.length > 5 ? 'PRODUCER' : 'INDIE', icon: '🏆' },
  ];

  const modules = [
    {
      id: 'poster',
      title: 'Posters',
      description: 'TRANSFORM PETS INTO BLOCKBUSTER MOVIE STARS WITH EPIC GEAR.',
      color: 'bg-cyan-400',
      tag: 'HOT',
      icon: '🖼️',
      image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'comic',
      title: 'Comic Strips',
      description: 'GENERATE MULTI-PANEL INKED NARRATIVES READY FOR PUBLICATION.',
      color: 'bg-yellow-400',
      tag: 'NEW',
      icon: '💥',
      image: 'https://images.unsplash.com/photo-1588497859490-85d1c17db96d?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'video',
      title: 'Animation',
      description: 'BRING STILLS TO LIFE WITH VEO. 1080P CINEMATIC MOTION.',
      color: 'bg-magenta-500',
      tag: 'PRO',
      icon: '🎞️',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'video-editor',
      title: 'Video Editor',
      description: 'STITCH, EXTEND, AND REMIX CLIPS WITH SEAMLESS AI CONTINUITY.',
      color: 'bg-indigo-600',
      tag: 'LAB',
      icon: '✂️',
      image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=400&auto=format&fit=crop'
    }
  ];

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      <section className="relative overflow-hidden bg-action-blue border-4 border-black p-10 md:p-14 shadow-[12px_12px_0px_0px_#000]">
        <div className="absolute inset-0 comic-hatch opacity-20 pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <h2 className="text-6xl md:text-8xl font-comic text-white stroke-black-bold drop-shadow-[4px_4px_0px_#000] uppercase leading-none transform -rotate-1">
            DASHBOARD!
          </h2>
          <p className="mt-8 text-lg md:text-xl font-bold uppercase tracking-widest text-white leading-tight">
            WELCOME BACK, <span className="text-yellow-400 underline decoration-4 underline-offset-8">{user.username.split(' ')[0]}</span>. THE STUDIO IS PREPPED.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="px-6 py-4 bg-white border-4 border-black flex items-center gap-4 shadow-[6px_6px_0px_0px_#000]">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase leading-none tracking-widest mb-1">{stat.label}</p>
                  <p className="text-xl font-black text-black">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-6 mb-10">
          <h3 className="text-3xl font-comic uppercase tracking-wider text-white">PRODUCTION MODULES</h3>
          <div className="flex-1 h-1.5 bg-black/20"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveView(mod.id as AppView)}
              className="group text-left bg-white border-4 border-black p-1 shadow-[10px_10px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#000] transition-all relative overflow-hidden flex flex-col h-[26rem]"
            >
              <div className="h-44 w-full bg-zinc-100 relative overflow-hidden border-b-4 border-black">
                <img src={mod.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className={`absolute top-3 right-3 px-3 py-1 ${mod.color} text-black text-[10px] font-black border-3 border-black z-20 shadow-[2px_2px_0px_#000]`}>
                    {mod.tag}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-4xl font-comic uppercase text-black mb-3 leading-none group-hover:text-blue-600 transition-colors">
                    {mod.title}
                  </h4>
                  <p className="text-[11px] font-bold text-zinc-500 uppercase leading-relaxed tracking-tight">
                    {mod.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-6">
                   <span className="text-[10px] font-black text-black uppercase tracking-widest">START PRODUCTION</span>
                   <span className="text-2xl group-hover:translate-x-2 transition-transform">➡️</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex items-center gap-6 mb-10">
            <h3 className="text-3xl font-comic uppercase tracking-wider text-white">LATEST REEL</h3>
            <div className="flex-1 h-1.5 bg-black/20"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {history.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView('history')}
                className="aspect-square bg-white border-4 border-black overflow-hidden hover:scale-105 transition-all shadow-[8px_8px_0px_0px_#000] relative group p-1"
              >
                <div className="w-full h-full bg-zinc-100 overflow-hidden">
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.url} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              </button>
            ))}
          </div>
        </section>
      )}

      <footer className="pt-20 border-t-4 border-black/10 text-center">
         <p className="text-[11px] text-white/20 font-bold uppercase tracking-[0.6em]">
           THE SECRET LIFE ENGINE v4.0.0 • PAGE EDITION
         </p>
      </footer>
    </div>
  );
};
