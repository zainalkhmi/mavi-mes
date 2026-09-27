import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet, Upload, Globe, Check, AlertCircle, RefreshCw, X, ArrowRight,
  Database, Table, Sparkles, Layers, Hash, Calendar, CheckSquare, Type, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { parseSpreadsheetFile, fetchPublishedGoogleSheet, GOOGLE_APPS_SCRIPT_TEMPLATE } from '../utils/googleSheetsSync';
import { createTable, addTableRecord } from '../utils/supabaseTablesDB';

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number (Decimal)', icon: Hash },
  { value: 'integer', label: 'Integer', icon: Hash },
  { value: 'datetime', label: 'Datetime', icon: Calendar },
  { value: 'boolean', label: 'Boolean (Yes/No)', icon: CheckSquare }
];

export default function SpreadsheetToTableModal({ isOpen, onClose, onTableCreated, onOpenAppGenerator }) {
  const [sourceMode, setSourceMode] = useState('FILE'); // 'FILE' | 'GOOGLE_SHEET'
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  // Spreadsheet Data State
  const [parsedData, setParsedData] = useState(null);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [tableName, setTableName] = useState('');
  const [tableDescription, setTableDescription] = useState('');
  const [columns, setColumns] = useState([]);
  const [idColumn, setIdColumn] = useState('__AUTO__');
  
  // Google Sheet Link State
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [showScriptModal, setShowScriptModal] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const currentSheet = parsedData?.sheets?.[selectedSheetIndex] || null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await parseSpreadsheetFile(file);
      setParsedData(result);
      setSelectedSheetIndex(0);
      
      const sheet = result.sheets[0];
      if (sheet) {
        setTableName(sheet.sheetName !== 'Sheet1' ? sheet.sheetName : file.name.replace(/\.[^/.]+$/, ''));
        setTableDescription(`Imported from ${file.name} (${sheet.sheetName})`);
        setColumns(sheet.fields);
      }
      toast.success(`Berhasil membaca file: ${result.sheets.length} sheet ditemukan!`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal membaca spreadsheet');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchGoogleSheet = async () => {
    if (!googleSheetUrl.trim()) {
      toast.error('Masukkan link Google Sheet atau Published CSV URL');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchPublishedGoogleSheet(googleSheetUrl);
      const fakeSheet = {
        sheetName: 'GoogleSheet_Data',
        headers: result.headers,
        fields: result.fields,
        records: result.records,
        rowCount: result.rowCount
      };

      setParsedData({
        fileName: 'Google Spreadsheet',
        sheets: [fakeSheet],
        defaultSheet: fakeSheet
      });
      setSelectedSheetIndex(0);
      setTableName('GoogleSheet_Import');
      setTableDescription('Live synced from Google Sheets');
      setColumns(result.fields);
      toast.success(`Berhasil mengambil ${result.rowCount} baris dari Google Sheet!`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal mengambil data dari Google Sheets. Pastikan sheet dipublikasikan sebagai CSV (File > Share > Publish to web).');
    } finally {
      setLoading(false);
    }
  };

  const handleSheetSelect = (index) => {
    setSelectedSheetIndex(index);
    const sheet = parsedData.sheets[index];
    if (sheet) {
      setTableName(sheet.sheetName);
      setTableDescription(`Imported from ${parsedData.fileName} (${sheet.sheetName})`);
      setColumns(sheet.fields);
    }
  };

  const handleColumnTypeChange = (colIndex, newType) => {
    const next = [...columns];
    next[colIndex].type = newType;
    setColumns(next);
  };

  const handleColumnNameChange = (colIndex, newName) => {
    const next = [...columns];
    next[colIndex].name = newName.replace(/[^a-zA-Z0-9_ ]/g, '').trim();
    setColumns(next);
  };

  const handleCreateAndImport = async () => {
    if (!tableName.trim()) {
      toast.error('Nama tabel wajib diisi');
      return;
    }

    if (!currentSheet || !currentSheet.records || currentSheet.records.length === 0) {
      toast.error('Tidak ada data untuk diimport');
      return;
    }

    setImporting(true);
    const total = currentSheet.records.length;
    setImportProgress({ current: 0, total });

    try {
      // 1. Create table in Supabase / Local Table DB
      const tableFields = columns.map(c => ({
        name: c.name,
        type: c.type,
        label: c.label || c.name,
        archived: false
      }));

      const newTable = await createTable({
        name: tableName.trim(),
        description: tableDescription.trim(),
        fields: tableFields
      });

      if (!newTable || !newTable.id) {
        throw new Error('Gagal membuat skema tabel baru');
      }

      // 2. Import records in batches
      const records = currentSheet.records;
      const batchSize = 25;
      
      for (let i = 0; i < records.length; i += batchSize) {
        const chunk = records.slice(i, i + batchSize);
        await Promise.all(chunk.map((row, chunkIdx) => {
          const rowIdx = i + chunkIdx;
          const recordData = {};

          // Map original spreadsheet header to cleaned field name
          columns.forEach(col => {
            let val = row[col.originalHeader];
            if (col.type === 'number' || col.type === 'integer') {
              val = Number(String(val ?? '').replace(/[,$\s%]/g, '')) || 0;
            } else if (col.type === 'boolean') {
              val = ['true', 'yes', '1'].includes(String(val ?? '').toLowerCase().trim());
            }
            recordData[col.name] = val;
          });

          // Determine recordId
          let recId = `REC_${String(rowIdx + 1).padStart(4, '0')}`;
          if (idColumn !== '__AUTO__' && row[idColumn]) {
            recId = String(row[idColumn]).trim();
          }

          recordData.recordId = recId;
          return addTableRecord(newTable.id, recordData);
        }));

        setImportProgress({ current: Math.min(i + batchSize, total), total });
      }

      toast.success(`🎉 Berhasil membuat tabel "${newTable.name}" dengan ${total} record!`);
      
      if (onTableCreated) {
        await onTableCreated(newTable.id);
      }

      onClose();

      // Offer to generate App instantly
      if (onOpenAppGenerator) {
        setTimeout(() => {
          if (confirm(`Tabel "${newTable.name}" berhasil dibuat dari Spreadsheet!\n\nApakah ingin langsung men-generate MAVI App (Form & Grid) untuk tabel ini seperti AppSheet?`)) {
            onOpenAppGenerator(newTable);
          }
        }, 300);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Terjadi kesalahan saat membuat tabel');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000, backdropFilter: 'blur(10px)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '980px', maxHeight: '92vh', backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>New Table from Spreadsheet</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>AppSheet Model</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                Buat tabel MES secara instan dari file Excel (.xlsx), CSV, atau Live Google Sheet.
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '10px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Source Switcher Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', padding: '8px 32px 0', gap: '8px' }}>
          <button
            onClick={() => setSourceMode('FILE')}
            style={{
              padding: '10px 18px',
              border: 'none',
              backgroundColor: sourceMode === 'FILE' ? '#ffffff' : 'transparent',
              color: sourceMode === 'FILE' ? '#0f172a' : '#64748b',
              fontWeight: 800,
              fontSize: '0.88rem',
              borderRadius: '10px 10px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: sourceMode === 'FILE' ? '0 -2px 6px rgba(0,0,0,0.03)' : 'none'
            }}
          >
            <Upload size={16} color={sourceMode === 'FILE' ? '#10b981' : '#64748b'} />
            Upload File Excel / CSV
          </button>
          <button
            onClick={() => setSourceMode('GOOGLE_SHEET')}
            style={{
              padding: '10px 18px',
              border: 'none',
              backgroundColor: sourceMode === 'GOOGLE_SHEET' ? '#ffffff' : 'transparent',
              color: sourceMode === 'GOOGLE_SHEET' ? '#0f172a' : '#64748b',
              fontWeight: 800,
              fontSize: '0.88rem',
              borderRadius: '10px 10px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: sourceMode === 'GOOGLE_SHEET' ? '0 -2px 6px rgba(0,0,0,0.03)' : 'none'
            }}
          >
            <Globe size={16} color={sourceMode === 'GOOGLE_SHEET' ? '#10b981' : '#64748b'} />
            Google Sheets Live Sync
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* STEP 1: Input Area */}
          {!parsedData ? (
            <div>
              {sourceMode === 'FILE' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '18px',
                    padding: '48px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10b981' }}>
                    <Upload size={28} />
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                    {loading ? 'Membaca dan memproses struktur spreadsheet...' : 'Pilih atau Drag & Drop file Excel / CSV di sini'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
                    Mendukung format .xlsx, .xls, dan .csv dengan multi-sheet otomatis.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', borderRadius: '18px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>
                      Google Sheets Link / Published Web URL
                    </label>
                    <button
                      onClick={() => setShowScriptModal(true)}
                      style={{ border: 'none', background: 'none', color: '#10b981', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Lihat Script 2-Way Live Sync
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      value={googleSheetUrl}
                      onChange={(e) => setGoogleSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit..."
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                    />
                    <button
                      onClick={handleFetchGoogleSheet}
                      disabled={loading}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      Fetch Data
                    </button>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                    💡 <b>Cara menghubungkan Google Sheet:</b> Di Google Sheet Anda, klik <b>File &gt; Share &gt; Publish to web</b>, pilih format <b>Comma-separated values (.csv)</b>, lalu salin link-nya ke sini.
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: Schema Configuration & Preview Area */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* File / Sheet Info Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderRadius: '14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Check size={18} color="#16a34a" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#166534' }}>
                    File: {parsedData.fileName} • Total: {currentSheet?.rowCount || 0} Baris
                  </span>
                </div>
                <button
                  onClick={() => { setParsedData(null); setColumns([]); }}
                  style={{ border: 'none', background: 'none', color: '#dc2626', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Ganti File / Sumber
                </button>
              </div>

              {/* Multi-Sheet Selector if applicable */}
              {parsedData.sheets && parsedData.sheets.length > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Pilih Sheet / Tab untuk Dijadikan Tabel
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {parsedData.sheets.map((sheet, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSheetSelect(sIdx)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: selectedSheetIndex === sIdx ? '2px solid #10b981' : '1px solid #cbd5e1',
                          backgroundColor: selectedSheetIndex === sIdx ? '#ecfdf5' : '#ffffff',
                          color: selectedSheetIndex === sIdx ? '#065f46' : '#475569',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        {sheet.sheetName} ({sheet.rowCount} rows)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Table Name & Description */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                    Nama Tabel Baru
                  </label>
                  <input
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="Nama tabel di MAVI MES..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                    Kolom Primary Key / Record ID
                  </label>
                  <select
                    value={idColumn}
                    onChange={(e) => setIdColumn(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    <option value="__AUTO__">Auto-generate (REC_0001, REC_0002...)</option>
                    {columns.map((c, idx) => (
                      <option key={idx} value={c.originalHeader}>{c.name} ({c.originalHeader})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Column Schema Mapping Table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>
                    Prediksi Tipe Kolom &amp; Field ({columns.length} Fields)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Otomatis terdeteksi berdasarkan data baris spreadsheet
                  </span>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', maxHeight: '240px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                        <th style={{ padding: '10px 16px', fontWeight: 700 }}>Header Asli Excel</th>
                        <th style={{ padding: '10px 16px', fontWeight: 700 }}>Nama Field MAVI</th>
                        <th style={{ padding: '10px 16px', fontWeight: 700 }}>Tipe Data</th>
                        <th style={{ padding: '10px 16px', fontWeight: 700 }}>Contoh Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col, idx) => {
                        const sample = currentSheet?.records?.[0]?.[col.originalHeader] ?? '';
                        return (
                          <tr key={idx} style={{ borderBottom: idx === columns.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 16px', color: '#64748b', fontWeight: 600 }}>{col.originalHeader}</td>
                            <td style={{ padding: '10px 16px' }}>
                              <input
                                value={col.name}
                                onChange={(e) => handleColumnNameChange(idx, e.target.value)}
                                style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                              />
                            </td>
                            <td style={{ padding: '10px 16px' }}>
                              <select
                                value={col.type}
                                onChange={(e) => handleColumnTypeChange(idx, e.target.value)}
                                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', backgroundColor: '#ffffff', fontWeight: 700 }}
                              >
                                {FIELD_TYPES.map(ft => (
                                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '10px 16px', color: '#0f172a', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {String(sample)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Preview (First 4 rows) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                  Preview Data Baris (4 baris pertama)
                </label>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto', backgroundColor: '#fcfcfc' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        {columns.slice(0, 7).map((col, idx) => (
                          <th key={idx} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 800, color: '#475569' }}>
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(currentSheet?.records || []).slice(0, 4).map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {columns.slice(0, 7).map((col, cIdx) => (
                            <td key={cIdx} style={{ padding: '8px 12px', color: '#1e293b', whiteSpace: 'nowrap' }}>
                              {String(row[col.originalHeader] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '20px 32px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {importing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>
                <RefreshCw size={16} className="animate-spin" />
                Mengimport {importProgress.current} dari {importProgress.total} baris...
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              disabled={importing}
              style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
            >
              Batal
            </button>
            {parsedData && (
              <button
                onClick={handleCreateAndImport}
                disabled={importing}
                style={{
                  padding: '10px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Database size={16} />
                {importing ? 'Memproses...' : 'Buat Tabel & Import Data'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Script Modal for 2-Way Google Apps Script */}
      {showScriptModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 7000 }}>
          <div style={{ width: '600px', backgroundColor: 'white', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Google Apps Script (Two-Way Sync)</div>
              <button onClick={() => setShowScriptModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Salin kode ini ke Google Sheets: <b>Extensions &gt; Apps Script</b>. Deploy sebagai Web App agar MAVI MES bisa menulis dan membaca data realtime.
            </div>
            <textarea
              readOnly
              value={GOOGLE_APPS_SCRIPT_TEMPLATE}
              rows={12}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.78rem', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
                  toast.success('Script berhasil disalin ke clipboard!');
                }}
                style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 800, cursor: 'pointer' }}
              >
                Salin Script
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
