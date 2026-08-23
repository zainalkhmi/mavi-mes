/**
 * AI Agent System - Mandor MES
 * Autonomous AI agents that can execute tasks, use tools, and maintain memory
 */

import * as aiService from './aiService';
import { getSupabaseClient } from './supabaseManualDB';

// Agent capabilities/tools
export const AGENT_CAPABILITIES = {
  // Data & Database
  query_database: {
    name: 'Query Database',
    description: 'Execute SQL queries to read production data',
    category: 'database',
    parameters: { sql: 'string', params: 'array' }
  },
  write_database: {
    name: 'Write to Database',
    description: 'Insert or update records in the database',
    category: 'database',
    parameters: { table: 'string', data: 'object' }
  },

  // Notifications & Communication
  send_telegram: {
    name: 'Send Telegram Message',
    description: 'Send notification via Telegram',
    category: 'communication',
    parameters: { message: 'string', chatId: 'string' }
  },
  send_whatsapp: {
    name: 'Send WhatsApp Message',
    description: 'Send notification via WhatsApp',
    category: 'communication',
    parameters: { message: 'string', phone: 'string' }
  },
  send_email: {
    name: 'Send Email',
    description: 'Send email notification',
    category: 'communication',
    parameters: { to: 'string', subject: 'string', body: 'string' }
  },

  // HTTP/API calls
  http_request: {
    name: 'HTTP Request',
    description: 'Make HTTP requests to external APIs',
    category: 'api',
    parameters: { method: 'string', url: 'string', headers: 'object', body: 'object' }
  },

  // File operations
  read_file: {
    name: 'Read File',
    description: 'Read content from a file',
    category: 'file',
    parameters: { path: 'string' }
  },
  write_file: {
    name: 'Write File',
    description: 'Write content to a file',
    category: 'file',
    parameters: { path: 'string', content: 'string' }
  },

  // Vision/Image
  analyze_image: {
    name: 'Analyze Image',
    description: 'Use AI vision to analyze images',
    category: 'vision',
    parameters: { imageUrl: 'string', prompt: 'string' }
  },

  // Control
  control_plc: {
    name: 'Control PLC',
    description: 'Write values to PLC registers',
    category: 'control',
    parameters: { address: 'string', value: 'any' }
  },

  // Calculation
  calculate: {
    name: 'Calculate',
    description: 'Perform mathematical calculations',
    category: 'utility',
    parameters: { expression: 'string' }
  }
};

