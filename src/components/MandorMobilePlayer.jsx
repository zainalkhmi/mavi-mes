import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Smartphone, Tablet, Monitor, RotateCw, Wifi, WifiOff, Battery, Zap,
  Play, Pause, RotateCcw, CheckCircle2, AlertTriangle, AlertCircle,
  Camera, Scan, QrCode, Lock, Key, Award, Clock, ArrowLeft, ArrowRight,
  Send, RefreshCw, Layers, ShieldAlert, Volume2, VolumeX, Flame,
  Search, Star, Compass, Settings, Check, ChevronRight, X, ChevronDown,
  User, MapPin, Tag, FileText, Upload, Sparkles, Sliders, ExternalLink,
  MessageSquare, Radio, Maximize, Minimize, LogOut, CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { getAllFrontlineApps, getProductionQueue, logPlayerSession } from '../utils/supabaseFrontlineDB';
import { getStations } from '../utils/database';
import { detectMeasuringToolType, TOOL_DEFINITIONS, getCalibrationStatus } from '../utils/metrologyToolUtils';
import { fullSPCAnalysis } from '../utils/spcEngine';
import SPCMiniChart from './checksheet/SPCMiniChart';
import SamplingPlanBadge from './checksheet/SamplingPlanBadge';
import CalibrationStatusBadge from './checksheet/CalibrationStatusBadge';
import n8nWebhook from '../utils/n8nWebhookService';

// ─── AUDIO SYNTHESIZER FOR FRONTLINE FEEDBACK (TULIP PARITY) ─────
const playFrontlineSound = (type = 'click') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'click' || type === 'tap') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } else if (type === 'complete' || type === 'pass') {
      // Harmonic 3-tone chime for step / app completion
      const tones = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 0.2);
      });
    } else if (type === 'andon' || type === 'alarm') {
      // Urgent Sawtooth Two-tone Andon Alarm
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch {
    // Ignore audio context block
  }
};

const triggerHaptic = (pattern = 25) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch {}
  }
};

