/**
 * AI Memory & Reasoning
 * RAG Memory and Chain-of-Thought capabilities for AI Agents
 *
 * Part of Phase 3: AI Enhancements
 */

import { getSupabaseClient } from './supabaseManualDB';

// =====================================================
// VECTOR EMBEDDINGS (Simulated for browser)
// =====================================================

/**
 * Generate text embedding (simulated)
 * In production, use OpenAI embeddings or similar
 */
export async function generateEmbedding(text) {
    // Simulated embedding - replace with actual embedding API
    // Options: OpenAI, Cohere, HuggingFace
    const hash = simpleHash(text);
    const embedding = [];

    for (let i = 0; i < 1536; i++) {
        embedding.push(Math.sin(hash * i) * 0.5 + 0.5);
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
}

/**
 * Simple hash function for deterministic embeddings
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// =====================================================
// RAG MEMORY STORAGE
// =====================================================

/**
 * Store memory in Supabase
 */
export async function storeMemory(memory) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not configured');

    const { content, metadata = {}, type = 'conversation' } = memory;

    // Generate embedding
    const embedding = await generateEmbedding(content);

    const { data, error } = await supabase
        .from('ai_memories')
        .insert({
            content,
            metadata,
            type,
            embedding,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Search memories by semantic similarity
 */
export async function searchMemories(query, options = {}) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not configured');

    const { limit = 5, minSimilarity = 0.7, type } = options;

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Fetch recent memories
    let queryBuilder = supabase
        .from('ai_memories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (type) {
        queryBuilder = queryBuilder.eq('type', type);
    }

    const { data: memories, error } = await queryBuilder;

    if (error) throw error;

    // Calculate similarities
    const scored = memories.map(memory => ({
        ...memory,
        similarity: cosineSimilarity(queryEmbedding, memory.embedding || [])
    }));

    // Filter and sort
    const results = scored
        .filter(m => m.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    return results;
}

/**
 * Get conversation history
 */
export async function getConversationHistory(sessionId, options = {}) {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { limit = 20 } = options;

    let query = supabase
        .from('ai_memories')
        .select('*')
        .eq('type', 'conversation')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (sessionId) {
        query = query.eq('metadata->>sessionId', sessionId);
    }

    const { data, error } = await query;

    if (error) {
        console.warn('Failed to get conversation history:', error);
        return [];
    }

    // Return in chronological order
    return data.reverse();
}

/**
 * Clear old memories
 */
export async function clearOldMemories(daysOld = 30) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await supabase
        .from('ai_memories')
        .delete()
        .eq('type', 'conversation')
        .lt('created_at', cutoffDate.toISOString());
}

// =====================================================
// CHAIN-OF-THOUGHT REASONER
// =====================================================

/**
 * Chain-of-Thought reasoning engine
 */
export class ChainOfThoughtReasoner {
    constructor(options = {}) {
        this.maxSteps = options.maxSteps || 10;
        this.model = options.model || 'claude';
    }

    /**
     * Generate reasoning steps
     * @param {string} problem - The problem/question to solve
     * @param {Object} context - Additional context
     * @param {Function} llmCall - Function to call LLM
     * @returns {Promise<Object>} - { steps: [], conclusion: string }
     */
    async reason(problem, context = {}, llmCall) {
        const steps = [];
        let currentProblem = problem;

        for (let i = 0; i < this.maxSteps; i++) {
            // Generate next thought
            const thought = await this.generateThought(currentProblem, context, steps, llmCall);

            steps.push({
                step: i + 1,
                thought: thought.reasoning,
                action: thought.action,
                observation: thought.observation
            });

            // Check if conclusion reached
            if (thought.isConclusion) {
                return {
                    steps,
                    conclusion: thought.conclusion,
                    totalSteps: steps.length
                };
            }

            // Update problem for next iteration
            if (thought.action) {
                currentProblem = `${thought.action}\n\nPrevious thoughts:\n${steps.map(s => s.thought).join('\n\n')}`;
            }
        }

        return {
            steps,
            conclusion: steps[steps.length - 1]?.thought || 'No conclusion reached',
            totalSteps: steps.length,
            truncated: true
        };
    }

    /**
     * Generate a single thought step
     */
    async generateThought(problem, context, previousSteps, llmCall) {
        const prompt = this.buildThoughtPrompt(problem, context, previousSteps);

        const response = await llmCall(prompt);

        return this.parseThoughtResponse(response);
    }

    /**
     * Build prompt for thought generation
     */
    buildThoughtPrompt(problem, context, previousSteps) {
        const contextStr = Object.entries(context)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join('\n');

        const stepsStr = previousSteps.length > 0
            ? previousSteps.map((s, i) =>
                `Step ${i + 1}: ${s.thought}\nAction: ${s.action || 'None'}\nObservation: ${s.observation || 'None'}`
            ).join('\n\n')
            : 'No previous steps';

        return `You are a logical reasoning agent. Solve the problem step by step.

Problem: ${problem}

Context:
${contextStr}

Previous Reasoning Steps:
${stepsStr}

Respond in this format:
{
    "reasoning": "Your thought process for this step",
    "action": "What action to take next (or null if done)",
    "observation": "What you expect to observe from this action (or null)",
    "isConclusion": true/false,
    "conclusion": "Your final answer (only if isConclusion is true)"
}

Think carefully about what information is still needed.`;
    }

    /**
     * Parse LLM response into structured thought
     */
    parseThoughtResponse(response) {
        try {
            // Try to parse as JSON
            const parsed = typeof response === 'string'
                ? JSON.parse(response)
                : response;

            return {
                reasoning: parsed.reasoning || '',
                action: parsed.action || null,
                observation: parsed.observation || null,
                isConclusion: parsed.isConclusion || false,
                conclusion: parsed.conclusion || ''
            };
        } catch {
            // Fallback to text parsing
            return {
                reasoning: response,
                action: null,
                observation: null,
                isConclusion: true,
                conclusion: response
            };
        }
    }
}

// =====================================================
// AI MEMORY NODE
// =====================================================

/**
 * Memory node for workflow
 * Stores and retrieves context for AI agents
 */
export async function executeMemoryNode(nodeData, context = {}) {
    const { action, config, variables = {} } = nodeData;
    const { query, content, memoryType = 'conversation', maxResults = 5 } = config;

    switch (action) {
        case 'store':
            // Store new memory
            const memoryContent = interpolateString(content, variables);
            return storeMemory({
                content: memoryContent,
                metadata: {
                    workflowId: variables.workflowId,
                    nodeId: nodeData.id,
                    ...variables.metadata
                },
                type: memoryType
            });

        case 'retrieve':
            // Retrieve relevant memories
            const queryStr = interpolateString(query, variables);
            const memories = await searchMemories(queryStr, {
                limit: maxResults,
                type: memoryType
            });

            return {
                query: queryStr,
                memories,
                count: memories.length,
                formatted: memories
                    .map(m => `[${m.similarity?.toFixed(2)}] ${m.content}`)
                    .join('\n')
            };

        case 'history':
            // Get conversation history
            const history = await getConversationHistory(variables.sessionId, {
                limit: maxResults
            });

            return {
                history,
                count: history.length
            };

        case 'clear':
            await clearOldMemories(config.daysOld || 30);
            return { cleared: true };

        default:
            throw new Error(`Unknown memory action: ${action}`);
    }
}

// =====================================================
// AI REASONING NODE
// =====================================================

/**
 * Chain-of-Thought reasoning node for workflow
 */
export async function executeReasoningNode(nodeData, context = {}, llmCall) {
    const { config, variables = {} } = nodeData;
    const { problem, enableChainOfThought = true, maxSteps = 5 } = config;

    if (!enableChainOfThought) {
        // Simple direct reasoning
        const prompt = interpolateString(problem, variables);
        const response = await llmCall(prompt);
        return { response };
    }

    // Chain-of-Thought reasoning
    const reasoner = new ChainOfThoughtReasoner({ maxSteps });
    const result = await reasoner.reason(
        interpolateString(problem, variables),
        variables,
        llmCall
    );

    return {
        steps: result.steps,
        conclusion: result.conclusion,
        totalSteps: result.totalSteps,
        truncated: result.truncated || false
    };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function interpolateString(str, variables = {}) {
    if (!str || typeof str !== 'string') return str;

    return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const keys = path.trim().split('.');
        let value = variables;
        for (const key of keys) {
            value = value?.[key];
        }
        return value ?? match;
    });
}

/**
 * Format memories for AI context
 */
export function formatMemoriesForContext(memories, maxLength = 2000) {
    if (!memories || memories.length === 0) {
        return 'No relevant memories found.';
    }

    const formatted = memories.map((m, i) =>
        `[Memory ${i + 1}] ${m.content}`
    ).join('\n\n');

    if (formatted.length > maxLength) {
        return formatted.slice(0, maxLength) + '\n\n[Memories truncated...]';
    }

    return formatted;
}

/**
 * Create a memory session
 */
export function createMemorySession(userId, workflowId) {
    return {
        sessionId: `${userId}_${workflowId}_${Date.now()}`,
        userId,
        workflowId,
        startedAt: new Date().toISOString()
    };
}

// =====================================================
// SQL FOR MEMORIES TABLE
// =====================================================

export const MEMORIES_TABLE_SQL = `
// AI Memories table for RAG
CREATE TABLE IF NOT EXISTS public.ai_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    type TEXT DEFAULT 'conversation' CHECK (type IN ('conversation', 'knowledge', 'fact', 'preference')),
    embedding JSONB,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_memories TO anon, authenticated;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all ai_memories" ON public.ai_memories;
CREATE POLICY "Allow all ai_memories" ON public.ai_memories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Index for similarity search (approximate)
CREATE INDEX IF NOT EXISTS idx_ai_memories_type ON public.ai_memories(type);
CREATE INDEX IF NOT EXISTS idx_ai_memories_session ON public.ai_memories(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_created ON public.ai_memories(created_at DESC);
`;

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
    // Embeddings
    generateEmbedding,
    cosineSimilarity,

    // Memory
    storeMemory,
    searchMemories,
    getConversationHistory,
    clearOldMemories,
    executeMemoryNode,
    formatMemoriesForContext,
    createMemorySession,

    // Reasoning
    ChainOfThoughtReasoner,
    executeReasoningNode,

    // SQL
    MEMORIES_TABLE_SQL
};
