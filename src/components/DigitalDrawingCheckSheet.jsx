import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileCode,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  Printer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Sliders,
  Layers,
  Grid,
  Eye,
  EyeOff,
  Download,
  Share2,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  FileText,
  Save,
  Send,
  MessageCircle,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Info,
  Move,
  Lock,
  Unlock,
  Crosshair
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { getAllDrawings } from '../utils/supabaseUtilityDB';
import whatsappService from '../utils/whatsappService';
import n8nWebhook from '../utils/n8nWebhookService';
import { getCurrentUser } from '../utils/auth';

// High-fidelity Casting Housing Blueprint SVG
const CASTING_HOUSING_SVG = (
  <svg viewBox="0 0 1000 680" width="100%" height="100%" style={{ display: 'block' }}>
    {/* Blueprint Background Grid */}
    <defs>
      <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(203, 213, 225, 0.4)" strokeWidth="0.5" />
      </pattern>
      <linearGradient id="metalBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="innerCavity" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
    </defs>

    <rect width="1000" height="680" fill="#f8fafc" />
    <rect width="1000" height="680" fill="url(#cadGrid)" />

    {/* Technical Drawing Border & Title Block */}
    <rect x="15" y="15" width="970" height="650" fill="none" stroke="#334155" strokeWidth="1.5" />
    <rect x="20" y="20" width="960" height="640" fill="none" stroke="#94a3b8" strokeWidth="0.75" />

    {/* Dimension Rulers on top & left */}
    <g stroke="#94a3b8" strokeWidth="0.5" fontSize="8" fill="#64748b" fontFamily="monospace">
      {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(x => (
        <g key={`rx_${x}`}>
          <line x1={x} y1="15" x2={x} y2="25" />
          <text x={x + 2} y="24">{x}</text>
        </g>
      ))}
      {[100, 200, 300, 400, 500, 600].map(y => (
        <g key={`ry_${y}`}>
          <line x1="15" y1={y} x2="25" y2={y} />
          <text x="18" y={y + 10}>{y}</text>
        </g>
      ))}
    </g>

    {/* Casting Housing Outline & Complex Geometry */}
    <g transform="translate(180, 70)">
      {/* Outer Casting Flange Body */}
      <path
        d="M 120 120 
           Q 220 50, 380 70 
           Q 460 80, 500 130 
           Q 560 190, 580 280 
           Q 590 350, 520 420 
           Q 460 480, 360 470 
           Q 280 470, 200 450 
           Q 130 430, 90 350 
           Q 60 260, 80 180 
           Z"
        fill="url(#metalBody)"
        stroke="#1e293b"
        strokeWidth="2.5"
      />

      {/* Inner Chamber & Cavity */}
      <path
        d="M 140 140 
           Q 230 85, 360 100 
           Q 430 110, 470 150 
           Q 520 200, 540 275 
           Q 545 330, 490 390 
           Q 430 440, 340 430 
           Q 260 430, 180 410 
           Q 120 380, 105 310 
           Q 90 220, 110 160 
           Z"
        fill="url(#innerCavity)"
        stroke="#334155"
        strokeWidth="1.5"
      />

      {/* Internal Ribs & Reinforcements */}
      <path d="M 140 140 L 280 270" stroke="#475569" strokeWidth="1.5" strokeDasharray="4,2" />
      <path d="M 360 100 L 280 270" stroke="#475569" strokeWidth="1.5" strokeDasharray="4,2" />
      <path d="M 470 150 L 280 270" stroke="#475569" strokeWidth="1.5" strokeDasharray="4,2" />
      <path d="M 490 390 L 280 270" stroke="#475569" strokeWidth="1.5" strokeDasharray="4,2" />
      <path d="M 180 410 L 280 270" stroke="#475569" strokeWidth="1.5" strokeDasharray="4,2" />

      {/* Center Main Bore */}
      <circle cx="280" cy="270" r="55" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
      <circle cx="280" cy="270" r="42" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
      <circle cx="280" cy="270" r="30" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1.5" />

      {/* Center Crosshairs */}
      <line x1="200" y1="270" x2="360" y2="270" stroke="#ef4444" strokeWidth="0.75" strokeDasharray="8,3,2,3" />
      <line x1="280" y1="190" x2="280" y2="350" stroke="#ef4444" strokeWidth="0.75" strokeDasharray="8,3,2,3" />

      {/* Secondary Oil Ports / Holes */}
      <circle cx="160" cy="330" r="18" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="370" cy="210" r="16" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="360" cy="310" r="14" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5" />

      {/* Flange Mounting Bolt Holes around perimeter */}
      {[
        { cx: 110, cy: 110 },
        { cx: 230, cy: 65 },
        { cx: 370, cy: 75 },
        { cx: 480, cy: 120 },
        { cx: 550, cy: 190 },
        { cx: 570, cy: 280 },
        { cx: 530, cy: 370 },
        { cx: 440, cy: 450 },
        { cx: 330, cy: 460 },
        { cx: 210, cy: 440 },
        { cx: 110, cy: 370 },
        { cx: 80, cy: 250 }
      ].map((pt, idx) => (
        <g key={idx}>
          <circle cx={pt.cx} cy={pt.cy} r="15" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx={pt.cx} cy={pt.cy} r="8" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
          <line x1={pt.cx - 18} y1={pt.cy} x2={pt.cx + 18} y2={pt.cy} stroke="#ef4444" strokeWidth="0.5" strokeDasharray="3,2" />
          <line x1={pt.cx} y1={pt.cy - 18} x2={pt.cx} y2={pt.cy + 18} stroke="#ef4444" strokeWidth="0.5" strokeDasharray="3,2" />
        </g>
      ))}

      {/* Dimension Extension Lines & Callout Arrows */}
      <g stroke="#334155" strokeWidth="0.75" fill="#334155" fontSize="10" fontFamily="sans-serif">
        {/* Top Overall Dimension ⌀3.90'' / ⌀2.78'' */}
        <line x1="80" y1="30" x2="570" y2="30" />
        <line x1="80" y1="20" x2="80" y2="180" strokeDasharray="2,2" stroke="#94a3b8" />
        <line x1="570" y1="20" x2="570" y2="280" strokeDasharray="2,2" stroke="#94a3b8" />
        <text x="300" y="24" textAnchor="middle" fontWeight="bold">⌀ 3.900"</text>

        {/* Height Dimension */}
        <line x1="40" y1="70" x2="40" y2="470" />
        <line x1="30" y1="70" x2="230" y2="70" strokeDasharray="2,2" stroke="#94a3b8" />
        <line x1="30" y1="470" x2="330" y2="470" strokeDasharray="2,2" stroke="#94a3b8" />
        <text x="32" y="270" textAnchor="middle" transform="rotate(-90 32 270)" fontWeight="bold">⌀ 11.000"</text>

        {/* Center Bore Dimension Callouts */}
        <line x1="280" y1="270" x2="210" y2="170" stroke="#0284c7" strokeWidth="1" />
        <line x1="210" y1="170" x2="150" y2="170" stroke="#0284c7" strokeWidth="1" />
        <text x="145" y="166" textAnchor="end" fill="#0284c7" fontWeight="bold">⌀ 1.000" ±0.015</text>

        {/* Top Right Callout */}
        <line x1="480" y1="120" x2="520" y2="80" stroke="#0284c7" strokeWidth="1" />
        <line x1="520" y1="80" x2="570" y2="80" stroke="#0284c7" strokeWidth="1" />
        <text x="575" y="84" fill="#0284c7" fontWeight="bold">⌀ 1.938"</text>
      </g>
    </g>

    {/* Title Block on Bottom Right */}
    <g transform="translate(680, 550)">
      <rect x="0" y="0" width="290" height="95" fill="#ffffff" stroke="#334155" strokeWidth="1" />
      <line x1="0" y1="25" x2="290" y2="25" stroke="#cbd5e1" />
      <line x1="0" y1="50" x2="290" y2="50" stroke="#cbd5e1" />
      <line x1="0" y1="72" x2="290" y2="72" stroke="#cbd5e1" />
      <line x1="145" y1="25" x2="145" y2="95" stroke="#cbd5e1" />

      <text x="10" y="18" fontSize="10" fontWeight="bold" fill="#0f172a">PART: ENGINE CASTING HOUSING</text>
      <text x="10" y="40" fontSize="8" fill="#64748b">DWG NO: MANDOR-QA-2026-08</text>
      <text x="155" y="40" fontSize="8" fill="#64748b">REV: 2.1 (RELEASED)</text>
      <text x="10" y="64" fontSize="8" fill="#64748b">MATERIAL: A380 DIE CAST AL</text>
      <text x="155" y="64" fontSize="8" fill="#64748b">TOL: ISO 2768-mK</text>
      <text x="10" y="87" fontSize="8" fill="#16a34a" fontWeight="bold">STATUS: QA APPROVED</text>
      <text x="155" y="87" fontSize="8" fill="#64748b">SCALE: 1:1 (FULL)</text>
    </g>
  </svg>
);

