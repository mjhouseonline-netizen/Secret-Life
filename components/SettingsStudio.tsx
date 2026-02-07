
import React, { useState, useEffect } from 'react';
import { User, UserSettings } from '../types';
import { getGoogleClientId } from '../config';

interface SettingsStudioProps {
  user: User;
  onUpdateSettings: (settings: UserSettings) => void;
  onCloudAuth: (accessToken: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onViewPrivacy?: () => void;
  onViewTerms?: () => void;
}

export const SettingsStudio: React.FC<SettingsStudioProps> = ({ user, onUpdateSettings, onCloudAuth, onLogout, onDeleteAccount, onViewPrivacy, onViewTerms }) => {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  const settings = user.settings || {
    safeMode: true,
    hdByDefault: false,
    autoCloudSync: false
  };

  useEffect(() => {
    const checkKey = async () => {
      const studio = (window as any).aistudio;
      if (studio?.hasSelectedApiKey) {
        const has = await studio.hasSelectedApiKey();
        setHasApiKey(has);
      } else if (process.env.API_KEY) {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const studio = (window as any).aistudio;
    if (studio?.openSelectKey) {
      await studio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const toggleSetting = (key: keyof UserSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key]
    });
  };

  const handleAuthorizeDrive = () => {
    setIsAuthorizing(true);
    setAuthError(null);
    const google = (window as any).google;
    
    if (!google?.accounts?.oauth2) {
      setAuthError("GOOGLE IDENTITY ENGINE NOT LOADED");
      setIsAuthorizing(false);
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: getGoogleClientId(),
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response.error) {
            setAuthError(response.error_description || "AUTHORIZATION DENIED");
          } else {
            onCloudAuth(response.access_token);
          }
          setIsAuthorizing(false);
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      setAuthError("DRIVE SYNC INITIALIZATION FAILED");
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      <div className="border-b-4 border-black pb-8 transform -rotate-1">
        <h2 className="text-5xl md:text-7xl font-comic text-white stroke-black-bold drop-shadow-[6px_6px_0px_#000] uppercase tracking-wider">
          STUDIO SETUP
        </h2>
        <div className="bg-yellow-400 text-black px-4 py-1.5 inline-block text-[12px] font-black uppercase mt-4 tracking-[0.3em] border-4 border-black shadow-[6px_6px_0px_#000]">
          CONFIGURATION COMMAND CENTER
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Essential Configuration */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* 1. Production Credentials */}
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_#000] overflow-hidden">
            <div className="p-6 border-b-4 border-black bg-cyan-400 flex items-center justify-between">
              <h3 className="text-2xl font-comic uppercase text-black">PRODUCTION CREDENTIALS</h3>
              <div className="px-3 py-1 bg-white border-2 border-black text-[10px] font-black uppercase">VITAL</div>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-6 p-6 bg-zinc-50 border-4 border-black relative">
                <div className={`w-16 h-16 border-4 border-black flex items-center justify-center text-3xl ${hasApiKey ? 'bg-green-100' : 'bg-red-100'}`}>
                  {hasApiKey ? '🔑' : '❌'}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase text-zinc-400 mb-1">PROJECT API STATUS</p>
                  <p className="text-xl font-black text-black uppercase">
                    {hasApiKey ? 'CREDENTIALS VERIFIED' : 'ACTION REQUIRED: KEY MISSING'}
                  </p>
                </div>
              </div>

              <p className="text-[11px] font-bold text-zinc-500 uppercase leading-relaxed italic">
                A PAID GOOGLE CLOUD API KEY IS REQUIRED FOR HIGH-FIDELITY VEO VIDEO GENERATION AND GEMINI 3 PRO MODELS.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleSelectKey}
                  className="flex-1 py-5 bg-black text-white font-comic text-2xl uppercase shadow-[6px_6px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                >
                  {hasApiKey ? 'RE-VERIFY KEY' : 'AUTHENTICATE STUDIO'}
                </button>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 py-5 bg-zinc-100 border-4 border-black text-black font-comic text-2xl text-center uppercase shadow-[6px_6px_0px_0px_#000] hover:bg-white transition-all"
                >
                  BILLING DOCS
                </a>
              </div>
            </div>
          </div>

          {/* 2. Director Identity */}
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_#000] overflow-hidden">
            <div className="p-6 border-b-4 border-black bg-zinc-50 flex items-center justify-between">
              <h3 className="text-2xl font-comic uppercase text-black">DIRECTOR IDENTITY</h3>
            </div>
            <div className="p-8">
               <div className="flex items-center gap-6 p-6 bg-zinc-50 border-4 border-black mb-8">
                  <div className="w-24 h-24 border-4 border-black bg-white overflow-hidden shadow-[6px_6px_0px_0px_#000]">
                     <img src={user.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/3011/3011270.png'} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">CHIEF CREATIVE OFFICER</p>
                     <p className="text-4xl font-comic text-black uppercase leading-none truncate">{user.username}</p>
                     <p className="text-[11px] text-zinc-400 uppercase font-bold mt-2 truncate">{user.email || 'LOCAL STUDIO INSTANCE'}</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={onLogout} 
                    className="py-4 bg-white border-4 border-black text-black font-black text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[6px_6px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                  >
                    DISCONNECT SESSION
                  </button>
                  <button 
                    onClick={() => { if(confirm('PURGE ALL PRODUCTION ARCHIVES? THIS CANNOT BE UNDONE!')) onDeleteAccount(); }} 
                    className="py-4 bg-white border-4 border-black text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-[6px_6px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                  >
                    PURGE ALL ASSETS
                  </button>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences & Sync */}
        <div className="lg:col-span-5 space-y-10">
          
          {/* 3. Studio Flags */}
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_#000] overflow-hidden">
            <div className="p-6 border-b-4 border-black bg-magenta-500 text-white flex items-center justify-between">
              <h3 className="text-2xl font-comic uppercase text-white">STUDIO FLAGS</h3>
            </div>
            <div className="p-8 space-y-4">
               {[
                 { key: 'safeMode' as keyof UserSettings, label: 'ANATOMY GUARD (SAFE)', desc: 'Enforces natural proportions and family-friendly filters.' },
                 { key: 'hdByDefault' as keyof UserSettings, label: 'FORCE 4K RENDERING', desc: 'Prioritizes maximum fidelity for all productions.' },
                 { key: 'autoCloudSync' as keyof UserSettings, label: 'DRIVE CONTINUITY', desc: 'Automatically backup master files to Google Drive.' }
               ].map((item) => (
                 <div key={item.key} onClick={() => toggleSetting(item.key)} className={`p-6 border-4 cursor-pointer transition-all flex items-center justify-between group ${settings[item.key] ? 'bg-zinc-50 border-black shadow-[4px_4px_0px_0px_#000]' : 'bg-zinc-50 border-zinc-100 hover:border-black'}`}>
                   <div className="max-w-[75%]">
                      <p className={`font-black text-sm uppercase ${settings[item.key] ? 'text-black' : 'text-zinc-400'}`}>{item.label}</p>
                      <p className="text-[9px] font-bold uppercase tracking-tight text-zinc-400 mt-1">{item.desc}</p>
                   </div>
                   <div className={`w-12 h-8 border-4 border-black flex items-center px-1 transition-colors ${settings[item.key] ? 'bg-magenta-500 justify-end' : 'bg-white justify-start'}`}>
                      <div className={`w-4 h-4 border-2 border-black ${settings[item.key] ? 'bg-white' : 'bg-black'}`}></div>
                   </div>
                 </div>
               ))}
            </div>
          </div>

          {/* 4. Cloud Link */}
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_#000] overflow-hidden flex flex-col">
            <div className="p-6 border-b-4 border-black bg-zinc-50 flex items-center justify-between">
               <h3 className="text-2xl font-comic uppercase text-black">CLOUD LINK</h3>
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">DRIVE V3</span>
            </div>
            
            <div className="p-10 flex-1 flex flex-col justify-center text-center space-y-8 relative overflow-hidden">
               <div className="absolute inset-0 comic-hatch opacity-5 pointer-events-none"></div>
               
               <div className="flex flex-col items-center">
                  <div className={`w-28 h-28 border-8 border-black flex items-center justify-center text-5xl bg-zinc-50 mb-6 shadow-[10px_10px_0px_0px_#000] transform -rotate-2 ${user.cloudAccessToken ? 'bg-cyan-100' : ''}`}>
                    {user.cloudAccessToken ? '📡' : '🔇'}
                  </div>
                  <h4 className="text-3xl font-comic text-black uppercase">SYNC PROTOCOL</h4>
                  <div className="flex items-center gap-2 mt-2">
                     <div className={`w-3 h-3 rounded-full border-2 border-black ${user.cloudAccessToken ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                       {user.cloudAccessToken ? 'LINK ACTIVE' : 'NO CONNECTION'}
                     </p>
                  </div>
               </div>

               <button 
                  onClick={handleAuthorizeDrive}
                  disabled={isAuthorizing}
                  className={`w-full py-6 bg-cyan-400 text-black border-4 border-black font-comic text-4xl uppercase shadow-[10px_10px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all ${isAuthorizing ? 'animate-pulse' : ''}`}
               >
                  {isAuthorizing ? 'CONNECTING...' : 'ESTABLISH LINK'}
               </button>
               {authError && <p className="text-red-500 text-[10px] font-black uppercase text-center mt-2">{authError}</p>}
            </div>
            
            <div className="p-6 bg-zinc-50 border-t-4 border-black flex justify-between gap-4">
               <button onClick={onViewPrivacy} className="text-[9px] font-black uppercase text-zinc-400 hover:text-black transition-colors">PRIVACY POLICY</button>
               <button onClick={onViewTerms} className="text-[9px] font-black uppercase text-zinc-400 hover:text-black transition-colors">TERMS OF SERVICE</button>
            </div>
          </div>
        </div>

      </div>

      <div className="text-center pt-20">
         <div className="inline-block px-10 py-4 bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] transform rotate-1">
           <p className="text-[12px] text-black font-black uppercase tracking-[0.6em]">
             SECRET LIFE ENGINE • v4.5.0 • PAGE EDITION SETUP
           </p>
         </div>
      </div>
    </div>
  );
};
