import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Smartphone, Monitor, ZoomIn, ZoomOut, RotateCcw, X,
  Camera, Bluetooth, Volume2, VolumeX,
  ChevronLeft, Check, AlertTriangle, Send, Crosshair
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── AUDIO SYNTHESIZER (PASS / FAIL BEEP FEEDBACK) ─────────────
const playQCSound = (type = 'pass') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'pass') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio Context not allowed before user interaction
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
  onCloseMobileMode,
  currentPointIndex: externalIndex,
  onSelectPoint
}) {
  const [activeIndex, setActiveIndex] = useState(externalIndex || 0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ── Local Values Buffer for 0ms Latency Display Sync ────────
  const [localValues, setLocalValues] = useState(() => ({ ...measuredValues }));

  // Keep local values synced when external measuredValues changes
  useEffect(() => {
    setLocalValues(prev => ({ ...prev, ...measuredValues }));
  }, [measuredValues]);

  // Drawing Canvas Pan & Zoom State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const activePoint = checkPoints[activeIndex] || checkPoints[0] || null;
  const currentVal = activePoint ? (localValues[activePoint.id] !== undefined ? String(localValues[activePoint.id]) : '') : '';

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
      nextStr = nextStr.slice(0, -1);
    } else if (key === 'CLEAR') {
      nextStr = '';
    } else if (key === '±') {
      if (nextStr.startsWith('-')) nextStr = nextStr.substring(1);
      else if (nextStr !== '') nextStr = '-' + nextStr;
    } else if (key === '.') {
      if (!nextStr.includes('.')) nextStr += (nextStr === '' ? '0.' : '.');
    } else if (key === 'NEXT') {
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
        toast.success('Seluruh poin checksheet telah selesai diinspeksi! ✨');
      }
      return;
    } else {
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
          {/* Back button */}
          <button
            onClick={onCloseMobileMode}
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
            title="Kembali ke PC / Tablet UI"
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
            backgroundColor: '#f4f2ec',
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
          {/* Scaled Blueprint Canvas (700 x 500) */}
          <div
            style={{
              position: 'relative',
              width: '700px',
              height: '500px',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
            }}
          >
            {/* 1. CAD Drawing Image or SVG */}
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
                  const posX = pt.x <= 100 ? (pt.x / 100) * 700 : (pt.x / 980) * 700;
                  const posY = pt.y <= 100 ? (pt.y / 100) * 500 : (pt.y / 680) * 500;
                  const tgtX = pt.targetX <= 100 ? (pt.targetX / 100) * 700 : (pt.targetX / 980) * 700;
                  const tgtY = pt.targetY <= 100 ? (pt.targetY / 100) * 500 : (pt.targetY / 680) * 500;
                  return (
                    <g key={`leader-${pt.id}`}>
                      <line
                        x1={posX}
                        y1={posY}
                        x2={tgtX}
                        y2={tgtY}
                        stroke={isAct ? '#ff5a5f' : '#64748b'}
                        strokeWidth={2}
                        strokeDasharray={isAct ? 'none' : '3,3'}
                      />
                      <circle cx={tgtX} cy={tgtY} r={3} fill={isAct ? '#ff5a5f' : '#64748b'} />
                    </g>
                  );
                }
                return null;
              })}
            </svg>

            {/* 3. Interactive Balloon Hotspot Pins */}
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

              const pinBg = isAct ? '#ff5a5f' : isNG ? '#ff5a5f' : isOK ? '#39c17a' : '#2f8cff';
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
                    transform: `translate(-50%, -50%) scale(${isAct ? 1.35 : 1})`,
                    cursor: 'pointer',
                    zIndex: isAct ? 35 : 20,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div
                    style={{
                      width: isAct ? '28px' : '22px',
                      height: isAct ? '28px' : '22px',
                      borderRadius: '50%',
                      backgroundColor: pinBg,
                      color: '#ffffff',
                      border: isAct ? '2px solid #ffffff' : '1px solid #ffffff',
                      boxShadow: isAct ? '0 0 10px rgba(255,90,95,0.8), 0 2px 8px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: isAct ? '12px' : '10px'
                    }}
                  >
                    {pt.pointNumber || idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
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
          {/* 1. Point + Measurement Combined Card */}
          <div
            style={{
              flexShrink: 0,
              backgroundColor: '#14171c',
              border: '1px solid #262b33',
              borderRadius: '12px',
              padding: '8px 12px'
            }}
          >
            {/* Top Specs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#2f8cff' }}>
                  POIN #{activePoint?.pointNumber || activeIndex + 1}
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, lineHeight: 1.2, marginTop: '1px', color: '#eef1f5' }}>
                  {activePoint?.title || `Poin Dimensi #${activeIndex + 1}`}
                </div>
              </div>
              <div
                style={{
                  flexShrink: 0,
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '3px 7px',
                  borderRadius: '16px',
                  backgroundColor: evaluation.bg,
                  color: evaluation.color,
                  border: `1px solid ${evaluation.border}`,
                  whiteSpace: 'nowrap'
                }}
              >
                {evaluation.text}
              </div>
            </div>

            {/* Tolerance info */}
            <div style={{ marginTop: '2px', fontSize: '10.5px', color: '#8a919e' }}>
              Nominal <b style={{ color: '#eef1f5', fontWeight: 600 }}>{activePoint?.nominal || 0} {activePoint?.unit || 'mm'}</b> · Batas{' '}
              <b style={{ color: '#eef1f5', fontWeight: 600 }}>
                {activePoint?.tolMin !== undefined ? activePoint.tolMin : (parseFloat(activePoint?.nominal || 0) + (parseFloat(activePoint?.lowerTol) || 0))} –{' '}
                {activePoint?.tolMax !== undefined ? activePoint.tolMax : (parseFloat(activePoint?.nominal || 0) + (parseFloat(activePoint?.upperTol) || 0))}
              </b>
            </div>

            {/* Measure Row */}
            <div
              style={{
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: '1px solid #262b33',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div
                style={{
                  fontFamily: "'SF Mono', 'Roboto Mono', ui-monospace, monospace",
                  fontSize: '24px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '4px',
                  color: '#eef1f5'
                }}
              >
                <span>{currentVal || '0.00'}</span>
                <span style={{ fontSize: '11.5px', color: '#8a919e', fontWeight: 500 }}>
                  {activePoint?.unit || 'mm'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={onOpenHardwareHub}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    border: '1px solid rgba(47,140,255,.4)',
                    backgroundColor: 'rgba(47,140,255,.1)',
                    color: '#2f8cff',
                    cursor: 'pointer'
                  }}
                  title="Sinkronisasi BLE Caliper / Tool"
                >
                  ⚡
                </button>
                <button
                  onClick={onOpenDefectCamera}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    border: '1px solid rgba(255,90,95,.4)',
                    backgroundColor: 'rgba(255,90,95,.1)',
                    color: '#ff5a5f',
                    cursor: 'pointer'
                  }}
                  title="Ambil Foto Bukti Defect"
                >
                  📷
                </button>
              </div>
            </div>
          </div>

          {/* 3. Compact Ergonomic Numpad */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr) 68px',
              gridTemplateRows: 'repeat(4, 42px)',
              gap: '5px',
              marginTop: 'auto',
              marginBottom: '2px'
            }}
          >
            {/* Row 1 */}
            <button onClick={() => handleNumpadPress('7')} style={keyStyle}>7</button>
            <button onClick={() => handleNumpadPress('8')} style={keyStyle}>8</button>
            <button onClick={() => handleNumpadPress('9')} style={keyStyle}>9</button>
            <button
              onClick={() => handleNumpadPress('NEXT')}
              style={{
                ...keyStyle,
                gridRow: 'span 3',
                background: 'linear-gradient(180deg, #ff7a5c, #ff5a5f)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                flexDirection: 'column',
                gap: '2px',
                border: 'none',
                boxShadow: '0 3px 10px rgba(255,90,95,0.4)'
              }}
            >
              NEXT<br />▶
            </button>

            {/* Row 2 */}
            <button onClick={() => handleNumpadPress('4')} style={keyStyle}>4</button>
            <button onClick={() => handleNumpadPress('5')} style={keyStyle}>5</button>
            <button onClick={() => handleNumpadPress('6')} style={keyStyle}>6</button>

            {/* Row 3 */}
            <button onClick={() => handleNumpadPress('1')} style={keyStyle}>1</button>
            <button onClick={() => handleNumpadPress('2')} style={keyStyle}>2</button>
            <button onClick={() => handleNumpadPress('3')} style={keyStyle}>3</button>

            {/* Row 4 */}
            <button onClick={() => handleNumpadPress('0')} style={keyStyle}>0</button>
            <button onClick={() => handleNumpadPress('.')} style={keyStyle}>.</button>
            <button onClick={() => handleNumpadPress('00')} style={keyStyle}>00</button>
            <button
              onClick={() => handleNumpadPress('DEL')}
              style={{
                ...keyStyle,
                color: '#ff5a5f',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              DEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const keyStyle = {
  borderRadius: '8px',
  backgroundColor: '#1b1f26',
  border: '1px solid #262b33',
  fontSize: '16px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#eef1f5',
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'transform 0.05s ease, background-color 0.1s ease'
};

const microZoomBtnStyle = {
  width: '22px',
  height: '22px',
  borderRadius: '5px',
  backgroundColor: '#1b1f26',
  border: '1px solid #262b33',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  cursor: 'pointer',
  padding: 0
};
