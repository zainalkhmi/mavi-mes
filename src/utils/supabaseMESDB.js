/**
 * supabaseMESDB.js
 * Read-only access to Mavi MES tables for BI Studio data source.
 * Uses the same Supabase client as other modules.
 */
import { getSupabaseClient } from './supabaseManualDB';

const MES_TABLES = [
    { id: 'machines', name: 'Machines', desc: 'Daftar mesin pabrik & status' },
    { id: 'stations', name: 'Stations', desc: 'Stasiun kerja shop floor' },
    { id: 'completions', name: 'Completions', desc: 'Riwayat eksekusi aplikasi operator' },
    { id: 'measurements', name: 'Measurements', desc: 'Data telemetri / pengukuran' },
    { id: 'production_queue', name: 'Production Queue', desc: 'Antrean work order' },
    { id: 'audit_logs', name: 'Audit Logs', desc: 'Log audit sistem' },
    { id: 'player_sessions', name: 'Player Sessions', desc: 'Sesi operator aktif' },
    { id: 'edge_devices', name: 'Edge Devices', desc: 'Perangkat edge IoT' },
    { id: 'plc_tags', name: 'PLC Tags', desc: 'Tag register PLC' },
];

export function getMESTables() {
    return MES_TABLES;
}

export async function readMESTable(tableId, options = {}) {
    const supabase = getSupabaseClient();
    const { limit = 200, orderBy = null, filters = [] } = options;

    let query = supabase.from(tableId).select('*');

    if (orderBy) {
        const [col, dir] = orderBy.split('.');
        query = query.order(col, { ascending: dir === 'asc' });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    if (filters && filters.length > 0) {
        for (const f of filters) {
            if (f.op === 'eq') query = query.eq(f.col, f.val);
            else if (f.op === 'like') query = query.ilike(f.col, `%${f.val}%`);
            else if (f.op === 'gt') query = query.gt(f.col, f.val);
            else if (f.op === 'lt') query = query.lt(f.col, f.val);
        }
    }

    query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(row => {
        const flat = { id: row.id };
        Object.entries(row).forEach(([k, v]) => {
            if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
                Object.entries(v).forEach(([sk, sv]) => {
                    flat[`${k}_${sk}`] = sv;
                });
            } else if (Array.isArray(v)) {
                flat[k] = JSON.stringify(v);
            } else {
                flat[k] = v;
            }
        });
        return flat;
    });
}
