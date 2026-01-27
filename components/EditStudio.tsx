
import React, { useState, useRef } from 'react';
import { GeminiService } from '../services/gemini';
import { GeneratedContent } from '../types';

interface EditStudioProps {
  onGenerated: (content: GeneratedContent) => void;
  availableImages: GeneratedContent[];
}

interface EditPreset {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  category: 'Style' | 'Lighting' | 'Atmosphere';
}

const EDIT_PRESETS: EditPreset[] = [
  // Styles
  { id: 'pixar', label: 'PIXAR 3D', icon: '', category: 'Style', prompt: 'Transform into a modern Pixar-style 3D animated character with soft subsurface scattering and expressive eyes.' },
  { id: 'ghibli', label: 'STU GHIBLI', icon: '', category: 'Style', prompt: 'Apply a Studio Ghibli hand-painted watercolor aesthetic with soft, whimsical textures.' },
  { id: 'sketch', label: 'SKETCH', icon: '', category: 'Style', prompt: 'Convert the image into a highly detailed monochrome graphite pencil sketch with visible hatching.' },
  { id: 'oil', label: 'OIL PAINT', icon: '', category: 'Style', prompt: 'Reimagine as a classic Renaissance oil painting with thick impasto brushstrokes and canvas texture.' },
  { id: 'cyber', label: 'CYBERPUNK', icon: '', category: 'Style', prompt: 'Style the scene with high-tech cyberpunk elements, neon highlights, and futuristic grit.' },
  
  // Lighting
  { id: 'noir', label: 'FILM NOIR', icon: '', category: 'Lighting', prompt: 'Apply extreme high-contrast black and white lighting with deep chiaroscuro shadows.' },
  { id: 'golden', label: 'GOLDEN HOUR', icon: '', category: 'Lighting', prompt: 'Bathe the scene in warm, low-angle golden sunlight with soft lens flares.' },
  { id: 'neon', label: 'NEON GLOW', icon: '', category: 'Lighting', prompt: 'Illuminate with vibrant pink and cyan neon lights, creating a vaporwave atmospheric glow.' },
  { id: 'dramatic', label: 'DRAMATIC', icon: '', category: 'Lighting', prompt: 'Add intense rim lighting to separate the subject from the dark background.' },
  
  // Atmosphere
  { id: 'fog', label: 'MOODY FOG', icon: '', category: 'Atmosphere', prompt: 'Add a dense, cinematic ground fog and atmospheric haze to the environment.' },
  { id: 'rain', label: 'RAIN', icon: '', category: 'Atmosphere', prompt: 'Add realistic falling rain, wet surfaces, and moody reflections.' },
  { id: 'particles', label: 'PARTICLES', icon: '', category: 'Atmosphere', prompt: 'Add floating magical embers, dust particles, and soft bokeh light spots.' },
  { id: 'vintage', label: 'VHS RETRO', icon: '', category: 'Atmosphere', prompt: 'Apply 80s VHS grain, chromatic aberration, and slight analog tracking distortion.' },
];

