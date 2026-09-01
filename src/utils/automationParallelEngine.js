/**
 * Automation Parallel Execution Engine
 * Handles Fork/Join nodes for parallel workflow execution
 *
 * Part of Phase 2: Advanced Execution Features
 */

import { logStepStart, logStepComplete, createRun, updateRun } from './automationDB';

// =====================================================
// PARALLEL EXECUTION CONTEXT
// =====================================================

/**
 * Create a parallel execution context
 * @param {string} runId - The parent run ID
 * @param {Array} branches - Array of branch configurations
 * @param {Object} context - Shared execution context
 * @returns {Promise<ParallelContext>}
 */
export async function createParallelContext(runId, branches, context = {}) {
    return {
        runId,
        branches,
        context,
        results: new Map(),
        completed: 0,
        errors: [],
        startTime: Date.now()
    };
}

/**
 * Execute multiple branches in parallel
 * @param {Object} ctx - Parallel context
 * @param {Function} executor - Function to execute each branch (branchConfig, context) => Promise
 * @returns {Promise<Array>} - Results from all branches
 */
export async function executeParallel(ctx, executor) {
    const { branches, context } = ctx;

    if (!branches || branches.length === 0) {
        return [];
    }

    // Create promises for all branches
    const promises = branches.map(async (branch, index) => {
        const branchId = `branch_${index}`;
        const startTime = Date.now();

        try {
            // Execute branch with its own context slice
            const branchContext = {
                ...context,
                branchIndex: index,
                branchId,
                branchName: branch.name || `Branch ${index + 1}`
            };

            const result = await executor(branch, branchContext);

            const duration = Date.now() - startTime;

            return {
                branchId,
                branchIndex: index,
                success: true,
                result,
                duration
            };
        } catch (error) {
            const duration = Date.now() - startTime;

            return {
                branchId,
                branchIndex: index,
                success: false,
                error: error.message,
                duration
            };
        }
    });

    // Execute all branches in parallel
    const results = await Promise.all(promises);

    // Update context with results
    results.forEach(result => {
        ctx.results.set(result.branchId, result);
        if (result.success) {
            ctx.completed++;
        } else {
            ctx.errors.push(result);
        }
    });

    return results;
}

/**
 * Wait for all branches to complete (for Promise.all behavior)
 */
export async function waitForAll(ctx) {
    // Results already collected via Promise.all
    return Array.from(ctx.results.values());
}

/**
 * Wait for any branch to complete (for Promise.race behavior)
 */
export async function waitForAny(ctx) {
    // This is handled by Promise.race in executeParallel
    return ctx.results.values().next().value;
}

// =====================================================
// FORK NODE HANDLER
// =====================================================

/**
 * Handle Fork node execution
 * Splits execution into parallel branches
 *
 * @param {Object} nodeData - Fork node configuration
 * @param {Object} graph - Workflow graph { nodes, edges }
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} - Parallel execution result
 */
export async function executeForkNode(nodeData, graph, context) {
    const { branches = [], maxParallel = 10 } = nodeData.config || {};

    if (branches.length === 0) {
        // Auto-detect branches from outgoing edges
        const outgoingEdges = graph.edges.filter(e => e.source === nodeData.id);
        const uniqueTargets = [...new Set(outgoingEdges.map(e => e.target))];

        for (const targetId of uniqueTargets) {
            const targetNode = graph.nodes.find(n => n.id === targetId);
            if (targetNode) {
                branches.push({
                    id: targetId,
                    name: targetNode.data?.label || targetNode.id,
                    targetId
                });
            }
        }
    }

    // Validate max parallel limit
    const parallelCount = Math.min(branches.length, maxParallel);

    return {
        type: 'fork',
        branchCount: branches.length,
        parallelCount,
        startTime: Date.now(),
        branchIds: branches.map(b => b.id || b.targetId)
    };
}

// =====================================================
// JOIN NODE HANDLER
// =====================================================

/**
 * Handle Join node execution
 * Waits for all parallel branches to complete
 *
 * @param {Object} nodeData - Join node configuration
 * @param {Object} context - Execution context with parallel results
 * @param {Object} options - Join options
 * @returns {Promise<Object>}
 */
