
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AppView, GeneratedContent } from '../types';

interface AIAvatarProps {
  activeView: AppView;
  history: GeneratedContent[];
}

export const AIAvatar: React.FC<AIAvatarProps> = ({ activeView, history }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<string>("Welcome back, Director. Ready to produce some magic?");
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  const getAIResponse = async (userMessage?: string) => {
    setLoading(true);
    try {
      // Safely obtain API Key
      let apiKey = '';
      try {
        if (typeof process !== 'undefined' && process.env) {
          apiKey = process.env.API_KEY || '';
        }
      } catch (e) {
        console.warn("Process env inaccessible in AIAvatar");
      }

      if (!apiKey) {
        setSuggestion("API ACCESS UNAVAILABLE. PLEASE CHECK SETUP!");
        setLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemPrompt = `You are "CINE!", a high-energy comic book creative director.
      Tone: Loud, enthusiastic, uses comic book terminology like "PANEL!", "INKING!", "SPLASH PAGE!".
      Length: Keep it under 40 words.
      Style: Use exclamation marks! ALL CAPS for emphasis on comic words.
      Context: User is currently in the ${activeView} section.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage || "Give me a creative production tip!",
        config: {
          systemInstruction: systemPrompt,
        },
      });

      setSuggestion(response.text || "KEEP THE INK FLOWING!");
      setUserInput("");
    } catch (err) {
      console.error("AI Avatar Error:", err);
      setSuggestion("MY INK IS CLOGGED! TRY AGAIN LATER!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) getAIResponse();
  }, [activeView, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    getAIResponse(userInput);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="mb-6 w-80 bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_#000] animate-in slide-in-from-bottom-6 halftone">
          <div className="flex items-center gap-3 border-b-2 border-black pb-4 mb-4">
             <div>
                <p className="text-sm font-comic text-black tracking-widest uppercase">CINE! THE DIRECTOR</p>
                <div className="bg-cyan-400 text-[8px] font-black px-1.5 py-0.5 border border-black inline-block uppercase">On Air</div>
             </div>
          </div>
          
          <div className="min-h-[100px] mb-4">
            {loading ? (
               <div className="flex gap-1">
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-200"></div>
               </div>
            ) : (
              <p className="text-sm font-bold italic leading-tight text-black uppercase">
                "{suggestion}"
              </p>
            )}
          </div>

          <form onSubmit={handleSend} className="space-y-3">
            <input 
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="SAY SOMETHING"
              className="w-full bg-white border-2 border-black p-2 text-xs font-bold outline-none uppercase"
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-yellow-400 border-3 border-black text-[10px] font-black uppercase hover:bg-yellow-300 shadow-[2px_2px_0px_0px_#000] disabled:opacity-50"
            >
              SEND INTEL
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-20 h-20 border-4 border-black shadow-[6px_6px_0px_0px_#000] flex items-center justify-center text-[10px] font-black uppercase transition-all ${
          isOpen ? 'bg-zinc-100 rotate-12 scale-90' : 'bg-magenta-500 hover:rotate-6 active:scale-95 text-white'
        }`}
      >
        {isOpen ? 'CLOSE' : 'DIRECTOR'}
      </button>
    </div>
  );
};
