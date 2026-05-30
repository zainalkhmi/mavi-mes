import { useState, useEffect, useRef, useCallback } from 'react';

// ─── ICONS (inline SVG) ───────────────────────────────────────────────────────
const Icon = {
  Cylinder:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="2" y="7" width="20" height="10" rx="2"/><line x1="6" y1="7" x2="6" y2="17"/><line x1="18" y1="7" x2="18" y2="17"/><circle cx="12" cy="12" r="2"/></svg>,
  Drawing2D:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/><line x1="7" y1="6" x2="7.01" y2="6" strokeWidth="3"/><line x1="12" y1="6" x2="17" y2="6"/></svg>,
  Drawing3D:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  Function:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  Pressure:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/><path d="M16.24 7.76l-1.42 1.42"/></svg>,
  Visual:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Stroke:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/><path d="M5 5v14"/></svg>,
  Check:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>,
  X:          () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Alert:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Play:       () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Stop:       () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="6" width="12" height="12"/></svg>,
  Reset:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
  Save:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Print:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  Ruler:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21.3 15.3a2.4 2.4 0 010 3.4l-2.6 2.6a2.4 2.4 0 01-3.4 0L2.7 8.7a2.4 2.4 0 010-3.4l2.6-2.6a2.4 2.4 0 013.4 0z"/><path d="M7.5 10.5l2-2"/><path d="M10.5 13.5l2-2"/><path d="M13.5 16.5l2-2"/></svg>,
  Gauge:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M12 6v2"/><path d="M12 16v2"/><path d="M6 12H4"/><path d="M20 12h-2"/><path d="M12 12l3-3"/></svg>,
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STATUS = { PASS: 'PASS', FAIL: 'FAIL', NA: 'N/A', PENDING: 'PENDING' };
const DEFECT_TYPES = ['Scratch', 'Dent', 'Rust', 'Pitting', 'Scoring', 'Bend', 'Crack', 'Leak', 'None'];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function HydraulicCylinderInspection() {
  const [activeTab, setActiveTab] = useState('header');
  const [form, setForm] = useState({
    // Header
    partNumber: 'HC-2024-001',
    serialNumber: '',
    drawingNumber: 'DWG-HC-001-R2',
    customerName: '',
    workOrder: '',
    operator: '',
    inspectionDate: new Date().toISOString().slice(0, 10),
    shift: 'Pagi (06:00-14:00)',
    // 2D Dimensions
    dims: {
      boreDiameter:     { nominal: '80.000', tol: '±0.020', actual: '', status: STATUS.PENDING },
      rodDiameter:      { nominal: '56.000', tol: '±0.015', actual: '', status: STATUS.PENDING },
      strokeLength:     { nominal: '500.000', tol: '±0.500', actual: '', status: STATUS.PENDING },
      closedLength:     { nominal: '680.000', tol: '±1.000', actual: '', status: STATUS.PENDING },
      extendedLength:   { nominal: '1180.000', tol: '±1.000', actual: '', status: STATUS.PENDING },
      mountingHoleDia:  { nominal: '40.000', tol: '±0.025', actual: '', status: STATUS.PENDING },
      mountingPCD:      { nominal: '120.000', tol: '±0.050', actual: '', status: STATUS.PENDING },
      portSize:         { nominal: '1/2 BSP', tol: 'GO/NOGO', actual: '', status: STATUS.PENDING },
      wallThickness:    { nominal: '12.000', tol: '±0.200', actual: '', status: STATUS.PENDING },
      sealGrooveDepth:  { nominal: '4.500', tol: '±0.050', actual: '', status: STATUS.PENDING },
    },
    // 3D / GD&T
    gdt: {
      cylindricityBore:   { nominal: '0.020', actual: '', status: STATUS.PENDING },
      straightnessRod:    { nominal: '0.030', actual: '', status: STATUS.PENDING },
      runoutRod:          { nominal: '0.050', actual: '', status: STATUS.PENDING },
      perpendicularityEnd:{ nominal: '0.050', actual: '', status: STATUS.PENDING },
      parallelismMount:   { nominal: '0.100', actual: '', status: STATUS.PENDING },
      concentricityBore:  { nominal: '0.030', actual: '', status: STATUS.PENDING },
      flatnessFlange:     { nominal: '0.040', actual: '', status: STATUS.PENDING },
    },
    // Function Test
    funcTests: {
      noLoadExtend:     { spec: 'Smooth', result: '', status: STATUS.PENDING },
      noLoadRetract:    { spec: 'Smooth', result: '', status: STATUS.PENDING },
      fullLoadExtend:   { spec: '≤5s @ 140 bar', result: '', status: STATUS.PENDING },
      fullLoadRetract:  { spec: '≤4s @ 140 bar', result: '', status: STATUS.PENDING },
      internalLeakage:  { spec: '≤5 ml/min', result: '', status: STATUS.PENDING },
      externalLeakage:  { spec: 'No leak', result: '', status: STATUS.PENDING },
      cushioning:       { spec: 'Smooth decel', result: '', status: STATUS.PENDING },
      endCushion:       { spec: 'No shock', result: '', status: STATUS.PENDING },
    },
    // Pressure Test
    pressureTests: [
      { phase: 'Proof Pressure', target: '250', hold: '30', actual: '', leakCheck: '', result: STATUS.PENDING },
      { phase: 'Burst Pressure', target: '350', hold: '10', actual: '', leakCheck: '', result: STATUS.PENDING },
      { phase: 'Working Pressure', target: '160', hold: '120', actual: '', leakCheck: '', result: STATUS.PENDING },
      { phase: 'Minimum Pressure', target: '20', hold: '60', actual: '', leakCheck: '', result: STATUS.PENDING },
    ],
    // Visual Rod Piston
    visual: {
      rodSurface:      { finding: '', defect: 'None', severity: '', status: STATUS.PENDING },
      pistonSurface:   { finding: '', defect: 'None', severity: '', status: STATUS.PENDING },
      sealCondition:   { finding: '', defect: 'None', severity: '', status: STATUS.PENDING },
      weldQuality:     { finding: '', defect: 'None', severity: '', status: STATUS.PENDING },
      threadCondition: { finding: '', defect: 'None', severity: '', status: STATUS.PENDING },
      portCondition:   { finding: '', defect: 'None', severity: '', status: STATUS.PENDING },
      coatingFinish:   { finding: '', defect: 'None', severity: '', status: STATUS.PENDING },
      marksStamps:     { finding: '', defect: 'None', severity: '', status: STATUS.PENDING },
    },
    // Stroke
    strokeData: {
      specStroke: '500.0',
      measured: ['', '', ''],
      avgStroke: '',
      deviation: '',
      straightness: '',
      driftTest: '',
      driftResult: STATUS.PENDING,
      strokeResult: STATUS.PENDING,
    },
    // Overall
    overallResult: STATUS.PENDING,
    remarks: '',
  });

  // ─── STROKE ANIMATION ─────────────────────────────────────────────────────
  const [strokeAnim, setStrokeAnim] = useState({ running: false, pct: 0, dir: 1, phase: 'idle' });
  const animRef = useRef(null);

  const startStrokeAnim = () => {
    setStrokeAnim({ running: true, pct: 0, dir: 1, phase: 'extending' });
  };
  const stopStrokeAnim = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setStrokeAnim({ running: false, pct: 0, dir: 1, phase: 'idle' });
  };

  useEffect(() => {
    if (!strokeAnim.running) return;
    let pct = strokeAnim.pct;
    let dir = strokeAnim.dir;
    const step = () => {
      pct += dir * 0.8;
      if (pct >= 100) { pct = 100; dir = -1; }
      if (pct <= 0)   { pct = 0;   dir = 1;  }
      setStrokeAnim(s => ({ ...s, pct, dir, phase: dir === 1 ? 'extending' : 'retracting' }));
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [strokeAnim.running]);

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  const setField = (path, value) => {
    setForm(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = clone;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  const autoStatus = (nominal, tol, actual) => {
    if (!actual) return STATUS.PENDING;
    const n = parseFloat(nominal);
    const a = parseFloat(actual);
    if (isNaN(n) || isNaN(a)) return STATUS.PENDING;
    const t = parseFloat(tol.replace('±', ''));
    if (isNaN(t)) return STATUS.PENDING;
    return Math.abs(a - n) <= t ? STATUS.PASS : STATUS.FAIL;
  };

  const handleDimChange = (key, field, value) => {
    setForm(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      clone.dims[key][field] = value;
      if (field === 'actual') {
        clone.dims[key].status = autoStatus(clone.dims[key].nominal, clone.dims[key].tol, value);
      }
      return clone;
    });
  };

  const handleGdtChange = (key, field, value) => {
    setForm(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      clone.gdt[key][field] = value;
      if (field === 'actual') {
        const n = parseFloat(clone.gdt[key].nominal);
        const a = parseFloat(value);
        clone.gdt[key].status = (!isNaN(n) && !isNaN(a)) ? (a <= n ? STATUS.PASS : STATUS.FAIL) : STATUS.PENDING;
      }
      return clone;
    });
  };

  const handleStrokeMeasure = (idx, value) => {
    setForm(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      clone.strokeData.measured[idx] = value;
      const vals = clone.strokeData.measured.map(v => parseFloat(v)).filter(v => !isNaN(v));
      if (vals.length > 0) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        clone.strokeData.avgStroke = avg.toFixed(3);
        clone.strokeData.deviation = (avg - parseFloat(clone.strokeData.specStroke)).toFixed(3);
        const tol = 0.5;
        clone.strokeData.strokeResult = Math.abs(avg - parseFloat(clone.strokeData.specStroke)) <= tol ? STATUS.PASS : STATUS.FAIL;
      }
      return clone;
    });
  };

  // Calculate overall progress
  const allStatuses = [
    ...Object.values(form.dims).map(d => d.status),
    ...Object.values(form.gdt).map(d => d.status),
    ...Object.values(form.funcTests).map(d => d.status),
    ...form.pressureTests.map(d => d.result),
    ...Object.values(form.visual).map(d => d.status),
    form.strokeData.strokeResult,
  ];
  const passCount  = allStatuses.filter(s => s === STATUS.PASS).length;
  const failCount  = allStatuses.filter(s => s === STATUS.FAIL).length;
  const totalCount = allStatuses.length;
  const progress   = Math.round((passCount + failCount) / totalCount * 100);

  // ─── STATUS BADGE ─────────────────────────────────────────────────────────
  const StatusBadge = ({ status, small }) => {
    const cfg = {
      [STATUS.PASS]:    { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7', label: 'PASS' },
      [STATUS.FAIL]:    { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', label: 'FAIL' },
      [STATUS.PENDING]: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', label: '—' },
      [STATUS.NA]:      { bg: '#fef3c7', color: '#92400e', border: '#fcd34d', label: 'N/A' },
    }[status] || { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', label: '—' };
    return (
      <span style={{
        backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        padding: small ? '2px 8px' : '3px 10px',
        borderRadius: '999px', fontSize: small ? '0.68rem' : '0.75rem',
        fontWeight: 700, letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '4px'
      }}>
        {status === STATUS.PASS && <Icon.Check />}
        {status === STATUS.FAIL && <Icon.X />}
        {cfg.label}
      </span>
    );
  };

  // ─── 2D DRAWING SVG ───────────────────────────────────────────────────────
  const Drawing2D = () => (
    <svg viewBox="0 0 800 400" style={{ width: '100%', height: 'auto', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      {/* Grid */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="800" height="400" fill="url(#grid)"/>

      {/* Title block */}
      <rect x="580" y="320" width="210" height="70" fill="white" stroke="#1e293b" strokeWidth="1.5"/>
      <line x1="580" y1="340" x2="790" y2="340" stroke="#1e293b" strokeWidth="1"/>
      <line x1="580" y1="355" x2="790" y2="355" stroke="#1e293b" strokeWidth="1"/>
      <line x1="580" y1="370" x2="790" y2="370" stroke="#1e293b" strokeWidth="1"/>
      <text x="685" y="334" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1e293b">HYDRAULIC CYLINDER</text>
      <text x="685" y="349" textAnchor="middle" fontSize="7" fill="#334155">DWG NO: DWG-HC-001-R2</text>
      <text x="685" y="364" textAnchor="middle" fontSize="7" fill="#334155">SCALE 1:5 | UNIT: mm</text>
      <text x="685" y="379" textAnchor="middle" fontSize="7" fill="#334155">REV: A | DATE: 2024-01</text>

      {/* ── FRONT VIEW (main cross-section) ── */}
      {/* Cylinder barrel */}
      <rect x="60" y="120" width="500" height="160" rx="4" fill="none" stroke="#1e293b" strokeWidth="2.5"/>
      {/* Inner bore */}
      <rect x="60" y="150" width="500" height="100" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="5,3"/>
      {/* Piston */}
      <rect x="250" y="125" width="30" height="150" rx="2" fill="#dbeafe" stroke="#2563eb" strokeWidth="2"/>
      {/* Rod */}
      <rect x="280" y="172" width="230" height="56" rx="2" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2"/>
      {/* Rod end */}
      <circle cx="560" cy="200" r="28" fill="#f0f9ff" stroke="#0284c7" strokeWidth="2"/>
      <circle cx="560" cy="200" r="16" fill="none" stroke="#0284c7" strokeWidth="1.5"/>
      {/* Cylinder cap left */}
      <rect x="30" y="115" width="32" height="170" rx="4" fill="#f1f5f9" stroke="#1e293b" strokeWidth="2"/>
      {/* Port holes */}
      <circle cx="100" cy="130" r="8" fill="white" stroke="#ef4444" strokeWidth="2"/>
      <text x="100" y="115" textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="bold">P1</text>
      <circle cx="450" cy="130" r="8" fill="white" stroke="#ef4444" strokeWidth="2"/>
      <text x="450" y="115" textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="bold">P2</text>
      {/* Seal grooves on piston */}
      <line x1="255" y1="155" x2="275" y2="155" stroke="#7c3aed" strokeWidth="3"/>
      <line x1="255" y1="165" x2="275" y2="165" stroke="#7c3aed" strokeWidth="3"/>
      <line x1="255" y1="230" x2="275" y2="230" stroke="#7c3aed" strokeWidth="3"/>
      <line x1="255" y1="240" x2="275" y2="240" stroke="#7c3aed" strokeWidth="3"/>

      {/* ── DIMENSION LINES ── */}
      {/* Bore diameter dimension */}
      <line x1="20" y1="150" x2="20" y2="250" stroke="#0891b2" strokeWidth="1.2"/>
      <line x1="15" y1="150" x2="25" y2="150" stroke="#0891b2" strokeWidth="1.2"/>
      <line x1="15" y1="250" x2="25" y2="250" stroke="#0891b2" strokeWidth="1.2"/>
      <text x="12" y="203" textAnchor="middle" fontSize="8" fill="#0891b2" fontWeight="bold" transform="rotate(-90,12,203)">Ø80 ±0.02</text>

      {/* Stroke dimension */}
      <line x1="250" y1="300" x2="560" y2="300" stroke="#0891b2" strokeWidth="1.2"/>
      <line x1="250" y1="295" x2="250" y2="305" stroke="#0891b2" strokeWidth="1.2"/>
      <line x1="560" y1="295" x2="560" y2="305" stroke="#0891b2" strokeWidth="1.2"/>
      <text x="405" y="315" textAnchor="middle" fontSize="9" fill="#0891b2" fontWeight="bold">STROKE = 500 ±0.5</text>

      {/* Overall length */}
      <line x1="30" y1="312" x2="590" y2="312" stroke="#7c3aed" strokeWidth="1.2"/>
      <line x1="30" y1="307" x2="30" y2="317" stroke="#7c3aed" strokeWidth="1.2"/>
      <line x1="590" y1="307" x2="590" y2="317" stroke="#7c3aed" strokeWidth="1.2"/>
      <text x="310" y="330" textAnchor="middle" fontSize="9" fill="#7c3aed" fontWeight="bold">OAL (Extended) = 1180 ±1.0</text>

      {/* Rod diameter */}
      <line x1="350" y1="344" x2="350" y2="172" stroke="#0891b2" strokeWidth="0.8" strokeDasharray="3,2"/>
      <line x1="350" y1="344" x2="510" y2="344" stroke="#0891b2" strokeWidth="0.8" strokeDasharray="3,2"/>
      <line x1="510" y1="344" x2="510" y2="228" stroke="#0891b2" strokeWidth="0.8" strokeDasharray="3,2"/>
      <text x="430" y="357" textAnchor="middle" fontSize="8" fill="#0891b2">Ø56 ±0.015 (ROD)</text>

      {/* Section callout */}
      <text x="400" y="94" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">SECTION A-A  (FRONT VIEW)</text>
      <text x="400" y="106" textAnchor="middle" fontSize="8" fill="#64748b">HYDRAULIC CYLINDER CROSS-SECTION</text>

      {/* Legend */}
      <rect x="10" y="8" width="200" height="55" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
      <text x="110" y="22" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1e293b">LEGEND</text>
      <rect x="18" y="27" width="10" height="6" fill="#dbeafe" stroke="#2563eb" strokeWidth="1"/>
      <text x="35" y="33" fontSize="7" fill="#334155">Piston</text>
      <rect x="18" y="37" width="10" height="6" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1"/>
      <text x="35" y="43" fontSize="7" fill="#334155">Rod</text>
      <rect x="80" y="27" width="10" height="6" fill="white" stroke="#7c3aed" strokeWidth="1"/>
      <text x="97" y="33" fontSize="7" fill="#334155">Seal Groove</text>
      <circle cx="83" cy="41" r="5" fill="white" stroke="#ef4444" strokeWidth="1"/>
      <text x="97" y="44" fontSize="7" fill="#334155">Hydraulic Port</text>
    </svg>
  );

  // ─── 3D ISO SVG ───────────────────────────────────────────────────────────
  const Drawing3D = () => (
    <svg viewBox="0 0 800 420" style={{ width: '100%', height: 'auto', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', borderRadius: '8px' }}>
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8"/>
          <stop offset="40%" stopColor="#64748b"/>
          <stop offset="100%" stopColor="#334155"/>
        </linearGradient>
        <linearGradient id="rodGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bae6fd"/>
          <stop offset="50%" stopColor="#7dd3fc"/>
          <stop offset="100%" stopColor="#0284c7"/>
        </linearGradient>
        <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94a3b8"/>
          <stop offset="100%" stopColor="#475569"/>
        </linearGradient>
        <filter id="shadow"><feDropShadow dx="4" dy="6" stdDeviation="5" floodOpacity="0.5"/></filter>
      </defs>

      {/* 3D Label */}
      <text x="400" y="30" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#38bdf8">ISOMETRIC VIEW — HYDRAULIC CYLINDER</text>
      <text x="400" y="47" textAnchor="middle" fontSize="9" fill="#64748b">Part No: HC-2024-001 | Scale 1:5</text>

      {/* Shadow */}
      <ellipse cx="370" cy="360" rx="280" ry="22" fill="#000" opacity="0.4"/>

      {/* Cylinder barrel top face */}
      <ellipse cx="370" cy="145" rx="250" ry="55" fill="#94a3b8" opacity="0.9"/>
      {/* Cylinder body sides */}
      <rect x="120" y="145" width="500" height="180" fill="url(#bodyGrad)" filter="url(#shadow)"/>
      {/* Barrel highlight strip */}
      <rect x="120" y="155" width="500" height="12" fill="rgba(255,255,255,0.15)"/>
      <rect x="120" y="280" width="500" height="8" fill="rgba(0,0,0,0.2)"/>
      {/* Cylinder barrel bottom face */}
      <ellipse cx="370" cy="325" rx="250" ry="55" fill="#334155"/>

      {/* Left cap (head end) */}
      <ellipse cx="120" cy="235" rx="55" ry="90" fill="url(#capGrad)" stroke="#94a3b8" strokeWidth="2"/>
      <ellipse cx="120" cy="235" rx="38" ry="62" fill="#1e293b"/>
      {/* Mount lug left */}
      <rect x="75" y="195" width="25" height="80" rx="5" fill="#475569" stroke="#64748b" strokeWidth="1.5"/>
      <circle cx="87" cy="215" r="8" fill="#1e293b" stroke="#64748b" strokeWidth="1.5"/>
      <circle cx="87" cy="255" r="8" fill="#1e293b" stroke="#64748b" strokeWidth="1.5"/>

      {/* Right cap (rod end) */}
      <ellipse cx="620" cy="235" rx="55" ry="90" fill="url(#capGrad)" stroke="#94a3b8" strokeWidth="2"/>
      <ellipse cx="620" cy="235" rx="38" ry="62" fill="#1e293b"/>

      {/* Rod */}
      <ellipse cx="620" cy="200" rx="25" ry="42" fill="#bae6fd"/>
      <rect x="620" y="158" width="150" height="84" fill="url(#rodGrad)"/>
      <ellipse cx="770" cy="200" rx="25" ry="42" fill="#7dd3fc"/>
      {/* Rod highlight */}
      <rect x="622" y="162" width="148" height="12" fill="rgba(255,255,255,0.35)"/>
      {/* Rod clevis end */}
      <rect x="770" y="175" width="22" height="50" rx="4" fill="#0ea5e9" stroke="#38bdf8" strokeWidth="1.5"/>
      <circle cx="781" cy="200" r="12" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5"/>
      <circle cx="781" cy="200" r="5" fill="#0f172a"/>

      {/* Port P1 */}
      <circle cx="200" cy="155" r="14" fill="#ef4444" stroke="#fca5a5" strokeWidth="2"/>
      <text x="200" y="137" textAnchor="middle" fontSize="10" fill="#fca5a5" fontWeight="bold">P1</text>
      {/* Port P2 */}
      <circle cx="490" cy="155" r="14" fill="#ef4444" stroke="#fca5a5" strokeWidth="2"/>
      <text x="490" y="137" textAnchor="middle" fontSize="10" fill="#fca5a5" fontWeight="bold">P2</text>

      {/* Seal indication */}
      <rect x="590" y="158" width="8" height="84" fill="#a855f7" opacity="0.8"/>
      <text x="584" y="204" textAnchor="end" fontSize="9" fill="#c084fc">SEAL</text>

      {/* GD&T callouts */}
      <line x1="370" y1="90" x2="370" y2="60" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4,2"/>
      <rect x="270" y="42" width="200" height="20" rx="3" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1"/>
      <text x="370" y="56" textAnchor="middle" fontSize="9" fill="#38bdf8">⊙ Cylindricity Bore: 0.020 max</text>

      <line x1="695" y1="200" x2="750" y2="170" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4,2"/>
      <rect x="652" y="148" width="170" height="20" rx="3" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="1"/>
      <text x="737" y="162" textAnchor="middle" fontSize="9" fill="#fbbf24">— Straightness Rod: 0.030</text>

      {/* Dimension Arrow — stroke */}
      <line x1="620" y1="385" x2="770" y2="385" stroke="#a3e635" strokeWidth="1.5"/>
      <polygon points="623,381 623,389 614,385" fill="#a3e635"/>
      <polygon points="767,381 767,389 776,385" fill="#a3e635"/>
      <text x="695" y="398" textAnchor="middle" fontSize="9" fill="#a3e635" fontWeight="bold">STROKE: 500mm</text>

      {/* Axes indicator */}
      <line x1="50" y1="370" x2="90" y2="370" stroke="#ef4444" strokeWidth="2"/>
      <text x="97" y="374" fontSize="9" fill="#ef4444" fontWeight="bold">X</text>
      <line x1="50" y1="370" x2="50" y2="330" stroke="#22c55e" strokeWidth="2"/>
      <text x="46" y="325" fontSize="9" fill="#22c55e" fontWeight="bold">Y</text>
      <line x1="50" y1="370" x2="28" y2="350" stroke="#3b82f6" strokeWidth="2"/>
      <text x="18" y="347" fontSize="9" fill="#3b82f6" fontWeight="bold">Z</text>
    </svg>
  );

  // ─── STYLES ───────────────────────────────────────────────────────────────
  const S = {
    wrap: { minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#0e1a2e 100%)', fontFamily: "'Inter','Segoe UI',sans-serif", color: '#f8fafc' },
    header: { background: 'linear-gradient(90deg,#1e3a5f 0%,#1e293b 100%)', borderBottom: '1px solid #334155', padding: '0 24px' },
    headerInner: { maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' },
    logo: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoIcon: { width: '40px', height: '40px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' },
    sub: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '1px' },
    badge: { background: '#1e3a5f', border: '1px solid #2563eb', borderRadius: '6px', padding: '4px 12px', fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600 },
    body: { maxWidth: '1400px', margin: '0 auto', padding: '24px' },
    tabs: { display: 'flex', gap: '4px', background: '#1e293b', borderRadius: '12px', padding: '4px', marginBottom: '24px', flexWrap: 'wrap' },
    tab: (active) => ({
      flex: 1, minWidth: '120px', padding: '10px 16px', border: 'none', cursor: 'pointer',
      borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      transition: 'all 0.2s',
      background: active ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'transparent',
      color: active ? '#fff' : '#64748b',
      boxShadow: active ? '0 2px 8px rgba(59,130,246,0.4)' : 'none',
    }),
    card: { background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '20px' },
    cardTitle: { fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid #334155' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' },
    th: { background: '#0f172a', color: '#94a3b8', padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: '1px solid #334155' },
    td: { padding: '8px 12px', borderBottom: '1px solid #1e293b', color: '#cbd5e1', verticalAlign: 'middle' },
    input: { background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#f8fafc', fontSize: '0.82rem', width: '100%', outline: 'none', transition: 'border-color 0.2s' },
    label: { fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px', display: 'block' },
    row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '16px', marginBottom: '16px' },
    fieldGroup: { display: 'flex', flexDirection: 'column' },
    progressBar: (pct, color) => ({
      height: '8px', background: '#334155', borderRadius: '99px', overflow: 'hidden',
      position: 'relative',
    }),
    progressFill: (pct, color) => ({
      height: '100%', width: `${pct}%`, background: color || 'linear-gradient(90deg,#3b82f6,#06b6d4)',
      borderRadius: '99px', transition: 'width 0.6s ease',
    }),
    select: { background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#f8fafc', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' },
    btnGroup: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    btn: (variant) => {
      const variants = {
        primary: { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', border: '1px solid #2563eb' },
        success: { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: '1px solid #059669' },
        danger:  { background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: '1px solid #dc2626' },
        ghost:   { background: 'transparent', color: '#94a3b8', border: '1px solid #334155' },
        warning: { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: '1px solid #d97706' },
      };
      return {
        ...variants[variant] || variants.ghost,
        padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem',
        fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px',
        transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      };
    },
    section: { marginBottom: '32px' },
  };

  // ─── RENDER TABS ──────────────────────────────────────────────────────────
  const tabs = [
    { id: 'header',   label: 'Header',        icon: <Icon.Cylinder /> },
    { id: 'dim2d',    label: '2D Dimensions', icon: <Icon.Drawing2D /> },
    { id: 'dim3d',    label: '3D / GD&T',     icon: <Icon.Drawing3D /> },
    { id: 'function', label: 'Function Test', icon: <Icon.Function /> },
    { id: 'pressure', label: 'Pressure Test', icon: <Icon.Pressure /> },
    { id: 'visual',   label: 'Visual Rod',    icon: <Icon.Visual /> },
    { id: 'stroke',   label: 'Stroke Anim.',  icon: <Icon.Stroke /> },
    { id: 'summary',  label: 'Summary',       icon: <Icon.Gauge /> },
  ];

  // ─── OVERALL STATUS COLOR ─────────────────────────────────────────────────
  const overallColor = failCount > 0 ? '#ef4444' : passCount === totalCount ? '#10b981' : '#f59e0b';

  return (
    <div style={S.wrap}>
      {/* ── HEADER ── */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logo}>
            <div style={S.logoIcon}><Icon.Cylinder /></div>
            <div>
              <div style={S.title}>Hydraulic Cylinder Inspection</div>
              <div style={S.sub}>Template Pengukuran & Quality Control</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Progress Inspeksi</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: overallColor }}>{progress}%</div>
            </div>
            <div style={{ width: '120px' }}>
              <div style={S.progressBar()}><div style={S.progressFill(progress, overallColor === '#10b981' ? 'linear-gradient(90deg,#10b981,#34d399)' : overallColor === '#ef4444' ? 'linear-gradient(90deg,#ef4444,#f87171)' : 'linear-gradient(90deg,#f59e0b,#fbbf24)')}/></div>
            </div>
            <div style={S.badge}>Rev A</div>
            <button style={S.btn('primary')} onClick={() => window.print()}>
              <Icon.Print /> Cetak
            </button>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={S.body}>

        {/* Stat Pills */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Pemeriksaan', value: totalCount, color: '#3b82f6' },
            { label: 'PASS', value: passCount, color: '#10b981' },
            { label: 'FAIL', value: failCount, color: '#ef4444' },
            { label: 'Pending', value: totalCount - passCount - failCount, color: '#94a3b8' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1e293b', border: `1px solid ${s.color}33`, borderRadius: '10px', padding: '10px 20px', minWidth: '120px' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={S.tabs}>
          {tabs.map(t => (
            <button key={t.id} style={S.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════ TAB: HEADER ════════════════════ */}
        {activeTab === 'header' && (
          <div style={S.section}>
            <div style={S.card}>
              <div style={S.cardTitle}><Icon.Cylinder /> Identifikasi Komponen</div>
              <div style={S.row}>
                {[
                  { label: 'Part Number', key: 'partNumber' },
                  { label: 'Serial Number', key: 'serialNumber' },
                  { label: 'Nomor Drawing', key: 'drawingNumber' },
                  { label: 'Nama Customer', key: 'customerName' },
                  { label: 'Work Order', key: 'workOrder' },
                  { label: 'Operator', key: 'operator' },
                ].map(f => (
                  <div key={f.key} style={S.fieldGroup}>
                    <label style={S.label}>{f.label}</label>
                    <input style={S.input} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} placeholder={`Masukkan ${f.label}`}/>
                  </div>
                ))}
              </div>
              <div style={S.row}>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Tanggal Inspeksi</label>
                  <input type="date" style={S.input} value={form.inspectionDate} onChange={e => setField('inspectionDate', e.target.value)}/>
                </div>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Shift</label>
                  <select style={S.select} value={form.shift} onChange={e => setField('shift', e.target.value)}>
                    <option>Pagi (06:00-14:00)</option>
                    <option>Siang (14:00-22:00)</option>
                    <option>Malam (22:00-06:00)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cylinder Specs Card */}
            <div style={S.card}>
              <div style={S.cardTitle}><Icon.Ruler /> Spesifikasi Teknis Cylinder</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px' }}>
                {[
                  { label: 'Bore Diameter', value: 'Ø80 mm', tag: 'Nominal' },
                  { label: 'Rod Diameter', value: 'Ø56 mm', tag: 'Nominal' },
                  { label: 'Stroke', value: '500 mm', tag: 'Nominal' },
                  { label: 'Working Pressure', value: '160 bar', tag: 'Max' },
                  { label: 'Test Pressure', value: '250 bar', tag: 'Proof' },
                  { label: 'Fluid Medium', value: 'Hydraulic Oil ISO VG46', tag: 'Spec' },
                  { label: 'Temperature Range', value: '-20°C ~ +80°C', tag: 'Operating' },
                  { label: 'Mounting Type', value: 'Clevis / Flange', tag: 'Config' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>{s.value}</div>
                    <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '2px' }}>{s.tag}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ TAB: 2D DIMENSIONS ════════════════════ */}
        {activeTab === 'dim2d' && (
          <div style={S.section}>
            <div style={S.card}>
              <div style={S.cardTitle}><Icon.Drawing2D /> 2D Drawing — Tampak Depan & Ukuran</div>
              <Drawing2D />
            </div>
            <div style={S.card}>
              <div style={S.cardTitle}><Icon.Ruler /> Tabel Pengukuran Dimensi</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      {['Parameter', 'Nominal (mm)', 'Toleransi', 'Actual (mm)', 'Hasil', 'Keterangan'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(form.dims).map(([key, d], i) => {
                      const labels = {
                        boreDiameter: 'Bore Diameter (Ø)', rodDiameter: 'Rod Diameter (Ø)',
                        strokeLength: 'Stroke Length', closedLength: 'Closed Length (OAL)',
                        extendedLength: 'Extended Length (OAL)', mountingHoleDia: 'Mounting Hole Ø',
                        mountingPCD: 'Mounting PCD', portSize: 'Port Size',
                        wallThickness: 'Wall Thickness', sealGrooveDepth: 'Seal Groove Depth',
                      };
                      return (
                        <tr key={key} style={{ background: i % 2 === 0 ? '#0f172a' : 'transparent' }}>
                          <td style={{ ...S.td, fontWeight: 600, color: '#f8fafc' }}>{labels[key]}</td>
                          <td style={S.td}>{d.nominal}</td>
                          <td style={{ ...S.td, color: '#fbbf24' }}>{d.tol}</td>
                          <td style={S.td}>
                            <input style={{ ...S.input, width: '110px' }} placeholder="0.000"
                              value={d.actual}
                              onChange={e => handleDimChange(key, 'actual', e.target.value)}/>
                          </td>
                          <td style={S.td}><StatusBadge status={d.status} small/></td>
                          <td style={S.td}>
                            <input style={{ ...S.input, width: '150px' }} placeholder="Catatan..."
                              value={d.remark || ''}
                              onChange={e => handleDimChange(key, 'remark', e.target.value)}/>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ TAB: 3D / GD&T ════════════════════ */}
        {activeTab === 'dim3d' && (
          <div style={S.section}>
            <div style={S.card}>
              <div style={S.cardTitle}><Icon.Drawing3D /> 3D Isometric View & GD&T Callouts</div>
              <Drawing3D />
            </div>
            <div style={S.card}>
              <div style={S.cardTitle}><Icon.Ruler /> GD&T — Geometric Dimensioning & Tolerancing</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      {['Karakteristik GD&T', 'Simbol', 'Max Toleransi (mm)', 'Actual (mm)', 'Alat Ukur', 'Hasil'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'cylindricityBore',    label: 'Cylindricity — Bore',         sym: '⌭', tool: 'CMM / Roundness Tester' },
                      { key: 'straightnessRod',     label: 'Straightness — Rod',           sym: '—', tool: 'Dial Indicator + V-block' },
                      { key: 'runoutRod',           label: 'Total Runout — Rod',           sym: '⌰', tool: 'CMM / Dial Stand' },
                      { key: 'perpendicularityEnd', label: 'Perpendicularity — End Cap',   sym: '⊥', tool: 'CMM' },
                      { key: 'parallelismMount',    label: 'Parallelism — Mount Holes',    sym: '∥', tool: 'CMM / Height Gauge' },
                      { key: 'concentricityBore',   label: 'Concentricity — Bore/OD',      sym: '◎', tool: 'CMM' },
                      { key: 'flatnessFlange',      label: 'Flatness — Flange Face',       sym: '⏥', tool: 'CMM / Flat Plate' },
                    ].map(({ key, label, sym, tool }, i) => (
                      <tr key={key} style={{ background: i % 2 === 0 ? '#0f172a' : 'transparent' }}>
                        <td style={{ ...S.td, fontWeight: 600, color: '#f8fafc' }}>{label}</td>
                        <td style={{ ...S.td, fontSize: '1.2rem', color: '#a78bfa', textAlign: 'center' }}>{sym}</td>
                        <td style={{ ...S.td, color: '#fbbf24', fontWeight: 700 }}>{form.gdt[key].nominal}</td>
                        <td style={S.td}>
                          <input style={{ ...S.input, width: '100px' }} placeholder="0.000"
                            value={form.gdt[key].actual}
                            onChange={e => handleGdtChange(key, 'actual', e.target.value)}/>
                        </td>
                        <td style={{ ...S.td, color: '#94a3b8', fontSize: '0.75rem' }}>{tool}</td>
                        <td style={S.td}><StatusBadge status={form.gdt[key].status} small/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ TAB: FUNCTION TEST ════════════════════ */}
        {activeTab === 'function' && (
          <div style={S.section}>
            <div style={S.card}>
              <div style={S.cardTitle}><Icon.Function /> Function Test — Pengujian Fungsional</div>
              <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Kondisi Pengujian</div>
                <div style={{ display: 'flex', gap: '24px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {[
                    { k: 'Fluida', v: 'Hydraulic Oil ISO VG46' },
                    { k: 'Temp. Fluida', v: '40°C ± 5°C' },
                    { k: 'Tekanan Kerja', v: '160 bar' },
                    { k: 'Siklus Pemanasan', v: '10 siklus' },
                  ].map(i => (
                    <div key={i.k}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{i.k}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>{i.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      {['#', 'Pengujian', 'Spesifikasi', 'Hasil Aktual', 'Status', 'Catatan'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'noLoadExtend',    label: 'Extend (No Load)', desc: 'Gerakan tanpa beban — memanjang' },
                      { key: 'noLoadRetract',   label: 'Retract (No Load)', desc: 'Gerakan tanpa beban — memendek' },
                      { key: 'fullLoadExtend',  label: 'Extend (Full Load)', desc: 'Beban penuh — memanjang' },
                      { key: 'fullLoadRetract', label: 'Retract (Full Load)', desc: 'Beban penuh — memendek' },
                      { key: 'internalLeakage', label: 'Internal Leakage', desc: 'Kebocoran internal piston seal' },
                      { key: 'externalLeakage', label: 'External Leakage', desc: 'Kebocoran eksternal rod seal' },
                      { key: 'cushioning',      label: 'Cushioning', desc: 'Deselerasi cushion' },
                      { key: 'endCushion',      label: 'End Cushion', desc: 'Bantal akhir langkah' },
                    ].map(({ key, label, desc }, i) => (
                      <tr key={key} style={{ background: i % 2 === 0 ? '#0f172a' : 'transparent' }}>
                        <td style={{ ...S.td, color: '#64748b', fontSize: '0.75rem' }}>{i + 1}</td>
                        <td style={S.td}>
                          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.83rem' }}>{label}</div>
                          <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{desc}</div>
                        </td>
                        <td style={{ ...S.td, color: '#fbbf24', fontWeight: 600, fontSize: '0.78rem' }}>{form.funcTests[key].spec}</td>
                        <td style={S.td}>
                          <input style={{ ...S.input, width: '130px' }} placeholder="Masukkan hasil"
                            value={form.funcTests[key].result}
                            onChange={e => setField(`funcTests.${key}.result`, e.target.value)}/>
                        </td>
                        <td style={S.td}>
                          <select style={{ ...S.select, minWidth: '80px' }}
                            value={form.funcTests[key].status}
                            onChange={e => setField(`funcTests.${key}.status`, e.target.value)}>
                            <option value={STATUS.PENDING}>—</option>
                            <option value={STATUS.PASS}>PASS</option>
                            <option value={STATUS.FAIL}>FAIL</option>
                            <option value={STATUS.NA}>N/A</option>
                          </select>
                        </td>
                        <td style={S.td}>
                          <input style={{ ...S.input, width: '150px' }} placeholder="Catatan..."/>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ TAB: PRESSURE TEST ════════════════════ */}
        {activeTab === 'pressure' && (
          <div style={S.section}>
            {/* Live Pressure Gauge (visual) */}
            <div style={S.card}>
              <div style={S.cardTitle}><Icon.Pressure /> Pressure Test — Pengujian Tekanan Hidraulik</div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {[
                  { label: 'Proof\nPressure', bar: 250, color: '#f59e0b' },
                  { label: 'Burst\nPressure', bar: 350, color: '#ef4444' },
                  { label: 'Working\nPressure', bar: 160, color: '#10b981' },
                  { label: 'Min.\nPressure', bar: 20, color: '#3b82f6' },
                ].map((g, i) => {
                  const pct = Math.min((g.bar / 400) * 100, 100);
                  const rad = 70;
                  const circ = 2 * Math.PI * rad;
                  const dash = (circ * 0.75 * pct) / 100;
                  return (
                    <div key={i} style={{ background: '#0f172a', borderRadius: '12px', padding: '16px', textAlign: 'center', flex: '1', minWidth: '140px', border: '1px solid #334155' }}>
                      <svg viewBox="-90 -90 180 180" style={{ width: '110px', height: '110px' }}>
                        <circle cx="0" cy="0" r={rad} fill="none" stroke="#1e293b" strokeWidth="14" strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={`${circ * 0.125}`} strokeLinecap="round"/>
                        <circle cx="0" cy="0" r={rad} fill="none" stroke={g.color} strokeWidth="14"
                          strokeDasharray={`${dash} ${circ - dash}`}
                          strokeDashoffset={`${circ * 0.125}`} strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${g.color})` }}/>
                        <text x="0" y="-8" textAnchor="middle" fontSize="22" fontWeight="900" fill={g.color}>{g.bar}</text>
                        <text x="0" y="12" textAnchor="middle" fontSize="11" fill="#64748b">bar</text>
                      </svg>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', whiteSpace: 'pre-line', lineHeight: 1.3 }}>{g.label}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      {['Fase Pengujian', 'Target (bar)', 'Hold Time (s)', 'Actual (bar)', 'Cek Kebocoran', 'Hasil'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.pressureTests.map((pt, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#0f172a' : 'transparent' }}>
                        <td style={{ ...S.td, fontWeight: 700, color: '#f8fafc' }}>{pt.phase}</td>
                        <td style={{ ...S.td, color: '#fbbf24', fontWeight: 700 }}>{pt.target}</td>
                        <td style={{ ...S.td, color: '#94a3b8' }}>{pt.hold}</td>
                        <td style={S.td}>
                          <input style={{ ...S.input, width: '100px' }} placeholder="0.0"
                            value={pt.actual}
                            onChange={e => {
                              const np = [...form.pressureTests];
                              np[i] = { ...np[i], actual: e.target.value };
                              setField('pressureTests', np);
                            }}/>
                        </td>
                        <td style={S.td}>
                          <select style={{ ...S.select }}
                            value={pt.leakCheck}
                            onChange={e => {
                              const np = [...form.pressureTests];
                              np[i] = { ...np[i], leakCheck: e.target.value };
                              setField('pressureTests', np);
                            }}>
                            <option value="">Pilih</option>
                            <option value="No Leak">No Leak</option>
                            <option value="Minor Leak">Minor Leak</option>
                            <option value="Major Leak">Major Leak</option>
                          </select>
                        </td>
                        <td style={S.td}>
                          <select style={{ ...S.select }}
                            value={pt.result}
                            onChange={e => {
                              const np = [...form.pressureTests];
                              np[i] = { ...np[i], result: e.target.value };
                              setField('pressureTests', np);
                            }}>
                            <option value={STATUS.PENDING}>—</option>
                            <option value={STATUS.PASS}>PASS</option>
                            <option value={STATUS.FAIL}>FAIL</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ TAB: VISUAL ROD PISTON ════════════════════ */}
        {activeTab === 'visual' && (
          <div style={S.section}>
            <div style={S.card}>
              <div style={S.cardTitle}><Icon.Visual /> Visual Inspection — Rod & Piston</div>

              {/* Visual diagram of rod */}
              <div style={{ background: '#0f172a', borderRadius: '10px', padding: '20px', marginBottom: '20px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '12px' }}>DIAGRAM PEMERIKSAAN VISUAL ROD</div>
                <svg viewBox="0 0 700 160" style={{ width: '100%', height: 'auto' }}>
                  <defs>
                    <linearGradient id="rodV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#bae6fd"/>
                      <stop offset="100%" stopColor="#0284c7"/>
                    </linearGradient>
                  </defs>
                  {/* Rod body */}
                  <rect x="80" y="60" width="540" height="40" rx="4" fill="url(#rodV)" stroke="#0284c7" strokeWidth="2"/>
                  {/* Rod highlight */}
                  <rect x="80" y="62" width="540" height="10" rx="2" fill="rgba(255,255,255,0.3)"/>
                  {/* Piston head left */}
                  <rect x="40" y="45" width="45" height="70" rx="6" fill="#dbeafe" stroke="#2563eb" strokeWidth="2"/>
                  {/* Clevis end right */}
                  <rect x="620" y="55" width="40" height="50" rx="4" fill="#0ea5e9" stroke="#38bdf8" strokeWidth="2"/>
                  <circle cx="640" cy="80" r="14" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5"/>
                  <circle cx="640" cy="80" r="5" fill="#0f172a"/>

                  {/* Seal groove marks */}
                  {[80, 100].map(x => <line key={x} x1={x} y1="58" x2={x} y2="102" stroke="#a855f7" strokeWidth="3" opacity="0.9"/>)}
                  {[580, 600].map(x => <line key={x} x1={x} y1="58" x2={x} y2="102" stroke="#a855f7" strokeWidth="3" opacity="0.9"/>)}

                  {/* Callout arrows */}
                  {[
                    { x: 62, y: 30, label: 'PISTON', color: '#3b82f6' },
                    { x: 90, y: 30, label: 'SEAL GROOVE', color: '#a855f7' },
                    { x: 340, y: 30, label: 'ROD SURFACE', color: '#0284c7' },
                    { x: 590, y: 30, label: 'ROD END', color: '#10b981' },
                    { x: 640, y: 30, label: 'CLEVIS', color: '#f59e0b' },
                  ].map(c => (
                    <g key={c.label}>
                      <line x1={c.x} y1={c.y + 10} x2={c.x} y2="60" stroke={c.color} strokeWidth="1" strokeDasharray="3,2"/>
                      <text x={c.x} y={c.y} textAnchor="middle" fontSize="9" fill={c.color} fontWeight="bold">{c.label}</text>
                    </g>
                  ))}

                  {/* Zone legend */}
                  {['ZONA A', 'ZONA B', 'ZONA C'].map((z, i) => (
                    <text key={z} x={120 + i * 200} y="150" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="bold">{z}</text>
                  ))}
                  {[0, 1, 2].map(i => (
                    <line key={i} x1={80 + i * 180} y1="140" x2={80 + (i + 1) * 180} y2="140" stroke="#475569" strokeWidth="1" strokeDasharray="4,3"/>
                  ))}
                </svg>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      {['Area Pemeriksaan', 'Temuan / Finding', 'Jenis Defect', 'Severity', 'Status'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'rodSurface',      label: 'Permukaan Rod', zone: 'Rod Body' },
                      { key: 'pistonSurface',   label: 'Permukaan Piston', zone: 'Piston Head' },
                      { key: 'sealCondition',   label: 'Kondisi Seal / O-ring', zone: 'Seal Groove' },
                      { key: 'weldQuality',     label: 'Kualitas Las (Weld)', zone: 'End Cap Weld' },
                      { key: 'threadCondition', label: 'Kondisi Thread', zone: 'Rod Thread' },
                      { key: 'portCondition',   label: 'Kondisi Port Hidraulik', zone: 'Port P1 & P2' },
                      { key: 'coatingFinish',   label: 'Coating / Finishing', zone: 'Rod Surface' },
                      { key: 'marksStamps',     label: 'Marking / Stamping', zone: 'ID Mark' },
                    ].map(({ key, label, zone }, i) => (
                      <tr key={key} style={{ background: i % 2 === 0 ? '#0f172a' : 'transparent' }}>
                        <td style={S.td}>
                          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.83rem' }}>{label}</div>
                          <div style={{ color: '#475569', fontSize: '0.7rem' }}>{zone}</div>
                        </td>
                        <td style={S.td}>
                          <input style={{ ...S.input, width: '160px' }} placeholder="Deskripsikan temuan..."
                            value={form.visual[key].finding}
                            onChange={e => setField(`visual.${key}.finding`, e.target.value)}/>
                        </td>
                        <td style={S.td}>
                          <select style={{ ...S.select }}
                            value={form.visual[key].defect}
                            onChange={e => setField(`visual.${key}.defect`, e.target.value)}>
                            {DEFECT_TYPES.map(d => <option key={d}>{d}</option>)}
                          </select>
                        </td>
                        <td style={S.td}>
                          <select style={{ ...S.select }}
                            value={form.visual[key].severity || ''}
                            onChange={e => setField(`visual.${key}.severity`, e.target.value)}>
                            <option value="">—</option>
                            <option value="Minor">Minor</option>
                            <option value="Major">Major</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </td>
                        <td style={S.td}>
                          <select style={{ ...S.select }}
                            value={form.visual[key].status}
                            onChange={e => setField(`visual.${key}.status`, e.target.value)}>
                            <option value={STATUS.PENDING}>—</option>
                            <option value={STATUS.PASS}>PASS</option>
                            <option value={STATUS.FAIL}>FAIL</option>
                            <option value={STATUS.NA}>N/A</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ TAB: STROKE ANIMATION ════════════════════ */}
        {activeTab === 'stroke' && (
          <div style={S.section}>
            <div style={S.card}>
              <div style={S.cardTitle}><Icon.Stroke /> Animasi Pengecekan Stroke — Visualisasi Langkah</div>

              {/* ─ ANIMATION STAGE ─ */}
              <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', marginBottom: '20px', border: '1px solid #334155', position: 'relative', overflow: 'hidden' }}>
                {/* Status badge */}
                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: strokeAnim.running ? '#10b981' : '#ef4444',
                    boxShadow: strokeAnim.running ? '0 0 8px #10b981' : 'none',
                    animation: strokeAnim.running ? 'pulse 1s infinite' : 'none'
                  }}/>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
                    {strokeAnim.running ? strokeAnim.phase.toUpperCase() : 'IDLE'}
                  </span>
                </div>

                {/* Cylinder SVG Animation */}
                <svg viewBox="0 0 700 200" style={{ width: '100%', height: 'auto' }}>
                  <defs>
                    <linearGradient id="animBody" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#475569"/>
                      <stop offset="100%" stopColor="#1e293b"/>
                    </linearGradient>
                    <linearGradient id="animRod" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#bae6fd"/>
                      <stop offset="100%" stopColor="#0284c7"/>
                    </linearGradient>
                    <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  </defs>

                  {/* Ground / mounting surface */}
                  <line x1="20" y1="175" x2="680" y2="175" stroke="#334155" strokeWidth="2"/>
                  {[40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480, 520, 560, 600, 640, 680].map(x => (
                    <line key={x} x1={x} y1="175" x2={x - 12} y2="190" stroke="#334155" strokeWidth="1"/>
                  ))}

                  {/* Cylinder barrel */}
                  <rect x="40" y="80" width="320" height="80" rx="6" fill="url(#animBody)" stroke="#64748b" strokeWidth="2"/>
                  <rect x="40" y="82" width="320" height="16" rx="3" fill="rgba(255,255,255,0.08)"/>
                  {/* Barrel ribs */}
                  {[100, 160, 220, 280].map(x => (
                    <rect key={x} x={x} y="80" width="6" height="80" fill="rgba(0,0,0,0.3)" rx="1"/>
                  ))}

                  {/* Port indicators */}
                  <circle cx="100" cy="84" r="10" fill="#ef4444" opacity="0.9" filter="url(#glow)"/>
                  <text x="100" y="70" textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="bold">P1</text>
                  <circle cx="290" cy="84" r="10" fill="#ef4444" opacity="0.9" filter="url(#glow)"/>
                  <text x="290" y="70" textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="bold">P2</text>

                  {/* Cap left */}
                  <rect x="20" y="72" width="26" height="96" rx="6" fill="#334155" stroke="#64748b" strokeWidth="2"/>

                  {/* Piston (moves with strokeAnim.pct) */}
                  {(() => {
                    const pistonX = 340 + (strokeAnim.pct / 100) * 200;
                    return (
                      <g>
                        {/* Rod */}
                        <rect x="340" y="110" width={pistonX - 320} height="20" rx="2" fill="url(#animRod)" filter={strokeAnim.running ? 'url(#glow)' : 'none'}/>
                        <rect x="340" y="111" width={pistonX - 320} height="6" rx="1" fill="rgba(255,255,255,0.3)"/>
                        {/* Piston disc */}
                        <rect x={pistonX} y="82" width="24" height="76" rx="4" fill="#3b82f6" stroke="#60a5fa" strokeWidth="2" filter={strokeAnim.running ? 'url(#glow)' : 'none'}/>
                        {/* Clevis end */}
                        <rect x={pistonX + 24} y="100" width="30" height="40" rx="4" fill="#0ea5e9" stroke="#38bdf8" strokeWidth="1.5"/>
                        <circle cx={pistonX + 50} cy="120" r="14" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5"/>
                        <circle cx={pistonX + 50} cy="120" r="5" fill="#0f172a"/>
                      </g>
                    );
                  })()}

                  {/* Stroke measurement line */}
                  <line x1="360" y1="165" x2={360 + (strokeAnim.pct / 100) * 200} y2="165" stroke="#a3e635" strokeWidth="2.5" strokeDasharray="6,3"/>
                  <text x={360 + (strokeAnim.pct / 100) * 100} y="158" textAnchor="middle" fontSize="10" fill="#a3e635" fontWeight="bold">
                    {(strokeAnim.pct / 100 * parseFloat(form.strokeData.specStroke || 500)).toFixed(1)} mm
                  </text>
                  {/* End markers */}
                  <line x1="360" y1="160" x2="360" y2="170" stroke="#a3e635" strokeWidth="2"/>
                  <line x1={360 + (strokeAnim.pct / 100) * 200} y1="160" x2={360 + (strokeAnim.pct / 100) * 200} y2="170" stroke="#a3e635" strokeWidth="2"/>

                  {/* Oil flow animation when running */}
                  {strokeAnim.running && (
                    <>
                      <circle r="4" fill={strokeAnim.dir === 1 ? '#3b82f6' : '#ef4444'} opacity="0.7">
                        <animateMotion dur="1.2s" repeatCount="indefinite"
                          path={strokeAnim.dir === 1 ? "M100,84 L100,50 L290,50 L290,84" : "M290,84 L290,50 L100,50 L100,84"}/>
                      </circle>
                      <text x="190" y="42" textAnchor="middle" fontSize="9" fill={strokeAnim.dir === 1 ? '#3b82f6' : '#ef4444'} fontWeight="bold">
                        OIL FLOW → {strokeAnim.dir === 1 ? 'EXTEND' : 'RETRACT'}
                      </text>
                    </>
                  )}
                </svg>

                {/* Controls */}
                <div style={S.btnGroup}>
                  {!strokeAnim.running
                    ? <button style={S.btn('success')} onClick={startStrokeAnim}><Icon.Play /> Mulai Animasi</button>
                    : <button style={S.btn('danger')} onClick={stopStrokeAnim}><Icon.Stop /> Stop</button>
                  }
                  <button style={S.btn('ghost')} onClick={stopStrokeAnim}><Icon.Reset /> Reset</button>
                  <div style={{ background: '#1e293b', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: strokeAnim.dir === 1 ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                      {strokeAnim.running ? (strokeAnim.dir === 1 ? '↗ EXTENDING' : '↙ RETRACTING') : '— IDLE'}
                    </span>
                    <span>|</span>
                    <span>Posisi: <strong style={{ color: '#38bdf8' }}>{strokeAnim.pct.toFixed(1)}%</strong></span>
                    <span>|</span>
                    <span>={' '}<strong style={{ color: '#a3e635' }}>{(strokeAnim.pct / 100 * parseFloat(form.strokeData.specStroke || 500)).toFixed(1)} mm</strong></span>
                  </div>
                </div>
              </div>

              {/* Stroke Measurement Data */}
              <div style={S.card}>
                <div style={S.cardTitle}><Icon.Ruler /> Data Pengukuran Stroke</div>
                <div style={S.row}>
                  <div style={S.fieldGroup}>
                    <label style={S.label}>Stroke Nominal (mm)</label>
                    <input style={S.input} value={form.strokeData.specStroke}
                      onChange={e => setField('strokeData.specStroke', e.target.value)}/>
                  </div>
                  {form.strokeData.measured.map((v, i) => (
                    <div key={i} style={S.fieldGroup}>
                      <label style={S.label}>Pengukuran ke-{i + 1} (mm)</label>
                      <input style={S.input} placeholder="0.000" value={v}
                        onChange={e => handleStrokeMeasure(i, e.target.value)}/>
                    </div>
                  ))}
                  <div style={S.fieldGroup}>
                    <label style={S.label}>Rata-rata Stroke (mm)</label>
                    <input style={{ ...S.input, background: '#0a1628', color: '#a3e635', fontWeight: 700 }}
                      readOnly value={form.strokeData.avgStroke}/>
                  </div>
                  <div style={S.fieldGroup}>
                    <label style={S.label}>Deviasi dari Nominal (mm)</label>
                    <input style={{
                      ...S.input, background: '#0a1628', fontWeight: 700,
                      color: parseFloat(form.strokeData.deviation) > 0.5 || parseFloat(form.strokeData.deviation) < -0.5 ? '#ef4444' : '#10b981'
                    }}
                      readOnly value={form.strokeData.deviation}/>
                  </div>
                </div>
                <div style={S.row}>
                  <div style={S.fieldGroup}>
                    <label style={S.label}>Kelurusan Langkah (mm)</label>
                    <input style={S.input} placeholder="0.000" value={form.strokeData.straightness}
                      onChange={e => setField('strokeData.straightness', e.target.value)}/>
                  </div>
                  <div style={S.fieldGroup}>
                    <label style={S.label}>Drift Test (mm/menit)</label>
                    <input style={S.input} placeholder="0.00" value={form.strokeData.driftTest}
                      onChange={e => setField('strokeData.driftTest', e.target.value)}/>
                  </div>
                  <div style={S.fieldGroup}>
                    <label style={S.label}>Hasil Stroke</label>
                    <StatusBadge status={form.strokeData.strokeResult}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ TAB: SUMMARY ════════════════════ */}
        {activeTab === 'summary' && (
          <div style={S.section}>
            {/* Overall Result Banner */}
            <div style={{
              borderRadius: '16px', padding: '24px 32px', marginBottom: '24px',
              background: failCount > 0 ? 'linear-gradient(135deg,#7f1d1d,#991b1b)' : passCount === totalCount ? 'linear-gradient(135deg,#064e3b,#065f46)' : 'linear-gradient(135deg,#78350f,#92400e)',
              border: `1px solid ${failCount > 0 ? '#ef4444' : passCount === totalCount ? '#10b981' : '#f59e0b'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '4px' }}>HASIL KESELURUHAN INSPEKSI</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
                  {failCount > 0 ? '❌ FAIL — Tidak Sesuai Spesifikasi' : passCount === totalCount ? '✅ PASS — Sesuai Spesifikasi' : '⏳ SEDANG DIPROSES'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                  Part: {form.partNumber} | S/N: {form.serialNumber || '—'} | {form.inspectionDate}
                </div>
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(255,255,255,0.9)' }}>{progress}%</div>
            </div>

            {/* Summary by section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: '2D Dimensi', total: Object.keys(form.dims).length, statuses: Object.values(form.dims).map(d => d.status), color: '#3b82f6' },
                { label: 'GD&T 3D', total: Object.keys(form.gdt).length, statuses: Object.values(form.gdt).map(d => d.status), color: '#8b5cf6' },
                { label: 'Function Test', total: Object.keys(form.funcTests).length, statuses: Object.values(form.funcTests).map(d => d.status), color: '#10b981' },
                { label: 'Pressure Test', total: form.pressureTests.length, statuses: form.pressureTests.map(d => d.result), color: '#f59e0b' },
                { label: 'Visual Inspection', total: Object.keys(form.visual).length, statuses: Object.values(form.visual).map(d => d.status), color: '#06b6d4' },
                { label: 'Stroke Check', total: 1, statuses: [form.strokeData.strokeResult], color: '#a3e635' },
              ].map(sec => {
                const p = sec.statuses.filter(s => s === STATUS.PASS).length;
                const f = sec.statuses.filter(s => s === STATUS.FAIL).length;
                const pct = Math.round((p / sec.total) * 100);
                return (
                  <div key={sec.label} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.85rem' }}>{sec.label}</span>
                      <span style={{ fontSize: '0.75rem', color: sec.color, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={S.progressBar()}><div style={S.progressFill(pct, sec.color)}/></div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '0.75rem' }}>
                      <span style={{ color: '#10b981' }}>✓ {p} Pass</span>
                      <span style={{ color: '#ef4444' }}>✗ {f} Fail</span>
                      <span style={{ color: '#64748b' }}>— {sec.total - p - f} Pending</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Remarks & Signatures */}
            <div style={S.card}>
              <div style={S.cardTitle}>Catatan & Tanda Tangan</div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Catatan Umum / General Remarks</label>
                <textarea style={{ ...S.input, minHeight: '80px', resize: 'vertical', lineHeight: 1.6 }}
                  placeholder="Masukkan catatan umum hasil inspeksi..."
                  value={form.remarks}
                  onChange={e => setField('remarks', e.target.value)}/>
              </div>
              <div style={{ ...S.row, marginTop: '20px' }}>
                {['Diperiksa Oleh (QC)', 'Disetujui Oleh (QA)', 'Mengetahui (Engineer)'].map(sig => (
                  <div key={sig} style={{ textAlign: 'center' }}>
                    <div style={{ height: '60px', border: '1px dashed #334155', borderRadius: '6px', marginBottom: '8px' }}/>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{sig}</div>
                    <div style={{ fontSize: '0.65rem', color: '#475569' }}>Nama & Tanggal</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={S.btnGroup}>
              <button style={S.btn('primary')} onClick={() => alert('Data tersimpan!')}><Icon.Save /> Simpan Data</button>
              <button style={S.btn('success')} onClick={() => window.print()}><Icon.Print /> Cetak Laporan</button>
              <button style={S.btn('ghost')} onClick={() => {
                setForm(f => ({ ...f, overallResult: failCount > 0 ? STATUS.FAIL : passCount === totalCount ? STATUS.PASS : STATUS.PENDING }));
              }}><Icon.Check /> Finalisasi</button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        input:focus, select:focus, textarea:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
        }
        tr:hover td { background: rgba(59,130,246,0.05) !important; }
        button:hover { opacity: 0.9; transform: translateY(-1px); }
        button:active { transform: translateY(0); }
      `}</style>
    </div>
  );
}
