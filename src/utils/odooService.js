/**
 * Odoo ERP Service & Data Engine with Automation Triggers
 * ==============================================================
 * Comprehensive connector for Odoo ERP (v14, v15, v16, v17+).
 * Supports:
 * - BACA DATA: search_read, search, read
 * - TAMBAH DATA: create
 * - UPDATE DATA: write
 * - HAPUS DATA: unlink
 * - MANIPULASI DATA: execute_kw / custom methods (action_confirm, button_mark_done, etc.)
 * - TRIGGER ENGINE: Event-driven triggers for shop floor actions & data manipulation
 * - Hybrid mode: Live JSON-RPC with intelligent fallback to local interactive sandbox.
 */

const STORAGE_KEY_CONFIG = 'mavi_odoo_config';
const STORAGE_KEY_SANDBOX = 'mavi_odoo_sandbox_data';
const STORAGE_KEY_TRIGGERS = 'mavi_odoo_triggers';
const STORAGE_KEY_TRIGGER_LOGS = 'mavi_odoo_trigger_logs';

// Default connection configuration
export const DEFAULT_ODOO_CONFIG = {
  url: 'http://localhost:8069',
  db: 'odoo_mes_db',
  username: 'admin',
  password: '',
  version: 17,
  useSimulation: true, // Default to true so user can test immediately without setup
  corsProxyUrl: '' // Optional CORS proxy if needed
};

