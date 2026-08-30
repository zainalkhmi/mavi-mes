import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { detectMeasuringToolType, TOOL_DEFINITIONS } from '../../utils/metrologyToolUtils';

/**
 * Animated High-Precision Multi-Instrument Metrology Visual SOP Overlay (ISO 9001: 7.1.5)
 * Supports: Digital Caliper, Outside Micrometer, Dial Indicator, Bore Gauge, Height Gauge, and Zeiss 3D CMM.
 */
export default function VirtualMeasuringTool({
  activePoint,
  isVisible = true,
  onAutoSetMeasurement,
  style = {}
}) {
  const [unitMode, setUnitMode] = useState('mm'); // 'mm' | 'inch'
  const [isZeroed, setIsZeroed] = useState(false);
  const [animProgress, setAnimProgress] = useState(0); // 0 to 1
  const [displayCounter, setDisplayCounter] = useState(0);
  const [overrideTool, setOverrideTool] = useState(null);

  // Determine current tool type
  const autoToolType = detectMeasuringToolType(activePoint);
  const currentToolType = overrideTool || autoToolType;
  const currentToolDef = TOOL_DEFINITIONS.find(t => t.id === currentToolType) || TOOL_DEFINITIONS[0];

  const nominalNum = activePoint ? (parseFloat(activePoint.nominal) || 25.0) : 25.0;
  const measuredNum = (activePoint && activePoint.measuredVal !== undefined && activePoint.measuredVal !== '')
    ? (parseFloat(activePoint.measuredVal) || nominalNum)
    : nominalNum;

  // Status computation
  const isOK = activePoint?.status === 'OK';
  const isNG = activePoint?.status === 'NG';
  const isWarning = activePoint?.status === 'WARNING';
  const statusColor = isNG ? '#ef4444' : isWarning ? '#f59e0b' : isOK ? '#22c55e' : '#38bdf8';
  const statusText = isNG ? 'NG (Out of Tol)' : isOK ? 'PASS (In Spec)' : 'MEASURING';

  // Animation trigger on activePoint change
  useEffect(() => {
    if (!activePoint?.id) return;
    setAnimProgress(0);
    setDisplayCounter(0);

    const t0 = setTimeout(() => {
      setAnimProgress(1);
    }, 40);

    // Number counting animation
    const targetVal = isZeroed ? 0 : measuredNum;
    const duration = 500;
    const steps = 20;
    const stepVal = targetVal / steps;
    let stepCount = 0;

    const interval = setInterval(() => {
      stepCount++;
      if (stepCount >= steps) {
        setDisplayCounter(targetVal);
        clearInterval(interval);
      } else {
        setDisplayCounter(stepVal * stepCount);
      }
    }, duration / steps);

    return () => {
      clearTimeout(t0);
      clearInterval(interval);
    };
  }, [activePoint?.id, activePoint?.nominal, activePoint?.measuredVal, isZeroed, measuredNum, currentToolType]);

  // Reset override when point changes
  useEffect(() => {
    setOverrideTool(null);
  }, [activePoint?.id]);

  if (!activePoint || !isVisible) return null;

  const ptX = activePoint.x ?? 500;
  const ptY = activePoint.y ?? 340;

  // Display LCD string
  const displayString = isZeroed
    ? '0.000'
    : unitMode === 'mm'
    ? displayCounter.toFixed(3)
    : (displayCounter / 25.4).toFixed(4);

  return (
    <div
      className="virtual-measuring-tool-container"
      style={{
        width: '320px',
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(14px)',
        borderRadius: '12px',
        border: `1.5px solid ${statusColor}`,
        boxShadow: `0 16px 36px rgba(0,0,0,0.65), 0 0 20px ${statusColor}33`,
        padding: '10px 12px',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        userSelect: 'none',
        pointerEvents: 'auto',
        animation: 'fadeInLeft 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px' }}>{currentToolDef.icon}</span>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.2px' }}>
              {currentToolDef.name}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>ID: {currentToolDef.code}</span>
              <span>•</span>
              <span style={{ color: '#22c55e' }}>CAL: {currentToolDef.cert}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 900,
              backgroundColor: `${statusColor}22`,
              color: statusColor,
              border: `1px solid ${statusColor}`,
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Quick Tool Selector Pills */}
        <div style={{ display: 'flex', gap: '3px', overflowX: 'auto', paddingBottom: '2px' }}>
          {TOOL_DEFINITIONS.map(t => {
            const isSelected = currentToolType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setOverrideTool(t.id)}
                style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid #334155',
                  backgroundColor: isSelected ? '#0284c7' : '#1e293b',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <span>{t.icon}</span>
                <span>{t.id === 'dial_indicator' ? 'Dial' : t.id === 'bore_gauge' ? 'Bore' : t.id === 'height_gauge' ? 'Height' : t.id === 'micrometer' ? 'Micro' : t.id === 'cmm' ? 'CMM' : 'Caliper'}</span>
              </button>
            );
          })}
        </div>

        {/* ─── DYNAMIC SVG INSTRUMENT VISUALIZATION ─── */}
        <div
          style={{
            backgroundColor: '#090d16',
            borderRadius: '8px',
            border: '1px solid #1e293b',
            padding: '8px 4px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '120px'
          }}
        >
          {/* 1. DIGITAL CALIPER */}
          {currentToolType === 'caliper' && (
            <svg width="100%" height="110" viewBox="0 0 290 110" style={{ display: 'block', maxWidth: '300px' }}>
              <defs>
                <linearGradient id="beam-metal" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="40%" stopColor="#cbd5e1" />
                  <stop offset="70%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                <linearGradient id="jaw-body" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
              </defs>
              {/* Main Scale Beam */}
              <rect x="15" y="32" width="260" height="18" rx="2" fill="url(#beam-metal)" stroke="#334155" strokeWidth="0.8" />
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150].map(mm => (
                <g key={mm} transform={`translate(${20 + mm * 1.6}, 32)`}>
                  <line x1="0" y1="0" x2="0" y2="7" stroke="#0f172a" strokeWidth="0.6" />
                  {mm % 20 === 0 && (
                    <text x="0" y="15" fontSize="5.5" fill="#0f172a" textAnchor="middle" fontWeight="800" fontFamily="sans-serif">
                      {mm}
                    </text>
                  )}
                </g>
              ))}
              {/* Fixed Left Jaw */}
              <path d="M 15 32 L 32 32 L 32 100 L 22 100 L 15 50 Z" fill="url(#beam-metal)" stroke="#334155" strokeWidth="1" />
              <path d="M 15 32 L 28 32 L 28 8 L 22 8 L 15 24 Z" fill="url(#beam-metal)" stroke="#334155" strokeWidth="0.8" />

              {/* Moving Right Slider & Jaw */}
              <g transform={`translate(${Math.min(Math.max(nominalNum * 1.5 * (0.2 + 0.8 * animProgress), 36), 160)}, 0)`} style={{ transition: 'transform 0.3s ease-out' }}>
                <path d="M 32 32 L 48 32 L 48 50 L 40 100 L 32 100 Z" fill="url(#beam-metal)" stroke="#334155" strokeWidth="1" />
                <path d="M 32 32 L 45 32 L 45 24 L 38 8 L 32 8 Z" fill="url(#beam-metal)" stroke="#334155" strokeWidth="0.8" />
                {/* Digimatic Sensor Housing */}
                <rect x="36" y="24" width="70" height="34" rx="4" fill="url(#jaw-body)" stroke="#0284c7" strokeWidth="1" />
                <rect x="42" y="30" width="58" height="22" rx="3" fill="#020617" stroke="#38bdf8" strokeWidth="0.8" />
                <text x="96" y="45" fontSize="11" fontWeight="900" fill="#38bdf8" textAnchor="end" fontFamily="monospace">
                  {displayString}
                </text>
                <text x="96" y="50" fontSize="5" fill="#94a3b8" textAnchor="end" fontWeight="700">
                  {unitMode.toUpperCase()}
                </text>
              </g>

              {/* Target Measured Part Graphic */}
              <rect x="32" y="58" width={Math.min(Math.max(nominalNum * 1.5 * (0.2 + 0.8 * animProgress), 36), 160)} height="38" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" rx="2" />
              <text x={32 + (Math.min(Math.max(nominalNum * 1.5 * (0.2 + 0.8 * animProgress), 36), 160)) / 2} y="80" fontSize="7.5" fontWeight="900" fill="#38bdf8" textAnchor="middle">
                PART {nominalNum}mm
              </text>
            </svg>
          )}

          {/* 2. OUTSIDE MICROMETER (0-25mm) */}
          {currentToolType === 'micrometer' && (
            <svg width="100%" height="110" viewBox="0 0 290 110" style={{ display: 'block', maxWidth: '300px' }}>
              <defs>
                <linearGradient id="micro-frame" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="40%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="chrome-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
              </defs>
              {/* C-Shaped Forged Frame */}
              <path d="M 40 45 C 40 95, 160 95, 160 45 L 140 45 C 140 80, 60 80, 60 45 Z" fill="url(#micro-frame)" stroke="#0284c7" strokeWidth="1.5" />
              <rect x="75" y="70" width="50" height="12" rx="2" fill="#0284c7" />
              <text x="100" y="79" fontSize="6.5" fontWeight="900" fill="white" textAnchor="middle">
                0-25mm 0.001mm
              </text>
              {/* Left Fixed Anvil */}
              <rect x="36" y="40" width="10" height="10" rx="1" fill="url(#chrome-grad)" stroke="#475569" strokeWidth="0.8" />
              
              {/* Part between Anvil & Spindle */}
              <rect x="46" y="38" width={Math.min(Math.max(nominalNum * 2.8 * (0.2 + 0.8 * animProgress), 15), 65)} height="14" rx="2" fill="rgba(34, 197, 94, 0.18)" stroke="#22c55e" strokeWidth="1" strokeDasharray="2 2" />
              <text x={46 + (Math.min(Math.max(nominalNum * 2.8 * (0.2 + 0.8 * animProgress), 15), 65)) / 2} y="48" fontSize="6" fontWeight="900" fill="#22c55e" textAnchor="middle">
                {nominalNum}mm
              </text>

              {/* Advancing Spindle */}
              <rect x={46 + Math.min(Math.max(nominalNum * 2.8 * (0.2 + 0.8 * animProgress), 15), 65)} y="41" width="40" height="8" fill="url(#chrome-grad)" stroke="#334155" strokeWidth="0.8" />

              {/* Sleeve Barrel with Vernier Scale */}
              <rect x="150" y="38" width="45" height="14" rx="1" fill="url(#chrome-grad)" stroke="#334155" strokeWidth="0.8" />
              <line x1="152" y1="45" x2="192" y2="45" stroke="#0f172a" strokeWidth="0.8" />
              {[0, 5, 10, 15, 20, 25].map(v => (
                <line key={v} x1={155 + v * 1.4} y1="42" x2={155 + v * 1.4} y2="45" stroke="#0f172a" strokeWidth="0.6" />
              ))}

              {/* Rotating Thimble & Ratchet Stop */}
              <rect x="195" y="35" width="55" height="20" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
              {[0, 10, 20, 30, 40, 50].map(th => (
                <line key={th} x1={198 + th * 0.9} y1="36" x2={198 + th * 0.9} y2="42" stroke="#ffffff" strokeWidth="0.6" opacity="0.7" />
              ))}
              <rect x="250" y="39" width="18" height="12" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />

              {/* Digital LCD Readout Box */}
              <rect x="80" y="24" width="70" height="22" rx="3" fill="#020617" stroke="#38bdf8" strokeWidth="1" />
              <text x="145" y="39" fontSize="11" fontWeight="900" fill="#38bdf8" textAnchor="end" fontFamily="monospace">
                {displayString}
              </text>
            </svg>
          )}

          {/* 3. DIAL INDICATOR (0.001mm) */}
          {currentToolType === 'dial_indicator' && (
            <svg width="100%" height="110" viewBox="0 0 290 110" style={{ display: 'block', maxWidth: '300px' }}>
              <defs>
                <radialGradient id="dial-face" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="85%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </radialGradient>
              </defs>
              {/* Stem & Contact Plunger Spindle */}
              <rect x="141" y="70" width="8" height="35" fill="#94a3b8" stroke="#334155" strokeWidth="0.8" />
              <circle cx="145" cy={102 - animProgress * 8} r="4" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
              {/* Part Surface line */}
              <line x1="80" y1="102" x2="210" y2="102" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
              <text x="82" y="98" fontSize="5.5" fontWeight="800" fill="#38bdf8">SURFACE DATUM</text>

              {/* Dial Outer Bezel */}
              <circle cx="145" cy="42" r="38" fill="#0f172a" stroke="#0284c7" strokeWidth="2" />
              <circle cx="145" cy="42" r="34" fill="url(#dial-face)" stroke="#334155" strokeWidth="0.8" />

              {/* 360-deg Tick Marks */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => {
                const rad = (deg * Math.PI) / 180;
                const x1 = 145 + Math.cos(rad) * 31;
                const y1 = 42 + Math.sin(rad) * 31;
                const x2 = 145 + Math.cos(rad) * (deg % 90 === 0 ? 24 : 27);
                const y2 = 42 + Math.sin(rad) * (deg % 90 === 0 ? 24 : 27);
                return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0f172a" strokeWidth={deg % 90 === 0 ? 1.2 : 0.6} />;
              })}
              <text x="145" y="24" fontSize="6.5" fontWeight="900" fill="#0f172a" textAnchor="middle">0</text>
              <text x="165" y="44" fontSize="5.5" fontWeight="800" fill="#0f172a" textAnchor="middle">25</text>
              <text x="145" y="62" fontSize="5.5" fontWeight="800" fill="#0f172a" textAnchor="middle">50</text>
              <text x="125" y="44" fontSize="5.5" fontWeight="800" fill="#0f172a" textAnchor="middle">75</text>
              <text x="145" y="34" fontSize="4.5" fontWeight="800" fill="#0284c7" textAnchor="middle">0.001mm</text>

              {/* Rotating Indicator Needle */}
              <g transform={`rotate(${((nominalNum * 36) % 360) * animProgress}, 145, 42)`} style={{ transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <line x1="145" y1="42" x2="145" y2="15" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="145" cy="42" r="3.5" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
              </g>

              {/* Live HUD box right */}
              <rect x="200" y="28" width="78" height="26" rx="3" fill="#020617" stroke="#38bdf8" strokeWidth="0.8" />
              <text x="239" y="40" fontSize="5.5" fill="#94a3b8" textAnchor="middle" fontWeight="700">INDICATOR READING</text>
              <text x="239" y="50" fontSize="9.5" fill="#38bdf8" textAnchor="middle" fontWeight="900" fontFamily="monospace">
                {displayString} mm
              </text>
            </svg>
          )}

          {/* 4. DIGITAL BORE GAUGE (18-35mm) */}
          {currentToolType === 'bore_gauge' && (
            <svg width="100%" height="110" viewBox="0 0 290 110" style={{ display: 'block', maxWidth: '300px' }}>
              {/* Cylinder Bore Cross Section */}
              <rect x="35" y="25" width="130" height="70" rx="4" fill="rgba(15, 23, 42, 0.6)" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="100" y="90" fontSize="6.5" fontWeight="800" fill="#38bdf8" textAnchor="middle">
                CYLINDER BORE Ø {nominalNum}mm
              </text>

              {/* Bore Gauge Centralizer Anvil */}
              <g transform="translate(100, 55)">
                {/* Horizontal Anvil Contacts expanding outward */}
                <line x1={-35 * (0.3 + 0.7 * animProgress)} y1="0" x2={35 * (0.3 + 0.7 * animProgress)} y2="0" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                <circle cx={-35 * (0.3 + 0.7 * animProgress)} cy="0" r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
                <circle cx={35 * (0.3 + 0.7 * animProgress)} cy="0" r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
                
                {/* Guide Centering Wheels */}
                <rect x="-14" y="-8" width="28" height="16" rx="3" fill="#334155" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="0" y1="-8" x2="0" y2="-45" stroke="#cbd5e1" strokeWidth="5" />
              </g>

              {/* Top Dial Indicator Head */}
              <g transform="translate(195, 25)">
                <circle cx="25" cy="25" r="22" fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="25" y="20" fontSize="5" fill="#94a3b8" textAnchor="middle" fontWeight="700">BORE READOUT</text>
                <text x="25" y="32" fontSize="9" fill="#22c55e" textAnchor="middle" fontWeight="900" fontFamily="monospace">
                  {displayString}
                </text>
                <text x="25" y="40" fontSize="4.5" fill="#38bdf8" textAnchor="middle" fontWeight="700">
                  DEV: {((measuredNum - nominalNum)).toFixed(3)} mm
                </text>
              </g>
            </svg>
          )}

          {/* 5. DIGITAL HEIGHT GAUGE (300mm) */}
          {currentToolType === 'height_gauge' && (
            <svg width="100%" height="110" viewBox="0 0 290 110" style={{ display: 'block', maxWidth: '300px' }}>
              {/* Heavy Granite Base */}
              <rect x="25" y="88" width="90" height="16" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <text x="70" y="99" fontSize="5.5" fill="#94a3b8" textAnchor="middle" fontWeight="800">GRANITE BASE</text>

              {/* Vertical Column Dual Beam */}
              <rect x="42" y="10" width="14" height="78" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
              {[0, 10, 20, 30, 40, 50, 60, 70].map(h => (
                <line key={h} x1="42" y1={15 + h} x2="48" y2={15 + h} stroke="#0f172a" strokeWidth="0.6" />
              ))}

              {/* Moving Vertical Slider Carriage */}
              <g transform={`translate(0, ${Math.max(12, 70 - nominalNum * 0.6 * animProgress)})`} style={{ transition: 'transform 0.3s ease-out' }}>
                <rect x="36" y="0" width="55" height="24" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                {/* Carbide Scriber Arm */}
                <path d="M 91 12 L 145 12 L 155 24 L 140 24 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.8" />
                <circle cx="155" cy="24" r="2.5" fill="#ef4444" />
                {/* LCD Display on Slider */}
                <rect x="40" y="4" width="46" height="16" rx="2" fill="#020617" stroke="#38bdf8" strokeWidth="0.5" />
                <text x="82" y="15" fontSize="8" fontWeight="900" fill="#38bdf8" textAnchor="end" fontFamily="monospace">
                  {displayString}
                </text>
              </g>

              {/* Measured Step Feature on Surface Plate */}
              <rect x="135" y="65" width="40" height="23" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
              <text x="155" y="80" fontSize="6" fontWeight="900" fill="#38bdf8" textAnchor="middle">
                H: {nominalNum}mm
              </text>

              {/* Status Info Box */}
              <g transform="translate(190, 30)">
                <rect x="0" y="0" width="85" height="38" rx="4" fill="#020617" stroke={statusColor} strokeWidth="1" />
                <text x="42" y="12" fontSize="5.5" fill="#94a3b8" textAnchor="middle" fontWeight="700">HEIGHT METROLOGY</text>
                <text x="42" y="24" fontSize="10" fill={statusColor} textAnchor="middle" fontWeight="900" fontFamily="monospace">
                  {displayString} mm
                </text>
                <text x="42" y="32" fontSize="5" fill="#22c55e" textAnchor="middle" fontWeight="800">
                  TOL: ±0.020 mm
                </text>
              </g>
            </svg>
          )}

          {/* 6. ZEISS CONTURA 3D CMM (Coordinate Measuring Machine) */}
          {currentToolType === 'cmm' && (
            <svg width="100%" height="110" viewBox="0 0 290 110" style={{ display: 'block', maxWidth: '300px' }}>
              {/* Z-Axis Motorized Ram Spindle */}
              <rect x="110" y="5" width="22" height="35" fill="#334155" stroke="#0284c7" strokeWidth="1" />
              
              {/* Renishaw Motorized Indexing Probe Head */}
              <rect x="105" y="40" width="32" height="18" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
              <text x="121" y="51" fontSize="5.5" fill="#38bdf8" textAnchor="middle" fontWeight="900">ZEISS PH10</text>

              {/* Probe Extension Rod & Ruby Ball Stylus */}
              <g transform={`translate(0, ${animProgress * 14})`} style={{ transition: 'transform 0.3s ease-out' }}>
                <line x1="121" y1="58" x2="121" y2="86" stroke="#e2e8f0" strokeWidth="2.5" />
                {/* Ruby Ball Sphere (Red) */}
                <circle cx="121" cy="88" r="4.5" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
                {/* Contact Laser Rings */}
                <circle cx="121" cy="88" r="9" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="2 2" opacity={animProgress} />
              </g>

              {/* Workpiece Surface Feature */}
              <rect x="75" y="98" width="95" height="10" rx="1" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
              <text x="122" y="105" fontSize="5" fill="#94a3b8" textAnchor="middle" fontWeight="800">CMM TOUCH CONTACT</text>

              {/* 3D Coordinate Real-Time Readout HUD */}
              <g transform="translate(180, 12)">
                <rect x="0" y="0" width="98" height="60" rx="4" fill="#020617" stroke="#38bdf8" strokeWidth="1" />
                <text x="49" y="12" fontSize="6" fill="#38bdf8" textAnchor="middle" fontWeight="900">ZEISS 3D COORDINATES</text>
                <line x1="6" y1="16" x2="92" y2="16" stroke="#1e293b" strokeWidth="0.8" />
                <text x="10" y="27" fontSize="7" fill="#f8fafc" fontWeight="700" fontFamily="monospace">X: {(ptX * 0.25).toFixed(3)} mm</text>
                <text x="10" y="38" fontSize="7" fill="#f8fafc" fontWeight="700" fontFamily="monospace">Y: {(ptY * 0.25).toFixed(3)} mm</text>
                <text x="10" y="49" fontSize="7" fill="#22c55e" fontWeight="900" fontFamily="monospace">Z: {displayString} mm</text>
                <rect x="6" y="52" width="86" height="6" rx="1" fill="rgba(34, 197, 94, 0.2)" />
                <text x="49" y="57" fontSize="4.5" fill="#22c55e" textAnchor="middle" fontWeight="900">✓ TOUCH TRIGGERED (0.0005mm)</text>
              </g>
            </svg>
          )}
        </div>

        {/* ─── CONTROLS & REAL-TIME READING FOOTER ─── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setUnitMode(u => (u === 'mm' ? 'inch' : 'mm'))}
              style={{
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                padding: '3px 8px',
                borderRadius: '5px',
                fontSize: '0.66rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              in / mm
            </button>
            <button
              onClick={() => {
                setIsZeroed(z => !z);
              }}
              style={{
                backgroundColor: isZeroed ? '#0284c7' : '#1e293b',
                color: isZeroed ? 'white' : '#94a3b8',
                border: isZeroed ? '1px solid #38bdf8' : '1px solid #334155',
                padding: '3px 8px',
                borderRadius: '5px',
                fontSize: '0.66rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ZERO
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onAutoSetMeasurement && (
              <button
                onClick={() => onAutoSetMeasurement(nominalNum.toFixed(3))}
                style={{
                  backgroundColor: '#0284c7',
                  color: 'white',
                  border: 'none',
                  padding: '3px 10px',
                  borderRadius: '5px',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
                }}
                title="Masukkan nilai nominal otomatis ke checksheet"
              >
                <Sparkles size={11} />
                <span>Auto-Fill</span>
              </button>
            )}
          </div>
        </div>
    </div>
  );
}
