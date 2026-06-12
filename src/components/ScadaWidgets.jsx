import React, { useState, useEffect, useRef } from 'react';
import {
    Flame, Wind, Snowflake, Gauge, Thermometer, Waves, BarChart, Zap, Binary, Hash, Target,
    TrendingUp, AreaChart, CircleDot, Minus, Database, Bell, ListOrdered, FileText, CheckCircle2,
    PlaySquare, StopCircle, RotateCcw, ToggleLeft, Settings, ToggleRight, Cpu, PieChart, Clock,
    Factory, LineChart, Package, Activity, ArrowRight, RotateCw, ArrowDownUp, Container, Cog, Play, Info
} from 'lucide-react';

// Common visual styles for SCADA with light/dark theme variables support
const themeStyles = {
    panelBg: 'var(--bg-panel, #0f172a)',
    panelBorder: 'var(--border-primary, #334155)',
    textMain: 'var(--text-primary, #f8fafc)',
    textSec: 'var(--text-tertiary, #94a3b8)',
    gridLine: 'var(--border-secondary, #1e293b)',
    glowGreen: '0 0 12px rgba(34, 197, 94, 0.4)',
    glowRed: '0 0 12px rgba(239, 68, 68, 0.4)',
    glowAmber: '0 0 12px rgba(245, 158, 11, 0.4)',
    glowBlue: '0 0 12px rgba(59, 130, 246, 0.4)',
};

