/**
 * ExcelExportButton.jsx
 * Export table data to Excel with dropdown options
 */

import React, { useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToExcel, exportTableToExcel, generateExcelTemplate } from '../utils/excelUtils';

export default function ExcelExportButton({
  tableName,
  records = [],
  fields = [],
  variant = 'outline', // 'outline' | 'solid' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  showIcon = true,
  showLabel = true,
  className = '',
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const sizeConfig = {
    sm: { padding: '6px 12px', fontSize: '0.75rem', iconSize: 14 },
    md: { padding: '8px 16px', fontSize: '0.875rem', iconSize: 16 },
    lg: { padding: '12px 24px', fontSize: '1rem', iconSize: 20 },
  };

  const variantStyles = {
    outline: {
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      color: '#475569',
    },
    solid: {
      backgroundColor: '#10b981',
      border: 'none',
      color: 'white',
    },
    ghost: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#64748b',
    },
  };

  const config = sizeConfig[size] || sizeConfig.md;
  const styles = variantStyles[variant] || variantStyles.outline;

  const handleExport = async (format) => {
    setShowMenu(false);
    setIsExporting(true);

    try {
      if (format === 'template') {
        generateExcelTemplate({ name: tableName, fields }, `${tableName}_template.xlsx`);
        toast.success('Template downloaded!');
        return;
      }

      if (format === 'csv') {
        exportToExcel(records, `${tableName}_export.csv`, { format: 'csv', sheetName: tableName });
        toast.success(`Exported ${records.length} records as CSV!`);
        return;
      }

      // Default: xlsx with formatting
      await exportTableToExcel(tableName, records, fields, { filename: `${tableName}_export.xlsx` });
      toast.success(`Exported ${records.length} records!`);
    } catch (err) {
      console.error('Export error:', err);
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
          ...styles,
          padding: config.padding,
          borderRadius: '8px',
          fontSize: config.fontSize,
          cursor: isExporting || records.length === 0 ? 'not-allowed' : 'pointer',
          opacity: records.length === 0 ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          ...styles,
        }}
        className={className}
      >
        {isExporting ? (
          <Loader2 size={config.iconSize} style={{ animation: 'spin 1s linear infinite' }} />
        ) : showIcon ? (
          <Download size={config.iconSize} />
        ) : null}
        {showLabel && (
          <span>{variant === 'solid' ? 'Export Excel' : 'Export'}</span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setShowMenu(false)}
          />
          {/* Menu */}
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            zIndex: 1000,
            minWidth: '200px',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '8px' }}>
              <p style={{ margin: 0, padding: '8px 12px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Export Options
              </p>

              <button
                onClick={() => handleExport('xlsx')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FileSpreadsheet size={16} style={{ color: '#10b981' }} />
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>Excel (.xlsx)</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Full formatting</div>
                </div>
                <Check size={14} style={{ color: '#10b981' }} />
              </button>

              <button
                onClick={() => handleExport('csv')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Download size={16} style={{ color: '#64748b' }} />
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>CSV (.csv)</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Plain text format</div>
                </div>
              </button>

              <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '8px 0' }} />

              <button
                onClick={() => handleExport('template')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Download size={16} style={{ color: '#3b82f6' }} />
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>Download Template</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Empty template to fill</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
