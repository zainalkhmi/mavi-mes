/**
 * Google Sheets Connector
 * Read/Write data from Google Sheets via Google Sheets API v4
 *
 * Prerequisites:
 * 1. Enable Google Sheets API in Google Cloud Console
 * 2. Create Service Account and download JSON key
 * 3. Share your Google Sheet with the service account email
 *
 * Usage:
 * import { googleSheetsConnector } from './connectors/googleSheets';
 *
 * // Read data
 * const data = await googleSheetsConnector.readRange({
 *   spreadsheetId: 'xxx',
 *   range: 'Sheet1!A1:D10',
 *   serviceAccount: serviceAccountJson
 * });
 *
 * // Write data
 * await googleSheetsConnector.appendRow({
 *   spreadsheetId: 'xxx',
 *   range: 'Sheet1!A:D',
 *   values: [['Value1', 'Value2', 'Value3']]
 * });
 */

import { getCredentialById, updateCredentialLastUsed } from '../automationDB';

// =====================================================
// GOOGLE SHEETS API
// =====================================================

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Get access token from service account
 * @param {Object} serviceAccount
 * @returns {Promise<string>}
 */
async function getAccessToken(serviceAccount) {
    const { client_email, private_key } = serviceAccount;

    if (!client_email || !private_key) {
        throw new Error('Invalid service account: missing client_email or private_key');
    }

    // Use Web Crypto API for JWT signing
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;

    const header = base64urlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64urlEncode({
        iss: client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: expiry,
        iat: now
    });

    const signingInput = `${header}.${payload}`;

    // Import private key
    const pemKey = private_key
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '');

    const keyData = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        key,
        new TextEncoder().encode(signingInput)
    );

    const signBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const jwt = `${signingInput}.${signBase64}`;

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth2%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(`OAuth Error: ${data.error_description || data.error}`);
    }

    return data.access_token;
}

/**
 * Base64url encode
 */
function base64urlEncode(str) {
    if (typeof str === 'object') {
        str = JSON.stringify(str);
    }
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// =====================================================
// CORE OPERATIONS
// =====================================================

/**
 * Read range from Google Sheet
 * @param {Object} config - { spreadsheetId, range, serviceAccount }
 * @returns {Promise<Object>} - { values, majorDimension }
 */
export async function readRange(config) {
    const { spreadsheetId, range, serviceAccount } = config;

    if (!spreadsheetId || !range) {
        throw new Error('Missing required params: spreadsheetId, range');
    }

    const token = await getAccessToken(serviceAccount);

    const response = await fetch(
        `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        {
            headers: { 'Authorization': `Bearer ${token}` }
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Sheets API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
}

/**
 * Write values to a range
 * @param {Object} config - { spreadsheetId, range, values, serviceAccount, valueInputOption }
 * @returns {Promise<Object>}
 */
export async function updateRange(config) {
    const { spreadsheetId, range, values, serviceAccount, valueInputOption = 'RAW' } = config;

    if (!spreadsheetId || !range || !values) {
        throw new Error('Missing required params: spreadsheetId, range, values');
    }

    const token = await getAccessToken(serviceAccount);

    const response = await fetch(
        `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=${valueInputOption}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ values })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Sheets API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
}

/**
 * Append row to sheet
 * @param {Object} config - { spreadsheetId, range, values, serviceAccount }
 * @returns {Promise<Object>}
 */
