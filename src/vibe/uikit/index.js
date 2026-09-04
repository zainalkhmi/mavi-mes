export * from './MaviComponents';

// Virtual code representation injected into Sandpack/WebContainer projects
export const MAVICORE_UIKIT_VIRTUAL_FILE = `import React, { useState } from 'react';
import {
  Square, CheckCircle, AlertTriangle, ShieldCheck, Activity,
  Camera, QrCode, FileText, Check, X, ChevronRight, Search,
  Sliders, Layers, Play, Pause, RefreshCw, BarChart2, Eye
} from 'lucide-react';

export function MaviButton({ children, onClick, variant = 'primary', size = 'md', icon = null, disabled = false, fullWidth = false, style = {} }) {
  const baseBg = {
    primary: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
    secondary: '#1e293b',
    success: '#059669',
    danger: '#dc2626',
    warning: '#d97706',
    emergency: 'linear-gradient(135deg, #ef4444, #b91c1c)'
  }[variant] || '#2563eb';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: baseBg, color: '#ffffff',
        border: variant === 'secondary' ? '1px solid #334155' : 'none',
        borderRadius: variant === 'emergency' ? '14px' : '10px',
        padding: size === 'sm' ? '6px 12px' : (size === 'lg' ? '14px 26px' : '10px 18px'),
        fontSize: size === 'sm' ? '0.78rem' : (size === 'lg' ? '1.05rem' : '0.88rem'),
        fontWeight: variant === 'emergency' ? 800 : 600,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto', ...style
      }}
    >
      {icon}{children}
    </button>
  );
}

export function MaviCard({ title, subtitle, children, badge = null, badgeColor = '#0284c7', actions = null, style = {} }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', ...style }}>
      {(title || subtitle || badge || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
          <div>
            {badge && <span style={{ fontSize: '0.65rem', fontWeight: 800, color: badgeColor, backgroundColor: `${badgeColor}15`, padding: '2px 8px', borderRadius: '6px' }}>{badge}</span>}
            {title && <h3 style={{ margin: '4px 0 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>}
            {subtitle && <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function MaviKPI({ label, value, unit = '', status = 'neutral', trend = null, icon = null }) {
  const color = { ok: '#059669', ng: '#e11d48', warning: '#d97706', neutral: '#0284c7' }[status] || '#0284c7';
  const iconBg = { ok: '#d1fae5', ng: '#ffe4e6', warning: '#fef3c7', neutral: '#e0f2fe' }[status] || '#e0f2fe';
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        {icon && <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>{value}</span>
        {unit && <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{unit}</span>}
      </div>
      {trend && <span style={{ fontSize: '0.72rem', color: trend.startsWith('+') ? '#059669' : '#e11d48', fontWeight: 700 }}>{trend}</span>}
    </div>
  );
}

export function MaviStatus({ status = 'RUNNING', label = null }) {
  const cfg = {
    RUNNING: { color: '#059669', bg: '#d1fae5', border: '#86efac' },
    IDLE: { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
    FAULT: { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' }
  }[status.toUpperCase()] || { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.color }} />
      {label || status}
    </span>
  );
}

export function MaviChecklist({ items = [], onItemToggle }) {
  const [list, setList] = useState(items);
  const toggle = (idx) => {
    const next = [...list];
    next[idx].checked = !next[idx].checked;
    setList(next);
    if (onItemToggle) onItemToggle(next[idx], idx);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {list.map((item, idx) => (
        <div key={idx} onClick={() => toggle(idx)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: item.checked ? '#f0fdf4' : '#ffffff', border: `1px solid ${item.checked ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '12px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '6px', backgroundColor: item.checked ? '#10b981' : '#f8fafc', border: `1px solid ${item.checked ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.checked && <Check size={14} color="#fff" />}
          </div>
          <span style={{ fontSize: '0.88rem', color: item.checked ? '#15803d' : '#0f172a', textDecoration: item.checked ? 'line-through' : 'none', fontWeight: item.checked ? 600 : 500 }}>{item.label || item.text}</span>
        </div>
      ))}
    </div>
  );
}

export function MaviInspection({ parameterName = 'Toleransi Dimensi (mm)', standardValue = 10.0, tolerance = 0.5, onRecord }) {
  const [measuredValue, setMeasuredValue] = useState('');
  const [result, setResult] = useState(null);
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
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>{parameterName}</h4>
        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Std: {standardValue} ± {tolerance}</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input type="number" step="0.01" placeholder="Nilai aktual..." value={measuredValue} onChange={e => { setMeasuredValue(e.target.value); setResult(null); }} style={{ flex: 1, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', color: '#0f172a', outline: 'none' }} />
        <MaviButton variant="primary" onClick={handleEvaluate}>Periksa</MaviButton>
      </div>
      {result && <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', backgroundColor: result === 'PASS' ? '#dcfce7' : '#fee2e2', border: `1px solid ${result === 'PASS' ? '#86efac' : '#fca5a5'}`, color: result === 'PASS' ? '#15803d' : '#b91c1c', fontWeight: 700 }}>Hasil: {result === 'PASS' ? '✅ PASS' : '❌ FAIL'}</div>}
    </div>
  );
}

export function MaviDataTable({ columns = [], data = [], title = 'Tabel Data' }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}>
      {title && <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{title}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
              {columns.map((c, i) => <th key={i} style={{ padding: '10px 14px', fontWeight: 600 }}>{c.header || c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Belum ada data</td></tr>
            ) : data.map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                {columns.map((c, cIdx) => <td key={cIdx} style={{ padding: '10px 14px' }}>{String(row[c.accessor || c.name] ?? '')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;
