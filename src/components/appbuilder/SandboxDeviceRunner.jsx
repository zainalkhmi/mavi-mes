import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react';
import { getFrontlineAppById, getAllFrontlineApps } from '../../utils/supabaseFrontlineDB';
import { MAVICORE_SDK_VIRTUAL_FILE, MAVICORE_BRIDGE_VIRTUAL_FILE, MAVICORE_UI_VIRTUAL_FILE } from '../../vibe/sdk';
import { RotateCw, AlertTriangle, Smartphone, ArrowLeft } from 'lucide-react';

const DEFAULT_INDEX_JS = `import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './mavicore-bridge.js';

import * as AppModule from './App';

class SandboxErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[Sandbox Runtime Error]", error, errorInfo);
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'MAVICORE_DEVICE_ERROR',
        error: error?.message || String(error),
        stack: errorInfo?.componentStack || error?.stack || ''
      }, '*');
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '380px',
            width: '100%',
            backgroundColor: '#1e293b',
            borderRadius: '20px',
            border: '1px solid #334155',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f87171', margin: '0 0 6px 0' }}>
              Komponen Mengalami Kendala
            </h3>
            <div style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '10px 12px',
              color: '#fca5a5',
              fontSize: '11px',
              fontFamily: 'monospace',
              textAlign: 'left',
              wordBreak: 'break-word',
              marginBottom: '16px'
            }}>
              {this.state.error?.message || String(this.state.error)}
            </div>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '10px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Muat Ulang Komponen
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppRunner() {
  const Component = AppModule.default || AppModule.App || Object.values(AppModule).find(v => typeof v === 'function');
  if (!Component || typeof Component !== 'function') {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontFamily: 'system-ui, sans-serif' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>Komponen App Tidak Ditemukan</h3>
        <p style={{ fontSize: '12px', color: '#64748b' }}>Pastikan file /App.js memiliki <code>export default function App()</code>.</p>
      </div>
    );
  }
  return React.createElement(Component);
}

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <SandboxErrorBoundary>
      <AppRunner />
    </SandboxErrorBoundary>
  </StrictMode>
);`;

const DEFAULT_STYLES_CSS = `* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #0f172a;
  color: #f8fafc;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}`;

