
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/gemini';
import { AspectRatio, GeneratedContent, ImageSize, PosterStyle, Alignment, CastMember, PosterTemplate } from '../types';

interface PosterGeneratorProps {
  onGenerated: (content: GeneratedContent) => void;
  initialData?: PosterTemplate | null;
  onClearDraft?: () => void;
}

const OUTFIT_CATEGORIES = {
  'SCI-FI & SPACE': ['Cybernetic Power Suit', 'Spaceship Pilot Gear', 'Mecha-Pilot Exoskeleton', 'Android Skin Plating', 'Neon Samurai Plates', 'Void Walker Environmental Suit'],
  'FANTASY & MAGIC': ['Medieval Knight Armor', 'Golden Cape & Crest', 'Obsidian Dark-Lord Armor', 'Arcane Wizard Robes', 'Draconic Scale Mail', 'Elven Forest Tracker Leathers'],
  'HISTORICAL': ['Victorian Steampunk Gear', 'Roman Centurion Armor', 'Samurai Battle Plates', 'Viking Berserker Furs', 'Wild West Gunslinger Duster', 'Pirate Captain Regalia'],
  'MODERN HERO': ['Urban Vigilante Trench', 'High-Tech Tactical Vest', 'Special Ops Stealth Suit', 'Street-Ninja Techwear', 'Classic Spandex Hero Suit', 'Corporate Mech-Enforcer'],
  'MYTHIC & GODLY': ['Olympian Golden Armor', 'Asgardian Battle Cloak', 'Egyptian Pharaoh Plates', 'Atlantian Coral Carapace', 'Celestial Star-Silk Robes', 'Infernal Demon-King Shroud']
};

const OUTFIT_OPTIONS = Object.values(OUTFIT_CATEGORIES).flat();

const DEFAULT_MEMBER: CastMember = {
  id: '1',
  name: '',
  species: '',
  gender: 'male',
  traits: '',
  weakness: '',
  alias: '',
  outfit: OUTFIT_OPTIONS[0],
  referenceImages: [],
  motivation: '',
  origin: '',
  targetWeakness: ''
};

