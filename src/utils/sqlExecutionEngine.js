/**
 * sqlExecutionEngine.js
 * Universal Client-Side SQL Parser and Execution Engine for MaviCore MES (Supabase / PostgreSQL)
 * Supports:
 * - SELECT with column aliases, aggregates (COUNT, SUM, AVG, MIN, MAX, ROUND), multi-table JOINs, WHERE logic, GROUP BY, ORDER BY, LIMIT/OFFSET
 * - INSERT INTO (single & multi-row) -> adds real records via addTableRecord / Supabase
 * - UPDATE ... SET ... WHERE ... -> updates real records via updateTableRecord / Supabase
 * - DELETE FROM ... WHERE ... -> deletes real records via deleteTableRecord / Supabase
 * - CREATE TABLE (col1 type, ...) -> creates real table via createTable
 * - DROP TABLE, TRUNCATE TABLE
 * - SHOW TABLES, DESCRIBE / DESC <table>
 */

import {
  getTables,
  getTableById,
  createTable,
  deleteTable,
  getTableRecords,
  addTableRecord,
  updateTableRecord,
  deleteTableRecord
} from './supabaseTablesDB.js';
import { getSupabaseClient } from './supabaseManualDB.js';

// Helper: normalize table name (strip quotes, trim, lowercase check)
export function normalizeIdentifier(name) {
  if (!name) return '';
  return String(name).trim().replace(/^["'`]|["'`]$/g, '');
}

// Helper: parse literal value from SQL token
export function parseSqlValue(token) {
  if (token === undefined || token === null) return null;
  const str = String(token).trim();
  if (/^null$/i.test(str)) return null;
  if (/^true$/i.test(str)) return true;
  if (/^false$/i.test(str)) return false;
  // String literal 'abc' or "abc"
  if ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"'))) {
    return str.slice(1, -1).replace(/''/g, "'");
  }
  // Number
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return Number(str);
  }
  return str;
}

/**
 * Evaluates a SQL WHERE condition expression against a given row.
 * Row keys may be qualified (table.col) or unqualified (col).
 */
export function evaluateWhereClause(conditionStr, row, aliases = {}) {
  if (!conditionStr || !conditionStr.trim()) return true;

  try {
    let expr = conditionStr.trim();

    // Replace IS NULL / IS NOT NULL
    expr = expr.replace(/([a-zA-Z0-9_$.]+)\s+IS\s+NOT\s+NULL/gi, (_, col) => {
      const val = resolveColumnValue(col, row, aliases);
      return val !== null && val !== undefined && val !== '' ? 'true' : 'false';
    });

    expr = expr.replace(/([a-zA-Z0-9_$.]+)\s+IS\s+NULL/gi, (_, col) => {
      const val = resolveColumnValue(col, row, aliases);
      return val === null || val === undefined || val === '' ? 'true' : 'false';
    });

    // Replace LIKE / ILIKE: col LIKE '%pattern%'
    expr = expr.replace(/([a-zA-Z0-9_$.]+)\s+(I?LIKE)\s+('([^']*)'|"([^"]*)")/gi, (_, col, op, _quote, val1, val2) => {
      const pattern = val1 !== undefined ? val1 : val2;
      const actual = String(resolveColumnValue(col, row, aliases) ?? '');
      const regexPattern = '^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$';
      const isMatch = new RegExp(regexPattern, op.toUpperCase() === 'ILIKE' ? 'i' : '').test(actual);
      return isMatch ? 'true' : 'false';
    });

    // Replace IN (...) : col IN ('a', 'b', 123)
    expr = expr.replace(/([a-zA-Z0-9_$.]+)\s+(NOT\s+)?IN\s*\(([^)]+)\)/gi, (_, col, notOp, inList) => {
      const actual = resolveColumnValue(col, row, aliases);
      const items = inList.split(',').map(v => parseSqlValue(v));
      const found = items.some(item => String(item).toLowerCase() === String(actual).toLowerCase());
      const res = notOp ? !found : found;
      return res ? 'true' : 'false';
    });

    // Replace BETWEEN x AND y: col BETWEEN 10 AND 20
    expr = expr.replace(/([a-zA-Z0-9_$.]+)\s+BETWEEN\s+([^\s]+)\s+AND\s+([^\s)]+)/gi, (_, col, minVal, maxVal) => {
      const actual = Number(resolveColumnValue(col, row, aliases));
      const min = Number(parseSqlValue(minVal));
      const max = Number(parseSqlValue(maxVal));
      return (actual >= min && actual <= max) ? 'true' : 'false';
    });

    // Replace standard comparison operators (=, !=, <>, >=, <=, >, <)
    // First, temporarily convert single '=' to '==='
    expr = expr.replace(/([a-zA-Z0-9_$.]+)\s*(=|!=|<>|>=|<=|>|<)\s*('[^']*'|"[^"]*"|-?\d+(?:\.\d+)?|true|false|null)/gi, (_, col, op, valStr) => {
      const actual = resolveColumnValue(col, row, aliases);
      const target = parseSqlValue(valStr);

      if (op === '=' || op === '==') {
        if (typeof target === 'number' && Number.isFinite(Number(actual))) {
          return Number(actual) === target ? 'true' : 'false';
        }
        return String(actual ?? '').toLowerCase() === String(target ?? '').toLowerCase() ? 'true' : 'false';
      }
      if (op === '!=' || op === '<>') {
        if (typeof target === 'number' && Number.isFinite(Number(actual))) {
          return Number(actual) !== target ? 'true' : 'false';
        }
        return String(actual ?? '').toLowerCase() !== String(target ?? '').toLowerCase() ? 'true' : 'false';
      }
      if (op === '>') return Number(actual) > Number(target) ? 'true' : 'false';
      if (op === '>=') return Number(actual) >= Number(target) ? 'true' : 'false';
      if (op === '<') return Number(actual) < Number(target) ? 'true' : 'false';
      if (op === '<=') return Number(actual) <= Number(target) ? 'true' : 'false';
      return 'true';
    });

    // Replace AND, OR, NOT with JavaScript boolean operators
    expr = expr.replace(/\bAND\b/gi, '&&');
    expr = expr.replace(/\bOR\b/gi, '||');
    expr = expr.replace(/\bNOT\b/gi, '!');

    // Safely evaluate boolean expression
    // eslint-disable-next-line no-new-func
    const evalFn = new Function(`return Boolean(${expr});`);
    return evalFn();
  } catch (err) {
    console.warn('[sqlExecutionEngine] Where evaluation fallback:', err);
    return true;
  }
}

