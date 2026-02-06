
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/gemini';
import { AspectRatio, GeneratedContent, ImageSize, PosterStyle, Alignment, CastMember, PosterTemplate } from '../types';

interface PosterGeneratorProps {
  onGenerated: (content: GeneratedContent) => void;
  initialData?: PosterTemplate | null;
  onClearDraft?: () => void;
}

const OUTFIT_CATEGORIES = {
  'SCI-FI & TECH': [
    'Cybernetic Power Suit',
    'Spaceship Pilot Gear',
    'High-Tech Tactical Vest',
    'Neon Samurai Plates',
    'Clockwork Exoskeleton',
    'Supernova Hazard Suit',
    'Scrap-Yard Mech Armor',
    'Quantum Phase Jumpsuit',
    'Ion-Core Heavy Plating',
    'Saturn-Ring Orbit Gears',
    'Plasma Shield Rig',
    'Nanotech Stealth Skin'
  ],
  'FANTASY & MAGIC': [
    'Medieval Knight Armor',
    'Golden Cape & Crest',
    'Tattered Ronin Robes',
    'Obsidian Dark-Lord Armor',
    'Druidic Vine Wraps',
    'Celestial Guardian Robes',
    'Frost-Giant Hide Armor',
    'Elderwood Shaman Robes',
    'Dragon-Scale Mail',
    'Ethereal Ghost-Armor',
    'Phoenix Feather Cloak',
    'Runelord Plate'
  ],
  'MYTHOLOGICAL & LEGENDARY': [
    'Mjolnir-Powered Gauntlets',
    'Aegis Reflective Shield-Vest',
    'Monkey King Silk Robes',
    'Thunder God Bracers',
    'Valkyrie Winged Armor',
    'Anubis Death-Guard Wrap',
    'Poseidon Trident Harness',
    'Oni Demon Mask & Armor'
  ],
  'ELEMENTAL & NATURE': [
    'Bioluminescent Scuba Rig',
    'Living Leaf Plate',
    'Volcanic Magma Shards',
    'Ice-Crystal Carapace',
    'Desert Nomad Wraps',
    'Storm-Cloud Mantle',
    'Solar-Flare Regalia',
    'Abyssal Deep-Sea Shell'
  ],
  'HISTORICAL & NOBLE': [
    'Victorian Noble Attire',
    'Royal Guard Uniform',
    'Viking Fur & Bone',
    'Gladiator Sand-Plate',
    'Samurai O-Yoroi',
    'Aztec Jaguar Warrior Hide',
    'Napoleonic Guard Uniform',
    'Spartan Bronze Cuirass',
    'Mongolian Steppe Armor'
  ],
  'MODERN & TACTICAL': [
    'K-9 Special Ops Harness',
    'Urban Ninja Sweats',
    'High-Vis Construction Mech',
    'Street-Brawler Hoodie & Wraps',
    'Parkour Speed-Suit',
    'Underground Agent Trenchcoat',
    'Riot Control Exo-Shell'
  ],
  'WHIMSICAL & SURREAL': [
    'Bubble-Gum Power Armor',
    'Cardboard Box Mech',
    'Stealth Shadow Cloak',
    'Neon Holographic Suit',
    'Glow-in-the-Dark Skeleton Onesie',
    'Candy-Cane Staff & Cape',
    'Invisibility Pajamas',
    'Marshmallow Defender Suit'
  ]
};

const OUTFIT_OPTIONS = Object.values(OUTFIT_CATEGORIES).flat();

