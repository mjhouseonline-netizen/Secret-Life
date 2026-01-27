
import React, { useState } from 'react';
import { User, UserSettings } from '../types';
import { CloudService } from '../services/cloud';

interface SettingsStudioProps {
  user: User;
  onUpdateSettings: (settings: UserSettings) => void;
  onUpdateCloudProvider: (provider: 'google' | 'icloud' | 'none', accessToken?: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export const SettingsStudio: React.FC<SettingsStudioProps> = ({ user, onUpdateSettings, onUpdateCloudProvider, onLogout, onDeleteAccount }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [cloudError, setCloudError] = useState('');

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

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setCloudError('');

    try {
      if (!CloudService.isGoogleConfigured()) {
        setCloudError('Google Client ID not configured');
        return;
      }

      const authResult = await CloudService.initiateGoogleOAuth();
      onUpdateCloudProvider('google', authResult.accessToken);
    } catch (err) {
      setCloudError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectCloud = () => {
    CloudService.disconnectGoogleDrive();
    onUpdateCloudProvider('none');
  };

  const handleSetAppleCloud = () => {
    onUpdateCloudProvider('icloud');
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

        {/* Cloud Storage Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-zinc-800 bg-zinc-900/50">
             <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Cloud Storage</h3>
          </div>
          <div className="p-8 space-y-6">
            {/* Current Status */}
            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  user.cloudProvider === 'google' ? 'bg-blue-500/20 border border-blue-500/30' :
                  user.cloudProvider === 'icloud' ? 'bg-zinc-700/50 border border-zinc-600' :
                  'bg-zinc-800 border border-zinc-700'
                }`}>
                  {user.cloudProvider === 'google' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {user.cloudProvider === 'icloud' && (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                    </svg>
                  )}
                  {user.cloudProvider === 'none' && (
                    <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {user.cloudProvider === 'google' ? 'Google Drive Connected' :
                     user.cloudProvider === 'icloud' ? 'iCloud (via Share Sheet)' :
                     'No Cloud Storage'}
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">
                    {user.cloudProvider === 'google' ? 'Files saved to CinePet Studio folder' :
                     user.cloudProvider === 'icloud' ? 'Use Share button to save to Files app' :
                     'Content stored locally only'}
                  </p>
                </div>
              </div>
              {user.cloudProvider !== 'none' && (
                <button
                  onClick={handleDisconnectCloud}
                  className="px-3 py-1.5 text-[10px] font-black uppercase text-red-400 hover:text-red-300 border border-red-900/30 rounded-lg hover:bg-red-900/20 transition-all"
                >
                  Disconnect
                </button>
              )}
            </div>

            {cloudError && (
              <div className="p-3 bg-red-900/20 border border-red-900/30 rounded-xl text-red-400 text-xs font-bold text-center">
                {cloudError}
              </div>
            )}

            {/* Connect Options */}
            {user.cloudProvider === 'none' && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleConnectGoogle}
                  disabled={isConnecting || !CloudService.isGoogleConfigured()}
                  className="p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-blue-500/30 rounded-2xl transition-all flex flex-col items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white">Google Drive</p>
                    <p className="text-[9px] text-zinc-500 uppercase">
                      {CloudService.isGoogleConfigured() ? 'Auto-sync enabled' : 'Not configured'}
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleSetAppleCloud}
                  className="p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl transition-all flex flex-col items-center gap-3 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white">iCloud Drive</p>
                    <p className="text-[9px] text-zinc-500 uppercase">Via Share Sheet</p>
                  </div>
                </button>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
              <p className="text-[10px] text-indigo-300/80 leading-relaxed">
                {user.cloudProvider === 'google'
                  ? 'Your creations are automatically uploaded to your Google Drive in the "CinePet Studio" folder. Files are made shareable with anyone who has the link.'
                  : user.cloudProvider === 'icloud'
                  ? 'Tap the SHARE button on any creation to save it to your iCloud Drive via the iOS/macOS Files app. This works on all Apple devices.'
                  : 'Connect a cloud service to back up your creations. Google Drive offers automatic sync, while iCloud works through the native Share Sheet on Apple devices.'}
              </p>
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
