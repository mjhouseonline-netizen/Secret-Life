
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
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-2 uppercase tracking-widest font-cinematic">Intelligence Studio</h2>
        <p className="text-zinc-400 uppercase text-[10px] font-bold">Deep analysis of images and videos using Gemini 3 Pro.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video border-2 border-dashed border-zinc-700 hover:border-indigo-500 bg-zinc-900 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
            >
              <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={handleFileChange} />
              {file ? (
                file.mimeType.startsWith('image/') ? (
                  <img src={file.data} className="w-full h-full object-contain" />
                ) : (
                  <video src={file.data} className="w-full h-full object-contain" />
                )
              ) : (
                <>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">UPLOAD MEDIA</p>
                </>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Analysis Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-24 bg-zinc-800 border-none rounded-xl p-4 text-zinc-100 focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-xs uppercase font-bold"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !file}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-xl"
            >
              {loading ? "ANALYZING..." : "START INTELLIGENCE ENGINE"}
            </button>
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl min-h-[400px]">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4">Analysis Report</h3>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-full mb-4"></div>
                <div className="h-4 w-48 bg-zinc-800 rounded-full mb-2"></div>
                <div className="h-4 w-32 bg-zinc-800 rounded-full"></div>
              </div>
            ) : response ? (
              <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {response}
              </div>
            ) : (
              <div className="text-center py-20 opacity-20">
                <p className="text-[10px] font-black uppercase tracking-widest">Awaiting data input...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
