import React, { useState } from 'react';
import {
  Square, CheckCircle, AlertTriangle, ShieldCheck, Activity,
  Camera, QrCode, FileText, Check, X, ChevronRight, Search,
  Sliders, Layers, Play, Pause, RefreshCw, BarChart2, Eye
} from 'lucide-react';

/* ─── 1. MaviButton ─── */
export function MaviButton({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'emergency'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon = null,
  disabled = false,
  fullWidth = false,
  style = {},
  className = ''
}) {
  const baseBg = {
    primary: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
    secondary: '#1e293b',
    success: '#059669',
    danger: '#dc2626',
    warning: '#d97706',
    emergency: 'linear-gradient(135deg, #ef4444, #b91c1c)'
  }[variant] || '#2563eb';

  const pad = {
    sm: '6px 12px',
    md: '10px 18px',
    lg: '14px 26px'
  }[size] || '10px 18px';

  const fSize = {
    sm: '0.78rem',
    md: '0.88rem',
    lg: '1.05rem'
  }[size];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: baseBg,
        color: '#ffffff',
        border: variant === 'secondary' ? '1px solid #334155' : 'none',
        borderRadius: variant === 'emergency' ? '14px' : '10px',
        padding: pad,
        fontSize: fSize,
        fontWeight: variant === 'emergency' ? 800 : 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        boxShadow: variant === 'emergency' ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none',
        transition: 'all 0.15s ease',
        ...style
      }}
      className={className}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

/* ─── 2. MaviCard ─── */
export function MaviCard({
  title,
  subtitle,
  children,
  badge = null,
  badgeColor = '#38bdf8',
  actions = null,
  style = {}
}) {
  return (
    <div style={{
      backgroundColor: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: '14px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      ...style
    }}>
      {(title || subtitle || badge || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
          <div>
            {badge && (
              <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: badgeColor, backgroundColor: `${badgeColor}18`, padding: '2px 8px', borderRadius: '6px', marginBottom: '4px', display: 'inline-block' }}>
                {badge}
              </span>
            )}
            {title && <h3 style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>{title}</h3>}
            {subtitle && <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── 3. MaviKPI ─── */
export function MaviKPI({
  label,
  value,
  unit = '',
  status = 'neutral', // 'ok' | 'ng' | 'warning' | 'neutral'
  trend = null, // '+2.4%'
  icon = null
}) {
  const color = {
    ok: '#34d399',
    ng: '#f43f5e',
    warning: '#f59e0b',
    neutral: '#38bdf8'
  }[status] || '#38bdf8';

  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>{label}</span>
        {icon && <span style={{ color }}>{icon}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}</span>
        {unit && <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{unit}</span>}
      </div>
      {trend && (
        <span style={{ fontSize: '0.72rem', color: trend.startsWith('+') ? '#34d399' : '#f43f5e', fontWeight: 700 }}>
          {trend} dari target
        </span>
      )}
    </div>
  );
}

/* ─── 4. MaviStatus ─── */
export function MaviStatus({
  status = 'RUNNING', // 'RUNNING' | 'IDLE' | 'FAULT' | 'MAINTENANCE'
  label = null
}) {
  const cfg = {
    RUNNING: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: '#059669' },
    IDLE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: '#d97706' },
    FAULT: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: '#dc2626' },
    MAINTENANCE: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', border: '#7c3aed' }
  }[status.toUpperCase()] || { color: '#64748b', bg: '#1e293b', border: '#475569' };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 700,
      backgroundColor: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`
    }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.color }} />
      {label || status}
    </span>
  );
}

/* ─── 5. MaviChecklist ─── */
export function MaviChecklist({ items = [], onItemToggle, onComplete }) {
  const [list, setList] = useState(items);

  const toggle = (idx) => {
    const next = [...list];
    next[idx].checked = !next[idx].checked;
    setList(next);
    if (onItemToggle) onItemToggle(next[idx], idx);
  };

  const allDone = list.length > 0 && list.every(i => i.checked);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {list.map((item, idx) => (
        <div
          key={idx}
          onClick={() => toggle(idx)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: item.checked ? '#064e3b20' : '#0f172a',
            border: `1px solid ${item.checked ? '#05966960' : '#1e293b'}`,
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '20px', height: '20px', borderRadius: '6px',
            backgroundColor: item.checked ? '#059669' : '#1e293b',
            border: `1px solid ${item.checked ? '#059669' : '#475569'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {item.checked && <Check size={14} color="#fff" />}
          </div>
          <span style={{
            fontSize: '0.88rem',
            color: item.checked ? '#a7f3d0' : '#e2e8f0',
            textDecoration: item.checked ? 'line-through' : 'none',
            flex: 1
          }}>
            {item.label || item.text}
          </span>
        </div>
      ))}
      {onComplete && (
        <MaviButton
          disabled={!allDone}
          variant="success"
          onClick={() => onComplete(list)}
          style={{ marginTop: '8px' }}
        >
          Konfirmasi Selesai Checksheet
        </MaviButton>
      )}
    </div>
  );
}

