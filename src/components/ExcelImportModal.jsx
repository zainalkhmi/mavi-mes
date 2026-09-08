/**
 * ExcelImportModal.jsx
 * Modal for importing Excel/CSV data into tables
 */

import React, { useState, useRef } from 'react';
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle,
  X, RefreshCw, ArrowRight, Eye, Trash2, Loader2,
  Table, Columns, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { readExcelFile, mapExcelColumnsToFields, validateImportData, generateExcelTemplate } from '../utils/excelUtils';

export default function ExcelImportModal({ isOpen, onClose, table, onImport, fields = [] }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'mapping' | 'preview' | 'importing'
  const [file, setFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState([]);
  const [validRecords, setValidRecords] = useState([]);
  const [errors, setErrors] = useState([]);
  const [mappingConfig, setMappingConfig] = useState({});
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      '.xlsx', '.xls', '.csv'
    ];

    const fileExt = selectedFile.name.toLowerCase();
    const isValid = validTypes.some(t => file.name?.includes(t)) ||
                   fileExt.endsWith('.xlsx') || fileExt.endsWith('.xls') || fileExt.endsWith('.csv');

    if (!isValid) {
      toast.error('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv');
      return;
    }

    setFile(selectedFile);
    setStep('mapping');

    try {
      const result = await readExcelFile(selectedFile);
      setExcelData(result.data);
      setHeaders(result.headers);

      // Auto-map columns
      const mapping = mapExcelColumnsToFields(result.headers, fields);
      setColumnMapping(mapping);
      setMappingConfig(mapping.reduce((acc, m) => {
        if (m.matched) acc[m.excelColumn] = m.tableField;
        return acc;
      }, {}));
    } catch (err) {
      toast.error('Gagal baca file: ' + err.message);
      setStep('upload');
    }
  };

  // Update column mapping
  const handleMappingChange = (excelCol, tableField) => {
    setMappingConfig(prev => ({
      ...prev,
      [excelCol]: tableField,
    }));
  };

  // Validate and preview
  const handlePreview = () => {
    const mappedFields = columnMapping.map(m => ({
      ...m,
      mappedTo: mappingConfig[m.excelColumn] || null,
    }));

    // Build records based on mapping
    const records = excelData.map(row => {
      const record = {};
      mappedFields.forEach(m => {
        if (m.mappedTo) {
          record[m.mappedTo] = row[m.excelColumn];
        }
      });
      return record;
    });

    // Validate
    const tableFields = mappedFields
      .filter(m => m.mappedTo)
      .map(m => fields.find(f => f.name === m.mappedTo))
      .filter(Boolean);

    const validation = validateImportData(records, tableFields);
    setValidRecords(validation.validRecords);
    setErrors(validation.errors);
    setStep('preview');
  };

  // Import records
  const handleImport = async () => {
    setStep('importing');
    try {
      await onImport(validRecords);
      toast.success(`${validRecords.length} records berhasil diimport!`);
      handleClose();
    } catch (err) {
      toast.error('Import gagal: ' + err.message);
      setStep('preview');
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    if (!table) return;
    const schema = { name: table.name, fields };
    try {
      generateExcelTemplate(schema, `${table.name}_template.xlsx`);
      toast.success('Template downloaded!');
    } catch (err) {
      toast.error('Gagal download template: ' + err.message);
    }
  };

  // Close and reset
  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setExcelData(null);
    setHeaders([]);
    setColumnMapping([]);
    setValidRecords([]);
    setErrors([]);
    setMappingConfig({});
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        width: '95%',
        maxWidth: '800px',
        maxHeight: '90vh',
        backgroundColor: 'white',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Upload size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Import Excel/CSV</h2>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>{table?.name || 'Table Import'}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '12px',
              padding: '8px',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Step Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', gap: '8px' }}>
            {['upload', 'mapping', 'preview'].map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <div style={{ width: '40px', height: '2px', backgroundColor: step === s || ['mapping', 'preview'].indexOf(step) > ['upload', 'mapping'].indexOf(step) ? '#10b981' : '#e2e8f0' }} />}
                <div style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  backgroundColor: step === s ? '#10b981' : '#f1f5f9',
                  color: step === s ? 'white' : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  {step === s && <CheckCircle2 size={14} />}
                  {i + 1}. {s === 'upload' ? 'Upload' : s === 'mapping' ? 'Map Columns' : 'Preview'}
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #e2e8f0',
                  borderRadius: '16px',
                  padding: '40px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <FileSpreadsheet size={48} style={{ color: '#10b981', margin: '0 auto 16px' }} />
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                  Klik upload file Excel/CSV
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                  Format: .xlsx, .xls, atau .csv
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
                <button
                  onClick={handleDownloadTemplate}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'white',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                  }}
                >
                  <Download size={16} />
                  Download Template
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === 'mapping' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>
                    File: {file?.name}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                    {excelData?.length || 0} rows ditemukan
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setStep('upload')}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    Ganti File
                  </button>
                </div>
              </div>

              {/* Mapping Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', fontWeight: 600, fontSize: '0.875rem' }}>
                    <div style={{ flex: 1 }}>Excel Column</div>
                    <div style={{ width: '24px', textAlign: 'center' }}></div>
                    <div style={{ flex: 1 }}>Map ke Field</div>
                    <div style={{ width: '100px', textAlign: 'center' }}>Tipe Data</div>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {columnMapping.map((mapping, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px 16px',
                        borderBottom: i < columnMapping.length - 1 ? '1px solid #f1f5f9' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: mapping.matched ? '#f0fdf4' : 'white',
                      }}
                    >
                      <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {mapping.excelColumn}
                      </div>
                      <ArrowRight size={16} style={{ color: '#94a3b8' }} />
                      <div style={{ flex: 1 }}>
                        <select
                          value={mappingConfig[mapping.excelColumn] || ''}
                          onChange={(e) => handleMappingChange(mapping.excelColumn, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            fontSize: '0.875rem',
                          }}
                        >
                          <option value="">-- Skip --</option>
                          {fields.map(f => (
                            <option key={f.name} value={f.name}>
                              {f.label || f.name} ({f.type})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ width: '100px', textAlign: 'center', fontSize: '0.75rem', color: mapping.matched ? '#059669' : '#94a3b8' }}>
                        {mapping.matched ? mapping.fieldType : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePreview}
                style={{
                  marginTop: '16px',
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Eye size={16} />
                Preview Data
              </button>
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 'preview' && (
            <div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#059669' }}>{validRecords.length}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#059669' }}>Valid Records</p>
                </div>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: errors.length > 0 ? '#fef2f2' : '#f8fafc', border: errors.length > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: errors.length > 0 ? '#dc2626' : '#64748b' }}>{errors.length}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: errors.length > 0 ? '#dc2626' : '#94a3b8' }}>Errors</p>
                </div>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#64748b' }}>{excelData?.length || 0}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Total Rows</p>
                </div>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ marginBottom: '8px', fontWeight: 600, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} />
                    Validation Errors ({Math.min(errors.length, 10)} shown):
                  </p>
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '12px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: '#991b1b',
                  }}>
                    {errors.slice(0, 10).map((err, i) => (
                      <div key={i} style={{ marginBottom: '4px' }}>• {err}</div>
                    ))}
                    {errors.length > 10 && (
                      <div style={{ marginTop: '8px', color: '#dc2626' }}>
                        ... dan {errors.length - 10} error lainnya
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {validRecords.length > 0 && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.875rem' }}>
                    Preview ({Math.min(validRecords.length, 5)} records pertama):
                  </div>
                  <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                    <table style={{ width: '100', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                      <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                        <tr>
                          {Object.keys(validRecords[0] || {}).map((key, i) => (
                            <th key={i} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {validRecords.slice(0, 5).map((record, i) => (
                          <tr key={i}>
                            {Object.values(record).map((val, j) => (
                              <td key={j} style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                {String(val).substring(0, 50)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => setStep('mapping')}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Kembali
                </button>
                <button
                  onClick={handleImport}
                  disabled={validRecords.length === 0}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: validRecords.length > 0 ? '#10b981' : '#e2e8f0',
                    color: validRecords.length > 0 ? 'white' : '#94a3b8',
                    cursor: validRecords.length > 0 ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  Import {validRecords.length} Records
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Importing */}
          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Loader2 size={48} style={{ color: '#10b981', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
                Mengimport data...
              </p>
              <p style={{ margin: '8px 0 0', color: '#64748b' }}>
                Mohon tunggu sebentar
              </p>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
