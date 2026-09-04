/**
 * VibeAgentBrain.js
 * LangGraph-based AI Agent Brain for VibeCode
 * Implements structured AI workflows with cycles and tool calling
 */

import { StateGraph, END } from '@langchain/langgraph';
import { tool } from 'ai';
import { z } from 'zod';

// ─── Tool Definitions ───────────────────────────────────────────────────────────

// File System Tools
export const fileReadTool = tool({
  description: 'Read the content of a file from the project',
  parameters: z.object({
    path: z.string().describe('File path starting with /'),
  }),
});

export const fileWriteTool = tool({
  description: 'Write or update a file in the project',
  parameters: z.object({
    path: z.string().describe('File path starting with /'),
    content: z.string().describe('Content to write'),
    append: z.boolean().optional().describe('Append to existing file'),
  }),
});

export const fileListTool = tool({
  description: 'List all files in the project',
  parameters: z.object({}),
});

// Code Analysis Tools
export const codeSearchTool = tool({
  description: 'Search for patterns in code files',
  parameters: z.object({
    pattern: z.string().describe('Regex or text pattern to search'),
    fileFilter: z.string().optional().describe('Limit to specific files'),
  }),
});

export const codeExplainTool = tool({
  description: 'Explain what a piece of code does',
  parameters: z.object({
    code: z.string().describe('Code snippet to explain'),
    context: z.string().optional().describe('Additional context'),
  }),
});

// UI Component Tools
export const uiComponentTool = tool({
  description: 'Create or update a UI component',
  parameters: z.object({
    componentType: z.enum(['button', 'card', 'chart', 'table', 'form', 'modal', 'nav', 'header', 'footer', 'sidebar']),
    props: z.record(z.any()).describe('Component properties'),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
  }),
});

export const uiStyleTool = tool({
  description: 'Apply styling to elements',
  parameters: z.object({
    selector: z.string().describe('CSS selector or element ID'),
    styles: z.record(z.string()).describe('CSS properties'),
  }),
});

// Database Tools
export const dbReadTool = tool({
  description: 'Read records from a database table',
  parameters: z.object({
    table: z.string().describe('Table name'),
    filter: z.record(z.any()).optional(),
    limit: z.number().optional(),
  }),
});

export const dbWriteTool = tool({
  description: 'Write a record to a database table',
  parameters: z.object({
    table: z.string().describe('Table name'),
    data: z.record(z.any()).describe('Data to write'),
  }),
});

export const dbSchemaTool = tool({
  description: 'Get or create database schema',
  parameters: z.object({
    action: z.enum(['get', 'create', 'update']),
    tableName: z.string(),
    fields: z.array(z.object({ name: z.string(), type: z.string() })).optional(),
  }),
});

// Preview & Testing Tools
export const previewRefreshTool = tool({
  description: 'Refresh the app preview',
  parameters: z.object({}),
});

export const previewScreenshotTool = tool({
  description: 'Take a screenshot of the preview',
  parameters: z.object({}),
});

// ─── Agent State Schema ────────────────────────────────────────────────────────

export const VibeAgentState = {
  // Input
  userMessage: string,

  // Conversation context
  messages: Array<{ role: string; content: string }>,

  // Project context
  projectFiles: Record<string, string>,
  tables: Array<{ id: string; name: string }>,

  // Current operation
  currentStep: string,
  stepHistory: Array<{ step: string; action: string; result: any }>,

  // Code generation
  generatedCode: string | null,
  codeChanges: Array<{ file: string; action: 'create' | 'update' | 'delete'; content: string }>,

  // Analysis results
  analysis: {
    intent: string | null,
    entities: Array<{ type: string; value: string }>,
    requiredComponents: Array<string>,
    requiredTables: Array<string>,
  } | null,

  // Execution tracking
  toolsUsed: Array<{ name: string; args: any; result: any }>,
  errors: Array<{ tool: string; error: string }>,

  // Output
  response: string | null,
  success: boolean,
};

// ─── Node Functions ────────────────────────────────────────────────────────────

// Analyze user intent
async function analyzeIntent(state) {
  // Use AI to analyze what the user wants
  return {
    ...state,
    currentStep: 'analyze',
    analysis: {
      intent: 'create_component', // Would be determined by AI
      entities: [],
      requiredComponents: [],
      requiredTables: [],
    }
  };
}

// Plan the execution steps
async function planExecution(state) {
  const { analysis } = state;

  // Determine what tools to use based on analysis
  const steps = [];

  if (analysis?.requiredComponents?.length > 0) {
    steps.push('generate_code');
    steps.push('write_files');
  }

  if (analysis?.requiredTables?.length > 0) {
    steps.push('create_tables');
  }

  steps.push('update_preview');
  steps.push('respond');

  return {
    ...state,
    currentStep: 'plan',
    stepHistory: [...state.stepHistory, { step: 'plan', action: 'planned', result: steps }]
  };
}

// Generate code
async function generateCode(state) {
  const { userMessage, projectFiles } = state;

  // Generate React code based on user request
  // This would call the AI with the full context

  const generatedCode = `// Generated by VibeAgent
import React from 'react';

export default function GeneratedComponent() {
  return <div>Hello from AI!</div>;
}`;

  return {
    ...state,
    currentStep: 'generate',
    generatedCode,
    stepHistory: [...state.stepHistory, { step: 'generate', action: 'code_generated', result: 'success' }]
  };
}

