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
  const [statusLoading, setStatusLoading] = useState(false);

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
    toast.error("Server Python Sidecar telah dinonaktifkan dari sistem.");
  };

  return {
    pythonActive: false,
    supabaseActive,
    aiActive,
    statusLoading,
    updateAllStatuses,
    handleTogglePythonServer
  };
}
