export { getTables, createTable, updateTable, addTableRecord, getTableRecords, deleteTableRecord, updateTableRecord } from './supabaseTablesDB';
import { getTables, createTable, updateTable, addTableRecord, getTableRecords, deleteTableRecord, updateTableRecord } from './supabaseTablesDB';
import toast from 'react-hot-toast';

/**
 * vibeTableBridge.js
 * Bridges Sandpack Vibe Engine live apps with MaviCore AppBuilder & Supabase tables.
 * Supports:
 *  - Cara 1: postMessage event listener from Sandpack iframe to MaviCore table store.
 *  - Cara 2: Automatic schema extraction and table creation in MaviCore database.
 */

// Blacklist of UI-only state variables that should NEVER be treated as database table columns
export const UI_STATE_BLACKLIST = new Set([
  'logs', 'setlogs',
  'bridgeready', 'isbridgeready', 'ready', 'setready',
  'search', 'searchterm', 'searchquery', 'query', 'filter', 'filters', 'filterstatus',
  'selectedline', 'selectedjudgment', 'selectedtab', 'selecteditem', 'selectedid', 'selectedindex', 'selectedrow', 'selectedstatus',
  'ismodalopen', 'modalopen', 'isopen', 'open', 'showmodal', 'openmodal', 'dialogopen', 'isdialogopen',
  'copied', 'viewmode', 'viewportsize', 'loading', 'isloading', 'submitting', 'issubmitting', 'saving', 'issaving',
  'error', 'errors', 'activetab', 'currentstep', 'step', 'theme', 'darkmode', 'mode',
  'history', 'expanded', 'preview', 'tab', 'activeid', 'page', 'pagesize', 'sort', 'sortby', 'sortorder',
  'records', 'data', 'items', 'rows', 'list', 'tabledata', 'editingid', 'isediting', 'editid',
  'initialfiles', 'filetree', 'activefilepath'
]);

export function isJunkUiField(fieldName = '') {
  const f = String(fieldName || '').toLowerCase().trim();
  return UI_STATE_BLACKLIST.has(f);
}

export function inferFieldType(key = '', initialVal = '') {
  const k = String(key || '').toLowerCase();
  const v = String(initialVal || '').trim();

  if (v === 'true' || v === 'false') return 'boolean';
  if (!isNaN(Number(v)) && v !== '') {
    return Number.isInteger(Number(v)) ? 'integer' : 'number';
  }

  if (/temp|pressure|speed|count|qty|rpm|passed|rejected|yield|val|num|standar|standard|actual|hasil|nilai|berat|weight|panjang|tebal|lebar|arus|volt|amp/i.test(k)) {
    return 'number';
  }
  if (/time|date|waktu|tanggal|jam/i.test(k)) {
    return 'datetime';
  }
  if (/^is[A-Z]|^has[A-Z]|enabled|active|running|pass|lulus|checked/i.test(k)) {
    return 'boolean';
  }
  return 'text';
}

/**
 * Extracts a proposed table schema (name, description, fields) from React code.
 * Accurately extracts actual form input fields and ignores UI state variables (like logs, isModalOpen, search, etc.).
 * @param {string} reactCode
 * @returns {{ name: string, description: string, fields: Array<{ name: string, type: string }> }}
 */
