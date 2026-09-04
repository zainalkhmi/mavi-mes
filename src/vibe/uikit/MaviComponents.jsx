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

/* ─── 16. MaviNumpad ─── */
export function MaviNumpad({ onConfirm, onCancel, initialValue = '', maxLength = 10, title = 'Input Angka' }) {
  const [value, setValue] = useState(initialValue);

  const handleKey = (key) => {
    if (key === 'DEL') { setValue(v => v.slice(0, -1)); return; }
    if (key === 'CLR') { setValue(''); return; }
    if (value.length < maxLength) setValue(v => v + key);
  };

  const keys = ['7','8','9','4','5','6','1','2','3','.','0','DEL'];

  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '18px' }}>
      {title && <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#f8fafc' }}>{title}</h4>}
      <div style={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '10px', padding: '14px', marginBottom: '12px', textAlign: 'right' }}>
        <span style={{ fontSize: value.length > 8 ? '1.6rem' : '2.2rem', fontWeight: 800, color: '#38bdf8', fontVariantNumeric: 'tabular-nums' }}>
          {value || '0'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {keys.map(k => (
          <button key={k} type="button" onClick={() => handleKey(k)} style={{
            padding: '14px 0', borderRadius: '10px', border: 'none', fontSize: '1.1rem', fontWeight: 700,
            backgroundColor: k === 'DEL' ? '#dc2626' : '#1e293b', color: '#fff', cursor: 'pointer',
            transition: 'all 0.1s'
          }}>{k}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        {onCancel && <MaviButton variant="secondary" fullWidth onClick={() => onCancel()}>Batal</MaviButton>}
        <MaviButton variant="success" fullWidth onClick={() => onConfirm && onConfirm(value)}>Konfirmasi</MaviButton>
      </div>
    </div>
  );
}

/* ─── 17. MaviTimer ─── */
export function MaviTimer({ targetSeconds = 60, onTargetReached, showMilliseconds = false, label = 'Cycle Time' }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = React.useRef(null);

  React.useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 10), 10);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  React.useEffect(() => {
    if (targetSeconds && elapsed / 1000 >= targetSeconds && onTargetReached) {
      onTargetReached(elapsed);
    }
  }, [elapsed, targetSeconds]);

  const format = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const milli = Math.floor((ms % 1000) / 10);
    if (showMilliseconds) return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milli).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const ratio = targetSeconds ? Math.min(1, elapsed / (targetSeconds * 1000)) : 0;
  const isOverTarget = targetSeconds && elapsed / 1000 > targetSeconds;

  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
      {label && <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>{label}</div>}
      <div style={{ fontSize: '2.8rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: isOverTarget ? '#f87171' : '#38bdf8', marginBottom: '12px' }}>
        {format(elapsed)}
      </div>
      {targetSeconds > 0 && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '6px', height: '6px', marginBottom: '12px', overflow: 'hidden' }}>
          <div style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: isOverTarget ? '#ef4444' : '#38bdf8', borderRadius: '6px', transition: 'width 0.1s' }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <MaviButton variant={running ? 'warning' : 'success'} size="sm" onClick={() => setRunning(r => !r)}>
          {running ? 'Pause' : 'Start'}
        </MaviButton>
        <MaviButton variant="secondary" size="sm" onClick={() => { setRunning(false); setElapsed(0); }}>
          Reset
        </MaviButton>
      </div>
    </div>
  );
}

/* ─── 18. MaviGauge ─── */
export function MaviGauge({ value = 0, max = 100, label = 'OEE', unit = '%', size = 140, status = 'neutral' }) {
  const color = { ok: '#34d399', ng: '#f43f5e', warning: '#f59e0b', neutral: '#38bdf8' }[status] || '#38bdf8';
  const pct = Math.min(1, Math.max(0, value / max));
  const radius = (size - 16) / 2;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        <path d={`M 8 ${size / 2 + 8} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 8}`} fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        <path d={`M 8 ${size / 2 + 8} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 8}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={dashOffset} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <div style={{ marginTop: '-20px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{typeof value === 'number' ? value.toFixed(1) : value}{unit}</div>
      </div>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginTop: '6px' }}>{label}</div>
    </div>
  );
}

/* ─── 19. MaviToast (functional wrapper) ─── */
export function MaviToast({ message, type = 'success', onClose }) {
  const cfg = {
    success: { bg: '#064e3b', border: '#059669', icon: '\u2705' },
    error: { bg: '#7f1d1d', border: '#dc2626', icon: '\u274C' },
    warning: { bg: '#78350f', border: '#d97706', icon: '\u26A0\uFE0F' },
    info: { bg: '#1e3a5f', border: '#3b82f6', icon: '\u2139\uFE0F' }
  }[type] || { bg: '#064e3b', border: '#059669', icon: '\u2705' };

  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', top: '16px', right: '16px', zIndex: 99999, maxWidth: '360px',
      backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '10px',
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)', fontSize: '0.82rem', color: '#fff', fontWeight: 500
    }}>
      <span>{cfg.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>}
    </div>
  );
}

/* ─── 20. MaviProgress ─── */
export function MaviProgress({ value = 0, max = 100, label = '', color = '#38bdf8', showPercentage = true, height = 8 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ width: '100%' }}>
      {(label || showPercentage) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ color: '#94a3b8' }}>{label}</span>
          {showPercentage && <span style={{ color }}>{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div style={{ backgroundColor: '#1e293b', borderRadius: height / 2 + 'px', height: height + 'px', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', backgroundColor: color, borderRadius: height / 2 + 'px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

/* ─── 21. MaviTimeline ─── */
export function MaviTimeline({ events = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', padding: '4px 0' }}>
      {events.map((ev, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%',
              backgroundColor: ev.status === 'done' ? '#059669' : ev.status === 'active' ? '#38bdf8' : '#475569',
              border: `2px solid ${ev.status === 'done' ? '#059669' : ev.status === 'active' ? '#38bdf8' : '#64748b'}`,
              zIndex: 1
            }} />
            {idx < events.length - 1 && (
              <div style={{ width: '2px', flex: 1, backgroundColor: ev.status === 'done' ? '#05966933' : '#1e293b', minHeight: '24px' }} />
            )}
          </div>
          <div style={{ paddingBottom: '16px', flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9' }}>{ev.title}</div>
            {ev.time && <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>{ev.time}</div>}
            {ev.description && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{ev.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── 22. MaviImageCapture ─── */
export function MaviImageCapture({ onCapture, captureText = 'Ambil Foto', placeholderText = 'Belum ada foto' }) {
  const fileRef = React.useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setPreview(url);
      if (onCapture) onCapture(url);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
      {preview ? (
        <div style={{ position: 'relative' }}>
          <img src={preview} alt="Captured" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
          <button type="button" onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ''; }} style={{
            position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><X size={14} /></button>
        </div>
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Camera size={28} color="#64748b" />
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{placeholderText}</span>
        </div>
      )}
      <div style={{ padding: '10px' }}>
        <MaviButton variant="primary" fullWidth size="sm" onClick={() => fileRef.current && fileRef.current.click()}>
          <Camera size={14} /> {captureText}
        </MaviButton>
      </div>
    </div>
  );
}
