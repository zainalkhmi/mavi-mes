/**
 * Mandor Connector Hub
 * ==================
 * Universal ERP/system integration engine inspired by Tulip Connectors.
 * Supports: HTTP REST, Odoo JSON-RPC, SAP OData, FrePPLe REST, SQL (via proxy)
 *
 * Architecture:
 *   ConnectorHub.execute(connectorId, functionName, inputParams)
 *     → resolves connector config from storage
 *     → selects adapter based on connector.type
 *     → adapter builds + sends request
 *     → returns mapped output
 */

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const LS_CALL_LOG = 'mandor_connector_call_log';
const MAX_LOG_ENTRIES = 200;

// ─── Utility ──────────────────────────────────────────────────────────────────
function getConnectors() {
  try {
    return JSON.parse(localStorage.getItem('mandor_integration_connectors') || '[]');
  } catch { return []; }
}

function saveCallLog(entry) {
  try {
    const log = JSON.parse(localStorage.getItem(LS_CALL_LOG) || '[]');
    log.unshift(entry);
    localStorage.setItem(LS_CALL_LOG, JSON.stringify(log.slice(0, MAX_LOG_ENTRIES)));
  } catch { /* noop */ }
}

export function getCallLog() {
  try {
    return JSON.parse(localStorage.getItem(LS_CALL_LOG) || '[]');
  } catch { return []; }
}

export function clearCallLog() {
  localStorage.removeItem(LS_CALL_LOG);
}

// ─── Authentication Helpers ────────────────────────────────────────────────────
function buildAuthHeaders(auth = {}) {
  if (!auth || !auth.type) return {};
  switch (auth.type) {
    case 'BASIC': {
      const encoded = btoa(`${auth.username || ''}:${auth.password || ''}`);
      return { Authorization: `Basic ${encoded}` };
    }
    case 'BEARER':
    case 'API_KEY':
      return { Authorization: `Bearer ${auth.token || auth.apiKey || ''}` };
    case 'API_KEY_HEADER':
      return { [auth.headerName || 'X-API-Key']: auth.apiKey || '' };
    case 'OAUTH2':
      return { Authorization: `Bearer ${auth.accessToken || ''}` };
    default:
      return {};
  }
}

// ─── Adapters ─────────────────────────────────────────────────────────────────

/**
 * Generic HTTP REST Adapter
 * Works for: SAP S/4HANA OData, FrePPLe REST, Microsoft Dynamics, NetSuite, any REST API
 */
async function httpAdapter(connector, fn, inputs) {
  const env = connector.activeEnv || 'dev';
  const envConfig = connector.environments?.[env] || {};
  const baseUrl = (envConfig.baseUrl || connector.baseUrl || '').replace(/\/$/, '');

  if (!baseUrl) throw new Error(`Connector "${connector.name}": Base URL is not configured.`);

  // Build URL — support path params like /orders/{orderId}
  let path = fn.path || '/';
  if (inputs) {
    path = path.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(inputs[key] ?? ''));
  }

  // Build query params
  const queryParams = new URLSearchParams();
  (fn.inputs || []).forEach(inp => {
    if (inp.in === 'query' && inputs?.[inp.name] !== undefined) {
      queryParams.set(inp.name, inputs[inp.name]);
    }
  });
  const queryString = queryParams.toString();
  const fullUrl = `${baseUrl}${path}${queryString ? '?' + queryString : ''}`;

  // Build headers
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...buildAuthHeaders(connector.auth || envConfig.auth),
    ...(fn.headers || {}),
    ...(connector.defaultHeaders || {})
  };

  // SAP OData specific: needs X-CSRF-Token for write operations
  if (connector.type === 'SAP_ODATA' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(fn.method?.toUpperCase())) {
    headers['X-CSRF-Token'] = 'Fetch';
  }

  // Build body
  let body = undefined;
  if (fn.method && !['GET', 'HEAD'].includes(fn.method.toUpperCase())) {
    const bodyInputs = (fn.inputs || []).filter(i => i.in === 'body');
    if (bodyInputs.length > 0) {
      const bodyObj = {};
      bodyInputs.forEach(inp => {
        if (inputs?.[inp.name] !== undefined) bodyObj[inp.name] = inputs[inp.name];
      });
      body = JSON.stringify(fn.bodyTemplate ? mergeTemplate(fn.bodyTemplate, inputs) : bodyObj);
    } else if (fn.bodyTemplate) {
      body = JSON.stringify(mergeTemplate(fn.bodyTemplate, inputs));
    }
  }

  const response = await fetch(fullUrl, {
    method: (fn.method || 'GET').toUpperCase(),
    headers,
    body,
    signal: AbortSignal.timeout(fn.timeoutMs || 30000)
  });

  let responseData;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json') || contentType.includes('odata')) {
    responseData = await response.json();
  } else if (contentType.includes('text')) {
    responseData = await response.text();
  } else {
    responseData = await response.blob();
  }

  if (!response.ok) {
    const errMsg = responseData?.error?.message || responseData?.message || response.statusText;
    throw new Error(`HTTP ${response.status}: ${errMsg}`);
  }

  return mapOutputs(fn.outputs, responseData);
}

