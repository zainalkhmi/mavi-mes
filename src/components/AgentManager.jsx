/**
 * AI Agent Manager - Mandor MES
 * UI for managing autonomous AI agents & shopfloor integrations
 * Theme: Modern Colourful Odoo Enterprise Theme (#714B67 / #017E84 / Vibrant Modules)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Plus, Play, Pause, Trash2, Settings, TestTube, MemoryStick,
  Send, X, ChevronDown, ChevronRight, Zap, Database, MessageSquare,
  AlertTriangle, CheckCircle, Clock, Sparkles, Save, RotateCcw, Copy,
  Radio, Cpu, Layers, Terminal, Check, Activity, ShieldAlert, CheckCheck, Key, ExternalLink
} from 'lucide-react';
import { agentManager, AGENT_TYPES, AGENT_CAPABILITIES, triggerAgentEvent } from '../utils/agentSystem';
import { getPrimaryAiConnector } from '../utils/database';
import VisualAgentBuilder from './VisualAgentBuilder';

// Capability categories with vibrant Odoo module color schemes
const CAPABILITY_CATEGORIES = {
  database: { name: 'Database & MES', icon: Database, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  communication: { name: 'Communication & Andon', icon: MessageSquare, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  api: { name: 'API / HTTP', icon: Zap, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  file: { name: 'File Operations', icon: Database, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  vision: { name: 'Vision & Inspection', icon: Sparkles, color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' },
  control: { name: 'PLC & Hardware', icon: Zap, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  utility: { name: 'OEE & Calculations', icon: Settings, color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' }
};

// Odoo App Icon style helper
const getAgentIconStyle = (type = '', name = '') => {
  const str = (type + ' ' + name).toLowerCase();
  if (str.includes('data') || str.includes('analyst')) {
    return {
      gradient: 'from-blue-500 via-indigo-600 to-cyan-500',
      tagBg: 'bg-blue-50 text-blue-700 border-blue-200',
      badge: 'Data & Analytics',
      activeBorder: 'border-blue-500 ring-blue-100'
    };
  }
  if (str.includes('quality') || str.includes('inspect') || str.includes('vision')) {
    return {
      gradient: 'from-emerald-500 via-teal-600 to-green-500',
      tagBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'Quality Control',
      activeBorder: 'border-emerald-500 ring-emerald-100'
    };
  }
  if (str.includes('maintenance') || str.includes('plc') || str.includes('repair')) {
    return {
      gradient: 'from-amber-500 via-orange-600 to-yellow-500',
      tagBg: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: 'Preventive Maint',
      activeBorder: 'border-amber-500 ring-amber-100'
    };
  }
  if (str.includes('plan') || str.includes('order') || str.includes('schedule')) {
    return {
      gradient: 'from-purple-500 via-fuchsia-600 to-pink-500',
      tagBg: 'bg-purple-50 text-purple-700 border-purple-200',
      badge: 'Production Plan',
      activeBorder: 'border-purple-500 ring-purple-100'
    };
  }
  if (str.includes('safety') || str.includes('ehs') || str.includes('alert')) {
    return {
      gradient: 'from-rose-500 via-red-600 to-pink-600',
      tagBg: 'bg-rose-50 text-rose-700 border-rose-200',
      badge: 'Safety & EHS',
      activeBorder: 'border-rose-500 ring-rose-100'
    };
  }
  // Signature Odoo Aubergine fallback
  return {
    gradient: 'from-[#714B67] via-[#855779] to-[#017E84]',
    tagBg: 'bg-purple-50 text-[#714B67] border-purple-200',
    badge: 'Custom Agent',
    activeBorder: 'border-[#714B67] ring-purple-100'
  };
};

const AgentManager = () => {
  const navigate = useNavigate();

  // Navigation View: 'studio' | 'visual-builder' | 'triggers'
  const [activeTab, setActiveTab] = useState('studio');

  // Central Primary AI Configuration from /ai-settings
  const [centralAiConfig, setCentralAiConfig] = useState(null);

  // State
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Trigger test logs state
  const [triggerLogs, setTriggerLogs] = useState([]);
  const [isSimulatingTrigger, setIsSimulatingTrigger] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Create/Edit form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'custom',
    systemPrompt: '',
    capabilities: [],
    config: {}
  });

  // Test mode state
  const [testInput, setTestInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  // Playground history
  const [testHistory, setTestHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Load agents & sync with central AI Settings on mount
  useEffect(() => {
    loadAgents();
    loadCentralAiConfig();

    const handleAiUpdated = (e) => {
      if (e?.detail?.connector) {
        setCentralAiConfig(e.detail.connector);
      } else {
        loadCentralAiConfig();
      }
    };

    window.addEventListener('mavicore_ai_connector_updated', handleAiUpdated);
    return () => window.removeEventListener('mavicore_ai_connector_updated', handleAiUpdated);
  }, []);

  const loadCentralAiConfig = async () => {
    try {
      const conn = await getPrimaryAiConnector();
      setCentralAiConfig(conn);
    } catch (e) {
      console.warn('Failed to load primary AI connector:', e);
    }
  };

  // Auto-scroll test history
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testHistory]);

  const loadAgents = async () => {
    const allAgents = await agentManager.loadPersistedAgents();
    setAgents(allAgents);
    if (allAgents.length > 0 && !selectedAgent) {
      setSelectedAgent(allAgents[0]);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Muat ulang 5 Template Agen Standar Odoo & Pabrik (Data Analyst, Quality, Maintenance, Planner, Safety)?')) {
      const seeded = await agentManager.seedDefaultAgents();
      setAgents(seeded);
      setSelectedAgent(seeded[0]);
      setIsEditing(false);
      setIsCreating(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      name: '',
      description: '',
      type: 'custom',
      systemPrompt: '',
      capabilities: [],
      config: {}
    });
    setSelectedAgent(null);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEdit = (agent) => {
    setFormData({
      name: agent.name,
      description: agent.description,
      type: agent.type,
      systemPrompt: agent.systemPrompt,
      capabilities: agent.capabilities,
      config: agent.config
    });
    setSelectedAgent(agent);
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Agent name is required');
      return;
    }

    if (selectedAgent) {
      agentManager.updateAgent(selectedAgent.id, {
        name: formData.name,
        description: formData.description,
        systemPrompt: formData.systemPrompt,
        capabilities: formData.capabilities,
        config: formData.config
      });
      await agentManager.saveAgentToDb({
        ...selectedAgent,
        ...formData
      });
    } else {
      await agentManager.initializeAgent({
        id: `agent_${Date.now()}`,
        ...formData
      });
      await agentManager.saveAgentToDb({
        id: `agent_${Date.now()}`,
        ...formData
      });
    }

    setIsEditing(false);
    setIsCreating(false);
    loadAgents();
  };

  const handleDelete = (agentId) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      agentManager.deleteAgent(agentId);
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(null);
        setIsTesting(false);
      }
      loadAgents();
    }
  };

  const handleSelectAgent = (agent) => {
    setSelectedAgent(agent);
    setIsTesting(false);
    setTestHistory([]);
  };

  const handleTest = () => {
    setIsTesting(true);
    setTestHistory([]);
  };

  const handleRunTest = async () => {
    if (!testInput.trim() || !selectedAgent) return;

    setIsRunning(true);
    setTestHistory(prev => [...prev, { role: 'user', content: testInput }]);

    const userInput = testInput;
    setTestInput('');

    try {
      const result = await agentManager.executeAgent(selectedAgent.id, userInput, {});

      if (result.success) {
        setTestHistory(prev => [...prev, { 
          role: 'assistant', 
          content: result.response,
          toolResults: result.toolResults
        }]);
      } else {
        setTestHistory(prev => [...prev, { role: 'error', content: `Error: ${result.error}` }]);
      }
    } catch (e) {
      setTestHistory(prev => [...prev, { role: 'error', content: `Error: ${e.message}` }]);
    }

    setIsRunning(false);
  };

  const handleApplyTemplate = (type) => {
    const agentType = AGENT_TYPES.find(t => t.id === type);
    if (agentType) {
      setFormData(prev => ({
        ...prev,
        type: agentType.id,
        systemPrompt: agentType.systemPrompt,
        capabilities: agentType.defaultCapabilities
      }));
    }
  };

  const toggleCapability = (capId) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capId)
        ? prev.capabilities.filter(c => c !== capId)
        : [...prev.capabilities, capId]
    }));
  };

  const handleDuplicatePrompt = () => {
    if (selectedAgent) {
      navigator.clipboard.writeText(selectedAgent.systemPrompt);
    }
  };

  // Render capability selector
  const renderCapabilitySelector = () => {
    const grouped = {};
    Object.entries(AGENT_CAPABILITIES).forEach(([id, cap]) => {
      const cat = cap.category || 'utility';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ id, ...cap });
    });

    return (
      <div className="mt-5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Pilih Tools & Capabilities Terintegrasi
        </label>
        <div className="space-y-3">
          {Object.entries(grouped).map(([category, caps]) => {
            const catInfo = CAPABILITY_CATEGORIES[category] || { name: category, color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
            const IconComp = catInfo.icon || Zap;
            return (
              <div key={category} className="border border-slate-200 rounded-xl p-3 bg-white shadow-2xs">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: catInfo.bg, color: catInfo.color }}>
                    <IconComp size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{catInfo.name}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {caps.map(cap => {
                    const isSelected = formData.capabilities.includes(cap.id);
                    return (
                      <label
                        key={cap.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-purple-50/70 border-[#714B67] shadow-2xs'
                            : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCapability(cap.id)}
                          className="mt-0.5 rounded text-[#714B67] accent-[#714B67] focus:ring-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-bold ${isSelected ? 'text-[#714B67]' : 'text-slate-800'} truncate`}>
                            {cap.name}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{cap.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render agent card in sidebar (Odoo Colorful App tile style)
  const renderAgentCard = (agent) => {
    const isSelected = selectedAgent?.id === agent.id;
    const iconStyle = getAgentIconStyle(agent.type, agent.name);

    return (
      <div
        key={agent.id}
        onClick={() => handleSelectAgent(agent)}
        className={`p-3 rounded-xl cursor-pointer transition-all border relative flex flex-col gap-2 ${
          isSelected
            ? `bg-purple-50/70 border-[#714B67] shadow-sm ring-1 ring-[#714B67]/20`
            : `bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs`
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconStyle.gradient} flex items-center justify-center text-white shadow-xs flex-shrink-0`}>
              <Bot size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800 text-xs truncate">{agent.name}</span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  agent.status === 'running' ? 'bg-amber-500 animate-pulse' :
                  agent.status === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
                }`} />
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{agent.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 ml-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); handleEdit(agent); }}
              className="p-1 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              title="Edit Agent"
            >
              <Settings size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(agent.id); }}
              className="p-1 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
              title="Delete Agent"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
          <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {agent.capabilities?.length || 0} tools
          </span>
          <span className="text-slate-400 font-medium">
            {agent.lastRun ? `Last: ${new Date(agent.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Ready'}
          </span>
        </div>
      </div>
    );
  };

  // Render agent detail / playground
  const renderAgentDetail = () => {
    if (!selectedAgent) return null;
    const iconStyle = getAgentIconStyle(selectedAgent.type, selectedAgent.name);

    if (isTesting) {
      return (
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconStyle.gradient} flex items-center justify-center text-white shadow-xs`}>
                <Bot size={22} />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-800 text-sm">Agent Live Playground</h2>
                <p className="text-xs text-slate-500 font-medium">{selectedAgent.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTestHistory([])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-all"
              >
                <RotateCcw size={13} />
                Clear Chat
              </button>
              <button
                onClick={() => setIsTesting(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-all"
              >
                <Settings size={13} />
                Tutup Playground
              </button>
            </div>
          </div>

          {/* Subheader: Central AI Configuration Link */}
          <div className="px-4 py-2 bg-purple-50/60 border-b border-purple-100 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${centralAiConfig?.aiSettings?.apiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-semibold">
                Engine Aktif: <strong className="text-purple-900">{centralAiConfig?.aiSettings?.provider || 'Gemini'}</strong> ({centralAiConfig?.aiSettings?.modelId || 'gemini-3.6-flash'})
              </span>
            </div>
            <button
              onClick={() => navigate('/ai-settings')}
              className="text-[#714B67] hover:text-[#52334a] hover:underline flex items-center gap-1 font-bold text-[11px]"
            >
              <Settings size={11} /> Konfigurasi AI Engine ↗
            </button>
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
            <div className="text-center text-xs text-slate-400 py-3 font-medium">
              Kirim instruksi ke agen untuk menguji eksekusi tool shopfloor dan penalaran kognitif.
            </div>
            {testHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl shadow-xs text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#714B67] text-white rounded-br-xs'
                      : msg.role === 'error'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-bl-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <div className={`text-[10px] font-bold mb-1 flex items-center justify-between ${msg.role === 'user' ? 'text-purple-200' : 'text-slate-400'}`}>
                    <span>{msg.role === 'user' ? 'Operator' : msg.role === 'error' ? 'Peringatan Error' : selectedAgent.name}</span>
                  </div>

                  {msg.toolResults && msg.toolResults.length > 0 && (
                    <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                        <Zap size={12} className="text-emerald-600" />
                        <span>Tool Shopfloor Dijalankan ({msg.toolResults.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {msg.toolResults.map((t, tidx) => (
                          <span key={tidx} className="px-2 py-0.5 bg-white text-emerald-700 border border-emerald-300 rounded-md font-mono text-[10px] font-semibold flex items-center gap-1 shadow-2xs">
                            <span>⚙️</span> {t.tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">
                    {(msg.content || '').replace(/<Action>[\s\S]*?<\/Action>/gi, '').trim() || msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isRunning && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <div className="w-2 h-2 bg-[#714B67] rounded-full animate-bounce" />
                    Agen sedang memproses instruksi & memanggil tool...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3.5 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleRunTest();
                  }
                }}
                placeholder="Tulis pesan atau instruksi untuk agen (contoh: Analisa hasil inspeksi hari ini)..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                rows={2}
                disabled={isRunning}
              />
              <button
                onClick={handleRunTest}
                disabled={!testInput.trim() || isRunning}
                className="px-4 bg-[#714B67] hover:bg-[#5b3852] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-xs transition-all cursor-pointer"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mt-1.5 text-[10px] text-slate-400">
              Tekan Enter untuk kirim, Shift+Enter untuk baris baru
            </div>
          </div>
        </div>
      );
    }

    // Agent config view (Odoo Clean & Colorful Dashboard)
    return (
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-y-auto flex flex-col">
        {/* Header Profile */}
        <div className="flex items-start justify-between pb-6 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${iconStyle.gradient} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
              <Bot size={34} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-extrabold text-slate-900">{selectedAgent.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#714B67] border border-purple-200">
                  {iconStyle.badge}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedAgent.status === 'running' ? 'bg-amber-100 text-amber-800' :
                  selectedAgent.status === 'error' ? 'bg-rose-100 text-rose-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {selectedAgent.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">{selectedAgent.description}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTest}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#714B67] to-[#8c587f] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <TestTube size={15} />
              Test Agent
            </button>
            <button
              onClick={() => handleEdit(selectedAgent)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <Settings size={15} />
              Edit
            </button>
          </div>
        </div>

        {/* Odoo Colorful KPI Metric Tiles */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 border border-blue-200/80 rounded-2xl p-4 shadow-2xs">
            <div className="text-2xl font-black text-blue-600">{selectedAgent.capabilities?.length || 0}</div>
            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mt-0.5">Capabilities & Tools</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/70 border border-emerald-200/80 rounded-2xl p-4 shadow-2xs">
            <div className="text-2xl font-black text-emerald-600">
              {agentManager.getAgent(selectedAgent.id)?.memory?.shortTerm?.length || 0}
            </div>
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mt-0.5">Memory Items</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-2xs">
            <div className="text-2xl font-black text-amber-600">
              {selectedAgent.error ? '1' : '0'}
            </div>
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mt-0.5">Errors / Alarms</div>
          </div>
        </div>

        {/* System Prompt Box */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>System Prompt & Behavior Instructions</span>
            </h3>
            <button
              onClick={handleDuplicatePrompt}
              className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 font-bold bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors"
            >
              <Copy size={12} />
              Salin Prompt
            </button>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-4 text-xs font-mono text-slate-700 border border-slate-200 whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed shadow-inner">
            {selectedAgent.systemPrompt || 'Belum ada system prompt terkonfigurasi'}
          </div>
        </div>

        {/* Capabilities Badges */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            Daftar Tools & Hak Akses Agen
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedAgent.capabilities?.map(capId => {
              const cap = AGENT_CAPABILITIES[capId];
              const cat = CAPABILITY_CATEGORIES[cap?.category];
              const Icon = cat?.icon || Zap;
              return (
                <span
                  key={capId}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-2xs transition-transform hover:scale-102"
                  style={{
                    backgroundColor: cat?.bg || '#f1f5f9',
                    color: cat?.color || '#334155',
                    borderColor: cat?.border || '#cbd5e1'
                  }}
                >
                  <Icon size={13} />
                  <span>{cat?.name || 'Tool'}</span>
                  <span className="opacity-40">•</span>
                  <span>{cap?.name || capId}</span>
                </span>
              );
            })}
            {!selectedAgent.capabilities?.length && (
              <span className="text-slate-400 text-xs italic">Belum ada capabilities yang dipilih</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render create/edit form (Odoo Clean Form Style)
  const renderForm = () => {
    return (
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-purple-100 text-[#714B67] flex items-center justify-center font-bold">
              <Bot size={18} />
            </span>
            {isCreating ? 'Buat Agen AI Baru' : `Edit Agen: ${formData.name || 'AI Agent'}`}
          </h2>
          <button
            onClick={() => { setIsEditing(false); setIsCreating(false); }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Templates */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Pilih Template Pabrik (Odoo Manufacturing Standard)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {AGENT_TYPES.filter(t => t.id !== 'custom').map(type => {
              const iconStyle = getAgentIconStyle(type.id, type.name);
              return (
                <button
                  key={type.id}
                  onClick={() => handleApplyTemplate(type.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.type === type.id
                      ? 'bg-purple-50/70 border-[#714B67] shadow-xs ring-1 ring-[#714B67]/20'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{type.icon}</span>
                    <span className="font-bold text-slate-800 text-xs truncate">{type.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nama Agen</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: Quality Inspector Part Flange"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Deskripsi Singkat</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tugas dan lingkup kerja agen di lini produksi..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">System Prompt (Instruksi Penalaran)</label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
              placeholder="Anda adalah Senior AI Agent di pabrik MAVI MES..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#714B67] focus:bg-white transition-all leading-relaxed"
              rows={7}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Instruksi ini menjadi pedoman perilaku agen saat menerima pemicu otomatis atau pesan operator.
            </p>
          </div>

          {renderCapabilitySelector()}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2.5 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => { setIsEditing(false); setIsCreating(false); }}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#714B67] hover:bg-[#5a3851] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Save size={15} />
            {selectedAgent ? 'Perbarui Agen' : 'Simpan Agen Baru'}
          </button>
        </div>
      </div>
    );
  };

  const handleSimulateTrigger = async (type, data) => {
    setIsSimulatingTrigger(true);
    const timestamp = new Date().toLocaleTimeString();
    setTriggerLogs(prev => [`[${timestamp}] 🚀 Pemicu event "${type}" dikirim ke Autonomous Engine...`, ...prev]);

    try {
      const res = await triggerAgentEvent(type, data);
      if (res.success) {
        const toolSummary = res.result?.toolResults?.length 
          ? ` (Tools Executed: ${res.result.toolResults.map(t => t.tool).join(', ')})` 
          : '';
        const completedMsg = `✅ [${new Date().toLocaleTimeString()}] Agen "${res.agentName}" berhasil merespons${toolSummary}:\n"${res.result?.response || 'Tugas selesai'}"`;
        setTriggerLogs(prev => [completedMsg, ...prev]);
      } else {
        const err = `❌ [${new Date().toLocaleTimeString()}] Gagal: ${res.error}`;
        setTriggerLogs(prev => [err, ...prev]);
      }
    } catch (e) {
      setTriggerLogs(prev => [`❌ [${new Date().toLocaleTimeString()}] Error: ${e.message}`, ...prev]);
    }
    setIsSimulatingTrigger(false);
  };

  const copyAppBuilderSnippet = () => {
    const snippet = `// Di tombol atau event OnClick / OnStepEnter di App Builder:
window.maviAgentEngine.triggerAgentEvent('APP_ACTION', {
  agentType: 'quality_inspector', // atau 'maintenance_agent', 'data_analyst'
  prompt: 'Tolong analisa foto part ini dan cek apakah toleransi diameter masih aman'
});`;
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  // Render Autonomous Triggers & App Integration View (Odoo Colorful Integration Hub)
  const renderTriggersView = () => {
    return (
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-y-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Radio className="text-emerald-600 animate-pulse" size={20} />
              Autonomous Triggers & Shopfloor App Integration
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Hubungkan AI Agents dengan kejadian otomatis di lantai pabrik (Vision, PLC, Jadwal Shift, dan Tombol App Builder).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Activity size={13} className="text-emerald-600" /> Engine Active (Live)
            </span>
          </div>
        </div>

        {/* Integration Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-200/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-2xs">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-[11px] text-orange-800 font-bold uppercase tracking-wider">Vision QuickBuild / YOLO</div>
              <div className="text-xs font-bold text-slate-800">Port 8000 & Camera RT</div>
            </div>
          </div>
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-2xs">
              <Cpu size={18} />
            </div>
            <div>
              <div className="text-[11px] text-blue-800 font-bold uppercase tracking-wider">PLC & Sensor Gateway</div>
              <div className="text-xs font-bold text-slate-800">Modbus / MQTT Telemetry</div>
            </div>
          </div>
          <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#714B67] text-white shadow-2xs">
              <Database size={18} />
            </div>
            <div>
              <div className="text-[11px] text-purple-800 font-bold uppercase tracking-wider">Shopfloor Database</div>
              <div className="text-xs font-bold text-slate-800">Work Orders & History</div>
            </div>
          </div>
        </div>

        {/* 4 Triggers Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Pre-Configured Manufacturing Triggers
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Trigger 1: Vision Defect */}
            <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-200 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">
                    EVENT: VISION_DEFECT
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">Target: Quality Inspector</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Deteksi Cacat Machine Vision</h4>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Dipicu otomatis saat pipeline QuickBuild mendeteksi cacat visual (misal goresan, gap lem sealant, atau baut hilang).
                </p>
              </div>
              <button
                onClick={() => handleSimulateTrigger('VISION_DEFECT', { stationId: 'QC-01', defect: 'Bead Glue Gap > 2.5mm', metric: 'Confidence 96.8%' })}
                disabled={isSimulatingTrigger}
                className="w-full py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Play size={13} fill="currentColor" />
                Simulasikan Defect Vision
              </button>
            </div>

            {/* Trigger 2: PLC Over-Temperature */}
            <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-200 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                    EVENT: PLC_ALARM
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">Target: Maintenance Agent</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Threshold Sensor PLC Terlampaui</h4>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Dipicu saat tag Modbus/MQTT (misal suhu motor spindle &gt; 80°C) melebihi batas toleransi aman.
                </p>
              </div>
              <button
                onClick={() => handleSimulateTrigger('PLC_ALARM', { tag: 'MTR_TEMP_SPINDLE', value: '88.5°C' })}
                disabled={isSimulatingTrigger}
                className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <ShieldAlert size={13} />
                Simulasikan Alarm Suhu Motor (88.5°C)
              </button>
            </div>

            {/* Trigger 3: Shift Handoff */}
            <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-200 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                    EVENT: SHIFT_CHANGE
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">Target: Data Analyst</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Pergantian Shift Produksi</h4>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Dipicu pada akhir shift (pukul 07:00, 15:00, 23:00) untuk merangkum OEE harian dan mengirim notifikasi email/chat.
                </p>
              </div>
              <button
                onClick={() => handleSimulateTrigger('SHIFT_CHANGE', { shift: '1' })}
                disabled={isSimulatingTrigger}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Clock size={13} />
                Picu Rangkuman Shift 1
              </button>
            </div>

            {/* Trigger 4: App Builder Snippet */}
            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    API: APP_BUILDER
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">Target: HMI Screens</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Panggil Agen dari Tombol HMI</h4>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Gunakan kode Javascript satu baris di App Builder / Checksheet untuk meminta konsultasi AI langsung dari layar stasiun operator.
                </p>
              </div>
              <button
                onClick={copyAppBuilderSnippet}
                className="w-full py-2 px-3 rounded-xl bg-[#017E84] hover:bg-[#01656a] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                {copiedSnippet ? <Check size={13} /> : <Copy size={13} />}
                {copiedSnippet ? 'Kode Tersalin ke Clipboard!' : 'Salin Snippet Kode App Builder'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Simulation Log Stream */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Terminal size={14} className="text-slate-500" />
              Live Autonomous Trigger Log Stream
            </h3>
            {triggerLogs.length > 0 && (
              <button
                onClick={() => setTriggerLogs([])}
                className="text-xs text-purple-700 hover:text-purple-900 font-bold cursor-pointer"
              >
                Hapus Log
              </button>
            )}
          </div>
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-300 max-h-56 overflow-y-auto space-y-2 shadow-inner">
            {triggerLogs.length === 0 ? (
              <div className="text-slate-500 italic">
                Belum ada pemicu trigger yang dijalankan. Klik tombol simulasi di atas untuk melihat respons otonom agen secara langsung.
              </div>
            ) : (
              triggerLogs.map((log, idx) => (
                <div key={idx} className="whitespace-pre-wrap leading-relaxed border-b border-slate-800/80 pb-1.5 last:border-b-0 text-[11px]">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#F8F9FA] p-4 text-slate-800 overflow-hidden">
      {/* Top Navigation Bar with Odoo Signature Styling */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-[#714B67] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Bot size={15} />
            Agent Studio
          </button>
          <button
            onClick={() => setActiveTab('visual-builder')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'visual-builder'
                ? 'bg-[#6366f1] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles size={15} />
            Visual Agent Builder
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-indigo-100 text-indigo-700 font-bold">Canvas</span>
          </button>
          <button
            onClick={() => setActiveTab('triggers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'triggers'
                ? 'bg-[#017E84] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Radio size={15} />
            Autonomous Triggers & App Integration
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-emerald-100 text-emerald-800 font-bold">Live</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ai-settings')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 hover:border-[#714B67] transition-all group shadow-2xs"
            title="Buka Halaman AI Configuration (Settings)"
          >
            <span className={`w-2 h-2 rounded-full ${centralAiConfig?.aiSettings?.apiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>
              AI Engine: <strong className="text-purple-900">{centralAiConfig?.aiSettings?.provider || 'Gemini'}</strong> ({centralAiConfig?.aiSettings?.modelId || 'gemini-3.6-flash'})
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white text-slate-500 border border-slate-200 flex items-center gap-1 group-hover:text-[#714B67] group-hover:border-[#714B67] transition-colors">
              <Settings size={10} /> AI Settings ↗
            </span>
          </button>
          <div className="text-xs font-bold text-slate-400">
            {agents.length} Agent Aktif
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      {activeTab === 'visual-builder' ? (
        <VisualAgentBuilder onNavigateToAiSettings={() => navigate('/ai-settings')} />
      ) : (
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left sidebar - Agent list (Odoo style cards) */}
          <div className="w-80 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm flex-shrink-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Bot size={18} className="text-[#714B67]" />
                  AI Agents
                </h2>
                <button
                  onClick={handleCreateNew}
                  className="p-1.5 bg-[#714B67] hover:bg-[#5a3851] text-white rounded-xl shadow-xs transition-all cursor-pointer"
                  title="Create new agent"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {agents.length} agent{agents.length !== 1 ? 's' : ''} configured
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {agents.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Bot size={44} className="mx-auto mb-2 opacity-30 text-[#714B67]" />
                  <p className="text-xs font-semibold">Belum ada agen terdaftar</p>
                  <button
                    onClick={handleCreateNew}
                    className="mt-2 text-xs font-bold text-[#714B67] hover:underline"
                  >
                    + Buat agen pertama
                  </button>
                </div>
              ) : (
                agents.map(renderAgentCard)
              )}
            </div>

            {/* Quick actions */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/70">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Actions</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={loadAgents}
                  className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Muat ulang status agen"
                >
                  <RotateCcw size={12} />
                  Refresh
                </button>
                <button
                  onClick={handleResetDefaults}
                  className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Muat ulang 5 Template Agen Standar Pabrik"
                >
                  <Layers size={12} />
                  Seed Defaults
                </button>
              </div>
            </div>
          </div>

          {/* Center / Right Content */}
          {activeTab === 'triggers' ? (
            renderTriggersView()
          ) : isEditing ? (
            renderForm()
          ) : selectedAgent ? (
            renderAgentDetail()
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#714B67] flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Bot size={36} />
                </div>
                <h3 className="text-base font-extrabold text-slate-800 mb-1">Pilih Agen untuk Membuka Detail</h3>
                <p className="text-xs text-slate-500 mb-4 max-w-sm">Pilih salah satu agen di daftar sebelah kiri untuk melihat hak akses tool, prompt, atau menjalankan pengujian.</p>
                <button
                  onClick={handleCreateNew}
                  className="px-4 py-2 bg-[#714B67] hover:bg-[#5b3852] text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Plus size={15} />
                  Buat Agen Baru
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentManager;