// Initial realistic MES dataset for Odoo models
const INITIAL_SANDBOX_DATA = {
  'mrp.production': [
    {
      id: 101,
      name: 'MO/2026/00142',
      product_id: [42, '[FRM-6061] Bicycle Frame Alloy 6061-T6'],
      product_qty: 50.0,
      qty_producing: 35.0,
      state: 'progress',
      date_planned_start: '2026-09-28 08:00:00',
      workcenter_id: [1, 'CNC Milling Station 01'],
      origin: 'SO/2026/0045',
      priority: '1'
    },
    {
      id: 102,
      name: 'MO/2026/00143',
      product_id: [78, '[VLV-HYD-02] Hydraulic Pump Valve Body'],
      product_qty: 120.0,
      qty_producing: 0.0,
      state: 'confirmed',
      date_planned_start: '2026-09-29 07:30:00',
      workcenter_id: [3, 'Lathe Station 03'],
      origin: 'SO/2026/0048',
      priority: '2'
    },
    {
      id: 103,
      name: 'MO/2026/00144',
      product_id: [91, '[MTR-48V] Electric Motor Casing 48V High Torque'],
      product_qty: 80.0,
      qty_producing: 80.0,
      state: 'to_close',
      date_planned_start: '2026-09-27 10:00:00',
      workcenter_id: [2, 'Assembly Cell 02'],
      origin: 'SO/2026/0051',
      priority: '1'
    },
    {
      id: 104,
      name: 'MO/2026/00145',
      product_id: [115, '[ENC-IP67] Control Panel Enclosure IP67 Stainless'],
      product_qty: 25.0,
      qty_producing: 25.0,
      state: 'done',
      date_planned_start: '2026-09-25 08:00:00',
      workcenter_id: [4, 'Sheet Metal Press 01'],
      origin: 'SO/2026/0039',
      priority: '0'
    },
    {
      id: 105,
      name: 'MO/2026/00146',
      product_id: [55, '[BRK-CALIP-01] Brake Caliper Heavy Duty Dual Piston'],
      product_qty: 60.0,
      qty_producing: 0.0,
      state: 'draft',
      date_planned_start: '2026-09-30 09:00:00',
      workcenter_id: [1, 'CNC Milling Station 01'],
      origin: 'Manual Forecast',
      priority: '0'
    }
  ],

  'mrp.workorder': [
    {
      id: 201,
      name: 'Cutting & Deburring Raw Billet',
      production_id: [101, 'MO/2026/00142'],
      workcenter_id: [5, 'Bandsaw Cutting Station'],
      state: 'done',
      qty_production: 50.0,
      qty_produced: 50.0,
      duration_expected: 45.0,
      duration: 42.5
    },
    {
      id: 202,
      name: '5-Axis CNC Precision Milling Profile',
      production_id: [101, 'MO/2026/00142'],
      workcenter_id: [1, 'CNC Milling Station 01'],
      state: 'progress',
      qty_production: 50.0,
      qty_produced: 35.0,
      duration_expected: 120.0,
      duration: 85.0
    },
    {
      id: 203,
      name: 'Surface Anodizing & Protective Coating',
      production_id: [101, 'MO/2026/00142'],
      workcenter_id: [6, 'Chemical Coating Bay'],
      state: 'ready',
      qty_production: 50.0,
      qty_produced: 0.0,
      duration_expected: 60.0,
      duration: 0.0
    },
    {
      id: 204,
      name: 'Rough Turning Outer Diameter',
      production_id: [102, 'MO/2026/00143'],
      workcenter_id: [3, 'Lathe Station 03'],
      state: 'ready',
      qty_production: 120.0,
      qty_produced: 0.0,
      duration_expected: 90.0,
      duration: 0.0
    }
  ],

  'stock.quant': [
    {
      id: 301,
      product_id: [1, '[RAW-AL-6061] Aluminium Billet 6061-T6 Dia 80mm'],
      location_id: [12, 'WH/Stock/Raw-Material-Rack-A1'],
      quantity: 480.0,
      reserved_quantity: 65.0,
      product_uom_id: [1, 'kg']
    },
    {
      id: 302,
      product_id: [2, '[COMP-BRG-608] Precision Bearing 608RS ABEC-7'],
      location_id: [14, 'WH/Stock/Component-Bin-B4'],
      quantity: 1250.0,
      reserved_quantity: 160.0,
      product_uom_id: [2, 'pcs']
    },
    {
      id: 303,
      product_id: [3, '[SEAL-HYD-32] Hydraulic Nitrile Seal Kit Ø32mm'],
      location_id: [15, 'WH/Stock/Component-Bin-C2'],
      quantity: 95.0,
      reserved_quantity: 12.0,
      product_uom_id: [3, 'set']
    },
    {
      id: 304,
      product_id: [4, '[FAST-M6-25] Hex Bolt Stainless M6x25 Grade 8.8'],
      location_id: [16, 'WH/Stock/Fasteners-D1'],
      quantity: 3400.0,
      reserved_quantity: 300.0,
      product_uom_id: [2, 'pcs']
    }
  ],

  'quality.alert': [
    {
      id: 401,
      name: 'QA/2026/0012: Surface Micro-Scratch on Rear Triangle',
      product_id: [42, 'Bicycle Frame Alloy 6061-T6'],
      priority: '2',
      stage_id: [2, 'In Progress Investigation'],
      user_id: [1, 'Ahmad Fauzi (QC Inspector)'],
      description: 'Minor tooling vibration scratches found during visual inspection station 3.'
    },
    {
      id: 402,
      name: 'QA/2026/0013: Bore Diameter Tolerance Over +0.03mm',
      product_id: [78, 'Hydraulic Pump Valve Body'],
      priority: '3',
      stage_id: [1, 'New Alert'],
      user_id: [2, 'Siti Rahma (Lead QA)'],
      description: 'Air gauge reading indicates 32.045mm exceeding drawing tolerance 32.000 +0.015.'
    }
  ],

  'product.template': [
    {
      id: 42,
      name: 'Bicycle Frame Alloy 6061-T6',
      default_code: 'FRM-6061',
      list_price: 1850000,
      standard_price: 920000,
      type: 'product',
      categ_id: [1, 'Manufactured Assemblies']
    },
    {
      id: 78,
      name: 'Hydraulic Pump Valve Body',
      default_code: 'VLV-HYD-02',
      list_price: 3400000,
      standard_price: 1750000,
      type: 'product',
      categ_id: [1, 'Manufactured Assemblies']
    },
    {
      id: 91,
      name: 'Electric Motor Casing 48V High Torque',
      default_code: 'MTR-48V',
      list_price: 2100000,
      standard_price: 1100000,
      type: 'product',
      categ_id: [1, 'Manufactured Assemblies']
    },
    {
      id: 115,
      name: 'Control Panel Enclosure IP67 Stainless',
      default_code: 'ENC-IP67',
      list_price: 4500000,
      standard_price: 2300000,
      type: 'product',
      categ_id: [1, 'Manufactured Assemblies']
    }
  ],

  'sale.order': [
    {
      id: 501,
      name: 'SO/2026/0045',
      partner_id: [10, 'PT Astra Megah Presisi'],
      amount_total: 148500000,
      state: 'sale',
      date_order: '2026-09-20 14:20:00'
    },
    {
      id: 502,
      name: 'SO/2026/0048',
      partner_id: [11, 'CV Mandiri Teknik Industri'],
      amount_total: 82000000,
      state: 'sale',
      date_order: '2026-09-22 11:15:00'
    }
  ]
};