export function extractTableSchemaFromCode(reactCode = '') {
  if (!reactCode || typeof reactCode !== 'string') {
    return {
      name: 'Vibe App Records',
      description: 'Auto-generated table from Sandpack Vibe App',
      fields: [
        { name: 'recordId', type: 'text' },
        { name: 'timestamp', type: 'datetime' },
        { name: 'status', type: 'text' },
        { name: 'notes', type: 'text' }
      ]
    };
  }

  // 1. Detect Table Name
  let tableName = '';

  // Look for useMaviCoreData('...')
  const hookLiteralMatch = reactCode.match(/useMaviCoreData\(\s*['"`]([^'"`]+)['"`]\s*\)/i);
  if (hookLiteralMatch) {
    tableName = hookLiteralMatch[1].trim();
  }

  // Look for const TABLE_NAME = '...' or const tableName = '...'
  if (!tableName) {
    const tableConstMatch = reactCode.match(/const\s+(?:TABLE_NAME|tableName|targetTable)\s*=\s*['"`]([^'"`]+)['"`]/i);
    if (tableConstMatch) {
      tableName = tableConstMatch[1].trim();
    }
  }

  // Look for MaviCoreBridge.(read|save|update|delete|onRecord)('...')
  if (!tableName) {
    const bridgeMatch = reactCode.match(/MaviCoreBridge\.(?:read|save|update|delete|onRecord)\(\s*['"`]([^'"`]+)['"`]/i);
    if (bridgeMatch) {
      tableName = bridgeMatch[1].trim();
    }
  }

  // Look for tableName in postMessage: tableName: '...'
  if (!tableName) {
    const pmMatch = reactCode.match(/tableName\s*:\s*['"`]([^'"`]+)['"`]/i);
    if (pmMatch) {
      tableName = pmMatch[1].trim();
    }
  }

  // If not found, look for <h1> title: <h1>...</h1>
  if (!tableName) {
    const h1Match = reactCode.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      tableName = h1Match[1].trim().replace(/[^\w\s-]/g, '').slice(0, 40);
    }
  }

  // If not found, look for component name: export default function X
  if (!tableName) {
    const fnMatch = reactCode.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
    if (fnMatch) {
      tableName = fnMatch[1].replace(/([A-Z])/g, ' $1').trim();
    }
  }

  if (!tableName) {
    tableName = 'Vibe MES App Data';
  }

  // 2. Detect Fields - Focus strictly on genuine Form inputs & ignore UI states
  const fieldMap = new Map();

  // Baseline fields
  fieldMap.set('recordId', { name: 'recordId', type: 'text' });
  fieldMap.set('timestamp', { name: 'timestamp', type: 'datetime' });

  // A. Detect Form State Objects in useState({ ... })
  // e.g. const [form, setForm] = useState({ line: 'Line A', shift: 'Shift 1', operator: '', ... })
  const formObjectStateRegex = /const\s+\[([a-zA-Z0-9_]+),\s*set[a-zA-Z0-9_]+\]\s*=\s*useState\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
  let formObjMatch;
  while ((formObjMatch = formObjectStateRegex.exec(reactCode)) !== null) {
    const stateName = formObjMatch[1].toLowerCase();
    if (isJunkUiField(stateName)) continue;

    const objBody = formObjMatch[2];
    const keyValRegex = /([a-zA-Z0-9_]+)\s*:\s*([^,\n}]+)/g;
    let kvMatch;
    while ((kvMatch = keyValRegex.exec(objBody)) !== null) {
      const key = kvMatch[1].trim();
      const val = kvMatch[2].trim();
      if (!isJunkUiField(key) && !fieldMap.has(key)) {
        fieldMap.set(key, { name: key, type: inferFieldType(key, val) });
      }
    }
  }

  // B. Detect Form Input elements in JSX: <input name="foo" />, <select name="foo" />, <textarea name="foo" />
  const inputNameRegex = /<(?:input|select|textarea)[^>]+name\s*=\s*['"`]([a-zA-Z0-9_]+)['"`]/gi;
  let inputNameMatch;
  while ((inputNameMatch = inputNameRegex.exec(reactCode)) !== null) {
    const key = inputNameMatch[1].trim();
    if (!isJunkUiField(key) && !fieldMap.has(key)) {
      fieldMap.set(key, { name: key, type: inferFieldType(key, '') });
    }
  }

  // C. Detect form property references in JSX: form.operator, formData.parameter, etc.
  const formPropRegex = /(?:formData|form|entry|item|record|input)\.([a-zA-Z0-9_]+)/g;
  let propMatch;
  while ((propMatch = formPropRegex.exec(reactCode)) !== null) {
    const key = propMatch[1].trim();
    if (!isJunkUiField(key) && !['id', 'recordId', 'timestamp', 'createdAt'].includes(key) && !fieldMap.has(key)) {
      fieldMap.set(key, { name: key, type: inferFieldType(key, '') });
    }
  }

  // D. Detect payload objects in insert({ ... }) or save(TABLE, { ... }) or data: { ... }
  const payloadBlockRegex = /(?:insert|save)\s*\(\s*(?:['"`][^'"`]+['"`]\s*,\s*)?\{\s*([\s\S]*?)\s*\}\s*\)/g;
  let payloadMatch;
  while ((payloadMatch = payloadBlockRegex.exec(reactCode)) !== null) {
    const body = payloadMatch[1];
    const keys = body.match(/([a-zA-Z0-9_]+)\s*:/g);
    if (keys) {
      keys.forEach(k => {
        const cleanKey = k.replace(':', '').trim();
        if (!isJunkUiField(cleanKey) && !fieldMap.has(cleanKey)) {
          fieldMap.set(cleanKey, { name: cleanKey, type: inferFieldType(cleanKey, '') });
        }
      });
    }
  }

  // E. Detect postMessage data: { ... }
  const dataBlockMatch = reactCode.match(/data\s*:\s*\{([^}]+)\}/);
  if (dataBlockMatch) {
    const keys = dataBlockMatch[1].match(/([a-zA-Z0-9_]+)\s*:/g);
    if (keys) {
      keys.forEach(k => {
        const cleanKey = k.replace(':', '').trim();
        if (!isJunkUiField(cleanKey) && !fieldMap.has(cleanKey)) {
          fieldMap.set(cleanKey, { name: cleanKey, type: inferFieldType(cleanKey, '') });
        }
      });
    }
  }

  // F. Detect scalar useState hooks ONLY if they are NOT in the UI state blacklist
  const stateRegex = /const\s+\[([a-zA-Z0-9_]+),\s*set[a-zA-Z0-9_]+\]\s*=\s*useState\(([^)]*)\)/g;
  let match;
  while ((match = stateRegex.exec(reactCode)) !== null) {
    const varName = match[1];
    const initialVal = match[2].trim();

    if (isJunkUiField(varName)) {
      continue;
    }

    if (initialVal.startsWith('{') || initialVal.startsWith('[')) {
      continue;
    }

    if (!fieldMap.has(varName)) {
      fieldMap.set(varName, { name: varName, type: inferFieldType(varName, initialVal) });
    }
  }

  // If after all extraction only baseline fields exist, provide standard frontline fields
  if (fieldMap.size <= 2) {
    fieldMap.set('operator', { name: 'operator', type: 'text' });
    fieldMap.set('status', { name: 'status', type: 'text' });
    fieldMap.set('notes', { name: 'notes', type: 'text' });
  }

  return {
    name: tableName,
    description: `Tabel otomatis untuk komponen Vibe Sandbox: ${tableName}`,
    fields: Array.from(fieldMap.values())
  };
}

/**
 * Creates or synchronizes a MaviCore database table for the given Vibe app code.
 * Cleans out any obsolete UI state fields and ensures real form fields are present.
 * @param {string} reactCode
 * @returns {Promise<{ table: object, isNew: boolean, recordCount: number }>}
 */
export async function syncVibeAppToTable(reactCode) {
  const schema = extractTableSchemaFromCode(reactCode);
  
  // 1. Check if table already exists in MaviCore
  const existingTables = await getTables();
  let targetTable = (existingTables || []).find(
    t => t.name?.toLowerCase().trim() === schema.name.toLowerCase().trim()
  );

  let isNew = false;
  if (!targetTable) {
    // 2. Create the table in Supabase / LocalDB
    targetTable = await createTable({
      name: schema.name,
      description: schema.description,
      fields: schema.fields
    });
    isNew = true;
  } else {
    // 3. Clean up legacy junk UI fields and merge new form fields
    const currentFields = targetTable.fields || [];
    const cleaned = currentFields.filter(f => !isJunkUiField(f.name));
    let fieldsChanged = cleaned.length !== currentFields.length;

    for (const sf of schema.fields) {
      if (!cleaned.some(f => f.name.toLowerCase() === sf.name.toLowerCase())) {
        cleaned.push(sf);
        fieldsChanged = true;
      }
    }

    if (fieldsChanged) {
      try {
        targetTable = await updateTable(targetTable.id, { fields: cleaned });
      } catch (err) {
        console.warn('[vibeTableBridge] Could not update existing table schema:', err);
      }
    }
  }

  // 4. Get current record count
  let recordCount = 0;
  try {
    const records = await getTableRecords(targetTable.id);
    recordCount = Array.isArray(records) ? records.length : 0;
  } catch {
    recordCount = 0;
  }

  return {
    table: targetTable,
    isNew,
    recordCount
  };
}

/**
 * Records an entry from Sandpack Vibe into the matched MaviCore table.
 * Automatically synchronizes clean form fields and ignores UI states.
 * @param {string} tableNameOrId
 * @param {object} recordData
 * @returns {Promise<object>}
 */
export async function saveVibeRecord(tableNameOrId, recordData = {}) {
  const tables = await getTables();
  let targetTable = (tables || []).find(
    t => t.id === tableNameOrId || t.name?.toLowerCase().trim() === String(tableNameOrId || '').toLowerCase().trim()
  );

  const incomingKeys = Object.keys(recordData).filter(
    k => !['recordId', 'timestamp', 'id', 'ID', 'Id', 'createdAt', 'tableId'].includes(k) && !isJunkUiField(k)
  );

  if (!targetTable) {
    // Auto create if not found with clean form fields
    const initialFields = [
      { name: 'recordId', type: 'text' },
      { name: 'timestamp', type: 'datetime' },
      ...incomingKeys.map(k => ({
        name: k,
        type: inferFieldType(k, recordData[k])
      }))
    ];

    targetTable = await createTable({
      name: String(tableNameOrId || 'Vibe App Records'),
      description: 'Auto-created table from Sandpack live recording',
      fields: initialFields
    });
  } else {
    // Sync any newly discovered clean fields and remove junk UI fields
    const currentFields = targetTable.fields || [];
    const cleaned = currentFields.filter(f => !isJunkUiField(f.name));
    let fieldsChanged = cleaned.length !== currentFields.length;

    for (const k of incomingKeys) {
      if (!cleaned.some(f => f.name.toLowerCase() === k.toLowerCase())) {
        cleaned.push({
          name: k,
          type: inferFieldType(k, recordData[k])
        });
        fieldsChanged = true;
      }
    }

    if (fieldsChanged) {
      try {
        targetTable = await updateTable(targetTable.id, { fields: cleaned });
      } catch (e) {
        console.warn('[vibeTableBridge] Could not sync new fields to table:', e);
      }
    }
  }

  // Filter out any UI state fields from the record payload before saving
  const cleanPayload = {};
  for (const [k, v] of Object.entries(recordData)) {
    if (!isJunkUiField(k)) {
      cleanPayload[k] = v;
    }
  }

  const payload = {
    recordId: recordData.recordId || recordData.id || `VIBE_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: recordData.timestamp || new Date().toISOString(),
    ...cleanPayload
  };

  const saved = await addTableRecord(targetTable.id, payload);
  return { saved, table: targetTable };
}

/**
 * Initializes the global postMessage listener for Sandpack Vibe apps.
 * Supports:
 *  - MAVICORE_TABLE_INSERT: Save a record to a table
 *  - MAVICORE_TABLE_READ: Read records from a table
 * @param {Function} onRecordSaved callback (table, record) => void
 * @returns {Function} cleanup function to remove event listener
 */
export function initVibeMessageListener(onRecordSaved) {
  const handleMessage = async (event) => {
    if (!event.data || typeof event.data !== 'object') return;
    const { type, table, tableName, data } = event.data;

    // Helper to broadcast response back to event.source and all iframes in the document
    const broadcastToSandpack = (msg) => {
      try { event.source?.postMessage(msg, '*'); } catch (_) {}
      if (typeof window !== 'undefined') {
        try { window.postMessage(msg, '*'); } catch (_) {}
      }
      if (typeof document !== 'undefined') {
        document.querySelectorAll('iframe').forEach(ifr => {
          try { ifr.contentWindow?.postMessage(msg, '*'); } catch (_) {}
        });
      }
    };

    // ─── INSERT: Save record to table ───
    if (type === 'MAVICORE_TABLE_INSERT' && data) {
      const targetName = table || tableName || 'Vibe App Records';
      try {
        const { saved, table: matchedTable } = await saveVibeRecord(targetName, data);
        toast.success(`📊 [${matchedTable.name}] Record baru tersimpan otomatis ke MaviCore!`, {
          duration: 3500,
          icon: '✅'
        });
        broadcastToSandpack({
          type: 'MAVICORE_RECORD_SAVED',
          table: matchedTable.name,
          tableName: matchedTable.name,
          tableId: matchedTable.id,
          record: saved,
          data: saved,
          reqId: event.data.reqId
        });
        if (typeof onRecordSaved === 'function') {
          onRecordSaved(matchedTable, saved);
        }
      } catch (err) {
        console.error('[vibeTableBridge] Gagal menyimpan record dari Sandpack:', err);
        toast.error(`Gagal menyimpan record ke tabel: ${err.message || 'Database error'}`);
      }
    }

    // ─── READ / QUERY: Fetch records from table ───
    if (type === 'MAVICORE_TABLE_READ' || type === 'MAVICORE_TABLE_QUERY') {
      const targetName = table || tableName;
      if (!targetName) return;

      try {
        // Find the table
        const tables = await getTables();
        const targetTable = (tables || []).find(
          t => t.id === targetName || t.name?.toLowerCase().trim() === String(targetName || '').toLowerCase().trim()
        );

        if (!targetTable) {
          broadcastToSandpack({
            type: 'MAVICORE_TABLE_READ_RESPONSE',
            tableName: targetName,
            table: targetName,
            records: []
          });
          if (event.data.reqId) {
            broadcastToSandpack({
              type: 'MAVICORE_TABLE_RESULT',
              tableName: targetName,
              table: targetName,
              reqId: event.data.reqId,
              records: []
            });
          }
          return;
        }

        // Fetch records
        const records = await getTableRecords(targetTable.id);

        broadcastToSandpack({
          type: 'MAVICORE_TABLE_READ_RESPONSE',
          tableName: targetName,
          table: targetName,
          records: records || []
        });

        if (event.data.reqId) {
          broadcastToSandpack({
            type: 'MAVICORE_TABLE_RESULT',
            tableName: targetName,
            table: targetName,
            reqId: event.data.reqId,
            records: records || []
          });
        }
      } catch (err) {
        console.error('[vibeTableBridge] Gagal membaca record dari Sandpack:', err);
        broadcastToSandpack({
          type: 'MAVICORE_TABLE_READ_RESPONSE',
          tableName: targetName,
          records: [],
          error: err.message
        });
      }
    }

    // ─── DELETE: Delete a record from table ───
    // ─── DELETE: Delete a record from table ───
    if (type === 'MAVICORE_TABLE_DELETE') {
      const targetName = table || tableName;
      const { recordId } = event.data;

      if (!targetName || !recordId) return;

      try {
        const tables = await getTables();
        const targetTable = (tables || []).find(
          t => t.id === targetName || t.name?.toLowerCase().trim() === String(targetName || '').toLowerCase().trim()
        );

        if (targetTable) {
          const records = await getTableRecords(targetTable.id);
          const recordToDelete = (records || []).find(
            r => r.id === recordId || r.recordId === recordId || r.record_id === recordId || String(r.id) === String(recordId) || String(r.recordId) === String(recordId)
          );

          if (recordToDelete) {
            await deleteTableRecord(recordToDelete.id);
            toast.success(`🗑️ Record berhasil dihapus dari "${targetTable.name}"`, {
              duration: 2500,
              icon: '✅'
            });
          }
        }

        // Always broadcast deletion back to Sandpack so client state updates cleanly
        broadcastToSandpack({
          type: 'MAVICORE_RECORD_DELETED',
          table: targetTable?.name || targetName,
          tableName: targetTable?.name || targetName,
          recordId: recordId,
          reqId: event.data.reqId
        });

        if (typeof onRecordSaved === 'function') {
          onRecordSaved(targetTable || { name: targetName }, { deleted: true, recordId });
        }
      } catch (err) {
        console.error('[vibeTableBridge] Gagal menghapus record:', err);
        // Still broadcast to client to prevent hanging
        broadcastToSandpack({
          type: 'MAVICORE_RECORD_DELETED',
          table: targetName,
          tableName: targetName,
          recordId: recordId,
          reqId: event.data.reqId
        });
      }
    }

    // ─── UPDATE: Update a record in table ───
    if (type === 'MAVICORE_TABLE_UPDATE') {
      const targetName = table || tableName;
      const { recordId, data: updateData } = event.data;

      if (!targetName || !recordId) return;

      try {
        const tables = await getTables();
        let targetTable = (tables || []).find(
          t => t.id === targetName || t.name?.toLowerCase().trim() === String(targetName || '').toLowerCase().trim()
        );

        let updated = null;
        if (targetTable) {
          const records = await getTableRecords(targetTable.id);
          const recordToUpdate = (records || []).find(
            r => r.id === recordId || r.recordId === recordId || r.record_id === recordId || String(r.id) === String(recordId) || String(r.recordId) === String(recordId)
          );

          if (recordToUpdate) {
            updated = await updateTableRecord(recordToUpdate.id, updateData);
            toast.success(`✏️ Record berhasil diupdate di "${targetTable.name}"`, {
              duration: 2500,
              icon: '✅'
            });
          } else {
            // If record wasn't in DB yet, add it
            const { saved } = await saveVibeRecord(targetTable.id, { recordId, ...updateData });
            updated = saved;
          }
        } else {
          // If table didn't exist yet, auto-create and save
          const { saved, table: newTable } = await saveVibeRecord(targetName, { recordId, ...updateData });
          targetTable = newTable;
          updated = saved;
        }

        broadcastToSandpack({
          type: 'MAVICORE_RECORD_UPDATED',
          table: targetTable?.name || targetName,
          tableName: targetTable?.name || targetName,
          recordId: recordId,
          data: updateData,
          record: updated || { recordId, ...updateData },
          reqId: event.data.reqId
        });

        if (typeof onRecordSaved === 'function') {
          onRecordSaved(targetTable || { name: targetName }, { updated: true, recordId, record: updated });
        }
      } catch (err) {
        console.error('[vibeTableBridge] Gagal mengupdate record:', err);
        broadcastToSandpack({
          type: 'MAVICORE_RECORD_UPDATED',
          table: targetName,
          tableName: targetName,
          recordId: recordId,
          data: updateData,
          record: { recordId, ...updateData },
          reqId: event.data.reqId
        });
      }
    }

    // ─── CREATE TABLE: Create a new table ───
    if (type === 'MAVICORE_TABLE_CREATE') {
      const { tableName: newTableName, fields } = event.data;

      if (!newTableName) return;

      try {
        // Check if table already exists
        const existingTables = await getTables();
        const exists = (existingTables || []).some(
          t => t.name?.toLowerCase().trim() === newTableName.toLowerCase().trim()
        );

        if (exists) {
          toast.success(`📋 Tabel "${newTableName}" sudah ada!`);
          return;
        }

        // Create the table
        const newTable = await createTable({
          name: newTableName,
          description: `Tabel dibuat dari Vibe Sandbox App`,
          fields: fields || [
            { name: 'recordId', type: 'text' },
            { name: 'timestamp', type: 'datetime' },
            { name: 'status', type: 'text' }
          ]
        });

        toast.success(`🆕 Tabel "${newTable.name}" berhasil dibuat!`, {
          duration: 3000,
          icon: '✅'
        });

        if (typeof onRecordSaved === 'function') {
          onRecordSaved(newTable, { created: true });
        }
      } catch (err) {
        console.error('[vibeTableBridge] Gagal membuat tabel:', err);
        toast.error(`Gagal membuat tabel: ${err.message || 'Database error'}`);
      }
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}

/**
 * Saves and deploys a Sandpack Vibe app to MaviCore frontline_apps.
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.category
 * @param {string} params.code
 * @param {boolean} params.isPublished
 * @returns {Promise<object>} saved app
 */
export async function deployVibeAppToFrontline({ id, name, category = 'Shop Floor', code, isPublished = true }) {
  const schema = extractTableSchemaFromCode(code);
  const appName = (name || schema.name || 'Vibe Production App').trim();

  const config = {
    appType: 'vibe_sandpack',
    vibeCode: code,
    tableName: schema.name,
    steps: [
      {
        id: 'step_vibe_main',
        name: 'Main HMI Screen',
        components: []
      }
    ]
  };

  const appPayload = {
    ...(id ? { id } : {}),
    name: appName,
    description: `Aplikasi HMI/Frontline dibuat dengan Sandpack Vibe Engine. Terhubung ke tabel: ${schema.name}`,
    category: category || 'Shop Floor',
    config,
    builder_type: 'sandbox',
    is_published: Boolean(isPublished),
    approval_status: isPublished ? 'PUBLISHED' : 'DRAFT'
  };

  // Dynamically import or call saveFrontlineApp
  const { saveFrontlineApp, publishApp } = await import('./supabaseFrontlineDB.js');
  const saved = await saveFrontlineApp(appPayload);

  if (isPublished && saved?.id) {
    try {
      await publishApp(saved.id);
    } catch (_) {
      // fallback if already flagged
    }
  }

  return saved;
}