// Inspection Check Points Data with exact matching coordinates
const INITIAL_CHECK_POINTS = [
  {
    id: 'cp_1',
    pointNumber: 1,
    title: 'Internal Diameter 1',
    category: 'Diameter',
    nominal: 0.875,
    tolMin: 0.860,
    tolMax: 0.890,
    unit: 'mm',
    x: 290,
    y: 180,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Bore Gauge / Caliper',
    notes: 'Main internal bearing seat diameter'
  },
  {
    id: 'cp_2',
    pointNumber: 2,
    title: 'Hole Depth 2',
    category: 'Depth',
    nominal: 0.575,
    tolMin: 0.560,
    tolMax: 0.590,
    unit: 'mm',
    x: 410,
    y: 135,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Depth Micrometer',
    notes: 'Top mounting bolt hole depth'
  },
  {
    id: 'cp_3',
    pointNumber: 3,
    title: 'Internal Diameter 2',
    category: 'Diameter',
    nominal: 0.370,
    tolMin: 0.350,
    tolMax: 0.390,
    unit: 'mm',
    x: 550,
    y: 145,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Pin Gauge',
    notes: 'Upper right guide pin diameter'
  },
  {
    id: 'cp_4',
    pointNumber: 4,
    title: 'Hole Depth 3',
    category: 'Depth',
    nominal: 1.870,
    tolMin: 1.850,
    tolMax: 1.890,
    unit: 'mm',
    x: 660,
    y: 190,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Digital Caliper',
    notes: 'Side flange step height'
  },
  {
    id: 'cp_5',
    pointNumber: 5,
    title: 'Hole Depth 4',
    category: 'Depth',
    nominal: 0.570,
    tolMin: 0.550,
    tolMax: 0.597,
    unit: 'mm',
    x: 750,
    y: 260,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Depth Gauge',
    notes: 'Right corner bolt hole recess'
  },
  {
    id: 'cp_6',
    pointNumber: 6,
    title: 'Internal Diameter 3',
    category: 'Diameter',
    nominal: 0.370,
    tolMin: 0.350,
    tolMax: 0.387,
    unit: 'mm',
    x: 730,
    y: 415,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Pin Gauge',
    notes: 'Lower right oil drain bore'
  },
  {
    id: 'cp_7',
    pointNumber: 7,
    title: 'Bottom Hole Spacing (PCD)',
    category: 'Distance',
    nominal: 7.960,
    tolMin: 7.910,
    tolMax: 8.010,
    unit: 'mm',
    x: 620,
    y: 485,
    measuredVal: '',
    status: 'PENDING',
    tool: 'CMM / Height Gauge',
    notes: 'Bottom mounting bolt center distance'
  },
  {
    id: 'cp_8',
    pointNumber: 8,
    title: 'Flange Face Runout',
    category: 'GD&T',
    nominal: 0.020,
    tolMin: 0.000,
    tolMax: 0.035,
    unit: 'mm',
    x: 510,
    y: 530,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Dial Indicator',
    notes: 'Mating surface flatness runout'
  },
  {
    id: 'cp_9',
    pointNumber: 9,
    title: 'Oil Passage Diameter',
    category: 'Diameter',
    nominal: 0.500,
    tolMin: 0.480,
    tolMax: 0.520,
    unit: 'mm',
    x: 460,
    y: 380,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Plug Gauge',
    notes: 'Internal oil channel clearance'
  },
  {
    id: 'cp_10',
    pointNumber: 10,
    title: 'Center Bore Main Radius',
    category: 'Radius',
    nominal: 1.000,
    tolMin: 0.985,
    tolMax: 1.015,
    unit: 'inch',
    x: 460,
    y: 340,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Internal Bore Micrometer',
    notes: 'Main crankshaft bearing tunnel'
  },
  {
    id: 'cp_11',
    pointNumber: 11,
    title: 'Left Flange Thickness',
    category: 'Thickness',
    nominal: 0.850,
    tolMin: 0.830,
    tolMax: 0.870,
    unit: 'mm',
    x: 270,
    y: 380,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Outside Micrometer',
    notes: 'Left perimeter wall thickness'
  },
  {
    id: 'cp_12',
    pointNumber: 12,
    title: 'Overall Outer Profile (L)',
    category: 'Dimension',
    nominal: 11.000,
    tolMin: 10.950,
    tolMax: 11.050,
    unit: 'inch',
    x: 260,
    y: 490,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Large Vernier Caliper',
    notes: 'Total outer housing envelope length'
  }
];

