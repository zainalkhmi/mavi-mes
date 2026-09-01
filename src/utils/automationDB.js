import { getSupabaseClient } from './supabaseManualDB';

/**
 * Automation Engine Database Module
 * Handles CRUD operations for automations, runs, steps, and credentials.
 */

/**
 * =====================================================
 * AUTOMATIONS CRUD
 * =====================================================
 */

/**
 * Get all automations for organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Array>}
 */
export const getAutomations = async (organizationId = null) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        let query = supabase
            .from('automations')
            .select('*')
            .order('updated_at', { ascending: false });

        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[AutomationDB] Failed to get automations:', error);
        throw error;
    }
};

/**
 * Get automation by ID
 * @param {string} automationId
 * @returns {Promise<Object|null>}
 */
export const getAutomationById = async (automationId) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const { data, error } = await supabase
            .from('automations')
            .select('*')
            .eq('id', automationId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[AutomationDB] Failed to get automation:', error);
        throw error;
    }
};

/**
 * Get automation with stats (using RPC function)
 * @param {string} automationId
 * @returns {Promise<Object|null>}
 */
export const getAutomationWithStats = async (automationId) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const { data, error } = await supabase
            .rpc('get_automation_with_stats', { p_automation_id: automationId })
            .single();

        if (error) {
            // Fallback to simple query if RPC not available
            console.warn('[AutomationDB] RPC not available, using simple query');
            return getAutomationById(automationId);
        }
        return data;
    } catch (error) {
        console.error('[AutomationDB] Failed to get automation with stats:', error);
        throw error;
    }
};

/**
 * Create new automation
 * @param {Object} automationData
 * @returns {Promise<Object>}
 */
export const createAutomation = async (automationData) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const { data, error } = await supabase
            .from('automations')
            .insert([
                {
                    name: automationData.name,
                    description: automationData.description || '',
                    graph_data: automationData.graphData || { nodes: [], edges: [] },
                    trigger_config: automationData.triggerConfig || {},
                    is_active: automationData.isActive || false,
                    created_by: automationData.createdBy || null,
                    organization_id: automationData.organizationId || null
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // Create initial version
        await createAutomationVersion(data.id, {
            graphData: data.graph_data,
            triggerConfig: data.trigger_config,
            changeNotes: 'Initial version',
            createdBy: automationData.createdBy
        });

        return data;
    } catch (error) {
        console.error('[AutomationDB] Failed to create automation:', error);
        throw error;
    }
};

/**
 * Update automation
 * @param {string} automationId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export const updateAutomation = async (automationId, updates) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const { data, error } = await supabase
            .from('automations')
            .update({
                name: updates.name,
                description: updates.description,
                graph_data: updates.graphData,
                trigger_config: updates.triggerConfig,
                is_active: updates.isActive,
                is_paused: updates.isPaused,
                updated_at: new Date().toISOString()
            })
            .eq('id', automationId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[AutomationDB] Failed to update automation:', error);
        throw error;
    }
};

/**
 * Delete automation
 * @param {string} automationId
 * @returns {Promise<boolean>}
 */
export const deleteAutomation = async (automationId) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const { error } = await supabase
            .from('automations')
            .delete()
            .eq('id', automationId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('[AutomationDB] Failed to delete automation:', error);
        throw error;
    }
};

/**
 * Toggle automation active status
 * @param {string} automationId
 * @param {boolean} isActive
 * @returns {Promise<Object>}
 */
export const toggleAutomationActive = async (automationId, isActive) => {
    return updateAutomation(automationId, { isActive });
};

/**
 * =====================================================
 * AUTOMATION VERSIONS
 * =====================================================
 */

/**
 * Create automation version
 * @param {string} automationId
 * @param {Object} versionData
 * @returns {Promise<Object>}
 */
export const createAutomationVersion = async (automationId, versionData) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        // Get next version number
        const { data: existing } = await supabase
            .from('automation_versions')
            .select('version')
            .eq('automation_id', automationId)
            .order('version', { ascending: false })
            .limit(1);

        const nextVersion = existing?.length > 0 ? existing[0].version + 1 : 1;

        const { data, error } = await supabase
            .from('automation_versions')
            .insert([
                {
                    automation_id: automationId,
                    version: nextVersion,
                    graph_data: versionData.graphData,
                    trigger_config: versionData.triggerConfig || {},
                    change_notes: versionData.changeNotes || '',
                    created_by: versionData.createdBy || null
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[AutomationDB] Failed to create version:', error);
        throw error;
    }
};

/**
 * Get automation version history
 * @param {string} automationId
 * @returns {Promise<Array>}
 */
export const getAutomationVersions = async (automationId) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const { data, error } = await supabase
            .from('automation_versions')
            .select('*')
            .eq('automation_id', automationId)
            .order('version', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[AutomationDB] Failed to get versions:', error);
        throw error;
    }
};

