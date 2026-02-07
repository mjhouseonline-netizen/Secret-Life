
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
    { label: 'Studio Rank', value: history.length > 5 ? 'Producer' : 'Indie', icon: '🏆' },
  ];

  const modules = [
    {
      id: 'poster',
      title: 'Cinematic Posters',
      description: 'Transform pets & friends into blockbuster movie stars with pro armor and epic styles.',
      color: 'bg-cyan-400',
      tag: 'HOT',
      icon: '🖼️',
      image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'comic',
      title: 'Comic Strips',
      description: 'Generate multi-panel narratives. Inked, colored, and ready for publication.',
      color: 'bg-yellow-400',
      tag: 'NEW',
      icon: '💥',
      image: 'https://images.unsplash.com/photo-1588497859490-85d1c17db96d?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'video',
      title: 'AI Animation',
      description: 'Bring stills to life with Veo. 1080p cinematic motion with character consistency.',
      color: 'bg-magenta-500',
      tag: 'PRO',
      icon: '🎞️',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'book',
      title: 'Illustrated Books',
      description: 'Publish full storybooks with AI-written chapters and coordinated artwork.',
      color: 'bg-orange-500',
      tag: 'BETA',
      icon: '📖',
      image: 'https://images.unsplash.com/photo-1543004218-ee141104975e?q=80&w=400&auto=format&fit=crop'
    }
  ];

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      <section className="relative overflow-hidden bg-zinc-900 border-4 border-black p-10 md:p-14 shadow-[12px_12px_0px_0px_#000] halftone">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-6xl md:text-8xl font-comic text-white stroke-black-bold drop-shadow-[4px_4px_0px_#000] uppercase leading-none transform -rotate-1">
            DASHBOARD!
          </h2>
          <p className="mt-8 text-lg md:text-xl font-bold uppercase tracking-widest text-zinc-500 leading-tight">
            Welcome back, <span className="text-cyan-400">{user.username.split(' ')[0]}</span>. The studio is prepped and the AI engines are idling.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="px-6 py-3 bg-zinc-950 border-2 border-black flex items-center gap-3 shadow-[4px_4px_0px_0px_#000]">
                <span className="text-xl">{stat.icon}</span>
                <div>
                  <p className="text-[10px] font-black text-zinc-700 uppercase leading-none">{stat.label}</p>
                  <p className="text-lg font-black text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -right-20 -top-10 opacity-5 rotate-12 scale-150 select-none">
           <span className="text-[20rem] font-comic">POW!</span>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-4 mb-10">
          <h3 className="text-2xl font-comic uppercase tracking-wider">Production Modules</h3>
          <div className="flex-1 h-1 bg-zinc-900"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveView(mod.id as AppView)}
              className="group text-left bg-zinc-900 border-4 border-black p-1 shadow-[8px_8px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] transition-all relative overflow-hidden flex flex-col h-[22rem]"
            >
              <div className="h-32 w-full bg-black relative overflow-hidden border-b-4 border-black">
                <img src={mod.image} className="w-full h-full object-cover grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-500" />
                <div className="absolute inset-0 halftone opacity-20"></div>
                <div className={`absolute top-2 right-2 px-2 py-0.5 ${mod.color} text-black text-[9px] font-black border-2 border-black z-20`}>
                    {mod.tag}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                   <h4 className="text-2xl font-comic uppercase text-white mb-2 leading-none group-hover:text-cyan-400 transition-colors">
                    {mod.title}
                  </h4>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed tracking-tight">
                    {mod.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black text-zinc-300 uppercase tracking-widest mt-4">
                   <span>Enter Studio</span>
                   <span className="group-hover:translate-x-1 transition-transform">➡️</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-comic uppercase tracking-wider">Latest Reel</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {history.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView('history')}
                className="aspect-square bg-zinc-900 border-4 border-black overflow-hidden hover:scale-105 transition-all shadow-[6px_6px_0px_0px_#000]"
              >
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={item.url} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      <footer className="pt-20 border-t-2 border-zinc-900 text-center">
         <p className="text-[9px] text-zinc-800 font-bold uppercase tracking-[0.5em]">
           THE SECRET LIFE ENGINE v3.5.0 • DARK COMIC SERIES
         </p>
      </footer>
    </div>
  );
};
