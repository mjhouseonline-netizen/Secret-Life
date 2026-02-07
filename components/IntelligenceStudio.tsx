
import React, { useState, useRef } from 'react';
import { GeminiService } from '../services/gemini';

export const IntelligenceStudio: React.FC = () => {
  const [file, setFile] = useState<{ data: string; mimeType: string } | null>(null);
  const [prompt, setPrompt] = useState('Analyze this content and summarize key details.');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFile({ data: reader.result as string, mimeType: f.type });
      };
      reader.readAsDataURL(f);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !prompt) return;
    setLoading(true);
    setError(null);
    try {
      const result = await GeminiService.analyzeContent(file.data, file.mimeType, prompt);
      setResponse(result || 'No analysis returned.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="border-b-4 border-black pb-8 transform -rotate-1">
        <h2 className="text-5xl font-comic text-white stroke-black-bold drop-shadow-[4px_4px_0px_#000] uppercase tracking-wider">INTEL</h2>
        <div className="bg-yellow-400 text-black px-3 py-1 inline-block text-[10px] font-black uppercase mt-2 tracking-widest border-2 border-black">DEEP MULTIMODAL ANALYSIS</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="bg-white border-[6px] border-black p-8 shadow-[12px_12px_0px_0px_#000] space-y-8 text-black relative">
            <div className="absolute inset-0 comic-hatch opacity-5 pointer-events-none"></div>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video border-4 border-dashed border-zinc-200 bg-zinc-50 hover:border-black flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative"
            >
              <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={handleFileChange} />
              {file ? (
                file.mimeType.startsWith('image/') ? (
                  <img src={file.data} className="w-full h-full object-contain" />
                ) : (
                  <video src={file.data} className="w-full h-full object-contain" />
                )
              ) : (
                <div className="text-center">
                  <span className="text-4xl block mb-2">📤</span>
                  <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">UPLOAD MEDIA</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">ANALYSIS SCRIPT</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-24 bg-zinc-50 border-4 border-black p-4 text-black font-black uppercase text-xs focus:border-cyan-400 outline-none resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !file}
              className="w-full py-5 bg-cyan-400 border-4 border-black text-black font-comic text-3xl uppercase shadow-[8px_8px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              {loading ? "SCANNING..." : "SCAN INTEL!"}
            </button>
            {error && <p className="text-red-600 text-[10px] font-black uppercase text-center">{error}</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-[6px] border-black p-10 shadow-[16px_16px_0px_0px_#000] min-h-[500px] text-black relative overflow-hidden">
            <div className="absolute inset-0 comic-hatch opacity-5 pointer-events-none"></div>
            <h3 className="text-3xl font-comic uppercase mb-6 border-b-4 border-black pb-4">INTELLIGENCE REPORT</h3>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl animate-bounce mb-4">🔍</div>
                <p className="text-[10px] font-black uppercase text-zinc-400 animate-pulse">Processing Modal Stream...</p>
              </div>
            ) : response ? (
              <div className="text-sm font-bold uppercase leading-relaxed whitespace-pre-wrap">
                {response}
              </div>
            ) : (
              <div className="text-center py-24 opacity-10">
                <p className="text-7xl font-comic uppercase tracking-widest">NO DATA</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
