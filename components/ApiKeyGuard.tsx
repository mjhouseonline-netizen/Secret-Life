
import React, { useState, useEffect } from 'react';

interface ApiKeyGuardProps {
  children: React.ReactNode;
}

interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

/**
 * ApiKeyGuard ensures that users have access to high-tier models.
 * It prioritizes process.env.API_KEY and only prompts for selection 
 * if no key is detected and the environment supports the aistudio interface.
 */
export const ApiKeyGuard: React.FC<ApiKeyGuardProps> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    // 1. Prioritize injected API Key from environment
    const envKey = process.env.API_KEY;
    if (envKey && envKey !== 'undefined' && envKey.length > 5) {
      setHasKey(true);
      return;
    }

    // 2. Fallback to selection utility if env key is missing
    try {
      const studio = (window as any).aistudio as AIStudio;
      if (studio && typeof studio.hasSelectedApiKey === 'function') {
        const selected = await studio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // If neither env key nor studio utility is present, 
        // we assume the key is handled elsewhere and unblock.
        setHasKey(true);
      }
    } catch (e) {
      console.error("Error checking API key status:", e);
      setHasKey(true);
    }
  };

  const handleSelectKey = () => {
    try {
      const studio = (window as any).aistudio as AIStudio;
      if (studio && typeof studio.openSelectKey === 'function') {
        studio.openSelectKey();
      }
    } catch (e) {
      console.error("Failed to open key selection dialog:", e);
    } finally {
      // Per guidelines: Assume success after trigger to avoid race condition blocks
      setHasKey(true);
    }
  };

  if (hasKey === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-6 text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Verifying Production Credentials...</p>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-8 text-center">
        <div className="max-w-md w-full bg-zinc-900 border-4 border-black p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] relative halftone">
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-yellow-400 border-4 border-black rotate-12 flex items-center justify-center font-comic text-black text-xl">!</div>
          
          <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-8 border-2 border-black">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-comic mb-4 tracking-tight text-white stroke-black-thin">PRE-FLIGHT CHECK</h1>
          <p className="text-zinc-400 mb-8 text-xs font-bold uppercase leading-relaxed tracking-wider">
            To enable professional Video and 4K rendering, the Studio needs to verify your Google Cloud production project.
          </p>
          
          <button
            onClick={handleSelectKey}
            className="w-full py-5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl border-4 border-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 group"
          >
            Authenticate Studio
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          
          <div className="mt-10 flex flex-col gap-4">
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-black text-zinc-500 hover:text-indigo-400 uppercase tracking-widest underline decoration-2 underline-offset-4"
            >
              Billing Documentation
            </a>
            <button 
              onClick={() => setHasKey(true)}
              className="text-[9px] font-bold text-zinc-700 hover:text-zinc-500 uppercase tracking-widest"
            >
              Enter Studio Anyway
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
