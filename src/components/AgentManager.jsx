/**
 * AI Agent Manager - Mandor MES
 * UI for managing autonomous AI agents
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, Plus, Play, Pause, Trash2, Settings, TestTube, MemoryStick,
  Send, X, ChevronDown, ChevronRight, Zap, Database, MessageSquare,
  AlertTriangle, CheckCircle, Clock, Sparkles, Save, RotateCcw, Copy
} from 'lucide-react';
import { agentManager, AGENT_TYPES, AGENT_CAPABILITIES } from '../utils/agentSystem';

// Capability categories
const CAPABILITY_CATEGORIES = {
  database: { name: 'Database', icon: Database, color: '#3b82f6' },
  communication: { name: 'Communication', icon: MessageSquare, color: '#10b981' },
  api: { name: 'API / HTTP', icon: Zap, color: '#f59e0b' },
  file: { name: 'File Operations', icon: Database, color: '#8b5cf6' },
  vision: { name: 'Vision', icon: Sparkles, color: '#ec4899' },
  control: { name: 'Control', icon: Zap, color: '#ef4444' },
  utility: { name: 'Utility', icon: Settings, color: '#6b7280' }
};

const AgentManager = () => {
  // State
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

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

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, []);

  // Auto-scroll test history
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testHistory]);

  const loadAgents = async () => {
    const allAgents = agentManager.getAllAgents();
    setAgents(allAgents);
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
        setTestHistory(prev => [...prev, { role: 'assistant', content: result.response }]);
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
                  <div className="text-xs opacity-70 mb-1">
                    {msg.role === 'user' ? 'You' : msg.role === 'error' ? 'Error' : 'Agent'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
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

  return (
    <div className="h-full flex gap-4 p-4 bg-gray-950">
      {/* Left sidebar - Agent list */}
      <div className="w-80 flex flex-col bg-gray-900 rounded-lg border border-gray-700">
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
            >
              <RotateCcw size={12} />
              Refresh
            </button>
            <button
              onClick={() => window.open('/ai-playground', '_blank')}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-400 flex items-center justify-center gap-1"
            >
              <Sparkles size={12} />
              Playground
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      {isEditing ? (
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
  );
};

export default AgentManager;
