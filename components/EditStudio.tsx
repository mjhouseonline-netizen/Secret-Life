
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
  prompt: string;
  category: 'Style' | 'Lighting' | 'Atmosphere';
}

const EDIT_PRESETS: EditPreset[] = [
  { id: 'pixar', label: 'PIXAR 3D', category: 'Style', prompt: 'Transform into a modern Pixar-style 3D animated character.' },
  { id: 'ghibli', label: 'STU GHIBLI', category: 'Style', prompt: 'Apply a Studio Ghibli hand-painted watercolor aesthetic.' },
  { id: 'sketch', label: 'SKETCH', category: 'Style', prompt: 'Convert into a detailed monochrome graphite pencil sketch.' },
  { id: 'oil', label: 'OIL PAINT', category: 'Style', prompt: 'Reimagine as a classic Renaissance oil painting.' },
  { id: 'cyber', label: 'CYBERPUNK', category: 'Style', prompt: 'Style with high-tech cyberpunk elements and neon highlights.' },
  { id: 'noir', label: 'FILM NOIR', category: 'Lighting', prompt: 'Apply extreme high-contrast black and white lighting.' },
  { id: 'golden', label: 'GOLDEN HOUR', category: 'Lighting', prompt: 'Bathe the scene in warm, low-angle golden sunlight.' },
  { id: 'neon', label: 'NEON GLOW', category: 'Lighting', prompt: 'Illuminate with vibrant pink and cyan neon lights.' },
  { id: 'fog', label: 'MOODY FOG', category: 'Atmosphere', prompt: 'Add a dense, cinematic ground fog.' },
  { id: 'rain', label: 'RAIN', category: 'Atmosphere', prompt: 'Add realistic falling rain and wet surfaces.' },
  { id: 'vintage', label: 'VHS RETRO', category: 'Atmosphere', prompt: 'Apply 80s VHS grain and tracking distortion.' },
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
    const source = selectedImageId === 'custom' ? customImage : availableImages.find(i => i.id === selectedImageId)?.url;
    if (!source) return;
    setLoading(true);
    setError(null);
    try {
      const presetPrompts = selectedPresets.map(id => EDIT_PRESETS.find(p => p.id === id)?.prompt).join(' ');
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
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end border-b-4 border-black pb-8 transform -rotate-1">
        <div>
          <h2 className="text-5xl font-comic text-white stroke-black-bold drop-shadow-[4px_4px_0px_#000] uppercase leading-none">THE LAB</h2>
          <div className="bg-cyan-400 text-black px-3 py-1 inline-block text-[10px] font-black uppercase mt-2 tracking-widest border-2 border-black">POST-PRODUCTION WORKFLOW</div>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white border-4 border-black text-black font-black uppercase text-[10px] shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">UPLOAD SOURCE</button>
        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border-[6px] border-black p-8 shadow-[12px_12px_0px_0px_#000] space-y-8 relative overflow-hidden text-black">
            <div className="absolute inset-0 comic-hatch opacity-5 pointer-events-none"></div>

            <div>
              <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-4 ml-1">WORK-IN-PROGRESS</label>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {customImage && (
                  <button onClick={() => setSelectedImageId('custom')} className={`aspect-square border-4 overflow-hidden ${selectedImageId === 'custom' ? 'border-cyan-400 scale-95 shadow-[4px_4px_0px_#000]' : 'border-black opacity-40'}`}>
                    <img src={customImage} className="w-full h-full object-cover" />
                  </button>
                )}
                {availableImages.map(img => (
                  <button key={img.id} onClick={() => setSelectedImageId(img.id)} className={`aspect-square border-4 overflow-hidden ${selectedImageId === img.id ? 'border-cyan-400 scale-95 shadow-[4px_4px_0px_#000]' : 'border-black opacity-40'}`}>
                    <img src={img.url} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
               <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">CREATIVE LENSES</label>
               <div className="grid grid-cols-2 gap-2">
                  {EDIT_PRESETS.map(preset => (
                    <button key={preset.id} onClick={() => togglePreset(preset.id)} className={`p-3 border-4 font-black uppercase text-[10px] transition-all text-center ${selectedPresets.includes(preset.id) ? 'bg-yellow-400 border-black shadow-[4px_4px_0px_#000]' : 'bg-zinc-100 border-zinc-200 text-zinc-400 hover:border-black'}`}>
                      {preset.label}
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">DIRECTOR TWEAKS</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="ADD GLASSES, RED FUR, RAIN, ETC..." className="w-full h-24 bg-zinc-50 border-4 border-black p-4 text-black font-black uppercase text-xs focus:border-cyan-400 outline-none resize-none" />
            </div>

            <button onClick={handleEdit} disabled={loading || !selectedImageId} className="w-full py-6 bg-magenta-500 border-4 border-black text-white font-comic text-3xl uppercase shadow-[8px_8px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-30">
              {loading ? 'INKING...' : 'WHAM! TRANSFORM!'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white border-[6px] border-black p-6 shadow-[16px_16px_0px_0px_#000] h-full flex items-center justify-center relative overflow-hidden group">
             {selectedImageId ? (
                <div className="relative w-full h-full">
                   <img src={showOriginal ? originalSource : currentMainImage} className={`w-full h-full object-contain border-4 border-black transition-all ${loading ? 'blur-lg opacity-30' : 'opacity-100'}`} />
                   {!loading && currentMainImage !== originalSource && (
                     <button onMouseDown={() => setShowOriginal(true)} onMouseUp={() => setShowOriginal(false)} onMouseLeave={() => setShowOriginal(false)} className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-black text-white border-2 border-white text-[10px] font-black uppercase shadow-[4px_4px_0px_#000]">HOLD TO COMPARE</button>
                   )}
                </div>
             ) : (
                <div className="text-center p-20 opacity-20 flex flex-col items-center">
                  <div className="w-96 h-64 bg-zinc-100 border-4 border-black flex items-center justify-center mb-10 transform rotate-1">
                    <span className="text-8xl font-comic text-black">?</span>
                  </div>
                  <h3 className="text-5xl font-comic uppercase text-black tracking-widest">DARKROOM PREVIEW</h3>
                </div>
             )}
             
             {loading && (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
                  <h3 className="text-8xl font-comic text-black stroke-black-bold drop-shadow-[6px_6px_0px_#fff] uppercase mb-4 animate-bounce">DEVELOPING!</h3>
                  <p className="text-black text-xs font-black uppercase tracking-widest">Recalculating production DNA...</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
