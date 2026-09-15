import React, { useState, useEffect } from 'react';
import {
  Cog, Settings, Database, Activity, Gauge,
  Play, Square, RotateCcw, Power, Cpu,
  TrendingUp, AlertTriangle, CheckCircle2, ArrowRight
} from 'lucide-react';
import ScadaWidgetRenderer from '../../components/ScadaWidgets';

// Shared SCADA Keyframe animations
const ScadaAnimationStyles = () => (
  <style>{`
    @keyframes gluestack-scada-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes gluestack-scada-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @keyframes gluestack-scada-flow-h {
      from { stroke-dashoffset: 20; }
      to { stroke-dashoffset: 0; }
    }
    @keyframes gluestack-scada-flow-v {
      from { stroke-dashoffset: 20; }
      to { stroke-dashoffset: 0; }
    }
    @keyframes gluestack-scada-blink {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 1; }
    }
  `}</style>
);

const basePanelStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '12px',
  color: '#f8fafc',
  fontFamily: "'Inter', -apple-system, sans-serif",
  padding: '12px',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease-in-out'
};

// ─── 1. SCADA MOTOR ─────────────────────────────────────────────────────────────
export function ScadaMotor({
  id = 'motor_1',
  label = 'Motor Penggerak (M-101)',
  motorState: controlledState,
  rpm: controlledRpm = 1450,
  current: controlledCurrent = 12.8,
  colorRunning = '#22c55e',
  colorStopped = '#64748b',
  colorFault = '#ef4444',
  onChange,
  onStart,
  onStop,
  interactive = true,
  className = '',
  style = {}
}) {
  const [internalState, setInternalState] = useState(controlledState || 'STOPPED');
  const state = controlledState !== undefined ? controlledState : internalState;

  const isRunning = String(state).toUpperCase() === 'RUNNING';
  const isFault = String(state).toUpperCase() === 'FAULT';

  const activeColor = isRunning ? colorRunning : isFault ? colorFault : colorStopped;
  const currentRpm = isRunning ? controlledRpm : 0;
  const currentAmp = isRunning ? controlledCurrent : 0;

  const handleToggle = () => {
    if (!interactive) return;
    const nextState = isRunning ? 'STOPPED' : 'RUNNING';
    setInternalState(nextState);
    if (onChange) onChange({ state: nextState, rpm: nextState === 'RUNNING' ? controlledRpm : 0 });
    if (nextState === 'RUNNING' && onStart) onStart();
    if (nextState === 'STOPPED' && onStop) onStop();
  };

  return (
    <div
      id={id}
      onClick={handleToggle}
      className={`gluestack-scada-motor select-none ${interactive ? 'cursor-pointer hover:border-slate-500' : ''} ${className}`}
      style={{ ...basePanelStyle, width: '100%', height: '100%', minHeight: '120px', ...style }}
    >
      <ScadaAnimationStyles />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8' }}>{label}</span>
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: `${activeColor}22`,
            color: activeColor,
            border: `1px solid ${activeColor}44`
          }}
        >
          {state}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
        <svg viewBox="0 0 100 100" style={{ width: '85%', height: '85%', maxHeight: '90px' }}>
          {/* Motor Feet */}
          <rect x="25" y="72" width="12" height="8" rx="1" fill="#475569" />
          <rect x="63" y="72" width="12" height="8" rx="1" fill="#475569" />
          <rect x="20" y="78" width="60" height="4" rx="1" fill="#1e293b" />
          {/* Motor Body */}
          <rect x="28" y="24" width="44" height="48" rx="6" fill="#334155" stroke="#475569" strokeWidth="2" />
          {/* Fan Cover */}
          <path d="M 28 28 C 22 28 18 35 18 48 C 18 61 22 68 28 68 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          {/* Shaft */}
          <rect x="72" y="44" width="14" height="8" rx="1" fill="#64748b" />
          {/* Junction Box */}
          <rect x="40" y="16" width="20" height="10" rx="2" fill="#475569" stroke="#64748b" strokeWidth="1" />
          {/* Cooling fins */}
          <line x1="36" y1="26" x2="36" y2="70" stroke="#1e293b" strokeWidth="2" />
          <line x1="44" y1="26" x2="44" y2="70" stroke="#1e293b" strokeWidth="2" />
          <line x1="52" y1="26" x2="52" y2="70" stroke="#1e293b" strokeWidth="2" />
          <line x1="60" y1="26" x2="60" y2="70" stroke="#1e293b" strokeWidth="2" />
          {/* Animated Fan */}
          <g style={{ transformOrigin: '23px 48px', animation: isRunning ? 'gluestack-scada-spin 0.8s linear infinite' : 'none' }}>
            <circle cx="23" cy="48" r="8" fill="none" stroke={activeColor} strokeWidth="2" strokeDasharray="3 3" />
          </g>
          {/* Center status LED */}
          <circle
            cx="50"
            cy="48"
            r="7"
            fill={activeColor}
            style={{
              filter: isRunning ? `drop-shadow(0 0 8px ${activeColor})` : isFault ? `drop-shadow(0 0 8px ${activeColor})` : 'none',
              animation: isFault ? 'gluestack-scada-blink 0.5s infinite' : 'none'
            }}
          />
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', borderTop: '1px solid #1e293b', paddingTop: '6px' }}>
        <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{currentRpm} RPM</span>
        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{currentAmp} A</span>
      </div>
    </div>
  );
}

