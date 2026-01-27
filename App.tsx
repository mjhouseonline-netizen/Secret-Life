
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ApiKeyGuard } from './components/ApiKeyGuard';
import { Auth } from './components/Auth';
import { PosterGenerator } from './components/PosterGenerator';
import { ComicGenerator } from './components/ComicGenerator';
import { BookGenerator } from './components/BookGenerator';
import { VideoGenerator } from './components/VideoGenerator';
import { ClipStitcher } from './components/ClipStitcher';
import { EditStudio } from './components/EditStudio';
import { IntelligenceStudio } from './components/IntelligenceStudio';
import { LiveStudio } from './components/LiveStudio';
import { VoiceStudio } from './components/VoiceStudio';
import { AIAvatar } from './components/AIAvatar';
import { DistributionStudio } from './components/DistributionStudio';
import { SettingsStudio } from './components/SettingsStudio';
import { PerformanceAnalytics } from './components/PerformanceAnalytics';
import { AppView, GeneratedContent, User, PosterTemplate, UserSettings } from './types';
import { CloudService } from './services/cloud';

const CREDIT_COSTS: Record<string, number> = {
  poster: 5,
  comic: 10,
  book: 12,
  video: 20,
  stitcher: 15,
  edit: 2,
  analyze: 2,
  speech: 1,
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('poster');
  const [history, setHistory] = useState<GeneratedContent[]>([]);
  const [selectedForVideo, setSelectedForVideo] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeDraft, setActiveDraft] = useState<PosterTemplate | null>(null);
  const [syncingCount, setSyncingCount] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('cinepet_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const savedHistory = localStorage.getItem('cinepet_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('cinepet_current_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cinepet_current_user');
    setActiveView('poster');
  };

  const handleDeleteAccount = () => {
    localStorage.removeItem('cinepet_history');
    localStorage.removeItem('cinepet_poster_templates');
    localStorage.removeItem('cinepet_voice_clones');
    handleLogout();
  };

  const handleUpdateSettings = (settings: UserSettings) => {
    if (!user) return;
    const updatedUser = { ...user, settings };
    updateUserState(updatedUser);
  };

  const deductCredits = (amount: number): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    if (user.credits < amount) {
      alert(`BUDGET CONSTRAINT: This production requires ${amount} credits. Please top up in the studio store.`);
      return false;
    }

    const updatedUser = { ...user, credits: user.credits - amount };
    updateUserState(updatedUser);
    return true;
  };

  const handleAddCredits = (credits: number) => {
    if (!user) return;
    const updatedUser = { ...user, credits: user.credits + credits };
    updateUserState(updatedUser);
    alert(`BUDGET SECURED: ${credits} production credits added.`);
  };

  const updateUserState = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('cinepet_current_user', JSON.stringify(updatedUser));
  };

  // Cloud Sync Handler
  const syncToCloud = async (content: GeneratedContent) => {
    if (!user || user.cloudProvider === 'none') return;
    
    setSyncingCount(prev => prev + 1);
    try {
      let cloudUrl = '';
      if (user.cloudProvider === 'google' && user.cloudAccessToken) {
        const mimeType = content.type === 'video' ? 'video/mp4' : 'image/png';
        cloudUrl = await CloudService.uploadToGoogleDrive(
          user.cloudAccessToken,
          content.url,
          `SecretLife_${content.type}_${content.id}.png`,
          mimeType
        );
      } else if (user.cloudProvider === 'icloud') {
        cloudUrl = await CloudService.uploadToICloud(`SecretLife_${content.type}_${content.id}.png`);
      }

      setHistory(prev => {
        const updated = prev.map(item => 
          item.id === content.id ? { ...item, cloudSynced: true, cloudUrl } : item
        );
        localStorage.setItem('cinepet_history', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Cloud Sync Failed:', error);
    } finally {
      setSyncingCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleNewContent = (content: GeneratedContent, skipSwitch = false) => {
    const cost = CREDIT_COSTS[content.type] || 0;
    if (deductCredits(cost)) {
      const newContent = { ...content, cloudSynced: false };
      setHistory(prev => {
        const updated = [newContent, ...prev];
        localStorage.setItem('cinepet_history', JSON.stringify(updated));
        return updated;
      });
      
      // Auto-sync to cloud if enabled
      if (user?.settings?.autoCloudSync || user?.cloudProvider !== 'none') {
        syncToCloud(newContent);
      }

      if (!skipSwitch) {
        setActiveView('history');
      }
    }
  };

  const startAnimation = (id: string) => {
    setSelectedForVideo(id);
    setActiveView('video');
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderContent = () => {
    const imagesOnly = history.filter(i => i.type !== 'video' && i.type !== 'speech' && i.type !== 'book');
    const videosOnly = history.filter(i => i.type === 'video' && i.metadata?.videoMeta);
    const bookAssets = history.filter(i => i.type === 'comic' || i.type === 'poster');

    switch (activeView) {
      case 'poster':
        return <PosterGenerator onGenerated={handleNewContent} initialData={activeDraft} onClearDraft={() => setActiveDraft(null)} />;
      case 'comic':
        return (
          <ComicGenerator 
            onGenerated={(content) => handleNewContent(content, true)} 
            onAnimate={startAnimation}
            availableCharacters={history.filter(i => i.type === 'poster')}
          />
        );
      case 'book':
        return (
          <BookGenerator 
            onGenerated={handleNewContent}
            availableAssets={bookAssets}
          />
        );
      case 'video':
        return (
          <VideoGenerator 
            onGenerated={handleNewContent} 
            availableImages={imagesOnly} 
            initialSelectedId={selectedForVideo}
          />
        );
      case 'stitcher':
        return (
          <ClipStitcher 
            onGenerated={handleNewContent} 
            availableVideos={videosOnly}
            availableImages={imagesOnly}
          />
        );
      case 'edit':
        return <EditStudio onGenerated={handleNewContent} availableImages={imagesOnly} />;
      case 'analyze':
        return <IntelligenceStudio />;
      case 'live':
        return <LiveStudio />;
      case 'speech':
        return <VoiceStudio />;
      case 'distribution':
        return <DistributionStudio />;
      case 'settings':
        return (
          <SettingsStudio 
            user={user} 
            onUpdateSettings={handleUpdateSettings} 
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
          />
        );
      case 'analytics':
        return user.role === 'admin' ? <PerformanceAnalytics /> : <PosterGenerator onGenerated={handleNewContent} initialData={activeDraft} onClearDraft={() => setActiveDraft(null)} />;
      case 'history':
        return (
          <div className="space-y-10 pb-20">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-4xl font-bold mb-2 tracking-tight text-white font-cinematic uppercase tracking-widest">Library</h2>
                  <p className="text-zinc-500 text-xs uppercase font-bold">Production archives.</p>
                </div>
                {syncingCount > 0 && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase animate-pulse">
                    SYNCING {syncingCount} ITEMS
                  </div>
                )}
              </div>
              <button 
                onClick={() => {
                  if(confirm('Clear all archives?')) {
                    setHistory([]);
                    localStorage.removeItem('cinepet_history');
                  }
                }}
                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/10 border-2 border-dashed border-zinc-800/50 rounded-[2.5rem]">
                <h3 className="text-xl font-black mb-2 text-white uppercase tracking-widest">Archives Empty</h3>
                <p className="text-zinc-500 text-xs mb-8 uppercase font-bold">Ready to start the next production?</p>
                <button 
                  onClick={() => setActiveView('poster')}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/10"
                >
                  Create New Poster
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {history.map((item) => (
                  <div key={item.id} className="group bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-3xl overflow-hidden flex flex-col transition-all hover:border-zinc-600 shadow-sm relative">
                    <div className="aspect-[4/5] bg-black relative overflow-hidden">
                      {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover" controls playsInline />
                      ) : (
                        <img src={item.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      )}
                      <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-zinc-300">
                          {item.type}
                        </span>
                        {item.cloudSynced && (
                          <span className="px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider bg-green-500/40 backdrop-blur-md border border-green-500/20 text-white">
                            CLOUD
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] md:text-xs font-medium text-zinc-400 line-clamp-2 leading-relaxed italic mb-3">
                          "{item.prompt}"
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                        <span className="text-[8px] md:text-[10px] font-bold text-zinc-600 uppercase">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                           {item.cloudUrl && (
                             <a href={item.cloudUrl} target="_blank" className="text-[8px] font-black uppercase text-indigo-400 hover:underline">
                               VIEW
                             </a>
                           )}
                           <button 
                            onClick={async () => {
                               try {
                                 const res = await fetch(item.url);
                                 // Cast to any to fix environments where res.blob() returns Promise<unknown>
                                 const blob: any = await res.blob();
                                 const file = new File([blob], `secretlife-${item.id}.png`, { type: blob.type });
                                 if (navigator.share) {
                                   await navigator.share({
                                     files: [file],
                                     title: 'My Secret Life Masterpiece',
                                     text: item.prompt
                                   });
                                 }
                               } catch (e) {
                                 const a = document.createElement('a');
                                 a.href = item.url;
                                 a.download = `secretlife-${item.id}`;
                                 a.click();
                               }
                            }}
                            className="text-[8px] font-black uppercase text-zinc-500 hover:text-white"
                          >
                            SHARE
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ApiKeyGuard>
      <Layout 
        activeView={activeView} 
        setActiveView={setActiveView} 
        user={user} 
        onLogout={handleLogout}
        onAddCredits={handleAddCredits}
      >
        {renderContent()}
      </Layout>
      <AIAvatar activeView={activeView} history={history} />
    </ApiKeyGuard>
  );
};

export default App;
