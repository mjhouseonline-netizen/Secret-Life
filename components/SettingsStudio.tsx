
import React from 'react';
import { User, UserSettings } from '../types';

interface SettingsStudioProps {
  user: User;
  onUpdateSettings: (settings: UserSettings) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export const SettingsStudio: React.FC<SettingsStudioProps> = ({ user, onUpdateSettings, onLogout, onDeleteAccount }) => {
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

  return (
    <div className="space-y-10 pb-24">
      <div className="border-b border-zinc-800 pb-8">
        <h2 className="text-4xl font-bold mb-2 tracking-tight text-white font-cinematic uppercase tracking-widest">Production Settings</h2>
        <p className="text-zinc-400">Manage your cinematic identity and mobile safety preferences.</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-zinc-800 bg-zinc-900/50">
             <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Core Preferences</h3>
          </div>
          <div className="divide-y divide-zinc-800">
             <div className="p-8 flex items-center justify-between">
                <div>
                   <h4 className="text-sm font-bold text-white mb-1">Mobile Safe Mode</h4>
                   <p className="text-xs text-zinc-500">Strict PG filtering for all AI-generated content (Recommended for App Store).</p>
                </div>
                <button 
                  onClick={() => toggleSetting('safeMode')}
                  className={`w-12 h-6 rounded-full transition-all relative ${currentSettings.safeMode ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currentSettings.safeMode ? 'left-7' : 'left-1'}`}></div>
                </button>
             </div>
             <div className="p-8 flex items-center justify-between">
                <div>
                   <h4 className="text-sm font-bold text-white mb-1">High-Fidelity Rendering</h4>
                   <p className="text-xs text-zinc-500">Always generate content in 2K/4K resolution by default.</p>
                </div>
                <button 
                  onClick={() => toggleSetting('hdByDefault')}
                  className={`w-12 h-6 rounded-full transition-all relative ${currentSettings.hdByDefault ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currentSettings.hdByDefault ? 'left-7' : 'left-1'}`}></div>
                </button>
             </div>
             <div className="p-8 flex items-center justify-between">
                <div>
                   <h4 className="text-sm font-bold text-white mb-1">Auto Cloud Sync</h4>
                   <p className="text-xs text-zinc-500">Automatically back up every production to Google Drive/iCloud.</p>
                </div>
                <button 
                  onClick={() => toggleSetting('autoCloudSync')}
                  className={`w-12 h-6 rounded-full transition-all relative ${currentSettings.autoCloudSync ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currentSettings.autoCloudSync ? 'left-7' : 'left-1'}`}></div>
                </button>
             </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-zinc-800 bg-zinc-900/50">
             <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Account Management</h3>
          </div>
          <div className="p-8 space-y-4">
             <div className="flex items-center gap-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center border border-indigo-500/20 overflow-hidden">
                   <img src={user.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/3011/3011270.png'} className="w-full h-full object-cover" />
                </div>
                <div>
                   <p className="text-sm font-bold text-white">{user.username}</p>
                   <p className="text-[10px] text-zinc-500 uppercase font-bold">{user.email || 'Director Level Account'}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={onLogout}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  🚪 Sign Out
                </button>
                <button 
                  onClick={() => { if(confirm('Delete all data permanently?')) onDeleteAccount(); }}
                  className="w-full py-4 bg-red-900/20 hover:bg-red-900/40 text-red-500 font-bold rounded-2xl border border-red-900/20 transition-all flex items-center justify-center gap-2"
                >
                  🗑️ Purge Data
                </button>
             </div>
          </div>
        </div>

        <div className="text-center">
           <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">The Secret Life Of Your Pet v3.4.0 • Mobile-Optimized Engine</p>
           <a href="#" className="text-[9px] text-indigo-500 hover:underline mt-2 inline-block font-bold">Privacy Policy & Terms</a>
        </div>
      </div>
    </div>
  );
};
