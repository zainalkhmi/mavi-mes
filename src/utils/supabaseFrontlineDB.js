import { getSupabaseClient } from './supabaseManualDB.js';

async function getStations() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('stations').select('*').order('name');
    if (error) return [];
    return data || [];
}




export async function getTables() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('app_tables')
            .select('*')
            .order('name');
        if (error) {
            if (error.code === '42P01') return [];
            throw error;
        }
        return data || [];
    } catch (err) {
        console.warn('[Offline Mode] getTables fallback to empty');
        return [];
    }
}

/**
 * supabaseFrontlineDB.js
 * Utility functions for custom frontline apps.
 */

export async function getAllFrontlineApps() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('frontline_apps')
            .select('*')
            .order('name');

        if (error) throw error;

        return (data || []).map(app => {
            if (app.config?.iotConfig?.brokerUrl) {
                let url = app.config.iotConfig.brokerUrl;
                if (url === 'ws://broker.emqx.io:8083/mqtt') url = 'wss://broker.emqx.io:8084/mqtt';
                else if (url.startsWith('ws://') && typeof window !== 'undefined' && window.location.protocol === 'https:') {
                    url = url.replace('ws://', 'wss://');
                }
                if (url !== app.config.iotConfig.brokerUrl) {
                    return { ...app, config: { ...app.config, iotConfig: { ...app.config.iotConfig, brokerUrl: url } } };
                }
            }
            return app;
        });
    } catch (err) {
        console.error('[Supabase] Failed to fetch frontline apps:', err);
        return [];
    }
}

export async function saveFrontlineApp(app) {
    const payload = {
        name: app.name,
        category: app.category || 'Shop Floor',
        config: app.config || { components: [] },
        is_published: app.is_published ?? false,
        approval_status: app.approval_status || 'DRAFT',
        version: app.version || 1,
        updated_at: new Date().toISOString()
    };

    const supabase = getSupabaseClient();
    const saveWithPayload = async (currentPayload) => {
        if (app.id) {
            return await supabase
                .from('frontline_apps')
                .update(currentPayload)
                .eq('id', app.id)
                .select()
                .single();
        } else {
            return await supabase
                .from('frontline_apps')
                .insert({ ...currentPayload, created_at: new Date().toISOString() })
                .select()
                .single();
        }
    };

    let result = await saveWithPayload(payload);

    if (result.error && String(result.error.message || '').includes('category')) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.category;
        result = await saveWithPayload(fallbackPayload);
    }

    if (result.error) throw result.error;
    return result.data;
}

/**
 * Publish a draft to the shop floor.
 * Copies working 'config' to 'published_config'.
 */
export async function publishApp(appId) {
    const supabase = getSupabaseClient();

    // 1. Get current draft
    const { data: app, error: fetchError } = await supabase
        .from('frontline_apps')
        .select('*')
        .eq('id', appId)
        .single();

    if (fetchError) throw fetchError;

    // 2. Increment version and copy config
    let result = await supabase
        .from('frontline_apps')
        .update({
            published_config: app.config,
            is_published: true,
            approval_status: 'PUBLISHED',
            version: (app.version || 0) + 1,
            updated_at: new Date().toISOString()
        })
        .eq('id', appId)
        .select()
        .single();

    if (result.error) throw result.error;
    return result.data;
}

