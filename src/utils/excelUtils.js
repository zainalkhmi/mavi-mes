/**
 * excelUtils.js
 * Excel Import/Export utilities for MaviCore MES
 * Uses SheetJS (xlsx) for reading and writing Excel files
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

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: '', // Default value for empty cells
          raw: false, // Format values
          dateNF: 'yyyy-mm-dd', // Date format
        });

        resolve({
          success: true,
          data: jsonData,
          headers: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
          rowCount: jsonData.length,
          sheetName,
          workbook,
        });
      } catch (err) {
        reject(new Error('Failed to parse Excel file: ' + err.message));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read all sheets from Excel file
 */
export async function readExcelAllSheets(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const sheets = {};
        workbook.SheetNames.forEach(name => {
          const worksheet = workbook.Sheets[name];
          sheets[name] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
        });

        resolve({
          success: true,
          sheets,
          sheetNames: workbook.SheetNames,
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
 * Export data to Excel file and trigger download
 */
export function exportToExcel(data, filename = 'export.xlsx', options = {}) {
  const {
    sheetName = 'Sheet1',
    headers = true,
    format = 'xlsx', // 'xlsx' | 'csv'
  } = options;

  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: headers ? Object.keys(data[0]) : undefined,
    skipHeader: !headers,
  });

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate file
  const outputType = format === 'csv' ? 'csv' : 'array';
  const output = XLSX.write(workbook, { bookType: format, type: outputType });

  // Create blob and download
  const blob = new Blob([output], {
    type: format === 'csv'
      ? 'text/csv;charset=utf-8'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  downloadBlob(blob, `${filename}.${format}`);
}

/**
 * Export with custom styling and formatting
 */
export function exportToExcelStyled(data, filename = 'report.xlsx', styles = {}) {
  const {
    sheetName = 'Report',
    title = null,
    headers = true,
    columnWidths = {},
    headerStyle = { bold: true, fill: 'CCCCCC' },
  } = styles;

  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  if (Object.keys(columnWidths).length > 0) {
    worksheet['!cols'] = Object.entries(columnWidths).map(([col, width]) => ({ wch: width }));
  }

  // Apply header styling via cell formatting
  if (headers && data.length > 0) {
    const headerCells = Object.keys(data[0]);
    headerCells.forEach((key, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: headerStyle.fill || 'CCCCCC' },
        };
      }
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  downloadBlob(blob, filename);
}

/**
 * Download blob as file
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV string to array of objects
 */
export function parseCSV(csvString) {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });
}

/**
 * Parse single CSV line handling quoted values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Generate Excel template from table schema
 */
export function generateExcelTemplate(tableSchema, filename = 'template.xlsx') {
  const { name, fields = [] } = tableSchema;

  // Create headers from fields
  const headers = ['recordId', ...fields.map(f => f.name || f.label)];

  // Create sample row
  const sampleRow = {};
  sampleRow['recordId'] = 'AUTO-GENERATED';
  fields.forEach(f => {
    const sample = getSampleValue(f.type);
    sampleRow[f.name || f.label] = sample;
  });

  // Export
  const data = [
    { _header: 'AUTO-GENERATED - DELETE THIS ROW BEFORE IMPORT', __empty: '' },
    { _header: 'Fields:', __empty: 'Values (replace with actual data' },
    { recordId: 'REC-001', ...Object.fromEntries(fields.map(f => [f.name || f.label, getSampleValue(f.type)]) },
    { recordId: 'REC-002', ...Object.fromEntries(fields.map(f => [f.name || f.label, '']) },
    { recordId: '', ...Object.fromEntries(fields.map(f => [f.name || f.label, ''])) },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  // Create Instructions sheet
  const instructions = XLSX.utils.aoa_to_sheet([
    ['INSTRUCTIONS'],
    [''],
    ['1. Fill in your data starting from row 3 (Row 2 is sample data)'],
    ['2. recordId column is auto-generated if left empty'],
    ['3. Save as .xlsx format before importing'],
    ['4. Upload the file in Table Manager Import section'],
    [''],
    ['FIELD TYPES:'],
    ...fields.map(f => [`  ${f.name}: ${f.type}`]),
  ]);
  XLSX.utils.book_append_sheet(workbook, instructions, 'Instructions');

  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  downloadBlob(blob, `${name}_template.xlsx`);
}

/**
 * Get sample value based on field type
 */
function getSampleValue(fieldType) {
  switch (fieldType) {
    case 'number':
    case 'integer':
      return 100;
    case 'boolean':
      return true;
    case 'datetime':
      return new Date().toISOString();
    case 'select':
      return 'Option1';
    default:
      return 'Sample';
  }
}

/**
 * Map Excel columns to table fields
 */
export function mapExcelColumnsToFields(excelHeaders, tableFields) {
  const mapping = [];

  excelHeaders.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim().replace(/[\s_-]/g, '');

    // Find matching field
    const matchedField = tableFields.find(f => {
      const normalizedField = (f.name || f.label || '').toLowerCase().trim().replace(/[\s_-]/g, '');
      return (
        normalizedHeader === normalizedField ||
        normalizedHeader.includes(normalizedField) ||
        normalizedField.includes(normalizedHeader)
      );
    });

    mapping.push({
      excelColumn: header,
      tableField: matchedField?.name || null,
      fieldType: matchedField?.type || 'text',
      matched: !!matchedField,
    });
  });

  return mapping;
}

/**
 * Validate imported data against table schema
 */
export function validateImportData(data, tableFields) {
  const errors = [];
  const validRecords = [];
  const fieldMap = new Map(tableFields.map(f => [f.name, f]));

  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because row 1 is header, data starts at row 2
    const rowErrors = [];

    tableFields.forEach(field => {
      const value = row[field.name];
      const fieldError = validateField(value, field);
      if (fieldError) {
        rowErrors.push(`Row ${rowNum}, ${field.name}: ${fieldError}`);
      }
    });

    if (rowErrors.length === 0) {
      // Transform row to correct types
      const transformedRow = { recordId: generateRecordId() };
      tableFields.forEach(field => {
        transformedRow[field.name] = transformValue(row[field.name], field.type);
      });
      validRecords.push(transformedRow);
    } else {
      errors.push(...rowErrors);
    }
  });

  return { validRecords, errors, validCount: validRecords.length, errorCount: errors.length };
}