/**
 * Odoo JSON-RPC Adapter
 * Supports Odoo v14, v16, v17 via XML-RPC/JSON-RPC
 */
async function odooAdapter(connector, fn, inputs) {
  const env = connector.activeEnv || 'dev';
  const envConfig = connector.environments?.[env] || {};
  const baseUrl = (envConfig.baseUrl || connector.baseUrl || '').replace(/\/$/, '');
  const db = envConfig.databaseName || connector.databaseName;
  const uid = connector._sessionUid; // cached after authenticate

  if (!baseUrl) throw new Error(`Odoo connector "${connector.name}": Base URL not configured.`);
  if (!db) throw new Error(`Odoo connector "${connector.name}": Database name not configured.`);

  // ── Step 1: Authenticate if no session ──
  let sessionUid = uid;
  if (!sessionUid) {
    const auth = connector.auth || envConfig.auth || {};
    const authResp = await fetch(`${baseUrl}/web/session/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'call', id: 1,
        params: {
          db,
          login: auth.username || auth.login,
          password: auth.password
        }
      })
    });
    const authData = await authResp.json();
    if (!authData.result?.uid) {
      throw new Error(`Odoo auth failed: ${authData.error?.data?.message || 'Invalid credentials'}`);
    }
    sessionUid = authData.result.uid;
    connector._sessionUid = sessionUid; // cache
  }

  // ── Step 2: Call the model method ──
  const model = fn.odooModel || inputs?.model || '';
  const method = fn.odooMethod || inputs?.method || 'search_read';
  const args = buildOdooArgs(fn, inputs, method);
  const kwargs = buildOdooKwargs(fn, inputs, method);

  const resp = await fetch(`${baseUrl}/web/dataset/call_kw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      jsonrpc: '2.0', method: 'call', id: Date.now(),
      params: { model, method, args, kwargs }
    })
  });

  const result = await resp.json();
  if (result.error) {
    throw new Error(`Odoo RPC Error: ${result.error.data?.message || result.error.message}`);
  }

  return mapOutputs(fn.outputs, result.result);
}

function buildOdooArgs(fn, inputs, method) {
  switch (method) {
    case 'search_read':
    case 'search':
      return [buildOooodDomain(fn, inputs)];
    case 'write':
      return [[inputs?.id || inputs?.ids], buildOdooVals(fn, inputs)];
    case 'create':
      return [buildOdooVals(fn, inputs)];
    case 'unlink':
      return [[inputs?.id || inputs?.ids]];
    case 'read':
      return [[inputs?.id || inputs?.ids], fn.odooFields || []];
    default:
      return fn.odooArgs || [];
  }
}

function buildOodooKwargs(fn, inputs, method) {
  const base = {
    context: { lang: 'en_US', ...fn.odooContext }
  };
  if (method === 'search_read') {
    base.fields = fn.odooFields || [];
    base.limit = inputs?.limit || fn.odooLimit || 80;
    base.order = fn.odooOrder || 'id desc';
  }
  return base;
}

// Alias
function buildOdooKwargs(fn, inputs, method) {
  return buildOodooKwargs(fn, inputs, method);
}

function buildOooodDomain(fn, inputs) {
  if (!fn.oodooDomainTemplate) return [];
  try {
    return JSON.parse(
      fn.oodooDomainTemplate.replace(/\{(\w+)\}/g, (_, k) => JSON.stringify(inputs?.[k] ?? false))
    );
  } catch { return []; }
}

