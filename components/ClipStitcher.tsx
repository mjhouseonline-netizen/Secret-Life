
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/gemini';
import { GeneratedContent, AspectRatio, Resolution, StitchTransition } from '../types';

interface ClipStitcherProps {
  onGenerated: (content: GeneratedContent) => void;
  availableVideos: GeneratedContent[];
  availableImages: GeneratedContent[];
}

interface StitchSequenceItem {
  id: string;
  url: string;
  type: 'library' | 'upload';
  title: string;
}

export const ClipStitcher: React.FC<ClipStitcherProps> = ({ onGenerated, availableVideos, availableImages }) => {
  const [sequence, setSequence] = useState<StitchSequenceItem[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [transition, setTransition] = useState<StitchTransition>(StitchTransition.CUT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRefs = useRef<Record<string, HTMLVideoElement>>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newItem: StitchSequenceItem = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        type: 'upload',
        title: file.name
      };
      setSequence(prev => [...prev, newItem]);
    }
  };

  const addToSequence = (video: GeneratedContent) => {
    const newItem: StitchSequenceItem = {
      id: video.id,
      url: video.url,
      type: 'library',
      title: video.prompt.split(':').pop() || 'Library Clip'
    };
    setSequence(prev => [...prev, newItem]);
  };

  const removeFromSequence = (id: string) => {
    setSequence(prev => prev.filter(item => item.id !== id));
  };

  const toggleImageSelection = (id: string) => {
    setSelectedImageIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const captureFrame = (videoEl: HTMLVideoElement): string => {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    }
    return '';
  };

  const handleStitch = async () => {
    if (sequence.length < 1 || !prompt.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const referenceImages = selectedImageIds.map(id => availableImages.find(img => img.id === id)?.url).filter(Boolean) as string[];

      if (sequence.length === 1) {
        // Simple extension if only one clip is chosen
        const item = sequence[0];
        const videoMeta = availableVideos.find(v => v.id === item.id)?.metadata?.videoMeta;
        
        const { url, videoMeta: newMeta } = await GeminiService.extendVideo(
          videoMeta,
          prompt,
          Resolution.HD,
          AspectRatio.LANDSCAPE,
          referenceImages,
          transition
        );

        onGenerated({
          id: Math.random().toString(36).substr(2, 9),
          type: 'video',
          url,
          prompt: `Stitched extension of ${item.title}`,
          timestamp: Date.now(),
          metadata: { videoMeta: newMeta, referenceImages }
        });
      } else {
        // Bridging between multiple clips (e.g. sequence[0] and sequence[1])
        const startItem = sequence[0];
        const endItem = sequence[1];
        
        const startVideoEl = videoPreviewRefs.current[startItem.id];
        const endVideoEl = videoPreviewRefs.current[endItem.id];

        if (!startVideoEl || !endVideoEl) throw new Error("Video elements not ready for frame capture");

        // Set start video to end and end video to start for capture
        startVideoEl.currentTime = startVideoEl.duration - 0.1;
        endVideoEl.currentTime = 0.1;

        // Small delay to let video seek
        await new Promise(r => setTimeout(r, 500));

        const startFrame = captureFrame(startVideoEl);
        const endFrame = captureFrame(endVideoEl);

        const { url, videoMeta } = await GeminiService.stitchBridge(
          startFrame,
          endFrame,
          prompt,
          AspectRatio.LANDSCAPE,
          referenceImages
        );

        onGenerated({
          id: Math.random().toString(36).substr(2, 9),
          type: 'video',
          url,
          prompt: `Seamless bridge between ${startItem.title} and ${endItem.title}`,
          timestamp: Date.now(),
          metadata: { videoMeta, referenceImages }
        });
      }

      setPrompt('');
      setSequence([]);
    } catch (err: any) {
      setError(err.message || 'Seamless blending failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold mb-2 tracking-tight text-white font-cinematic uppercase">Clip Stitcher</h2>
          <p className="text-zinc-400">Combine multiple clips into a longer cinematic sequence with AI-powered seamless blending.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 border border-zinc-700"
          >
            <span>📤 Upload Clip</span>
            <input type="file" ref={fileInputRef} hidden accept="video/*" onChange={handleFileUpload} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl space-y-8">
            {/* Library Selector */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Add from Library</label>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {availableVideos.length > 0 ? (
                  availableVideos.map((vid) => (
                    <button
                      key={vid.id}
                      onClick={() => addToSequence(vid)}
                      className="aspect-video rounded-2xl border-2 border-zinc-800 overflow-hidden opacity-60 hover:opacity-100 hover:border-indigo-500 transition-all group relative"
                    >
                      <video src={vid.url} className="w-full h-full object-cover pointer-events-none" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xl">➕</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-800">
                    <p className="text-[10px] text-zinc-600 uppercase font-bold">Library is empty</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reference Images */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Character Consistency ({selectedImageIds.length}/3)</label>
              <div className="grid grid-cols-3 gap-2">
                {availableImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => toggleImageSelection(img.id)}
                    className={`aspect-square rounded-xl border-2 overflow-hidden transition-all relative ${
                      selectedImageIds.includes(img.id) ? 'border-indigo-500 scale-95 shadow-xl' : 'border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="Ref" className="w-full h-full object-cover" />
                    {selectedImageIds.includes(img.id) && (
                      <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                        <span className="text-white text-xs">✅</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Stitching Script */}
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Bridging Narrative</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the action that happens between the selected clips..."
                className="w-full h-24 bg-zinc-950 border-none rounded-2xl p-4 text-sm text-zinc-100 placeholder-zinc-700 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>

            <div className="space-y-4">
               <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Transition Style</label>
               <select 
                value={transition}
                onChange={(e) => setTransition(e.target.value as StitchTransition)}
                className="w-full bg-zinc-950 border-none rounded-xl p-3 text-xs text-zinc-100 focus:ring-1 focus:ring-indigo-500"
               >
                {Object.entries(StitchTransition).map(([k, v]) => (
                  <option key={k} value={v}>{v}</option>
                ))}
               </select>
            </div>

            <button
              onClick={handleStitch}
              disabled={loading || sequence.length < 1 || !prompt.trim()}
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Temporal Interpolation...</span>
                </>
              ) : (
                <>
                  <span>🎞️ {sequence.length > 1 ? 'Stitch Multi-Clips' : 'Extend Single Clip'}</span>
                </>
              )}
            </button>
            {error && <p className="text-red-400 text-[10px] text-center uppercase font-bold">{error}</p>}
          </div>
        </div>

        {/* Main Composition Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] p-10 min-h-[600px] flex flex-col shadow-inner">
             <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                   <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                   Timeline Preview
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{sequence.length} Clips Selected</p>
             </div>

             {sequence.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 group">
                  <div className="text-9xl mb-10 group-hover:scale-110 transition-transform duration-700">🎞️</div>
                  <h4 className="text-2xl font-cinematic uppercase tracking-[0.3em]">Continuity Room</h4>
                  <p className="max-w-xs mt-4 text-sm font-medium">Add clips from your library or upload them to define the starting and ending points for AI interpolation.</p>
               </div>
             ) : (
               <div className="flex-1 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {sequence.slice(0, 2).map((item, idx) => (
                      <div key={item.id} className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex justify-between items-center px-4">
                           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                             {idx === 0 ? 'START CLIP' : 'END CLIP'}
                           </span>
                           <button onClick={() => removeFromSequence(item.id)} className="text-zinc-600 hover:text-red-400 text-xs">Remove</button>
                        </div>
                        <div className="aspect-video rounded-[2.5rem] overflow-hidden border-2 border-zinc-800 bg-black group relative shadow-2xl">
                           <video 
                            ref={el => { if (el) videoPreviewRefs.current[item.id] = el; }}
                            src={item.url} 
                            controls 
                            className="w-full h-full object-contain" 
                           />
                           <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-bold text-white border border-white/10 uppercase">
                             {item.title}
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {sequence.length === 1 && (
                    <div className="py-12 border-2 border-dashed border-zinc-800 rounded-[3rem] flex flex-col items-center justify-center opacity-50 bg-zinc-950/30">
                       <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Single Clip Mode: Extension Only</p>
                       <p className="text-[10px] text-zinc-700 mt-2">Add a second clip to enable AI Bridging.</p>
                    </div>
                  )}

                  {sequence.length > 2 && (
                    <p className="text-center text-[10px] text-amber-500 font-bold uppercase tracking-widest bg-amber-500/10 py-3 rounded-2xl border border-amber-500/20">
                      We currently supports bridging between the first two selected clips. 
                    </p>
                  )}
               </div>
             )}

             {loading && (
               <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-3xl z-40 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
                  <div className="relative mb-12">
                     <div className="w-24 h-24 border-4 border-indigo-500/10 rounded-full"></div>
                     <div className="w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 shadow-[0_0_60px_rgba(79,70,229,0.3)]"></div>
                  </div>
                  <h3 className="text-4xl font-cinematic text-white tracking-widest mb-4">SYNTHESIZING CONTINUITY</h3>
                  <div className="max-w-md w-full space-y-4">
                     <p className="text-zinc-500 text-sm italic leading-relaxed">
                       "Bridging the visual flow between clips. Matching character geometry and lighting across temporal coordinates..."
                     </p>
                     <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                       <div className="h-full bg-indigo-500 animate-[loading_15s_ease-in-out_infinite]"></div>
                     </div>
                  </div>
               </div>
             )}
          </div>
          
          <div className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-3">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Stitching Intelligence</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                   When you select two clips, Gemini captures the <b>final frame</b> of clip A and the <b>initial frame</b> of clip B. It then directs the Veo engine to synthesize a high-fidelity bridging sequence that naturally transitions between these two states.
                </p>
             </div>
             <div className="space-y-3">
                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Consistency Protocol</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                   Linking <b>Character Reference</b> images ensures that the AI maintains specific visual features (like fur pattern or outfit details) even when interpolating between two distinct video sources.
                </p>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          70% { width: 94%; }
          100% { width: 100%; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
      `}</style>
    </div>
  );
};
