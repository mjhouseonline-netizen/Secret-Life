
import React, { useState } from 'react';
import { GeminiService } from '../services/gemini';
import { GeneratedContent, BookMetadata, BookStyle, CharacterProfile } from '../types';

interface BookGeneratorProps {
  onGenerated: (content: GeneratedContent) => void;
  availableAssets: GeneratedContent[];
}

const BOOK_STYLE_METADATA: Record<BookStyle, { icon: string, color: string, description: string }> = {
  [BookStyle.CLASSIC_STORYBOOK]: { icon: '📔', color: 'bg-amber-600', description: 'Timeless illustrated children\'s book aesthetic.' },
  [BookStyle.LITERARY_NOVEL]: { icon: '📜', color: 'bg-zinc-700', description: 'Sophisticated prose with detailed plate illustrations.' },
  [BookStyle.KIDS_FANTASY]: { icon: '🌈', color: 'bg-pink-500', description: 'Vibrant, high-energy visuals and whimsical prose.' },
  [BookStyle.MYTHIC_MANUSCRIPT]: { icon: '🏺', color: 'bg-orange-800', description: 'Ancient, textured look with illuminated borders.' },
  [BookStyle.MODERN_THRILLER]: { icon: '🎬', color: 'bg-blue-900', description: 'Cinematic layout with fast-paced narrative.' },
};

