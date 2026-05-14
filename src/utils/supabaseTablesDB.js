import { getSupabaseClient } from './supabaseManualDB.js';
import automationEngine from './automationEngine.js';

/**
 * supabaseTablesDB.js
 * Supabase-backed storage for the Tulip-style Table Manager.
 * Replaces the IndexedDB-based tables/table_records stores.
 */

const TABLE_FIELD_LIMIT = 200;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const TABLE_FIELD_TYPES = [
    'text', 'number', 'boolean', 'integer', 'interval',
    'image', 'video', 'file', 'user', 'datetime', 'color',
    'linked_record', 'machine', 'station', 'formula'
];

export const LINK_TYPES = {
    ONE_TO_ONE: 'one_to_one',
    ONE_TO_MANY: 'one_to_many',
    MANY_TO_ONE: 'many_to_one',
    MANY_TO_MANY: 'many_to_many'
};

function isUuid(value) {
    return UUID_REGEX.test(String(value || '').trim());
}

function ensureUuidOrThrow(value, context = 'table_id') {
    const normalized = String(value || '').trim();
    if (!isUuid(normalized)) {
        throw new Error(`Invalid ${context}: expected UUID, got "${normalized || '(empty)'}"`);
    }
    return normalized;
}

export async function resolveTableIdReference(tableRef) {
    const supabase = getSupabaseClient();
    const raw = String(tableRef || '').trim();
    if (!raw) {
        throw new Error('Table reference is required.');
    }
    if (isUuid(raw)) return raw;

    // Resolve alias/name -> UUID for App Player/stress paths that still pass symbolic IDs.
    const { data: exact, error: exactErr } = await supabase
        .from('app_tables')
        .select('id,name')
        .eq('name', raw)
        .maybeSingle();

    if (exactErr) throw exactErr;
    if (exact?.id) return exact.id;

    const { data: near, error: nearErr } = await supabase
        .from('app_tables')
        .select('id,name')
        .ilike('name', raw)
        .limit(1)
        .maybeSingle();

    if (nearErr) throw nearErr;
    if (near?.id) return near.id;

    throw new Error(`Table reference "${raw}" could not be resolved to a valid UUID table ID.`);
}

// ── Tables API ─────────────────────────────────────────────────────────────

export async function getTables() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('app_tables')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) throw error;
        const tables = (data || []).map(rowToTable);
        return tables;
    } catch (e) {
        console.error('[Supabase] Could not load tables:', e);
        return [];
    }
}