export default function ScadaWidgetRenderer({
    comp,
    viewMode,
    previewFormValues,
    setPreviewFormValues,
    resolveComponentDatasourceValue,
    syncInputDatasourceValue,
    onWidgetInteraction,
    safeRender
}) {
    // Helper to format values
    const formatNumber = (num, decimals = 1) => {
        const val = Number(num);
        return isNaN(val) ? '0.0' : val.toFixed(decimals);
    };

    // Shared keyframes injection (one time per component render is fine, but scoped styling is cleaner)
    const injectStyles = () => {
        return (
            <style>{`
                @keyframes scada-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes scada-pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                @keyframes scada-flow {
                    from { stroke-dashoffset: 20; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes scada-marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                @keyframes scada-blink {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 1; }
                }
            `}</style>
        );
    };

    const isVisible = comp.props.visible !== false;
    if (!isVisible && viewMode === 'PREVIEW') return null;

    // Helper for interactive click handler
    const handleValueChange = (newValue) => {
        if (viewMode !== 'PREVIEW') return;
        setPreviewFormValues(prev => ({ ...prev, [comp.id]: newValue }));
        syncInputDatasourceValue(comp, newValue, 'SCADA_VALUE_CHANGED');
        onWidgetInteraction(comp, 'ValueChanged', { value: newValue });
    };

    const containerStyle = {
        width: '100%',
        height: '100%',
        backgroundColor: comp.props.backgroundColor || themeStyles.panelBg,
        border: `1px solid ${comp.props.borderColor || themeStyles.panelBorder}`,
        borderRadius: '12px',
        color: themeStyles.textMain,
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: '12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    switch (comp.type) {
        // ==========================================
        // BATCH 1: PROCESS EQUIPMENT
        // ==========================================
        case 'SCADA_MOTOR': {
            const rawStatus = resolveComponentDatasourceValue(comp, comp.props.motorState || 'STOPPED');
            const status = String(rawStatus).toUpperCase();
            const isRunning = status === 'RUNNING';
            const isFault = status === 'FAULT';

            const runColor = comp.props.colorRunning || '#22c55e';
            const stopColor = comp.props.colorStopped || '#64748b';
            const faultColor = comp.props.colorFault || '#ef4444';

            let motorColor = stopColor;
            if (isRunning) motorColor = runColor;
            else if (isFault) motorColor = faultColor;

            const rpm = isRunning ? (comp.props.rpm || 1450) : 0;
            const current = isRunning ? (comp.props.current || 12.8) : 0;

            return (
                <div style={containerStyle}>
                    {injectStyles()}
                    <div style={{ fontSize: '0.7rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'MOTOR'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '80%', height: '80%' }}>
                            {/* Motor feet */}
                            <rect x="25" y="72" width="12" height="8" fill="#475569" />
                            <rect x="63" y="72" width="12" height="8" fill="#475569" />
                            <rect x="20" y="78" width="60" height="4" fill="#1e293b" />
                            {/* Motor Body (Cylindrical structure) */}
                            <rect x="28" y="24" width="44" height="48" rx="6" fill="#334155" stroke="#475569" strokeWidth="2" />
                            {/* Fan Cover */}
                            <path d="M 28 28 C 22 28 18 35 18 48 C 18 61 22 68 28 68 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                            {/* Shaft */}
                            <rect x="72" y="44" width="14" height="8" fill="#64748b" />
                            {/* Junction Box */}
                            <rect x="40" y="16" width="20" height="10" rx="2" fill="#475569" stroke="#64748b" strokeWidth="1" />
                            {/* Cooling fins lines */}
                            <line x1="36" y1="26" x2="36" y2="70" stroke="#1e293b" strokeWidth="2" />
                            <line x1="44" y1="26" x2="44" y2="70" stroke="#1e293b" strokeWidth="2" />
                            <line x1="52" y1="26" x2="52" y2="70" stroke="#1e293b" strokeWidth="2" />
                            <line x1="60" y1="26" x2="60" y2="70" stroke="#1e293b" strokeWidth="2" />
                            {/* Fan inside cover (animated) */}
                            <g style={{ transformOrigin: '23px 48px', animation: isRunning ? 'scada-spin 1s linear infinite' : 'none' }}>
                                <circle cx="23" cy="48" r="8" fill="none" stroke={motorColor} strokeWidth="2" strokeDasharray="3 3" />
                            </g>
                            {/* Status glowing bulb in center */}
                            <circle cx="50" cy="48" r="8" fill={motorColor} style={{ filter: isRunning ? `drop-shadow(${themeStyles.glowGreen})` : isFault ? `drop-shadow(${themeStyles.glowRed})` : 'none' }} />
                        </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                        <span style={{ color: motorColor, fontWeight: 'bold' }}>{status}</span>
                        <span>{rpm} RPM</span>
                        <span style={{ color: '#3b82f6' }}>{current}A</span>
                    </div>
                </div>
            );
        }

        case 'SCADA_CONVEYOR': {
            const rawStatus = resolveComponentDatasourceValue(comp, comp.props.conveyorState || 'STOPPED');
            const status = String(rawStatus).toUpperCase();
            const isRunning = status === 'RUNNING';
            const speed = Number(comp.props.speed || (isRunning ? 60 : 0));
            const direction = comp.props.direction || 'RIGHT';

            const flowAnimation = isRunning ? `scada-flow ${100 / (speed || 1)}s linear infinite ${direction === 'LEFT' ? '' : 'reverse'}` : 'none';

            return (
                <div style={containerStyle}>
                    {injectStyles()}
                    <div style={{ fontSize: '0.7rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'CONVEYOR'}</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <svg viewBox="0 0 200 60" style={{ width: '100%' }}>
                            {/* Rollers */}
                            <circle cx="20" cy="30" r="14" fill="#334155" stroke="#475569" strokeWidth="2" />
                            <circle cx="20" cy="30" r="4" fill="#94a3b8" />
                            <circle cx="180" cy="30" r="14" fill="#334155" stroke="#475569" strokeWidth="2" />
                            <circle cx="180" cy="30" r="4" fill="#94a3b8" />
                            {/* Intermediate support rollers */}
                            <circle cx="60" cy="30" r="8" fill="#1e293b" />
                            <circle cx="100" cy="30" r="8" fill="#1e293b" />
                            <circle cx="140" cy="30" r="8" fill="#1e293b" />
                            {/* Belt Outline */}
                            <rect x="20" y="14" width="160" height="32" rx="16" fill="none" stroke="#475569" strokeWidth="4" />
                            {/* Belt Conveying Indicator Line */}
                            <rect x="20" y="14" width="160" height="32" rx="16" fill="none" stroke="#38bdf8" strokeWidth="2"
                                strokeDasharray="8, 8" style={{ animation: flowAnimation }} />
                            {/* Load/Material on Conveyor if running */}
                            {isRunning && (
                                <g>
                                    <path d="M 50 12 Q 60 4 70 12 Z" fill="#d97706" />
                                    <path d="M 120 12 Q 130 4 140 12 Z" fill="#d97706" />
                                </g>
                            )}
                        </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                        <span style={{ color: isRunning ? '#22c55e' : '#64748b' }}>{status}</span>
                        <span>{direction}</span>
                        <span>{speed} m/s</span>
                    </div>
                </div>
            );
        }

        case 'SCADA_MIXER': {
            const rawStatus = resolveComponentDatasourceValue(comp, comp.props.mixerState || 'STOPPED');
            const status = String(rawStatus).toUpperCase();
            const isRunning = status === 'RUNNING';
            const rpm = isRunning ? (comp.props.rpm || 350) : 0;
            const motorColor = isRunning ? (comp.props.colorRunning || '#22c55e') : (comp.props.colorStopped || '#64748b');

            return (
                <div style={containerStyle}>
                    {injectStyles()}
                    <div style={{ fontSize: '0.7rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'AGITATOR / MIXER'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 100 120" style={{ width: '80%', height: '80%' }}>
                            {/* Tank Structure */}
                            <path d="M 20 20 L 20 90 Q 20 110 50 110 Q 80 110 80 90 L 80 20 Z" fill="#1e293b" stroke="#475569" strokeWidth="2.5" />
                            {/* Liquid fill indicator */}
                            <path d="M 21 60 L 21 90 Q 21 109 50 109 Q 79 109 79 90 L 79 60 Z" fill="#0369a1" opacity="0.4" />
                            {/* Mixer Motor Top */}
                            <rect x="40" y="5" width="20" height="15" fill="#334155" stroke="#475569" />
                            <circle cx="50" cy="12" r="3" fill={motorColor} />
                            {/* Mixer Shaft */}
                            <line x1="50" y1="20" x2="50" y2="85" stroke="#94a3b8" strokeWidth="3.5" />
                            {/* Rotating Blades (Animated) */}
                            <g style={{ transformOrigin: '50px 85px', animation: isRunning ? 'scada-spin 1.5s linear infinite' : 'none' }}>
                                <line x1="20" y1="85" x2="80" y2="85" stroke="#f8fafc" strokeWidth="4" />
                                <path d="M 20 80 L 25 85 L 20 90 Z" fill="#f8fafc" />
                                <path d="M 80 80 L 75 85 L 80 90 Z" fill="#f8fafc" />
                            </g>
                        </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                        <span style={{ color: motorColor }}>{status}</span>
                        <span>{rpm} RPM</span>
                    </div>
                </div>
            );
        }

        case 'SCADA_HEAT_EXCHANGER': {
            const isActive = resolveComponentDatasourceValue(comp, comp.props.isActive !== false);
            const tempIn = Number(comp.props.tempIn || 75);
            const tempOut = Number(comp.props.tempOut || 42);
            const unit = comp.props.unit || '°C';

            return (
                <div style={containerStyle}>
                    {injectStyles()}
                    <div style={{ fontSize: '0.7rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'HEAT EXCHANGER'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 120 80" style={{ width: '90%', height: '90%' }}>
                            {/* Exchanger shell */}
                            <rect x="20" y="20" width="80" height="40" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="2.5" />
                            {/* End chambers */}
                            <path d="M 20 20 L 20 60 A 10 10 0 0 1 20 20" fill="#334155" stroke="#475569" strokeWidth="2" />
                            <path d="M 100 20 L 100 60 A 10 10 0 0 0 100 20" fill="#334155" stroke="#475569" strokeWidth="2" />
                            {/* Inner tubes */}
                            <line x1="22" y1="30" x2="98" y2="30" stroke="#f43f5e" strokeWidth="2" strokeDasharray={isActive ? '4,4' : 'none'} style={{ animation: isActive ? 'scada-flow 2s linear infinite' : 'none' }} />
                            <line x1="22" y1="40" x2="98" y2="40" stroke="#38bdf8" strokeWidth="2" strokeDasharray={isActive ? '4,4' : 'none'} style={{ animation: isActive ? 'scada-flow 2s linear infinite reverse' : 'none' }} />
                            <line x1="22" y1="50" x2="98" y2="50" stroke="#f43f5e" strokeWidth="2" strokeDasharray={isActive ? '4,4' : 'none'} style={{ animation: isActive ? 'scada-flow 2s linear infinite' : 'none' }} />
                            {/* Nozzles */}
                            <rect x="35" y="10" width="10" height="10" fill="#475569" />
                            <rect x="75" y="10" width="10" height="10" fill="#475569" />
                            <rect x="35" y="60" width="10" height="10" fill="#475569" />
                            <rect x="75" y="60" width="10" height="10" fill="#475569" />
                        </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                        <span style={{ color: '#ef4444' }}>IN: {tempIn}{unit}</span>
                        <span style={{ color: '#3b82f6' }}>OUT: {tempOut}{unit}</span>
                    </div>
                </div>
            );
        }

        case 'SCADA_BOILER': {
            const rawStatus = resolveComponentDatasourceValue(comp, comp.props.boilerState || 'OFF');
            const status = String(rawStatus).toUpperCase();
            const isOn = status === 'ON' || status === 'RUNNING';
            const flameOn = comp.props.flameOn || isOn;
            const temp = Number(comp.props.temperature || (isOn ? 180 : 25));
            const press = Number(comp.props.pressure || (isOn ? 6.2 : 0));
            const unit = comp.props.unit || 'bar';

            return (
                <div style={containerStyle}>
                    {injectStyles()}
                    <div style={{ fontSize: '0.7rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'BOILER STEAM'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 100 120" style={{ width: '80%', height: '85%' }}>
                            {/* Boiler tank */}
                            <rect x="15" y="10" width="70" height="80" rx="15" fill="#334155" stroke="#475569" strokeWidth="2.5" />
                            {/* Viewport window */}
                            <circle cx="50" cy="65" r="16" fill="#1e293b" stroke="#64748b" strokeWidth="3" />
                            {/* Flame inside viewport (animated) */}
                            {flameOn ? (
                                <path d="M 50 48 Q 58 65 50 78 Q 42 65 50 48 Z" fill="url(#flameGrad)" style={{ transformOrigin: '50px 65px', animation: 'scada-pulse 0.8s infinite ease-in-out' }} />
                            ) : (
                                <circle cx="50" cy="65" r="3" fill="#475569" />
                            )}
                            {/* Smoke pipe */}
                            <rect x="42" y="0" width="16" height="10" fill="#1e293b" />
                            <line x1="42" y1="5" x2="58" y2="5" stroke="#475569" strokeWidth="1" />
                            {/* Pressure Dial on Boiler */}
                            <circle cx="30" cy="30" r="10" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                            <line x1="30" y1="30" x2={30 + Math.sin(press) * 8} y2={30 - Math.cos(press) * 8} stroke="#ef4444" strokeWidth="1.5" />
                            {/* Gradients */}
                            <defs>
                                <radialGradient id="flameGrad" cx="50%" cy="70%" r="50%">
                                    <stop offset="0%" stopColor="#fef08a" />
                                    <stop offset="50%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#ef4444" />
                                </radialGradient>
                            </defs>
                        </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                        <span style={{ color: flameOn ? '#eab308' : '#64748b' }}>{status}</span>
                        <span>{temp}°C</span>
                        <span style={{ color: '#06b6d4' }}>{press}{unit}</span>
                    </div>
                </div>
            );
        }

        case 'SCADA_COMPRESSOR': {
            const rawStatus = resolveComponentDatasourceValue(comp, comp.props.compressorState || 'STOPPED');
            const status = String(rawStatus).toUpperCase();
            const isRunning = status === 'RUNNING';
            const pressIn = Number(comp.props.pressureIn || (isRunning ? 2.1 : 1.0));
            const pressOut = Number(comp.props.pressureOut || (isRunning ? 7.5 : 1.0));
            const unit = comp.props.unit || 'bar';

            return (
                <div style={containerStyle}>
                    {injectStyles()}
                    <div style={{ fontSize: '0.7rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'COMPRESSOR'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '80%', height: '80%' }}>
                            {/* Housing shape */}
                            <circle cx="50" cy="50" r="36" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                            {/* Piston/manifold outline */}
                            <rect x="40" y="2" width="20" height="15" fill="#334155" stroke="#475569" strokeWidth="2" />
                            {/* Inside rotor fins (animated rotation) */}
                            <g style={{ transformOrigin: '50px 50px', animation: isRunning ? 'scada-spin 0.6s linear infinite' : 'none' }}>
                                <circle cx="50" cy="50" r="30" fill="none" stroke="#475569" strokeWidth="1" />
                                <line x1="50" y1="20" x2="50" y2="80" stroke="#64748b" strokeWidth="2.5" />
                                <line x1="20" y1="50" x2="80" y2="50" stroke="#64748b" strokeWidth="2.5" />
                                <line x1="28" y1="28" x2="72" y2="72" stroke="#64748b" strokeWidth="1.5" />
                                <line x1="28" y1="72" x2="72" y2="28" stroke="#64748b" strokeWidth="1.5" />
                            </g>
                            {/* Status light */}
                            <circle cx="50" cy="50" r="10" fill="#0f172a" />
                            <circle cx="50" cy="50" r="5" fill={isRunning ? '#22c55e' : '#ef4444'} />
                        </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                        <span style={{ color: isRunning ? '#22c55e' : '#64748b' }}>{status}</span>
                        <span>IN: {pressIn}</span>
                        <span>OUT: {pressOut}{unit}</span>
                    </div>
                </div>
            );
        }

        case 'SCADA_CHILLER': {
            const rawStatus = resolveComponentDatasourceValue(comp, comp.props.chillerState || 'OFF');
            const status = String(rawStatus).toUpperCase();
            const isOn = status === 'ON' || status === 'RUNNING';
            const tempSP = Number(comp.props.tempSetpoint || 7);
            const tempPV = Number(comp.props.tempActual || (isOn ? 7.4 : 24.5));
            const unit = comp.props.unit || '°C';

            return (
                <div style={containerStyle}>
                    {injectStyles()}
                    <div style={{ fontSize: '0.7rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'CHILLER UNIT'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 120 90" style={{ width: '90%', height: '85%' }}>
                            {/* Chiller block */}
                            <rect x="10" y="10" width="100" height="70" rx="6" fill="#334155" stroke="#475569" strokeWidth="2" />
                            {/* Grilles */}
                            <line x1="20" y1="25" x2="50" y2="25" stroke="#1e293b" strokeWidth="3" />
                            <line x1="20" y1="35" x2="50" y2="35" stroke="#1e293b" strokeWidth="3" />
                            <line x1="20" y1="45" x2="50" y2="45" stroke="#1e293b" strokeWidth="3" />
                            <line x1="20" y1="55" x2="50" y2="55" stroke="#1e293b" strokeWidth="3" />
                            {/* Condenser fan (animated) */}
                            <circle cx="85" cy="45" r="22" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                            <g style={{ transformOrigin: '85px 45px', animation: isOn ? 'scada-spin 1s linear infinite' : 'none' }}>
                                <path d="M 85 45 L 85 25 A 5 5 0 0 1 90 30 Z" fill="#64748b" />
                                <path d="M 85 45 L 85 65 A 5 5 0 0 1 80 60 Z" fill="#64748b" />
                                <path d="M 85 45 L 65 45 A 5 5 0 0 1 70 40 Z" fill="#64748b" />
                                <path d="M 85 45 L 105 45 A 5 5 0 0 1 100 50 Z" fill="#64748b" />
                            </g>
                            {/* Sparkle/Snowflake icon when ON */}
                            {isOn && <circle cx="85" cy="45" r="3" fill="#38bdf8" style={{ animation: 'scada-pulse 1s infinite' }} />}
                        </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                        <span style={{ color: isOn ? '#06b6d4' : '#64748b' }}>{status}</span>
                        <span>SP: {tempSP}{unit}</span>
                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>PV: {tempPV}{unit}</span>
                    </div>
                </div>
            );
        }

        case 'SCADA_FURNACE': {
            const rawStatus = resolveComponentDatasourceValue(comp, comp.props.furnaceState || 'OFF');
            const status = String(rawStatus).toUpperCase();
            const isOn = status === 'ON' || status === 'RUNNING';
            const temp = Number(comp.props.temperature || (isOn ? 785 : 25));
            const setpoint = Number(comp.props.setpoint || 800);
            const unit = comp.props.unit || '°C';

            // Glow color based on temp
            const glowOpacity = isOn ? Math.min(0.9, temp / setpoint) : 0;
            const glowStyle = {
                fill: 'url(#furnaceGlow)',
                opacity: glowOpacity,
                transition: 'opacity 0.5s ease'
            };

            return (
                <div style={containerStyle}>
                    {injectStyles()}
                    <div style={{ fontSize: '0.7rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'FURNACE OVEN'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '80%', height: '80%' }}>
                            {/* Furnace Frame */}
                            <rect x="10" y="10" width="80" height="80" rx="8" fill="#334155" stroke="#475569" strokeWidth="3" />
                            {/* Chamber viewport background */}
                            <rect x="25" y="25" width="50" height="40" rx="4" fill="#0f172a" stroke="#1e293b" />
                            {/* Glow fill representing heat */}
                            <rect x="25" y="25" width="50" height="40" rx="4" style={glowStyle} />
                            {/* Metal heating grid lines */}
                            <line x1="30" y1="35" x2="70" y2="35" stroke="#475569" strokeWidth="2.5" />
                            <line x1="30" y1="45" x2="70" y2="45" stroke="#475569" strokeWidth="2.5" />
                            <line x1="30" y1="55" x2="70" y2="55" stroke="#475569" strokeWidth="2.5" />
                            {/* Glow Gradients */}
                            <defs>
                                <linearGradient id="furnaceGlow" x1="0%" y1="100%" x2="0%" y2="0%">
                                    <stop offset="0%" stopColor="#ef4444" />
                                    <stop offset="70%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#facc15" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                        <span style={{ color: isOn ? '#f97316' : '#64748b' }}>{status}</span>
                        <span>SP: {setpoint}{unit}</span>
                        <span style={{ color: isOn ? '#ef4444' : '#f8fafc', fontWeight: 'bold' }}>PV: {temp}{unit}</span>
                    </div>
                </div>
            );
        }

        case 'SCADA_SILO': {
            const rawLevel = resolveComponentDatasourceValue(comp, comp.props.level ?? 65);
            const level = Math.max(0, Math.min(100, Number(rawLevel)));
            const capacity = comp.props.capacity || 100;
            const unit = comp.props.unit || 'ton';
            const matColor = comp.props.materialColor || '#d97706';

            // SVG path height calculation for cylindrical + conical silo bottom
            // Silo height: top cylinder is y=20 to y=80. Conical part is y=80 to y=100.
            const fillHeightPct = level / 100;
            
            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.7rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'STORAGE SILO'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 100 120" style={{ width: '80%', height: '85%' }}>
                            {/* Silo Support pillars */}
                            <line x1="25" y1="80" x2="25" y2="115" stroke="#475569" strokeWidth="3" />
                            <line x1="75" y1="80" x2="75" y2="115" stroke="#475569" strokeWidth="3" />
                            
                            {/* Background Container clipping path for dynamic fill */}
                            <defs>
                                <clipPath id={`silo-clip-${comp.id}`}>
                                    <path d="M 25 15 L 75 15 L 75 80 L 50 105 L 25 80 Z" />
                                </clipPath>
                            </defs>

                            {/* Background empty silo */}
                            <path d="M 25 15 L 75 15 L 75 80 L 50 105 L 25 80 Z" fill="#1e293b" stroke="#475569" strokeWidth="2.5" />

                            {/* Filled part (clipped to silo boundary) */}
                            <g clipPath={`url(#silo-clip-${comp.id})`}>
                                <rect x="20" y={110 - (fillHeightPct * 95)} width="60" height="100" fill={matColor} opacity="0.85" />
                            </g>

                            {/* Silo Dome/Cap */}
                            <path d="M 25 15 C 25 0 75 0 75 15 Z" fill="#334155" stroke="#475569" strokeWidth="2" />
                            
                            {/* Visual level mark lines */}
                            <line x1="25" y1="35" x2="35" y2="35" stroke="#64748b" strokeWidth="1" />
                            <line x1="25" y1="55" x2="35" y2="55" stroke="#64748b" strokeWidth="1" />
                            <line x1="25" y1="75" x2="35" y2="75" stroke="#64748b" strokeWidth="1" />
                        </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                        <span style={{ color: matColor, fontWeight: 'bold' }}>{level}%</span>
                        <span>{((level / 100) * capacity).toFixed(0)} / {capacity} {unit}</span>
                    </div>
                </div>
            );
        }

        // ==========================================
        // BATCH 2: INSTRUMENTATION
        // ==========================================
        case 'SCADA_PRESSURE_GAUGE': {
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.value ?? 4.5);
            const val = Number(rawVal);
            const min = comp.props.min ?? 0;
            const max = comp.props.max ?? 10;
            const unit = comp.props.unit || 'bar';
            const alarmHigh = comp.props.alarmHigh ?? 8;
            const alarmLow = comp.props.alarmLow ?? 1;

            const isHigh = val >= alarmHigh;
            const isLow = val <= alarmLow;
            const hasAlarm = isHigh || isLow;

            // Gauge needle rotation (270 degrees total arc, from -135deg to +135deg)
            const range = max - min;
            const clampedVal = Math.max(min, Math.min(max, val));
            const angle = -135 + ((clampedVal - min) / (range || 1)) * 270;

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{comp.props.label || 'PI-101'}</span>
                        {hasAlarm && <span style={{ color: '#ef4444', animation: 'scada-pulse 0.5s infinite' }}>⚠️ ALARM</span>}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '85%', height: '85%' }}>
                            {/* Gauge ring */}
                            <circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                            {/* High/Low alarm colored arcs */}
                            {/* We simplify these visually with segments */}
                            <circle cx="50" cy="50" r="38" fill="none" stroke="#22c55e" strokeWidth="2.5" />
                            {/* Red alarm zone at the end */}
                            <path d="M 77 77 A 38 38 0 0 0 77 23" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="20 100" strokeDashoffset="-10" />
                            
                            {/* Ticks */}
                            <line x1="50" y1="12" x2="50" y2="16" stroke="#94a3b8" strokeWidth="2" />
                            <line x1="12" y1="50" x2="16" y2="50" stroke="#94a3b8" strokeWidth="2" />
                            <line x1="84" y1="50" x2="88" y2="50" stroke="#94a3b8" strokeWidth="2" />

                            {/* Digital center value */}
                            <rect x="30" y="65" width="40" height="14" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                            <text x="50" y="75" fill={hasAlarm ? '#ef4444' : '#38bdf8'} fontSize="8" fontWeight="bold" textAnchor="middle">{val.toFixed(2)}</text>
                            
                            {/* Rotating Needle */}
                            <g style={{ transformOrigin: '50px 50px', transform: `rotate(${angle}deg)`, transition: 'transform 0.5s ease-out' }}>
                                <line x1="50" y1="50" x2="50" y2="15" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                                <circle cx="50" cy="50" r="5" fill="#f8fafc" />
                            </g>
                        </svg>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '0.65rem', color: themeStyles.textSec }}>{unit}</div>
                </div>
            );
        }

        case 'SCADA_TEMP_INDICATOR': {
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.value ?? 45);
            const val = Number(rawVal);
            const min = comp.props.min ?? 0;
            const max = comp.props.max ?? 150;
            const unit = comp.props.unit || '°C';
            const alarmHigh = comp.props.alarmHigh ?? 120;
            const alarmLow = comp.props.alarmLow ?? 10;

            const isHigh = val >= alarmHigh;
            const isLow = val <= alarmLow;

            const percent = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'TI-101'}</div>
                    <div style={{ flex: 1, display: 'flex', gap: '8px', padding: '4px 0' }}>
                        {/* Thermometer Stem */}
                        <div style={{ width: '20px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                            {/* Glass tube background */}
                            <div style={{ width: '8px', flex: 1, backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '4px 4px 0 0', position: 'relative', overflow: 'hidden' }}>
                                {/* Temperature column fill */}
                                <div style={{
                                    width: '100%',
                                    height: `${percent}%`,
                                    backgroundColor: isHigh ? '#ef4444' : isLow ? '#3b82f6' : '#22c55e',
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    borderRadius: '3px 3px 0 0',
                                    transition: 'height 0.5s ease-out'
                                }} />
                            </div>
                            {/* Bulb at bottom */}
                            <div style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: isHigh ? '#ef4444' : isLow ? '#3b82f6' : '#22c55e',
                                border: '1px solid #475569',
                                marginTop: '-2px',
                                zIndex: 2
                            }} />
                        </div>
                        
                        {/* Digital display / Scale labels */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                            <div>MAX: {max}</div>
                            <div style={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #334155',
                                padding: '4px',
                                borderRadius: '4px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: isHigh ? '#ef4444' : '#22c55e'
                            }}>
                                {val.toFixed(1)} {unit}
                            </div>
                            <div>MIN: {min}</div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'SCADA_FLOW_METER': {
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.value ?? 120.5);
            const val = Number(rawVal);
            const unit = comp.props.unit || 'L/min';
            const totalFlow = Number(comp.props.totalFlow || 45290.4);

            const isFlowing = val > 0.1;
            const spinAnim = isFlowing ? `scada-spin ${60 / Math.min(val, 500)}s linear infinite` : 'none';

            return (
                <div style={containerStyle}>
                    {injectStyles()}
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'FIT-101'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Flow section pipe */}
                        <svg viewBox="0 0 60 60" style={{ width: '45%', height: '90%' }}>
                            <rect x="0" y="22" width="60" height="16" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                            {/* Flanges */}
                            <rect x="2" y="16" width="6" height="28" fill="#334155" stroke="#475569" />
                            <rect x="52" y="16" width="6" height="28" fill="#334155" stroke="#475569" />
                            {/* Inside spinner/turbine (animated rotation) */}
                            <circle cx="30" cy="30" r="12" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                            <g style={{ transformOrigin: '30px 30px', animation: spinAnim }}>
                                <line x1="30" y1="18" x2="30" y2="42" stroke="#38bdf8" strokeWidth="2" />
                                <line x1="18" y1="30" x2="42" y2="30" stroke="#38bdf8" strokeWidth="2" />
                            </g>
                        </svg>

                        {/* Text readout */}
                        <div style={{ flex: 1, paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isFlowing ? '#38bdf8' : '#94a3b8' }}>
                                {val.toFixed(1)} {unit}
                            </div>
                            <div style={{ fontSize: '0.55rem', color: themeStyles.textSec }}>
                                TOTAL:
                                <div style={{ color: '#a855f7', fontWeight: 'bold' }}>{totalFlow.toFixed(0)} L</div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'SCADA_LEVEL_INDICATOR': {
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.value ?? 50);
            const val = Number(rawVal);
            const min = comp.props.min ?? 0;
            const max = comp.props.max ?? 100;
            const unit = comp.props.unit || '%';
            const fluidColor = comp.props.fluidColor || '#38bdf8';
            const alarmHigh = comp.props.alarmHigh ?? 90;
            const alarmLow = comp.props.alarmLow ?? 10;

            const isHigh = val >= alarmHigh;
            const isLow = val <= alarmLow;

            const percent = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'LIT-101'}</div>
                    <div style={{ flex: 1, display: 'flex', gap: '6px' }}>
                        {/* Tank column scale */}
                        <div style={{ flex: 1, height: '100%', backgroundColor: '#1e293b', border: '1.5px solid #475569', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                            {/* Water/Fluid fill */}
                            <div style={{
                                width: '100%',
                                height: `${percent}%`,
                                backgroundColor: fluidColor,
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                transition: 'height 0.5s ease-out',
                                opacity: 0.8
                            }} />
                            {/* Alarm levels indicator markers */}
                            <div style={{ position: 'absolute', bottom: `${alarmHigh}%`, left: 0, width: '100%', borderBottom: '1px dashed #ef4444', zIndex: 3 }} />
                            <div style={{ position: 'absolute', bottom: `${alarmLow}%`, left: 0, width: '100%', borderBottom: '1px dashed #f59e0b', zIndex: 3 }} />
                        </div>
                        {/* Scale text */}
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.6rem', color: themeStyles.textSec }}>
                            <span>{max}{unit}</span>
                            <span style={{ color: isHigh ? '#ef4444' : isLow ? '#f59e0b' : '#f8fafc', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                {val.toFixed(1)}
                            </span>
                            <span>{min}{unit}</span>
                        </div>
                    </div>
                </div>
            );
        }

        case 'SCADA_PH_METER': {
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.value ?? 7.2);
            const val = Number(rawVal);
            const min = comp.props.min ?? 0;
            const max = comp.props.max ?? 14;
            const unit = comp.props.unit || 'pH';

            const alarmHigh = comp.props.alarmHigh ?? 10.0;
            const alarmLow = comp.props.alarmLow ?? 4.0;
            const isAlarm = val >= alarmHigh || val <= alarmLow;

            const needleAngle = -90 + (val / 14) * 180;

            // pH Gradient scale color calculation helper
            const getPHColor = (v) => {
                if (v < 3) return '#ef4444'; // Red (Acidic)
                if (v < 6) return '#f97316'; // Orange
                if (v < 8) return '#22c55e'; // Green (Neutral)
                if (v < 11) return '#3b82f6'; // Blue
                return '#a855f7'; // Purple (Alkaline)
            };

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{comp.props.label || 'PH-METER'}</span>
                        {isAlarm && <span style={{ color: '#ef4444' }}>ALARM</span>}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 100 80" style={{ width: '90%', height: '90%' }}>
                            {/* Gauge Semi-circle track */}
                            <path d="M 15 70 A 35 35 0 0 1 85 70" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
                            {/* pH Spectrum indicators */}
                            <path d="M 15 70 A 35 35 0 0 1 35 41" fill="none" stroke="#ef4444" strokeWidth="8" />
                            <path d="M 35 41 A 35 35 0 0 1 50 35" fill="none" stroke="#f97316" strokeWidth="8" />
                            <path d="M 50 35 A 35 35 0 0 1 65 41" fill="none" stroke="#22c55e" strokeWidth="8" />
                            <path d="M 65 41 A 35 35 0 0 1 85 70" fill="none" stroke="#3b82f6" strokeWidth="8" />
                            
                            {/* Needle pointer */}
                            <g style={{ transformOrigin: '50px 70px', transform: `rotate(${needleAngle}deg)`, transition: 'transform 0.5s ease-out' }}>
                                <line x1="50" y1="70" x2="50" y2="38" stroke="#f8fafc" strokeWidth="2.5" />
                                <polygon points="50,30 47,38 53,38" fill="#f8fafc" />
                            </g>
                            <circle cx="50" cy="70" r="6" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                        </svg>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: getPHColor(val) }}>
                        {val.toFixed(1)} {unit}
                    </div>
                </div>
            );
        }

        case 'SCADA_CURRENT_METER':
        case 'SCADA_VOLTAGE_METER': {
            const isVolt = comp.type === 'SCADA_VOLTAGE_METER';
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.value ?? (isVolt ? 220.4 : 5.8));
            const val = Number(rawVal);
            const unit = comp.props.unit || (isVolt ? 'V' : 'A');
            const color = isVolt ? '#f59e0b' : '#22c55e'; // Volt amber, Current green

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold' }}>
                        {comp.props.label || (isVolt ? 'VM-101' : 'AM-101')}
                    </div>
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#070a13',
                        border: '1px solid #1e293b',
                        borderRadius: '4px',
                        margin: '6px 0',
                        position: 'relative'
                    }}>
                        {/* Simulated glowing grid panel background */}
                        <div style={{
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            color: color,
                            textShadow: `0 0 8px ${color}88`,
                            letterSpacing: '1px'
                        }}>
                            {val.toFixed(1)}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: color, marginTop: '2px' }}>{unit}</div>
                        
                        {/* Grid lines inside panel */}
                        <div style={{ position: 'absolute', top: 2, right: 4, opacity: 0.15 }}>
                            <Zap size={10} color={color} />
                        </div>
                    </div>
                </div>
            );
        }

        case 'SCADA_POWER_METER': {
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.value ?? 145.8);
            const val = Number(rawVal);
            const unit = comp.props.unit || 'kW';
            const voltage = comp.props.voltage || 380.5;
            const current = comp.props.current || 221.8;
            const pf = comp.props.powerFactor || 0.86;

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '2px' }}>
                        {comp.props.label || 'POWER ANALYZER'}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', margin: '4px 0' }}>
                        {/* Main Power digital value */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', backgroundColor: '#070a13', padding: '2px 6px', borderRadius: '3px' }}>
                            <span style={{ fontSize: '0.6rem', color: themeStyles.textSec }}>ACTIVE:</span>
                            <span style={{ fontSize: '1rem', color: '#a855f7', fontWeight: 'bold', textShadow: '0 0 4px rgba(168,85,247,0.4)' }}>
                                {val.toFixed(1)} {unit}
                            </span>
                        </div>
                        
                        {/* Sub values details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.6rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b' }}>
                                <span style={{ color: themeStyles.textSec }}>VOLTS:</span>
                                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{voltage}V</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b' }}>
                                <span style={{ color: themeStyles.textSec }}>AMPS:</span>
                                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{current}A</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: 'span 2' }}>
                                <span style={{ color: themeStyles.textSec }}>POWER FACTOR:</span>
                                <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{pf.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // ==========================================
        // BATCH 3: DISPLAY
        // ==========================================
        case 'SCADA_DIGITAL_DISPLAY': {
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.value ?? '125.4');
            let displayString = String(rawVal);
            const unit = comp.props.unit || '';
            const decimals = comp.props.decimals ?? 1;

            if (!isNaN(Number(rawVal))) {
                displayString = Number(rawVal).toFixed(decimals);
            }

            const color = comp.props.color || '#22c55e';
            const displayBg = comp.props.backgroundColor || '#070a13';

            return (
                <div style={{
                    ...containerStyle,
                    backgroundColor: displayBg,
                    border: `2.5px solid ${comp.props.borderColor || '#334155'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', position: 'absolute', top: '3px', left: '6px' }}>
                        {comp.props.label || 'PV DISPLAY'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
                        <span style={{
                            fontSize: '1.6rem',
                            fontWeight: 'bold',
                            color: color,
                            textShadow: `0 0 10px ${color}aa`,
                            letterSpacing: '2px',
                            fontFamily: 'Courier New, monospace'
                        }}>{displayString}</span>
                        {unit && <span style={{ fontSize: '0.75rem', color: color, opacity: 0.8 }}>{unit}</span>}
                    </div>
                </div>
            );
        }

        case 'SCADA_NUMERIC_INPUT': {
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.value ?? 0);
            const val = Number(rawVal);
            const min = comp.props.min ?? 0;
            const max = comp.props.max ?? 100;
            const step = comp.props.step ?? 1;
            const unit = comp.props.unit || '';

            const increment = () => {
                const next = Math.min(max, val + step);
                handleValueChange(next);
            };

            const decrement = () => {
                const next = Math.max(min, val - step);
                handleValueChange(next);
            };

            return (
                <div style={{ ...containerStyle, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.6rem', color: themeStyles.textSec }}>{comp.props.label || 'NUMERIC INPUT'}</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f8fafc', marginTop: '2px' }}>
                            {val} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{unit}</span>
                        </div>
                    </div>
                    {/* Interaction controls */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            disabled={viewMode !== 'PREVIEW'}
                            onClick={decrement}
                            style={{
                                width: '28px',
                                height: '28px',
                                border: '1px solid #475569',
                                borderRadius: '4px',
                                background: '#1e293b',
                                color: '#f8fafc',
                                cursor: viewMode === 'PREVIEW' ? 'pointer' : 'default',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>- </button>
                        <button
                            disabled={viewMode !== 'PREVIEW'}
                            onClick={increment}
                            style={{
                                width: '28px',
                                height: '28px',
                                border: '1px solid #475569',
                                borderRadius: '4px',
                                background: '#1e293b',
                                color: '#f8fafc',
                                cursor: viewMode === 'PREVIEW' ? 'pointer' : 'default',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>+ </button>
                    </div>
                </div>
            );
        }

        case 'SCADA_SETPOINT_INPUT': {
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.value ?? 50);
            const val = Number(rawVal);
            const min = comp.props.min ?? 0;
            const max = comp.props.max ?? 100;
            const unit = comp.props.unit || '';
            const hiLimit = comp.props.hiLimit ?? 90;
            const loLimit = comp.props.loLimit ?? 10;

            const onSliderChange = (e) => {
                const nextVal = Number(e.target.value);
                handleValueChange(nextVal);
            };

            const isOutOfLimit = val > hiLimit || val < loLimit;

            return (
                <div style={containerStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                        <span style={{ color: themeStyles.textSec }}>{comp.props.label || 'SETPOINT (SP)'}</span>
                        <span style={{ color: isOutOfLimit ? '#ef4444' : '#eab308', fontWeight: 'bold' }}>
                            {val} {unit}
                        </span>
                    </div>
                    {/* Slider input */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                        <input
                            type="range"
                            min={min}
                            max={max}
                            value={val}
                            disabled={viewMode !== 'PREVIEW'}
                            onChange={onSliderChange}
                            style={{
                                width: '100%',
                                accentColor: isOutOfLimit ? '#ef4444' : '#eab308',
                                cursor: viewMode === 'PREVIEW' ? 'pointer' : 'default'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: themeStyles.textSec }}>
                        <span>LOLO: {loLimit}</span>
                        <span>HIHI: {hiLimit}</span>
                    </div>
                </div>
            );
        }

        case 'SCADA_TREND': {
            // Real-time chart widget with static mockup path generated dynamically based on value or timeline
            const label = comp.props.label || 'REAL-TIME TREND';
            const lineColor = comp.props.lineColor || '#38bdf8';
            const gridColor = comp.props.gridColor || '#1e293b';

            // Generate nice fluctuating path points
            const points = [45, 48, 52, 49, 58, 62, 59, 55, 48, 42, 50, 68, 72, 65, 59, 61, 57, 60, 64, 70, 78, 72, 69, 74, 80];
            const width = 200;
            const height = 60;
            const step = width / (points.length - 1);
            
            const pathData = points.map((p, index) => {
                const x = index * step;
                const y = height - (p / 100) * height;
                return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            }).join(' ');

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{label}</div>
                    <div style={{ flex: 1, position: 'relative', marginTop: '6px', border: '1px solid #1e293b', overflow: 'hidden' }}>
                        {/* Horizontal grid lines */}
                        <div style={{ position: 'absolute', top: '25%', left: 0, width: '100%', borderTop: `1px solid ${gridColor}` }} />
                        <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', borderTop: `1px solid ${gridColor}` }} />
                        <div style={{ position: 'absolute', top: '75%', left: 0, width: '100%', borderTop: `1px solid ${gridColor}` }} />
                        
                        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', display: 'block' }} preserveAspectRatio="none">
                            {/* Area fill */}
                            <path d={`${pathData} L ${width} ${height} L 0 ${height} Z`} fill={`url(#trend-grad-${comp.id})`} opacity="0.2" />
                            {/* Trend line */}
                            <path d={pathData} fill="none" stroke={lineColor} strokeWidth="1.5" />
                            <defs>
                                <linearGradient id={`trend-grad-${comp.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={lineColor} />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>
            );
        }

        case 'SCADA_HISTORICAL_TREND': {
            const label = comp.props.label || 'HISTORICAL LOGGER';
            const lineColor = comp.props.lineColor || '#8b5cf6';
            const gridColor = comp.props.gridColor || '#1e293b';

            // Generate multi-wave data
            const points = [20, 25, 40, 35, 30, 42, 50, 48, 62, 58, 65, 78, 72, 80, 85, 90, 82, 75, 60, 52, 45, 40, 38, 42, 50, 48];
            const width = 240;
            const height = 80;
            const step = width / (points.length - 1);
            
            const pathData = points.map((p, index) => {
                const x = index * step;
                const y = height - (p / 100) * height;
                return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            }).join(' ');

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{label}</div>
                    <div style={{ flex: 1, position: 'relative', marginTop: '6px', border: '1px solid #1e293b' }}>
                        {/* Horizontal & Vertical grid lines mock */}
                        <div style={{ position: 'absolute', top: '33%', left: 0, width: '100%', borderTop: `1px dashed ${gridColor}` }} />
                        <div style={{ position: 'absolute', top: '66%', left: 0, width: '100%', borderTop: `1px dashed ${gridColor}` }} />
                        <div style={{ position: 'absolute', left: '33%', top: 0, height: '100%', borderLeft: `1px dashed ${gridColor}` }} />
                        <div style={{ position: 'absolute', left: '66%', top: 0, height: '100%', borderLeft: `1px dashed ${gridColor}` }} />
                        
                        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', display: 'block' }} preserveAspectRatio="none">
                            <path d={`${pathData} L ${width} ${height} L 0 ${height} Z`} fill={`url(#hist-grad-${comp.id})`} opacity="0.15" />
                            <path d={pathData} fill="none" stroke={lineColor} strokeWidth="1.5" />
                            <defs>
                                <linearGradient id={`hist-grad-${comp.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={lineColor} />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: themeStyles.textSec, marginTop: '4px' }}>
                        <span>8h ago</span>
                        <span>4h ago</span>
                        <span>Now</span>
                    </div>
                </div>
            );
        }

        case 'SCADA_BAR_GRAPH': {
            const barColor = comp.props.barColor || '#3b82f6';
            const max = comp.props.max || 100;
            const unit = comp.props.unit || '';

            // 5 data bars
            const bars = [
                { val: 45, label: 'Zone 1' },
                { val: 78, label: 'Zone 2' },
                { val: 56, label: 'Zone 3' },
                { val: 32, label: 'Zone 4' },
                { val: 89, label: 'Zone 5' }
            ];

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'BAR GRAPH'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', padding: '12px 0 4px 0' }}>
                        {bars.map((b, idx) => {
                            const barHeight = `${(b.val / max) * 100}%`;
                            return (
                                <div key={idx} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.55rem', marginBottom: '2px', color: '#f8fafc' }}>{b.val}{unit}</div>
                                    <div style={{
                                        width: '100%',
                                        height: barHeight,
                                        backgroundColor: barColor,
                                        borderRadius: '3px 3px 0 0',
                                        transition: 'height 0.4s ease'
                                    }} />
                                    <div style={{ fontSize: '0.55rem', color: themeStyles.textSec, marginTop: '4px', textTransform: 'uppercase' }}>{b.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        case 'SCADA_CIRCULAR_GAUGE': {
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.value ?? 60);
            const val = Number(rawVal);
            const min = comp.props.min ?? 0;
            const max = comp.props.max ?? 100;
            const unit = comp.props.unit || '%';
            const arcColor = comp.props.arcColor || '#38bdf8';

            const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
            // SVG circular calculation: circumference is 2 * PI * r = 2 * 3.14159 * 30 = 188.4
            // We use a 270 degree circle arc. circumference 188.4, we gap the bottom 90 degrees (which is 1/4 = 47.1 units).
            // Length of arc is 188.4 * 0.75 = 141.3
            const dashArray = 141.3;
            const dashOffset = dashArray - (pct / 100) * dashArray;

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'CIRCULAR GAUGE'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 80 80" style={{ width: '85%', height: '85%' }}>
                            {/* Empty background track */}
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#1e293b" strokeWidth="6" strokeDasharray={`${dashArray} ${188.4 - dashArray}`} strokeDashoffset="0" transform="rotate(135 40 40)" strokeLinecap="round" />
                            {/* Filled active track */}
                            <circle cx="40" cy="40" r="30" fill="none" stroke={arcColor} strokeWidth="6" strokeDasharray={`${dashArray} ${188.4 - dashArray}`} strokeDashoffset={dashOffset} transform="rotate(135 40 40)" strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                            
                            {/* Text values in center */}
                            <text x="40" y="42" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">{val}</text>
                            <text x="40" y="52" fill={themeStyles.textSec} fontSize="6" textAnchor="middle">{unit}</text>
                        </svg>
                    </div>
                </div>
            );
        }

        case 'SCADA_PROGRESS_BAR': {
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.value ?? 70);
            const val = Number(rawVal);
            const min = comp.props.min ?? 0;
            const max = comp.props.max ?? 100;
            const unit = comp.props.unit || '%';
            const barColor = comp.props.barColor || '#22c55e';

            const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

            return (
                <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                        <span>{comp.props.label || 'PROGRESS'}</span>
                        <span style={{ color: barColor, fontWeight: 'bold' }}>{val}{unit}</span>
                    </div>
                    {/* Bar track */}
                    <div style={{ width: '100%', height: '14px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden', border: '1px solid #334155' }}>
                        <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            backgroundColor: barColor,
                            transition: 'width 0.4s ease',
                            boxShadow: `inset 0 0 6px rgba(255,255,255,0.2), 0 0 8px ${barColor}`
                        }} />
                    </div>
                </div>
            );
        }

        case 'SCADA_TANK_LEVEL': {
            const rawLevel = resolveComponentDatasourceValue(comp, comp.props.level ?? 50);
            const level = Number(rawLevel);
            const capacity = comp.props.capacity || 100;
            const unit = comp.props.unit || 'L';
            const fluidColor = comp.props.fluidColor || '#06b6d4';
            
            const pct = Math.max(0, Math.min(100, level));

            return (
                <div style={containerStyle}>
                    {injectStyles()}
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'TANK T-202'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 100 120" style={{ width: '80%', height: '85%' }}>
                            {/* Tank Dome and Body outline */}
                            <path d="M 20 20 L 80 20 L 80 95 A 10 10 0 0 1 70 105 L 30 105 A 10 10 0 0 1 20 95 Z" fill="#1e293b" stroke="#475569" strokeWidth="2.5" />
                            
                            <defs>
                                <clipPath id={`tank-clip-${comp.id}`}>
                                    <path d="M 20 20 L 80 20 L 80 95 A 10 10 0 0 1 70 105 L 30 105 A 10 10 0 0 1 20 95 Z" />
                                </clipPath>
                            </defs>

                            {/* Liquid fill */}
                            <g clipPath={`url(#tank-clip-${comp.id})`}>
                                {/* Water box */}
                                <rect x="15" y={105 - (pct * 0.85)} width="70" height="100" fill={fluidColor} opacity="0.75" />
                                {/* Wavy top of liquid */}
                                <path d={`M 15 ${105 - (pct * 0.85)} Q 35 ${101 - (pct * 0.85)} 50 ${105 - (pct * 0.85)} T 85 ${105 - (pct * 0.85)} L 85 120 L 15 120 Z`} fill={fluidColor} opacity="0.9" />
                            </g>

                            {/* Dome Cap */}
                            <path d="M 20 20 Q 50 10 80 20" fill="none" stroke="#475569" strokeWidth="2" />
                            
                            {/* Level read labels inside tank */}
                            <text x="50" y="60" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">{pct.toFixed(0)}%</text>
                        </svg>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '0.6rem', color: themeStyles.textSec }}>
                        {((pct / 100) * capacity).toFixed(0)} / {capacity} {unit}
                    </div>
                </div>
            );
        }

        // ==========================================
        // BATCH 4: ALARM & EVENT
        // ==========================================
        case 'SCADA_ALARM_BANNER': {
            const text = comp.props.label || 'SYSTEM ACTIVE ALARMS: TEMPERATURE HIGH IN REACTOR BLR-101 [CRITICAL] | PILOT VALVE FAIL FEEDBACK [WARNING]';
            const speed = comp.props.scrollSpeed || 2;

            return (
                <div style={{
                    ...containerStyle,
                    backgroundColor: '#7f1d1d', // Solid red background
                    border: '1.5px solid #ef4444',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: '0 8px'
                }}>
                    {injectStyles()}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingRight: '12px', borderRight: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 'bold', fontSize: '0.7rem' }}>
                        <Bell size={12} style={{ animation: 'scada-pulse 0.6s infinite' }} />
                        <span>ALARM:</span>
                    </div>
                    {/* Marquee Wrapper */}
                    <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
                        <div style={{
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            color: '#ffffff',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            paddingLeft: '100%',
                            animation: `scada-marquee ${15 / speed}s linear infinite`
                        }}>
                            {text}
                        </div>
                    </div>
                </div>
            );
        }

        case 'SCADA_ALARM_HISTORY': {
            const logs = [
                { t: '11:42:10', tag: 'PT-101', msg: 'Boiler Pressure Exceeds safety thresh', type: 'CRITICAL', s: 'UNACK' },
                { t: '11:39:05', tag: 'M-101', msg: 'Conveyor overload motor tripped', type: 'FAULT', s: 'ACK' },
                { t: '11:21:40', tag: 'TI-101', msg: 'Reactor temperature high limit level', type: 'WARNING', s: 'RESOLVED' }
            ];

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.7rem', color: themeStyles.textSec, fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
                        📋 {comp.props.label || 'ALARM HISTORY LOG'}
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', marginTop: '6px' }}>
                        <table style={{ width: '100%', fontSize: '0.55rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ color: themeStyles.textSec, borderBottom: '1px solid #1e293b' }}>
                                    <th style={{ padding: '2px 0' }}>TIME</th>
                                    <th>TAG</th>
                                    <th>MESSAGE</th>
                                    <th>STATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((l, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #0f172a', color: l.type === 'CRITICAL' ? '#fca5a5' : l.type === 'FAULT' ? '#fef08a' : '#bfdbfe' }}>
                                        <td style={{ padding: '3px 0' }}>{l.t}</td>
                                        <td style={{ fontWeight: 'bold' }}>{l.tag}</td>
                                        <td>{l.msg}</td>
                                        <td style={{ fontSize: '0.5rem', fontWeight: 'bold', color: l.s === 'UNACK' ? '#ef4444' : '#10b981' }}>{l.s}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        case 'SCADA_EVENT_LOG': {
            const events = [
                '[11:45:02] Operator ADMIN loaded App Schema v1.0.4',
                '[11:44:31] PLC IP 192.168.1.1 Comm Connection Est',
                '[11:42:01] System Auto-mode cycle running triggered',
                '[11:38:12] Pump P-101 switched manual overide state'
            ];

            return (
                <div style={{ ...containerStyle, backgroundColor: '#070a13' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', borderBottom: '1px solid #1e293b', paddingBottom: '3px', fontWeight: 'bold' }}>
                        💻 {comp.props.label || 'SYSTEM EVENT LOG'}
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', marginTop: '4px', fontSize: '0.55rem', color: '#38bdf8', lineHeight: '1.2rem' }}>
                        {events.map((e, idx) => (
                            <div key={idx}>{e}</div>
                        ))}
                    </div>
                </div>
            );
        }

        case 'SCADA_ALARM_ACK': {
            // Interactive Ack button
            const label = comp.props.label || 'ACKNOWLEDGE ALARMS';
            const color = comp.props.color || '#f59e0b';
            const isActive = viewMode === 'PREVIEW';

            return (
                <button
                    disabled={!isActive}
                    onClick={() => handleValueChange('ACKNOWLEDGED')}
                    style={{
                        ...containerStyle,
                        backgroundColor: '#1e293b',
                        border: `2px solid ${color}`,
                        cursor: isActive ? 'pointer' : 'default',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        boxShadow: `0 0 6px ${color}55`
                    }}>
                    <CheckCircle2 size={16} color={color} />
                    <span style={{ color: color }}>{label}</span>
                </button>
            );
        }

        // ==========================================
        // BATCH 5: CONTROL
        // ==========================================
        case 'SCADA_BTN_START':
        case 'SCADA_BTN_STOP':
        case 'SCADA_BTN_RESET': {
            const isStart = comp.type === 'SCADA_BTN_START';
            const isStop = comp.type === 'SCADA_BTN_STOP';
            
            const label = comp.props.label || (isStart ? 'START' : isStop ? 'STOP' : 'RESET');
            const color = comp.props.color || (isStart ? '#22c55e' : isStop ? '#ef4444' : '#3b82f6');
            const isActive = viewMode === 'PREVIEW';

            const handleClick = () => {
                if (isStart) handleValueChange('RUNNING');
                else if (isStop) handleValueChange('STOPPED');
                else handleValueChange('RESET');
            };

            return (
                <button
                    disabled={!isActive}
                    onClick={handleClick}
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#1e293b',
                        border: `2.5px solid ${color}`,
                        borderRadius: '6px',
                        color: color,
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        letterSpacing: '1px',
                        cursor: isActive ? 'pointer' : 'default',
                        boxShadow: `0 3px 0 ${color}cc, 0 0 10px rgba(0,0,0,0.5)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxSizing: 'border-box'
                    }}>
                    {isStart ? <Play size={14} fill={color} /> : isStop ? <StopCircle size={14} /> : <RotateCcw size={14} />}
                    {label}
                </button>
            );
        }

        case 'SCADA_AUTO_MANUAL': {
            const rawMode = resolveComponentDatasourceValue(comp, comp.props.mode || 'MANUAL');
            const mode = String(rawMode).toUpperCase() === 'AUTO' ? 'AUTO' : 'MANUAL';
            const isActive = viewMode === 'PREVIEW';

            const toggleMode = () => {
                const nextMode = mode === 'AUTO' ? 'MANUAL' : 'AUTO';
                handleValueChange(nextMode);
            };

            return (
                <div style={{ ...containerStyle, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.6rem', color: themeStyles.textSec }}>{comp.props.label || 'MODE SELECT'}</span>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: mode === 'AUTO' ? '#22c55e' : '#f59e0b', marginTop: '2px' }}>
                            {mode}
                        </div>
                    </div>
                    {/* Dial rotary clicker switch */}
                    <div
                        onClick={isActive ? toggleMode : undefined}
                        style={{
                            width: '40px',
                            height: '24px',
                            backgroundColor: '#1e293b',
                            borderRadius: '12px',
                            border: '1.5px solid #475569',
                            position: 'relative',
                            cursor: isActive ? 'pointer' : 'default',
                            transition: 'background-color 0.2s'
                        }}>
                        {/* Selector Switch Slider knob */}
                        <div style={{
                            width: '18px',
                            height: '18px',
                            backgroundColor: mode === 'AUTO' ? '#22c55e' : '#64748b',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '2px',
                            left: mode === 'AUTO' ? '18px' : '2px',
                            transition: 'left 0.2s, background-color 0.2s'
                        }} />
                    </div>
                </div>
            );
        }

        case 'SCADA_MODE_SELECTOR': {
            const modes = comp.props.modes || ['OFF', 'MANUAL', 'AUTO', 'SERVICE'];
            const rawMode = resolveComponentDatasourceValue(comp, comp.props.selectedMode || 'OFF');
            const activeMode = String(rawMode).toUpperCase();
            const isActive = viewMode === 'PREVIEW';

            return (
                <div style={{ ...containerStyle, padding: '4px' }}>
                    <div style={{ fontSize: '0.6rem', color: themeStyles.textSec, paddingLeft: '4px', marginBottom: '4px' }}>
                        {comp.props.label || 'MODE SELECTOR'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${modes.length}, 1fr)`, gap: '2px', flex: 1 }}>
                        {modes.map((m, idx) => {
                            const isSel = m.toUpperCase() === activeMode;
                            return (
                                <button
                                    key={idx}
                                    disabled={!isActive}
                                    onClick={() => handleValueChange(m)}
                                    style={{
                                        border: '1px solid #334155',
                                        borderRadius: '3px',
                                        background: isSel ? '#22c55e' : '#1e293b',
                                        color: isSel ? '#0f172a' : '#94a3b8',
                                        fontSize: '0.55rem',
                                        fontWeight: 'bold',
                                        cursor: isActive ? 'pointer' : 'default',
                                        padding: '0'
                                    }}>
                                    {m}
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        }

        case 'SCADA_TOGGLE_SWITCH': {
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.state ?? false);
            const state = rawVal === true || String(rawVal).toUpperCase() === 'ON' || rawVal === 1;
            const onLabel = comp.props.onLabel || 'ON';
            const offLabel = comp.props.offLabel || 'OFF';
            const onColor = comp.props.onColor || '#22c55e';
            const offColor = comp.props.offColor || '#64748b';
            const isActive = viewMode === 'PREVIEW';

            const toggle = () => {
                handleValueChange(!state);
            };

            return (
                <div style={{ ...containerStyle, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <span style={{ fontSize: '0.65rem', color: themeStyles.textSec }}>{comp.props.label || 'SWITCH'}</span>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: state ? onColor : offColor, marginTop: '2px' }}>
                            {state ? onLabel : offLabel}
                        </div>
                    </div>
                    
                    {/* Toggle Slide bar */}
                    <div
                        onClick={isActive ? toggle : undefined}
                        style={{
                            width: '44px',
                            height: '22px',
                            borderRadius: '11px',
                            backgroundColor: state ? `${onColor}22` : '#1e293b',
                            border: `1.5px solid ${state ? onColor : '#475569'}`,
                            position: 'relative',
                            cursor: isActive ? 'pointer' : 'default',
                            transition: 'all 0.2s'
                        }}>
                        <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: state ? onColor : '#64748b',
                            position: 'absolute',
                            top: '2px',
                            left: state ? '24px' : '3px',
                            transition: 'left 0.2s, background-color 0.2s'
                        }} />
                    </div>
                </div>
            );
        }

        case 'SCADA_PLC_STATUS': {
            const rawStatus = resolveComponentDatasourceValue(comp, comp.props.status || 'ONLINE');
            const status = String(rawStatus).toUpperCase();
            const scanTime = comp.props.scanTime || 10;
            const ipAddress = comp.props.ipAddress || '192.168.1.1';
            const isOnline = status === 'ONLINE';

            return (
                <div style={containerStyle}>
                    {injectStyles()}
                    <div style={{ fontSize: '0.7rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'PLC COMMS'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cpu size={28} color={isOnline ? '#22c55e' : '#ef4444'} />
                        <div style={{ flex: 1, fontSize: '0.55rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div>IP: <span style={{ color: '#f8fafc' }}>{ipAddress}</span></div>
                            <div>SCAN RATE: <span style={{ color: '#38bdf8' }}>{scanTime}ms</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>LEDs:</span>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#22c55e', animation: 'scada-blink 1s infinite' }} />
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: isOnline ? '#22c55e' : '#ef4444' }} />
                            </div>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: isOnline ? '#22c55e' : '#ef4444', textAlign: 'right' }}>
                        {status}
                    </div>
                </div>
            );
        }

        // ==========================================
        // BATCH 6: INDUSTRY 4.0 / MES
        // ==========================================
        case 'SCADA_OEE': {
            const avail = Number(comp.props.availability || 95);
            const perf = Number(comp.props.performance || 88);
            const qual = Number(comp.props.quality || 99);
            const oee = Math.round((avail * perf * qual) / 10000);

            // Gauge calculations: simple donut values
            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '2px' }}>
                        {comp.props.label || 'OVERALL EQUIPMENT EFFECTIVENESS'}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '6px', margin: '6px 0', alignItems: 'center' }}>
                        {/* Overall OEE gauge circular */}
                        <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                            <svg viewBox="0 0 40 40" style={{ width: '100%', height: '100%' }}>
                                <circle cx="20" cy="20" r="16" fill="none" stroke="#1e293b" strokeWidth="4" />
                                <circle cx="20" cy="20" r="16" fill="none" stroke="#a855f7" strokeWidth="4" strokeDasharray="100.5" strokeDashoffset={100.5 - oee} transform="rotate(-90 20 20)" />
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f8fafc' }}>{oee}%</div>
                                <div style={{ fontSize: '0.4rem', color: themeStyles.textSec }}>OEE</div>
                            </div>
                        </div>

                        {/* Components */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.55rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: themeStyles.textSec }}>AVAILABILITY:</span>
                                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{avail}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: themeStyles.textSec }}>PERFORMANCE:</span>
                                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{perf}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: themeStyles.textSec }}>QUALITY:</span>
                                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{qual}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'SCADA_PROD_COUNTER': {
            const rawCount = resolveComponentDatasourceValue(comp, comp.props.count ?? 0);
            const count = Number(rawCount);
            const target = comp.props.target || 1000;
            const unit = comp.props.unit || 'pcs';

            const pct = Math.min(100, Math.max(0, (count / target) * 100));

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'PRODUCTION COUNTER'}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '1.2rem', color: '#22c55e', fontWeight: 'bold' }}>{count}</span>
                            <span style={{ fontSize: '0.6rem', color: themeStyles.textSec }}>TARGET: {target} {unit}</span>
                        </div>
                        {/* Progress line */}
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#22c55e', transition: 'width 0.4s ease' }} />
                        </div>
                    </div>
                </div>
            );
        }

        case 'SCADA_DOWNTIME': {
            const total = Number(comp.props.totalDowntime || 45);
            const planned = Number(comp.props.plannedDowntime || 30);
            const unplanned = Number(comp.props.unplannedDowntime || 15);
            const unit = comp.props.unit || 'min';

            const plannedPct = total > 0 ? (planned / total) * 100 : 50;

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'DOWNTIME TRACKER'}</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '1.1rem', color: '#ef4444', fontWeight: 'bold' }}>{total} {unit}</span>
                            <span style={{ fontSize: '0.55rem', color: themeStyles.textSec }}>TOTAL DOWNTIME</span>
                        </div>
                        
                        {/* Stacked bar representation */}
                        <div style={{ width: '100%', height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${plannedPct}%`, height: '100%', backgroundColor: '#64748b' }} title="Planned" />
                            <div style={{ flex: 1, height: '100%', backgroundColor: '#ef4444' }} title="Unplanned" />
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: themeStyles.textSec }}>
                            <span>PLANNED: {planned}</span>
                            <span>UNPLANNED: {unplanned}</span>
                        </div>
                    </div>
                </div>
            );
        }

        case 'SCADA_MACHINE_STATUS': {
            const rawStatus = resolveComponentDatasourceValue(comp, comp.props.status || 'IDLE');
            const status = String(rawStatus).toUpperCase();
            
            let statusColor = '#f59e0b'; // IDLE
            if (status === 'RUNNING' || status === 'RUN') statusColor = '#22c55e';
            else if (status === 'DOWN' || status === 'STOPPED' || status === 'FAULT') statusColor = '#ef4444';

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{comp.props.label || 'MACHINE WORKSTATE'}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Glowing bezel bulb */}
                        <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: statusColor,
                            boxShadow: `0 0 12px ${statusColor}`,
                            border: '2px solid #334155'
                        }} />
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: statusColor }}>{status}</div>
                            <div style={{ fontSize: '0.55rem', color: themeStyles.textSec, marginTop: '2px' }}>
                                RUN: {comp.props.runTime || 120}m | IDLE: {comp.props.idleTime || 40}m
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'SCADA_SPC_CHART': {
            const label = comp.props.label || 'SPC CONTROL CHART';
            const ucl = comp.props.ucl ?? 75;
            const lcl = comp.props.lcl ?? 25;
            const cl = comp.props.cl ?? 50;

            // Simple SPC points
            const points = [48, 52, 55, 46, 50, 68, 62, 59, 45, 38, 41, 52, 58, 60, 48, 51];
            const width = 240;
            const height = 80;
            const step = width / (points.length - 1);
            
            const pathData = points.map((p, index) => {
                const x = index * step;
                const y = height - (p / 100) * height;
                return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            }).join(' ');

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold' }}>{label}</div>
                    <div style={{ flex: 1, position: 'relative', marginTop: '6px', border: '1px solid #1e293b' }}>
                        {/* SPC Limits Lines */}
                        <div style={{ position: 'absolute', top: `${100 - ucl}%`, left: 0, width: '100%', borderTop: '1px dashed #ef4444', opacity: 0.8 }} />
                        <div style={{ position: 'absolute', top: `${100 - cl}%`, left: 0, width: '100%', borderTop: '1px solid #10b981', opacity: 0.6 }} />
                        <div style={{ position: 'absolute', top: `${100 - lcl}%`, left: 0, width: '100%', borderTop: '1px dashed #ef4444', opacity: 0.8 }} />
                        
                        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', display: 'block' }} preserveAspectRatio="none">
                            {/* Trend line */}
                            <path d={pathData} fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                            {/* Control limit labels */}
                            <text x="5" y={height - (ucl/100)*height - 2} fill="#ef4444" fontSize="5">UCL</text>
                            <text x="5" y={height - (cl/100)*height - 2} fill="#10b981" fontSize="5">CL</text>
                            <text x="5" y={height - (lcl/100)*height - 2} fill="#ef4444" fontSize="5">LCL</text>
                        </svg>
                    </div>
                </div>
            );
        }

        case 'SCADA_ENERGY_MONITOR': {
            const rawVal = resolveComponentDatasourceValue(comp, comp.props.currentPower ?? 42.6);
            const currentPower = Number(rawVal);
            const daily = Number(comp.props.dailyEnergy || 345.8);
            const monthly = Number(comp.props.monthlyEnergy || 10420.5);
            const unit = comp.props.unit || 'kWh';

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '2px' }}>
                        ⚡ {comp.props.label || 'ENERGY CONSUMPTION'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#070a13', padding: '2px 6px', borderRadius: '3px' }}>
                            <span style={{ fontSize: '0.6rem', color: themeStyles.textSec }}>DEMAND:</span>
                            <span style={{ fontSize: '0.85rem', color: '#eab308', fontWeight: 'bold' }}>{currentPower.toFixed(1)} kW</span>
                        </div>
                        <div style={{ fontSize: '0.6rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: themeStyles.textSec }}>DAILY TOTAL:</span>
                                <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{daily.toFixed(1)} {unit}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: themeStyles.textSec }}>MONTHLY TOTAL:</span>
                                <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{monthly.toFixed(0)} {unit}</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'SCADA_BATCH_TRACKER': {
            const batchId = comp.props.batchId || 'BATCH-001';
            const product = comp.props.product || 'Product A';
            const targetQty = Number(comp.props.targetQty || 1000);
            const actualQty = Number(comp.props.actualQty || 420);
            const status = comp.props.status || 'IN_PROGRESS';

            const pct = Math.min(100, Math.max(0, (actualQty / targetQty) * 100));

            return (
                <div style={containerStyle}>
                    <div style={{ fontSize: '0.65rem', color: themeStyles.textSec, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                        <span>📦 {comp.props.label || 'BATCH PRODUCTION'}</span>
                        <span style={{
                            backgroundColor: status === 'COMPLETED' ? '#22c55e' : '#f59e0b',
                            color: '#0f172a',
                            fontSize: '0.5rem',
                            fontWeight: 'bold',
                            padding: '1px 3px',
                            borderRadius: '2px'
                        }}>{status}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', margin: '4px 0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '0.6rem', gap: '4px' }}>
                            <div>ID: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{batchId}</span></div>
                            <div>PROD: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{product}</span></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', marginTop: '2px' }}>
                            <span>QTY: {actualQty} / {targetQty}</span>
                            <span>{pct.toFixed(0)}%</span>
                        </div>
                        {/* Progress slider bar */}
                        <div style={{ width: '100%', height: '5px', backgroundColor: '#1e293b', borderRadius: '2.5px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#a855f7' }} />
                        </div>
                    </div>
                </div>
            );
        }

        default:
            return (
                <div style={{ ...containerStyle, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
                    <Info size={18} color="#94a3b8" />
                    <span style={{ fontSize: '0.65rem', marginTop: '4px' }}>Unknown SCADA Widget: {comp.type}</span>
                </div>
            );
    }
}
