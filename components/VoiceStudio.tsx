
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/gemini';
import { decode, decodeAudioData } from '../utils/audio';
import { CustomVoiceProfile } from '../types';

export const VoiceStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'script' | 'cloning'>('script');
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [loading, setLoading] = useState(false);
  const [cloningLoading, setCloningLoading] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clones, setClones] = useState<CustomVoiceProfile[]>([]);
  const [cloningFile, setCloningFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cinepet_voice_clones');
    if (saved) {
      try {
        setClones(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse clones", e);
      }
    }
  }, []);

  const saveClones = (newClones: CustomVoiceProfile[]) => {
    setClones(newClones);
    localStorage.setItem('cinepet_voice_clones', JSON.stringify(newClones));
  };

  const voiceOptions = [
    { value: 'Kore', label: 'Kore', style: 'Neutral', meta: 'Balanced Mid-Atlantic' },
    { value: 'Puck', label: 'Puck', style: 'Energetic', meta: 'British Tonal Style' },
    { value: 'Charon', label: 'Charon', style: 'Authoritative', meta: 'Deep & Wise' },
    { value: 'Fenrir', label: 'Fenrir', style: 'Gritty', meta: 'Rugged & Raw' },
    { value: 'Zephyr', label: 'Zephyr', style: 'Professional', meta: 'Bright & Clear' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCloningFile({
          data: reader.result as string,
          mimeType: file.type,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClone = async () => {
    if (!cloningFile) return;
    setCloningLoading(true);
    setError(null);
    try {
      const result = await GeminiService.analyzeVoice(cloningFile.data, cloningFile.mimeType, true);
      const newClone: CustomVoiceProfile = {
        id: Math.random().toString(36).substr(2, 9),
        name: cloningFile.name.split('.')[0].toUpperCase(),
        sampleUrl: cloningFile.data,
        analysis: result.description,
        baseVoice: result.closestPrebuiltVoice,
        quality: 1.0,
        isCleaned: true
      };
      const updated = [newClone, ...clones];
      saveClones(updated);
      setCloningFile(null);
      setActiveTab('script');
      setSelectedVoice(newClone.baseVoice);
    } catch (err: any) {
      setError(err.message || "VOICE ANALYSIS FAILED");
    } finally {
      setCloningLoading(false);
    }
  };

  const playAudio = async (audioText: string, voiceName: string, isPreview: boolean = false) => {
    if (!audioText) return;
    if (isPreview) setPreviewing(voiceName);
    else setLoading(true);
    setError(null);
    try {
      const base64 = await GeminiService.generateSpeech(audioText, voiceName);
      if (!base64) throw new Error("Synthesis failed");
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      if (isPreview) source.onended = () => setPreviewing(null);
    } catch (err: any) {
      setError(err.message);
      setPreviewing(null);
    } finally {
      if (!isPreview) setLoading(false);
    }
  };

  const deleteClone = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = clones.filter(c => c.id !== id);
    saveClones(updated);
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8 transform -rotate-1">
        <div>
          <h2 className="text-5xl font-comic text-white stroke-black-bold drop-shadow-[4px_4px_0px_#000] uppercase tracking-wider">VOICE STUDIO</h2>
          <div className="bg-yellow-400 text-black px-3 py-1 inline-block text-[10px] font-black uppercase mt-2 tracking-widest border-2 border-black">VOCAL DNA SYNTHESIS</div>
        </div>
        <div className="flex bg-white p-1 border-4 border-black shadow-[6px_6px_0px_#000]">
          <button onClick={() => setActiveTab('script')} className={`px-8 py-2 font-comic text-xl uppercase transition-all ${activeTab === 'script' ? 'bg-cyan-400 text-black border-2 border-black' : 'text-zinc-400 hover:text-black'}`}>SCRIPT</button>
          <button onClick={() => setActiveTab('cloning')} className={`px-8 py-2 font-comic text-xl uppercase transition-all ${activeTab === 'cloning' ? 'bg-magenta-500 text-white border-2 border-black' : 'text-zinc-400 hover:text-black'}`}>DNA</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 text-black">
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white border-[6px] border-black p-10 shadow-[12px_12px_0px_0px_#000] min-h-[500px] flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 comic-hatch opacity-5 pointer-events-none"></div>
            
            {activeTab === 'script' ? (
              <>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="ENTER SCRIPT FOR RENDERING..."
                  className="w-full h-80 bg-zinc-50 border-4 border-black p-8 text-2xl font-black uppercase outline-none resize-none placeholder:text-zinc-200"
                />
                <div className="mt-10 flex items-center justify-between">
                  <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{text.length} CHARS</span>
                  <button
                    onClick={() => playAudio(text, selectedVoice)}
                    disabled={loading || !text}
                    className="px-12 py-5 bg-yellow-400 border-4 border-black text-black font-comic text-4xl uppercase shadow-[8px_8px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                  >
                    {loading ? 'RENDERING...' : 'TALK!'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-10">
                <div className="text-center space-y-4">
                  <h3 className="text-5xl font-comic uppercase text-black">VOCAL DNA CLONING</h3>
                  <p className="text-xs font-black text-zinc-400 uppercase tracking-widest max-w-sm mx-auto">
                    UPLOAD A 10-30 SECOND VOICE SAMPLE. GEMINI WILL ANALYZE THE DNA AND MAP IT TO OUR PREBUILT NEURAL VOICES.
                  </p>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-md aspect-video border-4 border-dashed border-zinc-200 bg-zinc-50 hover:border-black flex flex-col items-center justify-center cursor-pointer transition-all relative group"
                >
                  <input type="file" ref={fileInputRef} hidden accept="audio/*" onChange={handleFileChange} />
                  {cloningFile ? (
                    <div className="text-center p-6">
                      <span className="text-6xl mb-4 block">🎧</span>
                      <p className="font-black text-black uppercase truncate">{cloningFile.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); setCloningFile(null); }} className="text-[10px] text-red-500 font-black uppercase mt-2 underline">REMOVE</button>
                    </div>
                  ) : (
                    <div className="text-center opacity-30 group-hover:opacity-100 transition-opacity">
                      <span className="text-7xl block mb-2">🎤</span>
                      <p className="text-[10px] font-black uppercase tracking-widest">DROP VOICE SAMPLE</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleClone}
                  disabled={cloningLoading || !cloningFile}
                  className="px-16 py-6 bg-magenta-500 border-4 border-black text-white font-comic text-4xl uppercase shadow-[10px_10px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                >
                  {cloningLoading ? 'ANALYZING...' : 'WHAM! CLONE VOICE!'}
                </button>
              </div>
            )}
            
            {loading || cloningLoading && (
              <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
                <div className="w-16 h-16 border-4 border-black border-t-cyan-400 rounded-full animate-spin mb-4"></div>
                <p className="text-black text-xs font-black uppercase tracking-widest animate-pulse">Processing Neural Stream...</p>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white border-[6px] border-black p-8 shadow-[8px_8px_0px_0px_#000] relative h-full flex flex-col">
            <h3 className="text-3xl font-comic uppercase mb-6 border-b-4 border-black pb-4">VOICE PALETTE</h3>
            <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              
              {clones.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-magenta-500 uppercase tracking-widest mb-2">CUSTOM CLONES</p>
                  {clones.map((clone) => (
                    <div key={clone.id} onClick={() => setSelectedVoice(clone.baseVoice)} className={`p-4 border-4 transition-all cursor-pointer flex items-center justify-between ${selectedVoice === clone.baseVoice ? 'bg-magenta-500 text-white border-black shadow-[4px_4px_0px_#000]' : 'bg-zinc-50 border-zinc-100 hover:border-black'}`}>
                      <div>
                        <p className="font-black text-sm uppercase">{clone.name}</p>
                        <p className={`text-[8px] font-bold uppercase ${selectedVoice === clone.baseVoice ? 'text-white/60' : 'text-zinc-400'}`}>DNA: {clone.baseVoice}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); playAudio(`Hi, I am your clone of ${clone.name}`, clone.baseVoice, true); }} className="px-3 py-1 bg-black text-white text-[9px] font-black uppercase">DEMO</button>
                        <button onClick={(e) => deleteClone(clone.id, e)} className="px-3 py-1 bg-red-500 text-white text-[9px] font-black uppercase">X</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">NEURAL DEFAULTS</p>
                {voiceOptions.map((voice) => (
                  <div key={voice.value} onClick={() => setSelectedVoice(voice.value)} className={`p-4 border-4 transition-all cursor-pointer flex items-center justify-between ${selectedVoice === voice.value ? 'bg-cyan-400 border-black shadow-[4px_4px_0px_#000]' : 'bg-zinc-50 border-zinc-100 hover:border-black'}`}>
                    <div>
                      <p className="font-black text-sm uppercase">{voice.label}</p>
                      <p className={`text-[10px] font-bold uppercase ${selectedVoice === voice.value ? 'text-black/40' : 'text-zinc-500'}`}>{voice.meta}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); playAudio(`Hi, I am ${voice.label}`, voice.value, true); }} className="px-3 py-1 bg-black text-white text-[9px] font-black uppercase">DEMO</button>
                  </div>
                ))}
              </div>
            </div>
            {error && <p className="text-red-600 text-[10px] font-black uppercase mt-4 text-center border-2 border-red-200 bg-red-50 p-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
