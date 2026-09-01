/**
 * Enterprise Connectors
 * Odoo, SAP S/4HANA, SFTP integration
 *
 * Part of Phase 3: Enterprise Features
 */

import { getCredentialById, updateCredentialLastUsed } from './automationDB';

// =====================================================
// ODOO CONNECTOR
// =====================================================

/**
 * Odoo JSON-RPC Connector
 * Supports Odoo v14, v15, v16, v17
 */

const ODOO_API_VERSION = {
    14: { common: '/jsonrpc', object: '/jsonrpc' },
    15: { common: '/jsonrpc', object: '/jsonrpc' },
    16: { common: '/jsonrpc', object: '/jsonrpc' },
    17: { common: '/jsonrpc', object: '/jsonrpc' }
};

/**
 * Execute Odoo JSON-RPC call
 * @param {Object} config - { url, db, username, password, version, model, method, args, kwargs }
 * @returns {Promise<Object>}
 */
export async function odooCall(config) {
    const {
        url,
        db,
        username,
        password,
        version = 17,
        model,
        method,
        args = [],
        kwargs = {}
    } = config;

    if (!url || !db || !username || !password || !model || !method) {
        throw new Error('Missing required params: url, db, username, password, model, method');
    }

    // Get authentication token
    const authResult = await authenticate({
        url, db, username, password, version
    });

    // Execute the call
    const response = await fetch(`${url}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'object',
                method: 'execute_kw',
                args: [db, authResult.uid, authResult.password, model, method, args, kwargs]
            },
            id: Date.now()
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(`Odoo Error: ${data.error.message} (${data.error.code})`);
    }

    return data.result;
}

/**
 * Authenticate with Odoo
 */
async function authenticate({ url, db, username, password, version }) {
    const response = await fetch(`${url}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'common',
                method: 'login',
                args: [db, username, password]
            },
            id: Date.now()
        })
    });

    const data = await response.json();

    if (data.error || !data.result) {
        throw new Error(`Odoo Auth Error: ${data.error?.message || 'Login failed'}`);
    }

    return {
        uid: data.result,
        password: password // In real implementation, get session_id
    };
}

/**
 * Search records in Odoo
 */
export async function odooSearch(config) {
    return odooCall({
        ...config,
        model: config.model,
        method: 'search_read',
        args: [config.domain || []],
        kwargs: {
            fields: config.fields || [],
            offset: config.offset || 0,
            limit: config.limit || 100,
            order: config.order || 'id desc'
        }
    });
}

/**
 * Create record in Odoo
 */
export async function odooCreate(config) {
    return odooCall({
        ...config,
        model: config.model,
        method: 'create',
        args: [config.values],
        kwargs: {}
    });
}

/**
 * Update record in Odoo
 */
export async function odooUpdate(config) {
    return odooCall({
        ...config,
        model: config.model,
        method: 'write',
        args: [[config.id], config.values],
        kwargs: {}
    });
}

/**
 * Delete record in Odoo
 */
export async function odooDelete(config) {
    return odooCall({
        ...config,
        model: config.model,
        method: 'unlink',
        args: [[config.id]],
        kwargs: {}
    });
}

/**
 * Call custom method on Odoo model
 */
export async function odooMethod(config) {
    return odooCall({
        ...config,
        model: config.model,
        method: config.method,
        args: config.args || [],
        kwargs: config.kwargs || {}
    });
}

// =====================================================
// SAP S/4HANA CONNECTOR
// =====================================================

/**
 * SAP S/4HANA OData V4 Connector
 */

const SAP_DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

/**
 * Get SAP CSRF token
 */
async function getSAPCSRFToken(config) {
    const { baseUrl, username, password } = config;

    const response = await fetch(`${baseUrl}/sap/opu/odata/sap/`, {
        method: 'GET',
        headers: {
            ...SAP_DEFAULT_HEADERS,
            'Authorization': 'Basic ' + btoa(`${username}:${password}`)
        }
    });

    return {
        token: response.headers.get('x-csrf-token'),
        cookies: response.headers.get('set-cookie')
    };
}

/**
 * Execute SAP OData request
 */
