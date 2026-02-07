
import React, { useState } from 'react';
import { User, UserSettings } from '../types';

interface SettingsStudioProps {
  user: User;
  onUpdateSettings: (settings: UserSettings) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onViewPrivacy?: () => void;
  onViewTerms?: () => void;
}

const DEFAULT_CLIENT_ID = '1042356611430-qa2i8o4fgavdqu9ivvtq9i1qdlpomp5p.apps.googleusercontent.com';

export const SettingsStudio: React.FC<SettingsStudioProps> = ({ user, onUpdateSettings, onLogout, onDeleteAccount, onViewPrivacy, onViewTerms }) => {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const getGoogleClientId = () => {
    try {
      if (typeof process !== 'undefined' && process.env?.GOOGLE_CLIENT_ID) {
        return process.env.GOOGLE_CLIENT_ID;
      }
    } catch (e) {}
    return DEFAULT_CLIENT_ID;
  };

  const currentSettings: UserSettings = user.settings || {
    safeMode: true,
    hdByDefault: true,
    autoCloudSync: false
  };

  const toggleSetting = (key: keyof UserSettings) => {
    onUpdateSettings({
      ...currentSettings,
      [key]: !currentSettings[key]
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
            window.dispatchEvent(new CustomEvent('cloud-auth-success', { detail: response.access_token }));
            onUpdateSettings({
              ...currentSettings,
              autoCloudSync: true
            });
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
    <div className="space-y-12 pb-24">
      <div className="border-b-4 border-black pb-8 transform -rotate-1">
        <h2 className="text-5xl font-comic text-white stroke-black-bold drop-shadow-[4px_4px_0px_#000] uppercase tracking-wider">STUDIO SETUP</h2>
        <div className="bg-cyan-400 text-black px-3 py-1 inline-block text-[10px] font-black uppercase mt-2 tracking-widest border-2 border-black">COMMAND CENTER CONFIG</div>
      </div>

      <div className="max-w-2xl mx-auto space-y-10">
        <div className="bg-zinc-900 border-4 border-black shadow-[10px_10px_0px_0px_#000] halftone overflow-hidden">
          <div className="p-6 border-b-4 border-black bg-zinc-800 flex items-center justify-between">
             <h3 className="text-xl font-comic uppercase text-white">CLOUD ARCHIVING</h3>
             <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Google Drive Integration</span>
          </div>
          
          <div className="divide-y-2 divide-black">
             <div className="p-8 flex items-center justify-between group">
                <div className="max-w-xs">
                   <h4 className="text-sm font-black text-white uppercase mb-1">AUTOMATIC BACKUP</h4>
                   <p className="text-[10px] text-zinc-500 uppercase font-bold leading-tight">Sync every production asset to your secure Google Drive folder instantly.</p>
                </div>
                <button 
                  onClick={() => toggleSetting('autoCloudSync')}
                  className={`w-14 h-7 border-3 border-black rounded-full transition-all relative ${currentSettings.autoCloudSync ? 'bg-cyan-400' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-black border-2 border-black rounded-full transition-all ${currentSettings.autoCloudSync ? 'left-8 rotate-180' : 'left-1'}`}></div>
                </button>
             </div>
             
             {user.cloudProvider === 'google' && (
               <div className={`p-8 transition-colors ${user.cloudAccessToken ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div>
                        <h4 className="text-sm font-black text-white uppercase mb-1">AUTHORIZATION KEY</h4>
                        <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${user.cloudAccessToken ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                             {user.cloudAccessToken ? 'LINK ESTABLISHED' : 'LINK SEVERED'}
                           </p>
                        </div>
                     </div>
                     <button 
                        onClick={handleAuthorizeDrive}
                        disabled={isAuthorizing}
                        className={`px-8 py-3 bg-white text-black text-[10px] font-black uppercase border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${isAuthorizing ? 'animate-pulse' : ''}`}
                     >
                        {isAuthorizing ? 'WAIT...' : user.cloudAccessToken ? 'REFRESH PERMISSIONS' : 'GRANT DRIVE ACCESS'}
                     </button>
                  </div>
                  {authError && <p className="text-red-500 text-[10px] font-black uppercase mt-4 text-center">{authError}</p>}
               </div>
             )}
          </div>
        </div>

        <div className="bg-zinc-900 border-4 border-black shadow-[10px_10px_0px_0px_#000] halftone">
          <div className="p-8">
             <div className="flex items-center gap-6 p-6 bg-zinc-950 border-4 border-black mb-8 relative">
                <div className="w-16 h-16 border-4 border-black bg-zinc-800 overflow-hidden shadow-[4px_4px_0px_0px_#000]">
                   <img src={user.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/3011/3011270.png'} className="w-full h-full object-cover" />
                </div>
                <div>
                   <p className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-1">ACTIVE DIRECTOR</p>
                   <p className="text-2xl font-comic text-white uppercase leading-none">{user.username}</p>
                   <p className="text-[10px] text-zinc-600 uppercase font-bold mt-1">{user.email || 'ANALOG SESSION'}</p>
                </div>
                <div className="absolute top-4 right-4 text-xs font-black text-zinc-800 select-none">ID: {user.id.substring(0,8).toUpperCase()}</div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={onLogout} 
                  className="py-4 bg-zinc-800 border-3 border-black text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 hover:text-white transition-all shadow-[4px_4px_0px_0px_#000] hover:shadow-none"
                >
                  ABANDON POST
                </button>
                <button 
                  onClick={() => { if(confirm('SURE? THIS WIPES THE ARCHIVE!')) onDeleteAccount(); }} 
                  className="py-4 bg-red-600/10 border-3 border-black text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-[4px_4px_0px_0px_#000] hover:shadow-none"
                >
                  PURGE DOSSIER
                </button>
             </div>
          </div>
        </div>

        <div className="text-center space-y-4">
           <div className="flex justify-center gap-8">
             <button 
               onClick={onViewPrivacy}
               className="text-[10px] text-cyan-400 hover:text-white font-black uppercase tracking-widest underline decoration-2 underline-offset-4"
             >
               Privacy Protocol
             </button>
             <button 
               onClick={onViewTerms}
               className="text-[10px] text-cyan-400 hover:text-white font-black uppercase tracking-widest underline decoration-2 underline-offset-4"
             >
               Service Terms
             </button>
           </div>
           <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.5em]">
             THE SECRET LIFE ENGINE v3.4.0 • BUILT FOR HEROES
           </p>
        </div>
      </div>
    </div>
  );
};
