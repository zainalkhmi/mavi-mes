import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RotateCcw, Smartphone, Tablet, Monitor, Maximize2, Minimize2,
  CheckCircle2, AlertTriangle, Play, Pause, QrCode, Camera, Layers, Bug,
  ChevronRight, ChevronDown, ChevronUp, Plus, Minus, Search, X, ExternalLink,
  Settings, Check, Info, FileText, BarChart3, Clock, Hash, AlignLeft,
  ListFilter, CheckSquare, ToggleLeft, Video, Grid3X3, ChevronsUpDown,
  Tag, User, Table as TableIcon, Bell, RefreshCw, Sparkles, Send, Eye, Home,
  Calendar, PenTool, List, PlusCircle
} from 'lucide-react';
import {
  Image as UiImage,
  PDFViewer as UiPDFViewer,
  Chart as UiChart,
  Timer as UiTimer,
  Counter as UiCounter,
  NumberInput as UiNumberInput,
  DateTimePicker as UiDateTimePicker,
  Gauge as UiGauge,
  Signature as UiSignature,
  ListItem as UiListItem
} from '../components';
import { getFrontlineAppById } from '../../utils/supabaseFrontlineDB';

// Default starter screens if app is brand new / not yet persisted
const DEFAULT_STARTER_APP = {
  id: 'app_1',
  name: 'Mobile Inspection App',
  screens: [
    {
      id: 'screen_1',
      title: 'Production & QC Overview',
      components: [
        { id: 'c1', type: 'Text', props: { text: 'Production & QC Dashboard', size: 'lg', bold: true } },
        { id: 'c2', type: 'Badge', props: { text: 'LINE 1 • ACTIVE', action: 'success' } },
        { id: 'c3', type: 'Card', props: { title: 'OEE Target', content: '88.5% (Target: 85.0%)' } },
        { id: 'c4', type: 'Progress', props: { value: 88, label: 'Shift Output Progress' } },
        {
          id: 'c5',
          type: 'Button',
          props: {
            text: 'Mulai Pemeriksaan QC Part ➔',
            variant: 'primary',
            action: 'NEXT_SCREEN'
          }
        }
      ],
      triggers: []
    },
    {
      id: 'screen_2',
      title: 'Formulir Inspeksi Visual',
      components: [
        { id: 'c6', type: 'Text', props: { text: 'Pemeriksaan Visual Part', size: 'lg', bold: true } },
        { id: 'c7', type: 'Input', props: { label: 'Serial Number / Lot No', placeholder: 'Contoh: LOT-2026-09-001' } },
        { id: 'c8', type: 'Select', props: { label: 'Shift Kerja', options: ['Shift 1 (Pagi)', 'Shift 2 (Siang)', 'Shift 3 (Malam)'] } },
        { id: 'c9', type: 'Checkbox', props: { label: 'Pemeriksaan Visual - OK', checked: true } },
        { id: 'c10', type: 'Switch', props: { label: 'Status Toleransi Dimensi OK', value: true } },
        { id: 'c11', type: 'Textarea', props: { label: 'Catatan Temuan', placeholder: 'Tuliskan catatan inspeksi jika ada defect...' } },
        {
          id: 'c12',
          type: 'Button',
          props: {
            text: 'Simpan & Selesaikan Inspeksi',
            variant: 'positive',
            action: 'COMPLETE_APP'
          }
        }
      ],
      triggers: []
    }
  ],
  variables: [
    { id: 'v1', name: 'CURRENT_OPERATOR', type: 'string', value: 'OP-01' },
    { id: 'v2', name: 'TARGET_QTY', type: 'number', value: '1500' },
    { id: 'v3', name: 'LINE_STATUS', type: 'string', value: 'RUNNING' }
  ]
};