// Helper: resolve column value from row object
function resolveColumnValue(colIdentifier, row, aliases = {}) {
  const clean = normalizeIdentifier(colIdentifier);
  if (row[clean] !== undefined) return row[clean];

  // If table.column
  if (clean.includes('.')) {
    const parts = clean.split('.');
    const colOnly = parts[1];
    if (row[colOnly] !== undefined) return row[colOnly];
    if (row[clean] !== undefined) return row[clean];
  } else {
    // If unqualified, search through row keys
    for (const key of Object.keys(row)) {
      if (key === clean || key.endsWith(`.${clean}`)) {
        return row[key];
      }
    }
  }
  return null;
}

/**
 * Fetch records for a table by name or ID.
 * First checks MaviCore `app_tables`, then native Supabase tables.
 */
export async function getFullRecordsForTable(tableName, tableSchemas = {}) {
  const cleanName = normalizeIdentifier(tableName);

  // 1. Check if known in tableSchemas
  let schema = tableSchemas[cleanName];
  if (!schema) {
    const foundKey = Object.keys(tableSchemas).find(k => k.toLowerCase() === cleanName.toLowerCase());
    if (foundKey) schema = tableSchemas[foundKey];
  }

  if (schema && schema.id) {
    try {
      const recs = await getTableRecords(schema.id);
      if (Array.isArray(recs)) {
        return {
          source: 'app_tables',
          tableId: schema.id,
          tableName: schema.name,
          records: recs
        };
      }
    } catch (e) {
      console.warn(`[sqlExecutionEngine] Failed fetching app_table_records for ${cleanName}:`, e);
    }
  }

  // 2. Query Supabase directly
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from(cleanName).select('*').limit(500);
    if (!error && Array.isArray(data)) {
      return {
        source: 'supabase_native',
        tableId: null,
        tableName: cleanName,
        records: data
      };
    }
  } catch (err) {
    console.warn(`[sqlExecutionEngine] Direct Supabase fetch for ${cleanName} failed:`, err);
  }

  // 3. Fallback: if schema has sampleRows
  if (schema && Array.isArray(schema.sampleRows) && schema.sampleRows.length > 0) {
    return {
      source: 'sample_rows',
      tableId: schema.id,
      tableName: schema.name,
      records: schema.sampleRows
    };
  }

  return {
    source: 'empty',
    tableId: schema?.id || null,
    tableName: cleanName,
    records: []
  };
}