// ─── 2. SCADA VALVE ─────────────────────────────────────────────────────────────
export function ScadaValve({
  id = 'valve_1',
  label = 'Katup Solenoid (V-102)',
  valveState: controlledState,
  colorOpen = '#22c55e',
  colorClosed = '#ef4444',
  onChange,
  onOpen,
  onClose,
  interactive = true,
  className = '',
  style = {}
}) {
  const [internalState, setInternalState] = useState(controlledState || 'CLOSED');
  const state = controlledState !== undefined ? controlledState : internalState;
  const isOpen = String(state).toUpperCase() === 'OPEN';
  const valveColor = isOpen ? colorOpen : colorClosed;

  const handleToggle = () => {
    if (!interactive) return;
    const next = isOpen ? 'CLOSED' : 'OPEN';
    setInternalState(next);
    if (onChange) onChange({ state: next, isOpen: !isOpen });
    if (next === 'OPEN' && onOpen) onOpen();
    if (next === 'CLOSED' && onClose) onClose();
  };

  return (
    <div
      id={id}
      onClick={handleToggle}
      className={`gluestack-scada-valve select-none ${interactive ? 'cursor-pointer hover:border-slate-500' : ''} ${className}`}
      style={{ ...basePanelStyle, width: '100%', height: '100%', minHeight: '120px', ...style }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8' }}>{label}</span>
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: `${valveColor}22`,
            color: valveColor,
            border: `1px solid ${valveColor}44`
          }}
        >
          {state}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
        <svg viewBox="0 0 60 60" style={{ width: '80%', height: '80%', maxHeight: '80px' }}>
          {/* Flanges */}
          <rect x="5" y="20" width="4" height="20" rx="1" fill="#475569" />
          <rect x="51" y="20" width="4" height="20" rx="1" fill="#475569" />
          {/* Pipe line */}
          <line x1="9" y1="30" x2="51" y2="30" stroke="#475569" strokeWidth="6" />
          {/* Valve Triangles */}
          <polygon points="10,20 10,40 30,30" fill={valveColor} stroke="#334155" strokeWidth="1.5" />
          <polygon points="50,20 50,40 30,30" fill={valveColor} stroke="#334155" strokeWidth="1.5" />
          {/* Center Stem */}
          <circle cx="30" cy="30" r="5" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
          <line x1="30" y1="25" x2="30" y2="10" stroke="#64748b" strokeWidth="3" />
          {/* Handwheel */}
          <ellipse cx="30" cy="9" rx="11" ry="3.5" fill={isOpen ? colorOpen : '#64748b'} stroke="#334155" strokeWidth="1.5" />
        </svg>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.68rem', color: valveColor, fontWeight: 'bold' }}>
        {isOpen ? 'ALIRAN TERBUKA' : 'ALIRAN TERTUTUP'}
      </div>
    </div>
  );
}