// ==============================================================
// Configuration Management
// ==============================================================

export function getOdooConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return { ...DEFAULT_ODOO_CONFIG };
    return { ...DEFAULT_ODOO_CONFIG, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to read Odoo config:', err);
    return { ...DEFAULT_ODOO_CONFIG };
  }
}

export function saveOdooConfig(cfg) {
  try {
    const merged = { ...getOdooConfig(), ...cfg };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.error('Failed to save Odoo config:', err);
    return cfg;
  }
}

// ==============================================================
// Sandbox Storage Helpers (Offline & Testing Environment)
// ==============================================================

function getSandboxData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SANDBOX);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SANDBOX, JSON.stringify(INITIAL_SANDBOX_DATA));
      return INITIAL_SANDBOX_DATA;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SANDBOX_DATA;
  }
}

function saveSandboxData(data) {
  try {
    localStorage.setItem(STORAGE_KEY_SANDBOX, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save sandbox data', e);
  }
}

export function resetSandboxData() {
  localStorage.setItem(STORAGE_KEY_SANDBOX, JSON.stringify(INITIAL_SANDBOX_DATA));
  return INITIAL_SANDBOX_DATA;
}

// ==============================================================
// Live Odoo JSON-RPC Engine
// ==============================================================

async function executeOdooLiveRpc(config, { service, method, args, kwargs = {} }) {
  const baseUrl = (config.url || '').replace(/\/$/, '');
  const rpcUrl = config.corsProxyUrl 
    ? `${config.corsProxyUrl.replace(/\/$/, '')}/${baseUrl}/jsonrpc`
    : `${baseUrl}/jsonrpc`;

  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service,
      method,
      args
    },
    id: Date.now()
  };

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  if (json.error) {
    const errMsg = json.error.data?.message || json.error.message || 'Unknown Odoo RPC error';
    throw new Error(`Odoo RPC Error: ${errMsg}`);
  }

  return json.result;
}

// Authenticate session or get UID
async function authenticateLive(config) {
  return await executeOdooLiveRpc(config, {
    service: 'common',
    method: 'login',
    args: [config.db, config.username, config.password]
  });
}

// ==============================================================
// High-Level CRUD & Action Methods (BACA, TAMBAH, UPDATE, DEL, ACTION)
// ==============================================================

/**
 * 1. TEST CONNECTION
 */
export async function testOdooConnection(customConfig) {
  const config = customConfig || getOdooConfig();
  const startTime = Date.now();

  if (config.useSimulation) {
    // Artificial latency for realistic feedback
    await new Promise(r => setTimeout(r, 450));
    return {
      ok: true,
      mode: 'sandbox',
      latencyMs: Date.now() - startTime,
      database: config.db,
      user: config.username,
      version: `Odoo ${config.version || 17}.0-Community (Simulation Mode)`,
      message: '✅ Berhasil terkoneksi ke Odoo Sandbox Simulator (Semua operasi CRUD & Action aktif).'
    };
  }

  try {
    const uid = await authenticateLive(config);
    if (!uid) {
      throw new Error('Autentikasi gagal. Periksa kembali Database, Username, atau Password/API Key.');
    }

    return {
      ok: true,
      mode: 'live',
      uid,
      latencyMs: Date.now() - startTime,
      database: config.db,
      user: config.username,
      version: `Odoo ${config.version || 17}.0 Live Server`,
      message: `✅ Berhasil login ke Odoo Server! UID Pengguna: ${uid}`
    };
  } catch (err) {
    return {
      ok: false,
      mode: 'live',
      latencyMs: Date.now() - startTime,
      error: err.message,
      message: `❌ Gagal menghubungi Odoo: ${err.message}`
    };
  }
}

/**
 * 2. BACA DATA (Search & Read)
 */