export const BookGenerator: React.FC<BookGeneratorProps> = ({ onGenerated, availableAssets }) => {
  const [step, setStep] = useState(1);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [bookMeta, setBookMeta] = useState<BookMetadata>({
    title: '',
    genre: 'Adventure',
    tone: 'Epic',
    chapters: 3,
    targetAudience: 'All Ages'
  });
  const [selectedStyle, setSelectedStyle] = useState<BookStyle>(BookStyle.CLASSIC_STORYBOOK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<{url: string, story: any[]} | null>(null);

  const handleGenerate = async () => {
    if (!bookMeta.title) {
      setError("Please title your masterpiece!");
      return;
    }

    const assetContent = availableAssets.find(a => a.id === selectedAssetId);
    
    // Extract profile from asset if available, otherwise use default
    const profile: CharacterProfile = assetContent?.metadata?.cast?.[0] || assetContent?.metadata?.profile || {
      petName: "Star",
      species: "Pet",
      gender: "male",
      traits: "Heroic",
      weakness: "None",
      alias: "The Wanderer",
      alignment: "hero",
      outfit: "Classic Gear"
    };

    setLoading(true);
    setError(null);
    try {
      const result = await GeminiService.generateBook(profile, bookMeta, selectedStyle, assetContent?.url);
      
      const newContent: GeneratedContent = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'book',
        url: result.url,
        prompt: `Book: ${bookMeta.title} (${bookMeta.chapters} chapters) in ${selectedStyle}`,
        timestamp: Date.now(),
        metadata: { profile, bookMeta, story: result.story }
      };
      
      setLastGenerated(result);
      onGenerated(newContent);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'The ink ran dry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAsset = availableAssets.find(a => a.id === selectedAssetId);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-8">
        <div>
          <h2 className="text-4xl font-bold mb-2 tracking-tight">The Library Studio</h2>
          <p className="text-zinc-400">Author high-end illustrated books based on your cinematic characters.</p>
        </div>
        <div className="flex gap-2">
           {[1, 2, 3, 4].map(s => (
             <div key={s} className={`w-3 h-3 rounded-full transition-all ${step >= s ? 'bg-amber-500 scale-125' : 'bg-zinc-800'}`}></div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <div className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] shadow-2xl space-y-8 min-h-[500px] flex flex-col justify-between">
            
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold flex items-center gap-3 text-amber-500">
                  <span className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-xs">1</span>
                  Select Story Source
                </h3>
                <p className="text-xs text-zinc-500">Begin a new narrative or adapt from an existing comic or poster.</p>
                
                <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  <button 
                    onClick={() => setSelectedAssetId(null)}
                    className={`aspect-[2/3] rounded-xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center gap-2 ${!selectedAssetId ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 bg-zinc-950 opacity-60'}`}
                  >
                    <span className="text-2xl">✨</span>
                    <span className="text-[10px] font-bold uppercase">New Story</span>
                  </button>
                  {availableAssets.map(asset => (
                    <button 
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`aspect-[2/3] rounded-xl overflow-hidden border-2 transition-all ${selectedAssetId === asset.id ? 'border-amber-500 scale-95' : 'border-zinc-800 opacity-60 hover:opacity-100'}`}
                    >
                      <img src={asset.url} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-500 transition-all flex items-center justify-center gap-2"
                >
                  Next: Outline Plot <span>➡️</span>
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold flex items-center gap-3 text-amber-500">
                  <span className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-xs">2</span>
                  Narrative Outline
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-zinc-600 uppercase">Book Title</p>
                     <input 
                        type="text" 
                        value={bookMeta.title}
                        onChange={(e) => setBookMeta({...bookMeta, title: e.target.value})}
                        placeholder="e.g. The Brave Bark"
                        className="w-full bg-zinc-800 rounded-xl p-3 text-sm border-none focus:ring-1 focus:ring-amber-500"
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-zinc-600 uppercase">Genre</p>
                       <select 
                        value={bookMeta.genre}
                        onChange={(e) => setBookMeta({...bookMeta, genre: e.target.value})}
                        className="w-full bg-zinc-800 rounded-xl p-3 text-xs border-none"
                       >
                          {['Adventure', 'Fantasy', 'Mythology', 'Mystery', 'Sci-Fi'].map(g => <option key={g} value={g}>{g}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-zinc-600 uppercase">Tone</p>
                       <select 
                        value={bookMeta.tone}
                        onChange={(e) => setBookMeta({...bookMeta, tone: e.target.value})}
                        className="w-full bg-zinc-800 rounded-xl p-3 text-xs border-none"
                       >
                          {['Epic', 'Gentle', 'Comedic', 'Dark', 'Nostalgic'].map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-zinc-600 uppercase">Target Audience</p>
                     <select 
                      value={bookMeta.targetAudience}
                      onChange={(e) => setBookMeta({...bookMeta, targetAudience: e.target.value})}
                      className="w-full bg-zinc-800 rounded-xl p-3 text-xs border-none"
                     >
                        {['Toddlers', 'Young Readers', 'Teens', 'Adults', 'All Ages'].map(a => <option key={a} value={a}>{a}</option>)}
                     </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-bold rounded-2xl hover:bg-zinc-700">Back</button>
                  <button onClick={() => setStep(3)} className="flex-[2] py-4 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-500">Next: Art Style</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xl font-bold flex items-center gap-3 text-amber-500">
                  <span className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-xs">3</span>
                  Editorial Direction
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Illustration Style</label>
                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                       {Object.entries(BOOK_STYLE_METADATA).map(([style, meta]) => (
                         <button
                           key={style}
                           onClick={() => setSelectedStyle(style as BookStyle)}
                           className={`p-3 rounded-2xl border-2 transition-all flex flex-col gap-1 text-left relative overflow-hidden group ${
                             selectedStyle === style ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                           }`}
                         >
                           <div className="flex justify-between items-center relative z-10">
                             <span className="text-xl">{meta.icon}</span>
                             {selectedStyle === style && <span className="bg-amber-500 w-2 h-2 rounded-full animate-pulse"></span>}
                           </div>
                           <p className={`text-[9px] font-bold uppercase tracking-tight relative z-10 ${selectedStyle === style ? 'text-amber-400' : 'text-zinc-500'}`}>
                             {style.split(' (')[0]}
                           </p>
                           <div className={`absolute bottom-0 right-0 w-10 h-10 ${meta.color} opacity-5 rounded-tl-full transition-opacity group-hover:opacity-10`}></div>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase">Chapter Count</p>
                        <span className="text-xs font-bold text-amber-400">{bookMeta.chapters} Chapters</span>
                     </div>
                     <input 
                      type="range" min="3" max="10" value={bookMeta.chapters}
                      onChange={(e) => setBookMeta({...bookMeta, chapters: parseInt(e.target.value)})}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                     />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => setStep(2)} className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-bold rounded-2xl hover:bg-zinc-700 transition-all">Back</button>
                  <button 
                    onClick={handleGenerate} 
                    disabled={loading}
                    className="flex-[2] py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-2xl shadow-xl hover:scale-105 transition-all"
                  >
                    {loading ? 'Publishing...' : 'Generate Illustrated Book'}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="text-center py-6">
                   <div className="text-5xl mb-4">📚</div>
                   <h3 className="text-2xl font-bold tracking-tight">Masterpiece Published</h3>
                   <p className="text-sm text-zinc-400 mt-2 leading-relaxed">"${bookMeta.title}" is ready for reading in the archive.</p>
                </div>
                <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-3">
                   <p className="text-[10px] font-bold text-zinc-500 uppercase">Bibliographic Data</p>
                   <p className="text-xs text-zinc-400 leading-relaxed italic">
                      "${bookMeta.title}" - A ${bookMeta.genre} tale for ${bookMeta.targetAudience}. 
                      Illustrated in ${selectedStyle}.
                   </p>
                </div>
                <button 
                  onClick={() => setStep(1)} 
                  className="w-full py-4 bg-zinc-800 text-zinc-200 font-bold rounded-2xl hover:bg-zinc-700"
                >
                  Write Another Book 📖
                </button>
              </div>
            )}

            {error && <p className="text-red-400 text-center text-[10px] font-bold uppercase px-4">{error}</p>}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="w-full rounded-[4rem] bg-zinc-900 border-2 border-zinc-800 flex flex-col min-h-[600px] relative overflow-hidden group shadow-2xl transition-all duration-700">
            {lastGenerated ? (
              <div className="flex-1 flex flex-col p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="relative group/book mx-auto max-w-2xl">
                  <img src={lastGenerated.url} className="w-full h-auto object-contain rounded-2xl shadow-2xl transition-transform group-hover/book:rotate-1" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/book:opacity-100 transition-opacity flex items-end p-8">
                    <p className="text-2xl font-cinematic text-white tracking-widest">{bookMeta.title}</p>
                  </div>
                </div>
                
                <div className="space-y-12 pb-12">
                  {lastGenerated.story.map((chapter: any, idx: number) => (
                    <div key={idx} className="space-y-4 max-w-xl mx-auto border-t border-zinc-800 pt-8 animate-in slide-in-from-bottom-4 duration-500" style={{animationDelay: `${idx * 200}ms`}}>
                      <div className="flex items-center gap-4">
                        <span className="text-amber-500 font-cinematic text-2xl">0{idx + 1}</span>
                        <h4 className="text-xl font-bold text-zinc-100">{chapter.title}</h4>
                      </div>
                      <p className="text-zinc-400 leading-relaxed italic text-lg">{chapter.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-10">
                <div className="text-9xl mb-10">{BOOK_STYLE_METADATA[selectedStyle].icon}</div>
                <p className="text-2xl font-cinematic uppercase tracking-[0.4em]">The Author's Desk</p>
                <p className="text-xs mt-4">Draft your chapters to begin the publishing process.</p>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-3xl z-30 flex flex-col items-center justify-center text-center p-12 animate-in fade-in duration-500">
                 <div className="relative mb-12">
                    <div className="w-24 h-24 border-4 border-amber-500/10 rounded-full"></div>
                    <div className="w-24 h-24 border-4 border-amber-500 border-t-transparent rounded-full animate-spin absolute top-0 shadow-[0_0_60px_rgba(245,158,11,0.3)]"></div>
                 </div>
                 <h3 className="text-3xl font-bold mb-4 tracking-tight">Curating Literature</h3>
                 <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
                   Gemini is weaving ${bookMeta.chapters} chapters of ${bookMeta.genre} for your hero. 
                   Rendering ${selectedStyle} illustrations...
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
      `}</style>
    </div>
  );
};
