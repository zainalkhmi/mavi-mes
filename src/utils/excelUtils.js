/**
 * excelUtils.js
 * Excel Import/Export utilities for MaviCore MES
 */

import * as XLSX from 'xlsx';

/**
 * Read Excel file and return array of objects
 */
export async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
        resolve({
          success: true,
          data: jsonData,
          headers: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
          rowCount: jsonData.length,
          sheetName,
        });
      } catch (err) {
        reject(new Error('Failed to parse Excel: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export data to Excel file
 */
export function exportToExcel(data, filename = 'export', options = {}) {
  const { format = 'xlsx' } = options;
  if (!data || data.length === 0) throw new Error('No data to export');

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const ext = format === 'csv' ? 'csv' : 'xlsx';
  const outputType = format === 'csv' ? 'string' : 'array';
  const mimeType = format === 'csv'
    ? 'text/csv;charset=utf-8'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const output = XLSX.write(workbook, { bookType: format, type: 'array' });
  const blob = new Blob([output], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename + '.' + ext;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Excel template from table schema
 */
export function generateExcelTemplate(tableSchema, filename = 'template') {
  const { name, fields = [] } = tableSchema;
  const headers = ['recordId', ...fields.map(f => f.name || f.label)];
  const sampleRow = { 'recordId': 'AUTO-GENERATED' };
  fields.forEach(f => { sampleRow[f.name || f.label] = getSampleValue(f.type); });

  const wsData = [
    { _header: 'TEMPLATE - DELETE THIS ROW BEFORE IMPORT' },
    { _header: 'recordId', ...Object.fromEntries(fields.map(f => [f.name, f.type])) },
    { recordId: 'REC-001', ...Object.fromEntries(fields.map(f => [f.name, getSampleValue(f.type)])) },
    { recordId: 'REC-002', ...Object.fromEntries(fields.map(f => [f.name, ''])) },
  ];

  const worksheet = XLSX.utils.json_to_sheet(wsData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  const instr = XLSX.utils.aoa_to_sheet([
    ['INSTRUCTIONS'],
    ['1. Fill data starting from row 3'],
    ['2. recordId is auto-generated if left empty'],
    ['3. Save as .xlsx before importing'],
  ]);
  XLSX.utils.book_append_sheet(workbook, instr, 'Instructions');

  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename + '.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export table data with field definitions to Excel
 */
export function exportTableToExcel(tableName, records = [], fields = []) {
  const exportData = records.map(rec => {
    if (!fields || fields.length === 0) return rec;
    const row = {};
    fields.forEach(f => {
      const fieldKey = f.name || f.key || f.id;
      const fieldLabel = f.label || f.name || fieldKey;
      row[fieldLabel] = rec[fieldKey] !== undefined ? rec[fieldKey] : '';
    });
    return row;
  });

  return exportToExcel(exportData, (tableName || 'table') + '_export', { format: 'xlsx' });
}

function getSampleValue(type) {
  switch (type) {
    case 'number':
    case 'integer': return 100;
    case 'boolean': return true;
    case 'datetime': return new Date().toISOString();
    default: return 'Sample';
  }
}

/**
 * Map Excel columns to table fields
 */
export function mapExcelColumnsToFields(headers, fields) {
  return headers.map(header => {
    const norm = header.toLowerCase().replace(/[\s_-]/g, '');
    const matched = fields.find(f => {
      const normF = (f.name || f.label || '').toLowerCase().replace(/[\s_-]/g, '');
      return norm === normF || norm.includes(normF) || normF.includes(norm);
    });
    return {
      excelColumn: header,
      tableField: matched ? matched.name : null,
      fieldType: matched ? matched.type : 'text',
      matched: !!matched,
    };
  });
}

/**
 * Validate import data
 */
export function validateImportData(records, fields) {
  const errors = [];
  const valid = [];
  records.forEach((row, i) => {
    const rowNum = i + 2;
    fields.forEach(f => {
      const v = row[f.name];
      if (f.required && (v === undefined || v === null || v === '')) errors.push('Row ' + rowNum + ', ' + f.name + ': required');
      if (v !== undefined && v !== null && v !== '' && f.type === 'number' && isNaN(parseFloat(v))) {
        errors.push('Row ' + rowNum + ', ' + f.name + ': must be number');
      }
    });
    if (errors.length === 0) {
      const rec = { recordId: 'REC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase() };
      fields.forEach(f => { rec[f.name] = row[f.name]; });
      valid.push(rec);
    }
  });
  return { valid, errors };
}

export default { readExcelFile, exportToExcel, exportTableToExcel, generateExcelTemplate, mapExcelColumnsToFields, validateImportData };