export async function readOdooRecords({ model, domain = [], fields = [], limit = 80, offset = 0, order = 'id desc' }) {
  const config = getOdooConfig();

  if (config.useSimulation) {
    const sandbox = getSandboxData();
    let records = sandbox[model] ? [...sandbox[model]] : [];

    // Simple domain filtering simulator for basic operations
    if (Array.isArray(domain) && domain.length > 0) {
      domain.forEach(criterion => {
        if (!Array.isArray(criterion) || criterion.length < 3) return;
        const [field, operator, value] = criterion;
        records = records.filter(r => {
          const val = r[field];
          if (operator === '=') return val === value;
          if (operator === '!=') return val !== value;
          if (operator === 'in') return Array.isArray(value) && value.includes(val);
          if (operator === 'ilike') return String(val).toLowerCase().includes(String(value).toLowerCase());
          return true;
        });
      });
    }

    // Sort order
    if (order.includes('desc')) {
      records.sort((a, b) => b.id - a.id);
    } else {
      records.sort((a, b) => a.id - b.id);
    }

    const sliced = records.slice(offset, offset + limit);
    return sliced;
  }

  // LIVE ODOO CALL
  const uid = await authenticateLive(config);
  return await executeOdooLiveRpc(config, {
    service: 'object',
    method: 'execute_kw',
    args: [
      config.db,
      uid,
      config.password,
      model,
      'search_read',
      [domain],
      {
        fields: fields.length ? fields : false,
        limit,
        offset,
        order
      }
    ]
  });
}

/**
 * 3. TAMBAH DATA (Create Record)
 */
export async function createOdooRecord({ model, values }) {
  const config = getOdooConfig();

  if (config.useSimulation) {
    const sandbox = getSandboxData();
    if (!sandbox[model]) sandbox[model] = [];

    const newId = Math.max(100, ...(sandbox[model].map(r => r.id || 0))) + 1;
    const newRecord = {
      id: newId,
      ...values,
      create_date: new Date().toISOString()
    };

    sandbox[model].unshift(newRecord);
    saveSandboxData(sandbox);
    return newId;
  }

  // LIVE CALL
  const uid = await authenticateLive(config);
  return await executeOdooLiveRpc(config, {
    service: 'object',
    method: 'execute_kw',
    args: [
      config.db,
      uid,
      config.password,
      model,
      'create',
      [values]
    ]
  });
}

/**
 * 4. UPDATE DATA (Write Record)
 */
export async function updateOdooRecord({ model, id, values }) {
  const config = getOdooConfig();

  if (config.useSimulation) {
    const sandbox = getSandboxData();
    if (!sandbox[model]) return false;

    const index = sandbox[model].findIndex(r => r.id === Number(id));
    if (index === -1) throw new Error(`Record ${model} ID ${id} tidak ditemukan.`);

    sandbox[model][index] = {
      ...sandbox[model][index],
      ...values,
      write_date: new Date().toISOString()
    };

    saveSandboxData(sandbox);
    return true;
  }

  // LIVE CALL
  const uid = await authenticateLive(config);
  return await executeOdooLiveRpc(config, {
    service: 'object',
    method: 'execute_kw',
    args: [
      config.db,
      uid,
      config.password,
      model,
      'write',
      [[Number(id)], values]
    ]
  });
}

/**
 * 5. HAPUS DATA (Unlink Record)
 */
export async function deleteOdooRecord({ model, id }) {
  const config = getOdooConfig();

  if (config.useSimulation) {
    const sandbox = getSandboxData();
    if (!sandbox[model]) return false;

    sandbox[model] = sandbox[model].filter(r => r.id !== Number(id));
    saveSandboxData(sandbox);
    return true;
  }

  // LIVE CALL
  const uid = await authenticateLive(config);
  return await executeOdooLiveRpc(config, {
    service: 'object',
    method: 'execute_kw',
    args: [
      config.db,
      uid,
      config.password,
      model,
      'unlink',
      [[Number(id)]]
    ]
  });
}

/**
 * 6. MANIPULASI DATA (Execute Arbitrary Method / Workflow Action)
 * e.g. action_confirm, button_mark_done, action_done, action_assign, etc.
 */
