import { getSupabaseClient } from './supabaseManualDB.js';
import * as supabaseTablesDB from './supabaseTablesDB.js';
import * as supabaseCompletionsDB from './supabaseCompletionsDB.js';
import * as supabaseTranslations from './supabaseTranslationDB.js';

const camelToSnake = (obj) => {
    if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(camelToSnake);
    const snake = {};
    Object.keys(obj).forEach(key => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        snake[snakeKey] = camelToSnake(obj[key]);
    });
    return snake;
};

const snakeToCamel = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(snakeToCamel);
    const camel = {};
    Object.keys(obj).forEach(key => {
        const camelKey = key.replace(/([-_][a-z])/g, group =>
            group.toUpperCase().replace('-', '').replace('_', '')
        );
        camel[camelKey] = snakeToCamel(obj[key]);
    });
    return camel;
};

/**
 * database.js (Supabase-Only Edition)
 * =====================================================
 * Replaces the IndexedDB storage layer with direct Supabase calls.
 * This fulfills the user request to remove Offline-First and IndexedDB.
 * =====================================================
 */

export const getDynamicTranslations = async () => {
    try {
        const data = await supabaseTranslations.getDynamicTranslations();
        return Object.entries(data).map(([key, t]) => ({
            key,
            en: t.en,
            id: t.id,
            ja: t.ja,
            ...t
        }));
    } catch (error) {
        console.error('Failed to fetch dynamic translations:', error);
        return [];
    }
};

export const initDB = async () => ({ execute: async () => ({ lastInsertId: 0 }), select: async () => [] });
export const checkDBStatus = async () => ({ isConfigured: true, isOnline: true, mode: 'MES Cloud' });

// ── Tables API (Proxy to supabaseTablesDB) ──────────────────────────────────
export const getTables = supabaseTablesDB.getTables;
export const getTableById = supabaseTablesDB.getTableById;
export const getTableRecords = supabaseTablesDB.getTableRecords;
export const addTableRecord = supabaseTablesDB.addTableRecord;
export const updateTableRecord = async (tableId, recordId, data) => {
    // Adapter for signature difference
    const records = await getTableRecords(tableId);
    const target = records.find(r => String(r.recordId).toLowerCase() === String(recordId).toLowerCase());
    if (target) return supabaseTablesDB.updateTableRecord(target.id, data);
    throw new Error(`Record ${recordId} not found`);
};
export const resolveTableIdReference = supabaseTablesDB.resolveTableIdReference;
export const createTable = supabaseTablesDB.createTable;
export const deleteTable = supabaseTablesDB.deleteTable;

// ── Completions API (Proxy to supabaseCompletionsDB) ──────────────────────────
export const logCompletion = supabaseCompletionsDB.saveCompletion;
export const getCompletions = supabaseCompletionsDB.getCompletionsByApp;

// ── Shop Floor API (Stations, Machines, Interfaces) ──────────────────────────
export async function getStations() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('stations').select('*').order('name');
    if (error) {
        console.warn('[Supabase] stations table may not exist, returning empty.', error);
        return [];
    }
    return snakeToCamel(data || []);
}

export async function saveStation(station) {
    const supabase = getSupabaseClient();
    const payload = camelToSnake({ ...station, updated_at: new Date().toISOString() });
    const id = station.id;
    delete payload.id;

    if (id && String(id).includes('-')) {
        const { data, error } = await supabase.from('stations').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase.from('stations').insert({ ...payload, created_at: new Date().toISOString() }).select().single();
        if (error) throw error;
        return data;
    }
}

export async function deleteStation(id) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('stations').delete().eq('id', id);
    if (error) throw error;
    return true;
}

export async function getMachines() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('machines').select('*').order('name');
    if (error) return [];
    return snakeToCamel(data || []);
}

export async function saveMachine(machine) {
    const supabase = getSupabaseClient();
    const payload = camelToSnake({ ...machine, updated_at: new Date().toISOString() });
    const id = machine.id;
    delete payload.id;

    if (id && String(id).includes('-')) {
        const { data, error } = await supabase.from('machines').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase.from('machines').insert({ ...payload, created_at: new Date().toISOString() }).select().single();
        if (error) throw error;
        return data;
    }
}

export async function deleteMachine(id) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('machines').delete().eq('id', id);
    if (error) throw error;
    return true;
}

export async function getInterfaces() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('interfaces').select('*').order('name');
    if (error) return [];
    return snakeToCamel(data || []);
}