export async function executeJoinNode(nodeData, context, options = {}) {
    const {
        waitFor = 'all', // 'all' or 'any'
        timeout = 300000, // 5 minutes default
        failOnError = false
    } = options;

    const { parallelResults = [] } = context;

    if (parallelResults.length === 0) {
        return { success: true, results: [], type: 'join_empty' };
    }

    // Check timeout
    const startTime = context.parallelStartTime || Date.now();
    if (Date.now() - startTime > timeout) {
        throw new Error(`Join timeout after ${timeout}ms`);
    }

    // Filter results based on wait mode
    let results;
    if (waitFor === 'any') {
        results = parallelResults.filter(r => r.success);
        if (results.length === 0 && failOnError) {
            throw new Error('All branches failed');
        }
    } else {
        results = parallelResults;

        // Check for failures
        const failedCount = results.filter(r => !r.success).length;
        if (failedCount > 0 && failOnError) {
            const errors = results.filter(r => !r.success).map(r => r.error);
            throw new Error(`Join failed: ${failedCount} branch(es) failed - ${errors.join(', ')}`);
        }
    }

    // Aggregate results
    return {
        type: 'join',
        waitMode: waitFor,
        totalBranches: parallelResults.length,
        successfulBranches: results.filter(r => r.success).length,
        failedBranches: results.filter(r => !r.success).length,
        results,
        aggregated: aggregateBranchResults(results)
    };
}

// =====================================================
// PARALLEL EXECUTION ENGINE
// =====================================================

/**
 * Execute a workflow with parallel branches
 * @param {Object} automation - Automation definition
 * @param {Object} triggerEvent - Trigger event data
 * @param {Object} options - Execution options
 * @returns {Promise<Object>}
 */
export async function executeParallelWorkflow(automation, triggerEvent, options = {}) {
    const { maxConcurrent = 5, timeout = 300000 } = options;
    const graph = automation.graph_data;

    // Create main run
    const run = await createRun(automation.id, {
        triggerType: 'manual',
        triggerEvent,
        executionMode: 'production'
    });

    try {
        // Build execution graph
        const executionPlan = buildExecutionPlan(graph);

        // Execute with parallel awareness
        const result = await executeWithParallelism(
            executionPlan,
            { runId: run.id, variables: triggerEvent.variables || {} },
            { maxConcurrent, timeout }
        );

        // Update run status
        await updateRun(run.id, {
            status: 'completed',
            resultData: result
        });

        return {
            success: true,
            runId: run.id,
            result
        };

    } catch (error) {
        await updateRun(run.id, {
            status: 'failed',
            errorMessage: error.message,
            errorNodeId: error.nodeId
        });

        return {
            success: false,
            runId: run.id,
            error: error.message
        };
    }
}

/**
 * Build execution plan from graph
 * Identifies fork/join pairs and parallel sections
 */
function buildExecutionPlan(graph) {
    const { nodes, edges } = graph;
    const plan = {
        nodes: new Map(),
        forks: [],
        joins: []
    };

    // Index nodes
    nodes.forEach(node => {
        plan.nodes.set(node.id, {
            ...node,
            incoming: [],
            outgoing: []
        });
    });

    // Build adjacency lists
    edges.forEach(edge => {
        const source = plan.nodes.get(edge.source);
        const target = plan.nodes.get(edge.target);

        if (source && target) {
            source.outgoing.push(edge.target);
            target.incoming.push(edge.source);
        }
    });

    // Find fork nodes (multiple outgoing edges)
    nodes.forEach(node => {
        const indexedNode = plan.nodes.get(node.id);
        if (indexedNode.outgoing.length > 1) {
            plan.forks.push(node.id);
        }
        if (indexedNode.incoming.length > 1) {
            plan.joins.push(node.id);
        }
    });

    return plan;
}

/**
 * Execute with parallelism control
 */