export const PosterGenerator: React.FC<PosterGeneratorProps> = ({ onGenerated, initialData, onClearDraft }) => {
  const [step, setStep] = useState(1);
  const [alignment, setAlignment] = useState<Alignment>('hero');
  const [cast, setCast] = useState<CastMember[]>([{
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
  }]);
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeMember = cast[activeMemberIdx];

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
    <div className="space-y-10 pb-20 text-white">
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Comic Panel Form */}
        <div className="lg:col-span-5">
           <div className="bg-zinc-900 border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] halftone min-h-[600px] flex flex-col justify-between">
              
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
                          className="w-full bg-zinc-800 border-3 border-black p-4 text-white font-bold focus:border-cyan-400 outline-none"
                          placeholder="What do they go by?"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">SPECIES / ORIGIN</label>
                       <input 
                          type="text" 
                          value={activeMember.species}
                          onChange={(e) => updateMember({ species: e.target.value })}
                          className="w-full bg-zinc-800 border-3 border-black p-4 text-white font-bold focus:border-cyan-400 outline-none"
                          placeholder="e.g. Alien Dog, Robot Human"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">GENDER</label>
                       <div className="flex bg-zinc-800 border-3 border-black p-1">
                          <button 
                            onClick={() => updateMember({ gender: 'male' })}
                            className={`flex-1 py-2 font-comic text-lg uppercase transition-all ${activeMember.gender === 'male' ? 'bg-cyan-400 text-black' : 'text-zinc-600'}`}
                          >MALE</button>
                          <button 
                            onClick={() => updateMember({ gender: 'female' })}
                            className={`flex-1 py-2 font-comic text-lg uppercase transition-all ${activeMember.gender === 'female' ? 'bg-cyan-400 text-black' : 'text-zinc-600'}`}
                          >FEMALE</button>
                       </div>
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
                            className="w-full bg-zinc-800 border-3 border-black p-4 text-white font-bold focus:border-cyan-400 outline-none pr-12"
                            placeholder="e.g. THE GOLDEN BARK"
                          />
                          <button 
                            onClick={handleGenerateName}
                            disabled={generatingName}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black hover:scale-110 transition-transform uppercase text-cyan-400"
                          >
                            {generatingName ? 'WAIT' : 'MAGIC'}
                          </button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">BATTLE GEAR</label>
                       <div className="relative">
                         <input 
                            type="text" 
                            value={activeMember.outfit}
                            onChange={(e) => updateMember({ outfit: e.target.value })}
                            className="w-full bg-zinc-800 border-3 border-black p-4 text-white font-bold focus:border-cyan-400 outline-none pr-12"
                            placeholder="Describe or select gear..."
                          />
                          <button 
                            onClick={handleGenerateOutfit}
                            disabled={generatingOutfit}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black hover:scale-110 transition-transform uppercase text-magenta-400"
                          >
                            {generatingOutfit ? 'WAIT' : 'DESIGN'}
                          </button>
                       </div>
                       <select 
                        onChange={(e) => updateMember({ outfit: e.target.value })}
                        className="w-full mt-2 bg-zinc-950 border-2 border-black p-2 text-[10px] text-zinc-500 font-bold uppercase outline-none"
                       >
                         <option value="">-- Quick Select Presets --</option>
                         {Object.entries(OUTFIT_CATEGORIES).map(([category, options]) => (
                           <optgroup key={category} label={category}>
                             {options.map(o => <option key={o} value={o}>{o}</option>)}
                           </optgroup>
                         ))}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">PERSONALITY & TRAITS</label>
                       <textarea 
                          value={activeMember.traits}
                          onChange={(e) => updateMember({ traits: e.target.value })}
                          className="w-full h-24 bg-zinc-800 border-3 border-black p-4 text-white font-bold focus:border-cyan-400 outline-none resize-none"
                          placeholder="e.g. Always eats the last pizza slice, fears vacuum cleaners..."
                       />
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
                          <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value as PosterStyle)} className="w-full bg-zinc-800 border-3 border-black p-2 font-bold text-[10px] outline-none text-white appearance-none">
                            {Object.entries(PosterStyle).map(([k, v]) => <option key={v} value={v}>{k}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">FORMAT</label>
                          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-zinc-800 border-3 border-black p-2 font-bold text-[10px] outline-none text-white appearance-none">
                            {Object.entries(AspectRatio).map(([k, v]) => <option key={v} value={v}>{v}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                         <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">SCENE DESCRIPTION</label>
                         <button 
                           onClick={handleGenerateScenario}
                           disabled={generatingScenario}
                           className="text-[10px] font-black uppercase text-yellow-400 hover:underline transition-all"
                         >
                           {generatingScenario ? 'SCRIPTING...' : 'AI SCRIPTWRITER'}
                         </button>
                       </div>
                       <textarea
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        placeholder="Describe the action shot... e.g. An epic showdown on top of a futuristic skyscraper during a neon rainstorm."
                        className="w-full h-32 bg-zinc-800 border-3 border-black p-4 text-white font-bold focus:border-cyan-400 outline-none resize-none"
                       />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(2)} className="flex-1 py-4 border-3 border-black font-comic uppercase bg-zinc-800 text-zinc-400">BACK</button>
                    <button 
                      onClick={handleGenerate} 
                      disabled={loading || !scenario}
                      className="flex-[3] py-5 bg-yellow-400 border-4 border-black text-black font-comic text-4xl uppercase shadow-[10px_10px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-2 hover:translate-y-2 transition-all flex items-center justify-center gap-4"
                    >
                      {loading ? (
                        <>
                          <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span>INKING...</span>
                        </>
                      ) : (
                        <span>WHAM! PRODUCE!</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="text-red-500 text-center font-black uppercase text-xs mt-4 animate-pulse">{error}</p>}
           </div>
        </div>

        {/* Right Column: Preview Panel */}
        <div className="lg:col-span-7">
           <div className="bg-zinc-900 border-4 border-black p-4 shadow-[12px_12px_0px_0px_#000] h-full flex items-center justify-center relative overflow-hidden halftone group">
            {previewUrl ? (
              <img src={previewUrl} className="w-full h-full object-contain border-4 border-black transition-transform duration-500 group-hover:scale-[1.02]" />
            ) : (
              <div className="text-center p-20 flex flex-col items-center">
                <div className="w-32 h-32 border-8 border-zinc-800 rounded-full border-t-cyan-400 animate-spin mb-8"></div>
                <h3 className="text-5xl font-comic uppercase text-white opacity-10 tracking-widest">THE SPLASH PAGE</h3>
                <p className="text-[10px] font-black text-zinc-600 opacity-30 mt-4 tracking-widest">AWAITING CREATIVE INKING</p>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 bg-yellow-400 z-30 flex flex-col items-center justify-center p-12 text-center animate-in fade-in halftone">
                 <h3 className="text-6xl font-comic text-black stroke-white drop-shadow-[4px_4px_0px_#fff] uppercase mb-4">INKING PANELS!</h3>
                 <div className="max-w-md bg-white border-3 border-black p-4 shadow-[6px_6px_0px_0px_#000]">
                    <p className="text-[10px] font-black text-black italic leading-relaxed uppercase">
                      "GEMINI 3 PRO IS COORDINATING THE CINEMATIC VISUAL LAYERS. SYNTHESIZING UNIQUE CHARACTER PROFILES INTO A CONSISTENT ENVIRONMENT."
                    </p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