function buildOdooVals(fn, inputs) {
  const vals = {};
  (fn.inputs || []).filter(i => i.in === 'body').forEach(inp => {
    if (inputs?.[inp.name] !== undefined) vals[inp.name] = inputs[inp.name];
  });
  return vals;
}

/**
 * SAP OData Adapter (S/4HANA Cloud)
 * Uses standard OData V2/V4 endpoints
 */
async function sapOdataAdapter(connector, fn, inputs) {
  // SAP OData is essentially HTTP, but with special CSRF token handling
  // and $format=json header requirement
  const env = connector.activeEnv || 'dev';
  const envConfig = connector.environments?.[env] || {};

  const modifiedFn = {
    ...fn,
    headers: {
      'sap-client': connector.sapClient || '100',
      '$format': 'json',
      ...(fn.headers || {})
    }
  };

  const modifiedConnector = {
    ...connector,
    baseUrl: envConfig.baseUrl || connector.baseUrl,
    auth: connector.auth || envConfig.auth,
    type: 'HTTP'
  };

  return httpAdapter(modifiedConnector, modifiedFn, inputs);
}

/**
 * SQL / PostgreSQL Adapter — via Mandor ERP Bridge
 * Mengirim query ke bridge proxy yang punya akses ke PostgreSQL.
 * Bridge URL: http://localhost:3099/sql/query
 *
 * fn.sqlQuery  : template query, support {param} substitution
 * fn.sqlType   : 'query' (SELECT) | 'execute' (INSERT/UPDATE/DELETE)
 */
async function sqlAdapter(connector, fn, inputs) {
  const env = connector.activeEnv || 'dev';
  const envConfig = connector.environments?.[env] || {};
  const bridgeUrl = (envConfig.baseUrl || connector.baseUrl || '').replace(/\/$/, '');

  if (!bridgeUrl) throw new Error(`SQL Connector "${connector.name}": Bridge URL not configured. Set Base URL to your Mandor ERP Bridge (e.g. http://localhost:3099).`);

  // Build connection config dari connector settings
  const pgConnection = {
    host:     envConfig.pgHost     || connector.pgHost     || 'localhost',
    port:     parseInt(envConfig.pgPort || connector.pgPort || '5432'),
    database: envConfig.databaseName || connector.databaseName,
    user:     connector.auth?.username || envConfig.pgUser || 'postgres',
    password: connector.auth?.password || envConfig.pgPassword || '',
    ssl:      connector.pgSsl || false
  };

  // Resolve SQL query — ganti {param} dengan nilai dari inputs
  let sqlQuery = fn.sqlQuery || '';
  if (!sqlQuery) throw new Error(`Function "${fn.name}": sqlQuery is not defined.`);

  // Build parameterized query: ganti {param} → $1, $2, ...
  const paramNames = [];
  const parameterized = sqlQuery.replace(/\{(\w+)\}/g, (_, name) => {
    paramNames.push(name);
    return `$${paramNames.length}`;
  });
  const params = paramNames.map(name => inputs?.[name] ?? null);

  const isWrite = fn.sqlType === 'execute' || ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP'].some(
    kw => parameterized.trim().toUpperCase().startsWith(kw)
  );

  const endpoint = isWrite ? `${bridgeUrl}/sql/execute` : `${bridgeUrl}/sql/query`;

  const body = isWrite
    ? { connection: pgConnection, statements: [{ query: parameterized, params }] }
    : { connection: pgConnection, query: parameterized, params, readOnly: true };

  const headers = { 'Content-Type': 'application/json' };
  if (connector.bridgeApiKey || envConfig.bridgeApiKey) {
    headers['X-Mandor-Bridge-Key'] = connector.bridgeApiKey || envConfig.bridgeApiKey;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(fn.timeoutMs || 30000)
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || `SQL Bridge error: HTTP ${response.status}`);
  }

  // Return rows for SELECT, or rowCount for writes
  const raw = isWrite
    ? { rowCount: data.results?.[0]?.rowCount, rows: data.results?.[0]?.rows || [] }
    : { rows: data.rows, rowCount: data.rowCount, fields: data.fields, durationMs: data.durationMs };

  return mapOutputs(fn.outputs, raw);
}

/**
 * FrePPLe REST Adapter
 * FrePPLe exposes REST API at /api/
 */
