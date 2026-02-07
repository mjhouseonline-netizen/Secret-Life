
import React, { useState } from 'react';
import { GeminiService } from '../services/gemini';
import { GeneratedContent, AspectRatio, Resolution, VideoStyle, ComicStyle, CharacterProfile, ComicMetadata } from '../types';

interface ComicGeneratorProps {
  onGenerated: (content: GeneratedContent) => void;
  onAnimate: (id: string) => void;
  availableCharacters: GeneratedContent[];
}

const COMIC_STYLE_METADATA: Record<ComicStyle, { label: string, color: string, description: string }> = {
  [ComicStyle.SHADOW_GUARDIAN]: { label: 'SHADOW', color: 'bg-zinc-800', description: 'Gritty aesthetic.' },
  [ComicStyle.CARAMEL_COMET]: { label: 'COMET', color: 'bg-orange-500', description: 'Elemental lines.' },
  [ComicStyle.PIXAR_3D]: { label: 'PIXAR 3D', color: 'bg-blue-500', description: '3D characters.' },
  [ComicStyle.PIXAR_CLASSIC]: { label: 'PIXAR CLASSIC', color: 'bg-indigo-500', description: 'High saturation.' },
  [ComicStyle.CLASSIC_HERO]: { label: 'CLASSIC', color: 'bg-red-600', description: 'Bold colors.' },
  [ComicStyle.MODERN_NOIR]: { label: 'NOIR', color: 'bg-black', description: 'High contrast.' },
  [ComicStyle.RETRO_POP]: { label: 'POP ART', color: 'bg-yellow-400', description: 'Ben-Day dots.' },
  [ComicStyle.CYBER_MANGA]: { label: 'MANGA', color: 'bg-fuchsia-600', description: 'Digital energy.' },
  [ComicStyle.STORYBOOK]: { label: 'STORYBOOK', color: 'bg-green-600', description: 'Watercolor washes.' },
};

