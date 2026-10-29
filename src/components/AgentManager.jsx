/**
 * AI Agent Manager - Mandor MES
 * UI for managing autonomous AI agents & shopfloor integrations
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

// Capability categories with manufacturing labels
const CAPABILITY_CATEGORIES = {
  database: { name: 'Database & MES', icon: Database, color: '#3b82f6' },
  communication: { name: 'Communication & Andon', icon: MessageSquare, color: '#10b981' },
  api: { name: 'API / HTTP', icon: Zap, color: '#f59e0b' },
  file: { name: 'File Operations', icon: Database, color: '#8b5cf6' },
  vision: { name: 'Vision & Inspection', icon: Sparkles, color: '#ec4899' },
  control: { name: 'PLC & Hardware', icon: Zap, color: '#ef4444' },
  utility: { name: 'OEE & Calculations', icon: Settings, color: '#06b6d4' }
};

const AgentManager = () => {
  const navigate = useNavigate();

  // Navigation View: 'studio' | 'triggers'
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
  const [testOutput, setTestOutput] = useState('');
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
    if (window.confirm('Muat ulang 5 Template Agen Standar Pabrik (Data Analyst, Quality, Maintenance, Planner, Safety)?')) {
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
      // Update existing
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
      // Create new
      const agentType = AGENT_TYPES.find(t => t.id === formData.type);
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
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Capabilities</label>
        <div className="space-y-3">
          {Object.entries(grouped).map(([category, caps]) => {
            const catInfo = CAPABILITY_CATEGORIES[category] || { name: category, color: '#6b7280' };
            return (
              <div key={category} className="border border-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: catInfo.color }} />
                  <span className="text-sm font-medium text-gray-400">{catInfo.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {caps.map(cap => (
                    <label
                      key={cap.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        formData.capabilities.includes(cap.id)
                          ? 'bg-blue-900/30 border border-blue-500'
                          : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.capabilities.includes(cap.id)}
                        onChange={() => toggleCapability(cap.id)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-200 truncate">{cap.name}</div>
                        <div className="text-xs text-gray-500 truncate">{cap.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render agent card
  const renderAgentCard = (agent) => {
    const statusColors = {
      idle: 'bg-gray-500',
      running: 'bg-yellow-500 animate-pulse',
      error: 'bg-red-500'
    };

    return (
      <div
        key={agent.id}
        onClick={() => handleSelectAgent(agent)}
        className={`p-3 rounded-lg cursor-pointer transition-all ${
          selectedAgent?.id === agent.id
            ? 'bg-blue-900/30 border border-blue-500'
            : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-blue-400" />
            <span className="font-medium text-gray-200">{agent.name}</span>
            <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
          </div>
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleEdit(agent); }}
              className="p-1 hover:bg-gray-700 rounded"
              title="Edit"
            >
              <Settings size={14} className="text-gray-400" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(agent.id); }}
              className="p-1 hover:bg-red-900/50 rounded"
              title="Delete"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{agent.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-400">
            {agent.capabilities?.length || 0} tools
          </span>
          {agent.lastRun && (
            <span className="text-xs text-gray-600">
              Last run: {new Date(agent.lastRun).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render agent detail / playground
  const renderAgentDetail = () => {
    if (!selectedAgent) return null;

    if (isTesting) {
      return (
        <div className="flex-1 flex flex-col bg-gray-900 rounded-lg border border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Bot size={24} className="text-blue-400" />
              <div>
                <h2 className="font-bold text-gray-200">Agent Playground</h2>
                <p className="text-sm text-gray-500">{selectedAgent.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTestHistory([])}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                <RotateCcw size={14} />
                Clear
              </button>
              <button
                onClick={() => setIsTesting(false)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                <Settings size={14} />
                Config
              </button>
            </div>
          </div>

          {/* Subheader: Central AI Configuration Link */}
          <div className="px-4 py-2 bg-gray-800/40 border-b border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${centralAiConfig?.aiSettings?.apiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>
                Engine Terintegrasi: <strong className="text-gray-200">{centralAiConfig?.aiSettings?.provider || 'Gemini'}</strong> ({centralAiConfig?.aiSettings?.modelId || 'gemini-3.6-flash'})
              </span>
            </div>
            <button
              onClick={() => navigate('/ai-settings')}
              className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium"
            >
              <Settings size={12} /> Buka AI Settings ↗
            </button>
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-center text-sm text-gray-600 py-4">
              Test your agent by sending a message. It will use its configured tools and capabilities.
            </div>
            {testHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.role === 'error'
                        ? 'bg-red-900/50 text-red-200 border border-red-700'
                        : 'bg-gray-800 text-gray-200'
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1 flex items-center justify-between">
                    <span>{msg.role === 'user' ? 'You' : msg.role === 'error' ? 'Error' : 'Agent'}</span>
                  </div>

                  {msg.toolResults && msg.toolResults.length > 0 && (
                    <div className="mb-2.5 p-2 bg-gray-900/80 border border-emerald-500/30 rounded text-xs flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <Zap size={13} />
                        <span>Eksekusi Tool Terintegrasi ({msg.toolResults.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {msg.toolResults.map((t, tidx) => (
                          <span key={tidx} className="px-1.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 rounded font-mono text-[11px] flex items-center gap-1">
                            <span>⚙️</span> {t.tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {(msg.content || '').replace(/<Action>[\s\S]*?<\/Action>/gi, '').trim() || msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isRunning && (
              <div className="flex justify-start">
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                    Agent is thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
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
                placeholder="Send a message to test the agent..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 resize-none focus:outline-none focus:border-blue-500"
                rows={2}
                disabled={isRunning}
              />
              <button
                onClick={handleRunTest}
                disabled={!testInput.trim() || isRunning}
                className="px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg flex items-center gap-2"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      );
    }

    // Agent config view
    return (
      <div className="flex-1 bg-gray-900 rounded-lg border border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-900/50 rounded-xl flex items-center justify-center">
              <Bot size={32} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-200">{selectedAgent.name}</h2>
              <p className="text-gray-500 mt-1">{selectedAgent.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  selectedAgent.status === 'running' ? 'bg-yellow-900/50 text-yellow-400' :
                  selectedAgent.status === 'error' ? 'bg-red-900/50 text-red-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {selectedAgent.status}
                </span>
                {selectedAgent.lastRun && (
                  <span className="text-xs text-gray-600">
                    Last: {new Date(selectedAgent.lastRun).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
            >
              <TestTube size={18} />
              Test Agent
            </button>
            <button
              onClick={() => handleEdit(selectedAgent)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              <Settings size={18} />
              Edit
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{selectedAgent.capabilities?.length || 0}</div>
            <div className="text-sm text-gray-500">Capabilities</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {agentManager.getAgent(selectedAgent.id)?.memory?.shortTerm?.length || 0}
            </div>
            <div className="text-sm text-gray-500">Memory Items</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {selectedAgent.error ? '1' : '0'}
            </div>
            <div className="text-sm text-gray-500">Errors</div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-300">System Prompt</h3>
            <button
              onClick={handleDuplicatePrompt}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
            >
              <Copy size={12} />
              Copy
            </button>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {selectedAgent.systemPrompt || 'No system prompt configured'}
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <h3 className="font-medium text-gray-300 mb-3">Capabilities</h3>
          <div className="flex flex-wrap gap-2">
            {selectedAgent.capabilities?.map(capId => {
              const cap = AGENT_CAPABILITIES[capId];
              const cat = CAPABILITY_CATEGORIES[cap?.category];
              return (
                <span
                  key={capId}
                  className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  style={{ backgroundColor: `${cat?.color}20`, color: cat?.color, border: `1px solid ${cat?.color}40` }}
                >
                  {cat?.name || 'Tool'}
                  <span className="opacity-70">•</span>
                  {cap?.name || capId}
                </span>
              );
            })}
            {!selectedAgent.capabilities?.length && (
              <span className="text-gray-600 text-sm">No capabilities configured</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render create/edit form
  const renderForm = () => {
    return (
      <div className="flex-1 bg-gray-900 rounded-lg border border-gray-700 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-200">
            {isCreating ? 'Create New Agent' : 'Edit Agent'}
          </h2>
          <button
            onClick={() => { setIsEditing(false); setIsCreating(false); }}
            className="p-2 hover:bg-gray-800 rounded"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Templates */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Quick Templates</label>
          <div className="grid grid-cols-2 gap-2">
            {AGENT_TYPES.filter(t => t.id !== 'custom').map(type => (
              <button
                key={type.id}
                onClick={() => handleApplyTemplate(type.id)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  formData.type === type.id
                    ? 'bg-blue-900/30 border-blue-500'
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{type.icon}</span>
                  <span className="font-medium text-gray-200">{type.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My AI Agent"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What this agent does..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">System Prompt</label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
              placeholder="You are an expert AI agent..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
              rows={8}
            />
            <p className="mt-1 text-xs text-gray-600">
              Define the agent's personality, role, and behavior guidelines
            </p>
          </div>

          {renderCapabilitySelector()}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={() => { setIsEditing(false); setIsCreating(false); }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            <Save size={18} />
            {selectedAgent ? 'Update Agent' : 'Create Agent'}
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

  // Render Autonomous Triggers & App Integration View
  const renderTriggersView = () => {
    return (
      <div className="flex-1 bg-gray-900 rounded-lg border border-gray-700 p-6 overflow-y-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
              <Radio className="text-emerald-400 animate-pulse" size={22} />
              Autonomous Triggers & Shopfloor App Integration
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Hubungkan AI Agents dengan kejadian otomatis di lantai pabrik (Vision, PLC, Jadwal Shift, dan Tombol App Builder).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              <Activity size={13} /> Engine Active
            </span>
          </div>
        </div>

        {/* Integration Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-gray-800/60 rounded-lg border border-gray-700/60 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Vision QuickBuild / YOLO</div>
              <div className="text-sm font-bold text-gray-200">Port 8000 & Camera RT</div>
            </div>
          </div>
          <div className="p-3 bg-gray-800/60 rounded-lg border border-gray-700/60 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Cpu size={18} />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">PLC & Sensor Gateway</div>
              <div className="text-sm font-bold text-gray-200">Modbus / MQTT Telemetry</div>
            </div>
          </div>
          <div className="p-3 bg-gray-800/60 rounded-lg border border-gray-700/60 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Database size={18} />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Shopfloor Database</div>
              <div className="text-sm font-bold text-gray-200">Work Orders & History</div>
            </div>
          </div>
        </div>

        {/* 4 Triggers Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Pre-Configured Manufacturing Triggers
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trigger 1: Vision Defect */}
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    EVENT: VISION_DEFECT
                  </span>
                  <span className="text-xs text-gray-400">Target: Quality Inspector</span>
                </div>
                <h4 className="font-semibold text-gray-200 mb-1">Deteksi Cacat Machine Vision</h4>
                <p className="text-xs text-gray-400 mb-3">
                  Dipicu otomatis saat pipeline QuickBuild mendeteksi cacat visual (misal goresan, gap lem sealant, atau baut hilang).
                </p>
              </div>
              <button
                onClick={() => handleSimulateTrigger('VISION_DEFECT', { stationId: 'QC-01', defect: 'Bead Glue Gap > 2.5mm', metric: 'Confidence 96.8%' })}
                disabled={isSimulatingTrigger}
                className="w-full py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Play size={13} />
                Simulasikan Defect Vision
              </button>
            </div>

            {/* Trigger 2: PLC Over-Temperature */}
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    EVENT: PLC_ALARM
                  </span>
                  <span className="text-xs text-gray-400">Target: Maintenance Agent</span>
                </div>
                <h4 className="font-semibold text-gray-200 mb-1">Threshold Sensor PLC Terlampaui</h4>
                <p className="text-xs text-gray-400 mb-3">
                  Dipicu saat tag Modbus/MQTT (misal suhu motor spindle &gt; 80°C) melebihi batas toleransi aman.
                </p>
              </div>
              <button
                onClick={() => handleSimulateTrigger('PLC_ALARM', { tag: 'MTR_TEMP_SPINDLE', value: '88.5°C' })}
                disabled={isSimulatingTrigger}
                className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <ShieldAlert size={13} />
                Simulasikan Alarm Suhu Motor (88.5°C)
              </button>
            </div>

            {/* Trigger 3: Shift Handoff */}
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    EVENT: SHIFT_CHANGE
                  </span>
                  <span className="text-xs text-gray-400">Target: Data Analyst</span>
                </div>
                <h4 className="font-semibold text-gray-200 mb-1">Pergantian Shift Produksi</h4>
                <p className="text-xs text-gray-400 mb-3">
                  Dipicu pada akhir shift (pukul 07:00, 15:00, 23:00) untuk merangkum OEE harian dan mengirim notifikasi email/chat.
                </p>
              </div>
              <button
                onClick={() => handleSimulateTrigger('SHIFT_CHANGE', { shift: '1' })}
                disabled={isSimulatingTrigger}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Clock size={13} />
                Picu Rangkuman Shift 1
              </button>
            </div>

            {/* Trigger 4: App Builder Snippet */}
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    API: APP_BUILDER
                  </span>
                  <span className="text-xs text-gray-400">Target: HMI Screens</span>
                </div>
                <h4 className="font-semibold text-gray-200 mb-1">Panggil Agen dari Tombol HMI</h4>
                <p className="text-xs text-gray-400 mb-3">
                  Gunakan kode Javascript satu baris di App Builder / Checksheet untuk meminta konsultasi AI langsung dari layar stasiun operator.
                </p>
              </div>
              <button
                onClick={copyAppBuilderSnippet}
                className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all"
              >
                {copiedSnippet ? <Check size={13} /> : <Copy size={13} />}
                {copiedSnippet ? 'Kode Tersalin ke Clipboard!' : 'Salin Snippet Kode App Builder'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Simulation Log */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Terminal size={15} className="text-gray-400" />
              Live Autonomous Trigger Log Stream
            </h3>
            {triggerLogs.length > 0 && (
              <button
                onClick={() => setTriggerLogs([])}
                className="text-xs text-gray-500 hover:text-gray-400"
              >
                Hapus Log
              </button>
            )}
          </div>
          <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 font-mono text-xs text-gray-300 max-h-56 overflow-y-auto space-y-2">
            {triggerLogs.length === 0 ? (
              <div className="text-gray-600 italic">
                Belum ada pemicu trigger yang dijalankan. Klik tombol simulasi di atas untuk melihat respons otonom agen secara langsung.
              </div>
            ) : (
              triggerLogs.map((log, idx) => (
                <div key={idx} className="whitespace-pre-wrap leading-relaxed border-b border-gray-800/50 pb-1.5 last:border-b-0">
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
    <div className="h-full flex flex-col bg-gray-950 p-4 overflow-hidden">
      {/* Top Navigation Tabs */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'studio'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <Bot size={15} />
            Agent Studio
          </button>
          <button
            onClick={() => setActiveTab('triggers')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'triggers'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <Radio size={15} />
            Autonomous Triggers & App Integration
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-900 text-emerald-300 border border-emerald-700">Live</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ai-settings')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800/90 hover:bg-gray-750 text-gray-200 border border-gray-700 hover:border-blue-500 transition-all group"
            title="Buka Halaman AI Configuration (Settings)"
          >
            <span className={`w-2 h-2 rounded-full ${centralAiConfig?.aiSettings?.apiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>
              AI Engine: <strong className="text-blue-400">{centralAiConfig?.aiSettings?.provider || 'Gemini'}</strong> ({centralAiConfig?.aiSettings?.modelId || 'gemini-3.6-flash'})
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-700 flex items-center gap-1 group-hover:text-blue-400 group-hover:border-blue-500 transition-colors">
              <Settings size={10} /> AI Settings ↗
            </span>
          </button>
          <div className="text-xs text-gray-500">
            {agents.length} Agent Aktif di Sistem
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left sidebar - Agent list */}
        <div className="w-80 flex flex-col bg-gray-900 rounded-lg border border-gray-700 flex-shrink-0">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-200 flex items-center gap-2">
                <Bot size={20} className="text-blue-400" />
                AI Agents
              </h2>
              <button
                onClick={handleCreateNew}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                title="Create new agent"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {agents.length} agent{agents.length !== 1 ? 's' : ''} configured
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {agents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bot size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No agents yet</p>
                <button
                  onClick={handleCreateNew}
                  className="mt-3 text-sm text-blue-400 hover:text-blue-300"
                >
                  Create your first agent
                </button>
              </div>
            ) : (
              agents.map(renderAgentCard)
            )}
          </div>

          {/* Quick actions */}
          <div className="p-3 border-t border-gray-700">
            <div className="text-xs text-gray-600 mb-2">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={loadAgents}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-400 flex items-center justify-center gap-1"
                title="Muat ulang status agen"
              >
                <RotateCcw size={12} />
                Refresh
              </button>
              <button
                onClick={handleResetDefaults}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-xs text-orange-400 flex items-center justify-center gap-1"
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
          <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700">
            <div className="text-center">
              <Bot size={64} className="mx-auto mb-4 text-gray-700" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">Select an Agent</h3>
              <p className="text-gray-600 mb-4">Choose an agent from the list to view details or test</p>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 mx-auto"
              >
                <Plus size={18} />
                Create New Agent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentManager;
