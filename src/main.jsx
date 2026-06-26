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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </HashRouter>
  </React.StrictMode>
);

// After React renders, wait for the browser to actually paint the first frame,
// then show the Tauri window (which reveals the boot splash, not a blank page)
// and schedule the splash fade-out.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    // 1. Show the Tauri window — at this point the boot splash is visible
    showTauriWindow();

    // 2. Fade out the boot splash after a short delay so user sees the splash briefly
    setTimeout(() => {
      const splash = document.getElementById('mavi-boot-splash');
      if (splash) {
        splash.classList.add('hidden');
        // Remove from DOM after the CSS transition completes (350ms)
        setTimeout(() => splash.remove(), 400);
      }
    }, 300);
  });
});
