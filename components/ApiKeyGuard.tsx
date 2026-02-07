
import React, { useState, useEffect } from 'react';

interface ApiKeyGuardProps {
  children: React.ReactNode;
}

interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

export const ApiKeyGuard: React.FC<ApiKeyGuardProps> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    // 1. Safely check for injected API Key from environment
    let envKey: string | undefined;
    try {
      if (typeof process !== 'undefined' && process.env) {
        envKey = process.env.API_KEY;
      }
    } catch (e) {
      console.warn("Process environment not accessible during guard check");
    }

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
      // Optimistic transition
      setHasKey(true);
    }
  };

  if (hasKey === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-6 text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Verifying Production Credentials...</p>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-8 text-center">
        <div className="max-w-md w-full bg-zinc-900 border-4 border-black p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] relative halftone">
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-yellow-400 border-4 border-black rotate-12 flex items-center justify-center font-comic text-black text-xl">!</div>
          <h1 className="text-4xl font-comic mb-4 tracking-tight text-white stroke-black-thin">PRE-FLIGHT CHECK</h1>
          <p className="text-zinc-400 mb-8 text-xs font-bold uppercase leading-relaxed tracking-wider">
            To enable professional Video and 4K rendering, the Studio needs to verify your Google Cloud production project.
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full py-5 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl border-4 border-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center gap-3"
          >
            Authenticate Studio
          </button>
          <div className="mt-10 flex flex-col gap-4">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-zinc-500 hover:text-cyan-400 uppercase tracking-widest underline underline-offset-4">
              Billing Documentation
            </a>
            <button onClick={() => setHasKey(true)} className="text-[9px] font-bold text-zinc-700 hover:text-zinc-500 uppercase tracking-widest">
              Enter Studio Anyway
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
