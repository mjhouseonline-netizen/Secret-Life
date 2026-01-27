
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../utils/audio';

export const LiveStudio: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              setTranscripts(prev => [...prev, `You: ${msg.serverContent!.inputTranscription!.text}`]);
            }
            if (msg.serverContent?.outputTranscription) {
              setTranscripts(prev => [...prev, `AI: ${msg.serverContent!.outputTranscription!.text}`]);
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
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => setError("Connection error"),
          onclose: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: 'You are a friendly creative assistant for "The Secret Life Of Your Pet" studio.'
        }
      });

      sessionRef.current = await sessionPromise;
      setIsActive(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    audioContextRef.current?.close();
    outAudioContextRef.current?.close();
    setIsActive(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4 uppercase tracking-widest font-cinematic">Live Voice Assistant</h2>
        <p className="text-zinc-400 uppercase text-[10px] font-bold">Low-latency real-time conversation powered by Gemini Native Audio.</p>
      </div>

      <div className="flex flex-col items-center gap-8">
        <button
          onClick={isActive ? stopSession : startSession}
          className={`w-32 h-32 rounded-full flex items-center justify-center text-xs font-black uppercase shadow-2xl transition-all ${
            isActive ? 'bg-red-500 animate-pulse text-white' : 'bg-indigo-600 hover:scale-105 text-white'
          }`}
        >
          {isActive ? 'STOP' : 'START'}
        </button>
        
        <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">
          {isActive ? 'Session Active - Speak Now' : 'Tap to start live conversation'}
        </p>

        <div className="w-full bg-zinc-900 rounded-3xl border border-zinc-800 p-8 h-96 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          {transcripts.length === 0 && !isActive && (
            <div className="flex-1 flex items-center justify-center opacity-20">
              <p className="text-[10px] font-black uppercase tracking-widest">Conversation history will appear here</p>
            </div>
          )}
          {transcripts.map((t, i) => (
            <div key={i} className={`p-4 rounded-2xl max-w-[80%] ${t.startsWith('You:') ? 'bg-zinc-800 self-end' : 'bg-indigo-500/10 border border-indigo-500/20 self-start'}`}>
              <p className="text-xs font-bold uppercase tracking-tight">{t}</p>
            </div>
          ))}
          {error && <p className="text-red-400 text-center uppercase text-[10px] font-black">{error}</p>}
        </div>
      </div>
    </div>
  );
};
