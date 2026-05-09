import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
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
  AlertCircle,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Loader2,
  Pause,
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
  HardDrive
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import obd2Service from '../utils/obd2Service';
import WebcamComp from 'react-webcam';
import Tesseract from 'tesseract.js';
import { listManualSummaries, getManualById, uploadManualImage } from '../utils/supabaseManualDB';
import { saveLiveMeasurement } from '../utils/supabaseUtilityDB';
import { getAllFrontlineApps, getProductionQueue } from '../utils/supabaseFrontlineDB';
import { getTableRecords, queryTableRecords, getTableById, resolveTableIdReference, addTableRecord } from '../utils/supabaseTablesDB';
import { saveCompletion } from '../utils/supabaseCompletionsDB';
import { getMachines, getStations } from '../utils/database';
import { useLanguage } from '../contexts/LanguageContext';
import iotConnector from '../utils/iotConnector';
import webhookUtility from '../utils/webhookUtility';
import WorkOrderManager from './WorkOrderManager';
import { logEvent, AUDIT_EVENTS } from '../utils/auditLog';
import { calculateOEE } from '../utils/oeeEngine';
import FrontlineCopilot from './FrontlineCopilot';
import ChatWidget from './ChatWidget';
import UnifiedScanner from './UnifiedScanner';
import MobileBottomNav from './MobileBottomNav';
import { listGlobalVariables, upsertGlobalVariable, subscribeToGlobalVariables } from '../utils/supabaseGlobalVars';
import { validateVariable } from '../utils/validationEngine';
import { getCurrentUser } from '../utils/auth';

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

