import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import QRCode from 'react-qr-code';
import ReactMarkdown from 'react-markdown';
import { Wallet } from 'lucide-react';
import { CADViewer3D } from './CADViewer3D';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  PieChart as RechartsPieChart, Pie,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
  ReferenceLine
} from 'recharts';
import { useLocation, useParams } from 'react-router-dom';
import {
  Activity,
  Play,
  Square,
  Settings,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Loader2,
  Pause,
  User,
  Hash,
  Package,
  Zap,
  Barcode,
  FileText,
  Video,
  CheckSquare,
  ToggleLeft,
  ToggleRight,
  ClipboardList,
  Minus,
  Plus,
  Image as ImageIcon,
  ShieldCheck,
  XCircle,
  X,
  Calendar,
  Slash,
  ArrowLeft,
  ThumbsUp,
  CheckCircle,
  Trash2,
  HelpCircle,
  RotateCcw,
  Menu,
  BarChart3,
  Table,
  Camera,
  Upload,
  Globe,
  MapPin,
  Mic,
  SlidersHorizontal,
  Edit3,
  Cpu,
  Wifi,
  Bluetooth,
  Printer,
  Webcam,
  TrendingUp,
  LayoutDashboard,
  PieChart,
  Sparkles,
  Car,
  Gauge,
  Thermometer,
  Wind,
  ThermometerSun,
  Fuel,
  Sigma,
  Bug,
  AlertTriangle,
  PlayCircle,
  Database,
  Layers,
  MessageSquare,
  Search,
  Star,
  LogOut,
  MoreVertical,
  HardDrive,
  Lock,
  Unlock,
  Maximize2,
  Volume2,
  BatteryCharging,
  Power,
  Terminal,
  Palette,
  RotateCw,
  CreditCard,
  Tv,
  Gamepad2,
  Grid3X3,
  Nfc,
  Timer,
  Compass,
  Sun
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import obd2Service from '../utils/obd2Service';
import automationEngine from '../utils/automationEngine';
import WebcamComp from 'react-webcam';
import Tesseract from 'tesseract.js';
import { listManualSummaries, getManualById, uploadManualImage } from '../utils/supabaseManualDB';
import { saveLiveMeasurement, getAllDrawings } from '../utils/supabaseUtilityDB';
import { getAllFrontlineApps, getProductionQueue, loadPlcSettingsFromSupabase, savePlcSettingsToSupabase, getFrontlineAppById } from '../utils/supabaseFrontlineDB';
import { getTableRecords, queryTableRecords, getTableById, resolveTableIdReference, addTableRecord } from '../utils/supabaseTablesDB';
import { saveCompletion } from '../utils/supabaseCompletionsDB';
import { getMachines, getStations, getInterfaces } from '../utils/database';
import { useLanguage } from '../contexts/LanguageContext';
import iotConnector from '../utils/iotConnector';
import webhookUtility from '../utils/webhookUtility';
import WorkOrderManager from './WorkOrderManager';
import { logEvent, AUDIT_EVENTS } from '../utils/auditLog';
import { calculateOEE } from '../utils/oeeEngine';
import FrontlineCopilot from './FrontlineCopilot';
import ChatWidget from './ChatWidget';
import AnalysisWidget from './AnalysisWidget';
import UnifiedScanner from './UnifiedScanner';
import MobileBottomNav from './MobileBottomNav';
import ScadaWidgetRenderer from './ScadaWidgets';
import { listGlobalVariables, upsertGlobalVariable, subscribeToGlobalVariables } from '../utils/supabaseGlobalVars';
import { validateVariable } from '../utils/validationEngine';
import { getCurrentUser, getAllUsers, logout } from '../utils/auth';
import hardwareService from '../utils/hardwareService';
import { translations } from '../i18n/translations';
import { Ruler, Maximize, Minimize, ArrowUp, ArrowDown, Wrench, Weight } from 'lucide-react';

const STATUS_CONFIG = {
  READY: { label: 'System Ready', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)' },
  RUNNING: { label: 'Production Running', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
  DOWN: { label: 'Workstation Down', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
  SETUP: { label: 'Changeover / Setup', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' }
};

const OBD2_DEFAULT_PIDS = {
  'OBD2_RPM': '010C',
  'OBD2_SPEED': '010D',
  'OBD2_COOLANT_TEMP': '0105',
  'OBD2_ENGINE_LOAD': '0104',
  'OBD2_THROTTLE': '0111',
  'OBD2_FUEL_LEVEL': '012F',
  'OBD2_BATTERY_VOLTAGE': '0142',
  'OBD2_OIL_TEMP': '015C',
  'OBD2_IAT': '010F',
  'OBD2_MAF': '0110',
  'OBD2_MAP': '010B',
  'OBD2_BARO': '0133'
};
const DEVICE_PRESETS = {
  RESPONSIVE: { label: 'Responsive', width: 1000, height: 625, kind: 'RESPONSIVE' },
  PHONE_APP_INVENTOR: { label: 'Phone size', width: 320, height: 505, kind: 'PHONE' },
  TABLET_APP_INVENTOR: { label: 'Tablet size', width: 480, height: 675, kind: 'TABLET' },
  IPHONE_14: { label: 'iPhone 14', width: 393, height: 852, kind: 'PHONE' },
  SAMSUNG_S23: { label: 'Galaxy S23', width: 360, height: 780, kind: 'PHONE' },
  IPAD_PRO: { label: 'iPad Pro', width: 1024, height: 1366, kind: 'TABLET' },
  SURFACE_PRO_7: { label: 'Surface Pro 7', width: 912, height: 1368, kind: 'TABLET' },
  LAPTOP_HD: { label: 'Laptop 720p', width: 1280, height: 720, kind: 'PC' },
  DESKTOP_FHD: { label: 'Desktop FHD', width: 1920, height: 1080, kind: 'PC' }
};


const WorkSequenceStrip = React.memo(function WorkSequenceStrip({ steps, currentStepIndex, onSelectStep, selectedApp, stepValidationSummaries }) {
  return (
    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
      {steps.map((step, idx) => {
        const summary = stepValidationSummaries[idx] || { total: 0, done: 0, ok: true };
        return (
          <div
            key={idx}
            onClick={() => onSelectStep(idx)}
            style={{
              minWidth: '140px',
              height: '80px',
              backgroundColor: 'white',
              border: idx === currentStepIndex ? '2px solid #007bff' : '1px solid #e2e8f0',
              borderRadius: '4px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {selectedApp && summary.total > 0 && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: summary.ok ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
              )}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.title}</span>
            </div>
            <div style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedApp && summary.total > 0 ? (
                <span style={{ fontSize: '0.63rem', fontWeight: 700, color: summary.ok ? '#15803d' : '#b91c1c' }}>{summary.done}/{summary.total}</span>
              ) : (
                <Activity size={16} color="#cbd5e1" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

const LiveAnalyticWrapper = ({ analysisId, title, refreshSeconds, isDark }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!analysisId) return;
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, refreshSeconds * 1000);
    return () => clearInterval(interval);
  }, [analysisId, refreshSeconds]);

  return (
    <div style={{ backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      {title && (
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', marginBottom: '8px', borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`, paddingBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
        {analysisId ? (
          <AnalysisWidget key={`${analysisId}-${refreshKey}`} analysisId={analysisId} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: '#94a3b8' }}>
            <div style={{ fontSize: '1.8rem' }}>📈</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>No Analysis Configured</div>
          </div>
        )}
      </div>
    </div>
  );
};

const renderDrawingShape = (shape) => {
  if (!shape) return null;
  const commonProps = {
    stroke: shape.color || '#3b82f6',
    strokeWidth: shape.strokeWidth || 2,
    fill: 'none'
  };

  if (shape.type === 'line') {
    return <line key={shape.id} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} {...commonProps} />;
  }
  if (shape.type === 'circle') {
    return <circle key={shape.id} cx={shape.cx} cy={shape.cy} r={shape.r} {...commonProps} />;
  }
  if (shape.type === 'rect') {
    return <rect key={shape.id} x={shape.x} y={shape.y} width={shape.w || shape.width || 0} height={shape.h || shape.height || 0} {...commonProps} />;
  }
  if (shape.type === 'roi') {
    const roiColor = shape.color || '#22c55e';
    const roiW = shape.w || shape.width || 100;
    const roiH = shape.h || shape.height || 80;
    return (
      <g key={shape.id}>
        <rect x={shape.x} y={shape.y} width={roiW} height={roiH} stroke={roiColor} strokeWidth={shape.strokeWidth || 2} strokeDasharray="6 3" fill={`${roiColor}15`} rx="4" />
        <path d={`M ${shape.x - 2} ${shape.y + 12} L ${shape.x - 2} ${shape.y - 2} L ${shape.x + 12} ${shape.y - 2}`} stroke={roiColor} strokeWidth="3" fill="none" />
        <path d={`M ${shape.x + roiW - 12} ${shape.y - 2} L ${shape.x + roiW + 2} ${shape.y - 2} L ${shape.x + roiW + 2} ${shape.y + 12}`} stroke={roiColor} strokeWidth="3" fill="none" />
        <path d={`M ${shape.x - 2} ${shape.y + roiH - 12} L ${shape.x - 2} ${shape.y + roiH + 2} L ${shape.x + 12} ${shape.y + roiH + 2}`} stroke={roiColor} strokeWidth="3" fill="none" />
        <path d={`M ${shape.x + roiW - 12} ${shape.y + roiH + 2} L ${shape.x + roiW + 2} ${shape.y + roiH + 2} L ${shape.x + roiW + 2} ${shape.y + roiH - 12}`} stroke={roiColor} strokeWidth="3" fill="none" />
        <rect x={shape.x} y={shape.y - 18} width={Math.max(100, ((shape.label || 'ROI Zone').length * 7) + 20)} height="16" fill={roiColor} rx="3" />
        <text x={shape.x + 6} y={shape.y - 5} fill="#0f172a" fontSize="10" fontWeight="900" fontFamily="sans-serif">🎯 {shape.label || 'ROI Zone'}</text>
      </g>
    );
  }
  if (shape.type === 'ellipse') {
    return <ellipse key={shape.id} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...commonProps} />;
  }
  if (shape.type === 'triangle') {
    const pointsStr = `${shape.x + (shape.w || 0) / 2},${shape.y} ${shape.x + (shape.w || 0)},${shape.y + (shape.h || 0)} ${shape.x},${shape.y + (shape.h || 0)}`;
    return <polygon key={shape.id} points={pointsStr} {...commonProps} />;
  }
  if (shape.type === 'hexagon') {
    const cx = shape.cx;
    const cy = shape.cy;
    const r = shape.r;
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60) * (Math.PI / 180);
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return <polygon key={shape.id} points={points.join(' ')} {...commonProps} />;
  }
  if (shape.type === 'arc') {
    const sa = shape.startAngle ?? 0;
    const ea = shape.endAngle ?? 90;
    const saRad = sa * (Math.PI / 180);
    const eaRad = ea * (Math.PI / 180);
    const sx = shape.cx + shape.r * Math.cos(saRad);
    const sy = shape.cy + shape.r * Math.sin(saRad);
    const ex = shape.cx + shape.r * Math.cos(eaRad);
    const ey = shape.cy + shape.r * Math.sin(eaRad);
    const largeArc = Math.abs(ea - sa) > 180 ? 1 : 0;
    const sweepFlag = ea > sa ? 1 : 0;
    const pathD = `M ${sx},${sy} A ${shape.r},${shape.r} 0 ${largeArc},${sweepFlag} ${ex},${ey}`;
    return <path key={shape.id} d={pathD} {...commonProps} />;
  }
  if (shape.type === 'polyline') {
    const pointsStr = (shape.points || []).map(p => `${p.x},${p.y}`).join(' ');
    return <polyline key={shape.id} points={pointsStr} {...commonProps} />;
  }
  if (shape.type === 'text') {
    return (
      <text key={shape.id} x={shape.x} y={shape.y} fill={shape.color || '#f8fafc'} fontSize={shape.fontSize || 14} fontWeight="bold" fontFamily="sans-serif">
        {shape.text || shape.label || ''}
      </text>
    );
  }
  if (shape.type === 'image' && (shape.url || shape.dataUrl)) {
    return (
      <image key={shape.id} href={shape.url || shape.dataUrl} x={shape.x} y={shape.y} width={shape.w} height={shape.h} preserveAspectRatio="xMidYMid meet" />
    );
  }
  return null;
};

const CADViewer2D = ({ fileUrl, appVariables, setAppVariables }) => {
  // Load drawings from database/localStorage with auto-sync
  const [drawingsList, setDrawingsList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mavi_drawings') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    let isMounted = true;
    getAllDrawings().then(rows => {
      if (isMounted && Array.isArray(rows) && rows.length > 0) {
        setDrawingsList(rows);
      }
    }).catch(err => console.warn('Failed to load drawings in CADViewer2D:', err));
    return () => { isMounted = false; };
  }, []);

  const selectedDwg = useMemo(() => {
    if (!fileUrl) return drawingsList[0] || null;
    return drawingsList.find(d => d.id === fileUrl || d.fileName === fileUrl || d.file_name === fileUrl || d.name === fileUrl) || drawingsList[0] || null;
  }, [drawingsList, fileUrl]);

  const activeDim = appVariables.find(v => v.name === 'Active_Dimension_Key')?.value || 'length';

  // Helper validation for any dimension mapping
  const getValidationStatus = (dim) => {
    if (!dim || !dim.variable) return 'PENDING';
    const val = parseFloat(appVariables.find(v => v.name === dim.variable)?.value);
    if (isNaN(val) || val === 0) return 'PENDING';
    return (val >= dim.tolMin && val <= dim.tolMax) ? 'PASS' : 'FAIL';
  };

  const getStatusColor = (status, isActive) => {
    if (status === 'PASS') return '#22c55e'; // Green
    if (status === 'FAIL') return '#ef4444'; // Red
    return isActive ? '#60a5fa' : '#94a3b8'; // Blue active or slate
  };

  const selectDim = (dimKey) => {
    setAppVariables(prev => prev.map(v => v.name === 'Active_Dimension_Key' ? { ...v, value: dimKey } : v));
  };

  // Find dimensions mappings
  const dimLength = selectedDwg?.dimensions.find(d => d.id === 'dim_len' || d.variable === 'Meas_Length');
  const dimDiameter = selectedDwg?.dimensions.find(d => d.id === 'dim_dia' || d.variable === 'Meas_Diameter');
  const dimBore = selectedDwg?.dimensions.find(d => d.id === 'dim_bore' || d.variable === 'Meas_Bore');

  const lenStatus = getValidationStatus(dimLength);
  const diaStatus = getValidationStatus(dimDiameter);
  const boreStatus = getValidationStatus(dimBore);

  const isFlange = selectedDwg?.id === 'dwg_flange_connector';
  const isCylinder = selectedDwg?.id === 'dwg_hydraulic_cylinder';

  const cropBox = useMemo(() => {
    if (!selectedDwg) return null;

    // Priority 1: CAD Display Region (Kotak Merah frame from CAD Manager)
    const reg = selectedDwg.displayRegion;
    if (reg && reg.enabled !== false && reg.w > 0 && reg.h > 0) {
      return { rx: reg.x, ry: reg.y, rw: reg.w, rh: reg.h };
    }

    // Priority 2: ROI shape (Green dashed ROI Inspection Zone)
    if (Array.isArray(selectedDwg.shapes)) {
      const roiShape = selectedDwg.shapes.find(s => s && s.type === 'roi' && (s.w || s.width) > 0 && (s.h || s.height) > 0);
      if (roiShape) {
        return {
          rx: roiShape.x,
          ry: roiShape.y,
          rw: roiShape.w || roiShape.width,
          rh: roiShape.h || roiShape.height,
          label: roiShape.label
        };
      }
    }

    // Priority 3: ROI Dimension balloon
    if (Array.isArray(selectedDwg.dimensions)) {
      const roiDim = selectedDwg.dimensions.find(d => d && (d.type === 'roi' || d.category === 'roi') && (d.w > 0 || d.width > 0));
      if (roiDim) {
        const rw = roiDim.w || roiDim.width || Math.abs((roiDim.x2 || 0) - (roiDim.x1 || 0));
        const rh = roiDim.h || roiDim.height || Math.abs((roiDim.y2 || 0) - (roiDim.y1 || 0));
        const rx = roiDim.x !== undefined ? roiDim.x : Math.min(roiDim.x1 || 0, roiDim.x2 || 0);
        const ry = roiDim.y !== undefined ? roiDim.y : Math.min(roiDim.y1 || 0, roiDim.y2 || 0);
        if (rw > 0 && rh > 0) {
          return { rx, ry, rw, rh, label: roiDim.label || roiDim.name };
        }
      }
    }

    return null;
  }, [selectedDwg]);

  const viewBoxStr = cropBox ? `${cropBox.rx} ${cropBox.ry} ${cropBox.rw} ${cropBox.rh}` : "0 0 500 360";

  return (
    <div style={{ backgroundColor: '#0b1d33', borderRadius: '12px', border: '1px solid #1e3a8a', padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', color: 'white', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          📐 {selectedDwg?.name || 'Blueprint 2D CAD'}
        </div>
      </div>

      <svg viewBox={viewBoxStr} preserveAspectRatio="xMidYMid meet" style={{ flex: 1, width: '100%', height: '100%' }}>
        <defs>
          <pattern id="grid_terminal" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e3a8a" strokeWidth="0.5" strokeOpacity="0.3" />
          </pattern>
          {cropBox && (
            <clipPath id="terminal_cad_roi_clip">
              <rect x={cropBox.rx} y={cropBox.ry} width={cropBox.rw} height={cropBox.rh} />
            </clipPath>
          )}
        </defs>

        <g clipPath={cropBox ? "url(#terminal_cad_roi_clip)" : undefined}>
          <rect width="100%" height="100%" fill="url(#grid_terminal)" />

        {/* Blueprint Border */}
        <rect x="5" y="5" width="490" height="350" fill="none" stroke="#1e40af" strokeWidth="1" />
        <rect x="8" y="8" width="484" height="344" fill="none" stroke="#1e3a8a" strokeWidth="0.5" />

        {isFlange ? (
          <>
            {/* ── FRONT VIEW (CIRCULAR) ── */}
            <g transform="translate(0, 0)">
              <circle cx="140" cy="180" r="90" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
              <circle cx="140" cy="180" r="65" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="5,5" />
              <circle cx="140" cy="180" r="30" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
              <line x1="140" y1="75" x2="140" y2="285" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="15,4,2,4" />
              <line x1="35" y1="180" x2="245" y2="180" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="15,4,2,4" />

              {/* 8 Bolt Holes */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
                const rad = (angle * Math.PI) / 180;
                const bx = 140 + 65 * Math.cos(rad);
                const by = 180 + 65 * Math.sin(rad);
                return (
                  <g key={idx}>
                    <circle cx={bx} cy={by} r="8" fill="none" stroke="#3b82f6" strokeWidth="1" />
                    <line x1={bx - 12} y1={by} x2={bx + 12} y2={by} stroke="#3b82f6" strokeWidth="0.5" />
                    <line x1={bx} y1={by - 12} x2={bx} y2={by} stroke="#3b82f6" strokeWidth="0.5" />
                  </g>
                );
              })}
            </g>

            {/* ── RIGHT VIEW: SECTION CUT VIEW ── */}
            <g transform="translate(300, 0)">
              <line x1="100" y1="65" x2="100" y2="295" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="15,4,2,4" />
              <path d="M 40,110 L 100,110 L 100,140 L 90,140 L 90,220 L 100,220 L 100,250 L 40,250 L 40,220 L 15,220 L 15,140 L 40,140 Z" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
              <path d="M 40,120 L 50,110 M 40,140 L 70,110 M 40,160 L 90,110 M 40,180 L 100,120 M 40,200 L 100,140 M 45,210 L 100,155 M 65,210 L 100,175 M 85,210 L 100,195 M 40,230 L 60,210 M 40,250 L 80,210" fill="none" stroke="#1e3a8a" strokeWidth="0.5" strokeOpacity="0.5" />
            </g>

            {/* ── DIMENSIONS ── */}
            {/* Flange Diameter */}
            <g style={{ cursor: 'pointer' }} onClick={() => selectDim('diameter')}>
              <line x1="20" y1="90" x2="120" y2="90" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="20" y1="270" x2="120" y2="270" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="30" y1="100" x2="30" y2="260" stroke={getStatusColor(diaStatus, activeDim === 'diameter')} strokeWidth="2" />
              <polygon points="30,90 26,102 34,102" fill={getStatusColor(diaStatus, activeDim === 'diameter')} />
              <polygon points="30,270 26,258 34,258" fill={getStatusColor(diaStatus, activeDim === 'diameter')} />

              <rect x="15" y="165" width="55" height="30" rx="4" fill="#0f172a" stroke={getStatusColor(diaStatus, activeDim === 'diameter')} strokeWidth={activeDim === 'diameter' ? 2 : 1} />
              <text x="42" y="184" textAnchor="middle" fill={getStatusColor(diaStatus, activeDim === 'diameter')} fontSize="11" fontWeight="bold">Ø 80.0</text>
              {activeDim === 'diameter' && (
                <circle cx="30" cy="180" r="16" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.8">
                  <animate attributeName="r" values="10;25;10" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* Overall Length */}
            <g style={{ cursor: 'pointer' }} onClick={() => selectDim('length')}>
              <line x1="315" y1="130" x2="315" y2="70" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="400" y1="130" x2="400" y2="70" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="325" y1="80" x2="390" y2="80" stroke={getStatusColor(lenStatus, activeDim === 'length')} strokeWidth="2" />
              <polygon points="315,80 327,76 327,84" fill={getStatusColor(lenStatus, activeDim === 'length')} />
              <polygon points="400,80 388,76 388,84" fill={getStatusColor(lenStatus, activeDim === 'length')} />

              <rect x="338" y="65" width="44" height="26" rx="4" fill="#0f172a" stroke={getStatusColor(lenStatus, activeDim === 'length')} strokeWidth={activeDim === 'length' ? 2 : 1} />
              <text x="360" y="81" textAnchor="middle" fill={getStatusColor(lenStatus, activeDim === 'length')} fontSize="10" fontWeight="bold">120.0</text>
              {activeDim === 'length' && (
                <circle cx="360" cy="80" r="16" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.8">
                  <animate attributeName="r" values="10;22;10" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
            </g>

            {/* Center Bore */}
            <g style={{ cursor: 'pointer' }} onClick={() => selectDim('bore')}>
              <path d="M 125,165 L 85,115 L 45,115" fill="none" stroke={getStatusColor(boreStatus, activeDim === 'bore')} strokeWidth="1.5" />
              <polygon points="125,165 117,162 121,156" fill={getStatusColor(boreStatus, activeDim === 'bore')} />

              <rect x="42" y="98" width="46" height="26" rx="4" fill="#0f172a" stroke={getStatusColor(boreStatus, activeDim === 'bore')} strokeWidth={activeDim === 'bore' ? 2 : 1} />
              <text x="65" y="114" textAnchor="middle" fill={getStatusColor(boreStatus, activeDim === 'bore')} fontSize="10" fontWeight="bold">Ø 25.0</text>
              {activeDim === 'bore' && (
                <circle cx="65" cy="111" r="14" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.8">
                  <animate attributeName="r" values="8;18;8" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          </>
        ) : isCylinder ? (
          <>
            {/* ── HYDRAULIC CYLINDER BLUEPRINT ── */}
            <g transform="translate(40, 20)">
              {/* Cylinder Tube */}
              <rect x="60" y="100" width="220" height="120" fill="none" stroke="#3b82f6" strokeWidth="2" />
              {/* Cylinder Rod */}
              <rect x="280" y="130" width="140" height="60" fill="none" stroke="#60a5fa" strokeWidth="2" />
              {/* Clevis end */}
              <circle cx="435" cy="160" r="15" fill="none" stroke="#3b82f6" strokeWidth="2" />

              {/* Center Line */}
              <line x1="20" y1="160" x2="450" y2="160" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="15,4,2,4" />

              {/* Dynamic Mappings Highlights */}
              {selectedDwg.dimensions.map((dim, idx) => {
                const status = getValidationStatus(dim);
                const isActive = activeDim === dim.variable;
                const strokeColor = getStatusColor(status, isActive);
                
                if (dim.id === 'hc_bore' || dim.variable === 'Cylinder_Bore_Dia') {
                  return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={() => selectDim(dim.variable)}>
                      <line x1="50" y1="100" x2="50" y2="220" stroke={strokeColor} strokeWidth="2" />
                      <polygon points="50,100 46,112 54,112" fill={strokeColor} />
                      <polygon points="50,220 46,208 54,208" fill={strokeColor} />
                      <rect x="15" y="148" width="30" height="24" rx="4" fill="#0f172a" stroke={strokeColor} strokeWidth={isActive ? 2 : 1} />
                      <text x="30" y="163" textAnchor="middle" fill={strokeColor} fontSize="9" fontWeight="bold">Ø80</text>
                    </g>
                  );
                }
                
                if (dim.id === 'hc_rod' || dim.variable === 'Rod_Diameter_Spec') {
                  return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={() => selectDim(dim.variable)}>
                      <line x1="390" y1="130" x2="390" y2="190" stroke={strokeColor} strokeWidth="2" />
                      <polygon points="390,130 386,142 394,142" fill={strokeColor} />
                      <polygon points="390,190 386,178 394,178" fill={strokeColor} />
                      <rect x="375" y="148" width="30" height="24" rx="4" fill="#0f172a" stroke={strokeColor} strokeWidth={isActive ? 2 : 1} />
                      <text x="390" y="163" textAnchor="middle" fill={strokeColor} fontSize="9" fontWeight="bold">Ø56</text>
                    </g>
                  );
                }

                if (dim.id === 'hc_stroke' || dim.variable === 'Stroke_Length_Actual') {
                  return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={() => selectDim(dim.variable)}>
                      <line x1="60" y1="240" x2="280" y2="240" stroke={strokeColor} strokeWidth="2" />
                      <polygon points="60,240 72,236 72,244" fill={strokeColor} />
                      <polygon points="280,240 268,236 268,244" fill={strokeColor} />
                      <rect x="150" y="228" width="40" height="24" rx="4" fill="#0f172a" stroke={strokeColor} strokeWidth={isActive ? 2 : 1} />
                      <text x="170" y="243" textAnchor="middle" fill={strokeColor} fontSize="9" fontWeight="bold">500</text>
                    </g>
                  );
                }
                return null;
              })}
            </g>
          </>
        ) : (
          <>
            {/* Render Background Blueprint Image if available */}
            {selectedDwg && (selectedDwg.dataUrl || selectedDwg.data_url) && (
              <image
                href={selectedDwg.dataUrl || selectedDwg.data_url}
                x="50"
                y="40"
                width="400"
                height="280"
                preserveAspectRatio="xMidYMid meet"
                opacity="0.85"
                style={{ pointerEvents: 'none' }}
              />
            )}

            {/* Render Vector CAD Shapes drawn in Drawing Manager */}
            {selectedDwg && Array.isArray(selectedDwg.shapes) && selectedDwg.shapes.length > 0 && (
              <g className="custom-cad-shapes">
                {selectedDwg.shapes.map(shape => renderDrawingShape(shape))}
              </g>
            )}

            {/* Fallback generic blueprint ONLY if no background image and no custom shapes exist */}
            {(!selectedDwg || ((!selectedDwg.dataUrl && !selectedDwg.data_url) && (!selectedDwg.shapes || selectedDwg.shapes.length === 0))) && (
              <g transform="translate(40, 20)">
                <rect x="120" y="80" width="240" height="180" fill="none" stroke="#3b82f6" strokeWidth="2" />
                <circle cx="240" cy="170" r="45" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                <line x1="240" y1="50" x2="240" y2="290" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="10,5" />
                <line x1="80" y1="170" x2="400" y2="170" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="10,5" />
              </g>
            )}

            {/* Render custom indicators using absolute coordinates */}
            {(selectedDwg?.dimensions || []).map((dim, idx) => {
              const status = getValidationStatus(dim);
              const isActive = activeDim === dim.variable;
              const strokeColor = getStatusColor(status, isActive);

              const hasCustomCoords = dim.lx !== undefined && dim.ly !== undefined;
              const x1 = hasCustomCoords ? dim.x1 : (idx === 0 ? 130 : 260);
              const y1 = hasCustomCoords ? dim.y1 : (idx === 0 ? 100 : 180);
              const x2 = hasCustomCoords ? dim.x2 : (idx === 0 ? 130 : 210);
              const y2 = hasCustomCoords ? dim.y2 : (idx === 0 ? 280 : 130);
              const lx = hasCustomCoords ? dim.lx : (idx === 0 ? 105 : 160);
              const ly = hasCustomCoords ? dim.ly : (idx === 0 ? 190 : 130);
              const type = dim.type || (idx === 0 ? 'vertical' : 'radial');

              const baseWidth = dim.lineWidth !== undefined ? dim.lineWidth : 2;
              const strokeW = isActive ? baseWidth + 1.0 : baseWidth;
              const arrowLen = Math.max(8, baseWidth * 4.5);
              const arrowWidth = Math.max(4, baseWidth * 2.2);

              if (type === 'horizontal') {
                return (
                  <g key={dim.id} style={{ cursor: 'pointer' }} onClick={() => selectDim(dim.variable)}>
                    <line x1={x1} y1={y1} x2={x1} y2={ly} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                    <line x1={x2} y1={y2} x2={x2} y2={ly} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                    <line x1={x1 + arrowLen - 2} y1={ly - 5} x2={x2 - arrowLen + 2} y2={ly - 5} stroke={strokeColor} strokeWidth={strokeW} />
                    <polygon points={`${x1},${ly - 5} ${x1 + arrowLen},${ly - 5 - arrowWidth} ${x1 + arrowLen},${ly - 5 + arrowWidth}`} fill={strokeColor} />
                    <polygon points={`${x2},${ly - 5} ${x2 - arrowLen},${ly - 5 - arrowWidth} ${x2 - arrowLen},${ly - 5 + arrowWidth}`} fill={strokeColor} />
                    <rect x={lx - 40} y={ly - 17} width="80" height="24" rx="4" fill="#0f172a" stroke={strokeColor} strokeWidth={isActive ? 2 : 1} />
                    <text x={lx} y={ly - 2} textAnchor="middle" fill={strokeColor} fontSize="9" fontWeight="bold">
                      {dim.label ? dim.label.split(' ')[0] : 'Dim'}: {dim.spec}
                    </text>
                    {isActive && (
                      <circle cx={lx} cy={ly - 5} r="16" fill="none" stroke="#60a5fa" strokeWidth="1.5">
                        <animate attributeName="r" values="10;24;10" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              } else if (type === 'vertical') {
                return (
                  <g key={dim.id} style={{ cursor: 'pointer' }} onClick={() => selectDim(dim.variable)}>
                    <line x1={x1} y1={y1} x2={lx} y2={y1} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                    <line x1={x2} y1={y2} x2={lx} y2={y2} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                    <line x1={lx - 5} y1={y1 + arrowLen - 2} x2={lx - 5} y2={y2 - arrowLen + 2} stroke={strokeColor} strokeWidth={strokeW} />
                    <polygon points={`${lx - 5},${y1} ${lx - 5 - arrowWidth},${y1 + arrowLen} ${lx - 5 + arrowWidth},${y1 + arrowLen}`} fill={strokeColor} />
                    <polygon points={`${lx - 5},${y2} ${lx - 5 - arrowWidth},${y2 - arrowLen} ${lx - 5 + arrowWidth},${y2 - arrowLen}`} fill={strokeColor} />
                    <rect x={lx - 40} y={ly - 12} width="80" height="24" rx="4" fill="#0f172a" stroke={strokeColor} strokeWidth={isActive ? 2 : 1} />
                    <text x={lx} y={ly + 4} textAnchor="middle" fill={strokeColor} fontSize="9" fontWeight="bold">
                      {dim.label ? dim.label.split(' ')[0] : 'Dim'}: {dim.spec}
                    </text>
                    {isActive && (
                      <circle cx={lx} cy={ly} r="16" fill="none" stroke="#60a5fa" strokeWidth="1.5">
                        <animate attributeName="r" values="10;24;10" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              } else {
                return (
                  <g key={dim.id} style={{ cursor: 'pointer' }} onClick={() => selectDim(dim.variable)}>
                    <path d={`M ${x1},${y1} L ${x2},${y2} L ${lx},${ly}`} fill="none" stroke={strokeColor} strokeWidth={strokeW} />
                    {(() => {
                      const angle = Math.atan2(y2 - y1, x2 - x1);
                      const ax1 = x1 + arrowLen * Math.cos(angle - 0.25);
                      const ay1 = y1 + arrowLen * Math.sin(angle - 0.25);
                      const ax2 = x1 + arrowLen * Math.cos(angle + 0.25);
                      const ay2 = y1 + arrowLen * Math.sin(angle + 0.25);
                      return (
                        <polygon points={`${x1},${y1} ${ax1},${ay1} ${ax2},${ay2}`} fill={strokeColor} />
                      );
                    })()}
                    <rect x={lx - 40} y={ly - 12} width="80" height="24" rx="4" fill="#0f172a" stroke={strokeColor} strokeWidth={isActive ? 2 : 1} />
                    <text x={lx} y={ly + 4} textAnchor="middle" fill={strokeColor} fontSize="9" fontWeight="bold">
                      {dim.label ? dim.label.split(' ')[0] : 'Dim'}: Ø{dim.spec}
                    </text>
                    {isActive && (
                      <circle cx={lx} cy={ly} r="16" fill="none" stroke="#60a5fa" strokeWidth="1.5">
                        <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              }
            })}
          </>
        )}
        </g>
      </svg>

    </div>
  );
};

// Local CADViewer3D has been replaced by the react-three-fiber version imported from ./CADViewer3D.jsx

const getFirmwareCode = (connectionType, boardType, baudRate, mqttUrl, wifiIp) => {
    const conn = connectionType || 'SERIAL';
    const board = boardType || 'UNO';
    const baud = baudRate || 9600;
    const mqttHost = mqttUrl ? mqttUrl.replace('wss://', '').replace('ws://', '').split(':')[0] : 'broker.emqx.io';
    
    if (conn === 'MQTT') {
        return `/*
  Mavi Integration Sketch - MQTT Protocol
  Device: ${board}
  MQTT Broker: ${mqttHost}
*/

#if defined(ESP8266)
#include <ESP8266WiFi.h>
#elif defined(ESP32)
#include <WiFi.h>
#else
#include <SPI.h>
#include <Ethernet.h>
#endif
#include <PubSubClient.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "${mqttHost}";
const int mqtt_port = 1883;

#if defined(ESP8266) || defined(ESP32)
WiFiClient espClient;
#else
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
EthernetClient espClient;
#endif
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void setup_wifi() {
#if defined(ESP8266) || defined(ESP32)
  delay(10);
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi connected");
#else
  if (Ethernet.begin(mac) == 0) {
    Serial.println("Failed to configure Ethernet using DHCP");
  }
#endif
}

void callback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  Serial.println(msg);

  // Parse custom control commands, e.g. "13:1"
  int colonIdx = msg.indexOf(':');
  if (colonIdx != -1) {
    int targetPin = msg.substring(0, colonIdx).toInt();
    int targetVal = msg.substring(colonIdx + 1).toInt();
    pinMode(targetPin, OUTPUT);
    digitalWrite(targetPin, targetVal);
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("MaviArduinoClient")) {
      Serial.println("connected");
      client.subscribe("arduino/write/#");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  static unsigned long lastMsg = 0;
  unsigned long now = millis();
  if (now - lastMsg > 1000) {
    lastMsg = now;
    int sensorVal = analogRead(A0);
    String payload = String(sensorVal);
    client.publish("arduino/read/A0", payload.c_str());
  }
}`;
    }

    if (conn === 'WIFI') {
        return `/*
  Mavi Integration Sketch - WiFi HTTP API Server
  Device: ${board}
  Expected IP Address: ${wifiIp || '192.168.1.100'}
*/

#if defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
typedef ESP8266WebServer WebServer;
#elif defined(ESP32)
#include <WiFi.h>
#include <WebServer.h>
#endif

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

WebServer server(80);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nConnected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  server.on("/read", HTTP_GET, []() {
    String pin = server.arg("pin");
    int val = 0;
    if (pin.equalsIgnoreCase("A0")) {
      val = analogRead(A0);
    } else {
      int pinNum = pin.toInt();
      pinMode(pinNum, INPUT);
      val = digitalRead(pinNum);
    }
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/plain", String(val));
  });

  server.on("/write", []() {
    String pinStr = server.arg("pin");
    String valStr = server.arg("val");
    int pin = pinStr.toInt();
    int val = valStr.toInt();
    pinMode(pin, OUTPUT);
    digitalWrite(pin, val);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/plain", "OK");
  });

  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}`;
    }

    return `/*
  Mavi Integration Sketch - USB Serial Protocol
  Device: ${board}
  Baud Rate: ${baud}
*/

const int ANALOG_PIN = A0;
const int OUT_PIN = 13;

void setup() {
  Serial.begin(${baud});
  pinMode(OUT_PIN, OUTPUT);
}

void loop() {
  int sensorVal = analogRead(ANALOG_PIN);
  Serial.print("A0:");
  Serial.println(sensorVal);
  
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\\n');
    command.trim();
    if (command.startsWith("d") || command.startsWith("p")) {
      int colonIdx = command.indexOf(':');
      if (colonIdx != -1) {
        String pinStr = command.substring(1, colonIdx);
        String valStr = command.substring(colonIdx + 1);
        int targetPin = pinStr.toInt();
        int targetVal = valStr.toInt();
        if (command.startsWith("d")) {
          digitalWrite(targetPin, targetVal);
        } else if (command.startsWith("p")) {
          analogWrite(targetPin, targetVal);
        }
      }
    }
  }
  delay(200);
}`;
};

const ArduinoWidget = ({ comp, syncVariable, fireWidgetTriggers, isDark }) => {
    const [status, setStatus] = useState(comp.props.status || 'disconnected');
    const [liveValue, setLiveValue] = useState(0);
    const [graphData, setGraphData] = useState([]);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [logs, setLogs] = useState([]);
    const [cmdInput, setCmdInput] = useState('');
    const consoleEndRef = useRef(null);

    // 6 New Widgets States
    const [lastCardId, setLastCardId] = useState('');
    const [rfidStatus, setRfidStatus] = useState('Awaiting Card Scan...');
    const [lcdText1, setLcdText1] = useState(comp.props.line1 || 'Hello World');
    const [lcdText2, setLcdText2] = useState(comp.props.line2 || 'Mavi MES System');
    const [joyX, setJoyX] = useState(512);
    const [joyY, setJoyY] = useState(512);
    const [joyZ, setJoyZ] = useState(1);
    const [lastKeyPressed, setLastKeyPressed] = useState('');
    const [matrixState, setMatrixState] = useState(() => Array(8).fill(0).map(() => Array(8).fill(false)));
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    // 7 New Pro Widget States
    const [radarAngle, setRadarAngle] = useState(0);
    const [radarDots, setRadarDots] = useState([]);
    const [tankLevel, setTankLevel] = useState(0);
    const [modbusRegs, setModbusRegs] = useState(Array(8).fill({ addr: 0, val: 0 }));
    const [statusPins, setStatusPins] = useState({});
    const [oscData, setOscData] = useState(Array(80).fill(128));
    const [thermalGrid, setThermalGrid] = useState(Array(64).fill(20));
    const [thermoValue, setThermoValue] = useState(0);
    const radarAnimRef = useRef(null);

    useEffect(() => {
        if (consoleEndRef.current) {
            consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    useEffect(() => {
        const unsubStatus = hardwareService.subscribeStatus((s) => {
            setStatus(s);
        });

        let telemetryUnsub = () => {};
        const isTelemetryWidget = comp.type === 'ARDUINO_PIN_MONITOR' || comp.type === 'ARDUINO_GRAPH' || comp.type === 'ARDUINO_GAUGE';
        
        if (isTelemetryWidget) {
            const pin = comp.props.pin || 'A0';
            
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 1000);
            }

            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                const multiplier = comp.props.multiplier !== undefined ? parseFloat(comp.props.multiplier) : 1;
                const offset = comp.props.offset !== undefined ? parseFloat(comp.props.offset) : 0;
                const val = (rawVal * multiplier) + offset;

                setLiveValue(val);
                syncVariable(val);
                
                if (comp.type === 'ARDUINO_GRAPH') {
                    setGraphData(prev => {
                        const next = [...prev, val];
                        if (next.length > (comp.props.maxSamples || 50)) {
                            next.shift();
                        }
                        return next;
                    });
                }
                fireWidgetTriggers(comp, 'ValueReceived', { value: val });
            });
        } else if (comp.type === 'ARDUINO_RFID') {
            const pin = comp.props.pin || '10';
            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                const cardId = String(rawVal).trim().toUpperCase();
                setLastCardId(cardId);
                const allowed = (comp.props.allowedCards || '').split(',').map(s => s.trim().toUpperCase());
                const isOk = allowed.includes(cardId);
                setRfidStatus(isOk ? 'ACCESS GRANTED' : 'ACCESS DENIED');
                syncVariable(cardId);
                fireWidgetTriggers(comp, 'CardScanned', { cardId, verified: isOk });
            });
        } else if (comp.type === 'ARDUINO_JOYSTICK') {
            const pinX = comp.props.pinX || 'A0';
            const pinY = comp.props.pinY || 'A1';
            const pinZ = comp.props.pinSel || '2';

            const unsubX = hardwareService.onPinData(pinX, (val) => setJoyX(parseInt(val)));
            const unsubY = hardwareService.onPinData(pinY, (val) => setJoyY(parseInt(val)));
            const unsubZ = hardwareService.onPinData(pinZ, (val) => setJoyZ(parseInt(val)));
            telemetryUnsub = () => {
                unsubX();
                unsubY();
                unsubZ();
            };
        } else if (comp.type === 'ARDUINO_KEYPAD') {
            telemetryUnsub = hardwareService.onPinData('KEYPAD', (rawVal) => {
                const key = String(rawVal);
                setLastKeyPressed(key);
                syncVariable(key);
                fireWidgetTriggers(comp, 'KeyClicked', { key });
            });
        } else if (comp.type === 'ARDUINO_LCD') {
            const unsubLCD = hardwareService.onData((val, rawLine) => {
                if (rawLine) {
                    if (rawLine.startsWith('l1:')) {
                        setLcdText1(rawLine.substring(3));
                    } else if (rawLine.startsWith('l2:')) {
                        setLcdText2(rawLine.substring(3));
                    }
                }
            });
            telemetryUnsub = unsubLCD;
        } else if (comp.type === 'ARDUINO_RTC') {
            const interval = setInterval(() => {
                setCurrentTime(new Date().toLocaleTimeString());
            }, 1000);
            telemetryUnsub = () => clearInterval(interval);
        } else if (comp.type === 'ARDUINO_RADAR') {
            const pin = comp.props.pin || 'A0';
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 200);
            }
            const pinUnsub = hardwareService.onPinData(pin, (distCm) => {
                const maxD = comp.props.maxDistance || 200;
                const normalizedDist = Math.min(1, Math.max(0, parseFloat(distCm) / maxD));
                setRadarDots(prev => {
                    const next = [...prev, { angle: radarAngle, dist: normalizedDist }];
                    return next.slice(-30);
                });
                syncVariable(distCm);
                fireWidgetTriggers(comp, 'ObjectDetected', { distanceCm: distCm, angle: radarAngle });
            });
            let angle = 0;
            let dir = 1;
            const sweepInterval = setInterval(() => {
                angle += dir * 2;
                if (angle >= (comp.props.angleSweep || 180)) { dir = -1; angle = comp.props.angleSweep || 180; }
                if (angle <= 0) { dir = 1; angle = 0; }
                setRadarAngle(angle);
            }, 50);
            radarAnimRef.current = sweepInterval;
            telemetryUnsub = () => { clearInterval(sweepInterval); pinUnsub(); };
        } else if (comp.type === 'ARDUINO_TANK') {
            const pin = comp.props.pin || 'A0';
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 1000);
            }
            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                const rawNum = parseFloat(rawVal);
                const pct = rawNum > 100 ? Math.min(100, (rawNum / 1023) * 100) : Math.min(100, Math.max(0, rawNum));
                setTankLevel(pct);
                syncVariable(pct);
                fireWidgetTriggers(comp, 'LevelChanged', { level: pct });
            });
        } else if (comp.type === 'ARDUINO_MODBUS') {
            if (comp.props.connectionType === 'MQTT') {
                if (hardwareService.mqttClient && hardwareService.mqttClient.connected) {
                    hardwareService.mqttClient.subscribe(comp.props.mqttSubscribeTopic || 'modbus/registers/#');
                    hardwareService.mqttClient.on('message', (topic, message) => {
                        if (topic.startsWith('modbus/registers/')) {
                            const addr = topic.replace('modbus/registers/', '');
                            const val = parseInt(message.toString());
                            setModbusRegs(prev => {
                                const next = [...prev];
                                const idx = next.findIndex(r => r.addr === addr);
                                if (idx > -1) next[idx] = { addr, val };
                                else next.push({ addr, val });
                                return next.slice(-8);
                            });
                        }
                    });
                }
            }
            const modbusUnsub = hardwareService.onData((val, rawLine) => {
                if (rawLine && rawLine.includes(':')) {
                    const parts = rawLine.split(':');
                    const addr = parts[0].trim();
                    const value = parseInt(parts[1].trim());
                    if (!isNaN(value)) {
                        setModbusRegs(prev => {
                            const next = [...prev];
                            const idx = next.findIndex(r => r.addr === addr);
                            if (idx > -1) next[idx] = { addr, val: value };
                            else next.push({ addr, val: value });
                            return next.slice(-8);
                        });
                    }
                }
            });
            const timer = setInterval(() => {
                setModbusRegs(prev => prev.map((r, i) => ({
                    addr: r.addr || `4000${i+1}`,
                    val: Math.max(0, Math.min(65535, (r.val || 100) + Math.round((Math.random() - 0.5) * 10)))
                })));
            }, 2000);
            telemetryUnsub = () => { modbusUnsub(); clearInterval(timer); };
        } else if (comp.type === 'ARDUINO_STATUS_GRID') {
            const pins = (comp.props.pins || 'D2,D3,D4,D5').split(',').map(p => p.trim());
            if (comp.props.connectionType === 'MQTT') {
                pins.forEach(pin => hardwareService.subscribeMqttPin(pin, `${(comp.props.mqttSubscribeTopic || 'arduino/read').replace('/#','')}/${pin}`));
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                pins.forEach(pin => hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, 500));
            }
            const unsubs = pins.map(pin => hardwareService.onPinData(pin, (val) => {
                setStatusPins(prev => ({ ...prev, [pin]: parseInt(val) > 0 }));
            }));
            telemetryUnsub = () => {
                unsubs.forEach(fn => fn());
                if (comp.props.connectionType === 'WIFI') {
                    const pinArr = (comp.props.pins || 'D2,D3,D4,D5').split(',').map(p => p.trim());
                    pinArr.forEach(p => hardwareService.stopWifiPolling(p));
                }
            };
        } else if (comp.type === 'ARDUINO_OSCILLOSCOPE') {
            const pin = comp.props.pin || 'A0';
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 100);
            }
            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                const raw = parseFloat(rawVal);
                const mapped = raw > 255 ? Math.min(255, Math.max(0, Math.round((raw / 1023) * 255))) : Math.min(255, Math.max(0, Math.round(raw)));
                setOscData(prev => { const n = [...prev.slice(1), mapped]; return n; });
                fireWidgetTriggers(comp, 'SampleReceived', { value: rawVal });
            });
            const simInterval = setInterval(() => {
                setOscData(prev => {
                    const time = Date.now() / 200;
                    const sine = Math.round(128 + 60 * Math.sin(time) + (Math.random() - 0.5) * 10);
                    return [...prev.slice(1), sine];
                });
            }, 50);
            const origUnsub = telemetryUnsub;
            telemetryUnsub = () => { origUnsub(); clearInterval(simInterval); };
        } else if (comp.type === 'ARDUINO_THERMAL') {
            if (comp.props.connectionType === 'MQTT') {
                if (hardwareService.mqttClient && hardwareService.mqttClient.connected) {
                    hardwareService.mqttClient.subscribe(comp.props.mqttSubscribeTopic || 'arduino/thermal/frame');
                    hardwareService.mqttClient.on('message', (topic, message) => {
                        if (topic === (comp.props.mqttSubscribeTopic || 'arduino/thermal/frame')) {
                            try {
                                const vals = JSON.parse(message.toString());
                                if (Array.isArray(vals) && vals.length === 64) setThermalGrid(vals);
                            } catch { /* ignore */ }
                        }
                    });
                }
            }
            const thermalDataUnsub = hardwareService.onData((val, rawLine) => {
                if (rawLine && rawLine.startsWith('THERMAL:')) {
                    const nums = rawLine.substring(8).split(',').map(Number).filter(n => !isNaN(n));
                    if (nums.length === 64) setThermalGrid(nums);
                }
            });
            const simInterval = setInterval(() => {
                setThermalGrid(prev => prev.map(v => Math.min(comp.props.maxTemp || 80, Math.max(15, v + (Math.random() - 0.49) * 1.5))));
            }, 400);
            telemetryUnsub = () => { thermalDataUnsub(); clearInterval(simInterval); };
        } else if (comp.type === 'ARDUINO_THERMOMETER') {
            const pin = comp.props.pin || 'A0';
            if (comp.props.connectionType === 'MQTT') {
                hardwareService.subscribeMqttPin(pin, comp.props.mqttSubscribeTopic);
            } else if (comp.props.connectionType === 'WIFI' && hardwareService.wifiIpAddress) {
                hardwareService.startWifiPolling(hardwareService.wifiIpAddress, pin, comp.props.wifiPollingInterval || 1000);
            }
            telemetryUnsub = hardwareService.onPinData(pin, (rawVal) => {
                const mn = parseFloat(comp.props.minVal ?? 0);
                const mx = parseFloat(comp.props.maxVal ?? 100);
                const raw = parseFloat(rawVal);
                const val = raw > mx ? mn + ((raw / 1023) * (mx - mn)) : Math.min(mx, Math.max(mn, raw));
                setThermoValue(val);
                syncVariable(val);
                fireWidgetTriggers(comp, 'TempChanged', { value: val });
            });
        }

        let consoleUnsub = () => {};
        if (comp.type === 'ARDUINO_BOARD' || comp.type === 'ARDUINO_CONSOLE') {
            consoleUnsub = hardwareService.onData((rawVal) => {
                const text = String(rawVal).trim();
                if (text) {
                    const timeStr = new Date().toLocaleTimeString();
                    setLogs(prev => {
                        const next = [...prev, { type: 'rx', text, time: timeStr }];
                        const maxL = comp.props.maxLines || 100;
                        if (next.length > maxL) {
                            next.shift();
                        }
                        return next;
                    });
                }
            });
        }

        return () => {
            unsubStatus();
            telemetryUnsub();
            consoleUnsub();
            if (isTelemetryWidget) {
                if (comp.props.connectionType === 'WIFI') {
                    hardwareService.stopWifiPolling(comp.props.pin || 'A0');
                }
            }
        };
    }, [comp]);

    const handleConnect = async () => {
        if (status === 'connected') {
            await hardwareService.disconnect();
        } else {
            if (comp.props.connectionType === 'MQTT') {
                const options = {};
                if (comp.props.mqttUsername) options.username = comp.props.mqttUsername;
                if (comp.props.mqttPassword) options.password = comp.props.mqttPassword;
                await hardwareService.connectMqtt(comp.props.mqttBrokerUrl || 'wss://broker.emqx.io:8084/mqtt', options);
            } else if (comp.props.connectionType === 'WIFI') {
                hardwareService.wifiIpAddress = comp.props.wifiIpAddress || '192.168.1.100';
                hardwareService._updateStatus('connected');
            } else {
                await hardwareService.connectSerial(comp.props.baudRate || 9600);
            }
        }
    };

    const handleControlChange = async (val) => {
        setLiveValue(val);
        const prefix = comp.props.controlType === 'SLIDER' ? 'p' : 'd';
        const pin = comp.props.pin || '13';
        const cmd = `${prefix}${pin}:${val}\n`;

        if (comp.props.connectionType === 'MQTT') {
            const topic = comp.props.mqttPublishTopic || `arduino/write/${pin}`;
            await hardwareService.publishMqtt(topic, { pin, value: val, cmd });
        } else if (comp.props.connectionType === 'WIFI') {
            const ip = hardwareService.wifiIpAddress || '192.168.1.100';
            await hardwareService.writeWifi(ip, pin, val);
        } else {
            await hardwareService.writeSerial(cmd);
        }
        
        fireWidgetTriggers(comp, 'PinChanged', { pin, value: val });
    };

    const handleSendConsoleCmd = async () => {
        if (!cmdInput.trim()) return;
        const text = cmdInput.trim();
        const timeStr = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { type: 'tx', text, time: timeStr }]);
        setCmdInput('');

        const cmd = `${text}\n`;
        if (comp.props.connectionType === 'MQTT') {
            const topic = comp.props.mqttPublishTopic || `arduino/write/console`;
            await hardwareService.publishMqtt(topic, { cmd });
        } else if (comp.props.connectionType === 'WIFI') {
            const ip = hardwareService.wifiIpAddress || '192.168.1.100';
            await hardwareService.writeWifi(ip, 'console', text);
        } else {
            await hardwareService.writeSerial(cmd);
        }
    };

    const handleMotorControl = async (val, cmdType) => {
        const pin = comp.props.pin || '9';
        
        let cmd = '';
        if (cmdType === 'SERVO') {
            cmd = `s${pin}:${val}\n`;
        } else if (cmdType === 'STEPPER') {
            cmd = `m${pin}:${val}\n`;
        } else if (cmdType === 'DC') {
            cmd = `d${pin}:${val}\n`;
        }

        if (comp.props.connectionType === 'MQTT') {
            const topic = comp.props.mqttPublishTopic || `arduino/write/${pin}`;
            await hardwareService.publishMqtt(topic, { pin, value: val, cmd });
        } else if (comp.props.connectionType === 'WIFI') {
            const ip = hardwareService.wifiIpAddress || '192.168.1.100';
            await hardwareService.writeWifi(ip, pin, val);
        } else {
            await hardwareService.writeSerial(cmd);
        }
        fireWidgetTriggers(comp, 'MotorTriggered', { pin, value: val, cmdType });
    };

    const handleColorChange = async (hexColor) => {
        const r = parseInt(hexColor.slice(1, 3), 16) || 0;
        const g = parseInt(hexColor.slice(3, 5), 16) || 0;
        const b = parseInt(hexColor.slice(5, 7), 16) || 0;
        
        const pin = comp.props.pin || '6';
        const cmd = `c${pin}:${r},${g},${b}\n`;

        if (comp.props.connectionType === 'MQTT') {
            const topic = comp.props.mqttPublishTopic || `arduino/write/${pin}`;
            await hardwareService.publishMqtt(topic, { pin, r, g, b, cmd });
        } else if (comp.props.connectionType === 'WIFI') {
            const ip = hardwareService.wifiIpAddress || '192.168.1.100';
            await hardwareService.writeWifi(ip, `${pin}/r`, r);
            await hardwareService.writeWifi(ip, `${pin}/g`, g);
            await hardwareService.writeWifi(ip, `${pin}/b`, b);
        } else {
            await hardwareService.writeSerial(cmd);
        }
        fireWidgetTriggers(comp, 'ColorChanged', { pin, hexColor, r, g, b });
    };

    const tealColor = '#00979D';

    if (comp.type === 'ARDUINO_BOARD') {
        const connected = status === 'connected';
        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: '#0f172a', borderRadius: '12px', border: `2px solid ${connected ? '#10b981' : '#334155'}`,
                padding: '12px', display: 'flex', flexDirection: 'column', color: '#f8fafc', fontFamily: 'monospace', boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Cpu size={18} color={tealColor} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{comp.props.label || 'Arduino Uno'}</span>
                    </div>
                    <span style={{ 
                        fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', 
                        backgroundColor: connected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', 
                        color: connected ? '#10b981' : '#ef4444', fontWeight: 'bold',
                        display: 'inline-flex', alignItems: 'center', gap: '5px'
                    }}>
                        <span className={`pulse-dot ${connected ? 'pulse-dot-success' : 'pulse-dot-danger'}`} />
                        {connected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                </div>
                <div style={{ flex: 1, position: 'relative', border: '1px solid #1e293b', borderRadius: '8px', backgroundColor: '#020617', overflow: 'hidden', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#475569' }}>
                        <span>{"[AREF] [GND] [13] [12] [~11] [~10] [~9] [8]"}</span>
                        <span>{"[7] [~6] [~5] [4] [~3] [2] [TX>1] [RX<0]"}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                        <div style={{ width: '20px', height: '14px', backgroundColor: '#64748b', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '12px', height: '8px', backgroundColor: '#334155' }} />
                        </div>
                        <div style={{ width: '120px', height: '24px', backgroundColor: '#1e293b', borderRadius: '4px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.55rem', fontWeight: 'bold' }}>
                            ATMEGA328P-PU
                        </div>
                        <div style={{ width: '16px', height: '20px', backgroundColor: '#1e293b', borderRadius: '2px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#475569' }}>
                        <span>{"[5V] [GND] [RST] [3.3V]"}</span>
                        <span>{"[A0] [A1] [A2] [A3] [A4] [A5]"}</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                        onClick={handleConnect}
                        style={{
                            flex: 1, padding: '6px 12px', borderRadius: '6px', border: 'none',
                            backgroundColor: connected ? '#ef4444' : tealColor, color: 'white',
                            fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        {connected ? 'Disconnect' : `Connect ${comp.props.connectionType || 'Serial'}`}
                    </button>
                    <button
                        onClick={() => setShowCodeModal(true)}
                        style={{
                            flex: 1, padding: '6px 12px', borderRadius: '6px', border: `1px solid ${tealColor}`,
                            backgroundColor: 'transparent', color: tealColor,
                            fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        View Firmware Code
                    </button>
                </div>

                {showCodeModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', zIndex: 9999, padding: '24px'
                    }}>
                        <div style={{
                            backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155',
                            width: '100%', maxWidth: '640px', maxHeight: '80vh', display: 'flex',
                            flexDirection: 'column', color: '#f8fafc', overflow: 'hidden'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #334155' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Cpu size={20} color={tealColor} />
                                    Arduino/ESP32 Firmware Generator
                                </h3>
                                <button
                                    onClick={() => setShowCodeModal(false)}
                                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', fontFamily: 'monospace', fontSize: '0.8rem', backgroundColor: '#020617', color: '#38bdf8' }}>
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {getFirmwareCode(comp.props.connectionType, comp.props.boardType, comp.props.baudRate, comp.props.mqttBrokerUrl, comp.props.wifiIpAddress)}
                                </pre>
                            </div>
                            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #334155', backgroundColor: '#0f172a' }}>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(getFirmwareCode(comp.props.connectionType, comp.props.boardType, comp.props.baudRate, comp.props.mqttBrokerUrl, comp.props.wifiIpAddress));
                                        toast.success('Firmware sketch copied to clipboard!');
                                    }}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px', border: 'none',
                                        backgroundColor: tealColor, color: 'white', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    Copy Code
                                </button>
                                <button
                                    onClick={() => setShowCodeModal(false)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px', border: '1px solid #475569',
                                        backgroundColor: 'transparent', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (comp.type === 'ARDUINO_PIN_MONITOR') {
        const valStr = comp.props.pinMode === 'DIGITAL_INPUT' 
            ? (liveValue > 0 ? 'HIGH' : 'LOW') 
            : (typeof liveValue === 'number' ? liveValue.toFixed(comp.props.precision ?? 0) : liveValue);
        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b' }}>{comp.props.label || 'Pin Monitor'}</span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        PIN {comp.props.pin || 'A0'}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', fontFamily: 'monospace' }}>
                        {valStr}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: isDark ? '#64748b' : '#94a3b8' }}>{comp.props.unit}</span>
                </div>
                <div style={{ fontSize: '0.55rem', color: isDark ? '#475569' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {comp.props.pinMode || 'ANALOG_INPUT'} {comp.props.targetVariable ? `→ @${comp.props.targetVariable}` : ''}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_CONTROLLER') {
        const isToggle = comp.props.controlType === 'TOGGLE' || !comp.props.controlType;
        const isSlider = comp.props.controlType === 'SLIDER';
        const isButton = comp.props.controlType === 'BUTTON';

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b' }}>{comp.props.label || 'Pin Controller'}</span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        PIN {comp.props.pin || '13'}
                    </span>
                </div>
                
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isToggle && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                checked={liveValue > 0}
                                onChange={(e) => handleControlChange(e.target.checked ? 1 : 0)}
                                style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isDark ? '#f8fafc' : '#0f172a' }}>
                                {liveValue > 0 ? 'HIGH' : 'LOW'}
                            </span>
                        </div>
                    )}

                    {isButton && (
                        <button
                            onMouseDown={() => handleControlChange(1)}
                            onMouseUp={() => handleControlChange(0)}
                            onTouchStart={() => handleControlChange(1)}
                            onTouchEnd={() => handleControlChange(0)}
                            style={{
                                padding: '8px 16px', backgroundColor: tealColor, color: 'white', border: 'none',
                                borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >
                            HOLD FOR HIGH
                        </button>
                    )}

                    {isSlider && (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <input
                                type="range"
                                min={comp.props.min || 0}
                                max={comp.props.max || 255}
                                value={liveValue}
                                onChange={(e) => handleControlChange(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: tealColor }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: isDark ? '#64748b' : '#94a3b8' }}>
                                <span>Min: {comp.props.min || 0}</span>
                                <span style={{ fontWeight: 'bold', color: tealColor }}>Val: {liveValue}</span>
                                <span>Max: {comp.props.max || 255}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_GRAPH') {
        const samples = graphData;
        const maxVal = Math.max(...samples, 1023);
        const minVal = 0;
        
        const width = 360, height = 110;
        let pointsStr = '';
        if (samples.length > 1) {
            const stepX = width / (samples.length - 1);
            pointsStr = samples.map((v, i) => {
                const x = i * stepX;
                const y = height - ((v - minVal) / (maxVal - minVal)) * height;
                return `${x},${y}`;
            }).join(' ');
        }

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={16} color={comp.props.color || tealColor} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b' }}>{comp.props.label || 'Real-time Graph'}</span>
                    </div>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        PIN {comp.props.pin || 'A0'}
                    </span>
                </div>
                <div style={{ flex: 1, position: 'relative', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '6px', backgroundColor: isDark ? '#020617' : '#f8fafc', overflow: 'hidden' }}>
                    {samples.length > 1 ? (
                        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', display: 'block' }}>
                            <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" strokeDasharray="4" />
                            <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" strokeDasharray="4" />
                            <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" strokeDasharray="4" />
                            <polyline
                                fill="none"
                                stroke={comp.props.color || tealColor}
                                strokeWidth="2"
                                points={pointsStr}
                            />
                        </svg>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#475569' : '#94a3b8', fontSize: '0.75rem' }}>
                            Awaiting serial data...
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_CONSOLE') {
        const showTs = comp.props.showTimestamp !== false;
        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: '#020617', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Terminal size={14} color={tealColor} />
                        {comp.props.label || 'Console Terminal'}
                    </span>
                    <span style={{ fontSize: '0.55rem', color: '#475569' }}>
                        Buffer: {logs.length}/{comp.props.maxLines || 100}
                    </span>
                </div>
                <div style={{
                    flex: 1, overflowY: 'auto', backgroundColor: '#090d16', border: '1px solid #1e293b',
                    borderRadius: '8px', padding: '8px', fontFamily: 'monospace', fontSize: '0.7rem',
                    color: '#38bdf8', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px'
                }}>
                    {logs.map((log, i) => (
                        <div key={i} style={{ display: 'flex', gap: '6px', color: log.type === 'tx' ? '#10b981' : '#38bdf8' }}>
                            {showTs && <span style={{ color: '#475569' }}>[{log.time}]</span>}
                            <span>{log.type === 'tx' ? 'TX>' : 'RX<'}</span>
                            <span style={{ wordBreak: 'break-all' }}>{log.text}</span>
                        </div>
                    ))}
                    <div ref={consoleEndRef} />
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                        type="text"
                        placeholder="Send command..."
                        value={cmdInput}
                        onChange={(e) => setCmdInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendConsoleCmd()}
                        style={{
                            flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px',
                            color: '#f8fafc', padding: '6px 8px', fontSize: '0.75rem', fontFamily: 'monospace'
                        }}
                    />
                    <button
                        onClick={handleSendConsoleCmd}
                        style={{
                            backgroundColor: tealColor, color: 'white', border: 'none', borderRadius: '6px',
                            padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_GAUGE') {
        const val = liveValue;
        const minVal = comp.props.min !== undefined ? parseFloat(comp.props.min) : 0;
        const maxVal = comp.props.max !== undefined ? parseFloat(comp.props.max) : 100;
        const color = comp.props.color || tealColor;
        const unit = comp.props.unit || '°C';
        
        const pct = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
        const r = 40;
        const c = 2 * Math.PI * r;
        const arcLength = c * 0.75;
        const dashOffset = arcLength * (1 - pct);

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b' }}>
                    <span>{comp.props.label || 'Circular Gauge'}</span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px' }}>
                        PIN {comp.props.pin || 'A0'}
                    </span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%' }}>
                    <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-45deg)', transformOrigin: '50% 50%' }}>
                        <circle
                            cx="50"
                            cy="50"
                            r={r}
                            fill="transparent"
                            stroke={isDark ? '#1e293b' : '#e2e8f0'}
                            strokeWidth="8"
                            strokeDasharray={`${arcLength} ${c}`}
                            strokeLinecap="round"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r={r}
                            fill="transparent"
                            stroke={color}
                            strokeWidth="8"
                            strokeDasharray={`${arcLength} ${c}`}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.35s ease' }}
                        />
                    </svg>
                    <div style={{
                        position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'
                    }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', fontFamily: 'monospace' }}>
                            {typeof val === 'number' ? val.toFixed(0) : val}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: isDark ? '#64748b' : '#94a3b8' }}>{unit}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', fontSize: '0.6rem', color: isDark ? '#64748b' : '#94a3b8' }}>
                    <span>Min: {minVal}</span>
                    <span>Max: {maxVal}</span>
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_COLOR_PICKER') {
        const activeColor = comp.props.color || '#ff0000';
        const presets = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ec4899', '#a855f7', '#06b6d4', '#ffffff', '#000000'];
        
        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Palette size={14} color={tealColor} />
                        {comp.props.label || 'RGB Color Picker'}
                    </span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        PIN {comp.props.pin || '6'}
                    </span>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '12px', backgroundColor: activeColor,
                        border: `2px solid ${isDark ? '#334155' : '#e2e8f0'}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <input
                            type="color"
                            value={activeColor}
                            onChange={(e) => {
                                handleColorChange(e.target.value);
                            }}
                            style={{
                                width: '70px', height: '32px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                borderRadius: '6px', cursor: 'pointer', padding: 0, backgroundColor: 'transparent'
                            }}
                        />
                        <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: isDark ? '#f8fafc' : '#0f172a', textAlign: 'center' }}>
                            {activeColor.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '4px', marginTop: '6px' }}>
                    {presets.map((color, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                handleColorChange(color);
                            }}
                            style={{
                                height: '18px', backgroundColor: color, border: activeColor === color ? `2px solid ${isDark ? '#f8fafc' : '#0f172a'}` : `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                borderRadius: '4px', cursor: 'pointer', padding: 0
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_MOTOR') {
        const motorType = comp.props.motorType || 'SERVO';
        
        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RotateCw size={14} color={tealColor} />
                        {comp.props.label || 'Motor Controller'}
                    </span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        PIN {comp.props.pin || '9'}
                    </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {motorType === 'SERVO' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                <span>Angle: {liveValue}°</span>
                                <span>Max: 180°</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="180"
                                value={liveValue}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setLiveValue(val);
                                    handleMotorControl(val, 'SERVO');
                                }}
                                style={{ width: '100%', accentColor: tealColor }}
                            />
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                {[0, 45, 90, 135, 180].map((angle) => (
                                    <button
                                        key={angle}
                                        onClick={() => {
                                            setLiveValue(angle);
                                            handleMotorControl(angle, 'SERVO');
                                        }}
                                        style={{
                                            padding: '2px 6px', fontSize: '0.55rem', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                                            borderRadius: '4px', backgroundColor: 'transparent', color: isDark ? '#f8fafc' : '#0f172a', cursor: 'pointer'
                                        }}
                                    >
                                        {angle}°
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {motorType === 'STEPPER' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                <button
                                    onClick={() => handleMotorControl(-(comp.props.stepSize || 10), 'STEPPER')}
                                    style={{
                                        flex: 1, padding: '8px 12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px',
                                        color: '#0f172a', fontWeight: 'bold', fontSize: '0.7rem', cursor: 'pointer'
                                    }}
                                >
                                    ◀ JOG -{comp.props.stepSize || 10}
                                </button>
                                <button
                                    onClick={() => handleMotorControl((comp.props.stepSize || 10), 'STEPPER')}
                                    style={{
                                        flex: 1, padding: '8px 12px', backgroundColor: tealColor, border: 'none', borderRadius: '6px',
                                        color: 'white', fontWeight: 'bold', fontSize: '0.7rem', cursor: 'pointer'
                                    }}
                                >
                                    JOG +{comp.props.stepSize || 10} ▶
                                </button>
                            </div>
                            <span style={{ fontSize: '0.6rem', color: isDark ? '#64748b' : '#94a3b8' }}>
                                Step size configured in properties.
                            </span>
                        </div>
                    )}

                    {motorType === 'DC' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                <span>Speed (PWM): {liveValue}</span>
                                <span>Max: 255</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="255"
                                value={liveValue}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setLiveValue(val);
                                    handleMotorControl(val, 'DC');
                                }}
                                style={{ width: '100%', accentColor: tealColor }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    onClick={() => {
                                        setLiveValue(0);
                                        handleMotorControl(0, 'DC');
                                    }}
                                    style={{
                                        flex: 1, padding: '4px', fontSize: '0.65rem', backgroundColor: '#ef4444', color: 'white',
                                        border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    STOP
                                </button>
                                <button
                                    onClick={() => {
                                        setLiveValue(255);
                                        handleMotorControl(255, 'DC');
                                    }}
                                    style={{
                                        flex: 1, padding: '4px', fontSize: '0.65rem', backgroundColor: '#22c55e', color: 'white',
                                        border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    MAX
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_RFID') {
        const allowedList = (comp.props.allowedCards || '').split(',').map(s => s.trim().toUpperCase());
        
        const simulateScan = (cardId) => {
            const pin = comp.props.pin || '10';
            hardwareService._emitPinData(pin, cardId, `${pin}:${cardId}`);
            toast.success(`Simulated scan of card: ${cardId}`);
        };

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Nfc size={16} color={tealColor} />
                        {comp.props.label || 'RFID Scanner'}
                    </span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        SDA PIN {comp.props.pin || '10'}
                    </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                    <div style={{
                        width: '50px', height: '50px', borderRadius: '50%',
                        backgroundColor: rfidStatus === 'ACCESS GRANTED' ? 'rgba(16,185,129,0.15)' : rfidStatus === 'ACCESS DENIED' ? 'rgba(239,68,68,0.15)' : (isDark ? '#1e293b' : '#f1f5f9'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px',
                        border: `2px solid ${rfidStatus === 'ACCESS GRANTED' ? '#10b981' : rfidStatus === 'ACCESS DENIED' ? '#ef4444' : (isDark ? '#334155' : '#cbd5e1')}`
                    }}>
                        <CreditCard size={24} color={rfidStatus === 'ACCESS GRANTED' ? '#10b981' : rfidStatus === 'ACCESS DENIED' ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b')} />
                    </div>
                    <span style={{
                        fontSize: '0.75rem', fontWeight: 'bold',
                        color: rfidStatus === 'ACCESS GRANTED' ? '#10b981' : rfidStatus === 'ACCESS DENIED' ? '#ef4444' : (isDark ? '#f8fafc' : '#0f172a')
                    }}>
                        {rfidStatus}
                    </span>
                    {lastCardId && (
                        <span style={{ fontSize: '0.65rem', color: isDark ? '#64748b' : '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
                            UID: {lastCardId}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                        onClick={() => simulateScan(allowedList[0] || 'A1B2C3D4')}
                        style={{
                            flex: 1, padding: '6px 4px', fontSize: '0.6rem', backgroundColor: 'rgba(16,185,129,0.15)',
                            color: '#10b981', border: '1px solid #10b981', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        Simulate Valid
                    </button>
                    <button
                        onClick={() => simulateScan('BAD99999')}
                        style={{
                            flex: 1, padding: '6px 4px', fontSize: '0.6rem', backgroundColor: 'rgba(239,68,68,0.15)',
                            color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        Simulate Invalid
                    </button>
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_LCD') {
        const backlightColor = comp.props.backlightColor || '#00979d';
        
        const handleSendLCD = () => {
            hardwareService.writeSerial(`LCD_L1:${lcdText1}\n`);
            hardwareService.writeSerial(`LCD_L2:${lcdText2}\n`);
            toast.success('LCD text updated and sent!');
        };

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tv size={16} color={tealColor} />
                        {comp.props.label || 'I2C LCD 16x2'}
                    </span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {comp.props.pin || 'I2C (SDA/SCL)'}
                    </span>
                </div>

                <div style={{
                    flex: 1, backgroundColor: '#020617', padding: '10px', borderRadius: '8px',
                    border: `3px solid ${backlightColor}`, boxShadow: `inset 0 0 10px ${backlightColor}`,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: 'monospace',
                    color: backlightColor, textShadow: `0 0 3px ${backlightColor}`, letterSpacing: '1px', minHeight: '50px'
                }}>
                    <div style={{ fontSize: '0.8rem', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {lcdText1.padEnd(16, ' ')}
                    </div>
                    <div style={{ fontSize: '0.8rem', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {lcdText2.padEnd(16, ' ')}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                            type="text"
                            maxLength={16}
                            value={lcdText1}
                            onChange={(e) => setLcdText1(e.target.value)}
                            placeholder="Line 1"
                            style={{ flex: 1, fontSize: '0.65rem', padding: '4px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '4px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', color: isDark ? 'white' : 'black' }}
                        />
                        <input
                            type="text"
                            maxLength={16}
                            value={lcdText2}
                            onChange={(e) => setLcdText2(e.target.value)}
                            placeholder="Line 2"
                            style={{ flex: 1, fontSize: '0.65rem', padding: '4px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '4px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', color: isDark ? 'white' : 'black' }}
                        />
                    </div>
                    <button
                        onClick={handleSendLCD}
                        style={{
                            width: '100%', padding: '4px 8px', fontSize: '0.65rem', backgroundColor: tealColor,
                            color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        Update Display
                    </button>
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_JOYSTICK') {
        const handleDrag = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.max(0, Math.min(1023, Math.round(((e.clientX - rect.left) / rect.width) * 1023)));
            const y = Math.max(0, Math.min(1023, Math.round(((e.clientY - rect.top) / rect.height) * 1023)));
            
            setJoyX(x);
            setJoyY(y);

            const pinX = comp.props.pinX || 'A0';
            const pinY = comp.props.pinY || 'A1';
            hardwareService._emitPinData(pinX, x, `${pinX}:${x}`);
            hardwareService._emitPinData(pinY, y, `${pinY}:${y}`);
            
            syncVariable(`${x},${y}`);
            fireWidgetTriggers(comp, 'CoordinatesChanged', { x, y });
        };

        const toggleButton = () => {
            const nextZ = joyZ === 1 ? 0 : 1;
            setJoyZ(nextZ);
            const pinZ = comp.props.pinSel || '2';
            hardwareService._emitPinData(pinZ, nextZ, `${pinZ}:${nextZ}`);
            fireWidgetTriggers(comp, 'ButtonStateChanged', { buttonPressed: nextZ === 0 });
        };

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Gamepad2 size={16} color={tealColor} />
                        {comp.props.label || '2-Axis Joystick'}
                    </span>
                    <span style={{ fontSize: '0.55rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>
                        X:{comp.props.pinX || 'A0'} Y:{comp.props.pinY || 'A1'} SW:{comp.props.pinSel || '2'}
                    </span>
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around', margin: '6px 0' }}>
                    <div
                        onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
                        onMouseDown={handleDrag}
                        style={{
                            width: '64px', height: '64px', borderRadius: '50%', backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                            border: `2px solid ${isDark ? '#334155' : '#cbd5e1'}`, position: 'relative', cursor: 'crosshair'
                        }}
                    >
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444',
                            position: 'absolute', top: `${(joyY / 1023) * 100}%`, left: `${(joyX / 1023) * 100}%`,
                            transform: 'translate(-50%, -50%)', pointerEvents: 'none'
                        }} />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', color: isDark ? '#94a3b8' : '#64748b', fontFamily: 'monospace' }}>X: {joyX}</span>
                        <span style={{ fontSize: '0.65rem', color: isDark ? '#94a3b8' : '#64748b', fontFamily: 'monospace' }}>Y: {joyY}</span>
                        <button
                            onClick={toggleButton}
                            style={{
                                padding: '4px 6px', fontSize: '0.6rem',
                                backgroundColor: joyZ === 0 ? '#10b981' : 'transparent',
                                color: joyZ === 0 ? 'white' : (isDark ? '#f8fafc' : '#0f172a'),
                                border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '4px', cursor: 'pointer'
                            }}
                        >
                            SW: {joyZ === 0 ? 'ACTIVE' : 'RELEASED'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_KEYPAD') {
        const keys = [
            ['1', '2', '3', 'A'],
            ['4', '5', '6', 'B'],
            ['7', '8', '9', 'C'],
            ['*', '0', '#', 'D']
        ];

        const handleKeyPress = (key) => {
            setLastKeyPressed(key);
            hardwareService._emitPinData('KEYPAD', key, `KEYPAD:${key}`);
            syncVariable(key);
            fireWidgetTriggers(comp, 'KeyClicked', { key });
            toast.success(`Key Pressed: ${key}`);
        };

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b' }}>
                        {comp.props.label || '4x4 Keypad'}
                    </span>
                    {lastKeyPressed && (
                        <span style={{ fontSize: '0.65rem', color: tealColor, fontFamily: 'monospace', fontWeight: 'bold' }}>
                            LAST: {lastKeyPressed}
                        </span>
                    )}
                </div>

                <div style={{
                    display: 'grid', gridTemplateRows: 'repeat(4, 1fr)', gap: '4px', flex: 1
                }}>
                    {keys.map((row, rIdx) => (
                        <div key={rIdx} style={{ display: 'flex', gap: '4px' }}>
                            {row.map((k) => (
                                <button
                                    key={k}
                                    onClick={() => handleKeyPress(k)}
                                    style={{
                                        flex: 1, padding: '4px 0', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                                        borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
                                        backgroundColor: lastKeyPressed === k ? 'rgba(0,151,157,0.2)' : (isDark ? '#1e293b' : '#f8fafc'),
                                        color: lastKeyPressed === k ? tealColor : (isDark ? '#f8fafc' : '#0f172a'),
                                        cursor: 'pointer', transition: 'all 0.1s'
                                    }}
                                >
                                    {k}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_MATRIX') {
        const toggleLED = (r, c) => {
            const next = matrixState.map((row, rIdx) =>
                row.map((val, cIdx) => (rIdx === r && cIdx === c ? !val : val))
            );
            setMatrixState(next);
            
            // Format into hex array
            const hexArray = next.map(row => {
                let byte = 0;
                row.forEach((led, idx) => {
                    if (led) byte |= (1 << (7 - idx));
                });
                return '0x' + byte.toString(16).padStart(2, '0').toUpperCase();
            });
            
            const payload = hexArray.join(',');
            hardwareService.writeSerial(`MATRIX:${payload}\n`);
            fireWidgetTriggers(comp, 'MatrixChanged', { matrix: payload });
        };

        const clearMatrix = () => {
            const empty = Array(8).fill(0).map(() => Array(8).fill(false));
            setMatrixState(empty);
            hardwareService.writeSerial(`MATRIX:0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00\n`);
            fireWidgetTriggers(comp, 'MatrixChanged', { matrix: '0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00' });
        };

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Grid3X3 size={16} color={tealColor} />
                        {comp.props.label || '8x8 LED Matrix'}
                    </span>
                    <button
                        onClick={clearMatrix}
                        style={{
                            fontSize: '0.55rem', border: 'none', backgroundColor: 'rgba(239,68,68,0.1)',
                            color: '#ef4444', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >
                        CLEAR
                    </button>
                </div>

                <div style={{
                    display: 'grid', gridTemplateRows: 'repeat(8, 1fr)', gap: '2px', flex: 1,
                    backgroundColor: '#020617', padding: '6px', borderRadius: '6px', aspectRatio: '1/1',
                    alignSelf: 'center', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`
                }}>
                    {matrixState.map((row, rIdx) => (
                        <div key={rIdx} style={{ display: 'flex', gap: '2px' }}>
                            {row.map((led, cIdx) => (
                                <div
                                    key={cIdx}
                                    onClick={() => toggleLED(rIdx, cIdx)}
                                    style={{
                                        width: '12px', height: '12px', borderRadius: '2px',
                                        backgroundColor: led ? '#ef4444' : '#1e293b',
                                        boxShadow: led ? '0 0 6px #ef4444' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_RTC') {
        const handleSyncTime = () => {
            const epoch = Math.floor(Date.now() / 1000);
            hardwareService.writeSerial(`RTC_SET:${epoch}\n`);
            toast.success(`RTC Synced with Epoch: ${epoch}`);
            fireWidgetTriggers(comp, 'TimeSynced', { epoch });
        };

        return (
            <div style={{
                width: '100%', height: '100%', backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Timer size={16} color={tealColor} />
                        {comp.props.label || 'RTC DS3231 Clock'}
                    </span>
                    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(0,151,157,0.1)', color: tealColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                        I2C
                    </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', fontFamily: 'monospace', letterSpacing: '1px' }}>
                        {currentTime}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: isDark ? '#64748b' : '#94a3b8', marginTop: '2px' }}>
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>

                <button
                    onClick={handleSyncTime}
                    style={{
                        width: '100%', padding: '6px', fontSize: '0.65rem', backgroundColor: tealColor,
                        color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    Sync with System Time
                </button>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_RADAR') {
        const sweep = comp.props.angleSweep || 180;
        const size = 220;
        const cx = size / 2, cy = size / 2, r = size / 2 - 8;
        const sweepRad = (radarAngle * Math.PI) / 180;
        const sweepX = cx + r * Math.cos(Math.PI - sweepRad);
        const sweepY = cy - r * Math.sin(sweepRad) * (sweep === 360 ? 1 : 1);
        const toXY = (ang, dist) => ({
            x: cx + r * dist * Math.cos(Math.PI - (ang * Math.PI) / 180),
            y: cy - r * dist * Math.sin((ang * Math.PI) / 180)
        });
        const rings = [0.25, 0.5, 0.75, 1.0];
        const spokeAngles = sweep === 360
            ? [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
            : [0, 30, 60, 90, 120, 150, 180];
        return (
            <div style={{ width: '100%', height: '100%', background: '#000e00', borderRadius: '12px', padding: '8px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00ff41', fontFamily: 'monospace', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>⬡ {comp.props.label || 'Radar Sweep'}</span>
                    <span style={{ color: '#4ade80', fontSize: '0.6rem' }}>MAX: {comp.props.maxDistance || 200}cm | SWEEP: {sweep}°</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={size} height={size * (sweep === 360 ? 1 : 0.6)} viewBox={`0 0 ${size} ${sweep === 360 ? size : size * 0.55}`} style={{ overflow: 'visible' }}>
                        {rings.map((f, i) => (
                            <ellipse key={i} cx={cx} cy={cy} rx={r * f} ry={sweep === 360 ? r * f : r * f * 0.55}
                                fill="none" stroke="#00ff4130" strokeWidth="1" />
                        ))}
                        {spokeAngles.map((a, i) => {
                            const rad = (a * Math.PI) / 180;
                            return <line key={i} x1={cx} y1={cy}
                                x2={cx + r * Math.cos(Math.PI - rad)}
                                y2={cy - r * 0.55 * Math.sin(rad)}
                                stroke="#00ff4120" strokeWidth="1" />;
                        })}
                        <defs>
                            <radialGradient id={`rg-${comp.id}`} cx="50%" cy="100%" r="100%">
                                <stop offset="0%" stopColor="#00ff41" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                        <line x1={cx} y1={cy} x2={sweepX} y2={cy - (cy - sweepY) * 0.55}
                            stroke="#00ff41" strokeWidth="2" opacity="0.9" />
                        <circle cx={cx} cy={cy} r="3" fill="#00ff41" />
                        {radarDots.map((d, i) => {
                            const { x, y } = toXY(d.angle, d.dist);
                            return <circle key={i} cx={x} cy={cy - (cy - y) * 0.55} r="3"
                                fill="#00ff41" opacity={0.3 + (i / radarDots.length) * 0.7} />;
                        })}
                    </svg>
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_TANK') {
        const pct = tankLevel;
        const warningPct = comp.props.warningThreshold || 80;
        const liqColor = pct >= warningPct ? '#ef4444' : (comp.props.liquidColor || '#3b82f6');
        const tankH = 180;
        const fillH = (pct / 100) * tankH;
        return (
            <div style={{ width: '100%', height: '100%', background: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', padding: '12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px', width: '100%', textAlign: 'left' }}>
                    💧 {comp.props.label || 'Liquid Tank'}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <svg width="80" height={tankH + 20} viewBox={`0 0 80 ${tankH + 20}`} style={{ overflow: 'visible' }}>
                        <rect x="5" y="0" width="70" height={tankH} rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                        <rect x="5" y={tankH - fillH} width="70" height={fillH} rx="0"
                            fill={liqColor} opacity="0.8"
                            style={{ transition: 'height 0.6s ease, y 0.6s ease' }} />
                        <rect x="5" y="0" width="70" height={tankH} rx="8" fill="none" stroke="#475569" strokeWidth="2" />
                        {[0.25, 0.5, 0.75].map((f, i) => (
                            <line key={i} x1="5" y1={tankH * (1 - f)} x2="15" y2={tankH * (1 - f)}
                                stroke="#64748b" strokeWidth="1" />
                        ))}
                        <rect x="30" y={tankH} width="20" height="8" rx="3" fill="#475569" />
                    </svg>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: liqColor, fontFamily: 'monospace' }}>{pct.toFixed(1)}%</div>
                        <div style={{ fontSize: '0.65rem', color: isDark ? '#64748b' : '#94a3b8' }}>Capacity: {comp.props.capacity || 1000}L</div>
                        <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: liqColor, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                        </div>
                        {pct >= warningPct && <div style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 700 }}>⚠ HIGH LEVEL ALERT</div>}
                    </div>
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_MODBUS') {
        const regs = modbusRegs;
        return (
            <div style={{ width: '100%', height: '100%', background: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: isDark ? '#1e293b' : '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#f59e0b' }}>⬛</span> {comp.props.label || 'Modbus Viewer'}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>RTU | Addr {comp.props.clientAddress || 1}</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                        <thead>
                            <tr style={{ background: isDark ? '#1e293b' : '#f8fafc' }}>
                                <th style={{ padding: '4px 8px', textAlign: 'left', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>Register</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>DEC</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>HEX</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regs.map((r, i) => (
                                <tr key={i} style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: i % 2 === 0 ? 'transparent' : (isDark ? '#1e293b50' : '#f8fafc50') }}>
                                    <td style={{ padding: '4px 8px', color: '#f59e0b' }}>{r.addr || `4000${i + 1}`}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right', color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 700 }}>{r.val}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right', color: isDark ? '#64748b' : '#94a3b8' }}>{`0x${Number(r.val).toString(16).toUpperCase().padStart(4, '0')}`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_STATUS_GRID') {
        const pins = (comp.props.pins || 'D2,D3,D4,D5').split(',').map(p => p.trim());
        const labels = (comp.props.pinLabels || '').split(',').map(l => l.trim());
        return (
            <div style={{ width: '100%', height: '100%', background: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', padding: '12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>🔦 {comp.props.label || 'Status Lights Grid'}</div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, pins.length)}, 1fr)`, gap: '8px', alignContent: 'start' }}>
                    {pins.map((pin, i) => {
                        const active = !!statusPins[pin];
                        return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px', background: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px', border: `1px solid ${active ? '#10b981' : (isDark ? '#334155' : '#e2e8f0')}` }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: active ? '#10b981' : '#374151', boxShadow: active ? '0 0 10px #10b981' : 'none', transition: 'all 0.2s' }} />
                                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: active ? '#10b981' : (isDark ? '#64748b' : '#94a3b8'), textAlign: 'center', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {labels[i] || pin}
                                </div>
                                <div style={{ fontSize: '0.5rem', color: isDark ? '#475569' : '#cbd5e1' }}>{active ? 'HIGH' : 'LOW'}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_OSCILLOSCOPE') {
        const data = oscData;
        const W = 280, H = 120;
        const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / 255) * H}`).join(' ');
        const freqEst = (comp.props.timebase || 50);
        return (
            <div style={{ width: '100%', height: '100%', background: '#000a00', borderRadius: '12px', padding: '10px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00ff88', fontFamily: 'monospace' }}>⚡ {comp.props.label || 'Oscilloscope'}</span>
                    <span style={{ fontSize: '0.6rem', color: '#4ade80', fontFamily: 'monospace' }}>PIN {comp.props.pin || 'A0'} | {freqEst}ms/div</span>
                </div>
                <div style={{ flex: 1, border: '1px solid #00ff4430', borderRadius: '6px', background: '#00100a', padding: '4px', position: 'relative', overflow: 'hidden' }}>
                    {[0.25, 0.5, 0.75].map((f, i) => <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${f * 100}%`, borderTop: '1px dashed #00ff4420' }} />)}
                    {[0.2, 0.4, 0.6, 0.8].map((f, i) => <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${f * 100}%`, borderLeft: '1px dashed #00ff4220' }} />)}
                    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                        <polyline points={pts} fill="none" stroke="#00ff88" strokeWidth="1.5" />
                    </svg>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#4ade80', marginTop: '4px', fontFamily: 'monospace' }}>
                    <span>CH1: {comp.props.amplitude || 5}V</span>
                    <span>TRIG: AUTO</span>
                    <span>SAMPLE: {data.length}pts</span>
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_THERMAL') {
        const grid = thermalGrid;
        const maxT = comp.props.maxTemp || 80;
        const palette = comp.props.colorPalette || 'IRONBOW';
        const getColor = (v) => {
            const t = Math.min(1, Math.max(0, v / maxT));
            if (palette === 'IRONBOW') {
                const r = Math.min(255, Math.round(t < 0.5 ? t * 2 * 100 : 100 + (t - 0.5) * 2 * 155));
                const g = Math.min(255, Math.round(t < 0.33 ? 0 : t < 0.66 ? (t - 0.33) * 3 * 200 : 200 + (t - 0.66) * 3 * 55));
                const b = Math.min(255, Math.round(t < 0.5 ? 150 - t * 2 * 150 : 0));
                return `rgb(${r},${g},${b})`;
            }
            const r2 = Math.round(t * 255);
            return `rgb(${r2},${Math.round((1 - Math.abs(t - 0.5) * 2) * 255)},${255 - r2})`;
        };
        return (
            <div style={{ width: '100%', height: '100%', background: '#0a0a0a', borderRadius: '12px', padding: '10px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>🌡 {comp.props.label || 'Thermal Camera'}</span>
                    <span style={{ fontSize: '0.6rem', color: '#f97316' }}>AMG8833 | 8×8 px</span>
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px' }}>
                    {grid.map((v, i) => (
                        <div key={i} title={`${v.toFixed(1)}°C`}
                            style={{ borderRadius: '2px', background: getColor(v), aspectRatio: '1', transition: 'background 0.3s' }} />
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#64748b', marginTop: '6px' }}>
                    <span>Min: {Math.min(...grid).toFixed(1)}°C</span>
                    <span>Max: {Math.max(...grid).toFixed(1)}°C</span>
                </div>
            </div>
        );
    }

    if (comp.type === 'ARDUINO_THERMOMETER') {
        const mn = parseFloat(comp.props.minVal ?? 0);
        const mx = parseFloat(comp.props.maxVal ?? 100);
        const val = thermoValue;
        const pct = Math.min(1, Math.max(0, (val - mn) / (mx - mn)));
        const barH = 160;
        const fillH = pct * barH;
        const tempColor = pct > 0.8 ? '#ef4444' : pct > 0.6 ? '#f59e0b' : '#3b82f6';
        return (
            <div style={{ width: '100%', height: '100%', background: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', padding: '12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', width: '100%', textAlign: 'left' }}>Linear Thermometer</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <svg width="40" height={barH + 30} viewBox={`0 0 40 ${barH + 30}`}>
                        <rect x="14" y="0" width="12" height={barH} rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="14" y={barH - fillH} width="12" height={fillH} rx="6" fill={tempColor}
                            style={{ transition: 'height 0.6s ease, y 0.6s ease' }} />
                        <circle cx="20" cy={barH + 12} r="12" fill={tempColor} />
                        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                            <line key={i} x1="22" y1={barH * (1 - f)} x2="30" y2={barH * (1 - f)}
                                stroke="#64748b" strokeWidth="1" />
                        ))}
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: tempColor, fontFamily: 'monospace' }}>
                            {val.toFixed(1)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#94a3b8', fontWeight: 600 }}>{comp.props.unit || '°C'}</div>
                        <div style={{ fontSize: '0.55rem', color: isDark ? '#475569' : '#94a3b8' }}>PIN: {comp.props.pin || 'A0'}</div>
                        <div style={{ fontSize: '0.55rem', color: isDark ? '#475569' : '#94a3b8' }}>{mn}{comp.props.unit || '°C'} – {mx}{comp.props.unit || '°C'}</div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

const MeasurementWidget = ({ comp, syncVariable, fireWidgetTriggers, isDark }) => {
    const [liveValue, setLiveValue] = useState(0);
    const [status, setStatus] = useState('disconnected');
    
    const { currentLanguage } = useLanguage();
    const t = (key) => translations[currentLanguage]?.measurementWidget?.[key] || key;

    useEffect(() => {
        const unsubData = hardwareService.onData((val) => {
            setLiveValue(val);
            fireWidgetTriggers(comp, 'ValueReceived', { value: val });
        });

        const unsubStatus = hardwareService.subscribeStatus((s) => {
            setStatus(s);
        });

        return () => {
            unsubData();
            unsubStatus();
        };
    }, [comp]);

    const handleConnect = async () => {
        if (comp.props.connectionType === 'SERIAL') {
            await hardwareService.connectSerial(comp.props.baudRate);
        } else {
            await hardwareService.connectBluetooth();
        }
    };

    const handleCapture = () => {
        fireWidgetTriggers(comp, 'Capture', { value: liveValue });
        syncVariable(liveValue);
    };

    const renderToolIllustration = () => {
        const color = 'var(--text-tertiary)';
        if (comp.type === 'OUTSIDE_MICROMETER') {
            return (
                <svg viewBox="0 0 100 40" style={{ width: '80px', height: '32px', color }}>
                    <path d="M 30 10 L 15 10 A 15 15 0 0 0 15 30 L 30 30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <line x1="30" y1="20" x2="45" y2="20" stroke="currentColor" strokeWidth="3" />
                    <rect x="45" y="14" width="35" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                    <rect x="80" y="12" width="15" height="16" rx="1" fill="currentColor" />
                    <line x1="55" y1="14" x2="55" y2="26" stroke="currentColor" strokeWidth="1" />
                    <line x1="65" y1="14" x2="65" y2="26" stroke="currentColor" strokeWidth="1" />
                </svg>
            );
        }
        if (comp.type === 'INSIDE_MICROMETER') {
            return (
                <svg viewBox="0 0 100 30" style={{ width: '80px', height: '24px', color }}>
                    <rect x="15" y="12" width="55" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line x1="15" y1="6" x2="15" y2="24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <line x1="70" y1="6" x2="70" y2="24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <rect x="70" y="10" width="20" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                    <rect x="90" y="9" width="8" height="12" rx="1" fill="currentColor" />
                </svg>
            );
        }
        if (comp.type === 'DIAL_HEIGHT_GAUGE') {
            return (
                <svg viewBox="0 0 60 100" style={{ width: '40px', height: '64px', color }}>
                    <rect x="10" y="85" width="40" height="10" rx="2" fill="currentColor" />
                    <rect x="25" y="10" width="10" height="75" fill="none" stroke="currentColor" strokeWidth="2" />
                    <rect x="20" y="40" width="20" height="15" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="30" cy="47.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="30" y1="47.5" x2="33" y2="44.5" stroke="currentColor" strokeWidth="1" />
                </svg>
            );
        }
        if (comp.type === 'DEPTH_GAUGE') {
            return (
                <svg viewBox="0 0 100 60" style={{ width: '80px', height: '48px', color }}>
                    <line x1="20" y1="15" x2="80" y2="15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <rect x="47" y="15" width="6" height="35" rx="1" fill="currentColor" />
                    <line x1="30" y1="15" x2="30" y2="20" stroke="currentColor" strokeWidth="1" />
                    <line x1="70" y1="15" x2="70" y2="20" stroke="currentColor" strokeWidth="1" />
                </svg>
            );
        }
        if (comp.type === 'ROUGHNESS_TESTER') {
            return (
                <svg viewBox="0 0 100 50" style={{ width: '80px', height: '40px', color }}>
                    <rect x="20" y="10" width="60" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
                    <rect x="25" y="15" width="30" height="20" rx="1" fill="currentColor" opacity="0.2" />
                    <path d="M 80 25 L 95 25 L 95 35" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="95" cy="35" r="2" fill="currentColor" />
                </svg>
            );
        }
        if (comp.type === 'TORQUE_WRENCH') {
            return (
                <svg viewBox="0 0 120 40" style={{ width: '96px', height: '32px', color }}>
                    <rect x="10" y="15" width="80" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="15" cy="20" r="6" fill="currentColor" />
                    <rect x="12" y="17" width="6" height="6" fill="white" />
                    <rect x="90" y="12" width="25" height="16" rx="2" fill="currentColor" />
                    <line x1="95" y1="12" x2="95" y2="28" stroke="white" strokeWidth="1" opacity="0.3" />
                    <line x1="105" y1="12" x2="105" y2="28" stroke="white" strokeWidth="1" opacity="0.3" />
                </svg>
            );
        }
        if (comp.type === 'WEIGHING_SCALE') {
            return (
                <svg viewBox="0 0 100 60" style={{ width: '80px', height: '48px', color }}>
                    <rect x="10" y="40" width="80" height="10" rx="2" fill="currentColor" />
                    <rect x="20" y="15" width="60" height="25" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    <rect x="30" y="20" width="40" height="10" rx="1" fill="currentColor" opacity="0.2" />
                    <circle cx="25" cy="22.5" r="1.5" fill="currentColor" />
                    <circle cx="75" cy="22.5" r="1.5" fill="currentColor" />
                </svg>
            );
        }
        return <Ruler size={32} style={{ color, opacity: 0.5 }} />;
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            padding: '12px',
            backgroundColor: isDark ? 'var(--bg-panel)' : 'white',
            border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: isDark ? '#94a3b8' : '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <Ruler size={14} strokeWidth={2.5} />
                    {comp.props.label || comp.props.title || t('title')}
                </span>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: status === 'connected' ? '#22c55e' : status === 'error' ? '#ef4444' : '#94a3b8',
                    boxShadow: status === 'connected' ? '0 0 8px #22c55e' : 'none'
                }} />
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
            }}>
                <div style={{ position: 'absolute', opacity: 0.1, transform: 'scale(1.5)' }}>
                    {renderToolIllustration()}
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: isDark ? 'white' : '#0f172a', zIndex: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {liveValue.toFixed(comp.props.precision ?? 2)}
                    <span style={{ fontSize: '0.9rem', marginLeft: '4px', fontWeight: 500, color: '#64748b' }}>{comp.props.unit || 'mm'}</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>
                    {t(status)}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
                {status !== 'connected' ? (
                    <button
                        onClick={handleConnect}
                        style={{
                            flex: 1,
                            padding: '6px',
                            fontSize: '0.75rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <Bluetooth size={14} /> {t('connect') || 'Connect'}
                    </button>
                ) : (
                    <button
                        onClick={() => hardwareService.disconnect()}
                        style={{
                            flex: 1,
                            padding: '6px',
                            fontSize: '0.75rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {t('disconnect') || 'Disconnect'}
                    </button>
                )}

                {comp.props.showCaptureButton !== false && (
                    <button
                        onClick={handleCapture}
                        style={{
                            flex: 1,
                            padding: '6px',
                            fontSize: '0.75rem',
                            backgroundColor: '#16a34a',
                            color: 'white',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <CheckCircle2 size={14} /> {t('capture') || 'Capture'}
                    </button>
                )}
            </div>
        </div>
    );
};

const LiveTerminal = () => {
  const [showChat, setShowChat] = useState(false);
  const [devMode, setDevMode] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';
    const hashSearchIndex = hash.indexOf('?');
    if (hashSearchIndex !== -1) {
      const hashParams = new URLSearchParams(hash.substring(hashSearchIndex));
      for (const [key, value] of hashParams.entries()) {
        if (!searchParams.has(key)) searchParams.set(key, value);
      }
    }
    return searchParams.get('devMode') === 'true' || searchParams.get('dev') === 'true';
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeMobileTab, setActiveMobileTab] = useState('apps');
  const [showGlobalScanner, setShowGlobalScanner] = useState(false);
  const [showWorkSequence, setShowWorkSequence] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const { t } = useLanguage();
  const { appId } = useParams();
  const location = useLocation();
  
  const launchParams = useMemo(() => {
    const searchParams = new URLSearchParams(location.search || '');
    const hash = window.location.hash || '';
    const hashSearchIndex = hash.indexOf('?');
    if (hashSearchIndex !== -1) {
      const hashParams = new URLSearchParams(hash.substring(hashSearchIndex));
      for (const [key, value] of hashParams.entries()) {
        if (!searchParams.has(key)) searchParams.set(key, value);
      }
    }
    return searchParams;
  }, [location.search, location.hash]);

  const launchOperator = (launchParams.get('operator') || '').trim();
  const launchStation = (launchParams.get('station') || '').trim();
  const launchScaleMode = launchParams.get('scaleMode') === 'FIT_WIDTH' ? 'FIT_WIDTH' : 'FIT_SCREEN';
  const [runtimeScaleMode, setRuntimeScaleMode] = useState(launchScaleMode);

  const launchLayoutMode = launchParams.get('layoutMode') || (() => {
    try {
      return localStorage.getItem('mavi_runtime_layout_mode') || 'PROPORTIONAL';
    } catch (e) {
      return 'PROPORTIONAL';
    }
  })();
  const [layoutMode, setLayoutMode] = useState(launchLayoutMode);

  useEffect(() => {
    const isDev = launchParams.get('devMode') === 'true' || launchParams.get('dev') === 'true';
    setDevMode(isDev);
  }, [launchParams]);

  useEffect(() => {
    setRuntimeScaleMode(launchScaleMode);
  }, [launchScaleMode]);

  useEffect(() => {
    setLayoutMode(launchLayoutMode);
  }, [launchLayoutMode]);

  // Dashboard states
  const [searchQuery, setSearchQuery] = useState('');
  const [terminalTab, setTerminalTab] = useState('All'); // 'All' | 'Favorites' | 'Recent'
  const [favoriteApps, setFavoriteApps] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mavi_terminal_favorites')) || []; } catch (e) { return []; }
  });
  const [recentApps, setRecentApps] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mavi_terminal_recent')) || []; } catch (e) { return []; }
  });
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showOperatorMenu, setShowOperatorMenu] = useState(false);
  const { changeLanguage, currentLanguage } = useLanguage();

  const [interfaces, setInterfaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manuals, setManuals] = useState([]);
  const [frontlineApps, setFrontlineApps] = useState([]);
  const [productionQueue, setProductionQueue] = useState([]);
  const [selectedManual, setSelectedManual] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [signatureMode, setSignatureMode] = useState('DRAW'); // 'DRAW' | 'AUTH'
  const [machineTagValues, setMachineTagValues] = useState({});
  const [activeMedia, setActiveMedia] = useState(null); // { type, url, duration }

  useEffect(() => {
    const interval = setInterval(async () => {
      const machines = await getMachines();
      const newValues = {};
      machines.forEach(m => {
        if (m.tagMappings) {
          m.tagMappings.forEach(tm => {
            newValues[`${m.id}_${tm.attribute}`] = iotConnector.getLiveValue(tm.tag);
          });
        }
      });
      setMachineTagValues(newValues);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const [oeeData, setOeeData] = useState({});
  useEffect(() => {
    const interval = setInterval(async () => {
      const machines = await getMachines();
      const newOee = {};
      for (const m of machines) {
        // Fetch OEE for last 24h
        const stats = await calculateOEE(m.id);
        newOee[m.id] = stats;
      }
      setOeeData(newOee);
    }, 5000); // Poll OEE every 5s
    return () => clearInterval(interval);
  }, []);

  // Modbus TCP Background Polling at Runtime
  useEffect(() => {
    let isMounted = true;
    let activeIntervals = [];
    let activeMqttClients = [];

    const initConnectionAndPoll = async () => {
      let tauriInvoke = null;
      if (window.__TAURI_INTERNALS__) {
        try {
          const core = await import('@tauri-apps/api/core');
          tauriInvoke = core.invoke;
        } catch (e) {
          console.warn('Failed to load Tauri core invoke:', e);
        }
      }

      let parsedCtrls = [];
      let parsedTags = [];

      if (window.mavi_plc_controllers && window.mavi_plc_tags) {
        parsedCtrls = window.mavi_plc_controllers;
        parsedTags = window.mavi_plc_tags;
      } else {
        try {
          const { controllers: dbCtrls, tags: dbTags } = await loadPlcSettingsFromSupabase();
          if (dbCtrls && dbCtrls.length > 0) {
            parsedCtrls = dbCtrls;
            parsedTags = dbTags || [];
            window.mavi_plc_controllers = dbCtrls;
            window.mavi_plc_tags = dbTags || [];
          } else {
            console.warn('LiveTerminal: No PLC settings found in Supabase.');
            return;
          }
        } catch (err) {
          console.error('Failed to load PLC settings from Supabase:', err);
          return;
        }
      }

      // Connect and poll MQTT brokers
      for (const ctrl of parsedCtrls) {
        if (ctrl.type === 'MQTT') {
          try {
            let host = ctrl.ip || 'broker.emqx.io';
            let port = ctrl.port || 1883;
            // Map standard TCP ports to websocket equivalents for browser compatibility
            if (port === 1883 || port === 1884) {
              if (host.includes('emqx.io')) port = 8084;
              else if (host.includes('hivemq.com')) port = 8000;
              else port = 8084;
            }
            const scheme = (port === 8000 || port === 8083) ? 'ws://' : 'wss://';
            const path = host.includes('hivemq.com') ? '/mqtt' : (host.includes('emqx.io') ? '/mqtt' : '/mqtt');
            const brokerUrl = (host.startsWith('ws://') || host.startsWith('wss://')) 
              ? host 
              : `${scheme}${host}:${port}${path}`;

            console.log(`LiveTerminal: Connecting to PLC MQTT Broker: ${brokerUrl}`);
            const mqttOptions = {
              clientId: ctrl.clientId || `mavi-plc-${Math.random().toString(16).substr(2, 8)}`
            };
            if (ctrl.username) mqttOptions.username = ctrl.username;
            if (ctrl.password) mqttOptions.password = ctrl.password;

            const client = mqtt.connect(brokerUrl, mqttOptions);
            activeMqttClients.push(client);

            client.on('connect', () => {
              console.log(`LiveTerminal: Connected to PLC MQTT Broker at ${brokerUrl}`);
              const ctrlTags = parsedTags.filter(t => t.controllerId === ctrl.id);
              ctrlTags.forEach(tag => {
                const topic = (ctrl.topicPrefix || '') + (tag.address || '');
                if (topic) {
                  client.subscribe(topic);
                  console.log(`LiveTerminal: Subscribed to MQTT PLC Tag Topic: ${topic}`);
                }
              });
            });

            client.on('message', (topic, message) => {
              if (!isMounted) return;
              const payload = message.toString();
              
              let currentTags = window.mavi_plc_tags || parsedTags;

              let tagUpdates = false;
              currentTags = currentTags.map(t => {
                if (t.controllerId === ctrl.id) {
                  const tagTopic = (ctrl.topicPrefix || '') + (t.address || '');
                  if (tagTopic === topic) {
                    tagUpdates = true;
                    return { ...t, value: payload };
                  }
                }
                return t;
              });

              if (tagUpdates && isMounted) {
                parsedTags = currentTags;
                window.mavi_plc_tags = currentTags;
                
                const ctrlTags = currentTags.filter(t => t.controllerId === ctrl.id);
                for (const tag of ctrlTags) {
                  const tagTopic = (ctrl.topicPrefix || '') + (tag.address || '');
                  if (tagTopic === topic) {
                    setAppVariables(prev => prev.map(v => v.name === tag.name ? { ...v, value: payload } : v));
                  }
                }
              }
            });
          } catch (e) {
            console.error(`Failed to connect to PLC MQTT Broker:`, e);
          }
        }
      }

      // 1. If Tauri is available, connect and poll real Modbus
      if (tauriInvoke) {
        for (const ctrl of parsedCtrls) {
          if (ctrl.type === 'MODBUS_TCP' && ctrl.status === 'connected') {
            try {
              await tauriInvoke('modbus_connect', {
                id: ctrl.id,
                ip: ctrl.ip,
                port: parseInt(ctrl.port) || 502,
                unitId: parseInt(ctrl.unitId) || 1
              });
            } catch (err) {
              console.error(`Modbus connection failed on startup for ${ctrl.name}:`, err);
            }

            const intervalId = setInterval(async () => {
              if (!isMounted) return;
              const ctrlTags = parsedTags.filter(t => t.controllerId === ctrl.id);
              let tagUpdates = false;

              for (const tag of ctrlTags) {
                let addr = parseInt(tag.address);
                if (isNaN(addr)) continue;

                let offset = addr;
                if (tag.regType === 'COIL') offset = addr - 1;
                else if (tag.regType === 'DISCRETE_INPUT') offset = addr - 10001;
                else if (tag.regType === 'INPUT_REGISTER') offset = addr - 30001;
                else if (tag.regType === 'HOLDING_REGISTER') offset = addr - 40001;
                if (offset < 0) offset = 0;

                try {
                  const res = await tauriInvoke('modbus_read', {
                    id: ctrl.id,
                    regType: tag.regType,
                    address: offset,
                    quantity: 1
                  });

                  if (Array.isArray(res) && res.length > 0 && isMounted) {
                    const rawVal = res[0];
                    let scaledVal = rawVal;
                    
                    if (tag.dataType === 'BOOLEAN') {
                      scaledVal = rawVal !== 0 ? 'true' : 'false';
                    } else if (tag.dataType === 'FLOAT') {
                      scaledVal = (rawVal * (tag.multiplier || 1)).toFixed(2);
                    } else {
                      scaledVal = String(Math.round(rawVal * (tag.multiplier || 1)));
                    }

                    parsedTags = parsedTags.map(t => t.id === tag.id ? { ...t, value: String(scaledVal) } : t);
                    tagUpdates = true;

                    setAppVariables(prev => prev.map(v => v.name === tag.name ? { ...v, value: String(scaledVal) } : v));
                  }
                } catch (err) {
                  console.error(`Failed to poll register ${tag.address} for ${tag.name}:`, err);
                }
              }

              if (tagUpdates && isMounted) {
                window.mavi_plc_tags = parsedTags;
              }
            }, ctrl.pollingInterval || 2000);

            activeIntervals.push(intervalId);
          }
        }
      } else {
        // 2. Simulation mode when running in browser web-preview
        const intervalId = setInterval(() => {
          if (!isMounted) return;
          let tagUpdates = false;

          parsedTags = parsedTags.map(tag => {
            const ctrl = parsedCtrls.find(c => c.id === tag.controllerId);
            if (ctrl && ctrl.status !== 'connected') return tag;

            let newVal = tag.value;
            if (tag.dataType === 'BOOLEAN') {
              newVal = Math.random() > 0.9 ? (tag.value === 'true' || tag.value === '1' ? 'false' : 'true') : tag.value;
            } else if (tag.dataType === 'FLOAT') {
              const change = (Math.random() - 0.5) * 2;
              newVal = (parseFloat(tag.value || 0) + change).toFixed(2);
            } else {
              const change = Math.floor((Math.random() - 0.5) * 5);
              newVal = String(Math.max(0, parseInt(tag.value || 0) + change));
            }

            tagUpdates = true;
            
            setAppVariables(prev => prev.map(v => v.name === tag.name ? { ...v, value: String(newVal) } : v));

            return { ...tag, value: newVal };
          });

          if (tagUpdates && isMounted) {
            window.mavi_plc_tags = parsedTags;
          }
        }, 3000);

        activeIntervals.push(intervalId);
      }
    };

    initConnectionAndPoll();

    return () => {
      isMounted = false;
      activeIntervals.forEach(clearInterval);
      activeMqttClients.forEach(client => {
        try {
          client.end();
        } catch (e) {}
      });
    };
  }, []);

  const [signatureImage, setSignatureImage] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signature, setSignature] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [status, setStatus] = useState('READY');
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [cycleData, setCycleData] = useState([]);
  const [machineData, setMachineData] = useState({});
  const [currentWorkOrder, setCurrentWorkOrder] = useState('');
  const [qualityData, setQualityData] = useState({}); // Tracking inputs for quality components
  const [quantityLog, setQuantityLog] = useState({}); // { [compId]: { completed: 0, target: N } }
  const [sessionStartTime] = useState(new Date());
  // Interactive widget state
  const [checklistState, setChecklistState] = useState({}); // { [compId]: Set of checked indices }
  const [toggleState, setToggleState] = useState({}); // { [compId]: boolean }
  const [barcodeValues, setBarcodeValues] = useState({}); // { [compId]: string }
  const [cameraScannerValues, setCameraScannerValues] = useState({}); // { [compId]: string }
  const [cameraScannerStatus, setCameraScannerStatus] = useState({}); // { [compId]: string }
  const [cameraScannerActive, setCameraScannerActive] = useState({}); // { [compId]: boolean }
  const [cameraValues, setCameraValues] = useState({}); // { [compId]: dataUrl }
  const [uploadValues, setUploadValues] = useState({}); // { [compId]: { name, url, type } }
  const [textInputValues, setTextInputValues] = useState({}); // { [compId]: string }
  const [textAreaValues, setTextAreaValues] = useState({}); // { [compId]: string }
  const saveLock = useRef({}); // Prevents double-saves for the same placeholder during concurrent triggers
  const [multiSelectValues, setMultiSelectValues] = useState({}); // { [compId]: string[] }
  const [dropdownValues, setDropdownValues] = useState({}); // { [compId]: string }
  const [radioValues, setRadioValues] = useState({}); // { [compId]: string }
  const [toleranceValues, setToleranceValues] = useState({}); // { [compId]: string }
  const [numberInputValues, setNumberInputValues] = useState({}); // { [compId]: number }
  const [dateValues, setDateValues] = useState({}); // { [compId]: string }
  const [dateTimeValues, setDateTimeValues] = useState({}); // { [compId]: string }
  const [sliderValues, setSliderValues] = useState({}); // { [compId]: number }
  const [drawValues, setDrawValues] = useState({}); // { [compId]: dataUrl }
  const [gpsValues, setGpsValues] = useState({}); // { [compId]: { lat, lng } }
  const [mediaValues, setMediaValues] = useState({}); // { [compId]: { recording, url, mode } }
  const [qualityResult, setQualityResult] = useState({}); // { [compId]: 'PASS'|'FAIL'|null }
  const [signatureWidgetValues, setSignatureWidgetValues] = useState({}); // { [compId]: dataUrl }
  const [validationErrors, setValidationErrors] = useState({}); // { [compId]: message }
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [stepTimers, setStepTimers] = useState({}); // { [stepId]: seconds }
  const [recordingState, setRecordingState] = useState({}); // { [compId]: boolean }
  const [mediaRecorderValues, setMediaRecorderValues] = useState({}); // { [compId]: dataUrl }
  const [obd2Values, setObd2Values] = useState({}); // { [pid]: { value, unit } }
  const [obd2Status, setObd2Status] = useState('disconnected');
  const [visionValues, setVisionValues] = useState({}); // { [compId]: string }
  const [ocrProcessing, setOcrProcessing] = useState({}); // { [compId]: boolean }
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeControlDevice, setActiveControlDevice] = useState(null);
  const [controlConfirmChecked, setControlConfirmChecked] = useState(false);
  const [alarms, setAlarms] = useState([
    { time: '10:20:15', source: 'LIC-101', msg: 'Water Level High Limit Exceeded', severity: 'CRITICAL', status: 'UNACK' },
    { time: '10:18:42', source: 'VALVE-202', msg: 'Valve Fail to Open Feedback', severity: 'WARNING', status: 'ACK' },
    { time: '09:45:00', source: 'SYS-MON', msg: 'PLC Communications Restored', severity: 'INFO', status: 'CLEARED' }
  ]);

  const [appVariables, setAppVariables] = useState([]);
  const [globalLogic, setGlobalLogic] = useState(null);
  const [blocklyRuntimeError, setBlocklyRuntimeError] = useState(null);

  useEffect(() => {
    appVariables.forEach(v => {
      const valNum = parseFloat(v.value);
      if (!isNaN(valNum)) {
        if (valNum > 90) {
          setAlarms(prev => {
            const hasAlarm = prev.some(a => a.source === v.name && a.status === 'UNACK' && a.msg.includes('High Limit'));
            if (!hasAlarm) {
              const now = new Date().toLocaleTimeString();
              return [
                { time: now, source: v.name, msg: `${v.name} Level High Limit Exceeded (${v.value})`, severity: 'CRITICAL', status: 'UNACK' },
                ...prev
              ];
            }
            return prev;
          });
        } else if (valNum < 10 && valNum > 0) {
          setAlarms(prev => {
            const hasAlarm = prev.some(a => a.source === v.name && a.status === 'UNACK' && a.msg.includes('Low Limit'));
            if (!hasAlarm) {
              const now = new Date().toLocaleTimeString();
              return [
                { time: now, source: v.name, msg: `${v.name} Level Low Limit Warning (${v.value})`, severity: 'WARNING', status: 'UNACK' },
                ...prev
              ];
            }
            return prev;
          });
        }
      }
    });
  }, [appVariables]);
  const stepTimerRef = useRef(null);
  // Defect modal
  const [showDefectModal, setShowDefectModal] = useState(false);
  const [defectType, setDefectType] = useState('');
  const [defectCount, setDefectCount] = useState(1);
  const [defectLog, setDefectLog] = useState([]);
  const [showCopilot, setShowCopilot] = useState(false);
  const [visibilityMap, setVisibilityMap] = useState({});

  // Advanced Andon System
  const [showAndonModal, setShowAndonModal] = useState(false);
  const [activeAndon, setActiveAndon] = useState(null); // { startTime, category, detail }
  const [andonCategory, setAndonCategory] = useState('');
  const [andonDetail, setAndonDetail] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);


  // --- DERIVED STATE ---
  const steps = useMemo(() => selectedApp ? (selectedApp.config?.steps || []) : (selectedManual?.content?.steps || []), [selectedApp, selectedManual]);
  const activeStep = steps[currentStepIndex];
  const stepLabel = steps.length > 0
    ? `Step ${currentStepIndex + 1} of ${steps.length}${activeStep?.title ? ` — ${activeStep.title}` : ''}`
    : null;
  const baseComponents = useMemo(() => selectedApp?.config?.baseComponents || [], [selectedApp]);
  const stepComponents = useMemo(() => activeStep?.components || [], [activeStep]);
  const appComponents = useMemo(() => [...baseComponents, ...stepComponents], [baseComponents, stepComponents]);

  const selectedAppRef = useRef(selectedApp);
  const currentStepIndexRef = useRef(currentStepIndex);
  const appComponentsRef = useRef(appComponents);

  useEffect(() => {
    selectedAppRef.current = selectedApp;
  }, [selectedApp]);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    appComponentsRef.current = appComponents;
  }, [appComponents]);

  const [canvasWrapper, setCanvasWrapper] = useState(null);
  const [containerWidth, setContainerWidth] = useState(1280);
  const [containerHeight, setContainerHeight] = useState(800);

  const canvasBaseSize = useMemo(() => {
    const presetKey = selectedApp?.config?.devicePreset || 'RESPONSIVE';
    const orientation = selectedApp?.config?.previewOrientation || 'PORTRAIT';
    const preset = DEVICE_PRESETS[presetKey] || DEVICE_PRESETS.RESPONSIVE;
    
    if (presetKey === 'RESPONSIVE') {
      // Fixed design canvas — will be stretched to fill the full screen via transform scale
      return { width: 1000, height: 625 };
    }
    
    return {
      width: orientation === 'PORTRAIT' ? preset.width : preset.height,
      height: orientation === 'PORTRAIT' ? preset.height : preset.width
    };
  }, [selectedApp]);

  useEffect(() => {
    if (!canvasWrapper) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
        if (entry.contentRect.height > 0) {
          setContainerHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(canvasWrapper);
    return () => observer.disconnect();
  }, [canvasWrapper]);

  const layoutWidth = useMemo(() => {
    return canvasBaseSize.width;
  }, [canvasBaseSize]);

  const layoutHeight = useMemo(() => {
    return canvasBaseSize.height;
  }, [canvasBaseSize]);

  const presetKey = selectedApp?.config?.devicePreset || 'RESPONSIVE';
  const preset = DEVICE_PRESETS[presetKey] || DEVICE_PRESETS.RESPONSIVE;
  const isPreset = presetKey !== 'RESPONSIVE';
  const isResponsiveMode = presetKey === 'RESPONSIVE' && layoutMode === 'RESPONSIVE';
  const isDark = selectedApp?.config?.appThemeMode === 'DARK';
  const scalingMode = selectedApp?.config?.scalingMode || 'FIT_SCREEN';
  const runtimeSelectionActive = Boolean(selectedApp || selectedManual);
  const effectiveScalingMode = runtimeSelectionActive ? runtimeScaleMode : scalingMode;

  const scaleX = useMemo(() => {
    if (containerWidth <= 0 || layoutWidth <= 0) return 1;
    const sX = containerWidth / layoutWidth;
    if (effectiveScalingMode === 'FIT_WIDTH') return sX;
    if (containerHeight <= 0 || layoutHeight <= 0) return sX;
    const sY = containerHeight / layoutHeight;
    return Math.min(sX, sY);
  }, [containerWidth, containerHeight, layoutWidth, layoutHeight, effectiveScalingMode]);

  const scaleY = useMemo(() => {
    if (containerWidth <= 0 || layoutWidth <= 0) return 1;
    const sX = containerWidth / layoutWidth;
    if (effectiveScalingMode === 'FIT_WIDTH') return sX;
    if (containerHeight <= 0 || layoutHeight <= 0) return 1;
    const sY = containerHeight / layoutHeight;
    return Math.min(sX, sY);
  }, [containerWidth, containerHeight, layoutWidth, layoutHeight, effectiveScalingMode]);

  const canvasFrameRadius = useMemo(() => {
    if (!isPreset) return '0px';
    return preset.kind === 'PHONE' ? '30px' : preset.kind === 'TABLET' ? '22px' : '10px';
  }, [isPreset, preset]);

  const canvasFrameShadow = useMemo(() => {
    if (!isPreset) {
      return 'none';
    }
    return preset.kind === 'PHONE' || preset.kind === 'TABLET'
      ? '0 0 0 12px #1e293b, 0 20px 50px rgba(0,0,0,0.3)'
      : '0 0 0 1px #334155, 0 18px 40px rgba(15, 23, 42, 0.25)';
  }, [isPreset, preset]);

  const canvasFrameBorder = useMemo(() => {
    if (!isPreset) {
      return 'none';
    }
    return 'none';
  }, [isPreset, isDark]);

  const renderComponentInColumn = (comp, idx) => {
    const err = validationErrors[comp?.id];
    const heightStyle = comp?.h ? `${comp.h}px` : 'auto';
    return (
      <div
        key={comp?.id || idx}
        id={comp?.id ? `terminal-comp-${comp.id}` : undefined}
        ref={(el) => { if (comp?.id) widgetContainerRefs.current[comp.id] = el; }}
        className={comp?.props?.isBlinking ? 'animate-blink' : ''}
        style={{
          width: '100%',
          height: heightStyle,
          marginBottom: '16px',
          position: 'relative',
          flexShrink: 0
        }}
      >
        <div style={{
          border: err ? '2px solid #ef4444' : 'none',
          borderRadius: '8px',
          padding: err ? '10px' : 0,
          backgroundColor: err ? '#fee2e2' : 'transparent',
          height: '100%',
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          {renderComponent(comp)}
        </div>
        {err && (
          <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
            {err}
          </div>
        )}
      </div>
    );
  };

  // --- OBD2 INTEGRATION ---
  useEffect(() => {
    const unsubStatus = obd2Service.subscribeStatus(s => setObd2Status(s));
    const unsubData = obd2Service.onPIDData('*', (data) => {
      if (data && data.pid) {
        const upperPid = data.pid.toUpperCase();
        setObd2Values(prev => ({
          ...prev,
          [upperPid]: data
        }));

        // 1. Trigger background automation rules listening for OBD2_TRIGGER
        automationEngine.trigger('OBD2_TRIGGER', {
          pid: upperPid,
          value: data.value,
          unit: data.unit
        });

        // 2. Fire widget triggers for components matching this PID on the current step
        const curApp = selectedAppRef.current;
        const curStepIdx = currentStepIndexRef.current;
        const curComps = appComponentsRef.current;

        if (curApp && curApp.config && curApp.config.steps && curComps) {
          const activeStep = curApp.config.steps[curStepIdx];
          const activeStepId = activeStep?.id;

          curComps.forEach(comp => {
            // Only fire if widget is in the active step or is base/global
            const isCurrentStep = !comp.step_id || comp.step_id === activeStepId;
            if (!isCurrentStep) return;

            const defaultPid = OBD2_DEFAULT_PIDS[comp.type];
            const compPid = comp.props?.pid || defaultPid;
            if (compPid && compPid.toUpperCase() === upperPid) {
              fireWidgetTriggers(comp, 'ON_CHANGE', {
                value: data.value,
                unit: data.unit,
                pid: data.pid
              });
            }
          });
        }
      }
    });
    return () => {
      unsubStatus();
      unsubData();
      obd2Service.stopAllStreams();
    };
  }, []);

  useEffect(() => {
    if (currentWorkOrder) {
      setAppVariables(prev => prev.map(v => {
        const nameUpper = (v.name || '').toUpperCase();
        if (nameUpper === 'WORK_ORDER_ID' || nameUpper === 'SELECTED_WO_ID' || nameUpper === 'WORKORDER' || nameUpper === 'WORK_ORDER' || nameUpper === 'WO_ID') {
          return { ...v, value: currentWorkOrder };
        }
        return v;
      }));
    }
  }, [currentWorkOrder]);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (!active || !selectedApp || obd2Status !== 'connected') {
        if (active) setTimeout(poll, 1000);
        return;
      }

      const obd2Comps = appComponents.filter(c => c.type.startsWith('OBD2_'));
      if (obd2Comps.length > 0) {
        // Aggregate unique PIDs to avoid redundant queries
        const pids = [...new Set(obd2Comps.map(c => c.props.pid || OBD2_DEFAULT_PIDS[c.type]).filter(Boolean))];
        const fastPids = pids.filter(p => p === '010C' || p === '010D'); // RPM, Speed
        const slowPids = pids.filter(p => p !== '010C' && p !== '010D' && p !== 'VIN'); // Round-robin the rest

        // 1. Poll critical fast PIDs every loop for real-time needle movement
        for (const pid of fastPids) {
          if (!active) break;
          try {
            await obd2Service.queryPID(pid);
          } catch (err) {
            console.warn('OBD2 Poll Error:', err);
          }
        }

        // 2. Poll ONE slow PID per loop (Round-Robin) to prevent loop lag
        if (slowPids.length > 0 && active) {
          if (!window._maviObd2SlowIndex || window._maviObd2SlowIndex >= slowPids.length) {
              window._maviObd2SlowIndex = 0;
          }
          try {
            await obd2Service.queryPID(slowPids[window._maviObd2SlowIndex]);
          } catch (err) {}
          window._maviObd2SlowIndex++;
        }
      }
      if (active) setTimeout(poll, 15); // Ultra-fast loop
    };

    poll();
    return () => {
      active = false;
    };
  }, [selectedApp, currentStepIndex, obd2Status, appComponents]);


  const resetInputs = useCallback(() => {
    console.log('[resetInputs] Clearing all form states and variables...');
    setBarcodeValues({});
    setCameraScannerValues({});
    setCameraScannerStatus({});
    setCameraScannerActive({});
    setCameraValues({});
    setUploadValues({});
    setTextInputValues({});
    setTextAreaValues({});
    setMultiSelectValues({});
    setDropdownValues({});
    setRadioValues({});
    setToleranceValues({});
    setNumberInputValues({});
    setDateValues({});
    setDateTimeValues({});
    setSliderValues({});
    setDrawValues({});
    setGpsValues({});
    setMediaValues({});
    setQualityResult({});
    setSignatureWidgetValues({});
    setQualityData({});
    setChecklistState({});
    setToggleState({});
    setVisionValues({});
    setRecordPlaceholderData({});
    
    // Increment refresh key to force a clean re-render of all components
    setRefreshKey(prev => prev + 1);
    
    // Reset all variables to their default values
    setAppVariables(prev => prev.map(v => ({ ...v, value: v.defaultValue || '' })));
  }, []);

  const syncVariableForComp = (comp, value) => {
    if (!comp) return;
    const varName = comp.props?.targetVariable || (comp.props?.dataSourceType === 'VARIABLE' ? comp.props?.varSource : null);
    if (varName && typeof varName === 'string') {
      const cleanVarName = varName.startsWith('@') ? varName.substring(1) : varName;
      if (cleanVarName.includes('.')) {
        const [pName, ...fPath] = cleanVarName.split('.');
        const placeholder = recordPlaceholders.find(rp => rp.name === pName || rp.id === pName);
        if (placeholder) {
          setRecordPlaceholderData(prev => {
            const currentRecord = prev[placeholder.id] || {};
            const updatedRecord = { ...currentRecord };
            let cur = updatedRecord;
            for (let i = 0; i < fPath.length - 1; i++) {
              const part = fPath[i];
              if (!cur[part] || typeof cur[part] !== 'object') {
                cur[part] = {};
              }
              cur[part] = { ...cur[part] };
              cur = cur[part];
            }
            cur[fPath[fPath.length - 1]] = value;
            return { ...prev, [placeholder.id]: updatedRecord };
          });
        }
      } else {
        setAppVariables(prev => prev.map(v => v.name === cleanVarName ? { ...v, value } : v));
      }
    }
  };
  useEffect(() => {
    if (appVariables.length > 0) {
      window.parent.postMessage({
        type: 'VARIABLES_SYNC',
        variables: appVariables.map(v => ({ name: v.name, value: v.value, type: v.type }))
      }, '*');
    }
  }, [appVariables]);

  const [appFunctions, setAppFunctions] = useState([]);
  const [recordPlaceholders, setRecordPlaceholders] = useState([]);
  const [recordPlaceholderData, setRecordPlaceholderData] = useState({});
  const [appContext, setAppContext] = useState({
    user: getCurrentUser()?.name || launchOperator || 'Operator',
    userId: (getCurrentUser()?.username || launchOperator || 'operator').toLowerCase(),
    station: launchStation || 'WS-01'
  });
  const [boundData, setBoundData] = useState({}); // { [compId]: value }
  const [chartData, setChartData] = useState({}); // { [compId]: Array of data }
  const [tableData, setTableData] = useState({}); // { [compId]: Array of data }
  const [advancedTableData, setAdvancedTableData] = useState({}); // { [compId]: Array of data }
  const [tablePagination, setTablePagination] = useState({}); // { [compId]: { page: 1 } }
  const [advancedTableFilters, setAdvancedTableFilters] = useState({}); // { [compId]: string }
  const [advancedTableSort, setAdvancedTableSort] = useState({}); // { [compId]: { col, dir } }
  const [selectedTableRow, setSelectedTableRow] = useState({}); // { [compId]: record }

  const [currentTime, setCurrentTime] = useState(new Date());
  const [stations, setStations] = useState([]);
  const [keyboardShift, setKeyboardShift] = useState({});

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync input widgets when record placeholders change (e.g. table row selected)
  useEffect(() => {
    if (!selectedApp && !selectedManual) return;
    const activeStep = (selectedApp?.config?.steps || selectedManual?.content?.steps || [])[currentStepIndex];
    if (!activeStep) return;

    activeStep.components.forEach(comp => {
      const binding = comp.props.varSource || comp.props.targetVariable;
      if (binding && typeof binding === 'string' && binding.startsWith('@')) {
        const val = resolveValue(binding);
        if (val !== undefined && val !== null) {
          if (comp.type === 'TEXT_INPUT' || comp.type === 'PASSWORD_TEXT') {
            setTextInputValues(prev => prev[comp.id] === val ? prev : { ...prev, [comp.id]: val });
          } else if (comp.type === 'NUMBER_INPUT') {
            setNumberInputValues(prev => prev[comp.id] === val ? prev : { ...prev, [comp.id]: val });
          } else if (comp.type === 'DROPDOWN') {
            setDropdownValues(prev => prev[comp.id] === val ? prev : { ...prev, [comp.id]: val });
          } else if (comp.type === 'RADIO_GROUP') {
            setRadioValues(prev => prev[comp.id] === val ? prev : { ...prev, [comp.id]: val });
          } else if (comp.type === 'CHECKBOX') {
            setToggleState(prev => prev[comp.id] === val ? prev : { ...prev, [comp.id]: !!val });
          } else if (comp.type === 'TEXT_AREA') {
            setTextAreaValues(prev => prev[comp.id] === val ? prev : { ...prev, [comp.id]: val });
          } else if (comp.type === 'BARCODE_SCANNER' || comp.type === 'BARCODE') {
            setBarcodeValues(prev => prev[comp.id] === val ? prev : { ...prev, [comp.id]: val });
          }
        }
      }
      // Also sync components bound to appVariables via targetVariable (without @ prefix)
      const varName = comp.props.targetVariable || (comp.props.dataSourceType === 'VARIABLE' ? comp.props.varSource : null);
      if (varName && typeof varName === 'string' && !varName.startsWith('@')) {
        const vDef = appVariables.find(v => v.name === varName);
        if (vDef && vDef.value !== undefined && vDef.value !== null) {
          const val = vDef.value;
          if (comp.type === 'TEXT_INPUT' || comp.type === 'PASSWORD_TEXT') {
            setTextInputValues(prev => prev[comp.id] === val ? prev : { ...prev, [comp.id]: val });
          } else if (comp.type === 'NUMBER_INPUT') {
            setNumberInputValues(prev => prev[comp.id] === val ? prev : { ...prev, [comp.id]: val });
          } else if (comp.type === 'TEXT_AREA') {
            setTextAreaValues(prev => prev[comp.id] === val ? prev : { ...prev, [comp.id]: val });
          } else if (comp.type === 'BARCODE_SCANNER' || comp.type === 'BARCODE') {
            setBarcodeValues(prev => prev[comp.id] === val ? prev : { ...prev, [comp.id]: val });
          }
        }
      }
    });
  }, [recordPlaceholderData, appVariables, currentStepIndex, selectedApp, selectedManual]);

  useEffect(() => {
    getStations().then(res => setStations(res || [])).catch(console.error);
  }, []);
  const applyInputMask = (value, mask) => {
    if (!mask) return value;
    let formatted = '';
    let valIdx = 0;
    for (let i = 0; i < mask.length && valIdx < value.length; i++) {
      const m = mask[i];
      const v = value[valIdx];
      if (m === '9') {
        if (/\d/.test(v)) { formatted += v; valIdx++; }
        else { valIdx++; i--; } // Skip invalid, retry mask char
      } else if (m === 'a') {
        if (/[a-zA-Z]/.test(v)) { formatted += v; valIdx++; }
        else { valIdx++; i--; }
      } else if (m === '*') {
        formatted += v; valIdx++;
      } else {
        formatted += m;
        if (v === m) valIdx++; // If user typed the literal, consume it
      }
    }
    return formatted;
  };

  const timerRef = useRef(null);
  const lastStepIndexRef = useRef(-1);
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);
  const drawCanvasRefs = useRef({});
  const drawCtxRefs = useRef({});
  const drawActiveRefs = useRef({});
  const mediaRecorderRefs = useRef({});
  const mediaChunksRefs = useRef({});
  const mediaStreamRefs = useRef({});
  const cameraScannerVideoRefs = useRef({});
  const visionWebcamRefs = useRef({});
  const cameraScannerStreams = useRef({});
  const cameraScannerIntervals = useRef({});
  const widgetContainerRefs = useRef({});
  const signatureCanvasRefs = useRef({});
  const signatureCtxRefs = useRef({});
  const signatureActiveRefs = useRef({});

  const getCanvasPoint = (canvas, evt) => {
    const rect = canvas.getBoundingClientRect();
    const touch = evt.touches?.[0] || evt.changedTouches?.[0];
    const clientX = touch ? touch.clientX : evt.clientX;
    const clientY = touch ? touch.clientY : evt.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const ensureSignatureCanvas = (key) => {
    const canvas = signatureCanvasRefs.current[key];
    if (!canvas) return null;
    let ctx = signatureCtxRefs.current[key];
    if (!ctx) {
      ctx = canvas.getContext('2d');
      signatureCtxRefs.current[key] = ctx;
    }
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    return { canvas, ctx };
  };

  const startSignatureDraw = (key, evt) => {
    evt.preventDefault();
    const refs = ensureSignatureCanvas(key);
    if (!refs) return;
    const { canvas, ctx } = refs;
    const { x, y } = getCanvasPoint(canvas, evt);
    signatureActiveRefs.current[key] = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const moveSignatureDraw = (key, evt) => {
    if (!signatureActiveRefs.current[key]) return;
    evt.preventDefault();
    const refs = ensureSignatureCanvas(key);
    if (!refs) return;
    const { canvas, ctx } = refs;
    const { x, y } = getCanvasPoint(canvas, evt);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endSignatureDraw = (key, comp = null) => {
    if (!signatureActiveRefs.current[key]) return;
    signatureActiveRefs.current[key] = false;
    const canvas = signatureCanvasRefs.current[key];
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (key === '__final_signature__') {
      setSignatureImage(dataUrl);
    } else {
      setSignatureWidgetValues(prev => ({ ...prev, [key]: dataUrl }));
      syncVariableForComp(comp, dataUrl);
      setIsDrawingSignature(prev => ({ ...prev, [key]: false }));
      if (comp) fireWidgetTriggers(comp, 'ON_CHANGE');
    }
  };

  const clearSignatureCanvas = (key, comp = null) => {
    const refs = ensureSignatureCanvas(key);
    if (!refs) return;
    const { canvas, ctx } = refs;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (key === '__final_signature__') {
      setSignatureImage('');
    } else {
      setSignatureWidgetValues(prev => ({ ...prev, [key]: '' }));
      if (comp) fireWidgetTriggers(comp, 'ON_CHANGE');
    }
  };

  const validateCameraScannerValue = (comp, value) => {
    const pattern = comp?.props?.validationRegex;
    if (!pattern) return { ok: true };
    try {
      const re = new RegExp(pattern);
      return { ok: re.test(value), message: `Value does not match regex: ${pattern}` };
    } catch {
      return { ok: true };
    }
  };

  const stopCameraScanner = (compId) => {
    const intervalId = cameraScannerIntervals.current[compId];
    if (intervalId) {
      clearInterval(intervalId);
      delete cameraScannerIntervals.current[compId];
    }
    const stream = cameraScannerStreams.current[compId];
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      delete cameraScannerStreams.current[compId];
    }
    setCameraScannerActive(prev => ({ ...prev, [compId]: false }));
  };

  const applyCameraScannerValue = (comp, rawValue, source = 'camera') => {
    const value = String(rawValue || '').trim();
    if (!value) return;
    const validation = validateCameraScannerValue(comp, value);
    if (!validation.ok) {
      setCameraScannerStatus(prev => ({ ...prev, [comp.id]: validation.message || 'Invalid format' }));
      return;
    }
    setCameraScannerValues(prev => ({ ...prev, [comp.id]: value }));
    syncVariableForComp(comp, value);
    setCameraScannerStatus(prev => ({ ...prev, [comp.id]: source === 'camera' ? `Scanned: ${value}` : `Manual input: ${value}` }));
    if (comp?.props?.autoTrigger !== false) {
      fireWidgetTriggers(comp, 'ON_CHANGE');
    }
  };

  const startMediaRecording = async (comp) => {
    const mode = comp.props.mode || 'AUDIO';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === 'VIDEO' });
      mediaStreamRefs.current[comp.id] = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRefs.current[comp.id] = mr;
      mediaChunksRefs.current[comp.id] = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) mediaChunksRefs.current[comp.id].push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(mediaChunksRefs.current[comp.id], { type: mode === 'AUDIO' ? 'audio/webm' : 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaRecorderValues(prev => ({ ...prev, [comp.id]: reader.result }));
          fireWidgetTriggers(comp, 'ON_CHANGE');
        };
        reader.readAsDataURL(blob);
        setRecordingState(prev => ({ ...prev, [comp.id]: false }));
      };
      mr.start();
      setRecordingState(prev => ({ ...prev, [comp.id]: true }));
    } catch (e) {
      console.error('Recording failed:', e);
    }
  };

  const stopMediaRecording = (comp) => {
    const mr = mediaRecorderRefs.current[comp.id];
    if (mr && mr.state !== 'inactive') mr.stop();
    const stream = mediaStreamRefs.current[comp.id];
    if (stream) stream.getTracks().forEach(t => t.stop());
  };

  const startCameraScanner = async (comp) => {
    if (!comp?.id) return;
    const compId = comp.id;
    stopCameraScanner(compId);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraScannerStatus(prev => ({ ...prev, [compId]: 'Camera is not supported on this device/browser.' }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });

      cameraScannerStreams.current[compId] = stream;
      const video = cameraScannerVideoRefs.current[compId];
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => { });
      }

      const isBarcodeDetectorSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window;
      if (!isBarcodeDetectorSupported) {
        setCameraScannerStatus(prev => ({ ...prev, [compId]: 'Live decode not supported in this browser. Use manual fallback input.' }));
        setCameraScannerActive(prev => ({ ...prev, [compId]: true }));
        return;
      }

      const mode = comp.props?.scanMode || 'ALL';
      const formats = mode === 'QR'
        ? ['qr_code']
        : mode === 'BARCODE'
          ? ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_e']
          : ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_e'];

      const detector = new window.BarcodeDetector({ formats });
      const loopId = setInterval(async () => {
        const targetVideo = cameraScannerVideoRefs.current[compId];
        if (!targetVideo || targetVideo.readyState < 2) return;
        try {
          const codes = await detector.detect(targetVideo);
          if (codes && codes.length > 0 && codes[0]?.rawValue) {
            applyCameraScannerValue(comp, codes[0].rawValue, 'camera');
            setCameraScannerStatus(prev => ({ ...prev, [compId]: `Scan success: ${codes[0].rawValue}` }));
            if (comp.props?.autoTrigger !== false) {
              stopCameraScanner(compId);
            }
          }
        } catch {
          // Ignore transient detect errors
        }
      }, 650);

      cameraScannerIntervals.current[compId] = loopId;
      setCameraScannerActive(prev => ({ ...prev, [compId]: true }));
      setCameraScannerStatus(prev => ({ ...prev, [compId]: 'Camera ready. Point to barcode / QR.' }));
    } catch (err) {
      setCameraScannerStatus(prev => ({ ...prev, [compId]: `Camera failed: ${err?.message || 'Unknown error'}` }));
      stopCameraScanner(compId);
    }
  };

  const takePhoto = (comp) => {
    const video = cameraScannerVideoRefs.current[comp.id];
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/png');
    setCameraValues(prev => ({ ...prev, [comp.id]: dataUrl }));
    syncVariableForComp(comp, dataUrl);
    stopCameraScanner(comp.id);
    fireWidgetTriggers(comp, 'ON_CHANGE');
  };

  const handleFileUpload = async (comp, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const resultUrl = e.target.result;
      setUploadValues(prev => ({
        ...prev,
        [comp.id]: {
          name: file.name,
          type: file.type,
          url: resultUrl,
          size: file.size
        }
      }));

      // Auto-update bound variable
      const targetVar = comp.props?.targetVariable;
      if (targetVar) {
        setAppVariables(prev => prev.map(v => v.name === targetVar ? { ...v, value: resultUrl } : v));
      }

      fireWidgetTriggers(comp, 'ON_CHANGE');
    };
    reader.readAsDataURL(file);
  };

  const runStressTest = async () => {
    const count = 10; // Reduced for direct cloud mode
    const toastId = toast.loading(`Sending ${count} test records to cloud...`);

    try {
      const resolvedTableId = await resolveTableIdReference('STRESS_TEST_TABLE');
      for (let i = 0; i < count; i++) {
        await addTableRecord(resolvedTableId, {
          timestamp: new Date().toISOString(),
          index: i,
          note: 'Direct cloud stress test'
        });
      }
      toast.success(`Sent ${count} records directly to Supabase table ${resolvedTableId}.`, { id: toastId });
    } catch (err) {
      toast.error(`Cloud test failed: ${err?.message || 'Unknown error'}`);
      toast.dismiss(toastId);
    }
  };


  const handleVisionOcr = async (comp, webcamRef) => {
    if (!webcamRef.current) return;

    setOcrProcessing(prev => ({ ...prev, [comp.id]: true }));
    const imageSrc = webcamRef.current.getScreenshot();

    try {
      const { data: { text } } = await Tesseract.recognize(imageSrc, 'eng', {
        // logger: m => console.log(m)
      });

      // Extract numbers (including decimals) from the text
      const matches = text.match(/[-+]?[0-9]*\.?[0-9]+/g);
      if (matches && matches.length > 0) {
        // Take the longest match or the first one that looks like a measurement
        const value = matches[0];
        setVisionValues(prev => ({ ...prev, [comp.id]: value }));

        // If targetVariable is set, update it
        if (comp.props.targetVariable) {
          const vDef = appVariables.find(v => v.name === comp.props.targetVariable);
          setAppVariables(prev => prev.map(v => v.name === comp.props.targetVariable ? { ...v, value: value } : v));
          if (vDef?.isPersistent) {
            const { upsertGlobalVariable } = await import('../utils/supabaseGlobalVars');
            await upsertGlobalVariable(comp.props.targetVariable, vDef.type || 'TEXT', value);
          }
        }

        fireWidgetTriggers(comp, 'ON_CHANGE');
      } else {
        alert("Could not detect any numbers. Please try again with better alignment.");
      }
    } catch (err) {
      console.error("OCR failed:", err);
      alert("Vision processing error. Please try manual entry.");
    } finally {
      setOcrProcessing(prev => ({ ...prev, [comp.id]: false }));
    }
  };

  const ensureDrawCanvas = (key) => {
    const canvas = drawCanvasRefs.current[key];
    if (!canvas) return null;
    let ctx = drawCtxRefs.current[key];
    if (!ctx) {
      ctx = canvas.getContext('2d');
      drawCtxRefs.current[key] = ctx;
    }
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    return { canvas, ctx };
  };

  const startDrawing = (key, evt) => {
    evt.preventDefault();
    const refs = ensureDrawCanvas(key);
    if (!refs) return;
    const { canvas, ctx } = refs;
    const { x, y } = getCanvasPoint(canvas, evt);
    drawActiveRefs.current[key] = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const moveDrawing = (key, evt) => {
    if (!drawActiveRefs.current[key]) return;
    evt.preventDefault();
    const refs = ensureDrawCanvas(key);
    if (!refs) return;
    const { canvas, ctx } = refs;
    const { x, y } = getCanvasPoint(canvas, evt);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = (key, comp) => {
    if (!drawActiveRefs.current[key]) return;
    drawActiveRefs.current[key] = false;
    const canvas = drawCanvasRefs.current[key];
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setDrawValues(prev => ({ ...prev, [key]: dataUrl }));
    syncVariableForComp(comp, dataUrl);
    setIsDrawing(prev => ({ ...prev, [key]: false }));
    fireWidgetTriggers(comp, 'ON_CHANGE');
  };

  const clearDrawing = (key, comp) => {
    const refs = ensureDrawCanvas(key);
    if (!refs) return;
    const { canvas, ctx } = refs;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawValues(prev => ({ ...prev, [key]: '' }));
    fireWidgetTriggers(comp, 'ON_CHANGE');
  };

  useEffect(() => {
    // Real-time Global Variable Sync
    const channel = subscribeToGlobalVariables((payload) => {
      const { new: newVar } = payload;
      if (newVar && newVar.name) {
        setAppVariables(prev => prev.map(v => {
          if (v.name === newVar.name && v.isPersistent) {
            return { ...v, value: newVar.value?.val ?? newVar.value };
          }
          return v;
        }));
      }
    });

    return () => {
      Object.keys(cameraScannerIntervals.current).forEach((id) => stopCameraScanner(id));
      if (channel) channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedApp || !selectedApp.config?.iotConfig) return;

    const { brokerUrl, topics = [] } = selectedApp.config.iotConfig;
    console.log(`LiveTerminal: Connecting to IoT Broker: ${brokerUrl}`);

    // Connect to broker
    iotConnector.connect(brokerUrl);

    // Subscribe to all configured topics
    topics.forEach(t => {
      iotConnector.subscribe(t.topic, (payload) => {
        setMachineData(prev => ({
          ...prev,
          [t.id]: payload, // Store by topic ID for direct binding
          [t.topic]: payload // Also store by topic path for legacy MACHINE_STATUS
        }));
      });
    });

    return () => {
      // Unsubscribe on cleanup
      topics.forEach(t => iotConnector.unsubscribe(t.topic));
    };
  }, [selectedApp]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e || typeof e.key !== 'string') return;
      const now = Date.now();
      if (typeof barcodeBuffer.current !== 'string') {
        barcodeBuffer.current = '';
      }
      // Most scanners send characters rapidly (< 50ms apart)
      if (now - lastKeyTime.current > 50) {
        barcodeBuffer.current = '';
      }
      lastKeyTime.current = now;

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 3) {
          handleBarcodeScan(barcodeBuffer.current);
        }
        barcodeBuffer.current = '';
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [manuals, selectedManual]);

  // Handle Visibility Evaluation (Tulip-style)
  useEffect(() => {
    const evalVisibility = async () => {
      const activeSteps = selectedApp ? (selectedApp.config?.steps || []) : [];
      const currentStep = activeSteps[currentStepIndex];
      const baseComps = selectedApp?.config?.baseComponents || [];
      const stepComps = currentStep?.components || [];
      const comps = [...baseComps, ...stepComps];
      const newMap = {};

      for (const comp of comps) {
        if (comp.props?.visibilityCondition?.enabled) {
          try {
            newMap[comp.id] = await evaluateCondition(comp.props.visibilityCondition);
          } catch (err) {
            console.error(`Visibility evaluation failed for ${comp.id}:`, err);
            newMap[comp.id] = true;
          }
        } else {
          newMap[comp.id] = true;
        }
      }
      setVisibilityMap(newMap);
    };

    evalVisibility();
  }, [selectedApp, currentStepIndex, appVariables, recordPlaceholderData]);

  useEffect(() => {
    if (!selectedApp || status !== 'RUNNING') return;

    // 1. Fire ON_STEP_EXIT for PREVIOUS step index
    if (lastStepIndexRef.current !== -1 && lastStepIndexRef.current !== currentStepIndex) {
      executeBlocklyLogic('ON_STEP_EXIT', {}, lastStepIndexRef.current);
    }

    // 2. Fire ON_STEP_ENTER / ON_STEP_INITIALIZE for CURRENT step
    executeBlocklyLogic('ON_STEP_ENTER');
    executeBlocklyLogic('ON_STEP_INITIALIZE'); // Aliased for MIT parity

    // 3. Update Ref
    lastStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex, selectedApp?.id]);

  const fireDeviceInputTriggers = async (deviceId, deviceEvent, payload = {}) => {
    if (selectedApp) {
      const activeSteps = selectedApp.config?.steps || [];
      const currentStep = activeSteps[currentStepIndex];
      const deviceTriggers = (selectedApp.config?.appTriggers || [])
        .concat(currentStep?.triggers || [])
        .filter(t => t.event === 'ON_DEVICE_INPUT' && t.deviceId === deviceId && t.deviceEvent === deviceEvent);

      if (deviceTriggers.length > 0) {
        for (const trig of deviceTriggers) {
          await executeTrigger(trig, payload);
        }
      }
    }
  };

  const handleBarcodeScan = async (code) => {
    console.log('Barcode Scanned:', code);

    // 1. If we're on the selection screen, try to find a matching SOP or App
    if (!selectedManual && !selectedApp) {
      const matchSop = manuals.find(m => m.documentNumber === code || m.id === code);
      if (matchSop) {
        handleStartCycle(matchSop.id);
        return;
      }
      const matchApp = frontlineApps.find(a => a.id === code || a.name === code);
      if (matchApp) {
        handleStartApp(matchApp);
      }
      return;
    }

    // 2. If an App is running, fire ON_DEVICE_INPUT triggers for barcode scanner
    await fireDeviceInputTriggers('STATION_BARCODE', 'BARCODE_SCANNED', { value: code });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [manualData, appData, queueData, stationData, interfaceData] = await Promise.all([
          listManualSummaries(),
          getAllFrontlineApps(),
          getProductionQueue(),
          getStations(),
          getInterfaces()
        ]);

        setStations(stationData || []);
        setInterfaces(interfaceData || []);

        setManuals(manualData || []);

        // --- UNIVERSAL DEEP SEARCH LOGIC ---
        let combinedApps = appData || [];
        try {
          // Check all known keys
          const keys = ['mavi_offline_vault', 'offline_apps_cache', 'draft_frontline_apps'];
          keys.forEach(key => {
            const raw = localStorage.getItem(key);
            if (raw) {
              const local = JSON.parse(raw);
              if (Array.isArray(local)) {
                local.forEach(la => {
                  if (!combinedApps.find(a => String(a.id) === String(la.id))) {
                    combinedApps.push(la);
                  }
                });
              }
            }
          });
        } catch (e) { console.error("Universal search failed", e); }

        // Filter for published apps, but fallback to all discovered apps
        let visibleApps = combinedApps.filter(a => a.is_published);
        if (visibleApps.length === 0 && combinedApps.length > 0) {
          visibleApps = combinedApps;
        }

        // --- ENFORCE STATION-BASED ACCESS CONTROL ---
        const user = getCurrentUser();
        const allUsers = getAllUsers();
        // Get fresh user data to ensure latest assignments are respected without re-login
        // We use ID first, then fallback to Name/Username match for robustness
        const freshUser = allUsers.find(u => u.id === user?.id) ||
          allUsers.find(u => u.username === user?.username) ||
          allUsers.find(u => u.name === user?.name) ||
          user;

        let filteredApps = appId ? combinedApps : visibleApps;

        if (freshUser && freshUser.role === 'OPERATOR') {
          // 1. Filter Apps: If specific app assigned, search in ALL apps (including drafts)
          if (freshUser.assignedApp && freshUser.assignedApp !== 'ALL' && freshUser.assignedApp !== 'NONE') {
            let assigned = combinedApps.find(a => String(a.id) === String(freshUser.assignedApp));
            // Fallback to name search if ID doesn't match
            if (!assigned) {
              assigned = combinedApps.find(a => a.name === freshUser.assignedApp);
            }
            filteredApps = assigned ? [assigned] : [];
          }

          // 2. Sync Station Context: Resolve name if ID is assigned
          if (freshUser.assignedStation && freshUser.assignedStation !== 'ALL' && freshUser.assignedStation !== 'NONE') {
            // Try to find station name from metadata
            const stationMatch = (stationData || []).find(s => String(s.id) === String(freshUser.assignedStation));
            const stationName = stationMatch ? stationMatch.name : freshUser.assignedStation;
            setAppContext(prev => ({ ...prev, station: stationName }));
          }
        }

        setFrontlineApps(filteredApps);

        // Auto-load match with Smart Matching
        if (appId && combinedApps.length > 0) {
          let match = combinedApps.find(a => String(a.id) === String(appId));
          if (!match) {
            // Try Name fallback if ID didn't work
            const searchName = String(appId).toLowerCase();
            match = combinedApps.find(a => String(a.name || '').toLowerCase() === searchName);
          }

          // Only auto-load if it's in the filtered list (or user is admin/engineer)
          const isAllowed = freshUser?.role !== 'OPERATOR' || !freshUser?.assignedApp || freshUser.assignedApp === 'ALL' || String(match?.id) === String(freshUser.assignedApp);

          if (match && isAllowed) {
            await handleStartApp(match);
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [appId]); // Added stations dependency to ensure station name resolves once metadata is loaded





  const handleStartCycle = async (manualId) => {
    setLoading(true);
    try {
      const fullManual = await getManualById(manualId);
      setSelectedManual(fullManual);
      setSelectedApp(null);
      setStatus('RUNNING');
      setTimer(0);
      setCurrentStepIndex(0);
      setCycleData([]);
      setQualityData({});
      setQuantityLog({});
      
      // Initialize variables and placeholders for Manuals if they exist
      const config = fullManual.content || {};
      const resolvedVariables = (config.appVariables || []).map(v => ({ ...v, value: v.defaultValue }));
      setAppVariables(resolvedVariables);
      setAppFunctions(config.appFunctions || []);
      setRecordPlaceholders(config.recordPlaceholders || []);
      setRecordPlaceholderData({});
      setBoundData({});
      
      resetInputs();



      logEvent({
        type: AUDIT_EVENTS.CYCLE_START,
        workstation: 'WS-01',
        workOrder: currentWorkOrder,
        details: { id: manualId, type: 'SOP', title: fullManual.title }
      });

      startTimer();
    } catch (err) {
      console.error('Failed to start cycle:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartApp = async (app) => {
    // Track Recent Apps
    const newRecent = [app.id, ...recentApps.filter(id => id !== app.id)].slice(0, 8);
    setRecentApps(newRecent);
    localStorage.setItem('mavi_terminal_recent', JSON.stringify(newRecent));

    // Fetch the latest config from database in real-time
    let latestApp = app;
    try {
      const dbApp = await getFrontlineAppById(app.id);
      if (dbApp) {
        latestApp = dbApp;
      }
    } catch (e) {
      console.warn("Failed to fetch latest app config from database, using cached app list config:", e);
    }

    // Enterprise Governance: Use published_config if published and NOT in dev mode, else draft config
    const isDev = devMode || launchParams.get('devMode') === 'true' || launchParams.get('dev') === 'true';
    const effectiveConfig = (latestApp.is_published && !isDev) ? (latestApp.published_config || latestApp.config) : latestApp.config;
    const normalizedApp = { 
      ...latestApp, 
      config: effectiveConfig,
      is_published: isDev ? false : latestApp.is_published
    };

    setGlobalLogic(effectiveConfig.globalLogic || null);
    setSelectedApp(normalizedApp);
    setSelectedManual(null);
    setStatus('RUNNING');
    setTimer(0);
    setCurrentStepIndex(0);

    // Fire Global/App Start logic (Legacy Actions)
    if (effectiveConfig.appTriggers) {
      const startTriggers = effectiveConfig.appTriggers.filter(t => t.event === 'ON_APP_START');
      for (const trig of startTriggers) {
        await executeTrigger(trig);
      }
    }

    // Fire Global/App Start logic (Blockly)
    // Note: We use a small timeout to ensure state (selectedApp, globalLogic) is committed if needed,
    // though executeBlocklyLogic should be able to handle normalizedApp directly if we pass it.
    setTimeout(() => {
      executeBlocklyLogic('ON_APP_START');
    }, 50);
    resetInputs();
    setDefectLog([]);

    setAppContext(prev => ({
      ...prev,
      user: launchOperator || prev.user || 'Operator',
      station: launchStation || prev.station || 'WS-01'
    }));
    const resolvedVariables = (normalizedApp.config?.appVariables || []).map(v => {
      let val = v.defaultValue;
      if (typeof val === 'string' && val.startsWith('@APP_INFO.')) {
        if (val === '@APP_INFO.USER') val = launchOperator || appContext.user || 'Operator';
        else if (val === '@APP_INFO.STATION') val = launchStation || appContext.station || 'WS-01';
        else if (val === '@APP_INFO.APP_NAME') val = normalizedApp.name || '';
      }
      const nameUpper = (v.name || '').toUpperCase();
      if (currentWorkOrder && (nameUpper === 'WORK_ORDER_ID' || nameUpper === 'SELECTED_WO_ID' || nameUpper === 'WORKORDER' || nameUpper === 'WORK_ORDER' || nameUpper === 'WO_ID')) {
        val = currentWorkOrder;
      }
      return { ...v, value: val };
    });
    setAppVariables(resolvedVariables);
    setAppFunctions(normalizedApp.config?.appFunctions || []);
    setRecordPlaceholders(normalizedApp.config?.recordPlaceholders || []);
    setRecordPlaceholderData({});

    // Load Global Variables
    const persistentVars = (normalizedApp.config?.appVariables || []).filter(v => v.isPersistent);
    if (persistentVars.length > 0) {
      listGlobalVariables().then(globals => {
        setAppVariables(prev => prev.map(v => {
          if (!v.isPersistent) return v;
          const remote = globals.find(g => g.name === v.name);
          return remote ? { ...v, value: remote.value?.val ?? remote.value } : v;
        }));
      });
    }

    setBoundData({});
    Object.keys(cameraScannerStreams.current).forEach((id) => stopCameraScanner(id));
    startTimer();

    // IoT Integration
    const appSteps = normalizedApp.config?.steps || [];
    const firstStepComponents = appSteps[0]?.components || [];
    const machineComponents = firstStepComponents.filter(c => c.type === 'MACHINE_STATUS') || [];

    machineComponents.forEach(comp => {
      if (comp.props?.topic) {
        iotConnector.connect();
        iotConnector.subscribe(comp.props.topic, (val) => {
          setMachineData(prev => ({ ...prev, [comp.props.topic]: val }));
        });
      }
    });

    // Fire ON_APP_START triggers (Tulip-style Actions & Blockly)
    if (app.config?.appTriggers) {
      const startTriggers = app.config.appTriggers.filter(t => t.event === 'ON_APP_START');
      for (const trig of startTriggers) {
        await executeTrigger(trig);
      }
    }
    executeBlocklyLogic('ON_APP_START');

    // Fire ON_STEP_ENTER for the first step
    const firstStep = appSteps[0];
    if (firstStep) {
      if (firstStep.triggers) {
        const enterTriggers = firstStep.triggers.filter(t => t.event === 'ON_STEP_ENTER');
        for (const trig of enterTriggers) {
          await executeTrigger(trig);
        }
      }
    }

    logEvent({
      type: AUDIT_EVENTS.CYCLE_START,
      workstation: 'WS-01',
      workOrder: currentWorkOrder,
      details: { id: app.id, type: 'APP', name: app.name }
    });
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resolveSourceValue = async (source, value, defaultVal = '', eventPayload = null) => {
    let rawValue = value;

    // Resolve Mustache-style placeholders in strings first
    if (typeof rawValue === 'string' && rawValue.includes('{{')) {
      if (rawValue.startsWith('{{') && rawValue.endsWith('}}') && !rawValue.slice(2, -2).includes('{{')) {
        const innerExpr = rawValue.slice(2, -2).trim();
        try {
          return evaluateExpression(innerExpr, eventPayload || {});
        } catch (e) {
          console.warn('[resolveSourceValue] Failed to evaluate expression:', innerExpr, e);
        }
      }

      rawValue = rawValue.replace(/\{\{EVENT\.PAYLOAD\}\}/g, eventPayload || '');
      rawValue = rawValue.replace(/\{\{EVENT\.VALUE\}\}/g, eventPayload || '');

      // Resolve app info: {{APP_INFO.USER}}, etc.
      rawValue = rawValue.replace(/\{\{APP_INFO\.([a-zA-Z0-9_.]+)\}\}/g, (match, infoKey) => {
        if (infoKey === 'USER') return appContext.user || '';
        if (infoKey === 'STATION') return appContext.station || '';
        return 'undefined';
      });

      // Resolve variables and fields: {{VARIABLE.VarName}}, {{@VarName}}, or [Placeholder.Field]
      const templateRegex = /\{\{([^}]+)\}\}/g;
      rawValue = rawValue.replace(templateRegex, (match, expression) => {
        const cleanExpr = expression.trim();
        try {
          // If it starts with @, evaluate expression directly; otherwise evaluate with @ prefix
          const exprToEval = cleanExpr.startsWith('@') || cleanExpr.startsWith('[') ? cleanExpr : '@' + cleanExpr;
          const resolved = evaluateExpression(exprToEval, eventPayload || {});
          return resolved !== undefined && resolved !== null ? String(resolved) : '';
        } catch {
          // Fallback to simple variable lookup
          const cleanName = cleanExpr.startsWith('@') ? cleanExpr.substring(1) : cleanExpr;
          const v = appVariables.find(av => av.name === cleanName || av.id === cleanName);
          return v ? String(v.value ?? '') : match;
        }
      });
    }

    if (!source || source === 'STATIC') return rawValue;
    if (source === 'EVENT_VALUE') return eventPayload || rawValue;
    if (source === 'VARIABLE') {
      if (!rawValue) return defaultVal;
      if (typeof rawValue === 'string' && rawValue.startsWith('APP_INFO.')) {
        if (rawValue === 'APP_INFO.USER') return appContext.user;
        if (rawValue === 'APP_INFO.STATION') return appContext.station;
        if (rawValue === 'APP_INFO.STEP_NAME') return (selectedApp?.config?.steps || [])[currentStepIndex]?.title || '';
        if (rawValue === 'APP_INFO.APP_NAME') return selectedApp?.name || '';
      }
      const v = appVariables.find(av => av.name === rawValue || av.id === rawValue);
      return v ? v.value : defaultVal;
    }
    if (source === 'APP_INFO') {
      if (rawValue === 'APP_INFO.USER') return appContext.user;
      if (rawValue === 'APP_INFO.STATION') return appContext.station;
      if (rawValue === 'APP_INFO.STEP_NAME') return (selectedApp?.config?.steps || [])[currentStepIndex]?.title || '';
      if (rawValue === 'APP_INFO.APP_NAME') return selectedApp?.name || '';
      return defaultVal;
    }
    if (source === 'RECORD_FIELD') {
      const parts = String(rawValue).split('.');
      if (parts.length >= 2) {
        const pName = parts[0];
        const fieldPath = parts.slice(1);
        const placeholder = recordPlaceholders.find(rp => rp.name === pName);
        const data = placeholder ? recordPlaceholderData[placeholder.id] : null;

        if (!data) return defaultVal;

        // Deep traversal support
        let current = data;
        for (const part of fieldPath) {
          if (current && typeof current === 'object') {
            current = current[part];
          } else {
            return defaultVal;
          }
        }
        return current ?? defaultVal;
      }
    }
    if (source === 'TABLE_AGGREGATION') {
      const [tableId, aggId] = String(rawValue).split(':');
      if (!tableId || !aggId) return defaultVal;
      try {
        const { getTableById, getTableRecords } = await import('../utils/database');
        const table = await getTableById(tableId);
        const aggDef = table?.aggregations?.find(a => a.id === aggId);
        if (!aggDef) return defaultVal;

        const records = await getTableRecords(tableId);
        const values = records.map(r => Number(r[aggDef.field])).filter(n => !isNaN(n));

        if (aggDef.calculation === 'count') return records.length;
        if (values.length === 0) return 0;

        switch (aggDef.calculation) {
          case 'sum': return values.reduce((s, v) => s + v, 0);
          case 'avg': return (values.reduce((s, v) => s + v, 0) / values.length).toFixed(2);
          case 'min': return Math.min(...values);
          case 'max': return Math.max(...values);
          default: return 0;
        }
      } catch (err) {
        console.error("Aggregation resolution failed:", err);
        return defaultVal;
      }
    }
    if (source === 'EXPRESSION') return evaluateExpression(rawValue, eventPayload || {});
    return rawValue || defaultVal;
  };

  const evaluateCondition = async (cond, eventPayload = null) => {
    if (!cond) return true;

    // Support new multi-source structure
    const leftSource = cond.leftSource || 'VARIABLE';
    const leftValue = cond.leftValue || cond.variable;
    const rightSource = cond.rightSource || 'STATIC';
    const rightValue = cond.rightValue || cond.value;
    const operator = cond.operator || '==';

    const actualValue = await resolveSourceValue(leftSource, leftValue, '', eventPayload);
    const targetValue = await resolveSourceValue(rightSource, rightValue, '', eventPayload);

    switch (operator) {
      case '==': return String(actualValue) === String(targetValue);
      case '!=': return String(actualValue) !== String(targetValue);
      case '>': return Number(actualValue) > Number(targetValue);
      case '<': return Number(actualValue) < Number(targetValue);
      case '>=': return Number(actualValue) >= Number(targetValue);
      case '<=': return Number(actualValue) <= Number(targetValue);
      case 'CONTAINS': return String(actualValue).includes(String(targetValue));
      case 'IS_EMPTY': return !actualValue || String(actualValue).trim() === '';
      case 'IS_NOT_EMPTY': return actualValue && String(actualValue).trim() !== '';
      default: return true;
    }
  };

  const safeRender = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      if (React.isValidElement(val)) return val;
      try {
        // If it's a special object with a value property (like what evaluation might return)
        if (val.value !== undefined && Object.keys(val).length <= 2) return String(val.value);
        return JSON.stringify(val);
      } catch (e) {
        return '[Object]';
      }
    }
    return val;
  };

  const isTemplatePlaceholder = (val) => typeof val === 'string' && /\{\{[^}]+\}\}/.test(val);
  const sanitizeNumberInputValue = (val, fallback = 0) => {
    if (isTemplatePlaceholder(val) || val === '' || val === null || val === undefined) return fallback;
    const parsed = Number(val);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const sanitizeDateInputValue = (val) => {
    if (!val || isTemplatePlaceholder(val)) return '';
    const str = String(val).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : '';
  };
  const sanitizeDateTimeInputValue = (val) => {
    if (!val || isTemplatePlaceholder(val)) return '';
    const str = String(val).trim();
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) ? str : '';
  };

  const evaluateExpression = (expr, customContext = {}) => {

    if (!expr || typeof expr !== 'string') return expr;
    let processed = expr;

    // 0. Support [Placeholder.Field] syntax (Tulip-style)
    processed = processed.replace(/\[([a-zA-Z0-9_.]+)]/g, (match, path) => {
      const parts = path.split('.');
      if (parts.length >= 2) {
        const pName = parts[0];
        const fName = parts.slice(1).join('.');
        const placeholder = recordPlaceholders.find(rp => rp.name === pName || rp.id === pName);
        if (placeholder) {
          const data = recordPlaceholderData[placeholder.id];
          if (!data) return '""';
          const val = data[fName] ?? (fName === 'recordId' ? data.recordId : '');
          if (val === undefined || val === null) return '""';
          if (typeof val === 'number') return val;
          if (val === 'true' || val === true) return true;
          if (val === 'false' || val === false) return false;
          if (typeof val === 'string' && val !== '' && !isNaN(Number(val))) return Number(val);
          return typeof val === 'string' ? `"${val}"` : val;
        }
      }
      return match;
    });

    // 1. Resolve Variables (@VariableName)
    const varRegex = /@([a-zA-Z0-9_.]+)/g;
    processed = processed.replace(varRegex, (match, name) => {
      if (customContext.hasOwnProperty(name)) {
        return typeof customContext[name] === 'string' ? `"${customContext[name]}"` : customContext[name];
      }
      if (name.startsWith('APP_INFO.')) {
        if (name === 'APP_INFO.USER') return `"${appContext.user}"`;
        if (name === 'APP_INFO.STATION') return `"${appContext.station}"`;
        if (name === 'APP_INFO.STEP_NAME') return `"${(selectedApp?.config?.steps || [])[currentStepIndex]?.title || ''}"`;
        if (name === 'APP_INFO.APP_NAME') return `"${selectedApp?.name || ''}"`;
      }
      if (name.startsWith('Record.')) {
        const parts = name.split('.');
        if (parts.length >= 3) {
          const pName = parts[1];
          const fName = parts.slice(2).join('.');
          const placeholder = recordPlaceholders.find(rp => rp.name === pName);
          if (placeholder) {
            const data = recordPlaceholderData[placeholder.id];
            const val = data ? data[fName] : '';
            if (typeof val === 'number') return val;
            if (val === 'true' || val === true) return true;
            if (val === 'false' || val === false) return false;
            if (typeof val === 'string' && val !== '' && !isNaN(Number(val))) return Number(val);
            return typeof val === 'string' ? `"${val}"` : val;
          }
        }
        return 'undefined';
      }
      const v = appVariables.find(av => av.name === name);
      if (v) {
        if (typeof v.value === 'number') return v.value;
        if (v.value === 'true' || v.value === true) return true;
        if (v.value === 'false' || v.value === false) return false;
        if (typeof v.value === 'string' && v.value !== '' && !isNaN(Number(v.value))) return Number(v.value);
        return typeof v.value === 'string' ? `"${v.value}"` : v.value;
      }
      // Support @PlaceholderName.FieldName (record placeholder dot notation)
      if (name.includes('.')) {
        const [pName, ...fPath] = name.split('.');
        const placeholder = recordPlaceholders.find(rp => rp.name === pName || rp.id === pName);
        if (placeholder) {
          const data = recordPlaceholderData[placeholder.id];
          if (data) {
            let current = data;
            for (const part of fPath) {
              if (current && typeof current === 'object') {
                let next = current[part];
                if (next === undefined) {
                  const key = Object.keys(current).find(k => k.toLowerCase() === part.toLowerCase());
                  if (key) next = current[key];
                }
                current = next;
              } else {
                current = undefined;
                break;
              }
            }
            if (current !== undefined && current !== null) {
              if (typeof current === 'number') return current;
              if (current === 'true' || current === true) return true;
              if (current === 'false' || current === false) return false;
              if (typeof current === 'string' && current !== '' && !isNaN(Number(current))) return Number(current);
              return typeof current === 'string' ? `"${current}"` : current;
            }
          }
          return 0; // Placeholder exists but no data or field not found - return 0 for arithmetic safety
        }
      }
      return 'undefined'; // Safe fallback to prevent SyntaxError in new Function
    });

    // 2. Handle Functions (Recursive Replacement for Nesting)
    try {
      const fnProcessed = processed
        // Math Functions
        .replace(/NOW\(\)/g, () => `"${new Date().toISOString()}"`)
        .replace(/DATE\(\)/g, () => `"${new Date().toLocaleDateString()}"`)
        .replace(/SUM\((.*?)\)/g, (m, args) => `([${args}].reduce((a,b)=>Number(a)+Number(b),0))`)
        .replace(/ABS\((.*?)\)/g, (m, arg) => `Math.abs(${arg})`)
        .replace(/ROUND\((.*?)\)/g, (m, arg) => `Math.round(${arg})`)
        .replace(/COUNT\((.*?)\)/g, (m, args) => `([${args}].length)`)

        // String Functions
        .replace(/CONCAT\((.*?)\)/g, (m, args) => `([${args}].join(""))`)
        .replace(/UPPER\((.*?)\)/g, (m, arg) => `String(${arg}).toUpperCase()`)
        .replace(/LOWER\((.*?)\)/g, (m, arg) => `String(${arg}).toLowerCase()`)
        .replace(/LEN\((.*?)\)/g, (m, arg) => `String(${arg}).length`)
        .replace(/SUBSTR\((.*?,.*?,.*?)\)/g, (m, args) => {
          const [s, start, len] = args.split(',').map(x => x.trim());
          return `String(${s}).substr(${start}, ${len})`;
        })

        // Date & Time Functions
        .replace(/NOW\(\)/g, () => `new Date().toISOString()`)
        .replace(/ADD_TIME\((.*?,.*?)\)/g, (m, args) => {
          const [date, interval] = args.split(',').map(x => x.trim());
          return `(new Date(new Date(${date}).getTime() + (Number(${interval}) * 1000)).toISOString())`;
        })

        // Logical
        .replace(/IF\((.*?,.*?,.*?)\)/g, (m, args) => {
          const parts = args.split(',');
          return `((${parts[0]}) ? (${parts[1]}) : (${parts[2]}))`;
        });

      return new Function(`return ${fnProcessed}`)();
    } catch (err) {
      console.error("Expression evaluation error:", err, expr);
      return expr;
    }
  };

  const resolveValue = (val, type = 'STATIC') => {
    if (type === 'EXPRESSION') return evaluateExpression(val);
    if (typeof val !== 'string') return val;
    if (val.startsWith('@')) {
      const varName = val.substring(1);
      if (varName.startsWith('APP_INFO.')) {
        if (varName === 'APP_INFO.USER') return appContext.user;
        if (varName === 'APP_INFO.STATION') return appContext.station;
        if (varName === 'APP_INFO.STEP_NAME') return (selectedApp?.config?.steps || [])[currentStepIndex]?.title || '';
        if (varName === 'APP_INFO.APP_NAME') return selectedApp?.name || '';
      }
      if (varName.startsWith('Record.')) {
        const parts = varName.split('.');
        if (parts.length >= 3) {
          const pName = parts[1];
          const fName = parts.slice(2).join('.');
          const placeholder = recordPlaceholders.find(rp => rp.name === pName);
          if (placeholder) {
            const data = recordPlaceholderData[placeholder.id];
            if (data) {
              let res;
              if (fName.toLowerCase() === 'id' || fName.toLowerCase() === 'recordid') {
                res = data.recordId || data.ID || data.id;
              } else {
                res = data[fName];
                if (res === undefined) {
                  const key = Object.keys(data).find(k => k.toLowerCase() === fName.toLowerCase());
                  if (key) res = data[key];
                }
              }
              return res ?? '';
            }
            return ''; // Placeholder exists but no record selected
          }
        }
      }
      // Support @PlaceholderName.FieldName (Simplified syntax)
      if (varName.includes('.')) {
        const [pName, ...fPath] = varName.split('.');
        const placeholder = recordPlaceholders.find(rp => rp.name === pName || rp.id === pName);
        if (placeholder) {
          const data = recordPlaceholderData[placeholder.id];
          if (data) {
            let current = data;
            for (let i = 0; i < fPath.length; i++) {
              const part = fPath[i];
              if (current && typeof current === 'object') {
                let next;
                if (i === 0 && (part.toLowerCase() === 'id' || part.toLowerCase() === 'recordid')) {
                  next = current.recordId || current.ID || current.id;
                } else {
                  next = current[part];
                  if (next === undefined) {
                    const key = Object.keys(current).find(k => k.toLowerCase() === part.toLowerCase());
                    if (key) next = current[key];
                  }
                }
                current = next;
              } else {
                current = undefined;
                break;
              }
            }
            return current ?? '';
          }
          return ''; // Placeholder exists but no record selected
        }
      }
      const v = appVariables.find(av => av.name === varName);
      if (v) return v.value;
      if (val.startsWith('@') && val.includes('.')) return '';
      return val;
    }
    return val;
  };

  const getAggregatedChartData = (rawData, xAxisProp, yAxisProp, filterStr) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return [];

    // 1. Filter the data based on filterStr (e.g. "Status = 'DOWN'" or "Status = 'RUNNING'")
    let filteredData = rawData;
    if (filterStr) {
      const match = filterStr.match(/^\s*(\w+)\s*=\s*['"]?([^'"]+)['"]?\s*$/);
      if (match) {
        const fieldName = match[1];
        const targetValue = match[2];
        filteredData = rawData.filter(row => {
          const actualVal = row.data?.[fieldName] !== undefined ? row.data[fieldName] : row[fieldName];
          return String(actualVal || '') === String(targetValue || '');
        });
      }
    }

    // 2. Group and aggregate based on yAxisProp
    const isSum = yAxisProp && yAxisProp.toLowerCase().startsWith('sum(');
    const isAvg = yAxisProp && yAxisProp.toLowerCase().startsWith('avg(');
    let aggField = null;
    if (isSum || isAvg) {
      const match = yAxisProp.match(/\(([^)]+)\)/);
      if (match) aggField = match[1];
    }

    const grouped = filteredData.reduce((acc, row) => {
      const xVal = row.data?.[xAxisProp] !== undefined ? row.data[xAxisProp] : row[xAxisProp];
      const key = String(xVal || 'N/A');
      
      if (!acc[key]) {
        acc[key] = { key, count: 0, sum: 0, values: [] };
      }
      
      acc[key].count += 1;
      if (aggField) {
        const val = Number(row.data?.[aggField] !== undefined ? row.data[aggField] : row[aggField]) || 0;
        acc[key].sum += val;
        acc[key].values.push(val);
      }
      return acc;
    }, {});

    // 3. Map to final data points
    return Object.values(grouped).map(group => {
      let finalValue = group.count;
      if (isSum) {
        finalValue = group.sum;
      } else if (isAvg) {
        finalValue = group.values.length > 0 ? (group.sum / group.values.length) : 0;
      }
      return {
        name: group.key,
        value: Number(Number(finalValue).toFixed(2))
      };
    });
  };

  const getParetoData = (rawData, categoryCol, valueCol) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return [];

    // Group and sum
    const grouped = rawData.reduce((acc, row) => {
      const cat = row.data?.[categoryCol] || 'Other';
      const val = Number(row.data?.[valueCol]) || 0;
      acc[cat] = (acc[cat] || 0) + val;
      return acc;
    }, {});

    // Convert to array and sort descending
    const sorted = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Calculate cumulative
    const total = sorted.reduce((acc, item) => acc + item.value, 0);
    let cumulative = 0;

    return sorted.map(item => {
      cumulative += item.value;
      return {
        ...item,
        cumulativePercent: total > 0 ? Math.round((cumulative / total) * 100) : 0
      };
    });
  };


  const fetchChartData = useCallback(async (app) => {
    if (!app?.config) return;
    const steps = app.config.steps || [];
    const currentStep = steps[currentStepIndex];
    const baseComps = app.config.baseComponents || [];

    const chartTypes = ['CHART', 'PARETO_CHART', 'CONTROL_CHART', 'DASHBOARD_PARETO', 'DASHBOARD_CHART_BAR', 'DASHBOARD_CHART_LINE', 'DASHBOARD_METRIC', 'BAR_CHART', 'DONUT_CHART'];
    const chartComps = [
      ...(currentStep?.components || []),
      ...baseComps
    ].filter(c => chartTypes.includes(c.type));
    
    if (chartComps.length === 0) return;


    const results = {};
    for (const comp of chartComps) {
      const { tableId, aggregationId } = comp.props;
      if (!tableId) continue;

      try {
        if (aggregationId) {
          // Dashboard Aggregation Logic
          const table = await getTableById(tableId);
          const aggDef = table?.aggregations?.find(a => a.id === aggregationId);
          if (aggDef) {
            const records = await getTableRecords(tableId);
            const values = records.map(r => Number(r[aggDef.field])).filter(n => !isNaN(n));
            let result = 0;

            if (aggDef.calculation === 'count') {
              result = records.length;
            } else if (values.length > 0) {
              switch (aggDef.calculation) {
                case 'sum': result = values.reduce((s, v) => s + v, 0); break;
                case 'avg': result = (values.reduce((s, v) => s + v, 0) / values.length).toFixed(2); break;
                case 'min': result = Math.min(...values); break;
                case 'max': result = Math.max(...values); break;
                default: result = 0;
              }
            }
            results[comp.id] = [{ [aggDef.name]: result, value: result }];
          } else {
            results[comp.id] = await getTableRecords(tableId);
          }
        } else {
          const data = await getTableRecords(tableId);
          // Sort for time-series if it's a standard chart or dashboard line
          if (comp.type === 'CHART' || comp.type === 'DASHBOARD_CHART_LINE') {
            results[comp.id] = data.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
          } else {
            results[comp.id] = data;
          }
        }
      } catch (err) {
        console.error(`Failed to fetch chart data for ${comp.id}:`, err);
      }
    }
    setChartData(prev => ({ ...prev, ...results }));
  }, [currentStepIndex, getTableRecords, getTableById]);

  const fetchBoundData = useCallback(async (app) => {
    if (!app?.config) return;
    const steps = app.config.steps || [];
    const currentStep = steps[currentStepIndex];
    const baseComps = app.config.baseComponents || [];

    const boundComps = [
      ...(currentStep?.components || []),
      ...baseComps
    ].filter(c => c.props?.dataSourceType === 'TABLE_RECORD');
    
    if (boundComps.length === 0) return;


    console.log(`Fetching data for ${boundComps.length} bound widgets...`);
    const results = {};

    for (const comp of boundComps) {
      const { bindingConfig } = comp.props;
      if (!bindingConfig?.tableId || !bindingConfig?.lookupColumn || !bindingConfig?.lookupValue || !bindingConfig?.resultColumn) continue;

      try {
        const { getTableRecords } = await import('../utils/database');
        const data = await getTableRecords(bindingConfig.tableId);
        const record = data.find(r => String(r[bindingConfig.lookupColumn]) === String(bindingConfig.lookupValue));
        if (record) {
          results[comp.id] = record[bindingConfig.resultColumn];
        }
      } catch (err) {
        console.error(`Failed to fetch binding for ${comp.id}:`, err);
      }
    }
    setBoundData(prev => ({ ...prev, ...results }));
  }, [currentStepIndex]);

  const fetchTableData = useCallback(async (app) => {
    if (!app?.config) return;
    const steps = app.config.steps || [];
    const currentStep = steps[currentStepIndex];
    const baseComps = app.config.baseComponents || [];
    
    const tableComps = [
      ...(currentStep?.components || []),
      ...baseComps
    ].filter(c => c.type === 'INTERACTIVE_TABLE' || c.type === 'ADVANCED_TABLE');
    
    if (tableComps.length === 0) return;

    const results = {};
    for (const comp of tableComps) {
      if (!comp.props.tableId) continue;
      try {
        let data = [];
        if (comp.props.queryId) {
          const { getTableById } = await import('../utils/supabaseTablesDB');
          const table = await getTableById(comp.props.tableId);
          const queryDef = table?.queries?.find(q => q.id === comp.props.queryId);

          if (queryDef) {
            data = await queryTableRecords(comp.props.tableId, {
              filters: queryDef.filters || [],
              sort: queryDef.sort || [],
              limit: queryDef.limit || 100,
              matchType: queryDef.matchType || 'all'
            });
          } else {
            const fetched = await getTableRecords(comp.props.tableId);
            data = fetched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          }
        } else {
          const fetched = await getTableRecords(comp.props.tableId);
          data = fetched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }

        results[comp.id] = data;

        // Apply Dynamic Variable Filters if defined
        if (comp.props.variableFilters && Array.isArray(comp.props.variableFilters)) {
          let filtered = [...data];
          for (const f of comp.props.variableFilters) {
            const vDef = appVariables.find(v => v.name === f.variableName || v.id === f.variableName);
            let searchVal = vDef?.value;
            if (searchVal && typeof searchVal === 'object') {
              searchVal = searchVal.value || searchVal.id || searchVal.recordId || JSON.stringify(searchVal);
            }
            searchVal = String(searchVal || '').trim().toLowerCase();

            if (searchVal && searchVal !== '[object object]') {
              filtered = filtered.filter(row => {
                // Search across all non-object values in the row for maximum reliability
                return Object.entries(row).some(([key, val]) => {
                  if (typeof val === 'object' || val === null) return false;
                  return String(val).toLowerCase().includes(searchVal);
                });
              });
            }
          }
          results[comp.id] = filtered;
        }
      } catch (err) {
        console.error(`Failed to fetch table data for ${comp.id}:`, err);
      }
    }
    setTableData(prev => ({ ...prev, ...results }));
    setAdvancedTableData(prev => ({ ...prev, ...results }));
  }, [currentStepIndex, getTableRecords, queryTableRecords, JSON.stringify(appVariables)]);

  useEffect(() => {
    if (selectedApp) {
      fetchBoundData(selectedApp);
      fetchChartData(selectedApp);
      fetchTableData(selectedApp);
    }
  }, [currentStepIndex, selectedApp, fetchBoundData, fetchChartData, fetchTableData]);

  // Notify parent App Player of step progress changes via postMessage
  useEffect(() => {
    if (!selectedApp) return;
    const steps = selectedApp.config?.steps || [];
    const stepTitle = steps[currentStepIndex]?.title || '';
    try {
      window.parent.postMessage({
        type: 'STEP_PROGRESS',
        stepIndex: currentStepIndex,
        totalSteps: steps.length,
        stepTitle
      }, '*');
    } catch {
      // Ignore cross-origin errors (when running standalone)
    }
  }, [currentStepIndex, selectedApp]);

  useEffect(() => {
    if (activeMedia?.duration > 0) {
      const timer = setTimeout(() => setActiveMedia(null), activeMedia.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [activeMedia]);

  // Handle barcode scanned from hardware
  // Handle trigger execution with local state for sequential actions
  const executeTrigger = async (trigger, eventPayload = null) => {
    if (!trigger || trigger.enabled === false) return;

    // Local context to track placeholder updates within a single trigger execution
    // This prevents race conditions between CREATE and SAVE actions
    const localPlaceholderContext = {};

    // Helper to run actions
    const runActions = async (actions) => {
      if (!actions || actions.length === 0) {
        console.log('[runActions] No actions to execute');
        return;
      }
      console.log(`[runActions] Executing ${actions.length} actions...`);
      for (const action of actions) {
        try {
          const act = action;
          const type = act.type;
          const payload = act.payload || act.detail || {};
          console.log(` -> Action: ${type}`, payload);

          if (type === 'SET_VARIABLE' || type === 'DATA_MANIPULATION') {
            const varPath = payload.varPath || payload.target || payload.variableName || payload.variable;
            const value = payload.value || payload.expression;
            const valueType = payload.valueType || payload.source || (payload.operation === 'SET' || payload.action === 'SET' ? 'STATIC' : 'STATIC');

            let finalValue = value;
            let finalType = valueType || 'STATIC';

            if (value && typeof value === 'object' && value.type) {
              finalType = value.type;
              finalValue = value.value || value.id || value.expression || '';
            }

            let resolvedValue = await resolveSourceValue(finalType, finalValue, '', eventPayload);

            // Safe inline evaluation if it's purely a math string (e.g. "0 + 1")
            if (typeof resolvedValue === 'string' && /^[0-9\s\+\-\*\/\.\(\)]+$/.test(resolvedValue) && /[0-9]/.test(resolvedValue)) {
              try {
                resolvedValue = new Function(`return ${resolvedValue}`)();
              } catch (e) { /* ignore */ }
            }

            if (varPath === 'APP_INFO.USER') setAppContext(prev => ({ ...prev, user: resolvedValue }));
            else if (varPath === 'APP_INFO.STATION') setAppContext(prev => ({ ...prev, station: resolvedValue }));
            else if (varPath === 'APP_INFO.WORK_ORDER') setAppContext(prev => ({ ...prev, workOrder: resolvedValue }));
            else {
              const vDef = appVariables.find(v => v.name === varPath || v.id === varPath);
              if (vDef) {
                setAppVariables(prev => prev.map(v => (v.name === varPath || v.id === varPath) ? { ...v, value: resolvedValue } : v));
                if (vDef.isPersistent) {
                  const { upsertGlobalVariable } = await import('../utils/supabaseGlobalVars');
                  await upsertGlobalVariable(vDef.name, vDef.type || 'TEXT', resolvedValue);
                }
              }
            }
          } else if (type === 'INCREMENT_VARIABLE' || type === 'DECREMENT_VARIABLE') {
            const varPath = payload.varPath || payload.variableName || payload.variable;
            const amount = payload.amount || 1;
            const vDef = appVariables.find(v => v.name === varPath || v.id === varPath);
            if (vDef) {
              const currentVal = Number(vDef.value) || 0;
              const amt = Number(amount) || 1;
              const nextVal = type === 'INCREMENT_VARIABLE' ? currentVal + amt : currentVal - amt;
              setAppVariables(prev => prev.map(v => (v.name === varPath || v.id === varPath) ? { ...v, value: nextVal } : v));
              if (vDef.isPersistent) {
                const { upsertGlobalVariable } = await import('../utils/supabaseGlobalVars');
                await upsertGlobalVariable(vDef.name, vDef.type || 'TEXT', nextVal);
              }
            }
          } else if (type === 'CLEAR_VARIABLE' || type === 'RESET_VARIABLE') {
            const varPath = payload.varPath || payload.variableName || payload.variable;
            const vDef = appVariables.find(v => v.name === varPath || v.id === varPath);
            if (vDef) {
              setAppVariables(prev => prev.map(v => (v.name === varPath || v.id === varPath) ? { ...v, value: vDef.defaultValue || '' } : v));
              if (vDef.isPersistent) {
                const { upsertGlobalVariable } = await import('../utils/supabaseGlobalVars');
                await upsertGlobalVariable(vDef.name, vDef.type || 'TEXT', vDef.defaultValue || '');
              }
            }
          } else if (type === 'AI_PROCESS') {
            const { promptType, prompt, inputVar, resultVar } = payload;
            const actualPrompt = promptType === 'VARIABLE' ? (appVariables.find(v => v.name === prompt)?.value || '') : prompt;
            const inputData = inputVar ? (appVariables.find(v => v.name === inputVar)?.value || '') : '';

            const fullPrompt = inputData ? `${actualPrompt}\n\nData:\n${inputData}` : actualPrompt;
            if (fullPrompt) {
              toast.success(`Processing AI request...`);
              try {
                const { getChatCompletion } = await import('../utils/aiService');
                const { getPrimaryAiConnector } = await import('../utils/database');
                const connector = await getPrimaryAiConnector();
                const result = await getChatCompletion([{ role: 'user', content: fullPrompt }], connector);

                if (resultVar) {
                  setAppVariables(prev => prev.map(v => v.name === resultVar ? { ...v, value: result } : v));
                  const vDef = appVariables.find(v => v.name === resultVar);
                  if (vDef?.isPersistent) {
                    const { upsertGlobalVariable } = await import('../utils/supabaseGlobalVars');
                    await upsertGlobalVariable(vDef.name, vDef.type || 'TEXT', result);
                  }
                }
                toast.success(`AI Process completed.`);
              } catch (e) {
                toast.error(`AI Error: ${e.message}`);
                console.error(e);
              }
            }
          } else if (type === 'SHOW_NOTIFICATION' || type === 'SHOW_MESSAGE' || type === 'DISPLAY_MESSAGE' || type === 'ALERT') {
            // Support conditional showIf: only show if expression evaluates truthy
            if (payload.showIf) {
              try {
                let expr = String(payload.showIf);
                (appVariables || []).forEach(v => {
                  const regex = new RegExp(`@${v.name}`, 'gi');
                  expr = expr.replace(regex, JSON.stringify(v.value ?? v.defaultValue ?? ''));
                });
                const shouldShow = new Function(`return !!(${expr})`)();
                if (!shouldShow) { console.log(`[Trigger] showIf=false, skipping:`, payload.message); continue; }
              } catch (condErr) { console.warn('[Trigger] showIf eval error:', condErr); }
            }
            const message = await resolveSourceValue(payload.valueType || payload.messageType || 'STATIC', payload.message || payload.value || payload.text || 'Notification', '', eventPayload);
            const msgType = payload.msgType || payload.notificationType || payload.type || 'success';
            console.log(`[Trigger] ${type}:`, message);
            if (msgType === 'error') toast.error(message, { duration: 5000 });
            else if (msgType === 'warning') toast.error(message, { icon: '⚠️', duration: 5000 });
            else toast.success(message);
          } else if (type === 'RUN_FUNCTION') {
            const functionName = payload.functionName || payload.name || action.functionName;
            try {
              const functions = JSON.parse(localStorage.getItem('mes_functions') || '[]');
              const targetFn = functions.find(f => f.name === functionName || f.id === functionName);
              if (targetFn) {
                const { default: automationEngine } = await import('../utils/automationEngine');
                const graphData = targetFn.published ? targetFn.published.data : targetFn.draft;
                if (graphData && graphData.nodes) {
                  await automationEngine.executeGraph(graphData, { timestamp: new Date().toISOString(), source: 'UI_TRIGGER', ...eventPayload });
                } else {
                  console.warn(`[runActions] Function graph data not found: ${functionName}`);
                }
              } else {
                console.warn(`[runActions] Function not found: ${functionName}`);
              }
            } catch (e) {
              console.error(`[runActions] Error running function:`, e);
            }
          } else if (type === 'PLAY_SOUND') {
            const { url } = action.payload;
            if (url) {
              const audio = new Audio(url);
              audio.play().catch(err => console.error("Error playing sound:", err));
            }
          } else if (action.type === 'SHOW_IMAGE' || action.type === 'PLAY_VIDEO') {
            const { url, duration } = action.payload;
            if (url) {
              setActiveMedia({ type: action.type === 'SHOW_IMAGE' ? 'IMAGE' : 'VIDEO', url, duration: duration || 0 });
            }
          } else if (action.type === 'GO_TO_STEP' || action.type === 'NAVIGATE_STEP') {
            const stepTarget = action.payload?.stepId || action.payload?.targetId || action.payload?.screen || '';
            let targetIndex = (selectedApp?.config?.steps || []).findIndex(s => s.id === stepTarget);
            // Fallback: resolve by step title
            if (targetIndex === -1) {
              targetIndex = (selectedApp?.config?.steps || []).findIndex(s =>
                String(s.title || '').toLowerCase() === String(stepTarget).toLowerCase()
              );
            }
            if (targetIndex !== -1) setCurrentStepIndex(targetIndex);
          } else if (action.type === 'NEXT_STEP') {
            handleNextStep();
          } else if (action.type === 'PREV_STEP') {
            handlePrevStep();
          } else if (action.type === 'PRINT_SCREEN') {
            let targetId = String(action.payload?.targetId || '');
            const currentStepComps = selectedApp ? (selectedApp.config?.steps || [])[currentStepIndex]?.components || [] : [];
            const allComps = selectedApp ? (selectedApp.config?.steps || []).flatMap(s => s.components || []) : [];
            
            if (!targetId) {
              const printArea = currentStepComps.find(c => c.type === 'PRINT_AREA');
              if (printArea) {
                targetId = printArea.id;
              }
            }

            setTimeout(() => {
              if (targetId) {
                let x, y, w, h;
                let isCoordinateBased = false;

                if (targetId.startsWith('rect:')) {
                  [x, y, w, h] = targetId.split(':')[1].split(',').map(Number);
                  isCoordinateBased = true;
                } else {
                  const targetComp = allComps.find(c => c.id === targetId);
                  if (targetComp && targetComp.type === 'PRINT_AREA') {
                    x = targetComp.x;
                    y = targetComp.y;
                    w = targetComp.w;
                    h = targetComp.h;
                    isCoordinateBased = true;
                  }
                }

                if (isCoordinateBased) {
                  const componentsToHide = allComps.filter(c => {
                    if (c.id === targetComp.id) return true; // Always hide the print area dashed border itself
                    if (c.x == null || c.y == null) return false;
                    const c_right = c.x + (c.w || 0);
                    const c_bottom = c.y + (c.h || 0);
                    const t_right = x + w;
                    const t_bottom = y + h;
                    const isOutside = (c_right <= x) || (c.x >= t_right) || (c_bottom <= y) || (c.y >= t_bottom);
                    return isOutside;
                  });
                  
                  const hideSelectors = componentsToHide.map(c => `#terminal-comp-${c.id}`).join(', ');
                  const hideCss = hideSelectors ? `${hideSelectors} { display: none !important; }` : '';

                  const style = document.createElement('style');
                  style.id = 'print-style-injected';
                  style.innerHTML = `
                    @page { margin: 0; }
                    @media print {
                      body * { visibility: hidden; }
                      #terminal-canvas-content { 
                        visibility: visible !important; 
                        position: absolute !important; 
                        left: -${x}px !important; 
                        top: -${y}px !important;
                        width: ${w}px !important;
                        height: ${h}px !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                      }
                      #terminal-canvas-content * { visibility: visible; }
                      #terminal-comp-${targetComp.id} { display: none !important; }
                      ${hideCss}
                    }
                  `;
                  document.head.appendChild(style);
                  window.print();
                  document.head.removeChild(style);
                } else {
                  const style = document.createElement('style');
                  style.id = 'print-style-injected';
                  style.innerHTML = `
                    @media print {
                      body * { visibility: hidden; }
                      #${targetId}, #${targetId} * { visibility: visible; }
                      #${targetId} { position: absolute; left: 0; top: 0; width: 100%; max-width: 100%; margin: 0; padding: 0; }
                    }
                  `;
                  document.head.appendChild(style);
                  window.print();
                  document.head.removeChild(style);
                }
              } else {
                window.print();
              }
            }, 300);
          } else if (action.type === 'COMPLETE_APP') {
            await handleCompleteApp();
          } else if (action.type === 'CANCEL_APP') {
            await handleCancelApp();
          } else if (action.type === 'SAVE_APP_DATA') {
            await handleSaveAppData();
          } else if (action.type === 'CREATE_RECORD' || action.type === 'UPDATE_RECORD') {
            const { tableId, mappings, recordId: rawRecordId } = action.payload;
            const resolvedData = {};
            for (const [col, mapObj] of Object.entries(mappings || {})) {
              const mValue = typeof mapObj === 'string' ? mapObj : (mapObj.value || '');
              const mType = typeof mapObj === 'string' ? 'STATIC' : (mapObj.type || 'STATIC');
              resolvedData[col] = await resolveSourceValue(mType, mValue, '', eventPayload);
            }

            if (action.type === 'CREATE_RECORD') {
              const { addTableRecord, resolveTableIdReference } = await import('../utils/supabaseTablesDB');
              const resolvedTableId = await resolveTableIdReference(tableId);
              if (!resolvedData.recordId && !resolvedData.id) {
                resolvedData.recordId = `REC_${Date.now()}`;
              }
              await addTableRecord(resolvedTableId, resolvedData);
            } else {
              const recordId = await resolveSourceValue('STATIC', rawRecordId);
              const { updateTableRecord, resolveTableIdReference, getTableRecords } = await import('../utils/supabaseTablesDB');
              const resolvedTableId = await resolveTableIdReference(tableId);

              const records = await getTableRecords(resolvedTableId);
              const target = records.find(r => String(r.recordId).toLowerCase() === String(recordId).toLowerCase());

              if (target) {
                await updateTableRecord(target.id, resolvedData);
              } else {
                throw new Error(`Record "${recordId}" not found in table "${tableId}"`);
              }
            }
          } else if (['TABLE_RECORD_LOAD', 'TABLE_RECORD_CREATE', 'TABLE_RECORD_CREATE_OR_LOAD', 'TABLE_RECORD_SAVE', 'TABLE_RECORD_DELETE'].includes(action.type)) {
            const payloadData = action.payload || action || {};
            let placeholderId = payloadData.placeholderId || payloadData.recordPlaceholderId || payloadData.placeholder || action.recordPlaceholderId;
            const { idType = 'STATIC', idValue = '', tableId } = payloadData;
            
            const allPlaceholders = recordPlaceholders || [];
            
            let placeholder = null;
            if (placeholderId) {
              placeholder = allPlaceholders.find(rp => rp.id === placeholderId)
                || allPlaceholders.find(rp => String(rp.name).toLowerCase() === String(placeholderId).toLowerCase());
            }

            // Fallback: search by tableId if placeholder is not resolved yet
            if (!placeholder && tableId) {
              placeholder = allPlaceholders.find(rp => rp.tableId === tableId);
              if (placeholder) {
                console.log(`[TABLE_RECORD] Resolved placeholder by tableId "${tableId}": ${placeholder.id} (${placeholder.name})`);
              }
            }

            // Fallback: If no placeholder found and action is SAVE, try the first placeholder
            if (!placeholder && action.type === 'TABLE_RECORD_SAVE' && allPlaceholders.length > 0) {
               placeholder = allPlaceholders[0];
               console.log(`[TABLE_RECORD] Falling back to first placeholder for SAVE: ${placeholder.id}`);
            }

            if (!placeholder?.tableId) {
              toast.error(`❌ Placeholder "${placeholderId || 'kosong'}" tidak ditemukan atau tidak terhubung ke tabel.`);
              console.error(`[TABLE_RECORD] Placeholder not found: "${placeholderId || 'kosong'}"`, allPlaceholders);
              continue;
            }

            // Standardize placeholderId to the resolved placeholder's actual ID
            placeholderId = placeholder.id;
            console.log(`[TABLE_RECORD] Resolved placeholder: "${placeholderId}" → id=${placeholder.id}, table=${placeholder.tableId}`, placeholder);

            let resolvedId = await resolveSourceValue(idType, idValue, '', eventPayload);

            if ((!resolvedId || resolvedId === '') && eventPayload) {
              resolvedId = typeof eventPayload === 'object' ? (eventPayload.recordId || eventPayload.id || eventPayload.record_id || eventPayload.ID || eventPayload.Id) : eventPayload;
            }

            // Sync with linkVariable if specified
            const linkVarName = action.linkVariable || payloadData.linkVariable || (idType === 'VARIABLE' ? idValue : null);
            if (linkVarName && resolvedId) {
              setAppVariables(prev => prev.map(v => (v.name === linkVarName || v.id === linkVarName) ? { ...v, value: resolvedId } : v));
              const vDef = appVariables.find(v => v.name === linkVarName || v.id === linkVarName);
              if (vDef?.isPersistent) {
                const { upsertGlobalVariable } = await import('../utils/supabaseGlobalVars');
                await upsertGlobalVariable(vDef.name, vDef.type || 'TEXT', resolvedId);
              }
            }

            const loadById = async () => {
              const { getTableRecords } = await import('../utils/supabaseTablesDB');
              const rows = await getTableRecords(placeholder.tableId);
              const found = (rows || []).find(r => 
                String(r.id) === String(resolvedId) || 
                String(r.ID) === String(resolvedId) || 
                String(r.recordId) === String(resolvedId) || 
                String(r.record_id) === String(resolvedId)
              );
              if (found) {
                localPlaceholderContext[placeholderId] = found;
                setRecordPlaceholderData(prev => ({ ...prev, [placeholderId]: found }));
                
                // Also update selected row in linked tables for visual feedback
                const linkedTable = appComponents.find(c => (c.type === 'INTERACTIVE_TABLE' || c.type === 'ADVANCED_TABLE') && c.props.linkedRecordPlaceholderId === placeholder.id);
                if (linkedTable) {
                  setSelectedTableRow(prev => ({ ...prev, [linkedTable.id]: found }));
                }
                
                return true;
              }
              return false;
            };

            const createById = async () => {
              // Create should persist full harvested payload (not only recordId).
              // Force-create mode by clearing current context, then reuse save flow.
              localPlaceholderContext[placeholderId] = null;
              setRecordPlaceholderData(prev => ({ ...prev, [placeholderId]: null }));
              return await saveById();
            };

            const saveById = async () => {
              if (saveLock.current[placeholderId]) {
                console.log(`[saveById] Save already in progress for "${placeholderId}", skipping.`);
                return false;
              }
              saveLock.current[placeholderId] = true;

              try {
                // 1. Harvest current data from UI components
                const rec = localPlaceholderContext[placeholderId] || recordPlaceholderData[placeholderId];
                const updatedData = rec ? { ...rec } : {};
                let fieldsFound = 0;
                const harvestedColsThisSession = new Set();

                // Fetch table definition to know which columns we need
                const { getTableById, addTableRecord, updateTableRecord, getTableRecords } = await import('../utils/supabaseTablesDB');
                const tableDef = await getTableById(placeholder.tableId);
                const columns = tableDef?.columns || [];

                // Apply explicit mappings if provided in trigger action payload
                const actionMapping = action.payload?.mapping || action.payload?.mappings || action.mapping || action.mappings;
                if (actionMapping && typeof actionMapping === 'object') {
                  for (const [colName, expr] of Object.entries(actionMapping)) {
                    if (['id', 'createdat', 'updatedat'].includes(colName.toLowerCase())) continue;
                    const resolvedVal = await resolveSourceValue('STATIC', expr, '', eventPayload);
                    if (resolvedVal !== undefined && resolvedVal !== null) {
                      console.log(`[saveById] Explicit mapping found for column "${colName}":`, resolvedVal);
                      updatedData[colName] = resolvedVal;
                      harvestedColsThisSession.add(colName);
                      fieldsFound++;
                    }
                  }
                }

                // AGGRESSIVE SCAN: Search ALL components (Apps & Manuals)
                // AGGRESSIVE SCAN: Search ALL components (Apps & Manuals)
                // Prioritize components on the CURRENT step to avoid matching empty fields from other steps
                const currentStepComps = (selectedApp?.config?.steps || [])[currentStepIndex]?.components || [];
                const baseComps = selectedApp?.config?.baseComponents || [];
                const otherStepsComps = (selectedApp?.config?.steps || []).filter((s, i) => i !== currentStepIndex).flatMap(s => s.components || []);
                
                const allComps = [
                  ...currentStepComps,
                  ...baseComps,
                  ...otherStepsComps,
                  ...(selectedManual?.content?.baseComponents || []),
                  ...(selectedManual?.content?.steps || []).flatMap(s => s.components || [])
                ];

                const getComponentLiveValue = (comp) => {
                  if (comp.type === 'TEXT_INPUT' || comp.type === 'PASSWORD_TEXT') return textInputValues[comp.id];
                  if (comp.type === 'TEXT_AREA') return textAreaValues[comp.id];
                  if (comp.type === 'NUMBER_INPUT') return numberInputValues[comp.id];
                  if (comp.type === 'BARCODE' || comp.type === 'BARCODE_SCANNER') return barcodeValues[comp.id] ?? cameraScannerValues[comp.id];
                  if (comp.type === 'DROPDOWN') return dropdownValues[comp.id];
                  if (comp.type === 'CHECKBOX' || comp.type === 'BOOLEAN_TOGGLE' || comp.type === 'TOGGLE') return toggleState[comp.id];
                  if (comp.type === 'CHECKLIST') return checklistState[comp.id];
                  if (comp.type === 'RADIO' || comp.type === 'RADIO_GROUP') return radioValues[comp.id];
                  if (comp.type === 'MULTI_SELECT') return multiSelectValues[comp.id];
                  if (comp.type === 'QUALITY_PASS_FAIL') return qualityResult[comp.id];
                  if (comp.type === 'SLIDER') return sliderValues[comp.id];
                  if (comp.type === 'DATE_PICKER') return dateValues[comp.id];
                  if (comp.type === 'DATETIME_PICKER') return dateTimeValues[comp.id];
                  if (comp.type === 'TIME_PICKER') return timeValues[comp.id];
                  if (comp.type === 'SIGNATURE' || comp.type === 'SIGNATURE_PAD') return signatureWidgetValues[comp.id] ?? drawValues[comp.id];
                  if (comp.type === 'CAMERA_CAPTURE' || comp.type === 'CAMERA') return cameraValues[comp.id];
                  if (comp.type === 'FILE_UPLOAD' || comp.type === 'FILE_PICKER') return uploadValues[comp.id]?.url || uploadValues[comp.id]?.name;
                  if (comp.type === 'INTERACTIVE_TABLE' || comp.type === 'TABLE') return tableData[comp.id];
                  if (comp.type === 'ADVANCED_TABLE') return advancedTableData[comp.id];
                  return undefined;
                };

                // Harvest data for EACH column
                for (const col of columns) {
                  const colName = col.name || col;
                  if (['id', 'recordid', 'createdat', 'updatedat'].includes(String(colName).toLowerCase())) continue;

                  allComps.forEach(comp => {
                    // Normalization helper for matching
                    const normalize = (str) => String(str || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

                    const targetVar = comp.props?.targetVariable || (comp.props?.dataSourceType === 'VARIABLE' ? comp.props?.varSource : null);
                    const explicitField = comp.props?.tableField || comp.props?.fieldName || comp.props?.column || comp.props?.bindingConfig?.resultColumn || '';
                    const compLabel = comp.props?.label || comp.props?.text || comp.props?.title || '';

                    const targetVarNorm = normalize(targetVar);
                    const targetVarLastSegNorm = targetVar && String(targetVar).includes('.') ? normalize(String(targetVar).split('.').pop()) : '';
                    const explicitFieldNorm = normalize(explicitField);
                    const compLabelNorm = normalize(compLabel);
                    const colNorm = normalize(colName);
                    const phNameNorm = normalize(placeholder.name);

                    // Match: Placeholder.Column, Column, last segment var (e.g. dit.data), explicit field binding, or Label match
                    const compName = comp.name || comp.props?.name || '';
                    const compNameNorm = normalize(compName);

                    // Match: Placeholder.Column, Column, last segment var (e.g. dit.data), explicit field binding, Label match, or Component Name
                    if (
                      targetVarNorm === phNameNorm + colNorm ||
                      targetVarNorm === colNorm ||
                      targetVarLastSegNorm === colNorm ||
                      explicitFieldNorm === colNorm ||
                      compLabelNorm === colNorm ||
                      compNameNorm === colNorm ||
                      normalize(comp.id) === colNorm
                    ) {
                      // Only skip if we already harvested a value for this specific column in THIS session
                      if (harvestedColsThisSession.has(colName)) return;

                      let val = getComponentLiveValue(comp);

                      // DOM Fallback if state is empty but element has value
                      if (val === undefined || val === null || val === '') {
                        const inputEl = document.getElementById(`input-${comp.id}`);
                        if (inputEl) val = inputEl.value;
                      }

                      if (val !== undefined && val !== null && val !== '') {
                        console.log(`[saveById] Found value for column "${colName}" from component "${comp.id}" (${comp.type}):`, val);
                        updatedData[colName] = val;
                        harvestedColsThisSession.add(colName);
                        fieldsFound++;
                      }
                    }
                  });


                  // Fallback khusus: bila tabel hanya punya 1 kolom data user, simpan dari input aktif meski belum dimapping variable.
                  if (!updatedData[colName] && columns.filter(c => !['id', 'recordid', 'createdat', 'updatedat'].includes(String((c.name || c)).toLowerCase())).length === 1) {
                    for (const comp of allComps) {
                      let val = getComponentLiveValue(comp);
                      if (val === undefined || val === null || val === '') {
                        const inputEl = document.getElementById(`input-${comp.id}`);
                        if (inputEl) val = inputEl.value;
                      }
                      if (val !== undefined && val !== null && val !== '') {
                        updatedData[colName] = val;
                        fieldsFound++;
                        console.log(`[saveById] Single-column fallback used for "${colName}" from component "${comp.id}"`);
                        break;
                      }
                    }
                  }

                  // 2. Variable Fallback (Aggressive matching)
                  if (!updatedData[colName]) {
                    const v = appVariables.find(v => {
                      const vNameUpper = String(v.name).toUpperCase();
                      const colUpper = String(colName).toUpperCase();
                      // Exact match
                      if (vNameUpper === colUpper) return true;
                      // Dot-suffix: Record.COLUMN
                      if (vNameUpper.endsWith('.' + colUpper)) return true;
                      // Underscore-suffix: NILAI_A matches column A
                      if (vNameUpper.endsWith('_' + colUpper)) return true;
                      // Column contains variable name: column NILAI_A matches var NILAI_A
                      if (colUpper.includes(vNameUpper) || vNameUpper.includes(colUpper)) return true;
                      // Normalized (strip underscores/spaces): NILAIA === NILAIA
                      const vNorm = vNameUpper.replace(/[^A-Z0-9]/g, '');
                      const cNorm = colUpper.replace(/[^A-Z0-9]/g, '');
                      if (vNorm === cNorm) return true;
                      return false;
                    });
                    if (v && v.value !== undefined && v.value !== null && v.value !== '') {
                      console.log(`[saveById] Found value for column "${colName}" from variable "${v.name}":`, v.value);
                      updatedData[colName] = v.value;
                      fieldsFound++;
                    }
                  }
                }

                console.log(`[saveById] Final harvest results for placeholder "${placeholder.name}":`, updatedData);
                console.log(`[saveById] Total fields populated: ${fieldsFound}`);

                if (fieldsFound === 0 && !rec) {
                  console.warn(`[saveById] No data harvested for new record in "${placeholder.name}". Skipping save silently.`);
                  return false;
                }

                // 3. Determine if we UPDATE or CREATE
                let finalRecord = null;
                if (rec && (rec.id || rec.recordId)) {
                  let dbRowId = rec.id;
                  if (!dbRowId && rec.recordId) {
                    const rows = await getTableRecords(placeholder.tableId);
                    const match = rows.find(r => String(r.recordId).toLowerCase() === String(rec.recordId).toLowerCase());
                    if (match) dbRowId = match.id;
                  }

                  if (dbRowId) {
                    finalRecord = await updateTableRecord(dbRowId, updatedData);
                    console.log(`[saveById] Updated record id=${dbRowId}`);
                  }
                }

                if (!finalRecord) {
                  // Create new record with harvested data
                  const finalId = resolvedId && resolvedId !== "Kosongkan untuk Auto ID" ? resolvedId : `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                  finalRecord = await addTableRecord(placeholder.tableId, { ...updatedData, recordId: finalId });
                  console.log(`[saveById] Created new record recordId=${finalId}`);
                }

                // 4. Update context and state
                localPlaceholderContext[placeholderId] = finalRecord;
                setRecordPlaceholderData(prev => ({ ...prev, [placeholderId]: finalRecord }));
                toast.success('💾 Data berhasil disimpan ke tabel.');
                
                // Trigger UI refresh for tables, charts, etc.
                const activeConfig = selectedApp || (selectedManual ? { config: selectedManual.content } : null);
                if (activeConfig) {
                  setTimeout(() => {
                    fetchTableData(activeConfig);
                    fetchChartData(activeConfig);
                    fetchBoundData(activeConfig);
                  }, 500);
                }
                
                return true;
              } catch (err) {
                console.error('[saveById] Error:', err);
                toast.error(`❌ Gagal simpan: ${err.message}`);
                return false;
              } finally {
                setTimeout(() => { saveLock.current[placeholderId] = false; }, 1000);
              }
            };

            const deleteById = async () => {
              const rec = localPlaceholderContext[placeholderId] || recordPlaceholderData[placeholderId];
              if (!rec || !rec.id) {
                toast.error('❌ DELETE: Tidak ada record yang di-load. Gunakan TABLE_RECORD_LOAD dulu.');
                return false;
              }
              const { deleteTableRecord } = await import('../utils/supabaseTablesDB');
              // deleteTableRecord only takes the internal row id (Supabase primary key)
              await deleteTableRecord(rec.id);
              localPlaceholderContext[placeholderId] = null;
              setRecordPlaceholderData(prev => ({ ...prev, [placeholderId]: null }));
              console.log(`[TABLE_RECORD_DELETE] Deleted record id=${rec.id} from table=${placeholder.tableId}`);
              return true;
            };

            if (action.type === 'TABLE_RECORD_LOAD') {
              await loadById();
            } else if (action.type === 'TABLE_RECORD_CREATE') {
              await createById();
            } else if (action.type === 'TABLE_RECORD_SAVE') {
              await saveById();
            } else if (action.type === 'TABLE_RECORD_DELETE') {
              await deleteById();
            } else {
              const ok = await loadById();
              if (!ok) await createById();
            }
          } else if (type === 'OBD2_CONNECT') {
            const { transport, ipAddress, port } = payload;
            try {
              if (transport === 'SERIAL') await obd2Service.connectSerial();
              else if (transport === 'WIFI') await obd2Service.connectWiFi(ipAddress || '192.168.0.10', Number(port) || 35000);
              else await obd2Service.connectBluetooth();
            } catch (e) {
              toast.error(`OBD2 Error: ${e.message}`);
            }
          } else if (type === 'OBD2_QUERY' || type === 'OBD2_READ') {
            const { pid } = payload;
            if (pid) {
              await obd2Service.queryPID(pid);
            }
          } else if (type === 'OBD2_CLEAR_DTC') {
            await obd2Service.clearDTC();
          } else if (type === 'CUSTOM_SCRIPT') {
            const { script } = payload;
            if (script) {
              try {
                const fn = new Function('appVariables', 'setVariable', 'toast', script);
                fn(appVariables, (n, v) => setAppVariables(prev => prev.map(p => p.name === n ? { ...p, value: v } : p)), toast);
              } catch (e) {
                toast.error(`Script error: ${e.message}`);
              }
            }
          } else if (type === 'CALCULATE_FORMULA') {
            const { formula, resultVar } = payload;
            if (formula && resultVar) {
              try {
                const val = evaluateExpression(formula);
                setAppVariables(prev => prev.map(v => v.name === resultVar ? { ...v, value: val } : v));
              } catch (e) {
                toast.error(`Formula error: ${e.message}`);
              }
            }
          } else if (action.type === 'CLEAR_RECORD_PLACEHOLDER') {
            const { placeholderId } = action.payload || {};
            if (!placeholderId) continue;
            localPlaceholderContext[placeholderId] = null;
            setRecordPlaceholderData(prev => ({ ...prev, [placeholderId]: null }));
          } else if (action.type === 'CALL_FUNCTION') {
            const { functionId, parameters } = action.payload;
            const fn = appFunctions.find(f => f.id === functionId);
            if (!fn) continue;

            const resolvedParams = {};
            for (const [name, paramObj] of Object.entries(parameters || {})) {
              resolvedParams[name] = await resolveSourceValue(paramObj.type, paramObj.value, '', eventPayload);
            }

            let localContext = { ...resolvedParams };
            for (const step of fn.steps) {
              if (step.type === 'SET') {
                const val = evaluateExpression(step.expression, localContext);
                localContext[step.name] = val;
                const globalVar = appVariables.find(v => v.name === step.name);
                if (globalVar) {
                  setAppVariables(prev => prev.map(v => v.name === step.name ? { ...v, value: val } : v));
                  if (globalVar.isPersistent) {
                    const { upsertGlobalVariable } = await import('../utils/supabaseGlobalVars');
                    await upsertGlobalVariable(step.name, globalVar.type || 'TEXT', val);
                  }
                }
              }
            }
          } else if (action.type === 'SEND_TO_CONNECTOR') {
            const { connectorId, functionId, parameters, resultVar } = action.payload;
            const resolvedParams = {};
            for (const [name, paramObj] of Object.entries(parameters || {})) {
              resolvedParams[name] = await resolveSourceValue(paramObj.type, paramObj.value, '', eventPayload);
            }

            const { webhookUtility } = await import('../utils/webhookUtility');
            try {
              const result = await webhookUtility.executeIntegrationAction(connectorId, { functionId, parameters: resolvedParams });
              if (resultVar && result) {
                setAppVariables(prev => prev.map(v => v.name === resultVar ? { ...v, value: result } : v));
              }
            } catch (err) {
              console.error(`[Connector] Execution failed:`, err);
            }
          } else if (action.type === 'PUBLISH_MQTT' || action.type === 'WRITE_PLC_TAG') {
            const { topic, value, valueType } = action.payload || {};
            const resolvedValue = await resolveSourceValue(valueType || 'STATIC', value, '', eventPayload);
            if (topic) {
              iotConnector.publish(topic, String(resolvedValue));
              console.log(`[PLC HMI] Published ${resolvedValue} to ${topic}`);
            }
          } else if (action.type === 'APP_REFRESH' || action.type === 'CLEAR_ALL_INPUTS') {
            console.log(`[${action.type}] Manually triggering data refresh...`);
            resetInputs(); // Clear all manual entries and force remount
            if (action.type === 'APP_REFRESH') {
              const activeConfig = selectedApp || (selectedManual ? { config: selectedManual.content } : null);
              if (activeConfig) {
                await fetchTableData(activeConfig);
                await fetchChartData(activeConfig);
                await fetchBoundData(activeConfig);
                toast.success('🔄 Data refreshed');
              }
            } else {
              toast.success('🧹 Inputs cleared');
            }
          } else if (action.type === 'LINK_RECORD' || action.type === 'UNLINK_RECORD') {
            const {
              sourceTableId,
              sourceRecordId: rawSourceId,
              sourceFieldName,
              targetTableId,
              targetRecordId: rawTargetId,
              targetFieldName
            } = action.payload;

            const sourceRecordId = await resolveSourceValue(action.payload.sourceRecordIdType || 'STATIC', rawSourceId, '', eventPayload);
            const targetRecordId = await resolveSourceValue(action.payload.targetRecordIdType || 'STATIC', rawTargetId, '', eventPayload);

            if (!sourceRecordId || !targetRecordId) {
              continue;
            }

            const { linkRecords, unlinkRecords } = await import('../utils/supabaseTablesDB');
            try {
              if (action.type === 'LINK_RECORD') {
                await linkRecords(sourceTableId, sourceRecordId, sourceFieldName, targetTableId, targetRecordId, targetFieldName);
              } else {
                await unlinkRecords(sourceTableId, sourceRecordId, sourceFieldName, targetTableId, targetRecordId, targetFieldName);
              }
              fetchTableData(selectedApp);
            } catch (err) {
              console.error(`[LinkedRecords] Failed to ${action.type}:`, err);
            }
          }
        } catch (err) {
          console.error(`Action execution failed (${action.type}):`, err);
          toast.error(`Action Failed: ${err.message || 'Unknown error'}`);
        }
      }
    };

    let normalizedClauses = [];
    if (trigger.clauses && trigger.clauses.length > 0) {
      normalizedClauses = JSON.parse(JSON.stringify(trigger.clauses));
    } else if (trigger.actions && trigger.actions.length > 0) {
      normalizedClauses = [{
        match: trigger.conditionMatch || 'ALL',
        conditions: trigger.conditions || [],
        actions: JSON.parse(JSON.stringify(trigger.actions))
      }];
    } else if (trigger.action || trigger.type) {
      // Flat trigger itself is a single action
      const singleAction = JSON.parse(JSON.stringify(trigger));
      normalizedClauses = [{
        match: 'ALL',
        conditions: trigger.conditions || [],
        actions: [singleAction]
      }];
    } else {
      normalizedClauses = [{
        match: 'ALL',
        conditions: [],
        actions: []
      }];
    }

    // Normalize each action inside each clause
    normalizedClauses.forEach(clause => {
      if (Array.isArray(clause.actions)) {
        clause.actions = clause.actions.map(action => {
          if (!action) return action;
          
          // Map type from action if type is missing or too generic (like 'LOGIC' or 'DATA' or 'NAVIGATION')
          let resolvedType = action.type;
          if (!resolvedType || ['LOGIC', 'DATA', 'NAVIGATION'].includes(String(resolvedType).toUpperCase())) {
            resolvedType = action.action || action.type;
          }
          
          const t = String(resolvedType || '').toUpperCase().replace(/[\s-]/g, '_');
          const normalized = { ...action };
          
          if (t.includes('LOAD') && (t.includes('RECORD') || t.includes('ROW'))) normalized.type = 'TABLE_RECORD_LOAD';
          else if ((t.includes('CREATE') || t.includes('INSERT')) && (t.includes('RECORD') || t.includes('ROW') || t.includes('TABLE'))) normalized.type = 'TABLE_RECORD_CREATE';
          else if ((t.includes('SAVE') || (t.includes('UPDATE') && !t.includes('VARIABLE'))) && (t.includes('RECORD') || t.includes('ROW') || t.includes('TABLE'))) normalized.type = 'TABLE_RECORD_SAVE';
          else if (t.includes('DELETE') && (t.includes('RECORD') || t.includes('ROW'))) normalized.type = 'TABLE_RECORD_DELETE';
          else if (t.includes('LOAD') || t === 'TABLE_RECORD_LOAD') normalized.type = 'TABLE_RECORD_LOAD';
          else if ((t.includes('SET') || t.includes('UPDATE') || t.includes('CHANGE')) && t.includes('VARIABLE')) normalized.type = 'SET_VARIABLE';
          else if (t === 'SET_VARIABLE') normalized.type = 'SET_VARIABLE';
          else if (t === 'NAVIGATE_STEP' || t === 'NAVIGATE' || t === 'GOTO_STEP' || t === 'GOTO' || t === 'GO_TO_STEP') normalized.type = 'GO_TO_STEP';
          else if (t.includes('NOTIFICATION') || t.includes('TOAST') || t.includes('SHOW_MESSAGE') || t === 'ALERT' || t === 'SHOW_NOTIFICATION') normalized.type = 'SHOW_NOTIFICATION';
          else normalized.type = resolvedType;

          if (!normalized.payload) {
            const p = { ...action };
            
            // SET_VARIABLE
            if (normalized.type === 'SET_VARIABLE') {
              p.varPath = action.variableId || action.variableName || action.variable || action.varPath || '';
              p.value = action.value !== undefined ? action.value : (action.expression || '');
              p.valueType = action.valueType || (String(p.value).includes('{{') ? 'STATIC' : 'STATIC');
            }
            // TABLE_RECORD_*
            else if (normalized.type.startsWith('TABLE_RECORD_')) {
              p.placeholderId = action.recordPlaceholderId || action.placeholderId || action.placeholder || '';
              p.idType = action.idType || 'STATIC';
              p.idValue = action.idValue || '';
              if (action.tableId) p.tableId = action.tableId;
            }
            // GO_TO_STEP
            else if (normalized.type === 'GO_TO_STEP') {
              p.stepId = action.stepId || action.targetId || action.screen || '';
            }
            // SHOW_NOTIFICATION
            else if (normalized.type === 'SHOW_NOTIFICATION') {
              p.message = action.message || action.text || 'Notification';
              p.msgType = action.messageType || action.msgType || action.notificationType || 'success';
            }
            
            normalized.payload = p;
          } else {
            // Even if payload exists, make sure to normalize nested attributes
            const p = { ...normalized.payload };
            if (normalized.type === 'SET_VARIABLE') {
              p.varPath = p.varPath || action.variableId || action.variableName || action.variable || '';
              p.value = p.value !== undefined ? p.value : (action.value !== undefined ? action.value : (p.expression || action.expression || ''));
            } else if (normalized.type.startsWith('TABLE_RECORD_')) {
              p.placeholderId = p.placeholderId || action.recordPlaceholderId || action.placeholder || '';
              // Removed forced VARIABLE idType
            } else if (normalized.type === 'GO_TO_STEP') {
              p.stepId = p.stepId || action.stepId || action.targetId || action.screen || '';
            } else if (normalized.type === 'SHOW_NOTIFICATION') {
              p.message = p.message || action.message || action.text || 'Notification';
              p.msgType = p.msgType || action.messageType || action.msgType || action.notificationType || 'success';
            }
            normalized.payload = p;
          }
          
          return normalized;
        });
      }
    });

    const clauses = normalizedClauses;

    for (const clause of clauses) {
      let passed = true;
      if (clause.conditions && clause.conditions.length > 0) {
        const matchType = clause.match || 'ALL';
        const results = await Promise.all(clause.conditions.map(c => evaluateCondition(c, eventPayload)));
        passed = matchType === 'ANY' ? results.some(r => r) : results.every(r => r);
      }
      if (passed) {
        console.log(`[executeTrigger] Clause passed. Running actions...`);
        await runActions(clause.actions);
        break;
      } else {
        console.log(`[executeTrigger] Clause conditions not met.`);
      }
    }

    if (trigger.elseActions?.length) {
      // Only run else if no clause matched (very basic logic)
      // In full Tulip, each clause can have an else, but here we keep it simple
    }
  };

  // Helper: fire triggers for any widget event (Tulip-style)
  const fireWidgetTriggers = async (comp, eventId, eventPayload = null) => {
    console.log(`[fireWidgetTriggers] Comp: ${comp?.id}, Event: ${eventId}`);
    // 1. Execute Blockly Logic (Scoped to Widget)
    if (typeof executeBlocklyLogic === 'function') {
      executeBlocklyLogic(`WIDGET_EVENT:${comp.id}:${eventId}`, eventPayload);
    }

    // 2. Execute Legacy Actions Triggers
    if (!comp) return;
    const triggersSource = comp.props?.triggers || comp.triggers;
    if (!triggersSource) return;
    const trigList = triggersSource.filter(t => t.event === eventId || (!t.event && (['BUTTON', 'COMPLETE_BUTTON', 'OBD2_CLEAR_DTC'].includes(comp.type) ? eventId === 'ON_CLICK' : eventId === 'ON_CHANGE')));
    
    const getFriendlyName = (trig, defaultType) => {
      if (trig.name) return trig.name;
      const evt = (trig.event || '').replace('ON_', '').replace(/_/g, ' ');
      const act = (trig.action || trig.type || '').replace(/_/g, ' ');
      if (evt && act) return `${evt} (${act})`;
      if (evt) return `${evt} Trigger`;
      return `${defaultType} Trigger`;
    };

    for (const trig of trigList) {
      // Log trigger execution for App Player Dev Mode
      window.parent.postMessage({
        type: 'TRIGGER_FIRED',
        triggerName: getFriendlyName(trig, comp.type || 'Widget'),
        eventId: eventId,
        source: comp.props?.label || comp.type,
        timestamp: new Date().toISOString()
      }, '*');
      await executeTrigger(trig, eventPayload);
    }
  };

  const parentMessageHandlersRef = useRef({ selectedApp, resetInputs, executeTrigger });
  useEffect(() => {
    parentMessageHandlersRef.current = { selectedApp, resetInputs, executeTrigger };
  }, [selectedApp, resetInputs, executeTrigger]);

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data && typeof event.data === 'object') {
        const { type } = event.data;
        if (type === 'RESTART') {
          console.log('[LiveTerminal] Received RESTART message from parent');
          setCurrentStepIndex(0);
          setTimer(0);
          setQualityData({});
          setQuantityLog({});
          setCycleData([]);
          
          const { selectedApp: curApp, resetInputs: curReset, executeTrigger: curExec } = parentMessageHandlersRef.current;
          curReset();
          
          if (curApp && curApp.config && curApp.config.appTriggers) {
            const startTriggers = curApp.config.appTriggers.filter(t => t.event === 'ON_APP_START');
            for (const trig of startTriggers) {
              try {
                await curExec(trig);
              } catch (e) {
                console.error('[LiveTerminal] Failed to execute trigger during restart:', e);
              }
            }
          }
        } else if (type === 'PAUSE') {
          console.log('[LiveTerminal] Received PAUSE message from parent');
          setIsPaused(true);
        } else if (type === 'RESUME') {
          console.log('[LiveTerminal] Received RESUME message from parent');
          setIsPaused(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Helper: fire step-level triggers
  const fireStepTriggers = async (step, eventId) => {
    // Legacy Actions Triggers
    if (!step || !step.triggers) return;
    const trigList = step.triggers.filter(t => t.event === eventId);
    
    const getFriendlyName = (trig, defaultType) => {
      if (trig.name) return trig.name;
      const evt = (trig.event || '').replace('ON_', '').replace(/_/g, ' ');
      const act = (trig.action || trig.type || '').replace(/_/g, ' ');
      if (evt && act) return `${evt} (${act})`;
      if (evt) return `${evt} Trigger`;
      return `${defaultType} Trigger`;
    };

    for (const trig of trigList) {
      window.parent.postMessage({
        type: 'TRIGGER_FIRED',
        triggerName: getFriendlyName(trig, step.title || 'Step'),
        eventId: eventId,
        source: step.title || 'Step',
        timestamp: new Date().toISOString()
      }, '*');
      await executeTrigger(trig);
    }
  };

  const executeBlocklyLogic = (triggerKey, payload = {}, stepIndexOverride = null) => {
    if (!selectedApp) return;
    const targetIdx = stepIndexOverride !== null ? stepIndexOverride : currentStepIndex;
    const currentStep = (selectedApp.config?.steps || [])[targetIdx];
    const stepLogic = currentStep?.logic?.code || '';
    const globalLogicCode = globalLogic?.code || '';

    const runtimeContext = {
      ...payload,
      goToStep: (id) => {
        const idx = steps.findIndex(s => s.id === id || s.title === id || s.name === id);
        if (idx !== -1) setCurrentStepIndex(idx);
      },
      nextStep: () => {
        if (currentStepIndex < steps.length - 1) setCurrentStepIndex(prev => prev + 1);
      },
      prevStep: () => {
        if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
      },
      completeApp: async () => {
        await handleCompleteApp();
      },
      cancelApp: async () => {
        await handleCancelApp();
      },
      setVariable: (id, val) => {
        setAppVariables(prev => {
          const next = prev.map(v => (v.id === id || v.name === id) ? { ...v, value: val } : v);
          // Fire VARIABLE_CHANGED trigger
          const changedVar = next.find(v => v.id === id || v.name === id);
          if (changedVar) {
            executeBlocklyLogic(`VARIABLE_CHANGED:${changedVar.id}`);
            executeBlocklyLogic(`VARIABLE_CHANGED:${changedVar.name}`);
          }
          return next;
        });
      },
      getVariable: (id) => {
        const v = appVariables.find(v => v.id === id || v.name === id);
        return v ? v.value : null;
      },
      getEventParameter: (name) => {
        if (!name || name === 'parameter' || name === 'output') {
          if (payload.record) return payload.record;
          if (payload.data) return payload.data;
          return payload.value || payload.result || payload;
        }
        return payload[name];
      },
      createRecord: async (tableId, data) => {
        const { addTableRecord, resolveTableIdReference } = await import('../utils/supabaseTablesDB');
        const resolvedTableId = await resolveTableIdReference(tableId);
        const result = await addTableRecord(resolvedTableId, data);
        if (result) {
          executeBlocklyLogic(`TABLE_EVENT:${resolvedTableId}:CREATED`, { record: result });
          executeBlocklyLogic(`TABLE_EVENT:${tableId}:CREATED`, { record: result });
        }
        return result;
      },
      updateRecord: async (tableId, id, data) => {
        const { updateTableRecord, resolveTableIdReference } = await import('../utils/supabaseTablesDB');
        const resolvedTableId = await resolveTableIdReference(tableId);
        const result = await updateTableRecord(resolvedTableId, id, data);
        if (result) {
          executeBlocklyLogic(`TABLE_EVENT:${resolvedTableId}:UPDATED`, { record: result });
          executeBlocklyLogic(`TABLE_EVENT:${tableId}:UPDATED`, { record: result });
        }
        return result;
      },
      deleteRecord: async (tableId, id) => {
        const { deleteTableRecord, resolveTableIdReference } = await import('../utils/supabaseTablesDB');
        const resolvedTableId = await resolveTableIdReference(tableId);
        return await deleteTableRecord(resolvedTableId, id);
      },
      loadRecord: async (placeholderId, recordId) => {
        const { getTableRecords, resolveTableIdReference } = await import('../utils/supabaseTablesDB');
        const rp = recordPlaceholders.find(p => p.id === placeholderId || p.name === placeholderId);
        if (!rp) return null;
        const resolvedTableId = await resolveTableIdReference(rp.tableId);
        const records = await getTableRecords(resolvedTableId);
        const record = records.find(r => r.recordId === recordId || r.id === recordId);
        if (record) {
          setRecordPlaceholderData(prev => ({ ...prev, [rp.id]: record }));
          executeBlocklyLogic(`PLACEHOLDER_LOADED:${rp.id}`, { record });
        }
        return record;
      },
      clearPlaceholder: (placeholderId) => {
        const rp = recordPlaceholders.find(p => p.id === placeholderId || p.name === placeholderId);
        if (rp) setRecordPlaceholderData(prev => ({ ...prev, [rp.id]: null }));
      },
      getPlaceholderField: (placeholderId, fieldName) => {
        const rp = recordPlaceholders.find(p => p.id === placeholderId || p.name === placeholderId);
        if (!rp) return null;
        const record = recordPlaceholderData[rp.id];
        return record ? record[fieldName] : null;
      },
      runQuery: async (tableId, queryName) => {
        const { queryTableRecords, getTableRecords, resolveTableIdReference } = await import('../utils/supabaseTablesDB');
        const resolvedTableId = await resolveTableIdReference(tableId);
        // Simplified query handling for now
        return await getTableRecords(resolvedTableId);
      },
      setWidgetProperty: (compId, prop, val) => {
        // 1. Reactive visibility update
        if (prop === 'visible') {
          setVisibilityMap(prev => ({ ...prev, [compId]: val }));
        }

        // 2. Persistent config update (for other props like color, label)
        setSelectedApp(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            config: {
              ...prev.config,
              steps: (prev.config.steps || []).map(s => ({
                ...s,
                components: (s.components || []).map(c => {
                  if (c.id !== compId) return c;
                  return { ...c, props: { ...c.props, [prop]: val } };
                })
              })),
              baseComponents: (prev.config.baseComponents || []).map(c => {
                if (c.id !== compId) return c;
                return { ...c, props: { ...c.props, [prop]: val } };
              })
            }
          };
        });
      },
      getWidgetProperty: (compId, prop) => {
        const baseComps = selectedApp?.config?.baseComponents || [];
        const stepComps = currentStep?.components || [];
        const comp = [...baseComps, ...stepComps].find(c => c.id === compId);
        if (!comp) return null;
        if (prop === 'visible') return visibilityMap[compId] !== false;
        return comp.props[prop];
      },
      callWidgetMethod: (compId, methodId, args = []) => {
        console.log(`[Runtime] Calling method ${methodId} on ${compId}`, args);

        const baseComps = selectedApp?.config?.baseComponents || [];
        const stepComps = currentStep?.components || [];
        const comp = [...baseComps, ...stepComps].find(c => c.id === compId);

        if (comp && ['CAMERA', 'CAMCORDER', 'OPENCV_CAMERA', 'CAMERA_CAPTURE'].includes(comp.type)) {
          if (['TakePicture', 'RecordVideo', 'TakeSnapshot', 'StartImageCapture'].includes(methodId)) {
            const evt = new CustomEvent('mavi-camera-method', {
              detail: { compId, methodId, args }
            });
            window.dispatchEvent(evt);

            setTimeout(() => {
              const mockUri = ['TakePicture', 'TakeSnapshot', 'StartImageCapture'].includes(methodId)
                ? 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop'
                : 'content://mock/video.mp4';
              
              const eventName = ['TakePicture', 'TakeSnapshot', 'StartImageCapture'].includes(methodId)
                ? 'AfterCapture'
                : 'AfterRecording';
              
              if (typeof onWidgetInteraction === 'function') {
                onWidgetInteraction(comp, eventName, { clip: mockUri, image: mockUri, picture: mockUri, value: mockUri });
              }
            }, 500);
            return;
          }
        }

        const input = document.getElementById(`input-${compId}`);
        if (input) {
          if (methodId === 'RequestFocus') input.focus();
          else if (methodId === 'HideKeyboard') input.blur();
          else if (methodId === 'MoveCursorToEnd') {
            const len = (input.value || '').length;
            input.setSelectionRange(len, len);
            input.focus();
          }
          else if (methodId === 'Clear') {
            input.value = '';
            // Trigger React update via manual event if needed, but usually logic handles this via setVariable
          }
          else if (methodId === 'DisplayDropdown' || methodId === 'LaunchPicker') {
            if (typeof input.showPicker === 'function') input.showPicker();
            else input.click();
          }
        }
      },
      showToast: (message, type = 'success') => {
        if (type === 'error') toast.error(message);
        else toast.success(message);
      },
      showAlert: (msg) => alert(msg),
      confirm: (msg) => window.confirm(msg),
      logInfo: (msg) => console.info(`[Blockly Info] ${msg}`),
      logWarning: (msg) => console.warn(`[Blockly Warning] ${msg}`),
      logError: (msg) => console.error(`[Blockly Error] ${msg}`),
      appContext: {
        user: 'Operator',
        station: 'Station 1',
        app_name: selectedApp?.name || '',
        step_name: currentStep?.title || ''
      },
      _currentBlockId: null // For tracing
    };

    const runMatchingBlocks = (codeStr, sourceId = 'Global/Screen') => {
      if (!codeStr) return;
      const lines = codeStr.split('\n');
      let capturing = false;
      let capturedCode = '';

      for (const line of lines) {
        if (line.startsWith(`// TRIGGER: ${triggerKey}`)) {
          capturing = true;
          continue;
        }
        if (capturing) {
          if (line.startsWith('// TRIGGER:')) break;
          capturedCode += line + '\n';
        }
      }

      if (capturedCode) {
        console.log(`[Blockly Runtime] Executing ${triggerKey} from ${sourceId}`);
        try {
          const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
          const run = new AsyncFunction('context', capturedCode);
          run(runtimeContext).catch(e => {
            console.error(`[Blockly Runtime] Error (${sourceId}):`, e);
            setBlocklyRuntimeError({ message: e.message, sourceId });
          });
        } catch (e) {
          console.error(`[Blockly Runtime] Parse Error (${sourceId}):`, e);
        }
      }
    };

    runMatchingBlocks(globalLogicCode, 'Global');
    runMatchingBlocks(stepLogic, 'Screen');
    if (currentStep?.components) {
      currentStep.components.forEach(comp => {
        if (comp.logic?.code) runMatchingBlocks(comp.logic.code, `Widget:${comp.id}`);
      });
    }
    if (selectedApp.config?.baseComponents) {
      selectedApp.config.baseComponents.forEach(comp => {
        if (comp.logic?.code) runMatchingBlocks(comp.logic.code, `BaseWidget:${comp.id}`);
      });
    }
  };

  const getRequiredCheckForComponent = (comp) => {
    const label = comp.props?.label || comp.type || 'Field';
    const fail = (msg = `${label} is required`) => ({ required: true, ok: false, label, error: msg });
    const pass = () => ({ required: true, ok: true, label, error: '' });

    // 1. Resolve current value based on component type
    let currentValue = null;
    switch (comp.type) {
      case 'BARCODE':
      case 'BARCODE_SCANNER': currentValue = barcodeValues[comp.id] ?? cameraScannerValues[comp.id]; break;
      case 'CAMERA_SCANNER': currentValue = cameraScannerValues[comp.id]; break;
      case 'CAMERA_CAPTURE': currentValue = cameraValues[comp.id]; break;
      case 'FILE_UPLOAD': currentValue = uploadValues[comp.id]?.url || uploadValues[comp.id]?.name; break;
      case 'PASSWORD_TEXT':
      case 'TEXT_INPUT': currentValue = textInputValues[comp.id] ?? comp.props.defaultValue; break;
      case 'TEXT_AREA': currentValue = textAreaValues[comp.id] ?? comp.props.defaultValue; break;
      case 'DROPDOWN': currentValue = dropdownValues[comp.id] ?? comp.props.defaultValue; break;
      case 'RADIO_GROUP': currentValue = radioValues[comp.id] ?? comp.props.defaultValue; break;
      case 'MULTI_SELECT': currentValue = multiSelectValues[comp.id] || comp.props.defaultValues; break;
      case 'NUMBER_INPUT': currentValue = numberInputValues[comp.id] ?? comp.props.defaultValue; break;
      case 'DATE_PICKER': currentValue = dateValues[comp.id] ?? comp.props.defaultValue; break;
      case 'DATETIME_PICKER': currentValue = dateTimeValues[comp.id] ?? comp.props.defaultValue; break;
      case 'DRAW_CANVAS': currentValue = drawValues[comp.id]; break;
      case 'SIGNATURE': currentValue = signatureWidgetValues[comp.id]; break;
      case 'QUALITY_PASS_FAIL': currentValue = qualityResult[comp.id]; break;
      case 'QUALITY_TOLERANCE': currentValue = toleranceValues[comp.id]; break;
      case 'CHECKBOX': currentValue = toggleState[comp.id] != null ? toggleState[comp.id] : (comp.props.checked ?? comp.props.defaultValue ?? false); break;
      case 'CHECKLIST': {
        const ck = checklistState[comp.id] || new Set();
        const requiredCount = (comp.props.items || []).length;
        currentValue = (requiredCount > 0 && ck.size < requiredCount) ? null : 'DONE';
        break;
      }
      case 'VISION_MEASUREMENT': currentValue = visionValues[comp.id]; break;
      default: currentValue = null;
    }

    // 2. Perform Variable-Level Validation (Tulip Style)
    // If a component is linked to a variable, we MUST validate against the variable's rules.
    const targetVarName = comp.props?.targetVariable || (comp.props?.dataSourceType === 'VARIABLE' ? comp.props?.varSource : null);
    if (targetVarName) {
      const vDef = appVariables.find(v => v.name === targetVarName);
      if (vDef) {
        const result = validateVariable(vDef, currentValue);
        if (!result.isValid) return fail(result.message);
      }
    }

    // 3. Fallback to Component-Level "Required" Prop
    if (!comp?.props?.required) {
      return { required: false, ok: true, label, error: '' };
    }

    // Component-specific legacy checks
    if (currentValue === null || currentValue === undefined || String(currentValue).trim() === '') {
      if (comp.type === 'SIGNATURE') return fail('Signature is required');
      if (comp.type === 'QUALITY_PASS_FAIL') return fail('Pass/Fail decision is required');
      if (comp.type === 'CHECKLIST') return fail('Complete all checklist items');
      return fail();
    }

    // Specialized Logic for Tolerance
    if (comp.type === 'QUALITY_TOLERANCE') {
      const val = parseFloat(currentValue);
      if (isNaN(val)) return fail('Tolerance value is required');
      if (comp.props.min != null && comp.props.max != null && (val < comp.props.min || val > comp.props.max)) {
        return fail('Value out of tolerance range');
      }
    }

    return pass();
  };

  const validateRequiredWidgetsForStep = (step) => {
    const errors = {};
    const components = step?.components || [];

    components.forEach((comp) => {
      const check = getRequiredCheckForComponent(comp);
      if (!check.required) return;
      if (!check.ok) errors[comp.id] = check.error;
    });

    return { ok: Object.keys(errors).length === 0, errors };
  };

  const getStepRequiredSummary = (step) => {
    const comps = step?.components || [];
    const requiredComps = comps.filter(c => c?.props?.required);
    if (requiredComps.length === 0) return { total: 0, done: 0, ok: true };

    const checks = requiredComps.map(c => getRequiredCheckForComponent(c));
    const done = checks.filter(c => c.ok).length;
    return { total: requiredComps.length, done, ok: done === requiredComps.length };
  };

  const canNavigateToStep = (targetIdx) => {
    // Always allowed to go back
    if (targetIdx <= currentStepIndex) return true;

    // Only allow going to the very next step
    if (targetIdx > currentStepIndex + 1) return false;

    // To go to the next step, the current step must be complete
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return true;

    const summary = getStepRequiredSummary(currentStep);
    return summary.ok;
  };

  const scrollToFirstInvalidWidget = (errors) => {
    const firstInvalidId = Object.keys(errors || {})[0];
    if (!firstInvalidId) return;

    const container = widgetContainerRefs.current[firstInvalidId];
    if (!container) return;

    container.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      const focusTarget = container.querySelector('input:not([type="hidden"]), select, textarea, button');
      if (focusTarget && typeof focusTarget.focus === 'function') {
        focusTarget.focus({ preventScroll: true });
      }
    }, 220);
  };

  const handleFinalizeWithSignature = async () => {
    if (!signature.trim()) {
      alert('Operator ID is required for governance sign-off.');
      return;
    }

    if (!signatureImage) {
      alert('Please provide a handwritten signature before finalizing.');
      return;
    }

    const totalTime = timer;
    setStatus('READY');
    stopTimer();

    try {
      let signatureUrl = '';
      if (signatureImage) {
        const targetId = selectedManual?.id || selectedApp?.id || 'session';
        const path = `signatures/${targetId}/${Date.now()}_${signature}.png`;
        signatureUrl = await uploadManualImage(path, signatureImage);
      }

      const savedData = {
        video_name: `LIVE_${selectedApp ? selectedApp.name : (selectedManual?.title || 'Unknown')}_${new Date().getTime()}`,

        measurements: {
          manual_id: selectedManual?.id || selectedApp?.id,
          manual_title: selectedManual?.title || selectedApp?.name,
          total_time: totalTime,
          workstation: 'WS-01',
          operator_id: signature,
          has_signature: true,
          signature_url: signatureUrl,
          signature_widget_data: signatureWidgetValues
        },
        cycle_data: cycleData,
        quality_data: qualityData,
        work_order: currentWorkOrder,
        narration: `Live completion with sign-off by ${signature}`
      };

      const eventData = {
        event_type: AUDIT_EVENTS.CYCLE_COMPLETE,
        operator_id: signature || 'anonymous',
        station_id: 'WS-01' || 'N/A',
        // work_order: currentWorkOrder || 'N/A', // Column missing in DB
        payload: {
          id: selectedManual?.id || selectedApp?.id,
          totalTime,
          quality: qualityData,
          work_order: currentWorkOrder || 'N/A'
        },
        created_at: new Date().toISOString()
      };

      await saveLiveMeasurement(savedData);

      // --- NATIVE ANALYTICS: LOG COMPLETION ---
      if (selectedApp) {
        console.log('[App] Selected Application:', selectedApp);
        try {
          const { logCompletion } = await import('../utils/database');
          await logCompletion(selectedApp.id, {
            duration: totalTime,
            workOrder: currentWorkOrder,
            operator: signature,
            status: 'COMPLETED',
            stepCount: cycleData.length
          });
          console.log(`[Analytics] Logged completion for app ${selectedApp.id}`);
        } catch (analyticsErr) {
          console.error('Failed to log completion for analytics:', analyticsErr);
        }
      }

      // Enterprise Sync: Webhook trigger
      await webhookUtility.syncProductionRecord({
        ...savedData.measurements,
        steps: cycleData
      });

      alert('Cycle completed and signed off successfully!');
    } catch (err) {
      console.error('Failed to save cycle:', err);
      alert(`Cycle completed, but failed to save to database: ${err.message || err}`);

    }

    setSelectedManual(null);
    setSelectedApp(null);
    Object.keys(cameraScannerStreams.current).forEach((id) => stopCameraScanner(id));
    setMachineData({});
    // Disconnect IoT if moving back to selection
    iotConnector.subscriptions.forEach((_, topic) => iotConnector.unsubscribe(topic));
    setTimer(0);
    setSignature('');
    setSignatureImage('');
    setShowSignaturePad(false);
  };

  const generateCompletionRecord = (status, customVariables = null) => {
    if (!selectedApp) return null;
    const currentVars = customVariables || appVariables.reduce((acc, v) => ({ ...acc, [v.name]: v.value }), {});
    return {
      appId: selectedApp.id,
      appName: selectedApp.name,
      appVersion: selectedApp.meta?.version || 1,
      userId: 'Operator', // TODO: Get from auth context
      userEmail: 'operator@example.com',
      stationName: 'Station 1', // TODO: Get from station context
      startTime: new Date(Date.now() - (timer * 1000)).toISOString(),
      endTime: new Date().toISOString(),
      durationMs: timer * 1000,
      status: status,
      variables: currentVars,
      stepHistory: cycleData,
      metadata: { workOrder: currentWorkOrder }
    };
  };

  const resetVariablesOnCompletion = () => {
    setAppVariables(prev => prev.map(v => ({
      ...v,
      value: v.clearOnCompletion ? v.defaultValue : v.value
    })));
  };

  const handleCompleteApp = async () => {
    const record = generateCompletionRecord('COMPLETED');
    if (record) await saveCompletion(record);
    resetVariablesOnCompletion();
    handleAbort(true); // true = silent, don't ask for confirmation
  };

  const handleCancelApp = async () => {
    const record = generateCompletionRecord('CANCELED');
    if (record) await saveCompletion(record);
    // Explicitly clear all variables on cancel
    setAppVariables(prev => prev.map(v => ({ ...v, value: v.defaultValue })));
    handleAbort(true);
  };

  const handleSaveAppData = async () => {
    // Save snapshot without resetting anything or aborting
    const record = generateCompletionRecord('SAVED');
    if (record) await saveCompletion(record);
    alert('App data saved successfully.');
  };

  const handlePrevStep = async () => {
    const activeSteps = selectedApp ? (selectedApp.config?.steps || []) : (selectedManual?.content?.steps || []);
    if (currentStepIndex > 0) {
      const exitStep = activeSteps[currentStepIndex];
      await fireStepTriggers(exitStep, 'ON_STEP_EXIT');
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleNextStep = async () => {
    const activeSteps = selectedApp ? (selectedApp.config?.steps || []) : (selectedManual?.content?.steps || []);
    const currentStep = activeSteps[currentStepIndex];

    if (selectedApp && currentStep) {
      const validation = validateRequiredWidgetsForStep(currentStep);
      if (!validation.ok) {
        setValidationErrors(validation.errors);
        setShowValidationPanel(true);
        scrollToFirstInvalidWidget(validation.errors);
        alert(`Please complete required fields first (${Object.keys(validation.errors).length} missing/invalid).`);
        return;
      }
    }

    setValidationErrors({});
    const currentTime = timer;

    // Record step completion
    const newStepData = {
      step: activeSteps[currentStepIndex]?.title || `Step ${currentStepIndex + 1}`,
      duration: currentTime - (cycleData.reduce((acc, s) => acc + s.duration, 0))
    };

    const updatedCycleData = [...cycleData, newStepData];
    setCycleData(updatedCycleData);

    // Fire ON_STEP_EXIT for current step
    const exitStep = activeSteps[currentStepIndex];
    await fireStepTriggers(exitStep, 'ON_STEP_EXIT');

    if (currentStepIndex < activeSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);

      // Fire ON_STEP_ENTER for the next step
      const enterStep = activeSteps[currentStepIndex + 1];
      await fireStepTriggers(enterStep, 'ON_STEP_ENTER');

      // Update IoT subscriptions for new step
      if (selectedApp) {
        const nextStep = activeSteps[currentStepIndex + 1];
        const newMachineComps = nextStep?.components?.filter(c => c.type === 'MACHINE_STATUS') || [];
        newMachineComps.forEach(comp => {
          if (comp.props?.topic && !iotConnector.subscriptions.has(comp.props.topic)) {
            iotConnector.subscribe(comp.props.topic, (val) => {
              setMachineData(prev => ({ ...prev, [comp.props.topic]: val }));
            });
          }
        });
      }
    } else {
      setShowSignaturePad(true);
      stopTimer();
    }
  };

  const handleCompleteUnit = () => {
    // Increment all quantity loggers in the current step (Tulip style)
    const activeStep = (selectedApp?.config?.steps || [])[currentStepIndex];
    if (activeStep) {
      const loggers = activeStep.components.filter(c => c.type === 'QUANTITY_LOGGER');
      if (loggers.length > 0) {
        setQuantityLog(prev => {
          const next = { ...prev };
          loggers.forEach(l => {
            const cur = next[l.id] || { completed: 0, target: l.props.targetQty || 100 };
            next[l.id] = { ...cur, completed: cur.completed + 1 };
          });
          return next;
        });
        logEvent({
          type: AUDIT_EVENTS.TRANSITION,
          user: 'Operator',
          workstation: 'WS-01',
          workOrder: currentWorkOrder,
          details: { action: 'COMPLETE_UNIT', count: 1 }
        });
      } else {
        // If no logger, just move to next step or show success
        handleNextStep();
      }
    }
  };

  const handleLogDefect = () => {
    if (!defectType) return;
    const newDefect = {
      type: defectType,
      count: defectCount,
      timestamp: new Date().toISOString(),
      step: (selectedApp?.config?.steps || [])[currentStepIndex]?.title || 'Unknown'
    };
    setDefectLog(prev => [...prev, newDefect]);
    logEvent({
      type: AUDIT_EVENTS.ERROR_OCCURRED,
      user: 'Operator',
      workstation: 'WS-01',
      workOrder: currentWorkOrder,
      details: { action: 'LOG_DEFECT', ...newDefect }
    });
    setShowDefectModal(false);
    setDefectType('');
    setDefectCount(1);
  };

  const handleTriggerAndon = () => {
    if (!andonCategory) return;

    const andonData = {
      startTime: new Date().getTime(),
      category: andonCategory,
      detail: andonDetail
    };

    setActiveAndon(andonData);
    setStatus('DOWN');
    setShowAndonModal(false);

    logEvent({
      type: AUDIT_EVENTS.ERROR_OCCURRED,
      user: appContext.user || 'Operator',
      workstation: appContext.station || 'WS-01',
      workOrder: currentWorkOrder,
      details: { action: 'ANDON_TRIGGERED', ...andonData }
    });
  };

  const handleResolveAndon = () => {
    if (!activeAndon) return;

    const endTime = new Date().getTime();
    const downtimeMs = endTime - activeAndon.startTime;
    const downtimeSecs = Math.round(downtimeMs / 1000);

    logEvent({
      type: AUDIT_EVENTS.TRANSITION,
      user: appContext.user || 'Operator',
      workstation: appContext.station || 'WS-01',
      workOrder: currentWorkOrder,
      details: {
        action: 'ANDON_RESOLVED',
        category: activeAndon.category,
        downtimeSeconds: downtimeSecs
      }
    });

    setActiveAndon(null);
    setAndonCategory('');
    setAndonDetail('');
    setStatus('READY'); // Or previously active status if you track it
  };

  const handleButtonAction = async (props, comp) => {
    const label = (comp.props?.label || comp.props?.text || 'Untitled').toUpperCase();

    // 1. Automatic Save Failsafe (Fallback mode)
    if (label.includes('SAVE') || label.includes('SIMPAN')) {
      const triggers = comp.props?.triggers || [];
      const hasDbAction = triggers.length > 0; // Disable failsafe if ANY trigger exists to prevent double saves

      if (!hasDbAction) {
        const firstPlaceholder = recordPlaceholders?.[0];
        if (firstPlaceholder) {
          await executeTrigger({
            enabled: true,
            actions: [{ type: 'TABLE_RECORD_SAVE', placeholderId: firstPlaceholder.id }]
          });
        } else {
          console.warn('[LiveTerminal] Button detected as SAVE but no Record Placeholder found in App/Manual config.');
          toast.error('❌ Tombol SIMPAN terdeteksi, tapi Aplikasi ini belum memiliki "Record Placeholder" (Tabel) yang dikonfigurasi.', { duration: 5000 });
        }
      }
    }

    // 2. Execute custom triggers if any (Tulip-style)
    await fireWidgetTriggers(comp, 'ON_CLICK');

    // 3. Reset logic removed - now strictly triggered by APP_REFRESH or explicit triggers


    const action = props.action;
    switch (action) {
      case 'NEXT_STEP':
        await handleNextStep();
        break;
      case 'PREV_STEP': {
        const prevSteps = selectedApp ? (selectedApp.config?.steps || []) : [];
        await fireStepTriggers(prevSteps[currentStepIndex], 'ON_STEP_EXIT');
        const newIdx = Math.max(0, currentStepIndex - 1);
        setCurrentStepIndex(newIdx);
        await fireStepTriggers(prevSteps[newIdx], 'ON_STEP_ENTER');
        break;
      }
      case 'GO_TO_STEP': {
        if (props.targetStepId) {
          const goToSteps = selectedApp ? (selectedApp.config?.steps || []) : [];
          const targetIndex = (goToSteps || []).findIndex(s => s.id === props.targetStepId);
          if (targetIndex !== -1) {
            await fireStepTriggers(goToSteps[currentStepIndex], 'ON_STEP_EXIT');
            setCurrentStepIndex(targetIndex);
            await fireStepTriggers(goToSteps[targetIndex], 'ON_STEP_ENTER');
          }
        }
        break;
      }
      case 'COMPLETE_APP':
        await handleCompleteApp();
        break;
      case 'CANCEL_APP':
        await handleCancelApp();
        break;
      case 'COMPLETE':
        if (selectedApp) {
          const appSteps = selectedApp.config?.steps || [];
          const currentStep = appSteps[currentStepIndex];
          const validation = validateRequiredWidgetsForStep(currentStep);
          if (!validation.ok) {
            setValidationErrors(validation.errors);
            setShowValidationPanel(true);
            scrollToFirstInvalidWidget(validation.errors);
            alert(`Please complete required fields first (${Object.keys(validation.errors).length} missing/invalid).`);
            return;
          }
          setValidationErrors({});
        }
        setShowSignaturePad(true);
        stopTimer();
        break;
      default:
        break;
    }
  };

  const handleAbort = (silent = false) => {
    if (silent || window.confirm('Abort current cycle? Progress will be lost.')) {
      stopTimer();
      setStatus('READY');
      setSelectedManual(null);
      setSelectedApp(null);
      Object.keys(cameraScannerStreams.current).forEach((id) => stopCameraScanner(id));
      setTimer(0);
      setShowSignaturePad(false);
      setSignature('');
    }
  };

  const renderComponent = (comp) => {
    if (!comp) return null;

    // 1. Base Props
    let resolvedProps = { ...comp.props };
    const isDark = selectedApp?.config?.appThemeMode === 'DARK';

    // 2. Resolve Data Bindings (@Variable, @Record.Field)
    const propsToResolve = ['text', 'label', 'defaultValue', 'value', 'placeholder', 'src', 'picture', 'title', 'url', 'varSource', 'targetVariable'];
    propsToResolve.forEach(p => {
      const val = resolvedProps[p];
      if (typeof val === 'string') {
        if (val.startsWith('@')) {
          resolvedProps[p] = safeRender(resolveValue(val));
        } else if (val.includes('{{@')) {
          let resolvedVal = val;
          const templateRegex = /\{\{@([^}]+)\}\}/g;
          resolvedVal = resolvedVal.replace(templateRegex, (match, expression) => {
            const cleanExpr = expression.trim();
            const resolved = resolveValue('@' + cleanExpr);
            return resolved !== undefined && resolved !== null ? String(safeRender(resolved)) : '';
          });
          resolvedProps[p] = resolvedVal;
        }
      } else if (val && typeof val === 'object' && val.type === 'EXPRESSION') {
        resolvedProps[p] = safeRender(evaluateExpression(val.value));
      }
    });

    // 3. Resolve IoT Binding if present
    if (comp.props.iotTopicId && machineData[comp.props.iotTopicId] !== undefined) {
      const iotVal = machineData[comp.props.iotTopicId];
      if (comp.type === 'GAUGE' || comp.type === 'NUMBER_INPUT') {
        resolvedProps.value = parseFloat(iotVal) || 0;
      } else if (comp.type === 'TEXT' || comp.type === 'VARIABLE_TEXT') {
        resolvedProps.text = String(iotVal);
      }
    }

    const syncVariableByName = (varName, value) => {
      if (!varName || typeof varName !== 'string') return;
      const cleanVarName = varName.startsWith('@') ? varName.substring(1) : varName;
      if (cleanVarName.includes('.')) {
        const [pName, ...fPath] = cleanVarName.split('.');
        const placeholder = recordPlaceholders.find(rp => rp.name === pName || rp.id === pName);
        if (placeholder) {
          setRecordPlaceholderData(prev => {
            const currentRecord = prev[placeholder.id] || {};
            const updatedRecord = { ...currentRecord };
            let cur = updatedRecord;
            for (let i = 0; i < fPath.length - 1; i++) {
              const part = fPath[i];
              if (!cur[part] || typeof cur[part] !== 'object') {
                cur[part] = {};
              }
              cur[part] = { ...cur[part] };
              cur = cur[part];
            }
            cur[fPath[fPath.length - 1]] = value;
            return { ...prev, [placeholder.id]: updatedRecord };
          });
        }
      } else {
        setAppVariables(prev => prev.map(v => v.name === cleanVarName ? { ...v, value } : v));
      }
    };

    const syncVariable = (value) => {
      let varName = comp.props?.targetVariable || (comp.props?.dataSourceType === 'VARIABLE' ? comp.props?.varSource : null);
      syncVariableByName(varName, value);
    };

    switch (comp.type) {
      case 'PRINT_AREA':
        return (
          <div style={{
            width: '100%',
            height: '100%',
            border: (!selectedApp || !selectedApp.is_published) ? '2px dashed #ef4444' : 'none',
            backgroundColor: 'transparent',
            pointerEvents: 'none'
          }}>
            {(!selectedApp || !selectedApp.is_published) && (
               <div style={{ position: 'absolute', top: '-24px', right: 0, background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                   Print Area Boundary
               </div>
            )}
          </div>
        );
      case 'PAYMENT_GATEWAY': {
        const amount = Number(resolvedProps.amount) || 0;
        return (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--bg-panel)',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            gap: '16px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {resolvedProps.title || 'Scan to Pay'}
            </div>
            
            <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <QRCode value={`QRIS_SIMULATION_${comp.id}_${amount}`} size={180} level="H" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{resolvedProps.provider || 'Midtrans'} - {resolvedProps.method || 'QRIS'}</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Rp {amount.toLocaleString('id-ID')}
                </span>
            </div>
          </div>
        );
      }
      case 'MARKDOWN': {
        const mdContent = resolvedProps.text || '';
        return (
          <div style={{
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            padding: '16px',
            backgroundColor: resolvedProps.backgroundColor || 'transparent',
            color: resolvedProps.textColor || (isDark ? '#f8fafc' : '#0f172a'),
            borderRadius: '8px',
            boxSizing: 'border-box'
          }}>
            <div className="markdown-plan">
              <ReactMarkdown>{String(mdContent)}</ReactMarkdown>
            </div>
          </div>
        );
      }
      case 'TEXT':
      case 'LABEL':
      case 'HEADING':
      case 'PARAGRAPH': {
        const txtAlignMap = { 0: 'left', 1: 'center', 2: 'right' };
        const textContent = resolvedProps.text || resolvedProps.label || '';
        const getFontFamily = (typeface) => {
          switch (typeface) {
            case 'SERIF': return 'serif';
            case 'SANS_SERIF': return 'sans-serif';
            case 'MONOSPACE': return 'monospace';
            default: return 'inherit';
          }
        };

        const labelStyles = {
          width: '100%',
          height: '100%',
          backgroundColor: resolvedProps.backgroundColor || 'transparent',
          color: resolvedProps.textColor || resolvedProps.color || (isDark ? '#f8fafc' : '#0f172a'),
          fontSize: `${resolvedProps.fontSize || 14}px`,
          fontWeight: (resolvedProps.fontBold || resolvedProps.fontWeight === 'bold') ? 'bold' : 'normal',
          fontStyle: resolvedProps.fontItalic ? 'italic' : (resolvedProps.fontStyle || 'normal'),
          textAlign: txtAlignMap[resolvedProps.textAlignment] || resolvedProps.textAlign || 'left',
          padding: resolvedProps.hasMargins !== false ? (resolvedProps.padding || '4px 8px') : '0px',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          fontFamily: getFontFamily(resolvedProps.fontTypeface),
          textDecoration: resolvedProps.textDecoration || 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: resolvedProps.textAlignment === 1 ? 'center' : 'flex-start',
          alignItems: resolvedProps.textAlignment === 1 ? 'center' : 'flex-start',
          boxSizing: 'border-box'
        };

        if (resolvedProps.htmlFormat) {
          return (
            <div
              style={labelStyles}
              dangerouslySetInnerHTML={{ __html: textContent }}
            />
          );
        }

        return (
          <div style={labelStyles}>
            {textContent}
          </div>
        );
      }
      case 'TIMER': return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', color: comp.props.color || '#2e7d32' }}>{formatTime(timer)}</div>
          <div style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 600 }}>{comp.props.label}</div>
        </div>
      );
      case 'BARCODE': {
        const qrValue = resolvedProps.value || '1234567890';
        const isQr = resolvedProps.format === 'QR_CODE';
        return (
          <div style={{
            width: '100%',
            height: '100%',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            borderRadius: '8px',
            backgroundColor: resolvedProps.backgroundColor || (isDark ? '#1e293b' : '#fff'),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            gap: '8px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
              width: '100%'
            }}>
              {isQr ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', backgroundColor: '#fff', borderRadius: '4px' }}>
                  <QRCode
                    value={qrValue}
                    size={Math.max(40, Math.min(comp.h || 90, comp.w || 220) - (resolvedProps.showText !== false ? 35 : 20))}
                    fgColor={resolvedProps.foregroundColor || '#000000'}
                    bgColor="#ffffff"
                    style={{ height: '100%', width: 'auto', maxHeight: '100%', maxWidth: '100%' }}
                  />
                </div>
              ) : (
                <div style={{ width: '100%', height: '45px', background: `repeating-linear-gradient(90deg, ${resolvedProps.foregroundColor || (isDark ? '#94a3b8' : '#111827')} 0 2px, transparent 2px 5px)` }} />
              )}
            </div>
            {resolvedProps.showText !== false && (
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', wordBreak: 'break-all' }}>{qrValue}</div>
            )}
          </div>
        );
      }
      case 'CAMERA_SCANNER': return (
        <div key={comp.id}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>
            {comp.props.label || 'Scan Barcode / QR'}{comp.props.required ? ' *' : ''}
          </div>
          <div style={{
            border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '16px',
            backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <button
              onClick={() => setCameraScannerActive(prev => ({ ...prev, [comp.id]: true }))}
              style={{
                padding: '14px', backgroundColor: '#3b82f6', color: 'white',
                border: 'none', borderRadius: '10px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '10px', fontSize: '0.95rem'
              }}
            >
              <Barcode size={20} /> OPEN SCANNER
            </button>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                value={cameraScannerValues[comp.id] || ''}
                onChange={(e) => setCameraScannerValues(prev => ({ ...prev, [comp.id]: e.target.value }))}
                placeholder={comp.props.placeholder || 'Manual input...'}
                style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem' }}
              />
              <button
                onClick={() => applyCameraScannerValue(comp, cameraScannerValues[comp.id], 'manual')}
                style={{ padding: '12px 16px', backgroundColor: '#fff', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Apply
              </button>
            </div>

            {cameraScannerStatus[comp.id] && (
              <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} /> {cameraScannerStatus[comp.id]}
              </div>
            )}
          </div>

          {cameraScannerActive[comp.id] && (
            <UnifiedScanner
              label={comp.props.label}
              onScan={(val) => {
                applyCameraScannerValue(comp, val, 'camera');
                setCameraScannerActive(prev => ({ ...prev, [comp.id]: false }));
              }}
              onClose={() => setCameraScannerActive(prev => ({ ...prev, [comp.id]: false }))}
            />
          )}
        </div>
      );
      case 'VISION_DETECTOR': return (
        <div key={comp.id}>
          <div style={{ fontSize: '0.75rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '8px' }}>
            {comp.props.label || 'Vision AI: OCR Scanner'}{comp.props.required ? ' *' : ''}
          </div>
          <div style={{ border: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : 'white' }}>
            <div style={{ position: 'relative', width: '100%', height: '240px', backgroundColor: '#0f172a' }}>
              <Camera size={48} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              <div style={{ position: 'absolute', inset: 0, border: '2px dashed rgba(255,255,255,0.2)', margin: '40px', pointerEvents: 'none' }} />
              <video
                ref={(el) => { cameraScannerVideoRefs.current[comp.id] = el; }}
                muted playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {cameraScannerValues[comp.id] && (
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', backgroundColor: 'rgba(34, 197, 94, 0.9)', padding: '8px 12px', borderRadius: '6px', color: 'white', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} /> Extracted: {cameraScannerValues[comp.id]}
                </div>
              )}
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!cameraScannerActive[comp.id] ? (
                  <button
                    onClick={() => startCameraScanner(comp)}
                    style={{ flex: 1, padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Camera size={18} /> ENABLE CAMERA
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      setCameraScannerStatus(prev => ({ ...prev, [comp.id]: 'Extracting text...' }));
                      await new Promise(r => setTimeout(r, 1500));
                      const mockOcr = "L098-X" + Math.floor(Math.random() * 9000 + 1000);
                      applyCameraScannerValue(comp, mockOcr, 'vision');
                    }}
                    style={{ flex: 1, padding: '12px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Sparkles size={18} /> SCAN & EXTRACT
                  </button>
                )}
                {cameraScannerActive[comp.id] && (
                  <button
                    onClick={() => stopCameraScanner(comp.id)}
                    style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', color: '#64748b', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                {cameraScannerStatus[comp.id] || 'Camera provides real-time OCR text extraction for labels and part numbers.'}
              </div>
            </div>
          </div>
        </div>
      );
      case 'CAMERA_CAPTURE': {
        const photo = cameraValues[comp.id];
        return (
          <div key={comp.id}>
            <div style={{ fontSize: '0.75rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '8px' }}>
              {comp.props.label || 'Take Photo'}{comp.props.required ? ' *' : ''}
            </div>
            <div style={{ border: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : 'white' }}>
              <div style={{ position: 'relative', width: '100%', height: '240px', backgroundColor: '#0f172a' }}>
                {photo ? (
                  <img src={photo} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <video
                    ref={(el) => { cameraScannerVideoRefs.current[comp.id] = el; }}
                    muted playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraScannerActive[comp.id] ? 'block' : 'none' }}
                  />
                )}
                {!cameraScannerActive[comp.id] && !photo && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569', gap: '10px' }}>
                    <Camera size={48} color="#cbd5e1" />
                    <div style={{ fontSize: '0.8rem' }}>No image captured</div>
                  </div>
                )}
              </div>
              <div style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                {photo ? (
                  <button
                    onClick={() => { setCameraValues(prev => ({ ...prev, [comp.id]: '' })); startCameraScanner(comp); }}
                    style={{ flex: 1, padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    RETAKE PHOTO
                  </button>
                ) : (
                  <>
                    {!cameraScannerActive[comp.id] ? (
                      <button
                        onClick={() => startCameraScanner(comp)}
                        style={{ flex: 1, padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        OPEN CAMERA
                      </button>
                    ) : (
                      <button
                        onClick={() => takePhoto(comp)}
                        style={{ flex: 1, padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <Camera size={18} /> CAPTURE PHOTO
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      }
      case 'OPENCV_CAMERA': {
        return (
          <div key={comp.id} style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}>
            <OpenCvCameraWidget 
              comp={comp} 
              selectedApp={selectedApp} 
              currentWorkOrder={currentWorkOrder} 
              appVariables={appVariables}
              setAppVariables={setAppVariables} 
              fireDeviceInputTriggers={fireDeviceInputTriggers}
            />
          </div>
        );
      }
      case 'IP_CAMERA': {
        const ipUrl = comp.props.streamUrl || '';
        const proto = comp.props.protocol || 'MJPEG';
        const hasUrl = ipUrl.trim().length > 0;
        const isDark = selectedApp?.config?.appThemeMode === 'DARK';
        const buildStreamUrl = () => {
          if (!hasUrl) return '';
          if (comp.props.username && comp.props.password) {
            try { const u = new URL(ipUrl); u.username = comp.props.username; u.password = comp.props.password; return u.toString(); } catch { return ipUrl; }
          }
          return ipUrl;
        };
        const finalUrl = buildStreamUrl();
        return (
          <div key={comp.id}>
            <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '8px' }}>
              {comp.props.label || 'IP Camera'}
            </div>
            <div style={{ border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: isDark ? '#1e293b' : 'white' }}>
              <div style={{ position: 'relative', width: '100%', height: '280px', backgroundColor: '#0f172a' }}>
                {hasUrl ? (
                  proto === 'SNAPSHOT' ? (
                    <img key={Math.floor(Date.now() / (comp.props.refreshInterval || 1000))} src={finalUrl + (finalUrl.includes('?') ? '&' : '?') + 't=' + Date.now()} alt="IP Camera" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : proto === 'HLS' ? (
                    <video src={finalUrl} autoPlay muted playsInline controls={comp.props.showControls !== false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={finalUrl} alt="IP Camera MJPEG" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  )
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569', gap: '10px' }}>
                    <Webcam size={48} color="#334155" />
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>No stream URL configured</div>
                  </div>
                )}
                {comp.props.showOverlay && comp.props.overlayText && (
                  <div style={{ position: 'absolute', top: '12px', left: '12px', padding: '4px 12px', backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: '6px', color: 'white', fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>{comp.props.overlayText}</div>
                )}
                {comp.props.showOverlay && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: hasUrl ? 'rgba(34, 197, 94, 0.85)' : 'rgba(239, 68, 68, 0.85)', borderRadius: '6px', color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} />
                    {hasUrl ? 'LIVE' : 'OFFLINE'}
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                <div style={{ fontSize: '0.8rem', color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>{comp.props.label || 'IP Camera'}</div>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', backgroundColor: isDark ? '#0f172a' : '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{proto}</span>
              </div>
            </div>
          </div>
        );
      }
      case 'DRAW_CANVAS': {
        const val = drawValues[comp.id];
        return (
          <div key={comp.id}>
            <div style={{ fontSize: '0.75rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '8px' }}>
              {comp.props.label || 'Sketch / Signature'}{comp.props.required ? ' *' : ''}
            </div>
            <div style={{ border: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
              <canvas
                ref={(el) => { drawCanvasRefs.current[comp.id] = el; }}
                width={600}
                height={240}
                onMouseDown={(e) => startDrawing(comp.id, e)}
                onMouseMove={(e) => moveDrawing(comp.id, e)}
                onMouseUp={() => endDrawing(comp.id, comp)}
                onMouseLeave={() => endDrawing(comp.id, comp)}
                onTouchStart={(e) => startDrawing(comp.id, e)}
                onTouchMove={(e) => moveDrawing(comp.id, e)}
                onTouchEnd={() => endDrawing(comp.id, comp)}
                style={{ width: '100%', height: '240px', touchAction: 'none', cursor: 'crosshair' }}
              />
              <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{val ? 'Sketch recorded' : 'Draw inside the area'}</div>
                <button onClick={() => clearDrawing(comp.id, comp)} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>Clear</button>
              </div>
            </div>
          </div>
        );
      }
      case 'FILE_UPLOAD': {
        const file = uploadValues[comp.id];
        return (
          <div key={comp.id}>
            <div style={{ fontSize: '0.75rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '8px' }}>
              {comp.props.label || 'File Attachment'}{comp.props.required ? ' *' : ''}
            </div>
            <div style={{ border: `2px dashed ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '12px', padding: '24px', textAlign: 'center', backgroundColor: isDark ? '#0f172a' : '#f8fafc', position: 'relative' }}>
              <input
                type="file"
                accept={comp.props.accept || '*/*'}
                onChange={(e) => handleFileUpload(comp, e.target.files[0])}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              />
              {file ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  {file.type.startsWith('image/') ? (
                    <img src={file.url} alt="Uploaded" style={{ height: '80px', borderRadius: '4px' }} />
                  ) : (
                    <FileText size={48} color="#94a3b8" />
                  )}
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#f8fafc' : '#334155' }}>{file.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{(file.size / 1024).toFixed(1)} KB</div>
                  <button onClick={(e) => { e.stopPropagation(); setUploadValues(p => ({ ...p, [comp.id]: null })); }} style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Upload size={32} color="#94a3b8" />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Click or drag file to upload</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Supports image, pdf, and doc files</div>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'KEYBOARD_PRO': {
        const theme = comp.props.theme || 'dark';
        const isCyber = theme === 'cyber';
        const isLight = theme === 'light';
        const bg = isCyber ? '#030712' : (isLight ? '#f8fafc' : '#1e293b');
        const border = isCyber ? '#06b6d4' : (isLight ? '#e2e8f0' : '#334155');
        const keyBg = isCyber ? 'rgba(6, 182, 212, 0.1)' : (isLight ? '#ffffff' : '#334155');
        const keyText = isCyber ? '#06b6d4' : (isLight ? '#0f172a' : '#f8fafc');
        const keyBorder = isCyber ? '1px solid #06b6d4' : (isLight ? '1px solid #e2e8f0' : '1px solid #475569');

        const isShift = !!keyboardShift[comp.id];

        const rows = [
          ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
          ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
          ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace'],
          ['Space', 'Clear']
        ];

        const handleKeyClick = (k) => {
          const varName = comp.props.targetVariable;
          if (!varName) {
            console.warn('[KeyboardPro] No targetVariable set.');
            return;
          }
          const cleanVarName = varName.startsWith('@') ? varName.substring(1) : varName;
          const vDef = appVariables.find(v => v.name === cleanVarName || v.id === cleanVarName);
          let currentVal = String(vDef ? (vDef.value ?? '') : '');

          if (k === 'Shift') {
            setKeyboardShift(prev => ({ ...prev, [comp.id]: !prev[comp.id] }));
            return;
          } else if (k === 'Backspace') {
            currentVal = currentVal.substring(0, currentVal.length - 1);
          } else if (k === 'Clear') {
            currentVal = '';
          } else if (k === 'Space') {
            currentVal += ' ';
          } else {
            currentVal += isShift ? k.toUpperCase() : k.toLowerCase();
          }

          // Update variable
          syncVariable(currentVal);
          // Auto-update other inputs bound to the same variable
          (selectedApp?.config?.steps || [])[currentStepIndex]?.components?.forEach(c => {
            const cVar = c.props.targetVariable || (c.props.dataSourceType === 'VARIABLE' ? c.props.varSource : null);
            if (cVar && (cVar === varName || cVar === cleanVarName || cVar === `@${cleanVarName}`)) {
              if (c.type === 'TEXT_INPUT' || c.type === 'PASSWORD_TEXT') {
                setTextInputValues(prev => ({ ...prev, [c.id]: currentVal }));
              } else if (c.type === 'TEXT_AREA') {
                setTextAreaValues(prev => ({ ...prev, [c.id]: currentVal }));
              } else if (c.type === 'NUMBER_INPUT') {
                setNumberInputValues(prev => ({ ...prev, [c.id]: currentVal === '' ? 0 : Number(currentVal) }));
              }
            }
          });
        };

        return (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: bg,
            borderRadius: '12px',
            border: `2px solid ${border}`,
            display: 'flex',
            flexDirection: 'column',
            padding: '12px',
            gap: '8px',
            boxSizing: 'border-box',
            boxShadow: isCyber ? '0 0 15px rgba(6,182,212,0.25)' : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            userSelect: 'none'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isLight ? '#64748b' : '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span>{resolvedProps.label || 'Keyboard Pro'}</span>
              <span style={{ fontSize: '0.65rem', color: isCyber ? '#06b6d4' : '#6366f1', textTransform: 'uppercase' }}>{theme} mode</span>
            </div>
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              justifyContent: 'center'
            }}>
              {rows.map((row, rIdx) => (
                <div key={rIdx} style={{ display: 'flex', gap: '5px', justifyContent: 'center', width: '100%' }}>
                  {row.map((k, kIdx) => {
                    let flexGrow = 1;
                    if (k === 'Shift' || k === 'Backspace' || k === 'Clear') { flexGrow = 2; }
                    if (k === 'Space') { flexGrow = 6; }
                    
                    const activeKeyBg = (k === 'Shift' && isShift) 
                      ? (isCyber ? 'rgba(6, 182, 212, 0.4)' : '#6366f1') 
                      : keyBg;
                    const activeKeyText = (k === 'Shift' && isShift)
                      ? '#ffffff'
                      : keyText;

                    return (
                      <button
                        key={kIdx}
                        onClick={() => handleKeyClick(k)}
                        style={{
                          flexGrow: flexGrow,
                          flexBasis: 0,
                          height: '30px',
                          backgroundColor: activeKeyBg,
                          border: keyBorder,
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: activeKeyText,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          textTransform: (k.length === 1 && k !== 'Space') ? (isShift ? 'uppercase' : 'lowercase') : 'none',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'all 0.1s ease-in-out'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                      >
                        {k}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'NUMPAD': {
        const allowDecimal = !!comp.props.allowDecimal;
        const keys = [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          allowDecimal ? ['C', '0', '.', '⌫'] : ['C', '0', '⌫']
        ];

        const handleNumClick = (k) => {
          const varName = comp.props.targetVariable;
          if (!varName) {
            console.warn('[Numpad] No targetVariable set.');
            return;
          }
          const cleanVarName = varName.startsWith('@') ? varName.substring(1) : varName;
          const vDef = appVariables.find(v => v.name === cleanVarName || v.id === cleanVarName);
          let currentVal = String(vDef ? (vDef.value ?? '') : '');

          if (k === '⌫') {
            currentVal = currentVal.substring(0, currentVal.length - 1);
          } else if (k === 'C') {
            currentVal = '';
          } else if (k === '.') {
            if (!allowDecimal || currentVal.includes('.')) return;
            currentVal = currentVal === '' ? '0.' : currentVal + '.';
          } else {
            if (currentVal.includes('.')) {
              const parts = currentVal.split('.');
              const maxDecimals = comp.props.decimalPlaces !== undefined ? comp.props.decimalPlaces : 3;
              if (parts[1].length >= maxDecimals) {
                return;
              }
            }
            currentVal += k;
          }

          // Update variable
          const cleanVal = currentVal === '' ? 0 : parseFloat(currentVal);
          syncVariable(isNaN(cleanVal) ? 0 : cleanVal);

          // Auto-update other inputs bound to the same variable
          (selectedApp?.config?.steps || [])[currentStepIndex]?.components?.forEach(c => {
            const cVar = c.props.targetVariable || (c.props.dataSourceType === 'VARIABLE' ? c.props.varSource : null);
            if (cVar && (cVar === varName || cVar === cleanVarName || cVar === `@${cleanVarName}`)) {
              if (c.type === 'TEXT_INPUT' || c.type === 'PASSWORD_TEXT') {
                setTextInputValues(prev => ({ ...prev, [c.id]: currentVal }));
              } else if (c.type === 'TEXT_AREA') {
                setTextAreaValues(prev => ({ ...prev, [c.id]: currentVal }));
              } else if (c.type === 'NUMBER_INPUT') {
                setNumberInputValues(prev => ({ ...prev, [c.id]: currentVal }));
              }
            }
          });
        };

        return (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            border: '2px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            padding: '12px',
            gap: '10px',
            boxSizing: 'border-box',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            userSelect: 'none'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textAlign: 'center' }}>
              {resolvedProps.label || 'Numeric Numpad'}
            </div>
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {keys.map((row, rIdx) => (
                <div key={rIdx} style={{ display: 'flex', gap: '6px', flex: 1 }}>
                  {row.map((k, kIdx) => (
                    <button
                      key={kIdx}
                      onClick={() => handleNumClick(k)}
                      style={{
                        flex: 1,
                        backgroundColor: (k === 'C' || k === '⌫') ? 'rgba(239, 68, 68, 0.15)' : (k === '.' ? 'rgba(6, 182, 212, 0.15)' : '#334155'),
                        border: (k === 'C' || k === '⌫') ? '1px solid rgba(239, 68, 68, 0.3)' : (k === '.' ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid #475569'),
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: (k === 'C' || k === '⌫') ? '#fca5a5' : (k === '.' ? '#06b6d4' : '#f8fafc'),
                        fontSize: '1rem',
                        fontWeight: 800,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'all 0.1s ease-in-out'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'PASSWORD_TEXT':
      case 'TEXT_INPUT': {
        const targetVarVal = comp.props.targetVariable ? resolveValue(`@${comp.props.targetVariable}`) : undefined;
        const finalValue = targetVarVal !== undefined && targetVarVal !== `@${comp.props.targetVariable}` ? targetVarVal : (textInputValues[comp.id] != null ? textInputValues[comp.id] : (resolvedProps.value != null ? resolvedProps.value : (resolvedProps.defaultValue || '')));
        const isPassword = comp.type === 'PASSWORD_TEXT';
        return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {(resolvedProps.label || resolvedProps.text) && (
            <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '4px' }}>
              {resolvedProps.label || resolvedProps.text}{comp.props.required ? ' *' : ''}
            </div>
          )}
          <input
            id={`input-${comp.id}`}
            type={isPassword ? "password" : "text"}
            value={finalValue}
            onChange={async e => {
              const val = comp.props.mask ? applyInputMask(e.target.value, comp.props.mask) : e.target.value;
              setTextInputValues(prev => ({ ...prev, [comp.id]: val }));
              syncVariable(val);
              fireWidgetTriggers(comp, 'ON_CHANGE');
            }}
            placeholder={resolvedProps.placeholder || 'Type here...'}
            className="mavi-input"
            style={{
              width: '100%',
              flex: 1,
              padding: '10px 12px',
              border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
              borderRadius: '6px',
              fontSize: `${comp.props.fontSize || 14}px`,
              outline: 'none',
              backgroundColor: isDark ? '#0f172a' : 'white',
              color: isDark ? '#f8fafc' : '#0f172a',
              boxSizing: 'border-box'
            }}
          />
        </div>
      );}
      case 'TEXT_AREA': {
        const targetVarVal = comp.props.targetVariable ? resolveValue(`@${comp.props.targetVariable}`) : undefined;
        const finalValue = targetVarVal !== undefined && targetVarVal !== `@${comp.props.targetVariable}` ? targetVarVal : (textAreaValues[comp.id] != null ? textAreaValues[comp.id] : (comp.props.defaultValue || ''));
        return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {(resolvedProps.label || resolvedProps.text) && (
            <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '4px' }}>
              {resolvedProps.label || resolvedProps.text}{comp.props.required ? ' *' : ''}
            </div>
          )}
          <textarea
            id={`input-${comp.id}`}
            value={finalValue}
            onChange={e => {
              const val = e.target.value;
              setTextAreaValues(prev => ({ ...prev, [comp.id]: val }));
              syncVariable(val);
              fireWidgetTriggers(comp, 'ON_CHANGE');
            }}
            placeholder={comp.props.placeholder || 'Type notes...'}
            rows={comp.props.rows || 4}
            className="mavi-input"
            style={{
              width: '100%',
              flex: 1,
              padding: '10px 12px',
              border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
              borderRadius: '6px',
              fontSize: `${comp.props.fontSize || 14}px`,
              outline: 'none',
              resize: 'vertical',
              backgroundColor: isDark ? '#0f172a' : 'white',
              color: isDark ? '#f8fafc' : '#0f172a',
              boxSizing: 'border-box'
            }}
          />
        </div>
      );}
      case 'DROPDOWN': return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {(resolvedProps.label || resolvedProps.text) && (
            <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '4px' }}>
              {resolvedProps.label || resolvedProps.text}{comp.props.required ? ' *' : ''}
            </div>
          )}
          <select
            id={`input-${comp.id}`}
            value={dropdownValues[comp.id] != null ? dropdownValues[comp.id] : (resolvedProps.value != null ? resolvedProps.value : (resolvedProps.defaultValue || ''))}
            onChange={e => {
              const val = e.target.value;
              setDropdownValues(prev => ({ ...prev, [comp.id]: val }));
              syncVariable(val);
              fireWidgetTriggers(comp, 'ON_CHANGE');
            }}
            className="mavi-input"
            style={{
              width: '100%',
              flex: 1,
              padding: '10px 12px',
              border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
              borderRadius: '6px',
              fontSize: `${comp.props.fontSize || 14}px`,
              outline: 'none',
              backgroundColor: isDark ? '#0f172a' : 'white',
              color: isDark ? '#f8fafc' : '#0f172a',
              boxSizing: 'border-box'
            }}
          >
            <option value="" style={{ backgroundColor: isDark ? '#1e293b' : 'white' }}>Select...</option>
            {(comp.props.options || comp.props.elements || []).map((opt, i) => (
              <option key={i} value={opt} style={{ backgroundColor: isDark ? '#1e293b' : 'white' }}>{opt}</option>
            ))}
          </select>
        </div>
      );
      case 'RADIO_GROUP': {
        const selectedVal = radioValues[comp.id] != null ? radioValues[comp.id] : (resolvedProps.value != null ? resolvedProps.value : (comp.props.defaultValue || ''));
        return (
          <div>
            <div style={{ fontSize: '0.75rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '8px' }}>{comp.props.label}{comp.props.required ? ' *' : ''}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(comp.props.options || []).map((opt, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#334155', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`radio_${comp.id}`}
                    checked={selectedVal === opt}
                    onChange={() => {
                      setRadioValues(prev => ({ ...prev, [comp.id]: opt }));
                      syncVariable(opt);
                      fireWidgetTriggers(comp, 'ON_CHANGE');
                    }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        );
      }
      case 'CHECKLIST': {
        const ck = checklistState[comp.id] || new Set();
        const totalItems = (comp.props.items || []).length;
        const checkedCount = ck.size;
        const progressPercent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
        const allDone = totalItems > 0 && checkedCount === totalItems;

        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a' }}>{comp.props.title}</div>
              {comp.props.showProgress !== false && totalItems > 0 && (
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: allDone ? '#22c55e' : '#64748b' }}>
                  {checkedCount}/{totalItems} ({progressPercent}%)
                </div>
              )}
            </div>

            {comp.props.showProgress !== false && totalItems > 0 && (
              <div style={{ width: '100%', height: '6px', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : '#f1f5f9', borderRadius: '3px', marginBottom: '15px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: allDone ? '#22c55e' : '#3b82f6', transition: 'width 0.3s ease' }} />
              </div>
            )}
            {comp.props.items.map((item, i) => {
              const isChecked = ck.has(i);
              const darkBg = isChecked ? 'rgba(34, 197, 94, 0.2)' : '#0f172a';
              const lightBg = isChecked ? '#f0fdf4' : '#f8fafc';
              const darkBorder = isChecked ? '#22c55e' : '#334155';
              const lightBorder = isChecked ? '#86efac' : '#e2e8f0';
              return (
                <div key={i} onClick={() => {
                  const n = new Set(ck);
                  n.has(i) ? n.delete(i) : n.add(i);
                  setChecklistState(prev => ({ ...prev, [comp.id]: n }));
                  syncVariable(n.size === totalItems ? 'DONE' : null);
                  fireWidgetTriggers(comp, 'ON_CHANGE');
                }} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 12px', marginBottom: '6px', borderRadius: '6px', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? darkBg : lightBg, border: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? darkBorder : lightBorder}`, cursor: 'pointer' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${isChecked ? '#22c55e' : (selectedApp?.config?.appThemeMode === 'DARK' ? '#475569' : '#cbd5e1')}`, backgroundColor: isChecked ? '#22c55e' : (selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : 'white'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{isChecked && <span style={{ color: 'white', fontSize: '12px', fontWeight: 900 }}>{String.fromCharCode(10003)}</span>}</div>
                  <span style={{ fontSize: '0.9rem', color: isChecked ? '#22c55e' : (selectedApp?.config?.appThemeMode === 'DARK' ? '#94a3b8' : '#475569'), textDecoration: isChecked ? 'line-through' : 'none' }}>{item}</span>
                </div>
              );
            })}
            {allDone && <div style={{ padding: '8px 12px', backgroundColor: '#22c55e', color: 'white', borderRadius: '6px', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', marginTop: '8px' }}>{String.fromCharCode(10003)} All Steps Complete</div>}
          </div>
        );
      }
      case 'SIGNATURE': {
        const isAuthMode = comp.props.signatureMode === 'AUTH';
        const isSigned = !!signatureWidgetValues[comp.id];

        return (
          <div>
            <div style={{ fontSize: '0.75rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '8px' }}>{comp.props.label}{comp.props.required ? ' *' : ''}</div>
            <div style={{ border: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', padding: '12px', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : '#f8fafc' }}>
              {isAuthMode ? (
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'white', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>
                  {isSigned ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                        <CheckCircle2 size={32} />
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Identity Verified</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>{signatureWidgetValues[comp.id]}</div>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        const now = new Date().toLocaleString();
                        const operator = localStorage.getItem('frontline_operator_name') || 'AUTHORIZED_OPERATOR';
                        const sigData = `Electronically signed by ${operator} on ${now}`;
                        setSignatureWidgetValues(prev => ({ ...prev, [comp.id]: sigData }));
                        syncVariable(sigData);
                        fireWidgetTriggers(comp, 'ON_CHANGE');
                      }}
                      style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
                    >
                      <ShieldCheck size={18} /> Digital Sign-off
                    </button>
                  )}
                </div>
              ) : (
                <canvas
                  width={520}
                  height={150}
                  ref={(el) => {
                    if (el) ensureSignatureCanvas(comp.id);
                    signatureCanvasRefs.current[comp.id] = el;
                  }}
                  onMouseDown={(e) => startSignatureDraw(comp.id, e)}
                  onMouseMove={(e) => moveSignatureDraw(comp.id, e)}
                  onMouseUp={() => endSignatureDraw(comp.id, comp)}
                  onMouseLeave={() => endSignatureDraw(comp.id, comp)}
                  onTouchStart={(e) => startSignatureDraw(comp.id, e)}
                  onTouchMove={(e) => moveSignatureDraw(comp.id, e)}
                  onTouchEnd={() => endSignatureDraw(comp.id, comp)}
                  style={{ width: '100%', backgroundColor: 'white', border: '1px dashed #cbd5e1', borderRadius: '6px', touchAction: 'none' }}
                />
              )}
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: isSigned ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
                  {isSigned ? (isAuthMode ? 'Digital Signature Active' : 'Drawing Recorded') : 'Awaiting signature...'}
                </span>
                <button
                  onClick={() => {
                    if (isAuthMode) {
                      setSignatureWidgetValues(prev => ({ ...prev, [comp.id]: '' }));
                    } else {
                      clearSignatureCanvas(comp.id, comp);
                    }
                  }}
                  style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white', color: '#475569', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  {isSigned ? 'Reset' : 'Clear'}
                </button>
              </div>
            </div>
          </div>
        );
      }
      case 'MACHINE_STATUS': {
        const machineId = comp.props.machineId;
        return (
          <div style={{ backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: isDark ? '#f8fafc' : '#0f172a' }}>{comp.props.label || 'Machine Status'}</span>
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Connected</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {comp.props.attributes?.map((attr, idx) => {
                const val = machineTagValues[`${machineId}_${attr}`] || '0.00';
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>{attr}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: isDark ? '#3b82f6' : '#2563eb', fontFamily: 'monospace' }}>{val}</div>
                  </div>
                );
              })}
            </div>
            {(!comp.props.attributes || comp.props.attributes.length === 0) && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>
                No live attributes mapped to this widget.
              </div>
            )}
          </div>
        );
      }
      case 'QUALITY_PASS_FAIL': {
        const res = qualityResult[comp.id];
        return (
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a' }}>{comp.props.label}{comp.props.required ? ' *' : ''}</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setQualityResult(p => ({ ...p, [comp.id]: 'PASS' })); setQualityData(p => ({ ...p, [comp.id]: 'PASS' })); syncVariable('PASS'); fireWidgetTriggers(comp, 'ON_CHANGE'); }} style={{ flex: 1, padding: '18px', backgroundColor: res === 'PASS' ? '#16a34a' : (selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : 'white'), border: `2px solid ${res === 'PASS' ? '#16a34a' : (selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0')}`, borderRadius: '6px', color: res === 'PASS' ? 'white' : '#16a34a', fontSize: '1rem', fontWeight: 900, cursor: 'pointer' }}>PASS</button>
              <button onClick={() => { setQualityResult(p => ({ ...p, [comp.id]: 'FAIL' })); setQualityData(p => ({ ...p, [comp.id]: 'FAIL' })); syncVariable('FAIL'); fireWidgetTriggers(comp, 'ON_CHANGE'); }} style={{ flex: 1, padding: '18px', backgroundColor: res === 'FAIL' ? '#dc2626' : (selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : 'white'), border: `2px solid ${res === 'FAIL' ? '#dc2626' : (selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0')}`, borderRadius: '6px', color: res === 'FAIL' ? 'white' : '#dc2626', fontSize: '1rem', fontWeight: 900, cursor: 'pointer' }}>FAIL</button>
            </div>
            {res === 'FAIL' && <div style={{ marginTop: '10px', padding: '10px', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? 'rgba(220, 38, 38, 0.1)' : '#fef2f2', borderRadius: '6px', border: '1px solid #dc2626', color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600 }}>Defect detected - Log a defect in the right panel</div>}
          </div>
        );
      }
      case 'QUALITY_TOLERANCE': {
        const tv = parseFloat(toleranceValues[comp.id] || '');
        const inR = !isNaN(tv) && tv >= comp.props.min && tv <= comp.props.max;
        const outR = !isNaN(tv) && (tv < comp.props.min || tv > comp.props.max);
        return (
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a' }}>{comp.props.label} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({comp.props.min}-{comp.props.max} {comp.props.unit})</span></div>
            <input
              type="number"
              value={toleranceValues[comp.id] || ''}
              onChange={e => { setToleranceValues(prev => ({ ...prev, [comp.id]: e.target.value })); syncVariable(e.target.value); fireWidgetTriggers(comp, 'ON_CHANGE'); }}
              style={{
                width: '100%', padding: '12px',
                border: `2px solid ${inR ? '#22c55e' : outR ? '#ef4444' : (selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0')}`,
                borderRadius: '6px', fontSize: '1.1rem', textAlign: 'right', outline: 'none',
                backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : 'white',
                color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a'
              }}
            />
            {inR && <div style={{ marginTop: '6px', color: '#22c55e', fontSize: '0.8rem', fontWeight: 700 }}>IN TOLERANCE</div>}
            {outR && <div style={{ marginTop: '6px', color: '#dc2626', fontSize: '0.8rem', fontWeight: 700 }}>OUT OF TOLERANCE</div>}
          </div>
        );
      }
      case 'VIDEO': return (
        <div style={{ backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f8fafc', border: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 15px', borderBottom: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600, fontSize: '0.9rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a' }}><Video size={18} color="#3b82f6" />{safeRender(comp.props.title)}</div>
          {comp.props.url ? <video controls src={comp.props.url} style={{ width: '100%', maxHeight: '300px' }} /> : <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No video URL configured</div>}
        </div>
      );
      case 'PDF': return (
        <div style={{ backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f8fafc', border: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 15px', borderBottom: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600, fontSize: '0.9rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a' }}><FileText size={18} color="#ef4444" />{safeRender(comp.props.title)}</div>
          {comp.props.url ? (
            <iframe
              src={comp.props.url.includes('#') ? (comp.props.url.includes('toolbar=') ? comp.props.url : `${comp.props.url}&toolbar=0`) : `${comp.props.url}#toolbar=0`}
              style={{ width: '100%', height: '300px', border: 'none' }}
              title={comp.props.title}
            />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No PDF URL configured</div>
          )}
        </div>
      );
      case 'BUTTON':
      case 'FILE_PICKER':
      case 'IMAGE_PICKER':
      case 'CONTACT_PICKER':
      case 'PHONE_NUMBER_PICKER': {
        const borderRadiusMap = { 0: '6px', 1: '16px', 2: '0px', 3: '50%' };
        const alignmentMap = { 0: 'flex-start', 1: 'center', 2: 'flex-end' };
        
        const isFilePicker = comp.type === 'FILE_PICKER' || comp.type === 'IMAGE_PICKER';

        return (
          <div key={comp.id} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <button
              onClick={() => {
                if (isFilePicker) {
                  document.getElementById(`picker-${comp.id}`)?.click();
                }
                if (comp.props.mqttPublishTopic) {
                  const payload = comp.props.mqttPublishPayload !== undefined 
                    ? String(comp.props.mqttPublishPayload) 
                    : '1';
                  iotConnector.publish(comp.props.mqttPublishTopic, payload);
                  console.log(`[PLC HMI Button] Published ${payload} to ${comp.props.mqttPublishTopic}`);
                }
                handleButtonAction(comp.props, comp);
              }}
              className="mavi-widget-btn"
              style={{
                width: '100%',
                height: '100%',
                padding: '10px 16px',
                backgroundColor: resolvedProps.image ? 'transparent' : (resolvedProps.backgroundColor || '#2563eb'),
                backgroundImage: resolvedProps.image ? `url(${resolvedProps.image})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: resolvedProps.textColor || resolvedProps.color || '#ffffff',
                border: 'none',
                borderRadius: borderRadiusMap[resolvedProps.shape] || '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box',
                justifyContent: alignmentMap[resolvedProps.textAlignment] || alignmentMap[resolvedProps.textAlign] || 'center',
                transition: 'all 0.2s',
                fontWeight: (resolvedProps.fontBold || resolvedProps.fontWeight === 'bold' || resolvedProps.fontWeight === 700) ? 'bold' : 'normal',
                fontSize: `${resolvedProps.fontSize || 14}px`,
              }}
            >
              {resolvedProps.text || resolvedProps.label || 'Button'}
            </button>
            {isFilePicker && (
              <input
                id={`picker-${comp.id}`}
                type="file"
                accept={comp.type === 'IMAGE_PICKER' ? 'image/*' : '*/*'}
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(comp, e.target.files[0])}
              />
            )}
          </div>
        );
      }
      case 'COMPLETE_BUTTON': return (
        <button
          onClick={() => handleButtonAction({ action: 'COMPLETE' }, comp)}
          style={{
            padding: '16px',
            backgroundColor: resolvedProps.backgroundColor || '#10b981',
            color: resolvedProps.textColor || resolvedProps.color || '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: `${resolvedProps.fontSize || 18}px`,
            fontWeight: 900,
            cursor: 'pointer',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxSizing: 'border-box'
          }}
        >
          <CheckCircle2 size={22} />
          {resolvedProps.text || resolvedProps.label || 'COMPLETE'}
        </button>
      );
      case 'QUANTITY_LOGGER': {
        const lg = quantityLog[comp.id] || { completed: 0, target: comp.props.targetQty || 100 };
        const pct = Math.min(100, Math.round((lg.completed / lg.target) * 100));
        return (
          <div style={{ border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 15px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#64748b' }}>{comp.props.label}</div>
            <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: isDark ? '#0f172a' : 'white' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderRadius: '6px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}><div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Required</div><div style={{ fontSize: '1.8rem', fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a' }}>{lg.target}</div></div>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: lg.completed >= lg.target ? (isDark ? 'rgba(34, 197, 94, 0.2)' : '#f0fdf4') : (isDark ? '#1e293b' : '#f8fafc'), borderRadius: '6px', border: `1px solid ${lg.completed >= lg.target ? (isDark ? '#22c55e' : '#86efac') : (isDark ? '#334155' : '#e2e8f0')}` }}><div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Done</div><div style={{ fontSize: '1.8rem', fontWeight: 900, color: lg.completed >= lg.target ? '#22c55e' : (isDark ? '#f8fafc' : '#0f172a') }}>{lg.completed}</div></div>
              </div>
              <div style={{ height: '8px', backgroundColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', backgroundColor: lg.completed >= lg.target ? '#22c55e' : '#3b82f6', transition: 'width 0.3s' }} /></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setQuantityLog(prev => { const c = prev[comp.id] || { completed: 0, target: comp.props.targetQty || 100 }; return { ...prev, [comp.id]: { ...c, completed: Math.max(0, c.completed - 1) } } }); fireWidgetTriggers(comp, 'ON_CHANGE'); }} style={{ flex: 1, padding: '10px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '6px', backgroundColor: isDark ? '#0f172a' : 'white', color: '#ef4444', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer' }}>-1</button>
                <button onClick={() => { setQuantityLog(prev => { const c = prev[comp.id] || { completed: 0, target: comp.props.targetQty || 100 }; return { ...prev, [comp.id]: { ...c, completed: c.completed + 1 } } }); fireWidgetTriggers(comp, 'ON_CHANGE'); }} style={{ flex: 2, padding: '10px', border: '1px solid #22c55e', borderRadius: '6px', backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4', color: '#22c55e', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}>+ Add 1 Unit</button>
                <button onClick={() => { setQuantityLog(prev => { const c = prev[comp.id] || { completed: 0, target: comp.props.targetQty || 100 }; return { ...prev, [comp.id]: { ...c, completed: c.target } } }); fireWidgetTriggers(comp, 'ON_CHANGE'); }} style={{ flex: 1, padding: '10px', border: '1px solid #3b82f6', borderRadius: '6px', backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', color: '#3b82f6', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}>All</button>
              </div>
            </div>
          </div>
        );
      }
      case 'SHAPE': {
        const shapeType = comp.props.type || 'rectangle';
        const shapeColor = comp.props.backgroundColor || '#e2e8f0';
        const strokeWidth = Math.max(1, Number(comp.props.strokeWidth) || 4);

        if (shapeType === 'line') {
          return (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', height: `${strokeWidth}px`, backgroundColor: shapeColor, borderRadius: '999px' }} />
            </div>
          );
        }

        if (shapeType.startsWith('arrow_')) {
          const arrowDirection = shapeType.replace('arrow_', '');
          const isHorizontal = ['left', 'right'].includes(arrowDirection);
          const viewBox = isHorizontal ? '0 0 100 40' : '0 0 40 100';
          const pathByDirection = {
            right: 'M5 15 H65 V5 L95 20 L65 35 V25 H5 Z',
            left: 'M95 15 H35 V5 L5 20 L35 35 V25 H95 Z',
            up: 'M15 95 V35 H5 L20 5 L35 35 H25 V95 Z',
            down: 'M15 5 V65 H5 L20 95 L35 65 H25 V5 Z'
          };

          return (
            <svg viewBox={viewBox} width="100%" height="100%" preserveAspectRatio="none">
              <path d={pathByDirection[arrowDirection] || pathByDirection.right} fill={shapeColor} />
            </svg>
          );
        }

        return <div style={{ width: '100%', height: '100%', backgroundColor: shapeColor, borderRadius: shapeType === 'circle' ? '999px' : (comp.props.borderRadius || 0) + 'px' }} />;
      }
      case 'IMAGE': {
        const imgSrc = resolvedProps.picture || resolvedProps.src || resolvedProps.url || resolvedProps.text || comp.props.picture || comp.props.src || comp.props.url;
        const isCamera = comp.props.mode === 'CAMERA';

        if (isCamera && !imgSrc) {
          return (
            <div style={{ height: '100%', minHeight: '300px', backgroundColor: '#000', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', position: 'relative', overflow: 'hidden' }}>
              <Camera size={48} style={{ opacity: 0.5, marginBottom: '20px' }} />
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Camera Ready</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '8px' }}>Tap "Log Defect" to capture</div>
              <div style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(239, 68, 68, 0.8)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Live Feed</div>
            </div>
          );
        }

        return imgSrc ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {resolvedProps.label && <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>{resolvedProps.label}</div>}
            <img src={imgSrc} alt={comp.props.alt || 'Image'} style={{ width: '100%', height: 'auto', maxHeight: '100%', borderRadius: '12px', display: 'block', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
          </div>
        ) : (
          <div style={{ padding: '40px', height: '100%', minHeight: '200px', backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `2px dashed ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#94a3b8' }}>
            <ImageIcon size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{resolvedProps.label || 'Product Image'}</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>No image data available for this record</div>
          </div>
        );
      }
      case 'VARIABLE_TEXT': {
        let vv = '';
        const varSource = resolvedProps.varSource || comp.props.varSource || resolvedProps.targetVariable || comp.props.targetVariable;

        if (comp.props.iotTopicId && machineData[comp.props.iotTopicId] !== undefined) {
          vv = String(machineData[comp.props.iotTopicId]);
        } else if (comp.props.dataSourceType === 'TABLE_RECORD') {
          vv = boundData[comp.id] || 'Loading...';
        } else if (comp.props.dataSourceType === 'SELECTED_TABLE_ROW') {
          const parts = String(varSource || '').split('.'); // e.g., TABLE_RECORD.tableId.columnName
          if (parts.length === 3) {
            const tableId = parts[1];
            const columnName = parts[2];
            const selected = selectedTableRow[tableId];
            vv = selected ? selected[columnName] : '';
          }
        } else if (typeof varSource === 'string' && varSource.startsWith('@')) {
          vv = resolveValue(varSource);
        } else {
          if (varSource === 'APP_INFO.USER') vv = appContext.user;
          else if (varSource === 'APP_INFO.STATION') vv = appContext.station;
          else if (varSource === 'APP_INFO.STEP_NAME') vv = activeStep && activeStep.title || '';
          else if (varSource === 'APP_INFO.APP_NAME') vv = selectedApp && selectedApp.name || '';
          else {
            const v = appVariables.find(av => av.name === varSource);
            vv = v ? v.value : '{' + varSource + '}';
          }
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: comp.props.textAlign }}>
            {comp.props.label && (
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                {comp.props.label}
              </div>
            )}
            <div style={{
              fontSize: (comp.props.fontSize || 18) + 'px',
              color: comp.props.color || (selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a'),
              fontWeight: comp.props.fontWeight || 700,
              fontStyle: comp.props.fontStyle
            }}>
              {safeRender(vv)}

            </div>
          </div>
        );
      }
      case 'SCADA_PIPE': {
        const dir = comp.props.direction || 'horizontal';
        const isH = dir === 'horizontal';
        const fluidColor = comp.props.fluidColor || '#06b6d4';
        const flowSpeed = Number(comp.props.flowSpeed) || 2;
        const activeVarVal = comp.props.targetVariable ? resolveValue(`@${comp.props.targetVariable}`) : undefined;
        const isActive = activeVarVal !== undefined ? (!!activeVarVal && activeVarVal !== '0' && activeVarVal !== 0 && activeVarVal !== 'false') : (comp.props.isActive !== false);
        const flowAnimName = `flow-dash-run-${comp.id}`;
        
        let isCommLost = false;
        let isAlarmActive = false;
        const targetVar = comp.props.targetVariable;
        if (targetVar) {
          const cleanVar = targetVar.startsWith('@') ? targetVar.substring(1) : targetVar;
          isAlarmActive = alarms.some(a => a.source === cleanVar && a.status === 'UNACK');
          try {
            const parsedCtrls = window.mavi_plc_controllers;
            const parsedTags = window.mavi_plc_tags;
            if (parsedCtrls && parsedTags) {
              const cleanVar = targetVar.startsWith('@') ? targetVar.substring(1) : targetVar;
              const matchingTag = parsedTags.find(t => t.name === cleanVar);
              if (matchingTag) {
                const ctrl = parsedCtrls.find(c => c.id === matchingTag.controllerId);
                if (ctrl && ctrl.status === 'disconnected') {
                  isCommLost = true;
                }
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        return (
          <div style={{
            width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            border: isAlarmActive ? '2px solid #ef4444' : 'none',
            animation: isAlarmActive ? 'scada-alarm-blink 1s step-end infinite' : 'none'
          }}>
            <style>{`
              @keyframes ${flowAnimName} {
                to {
                  stroke-dashoffset: ${isH ? '-20' : '20'};
                }
              }
              @keyframes scada-alarm-blink {
                0%, 100% { border-color: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.7); }
                50% { border-color: transparent; box-shadow: none; }
              }
            `}</style>
            <svg width="100%" height="100%" style={{ display: 'block' }}>
              {isH ? (
                <rect x="0" y="2" width="100%" height="20" rx="3" fill="#475569" stroke="#334155" strokeWidth="1" />
              ) : (
                <rect x="2" y="0" width="20" height="100%" rx="3" fill="#475569" stroke="#334155" strokeWidth="1" />
              )}
              {isH ? (
                <line x1="0" y1="12" x2="100%" y2="12" stroke={fluidColor} strokeWidth="6" strokeDasharray="10,10" style={{ animation: isActive ? `${flowAnimName} ${6 - flowSpeed}s linear infinite` : 'none' }} />
              ) : (
                <line x1="12" y1="0" x2="12" y2="100%" stroke={fluidColor} strokeWidth="6" strokeDasharray="10,10" style={{ animation: isActive ? `${flowAnimName} ${6 - flowSpeed}s linear infinite` : 'none' }} />
              )}
              {isH ? (
                <rect x="0" y="4" width="100%" height="4" fill="rgba(255,255,255,0.15)" />
              ) : (
                <rect x="4" y="0" width="4" height="100%" fill="rgba(255,255,255,0.15)" />
              )}
            </svg>
            {isCommLost && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'repeating-linear-gradient(45deg, rgba(30, 41, 59, 0.95), rgba(30, 41, 59, 0.95) 10px, rgba(71, 85, 105, 0.95) 10px, rgba(71, 85, 105, 0.95) 20px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#ef4444', fontWeight: 900, fontSize: '0.55rem', zIndex: 10, border: '1px solid #ef4444'
              }}>
                <span>COMM LOST</span>
              </div>
            )}
          </div>
        );
      }
      case 'SCADA_VALVE': {
        const stateMode = comp.props.valveState || 'CLOSED';
        const targetVar = comp.props.targetVariable;
        let isValveOpen = false;
        if (stateMode === 'AUTO') {
          if (targetVar) {
            const varVal = resolveValue(`@${targetVar}`);
            isValveOpen = !!varVal && varVal !== '0' && varVal !== 'CLOSED' && varVal !== 'false' && varVal !== false && varVal !== 0;
          }
        } else {
          isValveOpen = stateMode === 'OPEN';
        }
        const openColor = comp.props.colorOpen || '#22c55e';
        const closedColor = comp.props.colorClosed || '#ef4444';
        const valveColor = isValveOpen ? openColor : closedColor;

        let isCommLost = false;
        let isAlarmActive = false;
        if (targetVar) {
          const cleanVar = targetVar.startsWith('@') ? targetVar.substring(1) : targetVar;
          isAlarmActive = alarms.some(a => a.source === cleanVar && a.status === 'UNACK');
          try {
            const parsedCtrls = window.mavi_plc_controllers;
            const parsedTags = window.mavi_plc_tags;
            if (parsedCtrls && parsedTags) {
              const cleanVar = targetVar.startsWith('@') ? targetVar.substring(1) : targetVar;
              const matchingTag = parsedTags.find(t => t.name === cleanVar);
              if (matchingTag) {
                const ctrl = parsedCtrls.find(c => c.id === matchingTag.controllerId);
                if (ctrl && ctrl.status === 'disconnected') {
                  isCommLost = true;
                }
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        const handleValveClick = () => {
          setActiveControlDevice(comp);
        };

        return (
          <div 
            onClick={handleValveClick}
            style={{
              width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none', position: 'relative',
              borderRadius: '8px',
              border: isAlarmActive ? '2px solid #ef4444' : 'none',
              animation: isAlarmActive ? 'scada-alarm-blink 1s step-end infinite' : 'none'
            }}
          >
            <svg viewBox="0 0 60 60" width="100%" height="100%">
              <rect x="5" y="20" width="4" height="20" rx="1" fill="#475569" />
              <rect x="51" y="20" width="4" height="20" rx="1" fill="#475569" />
              <line x1="9" y1="30" x2="51" y2="30" stroke="#475569" strokeWidth="6" />
              <polygon points="10,20 10,40 30,30" fill={valveColor} stroke="#334155" strokeWidth="1.5" />
              <polygon points="50,20 50,40 30,30" fill={valveColor} stroke="#334155" strokeWidth="1.5" />
              <circle cx="30" cy="30" r="6" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
              <line x1="30" y1="24" x2="30" y2="10" stroke="#64748b" strokeWidth="4" />
              <ellipse cx="30" cy="8" rx="12" ry="4" fill={isValveOpen ? openColor : '#64748b'} stroke="#334155" strokeWidth="1.5" />
            </svg>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: valveColor, marginTop: '-2px', textTransform: 'uppercase' }}>
              {isValveOpen ? 'OPEN' : 'CLOSED'}
            </span>
            {isCommLost && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'repeating-linear-gradient(45deg, rgba(30, 41, 59, 0.95), rgba(30, 41, 59, 0.95) 10px, rgba(71, 85, 105, 0.95) 10px, rgba(71, 85, 105, 0.95) 20px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#ef4444', fontWeight: 900, fontSize: '0.55rem', zIndex: 10, borderRadius: '8px', border: '1px solid #ef4444'
              }}>
                <span style={{ fontSize: '0.75rem' }}>⚠️</span>
                <span>COMM LOST</span>
              </div>
            )}
          </div>
        );
      }
      case 'SCADA_TANK': {
        const targetVar = comp.props.targetVariable;
        const capacity = Number(comp.props.capacity) || 100;
        const unit = comp.props.unit || 'L';
        const fluidColor = comp.props.fluidColor || '#3b82f6';
        let currentVal = 0;
        if (targetVar) {
          const resolved = parseFloat(resolveValue(`@${targetVar}`));
          currentVal = isNaN(resolved) ? 0 : resolved;
        } else {
          currentVal = parseFloat(resolvedProps.value || resolvedProps.defaultValue) || 0;
        }
        const fillPct = Math.max(0, Math.min(100, Math.round((currentVal / capacity) * 100)));
        const displayVal = comp.props.showLabel !== false ? `${currentVal} ${unit}` : '';

        let isCommLost = false;
        let isAlarmActive = false;
        if (targetVar) {
          const cleanVar = targetVar.startsWith('@') ? targetVar.substring(1) : targetVar;
          isAlarmActive = alarms.some(a => a.source === cleanVar && a.status === 'UNACK');
          try {
            const parsedCtrls = window.mavi_plc_controllers;
            const parsedTags = window.mavi_plc_tags;
            if (parsedCtrls && parsedTags) {
              const cleanVar = targetVar.startsWith('@') ? targetVar.substring(1) : targetVar;
              const matchingTag = parsedTags.find(t => t.name === cleanVar);
              if (matchingTag) {
                const ctrl = parsedCtrls.find(c => c.id === matchingTag.controllerId);
                if (ctrl && ctrl.status === 'disconnected') {
                  isCommLost = true;
                }
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        return (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: '6px', backgroundColor: '#0f172a', borderRadius: '12px', overflow: 'hidden', position: 'relative',
            border: isAlarmActive ? '2px solid #ef4444' : `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            animation: isAlarmActive ? 'scada-alarm-blink 1s step-end infinite' : 'none'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textAlign: 'center', marginBottom: '6px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {comp.props.label || 'Storage Tank'}
            </div>
            <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '85%',
                height: '100%',
                border: '2.5px solid #475569',
                borderRadius: '10px 10px 14px 14px',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#020617'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${fillPct}%`,
                  backgroundColor: fluidColor,
                  transition: 'height 0.4s ease-out',
                  opacity: 0.85
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '5px',
                    background: 'rgba(255,255,255,0.4)',
                    borderRadius: '50%'
                  }} />
                </div>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', fontWeight: 'bold', pointerEvents: 'none' }}>
                  <div>100%</div>
                  <div>75%</div>
                  <div>50%</div>
                  <div>25%</div>
                  <div>0%</div>
                </div>
                {comp.props.showLabel !== false && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid #475569',
                    color: '#f8fafc',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    textAlign: 'center',
                    pointerEvents: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)'
                  }}>
                    {displayVal}
                  </div>
                )}
              </div>
            </div>
            {isCommLost && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'repeating-linear-gradient(45deg, rgba(30, 41, 59, 0.95), rgba(30, 41, 59, 0.95) 10px, rgba(71, 85, 105, 0.95) 10px, rgba(71, 85, 105, 0.95) 20px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#ef4444', fontWeight: 900, fontSize: '0.65rem', zIndex: 10, borderRadius: '12px', border: '1.5px solid #ef4444'
              }}>
                <span style={{ fontSize: '0.9rem' }}>⚠️</span>
                <span>COMM LOST</span>
              </div>
            )}
          </div>
        );
      }
      case 'SCADA_PUMP': {
        const mode = comp.props.pumpState || 'STOPPED';
        const targetVar = comp.props.targetVariable;
        let status = mode;
        if (mode === 'AUTO') {
          if (targetVar) {
            const varVal = resolveValue(`@${targetVar}`);
            const isAutoRunning = !!varVal && varVal !== '0' && varVal !== 'STOPPED' && varVal !== 'false' && varVal !== false && varVal !== 0;
            status = isAutoRunning ? 'RUNNING' : 'STOPPED';
          } else {
            status = 'STOPPED';
          }
        }

        const isRunning = status === 'RUNNING';
        const runColor = comp.props.colorRunning || '#22c55e';
        const stopColor = comp.props.colorStopped || '#ef4444';
        const faultColor = comp.props.colorFault || '#eab308';
        
        let pumpColor = stopColor;
        if (status === 'RUNNING') pumpColor = runColor;
        else if (status === 'FAULT') pumpColor = faultColor;

        let isCommLost = false;
        let isAlarmActive = false;
        if (targetVar) {
          const cleanVar = targetVar.startsWith('@') ? targetVar.substring(1) : targetVar;
          isAlarmActive = alarms.some(a => a.source === cleanVar && a.status === 'UNACK');
          try {
            const parsedCtrls = window.mavi_plc_controllers;
            const parsedTags = window.mavi_plc_tags;
            if (parsedCtrls && parsedTags) {
              const cleanVar = targetVar.startsWith('@') ? targetVar.substring(1) : targetVar;
              const matchingTag = parsedTags.find(t => t.name === cleanVar);
              if (matchingTag) {
                const ctrl = parsedCtrls.find(c => c.id === matchingTag.controllerId);
                if (ctrl && ctrl.status === 'disconnected') {
                  isCommLost = true;
                }
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        const handlePumpClick = () => {
          setActiveControlDevice(comp);
        };

        const spinAnim = `pump-spin-run-${comp.id}`;

        return (
          <div 
            onClick={handlePumpClick}
            style={{
              width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none', position: 'relative',
              borderRadius: '8px',
              border: isAlarmActive ? '2px solid #ef4444' : 'none',
              animation: isAlarmActive ? 'scada-alarm-blink 1s step-end infinite' : 'none'
            }}
          >
            <style>{`
              @keyframes ${spinAnim} {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
            <svg viewBox="0 0 60 60" width="100%" height="100%">
              <rect x="10" y="52" width="40" height="6" rx="1" fill="#475569" />
              <rect x="22" y="46" width="16" height="6" fill="#334155" />
              <rect x="34" y="2" width="12" height="10" fill="#475569" stroke="#334155" strokeWidth="1" />
              <path d="M 34 12 L 46 12 L 44 22 L 36 22 Z" fill="#334155" />
              <circle cx="30" cy="32" r="18" fill={pumpColor} stroke="#1e293b" strokeWidth="2.5" />
              <circle cx="30" cy="32" r="4" fill="#0f172a" />
              <g style={{ transformOrigin: '30px 32px', animation: isRunning ? `${spinAnim} 1.5s linear infinite` : 'none' }}>
                <line x1="30" y1="16" x2="30" y2="48" stroke="#f1f5f9" strokeWidth="2.5" />
                <line x1="14" y1="32" x2="46" y2="32" stroke="#f1f5f9" strokeWidth="2.5" />
                <line x1="19" y1="21" x2="41" y2="43" stroke="#f1f5f9" strokeWidth="1.5" />
                <line x1="19" y1="43" x2="41" y2="21" stroke="#f1f5f9" strokeWidth="1.5" />
              </g>
            </svg>
            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: pumpColor, marginTop: '-2px', textTransform: 'uppercase' }}>
              {status}
            </span>
            {isCommLost && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'repeating-linear-gradient(45deg, rgba(30, 41, 59, 0.95), rgba(30, 41, 59, 0.95) 10px, rgba(71, 85, 105, 0.95) 10px, rgba(71, 85, 105, 0.95) 20px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#ef4444', fontWeight: 900, fontSize: '0.55rem', zIndex: 10, borderRadius: '8px', border: '1px solid #ef4444'
              }}>
                <span style={{ fontSize: '0.75rem' }}>⚠️</span>
                <span>COMM LOST</span>
              </div>
            )}
          </div>
        );
      }
      case 'SCADA_ALARM_SUMMARY': {
        const handleAck = (index) => {
          setAlarms(prev => prev.map((a, idx) => idx === index ? { ...a, status: 'ACK' } : a));
        };

        const handleAckAll = () => {
          setAlarms(prev => prev.map(a => ({ ...a, status: 'ACK' })));
        };

        return (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#0f172a',
            border: '2px solid #334155',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontSize: '0.75rem',
            color: '#f8fafc',
            boxSizing: 'border-box'
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              padding: '8px 16px',
              borderBottom: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 800
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>⚠️</span>
                <span style={{ letterSpacing: '0.05em' }}>ALARM SUMMARY ACTIVE VIEW</span>
              </div>
              <button 
                onClick={handleAckAll}
                style={{
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
              >
                ACK ALL
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '8px 10px' }}>Time</th>
                    <th style={{ padding: '8px 10px' }}>Source</th>
                    <th style={{ padding: '8px 10px' }}>Message</th>
                    <th style={{ padding: '8px 10px' }}>Severity</th>
                    <th style={{ padding: '8px 10px' }}>Status</th>
                    <th style={{ padding: '8px 10px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {alarms.map((a, idx) => {
                    let rowBg = 'transparent';
                    let textColor = '#f8fafc';
                    if (a.severity === 'CRITICAL') { rowBg = 'rgba(239, 68, 68, 0.12)'; textColor = '#fca5a5'; }
                    else if (a.severity === 'WARNING') { rowBg = 'rgba(234, 179, 8, 0.08)'; textColor = '#fef08a'; }
                    else { rowBg = 'rgba(59, 130, 246, 0.04)'; textColor = '#bfdbfe'; }

                    return (
                      <tr key={idx} style={{ backgroundColor: rowBg, color: textColor, borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>{a.time}</td>
                        <td style={{ padding: '8px 10px' }}>{a.source}</td>
                        <td style={{ padding: '8px 10px' }}>{a.msg}</td>
                        <td style={{ padding: '8px 10px', fontSize: '0.65rem', fontWeight: 900 }}>
                          <span style={{
                            backgroundColor: a.severity === 'CRITICAL' ? '#ef4444' : (a.severity === 'WARNING' ? '#eab308' : '#3b82f6'),
                            color: '#0f172a',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            textTransform: 'uppercase'
                          }}>{a.severity}</span>
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 'bold', color: a.status === 'UNACK' ? '#ef4444' : '#22c55e' }}>{a.status}</td>
                        <td style={{ padding: '8px 10px' }}>
                          {a.status === 'UNACK' ? (
                            <button 
                              onClick={() => handleAck(idx)}
                              style={{ 
                                padding: '3px 8px', 
                                fontSize: '0.6rem', 
                                border: '1px solid currentColor', 
                                background: 'transparent', 
                                color: textColor, 
                                borderRadius: '4px', 
                                cursor: 'pointer',
                                fontWeight: 'bold'
                              }}
                            >
                              ACK
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Acknowledged</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {alarms.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontStyle: 'italic' }}>
                        No active alarms. System running normally.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      case 'SCADA_MOTOR':
      case 'SCADA_CONVEYOR':
      case 'SCADA_MIXER':
      case 'SCADA_HEAT_EXCHANGER':
      case 'SCADA_BOILER':
      case 'SCADA_COMPRESSOR':
      case 'SCADA_CHILLER':
      case 'SCADA_FURNACE':
      case 'SCADA_SILO':
      case 'SCADA_PRESSURE_GAUGE':
      case 'SCADA_TEMP_INDICATOR':
      case 'SCADA_FLOW_METER':
      case 'SCADA_LEVEL_INDICATOR':
      case 'SCADA_PH_METER':
      case 'SCADA_CURRENT_METER':
      case 'SCADA_VOLTAGE_METER':
      case 'SCADA_POWER_METER':
      case 'SCADA_DIGITAL_DISPLAY':
      case 'SCADA_NUMERIC_INPUT':
      case 'SCADA_SETPOINT_INPUT':
      case 'SCADA_TREND':
      case 'SCADA_HISTORICAL_TREND':
      case 'SCADA_BAR_GRAPH':
      case 'SCADA_CIRCULAR_GAUGE':
      case 'SCADA_PROGRESS_BAR':
      case 'SCADA_TANK_LEVEL':
      case 'SCADA_ALARM_BANNER':
      case 'SCADA_ALARM_HISTORY':
      case 'SCADA_EVENT_LOG':
      case 'SCADA_ALARM_ACK':
      case 'SCADA_BTN_START':
      case 'SCADA_BTN_STOP':
      case 'SCADA_BTN_RESET':
      case 'SCADA_AUTO_MANUAL':
      case 'SCADA_MODE_SELECTOR':
      case 'SCADA_TOGGLE_SWITCH':
      case 'SCADA_PLC_STATUS':
      case 'SCADA_OEE':
      case 'SCADA_PROD_COUNTER':
      case 'SCADA_DOWNTIME':
      case 'SCADA_MACHINE_STATUS':
      case 'SCADA_SPC_CHART':
      case 'SCADA_ENERGY_MONITOR':
      case 'SCADA_BATCH_TRACKER': {
        const resolveComponentDatasourceValue = (component, fallbackValue = '') => {
          const props = component?.props || {};
          if (!props.dataSourceType) return fallbackValue;

          if (props.dataSourceType === 'VARIABLE') {
            const varName = String(props.varSource || '');
            if (!varName) return fallbackValue;
            if (varName.startsWith('APP_INFO.')) {
              return resolveValue(`@${varName}`, 'STATIC');
            }
            const v = appVariables.find(av => av.name === varName);
            return v ? v.value : fallbackValue;
          }

          if (props.dataSourceType === 'PLC_TAG') {
            const tagPath = String(props.varSource || '');
            if (!tagPath) return fallbackValue;
            const tags = window.mavi_plc_tags || [];
            const tag = tags.find(t => (t.controllerName + '/' + t.name) === tagPath || t.name === tagPath);
            return tag ? tag.value : fallbackValue;
          }

          const resolved = resolveValue('', 'STATIC', props);
          return resolved === undefined || resolved === null || resolved === '' ? fallbackValue : resolved;
        };

        const syncInputDatasourceValue = async (component, nextValue, source = 'widget_input') => {
          const props = component?.props || {};
          if (props.dataSourceType === 'VARIABLE') {
            const varName = String(props.varSource || '');
            if (!varName || varName.startsWith('APP_INFO.')) return;
            syncVariableByName(varName, nextValue);
            return;
          }

          if (props.dataSourceType === 'PLC_TAG') {
            try {
              const parsedTags = window.mavi_plc_tags || [];
              const parsedCtrls = window.mavi_plc_controllers || [];
              const tagIdx = parsedTags.findIndex(t => t.id === props.plcTagId || t.name === props.varSource);
              if (tagIdx > -1) {
                parsedTags[tagIdx].value = String(nextValue);
                window.mavi_plc_tags = parsedTags;

                if (window.__TAURI_INTERNALS__) {
                  const tag = parsedTags[tagIdx];
                  const ctrl = parsedCtrls.find(c => c.id === tag.controllerId);
                  if (ctrl && ctrl.status === 'connected' && ctrl.type === 'MODBUS_TCP') {
                    const core = await import('@tauri-apps/api/core');
                    let addr = parseInt(tag.address);
                    let offset = addr;
                    let regType = tag.regType || 'HOLDING_REGISTER';
                    if (regType === 'COIL') offset = addr - 1;
                    else if (regType === 'HOLDING_REGISTER') offset = addr - 40001;
                    if (offset < 0) offset = 0;

                    const isTrueVal = nextValue === 'true' || nextValue === true || nextValue === 'RUNNING' || nextValue === 'AUTO' || nextValue === 'ON' || nextValue === 'OPEN' || nextValue === 'START' || nextValue === 'RESET';
                    const isFalseVal = nextValue === 'false' || nextValue === false || nextValue === 'STOPPED' || nextValue === 'MANUAL' || nextValue === 'OFF' || nextValue === 'CLOSED' || nextValue === 'STOP';
                    const finalVal = isTrueVal ? 1 : (isFalseVal ? 0 : (isNaN(nextValue) ? 0 : parseInt(nextValue)));

                    await core.invoke('modbus_write', {
                      id: ctrl.id,
                      regType,
                      address: offset,
                      value: finalVal
                    });
                  }
                }
              }
            } catch (e) {
              console.error('Failed to sync PLC tag input value in LiveTerminal:', e);
            }
            
            const varName = String(props.varSource || '');
            if (varName && appVariables.some(av => av.name === varName)) {
              syncVariableByName(varName, nextValue);
            }
            return;
          }

          if (props.targetVariable) {
            syncVariableByName(props.targetVariable, nextValue);
          }
        };

        const onWidgetInteraction = (component, triggerName, data) => {
          fireWidgetTriggers(component, triggerName, data);
        };

        return (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <ScadaWidgetRenderer
              comp={comp}
              viewMode="PREVIEW"
              previewFormValues={sliderValues}
              setPreviewFormValues={setSliderValues}
              resolveComponentDatasourceValue={resolveComponentDatasourceValue}
              syncInputDatasourceValue={syncInputDatasourceValue}
              onWidgetInteraction={onWidgetInteraction}
              safeRender={safeRender}
            />
          </div>
        );
      }
      case 'NUMBER_INPUT': return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {(resolvedProps.label || resolvedProps.text) && (
            <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '4px' }}>
              {resolvedProps.label || resolvedProps.text}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
            <button
              onClick={() => {
                const currentVal = parseFloat(numberInputValues[comp.id] != null ? numberInputValues[comp.id] : (resolvedProps.value != null ? resolvedProps.value : resolvedProps.defaultValue)) || 0;
                const newVal = Math.max(comp.props.min != null ? comp.props.min : 0, currentVal - 1);
                setNumberInputValues(prev => ({ ...prev, [comp.id]: String(newVal) }));
                syncVariable(newVal);
                fireWidgetTriggers(comp, 'ON_CHANGE');
              }}
              className="mavi-widget-btn"
              style={{
                width: '40px',
                height: '100%',
                border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                borderRadius: '6px',
                backgroundColor: isDark ? '#1e293b' : 'white',
                color: isDark ? '#f8fafc' : '#475569',
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box'
              }}
            >
              -
            </button>
            <input
              type="number"
              step="any"
              value={numberInputValues[comp.id] !== undefined ? numberInputValues[comp.id] : (resolvedProps.value != null ? resolvedProps.value : (resolvedProps.defaultValue != null ? resolvedProps.defaultValue : ''))}
              onChange={e => {
                const valStr = e.target.value;
                setNumberInputValues(prev => ({ ...prev, [comp.id]: valStr }));
                const parsedVal = valStr === '' ? 0 : parseFloat(valStr);
                syncVariable(isNaN(parsedVal) ? 0 : parsedVal);
                fireWidgetTriggers(comp, 'ON_CHANGE');
              }}
              className="mavi-input"
              style={{
                flex: 1,
                height: '100%',
                padding: '10px',
                border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                borderRadius: '6px',
                fontSize: `${comp.props.fontSize || 16}px`,
                textAlign: 'center',
                outline: 'none',
                backgroundColor: isDark ? '#0f172a' : 'white',
                color: isDark ? '#f8fafc' : '#0f172a',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={() => {
                const currentVal = parseFloat(numberInputValues[comp.id] != null ? numberInputValues[comp.id] : (resolvedProps.value != null ? resolvedProps.value : resolvedProps.defaultValue)) || 0;
                const newVal = Math.min(comp.props.max != null ? comp.props.max : 9999, currentVal + 1);
                setNumberInputValues(prev => ({ ...prev, [comp.id]: String(newVal) }));
                syncVariable(newVal);
                fireWidgetTriggers(comp, 'ON_CHANGE');
              }}
              className="mavi-widget-btn"
              style={{
                width: '40px',
                height: '100%',
                border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                borderRadius: '6px',
                backgroundColor: isDark ? '#1e293b' : 'white',
                color: isDark ? '#f8fafc' : '#475569',
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box'
              }}
            >
              +
            </button>
            {comp.props.unit && (
              <span style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#475569', fontWeight: 600 }}>
                {safeRender(comp.props.unit)}
              </span>
            )}
          </div>
        </div>
      );
      case 'DATE_PICKER': return (
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>{resolvedProps.label}</div>
          <input type="date" value={sanitizeDateInputValue(dateValues[comp.id] || resolvedProps.value || resolvedProps.defaultValue || '')} onChange={e => {
            const val = e.target.value;
            setDateValues(prev => ({ ...prev, [comp.id]: val }));
            syncVariable(val);
            fireWidgetTriggers(comp, 'ON_CHANGE');
          }} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '1rem', outline: 'none', color: '#0f172a' }} />
        </div>
      );
      case 'DATETIME_PICKER': return (
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>{resolvedProps.label}</div>
          <input type="datetime-local" value={sanitizeDateTimeInputValue(dateTimeValues[comp.id] || resolvedProps.value || resolvedProps.defaultValue || '')} onChange={e => {
            const val = e.target.value;
            setDateTimeValues(prev => ({ ...prev, [comp.id]: val }));
            syncVariable(val);
            fireWidgetTriggers(comp, 'ON_CHANGE');
          }} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '1rem', outline: 'none', color: '#0f172a' }} />
        </div>
      );
      case 'CHECKBOX': {
        const isChecked = toggleState[comp.id] != null ? toggleState[comp.id] : (resolvedProps.checked ?? resolvedProps.defaultValue ?? false);
        const isCbEnabled = comp.props.enabled !== false;
        
        return (
          <div
            onClick={() => {
              if (!isCbEnabled) return;
              const val = !isChecked;
              setToggleState(prev => ({ ...prev, [comp.id]: val }));
              syncVariable(val);
              fireWidgetTriggers(comp, 'ON_CHANGE');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: isDark ? (isChecked ? 'rgba(59, 130, 246, 0.15)' : '#0f172a') : (isChecked ? '#eff6ff' : '#f8fafc'),
              border: `1.5px solid ${isChecked ? '#3b82f6' : (isDark ? '#334155' : '#cbd5e1')}`,
              cursor: isCbEnabled ? 'pointer' : 'default',
              opacity: isCbEnabled ? 1 : 0.5,
              transition: 'all 0.15s ease',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              border: `2px solid ${isChecked ? '#3b82f6' : (isDark ? '#475569' : '#94a3b8')}`,
              backgroundColor: isChecked ? '#3b82f6' : (isDark ? '#0f172a' : 'white'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}>
              {isChecked && (
                <span style={{ color: 'white', fontSize: '12px', fontWeight: 900 }}>
                  {String.fromCharCode(10003)}
                </span>
              )}
            </div>
            <span style={{
              userSelect: 'none',
              flex: 1,
              wordBreak: 'break-word',
              color: resolvedProps.textColor || resolvedProps.color || (isDark ? '#f8fafc' : '#0f172a'),
              fontSize: `${resolvedProps.fontSize || 14}px`,
              fontWeight: (resolvedProps.fontBold || resolvedProps.fontWeight === 'bold') ? 'bold' : 'normal',
              fontStyle: resolvedProps.fontItalic ? 'italic' : (resolvedProps.fontStyle || 'normal')
            }}>
              {resolvedProps.label || resolvedProps.text || 'Checkbox'}
            </span>
          </div>
        );
      }
      case 'BOOLEAN_TOGGLE': {
        const on = toggleState[comp.id] != null ? toggleState[comp.id] : comp.props.defaultValue || false;
        return (
          <div onClick={() => {
            const val = !on;
            setToggleState(prev => ({ ...prev, [comp.id]: val }));
            syncVariable(val);
            fireWidgetTriggers(comp, 'ON_CHANGE');
          }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#f8fafc', border: `2px solid ${on ? '#22c55e' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' }}>
            <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>{resolvedProps.label}</span>
            <div style={{ width: '48px', height: '26px', backgroundColor: on ? '#22c55e' : '#cbd5e1', borderRadius: '13px', position: 'relative', transition: 'background-color 0.2s' }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: on ? '25px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.2s' }} />
            </div>
          </div>
        );
      }
      case 'GAUGE': {
        const pg = Math.min(100, Math.max(0, ((resolvedProps.value - comp.props.min) / (comp.props.max - comp.props.min)) * 100));
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{resolvedProps.label}</span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: comp.props.color || '#3b82f6' }}>{resolvedProps.value} {comp.props.unit}</span>
            </div>
            <div style={{ height: '14px', backgroundColor: '#e2e8f0', borderRadius: '7px', overflow: 'hidden' }}><div style={{ width: `${pg}%`, height: '100%', backgroundColor: comp.props.color || '#3b82f6', transition: 'width 0.3s', borderRadius: '7px' }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}><span>{safeRender(comp.props.min)}</span><span>{safeRender(comp.props.max)}</span></div>
          </div>
        );
      }
      case 'SLIDER': {
        const sMin = Number(comp.props.minValue ?? comp.props.min ?? 0);
        const sMax = Number(comp.props.maxValue ?? comp.props.max ?? 100);
        const sVal = sliderValues[comp.id] != null 
          ? sliderValues[comp.id] 
          : (resolvedProps.value != null ? Number(resolvedProps.value) : (comp.props.defaultValue ?? 30));
        const sSteps = comp.props.numberOfSteps || 100;
        const sStep = (sMax - sMin) / sSteps;
        const sEnabled = comp.props.enabled !== false;

        return (
          <div style={{ width: '100%', opacity: sEnabled ? 1 : 0.5, display: 'flex', flexDirection: 'column' }}>
            {comp.props.label && (
              <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px', fontWeight: 600 }}>
                {safeRender(comp.props.label)}: <span style={{ color: comp.props.colorLeft || '#2563eb', fontWeight: 'bold' }}>{sVal}</span>
              </div>
            )}
            <input
              type="range"
              min={sMin}
              max={sMax}
              step={sStep}
              value={sVal}
              disabled={!sEnabled}
              onChange={(e) => {
                const newVal = Number(e.target.value);
                setSliderValues(prev => ({ ...prev, [comp.id]: newVal }));
                syncVariable(newVal);
                if (comp.props.mqttPublishTopic) {
                  iotConnector.publish(comp.props.mqttPublishTopic, String(newVal));
                  console.log(`[PLC HMI Slider] Published ${newVal} to ${comp.props.mqttPublishTopic}`);
                }
                fireWidgetTriggers(comp, 'ON_CHANGE');
                fireWidgetTriggers(comp, 'PositionChanged', { thumbPosition: newVal });
              }}
              style={{
                width: '100%',
                cursor: sEnabled ? 'pointer' : 'default',
                accentColor: comp.props.colorLeft || '#2563eb'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>
              <span>{sMin}</span>
              <span>{sMax}</span>
            </div>
          </div>
        );
      }
      case 'CHART': {
        const data = chartData[comp.id] || [];
        const { type, title, xAxisColumn, yAxisColumn, color, showArea } = comp.props;
        const ChartComponent = type === 'BAR' ? BarChart : type === 'AREA' ? AreaChart : LineChart;
        const DataComponent = type === 'BAR' ? Bar : type === 'AREA' ? Area : Line;

        return (
          <div key={`${comp.id}-${refreshKey}`} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', height: '300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
              <BarChart3 size={18} color={color} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>{title}</span>
            </div>
            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
              {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ChartComponent data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey={xAxisColumn || 'createdAt'}
                      fontSize={10}
                      tick={{ fill: '#94a3b8' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      tickFormatter={(val) => {
                        if (xAxisColumn === 'createdAt' || !xAxisColumn) {
                          return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        }
                        return val;
                      }}
                    />
                    <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    />
                    <DataComponent
                      type={showArea ? "monotone" : "linear"}
                      dataKey={yAxisColumn}
                      stroke={color}
                      fill={color}
                      fillOpacity={type === 'AREA' ? 0.2 : 1}
                      strokeWidth={2}
                      dot={data.length < 50}
                    />
                  </ChartComponent>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No production data available for this chart.
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'PARETO_CHART': {
        const data = chartData[comp.id] || [];
        const { title, xAxisColumn, yAxisColumn, color } = comp.props;

        // Transform data for Pareto
        // 1. Group by xAxisColumn
        const groups = {};
        data.forEach(item => {
          const key = item[xAxisColumn] || 'Unknown';
          const val = parseFloat(item[yAxisColumn]) || 0;
          groups[key] = (groups[key] || 0) + val;
        });

        // 2. Sort decreasing
        const sorted = Object.entries(groups)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        // 3. Calculate cumulative %
        const total = sorted.reduce((sum, item) => sum + item.value, 0);
        let runningSum = 0;
        const paretoData = sorted.map(item => {
          runningSum += item.value;
          return {
            ...item,
            cumulative: total > 0 ? Math.round((runningSum / total) * 100) : 0
          };
        });

        return (
          <div key={`${comp.id}-${refreshKey}`} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', height: '300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '15px' }}>{title}</div>
            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoData}>
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} fontSize={10} axisLine={false} tickLine={false} unit="%" />
                  <RechartsTooltip />
                  <Bar yAxisId="left" dataKey="value" fill={color} radius={[4, 4, 0, 0]} barSize={40} />
                  <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#f59e0b" strokeWidth={3} dot={{ stroke: '#f59e0b', strokeWidth: 2, r: 4, fill: '#fff' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
      case 'CONTROL_CHART': {
        const data = chartData[comp.id] || [];
        const { title, yAxisColumn, ucl, lcl, target, color } = comp.props;
        return (
          <div key={`${comp.id}-${refreshKey}`} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', height: '300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '15px' }}>{title}</div>
            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="createdAt" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <RechartsTooltip />
                  <ReferenceLine y={ucl} label={{ value: 'UCL', position: 'right', fill: '#ef4444', fontSize: 10 }} stroke="#ef4444" strokeDasharray="3 3" />
                  <ReferenceLine y={lcl} label={{ value: 'LCL', position: 'right', fill: '#ef4444', fontSize: 10 }} stroke="#ef4444" strokeDasharray="3 3" />
                  <ReferenceLine y={target} label={{ value: 'Target', position: 'right', fill: '#10b981', fontSize: 10 }} stroke="#10b981" />
                  <Line type="monotone" dataKey={yAxisColumn} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
      case 'OEE_DASHBOARD': {
        const machineId = comp.props.machineId;
        const stats = oeeData[machineId] || { availability: 0, performance: 0, quality: 0, oee: 0 };

        const MetricCard = ({ label, value, color }) => (
          <div style={{ flex: 1, padding: '12px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: color }}>{Math.round(value)}%</div>
          </div>
        );

        return (
          <div style={{ backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', marginBottom: '16px' }}>{comp.props.label || 'OEE Dashboard'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <MetricCard label="Availability" value={stats.availability} color="#3b82f6" />
              <MetricCard label="Performance" value={stats.performance} color="#8b5cf6" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <MetricCard label="Quality" value={stats.quality} color="#10b981" />
              <div style={{ flex: 1, padding: '12px', backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', borderRadius: '8px', border: '2px solid #3b82f6', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '4px' }}>Global OEE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#3b82f6' }}>{Math.round(stats.oee)}%</div>
              </div>
            </div>
          </div>
        );
      }
      case 'ADVANCED_TABLE':
      case 'INTERACTIVE_TABLE': {
        let data = tableData[comp.id] || [];

        // Apply Real-time Variable Filters
        const vFilters = comp.props.variableFilters || [];
        if (vFilters.length > 0) {
          data = data.filter(row => {
            return vFilters.every(f => {
              const v = appVariables.find(av => av.name === f.variableName || av.id === f.variableName);
              const filterVal = v?.value;
              if (filterVal === undefined || filterVal === null || filterVal === '') return true;

              const colName = f.columnName || f.field || f.column;
              if (!colName) {
                return Object.entries(row).some(([key, val]) => {
                  if (typeof val === 'object' || val === null) return false;
                  return String(val).toLowerCase().includes(String(filterVal).toLowerCase());
                });
              }
              const rowVal = row[colName];
              
              // Case-insensitive inclusion match
              return String(rowVal || '').toLowerCase().includes(String(filterVal).toLowerCase());
            });
          });
        }

        const rawCols = comp.props.columns?.length > 0 ? comp.props.columns : ['id', 'createdAt'];
        const cols = rawCols.map(c => typeof c === 'object' ? (c.key || c.name || c.header || c.value || c.label || JSON.stringify(c)) : String(c));
        const colHeaders = rawCols.map(c => typeof c === 'object' ? (c.header || c.label || c.name || c.key || JSON.stringify(c)) : String(c));
        const pageSize = comp.props.pageSize || 5;
        const currentPage = tablePagination[comp.id]?.page || 1;
        const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
        const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        const selected = selectedTableRow[comp.id];
        const linkedPlaceholderId = comp.props.linkedRecordPlaceholderId;

        return (
          <div key={`${comp.id}-${refreshKey}`} style={{ backgroundColor: comp.props.backgroundColor || '#ffffff', border: comp.props.bordered !== false ? '1px solid #e2e8f0' : 'none', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
              <Table size={18} color={comp.props.color || '#3b82f6'} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
                {comp.props.title || 'Data View'}
                {(() => {
                  const filter = comp.props.variableFilters?.[0];
                  if (filter) {
                    const v = appVariables.find(v => v.name === filter.variableName || v.id === filter.variableName);
                    let val = v?.value;
                    if (val && typeof val === 'object') val = val.value || val.id || val.recordId || '[Object]';
                    if (val) return <span style={{ color: '#3b82f6', marginLeft: '10px', fontSize: '0.7rem', backgroundColor: 'rgba(59,130,246,0.1)', padding: '2px 6px', borderRadius: '4px' }}>[Filter: {String(val)}]</span>;
                  }
                  return null;
                })()}
              </span>
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {cols.map((colKey, idx) => (
                      <th key={colKey || idx} style={{ padding: '10px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>{colHeaders[idx]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, rIdx) => {
                    const rowId = row?.id ?? row?._id ?? JSON.stringify(row);
                    const selectedId = selected?.id ?? selected?._id ?? (selected ? JSON.stringify(selected) : null);
                    const isSelected = selectedId === rowId;
                    return (
                      <tr
                        key={rowId || rIdx}
                        onClick={() => {
                          const newSelected = isSelected ? null : row;
                          setSelectedTableRow(prev => ({ ...prev, [comp.id]: newSelected }));

                          // Update record placeholder if linked
                          if (linkedPlaceholderId) {
                            setRecordPlaceholderData(prev => ({
                              ...prev,
                              [linkedPlaceholderId]: newSelected
                            }));
                          }

                          fireWidgetTriggers(comp, 'ON_CHANGE');
                          fireWidgetTriggers(comp, 'RowSelected');
                          fireWidgetTriggers(comp, 'ON_ROW_SELECT', newSelected);
                        }}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'white', transition: 'background-color 0.2s' }}
                      >
                        {cols.map(colKey => (
                          <td key={colKey} style={{ padding: '10px', color: '#1e293b' }}>
                            {(() => {
                              let val = row[colKey];
                              if (val === undefined && (colKey === 'ID' || colKey === 'id' || colKey === 'recordId' || colKey === 'record_id')) {
                                val = row.recordId || row.record_id || row.id || row.ID;
                              }
                              if (val === undefined || val === null || val === '') return '-';

                              // Linked Records (Array of IDs or Objects)
                              if (Array.isArray(val)) {
                                if (val.length === 0) return '-';
                                return (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {val.map((item, idx) => {
                                      const label = typeof item === 'object' ? (item.recordId || item.id || 'Record') : String(item);
                                      return (
                                        <span key={idx} style={{
                                          padding: '2px 8px',
                                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                          color: '#3b82f6',
                                          borderRadius: '4px',
                                          fontSize: '0.65rem',
                                          fontWeight: 800,
                                          border: '1px solid rgba(59, 130, 246, 0.2)',
                                          display: 'inline-flex',
                                          alignItems: 'center'
                                        }}>
                                          {label}
                                        </span>
                                      );
                                    })}
                                  </div>
                                );
                              }

                              // Single Linked Record or Object
                              if (typeof val === 'object' && val !== null) {
                                const label = val.recordId || val.id || 'Record';
                                return (
                                  <span style={{
                                    padding: '2px 8px',
                                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                    color: '#8b5cf6',
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    border: '1px solid rgba(139, 92, 246, 0.2)'
                                  }}>
                                    {label}
                                  </span>
                                );
                              }

                              // Boolean handling
                              if (typeof val === 'boolean') {
                                return val ?
                                  <span style={{ color: '#10b981', fontWeight: 800 }}>YES</span> :
                                  <span style={{ color: '#ef4444', fontWeight: 800 }}>NO</span>;
                              }

                              return String(val);
                            })()}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={cols.length} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', fontSize: '0.8rem' }}>
                <button
                  onClick={() => setTablePagination(prev => ({ ...prev, [comp.id]: { page: Math.max(1, currentPage - 1) } }))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: currentPage === 1 ? '#f8fafc' : 'white', color: currentPage === 1 ? '#cbd5e1' : '#475569', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Prev
                </button>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setTablePagination(prev => ({ ...prev, [comp.id]: { page: Math.min(totalPages, currentPage + 1) } }))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: currentPage === totalPages ? '#f8fafc' : 'white', color: currentPage === totalPages ? '#cbd5e1' : '#475569', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        );
      }
      case 'SMARTHOME_DEVICE': {
        const deviceName = comp.props.deviceName || 'Smart Switch';
        const deviceBrand = comp.props.deviceBrand || 'TUYA';
        const deviceType = comp.props.deviceType || 'SWITCH';
        const mqttPublishTopic = comp.props.mqttPublishTopic || '';

        const swOn = toggleState[comp.id] ?? comp.props.on ?? false;
        const brVal = sliderValues[comp.id + '_brightness'] ?? comp.props.brightness ?? 100;
        const tempVal = sliderValues[comp.id + '_temperature'] ?? comp.props.temperature ?? 24;

        const setVal = (key, val, interactionEvent = 'Changed') => {
          setSliderValues(prev => ({ ...prev, [key]: val }));
          if (mqttPublishTopic) {
            const payload = comp.props.jsonPayload 
              ? JSON.stringify({ [key.replace(comp.id + '_', '')]: val }) 
              : String(val);
            iotConnector.publish(mqttPublishTopic, payload);
          }
          fireWidgetTriggers(comp, interactionEvent, { [key.replace(comp.id + '_', '')]: val });
        };

        const setToggle = (key, val, interactionEvent = 'Changed') => {
          setToggleState(prev => ({ ...prev, [key]: val }));
          if (mqttPublishTopic) {
            const payload = comp.props.jsonPayload 
              ? JSON.stringify({ [key.replace(comp.id + '_', '').replace(comp.id, 'on')]: val }) 
              : String(val);
            iotConnector.publish(mqttPublishTopic, payload);
          }
          fireWidgetTriggers(comp, interactionEvent, { [key.replace(comp.id + '_', '').replace(comp.id, 'on')]: val });
        };

        return (
          <div style={{
            width: '100%', height: '100%', 
            backgroundColor: comp.props.backgroundColor || (isDark ? '#1e293b' : '#ffffff'),
            border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ff5f00' }}>{deviceBrand} CONTROLLER</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' }}></span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Online</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>{deviceName}</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Type: {deviceType}</div>
            </div>

            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isDark ? '#94a3b8' : '#475569' }}>Power Status</span>
                <button
                  onClick={() => setToggle(comp.id, !swOn)}
                  style={{
                    padding: '6px 12px', borderRadius: '20px', border: 'none',
                    backgroundColor: swOn ? '#ff5f00' : '#64748b', color: 'white',
                    fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {swOn ? 'ON' : 'OFF'}
                </button>
              </div>

              {deviceType === 'BULB' && swOn && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Brightness</span>
                    <span>{brVal}%</span>
                  </div>
                  <input
                    type="range" min="10" max="100" value={brVal}
                    onChange={(e) => setVal(comp.id + '_brightness', parseInt(e.target.value), 'BrightnessChanged')}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {(deviceType === 'THERMOSTAT' || deviceType === 'AIR_CON') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Target Temp</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => setVal(comp.id + '_temperature', tempVal - 1, 'TemperatureChanged')}
                      style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    >-</button>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{tempVal}°C</span>
                    <button 
                      onClick={() => setVal(comp.id + '_temperature', tempVal + 1, 'TemperatureChanged')}
                      style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    >+</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'TUYA_PRODUCT': {
        const productCase = comp.props.productCase || 'LIGHTING';
        const deviceName = comp.props.deviceName || 'Tuya Smart Product';
        const mqttPublishTopic = comp.props.mqttPublishTopic || '';

        // State resolution from MQTT machineData or local play states
        const mqttData = comp.props.iotTopicId ? machineData[comp.props.iotTopicId] : null;
        let parsedMqttState = {};
        if (mqttData !== null && mqttData !== undefined) {
          try {
            const parsed = typeof mqttData === 'string' ? JSON.parse(mqttData) : mqttData;
            if (typeof parsed === 'object') {
              parsedMqttState = parsed;
            }
          } catch (e) {}
        }

        const swOn = toggleState[comp.id] ?? parsedMqttState.on ?? comp.props.on ?? false;
        const brVal = sliderValues[comp.id + '_brightness'] ?? parsedMqttState.brightness ?? comp.props.brightness ?? 80;
        const colorTemp = sliderValues[comp.id + '_colorTemp'] ?? parsedMqttState.colorTemp ?? comp.props.colorTemp ?? 50;
        const colorHex = textInputValues[comp.id + '_colorHex'] ?? parsedMqttState.colorHex ?? comp.props.colorHex ?? '#ff5f00';
        const tempVal = sliderValues[comp.id + '_temperature'] ?? parsedMqttState.temperature ?? comp.props.temperature ?? 24;
        const targetTempVal = sliderValues[comp.id + '_targetTemperature'] ?? parsedMqttState.targetTemperature ?? comp.props.targetTemperature ?? 22;
        const fanSpeed = textInputValues[comp.id + '_fanSpeed'] ?? parsedMqttState.fanSpeed ?? comp.props.fanSpeed ?? 'AUTO';
        const mode = textInputValues[comp.id + '_mode'] ?? parsedMqttState.mode ?? comp.props.mode ?? 'AUTO';
        const locked = toggleState[comp.id + '_locked'] ?? parsedMqttState.locked ?? comp.props.locked ?? true;
        const usbOn = toggleState[comp.id + '_usbOn'] ?? parsedMqttState.usbOn ?? comp.props.usbOn ?? false;
        const powerConsumption = sliderValues[comp.id + '_powerConsumption'] ?? parsedMqttState.powerConsumption ?? comp.props.powerConsumption ?? 12.5;
        const totalEnergy = sliderValues[comp.id + '_totalEnergy'] ?? parsedMqttState.totalEnergy ?? comp.props.totalEnergy ?? 4.8;
        const aqiValue = sliderValues[comp.id + '_aqiValue'] ?? parsedMqttState.aqiValue ?? comp.props.aqiValue ?? 12;
        const filterLife = sliderValues[comp.id + '_filterLife'] ?? parsedMqttState.filterLife ?? comp.props.filterLife ?? 92;
        const batteryLevel = sliderValues[comp.id + '_batteryLevel'] ?? parsedMqttState.batteryLevel ?? comp.props.batteryLevel ?? 85;

        const setVal = (key, val, interactionEvent = 'Changed') => {
          setSliderValues(prev => ({ ...prev, [key]: val }));
          if (mqttPublishTopic) {
            const payload = comp.props.jsonPayload 
              ? JSON.stringify({ [key.replace(comp.id + '_', '')]: val }) 
              : String(val);
            iotConnector.publish(mqttPublishTopic, payload);
          }
          fireWidgetTriggers(comp, interactionEvent, { [key.replace(comp.id + '_', '')]: val });
        };

        const setValText = (key, val, interactionEvent = 'Changed') => {
          setTextInputValues(prev => ({ ...prev, [key]: val }));
          if (mqttPublishTopic) {
            const payload = comp.props.jsonPayload 
              ? JSON.stringify({ [key.replace(comp.id + '_', '')]: val }) 
              : String(val);
            iotConnector.publish(mqttPublishTopic, payload);
          }
          fireWidgetTriggers(comp, interactionEvent, { [key.replace(comp.id + '_', '')]: val });
        };

        const setToggle = (key, val, interactionEvent = 'Changed') => {
          setToggleState(prev => ({ ...prev, [key]: val }));
          if (mqttPublishTopic) {
            const payload = comp.props.jsonPayload 
              ? JSON.stringify({ [key.replace(comp.id + '_', '').replace(comp.id, 'on')]: val }) 
              : String(val);
            iotConnector.publish(mqttPublishTopic, payload);
          }
          fireWidgetTriggers(comp, interactionEvent, { [key.replace(comp.id + '_', '').replace(comp.id, 'on')]: val });
        };

        const cardStyle = {
          width: '100%',
          height: '100%',
          backgroundColor: comp.props.backgroundColor || (isDark ? '#1e293b' : '#ffffff'),
          border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
          fontFamily: 'inherit',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box'
        };

        const tuyaOrangeGradient = 'linear-gradient(135deg, #ff5f00, #ff8c00)';

        return (
          <div style={cardStyle}>
            <style>{`
              @keyframes mavi-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
              @keyframes radar-sweep { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
            {/* Header: Badge & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ 
                  background: tuyaOrangeGradient, 
                  color: '#ffffff', 
                  fontSize: '0.65rem', 
                  fontWeight: 900, 
                  padding: '3px 8px', 
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  TUYA
                </span>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>
                  • Client
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: '#22c55e', 
                  borderRadius: '50%',
                  display: 'inline-block',
                  boxShadow: '0 0 8px #22c55e'
                }}></span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Active</span>
              </div>
            </div>

            {/* Title Section */}
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {deviceName}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#ff5f00', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginTop: '2px' }}>
                Case: {productCase.replace('_', ' ')}
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: isDark ? '#334155' : '#e2e8f0', margin: '4px 0' }} />

            {/* Content Body */}
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'flex-start', overflowY: 'auto', paddingRight: '2px' }}>
              {productCase === 'LIGHTING' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ 
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: swOn ? colorHex : (isDark ? '#0f172a' : '#f8fafc'),
                    border: `2px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: swOn ? `0 0 ${brVal / 2}px ${colorHex}, inset 0 0 15px rgba(255,255,255,0.4)` : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <Sun size={36} color={swOn ? '#ffffff' : '#64748b'} style={{ opacity: swOn ? (brVal / 100) : 0.4 }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Power State</span>
                    <div 
                      style={{
                        width: '44px', height: '22px', borderRadius: '11px',
                        backgroundColor: swOn ? '#ff5f00' : (isDark ? '#334155' : '#cbd5e1'),
                        position: 'relative', transition: 'background-color 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => setToggle(comp.id, !swOn)}
                    >
                      <div style={{
                        position: 'absolute', top: '2px', left: swOn ? '24px' : '2px',
                        width: '18px', height: '18px', borderRadius: '50%',
                        backgroundColor: '#ffffff', transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }} />
                    </div>
                  </div>

                  {swOn && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                          <span>Brightness</span>
                          <span>{brVal}%</span>
                        </div>
                        <input 
                          type="range" min="10" max="100" value={brVal}
                          style={{ width: '100%', height: '6px', borderRadius: '3px', cursor: 'pointer', accentColor: '#ff5f00' }}
                          onChange={(e) => setVal(comp.id + '_brightness', parseInt(e.target.value), 'BrightnessChanged')}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                          <span>Color Temperature</span>
                          <span>{colorTemp}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" value={colorTemp}
                          style={{ 
                            width: '100%', height: '6px', borderRadius: '3px', 
                            cursor: 'pointer', 
                            background: 'linear-gradient(to right, #ffb050, #ffebd5, #c8e0ff)',
                            accentColor: '#3b82f6'
                          }}
                          onChange={(e) => setVal(comp.id + '_colorTemp', parseInt(e.target.value), 'ColorTempChanged')}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Presets</span>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                          {['#ff5f00', '#ff0000', '#00ff00', '#0000ff', '#8b00ff', '#ffd700'].map(preset => (
                            <div 
                              key={preset}
                              style={{
                                width: '20px', height: '20px', borderRadius: '50%',
                                backgroundColor: preset, border: colorHex === preset ? `2px solid ${isDark ? '#ffffff' : '#000000'}` : `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                                cursor: 'pointer',
                                transform: colorHex === preset ? 'scale(1.2)' : 'none',
                                transition: 'transform 0.1s'
                              }}
                              onClick={() => setValText(comp.id + '_colorHex', preset, 'ColorHexChanged')}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {productCase === 'CAMERA' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                  <div style={{ 
                    position: 'relative', height: '130px', backgroundColor: '#000000', 
                    borderRadius: '10px', overflow: 'hidden', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', border: '1px solid #334155'
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 4px, 6px 100%', pointerEvents: 'none' }} />
                    
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', zIndex: 1 }}>
                      <Video size={36} color="#475569" style={{ margin: '0 auto 6px', display: 'block', animation: swOn ? 'pulse 2s infinite' : 'none' }} />
                      <span>{swOn ? 'STREAMING LIVE (1080P)' : 'CAMERA STANDBY'}</span>
                    </div>

                    {swOn && (
                      <>
                        <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px', zIndex: 2 }}>
                          <span style={{ width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%', display: 'inline-block', animation: 'mavi-blink 1s infinite' }}></span>
                          <span style={{ fontSize: '0.55rem', color: '#ffffff', fontWeight: 'bold' }}>REC</span>
                        </div>
                        <div style={{ position: 'absolute', bottom: '8px', left: '8px', color: '#ffffff', fontSize: '0.55rem', fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px', zIndex: 2 }}>
                          CAM-01 | {new Date().toISOString().slice(0, 10)}
                        </div>
                        <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(255, 95, 0, 0.3)', pointerEvents: 'none' }} />
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button 
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                        backgroundColor: swOn ? '#ef4444' : '#ff5f00', color: '#ffffff',
                        fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}
                      onClick={() => setToggle(comp.id, !swOn)}
                    >
                      <Power size={12} />
                      {swOn ? 'Turn Off' : 'Turn On'}
                    </button>

                    {swOn && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          style={{
                            padding: '8px', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                            backgroundColor: usbOn ? '#3b82f6' : (isDark ? '#0f172a' : '#f8fafc'), color: usbOn ? '#ffffff' : '#64748b',
                            cursor: 'pointer'
                          }}
                          onClick={() => setToggle(comp.id + '_usbOn', !usbOn, 'MicrophoneToggled')}
                          title="Toggle Microphone"
                        >
                          <Mic size={14} style={{ color: usbOn ? '#ffffff' : 'inherit' }} />
                        </button>
                        <button 
                          style={{
                            padding: '8px', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                            backgroundColor: !locked ? '#10b981' : (isDark ? '#0f172a' : '#f8fafc'), color: !locked ? '#ffffff' : '#64748b',
                            cursor: 'pointer'
                          }}
                          onClick={() => setToggle(comp.id + '_locked', !locked, 'SpeakerToggled')}
                          title="Toggle Speaker"
                        >
                          <Volume2 size={14} style={{ color: !locked ? '#ffffff' : 'inherit' }} />
                        </button>
                      </div>
                    )}
                  </div>

                  {swOn && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '8px', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>PTZ CONTROLLER</span>
                      <div style={{ position: 'relative', width: '80px', height: '80px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', marginTop: '4px' }}>
                        <div></div>
                        <button 
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '4px', backgroundColor: isDark ? '#1e293b' : '#ffffff', cursor: 'pointer', color: isDark ? 'white' : 'black' }}
                          onClick={() => fireWidgetTriggers(comp, 'PTZ', { direction: 'UP' })}
                        >
                          ▲
                        </button>
                        <div></div>

                        <button 
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '4px', backgroundColor: isDark ? '#1e293b' : '#ffffff', cursor: 'pointer', color: isDark ? 'white' : 'black' }}
                          onClick={() => fireWidgetTriggers(comp, 'PTZ', { direction: 'LEFT' })}
                        >
                          ◀
                        </button>
                        <div style={{ backgroundColor: '#ff5f00', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'white', fontWeight: 'bold' }}>
                          PTZ
                        </div>
                        <button 
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '4px', backgroundColor: isDark ? '#1e293b' : '#ffffff', cursor: 'pointer', color: isDark ? 'white' : 'black' }}
                          onClick={() => fireWidgetTriggers(comp, 'PTZ', { direction: 'RIGHT' })}
                        >
                          ▶
                        </button>

                        <div></div>
                        <button 
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '4px', backgroundColor: isDark ? '#1e293b' : '#ffffff', cursor: 'pointer', color: isDark ? 'white' : 'black' }}
                          onClick={() => fireWidgetTriggers(comp, 'PTZ', { direction: 'DOWN' })}
                        >
                          ▼
                        </button>
                        <div></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {productCase === 'THERMOSTAT' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', justifyContent: 'space-between' }}>
                  <div style={{ 
                    margin: '0 auto', width: '110px', height: '110px', borderRadius: '50%',
                    border: `4px solid ${isDark ? '#334155' : '#cbd5e1'}`, backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.05), 0 4px 12px rgba(255, 95, 0, 0.1)',
                    position: 'relative'
                  }}>
                    <span style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Target Temp</span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1 }}>
                      {targetTempVal}°C
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                      <Thermometer size={10} color="#ff5f00" />
                      <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Room: {tempVal}°C</span>
                    </div>
                    <div style={{
                      position: 'absolute', bottom: '10px', fontSize: '0.55rem', 
                      color: mode === 'COOL' ? '#0ea5e9' : mode === 'HEAT' ? '#f43f5e' : '#94a3b8',
                      fontWeight: 800
                    }}>
                      {mode === 'COOL' ? '❄️ COOLING' : mode === 'HEAT' ? '🔥 HEATING' : '⚙️ AUTO'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
                    <button
                      disabled={targetTempVal <= 16}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: targetTempVal > 16 ? 'pointer' : 'not-allowed',
                        fontSize: '1.1rem', fontWeight: 'bold'
                      }}
                      onClick={() => setVal(comp.id + '_targetTemperature', targetTempVal - 1, 'TargetTempChanged')}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#ffffff' : '#000000' }}>Adjust</span>
                    <button
                      disabled={targetTempVal >= 32}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: targetTempVal < 32 ? 'pointer' : 'not-allowed',
                        fontSize: '1.1rem', fontWeight: 'bold'
                      }}
                      onClick={() => setVal(comp.id + '_targetTemperature', targetTempVal + 1, 'TargetTempChanged')}
                    >
                      +
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', backgroundColor: isDark ? '#0f172a' : '#cbd5e1', padding: '3px', borderRadius: '8px', gap: '2px' }}>
                      {['AUTO', 'COOL', 'HEAT', 'FAN'].map(m => (
                        <button
                          key={m}
                          style={{
                            flex: 1, padding: '5px 0', border: 'none', borderRadius: '6px',
                            fontSize: '0.65rem', fontWeight: 'bold',
                            backgroundColor: mode === m ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
                            color: mode === m ? '#ff5f00' : '#64748b',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => setValText(comp.id + '_mode', m, 'ModeChanged')}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Droplets size={12} color="#0ea5e9" />
                      <span>Humidity: 48%</span>
                    </div>
                    <span>Status: Idle</span>
                  </div>
                </div>
              )}

              {productCase === 'AIR_PURIFIER' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '12px', borderRadius: '12px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
                    <div style={{ 
                      width: '60px', height: '60px', borderRadius: '50%',
                      border: `4px solid ${aqiValue <= 50 ? '#22c55e' : aqiValue <= 100 ? '#eab308' : '#ef4444'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: isDark ? '#ffffff' : '#000000' }}>{aqiValue}</span>
                      <span style={{ fontSize: '0.45rem', color: '#64748b', fontWeight: 800 }}>AQI PM2.5</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#ffffff' : '#000000' }}>
                        {aqiValue <= 50 ? 'Excellent Quality' : aqiValue <= 100 ? 'Moderate Quality' : 'Poor Quality'}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                        HEPA Clean active
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Power State</span>
                    <div 
                      style={{
                        width: '44px', height: '22px', borderRadius: '11px',
                        backgroundColor: swOn ? '#ff5f00' : (isDark ? '#334155' : '#cbd5e1'),
                        position: 'relative', transition: 'background-color 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => setToggle(comp.id, !swOn)}
                    >
                      <div style={{
                        position: 'absolute', top: '2px', left: swOn ? '24px' : '2px',
                        width: '18px', height: '18px', borderRadius: '50%',
                        backgroundColor: '#ffffff', transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }} />
                    </div>
                  </div>

                  {swOn && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', backgroundColor: isDark ? '#0f172a' : '#cbd5e1', padding: '3px', borderRadius: '8px', gap: '2px' }}>
                          {['AUTO', 'LOW', 'MEDIUM', 'HIGH'].map(s => (
                            <button
                              key={s}
                              style={{
                                flex: 1, padding: '5px 0', border: 'none', borderRadius: '6px',
                                fontSize: '0.65rem', fontWeight: 'bold',
                                backgroundColor: fanSpeed === s ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
                                color: fanSpeed === s ? '#ff5f00' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onClick={() => setValText(comp.id + '_fanSpeed', s, 'FanSpeedChanged')}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                          <span>HEPA Filter Life</span>
                          <span style={{ fontWeight: 'bold' }}>{filterLife}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: isDark ? '#334155' : '#cbd5e1', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${filterLife}%`, height: '100%', backgroundColor: filterLife > 20 ? '#10b981' : '#ef4444', borderRadius: '3px' }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {productCase === 'ROBOT_VACUUM' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '10px', height: '10px', borderRadius: '50%',
                        backgroundColor: swOn ? '#22c55e' : locked ? '#3b82f6' : '#94a3b8',
                        boxShadow: swOn ? '0 0 8px #22c55e' : 'none'
                      }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#ffffff' : '#000000' }}>
                        {swOn ? 'Sweeping...' : locked ? 'Charging' : 'Standby'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#64748b' }}>
                      <BatteryCharging size={12} color="#22c55e" />
                      <span>{locked ? '100%' : `${batteryLevel}%`}</span>
                    </div>
                  </div>

                  <div style={{ 
                    margin: '0 auto', width: '100px', height: '100px', borderRadius: '50%',
                    border: `3px dashed ${isDark ? '#334155' : '#cbd5e1'}`, backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    {swOn && (
                      <div style={{
                        position: 'absolute', width: '100%', height: '100%',
                        background: 'conic-gradient(from 0deg, rgba(255, 95, 0, 0.15) 0deg, rgba(255, 95, 0, 0.3) 120deg, transparent 180deg)',
                        animation: 'radar-sweep 3s linear infinite',
                        pointerEvents: 'none'
                      }} />
                    )}
                    <Cpu size={36} color={swOn ? '#ff5f00' : '#64748b'} style={{ zIndex: 2 }} />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                        backgroundColor: swOn ? '#e11d48' : '#ff5f00', color: '#ffffff',
                        fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}
                      onClick={() => {
                        const nextState = !swOn;
                        setToggle(comp.id, nextState);
                        if (nextState) {
                          setToggle(comp.id + '_locked', false);
                        }
                      }}
                    >
                      <Power size={12} />
                      {swOn ? 'Stop' : 'Start'}
                    </button>
                    <button 
                      disabled={locked}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', 
                        border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                        backgroundColor: locked ? (isDark ? '#0f172a' : '#cbd5e1') : (isDark ? '#1e293b' : '#ffffff'), 
                        color: '#64748b',
                        fontWeight: 'bold', fontSize: '0.75rem', cursor: !locked ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}
                      onClick={() => {
                        setToggle(comp.id + '_locked', true, 'DockReturned');
                        setToggle(comp.id, false);
                      }}
                    >
                      Dock
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.65rem', color: '#64748b' }}>
                    <div style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '6px', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, textAlign: 'center' }}>
                      <div style={{ fontWeight: 800 }}>Area</div>
                      <div>{swOn ? '14.2 m²' : '0.0 m²'}</div>
                    </div>
                    <div style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '6px', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, textAlign: 'center' }}>
                      <div style={{ fontWeight: 800 }}>Time</div>
                      <div>{swOn ? '18 min' : '0 min'}</div>
                    </div>
                  </div>
                </div>
              )}

              {productCase === 'LOCK' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#ffffff' : '#000000' }}>Lock State</span>
                    <span style={{ fontSize: '0.7rem', color: locked ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                      {locked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button 
                      style={{
                        width: '90px', height: '90px', borderRadius: '50%',
                        border: `4px solid ${locked ? '#ef4444' : '#10b981'}`,
                        backgroundColor: isDark ? '#0f172a' : '#f8fafc', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: '6px',
                        cursor: 'pointer',
                        boxShadow: locked ? '0 0 15px rgba(239, 68, 68, 0.15)' : '0 0 15px rgba(16, 185, 129, 0.15)',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setToggle(comp.id + '_locked', !locked, 'LockStateChanged')}
                    >
                      {locked ? <Lock size={28} color="#ef4444" /> : <Unlock size={28} color="#10b981" />}
                      <span style={{ fontSize: '0.5rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                        {locked ? 'Open' : 'Lock'}
                      </span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Temporary PIN</span>
                      <button 
                        style={{ border: 'none', background: 'transparent', color: '#ff5f00', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer' }}
                        onClick={() => {
                          const code = Math.floor(100000 + Math.random() * 900000);
                          setVal(comp.id + '_pinCode', code, 'PINCodeGenerated');
                        }}
                      >
                        Generate
                      </button>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '2px', color: isDark ? '#ffffff' : '#000000', textAlign: 'center' }}>
                      {sliderValues[comp.id + '_pinCode'] || '------'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '55px', overflowY: 'auto', fontSize: '0.6rem', color: '#64748b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                        <span>Fingerprint (Admin)</span>
                        <span>10:15 AM</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px' }}>
                        <span>App Unlock (Operator)</span>
                        <span>08:15 AM</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {productCase === 'SENSOR' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', justifyContent: 'space-between' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '8px', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Temp</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f43f5e' }}>{tempVal}°C</span>
                    </div>
                    <div style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '8px', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Humidity</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0ea5e9' }}>48%</span>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    backgroundColor: swOn ? (isDark ? '#7f1d1d' : '#fef2f2') : (isDark ? '#0f172a' : '#f8fafc'), padding: '8px 10px', 
                    borderRadius: '10px', border: swOn ? '1px solid #fecaca' : `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => setToggle(comp.id, !swOn, 'DoorStateChanged')}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: swOn ? '#ef4444' : (isDark ? '#ffffff' : '#000000') }}>
                        {swOn ? 'Door: OPEN' : 'Door: CLOSED'}
                      </div>
                      <span style={{ fontSize: '0.55rem', color: '#64748b' }}>Trigger sensor</span>
                    </div>
                    <span style={{ fontSize: '1.1rem' }}>{swOn ? '🚨' : '🚪'}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ height: '60px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '8px', padding: '4px', backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                      <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
                        <line x1="0" y1="10" x2="100" y2="10" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="0" y1="20" x2="100" y2="20" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="0.5" strokeDasharray="2,2" />
                        <path d="M 0 22 Q 20 12, 40 18 T 80 14 T 100 12" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                        <path d="M 0 22 Q 20 12, 40 18 T 80 14 T 100 12 L 100 30 L 0 30 Z" fill="rgba(244, 63, 94, 0.08)" />
                      </svg>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#64748b' }}>
                    <span>Battery: {batteryLevel}%</span>
                    <span>Signal: Excellent</span>
                  </div>
                </div>
              )}

              {productCase === 'PLUG' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', justifyContent: 'space-between' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '8px', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.5rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Active Load</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ff5f00' }}>
                        {swOn ? (powerConsumption + (usbOn ? 4.2 : 0) + (locked ? 6.5 : 0)).toFixed(1) : '0.0'} W
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.5rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Energy</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: isDark ? '#ffffff' : '#000000' }}>{totalEnergy} kWh</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '8px', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: `1px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 600, color: isDark ? '#ffffff' : '#000000' }}>
                        <span style={{ width: '5px', height: '5px', backgroundColor: swOn ? '#22c55e' : '#cbd5e1', borderRadius: '50%' }} />
                        <span>Socket 1</span>
                      </div>
                      <div 
                        style={{
                          width: '32px', height: '16px', borderRadius: '8px',
                          backgroundColor: swOn ? '#ff5f00' : (isDark ? '#334155' : '#cbd5e1'),
                          position: 'relative', transition: 'background-color 0.2s',
                          cursor: 'pointer'
                        }}
                        onClick={() => setToggle(comp.id, !swOn, 'Outlet1Toggled')}
                      >
                        <div style={{
                          position: 'absolute', top: '2px', left: swOn ? '18px' : '2px',
                          width: '12px', height: '12px', borderRadius: '50%',
                          backgroundColor: '#ffffff', transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: `1px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 600, color: isDark ? '#ffffff' : '#000000' }}>
                        <span style={{ width: '5px', height: '5px', backgroundColor: usbOn ? '#22c55e' : '#cbd5e1', borderRadius: '50%' }} />
                        <span>Socket 2 (USB)</span>
                      </div>
                      <div 
                        style={{
                          width: '32px', height: '16px', borderRadius: '8px',
                          backgroundColor: usbOn ? '#ff5f00' : (isDark ? '#334155' : '#cbd5e1'),
                          position: 'relative', transition: 'background-color 0.2s',
                          cursor: 'pointer'
                        }}
                        onClick={() => setToggle(comp.id + '_usbOn', !usbOn, 'Outlet2Toggled')}
                      >
                        <div style={{
                          position: 'absolute', top: '2px', left: usbOn ? '18px' : '2px',
                          width: '12px', height: '12px', borderRadius: '50%',
                          backgroundColor: '#ffffff', transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 600, color: isDark ? '#ffffff' : '#000000' }}>
                        <span style={{ width: '5px', height: '5px', backgroundColor: !locked ? '#22c55e' : '#cbd5e1', borderRadius: '50%' }} />
                        <span>Socket 3 (Plug)</span>
                      </div>
                      <div 
                        style={{
                          width: '32px', height: '16px', borderRadius: '8px',
                          backgroundColor: !locked ? '#ff5f00' : (isDark ? '#334155' : '#cbd5e1'),
                          position: 'relative', transition: 'background-color 0.2s',
                          cursor: 'pointer'
                        }}
                        onClick={() => setToggle(comp.id + '_locked', !locked, 'Outlet3Toggled')}
                      >
                        <div style={{
                          position: 'absolute', top: '2px', left: !locked ? '18px' : '2px',
                          width: '12px', height: '12px', borderRadius: '50%',
                          backgroundColor: '#ffffff', transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#64748b' }}>
                    <span>WiFi: Active</span>
                    <span>AC 220V</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'IOT_DEVICE': {
        const dType = comp.props.deviceType || 'Sensor';

        return (
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              {dType === 'Printer' ? <Printer size={18} color="#0ea5e9" /> :
                (dType === 'IP Camera' || dType === 'Webcam') ? <Webcam size={18} color="#0ea5e9" /> :
                  dType === 'Sensor' ? <Wifi size={18} color="#22c55e" /> :
                    <Cpu size={18} color="#f59e0b" />}
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                {comp.props.label || 'IoT Device'}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#64748b', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                {comp.props.ipAddress}:{comp.props.port}
              </span>
            </div>

            <div style={{ marginTop: '10px' }}>
              {dType === 'Printer' && (
                <button
                  onClick={() => { alert(`Printing test page to ${comp.props.ipAddress}...`); fireWidgetTriggers(comp, 'ON_CLICK'); }}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  Test Print Connection
                </button>
              )}
              {(dType === 'IP Camera' || dType === 'Webcam') && (
                <div style={{ width: '100%', height: '180px', backgroundColor: '#1e293b', borderRadius: '6px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', overflow: 'hidden' }}>
                  <Webcam size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <span style={{ fontSize: '0.8rem' }}>Live Feed: {comp.props.ipAddress}</span>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', border: '2px solid white', animation: 'pulse 2s infinite' }} />
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              )}
              {dType === 'Sensor' && (
                <div style={{ padding: '15px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#22c55e' }}>
                    {Math.floor(Math.random() * 20 + 20)}.<span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>{Math.floor(Math.random() * 99)} °C</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase' }}>Live Temperature Reading</div>
                </div>
              )}
              {dType === 'Scale' && (
                <div style={{ padding: '15px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>
                    {Math.floor(Math.random() * 5 + 10)}.<span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>{Math.floor(Math.random() * 99)} kg</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase' }}>Weight Reading</div>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'PRODUCTION_ORDER':
        return (
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#475569', letterSpacing: '0.05em' }}>{comp.props.title || 'CURRENT ORDER'}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[
                { label: 'Order ID', value: currentWorkOrder || 'LOT-' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + String(new Date().getDate()).padStart(2, '0') },
                { label: 'Item', value: selectedApp?.config?.materialId || '1008068-045' },
                { label: 'Description', value: selectedApp ? selectedApp.name : selectedManual.title },
                { label: 'QTY Required', value: Object.values(quantityLog).reduce((acc, l) => acc + l.target, 0) || '10' },
                { label: 'Due Date', value: new Date().toLocaleDateString() + ' 17:00:00' }
              ].map(row => (
                <div key={row.label}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{row.label}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{row.value}</div>
                </div>
              ))}
            </div>
            {comp.props.showProductImage && (
              <div style={{ marginTop: 'auto', border: selectedApp?.config?.productImage ? 'none' : '1px solid #f1f5f9', borderRadius: '8px', padding: selectedApp?.config?.productImage ? '0' : '20px', textAlign: 'center', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                {selectedApp?.config?.productImage ? (
                  <img src={selectedApp.config.productImage} alt="Product" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                ) : (
                  <>
                    <Package size={48} color="#cbd5e1" />
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>PRODUCT IMAGE N/A</div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      case 'PRODUCTION_PROGRESS':
        return (
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>{comp.props.title || 'ASSEMBLY PROGRESS'}</h4>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Lot: {currentWorkOrder || 'LOT-' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + String(new Date().getDate()).padStart(2, '0')}</div>
            <div style={{ backgroundColor: '#2e7d32', color: 'white', padding: '12px', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>Completed units</div>
            <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>
                {Object.values(quantityLog).reduce((acc, l) => acc + l.completed, 0)}
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b', marginLeft: '10px' }}>
                  of {Object.values(quantityLog).reduce((acc, l) => acc + l.target, 10)} Required
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleCompleteUnit} style={{ width: '100%', padding: '15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 900, cursor: 'pointer' }}>COMPLETE UNIT</button>
              <button onClick={handleNextStep} style={{ width: '100%', padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}>NEXT STEP</button>
            </div>
          </div>
        );
      case 'DASHBOARD_METRIC': {
        const data = chartData[comp.id] || [];
        const bindValue = comp.props.dataBinding?.enabled && comp.props.dataBinding.mapping?.value;
        let displayValue = comp.props.value;

        if (bindValue && data.length > 0) {
          const latest = data[data.length - 1];
          displayValue = latest.data?.[bindValue] ?? latest[bindValue] ?? comp.props.value;
        }

        return (
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>{comp.props.title}</div>
            <div style={{ fontSize: (comp.props.fontSize || 48) + 'px', fontWeight: 900, color: comp.props.color || '#0f172a', margin: '5px 0' }}>{displayValue}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{comp.props.subtext}</div>
              {comp.props.showTrend && (
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={16} /> {comp.props.trendValue}
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'DASHBOARD_PARETO': {
        const raw = chartData[comp.id] || [];
        const data = getParetoData(raw, comp.props.categoryColumn, comp.props.valueColumn);
        return (
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '15px' }}>{comp.props.title}</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar yAxisId="left" dataKey="value" fill={comp.props.barColor || '#3b82f6'} radius={[4, 4, 0, 0]} barSize={40} />
                  <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" stroke={comp.props.lineColor || '#f97316'} strokeWidth={3} dot={{ fill: comp.props.lineColor || '#f97316', r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
      case 'BAR_CHART': {
        const raw = chartData[comp.id] || [];
        const { title, xAxis, yAxis, filter, color } = comp.props;
        const data = getAggregatedChartData(raw, xAxis, yAxis, filter);
        return (
          <div key={`${comp.id}-${refreshKey}`} style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '15px' }}>{title || 'Bar Chart'}</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" fill={color || '#3b82f6'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No data available for this chart.
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'DONUT_CHART': {
        const raw = chartData[comp.id] || [];
        const { title, xAxis, yAxis, filter } = comp.props;
        const data = getAggregatedChartData(raw, xAxis, yAxis, filter);
        const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
        
        return (
          <div key={`${comp.id}-${refreshKey}`} style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '15px' }}>{title || 'Donut Chart'}</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No data available for this chart.
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'DASHBOARD_CHART_BAR': {
        const raw = chartData[comp.id] || [];
        const data = raw.map(r => ({
          name: r.data?.[comp.props.xAxisColumn] || r[comp.props.xAxisColumn] || 'N/A',
          value: Number(r.data?.[comp.props.yAxisColumn] || r[comp.props.yAxisColumn] || 0)
        }));
        return (
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '15px' }}>{comp.props.title}</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill={comp.props.color || '#3b82f6'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
      case 'DASHBOARD_CHART_LINE': {
        const raw = chartData[comp.id] || [];
        const data = raw.map(r => ({
          name: r.data?.[comp.props.xAxisColumn] || r[comp.props.xAxisColumn] || 'N/A',
          value: Number(r.data?.[comp.props.yAxisColumn] || r[comp.props.yAxisColumn] || 0)
        }));
        return (
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '15px' }}>{comp.props.title}</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="value" stroke={comp.props.color || '#3b82f6'} strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
      case 'MEDIA_RECORDER': {
        const mode = comp.props.mode || 'AUDIO';
        const isRec = recordingState[comp.id];
        const mediaUrl = mediaRecorderValues[comp.id];

        return (
          <div key={comp.id}>
            <div style={{ fontSize: '0.75rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '8px' }}>
              {comp.props.label || 'Record Media'}{comp.props.required ? ' *' : ''}
            </div>
            <div style={{ border: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', padding: '20px', textAlign: 'center', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : 'white' }}>
              {mediaUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                  {mode === 'AUDIO' ? (
                    <audio src={mediaUrl} controls style={{ width: '100%' }} />
                  ) : (
                    <video src={mediaUrl} controls style={{ width: '100%', maxHeight: '180px', borderRadius: '8px' }} />
                  )}
                  <button
                    onClick={() => setMediaRecorderValues(prev => ({ ...prev, [comp.id]: '' }))}
                    style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', padding: '8px' }}
                  >
                    Delete & Retake
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  {isRec ? (
                    <>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1s infinite' }} />
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444' }}>RECORDING...</div>
                      <button
                        onClick={() => stopMediaRecording(comp)}
                        style={{ padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      >
                        STOP RECORDING
                      </button>
                    </>
                  ) : (
                    <>
                      {mode === 'AUDIO' ? <Mic size={32} color="#94a3b8" /> : <Video size={32} color="#94a3b8" />}
                      <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Ready to record {mode.toLowerCase()}</div>
                      <button
                        onClick={() => startMediaRecording(comp)}
                        style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)' }}
                      >
                        <Play size={16} /> START RECORDING
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'VISION_MEASUREMENT': {
        const isProcessing = ocrProcessing[comp.id];
        const currentValue = visionValues[comp.id] || '';
        const isDark = selectedApp?.config?.appThemeMode === 'DARK';

        return (
          <div key={comp.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
              {comp.props.label || 'Vision Measurement'}{comp.props.required ? ' *' : ''}
            </div>
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', aspectRatio: '4/3', border: `2px solid ${isProcessing ? '#3b82f6' : (isDark ? '#334155' : '#e2e8f0')}`, transition: 'border-color 0.3s' }}>
              <WebcamComp
                audio={false}
                ref={el => visionWebcamRefs.current[comp.id] = el}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {isProcessing && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '12px', zIndex: 10 }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>ANALYZING...</div>
                </div>
              )}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '30%', border: '2px dashed rgba(255,255,255,0.5)', borderRadius: '8px', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>Align Caliper Screen Here</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={currentValue}
                  onChange={e => {
                    const val = e.target.value;
                    setVisionValues(prev => ({ ...prev, [comp.id]: val }));
                    if (comp.props.targetVariable) {
                      setAppVariables(prev => prev.map(v => v.name === comp.props.targetVariable ? { ...v, value: val } : v));
                    }
                    fireWidgetTriggers(comp, 'ON_CHANGE');
                  }}
                  placeholder="Read value..."
                  style={{ width: '100%', padding: '12px 40px 12px 12px', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, backgroundColor: isDark ? '#1e293b' : 'white', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '1.1rem', fontWeight: 700 }}
                />
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>
                  {safeRender(comp.props.unit)}
                </div>
              </div>
              <button
                onClick={() => handleVisionOcr(comp, { current: visionWebcamRefs.current[comp.id] })}
                disabled={isProcessing}
                style={{ padding: '0 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)' }}
              >
                <Camera size={18} /> {isProcessing ? 'SCANNING' : 'SCAN'}
              </button>
            </div>
            {comp.props.targetVariable && (
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic' }}>
                Syncing to variable: @{comp.props.targetVariable}
              </div>
            )}
          </div>
        );
      }
      // --- OBD2 WIDGETS ---
      case 'OBD2_SCANNER': {
        const connected = obd2Status === 'connected';
        const transport = comp.props.transport || 'BLUETOOTH';
        return (
          <div
            onClick={async () => {
              if (connected) {
                await obd2Service.disconnect();
              } else {
                try {
                  if (transport === 'BLUETOOTH') await obd2Service.connectBluetooth();
                  else await obd2Service.connectSerial();
                } catch (err) {
                  alert("OBD2 Connection Failed: " + err.message);
                }
              }
            }}
            style={{ width: '100%', height: '100%', borderRadius: '12px', border: connected ? '2px solid #10b981' : '2px dashed #64748b', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : 'white', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)' }}>
              <Car size={32} color={connected ? '#10b981' : '#64748b'} />
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedApp?.config?.appThemeMode === 'DARK' ? 'white' : '#1e293b' }}>{comp.props.label || 'OBD2 Scanner'}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: connected ? '#10b981' : '#dc2626' }} />
              {connected ? `CONNECTED (${transport})` : `DISCONNECTED (${transport})`}
            </div>
          </div>
        );
      }
      case 'OBD2_CLEAR_DTC': {
        return (
          <button
            onClick={async () => {
              if (obd2Status !== 'connected') return alert("Connect OBD2 first");
              const ok = await obd2Service.clearDTC();
              if (ok) alert("DTCs cleared successfully");
              else alert("Failed to clear DTCs");
              await fireWidgetTriggers(comp, 'ON_CLICK');
              await fireWidgetTriggers(comp, ok ? 'DTCCleared' : 'ClearDTCFailed');
            }}
            style={{ width: '100%', height: '100%', padding: '12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Trash2 size={18} />
            {comp.props.label || 'Clear DTC'}
          </button>
        );
      }
      case 'OBD2_DTC': {
        const val = obd2Values['DTC']?.value || '[]';
        let dtcArray = [];
        try { dtcArray = typeof val === 'string' ? JSON.parse(val) : val; if (!Array.isArray(dtcArray)) dtcArray = []; } catch (e) { dtcArray = []; }
        return (
          <div style={{ width: '100%', height: '100%', borderRadius: '10px', border: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#f1f5f9'}`, backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bug size={16} color="#dc2626" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedApp?.config?.appThemeMode === 'DARK' ? 'white' : '#0f172a' }}>{comp.props.label || 'Diagnostic Trouble Codes'}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '999px', backgroundColor: dtcArray.length > 0 ? '#fee2e2' : '#d1fae5', color: dtcArray.length > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{dtcArray.length} Codes</span>
            </div>
            <div style={{ flex: 1, padding: '8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {dtcArray.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>No DTCs Found</div>
              ) : (
                dtcArray.map((code, idx) => (
                  <div key={idx} style={{ padding: '8px', borderRadius: '6px', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f8fafc', border: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#dc2626' }}>{code}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      }
      case 'OBD2_MIL_STATUS': {
        const val = obd2Values['0101']?.value || 'OFF';
        const isMilOn = String(val).toUpperCase() === 'ON';
        return (
          <div style={{ width: '100%', height: '100%', borderRadius: '10px', border: `1px solid ${isMilOn ? '#f59e0b' : (selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0')}`, backgroundColor: isMilOn ? 'rgba(245, 158, 11, 0.05)' : (selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : 'white'), padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '50%', backgroundColor: isMilOn ? '#f59e0b' : 'rgba(100, 116, 139, 0.1)', color: isMilOn ? 'white' : '#64748b' }}>
              <AlertTriangle size={24} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Check Engine</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isMilOn ? '#f59e0b' : '#64748b' }}>{isMilOn ? 'MIL ON' : 'MIL OFF'}</span>
            </div>
          </div>
        );
      }
      case 'OBD2_WARNING': {
        const rawSpeed = obd2Values['010D']?.value;
        const speed = typeof rawSpeed === 'number' ? rawSpeed : (parseFloat(rawSpeed) || 0);

        const rawTemp = obd2Values['0105']?.value;
        const temp = typeof rawTemp === 'number' ? rawTemp : (parseFloat(rawTemp) || 0);

        const rawVolt = obd2Values['0142']?.value;
        const volt = typeof rawVolt === 'number' ? rawVolt : (parseFloat(rawVolt) || 0);

        const dtcVal = obd2Values['DTC']?.value || '[]';
        let dtcCount = 0;
        try {
          const dtcArray = typeof dtcVal === 'string' ? JSON.parse(dtcVal) : dtcVal;
          if (Array.isArray(dtcArray)) dtcCount = dtcArray.length;
        } catch (e) {
          dtcCount = 0;
        }

        const speedLimit = comp.props.speedLimit ?? 100;
        const maxTemp = comp.props.maxTemp ?? 98;
        const minVoltage = comp.props.minVoltage ?? 11.5;

        const activeWarnings = [];
        if (speed > speedLimit) activeWarnings.push(`Kecepatan: ${speed} > ${speedLimit} km/h`);
        if (temp > maxTemp) activeWarnings.push(`Suhu: ${temp} > ${maxTemp}°C`);
        if (volt > 0 && volt < minVoltage) activeWarnings.push(`Aki: ${volt} < ${minVoltage} V`);
        if (dtcCount > 0) activeWarnings.push(`Check Engine aktif`);

        const hasWarning = activeWarnings.length > 0;
        const isDark = selectedApp?.config?.appThemeMode === 'DARK';

        return (
          <div
            className={hasWarning ? 'animate-warning-blink' : ''}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '10px',
              border: hasWarning ? '1.5px solid #f87171' : `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              backgroundColor: hasWarning ? 'rgba(239, 68, 68, 0.05)' : (isDark ? '#1e293b' : 'white'),
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color={hasWarning ? '#ef4444' : '#64748b'} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: hasWarning ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b') }}>
                {hasWarning ? 'Peringatan Mesin!' : 'Status Mesin Normal'}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: isDark ? '#cbd5e1' : '#475569', maxHeight: '60px', overflowY: 'auto' }}>
              {hasWarning ? (
                activeWarnings.map((w, idx) => <div key={idx}>⚠️ {w}</div>)
              ) : (
                'Seluruh sistem kendaraan terpantau aman.'
              )}
            </div>
          </div>
        );
      }
      case 'OBD2_RPM':
      case 'OBD2_SPEED':
      case 'OBD2_COOLANT_TEMP':
      case 'OBD2_THROTTLE':
      case 'OBD2_ENGINE_LOAD':
      case 'OBD2_MAF':
      case 'OBD2_IAT':
      case 'OBD2_FUEL_LEVEL':
      case 'OBD2_FUEL_PRESSURE':
      case 'OBD2_STFT':
      case 'OBD2_LTFT':
      case 'OBD2_AFR':
      case 'OBD2_O2_SENSOR':
      case 'OBD2_IGNITION_TIMING':
      case 'OBD2_KNOCK':
      case 'OBD2_TORQUE_EST':
      case 'OBD2_HP_EST':
      case 'OBD2_OIL_TEMP':
      case 'OBD2_MAP':
      case 'OBD2_BARO':
      case 'OBD2_BOOST':
      case 'OBD2_BATTERY_VOLTAGE': {
        const defaultPid = OBD2_DEFAULT_PIDS[comp.type];
        const pid = comp.props.pid || defaultPid;
        const data = obd2Values[pid?.toUpperCase()] || { value: '--', unit: comp.props.unit || '' };
        const connected = obd2Status === 'connected';

        const IconMap = {
          'OBD2_RPM': Gauge,
          'OBD2_SPEED': TrendingUp,
          'OBD2_COOLANT_TEMP': Thermometer,
          'OBD2_OIL_TEMP': Thermometer,
          'OBD2_FUEL_LEVEL': Fuel,
          'OBD2_BATTERY_VOLTAGE': Activity
        };
        const IconComponent = IconMap[comp.type] || Activity;

        return (
          <div style={{ width: '100%', height: '100%', borderRadius: '10px', border: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : 'white', padding: '10px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconComponent size={14} color="#0ea5e9" />
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{comp.props.label || comp.type.replace('OBD2_', '').replace(/_/g, ' ')}</span>
              </div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: connected ? '#10b981' : '#cbd5e1', flexShrink: 0 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', maxWidth: '100%' }}>
                <span style={{
                  fontSize: String(data.value).length > 4 ? '1.2rem' : '1.6rem',
                  lineHeight: 1,
                  fontWeight: 900,
                  color: selectedApp?.config?.appThemeMode === 'DARK' ? 'white' : '#0f172a',
                  whiteSpace: 'nowrap'
                }}>{data.value}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{data.unit}</span>
              </div>
            </div>
          </div>
        );

      }
      // ── SHAPE aliases (AI generates these, LiveTerminal uses 'SHAPE') ──
      case 'SHAPE_RECTANGLE':
      case 'SHAPE_SQUARE':
        return (
          <div style={{
            width: '100%', height: '100%',
            backgroundColor: comp.props.backgroundColor || 'transparent',
            borderRadius: (comp.props.borderRadius || 0) + 'px',
            border: comp.props.borderWidth > 0 ? `${comp.props.borderWidth}px solid ${comp.props.bordercolor || '#e2e8f0'}` : 'none'
          }} />
        );
      case 'SHAPE_CIRCLE':
        return (
          <div style={{
            width: '100%', height: '100%',
            backgroundColor: comp.props.backgroundColor || '#e2e8f0',
            borderRadius: '50%',
            border: comp.props.borderWidth > 0 ? `${comp.props.borderWidth}px solid ${comp.props.bordercolor || '#94a3b8'}` : 'none'
          }} />
        );
      case 'SHAPE_LINE':
        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', height: `${comp.props.strokeWidth || 2}px`, backgroundColor: comp.props.backgroundcolor || comp.props.backgroundColor || '#e2e8f0', borderRadius: '999px' }} />
          </div>
        );
      case 'SHAPE_ARROW':
      case 'SHAPE_DOUBLE_ARROW':
      case 'SHAPE_TRIANGLE':
        return (
          <div style={{ width: '100%', height: '100%', backgroundColor: comp.props.backgroundColor || '#3b82f6', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        );
      // ── DIAL_GAUGE ──
      case 'DIAL_GAUGE':
      case 'GAUGE_CIRCULAR': {
        const val = Number(comp.props.value || 0);
        const min = Number(comp.props.min || 0);
        const max = Number(comp.props.max || 100);
        const pct = Math.min(1, Math.max(0, (val - min) / (max - min)));
        const angle = -135 + pct * 270;
        const color = comp.props.color || '#3b82f6';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>{comp.props.title || comp.props.label}</div>
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                <path d="M 10 80 A 45 45 0 1 1 90 80" fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="10" strokeLinecap="round" />
                <path d="M 10 80 A 45 45 0 1 1 90 80" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${pct * 251.3} 251.3`} />
                <text x="50" y="72" textAnchor="middle" fontSize="18" fontWeight="900" fill={isDark ? '#f8fafc' : '#0f172a'}>{val}</text>
                <text x="50" y="84" textAnchor="middle" fontSize="8" fill="#94a3b8">{comp.props.unit}</text>
              </svg>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{min} – {max} {comp.props.unit}</div>
          </div>
        );
      }
      // ── MACHINE_TIMELINE ──
      case 'MACHINE_TIMELINE': {
        const slots = [
          { label: '06:00', status: 'RUNNING', dur: 2 }, { label: '08:00', status: 'FAULT', dur: 0.5 },
          { label: '08:30', status: 'RUNNING', dur: 3 }, { label: '11:30', status: 'STOPPED', dur: 0.5 },
          { label: '12:00', status: 'RUNNING', dur: 4 }, { label: '16:00', status: 'STOPPED', dur: 1 }
        ];
        const total = slots.reduce((s, x) => s + x.dur, 0);
        const colorMap = { RUNNING: '#10b981', STOPPED: '#94a3b8', FAULT: '#ef4444' };
        return (
          <div style={{ backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', marginBottom: '12px' }}>{comp.props.title || 'Machine Timeline'}</div>
            <div style={{ display: 'flex', height: '32px', borderRadius: '8px', overflow: 'hidden', gap: '2px' }}>
              {slots.map((s, i) => (
                <div key={i} title={`${s.label} — ${s.status}`} style={{ flex: s.dur / total, backgroundColor: colorMap[s.status] || '#94a3b8' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
              {Object.entries(colorMap).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: v }} />{k}
                </div>
              ))}
            </div>
          </div>
        );
      }
      // ── TABLE_AGGREGATION ──
      case 'TABLE_AGGREGATION': {
        const aggData = tableData[comp.props.tableId] || [];
        let aggVal = 0;
        if (aggData.length > 0 && comp.props.column) {
          const vals = aggData.map(r => parseFloat(r[comp.props.column])).filter(v => !isNaN(v));
          if (comp.props.calculation === 'COUNT') aggVal = aggData.length;
          else if (comp.props.calculation === 'SUM') aggVal = vals.reduce((a, b) => a + b, 0);
          else if (comp.props.calculation === 'AVG') aggVal = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
          else if (comp.props.calculation === 'MIN') aggVal = Math.min(...vals);
          else if (comp.props.calculation === 'MAX') aggVal = Math.max(...vals);
          else aggVal = aggData.length;
        } else if (aggData.length > 0) { aggVal = aggData.length; }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            {comp.props.label && <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{comp.props.label}</div>}
            <div style={{ fontSize: `${comp.props.fontSize || 28}px`, fontWeight: 900, color: comp.props.color || (isDark ? '#f8fafc' : '#0f172a'), lineHeight: 1 }}>
              {comp.props.prefix}{Math.round(aggVal * 100) / 100}{comp.props.suffix}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{comp.props.calculation || 'COUNT'}</div>
          </div>
        );
      }
      // ── RECORD_DISPLAY ──
      case 'RECORD_DISPLAY': {
        const ph = (recordPlaceholders || []).find(p => p.id === comp.props.placeholderId || p.name === comp.props.placeholderId);
        const rec = ph ? (recordPlaceholderData[ph.id] || {}) : {};
        const fields = comp.props.fieldsToShow?.length > 0 ? comp.props.fieldsToShow : Object.keys(rec).slice(0, 6);
        return (
          <div style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', overflow: 'hidden' }}>
            {comp.props.title && (
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, fontSize: '0.85rem', fontWeight: 800, color: isDark ? '#cbd5e1' : '#475569', backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}>
                {comp.props.title}
              </div>
            )}
            <div style={{ padding: '16px' }}>
              {fields.length > 0 ? fields.map(f => {
                let val = rec[f];
                if (val === undefined && (f === 'ID' || f === 'id' || f === 'recordId' || f === 'record_id')) {
                  val = rec.recordId || rec.record_id || rec.id || rec.ID;
                }
                return (
                  <div key={f} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{f}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>{safeRender(val) || '—'}</span>
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '20px' }}>No record loaded</div>
              )}
            </div>
          </div>
        );
      }
      // ── MACHINE_ATTRIBUTE ──
      case 'MACHINE_ATTRIBUTE': {
        const attrVal = machineTagValues?.[`${comp.props.machineId}_${comp.props.attribute}`] || comp.props.value || '—';
        return (
          <div style={{ backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{comp.props.attribute || 'Attribute'}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#3b82f6', fontFamily: 'monospace' }}>{safeRender(attrVal)}</div>
            {comp.props.unit && <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{comp.props.unit}</div>}
          </div>
        );
      }
      // ── STEP_TIME ──
      case 'STEP_TIME': {
        const [elapsed, setElapsed] = React.useState(0);
        React.useEffect(() => {
          const t = setInterval(() => setElapsed(e => e + 1), 1000);
          return () => clearInterval(t);
        }, []);
        const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{comp.props.mode === 'COUNTDOWN' ? 'Remaining' : 'Elapsed'}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', fontFamily: 'monospace' }}>{fmt(elapsed)}</div>
          </div>
        );
      }
      // ── EMBED_WEB / WEBPAGE ──
      case 'EMBED_WEB':
      case 'WEBPAGE':
        return (
          <div style={{ width: '100%', height: '100%', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', overflow: 'hidden' }}>
            {(comp.props.url && comp.props.url !== 'https://') ? (
              <iframe src={comp.props.url} style={{ width: '100%', height: '100%', border: 'none' }} title={comp.props.title || 'Web'} sandbox="allow-scripts allow-same-origin" />
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '8px' }}>
                <div style={{ fontSize: '2rem' }}>🌐</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>No URL configured</div>
              </div>
            )}
          </div>
        );
      // ── BARCODE_SCANNER ──
      case 'BARCODE_SCANNER': {
        const isCompact = comp.h ? comp.h < 120 : true;
        const val = barcodeValues[comp.id] || '';
        
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}>
            {comp.props.label && (
              <div style={{
                fontSize: '0.72rem',
                color: isDark ? '#94a3b8' : '#475569',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {comp.props.label} {comp.props.required ? '*' : ''}
              </div>
            )}
            
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              width: '100%'
            }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder={comp.props.placeholder || 'Scan or type barcode...'}
                  value={val}
                  autoFocus={comp.props.autoFocus}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setBarcodeValues(prev => ({ ...prev, [comp.id]: nextVal }));
                    syncVariable(nextVal);
                    fireWidgetTriggers(comp, 'ON_SCAN', nextVal);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    paddingRight: '32px',
                    borderRadius: '8px',
                    border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                    backgroundColor: isDark ? '#1e293b' : 'white',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = isDark ? '#334155' : '#cbd5e1'}
                />
                <span style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: isDark ? '#64748b' : '#94a3b8',
                  pointerEvents: 'none',
                  fontSize: '0.8rem'
                }}>
                  🔍
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => setCameraScannerActive(prev => ({ ...prev, [comp.id]: true }))}
                title="Scan using camera"
                style={{
                  height: '36px',
                  width: '36px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                <Camera size={16} />
              </button>
            </div>

            {/* Status indicator if camera scanner succeeded */}
            {cameraScannerStatus[comp.id] && !isCompact && (
              <div style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: 600, marginTop: '2px' }}>
                {cameraScannerStatus[comp.id]}
              </div>
            )}

            {cameraScannerActive[comp.id] && (
              <UnifiedScanner
                label={comp.props.label || 'Scan Barcode / QR'}
                onScan={(scannedVal) => {
                  setBarcodeValues(prev => ({ ...prev, [comp.id]: scannedVal }));
                  syncVariable(scannedVal);
                  fireWidgetTriggers(comp, 'ON_SCAN', scannedVal);
                  setCameraScannerActive(prev => ({ ...prev, [comp.id]: false }));
                }}
                onClose={() => setCameraScannerActive(prev => ({ ...prev, [comp.id]: false }))}
              />
            )}
          </div>
        );
      }
      // ── SIGNATURE_PAD ──
      case 'SIGNATURE_PAD':
        return (
          <div>
            <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '8px' }}>{comp.props.label || 'Signature'}{comp.props.required ? ' *' : ''}</div>
            <div style={{ border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', padding: '12px', backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}>
              <canvas width={520} height={150}
                ref={(el) => { if (el) ensureSignatureCanvas(comp.id); signatureCanvasRefs.current[comp.id] = el; }}
                onMouseDown={(e) => startSignatureDraw(comp.id, e)} onMouseMove={(e) => moveSignatureDraw(comp.id, e)}
                onMouseUp={() => endSignatureDraw(comp.id, comp)} onMouseLeave={() => endSignatureDraw(comp.id, comp)}
                onTouchStart={(e) => startSignatureDraw(comp.id, e)} onTouchMove={(e) => moveSignatureDraw(comp.id, e)}
                onTouchEnd={() => endSignatureDraw(comp.id, comp)}
                style={{ width: '100%', backgroundColor: comp.props.backgroundColor || 'white', border: '1px dashed #cbd5e1', borderRadius: '6px', touchAction: 'none' }}
              />
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => clearSignatureCanvas(comp.id, comp)} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white', fontSize: '0.75rem', cursor: 'pointer' }}>Clear</button>
              </div>
            </div>
          </div>
        );
      // ── AI_CHAT ──
      case 'AI_CHAT':
        return (
          <div style={{ backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, fontSize: '0.85rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🤖</span>{comp.props.title || 'AI Assistant'}
            </div>
            <div style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>AI Chat active in live mode</div>
            <div style={{ padding: '12px', borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, display: 'flex', gap: '8px' }}>
              <input placeholder={comp.props.placeholder || 'Type message...'} style={{ flex: 1, padding: '8px 12px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.85rem', outline: 'none' }} />
              <button style={{ padding: '8px 14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>Send</button>
            </div>
          </div>
        );
      // ── PDF_VIEWER / DOCUMENT ──
      case 'PDF_VIEWER':
      case 'DOCUMENT':
        return (
          <div style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 15px', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600, fontSize: '0.9rem', color: isDark ? '#f8fafc' : '#0f172a' }}>📄 {comp.props.title || 'Document'}</div>
            {comp.props.url ? (
              <iframe
                src={comp.props.url.includes('#') ? (comp.props.url.includes('toolbar=') ? comp.props.url : `${comp.props.url}&toolbar=0`) : `${comp.props.url}#toolbar=0`}
                style={{ width: '100%', height: '300px', border: 'none' }}
                title={comp.props.title}
              />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No document URL configured</div>
            )}
          </div>
        );
      // ── GRID ──
      case 'GRID': {
        const rows = comp.props.rows || 4, cols = comp.props.cols || 4;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: '1px', width: '100%', height: '100%', backgroundColor: '#e2e8f0' }}>
            {Array.from({ length: rows * cols }).map((_, i) => <div key={i} style={{ backgroundColor: isDark ? '#1e293b' : 'white' }} />)}
          </div>
        );
      }
      // ── LEAN_DASHBOARD_WIDGET ──
      case 'LEAN_DASHBOARD_WIDGET': {
        const incidents = String(resolveValue(comp.props.targetVariable) || comp.props.incidents || 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY').toUpperCase();
        const letter = comp.props.letter || 'P';
        const monthDate = new Date(resolveValue(comp.props.month) || comp.props.month || Date.now());
        const monthName = monthDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
        const location = resolveValue(comp.props.location) || comp.props.location || 'Boston';
        
        const pathDataMap = {
          'P': 'M 25,90 L 25,20 A 25,25 0 1,1 25,70',
          'S': 'M 75,25 C 75,-5 25,-5 25,25 C 25,50 75,50 75,75 C 75,105 25,105 25,75',
          'Q': 'M 50,20 A 30,30 0 1,0 50,80 A 30,30 0 1,0 50,20',
          'D': 'M 25,10 L 25,90 A 40,40 0 0,0 25,10',
          'C': 'M 75,20 A 35,35 0 1,0 75,80'
        };
        const titleMap = { 'P': 'PEOPLE', 'S': 'SAFETY', 'Q': 'QUALITY', 'D': 'DELIVERY', 'C': 'COST' };
        const colorMap = { 'P': '#fbbf24', 'S': '#a3e635', 'Q': '#ef4444', 'D': '#ec4899', 'C': '#3b82f6' };
        
        const pathData = pathDataMap[letter] || pathDataMap['P'];
        
        const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
        const currentDay = new Date().getDate();
        const isCurrentMonth = new Date().getMonth() === monthDate.getMonth() && new Date().getFullYear() === monthDate.getFullYear();
        
        return (
          <div style={{ backgroundColor: isDark ? '#0f172a' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
            <div style={{ width: '100%', backgroundColor: colorMap[letter], color: 'white', textAlign: 'center', padding: '8px', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.1em' }}>
              {titleMap[letter]}
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>{location}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>{monthName}</div>
            </div>
            <div style={{ flex: 1, width: '100%', marginTop: '16px', position: 'relative' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <path d={pathData} fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                {letter === 'Q' && <path d="M 60,70 L 85,95" fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="16" strokeLinecap="round" />}
                {Array.from({ length: 31 }).map((_, i) => {
                  if (i >= daysInMonth) return null;
                  const isFuture = isCurrentMonth && (i + 1 > currentDay);
                  const statusChar = incidents.charAt(i) || 'N';
                  const color = isFuture ? '#94a3b8' : (statusChar === 'Y' ? '#22c55e' : '#ef4444');
                  return (
                    <path 
                      key={i}
                      d={pathData}
                      fill="none"
                      stroke={color}
                      strokeWidth="12"
                      pathLength="31"
                      strokeDasharray="0.95 31"
                      strokeDashoffset={-i}
                      style={{ cursor: comp.props.preventUpdates ? 'default' : 'pointer', transition: 'stroke 0.3s' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (comp.props.preventUpdates) return;
                        let newIncidents = incidents.padEnd(31, 'N').split('');
                        newIncidents[i] = newIncidents[i] === 'Y' ? 'N' : 'Y';
                        const newStr = newIncidents.join('');
                        syncVariableForComp(comp, newStr);
                        fireWidgetTriggers(comp, 'ON_CLICK', { day: i + 1, status: newIncidents[i] });
                      }}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        );
      }
      // ── ANALYTIC ──
      case 'ANALYTIC': {
        const analysisId = comp.props.analysisId;
        const refreshSeconds = Math.max(5, comp.props.refreshSeconds || 10);
        return (
          <LiveAnalyticWrapper 
            analysisId={analysisId} 
            title={comp.props.title} 
            refreshSeconds={refreshSeconds} 
            isDark={isDark} 
          />
        );
      }
      // ── CAD_VIEWER / CAD ──
      case 'CAD':
      case 'CAD_VIEWER': {
        const fileUrl = comp.props?.fileUrl || comp.props?.source || '';
        const format = (comp.props?.format || '').toUpperCase();
        const drawings = (() => {
          try { return JSON.parse(localStorage.getItem('mavi_drawings') || '[]'); } catch { return []; }
        })();
        const selectedDwg = drawings.find(d => d.id === fileUrl || d.fileName === fileUrl || d.file_name === fileUrl || d.name === fileUrl);
        const dwgType = (selectedDwg?.fileType || selectedDwg?.file_type || '').toUpperCase();
        
        // 3D viewer is only used if explicitly a 3D format or 3D interactive preset
        const is3D = fileUrl === 'interactive-3d-cad' || 
                     ['STL', 'OBJ', 'GLTF', 'GLB', 'STEP', 'IGES'].includes(dwgType) || 
                     (typeof fileUrl === 'string' && /\.(stl|obj|gltf|glb|step|iges)$/i.test(fileUrl));

        if (is3D) {
          return (
            <CADViewer3D 
              fileUrl={fileUrl}
              appVariables={appVariables} 
              setAppVariables={setAppVariables} 
            />
          );
        }

        return (
          <CADViewer2D 
            fileUrl={fileUrl}
            appVariables={appVariables} 
            setAppVariables={setAppVariables} 
          />
        );
      }
      case 'MEASUREMENT_WIDGET':
      case 'OUTSIDE_MICROMETER':
      case 'INSIDE_MICROMETER':
      case 'DIAL_HEIGHT_GAUGE':
      case 'DEPTH_GAUGE':
      case 'ROUGHNESS_TESTER':
      case 'TORQUE_WRENCH':
      case 'WEIGHING_SCALE':
        return (
          <MeasurementWidget
            comp={comp}
            syncVariable={syncVariable}
            fireWidgetTriggers={fireWidgetTriggers}
            isDark={isDark}
          />
        );
      case 'ARDUINO_BOARD':
      case 'ARDUINO_PIN_MONITOR':
      case 'ARDUINO_CONTROLLER':
      case 'ARDUINO_GRAPH':
      case 'ARDUINO_CONSOLE':
      case 'ARDUINO_GAUGE':
      case 'ARDUINO_COLOR_PICKER':
      case 'ARDUINO_MOTOR':
      case 'ARDUINO_RFID':
      case 'ARDUINO_LCD':
      case 'ARDUINO_JOYSTICK':
      case 'ARDUINO_KEYPAD':
      case 'ARDUINO_MATRIX':
      case 'ARDUINO_RTC':
      case 'ARDUINO_RADAR':
      case 'ARDUINO_TANK':
      case 'ARDUINO_MODBUS':
      case 'ARDUINO_STATUS_GRID':
      case 'ARDUINO_OSCILLOSCOPE':
      case 'ARDUINO_THERMAL':
      case 'ARDUINO_THERMOMETER':
        return (
          <ArduinoWidget
            comp={comp}
            syncVariable={syncVariable}
            fireWidgetTriggers={fireWidgetTriggers}
            isDark={isDark}
          />
        );
      default: return (
        <div style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #fecaca' }}>
          Unknown Type: {comp.type}
        </div>
      );
    }
  };

  // --- INITIALIZATION / LOADING VIEW ---
  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6',
            borderRadius: '50%', animation: 'mavi-spin 1s linear infinite', margin: '0 auto 20px'
          }}></div>
          <style>{`@keyframes mavi-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Launching App...</p>
        </div>
      </div>
    );
  }

  // --- APP NOT FOUND ERROR ---
  if (appId && !selectedApp) {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center', backgroundColor: '#f8fafc', padding: '40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>ℹ️</div>
          <h2 style={{ color: '#001e3c', margin: '0 0 10px 0' }}>Select Your App</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '30px' }}>
            We found {frontlineApps.length} app(s) in your local memory. Please select the one you want to run:
          </p>

          <div style={{ display: 'grid', gap: '12px', marginBottom: '30px' }}>
            {frontlineApps.map(a => (
              <button
                key={a.id}
                onClick={() => handleStartApp(a)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 25px',
                  backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#001e3c' }}>{a.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {a.id}</div>
                </div>
                <div style={{ color: '#3b82f6', fontWeight: 700 }}>Launch →</div>
              </button>
            ))}
          </div>

          <button
            onClick={() => window.location.href = '/#/terminal'}
            style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
          >
            Back to Selection
          </button>
        </div>
      </div>
    );
  }

  // --- SELECTION VIEW ---
  if (!selectedManual && !selectedApp) {
    // Determine the current station object
    const currentStationObj = stations.find(s => s.id === appContext.station || s.name === appContext.station);

    // --- ENFORCE ACCESS CONTROL OVERRIDE ---
    // --- ENFORCE ACCESS CONTROL OVERRIDE ---
    const user = getCurrentUser();
    const allUsers = getAllUsers();
    const freshUser = allUsers.find(u => u.id === user?.id) ||
      allUsers.find(u => u.username === user?.username) ||
      allUsers.find(u => u.name === user?.name) ||
      user;

    // Filter apps based on assigned station
    const baseFilteredApps = frontlineApps.filter(app => {
      // If operator has a specific app assigned, we skip station-level filtering 
      // because frontlineApps is already pre-filtered for them in loadData().
      if (freshUser?.role === 'OPERATOR' && freshUser?.assignedApp && freshUser?.assignedApp !== 'ALL' && freshUser?.assignedApp !== 'NONE') {
        return true;
      }

      if (!currentStationObj || !currentStationObj.assignedApps) return true; // fallback to all if no station config
      return (currentStationObj.assignedApps || []).includes(app.id);
    });

    // Apply Search Filter
    const searchFilteredApps = baseFilteredApps.filter(app =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply Tab Filter
    const tabFilteredApps = searchFilteredApps.filter(app => {
      if (terminalTab === 'Favorites') return favoriteApps.includes(app.id);
      if (terminalTab === 'Recent') return recentApps.includes(app.id);
      return true; // 'All'
    });

    // Group apps dynamically
    const appGroups = {};
    tabFilteredApps.forEach(app => {
      const category = app.category || 'Custom Apps';
      if (!appGroups[category]) appGroups[category] = [];
      appGroups[category].push(app);
    });


    // App Gradients
    const appGradients = [
      'linear-gradient(135deg, #001e3c 0%, #004282 100%)',
      'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
      'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
      'linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)',
      'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)'
    ];

    const getAppGradient = (name) => {
      if (!name) return appGradients[0];
      const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return appGradients[sum % appGradients.length];
    };


    // --- COMPONENT RENDERING ENGINE ---

    if (isMobile) {
      return (
        <div style={{ height: '100dvh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
          {/* Mobile Header */}
          <div style={{ padding: '16px 20px', backgroundColor: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>STATION {appContext.station}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(34, 197, 94, 0.15)', padding: '4px 10px', borderRadius: '12px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#22c55e' }}>ONLINE</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 90px 20px' }}>
            {activeMobileTab === 'apps' && (
              <div className="fade-in">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>Production Apps</h3>
                {tabFilteredApps.map(app => (
                  <div
                    key={app.id}
                    onClick={() => handleStartApp(app)}
                    style={{
                      backgroundColor: 'white', borderRadius: '16px', padding: '16px', marginBottom: '16px',
                      display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative'
                    }}
                  >
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '12px',
                      background: getAppGradient(app.name), display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                      <LayoutGrid size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{app.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>v{app.version || '1.0'} • {app.category || 'App'}</div>
                    </div>
                    <ChevronRight size={20} color="#cbd5e1" />
                  </div>
                ))}
              </div>
            )}

            {activeMobileTab === 'stats' && (
              <div className="fade-in">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>Station Metrics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  {Object.entries(oeeData[currentStationObj?.id] || {}).map(([key, val]) => (
                    <div key={key} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{key}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{typeof val === 'number' ? `${val.toFixed(1)}%` : val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <MobileBottomNav
            activeTab={activeMobileTab}
            onTabChange={(tab) => {
              if (tab === 'scan') setShowGlobalScanner(true);
              else if (tab === 'chat') setShowChat(true);
              else setActiveMobileTab(tab);
            }}
          />

          {showGlobalScanner && (
            <UnifiedScanner
              label="Global Quick Scan"
              onScan={(val) => {
                setShowGlobalScanner(false);
                toast.success(`Scanned: ${val}`);
                // Future: Add logic to handle global scans (e.g. searching for work orders)
              }}
              onClose={() => setShowGlobalScanner(false)}
            />
          )}
        </div>
      );
    }

    return (
      <div style={{ height: '100%', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>

        {/* GLOBAL STATION HEADER */}
        <div style={{
          height: '64px', backgroundColor: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', flexShrink: 0, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ backgroundColor: '#3b82f6', padding: '8px', borderRadius: '8px' }}>
                <Activity size={20} color="white" />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.05em' }}>STATION {appContext.station}</div>
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', transition: 'background-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => setShowOperatorMenu(true)}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1px solid #334155' }}>
                {appContext.user.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>OPERATOR</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{appContext.user}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace' }}>{currentTime.toLocaleTimeString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: isOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${isOnline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
              <span className={`pulse-dot ${isOnline ? 'pulse-dot-success' : 'pulse-dot-danger'}`} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isOnline ? '#22c55e' : '#ef4444' }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <button
              onClick={() => setShowDiagnostics(true)}
              style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20px', backgroundColor: '#f1f5f9' }}>
          <div style={{ maxWidth: '100%', margin: '0 auto' }}>

            {/* TRACKING IDENTITY (Work Order) */}
            <div style={{ marginBottom: '40px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Barcode size={24} color="#64748b" />
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>Tracking Identity</h2>
              </div>
              <WorkOrderManager
                currentWorkOrder={currentWorkOrder}
                onSelect={(wo) => {
                  setCurrentWorkOrder(wo);
                  if (wo) {
                    logEvent({
                      type: AUDIT_EVENTS.WORK_ORDER_BIND,
                      workstation: appContext.station,
                      workOrder: wo
                    });
                  }
                }}
              />
            </div>

            {/* SEARCH & FILTERS */}
            <div style={{ marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '10px', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
                {['All', 'Favorites', 'Recent'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTerminalTab(tab)}
                    style={{
                      padding: '8px 16px', borderRadius: '6px', border: 'none',
                      backgroundColor: terminalTab === tab ? 'white' : 'transparent',
                      color: terminalTab === tab ? '#0f172a' : '#64748b',
                      fontWeight: 700, cursor: 'pointer', boxShadow: terminalTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', width: '300px' }}>
                <Search size={18} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search apps..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ border: 'none', padding: '10px', width: '100%', outline: 'none', fontWeight: 600, color: '#334155' }}
                />
              </div>
            </div>

            {/* APPS GRID grouped by category */}
            {Object.keys(appGroups).length > 0 ? (
              Object.keys(appGroups).map(category => (
                <div key={category} style={{ marginBottom: '40px' }}>
                  <h3 style={{ color: '#475569', fontSize: '1.1rem', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LayoutGrid size={20} /> {category}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {appGroups[category].map(app => (
                      <div
                        key={app.id}
                        onClick={() => handleStartApp(app)}
                        style={{
                          backgroundColor: 'white',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                          border: '1px solid #e2e8f0',
                          transition: 'transform 0.2s, boxShadow 0.2s',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                        }}
                      >
                        {/* App Header (Gradient / Thumbnail) */}
                        <div style={{
                          height: '140px',
                          background: app.config?.thumbnail ? `url(${app.config.thumbnail}) center/cover` : getAppGradient(app.name),
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '16px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
                                v{app.version || '1.0'}
                              </div>
                              {!app.is_published && (
                                <div style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                                  DRAFT
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const isFav = favoriteApps.includes(app.id);
                                let newFavs;
                                if (isFav) {
                                  newFavs = favoriteApps.filter(id => id !== app.id);
                                } else {
                                  newFavs = [...favoriteApps, app.id];
                                }
                                setFavoriteApps(newFavs);
                                localStorage.setItem('mavi_terminal_favorites', JSON.stringify(newFavs));
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                            >
                              <Star size={20} fill={favoriteApps.includes(app.id) ? '#fbbf24' : 'none'} color={favoriteApps.includes(app.id) ? '#fbbf24' : 'rgba(255,255,255,0.6)'} />
                            </button>
                          </div>
                        </div>

                        {/* App Body */}
                        <div style={{ padding: '20px' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{app.name}</h4>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {app.description || 'Custom Workstation App'}
                          </p>
                        </div>

                        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
                          <div style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Launch App <ChevronRight size={16} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 20px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <div style={{ color: '#94a3b8', marginBottom: '16px' }}><Package size={48} /></div>
                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.2rem', fontWeight: 700 }}>No Apps Assigned</h3>
                <p style={{ margin: 0, color: '#64748b' }}>
                  There are no applications assigned to <b>Station {appContext.station}</b> for user <b>{appContext.user}</b>.
                </p>
                <div style={{ marginTop: '20px', fontSize: '0.75rem', color: '#94a3b8' }}>
                  User Role: {freshUser?.role || 'Unknown'} | Access: {freshUser?.assignedApp || 'Not Set'}
                </div>
              </div>
            )}

            {/* SOPs & MANUALS */}
            {manuals.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ color: '#475569', fontSize: '1.1rem', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={20} /> SOPs & Manuals
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {manuals.map(m => (
                    <div
                      key={m.id}
                      onClick={() => handleStartCycle(m.id)}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #e2e8f0',
                        transition: 'transform 0.2s, boxShadow 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <div style={{ padding: '20px' }}>
                        <div style={{ color: '#2e7d32', marginBottom: '16px' }}><Activity size={28} /></div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{m.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                          {m.documentNumber ? `ID: ${m.documentNumber}` : 'No Document ID'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                          <Clock size={14} /> <span>Est. {m.timeRequired || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PENDING JOB QUEUE */}
            {productionQueue.length > 0 && (
              <div style={{ marginTop: '20px', padding: '30px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                  <div style={{ padding: '6px 10px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Assigned</div>
                  <h3 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Pending Job Queue</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {productionQueue.map(job => {
                    const app = frontlineApps.find(a => a.id === job.app_id);
                    return (
                      <div
                        key={job.id}
                        onClick={async () => {
                          if (app) {
                            setCurrentWorkOrder(job.work_order);
                            handleStartApp(app);
                          }
                        }}
                        style={{
                          padding: '20px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          borderLeft: job.priority === 'P1' ? '4px solid #ef4444' : '4px solid #3b82f6'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{job.work_order}</div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{app?.name || 'Unknown App'}</div>
                          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>Target: <b style={{ color: '#475569' }}>{job.target_qty} units</b></div>
                        </div>
                        {job.priority === 'P1' && (
                          <div style={{ color: '#ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={20} />
                            <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>URGENT</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  const requiredStepChecks = !selectedApp
    ? []
    : appComponents
      .filter(c => c?.props?.required)
      .map(c => ({ compId: c.id, ...getRequiredCheckForComponent(c) }));
  const requiredDone = requiredStepChecks.filter(c => c.ok).length;
  const currentStepRequiredOk = requiredStepChecks.length === 0 || requiredDone === requiredStepChecks.length;
  const stepValidationSummaries = (steps || []).map((step) => (
    selectedApp ? getStepRequiredSummary(step) : { total: 0, done: 0, ok: true }
  ));

  if (isMobile) {
    return (
      <div style={{ height: '100dvh', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
        {/* Mobile App Header */}
        <div style={{
          padding: '12px 16px', backgroundColor: activeAndon ? '#dc2626' : '#001e3c', color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => { setSelectedApp(null); setSelectedManual(null); }} style={{ background: 'none', border: 'none', color: 'white', padding: '4px' }}><ArrowLeft size={20} /></button>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
              {selectedApp ? selectedApp.name : selectedManual.title}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div onClick={() => setShowChat(true)} style={{ position: 'relative' }}><MessageSquare size={18} /></div>
            <div onClick={() => setShowAndonModal(true)}><AlertCircle size={18} color={activeAndon ? 'white' : '#fca5a5'} /></div>
          </div>
        </div>

        {/* Mobile Step Indicator - Compact */}
        <div style={{
          padding: '10px 16px', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : 'white',
          borderBottom: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`,
          display: 'flex', overflowX: 'auto', gap: '8px', scrollbarWidth: 'none'
        }}>
          {steps.map((step, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentStepIndex(idx)}
              style={{
                padding: '6px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                backgroundColor: idx === currentStepIndex ? '#3b82f6' : (selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f1f5f9'),
                color: idx === currentStepIndex ? 'white' : '#64748b',
                whiteSpace: 'nowrap', border: `1px solid ${idx === currentStepIndex ? '#3b82f6' : 'transparent'}`
              }}
            >
              Step {idx + 1}
            </div>
          ))}
        </div>

        {/* Mobile Component Container */}
        <div 
          ref={setCanvasWrapper}
          style={{
            flex: 1, overflowY: 'auto', padding: (isResponsiveMode || effectiveScalingMode === 'FIT_WIDTH') ? '0px' : '16px',
            display: 'flex', flexDirection: 'column', 
            alignItems: (effectiveScalingMode === 'FIT_WIDTH') ? 'stretch' : 'center',
            justifyContent: (effectiveScalingMode === 'FIT_WIDTH') ? 'flex-start' : 'center',
            backgroundColor: activeStep?.backgroundColor || selectedApp?.config?.appBackgroundColor || (selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f8fafc')
          }}
        >
          <div style={{
            width: (effectiveScalingMode === 'FIT_WIDTH') ? '100%' : `${layoutWidth * scaleX}px`,
            height: `${layoutHeight * scaleY}px`,
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            flex: 'none',
            backgroundColor: activeStep?.backgroundColor || selectedApp?.config?.appBackgroundColor || '#ffffff',
            borderRadius: (isPreset && effectiveScalingMode === 'FIT_SCREEN') ? canvasFrameRadius : '0px',
            boxShadow: (isPreset && effectiveScalingMode === 'FIT_SCREEN') ? canvasFrameShadow : 'none',
            border: (isPreset && effectiveScalingMode === 'FIT_SCREEN') ? canvasFrameBorder : 'none'
          }}>
            <div style={{
              width: `${layoutWidth}px`,
              height: `${layoutHeight}px`,
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `scale(${scaleX}, ${scaleY})`,
              transformOrigin: 'top left',
              backgroundColor: activeStep?.backgroundColor || selectedApp?.config?.appBackgroundColor || '#ffffff'
            }}>
              {[...appComponents]
                .filter(c => (!c.step_id || c.step_id === activeStep?.id) && visibilityMap[c.id] !== false)
                .sort((a, b) => (a.props?.zIndex || 0) - (b.props?.zIndex || 0))
                .map((comp, idx) => {
                  const isAbsolute = comp.x != null && comp.y != null;
                  const containerStyle = isAbsolute ? {
                    position: 'absolute',
                    left: `${comp.x}px`,
                    top: `${comp.y}px`,
                    width: comp.w ? `${comp.w}px` : 'auto',
                    height: comp.h ? `${comp.h}px` : 'auto',
                    zIndex: comp.props?.zIndex || 100,
                    transform: `rotate(${comp.props?.rotation || 0}deg)`,
                    overflow: 'visible'
                  } : {
                    width: '100%',
                    transform: `rotate(${comp.props?.rotation || 0}deg)`,
                    marginBottom: '20px',
                    position: 'relative'
                  };
                  const err = validationErrors[comp.id];
                  return (
                    <div key={comp.id || idx} style={containerStyle}>
                      <div style={{
                        border: err ? '2px solid #ef4444' : 'none',
                        borderRadius: '8px',
                        padding: err ? '10px' : 0,
                        backgroundColor: err ? '#fee2e2' : 'transparent',
                        height: isAbsolute ? '100%' : 'auto',
                        position: 'relative',
                        boxSizing: 'border-box'
                      }}>
                        {renderComponent(comp)}
                      </div>
                      {err && (
                        <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                          {err}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* Padding for bottom buttons */}
          <div style={{ height: (selectedApp || selectedManual) ? '0px' : '80px', flexShrink: 0 }} />
        </div>

        {/* Mobile Footer Controls */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px',
          backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : 'white',
          borderTop: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`,
          display: 'flex', gap: '12px', zIndex: 100
        }}>
          <button
            disabled={currentStepIndex === 0}
            onClick={handlePrevStep}
            style={{
              flex: 1, padding: '14px', borderRadius: '10px',
              backgroundColor: '#f1f5f9', color: '#475569',
              border: 'none', fontWeight: 700, fontSize: '0.9rem',
              opacity: currentStepIndex === 0 ? 0.5 : 1
            }}
          >
            Previous
          </button>

          {currentStepIndex === steps.length - 1 ? (
            <button
              onClick={() => setShowSignaturePad(true)}
              style={{
                flex: 2, padding: '14px', borderRadius: '10px',
                backgroundColor: '#10b981', color: 'white',
                border: 'none', fontWeight: 800, fontSize: '0.95rem',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
              }}
            >
              Sign Off Order
            </button>
          ) : (
            <button
              disabled={!currentStepRequiredOk}
              onClick={() => setCurrentStepIndex(prev => Math.min(steps.length - 1, prev + 1))}
              style={{
                flex: 2, padding: '14px', borderRadius: '10px',
                backgroundColor: currentStepRequiredOk ? '#3b82f6' : '#94a3b8',
                color: 'white', border: 'none', fontWeight: 800, fontSize: '0.95rem',
                boxShadow: currentStepRequiredOk ? '0 4px 10px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              Next Step
            </button>
          )}
        </div>

        {/* DEFECT/ANDON Modals will render here via standard portals/overlays */}
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* MAVI HEADER */}
      {window.self === window.top && (
        <div className="mavi-header" style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* Consolidated Header Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            height: '48px',
            backgroundColor: activeAndon ? '#dc2626' : '#090d16',
            color: 'white',
            borderBottom: '1px solid #1e293b',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'background-color 0.3s ease',
            position: 'relative'
          }}>
            {/* Left side: Logo, App Title, Badge, Duration, Step, User/Station */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flexWrap: 'nowrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontWeight: 900, marginRight: '4px' }}>
                <Zap size={14} fill="white" /> MAVI-M
              </div>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedApp ? selectedApp.name : (selectedManual ? selectedManual.title : 'Live Terminal')}
              </span>
              {selectedApp && (
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                  {!selectedApp.is_published ? (
                    <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '1px 6px', borderRadius: '4px', fontWeight: 800, fontSize: '0.65rem' }}>DRAFT</span>
                  ) : (
                    <span style={{ backgroundColor: '#22c55e', color: 'white', padding: '1px 6px', borderRadius: '4px', fontWeight: 800, fontSize: '0.65rem' }}>V{selectedApp.version}</span>
                  )}
                </span>
              )}
              
              {(selectedApp || selectedManual) && (
                <>
                  <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }} title="Session Duration">
                    <Clock size={12} color="#3b82f6" />
                    <strong style={{ color: 'white', fontFamily: 'monospace' }}>{formatTime(timer)}</strong>
                  </span>
                </>
              )}

              {stepLabel && (
                <>
                  <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    color: selectedApp?.config?.appThemeMode === 'DARK' ? '#93c5fd' : '#001e3c',
                    backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? 'rgba(59,130,246,0.15)' : 'white',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: '4px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px'
                  }}>
                    <ChevronRight size={11} /> {stepLabel}
                  </span>
                </>
              )}

              <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', color: '#94a3b8' }} title="Active Operator">
                <User size={12} color="#93c5fd" />
                <span style={{ fontSize: '0.72rem' }}><strong style={{ color: 'white' }}>{appContext.user || '-'}</strong></span>
              </div>

              <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', color: '#94a3b8', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }} title="Work Station">
                <MapPin size={12} color="#34d399" />
                <span style={{ fontSize: '0.72rem' }}><strong style={{ color: 'white' }}>{appContext.station || '-'}</strong></span>
              </div>
            </div>

            {/* Right side: Status, Language, scale, menu, logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {/* Network Connectivity Badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '3px 8px', borderRadius: '20px',
                backgroundColor: isOnline ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: isOnline ? '#4ade80' : '#fca5a5',
                fontSize: '0.62rem', fontWeight: 800,
                border: `1px solid ${isOnline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }} title={isOnline ? "Connected to Server" : "Offline Mode"}>
                <span className={`pulse-dot ${isOnline ? 'pulse-dot-success' : 'pulse-dot-danger'}`} style={{ width: '5px', height: '5px' }} />
                <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>

              {/* Language Selection */}
              <div
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', 
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', 
                  padding: '5px 8px', borderRadius: '6px', transition: 'all 0.2s' 
                }}
                onClick={() => setShowOperatorMenu(true)}
                title="Change Language / Operator Settings"
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <Globe size={11} color="#cbd5e1" />
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#cbd5e1' }}>{currentLanguage}</span>
              </div>

              {(selectedApp || selectedManual) && (
                <button
                  onClick={() => setRuntimeScaleMode(prev => prev === 'FIT_SCREEN' ? 'FIT_WIDTH' : 'FIT_SCREEN')}
                  title={runtimeScaleMode === 'FIT_SCREEN' ? 'Switch to Fit Width' : 'Switch to Fit Screen'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: runtimeScaleMode === 'FIT_SCREEN' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                    color: runtimeScaleMode === 'FIT_SCREEN' ? '#4ade80' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = runtimeScaleMode === 'FIT_SCREEN' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <Maximize2 size={12} />
                </button>
              )}

              {(selectedApp || selectedManual) && presetKey === 'RESPONSIVE' && (
                <button
                  onClick={() => {
                    const next = layoutMode === 'PROPORTIONAL' ? 'RESPONSIVE' : 'PROPORTIONAL';
                    setLayoutMode(next);
                    try {
                      localStorage.setItem('mavi_runtime_layout_mode', next);
                    } catch (e) {}
                  }}
                  title={layoutMode === 'PROPORTIONAL' ? 'Switch to Responsive Stack Layout' : 'Switch to Proportional Canvas Layout'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: layoutMode === 'PROPORTIONAL' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                    color: layoutMode === 'PROPORTIONAL' ? '#60a5fa' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = layoutMode === 'PROPORTIONAL' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <LayoutGrid size={12} />
                </button>
              )}

              {/* Logout button */}
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to log out?")) {
                    logout();
                    window.location.reload();
                  }
                }}
                title="Logout"
                style={{
                  width: '28px',
                  height: '28px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'; }}
              >
                <LogOut size={12} />
              </button>

              <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                title="Options Menu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: menuOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Menu size={13} />
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  width: '260px',
                  background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
                  padding: '8px 0',
                  border: '1px solid rgba(255,255,255,0.08)',
                  zIndex: 1000,
                  marginTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  backdropFilter: 'blur(20px)'
                }}>
                  {/* ── Menu Header Label */}
                  <div style={{ padding: '6px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                      Actions
                    </div>
                  </div>

                  {/* Back to Selection */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setSelectedApp(null);
                      setSelectedManual(null);
                      window.history.pushState(null, '', '/#/terminal');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '9px 16px', width: '100%', border: 'none',
                      background: 'none', textAlign: 'left', fontSize: '0.82rem',
                      fontWeight: 600, color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
                      transition: 'all 0.15s', borderRadius: '0'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(100,116,139,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ArrowLeft size={13} color="#94a3b8" />
                    </div>
                    <span style={{ flex: 1 }}>Back to Selection</span>
                  </button>

                  {/* Toggle Chat */}
                  <button
                    onClick={() => { setMenuOpen(false); setShowChat(!showChat); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '9px 16px', width: '100%', border: 'none',
                      background: 'none', textAlign: 'left', fontSize: '0.82rem',
                      fontWeight: 600, color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(2,132,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MessageSquare size={13} color="#38bdf8" />
                    </div>
                    <span style={{ flex: 1 }}>Toggle Chat</span>
                  </button>

                  {/* Report Defect */}
                  <button
                    onClick={() => { setMenuOpen(false); setShowDefectModal(true); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '9px 16px', width: '100%', border: 'none',
                      background: 'none', textAlign: 'left', fontSize: '0.82rem',
                      fontWeight: 600, color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#fca5a5'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <XCircle size={13} color="#f87171" />
                    </div>
                    <span style={{ flex: 1 }}>Report Defect</span>
                  </button>

                  {/* Andon Status */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (activeAndon) { handleResolveAndon(); } else { setShowAndonModal(true); }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '9px 16px', width: '100%', border: 'none',
                      background: activeAndon ? 'rgba(239,68,68,0.1)' : 'none',
                      textAlign: 'left', fontSize: '0.82rem', fontWeight: 600,
                      color: activeAndon ? '#fca5a5' : 'rgba(255,255,255,0.75)', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(234,179,8,0.12)'; e.currentTarget.style.color = '#fde047'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = activeAndon ? 'rgba(239,68,68,0.1)' : 'transparent'; e.currentTarget.style.color = activeAndon ? '#fca5a5' : 'rgba(255,255,255,0.75)'; }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: activeAndon ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AlertCircle size={13} color={activeAndon ? '#f87171' : '#fbbf24'} />
                    </div>
                    <span style={{ flex: 1 }}>{activeAndon ? 'Resolve Andon' : 'Pull Andon'}</span>
                    {activeAndon && <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'maviPulse 1.5s ease-in-out infinite' }} />}
                  </button>

                  <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.07)', margin: '6px 0' }} />

                  {/* Station Diagnostics */}
                  <button
                    onClick={() => { setMenuOpen(false); setShowDiagnostics(true); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '9px 16px', width: '100%', border: 'none',
                      background: 'none', textAlign: 'left', fontSize: '0.82rem',
                      fontWeight: 600, color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HardDrive size={13} color="#a5b4fc" />
                    </div>
                    <span style={{ flex: 1 }}>Station Diagnostics</span>
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0, overflow: 'hidden' }}>



        {/* CENTER PANEL: INSTRUCTIONS */}
        <div 
          key={`center-panel-${refreshKey}`}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: (selectedApp || selectedManual) ? '0' : '20px',
            backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f8fafc',
            overflowY: 'auto',
            overflowX: 'auto'
          }}
        >
          <div style={{
            backgroundColor: activeStep?.backgroundColor || selectedApp?.config?.appBackgroundColor || (selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : 'white'),
            backgroundImage: activeStep?.backgroundImage ? `url(${activeStep.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: (selectedApp || selectedManual) ? 'none' : `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`,
            borderRadius: (selectedApp || selectedManual) ? '0' : '4px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'auto'
          }}>
            {selectedApp && !selectedApp.is_published && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-30deg)',
                fontSize: '6rem',
                fontWeight: 900,
                color: 'rgba(239, 68, 68, 0.04)',
                pointerEvents: 'none',
                zIndex: 0,
                whiteSpace: 'nowrap',
                userSelect: 'none'
              }}>
                DRAFT MODE
              </div>
            )}


            <div 
              id="terminal-canvas-wrapper" 
              ref={setCanvasWrapper}
              style={{
                flex: 1,
                padding: (isResponsiveMode || effectiveScalingMode === 'FIT_WIDTH') ? '0px' : '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: (effectiveScalingMode === 'FIT_WIDTH') ? 'stretch' : 'center',
                justifyContent: (effectiveScalingMode === 'FIT_WIDTH') ? 'flex-start' : 'center',
                position: 'relative',
                overflowX: 'hidden',
                overflowY: 'hidden',
                backgroundColor: isResponsiveMode
                  ? (activeStep?.backgroundColor || selectedApp?.config?.appBackgroundColor || (selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#ffffff'))
                  : (selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f1f5f9')
              }}
            >
              {isResponsiveMode ? (
                /* RESPONSIVE FLEXBOX 2-COLUMN SPLIT LAYOUT (Tulip-Style) */
                <div style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  gap: '24px',
                  padding: '24px',
                  boxSizing: 'border-box',
                  overflowY: 'auto',
                  backgroundColor: activeStep?.backgroundColor || selectedApp?.config?.appBackgroundColor || '#ffffff'
                }}>
                  {/* Left Column (Main instructions, tables, content) */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '320px',
                    height: '100%',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}>
                    {appComponents.length > 0 ? (
                      appComponents
                        .filter(c => visibilityMap[c.id] !== false)
                        .sort((a, b) => (a.props?.zIndex || 0) - (b.props?.zIndex || 0))
                        .filter(c => c.x == null || c.x < layoutWidth / 2)
                        .map((comp, idx) => renderComponentInColumn(comp, idx))
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', marginTop: '40px' }}>
                        <img src="/assets/assembly_procedure.png" style={{ maxWidth: '100%', borderRadius: '4px' }} alt="Visual" />
                        <p style={{ textAlign: 'center', color: '#475569', fontSize: '1.1rem', lineHeight: '1.6' }}>
                          {activeStep?.description || "Follow the standard procedure defined for this assembly step."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column (Cams, trigger buttons, form inputs) */}
                  {appComponents.filter(c => visibilityMap[c.id] !== false && c.x != null && c.x >= layoutWidth / 2).length > 0 && (
                    <div style={{
                      width: '450px',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      overflowY: 'auto',
                      borderLeft: selectedApp?.config?.appThemeMode === 'DARK' ? '1px solid #334155' : '1px solid #e2e8f0',
                      paddingLeft: '24px',
                      flexShrink: 0
                    }}>
                      {appComponents
                        .filter(c => visibilityMap[c.id] !== false)
                        .sort((a, b) => (a.props?.zIndex || 0) - (b.props?.zIndex || 0))
                        .filter(c => c.x != null && c.x >= layoutWidth / 2)
                        .map((comp, idx) => renderComponentInColumn(comp, idx))}
                    </div>
                  )}
                </div>
              ) : (
                /* FIXED CANVAS SCALED LAYOUT */
                <div style={{
                  width: (effectiveScalingMode === 'FIT_WIDTH') ? '100%' : `${layoutWidth * scaleX}px`,
                  height: `${layoutHeight * scaleY}px`,
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                  flex: 'none',
                  backgroundColor: activeStep?.backgroundColor || selectedApp?.config?.appBackgroundColor || '#ffffff',
                  borderRadius: (isPreset && effectiveScalingMode === 'FIT_SCREEN') ? canvasFrameRadius : '0px',
                  boxShadow: (isPreset && effectiveScalingMode === 'FIT_SCREEN') ? canvasFrameShadow : 'none',
                  border: (isPreset && effectiveScalingMode === 'FIT_SCREEN') ? canvasFrameBorder : 'none'
                }}>
                  <div id="terminal-canvas-content" style={{
                    width: `${layoutWidth}px`,
                    height: `${layoutHeight}px`,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: `scale(${scaleX}, ${scaleY})`,
                    transformOrigin: 'top left',
                    backgroundColor: activeStep?.backgroundColor || selectedApp?.config?.appBackgroundColor || '#ffffff'
                  }}>
                    {appComponents.length > 0 ? (
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%'
                      }}>
                        {[...appComponents]
                          .filter(c => visibilityMap[c.id] !== false)
                          .sort((a, b) => (a.props?.zIndex || 0) - (b.props?.zIndex || 0))
                          .map((comp, idx) => {
                            const isAbsolute = comp.x != null && comp.y != null;

                            const containerStyle = isAbsolute ? {
                              position: 'absolute',
                              left: `${comp.x}px`,
                              top: `${comp.y}px`,
                              width: comp.w ? `${comp.w}px` : 'auto',
                              height: comp.h ? `${comp.h}px` : 'auto',
                              zIndex: comp.props?.zIndex || 100,
                              transform: `rotate(${comp.props?.rotation || 0}deg)`,
                              overflow: 'visible'
                            } : {
                              width: '100%',
                              transform: `rotate(${comp.props?.rotation || 0}deg)`,
                              marginBottom: '20px',
                              position: 'relative'
                            };

                            const err = validationErrors[comp.id];
                            return (
                              <div
                                key={comp.id || idx}
                                id={comp.id ? `terminal-comp-${comp.id}` : undefined}
                                ref={(el) => { if (comp?.id) widgetContainerRefs.current[comp.id] = el; }}
                                className={comp.props?.isBlinking ? 'animate-blink' : ''}
                                style={containerStyle}
                              >
                                <div style={{
                                  border: err ? '2px solid #ef4444' : 'none',
                                  borderRadius: '8px',
                                  padding: err ? '10px' : 0,
                                  backgroundColor: err ? '#fee2e2' : 'transparent',
                                  height: isAbsolute ? '100%' : 'auto',
                                  position: 'relative',
                                  boxSizing: 'border-box'
                                }}>
                                  {renderComponent(comp)}
                                </div>
                                {err && (
                                  <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                                    {err}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', marginTop: '40px' }}>
                        <img src="/assets/assembly_procedure.png" style={{ maxWidth: '100%', borderRadius: '4px' }} alt="Visual" />
                        <p style={{ textAlign: 'center', color: '#475569', fontSize: '1.1rem', lineHeight: '1.6' }}>
                          {activeStep?.description || "Follow the standard procedure defined for this assembly step."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Removed separate Work Sequence footer row */}
          </div>
        </div>

        {/* RIGHT SIDEBAR: Work Sequence Steps & System Health Monitor */}
        {selectedApp?.config?.stepListEnabled !== false && showWorkSequence && (
          <div style={{
            width: '62px',
            minWidth: '62px',
            backgroundColor: '#0a0f1e',
            borderLeft: '1px solid rgba(59, 130, 246, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 0',
            gap: '0px',
            animation: 'fadeIn 0.2s ease-in-out',
            flexShrink: 0,
            zIndex: 10,
            height: '100%'
          }}>
            {/* Upper Section: Steps Scroll Area */}
            <div style={{
              flex: 1,
              width: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingBottom: '10px'
            }}>
              {steps.map((step, idx) => {
                const summary = selectedApp ? getStepRequiredSummary(step) : { total: 0, done: 0, ok: true };
                const isLocked = !canNavigateToStep(idx);
                const isActive = idx === currentStepIndex;
                const isCompleted = idx < currentStepIndex;
                const hasProgress = selectedApp && summary.total > 0;

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {/* Connector line above */}
                    {idx > 0 && (
                      <div style={{
                        width: '2px',
                        height: '10px',
                        backgroundColor: isCompleted ? '#22c55e' : (isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)'),
                        transition: 'background-color 0.3s ease',
                        flexShrink: 0
                      }} />
                    )}

                    {/* Step Icon Button */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLocked) {
                          setCurrentStepIndex(idx);
                        } else {
                          toast.error(`Complete "${steps[currentStepIndex]?.title || 'current step'}" first`, {
                            icon: '🔒',
                            style: { borderRadius: '10px', background: '#334155', color: '#fff' }
                          });
                        }
                      }}
                      title={`${idx + 1}. ${step.title}${hasProgress ? ` (${summary.done}/${summary.total})` : ''}`}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: isActive ? '12px' : '50%',
                        backgroundColor: isActive ? '#1e3a5f' : (isCompleted ? 'rgba(34,197,94,0.15)' : (isLocked ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)')),
                        border: isActive ? '2px solid #3b82f6' : (isCompleted ? '2px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.08)'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        opacity: isLocked ? 0.45 : 1,
                        boxShadow: isActive
                          ? '0 0 16px rgba(59,130,246,0.4), 0 0 4px rgba(59,130,246,0.2)'
                          : (isCompleted ? '0 0 8px rgba(34,197,94,0.2)' : 'none'),
                        flexShrink: 0
                      }}
                      onMouseEnter={e => {
                        if (!isLocked && !isActive) {
                          e.currentTarget.style.transform = 'scale(1.15)';
                          e.currentTarget.style.boxShadow = '0 0 12px rgba(59,130,246,0.3)';
                          e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = isActive
                          ? '0 0 16px rgba(59,130,246,0.4), 0 0 4px rgba(59,130,246,0.2)'
                          : (isCompleted ? '0 0 8px rgba(34,197,94,0.2)' : 'none');
                        e.currentTarget.style.borderColor = isActive ? '#3b82f6' : (isCompleted ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)');
                      }}
                    >
                      {/* Inner content: checkmark for completed, lock for locked, number for others */}
                      {isCompleted ? (
                        <CheckCircle2 size={16} color="#4ade80" strokeWidth={2.5} />
                      ) : isLocked ? (
                        <Lock size={13} color="rgba(255,255,255,0.35)" />
                      ) : (
                        <span style={{
                          fontSize: isActive ? '0.82rem' : '0.72rem',
                          fontWeight: 900,
                          color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.7)',
                          letterSpacing: '-0.02em',
                          lineHeight: 1
                        }}>
                          {idx + 1}
                        </span>
                      )}

                      {/* Status dot — top-right corner */}
                      {hasProgress && (
                        <div style={{
                          position: 'absolute',
                          top: '-2px',
                          right: '-2px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: summary.ok ? '#22c55e' : '#ef4444',
                          border: '2px solid #0a0f1e',
                          boxShadow: summary.ok ? '0 0 6px rgba(34,197,94,0.5)' : '0 0 6px rgba(239,68,68,0.5)'
                        }} />
                      )}

                      {/* Active pulse ring */}
                      {isActive && (
                        <div style={{
                          position: 'absolute',
                          inset: '-4px',
                          borderRadius: '14px',
                          border: '1px solid rgba(59,130,246,0.2)',
                          animation: 'maviPulse 2s ease-in-out infinite',
                          pointerEvents: 'none'
                        }} />
                      )}
                    </div>

                    {/* Connector line below */}
                    {idx < steps.length - 1 && (
                      <div style={{
                        width: '2px',
                        height: '10px',
                        backgroundColor: isCompleted ? '#22c55e' : 'rgba(255,255,255,0.1)',
                        transition: 'background-color 0.3s ease',
                        flexShrink: 0
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Separator */}
            <div style={{
              width: '30px',
              height: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              margin: '8px 0',
              flexShrink: 0
            }} />

            {/* Lower Section: System Health & PLC Monitor */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
              paddingBottom: '4px'
            }}>
              {/* Server Status Icon */}
              <div 
                style={{
                  position: 'relative',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isOnline ? '#22c55e' : '#ef4444',
                  cursor: 'default',
                  transition: 'all 0.2s'
                }}
                title={isOnline ? "Server Connection: Active" : "Server Connection: Offline"}
              >
                <Database size={13} />
                <span style={{
                  position: 'absolute',
                  bottom: '1px',
                  right: '1px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isOnline ? '#22c55e' : '#ef4444'
                }} />
              </div>

              {/* PLC/Broker Status Icon */}
              <div 
                style={{
                  position: 'relative',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3b82f6',
                  cursor: 'default'
                }}
                title="MQTT Broker / PLC Link: Connected"
              >
                <Cpu size={13} />
                <span style={{
                  position: 'absolute',
                  bottom: '1px',
                  right: '1px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e'
                }} />
              </div>

              {/* Camera Connection Status Icon */}
              <div 
                style={{
                  position: 'relative',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#eab308',
                  cursor: 'default'
                }}
                title="Shopfloor Camera: Standby"
              >
                <Camera size={13} />
                <span style={{
                  position: 'absolute',
                  bottom: '1px',
                  right: '1px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e'
                }} />
              </div>

              {/* Station Diagnostics Shortcut */}
              <button 
                onClick={() => setShowDiagnostics(true)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  padding: 0
                }}
                title="Launch Diagnostics Panel"
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.2)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <SlidersHorizontal size={13} className="mavi-pulse-diag" style={{ animation: 'maviPulse 2s infinite' }} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* DEFECT MODAL */}
      {showDefectModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)',
          zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            maxWidth: '450px', width: '100%', padding: '30px', backgroundColor: 'white',
            borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <XCircle color="#ef4444" /> Report Production Defect
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>DEFECT TYPE</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['Scratched', 'Misaligned', 'Missing Part', 'Damaged', 'Loose', 'Other'].map(type => (
                  <button
                    key={type}
                    onClick={() => setDefectType(type)}
                    style={{
                      padding: '10px', borderRadius: '6px', border: `2px solid ${defectType === type ? '#ef4444' : '#f1f5f9'}`,
                      backgroundColor: defectType === type ? '#fef2f2' : 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                      color: defectType === type ? '#ef4444' : '#475569', textAlign: 'center'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>QUANTITY</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={() => setDefectCount(c => Math.max(1, c - 1))} style={{ width: '40px', height: '40px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}><Minus size={18} /></button>
                <div style={{ flex: 1, fontSize: '1.5rem', fontWeight: 900, textAlign: 'center' }}>{defectCount}</div>
                <button onClick={() => setDefectCount(c => c + 1)} style={{ width: '40px', height: '40px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}><Plus size={18} /></button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDefectModal(false)} className="btn" style={{ flex: 1 }}>Cancel</button>
              <button
                onClick={handleLogDefect}
                className="btn btn-danger"
                style={{ flex: 2, fontWeight: 700 }}
                disabled={!defectType}
              >
                Submit Defect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANDON MODAL */}
      {showAndonModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(5px)',
          zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            maxWidth: '500px', width: '100%', padding: '30px', backgroundColor: 'white',
            borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
              <AlertCircle size={28} /> Trigger Andon
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
              Select the issue category to notify supervisors and halt production tracking.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '10px' }}>ISSUE CATEGORY</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {['Machine Fault', 'Material Shortage', 'Quality Issue', 'Process Help', 'Safety Concern', 'Other'].map(type => (
                  <button
                    key={type}
                    onClick={() => setAndonCategory(type)}
                    style={{
                      padding: '12px', borderRadius: '6px', border: `2px solid ${andonCategory === type ? '#ef4444' : '#e2e8f0'}`,
                      backgroundColor: andonCategory === type ? '#fef2f2' : 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700,
                      color: andonCategory === type ? '#ef4444' : '#475569', textAlign: 'center', transition: 'all 0.2s'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>ADDITIONAL DETAILS (OPTIONAL)</label>
              <textarea
                value={andonDetail}
                onChange={(e) => setAndonDetail(e.target.value)}
                placeholder="Describe the issue briefly..."
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #e2e8f0', fontSize: '0.9rem', minHeight: '80px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowAndonModal(false); setAndonCategory(''); setAndonDetail(''); }} className="btn" style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', border: 'none' }}>Cancel</button>
              <button
                onClick={handleTriggerAndon}
                className="btn btn-danger"
                style={{ flex: 2, fontWeight: 800, fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                disabled={!andonCategory}
              >
                <AlertCircle size={20} /> PULL ANDON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCADA SAFETY CONTROL DIALOG */}
      {activeControlDevice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(5px)',
          zIndex: 3500, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            maxWidth: '480px', width: '100%', padding: '24px', 
            backgroundColor: '#1e293b', border: '2px solid #475569',
            borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            color: '#f8fafc'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={24} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Safety Interlock Control
                </h3>
              </div>
              <button 
                onClick={() => { setActiveControlDevice(null); setControlConfirmChecked(false); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Device Details */}
            <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '16px', fontSize: '0.8rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px' }}>
                <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>Device ID:</span>
                <span>{activeControlDevice.id}</span>
                <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>Type:</span>
                <span>{activeControlDevice.type === 'SCADA_PUMP' ? 'Centrifugal Pump' : 'Pipeline Valve'}</span>
                <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>Tag/Var:</span>
                <span style={{ fontFamily: 'monospace', color: '#60a5fa', fontWeight: 'bold' }}>
                  {activeControlDevice.props.targetVariable || 'N/A (Manual State)'}
                </span>
                <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>Current:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {activeControlDevice.props.targetVariable 
                    ? String(resolveValue(`@${activeControlDevice.props.targetVariable}`)) 
                    : (activeControlDevice.type === 'SCADA_PUMP' ? (activeControlDevice.props.pumpState || 'STOPPED') : (activeControlDevice.props.valveState || 'CLOSED'))
                  }
                </span>
              </div>
            </div>

            {/* Target Commands State Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Select Command Action
              </label>
              
              {activeControlDevice.type === 'SCADA_PUMP' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Manual START (Run)', val: 'RUNNING', color: '#22c55e' },
                    { label: 'Manual STOP', val: 'STOPPED', color: '#ef4444' },
                    { label: 'Simulate FAULT', val: 'FAULT', color: '#eab308' },
                    { label: 'AUTO (Follow PLC Tag)', val: 'AUTO', color: '#3b82f6' }
                  ].map(cmd => {
                    const isSelected = activeControlDevice.props.pumpState === cmd.val;
                    return (
                      <button
                        key={cmd.val}
                        onClick={() => {
                          const updated = { ...activeControlDevice, props: { ...activeControlDevice.props, pumpState: cmd.val } };
                          setActiveControlDevice(updated);
                        }}
                        style={{
                          padding: '12px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold',
                          backgroundColor: isSelected ? cmd.color : '#0f172a',
                          color: isSelected ? '#0f172a' : '#f8fafc',
                          border: `2px solid ${isSelected ? cmd.color : '#334155'}`,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cmd.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Manual OPEN', val: 'OPEN', color: '#22c55e' },
                    { label: 'Manual CLOSE', val: 'CLOSED', color: '#ef4444' },
                    { label: 'AUTO (Follow PLC Tag)', val: 'AUTO', color: '#3b82f6' }
                  ].map(cmd => {
                    const isSelected = activeControlDevice.props.valveState === cmd.val;
                    return (
                      <button
                        key={cmd.val}
                        onClick={() => {
                          const updated = { ...activeControlDevice, props: { ...activeControlDevice.props, valveState: cmd.val } };
                          setActiveControlDevice(updated);
                        }}
                        style={{
                          padding: '12px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold',
                          backgroundColor: isSelected ? cmd.color : '#0f172a',
                          color: isSelected ? '#0f172a' : '#f8fafc',
                          border: `2px solid ${isSelected ? cmd.color : '#334155'}`,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cmd.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Checkbox confirmation */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', 
              padding: '12px', backgroundColor: '#334155', borderRadius: '8px',
              border: `1.5px solid ${controlConfirmChecked ? '#f59e0b' : 'transparent'}`,
              marginBottom: '20px', cursor: 'pointer', userSelect: 'none'
            }} onClick={() => setControlConfirmChecked(!controlConfirmChecked)}>
              <input 
                type="checkbox"
                checked={controlConfirmChecked}
                onChange={() => {}} // handled by div click
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f8fafc' }}>
                Confirm execution of this remote PLC override command.
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => { setActiveControlDevice(null); setControlConfirmChecked(false); }}
                style={{ flex: 1, padding: '12px', borderRadius: '6px', backgroundColor: '#475569', color: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!controlConfirmChecked) return;
                  
                  // Sync locally
                  if (activeStep && activeStep.components) {
                    const compIndex = activeStep.components.findIndex(c => c.id === activeControlDevice.id);
                    if (compIndex !== -1) {
                      activeStep.components[compIndex].props = { ...activeControlDevice.props };
                    }
                  }

                  // Write value back to targetVariable / PLC register
                  const targetVar = activeControlDevice.props.targetVariable;
                  if (targetVar) {
                    let newVal = 0;
                    if (activeControlDevice.type === 'SCADA_PUMP') {
                      newVal = activeControlDevice.props.pumpState === 'RUNNING' ? 1 : (activeControlDevice.props.pumpState === 'FAULT' ? 'FAULT' : 0);
                    } else {
                      newVal = activeControlDevice.props.valveState === 'OPEN' ? 1 : 0;
                    }

                    // Check if variable is mapped to any real Modbus PLC
                    const parsedCtrls = window.mavi_plc_controllers;
                    const parsedTags = window.mavi_plc_tags;
                    if (parsedCtrls && parsedTags) {
                      try {
                        const cleanVar = targetVar.startsWith('@') ? targetVar.substring(1) : targetVar;
                        const matchingTag = parsedTags.find(t => t.name === cleanVar);
                        if (matchingTag && window.__TAURI_INTERNALS__) {
                          const ctrl = parsedCtrls.find(c => c.id === matchingTag.controllerId);
                          if (ctrl && ctrl.status === 'connected' && ctrl.type === 'MODBUS_TCP') {
                            const core = await import('@tauri-apps/api/core');
                            let addr = parseInt(matchingTag.address);
                            let offset = addr;
                            let regType = matchingTag.regType || 'HOLDING_REGISTER';
                            if (regType === 'COIL') offset = addr - 1;
                            else if (regType === 'HOLDING_REGISTER') offset = addr - 40001;
                            if (offset < 0) offset = 0;

                            await core.invoke('modbus_write', {
                              id: ctrl.id,
                              regType,
                              address: offset,
                              value: newVal === 'FAULT' ? 2 : newVal
                            });
                          }
                        }
                      } catch (err) {
                        console.error('Failed to trigger real Modbus write-back:', err);
                      }
                    }

                    // Sync state variable value in frontend
                    setAppVariables(prev => prev.map(av => av.name === targetVar ? { ...av, value: String(newVal) } : av));
                  }

                  toast.success(`SCADA Command Sent: ${activeControlDevice.type === 'SCADA_PUMP' ? activeControlDevice.props.pumpState : activeControlDevice.props.valveState}`);
                  setActiveControlDevice(null);
                  setControlConfirmChecked(false);
                }}
                disabled={!controlConfirmChecked}
                style={{
                  flex: 2, padding: '12px', borderRadius: '6px', 
                  backgroundColor: controlConfirmChecked ? '#f59e0b' : '#334155', 
                  color: controlConfirmChecked ? '#0f172a' : '#94a3b8', 
                  border: 'none', cursor: controlConfirmChecked ? 'pointer' : 'not-allowed', 
                  fontWeight: 900, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <ShieldCheck size={18} />
                SUBMIT OVERRIDE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FRONTLINE COPILOT TOGGLE — Hidden */}

      {/* Old horizontal Work Sequence strip removed — now rendered as RIGHT SIDEBAR inside MAIN CONTENT AREA */}

      {/* MAVI FOOTER BAR - Premium Tactile Navigation */}
      <div style={{
        height: '56px',
        background: 'linear-gradient(90deg, #0a0f1e 0%, #111827 50%, #0a0f1e 100%)',
        display: 'flex',
        justifyContent: 'center',
        padding: '0 20px',
        alignItems: 'center',
        color: 'white',
        borderTop: '1px solid rgba(59, 130, 246, 0.15)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
        flexShrink: 0,
        gap: '16px'
      }}>
        {/* Centered Icon Navigation */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>

          {/* PREVIOUS STEP — Icon Only */}
          <button
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            title="Previous Step"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: currentStepIndex === 0 ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: currentStepIndex === 0 ? '1px solid rgba(239,68,68,0.15)' : '2px solid rgba(255,255,255,0.15)',
              color: currentStepIndex === 0 ? 'rgba(255,255,255,0.25)' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: currentStepIndex === 0 ? 'none' : '0 4px 14px rgba(239,68,68,0.4)',
              padding: 0,
              flexShrink: 0
            }}
            onMouseEnter={e => { if (currentStepIndex > 0) { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.55)'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = currentStepIndex === 0 ? 'none' : '0 4px 14px rgba(239,68,68,0.4)'; }}
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>

          {/* Step Counter Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '20px',
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: '70px',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#93c5fd', letterSpacing: '-0.02em' }}>
              {currentStepIndex + 1}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
              /
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
              {steps.length}
            </span>
          </div>

          {/* NEXT STEP — Icon Only */}
          {currentStepIndex < steps.length - 1 && (
            <button
              onClick={() => {
                const nextIdx = currentStepIndex + 1;
                if (canNavigateToStep(nextIdx)) {
                  handleNextStep();
                } else {
                  toast.error(`Please complete all required fields on "${steps[currentStepIndex].title}" first`, {
                    icon: '🔒',
                    style: { borderRadius: '10px', background: '#334155', color: '#fff' }
                  });
                }
              }}
              title="Next Step"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: canNavigateToStep(currentStepIndex + 1)
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'rgba(255,255,255,0.06)',
                border: canNavigateToStep(currentStepIndex + 1)
                  ? '2px solid rgba(255,255,255,0.15)'
                  : '1px solid rgba(255,255,255,0.08)',
                color: canNavigateToStep(currentStepIndex + 1) ? 'white' : 'rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canNavigateToStep(currentStepIndex + 1) ? 'pointer' : 'not-allowed',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: canNavigateToStep(currentStepIndex + 1)
                  ? '0 4px 14px rgba(59,130,246,0.45)'
                  : 'none',
                padding: 0,
                flexShrink: 0
              }}
              onMouseEnter={e => { if (canNavigateToStep(currentStepIndex + 1)) { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.6)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = canNavigateToStep(currentStepIndex + 1) ? '0 4px 14px rgba(59,130,246,0.45)' : 'none'; }}
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>
          )}

          {/* COMPLETE ORDER — Icon Only, last step */}
          {currentStepIndex === steps.length - 1 && (
            <button
              onClick={() => setShowSignaturePad(true)}
              title="Complete Order"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '2px solid rgba(255,255,255,0.15)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 14px rgba(16,185,129,0.45)',
                padding: 0,
                flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.45)'; }}
            >
              <CheckCircle size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Signature Pad Overlay - Ported with new theme */}
      {showSignaturePad && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'
        }}>
          <div style={{
            maxWidth: '500px', width: '100%', padding: '40px', backgroundColor: 'white',
            borderRadius: '8px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '10px' }}>Governance Sign-off</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>
              Cycle completed in {formatTime(timer)}. Sign and enter Operator ID to finalize.
            </p>
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>HANDWRITTEN SIGNATURE *</div>
              <canvas
                width={520}
                height={160}
                ref={(el) => {
                  if (el) ensureSignatureCanvas('__final_signature__');
                  signatureCanvasRefs.current.__final_signature__ = el;
                }}
                onMouseDown={(e) => startSignatureDraw('__final_signature__', e)}
                onMouseMove={(e) => moveSignatureDraw('__final_signature__', e)}
                onMouseUp={() => endSignatureDraw('__final_signature__')}
                onMouseLeave={() => endSignatureDraw('__final_signature__')}
                onTouchStart={(e) => startSignatureDraw('__final_signature__', e)}
                onTouchMove={(e) => moveSignatureDraw('__final_signature__', e)}
                onTouchEnd={() => endSignatureDraw('__final_signature__')}
                style={{ width: '100%', backgroundColor: 'white', border: '1px dashed #cbd5e1', borderRadius: '6px', touchAction: 'none' }}
              />
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: signatureImage ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
                  {signatureImage ? 'Signature captured' : 'Draw your signature'}
                </span>
                <button
                  onClick={() => clearSignatureCanvas('__final_signature__')}
                  style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white', color: '#475569', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>
            </div>
            <input
              type="text" autoFocus value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Operator ID"
              style={{
                width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px',
                padding: '15px', fontSize: '1.1rem', outline: 'none', textAlign: 'center', marginBottom: '25px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowSignaturePad(false); startTimer(); }} className="btn" style={{ flex: 1 }}>Back</button>
              <button onClick={handleFinalizeWithSignature} className="btn btn-primary" style={{ flex: 2 }}>Sign & Finalize</button>
            </div>
          </div>
        </div>
      )}
      {activeMedia && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <button
            onClick={() => setActiveMedia(null)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
              width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
          <div style={{ maxWidth: '90%', maxHeight: '90%', position: 'relative' }}>
            {activeMedia.type === 'IMAGE' ? (
              <img src={activeMedia.url} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} alt="Trigger Action" />
            ) : (
              <video src={activeMedia.url} autoPlay controls style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />
            )}
          </div>
        </div>
      )}

      {showChat && (
        <ChatWidget
          currentStation={appContext.station}
          currentUser={appContext.user}
          currentUserId={appContext.userId}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Operator Menu Modal */}
      {showOperatorMenu && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'transparent' }} onClick={() => setShowOperatorMenu(false)}>
          <div
            style={{ position: 'absolute', top: '70px', right: '350px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', width: '280px', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>CURRENT OPERATOR</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{appContext.user}</div>
              <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, marginTop: '4px' }}>Station: {appContext.station}</div>
            </div>

            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, padding: '8px 12px', textTransform: 'uppercase' }}>Language</div>
              {['EN', 'ID', 'JA'].map(lang => (
                <button
                  key={lang}
                  onClick={() => { changeLanguage(lang); setShowOperatorMenu(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: currentLanguage === lang ? '#f0f9ff' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: currentLanguage === lang ? '#0284c7' : '#475569', fontWeight: 600 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={16} /> {lang === 'EN' ? 'English' : lang === 'ID' ? 'Bahasa Indonesia' : '日本語 (Japanese)'}
                  </div>
                  {currentLanguage === lang && <CheckCircle2 size={16} color="#0284c7" />}
                </button>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px' }}>
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: '#fef2f2', border: 'none', borderRadius: '6px', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}
              >
                <LogOut size={16} /> Switch User / Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Station Diagnostics Modal */}
      {showDiagnostics && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HardDrive size={24} color="#3b82f6" /> Station Diagnostics
              </h2>
              <button onClick={() => setShowDiagnostics(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: isOnline ? '#f0fdf4' : '#fef2f2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Wifi size={20} color={isOnline ? '#16a34a' : '#dc2626'} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>NETWORK STATUS</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isOnline ? '#16a34a' : '#dc2626' }}>
                    {isOnline ? 'Connected' : 'Offline'}
                  </div>
                </div>
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f0f9ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Zap size={20} color="#0284c7" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>MQTT BROKER</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>
                    Active
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Connected Edge Devices</h3>
                {(() => {
                  const activeStationObj = stations.find(s => s.name === appContext.station);
                  const activeInterface = activeStationObj ? interfaces.find(i => i.id === activeStationObj.interfaceId) : null;
                  
                  const activeDrivers = [];
                  if (activeInterface && activeInterface.drivers) {
                    const drvs = activeInterface.drivers;
                    if (drvs.serialCaliper?.enabled) {
                      activeDrivers.push({
                        name: `Web Serial Caliper (Baud: ${drvs.serialCaliper.baudRate || 9600}, Term: ${drvs.serialCaliper.terminator === '\r\n' ? 'CRLF' : drvs.serialCaliper.terminator === '\n' ? 'LF' : 'CR'})`,
                        icon: <Cpu size={16} color="#3b82f6" />
                      });
                    }
                    if (drvs.bluetoothCaliper?.enabled) {
                      activeDrivers.push({
                        name: `Web Bluetooth Caliper${drvs.bluetoothCaliper.prefix ? ` (Filter: ${drvs.bluetoothCaliper.prefix})` : ''}`,
                        icon: <Bluetooth size={16} color="#2563eb" />
                      });
                    }
                    if (drvs.barcodeScanner?.enabled) {
                      activeDrivers.push({
                        name: `USB Barcode Scanner (${drvs.barcodeScanner.mode === 'HID' ? 'HID Keyboard' : `Serial ${drvs.barcodeScanner.port || 'COM1'}`})`,
                        icon: <SlidersHorizontal size={16} color="#ea580c" />
                      });
                    }
                    if (drvs.webcam?.enabled) {
                      activeDrivers.push({
                        name: `Webcam/Camera (${drvs.webcam.resolution || '1080p'}${drvs.webcam.rtspUrl ? ' - IP Stream' : ''})`,
                        icon: <Camera size={16} color="#0d9488" />
                      });
                    }
                    if (drvs.obd2Reader?.enabled) {
                      activeDrivers.push({
                        name: `OBD2 Reader (${drvs.obd2Reader.transport || 'BLUETOOTH'})`,
                        icon: <Monitor size={16} color="#7c3aed" />
                      });
                    }
                  }

                  if (activeDrivers.length === 0) {
                    return (
                      <div style={{ padding: '16px', fontStyle: 'italic', color: '#64748b', fontSize: '0.85rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        {activeInterface ? "No hardware drivers enabled for this interface. Configure them in Shop Floor -> Interfaces." : "No interface assigned to this station."}
                      </div>
                    );
                  }

                  return (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      {activeDrivers.map((drv, idx) => (
                        <div key={idx} style={{ padding: '12px 16px', borderBottom: idx < activeDrivers.length - 1 ? '1px solid #e2e8f0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {drv.icon}
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>{drv.name}</span>
                          </div>
                          <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>
                            ACTIVE
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Hardware Test</h3>
                <input
                  type="text"
                  placeholder="Scan a barcode here to test..."
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', outline: 'none' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      toast.success(`Test Scanned: ${e.target.value}`);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes maviPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
      <Toaster position="top-right" />
    </div>
  );
};

const OpenCvCameraWidget = ({ comp, selectedApp, currentWorkOrder, appVariables = [], setAppVariables, fireDeviceInputTriggers }) => {
  const [loadingError, setLoadingError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const requestRef = useRef(null);
  const prevFrameRef = useRef(null);
  const prevGrayMatRef = useRef(null);
  const isFetchingCloudRef = useRef(false);

  const lastMatchStatesRef = useRef({});
  const prevIntensityRef = useRef({});
  const lastAnalysisTimeRef = useRef(0);
  const [cameraConfig, setCameraConfig] = useState(null);
  const [isSimulated, setIsSimulated] = useState(false);

  const cameraSource = cameraConfig?.type || comp?.props?.cameraSource || 'DEVICE';
  const ipCameraUrl = cameraConfig?.url || comp?.props?.ipCameraUrl || '';

  // Ruler States & Refs
  const [isRulerModeActive, setIsRulerModeActive] = useState(comp?.props?.filterType === 'RULER_VISION');
  const [isCircleModeActive, setIsCircleModeActive] = useState(comp?.props?.filterType === 'CIRCLE_DETECT');
  const [isAngleModeActive, setIsAngleModeActive] = useState(comp?.props?.filterType === 'ANGLE_MEASURE');
  const [isContourModeActive, setIsContourModeActive] = useState(comp?.props?.filterType === 'CONTOUR_GEOMETRY');

  const activateMeasurementMode = (mode) => {
    setIsRulerModeActive(mode === 'RULER_VISION');
    setIsCircleModeActive(mode === 'CIRCLE_DETECT');
    setIsAngleModeActive(mode === 'ANGLE_MEASURE');
    setIsContourModeActive(mode === 'CONTOUR_GEOMETRY');

    if (mode !== 'RULER_VISION') {
      setRulerPoints(null);
      lastSavedRulerPointsRef.current = null;
      setRulerDragStart(null);
      setRulerDragCurrent(null);
      if (rulerDetectRef.current) {
        rulerDetectRef.current.measurement = '-';
        if (rulerDetectRef.current.processedImgUrl) {
          URL.revokeObjectURL(rulerDetectRef.current.processedImgUrl);
          rulerDetectRef.current.processedImgUrl = null;
          rulerDetectRef.current.processedImage.src = '';
        }
      }
    }
  };

  const [rulerPoints, setRulerPoints] = useState(null);
  const [rulerDragStart, setRulerDragStart] = useState(null);
  const [rulerDragCurrent, setRulerDragCurrent] = useState(null);
  const lastSavedRulerPointsRef = useRef(null);

  const rulerDetectRef = useRef({
    isFetching: false,
    lastFetch: 0,
    processedImgUrl: null,
    processedImage: new Image(),
    measurement: '-'
  });
  const circleDetectRef = useRef({ isFetching: false, lastFetch: 0, processedImgUrl: null, processedImage: new Image(), result: null });
  const angleDetectRef = useRef({ isFetching: false, lastFetch: 0, processedImgUrl: null, processedImage: new Image(), result: null });
  const contourDetectRef = useRef({ isFetching: false, lastFetch: 0, processedImgUrl: null, processedImage: new Image(), result: null });

  const offscreenCanvasRef = useRef(null);
  const getCleanFrameBlob = useCallback((callback, mimeType = 'image/jpeg', quality = 0.85) => {
    const video = videoRef.current;
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offscreenCanvas = offscreenCanvasRef.current;
    const w = canvasRef.current?.width || 320;
    const h = canvasRef.current?.height || 240;
    offscreenCanvas.width = w;
    offscreenCanvas.height = h;
    
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return callback(null);
    
    if (cameraSource === 'IP_CAMERA' || isSimulated) {
      drawSimulatedIPStream(offscreenCtx, w, h);
    } else if (video) {
      offscreenCtx.drawImage(video, 0, 0, w, h);
    } else {
      return callback(null);
    }
    
    offscreenCanvas.toBlob(callback, mimeType, quality);
  }, [cameraSource, isSimulated]);

  useEffect(() => {
    if (comp?.props?.filterType === 'RULER_VISION') {
      setIsRulerModeActive(true);
    }
  }, [comp?.props?.filterType]);

  useEffect(() => {
    return () => {
      if (rulerDetectRef.current?.processedImgUrl) {
        URL.revokeObjectURL(rulerDetectRef.current.processedImgUrl);
      }
    };
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      if (comp?.props?.cameraConfigId) {
        try {
          const { getAllCameras } = await import('../utils/supabaseUtilityDB');
          const allCams = await getAllCameras();
          const found = allCams.find(c => c.id === comp.props.cameraConfigId);
          if (found) {
            setCameraConfig(found);
          }
        } catch (e) {
          console.error('Failed to load camera configuration in OpenCvCameraWidget:', e);
        }
      } else {
        setCameraConfig(null);
      }
    };
    fetchConfig();
  }, [comp?.props?.cameraConfigId]);
  const lastCloudFetchTimeRef = useRef(0);
  const cloudDetectionsRef = useRef([]);

  // DB & Logging States
  const [recentLogs, setRecentLogs] = useState([]);
  const [autoSave, setAutoSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uiReadout, setUiReadout] = useState({ val: '-', isPassed: true });
  
  const currentReadoutRef = useRef({ val: '-', isPassed: true });
  const lastLoggedVal = useRef('');

  // Removed opencv.js loading (migrated to Python backend)

  const animationTickRef = useRef(0);
  const drawSimulatedIPStream = (ctx, w, h) => {
    animationTickRef.current = (animationTickRef.current + 1) % 1000;
    const tick = animationTickRef.current;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 20; i < w; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
    }
    for (let i = 20; i < h; i += 20) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }

    ctx.fillStyle = '#334155';
    ctx.fillRect(0, h - 40, w, 10);
    ctx.fillStyle = '#475569';
    for (let x = (tick * 2) % 30; x < w; x += 30) {
      ctx.beginPath(); ctx.arc(x, h - 35, 4, 0, Math.PI * 2); ctx.fill();
    }

    const itemX = (tick * 1.5) % (w + 60) - 30;

    // Draw custom measurement targets in simulated screen center if active
    if (isCircleModeActive) {
      const cx = w / 2;
      const cy = h / 2 - 10;
      const radius = Math.min(w, h) * 0.22;
      
      // Draw simulated metal disc
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center hole
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (isAngleModeActive) {
      const cx = w / 2;
      const cy = h / 2 - 10;
      const len = Math.min(w, h) * 0.3;
      const angleDeg = 60 + 20 * Math.sin(tick * 0.05);
      const angleRad = (angleDeg * Math.PI) / 180;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const x1 = cx - len * Math.cos(angleRad / 2);
      const y1 = cy - len * Math.sin(angleRad / 2);
      const x2 = cx + len * Math.cos(angleRad / 2);
      const y2 = cy - len * Math.sin(angleRad / 2);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (isContourModeActive) {
      // Shape 1: Triangle
      const tx = w * 0.3;
      const ty = h / 2 - 10;
      const tSize = Math.min(w, h) * 0.15;
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx, ty - tSize);
      ctx.lineTo(tx + tSize, ty + tSize * 0.8);
      ctx.lineTo(tx - tSize, ty + tSize * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Shape 2: Square/Rectangle
      const sx = w * 0.7 - 10;
      const sy = h / 2 - 25;
      const sSize = Math.min(w, h) * 0.22;
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(sx, sy, sSize, sSize);
      ctx.fill();
      ctx.stroke();
    } else {
      // Default moving conveyor items
      const colorPalette = {
        RED: '#ef4444',
        GREEN: '#22c55e',
        BLUE: '#3b82f6',
        YELLOW: '#eab308',
        BLACK: '#090d16',
        WHITE: '#ffffff'
      };
      const colorsList = ['RED', 'GREEN', 'BLUE', 'YELLOW', 'WHITE', 'BLACK'];
      const cycleIndex = Math.floor(tick / 150) % colorsList.length;
      const currentItemColorKey = colorsList[cycleIndex];
      const currentItemColor = colorPalette[currentItemColorKey] || '#3b82f6';

      ctx.fillStyle = currentItemColor;
      ctx.fillRect(itemX, h - 65, 30, 25);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(itemX + 5, h - 55, 20, 10);
      ctx.fillStyle = '#000000';
      for (let bx = 0; bx < 15; bx += 2) {
        if (Math.sin(bx + tick) > -0.2) {
          ctx.fillRect(itemX + 6 + bx, h - 55, 1, 10);
        }
      }
    }

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(5, 5, w - 10, 18);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(5, 5, w - 10, 18);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'left';
    const displayUrl = ipCameraUrl ? (ipCameraUrl.length > 35 ? ipCameraUrl.substring(0, 32) + '...' : ipCameraUrl) : 'RTSP STREAM NOT CONFIG';
    ctx.fillText(`STREAM: ${displayUrl.toUpperCase()}`, 10, 16);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(w - 12, 14, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('LIVE-FEED SIM', w - 18, 16);
    ctx.textAlign = 'left';
  };

  useEffect(() => {
    setIsSimulated(false);
    setLoadingError('');
  }, [cameraSource]);

  // Camera stream and loop control
  useEffect(() => {
    if (isSimulated) {
      setCameraActive(true);
      return;
    }

    if (cameraSource === 'IP_CAMERA') {
      setCameraActive(true);
      return;
    }

    let localStream = null;
    const startCamera = async () => {
      try {
        let videoConstraints = { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: { ideal: 'environment' } };
        const savedCameraId = localStorage.getItem('mavi-selected-camera-id');
        const configuredCameraId = comp?.props?.cameraId;
        const targetCameraId = configuredCameraId || savedCameraId;
        
        if (targetCameraId && targetCameraId !== 'default' && targetCameraId !== '') {
          videoConstraints = { deviceId: { exact: targetCameraId }, width: { ideal: 640 }, height: { ideal: 480 } };
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });
        streamRef.current = stream;
        localStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setCameraActive(true);
        }
      } catch (err) {
        console.error('Failed to open camera for OpenCV:', err);
        setLoadingError('Gagal membuka kamera: ' + (err.message || 'Akses ditolak'));
      }
    };

    startCamera();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraSource, isSimulated]);

  // Helper to calculate mouse/touch position scaled to the canvas with objectFit: cover
  const getCanvasMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Handle touch events
    const isTouch = e.touches && e.touches.length > 0;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const W_r = rect.width;
    const H_r = rect.height;
    const W_c = canvas.width;
    const H_c = canvas.height;
    
    // Scale factor applied to the buffer to draw it on the display (object-fit: cover)
    const S = Math.max(W_r / W_c, H_r / H_c);
    
    const x_r = clientX - rect.left;
    const y_r = clientY - rect.top;
    
    const x = (x_r - W_r / 2) / S + W_c / 2;
    const y = (y_r - H_r / 2) / S + H_c / 2;
    
    // Clamp bounds to within canvas dimensions
    return {
      x: Math.max(0, Math.min(Math.round(x), W_c)),
      y: Math.max(0, Math.min(Math.round(y), H_c))
    };
  };

  const handleRulerMouseDown = (e) => {
    const pos = getCanvasMousePos(e);
    setRulerDragStart(pos);
    setRulerDragCurrent(pos);
    setRulerPoints(null);
    if (rulerDetectRef.current) {
      rulerDetectRef.current.measurement = '-';
    }
  };

  const handleRulerMouseMove = (e) => {
    if (!rulerDragStart) return;
    const pos = getCanvasMousePos(e);
    setRulerDragCurrent(pos);
  };

  const handleRulerMouseUp = () => {
    if (!rulerDragStart || !rulerDragCurrent) return;
    const dx = rulerDragCurrent.x - rulerDragStart.x;
    const dy = rulerDragCurrent.y - rulerDragStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
      const pts = {
        x1: rulerDragStart.x,
        y1: rulerDragStart.y,
        x2: rulerDragCurrent.x,
        y2: rulerDragCurrent.y
      };
      setRulerPoints(pts);
    }
    setRulerDragStart(null);
    setRulerDragCurrent(null);
  };

  const handleRulerTouchStart = (e) => {
    e.preventDefault();
    handleRulerMouseDown(e);
  };

  const handleRulerTouchMove = (e) => {
    e.preventDefault();
    handleRulerMouseMove(e);
  };

  const handleRulerTouchEnd = (e) => {
    e.preventDefault();
    handleRulerMouseUp();
  };

  const areRulerPointsEqual = (p1, p2) => {
    if (!p1 && !p2) return true;
    if (!p1 || !p2) return false;
    return p1.x1 === p2.x1 && p1.y1 === p2.y1 && p1.x2 === p2.x2 && p1.y2 === p2.y2;
  };

  // Real-time Database Saving Function
  const saveLogToDb = async (currentVal, isPassed) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      let modeName = comp.props.filterType || 'CANNY';
      if (isRulerModeActive) modeName = 'RULER_VISION';
      else if (isCircleModeActive) modeName = 'CIRCLE_DETECT';
      else if (isAngleModeActive) modeName = 'ANGLE_MEASURE';
      else if (isContourModeActive) modeName = 'CONTOUR_GEOMETRY';
      const statusStr = isPassed ? 'PASS' : 'FAIL';
      
      const payload = {
        video_name: `OPENCV_${comp.id}`,
        timestamp: new Date().toISOString(),
        measurements: {
          filterType: modeName,
          value: currentVal,
          threshold: modeName === 'YOLO_DETECTOR' ? (comp.props.yoloConfidence ?? 50) : (comp.props.thresholdValue ?? 100),
          yoloModelType: comp.props.yoloModelType || 'yolov8n_general'
        },
        cycle_data: [],
        quality_data: {
          status: statusStr,
          value: currentVal
        },
        work_order: currentWorkOrder || 'WO-LIVE-VISION',
        narration: `Vision ${modeName} - Reading: ${currentVal} [${statusStr}]`
      };

      await saveLiveMeasurement(payload);

      // Add to local list
      const newLog = {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString(),
        mode: modeName,
        value: currentVal,
        status: statusStr
      };

      setRecentLogs(prev => [newLog, ...prev].slice(0, 5));
      toast.success(`💾 Vision Data disimpan ke database: ${currentVal}`);
    } catch (err) {
      console.error('Failed to save vision measurement:', err);
      toast.error('❌ Gagal menyimpan data vision: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 300ms UI update sync and Auto-Save loop
  useEffect(() => {
    const interval = setInterval(() => {
      const current = currentReadoutRef.current;
      setUiReadout(current);

      if (autoSave && lastLoggedVal.current !== current.val && current.val !== 'WAITING FOR CODE...' && current.val !== '-') {
        if (isRulerModeActive) {
          // For Ruler, only save if the ruler points have changed since last save
          if (rulerPoints && !areRulerPointsEqual(rulerPoints, lastSavedRulerPointsRef.current)) {
            lastSavedRulerPointsRef.current = rulerPoints;
            lastLoggedVal.current = current.val;
            saveLogToDb(current.val, current.isPassed);
          }
        } else {
          lastLoggedVal.current = current.val;
          saveLogToDb(current.val, current.isPassed);
        }
      }
    }, 300);
    return () => clearInterval(interval);
  }, [uiReadout, autoSave, isRulerModeActive, isCircleModeActive, isAngleModeActive, isContourModeActive, rulerPoints]);

  // Frame processing loop
  useEffect(() => {
    if (!cameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = 320;
    const height = 240;
    canvas.width = width;
    canvas.height = height;
    const runYoloDetector = (ctx, canvas, w, h) => {
      const modelType = comp?.props?.yoloModelType || 'yolov8n_general';
      const confMin = comp?.props?.yoloConfidence ?? 50;
      const targetClassFilter = (comp?.props?.yoloTargetClass || '').toLowerCase().trim();
      const yoloRunMode = comp?.props?.yoloRunMode || 'SIMULATED';

      let calculatedVal = '';
      let isPassed = true;
      let detections = [];

      if (yoloRunMode === 'ULTRALYTICS_CLOUD' || yoloRunMode === 'LOCAL_API') {
        const apiKey = comp?.props?.yoloApiKey || '';
        const modelId = comp?.props?.yoloModelId || '';
        const localUrl = comp?.props?.yoloLocalUrl || 'http://localhost:8000/detect';

        // Draw last received cloud detections
        detections = cloudDetectionsRef.current || [];

        // Throttling call: only fetch once every 1000ms
        const now = Date.now();
        const canFetch = yoloRunMode === 'ULTRALYTICS_CLOUD' ? (apiKey && modelId) : true;
        
        if (canFetch && !isFetchingCloudRef.current && (now - lastCloudFetchTimeRef.current > 1000)) {
          isFetchingCloudRef.current = true;
          lastCloudFetchTimeRef.current = now;

          canvas.toBlob((blob) => {
            if (blob) {
              const formData = new FormData();
              const endpoint = yoloRunMode === 'ULTRALYTICS_CLOUD'
                ? `https://api.ultralytics.com/v1/predict/${modelId}`
                : localUrl;

              const headers = yoloRunMode === 'ULTRALYTICS_CLOUD'
                ? { "x-api-key": apiKey }
                : {};

              if (yoloRunMode === 'ULTRALYTICS_CLOUD') {
                formData.append("image", blob, "frame.jpg");
              } else {
                formData.append("file", blob, "frame.jpg");
              }

              fetch(endpoint, {
                method: "POST",
                headers: headers,
                body: formData
              })
              .then(res => {
                if (!res.ok) throw new Error(`Status: ${res.status}`);
                return res.json();
              })
              .then(data => {
                if (data) {
                  if (data.data) {
                    cloudDetectionsRef.current = data.data.map(item => ({
                      x: Math.round(item.box.x1),
                      y: Math.round(item.box.y1),
                      w: Math.round(item.box.x2 - item.box.x1),
                      h: Math.round(item.box.y2 - item.box.y1),
                      label: item.name,
                      conf: Math.round(item.confidence * 100)
                    }));
                  } else if (data.predictions) {
                    cloudDetectionsRef.current = data.predictions.map(item => ({
                      x: Math.round(item.x),
                      y: Math.round(item.y),
                      w: Math.round(item.w),
                      h: Math.round(item.h),
                      label: item.label,
                      conf: Math.round(item.confidence)
                    }));
                  }
                }
              })
              .catch(err => console.error("YOLO API error:", err))
              .finally(() => {
                isFetchingCloudRef.current = false;
              });
            } else {
              isFetchingCloudRef.current = false;
            }
          }, 'image/jpeg', 0.85);
        }

        // Apply confidence and target class filters to cloud detections
        detections = detections.filter(d => d.conf >= confMin);
        if (targetClassFilter) {
          detections = detections.filter(d => d.label.toLowerCase().includes(targetClassFilter));
        }

        // Calculate calculatedVal & isPassed for cloud predictions
        const helmetDetected = detections.some(d => d.label.toLowerCase().includes('helmet') || d.label.toLowerCase().includes('helm'));
        const vestDetected = detections.some(d => d.label.toLowerCase().includes('vest') || d.label.toLowerCase().includes('rompi'));
        const personDetected = detections.some(d => d.label.toLowerCase().includes('person') || d.label.toLowerCase().includes('orang'));
        const defectDetected = detections.some(d => d.label.toLowerCase().includes('defect') || d.label.toLowerCase().includes('cacat') || d.label.toLowerCase().includes('scratch') || d.label.toLowerCase().includes('crack') || d.label.toLowerCase().includes('dent'));

        if (personDetected) {
          if (helmetDetected && vestDetected) {
            calculatedVal = 'SAFE: APD LENGKAP (CLOUD)';
            isPassed = true;
          } else {
            const missing = [];
            if (!helmetDetected) missing.push('Helmet');
            if (!vestDetected) missing.push('Vest');
            calculatedVal = `UNSAFE: MISSING ${missing.join(' & ')} (CLOUD)`;
            isPassed = false;
          }
        } else if (defectDetected) {
          const defects = detections.filter(d => d.label.toLowerCase().includes('defect') || d.label.toLowerCase().includes('cacat') || d.label.toLowerCase().includes('scratch') || d.label.toLowerCase().includes('crack') || d.label.toLowerCase().includes('dent'));
          calculatedVal = `FAIL: CACAT ${defects.map(d => d.label.toUpperCase()).join(', ')} (CLOUD)`;
          isPassed = false;
        } else {
          const detectedLabels = detections.map(d => `${d.label} (${d.conf}%)`);
          calculatedVal = detectedLabels.length > 0 ? `DETECTED (CLOUD): ${detectedLabels.join(', ')}` : 'No Objects Detected (CLOUD)';
          isPassed = detections.length > 0;
        }
      } else {
        if (modelType === 'yolov8n_safety') {
          const time = Date.now() / 1000;
          const personBox = { x: 80, y: 30, w: 160, h: 200, label: 'person', conf: 96 };
          const hasHelmet = (Math.floor(time / 6) % 2) === 0;
          const helmetBox = hasHelmet ? { x: 130, y: 32, w: 50, h: 35, label: 'safety helmet', conf: 92 } : null;
          const vestBox = { x: 105, y: 70, w: 100, h: 100, label: 'reflective vest', conf: 89 };
          const glovesBox = { x: 75, y: 160, w: 30, h: 30, label: 'gloves', conf: 45 };

          const candidates = [personBox, helmetBox, vestBox, glovesBox].filter(Boolean);
          detections = candidates.filter(d => d.conf >= confMin);

          const helmetDetected = detections.some(d => d.label === 'safety helmet');
          const vestDetected = detections.some(d => d.label === 'reflective vest');
          
          if (helmetDetected && vestDetected) {
            calculatedVal = 'SAFE: APD LENGKAP';
            isPassed = true;
          } else {
            const missing = [];
            if (!helmetDetected) missing.push('Helmet');
            if (!vestDetected) missing.push('Vest');
            calculatedVal = `UNSAFE: MISSING ${missing.join(' & ')}`;
            isPassed = false;
          }
        } else if (modelType === 'yolov8n_qc') {
          const cycleTime = 8000;
          const tick = Date.now() % cycleTime;
          const progress = tick / cycleTime;

          const objW = 100;
          const objH = 100;
          const objX = -80 + progress * (w + 160);
          const objY = Math.floor(h * 0.35);

          const cycleNum = Math.floor(Date.now() / cycleTime);
          const isDefectCycle = cycleNum % 2 !== 0;

          const productBox = { x: Math.round(objX), y: Math.round(objY), w: objW, h: objH, label: 'ok product', conf: 95 };
          detections.push(productBox);

          if (isDefectCycle) {
            const scratchX = objX + 30;
            const scratchY = objY + 40;
            const defectBox = { x: Math.round(scratchX), y: Math.round(scratchY), w: 25, h: 18, label: 'scratch defect', conf: 84 };
            detections.push(defectBox);
          }

          detections = detections.filter(d => d.conf >= confMin);

          const defectDetected = detections.some(d => d.label.includes('defect'));
          if (defectDetected) {
            calculatedVal = 'FAIL: CACAT SCRATCH';
            isPassed = false;
            const prod = detections.find(d => d.label === 'ok product');
            if (prod) prod.label = 'ng product';
          } else {
            calculatedVal = 'PASS: PRODUK OK';
            isPassed = true;
          }
        } else {
          const time = Date.now() / 1000;
          const jitterX = Math.sin(time) * 3;
          const jitterY = Math.cos(time * 1.5) * 2;

          const person = { x: Math.round(20 + jitterX), y: Math.round(40 + jitterY), w: 100, h: 180, label: 'person', conf: 92 };
          const laptop = { x: Math.round(130 + jitterX * 0.5), y: Math.round(110 + jitterY * 0.5), w: 90, h: 70, label: 'laptop', conf: 87 };
          const phone = { x: Math.round(150 - jitterX), y: Math.round(90 + jitterY), w: 20, h: 35, label: 'cell phone', conf: 76 };
          const cup = { x: Math.round(230 + jitterX), y: Math.round(120 - jitterY), w: 25, h: 30, label: 'cup', conf: 48 };
          const chair = { x: Math.round(250 + jitterX * 0.3), y: Math.round(100 + jitterY * 0.3), w: 100, h: 140, label: 'chair', conf: 64 };

          const candidates = [person, laptop, phone, cup, chair];
          detections = candidates.filter(d => d.conf >= confMin);

          if (targetClassFilter) {
            detections = detections.filter(d => d.label.toLowerCase().includes(targetClassFilter));
          }

          const detectedLabels = detections.map(d => `${d.label} (${d.conf}%)`);
          calculatedVal = detectedLabels.length > 0 ? detectedLabels.join(', ') : 'No Objects Detected';
          isPassed = detections.length > 0;
        }
      }

      // Draw bounding boxes
      detections.forEach(det => {
        let boxColor = '#3b82f6';
        if (det.label === 'safety helmet') boxColor = '#eab308';
        else if (det.label === 'reflective vest') boxColor = '#84cc16';
        else if (det.label === 'gloves') boxColor = '#06b6d4';
        else if (det.label === 'ok product') boxColor = '#10b981';
        else if (det.label === 'scratch defect' || det.label === 'ng product') boxColor = '#ef4444';
        else if (['laptop', 'cell phone', 'cup', 'chair'].includes(det.label)) boxColor = '#a855f7';

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(det.x, det.y, det.w, det.h);
        ctx.fillStyle = boxColor + '10';
        ctx.fillRect(det.x, det.y, det.w, det.h);

        // Corner brackets
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2.5;
        const len = Math.min(det.w, det.h) * 0.15;
        ctx.beginPath(); ctx.moveTo(det.x, det.y + len); ctx.lineTo(det.x, det.y); ctx.lineTo(det.x + len, det.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(det.x + det.w - len, det.y); ctx.lineTo(det.x + det.w, det.y); ctx.lineTo(det.x + det.w, det.y + len); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(det.x, det.y + det.h - len); ctx.lineTo(det.x, det.y + det.h); ctx.lineTo(det.x + len, det.y + det.h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(det.x + det.w - len, det.y + det.h); ctx.lineTo(det.x + det.w, det.y + det.h); ctx.lineTo(det.x + det.w, det.y + det.h - len); ctx.stroke();

        // Tag
        ctx.fillStyle = boxColor;
        const textStr = `${det.label} ${det.conf}%`;
        ctx.font = 'bold 8px sans-serif';
        const textWidth = ctx.measureText(textStr).width + 6;
        ctx.fillRect(det.x, det.y - 11, textWidth, 11);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(textStr, det.x + 3, det.y - 3);
      });

      // HUD
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(w - 110, 8, 102, 50);
      ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)';
      ctx.strokeRect(w - 110, 8, 102, 50);

      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 6.5px sans-serif';
      ctx.fillText('YOLOv8 ACTIVE', w - 104, 17);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '6px monospace';
      const infTime = (12.2 + Math.sin(Date.now() / 400) * 1.5).toFixed(1);
      ctx.fillText(`Model: ${modelType.substring(0, 12)}`, w - 104, 27);
      ctx.fillText(`Inference: ${infTime} ms`, w - 104, 36);
      ctx.fillText(`Objects: ${detections.length}`, w - 104, 45);

      return { calculatedVal, isPassed };
    };

    let isProcessing = true;

    const processFrame = () => {
      if (!isProcessing) return;

      try {
        if (cameraSource !== 'IP_CAMERA' && !isSimulated && (video.paused || video.ended)) {
          requestRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const getVarVal = (varName, fallback) => {
          const v = appVariables.find(av => av.name === varName);
          if (v && v.value !== undefined && v.value !== null && v.value !== '') {
            const parsed = parseFloat(v.value);
            if (!isNaN(parsed)) return parsed;
          }
          return fallback;
        };

        const baseFilterType = comp.props.filterType || 'CANNY';
        let filterType = baseFilterType;
        if (isRulerModeActive) {
          filterType = 'RULER_VISION';
        } else if (isCircleModeActive) {
          filterType = 'CIRCLE_DETECT';
        } else if (isAngleModeActive) {
          filterType = 'ANGLE_MEASURE';
        } else if (isContourModeActive) {
          filterType = 'CONTOUR_GEOMETRY';
        }
        const threshVal = comp.props.thresholdValue ?? 100;
        
        let calculatedVal = '-';
        let isPassed = true;
        
        const ctx = canvas.getContext('2d');

        if (filterType === 'RULER_VISION') {
          try {
            const stateRef = rulerDetectRef.current;
            const now = Date.now();
            
            if (rulerPoints) {
              if (!stateRef.isFetching && (now - stateRef.lastFetch > 180)) {
                stateRef.isFetching = true;
                stateRef.lastFetch = now;
                
                getCleanFrameBlob((blob) => {
                  if (blob) {
                    const formData = new FormData();
                    formData.append("file", blob, "frame.jpg");
                    
                    const scaleRatio = 640 / canvas.width;
                    const mmPx = (cameraConfig?.settings?.mmPerPixel || comp?.props?.mmPerPixel || 0.1170) * scaleRatio;
                    
                    const params = new URLSearchParams({
                      x1: rulerPoints.x1.toString(),
                      y1: rulerPoints.y1.toString(),
                      x2: rulerPoints.x2.toString(),
                      y2: rulerPoints.y2.toString(),
                      mm_per_pixel: mmPx.toString()
                    });
                    
                    fetch(`http://localhost:8000/detect/ruler?${params.toString()}`, {
                      method: "POST",
                      body: formData
                    })
                    .then(res => {
                      if (!res.ok) throw new Error('Ruler API error');
                      const calcVal = res.headers.get('X-Calculated-Value') || '-';
                      const metadataStr = res.headers.get('X-Ruler-Result') || '{}';
                      
                      stateRef.measurement = calcVal;
                      
                      if (lastMatchStatesRef.current.rulerVal !== calcVal) {
                        lastMatchStatesRef.current.rulerVal = calcVal;
                        let parsedMeta = {};
                        try {
                          parsedMeta = JSON.parse(metadataStr);
                        } catch(_) {}
                        
                        if (typeof fireDeviceInputTriggers === 'function' && cameraConfig?.id) {
                          fireDeviceInputTriggers(cameraConfig.id, 'ON_MEASUREMENT', {
                            value: calcVal,
                            metadata: parsedMeta
                          });
                        }
                        
                        const rulerVarName = comp?.props?.rulerVariableName || `${comp.id}_RULER_VAL`;
                        if (setAppVariables) {
                          setAppVariables(prev => {
                            const idx = prev.findIndex(v => v.name === rulerVarName);
                            if (idx >= 0) {
                              const updated = [...prev];
                              updated[idx] = { ...updated[idx], value: calcVal };
                              return updated;
                            } else {
                              return [...prev, { name: rulerVarName, value: calcVal, type: 'TEXT' }];
                            }
                          });
                        }
                      }
                      
                      return res.blob();
                    })
                    .then(imgBlob => {
                      if (stateRef.processedImgUrl) {
                        URL.revokeObjectURL(stateRef.processedImgUrl);
                      }
                      stateRef.processedImgUrl = URL.createObjectURL(imgBlob);
                      stateRef.processedImage.src = stateRef.processedImgUrl;
                    })
                    .catch(err => console.error("Python Ruler Vision error in widget:", err))
                    .finally(() => {
                      stateRef.isFetching = false;
                    });
                  } else {
                    stateRef.isFetching = false;
                  }
                }, 'image/jpeg', 0.85);
              }
              
              if (stateRef.processedImage && stateRef.processedImage.complete && stateRef.processedImage.naturalWidth > 0) {
                ctx.drawImage(stateRef.processedImage, 0, 0, width, height);
              }
              calculatedVal = stateRef.measurement;
              isPassed = true;
            } else {
              if (cameraSource === 'IP_CAMERA' || isSimulated) {
                drawSimulatedIPStream(ctx, width, height);
              } else {
                ctx.drawImage(video, 0, 0, width, height);
              }
              
              ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
              ctx.fillRect(0, 0, width, height);
              
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 9px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText("RULER VISION ACTIVE", width / 2, height / 2 - 5);
              ctx.fillStyle = '#38bdf8';
              ctx.font = '7px sans-serif';
              ctx.fillText("Drag on screen to measure", width / 2, height / 2 + 10);
              ctx.textAlign = 'start';
              
              calculatedVal = '-';
              isPassed = true;
            }
            
            if (rulerDragStart && rulerDragCurrent) {
              const rx1 = rulerDragStart.x;
              const ry1 = rulerDragStart.y;
              const rx2 = rulerDragCurrent.x;
              const ry2 = rulerDragCurrent.y;
              
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(rx1, ry1);
              ctx.lineTo(rx2, ry2);
              ctx.stroke();
              
              ctx.strokeStyle = '#0ea5e9';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(rx1, ry1);
              ctx.lineTo(rx2, ry2);
              ctx.stroke();
              
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = '#0ea5e9';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(rx1, ry1, 3, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();
              
              ctx.beginPath();
              ctx.arc(rx2, ry2, 3, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();
            }
          } catch (e) {
            console.error('Ruler Vision canvas processing error in widget:', e);
          }
        } else {
          // Fast Canvas 2D fallback rendering (when OpenCV is downloading or offline or IP Camera)
          const ctx = canvas.getContext('2d');
          if (cameraSource === 'IP_CAMERA' || isSimulated) {
            drawSimulatedIPStream(ctx, width, height);
          } else {
            ctx.drawImage(video, 0, 0, width, height);
          }

          
          const isStandardCvFilter = ['GRAY', 'CANNY', 'THRESHOLD', 'SOBEL', 'COUNTING', 'CHANGE_DETECTOR', 'DIMENSION', 'INSPECTION'].includes(filterType);

          if (isStandardCvFilter) {
            if (!window._cvProcessState) {
              window._cvProcessState = { isFetching: false, lastFetch: 0, processedImgUrl: null, processedImage: new Image(), result: {} };
            }
            const stateRef = window._cvProcessState;
            const now = Date.now();

            if (!stateRef.isFetching && (now - stateRef.lastFetch > 300)) {
              stateRef.isFetching = true;
              stateRef.lastFetch = now;

              getCleanFrameBlob((blob) => {
                if (blob) {
                  const formData = new FormData();
                  formData.append("file", blob, "frame.jpg");
                  
                  const mmPx = cameraConfig?.settings?.mmPerPixel || comp?.props?.mmPerPixel || 0.0;
                  const threshVal = comp?.props?.thresholdValue ?? 100;
                  const dimMode = comp?.props?.dimMeasureMode || 'WIDTH';
                  const dimUnit = comp?.props?.dimUnit || 'mm';
                  const dimMin = comp?.props?.dimMinMm ?? '';
                  const dimMax = comp?.props?.dimMaxMm ?? '';
                  const dimThresh = comp?.props?.dimThreshold ?? 80;
                  const targetCount = comp?.props?.targetCount ?? 3;
                  const changeThresh = comp?.props?.changeThreshold ?? 25;

                  const params = new URLSearchParams({
                    filter_type: filterType,
                    camera_id: comp?.id || 'default',
                    threshold_value: threshVal.toString(),
                    mm_per_pixel: mmPx.toString(),
                    dim_measure_mode: dimMode,
                    dim_unit: dimUnit,
                    dim_threshold: dimThresh.toString(),
                    target_count: targetCount.toString(),
                    change_threshold: changeThresh.toString()
                  });
                  if (dimMin !== '') params.append('dim_min_mm', dimMin.toString());
                  if (dimMax !== '') params.append('dim_max_mm', dimMax.toString());

                  fetch(`http://localhost:8000/cv/process?${params.toString()}`, { method: "POST", body: formData })
                    .then(res => {
                      if (!res.ok) throw new Error('CV Process API error');
                      const calcVal = res.headers.get('X-Calculated-Value') || '-';
                      const passed = res.headers.get('X-Is-Passed') === 'true';
                      const metaStr = res.headers.get('X-Detections') || '[]';
                      try { stateRef.result = { detections: JSON.parse(metaStr), val: calcVal, passed: passed }; } catch(_) { stateRef.result = { detections: [] }; }
                      return res.blob();
                    })
                    .then(imgBlob => {
                      if (stateRef.processedImgUrl) URL.revokeObjectURL(stateRef.processedImgUrl);
                      stateRef.processedImgUrl = URL.createObjectURL(imgBlob);
                      stateRef.processedImage.src = stateRef.processedImgUrl;
                    })
                    .catch(err => console.error("CV Process API error:", err))
                    .finally(() => { stateRef.isFetching = false; });
                } else { stateRef.isFetching = false; }
              }, 'image/jpeg', 0.85);
            }

            if (stateRef.processedImage && stateRef.processedImage.complete && stateRef.processedImage.naturalWidth > 0) {
              ctx.drawImage(stateRef.processedImage, 0, 0, width, height);
            }
            
            if (stateRef.result?.val !== undefined) calculatedVal = stateRef.result.val;
            if (stateRef.result?.passed !== undefined) isPassed = stateRef.result.passed;
          } else if (filterType === 'CALIPER_OCR') {
            const boxW = 160;
            const boxH = 50;
            const boxX = (width - boxW) / 2;
            const boxY = (height - boxH) / 2;
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxW, boxH);
            
            // corners
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(boxX - 4, boxY - 4, 12, 4);
            ctx.fillRect(boxX - 4, boxY - 4, 4, 12);
            ctx.fillRect(boxX + boxW - 8, boxY - 4, 12, 4);
            ctx.fillRect(boxX + boxW, boxY - 4, 4, 12);
            ctx.fillRect(boxX - 4, boxY + boxH, 12, 4);
            ctx.fillRect(boxX - 4, boxY + boxH - 8, 4, 12);
            ctx.fillRect(boxX + boxW - 8, boxY + boxH, 12, 4);
            ctx.fillRect(boxX + boxW, boxY + boxH - 8, 4, 12);

            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.fillRect(10, 10, 190, 48);
            ctx.fillStyle = '#60a5fa';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('ALIGN DIGITAL CALIPER SCREEN', 18, 24);
            
            const val = (25.40 + Math.sin(Date.now() / 1500) * 0.03).toFixed(2);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px monospace';
            ctx.fillText(`READOUT: ${val} mm`, 18, 42);

            const calMin = getVarVal('Caliper_LSL', comp.props.caliperMin ?? 25.35);
            const calMax = getVarVal('Caliper_USL', comp.props.caliperMax ?? 25.45);
            const parsedCaliper = parseFloat(val);
            calculatedVal = `${val} mm`;
            isPassed = parsedCaliper >= calMin && parsedCaliper <= calMax;
          } else if (filterType === 'DIAL_GAUGE') {
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = 60;
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, 2*Math.PI); ctx.stroke();
            
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1;
            for (let a = 0; a < 360; a += 30) {
              const rad = (a * Math.PI) / 180;
              ctx.beginPath();
              ctx.moveTo(centerX + Math.cos(rad) * (radius - 5), centerY + Math.sin(rad) * (radius - 5));
              ctx.lineTo(centerX + Math.cos(rad) * radius, centerY + Math.sin(rad) * radius);
              ctx.stroke();
            }
            
            const angle = (Date.now() / 1200) % (2 * Math.PI);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(angle) * (radius - 12), centerY + Math.sin(angle) * (radius - 12));
            ctx.stroke();
            
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(centerX, centerY, 3.5, 0, 2*Math.PI); ctx.fill();
            
            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.fillRect(10, 10, 170, 48);
            ctx.fillStyle = '#fdba74';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('DIAL GAUGE READOUT', 18, 24);
            const val = ((angle / (2 * Math.PI)) * 100).toFixed(1);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px monospace';
            ctx.fillText(`PRESSURE: ${val} PSI`, 18, 42);

            const gMin = getVarVal('Gauge_LSL', comp.props.gaugeMin ?? 0.0);
            const gMax = getVarVal('Gauge_USL', comp.props.gaugeMax ?? 60.0);
            const parsedGauge = parseFloat(val);
            calculatedVal = `${val} PSI`;
            isPassed = parsedGauge >= gMin && parsedGauge <= gMax;
          } else if (filterType === 'BARCODE') {
            const laserY = (height / 2) + Math.sin(Date.now() / 150) * 35;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(width * 0.15, laserY); ctx.lineTo(width * 0.85, laserY); ctx.stroke();
            
            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.fillRect(10, 10, 170, 42);
            ctx.fillStyle = '#fca5a5';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('BARCODE LASER SCANNING', 18, 24);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px monospace';
            
            const codeSec = Math.floor(Date.now() / 4000) % 2;
            const simulatedCode = codeSec === 0 ? 'BC_982304918230' : 'WAITING FOR CODE...';
            ctx.fillText(simulatedCode, 18, 38);

            calculatedVal = simulatedCode;
            isPassed = simulatedCode !== 'WAITING FOR CODE...';
          }   else if (filterType === 'YOLO_DETECTOR') {
            const ctx = canvas.getContext('2d');
            if (cameraSource === 'IP_CAMERA' || isSimulated) {
              drawSimulatedIPStream(ctx, width, height);
            } else {
              ctx.drawImage(video, 0, 0, width, height);
            }
            const res = runYoloDetector(ctx, canvas, width, height);
            calculatedVal = res.calculatedVal;
            isPassed = res.isPassed;
          }  else if (filterType === 'CIRCLE_DETECT') {
            // ── CIRCLE/DIAMETER DETECTION (Python API) ──
            const ctx = canvas.getContext('2d');
            if (cameraSource === 'IP_CAMERA' || isSimulated) {
              drawSimulatedIPStream(ctx, width, height);
            } else {
              ctx.drawImage(video, 0, 0, width, height);
            }

            const stateRef = circleDetectRef.current;
            const now = Date.now();
            const mmPx = cameraConfig?.settings?.mmPerPixel || comp?.props?.mmPerPixel || 0.1170;
            const minR = comp?.props?.circleMinRadius ?? 10;
            const maxR = comp?.props?.circleMaxRadius ?? 200;
            const param2Val = comp?.props?.circleParam2 ?? 30;

            if (!stateRef.isFetching && (now - stateRef.lastFetch > 300)) {
              stateRef.isFetching = true;
              stateRef.lastFetch = now;

              getCleanFrameBlob((blob) => {
                if (blob) {
                  const formData = new FormData();
                  formData.append("file", blob, "frame.jpg");
                  const params = new URLSearchParams({ mm_per_pixel: mmPx.toString(), min_radius: minR.toString(), max_radius: maxR.toString(), param2: param2Val.toString() });
                  fetch(`http://localhost:8000/detect/circle?${params.toString()}`, { method: "POST", body: formData })
                    .then(res => {
                      if (!res.ok) throw new Error('Circle API error');
                      const metaStr = res.headers.get('X-Circle-Result') || '{}';
                      try { stateRef.result = JSON.parse(metaStr); } catch(_) { stateRef.result = {}; }
                      return res.blob();
                    })
                    .then(imgBlob => {
                      if (stateRef.processedImgUrl) URL.revokeObjectURL(stateRef.processedImgUrl);
                      stateRef.processedImgUrl = URL.createObjectURL(imgBlob);
                      stateRef.processedImage.src = stateRef.processedImgUrl;
                    })
                    .catch(err => console.error("Circle API error:", err))
                    .finally(() => { stateRef.isFetching = false; });
                } else { stateRef.isFetching = false; }
              }, 'image/jpeg', 0.85);
            }

            if (stateRef.processedImage && stateRef.processedImage.complete && stateRef.processedImage.naturalWidth > 0) {
              ctx.drawImage(stateRef.processedImage, 0, 0, width, height);
            }

            const circleCount = stateRef.result?.count ?? 0;
            calculatedVal = circleCount > 0 ? `Circles: ${circleCount}` : 'No circles';
            isPassed = circleCount > 0;

            // HUD
            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
            ctx.fillRect(10, 10, 180, 30);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1;
            ctx.strokeRect(10, 10, 180, 30);
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('CIRCLE/DIAMETER DETECTION', 18, 29);

          } else if (filterType === 'ANGLE_MEASURE') {
            // ── ANGLE MEASUREMENT (Python API) ──
            const ctx = canvas.getContext('2d');
            if (cameraSource === 'IP_CAMERA' || isSimulated) {
              drawSimulatedIPStream(ctx, width, height);
            } else {
              ctx.drawImage(video, 0, 0, width, height);
            }

            const stateRef = angleDetectRef.current;
            const now = Date.now();
            const cannyTh = comp?.props?.angleCannyThreshold ?? 50;
            const minLen = comp?.props?.angleMinLineLength ?? 50;
            const maxGap = comp?.props?.angleMaxLineGap ?? 10;

            if (!stateRef.isFetching && (now - stateRef.lastFetch > 300)) {
              stateRef.isFetching = true;
              stateRef.lastFetch = now;

              getCleanFrameBlob((blob) => {
                if (blob) {
                  const formData = new FormData();
                  formData.append("file", blob, "frame.jpg");
                  const params = new URLSearchParams({ canny_threshold: cannyTh.toString(), min_line_length: minLen.toString(), max_line_gap: maxGap.toString() });
                  fetch(`http://localhost:8000/detect/angle?${params.toString()}`, { method: "POST", body: formData })
                    .then(res => {
                      if (!res.ok) throw new Error('Angle API error');
                      const metaStr = res.headers.get('X-Angle-Result') || '{}';
                      try { stateRef.result = JSON.parse(metaStr); } catch(_) { stateRef.result = {}; }
                      return res.blob();
                    })
                    .then(imgBlob => {
                      if (stateRef.processedImgUrl) URL.revokeObjectURL(stateRef.processedImgUrl);
                      stateRef.processedImgUrl = URL.createObjectURL(imgBlob);
                      stateRef.processedImage.src = stateRef.processedImgUrl;
                    })
                    .catch(err => console.error("Angle API error:", err))
                    .finally(() => { stateRef.isFetching = false; });
                } else { stateRef.isFetching = false; }
              }, 'image/jpeg', 0.85);
            }

            if (stateRef.processedImage && stateRef.processedImage.complete && stateRef.processedImage.naturalWidth > 0) {
              ctx.drawImage(stateRef.processedImage, 0, 0, width, height);
            }

            const angleCount = stateRef.result?.angles?.length ?? 0;
            calculatedVal = angleCount > 0 ? `Angles: ${stateRef.result.angles.map(a => a.angle_deg?.toFixed(1) + '°').join(', ')}` : 'No angles';
            isPassed = angleCount > 0;

            // HUD
            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
            ctx.fillRect(10, 10, 180, 30);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1;
            ctx.strokeRect(10, 10, 180, 30);
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('ANGLE MEASUREMENT', 18, 29);

          } else if (filterType === 'CONTOUR_GEOMETRY') {
            // ── PERIMETER & AREA (Python API) ──
            const ctx = canvas.getContext('2d');
            if (cameraSource === 'IP_CAMERA' || isSimulated) {
              drawSimulatedIPStream(ctx, width, height);
            } else {
              ctx.drawImage(video, 0, 0, width, height);
            }

            const stateRef = contourDetectRef.current;
            const now = Date.now();
            const threshold = comp?.props?.contourThreshold ?? 80;
            const minArea = comp?.props?.contourMinArea ?? 500;
            const mmPx = cameraConfig?.settings?.mmPerPixel || comp?.props?.mmPerPixel || 0.1170;
            const dimUnit = comp?.props?.dimUnit || 'mm';

            if (!stateRef.isFetching && (now - stateRef.lastFetch > 300)) {
              stateRef.isFetching = true;
              stateRef.lastFetch = now;

              getCleanFrameBlob((blob) => {
                if (blob) {
                  const formData = new FormData();
                  formData.append("file", blob, "frame.jpg");
                  const params = new URLSearchParams({ threshold: threshold.toString(), min_area: minArea.toString(), mm_per_pixel: mmPx.toString() });
                  fetch(`http://localhost:8000/detect/contour_geometry?${params.toString()}`, { method: "POST", body: formData })
                    .then(res => {
                      if (!res.ok) throw new Error('Contour API error');
                      const metaStr = res.headers.get('X-Contour-Result') || '{}';
                      try { stateRef.result = JSON.parse(metaStr); } catch(_) { stateRef.result = {}; }
                      return res.blob();
                    })
                    .then(imgBlob => {
                      if (stateRef.processedImgUrl) URL.revokeObjectURL(stateRef.processedImgUrl);
                      stateRef.processedImgUrl = URL.createObjectURL(imgBlob);
                      stateRef.processedImage.src = stateRef.processedImgUrl;
                    })
                    .catch(err => console.error("Contour API error:", err))
                    .finally(() => { stateRef.isFetching = false; });
                } else { stateRef.isFetching = false; }
              }, 'image/jpeg', 0.85);
            }

            if (stateRef.processedImage && stateRef.processedImage.complete && stateRef.processedImage.naturalWidth > 0) {
              ctx.drawImage(stateRef.processedImage, 0, 0, width, height);
            }

            const cCount = stateRef.result?.contours?.length ?? 0;
            calculatedVal = cCount > 0 ? stateRef.result.contours.map(c => `P:${c.perimeter_mm?.toFixed(1)}${dimUnit} A:${c.area_mm2?.toFixed(1)}${dimUnit}²`).join(' | ') : 'No contours';
            isPassed = cCount > 0;

            // HUD
            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
            ctx.fillRect(10, 10, 200, 30);
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 1;
            ctx.strokeRect(10, 10, 200, 30);
            ctx.fillStyle = '#a855f7';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('PERIMETER & AREA MEASUREMENT', 18, 29);
          }
        }

        currentReadoutRef.current = { val: calculatedVal, isPassed: isPassed };
      } catch (err) {
        // Suppress fast loop warnings
      }

      requestRef.current = requestAnimationFrame(processFrame);
    };

    requestRef.current = requestAnimationFrame(processFrame);

    return () => {
      isProcessing = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (prevGrayMatRef.current) {
        try {
          prevGrayMatRef.current.delete();
          prevGrayMatRef.current = null;
        } catch (e) {}
      }
    };
  }, [cameraActive, comp.props.filterType, comp.props.thresholdValue, comp.props.yoloModelType, comp.props.yoloConfidence, comp.props.yoloTargetClass, isRulerModeActive, isCircleModeActive, isAngleModeActive, isContourModeActive, rulerPoints, rulerDragStart, rulerDragCurrent, isSimulated]);

  const isDark = selectedApp?.config?.appThemeMode === 'DARK';
  const textColor = isDark ? '#f8fafc' : '#0f172a';

  return (
    <div style={{ width: '100%', height: comp.h ? '100%' : 'auto', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
          {comp.props.label || 'OpenCV Live Stream'} ({comp.props.filterType || 'CANNY'})
          {(isSimulated || cameraSource === 'IP_CAMERA') && (
            <span style={{ color: '#fbbf24', marginLeft: '6px', fontSize: '0.65rem', fontWeight: 'bold' }}>
              (Simulated Mode)
            </span>
          )}
        </div>
        
        {/* Auto Save Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>Auto Save</span>
          <input 
            type="checkbox" 
            checked={autoSave} 
            onChange={(e) => setAutoSave(e.target.checked)} 
            style={{ cursor: 'pointer', width: '14px', height: '14px' }} 
          />
        </div>
      </div>

      <div style={{ 
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
        borderRadius: '12px', 
        overflow: 'hidden', 
        backgroundColor: isDark ? '#1e293b' : 'white',
        padding: cameraActive && !loadingError ? '0' : '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flex: 1,
        minHeight: comp.h ? '0' : '260px',
        width: '100%',
        height: '100%'
      }}>
        <video 
          ref={videoRef} 
          muted 
          playsInline 
          width="320" 
          height="240" 
          style={{ display: 'none' }} 
        />

        {cameraActive && !loadingError ? (
          <canvas 
            ref={canvasRef} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              backgroundColor: '#000000',
              cursor: isRulerModeActive ? 'crosshair' : 'default'
            }} 
            onMouseDown={isRulerModeActive ? handleRulerMouseDown : undefined}
            onMouseMove={isRulerModeActive ? handleRulerMouseMove : undefined}
            onMouseUp={isRulerModeActive ? handleRulerMouseUp : undefined}
            onTouchStart={isRulerModeActive ? handleRulerTouchStart : undefined}
            onTouchMove={isRulerModeActive ? handleRulerTouchMove : undefined}
            onTouchEnd={isRulerModeActive ? handleRulerTouchEnd : undefined}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
            {loadingError ? (
              <>
                <span style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center', maxWidth: '80%' }}>⚠️ {loadingError}</span>
                <button
                  onClick={() => {
                    setLoadingError('');
                    setIsSimulated(true);
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '8px 16px',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px rgba(124, 58, 237, 0.2)'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#6d28d9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#7c3aed'}
                >
                  Gunakan Kamera Simulasi
                </button>
              </>
            ) : (
              <>
                <Loader2 size={24} className="animate-spin" style={{ color: '#7c3aed' }} />
                <span style={{ fontSize: '0.8rem' }}>
                  {'Mengaktifkan Kamera...'}
                </span>
              </>
            )}
          </div>
        )}

        {/* Control Actions & HUD Panel Overlay */}
        {cameraActive && (
          <div style={{ 
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            flexWrap: 'wrap',
            gap: '8px',
            zIndex: 10,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>Hasil:</span>
            <span style={{ 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              color: uiReadout.isPassed ? '#22c55e' : '#ef4444',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: uiReadout.isPassed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'
            }}>
              {uiReadout.val}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* Ruler Vision Button */}
            {(comp?.props?.filterType === 'DIMENSION' || comp?.props?.filterType === 'RULER_VISION') && (
              <button
                onClick={() => {
                  if (isRulerModeActive) activateMeasurementMode(null);
                  else activateMeasurementMode('RULER_VISION');
                }}
                title="Ruler Measurement"
                style={{
                  width: '32px', height: '32px',
                  padding: '0',
                  border: isRulerModeActive ? '1px solid #714B67' : `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                  backgroundColor: isRulerModeActive ? '#714B67' : (isDark ? '#1e293b' : '#ffffff'),
                  color: isRulerModeActive ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isRulerModeActive ? '0 2px 4px rgba(113, 75, 103, 0.3)' : 'none'
                }}
              >
                <Ruler size={16} />
              </button>
            )}

            {/* Circle Vision Button */}
            {(comp?.props?.filterType === 'CIRCLE_DETECT') && (
              <button
                onClick={() => {
                  if (isCircleModeActive) activateMeasurementMode(null);
                  else activateMeasurementMode('CIRCLE_DETECT');
                }}
                title="Circle Measurement"
                style={{
                  width: '32px', height: '32px',
                  padding: '0',
                  border: isCircleModeActive ? '1px solid #714B67' : `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                  backgroundColor: isCircleModeActive ? '#714B67' : (isDark ? '#1e293b' : '#ffffff'),
                  color: isCircleModeActive ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isCircleModeActive ? '0 2px 4px rgba(113, 75, 103, 0.3)' : 'none'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
              </button>
            )}

            {/* Angle Vision Button */}
            {(comp?.props?.filterType === 'ANGLE_MEASURE') && (
              <button
                onClick={() => {
                  if (isAngleModeActive) activateMeasurementMode(null);
                  else activateMeasurementMode('ANGLE_MEASURE');
                }}
                title="Angle Measurement"
                style={{
                  width: '32px', height: '32px',
                  padding: '0',
                  border: isAngleModeActive ? '1px solid #714B67' : `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                  backgroundColor: isAngleModeActive ? '#714B67' : (isDark ? '#1e293b' : '#ffffff'),
                  color: isAngleModeActive ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isAngleModeActive ? '0 2px 4px rgba(113, 75, 103, 0.3)' : 'none'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 22H2M2 22a20 20 0 0 1 20-20"/></svg>
              </button>
            )}

            {/* Area/Contour Vision Button */}
            {(comp?.props?.filterType === 'CONTOUR_GEOMETRY') && (
              <button
                onClick={() => {
                  if (isContourModeActive) activateMeasurementMode(null);
                  else activateMeasurementMode('CONTOUR_GEOMETRY');
                }}
                title="Area/Contour Measurement"
                style={{
                  width: '32px', height: '32px',
                  padding: '0',
                  border: isContourModeActive ? '1px solid #714B67' : `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                  backgroundColor: isContourModeActive ? '#714B67' : (isDark ? '#1e293b' : '#ffffff'),
                  color: isContourModeActive ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isContourModeActive ? '0 2px 4px rgba(113, 75, 103, 0.3)' : 'none'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
              </button>
            )}

            {isRulerModeActive && rulerPoints && (
              <button
                onClick={() => {
                  setRulerPoints(null);
                  lastSavedRulerPointsRef.current = null;
                  if (rulerDetectRef.current) {
                    rulerDetectRef.current.measurement = '-';
                    if (rulerDetectRef.current.processedImgUrl) {
                      URL.revokeObjectURL(rulerDetectRef.current.processedImgUrl);
                      rulerDetectRef.current.processedImgUrl = null;
                      rulerDetectRef.current.processedImage.src = '';
                    }
                  }
                  const rulerVarName = comp?.props?.rulerVariableName || `${comp.id}_RULER_VAL`;
                  if (setAppVariables) {
                    setAppVariables(prev => {
                      const idx = prev.findIndex(v => v.name === rulerVarName);
                      if (idx >= 0) {
                        const updated = [...prev];
                        updated[idx] = { ...updated[idx], value: '' };
                        return updated;
                      }
                      return prev;
                    });
                  }
                }}
                title="Clear Measurement"
                style={{
                  width: '32px', height: '32px',
                  padding: '0',
                  border: '1px solid #fee2e2',
                  backgroundColor: '#fef2f2',
                  color: '#ef4444',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              onClick={() => saveLogToDb(uiReadout.val, uiReadout.isPassed)}
              disabled={isSaving}
              title="Save Real-time Data"
              style={{
                width: '32px', height: '32px',
                padding: '0',
                backgroundColor: '#714B67',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isSaving ? 0.6 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(113, 75, 103, 0.3)',
                marginLeft: '4px'
              }}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>}
            </button>
          </div>
        </div>
      )}
      </div>

    </div>
  );
};


export default LiveTerminal;