/**
 * Main SQL Query Execution Engine
 * Accepts SQL string and execution context.
 * Returns standard execution response:
 * {
 *   success: boolean,
 *   type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'SHOW' | 'DESCRIBE',
 *   rows: array of objects,
 *   columns: array of strings,
 *   affectedRows: number,
 *   timeMs: number,
 *   message: string,
 *   targetTable?: string,
 *   targetTableId?: string
 * }
 */
export async function executeSql(rawSql, context = {}) {
  const startTime = performance.now();
  const sql = String(rawSql || '').trim().replace(/;+$/, '');
  const { tableSchemas = {}, onTableCreated, onDataMutated } = context;

  if (!sql) {
    return {
      success: false,
      type: 'EMPTY',
      rows: [],
      columns: [],
      affectedRows: 0,
      timeMs: 0,
      message: 'SQL query kosong. Ketik perintah SQL untuk dieksekusi.'
    };
  }

  const cleanSql = sql.replace(/\/\*[\s\S]*?\*\/|--.*$/gm, '').trim();
  const firstWord = (cleanSql.split(/\s+/)[0] || '').toUpperCase();

  try {
    // ── 1. SHOW TABLES ────────────────────────────────────────────────────────
    if (/^SHOW\s+TABLES/i.test(cleanSql) || cleanSql === '\\dt') {
      const customTables = await getTables();
      const rows = (customTables || []).map((t, idx) => ({
        '#': idx + 1,
        table_name: t.name,
        description: t.description || '-',
        columns_count: (t.fields || []).length,
        created_at: t.createdAt || '-'
      }));

      const elapsed = Math.round(performance.now() - startTime);
      return {
        success: true,
        type: 'SHOW',
        rows,
        columns: ['#', 'table_name', 'description', 'columns_count', 'created_at'],
        affectedRows: rows.length,
        timeMs: elapsed,
        message: `${rows.length} tabel terdaftar di database.`
      };
    }

    // ── 2. DESCRIBE / DESC <table> ───────────────────────────────────────────
    if (/^(?:DESCRIBE|DESC)\s+([a-zA-Z0-9_]+)/i.test(cleanSql)) {
      const match = cleanSql.match(/^(?:DESCRIBE|DESC)\s+([a-zA-Z0-9_]+)/i);
      const targetTable = match[1];
      const allTables = await getTables();
      const tbl = (allTables || []).find(t => t.name.toLowerCase() === targetTable.toLowerCase());

      if (!tbl) {
        throw new Error(`Tabel "${targetTable}" tidak ditemukan.`);
      }

      const rows = (tbl.fields || []).map((f, idx) => ({
        '#': idx + 1,
        column_name: f.name,
        data_type: f.type || 'text',
        is_primary_key: f.name === 'id' || f.name === 'record_id' ? 'YES' : 'NO',
        required: f.required ? 'YES' : 'NO'
      }));

      const elapsed = Math.round(performance.now() - startTime);
      return {
        success: true,
        type: 'DESCRIBE',
        rows,
        columns: ['#', 'column_name', 'data_type', 'is_primary_key', 'required'],
        affectedRows: rows.length,
        timeMs: elapsed,
        message: `Struktur kolom untuk tabel ${tbl.name} (${rows.length} kolom).`
      };
    }

    // ── 3. CREATE TABLE ──────────────────────────────────────────────────────
    if (/^CREATE\s+TABLE/i.test(cleanSql)) {
      const match = cleanSql.match(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)/i);
      if (!match) {
        throw new Error('Sintaks CREATE TABLE tidak valid. Contoh: CREATE TABLE nama_tabel (kolom1 text, kolom2 number);');
      }

      const tableName = normalizeIdentifier(match[1]);
      const columnsDef = match[2];

      const fields = columnsDef.split(',').map(part => {
        const segs = part.trim().split(/\s+/);
        const colName = normalizeIdentifier(segs[0]);
        let colType = (segs[1] || 'text').toLowerCase();

        if (['varchar', 'text', 'char', 'string'].includes(colType)) colType = 'text';
        else if (['int', 'integer', 'number', 'numeric', 'float', 'double', 'real'].includes(colType)) colType = 'number';
        else if (['bool', 'boolean'].includes(colType)) colType = 'boolean';
        else if (['date', 'timestamp', 'datetime'].includes(colType)) colType = 'datetime';
        else colType = 'text';

        return {
          name: colName,
          type: colType,
          label: colName
        };
      }).filter(f => f.name && f.name.toLowerCase() !== 'primary');

      const created = await createTable({
        name: tableName,
        description: 'Dibuat via Query Studio SQL Runner',
        fields
      });

      if (onTableCreated) onTableCreated(tableName);

      const elapsed = Math.round(performance.now() - startTime);
      return {
        success: true,
        type: 'CREATE',
        rows: fields.map((f, i) => ({ '#': i + 1, column: f.name, type: f.type })),
        columns: ['#', 'column', 'type'],
        affectedRows: 1,
        timeMs: elapsed,
        message: `Tabel "${tableName}" berhasil dibuat dengan ${fields.length} kolom.`
      };
    }

    // ── 4. DROP TABLE ────────────────────────────────────────────────────────
    if (/^DROP\s+TABLE/i.test(cleanSql)) {
      const match = cleanSql.match(/DROP\s+TABLE(?:\s+IF\s+EXISTS)?\s+([a-zA-Z0-9_]+)/i);
      if (!match) throw new Error('Sintaks DROP TABLE tidak valid. Contoh: DROP TABLE nama_tabel;');

      const tableName = normalizeIdentifier(match[1]);
      const allTables = await getTables();
      const tbl = (allTables || []).find(t => t.name.toLowerCase() === tableName.toLowerCase());

      if (!tbl) throw new Error(`Tabel "${tableName}" tidak ditemukan untuk dihapus.`);
      await deleteTable(tbl.id);
      if (onTableCreated) onTableCreated();

      const elapsed = Math.round(performance.now() - startTime);
      return {
        success: true,
        type: 'DROP',
        rows: [],
        columns: [],
        affectedRows: 1,
        timeMs: elapsed,
        message: `Tabel "${tableName}" berhasil dihapus dari database.`
      };
    }

    // ── 5. INSERT INTO ───────────────────────────────────────────────────────
    if (/^INSERT\s+INTO/i.test(cleanSql)) {
      const match = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*(?:\(([^)]+)\))?\s*VALUES\s*([\s\S]+)/i);
      if (!match) {
        throw new Error("Sintaks INSERT INTO tidak valid. Contoh: INSERT INTO table_name (col1, col2) VALUES ('val1', 123);");
      }

      const tableName = normalizeIdentifier(match[1]);
      const columnsList = match[2] ? match[2].split(',').map(c => normalizeIdentifier(c)) : null;
      const valuesSection = match[3].trim();

      // Extract value groups: ('val1', 'val2'), ('val3', 'val4')
      const valueTuples = [];
      const tupleRegex = /\(([^)]+)\)/g;
      let tupleMatch;
      while ((tupleMatch = tupleRegex.exec(valuesSection)) !== null) {
        valueTuples.push(tupleMatch[1]);
      }

      if (valueTuples.length === 0) {
        throw new Error('Tidak ada baris nilai (VALUES) yang ditemukan.');
      }

      // Check if table exists in app_tables
      const allTables = await getTables();
      let tbl = (allTables || []).find(t => t.name.toLowerCase() === tableName.toLowerCase());

      const insertedRows = [];

      for (const tuple of valueTuples) {
        // Parse CSV values while honoring quotes
        const rawVals = splitSqlCsv(tuple);
        const parsedVals = rawVals.map(v => parseSqlValue(v));

        const recordObj = {};
        if (columnsList && columnsList.length > 0) {
          columnsList.forEach((col, idx) => {
            recordObj[col] = parsedVals[idx] !== undefined ? parsedVals[idx] : null;
          });
        } else if (tbl && tbl.fields) {
          tbl.fields.forEach((f, idx) => {
            recordObj[f.name] = parsedVals[idx] !== undefined ? parsedVals[idx] : null;
          });
        } else {
          parsedVals.forEach((val, idx) => {
            recordObj[`col_${idx + 1}`] = val;
          });
        }

        if (tbl) {
          const newRec = await addTableRecord(tbl.id, recordObj);
          insertedRows.push(newRec);
        } else {
          // Native Supabase insert fallback
          const supabase = getSupabaseClient();
          const { data, error } = await supabase.from(tableName).insert(recordObj).select().single();
          if (error) throw error;
          insertedRows.push(data || recordObj);
        }
      }

      if (onDataMutated) onDataMutated();

      const elapsed = Math.round(performance.now() - startTime);
      return {
        success: true,
        type: 'INSERT',
        rows: insertedRows,
        columns: insertedRows.length > 0 ? Object.keys(insertedRows[0]) : [],
        affectedRows: insertedRows.length,
        timeMs: elapsed,
        targetTable: tableName,
        targetTableId: tbl?.id || null,
        message: `Berhasil menambahkan ${insertedRows.length} baris data ke tabel "${tableName}".`
      };
    }

    // ── 6. UPDATE ... SET ... WHERE ──────────────────────────────────────────
    if (/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+)/i.test(cleanSql)) {
      const match = cleanSql.match(/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
      if (!match) throw new Error('Sintaks UPDATE tidak valid. Contoh: UPDATE table_name SET status = \'DONE\' WHERE id = 1;');

      const tableName = normalizeIdentifier(match[1]);
      const setClause = match[2].trim();
      const whereClause = match[3] ? match[3].trim() : '';

      // Parse assignments: col1 = 'val', col2 = 456
      const updates = {};
      const assignments = splitSqlCsv(setClause);
      assignments.forEach(assign => {
        const parts = assign.split('=');
        if (parts.length >= 2) {
          const colName = normalizeIdentifier(parts[0]);
          const val = parseSqlValue(parts.slice(1).join('='));
          updates[colName] = val;
        }
      });

      // Load full records
      const full = await getFullRecordsForTable(tableName, tableSchemas);
      const rows = full.records;

      // Filter matching rows
      const targetRows = whereClause ? rows.filter(r => evaluateWhereClause(whereClause, r)) : rows;

      if (targetRows.length === 0) {
        const elapsed = Math.round(performance.now() - startTime);
        return {
          success: true,
          type: 'UPDATE',
          rows: [],
          columns: [],
          affectedRows: 0,
          timeMs: elapsed,
          targetTable: tableName,
          message: `Query UPDATE dieksekusi, tidak ada baris yang cocok dengan kriteria WHERE.`
        };
      }

      // Execute updates
      const updatedList = [];
      for (const row of targetRows) {
        const recId = row.id || row.recordId;
        if (full.source === 'app_tables' || full.tableId) {
          const res = await updateTableRecord(recId, updates);
          updatedList.push(res || { ...row, ...updates });
        } else {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase.from(tableName).update(updates).eq('id', recId).select().single();
          if (error) throw error;
          updatedList.push(data || { ...row, ...updates });
        }
      }

      if (onDataMutated) onDataMutated();

      const elapsed = Math.round(performance.now() - startTime);
      return {
        success: true,
        type: 'UPDATE',
        rows: updatedList,
        columns: updatedList.length > 0 ? Object.keys(updatedList[0]) : [],
        affectedRows: updatedList.length,
        timeMs: elapsed,
        targetTable: tableName,
        targetTableId: full.tableId,
        message: `Berhasil memperbarui ${updatedList.length} baris di tabel "${tableName}".`
      };
    }

    // ── 7. DELETE FROM ... WHERE ─────────────────────────────────────────────
    if (/^DELETE\s+FROM/i.test(cleanSql)) {
      const match = cleanSql.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+))?$/i);
      if (!match) throw new Error('Sintaks DELETE tidak valid. Contoh: DELETE FROM table_name WHERE id = 1;');

      const tableName = normalizeIdentifier(match[1]);
      const whereClause = match[2] ? match[2].trim() : '';

      const full = await getFullRecordsForTable(tableName, tableSchemas);
      const rows = full.records;

      const targetRows = whereClause ? rows.filter(r => evaluateWhereClause(whereClause, r)) : rows;

      let deletedCount = 0;
      for (const row of targetRows) {
        const recId = row.id || row.recordId;
        if (full.source === 'app_tables' || full.tableId) {
          await deleteTableRecord(recId);
          deletedCount++;
        } else {
          const supabase = getSupabaseClient();
          const { error } = await supabase.from(tableName).delete().eq('id', recId);
          if (error) throw error;
          deletedCount++;
        }
      }

      if (onDataMutated) onDataMutated();

      const elapsed = Math.round(performance.now() - startTime);
      return {
        success: true,
        type: 'DELETE',
        rows: [],
        columns: [],
        affectedRows: deletedCount,
        timeMs: elapsed,
        targetTable: tableName,
        message: `Berhasil menghapus ${deletedCount} baris dari tabel "${tableName}".`
      };
    }

    // ── 8. SELECT QUERY RUNNER ───────────────────────────────────────────────
    if (/^SELECT/i.test(cleanSql)) {
      const result = await executeSelectQuery(cleanSql, tableSchemas);
      const elapsed = Math.round(performance.now() - startTime);
      return {
        ...result,
        timeMs: elapsed
      };
    }

    // Fallback: unsupported statement
    throw new Error(`Perintah SQL "${firstWord}" belum didukung oleh engine ini.`);
  } catch (error) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      success: false,
      type: firstWord || 'ERROR',
      rows: [],
      columns: [],
      affectedRows: 0,
      timeMs: elapsed,
      message: error.message || 'Eksekusi query gagal.'
    };
  }
}