// ─── 3. SCADA TANK / LEVEL ──────────────────────────────────────────────────────
export function ScadaTank({
  id = 'tank_1',
  label = 'Tangki Penampungan (TK-01)',
  capacity = 1000,
  level: controlledLevel = 650,
  unit = 'L',
  fluidColor = '#0284c7',
  lowAlarm = 150,
  highAlarm = 900,
  onChange,
  className = '',
  style = {}
}) {
  const [internalLevel, setInternalLevel] = useState(controlledLevel);
  const currentLevel = controlledLevel !== undefined ? controlledLevel : internalLevel;

  const pct = Math.max(0, Math.min(100, Math.round((currentLevel / capacity) * 100)));
  const isLowAlarm = currentLevel <= lowAlarm;
  const isHighAlarm = currentLevel >= highAlarm;

  const handleStep = (delta) => {
    const next = Math.max(0, Math.min(capacity, currentLevel + delta));
    setInternalLevel(next);
    if (onChange) onChange({ level: next, percentage: Math.round((next / capacity) * 100) });
  };

  return (
    <div
      id={id}
      className={`gluestack-scada-tank select-none ${className}`}
      style={{ ...basePanelStyle, width: '100%', height: '100%', minHeight: '160px', ...style }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8' }}>{label}</span>
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: isHighAlarm ? '#ef444422' : isLowAlarm ? '#eab30822' : '#0284c722',
            color: isHighAlarm ? '#ef4444' : isLowAlarm ? '#eab308' : '#38bdf8',
            border: `1px solid ${isHighAlarm ? '#ef4444' : isLowAlarm ? '#eab308' : '#0284c7'}44`
          }}
        >
          {isHighAlarm ? 'HIGH ALARM' : isLowAlarm ? 'LOW LEVEL' : 'NORMAL'}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
        {/* Tank Body SVG */}
        <div style={{ position: 'relative', width: '70px', height: '100px', backgroundColor: '#1e293b', borderRadius: '12px', border: '2px solid #475569', overflow: 'hidden' }}>
          {/* High alarm marker line */}
          <div style={{ position: 'absolute', top: `${100 - (highAlarm / capacity) * 100}%`, left: 0, right: 0, height: '2px', backgroundColor: '#ef4444', opacity: 0.8, zIndex: 5 }} />
          {/* Low alarm marker line */}
          <div style={{ position: 'absolute', top: `${100 - (lowAlarm / capacity) * 100}%`, left: 0, right: 0, height: '2px', backgroundColor: '#eab308', opacity: 0.8, zIndex: 5 }} />

          {/* Liquid Fill */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${pct}%`,
              backgroundColor: fluidColor,
              opacity: 0.85,
              transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Fluid Wave Highlight */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#ffffff', opacity: 0.3 }} />
          </div>
          {/* Level Percentage Overlay */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.8)', zIndex: 10 }}>
            {pct}%
          </div>
        </div>

        {/* Level Controls & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            type="button"
            onClick={() => handleStep(50)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded border border-slate-600 active:scale-95 transition-transform"
          >
            +50 {unit}
          </button>
          <button
            type="button"
            onClick={() => handleStep(-50)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded border border-slate-600 active:scale-95 transition-transform"
          >
            -50 {unit}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', borderTop: '1px solid #1e293b', paddingTop: '6px' }}>
        <span style={{ color: '#cbd5e1' }}>{currentLevel} / {capacity} {unit}</span>
        <span style={{ color: '#94a3b8' }}>Max {capacity} {unit}</span>
      </div>
    </div>
  );
}

// ─── 4. SCADA PIPE ──────────────────────────────────────────────────────────────
export function ScadaPipe({
  id = 'pipe_1',
  direction = 'horizontal', // horizontal | vertical
  fluidColor = '#06b6d4',
  flowSpeed = 3,
  isActive = true,
  className = '',
  style = {}
}) {
  const isH = direction === 'horizontal';
  const duration = Math.max(0.5, 6 - flowSpeed);

  return (
    <div
      id={id}
      className={`gluestack-scada-pipe ${className}`}
      style={{
        width: isH ? '100%' : '32px',
        height: isH ? '32px' : '100%',
        minWidth: isH ? '80px' : '28px',
        minHeight: isH ? '28px' : '80px',
        position: 'relative',
        ...style
      }}
    >
      <ScadaAnimationStyles />
      <svg width="100%" height="100%" style={{ display: 'block' }}>
        {/* Pipe Outer Metal */}
        {isH ? (
          <rect x="0" y="4" width="100%" height="24" rx="4" fill="#334155" stroke="#475569" strokeWidth="1.5" />
        ) : (
          <rect x="4" y="0" width="24" height="100%" rx="4" fill="#334155" stroke="#475569" strokeWidth="1.5" />
        )}
        {/* Flow Line */}
        {isH ? (
          <line
            x1="0"
            y1="16"
            x2="100%"
            y2="16"
            stroke={fluidColor}
            strokeWidth="8"
            strokeDasharray="12,10"
            style={{ animation: isActive ? `gluestack-scada-flow-h ${duration}s linear infinite` : 'none' }}
          />
        ) : (
          <line
            x1="16"
            y1="0"
            x2="16"
            y2="100%"
            stroke={fluidColor}
            strokeWidth="8"
            strokeDasharray="12,10"
            style={{ animation: isActive ? `gluestack-scada-flow-v ${duration}s linear infinite` : 'none' }}
          />
        )}
        {/* Pipe Highlight Reflection */}
        {isH ? (
          <rect x="0" y="6" width="100%" height="3" fill="rgba(255,255,255,0.2)" />
        ) : (
          <rect x="6" y="0" width="3" height="100%" fill="rgba(255,255,255,0.2)" />
        )}
      </svg>
    </div>
  );
}

// ─── 5. SCADA PUMP ──────────────────────────────────────────────────────────────
export function ScadaPump({
  id = 'pump_1',
  label = 'Pompa Sirkulasi (P-101)',
  pumpState: controlledState,
  rpm = 2900,
  colorRunning = '#22c55e',
  colorStopped = '#64748b',
  colorFault = '#ef4444',
  onChange,
  onStart,
  onStop,
  interactive = true,
  className = '',
  style = {}
}) {
  const [internalState, setInternalState] = useState(controlledState || 'STOPPED');
  const state = controlledState !== undefined ? controlledState : internalState;
  const isRunning = String(state).toUpperCase() === 'RUNNING';
  const pumpColor = isRunning ? colorRunning : state === 'FAULT' ? colorFault : colorStopped;

  const handleToggle = () => {
    if (!interactive) return;
    const next = isRunning ? 'STOPPED' : 'RUNNING';
    setInternalState(next);
    if (onChange) onChange({ state: next });
    if (next === 'RUNNING' && onStart) onStart();
    if (next === 'STOPPED' && onStop) onStop();
  };

  return (
    <div
      id={id}
      onClick={handleToggle}
      className={`gluestack-scada-pump select-none ${interactive ? 'cursor-pointer hover:border-slate-500' : ''} ${className}`}
      style={{ ...basePanelStyle, width: '100%', height: '100%', minHeight: '120px', ...style }}
    >
      <ScadaAnimationStyles />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8' }}>{label}</span>
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: `${pumpColor}22`,
            color: pumpColor,
            border: `1px solid ${pumpColor}44`
          }}
        >
          {state}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
        <svg viewBox="0 0 60 60" style={{ width: '80%', height: '80%', maxHeight: '80px' }}>
          {/* Suction Nozzle */}
          <rect x="2" y="24" width="12" height="12" fill="#334155" stroke="#475569" />
          {/* Discharge Nozzle */}
          <rect x="24" y="2" width="12" height="12" fill="#334155" stroke="#475569" />
          {/* Pump Volute Casing */}
          <circle cx="30" cy="30" r="20" fill="#1e293b" stroke="#475569" strokeWidth="2.5" />
          {/* Inner Pump Chamber */}
          <circle cx="30" cy="30" r="14" fill="#0f172a" />
          {/* Animated Impeller */}
          <g style={{ transformOrigin: '30px 30px', animation: isRunning ? 'gluestack-scada-spin 0.6s linear infinite' : 'none' }}>
            <line x1="18" y1="30" x2="42" y2="30" stroke={pumpColor} strokeWidth="3" />
            <line x1="30" y1="18" x2="30" y2="42" stroke={pumpColor} strokeWidth="3" />
            <circle cx="30" cy="30" r="4" fill={pumpColor} />
          </g>
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', borderTop: '1px solid #1e293b', paddingTop: '6px' }}>
        <span style={{ color: pumpColor, fontWeight: 'bold' }}>{state}</span>
        <span style={{ color: '#cbd5e1' }}>{isRunning ? rpm : 0} RPM</span>
      </div>
    </div>
  );
}

// ─── 6. SCADA CONVEYOR ──────────────────────────────────────────────────────────
export function ScadaConveyor({
  id = 'conveyor_1',
  label = 'Belt Conveyor (CV-01)',
  conveyorState: controlledState,
  speed = 1.2,
  direction = 'RIGHT',
  onChange,
  interactive = true,
  className = '',
  style = {}
}) {
  const [internalState, setInternalState] = useState(controlledState || 'RUNNING');
  const state = controlledState !== undefined ? controlledState : internalState;
  const isRunning = String(state).toUpperCase() === 'RUNNING';

  const handleToggle = () => {
    if (!interactive) return;
    const next = isRunning ? 'STOPPED' : 'RUNNING';
    setInternalState(next);
    if (onChange) onChange({ state: next, speed: next === 'RUNNING' ? speed : 0 });
  };

  return (
    <div
      id={id}
      onClick={handleToggle}
      className={`gluestack-scada-conveyor select-none ${interactive ? 'cursor-pointer hover:border-slate-500' : ''} ${className}`}
      style={{ ...basePanelStyle, width: '100%', height: '100%', minHeight: '110px', ...style }}
    >
      <ScadaAnimationStyles />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8' }}>{label}</span>
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: isRunning ? '#22c55e22' : '#64748b22',
            color: isRunning ? '#22c55e' : '#64748b',
            border: `1px solid ${isRunning ? '#22c55e' : '#64748b'}44`
          }}
        >
          {state}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
        <svg viewBox="0 0 200 60" style={{ width: '95%', maxHeight: '55px' }}>
          {/* Rollers */}
          <circle cx="20" cy="30" r="14" fill="#334155" stroke="#475569" strokeWidth="2" />
          <circle cx="20" cy="30" r="4" fill="#94a3b8" />
          <circle cx="180" cy="30" r="14" fill="#334155" stroke="#475569" strokeWidth="2" />
          <circle cx="180" cy="30" r="4" fill="#94a3b8" />
          {/* Support rollers */}
          <circle cx="60" cy="30" r="8" fill="#1e293b" />
          <circle cx="100" cy="30" r="8" fill="#1e293b" />
          <circle cx="140" cy="30" r="8" fill="#1e293b" />
          {/* Belt */}
          <rect x="20" y="14" width="160" height="32" rx="16" fill="none" stroke="#475569" strokeWidth="4" />
          <rect
            x="20"
            y="14"
            width="160"
            height="32"
            rx="16"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="8, 8"
            style={{
              animation: isRunning
                ? `gluestack-scada-flow-h ${1 / speed}s linear infinite ${direction === 'LEFT' ? 'reverse' : ''}`
                : 'none'
            }}
          />
          {/* Material on Conveyor */}
          {isRunning && (
            <g>
              <rect x="55" y="6" width="16" height="12" rx="2" fill="#d97706" />
              <rect x="115" y="6" width="16" height="12" rx="2" fill="#d97706" />
            </g>
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', borderTop: '1px solid #1e293b', paddingTop: '6px' }}>
        <span style={{ color: '#cbd5e1' }}>Arah: {direction}</span>
        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{isRunning ? speed : 0} m/s</span>
      </div>
    </div>
  );
}

// ─── 7. SCADA CIRCULAR GAUGE ───────────────────────────────────────────────────
export function ScadaGauge({
  id = 'gauge_1',
  label = 'Pressure Gauge (PT-01)',
  value: controlledValue = 4.2,
  min = 0,
  max = 10,
  unit = 'bar',
  warnLimit = 7.0,
  alarmLimit = 8.5,
  className = '',
  style = {}
}) {
  const value = Number(controlledValue);
  const clamped = Math.max(min, Math.min(max, value));
  const pct = (clamped - min) / (max - min);
  // Angle range: -120 deg to +120 deg (240 deg total)
  const angle = -120 + pct * 240;

  const isAlarm = value >= alarmLimit;
  const isWarn = value >= warnLimit;
  const statusColor = isAlarm ? '#ef4444' : isWarn ? '#eab308' : '#22c55e';

  return (
    <div
      id={id}
      className={`gluestack-scada-gauge ${className}`}
      style={{ ...basePanelStyle, width: '100%', height: '100%', minHeight: '140px', ...style }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8' }}>{label}</span>
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: `${statusColor}22`,
            color: statusColor,
            border: `1px solid ${statusColor}44`
          }}
        >
          {isAlarm ? 'CRITICAL' : isWarn ? 'WARNING' : 'NORMAL'}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <svg viewBox="0 0 100 90" style={{ width: '85%', maxHeight: '90px' }}>
          {/* Dial Arc Background */}
          <path d="M 20 70 A 38 38 0 1 1 80 70" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
          {/* Dial Warning & Alarm Sectors */}
          <path d="M 20 70 A 38 38 0 0 1 50 12" fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
          <path d="M 50 12 A 38 38 0 0 1 72 26" fill="none" stroke="#eab308" strokeWidth="6" opacity="0.6" />
          <path d="M 72 26 A 38 38 0 0 1 80 70" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
          {/* Deflection Needle */}
          <g style={{ transformOrigin: '50px 50px', transform: `rotate(${angle}deg)`, transition: 'transform 0.4s ease-out' }}>
            <line x1="50" y1="50" x2="50" y2="18" stroke={statusColor} strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="50" r="5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          </g>
        </svg>
      </div>

      <div style={{ textAlign: 'center', borderTop: '1px solid #1e293b', paddingTop: '4px' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: statusColor }}>{value}</span>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '4px' }}>{unit}</span>
      </div>
    </div>
  );
}

// ─── 8. SCADA DIGITAL DISPLAY ──────────────────────────────────────────────────
export function ScadaDigitalDisplay({
  id = 'digital_1',
  label = 'Flow Rate (FIT-201)',
  value = 142.8,
  unit = 'm³/h',
  status = 'ONLINE',
  className = '',
  style = {}
}) {
  return (
    <div
      id={id}
      className={`gluestack-scada-digital ${className}`}
      style={{ ...basePanelStyle, width: '100%', height: '100%', minHeight: '90px', ...style }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8' }}>{label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', color: '#22c55e', fontWeight: 'bold' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
          {status}
        </span>
      </div>

      {/* 7-Segment industrial digital LCD look */}
      <div
        style={{
          backgroundColor: '#020617',
          borderRadius: '8px',
          padding: '8px 12px',
          border: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          margin: '6px 0'
        }}
      >
        <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '2px', textShadow: '0 0 10px rgba(56, 189, 248, 0.5)' }}>
          {value}
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>
          {unit}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b' }}>
        <span>Sampling: 100ms</span>
        <span>Modbus TCP</span>
      </div>
    </div>
  );
}

// ─── 9. SCADA INDUSTRIAL PUSH BUTTONS (START / STOP / RESET) ────────────────────
export function ScadaStartStop({
  id = 'btn_group_1',
  label = 'Kontrol Operasi Panel',
  onStart,
  onStop,
  onReset,
  className = '',
  style = {}
}) {
  return (
    <div
      id={id}
      className={`gluestack-scada-buttons ${className}`}
      style={{ ...basePanelStyle, width: '100%', height: '100%', minHeight: '110px', ...style }}
    >
      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8' }}>{label}</span>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', margin: '8px 0' }}>
        {/* START BUTTON */}
        <button
          type="button"
          onClick={() => onStart && onStart()}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold border-2 border-emerald-400 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 mb-1 fill-white" />
          <span className="text-[10px] uppercase tracking-wider">START</span>
        </button>

        {/* STOP BUTTON */}
        <button
          type="button"
          onClick={() => onStop && onStop()}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold border-2 border-rose-400 shadow-lg shadow-rose-900/40 transition-all cursor-pointer"
        >
          <Square className="w-5 h-5 mb-1 fill-white" />
          <span className="text-[10px] uppercase tracking-wider">STOP</span>
        </button>

        {/* RESET BUTTON */}
        <button
          type="button"
          onClick={() => onReset && onReset()}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold border-2 border-amber-400 shadow-lg shadow-amber-900/40 transition-all cursor-pointer"
        >
          <RotateCcw className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase tracking-wider">RESET</span>
        </button>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#64748b' }}>
        Tactile Dual-Action Pushbuttons
      </div>
    </div>
  );
}

// ─── 10. SCADA TOGGLE / SELECTOR SWITCH ────────────────────────────────────────
export function ScadaToggleSwitch({
  id = 'switch_1',
  label = 'Mode Operasi (Sel-01)',
  mode: controlledMode,
  options = ['AUTO', 'MANUAL', 'OFF'],
  onChange,
  className = '',
  style = {}
}) {
  const [internalMode, setInternalMode] = useState(controlledMode || options[0] || 'AUTO');
  const currentMode = controlledMode !== undefined ? controlledMode : internalMode;

  const handleSelect = (m) => {
    setInternalMode(m);
    if (onChange) onChange({ mode: m });
  };

  return (
    <div
      id={id}
      className={`gluestack-scada-switch ${className}`}
      style={{ ...basePanelStyle, width: '100%', height: '100%', minHeight: '100px', ...style }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#38bdf8' }}>{currentMode}</span>
      </div>

      {/* Industrial Selector Switch */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: '#020617', borderRadius: '8px', border: '1px solid #1e293b' }}>
        {options.map((opt) => {
          const isActive = currentMode === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: '0.68rem',
                fontWeight: 'bold',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive ? '#0284c7' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: 'right', fontSize: '0.65rem', color: '#64748b' }}>
        Posisi Aktif: <strong style={{ color: '#f8fafc' }}>{currentMode}</strong>
      </div>
    </div>
  );
}

// ─── 11. SCADA PLC / GATEWAY STATUS ─────────────────────────────────────────────
export function ScadaPlcStatus({
  id = 'plc_1',
  controllerName = 'Siemens S7-1500 (Line 1)',
  ipAddress = '192.168.1.120',
  protocol = 'Modbus TCP',
  cycleTime = 14, // ms
  status = 'ONLINE',
  className = '',
  style = {}
}) {
  const isOnline = status === 'ONLINE' || status === 'connected';

  return (
    <div
      id={id}
      className={`gluestack-scada-plc ${className}`}
      style={{ ...basePanelStyle, width: '100%', height: '100%', minHeight: '110px', ...style }}
    >
      <ScadaAnimationStyles />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 'bold', color: '#f8fafc' }}>
          <Cpu className="w-4 h-4 text-[#38bdf8]" />
          {controllerName}
        </span>
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: isOnline ? '#22c55e22' : '#ef444422',
            color: isOnline ? '#22c55e' : '#ef4444',
            border: `1px solid ${isOnline ? '#22c55e' : '#ef4444'}44`,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isOnline ? '#22c55e' : '#ef4444',
              animation: isOnline ? 'gluestack-scada-pulse 1s infinite' : 'none'
            }}
          />
          {status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '6px 0' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '6px 8px', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block' }}>IP / HOST</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#cbd5e1' }}>{ipAddress}</span>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '6px 8px', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block' }}>CYCLE TIME</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#38bdf8' }}>{cycleTime} ms</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b' }}>
        <span>Protokol: {protocol}</span>
        <span>Rack 0 / Slot 2</span>
      </div>
    </div>
  );
}

// ─── 12. SCADA SPARKLINE TREND ──────────────────────────────────────────────────
export function ScadaTrend({
  id = 'trend_1',
  label = 'Trend Suhu Reaktor (TT-101)',
  data = [45, 48, 52, 50, 54, 58, 62, 60, 65, 63, 68],
  unit = '°C',
  className = '',
  style = {}
}) {
  const points = data && data.length > 0 ? data : [40, 42, 45, 44, 46];
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const current = points[points.length - 1];

  // SVG Polyline generation
  const width = 180;
  const height = 45;
  const polyPoints = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((p - minVal) / (maxVal - minVal || 1)) * (height - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div
      id={id}
      className={`gluestack-scada-trend ${className}`}
      style={{ ...basePanelStyle, width: '100%', height: '100%', minHeight: '120px', ...style }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>
          {current} {unit}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
          <polyline
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            points={polyPoints}
          />
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b' }}>
        <span>Min: {minVal} {unit}</span>
        <span>Max: {maxVal} {unit}</span>
      </div>
    </div>
  );
}

// ─── 13. UNIVERSAL SCADA BRIDGE WIDGET ──────────────────────────────────────────
export function ScadaUniversalWidget({
  comp,
  viewMode = 'PREVIEW',
  previewFormValues = {},
  setPreviewFormValues = () => {},
  resolveComponentDatasourceValue = (c, def) => def,
  syncInputDatasourceValue = () => {},
  onWidgetInteraction = () => {},
  safeRender = (fn) => fn()
}) {
  if (!comp) return null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ScadaWidgetRenderer
        comp={comp}
        viewMode={viewMode}
        previewFormValues={previewFormValues}
        setPreviewFormValues={setPreviewFormValues}
        resolveComponentDatasourceValue={resolveComponentDatasourceValue}
        syncInputDatasourceValue={syncInputDatasourceValue}
        onWidgetInteraction={onWidgetInteraction}
        safeRender={safeRender}
      />
    </div>
  );
}

export default {
  ScadaMotor,
  ScadaValve,
  ScadaTank,
  ScadaPipe,
  ScadaPump,
  ScadaConveyor,
  ScadaGauge,
  ScadaDigitalDisplay,
  ScadaStartStop,
  ScadaToggleSwitch,
  ScadaPlcStatus,
  ScadaTrend,
  ScadaUniversalWidget
};