/**
 * Get specific version
 * @param {string} automationId
 * @param {number} version
 * @returns {Promise<Object|null>}
 */
export const getAutomationVersion = async (automationId, version) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const { data, error } = await supabase
            .from('automation_versions')
            .select('*')
            .eq('automation_id', automationId)
            .eq('version', version)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[AutomationDB] Failed to get version:', error);
        throw error;
    }
};

/**
 * =====================================================
 * AUTOMATION RUNS
 * =====================================================
 */

/**
 * Create new run
 * @param {string} automationId
 * @param {Object} runData
 * @returns {Promise<Object>}
 */
export const createRun = async (automationId, runData = {}) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const { data, error } = await supabase
            .from('automation_runs')
            .insert([
                {
                    automation_id: automationId,
                    status: runData.status || 'running',
                    trigger_type: runData.triggerType || 'manual',
                    trigger_event: runData.triggerEvent || {},
                    variables: runData.variables || {},
                    execution_mode: runData.executionMode || 'production'
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[AutomationDB] Failed to create run:', error);
        throw error;
    }
};

/**
 * Update run status
 * @param {string} runId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export const updateRun = async (runId, updates) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const updateData = { ...updates };

        // Calculate duration if completed
        if (updates.status && ['completed', 'failed', 'cancelled'].includes(updates.status)) {
            const { data: current } = await supabase
                .from('automation_runs')
                .select('started_at')
                .eq('id', runId)
                .single();

            if (current?.started_at) {
                updateData.completed_at = new Date().toISOString();
                updateData.duration_ms = new Date(updateData.completed_at) - new Date(current.started_at);
            }
        }

        const { data, error } = await supabase
            .from('automation_runs')
            .update(updateData)
            .eq('id', runId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[AutomationDB] Failed to update run:', error);
        throw error;
    }
};

/**
 * Get runs for automation
 * @param {string} automationId
 * @param {Object} options - { limit, status, dateFrom, dateTo }
 * @returns {Promise<Array>}
 */
export const getRuns = async (automationId, options = {}) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        let query = supabase
            .from('automation_runs')
            .select('*')
            .eq('automation_id', automationId)
            .order('started_at', { ascending: false });

        if (options.limit) {
            query = query.limit(options.limit);
        }

        if (options.status) {
            query = query.eq('status', options.status);
        }

        if (options.dateFrom) {
            query = query.gte('started_at', options.dateFrom);
        }

        if (options.dateTo) {
            query = query.lte('started_at', options.dateTo);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[AutomationDB] Failed to get runs:', error);
        throw error;
    }
};

/**
 * Get recent runs across all automations
 * @param {Object} options - { limit, status }
 * @returns {Promise<Array>}
 */
export const getRecentRuns = async (options = {}) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        let query = supabase
            .from('automation_runs')
            .select('*, automations(name, description)')
            .order('started_at', { ascending: false });

        if (options.limit) {
            query = query.limit(options.limit);
        } else {
            query = query.limit(50);
        }

        if (options.status) {
            query = query.eq('status', options.status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[AutomationDB] Failed to get recent runs:', error);
        throw error;
    }
};

/**
 * Get run by ID with steps
 * @param {string} runId
 * @returns {Promise<Object|null>}
 */
export const getRunWithSteps = async (runId) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const { data: run, error: runError } = await supabase
            .from('automation_runs')
            .select('*')
            .eq('id', runId)
            .single();

        if (runError) throw runError;

        const { data: steps, error: stepsError } = await supabase
            .from('automation_run_steps')
            .select('*')
            .eq('run_id', runId)
            .order('step_order', { ascending: true });

        if (stepsError) throw stepsError;

        return { ...run, steps: steps || [] };
    } catch (error) {
        console.error('[AutomationDB] Failed to get run with steps:', error);
        throw error;
    }
};

/**
 * =====================================================
 * AUTOMATION RUN STEPS
 * =====================================================
 */

/**
 * Log step start
 * @param {string} runId
 * @param {Object} stepData
 * @returns {Promise<Object>}
 */