export const ComicGenerator: React.FC<ComicGeneratorProps> = ({ onGenerated, onAnimate, availableCharacters }) => {
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>(availableCharacters[0] ? [availableCharacters[0].id] : []);
  const [step, setStep] = useState(1);
  const [plot, setPlot] = useState('');
  const [comicMeta, setComicMeta] = useState<ComicMetadata>({
    villainName: '',
    villainType: 'Cybernetic Beast',
    villainTrait: 'Deviously Intelligent',
    pages: 6,
    storyEnding: 'triumph'
  });
  
  const [selectedStyle, setSelectedStyle] = useState<ComicStyle>(ComicStyle.SHADOW_GUARDIAN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<GeneratedContent | null>(null);

  const toggleCharSelection = (id: string) => {
    setSelectedCharIds(prev => prev.includes(id) ? (prev.length > 1 ? prev.filter(cid => cid !== id) : prev) : [...prev, id]);
  };

  const handleGenerate = async () => {
    if (selectedCharIds.length === 0) return;
    const charContent = availableCharacters.find(c => c.id === selectedCharIds[0]);
    if (!charContent) return;

    setLoading(true);
    setError(null);
    try {
      const profile: CharacterProfile = charContent.metadata?.cast?.[0] || charContent.metadata;
      const url = await GeminiService.generateComic(profile, comicMeta as any, selectedStyle, charContent.url);
      const newContent: GeneratedContent = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'comic',
        url,
        prompt: `Comic: ${profile.alias} vs ${comicMeta.villainName}`,
        timestamp: Date.now(),
        metadata: { profile, comicMeta }
      };
      setLastGenerated(newContent);
      onGenerated(newContent);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Production halted!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20 text-white">
      <div className="flex items-center justify-between border-b-4 border-black pb-8 transform -rotate-1">
        <div>
          <h2 className="text-5xl font-comic text-white stroke-black-bold drop-shadow-[4px_4px_0px_#000] uppercase leading-none">STORYBOARD STUDIO</h2>
          <div className="bg-cyan-400 text-black px-3 py-1 inline-block text-[10px] font-black uppercase mt-2 tracking-widest border-2 border-black">PANEL SEQUENCE BUILDING</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
           <div className="bg-zinc-900 border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] halftone min-h-[500px] flex flex-col justify-between">
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-comic uppercase">PICK THE HEROES</h3>
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {availableCharacters.map(char => (
                      <button key={char.id} onClick={() => toggleCharSelection(char.id)} className={`aspect-[2/3] border-4 overflow-hidden relative ${selectedCharIds.includes(char.id) ? 'border-cyan-400 scale-95 shadow-[4px_4px_0px_#22d3ee]' : 'border-black opacity-40 hover:opacity-100 transition-all'}`}>
                        <img src={char.url} className="w-full h-full object-cover" />
                        {selectedCharIds.includes(char.id) && <div className="absolute top-1 right-1 bg-cyan-400 text-black text-[8px] font-black px-1 border border-black">CAST</div>}
                      </button>
                    ))}
                    {availableCharacters.length === 0 && (
                      <div className="col-span-2 py-10 text-center border-2 border-dashed border-zinc-800">
                        <p className="text-[10px] font-black text-zinc-600 uppercase">Archive Empty</p>
                      </div>
                    )}
                  </div>
                  <button disabled={selectedCharIds.length === 0} onClick={() => setStep(2)} className="w-full py-4 bg-yellow-400 border-4 border-black text-black font-comic text-2xl uppercase shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none transition-all">NEXT PANEL</button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-comic uppercase">THE SCENARIO</h3>
                  <textarea value={plot} onChange={(e) => setPlot(e.target.value)} className="w-full h-32 bg-zinc-950 border-4 border-black p-4 text-white font-bold uppercase text-xs focus:border-cyan-400 outline-none" placeholder="DESCRIBE THE ACTION..." />
                  <div className="flex gap-2">
                    <button onClick={() => setStep(1)} className="flex-1 py-4 border-4 border-black bg-zinc-800 text-zinc-500 font-comic uppercase">BACK</button>
                    <button onClick={() => setStep(3)} className="flex-[2] py-4 bg-cyan-400 border-4 border-black text-black font-comic text-2xl uppercase shadow-[4px_4px_0px_#000]">PANEL SETTINGS</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-comic uppercase">COMIC CONFIG</h3>
                  <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value as ComicStyle)} className="w-full bg-zinc-950 border-4 border-black p-4 text-white font-black text-xs uppercase outline-none appearance-none">
                    {Object.keys(COMIC_STYLE_METADATA).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => setStep(2)} className="flex-1 py-4 border-4 border-black bg-zinc-800 text-zinc-500 font-comic uppercase">BACK</button>
                    <button onClick={handleGenerate} disabled={loading} className="flex-[2] py-5 bg-magenta-500 text-white border-4 border-black font-comic text-3xl uppercase shadow-[4px_4px_0px_#000]">
                      {loading ? 'INKING...' : 'WHAM! GENERATE!'}
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 animate-in fade-in duration-500 py-6">
                   <h3 className="text-4xl font-comic uppercase text-white text-center">ISSUE COMPLETE!</h3>
                   <div className="space-y-3 pt-4">
                      <button 
                        onClick={() => lastGenerated && onAnimate(lastGenerated.id)} 
                        className="w-full py-5 bg-cyan-400 border-4 border-black text-black font-comic text-3xl uppercase shadow-[6px_6px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3"
                      >
                        <span>🎬 ANIMATE THIS ISSUE</span>
                      </button>
                      <button onClick={() => setStep(1)} className="w-full py-4 bg-zinc-800 text-white border-4 border-black font-comic text-xl uppercase shadow-[4px_4px_0px_0px_#000] hover:bg-zinc-700">
                        START NEW STORY
                      </button>
                   </div>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-8">
           <div className="bg-zinc-900 border-4 border-black p-4 shadow-[12px_12px_0px_0px_#000] h-full flex items-center justify-center relative halftone group overflow-hidden">
            {lastGenerated ? (
              <img src={lastGenerated.url} className="w-full h-auto object-contain border-4 border-black transition-transform group-hover:scale-[1.01]" />
            ) : (
              <div className="text-center p-20 opacity-20 flex flex-col items-center">
                <img src="https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=1000&auto=format&fit=crop" className="w-96 h-auto grayscale opacity-10 border-4 border-black transform rotate-1 mb-8" />
                <h3 className="text-5xl font-comic uppercase text-white tracking-[0.2em] drop-shadow-[4px_4px_0px_#000]">DRAFT TABLE</h3>
                <p className="text-xs font-black uppercase mt-6 text-zinc-600 tracking-widest">Awaiting Narrative Sync...</p>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 bg-cyan-400 z-30 flex flex-col items-center justify-center p-12 text-center halftone animate-in fade-in">
                 <h3 className="text-6xl font-comic text-black stroke-white drop-shadow-[4px_4px_0px_#fff] uppercase animate-pulse">POW! INKED!</h3>
                 <p className="font-black text-black text-[10px] tracking-widest uppercase mt-4">Drafting sequential panels with character consistency...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