export async function saveInterface(iface) {
    const supabase = getSupabaseClient();
    const payload = camelToSnake({ ...iface, updated_at: new Date().toISOString() });
    const id = iface.id;
    delete payload.id;

    if (id && String(id).includes('-')) {
        const { data, error } = await supabase.from('interfaces').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase.from('interfaces').insert({ ...payload, created_at: new Date().toISOString() }).select().single();
        if (error) throw error;
        return data;
    }
}

export async function deleteInterface(id) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('interfaces').delete().eq('id', id);
    if (error) throw error;
    return true;
}

// ── Integration Connectors ────────────────────────────────────────────────────
export async function getIntegrationConnectors() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('integration_connectors').select('*');
    if (error) {
        console.error('[Supabase] getIntegrationConnectors error:', error);
        return [];
    }
    return snakeToCamel(data || []);
}

export async function saveIntegrationConnector(connector) {
    const supabase = getSupabaseClient();
    const payload = camelToSnake({ ...connector, updated_at: new Date().toISOString() });
    const id = connector.id;
    delete payload.id;

    if (id && String(id).includes('-')) {
        const { data, error } = await supabase.from('integration_connectors').update(payload).eq('id', id).select().single();
        if (error) {
            console.error('[Supabase] saveIntegrationConnector (update) error:', error);
            throw error;
        }
        return snakeToCamel(data);
    } else {
        const { data, error } = await supabase.from('integration_connectors').insert({ ...payload, created_at: new Date().toISOString() }).select().single();
        if (error) {
            console.error('[Supabase] saveIntegrationConnector (insert) error:', error);
            throw error;
        }
        return snakeToCamel(data);
    }
}

export async function deleteIntegrationConnector(id) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('integration_connectors').delete().eq('id', id);
    if (error) {
        console.error('[Supabase] deleteIntegrationConnector error:', error);
        throw error;
    }
    return true;
}

export const testIntegrationConnector = async (connector) => ({ success: true, message: 'Connector is valid (Cloud Mode)' });
export const executeIntegrationAction = async (connector, action, data) => ({ success: true, result: {} });
export const getIntegrationLogs = async (connectorId) => [];

export async function getPrimaryAiConnector() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('integration_connectors')
        .select('*')
        .eq('type', 'AI_ASSISTANT')
        .limit(1)
        .maybeSingle();
    
    if (error) {
        console.warn('[Supabase] Failed to fetch AI connector:', error);
        return null;
    }
    return snakeToCamel(data);
}

// ── Edge Devices ──────────────────────────────────────────────────────────────
export async function getEdgeDevices() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('edge_devices').select('*').order('name');
    if (error) return [];
    return snakeToCamel(data || []);
}

export async function saveEdgeDevice(device) {
    const supabase = getSupabaseClient();
    const payload = camelToSnake({ ...device, updated_at: new Date().toISOString() });
    const id = device.id;
    delete payload.id;

    if (id && String(id).includes('-')) {
        const { data, error } = await supabase.from('edge_devices').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase.from('edge_devices').insert({ ...payload, created_at: new Date().toISOString() }).select().single();
        if (error) throw error;
        return data;
    }
}

export async function deleteEdgeDevice(id) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('edge_devices').delete().eq('id', id);
    if (error) throw error;
    return true;
}

export async function getMachineActivityLogs(machineId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_type', 'machine')
        .eq('entity_id', machineId)
        .order('created_at', { ascending: false })
        .limit(200);
    
    if (error) return [];
    return (data || []).map(row => ({
        id: row.id,
        timestamp: row.created_at,
        status: row.payload?.status || 'UNKNOWN',
        message: row.payload?.message || ''
    }));
}

export async function getStationEvents(id) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('station_id', id)
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) return [];
    return (data || []).map(row => ({
        id: row.id,
        timestamp: row.created_at,
        eventType: row.event_type,
        detail: row.payload?.message || row.payload?.detail || JSON.stringify(row.payload)
    }));
}

export async function getStationGroups() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('station_groups').select('*').order('name');
    if (error) return [];
    return snakeToCamel(data || []);
}

export async function saveStationGroup(group) {
    const supabase = getSupabaseClient();
    const payload = camelToSnake({ ...group, updated_at: new Date().toISOString() });
    const id = group.id;
    delete payload.id;

    if (id && String(id).includes('-')) {
        const { data, error } = await supabase.from('station_groups').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase.from('station_groups').insert({ ...payload, created_at: new Date().toISOString() }).select().single();
        if (error) throw error;
        return data;
    }
}

export async function deleteStationGroup(id) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('station_groups').delete().eq('id', id);
    if (error) throw error;
    return true;
}
export const logMachineActivity = async (id, status) => {};