async function sapRequest(config) {
    const { baseUrl, username, password, method = 'GET', path, body, params } = config;

    let url = `${baseUrl}${path}`;

    if (params) {
        const queryString = Object.entries(params)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
        url += `?${queryString}`;
    }

    const headers = {
        ...SAP_DEFAULT_HEADERS,
        'Authorization': 'Basic ' + btoa(`${username}:${password}`)
    };

    const options = {
        method,
        headers
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`SAP Error: ${response.status} ${error}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('json')) {
        return response.json();
    }

    return response.text();
}

/**
 * Read SAP entities
 */
export async function sapRead(config) {
    const { entitySet, select, filter, top, skip, orderby } = config;

    return sapRequest({
        ...config,
        method: 'GET',
        path: `/sap/opu/odata/sap/${entitySet}`,
        params: {
            $select: select?.join(','),
            $filter: filter,
            $top: top,
            $skip: skip,
            $orderby: orderby
        }
    });
}

/**
 * Create SAP entity
 */
export async function sapCreate(config) {
    const { entitySet, data } = config;

    return sapRequest({
        ...config,
        method: 'POST',
        path: `/sap/opu/odata/sap/${entitySet}`,
        body: data
    });
}

/**
 * Update SAP entity
 */
export async function sapUpdate(config) {
    const { entitySet, key, data } = config;

    return sapRequest({
        ...config,
        method: 'PUT',
        path: `/sap/opu/odata/sap/${entitySet}(${key})`,
        body: data
    });
}

/**
 * Delete SAP entity
 */
export async function sapDelete(config) {
    const { entitySet, key } = config;

    return sapRequest({
        ...config,
        method: 'DELETE',
        path: `/sap/opu/odata/sap/${entitySet}(${key})`
    });
}

/**
 * Call SAP function module (BAPI)
 */
export async function sapCallFunction(config) {
    const { functionName, parameters } = config;

    // SAP BAPI via OData
    return sapRequest({
        ...config,
        method: 'POST',
        path: `/sap/opu/odata/sap/${functionName}`,
        body: parameters
    });
}

// =====================================================
// SFTP CONNECTOR
// =====================================================

/**
 * SFTP File Transfer Connector
 * Uses ssh2-sftp-client or similar
 */

/**
 * Connect to SFTP server (browser-compatible)
 * Note: In browser, we use a backend relay for SFTP operations
 */
export async function sftpConnect(config) {
    const { endpoint, host, port, username, password, privateKey } = config;

    if (endpoint) {
        // Use backend relay
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'connect',
                host,
                port: port || 22,
                username,
                password,
                privateKey
            })
        });

        return response.json();
    }

    throw new Error('SFTP requires a backend relay endpoint');
}

/**
 * List directory contents
 */
export async function sftpList(config) {
    const { endpoint, path } = config;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', path })
    });

    return response.json();
}

/**
 * Download file
 */
export async function sftpDownload(config) {
    const { endpoint, remotePath, localPath } = config;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download', remotePath })
    });

    if (localPath) {
        // Return as blob
        return response.blob();
    }

    return response.json();
}

/**
 * Upload file
 */
export async function sftpUpload(config) {
    const { endpoint, localData, remotePath, fileName } = config;

    const formData = new FormData();
    formData.append('action', 'upload');
    formData.append('remotePath', remotePath);
    formData.append('file', localData, fileName);

    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
    });

    return response.json();
}

/**
 * Delete file
 */
export async function sftpDelete(config) {
    const { endpoint, remotePath } = config;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', remotePath })
    });

    return response.json();
}

/**
 * Create directory
 */
export async function sftpMkdir(config) {
    const { endpoint, remotePath, recursive } = config;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mkdir', remotePath, recursive: recursive || false })
    });

    return response.json();
}

// =====================================================
// NODE EXECUTION FUNCTION
// =====================================================

/**
 * Execute Enterprise connector node
 */
export async function executeEnterpriseNode(nodeData, context = {}) {
    const { connectorType, action, config, credentialId } = nodeData;
    const variables = context.variables || {};

    // Get credential if specified
    let executionConfig = { ...config };

    if (credentialId) {
        const credential = await getCredentialById(credentialId);
        if (credential?.encrypted_config) {
            executionConfig = { ...credential.encrypted_config, ...config };
            await updateCredentialLastUsed(credentialId);
        }
    }

    // Interpolate variables
    const interpolate = (str) => {
        if (!str || typeof str !== 'string') return str;
        return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            const keys = path.trim().split('.');
            let value = variables;
            for (const k of keys) {
                value = value?.[k];
            }
            return value ?? match;
        });
    };

    // Apply interpolation to config
    const interpolatedConfig = {};
    for (const [key, value] of Object.entries(executionConfig)) {
        interpolatedConfig[key] = typeof value === 'string' ? interpolate(value) : value;
    }

    switch (connectorType) {
        case 'odoo':
            return executeOdoo(interpolatedConfig, action);

        case 'sap':
            return executeSAP(interpolatedConfig, action);

        case 'sftp':
            return executeSFTP(interpolatedConfig, action);

        default:
            throw new Error(`Unknown enterprise connector: ${connectorType}`);
    }
}

async function executeOdoo(config, action) {
    switch (action) {
        case 'search':
        case 'search_read':
            return odooSearch(config);
        case 'create':
            return odooCreate(config);
        case 'update':
        case 'write':
            return odooUpdate(config);
        case 'delete':
        case 'unlink':
            return odooDelete(config);
        case 'call':
        case 'execute':
            return odooMethod(config);
        default:
            return odooCall(config);
    }
}

async function executeSAP(config, action) {
    switch (action) {
        case 'read':
            return sapRead(config);
        case 'create':
            return sapCreate(config);
        case 'update':
            return sapUpdate(config);
        case 'delete':
            return sapDelete(config);
        case 'call':
            return sapCallFunction(config);
        default:
            throw new Error(`Unknown SAP action: ${action}`);
    }
}

async function executeSFTP(config, action) {
    switch (action) {
        case 'connect':
            return sftpConnect(config);
        case 'list':
            return sftpList(config);
        case 'download':
            return sftpDownload(config);
        case 'upload':
            return sftpUpload(config);
        case 'delete':
            return sftpDelete(config);
        case 'mkdir':
            return sftpMkdir(config);
        default:
            throw new Error(`Unknown SFTP action: ${action}`);
    }
}

// =====================================================
// PRESET WORKFLOWS
// =====================================================

/**
 * Odoo preset functions for MES
 */
export const ODOO_PRESETS = {
    createSaleOrder: {
        label: 'Create Sale Order',
        model: 'sale.order',
        method: 'action_confirm',
        description: 'Create and confirm a sales order'
    },
    createManufactureOrder: {
        label: 'Create MO',
        model: 'mrp.production',
        method: 'action_confirm',
        description: 'Create manufacturing order'
    },
    updateStock: {
        label: 'Update Stock',
        model: 'stock.picking',
        method: 'action_done',
        description: 'Complete stock transfer'
    },
    createInvoice: {
        label: 'Create Invoice',
        model: 'account.move',
        method: 'action_post',
        description: 'Create and post invoice'
    }
};

/**
 * SAP preset functions
 */
export const SAP_PRESETS = {
    readMaterialMaster: {
        entitySet: 'A_Material',
        label: 'Read Material Master',
        description: 'Get material information'
    },
    createPurchaseOrder: {
        entitySet: 'A_PurchaseOrder',
        label: 'Create PO',
        description: 'Create purchase order'
    },
    readProductionOrder: {
        entitySet: 'A_ProductionOrder',
        label: 'Read Production Order',
        description: 'Get production order details'
    }
};

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
    // Odoo
    odooCall,
    odooSearch,
    odooCreate,
    odooUpdate,
    odooDelete,
    odooMethod,

    // SAP
    sapRead,
    sapCreate,
    sapUpdate,
    sapDelete,
    sapCallFunction,

    // SFTP
    sftpConnect,
    sftpList,
    sftpDownload,
    sftpUpload,
    sftpDelete,
    sftpMkdir,

    // Execute
    executeEnterpriseNode,

    // Presets
    ODOO_PRESETS,
    SAP_PRESETS
};