export const EditStudio: React.FC<EditStudioProps> = ({ onGenerated, availableImages }) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
        setSelectedImageId('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePreset = (id: string) => {
    setSelectedPresets(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleEdit = async () => {
    const source = selectedImageId === 'custom' 
      ? customImage 
      : availableImages.find(i => i.id === selectedImageId)?.url;

    if (!source) return;

    setLoading(true);
    setError(null);
    try {
      const presetPrompts = selectedPresets
        .map(id => EDIT_PRESETS.find(p => p.id === id)?.prompt)
        .join(' ');
      
      const fullPrompt = `${presetPrompts} ${prompt}`.trim();
      
      const url = await GeminiService.editImage(source, fullPrompt);
      
      setHistory(prev => [url, ...prev].slice(0, 5));
      
      onGenerated({
        id: Math.random().toString(36).substr(2, 9),
        type: 'edit',
        url,
        prompt: `Reimagined: ${fullPrompt.substring(0, 50)}...`,
        timestamp: Date.now()
      });
      
      setPrompt('');
      setSelectedPresets([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentMainImage = history[0] || (selectedImageId === 'custom' ? customImage : availableImages.find(i => i.id === selectedImageId)?.url);
  const originalSource = selectedImageId === 'custom' ? customImage : availableImages.find(i => i.id === selectedImageId)?.url;

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-8">
        <div>
          <h2 className="text-4xl font-bold mb-2 tracking-tight text-white font-cinematic uppercase tracking-widest">Image Lab</h2>
          <p className="text-zinc-400 uppercase text-[10px] font-bold">Apply cinematic lenses and artistic reimagining to your production assets.</p>
        </div>
        <div className="flex gap-3">
           <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-xl text-[10px] uppercase transition-all border border-zinc-700"
           >
             Upload Photo
           </button>
           <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl space-y-8">
            {/* Source Selection */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Select Work-In-Progress</label>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {customImage && (
                  <button
                    onClick={() => setSelectedImageId('custom')}
                    className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${selectedImageId === 'custom' ? 'border-indigo-500 scale-95 shadow-lg' : 'border-zinc-800 opacity-60'}`}
                  >
                    <img src={customImage} className="w-full h-full object-cover" />
                  </button>
                )}
                {availableImages.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageId(img.id)}
                    className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${selectedImageId === img.id ? 'border-indigo-500 scale-95 shadow-lg' : 'border-zinc-800 opacity-60'}`}
                  >
                    <img src={img.url} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-6">
               <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Creative Lenses</label>
               
               <div className="space-y-6">
                  {(['Style', 'Lighting', 'Atmosphere'] as const).map(cat => (
                    <div key={cat} className="space-y-3">
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">{cat}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {EDIT_PRESETS.filter(p => p.category === cat).map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => togglePreset(preset.id)}
                            className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                              selectedPresets.includes(preset.id)
                                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase truncate">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Custom Prompt */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Manual Adjustment</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Specific tweaks: 'Change fur to red', 'Add a bow tie'..."
                className="w-full h-24 bg-zinc-950 border-none rounded-2xl p-4 text-white placeholder-zinc-700 focus:ring-1 focus:ring-indigo-500 transition-all resize-none text-xs uppercase font-bold"
              />
            </div>

            <button
              onClick={handleEdit}
              disabled={loading || !selectedImageId}
              className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>REIMAGINING...</span>
                </>
              ) : (
                <>
                  <span>APPLY TRANSFORMATION</span>
                </>
              )}
            </button>
            {error && <p className="text-red-400 text-[10px] text-center uppercase font-bold">{error}</p>}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="w-full aspect-video rounded-[3rem] bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center relative overflow-hidden shadow-2xl group">
             {selectedImageId ? (
                <div className="relative w-full h-full">
                   <img 
                    src={showOriginal ? originalSource : currentMainImage} 
                    className={`w-full h-full object-contain transition-all duration-500 ${loading ? 'blur-xl scale-110 opacity-50' : 'blur-0 scale-100 opacity-100'}`}
                   />
                   
                   {!loading && currentMainImage !== originalSource && (
                     <button
                      onMouseDown={() => setShowOriginal(true)}
                      onMouseUp={() => setShowOriginal(false)}
                      onMouseLeave={() => setShowOriginal(false)}
                      className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:bg-black transition-all"
                     >
                       HOLD TO COMPARE
                     </button>
                   )}
                </div>
             ) : (
                <div className="text-center p-20 opacity-10">
                  <p className="text-3xl font-cinematic tracking-[0.4em] uppercase text-white">Darkroom Preview</p>
                  <p className="text-sm mt-4 font-bold tracking-widest text-zinc-500 uppercase">Select a source to begin developing</p>
                </div>
             )}
             
             {loading && (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
                  <div className="w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-10 shadow-[0_0_60px_rgba(79,70,229,0.3)]"></div>
                  <h3 className="text-3xl font-bold mb-4 tracking-tight text-white uppercase font-cinematic">Developing Vision</h3>
                  <p className="text-zinc-500 text-sm max-w-sm leading-relaxed italic uppercase font-bold">
                    Gemini 2.5 is synthesizing the selected creative lenses onto your asset. 
                    Maintaining semantic structure while altering artistic style...
                  </p>
               </div>
             )}
          </div>

          {/* History reel */}
          {history.length > 1 && (
            <div className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] animate-in slide-in-from-bottom-4">
               <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">Recent Variations</h4>
               <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {history.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const newHist = [...history];
                        const item = newHist.splice(idx, 1)[0];
                        setHistory([item, ...newHist]);
                      }}
                      className="w-32 aspect-video rounded-xl border-2 border-zinc-800 overflow-hidden flex-shrink-0 hover:border-indigo-500 transition-all shadow-lg"
                    >
                       <img src={url} className="w-full h-full object-cover" />
                    </button>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
      `}</style>
    </div>
  );
};