/**
 * Validate single field value
 */
function validateField(value, field) {
  const { name, type, required } = field;

  // Check required
  if (required && (value === undefined || value === null || value === '')) {
    return 'Required field is empty';
  }

  // Type validation
  if (value !== undefined && value !== null && value !== '') {
    switch (type) {
      case 'number':
      case 'integer':
        if (isNaN(parseFloat(value))) {
          return 'Must be a number';
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && !['true', 'false', '1', '0', 'yes', 'no'].includes(String(value).toLowerCase())) {
          return 'Must be true/false';
        }
        break;
      case 'datetime':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Invalid date format';
        }
        break;
    }
  }

  return null;
}

/**
 * Transform value to correct type
 */
function transformValue(value, type) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  switch (type) {
    case 'number':
      return parseFloat(value) || 0;
    case 'integer':
      return parseInt(value, 10) || 0;
    case 'boolean':
      const str = String(value).toLowerCase();
      return ['true', '1', 'yes', 'y'].includes(str);
    case 'datetime':
      return new Date(value).toISOString();
    default:
      return String(value).trim();
  }
}

/**
 * Generate unique record ID
 */
function generateRecordId() {
  return 'REC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

/**
 * Export table records to Excel with formatting
 */
export async function exportTableToExcel(tableName, records, fields, options = {}) {
  const {
    filename = `${tableName}_export.xlsx`,
    title = tableName,
    includeTimestamp = true,
    format = ['xlsx'],
  } = options;

  if (!records || records.length === 0) {
    throw new Error('No records to export');
  }

  // Prepare data with headers
  const exportData = records.map(record => {
    const row = {};
    fields.forEach(field => {
      let value = record[field.name];
      // Format dates
      if (field.type === 'datetime' && value) {
        value = new Date(value).toLocaleString();
      }
      row[field.label || field.name] = value ?? '';
    });
    return row;
  });

  // Add metadata rows
  const metadata = [];
  if (includeTimestamp) {
    metadata.push({ [fields[0]?.label || 'Field']: `Exported: ${new Date().toLocaleString()}` });
    metadata.push({ [fields[0]?.label || 'Field']: `Total Records: ${records.length}` });
    metadata.push({});
  }

  const finalData = [...metadata, ...exportData];

  // Export
  exportToExcelStyled(finalData, filename, {
    sheetName: tableName.substring(0, 31), // Excel sheet name max 31 chars
    headers: false, // We included headers in metadata
  });

  return { success: true, filename, recordCount: records.length };
}

export default {
  readExcelFile,
  readExcelAllSheets,
  exportToExcel,
  exportToExcelStyled,
  parseCSV,
  generateExcelTemplate,
  mapExcelColumnsToFields,
  validateImportData,
  exportTableToExcel,
};
