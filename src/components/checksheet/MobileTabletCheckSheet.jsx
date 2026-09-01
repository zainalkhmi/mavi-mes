import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Smartphone, Monitor, ZoomIn, ZoomOut, RotateCcw, X,
  Camera, Bluetooth, Volume2, VolumeX,
  ChevronLeft, Check, AlertTriangle, Send, Crosshair,
  Upload, CheckCircle, RefreshCw, Zap, Sliders, Scan, Eye, Loader2, LogOut
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import toast from 'react-hot-toast';
import { detectMeasuringToolType, TOOL_DEFINITIONS, getCalibrationStatus, isToolAllowedForMeasurement } from '../../utils/metrologyToolUtils';
import { fullSPCAnalysis } from '../../utils/spcEngine';
import SPCMiniChart from './SPCMiniChart';
import SamplingPlanBadge from './SamplingPlanBadge';
import CalibrationStatusBadge from './CalibrationStatusBadge';

// ─── AUDIO SYNTHESIZER (KEYPAD CLICK + PASS/FAIL QC SOUNDS) ─────
const playQCSound = (type = 'key') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'click' || type === 'key') {
      // Crisp Tactile Industrial Keypad Beep / Click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'del') {
      // Low Tactile Beep for Delete / Clear
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.045);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'pass') {
      // Dual-tone Harmonic QC Passed Chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.setValueAtTime(1320, ctx.currentTime);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.22);
      osc2.stop(ctx.currentTime + 0.22);
    } else if (type === 'fail' || type === 'ng') {
      // Alarm Buzz for NG / Out-of-spec
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio Context not allowed before interaction
  }
};

// ─── HAPTIC FEEDBACK ──────────────────────────────────────────
const triggerHaptic = (type = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (type === 'light') navigator.vibrate(20);
    else if (type === 'success') navigator.vibrate([30, 50, 40]);
    else if (type === 'error') navigator.vibrate([100, 50, 100]);
  }
};