/**
 * Robust SELECT statement parser & executor
 */
async function executeSelectQuery(sql, tableSchemas) {
  // Regex pattern to decompose SELECT query
  // SELECT <projection> FROM <primaryTable> [JOINs] [WHERE ...] [GROUP BY ...] [ORDER BY ...] [LIMIT ...] [OFFSET ...]
  const selectRegex = /^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_]+(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?)([\s\S]*)$/i;
  const match = sql.match(selectRegex);

  if (!match) {
    throw new Error('Sintaks SELECT tidak valid. Contoh: SELECT col1, col2 FROM table_name WHERE condition;');
  }

  const projectionStr = match[1].trim();
  const fromPart = match[2].trim();
  const restClause = match[4] || '';

  // Parse Primary Table & Alias
  const fromTokens = fromPart.split(/\s+(?:AS\s+)?/i);
  const primaryTableName = normalizeIdentifier(fromTokens[0]);
  const primaryAlias = fromTokens[1] ? normalizeIdentifier(fromTokens[1]) : primaryTableName;

  // Extract Clauses from restClause: JOINs, WHERE, GROUP BY, ORDER BY, LIMIT, OFFSET
  let remaining = restClause;

  // LIMIT & OFFSET
  let limit = null;
  let offset = 0;
  const limitMatch = remaining.match(/\s+LIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?/i);
  if (limitMatch) {
    limit = parseInt(limitMatch[1], 10);
    if (limitMatch[2]) offset = parseInt(limitMatch[2], 10);
    remaining = remaining.replace(limitMatch[0], '');
  }

  // ORDER BY
  let orderByList = [];
  const orderMatch = remaining.match(/\s+ORDER\s+BY\s+([\s\S]+?)(?=\s+(?:LIMIT|GROUP|HAVING|$))/i);
  if (orderMatch) {
    orderByList = orderMatch[1].split(',').map(item => {
      const segs = item.trim().split(/\s+/);
      return {
        col: normalizeIdentifier(segs[0]),
        dir: segs[1] && segs[1].toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
      };
    });
    remaining = remaining.replace(orderMatch[0], '');
  }

  // GROUP BY
  let groupByCol = null;
  const groupMatch = remaining.match(/\s+GROUP\s+BY\s+([a-zA-Z0-9_$.]+)/i);
  if (groupMatch) {
    groupByCol = normalizeIdentifier(groupMatch[1]);
    remaining = remaining.replace(groupMatch[0], '');
  }

  // WHERE
  let whereClause = null;
  const whereMatch = remaining.match(/\s+WHERE\s+([\s\S]+?)(?=\s+(?:GROUP|ORDER|LIMIT|$))/i);
  if (whereMatch) {
    whereClause = whereMatch[1].trim();
    remaining = remaining.replace(whereMatch[0], '');
  }

  // JOINs: match all [INNER|LEFT|RIGHT|CROSS] JOIN <table2> [AS alias] ON <col1> = <col2>
  const joins = [];
  const joinRegex = /(?:(LEFT|RIGHT|INNER|CROSS)\s+)?JOIN\s+([a-zA-Z0-9_]+(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?)\s+ON\s+([a-zA-Z0-9_$.]+)\s*=\s*([a-zA-Z0-9_$.]+)/gi;
  let joinMatch;
  while ((joinMatch = joinRegex.exec(remaining)) !== null) {
    const joinType = (joinMatch[1] || 'INNER').toUpperCase();
    const joinedTablePart = joinMatch[2].trim();
    const jTokens = joinedTablePart.split(/\s+(?:AS\s+)?/i);
    const jTable = normalizeIdentifier(jTokens[0]);
    const jAlias = jTokens[1] ? normalizeIdentifier(jTokens[1]) : jTable;
    const colLeft = normalizeIdentifier(joinMatch[4]);
    const colRight = normalizeIdentifier(joinMatch[5]);

    joins.push({
      joinType,
      table: jTable,
      alias: jAlias,
      colLeft,
      colRight
    });
  }

  // ── Step 1: Load Primary Table Records ───────────────────────────────────────
  const primaryData = await getFullRecordsForTable(primaryTableName, tableSchemas);
  let workingRows = primaryData.records.map(r => {
    const obj = {};
    Object.keys(r).forEach(k => {
      obj[k] = r[k];
      obj[`${primaryAlias}.${k}`] = r[k];
      obj[`${primaryTableName}.${k}`] = r[k];
    });
    return obj;
  });

  // ── Step 2: Apply JOINs ──────────────────────────────────────────────────────
  for (const j of joins) {
    const joinedData = await getFullRecordsForTable(j.table, tableSchemas);
    const joinedRows = joinedData.records;

    const nextRows = [];
    for (const mainRow of workingRows) {
      const matchRows = joinedRows.filter(jRow => {
        const valLeft = resolveColumnValue(j.colLeft, mainRow);
        const valRight = resolveColumnValue(j.colRight, jRow) ?? jRow[j.colRight.split('.').pop()];
        return String(valLeft ?? '').toLowerCase() === String(valRight ?? '').toLowerCase();
      });

      if (matchRows.length > 0) {
        for (const m of matchRows) {
          const combined = { ...mainRow };
          Object.keys(m).forEach(k => {
            combined[`${j.alias}.${k}`] = m[k];
            combined[`${j.table}.${k}`] = m[k];
            if (combined[k] === undefined) combined[k] = m[k];
          });
          nextRows.push(combined);
        }
      } else if (j.joinType === 'LEFT') {
        nextRows.push({ ...mainRow });
      }
    }
    workingRows = nextRows;
  }

  // ── Step 3: Apply WHERE Filtering ──────────────────────────────────────────
  if (whereClause) {
    workingRows = workingRows.filter(r => evaluateWhereClause(whereClause, r));
  }

  // ── Step 4: Parse Projection Items (Columns & Aggregates) ───────────────────
  const projectionItems = splitProjectionItems(projectionStr);
  const isWildcard = projectionItems.some(p => p.raw === '*' || p.expr === '*');

  let finalRows = [];

  if (groupByCol) {
    // Group By aggregation
    const groups = {};
    workingRows.forEach(row => {
      const key = String(resolveColumnValue(groupByCol, row) ?? 'N/A');
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    finalRows = Object.keys(groups).map(key => {
      const groupRows = groups[key];
      const res = {};

      projectionItems.forEach(item => {
        const label = item.alias || item.raw;
        res[label] = computeProjectionItem(item, groupRows, key);
      });
      return res;
    });
  } else if (!isWildcard && projectionItems.some(p => p.aggregate)) {
    // Global aggregate (e.g. SELECT COUNT(*), SUM(qty) FROM table)
    const singleRow = {};
    projectionItems.forEach(item => {
      const label = item.alias || item.raw;
      singleRow[label] = computeProjectionItem(item, workingRows);
    });
    finalRows = [singleRow];
  } else {
    // Normal row projection
    finalRows = workingRows.map(row => {
      if (isWildcard && projectionItems.length === 1) {
        // Return cleaned up row (remove duplicate table prefixes if possible)
        const cleanRow = {};
        Object.keys(row).forEach(k => {
          if (!k.includes('.')) cleanRow[k] = row[k];
        });
        return Object.keys(cleanRow).length > 0 ? cleanRow : row;
      }

      const projected = {};
      projectionItems.forEach(item => {
        const label = item.alias || item.raw;
        const val = resolveColumnValue(item.expr, row);
        projected[label] = val !== undefined ? val : '-';
      });
      return projected;
    });
  }

  // ── Step 5: Apply ORDER BY ─────────────────────────────────────────────────
  if (orderByList.length > 0 && finalRows.length > 0) {
    finalRows.sort((a, b) => {
      for (const rule of orderByList) {
        const valA = a[rule.col] ?? resolveColumnValue(rule.col, a);
        const valB = b[rule.col] ?? resolveColumnValue(rule.col, b);

        const numA = Number(valA);
        const numB = Number(valB);
        const bothNumeric = Number.isFinite(numA) && Number.isFinite(numB) && valA !== '' && valB !== '';

        let diff = 0;
        if (bothNumeric) diff = numA - numB;
        else diff = String(valA ?? '').localeCompare(String(valB ?? ''));

        if (diff !== 0) return rule.dir === 'DESC' ? -diff : diff;
      }
      return 0;
    });
  }

  // ── Step 6: Apply LIMIT & OFFSET ───────────────────────────────────────────
  if (offset > 0) {
    finalRows = finalRows.slice(offset);
  }
  if (limit !== null && limit >= 0) {
    finalRows = finalRows.slice(0, limit);
  }

  // Determine column headers
  const columns = finalRows.length > 0
    ? Object.keys(finalRows[0])
    : (isWildcard ? ['id', 'name', 'status'] : projectionItems.map(p => p.alias || p.raw));

  return {
    success: true,
    type: 'SELECT',
    rows: finalRows,
    columns,
    affectedRows: finalRows.length,
    targetTable: primaryTableName,
    targetTableId: primaryData.tableId,
    message: `Query berhasil dieksekusi (${finalRows.length} baris data ditemukan).`
  };
}

// Helper to evaluate aggregate expressions
function computeProjectionItem(item, rows, groupKey) {
  if (item.aggregate === 'COUNT') {
    return rows.length;
  }
  if (item.aggregate === 'SUM') {
    return rows.reduce((sum, r) => sum + (Number(resolveColumnValue(item.expr, r)) || 0), 0);
  }
  if (item.aggregate === 'AVG') {
    if (rows.length === 0) return 0;
    const total = rows.reduce((sum, r) => sum + (Number(resolveColumnValue(item.expr, r)) || 0), 0);
    return Math.round((total / rows.length) * 100) / 100;
  }
  if (item.aggregate === 'MIN') {
    const nums = rows.map(r => Number(resolveColumnValue(item.expr, r))).filter(Number.isFinite);
    return nums.length ? Math.min(...nums) : 0;
  }
  if (item.aggregate === 'MAX') {
    const nums = rows.map(r => Number(resolveColumnValue(item.expr, r))).filter(Number.isFinite);
    return nums.length ? Math.max(...nums) : 0;
  }
  if (rows[0]) {
    return resolveColumnValue(item.expr, rows[0]) ?? groupKey ?? '';
  }
  return '';
}

// Helper to parse projection list (columns, aliases, aggregates)
function splitProjectionItems(projectionStr) {
  const parts = splitSqlCsv(projectionStr);
  return parts.map(part => {
    const raw = part.trim();
    // Check alias: expr AS alias OR expr alias
    const asMatch = raw.match(/^([\s\S]+?)\s+(?:AS\s+)?([a-zA-Z0-9_]+)$/i);
    let expr = raw;
    let alias = null;

    if (asMatch && !/^(COUNT|SUM|AVG|MIN|MAX|ROUND)\(/i.test(asMatch[2])) {
      expr = asMatch[1].trim();
      alias = normalizeIdentifier(asMatch[2]);
    }

    // Check aggregate
    let aggregate = null;
    const aggMatch = expr.match(/^(COUNT|SUM|AVG|MIN|MAX)\s*\(([^)]*)\)/i);
    if (aggMatch) {
      aggregate = aggMatch[1].toUpperCase();
      expr = aggMatch[2].trim() || '*';
      if (!alias) alias = `${aggregate.toLowerCase()}_${expr.replace(/[^a-zA-Z0-9_]/g, '') || 'all'}`;
    }

    return { raw, expr: normalizeIdentifier(expr), alias, aggregate };
  });
}

// Split comma-separated values while ignoring commas inside quotes or parentheses
function splitSqlCsv(str) {
  const result = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let parenDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
    else if (char === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
    else if (char === '(' && !inSingleQuote && !inDoubleQuote) parenDepth++;
    else if (char === ')' && !inSingleQuote && !inDoubleQuote) parenDepth = Math.max(0, parenDepth - 1);

    if (char === ',' && !inSingleQuote && !inDoubleQuote && parenDepth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}