// Agent types/templates
export const AGENT_TYPES = [
  {
    id: 'data_analyst',
    name: 'Data Analyst Agent',
    description: 'Analyze production data, generate insights, and create reports',
    icon: '📊',
    defaultCapabilities: ['query_database', 'calculate', 'send_email'],
    systemPrompt: `You are an expert Data Analyst Agent for a Manufacturing Execution System.
Your role is to analyze production data and provide actionable insights.
You have access to:
- Database queries for reading production data
- Calculation tools for metrics
- Email for sending reports

Always provide data-driven recommendations.`
  },
  {
    id: 'quality_inspector',
    name: 'Quality Inspector Agent',
    description: 'Review quality data, flag defects, and trigger alerts',
    icon: '🔍',
    defaultCapabilities: ['query_database', 'analyze_image', 'send_telegram'],
    systemPrompt: `You are an expert Quality Inspector Agent for a Manufacturing Execution System.
Your role is to monitor quality metrics and identify defects.
You have access to:
- Database queries for inspection data
- AI vision for image analysis
- Telegram for urgent alerts

Always prioritize product quality and safety.`
  },
  {
    id: 'maintenance_agent',
    name: 'Maintenance Agent',
    description: 'Monitor equipment health and schedule maintenance',
    icon: '🔧',
    defaultCapabilities: ['query_database', 'send_telegram', 'control_plc'],
    systemPrompt: `You are an expert Maintenance Agent for a Manufacturing Execution System.
Your role is to monitor equipment health and prevent breakdowns.
You have access to:
- Database queries for sensor data
- PLC control for emergency stops
- Telegram for maintenance alerts

Always prioritize equipment safety and uptime.`
  },
  {
    id: 'production_planner',
    name: 'Production Planner Agent',
    description: 'Optimize production schedules and resource allocation',
    icon: '📋',
    defaultCapabilities: ['query_database', 'http_request', 'send_whatsapp'],
    systemPrompt: `You are an expert Production Planner Agent for a Manufacturing Execution System.
Your role is to optimize production scheduling and resource allocation.
You have access to:
- Database queries for orders and inventory
- HTTP for ERP integration
- WhatsApp for team notifications

Always optimize for efficiency and on-time delivery.`
  },
  {
    id: 'safety_monitor',
    name: 'Safety Monitor Agent',
    description: 'Monitor safety compliance and emergency conditions',
    icon: '⚠️',
    defaultCapabilities: ['query_database', 'send_telegram', 'control_plc'],
    systemPrompt: `You are an expert Safety Monitor Agent for a Manufacturing Execution System.
Your role is to monitor safety conditions and respond to emergencies.
You have access to:
- Database queries for safety sensors
- PLC control for emergency stops
- Telegram for emergency alerts

SAFETY IS YOUR TOP PRIORITY. Always err on the side of caution.`
  },
  {
    id: 'custom',
    name: 'Custom Agent',
    description: 'Create your own AI agent with custom capabilities',
    icon: '🤖',
    defaultCapabilities: [],
    systemPrompt: `You are a custom AI Agent for a Manufacturing Execution System.
Configure your own capabilities and behavior.`
  }
];

// Agent memory management
class AgentMemory {
  constructor(agentId, maxHistory = 50) {
    this.agentId = agentId;
    this.maxHistory = maxHistory;
    this.shortTerm = []; // Recent conversation
    this.longTerm = []; // Persistent facts
    this.workingContext = {}; // Current task context
  }

  addMessage(role, content, metadata = {}) {
    this.shortTerm.push({ role, content, timestamp: Date.now(), metadata });
    if (this.shortTerm.length > this.maxHistory) {
      this.shortTerm.shift();
    }
  }

  addFact(fact, source = 'manual') {
    this.longTerm.push({ fact, source, timestamp: Date.now() });
  }

  setContext(key, value) {
    this.workingContext[key] = value;
  }

  getContext(key) {
    return this.workingContext[key];
  }

  getHistory(limit = 20) {
    return this.shortTerm.slice(-limit);
  }

  getFacts() {
    return this.longTerm;
  }

  clearHistory() {
    this.shortTerm = [];
  }

  toJSON() {
    return {
      agentId: this.agentId,
      shortTerm: this.shortTerm,
      longTerm: this.longTerm,
      workingContext: this.workingContext
    };
  }

  fromJSON(data) {
    this.shortTerm = data.shortTerm || [];
    this.longTerm = data.longTerm || [];
    this.workingContext = data.workingContext || {};
  }
}

// Main Agent Manager
class AgentManager {
  constructor() {
    this.agents = new Map();
    this.memories = new Map();
    this.listeners = new Set();
  }

  // Initialize an agent
  async initializeAgent(agentConfig) {
    const agent = {
      id: agentConfig.id,
      name: agentConfig.name,
      description: agentConfig.description,
      type: agentConfig.type,
      systemPrompt: agentConfig.systemPrompt,
      capabilities: agentConfig.capabilities || [],
      status: 'idle', // idle, running, error
      lastRun: null,
      error: null,
      config: agentConfig.config || {}
    };

    this.agents.set(agent.id, agent);
    this.memories.set(agent.id, new AgentMemory(agent.id));

    // Load persisted memory from DB if exists
    await this.loadMemory(agent.id);

    this.notifyListeners('agent_created', agent);
    return agent;
  }