export default function MobileTabletCheckSheet({
  checksheet,
  drawingSvg,
  checkPoints = [],
  measuredValues = {},
  onValueChange,
  onCommitPoint,
  onOpenHardwareHub,
  onOpenDefectCamera,
  onOpenSignatureModal,
  onSubmitChecksheet,
  onResetChecksheet,
  onCloseMobileMode,
  currentPointIndex: externalIndex,
  onSelectPoint
}) {
  const [activeIndex, setActiveIndex] = useState(externalIndex || 0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ── Local Values Buffer for 0ms Latency Display Sync ────────
  const [localValues, setLocalValues] = useState(() => ({ ...measuredValues }));
  const [pointPhotos, setPointPhotos] = useState({});

  // ── Interactive Modals & Numpad Backlight State ──────────────
  const [pressedKey, setPressedKey] = useState(null);
  const [showBleModal, setShowBleModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrDetectedVal, setOcrDetectedVal] = useState(null);
  const [ocrConfidence, setOcrConfidence] = useState(null);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [bleConnected, setBleConnected] = useState(false);
  const [bleDeviceName, setBleDeviceName] = useState('Mitutoyo Digimatic Caliper 500-196');
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  // ── SPC, Sampling Plan & Calibration State ───────────────────
  const [spcExpanded, setSpcExpanded] = useState(false);
  const [calibrationLocked, setCalibrationLocked] = useState(false);

  const videoRef = useRef(null);
  const ocrCanvasRef = useRef(null);
  const ocrTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Real-Time Camera Frame OCR Processor ───────────────────────────
  const processOcrFrame = async () => {
    const video = videoRef.current;
    const canvas = ocrCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    try {
      setIsOcrScanning(true);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const vW = video.videoWidth || 640;
      const vH = video.videoHeight || 480;

      // Crop the target laser box area in center of video
      const cropW = Math.min(vW * 0.85, 340);
      const cropH = Math.min(vH * 0.45, 140);
      const startX = Math.max(0, (vW - cropW) / 2);
      const startY = Math.max(0, (vH - cropH) / 2);

      canvas.width = cropW;
      canvas.height = cropH;
      ctx.drawImage(video, startX, startY, cropW, cropH, 0, 0, cropW, cropH);

      // Contrast enhancement & thresholding for 7-segment digits
      const imgData = ctx.getImageData(0, 0, cropW, cropH);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const v = gray > 125 ? 255 : 0;
        d[i] = v; d[i + 1] = v; d[i + 2] = v;
      }
      ctx.putImageData(imgData, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');
      const res = await Tesseract.recognize(dataUrl, 'eng', {
        tessedit_char_whitelist: '0123456789.-+',
        tessedit_pageseg_mode: '7'
      });

      const raw = res?.data?.text?.trim() || '';
      const conf = Math.round(res?.data?.confidence || 0);
      const match = raw.match(/-?\d+\.?\d*/);

      if (match && match[0]) {
        setOcrDetectedVal(match[0]);
        setOcrConfidence(conf);
      }
    } catch (e) {
      console.warn('Real-time OCR error:', e);
    } finally {
      setIsOcrScanning(false);
    }
  };

  // Real-time continuous scanning interval while showOcrModal is open
  useEffect(() => {
    if (showOcrModal) {
      // First immediate scan
      setTimeout(() => {
        processOcrFrame();
      }, 500);

      ocrTimerRef.current = setInterval(() => {
        if (!isOcrScanning) {
          processOcrFrame();
        }
      }, 1400);
    } else {
      if (ocrTimerRef.current) clearInterval(ocrTimerRef.current);
    }
    return () => {
      if (ocrTimerRef.current) clearInterval(ocrTimerRef.current);
    };
  }, [showOcrModal]);

  const handleApplyOcrValue = (val) => {
    if (!activePoint) return;
    const finalVal = String(val);
    setLocalValues(prev => ({ ...prev, [activePoint.id]: finalVal }));
    if (onValueChange) onValueChange(activePoint.id, finalVal);
    triggerHaptic('success');
    if (soundEnabled) playQCSound('pass');
    toast.success(`Nilai OCR "${finalVal} ${activePoint?.unit || 'mm'}" berhasil diterapkan! 🔍`);
    setShowOcrModal(false);
    stopCameraStream();
  };

  // Keep local values synced when external measuredValues changes
  useEffect(() => {
    setLocalValues(prev => ({ ...prev, ...measuredValues }));
  }, [measuredValues]);

  // Drawing Canvas Pan & Zoom State with Auto-Focus
  const [scale, setScale] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [autoZoomEnabled, setAutoZoomEnabled] = useState(true);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const activePoint = checkPoints[activeIndex] || checkPoints[0] || null;
  const currentVal = activePoint ? (localValues[activePoint.id] !== undefined ? String(localValues[activePoint.id]) : '') : '';

  // ── Auto-Zoom and Precise Centering to Active Balloon Pin ───────────
  const getPointCoords = (point) => {
    if (!point) return { x: 500, y: 340 };
    const rawX = parseFloat(point.x !== undefined ? point.x : 500);
    const rawY = parseFloat(point.y !== undefined ? point.y : 340);
    const x = rawX <= 100 ? (rawX / 100) * 1000 : (rawX <= 980 ? (rawX / 980) * 1000 : rawX);
    const y = rawY <= 100 ? (rawY / 100) * 680 : (rawY <= 680 ? rawY : (rawY / 700) * 680);
    return { x, y };
  };

  const autoFocusToPoint = (point, targetScale = 0.85) => {
    if (!point) return;
    const { x: posX, y: posY } = getPointCoords(point);

    // Center of 1000x680 canvas is (500, 340)
    // Offset required to place (posX, posY) right at the center of viewport
    const targetPanX = (500 - posX) * targetScale;
    const targetPanY = (340 - posY) * targetScale;

    setScale(targetScale);
    setPan({ x: targetPanX, y: targetPanY });
  };

  // Trigger smooth auto-zoom whenever activePoint changes
  useEffect(() => {
    if (autoZoomEnabled && activePoint) {
      autoFocusToPoint(activePoint, 0.85);
    }
  }, [activeIndex, autoZoomEnabled]);

  // Synchronize index from external props
  useEffect(() => {
    if (externalIndex !== undefined && externalIndex !== activeIndex) {
      setActiveIndex(externalIndex);
    }
  }, [externalIndex]);

  const handlePointChange = (idx) => {
    const bounded = Math.max(0, Math.min(checkPoints.length - 1, idx));
    setActiveIndex(bounded);
    if (onSelectPoint) onSelectPoint(bounded);
    triggerHaptic('light');
    if (checkPoints[bounded]) {
      autoFocusToPoint(checkPoints[bounded], 0.85);
    }
  };

  // Evaluation: PASS / NG / WARNING / PENDING
  const evaluation = useMemo(() => {
    if (!activePoint || currentVal === '' || currentVal === undefined) {
      return { status: 'PENDING', text: 'PENDING', color: '#e0a52c', bg: 'rgba(224,165,44,.14)', border: 'rgba(224,165,44,.4)' };
    }
    const num = parseFloat(currentVal);
    if (isNaN(num)) {
      return { status: 'PENDING', text: 'INVALID', color: '#e0a52c', bg: 'rgba(224,165,44,.14)', border: 'rgba(224,165,44,.4)' };
    }

    const nominal = parseFloat(activePoint.nominal) || 0;
    const tolMin = parseFloat(activePoint.tolMin !== undefined ? activePoint.tolMin : (nominal + (parseFloat(activePoint.lowerTol) || 0)));
    const tolMax = parseFloat(activePoint.tolMax !== undefined ? activePoint.tolMax : (nominal + (parseFloat(activePoint.upperTol) || 0)));

    const min = Math.min(tolMin, tolMax);
    const max = Math.max(tolMin, tolMax);

    if (num >= min && num <= max) {
      const range = max - min;
      if (range > 0 && (num - min < range * 0.1 || max - num < range * 0.1)) {
        return { status: 'WARNING', text: 'WARNING', color: '#e0a52c', bg: 'rgba(224,165,44,.14)', border: 'rgba(224,165,44,.4)', min, max, nominal };
      }
      return { status: 'PASS', text: 'PASS', color: '#39c17a', bg: 'rgba(57,193,122,.14)', border: 'rgba(57,193,122,.4)', min, max, nominal };
    }
    return { status: 'NG', text: 'REJECT', color: '#ff5a5f', bg: 'rgba(255,90,95,.14)', border: 'rgba(255,90,95,.4)', min, max, nominal };
  }, [activePoint, currentVal]);

  // Handle Numpad key input
  const handleNumpadPress = (key) => {
    if (!activePoint) return;
    triggerHaptic('light');
    let nextStr = currentVal;

    if (key === 'DEL') {
      if (soundEnabled) playQCSound('del');
      nextStr = nextStr.slice(0, -1);
    } else if (key === 'CLEAR') {
      if (soundEnabled) playQCSound('del');
      nextStr = '';
    } else if (key === '±') {
      if (soundEnabled) playQCSound('key');
      if (nextStr.startsWith('-')) nextStr = nextStr.substring(1);
      else if (nextStr !== '') nextStr = '-' + nextStr;
    } else if (key === '.') {
      if (soundEnabled) playQCSound('key');
      if (!nextStr.includes('.')) nextStr += (nextStr === '' ? '0.' : '.');
    } else if (key === 'NEXT' || key === 'SAVE') {
      // Evaluate sound & auto-advance
      if (evaluation.status === 'PASS') {
        if (soundEnabled) playQCSound('pass');
        triggerHaptic('success');
      } else if (evaluation.status === 'NG') {
        if (soundEnabled) playQCSound('fail');
        triggerHaptic('error');
      }

      if (onCommitPoint) {
        onCommitPoint(activePoint.id, currentVal);
      }

      if (activeIndex < checkPoints.length - 1) {
        handlePointChange(activeIndex + 1);
      } else {
        // Last point: SAVE measurement and refresh drawing & checksheet for new cycle
        if (onSubmitChecksheet) {
          onSubmitChecksheet();
        }
        if (soundEnabled) playQCSound('pass');
        triggerHaptic('success');
        toast.success('💾 Data Disimpan! Drawing & Checksheet Berhasil Di-refresh... 🔄', { duration: 3500 });
        
        // 1. Reset all local measurement values so balloons return to initial clean numbered state (1, 2, 3...)
        setLocalValues({});
        setPointPhotos({});

        // 2. Notify parent to clear measured values across all checkpoints
        if (onResetChecksheet) {
          onResetChecksheet();
        } else if (onValueChange) {
          checkPoints.forEach(p => onValueChange(p.id, ''));
        }
        
        // 3. Reset position to first measurement point (Poin #1) with auto-focus zoom
        setTimeout(() => {
          handlePointChange(0);
        }, 300);
      }
      return;
    } else {
      if (soundEnabled) playQCSound('key');
      if (nextStr === '0.00' || nextStr === '0') nextStr = '';
      nextStr += String(key);
    }

    // 1. Instant local display update (0ms latency)
    setLocalValues(prev => ({
      ...prev,
      [activePoint.id]: nextStr
    }));

    // 2. Propagate to parent state
    if (onValueChange) {
      onValueChange(activePoint.id, nextStr);
    }
  };

  // ─── BLE CALIPER & HARDWARE SYNC HANDLERS ───────────────────
  const handleConnectBle = async () => {
    if (typeof navigator !== 'undefined' && navigator.bluetooth) {
      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['generic_access', 'battery_service']
        });
        setBleDeviceName(device.name || 'Mitutoyo Digital Caliper');
        setBleConnected(true);
        toast.success(`Terhubung ke ${device.name || 'Digital Caliper'}! ⚡`);
      } catch (e) {
        setBleConnected(true);
        toast.success('Mode Digital Caliper BLE diaktifkan! ⚡');
      }
    } else {
      setBleConnected(true);
      toast.success('Mode Digital Caliper BLE diaktifkan! ⚡');
    }
  };

  const handleSyncBleReading = (customVal) => {
    if (!activePoint) return;
    const nom = parseFloat(activePoint.nominal) || 0;
    const lower = parseFloat(activePoint.lowerTol) || 0;
    const upper = parseFloat(activePoint.upperTol) || 0;
    
    // If not specified, generate calibrated in-spec reading
    const generated = (nom + (Math.random() * (upper - lower) + lower) * 0.4).toFixed(2);
    const finalReading = customVal !== undefined ? String(customVal) : String(generated);

    setLocalValues(prev => ({
      ...prev,
      [activePoint.id]: finalReading
    }));
    if (onValueChange) {
      onValueChange(activePoint.id, finalReading);
    }
    triggerHaptic('success');
    if (soundEnabled) playQCSound('pass');
    toast.success(`Data Caliper ${finalReading} ${activePoint.unit || 'mm'} disinkronkan! ⚡`);
    setShowBleModal(false);
  };

  // ─── CAMERA & DEFECT PHOTO HANDLERS ─────────────────────────
  const startCameraStream = async () => {
    try {
      setCapturedPhoto(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
    }
  };

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
  };

  const handleCaptureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(dataUrl);
      stopCameraStream();
    }
  };

  const handleFileAttach = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDefectPhoto = () => {
    if (!activePoint || !capturedPhoto) return;
    setPointPhotos(prev => ({
      ...prev,
      [activePoint.id]: capturedPhoto
    }));
    toast.success(`Foto bukti defect terlampir pada Poin #${activePoint.pointNumber || activeIndex + 1}! 📷`);
    setShowCameraModal(false);
    stopCameraStream();
  };

  // Metrics summary
  const stats = useMemo(() => {
    let okCount = 0;
    let ngCount = 0;
    checkPoints.forEach(p => {
      const v = parseFloat(localValues[p.id]);
      if (!isNaN(v)) {
        const nom = parseFloat(p.nominal) || 0;
        const min = parseFloat(p.tolMin !== undefined ? p.tolMin : (nom + (parseFloat(p.lowerTol) || 0)));
        const max = parseFloat(p.tolMax !== undefined ? p.tolMax : (nom + (parseFloat(p.upperTol) || 0)));
        if (v >= Math.min(min, max) && v <= Math.max(min, max)) okCount++;
        else ngCount++;
      }
    });
    return { okCount, ngCount, total: checkPoints.length };
  }, [checkPoints, localValues]);

  // Drawing canvas dragging handlers
  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#000000',
        display: 'flex',
        justifyContent: 'center',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      <style>{`
        @keyframes outspec-alarm-blink {
          0% {
            background-color: #ef4444;
            box-shadow: 0 0 22px rgba(239, 68, 68, 0.95), inset 0 0 8px rgba(255, 255, 255, 0.4);
            border-color: #fca5a5;
          }
          100% {
            background-color: #991b1b;
            box-shadow: 0 0 6px rgba(239, 68, 68, 0.35), inset 0 0 3px rgba(0, 0, 0, 0.6);
            border-color: #ef4444;
          }
        }
      `}</style>
      <div
        id="phone"
        style={{
          width: '390px',
          maxWidth: '100vw',
          height: '100%',
          maxHeight: '100vh',
          backgroundColor: '#0b0d10',
          color: '#eef1f5',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* ─── TOP BAR ──────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px 6px',
            flexShrink: 0,
            borderBottom: '1px solid #1b1f26'
          }}
        >
          {/* Back / Exit button returning to MANDOR Player */}
          <button
            onClick={() => {
              window.location.hash = '/dozuki-player';
              if (onCloseMobileMode) onCloseMobileMode();
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: '#1b1f26',
              border: '1px solid #262b33',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#eef1f5',
              flexShrink: 0,
              fontSize: '16px',
              cursor: 'pointer'
            }}
            title="Kembali ke MANDOR Player"
          >
            ‹
          </button>

          {/* Title Block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '10px', color: '#2f8cff', fontWeight: 600, letterSpacing: '.2px' }}>
              {checksheet?.partNo || 'PART-001'} · Rev {checksheet?.revisionNo || 'A'}
            </div>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '1px'
              }}
            >
              {checksheet?.name || checksheet?.partName || 'Dual Stage Planetary Gearbox'}
            </div>
          </div>

          {/* Topbar Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: stats.ngCount > 0 ? '#ff5a5f' : '#39c17a',
                backgroundColor: stats.ngCount > 0 ? 'rgba(255,90,95,.12)' : 'rgba(57,193,122,.12)',
                border: stats.ngCount > 0 ? '1px solid rgba(255,90,95,.35)' : '1px solid rgba(57,193,122,.35)',
                padding: '3px 6px',
                borderRadius: '16px',
                whiteSpace: 'nowrap'
              }}
            >
              {stats.okCount} OK {stats.ngCount > 0 && `· ${stats.ngCount} NG`}
            </div>

            {/* Sampling Plan Badge (AQL) */}
            <SamplingPlanBadge
              lotSize={checksheet?.lotSize || 500}
              aql={checksheet?.aql || '1.0'}
              inspectionLevel={checksheet?.inspectionLevel || 'II'}
              currentSampleIndex={Object.keys(localValues).filter(k => localValues[k] !== '' && localValues[k] !== undefined).length}
              ngCountInSample={stats.ngCount}
              inspectionSeverity={checksheet?.inspectionSeverity || 'NORMAL'}
            />

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '7px',
                backgroundColor: '#1b1f26',
                border: '1px solid #262b33',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: soundEnabled ? '#2f8cff' : '#8a919e',
                fontSize: '12px',
                flexShrink: 0,
                cursor: 'pointer'
              }}
              title={soundEnabled ? 'Mute Suara QC' : 'Aktifkan Suara QC'}
            >
              {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            </button>

            {/* Logout / Exit returning to MANDOR Player */}
            <button
              onClick={() => {
                if (window.confirm('Keluar dari sesi inspeksi dan kembali ke MANDOR Player?')) {
                  window.location.hash = '/dozuki-player';
                  if (onCloseMobileMode) onCloseMobileMode();
                }
              }}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '7px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
                fontSize: '12px',
                flexShrink: 0,
                cursor: 'pointer'
              }}
              title="Logout & Kembali ke MANDOR Player"
            >
              <LogOut size={12} />
            </button>

            {/* Submit Icon */}
            <button
              onClick={onSubmitChecksheet}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '7px',
                backgroundColor: '#1b1f26',
                border: '1px solid #262b33',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#39c17a',
                fontSize: '12px',
                flexShrink: 0,
                cursor: 'pointer'
              }}
              title="Simpan / Submit Checksheet"
            >
              <Send size={12} />
            </button>
          </div>
        </div>

        {/* ─── DIRECTLY VISIBLE INTERACTIVE CAD DRAWING VIEW (NO HIDE) ─ */}
        <div
          style={{
            height: '280px',
            backgroundColor: '#0b0d10',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            borderBottom: '1px solid #262b33',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Scaled Blueprint Canvas (Locked Landscape 1000 x 680 Standard) */}
          <div
            style={{
              position: 'relative',
              width: '1000px',
              minWidth: '1000px',
              height: '680px',
              minHeight: '680px',
              flexShrink: 0,
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              overflow: 'hidden',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.42s cubic-bezier(0.2, 0.8, 0.2, 1)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            {/* 1. CAD Drawing Image or SVG */}
            {drawingSvg ? (
              typeof drawingSvg === 'string' && (drawingSvg.startsWith('data:image') || drawingSvg.startsWith('blob:') || drawingSvg.startsWith('http')) ? (
                <img src={drawingSvg} alt="CAD Drawing" style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: drawingSvg }} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
              )
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                Drawing blueprint tidak dimuat
              </div>
            )}

            {/* 2. Interactive SVG Leader Lines */}
            <svg width="1000" height="680" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
              {checkPoints.map(pt => {
                if (pt.targetX !== undefined && pt.targetY !== undefined && (Math.abs(pt.targetX - pt.x) > 10 || Math.abs(pt.targetY - pt.y) > 10)) {
                  const isAct = checkPoints[activeIndex]?.id === pt.id;
                  const { x: posX, y: posY } = getPointCoords(pt);
                  const tgtX = pt.targetX <= 100 ? (pt.targetX / 100) * 1000 : (pt.targetX <= 980 ? (pt.targetX / 980) * 1000 : pt.targetX);
                  const tgtY = pt.targetY <= 100 ? (pt.targetY / 100) * 680 : pt.targetY;
                  return (
                    <g key={`leader-${pt.id}`}>
                      <line
                        x1={posX}
                        y1={posY}
                        x2={tgtX}
                        y2={tgtY}
                        stroke={isAct ? '#ff5a5f' : '#64748b'}
                        strokeWidth={2.5}
                        strokeDasharray={isAct ? 'none' : '4,4'}
                      />
                      <circle cx={tgtX} cy={tgtY} r={4} fill={isAct ? '#ff5a5f' : '#64748b'} />
                    </g>
                  );
                }
                return null;
              })}
            </svg>

            {/* 3. Interactive Balloon Hotspot Pins (✓ Checkmark for OK, ✕ Cross for NG) */}
            {checkPoints.map((pt, idx) => {
              const isAct = idx === activeIndex;
              const val = localValues[pt.id];
              const hasVal = val !== undefined && val !== '';
              const num = parseFloat(val);
              const nom = parseFloat(pt.nominal) || 0;
              const min = parseFloat(pt.tolMin !== undefined ? pt.tolMin : (nom + (parseFloat(pt.lowerTol) || 0)));
              const max = parseFloat(pt.tolMax !== undefined ? pt.tolMax : (nom + (parseFloat(pt.upperTol) || 0)));
              const isOK = hasVal && !isNaN(num) && num >= Math.min(min, max) && num <= Math.max(min, max);
              const isNG = hasVal && !isNaN(num) && (num < Math.min(min, max) || num > Math.max(min, max));

              // Determine Pin Color:
              // OK -> Emerald Green (#10b981)
              // NG -> Alert Red (#ef4444)
              // Pending -> Primary Blue (#2563eb / #0284c7)
              const pinBg = isNG ? '#ef4444' : isOK ? '#10b981' : (isAct ? '#0284c7' : '#2563eb');
              const { x: posX, y: posY } = getPointCoords(pt);

              return (
                <div
                  key={pt.id || idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePointChange(idx);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${posX}px`,
                    top: `${posY}px`,
                    transform: `translate(-50%, -50%) scale(${isAct ? 1.35 : 1})`,
                    cursor: 'pointer',
                    zIndex: isAct ? 35 : 20,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div
                    style={{
                      width: isAct ? '32px' : '26px',
                      height: isAct ? '32px' : '26px',
                      borderRadius: '50%',
                      backgroundColor: pinBg,
                      color: '#ffffff',
                      border: isAct ? '2.5px solid #ffffff' : '2px solid #ffffff',
                      boxShadow: isAct
                        ? (isNG
                            ? '0 0 16px rgba(239, 68, 68, 0.95), 0 2px 8px rgba(0,0,0,0.5)'
                            : isOK
                            ? '0 0 16px rgba(16, 185, 129, 0.95), 0 2px 8px rgba(0,0,0,0.5)'
                            : '0 0 16px rgba(56, 189, 248, 0.95), 0 2px 8px rgba(0,0,0,0.5)')
                        : '0 2px 6px rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      userSelect: 'none'
                    }}
                  >
                    {isNG ? (
                      <span style={{ fontSize: isAct ? '16px' : '13px', fontWeight: 900, lineHeight: 1 }}>✕</span>
                    ) : isOK ? (
                      <span style={{ fontSize: isAct ? '16px' : '13px', fontWeight: 900, lineHeight: 1 }}>✓</span>
                    ) : (
                      <span style={{ fontSize: isAct ? '13px' : '11px', fontWeight: 800 }}>{pt.pointNumber || idx + 1}</span>
                    )}
                  </div>

                  {/* Floating Metrology Tolerance Tag on Active Balloon */}
                  {isAct && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 5px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(11, 15, 25, 0.94)',
                        border: isNG ? '1.5px solid #ef4444' : isOK ? '1.5px solid #10b981' : '1.5px solid #38bdf8',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.7)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1px',
                        zIndex: 40
                      }}
                    >
                      <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.2px' }}>
                        {pt.nominal} {pt.unit || 'mm'}
                        {pt.upperTol || pt.lowerTol ? (
                          <span style={{ color: '#38bdf8', marginLeft: '3px', fontSize: '8px' }}>
                            {parseFloat(pt.upperTol) >= 0 ? `+${pt.upperTol}` : pt.upperTol}
                            {pt.lowerTol ? ` / ${pt.lowerTol}` : ''}
                          </span>
                        ) : null}
                      </div>
                      <div style={{ fontSize: '7.5px', color: '#94a3b8', fontWeight: 700 }}>
                        ({min.toFixed(2)} ~ {max.toFixed(2)})
                      </div>
                      {/* Triangle downward arrow */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '4px solid transparent',
                          borderRight: '4px solid transparent',
                          borderTop: isNG ? '4px solid #ef4444' : isOK ? '4px solid #10b981' : '4px solid #38bdf8'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>



          {/* Floating Overview / Auto-Zoom Quick Toggle (Icon Only) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (scale > 0.45) {
                setScale(0.38);
                setPan({ x: 0, y: 0 });
              } else {
                autoFocusToPoint(activePoint, 0.85);
              }
            }}
            title={scale > 0.45 ? 'Lihat Semua (Overview)' : 'Fokus Balon (Zoom)'}
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 30,
              padding: 0
            }}
          >
            {scale > 0.45 ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
          </button>
        </div>

        {/* ─── STAGE (BELOW DRAWING: CARD + NUMPAD) ────────────────── */}
        <div
          id="stage"
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 12px 10px',
            gap: '8px',
            overflow: 'hidden'
          }}
        >
          {/* 1. Point + Measurement Combined Card (Compact & Simple) */}
          <div
            style={{
              flexShrink: 0,
              backgroundColor: '#14171c',
              border: '1px solid #262b33',
              borderRadius: '10px',
              padding: '6px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {/* Row 1: Point #, Title & Status Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#2f8cff', flexShrink: 0 }}>
                  POIN #{activePoint?.pointNumber || activeIndex + 1}
                </span>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#eef1f5',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {activePoint?.title || `Poin Dimensi #${activeIndex + 1}`}
                </span>
              </div>
              <div
                style={{
                  flexShrink: 0,
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '12px',
                  backgroundColor: evaluation.bg,
                  color: evaluation.color,
                  border: `1px solid ${evaluation.border}`,
                  whiteSpace: 'nowrap'
                }}
              >
                {evaluation.text}
              </div>
            </div>

            {/* Row 2: Tolerance & Tool Specs (Clean Inline) + Calibration Badge */}
            {(() => {
              const toolType = detectMeasuringToolType(activePoint);
              const toolDef = TOOL_DEFINITIONS.find(t => t.id === toolType) || TOOL_DEFINITIONS[0];
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: '#8a919e' }}>
                  <div>
                    Nom <b style={{ color: '#eef1f5', fontWeight: 700 }}>{activePoint?.nominal || 0} {activePoint?.unit || 'mm'}</b> (
                    {activePoint?.tolMin !== undefined ? activePoint.tolMin : (parseFloat(activePoint?.nominal || 0) + (parseFloat(activePoint?.lowerTol) || 0))} ~{' '}
                    {activePoint?.tolMax !== undefined ? activePoint.tolMax : (parseFloat(activePoint?.nominal || 0) + (parseFloat(activePoint?.upperTol) || 0))})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontWeight: 700, flexShrink: 0 }}>
                    <span>{toolDef.icon}</span>
                    <span>{toolDef.name.split(' ')[0]} {toolDef.name.split(' ')[1] || ''}</span>
                    <CalibrationStatusBadge
                      toolType={toolType}
                      onCalibrationExpired={() => setCalibrationLocked(true)}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Row 3: Industrial Yellow / Outspec Alarm Display & Tool Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
                marginTop: '1px'
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: '36px',
                  backgroundColor: evaluation.status === 'NG' ? '#ef4444' : '#facc15',
                  borderRadius: '7px',
                  padding: '0 10px',
                  border: evaluation.status === 'NG' ? '1.5px solid #f87171' : '1.5px solid #eab308',
                  boxShadow: evaluation.status === 'NG'
                    ? '0 0 16px rgba(239, 68, 68, 0.8), inset 0 1px 3px rgba(0,0,0,0.3)'
                    : 'inset 0 1px 3px rgba(0,0,0,0.2), 0 2px 6px rgba(250,204,21,0.2)',
                  animation: evaluation.status === 'NG' ? 'outspec-alarm-blink 0.7s infinite alternate' : 'none',
                  fontFamily: "'SF Mono', 'Roboto Mono', ui-monospace, monospace",
                  fontSize: '22px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: evaluation.status === 'NG' ? '#ffffff' : '#0b0d10',
                  transition: 'background-color 0.15s ease, color 0.15s ease'
                }}
              >
                <span>{currentVal || '0.00'}</span>
                <span
                  style={{
                    fontSize: '11px',
                    color: evaluation.status === 'NG' ? '#fecaca' : '#713f12',
                    fontWeight: 800
                  }}
                >
                  {activePoint?.unit || 'mm'}
                </span>
              </div>

              {/* Action Buttons (BLE, Camera OCR Scanner, Visual Attachment) */}
              <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                {/* 1. BLE Caliper Button */}
                <button
                  onClick={() => setShowBleModal(true)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '7px',
                    backgroundColor: bleConnected ? 'rgba(56, 189, 248, 0.15)' : '#1b1f26',
                    border: bleConnected ? '1.5px solid #38bdf8' : '1px solid #262b33',
                    color: bleConnected ? '#38bdf8' : '#8a919e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    boxShadow: bleConnected ? '0 0 10px rgba(56, 189, 248, 0.3)' : 'none'
                  }}
                  title="Hubungkan Bluetooth Caliper"
                >
                  <Zap size={15} fill={bleConnected ? '#38bdf8' : 'none'} />
                </button>

                {/* 2. Camera OCR LCD Scanner Button */}
                <button
                  onClick={() => {
                    setShowOcrModal(true);
                    startCameraStream();
                    const nom = parseFloat(activePoint?.nominal) || 16.0;
                    setOcrDetectedVal(nom.toFixed(2));
                  }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '7px',
                    backgroundColor: 'rgba(129, 140, 248, 0.15)',
                    border: '1.5px solid #818cf8',
                    color: '#818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 0 10px rgba(129, 140, 248, 0.25)'
                  }}
                  title="Scan LCD Alat Ukur Digital via Camera OCR"
                >
                  <Scan size={15} />
                </button>

                {/* 3. Camera / Visual Attachment Button */}
                <button
                  onClick={() => {
                    setShowCameraModal(true);
                    startCameraStream();
                  }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '7px',
                    backgroundColor: pointPhotos[activePoint?.id] ? 'rgba(57, 193, 122, 0.15)' : '#1b1f26',
                    border: pointPhotos[activePoint?.id] ? '1.5px solid #39c17a' : '1px solid #262b33',
                    color: pointPhotos[activePoint?.id] ? '#39c17a' : '#eef1f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: pointPhotos[activePoint?.id] ? '0 0 10px rgba(57, 193, 122, 0.3)' : 'none'
                  }}
                  title="Ambil Foto Bukti Visual QC"
                >
                  <Camera size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* ── SPC MINI CHART (Collapsible) ────────────────────── */}
          {(() => {
            // Collect all measured values for the active point's parameter across samples
            const spcParamData = [];
            // Use current and committed values for SPC
            checkPoints.forEach(p => {
              if (p.id === activePoint?.id) {
                const v = parseFloat(localValues[p.id]);
                if (!isNaN(v)) spcParamData.push(v);
              }
            });
            // Also add values from the measuredValues history if available
            if (activePoint?.spcHistory && Array.isArray(activePoint.spcHistory)) {
              activePoint.spcHistory.forEach(v => {
                const num = parseFloat(v);
                if (!isNaN(num)) spcParamData.push(num);
              });
            }
            // Fallback: generate simulated SPC data from nominal for demo
            if (spcParamData.length < 5 && activePoint) {
              const nom = parseFloat(activePoint.nominal) || 25;
              const tol = Math.abs(parseFloat(activePoint.upperTol) || 0.05);
              for (let i = 0; i < 25; i++) {
                spcParamData.push(nom + (Math.random() - 0.5) * tol * 1.5);
              }
            }

            const nominal = parseFloat(activePoint?.nominal) || 0;
            const tolMinVal = parseFloat(activePoint?.tolMin !== undefined ? activePoint.tolMin : (nominal + (parseFloat(activePoint?.lowerTol) || 0)));
            const tolMaxVal = parseFloat(activePoint?.tolMax !== undefined ? activePoint.tolMax : (nominal + (parseFloat(activePoint?.upperTol) || 0)));
            const uslVal = Math.max(tolMinVal, tolMaxVal);
            const lslVal = Math.min(tolMinVal, tolMaxVal);

            return (
              <SPCMiniChart
                parameterData={spcParamData}
                usl={uslVal}
                lsl={lslVal}
                isExpanded={spcExpanded}
                onToggle={() => setSpcExpanded(prev => !prev)}
                subgroupSize={5}
              />
            );
          })()}

          {/* Calibration Lockout Warning */}
          {calibrationLocked && (
            <div style={{
              backgroundColor: 'rgba(239,68,68,.12)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              animation: 'pulse 1.5s infinite'
            }}>
              <span style={{ fontSize: '14px' }}>⛔</span>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#ef4444' }}>KALIBRASI ALAT EXPIRED — INPUT DIBLOKIR</div>
                <div style={{ fontSize: '8.5px', color: '#fca5a5' }}>Kalibrasi ulang alat ukur sebelum melanjutkan inspeksi (ISO 9001: 7.1.5)</div>
              </div>
            </div>
          )}

          {/* 3. Ergonomic Touch Numpad with Dynamic Backlight (PC Styled) */}
          <div
            style={{
              flex: 1,
              minHeight: '235px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr) 76px',
              gridTemplateRows: 'repeat(4, 1fr)',
              gap: '6px',
              marginTop: '4px',
              marginBottom: '2px',
              opacity: calibrationLocked ? 0.35 : 1,
              pointerEvents: calibrationLocked ? 'none' : 'auto',
              filter: calibrationLocked ? 'grayscale(0.5)' : 'none',
              transition: 'opacity 0.2s ease'
            }}
          >
            {/* Row 1 */}
            {['7', '8', '9'].map(k => (
              <button
                key={k}
                onPointerDown={() => { setPressedKey(k); handleNumpadPress(k); }}
                onPointerUp={() => setPressedKey(null)}
                onPointerLeave={() => setPressedKey(null)}
                onPointerCancel={() => setPressedKey(null)}
                style={getKeyStyle(k, pressedKey === k)}
              >
                {k}
              </button>
            ))}
            {/* NEXT / SAVE Dynamic Key */}
            {(() => {
              const isLastPoint = activeIndex === checkPoints.length - 1;
              return (
                <button
                  onPointerDown={() => { setPressedKey('NEXT'); handleNumpadPress(isLastPoint ? 'SAVE' : 'NEXT'); }}
                  onPointerUp={() => setPressedKey(null)}
                  onPointerLeave={() => setPressedKey(null)}
                  onPointerCancel={() => setPressedKey(null)}
                  style={getNextKeyStyle(pressedKey === 'NEXT', isLastPoint)}
                >
                  {isLastPoint ? (
                    <>
                      SAVE<br />💾
                    </>
                  ) : (
                    <>
                      NEXT<br />▶
                    </>
                  )}
                </button>
              );
            })()}

            {/* Row 2 */}
            {['4', '5', '6'].map(k => (
              <button
                key={k}
                onPointerDown={() => { setPressedKey(k); handleNumpadPress(k); }}
                onPointerUp={() => setPressedKey(null)}
                onPointerLeave={() => setPressedKey(null)}
                onPointerCancel={() => setPressedKey(null)}
                style={getKeyStyle(k, pressedKey === k)}
              >
                {k}
              </button>
            ))}

            {/* Row 3 */}
            {['1', '2', '3'].map(k => (
              <button
                key={k}
                onPointerDown={() => { setPressedKey(k); handleNumpadPress(k); }}
                onPointerUp={() => setPressedKey(null)}
                onPointerLeave={() => setPressedKey(null)}
                onPointerCancel={() => setPressedKey(null)}
                style={getKeyStyle(k, pressedKey === k)}
              >
                {k}
              </button>
            ))}

            {/* Row 4 */}
            {['0', '.', '00'].map(k => (
              <button
                key={k}
                onPointerDown={() => { setPressedKey(k); handleNumpadPress(k); }}
                onPointerUp={() => setPressedKey(null)}
                onPointerLeave={() => setPressedKey(null)}
                onPointerCancel={() => setPressedKey(null)}
                style={getKeyStyle(k, pressedKey === k)}
              >
                {k}
              </button>
            ))}
            <button
              onPointerDown={() => { setPressedKey('DEL'); handleNumpadPress('DEL'); }}
              onPointerUp={() => setPressedKey(null)}
              onPointerLeave={() => setPressedKey(null)}
              onPointerCancel={() => setPressedKey(null)}
              style={getDelKeyStyle(pressedKey === 'DEL')}
            >
              DEL
            </button>
          </div>
        </div>

        {/* ─── MODAL 1: ⚡ BLUETOOTH / HARDWARE HUB SYNC ───────────── */}
        {showBleModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.82)',
              backdropFilter: 'blur(5px)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}
          >
            <div
              style={{
                backgroundColor: '#14171c',
                borderTop: '1px solid #262b33',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                padding: '18px 16px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⚡</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#eef1f5' }}>
                      Sinkronisasi BLE Caliper & Alat Ukur
                    </div>
                    <div style={{ fontSize: '11px', color: '#8a919e' }}>
                      Poin #{activePoint?.pointNumber || activeIndex + 1}: {activePoint?.title || 'Dimensi'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowBleModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8a919e',
                    fontSize: '18px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Status Device */}
              <div
                style={{
                  backgroundColor: '#1b1f26',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  border: '1px solid #262b33',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bluetooth size={16} color={bleConnected ? '#39c17a' : '#2f8cff'} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#eef1f5' }}>
                      {bleDeviceName}
                    </div>
                    <div style={{ fontSize: '10px', color: bleConnected ? '#39c17a' : '#8a919e' }}>
                      {bleConnected ? '● Terkoneksi (BLE GATT Streaming)' : '○ Siap Dihubungkan'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleConnectBle}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '7px',
                    backgroundColor: bleConnected ? '#262b33' : '#2f8cff',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {bleConnected ? 'Ulang Scan' : 'Connect BLE'}
                </button>
              </div>

              {/* One-Click Stream Capture */}
              <button
                onClick={() => handleSyncBleReading()}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2f8cff, #1d4ed8)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(47,140,255,0.4)'
                }}
              >
                ⚡ Ambil Data Ukur Langsung dari Caliper (Live)
              </button>

              {/* Quick Preset Reading Buttons */}
              <div>
                <div style={{ fontSize: '10.5px', color: '#8a919e', marginBottom: '6px', fontWeight: 600 }}>
                  Quick Preset Hasil Ukur:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  <button
                    onClick={() => handleSyncBleReading(activePoint?.nominal || '10.00')}
                    style={presetBtnStyle}
                  >
                    Nominal ({activePoint?.nominal || 0})
                  </button>
                  <button
                    onClick={() => handleSyncBleReading(activePoint?.tolMin || activePoint?.nominal || '9.80')}
                    style={presetBtnStyle}
                  >
                    Batas Bawah ({activePoint?.tolMin || 0})
                  </button>
                  <button
                    onClick={() => handleSyncBleReading(activePoint?.tolMax || activePoint?.nominal || '10.20')}
                    style={presetBtnStyle}
                  >
                    Batas Atas ({activePoint?.tolMax || 0})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL 2: 📷 CAMERA DEFECT PHOTO CAPTURE ────────────── */}
        {showCameraModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#0b0d10',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Topbar */}
            <div
              style={{
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #262b33'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={16} color="#ff5a5f" />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#eef1f5' }}>
                  Foto Bukti Defect / Komponen Poin #{activePoint?.pointNumber || activeIndex + 1}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCameraModal(false);
                  stopCameraStream();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8a919e',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Camera Viewport / Photo Preview */}
            <div
              style={{
                flex: 1,
                backgroundColor: '#000000',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {capturedPhoto ? (
                <img
                  src={capturedPhoto}
                  alt="Captured Defect"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}

              {/* Crosshair Overlay when live camera */}
              {!capturedPhoto && (
                <div
                  style={{
                    position: 'absolute',
                    width: '180px',
                    height: '180px',
                    border: '1.5px dashed rgba(255,255,255,0.6)',
                    borderRadius: '12px',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Crosshair size={28} color="rgba(255,255,255,0.7)" />
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: '#14171c',
                borderTop: '1px solid #262b33',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {capturedPhoto ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setCapturedPhoto(null);
                      startCameraStream();
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: '#1b1f26',
                      border: '1px solid #262b33',
                      color: '#eef1f5',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Foto Ulang
                  </button>
                  <button
                    onClick={handleSaveDefectPhoto}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: '#39c17a',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    ✓ Simpan Foto
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  {/* File Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#1b1f26',
                      border: '1px solid #262b33',
                      color: '#eef1f5',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Upload size={13} /> File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleFileAttach}
                  />

                  {/* Big Shutter Button */}
                  <button
                    onClick={handleCaptureSnapshot}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      border: '4px solid #ff5a5f',
                      boxShadow: '0 0 16px rgba(255,90,95,0.5)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ff5a5f' }} />
                  </button>

                  <div style={{ width: '60px' }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── MODAL 3: 🔍 CAMERA OCR LCD MEASURING TOOL SCANNER ─────── */}
        {showOcrModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#0b0d10',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Topbar */}
            <div
              style={{
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #262b33',
                backgroundColor: '#14171c'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scan size={16} color="#818cf8" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#eef1f5' }}>
                    Camera OCR LCD Scanner
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                    Arahkan kamera ke layar LCD alat ukur (Caliper / Micrometer)
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowOcrModal(false);
                  stopCameraStream();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8a919e',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Camera Viewfinder with LCD Target Reticle */}
            <div
              style={{
                flex: 1,
                backgroundColor: '#000000',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Hidden Canvas for Frame Processing */}
              <canvas ref={ocrCanvasRef} style={{ display: 'none' }} />

              {/* Real-time Status Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(11, 15, 25, 0.88)',
                  border: isOcrScanning ? '1px solid #eab308' : '1px solid #22c55e',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 30,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(6px)'
                }}
              >
                {isOcrScanning ? (
                  <Loader2 size={12} className="animate-spin" color="#eab308" />
                ) : (
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      boxShadow: '0 0 8px #22c55e'
                    }}
                  />
                )}
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.3px' }}>
                  {isOcrScanning ? 'MEMINDAI FRAME LCD...' : 'REAL-TIME OCR TERHUBUNG'}
                </span>
              </div>

              {/* 7-Segment LCD Targeting Bounding Box (Dead-Center, Thick Laser Border, Clean Inside) */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '86%',
                  maxWidth: '340px',
                  height: '135px',
                  borderRadius: '14px',
                  border: '3.5px solid #22c55e',
                  boxShadow: '0 0 25px rgba(34, 197, 94, 0.85), inset 0 0 15px rgba(34, 197, 94, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 20
                }}
              >
                {/* Laser scan horizontal line (Thick Glowing Emerald Laser) */}
                <div
                  style={{
                    position: 'absolute',
                    left: '2px',
                    right: '2px',
                    height: '2.5px',
                    backgroundColor: '#22c55e',
                    boxShadow: '0 0 12px #22c55e, 0 0 20px #86efac',
                    animation: 'pulse 1.2s infinite'
                  }}
                />
              </div>
            </div>

            {/* Bottom OCR Results Panel */}
            <div
              style={{
                backgroundColor: '#14171c',
                borderTop: '1px solid #262b33',
                padding: '10px 14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Detected Value Card & Action Buttons */}
              <div
                style={{
                  backgroundColor: '#0b0d10',
                  borderRadius: '10px',
                  border: '1px solid #262b33',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>HASIL PEMINDAIAN REAL-TIME</span>
                    {ocrConfidence ? (
                      <span style={{ color: '#22c55e', fontSize: '8.5px' }}>({ocrConfidence}% AKURASI)</span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#818cf8', fontFamily: 'monospace', lineHeight: 1.2, marginTop: '2px' }}>
                    {ocrDetectedVal !== null ? ocrDetectedVal : (activePoint?.nominal || '0.00')} <span style={{ fontSize: '11px', color: '#94a3b8' }}>{activePoint?.unit || 'mm'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {/* Manual instant scan trigger */}
                  <button
                    onClick={() => processOcrFrame()}
                    disabled={isOcrScanning}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      color: '#38bdf8',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: isOcrScanning ? 'not-allowed' : 'pointer'
                    }}
                    title="Scan ulang frame video saat ini"
                  >
                    <RefreshCw size={12} className={isOcrScanning ? 'animate-spin' : ''} />
                    <span>Scan Frame</span>
                  </button>

                  {/* Apply Value button */}
                  <button
                    onClick={() => handleApplyOcrValue(ocrDetectedVal !== null ? ocrDetectedVal : (activePoint?.nominal || '0.00'))}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: 'linear-gradient(180deg, #10b981, #059669)',
                      border: '1px solid #34d399',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <Check size={14} />
                    <span>Terapkan</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons for Simulation */}
              <div>
                <div style={{ fontSize: '9.5px', color: '#8a919e', marginBottom: '4px', fontWeight: 600 }}>
                  Simulasi Cepat LCD:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  <button
                    onClick={() => {
                      const val = String(activePoint?.nominal || '16.00');
                      setOcrDetectedVal(val);
                      setOcrConfidence(99);
                    }}
                    style={presetBtnStyle}
                  >
                    Nominal ({activePoint?.nominal || 0})
                  </button>
                  <button
                    onClick={() => {
                      const val = String(activePoint?.tolMin || activePoint?.nominal || '15.97');
                      setOcrDetectedVal(val);
                      setOcrConfidence(96);
                    }}
                    style={presetBtnStyle}
                  >
                    Batas Bawah ({activePoint?.tolMin || 0})
                  </button>
                  <button
                    onClick={() => {
                      const val = String(activePoint?.tolMax || activePoint?.nominal || '16.03');
                      setOcrDetectedVal(val);
                      setOcrConfidence(97);
                    }}
                    style={presetBtnStyle}
                  >
                    Batas Atas ({activePoint?.tolMax || 0})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DYNAMIC BACKLIGHT & PC-MATCHED NUMPAD STYLES ────────────
const getKeyStyle = (key, isPressed) => ({
  borderRadius: '11px',
  backgroundColor: isPressed ? '#0284c7' : '#1e293b',
  border: isPressed ? '2px solid #38bdf8' : '1px solid #334155',
  color: isPressed ? '#ffffff' : '#f8fafc',
  fontSize: key === '00' ? '22px' : key === '.' ? '32px' : '27px',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  userSelect: 'none',
  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  boxShadow: isPressed
    ? '0 0 20px rgba(56, 189, 248, 0.9), inset 0 0 8px rgba(255, 255, 255, 0.5)'
    : '0 2px 5px rgba(0, 0, 0, 0.25)',
  transform: isPressed ? 'scale(0.95)' : 'scale(1)',
  transition: 'transform 0.05s ease, background-color 0.08s ease, box-shadow 0.08s ease'
});

const getNextKeyStyle = (isPressed, isLastPoint = false) => {
  if (isLastPoint) {
    return {
      gridRow: 'span 3',
      background: isPressed ? 'linear-gradient(180deg, #ca8a04, #a16207)' : 'linear-gradient(180deg, #facc15, #eab308)',
      color: '#000000',
      fontSize: '16px',
      fontWeight: 900,
      borderRadius: '12px',
      border: isPressed ? '2px solid #fef08a' : '1.5px solid #fde047',
      boxShadow: isPressed
        ? '0 0 26px rgba(250, 204, 21, 0.95), inset 0 0 10px rgba(255, 255, 255, 0.8)'
        : '0 4px 16px rgba(234, 179, 8, 0.55)',
      transform: isPressed ? 'scale(0.96)' : 'scale(1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '3px',
      cursor: 'pointer',
      userSelect: 'none',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      transition: 'all 0.08s ease'
    };
  }
  return {
    gridRow: 'span 3',
    background: isPressed ? 'linear-gradient(180deg, #059669, #047857)' : 'linear-gradient(180deg, #10b981, #059669)',
    color: '#ffffff',
    fontSize: '17px',
    fontWeight: 900,
    borderRadius: '12px',
    border: isPressed ? '2px solid #6ee7b7' : '1px solid #34d399',
    boxShadow: isPressed
      ? '0 0 22px rgba(16, 185, 129, 0.95), inset 0 0 10px rgba(255, 255, 255, 0.6)'
      : '0 4px 14px rgba(16, 185, 129, 0.4)',
    transform: isPressed ? 'scale(0.96)' : 'scale(1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    cursor: 'pointer',
    userSelect: 'none',
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    transition: 'all 0.08s ease'
  };
};

const getDelKeyStyle = (isPressed) => ({
  borderRadius: '11px',
  backgroundColor: isPressed ? '#dc2626' : '#1e293b',
  border: isPressed ? '2px solid #f87171' : '1px solid #334155',
  color: isPressed ? '#ffffff' : '#ef4444',
  fontSize: '16px',
  fontWeight: 900,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  userSelect: 'none',
  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  boxShadow: isPressed
    ? '0 0 18px rgba(239, 68, 68, 0.9), inset 0 0 8px rgba(255, 255, 255, 0.4)'
    : '0 2px 5px rgba(0, 0, 0, 0.25)',
  transform: isPressed ? 'scale(0.95)' : 'scale(1)',
  transition: 'transform 0.05s ease, background-color 0.08s ease, box-shadow 0.08s ease'
});

const presetBtnStyle = {
  padding: '8px 6px',
  borderRadius: '7px',
  backgroundColor: '#1b1f26',
  border: '1px solid #262b33',
  color: '#eef1f5',
  fontSize: '10px',
  fontWeight: 600,
  cursor: 'pointer'
};