export default function SandboxDeviceRunner() {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('appId');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appName, setAppName] = useState('Sandbox Live App');
  const [filesRecord, setFilesRecord] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadApp() {
      setLoading(true);
      setError(null);

      try {
        let app = null;

        // 1. Try fetching by ID from Supabase
        if (appId) {
          app = await getFrontlineAppById(appId);
        }

        // 2. If not found, try finding in all frontline apps
        if (!app && appId) {
          const all = await getAllFrontlineApps();
          app = all.find(a => String(a.id) === String(appId));
        }

        // 3. If still not found, check localStorage fallbacks
        if (!app) {
          try {
            const rawStored = localStorage.getItem('vibe_last_active_app') || localStorage.getItem('vibe_sandpack_current_app');
            if (rawStored) {
              const parsed = JSON.parse(rawStored);
              if (parsed && (!appId || String(parsed.id) === String(appId))) {
                app = parsed;
              }
            }
          } catch (_) {}
        }

        if (!app) {
          // Last fallback: check if app was saved in sessionStorage
          if (appId && appId.startsWith('vibe_')) {
            const sessionCode = sessionStorage.getItem(appId);
            if (sessionCode) {
              app = { name: 'Sandbox Session App', config: { vibeCode: sessionCode } };
            }
          }
        }

        if (!isMounted) return;

        if (!app) {
          setError('Aplikasi tidak ditemukan. Pastikan QR code digenerate dari Sandbox yang aktif.');
          setLoading(false);
          return;
        }

        setAppName(app.name || 'Sandbox Live App');

        // Prepare filesRecord for Sandpack
        const cfg = app.config || {};
        let finalFiles = {};

        if (cfg.files && typeof cfg.files === 'object' && Object.keys(cfg.files).length > 0) {
          // Full multi-file project
          finalFiles = { ...cfg.files };
        } else {
          // Single vibeCode
          const code = cfg.vibeCode || (typeof cfg === 'string' ? cfg : null) || app.code || `export default function App() { return <div className="p-6 text-center text-white">App siap dijalankan.</div>; }`;
          finalFiles = {
            '/App.js': code,
            '/index.js': DEFAULT_INDEX_JS,
            '/styles.css': DEFAULT_STYLES_CSS,
          };
        }

        // Ensure index.js and styles.css exist
        if (!finalFiles['/index.js']) finalFiles['/index.js'] = DEFAULT_INDEX_JS;
        if (!finalFiles['/styles.css']) finalFiles['/styles.css'] = DEFAULT_STYLES_CSS;

        // Inject MaviCore Bridge & SDK so apps running on real devices have full database CRUD capabilities
        finalFiles['/mavicore-bridge.js'] = MAVICORE_BRIDGE_VIRTUAL_FILE;
        finalFiles['/mavicore-bridge'] = MAVICORE_BRIDGE_VIRTUAL_FILE;
        finalFiles['/mavicoreBridge.js'] = MAVICORE_BRIDGE_VIRTUAL_FILE;
        finalFiles['/mavicoreBridge'] = MAVICORE_BRIDGE_VIRTUAL_FILE;
        finalFiles['/mavicore_bridge.js'] = MAVICORE_BRIDGE_VIRTUAL_FILE;
        finalFiles['/mavicore_bridge'] = MAVICORE_BRIDGE_VIRTUAL_FILE;
        finalFiles['/node_modules/mavicore-bridge/index.js'] = MAVICORE_BRIDGE_VIRTUAL_FILE;
        finalFiles['/node_modules/mavicoreBridge/index.js'] = MAVICORE_BRIDGE_VIRTUAL_FILE;
        finalFiles['/mavicore-sdk.js'] = MAVICORE_SDK_VIRTUAL_FILE;
        finalFiles['/mavicore-sdk'] = MAVICORE_SDK_VIRTUAL_FILE;
        finalFiles['/mavicoreSdk.js'] = MAVICORE_SDK_VIRTUAL_FILE;
        finalFiles['/mavicoreSdk'] = MAVICORE_SDK_VIRTUAL_FILE;
        finalFiles['/node_modules/mavicore-sdk/index.js'] = MAVICORE_SDK_VIRTUAL_FILE;
        finalFiles['/mavicore-ui.jsx'] = MAVICORE_UI_VIRTUAL_FILE;
        finalFiles['/mavicore-ui.js'] = MAVICORE_UI_VIRTUAL_FILE;
        finalFiles['/mavicore-ui'] = MAVICORE_UI_VIRTUAL_FILE;
        finalFiles['/mavicoreUi.js'] = MAVICORE_UI_VIRTUAL_FILE;
        finalFiles['/mavicoreUi'] = MAVICORE_UI_VIRTUAL_FILE;
        finalFiles['/components/mavicore-ui.js'] = MAVICORE_UI_VIRTUAL_FILE;
        finalFiles['/components/MaviCoreUI.jsx'] = MAVICORE_UI_VIRTUAL_FILE;
        finalFiles['/node_modules/mavicore-ui/index.js'] = MAVICORE_UI_VIRTUAL_FILE;

        setFilesRecord(finalFiles);
      } catch (err) {
        console.error('[SandboxDeviceRunner] Load error:', err);
        if (isMounted) {
          setError(err.message || 'Gagal memuat aplikasi di real device.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadApp();

    return () => {
      isMounted = false;
    };
  }, [appId, refreshKey]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 select-none z-50">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4 animate-pulse">
          <Smartphone className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-200">Menghubungkan ke Real Device...</p>
        <p className="text-xs text-slate-400 mt-1">{appName}</p>
      </div>
    );
  }

  if (error || !filesRecord) {
    return (
      <div className="fixed inset-0 bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center z-50">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-100 mb-2">Gagal Menjalankan Aplikasi</h2>
        <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">
          {error || 'File project aplikasi tidak dapat dimuat.'}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setRefreshKey(k => k + 1)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all"
          >
            <RotateCw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0f172a',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <style>{`
        /* Pure Edge-to-Edge Mobile Sandpack Reset */
        .sp-wrapper, .sp-layout, .sp-stack, .sp-preview-container, .sp-preview-iframe {
          height: 100vh !important;
          min-height: 100vh !important;
          max-height: 100vh !important;
          width: 100vw !important;
          border: none !important;
          border-radius: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #0f172a !important;
        }
        .sp-preview-actions {
          display: none !important;
        }
      `}</style>

      <SandpackProvider
        key={refreshKey}
        template="react"
        theme="dark"
        files={filesRecord}
        customSetup={{
          dependencies: {
            'react': '^18.2.0',
            'react-dom': '^18.2.0',
            'react-is': '^18.2.0',
            '@nextui-org/react': '^2.2.0',
            'framer-motion': '^10.16.0',
            'lucide-react': 'latest',
            'clsx': '^2.0.0',
            'tailwind-merge': '^2.0.0',
            'class-variance-authority': '^0.7.0',
            'recharts': '^2.10.0',
            'tailwindcss': '^3.4.0',
            'autoprefixer': '^10.4.0',
            'postcss': '^8.4.0'
          }
        }}
        options={{
          externalResources: [
            'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
          ]
        }}
      >
        <SandpackPreview
          showNavigator={false}
          showOpenInCodeSandbox={false}
          showRefreshButton={false}
          style={{ width: '100vw', height: '100vh', border: 'none' }}
        />
      </SandpackProvider>
    </div>
  );
}
