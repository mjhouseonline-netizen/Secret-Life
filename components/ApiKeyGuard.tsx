
import React, { useState, useEffect } from 'react';

interface ApiKeyGuardProps {
  children: React.ReactNode;
}

// AIStudio interface is used for documentation and internal clarity, 
// but we avoid global declaration merging to prevent environment-specific conflicts.
interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

/**
 * ApiKeyGuard ensures that users have selected a billing-enabled API key
 * for high-tier models like Veo and Gemini 3 Pro.
 */
export const ApiKeyGuard: React.FC<ApiKeyGuardProps> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    try {
      // Cast window to any to access aistudio without conflicting with global declarations
      const studio = (window as any).aistudio as AIStudio;
      const selected = await studio.hasSelectedApiKey();
      setHasKey(selected);
    } catch (e) {
      console.error("Error checking API key status:", e);
      setHasKey(false);
    }
  };

  const handleSelectKey = async () => {
    try {
      const studio = (window as any).aistudio as AIStudio;
      await studio.openSelectKey();
      // Per guidelines, assume success after triggering the dialog to mitigate race conditions
      setHasKey(true);
    } catch (e) {
      console.error("Failed to open key selection dialog:", e);
    }
  };

  if (hasKey === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-6 text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400">Initializing Workspace...</p>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-8 text-center">
        <div className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 p-10 rounded-3xl shadow-2xl">
          <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4 tracking-tight">Access Required</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            To use advanced CinePet features like 4K generation and Video creation, you need to select a billing-enabled API key from a paid GCP project.
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 group"
          >
            Select API Key
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <div className="mt-6">
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-zinc-300 underline"
            >
              Learn more about API billing
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
