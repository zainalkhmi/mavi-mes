import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Search,
  Zap,
  Save,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Cpu,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
  Sparkles,
  Cloud,
  Terminal,
  ShieldCheck,
  ArrowRight,
  Server,
  Layers,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getIntegrationConnectors, saveIntegrationConnector } from '../utils/database';
import VertexAiService from '../services/ai/VertexAiService';

const PROVIDERS = [
  { id: 'VertexAI', label: 'Vertex AI (GCP)' },
  { id: 'Gemini', label: 'Gemini' },
  { id: 'OpenAI', label: 'Openai' },
  { id: 'Groq', label: 'Grok' },
  { id: 'OpenRouter', label: 'Openrouter' },
  { id: 'Ollama', label: 'Local AI (Ollama)' },
  { id: 'Custom', label: 'Custom API' }
];

const DEFAULT_MODELS = {
  VertexAI: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (GCP Vertex AI - High Throughput & Vision)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (GCP Vertex AI - 1M+ Long Context Factory Deep Memory)' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (GCP Vertex AI - Fast Inference)' },
    { id: 'custom-endpoint', name: 'Vertex AI Custom Model Garden Endpoint' }
  ],
  Gemini: [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Recommended - Super Cepat & Next Gen)' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Stabil Fallback)' },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Analisis Kompleks)' }
  ],
  OpenAI: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cost-Efficient)' },
    { id: 'gpt-4o', name: 'GPT-4o (High Performance)' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
  ],
  Groq: [
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Very Fast)' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }
  ],
  OpenRouter: [
    { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash (via OpenRouter)' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro (via OpenRouter)' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'meta-llama/llama-3-8b-instruct:free', name: 'Llama 3 8B Instruct (Free)' }
  ],
  Ollama: [
    { id: 'llama3', name: 'Llama 3 (Local)' },
    { id: 'gemma2', name: 'Gemma 2 (Local)' },
    { id: 'mistral', name: 'Mistral (Local)' },
    { id: 'phi3', name: 'Phi 3 (Local)' }
  ],
  Custom: []
};

const TABS = [
  { id: 'ai', label: 'AI Configuration', icon: Settings },
  { id: 'guide', label: 'Panduan & Tutorial AI', icon: BookOpen }
];

const AiSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ai');
  const [activeProvider, setActiveProvider] = useState('Gemini');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [projectId, setProjectId] = useState('mavi-mes-production');
  const [location, setLocation] = useState('asia-southeast1');
  const [modelId, setModelId] = useState('gemini-3.8-flash');
  const [availableModels, setAvailableModels] = useState([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: bool, message: string }
  const [connectorId, setConnectorId] = useState(null);
  const [dbSettings, setDbSettings] = useState(null);
  const [configs, setConfigs] = useState({}); // Stores { apiKey, baseUrl, modelId, availableModels } per provider ID
  const [copilotSafetyThreshold, setCopilotSafetyThreshold] = useState(0.6);
  const [guideCategory, setGuideCategory] = useState('vertex'); // 'vertex' | 'gemini' | 'openai_groq' | 'ollama' | 'faq'
  const [copiedSnippet, setCopiedSnippet] = useState(null);

  const handleCopySnippet = (text, id) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedSnippet(id);
      setTimeout(() => setCopiedSnippet(null), 2200);
    }
  };

  const handleApplyTemplate = (provId, customVals = {}) => {
    handleProviderSwitch(provId);
    if (customVals.projectId) setProjectId(customVals.projectId);
    if (customVals.location) setLocation(customVals.location);
    if (customVals.baseUrl !== undefined) setBaseUrl(customVals.baseUrl);
    if (customVals.modelId) setModelId(customVals.modelId);
    setActiveTab('ai');
  };

  useEffect(() => {
    const loadSettings = async () => {
      const all = await getIntegrationConnectors();
      const aiConn = all.find(c => c.type === 'AI_ASSISTANT');
      if (aiConn) {
        setConnectorId(aiConn.id);
        const aiSettings = aiConn.aiSettings || aiConn.config || {};
        setDbSettings(aiSettings);
        const provider = aiSettings.provider || 'Gemini';
        setActiveProvider(provider);
        setApiKey(aiSettings.apiKey || '');
        setBaseUrl(aiSettings.baseUrl || '');
        setProjectId(aiSettings.projectId || 'mavi-mes-production');
        setLocation(aiSettings.location || 'asia-southeast1');
        let mid = aiSettings.modelId || (provider === 'Gemini' ? 'gemini-3.8-flash' : provider === 'VertexAI' ? 'gemini-2.0-flash' : 'gpt-4o-mini');
        const isBogusOrOld = (id) => {
          if (!id) return true;
          const s = String(id).toLowerCase();
          return s.includes('gemini-2.0') || s.includes('gemini-1.5') || s.includes('flash-latest') || s === 'gemini-flash' || s === 'gemini';
        };
        if (provider === 'Gemini' && isBogusOrOld(mid)) {
          mid = 'gemini-3.8-flash';
        }
        setModelId(mid);

        // Build initial models list from defaults
        const defaults = DEFAULT_MODELS[provider] || [];
        const combined = [...defaults];
        if (mid && !combined.find(m => m.id === mid) && !isBogusOrOld(mid)) {
          combined.unshift({ id: mid, name: `${mid} (Current)` });
        }
        setAvailableModels(combined);
        setCopilotSafetyThreshold(typeof aiSettings.copilotSafetyThreshold === 'number' ? aiSettings.copilotSafetyThreshold : 0.6);

        // Load the config cache if it exists
        if (aiSettings.configCache) {
          setConfigs(aiSettings.configCache);
        } else {
          // Initialize with current active configuration
          setConfigs({
            [provider]: {
              apiKey: aiSettings.apiKey || '',
              baseUrl: aiSettings.baseUrl || '',
              projectId: aiSettings.projectId || 'mavi-mes-production',
              location: aiSettings.location || 'asia-southeast1',
              modelId: mid,
              availableModels: combined
            }
          });
        }
      }
    };
    loadSettings();
  }, []);

  const handleProviderSwitch = (newProviderId) => {
    // 1. Buffer current inputs into the configs map for the OLD provider
    setConfigs(prev => ({
      ...prev,
      [activeProvider]: {
        apiKey,
        baseUrl,
        projectId,
        location,
        modelId,
        availableModels
      }
    }));

    // 2. Load inputs for the NEW provider from the configs map (or default)
    const defaultModelsForNewProvider = DEFAULT_MODELS[newProviderId] || [];
    const defaultModelIdForNewProvider = defaultModelsForNewProvider.length > 0 
      ? defaultModelsForNewProvider[0].id 
      : (newProviderId === 'Gemini' ? 'gemini-3.8-flash' : newProviderId === 'VertexAI' ? 'gemini-2.0-flash' : '');

    const nextConfig = configs[newProviderId] || {
      apiKey: '',
      baseUrl: newProviderId.includes('Ollama') ? 'http://localhost:11434/v1' : '',
      projectId: 'mavi-mes-production',
      location: 'asia-southeast1',
      modelId: defaultModelIdForNewProvider,
      availableModels: defaultModelsForNewProvider
    };

    setActiveProvider(newProviderId);
    setApiKey(nextConfig.apiKey || '');
    setBaseUrl(nextConfig.baseUrl || '');
    setProjectId(nextConfig.projectId || 'mavi-mes-production');
    setLocation(nextConfig.location || 'asia-southeast1');
    setModelId(nextConfig.modelId || '');
    setAvailableModels(nextConfig.availableModels || []);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey && activeProvider !== 'VertexAI') {
      setTestResult({ success: false, message: 'Please enter an API Key first.' });
      return;
    }
    setIsTesting(true);
    setIsFetchingModels(true);
    setTestResult(null);

    try {
      let success = false;
      let errorMsg = '';
      let models = [];

      if (activeProvider === 'VertexAI') {
        const vRes = await VertexAiService.testConnection({
          projectId: projectId.trim() || 'mavi-mes-production',
          location: location.trim() || 'asia-southeast1',
          apiKey: trimmedKey,
          proxyUrl: baseUrl.trim(),
          modelId
        });
        if (vRes.success) {
          success = true;
          models = DEFAULT_MODELS.VertexAI;
          setTestResult({ success: true, message: vRes.message });
        } else {
          errorMsg = vRes.message;
        }
      } else if (activeProvider === 'Gemini') {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`;
        const listResp = await fetch(listUrl);
        const listData = await listResp.json();

        if (listResp.ok && listData.models) {
          success = true;
          models = listData.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent'))
            .map(m => ({ id: m.name.replace('models/', ''), name: m.displayName || m.name }));
        } else {
          errorMsg = listData.error?.message || 'Gemini API: Key verification failed.';
        }
      } else if (activeProvider === 'OpenAI' || activeProvider === 'Groq') {
        const baseUrl = activeProvider === 'Groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1';
        const listResp = await fetch(`${baseUrl}/models`, {
          headers: { 'Authorization': `Bearer ${trimmedKey}` }
        });
        const listData = await listResp.json();

        if (listResp.ok && listData.data) {
          success = true;
          models = listData.data.map(m => ({ id: m.id, name: m.id }));
        } else {
          errorMsg = listData.error?.message || listData.message || `${activeProvider} API: Authentication failed. Check your key.`;
        }
      } else if (activeProvider === 'OpenRouter') {
        const listResp = await fetch(`https://openrouter.ai/api/v1/models`, {
          headers: { 'Authorization': `Bearer ${trimmedKey}` }
        });
        const listData = await listResp.json();
        if (listResp.ok && listData.data) {
          success = true;
          models = listData.data.map(m => ({ id: m.id, name: m.name || m.id }));
        } else {
          errorMsg = listData.error?.message || 'OpenRouter API Error';
        }
      } else if (activeProvider === 'Ollama' || activeProvider === 'Custom' || activeProvider === 'Local AI (Ollama)') {
        const targetUrl = baseUrl.trim() || (activeProvider.includes('Ollama') ? 'http://localhost:11434/v1' : '');
        if (!targetUrl) {
          errorMsg = 'Please enter a Base URL for this provider.';
        } else {
          const listResp = await fetch(`${targetUrl.replace(/\/$/, '')}/models`, {
            headers: trimmedKey ? { 'Authorization': `Bearer ${trimmedKey}` } : {}
          });
          const listData = await listResp.json();
          if (listResp.ok && listData.data) {
            success = true;
            models = listData.data.map(m => ({ id: m.id, name: m.id }));
          } else {
            errorMsg = listData.error?.message || 'Custom/Ollama API Error. Check Base URL.';
          }
        }
      } else {
        errorMsg = `${activeProvider} testing not yet fully implemented.`;
      }

      if (success) {
        setAvailableModels(models);
        // If current modelId is not in the list, pick the first one
        if (models.length > 0 && !models.find(m => m.id === modelId)) {
          setModelId(models[0].id);
        }
        if (activeProvider !== 'VertexAI') {
          setTestResult({ success: true, message: `Connection Successful! ${models.length} models found.` });
        }
      } else {
        setTestResult({ success: false, message: errorMsg });
      }
    } catch (err) {
      setTestResult({ success: false, message: `Network Error: ${err.message}` });
    } finally {
      setIsTesting(false);
      setIsFetchingModels(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        id: connectorId,
        name: 'Global AI Assistant',
        type: 'AI_ASSISTANT',
        // Use 'config' to match existing schema, database.js will handle snake_case if we want to move to ai_settings
        config: {
          provider: activeProvider,
          modelId: modelId,
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim(),
          projectId: projectId.trim(),
          location: location.trim(),
          basePrompt: dbSettings?.basePrompt || 'You are a professional MES assistant helping frontline operators and engineers.',
          copilotSafetyThreshold: Number(copilotSafetyThreshold),
          configCache: {
            ...configs,
            [activeProvider]: {
              apiKey: apiKey.trim(),
              baseUrl: baseUrl.trim(),
              projectId: projectId.trim(),
              location: location.trim(),
              modelId,
              availableModels
            }
          }
        },
        aiSettings: {
          provider: activeProvider,
          modelId: modelId,
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim(),
          projectId: projectId.trim(),
          location: location.trim(),
          basePrompt: dbSettings?.basePrompt || 'You are a professional MES assistant helping frontline operators and engineers.',
          copilotSafetyThreshold: Number(copilotSafetyThreshold),
          configCache: {
            ...configs,
            [activeProvider]: {
              apiKey: apiKey.trim(),
              baseUrl: baseUrl.trim(),
              projectId: projectId.trim(),
              location: location.trim(),
              modelId,
              availableModels
            }
          }
        }
      };

      const saved = await saveIntegrationConnector(payload);
      if (saved && saved.id) setConnectorId(saved.id);
      setDbSettings(payload.aiSettings);
      
      if (activeProvider === 'VertexAI') {
        VertexAiService.saveConfig({
          projectId: projectId.trim(),
          location: location.trim(),
          apiKey: apiKey.trim(),
          proxyUrl: baseUrl.trim(),
          modelId
        });
      }
      try {
        localStorage.setItem('mandor_primary_ai_connector', JSON.stringify(saved || payload));
        localStorage.setItem('vibe_active_provider', activeProvider);
        localStorage.setItem('vibe_active_model', modelId);
      } catch (err) {
        void err;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mavicore_ai_connector_updated', {
          detail: {
            connector: saved || payload,
            modelId: modelId,
            provider: activeProvider
          }
        }));
      }
      alert('AI Configuration saved successfully!');
    } catch (err) {
      console.error('Failed to save AI configuration:', err);
      alert('Failed to save configuration. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      flex: 1, minHeight: 0, width: '100%', backgroundColor: '#f8f9fa', color: '#495057',
      display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* Mandor Navbar - Action Bar (Fixed at top) */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid #dee2e6', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 20px', borderRadius: '4px', backgroundColor: '#017E84', color: '#fff',
              border: 'none', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s',
              opacity: isSaving ? 0.7 : 1, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {isSaving ? 'Saving...' : 'SAVE'}
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '8px 20px', borderRadius: '4px', backgroundColor: '#fff', color: '#495057',
              border: '1px solid #dee2e6', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer'
            }}
          >
            DISCARD
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#dee2e6', margin: '0 8px' }}></div>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#495057' }}>Settings</h1>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '8px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent',
            color: '#adb5bd', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <div style={{
          width: '280px', backgroundColor: '#f0f2f5', borderRight: '1px solid #dee2e6',
          display: 'flex', flexDirection: 'column', padding: '16px 0'
        }}>
          <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #dee2e6', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: '#714B67', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Settings size={18} />
            </div>
            <span style={{ fontSize: '0.950rem', fontWeight: 600, color: '#495057' }}>General Settings</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%', padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '12px', color: isActive ? '#017E84' : '#495057',
                    fontSize: '0.9rem', fontWeight: isActive ? 700 : 500, borderLeft: isActive ? '4px solid #017E84' : '4px solid transparent',
                    backgroundColor: isActive ? '#fff' : 'transparent', textAlign: 'left', transition: 'all 0.1s'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, backgroundColor: '#fff', overflowY: 'auto' }}>
          <div style={{ padding: '32px 48px', maxWidth: '900px' }}>
            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                {/* Active Info Section */}
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#212529', margin: 0 }}>AI Configuration</h2>
                    <p style={{ fontSize: '0.85rem', color: '#6c757d', margin: 0 }}>Configure the primary intelligence engine for the MES platform.</p>
                  </div>
                </div>

                {/* Status Indicator (Mandor alert style) */}
                <div style={{
                  padding: '12px 16px', borderRadius: '4px', border: '1px solid #cce5ff',
                  backgroundColor: '#f8f9fa', borderLeftWidth: '4px', borderLeftColor: '#017E84',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <div style={{ color: '#017E84' }}><Cpu size={20} /></div>
                  <div style={{ fontSize: '0.9rem', color: '#495057' }}>
                    <strong style={{ color: '#017E84' }}>{dbSettings?.provider || 'Gemini'}</strong> is currently active using <strong>{dbSettings?.modelId || 'gemini-1.5-flash-002'}</strong>
                  </div>
                </div>

                {/* Quick Guide Helper Banner */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', borderRadius: '6px',
                  backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                  color: '#166534', gap: '16px', flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '260px', flex: 1 }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '6px',
                      backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#15803d', flexShrink: 0
                    }}>
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Butuh panduan koneksi ke Google Cloud / Vertex AI / Gemini?</div>
                      <div style={{ fontSize: '0.775rem', color: '#166534', opacity: 0.85 }}>
                        Pelajari cara mendapatkan API Key, GCP Project ID, serta integrasi Vision QC & Copilot.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('guide')}
                    style={{
                      padding: '7px 16px', borderRadius: '4px', border: 'none',
                      backgroundColor: '#15803d', color: '#fff', fontSize: '0.8rem',
                      fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center',
                      gap: '6px', transition: 'all 0.15s'
                    }}
                  >
                    Buka Menu Panduan <ArrowRight size={14} />
                  </button>
                </div>

                {/* Settings Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                  {/* Provider Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#495057' }}>AI Provider</label>
                      <p style={{ fontSize: '0.75rem', color: '#adb5bd', marginTop: '4px' }}>Choose your AI service provider</p>
                    </div>
                    <div style={{
                      display: 'flex', gap: '4px', padding: '4px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6'
                    }}>
                      {PROVIDERS.map(p => {
                        const isActive = activeProvider === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => handleProviderSwitch(p.id)}
                            style={{
                              flex: 1, padding: '6px 12px', borderRadius: '3px', border: 'none',
                              backgroundColor: isActive ? '#017E84' : 'transparent', color: isActive ? '#fff' : '#495057',
                              fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s'
                            }}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vertex AI Specific Configuration */}
                  {activeProvider === 'VertexAI' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
                        <div>
                          <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#495057' }}>GCP Project ID</label>
                          <p style={{ fontSize: '0.75rem', color: '#adb5bd', marginTop: '4px' }}>Google Cloud Project Identifier</p>
                        </div>
                        <input
                          type="text"
                          value={projectId}
                          onChange={(e) => setProjectId(e.target.value)}
                          placeholder="e.g. mavi-mes-production"
                          style={{
                            padding: '8px 12px', borderRadius: '4px', backgroundColor: '#fff',
                            border: '1px solid #dee2e6', color: '#495057', fontSize: '0.9rem', outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
                        <div>
                          <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#495057' }}>GCP Region / Location</label>
                          <p style={{ fontSize: '0.75rem', color: '#adb5bd', marginTop: '4px' }}>Vertex AI processing region</p>
                        </div>
                        <select
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          style={{
                            padding: '8px 12px', borderRadius: '4px', backgroundColor: '#fff',
                            border: '1px solid #dee2e6', color: '#495057', fontSize: '0.9rem', outline: 'none'
                          }}
                        >
                          <option value="asia-southeast1">asia-southeast1 (Jakarta - Low Latency)</option>
                          <option value="asia-southeast2">asia-southeast2 (Singapore)</option>
                          <option value="asia-east1">asia-east1 (Taiwan)</option>
                          <option value="us-central1">us-central1 (Iowa - Flagship Tier)</option>
                          <option value="us-east4">us-east4 (N. Virginia)</option>
                          <option value="europe-west1">europe-west1 (Belgium)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* API Key Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#495057' }}>
                        {activeProvider === 'VertexAI' ? 'API Key / Bearer Token' : (activeProvider === 'Ollama' || activeProvider.includes('Ollama') ? 'API Key (Optional)' : 'API Key')}
                      </label>
                      <p style={{ fontSize: '0.75rem', color: '#adb5bd', marginTop: '4px' }}>Secret key for authentication</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={activeProvider === 'Ollama' || activeProvider.includes('Ollama') ? "Optional" : "Paste your key here"}
                          style={{
                            flex: 1, padding: '8px 12px', borderRadius: '4px', backgroundColor: '#fff',
                            border: '1px solid #dee2e6', color: '#495057', fontSize: '0.9rem', outline: 'none'
                          }}
                        />
                        <button
                          onClick={handleTestConnection}
                          disabled={isTesting}
                          style={{
                            padding: '8px 16px', borderRadius: '4px', backgroundColor: '#e9ecef', color: '#495057',
                            border: '1px solid #dee2e6', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                          {isTesting ? 'Testing...' : 'Test'}
                        </button>
                      </div>

                      {testResult && (
                        <div style={{
                          fontSize: '0.8rem', color: testResult.success ? '#157347' : '#bb2d3b',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                          {testResult.success ? <CheckCircle2 size={14} /> : <X size={14} />}
                          {testResult.message}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conditional Base URL Row */}
                  {(activeProvider === 'Ollama' || activeProvider === 'Custom' || activeProvider.includes('Ollama')) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
                      <div>
                        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#495057' }}>Base URL</label>
                        <p style={{ fontSize: '0.75rem', color: '#adb5bd', marginTop: '4px' }}>Endpoint address</p>
                      </div>
                      <input
                        type="text"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder={activeProvider.includes('Ollama') ? "http://localhost:11434/v1" : "https://api.your-provider.com/v1"}
                        style={{
                          padding: '8px 12px', borderRadius: '4px', backgroundColor: '#fff',
                          border: '1px solid #dee2e6', color: '#495057', fontSize: '0.9rem', outline: 'none'
                        }}
                      />
                    </div>
                  )}

                  {/* Model Choice Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#495057' }}>AI Model</label>
                      <p style={{ fontSize: '0.75rem', color: '#adb5bd', marginTop: '4px' }}>Specific model version to use</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={modelId}
                        onChange={(e) => setModelId(e.target.value)}
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: '4px', backgroundColor: '#fff',
                          border: '1px solid #dee2e6', color: '#495057', fontSize: '0.9rem', outline: 'none',
                          appearance: 'none', cursor: 'pointer'
                        }}
                      >
                        {availableModels.length > 0 ? (
                          availableModels.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))
                        ) : (
                          <option value={modelId}>{modelId}</option>
                        )}
                      </select>
                      <div style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        pointerEvents: 'none', color: '#adb5bd'
                      }}>
                        <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
                      </div>
                      <p style={{ fontSize: '0.7rem', color: '#adb5bd', marginTop: '4px' }}>
                        {isFetchingModels ? 'Retrieving available versions...' : availableModels.length > 0 ? `${availableModels.length} models found` : 'Verify connection to see more models'}
                      </p>
                    </div>
                  </div>

                  {/* Copilot Safety Threshold Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#495057' }}>Copilot Safety Threshold</label>
                      <p style={{ fontSize: '0.75rem', color: '#adb5bd', marginTop: '4px' }}>Minimum rasio command aman untuk Apply All</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="range"
                        min="0.3"
                        max="0.95"
                        step="0.05"
                        value={copilotSafetyThreshold}
                        onChange={(e) => setCopilotSafetyThreshold(Number(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <div style={{ minWidth: '56px', fontSize: '0.85rem', fontWeight: 700, color: '#017E84' }}>
                        {(copilotSafetyThreshold * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      {[
                        { label: 'Aggressive', value: 0.4 },
                        { label: 'Balanced', value: 0.6 },
                        { label: 'Conservative', value: 0.8 }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setCopilotSafetyThreshold(preset.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: Math.abs(copilotSafetyThreshold - preset.value) < 0.001 ? '1px solid #017E84' : '1px solid #dee2e6',
                            backgroundColor: Math.abs(copilotSafetyThreshold - preset.value) < 0.001 ? '#e6f7f7' : '#fff',
                            color: '#495057',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {preset.label} ({Math.round(preset.value * 100)}%)
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB: PANDUAN & TUTORIAL AI */}
            {activeTab === 'guide' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Header Guide */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', backgroundColor: '#e6f7f7',
                        color: '#017E84', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                      }}>
                        Tutorial & Dokumentasi
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>MAVI AI Intelligence Hub</span>
                    </div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#212529', margin: '4px 0 0 0' }}>
                      Panduan Koneksi AI & Model MES
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#6c757d', margin: 0 }}>
                      Ikuti petunjuk di bawah untuk menghubungkan provider kecerdasan buatan ke seluruh modul MAVI MES.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ai')}
                    style={{
                      padding: '8px 16px', borderRadius: '4px', border: '1px solid #dee2e6',
                      backgroundColor: '#fff', color: '#017E84', fontSize: '0.85rem',
                      fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    Kembali ke Konfigurasi <ChevronRight size={14} />
                  </button>
                </div>

                {/* Platform Selector Buttons */}
                <div style={{
                  display: 'flex', gap: '8px', padding: '4px', backgroundColor: '#f0f2f5',
                  borderRadius: '6px', overflowX: 'auto'
                }}>
                  {[
                    { id: 'vertex', label: 'Google Cloud Vertex AI', icon: Cloud, badge: 'Enterprise' },
                    { id: 'gemini', label: 'Google Gemini', icon: Sparkles, badge: 'Cepat & Gratis' },
                    { id: 'openai_groq', label: 'OpenAI & Groq', icon: Zap, badge: 'High-Speed' },
                    { id: 'ollama', label: 'Local AI (Ollama)', icon: Server, badge: 'Offline' },
                    { id: 'faq', label: 'Troubleshooting & FAQ', icon: AlertCircle, badge: 'Solusi Error' }
                  ].map(cat => {
                    const isActive = guideCategory === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setGuideCategory(cat.id)}
                        style={{
                          flex: 1, minWidth: '150px', padding: '10px 14px', borderRadius: '4px',
                          border: 'none', backgroundColor: isActive ? '#fff' : 'transparent',
                          color: isActive ? '#017E84' : '#495057', fontSize: '0.825rem',
                          fontWeight: isActive ? 700 : 500, cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                          boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Icon size={16} />
                          <span>{cat.label}</span>
                        </div>
                        <span style={{
                          fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px',
                          backgroundColor: isActive ? '#e6f7f7' : '#e9ecef',
                          color: isActive ? '#017E84' : '#6c757d', fontWeight: 600
                        }}>
                          {cat.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* SECTION 1: GOOGLE CLOUD VERTEX AI */}
                {guideCategory === 'vertex' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    <div style={{
                      padding: '20px', borderRadius: '6px', border: '1px solid #b8daff',
                      backgroundColor: '#ebf8ff', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexWrap: 'wrap', gap: '16px'
                    }}>
                      <div style={{ maxWidth: '600px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#004085', fontWeight: 700, fontSize: '1rem' }}>
                          <Cloud size={20} />
                          Google Cloud Vertex AI Enterprise
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#004085', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                          Vertex AI menghubungkan MAVI MES langsung ke infrastruktur enterprise Google Cloud. Digunakan untuk zero-shot visual defect inspection (Vision QC), long-context synthesis telemetry pabrik (hingga 1M token), dan autonomous MES tool calling.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('VertexAI', {
                          projectId: 'mavi-mes-production',
                          location: 'asia-southeast1',
                          modelId: 'gemini-2.0-flash'
                        })}
                        style={{
                          padding: '10px 18px', borderRadius: '4px', border: 'none',
                          backgroundColor: '#0056b3', color: '#fff', fontSize: '0.85rem',
                          fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center',
                          gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        <Zap size={16} /> Terapkan Template Vertex AI
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#343a40', margin: 0 }}>Langkah-Langkah Setup Google Cloud Vertex AI:</h3>

                      {/* Step 1 */}
                      <div style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fdfdfd' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#017E84',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                        }}>1</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#212529' }}>Buka Google Cloud Console & Siapkan Project</div>
                          <div style={{ fontSize: '0.825rem', color: '#6c757d', lineHeight: 1.5 }}>
                            Kunjungi Google Cloud Console dan buat project baru atau gunakan project yang sudah ada. Catat <strong>Project ID</strong> Anda.
                          </div>
                          <a
                            href="https://console.cloud.google.com"
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#017E84', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', marginTop: '4px' }}
                          >
                            Buka Google Cloud Console <ExternalLink size={13} />
                          </a>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fdfdfd' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#017E84',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                        }}>2</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#212529' }}>Aktifkan Vertex AI API</div>
                          <div style={{ fontSize: '0.825rem', color: '#6c757d', lineHeight: 1.5 }}>
                            Di menu <strong>APIs & Services &gt; Enable APIs and Services</strong>, cari <code>Vertex AI API</code> dan klik <strong>ENABLE</strong>.
                          </div>
                          <div style={{
                            padding: '8px 12px', backgroundColor: '#212529', color: '#38d9a9',
                            borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.775rem',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px'
                          }}>
                            <span>gcloud services enable aiplatform.googleapis.com</span>
                            <button
                              type="button"
                              onClick={() => handleCopySnippet('gcloud services enable aiplatform.googleapis.com', 'gcloud_enable')}
                              style={{ background: 'none', border: 'none', color: '#adb5bd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              {copiedSnippet === 'gcloud_enable' ? <Check size={14} color="#38d9a9" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fdfdfd' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#017E84',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                        }}>3</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#212529' }}>Buat Kredensial (API Key / Service Account)</div>
                          <div style={{ fontSize: '0.825rem', color: '#6c757d', lineHeight: 1.5 }}>
                            Untuk direct call via REST API: Buat <strong>API Key</strong> di <i>APIs & Services &gt; Credentials</i> (batasi ke Vertex AI API), atau jika menggunakan gateway backend, gunakan Service Account dengan role <code>roles/aiplatform.user</code>.
                          </div>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fdfdfd' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#017E84',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                        }}>4</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#212529' }}>Isi Form di Tab AI Configuration</div>
                          <div style={{ fontSize: '0.825rem', color: '#6c757d', lineHeight: 1.5 }}>
                            Pilih Provider <strong>Vertex AI (GCP)</strong>, lalu masukkan:
                          </div>
                          <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', fontSize: '0.825rem', color: '#495057', lineHeight: 1.6 }}>
                            <li><strong>GCP Project ID:</strong> Project ID Google Cloud Anda (misal: <code>mavi-factory-prod</code>).</li>
                            <li><strong>Location / Region:</strong> <code>asia-southeast1</code> (Singapura/Jakarta) untuk latensi tercepat ke pabrik di Indonesia.</li>
                            <li><strong>API Key / Bearer Token:</strong> Masukkan kunci yang sudah dibuat.</li>
                            <li><strong>Model ID:</strong> <code>gemini-2.0-flash</code> (Super cepat untuk Vision QC) atau <code>gemini-1.5-pro</code>.</li>
                          </ul>
                          <div style={{ marginTop: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                handleProviderSwitch('VertexAI');
                                setActiveTab('ai');
                              }}
                              style={{
                                padding: '6px 14px', borderRadius: '4px', border: '1px solid #017E84',
                                backgroundColor: '#fff', color: '#017E84', fontSize: '0.8rem',
                                fontWeight: 600, cursor: 'pointer'
                              }}
                            >
                              Buka Form Vertex AI Sekarang &rarr;
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* SECTION 2: GOOGLE GEMINI */}
                {guideCategory === 'gemini' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    <div style={{
                      padding: '20px', borderRadius: '6px', border: '1px solid #d4edda',
                      backgroundColor: '#f6fff8', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexWrap: 'wrap', gap: '16px'
                    }}>
                      <div style={{ maxWidth: '600px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#155724', fontWeight: 700, fontSize: '1rem' }}>
                          <Sparkles size={20} />
                          Google Gemini (Google AI Studio - Cara Paling Cepat & Gratis)
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#155724', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                          Rekomendasi utama untuk testing dan implementasi cepat. Dapatkan API Key gratis hanya dalam 1 menit tanpa perlu konfigurasi cloud yang kompleks.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('Gemini', {
                          modelId: 'gemini-3.8-flash'
                        })}
                        style={{
                          padding: '10px 18px', borderRadius: '4px', border: 'none',
                          backgroundColor: '#155724', color: '#fff', fontSize: '0.85rem',
                          fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center',
                          gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        <Zap size={16} /> Terapkan Template Gemini
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#343a40', margin: 0 }}>Langkah Mendapatkan Kunci Gemini:</h3>

                      <div style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fdfdfd' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#017E84',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                        }}>1</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#212529' }}>Buka Google AI Studio</div>
                          <div style={{ fontSize: '0.825rem', color: '#6c757d', lineHeight: 1.5 }}>
                            Kunjungi Google AI Studio dan login menggunakan akun Google Anda.
                          </div>
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#017E84', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}
                          >
                            Buka aistudio.google.com/app/apikey <ExternalLink size={13} />
                          </a>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fdfdfd' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#017E84',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                        }}>2</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#212529' }}>Klik tombol "Create API Key"</div>
                          <div style={{ fontSize: '0.825rem', color: '#6c757d', lineHeight: 1.5 }}>
                            Pilih opsi <i>"Create API key in new project"</i>. Kunci akan muncul dalam format <code>AIzaSy...</code>. Salin kunci tersebut.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fdfdfd' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#017E84',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                        }}>3</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#212529' }}>Paste ke Tab AI Configuration & Test Connection</div>
                          <div style={{ fontSize: '0.825rem', color: '#6c757d', lineHeight: 1.5 }}>
                            Kembali ke tab <strong>AI Configuration</strong>, pastikan Provider adalah <strong>Gemini</strong>, paste API Key Anda, lalu klik <strong>Verify & Retrieve Models</strong>. MAVI MES otomatis memuat model-model aktif seperti <code>gemini-3.8-flash</code>.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fdfdfd' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#017E84',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                        }}>4</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#212529' }}>Klik Tombol SAVE di Atas</div>
                          <div style={{ fontSize: '0.825rem', color: '#6c757d', lineHeight: 1.5 }}>
                            Simpan konfigurasi. Seluruh fitur AI di MAVI MES (Copilot, Vision, Predictive Maintenance) akan langsung aktif!
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* SECTION 3: OPENAI & GROQ */}
                {guideCategory === 'openai_groq' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{
                      padding: '20px', borderRadius: '6px', border: '1px solid #fed7aa',
                      backgroundColor: '#fffbeb', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexWrap: 'wrap', gap: '16px'
                    }}>
                      <div style={{ maxWidth: '600px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9a3412', fontWeight: 700, fontSize: '1rem' }}>
                          <Zap size={20} />
                          OpenAI (GPT-4o) & Groq (Ultra-Fast Llama 3)
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#9a3412', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                          Gunakan <strong>Groq</strong> untuk respon AI sub-detik (300+ token/detik) dengan model Llama 3.1 70B, atau <strong>OpenAI</strong> untuk standar GPT-4o mini.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate('Groq', { modelId: 'llama-3.1-70b-versatile' })}
                          style={{
                            padding: '8px 14px', borderRadius: '4px', border: 'none',
                            backgroundColor: '#ea580c', color: '#fff', fontSize: '0.825rem',
                            fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          Template Groq
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate('OpenAI', { modelId: 'gpt-4o-mini' })}
                          style={{
                            padding: '8px 14px', borderRadius: '4px', border: 'none',
                            backgroundColor: '#10a37f', color: '#fff', fontSize: '0.825rem',
                            fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          Template OpenAI
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ padding: '16px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fff' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#212529', fontWeight: 700 }}>Groq (Super Cepat)</h4>
                        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.825rem', color: '#495057', lineHeight: 1.6 }}>
                          <li>Buka <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ color: '#017E84' }}>console.groq.com</a></li>
                          <li>Login &amp; buka menu <strong>API Keys</strong></li>
                          <li>Klik <strong>Create API Key</strong> dan salin kodenya</li>
                          <li>Di AI Configuration, pilih Provider <strong>Grok</strong></li>
                          <li>Paste API Key dan pilih model <code>llama-3.1-70b-versatile</code></li>
                        </ol>
                      </div>
                      <div style={{ padding: '16px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fff' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#212529', fontWeight: 700 }}>OpenAI</h4>
                        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.825rem', color: '#495057', lineHeight: 1.6 }}>
                          <li>Buka <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: '#017E84' }}>platform.openai.com/api-keys</a></li>
                          <li>Buat secret key baru (format <code>sk-...</code>)</li>
                          <li>Pastikan akun Anda memiliki kredit aktif</li>
                          <li>Di AI Configuration, pilih Provider <strong>Openai</strong></li>
                          <li>Paste API Key dan pilih model <code>gpt-4o-mini</code></li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 4: OLLAMA LOCAL AI */}
                {guideCategory === 'ollama' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{
                      padding: '20px', borderRadius: '6px', border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexWrap: 'wrap', gap: '16px'
                    }}>
                      <div style={{ maxWidth: '600px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 700, fontSize: '1rem' }}>
                          <Server size={20} />
                          Local AI (Ollama) - Offline &amp; On-Premise Pabrik
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#475569', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                          Solusi ideal untuk pabrik dengan standar kerahasiaan data tinggi atau jaringan air-gapped tanpa internet. LLM dijalankan langsung di server lokal pabrik.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('Ollama', {
                          baseUrl: 'http://localhost:11434/v1',
                          modelId: 'llama3'
                        })}
                        style={{
                          padding: '10px 18px', borderRadius: '4px', border: 'none',
                          backgroundColor: '#334155', color: '#fff', fontSize: '0.85rem',
                          fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Zap size={16} /> Terapkan Template Ollama
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#343a40', margin: 0 }}>Langkah Menjalankan Ollama:</h3>

                      <div style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fdfdfd' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#017E84',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                        }}>1</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#212529' }}>Install Ollama di Server Lokal</div>
                          <div style={{ fontSize: '0.825rem', color: '#6c757d', lineHeight: 1.5 }}>
                            Download dan install installer Ollama dari situs resmi <a href="https://ollama.com" target="_blank" rel="noreferrer" style={{ color: '#017E84' }}>ollama.com</a>.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fdfdfd' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#017E84',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                        }}>2</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#212529' }}>Jalankan Model AI di Terminal Pabrik</div>
                          <div style={{ fontSize: '0.825rem', color: '#6c757d', lineHeight: 1.5 }}>
                            Jalankan perintah berikut di PowerShell atau Command Prompt server:
                          </div>
                          <div style={{
                            padding: '8px 12px', backgroundColor: '#212529', color: '#38d9a9',
                            borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.775rem',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px'
                          }}>
                            <span>ollama run llama3</span>
                            <button
                              type="button"
                              onClick={() => handleCopySnippet('ollama run llama3', 'ollama_cmd')}
                              style={{ background: 'none', border: 'none', color: '#adb5bd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              {copiedSnippet === 'ollama_cmd' ? <Check size={14} color="#38d9a9" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid #e9ecef', borderRadius: '6px', backgroundColor: '#fdfdfd' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#017E84',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                        }}>3</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#212529' }}>Hubungkan ke MAVI MES</div>
                          <div style={{ fontSize: '0.825rem', color: '#6c757d', lineHeight: 1.5 }}>
                            Pilih Provider <strong>Local AI (Ollama)</strong>, isi Base URL dengan <code>http://localhost:11434/v1</code> (atau IP server internal), lalu klik <strong>Verify</strong> dan <strong>SAVE</strong>.
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* SECTION 5: FAQ & TROUBLESHOOTING */}
                {guideCategory === 'faq' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div style={{ padding: '16px', borderRadius: '6px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#c92a2a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={18} /> Error: "403 / API Key not valid"
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.825rem', color: '#495057', lineHeight: 1.5 }}>
                        <strong>Penyebab:</strong> Kunci API salah ketik atau belum diaktifkan izinnya.<br />
                        <strong>Solusi:</strong> Jika menggunakan Google Gemini, buat kunci baru di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#017E84' }}>Google AI Studio</a>. Jika menggunakan Vertex AI, pastikan API <code>aiplatform.googleapis.com</code> sudah aktif pada Google Cloud Console.
                      </p>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '6px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={18} /> Error: "429 / Quota Exceeded / Resource Exhausted"
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.825rem', color: '#495057', lineHeight: 1.5 }}>
                        <strong>Penyebab:</strong> Batas limit gratis per menit (RPM/TPM) dari provider telah tercapai.<br />
                        <strong>Solusi:</strong> MAVI MES otomatis melakukan failover ke model backup. Namun untuk produksi pabrik 24/7, disarankan beralih ke <strong>Google Cloud Vertex AI</strong> dengan billing aktif untuk quota enterprise unlimited.
                      </p>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '6px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#099268', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={18} /> Di Mana Saja AI Digunakan di MAVI MES?
                      </h4>
                      <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#212529' }}>Vision Camera QC</div>
                          <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Deteksi cacat zero-shot multimodal pada produk/kemasan</div>
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#212529' }}>Builder Copilot</div>
                          <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Membuat UI, widget, dan form secara otomatis via percakapan</div>
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#212529' }}>Text-to-SQL Analytics</div>
                          <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Query data produksi OEE & downtime dengan bahasa alami</div>
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#212529' }}>Predictive Maintenance</div>
                          <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Analisis sensor getaran & suhu mesin untuk cegah breakdown</div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSettings;