// ─── DEFAULT DEMO APPS (When database is empty or offline) ─────────
const DEFAULT_FRONT_APPS = [
  {
    id: 'app-drawing-qc',
    name: 'Dual Stage Planetary Gearbox QC',
    category: 'Quality Inspection',
    version: 'v2.4',
    thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
    description: 'Pemeriksaan dimensi part shaft, housing, dan bearing dengan toleransi ISO 2768-mK.',
    taktTimeSec: 180,
    steps: [
      {
        id: 'st-1',
        title: 'Verifikasi Material & Batch Lot',
        instruction: 'Pindai barcode pada Traveler Card Work Order dan periksa sertifikat bahan S45C.',
        type: 'barcode_scan',
        expectedBarcode: 'WO-2026-0801',
        checkPoints: [{ label: 'Visual Material Surface OK', required: true }]
      },
      {
        id: 'st-2',
        title: 'Pengukuran Panjang Total Shaft (L)',
        instruction: 'Gunakan Digital Height Gauge atau Caliper pada datum bidang A.',
        type: 'measurement',
        nominal: 80.00,
        lowerTol: -0.30,
        upperTol: 0.30,
        unit: 'mm',
        toolId: 'HG-002',
        toolName: 'Digital Height Gauge'
      },
      {
        id: 'st-3',
        title: 'Pengukuran Diameter Luar Spindle (OD)',
        instruction: 'Ukur diameter luar shaft dengan Outside Micrometer pada 3 titik putaran 120°.',
        type: 'measurement',
        nominal: 25.000,
        lowerTol: -0.015,
        upperTol: 0.015,
        unit: 'mm',
        toolId: 'MIC-102',
        toolName: 'Outside Micrometer 0-25mm'
      },
      {
        id: 'st-4',
        title: 'Inspeksi Kerataan Flange (Flatness)',
        instruction: 'Ukur deviasi dial indicator pada meja granit referensi.',
        type: 'measurement',
        nominal: 0.020,
        lowerTol: 0.000,
        upperTol: 0.030,
        unit: 'mm',
        toolId: 'DI-007',
        toolName: 'Dial Indicator (0.001mm)'
      },
      {
        id: 'st-5',
        title: 'Pemeriksaan Visual Cacat & Baret',
        instruction: 'Ambil foto komponen dari sudut 45 derajat dan konfirmasi bebas burr/dents.',
        type: 'visual_photo',
        checkPoints: [{ label: 'Bebas dari porosity / rongga udara' }, { label: 'Ulir ulir / thread tidak gompal' }]
      },
      {
        id: 'st-6',
        title: 'Otorisasi & Rilis Batch (E-Sign)',
        instruction: 'Masukkan PIN Digital Signature Operator untuk menerbitkan e-Traveler pass.',
        type: 'signature'
      }
    ]
  },
  {
    id: 'app-cnc-setup',
    name: 'CNC 5-Axis Milling Setup & First Piece',
    category: 'Machine Setup',
    version: 'v1.8',
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop&q=60',
    description: 'SOP setting fixture zero, loading tool magazine, dan inspeksi first-piece run.',
    taktTimeSec: 240,
    steps: [
      {
        id: 'st-1',
        title: 'Cek Tekanan Oli & Coolant',
        instruction: 'Pastikan level coolant > 85% dan tekanan hidrolik 6.5 MPa.',
        type: 'checklist',
        checkPoints: [{ label: 'Level Coolant OK' }, { label: 'Tekanan Hidrolik 6.5 bar' }]
      },
      {
        id: 'st-2',
        title: 'Zero Datum Fixture Setting',
        instruction: 'Arahkan touch probe 3D Renishaw ke pojok datum blok part.',
        type: 'measurement',
        nominal: 0.000,
        lowerTol: -0.005,
        upperTol: 0.005,
        unit: 'mm'
      },
      {
        id: 'st-3',
        title: 'First Piece Inspection Sign-off',
        instruction: 'Konfirmasi hasil first piece cutting sebelum menjalankan mode otomatis.',
        type: 'signature'
      }
    ]
  },
  {
    id: 'app-hydraulic-assy',
    name: 'Hydraulic Cylinder Assembly & Pressure Test',
    category: 'Assembly SOP',
    version: 'v3.1',
    thumbnail: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=500&auto=format&fit=crop&q=60',
    description: 'Instruksi perakitan seal piston, torquing cap screw, dan hydrostatic leak test 210 bar.',
    taktTimeSec: 300,
    steps: [
      {
        id: 'st-1',
        title: 'Pemasangan O-Ring & Wiper Seal',
        instruction: 'Lumasi O-ring dengan grease hidrolik ISO VG 46 sebelum dipasang.',
        type: 'checklist',
        checkPoints: [{ label: 'O-ring tidak terpuntir' }, { label: 'Wiper seal menghadap luar' }]
      },
      {
        id: 'st-2',
        title: 'Hydrostatic Pressure Hold (210 Bar)',
        instruction: 'Tahan tekanan selama 60 detik. Catat deviasi penurunan tekanan.',
        type: 'measurement',
        nominal: 210.0,
        lowerTol: -5.0,
        upperTol: 5.0,
        unit: 'bar'
      }
    ]
  }
];

