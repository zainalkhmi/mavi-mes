import { getSupabaseClient } from './supabaseManualDB.js';

const LOCAL_APP_CACHE_KEYS = ['offline_apps_cache', 'mavi_offline_vault', 'draft_frontline_apps'];

const pruneLocalAppCaches = (appId) => {
    if (typeof window === 'undefined' || !window?.localStorage) return;

    const normalizedId = String(appId ?? '');

    LOCAL_APP_CACHE_KEYS.forEach((key) => {
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) return;

            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                const next = parsed.filter(app => String(app?.id ?? '') !== normalizedId);
                if (next.length === parsed.length) return;

                if (next.length > 0) {
                    window.localStorage.setItem(key, JSON.stringify(next));
                } else {
                    window.localStorage.removeItem(key);
                }
            } else if (parsed && typeof parsed === 'object') {
                let mutated = false;
                Object.keys(parsed).forEach((cacheKey) => {
                    const value = parsed[cacheKey];
                    if (String(cacheKey) === normalizedId || (value && String(value.id ?? '') === normalizedId)) {
                        delete parsed[cacheKey];
                        mutated = true;
                    }
                });

                if (mutated) {
                    if (Object.keys(parsed).length > 0) {
                        window.localStorage.setItem(key, JSON.stringify(parsed));
                    } else {
                        window.localStorage.removeItem(key);
                    }
                }
            }
        } catch (cacheErr) {
            console.warn(`[Cache] Failed to prune ${key}`, cacheErr);
        }
    });
};

const isNetworkError = (error) => {
    if (!error) return false;
    const message = String(error.message || error.toString() || '').toLowerCase();
    if (!message) return false;

    return (
        message.includes('failed to fetch') ||
        message.includes('fetch failed') ||
        message.includes('networkerror') ||
        message.includes('network request failed') ||
        message.includes('network timeout') ||
        message.includes('request timed out') ||
        message.includes('socket hang up') ||
        message.includes('offline') ||
        message.includes('dns') ||
        message.includes('cors')
    );
};