const StepValidationPanel = React.memo(function StepValidationPanel({ showValidationPanel, setShowValidationPanel, requiredDone, requiredStepChecks }) {
  return (
    <div>
      <button
        onClick={() => setShowValidationPanel(prev => !prev)}
        style={{ width: '100%', marginBottom: '8px', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc', color: '#334155', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
      >
        {showValidationPanel ? 'Hide' : 'Show'} Step Validation ({requiredDone}/{requiredStepChecks.length})
      </button>

      {showValidationPanel && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '10px 12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Step Validation
            </div>
            <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#0f172a', fontWeight: 700 }}>
              {requiredDone}/{requiredStepChecks.length} required complete
            </div>
          </div>
          <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '8px 10px' }}>
            {requiredStepChecks.map((item) => (
              <div key={item.compId} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 2px', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ marginTop: '1px' }}>
                  {item.ok ? <CheckCircle2 size={14} color="#16a34a" /> : <AlertCircle size={14} color="#dc2626" />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', color: item.ok ? '#166534' : '#991b1b', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </div>
                  {!item.ok && (
                    <div style={{ fontSize: '0.68rem', color: '#b91c1c' }}>{item.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const LiveTerminal = () => {
  const [showChat, setShowChat] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeMobileTab, setActiveMobileTab] = useState('apps');
  const [showGlobalScanner, setShowGlobalScanner] = useState(false);

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
  const launchParams = new URLSearchParams(location.search || '');
  const launchOperator = (launchParams.get('operator') || '').trim();
  const launchStation = (launchParams.get('station') || '').trim();

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

  const [appVariables, setAppVariables] = useState([]);

  // --- DERIVED STATE ---
  const steps = selectedApp ? (selectedApp.config?.steps || []) : (selectedManual?.content?.steps || []);
  const activeStep = steps[currentStepIndex];
  const appComponents = activeStep?.components || [];

  // --- OBD2 INTEGRATION ---
  useEffect(() => {
    const unsubStatus = obd2Service.subscribeStatus(s => setObd2Status(s));
    const unsubData = obd2Service.onPIDData('*', (data) => {
      if (data && data.pid) {
        setObd2Values(prev => ({
          ...prev,
          [data.pid.toUpperCase()]: data
        }));
      }
    });
    return () => {
      unsubStatus();
      unsubData();
      obd2Service.stopAllStreams();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (!active || !selectedApp || obd2Status !== 'connected') {
        if (active) setTimeout(poll, 1000);
        return;
      }

      const obd2Comps = appComponents.filter(c => c.type.startsWith('OBD2_'));
      if (obd2Comps.length > 0) {
        // Poll sequentially to prevent hardware collisions
        for (const comp of obd2Comps) {
          if (!active) break;
          const pid = comp.props.pid || OBD2_DEFAULT_PIDS[comp.type];
          if (pid) {
            try {
              await obd2Service.queryPID(pid);
              // Tiny delay between sensors for stability
              await new Promise(r => setTimeout(r, 150));
            } catch (err) {
              console.warn('OBD2 Poll Error:', err);
            }
          }
        }
      }
      if (active) setTimeout(poll, 1000);
    };

    poll();
    return () => {
      active = false;
    };
  }, [selectedApp, currentStepIndex, obd2Status, appComponents]);


  const syncVariableForComp = (comp, value) => {
    if (!comp) return;
    const varName = comp.props?.targetVariable || (comp.props?.dataSourceType === 'VARIABLE' ? comp.props?.varSource : null);
    if (varName) {
      setAppVariables(prev => prev.map(v => v.name === varName ? { ...v, value } : v));
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      setUploadValues(prev => ({
        ...prev,
        [comp.id]: {
          name: file.name,
          type: file.type,
          url: e.target.result,
          size: file.size
        }
      }));
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
      const now = Date.now();
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
    if (selectedApp) {
      const currentStep = selectedApp.config.steps[currentStepIndex];
      const deviceTriggers = (selectedApp.config.appTriggers || [])
        .concat(currentStep?.triggers || [])
        .filter(t => t.event === 'ON_DEVICE_INPUT' && t.deviceId === 'STATION_BARCODE' && t.deviceEvent === 'BARCODE_SCANNED');

      if (deviceTriggers.length > 0) {
        for (const trig of deviceTriggers) {
          await executeTrigger(trig);
        }
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [manualData, appData, queueData] = await Promise.all([
          listManualSummaries(),
          getAllFrontlineApps(),
          getProductionQueue()
        ]);

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

        setFrontlineApps(appId ? combinedApps : visibleApps);

        // Auto-load match with Smart Matching
        if (appId && combinedApps.length > 0) {
          let match = combinedApps.find(a => String(a.id) === String(appId));
          if (!match) {
            // Try Name fallback if ID didn't work
            const searchName = String(appId).toLowerCase();
            match = combinedApps.find(a => String(a.name || '').toLowerCase() === searchName);
          }

          if (match) {
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
  }, [appId]);





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

    // Enterprise Governance: Use published_config if published, else draft config
    const effectiveConfig = app.is_published ? (app.published_config || app.config) : app.config;
    const normalizedApp = { ...app, config: effectiveConfig };

    setSelectedApp(normalizedApp);
    setSelectedManual(null);
    setStatus('RUNNING');
    setTimer(0);
    setCurrentStepIndex(0);
    setCycleData([]);
    setQuantityLog({});
    setChecklistState({});
    setToggleState({});
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

    // Fire ON_APP_START triggers (Tulip-style)
    if (app.config?.appTriggers) {
      const startTriggers = app.config.appTriggers.filter(t => t.event === 'ON_APP_START');
      for (const trig of startTriggers) {
        await executeTrigger(trig);
      }
    }

    // Fire ON_STEP_ENTER for the first step
    const firstStep = appSteps[0];
    if (firstStep?.triggers) {
      const enterTriggers = firstStep.triggers.filter(t => t.event === 'ON_STEP_ENTER');
      for (const trig of enterTriggers) {
        await executeTrigger(trig);
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

  const resolveSourceValue = async (source, value, defaultVal = '') => {
    if (!source || source === 'STATIC') return value;
    if (source === 'VARIABLE') {
      if (!value) return defaultVal;
      if (value.startsWith('APP_INFO.')) {
        if (value === 'APP_INFO.USER') return appContext.user;
        if (value === 'APP_INFO.STATION') return appContext.station;
        if (value === 'APP_INFO.STEP_NAME') return (selectedApp?.config?.steps || [])[currentStepIndex]?.title || '';
        if (value === 'APP_INFO.APP_NAME') return selectedApp?.name || '';
      }
      const v = appVariables.find(av => av.name === value);
      return v ? v.value : defaultVal;
    }
    if (source === 'APP_INFO') {
      if (value === 'APP_INFO.USER') return appContext.user;
      if (value === 'APP_INFO.STATION') return appContext.station;
      if (value === 'APP_INFO.STEP_NAME') return (selectedApp?.config?.steps || [])[currentStepIndex]?.title || '';
      if (value === 'APP_INFO.APP_NAME') return selectedApp?.name || '';
      return defaultVal;
    }
    if (source === 'RECORD_FIELD') {
      const parts = value.split('.');
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
      const [tableId, aggId] = value.split(':');
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
    if (source === 'EXPRESSION') return evaluateExpression(value);
    return value || defaultVal;
  };

  const evaluateCondition = async (cond) => {
    if (!cond) return true;

    // Support new multi-source structure
    const leftSource = cond.leftSource || 'VARIABLE';
    const leftValue = cond.leftValue || cond.variable;
    const rightSource = cond.rightSource || 'STATIC';
    const rightValue = cond.rightValue || cond.value;
    const operator = cond.operator || '==';

    const actualValue = await resolveSourceValue(leftSource, leftValue);
    const targetValue = await resolveSourceValue(rightSource, rightValue);

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

  const evaluateExpression = (expr, customContext = {}) => {
    if (!expr || typeof expr !== 'string') return expr;
    let processed = expr;

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
            return typeof val === 'string' ? `"${val}"` : val;
          }
        }
        return 'undefined';
      }
      const v = appVariables.find(av => av.name === name);
      if (v) {
        return typeof v.value === 'string' ? `"${v.value}"` : v.value;
      }
      return match;
    });

    // 2. Handle Functions (Recursive Replacement for Nesting)
    try {
      const fnProcessed = processed
        // Math Functions
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
            return data ? data[fName] : '';
          }
        }
      }
      const v = appVariables.find(av => av.name === varName);
      return v ? v.value : val;
    }
    return val;
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
    if (!app || !app.config?.steps) return;
    const currentStep = app.config.steps[currentStepIndex];
    if (!currentStep) return;

    const chartTypes = ['CHART', 'PARETO_CHART', 'CONTROL_CHART', 'DASHBOARD_PARETO', 'DASHBOARD_CHART_BAR', 'DASHBOARD_CHART_LINE', 'DASHBOARD_METRIC'];
    const chartComps = currentStep.components.filter(c => chartTypes.includes(c.type));
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
    if (!app || !app.config?.steps) return;
    const currentStep = app.config.steps[currentStepIndex];
    if (!currentStep) return;

    const boundComps = currentStep.components.filter(c => c.props?.dataSourceType === 'TABLE_RECORD');
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
    if (!app || !app.config?.steps) return;
    const currentStep = app.config.steps[currentStepIndex];
    if (!currentStep) return;

    const tableComps = currentStep.components.filter(c => c.type === 'INTERACTIVE_TABLE' || c.type === 'ADVANCED_TABLE');
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
      } catch (err) {
        console.error(`Failed to fetch table data for ${comp.id}:`, err);
      }
    }
    setTableData(prev => ({ ...prev, ...results }));
    setAdvancedTableData(prev => ({ ...prev, ...results }));
  }, [currentStepIndex, getTableRecords, queryTableRecords]);

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
  const executeTrigger = async (trigger) => {
    if (!trigger || trigger.enabled === false) return;

    // Helper to run actions (using existing logic)
    const runActions = async (actions) => {
      if (!actions) return;
      for (const action of actions) {
        try {
          if (action.type === 'SET_VARIABLE') {
          const { varPath, value, valueType } = action.payload;
          const resolvedValue = await resolveSourceValue(valueType || 'STATIC', value);
          if (varPath === 'APP_INFO.USER') setAppContext(prev => ({ ...prev, user: resolvedValue }));
          else if (varPath === 'APP_INFO.STATION') setAppContext(prev => ({ ...prev, station: resolvedValue }));
          else {
            const vDef = appVariables.find(v => v.name === varPath);
            setAppVariables(prev => prev.map(v => v.name === varPath ? { ...v, value: resolvedValue } : v));
            if (vDef?.isPersistent) {
              const { upsertGlobalVariable } = await import('../utils/supabaseGlobalVars');
              await upsertGlobalVariable(varPath, vDef.type || 'TEXT', resolvedValue);
            }
          }
        } else if (action.type === 'PLAY_SOUND') {
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
        } else if (action.type === 'GO_TO_STEP') {
          const targetIndex = (selectedApp?.config?.steps || []).findIndex(s => s.id === (action.payload.stepId || action.payload.targetId));
          if (targetIndex !== -1) setCurrentStepIndex(targetIndex);
        } else if (action.type === 'NEXT_STEP') {
          handleNextStep();
        } else if (action.type === 'PREV_STEP') {
          setCurrentStepIndex(prev => Math.max(0, prev - 1));
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
            resolvedData[col] = await resolveSourceValue(mType, mValue);
          }

          if (action.type === 'CREATE_RECORD') {
            const { addTableRecord, resolveTableIdReference } = await import('../utils/supabaseTablesDB');
            const resolvedTableId = await resolveTableIdReference(tableId);
            if (!resolvedData.recordId && !resolvedData.id) {
              resolvedData.recordId = `QC_${Date.now()}`;
            }
            await addTableRecord(resolvedTableId, resolvedData);
          } else {
            const recordId = await resolveSourceValue('STATIC', rawRecordId);
            const { updateTableRecord, resolveTableIdReference, getTableRecords } = await import('../utils/supabaseTablesDB');
            const resolvedTableId = await resolveTableIdReference(tableId);
            
            // For Supabase, we need the internal row ID.
            const records = await getTableRecords(resolvedTableId);
            const target = records.find(r => String(r.recordId).toLowerCase() === String(recordId).toLowerCase());
            
            if (target) {
              await updateTableRecord(target.id, resolvedData);
            } else {
              throw new Error(`Record "${recordId}" not found in table "${tableId}"`);
            }
          }
        } else if (['TABLE_RECORD_LOAD', 'TABLE_RECORD_CREATE', 'TABLE_RECORD_CREATE_OR_LOAD'].includes(action.type)) {
          const { placeholderId, idType = 'STATIC', idValue = '' } = action.payload || {};
          const placeholder = recordPlaceholders.find(rp => rp.id === placeholderId);
          if (!placeholder?.tableId) continue;
          const resolvedId = await resolveSourceValue(idType, idValue);

          const loadById = async () => {
            const { getTableRecords } = await import('../utils/supabaseTablesDB');
            const rows = await getTableRecords(placeholder.tableId);
            const found = (rows || []).find(r => String(r.id) === String(resolvedId));
            if (found) {
              setRecordPlaceholderData(prev => ({ ...prev, [placeholderId]: found }));
              return true;
            }
            return false;
          };

          const createById = async () => {
            const { addTableRecord } = await import('../utils/supabaseTablesDB');
            const created = await addTableRecord(placeholder.tableId, { id: resolvedId });
            setRecordPlaceholderData(prev => ({ ...prev, [placeholderId]: created || { id: resolvedId } }));
            return true;
          };

          if (action.type === 'TABLE_RECORD_LOAD') {
            await loadById();
          } else if (action.type === 'TABLE_RECORD_CREATE') {
            await createById();
          } else {
            const ok = await loadById();
            if (!ok) await createById();
          }
        } else if (action.type === 'CLEAR_RECORD_PLACEHOLDER') {
          const { placeholderId } = action.payload || {};
          if (!placeholderId) continue;
          setRecordPlaceholderData(prev => ({ ...prev, [placeholderId]: null }));
        } else if (action.type === 'CALL_FUNCTION') {
          const { functionId, parameters } = action.payload;
          const fn = appFunctions.find(f => f.id === functionId);
          if (!fn) continue;

          const resolvedParams = {};
          for (const [name, paramObj] of Object.entries(parameters || {})) {
            resolvedParams[name] = await resolveSourceValue(paramObj.type, paramObj.value);
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
            resolvedParams[name] = await resolveSourceValue(paramObj.type, paramObj.value);
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
        } else if (action.type === 'LINK_RECORD' || action.type === 'UNLINK_RECORD') {
          const {
            sourceTableId,
            sourceRecordId: rawSourceId,
            sourceFieldName,
            targetTableId,
            targetRecordId: rawTargetId,
            targetFieldName
          } = action.payload;

          const sourceRecordId = await resolveSourceValue(action.payload.sourceRecordIdType || 'STATIC', rawSourceId);
          const targetRecordId = await resolveSourceValue(action.payload.targetRecordIdType || 'STATIC', rawTargetId);

          if (!sourceRecordId || !targetRecordId) {
            console.warn(`[LinkedRecords] Missing record IDs for ${action.type}:`, { sourceRecordId, targetRecordId });
            continue;
          }

          const { linkRecords, unlinkRecords } = await import('../utils/supabaseTablesDB');
          try {
            if (action.type === 'LINK_RECORD') {
              await linkRecords(sourceTableId, sourceRecordId, sourceFieldName, targetTableId, targetRecordId, targetFieldName);
              console.log(`[LinkedRecords] Linked ${sourceRecordId} to ${targetRecordId}`);
            } else {
              await unlinkRecords(sourceTableId, sourceRecordId, sourceFieldName, targetTableId, targetRecordId, targetFieldName);
              console.log(`[LinkedRecords] Unlinked ${sourceRecordId} from ${targetRecordId}`);
            }
            // Refresh tables to show new relationships
            fetchTableData(selectedApp);
          } catch (err) {
            console.error(`[LinkedRecords] Failed to ${action.type}:`, err);
          }
        }
        } catch (err) {
          console.error(`Action execution failed (${action.type}):`, err);
          toast.error(`Action Failed: ${err.message || 'Unknown error'}`);
        }
      } // End actions loop
    };

    // Support for NEW multi-clause structure
    const clauses = trigger.clauses || [
      {
        match: trigger.conditionMatch || 'ALL',
        conditions: trigger.conditions || [],
        actions: trigger.actions || []
      }
    ];

    let clauseMatched = false;
    for (const clause of clauses) {
      let passed = true;
      if (clause.conditions && clause.conditions.length > 0) {
        const matchType = clause.match || 'ALL';
        const results = await Promise.all(clause.conditions.map(evaluateCondition));
        passed = matchType === 'ANY' ? results.some(r => r) : results.every(r => r);
      }
      if (passed) {
        clauseMatched = true;
        await runActions(clause.actions);
        break;
      }
    }

    if (!clauseMatched && trigger.elseActions?.length) {
      await runActions(trigger.elseActions);
    }
  };

  // Helper: fire triggers for any widget event (Tulip-style)
  const fireWidgetTriggers = async (comp, eventId) => {
    if (!comp || !comp.props?.triggers) return;
    const trigList = comp.props.triggers.filter(t => t.event === eventId || (!t.event && (['BUTTON', 'COMPLETE_BUTTON'].includes(comp.type) ? eventId === 'ON_CLICK' : eventId === 'ON_CHANGE')));
    for (const trig of trigList) {
      // Log trigger execution for App Player Dev Mode
      window.parent.postMessage({
        type: 'TRIGGER_FIRED',
        triggerName: trig.name || 'Unnamed Trigger',
        eventId: eventId,
        source: comp.props?.label || comp.type,
        timestamp: new Date().toISOString()
      }, '*');
      await executeTrigger(trig);
    }
  };

  // Helper: fire step-level triggers
  const fireStepTriggers = async (step, eventId) => {
    if (!step || !step.triggers) return;
    const trigList = step.triggers.filter(t => t.event === eventId);
    for (const trig of trigList) {
      window.parent.postMessage({
        type: 'TRIGGER_FIRED',
        triggerName: trig.name || 'Unnamed Trigger',
        eventId: eventId,
        source: step.title || 'Step',
        timestamp: new Date().toISOString()
      }, '*');
      await executeTrigger(trig);
    }
  };

  const getRequiredCheckForComponent = (comp) => {
    const label = comp.props?.label || comp.type || 'Field';
    const fail = (msg = `${label} is required`) => ({ required: true, ok: false, label, error: msg });
    const pass = () => ({ required: true, ok: true, label, error: '' });

    // 1. Resolve current value based on component type
    let currentValue = null;
    switch (comp.type) {
      case 'BARCODE': currentValue = barcodeValues[comp.id]; break;
      case 'CAMERA_SCANNER': currentValue = cameraScannerValues[comp.id]; break;
      case 'CAMERA_CAPTURE': currentValue = cameraValues[comp.id]; break;
      case 'FILE_UPLOAD': currentValue = uploadValues[comp.id]?.url || uploadValues[comp.id]?.name; break;
      case 'TEXT_INPUT': currentValue = textInputValues[comp.id] ?? comp.props.defaultValue; break;
      case 'TEXT_AREA': currentValue = textAreaValues[comp.id] ?? comp.props.defaultValue; break;
      case 'DROPDOWN': currentValue = dropdownValues[comp.id] ?? comp.props.defaultValue; break;
      case 'RADIO_GROUP': currentValue = radioValues[comp.id] ?? comp.props.defaultValue; break;
      case 'MULTI_SELECT': currentValue = multiSelectValues[comp.id] || comp.props.defaultValues; break;
      case 'NUMBER_INPUT': currentValue = numberInputValues[comp.id] ?? comp.props.defaultValue; break;
      case 'DATE_PICKER': currentValue = dateValues[comp.id]; break;
      case 'DATETIME_PICKER': currentValue = dateTimeValues[comp.id]; break;
      case 'DRAW_CANVAS': currentValue = drawValues[comp.id]; break;
      case 'SIGNATURE': currentValue = signatureWidgetValues[comp.id]; break;
      case 'QUALITY_PASS_FAIL': currentValue = qualityResult[comp.id]; break;
      case 'QUALITY_TOLERANCE': currentValue = toleranceValues[comp.id]; break;
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
        video_name: `LIVE_${selectedApp ? selectedApp.name : selectedManual.title}_${new Date().getTime()}`,
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
      alert('Cycle completed, but failed to save to database.');
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
    // Execute custom triggers if any (Tulip-style)
    await fireWidgetTriggers(comp, 'ON_CLICK');

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
          const targetIndex = steps.findIndex(s => s.id === props.targetStepId);
          if (targetIndex !== -1) {
            await fireStepTriggers(goToSteps[currentStepIndex], 'ON_STEP_EXIT');
            setCurrentStepIndex(targetIndex);
            await fireStepTriggers(goToSteps[targetIndex], 'ON_STEP_ENTER');
          }
        }
        break;
      }
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
            onClick={() => window.location.href = '/terminal'}
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

    // Filter apps based on assigned station
    const baseFilteredApps = frontlineApps.filter(app => {
      if (!currentStationObj || !currentStationObj.assignedApps) return true; // fallback
      return currentStationObj.assignedApps.includes(app.id);
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
                {filteredApps.map(app => (
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
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOnline ? '#22c55e' : '#ef4444', boxShadow: `0 0 8px ${isOnline ? '#22c55e' : '#ef4444'}` }} />
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
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

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
                <p style={{ margin: 0, color: '#64748b' }}>There are no applications assigned to <b>Station {appContext.station}</b>.</p>
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

  const hasProductionOrderWidget = appComponents.some(c => c.type === 'PRODUCTION_ORDER') || (selectedApp?.config?.leftSidebarEnabled === false);
  const hasProductionProgressWidget = appComponents.some(c => c.type === 'PRODUCTION_PROGRESS') || (selectedApp?.config?.rightSidebarEnabled === false);
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
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: '20px',
          backgroundColor: activeStep?.backgroundColor || selectedApp?.config?.appBackgroundColor || (selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f8fafc')
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 10px 0', color: selectedApp?.config?.appThemeMode === 'DARK' ? 'white' : '#0f172a' }}>{activeStep?.title}</h2>

          {appComponents.filter(c => !c.step_id || c.step_id === activeStep?.id).map((comp) => (
            <div key={comp.id} style={{ width: '100%' }}>
              {/* This will use the existing component switch logic, just in a mobile-optimized container */}
              {renderComponent(comp)}
            </div>
          ))}

          {/* Padding for bottom buttons */}
          <div style={{ height: '80px' }} />
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
            onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 20px',
        height: '64px',
        backgroundColor: activeAndon ? '#dc2626' : '#001e3c',
        color: 'white',
        transition: 'background-color 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} fill="white" /> MAVI-M
          </div>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedApp ? selectedApp.name : selectedManual.title}
            {selectedApp && !selectedApp.is_published && (
              <span style={{
                fontSize: '0.65rem',
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 900,
                letterSpacing: '0.5px'
              }}>DRAFT</span>
            )}
            {selectedApp && selectedApp.is_published && (
              <span style={{
                fontSize: '0.65rem',
                backgroundColor: '#22c55e',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 900,
                letterSpacing: '0.5px'
              }}>V{selectedApp.version}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {/* Connectivity Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '20px',
            backgroundColor: isOnline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: 'white',
            fontSize: '0.7rem', fontWeight: 800,
            border: `1px solid ${isOnline ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
          }}>
            <Wifi size={12} /> {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
          </div>
          {activeAndon ? (
            <button
              onClick={handleResolveAndon}
              style={{ padding: '8px 20px', backgroundColor: 'white', color: '#ef4444', border: 'none', borderRadius: '4px', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            >
              <CheckCircle2 size={18} /> RESOLVE ANDON
            </button>
          ) : (
            [
              {
                icon: <MessageSquare size={20} />,
                label: 'Chat',
                onClick: () => setShowChat(!showChat)
              },
              {
                icon: <HelpCircle size={20} />,
                label: 'Help',
                onClick: () => alert('Help documentation not yet configured for this workstation.')
              },
              {
                icon: <AlertCircle size={20} />,
                label: 'Andon',
                onClick: () => setShowAndonModal(true)
              }
            ].map(item => (
              <div
                key={item.label}
                onClick={item.onClick}
                title={item.label}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s' }}
              >
                {item.icon}
                <span style={{ fontSize: '0.65rem' }}>{item.label}</span>
              </div>
            ))
          )}
          <div style={{ width: '1px', height: '32px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#00d1ff' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Operator</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{appContext.user} • {appContext.station}</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>



        {/* CENTER PANEL: INSTRUCTIONS */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f8fafc',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: activeStep?.backgroundColor || selectedApp?.config?.appBackgroundColor || (selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : 'white'),
            backgroundImage: activeStep?.backgroundImage ? `url(${activeStep.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`,
            borderRadius: '4px',
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


            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#f1f5f9'}` }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 500, color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a' }}>Step {currentStepIndex + 1}: {activeStep?.title}</h2>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Step Time</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {formatTime(timer)} <Clock size={20} />
                </div>
              </div>
            </div>

            <div id="terminal-canvas-wrapper" style={{
              flex: 1,
              padding: '0',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'auto',
              backgroundColor: activeStep?.backgroundColor || selectedApp?.config?.appBackgroundColor || 'transparent'
            }}>
              {/* App Components Render */}
              <div id="terminal-canvas-content" style={{
                width: '100%',
                minHeight: '100%',
                position: 'relative',
                flex: 1
              }}>
                {/* App Components Render */}
                <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10000 }}>
                  {devMode && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={runStressTest}
                        title="Stress Test (Queue 500 items)"
                        style={{ padding: '7px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Database size={14} /> <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>STRESS TEST</span>
                      </button>
                      <button
                        onClick={clearSyncQueue}
                        title="Clear Sync Queue"
                        style={{ padding: '7px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Layers size={14} /> <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>CLEAR QUEUE</span>
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setDevMode(!devMode)}
                    style={{ marginTop: '10px', padding: '6px 12px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    {devMode ? 'Hide Dev Tools' : 'Show Dev Tools'}
                  </button>
                </div>
                {appComponents.length > 0 ? (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    minHeight: '800px' // Ensure a minimum height for the canvas
                  }}>
                    {/* Debug Overlay */}
                    {!selectedApp?.is_published && (
                      <div style={{ position: 'absolute', top: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', zIndex: 10000, pointerEvents: 'none' }}>
                        DEBUG: {appComponents.length} comps found | {appComponents.filter(c => visibilityMap[c.id] !== false).length} visible
                      </div>
                    )}
                    {appComponents.filter(c => visibilityMap[c.id] !== false).map((comp, idx) => {
                      const isAbsolute = comp.x !== undefined && comp.y !== undefined;

                      const renderWidget = () => {
                        // 1. Base Props
                        let resolvedProps = { ...comp.props };

                        // 2. Resolve Data Bindings (@Variable, @Record.Field)
                        const propsToResolve = ['text', 'label', 'defaultValue', 'value', 'placeholder', 'src', 'title', 'url', 'varSource', 'targetVariable'];
                        propsToResolve.forEach(p => {
                          if (typeof resolvedProps[p] === 'string' && resolvedProps[p].startsWith('@')) {
                            resolvedProps[p] = resolveValue(resolvedProps[p]);
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

                        const syncVariable = (value) => {
                          const varName = comp.props?.targetVariable || (comp.props?.dataSourceType === 'VARIABLE' ? comp.props?.varSource : null);
                          if (varName) {
                            setAppVariables(prev => prev.map(v => v.name === varName ? { ...v, value } : v));
                          }
                        };

                        switch (comp.type) {
                          case 'TEXT': return <div style={{ fontSize: (resolvedProps.fontSize || 16) + 'px', color: resolvedProps.color || '#0f172a', fontWeight: resolvedProps.fontWeight, fontStyle: resolvedProps.fontStyle, textDecoration: resolvedProps.textDecoration, textAlign: resolvedProps.textAlign }}>{resolvedProps.text}</div>;
                          case 'TIMER': return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                              <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', color: comp.props.color || '#2e7d32' }}>{formatTime(timer)}</div>
                              <div style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 600 }}>{comp.props.label}</div>
                            </div>
                          );
                          case 'BARCODE': return (
                            <div>
                              <div style={{ fontSize: '0.75rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '8px' }}>SCAN / TYPE BARCODE</div>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <Barcode size={24} color="#3b82f6" />
                                <input
                                  autoFocus={comp.props.autoFocus}
                                  value={barcodeValues[comp.id] || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setBarcodeValues(prev => ({ ...prev, [comp.id]: val }));
                                    syncVariable(val);
                                    fireWidgetTriggers(comp, 'ON_CHANGE');
                                  }}
                                  placeholder={comp.props.placeholder}
                                  style={{
                                    flex: 1, padding: '12px',
                                    border: `2px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`,
                                    borderRadius: '4px', fontSize: '1rem', outline: 'none',
                                    backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : 'white',
                                    color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a'
                                  }}
                                />
                              </div>
                              {barcodeValues[comp.id] && <div style={{ marginTop: '8px', padding: '6px 10px', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4', borderRadius: '4px', color: '#22c55e', fontSize: '0.8rem', fontWeight: 600 }}>{String.fromCharCode(10003)} Scanned: {barcodeValues[comp.id]}</div>}
                            </div>
                          );
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
                                <div style={{ border: `2px dashed ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#cbd5e1'}`, borderRadius: '12px', padding: '24px', textAlign: 'center', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f8fafc', position: 'relative' }}>
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
                                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#334155' }}>{file.name}</div>
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
                          case 'TEXT_INPUT': return (
                            <div>
                              <div style={{ fontSize: '0.75rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '8px' }}>{resolvedProps.label}{comp.props.required ? ' *' : ''}</div>
                              <input
                                type="text"
                                value={textInputValues[comp.id] != null ? textInputValues[comp.id] : (resolvedProps.defaultValue || '')}
                                onChange={async e => {
                                  const val = comp.props.mask ? applyInputMask(e.target.value, comp.props.mask) : e.target.value;
                                  setTextInputValues(prev => ({ ...prev, [comp.id]: val }));
                                  syncVariable(val);
                                  fireWidgetTriggers(comp, 'ON_CHANGE');
                                }}
                                placeholder={resolvedProps.placeholder || 'Type here...'}
                                style={{
                                  width: '100%', padding: '12px',
                                  border: `2px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`,
                                  borderRadius: '6px', fontSize: '1rem', outline: 'none',
                                  backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : 'white',
                                  color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a'
                                }}
                              />
                            </div>
                          );
                          case 'TEXT_AREA': return (
                            <div>
                              <div style={{ fontSize: '0.75rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '8px' }}>{comp.props.label}{comp.props.required ? ' *' : ''}</div>
                              <textarea
                                value={textAreaValues[comp.id] != null ? textAreaValues[comp.id] : (comp.props.defaultValue || '')}
                                onChange={e => {
                                  const val = e.target.value;
                                  setTextAreaValues(prev => ({ ...prev, [comp.id]: val }));
                                  syncVariable(val);
                                  fireWidgetTriggers(comp, 'ON_CHANGE');
                                }}
                                placeholder={comp.props.placeholder || 'Type notes...'}
                                rows={comp.props.rows || 4}
                                style={{
                                  width: '100%', padding: '12px',
                                  border: `2px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`,
                                  borderRadius: '6px', fontSize: '1rem', outline: 'none', resize: 'vertical',
                                  backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : 'white',
                                  color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a'
                                }}
                              />
                            </div>
                          );
                          case 'DROPDOWN': return (
                            <div>
                              <div style={{ fontSize: '0.75rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '8px' }}>{resolvedProps.label}{comp.props.required ? ' *' : ''}</div>
                              <select
                                value={dropdownValues[comp.id] != null ? dropdownValues[comp.id] : (resolvedProps.defaultValue || '')}
                                onChange={e => {
                                  const val = e.target.value;
                                  setDropdownValues(prev => ({ ...prev, [comp.id]: val }));
                                  syncVariable(val);
                                  fireWidgetTriggers(comp, 'ON_CHANGE');
                                }}
                                style={{
                                  width: '100%', padding: '12px',
                                  border: `2px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`,
                                  borderRadius: '6px', fontSize: '1rem', outline: 'none',
                                  backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : 'white',
                                  color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a'
                                }}
                              >
                                <option value="" style={{ backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : 'white' }}>Select...</option>
                                {(comp.props.options || []).map((opt, i) => (
                                  <option key={i} value={opt} style={{ backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : 'white' }}>{opt}</option>
                                ))}
                              </select>
                            </div>
                          );
                          case 'RADIO_GROUP': {
                            const selectedVal = radioValues[comp.id] != null ? radioValues[comp.id] : (comp.props.defaultValue || '');
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
                            const isDark = selectedApp?.config?.appThemeMode === 'DARK';
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
                              <div style={{ padding: '10px 15px', borderBottom: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600, fontSize: '0.9rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a' }}><Video size={18} color="#3b82f6" />{comp.props.title}</div>
                              {comp.props.url ? <video controls src={comp.props.url} style={{ width: '100%', maxHeight: '300px' }} /> : <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No video URL configured</div>}
                            </div>
                          );
                          case 'PDF': return (
                            <div style={{ backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f8fafc', border: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', overflow: 'hidden' }}>
                              <div style={{ padding: '10px 15px', borderBottom: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}`, display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600, fontSize: '0.9rem', color: selectedApp?.config?.appThemeMode === 'DARK' ? '#f8fafc' : '#0f172a' }}><FileText size={18} color="#ef4444" />{comp.props.title}</div>
                              {comp.props.url ? <iframe src={comp.props.url} style={{ width: '100%', height: '300px', border: 'none' }} title={comp.props.title} /> : <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No PDF URL configured</div>}
                            </div>
                          );
                          case 'BUTTON': return (<button onClick={() => handleButtonAction(comp.props, comp)} style={{ padding: '14px 28px', backgroundColor: comp.props.backgroundColor || '#007bff', color: comp.props.color || '#fff', border: 'none', borderRadius: '6px', fontSize: (comp.props.fontSize || 14) + 'px', fontWeight: comp.props.fontWeight || 700, cursor: 'pointer', width: '100%', textAlign: comp.props.textAlign || 'center' }}>{resolvedProps.label}</button>);
                          case 'COMPLETE_BUTTON': return (<button onClick={() => handleButtonAction({ action: 'COMPLETE' }, comp)} style={{ padding: '16px', backgroundColor: comp.props.backgroundColor || '#10b981', color: comp.props.color || '#fff', border: 'none', borderRadius: '6px', fontSize: (comp.props.fontSize || 18) + 'px', fontWeight: 900, cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><CheckCircle2 size={22} />{resolvedProps.label || 'COMPLETE'}</button>);
                          case 'QUANTITY_LOGGER': {
                            const lg = quantityLog[comp.id] || { completed: 0, target: comp.props.targetQty || 100 };
                            const pct = Math.min(100, Math.round((lg.completed / lg.target) * 100));
                            const isDark = selectedApp?.config?.appThemeMode === 'DARK';
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
                                <div style={{ width: '100%', height: '60px', display: 'flex', alignItems: 'center' }}>
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
                                <svg viewBox={viewBox} width="100%" height="60" preserveAspectRatio="none">
                                  <path d={pathByDirection[arrowDirection] || pathByDirection.right} fill={shapeColor} />
                                </svg>
                              );
                            }

                            return <div style={{ width: '100%', height: '60px', backgroundColor: shapeColor, borderRadius: shapeType === 'circle' ? '999px' : (comp.props.borderRadius || 0) + 'px' }} />;
                          }
                          case 'IMAGE': return comp.props.src ? <img src={comp.props.src} alt={comp.props.alt || 'Image'} style={{ maxWidth: '100%', borderRadius: '4px', display: 'block' }} /> : <div style={{ padding: '30px', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#0f172a' : '#f8fafc', border: `1px dashed ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#cbd5e1'}`, borderRadius: '6px', textAlign: 'center', color: '#94a3b8' }}><ImageIcon size={32} /><div style={{ fontSize: '0.8rem', marginTop: '6px' }}>No image URL</div></div>;
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
                                  {vv}
                                </div>
                              </div>
                            );
                          }
                          case 'NUMBER_INPUT': return (
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>{resolvedProps.label}</div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button onClick={() => {
                                  const newVal = Math.max(comp.props.min != null ? comp.props.min : 0, (numberInputValues[comp.id] != null ? numberInputValues[comp.id] : resolvedProps.defaultValue || 0) - 1);
                                  setNumberInputValues(prev => ({ ...prev, [comp.id]: newVal }));
                                  syncVariable(newVal);
                                  fireWidgetTriggers(comp, 'ON_CHANGE');
                                }} style={{ width: '40px', height: '44px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white', color: '#475569', fontSize: '1.2rem', cursor: 'pointer' }}>-</button>
                                <input type="number" value={numberInputValues[comp.id] != null ? numberInputValues[comp.id] : resolvedProps.defaultValue || 0} onChange={e => {
                                  const newVal = parseFloat(e.target.value) || 0;
                                  setNumberInputValues(prev => ({ ...prev, [comp.id]: newVal }));
                                  syncVariable(newVal);
                                  fireWidgetTriggers(comp, 'ON_CHANGE');
                                }} style={{ flex: 1, padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '1.1rem', textAlign: 'center', outline: 'none' }} />
                                <button onClick={() => {
                                  const newVal = Math.min(comp.props.max != null ? comp.props.max : 9999, (numberInputValues[comp.id] != null ? numberInputValues[comp.id] : resolvedProps.defaultValue || 0) + 1);
                                  setNumberInputValues(prev => ({ ...prev, [comp.id]: newVal }));
                                  syncVariable(newVal);
                                  fireWidgetTriggers(comp, 'ON_CHANGE');
                                }} style={{ width: '40px', height: '44px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white', color: '#475569', fontSize: '1.2rem', cursor: 'pointer' }}>+</button>
                                {comp.props.unit && <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>{comp.props.unit}</span>}
                              </div>
                            </div>
                          );
                          case 'DATE_PICKER': return (
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>{resolvedProps.label}</div>
                              <input type="date" value={dateValues[comp.id] || ''} onChange={e => {
                                const val = e.target.value;
                                setDateValues(prev => ({ ...prev, [comp.id]: val }));
                                syncVariable(val);
                                fireWidgetTriggers(comp, 'ON_CHANGE');
                              }} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '1rem', outline: 'none', color: '#0f172a' }} />
                            </div>
                          );
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}><span>{comp.props.min}</span><span>{comp.props.max}</span></div>
                              </div>
                            );
                          }
                          case 'CHART': {
                            const data = chartData[comp.id] || [];
                            const { type, title, xAxisColumn, yAxisColumn, color, showArea } = comp.props;
                            const ChartComponent = type === 'BAR' ? BarChart : type === 'AREA' ? AreaChart : LineChart;
                            const DataComponent = type === 'BAR' ? Bar : type === 'AREA' ? Area : Line;

                            return (
                              <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', height: '300px', display: 'flex', flexDirection: 'column' }}>
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
                              <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', height: '300px', display: 'flex', flexDirection: 'column' }}>
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
                              <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', height: '300px', display: 'flex', flexDirection: 'column' }}>
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
                            const isDark = selectedApp?.config?.appThemeMode === 'DARK';

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
                            const data = tableData[comp.id] || [];
                            const cols = comp.props.columns?.length > 0 ? comp.props.columns : ['id', 'createdAt'];
                            const pageSize = comp.props.pageSize || 5;
                            const currentPage = tablePagination[comp.id]?.page || 1;
                            const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
                            const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
                            const selected = selectedTableRow[comp.id];
                            const linkedPlaceholderId = comp.props.linkedRecordPlaceholderId;

                            return (
                              <div style={{ backgroundColor: comp.props.backgroundColor || '#ffffff', border: comp.props.bordered !== false ? '1px solid #e2e8f0' : 'none', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                                  <Table size={18} color={comp.props.color || '#3b82f6'} />
                                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>{comp.props.title || 'Data View'}</span>
                                </div>
                                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead>
                                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        {cols.map(col => (
                                          <th key={col} style={{ padding: '10px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>{col}</th>
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
                                            }}
                                            style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'white', transition: 'background-color 0.2s' }}
                                          >
                                            {cols.map(col => (
                                              <td key={col} style={{ padding: '10px', color: '#1e293b' }}>
                                                {(() => {
                                                  const val = row[col];
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
                                      {comp.props.unit}
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
                                }}
                                style={{ width: '100%', height: '100%', padding: '12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                              >
                                <TrashIcon size={18} />
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
                          default: return (
                            <div style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #fecaca' }}>
                              Unknown Type: {comp.type}
                            </div>
                          );
                        }
                      };
                      const containerStyle = isAbsolute ? {
                        position: 'absolute',
                        left: `${comp.x}px`,
                        top: `${comp.y}px`,
                        width: `${comp.w}px`,
                        height: `${comp.h}px`,
                        zIndex: comp.props.zIndex || 100,
                        transform: `rotate(${comp.props.rotation || 0}deg)`,
                        overflow: 'hidden'
                      } : {
                        width: '100%',
                        transform: `rotate(${comp.props.rotation || 0}deg)`,
                        marginBottom: '20px'
                      };

                      const err = validationErrors[comp.id];
                      return (
                        <div key={comp.id || idx} ref={(el) => { if (comp?.id) widgetContainerRefs.current[comp.id] = el; }} style={containerStyle}>
                          <div style={{
                            border: err ? '2px solid #ef4444' : 'none',
                            borderRadius: '8px',
                            padding: err ? '10px' : 0,
                            backgroundColor: err ? '#fee2e2' : 'transparent',
                            height: isAbsolute ? '100%' : 'auto',
                            position: 'relative',
                            boxSizing: 'border-box'
                          }}>
                            {renderWidget()}
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

            {/* WORK SEQUENCE FOOTER (IN CENTER PANEL) */}
            {selectedApp?.config?.stepListEnabled !== false && (
              <div style={{ padding: '15px 20px', backgroundColor: selectedApp?.config?.appThemeMode === 'DARK' ? '#1e293b' : '#f8fafc', borderTop: `1px solid ${selectedApp?.config?.appThemeMode === 'DARK' ? '#334155' : '#e2e8f0'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: selectedApp?.config?.appThemeMode === 'DARK' ? '#94a3b8' : '#64748b' }}>
                    WORK SEQUENCE <span style={{ fontWeight: 400, fontSize: '0.7rem', color: '#94a3b8', marginLeft: '5px' }}>Click to expand instruction</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                    {appComponents.length} Widgets
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                  {steps.map((step, idx) => (
                    (() => {
                      const summary = selectedApp ? getStepRequiredSummary(step) : { total: 0, done: 0, ok: true };
                      const stepComps = step.components || [];
                      return (
                        <div
                          key={idx}
                          onClick={() => setCurrentStepIndex(idx)}
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
                    })()
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>


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

      {/* FRONTLINE COPILOT TOGGLE */}
      {(selectedApp || selectedManual) && (selectedApp?.config?.copilotEnabled !== false) && (
        <>
          <button
            onClick={() => setShowCopilot(!showCopilot)}
            style={{
              position: 'fixed',
              bottom: '80px',
              right: '24px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#0f172a',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              border: 'none',
              zIndex: 999,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Sparkles size={24} />
            {showCopilot && (
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#ef4444', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid white' }} />
            )}
          </button>

          <FrontlineCopilot
            isOpen={showCopilot}
            onClose={() => setShowCopilot(false)}
            appContext={{ currentStepIndex }}
            selectedApp={selectedApp}
          />
        </>
      )}

      {/* MAVI FOOTER BAR */}
      <div style={{
        height: '56px',
        backgroundColor: '#1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 20px',
        alignItems: 'center',
        color: 'white'
      }}>
        <button
          onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
          style={{
            backgroundColor: '#475569',
            border: 'none',
            color: 'white',
            padding: '10px 25px',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} /> Previous
        </button>

        <button
          onClick={() => setShowSignaturePad(true)}
          style={{
            backgroundColor: '#334155',
            border: 'none',
            color: 'white',
            padding: '10px 25px',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <ThumbsUp size={18} /> Sign Off Order
        </button>
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
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  {['Barcode Scanner (USB)', 'Scale (COM3)', 'Edge IO (192.168.1.50)'].map((dev, i) => (
                    <div key={i} style={{ padding: '12px 16px', borderBottom: i < 2 ? '1px solid #e2e8f0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Cpu size={16} color="#64748b" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>{dev}</span>
                      </div>
                      <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>
                        ONLINE
                      </div>
                    </div>
                  ))}
                </div>
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
    </div>
  );
};

export default LiveTerminal;
