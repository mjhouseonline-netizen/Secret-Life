
import React, { useState } from 'react';
import { GeminiService } from '../services/gemini';
import { GeneratedContent, AspectRatio, Resolution, VideoStyle, ComicStyle, CharacterProfile, ComicMetadata } from '../types';

interface ComicGeneratorProps {
  onGenerated: (content: GeneratedContent) => void;
  onAnimate: (id: string) => void;
  availableCharacters: GeneratedContent[];
}

const COMIC_STYLE_METADATA: Record<ComicStyle, { label: string, color: string, description: string }> = {
  [ComicStyle.SHADOW_GUARDIAN]: { label: 'SHADOW', color: 'bg-zinc-800', description: 'Dark, gritty, tech-infused hero aesthetic.' },
  [ComicStyle.CARAMEL_COMET]: { label: 'COMET', color: 'bg-orange-500', description: 'Vibrant colors with high-speed elemental lines.' },
  [ComicStyle.PIXAR_3D]: { label: 'PIXAR 3D', color: 'bg-blue-500', description: 'Expressive Pixar-style 3D characters and soft lighting.' },
  [ComicStyle.PIXAR_CLASSIC]: { label: 'PIXAR CLASSIC', color: 'bg-indigo-500', description: 'Early-era Pixar 3D aesthetic with high saturation.' },
  [ComicStyle.CLASSIC_HERO]: { label: 'CLASSIC', color: 'bg-red-600', description: 'Golden Age bold colors and heavy ink outlines.' },
  [ComicStyle.MODERN_NOIR]: { label: 'NOIR', color: 'bg-black', description: 'High contrast black and white with cinematic rain.' },
  [ComicStyle.RETRO_POP]: { label: 'POP ART', color: 'bg-yellow-400', description: 'Classic Ben-Day dots and vibrant 60s pop graphics.' },
  [ComicStyle.CYBER_MANGA]: { label: 'MANGA', color: 'bg-fuchsia-600', description: 'Digital screentones and futuristic energy effects.' },
  [ComicStyle.STORYBOOK]: { label: 'STORYBOOK', color: 'bg-green-600', description: 'Soft watercolor washes and hand-drawn sketch feel.' },
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
    setSelectedCharIds(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(cid => cid !== id) : prev) 
        : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedCharIds.length === 0) return;
    const charContent = availableCharacters.find(c => c.id === selectedCharIds[0]);
    if (!charContent) return;

    setLoading(true);
    setError(null);
    try {
      const profile: CharacterProfile = charContent.metadata?.cast?.[0] || charContent.metadata;
      const enhancedMeta = { ...comicMeta, plot };
      
      const url = await GeminiService.generateComic(profile, enhancedMeta as any, selectedStyle, charContent.url);
      const newContent: GeneratedContent = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'comic',
        url,
        prompt: `Comic: ${profile.alias} vs ${comicMeta.villainName} - ${plot.substring(0, 30)}...`,
        timestamp: Date.now(),
        metadata: { profile, comicMeta: enhancedMeta }
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
        <div className="flex gap-2">
           {[1, 2, 3, 4].map(s => (
             <div key={s} className={`w-4 h-4 border-2 border-black transition-all ${step >= s ? 'bg-yellow-400 rotate-45' : 'bg-zinc-800'}`}></div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
           <div className="bg-zinc-900 border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] space-y-8 halftone min-h-[500px] flex flex-col justify-between">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                  <h3 className="text-3xl font-comic uppercase">PICK THE HEROES</h3>
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {availableCharacters.map(char => (
                      <button 
                        key={char.id}
                        onClick={() => toggleCharSelection(char.id)}
                        className={`aspect-[2/3] border-4 transition-all overflow-hidden relative ${selectedCharIds.includes(char.id) ? 'border-cyan-400 scale-95 shadow-[4px_4px_0px_0px_#000]' : 'border-black opacity-50'}`}
                      >
                        <img src={char.url} className="w-full h-full object-cover" />
                        {selectedCharIds.includes(char.id) && (
                          <div className="absolute top-1 right-1 bg-cyan-400 text-black text-[8px] px-1 font-black">ACTIVE</div>
                        )}
                      </button>
                    ))}
                    {availableCharacters.length === 0 && (
                      <div className="col-span-2 py-8 text-center bg-zinc-800 border-2 border-dashed border-black">
                        <p className="text-[10px] font-black uppercase text-zinc-500">No Heroes Found</p>
                        <p className="text-[8px] uppercase mt-2 text-zinc-600">Create a poster first!</p>
                      </div>
                    )}
                  </div>
                  <button 
                    disabled={selectedCharIds.length === 0}
                    onClick={() => setStep(2)} 
                    className="w-full py-4 bg-yellow-400 border-4 border-black text-black font-comic text-2xl uppercase shadow-[4px_4px_0px_0px_#000] disabled:opacity-50"
                  >NEXT PANEL</button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                  <h3 className="text-3xl font-comic uppercase">THE SCENARIO</h3>
                  <div className="space-y-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">STORY PLOT</label>
                       <textarea 
                        value={plot}
                        onChange={(e) => setPlot(e.target.value)}
                        className="w-full h-24 bg-zinc-800 border-3 border-black p-4 font-bold outline-none uppercase text-xs text-white focus:border-cyan-400"
                        placeholder="e.g. THE HEROES DISCOVER A HIDDEN UNDERGROUND BASE..."
                       />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">VILLAIN NAME</label>
                        <input 
                          type="text" 
                          value={comicMeta.villainName}
                          onChange={(e) => setComicMeta({...comicMeta, villainName: e.target.value})}
                          className="w-full bg-zinc-800 border-3 border-black p-3 font-bold outline-none uppercase text-xs text-white focus:border-cyan-400"
                          placeholder="e.g. BARON BITE"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">VILLAIN TYPE</label>
                           <input 
                              type="text" 
                              value={comicMeta.villainType}
                              onChange={(e) => setComicMeta({...comicMeta, villainType: e.target.value})}
                              className="w-full bg-zinc-800 border-3 border-black p-3 font-bold outline-none uppercase text-xs text-white focus:border-cyan-400"
                              placeholder="e.g. SHADOW"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">VILLAIN TRAIT</label>
                           <input 
                              type="text" 
                              value={comicMeta.villainTrait}
                              onChange={(e) => setComicMeta({...comicMeta, villainTrait: e.target.value})}
                              className="w-full bg-zinc-800 border-3 border-black p-3 font-bold outline-none uppercase text-xs text-white focus:border-cyan-400"
                              placeholder="e.g. CUNNING"
                           />
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="flex-1 py-3 border-3 border-black font-comic bg-zinc-800 text-zinc-500 uppercase">BACK</button>
                    <button 
                      disabled={!plot || !comicMeta.villainName}
                      onClick={() => setStep(3)} 
                      className="flex-[2] py-3 bg-cyan-400 border-3 border-black text-black font-comic text-xl shadow-[4px_4px_0px_0px_#000] uppercase disabled:opacity-50"
                    >PANEL SETTINGS</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                  <h3 className="text-3xl font-comic uppercase">COMIC CONFIG</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">ART STYLE</label>
                       <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {Object.entries(COMIC_STYLE_METADATA).map(([style, meta]) => (
                            <button
                              key={style}
                              onClick={() => setSelectedStyle(style as ComicStyle)}
                              className={`p-2 border-2 text-left transition-all ${selectedStyle === style ? 'bg-cyan-400 text-black border-black' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}
                            >
                              <p className="text-[9px] font-black uppercase tracking-tighter">{meta.label}</p>
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">PANEL COUNT</label>
                          <select 
                            value={comicMeta.pages}
                            onChange={(e) => setComicMeta({...comicMeta, pages: parseInt(e.target.value)})}
                            className="w-full bg-zinc-800 border-3 border-black p-3 font-bold text-xs text-white outline-none focus:border-cyan-400"
                          >
                             <option value={3}>3 PANELS</option>
                             <option value={6}>6 PANELS</option>
                             <option value={9}>9 PANELS</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">ENDING</label>
                          <select 
                            value={comicMeta.storyEnding}
                            onChange={(e) => setComicMeta({...comicMeta, storyEnding: e.target.value as any})}
                            className="w-full bg-zinc-800 border-3 border-black p-3 font-bold text-xs text-white outline-none focus:border-cyan-400"
                          >
                             <option value="triumph">TRIUMPH</option>
                             <option value="cliffhanger">CLIFFHANGER</option>
                             <option value="lesson">LESSON</option>
                          </select>
                       </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(2)} className="flex-1 py-3 border-3 border-black font-comic bg-zinc-800 text-zinc-500 uppercase">BACK</button>
                    <button 
                      onClick={handleGenerate} 
                      disabled={loading}
                      className="flex-[2] py-5 bg-magenta-500 text-white border-4 border-black font-comic text-3xl uppercase shadow-[8px_8px_0px_0px_#000]"
                    >
                      {loading ? 'INKING...' : 'WHAM! GENERATE!'}
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="text-center py-10 animate-in zoom-in-95">
                   <div className="w-24 h-24 bg-yellow-400 border-4 border-black rotate-12 mx-auto flex items-center justify-center mb-6 shadow-[6px_6px_0px_0px_#000]">
                      <span className="font-comic text-4xl text-black">POW!</span>
                   </div>
                   <h3 className="text-3xl font-comic uppercase text-white">STORY COMPLETE!</h3>
                   <p className="text-xs font-bold uppercase mt-2 text-zinc-500">Issue #1 has been archived.</p>
                   <button onClick={() => setStep(1)} className="mt-8 w-full py-4 bg-zinc-950 text-white border-4 border-black font-comic text-xl uppercase shadow-[4px_4px_0px_0px_#000] hover:bg-black">NEW ISSUE</button>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-8">
           <div className="bg-zinc-900 border-4 border-black p-4 shadow-[12px_12px_0px_0px_#000] h-full flex items-center justify-center relative halftone group">
            {lastGenerated ? (
              <img src={lastGenerated.url} className="w-full h-auto object-contain border-4 border-black transition-transform group-hover:scale-[1.01]" />
            ) : (
              <div className="text-center p-20 opacity-10 flex flex-col items-center">
                <div className="w-32 h-32 border-8 border-zinc-800 rounded-full border-t-cyan-400 animate-[spin_3s_linear_infinite] mb-8"></div>
                <h3 className="text-4xl font-comic uppercase text-white">DRAFT TABLE</h3>
                <p className="text-xs font-bold uppercase mt-4 text-zinc-400">Waiting for Creative Intel...</p>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 bg-cyan-400 z-30 flex flex-col items-center justify-center p-12 text-center halftone animate-in fade-in">
                 <div className="bg-white border-4 border-black p-8 shadow-[10px_10px_0px_0px_#000] rotate-2">
                   <h3 className="text-5xl font-comic text-black stroke-white drop-shadow-[4px_4px_0px_#fff] uppercase">POW! INKED!</h3>
                   <p className="text-xs font-black uppercase mt-4 italic text-black">"GEMINI 3 PRO IS RENDERING SEQUENTIAL PANELS..."</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