export async function createTable(tableData) {
    console.log('[supabaseTablesDB] createTable attempt:', tableData);
    const supabase = getSupabaseClient();
    const fields = normalizeFields(tableData.fields || []);

    if (fields.length > TABLE_FIELD_LIMIT) {
        throw new Error(`Table field limit exceeded. Max ${TABLE_FIELD_LIMIT} fields.`);
    }

    const { data, error } = await supabase
        .from('app_tables')
        .insert({
            name: tableData.name || 'Untitled Table',
            description: tableData.description || '',
            fields: fields,
            archived_field_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('[supabaseTablesDB] createTable error:', error);
        throw toReadableSupabaseError(error, 'create_table');
    }
    console.log('[supabaseTablesDB] createTable success:', data);
    return rowToTable(data);
}

export async function updateTable(tableId, patch = {}) {
    const supabase = getSupabaseClient();

    // Fetch existing to merge
    const { data: existing, error: fetchErr } = await supabase
        .from('app_tables')
        .select('*')
        .eq('id', tableId)
        .single();

    if (fetchErr) throw fetchErr;
    if (!existing) throw new Error(`Table ${tableId} not found`);

    const fields = patch.fields !== undefined
        ? normalizeFields(patch.fields)
        : normalizeFields(existing.fields || []);

    const archivedCount = patch.archivedFieldCount !== undefined
        ? Number(patch.archivedFieldCount)
        : Number(existing.archived_field_count || 0);

    if (fields.length + archivedCount > TABLE_FIELD_LIMIT) {
        throw new Error(`Table field limit exceeded. Max ${TABLE_FIELD_LIMIT} fields including archived.`);
    }

    const { error } = await supabase
        .from('app_tables')
        .update({
            name: patch.name !== undefined ? patch.name : existing.name,
            description: patch.description !== undefined ? patch.description : existing.description,
            fields,
            queries: patch.queries !== undefined ? patch.queries : (existing.queries || []),
            aggregations: patch.aggregations !== undefined ? patch.aggregations : (existing.aggregations || []),
            archived_field_count: archivedCount,
            updated_at: new Date().toISOString()
        })
        .eq('id', tableId);

    if (error) throw error;

    // Handle reciprocal linked record fields
    if (patch.fields) {
        await syncReciprocalFields(tableId, existing.name, patch.fields, existing.fields || []);
    }

    return true;
}

/**
 * Ensures that for every linked_record field in sourceTable, 
 * there is a matching back-link field in the targetTable.
 */
async function syncReciprocalFields(sourceTableId, sourceTableName, newFields, oldFields) {
    const supabase = getSupabaseClient();

    // Identify new or changed linked_record fields
    const linkedFields = newFields.filter(f => f.type === 'linked_record' && f.link_table_id);

    for (const field of linkedFields) {
        const targetTableId = field.link_table_id;
        const targetFieldName = field.reverse_link_name;
        if (!targetTableId || !targetFieldName) continue;

        // Fetch target table
        const { data: targetTable, error: tErr } = await supabase
            .from('app_tables')
            .select('*')
            .eq('id', targetTableId)
            .single();

        if (tErr || !targetTable) continue;

        const targetFields = Array.isArray(targetTable.fields) ? targetTable.fields : [];
        const exists = targetFields.find(f => f.name === targetFieldName);

        if (!exists) {
            // Determine reverse link type
            let reverseType = field.link_type;
            if (field.link_type === LINK_TYPES.ONE_TO_MANY) reverseType = LINK_TYPES.MANY_TO_ONE;
            else if (field.link_type === LINK_TYPES.MANY_TO_ONE) reverseType = LINK_TYPES.ONE_TO_MANY;

            // Add reciprocal field
            const updatedTargetFields = [...targetFields, {
                name: targetFieldName,
                type: 'linked_record',
                link_table_id: sourceTableId,
                link_type: reverseType,
                reverse_link_name: field.name,
                auto_created: true
            }];
            await supabase
                .from('app_tables')
                .update({ fields: updatedTargetFields, updated_at: new Date().toISOString() })
                .eq('id', targetTableId);
        }
    }
}

export async function deleteTable(tableId) {
    const supabase = getSupabaseClient();

    // Delete all records first
    await supabase.from('app_table_records').delete().eq('table_id', tableId);

    const { error } = await supabase.from('app_tables').delete().eq('id', tableId);
    if (error) throw error;
    return true;
}

export async function getTableById(id) {
    const normalizedId = isUuid(id)
        ? ensureUuidOrThrow(id, 'table_id')
        : await resolveTableIdReference(id);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('app_tables')
        .select('*')
        .eq('id', normalizedId)
        .single();
    if (error) throw error;
    return rowToTable(data);
}

// ── Records API ─────────────────────────────────────────────────────────────

export async function getTableRecords(tableId) {
    try {
        const normalizedTableId = isUuid(tableId)
            ? ensureUuidOrThrow(tableId, 'table_id')
            : await resolveTableIdReference(tableId);
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('app_table_records')
            .select('*')
            .eq('table_id', normalizedTableId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        const records = (data || []).map(rowToRecord);
        return records;
    } catch (e) {
        console.error(`[Supabase] Failed to load records for table ${tableId}:`, e);
        return [];
    }
}

export async function queryTableRecords(tableId, options = {}) {
    const rows = await getTableRecords(tableId);
    if (!Array.isArray(rows) || rows.length === 0) return [];

    const {
        filters = [],
        sort = [],
        limit,
        matchType = 'all'
    } = options || {};

    const applyFilter = (row, filter) => {
        if (!filter || !filter.field) return true;
        const field = filter.field;
        const op = filter.operator;
        const expected = filter.value;
        const actual = row?.[field];

        switch (op) {
            case 'equals': return String(actual || '').toLowerCase() === String(expected || '').toLowerCase();
            case 'does_not_equal': return String(actual || '').toLowerCase() !== String(expected || '').toLowerCase();
            case 'contains': return String(actual || '').toLowerCase().includes(String(expected || '').toLowerCase());
            case 'does_not_contain': return !String(actual || '').toLowerCase().includes(String(expected || '').toLowerCase());
            case 'starts_with': return String(actual || '').toLowerCase().startsWith(String(expected || '').toLowerCase());
            case 'ends_with': return String(actual || '').toLowerCase().endsWith(String(expected || '').toLowerCase());
            case 'is_null': return actual == null || actual === '';
            case 'is_not_null': return actual != null && actual !== '';
            case 'greater_than_or_equal': return Number(actual) >= Number(expected);
            case 'less_than_or_equal': return Number(actual) <= Number(expected);
            case 'is_in': return (expected || '').split(',').map(v => v.trim().toLowerCase()).includes(String(actual || '').toLowerCase());
            case 'is_after': return actual && expected && new Date(actual) > new Date(expected);
            case 'is_before': return actual && expected && new Date(actual) < new Date(expected);
            default: return true;
        }
    };

    let result = rows.filter((row) => {
        if (filters.length === 0) return true;
        const results = filters.map(f => applyFilter(row, f));
        return matchType === 'all' ? results.every(r => r) : results.some(r => r);
    });

    if (sort.length > 0) {
        result.sort((a, b) => {
            for (const rule of sort) {
                const field = rule.field;
                const direction = rule.direction || 'asc';

                const aVal = field === 'recordId' ? a.recordId : a[field];
                const bVal = field === 'recordId' ? b.recordId : b[field];

                const aNum = Number(aVal);
                const bNum = Number(bVal);
                const bothNumeric = Number.isFinite(aNum) && Number.isFinite(bNum) && aVal !== '' && bVal !== '';

                let cmp = 0;
                if (bothNumeric) cmp = aNum - bNum;
                else cmp = String(aVal || '').localeCompare(String(bVal || ''));

                if (cmp !== 0) return direction === 'asc' ? cmp : -cmp;
            }
            return 0;
        });
    }

    if (limit && Number.isFinite(Number(limit))) {
        result = result.slice(0, Number(limit));
    }

    return result;
}

export async function addTableRecord(tableId, recordData) {
    const supabase = getSupabaseClient();
    const normalizedTableId = ensureUuidOrThrow(tableId, 'table_id');
    const recordId = String(recordData?.recordId ?? recordData?.id ?? '').trim();
    if (!recordId) throw new Error('Record ID is required and must be a non-empty text value.');

    // Check for duplicate
    const { data: existing } = await supabase
        .from('app_table_records')
        .select('id')
        .eq('table_id', normalizedTableId)
        .ilike('record_id', recordId)
        .maybeSingle();

    if (existing) throw new Error(`Record ID "${recordId}" already exists in this table.`);

    const payload = { ...recordData };
    delete payload.id;
    delete payload.recordId;

    const table = await getTableById(normalizedTableId);
    const calculatedPayload = applyExcelLikeFormulas(table, payload);

    try {
        const { data, error } = await supabase
            .from('app_table_records')
            .insert({
                table_id: normalizedTableId,
                record_id: recordId,
                data: calculatedPayload,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        const record = rowToRecord(data);

        // Fire automation trigger
        if (automationEngine && typeof automationEngine.trigger === 'function') {
            automationEngine.trigger('TABLE_ROW_ADDED', {
                tableId: normalizedTableId,
                recordId: record.recordId,
                record: record,
                source: 'DATABASE'
            });
        }

        return record;
    } catch (err) {
        console.error('[Supabase] Failed to add record:', err);
        throw err;
    }
}
export async function deleteTableRecord(recordInternalId) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('app_table_records')
        .delete()
        .eq('id', recordInternalId);
    if (error) throw error;
    return true;
}

export async function updateTableRecord(recordInternalId, updateData) {
    const supabase = getSupabaseClient();

    // 1. Find the record (Flexible: check id first, then record_id, then table_id)
    let { data: existing, error: fetchErr } = await supabase
        .from('app_table_records')
        .select('*')
        .eq('id', recordInternalId)
        .maybeSingle();

    if (!existing) {
        const { data: fallback } = await supabase
            .from('app_table_records')
            .select('*')
            .eq('record_id', recordInternalId)
            .maybeSingle();
        existing = fallback;
    }

    if (!existing) {
        const { data: tableRecords } = await supabase
            .from('app_table_records')
            .select('*')
            .eq('table_id', recordInternalId)
            .order('created_at', { ascending: false })
            .limit(1);
        if (tableRecords?.[0]) existing = tableRecords[0];
    }

    if (!existing) throw new Error(`Record/Table "${recordInternalId}" tidak ditemukan.`);

    const mergedData = { ...(existing.data || {}), ...updateData };
    const table = await getTableById(existing.table_id);
    const newData = applyExcelLikeFormulas(table, mergedData);

    delete newData.id;
    delete newData.recordId;
    delete newData.tableId;

    const { data: updatedList, error: updateErr } = await supabase
        .from('app_table_records')
        .update({ data: newData, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select();

    if (updateErr) throw updateErr;
    if (!updatedList?.[0]) throw new Error("Gagal update: Data tidak ditemukan.");

    const record = rowToRecord(updatedList[0]);

    if (automationEngine && typeof automationEngine.trigger === 'function') {
        automationEngine.trigger('TABLE_ROW_UPDATED', {
            tableId: existing.table_id,
            recordId: existing.record_id,
            record: record,
            previousRecord: rowToRecord(existing),
            updatedFields: updateData,
            source: 'DATABASE'
        });
    }

    return record;
}

/**
 * Bi-directionally link two records together.
 */
export async function linkRecords(sourceTableId, sourceRecordId, sourceFieldName, targetTableId, targetRecordId, targetFieldName) {
    const supabase = getSupabaseClient();

    const updateSide = async (tId, rId, fName, linkedId) => {
        const { data: record, error } = await supabase
            .from('app_table_records')
            .select('*')
            .eq('table_id', tId)
            .ilike('record_id', rId)
            .single();
        if (error || !record) return;

        const currentData = record.data || {};
        const currentLinks = Array.isArray(currentData[fName]) ? currentData[fName] : (currentData[fName] ? [currentData[fName]] : []);

        if (!currentLinks.includes(linkedId)) {
            const nextData = { ...currentData, [fName]: [...currentLinks, linkedId] };
            await supabase
                .from('app_table_records')
                .update({ data: nextData, updated_at: new Date().toISOString() })
                .eq('id', record.id);
        }
    };

    await Promise.all([
        updateSide(sourceTableId, sourceRecordId, sourceFieldName, targetRecordId),
        updateSide(targetTableId, targetRecordId, targetFieldName, sourceRecordId)
    ]);

    // Notify Automation Engine
    if (automationEngine && typeof automationEngine.trigger === 'function') {
        automationEngine.trigger('ON_RECORD_LINK', {
            sourceTableId, sourceRecordId, sourceFieldName,
            targetTableId, targetRecordId, targetFieldName
        });
    }

    return true;
}

/**
 * Bi-directionally unlink two records.
 */
export async function unlinkRecords(sourceTableId, sourceRecordId, sourceFieldName, targetTableId, targetRecordId, targetFieldName) {
    const supabase = getSupabaseClient();

    const updateSide = async (tId, rId, fName, linkedId) => {
        const { data: record, error } = await supabase
            .from('app_table_records')
            .select('*')
            .eq('table_id', tId)
            .ilike('record_id', rId)
            .single();
        if (error || !record) return;

        const currentData = record.data || {};
        const currentLinks = Array.isArray(currentData[fName]) ? currentData[fName] : (currentData[fName] ? [currentData[fName]] : []);

        if (currentLinks.includes(linkedId)) {
            const nextData = { ...currentData, [fName]: currentLinks.filter(id => id !== linkedId) };
            await supabase
                .from('app_table_records')
                .update({ data: nextData, updated_at: new Date().toISOString() })
                .eq('id', record.id);
        }
    };

    await Promise.all([
        updateSide(sourceTableId, sourceRecordId, sourceFieldName, targetRecordId),
        updateSide(targetTableId, targetRecordId, targetFieldName, sourceRecordId)
    ]);

    // Notify Automation Engine
    if (automationEngine && typeof automationEngine.trigger === 'function') {
        automationEngine.trigger('ON_RECORD_UNLINK', {
            sourceTableId, sourceRecordId, sourceFieldName,
            targetTableId, targetRecordId, targetFieldName
        });
    }

    return true;
}

// ── Internal helpers ────────────────────────────────────────────────────────

function normalizeFields(fields) {
    if (!Array.isArray(fields)) return [];
    const seen = new Set();
    return fields
        .filter(f => f && f.name)
        .map(f => ({
            name: String(f.name).trim(),
            type: TABLE_FIELD_TYPES.includes(f.type) ? f.type : 'text',
            archived: Boolean(f.archived),
            link_table_id: f.type === 'linked_record' ? f.link_table_id : undefined,
            link_type: f.type === 'linked_record' ? f.link_type : undefined,
            reverse_link_name: f.type === 'linked_record' ? f.reverse_link_name : undefined,
            formulaExpression: f.type === 'formula' ? String(f.formulaExpression || '').trim() : undefined,
            auto_created: Boolean(f.auto_created)
        }))
        .filter(f => {
            if (seen.has(f.name)) return false;
            seen.add(f.name);
            return true;
        });
}

function applyExcelLikeFormulas(table, record) {
    if (!table || !Array.isArray(table.fields)) return record;
    const result = { ...record };

    // Evaluate user-entered cell formulas first (e.g. "=A+B")
    Object.entries(result).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim().startsWith('=')) {
            result[key] = evalFormulaExpression(value.trim().slice(1), result);
        }
    });

    // Evaluate formula-type fields from schema definition
    table.fields.forEach((field) => {
        if (field.type !== 'formula') return;
        const expr = String(field.formulaExpression || '').trim();
        if (!expr) {
            result[field.name] = '';
            return;
        }
        result[field.name] = evalFormulaExpression(expr.startsWith('=') ? expr.slice(1) : expr, result);
    });

    return result;
}

function evalFormulaExpression(expression, row = {}) {
    try {
        let expr = String(expression || '');

        // Replace [Field Name] references first to support spaces
        expr = expr.replace(/\[([^\]]+)\]/g, (_, fieldName) => {
            const v = row[fieldName];
            return Number.isFinite(Number(v)) ? String(Number(v)) : `"${String(v ?? '').replace(/"/g, '\\"')}"`;
        });

        // Replace simple identifier field references: qty * price
        expr = expr.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g, (token) => {
            const upper = token.toUpperCase();
            if (['SUM', 'AVG', 'MIN', 'MAX', 'IF', 'ROUND', 'ABS', 'TRUE', 'FALSE'].includes(upper)) return token;
            if (Object.prototype.hasOwnProperty.call(row, token)) {
                const v = row[token];
                return Number.isFinite(Number(v)) ? String(Number(v)) : `"${String(v ?? '').replace(/"/g, '\\"')}"`;
            }
            return token;
        });

        const fn = new Function(
            'SUM', 'AVG', 'MIN', 'MAX', 'IF', 'ROUND', 'ABS',
            `return (${expr});`
        );

        const SUM = (...args) => args.flat().reduce((s, v) => s + (Number(v) || 0), 0);
        const AVG = (...args) => {
            const arr = args.flat().map((v) => Number(v)).filter((v) => Number.isFinite(v));
            return arr.length ? SUM(arr) / arr.length : 0;
        };
        const MIN = (...args) => {
            const arr = args.flat().map((v) => Number(v)).filter((v) => Number.isFinite(v));
            return arr.length ? Math.min(...arr) : 0;
        };
        const MAX = (...args) => {
            const arr = args.flat().map((v) => Number(v)).filter((v) => Number.isFinite(v));
            return arr.length ? Math.max(...arr) : 0;
        };
        const IF = (cond, a, b) => (cond ? a : b);
        const ROUND = (v, p = 0) => {
            const n = Number(v);
            const m = Number(p);
            if (!Number.isFinite(n) || !Number.isFinite(m)) return 0;
            const f = 10 ** m;
            return Math.round(n * f) / f;
        };
        const ABS = (v) => Math.abs(Number(v) || 0);

        const out = fn(SUM, AVG, MIN, MAX, IF, ROUND, ABS);
        return out ?? '';
    } catch (err) {
        return '#FORMULA_ERROR';
    }
}

