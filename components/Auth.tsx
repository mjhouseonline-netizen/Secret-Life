
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';

interface AuthProps { onLogin: (user: User) => void; }

// Fallback ID if not provided by environment
const DEFAULT_CLIENT_ID = '1042356611430-qa2i8o4fgavdqu9ivvtq9i1qdlpomp5p.apps.googleusercontent.com';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const getGoogleClientId = () => {
    try {
      if (typeof process !== 'undefined' && process.env?.GOOGLE_CLIENT_ID) {
        return process.env.GOOGLE_CLIENT_ID;
      }
    } catch (e) {}
    return DEFAULT_CLIENT_ID;
  };

  useEffect(() => {
    let checkGsi: any;
    const initGsi = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: getGoogleClientId(),
          callback: handleGoogleResponse,
          auto_select: false,
        });
        if (googleBtnRef.current) {
          google.accounts.id.renderButton(googleBtnRef.current, { 
            theme: 'filled_black', size: 'large', text: 'signin_with', width: 320 
          });
        }
        return true;
      }
      return false;
    };
    checkGsi = setInterval(() => { if (initGsi()) clearInterval(checkGsi); }, 200);
    return () => clearInterval(checkGsi);
  }, []);

  const handleGoogleResponse = (response: any) => {
    try {
      const base64Url = response.credential.split('.')[1];
      const payload = JSON.parse(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
      onLogin({
        id: payload.sub,
        username: payload.name || 'Studio Director',
        email: payload.email,
        avatarUrl: payload.picture,
        role: 'user',
        credits: 100,
        lastCreditReset: Date.now(),
        cloudProvider: 'google'
      });
    } catch (err) { setError('AUTHENTICATION DENIED BY PROVIDER'); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError('IDENTIFICATION REQUIRED!'); return; }
    onLogin({
      id: Math.random().toString(36).substr(2, 9),
      username,
      role: 'user',
      credits: 100,
      lastCreditReset: Date.now(),
      cloudProvider: 'none'
    });
  };

  return (
    <div className="min-h-screen bg-blue-700 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Action-Oriented Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2563eb_0%,_#1e3a8a_100%)] opacity-100"></div>
      <div className="absolute inset-0 halftone opacity-30 pointer-events-none"></div>
      
      {/* Action Lines (Conic Burst) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,_transparent_0deg,_transparent_15deg,_white_15.1deg,_white_16deg,_transparent_16.1deg)] animate-spin [animation-duration:60s]"></div>
      </div>

      <div className="absolute top-10 right-10 rotate-12 hidden md:block">
        <div className="bg-magenta-500 border-4 border-black px-6 py-3 shadow-[8px_8px_0px_#000] font-comic text-4xl text-white stroke-black-bold">WHAM!</div>
      </div>
      <div className="absolute bottom-10 left-10 -rotate-6 hidden md:block">
        <div className="bg-yellow-400 border-4 border-black px-8 py-4 shadow-[8px_8px_0px_#000] font-comic text-4xl text-black">POW!</div>
      </div>

      <div className="max-w-md w-full relative z-20">
        <div className="text-center mb-8 transform -rotate-1">
           <h1 className="text-8xl font-comic text-white stroke-black-bold drop-shadow-[10px_10px_0px_#000] uppercase leading-none mb-2">
             SECRET LIFE!
           </h1>
           <div className="bg-yellow-400 text-black px-4 py-1 inline-block text-[10px] font-black uppercase tracking-[0.4em] border-2 border-black shadow-[4px_4px_0px_#000]">
             STUDIO ACCESS
           </div>
        </div>

        <div className="bg-white border-[6px] border-black p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] relative group">
          <div className="absolute inset-0 halftone opacity-10 pointer-events-none bg-blue-500"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-comic text-black uppercase mb-1">{isLogin ? 'ENTER STUDIO' : 'SIGN CONTRACT'}</h2>
              <div className="h-1.5 w-24 bg-magenta-500 mx-auto border-2 border-black mt-1"></div>
            </div>

            <div className="flex justify-center py-2">
              <div ref={googleBtnRef} className="border-4 border-black shadow-[6px_6px_0px_#000] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"></div>
            </div>
            
            <div className="relative flex items-center gap-2 py-2">
              <div className="flex-1 h-1 bg-black"></div>
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest bg-white px-2">OR USE STUDIO ID</span>
              <div className="flex-1 h-1 bg-black"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="CODENAME (e.g. BUBBLES)"
                className="w-full bg-blue-50 border-4 border-black p-4 text-blue-950 font-black outline-none placeholder:text-blue-300 uppercase focus:bg-white text-lg"
              />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="CLEARANCE KEY"
                className="w-full bg-blue-50 border-4 border-black p-4 text-blue-950 font-black outline-none placeholder:text-blue-300 uppercase focus:bg-white text-lg"
              />
              
              {error && <p className="text-red-600 text-[10px] font-black text-center uppercase animate-bounce border-2 border-red-600 py-2 bg-red-50 shadow-[4px_4px_0px_#000]">{error}</p>}

              <button 
                type="submit"
                className="w-full py-6 bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black font-comic text-5xl uppercase shadow-[10px_10px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all group-hover:rotate-1"
              >
                {isLogin ? 'START INK' : 'SIGN!'}
              </button>
            </form>

            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-[11px] text-blue-900 font-black uppercase hover:text-magenta-600 transition-colors tracking-widest"
            >
              {isLogin ? "No badge? Request access here" : "Returning Director? Login here"}
            </button>
          </div>
        </div>
        
        <div className="mt-10 flex justify-between text-white font-bold text-[9px] uppercase tracking-widest px-2 drop-shadow-[2px_2px_0px_#000]">
          <span>ISSUE #001 • 2025</span>
          <span>© CINEPET CREATIVE CORP</span>
        </div>
      </div>

      <style>{`
        .halftone {
          background-image: radial-gradient(circle, currentColor 1px, transparent 1px);
          background-size: 8px 8px;
        }
        .stroke-black-bold { -webkit-text-stroke: 3px black; }
      `}</style>
    </div>
  );
};