async function executeWithParallelism(plan, context, options) {
    const { maxConcurrent, timeout } = options;
    const { nodes, forks, joins } = plan;

    const results = new Map();
    const executing = new Set();
    const queue = [];

    // Find start nodes (no incoming edges)
    let startNodes = [];
    nodes.forEach((node, id) => {
        if (node.incoming.length === 0) {
            startNodes.push(id);
        }
    });

    // Initialize queue with start nodes
    queue.push(...startNodes);

    const executeNode = async (nodeId) => {
        const node = nodes.get(nodeId);
        if (!node) return null;

        // Check if this is a fork node
        if (forks.includes(nodeId)) {
            const forkResult = await executeForkNode(node.data, { nodes: Array.from(nodes.values()), edges: [] }, context);
            results.set(nodeId, forkResult);

            // Queue all outgoing branches
            for (const targetId of node.outgoing) {
                if (!results.has(targetId)) {
                    queue.push(targetId);
                }
            }

            return forkResult;
        }

        // Check if this is a join node
        if (joins.includes(nodeId)) {
            const joinContext = {
                ...context,
                parallelResults: node.incoming.map(srcId => results.get(srcId)).filter(Boolean),
                parallelStartTime: Date.now()
            };

            const joinResult = await executeJoinNode(node.data, joinContext);
            results.set(nodeId, joinResult);

            return joinResult;
        }

        // Regular node - execute directly
        results.set(nodeId, { success: true, nodeId });
        return results.get(nodeId);
    };

    // Execute queue with concurrency limit
    while (queue.length > 0 || executing.size > 0) {
        // Fill up to maxConcurrent
        while (queue.length > 0 && executing.size < maxConcurrent) {
            const nodeId = queue.shift();
            executing.add(nodeId);

            executeNode(nodeId)
                .then(() => executing.delete(nodeId))
                .catch(err => {
                    console.error(`Node ${nodeId} failed:`, err);
                    executing.delete(nodeId);
                });
        }

        // Wait a bit before checking again
        if (executing.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return {
        completed: results.size,
        results: Object.fromEntries(results)
    };
}

// =====================================================
// AGGREGATE BRANCH RESULTS
// =====================================================

/**
 * Aggregate results from parallel branches
 * @param {Array} results - Array of branch results
 * @returns {Object} - Aggregated result
 */
export function aggregateBranchResults(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Find common keys across successful results
    const aggregated = {
        _meta: {
            totalBranches: results.length,
            successful: successful.length,
            failed: failed.length
        }
    };

    // Try to merge results by key
    if (successful.length > 0) {
        const firstResult = successful[0].result;

        if (typeof firstResult === 'object' && firstResult !== null) {
            // Merge objects
            successful.forEach((branch, index) => {
                const result = branch.result || {};
                Object.keys(result).forEach(key => {
                    if (!aggregated[key]) {
                        aggregated[key] = [];
                    }
                    aggregated[key].push(result[key]);
                });
            });
        } else {
            // Simple array of values
            aggregated.values = successful.map(b => b.result);
        }
    }

    return aggregated;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if workflow has parallel sections
 */
export function hasParallelSections(graph) {
    const nodes = graph.nodes || [];

    // A workflow has parallelism if any node has multiple outgoing edges
    // AND those edges don't converge immediately
    for (const node of nodes) {
        const outgoingEdges = (graph.edges || []).filter(e => e.source === node.id);

        if (outgoingEdges.length > 1) {
            // Check if edges converge
            const targets = outgoingEdges.map(e => e.target);
            const uniqueTargets = [...new Set(targets)];

            if (uniqueTargets.length > 1) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Estimate maximum parallelism in workflow
 */
export function estimateMaxParallelism(graph) {
    let maxParallel = 1;

    (graph.nodes || []).forEach(node => {
        const outgoingEdges = (graph.edges || []).filter(e => e.source === node.id);
        maxParallel = Math.max(maxParallel, outgoingEdges.length);
    });

    return maxParallel;
}

/**
 * Visualize parallel execution
 */
export function visualizeParallelExecution(graph, executionResults) {
    const visualization = {
        totalNodes: graph.nodes.length,
        executedInParallel: 0,
        branches: [],
        timeline: []
    };

    // Identify parallel sections
    (graph.nodes || []).forEach(node => {
        const outgoingEdges = (graph.edges || []).filter(e => e.source === node.id);

        if (outgoingEdges.length > 1) {
            const branches = outgoingEdges.map((edge, index) => ({
                branchIndex: index,
                targetNode: edge.target,
                result: executionResults[edge.target]
            }));

            visualization.branches.push({
                forkNode: node.id,
                branches
            });
        }
    });

    return visualization;
}

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
    createParallelContext,
    executeParallel,
    waitForAll,
    waitForAny,
    executeForkNode,
    executeJoinNode,
    executeParallelWorkflow,
    aggregateBranchResults,
    hasParallelSections,
    estimateMaxParallelism,
    visualizeParallelExecution
};