export async function requestApproval(appId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('frontline_apps')
        .update({
            approval_status: 'PENDING',
            updated_at: new Date().toISOString()
        })
        .eq('id', appId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function approveApp(appId, operatorId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('frontline_apps')
        .update({
            approval_status: 'APPROVED',
            approved_by: operatorId,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', appId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteFrontlineApp(id) {
    const supabase = getSupabaseClient();

    // Delete ALL child rows first to avoid FK violations

    // 1. player_sessions (player_sessions_app_id_fkey)
    try {
        const { error: sessError } = await supabase
            .from('player_sessions')
            .delete()
            .eq('app_id', id);
        if (sessError && sessError.code !== '42P01') {
            console.warn('[Delete] player_sessions cleanup warning:', sessError.message);
        }
    } catch (e) { /* table may not exist */ }

    // 2. completions (completions_app_id_fkey)
    try {
        const { error: completionsError } = await supabase
            .from('completions')
            .delete()
            .eq('app_id', id);
        if (completionsError && completionsError.code !== '42P01') {
            console.warn('[Delete] completions cleanup warning:', completionsError.message);
        }
    } catch (e) { /* table may not exist */ }

    // 3. production_queue
    try {
        const { error: queueError } = await supabase
            .from('production_queue')
            .delete()
            .eq('app_id', id);
        if (queueError && queueError.code !== '42P01') {
            console.warn('[Delete] production_queue cleanup warning:', queueError.message);
        }
    } catch (e) { /* table may not exist */ }

    // 4. audit_logs (if referencing app_id)
    try {
        const { error: auditError } = await supabase
            .from('audit_logs')
            .delete()
            .eq('app_id', id);
        if (auditError && auditError.code !== '42P01') {
            // audit_logs may not have app_id column, that's OK
        }
    } catch (e) { /* column may not exist */ }

    // Finally delete the app itself
    const { error } = await supabase
        .from('frontline_apps')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

export async function getProductionQueue() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('production_queue')
            .select('*')
            .eq('status', 'PENDING')
            .order('priority', { ascending: true })
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.warn('[Offline Mode] getProductionQueue fallback to empty');
        return [];
    }
}

export async function createProductionJob(job) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('production_queue')
        .insert([{
            work_order: job.work_order,
            app_id: job.app_id,
            target_qty: job.target_qty,
            priority: job.priority || 'P2',
            status: 'PENDING',
            created_at: new Date().toISOString()
        }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateJobStatus(id, status) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('production_queue')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Removed hardcoded DEFAULT_WORKSTATIONS to sync with Station Menu

const statusFromQueue = (rawStatus) => {
    const value = String(rawStatus || '').toUpperCase();
    if (value === 'IN_PROGRESS' || value === 'RUNNING' || value === 'ACTIVE') return 'RUNNING';
    if (value === 'DOWN') return 'DOWN';
    return 'READY';
};

const safeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const buildActiveAndons = (auditRows = []) => {
    const latestByStation = new Map();

    auditRows.forEach((row) => {
        const payload = row?.payload || {};
        const action = String(payload?.action || '').toUpperCase();
        if (action !== 'ANDON_TRIGGERED' && action !== 'ANDON_RESOLVED') return;

        const workstation = String(row?.station_id || payload?.workstation || 'N/A');
        const createdAtMs = new Date(row?.created_at || Date.now()).getTime();
        const prev = latestByStation.get(workstation);

        if (!prev || createdAtMs >= prev.createdAtMs) {
            latestByStation.set(workstation, {
                action,
                createdAtMs,
                workstation,
                category: payload?.category || 'Andon Alert',
                detail: payload?.detail || '',
                startTime: action === 'ANDON_TRIGGERED' ? createdAtMs : (prev?.startTime || createdAtMs)
            });
        }
    });

    return Array.from(latestByStation.values())
        .filter(item => item.action === 'ANDON_TRIGGERED')
        .map(item => ({
            id: `andon_${item.workstation}_${item.createdAtMs}`,
            workstation: item.workstation,
            category: item.category,
            detail: item.detail,
            startTime: item.startTime
        }))
        .sort((a, b) => b.startTime - a.startTime);
};

export async function getShopFloorRealtimeSnapshot() {
    const supabase = getSupabaseClient();

    const [queueRes, auditRes] = await Promise.all([
        supabase
            .from('production_queue')
            .select('*')
            .order('created_at', { ascending: false }),
        supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(300)
    ]);

    if (queueRes.error) throw queueRes.error;
    if (auditRes.error) throw auditRes.error;

    const queueRows = queueRes.data || [];
    const auditRows = auditRes.data || [];
    const activeAndons = buildActiveAndons(auditRows);
    const andonStationSet = new Set(activeAndons.map(a => a.workstation));
    const registeredStations = await getStations();
    const now = Date.now();

    // Extract last activity per station from audit logs
    const lastActivityMap = new Map();
    auditRows.forEach(row => {
        const stationId = row.station_id || row.payload?.workstation;
        if (!stationId || lastActivityMap.has(stationId)) return;

        lastActivityMap.set(stationId, {
            operator: row.operator_id || 'Unknown',
            appName: row.payload?.name || row.payload?.title || row.payload?.app_name || '',
            stepName: row.payload?.step_name || '',
            lastSeen: new Date(row.created_at).getTime()
        });
    });

    const stationMap = new Map(
        registeredStations.map(ws => {
            const lastActivity = lastActivityMap.get(ws.id);
            const isOnline = lastActivity ? (now - lastActivity.lastSeen < 300000) : false; // Online if activity in last 5 mins

            return [ws.id, {
                ...ws,
                status: ws.status || 'READY',
                currentJob: null,
                expectedOutput: 0,
                actualOutput: 0,
                operator: lastActivity?.operator || 'N/A',
                activeApp: lastActivity?.appName || 'None',
                activeStep: lastActivity?.stepName || 'N/A',
                isOnline,
                lastActivityTime: lastActivity?.lastSeen || null
            }];
        })
    );

    queueRows.forEach((job) => {
        const payload = job?.payload || {};
        const stationId = String(job?.station_id || payload?.station_id || payload?.workstation || '');
        if (!stationId) return;

        const base = stationMap.get(stationId) || {
            id: stationId,
            name: stationId,
            status: 'READY',
            currentJob: null,
            expectedOutput: 0,
            actualOutput: 0,
            operator: 'N/A',
            activeApp: 'None',
            activeStep: 'N/A',
            isOnline: false,
            lastActivityTime: null
        };

        if (!base.currentJob) {
            base.currentJob = job?.work_order || null;
            base.expectedOutput = safeNumber(job?.target_qty, 0);
            base.actualOutput = safeNumber(payload?.actual_output, 0);
            base.status = statusFromQueue(job?.status);

            // If job is in progress, ensure we show some activity if not in audit logs
            if (base.status === 'RUNNING' && !base.activeApp) {
                base.activeApp = job.app_id ? 'App Loading...' : 'In Progress';
            }
        }

        stationMap.set(stationId, base);
    });

    const workstations = Array.from(stationMap.values()).map((ws) => {
        let finalStatus = ws.status;
        if (andonStationSet.has(ws.id)) {
            finalStatus = 'DOWN';
        }
        return { ...ws, status: finalStatus };
    });

    const totalExpected = workstations.reduce((acc, ws) => acc + safeNumber(ws.expectedOutput), 0);
    const totalActual = workstations.reduce((acc, ws) => acc + safeNumber(ws.actualOutput), 0);
    const oee = totalExpected > 0 ? ((totalActual / totalExpected) * 100) : 0;

    return {
        workstations,
        activeAndons,
        oee: Number(oee.toFixed(1))
    };
}

export async function acknowledgeAndon({ workstation, category, detail, user = 'Supervisor' }) {
    const supabase = getSupabaseClient();
    const payload = {
        action: 'ANDON_RESOLVED',
        category: category || 'Andon Alert',
        detail: detail || '',
        resolved_by: user,
        resolved_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('audit_logs')
        .insert({
            event_type: 'ANDON_EVENT',
            operator_id: user,
            station_id: workstation || 'N/A',
            payload,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ─── App Variables ────────────────────────────────────────────────────────────

export async function getAllVariables() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('app_variables')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.warn('[Offline Mode] getAllVariables fallback to empty');
        return [];
    }
}

export async function saveVariable(variable) {
    const supabase = getSupabaseClient();
    const basePayload = {
        name: variable.name,
        type: variable.type,
        default_value: variable.defaultValue !== undefined ? JSON.stringify(variable.defaultValue) : null,
        clear_on_completion: variable.clearOnCompletion ?? true,
        save_for_analysis: variable.saveForAnalysis ?? true,
        where_used: variable.whereUsed || '-',
        updated_at: new Date().toISOString()
    };

    const payloadWithValidation = {
        ...basePayload,
        validation_rules: variable.validationRules || {}
    };

    const saveWithPayload = async (payload) => {
        if (variable.id) {
            return await supabase
                .from('app_variables')
                .update(payload)
                .eq('id', variable.id)
                .select()
                .single();
        }
        return await supabase
            .from('app_variables')
            .insert({ ...payload, created_at: new Date().toISOString() })
            .select()
            .single();
    };

    let result = await saveWithPayload(payloadWithValidation);

    // Backward compatibility if old DB schema doesn't have validation_rules yet.
    if (result.error && String(result.error.message || '').includes('validation_rules')) {
        result = await saveWithPayload(basePayload);
    }

    if (result.error) throw result.error;
    return result.data;
}

export async function deleteVariable(id) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('app_variables')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
}

// ─── Saved Analyses & Dashboards ──────────────────────────────────────────────

export async function getAllSavedAnalyses() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('saved_analyses')
        .select('*')
        .order('name');
    if (error) {
        // Fallback for missing table during initial dev
        if (error.code === '42P01') return [];
        throw error;
    }
    return data || [];
}

export async function saveAnalysis(analysis) {
    const supabase = getSupabaseClient();
    const payload = {
        name: analysis.name,
        description: analysis.description || '',
        config: analysis.config || {},
        updated_at: new Date().toISOString()
    };

    if (analysis.id) {
        const { data, error } = await supabase
            .from('saved_analyses')
            .update(payload)
            .eq('id', analysis.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase
            .from('saved_analyses')
            .insert({ ...payload, created_at: new Date().toISOString() })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
}

export async function deleteAnalysis(id) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('saved_analyses')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
}

export async function getAllDashboards() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .order('name');
    if (error) {
        if (error.code === '42P01') return [];
        throw error;
    }
    return data || [];
}

export async function saveDashboard(dashboard) {
    const supabase = getSupabaseClient();
    const payload = {
        name: dashboard.name,
        description: dashboard.description || '',
        layout: dashboard.layout || [],
        updated_at: new Date().toISOString()
    };

    if (dashboard.id) {
        const { data, error } = await supabase
            .from('dashboards')
            .update(payload)
            .eq('id', dashboard.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase
            .from('dashboards')
            .insert({ ...payload, created_at: new Date().toISOString() })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
}

export async function deleteDashboard(id) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
}

// ─── Player Session Logging ────────────────────────────────────────────────────

/**
 * Log a completed player session to Supabase.
 * Gracefully falls back to localStorage if the table doesn't exist yet.
 */
export async function logPlayerSession(session) {
    const payload = {
        app_id: session.appId || null,
        app_name: session.appName || '',
        station_id: session.stationId || null,
        station_name: session.stationName || '',
        operator: session.operator || 'Unknown',
        duration_seconds: session.durationSeconds || 0,
        step_count: session.stepCount || 0,
        dev_mode: session.devMode || false,
        comments: session.comments || [],
        started_at: session.startedAt || new Date().toISOString(),
        ended_at: new Date().toISOString(),
    };

    // Always store locally as audit trail
    try {
        const key = 'mavi_player_sessions';
        const raw = localStorage.getItem(key);
        let sessions = [];
        try { sessions = raw ? JSON.parse(raw) : []; } catch { sessions = []; }
        if (!Array.isArray(sessions)) sessions = [];
        sessions.unshift({ id: `sess_${Date.now()}`, ...payload });
        // Keep last 100 sessions locally
        localStorage.setItem(key, JSON.stringify(sessions.slice(0, 100)));
    } catch { /* noop */ }

    // Try to persist to Supabase
    try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.from('player_sessions').insert([payload]);
        if (error && error.code !== '42P01') {
            console.warn('[PlayerSession] Supabase insert failed:', error.message);
        }
    } catch (err) {
        console.warn('[PlayerSession] Supabase unavailable, session saved locally only.');
    }

    return payload;
}
