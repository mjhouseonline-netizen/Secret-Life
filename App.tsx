
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ApiKeyGuard } from './components/ApiKeyGuard';
import { Auth } from './components/Auth';
import { Home } from './components/Home';
import { PosterGenerator } from './components/PosterGenerator';
import { ComicGenerator } from './components/ComicGenerator';
import { BookGenerator } from './components/BookGenerator';
import { VideoGenerator } from './components/VideoGenerator';
import { VideoEditor } from './components/VideoEditor';
import { EditStudio } from './components/EditStudio';
import { IntelligenceStudio } from './components/IntelligenceStudio';
import { AudioStudio } from './components/AudioStudio';
import { SettingsStudio } from './components/SettingsStudio';
import { CloudService } from './services/cloud';
import { AppView, GeneratedContent, User, UserSettings } from './types';

const MONTHLY_FREE_QUOTA = 100;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [history, setHistory] = useState<GeneratedContent[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [hasError, setHasError] = useState(false);
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null);

  const checkMonthlyReset = (currentUser: User): User => {
    if (currentUser.role === 'admin') return currentUser;
    const now = new Date();
    const lastResetDate = currentUser.lastCreditReset ? new Date(currentUser.lastCreditReset) : null;
    const isNewMonth = !lastResetDate || 
      now.getMonth() !== lastResetDate.getMonth() || 
      now.getFullYear() !== lastResetDate.getFullYear();

    if (isNewMonth) {
      return {
        ...currentUser,
        credits: MONTHLY_FREE_QUOTA,
        lastCreditReset: now.getTime()
      };
    }
    return currentUser;
  };

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('cinepet_current_user');
      if (savedUser && savedUser !== 'undefined') {
        const parsed = JSON.parse(savedUser);
        if (parsed?.username) {
          const processed = checkMonthlyReset(parsed);
          setUser(processed);
        }
      }
      const savedHistory = localStorage.getItem('cinepet_history');
      if (savedHistory && savedHistory !== 'undefined') {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch (e) {
      localStorage.clear();
    }
  }, []);

  const handleLogin = (u: User) => {
    const processed = checkMonthlyReset(u);
    setUser(processed);
    localStorage.setItem('cinepet_current_user', JSON.stringify(processed));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cinepet_current_user');
    setActiveView('home');
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    if (!user) return;
    const updatedUser = { ...user, settings: newSettings };
    setUser(updatedUser);
    localStorage.setItem('cinepet_current_user', JSON.stringify(updatedUser));
  };

  const handleCloudAuth = (accessToken: string) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      cloudAccessToken: accessToken,
      settings: { ...(user.settings || { safeMode: true, hdByDefault: false, autoCloudSync: false }), autoCloudSync: true }
    };
    setUser(updatedUser);
    localStorage.setItem('cinepet_current_user', JSON.stringify(updatedUser));
  };

  const handleNewContent = (content: GeneratedContent) => {
    if (user && user.role !== 'admin' && user.credits < 5) {
      alert("CREDIT EXHAUSTION!");
      return;
    }
    const updatedHistory = [content, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('cinepet_history', JSON.stringify(updatedHistory));

    if (user && user.role !== 'admin') {
      const updatedUser = { ...user, credits: Math.max(0, user.credits - 5) };
      setUser(updatedUser);
      localStorage.setItem('cinepet_current_user', JSON.stringify(updatedUser));
    }

    if (user?.settings?.autoCloudSync && user.cloudAccessToken && content.url) {
      const mimeType = content.type === 'video' ? 'video/mp4' : 'image/png';
      const ext = content.type === 'video' ? 'mp4' : 'png';
      const fileName = `cinepet_${content.type}_${content.id}.${ext}`;
      CloudService.uploadToGoogleDrive(user.cloudAccessToken, content.url, fileName, mimeType)
        .catch(() => { /* sync is best-effort; token may have expired */ });
    }

    setActiveView('history');
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-comic text-white mb-4 uppercase">Synthesis Failed</h1>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-blue-600 text-white font-black uppercase rounded-xl">Reboot Studio</button>
      </div>
    );
  }

  if (!user) return <Auth onLogin={handleLogin} />;

  const renderContent = () => {
    const imagesOnly = history.filter(i => i.type !== 'video' && i.type !== 'book');
    const videosOnly = history.filter(i => i.type === 'video');
    const bookAssets = history.filter(i => i.type === 'comic' || i.type === 'poster');

    switch (activeView) {
      case 'home': return <Home user={user} history={history} setActiveView={setActiveView} />;
      case 'poster': return <PosterGenerator onGenerated={handleNewContent} />;
      case 'comic': return <ComicGenerator 
        onGenerated={handleNewContent} 
        onAnimate={(id) => {
          setPendingVideoId(id);
          setActiveView('video');
        }} 
        availableCharacters={history.filter(i => i.type === 'poster')} 
      />;
      case 'book': return <BookGenerator onGenerated={handleNewContent} availableAssets={bookAssets} />;
      case 'video': return <VideoGenerator 
        onGenerated={handleNewContent} 
        availableImages={imagesOnly} 
        initialSelectedId={pendingVideoId} 
      />;
      case 'video-editor': return <VideoEditor onGenerated={handleNewContent} availableVideos={videosOnly} availableImages={imagesOnly} />;
      case 'edit': return <EditStudio onGenerated={handleNewContent} availableImages={imagesOnly} />;
      case 'analyze': return <IntelligenceStudio />;
      case 'live':
      case 'speech': return <AudioStudio />;
      case 'settings': return (
        <SettingsStudio
          user={user}
          onUpdateSettings={handleUpdateSettings}
          onCloudAuth={handleCloudAuth}
          onLogout={handleLogout}
          onDeleteAccount={() => {
            localStorage.clear();
            window.location.reload();
          }}
          onViewPrivacy={() => setActiveView('privacy')}
          onViewTerms={() => setActiveView('terms')}
        />
      );
      case 'history': return (
          <div className="space-y-8 pb-24">
            <h2 className="text-5xl font-comic uppercase text-white stroke-black-bold drop-shadow-[4px_4px_0px_#000]">ARCHIVES</h2>
            {history.length === 0 ? (
              <div className="py-20 text-center border-4 border-dashed border-white/10 rounded-[3rem]">
                <p className="text-white/20 font-black uppercase text-xs tracking-widest">No productions in the archive yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {history.map(item => (
                  <div key={item.id} className="bg-white border-4 border-black p-1 shadow-[8px_8px_0px_#000] hover:scale-105 transition-all">
                    <div className="aspect-[4/5] bg-zinc-100 overflow-hidden">
                      {item.type === 'video' ? <video src={item.url} className="w-full h-full object-cover" controls /> : <img src={item.url} className="w-full h-full object-cover" />}
                    </div>
                    <p className="p-2 text-[8px] font-black text-black uppercase truncate">{item.prompt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default: return <Home user={user} history={history} setActiveView={setActiveView} />;
    }
  };

  return (
    <ApiKeyGuard>
      <Layout activeView={activeView} setActiveView={setActiveView} user={user} onLogout={handleLogout} onAddCredits={(c) => {
        if (user) {
          const updated = {...user, credits: user.credits + c};
          setUser(updated);
          localStorage.setItem('cinepet_current_user', JSON.stringify(updated));
        }
      }}>
        {renderContent()}
      </Layout>
    </ApiKeyGuard>
  );
};

export default App;
