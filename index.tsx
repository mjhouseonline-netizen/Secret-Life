
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * GLOBAL SAFETY POLYFILL
 * Prevents "ReferenceError: process is not defined" which causes the black screen.
 */
if (typeof window !== 'undefined' && typeof (window as any).process === 'undefined') {
  (window as any).process = {
    env: {
      API_KEY: '' // Will be populated by the environment injector
    }
  };
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("FATAL: DOM Root not found. The application cannot start.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("CINEPET STUDIO: Core Engine Synchronized.");
  } catch (err) {
    console.error("CINEPET STUDIO: Initial Synthesis Failed.", err);
    // Fallback UI in case of catastrophic mount failure
    rootElement.innerHTML = `
      <div style="background:#09090b; color:#71717a; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding:20px;">
        <h1 style="color:white; font-size:24px; margin-bottom:10px;">STUDIO SYNTHESIS ERROR</h1>
        <p style="font-size:12px; margin-bottom:20px;">The production engine failed to synchronize. This usually happens due to a network timeout or browser restriction.</p>
        <button onclick="window.location.reload()" style="background:#0891b2; color:white; border:none; padding:12px 24px; border-radius:12px; font-weight:bold; cursor:pointer;">REBOOT ENGINE</button>
      </div>
    `;
  }
}