/* ─── 6. MaviInspection ─── */
export function MaviInspection({
  parameterName = 'Ketebalan Sheet (mm)',
  standardValue = 12.0,
  tolerance = 0.5,
  onRecord
}) {
  const [measuredValue, setMeasuredValue] = useState('');
  const [result, setResult] = useState(null); // 'PASS' | 'FAIL'

  const valNum = parseFloat(measuredValue);
  const min = standardValue - tolerance;
  const max = standardValue + tolerance;

  const handleEvaluate = () => {
    if (isNaN(valNum)) return;
    const pass = valNum >= min && valNum <= max;
    const res = pass ? 'PASS' : 'FAIL';
    setResult(res);
    if (onRecord) onRecord({ parameterName, standardValue, tolerance, measuredValue: valNum, result: res });
  };

  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>{parameterName}</h4>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Std: {standardValue} ± {tolerance} ({min} - {max})</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="number"
          step="0.01"
          placeholder="Nilai Aktual..."
          value={measuredValue}
          onChange={e => { setMeasuredValue(e.target.value); setResult(null); }}
          style={{
            flex: 1, backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px',
            padding: '10px 14px', color: '#fff', fontSize: '0.9rem', outline: 'none'
          }}
        />
        <MaviButton variant="primary" onClick={handleEvaluate}>Periksa</MaviButton>
      </div>
      {result && (
        <div style={{
          marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
          backgroundColor: result === 'PASS' ? '#064e3b30' : '#7f1d1d30',
          border: `1px solid ${result === 'PASS' ? '#059669' : '#dc2626'}`,
          color: result === 'PASS' ? '#34d399' : '#f87171',
          fontWeight: 700, fontSize: '0.85rem'
        }}>
          Hasil Inspeksi: {result === 'PASS' ? '✅ MEMENUHI STANDAR (PASS)' : '❌ MELEBIHI TOLERANSI (FAIL)'}
        </div>
      )}
    </div>
  );
}

/* ─── 7. MaviDataTable ─── */
export function MaviDataTable({ columns = [], data = [], title = 'Tabel Data' }) {
  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
      {title && (
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e293b', fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>
          {title}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#020617', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
              {columns.map((c, i) => (
                <th key={i} style={{ padding: '10px 14px', fontWeight: 600 }}>{c.header || c.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  Tidak ada data tersimpan
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#e2e8f0' }}>
                  {columns.map((c, cIdx) => (
                    <td key={cIdx} style={{ padding: '10px 14px' }}>
                      {String(row[c.accessor || c.name] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── 8. MaviDialog ─── */
export function MaviDialog({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── 9. MaviForm ─── */
export function MaviForm({ children, onSubmit }) {
  return (
    <form onSubmit={e => { e.preventDefault(); if (onSubmit) onSubmit(e); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {children}
    </form>
  );
}

/* ─── 10. MaviSidebar & MaviHeader ─── */
export function MaviHeader({ title = 'MaviCore Industrial Portal', user = 'Operator A1' }) {
  return (
    <header style={{ height: '54px', backgroundColor: '#0a0f1d', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
        <Activity size={18} color="#38bdf8" />
        <span>{title}</span>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>👤 {user}</div>
    </header>
  );
}

export function MaviSidebar({ items = [], activeIndex = 0, onSelect }) {
  return (
    <aside style={{ width: '220px', backgroundColor: '#070b14', borderRight: '1px solid #1e293b', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {items.map((item, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect && onSelect(idx)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px',
            backgroundColor: activeIndex === idx ? '#1e293b' : 'transparent',
            color: activeIndex === idx ? '#38bdf8' : '#94a3b8',
            border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600
          }}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </aside>
  );
}

/* ─── 11. MaviDashboard ─── */
export function MaviDashboard({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
      {children}
    </div>
  );
}

/* ─── 12. MaviApproval ─── */
export function MaviApproval({ title = 'Persetujuan Supervisor', onApprove, onReject }) {
  const [approved, setApproved] = useState(false);
  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '18px' }}>
      <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', color: '#f8fafc' }}>{title}</h4>
      <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: '#94a3b8' }}>Konfirmasi otorisasi oleh supervisor lini sebelum melanjutkan batch.</p>
      {approved ? (
        <div style={{ padding: '8px 12px', backgroundColor: '#064e3b30', border: '1px solid #059669', borderRadius: '8px', color: '#34d399', fontSize: '0.8rem', fontWeight: 700 }}>
          ✅ Batch telah disetujui
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px' }}>
          <MaviButton variant="success" onClick={() => { setApproved(true); if (onApprove) onApprove(); }}>Setujui (Approve)</MaviButton>
          <MaviButton variant="danger" onClick={() => { setApproved(false); if (onReject) onReject(); }}>Tolak (Reject)</MaviButton>
        </div>
      )}
    </div>
  );
}

/* ─── 13. MaviReport ─── */
export function MaviReport({ title = 'Laporan Shift Produksi', summary = {} }) {
  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '20px' }}>
      <h3 style={{ margin: '0 0 14px', color: '#fff', fontSize: '1rem' }}>📄 {title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1' }}>
        {Object.entries(summary).map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>{k}</span>
            <span style={{ fontWeight: 700 }}>{String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 14. MaviCamera ─── */
export function MaviCamera({ onCapture }) {
  return (
    <div style={{ padding: '18px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', textAlign: 'center' }}>
      <Camera size={32} color="#38bdf8" style={{ margin: '0 auto 8px' }} />
      <h4 style={{ margin: '0 0 6px', color: '#fff', fontSize: '0.9rem' }}>Ambil Foto Bukti Defect</h4>
      <MaviButton variant="primary" size="sm" onClick={() => onCapture && onCapture('simulated_photo_url')}>Ambil Foto</MaviButton>
    </div>
  );
}

/* ─── 15. MaviBarcode ─── */
export function MaviBarcode({ onScan }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ padding: '18px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <QrCode size={20} color="#38bdf8" />
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>Barcode / QR Scanner</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Scan barcode / masukkan kode..."
          value={val}
          onChange={e => setVal(e.target.value)}
          style={{ flex: 1, backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
        />
        <MaviButton size="sm" onClick={() => { if (onScan) onScan(val || 'PART-SAMPLE-101'); }}>Scan</MaviButton>
      </div>
    </div>
  );
}
