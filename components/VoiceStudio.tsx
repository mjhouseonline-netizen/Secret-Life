
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/gemini';
import { decode, decodeAudioData } from '../utils/audio';
import { CustomVoiceProfile } from '../types';

interface VoiceProfile {
  value: string;
  label: string;
  age: 'Youth' | 'Adult' | 'Senior';
  gender: 'Male' | 'Female';
  style: string;
  meta: string;
}

export const VoiceStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'script' | 'cloning'>('script');
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Cloning State
  const [clones, setClones] = useState<CustomVoiceProfile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sampleData, setSampleData] = useState<string | null>(null);
  const [sampleMime, setSampleMime] = useState<string>('');
  const [cleanSample, setCleanSample] = useState(true);
  const [cloneName, setCloneName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cinepet_voice_clones');
    if (saved) setClones(JSON.parse(saved));
  }, []);

  const voiceOptions: VoiceProfile[] = [
    { value: 'Kore', label: 'Kore', age: 'Adult', gender: 'Male', style: 'Neutral', meta: 'Balanced Mid-Atlantic' },
    { value: 'Puck', label: 'Puck', age: 'Youth', gender: 'Male', style: 'Energetic', meta: 'British Tonal Style' },
    { value: 'Charon', label: 'Charon', age: 'Senior', gender: 'Male', style: 'Authoritative', meta: 'Deep & Wise' },
    { value: 'Fenrir', label: 'Fenrir', age: 'Adult', gender: 'Male', style: 'Gritty', meta: 'Rugged & Raw' },
    { value: 'Orpheus', label: 'Orpheus', age: 'Adult', gender: 'Male', style: 'Smooth', meta: 'Poetic & Calm' },
    { value: 'Zephyr', label: 'Zephyr', age: 'Adult', gender: 'Female', style: 'Professional', meta: 'Bright & Clear' },
    { value: 'Aoide', label: 'Aoide', age: 'Adult', gender: 'Female', style: 'Warm', meta: 'Rhythmic Storyteller' },
    { value: 'Eos', label: 'Eos', age: 'Youth', gender: 'Female', style: 'Soft', meta: 'Gentle & Calm' },
    { value: 'Lyra', label: 'Lyra', age: 'Adult', gender: 'Female', style: 'Balanced', meta: 'Modern & Direct' },
    { value: 'Atlas', label: 'Atlas', age: 'Adult', gender: 'Male', style: 'Powerful', meta: 'Strong & Commanding' },
  ];

  const playAudio = async (audioText: string, voiceName: string, isPreview: boolean = false) => {
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
      
      if (isPreview) {
        source.onended = () => setPreviewing(null);
      }
    } catch (err: any) {
      setError(err.message);
      setPreviewing(null);
    } finally {
      if (!isPreview) setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSampleData(reader.result as string);
        setSampleMime(file.type);
        setCloneName(file.name.split('.')[0]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCloneVoice = async () => {
    if (!sampleData || !cloneName) return;
    setUploading(true);
    setError(null);
    try {
      const analysis = await GeminiService.analyzeVoice(sampleData, sampleMime, cleanSample);
      const newClone: CustomVoiceProfile = {
        id: Math.random().toString(36).substr(2, 9),
        name: cloneName,
        sampleUrl: sampleData,
        analysis: analysis.description,
        baseVoice: analysis.closestPrebuiltVoice || 'Kore',
        quality: 100,
        isCleaned: cleanSample
      };
      const updatedClones = [...clones, newClone];
      setClones(updatedClones);
      localStorage.setItem('cinepet_voice_clones', JSON.stringify(updatedClones));
      setSampleData(null);
      setActiveTab('script');
      setSelectedVoice(newClone.baseVoice);
      setText(`Perfectly cloned. I am now speaking as ${newClone.name}.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = (voice: VoiceProfile) => {
    const previewText = `Hello, I am ${voice.label}. This is a sample of my ${voice.style.toLowerCase()} voice.`;
    playAudio(previewText, voice.value, true);
  };

  const handleFullSpeak = () => {
    if (!text) return;
    playAudio(text, selectedVoice, false);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold mb-2 tracking-tight text-white font-cinematic uppercase tracking-widest">Voice Studio</h2>
          <p className="text-zinc-400 uppercase text-[10px] font-bold">High-fidelity vocal synthesis and custom voice DNA cloning.</p>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800 shadow-xl">
          <button 
            onClick={() => setActiveTab('script')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase ${activeTab === 'script' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >SCRIPT MODE</button>
          <button 
            onClick={() => setActiveTab('cloning')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase ${activeTab === 'cloning' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >VOICE DNA</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-8 space-y-6">
          {activeTab === 'script' ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all">
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Production Script</h3>
                  <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold">Rendering with {selectedVoice} dynamics</p>
                </div>
                <div className="flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Engine Ready</span>
                </div>
              </div>
              <div className="p-8">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter script... Use hints like 'Speak excitedly:' for better emotion control."
                  className="w-full h-64 bg-transparent border-none p-0 text-2xl text-zinc-100 placeholder:text-zinc-800 focus:ring-0 resize-none leading-relaxed font-cinematic uppercase"
                />
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="px-4 py-1.5 bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-500 uppercase border border-zinc-700">
                      CHARS: {text.length}
                    </div>
                    <button 
                      onClick={() => setText('')}
                      className="text-[10px] font-bold text-zinc-600 hover:text-red-400 uppercase tracking-widest transition-colors"
                    >Reset Stage</button>
                  </div>
                  <button
                    onClick={handleFullSpeak}
                    disabled={loading || !text}
                    className="px-12 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-2xl flex items-center gap-4 active:scale-95"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="uppercase tracking-widest">Render Dialogue</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-12 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-gradient-x"></div>
                
                {!sampleData ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="py-20 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/20 transition-all rounded-[2rem] border-2 border-dashed border-zinc-800 hover:border-purple-500 group"
                  >
                    <input type="file" ref={fileInputRef} hidden accept="audio/*" onChange={handleFileUpload} />
                    <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest font-cinematic">Ingest Voice DNA</h3>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold max-w-xs mx-auto">Upload a 5-15 second audio clip of a human or character voice to synthesize a custom profile.</p>
                  </div>
                ) : (
                  <div className="space-y-10 py-10 animate-in zoom-in-95 duration-500">
                    <div className="flex flex-col items-center">
                       <h3 className="text-3xl font-cinematic text-white tracking-widest mb-2 uppercase">Sample Captured</h3>
                       <p className="text-purple-400 text-xs font-bold uppercase tracking-[0.2em]">{cloneName}</p>
                    </div>

                    <div className="max-w-md mx-auto space-y-6 text-left">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Profile Name</label>
                          <input 
                            type="text" 
                            value={cloneName}
                            onChange={(e) => setCloneName(e.target.value)}
                            className="w-full bg-zinc-800 border-none rounded-xl p-4 text-white focus:ring-1 focus:ring-purple-500 uppercase font-bold"
                          />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                             <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-zinc-600 uppercase">AI Cleanup</span>
                                <input 
                                  type="checkbox" 
                                  checked={cleanSample}
                                  onChange={(e) => setCleanSample(e.target.checked)}
                                  className="w-4 h-4 accent-purple-600"
                                />
                             </div>
                             <p className="text-[9px] text-zinc-500 uppercase font-bold">Remove background noise and digital artifacts.</p>
                          </div>
                          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                             <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-zinc-600 uppercase">Fidelity</span>
                                <span className="text-[10px] text-purple-400 font-bold">100%</span>
                             </div>
                             <div className="h-1 bg-zinc-800 rounded-full">
                                <div className="h-full bg-purple-600 w-full rounded-full"></div>
                             </div>
                          </div>
                       </div>

                       <div className="flex gap-4">
                          <button 
                            onClick={() => setSampleData(null)}
                            className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-700"
                          >Discard</button>
                          <button 
                            onClick={handleCloneVoice}
                            disabled={uploading}
                            className="flex-[2] py-4 bg-purple-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2"
                          >
                             {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Start Cloning'}
                          </button>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {clones.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {clones.map(clone => (
                     <div key={clone.id} className="p-6 bg-zinc-900 border border-zinc-800 rounded-[2rem] flex items-center justify-between group hover:border-purple-500 transition-all">
                        <div className="flex gap-4 items-center">
                           <div>
                              <p className="font-bold text-white uppercase tracking-tight">{clone.name}</p>
                              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter line-clamp-1">{clone.analysis}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedVoice(clone.baseVoice);
                            setActiveTab('script');
                            setText(`Director, ${clone.name} is online and ready for the first take.`);
                          }}
                          className="px-4 py-2 bg-zinc-800 hover:bg-purple-600 text-zinc-400 hover:text-white text-[10px] font-black uppercase rounded-xl transition-all"
                        >Select</button>
                     </div>
                   ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl text-center font-black uppercase tracking-widest">
              ALERT: {error}
            </div>
          )}
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="p-1 border-b border-zinc-800 pb-4">
             <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Voice Palette</h3>
             <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold">Select a cinematic profile for your production</p>
          </div>
          
          <div className="grid grid-cols-1 gap-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {voiceOptions.map((voice) => (
              <div 
                key={voice.value}
                onClick={() => setSelectedVoice(voice.value)}
                className={`p-5 rounded-[2rem] border-2 transition-all cursor-pointer group flex items-center justify-between ${
                  selectedVoice === voice.value 
                    ? 'bg-indigo-600/10 border-indigo-500 shadow-xl' 
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex gap-4 items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm uppercase ${selectedVoice === voice.value ? 'text-indigo-400' : 'text-zinc-200'}`}>
                        {voice.label}
                      </p>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest ${selectedVoice === voice.value ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                        {voice.age}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-tight italic uppercase font-bold">{voice.meta}</p>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(voice);
                  }}
                  disabled={previewing === voice.value}
                  className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${
                    previewing === voice.value 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white'
                  }`}
                  title="Preview Voice"
                >
                  {previewing === voice.value ? 'PLAYING' : 'LISTEN'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
};
