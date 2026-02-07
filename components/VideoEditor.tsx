
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/gemini';
import { GeneratedContent, AspectRatio, Resolution, StitchTransition, TrackItem } from '../types';

interface VideoEditorProps {
  onGenerated: (content: GeneratedContent) => void;
  availableVideos: GeneratedContent[];
  availableImages: GeneratedContent[];
}

const FILTERS = [
  { id: 'none', label: 'NORMAL' },
  { id: 'grayscale(1)', label: 'NOIR' },
  { id: 'sepia(0.8)', label: 'RETRO' },
  { id: 'saturate(2)', label: 'VIBRANT' },
  { id: 'contrast(1.5) hue-rotate(180deg)', label: 'SURREAL' }
];

export const VideoEditor: React.FC<VideoEditorProps> = ({ onGenerated, availableVideos, availableImages }) => {
  const [sequence, setSequence] = useState<TrackItem[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [transition, setTransition] = useState<StitchTransition>(StitchTransition.FADE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const activeTrack = sequence.find(t => t.id === activeTrackId);

  const addToSequence = (content: GeneratedContent) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newItem: TrackItem = {
      id,
      content,
      startTime: 0,
      endTime: 5, // Default 5s or actual duration if we could pre-fetch it
      duration: 5,
      playbackSpeed: 1,
      volume: 1,
      filter: 'none'
    };
    setSequence(prev => [...prev, newItem]);
    setActiveTrackId(id);
  };

  const removeFromSequence = (id: string) => {
    setSequence(prev => prev.filter(item => item.id !== id));
    if (activeTrackId === id) setActiveTrackId(null);
  };

  const updateTrack = (id: string, updates: Partial<TrackItem>) => {
    setSequence(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const moveTrack = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sequence.length) return;
    const newSequence = [...sequence];
    const [removed] = newSequence.splice(idx, 1);
    newSequence.splice(newIdx, 0, removed);
    setSequence(newSequence);
  };

  const captureFrame = (videoEl: HTMLVideoElement, atEnd: boolean = false): string => {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const originalTime = videoEl.currentTime;
      videoEl.currentTime = atEnd ? videoEl.duration - 0.1 : 0.1;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      videoEl.currentTime = originalTime; // Restore
      return canvas.toDataURL('image/png');
    }
    return '';
  };

  const handleProduce = async () => {
    if (sequence.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      // In a real multi-clip AI editor, we'd bridge transitions or extend.
      // Here we simulate producing a "Master Sequence" prompt to Gemini.
      const startItem = sequence[0];
      const endItem = sequence[sequence.length - 1];
      
      const startVideoEl = videoRefs.current[startItem.id];
      const endVideoEl = videoRefs.current[endItem.id];

      if (!startVideoEl || (sequence.length > 1 && !endVideoEl)) {
        throw new Error("Playback engine warming up. Try again in a second.");
      }

      const startFrame = captureFrame(startVideoEl, true);
      const endFrame = sequence.length > 1 ? captureFrame(endVideoEl, false) : startFrame;

      const { url, videoMeta } = await GeminiService.stitchBridge(
        startFrame,
        endFrame,
        prompt || `A seamless cinematic sequence featuring ${sequence.map(s => s.content.prompt).join(' followed by ')}`,
        AspectRatio.LANDSCAPE,
        []
      );

      onGenerated({
        id: Math.random().toString(36).substr(2, 9),
        type: 'video',
        url,
        prompt: `Production: ${prompt || 'Multi-track Sequence'}`,
        timestamp: Date.now(),
        metadata: { videoMeta, sequence }
      });
      
      setSequence([]);
      setActiveTrackId(null);
    } catch (err: any) {
      setError(err.message || "Synthesis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20 text-white">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8 transform -rotate-1">
        <div>
          <h2 className="text-5xl md:text-6xl font-comic text-white stroke-black-bold drop-shadow-[4px_4px_0px_#000] uppercase tracking-wider leading-none">VFX MASTER</h2>
          <div className="bg-magenta-500 text-white px-3 py-1 inline-block text-[10px] font-black uppercase mt-2 tracking-widest border-2 border-black">NON-LINEAR AI EDITOR</div>
        </div>
        <div className="flex gap-4">
           <div className="bg-white p-2 border-4 border-black flex gap-2 shadow-[4px_4px_0px_#000]">
              <span className="text-black font-black text-xl px-2">TIMELINE</span>
              <span className="bg-black text-white px-3 py-1 font-comic text-lg">{sequence.length} CLIPS</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border-[6px] border-black p-8 shadow-[12px_12px_0px_0px_#000] space-y-8 relative overflow-hidden text-black">
            <div className="absolute inset-0 comic-hatch opacity-5 pointer-events-none"></div>
            
            {activeTrack ? (
              <div className="space-y-6 animate-in slide-in-from-left-4">
                <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-2">
                  <h3 className="font-comic text-2xl uppercase text-magenta-500">CLIP SETTINGS</h3>
                  <button onClick={() => setActiveTrackId(null)} className="text-[10px] font-black text-zinc-400 hover:text-black">DESELECT</button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex justify-between text-[11px] font-black text-zinc-400 uppercase">
                      <span>TRIM START</span>
                      <span className="text-black">{activeTrack.startTime.toFixed(1)}s</span>
                    </label>
                    <input type="range" min="0" max={activeTrack.endTime - 0.5} step="0.1" value={activeTrack.startTime} onChange={(e) => updateTrack(activeTrack.id, { startTime: parseFloat(e.target.value) })} className="w-full accent-magenta-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex justify-between text-[11px] font-black text-zinc-400 uppercase">
                      <span>TRIM END</span>
                      <span className="text-black">{activeTrack.endTime.toFixed(1)}s</span>
                    </label>
                    <input type="range" min={activeTrack.startTime + 0.5} max="10" step="0.1" value={activeTrack.endTime} onChange={(e) => updateTrack(activeTrack.id, { endTime: parseFloat(e.target.value) })} className="w-full accent-magenta-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase">SPEED</label>
                    <select value={activeTrack.playbackSpeed} onChange={(e) => updateTrack(activeTrack.id, { playbackSpeed: parseFloat(e.target.value) })} className="w-full bg-zinc-50 border-4 border-black p-2 font-black text-xs">
                      {[0.5, 1, 1.5, 2].map(s => <option key={s} value={s}>{s}x</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase">VOLUME</label>
                    <input type="range" min="0" max="1" step="0.1" value={activeTrack.volume} onChange={(e) => updateTrack(activeTrack.id, { volume: parseFloat(e.target.value) })} className="w-full mt-2 accent-cyan-400" />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-zinc-400 uppercase">FX FILTER</label>
                   <div className="grid grid-cols-3 gap-2">
                      {FILTERS.map(f => (
                        <button key={f.id} onClick={() => updateTrack(activeTrack.id, { filter: f.id })} className={`p-2 border-2 font-black text-[8px] uppercase ${activeTrack.filter === f.id ? 'bg-cyan-400 border-black' : 'bg-zinc-100 border-zinc-100 opacity-60'}`}>
                          {f.label}
                        </button>
                      ))}
                   </div>
                </div>

                <button onClick={() => removeFromSequence(activeTrack.id)} className="w-full py-2 bg-red-50 text-red-600 border-2 border-red-600 font-black text-[10px] uppercase tracking-widest">REMOVE FROM TRACK</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">CLIP REPOSITORY</label>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {availableVideos.map(vid => (
                      <button key={vid.id} onClick={() => addToSequence(vid)} className="aspect-video border-4 border-black overflow-hidden relative group hover:scale-95 transition-all">
                        <video src={vid.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                          <span className="text-white text-xl">➕</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">MASTER SCRIPT</label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="DESCRIBE THE OVERALL NARRATIVE ARC..."
                    className="w-full h-24 bg-zinc-50 border-4 border-black p-4 text-xs font-black uppercase outline-none resize-none"
                  />
                </div>

                <button 
                  onClick={handleProduce}
                  disabled={loading || sequence.length === 0}
                  className="w-full py-6 bg-cyan-400 border-[6px] border-black text-black font-comic text-4xl uppercase shadow-[10px_10px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-30"
                >
                  {loading ? 'DEVELOPING...' : 'PRODUCE!'}
                </button>
              </div>
            )}
            
            {error && <p className="text-red-500 text-[10px] font-black text-center uppercase border-2 border-red-100 p-2">{error}</p>}
          </div>
        </div>

        {/* Main Timeline View */}
        <div className="lg:col-span-8 space-y-6">
           <div className="bg-zinc-900 border-[6px] border-black p-8 shadow-[16px_16px_0px_0px_#000] min-h-[600px] flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 comic-hatch opacity-5 pointer-events-none"></div>
            
            <div className="flex-1 flex flex-col items-center justify-center gap-8 py-10">
              {sequence.length === 0 ? (
                <div className="text-center opacity-10 flex flex-col items-center">
                  <span className="text-9xl mb-6">🎞️</span>
                  <p className="text-5xl font-comic uppercase">STORYBOARD EMPTY</p>
                  <p className="text-xs font-black mt-4">DRAG MASTERS FROM REPOSITORY TO START</p>
                </div>
              ) : (
                <div className="w-full space-y-10">
                  {/* Master Preview Player */}
                  <div className="max-w-xl mx-auto aspect-video bg-black border-4 border-black shadow-[10px_10px_0px_0px_#000] relative overflow-hidden group">
                     {activeTrack ? (
                        <video 
                          key={activeTrack.id}
                          ref={el => { if (el) videoRefs.current[activeTrack.id] = el; }}
                          src={activeTrack.content.url} 
                          className="w-full h-full object-contain"
                          style={{ filter: activeTrack.filter }}
                          controls
                        />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                           <p className="text-xs font-black text-zinc-500 uppercase tracking-widest animate-pulse">Select a track to preview</p>
                        </div>
                     )}
                  </div>

                  {/* Horizontal Timeline */}
                  <div className="bg-black/40 border-4 border-black p-4 min-h-[160px] overflow-x-auto flex gap-4 custom-scrollbar-h">
                    {sequence.map((item, idx) => (
                      <div 
                        key={item.id} 
                        onClick={() => setActiveTrackId(item.id)}
                        className={`flex-shrink-0 w-64 h-28 border-4 transition-all relative cursor-pointer group ${activeTrackId === item.id ? 'border-cyan-400 bg-cyan-400/10 scale-[1.02]' : 'border-zinc-700 bg-zinc-800'}`}
                      >
                         <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 overflow-hidden">
                            <div className="h-full bg-cyan-400" style={{ width: `${(item.endTime - item.startTime) * 10}%` }}></div>
                         </div>
                         <div className="p-3 flex gap-3 h-full">
                            <div className="w-20 bg-black border-2 border-black overflow-hidden relative">
                               <img src={item.content.url} className="w-full h-full object-cover" style={{ filter: item.filter }} />
                               <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[7px] text-white p-0.5 truncate text-center uppercase font-black">
                                 {item.playbackSpeed}x
                               </div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                               <p className="text-[10px] font-black uppercase text-zinc-100 truncate">{item.content.prompt}</p>
                               <div className="flex justify-between items-center text-[8px] font-bold text-zinc-500">
                                  <span>{item.startTime.toFixed(1)}s</span>
                                  <span>→</span>
                                  <span>{item.endTime.toFixed(1)}s</span>
                               </div>
                               <div className="flex gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); moveTrack(idx, 'up'); }} className="text-[10px] hover:text-cyan-400">◀</button>
                                  <button onClick={(e) => { e.stopPropagation(); moveTrack(idx, 'down'); }} className="text-[10px] hover:text-cyan-400">▶</button>
                               </div>
                            </div>
                         </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => {}} // Placeholder for "Add Spacer" or similar
                      className="flex-shrink-0 w-32 h-28 border-4 border-dashed border-zinc-800 flex items-center justify-center opacity-20 hover:opacity-100 transition-opacity"
                    >
                       <span className="text-3xl">➕</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {loading && (
              <div className="absolute inset-0 bg-magenta-500 z-[100] flex flex-col items-center justify-center p-12 text-center halftone animate-in fade-in">
                 <h3 className="text-9xl font-comic text-white stroke-black-bold drop-shadow-[10px_10px_0px_#000] uppercase animate-bounce">RENDERING!</h3>
                 <p className="font-black text-white text-xs tracking-widest uppercase mt-6 drop-shadow-[2px_2px_0px_#000]">Synthesizing non-linear cinematic continuity...</p>
                 <div className="mt-8 w-80 h-3 bg-black/30 rounded-full overflow-hidden border-2 border-black">
                    <div className="h-full bg-white animate-[progress_12s_ease-in-out_infinite]"></div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .custom-scrollbar-h::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar-h::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb { background: #333; border: 2px solid #000; }
      `}</style>
    </div>
  );
};