export async function executeOdooMethod({ model, method, args = [], kwargs = {} }) {
  const config = getOdooConfig();

  if (config.useSimulation) {
    const sandbox = getSandboxData();
    const targetId = args[0] ? (Array.isArray(args[0]) ? args[0][0] : args[0]) : null;

    // Simulate standard ERP manufacturing actions
    if (model === 'mrp.production' && targetId) {
      const mo = (sandbox['mrp.production'] || []).find(r => r.id === Number(targetId));
      if (mo) {
        if (method === 'action_confirm') {
          mo.state = 'confirmed';
        } else if (method === 'button_mark_done' || method === 'action_done') {
          mo.state = 'done';
          mo.qty_producing = mo.product_qty;
        } else if (method === 'action_assign') {
          mo.state = 'progress';
        } else if (method === 'button_unplan') {
          mo.state = 'draft';
        }
        saveSandboxData(sandbox);
        return { success: true, new_state: mo.state, message: `Workflow '${method}' berhasil dieksekusi pada ${mo.name}. Status: ${mo.state}` };
      }
    }

    if (model === 'mrp.workorder' && targetId) {
      const wo = (sandbox['mrp.workorder'] || []).find(r => r.id === Number(targetId));
      if (wo) {
        if (method === 'button_start') {
          wo.state = 'progress';
        } else if (method === 'button_finish') {
          wo.state = 'done';
          wo.qty_produced = wo.qty_production;
        } else if (method === 'button_pending') {
          wo.state = 'pending';
        }
        saveSandboxData(sandbox);
        return { success: true, new_state: wo.state, message: `Work Order '${wo.name}' updated via '${method}'. Status: ${wo.state}` };
      }
    }

    return {
      success: true,
      simulation: true,
      message: `Metode '${method}' pada model '${model}' berhasil dijalankan (Simulation).`,
      timestamp: new Date().toISOString()
    };
  }

  // LIVE CALL
  const uid = await authenticateLive(config);
  return await executeOdooLiveRpc(config, {
    service: 'object',
    method: 'execute_kw',
    args: [
      config.db,
      uid,
      config.password,
      model,
      method,
      args,
      kwargs
    ]
  });
}

// ==============================================================
// 7. ODOO AUTOMATION TRIGGERS (PEMICU MANIPULASI DATA OTOMATIS)
// ==============================================================

export const DEFAULT_ODOO_TRIGGERS = [
  {
    id: 'trig_mo_complete',
    name: 'Selesaikan MO saat Operasi Terakhir Selesai',
    event: 'WO_COMPLETED',
    eventLabel: '🏁 Shop Floor WO Selesai',
    model: 'mrp.production',
    actionType: 'EXECUTE_METHOD',
    method: 'button_mark_done',
    targetRecordId: 101,
    description: 'Saat operator menyelesaikan checksheet operasi terakhir, otomatis trigger button_mark_done di Odoo.',
    isActive: true,
    lastRun: null
  },
  {
    id: 'trig_qc_defect',
    name: 'Otomatis Terbitkan Quality Alert saat Cacat Tinggi',
    event: 'DEFECT_DETECTED',
    eventLabel: '⚠️ Cacat / NG Terdeteksi',
    model: 'quality.alert',
    actionType: 'CREATE_RECORD',
    defaultValues: {
      name: 'Peringatan Mutu Otomatis dari Stasiun QC',
      priority: '3',
      product_id: 42,
      description: 'Deviasi dimensi terdeteksi sensor caliper digital melebihi batas batas ISO.'
    },
    description: 'Jika inspeksi QC menghasilkan status Fail, otomatis trigger buat tiket Quality Alert di Odoo.',
    isActive: true,
    lastRun: null
  },
  {
    id: 'trig_assign_material',
    name: 'Reservasi Stok Material saat SPK Dikonfirmasi',
    event: 'MO_CONFIRMED',
    eventLabel: '📑 SPK Dikonfirmasi',
    model: 'mrp.production',
    actionType: 'EXECUTE_METHOD',
    method: 'action_assign',
    targetRecordId: 102,
    description: 'Ketika MO berstatus confirmed, trigger cek ketersediaan & reservasi komponen di gudang.',
    isActive: true,
    lastRun: null
  },
  {
    id: 'trig_start_workorder',
    name: 'Mulai Pengerjaan Work Order saat Operator Check-in',
    event: 'OPERATOR_START',
    eventLabel: '🛠️ Operator Mulai Pengerjaan',
    model: 'mrp.workorder',
    actionType: 'EXECUTE_METHOD',
    method: 'button_start',
    targetRecordId: 202,
    description: 'Otomatis ubah status Work Order Odoo ke Progress & mulai catat jam kerja mesin.',
    isActive: true,
    lastRun: null
  },
  {
    id: 'trig_update_yield',
    name: 'Update Output Riil (qty_producing) Real-Time',
    event: 'YIELD_PULSE',
    eventLabel: '⚡ Counter Produksi Bertambah',
    model: 'mrp.production',
    actionType: 'WRITE_RECORD',
    targetRecordId: 101,
    updateValues: {
      qty_producing: 45.0
    },
    description: 'Setiap sensor counter pulsa PLC mencatat hasil produksi, trigger update qty_producing di Odoo.',
    isActive: true,
    lastRun: null
  }
];