const isUuid = (value) => {
    if (!value || typeof value !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
};

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
    let cloudApps = [];
    let cloudError = null;

    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('frontline_apps')
            .select('*')
            .order('name');
        
        if (error) {
            cloudError = error;
            console.warn('[Supabase] Fetch failed, falling back to cache.', error);
        } else {
            cloudApps = (data || []).map(app => {
                if (app.config && app.config.iotConfig && app.config.iotConfig.brokerUrl) {
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

            // Save successfully fetched apps to offline cache
            if (typeof window !== 'undefined' && cloudApps.length > 0) {
                localStorage.setItem('offline_apps_cache', JSON.stringify(cloudApps));
            }
        }
    } catch (err) {
        cloudError = err;
        console.warn('[Offline Mode] Supabase connection failed.');
    }

    // --- UNIVERSAL MERGE LOGIC ---
    let combined = [...cloudApps];

    if (typeof window !== 'undefined') {
        const keys = ['mavi_offline_vault', 'offline_apps_cache', 'draft_frontline_apps'];
        keys.forEach(key => {
            try {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const local = JSON.parse(raw);
                    if (Array.isArray(local)) {
                        local.forEach(la => {
                            const exists = combined.find(a => String(a.id) === String(la.id));
                            if (!exists) {
                                combined.push(la);
                            } else {
                                // If local version is newer, prefer it (optional, but let's stick to cloud for now unless it's a draft)
                                if (new Date(la.updated_at) > new Date(exists.updated_at)) {
                                    const idx = combined.indexOf(exists);
                                    combined[idx] = la;
                                }
                            }
                        });
                    }
                }
            } catch (e) {
                console.error(`[Cache] Failed to parse ${key}`, e);
            }
        });
    }

    // Final Sort
    return combined.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}

export async function saveFrontlineApp(app) {
    const payload = {
        name: app.name,
        category: app.category || 'Shop Floor',
        config: app.config || { components: [] },
        // Governance fields
        is_published: app.is_published ?? false,
        approval_status: app.approval_status || 'DRAFT',
        version: app.version || 1,
        updated_at: new Date().toISOString()
    };

    try {
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

        // Backward compatibility if DB schema doesn't have category yet
        if (result.error && String(result.error.message || '').includes('category')) {
            const fallbackPayload = { ...payload };
            delete fallbackPayload.category;
            result = await saveWithPayload(fallbackPayload);
        }

        // NEW: Fallback for Enterprise Governance fields if migration hasn't been run
        if (result.error && (
            String(result.error.message || '').includes('is_published') ||
            String(result.error.message || '').includes('approval_status') ||
            String(result.error.message || '').includes('version')
        )) {
            console.warn('[Supabase] Governance columns missing, falling back to legacy save.');
            const legacyPayload = {
                name: payload.name,
                category: payload.category, // might still fail if category is also missing
                config: payload.config,
                updated_at: payload.updated_at
            };
            if (result.error && String(result.error.message || '').includes('category')) {
                delete legacyPayload.category;
            }
            result = await saveWithPayload(legacyPayload);
        }

        if (result.error) {
            console.error('[Supabase] Save failed permanently:', result.error);
            throw result.error;
        }

        // On success, sync to local cache immediately
        if (typeof window !== 'undefined') {
            try {
                const raw = localStorage.getItem('offline_apps_cache');
                let cached = [];
                try { cached = raw ? JSON.parse(raw) : []; } catch(e) { cached = []; }
                if (!Array.isArray(cached)) cached = [];
                
                const index = cached.findIndex(a => String(a.id) === String(result.data.id));
                if (index > -1) cached[index] = result.data;
                else cached.push(result.data);
                
                localStorage.setItem('offline_apps_cache', JSON.stringify(cached));
            } catch (e) {
                console.warn('[Cache] Failed to sync save result', e);
            }
        }

        return result.data;
    } catch (err) {
        console.warn('[Offline Mode] Intercepting save, applying to vault', err);
        const raw = localStorage.getItem('mavi_offline_vault');
        let cached = [];
        try { cached = raw ? JSON.parse(raw) : []; } catch(e) { cached = []; }
        if (!Array.isArray(cached)) cached = [];

        let outputApp = { ...app, ...payload };
        
        if (app.id) {
            const index = cached.findIndex(a => String(a.id) === String(app.id));
            if (index > -1) cached[index] = outputApp;
            else cached.push(outputApp);
        } else {
            const newId = `app_${Date.now()}`;
            outputApp.id = newId;
            cached.push(outputApp);
        }
        localStorage.setItem('mavi_offline_vault', JSON.stringify(cached));
        return outputApp;
    }
}

/**
 * Publish a draft to the shop floor.
 * Copies working 'config' to 'published_config'.
 */
export async function publishApp(appId) {
    try {
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
        
        // NEW: Fallback for missing governance columns
        if (result.error && (
            String(result.error.message || '').includes('published_config') ||
            String(result.error.message || '').includes('is_published') ||
            String(result.error.message || '').includes('version')
        )) {
            console.warn('[Supabase] Governance columns missing in publishApp, falling back to legacy update.');
            result = await supabase
                .from('frontline_apps')
                .update({
                    updated_at: new Date().toISOString()
                })
                .eq('id', appId)
                .select()
                .single();
        }

        if (result.error) throw result.error;
        return result.data;
    } catch (err) {
        console.warn('[Offline Mode] Intercepting publish, applying to vault', err);
        const raw = localStorage.getItem('mavi_offline_vault');
        let cached = [];
        try { cached = raw ? JSON.parse(raw) : []; } catch(e) { cached = []; }

        const index = cached.findIndex(a => String(a.id) === String(appId));
        
        if (index > -1) {
            const appData = cached[index];
            const updatedApp = {
                ...appData,
                published_config: appData.config,
                is_published: true,
                approval_status: 'PUBLISHED',
                version: (parseInt(appData.version) || 0) + 1,
                updated_at: new Date().toISOString()
            };
            cached[index] = updatedApp;
            localStorage.setItem('mavi_offline_vault', JSON.stringify(cached));
            return updatedApp;
        }
        throw err;
    }
}

export async function requestApproval(appId) {
    try {
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
    } catch (err) {
        console.warn('[Offline Mode] Intercepting request approval, applying to localStorage cache', err);
        const cached = JSON.parse(localStorage.getItem('offline_apps_cache') || '[]');
        const index = cached.findIndex(a => String(a.id) === String(appId));
        
        if (index > -1) {
            const updatedApp = {
                ...cached[index],
                approval_status: 'PENDING',
                updated_at: new Date().toISOString()
            };
            cached[index] = updatedApp;
            localStorage.setItem('offline_apps_cache', JSON.stringify(cached));
            return updatedApp;
        }
        throw err;
    }
}

export async function approveApp(appId, operatorId) {
    try {
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
    } catch (err) {
        console.warn('[Offline Mode] Intercepting approve, applying to localStorage cache', err);
        const cached = JSON.parse(localStorage.getItem('offline_apps_cache') || '[]');
        const index = cached.findIndex(a => String(a.id) === String(appId));
        
        if (index > -1) {
            const updatedApp = {
                ...cached[index],
                approval_status: 'APPROVED',
                approved_by: operatorId,
                approved_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            cached[index] = updatedApp;
            localStorage.setItem('offline_apps_cache', JSON.stringify(cached));
            return updatedApp;
        }
        throw err;
    }
}

export async function deleteFrontlineApp(id) {
    const normalizedId = String(id ?? '').trim();
    if (!normalizedId) {
        console.warn('[FrontlineApp] deleteFrontlineApp called without a valid id');
        return true;
    }

    // If the ID is not a UUID, we treat it as an offline-only draft
    if (!isUuid(normalizedId)) {
        pruneLocalAppCaches(normalizedId);
        return true;
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (clientError) {
        console.warn('[Offline Mode] Supabase client unavailable during delete, pruning local caches only.', clientError);
        pruneLocalAppCaches(normalizedId);
        return true;
    }

    try {
        // Delete dependent queue rows first to avoid FK conflicts (409 / 23503)
        // when production_queue.app_id still references this frontline app.
        const { error: queueError } = await supabase
            .from('production_queue')
            .delete()
            .eq('app_id', normalizedId);

        if (queueError) {
            // Ignore when table does not exist in older schemas, otherwise surface error.
            const isMissingTable = queueError.code === '42P01' || String(queueError.message || '').toLowerCase().includes('production_queue');
            if (!isMissingTable) throw queueError;
        }

        // Remove completion history to avoid FK conflicts with completions.app_id
        const { error: completionsError } = await supabase
            .from('completions')
            .delete()
            .eq('app_id', normalizedId);

        if (completionsError) {
            const isMissingTable = completionsError.code === '42P01' || String(completionsError.message || '').toLowerCase().includes('completions');
            if (!isMissingTable) throw completionsError;
        }

        const { error } = await supabase
            .from('frontline_apps')
            .delete()
            .eq('id', normalizedId);

        if (error) {
            const isFkConflict = error.code === '23503' || String(error.message || '').toLowerCase().includes('foreign key');
            if (isFkConflict) {
                const fkError = new Error('Cannot delete app because it is still referenced by related records. Remove dependent records first, then retry.');
                fkError.code = '23503';
                throw fkError;
            }
            throw error;
        }

        pruneLocalAppCaches(normalizedId);
        return true;
    } catch (err) {
        if (!isNetworkError(err)) {
            throw err;
        }

        console.warn('[Offline Mode] Intercepting delete, applying to local caches', err);
        pruneLocalAppCaches(normalizedId);
        return true;
    }
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