export async function appendRow(config) {
    const { spreadsheetId, range, values, serviceAccount } = config;

    if (!spreadsheetId || !range || !values) {
        throw new Error('Missing required params: spreadsheetId, range, values');
    }

    const token = await getAccessToken(serviceAccount);

    const response = await fetch(
        `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ values })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Sheets API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
}

/**
 * Batch update multiple ranges
 * @param {Object} config - { spreadsheetId, data, serviceAccount }
 * data: [{ range, values }]
 * @returns {Promise<Object>}
 */
export async function batchUpdate(config) {
    const { spreadsheetId, data, serviceAccount } = config;

    if (!spreadsheetId || !data) {
        throw new Error('Missing required params: spreadsheetId, data');
    }

    const token = await getAccessToken(serviceAccount);

    const response = await fetch(
        `${SHEETS_API}/${spreadsheetId}/values:batchUpdate`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                valueInputOption: 'USER_ENTERED',
                data
            })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Sheets API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
}

/**
 * Clear range
 * @param {Object} config - { spreadsheetId, range, serviceAccount }
 * @returns {Promise<Object>}
 */
export async function clearRange(config) {
    const { spreadsheetId, range, serviceAccount } = config;

    if (!spreadsheetId || !range) {
        throw new Error('Missing required params: spreadsheetId, range');
    }

    const token = await getAccessToken(serviceAccount);

    const response = await fetch(
        `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
        {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Sheets API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
}

/**
 * Get sheet metadata
 * @param {Object} config - { spreadsheetId, serviceAccount }
 * @returns {Promise<Object>}
 */
export async function getSpreadsheetInfo(config) {
    const { spreadsheetId, serviceAccount } = config;

    if (!spreadsheetId) {
        throw new Error('Missing required param: spreadsheetId');
    }

    const token = await getAccessToken(serviceAccount);

    const response = await fetch(
        `${SHEETS_API}/${spreadsheetId}?includeGridData=false`,
        {
            headers: { 'Authorization': `Bearer ${token}` }
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Sheets API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
}

/**
 * Create new spreadsheet
 * @param {Object} config - { title, serviceAccount }
 * @returns {Promise<Object>}
 */
export async function createSpreadsheet(config) {
    const { title, serviceAccount } = config;

    if (!title) {
        throw new Error('Missing required param: title');
    }

    const token = await getAccessToken(serviceAccount);

    const response = await fetch(SHEETS_API, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            properties: { title },
            sheets: [{ properties: { title: 'Sheet1' } }]
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Sheets API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Convert array of objects to 2D array
 * @param {Array} data - Array of objects
 * @param {Array} columns - Column order (optional)
 * @returns {Array} - 2D array [[header1, header2], [val1, val2]]
 */
export function objectsToRows(data, columns = null) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return [];
    }

    const headers = columns || Object.keys(data[0]);
    const rows = [headers];

    data.forEach(item => {
        const row = headers.map(col => {
            const value = item[col];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
        });
        rows.push(row);
    });

    return rows;
}

/**
 * Convert 2D array to array of objects
 * @param {Array} rows - 2D array [[header1, header2], [val1, val2]]
 * @returns {Array} - Array of objects
 */
export function rowsToObjects(rows) {
    if (!rows || !Array.isArray(rows) || rows.length < 2) {
        return [];
    }

    const headers = rows[0];
    const data = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        data.push(obj);
    }

    return data;
}

/**
 * Find last row with data in column
 */
export function findLastRow(data, columnIndex = 0) {
    if (!data || !data.length) return 1;

    for (let i = data.length - 1; i >= 0; i--) {
        if (data[i][columnIndex] && data[i][columnIndex].toString().trim() !== '') {
            return i + 1;
        }
    }
    return data.length;
}

// =====================================================
// NODE EXECUTION FUNCTION
// =====================================================

/**
 * Execute Google Sheets node in automation
 * @param {Object} nodeData
 * @param {Object} context
 * @returns {Promise<Object>}
 */
export async function execute(nodeData, context = {}) {
    const { action, config, credentialId } = nodeData;
    const variables = context.variables || {};

    // Get credential if specified
    let serviceAccount = config?.serviceAccount;

    if (credentialId) {
        const credential = await getCredentialById(credentialId);
        if (credential) {
            serviceAccount = credential.encrypted_config?.serviceAccount || credential.encrypted_config;
            await updateCredentialLastUsed(credentialId);
        }
    }

    // Interpolate variables
    const spreadsheetId = interpolate(config?.spreadsheetId, variables);
    const range = interpolate(config?.range, variables);

    // Handle values interpolation
    let values = config?.values;
    if (typeof values === 'string') {
        try {
            values = JSON.parse(interpolate(values, variables));
        } catch {
            values = [[interpolate(values, variables)]];
        }
    }

    switch (action) {
        case 'readRange':
            return readRange({ spreadsheetId, range, serviceAccount });

        case 'updateRange':
            return updateRange({ spreadsheetId, range, values, serviceAccount, valueInputOption: config?.valueInputOption });

        case 'appendRow':
            return appendRow({ spreadsheetId, range, values, serviceAccount });

        case 'batchUpdate':
            return batchUpdate({ spreadsheetId, data: config?.data, serviceAccount });

        case 'clearRange':
            return clearRange({ spreadsheetId, range, serviceAccount });

        case 'getInfo':
            return getSpreadsheetInfo({ spreadsheetId, serviceAccount });

        case 'create':
            return createSpreadsheet({ title: interpolate(config?.title, variables), serviceAccount });

        case 'objectsToRows':
            return objectsToRows(values, config?.columns);

        case 'rowsToObjects':
            return rowsToObjects(values);

        default:
            throw new Error(`Unknown Google Sheets action: ${action}`);
    }
}

// =====================================================
// UTILITY
// =====================================================

function interpolate(str, variables = {}) {
    if (!str || typeof str !== 'string') return str;

    return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const keys = path.trim().split('.');
        let value = variables;
        for (const key of keys) {
            value = value?.[key];
        }
        return value ?? match;
    });
}

// =====================================================
// DEFAULT EXPORT
// =====================================================
export default {
    readRange,
    updateRange,
    appendRow,
    batchUpdate,
    clearRange,
    getSpreadsheetInfo,
    createSpreadsheet,
    objectsToRows,
    rowsToObjects,
    findLastRow,
    execute
};

export const googleSheetsConnector = {
    readRange,
    updateRange,
    appendRow,
    batchUpdate,
    clearRange,
    getSpreadsheetInfo,
    createSpreadsheet,
    objectsToRows,
    rowsToObjects,
    execute
};
