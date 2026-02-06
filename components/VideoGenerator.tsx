
import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/gemini';
import { AspectRatio, GeneratedContent, Resolution, VideoStyle, AnimationPreset } from '../types';

interface VideoGeneratorProps {
  onGenerated: (content: GeneratedContent) => void;
  availableImages: GeneratedContent[];
  initialSelectedId?: string | null;
}

const STYLE_METADATA: Record<VideoStyle, { label: string, color: string, description: string }> = {
  [VideoStyle.DEFAULT]: { label: 'STANDARD', color: 'bg-zinc-800', description: 'Standard high-fidelity video generation.' },
  [VideoStyle.CINEMATIC]: { label: 'CINEMATIC', color: 'bg-blue-600', description: 'Anamorphic lens flares, professional lighting.' },
  [VideoStyle.ANIMATION_3D]: { label: '3D ANIMATION', color: 'bg-orange-500', description: 'Smooth 3D animated style.' },
  [VideoStyle.PIXAR_CINEMATIC]: { label: 'PIXAR 3D', color: 'bg-indigo-500', description: 'Detailed Pixar-style 3D render.' },
  [VideoStyle.PIXAR_NATURE]: { label: 'PIXAR NATURE', color: 'bg-emerald-500', description: 'Pixar-style nature adventure.' },
  [VideoStyle.ANIME]: { label: 'ANIME', color: 'bg-pink-600', description: 'Sharp lines, vibrant anime colors.' },
  [VideoStyle.GHIBLI]: { label: 'GHIBLI', color: 'bg-green-600', description: 'Hand-painted watercolor aesthetic.' },
  [VideoStyle.DREAMSCAPE]: { label: 'DREAMSCAPE', color: 'bg-purple-600', description: 'Surreal, glowing highlights.' },
  [VideoStyle.MONOCHROME_SKETCH]: { label: 'SKETCH', color: 'bg-zinc-600', description: 'Hand-drawn graphite textures.' },
  [VideoStyle.RETRO_SCI_FI]: { label: '70S SCI-FI', color: 'bg-red-600', description: '70s technicolor film aesthetic.' },
  [VideoStyle.NOIR]: { label: 'NOIR', color: 'bg-black', description: 'Film Noir high-contrast shadows.' },
  [VideoStyle.RETRO]: { label: '80S VHS', color: 'bg-indigo-600', description: '80s VHS glitch aesthetic.' },
  [VideoStyle.CYBERPUNK]: { label: 'CYBERPUNK', color: 'bg-fuchsia-600', description: 'Neon rain and high-tech grit.' },
  [VideoStyle.CLAYMATION]: { label: 'CLAYMATION', color: 'bg-amber-700', description: 'Tactile stop-motion clay look.' },
  [VideoStyle.OIL_PAINTING]: { label: 'OIL PAINTING', color: 'bg-yellow-600', description: 'Impasto brushstrokes in motion.' },
  [VideoStyle.VAPORWAVE]: { label: 'VAPORWAVE', color: 'bg-cyan-500', description: '80s/90s digital surrealism.' },
  [VideoStyle.STOP_MOTION]: { label: 'STOP MOTION', color: 'bg-stone-500', description: 'Handcrafted stop-motion feel.' },
  [VideoStyle.COMIC_ANIMATION]: { label: 'COMIC MOTION', color: 'bg-blue-700', description: 'Animated sequential panel structure.' },
  [VideoStyle.SURREAL_GLITCH]: { label: 'GLITCH', color: 'bg-lime-500', description: 'Digital distortions and glitches.' },
  [VideoStyle.PIXEL_ART]: { label: 'PIXEL ART', color: 'bg-green-500', description: '16-bit retro game aesthetic.' },
  [VideoStyle.STEAMPUNK]: { label: 'STEAMPUNK', color: 'bg-amber-600', description: 'Victorian brass and steam look.' },
  [VideoStyle.HOLOGRAM]: { label: 'HOLOGRAM', color: 'bg-sky-400', description: 'Digital blue hologram projection.' },
  [VideoStyle.PAPER_CUTOUT]: { label: 'CUTOUT', color: 'bg-rose-400', description: 'Layered paper cutout animation.' },
  [VideoStyle.KALEIDOSCOPE]: { label: 'KALEIDOSCOPE', color: 'bg-indigo-500', description: 'Mirrored geometric patterns.' },
  [VideoStyle.SYNTHWAVE]: { label: 'SYNTHWAVE', color: 'bg-fuchsia-900', description: '80s neon grid and chrome look.' },
  [VideoStyle.INK_WASH]: { label: 'INK WASH', color: 'bg-zinc-950', description: 'Traditional Sumi-e brush motion.' },
  [VideoStyle.MACRO_NATURE]: { label: 'MACRO', color: 'bg-emerald-600', description: 'Extreme close-up nature detail.' },
  [VideoStyle.FANTASY_MAP]: { label: 'MAP', color: 'bg-orange-200', description: 'Moving ancient parchment illustrations.' },
};

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onGenerated, availableImages, initialSelectedId }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.LANDSCAPE);
  const [resolution, setResolution] = useState<Resolution>(Resolution.HD);
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>(VideoStyle.DEFAULT);
  const [selectedPreset, setSelectedPreset] = useState<AnimationPreset>(AnimationPreset.STABLE);
  
  const [startFrameId, setStartFrameId] = useState<string | null>(initialSelectedId || null);
  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<'start' | 'ref'>('start');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startFrameId) {
      const img = availableImages.find(i => i.id === startFrameId);
      if (img?.type === 'comic') {
        setSelectedStyle(VideoStyle.COMIC_ANIMATION);
        setAspectRatio(AspectRatio.LANDSCAPE);
      }
    }
  }, [startFrameId, availableImages]);

  const handleLibraryClick = (id: string) => {
    if (selectionMode === 'start') {
      setStartFrameId(prev => prev === id ? null : id);
    } else {
      setReferenceIds(prev => {
        if (prev.includes(id)) return prev.filter(i => i !== id);
        if (prev.length >= 3) return [...prev.slice(1), id];
        return [...prev, id];
      });
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !startFrameId) {
      setError("Please provide a prompt or select a start frame to animate.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const referenceImages = referenceIds.map(id => availableImages.find(img => img.id === id)?.url).filter(Boolean) as string[];
      const startingFrame = startFrameId ? availableImages.find(img => img.id === startFrameId)?.url : undefined;
      
      const { url, videoMeta } = await GeminiService.generateVideo(
        prompt || "Dynamic animated movement based on character references.", 
        aspectRatio, 
        resolution, 
        selectedStyle, 
        referenceImages, 
        undefined, 
        undefined, 
        selectedPreset,
        startingFrame
      );
      
      onGenerated({
        id: Math.random().toString(36).substr(2, 9),
        type: 'video',
        url,
        prompt: `${selectedStyle} Production: ${prompt || 'Animated Narrative'}`,
        timestamp: Date.now(),
        metadata: { videoMeta, referenceImages, style: selectedStyle, preset: selectedPreset }
      });
      
      setPrompt('');
      setStartFrameId(null);
      setReferenceIds([]);
    } catch (err: any) {
      setError(err.message || 'Production encountered a rendering error.');
    } finally {
      setLoading(false);
    }
  };

  const comics = availableImages.filter(img => img.type === 'comic');
  const otherImages = availableImages.filter(img => img.type !== 'comic');

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-8">
        <div>
          <h2 className="text-4xl font-bold mb-2 tracking-tight text-white font-cinematic uppercase tracking-widest">Cinematic Studio</h2>
          <p className="text-zinc-500 uppercase text-[10px] font-bold">Synthesize high-fidelity video narratives from your character assets.</p>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800 shadow-xl">
          <button 
            onClick={() => setSelectionMode('start')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all uppercase ${selectionMode === 'start' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >Set Start Frame</button>
          <button 
            onClick={() => setSelectionMode('ref')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all uppercase ${selectionMode === 'ref' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >Set Style Refs</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Production Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[3rem] shadow-2xl space-y-8 halftone">
            
            {/* Action Prompt */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Script & Action</label>
              <textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="Describe the cinematic action... e.g. 'Hero jumps over the obstacle while looking back at camera'..." 
                className="w-full h-32 bg-zinc-950 border-none rounded-2xl p-5 text-sm text-zinc-100 placeholder-zinc-800 focus:ring-1 focus:ring-indigo-500 transition-all resize-none font-medium leading-relaxed" 
              />
            </div>

            {/* Aesthetics & Movement */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Aesthetic</label>
                <select 
                  value={selectedStyle} 
                  onChange={(e) => setSelectedStyle(e.target.value as VideoStyle)}
                  className="w-full bg-zinc-950 border-none rounded-xl p-3 text-[10px] font-black text-white focus:ring-1 focus:ring-indigo-500 appearance-none uppercase"
                >
                  {Object.entries(STYLE_METADATA).map(([style, meta]) => (
                    <option key={style} value={style}>{meta.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Movement</label>
                <select 
                  value={selectedPreset} 
                  onChange={(e) => setSelectedPreset(e.target.value as AnimationPreset)}
                  className="w-full bg-zinc-950 border-none rounded-xl p-3 text-[10px] font-black text-white focus:ring-1 focus:ring-indigo-500 appearance-none uppercase"
                >
                  {Object.keys(AnimationPreset).map(preset => (
                    <option key={preset} value={preset}>{preset.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={loading || (!prompt && !startFrameId)} 
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>🎞️ Produce Masterpiece</span>
                </>
              )}
            </button>
            {error && <p className="text-red-400 text-[10px] text-center uppercase font-black tracking-widest animate-pulse">Alert: {error}</p>}
          </div>

          <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] space-y-4">
             <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Director's Tip</h4>
             <p className="text-xs text-zinc-500 leading-relaxed italic">
               "Using a **Comic Strip** as your Start Frame tells the AI to animate the sequence of events across panels into a cohesive video narrative."
             </p>
          </div>
        </div>

        {/* Visual Workbench */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Primary Animation Subject (Start Frame) */}
            <div 
              onClick={() => setSelectionMode('start')}
              className={`group p-8 bg-zinc-900 border-2 rounded-[3rem] transition-all cursor-pointer relative overflow-hidden ${selectionMode === 'start' ? 'border-indigo-500 shadow-2xl bg-indigo-500/5' : 'border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-700'}`}
            >
              <div className="flex justify-between items-center mb-6">
                 <h3 className={`text-xs font-black uppercase tracking-widest ${selectionMode === 'start' ? 'text-indigo-400' : 'text-zinc-500'}`}>01 Animation Subject</h3>
                 {startFrameId && <button onClick={(e) => { e.stopPropagation(); setStartFrameId(null); }} className="text-[10px] text-red-500 font-bold hover:underline">RESET</button>}
              </div>
              
              <div className="aspect-video bg-black/60 rounded-[2rem] border-2 border-zinc-800 flex items-center justify-center relative overflow-hidden shadow-inner">
                 {startFrameId ? (
                   <img src={availableImages.find(i => i.id === startFrameId)?.url} className="w-full h-full object-contain p-2" />
                 ) : (
                   <div className="text-center p-10 opacity-20">
                     <span className="text-5xl block mb-4">📽️</span>
                     <span className="text-[9px] font-black uppercase tracking-[0.2em]">Drop Story Asset Here</span>
                   </div>
                 )}
                 {selectionMode === 'start' && !startFrameId && (
                   <div className="absolute inset-0 border-4 border-indigo-500/30 border-dashed rounded-[2rem] animate-pulse pointer-events-none"></div>
                 )}
              </div>
              <p className="text-[9px] text-zinc-600 mt-5 font-black uppercase tracking-tighter">Brings the selected character/comic to life in motion.</p>
            </div>

            {/* Character Consistency (References) */}
            <div 
              onClick={() => setSelectionMode('ref')}
              className={`group p-8 bg-zinc-900 border-2 rounded-[3rem] transition-all cursor-pointer relative overflow-hidden ${selectionMode === 'ref' ? 'border-purple-500 shadow-2xl bg-purple-500/5' : 'border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-700'}`}
            >
              <div className="flex justify-between items-center mb-6">
                 <h3 className={`text-xs font-black uppercase tracking-widest ${selectionMode === 'ref' ? 'text-purple-400' : 'text-zinc-500'}`}>02 Style DNA ({referenceIds.length}/3)</h3>
                 {referenceIds.length > 0 && <button onClick={(e) => { e.stopPropagation(); setReferenceIds([]); }} className="text-[10px] text-red-500 font-bold hover:underline">RESET</button>}
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                 {[0, 1, 2].map(idx => (
                   <div key={idx} className="aspect-square bg-black/60 rounded-2xl border-2 border-zinc-800 relative overflow-hidden flex items-center justify-center shadow-inner">
                     {referenceIds[idx] ? (
                       <img src={availableImages.find(i => i.id === referenceIds[idx])?.url} className="w-full h-full object-cover" />
                     ) : (
                       <span className="text-zinc-800 text-2xl font-black">?</span>
                     )}
                   </div>
                 ))}
              </div>
              <p className="text-[9px] text-zinc-600 mt-5 font-black uppercase tracking-tighter">Ensures consistent character detail across every frame.</p>
              {selectionMode === 'ref' && (
                 <div className="absolute inset-0 border-4 border-purple-500/30 border-dashed rounded-[3rem] animate-pulse pointer-events-none"></div>
              )}
            </div>
          </div>

          {/* Library Section */}
          <div className="space-y-6">
             <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Asset Library</h4>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase shadow-lg ${selectionMode === 'start' ? 'bg-indigo-600 text-white' : 'bg-purple-600 text-white'}`}>
                  Targeting: {selectionMode === 'start' ? 'Subject' : 'Style DNA'}
                </div>
             </div>
             
             <div className="space-y-8">
               {comics.length > 0 && (
                 <div className="space-y-4">
                   <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Story Sequences (Comics)</p>
                   <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                     {comics.map(img => (
                       <AssetThumbnail 
                        key={img.id} 
                        img={img} 
                        isSelected={startFrameId === img.id || referenceIds.includes(img.id)}
                        isStart={startFrameId === img.id}
                        isRef={referenceIds.includes(img.id)}
                        onClick={() => handleLibraryClick(img.id)}
                       />
                     ))}
                   </div>
                 </div>
               )}

               <div className="space-y-4">
                 <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Character Profiles (Posters & Stills)</p>
                 <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                   {otherImages.map(img => (
                     <AssetThumbnail 
                      key={img.id} 
                      img={img} 
                      isSelected={startFrameId === img.id || referenceIds.includes(img.id)}
                      isStart={startFrameId === img.id}
                      isRef={referenceIds.includes(img.id)}
                      onClick={() => handleLibraryClick(img.id)}
                     />
                   ))}
                   {availableImages.length === 0 && (
                     <div className="col-span-full py-16 text-center bg-zinc-900/40 rounded-[2rem] border-2 border-dashed border-zinc-800 opacity-30">
                        <p className="text-[10px] font-black uppercase tracking-widest">No production assets found.</p>
                     </div>
                   )}
                 </div>
               </div>
             </div>
          </div>

          {/* Rendering Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-2xl z-[150] flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
               <div className="relative mb-12">
                  <div className="w-32 h-32 border-4 border-indigo-500/10 rounded-full"></div>
                  <div className="w-32 h-32 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 shadow-[0_0_80px_rgba(79,70,229,0.4)]"></div>
               </div>
               <h3 className="text-4xl font-bold mb-4 tracking-tight text-white uppercase font-cinematic">Temporal Synthesis</h3>
               <div className="max-w-md w-full space-y-6">
                  <p className="text-zinc-500 text-sm leading-relaxed italic font-bold uppercase tracking-wide">
                    {referenceIds.length > 0 ? "Synthesizing motion while locking character consistency references..." : "Developing motion sequence from start frame..."}
                  </p>
                  <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div className="h-full bg-indigo-600 animate-[progress_15s_ease-in-out_infinite]"></div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          10% { width: 5%; }
          50% { width: 85%; }
          100% { width: 100%; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
      `}</style>
    </div>
  );
};

interface AssetThumbnailProps {
  img: GeneratedContent;
  isSelected: boolean;
  isStart: boolean;
  isRef: boolean;
  onClick: () => void;
}

const AssetThumbnail: React.FC<AssetThumbnailProps> = ({ img, isSelected, isStart, isRef, onClick }) => (
  <button 
    onClick={onClick}
    className={`aspect-[3/4] rounded-2xl overflow-hidden relative border-2 transition-all duration-300 ${
      isSelected 
        ? (isStart ? 'border-indigo-500 scale-95 shadow-2xl' : 'border-purple-500 scale-95 shadow-2xl') 
        : 'border-zinc-800 opacity-60 hover:opacity-100 hover:scale-105 hover:border-zinc-600 shadow-lg'
    }`}
  >
    <img src={img.url} className="w-full h-full object-cover" loading="lazy" />
    <div className="absolute top-1 left-1 flex gap-1">
      {img.type === 'comic' && (
        <span className="bg-black/80 text-white text-[6px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest border border-white/10">STORY</span>
      )}
    </div>
    {isStart && (
      <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center backdrop-blur-[2px]">
         <span className="text-2xl drop-shadow-lg">🎬</span>
      </div>
    )}
    {isRef && (
      <div className="absolute inset-0 bg-purple-600/40 flex items-center justify-center backdrop-blur-[2px]">
         <span className="text-2xl drop-shadow-lg">🧬</span>
      </div>
    )}
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
       <p className="text-[6px] text-white font-bold truncate opacity-80 uppercase tracking-tighter">{img.prompt}</p>
    </div>
  </button>
);
