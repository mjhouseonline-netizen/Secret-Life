
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';

interface AuthProps { onLogin: (user: User) => void; }

const DEFAULT_CLIENT_ID = '1042356611430-qa2i8o4fgavdqu9ivvtq9i1qdlpomp5p.apps.googleusercontent.com';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [googleStatus, setGoogleStatus] = useState<'loading' | 'ready' | 'error'>('loading');
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
    let attempts = 0;
    const initGsi = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        try {
          google.accounts.id.initialize({
            client_id: getGoogleClientId(),
            callback: handleGoogleResponse,
            auto_select: false,
            ux_mode: 'popup'
          });
          if (googleBtnRef.current) {
            google.accounts.id.renderButton(googleBtnRef.current, { 
              theme: 'filled_black', size: 'large', text: 'signin_with', width: 320 
            });
            setGoogleStatus('ready');
          }
          return true;
        } catch (e) {
          setGoogleStatus('error');
          return true;
        }
      }
      attempts++;
      if (attempts > 50) {
        setGoogleStatus('error');
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
    } catch (err) { 
      setError('POLICY BLOCK: CHECK GOOGLE CLOUD CONSOLE ORIGINS'); 
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) { setError('DIRECTOR CODENAME REQUIRED!'); return; }
    if (!password) { setError('SECURE PRODUCTION KEY REQUIRED!'); return; }
    
    // In this studio prototype, any non-empty password allows local session establishment
    onLogin({
      id: `local_${Math.random().toString(36).substr(2, 9)}`,
      username: username.toUpperCase(),
      role: 'user',
      credits: 100,
      lastCreditReset: Date.now(),
      cloudProvider: 'none'
    });
  };

  return (
    <div className="min-h-screen bg-action-blue flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Background Hatching */}
      <div className="absolute inset-0 comic-hatch opacity-10 pointer-events-none"></div>
      
      {/* Action Burst Backdrop (Clean lines) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] bg-[conic-gradient(from_0deg,_transparent_0deg,_transparent_15deg,_white_15.1deg,_white_16deg,_transparent_16.1deg)] animate-spin [animation-duration:180s]"></div>
      </div>

      <div className="max-w-md w-full relative z-20">
        <div className="text-center mb-8 transform -rotate-1">
           <h1 className="text-8xl font-comic text-white stroke-black-bold drop-shadow-[10px_10px_0px_#000] uppercase leading-none mb-2">
             SECRET LIFE!
           </h1>
           <div className="bg-yellow-400 text-black px-6 py-2 inline-block text-[12px] font-black uppercase tracking-[0.4em] border-4 border-black shadow-[6px_6px_0px_#000]">
             STUDIO PORTAL
           </div>
        </div>

        <div className="bg-white border-[6px] border-black p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] relative">
          <div className="relative z-10 space-y-6">
            <div className="text-center">
              <h2 className="text-4xl font-comic text-black uppercase mb-1">ENTER STUDIO</h2>
              <div className="h-2 w-24 bg-magenta-500 mx-auto border-2 border-black mt-2"></div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                {googleStatus === 'loading' ? (
                  <div className="w-full h-12 bg-zinc-100 animate-pulse border-4 border-black"></div>
                ) : googleStatus === 'error' ? (
                  <div className="text-[10px] font-black text-red-600 bg-red-50 border-4 border-black p-3 uppercase text-center w-full shadow-[4px_4px_0px_#000]">
                    OAuth Blocked by Policy
                  </div>
                ) : (
                  <div ref={googleBtnRef} className="border-4 border-black shadow-[6px_6px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"></div>
                )}
              </div>
            </div>
            
            <div className="relative flex items-center gap-2">
              <div className="flex-1 h-1 bg-black"></div>
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest bg-white px-3 italic">OR OVERRIDE</span>
              <div className="flex-1 h-1 bg-black"></div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-600 ml-1">DIRECTOR CODENAME</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="EX: CAPTAIN WHISKERS"
                  className="w-full bg-zinc-50 border-4 border-black p-4 text-black font-black outline-none placeholder:text-zinc-300 uppercase focus:bg-white text-lg shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-600 ml-1">SECURE PRODUCTION KEY</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-50 border-4 border-black p-4 text-black font-black outline-none placeholder:text-zinc-300 uppercase focus:bg-white text-lg shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)]"
                />
              </div>
              
              {error && <p className="text-red-600 text-[10px] font-black text-center uppercase border-4 border-black py-3 bg-red-50 shadow-[6px_6px_0px_#000]">{error}</p>}

              <button 
                type="submit"
                className="w-full py-6 bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black font-comic text-5xl uppercase shadow-[10px_10px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all transform hover:rotate-1"
              >
                PRODUCE!
              </button>
            </form>

            <p className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-wider px-4 leading-tight">
              * Local production archives are saved in browser memory.
            </p>
          </div>
        </div>
        
        <div className="mt-10 flex justify-between text-white font-bold text-[10px] uppercase tracking-[0.2em] px-2 drop-shadow-[4px_4px_0px_#000]">
          <span>EDITION #001</span>
          <span>© 2025 CINEPET STUDIOS</span>
        </div>
      </div>
    </div>
  );
};
