export { getTables, createTable, addTableRecord, getTableRecords, deleteTableRecord, updateTableRecord } from './supabaseTablesDB';
import { getTables, createTable, addTableRecord, getTableRecords, deleteTableRecord, updateTableRecord } from './supabaseTablesDB';
import toast from 'react-hot-toast';

/**
 * vibeTableBridge.js
 * Bridges Sandpack Vibe Engine live apps with MaviCore AppBuilder & Supabase tables.
 * Supports:
 *  - Cara 1: postMessage event listener from Sandpack iframe to MaviCore table store.
 *  - Cara 2: Automatic schema extraction and table creation in MaviCore database.
 */

/**
 * Extracts a proposed table schema (name, description, fields) from React code
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

  // Look for tableName in postMessage: tableName: '...'
  const pmMatch = reactCode.match(/tableName\s*:\s*['"`]([^'"`]+)['"`]/i);
  if (pmMatch) {
    tableName = pmMatch[1].trim();
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

  // 2. Detect Fields from useState and postMessage
  const fieldMap = new Map();

  // Always include baseline fields
  fieldMap.set('recordId', { name: 'recordId', type: 'text' });
  fieldMap.set('timestamp', { name: 'timestamp', type: 'datetime' });

  // Detect postMessage payload fields
  const dataBlockMatch = reactCode.match(/data\s*:\s*\{([^}]+)\}/);
  if (dataBlockMatch) {
    const keys = dataBlockMatch[1].match(/([a-zA-Z0-9_]+)\s*:/g);
    if (keys) {
      keys.forEach(k => {
        const cleanKey = k.replace(':', '').trim();
        if (cleanKey && !fieldMap.has(cleanKey)) {
          let type = 'text';
          if (/temp|pressure|speed|count|qty|rpm|passed|rejected|yield|val|num/i.test(cleanKey)) {
            type = 'number';
          } else if (/time|date/i.test(cleanKey)) {
            type = 'datetime';
          } else if (/is|has|enabled|active|running/i.test(cleanKey)) {
            type = 'boolean';
          }
          fieldMap.set(cleanKey, { name: cleanKey, type });
        }
      });
    }
  }

  // Detect useState hooks: const [foo, setFoo] = useState(initialVal)
  const stateRegex = /const\s+\[([a-zA-Z0-9_]+),\s*set[a-zA-Z0-9_]+\]\s*=\s*useState\(([^)]*)\)/g;
  let match;
  while ((match = stateRegex.exec(reactCode)) !== null) {
    const varName = match[1];
    const initialVal = match[2].trim();

    if (['copied', 'viewMode', 'viewportSize', 'loading', 'modalOpen'].includes(varName)) {
      continue;
    }

    let type = 'text';
    if (!isNaN(Number(initialVal)) && initialVal !== '') {
      type = Number.isInteger(Number(initialVal)) ? 'integer' : 'number';
    } else if (initialVal === 'true' || initialVal === 'false') {
      type = 'boolean';
    } else if (initialVal.startsWith('{') || initialVal.startsWith('[')) {
      continue;
    }

    if (!fieldMap.has(varName)) {
      fieldMap.set(varName, { name: varName, type });
    }
  }

  // Always ensure status field
  if (!fieldMap.has('status')) {
    fieldMap.set('status', { name: 'status', type: 'text' });
  }

  return {
    name: tableName,
    description: `Tabel otomatis untuk komponen Vibe Sandbox: ${tableName}`,
    fields: Array.from(fieldMap.values())
  };
}

/**
 * Creates or synchronizes a MaviCore database table for the given Vibe app code.
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
  }

  // 3. Get current record count
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
 * @param {string} tableNameOrId
 * @param {object} recordData
 * @returns {Promise<object>}
 */
