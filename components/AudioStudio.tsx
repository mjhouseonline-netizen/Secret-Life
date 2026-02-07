
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { GeminiService } from '../services/gemini';
import { decode, decodeAudioData, createBlob } from '../utils/audio';
import { CustomVoiceProfile } from '../types';

type StudioMode = 'broadcast' | 'production' | 'dna';

export const AudioStudio: React.FC = () => {
  const [activeMode, setActiveMode] = useState<StudioMode>('broadcast');
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [clones, setClones] = useState<CustomVoiceProfile[]>([]);
  const [cloningFile, setCloningFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Live Session Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
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

  const getApiKey = () => (process.env.API_KEY || '');

  // --- LIVE BROADCAST LOGIC ---
  const startLiveSession = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError("API KEY MISSING! VISIT SETUP.");
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outAudioContextRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob })).catch(() => {});
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              setTranscripts(prev => [...prev, `YOU: ${msg.serverContent!.inputTranscription!.text}`].slice(-8));
            }
            if (msg.serverContent?.outputTranscription) {
              setTranscripts(prev => [...prev, `AI: ${msg.serverContent!.outputTranscription!.text}`].slice(-8));
            }
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: () => setError("CONNECTION LOST"),
          onclose: () => setIsLive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: 'You are CINE, the loud and enthusiastic comic book creative director. Assist the user with their production in a high-energy way!'
        }
      });
      sessionRef.current = await sessionPromise;
      setIsLive(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || "FAILED TO GO LIVE");
    }
  };

  const stopLiveSession = () => {
    sessionRef.current?.close();
    audioContextRef.current?.close();
    outAudioContextRef.current?.close();
    setIsLive(false);
  };

  // --- PRODUCTION SCRIPT LOGIC ---
  const renderScript = async () => {
    if (!text) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = await GeminiService.generateSpeech(text, selectedVoice);
      if (!base64) throw new Error("Synthesis failed");
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- DNA CLONING LOGIC ---
  const handleClone = async () => {
    if (!cloningFile) return;
    setLoading(true);
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
      saveClones([newClone, ...clones]);
      setCloningFile(null);
      setSelectedVoice(newClone.baseVoice);
      setActiveMode('production');
    } catch (err: any) {
      setError(err.message || "DNA ANALYSIS FAILED");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8 transform -rotate-1">
        <div>
          <h2 className="text-5xl md:text-7xl font-comic text-white stroke-black-bold drop-shadow-[6px_6px_0px_#000] uppercase tracking-wider">VOCAL ENGINE</h2>
          <div className="bg-yellow-400 text-black px-4 py-1.5 inline-block text-[12px] font-black uppercase mt-4 tracking-[0.2em] border-4 border-black shadow-[6px_6px_0px_#000]">
            SOUNDSTAGE CONSOLE
          </div>
        </div>

        <div className="flex bg-white p-1.5 border-4 border-black shadow-[8px_8px_0px_#000]">
          {(['broadcast', 'production', 'dna'] as StudioMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => { if (!isLive) setActiveMode(mode); }}
              className={`px-6 py-2 font-comic text-xl uppercase transition-all ${
                activeMode === mode 
                  ? 'bg-black text-white border-2 border-black' 
                  : 'text-zinc-400 hover:text-black'
              } ${isLive ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Workspace Center */}
        <div className="lg:col-span-8">
          <div className="bg-white border-[6px] border-black p-10 shadow-[16px_16px_0px_0px_#000] min-h-[600px] flex flex-col relative overflow-hidden text-black">
            <div className="absolute inset-0 comic-hatch opacity-5 pointer-events-none"></div>
            
            {activeMode === 'broadcast' && (
              <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95">
                <div className="flex-1 space-y-4 overflow-y-auto pr-4 custom-scrollbar mb-8">
                  {transcripts.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                      <span className="text-9xl mb-4">🎤</span>
                      <p className="text-4xl font-comic uppercase">Awaiting Transmission</p>
                    </div>
                  )}
                  {transcripts.map((t, i) => (
                    <div key={i} className={`p-5 border-4 border-black relative max-w-[85%] ${t.startsWith('YOU:') ? 'bg-zinc-100 ml-auto shadow-[6px_6px_0px_#000]' : 'bg-cyan-100 shadow-[-6px_6px_0px_#000]'}`}>
                      <p className="text-xs font-black uppercase leading-tight">{t}</p>
                    </div>
                  ))}
                </div>
                
                {isLive && (
                  <div className="h-16 flex items-center justify-center gap-1.5 mb-8">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-1.5 bg-cyan-400 border border-black animate-bounce" style={{ height: `${Math.random() * 90 + 10}%`, animationDelay: `${i * 0.05}s` }}></div>
                    ))}
                  </div>
                )}

                <button
                  onClick={isLive ? stopLiveSession : startLiveSession}
                  className={`w-full py-6 border-[6px] border-black font-comic text-6xl uppercase shadow-[10px_10px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all ${
                    isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-cyan-400 text-black'
                  }`}
                >
                  {isLive ? 'OFF AIR' : 'GO LIVE!'}
                </button>
              </div>
            )}

            {activeMode === 'production' && (
              <div className="flex-1 flex flex-col animate-in slide-in-from-right-4">
                <div className="border-b-4 border-black pb-4 mb-6">
                  <h3 className="text-4xl font-comic uppercase text-magenta-500">VOICEOVER RENDER</h3>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="ENTER PRODUCTION SCRIPT FOR SYNTHESIS..."
                  className="flex-1 bg-zinc-50 border-4 border-black p-8 text-2xl font-black uppercase outline-none resize-none placeholder:text-zinc-200"
                />
                <button
                  onClick={renderScript}
                  disabled={loading || !text}
                  className="w-full mt-8 py-6 bg-magenta-500 border-[6px] border-black text-white font-comic text-5xl uppercase shadow-[12px_12px_0px_0px_#000] active:scale-95 transition-all disabled:opacity-30"
                >
                  {loading ? 'RENDERING...' : 'TALK!'}
                </button>
              </div>
            )}

            {activeMode === 'dna' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 animate-in slide-in-from-left-4">
                <div className="space-y-4">
                  <h3 className="text-6xl font-comic uppercase text-yellow-400 stroke-black-thin">VOCAL CLONING</h3>
                  <p className="text-xs font-black text-zinc-400 uppercase tracking-widest max-w-sm mx-auto">
                    UPLOAD A 10-30 SECOND VOICE SAMPLE TO MAP THE NEURAL DNA.
                  </p>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-md aspect-video border-[6px] border-dashed border-zinc-200 bg-zinc-50 hover:border-black flex flex-col items-center justify-center cursor-pointer transition-all relative group"
                >
                  <input type="file" ref={fileInputRef} hidden accept="audio/*" onChange={handleFileSelect} />
                  {cloningFile ? (
                    <div className="p-8">
                      <span className="text-8xl block mb-4">🎧</span>
                      <p className="font-black text-black uppercase truncate text-xl">{cloningFile.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); setCloningFile(null); }} className="text-red-500 font-black uppercase mt-4 underline text-xs">PURGE SAMPLE</button>
                    </div>
                  ) : (
                    <div className="opacity-20 group-hover:opacity-100 transition-opacity">
                      <span className="text-9xl block">🎤</span>
                      <p className="text-xs font-black uppercase tracking-widest mt-4">DROP DNA SAMPLE</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleClone}
                  disabled={loading || !cloningFile}
                  className="px-20 py-8 bg-yellow-400 border-[6px] border-black text-black font-comic text-5xl uppercase shadow-[12px_12px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-30"
                >
                  {loading ? 'ANALYZING...' : 'CLONE DNA!'}
                </button>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 bg-white/80 z-40 flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 border-[8px] border-black border-t-yellow-400 rounded-full animate-spin mb-6"></div>
                <h3 className="text-4xl font-comic uppercase animate-pulse">Inking Voice Patterns...</h3>
              </div>
            )}
          </div>
        </div>

        {/* Vocal Vault Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border-[6px] border-black p-8 shadow-[12px_12px_0px_0px_#000] flex flex-col h-full text-black">
            <h3 className="text-3xl font-comic uppercase mb-6 border-b-4 border-black pb-4">VOCAL VAULT</h3>
            
            <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              
              {clones.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-magenta-500 uppercase tracking-widest mb-2">CUSTOM DNA CLONES</p>
                  {clones.map(clone => (
                    <div 
                      key={clone.id} 
                      onClick={() => setSelectedVoice(clone.baseVoice)}
                      className={`p-4 border-4 transition-all cursor-pointer flex items-center justify-between group ${
                        selectedVoice === clone.baseVoice 
                          ? 'bg-magenta-500 text-white border-black shadow-[4px_4px_0px_#000]' 
                          : 'bg-zinc-50 border-zinc-100 hover:border-black'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-black text-sm uppercase truncate">{clone.name}</p>
                        <p className={`text-[9px] font-bold uppercase ${selectedVoice === clone.baseVoice ? 'text-white/60' : 'text-zinc-400'}`}>BASE: {clone.baseVoice}</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = clones.filter(c => c.id !== clone.id);
                          saveClones(updated);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all text-xs font-black"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4 pb-8">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">NEURAL PREBUILTS</p>
                {['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'].map(v => (
                  <div 
                    key={v} 
                    onClick={() => setSelectedVoice(v)}
                    className={`p-4 border-4 transition-all cursor-pointer flex items-center justify-between ${
                      selectedVoice === v 
                        ? 'bg-cyan-400 border-black shadow-[4px_4px_0px_#000]' 
                        : 'bg-zinc-50 border-zinc-100 hover:border-black'
                    }`}
                  >
                    <p className="font-black text-sm uppercase">{v}</p>
                    <div className={`w-3 h-3 border-2 border-black ${selectedVoice === v ? 'bg-white' : 'bg-transparent'}`}></div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border-4 border-red-200 text-red-600">
                <p className="text-[10px] font-black uppercase text-center">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
