/**
 * googleSheetsSync.js
 * Google Sheets & Spreadsheet live integration service for MAVI MES.
 * Supports:
 * 1. Published Google Sheets CSV auto-sync (zero-config, read-only)
 * 2. Google Apps Script Webhook (two-way read and append/write-back)
 * 3. Local Excel & CSV parsing to MAVI Table schema
 */

import * as XLSX from 'xlsx';

/**
 * Predict MAVI table field type from sample cell values
 */
export function inferFieldType(sampleValues) {
  const nonNulls = sampleValues.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
  if (nonNulls.length === 0) return 'text';

  // Check if all are boolean
  const allBool = nonNulls.every(v => {
    const s = String(v).toLowerCase().trim();
    return s === 'true' || s === 'false' || s === 'yes' || s === 'no' || s === '1' || s === '0' || v === true || v === false;
  });
  if (allBool && nonNulls.length > 0) return 'boolean';

  // Check if all are numbers
  const allNum = nonNulls.every(v => {
    if (typeof v === 'number') return true;
    const clean = String(v).replace(/[,$\s%]/g, '');
    return clean !== '' && !isNaN(Number(clean));
  });
  if (allNum) {
    const allInt = nonNulls.every(v => Number.isInteger(Number(String(v).replace(/[,$\s%]/g, ''))));
    return allInt ? 'integer' : 'number';
  }

  // Check if datetime / date
  const allDate = nonNulls.every(v => {
    if (v instanceof Date) return true;
    const str = String(v).trim();
    // Match common date patterns: YYYY-MM-DD or ISO
    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(str)) {
      return !isNaN(Date.parse(str));
    }
    // Match DD/MM/YYYY or DD-MM-YYYY
    const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (dmy) {
      const day = Number(dmy[1]);
      const month = Number(dmy[2]);
      return day >= 1 && day <= 31 && month >= 1 && month <= 12;
    }
    return false;
  });
  if (allDate) return 'datetime';

  return 'text';
}

/**
 * Parse an Excel file (.xlsx, .xls, .csv) into AppSheet-like table schemas with predicted columns
 */
export async function parseSpreadsheetFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const sheets = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
          
          if (!rawRows || rawRows.length === 0) {
            return {
              sheetName,
              headers: [],
              fields: [],
              records: [],
              rowCount: 0
            };
          }

          const headers = Object.keys(rawRows[0]);
          
          // Detect field types by sampling up to 50 rows
          const fields = headers.map(headerName => {
            const cleanName = headerName.trim().replace(/[^a-zA-Z0-9_ ]/g, '');
            const samples = rawRows.slice(0, 50).map(r => r[headerName]);
            const predictedType = inferFieldType(samples);

            return {
              name: cleanName || headerName.trim(),
              originalHeader: headerName,
              type: predictedType,
              label: headerName.trim()
            };
          });

          return {
            sheetName,
            headers,
            fields,
            records: rawRows,
            rowCount: rawRows.length
          };
        });

        resolve({
          fileName: file.name,
          sheets,
          defaultSheet: sheets[0] || null
        });
      } catch (err) {
        reject(new Error(`Failed to parse spreadsheet: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Fetch rows from a published Google Sheet CSV link
 * Example URL: https://docs.google.com/spreadsheets/d/e/.../pub?output=csv
 */
export async function fetchPublishedGoogleSheet(csvUrl) {
  let targetUrl = csvUrl.trim();
  
  // If user provided standard view URL, convert to export CSV URL
  const match = targetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && !targetUrl.includes('export?format=csv') && !targetUrl.includes('pub?output=csv')) {
    const sheetId = match[1];
    targetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  }

  const response = await fetch(targetUrl);
  if (!response.ok) {
    throw new Error(`Google Sheets fetch failed: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  const workbook = XLSX.read(csvText, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Spreadsheet kosong atau tidak memiliki baris data.');
  }

  const headers = Object.keys(rawRows[0]);
  const fields = headers.map(headerName => {
    const samples = rawRows.slice(0, 50).map(r => r[headerName]);
    return {
      name: headerName.trim().replace(/[^a-zA-Z0-9_ ]/g, '') || headerName.trim(),
      originalHeader: headerName,
      type: inferFieldType(samples),
      label: headerName.trim()
    };
  });

  return {
    headers,
    fields,
    records: rawRows,
    rowCount: rawRows.length
  };
}

/**
 * Append row to Google Sheets via Google Apps Script Web App endpoint
 */
export async function appendRowToGoogleSheetWebhook(webhookUrl, rowData) {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    throw new Error('Google Apps Script Webhook URL tidak valid.');
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    mode: 'no-cors', // Apps Script handles redirects
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'APPEND_ROW',
      timestamp: new Date().toISOString(),
      data: rowData
    })
  });

  return {
    success: true,
    message: 'Data successfully sent to Google Sheet Webhook'
  };
}

/**
 * Google Apps Script Template code for copy-paste into Google Sheets
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// -------------------------------------------------------------
// MAVI MES - Google Sheets Live Connector Script
// Tempelkan kode ini di Google Sheets: Extensions > Apps Script
// Lalu Deploy > New Deployment > Web app > Anyone can access
// -------------------------------------------------------------

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    var data = payload.data || {};

    // Ambil headers dari baris 1
    var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    
    // Jika sheet masih kosong, buat headers otomatis
    if (!headers || headers.length === 0 || headers[0] === "") {
      headers = Object.keys(data);
      sheet.appendRow(headers);
    }

    // Susun baris sesuai urutan header
    var newRow = headers.map(function(h) {
      return data[h] !== undefined ? data[h] : "";
    });

    sheet.appendRow(newRow);

    return ContentService.createTextOutput(JSON.stringify({ status: "SUCCESS", rowAdded: newRow }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "ERROR", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
}
`;