export const logStepStart = async (runId, stepData) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        // Get next step order
        const { data: existing } = await supabase
            .from('automation_run_steps')
            .select('step_order')
            .eq('run_id', runId)
            .order('step_order', { ascending: false })
            .limit(1);

        const nextOrder = existing?.length > 0 ? existing[0].step_order + 1 : 0;

        const { data, error } = await supabase
            .from('automation_run_steps')
            .insert([
                {
                    run_id: runId,
                    node_id: stepData.nodeId,
                    node_name: stepData.nodeName,
                    node_type: stepData.nodeType,
                    step_order: nextOrder,
                    status: 'running',
                    input_data: stepData.inputData || {},
                    started_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[AutomationDB] Failed to log step start:', error);
        throw error;
    }
};

/**
 * Log step completion
 * @param {string} stepId
 * @param {Object} result - { status, outputData, error }
 * @returns {Promise<Object>}
 */
export const logStepComplete = async (stepId, result = {}) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const updateData = {
            status: result.status || 'completed',
            output_data: result.outputData || {},
            completed_at: new Date().toISOString()
        };

        if (result.error) {
            updateData.error = result.error;
        }

        // Calculate duration
        const { data: current } = await supabase
            .from('automation_run_steps')
            .select('started_at')
            .eq('id', stepId)
            .single();

        if (current?.started_at) {
            updateData.duration_ms = new Date(updateData.completed_at) - new Date(current.started_at);
        }

        const { data, error } = await supabase
            .from('automation_run_steps')
            .update(updateData)
            .eq('id', stepId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[AutomationDB] Failed to log step complete:', error);
        throw error;
    }
};

/**
 * Get steps for a run
 * @param {string} runId
 * @returns {Promise<Array>}
 */
export const getRunSteps = async (runId) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const { data, error } = await supabase
            .from('automation_run_steps')
            .select('*')
            .eq('run_id', runId)
            .order('step_order', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[AutomationDB] Failed to get run steps:', error);
        throw error;
    }
};

/**
 * =====================================================
 * AUTOMATION CREDENTIALS
 * =====================================================
 */

/**
 * Get all credentials
 * @param {string} organizationId
 * @param {string} type - Optional filter by type
 * @returns {Promise<Array>}
 */
export const getCredentials = async (organizationId = null, type = null) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        let query = supabase
            .from('automation_credentials')
            .select('id, name, type, config_preview, last_used_at, created_at')
            .order('created_at', { ascending: false });

        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[AutomationDB] Failed to get credentials:', error);
        throw error;
    }
};

/**
 * Get credential by ID (with encrypted config)
 * @param {string} credentialId
 * @returns {Promise<Object|null>}
 */
export const getCredentialById = async (credentialId) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const { data, error } = await supabase
            .from('automation_credentials')
            .select('*')
            .eq('id', credentialId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[AutomationDB] Failed to get credential:', error);
        throw error;
    }
};

/**
 * Create credential
 * @param {Object} credentialData
 * @returns {Promise<Object>}
 */
export const createCredential = async (credentialData) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        // Create preview (without sensitive fields)
        const preview = { ...credentialData.config };
        delete preview.password;
        delete preview.token;
        delete preview.secret;
        delete preview.apiKey;
        delete preview.privateKey;

        const { data, error } = await supabase
            .from('automation_credentials')
            .insert([
                {
                    name: credentialData.name,
                    type: credentialData.type,
                    encrypted_config: credentialData.config,
                    config_preview: preview,
                    organization_id: credentialData.organizationId || null,
                    created_by: credentialData.createdBy || null,
                    is_encrypted: true
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[AutomationDB] Failed to create credential:', error);
        throw error;
    }
};

/**
 * Update credential
 * @param {string} credentialId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export const updateCredential = async (credentialId, updates) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const updateData = { ...updates };

        // Update preview if config changed
        if (updates.config) {
            updateData.config_preview = { ...updates.config };
            delete updateData.config_preview.password;
            delete updateData.config_preview.token;
            delete updateData.config_preview.secret;
            delete updateData.config_preview.apiKey;
            delete updateData.config_preview.privateKey;
        }

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('automation_credentials')
            .update(updateData)
            .eq('id', credentialId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[AutomationDB] Failed to update credential:', error);
        throw error;
    }
};

/**
 * Delete credential
 * @param {string} credentialId
 * @returns {Promise<boolean>}
 */
export const deleteCredential = async (credentialId) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const { error } = await supabase
            .from('automation_credentials')
            .delete()
            .eq('id', credentialId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('[AutomationDB] Failed to delete credential:', error);
        throw error;
    }
};

/**
 * Update last used timestamp
 * @param {string} credentialId
 */
export const updateCredentialLastUsed = async (credentialId) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        await supabase
            .from('automation_credentials')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', credentialId);
    } catch (error) {
        console.warn('[AutomationDB] Failed to update last used:', error);
    }
};

/**
 * =====================================================
 * STATISTICS & ANALYTICS
 * =====================================================
 */

/**
 * Get automation statistics
 * @param {string} automationId
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>}
 */
