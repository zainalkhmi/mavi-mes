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

export function MaviCard({ title, subtitle, children, badge = null, badgeColor = '#38bdf8', actions = null, style = {} }) {
  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '20px', ...style }}>
      {(title || subtitle || badge || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
          <div>
            {badge && <span style={{ fontSize: '0.65rem', fontWeight: 800, color: badgeColor, backgroundColor: \`\${badgeColor}18\`, padding: '2px 8px', borderRadius: '6px' }}>{badge}</span>}
            {title && <h3 style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>{title}</h3>}
            {subtitle && <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function MaviKPI({ label, value, unit = '', status = 'neutral', trend = null, icon = null }) {
  const color = { ok: '#34d399', ng: '#f43f5e', warning: '#f59e0b', neutral: '#38bdf8' }[status] || '#38bdf8';
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
      {trend && <span style={{ fontSize: '0.72rem', color: trend.startsWith('+') ? '#34d399' : '#f43f5e', fontWeight: 700 }}>{trend}</span>}
    </div>
  );
}

export function MaviStatus({ status = 'RUNNING', label = null }) {
  const cfg = {
    RUNNING: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: '#059669' },
    IDLE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: '#d97706' },
    FAULT: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: '#dc2626' }
  }[status.toUpperCase()] || { color: '#64748b', bg: '#1e293b', border: '#475569' };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: cfg.bg, color: cfg.color, border: \`1px solid \${cfg.border}\` }}>
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
        <div key={idx} onClick={() => toggle(idx)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: item.checked ? '#064e3b20' : '#0f172a', border: \`1px solid \${item.checked ? '#05966960' : '#1e293b'}\`, borderRadius: '10px', cursor: 'pointer' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '6px', backgroundColor: item.checked ? '#059669' : '#1e293b', border: \`1px solid \${item.checked ? '#059669' : '#475569'}\`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.checked && <Check size={14} color="#fff" />}
          </div>
          <span style={{ fontSize: '0.88rem', color: item.checked ? '#a7f3d0' : '#e2e8f0', textDecoration: item.checked ? 'line-through' : 'none' }}>{item.label || item.text}</span>
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
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>{parameterName}</h4>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Std: {standardValue} ± {tolerance}</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input type="number" step="0.01" placeholder="Nilai aktual..." value={measuredValue} onChange={e => { setMeasuredValue(e.target.value); setResult(null); }} style={{ flex: 1, backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', color: '#fff' }} />
        <MaviButton variant="primary" onClick={handleEvaluate}>Periksa</MaviButton>
      </div>
      {result && <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', backgroundColor: result === 'PASS' ? '#064e3b30' : '#7f1d1d30', border: \`1px solid \${result === 'PASS' ? '#059669' : '#dc2626'}\`, color: result === 'PASS' ? '#34d399' : '#f87171', fontWeight: 700 }}>Hasil: {result === 'PASS' ? '✅ PASS' : '❌ FAIL'}</div>}
    </div>
  );
}

export function MaviDataTable({ columns = [], data = [], title = 'Tabel Data' }) {
  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
      {title && <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e293b', fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>{title}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#020617', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
              {columns.map((c, i) => <th key={i} style={{ padding: '10px 14px' }}>{c.header || c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Belum ada data</td></tr>
            ) : data.map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#e2e8f0' }}>
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
