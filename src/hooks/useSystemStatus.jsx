import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

let tauriInvoke = null;
export async function getTauriApi() {
  if (window.__TAURI_INTERNALS__) {
    if (!tauriInvoke) {
      try {
        const core = await import('@tauri-apps/api/core');
        tauriInvoke = core.invoke;
      } catch (e) {
        console.warn('Failed to load Tauri APIs:', e);
      }
    }
    return { invoke: tauriInvoke };
  }
  return { invoke: null };
}

export function useSystemStatus({ user, isOperatorRoute, isOperator }) {
  const [pythonActive, setPythonActive] = useState(false);
  const [supabaseActive, setSupabaseActive] = useState(false);
  const [aiActive, setAiActive] = useState({ active: false, provider: '', model: '' });
  const [statusLoading, setStatusLoading] = useState(false);

  const updateAllStatuses = async () => {
    setStatusLoading(true);
    try {
      // 1. Python sidecar
      let py = false;
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2500);
        const response = await fetch('http://localhost:8000/', { signal: controller.signal });
        clearTimeout(id);
        py = response.ok;
      } catch (e) {
        py = false;
      }
      setPythonActive(py);

      // 2. Supabase DB
      let sb = false;
      try {
        const { testSupabaseConnection } = await import('../utils/supabaseClient');
        await testSupabaseConnection();
        sb = true;
      } catch (e) {
        sb = false;
      }
      setSupabaseActive(sb);

      // 3. AI assistant
      let ai = { active: false, provider: '', model: '' };
      try {
        const { getIntegrationConnectors } = await import('../utils/database');
        const all = await getIntegrationConnectors();
        const aiConn = all.find(c => c.type === 'AI_ASSISTANT');
        if (aiConn) {
          const config = aiConn.aiSettings || aiConn.config || {};
          const active = Boolean(config.provider && (config.apiKey || config.provider === 'Ollama'));
          ai = {
            active,
            provider: config.provider || '',
            model: config.modelId || ''
          };
        }
      } catch (e) {
        ai = { active: false, provider: '', model: '' };
      }
      setAiActive(ai);
    } catch (err) {
      console.warn("Failed to check status:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (user && !isOperatorRoute && !isOperator) {
      updateAllStatuses();
      const interval = setInterval(updateAllStatuses, 25000);
      return () => clearInterval(interval);
    }
  }, [user, isOperatorRoute, isOperator]);

  const handleTogglePythonServer = async () => {
    const api = await getTauriApi();
    if (api.invoke) {
      const toastId = toast.loading(pythonActive ? 'Stopping Python server...' : 'Starting Python server...');
      try {
        if (pythonActive) {
          const res = await api.invoke('stop_python_server');
          toast.success(res || 'Python server stopped successfully', { id: toastId });
          setTimeout(updateAllStatuses, 1500);
        } else {
          const res = await api.invoke('start_python_server');
          toast.success(res || 'Python server starting...', { id: toastId });
          const checkWithRetry = async (attempt = 0) => {
            await updateAllStatuses();
            if (!pythonActive && attempt < 3) {
              setTimeout(() => checkWithRetry(attempt + 1), 2000);
            }
          };
          setTimeout(() => checkWithRetry(), 3000);
        }
      } catch (err) {
        toast.error(`Gagal mengontrol server: ${err}`, { id: toastId });
      }
    } else {
      if (pythonActive) {
        toast.error((t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontWeight: 700 }}>Tauri tidak terdeteksi di browser</span>
            <span style={{ fontSize: '0.75rem' }}>Silakan matikan server secara manual di terminal Anda (tekan <b>Ctrl+C</b> pada terminal yolo_server).</span>
          </div>
        ), { duration: 6000 });
      } else {
        toast.success((t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontWeight: 700 }}>Tauri tidak terdeteksi di browser</span>
            <span style={{ fontSize: '0.75rem' }}>Silakan jalankan perintah ini di terminal Anda untuk menyalakan server:</span>
            <code style={{ backgroundColor: '#f1f5f9', padding: '4px 6px', borderRadius: '4px', fontSize: '0.7rem', border: '1px solid #cbd5e1' }}>
              .venv\Scripts\python yolo_server.py
            </code>
          </div>
        ), { duration: 8000 });
      }
    }
  };

  return {
    pythonActive,
    supabaseActive,
    aiActive,
    statusLoading,
    updateAllStatuses,
    handleTogglePythonServer
  };
}
