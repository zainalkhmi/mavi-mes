/**
 * ExcelExportButton.jsx
 * Export table data to Excel with dropdown options
 */

import React, { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToExcel, exportTableToExcel, generateExcelTemplate } from '../utils/excelUtils';

export default function ExcelExportButton({ tableName, records = [], fields = [] }) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format) => {
    setShowMenu(false);
    setIsExporting(true);
    try {
      if (format === 'template') {
        generateExcelTemplate({ name: tableName, fields });
        toast.success('Template downloaded!');
        return;
      }
      if (format === 'csv') {
        exportToExcel(records, tableName + '_export.csv', { format: 'csv' });
        toast.success('Exported as CSV!');
        return;
      }
      await exportTableToExcel(tableName, records, fields);
      toast.success('Exported ' + records.length + ' records!');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting || records.length === 0}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          background: 'white',
          cursor: records.length === 0 ? 'not-allowed' : 'pointer',
          opacity: records.length === 0 ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 600,
          fontSize: '0.875rem',
        }}
      >
        <Download size={16} />
        <span>Export</span>
      </button>

      {showMenu && (
        <>
          <div
            onClick={() => setShowMenu(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: 0,
              background: 'white',
              borderRadius: 12,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.0.1)',
              minWidth: 200,
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 8 }}>
              <p style={{ margin: 0, padding: '8px 12px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Export Options
              </p>
              <button
                onClick={() => handleExport('xlsx')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: 8,
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <FileSpreadsheet size={16} style={{ color: '#10b981' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>Excel (.xlsx)</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Full formatting</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('csv')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: 8,
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Download size={16} style={{ color: '#64748b' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600 }}>CSV (.csv)</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Plain text format</div>
                  </div>
                </div>
              </button>

              <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }} />

              <button
                onClick={() => handleExport('template')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Download size={16} style={{ color: '#3b82f6' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>Download Template</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Empty template to fill</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