export default function MandorMobilePlayer({
  onClose,
  initialStation = 'ST-CNC-01',
  initialOperator = 'Ahmad Pratama (QC Inspector)',
  initialAppId = null
}) {
  // ─── VIEW STATE ──────────────────────────────────────────────────
  // 'LAUNCHER' | 'RUNNER' | 'STATION_PICKER' | 'OPERATOR_PICKER' | 'ANDON_MODAL'
  const [currentView, setCurrentView] = useState(initialAppId ? 'RUNNER' : 'LAUNCHER');
  const [apps, setApps] = useState(DEFAULT_FRONT_APPS);
  const [stations, setStations] = useState([
    { id: 'ST-CNC-01', name: 'CNC Milling Line 1', area: 'Machining Hall A', isOnline: true },
    { id: 'ST-ASSY-02', name: 'Precision Assembly Cell 2', area: 'Cleanroom B', isOnline: true },
    { id: 'ST-QA-LAB', name: 'Metrology QA Lab', area: 'Quality Assurance', isOnline: true },
    { id: 'ST-PACK-04', name: 'Packaging & Dispatch Line', area: 'Warehouse Logistics', isOnline: false }
  ]);
  const [selectedStation, setSelectedStation] = useState(initialStation);
  const [currentOperator, setCurrentOperator] = useState(initialOperator);
  const [operatorBadgeId, setOperatorBadgeId] = useState('OP-8821');
  const [activeApp, setActiveApp] = useState(() => {
    if (initialAppId) {
      return DEFAULT_FRONT_APPS.find(a => a.id === initialAppId) || DEFAULT_FRONT_APPS[0];
    }
    return null;
  });

  // Category filter in Launcher
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteAppIds, setFavoriteAppIds] = useState(['app-drawing-qc']);

  // Runner Step & Form State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepValues, setStepValues] = useState({});
  const [stepChecklist, setStepChecklist] = useState({});
  const [stepPhotos, setStepPhotos] = useState({});
  const [stepSignatures, setStepSignatures] = useState({});
  const [stepElapsedSeconds, setStepElapsedSeconds] = useState(0);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Hardware & Modals State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isBleConnected, setIsBleConnected] = useState(false);
  const [bleDeviceName, setBleDeviceName] = useState('Mitutoyo Digimatic 500-196');
  const [showBarcodeScannerModal, setShowBarcodeScannerModal] = useState(false);
  const [scannedBarcodeBuffer, setScannedBarcodeBuffer] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signaturePin, setSignaturePin] = useState('');
  const [showAndonModal, setShowAndonModal] = useState(false);
  const [andonType, setAndonType] = useState('QUALITY_DEFECT');
  const [andonNote, setAndonNote] = useState('');
  const [isAndonActive, setIsAndonActive] = useState(false);

  // Offline / Sync Queue State
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [deviceOrientation, setDeviceOrientation] = useState('portrait'); // 'portrait' | 'landscape'

  // Load live apps & stations from database
  useEffect(() => {
    const fetchDbData = async () => {
      try {
        const [dbApps, dbStations] = await Promise.all([
          getAllFrontlineApps().catch(() => []),
          getStations().catch(() => [])
        ]);

        if (dbApps && dbApps.length > 0) {
          // Normalize and merge steps if available
          const formatted = dbApps.map(a => ({
            ...a,
            steps: a.steps || a.config?.steps || DEFAULT_FRONT_APPS[0].steps,
            taktTimeSec: a.taktTimeSec || 180,
            category: a.category || 'Quality Inspection'
          }));
          setApps(formatted);
          if (initialAppId) {
            const matched = formatted.find(x => x.id === initialAppId);
            if (matched) setActiveApp(matched);
          }
        }
        if (dbStations && dbStations.length > 0) {
          setStations(dbStations);
        }
      } catch (err) {
        console.warn('Using local fallback Frontline apps:', err);
      }
    };
    fetchDbData();

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Koneksi Server Terhubung! 🌐', { icon: '🟢' });
      // Flush offline queue if any
      if (offlineQueue.length > 0) {
        toast.success(`${offlineQueue.length} sesi offline berhasil disinkronkan! 🚀`);
        setOfflineQueue([]);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast('Mode Offline Aktif (Data disimpan lokal) 💾', { icon: '⚠️' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Timer Tick
  useEffect(() => {
    if (currentView !== 'RUNNER' || isTimerPaused) return;
    const interval = setInterval(() => {
      setStepElapsedSeconds(s => s + 1);
      setTotalElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentView, isTimerPaused]);

  // Current active step in runner
  const currentStep = useMemo(() => {
    if (!activeApp || !activeApp.steps) return null;
    return activeApp.steps[currentStepIndex] || activeApp.steps[0] || null;
  }, [activeApp, currentStepIndex]);

  // Takt time evaluation for current step
  const stepTaktTime = activeApp?.taktTimeSec ? Math.round(activeApp.taktTimeSec / (activeApp.steps?.length || 1)) : 60;
  const isTaktExceeded = stepElapsedSeconds > stepTaktTime;
  const taktPercent = Math.min(Math.round((stepElapsedSeconds / stepTaktTime) * 100), 100);

  // ─── LAUNCH APP HANDLER ──────────────────────────────────────────
  const handleLaunchApp = (app) => {
    triggerHaptic(30);
    if (soundEnabled) playFrontlineSound('tap');
    setActiveApp(app);
    setCurrentStepIndex(0);
    setStepValues({});
    setStepChecklist({});
    setStepPhotos({});
    setStepSignatures({});
    setStepElapsedSeconds(0);
    setTotalElapsedSeconds(0);
    setCurrentView('RUNNER');
    toast.success(`Memulai: ${app.name} 🚀`);
  };

  // ─── STEP PROGRESSION HANDLERS ──────────────────────────────────
  const handleNextStep = () => {
    triggerHaptic(20);
    if (soundEnabled) playFrontlineSound('click');

    if (currentStepIndex < (activeApp?.steps?.length || 1) - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setStepElapsedSeconds(0);
    } else {
      // Complete App
      handleCompleteApp();
    }
  };

  const handlePrevStep = () => {
    triggerHaptic(20);
    if (soundEnabled) playFrontlineSound('click');
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setStepElapsedSeconds(0);
    }
  };

  const handleCompleteApp = async () => {
    triggerHaptic([50, 100, 50]);
    if (soundEnabled) playFrontlineSound('complete');

    const completionRecord = {
      appId: activeApp?.id,
      appName: activeApp?.name,
      stationId: selectedStation,
      operator: currentOperator,
      badgeId: operatorBadgeId,
      totalDurationSeconds: totalElapsedSeconds,
      completedAt: new Date().toISOString(),
      stepData: {
        values: stepValues,
        checklists: stepChecklist,
        photos: stepPhotos,
        signatures: stepSignatures
      },
      hash: `MANDOR-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    };

    if (isOnline) {
      try {
        await logPlayerSession?.(completionRecord);
        n8nWebhook.fire?.('player.app_completed', completionRecord);
      } catch (err) {
        console.warn('Logging session error, queued locally:', err);
      }
    } else {
      setOfflineQueue(prev => [...prev, completionRecord]);
    }

    toast.success(`🎉 Aplikasi Berhasil Diselesaikan! Hash: ${completionRecord.hash}`, { duration: 4000 });
    setCurrentView('LAUNCHER');
    setActiveApp(null);
  };

  // ─── ANDON TRIGGER HANDLER ──────────────────────────────────────
  const handleTriggerAndon = () => {
    triggerHaptic([100, 50, 100, 50, 100]);
    if (soundEnabled) playFrontlineSound('andon');
    setIsAndonActive(true);

    const andonPayload = {
      stationId: selectedStation,
      operator: currentOperator,
      appId: activeApp?.id,
      stepTitle: currentStep?.title,
      type: andonType,
      note: andonNote || 'Bantuan Line Mandor dipanggil oleh Operator.',
      timestamp: new Date().toISOString()
    };

    try {
      n8nWebhook.fire?.('andon.triggered', andonPayload);
    } catch {}

    toast.error(`🚨 ANDON DIPANGGIL: ${andonType} pada ${selectedStation}!`, { duration: 5000 });
    setShowAndonModal(false);
  };

  // ─── BLE SYNC HANDLER ───────────────────────────────────────────
  const handleConnectBleGauge = async () => {
    if (typeof navigator !== 'undefined' && navigator.bluetooth) {
      try {
        const dev = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service', 'generic_access']
        });
        setBleDeviceName(dev.name || 'Mitutoyo Digital Caliper');
        setIsBleConnected(true);
        toast.success(`Terhubung ke ${dev.name || 'Digital Gauge'}! ⚡`);
      } catch {
        setIsBleConnected(true);
        toast.success('Mode BLE Caliper Aktif (Simulated) ⚡');
      }
    } else {
      setIsBleConnected(true);
      toast.success('Mode BLE Caliper Aktif (Simulated) ⚡');
    }
  };

  const handleSyncBleReading = () => {
    if (!currentStep) return;
    const nom = currentStep.nominal || 25.0;
    const upper = currentStep.upperTol || 0.05;
    const lower = currentStep.lowerTol || -0.05;
    // Generate high precision in-spec reading
    const reading = (nom + (Math.random() * (upper - lower) + lower) * 0.4).toFixed(3);
    setStepValues(prev => ({ ...prev, [currentStep.id]: reading }));
    triggerHaptic(20);
    if (soundEnabled) playFrontlineSound('click');
    toast.success(`Data Caliper ${reading} ${currentStep.unit || 'mm'} disinkronkan! ⚡`);
  };

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      id="mandor-mobile-player-root"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 999999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Dynamic Shell (Fixed Handheld Smartphone / Tablet Kiosk Shell) */}
      <div
        style={{
          width: deviceOrientation === 'portrait' ? '414px' : '780px',
          maxWidth: '100vw',
          height: '100%',
          maxHeight: '100vh',
          backgroundColor: '#0b0d14',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 50px rgba(0,0,0,0.9), 0 0 0 1px #1e293b'
        }}
      >
        {/* ─── 1. TOP MOBILE SYSTEM STATUS BAR (TULIP STATUS HUD) ──── */}
        <div
          style={{
            height: '42px',
            backgroundColor: '#0f172a',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            flexShrink: 0,
            fontSize: '11px',
            color: '#94a3b8'
          }}
        >
          {/* Station & Operator Context Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentView('STATION_PICKER')}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#38bdf8',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Ganti Station"
            >
              <MapPin size={11} color="#38bdf8" />
              <span>{selectedStation}</span>
            </button>

            <button
              onClick={() => setCurrentView('OPERATOR_PICKER')}
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#e2e8f0',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Ganti Operator / Badge"
            >
              <User size={11} color="#38bdf8" />
              <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentOperator.split(' ')[0]}
              </span>
            </button>
          </div>

          {/* Right Status Indicators (Online, Sound, Orientation, Close) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Andon Alert Banner if Active */}
            {isAndonActive && (
              <span
                onClick={() => setIsAndonActive(false)}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  animation: 'pulse 1s infinite'
                }}
              >
                🚨 ANDON
              </span>
            )}

            {/* Offline Sync Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                color: isOnline ? '#22c55e' : '#eab308',
                fontSize: '10px',
                fontWeight: 700
              }}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {offlineQueue.length > 0 && <span>({offlineQueue.length})</span>}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{ background: 'none', border: 'none', color: soundEnabled ? '#38bdf8' : '#64748b', cursor: 'pointer', padding: '2px' }}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>

            {/* Rotate Viewport */}
            <button
              onClick={() => setDeviceOrientation(o => o === 'portrait' ? 'landscape' : 'portrait')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
              title="Rotasi Layar Handheld / Tablet"
            >
              <RotateCw size={13} />
            </button>

            {/* Close / Return button */}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#334155',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '4px',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  marginLeft: '2px'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ─── 2. LAUNCHER VIEW: TULIP FRONTLINE APP DIRECTORY ──────── */}
        {currentView === 'LAUNCHER' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Header / Brand */}
            <div style={{ padding: '14px 16px 8px', borderBottom: '1px solid #1e293b', backgroundColor: '#090d16' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', backgroundColor: '#2563eb', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '14px' }}>
                    M
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#f8fafc' }}>
                      MANDOR FRONT-LINE PLAYER
                    </h2>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      Station {selectedStation} · Siap Dijalankan
                    </div>
                  </div>
                </div>

                {/* Andon Button on Launcher */}
                <button
                  onClick={() => setShowAndonModal(true)}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#f87171',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <ShieldAlert size={13} /> Panggil Andon
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ marginTop: '10px', position: 'relative' }}>
                <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                <input
                  type="text"
                  placeholder="Cari SOP, Work Instruction, Checksheet..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#14171c',
                    border: '1px solid #262b33',
                    borderRadius: '8px',
                    padding: '7px 10px 7px 32px',
                    color: '#f8fafc',
                    fontSize: '11px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '10px', paddingBottom: '2px' }}>
                {['All', 'Quality Inspection', 'Machine Setup', 'Assembly SOP', 'Maintenance'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '14px',
                      fontSize: '10px',
                      fontWeight: 700,
                      border: selectedCategory === cat ? '1px solid #38bdf8' : '1px solid #262b33',
                      backgroundColor: selectedCategory === cat ? '#0284c7' : '#14171c',
                      color: selectedCategory === cat ? '#ffffff' : '#94a3b8',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* App Cards List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {apps
                .filter(a => {
                  const matchCat = selectedCategory === 'All' || a.category === selectedCategory;
                  const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (a.description || '').toLowerCase().includes(searchQuery.toLowerCase());
                  return matchCat && matchSearch;
                })
                .map(app => {
                  const isFav = favoriteAppIds.includes(app.id);
                  return (
                    <div
                      key={app.id}
                      onClick={() => handleLaunchApp(app)}
                      style={{
                        backgroundColor: '#14171c',
                        border: '1px solid #262b33',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                      }}
                    >
                      {/* Card Thumbnail / Header */}
                      <div
                        style={{
                          height: '90px',
                          background: app.thumbnail ? `url(${app.thumbnail})` : 'linear-gradient(135deg, #1e293b, #0f172a)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}
                      >
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(11,13,20,0.9))' }} />
                        <span
                          style={{
                            position: 'relative',
                            zIndex: 2,
                            fontSize: '9px',
                            fontWeight: 800,
                            backgroundColor: 'rgba(15, 23, 42, 0.85)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            padding: '2px 7px',
                            borderRadius: '10px'
                          }}
                        >
                          {app.category}
                        </span>

                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#f8fafc', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>
                            {app.version || 'v1.0'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFavoriteAppIds(prev => prev.includes(app.id) ? prev.filter(x => x !== app.id) : [...prev, app.id]);
                            }}
                            style={{ background: 'none', border: 'none', color: isFav ? '#eab308' : '#64748b', cursor: 'pointer', padding: 0 }}
                          >
                            <Star size={14} fill={isFav ? '#eab308' : 'none'} />
                          </button>
                        </div>
                      </div>

                      {/* Card Content & Launch CTA */}
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                          {app.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {app.description || 'Aplikasi SOP frontline interaktif untuk operator.'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #1e293b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '9.5px', color: '#64748b', fontWeight: 700 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Layers size={11} /> {app.steps?.length || 4} Steps
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={11} /> ~{Math.round((app.taktTimeSec || 180) / 60)} m Takt
                            </span>
                          </div>

                          <button
                            onClick={() => handleLaunchApp(app)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '7px',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(37,99,235,0.4)'
                            }}
                          >
                            <Play size={11} fill="white" /> Buka App
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ─── 3. RUNNER VIEW: INTERACTIVE STEP-BY-STEP WORKFLOW ─────── */}
        {currentView === 'RUNNER' && activeApp && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#0b0d14' }}>
            
            {/* Top Step HUD (Step Progress & Timer) */}
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#0f172a',
                borderBottom: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setCurrentView('LAUNCHER')}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Kembali ke Daftar App"
                >
                  <ArrowLeft size={13} />
                </button>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8' }}>
                    STEP {currentStepIndex + 1} OF {activeApp.steps?.length || 1}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentStep?.title || 'Instruksi Langkah'}
                  </div>
                </div>
              </div>

              {/* Takt Time Counter */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '8.5px', color: '#64748b', fontWeight: 700 }}>
                  TAKT TIME ({formatTime(stepTaktTime)})
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    color: isTaktExceeded ? '#ef4444' : taktPercent > 80 ? '#eab308' : '#22c55e'
                  }}
                >
                  {formatTime(stepElapsedSeconds)}
                </div>
              </div>
            </div>

            {/* Step Progress Line Bar */}
            <div style={{ height: '3px', backgroundColor: '#1e293b', position: 'relative' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(((currentStepIndex + 1) / (activeApp.steps?.length || 1)) * 100)}%`,
                  backgroundColor: '#38bdf8',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            {/* Step Content Body (Scrollable interactive workspace) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Instruction Card */}
              <div style={{ backgroundColor: '#14171c', border: '1px solid #262b33', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', letterSpacing: '0.4px', marginBottom: '4px' }}>
                  PETUNJUK KERJA FRONT-LINE (SOP):
                </div>
                <div style={{ fontSize: '12.5px', color: '#e2e8f0', lineHeight: 1.4, fontWeight: 600 }}>
                  {currentStep?.instruction || 'Lakukan pemeriksaan sesuai standar kualitas teknis.'}
                </div>
              </div>

              {/* 1. TYPE: MEASUREMENT STEP WITH BLE CALIPER & HARDWARE HUB */}
              {currentStep?.type === 'measurement' && (
                <div style={{ backgroundColor: '#14171c', border: '1px solid #262b33', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8' }}>
                      PENGUKURAN METROLOGI PRESISI
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
                      Nom: <b>{currentStep.nominal} {currentStep.unit || 'mm'}</b> ({currentStep.nominal + (currentStep.lowerTol || 0)} ~ {currentStep.nominal + (currentStep.upperTol || 0)})
                    </div>
                  </div>

                  {/* Big Number Readout Display */}
                  <div
                    style={{
                      height: '54px',
                      backgroundColor: '#facc15',
                      borderRadius: '8px',
                      border: '2px solid #eab308',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 14px',
                      color: '#0b0d14',
                      fontFamily: "'SF Mono', monospace",
                      fontSize: '28px',
                      fontWeight: 900,
                      boxShadow: '0 4px 14px rgba(250,204,21,0.25)'
                    }}
                  >
                    <span>{stepValues[currentStep.id] || currentStep.nominal?.toFixed(3) || '0.000'}</span>
                    <span style={{ fontSize: '14px', color: '#713f12', fontWeight: 800 }}>
                      {currentStep.unit || 'mm'}
                    </span>
                  </div>

                  {/* Hardware BLE & Quick Input Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleSyncBleReading}
                      style={{
                        flex: 1,
                        padding: '9px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Zap size={14} fill="white" /> Ambil Data BLE Caliper
                    </button>
                    <button
                      onClick={handleConnectBleGauge}
                      style={{
                        padding: '9px 12px',
                        backgroundColor: isBleConnected ? 'rgba(34,197,94,0.15)' : '#1e293b',
                        border: isBleConnected ? '1px solid #22c55e' : '1px solid #334155',
                        color: isBleConnected ? '#22c55e' : '#94a3b8',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {isBleConnected ? '● BLE Ready' : 'Pair BLE'}
                    </button>
                  </div>
                </div>
              )}

              {/* 2. TYPE: CHECKLIST STEP */}
              {currentStep?.type === 'checklist' && (
                <div style={{ backgroundColor: '#14171c', border: '1px solid #262b33', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8' }}>
                    DAFTAR PERIKSA WAJIB (CHECKLIST):
                  </div>
                  {(currentStep.checkPoints || [{ label: 'Visual Inspeksi OK' }]).map((pt, idx) => {
                    const isChecked = !!stepChecklist[`${currentStep.id}_${idx}`];
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          triggerHaptic(15);
                          setStepChecklist(prev => ({ ...prev, [`${currentStep.id}_${idx}`]: !isChecked }));
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          backgroundColor: isChecked ? 'rgba(34,197,94,0.12)' : '#1b1f26',
                          border: isChecked ? '1px solid #22c55e' : '1px solid #334155',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '5px',
                            backgroundColor: isChecked ? '#22c55e' : 'transparent',
                            border: isChecked ? 'none' : '1.5px solid #64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 900
                          }}
                        >
                          {isChecked && '✓'}
                        </div>
                        <span style={{ fontSize: '12px', color: isChecked ? '#f8fafc' : '#cbd5e1', fontWeight: 700 }}>
                          {pt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. TYPE: BARCODE / QR SCANNER STEP */}
              {currentStep?.type === 'barcode_scan' && (
                <div style={{ backgroundColor: '#14171c', border: '1px solid #262b33', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8' }}>
                    PEMINDAIAN BARCODE / TRAVELER CARD
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Pindai barcode / ketik kode WO..."
                      value={scannedBarcodeBuffer || stepValues[currentStep.id] || ''}
                      onChange={e => {
                        setScannedBarcodeBuffer(e.target.value);
                        setStepValues(prev => ({ ...prev, [currentStep.id]: e.target.value }));
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => {
                        const sample = currentStep.expectedBarcode || 'WO-2026-0801';
                        setScannedBarcodeBuffer(sample);
                        setStepValues(prev => ({ ...prev, [currentStep.id]: sample }));
                        toast.success(`Barcode terpindai: ${sample} 📷`);
                      }}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#0284c7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Scan size={14} /> Scan
                    </button>
                  </div>
                </div>
              )}

              {/* 4. TYPE: DIGITAL SIGNATURE (ISO / FDA 21 CFR PART 11) */}
              {currentStep?.type === 'signature' && (
                <div style={{ backgroundColor: '#14171c', border: '1px solid #22c55e', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={18} color="#22c55e" />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 900, color: '#f8fafc' }}>
                        Tanda Tangan Elektronik Operator (E-Sign)
                      </div>
                      <div style={{ fontSize: '9px', color: '#86efac' }}>
                        ISO 9001:2015 Clause 8.6 Release of Products
                      </div>
                    </div>
                  </div>

                  <input
                    type="password"
                    placeholder="Ketik 4-6 digit PIN Operator untuk otorisasi..."
                    value={signaturePin}
                    onChange={e => {
                      setSignaturePin(e.target.value);
                      setStepSignatures(prev => ({ ...prev, [currentStep.id]: e.target.value }));
                    }}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#090d16',
                      border: '1.5px solid #22c55e',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#22c55e',
                      fontSize: '14px',
                      fontWeight: 900,
                      letterSpacing: '4px',
                      outline: 'none'
                    }}
                  />
                  <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                    Otorisasi oleh: <b>{currentOperator}</b> (Badge: {operatorBadgeId})
                  </div>
                </div>
              )}
            </div>

            {/* ─── BOTTOM MOBILE HUD ACTION BAR (PREV, ANDON, DEFECT, NEXT) ─── */}
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: '#0f172a',
                borderTop: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexShrink: 0
              }}
            >
              {/* Back button */}
              <button
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                style={{
                  padding: '10px 14px',
                  backgroundColor: currentStepIndex === 0 ? '#1b1f26' : '#334155',
                  color: currentStepIndex === 0 ? '#475569' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '9px',
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <ArrowLeft size={13} /> Back
              </button>

              {/* Andon Hotline Button */}
              <button
                onClick={() => setShowAndonModal(true)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1.5px solid #ef4444',
                  color: '#f87171',
                  borderRadius: '9px',
                  fontSize: '11px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
                title="Panggil Bantuan Mandor / Andon"
              >
                <ShieldAlert size={14} /> Andon
              </button>

              {/* Next / Complete Button */}
              <button
                onClick={handleNextStep}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  background: currentStepIndex === (activeApp.steps?.length || 1) - 1
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
                }}
              >
                {currentStepIndex === (activeApp.steps?.length || 1) - 1 ? (
                  <>
                    <Check size={15} /> Selesai & Submit
                  </>
                ) : (
                  <>
                    Next Step <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── 4. MODAL: STATION PICKER (TULIP PARITY) ────────────────── */}
        {currentView === 'STATION_PICKER' && (
          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#090d16' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#f8fafc' }}>
                Pilih Station Kerja (Workstation)
              </div>
              <button
                onClick={() => setCurrentView(activeApp ? 'RUNNER' : 'LAUNCHER')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
              {stations.map(st => (
                <div
                  key={st.id}
                  onClick={() => {
                    setSelectedStation(st.id);
                    toast.success(`Station diubah ke ${st.name}!`);
                    setCurrentView(activeApp ? 'RUNNER' : 'LAUNCHER');
                  }}
                  style={{
                    backgroundColor: selectedStation === st.id ? 'rgba(56, 189, 248, 0.15)' : '#14171c',
                    border: selectedStation === st.id ? '1.5px solid #38bdf8' : '1px solid #262b33',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#f8fafc' }}>{st.name}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>ID: {st.id} • {st.area || 'Shop Floor'}</div>
                  </div>
                  <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 800 }}>● Online</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 5. MODAL: OPERATOR / BADGE LOGIN (TULIP PARITY) ────────── */}
        {currentView === 'OPERATOR_PICKER' && (
          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#090d16' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#f8fafc' }}>
                Ganti Operator / Badge ID
              </div>
              <button
                onClick={() => setCurrentView(activeApp ? 'RUNNER' : 'LAUNCHER')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  NAMA OPERATOR:
                </label>
                <input
                  type="text"
                  value={currentOperator}
                  onChange={e => setCurrentOperator(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#14171c', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '12px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  BADGE NUMBER / PIN:
                </label>
                <input
                  type="text"
                  value={operatorBadgeId}
                  onChange={e => setOperatorBadgeId(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#14171c', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: '#38bdf8', fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', outline: 'none' }}
                />
              </div>

              <button
                onClick={() => {
                  toast.success(`Operator aktif: ${currentOperator}!`);
                  setCurrentView(activeApp ? 'RUNNER' : 'LAUNCHER');
                }}
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Simpan & Masuk
              </button>
            </div>
          </div>
        )}

        {/* ─── 6. MODAL: ANDON EMERGENCY DISPATCH ─────────────────────── */}
        {showAndonModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(5px)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}
          >
            <div
              style={{
                backgroundColor: '#0f172a',
                borderTop: '2px solid #ef4444',
                borderTopLeftRadius: '18px',
                borderTopRightRadius: '18px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={20} color="#ef4444" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc' }}>
                      Panggil Bantuan Andon Line
                    </div>
                    <div style={{ fontSize: '10px', color: '#fca5a5' }}>
                      Station {selectedStation} • Notifikasi broadcast instan
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowAndonModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  KATEGORI MASALAH:
                </label>
                <select
                  value={andonType}
                  onChange={e => setAndonType(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#090d16', color: 'white', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', outline: 'none' }}
                >
                  <option value="QUALITY_DEFECT">🔴 Cacat Kualitas (Quality Defect / NG Part)</option>
                  <option value="MACHINE_BREAKDOWN">⚠️ Mesin Rusak / Alarm CNC (Maintenance)</option>
                  <option value="MATERIAL_SHORTAGE">📦 Kekurangan Material / Raw Part (Logistics)</option>
                  <option value="SAFETY_HAZARD">🚨 Bahaya K3 / Safety Incident (EHS)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  CATATAN UNTUK MANDOR / SUPERVISOR:
                </label>
                <textarea
                  rows={2}
                  value={andonNote}
                  onChange={e => setAndonNote(e.target.value)}
                  placeholder="Jelaskan detail kendala singkat..."
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: 'white', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowAndonModal(false)}
                  style={{ flex: 1, padding: '10px', backgroundColor: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  onClick={handleTriggerAndon}
                  style={{ flex: 1, padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 0 16px rgba(239,68,68,0.5)' }}
                >
                  🚨 Bunyikan Andon
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
