import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';

// Show the Tauri window once the boot splash has painted.
// The window starts hidden (visible: false in tauri.conf.json) to prevent white flash.
async function showTauriWindow() {
  try {
    if (window.__TAURI_INTERNALS__) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.show();
    }
  } catch (e) {
    // Not in Tauri (browser dev), ignore
  }
}

// Auto-recover from stale chunk 404s after new Vercel deployments
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </HashRouter>
  </React.StrictMode>
);

requestAnimationFrame(() => {
  showTauriWindow();
});