const DigitalDrawingCheckSheet = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // State
  const [drawingsList, setDrawingsList] = useState([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState('dwg_cast_housing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('casting');
  
  // Check sheet items state
  const [checkPoints, setCheckPoints] = useState(INITIAL_CHECK_POINTS);
  const [activePointId, setActivePointId] = useState('cp_1');
  const [activeTab, setActiveTab] = useState('Checkers'); // Checkers | Check | All | Summary
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Canvas Viewport State (Zoom & Pan)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showRuler, setShowRuler] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [darkModeBlueprint, setDarkModeBlueprint] = useState(false);

  // Inspector & Work Order Meta
  const [workOrderNo, setWorkOrderNo] = useState('WO-2026-CAST-042');
  const [partSerial, setPartSerial] = useState('SN-8842-A');
  const [inspectorName, setInspectorName] = useState(currentUser?.username || 'QC Officer');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef(null);

  // Load drawings from database / Menu Drawing
  useEffect(() => {
    const fetchDrawings = async () => {
      try {
        const data = await getAllDrawings();
        if (data && data.length > 0) {
          setDrawingsList(data);
        }
      } catch (err) {
        console.warn('Could not load custom drawings:', err);
      }
    };
    fetchDrawings();
  }, []);

  // Calculate Summary Statistics
  const stats = useMemo(() => {
    const total = checkPoints.length;
    const passed = checkPoints.filter(p => p.status === 'OK').length;
    const failed = checkPoints.filter(p => p.status === 'NG').length;
    const pending = checkPoints.filter(p => p.status === 'PENDING').length;
    const progress = Math.round(((passed + failed) / total) * 100);
    const overallStatus = failed > 0 ? 'REJECTED (NG)' : passed === total ? 'PASSED (OK)' : 'IN PROGRESS';
    return { total, passed, failed, pending, progress, overallStatus };
  }, [checkPoints]);

  // Handle Measurement Input Change with instant auto-validation
  const handleMeasurementChange = (id, val) => {
    setCheckPoints(prev => prev.map(pt => {
      if (pt.id !== id) return pt;
      const num = parseFloat(val);
      let status = 'PENDING';
      if (!isNaN(num) && val !== '') {
        if (num >= pt.tolMin && num <= pt.tolMax) {
          status = 'OK';
        } else {
          status = 'NG';
        }
      }
      return { ...pt, measuredVal: val, status };
    }));
  };

  // Toggle Point Status Directly (Pass / Fail / Pending)
  const handleToggleStatus = (id, status) => {
    setCheckPoints(prev => prev.map(pt => {
      if (pt.id !== id) return pt;
      const nextStatus = pt.status === status ? 'PENDING' : status;
      const nominalVal = nextStatus === 'OK' ? pt.nominal.toString() : nextStatus === 'NG' ? (pt.tolMax + 0.1).toFixed(3) : '';
      return { ...pt, status: nextStatus, measuredVal: pt.measuredVal || nominalVal };
    }));
  };

  // Batch Pass All (Quick Pass for batch QA)
  const handlePassAll = () => {
    setCheckPoints(prev => prev.map(pt => ({
      ...pt,
      status: 'OK',
      measuredVal: pt.measuredVal || pt.nominal.toString()
    })));
    toast.success('Semua poin dimensi ditandai PASSED (OK)!');
  };

  // Reset Check Sheet
  const handleResetCheckSheet = () => {
    if (window.confirm('Reset seluruh hasil pengukuran pada check sheet ini?')) {
      setCheckPoints(prev => prev.map(pt => ({ ...pt, measuredVal: '', status: 'PENDING' })));
      toast.info('Check sheet di-reset.');
    }
  };

  // Submit & Save Inspection Check Sheet
  const handleSubmitCheckSheet = async () => {
    if (stats.pending > 0) {
      if (!window.confirm(`Masih ada ${stats.pending} dimensi yang belum diukur. Tetap simpan hasil inspeksi?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    const inspectionPayload = {
      workOrderNo,
      partSerial,
      drawingId: selectedDrawingId,
      inspector: inspectorName,
      timestamp: new Date().toISOString(),
      overallStatus: stats.overallStatus,
      totalPoints: stats.total,
      passedPoints: stats.passed,
      failedPoints: stats.failed,
      passRate: `${Math.round((stats.passed / stats.total) * 100)}%`,
      notes: inspectionNotes,
      details: checkPoints.map(p => ({
        id: p.id,
        pointNumber: p.pointNumber,
        title: p.title,
        nominal: p.nominal,
        measured: p.measuredVal,
        status: p.status,
        tolerance: `${p.tolMin} - ${p.tolMax} ${p.unit}`
      }))
    };

    try {
      // 1. Fire Webhook to n8n Automation Engine
      n8nWebhook.fire(stats.failed > 0 ? 'inspection.failed' : 'inspection.passed', inspectionPayload);

      // 2. WhatsApp Notification if auto-forward is enabled
      const waMsg = `📋 *[DIGITAL QA CHECK SHEET REPORT]*\n` +
        `📍 *WO:* ${workOrderNo} | *Serial:* ${partSerial}\n` +
        `👤 *Inspector:* ${inspectorName}\n` +
        `🎯 *Status:* ${stats.overallStatus}\n` +
        `📊 *Hasil:* ${stats.passed}/${stats.total} PASSED (${stats.passRate || '100%'})\n` +
        (stats.failed > 0 ? `⚠️ *Defect Terdeteksi:* ${stats.failed} item NG\n` : `✅ *Kualitas Terverifikasi OK*\n`) +
        `🕒 *Waktu:* ${new Date().toLocaleTimeString()}`;

      whatsappService.sendMessage({
        sender: inspectorName,
        station: 'QA Station',
        targetName: 'Quality',
        message: waMsg
      }).catch(err => console.warn('WA alert error:', err));

      // 3. Save locally in QA logs
      const localLogs = JSON.parse(localStorage.getItem('mandor_qa_checksheets') || '[]');
      localStorage.setItem('mandor_qa_checksheets', JSON.stringify([inspectionPayload, ...localLogs]));

      toast.success(`Check Sheet berhasil disubmit! Status: ${stats.overallStatus}`);
    } catch (e) {
      toast.error('Gagal menyimpan: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pan Canvas Handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.hotspot-pin')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(Math.max(0.4, prev + delta), 3.0));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Filtered check points for right panel
  const filteredPoints = useMemo(() => {
    return checkPoints.filter(p => {
      if (activeTab === 'Checkers' && p.status === 'PENDING') return true;
      if (activeTab === 'Check' && p.status !== 'PENDING') return true;
      if (activeTab === 'All') return true;
      if (activeTab === 'Summary') return true;
      return true;
    });
  }, [checkPoints, activeTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: '#0f172a', color: '#f8fafc', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <Toaster position="top-right" />

      {/* ─── 1. TOP NAVBAR / HEADER BAR ─────────────────────────────────────── */}
      <div style={{ height: '48px', backgroundColor: '#090d16', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 30 }}>
        {/* Left Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', backgroundColor: '#22c55e', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 900, fontSize: '0.9rem' }}>
              M
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', letterSpacing: '-0.3px' }}>
              Mandor<span style={{ color: '#22c55e' }}>®</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: '#94a3b8' }}>
            <span style={{ cursor: 'pointer', hover: { color: 'white' } }}>File</span>
            <span style={{ cursor: 'pointer' }}>Canvas</span>
            <span style={{ cursor: 'pointer' }}>Help</span>
          </div>
        </div>

        {/* Center Title & Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>
            QA Mandor - Digital Check Sheet & Interactive Drawing Inspection
          </span>
          <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: stats.failed > 0 ? '#ef4444' : stats.passed === stats.total ? '#22c55e' : '#0284c7', color: 'white', fontWeight: 800 }}>
            {stats.overallStatus} ({stats.passed}/{stats.total})
          </span>
        </div>

        {/* Right Header Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Zoom Controller */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: '6px', padding: '2px 6px', gap: '4px' }}>
            <button onClick={() => handleZoom(-0.15)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }} title="Zoom Out"><ZoomOut size={15} /></button>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '42px', textAlign: 'center', color: '#38bdf8' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => handleZoom(0.15)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }} title="Zoom In"><ZoomIn size={15} /></button>
            <button onClick={handleResetView} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', fontSize: '0.7rem' }} title="Reset Fit">Fit</button>
          </div>

          <button onClick={() => setShowRuler(!showRuler)} style={{ background: showRuler ? 'rgba(56, 189, 248, 0.2)' : '#1e293b', border: '1px solid #334155', color: showRuler ? '#38bdf8' : '#94a3b8', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }} title="Toggle Grid / Rulers"><Grid size={15} /></button>
          <button onClick={() => setDarkModeBlueprint(!darkModeBlueprint)} style={{ background: darkModeBlueprint ? 'rgba(34, 197, 94, 0.2)' : '#1e293b', border: '1px solid #334155', color: darkModeBlueprint ? '#22c55e' : '#94a3b8', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }} title="Invert Colors"><Eye size={15} /></button>
          <button onClick={() => window.print()} style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }} title="Print / PDF"><Printer size={15} /></button>
          
          <button
            onClick={() => navigate('/drawings')}
            style={{
              padding: '5px 12px',
              backgroundColor: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileCode size={14} /> Menu Drawing
          </button>
        </div>
      </div>

      {/* ─── 2. MAIN 3-PANEL WORKSPACE ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 340px', overflow: 'hidden' }}>

        {/* ─── LEFT PANEL: DRAWING EXPLORER (FROM MENU DRAWING) ──────────────── */}
        <div style={{ backgroundColor: '#0f172a', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '12px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderOpen size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f1f5f9' }}>Drawing Explorer</span>
            </div>
            <span style={{ fontSize: '0.65rem', backgroundColor: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>Menu Drawing</span>
          </div>

          {/* Search Bar */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: '6px', padding: '4px 8px', gap: '6px' }}>
              <Search size={14} color="#64748b" />
              <input
                placeholder="Cari blueprint / part..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.75rem', outline: 'none', width: '100%' }}
              />
            </div>
          </div>

          {/* Tree Hierarchy */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
            {/* Folder 1: Casting & Housings */}
            <div style={{ marginBottom: '6px' }}>
              <div
                onClick={() => setSelectedFolder(selectedFolder === 'casting' ? null : 'casting')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', backgroundColor: selectedFolder === 'casting' ? 'rgba(56, 189, 248, 0.1)' : 'transparent', color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 700 }}
              >
                {selectedFolder === 'casting' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Folder size={15} color="#38bdf8" />
                <span>Casting Parts & Housings</span>
              </div>

              {selectedFolder === 'casting' && (
                <div style={{ marginLeft: '22px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                  <div
                    onClick={() => setSelectedDrawingId('dwg_cast_housing')}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: selectedDrawingId === 'dwg_cast_housing' ? '#22c55e' : '#1e293b',
                      color: selectedDrawingId === 'dwg_cast_housing' ? '#0f172a' : '#f8fafc',
                      fontSize: '0.74rem',
                      fontWeight: selectedDrawingId === 'dwg_cast_housing' ? 800 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>📄 Engine Casting Housing (Rev 2.1)</span>
                    <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>12 pts</span>
                  </div>

                  <div
                    onClick={() => setSelectedDrawingId('dwg_flange')}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: selectedDrawingId === 'dwg_flange' ? '#22c55e' : 'transparent',
                      color: selectedDrawingId === 'dwg_flange' ? '#0f172a' : '#94a3b8',
                      fontSize: '0.74rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>📄 Flange Connector CAD</span>
                    <span style={{ fontSize: '0.62rem' }}>5 pts</span>
                  </div>
                </div>
              )}
            </div>

            {/* Folder 2: Machining & Precision */}
            <div style={{ marginBottom: '6px' }}>
              <div
                onClick={() => setSelectedFolder(selectedFolder === 'machining' ? null : 'machining')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 700 }}
              >
                {selectedFolder === 'machining' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Folder size={15} color="#fbbf24" />
                <span>Machining & Turning</span>
              </div>
              {selectedFolder === 'machining' && (
                <div style={{ marginLeft: '22px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                  <div style={{ padding: '6px 8px', color: '#94a3b8', fontSize: '0.74rem' }}>📄 Spindle Shaft (Rev 1.0)</div>
                  <div style={{ padding: '6px 8px', color: '#94a3b8', fontSize: '0.74rem' }}>📄 Hydraulic End Cap</div>
                </div>
              )}
            </div>

            {/* Custom drawings from Database */}
            {drawingsList.length > 0 && (
              <div>
                <div style={{ padding: '6px 8px', fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Database Drawings</div>
                {drawingsList.map(dwg => (
                  <div key={dwg.id} style={{ padding: '6px 8px', color: '#cbd5e1', fontSize: '0.74rem', cursor: 'pointer' }}>
                    📄 {dwg.name || dwg.fileName}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Work Order Details */}
          <div style={{ padding: '12px', borderTop: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>WORK ORDER & PART</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <span style={{ color: '#64748b' }}>WO No:</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{workOrderNo}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <span style={{ color: '#64748b' }}>Serial:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{partSerial}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <span style={{ color: '#64748b' }}>Inspector:</span>
              <span style={{ color: '#22c55e', fontWeight: 600 }}>{inspectorName}</span>
            </div>
          </div>
        </div>

        {/* ─── CENTER PANEL: INTERACTIVE BLUEPRINT CANVAS WITH HOTSPOT PINS ──── */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            position: 'relative',
            backgroundColor: darkModeBlueprint ? '#020617' : '#e2e8f0',
            overflow: 'hidden',
            cursor: isPanning ? 'grabbing' : 'crosshair',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Top Canvas HUD Overlay */}
          <div style={{ position: 'absolute', top: '12px', left: '16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crosshair size={15} color="#22c55e" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>Check Sheet Canvas</span>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Klik pin untuk mengukur</span>
            </div>

            <button
              onClick={handlePassAll}
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.9)',
                color: '#0f172a',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={14} /> Pass All Dimensions
            </button>
          </div>

          {/* Zoomable & Pannable Blueprint Wrapper */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
              position: 'relative',
              width: '1000px',
              height: '680px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            {/* 2D SVG Blueprint */}
            {CASTING_HOUSING_SVG}

            {/* Interactive Hotspot Pins (Numbered Circles on Blueprint) */}
            {checkPoints.map((pt) => {
              const isActive = pt.id === activePointId;
              const isOK = pt.status === 'OK';
              const isNG = pt.status === 'NG';
              const isPending = pt.status === 'PENDING';

              const pinBg = isOK ? '#22c55e' : isNG ? '#ef4444' : isActive ? '#38bdf8' : '#0284c7';
              const pinRing = isOK ? 'rgba(34, 197, 94, 0.4)' : isNG ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.5)';

              return (
                <div
                  key={pt.id}
                  className="hotspot-pin"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePointId(pt.id);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${pt.x}px`,
                    top: `${pt.y}px`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: isActive ? 25 : 15,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Pulsing Ring */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-8px',
                      borderRadius: '50%',
                      backgroundColor: pinRing,
                      animation: isPending || isActive ? 'pulse 2s infinite' : 'none',
                      zIndex: -1
                    }}
                  />

                  {/* Pin Circle Body */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: pinBg,
                      color: 'white',
                      border: '2px solid #ffffff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '0.8rem'
                    }}
                  >
                    {isOK ? <Check size={16} strokeWidth={3} /> : isNG ? <X size={16} strokeWidth={3} /> : pt.pointNumber}
                  </div>

                  {/* Tooltip Label on Hover / Active */}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '34px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#0f172a',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                        border: '1px solid #334155',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <span>{pt.pointNumber}. {pt.title}</span>
                      <span style={{ color: '#38bdf8', fontSize: '0.65rem' }}>Nom: {pt.nominal} ({pt.tolMin} - {pt.tolMax} {pt.unit})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── RIGHT PANEL: DIGITAL CHECK SHEET & TOLERANCE TABLE ───────────── */}
        <div style={{ backgroundColor: '#0f172a', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Tabs: Checkers | Check | All | Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderBottom: '1px solid #1e293b', backgroundColor: '#090d16' }}>
            {['Checkers', 'Check', 'All', 'Summary'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 4px',
                  backgroundColor: activeTab === tab ? '#1e293b' : 'transparent',
                  color: activeTab === tab ? '#38bdf8' : '#64748b',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #38bdf8' : '2px solid transparent',
                  fontWeight: activeTab === tab ? 800 : 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table Header */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#090d16' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8' }}>CHECK POINT</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8' }}>TOLERANCE / ACT</span>
          </div>

          {/* Check Points List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {filteredPoints.map((pt) => {
              const isSelected = pt.id === activePointId;
              const isOK = pt.status === 'OK';
              const isNG = pt.status === 'NG';

              return (
                <div
                  key={pt.id}
                  onClick={() => setActivePointId(pt.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    marginBottom: '6px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : '#1e293b',
                    border: isSelected ? '1px solid #0284c7' : isOK ? '1px solid rgba(34, 197, 94, 0.3)' : isNG ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  {/* Top Row: Checkbox, Title & Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={isOK}
                        onChange={() => handleToggleStatus(pt.id, 'OK')}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#22c55e' }}
                      />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                        {pt.pointNumber}. {pt.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(pt.id, 'OK'); }}
                        style={{ padding: '2px 6px', borderRadius: '4px', border: 'none', backgroundColor: isOK ? '#22c55e' : '#334155', color: isOK ? '#0f172a' : '#94a3b8', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        OK
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(pt.id, 'NG'); }}
                        style={{ padding: '2px 6px', borderRadius: '4px', border: 'none', backgroundColor: isNG ? '#ef4444' : '#334155', color: 'white', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        NG
                      </button>
                    </div>
                  </div>

                  {/* Tolerance Range & Numeric Input */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '24px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      Tol: {pt.tolMin} - {pt.tolMax} {pt.unit}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="0.001"
                        placeholder="Nilai..."
                        value={pt.measuredVal}
                        onChange={(e) => handleMeasurementChange(pt.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '75px',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          border: isNG ? '1px solid #ef4444' : isOK ? '1px solid #22c55e' : '1px solid #475569',
                          backgroundColor: '#0f172a',
                          color: isOK ? '#4ade80' : isNG ? '#f87171' : 'white',
                          fontSize: '0.75rem',
                          textAlign: 'right',
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{pt.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inspection Summary Footer & Submit Buttons */}
          <div style={{ padding: '12px', borderTop: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px' }}>
                <span style={{ color: '#cbd5e1' }}>Hasil Pengukuran</span>
                <span style={{ color: stats.failed > 0 ? '#ef4444' : '#22c55e' }}>{stats.passed}/{stats.total} Selesai ({stats.progress}%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${stats.progress}%`, height: '100%', backgroundColor: stats.failed > 0 ? '#ef4444' : '#22c55e', transition: 'width 0.3s' }} />
              </div>
            </div>

            {/* Action Buttons: Cancel & Commit */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleResetCheckSheet}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Reset / Cancel
              </button>

              <button
                onClick={handleSubmitCheckSheet}
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  padding: '10px',
                  backgroundColor: '#22c55e',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 900,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={16} />
                Commit Check Sheet
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DigitalDrawingCheckSheet;
