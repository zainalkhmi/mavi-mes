import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Smartphone, Tablet, Monitor, ZoomIn, ZoomOut, Maximize2, Minimize2,
  CheckCircle2, XCircle, AlertTriangle, ArrowLeft, ArrowRight,
  Camera, Wifi, Bluetooth, RotateCcw, Check, X, ShieldCheck,
  ChevronLeft, ChevronRight, PenTool, Sparkles, Volume2, VolumeX,
  Share2, Save, Send, Eye, FileText, Activity, Ruler, Sliders, Crosshair
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── AUDIO SYNTHESIZER (PASS / FAIL BEEP FEEDBACK) ─────────────
const playQCSound = (type = 'pass') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'pass') {
      // Crisp pleasant high chime (OK)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else {
      // Low dual warning buzz (NG / Out of Spec)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio context not allowed before user interaction
  }
};

// ─── HAPTIC FEEDBACK ──────────────────────────────────────────
const triggerHaptic = (type = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (type === 'light') navigator.vibrate(25);
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
  onOpenHardwareHub,
  onOpenDefectCamera,
  onOpenSignatureModal,
  onSubmitChecksheet,
  onCloseMobileMode,
  currentPointIndex: externalIndex,
  onSelectPoint
}) {
  const [deviceMode, setDeviceMode] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 'mobile';
      if (window.innerWidth <= 1180) return 'tablet';
    }
    return 'tablet';
  });

  const [activeIndex, setActiveIndex] = useState(externalIndex || 0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const activePoint = checkPoints[activeIndex] || checkPoints[0] || null;
  const currentVal = activePoint ? (measuredValues[activePoint.id] || '') : '';

  // Synchronize index
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
  };

  // Evaluation: PASS / NG / WARNING / PENDING
  const evaluation = useMemo(() => {
    if (!activePoint || currentVal === '' || currentVal === undefined) return { status: 'PENDING', text: 'Menunggu Pengukuran' };
    const num = parseFloat(currentVal);
    if (isNaN(num)) return { status: 'PENDING', text: 'Format tidak valid' };

    const nominal = parseFloat(activePoint.nominal) || 0;
    const tolMin = parseFloat(activePoint.tolMin !== undefined ? activePoint.tolMin : (nominal + (parseFloat(activePoint.lowerTol) || 0)));
    const tolMax = parseFloat(activePoint.tolMax !== undefined ? activePoint.tolMax : (nominal + (parseFloat(activePoint.upperTol) || 0)));

    const min = Math.min(tolMin, tolMax);
    const max = Math.max(tolMin, tolMax);

    if (num >= min && num <= max) {
      // Check if near limit (within 10% of tolerance range)
      const range = max - min;
      if (range > 0 && (num - min < range * 0.1 || max - num < range * 0.1)) {
        return { status: 'WARNING', text: 'IN SPEC (MENDEKATI LIMIT)', color: '#f59e0b', min, max, nominal };
      }
      return { status: 'PASS', text: 'IN SPEC (OK / PASS)', color: '#22c55e', min, max, nominal };
    }
    return { status: 'NG', text: 'OUT OF SPEC (REJECT / NG)', color: '#ef4444', min, max, nominal };
  }, [activePoint, currentVal]);

  // Handle Numpad key input
  const handleNumpadPress = (key) => {
    if (!activePoint) return;
    triggerHaptic('light');
    let nextStr = String(currentVal || '');

    if (key === 'DEL') {
      nextStr = nextStr.slice(0, -1);
    } else if (key === 'CLEAR') {
      nextStr = '';
    } else if (key === '±') {
      if (nextStr.startsWith('-')) nextStr = nextStr.substring(1);
      else if (nextStr !== '') nextStr = '-' + nextStr;
    } else if (key === '.') {
      if (!nextStr.includes('.')) nextStr += (nextStr === '' ? '0.' : '.');
    } else if (key === 'ENTER') {
      // Evaluate sound & auto-advance
      if (evaluation.status === 'PASS') {
        if (soundEnabled) playQCSound('pass');
        triggerHaptic('success');
      } else if (evaluation.status === 'NG') {
        if (soundEnabled) playQCSound('fail');
        triggerHaptic('error');
      }
      if (activeIndex < checkPoints.length - 1) {
        handlePointChange(activeIndex + 1);
      } else {
        toast.success('Seluruh poin checksheet telah selesai diinspeksi! ✨');
      }
      return;
    } else {
      nextStr += String(key);
    }

    if (onValueChange) {
      onValueChange(activePoint.id, nextStr);
    }
  };

  // Metrics summary
  const stats = useMemo(() => {
    let okCount = 0;
    let ngCount = 0;
    checkPoints.forEach(p => {
      const v = parseFloat(measuredValues[p.id]);
      if (!isNaN(v)) {
        const nom = parseFloat(p.nominal) || 0;
        const min = parseFloat(p.tolMin !== undefined ? p.tolMin : (nom + (parseFloat(p.lowerTol) || 0)));
        const max = parseFloat(p.tolMax !== undefined ? p.tolMax : (nom + (parseFloat(p.upperTol) || 0)));
        if (v >= Math.min(min, max) && v <= Math.max(min, max)) okCount++;
        else ngCount++;
      }
    });
    const progress = checkPoints.length > 0 ? Math.round(((okCount + ngCount) / checkPoints.length) * 100) : 0;
    return { okCount, ngCount, progress, total: checkPoints.length };
  }, [checkPoints, measuredValues]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#09090d',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* ─── TOP INDUSTRIAL HEADER ──────────────────────────────────── */}
      <div
        style={{
          height: '56px',
          backgroundColor: '#13131a',
          borderBottom: '1px solid #242432',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          gap: '8px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <button
            onClick={onCloseMobileMode}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#20202c',
              border: '1px solid #323246',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Kembali ke Mode Normal Desktop"
          >
            <ArrowLeft size={18} />
          </button>

          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {checksheet?.name || checksheet?.partName || 'Digital Check Sheet'}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{checksheet?.partNo || 'PART-001'}</span>
              <span>• Rev {checksheet?.revisionNo || checksheet?.revision || 'A'}</span>
            </div>
          </div>
        </div>

        {/* Status Counters & Device View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
            <span style={{ backgroundColor: '#22c55e20', border: '1px solid #22c55e', color: '#4ade80', padding: '3px 8px', borderRadius: '6px' }}>
              {stats.okCount} OK
            </span>
            {stats.ngCount > 0 && (
              <span style={{ backgroundColor: '#ef444420', border: '1px solid #ef4444', color: '#f87171', padding: '3px 8px', borderRadius: '6px' }}>
                {stats.ngCount} NG
              </span>
            )}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              padding: '6px',
              backgroundColor: soundEnabled ? '#38bdf820' : '#20202c',
              border: `1px solid ${soundEnabled ? '#38bdf8' : '#323246'}`,
              borderRadius: '6px',
              color: soundEnabled ? '#38bdf8' : '#64748b',
              cursor: 'pointer'
            }}
            title={soundEnabled ? 'Suara QC Aktif' : 'Mute Suara QC'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Exit to PC / Tablet View */}
          <button
            onClick={onCloseMobileMode}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #383848',
              backgroundColor: '#20202c',
              color: '#94a3b8',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Kembali ke Tampilan PC & Tablet"
          >
            <Monitor size={14} /> PC / Tablet UI
          </button>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div style={{ height: '3px', backgroundColor: '#1e293b', width: '100%' }}>
        <div
          style={{
            height: '100%',
            backgroundColor: stats.ngCount > 0 ? '#ef4444' : '#22c55e',
            width: `${stats.progress}%`,
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      {/* ─── MAIN CONTENT CONTAINER (MOBILE vs TABLET) ─────────────── */}
      {deviceMode === 'mobile' ? (
        /* ══════════════════════════════════════════════════════════════
           📱 MOBILE VIEW (VERTICAL / STEP FLOW WITH AUTO LOUPE)
           ══════════════════════════════════════════════════════════════ */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top 32%: Auto CAD Loupe Focus View */}
          <div
            style={{
              height: '32%',
              backgroundColor: '#16161f',
              position: 'relative',
              overflow: 'hidden',
              borderBottom: '1px solid #28283a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '980px',
                height: '680px',
                maxWidth: '96%',
                maxHeight: '94%',
                aspectRatio: '980 / 680',
                backgroundColor: '#ffffff',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                borderRadius: '6px',
                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease',
                overflow: 'hidden'
              }}
            >
              {drawingSvg ? (
                typeof drawingSvg === 'string' && (drawingSvg.startsWith('data:image') || drawingSvg.startsWith('blob:') || drawingSvg.startsWith('http')) ? (
                  <img src={drawingSvg} alt="CAD Drawing" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: drawingSvg }} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
                )
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.8rem' }}>Drawing blueprint tidak dimuat</div>
              )}

              {/* Mobile Interactive Balloon Pins */}
              {checkPoints.map((pt, idx) => {
                const isAct = idx === activeIndex;
                const val = measuredValues[pt.id];
                const hasVal = val !== undefined && val !== '';
                const num = parseFloat(val);
                const nom = parseFloat(pt.nominal) || 0;
                const min = parseFloat(pt.tolMin !== undefined ? pt.tolMin : (nom + (parseFloat(pt.lowerTol) || 0)));
                const max = parseFloat(pt.tolMax !== undefined ? pt.tolMax : (nom + (parseFloat(pt.upperTol) || 0)));
                const isOK = hasVal && !isNaN(num) && num >= Math.min(min, max) && num <= Math.max(min, max);
                const isNG = hasVal && !isNaN(num) && (num < Math.min(min, max) || num > Math.max(min, max));

                const pinBg = isAct ? '#ff6d5a' : isNG ? '#ef4444' : isOK ? '#22c55e' : '#3b82f6';
                const posX = pt.x <= 100 ? `${pt.x}%` : `${(pt.x / 980) * 100}%`;
                const posY = pt.y <= 100 ? `${pt.y}%` : `${(pt.y / 680) * 100}%`;

                return (
                  <div
                    key={pt.id || idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePointChange(idx);
                    }}
                    style={{
                      position: 'absolute',
                      left: posX,
                      top: posY,
                      transform: `translate(-50%, -50%) scale(${isAct ? 1.3 : 1})`,
                      cursor: 'pointer',
                      zIndex: isAct ? 35 : 20
                    }}
                  >
                    <div
                      style={{
                        width: isAct ? '32px' : '26px',
                        height: isAct ? '32px' : '26px',
                        borderRadius: pt.shape === 'hexagon' ? '4px' : pt.shape === 'diamond' ? '4px' : '50%',
                        transform: pt.shape === 'diamond' ? 'rotate(45deg)' : 'none',
                        backgroundColor: pinBg,
                        color: '#ffffff',
                        border: isAct ? '2.5px solid #ffffff' : '1.5px solid #ffffff',
                        boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: isAct ? '0.8rem' : '0.72rem'
                      }}
                    >
                      <span style={{ transform: pt.shape === 'diamond' ? 'rotate(-45deg)' : 'none' }}>
                        {pt.pointNumber || idx + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Balloon Overlay Indicator */}
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                padding: '4px 10px',
                borderRadius: '20px',
                backgroundColor: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(4px)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                fontSize: '0.72rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Crosshair size={13} /> Point {activeIndex + 1} of {checkPoints.length}
            </div>

            {/* Zoom Controls Overlay */}
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.3, 3))}
                style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#21212b', border: '1px solid #383848', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.3, 0.8))}
                style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#21212b', border: '1px solid #383848', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#21212b', border: '1px solid #383848', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Bottom 68%: Giant Metrology Touch Card */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0e0e14', padding: '10px 12px', gap: '8px', overflowY: 'auto' }}>
            {/* Active Point Specification Box */}
            <div
              style={{
                backgroundColor: '#181822',
                border: '1px solid #2c2c3e',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Pemeriksaan #{activePoint?.pointNumber || activeIndex + 1} ({activePoint?.category || 'Dimension'})
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                  {activePoint?.title || `Poin Dimensi #${activeIndex + 1}`}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  Standar: <b>{activePoint?.nominal} {activePoint?.unit || 'mm'}</b> (Toleransi: {activePoint?.tolMin || activePoint?.nominal} ~ {activePoint?.tolMax || activePoint?.nominal})
                </div>
              </div>

              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  backgroundColor: evaluation.status === 'PASS' ? '#22c55e20' : evaluation.status === 'NG' ? '#ef444420' : '#f59e0b20',
                  border: `1px solid ${evaluation.status === 'PASS' ? '#22c55e' : evaluation.status === 'NG' ? '#ef4444' : '#f59e0b'}`,
                  color: evaluation.color || '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  textAlign: 'center'
                }}
              >
                {evaluation.status}
              </div>
            </div>

            {/* Giant Live Readout Box */}
            <div
              style={{
                backgroundColor: '#12121a',
                border: `2px solid ${evaluation.status === 'PASS' ? '#22c55e' : evaluation.status === 'NG' ? '#ef4444' : '#38bdf8'}`,
                borderRadius: '12px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: evaluation.status === 'PASS' ? '0 0 20px rgba(34,197,94,0.2)' : evaluation.status === 'NG' ? '0 0 20px rgba(239,68,68,0.25)' : 'none'
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Nilai Pengukuran</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', letterSpacing: '1px' }}>
                  {currentVal || '0.00'} <span style={{ fontSize: '0.9rem', color: '#38bdf8' }}>{activePoint?.unit || 'mm'}</span>
                </div>
              </div>

              {/* Instant Status Pill */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: evaluation.color || '#94a3b8' }}>
                  {evaluation.text}
                </div>
              </div>
            </div>

            {/* Quick Actions (BLE Tool Sync & Camera Foto Defect) */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onOpenHardwareHub}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: '#0284c720',
                  border: '1px solid #0284c7',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Bluetooth size={14} /> Sync BLE Caliper
              </button>

              <button
                onClick={onOpenDefectCamera}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: '#ec489920',
                  border: '1px solid #ec4899',
                  color: '#f472b6',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Camera size={14} /> Foto Defect
              </button>
            </div>

            {/* Glove-Friendly Metrology Big Numpad */}
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gridTemplateRows: 'repeat(4, 1fr)',
                gap: '6px',
                minHeight: '190px'
              }}
            >
              {['7', '8', '9', 'DEL', '4', '5', '6', '±', '1', '2', '3', 'CLEAR', '0', '.', '00', 'ENTER'].map((key) => {
                const isEnter = key === 'ENTER';
                const isDel = key === 'DEL' || key === 'CLEAR';
                return (
                  <button
                    key={key}
                    onClick={() => handleNumpadPress(key)}
                    style={{
                      borderRadius: '8px',
                      border: isEnter ? 'none' : '1px solid #2e2e42',
                      backgroundColor: isEnter ? '#ff6d5a' : isDel ? '#7f1d1d30' : '#1c1c28',
                      color: isEnter ? '#ffffff' : isDel ? '#fca5a5' : '#f8fafc',
                      fontSize: isEnter ? '0.85rem' : '1.15rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isEnter ? '0 2px 10px rgba(255,109,90,0.4)' : 'none',
                      transition: 'transform 0.05s ease'
                    }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {isEnter ? 'NEXT ▶' : key}
                  </button>
                );
              })}
            </div>

            {/* Bottom Thumb Navigation Bar */}
            <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
              <button
                onClick={() => handlePointChange(activeIndex - 1)}
                disabled={activeIndex === 0}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#20202c',
                  border: '1px solid #323246',
                  color: activeIndex === 0 ? '#475569' : '#cbd5e1',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: activeIndex === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={16} /> Prev
              </button>

              {activeIndex < checkPoints.length - 1 ? (
                <button
                  onClick={() => handlePointChange(activeIndex + 1)}
                  style={{
                    flex: 1.5,
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#0284c7',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 10px rgba(2,132,199,0.4)'
                  }}
                >
                  Next Point <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={onSubmitChecksheet}
                  style={{
                    flex: 1.5,
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#22c55e',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(34,197,94,0.4)'
                  }}
                >
                  <Send size={15} /> Submit QC
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════
           📟 TABLET DUAL-PANE VIEW (LANDSCAPE / STUDIO LAYOUT)
           ══════════════════════════════════════════════════════════════ */
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '58% 42%', overflow: 'hidden' }}>
          {/* Left Pane (58%): Full CAD Blueprint Drawing Canvas */}
          <div
            style={{
              backgroundColor: '#16161f',
              borderRight: '1px solid #28283a',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '20px'
            }}
          >
            {/* Scaled Blueprint & Balloons Container (980 x 680) */}
            <div
              style={{
                position: 'relative',
                width: '980px',
                height: '680px',
                maxWidth: '96%',
                maxHeight: '94%',
                aspectRatio: '980 / 680',
                backgroundColor: '#ffffff',
                boxShadow: '0 12px 45px rgba(0,0,0,0.6)',
                borderRadius: '8px',
                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease',
                overflow: 'hidden'
              }}
            >
              {/* 1. CAD Drawing Image / SVG */}
              {drawingSvg ? (
                typeof drawingSvg === 'string' && (drawingSvg.startsWith('data:image') || drawingSvg.startsWith('blob:') || drawingSvg.startsWith('http')) ? (
                  <img src={drawingSvg} alt="CAD Drawing" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: drawingSvg }} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
                )
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                  Drawing blueprint tidak dimuat
                </div>
              )}

              {/* 2. Interactive SVG Leader Lines */}
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
                {checkPoints.map(pt => {
                  if (pt.targetX !== undefined && pt.targetY !== undefined && (Math.abs(pt.targetX - pt.x) > 10 || Math.abs(pt.targetY - pt.y) > 10)) {
                    const isAct = checkPoints[activeIndex]?.id === pt.id;
                    const posX = pt.x <= 100 ? (pt.x / 100) * 980 : pt.x;
                    const posY = pt.y <= 100 ? (pt.y / 100) * 680 : pt.y;
                    const tgtX = pt.targetX <= 100 ? (pt.targetX / 100) * 980 : pt.targetX;
                    const tgtY = pt.targetY <= 100 ? (pt.targetY / 100) * 680 : pt.targetY;
                    return (
                      <g key={`leader-${pt.id}`}>
                        <line
                          x1={posX}
                          y1={posY}
                          x2={tgtX}
                          y2={tgtY}
                          stroke={isAct ? '#ff6d5a' : '#64748b'}
                          strokeWidth={isAct ? 2.5 : 1.5}
                          strokeDasharray={isAct ? 'none' : '3,3'}
                        />
                        <circle cx={tgtX} cy={tgtY} r={3.5} fill={isAct ? '#ff6d5a' : '#64748b'} />
                      </g>
                    );
                  }
                  return null;
                })}
              </svg>

              {/* 3. Interactive Balloon Hotspot Pins */}
              {checkPoints.map((pt, idx) => {
                const isAct = idx === activeIndex;
                const val = measuredValues[pt.id];
                const hasVal = val !== undefined && val !== '';
                const num = parseFloat(val);
                const nom = parseFloat(pt.nominal) || 0;
                const min = parseFloat(pt.tolMin !== undefined ? pt.tolMin : (nom + (parseFloat(pt.lowerTol) || 0)));
                const max = parseFloat(pt.tolMax !== undefined ? pt.tolMax : (nom + (parseFloat(pt.upperTol) || 0)));
                const isOK = hasVal && !isNaN(num) && num >= Math.min(min, max) && num <= Math.max(min, max);
                const isNG = hasVal && !isNaN(num) && (num < Math.min(min, max) || num > Math.max(min, max));

                const pinBg = isAct ? '#ff6d5a' : isNG ? '#ef4444' : isOK ? '#22c55e' : '#3b82f6';
                const posX = pt.x <= 100 ? `${pt.x}%` : `${(pt.x / 980) * 100}%`;
                const posY = pt.y <= 100 ? `${pt.y}%` : `${(pt.y / 680) * 100}%`;

                return (
                  <div
                    key={pt.id || idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePointChange(idx);
                    }}
                    style={{
                      position: 'absolute',
                      left: posX,
                      top: posY,
                      transform: `translate(-50%, -50%) scale(${isAct ? 1.25 : 1})`,
                      cursor: 'pointer',
                      zIndex: isAct ? 35 : 20,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {/* Pulsing Aura for Active / NG point */}
                    {(isAct || isNG) && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: '-8px',
                          borderRadius: '50%',
                          backgroundColor: isAct ? 'rgba(255, 109, 90, 0.45)' : 'rgba(239, 68, 68, 0.45)',
                          animation: 'pulse 1.5s infinite',
                          zIndex: -1
                        }}
                      />
                    )}

                    <div
                      style={{
                        width: isAct ? '34px' : '28px',
                        height: isAct ? '34px' : '28px',
                        borderRadius: pt.shape === 'hexagon' ? '4px' : pt.shape === 'diamond' ? '4px' : '50%',
                        transform: pt.shape === 'diamond' ? 'rotate(45deg)' : 'none',
                        backgroundColor: pinBg,
                        color: '#ffffff',
                        border: isAct ? '3px solid #ffffff' : '2px solid #ffffff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: isAct ? '0.85rem' : '0.75rem'
                      }}
                    >
                      <span style={{ transform: pt.shape === 'diamond' ? 'rotate(-45deg)' : 'none' }}>
                        {pt.pointNumber || idx + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Point Bubbles Quick Jump */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(20,20,30,0.85)',
                backdropFilter: 'blur(6px)',
                border: '1px solid #383848',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 40
              }}
            >
              <Crosshair size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff' }}>
                Active Point: #{activePoint?.pointNumber || activeIndex + 1}
              </span>
            </div>

            {/* Bottom Floating CAD Controls */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(24,24,34,0.9)',
                padding: '6px 12px',
                borderRadius: '24px',
                border: '1px solid #383848',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 40
              }}
            >
              <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}><ZoomIn size={16} /></button>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.7))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}><ZoomOut size={16} /></button>
              <button onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '4px' }}><RotateCcw size={16} /></button>
            </div>
          </div>

          {/* Right Pane (42%): Active Inspection Station & Numpad */}
          <div
            style={{
              backgroundColor: '#0e0e14',
              display: 'flex',
              flexDirection: 'column',
              padding: '16px 20px',
              gap: '12px',
              overflowY: 'auto'
            }}
          >
            {/* Active Dimension Header */}
            <div
              style={{
                backgroundColor: '#181824',
                border: '1px solid #28283c',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#38bdf815' }}>
                  Point #{activePoint?.pointNumber || activeIndex + 1}
                </span>
                <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                  {activePoint?.title || `Dimensi #${activeIndex + 1}`}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Nominal: <b>{activePoint?.nominal} {activePoint?.unit || 'mm'}</b> (Batas: {activePoint?.tolMin || activePoint?.nominal} ~ {activePoint?.tolMax || activePoint?.nominal})
                </div>
              </div>

              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: evaluation.status === 'PASS' ? '#22c55e20' : evaluation.status === 'NG' ? '#ef444420' : '#f59e0b20',
                  border: `1.5px solid ${evaluation.status === 'PASS' ? '#22c55e' : evaluation.status === 'NG' ? '#ef4444' : '#f59e0b'}`,
                  color: evaluation.color || '#94a3b8',
                  fontSize: '0.85rem',
                  fontWeight: 900
                }}
              >
                {evaluation.status}
              </div>
            </div>

            {/* Tablet Live Measured Value Display */}
            <div
              style={{
                backgroundColor: '#12121a',
                border: `2px solid ${evaluation.status === 'PASS' ? '#22c55e' : evaluation.status === 'NG' ? '#ef4444' : '#38bdf8'}`,
                borderRadius: '12px',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>NILAI AKTUAL PENGUKURAN</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '1px' }}>
                  {currentVal || '0.00'} <span style={{ fontSize: '1rem', color: '#38bdf8' }}>{activePoint?.unit || 'mm'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={onOpenHardwareHub}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#0284c720',
                    border: '1px solid #0284c7',
                    color: '#38bdf8',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Bluetooth size={16} /> Sync BLE
                </button>
                <button
                  onClick={onOpenDefectCamera}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#ec489920',
                    border: '1px solid #ec4899',
                    color: '#f472b6',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Camera size={16} /> Foto NG
                </button>
              </div>
            </div>

            {/* Tablet Metrology Big Numpad */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                minHeight: '220px'
              }}
            >
              {['7', '8', '9', 'DEL', '4', '5', '6', '±', '1', '2', '3', 'CLEAR', '0', '.', '00', 'ENTER'].map((key) => {
                const isEnter = key === 'ENTER';
                const isDel = key === 'DEL' || key === 'CLEAR';
                return (
                  <button
                    key={key}
                    onClick={() => handleNumpadPress(key)}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: isEnter ? 'none' : '1px solid #2e2e42',
                      backgroundColor: isEnter ? '#ff6d5a' : isDel ? '#7f1d1d30' : '#1c1c28',
                      color: isEnter ? '#ffffff' : isDel ? '#fca5a5' : '#f8fafc',
                      fontSize: isEnter ? '0.95rem' : '1.3rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isEnter ? '0 4px 14px rgba(255,109,90,0.4)' : 'none'
                    }}
                  >
                    {isEnter ? 'NEXT ▶' : key}
                  </button>
                );
              })}
            </div>

            {/* Points Ribbon Carousel */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '6px 0' }}>
              {checkPoints.map((pt, idx) => {
                const val = measuredValues[pt.id];
                const isCurrent = idx === activeIndex;
                const hasVal = val !== undefined && val !== '';
                return (
                  <button
                    key={pt.id || idx}
                    onClick={() => handlePointChange(idx)}
                    style={{
                      minWidth: '54px',
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: isCurrent ? '2px solid #ff6d5a' : hasVal ? '1px solid #22c55e' : '1px solid #28283a',
                      backgroundColor: isCurrent ? '#ff6d5a20' : hasVal ? '#22c55e15' : '#14141e',
                      color: isCurrent ? '#ff6d5a' : hasVal ? '#4ade80' : '#94a3b8',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span>#{pt.pointNumber || idx + 1}</span>
                    <span style={{ fontSize: '0.65rem' }}>{hasVal ? val : '--'}</span>
                  </button>
                );
              })}
            </div>

            {/* Tablet Navigation & Submission Footer */}
            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
              <button
                onClick={() => handlePointChange(activeIndex - 1)}
                disabled={activeIndex === 0}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#20202c',
                  border: '1px solid #323246',
                  color: activeIndex === 0 ? '#475569' : '#cbd5e1',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: activeIndex === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ChevronLeft size={18} /> Poin Sebelumnya
              </button>

              {activeIndex < checkPoints.length - 1 ? (
                <button
                  onClick={() => handlePointChange(activeIndex + 1)}
                  style={{
                    flex: 1.5,
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#0284c7',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(2,132,199,0.4)'
                  }}
                >
                  Poin Selanjutnya <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={onSubmitChecksheet}
                  style={{
                    flex: 1.5,
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#22c55e',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(34,197,94,0.4)'
                  }}
                >
                  <Send size={16} /> Submit Checksheet QC
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
