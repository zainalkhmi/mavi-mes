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
  const [supabaseActive, setSupabaseActive] = useState(false);
  const [aiActive, setAiActive] = useState({ active: false, provider: '', model: '' });
  const [pythonActive, setPythonActive] = useState(false);
  const [pythonStarting, setPythonStarting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [autoRunPython, setAutoRunPython] = useState(() => {
    const saved = localStorage.getItem('mavi_python_auto_run');
    return saved !== null ? saved === 'true' : true; // Default auto-run ON
  });

  // Check Python Server health & trigger auto-run if offline
  const checkPythonStatus = async (allowAutoStart = true) => {
    let isUp = false;
    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 1500);
      const res = await fetch('http://127.0.0.1:8000/', { signal: ctrl.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        isUp = true;
      }
    } catch {
      isUp = false;
    }

    setPythonActive(isUp);

    // If server is offline and auto-run is enabled, auto-start via Vite endpoint
    if (!isUp && allowAutoStart && autoRunPython && !pythonStarting) {
      triggerPythonAutoStart();
    }

    return isUp;
  };

  const triggerPythonAutoStart = async () => {
    setPythonStarting(true);
    try {
      const res = await fetch('/api/python-server/start', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        // Poll for server to become ready
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 1200);
            const check = await fetch('http://127.0.0.1:8000/', { signal: ctrl.signal });
            clearTimeout(tid);
            if (check.ok) {
              setPythonActive(true);
              setPythonStarting(false);
              clearInterval(poll);
              toast.success("Python Vision Server (Port 8000) otomatis aktif!", { id: 'py-auto-start' });
            }
          } catch {
            if (attempts >= 12) {
              setPythonStarting(false);
              clearInterval(poll);
            }
          }
        }, 1500);
      } else {
        setPythonStarting(false);
      }
    } catch {
      setPythonStarting(false);
    }
  };

  const updateAllStatuses = async () => {
    setStatusLoading(true);
    try {
      // 1. Supabase DB
      let sb = false;
      try {
        const { testSupabaseConnection } = await import('../utils/supabaseClient');
        await testSupabaseConnection();
        sb = true;
      } catch (e) {
        sb = false;
      }
      setSupabaseActive(sb);

      // 2. AI assistant
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

      // 3. Python Backend
      await checkPythonStatus(true);
    } catch (err) {
      console.warn("Failed to check status:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (user && !isOperatorRoute && !isOperator) {
      updateAllStatuses();
      const interval = setInterval(() => {
        updateAllStatuses();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [user, isOperatorRoute, isOperator, autoRunPython]);

  const handleTogglePythonServer = async () => {
    if (pythonActive) {
      toast("Server Python Vision sudah aktif di port 8000.", { icon: '🟢' });
      return;
    }

    setPythonStarting(true);
    const toastId = toast.loading("Menjalankan Python Vision Server (yolo_server.py)...");
    try {
      const res = await fetch('/api/python-server/start', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 1200);
            const test = await fetch('http://127.0.0.1:8000/', { signal: ctrl.signal });
            clearTimeout(tid);
            if (test.ok) {
              setPythonActive(true);
              setPythonStarting(false);
              clearInterval(interval);
              toast.success("Python Vision Server (Port 8000) ONLINE!", { id: toastId });
            }
          } catch {
            if (attempts >= 12) {
              setPythonStarting(false);
              clearInterval(interval);
              toast.error("Timeout: Python server memakan waktu terlalu lama.", { id: toastId });
            }
          }
        }, 1200);
      } else {
        setPythonStarting(false);
        toast.error(`Gagal memulai: ${data.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (err) {
      setPythonStarting(false);
      toast.error(`Gagal menghubungi server: ${err.message}`, { id: toastId });
    }
  };

  const handleToggleAutoRun = (enabled) => {
    setAutoRunPython(enabled);
    localStorage.setItem('mavi_python_auto_run', String(enabled));
    if (enabled) {
      toast.success("Auto-Run Python aktif jika server offline");
      if (!pythonActive) {
        checkPythonStatus(true);
      }
    } else {
      toast("Auto-Run Python dinonaktifkan", { icon: '⏸️' });
    }
  };

  return {
    pythonActive,
    pythonStarting,
    autoRunPython,
    supabaseActive,
    aiActive,
    statusLoading,
    updateAllStatuses,
    checkPythonStatus,
    handleTogglePythonServer,
    handleToggleAutoRun
  };
}
