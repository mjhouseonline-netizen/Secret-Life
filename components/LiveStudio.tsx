
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../utils/audio';
import { CustomVoiceProfile } from '../types';

export const LiveStudio: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [clones, setClones] = useState<CustomVoiceProfile[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [personality, setPersonality] = useState('DIRECTOR');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('cinepet_voice_clones');
    if (saved) {
      try {
        setClones(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const getApiKey = () => {
    try {
      if (typeof process !== 'undefined' && process.env?.API_KEY) return process.env.API_KEY;
    } catch (e) {}
    return '';
  };

  const startSession = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError("API KEY MISSING!");
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outAudioContextRef.current = outputCtx;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const instruction = personality === 'DIRECTOR' 
        ? 'You are CINE, the loud and enthusiastic comic book creative director. Talk like a 90s comic book editor! Use words like POW, ZAP, and SPLASH PAGE!'
        : 'You are a helpful and calm creative assistant for the CinePet Studio. Help the user brainstorm ideas for posters and videos.';

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
              setTranscripts(prev => [...prev, `YOU: ${msg.serverContent!.inputTranscription!.text}`].slice(-10));
            }
            if (msg.serverContent?.outputTranscription) {
              setTranscripts(prev => [...prev, `AI: ${msg.serverContent!.outputTranscription!.text}`].slice(-10));
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
          onerror: () => setError("CONNECTION ERROR"),
          onclose: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: instruction
        }
      });
      sessionRef.current = await sessionPromise;
      setIsActive(true);
    } catch (err: any) {
      setError(err.message || "FAILED TO START SESSION");
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    audioContextRef.current?.close();
    outAudioContextRef.current?.close();
    setIsActive(false);
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8 transform -rotate-1">
        <div>
          <h2 className="text-5xl font-comic text-white stroke-black-bold drop-shadow-[4px_4px_0px_#000] uppercase tracking-wider leading-none">LIVE ASSISTANT</h2>
          <div className="bg-magenta-500 text-white px-3 py-1 inline-block text-[10px] font-black uppercase mt-2 tracking-widest border-2 border-black">SYNCED VOCAL DNA</div>
        </div>
        
        <div className="flex bg-white p-1 border-4 border-black shadow-[6px_6px_0px_#000]">
          <button onClick={() => setPersonality('DIRECTOR')} className={`px-4 py-2 font-black text-[10px] uppercase transition-all ${personality === 'DIRECTOR' ? 'bg-yellow-400 border-2 border-black' : 'text-zinc-400'}`}>DIRECTOR</button>
          <button onClick={() => setPersonality('ASSISTANT')} className={`px-4 py-2 font-black text-[10px] uppercase transition-all ${personality === 'ASSISTANT' ? 'bg-cyan-400 border-2 border-black text-black' : 'text-zinc-400'}`}>ASSISTANT</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border-[6px] border-black p-8 shadow-[12px_12px_0px_0px_#000] space-y-8 relative overflow-hidden text-black">
            <div className="absolute inset-0 comic-hatch opacity-5 pointer-events-none"></div>
            
            <div className="space-y-4">
              <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">VOCAL IDENTITY</label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-[8px] font-black text-zinc-300 uppercase mb-1">CLONED DNA</p>
                {clones.map(clone => (
                  <button 
                    key={clone.id} 
                    disabled={isActive}
                    onClick={() => setSelectedVoice(clone.baseVoice)}
                    className={`w-full p-3 border-4 flex items-center justify-between transition-all ${selectedVoice === clone.baseVoice ? 'bg-cyan-400 border-black shadow-[4px_4px_0px_#000]' : 'bg-zinc-50 border-zinc-100 opacity-50'}`}
                  >
                    <span className="text-[10px] font-black uppercase">{clone.name}</span>
                    <span className="text-[8px] font-bold opacity-40">SYNCED</span>
                  </button>
                ))}
                
                <p className="text-[8px] font-black text-zinc-300 uppercase mb-1 mt-4">NEURAL DEFAULTS</p>
                {['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'].map(v => (
                  <button 
                    key={v}
                    disabled={isActive}
                    onClick={() => setSelectedVoice(v)}
                    className={`w-full p-3 border-4 flex items-center justify-between transition-all ${selectedVoice === v ? 'bg-yellow-400 border-black shadow-[4px_4px_0px_#000]' : 'bg-zinc-50 border-zinc-100 opacity-50'}`}
                  >
                    <span className="text-[10px] font-black uppercase">{v}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={isActive ? stopSession : startSession}
              className={`w-full py-6 border-[6px] border-black font-comic text-5xl uppercase shadow-[10px_10px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all ${
                isActive ? 'bg-red-500 text-white animate-pulse' : 'bg-cyan-400 text-black'
              }`}
            >
              {isActive ? 'OFF AIR' : 'GO LIVE!'}
            </button>
            {isActive && <p className="text-center text-[8px] font-black uppercase tracking-[0.3em] text-cyan-600 animate-pulse">TRANSMISSION ACTIVE</p>}
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white border-[6px] border-black p-10 shadow-[16px_16px_0px_0px_#000] min-h-[500px] flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute inset-0 comic-hatch opacity-5 pointer-events-none"></div>
            
            {transcripts.length === 0 && !isActive && (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-10">
                <span className="text-9xl mb-4">💬</span>
                <p className="text-5xl font-comic uppercase tracking-widest">AWAITING NARRATIVE</p>
              </div>
            )}

            <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
              {transcripts.map((t, i) => (
                <div key={i} className={`p-6 border-4 border-black relative max-w-[85%] animate-in slide-in-from-bottom-4 duration-300 ${t.startsWith('YOU:') ? 'bg-zinc-100 self-end shadow-[6px_6px_0px_#000] ml-auto' : 'bg-yellow-100 self-start shadow-[-6px_6px_0px_#000]'}`}>
                  <p className="text-xs font-black uppercase tracking-tight text-black leading-relaxed">{t}</p>
                  <div className={`absolute top-0 ${t.startsWith('YOU:') ? 'right-0 -translate-y-1/2 translate-x-1/2' : 'left-0 -translate-y-1/2 -translate-x-1/2'} w-4 h-4 bg-black rotate-45`}></div>
                </div>
              ))}
            </div>

            {isActive && (
              <div className="h-20 border-t-4 border-black flex items-center justify-center gap-1">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-1.5 bg-cyan-400 border border-black animate-bounce" style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.1}s` }}></div>
                ))}
              </div>
            )}
            
            {error && <p className="text-red-600 text-center font-black uppercase p-4 border-4 border-black bg-red-50 shadow-[6px_6px_0px_#000]">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
