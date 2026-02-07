
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/gemini';
import { AspectRatio, GeneratedContent, ImageSize, PosterStyle, Alignment, CastMember, PosterTemplate } from '../types';

interface PosterGeneratorProps {
  onGenerated: (content: GeneratedContent) => void;
  initialData?: PosterTemplate | null;
  onClearDraft?: () => void;
}

const OUTFIT_CATEGORIES = {
  'SCI-FI & SPACE': [
    'Cybernetic Power Suit',
    'Spaceship Pilot Gear',
    'Mecha-Pilot Exoskeleton',
    'Android Skin Plating',
    'Neon Samurai Plates',
    'Void Walker Environmental Suit'
  ],
  'FANTASY & MAGIC': [
    'Medieval Knight Armor',
    'Golden Cape & Crest',
    'Obsidian Dark-Lord Armor',
    'Arcane Wizard Robes',
    'Draconic Scale Mail',
    'Elven Forest Tracker Leathers'
  ],
  'HISTORICAL': [
    'Victorian Steampunk Gear',
    'Roman Centurion Armor',
    'Samurai Battle Plates',
    'Viking Berserker Furs',
    'Wild West Gunslinger Duster',
    'Pirate Captain Regalia'
  ],
  'MODERN HERO': [
    'Urban Vigilante Trench',
    'High-Tech Tactical Vest',
    'Special Ops Stealth Suit',
    'Street-Ninja Techwear',
    'Classic Spandex Hero Suit',
    'Corporate Mech-Enforcer'
  ],
  'MYTHIC & GODLY': [
    'Olympian Golden Armor',
    'Asgardian Battle Cloak',
    'Egyptian Pharaoh Plates',
    'Atlantian Coral Carapace',
    'Celestial Star-Silk Robes',
    'Infernal Demon-King Shroud'
  ]
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
  
  const [loading, setLoading] = useState(false);
  const [generatingScenario, setGeneratingScenario] = useState(false);
  const [generatingName, setGeneratingName] = useState(false);
  const [generatingOutfit, setGeneratingOutfit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Blueprint/Template State
  const [showBlueprints, setShowBlueprints] = useState(false);
  const [blueprints, setBlueprints] = useState<PosterTemplate[]>([]);
  const [blueprintName, setBlueprintName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeMember = cast[activeMemberIdx];

  // 1. INITIAL LOAD & PERSISTENCE
  useEffect(() => {
    // Load Templates
    const savedTemplates = localStorage.getItem('cinepet_poster_templates');
    if (savedTemplates) {
      try { setBlueprints(JSON.parse(savedTemplates)); } catch (e) { console.error(e); }
    }

    // Load current Draft if no initialData
    if (initialData) {
      applyTemplate(initialData);
    } else {
      const savedDraft = localStorage.getItem('cinepet_current_poster_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          applyTemplate(draft);
        } catch (e) { console.error(e); }
      }
    }
  }, [initialData]);

  // 2. AUTO-SAVE DRAFT
  useEffect(() => {
    const draft: Partial<PosterTemplate> = {
      alignment,
      cast,
      scenario,
      style: selectedStyle,
      aspectRatio,
      imageSize,
      timestamp: Date.now()
    };
    localStorage.setItem('cinepet_current_poster_draft', JSON.stringify(draft));
  }, [alignment, cast, scenario, selectedStyle, aspectRatio, imageSize]);

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

  const handleSaveBlueprint = () => {
    if (!blueprintName.trim()) return;
    const newTemplate: PosterTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name: blueprintName,
      alignment,
      cast,
      scenario,
      style: selectedStyle,
      aspectRatio,
      imageSize,
      timestamp: Date.now()
    };
    const updated = [newTemplate, ...blueprints];
    setBlueprints(updated);
    localStorage.setItem('cinepet_poster_templates', JSON.stringify(updated));
    setBlueprintName('');
    alert("BLUEPRINT SECURED IN VAULT!");
  };

  const handleDeleteBlueprint = (id: string) => {
    const updated = blueprints.filter(b => b.id !== id);
    setBlueprints(updated);
    localStorage.setItem('cinepet_poster_templates', JSON.stringify(updated));
  };

  const handleScrapDraft = () => {
    if (confirm("SCRAP THIS DRAFT? STARTING FROM SCRATCH?")) {
      setAlignment('hero');
      setCast([{ ...DEFAULT_MEMBER, id: Math.random().toString(36).substr(2, 5) }]);
      setScenario('');
      setSelectedStyle(PosterStyle.EPIC_LEGEND);
      setAspectRatio(AspectRatio.PORTRAIT);
      setImageSize(ImageSize.K1);
      setStep(1);
      setActiveMemberIdx(0);
      setPreviewUrl(null);
      localStorage.removeItem('cinepet_current_poster_draft');
      if (onClearDraft) onClearDraft();
    }
  };

  const updateMember = (updates: Partial<CastMember>) => {
    setCast(prev => prev.map((m, i) => i === activeMemberIdx ? { ...m, ...updates } : m));
  };

  const handleGenerateName = async () => {
    if (!activeMember.name || !activeMember.species) return;
    setGeneratingName(true);
    try {
      const alias = await GeminiService.generateCharacterAlias(activeMember, alignment);
      updateMember({ alias });
    } finally {
      setGeneratingName(false);
    }
  };

  const handleGenerateOutfit = async () => {
    if (!activeMember.species) return;
    setGeneratingOutfit(true);
    try {
      const outfit = await GeminiService.generateOutfitDescription(activeMember, alignment, selectedStyle);
      updateMember({ outfit });
    } finally {
      setGeneratingOutfit(false);
    }
  };

  const handleGenerateScenario = async () => {
    if (cast.length === 0 || !cast[0].name) return;
    setGeneratingScenario(true);
    try {
      const generatedScenario = await GeminiService.generatePosterScenario(cast, alignment);
      setScenario(generatedScenario);
    } finally {
      setGeneratingScenario(false);
    }
  };

  const handleGenerate = async () => {
    const isValid = cast.every(m => m.name && m.species && m.referenceImages.length > 0);
    if (!isValid) {
      setError("FILL ALL PANELS FIRST!");
      return;
    }

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
      setCast(finalCast);

      const url = await GeminiService.generatePoster(scenario, aspectRatio, selectedStyle, finalCast, alignment, imageSize);
      setPreviewUrl(url);
      onGenerated({
        id: Math.random().toString(36).substr(2, 9),
        type: 'poster',
        url,
        prompt: `Poster: ${finalCast.map(c => c.name).join(' & ')}`,
        timestamp: Date.now(),
        metadata: { cast: finalCast, alignment, style: selectedStyle, scenario, aspectRatio, imageSize }
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20 text-white relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="transform -rotate-1">
          <h2 className="text-5xl font-comic text-white stroke-black-bold drop-shadow-[4px_4px_0px_#000] uppercase leading-none">
            {alignment === 'hero' ? 'HERO FACTORY' : 'VILLAIN VAULT'}
          </h2>
          <div className="bg-cyan-400 text-black px-3 py-0.5 inline-block text-[10px] font-black uppercase tracking-widest mt-2 border-2 border-black">DESIGN LEAD PROTAGONISTS</div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-zinc-900 p-1 border-3 border-black shadow-[4px_4px_0px_0px_#000] flex">
            <button 
              onClick={() => setAlignment('hero')}
              className={`px-6 py-2 font-comic text-lg uppercase transition-all ${alignment === 'hero' ? 'bg-cyan-400 text-black' : 'text-zinc-500 hover:text-white'}`}
            >SUPERHERO</button>
            <button 
              onClick={() => setAlignment('villain')}
              className={`px-6 py-2 font-comic text-lg uppercase transition-all ${alignment === 'villain' ? 'bg-magenta-500 text-white' : 'text-zinc-500 hover:text-white'}`}
            >VILLAIN</button>
          </div>
          <button 
            onClick={() => setShowBlueprints(true)}
            className="bg-yellow-400 border-3 border-black p-3 shadow-[4px_4px_0px_0px_#000] flex items-center gap-2 hover:bg-yellow-300 transition-all"
          >
            <span className="text-black font-black text-xs uppercase">Blueprints</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
           <div className="bg-zinc-900 border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] halftone min-h-[600px] flex flex-col justify-between relative">
              
              {/* Reset/Scrap Control */}
              <button 
                onClick={handleScrapDraft}
                className="absolute -top-3 -right-3 bg-red-600 text-white border-3 border-black p-2 font-black text-[8px] uppercase hover:bg-red-500 transition-all shadow-[4px_4px_0px_#000] z-20"
              >
                SCRAP DRAFT
              </button>

              {step === 1 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="border-b-4 border-black pb-4 mb-4">
                     <h3 className="text-3xl font-comic uppercase text-white">CASTING CALL</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">CIVILIAN NAME</label>
                       <input 
                          type="text" 
                          value={activeMember.name}
                          onChange={(e) => updateMember({ name: e.target.value })}
                          className="w-full bg-zinc-800 border-3 border-black p-4 text-white font-bold focus:border-cyan-400 outline-none uppercase"
                          placeholder="What do they go by?"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">SPECIES / ORIGIN</label>
                       <input 
                          type="text" 
                          value={activeMember.species}
                          onChange={(e) => updateMember({ species: e.target.value })}
                          className="w-full bg-zinc-800 border-3 border-black p-4 text-white font-bold focus:border-cyan-400 outline-none uppercase"
                          placeholder="e.g. Alien Dog, Robot Human"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">VISUAL DNA (1-3 PHOTOS)</label>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-20 h-20 border-3 border-dashed border-zinc-700 bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-all text-[10px] font-black uppercase text-zinc-500"
                          >UPLOAD</button>
                          <input type="file" ref={fileInputRef} hidden multiple accept="image/*" onChange={(e) => {
                             const files = Array.from(e.target.files || []) as File[];
                             files.forEach(file => {
                               const reader = new FileReader();
                               reader.onloadend = () => {
                                 const base64 = reader.result as string;
                                 const newImgs = [...activeMember.referenceImages, base64].slice(0, 3);
                                 updateMember({ referenceImages: newImgs });
                               };
                               reader.readAsDataURL(file);
                             });
                          }} />
                          {activeMember.referenceImages.map((img, idx) => (
                            <div key={idx} className="relative w-20 h-20 border-3 border-black group">
                               <img src={img} className="w-full h-full object-cover" />
                               <button 
                                 onClick={() => updateMember({ referenceImages: activeMember.referenceImages.filter((_, i) => i !== idx) })}
                                 className="absolute top-0 right-0 bg-black text-white text-[8px] px-1 font-bold"
                               >X</button>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                  
                  <button 
                    disabled={!activeMember.name || !activeMember.species || activeMember.referenceImages.length === 0}
                    onClick={() => setStep(2)}
                    className="w-full py-4 bg-yellow-400 border-4 border-black text-black font-comic text-2xl uppercase shadow-[4px_4px_0px_0px_#000] hover:shadow-[1px_1px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-30"
                  >
                    NEXT PANEL: THE ALTER EGO
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <h3 className="text-3xl font-comic uppercase border-b-4 border-black pb-4 text-white">SECRET IDENTITY</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">CODENAME / ALIAS</label>
                       <div className="relative">
                          <input 
                            type="text" 
                            value={activeMember.alias}
                            onChange={(e) => updateMember({ alias: e.target.value })}
                            className="w-full bg-zinc-800 border-3 border-black p-4 text-white font-bold focus:border-cyan-400 outline-none pr-12 uppercase"
                            placeholder="e.g. THE GOLDEN BARK"
                          />
                          <button onClick={handleGenerateName} disabled={generatingName} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black hover:scale-110 transition-transform uppercase text-cyan-400">
                            {generatingName ? 'WAIT' : 'MAGIC'}
                          </button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">BATTLE GEAR</label>
                       <div className="relative flex flex-col gap-2">
                         <select 
                            value={activeMember.outfit}
                            onChange={(e) => updateMember({ outfit: e.target.value })}
                            className="w-full bg-zinc-800 border-3 border-black p-4 text-white font-bold focus:border-cyan-400 outline-none uppercase appearance-none"
                         >
                           {Object.entries(OUTFIT_CATEGORIES).map(([cat, options]) => (
                             <optgroup key={cat} label={cat} className="bg-zinc-900 text-zinc-400">
                               {options.map(opt => <option key={opt} value={opt} className="text-white">{opt}</option>)}
                             </optgroup>
                           ))}
                           <option value="CUSTOM">--- CUSTOM DESCRIPTION ---</option>
                         </select>
                         
                         {activeMember.outfit === 'CUSTOM' || !OUTFIT_OPTIONS.includes(activeMember.outfit) ? (
                            <div className="relative">
                               <input 
                                  type="text" 
                                  value={activeMember.outfit === 'CUSTOM' ? '' : activeMember.outfit}
                                  onChange={(e) => updateMember({ outfit: e.target.value })}
                                  className="w-full bg-zinc-800 border-3 border-black p-4 text-white font-bold focus:border-cyan-400 outline-none pr-12 uppercase"
                                  placeholder="Describe custom gear..."
                                />
                                <button onClick={handleGenerateOutfit} disabled={generatingOutfit} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black hover:scale-110 transition-transform uppercase text-magenta-400">
                                  {generatingOutfit ? 'WAIT' : 'DESIGN'}
                                </button>
                            </div>
                         ) : null}
                       </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="flex-1 py-4 border-3 border-black font-comic uppercase bg-zinc-800 text-zinc-400">BACK</button>
                    <button onClick={() => setStep(3)} className="flex-[2] py-4 bg-cyan-400 border-4 border-black text-black font-comic text-2xl uppercase shadow-[4px_4px_0px_0px_#000]">ART DIRECTION</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <h3 className="text-3xl font-comic uppercase border-b-4 border-black pb-4 text-white">GLOBAL DIRECTION</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">STYLE</label>
                          <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value as PosterStyle)} className="w-full bg-zinc-800 border-3 border-black p-2 font-bold text-[10px] outline-none text-white appearance-none uppercase">
                            {Object.entries(PosterStyle).map(([k, v]) => <option key={v} value={v}>{k}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">FORMAT</label>
                          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-zinc-800 border-3 border-black p-2 font-bold text-[10px] outline-none text-white appearance-none uppercase">
                            {Object.entries(AspectRatio).map(([k, v]) => <option key={v} value={v}>{v}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                         <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">SCENE DESCRIPTION</label>
                         <button onClick={handleGenerateScenario} disabled={generatingScenario} className="text-[10px] font-black uppercase text-yellow-400 hover:underline">
                           {generatingScenario ? 'SCRIPTING...' : 'AI SCRIPT'}
                         </button>
                       </div>
                       <textarea value={scenario} onChange={(e) => setScenario(e.target.value)} className="w-full h-32 bg-zinc-800 border-3 border-black p-4 text-white font-bold focus:border-cyan-400 outline-none resize-none uppercase text-xs" />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(2)} className="flex-1 py-4 border-3 border-black font-comic uppercase bg-zinc-800 text-zinc-400">BACK</button>
                    <button onClick={handleGenerate} disabled={loading || !scenario} className="flex-[3] py-5 bg-yellow-400 border-4 border-black text-black font-comic text-4xl uppercase shadow-[10px_10px_0px_0px_#000] transition-all">
                      {loading ? 'INKING...' : 'WHAM! PRODUCE!'}
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="text-red-500 text-center font-black uppercase text-xs mt-4">{error}</p>}
           </div>
        </div>

        <div className="lg:col-span-7">
           <div className="bg-zinc-900 border-4 border-black p-4 shadow-[12px_12px_0px_0px_#000] h-full flex items-center justify-center relative overflow-hidden halftone group">
            {previewUrl ? (
              <img src={previewUrl} className="w-full h-full object-contain border-4 border-black transition-transform duration-500 group-hover:scale-[1.02]" />
            ) : (
              <div className="text-center p-20 flex flex-col items-center">
                <img src="https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=1000&auto=format&fit=crop" className="w-72 h-auto object-cover border-4 border-black grayscale opacity-10 mb-8 transform -rotate-1" />
                <h3 className="text-6xl font-comic uppercase text-white opacity-20 tracking-widest">THE SPLASH PAGE</h3>
                <p className="text-[12px] font-black text-zinc-700 opacity-40 mt-6 tracking-[0.5em] uppercase">Awaiting Draft Ink</p>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 bg-yellow-400 z-30 flex flex-col items-center justify-center p-12 text-center animate-in fade-in halftone">
                 <h3 className="text-6xl font-comic text-black stroke-white drop-shadow-[4px_4px_0px_#fff] uppercase mb-4 animate-bounce">INKING PANELS!</h3>
                 <p className="font-black text-black text-xs tracking-widest uppercase">The production engine is synthesizing character DNA...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blueprint Vault Modal */}
      {showBlueprints && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowBlueprints(false)}></div>
          <div className="relative w-full max-w-2xl bg-zinc-900 border-4 border-black p-10 shadow-[15px_15px_0px_#000] halftone animate-in zoom-in-95 duration-200">
            <h3 className="text-4xl font-comic text-white uppercase mb-8 border-b-4 border-black pb-4">BLUEPRINT VAULT</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={blueprintName}
                  onChange={(e) => setBlueprintName(e.target.value)}
                  placeholder="NEW BLUEPRINT NAME..."
                  className="flex-1 bg-zinc-800 border-3 border-black p-4 text-white font-black uppercase text-xs focus:border-cyan-400 outline-none"
                />
                <button 
                  onClick={handleSaveBlueprint}
                  disabled={!blueprintName.trim()}
                  className="px-8 py-4 bg-yellow-400 border-3 border-black text-black font-black uppercase text-xs shadow-[4px_4px_0px_#000] disabled:opacity-30"
                >
                  SAVE
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {blueprints.length === 0 ? (
                  <div className="col-span-full py-20 text-center opacity-30">
                    <p className="text-xs font-black uppercase tracking-widest">Vault Empty</p>
                  </div>
                ) : (
                  blueprints.map(bp => (
                    <div key={bp.id} className="group bg-zinc-800 border-3 border-black p-4 relative hover:border-cyan-400 transition-all">
                      <h4 className="font-black text-white uppercase text-sm mb-2 truncate pr-6">{bp.name}</h4>
                      <p className="text-[8px] text-zinc-500 uppercase font-black">{bp.style} • {bp.cast.length} MEMBERS</p>
                      
                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={() => { applyTemplate(bp); setShowBlueprints(false); }}
                          className="flex-1 py-1.5 bg-cyan-400 text-black font-black uppercase text-[8px] border-2 border-black"
                        >LOAD</button>
                        <button 
                          onClick={() => handleDeleteBlueprint(bp.id)}
                          className="px-2 py-1.5 bg-zinc-950 text-red-500 font-black uppercase text-[8px] border-2 border-black"
                        >SCRAP</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button 
              onClick={() => setShowBlueprints(false)}
              className="mt-10 w-full py-4 bg-zinc-800 text-zinc-500 font-black uppercase text-xs border-3 border-black"
            >CLOSE VAULT</button>
          </div>
        </div>
      )}
    </div>
  );
};
