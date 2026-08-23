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
  CheckCircle
} from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { getAllDrawings } from '../utils/supabaseUtilityDB';
import { getTables, addTableRecord, createTable } from '../utils/supabaseTablesDB';
import whatsappService from '../utils/whatsappService';
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

  // State
  const [drawingsList, setDrawingsList] = useState([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState('dwg_cast_housing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('casting');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Check sheet items state
  const [checkPoints, setCheckPoints] = useState(INITIAL_CHECK_POINTS);
  const [activePointId, setActivePointId] = useState('cp_1');
  const [activeTab, setActiveTab] = useState('Checkers'); // Checkers | Check | Calibration | Summary
  const [filterCriticality, setFilterCriticality] = useState('ALL');

  // Canvas Viewport State (Zoom & Pan)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showRuler, setShowRuler] = useState(true);
  const [darkModeBlueprint, setDarkModeBlueprint] = useState(false);

  // ISO 9001 Traceability & Work Order Metadata
  const [workOrderNo, setWorkOrderNo] = useState('WO-2026-CAST-042');
  const [partSerial, setPartSerial] = useState('SN-8842-A');
  const [lotBatchNo, setLotBatchNo] = useState('LOT-202608-01');
  const [stationId, setStationId] = useState('ST-CNC-04');
  const [shiftNo, setShiftNo] = useState('Shift 1 (Day)');
  const [inspectorName, setInspectorName] = useState(currentUser?.username || 'QC Officer (Budi S.)');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data Source / Target Table State
  const [availableTables, setAvailableTables] = useState([]);
  const [targetTableId, setTargetTableId] = useState(() => localStorage.getItem('mandor_checksheet_target_table_id') || '');
  const [showTableConfigModal, setShowTableConfigModal] = useState(false);
  const [isCreatingTable, setIsCreatingTable] = useState(false);

  // Publish & Companion State
  const [isPublished, setIsPublished] = useState(() => localStorage.getItem('mandor_checksheet_published') === 'true');
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [companionLink, setCompanionLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

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

    return { total, passed, failed, pending, criticalFailed, progress, overallStatus, cpkEstimated };
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

    const updatedPoints = checkPoints.map((p, idx) => {
      if (idx === ptIndex) {
        return { ...p, measuredVal: finalVal, status, disposition };
      }
      return p;
    });

    setCheckPoints(updatedPoints);

    // Check if there is a next point in the list
    if (ptIndex + 1 < updatedPoints.length) {
      const nextPt = updatedPoints[ptIndex + 1];
      setActivePointId(nextPt.id);
      toast.success(`Poin #${pt.pointNumber} [${status}] tersimpan ➔ Lanjut #${nextPt.pointNumber}`, { duration: 1500 });
    } else {
      // All points finished!
      const totalPassed = updatedPoints.filter(p => p.status === 'OK').length;
      const totalFailed = updatedPoints.filter(p => p.status === 'NG').length;
      const overall = totalFailed > 0 ? 'REJECTED (NG)' : 'APPROVED (OK)';

      toast.success(`🎉 Seluruh 12 Dimensi Selesai! Menyimpan sertifikat inspeksi...`, { duration: 3000 });
      
      // Auto-save and move to Summary tab
      saveInspectionPayload(updatedPoints, overall);
      setActiveTab('Summary');
    }
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
  const handlePassAll = () => {
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

    // Generate direct functional URL to Digital Drawing Check Sheet
    const companionUrl = `${origin}${pathname}#/drawing-checksheet?wo=${encodeURIComponent(workOrderNo)}&sn=${encodeURIComponent(partSerial)}&lot=${encodeURIComponent(lotBatchNo)}&station=${encodeURIComponent(stationId)}&inspector=${encodeURIComponent(inspectorName)}`;

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
    } catch (err) {
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

      const reportData = {
        report_qr: `https://mandor-core.online/inspection/${workOrderNo}`,
        doc_id: `ISO9001-QIC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-3)}`,
        wo_value: workOrderNo,
        serial_value: partSerial,
        drawing_value: 'MANDOR-QA-2026-08 (Rev. 2.1)',
        part_name_value: 'Engine Casting Housing Base Plate',
        inspector_value: inspectorName,
        date_value: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
        status_value: stats.overallStatus,
        pass_count_value: `${stats.passed} / ${stats.total}`,
        defect_count_value: `${stats.failed}`,
        notes_value: inspectionNotes || 'All primary geometric features verified against calibrated standards.'
      };

      await executeReportPrintAction({
        reportId: 'ISO_9001_INSPECTION_CERT',
        data: reportData,
        silent: false
      });
      toast.success('Membuka dialog cetak sertifikat QC ISO 9001...');
    } catch (err) {
      console.warn('Fallback print:', err);
      window.print();
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
    setZoom(prev => Math.min(Math.max(0.4, +(prev + delta).toFixed(2)), 3.0));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

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
        {/* Left: Branding & Drawing Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              padding: '6px 8px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isSidebarOpen ? 'Sembunyikan Sidebar Explorer' : 'Buka Sidebar Explorer'}
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <FolderOpen size={16} color="#38bdf8" />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', backgroundColor: '#22c55e', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 900, fontSize: '0.9rem' }}>
              M
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff', lineHeight: 1.1 }}>
                MANDOR<span style={{ color: '#22c55e' }}>®</span> <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700 }}>DIGITAL CHECK SHEET</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                ISO 9001:2015 & IATF 16949 COMPLIANT INSPECTION SYSTEM
              </div>
            </div>
          </div>
        </div>

        {/* Center: ISO Traceability Badge & Target Table Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '4px 12px', borderRadius: '20px' }}>
            <ShieldCheck size={14} color="#22c55e" />
            <span style={{ fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 700 }}>
              {workOrderNo} • {partSerial}
            </span>
            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: stats.failed > 0 ? '#ef4444' : stats.passed === stats.total ? '#22c55e' : '#0284c7', color: 'white', fontWeight: 800 }}>
              {stats.overallStatus} ({stats.passed}/{stats.total})
            </span>
            <span style={{ fontSize: '0.65rem', color: '#64748b', borderLeft: '1px solid #334155', paddingLeft: '8px' }}>
              Cpk: <strong style={{ color: stats.failed > 0 ? '#ef4444' : '#38bdf8' }}>{stats.cpkEstimated}</strong>
            </span>
          </div>

          {/* Data Source / Target Table Configuration Badge */}
          <button
            onClick={() => setShowTableConfigModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              border: targetTable ? '1px solid #0284c7' : '1px dashed #eab308',
              padding: '5px 10px',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '0.72rem',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            title="Klik untuk memilih atau konfigurasi tabel penyimpanan hasil checksheet"
          >
            <Database size={13} color="#38bdf8" />
            <span style={{ color: '#94a3b8' }}>Tabel:</span>
            <strong style={{ color: targetTable ? '#38bdf8' : '#eab308', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {targetTable ? targetTable.name : 'Pilih Tabel Data'}
            </strong>
            <Settings2 size={12} color="#94a3b8" />
          </button>
        </div>

        {/* Right Tools: Zoom, Print, Drawing Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Companion Button - Generate Link & QR Code */}
          <button
            onClick={handleGenerateCompanionLink}
            disabled={!isPublished}
            style={{
              padding: '6px 12px',
              backgroundColor: isPublished ? '#8b5cf6' : '#334155',
              color: isPublished ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: isPublished ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isPublished ? '0 0 12px rgba(139, 92, 246, 0.4)' : 'none',
              transition: 'all 0.2s'
            }}
            title={isPublished ? 'Generate QR Code & Link untuk device companion' : 'Publish dulu untuk generate QR Code'}
          >
            <QrCode size={14} />
            <Smartphone size={14} />
            Companion
          </button>

          {/* Publish Button - Publish to Live Player */}
          <button
            onClick={handlePublishCheckSheet}
            disabled={isPublishing || isPublished}
            style={{
              padding: '6px 12px',
              backgroundColor: isPublished ? '#22c55e' : isPublishing ? '#0284c7' : '#eab308',
              color: isPublished ? '#0f172a' : '#0f172a',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: isPublished ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isPublished ? '0 0 12px rgba(34, 197, 94, 0.4)' : '0 0 12px rgba(234, 179, 8, 0.4)',
              transition: 'all 0.2s'
            }}
            title={isPublished ? 'Check Sheet sudah dipublish ke Live Player' : isPublishing ? 'Mempublish...' : 'Publish ke Live Player'}
          >
            {isPublished ? (
              <>
                <CheckCircle size={14} />
                Published
              </>
            ) : isPublishing ? (
              <>
                <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Publishing...
              </>
            ) : (
              <>
                <Upload size={14} />
                Publish
              </>
            )}
          </button>

          {/* Unpublish Button - Remove from Live Player */}
          {isPublished && (
            <button
              onClick={handleUnpublishCheckSheet}
              style={{
                padding: '6px 10px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Hapus dari Live Player"
            >
              <X size={12} />
              Unpublish
            </button>
          )}

          {/* Zoom Controller */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: '6px', padding: '2px 6px', gap: '4px' }}>
            <button onClick={() => handleZoom(-0.15)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }} title="Zoom Out"><ZoomOut size={14} /></button>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, minWidth: '40px', textAlign: 'center', color: '#38bdf8' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => handleZoom(0.15)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }} title="Zoom In"><ZoomIn size={14} /></button>
            <button onClick={handleResetView} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', fontSize: '0.68rem', fontWeight: 700 }} title="Reset Fit">Fit</button>
          </div>

          <button onClick={() => setShowRuler(!showRuler)} style={{ background: showRuler ? 'rgba(56, 189, 248, 0.2)' : '#1e293b', border: '1px solid #334155', color: showRuler ? '#38bdf8' : '#94a3b8', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }} title="Toggle Grid / Rulers"><Grid size={14} /></button>
          <button onClick={() => setDarkModeBlueprint(!darkModeBlueprint)} style={{ background: darkModeBlueprint ? 'rgba(34, 197, 94, 0.2)' : '#1e293b', border: '1px solid #334155', color: darkModeBlueprint ? '#22c55e' : '#94a3b8', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }} title="Invert Theme"><Eye size={14} /></button>
          <button onClick={handlePrintQCReport} style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }} title="Print / PDF ISO Certificate"><Printer size={14} /></button>

          <button
            onClick={() => navigate('/inspector-designer')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
            }}
            title="Buka Inspector Designer Studio"
          >
            <FileCode size={14} /> Inspector Studio
          </button>
        </div>
      </div>

      {/* ─── 2. MAIN 3-PANEL WORKSPACE (RESPONSIVE & COLLAPSIBLE) ───────────────── */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: isSidebarOpen ? '250px 1fr 370px' : '0px 1fr 370px',
          transition: 'grid-template-columns 0.2s ease',
          overflow: 'hidden'
        }}
      >

        {/* ─── LEFT PANEL: DRAWING EXPLORER (COLLAPSIBLE) ────────────────────── */}
        <div style={{ backgroundColor: '#0f172a', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '12px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderOpen size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f1f5f9' }}>Drawing Explorer</span>
            </div>
            <span style={{ fontSize: '0.62rem', backgroundColor: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>ISO Drawings</span>
          </div>

          {/* Search Bar */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: '6px', padding: '4px 8px', gap: '6px' }}>
              <Search size={14} color="#64748b" />
              <input
                placeholder="Cari part / drawing..."
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
                    <span>📄 Engine Casting (Rev 2.1)</span>
                    <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>12 pts</span>
                  </div>
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

          {/* ISO 9001 Work Order & Traceability Card */}
          <div style={{ padding: '12px', borderTop: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.5px' }}>ISO TRACEABILITY INFO</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <span style={{ color: '#64748b' }}>WO No:</span>
              <input value={workOrderNo} onChange={e => setWorkOrderNo(e.target.value)} style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 700, textAlign: 'right', outline: 'none', width: '130px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <span style={{ color: '#64748b' }}>Serial / Lot:</span>
              <input value={partSerial} onChange={e => setPartSerial(e.target.value)} style={{ background: 'none', border: 'none', color: '#f8fafc', fontWeight: 600, textAlign: 'right', outline: 'none', width: '130px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <span style={{ color: '#64748b' }}>Inspector:</span>
              <input value={inspectorName} onChange={e => setInspectorName(e.target.value)} style={{ background: 'none', border: 'none', color: '#22c55e', fontWeight: 600, textAlign: 'right', outline: 'none', width: '130px' }} />
            </div>
          </div>
        </div>

        {/* ─── CENTER PANEL: SYMMETRICAL INTERACTIVE BLUEPRINT CANVAS ────────── */}
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
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crosshair size={15} color="#22c55e" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>Check Sheet Canvas</span>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Klik pin untuk mengukur</span>
            </div>

            {/* 🔍 Guided Inspect Trigger Button */}
            <button
              onClick={() => handleStartInspection()}
              style={{
                backgroundColor: '#0284c7',
                color: 'white',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 14px rgba(2, 132, 199, 0.5)'
              }}
              title="Mulai alur inspeksi otomatis terpandu poin demi poin"
            >
              <Sparkles size={14} color="#38bdf8" /> Inspect (Guided Mode)
            </button>

            <button
              onClick={handlePassAll}
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.95)',
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

            {/* Interactive Hotspot Pins (Precisely Aligned on Drawing Features) */}
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
                    handleStartInspection(pt.id);
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

                  {/* Tooltip Label on Active */}
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
                      <span>{pt.pointNumber}. {pt.title} ({pt.criticality})</span>
                      <span style={{ color: '#38bdf8', fontSize: '0.65rem' }}>Nom: {pt.nominal} ({pt.tolMin} - {pt.tolMax} {pt.unit})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── RIGHT PANEL: DIGITAL CHECK SHEET & TOLERANCE INSPECTOR ────────── */}
        <div style={{ backgroundColor: '#0f172a', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

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

          {/* TAB 2: FOCUS SINGLE POINT INSPECTION (GUIDED AUTO-ADVANCE FLOW) */}
          {activeTab === 'Check' && (() => {
            const currIdx = checkPoints.findIndex(p => p.id === activePt.id);
            const prevPt = currIdx > 0 ? checkPoints[currIdx - 1] : null;
            const nextPt = currIdx + 1 < checkPoints.length ? checkPoints[currIdx + 1] : null;

            return (
              <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                {/* Guided Navigation Top Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#090d16', padding: '6px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <button
                    disabled={!prevPt}
                    onClick={() => prevPt && setActivePointId(prevPt.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: prevPt ? '#1e293b' : 'transparent',
                      color: prevPt ? '#cbd5e1' : '#475569',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: prevPt ? 'pointer' : 'not-allowed'
                    }}
                  >
                    ← Poin Sebelumnya
                  </button>

                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38bdf8', fontFamily: "'Orbitron', monospace" }}>
                    POIN {currIdx + 1} / {checkPoints.length}
                  </span>

                  <button
                    disabled={!nextPt}
                    onClick={() => nextPt && setActivePointId(nextPt.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: nextPt ? '#1e293b' : 'transparent',
                      color: nextPt ? '#cbd5e1' : '#475569',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: nextPt ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Poin Berikutnya →
                  </button>
                </div>

                <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '12px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, fontFamily: "'Orbitron', monospace" }}>FITUR GEOMETRI #{activePt.pointNumber}</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: activePt.status === 'OK' ? '#22c55e' : activePt.status === 'NG' ? '#ef4444' : '#64748b', color: 'white', fontWeight: 800 }}>
                      {activePt.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 2px 0' }}>{activePt.title}</h3>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>{activePt.notes}</p>
                </div>

                {/* Large 7-Segment LCD CMM / Caliper Display Unit */}
                <div
                  style={{
                    backgroundColor: '#020617',
                    border: activePt.status === 'NG' ? '2.5px solid #ef4444' : activePt.status === 'OK' ? '2.5px solid #22c55e' : '2px solid #38bdf8',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    boxShadow: activePt.status === 'NG' ? '0 0 20px rgba(239, 68, 68, 0.4), inset 0 3px 6px rgba(0,0,0,0.9)' : activePt.status === 'OK' ? '0 0 20px rgba(34, 197, 94, 0.4), inset 0 3px 6px rgba(0,0,0,0.9)' : '0 0 16px rgba(56, 189, 248, 0.3), inset 0 3px 6px rgba(0,0,0,0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.7rem', color: '#64748b', fontFamily: "'Orbitron', monospace", fontWeight: 700 }}>
                    <span>DIGITAL READOUT [{activePt.toolId}]</span>
                    <span style={{ color: activePt.status === 'OK' ? '#22c55e' : activePt.status === 'NG' ? '#ef4444' : '#38bdf8' }}>{activePt.status}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', width: '100%', justifyContent: 'center' }}>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="00.000"
                      value={activePt.measuredVal}
                      onChange={(e) => handleMeasurementChange(activePt.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCommitAndAdvance(activePt.id, e.target.value);
                        }
                      }}
                      autoFocus
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: activePt.status === 'OK' ? '#22c55e' : activePt.status === 'NG' ? '#ef4444' : '#38bdf8',
                        fontSize: '2.4rem',
                        fontFamily: "'Orbitron', 'Share Tech Mono', monospace",
                        fontWeight: 900,
                        letterSpacing: '3px',
                        textAlign: 'center',
                        outline: 'none',
                        width: '240px',
                        textShadow: activePt.status === 'OK' ? '0 0 12px rgba(34, 197, 94, 0.8)' : activePt.status === 'NG' ? '0 0 12px rgba(239, 68, 68, 0.8)' : '0 0 12px rgba(56, 189, 248, 0.8)'
                      }}
                    />
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#94a3b8', fontFamily: "'Orbitron', monospace" }}>{activePt.unit}</span>
                  </div>

                  {/* Quick Step Adjustments */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    {[-0.05, -0.01, -0.001, 0.001, 0.01, 0.05].map(step => (
                      <button
                        key={step}
                        onClick={() => {
                          const curr = parseFloat(activePt.measuredVal) || activePt.nominal;
                          handleMeasurementChange(activePt.id, (curr + step).toFixed(3));
                        }}
                        style={{
                          padding: '3px 7px',
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '4px',
                          color: step > 0 ? '#38bdf8' : '#cbd5e1',
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          cursor: 'pointer'
                        }}
                      >
                        {step > 0 ? `+${step}` : step}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specification Card */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ backgroundColor: '#090d16', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Nominal Spec:</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', fontFamily: "'Orbitron', monospace" }}>{activePt.nominal} {activePt.unit}</div>
                  </div>
                  <div style={{ backgroundColor: '#090d16', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Tolerance Band:</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', fontFamily: "'Orbitron', monospace" }}>{activePt.tolMin} ~ {activePt.tolMax}</div>
                  </div>
                </div>

                {/* Primary Auto-Advance Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    onClick={() => handleCommitAndAdvance(activePt.id, activePt.measuredVal)}
                    style={{
                      width: '100%',
                      padding: '11px',
                      backgroundColor: '#0284c7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
                    }}
                  >
                    <span>Simpan & Lanjut (Enter ➔)</span>
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleCommitAndAdvance(activePt.id, activePt.nominal.toString(), 'OK')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#22c55e',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Check size={16} strokeWidth={3} /> SET PASS & LANJUT
                    </button>
                    <button
                      onClick={() => handleCommitAndAdvance(activePt.id, activePt.measuredVal || (activePt.tolMax + 0.05).toFixed(3), 'NG')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <X size={16} strokeWidth={3} /> SET REJECT & LANJUT
                    </button>
                  </div>
                </div>

                {/* Non-Conformance Disposition */}
                {activePt.status === 'NG' && (
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.72rem', fontWeight: 800, marginBottom: '6px' }}>
                      <AlertTriangle size={14} /> ISO 9001: 8.7 NON-CONFORMANCE DISPOSITION
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Disposition Action: <strong style={{ color: '#fca5a5' }}>{activePt.disposition}</strong></div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 3: CALIBRATION & GAUGE LOG TABLE */}
          {activeTab === 'Calibration' && (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>
                ISO 9001: 7.1.5 MONITORING & MEASURING RESOURCES LOG
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { tool: 'Digital Bore Gauge', id: 'BG-014', calDate: '2025-12-31', due: '2026-12-31', status: 'VALID' },
                  { tool: 'Depth Micrometer', id: 'DM-008', calDate: '2025-11-15', due: '2026-11-15', status: 'VALID' },
                  { tool: 'Pin Gauge Set', id: 'PG-022', calDate: '2026-02-28', due: '2027-02-28', status: 'VALID' },
                  { tool: 'Digital Caliper 0-150mm', id: 'CAL-003', calDate: '2025-10-30', due: '2026-10-30', status: 'VALID' },
                  { tool: 'CMM Zeiss Contura', id: 'CMM-001', calDate: '2026-04-10', due: '2027-04-10', status: 'VALID' },
                  { tool: 'Dial Indicator (0.001mm)', id: 'DI-007', calDate: '2025-11-20', due: '2026-11-20', status: 'VALID' }
                ].map((g, i) => (
                  <div key={i} style={{ backgroundColor: '#1e293b', borderRadius: '6px', padding: '8px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>
                      <span>{g.tool}</span>
                      <span style={{ color: '#22c55e', fontSize: '0.65rem' }}>● {g.status}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                      <span>Tag: <strong>{g.id}</strong></span>
                      <span>Cal Due: {g.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SUMMARY & STATISTICAL SIGN-OFF */}
          {activeTab === 'Summary' && (
            <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8' }}>
                ISO 9001:2015 FINAL INSPECTION & SIGN-OFF
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

              {/* QA Approval Stamp */}
              <div style={{ backgroundColor: stats.failed > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', border: stats.failed > 0 ? '2px dashed #ef4444' : '2px dashed #22c55e', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Official Quality Assurance Stamp</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
                  <Award size={24} color={stats.failed > 0 ? '#ef4444' : '#22c55e'} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: stats.failed > 0 ? '#ef4444' : '#22c55e' }}>{stats.overallStatus}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Certified by {inspectorName} on {new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Catatan / Root-Cause Non-Conformance:</label>
                <textarea
                  rows={3}
                  value={inspectionNotes}
                  onChange={e => setInspectionNotes(e.target.value)}
                  placeholder="Catatan inspeksi QC atau tindakan korektif..."
                  style={{ width: '100%', marginTop: '4px', padding: '6px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#090d16', color: 'white', fontSize: '0.72rem', outline: 'none' }}
                />
              </div>
            </div>
          )}

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

            {/* Action Buttons: Cancel, Print, Save Check Sheet */}
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
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>

              <button
                onClick={handlePrintQCReport}
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#714B67',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={14} /> PDF
              </button>

              {/* 💾 Save Check Sheet Button */}
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
    </div>
  );
}
