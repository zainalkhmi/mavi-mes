import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileCode,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
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
  Download,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  FileText,
  Save,
  Send,
  Sparkles,
  RefreshCw,
  Info,
  Crosshair,
  ShieldCheck,
  Award,
  Clock,
  User,
  FolderArchive,
  Wrench,
  BarChart2,
  FileCheck,
  ClipboardList,
  SlidersHorizontal,
  ChevronLeft,
  Filter,
  CheckSquare,
  AlertCircle,
  Database,
  Table,
  Settings2,
  Plus,
  ExternalLink,
  HardDrive,
  Globe,
  Upload,
  QrCode,
  Link,
  Smartphone,
  Copy,
  CheckCircle,
  Pencil,
  Square,
  Circle,
  ArrowUpRight,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Highlighter,
  MousePointer,
  Pen, // Handwriting input icon
  Thermometer,
  Droplets,
  ShieldAlert,
  History,
  Lock,
  Tag
} from 'lucide-react';
import NumpadInput from './NumpadInput';
import CameraInput from './CameraInput';
import CheckTabContent from './CheckTabContent';
import VirtualMeasuringTool from './checksheet/VirtualMeasuringTool';
import MetrologyHardwareHub from './checksheet/MetrologyHardwareHub';
import CameraOCRReader from './checksheet/CameraOCRReader';
import MeasurementTypeVisual from './checksheet/MeasurementTypeVisual';
import MobileTabletCheckSheet from './checksheet/MobileTabletCheckSheet';
import {
  NCRDefectModal,
  OfficialNCRFormModal,
  AuditTrailModal,
  SupervisorApprovalModal,
  EnvironmentSettingsModal
} from './checksheet/ISOComplianceModals';

// ─── BALLOON CATEGORY & QC COLOR PALETTE (SYNCED WITH INSPECTOR STUDIO) ───
const getCategoryColor = (category) => {
  switch (category?.toLowerCase()) {
    case 'diameter':
    case 'diameter (od/id)':
      return '#8b5cf6'; // Electric Purple
    case 'radius':
    case 'radius & chamfer':
      return '#06b6d4'; // Cyan
    case 'length':
    case 'linear dimension':
      return '#3b82f6'; // Vibrant Royal Blue
    case 'angle':
    case 'angular / draft':
      return '#ec4899'; // Hot Pink
    case 'gdt':
    case 'gd&t feature':
      return '#f59e0b'; // Amber Gold
    case 'visual':
    case 'visual & surface':
      return '#10b981'; // Emerald Green
    case 'thread':
    case 'thread & pitch':
      return '#6366f1'; // Indigo
    default:
      return '#3b82f6'; // Vibrant Blue
  }
};
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { getAllDrawings, drawingsLocalDB } from '../utils/supabaseUtilityDB';
import { getTables, addTableRecord, createTable } from '../utils/supabaseTablesDB';
import n8nWebhook from '../utils/n8nWebhookService';
import { getCurrentUser } from '../utils/auth';

// ─── ISO 9001:2015 / IATF 16949 High-Fidelity Symmetrical Casting Housing Blueprint SVG ───
const CASTING_HOUSING_SVG = (
  <svg viewBox="0 0 1000 680" width="100%" height="100%" style={{ display: 'block' }}>
    {/* Blueprint Background Grid */}
    <defs>
      <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(203, 213, 225, 0.45)" strokeWidth="0.5" />
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

    {/* Symmetrically Centered Casting Housing Outline */}
    <g transform="translate(145, 60)">
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
        {/* Top Overall Dimension */}
        <line x1="80" y1="30" x2="570" y2="30" />
        <line x1="80" y1="20" x2="80" y2="180" strokeDasharray="2,2" stroke="#94a3b8" />
        <line x1="570" y1="20" x2="570" y2="280" strokeDasharray="2,2" stroke="#94a3b8" />
        <text x="320" y="24" textAnchor="middle" fontWeight="bold">⌀ 3.900" ±0.010</text>

        {/* Height Dimension */}
        <line x1="35" y1="70" x2="35" y2="470" />
        <line x1="25" y1="70" x2="230" y2="70" strokeDasharray="2,2" stroke="#94a3b8" />
        <line x1="25" y1="470" x2="330" y2="470" strokeDasharray="2,2" stroke="#94a3b8" />
        <text x="28" y="270" textAnchor="middle" transform="rotate(-90 28 270)" fontWeight="bold">⌀ 11.000" ±0.050</text>

        {/* Center Bore Dimension Callouts */}
        <line x1="280" y1="270" x2="200" y2="170" stroke="#0284c7" strokeWidth="1" />
        <line x1="200" y1="170" x2="140" y2="170" stroke="#0284c7" strokeWidth="1" />
        <text x="135" y="166" textAnchor="end" fill="#0284c7" fontWeight="bold">⌀ 1.000" ±0.015</text>

        {/* Top Right Callout */}
        <line x1="480" y1="120" x2="520" y2="80" stroke="#0284c7" strokeWidth="1" />
        <line x1="520" y1="80" x2="570" y2="80" stroke="#0284c7" strokeWidth="1" />
        <text x="575" y="84" fill="#0284c7" fontWeight="bold">⌀ 1.938" ±0.020</text>
      </g>
    </g>

    {/* ISO 7200 Professional Engineering Title Block */}
    <g transform="translate(670, 540)">
      <rect x="0" y="0" width="300" height="105" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
      <line x1="0" y1="28" x2="300" y2="28" stroke="#334155" strokeWidth="1" />
      <line x1="0" y1="54" x2="300" y2="54" stroke="#cbd5e1" />
      <line x1="0" y1="78" x2="300" y2="78" stroke="#cbd5e1" />
      <line x1="150" y1="28" x2="150" y2="105" stroke="#cbd5e1" />

      {/* Company / Document Header */}
      <text x="10" y="19" fontSize="11" fontWeight="bold" fill="#0f172a">PART: ENGINE CASTING HOUSING</text>
      <text x="210" y="18" fontSize="8" fontWeight="bold" fill="#0284c7">ISO 9001:2015</text>

      <text x="10" y="44" fontSize="8.5" fill="#475569">DWG NO: <tspan fontWeight="bold" fill="#0f172a">MANDOR-QA-2026-08</tspan></text>
      <text x="160" y="44" fontSize="8.5" fill="#475569">REV: <tspan fontWeight="bold" fill="#0f172a">2.1 (RELEASED)</tspan></text>

      <text x="10" y="69" fontSize="8" fill="#475569">MATERIAL: A380 DIE CAST AL</text>
      <text x="160" y="69" fontSize="8" fill="#475569">TOL: ISO 2768-mK</text>

      <text x="10" y="93" fontSize="8.5" fill="#16a34a" fontWeight="bold">STATUS: QA APPROVED</text>
      <text x="160" y="93" fontSize="8" fill="#475569">SCALE: 1:1 (FULL A3)</text>
    </g>
  </svg>
);

// ─── ISO 9001:2015 / IATF 16949 Checkpoints with Calibrated Gauge Traceability ───
const INITIAL_CHECK_POINTS = [
  {
    id: 'cp_1',
    pointNumber: 1,
    title: 'Internal Bearing Seat ⌀',
    category: 'Diameter',
    nominal: 0.875,
    tolMin: 0.860,
    tolMax: 0.890,
    unit: 'mm',
    x: 255,
    y: 170,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Digital Bore Gauge',
    toolId: 'BG-014',
    calExpiry: '2026-12-31',
    criticality: 'Critical (CC)',
    gdtSymbol: '⌀',
    disposition: 'Pending Inspection',
    notes: 'Main internal bearing seat diameter'
  },
  {
    id: 'cp_2',
    pointNumber: 2,
    title: 'Top Bolt Hole Depth',
    category: 'Depth',
    nominal: 0.575,
    tolMin: 0.560,
    tolMax: 0.590,
    unit: 'mm',
    x: 375,
    y: 125,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Depth Micrometer',
    toolId: 'DM-008',
    calExpiry: '2026-11-15',
    criticality: 'Major',
    gdtSymbol: '⏥',
    disposition: 'Pending Inspection',
    notes: 'Top mounting bolt hole depth'
  },
  {
    id: 'cp_3',
    pointNumber: 3,
    title: 'Guide Pin Bore ⌀',
    category: 'Diameter',
    nominal: 0.370,
    tolMin: 0.350,
    tolMax: 0.390,
    unit: 'mm',
    x: 515,
    y: 135,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Pin Gauge Set',
    toolId: 'PG-022',
    calExpiry: '2027-02-28',
    criticality: 'Major',
    gdtSymbol: '⌀',
    disposition: 'Pending Inspection',
    notes: 'Upper right guide pin diameter'
  },
  {
    id: 'cp_4',
    pointNumber: 4,
    title: 'Side Step Height',
    category: 'Depth',
    nominal: 1.870,
    tolMin: 1.850,
    tolMax: 1.890,
    unit: 'mm',
    x: 625,
    y: 180,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Digital Caliper 0-150mm',
    toolId: 'CAL-003',
    calExpiry: '2026-10-30',
    criticality: 'Minor',
    gdtSymbol: '⏥',
    disposition: 'Pending Inspection',
    notes: 'Side flange step height'
  },
  {
    id: 'cp_5',
    pointNumber: 5,
    title: 'Corner Recess Depth',
    category: 'Depth',
    nominal: 0.570,
    tolMin: 0.550,
    tolMax: 0.597,
    unit: 'mm',
    x: 695,
    y: 250,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Depth Gauge',
    toolId: 'DG-012',
    calExpiry: '2026-12-15',
    criticality: 'Minor',
    gdtSymbol: '⏥',
    disposition: 'Pending Inspection',
    notes: 'Right corner bolt hole recess'
  },
  {
    id: 'cp_6',
    pointNumber: 6,
    title: 'Drain Port Internal ⌀',
    category: 'Diameter',
    nominal: 0.370,
    tolMin: 0.350,
    tolMax: 0.387,
    unit: 'mm',
    x: 715,
    y: 340,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Plug Gauge',
    toolId: 'PLG-005',
    calExpiry: '2027-01-20',
    criticality: 'Major',
    gdtSymbol: '⌀',
    disposition: 'Pending Inspection',
    notes: 'Lower right oil drain bore'
  },
  {
    id: 'cp_7',
    pointNumber: 7,
    title: 'Bottom Bolt Spacing (PCD)',
    category: 'Distance',
    nominal: 7.960,
    tolMin: 7.910,
    tolMax: 8.010,
    unit: 'mm',
    x: 675,
    y: 430,
    measuredVal: '',
    status: 'PENDING',
    tool: 'CMM Zeiss Contura',
    toolId: 'CMM-001',
    calExpiry: '2027-04-10',
    criticality: 'Critical (CC)',
    gdtSymbol: '⌖',
    disposition: 'Pending Inspection',
    notes: 'Bottom mounting bolt center distance'
  },
  {
    id: 'cp_8',
    pointNumber: 8,
    title: 'Flange Face Flatness',
    category: 'GD&T',
    nominal: 0.020,
    tolMin: 0.000,
    tolMax: 0.035,
    unit: 'mm',
    x: 585,
    y: 510,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Dial Indicator (0.001mm)',
    toolId: 'DI-007',
    calExpiry: '2026-11-20',
    criticality: 'Critical (CC)',
    gdtSymbol: '⏥',
    disposition: 'Pending Inspection',
    notes: 'Mating surface flatness runout'
  },
  {
    id: 'cp_9',
    pointNumber: 9,
    title: 'Lower Bolt PCD Radius',
    category: 'Distance',
    nominal: 4.500,
    tolMin: 4.460,
    tolMax: 4.540,
    unit: 'mm',
    x: 475,
    y: 520,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Height Gauge',
    toolId: 'HG-002',
    calExpiry: '2026-12-05',
    criticality: 'Major',
    gdtSymbol: '⌖',
    disposition: 'Pending Inspection',
    notes: 'Lower mounting PCD alignment'
  },
  {
    id: 'cp_10',
    pointNumber: 10,
    title: 'Main Crankshaft Bore ⌀',
    category: 'Radius',
    nominal: 1.000,
    tolMin: 0.985,
    tolMax: 1.015,
    unit: 'inch',
    x: 425,
    y: 330,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Inside Micrometer',
    toolId: 'IM-004',
    calExpiry: '2027-03-15',
    criticality: 'Critical (CC)',
    gdtSymbol: '⌀',
    disposition: 'Pending Inspection',
    notes: 'Main crankshaft bearing tunnel'
  },
  {
    id: 'cp_11',
    pointNumber: 11,
    title: 'Center Chamber Clearance',
    category: 'Diameter',
    nominal: 1.400,
    tolMin: 1.380,
    tolMax: 1.420,
    unit: 'inch',
    x: 425,
    y: 275,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Inside Micrometer',
    toolId: 'IM-004',
    calExpiry: '2027-03-15',
    criticality: 'Major',
    gdtSymbol: '⌀',
    disposition: 'Pending Inspection',
    notes: 'Internal rotor pocket clearance'
  },
  {
    id: 'cp_12',
    pointNumber: 12,
    title: 'Left Wall Flange Thickness',
    category: 'Thickness',
    nominal: 0.850,
    tolMin: 0.830,
    tolMax: 0.870,
    unit: 'mm',
    x: 255,
    y: 430,
    measuredVal: '',
    status: 'PENDING',
    tool: 'Outside Micrometer',
    toolId: 'OM-002',
    calExpiry: '2026-10-18',
    criticality: 'Major',
    gdtSymbol: '⏥',
    disposition: 'Pending Inspection',
    notes: 'Left perimeter wall thickness'
  }
];

