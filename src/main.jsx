import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { initSentry, setUser } from './utils/sentry';
import { startHealthChecks } from './utils/appHealthMonitor';
import { systemLogger, appLogger } from './utils/logger';

// Initialize Sentry (error tracking)
initSentry().then(() => {
  systemLogger.info('Sentry initialized');
});

// Initialize health monitoring
startHealthChecks();
systemLogger.info('Health monitoring started');

// Track page loads
const pageLoadStart = performance.now();
window.addEventListener('load', () => {
  const loadTime = performance.now() - pageLoadStart;
  systemLogger.info('Page loaded', { loadTime: `${loadTime.toFixed(0)}ms` });
});

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

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

requestAnimationFrame(() => {
  showTauriWindow();
});