async function freppledAdapter(connector, fn, inputs) {
  const env = connector.activeEnv || 'dev';
  const envConfig = connector.environments?.[env] || {};

  const modifiedConnector = {
    ...connector,
    baseUrl: (envConfig.baseUrl || connector.baseUrl || '').replace(/\/$/, '') + '/api',
    auth: connector.auth || envConfig.auth,
    type: 'HTTP',
    defaultHeaders: {
      'X-CSRFToken': connector._csrfToken || '',
      ...connector.defaultHeaders
    }
  };

  return httpAdapter(modifiedConnector, fn, inputs);
}

/**
 * Canva Connect API Adapter
 */
async function canvaAdapter(connector, fn, inputs) {
  const apiKey = connector.canvaSettings?.apiKey || '';
  if (!apiKey) throw new Error('Canva API Key / Access Token is required.');

  const modifiedConnector = {
    ...connector,
    baseUrl: 'https://api.canva.com',
    auth: {
      type: 'BEARER',
      token: apiKey
    }
  };

  const modifiedFn = {
    ...fn,
    path: fn.path ? (fn.path.startsWith('/') ? fn.path : `/${fn.path}`) : '/v1/users/me'
  };

  return httpAdapter(modifiedConnector, modifiedFn, inputs);
}

// ─── Output Mapping ────────────────────────────────────────────────────────────
function mapOutputs(outputDefs, rawResponse) {
  if (!outputDefs || outputDefs.length === 0) return rawResponse;

  const result = {};
  outputDefs.forEach(out => {
    const val = resolveJsonPath(rawResponse, out.path || out.name);
    result[out.name] = val !== undefined ? val : rawResponse;
  });
  return result;
}

function resolveJsonPath(obj, path) {
  if (!path || path === '.' || path === '$') return obj;
  // Support: value, value.items, value[0].name, $.d.results
  const clean = path.replace(/^\$\.?/, '');
  if (!clean) return obj;
  return clean.split(/[\.\[\]]+/).filter(Boolean).reduce((cur, key) => {
    if (cur === null || cur === undefined) return undefined;
    return cur[isNaN(key) ? key : Number(key)];
  }, obj);
}

function mergeTemplate(template, inputs) {
  if (typeof template === 'string') {
    return JSON.parse(
      template.replace(/\{(\w+)\}/g, (_, k) => JSON.stringify(inputs?.[k] ?? null))
    );
  }
  return template;
}