function rowToTable(row) {
    const fields = normalizeFields(Array.isArray(row.fields) ? row.fields : []);
    return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        fields,
        columns: fields.map(f => f.name),
        queries: Array.isArray(row.queries) ? row.queries : [],
        aggregations: Array.isArray(row.aggregations) ? row.aggregations : [],
        archivedFieldCount: Number(row.archived_field_count || 0),
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function rowToRecord(row) {
    const data = row.data || {};
    return {
        id: row.id,
        tableId: row.table_id,
        recordId: row.record_id,
        ...data,
        createdAt: row.created_at
    };
}

function toReadableSupabaseError(error, action = 'unknown') {
    const status = Number(error?.status || error?.statusCode || 0);
    const code = String(error?.code || '');
    const rawMessage = String(error?.message || '').trim();

    let message = rawMessage || 'Supabase request failed.';

    // Common failure for self-hosted Supabase / wrong anon key
    if (status === 401 || code === '401') {
        message = [
            'Unauthorized (401) from Supabase while creating table.',
            'Periksa kembali URL + ANON KEY di Supabase Settings (harus key anon dari project yang sama).',
            'Jika self-hosted/VPS, pastikan JWT secret, anon key, dan service kong/postgrest saling match.',
            'Jika perlu, login ulang lalu refresh browser.'
        ].join(' ');
    }

    // Missing relation/table in Postgres
    if (code === '42P01' || /Could not find the table|relation .* does not exist/i.test(rawMessage)) {
        message = 'Table "app_tables" belum ada di database. Jalankan ulang SQL migration (supabase_setup.sql).';
    }

    // RLS/policy issues
    if (status === 403 || /row-level security|permission denied|insufficient privilege/i.test(rawMessage)) {
        message = [
            'Akses ditolak oleh policy/permission database.',
            'Pastikan role anon/authenticated punya GRANT + RLS policy untuk INSERT/SELECT pada app_tables dan app_table_records.'
        ].join(' ');
    }

    const wrapped = new Error(message);
    wrapped.original = error;
    wrapped.action = action;
    return wrapped;
}