export const PosterGenerator: React.FC<PosterGeneratorProps> = ({ onGenerated, initialData, onClearDraft }) => {
  const [step, setStep] = useState(1);
  const [alignment, setAlignment] = useState<Alignment>('hero');
  const [cast, setCast] = useState<CastMember[]>([DEFAULT_MEMBER]);
  const [activeMemberIdx, setActiveMemberIdx] = useState(0);
  const [scenario, setScenario] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<PosterStyle>(PosterStyle.EPIC_LEGEND);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.K1);
  const [productionType, setProductionType] = useState<'movie' | 'comic'>('movie');
  
  const [loading, setLoading] = useState(false);
  const [generatingScenario, setGeneratingScenario] = useState(false);
  const [generatingAlias, setGeneratingAlias] = useState(false);
  const [generatingOutfit, setGeneratingOutfit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeMember = cast[activeMemberIdx];

  useEffect(() => {
    if (initialData) applyTemplate(initialData);
  }, [initialData]);

  const applyTemplate = (template: Partial<PosterTemplate>) => {
    if (template.alignment) setAlignment(template.alignment);
    if (template.cast) setCast(template.cast);
    if (template.scenario) setScenario(template.scenario || '');
    if (template.style) setSelectedStyle(template.style);
    if (template.aspectRatio) setAspectRatio(template.aspectRatio);
    if (template.imageSize) setImageSize(template.imageSize);
    setStep(1);
    setActiveMemberIdx(0);
  };

  const updateMember = (updates: Partial<CastMember>) => {
    setCast(prev => prev.map((m, i) => i === activeMemberIdx ? { ...m, ...updates } : m));
  };

  const handleAutoGenerateAlias = async () => {
    if (!activeMember.name || !activeMember.species) {
      setError("NAME AND SPECIES REQUIRED FOR AI GENERATION.");
      return;
    }
    setGeneratingAlias(true);
    setError(null);
    try {
      const alias = await GeminiService.generateCharacterAlias(activeMember, alignment);
      updateMember({ alias });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingAlias(false);
    }
  };

  const handleAutoSuggestGear = async () => {
    setGeneratingOutfit(true);
    setError(null);
    try {
      const outfit = await GeminiService.generateOutfitDescription(activeMember, alignment, selectedStyle);
      updateMember({ outfit });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingOutfit(false);
    }
  };

  const handleGenerateScenario = async () => {
    if (cast.some(m => !m.name)) {
      setError("CAST MEMBERS MUST HAVE NAMES.");
      return;
    }
    setGeneratingScenario(true);
    setError(null);
    try {
      const script = await GeminiService.generatePosterScenario(cast, alignment);
      setScenario(script);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingScenario(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const finalCast = await Promise.all(cast.map(async m => {
        if (!m.alias) {
          const alias = await GeminiService.generateCharacterAlias(m, alignment);
          return { ...m, alias };
        }
        return m;
      }));
      const url = await GeminiService.generatePoster(scenario, aspectRatio, selectedStyle, finalCast, alignment, imageSize, productionType);
      setPreviewUrl(url);
      onGenerated({
        id: Math.random().toString(36).substr(2, 9),
        type: 'poster',
        url,
        prompt: `${productionType === 'movie' ? 'Poster' : 'Comic Cover'}: ${finalCast.map(c => c.name).join(' & ')}`,
        timestamp: Date.now(),
        metadata: { cast: finalCast, alignment, style: selectedStyle, scenario, aspectRatio, imageSize, productionType }
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `cinepet-${productionType}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="transform -rotate-1">
          <h2 className="text-5xl md:text-6xl font-comic text-white stroke-black-bold drop-shadow-[6px_6px_0px_#000] uppercase leading-none">
            {alignment === 'hero' ? 'HERO FACTORY' : 'VILLAIN VAULT'}
          </h2>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white p-1.5 border-4 border-black shadow-[6px_6px_0px_0px_#000] flex">
            <button onClick={() => setAlignment('hero')} className={`px-8 py-2 font-comic text-xl uppercase transition-all ${alignment === 'hero' ? 'bg-cyan-400 text-black border-2 border-black' : 'text-zinc-400 hover:text-black'}`}>HERO</button>
            <button onClick={() => setAlignment('villain')} className={`px-8 py-2 font-comic text-xl uppercase transition-all ${alignment === 'villain' ? 'bg-magenta-500 text-white border-2 border-black' : 'text-zinc-400 hover:text-black'}`}>VILLAIN</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
           <div className="bg-white border-[6px] border-black p-10 shadow-[12px_12px_0px_0px_#000] min-h-[600px] flex flex-col justify-between relative overflow-hidden text-black">
              <div className="absolute inset-0 comic-hatch opacity-5 pointer-events-none"></div>

              {step === 1 && (
                <div className="space-y-8 animate-in fade-in duration-300 relative z-10">
                  <div className="border-b-[4px] border-black pb-4 mb-6">
                     <h3 className="text-4xl font-comic uppercase">01 CASTING CALL</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase text-zinc-400 ml-1">CIVILIAN NAME</label>
                       <input 
                          type="text" 
                          value={activeMember.name}
                          onChange={(e) => updateMember({ name: e.target.value })}
                          className="w-full bg-zinc-50 border-4 border-black p-4 text-black font-black focus:border-cyan-400 outline-none uppercase text-lg"
                          placeholder="EX: BARK KENT"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-400 ml-1">SPECIES</label>
                           <input 
                              type="text" 
                              value={activeMember.species}
                              onChange={(e) => updateMember({ species: e.target.value })}
                              className="w-full bg-zinc-50 border-4 border-black p-4 text-black font-black focus:border-cyan-400 outline-none uppercase text-lg"
                              placeholder="EX: GOLDEN"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-400 ml-1">GENDER</label>
                           <div className="flex bg-zinc-100 p-1 border-4 border-black">
                              <button onClick={() => updateMember({ gender: 'male' })} className={`flex-1 py-3 text-[10px] font-black uppercase transition-all ${activeMember.gender === 'male' ? 'bg-black text-white' : 'text-zinc-400'}`}>MALE</button>
                              <button onClick={() => updateMember({ gender: 'female' })} className={`flex-1 py-3 text-[10px] font-black uppercase transition-all ${activeMember.gender === 'female' ? 'bg-black text-white' : 'text-zinc-400'}`}>FEMALE</button>
                           </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase text-zinc-400 ml-1">VISUAL DNA (UPLOAD PHOTOS)</label>
                       <div className="flex gap-4">
                          <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 border-4 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center hover:bg-zinc-100 transition-all text-[10px] font-black text-zinc-400 uppercase">UPLOAD</button>
                          <input type="file" ref={fileInputRef} hidden multiple accept="image/*" onChange={(e) => {
                             const files = Array.from(e.target.files || []) as File[];
                             files.forEach(file => {
                               const reader = new FileReader();
                               reader.onloadend = () => {
                                 const base64 = reader.result as string;
                                 updateMember({ referenceImages: [...activeMember.referenceImages, base64].slice(0, 3) });
                               };
                               reader.readAsDataURL(file);
                             });
                          }} />
                          {activeMember.referenceImages.map((img, idx) => (
                            <div key={idx} className="relative w-20 h-20 border-4 border-black">
                               <img src={img} className="w-full h-full object-cover" />
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                  
                  <button onClick={() => setStep(2)} className="w-full py-5 bg-yellow-400 border-4 border-black text-black font-comic text-4xl uppercase shadow-[8px_8px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                    NEXT: IDENTITY
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 animate-in fade-in duration-300 relative z-10">
                  <div className="border-b-[4px] border-black pb-4 mb-6">
                     <h3 className="text-4xl font-comic uppercase">02 SECRET IDENTITY</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <div className="flex justify-between items-end mb-1 px-1">
                          <label className="text-[11px] font-black uppercase text-zinc-400">CODENAME</label>
                          <button 
                            onClick={handleAutoGenerateAlias}
                            disabled={generatingAlias}
                            className="text-[9px] font-black text-cyan-500 hover:text-cyan-700 uppercase flex items-center gap-1 transition-all"
                          >
                             {generatingAlias ? '...' : '✨ AUTO-GENERATE'}
                          </button>
                       </div>
                       <input 
                          type="text" 
                          value={activeMember.alias}
                          onChange={(e) => updateMember({ alias: e.target.value })}
                          className="w-full bg-zinc-50 border-4 border-black p-4 text-black font-black outline-none uppercase text-lg"
                          placeholder="EX: THE GOLDEN BARK"
                       />
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-end mb-1 px-1">
                          <label className="text-[11px] font-black uppercase text-zinc-400">BATTLE GEAR</label>
                          <button 
                            onClick={handleAutoSuggestGear}
                            disabled={generatingOutfit}
                            className="text-[9px] font-black text-magenta-500 hover:text-magenta-700 uppercase flex items-center gap-1 transition-all"
                          >
                             {generatingOutfit ? '...' : '🤖 SUGGEST GEAR'}
                          </button>
                       </div>
                       <input 
                          type="text" 
                          value={activeMember.outfit}
                          onChange={(e) => updateMember({ outfit: e.target.value })}
                          className="w-full bg-zinc-50 border-4 border-black p-4 text-black font-black outline-none uppercase text-lg"
                          placeholder="EX: CYBERNETIC POWER SUIT"
                       />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="flex-1 py-5 border-4 border-black font-comic text-2xl uppercase bg-zinc-100 text-zinc-400">BACK</button>
                    <button onClick={() => setStep(3)} className="flex-[2] py-5 bg-cyan-400 border-4 border-black text-black font-comic text-3xl uppercase shadow-[6px_6px_0px_#000]">NEXT: ART</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-in fade-in duration-300 relative z-10">
                  <div className="border-b-[4px] border-black pb-4 mb-6">
                     <h3 className="text-4xl font-comic uppercase">03 ART DIRECTION</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase text-zinc-400 ml-1">PRODUCTION MODE</label>
                       <div className="flex bg-zinc-100 p-1 border-4 border-black">
                          <button onClick={() => setProductionType('movie')} className={`flex-1 py-3 text-[10px] font-black uppercase transition-all ${productionType === 'movie' ? 'bg-black text-white' : 'text-zinc-400'}`}>MOVIE POSTER</button>
                          <button onClick={() => setProductionType('comic')} className={`flex-1 py-3 text-[10px] font-black uppercase transition-all ${productionType === 'comic' ? 'bg-magenta-500 text-white' : 'text-zinc-400'}`}>COMIC COVER</button>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-400 ml-1">FORMAT</label>
                           <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-zinc-50 border-4 border-black p-4 font-black text-xs outline-none uppercase">
                             {Object.entries(AspectRatio).map(([k, v]) => <option key={v} value={v}>{v}</option>)}
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-400 ml-1">ART STYLE</label>
                           <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value as PosterStyle)} className="w-full bg-zinc-50 border-4 border-black p-4 font-black text-xs outline-none uppercase">
                             {Object.entries(PosterStyle).map(([k, v]) => <option key={v} value={v}>{v.split(' (')[0]}</option>)}
                           </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-end mb-1 px-1">
                          <label className="text-[11px] font-black uppercase text-zinc-400">SCENE SCRIPT</label>
                          <button 
                            onClick={handleGenerateScenario}
                            disabled={generatingScenario}
                            className="text-[9px] font-black text-yellow-500 hover:text-yellow-700 uppercase flex items-center gap-1 transition-all"
                          >
                             {generatingScenario ? 'WRITING...' : '✨ GENERATE SCRIPT'}
                          </button>
                       </div>
                       <textarea 
                        value={scenario} 
                        onChange={(e) => setScenario(e.target.value)} 
                        className="w-full h-32 bg-zinc-50 border-4 border-black p-4 text-black font-black outline-none resize-none uppercase text-xs leading-relaxed" 
                        placeholder="DESCRIBE THE EPIC SHOWDOWN..."
                       />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(2)} className="flex-1 py-5 border-4 border-black font-comic text-2xl uppercase bg-zinc-100 text-zinc-400">BACK</button>
                    <button onClick={handleGenerate} disabled={loading} className="flex-[3] py-6 bg-yellow-400 border-4 border-black text-black font-comic text-5xl uppercase shadow-[12px_12px_0px_0px_#000] active:scale-95 transition-all">
                      {loading ? 'WAIT...' : 'PRODUCE!'}
                    </button>
                  </div>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-7">
           <div className="bg-white border-[6px] border-black p-6 shadow-[16px_16px_0px_0px_#000] h-full flex flex-col items-center justify-center relative overflow-hidden">
            {previewUrl ? (
              <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                <img src={previewUrl} className="w-full h-auto max-h-[85%] object-contain border-4 border-black mb-6" />
                <button 
                  onClick={handleDownload}
                  className="px-12 py-4 bg-black text-white font-comic text-3xl uppercase border-4 border-white shadow-[6px_6px_0px_0px_#22d3ee] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                >
                  📥 DOWNLOAD MASTER
                </button>
              </div>
            ) : (
              <div className="text-center p-20 flex flex-col items-center">
                <div className="w-80 h-96 bg-zinc-50 border-4 border-black flex items-center justify-center mb-10 transform -rotate-2 relative">
                   <div className="absolute inset-0 comic-hatch opacity-5"></div>
                   <span className="text-8xl opacity-10 font-comic text-black">{productionType === 'movie' ? '🎬' : '💥'}</span>
                </div>
                <h3 className="text-7xl font-comic uppercase text-zinc-100 tracking-widest drop-shadow-[4px_4px_0px_#000]">SPLASH PAGE</h3>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 bg-cyan-400 z-30 flex flex-col items-center justify-center p-14 text-center animate-in fade-in">
                 <h3 className="text-8xl font-comic text-black stroke-black-bold drop-shadow-[10px_10px_0px_#fff] uppercase mb-6 animate-bounce">INKING!</h3>
                 <p className="font-black text-black text-xs uppercase tracking-widest">Synthesizing {productionType} DNA...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