// ─── Test Connection ────────────────────────────────────────────────────────────
export async function testConnection(connector) {
  const startTime = Date.now();
  try {
    const env = connector.activeEnv || 'dev';
    const envConfig = connector.environments?.[env] || {};
    let baseUrl = envConfig.baseUrl || connector.baseUrl || '';

    if (connector.type === 'CANVA') {
      baseUrl = 'https://api.canva.com';
    }

    if (!baseUrl) throw new Error('No Base URL configured.');

    switch (connector.type) {
      case 'CANVA': {
        const apiKey = connector.canvaSettings?.apiKey || '';
        if (!apiKey) throw new Error('API Key / Access Token required for Canva.');
        const resp = await fetch('https://api.canva.com/v1/users/me', {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        if (!resp.ok) {
          throw new Error(`Canva API error: HTTP ${resp.status}`);
        }
        const data = await resp.json();
        return { 
          ok: true, 
          latencyMs: Date.now() - startTime, 
          message: `Canva connection successful · User: ${data.user?.display_name || 'Authenticated user'}` 
        };
      }
      case 'ODOO': {
        const db = envConfig.databaseName || connector.databaseName;
        if (!db) throw new Error('Database name required for Odoo.');
        const resp = await fetch(`${baseUrl}/web/dataset/call_kw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', method: 'call', id: 1,
            params: { model: 'res.lang', method: 'search_read', args: [[]], kwargs: { fields: ['name'], limit: 1, context: {} } }
          })
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return { ok: true, latencyMs: Date.now() - startTime, message: 'Odoo connection successful' };
      }
      case 'SAP_ODATA': {
        const testUrl = `${baseUrl.replace(/\/$/, '')}/$metadata`;
        const resp = await fetch(testUrl, {
          headers: { ...buildAuthHeaders(connector.auth || envConfig.auth), Accept: 'application/xml' }
        });
        if (!resp.ok) throw new Error(`SAP OData metadata: HTTP ${resp.status}`);
        return { ok: true, latencyMs: Date.now() - startTime, message: 'SAP OData connection successful' };
      }
      case 'FREPPLE': {
        const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/api/common/parameter/?format=json&limit=1`, {
          headers: buildAuthHeaders(connector.auth || envConfig.auth)
        });
        if (!resp.ok) throw new Error(`FrePPLe API: HTTP ${resp.status}`);
        return { ok: true, latencyMs: Date.now() - startTime, message: 'FrePPLe connection successful' };
      }
      case 'SQL': {
        // Test via Mandor ERP Bridge /sql/connect-test
        const pgConn = {
          host:     envConfig.pgHost     || connector.pgHost     || 'localhost',
          port:     parseInt(envConfig.pgPort || connector.pgPort || '5432'),
          database: envConfig.databaseName || connector.databaseName,
          user:     connector.auth?.username || 'postgres',
          password: connector.auth?.password || '',
          ssl:      connector.pgSsl || false
        };
        const headers = { 'Content-Type': 'application/json' };
        if (connector.bridgeApiKey) headers['X-Mandor-Bridge-Key'] = connector.bridgeApiKey;
        const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/sql/connect-test`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ connection: pgConn })
        });
        const data = await resp.json();
        if (!data.ok) throw new Error(data.error || 'Connection failed');
        return {
          ok: true,
          latencyMs: Date.now() - startTime,
          message: `Connected to "${data.database}" as ${data.user} · ${data.version}`
        };
      }
      default: {
        // Generic HTTP ping
        const resp = await fetch(baseUrl, {
          method: 'HEAD',
          headers: buildAuthHeaders(connector.auth || envConfig.auth)
        });
        if (!resp.ok && resp.status !== 405) throw new Error(`HTTP ${resp.status}`);
        return { ok: true, latencyMs: Date.now() - startTime, message: 'Connection successful' };
      }
    }
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - startTime, message: err.message };
  }
}

// ─── Main Execute ──────────────────────────────────────────────────────────────
/**
 * Execute a connector function by connector ID and function name.
 * @param {string} connectorId - Connector ID from localStorage
 * @param {string} functionName - Function name or ID
 * @param {object} inputParams - Input parameter values
 * @returns {Promise<any>} Result data
 */
export async function executeConnector(connectorId, functionName, inputParams = {}) {
  const connectors = getConnectors();
  const connector = connectors.find(c => c.id === connectorId || c.name === connectorId);

  if (!connector) throw new Error(`Connector not found: "${connectorId}"`);

  const fn = (connector.functions || []).find(
    f => f.id === functionName || f.name === functionName
  );
  if (!fn) throw new Error(`Function "${functionName}" not found in connector "${connector.name}"`);

  const startTime = Date.now();
  const logEntry = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    connectorId: connector.id,
    connectorName: connector.name,
    functionName: fn.name,
    inputs: inputParams,
    status: 'running',
    result: null,
    error: null,
    durationMs: 0
  };

  try {
    let result;
    switch (connector.type) {
      case 'ODOO':
        result = await odooAdapter(connector, fn, inputParams);
        break;
      case 'SAP_ODATA':
        result = await sapOdataAdapter(connector, fn, inputParams);
        break;
      case 'FREPPLE':
        result = await freppledAdapter(connector, fn, inputParams);
        break;
      case 'SQL':
        result = await sqlAdapter(connector, fn, inputParams);
        break;
      case 'CANVA':
        result = await canvaAdapter(connector, fn, inputParams);
        break;
      case 'HTTP':
      default:
        result = await httpAdapter(connector, fn, inputParams);
        break;
    }

    logEntry.status = 'success';
    logEntry.result = result;
    logEntry.durationMs = Date.now() - startTime;
    saveCallLog(logEntry);

    console.log(`[ConnectorHub] ✅ ${connector.name}.${fn.name} completed in ${logEntry.durationMs}ms`);
    return result;

  } catch (err) {
    logEntry.status = 'error';
    logEntry.error = err.message;
    logEntry.durationMs = Date.now() - startTime;
    saveCallLog(logEntry);

    console.error(`[ConnectorHub] ❌ ${connector.name}.${fn.name} failed:`, err.message);
    throw err;
  }
}

// ─── Preset ERP Function Templates ─────────────────────────────────────────────
export const ERP_PRESETS = {
  ODOO: [
    {
      id: 'odoo_get_manufacturing_orders',
      name: 'Get Manufacturing Orders',
      odooModel: 'mrp.production',
      odooMethod: 'search_read',
      oodooDomainTemplate: '[["state","in",["confirmed","progress"]]]',
      odooFields: ['name', 'product_id', 'product_qty', 'state', 'date_planned_start', 'workcenter_id'],
      odooLimit: 50,
      inputs: [{ name: 'limit', label: 'Max Records', type: 'number', in: 'kwargs', default: 50 }],
      outputs: [{ name: 'orders', path: '$', label: 'Manufacturing Orders' }]
    },
    {
      id: 'odoo_get_work_orders',
      name: 'Get Work Orders',
      odooModel: 'mrp.workorder',
      odooMethod: 'search_read',
      oodooDomainTemplate: '[["state","in",["pending","ready","progress"]]]',
      odooFields: ['name', 'production_id', 'workcenter_id', 'state', 'qty_production', 'date_planned_start'],
      odooLimit: 50,
      inputs: [],
      outputs: [{ name: 'workorders', path: '$', label: 'Work Orders' }]
    },
    {
      id: 'odoo_update_workorder_state',
      name: 'Update Work Order State',
      odooModel: 'mrp.workorder',
      odooMethod: 'write',
      inputs: [
        { name: 'id', label: 'Work Order ID', type: 'number', in: 'body', required: true },
        { name: 'state', label: 'New State (progress/done/cancel)', type: 'string', in: 'body', required: true }
      ],
      outputs: [{ name: 'success', path: '$', label: 'Result' }]
    },
    {
      id: 'odoo_get_inventory',
      name: 'Get Inventory (Stock Quants)',
      odooModel: 'stock.quant',
      odooMethod: 'search_read',
      oodooDomainTemplate: '[["location_id.usage","=","internal"]]',
      odooFields: ['product_id', 'location_id', 'quantity', 'reserved_quantity'],
      odooLimit: 100,
      inputs: [{ name: 'product_code', label: 'Product Code Filter', type: 'string', in: 'query' }],
      outputs: [{ name: 'quants', path: '$', label: 'Inventory Items' }]
    },
    {
      id: 'odoo_create_quality_alert',
      name: 'Create Quality Alert',
      odooModel: 'quality.alert',
      odooMethod: 'create',
      inputs: [
        { name: 'name', label: 'Alert Title', type: 'string', in: 'body', required: true },
        { name: 'description', label: 'Description', type: 'string', in: 'body' },
        { name: 'product_id', label: 'Product ID', type: 'number', in: 'body' }
      ],
      outputs: [{ name: 'alertId', path: '$', label: 'New Alert ID' }]
    }
  ],

  SAP_ODATA: [
    {
      id: 'sap_get_production_orders',
      name: 'Get Production Orders',
      path: '/sap/opu/odata/sap/API_PRODUCTION_ORDER_2_SRV/A_ProductionOrder',
      method: 'GET',
      inputs: [
        { name: '$filter', label: 'OData Filter', type: 'string', in: 'query', default: "MfgOrderType eq 'PP01'" },
        { name: '$top', label: 'Max Records', type: 'number', in: 'query', default: 50 }
      ],
      outputs: [{ name: 'orders', path: 'd.results', label: 'Production Orders' }]
    },
    {
      id: 'sap_get_material_master',
      name: 'Get Material Master',
      path: '/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentHeader',
      method: 'GET',
      inputs: [
        { name: 'Material', label: 'Material Number', type: 'string', in: 'path', required: true }
      ],
      outputs: [{ name: 'material', path: 'd', label: 'Material Data' }]
    },
    {
      id: 'sap_confirm_operation',
      name: 'Confirm Production Operation',
      path: '/sap/opu/odata/sap/API_PRODUCTION_ORDER_2_SRV/A_ProductionOrderConfirmation',
      method: 'POST',
      inputs: [
        { name: 'OrderID', label: 'Production Order', type: 'string', in: 'body', required: true },
        { name: 'ConfirmedYield', label: 'Confirmed Qty', type: 'number', in: 'body', required: true },
        { name: 'ConfirmedScrapQuantity', label: 'Scrap Qty', type: 'number', in: 'body', default: 0 }
      ],
      outputs: [{ name: 'confirmation', path: 'd', label: 'Confirmation Data' }]
    },
    {
      id: 'sap_create_quality_notification',
      name: 'Create Quality Notification',
      path: '/sap/opu/odata/sap/API_QUALITYNOTIFICATION_SRV/A_QualityNotification',
      method: 'POST',
      inputs: [
        { name: 'NotificationText', label: 'Description', type: 'string', in: 'body', required: true },
        { name: 'Material', label: 'Material', type: 'string', in: 'body' },
        { name: 'Plant', label: 'Plant', type: 'string', in: 'body' }
      ],
      outputs: [{ name: 'notification', path: 'd', label: 'QN Data' }]
    }
  ],

  FREPPLE: [
    {
      id: 'frepple_get_demand_plan',
      name: 'Get Demand Plan',
      path: '/demand/',
      method: 'GET',
      inputs: [
        { name: 'format', label: 'Format', type: 'string', in: 'query', default: 'json' },
        { name: 'limit', label: 'Max Records', type: 'number', in: 'query', default: 50 }
      ],
      outputs: [{ name: 'demands', path: '$', label: 'Demand Records' }]
    },
    {
      id: 'frepple_get_production_plan',
      name: 'Get Production Plan (OperationPlans)',
      path: '/operationplan/',
      method: 'GET',
      inputs: [
        { name: 'format', label: 'Format', type: 'string', in: 'query', default: 'json' },
        { name: 'status', label: 'Status Filter', type: 'string', in: 'query', default: 'approved' }
      ],
      outputs: [{ name: 'plans', path: '$', label: 'Operation Plans' }]
    },
    {
      id: 'frepple_get_buffers',
      name: 'Get Inventory Buffers',
      path: '/buffer/',
      method: 'GET',
      inputs: [
        { name: 'format', label: 'Format', type: 'string', in: 'query', default: 'json' }
      ],
      outputs: [{ name: 'buffers', path: '$', label: 'Buffers' }]
    },
    {
      id: 'frepple_trigger_plan',
      name: 'Trigger Replanning',
      path: '/execute/',
      method: 'POST',
      inputs: [
        { name: 'task', label: 'Task Type (frepple_run)', type: 'string', in: 'body', default: 'frepple_run' }
      ],
      outputs: [{ name: 'task', path: '$', label: 'Task Info' }]
    }
  ],

  HTTP: [
    {
      id: 'http_get',
      name: 'GET Request',
      path: '/',
      method: 'GET',
      inputs: [{ name: 'path', label: 'Path', type: 'string', in: 'path', default: '/' }],
      outputs: [{ name: 'data', path: '$', label: 'Response Data' }]
    },
    {
      id: 'http_post',
      name: 'POST Request',
      path: '/',
      method: 'POST',
      inputs: [
        { name: 'path', label: 'Path', type: 'string', in: 'path', default: '/' },
        { name: 'payload', label: 'Request Body (JSON)', type: 'json', in: 'body' }
      ],
      outputs: [{ name: 'data', path: '$', label: 'Response Data' }]
    }
  ],

  SQL: [
    {
      id: 'sql_select_all',
      name: 'SELECT — Query Table',
      sqlQuery: 'SELECT * FROM {table} LIMIT {limit}',
      sqlType: 'query',
      inputs: [
        { name: 'table', label: 'Table Name', type: 'string', in: 'sql', required: true, default: 'production_orders' },
        { name: 'limit', label: 'Max Rows', type: 'number', in: 'sql', default: 50 }
      ],
      outputs: [{ name: 'rows', path: 'rows', label: 'Result Rows' }]
    },
    {
      id: 'sql_select_where',
      name: 'SELECT — Query with Filter',
      sqlQuery: 'SELECT * FROM {table} WHERE {column} = {value} LIMIT {limit}',
      sqlType: 'query',
      inputs: [
        { name: 'table',  label: 'Table Name',    type: 'string', in: 'sql', required: true },
        { name: 'column', label: 'Filter Column', type: 'string', in: 'sql', required: true },
        { name: 'value',  label: 'Filter Value',  type: 'string', in: 'sql', required: true },
        { name: 'limit',  label: 'Max Rows',      type: 'number', in: 'sql', default: 50 }
      ],
      outputs: [{ name: 'rows', path: 'rows', label: 'Result Rows' }]
    },
    {
      id: 'sql_custom_query',
      name: 'Custom SELECT Query',
      sqlQuery: 'SELECT id, name, status, created_at FROM {table} WHERE status = {status} ORDER BY created_at DESC LIMIT {limit}',
      sqlType: 'query',
      inputs: [
        { name: 'table',  label: 'Table',      type: 'string', in: 'sql', required: true },
        { name: 'status', label: 'Status',     type: 'string', in: 'sql', default: 'active' },
        { name: 'limit',  label: 'Max Rows',   type: 'number', in: 'sql', default: 20 }
      ],
      outputs: [
        { name: 'rows',     path: 'rows',     label: 'Rows' },
        { name: 'rowCount', path: 'rowCount', label: 'Total Rows' }
      ]
    },
    {
      id: 'sql_insert_record',
      name: 'INSERT — Add Record',
      sqlQuery: 'INSERT INTO {table} (name, status, created_at) VALUES ({name}, {status}, NOW()) RETURNING id',
      sqlType: 'execute',
      inputs: [
        { name: 'table',  label: 'Table Name', type: 'string', in: 'sql', required: true },
        { name: 'name',   label: 'Name',       type: 'string', in: 'sql', required: true },
        { name: 'status', label: 'Status',     type: 'string', in: 'sql', default: 'active' }
      ],
      outputs: [{ name: 'rows', path: 'rows', label: 'Inserted Record' }]
    },
    {
      id: 'sql_update_status',
      name: 'UPDATE — Change Status',
      sqlQuery: 'UPDATE {table} SET status = {newStatus}, updated_at = NOW() WHERE id = {id}',
      sqlType: 'execute',
      inputs: [
        { name: 'table',     label: 'Table',      type: 'string', in: 'sql', required: true },
        { name: 'id',        label: 'Record ID',  type: 'number', in: 'sql', required: true },
        { name: 'newStatus', label: 'New Status', type: 'string', in: 'sql', required: true }
      ],
      outputs: [{ name: 'rowCount', path: 'rowCount', label: 'Updated Rows' }]
    },
    {
      id: 'sql_count',
      name: 'COUNT — Count Records',
      sqlQuery: 'SELECT COUNT(*) as total FROM {table} WHERE status = {status}',
      sqlType: 'query',
      inputs: [
        { name: 'table',  label: 'Table',  type: 'string', in: 'sql', required: true },
        { name: 'status', label: 'Status', type: 'string', in: 'sql', default: 'active' }
      ],
      outputs: [{ name: 'total', path: 'rows[0].total', label: 'Count' }]
    }
  ]
};

export const CONNECTOR_TYPES = [
  { value: 'HTTP',      label: 'HTTP / REST API',    icon: 'Globe',    color: '#3b82f6', description: 'Connect to any REST or SOAP API' },
  { value: 'ODOO',     label: 'Odoo ERP',           icon: 'Package',  color: '#714b67', description: 'Odoo v14/v16/v17 via JSON-RPC' },
  { value: 'SAP_ODATA',label: 'SAP S/4HANA',        icon: 'Building2',color: '#0070f3', description: 'SAP S/4HANA Cloud via OData V2/V4' },
  { value: 'FREPPLE',  label: 'FrePPLe',            icon: 'BarChart3',color: '#059669', description: 'FrePPLe planning via REST API' },
  { value: 'SQL',      label: 'SQL / PostgreSQL',    icon: 'Database', color: '#10b981', description: 'Query PostgreSQL, MySQL, atau database apapun via Mandor ERP Bridge' },
  { value: 'MQTT',     label: 'MQTT / IoT',          icon: 'Zap',      color: '#f59e0b', description: 'MQTT broker for IoT devices' },
  { value: 'SUPABASE', label: 'Supabase',            icon: 'HardDrive',color: '#3ecf8e', description: 'Direct Supabase integration' },
  { value: 'CANVA',    label: 'Canva Connect',      icon: 'Palette',  color: '#00c4cc', description: 'Connect to Canva API to dynamically pull mockups or asset designs' },
];

export default {
  executeConnector,
  testConnection,
  getCallLog,
  clearCallLog,
  ERP_PRESETS,
  CONNECTOR_TYPES
};
