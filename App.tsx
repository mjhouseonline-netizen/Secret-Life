
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ApiKeyGuard } from './components/ApiKeyGuard';
import { Auth } from './components/Auth';
import { Home } from './components/Home';
import { PosterGenerator } from './components/PosterGenerator';
import { ComicGenerator } from './components/ComicGenerator';
import { BookGenerator } from './components/BookGenerator';
import { VideoGenerator } from './components/VideoGenerator';
import { AppView, GeneratedContent, User, UserSettings } from './types';

const MONTHLY_FREE_QUOTA = 100;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [history, setHistory] = useState<GeneratedContent[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [hasError, setHasError] = useState(false);

  // LOGIC: Ensure free credits do not roll over. 
  const checkMonthlyReset = (currentUser: User): User => {
    if (currentUser.role === 'admin') return currentUser;

    const now = new Date();
    const lastResetDate = currentUser.lastCreditReset ? new Date(currentUser.lastCreditReset) : null;

    const isNewMonth = !lastResetDate || 
      now.getMonth() !== lastResetDate.getMonth() || 
      now.getFullYear() !== lastResetDate.getFullYear();

    if (isNewMonth) {
      console.log("CINEPET STUDIO: New Production Cycle Detected. Resetting Monthly Quota.");
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
          if (processed.credits !== parsed.credits) {
            localStorage.setItem('cinepet_current_user', JSON.stringify(processed));
          }
        }
      }
      const savedHistory = localStorage.getItem('cinepet_history');
      if (savedHistory && savedHistory !== 'undefined') {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch (e) {
      console.warn("Storage Cleanup: Corrupted data purged.");
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
    const bookAssets = history.filter(i => i.type === 'comic' || i.type === 'poster');

    switch (activeView) {
      case 'home': return <Home user={user} history={history} setActiveView={setActiveView} />;
      case 'poster': return <PosterGenerator onGenerated={handleNewContent} />;
      case 'comic': return <ComicGenerator onGenerated={handleNewContent} onAnimate={() => setActiveView('video')} availableCharacters={history.filter(i => i.type === 'poster')} />;
      case 'book': return <BookGenerator onGenerated={handleNewContent} availableAssets={bookAssets} />;
      case 'video': return <VideoGenerator onGenerated={handleNewContent} availableImages={imagesOnly} />;
      case 'history': return (
          <div className="space-y-8 pb-24">
            <h2 className="text-4xl font-comic uppercase text-white">Archives</h2>
            {history.length === 0 ? (
              <div className="py-20 text-center border-4 border-dashed border-zinc-900 rounded-[3rem]">
                <p className="text-zinc-600 font-black uppercase text-xs">No productions in the archive yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {history.map(item => (
                  <div key={item.id} className="bg-zinc-900 border-4 border-black p-1 shadow-[6px_6px_0px_#000] hover:scale-105 transition-all">
                    {item.type === 'video' ? <video src={item.url} className="w-full aspect-[4/5] object-cover" controls /> : <img src={item.url} className="w-full aspect-[4/5] object-cover" />}
                    <p className="p-2 text-[8px] font-bold text-zinc-500 uppercase truncate">{item.prompt}</p>
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