export default function DigitalDrawingCheckSheet() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentUser = getCurrentUser();

  // Helper: load checkPoints from published checksheet or saved templates
  const loadCheckPoints = () => {
    try {
      const published = localStorage.getItem('mandor_published_checksheet');
      if (published) {
        const cs = JSON.parse(published);
        if (cs.checkPoints && Array.isArray(cs.checkPoints) && cs.checkPoints.length > 0) {
          return cs.checkPoints.map((p, i) => ({
            id: p.id || `cp_${i + 1}`,
            pointNumber: p.pointNumber || i + 1,
            title: p.title || `Point ${i + 1}`,
            category: p.category || 'Dimension',
            nominal: parseFloat(p.nominal) || 0,
            tolMin: parseFloat(p.tolMin !== undefined ? p.tolMin : (p.toleranceMin || 0)),
            tolMax: parseFloat(p.tolMax !== undefined ? p.tolMax : (p.toleranceMax || 0)),
            unit: p.unit || 'mm',
            x: p.x !== undefined ? p.x : 200,
            y: p.y !== undefined ? p.y : 200,
            measuredVal: p.measuredVal || '',
            status: p.status || 'PENDING',
            tool: p.tool || p.inspectionMethod || 'Gauge',
            criticality: p.criticality || 'Major',
            notes: p.notes || '',
            disposition: p.disposition || 'Pending Inspection'
          }));
        }
      }

      const saved = localStorage.getItem('mandor_inspector_templates');
      if (saved) {
        const templates = JSON.parse(saved);
        if (Array.isArray(templates) && templates.length > 0) {
          const firstTemplate = templates[0];
          if (firstTemplate.checkPoints?.length > 0) {
            return firstTemplate.checkPoints.map((p, i) => ({
              id: p.id || `cp_${i + 1}`,
              pointNumber: p.pointNumber || i + 1,
              title: p.title || `Point ${i + 1}`,
              category: p.category || 'Dimension',
              nominal: parseFloat(p.nominal) || 0,
              tolMin: parseFloat(p.tolMin !== undefined ? p.tolMin : (p.toleranceMin || 0)),
              tolMax: parseFloat(p.tolMax !== undefined ? p.tolMax : (p.toleranceMax || 0)),
              unit: p.unit || 'mm',
              x: p.x !== undefined ? p.x : 200,
              y: p.y !== undefined ? p.y : 200,
              measuredVal: '',
              status: 'PENDING',
              tool: p.tool || 'Gauge',
              criticality: p.criticality || 'Major',
              notes: p.notes || '',
              disposition: 'Pending Inspection'
            }));
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load initial checkPoints:', e);
    }
    return INITIAL_CHECK_POINTS;
  };

  const [selectedDrawingId, setSelectedDrawingId] = useState(() => {
    try {
      const pub = JSON.parse(localStorage.getItem('mandor_published_checksheet') || '{}');
      if (pub.drawingId) return pub.drawingId;
      return localStorage.getItem('mandor_checksheet_active_drawing_id') || 'dwg_cast_housing';
    } catch {
      return 'dwg_cast_housing';
    }
  });

  const [drawingsList, setDrawingsList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mandor_checksheet_drawings') || '[]');
    } catch {
      return [];
    }
  });

  // Check sheet items state
  const [checkPoints, setCheckPoints] = useState(loadCheckPoints);
  const [activePointId, setActivePointId] = useState(() => {
    try {
      const pub = JSON.parse(localStorage.getItem('mandor_published_checksheet') || '{}');
      if (pub.checkPoints && pub.checkPoints[0]?.id) return pub.checkPoints[0].id;
    } catch {
      // Fallback
    }
    return 'cp_1';
  });
  const [activeTab, setActiveTab] = useState('Check'); // Check (Focus) is default
  const [filterCriticality, setFilterCriticality] = useState('ALL');

  // Canvas Viewport State (Zoom & Pan)
  const [zoom, setZoom] = useState(0.92);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showRuler, setShowRuler] = useState(true);
  const [darkModeBlueprint, setDarkModeBlueprint] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // ISO 9001 Traceability & Work Order Metadata
  const [workOrderNo, setWorkOrderNo] = useState('WO-2026-CAST-042');
  const [partSerial, setPartSerial] = useState('SN-8842-A');
  const [lotBatchNo, setLotBatchNo] = useState('LOT-202608-01');
  const [stationId, setStationId] = useState('ST-CNC-04');
  const [shiftNo] = useState('Shift 1 (Day)');
  const [inspectorName, setInspectorName] = useState(currentUser?.username || 'QC Officer (Budi S.)');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Part & Document Metadata (loaded from published checksheet) ──
  const [partNo, setPartNo] = useState('');
  const [partName, setPartName] = useState('');
  const [customer, setCustomer] = useState('');
  const [processName, setProcessName] = useState('');
  const [docNo, setDocNo] = useState('');
  const [revisionNo, setRevisionNo] = useState('1.0');
  const [approverName, setApproverName] = useState('');

  // Data Source / Target Table State
  const [availableTables, setAvailableTables] = useState([]);
  const [targetTableId, setTargetTableId] = useState(() => localStorage.getItem('mandor_checksheet_target_table_id') || '');
  const [showTableConfigModal, setShowTableConfigModal] = useState(false);
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [showPrintTemplateModal, setShowPrintTemplateModal] = useState(false);
  const [selectedPrintTemplateId, setSelectedPrintTemplateId] = useState('qc-inspection-checksheet-a4');
  const [availablePrintTemplates, setAvailablePrintTemplates] = useState([]);
  // ── Blueprint Drawing Preview (loaded from published checksheet) ──
  const [drawingPreview, setDrawingPreview] = useState(null);

  // Publish & Companion State
  const [isPublished, setIsPublished] = useState(() => localStorage.getItem('mandor_checksheet_published') === 'true');
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [companionLink, setCompanionLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // ─── ISO 9001:2015 & IATF 16949 Compliance State ───
  const [temperature, setTemperature] = useState('20.0'); // ISO 1 Standard (20°C)
  const [humidity, setHumidity] = useState('52'); // % RH
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [showWatermark] = useState(true);
  const [isMobileTabletModeActive, setIsMobileTabletModeActive] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return true;
    return false;
  });

  // Clause 8.7: Non-Conformance Reports (NCR) & Defect Management
  const [ncrList, setNcrList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mandor_checksheet_ncrs') || '[]');
    } catch {
      return [];
    }
  });
  const [activeNCRPoint, setActiveNCRPoint] = useState(null);
  const [showNCRModal, setShowNCRModal] = useState(false);
  const [selectedNCRForView, setSelectedNCRForView] = useState(null);

  // Clause 7.5.3: ISO Audit Trail & Revision History
  const [auditTrail, setAuditTrail] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mandor_checksheet_audit_trail') || '[]');
    } catch {
      return [];
    }
  });
  const [showAuditTrailModal, setShowAuditTrailModal] = useState(false);

  // Clause 8.6: Two-Tier Maker-Checker Supervisor Sign-Off
  const [supervisorApproval, setSupervisorApproval] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mandor_checksheet_supervisor_approval') || '{"isApproved":false}');
    } catch {
      return { isApproved: false };
    }
  });
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);

  // Clause 7.1.5: Measuring Equipment & Calibration Log
  const [gaugesList] = useState([
    { id: 'CAL-003', name: 'Digital Caliper 0-150mm', type: 'Caliper', serial: 'SN-MITU-9921', calDate: '2025-10-30', dueDate: '2026-10-30', status: 'VALID', certNo: 'CAL-CERT-2025-881' },
    { id: 'MIC-102', name: 'Outside Micrometer 0-25mm', type: 'Micrometer', serial: 'SN-MITU-4412', calDate: '2026-01-15', dueDate: '2027-01-15', status: 'VALID', certNo: 'CAL-CERT-2026-102' },
    { id: 'CMM-001', name: 'Zeiss Contura 3D CMM', type: 'CMM', serial: 'SN-ZEISS-770', calDate: '2026-04-10', dueDate: '2027-04-10', status: 'VALID', certNo: 'CAL-CERT-2026-001' },
    { id: 'DI-007', name: 'Dial Indicator (0.001mm)', type: 'Dial', serial: 'SN-TECLOCK-12', calDate: '2025-08-01', dueDate: '2026-08-01', status: 'EXPIRING_SOON', certNo: 'CAL-CERT-2025-007' },
    { id: 'BG-014', name: 'Digital Bore Gauge 18-35mm', type: 'Bore Gauge', serial: 'SN-BG-338', calDate: '2025-12-31', dueDate: '2026-12-31', status: 'VALID', certNo: 'CAL-CERT-2025-014' },
    { id: 'HG-002', name: 'Digital Height Gauge 300mm', type: 'Height Gauge', serial: 'SN-MITU-002', calDate: '2025-12-05', dueDate: '2026-12-05', status: 'VALID', certNo: 'CAL-CERT-2025-002' }
  ]);

  // ─── Handwriting Input State ───
  const [showHandwritingModal, setShowHandwritingModal] = useState(false);
  const [handwritingTargetPointId, setHandwritingTargetPointId] = useState(null);

  const handleOpenHandwriting = (pointId) => {
    setHandwritingTargetPointId(pointId);
    setShowHandwritingModal(true);
  };

  // Handle recognition result
  const handleHandwritingRecognize = (value) => {
    if (handwritingTargetPointId && value) {
      handleMeasurementChange(handwritingTargetPointId, value);
      toast.success(`Nilai "${value}" berhasil dimasukkan!`);
    }
    setShowHandwritingModal(false);
    setHandwritingTargetPointId(null);
  };

  // ─── Animated Virtual Gauge & Metrology SOP State ───
  const [showVirtualGauge, setShowVirtualGauge] = useState(false);

  // ─── Blueprint Markup & Annotations Display (Created in Inspector Designer Studio) ───
  const [isDrawingMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState('pen');
  const [drawingColor] = useState('#ef4444');
  const [drawingSize] = useState(1.8);
  const [drawings, setDrawings] = useState(() => {
    try {
      const inspectorDrawings = localStorage.getItem('mandor_inspector_drawings');
      if (inspectorDrawings) return JSON.parse(inspectorDrawings);
      return JSON.parse(localStorage.getItem('mandor_checksheet_drawings') || '[]');
    } catch {
      return [];
    }
  });
  const [currentStroke, setCurrentStroke] = useState([]);
  const [shapeStart, setShapeStart] = useState(null);
  const [shapeCurrent, setShapeCurrent] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [_redoStack, setRedoStack] = useState([]);
  const [showStampModal, setShowStampModal] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState('approve');
  const [stamps, setStamps] = useState(() => {
    try {
      const inspectorStamps = localStorage.getItem('mandor_inspector_stamps');
      if (inspectorStamps) return JSON.parse(inspectorStamps);
      return JSON.parse(localStorage.getItem('mandor_checksheet_stamps') || '[]');
    } catch {
      return [];
    }
  });
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState(null);
  const [textInputValue, setTextInputValue] = useState('');
  const drawingCanvasRef = useRef(null);

  // Synchronize drawings and stamps to local storage
  useEffect(() => {
    try {
      localStorage.setItem('mandor_checksheet_drawings', JSON.stringify(drawings));
    } catch (err) {
      console.warn('Failed to persist drawings:', err);
    }
  }, [drawings]);

  useEffect(() => {
    try {
      localStorage.setItem('mandor_checksheet_stamps', JSON.stringify(stamps));
    } catch (err) {
      console.warn('Failed to persist stamps:', err);
    }
  }, [stamps]);

  // Drawing colors palette
  const DRAWING_COLORS = [
    { color: '#ef4444', name: 'Merah' },
    { color: '#f59e0b', name: 'Kuning' },
    { color: '#22c55e', name: 'Hijau' },
    { color: '#3b82f6', name: 'Biru' },
    { color: '#8b5cf6', name: 'Ungu' },
    { color: '#0f172a', name: 'Hitam' },
    { color: '#ffffff', name: 'Putih' },
  ];

  // Drawing sizes
  const DRAWING_SIZES = [
    { size: 1, label: 'Halus (1px)' },
    { size: 1.8, label: 'Normal (1.8px)' },
    { size: 3, label: 'Tebal (3px)' },
    { size: 5, label: 'Ekstra (5px)' },
  ];

  // Stamp definitions
  const STAMPS = [
    { id: 'approve', label: 'APPROVED', icon: '✓', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e' },
    { id: 'reject', label: 'REJECTED', icon: '✗', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444' },
    { id: 'hold', label: 'HOLD', icon: '⏸', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b' },
    { id: 'review', label: 'REVIEW', icon: '👁', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6' },
    { id: 'absolute', label: 'ABSOLUTE', icon: '◎', color: '#0f172a', bg: 'rgba(15, 23, 42, 0.1)', border: '#0f172a' },
    { id: 'ncr', label: 'NCR', icon: '⚠', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)', border: '#dc2626' },
    { id: 'qa', label: 'QA PASS', icon: '★', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.15)', border: '#16a34a' },
    { id: 'witness', label: 'WITNESS', icon: '👁', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.15)', border: '#7c3aed' },
    { id: 'date', label: 'DATE', icon: '📅', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', border: '#64748b' },
    { id: 'init', label: 'INITIAL', icon: '✍', color: '#0891b2', bg: 'rgba(8, 145, 178, 0.15)', border: '#0891b2' },
  ];

  const containerRef = useRef(null);

  // Active check point helper
  const activePt = useMemo(() => {
    return checkPoints.find(p => p.id === activePointId) || checkPoints[0];
  }, [checkPoints, activePointId]);

  // Target table helper
  const targetTable = useMemo(() => {
    return availableTables.find(t => t.id === targetTableId) || null;
  }, [availableTables, targetTableId]);

  // Handle URL query parameters (e.g. #/drawing-checksheet?wo=WO-2026-CAST-042&sn=SN-8842-A)
  useEffect(() => {
    let wo = searchParams.get('wo');
    let sn = searchParams.get('sn');
    let lot = searchParams.get('lot');
    let station = searchParams.get('station');
    let insp = searchParams.get('inspector');
    let mode = searchParams.get('mode');

    // Also parse hash params if any
    if ((!wo || !sn) && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      const hp = new URLSearchParams(hashQuery);
      wo = wo || hp.get('wo');
      sn = sn || hp.get('sn');
      lot = lot || hp.get('lot');
      station = station || hp.get('station');
      insp = insp || hp.get('inspector');
      mode = mode || hp.get('mode');
    }

    if (wo) setWorkOrderNo(wo);
    if (sn) setPartSerial(sn);
    if (lot) setLotBatchNo(lot);
    if (station) setStationId(station);
    if (insp) setInspectorName(insp);

    if (mode === 'focus' || mode === 'inspect') {
      setActiveTab('Check');
    }
  }, [searchParams, location]);

  // ── Load part/document metadata from in-memory / published checksheet / IndexedDB ──
  useEffect(() => {
    const loadPublishedData = async () => {
      try {
        const memCs = typeof window !== 'undefined' ? window.__mandor_active_checksheet : null;
        const memSvg = typeof window !== 'undefined' ? window.__mandor_active_drawing_svg : null;

        const saved = localStorage.getItem('mandor_published_checksheet');
        const cs = memCs || (saved ? JSON.parse(saved) : null);

        if (cs) {
          if (cs.partNo) setPartNo(cs.partNo);
          if (cs.partName) setPartName(cs.partName);
          if (cs.name && !cs.partName) setPartName(cs.name);
          if (cs.customer) setCustomer(cs.customer);
          if (cs.process) setProcessName(cs.process);
          if (cs.processName && !cs.process) setProcessName(cs.processName);
          if (cs.docNo) setDocNo(cs.docNo);
          if (cs.revisionNo) setRevisionNo(cs.revisionNo);
          if (cs.revision && !cs.revisionNo) setRevisionNo(cs.revision);
          if (cs.approver) setApproverName(cs.approver);
          if (cs.approverName && !cs.approver) setApproverName(cs.approverName);

          // ── Load blueprint drawing preview (In-memory > cs.drawingSvg > IndexedDB) ──
          if (memSvg) {
            setDrawingPreview(memSvg);
          } else if (cs.drawingSvg) {
            setDrawingPreview(cs.drawingSvg);
          } else if (cs.drawingId) {
            setSelectedDrawingId(cs.drawingId);
            if (drawingsLocalDB) {
              try {
                const idbItem = await drawingsLocalDB.drawings.get(cs.drawingId);
                if (idbItem && (idbItem.svgData || idbItem.dataUrl)) {
                  setDrawingPreview(idbItem.svgData || idbItem.dataUrl);
                }
              } catch (idbErr) {
                console.warn('[DigitalCheckSheet] IndexedDB load error:', idbErr);
              }
            }
          }

          // Also load checkPoints from published checksheet if available
          if (cs.checkPoints && Array.isArray(cs.checkPoints) && cs.checkPoints.length > 0) {
            const loadedPoints = cs.checkPoints.map((p, i) => ({
              ...p,
              id: p.id || `cp_${i + 1}`,
              pointNumber: p.pointNumber || i + 1,
              nominal: parseFloat(p.nominal) || 0,
              tolMin: parseFloat(p.tolMin !== undefined ? p.tolMin : (p.toleranceMin || 0)),
              tolMax: parseFloat(p.tolMax !== undefined ? p.tolMax : (p.toleranceMax || 0)),
              unit: p.unit || 'mm',
              x: p.x !== undefined ? p.x : 200,
              y: p.y !== undefined ? p.y : 200,
              measuredVal: p.measuredVal || p.measuredValue || '',
              status: p.status || 'PENDING',
              criticality: p.criticality || 'Major',
              tool: p.tool || p.inspectionMethod || 'Gauge',
              notes: p.notes || '',
              disposition: p.disposition || 'Pending Inspection'
            }));
            setCheckPoints(loadedPoints);
            if (loadedPoints.length > 0) {
              setActivePointId(loadedPoints[0].id);
            }
          }
        }
      } catch (e) {
        console.warn('[DigitalCheckSheet] Failed to load published checksheet metadata:', e);
      }
    };

    loadPublishedData();
  }, [drawingsList]);

  // ── Load blueprint drawing when drawingsList becomes available ──
  useEffect(() => {
    if (!drawingPreview && selectedDrawingId && drawingsList.length > 0) {
      const found = drawingsList.find(d => d.id === selectedDrawingId);
      if (found) {
        setDrawingPreview(found.svgData || found.dataUrl || found.url || null);
      }
    }
  }, [drawingsList, selectedDrawingId, drawingPreview]);

  // ── Load available print templates from ReportDesigner ──
  useEffect(() => {
    const loadPrintTemplates = async () => {
      try {
        const { getSavedReportTemplates } = await import('../utils/reportPrintService');
        const allTemplates = getSavedReportTemplates();
        // Filter to QC-related templates only
        const qcTemplates = allTemplates.filter(t =>
          (t.category === 'Quality Control' || t.id.includes('checksheet') || t.id.includes('inspection'))
        );
        setAvailablePrintTemplates(qcTemplates);
      } catch (e) {
        console.warn('[DigitalCheckSheet] Failed to load print templates:', e);
      }
    };
    loadPrintTemplates();
  }, []);

  // Load drawings and available tables from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllDrawings();
        if (data && data.length > 0) {
          setDrawingsList(data);
        }
      } catch (err) {
        console.warn('Could not load custom drawings:', err);
      }

      try {
        const tbls = await getTables();
        if (tbls && tbls.length > 0) {
          setAvailableTables(tbls);
          const savedId = localStorage.getItem('mandor_checksheet_target_table_id');
          if (savedId && tbls.some(t => t.id === savedId)) {
            setTargetTableId(savedId);
          } else {
            const qcTbl = tbls.find(t => t.name.toLowerCase().includes('qc') || t.name.toLowerCase().includes('inspect') || t.name.toLowerCase().includes('check'));
            if (qcTbl) {
              setTargetTableId(qcTbl.id);
              localStorage.setItem('mandor_checksheet_target_table_id', qcTbl.id);
            } else {
              setTargetTableId(tbls[0].id);
              localStorage.setItem('mandor_checksheet_target_table_id', tbls[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Could not load tables:', err);
      }
    };
    fetchData();
  }, []);

  // Create Standard QC Inspection Table in Mandor
  const handleCreateStandardQcTable = async () => {
    setIsCreatingTable(true);
    try {
      const newTbl = await createTable({
        name: 'QC Inspection Records',
        description: 'Log hasil pengukuran digital checksheet ISO 9001 & QA inspection',
        fields: [
          { name: 'Work_Order', type: 'text', required: true },
          { name: 'Serial_Number', type: 'text', required: true },
          { name: 'Lot_Batch', type: 'text' },
          { name: 'Drawing_Ref', type: 'text' },
          { name: 'Inspector', type: 'text' },
          { name: 'Overall_Status', type: 'single_select', options: ['APPROVED (OK)', 'REJECTED (NG)', 'IN PROGRESS'] },
          { name: 'Pass_Rate', type: 'text' },
          { name: 'Cpk_Estimate', type: 'text' },
          { name: 'Total_Points', type: 'number' },
          { name: 'Passed_Points', type: 'number' },
          { name: 'Failed_Points', type: 'number' },
          { name: 'Inspection_Data_JSON', type: 'text' },
          { name: 'Timestamp', type: 'datetime' },
          { name: 'Notes', type: 'text' }
        ]
      });
      setAvailableTables(prev => [newTbl, ...prev]);
      setTargetTableId(newTbl.id);
      localStorage.setItem('mandor_checksheet_target_table_id', newTbl.id);
      toast.success(`Tabel "${newTbl.name}" berhasil dibuat & terhubung sebagai Data Source!`);
    } catch (err) {
      toast.error('Gagal membuat tabel: ' + err.message);
    } finally {
      setIsCreatingTable(false);
    }
  };

  // Calculate ISO 9001 Statistical Summary
  const stats = useMemo(() => {
    const total = checkPoints.length;
    const passed = checkPoints.filter(p => p.status === 'OK').length;
    const failed = checkPoints.filter(p => p.status === 'NG').length;
    const pending = checkPoints.filter(p => p.status === 'PENDING').length;
    const criticalFailed = checkPoints.filter(p => p.status === 'NG' && p.criticality.includes('Critical')).length;
    const progress = Math.round(((passed + failed) / total) * 100);
    const overallStatus = failed > 0 ? 'REJECTED (NG)' : passed === total ? 'APPROVED (OK)' : 'IN PROGRESS';
    
    // Simple Cpk estimation for in-spec points
    const cpkEstimated = failed > 0 ? '0.82 (Poor)' : passed === total ? '1.54 (Capable)' : 'N/A';

    return { total, passed, failed, pending, criticalFailed, progress, overallStatus, cpkEstimated, passRate: total > 0 ? `${Math.round((passed / total) * 100)}%` : '0%' };
  }, [checkPoints]);

  // Handle Measurement Input Change with real-time tolerancing
  const handleMeasurementChange = (id, val) => {
    setCheckPoints(prev => prev.map(pt => {
      if (pt.id !== id) return pt;
      const num = parseFloat(val);
      let status = 'PENDING';
      let disposition = pt.disposition;

      if (!isNaN(num) && val !== '') {
        if (num >= pt.tolMin && num <= pt.tolMax) {
          status = 'OK';
          disposition = 'Accepted - Conforms to Spec';
        } else {
          status = 'NG';
          disposition = num > pt.tolMax ? 'Rework (Oversize)' : 'Scrap / MRB Review (Undersize)';
        }
      }
      return { ...pt, measuredVal: val, status, disposition };
    }));
  };

  // Toggle Point Status Directly
  const handleToggleStatus = (id, status) => {
    setCheckPoints(prev => prev.map(pt => {
      if (pt.id !== id) return pt;
      const nextStatus = pt.status === status ? 'PENDING' : status;
      const nominalVal = nextStatus === 'OK' ? pt.nominal.toString() : nextStatus === 'NG' ? (pt.tolMax + 0.05).toFixed(3) : '';
      return {
        ...pt,
        status: nextStatus,
        measuredVal: pt.measuredVal || nominalVal,
        disposition: nextStatus === 'OK' ? 'Accepted - Conforms to Spec' : nextStatus === 'NG' ? 'MRB Hold / Review' : 'Pending Inspection'
      };
    }));
  };

  // Start Guided Auto-Inspection Mode
  const handleStartInspection = (targetId) => {
    let target = null;
    if (targetId) {
      target = checkPoints.find(p => p.id === targetId);
    }
    if (!target) {
      target = checkPoints.find(p => p.status === 'PENDING') || checkPoints[0];
    }
    setActivePointId(target.id);
    setActiveTab('Check');
    toast.success(`🔍 Mode Inspeksi Terpandu: Poin #${target.pointNumber} [${target.title}]`, { icon: '📐' });
  };

  // ─── Drawing Canvas Handlers ───
  const getCanvasCoords = (e) => {
    if (!drawingCanvasRef.current) return { x: 0, y: 0 };
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY ?? 0;
    const scaleX = 1000 / (rect.width || 1000);
    const scaleY = 680 / (rect.height || 680);
    return {
      x: Math.max(0, Math.min(1000, Math.round((clientX - rect.left) * scaleX))),
      y: Math.max(0, Math.min(680, Math.round((clientY - rect.top) * scaleY)))
    };
  };

  // Erase annotations near coords
  const eraseAtPoint = (coords) => {
    const threshold = 20;

    setDrawings(prev => {
      const next = prev.filter(d => {
        if (!d.type || d.type === 'path') {
          const hit = (d.points || []).some(p => Math.hypot(p.x - coords.x, p.y - coords.y) < threshold + (d.size || 3));
          return !hit;
        }
        if (d.type === 'arrow') {
          const d1 = Math.hypot((d.start?.x || 0) - coords.x, (d.start?.y || 0) - coords.y);
          const d2 = Math.hypot((d.end?.x || 0) - coords.x, (d.end?.y || 0) - coords.y);
          const hit = d1 < threshold || d2 < threshold;
          return !hit;
        }
        if (d.type === 'rect') {
          const xMin = Math.min(d.start?.x || 0, d.end?.x || 0);
          const xMax = Math.max(d.start?.x || 0, d.end?.x || 0);
          const yMin = Math.min(d.start?.y || 0, d.end?.y || 0);
          const yMax = Math.max(d.start?.y || 0, d.end?.y || 0);
          const hit = (coords.x >= xMin - threshold && coords.x <= xMax + threshold && coords.y >= yMin - threshold && coords.y <= yMax + threshold);
          return !hit;
        }
        if (d.type === 'circle') {
          const cx = ((d.start?.x || 0) + (d.end?.x || 0)) / 2;
          const cy = ((d.start?.y || 0) + (d.end?.y || 0)) / 2;
          const r = Math.hypot((d.end?.x || 0) - (d.start?.x || 0), (d.end?.y || 0) - (d.start?.y || 0)) / 2;
          const dist = Math.hypot(coords.x - cx, coords.y - cy);
          const hit = Math.abs(dist - r) < threshold;
          return !hit;
        }
        if (d.type === 'text') {
          const hit = Math.hypot((d.x || 0) - coords.x, (d.y || 0) - coords.y) < threshold + 30;
          return !hit;
        }
        return true;
      });
      return next;
    });

    setStamps(prev => {
      const next = prev.filter(s => {
        const hit = Math.hypot(s.x - coords.x, s.y - coords.y) < 35;
        return !hit;
      });
      return next;
    });
  };

  const handleDrawStart = (e) => {
    if (!isDrawingMode) return;
    if (e.type === 'mousedown' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const coords = getCanvasCoords(e);

    if (drawingTool === 'eraser') {
      setIsDrawing(true);
      eraseAtPoint(coords);
      return;
    }

    if (drawingTool === 'stamp') {
      const stamp = STAMPS.find(s => s.id === selectedStamp) || STAMPS[0];
      const newStamp = {
        id: Date.now() + Math.random(),
        stampId: stamp.id,
        label: stamp.label,
        icon: stamp.icon,
        color: stamp.color,
        bg: stamp.bg,
        border: stamp.border,
        x: coords.x,
        y: coords.y,
        createdAt: new Date().toISOString(),
        createdBy: inspectorName
      };
      setStamps(prev => [...prev, newStamp]);
      setRedoStack([]);
      toast.success(`Stamp "${stamp.label}" ditempelkan!`, { icon: '🏷️' });
      return;
    }

    if (drawingTool === 'text') {
      setTextInputPosition(coords);
      setTextInputValue('');
      setShowTextModal(true);
      return;
    }

    setIsDrawing(true);
    if (['arrow', 'rect', 'circle'].includes(drawingTool)) {
      setShapeStart(coords);
      setShapeCurrent(coords);
    } else {
      setCurrentStroke([coords]);
    }
  };

  const handleDrawMove = (e) => {
    if (!isDrawing || !isDrawingMode) return;
    e.preventDefault();
    e.stopPropagation();
    const coords = getCanvasCoords(e);

    if (drawingTool === 'eraser') {
      eraseAtPoint(coords);
      return;
    }

    if (['arrow', 'rect', 'circle'].includes(drawingTool)) {
      setShapeCurrent(coords);
    } else {
      setCurrentStroke(prev => [...prev, coords]);
    }
  };

  const handleDrawEnd = () => {
    if (!isDrawing || !isDrawingMode) return;
    setIsDrawing(false);

    if (drawingTool === 'eraser') {
      return;
    }

    if (['arrow', 'rect', 'circle'].includes(drawingTool)) {
      if (shapeStart && shapeCurrent) {
        const dist = Math.hypot(shapeCurrent.x - shapeStart.x, shapeCurrent.y - shapeStart.y);
        if (dist > 4) {
          const newShape = {
            id: Date.now() + Math.random(),
            type: drawingTool,
            tool: drawingTool,
            color: drawingColor,
            size: drawingSize,
            start: shapeStart,
            end: shapeCurrent
          };
          setDrawings(prev => [...prev, newShape]);
          setRedoStack([]);
        }
      }
      setShapeStart(null);
      setShapeCurrent(null);
    } else if (['pen', 'marker', 'highlighter'].includes(drawingTool)) {
      if (currentStroke.length > 0) {
        // If single point (dot click), duplicate with tiny offset to form visible point
        const points = currentStroke.length === 1
          ? [currentStroke[0], { x: currentStroke[0].x + 0.1, y: currentStroke[0].y + 0.1 }]
          : currentStroke;

        const newStroke = {
          id: Date.now() + Math.random(),
          type: 'path',
          tool: drawingTool,
          color: drawingColor,
          size: drawingTool === 'marker' ? Math.max(3.5, drawingSize * 1.8) : drawingTool === 'highlighter' ? Math.max(8, drawingSize * 4) : drawingSize,
          points
        };
        setDrawings(prev => [...prev, newStroke]);
        setRedoStack([]);
      }
      setCurrentStroke([]);
    }
  };

  const handleAddTextAnnotation = (text) => {
    if (!text?.trim() || !textInputPosition) return;
    const newTextItem = {
      id: Date.now() + Math.random(),
      type: 'text',
      text: text.trim(),
      color: drawingColor,
      x: textInputPosition.x,
      y: textInputPosition.y,
      createdAt: new Date().toISOString()
    };
    setDrawings(prev => [...prev, newTextItem]);
    setRedoStack([]);
    setShowTextModal(false);
    setTextInputPosition(null);
    toast.success('Catatan teks ditambahkan!');
  };

  const handleDeleteSpecificStamp = (id, e) => {
    if (e) e.stopPropagation();
    setStamps(prev => prev.filter(s => s.id !== id));
  };

  // Commit Current Point & Auto-Advance to Next Point
  const handleCommitAndAdvance = (pointId, val, explicitStatus) => {
    const ptIndex = checkPoints.findIndex(p => p.id === pointId);
    if (ptIndex === -1) return;
    const pt = checkPoints[ptIndex];

    const finalVal = val !== undefined && val !== '' ? val : (explicitStatus === 'OK' ? pt.nominal.toString() : (pt.measuredVal || pt.nominal.toString()));
    const num = parseFloat(finalVal);

    let status = explicitStatus || 'PENDING';
    let disposition = pt.disposition;

    if (!explicitStatus) {
      if (!isNaN(num) && finalVal !== '') {
        if (num >= pt.tolMin && num <= pt.tolMax) {
          status = 'OK';
          disposition = 'Accepted - Conforms to Spec';
        } else {
          status = 'NG';
          disposition = num > pt.tolMax ? 'Rework (Oversize)' : 'Scrap / MRB Review (Undersize)';
        }
      } else {
        status = 'OK';
        disposition = 'Accepted - Conforms to Spec';
      }
    } else if (explicitStatus === 'OK') {
      status = 'OK';
      disposition = 'Accepted - Conforms to Spec';
    } else if (explicitStatus === 'NG') {
      status = 'NG';
      disposition = 'MRB Hold / Review';
    }

    // ── Record Audit Trail (ISO 9001: 7.5.3) ──
    if (pt.measuredVal && pt.measuredVal !== finalVal) {
      const auditEntry = {
        id: `AUDIT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        user: inspectorName,
        pointNumber: pt.pointNumber,
        param: pt.title,
        oldVal: pt.measuredVal,
        newVal: finalVal,
        status,
        reason: 'Revisi hasil ukur inspeksi'
      };
      const updatedAudit = [auditEntry, ...auditTrail];
      setAuditTrail(updatedAudit);
      localStorage.setItem('mandor_checksheet_audit_trail', JSON.stringify(updatedAudit));
    }

    const updatedPoints = checkPoints.map((p, idx) => {
      if (idx === ptIndex) {
        return { ...p, measuredVal: finalVal, status, disposition };
      }
      return p;
    });

    setCheckPoints(updatedPoints);

    // ── If NG, trigger NCR flow (ISO 9001: 8.7) ──
    if (status === 'NG') {
      setActiveNCRPoint({ ...pt, measuredVal: finalVal, status, disposition });
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#ef4444', fontWeight: 800 }}>⚠️ Dimensi NG Terdeteksi!</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              setShowNCRModal(true);
            }}
            style={{
              padding: '3px 8px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 800,
              fontSize: '0.7rem',
              cursor: 'pointer'
            }}
          >
            Buka NCR
          </button>
        </div>
      ), { duration: 4000 });
    }

    // Check if there is a next point in the list
    if (ptIndex + 1 < updatedPoints.length) {
      const nextPt = updatedPoints[ptIndex + 1];
      setActivePointId(nextPt.id);
      toast.success(`Poin #${pt.pointNumber} [${status}] tersimpan ➔ Lanjut #${nextPt.pointNumber}`, { duration: 1500 });
    } else {
      // All points finished!
      const totalFailed = updatedPoints.filter(p => p.status === 'NG').length;
      const overall = totalFailed > 0 ? 'REJECTED (NG)' : 'APPROVED (OK)';

      toast.success(`🎉 Seluruh Dimensi Selesai! Menyimpan sertifikat inspeksi...`, { duration: 3000 });
      
      // Auto-save and move to Summary tab
      saveInspectionPayload(updatedPoints, overall);
      setActiveTab('Summary');
    }
  };

  const handleSaveNCR = async (ncrData) => {
    const updated = [ncrData, ...ncrList.filter(n => n.ncrNumber !== ncrData.ncrNumber)];
    setNcrList(updated);
    localStorage.setItem('mandor_checksheet_ncrs', JSON.stringify(updated));

    // Also write to connected Mandor Table if configured
    if (targetTableId) {
      try {
        await addTableRecord(targetTableId, {
          recordId: `NCR_${ncrData.ncrNumber}`,
          Work_Order: workOrderNo,
          Serial_Number: partSerial,
          'NCR Number': ncrData.ncrNumber,
          fld_ncr_no: ncrData.ncrNumber,
          Defect_Type: ncrData.defectType,
          fld_defect_type: ncrData.defectType,
          Disposition: ncrData.disposition,
          fld_disposition: ncrData.disposition,
          Quarantine_Bin: ncrData.quarantineBin,
          fld_quarantine_bin: ncrData.quarantineBin,
          Root_Cause: ncrData.rootCause,
          Inspector: inspectorName,
          Overall_Status: 'REJECTED (NCR ISSUED)',
          Timestamp: ncrData.createdAt || new Date().toISOString(),
          Notes: `NCR Form Otomatis: ${ncrData.ncrNumber} - ${ncrData.disposition}`
        });
      } catch (tblErr) {
        console.warn('[Table NCR Log Error]', tblErr);
      }
    }
  };

  const handleSupervisorApprove = (approvalData) => {
    setSupervisorApproval(approvalData);
    localStorage.setItem('mandor_checksheet_supervisor_approval', JSON.stringify(approvalData));
  };

  const handleUpdateEnvironment = (temp, hum) => {
    setTemperature(temp);
    setHumidity(hum);
    localStorage.setItem('mandor_checksheet_temp', temp);
    localStorage.setItem('mandor_checksheet_humidity', hum);
  };

  // Helper to save inspection payload directly
  const saveInspectionPayload = async (pointsToSave, overallStatus) => {
    setIsSubmitting(true);
    const passedCount = pointsToSave.filter(p => p.status === 'OK').length;
    const failedCount = pointsToSave.filter(p => p.status === 'NG').length;
    const critFailed = pointsToSave.filter(p => p.status === 'NG' && p.criticality.includes('Critical')).length;

    const payload = {
      docNo: 'FORM-QA-CK-001-C',
      isoStandard: 'ISO 9001:2015 Clause 8.6 & IATF 16949',
      workOrderNo,
      partSerial,
      lotBatchNo,
      stationId,
      shiftNo,
      drawingRef: 'MANDOR-QA-2026-08 Rev 2.1',
      inspector: inspectorName,
      timestamp: new Date().toISOString(),
      overallStatus: overallStatus || (failedCount > 0 ? 'REJECTED (NG)' : 'APPROVED (OK)'),
      totalPoints: pointsToSave.length,
      passedPoints: passedCount,
      failedPoints: failedCount,
      criticalFailed: critFailed,
      passRate: `${Math.round((passedCount / pointsToSave.length) * 100)}%`,
      cpkEstimate: failedCount > 0 ? '0.82 (Poor)' : '1.54 (Capable)',
      notes: inspectionNotes || 'Inspection conforms to ISO 2768-mK tolerances.',
      details: pointsToSave.map(p => ({
        pointNumber: p.pointNumber,
        title: p.title,
        nominal: p.nominal,
        tolerance: `${p.tolMin} - ${p.tolMax} ${p.unit}`,
        measured: p.measuredVal,
        status: p.status,
        tool: `${p.tool} [${p.toolId}]`,
        criticality: p.criticality,
        disposition: p.disposition
      }))
    };

    try {
      n8nWebhook.fire(failedCount > 0 ? 'inspection.failed' : 'inspection.passed', payload);

      // ── Write directly to Connected Mandor Table ──
      if (targetTableId) {
        try {
          const nowIso = new Date().toISOString();
          const pointFields = {};
          pointsToSave.forEach((p, idx) => {
            const ptNum = p.pointNumber || idx + 1;
            const safeTitle = (p.title || `Point_${ptNum}`).replace(/[^a-zA-Z0-9_ ]/g, '');
            pointFields[`#${ptNum} ${safeTitle} (${p.unit || 'mm'})`] = p.measuredValue !== undefined && p.measuredValue !== '' ? parseFloat(p.measuredValue) : null;
            pointFields[`#${ptNum} ${safeTitle} Status`] = p.status || 'PENDING';
            pointFields[`fld_pt_${ptNum}_val`] = p.measuredValue !== undefined && p.measuredValue !== '' ? parseFloat(p.measuredValue) : null;
            pointFields[`fld_pt_${ptNum}_status`] = p.status || 'PENDING';
          });

          await addTableRecord(targetTableId, {
            recordId: `QC_${workOrderNo}_${Date.now().toString().slice(-4)}`,
            Work_Order: workOrderNo,
            'WO Number': workOrderNo,
            fld_wo: workOrderNo,
            Serial_Number: partSerial,
            'Part No': partSerial || workOrderNo,
            fld_part_no: partSerial || workOrderNo,
            Lot_Batch: lotBatchNo,
            'Part Name': 'Precision Part',
            fld_part_name: 'Precision Part',
            Drawing_Ref: 'MANDOR-QA-2026-08 Rev 2.1',
            Inspector: inspectorName,
            'Inspector Name': inspectorName,
            fld_inspector: inspectorName,
            Overall_Status: payload.overallStatus,
            'Overall Status': payload.overallStatus,
            fld_overall_status: payload.overallStatus,
            Pass_Rate: payload.passRate,
            Cpk_Estimate: payload.cpkEstimate,
            Total_Points: pointsToSave.length,
            Passed_Points: passedCount,
            Failed_Points: failedCount,
            Inspection_Data_JSON: JSON.stringify(payload.details),
            Timestamp: nowIso,
            'Date & Time': nowIso,
            Date_Time: nowIso,
            fld_date_time: nowIso,
            Notes: inspectionNotes || '',
            ...pointFields
          });
          toast.success(`Data inspeksi tersimpan ke Tabel: ${targetTable?.name || 'QC Records'}!`);
        } catch (tblErr) {
          console.warn('[Table Storage Error]', tblErr);
        }
      }

      const localLogs = JSON.parse(localStorage.getItem('mandor_qa_checksheets') || '[]');
      localStorage.setItem('mandor_qa_checksheets', JSON.stringify([payload, ...localLogs]));
      toast.success(`Sertifikat inspeksi QC ISO 9001 tersimpan! Status: ${payload.overallStatus}`);
    } catch (e) {
      console.warn('Auto-save note:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch Pass All
  const _handlePassAll = () => {
    setCheckPoints(prev => prev.map(pt => ({
      ...pt,
      status: 'OK',
      measuredVal: pt.measuredVal || pt.nominal.toString(),
      disposition: 'Accepted - Conforms to Spec'
    })));
    toast.success('Semua poin dimensi diverifikasi PASSED (OK)!');
  };

  // Reset Check Sheet
  const handleResetCheckSheet = () => {
    if (window.confirm('Reset seluruh hasil pengukuran pada check sheet ini?')) {
      setCheckPoints(prev => prev.map(pt => ({
        ...pt,
        measuredVal: '',
        status: 'PENDING',
        disposition: 'Pending Inspection'
      })));
      toast.info('Check sheet di-reset.');
    }
  };

  // Submit & Save Inspection Check Sheet (ISO 9001 / IATF 16949 Audit Trail)
  const handleSubmitCheckSheet = async () => {
    if (stats.pending > 0) {
      if (!window.confirm(`Masih ada ${stats.pending} dimensi yang belum diukur. Tetap simpan checksheet sekarang?`)) {
        return;
      }
    }
    await saveInspectionPayload(checkPoints, stats.overallStatus);
  };

  // ── Publish Check Sheet to Live Player ──
  const handlePublishCheckSheet = async () => {
    setIsPublishing(true);
    try {
      // Generate a unique publish ID
      const publishId = `CHECKSHEET_${workOrderNo}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

      // Create the published check sheet data
      const publishedData = {
        id: publishId,
        docNo: 'FORM-QA-CK-001-C',
        workOrderNo,
        partSerial,
        lotBatchNo,
        stationId,
        shiftNo,
        drawingRef: 'MANDOR-QA-2026-08 Rev 2.1',
        inspector: inspectorName,
        publishedAt: new Date().toISOString(),
        status: 'PUBLISHED',
        checkpoints: checkPoints.map(p => ({
          id: p.id,
          pointNumber: p.pointNumber,
          title: p.title,
          category: p.category,
          nominal: p.nominal,
          tolMin: p.tolMin,
          tolMax: p.tolMax,
          unit: p.unit,
          tool: p.tool,
          toolId: p.toolId,
          calExpiry: p.calExpiry,
          criticality: p.criticality,
          notes: p.notes
        }))
      };

      // Save to localStorage for Live Player to access
      localStorage.setItem('mandor_published_checksheet', JSON.stringify(publishedData));
      localStorage.setItem('mandor_checksheet_published', 'true');
      localStorage.setItem('mandor_checksheet_publish_id', publishId);

      setIsPublished(true);

      // Also save to the connected table if configured
      if (targetTableId) {
        try {
          await addTableRecord(targetTableId, {
            recordId: `PUB_${publishId}`,
            Work_Order: workOrderNo,
            Serial_Number: partSerial,
            Lot_Batch: lotBatchNo,
            Drawing_Ref: 'MANDOR-QA-2026-08 Rev 2.1',
            Inspector: inspectorName,
            Overall_Status: 'PUBLISHED',
            Pass_Rate: `${Math.round((stats.passed / stats.total) * 100)}%`,
            Cpk_Estimate: stats.cpkEstimated,
            Total_Points: checkPoints.length,
            Passed_Points: stats.passed,
            Failed_Points: stats.failed,
            Inspection_Data_JSON: JSON.stringify({ type: 'published_checksheet', publishId }),
            Timestamp: new Date().toISOString(),
            Notes: `Check Sheet Published for Live Player - ${publishId}`
          });
        } catch (tblErr) {
          console.warn('[Table Publish Error]', tblErr);
        }
      }

      toast.success(`✓ Check Sheet dipublish ke Live Player! ID: ${publishId}`, { duration: 4000 });
    } catch (err) {
      toast.error('Gagal mempublish check sheet: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Unpublish Check Sheet ──
  const handleUnpublishCheckSheet = () => {
    if (window.confirm('Hapus check sheet dari Live Player? Device yang sudah terhubung tetap bisa menyelesaikan sesi.')) {
      localStorage.removeItem('mandor_checksheet_published');
      localStorage.removeItem('mandor_checksheet_publish_id');
      setIsPublished(false);
      toast.success('Check Sheet dihapus dari Live Player');
    }
  };

  // ── Generate Companion Link & QR Code ──
  const handleGenerateCompanionLink = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';

    // Generate direct functional URL to Digital Drawing Check Sheet (standalone without main app header)
    const companionUrl = `${origin}${pathname}#/drawing-checksheet?wo=${encodeURIComponent(workOrderNo)}&sn=${encodeURIComponent(partSerial)}&lot=${encodeURIComponent(lotBatchNo)}&station=${encodeURIComponent(stationId)}&inspector=${encodeURIComponent(inspectorName)}&standalone=true&mode=companion`;

    setCompanionLink(companionUrl);
    setShowCompanionModal(true);
  };

  // ── Copy Link to Clipboard ──
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(companionLink);
      setLinkCopied(true);
      toast.success('Link berhasil disalin!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  // ── Download QR Code as PNG ──
  const handleDownloadQRCode = () => {
    const svg = document.getElementById('companion-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `QR-Companion-${workOrderNo}-${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success('QR Code berhasil didownload!');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // ── Print QC Inspection Report PDF ──
  const handlePrintQCReport = async () => {
    try {
      const { executeReportPrintAction } = await import('../utils/reportPrintService');

      // ── Build complete reportData with all fields ──
      const reportData = {
        // QR & Document Control
        report_qr: `https://mandor-core.online/inspection/${workOrderNo}`,
        doc_id: `ISO9001-QIC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-3)}`,
        doc_control_val: `Doc: ${docNo || 'QA-CS-2026'}\nRev: ${revisionNo || '1.0'} | Std: ISO 9001`,

        // Master data from state (loaded from published checksheet)
        wo_value: workOrderNo || 'WO-UNDEFINED',
        part_no_value: partNo || partSerial || 'PRT-UNKNOWN',
        part_name_value: partName || 'Precision Part',
        customer_value: customer || 'General Customer',
        process_value: processName || 'Quality Inspection',
        station_value: stationId || 'ST-QC-01',

        // Personnel & Timestamp
        inspector_value: inspectorName,
        approver_value: approverName || 'QC Lead',
        date_time_value: new Date().toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
        status_value: stats.overallStatus,

        // Summary Statistics
        total_value: String(stats.total),
        passed_value: String(stats.passed),
        failed_value: String(stats.failed),
        pending_value: String(stats.pending),
        cpk_value: String(stats.cpkEstimated || '1.67'),
        rate_value: stats.passRate || '100%',

        // Notes & Footer
        notes_value: inspectionNotes || 'Semua dimensi terverifikasi sesuai toleransi ISO 9001:2015.',
        footer_timestamp: `Generated: ${new Date().toLocaleString('id-ID')}`,

        // ── GD&T Inspection Table (array, not string) ──
        inspection_table:
          checkPoints.map((p, idx) => [
            String(p.pointNumber || idx + 1),
            p.title || `Parameter #${idx + 1}`,
            p.category || 'Dimension',
            `${p.nominal || '0'} ${p.unit || 'mm'}`,
            `±${p.tolMin || '0.1'} - ${p.tolMax || '0.1'}`,
            p.measuredVal !== undefined && p.measuredVal !== '' && p.measuredVal !== null
              ? `${p.measuredVal} ${p.unit || 'mm'}`
              : '-',
            p.criticality || 'Major',
            p.status || (p.measuredVal ? 'MEASURED' : 'PENDING')
          ])
      };

      await executeReportPrintAction({
        reportId: selectedPrintTemplateId,
        data: reportData,
        silent: false
      });
      toast.success('Membuka dialog cetak sertifikat QC ISO 9001...');
    } catch (err) {
      console.error('[DigitalCheckSheet] Print error:', err);
      toast.error('Gagal membuka dialog cetak: ' + err.message);
    }
  };

  // Pan Canvas Handlers
  const handleMouseDown = (e) => {
    if (e.button === 0 && e.target === containerRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(Math.max(0.4, +(prev + delta).toFixed(2)), 3.5));
  };

  // Proportional Clean Fit to Screen (With Safe Margins for Left Toolbar & HUD)
  const handleFitToScreen = () => {
    if (!containerRef.current) {
      setZoom(0.92);
      setPan({ x: 0, y: 0 });
      return;
    }
    const cw = containerRef.current.clientWidth || window.innerWidth;
    const ch = containerRef.current.clientHeight || (window.innerHeight - 56);

    // Reserve safe space so the drawing never overlaps the left floating Draw Tools palette
    const leftReserve = isDrawingMode ? 120 : 24;
    const rightReserve = 24;
    const topReserve = 24;
    const bottomReserve = 24;

    const usableW = Math.max(cw - (leftReserve + rightReserve), 400);
    const usableH = Math.max(ch - (topReserve + bottomReserve), 300);

    const scaleX = usableW / 1000;
    const scaleY = usableH / 680;
    const optimalScale = Math.min(scaleX, scaleY) * 0.96;

    // Shift pan slightly to center in the remaining unobstructed canvas space
    const panOffsetX = isDrawingMode ? 55 : 0;

    setZoom(+optimalScale.toFixed(2));
    setPan({ x: Math.round(panOffsetX), y: 0 });
  };

  const handleResetView = () => {
    handleFitToScreen();
    toast('Ukuran gambar disesuaikan rapi', { icon: '📐' });
  };

  const handleToggleFullscreenCanvas = () => {
    setIsRightPanelCollapsed(prev => {
      const next = !prev;
      setTimeout(() => {
        handleFitToScreen();
      }, 150);
      if (next) {
        toast.success('Drawing Full Screen (Panel Samping Dilipat)', { icon: '📺' });
      } else {
        toast('Panel checklist & keypad ditampilkan', { icon: '📋' });
      }
      return next;
    });
  };

  // Auto-fit on load & window resize with smooth adjustment
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToScreen();
    }, 150);

    const onResize = () => {
      handleFitToScreen();
    };

    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [isRightPanelCollapsed, isDrawingMode]);

  // Filtered check points for right panel
  const filteredPoints = useMemo(() => {
    return checkPoints.filter(p => {
      if (filterCriticality === 'CRITICAL') return p.criticality.includes('Critical') || p.criticality === 'Major';
      if (filterCriticality === 'PENDING') return p.status === 'PENDING';
      if (filterCriticality === 'NG') return p.status === 'NG';
      return true;
    });
  }, [checkPoints, filterCriticality]);

  // Helper for tolerance bar calculation
  const getToleranceBarMetrics = (pt) => {
    if (!pt.tolMin || !pt.tolMax || pt.tolMax === pt.tolMin) return { pos: 50, color: '#22c55e' };
    const num = parseFloat(pt.measuredVal);
    if (isNaN(num) || pt.measuredVal === '') return { pos: 50, color: '#64748b' };
    const range = pt.tolMax - pt.tolMin;
    const clamped = Math.max(pt.tolMin - (range * 0.2), Math.min(pt.tolMax + (range * 0.2), num));
    const totalSpan = range * 1.4;
    const pos = Math.round(((clamped - (pt.tolMin - (range * 0.2))) / totalSpan) * 100);
    const color = num >= pt.tolMin && num <= pt.tolMax ? '#22c55e' : '#ef4444';
    return { pos, color };
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0b1120',
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        flex: 1
      }}
    >
      <Toaster position="top-right" />

      {/* ─── 1. TOP HEADER & METRICS BAR (ISO 9001 TRACEABILITY & CONTROLS) ─── */}
      <div
        style={{
          height: '52px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 20
        }}
      >
        {/* Left: Compact Branding & Drawing Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ width: '26px', height: '26px', backgroundColor: '#22c55e', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 900, fontSize: '0.85rem' }}>
            M
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff', whiteSpace: 'nowrap' }}>
            MANDOR<span style={{ color: '#22c55e' }}>®</span> <span style={{ color: '#38bdf8', fontSize: '0.72rem', fontWeight: 700 }}>CHECK SHEET</span>
          </div>
        </div>

        {/* Center: ISO Traceability Badge & Live Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          {/* WO & Progress Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', padding: '3px 10px', borderRadius: '16px', flexShrink: 0 }}>
            <ShieldCheck size={13} color="#22c55e" />
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {workOrderNo}
            </span>
            <span style={{ fontSize: '0.64rem', padding: '1px 6px', borderRadius: '6px', backgroundColor: stats.failed > 0 ? '#ef4444' : stats.passed === stats.total ? '#22c55e' : '#0284c7', color: 'white', fontWeight: 800 }}>
              {stats.passed}/{stats.total}
            </span>
            <span style={{ fontSize: '0.64rem', color: '#64748b', borderLeft: '1px solid #334155', paddingLeft: '6px' }}>
              Cpk: <strong style={{ color: stats.failed > 0 ? '#ef4444' : '#38bdf8' }}>{stats.cpkEstimated}</strong>
            </span>
          </div>

          {/* Environmental Conditions Pill */}
          <button
            onClick={() => setShowEnvModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#1e293b',
              border: parseFloat(temperature) >= 18 && parseFloat(temperature) <= 22 ? '1px solid #22c55e' : '1px solid #eab308',
              padding: '4px 8px',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '0.72rem',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title={`Kondisi Lingkungan (ISO 1 Standard): ${temperature}°C / ${humidity}% RH`}
          >
            <Thermometer size={13} color={parseFloat(temperature) >= 18 && parseFloat(temperature) <= 22 ? '#22c55e' : '#eab308'} />
            <span style={{ fontWeight: 700 }}>{temperature}°C</span>
          </button>

          {/* Audit Trail Icon Badge */}
          <button
            onClick={() => setShowAuditTrailModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              padding: '4px 8px',
              borderRadius: '6px',
              color: '#38bdf8',
              fontSize: '0.72rem',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title={`Riwayat Audit Log ISO (${auditTrail.length} Perubahan)`}
          >
            <History size={13} />
            <span style={{ fontWeight: 700 }}>{auditTrail.length}</span>
          </button>

          {/* NCR Active Defect Alert */}
          {(ncrList.length > 0 || stats.failed > 0) && (
            <button
              onClick={() => {
                if (!activeNCRPoint && checkPoints.some(p => p.status === 'NG')) {
                  const firstNg = checkPoints.find(p => p.status === 'NG');
                  setActiveNCRPoint(firstNg);
                }
                setShowNCRModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(239, 68, 68, 0.25)',
                border: '1px solid #ef4444',
                padding: '4px 8px',
                borderRadius: '6px',
                color: '#fca5a5',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                flexShrink: 0
              }}
              title="Laporan Ketidaksesuaian Produk & Karantina (ISO 8.7)"
            >
              <ShieldAlert size={13} color="#ef4444" />
              <span>{ncrList.length || stats.failed}</span>
            </button>
          )}

          {/* Database Target Table Icon */}
          <button
            onClick={() => setShowTableConfigModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#1e293b',
              border: targetTable ? '1px solid #0284c7' : '1px dashed #eab308',
              padding: '4px 8px',
              borderRadius: '6px',
              color: targetTable ? '#38bdf8' : '#eab308',
              fontSize: '0.72rem',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title={`Tabel Database: ${targetTable ? targetTable.name : 'Pilih Tabel Target'}`}
          >
            <Database size={13} />
          </button>
        </div>

        {/* Right Tools: Compact Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Mobile & Tablet Dedicated Mode Toggle */}
          <button
            onClick={() => setIsMobileTabletModeActive(true)}
            style={{
              padding: '5px 10px',
              backgroundColor: '#ff6d5a20',
              border: '1px solid #ff6d5a',
              borderRadius: '6px',
              color: '#ff6d5a',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Buka Mode Khusus Mobile & Tablet Touch Ergonomis"
          >
            <Smartphone size={13} />
            <span>Mobile / Tablet</span>
          </button>

          {/* Companion QR Button */}
          <button
            onClick={handleGenerateCompanionLink}
            disabled={!isPublished}
            style={{
              padding: '5px 8px',
              backgroundColor: isPublished ? '#8b5cf6' : '#1e293b',
              color: isPublished ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.72rem',
              cursor: isPublished ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Scan QR Code untuk Mobile Companion"
          >
            <QrCode size={14} />
          </button>

          {/* Smart Publish / Live Toggle */}
          <button
            onClick={isPublished ? handleUnpublishCheckSheet : handlePublishCheckSheet}
            disabled={isPublishing}
            style={{
              padding: '5px 9px',
              backgroundColor: isPublished ? 'rgba(34, 197, 94, 0.15)' : '#0284c7',
              color: isPublished ? '#22c55e' : 'white',
              border: isPublished ? '1px solid #22c55e' : 'none',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={isPublished ? "Status: Published Live (Klik untuk Unpublish)" : "Publish ke Live Player"}
          >
            {isPublished ? <CheckCircle size={13} /> : <Upload size={13} />}
            <span>{isPublished ? 'Live' : 'Publish'}</span>
          </button>

          {/* Compact Zoom & View Controller */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: '6px', padding: '2px 4px', gap: '2px' }}>
            <button onClick={() => handleZoom(-0.15)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '3px' }} title="Zoom Out"><ZoomOut size={13} /></button>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, minWidth: '34px', textAlign: 'center', color: '#38bdf8' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => handleZoom(0.15)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '3px' }} title="Zoom In"><ZoomIn size={13} /></button>
            <button onClick={handleResetView} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '3px 5px', fontSize: '0.68rem', fontWeight: 800 }} title="Reset Fit View">Fit</button>
            <button onClick={handleToggleFullscreenCanvas} style={{ background: 'none', border: 'none', color: isRightPanelCollapsed ? '#22c55e' : '#94a3b8', cursor: 'pointer', padding: '3px' }} title="Toggle Fullscreen Drawing"><Maximize2 size={13} /></button>
          </div>

          {/* Quick Display & Print Toggles */}
          <button onClick={() => setShowRuler(!showRuler)} style={{ background: showRuler ? 'rgba(56, 189, 248, 0.2)' : '#1e293b', border: '1px solid #334155', color: showRuler ? '#38bdf8' : '#94a3b8', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer' }} title="Toggle Grid / Rulers"><Grid size={14} /></button>
          <button onClick={() => setDarkModeBlueprint(!darkModeBlueprint)} style={{ background: darkModeBlueprint ? 'rgba(34, 197, 94, 0.2)' : '#1e293b', border: '1px solid #334155', color: darkModeBlueprint ? '#22c55e' : '#94a3b8', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer' }} title="Mode Gelap / Terang Drawing"><Eye size={14} /></button>
          <button onClick={handlePrintQCReport} style={{ background: '#4c1d95', border: 'none', color: '#fff', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }} title="Cetak Sertifikat Inspeksi ISO 9001"><Printer size={14} /></button>

          {/* Navigation Icon Buttons (Space Saving) */}
          <button
            onClick={() => navigate('/checksheets')}
            style={{
              padding: '5px 8px',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #0284c7',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Arsip Dokumen Checksheet ISO"
          >
            <FolderArchive size={14} />
          </button>

          <button
            onClick={() => navigate('/inspector-designer')}
            style={{
              padding: '5px 8px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Buka Inspector Designer Studio"
          >
            <FileCode size={14} />
          </button>
        </div>
      </div>

      {/* ─── 2. MAIN 3-PANEL WORKSPACE (LEFT METROLOGY SIDEBAR | CENTER BLUEPRINT CANVAS | RIGHT CHECKLIST INSPECTOR) ─── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* ─── LEFT PANEL: FIXED METROLOGY INSTRUMENT SIDEBAR (ISO 9001: 7.1.5) ─── */}
        {showVirtualGauge && (
          <div
            style={{
              width: '340px',
              backgroundColor: '#0b1120',
              borderRight: '1px solid #1e293b',
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '12px 10px',
              height: '100%',
              boxShadow: '4px 0 16px rgba(0,0,0,0.3)',
              zIndex: 20,
              flexShrink: 0
            }}
          >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '5px', borderRadius: '6px', color: '#38bdf8' }}>
                <Crosshair size={15} />
              </div>
              <div>
                <div style={{ fontSize: '0.76rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.3px' }}>
                  METROLOGY SOP & GAUGE
                </div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>
                  ISO 9001: 7.1.5 Metrology Sync
                </div>
              </div>
            </div>
          </div>

          {/* Virtual Measuring Tool Component */}
          {activePt ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <VirtualMeasuringTool
                activePoint={activePt}
                isVisible={true}
                onAutoSetMeasurement={(val) => {
                  if (activePt?.id) {
                    handleMeasurementChange(activePt.id, val);
                  }
                }}
                style={{
                  width: '100%',
                  boxShadow: 'none',
                  backgroundColor: '#0f172a'
                }}
              />

              {/* ─── Measurement Type Visual (WHAT is being measured) ─── */}
              <MeasurementTypeVisual activePoint={activePt} />

              {/* ─── Hardware Direct IoT Sync, Thermal Compensation & ISO Traceability ─── */}
              <MetrologyHardwareHub
                activePoint={activePt}
                onAutoSetMeasurement={(val) => {
                  if (activePt?.id) {
                    handleMeasurementChange(activePt.id, val);
                  }
                }}
              />

              {/* ─── Camera OCR LCD Display Reader ─── */}
              <CameraOCRReader
                activePoint={activePt}
                onValueDetected={(val) => {
                  if (activePt?.id) {
                    handleMeasurementChange(activePt.id, val);
                  }
                }}
              />
            </div>
          ) : (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b', fontSize: '0.74rem' }}>
              Pilih titik ukur (hotspot) di blueprint canvas untuk memuat SOP alat ukur.
            </div>
          )}
        </div>
      )}

        {/* ─── CENTER PANEL: SYMMETRICAL INTERACTIVE BLUEPRINT CANVAS ────────── */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            position: 'relative',
            backgroundColor: darkModeBlueprint ? '#020617' : '#f8fafc',
            overflow: 'hidden',
            cursor: isPanning ? 'grabbing' : 'crosshair',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            height: '100%',
            minWidth: 0
          }}
        >
          {/* Floating Left Sidebar Toggle Button (Left Edge) */}
          {!showVirtualGauge && (
            <button
              onClick={() => setShowVirtualGauge(true)}
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 30,
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                borderLeft: 'none',
                borderTopRightRadius: '8px',
                borderBottomRightRadius: '8px',
                padding: '12px 5px',
                cursor: 'pointer',
                boxShadow: '4px 0 12px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s'
              }}
              title="Buka Panel Metrology & Alat Ukur"
            >
              <ChevronRight size={16} />
            </button>
          )}

          {/* Floating Sidebar Toggle Button (Right Edge) */}
          <button
            onClick={handleToggleFullscreenCanvas}
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 30,
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #334155',
              borderRight: 'none',
              borderTopLeftRadius: '8px',
              borderBottomLeftRadius: '8px',
              padding: '12px 5px',
              cursor: 'pointer',
              boxShadow: '-4px 0 12px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s'
            }}
            title={isRightPanelCollapsed ? "Buka Panel Checklist & Keypad" : "Sembunyikan Panel (Drawing Full Screen)"}
          >
            {isRightPanelCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

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
            {/* 2D SVG Blueprint — show uploaded drawing if available, else default */}
            {drawingPreview ? (
              <div
                style={{
                  width: '100%', height: '100%',
                  position: 'absolute', top: 0, left: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden'
                }}
                dangerouslySetInnerHTML={{ __html: drawingPreview }}
              />
            ) : (
              CASTING_HOUSING_SVG
            )}

            {/* ISO 9001 Document Control Watermark Overlay (Clause 7.5) */}
            {showWatermark && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 8,
                  userSelect: 'none'
                }}
              >
                <div
                  style={{
                    transform: 'rotate(-22deg)',
                    border: '3px dashed rgba(220, 38, 38, 0.25)',
                    padding: '12px 36px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'rgba(220, 38, 38, 0.28)', letterSpacing: '4px', textTransform: 'uppercase' }}>
                    CONTROLLED COPY
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15, 23, 42, 0.35)', letterSpacing: '2px' }}>
                    ISO 9001:2015 & IATF 16949 • FOR PRODUCTION INSPECTION ONLY • REV 2.1
                  </div>
                </div>
              </div>
            )}

            {/* ─── LEADER LINES & POINTER ARROWS SVG LAYER ─────────────── */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 12 }}>
              <defs>
                <marker id="ds-leader-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#ff0055" />
                </marker>
              </defs>
              {checkPoints.map(pt => {
                if (pt.targetX !== undefined && pt.targetY !== undefined && (Math.abs(pt.targetX - pt.x) > 10 || Math.abs(pt.targetY - pt.y) > 10)) {
                  return (
                    <g key={`leader_${pt.id}`}>
                      <line
                        x1={pt.x}
                        y1={pt.y}
                        x2={pt.targetX}
                        y2={pt.targetY}
                        stroke={pt.criticality?.includes('Critical') ? '#dc2626' : '#0284c7'}
                        strokeWidth="2"
                        strokeDasharray="4 3"
                        markerEnd="url(#ds-leader-arrow)"
                      />
                      <circle cx={pt.targetX} cy={pt.targetY} r="4" fill="#ff0055" stroke="#ffffff" strokeWidth="1.5" />
                    </g>
                  );
                }
                return null;
              })}
            </svg>

            {/* Interactive Enterprise Hotspot Pins with Heatmap & Deviation Badges */}
            {checkPoints.map((pt) => {
              const isActive = pt.id === activePointId;
              const isOK = pt.status === 'OK';
              const isNG = pt.status === 'NG';
              const isWarning = pt.status === 'WARNING';

              const isHexagon = pt.shape === 'hexagon' || pt.criticality?.includes('Critical');
              const isDiamond = pt.shape === 'diamond' || pt.criticality?.includes('Major');
              const isSquare = pt.shape === 'square';

              const defaultColor = isHexagon
                ? '#dc2626'
                : isDiamond
                ? '#d97706'
                : isSquare
                ? '#16a34a'
                : getCategoryColor(pt.category);

              const pinBg = isNG
                ? '#ef4444'
                : isWarning
                ? '#f59e0b'
                : isOK
                ? '#22c55e'
                : isActive
                ? '#0284c7'
                : defaultColor;

              const pinGlow = isNG
                ? 'rgba(239, 68, 68, 0.6)'
                : isWarning
                ? 'rgba(245, 158, 11, 0.6)'
                : isOK
                ? 'rgba(34, 197, 94, 0.45)'
                : isActive
                ? 'rgba(2, 132, 199, 0.7)'
                : `${defaultColor}88`;

              return (
                <div
                  key={pt.id}
                  className="hotspot-pin"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePointId(pt.id);
                    setActiveTab('Check');
                  }}
                  style={{
                    position: 'absolute',
                    left: `${pt.x}px`,
                    top: `${pt.y}px`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: isActive ? 30 : 15,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {/* Concentric Pulsing Halo for Active / NG Pins */}
                  {(isActive || isNG) && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: '-10px',
                        borderRadius: isSquare ? '6px' : '50%',
                        backgroundColor: pinGlow,
                        animation: isNG ? 'blink-red 0.8s infinite' : 'pulse 1.8s infinite',
                        zIndex: -1
                      }}
                    />
                  )}

                  {/* Pin Geometrical Shape Body (Hexagon, Diamond, Square, Circle) */}
                  <div
                    style={{
                      width: isActive ? '32px' : '28px',
                      height: isActive ? '32px' : '28px',
                      borderRadius: isSquare ? '4px' : isHexagon || isDiamond ? '0' : '50%',
                      clipPath: isHexagon
                        ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                        : isDiamond
                        ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                        : 'none',
                      backgroundColor: pinBg,
                      color: 'white',
                      border: isHexagon || isDiamond ? 'none' : isActive ? '2.5px solid #ffffff' : isNG ? '2px solid #fee2e2' : '2px solid #ffffff',
                      boxShadow: `0 4px 14px rgba(0,0,0,0.5), 0 0 12px ${pinGlow}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: isActive ? '0.85rem' : '0.78rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isOK ? (
                      <Check size={16} strokeWidth={3} />
                    ) : isNG ? (
                      <span style={{ fontSize: '13px', fontWeight: 900 }}>✕</span>
                    ) : isWarning ? (
                      <span style={{ fontSize: '12px' }}>⚠️</span>
                    ) : (
                      pt.pointNumber
                    )}
                  </div>

                  {/* Micro Measurement Value Chip under Pin */}
                  {pt.measuredVal && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginTop: '3px',
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: `1px solid ${pinBg}`,
                        color: pinBg,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                      }}
                    >
                      {pt.measuredVal} {pt.unit || 'mm'}
                    </div>
                  )}

                  {/* Expanded Active Tooltip Callout */}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '38px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#0f172a',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
                        border: '1.5px solid #38bdf8',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px',
                        zIndex: 40
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#38bdf8' }}>#{pt.pointNumber}</span>
                        <span>{pt.title}</span>
                        <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                          {pt.criticality || 'Critical (CC)'}
                        </span>
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.68rem', fontWeight: 600 }}>
                        Nom: <strong style={{ color: '#38bdf8' }}>{pt.nominal}</strong> • Tol: <strong style={{ color: '#22c55e' }}>{pt.tolMin} ~ {pt.tolMax} {pt.unit}</strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Drawing Canvas Layer - Annotation Overlay */}
            <svg
              ref={drawingCanvasRef}
              viewBox="0 0 1000 680"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: isDrawingMode ? 'all' : 'none',
                cursor: isDrawingMode
                  ? drawingTool === 'eraser'
                    ? 'cell'
                    : drawingTool === 'text'
                    ? 'text'
                    : drawingTool === 'stamp'
                    ? 'copy'
                    : 'crosshair'
                  : 'default',
                zIndex: 50,
                touchAction: 'none'
              }}
              onMouseDown={handleDrawStart}
              onMouseMove={handleDrawMove}
              onMouseUp={handleDrawEnd}
              onMouseLeave={handleDrawEnd}
              onTouchStart={handleDrawStart}
              onTouchMove={handleDrawMove}
              onTouchEnd={handleDrawEnd}
            >
              <defs>
                {/* Fixed-size Arrow markers using userSpaceOnUse to prevent strokeWidth scaling */}
                <marker
                  id="arrowhead"
                  markerUnits="userSpaceOnUse"
                  markerWidth="12"
                  markerHeight="8"
                  refX="10"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 1, 10 4, 0 7" fill={drawingColor} />
                </marker>
                {DRAWING_COLORS.map(c => (
                  <marker
                    key={`arrow-${c.color}`}
                    id={`arrow-${c.color.replace('#', '')}`}
                    markerUnits="userSpaceOnUse"
                    markerWidth="12"
                    markerHeight="8"
                    refX="10"
                    refY="4"
                    orient="auto"
                  >
                    <polygon points="0 1, 10 4, 0 7" fill={c.color} />
                  </marker>
                ))}
              </defs>

              {/* Existing drawings & shapes */}
              {drawings.map(d => {
                if (!d.type || d.type === 'path') {
                  return (
                    <polyline
                      key={d.id}
                      points={(d.points || []).map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke={d.color}
                      strokeWidth={d.size || 1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={d.tool === 'highlighter' ? 0.35 : 1}
                    />
                  );
                }
                if (d.type === 'arrow' && d.start && d.end) {
                  const colorKey = (d.color || '#ef4444').replace('#', '');
                  return (
                    <g key={d.id}>
                      <line
                        x1={d.start.x}
                        y1={d.start.y}
                        x2={d.end.x}
                        y2={d.end.y}
                        stroke={d.color}
                        strokeWidth={Math.min(2.5, d.size || 1.8)}
                        strokeLinecap="round"
                        markerEnd={`url(#arrow-${colorKey})`}
                      />
                    </g>
                  );
                }
                if (d.type === 'rect' && d.start && d.end) {
                  const x = Math.min(d.start.x, d.end.x);
                  const y = Math.min(d.start.y, d.end.y);
                  const w = Math.abs(d.end.x - d.start.x);
                  const h = Math.abs(d.end.y - d.start.y);
                  return (
                    <rect
                      key={d.id}
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      fill={d.color + '15'}
                      stroke={d.color}
                      strokeWidth={Math.min(2, d.size || 1.8)}
                      rx="3"
                    />
                  );
                }
                if (d.type === 'circle' && d.start && d.end) {
                  const cx = (d.start.x + d.end.x) / 2;
                  const cy = (d.start.y + d.end.y) / 2;
                  const rx = Math.abs(d.end.x - d.start.x) / 2;
                  const ry = Math.abs(d.end.y - d.start.y) / 2;
                  return (
                    <ellipse
                      key={d.id}
                      cx={cx}
                      cy={cy}
                      rx={rx}
                      ry={ry}
                      fill={d.color + '15'}
                      stroke={d.color}
                      strokeWidth={Math.min(2, d.size || 1.8)}
                    />
                  );
                }
                if (d.type === 'text') {
                  return (
                    <g key={d.id} transform={`translate(${d.x}, ${d.y})`}>
                      <rect
                        x="-4"
                        y="-16"
                        width={Math.max(60, d.text.length * 7.5 + 12)}
                        height="20"
                        rx="4"
                        fill="rgba(15, 23, 42, 0.92)"
                        stroke={d.color || '#38bdf8'}
                        strokeWidth="1.2"
                      />
                      <text
                        x="4"
                        y="-2"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {d.text}
                      </text>
                    </g>
                  );
                }
                return null;
              })}

              {/* Current stroke (in progress) */}
              {currentStroke.length > 0 && (
                <polyline
                  points={currentStroke.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={drawingColor}
                  strokeWidth={drawingTool === 'marker' ? Math.max(3.5, drawingSize * 1.8) : drawingTool === 'highlighter' ? Math.max(8, drawingSize * 4) : (drawingSize || 1.8)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={drawingTool === 'highlighter' ? 0.35 : 1}
                />
              )}

              {/* Current shape (in progress) */}
              {shapeStart && shapeCurrent && drawingTool === 'arrow' && (
                <line
                  x1={shapeStart.x}
                  y1={shapeStart.y}
                  x2={shapeCurrent.x}
                  y2={shapeCurrent.y}
                  stroke={drawingColor}
                  strokeWidth={Math.min(2.5, drawingSize || 1.8)}
                  strokeLinecap="round"
                  markerEnd={`url(#arrow-${drawingColor.replace('#', '')})`}
                />
              )}

              {shapeStart && shapeCurrent && drawingTool === 'rect' && (
                <rect
                  x={Math.min(shapeStart.x, shapeCurrent.x)}
                  y={Math.min(shapeStart.y, shapeCurrent.y)}
                  width={Math.abs(shapeCurrent.x - shapeStart.x)}
                  height={Math.abs(shapeCurrent.y - shapeStart.y)}
                  fill={drawingColor + '15'}
                  stroke={drawingColor}
                  strokeWidth={Math.min(2, drawingSize || 1.8)}
                  rx="3"
                />
              )}

              {shapeStart && shapeCurrent && drawingTool === 'circle' && (
                <ellipse
                  cx={(shapeStart.x + shapeCurrent.x) / 2}
                  cy={(shapeStart.y + shapeCurrent.y) / 2}
                  rx={Math.abs(shapeCurrent.x - shapeStart.x) / 2}
                  ry={Math.abs(shapeCurrent.y - shapeStart.y) / 2}
                  fill={drawingColor + '15'}
                  stroke={drawingColor}
                  strokeWidth={Math.min(2, drawingSize || 1.8)}
                />
              )}
            </svg>

            {/* Stamp Layer - Prominent, professional QA Badges */}
            {stamps.map(stamp => (
              <div
                key={stamp.id}
                style={{
                  position: 'absolute',
                  left: `${stamp.x}px`,
                  top: `${stamp.y}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 55,
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: `2.5px solid ${stamp.border || stamp.color}`,
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: stamp.color,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
                  cursor: isDrawingMode ? (drawingTool === 'eraser' ? 'pointer' : 'default') : 'default',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minWidth: '125px'
                }}
                onClick={(e) => {
                  if (isDrawingMode && drawingTool === 'eraser') {
                    handleDeleteSpecificStamp(stamp.id, e);
                    toast.success('Stamp dihapus');
                  }
                }}
              >
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{stamp.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.8px', textTransform: 'uppercase', lineHeight: 1.2 }}>
                    {stamp.label}
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#cbd5e1', fontWeight: 600, marginTop: '2px' }}>
                    {stamp.createdBy || inspectorName}
                  </div>
                </div>
                {isDrawingMode && (
                  <button
                    onClick={(e) => handleDeleteSpecificStamp(stamp.id, e)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.25)',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      marginLeft: '6px',
                      fontSize: '10px',
                      fontWeight: 800,
                      lineHeight: 1
                    }}
                    title="Hapus Stamp Ini"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT PANEL: DIGITAL CHECK SHEET & TOLERANCE INSPECTOR ────────── */}
        {!isRightPanelCollapsed && (
          <div style={{ width: '460px', backgroundColor: '#0f172a', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

          {/* Tabs Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderBottom: '1px solid #1e293b', backgroundColor: '#090d16' }}>
            {[
              { id: 'Checkers', label: 'Checklist', icon: ClipboardList },
              { id: 'Check', label: 'Focus', icon: Crosshair },
              { id: 'Calibration', label: 'Gauges', icon: Wrench },
              { id: 'Summary', label: 'Sign-off', icon: Award }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 4px',
                  backgroundColor: activeTab === tab.id ? '#1e293b' : 'transparent',
                  color: activeTab === tab.id ? '#38bdf8' : '#64748b',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
                  fontWeight: activeTab === tab.id ? 800 : 600,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <tab.icon size={13} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: CHECKLIST WITH REAL-TIME TOLERANCE BARS */}
          {activeTab === 'Checkers' && (
            <>
              {/* Guided Start Banner */}
              <div style={{ padding: '8px 12px', backgroundColor: 'rgba(2, 132, 199, 0.12)', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#38bdf8" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#e2e8f0' }}>Alur Inspeksi Terpandu</span>
                </div>
                <button
                  onClick={() => handleStartInspection()}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: '#0284c7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Crosshair size={12} /> Mulai Inspect
                </button>
              </div>

              {/* Filter Bar */}
              <div style={{ padding: '6px 12px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#090d16' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>FILTER POIN:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['ALL', 'CRITICAL', 'PENDING', 'NG'].map(flt => (
                    <button
                      key={flt}
                      onClick={() => setFilterCriticality(flt)}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: filterCriticality === flt ? '#38bdf8' : '#1e293b',
                        color: filterCriticality === flt ? '#0f172a' : '#94a3b8',
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {flt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Check Points List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
                {filteredPoints.map((pt) => {
                  const isSelected = pt.id === activePointId;
                  const isOK = pt.status === 'OK';
                  const isNG = pt.status === 'NG';
                  const tolMetrics = getToleranceBarMetrics(pt);

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
                        border: isSelected ? '1px solid #0284c7' : isOK ? '1px solid rgba(34, 197, 94, 0.3)' : isNG ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        transition: 'all 0.15s'
                      }}
                    >
                      {/* Top Row: Point Title & Status & Inspect Button */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="checkbox"
                            checked={isOK}
                            onChange={() => handleToggleStatus(pt.id, 'OK')}
                            style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#22c55e' }}
                          />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                            {pt.pointNumber}. {pt.title}
                          </span>
                          {pt.criticality.includes('Critical') && (
                            <span style={{ fontSize: '0.6rem', padding: '1px 4px', borderRadius: '3px', backgroundColor: '#ef4444', color: 'white', fontWeight: 800 }}>CC</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartInspection(pt.id);
                            }}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid #0284c7',
                              backgroundColor: 'rgba(2, 132, 199, 0.2)',
                              color: '#38bdf8',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                            title="Buka tab Focus untuk poin ini"
                          >
                            Inspect 🔍
                          </button>
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

                      {/* Tolerance Deviation Visualizer Bar */}
                      <div style={{ paddingLeft: '22px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginBottom: '2px' }}>
                          <span>LSL: {pt.tolMin}</span>
                          <span style={{ color: '#38bdf8', fontWeight: 700 }}>Nom: {pt.nominal}</span>
                          <span>USL: {pt.tolMax}</span>
                        </div>
                        <div style={{ position: 'relative', height: '6px', backgroundColor: '#090d16', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', left: '0%', width: '100%', height: '100%', background: 'linear-gradient(to right, #ef4444 0%, #22c55e 20%, #22c55e 80%, #ef4444 100%)', opacity: 0.6 }} />
                          {pt.measuredVal !== '' && (
                            <div style={{ position: 'absolute', left: `${tolMetrics.pos}%`, top: 0, width: '4px', height: '100%', backgroundColor: '#ffffff', boxShadow: '0 0 4px #ffffff', transform: 'translateX(-50%)' }} />
                          )}
                        </div>
                      </div>

                      {/* Measurement Input & Gauge Tag (Large 7-Segment LCD Display) */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '22px', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🛠️ {pt.toolId}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {/* Micro-adjust -0.01 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const curr = parseFloat(pt.measuredVal) || pt.nominal;
                              handleMeasurementChange(pt.id, (curr - 0.01).toFixed(3));
                            }}
                            style={{
                              padding: '4px 7px',
                              borderRadius: '4px',
                              border: '1px solid #334155',
                              backgroundColor: '#090d16',
                              color: '#94a3b8',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                            title="Kurangi -0.01"
                          >
                            -
                          </button>

                          {/* 7-Segment Digital LCD Display Screen */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: '#020617',
                              border: isNG ? '2px solid #ef4444' : isOK ? '2px solid #22c55e' : '1.5px solid #38bdf8',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              boxShadow: isNG ? '0 0 12px rgba(239, 68, 68, 0.4), inset 0 2px 4px rgba(0,0,0,0.9)' : isOK ? '0 0 12px rgba(34, 197, 94, 0.4), inset 0 2px 4px rgba(0,0,0,0.9)' : 'inset 0 2px 4px rgba(0,0,0,0.9)',
                              minWidth: '135px'
                            }}
                          >
                            <input
                              type="number"
                              step="0.001"
                              placeholder="---.---"
                              value={pt.measuredVal}
                              onChange={(e) => handleMeasurementChange(pt.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCommitAndAdvance(pt.id, e.target.value);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: '95px',
                                background: 'transparent',
                                border: 'none',
                                color: isOK ? '#22c55e' : isNG ? '#ef4444' : '#38bdf8',
                                fontSize: '1.25rem',
                                fontFamily: "'Orbitron', 'Share Tech Mono', monospace",
                                fontWeight: 800,
                                letterSpacing: '1.5px',
                                textAlign: 'right',
                                outline: 'none',
                                textShadow: isOK ? '0 0 8px rgba(34, 197, 94, 0.6)' : isNG ? '0 0 8px rgba(239, 68, 68, 0.6)' : '0 0 8px rgba(56, 189, 248, 0.5)'
                              }}
                            />
                            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, marginLeft: '4px', fontFamily: "'Orbitron', monospace" }}>
                              {pt.unit}
                            </span>
                          </div>

                          {/* Handwriting Input Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenHandwriting(pt.id);
                            }}
                            style={{
                              padding: '4px 6px',
                              borderRadius: '4px',
                              border: '1px solid #7c3aed',
                              backgroundColor: 'rgba(124, 58, 237, 0.2)',
                              color: '#a855f7',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="✍️ Input tulisan tangan"
                          >
                            <Pen size={12} />
                          </button>

                          {/* Micro-adjust +0.01 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const curr = parseFloat(pt.measuredVal) || pt.nominal;
                              handleMeasurementChange(pt.id, (curr + 0.01).toFixed(3));
                            }}
                            style={{
                              padding: '4px 7px',
                              borderRadius: '4px',
                              border: '1px solid #334155',
                              backgroundColor: '#090d16',
                              color: '#94a3b8',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                            title="Tambah +0.01"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* TAB 2: FOCUS CHECK */}

          {/* Check Tab with Numpad */}
          {activeTab === 'Check' && (
            <CheckTabContent
              activePt={activePt}
              onChange={handleMeasurementChange}
              onCommit={handleCommitAndAdvance}
              onToggleStatus={handleToggleStatus}
            />
          )}

          {/* TAB 3: CALIBRATION & GAUGE LOG TABLE (ISO 9001: 7.1.5) */}
          {activeTab === 'Calibration' && (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8' }}>
                  ISO 9001: 7.1.5 MONITORING & MEASURING RESOURCES
                </div>
                <span style={{ fontSize: '0.62rem', backgroundColor: '#1e293b', color: '#22c55e', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  {gaugesList.filter(g => g.status === 'VALID').length}/{gaugesList.length} Terkalibrasi
                </span>
              </div>

              {/* Environmental Sensor Banner */}
              <div
                onClick={() => setShowEnvModal(true)}
                style={{ backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Thermometer size={16} color="#38bdf8" />
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f8fafc' }}>Suhu: {temperature}°C • Kelembaban: {humidity}% RH</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b' }}>ISO 1 Standard: 20°C ± 2°C (Klik untuk kalibrasi lingkungan)</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 800 }}>Edit ➔</span>
              </div>

              {/* Instruments List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {gaugesList.map((g, i) => {
                  const isValid = g.status === 'VALID';
                  const isExpiring = g.status === 'EXPIRING_SOON';
                  return (
                    <div
                      key={i}
                      style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '8px',
                        padding: '9px 12px',
                        border: isValid ? '1px solid #334155' : isExpiring ? '1px solid #eab308' : '1.5px solid #ef4444'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 700, color: '#f8fafc' }}>
                        <span>{g.name}</span>
                        <span style={{ color: isValid ? '#22c55e' : isExpiring ? '#eab308' : '#ef4444', fontSize: '0.64rem', fontWeight: 800 }}>
                          ● {g.status}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '0.66rem', color: '#94a3b8', marginTop: '4px' }}>
                        <span>ID: <strong style={{ color: '#38bdf8' }}>{g.id}</strong></span>
                        <span>Serial: {g.serial}</span>
                        <span>Cert No: {g.certNo}</span>
                        <span style={{ color: isValid ? '#cbd5e1' : '#ef4444' }}>Due: <strong>{g.dueDate}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SUMMARY & TWO-TIER SIGN-OFF (ISO 9001: 8.6) */}
          {activeTab === 'Summary' && (
            <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8' }}>
                  ISO 9001:2015 FINAL INSPECTION & SIGN-OFF
                </div>
                <span style={{ fontSize: '0.65rem', backgroundColor: '#1e293b', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  Clause 8.6
                </span>
              </div>

              {/* Statistics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Total Poin Diuji:</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>{stats.total} Poin</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Lulus (Pass Rate):</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: stats.failed > 0 ? '#ef4444' : '#22c55e' }}>
                    {Math.round((stats.passed / stats.total) * 100)}%
                  </div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Est. Process Cpk:</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>{stats.cpkEstimated}</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Critical Defect:</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: stats.criticalFailed > 0 ? '#ef4444' : '#22c55e' }}>
                    {stats.criticalFailed} Defect
                  </div>
                </div>
              </div>

              {/* Tier 1: Inspector Submission Badge */}
              <div style={{ backgroundColor: stats.failed > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', border: stats.failed > 0 ? '1.5px dashed #ef4444' : '1.5px dashed #22c55e', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>TIER 1: QC INSPECTOR CERTIFICATION</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                  <Award size={20} color={stats.failed > 0 ? '#ef4444' : '#22c55e'} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: stats.failed > 0 ? '#ef4444' : '#22c55e' }}>{stats.overallStatus}</div>
                    <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>Inspector: {inspectorName} • {new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Tier 2: Supervisor Approval Card */}
              {supervisorApproval.isApproved ? (
                <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1.5px solid #22c55e', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#86efac' }}>TIER 2: QA SUPERVISOR APPROVED ✓</span>
                    <span style={{ fontSize: '0.6rem', color: '#64748b', fontFamily: 'monospace' }}>{supervisorApproval.hash}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                    {supervisorApproval.supervisorName}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#cbd5e1', marginTop: '2px' }}>
                    {supervisorApproval.comments}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSupervisorModal(true)}
                  style={{
                    padding: '10px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1.5px dashed #38bdf8',
                    borderRadius: '10px',
                    color: '#38bdf8',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 800 }}>
                    <Lock size={14} /> Otorisasi Supervisor QA (Tier 2 Sign-off)
                  </div>
                  <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>Klik untuk memasukkan otorisasi & PIN rilis produk</span>
                </button>
              )}

              {/* NCR & Defect Reports Card (ISO Clause 8.7) */}
              {(ncrList.length > 0 || stats.failed > 0) && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1.5px solid #ef4444', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 800, color: '#fca5a5' }}>
                      <ShieldAlert size={15} color="#ef4444" />
                      <span>LAPORAN NCR (ISO 9001: 8.7)</span>
                    </div>
                    <span style={{ fontSize: '0.64rem', backgroundColor: '#ef4444', color: 'white', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      {ncrList.length} Diterbitkan
                    </span>
                  </div>

                  {ncrList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {ncrList.map((ncr, idx) => (
                        <div key={idx} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>
                              {ncr.ncrNumber}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                              Disposisi: <strong style={{ color: ncr.disposition === 'SCRAP' ? '#ef4444' : '#eab308' }}>{ncr.disposition}</strong> • Bin: {ncr.quarantineBin}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedNCRForView(ncr)}
                            style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FileText size={12} /> Buka Form NCR
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const firstNg = checkPoints.find(p => p.status === 'NG') || checkPoints[0];
                        setActiveNCRPoint(firstNg);
                        setShowNCRModal(true);
                      }}
                      style={{ width: '100%', padding: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <ShieldAlert size={13} /> Terbitkan Form NCR Sekarang
                    </button>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Catatan Mutu / Root-Cause Non-Conformance:</label>
                <textarea
                  rows={2}
                  value={inspectionNotes}
                  onChange={e => setInspectionNotes(e.target.value)}
                  placeholder="Catatan inspeksi QC atau tindakan korektif..."
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: '4px', padding: '6px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#090d16', color: 'white', fontSize: '0.72rem', outline: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Inspection Summary Footer & Submit Buttons */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, marginBottom: '3px' }}>
                <span style={{ color: '#cbd5e1' }}>Hasil Pengukuran</span>
                <span style={{ color: stats.failed > 0 ? '#ef4444' : '#22c55e' }}>{stats.passed}/{stats.total} Selesai ({stats.progress}%)</span>
              </div>
              <div style={{ width: '100%', height: '5px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${stats.progress}%`, height: '100%', backgroundColor: stats.failed > 0 ? '#ef4444' : '#22c55e', transition: 'width 0.3s' }} />
              </div>
            </div>

            {/* Action Buttons: Cancel, Print, Save Check Sheet */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleResetCheckSheet}
                style={{
                  flex: 1,
                  padding: '7px 8px',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>

              <button
                onClick={handlePrintQCReport}
                style={{
                  padding: '7px 10px',
                  backgroundColor: '#4c1d95',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Cetak Laporan PDF / Sertifikat Mutu ISO"
              >
                <Printer size={13} /> PDF
              </button>

              {/* 💾 Save Check Sheet Button */}
              <button
                onClick={handleSubmitCheckSheet}
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  padding: '7px 10px',
                  backgroundColor: '#22c55e',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 900,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(34, 197, 94, 0.4)'
                }}
              >
                <Save size={16} />
                Save Check Sheet
              </button>
            </div>
          </div>

        </div>
      )}

      </div>

      {/* ─── DATA SOURCE CONFIGURATION MODAL ───────────────────────────────── */}
      {showTableConfigModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', width: '560px', maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>Konfigurasi Data Source & Tabel Penyimpanan</h3>
              </div>
              <button onClick={() => setShowTableConfigModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                  Tentukan tabel Mandor tempat hasil input pengukuran digital checksheet (Work Order, Nomor Seri, Nilai Dimensi, Cpk, dan Status Kelulusan) akan disimpan secara otomatis.
                </p>
              </div>

              {/* Table Selection */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
                  PILIH TABEL DATA SOURCE:
                </label>
                
                {availableTables.length === 0 ? (
                  <div style={{ padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
                    Belum ada tabel data di database. Silakan buat tabel standar di bawah.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                    {availableTables.map(tbl => {
                      const isSelected = tbl.id === targetTableId;
                      return (
                        <div
                          key={tbl.id}
                          onClick={() => {
                            setTargetTableId(tbl.id);
                            localStorage.setItem('mandor_checksheet_target_table_id', tbl.id);
                          }}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                            border: isSelected ? '1.5px solid #38bdf8' : '1px solid #334155',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Table size={16} color={isSelected ? '#38bdf8' : '#64748b'} />
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                                {tbl.name}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                {tbl.description || `${(tbl.fields || []).length} fields terdefinisi`}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#0284c7', color: 'white', fontWeight: 800 }}>
                              TERKONEKSI ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Auto-Create Standard Table Action */}
              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>Belum punya tabel inspeksi?</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Buat tabel standar otomatis dengan 14 field ISO 9001.</div>
                  </div>
                  <button
                    onClick={handleCreateStandardQcTable}
                    disabled={isCreatingTable}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#22c55e',
                      color: '#0f172a',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={14} />
                    {isCreatingTable ? 'Membuat Tabel...' : 'Buat Tabel Standar QC'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowTableConfigModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0284c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Selesai & Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRINT TEMPLATE SELECTOR MODAL ───────────────────────────────────── */}
      {showPrintTemplateModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(6px)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPrintTemplateModal(false); }}
        >
          <div style={{
            backgroundColor: '#0f172a', border: '1px solid #334155',
            borderRadius: '16px', width: '520px', maxWidth: '95vw',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #1e293b',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', backgroundColor: '#4c1d95',
                  borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Printer size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                    Pilih Template Cetak
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                    Template laporan QC untuk certificate ISO 9001
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowPrintTemplateModal(false)}
                style={{
                  width: '32px', height: '32px', backgroundColor: '#1e293b',
                  border: '1px solid #334155', borderRadius: '8px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94a3b8'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Template List */}
            <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '12px 20px' }}>
              {availablePrintTemplates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#475569' }}>
                  <Printer size={32} color="#334155" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                    Tidak ada template QC ditemukan
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '4px' }}>
                    Buat template di Report Designer Studio
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availablePrintTemplates.map(tpl => (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        setSelectedPrintTemplateId(tpl.id);
                        setShowPrintTemplateModal(false);
                        toast.success(`Template "${tpl.name}" dipilih. Siap cetak!`);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 14px',
                        backgroundColor: selectedPrintTemplateId === tpl.id ? 'rgba(76,29,149,0.2)' : '#0f172a',
                        border: `1.5px solid ${selectedPrintTemplateId === tpl.id ? '#7c3aed' : '#1e293b'}`,
                        borderRadius: '10px', cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => {
                        if (selectedPrintTemplateId !== tpl.id) {
                          e.currentTarget.style.backgroundColor = '#1e293b';
                          e.currentTarget.style.borderColor = '#334155';
                        }
                      }}
                      onMouseLeave={e => {
                        if (selectedPrintTemplateId !== tpl.id) {
                          e.currentTarget.style.backgroundColor = '#0f172a';
                          e.currentTarget.style.borderColor = '#1e293b';
                        }
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px',
                        backgroundColor: '#4c1d95',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Printer size={16} color="white" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tpl.name}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                          {tpl.category || 'Quality Control'} • {tpl.paperPresetId || 'A4'}
                        </div>
                      </div>
                      {selectedPrintTemplateId === tpl.id && (
                        <div style={{
                          width: '22px', height: '22px', backgroundColor: '#4c1d95',
                          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Check size={12} color="white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #1e293b' }}>
              <button
                onClick={() => setShowPrintTemplateModal(false)}
                style={{
                  padding: '8px 16px', backgroundColor: '#1e293b',
                  color: '#94a3b8', border: '1px solid #334155',
                  borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', width: '100%'
                }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── COMPANION MODAL: QR CODE & LINK GENERATION ───────────────────────── */}
      {showCompanionModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0f172a', border: '2px solid #8b5cf6', borderRadius: '16px', width: '520px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(139, 92, 246, 0.3)', overflow: 'hidden' }}>

            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#8b5cf6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={22} color="white" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>Companion Mode</h3>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#a78bfa' }}>Scan QR Code untuk memulai inspeksi di device lain</p>
                </div>
              </div>
              <button onClick={() => setShowCompanionModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Work Order Info Card */}
              <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Globe size={16} color="#8b5cf6" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>Informasi Check Sheet</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Work Order:</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>{workOrderNo}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Serial Number:</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>{partSerial}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Jumlah Poin:</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e' }}>{checkPoints.length} Dimensi</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Status:</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e' }}>PUBLISHED ✓</div>
                  </div>
                </div>
              </div>

              {/* QR Code Display - Clickable to Open Live Check Sheet */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div
                  onClick={() => {
                    if (companionLink) window.open(companionLink, '_blank');
                  }}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.2)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.2)';
                  }}
                  title="Klik untuk membuka Digital Check Sheet di tab baru"
                >
                  {/* QR Code */}
                  {companionLink && (
                    <QRCode
                      id="companion-qr-code"
                      value={companionLink}
                      size={220}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#0f172a"
                    />
                  )}
                  {/* Overlay hint */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(2, 132, 199, 0.95)',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    whiteSpace: 'nowrap'
                  }}>
                    <ExternalLink size={11} /> Klik / Scan untuk Jalankan
                  </div>
                </div>

                {/* Primary Button to Open Real Check Sheet */}
                <button
                  onClick={() => {
                    if (companionLink) {
                      setShowCompanionModal(false);
                      window.open(companionLink, '_blank');
                    }
                  }}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#0284c7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  <ExternalLink size={15} /> Buka & Jalankan Live Check Sheet
                </button>

                <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                  Scan QR Code ini menggunakan smartphone, tablet, atau buka di tab baru<br />untuk langsung mengisi pengukuran secara interaktif.
                </p>
              </div>

              {/* Link Input */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  <Link size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Direct Check Sheet Link:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    readOnly
                    value={companionLink}
                    style={{
                      flex: 1,
                      backgroundColor: '#020617',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#38bdf8',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleCopyLink}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: linkCopied ? '#22c55e' : '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {linkCopied ? (
                      <>
                        <CheckCircle size={14} />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Smartphone size={16} color="#a78bfa" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#a78bfa' }}>Fitur Check Sheet Live</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.8 }}>
                  <li>Scan QR Code dengan kamera ponsel / tablet operator</li>
                  <li>Check Sheet interaktif langsung terbuka dengan nomor WO: <strong>{workOrderNo}</strong></li>
                  <li>Operator dapat menggunakan mode <strong>Inspect (Guided)</strong> dan display 7-Segment LCD</li>
                  <li>Hasil ukur otomatis tersimpan ke tabel database & log ISO 9001</li>
                </ol>
              </div>

              {/* Download QR Button */}
              <button
                onClick={handleDownloadQRCode}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #8b5cf6',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Download size={16} color="#a78bfa" />
                Download QR Code (PNG)
              </button>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setShowCompanionModal(false)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#334155',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stamp Selection Modal */}
      {showStampModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '2px solid #8b5cf6',
            borderRadius: '16px',
            width: '520px',
            maxWidth: '95vw',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem', fontWeight: 800 }}>🏷️ Pilih Stamp</h3>
                <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>Klik stamp untuk memilih, lalu klik di canvas untuk menempatkan</p>
              </div>
              <button onClick={() => setShowStampModal(false)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {STAMPS.map(stamp => (
                <button
                  key={stamp.id}
                  onClick={() => {
                    setSelectedStamp(stamp.id);
                    setDrawingTool('stamp');
                    setShowStampModal(false);
                    toast.success(`Stamp "${stamp.label}" siap ditempelkan - klik canvas untuk menempatkan`);
                  }}
                  style={{
                    padding: '12px 8px',
                    backgroundColor: stamp.bg,
                    border: `2px solid ${stamp.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <div style={{ fontSize: '1.5rem' }}>{stamp.icon}</div>
                  <div style={{
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    color: stamp.color,
                    textAlign: 'center',
                    letterSpacing: '0.5px'
                  }}>{stamp.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Text Note Annotation Modal */}
      {showTextModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '2px solid #a855f7',
            borderRadius: '16px',
            width: '440px',
            maxWidth: '92vw',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Type size={18} color="#c084fc" />
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '0.95rem', fontWeight: 800 }}>Tambah Catatan / Label Drawing</h3>
              </div>
              <button
                onClick={() => { setShowTextModal(false); setTextInputPosition(null); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: '0.75rem' }}>
              Masukkan teks anotasi yang ingin ditampilkan pada titik posisi ({textInputPosition?.x}, {textInputPosition?.y}):
            </p>

            <input
              type="text"
              autoFocus
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTextAnnotation(textInputValue);
                if (e.key === 'Escape') { setShowTextModal(false); setTextInputPosition(null); }
              }}
              placeholder="Contoh: Permukaan baret 0.2mm / Burr pada radius..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.85rem',
                marginBottom: '16px',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => { setShowTextModal(false); setTextInputPosition(null); }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#334155',
                  color: '#cbd5e1',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                onClick={() => handleAddTextAnnotation(textInputValue)}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#a855f7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)'
                }}
              >
                Tambahkan Teks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handwriting / OCR Input Modal */}
      {showHandwritingModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #7c3aed', borderRadius: '12px', width: '420px', maxWidth: '92vw', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 20px 50px rgba(124, 58, 237, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: 800, fontSize: '0.9rem' }}>
                <Pen size={16} /> Input Nilai Ukur Poin Dimensi
              </div>
              <button onClick={() => setShowHandwritingModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Ketik atau masukkan angka hasil pengukuran untuk poin #{checkPoints.find(p => p.id === handwritingTargetPointId)?.pointNumber || ''}:
            </div>
            <input
              type="number"
              step="0.001"
              autoFocus
              placeholder="Contoh: 25.020"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  handleHandwritingRecognize(e.target.value);
                }
              }}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #7c3aed', backgroundColor: '#090d16', color: 'white', fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 800, outline: 'none' }}
              id="handwriting-quick-input"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowHandwritingModal(false)} style={{ padding: '8px 14px', backgroundColor: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
              <button
                onClick={() => {
                  const val = document.getElementById('handwriting-quick-input')?.value;
                  if (val) handleHandwritingRecognize(val);
                }}
                style={{ padding: '8px 18px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Terapkan Nilai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ISO 9001:2015 & IATF 16949 COMPLIANCE MODALS ──────────────────── */}

      {/* 1. NCR (Non-Conformance Report) & Red Tag Modal (Clause 8.7) */}
      <NCRDefectModal
        isOpen={showNCRModal}
        onClose={() => setShowNCRModal(false)}
        activePoint={activeNCRPoint || checkPoints.find(p => p.status === 'NG') || checkPoints[0]}
        checkPoints={checkPoints}
        workOrderNo={workOrderNo}
        partSerial={partSerial}
        partName={partName || 'Precision Housing Component'}
        partNo={partNo || partSerial}
        lotBatchNo={lotBatchNo}
        stationId={stationId}
        docNo={docNo}
        inspectorName={inspectorName}
        onSaveNCR={handleSaveNCR}
      />

      {/* Official Form NCR Standalone Viewer / Print Modal */}
      {selectedNCRForView && (
        <OfficialNCRFormModal
          isOpen={!!selectedNCRForView}
          onClose={() => setSelectedNCRForView(null)}
          ncrData={selectedNCRForView}
        />
      )}

      {/* 2. ISO Audit Trail & Revision History Modal (Clause 7.5.3) */}
      <AuditTrailModal
        isOpen={showAuditTrailModal}
        onClose={() => setShowAuditTrailModal(false)}
        auditTrail={auditTrail}
        workOrderNo={workOrderNo}
      />

      {/* 3. Two-Tier QA Supervisor Approval Modal (Clause 8.6) */}
      <SupervisorApprovalModal
        isOpen={showSupervisorModal}
        onClose={() => setShowSupervisorModal(false)}
        stats={stats}
        workOrderNo={workOrderNo}
        partSerial={partSerial}
        onApprove={handleSupervisorApprove}
      />

      {/* 4. Environmental Conditions Calibration Modal (Clause 7.1.5) */}
      <EnvironmentSettingsModal
        isOpen={showEnvModal}
        onClose={() => setShowEnvModal(false)}
        temperature={temperature}
        humidity={humidity}
        onSave={handleUpdateEnvironment}
      />

      {/* ─── DEDICATED MOBILE & TABLET INDUSTRIAL QC TOUCH MODE ───── */}
      {isMobileTabletModeActive && (
        <MobileTabletCheckSheet
          checksheet={currentCheckSheet}
          drawingSvg={drawingPreview || (selectedDrawing?.svgData || selectedDrawing?.dataUrl)}
          checkPoints={checkPoints}
          measuredValues={checkPoints.reduce((acc, p) => ({ ...acc, [p.id]: p.measuredVal }), {})}
          onValueChange={(pointId, val) => {
            handleCommitAndAdvance(pointId, val);
          }}
          onOpenHardwareHub={() => setShowHardwareHub(true)}
          onOpenDefectCamera={() => setShowCameraInput(true)}
          onOpenSignatureModal={() => setShowSignModal(true)}
          onSubmitChecksheet={handleSubmitCheckSheet}
          onCloseMobileMode={() => setIsMobileTabletModeActive(false)}
          currentPointIndex={activePointIndex}
          onSelectPoint={(idx) => setActivePointIndex(idx)}
        />
      )}

    </div>
  );
}