export default function GluestackAppPlayer({
  appId: propAppId,
  mode: propMode,
  devMode: propDevMode,
  initialAppData,
  embedded = false,
  onClose
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract parameters from search params or hash params
  const { appId, mode, devMode } = useMemo(() => {
    let qAppId = propAppId || searchParams.get('appId') || searchParams.get('app');
    let qMode = propMode || searchParams.get('mode');
    let qDevMode = propDevMode !== undefined ? propDevMode : searchParams.get('devMode');

    // Fallback inspect window.location.hash query string
    if (!qAppId || !qMode) {
      const hash = window.location.hash || '';
      const qIndex = hash.indexOf('?');
      if (qIndex !== -1) {
        const hashParams = new URLSearchParams(hash.substring(qIndex));
        if (!qAppId) qAppId = hashParams.get('appId') || hashParams.get('app');
        if (!qMode) qMode = hashParams.get('mode');
        if (qDevMode === undefined || qDevMode === null) {
          qDevMode = hashParams.get('devMode');
        }
      }
    }

    return {
      appId: qAppId || 'app_1',
      mode: qMode || 'companion',
      devMode: qDevMode === 'true' || qDevMode === true
    };
  }, [propAppId, propMode, propDevMode, searchParams]);

  // App Definition state
  const [appName, setAppName] = useState('GlueStack App');
  const [screens, setScreens] = useState(DEFAULT_STARTER_APP.screens);
  const [currentScreenId, setCurrentScreenId] = useState('screen_1');
  const [variables, setVariables] = useState(DEFAULT_STARTER_APP.variables);
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Runtime interactive state
  const [formValues, setFormValues] = useState({});
  const [counters, setCounters] = useState({});
  const [activeTabsState, setActiveTabsState] = useState({});
  const [accordionState, setAccordionState] = useState({});
  const [deviceFrame, setDeviceFrame] = useState(mode === 'companion' ? 'responsive' : 'iphone');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const [isCompletedModal, setIsCompletedModal] = useState(false);

  // DevMode panel state
  const [showDevPanel, setShowDevPanel] = useState(devMode);
  const [activeDevTab, setActiveDevTab] = useState('VARS'); // 'VARS' | 'LOGS' | 'FORM'
  const [triggerLogs, setTriggerLogs] = useState([]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => setActiveToast(null), 3500);
    return () => clearTimeout(timer);
  }, [activeToast]);

  // Add trigger log entry
  const logTrigger = useCallback((triggerName, eventType, action, status = 'SUCCESS', detail = '') => {
    const entry = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      triggerName,
      eventType,
      action,
      status,
      detail
    };
    setTriggerLogs(prev => [entry, ...prev.slice(0, 49)]);
  }, []);

  // ── Load App Data ──────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadApp = async () => {
      try {
        // 1. If initialAppData provided via prop, use it directly
        if (initialAppData) {
          const cfg = initialAppData.config || initialAppData;
          if (isMounted) {
            setAppName(initialAppData.name || 'GlueStack App');
            if (cfg.components && cfg.components.length > 0) {
              setScreens(cfg.components);
              setCurrentScreenId(cfg.components[0].id);
            } else if (cfg.screens && cfg.screens.length > 0) {
              setScreens(cfg.screens);
              setCurrentScreenId(cfg.screens[0].id);
            }
            if (cfg.variables) setVariables(cfg.variables);
            if (cfg.tables) setTables(cfg.tables);
            setIsLoading(false);
          }
          return;
        }

        // 2. Try loading from localStorage (`mavi_app_${appId}`)
        const localKey = `mavi_app_${appId}`;
        const localDataRaw = localStorage.getItem(localKey);
        if (localDataRaw) {
          try {
            const parsed = JSON.parse(localDataRaw);
            if (isMounted) {
              setAppName(parsed.name || 'GlueStack App');
              if (parsed.screens && parsed.screens.length > 0) {
                setScreens(parsed.screens);
                setCurrentScreenId(parsed.screens[0].id);
              }
              if (parsed.variables) setVariables(parsed.variables);
              if (parsed.tables) setTables(parsed.tables);
              setIsLoading(false);
            }
            return;
          } catch (e) {
            console.warn('[GluestackAppPlayer] Corrupt localStorage app:', e);
          }
        }

        // 3. Try loading from Supabase
        if (appId && appId !== 'app_1') {
          const remoteApp = await getFrontlineAppById(appId);
          if (remoteApp && isMounted) {
            setAppName(remoteApp.name || 'GlueStack App');
            const cfg = remoteApp.config || {};
            if (cfg.components && cfg.components.length > 0) {
              setScreens(cfg.components);
              setCurrentScreenId(cfg.components[0].id);
            } else if (cfg.screens && cfg.screens.length > 0) {
              setScreens(cfg.screens);
              setCurrentScreenId(cfg.screens[0].id);
            }
            if (cfg.variables) setVariables(cfg.variables);
            if (cfg.tables) setTables(cfg.tables);
            setIsLoading(false);
            return;
          }
        }

        // 4. Fallback to default starter app
        if (isMounted) {
          setAppName(DEFAULT_STARTER_APP.name);
          setScreens(DEFAULT_STARTER_APP.screens);
          setCurrentScreenId(DEFAULT_STARTER_APP.screens[0].id);
          setVariables(DEFAULT_STARTER_APP.variables);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[GluestackAppPlayer] Error loading app:', err);
        if (isMounted) {
          setScreens(DEFAULT_STARTER_APP.screens);
          setCurrentScreenId(DEFAULT_STARTER_APP.screens[0].id);
          setIsLoading(false);
        }
      }
    };

    loadApp();
    return () => { isMounted = false; };
  }, [appId, initialAppData]);

  // Current active screen
  const currentScreen = useMemo(() => {
    return screens.find(s => s.id === currentScreenId) || screens[0] || { components: [], title: 'Screen' };
  }, [screens, currentScreenId]);

  const currentScreenIndex = useMemo(() => {
    return screens.findIndex(s => s.id === currentScreenId);
  }, [screens, currentScreenId]);

  // ── Trigger Runner ─────────────────────────────────────────────────────────
  const executeComponentTriggers = useCallback((comp, eventType = 'ON_CLICK') => {
    if (!comp) return;

    // Built-in Navigation Action
    const action = comp.props?.action;
    if (eventType === 'ON_CLICK' && action) {
      if (action === 'NEXT_SCREEN') {
        const curIdx = screens.findIndex(s => s.id === currentScreenId);
        if (curIdx >= 0 && curIdx < screens.length - 1) {
          const nextScr = screens[curIdx + 1];
          setCurrentScreenId(nextScr.id);
          logTrigger(comp.props?.text || comp.props?.label || comp.type, eventType, `NEXT_SCREEN ➔ ${nextScr.title}`);
          setActiveToast({ message: `Beralih ke: ${nextScr.title}`, type: 'INFO' });
        } else {
          setActiveToast({ message: 'Ini adalah halaman terakhir', type: 'INFO' });
        }
      } else if (action === 'PREV_SCREEN') {
        const curIdx = screens.findIndex(s => s.id === currentScreenId);
        if (curIdx > 0) {
          const prevScr = screens[curIdx - 1];
          setCurrentScreenId(prevScr.id);
          logTrigger(comp.props?.text || comp.props?.label || comp.type, eventType, `PREV_SCREEN ➔ ${prevScr.title}`);
          setActiveToast({ message: `Kembali ke: ${prevScr.title}`, type: 'INFO' });
        }
      } else if (action === 'GO_TO_SCREEN' && comp.props?.targetScreenId) {
        const targetScr = screens.find(s => s.id === comp.props.targetScreenId);
        if (targetScr) {
          setCurrentScreenId(targetScr.id);
          logTrigger(comp.props?.text || comp.props?.label || comp.type, eventType, `GO_TO_SCREEN ➔ ${targetScr.title}`);
          setActiveToast({ message: `Beralih ke: ${targetScr.title}`, type: 'INFO' });
        }
      } else if (action === 'COMPLETE_APP') {
        setIsCompletedModal(true);
        logTrigger(comp.props?.text || comp.props?.label || comp.type, eventType, 'COMPLETE_APP', 'SUCCESS', 'App Finished');
        setActiveToast({ message: 'Aplikasi / Work Order Berhasil Diselesaikan!', type: 'SUCCESS' });
      }
    }

    // Custom Component Triggers
    if (comp.triggers && comp.triggers.length > 0) {
      comp.triggers.forEach(trig => {
        if (trig.event && trig.event !== eventType) return;
        const clauses = trig.clauses || [];
        clauses.forEach(clause => {
          if (clause.action === 'SET_VARIABLE' && clause.variableId) {
            setVariables(prev => prev.map(v => {
              if (v.id === clause.variableId || v.name === clause.variableId) {
                return { ...v, value: clause.value };
              }
              return v;
            }));
            logTrigger(trig.name || 'Trigger', eventType, `SET_VARIABLE: ${clause.variableId} = ${clause.value}`);
          } else if (clause.action === 'SHOW_MESSAGE') {
            setActiveToast({ message: clause.message || 'Pesan dari Trigger', type: clause.messageType || 'INFO' });
            logTrigger(trig.name || 'Trigger', eventType, `SHOW_MESSAGE: ${clause.message}`);
          } else if (clause.action === 'GO_TO_SCREEN' && clause.targetScreenId) {
            setCurrentScreenId(clause.targetScreenId);
            logTrigger(trig.name || 'Trigger', eventType, `GO_TO_SCREEN ➔ ${clause.targetScreenId}`);
          }
        });
      });
    }
  }, [screens, currentScreenId, logTrigger]);

  // Restart / Reset App
  const handleRestartApp = () => {
    setFormValues({});
    setCounters({});
    setActiveTabsState({});
    setAccordionState({});
    setIsCompletedModal(false);
    if (screens.length > 0) {
      setCurrentScreenId(screens[0].id);
    }
    setActiveToast({ message: 'Sesi aplikasi di-reset', type: 'INFO' });
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // ── Render Interactive Widgets ─────────────────────────────────────────────
  const renderInteractiveWidget = (comp) => {
    const props = comp.props || {};
    const val = formValues[comp.id];

    switch (comp.type) {
      case 'Button':
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              executeComponentTriggers(comp, 'ON_CLICK');
            }}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
              props.variant === 'primary' ? 'bg-[#008784] hover:bg-[#007471] text-white' :
              props.variant === 'secondary' ? 'bg-slate-800 hover:bg-slate-700 text-white' :
              props.variant === 'positive' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
              props.variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700 text-white' :
              'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
            }`}
          >
            <span>{props.text || props.label || 'Action Button'}</span>
          </button>
        );

      case 'Dropdown': {
        const isDropOpen = !!accordionState[`drop_${comp.id}`];
        const dropItems = props.items || props.options || ['Export PDF', 'Cetak Label Barcode', 'Kirim Notifikasi QC'];
        const selectedOpt = formValues[comp.id] || props.label || props.defaultValue || 'Opsi Tindakan...';
        return (
          <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setAccordionState(prev => ({ ...prev, [`drop_${comp.id}`]: !isDropOpen }));
              }}
              className="w-full p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs transition-all hover:border-teal-500 hover:bg-slate-50 active:scale-98 cursor-pointer"
            >
              <span className="font-semibold text-slate-800 truncate">{selectedOpt}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isDropOpen ? 'rotate-180 text-teal-600' : ''}`} />
            </button>
            {isDropOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 py-1 divide-y divide-slate-100 animate-in fade-in-50 zoom-in-95 duration-150">
                {dropItems.map((it, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFormValues(prev => ({ ...prev, [comp.id]: it }));
                      setAccordionState(prev => ({ ...prev, [`drop_${comp.id}`]: false }));
                      setActiveToast({ message: `Dipilih: "${it}"`, type: 'success' });
                      logTrigger('Dropdown', 'ON_CHANGE', `Pilih: ${it}`);
                      executeComponentTriggers(comp, 'ON_CHANGE');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 font-medium transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{it}</span>
                    {selectedOpt === it && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'Input':
        return (
          <div className="space-y-1.5 w-full">
            <label className="text-xs font-bold text-slate-700 block">{props.label || 'Input Field'}</label>
            <input
              type={props.isPassword ? 'password' : 'text'}
              value={val !== undefined ? val : (props.defaultValue || '')}
              onChange={(e) => {
                const newVal = e.target.value;
                setFormValues(prev => ({ ...prev, [comp.id]: newVal }));
                executeComponentTriggers(comp, 'ON_CHANGE');
              }}
              placeholder={props.placeholder || 'Ketik data di sini...'}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#008784] focus:border-[#008784] shadow-2xs transition-all"
            />
          </div>
        );

      case 'Textarea':
        return (
          <div className="space-y-1.5 w-full">
            <label className="text-xs font-bold text-slate-700 block">{props.label || 'Keterangan Detail'}</label>
            <textarea
              rows={props.rows || 3}
              value={val !== undefined ? val : (props.defaultValue || '')}
              onChange={(e) => {
                const newVal = e.target.value;
                setFormValues(prev => ({ ...prev, [comp.id]: newVal }));
                executeComponentTriggers(comp, 'ON_CHANGE');
              }}
              placeholder={props.placeholder || 'Tulis catatan inspeksi...'}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#008784] focus:border-[#008784] shadow-2xs transition-all resize-none"
            />
          </div>
        );

      case 'Select':
        return (
          <div className="space-y-1.5 w-full">
            <label className="text-xs font-bold text-slate-700 block">{props.label || 'Pilih Opsi'}</label>
            <div className="relative">
              <select
                value={val !== undefined ? val : (props.options?.[0] || '')}
                onChange={(e) => {
                  const newVal = e.target.value;
                  setFormValues(prev => ({ ...prev, [comp.id]: newVal }));
                  executeComponentTriggers(comp, 'ON_CHANGE');
                }}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-[#008784] focus:border-[#008784] shadow-2xs cursor-pointer"
              >
                {(props.options || ['Shift 1 (Pagi)', 'Shift 2 (Siang)', 'Shift 3 (Malam)']).map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        );

      case 'Checkbox':
        const isChecked = val !== undefined ? !!val : !!props.checked;
        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
              const nextChecked = !isChecked;
              setFormValues(prev => ({ ...prev, [comp.id]: nextChecked }));
              executeComponentTriggers(comp, 'ON_CHANGE');
            }}
            className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors border border-slate-200/80 select-none"
          >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
              isChecked ? 'bg-[#008784] border-[#008784] text-white' : 'bg-white border-slate-300'
            }`}>
              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <span className="text-xs font-medium text-slate-800">{props.label || 'Pemeriksaan Visual - OK'}</span>
          </div>
        );

      case 'Switch':
        const isSwitched = val !== undefined ? !!val : (props.value !== undefined ? !!props.value : true);
        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
              const nextSwitched = !isSwitched;
              setFormValues(prev => ({ ...prev, [comp.id]: nextSwitched }));
              executeComponentTriggers(comp, 'ON_CHANGE');
            }}
            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors border border-slate-200/80 select-none"
          >
            <span className="text-xs font-medium text-slate-800">{props.label || 'Status Aktif'}</span>
            <div className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 ${
              isSwitched ? 'bg-[#008784]' : 'bg-slate-300'
            }`}>
              <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform ${
                isSwitched ? 'translate-x-4.5' : 'translate-x-0'
              }`} />
            </div>
          </div>
        );

      case 'QRCodeScanner':
        return (
          <div className="w-full bg-slate-950 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-md">
            <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <QrCode className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-slate-200 text-[11px] truncate">{props.label || 'Pindai QR / Barcode'}</div>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">READY</span>
            </div>
            <div className="relative aspect-4/3 bg-slate-900 flex flex-col items-center justify-center p-3">
              <div className="w-32 h-32 border-2 border-teal-400/60 rounded-xl relative flex items-center justify-center shadow-[0_0_15px_rgba(45,212,191,0.25)]">
                <div className="w-full h-0.5 bg-teal-400 absolute top-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(45,212,191,0.9)] animate-pulse" />
                <QrCode className="w-14 h-14 text-teal-400/30" />
              </div>
              <span className="text-[11px] text-slate-300 mt-2 font-medium">{props.subtitle || 'Arahkan kamera ke barcode part'}</span>
              
              {/* Interactive Simulation Scan Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const mockCode = `PART-LOT-${Math.floor(1000 + Math.random() * 9000)}`;
                  setActiveToast({ message: `QR Code Terdeteksi: ${mockCode}`, type: 'SUCCESS' });
                  logTrigger('QRCodeScanner', 'ON_SCAN', `Scan Part: ${mockCode}`);
                  executeComponentTriggers(comp, 'ON_SCAN');
                }}
                className="mt-3 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulasi Scan Barcode (OK)</span>
              </button>
            </div>
          </div>
        );

      case 'Counter':
        const countVal = counters[comp.id] !== undefined ? counters[comp.id] : (Number(props.value) || 0);
        return (
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">{props.label || 'Hitungan Part'}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCounters(prev => ({ ...prev, [comp.id]: Math.max(0, countVal - 1) }));
                }}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-sm font-extrabold text-teal-800 bg-teal-50 px-3 py-0.5 rounded-md border border-teal-200 min-w-[36px] text-center">
                {countVal}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCounters(prev => ({ ...prev, [comp.id]: countVal + 1 }));
                }}
                className="w-7 h-7 rounded-lg bg-[#008784] hover:bg-[#007471] text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );

      case 'Tabs':
        const tabList = props.tabs || ['Info Part', 'Spesifikasi', 'Riwayat'];
        const activeIdx = activeTabsState[comp.id] !== undefined ? activeTabsState[comp.id] : (props.activeIndex || 0);
        return (
          <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="flex border-b border-slate-200 bg-slate-50/70">
              {tabList.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTabsState(prev => ({ ...prev, [comp.id]: i }));
                  }}
                  className={`flex-1 py-2 text-center text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    i === activeIdx ? 'border-[#008784] text-[#008784] bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="p-3 text-xs text-slate-600">
              Menampilkan konten untuk tab: <strong className="text-slate-800">{tabList[activeIdx]}</strong>
            </div>
          </div>
        );

      case 'Accordion':
        const isOpen = accordionState[comp.id] !== undefined ? accordionState[comp.id] : true;
        return (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAccordionState(prev => ({ ...prev, [comp.id]: !isOpen }));
              }}
              className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors cursor-pointer"
            >
              <span>{props.title || 'Verifikasi Parameter'}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="p-2.5 text-xs text-slate-600 border-t border-slate-100">
                {props.content || 'Periksa kelengkapan fixture dan pastikan sensor berfungsi normal.'}
              </div>
            )}
          </div>
        );

      case 'Card':
        return (
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-800">{props.title || 'Card Container'}</div>
            <div className="text-xs text-slate-600 whitespace-pre-wrap">{props.content || 'Konten spesifikasi part...'}</div>
          </div>
        );

      case 'Badge':
        return (
          <div className="inline-flex">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
              {props.text || 'PASSED'}
            </span>
          </div>
        );

      case 'Avatar':
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#714b67] text-white flex items-center justify-center font-bold text-xs">
              {props.name?.slice(0, 2).toUpperCase() || 'OP'}
            </div>
            <span className="text-xs font-semibold text-slate-700">{props.name || 'OP-01'}</span>
          </div>
        );

      case 'Table':
        return (
          <div className="w-full border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700 border-b border-slate-200">
              {props.title || 'Spesifikasi Toleransi'}
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/60 text-[10px] text-slate-500 font-bold uppercase">
                <tr>
                  {(props.headers || ['Parameter', 'Standar', 'Aktual']).map((h, i) => (
                    <th key={i} className="p-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {(props.rows || [['Torsi Baut', '45 Nm', '45.2 Nm']]).map((r, i) => (
                  <tr key={i}>
                    {r.map((cell, ci) => (
                      <td key={ci} className={`p-2 ${ci === 2 ? 'font-bold text-emerald-600' : ''}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'Alert':
        return (
          <div className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">{props.title || 'Peringatan Safety'}</div>
              <div className="text-[11px] text-amber-700">{props.message || 'Gunakan APD kacamata dan sarung tangan.'}</div>
            </div>
          </div>
        );

      case 'Progress':
        return (
          <div className="space-y-1 w-full">
            <div className="flex justify-between text-xs text-slate-600">
              <span>{props.label || 'Target Output Shift'}</span>
              <span className="font-bold">{props.value || 75}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${props.value || 75}%` }} />
            </div>
          </div>
        );

      case 'VideoPlayer':
        return (
          <div className="w-full bg-slate-950 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-md">
            <div className="p-2 bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-300 px-3 truncate">
              {props.title || 'SOP Training Video'}
            </div>
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                controls
                poster={props.poster || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800'}
                className="w-full h-full object-cover"
              >
                <source src={props.src || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'} type="video/mp4" />
                Browser Anda tidak mendukung video.
              </video>
            </div>
          </div>
        );

      case 'Text':
        return (
          <div className={`${props.bold ? 'font-bold' : ''} ${props.size === 'lg' ? 'text-lg' : props.size === 'xl' ? 'text-xl' : 'text-sm'} text-slate-800`}>
            {props.text}
          </div>
        );

      // EMBED WIDGETS
      case 'Image':
        return (
          <UiImage
            src={props.src}
            alt={props.alt || 'Drawing CAD / Foto Defek'}
            title={props.title}
            caption={props.caption}
            aspectRatio={props.aspectRatio || '16:9'}
            badgeText={props.badgeText || 'CAD DRAWING'}
            zoomable={props.zoomable !== false}
          />
        );

      case 'PDFViewer':
        return (
          <UiPDFViewer
            src={props.src}
            title={props.title || 'Work Instruction SOP'}
            docNo={props.docNo || 'SOP-QC-2026-08'}
            rev={props.rev || 'Rev 2.3'}
            pages={props.pages || 3}
          />
        );

      case 'Signature':
        return (
          <UiSignature
            label={props.label || 'Approval Tanda Tangan QC'}
            placeholder={props.placeholder || 'Bubuhkan tanda tangan persetujuan di sini'}
            onChange={(sigData) => {
              setFormValues(prev => ({ ...prev, [comp.id]: sigData }));
              logTrigger('Signature', 'ON_SIGN', 'Tanda tangan QC tersimpan');
            }}
          />
        );

      case 'ListItem':
        return (
          <UiListItem
            title={props.title || 'Baris Data Operasional'}
            subtitle={props.subtitle || 'Keterangan lot atau status stasiun'}
            badge={props.badge || 'ACTIVE'}
            value={props.value}
            onClick={() => logTrigger('ListItem', 'ON_CLICK', `Item: ${props.title}`)}
          />
        );

      case 'Chart':
      case 'LineChart':
      case 'BarChart':
        return (
          <UiChart
            type={props.type || (comp.type === 'BarChart' ? 'bar' : 'line')}
            title={props.title || 'KPI Output & OEE Trend'}
            subtitle={props.subtitle}
            data={props.data}
            unit={props.unit || 'pcs'}
            targetValue={props.targetValue || 50}
          />
        );

      case 'Gauge':
        return (
          <UiGauge
            label={props.label || 'Spindle RPM / Telemetry'}
            value={Number(props.value) || 1850}
            min={Number(props.min) || 0}
            max={Number(props.max) || 3000}
            unit={props.unit || 'RPM'}
            warningThreshold={props.warningThreshold || 2400}
            dangerThreshold={props.dangerThreshold || 2800}
          />
        );

      case 'NumberInput':
        return (
          <UiNumberInput
            label={props.label || 'Input Quantity'}
            value={formValues[comp.id] !== undefined ? formValues[comp.id] : (Number(props.value) || 10)}
            min={Number(props.min) || 0}
            max={Number(props.max) || 99999}
            step={Number(props.step) || 1}
            onChange={(val) => {
              setFormValues(prev => ({ ...prev, [comp.id]: val }));
              logTrigger('NumberInput', 'ON_CHANGE', `Quantity: ${val}`);
            }}
          />
        );

      case 'DateTimePicker':
        return (
          <UiDateTimePicker
            label={props.label || 'Jadwal Maintenance'}
            value={formValues[comp.id] || props.value}
            mode={props.mode || 'datetime'}
            onChange={(val) => {
              setFormValues(prev => ({ ...prev, [comp.id]: val }));
              logTrigger('DateTimePicker', 'ON_CHANGE', `Date: ${val}`);
            }}
          />
        );

      case 'Timer':
        return (
          <UiTimer
            label={props.label || 'Cycle Time / Takt Time'}
            duration={Number(props.duration) || 60}
            mode={props.mode || 'countdown'}
            autoStart={props.autoStart !== false}
            onComplete={() => {
              logTrigger('Timer', 'ON_COMPLETE', 'Timer cycle time selesai');
              setActiveToast({ message: 'Timer Siklus Selesai!', type: 'success' });
            }}
          />
        );

      case 'Counter':
        return (
          <UiCounter
            label={props.label || 'Good Parts Counter'}
            value={counters[comp.id] !== undefined ? counters[comp.id] : (Number(props.value) || 0)}
            min={Number(props.min) || 0}
            max={Number(props.max) || 99999}
            step={Number(props.step) || 1}
            onChange={(val) => {
              setCounters(prev => ({ ...prev, [comp.id]: val }));
              logTrigger('Counter', 'ON_CHANGE', `Counter: ${val}`);
            }}
          />
        );

      default:
        return (
          <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700">
            {props.label || props.text || props.title || comp.type}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-bold tracking-wide">Memuat Aplikasi GlueStack...</div>
        <div className="text-xs text-slate-400">ID: {appId}</div>
      </div>
    );
  }

  // Pure live real device layout (No desktop runner header, no terminal dev drawer, no artificial phone bezel)
  const isCompanionMode = mode === 'companion';

  if (isCompanionMode) {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col font-sans select-none antialiased">
        {/* Screen Body Components (Pure Real Device edge-to-edge) */}
        <main className="flex-1 w-full max-w-xl mx-auto p-4 sm:p-6 space-y-4">
          {(!currentScreen?.components || currentScreen.components.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2 bg-white rounded-2xl border border-slate-200/80 p-6">
              <Layers className="w-10 h-10 text-slate-300" />
              <span className="text-sm font-semibold text-slate-500">Layar ini belum memiliki komponen</span>
            </div>
          ) : (
            currentScreen.components.map(comp => (
              <div key={comp.id} className="transition-all">
                {renderInteractiveWidget(comp)}
              </div>
            ))
          )}
        </main>

        {/* Toast Notification */}
        {activeToast && (
          <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 px-4 pointer-events-none">
            <div className={`px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xl border flex items-center gap-2 pointer-events-auto animate-in slide-in-from-bottom-3 duration-200 ${
              activeToast.type === 'error'
                ? 'bg-rose-900/95 text-white border-rose-700'
                : activeToast.type === 'success'
                ? 'bg-emerald-900/95 text-white border-emerald-700'
                : 'bg-slate-900/95 text-white border-slate-700'
            }`}>
              {activeToast.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
              ) : activeToast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-teal-300 shrink-0" />
              )}
              <span>{activeToast.message}</span>
            </div>
          </div>
        )}

        {/* App Completion Modal */}
        {isCompletedModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white text-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 border border-slate-100 animate-in zoom-in-95 duration-150">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Work Order Selesai!</h3>
                <p className="text-xs text-slate-500 mt-1">Seluruh tahapan inspeksi telah selesai diproses dengan sukses.</p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleRestartApp}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  Mulai Sesi Baru
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full bg-slate-900 text-slate-100 overflow-hidden font-sans select-none relative ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* ── TOP COMPANION RUNNER HEADER ────────────────────────────────────── */}
      <header className="h-14 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shadow-md shrink-0 z-30">
        {/* Left: Back button & App Title */}
        <div className="flex items-center gap-3">
          {currentScreenIndex > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (currentScreenIndex > 0) {
                  setCurrentScreenId(screens[currentScreenIndex - 1].id);
                }
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Kembali ke layar sebelumnya"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali</span>
            </button>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs border border-teal-500/30">
              <Smartphone className="w-4 h-4" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-white tracking-wide">{appName}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                {mode === 'companion' ? 'Companion' : 'Player'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <span>{currentScreen.title}</span>
              <span>•</span>
              <span>{currentScreenIndex + 1} dari {screens.length}</span>
            </div>
          </div>
        </div>

        {/* Center: Screen dots / quick switcher */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
          {screens.map((scr, idx) => (
            <button
              key={scr.id}
              type="button"
              onClick={() => setCurrentScreenId(scr.id)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                scr.id === currentScreenId ? 'bg-teal-500 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {idx + 1}. {scr.title}
            </button>
          ))}
        </div>

        {/* Right: Controls (Device preset, Restart, DevMode toggle, Fullscreen, Close) */}
        <div className="flex items-center gap-2">
          {/* Device frame switcher (hidden on responsive or small mobile) */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setDeviceFrame('iphone')}
              className={`p-1.5 rounded-md text-xs transition-colors ${deviceFrame === 'iphone' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="iPhone View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceFrame('tablet')}
              className={`p-1.5 rounded-md text-xs transition-colors ${deviceFrame === 'tablet' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Tablet View"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceFrame('responsive')}
              className={`p-1.5 rounded-md text-xs transition-colors ${deviceFrame === 'responsive' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Full Responsive View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset App */}
          <button
            type="button"
            onClick={handleRestartApp}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Reset / Restart Aplikasi"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* DevMode toggle */}
          <button
            type="button"
            onClick={() => setShowDevPanel(!showDevPanel)}
            className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              showDevPanel ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle Dev Panel"
          >
            <Bug className="w-4 h-4" />
            <span className="hidden lg:inline">Dev</span>
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit / Return button */}
          {(onClose || !embedded) && (
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                else navigate('/gluestack/canvas');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Keluar ke Editor"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tutup</span>
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN WORKSPACE / RUNNER CANVAS ─────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden items-center justify-center p-2 sm:p-4 bg-[#0a0f1d] relative">
        <div
          className={`h-full flex flex-col bg-white text-slate-800 shadow-2xl transition-all duration-200 overflow-hidden relative ${
            deviceFrame === 'iphone'
              ? 'w-full max-w-[390px] rounded-[36px] border-[8px] border-slate-900 shadow-slate-950/80 ring-1 ring-slate-800'
              : deviceFrame === 'tablet'
              ? 'w-full max-w-[768px] rounded-[28px] border-[8px] border-slate-900 shadow-slate-950/80'
              : 'w-full h-full rounded-none border-none max-w-4xl'
          }`}
        >
          {/* Simulated Mobile Status Bar (for phone / tablet frames) */}
          {deviceFrame !== 'responsive' && (
            <div className="h-6 bg-white flex items-center justify-between px-6 shrink-0 text-[10px] font-bold text-slate-700 select-none border-b border-slate-100">
              <span>9:41</span>
              <div className="w-20 h-3 bg-slate-900 rounded-full mx-auto" />
              <div className="flex items-center gap-1.5">
                <span className="text-[9px]">5G</span>
                <span className="w-3 h-2 border border-slate-700 rounded-xs inline-block relative after:content-[''] after:absolute after:inset-0.5 after:bg-slate-700" />
              </div>
            </div>
          )}

          {/* Screen Content Header */}
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-800">{currentScreen.title}</span>
            </div>
            <div className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              Step {currentScreenIndex + 1}/{screens.length}
            </div>
          </div>

          {/* Screen Body Components */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
            {(!currentScreen.components || currentScreen.components.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-2">
                <Layers className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-semibold">Layar ini belum memiliki komponen</span>
              </div>
            ) : (
              currentScreen.components.map(comp => (
                <div key={comp.id} className="transition-all">
                  {renderInteractiveWidget(comp)}
                </div>
              ))
            )}
          </div>

          {/* Simulated Home Indicator Bar */}
          {deviceFrame !== 'responsive' && (
            <div className="h-5 bg-white flex items-center justify-center shrink-0 border-t border-slate-100">
              <div className="w-28 h-1 bg-slate-300 rounded-full" />
            </div>
          )}
        </div>
      </main>

      {/* ── DEV / DEBUG DRAWER (Tulip parity variable & trigger inspector) ─── */}
      {showDevPanel && (
        <div className="h-44 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0 text-xs">
          {/* Drawer Top Header Tabs */}
          <div className="flex items-center justify-between px-3 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveDevTab('VARS')}
                className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeDevTab === 'VARS' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Variabel ({variables.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveDevTab('LOGS')}
                className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeDevTab === 'LOGS' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Log Trigger ({triggerLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveDevTab('FORM')}
                className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeDevTab === 'FORM' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Form State ({Object.keys(formValues).length})
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowDevPanel(false)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px]">
            {activeDevTab === 'VARS' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                {variables.map(v => (
                  <div key={v.id} className="p-1.5 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-teal-400 font-bold truncate max-w-[140px]">{v.name}:</span>
                    <span className="text-amber-300 font-semibold truncate max-w-[100px]">{String(v.value ?? '')}</span>
                  </div>
                ))}
              </div>
            )}

            {activeDevTab === 'LOGS' && (
              <div className="space-y-1">
                {triggerLogs.length === 0 ? (
                  <div className="text-slate-500 p-2">Belum ada trigger yang dieksekusi. Klik tombol atau ubah input untuk menguji.</div>
                ) : (
                  triggerLogs.map(log => (
                    <div key={log.id} className="p-1 bg-slate-900 rounded border border-slate-800/80 flex items-center gap-2">
                      <span className="text-slate-500">{log.time}</span>
                      <span className="text-teal-400 font-bold">[{log.eventType}]</span>
                      <span className="text-slate-200">{log.action}</span>
                      {log.detail && <span className="text-slate-400">({log.detail})</span>}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeDevTab === 'FORM' && (
              <pre className="text-emerald-400">
                {JSON.stringify(formValues, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* ── FLOATING TOAST NOTIFICATION ────────────────────────────────────── */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold text-white ${
            activeToast.type === 'ERROR' ? 'bg-rose-600 border-rose-500' :
            activeToast.type === 'SUCCESS' ? 'bg-emerald-600 border-emerald-500' :
            activeToast.type === 'WARNING' ? 'bg-amber-600 border-amber-500' :
            'bg-slate-800 border-slate-700'
          }`}>
            {activeToast.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-teal-300 shrink-0" />
            )}
            <span>{activeToast.message}</span>
          </div>
        </div>
      )}

      {/* ── APP COMPLETION MODAL ───────────────────────────────────────────── */}
      {isCompletedModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white text-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Work Order Selesai!</h3>
              <p className="text-xs text-slate-500 mt-1">Seluruh tahapan inspeksi telah selesai diproses dengan sukses.</p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRestartApp}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Mulai Sesi Baru
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCompletedModal(false);
                  if (onClose) onClose();
                  else navigate('/gluestack/canvas');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Kembali ke Builder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
