
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

const PRESET_METADATA: Record<AnimationPreset, { label: string }> = {
  [AnimationPreset.STABLE]: { label: 'STABLE' },
  [AnimationPreset.SLOW_PAN]: { label: 'CINEMATIC PAN' },
  [AnimationPreset.DYNAMIC_ACTION]: { label: 'HIGH-OCTANE' },
  [AnimationPreset.ORBITAL_SWEEP]: { label: 'ORBITAL SWEEP' },
  [AnimationPreset.DOLLY_ZOOM]: { label: 'DOLLY ZOOM' },
  [AnimationPreset.HANDHELD_SHAKE]: { label: 'HANDHELD' },
  [AnimationPreset.TIME_LAPSE]: { label: 'TIME-LAPSE' },
  [AnimationPreset.STOP_MOTION_JITTER]: { label: 'STOP-MOTION' },
};

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onGenerated, availableImages, initialSelectedId }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.LANDSCAPE);
  const [resolution, setResolution] = useState<Resolution>(Resolution.HD);
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>(VideoStyle.DEFAULT);
  const [selectedPreset, setSelectedPreset] = useState<AnimationPreset>(AnimationPreset.STABLE);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>(initialSelectedId ? [initialSelectedId] : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedImageIds.length > 0) {
      const lastImgId = selectedImageIds[selectedImageIds.length - 1];
      const img = availableImages.find(i => i.id === lastImgId);
      if (img?.type === 'comic') {
        setSelectedStyle(VideoStyle.COMIC_ANIMATION);
        setAspectRatio(AspectRatio.LANDSCAPE);
      }
    }
  }, [selectedImageIds, availableImages]);

  const toggleImageSelection = (id: string) => {
    setSelectedImageIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev.slice(-2), id]);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && selectedImageIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const referenceImages = selectedImageIds.map(id => availableImages.find(img => img.id === id)?.url).filter(Boolean) as string[];
      // If we pre-selected from "Animate", use that as the starting frame
      const startingFrame = initialSelectedId ? availableImages.find(img => img.id === initialSelectedId)?.url : undefined;
      
      const { url, videoMeta } = await GeminiService.generateVideo(
        prompt || "Animate the characters with dynamic movement.", 
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
        prompt: `${selectedStyle} (${selectedPreset}): ${prompt || 'Animated Sequence'}`,
        timestamp: Date.now(),
        metadata: { videoMeta, referenceImages, style: selectedStyle, preset: selectedPreset }
      });
      setPrompt('');
      setSelectedImageIds([]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <h2 className="text-4xl font-bold mb-2 tracking-tight text-white font-cinematic uppercase tracking-widest">Cinematic Video Studio</h2>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-4 tracking-widest">Artistic Aesthetic</label>
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(STYLE_METADATA).map(([style, meta]) => (
                  <button key={style} onClick={() => setSelectedStyle(style as VideoStyle)} className={`p-3 rounded-2xl border-2 transition-all flex flex-col gap-2 text-left relative overflow-hidden group ${selectedStyle === style ? 'border-indigo-500 bg-indigo-500/5' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}>
                    <p className={`text-[9px] font-black uppercase relative z-10 ${selectedStyle === style ? 'text-indigo-400' : 'text-zinc-500'}`}>{meta.label}</p>
                    <div className={`absolute bottom-0 right-0 w-12 h-12 ${meta.color} opacity-5 rounded-tl-full`}></div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-4 tracking-widest">Animation Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRESET_METADATA).map(([preset, meta]) => (
                  <button key={preset} onClick={() => setSelectedPreset(preset as AnimationPreset)} className={`px-3 py-2 rounded-xl border text-[9px] font-bold uppercase flex items-center gap-2 transition-all ${selectedPreset === preset ? 'bg-indigo-600 text-white' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}>
                    <span className="truncate">{meta.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-4 tracking-widest">References ({selectedImageIds.length}/3)</label>
              <div className="grid grid-cols-3 gap-2">
                {availableImages.map(img => (
                  <button key={img.id} onClick={() => toggleImageSelection(img.id)} className={`aspect-square rounded-xl border-2 overflow-hidden relative ${selectedImageIds.includes(img.id) ? 'border-indigo-500 scale-95 shadow-lg' : 'border-zinc-800 opacity-60'}`}>
                    <img src={img.url} className="w-full h-full object-cover" />
                    {selectedImageIds.includes(img.id) && <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center text-[10px] font-black text-white">SELECTED</div>}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the action movement..." className="w-full h-24 bg-zinc-950 border-none rounded-2xl p-4 text-xs text-white resize-none" />
            <button onClick={handleGenerate} disabled={loading || (!prompt && selectedImageIds.length === 0)} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-3">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="uppercase tracking-widest">Produce Video</span>}
            </button>
            {error && <p className="text-red-400 text-[10px] text-center uppercase font-bold">{error}</p>}
          </div>
        </div>
        <div className="lg:col-span-8 space-y-6">
          <div className="aspect-video rounded-[3rem] bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center relative overflow-hidden shadow-2xl group">
             <div className="text-center p-20 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                <p className="text-2xl font-cinematic tracking-[0.4em] uppercase text-white">Studio Monitor</p>
                <p className="text-xs mt-4 font-bold tracking-widest text-indigo-400 uppercase">{selectedStyle} - {selectedPreset}</p>
             </div>
             {loading && (
               <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-3xl z-30 flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
                  <div className="w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-10 shadow-[0_0_60px_rgba(79,70,229,0.3)]"></div>
                  <h3 className="text-3xl font-bold mb-4 tracking-tight text-white uppercase font-cinematic">Temporal Synthesis</h3>
                  <p className="text-zinc-500 text-sm max-w-sm italic leading-relaxed uppercase">"Animating characters from {initialSelectedId ? 'selected source' : 'references'}. Maintaining visual identity across {resolution} frames..."</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
