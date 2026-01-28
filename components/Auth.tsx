
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { CloudService } from '../services/cloud';
import { firebaseService } from '../services/firebase';

interface AuthProps {
  onLogin: (user: User) => void;
}

const ADMIN_EMAIL = 'bubblesfox@gmail.com';

// Action-packed pet images with comic-book filters
const ACTION_PANELS = [
  { 
    id: 1,
    img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800', 
    caption: 'THE CHASE IS ON!', 
    color: 'bg-orange-500', 
    rotate: '-3deg', 
    pos: 'top-[5%] left-[-5%]', 
    size: 'w-64 md:w-80',
    shout: 'ZOOM!' 
  },
  { 
    id: 2,
    img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800', 
    caption: 'MIDNIGHT PROWLER', 
    color: 'bg-fuchsia-600', 
    rotate: '4deg', 
    pos: 'top-[15%] right-[-8%]', 
    size: 'w-72 md:w-96',
    shout: 'PURR...' 
  },
  { 
    id: 3,
    img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800', 
    caption: 'AGENT BARK', 
    color: 'bg-lime-500', 
    rotate: '-6deg', 
    pos: 'bottom-[10%] left-[-2%]', 
    size: 'w-60 md:w-72',
    shout: 'WOOF!' 
  },
  { 
    id: 4,
    img: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=800', 
    caption: 'SKY PILOT', 
    color: 'bg-cyan-500', 
    rotate: '5deg', 
    pos: 'bottom-[-5%] right-[5%]', 
    size: 'w-64 md:w-80',
    shout: 'SOAR!' 
  },
];

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    // Initialize Firebase
    const ready = firebaseService.init();
    setIsFirebaseReady(ready);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('MISSING INTEL!');
      return;
    }

    // Use Firebase if configured and username looks like email
    if (isFirebaseReady && username.includes('@')) {
      try {
        let user: User;
        if (isLogin) {
          user = await firebaseService.signInWithEmail(username, password);
        } else {
          const displayName = username.split('@')[0];
          user = await firebaseService.signUpWithEmail(username, password, displayName);
        }
        onLogin(user);
        return;
      } catch (err: any) {
        // Map Firebase errors to friendly messages
        const errorCode = err.code || '';
        if (errorCode.includes('user-not-found') || errorCode.includes('wrong-password')) {
          setError('ACCESS DENIED!');
        } else if (errorCode.includes('email-already-in-use')) {
          setError('AGENT EXISTS!');
        } else if (errorCode.includes('weak-password')) {
          setError('PASSWORD TOO WEAK!');
        } else if (errorCode.includes('invalid-email')) {
          setError('INVALID EMAIL!');
        } else {
          setError(err.message?.toUpperCase() || 'AUTH FAILED!');
        }
        return;
      }
    }

    // Fallback to localStorage for non-email usernames or when Firebase not configured
    const usersJson = localStorage.getItem('cinepet_users');
    const users: any[] = usersJson ? JSON.parse(usersJson) : [];

    if (isLogin) {
      const user = users.find(u =>
        (u.username?.toLowerCase() === username.toLowerCase() || u.email?.toLowerCase() === username.toLowerCase()) &&
        u.password === password
      );

      if (user) {
        const role = user.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : user.role || 'user';
        onLogin({
          id: user.id,
          username: user.username,
          email: user.email,
          role: role as any,
          credits: role === 'admin' ? 999999 : user.credits,
          cloudProvider: user.cloudProvider || 'none'
        });
      } else {
        setError('ACCESS DENIED!');
      }
    } else {
      const existingUser = users.find(u =>
        u.username?.toLowerCase() === username.toLowerCase() ||
        (u.email && u.email.toLowerCase() === username.toLowerCase())
      );

      if (existingUser) {
        setError('AGENT EXISTS!');
        return;
      }

      const isNewAdmin = username.toLowerCase() === ADMIN_EMAIL;
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        username: isNewAdmin ? 'Bubbles Fox' : username,
        email: isNewAdmin ? ADMIN_EMAIL : (username.includes('@') ? username : ''),
        password,
        role: isNewAdmin ? 'admin' : 'user',
        credits: isNewAdmin ? 999999 : 50,
        cloudProvider: 'none'
      };

      localStorage.setItem('cinepet_users', JSON.stringify([...users, newUser]));
      onLogin({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role as any,
        credits: newUser.credits,
        cloudProvider: 'none'
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      // Use Firebase Auth if configured
      if (isFirebaseReady) {
        const user = await firebaseService.signInWithGoogle();
        onLogin(user);
        return;
      }

      // Fallback to custom OAuth flow
      if (!CloudService.isGoogleConfigured()) {
        setError('GOOGLE NOT CONFIGURED');
        setIsGoogleLoading(false);
        return;
      }

      const authResult = await CloudService.initiateGoogleOAuth();

      const usersJson = localStorage.getItem('cinepet_users');
      const users: any[] = usersJson ? JSON.parse(usersJson) : [];
      const existingUser = users.find(u => u.email?.toLowerCase() === authResult.user.email.toLowerCase());
      const isAdmin = authResult.user.email.toLowerCase() === ADMIN_EMAIL;

      if (existingUser) {
        const updatedUser = {
          ...existingUser,
          cloudProvider: 'google',
          cloudAccessToken: authResult.accessToken,
          cloudTokenExpiry: authResult.expiresAt,
          avatarUrl: authResult.user.picture || existingUser.avatarUrl
        };
        const updatedUsers = users.map(u => u.id === existingUser.id ? updatedUser : u);
        localStorage.setItem('cinepet_users', JSON.stringify(updatedUsers));

        onLogin({
          id: existingUser.id,
          username: existingUser.username,
          email: authResult.user.email,
          role: isAdmin ? 'admin' : existingUser.role,
          credits: isAdmin ? 999999 : existingUser.credits,
          cloudProvider: 'google',
          cloudAccessToken: authResult.accessToken,
          avatarUrl: authResult.user.picture
        });
      } else {
        const newUser = {
          id: 'google-' + authResult.user.id,
          username: authResult.user.name || 'Studio Director',
          email: authResult.user.email,
          role: isAdmin ? 'admin' : 'user',
          credits: isAdmin ? 999999 : 100,
          cloudProvider: 'google',
          cloudAccessToken: authResult.accessToken,
          cloudTokenExpiry: authResult.expiresAt,
          avatarUrl: authResult.user.picture
        };

        localStorage.setItem('cinepet_users', JSON.stringify([...users, newUser]));

        onLogin({
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role as any,
          credits: newUser.credits,
          cloudProvider: 'google',
          cloudAccessToken: authResult.accessToken,
          avatarUrl: newUser.avatarUrl
        });
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      setError(err instanceof Error ? err.message.toUpperCase() : 'GOOGLE SIGN-IN FAILED');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    setError('');

    try {
      // Use Firebase Auth for Apple Sign-In
      if (isFirebaseReady) {
        const user = await firebaseService.signInWithApple();
        onLogin(user);
        return;
      }

      // Fallback to local user with iCloud share sheet
      const newUser = {
        id: 'apple-' + Math.random().toString(36).substr(2, 9),
        username: 'Creative Director',
        email: '',
        role: 'user' as const,
        credits: 100,
        cloudProvider: 'icloud' as const
      };
      const usersJson = localStorage.getItem('cinepet_users');
      const users: any[] = usersJson ? JSON.parse(usersJson) : [];
      localStorage.setItem('cinepet_users', JSON.stringify([...users, newUser]));
      onLogin(newUser);
    } catch (err) {
      console.error('Apple Sign-In Error:', err);
      setError(err instanceof Error ? err.message.toUpperCase() : 'APPLE SIGN-IN FAILED');
    } finally {
      setIsAppleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4 md:p-12 relative overflow-hidden">
      {/* Pop Art Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
           style={{
             backgroundImage: 'radial-gradient(circle, #ffffff 4px, transparent 4.5px)',
             backgroundSize: '24px 24px'
           }}>
      </div>
      
      {/* Dynamic Sunburst */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] animate-[spin_60s_linear_infinite] opacity-10 pointer-events-none">
         <div className="w-full h-full" style={{
           background: 'conic-gradient(from 0deg, #fff 0deg 10deg, transparent 10deg 20deg, #fff 20deg 30deg, transparent 30deg 40deg, #fff 40deg 50deg, transparent 50deg 60deg, #fff 60deg 70deg, transparent 70deg 80deg, #fff 80deg 90deg, transparent 90deg 100deg, #fff 100deg 110deg, transparent 110deg 120deg)'
         }}></div>
      </div>

      {/* Comic Panels Floating */}
      {ACTION_PANELS.map((panel, idx) => (
        <div 
          key={panel.id}
          className={`absolute ${panel.pos} ${panel.size} hidden md:flex flex-col border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] bg-white transform hover:scale-105 transition-transform duration-300 z-10`}
          style={{ transform: `rotate(${panel.rotate})` }}
        >
          <div className="relative aspect-square overflow-hidden border-b-4 border-black group">
            <img src={panel.img} className="w-full h-full object-cover filter contrast-125 saturate-150 group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute top-0 left-0 bg-black/20 inset-0 pointer-events-none mix-blend-hard-light"></div>
            {/* Comic Speech Bubble */}
            <div className="absolute -top-4 -right-4 bg-white border-4 border-black px-4 py-2 rounded-[50%] rounded-bl-none shadow-[4px_4px_0px_0px_#000] z-20">
              <span className="font-comic text-xl text-black uppercase">{panel.shout}</span>
            </div>
          </div>
          <div className={`${panel.color} p-3`}>
             <p className="font-comic text-white text-xl tracking-wider uppercase stroke-black-thin drop-shadow-md text-center">{panel.caption}</p>
          </div>
        </div>
      ))}

      {/* Main Login Card - The "Cover Issue" */}
      <div className="max-w-md w-full relative z-20 mx-auto">
        
        {/* Logo Section */}
        <div className="text-center mb-8 relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/20 rounded-full blur-3xl -z-10"></div>
           <h1 className="text-[60px] md:text-[85px] font-comic text-white stroke-black-bold drop-shadow-[8px_8px_0px_#000] leading-none tracking-tighter transform -rotate-2 hover:rotate-2 transition-transform cursor-default select-none">
             SECRET LIFE!
           </h1>
           <div className="inline-block bg-orange-500 border-4 border-black px-6 py-1 transform rotate-2 mt-2 shadow-[6px_6px_0px_0px_#000]">
             <span className="text-black font-black text-xs md:text-sm uppercase tracking-[0.3em]">Issue #1: Origin Story</span>
           </div>
        </div>

        {/* Login Box */}
        <div className="bg-white border-[6px] border-black p-8 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.8)] relative transform rotate-1">
          {/* Decorative Corner Tape */}
          <div className="absolute -top-3 -left-3 w-12 h-12 bg-lime-400 border-4 border-black z-30"></div>
          <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-fuchsia-500 border-4 border-black z-30"></div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-comic text-black uppercase mb-1">
              {isLogin ? 'Welcome Back!' : 'Join The Squad!'}
            </h2>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {isLogin ? 'Resume your creative mission' : 'Start your hero journey today'}
            </p>
          </div>

          <div className="flex gap-3 mb-6">
            <button 
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="flex-1 py-3 bg-white hover:bg-zinc-50 text-black border-4 border-black font-comic text-sm uppercase shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 group"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="G" />
              {isGoogleLoading ? 'LINKING...' : 'GOOGLE'}
            </button>
            <button
              onClick={handleAppleSignIn}
              disabled={isAppleLoading}
              className="flex-1 py-3 bg-black text-white border-4 border-black font-comic text-sm uppercase shadow-[4px_4px_0px_0px_#888] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50"
            >
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
               </svg>
               {isAppleLoading ? 'LINKING...' : 'APPLE'}
            </button>
          </div>

          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 h-1 bg-black/10"></div>
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-white px-2">OR USE CREDENTIALS</span>
            <div className="flex-1 h-1 bg-black/10"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="CODENAME"
                className="w-full bg-blue-50 border-4 border-black p-4 text-black font-bold outline-none placeholder:text-blue-300 focus:bg-white focus:border-blue-500 transition-all uppercase"
              />
              <div className="absolute top-0 right-0 h-full w-2 bg-black/10 group-focus-within:bg-blue-500/20"></div>
            </div>
            
            <div className="relative group">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="SECRET KEY"
                className="w-full bg-blue-50 border-4 border-black p-4 text-black font-bold outline-none placeholder:text-blue-300 focus:bg-white focus:border-blue-500 transition-all"
              />
              <div className="absolute top-0 right-0 h-full w-2 bg-black/10 group-focus-within:bg-blue-500/20"></div>
            </div>

            {error && (
               <div className="bg-red-500 text-white border-4 border-black p-3 text-center text-xs font-black uppercase shadow-[4px_4px_0px_0px_#000] animate-bounce">
                 ⚠️ {error}
               </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-lime-400 hover:bg-lime-300 text-black border-4 border-black font-comic text-3xl uppercase shadow-[8px_8px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 transition-all active:bg-orange-500 active:text-white mt-4 relative overflow-hidden group"
            >
              <span className="relative z-10">{isLogin ? 'ENTER STUDIO' : 'CREATE HERO'}</span>
              <div className="absolute inset-0 bg-white/30 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-zinc-500 font-black uppercase hover:text-blue-600 transition-colors underline decoration-4 decoration-blue-200 hover:decoration-blue-600 underline-offset-4"
            >
              {isLogin ? "Need a clearance badge? Sign Up" : "Already an agent? Log In"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .stroke-black-bold { -webkit-text-stroke: 3px black; }
        .stroke-black-thin { -webkit-text-stroke: 1px black; }
        .halftone-dot {
          background-image: radial-gradient(circle, #000 1px, transparent 1.5px);
          background-size: 8px 8px;
        }
      `}</style>
    </div>
  );
};
