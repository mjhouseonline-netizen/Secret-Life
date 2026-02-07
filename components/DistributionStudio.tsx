
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

export const DistributionStudio: React.FC = () => {
  const [store, setStore] = useState<'apple' | 'google'>('apple');
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<{title: string, subtitle: string, description: string} | null>(null);

  const getApiKey = () => {
    try {
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY && process.env.API_KEY !== 'undefined') {
        return process.env.API_KEY;
      }
    } catch (e) {}
    return '';
  };

  const generateStoreMetadata = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const prompt = `Generate high-converting App Store metadata for an app called 'The Secret Life Of Your Pet'. 
      The app allows users to create cinematic posters, 4-panel comic strips, and AI-powered videos of their pets and friends.
      Generate metadata for the ${store === 'apple' ? 'iOS App Store' : 'Google Play Store'}.
      Include:
      1. A catchy Title (max 30 chars)
      2. A compelling Subtitle (max 30 chars)
      3. A persuasive long description highlighting AI features (Gemini, Veo). 
      4. MUST MENTION: "Family Friendly" and "Safe for all ages".`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });

      const text = response.text || "";
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      setMetadata({
        title: lines[0]?.replace(/^Title: /, '') || "The Secret Life: AI Cinema",
        subtitle: lines[1]?.replace(/^Subtitle: /, '') || "Animate Your Pets with AI",
        description: lines.slice(2).join('\n')
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checklist = [
    { label: "App Manifest Configured", status: true },
    { label: "High-Res App Icons (1024x1024)", status: false },
    { label: "Privacy Policy (Mobile Required)", status: true },
    { label: "Terms of Service", status: true },
    { label: "Age Rating (4+ Recommended)", status: false },
    { label: "Mobile Safe Mode Enabled", status: true },
  ];

  return (
    <div className="space-y-10 pb-24">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-8">
        <div>
          <h2 className="text-4xl font-bold mb-2 tracking-tight text-white font-cinematic uppercase tracking-widest">Global Distribution</h2>
          <p className="text-zinc-500">Prepare The Secret Life Of Your Pet for iOS and Android marketplaces.</p>
        </div>
        <div className="flex gap-2">
           <div className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-bold uppercase border border-indigo-500/20">
             Compliance Check Passed
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <div className="text-9xl rotate-12">🚀</div>
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Store Copywriter</h3>
              <div className="flex bg-zinc-800 p-1 rounded-xl">
                <button 
                  onClick={() => setStore('apple')}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${store === 'apple' ? 'bg-white text-black' : 'text-zinc-500'}`}
                >
                  App Store
                </button>
                <button 
                  onClick={() => setStore('google')}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${store === 'google' ? 'bg-white text-black' : 'text-zinc-500'}`}
                >
                  Play Store
                </button>
              </div>
            </div>

            {metadata ? (
              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600 uppercase mb-2 block">App Title</label>
                    <p className="p-4 bg-zinc-800/50 rounded-xl text-zinc-100 font-bold border border-white/5">{metadata.title}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600 uppercase mb-2 block">Short Description</label>
                    <p className="p-4 bg-zinc-800/50 rounded-xl text-zinc-300 italic border border-white/5">"{metadata.subtitle}"</p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase mb-2 block">Long Description</label>
                  <div className="p-4 bg-zinc-800/50 rounded-xl text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar border border-white/5">
                    {metadata.description}
                  </div>
                </div>
                <button 
                  onClick={() => setMetadata(null)}
                  className="text-[10px] font-bold text-indigo-500 uppercase hover:underline"
                >
                  🔄 Refresh Store Presence
                </button>
              </div>
            ) : (
              <div className="py-20 text-center space-y-6 relative z-10">
                <div className="text-6xl mb-4">✍️</div>
                <div className="max-w-xs mx-auto">
                   <h4 className="text-xl font-bold mb-2 text-white">App Store Copy Engine</h4>
                   <p className="text-zinc-500 text-sm mb-6 leading-relaxed">Let Cine use Gemini to draft a family-friendly store presence that highlights your AI capabilities while ensuring compliance.</p>
                   <button 
                    onClick={generateStoreMetadata}
                    disabled={loading}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 mx-auto text-white shadow-lg active:scale-95"
                  >
                    {loading ? "Writing Strategy..." : "Draft Presentation"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-xl">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-4 tracking-widest">Mobile Manifest</h4>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">Your app is optimized for iOS and Android via PWA standards. This manifest ensures the splash screen and home icon are consistent.</p>
                <div className="p-4 bg-black/40 rounded-xl font-mono text-[9px] text-green-500 border border-white/5">
                  {`{ "display": "standalone", "theme_color": "#4f46e5" }`}
                </div>
             </div>
             <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-xl">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-4 tracking-widest">Deployment Pipeline</h4>
                <div className="space-y-3">
                  <button className="w-full text-left p-4 bg-zinc-950 hover:bg-zinc-800 rounded-xl transition-all flex items-center justify-between group border border-white/5">
                    <span className="text-xs text-zinc-300">Package for iOS Store</span>
                    <span className="text-indigo-500">↗️</span>
                  </button>
                  <button className="w-full text-left p-4 bg-zinc-950 hover:bg-zinc-800 rounded-xl transition-all flex items-center justify-between group border border-white/5">
                    <span className="text-xs text-zinc-300">Package for Play Store</span>
                    <span className="text-indigo-500">↗️</span>
                  </button>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] shadow-2xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-8 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                 Submission Health
              </h3>
              <div className="space-y-6">
                 {checklist.map((item, idx) => (
                   <div key={idx} className="flex items-center justify-between group">
                      <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{item.label}</span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${item.status ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-600'}`}>
                        {item.status ? '✓' : '×'}
                      </div>
                   </div>
                 ))}
              </div>
              <div className="mt-10 pt-8 border-t border-zinc-800">
                 <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 w-3/5 transition-all duration-1000"></div>
                 </div>
                 <p className="text-[10px] text-zinc-600 font-bold uppercase mt-4 tracking-widest">Launch Readiness: 60%</p>
              </div>
           </div>

           <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)]">
              <h4 className="text-xl font-bold text-white mb-2 font-cinematic tracking-widest">Mobile Advantage</h4>
              <p className="text-indigo-100 text-xs leading-relaxed mb-8">
                 The Secret Life Of Your Pet is architected for **zero layout shift** and **touch-first** interaction. Your users get a native experience with no download required.
              </p>
              <button 
                className="w-full py-4 bg-white text-indigo-600 text-center rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl active:scale-95"
              >
                Download Dev Assets
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