export async function saveVibeRecord(tableNameOrId, recordData = {}) {
  const tables = await getTables();
  let targetTable = (tables || []).find(
    t => t.id === tableNameOrId || t.name?.toLowerCase().trim() === String(tableNameOrId || '').toLowerCase().trim()
  );

  if (!targetTable) {
    // Auto create if not found
    targetTable = await createTable({
      name: String(tableNameOrId || 'Vibe App Records'),
      description: 'Auto-created table from Sandpack live recording',
      fields: Object.keys(recordData).map(k => ({
        name: k,
        type: typeof recordData[k] === 'number' ? 'number' : (typeof recordData[k] === 'boolean' ? 'boolean' : 'text')
      }))
    });
  }

  const payload = {
    recordId: recordData.recordId || recordData.id || `VIBE_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: recordData.timestamp || new Date().toISOString(),
    ...recordData
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
    // Accept messages of type MAVICORE_TABLE_INSERT or MAVICORE_TABLE_READ
    if (!event.data || typeof event.data !== 'object') return;
    const { type, table, tableName, data } = event.data;

    // ─── INSERT: Save record to table ───
    if (type === 'MAVICORE_TABLE_INSERT' && data) {
      const targetName = table || tableName || 'Vibe App Records';
      try {
        const { saved, table: matchedTable } = await saveVibeRecord(targetName, data);
        toast.success(`📊 [${matchedTable.name}] Record baru tersimpan otomatis ke MaviCore!`, {
          duration: 3500,
          icon: '✅'
        });
        if (typeof onRecordSaved === 'function') {
          onRecordSaved(matchedTable, saved);
        }
      } catch (err) {
        console.error('[vibeTableBridge] Gagal menyimpan record dari Sandpack:', err);
        toast.error(`Gagal menyimpan record ke tabel: ${err.message || 'Database error'}`);
      }
    }

    // ─── READ: Fetch records from table ───
    if (type === 'MAVICORE_TABLE_READ') {
      const targetName = table || tableName;
      if (!targetName) return;

      try {
        // Find the table
        const tables = await getTables();
        const targetTable = (tables || []).find(
          t => t.id === targetName || t.name?.toLowerCase().trim() === String(targetName || '').toLowerCase().trim()
        );

        if (!targetTable) {
          // Table doesn't exist yet - return empty array
          event.source?.postMessage({
            type: 'MAVICORE_TABLE_READ_RESPONSE',
            tableName: targetName,
            records: []
          }, '*');
          return;
        }

        // Fetch records
        const records = await getTableRecords(targetTable.id);

        // Send response back to sandbox iframe
        event.source?.postMessage({
          type: 'MAVICORE_TABLE_READ_RESPONSE',
          tableName: targetName,
          records: records || []
        }, '*');
      } catch (err) {
        console.error('[vibeTableBridge] Gagal membaca record dari Sandpack:', err);
        event.source?.postMessage({
          type: 'MAVICORE_TABLE_READ_RESPONSE',
          tableName: targetName,
          records: [],
          error: err.message
        }, '*');
      }
    }

    // ─── DELETE: Delete a record from table ───
    if (type === 'MAVICORE_TABLE_DELETE') {
      const targetName = table || tableName;
      const { recordId, recordInternalId } = event.data;

      if (!targetName) return;

      try {
        // Find the table first
        const tables = await getTables();
        const targetTable = (tables || []).find(
          t => t.id === targetName || t.name?.toLowerCase().trim() === String(targetName || '').toLowerCase().trim()
        );

        if (!targetTable) {
          toast.error(`Tabel "${targetName}" tidak ditemukan`);
          return;
        }

        // Get records to find the internal ID
        const records = await getTableRecords(targetTable.id);
        const recordToDelete = (records || []).find(
          r => r.id === recordId || r.record_id === recordId
        );

        if (!recordToDelete) {
          toast.error(`Record tidak ditemukan`);
          return;
        }

        // Delete the record
        await deleteTableRecord(recordToDelete.id);

        toast.success(`🗑️ Record berhasil dihapus dari "${targetTable.name}"`, {
          duration: 2500,
          icon: '✅'
        });

        // Notify callback
        if (typeof onRecordSaved === 'function') {
          onRecordSaved(targetTable, { deleted: true, recordId });
        }
      } catch (err) {
        console.error('[vibeTableBridge] Gagal menghapus record:', err);
        toast.error(`Gagal menghapus record: ${err.message || 'Database error'}`);
      }
    }

    // ─── UPDATE: Update a record in table ───
    if (type === 'MAVICORE_TABLE_UPDATE') {
      const targetName = table || tableName;
      const { recordId, data: updateData } = event.data;

      if (!targetName || !recordId) return;

      try {
        // Find the table
        const tables = await getTables();
        const targetTable = (tables || []).find(
          t => t.id === targetName || t.name?.toLowerCase().trim() === String(targetName || '').toLowerCase().trim()
        );

        if (!targetTable) {
          toast.error(`Tabel "${targetName}" tidak ditemukan`);
          return;
        }

        // Get records to find the internal ID
        const records = await getTableRecords(targetTable.id);
        const recordToUpdate = (records || []).find(
          r => r.id === recordId || r.record_id === recordId
        );

        if (!recordToUpdate) {
          toast.error(`Record tidak ditemukan`);
          return;
        }

        // Update the record
        await updateTableRecord(recordToUpdate.id, updateData);

        toast.success(`✏️ Record berhasil diupdate di "${targetTable.name}"`, {
          duration: 2500,
          icon: '✅'
        });

        if (typeof onRecordSaved === 'function') {
          onRecordSaved(targetTable, { updated: true, recordId });
        }
      } catch (err) {
        console.error('[vibeTableBridge] Gagal mengupdate record:', err);
        toast.error(`Gagal mengupdate record: ${err.message || 'Database error'}`);
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
export async function deployVibeAppToFrontline({ name, category = 'Shop Floor', code, isPublished = true }) {
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
    name: appName,
    description: `Aplikasi HMI/Frontline dibuat dengan Sandpack Vibe Engine. Terhubung ke tabel: ${schema.name}`,
    category: category || 'Shop Floor',
    config,
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