  // Get agent
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  // Get all agents
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  // Update agent
  updateAgent(agentId, updates) {
    const agent = this.agents.get(agentId);
    if (agent) {
      Object.assign(agent, updates);
      this.notifyListeners('agent_updated', agent);
    }
    return agent;
  }

  // Delete agent
  deleteAgent(agentId) {
    this.agents.delete(agentId);
    this.memories.delete(agentId);
    this.notifyListeners('agent_deleted', { agentId });
  }

  // Execute agent task
  async executeAgent(agentId, task, context = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.status = 'running';
    agent.error = null;
    this.notifyListeners('agent_status', { agentId, status: 'running' });

    const memory = this.memories.get(agentId);
    memory.setContext('currentTask', task);
    memory.setContext('taskContext', context);

    try {
      // Build messages
      const messages = [
        { role: 'system', content: agent.systemPrompt },
        ...memory.getHistory().map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: `Task: ${task}\n\nContext: ${JSON.stringify(context)}` }
      ];

      // Add available tools to system prompt
      const availableTools = agent.capabilities
        .map(cap => AGENT_CAPABILITIES[cap])
        .filter(Boolean)
        .map(tool => `- ${tool.name}: ${tool.description}`)
        .join('\n');

      if (availableTools) {
        messages[0].content += `\n\nAvailable Tools:\n${availableTools}`;
        messages[0].content += `\n\nWhen you want to use a tool, respond with:\n<Action>{"tool": "tool_name", "parameters": {...}}</Action>`;
      }

      // Get AI response
      const connector = await this.getConnector();
      const response = await aiService.getChatCompletion(messages, connector);

      // Parse response and execute tools if needed
      let finalResponse = response;
      const toolResults = await this.processToolCalls(response, agent.capabilities);

      if (toolResults.length > 0) {
        // Continue conversation with tool results
        memory.addMessage('assistant', response);
        memory.addMessage('system', `Tool Results: ${JSON.stringify(toolResults)}`);

        const followUpMessages = [
          ...messages,
          { role: 'assistant', content: response },
          { role: 'user', content: `Here are the tool results:\n${toolResults.map(r => `${r.tool}: ${JSON.stringify(r.result)}`).join('\n')}\n\nProvide your final response.` }
        ];

        finalResponse = await aiService.getChatCompletion(followUpMessages, connector);
      }

      // Update memory
      memory.addMessage('user', task);
      memory.addMessage('assistant', finalResponse);

      agent.status = 'idle';
      agent.lastRun = Date.now();
      this.notifyListeners('agent_status', { agentId, status: 'idle' });
      this.notifyListeners('agent_completed', { agentId, response: finalResponse });

      // Persist memory
      await this.saveMemory(agentId);

      return { success: true, response: finalResponse, toolResults };
    } catch (error) {
      agent.status = 'error';
      agent.error = error.message;
      this.notifyListeners('agent_status', { agentId, status: 'error', error: error.message });
      return { success: false, error: error.message };
    }
  }

  // Process tool calls in response
  async processToolCalls(response, capabilities) {
    const results = [];
    const toolCallRegex = /<Action>(\{.*?\})<\/Action>/gs;
    const matches = response.match(toolCallRegex);

    if (!matches) return results;

    for (const match of matches) {
      try {
        const jsonStr = match.replace(/<Action>|<\/Action>/g, '');
        const { tool, parameters } = JSON.parse(jsonStr);

        if (!capabilities.includes(tool)) {
          results.push({ tool, error: 'Tool not available for this agent' });
          continue;
        }

        const result = await this.executeTool(tool, parameters);
        results.push({ tool, parameters, result });
      } catch (e) {
        results.push({ tool: 'unknown', error: e.message });
      }
    }

    return results;
  }

  // Execute a tool
  async executeTool(toolName, params) {
    switch (toolName) {
      case 'query_database':
        return await this.executeQuery(params.sql, params.params);

      case 'write_database':
        return await this.executeWrite(params.table, params.data);

      case 'send_telegram':
        return await this.sendTelegram(params.message, params.chatId);

      case 'send_whatsapp':
        return await this.sendWhatsApp(params.message, params.phone);

      case 'http_request':
        return await this.executeHttp(params);

      case 'analyze_image':
        return await this.analyzeImage(params.imageUrl, params.prompt);

      default:
        return { error: `Tool ${toolName} not implemented` };
    }
  }

  // Tool implementations
  async executeQuery(sql, params = []) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql, params });
      if (error) throw error;
      return { success: true, rows: data?.length || 0, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async executeWrite(table, data) {
    try {
      const supabase = getSupabaseClient();
      const { data: result, error } = await supabase.from(table).insert(data).select().single();
      if (error) throw error;
      return { success: true, id: result?.id };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async sendTelegram(message, chatId) {
    // Integration with existing Telegram service
    try {
      const { sendTelegramMessage } = await import('./whatsappService');
      const result = await sendTelegramMessage({ message, chatId });
      return { success: true, messageId: result?.message_id };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async sendWhatsApp(message, phone) {
    try {
      const { sendWhatsApp } = await import('./whatsappService');
      const result = await sendWhatsApp({ message, phone });
      return { success: true, messageId: result?.id };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async executeHttp({ method, url, headers = {}, body }) {
    try {
      const options = {
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json', ...headers }
      };
      if (body) options.body = JSON.stringify(body);

      const response = await fetch(url, options);
      const data = await response.json();
      return { success: true, status: response.status, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async analyzeImage(imageUrl, prompt) {
    try {
      const { aiService } = await import('./aiService');
      const messages = [
        { role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageUrl } }] }
      ];
      const connector = await this.getConnector();
      const response = await aiService.getChatCompletion(messages, connector);
      return { success: true, analysis: response };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async sendEmail(to, subject, body) {
    // Integration with existing email service
    return { success: true, message: `Email queued for ${to}` };
  }

  async createNotification(message, type = 'info') {
    // Show notification via existing event system
    return { success: true, message };
  }

  async getConnector() {
    const { getPrimaryAiConnector } = await import('./aiService');
    return await getPrimaryAiConnector() || { aiSettings: { provider: 'Gemini' } };
  }

  // Memory management
  async saveMemory(agentId) {
    const memory = this.memories.get(agentId);
    if (memory) {
      localStorage.setItem(`agent_memory_${agentId}`, JSON.stringify(memory.toJSON()));
    }
  }

  async loadMemory(agentId) {
    const saved = localStorage.getItem(`agent_memory_${agentId}`);
    if (saved) {
      const data = JSON.parse(saved);
      const memory = this.memories.get(agentId);
      if (memory) memory.fromJSON(data);
    }
  }

  // Event listeners
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(cb => cb(event, data));
  }

  // List agents in database
  async listSavedAgents() {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error listing agents:', e);
      return [];
    }
  }

  // Save agent to database
  async saveAgentToDb(agent) {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('ai_agents').upsert({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: agent.type,
        system_prompt: agent.systemPrompt,
        capabilities: agent.capabilities,
        config: agent.config,
        is_active: true,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Error saving agent:', e);
      return { success: false, error: e.message };
    }
  }
}

// Singleton instance
export const agentManager = new AgentManager();

// Helper: Create agent from type
export async function createAgent(type, customConfig = {}) {
  const agentType = AGENT_TYPES.find(t => t.id === type);
  if (!agentType) throw new Error(`Unknown agent type: ${type}`);

  const agentConfig = {
    id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: customConfig.name || agentType.name,
    description: customConfig.description || agentType.description,
    type: agentType.id,
    systemPrompt: customConfig.systemPrompt || agentType.systemPrompt,
    capabilities: customConfig.capabilities || agentType.defaultCapabilities,
    config: customConfig.config || {}
  };

  return await agentManager.initializeAgent(agentConfig);
}

// Helper: Run agent task
export async function runAgentTask(agentId, task, context = {}) {
  return await agentManager.executeAgent(agentId, task, context);
}

export default agentManager;