export function getOdooTriggers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRIGGERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TRIGGERS, JSON.stringify(DEFAULT_ODOO_TRIGGERS));
      return DEFAULT_ODOO_TRIGGERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ODOO_TRIGGERS;
  }
}

export function saveOdooTrigger(trigger) {
  const current = getOdooTriggers();
  const existingIdx = current.findIndex(t => t.id === trigger.id);
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...updated[existingIdx], ...trigger };
  } else {
    updated = [trigger, ...current];
  }
  localStorage.setItem(STORAGE_KEY_TRIGGERS, JSON.stringify(updated));
  return updated;
}

export function toggleOdooTrigger(triggerId, forceState) {
  const current = getOdooTriggers();
  const updated = current.map(t => {
    if (t.id === triggerId) {
      return { ...t, isActive: forceState !== undefined ? forceState : !t.isActive };
    }
    return t;
  });
  localStorage.setItem(STORAGE_KEY_TRIGGERS, JSON.stringify(updated));
  return updated;
}

export function deleteOdooTrigger(triggerId) {
  const current = getOdooTriggers();
  const updated = current.filter(t => t.id !== triggerId);
  localStorage.setItem(STORAGE_KEY_TRIGGERS, JSON.stringify(updated));
  return updated;
}

export function getOdooTriggerLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_TRIGGER_LOGS) || '[]');
  } catch {
    return [];
  }
}

export function clearOdooTriggerLogs() {
  localStorage.removeItem(STORAGE_KEY_TRIGGER_LOGS);
}

function saveTriggerLog(logEntry) {
  try {
    const logs = getOdooTriggerLogs();
    logs.unshift(logEntry);
    localStorage.setItem(STORAGE_KEY_TRIGGER_LOGS, JSON.stringify(logs.slice(0, 80)));
  } catch (err) {
    console.error('Failed to save trigger log:', err);
  }
}

/**
 * Execute a configured Trigger manually or from shop floor events
 */
export async function executeOdooTrigger(triggerId, runtimePayload = {}) {
  const triggers = getOdooTriggers();
  const trigger = triggers.find(t => t.id === triggerId);
  if (!trigger) throw new Error(`Trigger "${triggerId}" tidak ditemukan.`);

  const startTime = Date.now();
  const logEntry = {
    id: `trig_log_${Date.now()}`,
    triggerId: trigger.id,
    triggerName: trigger.name,
    event: trigger.event,
    model: trigger.model,
    actionType: trigger.actionType,
    timestamp: new Date().toISOString(),
    status: 'running',
    result: null,
    error: null,
    durationMs: 0
  };

  try {
    let result;
    if (trigger.actionType === 'EXECUTE_METHOD') {
      const targetId = runtimePayload.targetRecordId || trigger.targetRecordId || 101;
      result = await executeOdooMethod({
        model: trigger.model,
        method: trigger.method,
        args: [[Number(targetId)]],
        kwargs: runtimePayload.kwargs || {}
      });
    } else if (trigger.actionType === 'CREATE_RECORD') {
      const values = { ...(trigger.defaultValues || {}), ...(runtimePayload.values || {}) };
      const newId = await createOdooRecord({
        model: trigger.model,
        values
      });
      result = { success: true, createdId: newId, message: `Record baru dibuat di ${trigger.model} dengan ID #${newId}` };
    } else if (trigger.actionType === 'WRITE_RECORD') {
      const targetId = runtimePayload.targetRecordId || trigger.targetRecordId || 101;
      const values = { ...(trigger.updateValues || {}), ...(runtimePayload.values || {}) };
      await updateOdooRecord({
        model: trigger.model,
        id: targetId,
        values
      });
      result = { success: true, updatedId: targetId, values, message: `Record #${targetId} di ${trigger.model} berhasil diperbarui.` };
    } else {
      throw new Error(`Tipe aksi trigger ${trigger.actionType} tidak dikenali.`);
    }

    logEntry.status = 'success';
    logEntry.result = result;
    logEntry.durationMs = Date.now() - startTime;
    saveTriggerLog(logEntry);

    // Update last run timestamp in trigger definition
    saveOdooTrigger({ ...trigger, lastRun: new Date().toISOString() });

    return {
      success: true,
      log: logEntry,
      result
    };
  } catch (err) {
    logEntry.status = 'error';
    logEntry.error = err.message;
    logEntry.durationMs = Date.now() - startTime;
    saveTriggerLog(logEntry);
    throw err;
  }
}