// Write files to project
async function writeFiles(state) {
  const { generatedCode, codeChanges } = state;

  // Apply code changes to files
  // This would update the virtual file system

  return {
    ...state,
    currentStep: 'write',
    projectFiles: { ...state.projectFiles }, // Updated
    stepHistory: [...state.stepHistory, { step: 'write', action: 'files_written', result: 'success' }]
  };
}

// Create database tables
async function createTables(state) {
  const { analysis } = state;

  return {
    ...state,
    currentStep: 'tables',
    stepHistory: [...state.stepHistory, { step: 'tables', action: 'tables_created', result: 'success' }]
  };
}

// Update preview
async function updatePreview(state) {
  return {
    ...state,
    currentStep: 'preview',
    stepHistory: [...state.stepHistory, { step: 'preview', action: 'preview_refreshed', result: 'success' }]
  };
}

// Generate response
async function respond(state) {
  return {
    ...state,
    currentStep: 'respond',
    response: 'I have created your component. Check the preview!',
    success: true,
    stepHistory: [...state.stepHistory, { step: 'respond', action: 'response_sent', result: 'success' }]
  };
}

// Error handler
async function handleError(state) {
  return {
    ...state,
    success: false,
    stepHistory: [...state.stepHistory, { step: 'error', action: 'failed', result: 'error' }]
  };
}

// ─── Conditional Edges ───────────────────────────────────────────────────────

function shouldContinue(state) {
  const { currentStep, success, errors } = state;

  if (!success || errors.length > 0) {
    return 'error';
  }

  const stepOrder = ['analyze', 'plan', 'generate', 'write', 'tables', 'preview', 'respond'];
  const currentIndex = stepOrder.indexOf(currentStep);

  if (currentIndex === -1 || currentIndex === stepOrder.length - 1) {
    return END;
  }

  return stepOrder[currentIndex + 1];
}

// ─── Create Agent Graph ──────────────────────────────────────────────────────

export function createVibeAgentGraph() {
  const workflow = new StateGraph({
    stateSchema: VibeAgentState,
  });

  // Add nodes
  workflow.addNode('analyze', analyzeIntent);
  workflow.addNode('plan', planExecution);
  workflow.addNode('generate', generateCode);
  workflow.addNode('write', writeFiles);
  workflow.addNode('tables', createTables);
  workflow.addNode('preview', updatePreview);
  workflow.addNode('respond', respond);
  workflow.addNode('error', handleError);

  // Add edges
  workflow.addEdge('analyze', 'plan');
  workflow.addConditionalEdges('plan', shouldContinue, {
    generate: 'generate',
    write: 'write',
    tables: 'tables',
    preview: 'preview',
    respond: 'respond',
    error: 'error',
    [END]: END,
  });
  workflow.addEdge('generate', 'write');
  workflow.addEdge('write', 'preview');
  workflow.addEdge('tables', 'preview');
  workflow.addEdge('preview', 'respond');
  workflow.addEdge('respond', END);
  workflow.addEdge('error', END);

  // Set entry point
  workflow.setEntryPoint('analyze');

  return workflow.compile();
}

// ─── VibeAgent Class ─────────────────────────────────────────────────────────

export class VibeAgent {
  constructor(options = {}) {
    this.graph = createVibeAgentGraph();
    this.maxIterations = options.maxIterations || 10;
    this.debug = options.debug || false;
  }

  async execute(initialState) {
    const state = {
      userMessage: '',
      messages: [],
      projectFiles: {},
      tables: [],
      currentStep: 'start',
      stepHistory: [],
      generatedCode: null,
      codeChanges: [],
      analysis: null,
      toolsUsed: [],
      errors: [],
      response: null,
      success: false,
      ...initialState,
    };

    if (this.debug) {
      console.log('[VibeAgent] Starting with state:', state);
    }

    try {
      const result = await this.graph.invoke(state, {
        recursionLimit: this.maxIterations,
      });

      if (this.debug) {
        console.log('[VibeAgent] Completed with result:', result);
      }

      return result;
    } catch (error) {
      console.error('[VibeAgent] Error:', error);
      return {
        ...state,
        errors: [...state.errors, { tool: 'agent', error: error.message }],
        success: false,
      };
    }
  }

  // Quick execution for simple requests
  async quickAsk(message, context = {}) {
    return this.execute({
      userMessage: message,
      projectFiles: context.files || {},
      tables: context.tables || [],
      messages: [{ role: 'user', content: message }],
    });
  }
}

// ─── React Hook ─────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';

export function useVibeAgent(options = {}) {
  const [state, setState] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const agent = new VibeAgent(options);

  const process = useCallback(async (message, context = {}) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await agent.execute({
        userMessage: message,
        projectFiles: context.files || {},
        tables: context.tables || [],
        messages: [{ role: 'user', content: message }],
      });

      setState(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [agent]);

  const reset = useCallback(() => {
    setState(null);
    setError(null);
  }, []);

  return {
    state,
    isProcessing,
    error,
    process,
    reset,
    // Quick helpers
    ask: (msg) => process(msg, {}),
  };
}

export default {
  VibeAgent,
  useVibeAgent,
  createVibeAgentGraph,
  // Tools
  fileReadTool,
  fileWriteTool,
  fileListTool,
  codeSearchTool,
  codeExplainTool,
  uiComponentTool,
  uiStyleTool,
  dbReadTool,
  dbWriteTool,
  dbSchemaTool,
  previewRefreshTool,
  previewScreenshotTool,
  // State
  VibeAgentState,
};