export const getAutomationStats = async (automationId, days = 30) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);

        const { data, error } = await supabase
            .from('automation_runs')
            .select('status, duration_ms, started_at')
            .eq('automation_id', automationId)
            .gte('started_at', dateFrom.toISOString());

        if (error) throw error;

        const stats = {
            totalRuns: data.length,
            completed: data.filter(r => r.status === 'completed').length,
            failed: data.filter(r => r.status === 'failed').length,
            running: data.filter(r => r.status === 'running').length,
            cancelled: data.filter(r => r.status === 'cancelled').length,
            avgDurationMs: 0,
            minDurationMs: 0,
            maxDurationMs: 0
        };

        const completedDurations = data
            .filter(r => r.duration_ms && r.status === 'completed')
            .map(r => r.duration_ms);

        if (completedDurations.length > 0) {
            stats.avgDurationMs = Math.round(completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length);
            stats.minDurationMs = Math.min(...completedDurations);
            stats.maxDurationMs = Math.max(...completedDurations);
        }

        // Success rate
        stats.successRate = stats.totalRuns > 0
            ? Math.round((stats.completed / stats.totalRuns) * 100)
            : 0;

        return stats;
    } catch (error) {
        console.error('[AutomationDB] Failed to get stats:', error);
        throw error;
    }
};

/**
 * Get dashboard summary
 * @returns {Promise<Object>}
 */
export const getDashboardSummary = async () => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not configured');

        // Get counts
        const [{ count: totalAutomations }, { count: activeAutomations }] = await Promise.all([
            supabase.from('automations').select('*', { count: 'exact', head: true }),
            supabase.from('automations').select('*', { count: 'exact', head: true }).eq('is_active', true)
        ]);

        // Get today's runs
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: todayRuns } = await supabase
            .from('automation_runs')
            .select('status')
            .gte('started_at', today.toISOString());

        const todayStats = {
            total: todayRuns?.length || 0,
            completed: todayRuns?.filter(r => r.status === 'completed').length || 0,
            failed: todayRuns?.filter(r => r.status === 'failed').length || 0
        };

        // Get recent activity
        const { data: recentRuns } = await supabase
            .from('automation_runs')
            .select('*, automations(name)')
            .order('started_at', { ascending: false })
            .limit(10);

        return {
            totalAutomations: totalAutomations || 0,
            activeAutomations: activeAutomations || 0,
            todayRuns: todayStats,
            recentRuns: recentRuns || []
        };
    } catch (error) {
        console.error('[AutomationDB] Failed to get dashboard summary:', error);
        throw error;
    }
};

/**
 * =====================================================
 * UTILITY FUNCTIONS
 * =====================================================
 */

/**
 * Export automation to JSON
 * @param {string} automationId
 * @returns {Promise<Object>}
 */
export const exportAutomation = async (automationId) => {
    try {
        const automation = await getAutomationById(automationId);
        const versions = await getAutomationVersions(automationId);

        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            automation: {
                name: automation.name,
                description: automation.description,
                graphData: automation.graph_data,
                triggerConfig: automation.trigger_config
            },
            versions: versions.map(v => ({
                version: v.version,
                graphData: v.graph_data,
                createdAt: v.created_at,
                changeNotes: v.change_notes
            }))
        };
    } catch (error) {
        console.error('[AutomationDB] Failed to export automation:', error);
        throw error;
    }
};

/**
 * Import automation from JSON
 * @param {Object} exportData
 * @param {Object} options - { createNew, createdBy, organizationId }
 * @returns {Promise<Object>}
 */
export const importAutomation = async (exportData, options = {}) => {
    try {
        const automation = await createAutomation({
            name: exportData.automation.name,
            description: exportData.automation.description || '',
            graphData: exportData.automation.graphData,
            triggerConfig: exportData.automation.triggerConfig || {},
            createdBy: options.createdBy,
            organizationId: options.organizationId
        });

        return automation;
    } catch (error) {
        console.error('[AutomationDB] Failed to import automation:', error);
        throw error;
    }
};

// =====================================================
// DEFAULT EXPORT
// =====================================================
export default {
    // Automations
    getAutomations,
    getAutomationById,
    getAutomationWithStats,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomationActive,

    // Versions
    createAutomationVersion,
    getAutomationVersions,
    getAutomationVersion,

    // Runs
    createRun,
    updateRun,
    getRuns,
    getRecentRuns,
    getRunWithSteps,

    // Steps
    logStepStart,
    logStepComplete,
    getRunSteps,

    // Credentials
    getCredentials,
    getCredentialById,
    createCredential,
    updateCredential,
    deleteCredential,
    updateCredentialLastUsed,

    // Analytics
    getAutomationStats,
    getDashboardSummary,

    // Import/Export
    exportAutomation,
    importAutomation
};
