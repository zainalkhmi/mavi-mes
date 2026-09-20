/**
 * RobotArmCursor.jsx
 * =====================================================
 * Industrial Robot Arm Cursor untuk Ghost Pilot RPA
 * Muncul saat AI/JARVIS membangun komponen di canvas
 * =====================================================
 */

import React, { useState, useEffect, useMemo } from 'react';

/**
 * RobotArmCursor Component
 * Industrial robot arm visual dengan animasi gripper
 */
export default function RobotArmCursor({
    cursorPos = { x: 0, y: 0 },
    isRunning = false,
    isGripping = false,
    isHovering = false,
    currentAction = '',
    speed = 1,
    direction = 'right', // 'right' | 'left' | 'down'
}) {
    const [gripAngle, setGripAngle] = useState(0);
    const [waveAngle, setWaveAngle] = useState(0);
    const [glowIntensity, setGlowIntensity] = useState(0.5);

    // Gripper animation
    useEffect(() => {
        if (isGripping) {
            // Close gripper
            const closeInterval = setInterval(() => {
                setGripAngle(prev => {
                    if (prev >= 25) {
                        clearInterval(closeInterval);
                        // Open gripper after a moment
                        setTimeout(() => {
                            const openInterval = setInterval(() => {
                                setGripAngle(p => {
                                    if (p <= 0) {
                                        clearInterval(openInterval);
                                        return 0;
                                    }
                                    return Math.max(0, p - 3);
                                });
                            }, 30);
                        }, 200);
                        return 25;
                    }
                    return prev + 3;
                });
            }, 20);
            return () => clearInterval(closeInterval);
        }
    }, [isGripping]);

    // Subtle idle animation
    useEffect(() => {
        if (isRunning) {
            const waveInterval = setInterval(() => {
                setWaveAngle(prev => Math.sin(prev + 0.1) * 3);
            }, 50);
            return () => clearInterval(waveInterval);
        }
    }, [isRunning]);

    // Glow pulse
    useEffect(() => {
        if (isRunning) {
            const glowInterval = setInterval(() => {
                setGlowIntensity(prev => 0.4 + Math.sin(Date.now() / 300) * 0.3);
            }, 100);
            return () => clearInterval(glowInterval);
        }
    }, [isRunning]);

    // Determine arm direction based on cursor position
    const armDirection = useMemo(() => {
        if (direction === 'right') return 'right';
        if (direction === 'left') return 'left';
        return 'right';
    }, [direction]);

    const isFlipped = armDirection === 'left';

    return (
        <>
            {/* CSS Animations */}
            <style>{`
                @keyframes robotGlow {
                    0%, 100% { filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.5)); }
                    50% { filter: drop-shadow(0 0 16px rgba(0, 229, 255, 0.8)); }
                }
                @keyframes jointPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes armIdle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-2deg); }
                    75% { transform: rotate(2deg); }
                }
                @keyframes gripperShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-1px); }
                    75% { transform: translateX(1px); }
                }
            `}</style>

            {/* Main Cursor Container */}
            <div
                style={{
                    position: 'fixed',
                    left: cursorPos.x,
                    top: cursorPos.y,
                    transform: `translate(-50%, -100%) scaleX(${isFlipped ? -1 : 1})`,
                    pointerEvents: 'none',
                    zIndex: 100000,
                    transition: 'left 0.45s cubic-bezier(0.25, 1, 0.5, 1), top 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
                    filter: isRunning ? `drop-shadow(0 0 ${8 + glowIntensity * 8}px rgba(0, 229, 255, ${glowIntensity}))` : 'none',
                }}
            >
                {/* Robot Arm SVG */}
                <svg
                    width="120"
                    height="160"
                    viewBox="0 0 120 160"
                    style={{
                        animation: isRunning ? 'robotGlow 2s ease-in-out infinite' : 'none',
                        overflow: 'visible',
                    }}
                >
                    {/* Base Mount */}
                    <g transform="translate(60, 150)">
                        {/* Base plate */}
                        <ellipse
                            cx="0"
                            cy="0"
                            rx="35"
                            ry="8"
                            fill="#1e293b"
                            stroke="#00e5ff"
                            strokeWidth="2"
                        />
                        <ellipse
                            cx="0"
                            cy="-3"
                            rx="28"
                            ry="6"
                            fill="#0f172a"
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                        />
                        {/* Base indicator lights */}
                        <circle cx="-15" cy="-3" r="3" fill={isRunning ? '#10b981' : '#475569'}>
                            {isRunning && (
                                <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                            )}
                        </circle>
                        <circle cx="15" cy="-3" r="3" fill={isGripping ? '#f59e0b' : '#475569'}>
                            {isGripping && (
                                <animate attributeName="fill" values="#f59e0b;#fbbf24;#f59e0b" dur="0.3s" repeatCount="indefinite" />
                            )}
                        </circle>
                    </g>

                    {/* Arm Segment 1 - Upper Arm */}
                    <g transform="translate(60, 145)" style={{
                        transformOrigin: '60px 145px',
                        transform: `rotate(${waveAngle}deg)`,
                        animation: isRunning ? 'armIdle 2s ease-in-out infinite' : 'none',
                    }}>
                        {/* Joint 1 */}
                        <circle
                            cx="0"
                            cy="0"
                            r="12"
                            fill="#0f172a"
                            stroke="#00e5ff"
                            strokeWidth="2"
                        />
                        <circle cx="0" cy="0" r="6" fill="#0284c7" />

                        {/* Upper arm */}
                        <rect
                            x="-8"
                            y="-50"
                            width="16"
                            height="50"
                            rx="4"
                            fill="url(#armGradient)"
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                        />

                        {/* Joint 2 */}
                        <g transform="translate(0, -50)">
                            <circle
                                cx="0"
                                cy="0"
                                r="10"
                                fill="#0f172a"
                                stroke="#00e5ff"
                                strokeWidth="2"
                                style={{ animation: isRunning ? 'jointPulse 1.5s ease-in-out infinite' : 'none' }}
                            />
                            <circle cx="0" cy="0" r="5" fill="#0369a1" />

                            {/* Lower arm */}
                            <rect
                                x="-6"
                                y="-45"
                                width="12"
                                height="45"
                                rx="3"
                                fill="url(#armGradient2)"
                                stroke="#38bdf8"
                                strokeWidth="1.5"
                            />

                            {/* Wrist Joint */}
                            <g transform="translate(0, -45)">
                                <circle
                                    cx="0"
                                    cy="0"
                                    r="8"
                                    fill="#0f172a"
                                    stroke="#00e5ff"
                                    strokeWidth="2"
                                />
                                <circle cx="0" cy="0" r="4" fill="#0ea5e9" />

                                {/* Gripper Assembly */}
                                <g transform="translate(0, -5)" style={{
                                    transform: isGripping ? 'translateY(-2px)' : 'translateY(0)',
                                }}>
                                    {/* Gripper base */}
                                    <rect
                                        x="-10"
                                        y="-8"
                                        width="20"
                                        height="12"
                                        rx="3"
                                        fill="#1e293b"
                                        stroke="#00e5ff"
                                        strokeWidth="1.5"
                                    />

                                    {/* Left finger */}
                                    <path
                                        d={`M -8,-8 L -12,-25 Q -10,-28 -6,-28 L -4,-28 Q 0,-28 2,-25 L -2,-8`}
                                        fill="#0f172a"
                                        stroke="#00e5ff"
                                        strokeWidth="1.5"
                                        style={{
                                            transform: `rotate(${-gripAngle}deg)`,
                                            transformOrigin: '-6px -8px',
                                            transition: 'transform 0.15s ease-out',
                                        }}
                                    />

                                    {/* Right finger */}
                                    <path
                                        d={`M 8,-8 L 12,-25 Q 10,-28 6,-28 L 4,-28 Q 0,-28 -2,-25 L 2,-8`}
                                        fill="#0f172a"
                                        stroke="#00e5ff"
                                        strokeWidth="1.5"
                                        style={{
                                            transform: `rotate(${gripAngle}deg)`,
                                            transformOrigin: '6px -8px',
                                            transition: 'transform 0.15s ease-out',
                                        }}
                                    />

                                    {/* Finger tips */}
                                    <circle cx="-10" cy="-25" r="3" fill="#00e5ff" opacity={isGripping ? 1 : 0.5}>
                                        {isGripping && (
                                            <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
                                        )}
                                    </circle>
                                    <circle cx="10" cy="-25" r="3" fill="#00e5ff" opacity={isGripping ? 1 : 0.5}>
                                        {isGripping && (
                                            <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
                                        )}
                                    </circle>
                                </g>
                            </g>
                        </g>
                    </g>

                    {/* Status indicator */}
                    {isRunning && (
                        <g transform="translate(90, 30)">
                            <circle
                                cx="0"
                                cy="0"
                                r="6"
                                fill="#10b981"
                            >
                                <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
                            </circle>
                            <circle
                                cx="0"
                                cy="0"
                                r="10"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="1"
                                opacity="0.5"
                            >
                                <animate attributeName="r" values="10;15;10" dur="0.8s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.5;0;0.5" dur="0.8s" repeatCount="indefinite" />
                            </circle>
                        </g>
                    )}

                    {/* Gradient definitions */}
                    <defs>
                        <linearGradient id="armGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0f172a" />
                            <stop offset="50%" stopColor="#1e293b" />
                            <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>
                        <linearGradient id="armGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0f172a" />
                            <stop offset="50%" stopColor="#1e293b" />
                            <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Click Ripple Effect */}
                {isGripping && (
                    <div
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '0',
                            transform: 'translateX(-50%)',
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            border: '2px solid #00e5ff',
                            animation: 'ripple 0.5s ease-out forwards',
                        }}
                    />
                )}

                {/* Action Label */}
                {currentAction && (
                    <div
                        style={{
                            position: 'absolute',
                            left: '130px',
                            top: '-20px',
                            padding: '6px 12px',
                            background: 'rgba(2, 12, 20, 0.95)',
                            border: '1.5px solid #00e5ff',
                            borderRadius: '12px',
                            color: '#00e5ff',
                            fontSize: '11px',
                            fontFamily: '"Orbitron", "Inter", sans-serif',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
                            animation: 'fadeIn 0.2s ease-out',
                        }}
                    >
                        <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            display: 'inline-block',
                            marginRight: '6px',
                            boxShadow: '0 0 6px #10b981',
                        }} />
                        {currentAction}
                    </div>
                )}
            </div>

            {/* Additional Animation Styles */}
            <style>{`
                @keyframes ripple {
                    0% {
                        transform: translateX(-50%) scale(0.5);
                        opacity: 1;
                    }
                    100% {
                        transform: translateX(-50%) scale(2);
                        opacity: 0;
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}

/**
 * RobotArmHUD Component
 * Panel status floating di atas layar
 */
export function RobotArmHUD({
    isRunning = false,
    isGripping = false,
    currentAction = '',
    speed = 1,
    progress = 0,
    total = 0,
    onSpeedChange,
    onPause,
    onStop,
}) {
    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100001,
                background: 'rgba(2, 12, 20, 0.92)',
                backdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(0, 229, 255, 0.4)',
                borderRadius: '16px',
                padding: '12px 20px',
                color: '#f8fafc',
                fontFamily: '"Inter", system-ui, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 229, 255, 0.2)',
            }}
        >
            {/* Robot Icon */}
            <div
                style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)',
                    border: '1.5px solid #00e5ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isRunning ? '0 0 15px rgba(0, 229, 255, 0.5)' : 'none',
                }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L14 8H20L15 12L17 18L12 14L7 18L9 12L4 8H10L12 2Z" fill="#00e5ff" />
                    <circle cx="12" cy="12" r="10" stroke="#00e5ff" strokeWidth="1.5" fill="none" />
                    <circle cx="12" cy="12" r="4" fill="#0284c7" stroke="#00e5ff" strokeWidth="1" />
                </svg>
            </div>

            {/* Status Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                        style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            color: '#00e5ff',
                        }}
                    >
                        ROBOT ARM RPA
                    </span>
                    <span
                        style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: isRunning ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: isRunning ? '#34d399' : '#f87171',
                            border: `1px solid ${isRunning ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                        }}
                    >
                        {isRunning ? 'BUILDING' : 'IDLE'}
                    </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {total > 0 ? `Step ${progress} of ${total}` : currentAction || 'Initializing...'}
                </div>
            </div>

            {/* Progress Bar */}
            {total > 0 && (
                <div
                    style={{
                        width: '120px',
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: `${(progress / total) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #00e5ff, #0284c7)',
                            transition: 'width 0.3s ease-out',
                        }}
                    />
                </div>
            )}

            {/* Speed Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Speed:</span>
                {[1, 2, 4].map(s => (
                    <button
                        key={s}
                        onClick={() => onSpeedChange?.(s)}
                        style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: speed === s ? '#00e5ff' : 'rgba(255, 255, 255, 0.1)',
                            color: speed === s ? '#0f172a' : '#94a3b8',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                    >
                        {s}x
                    </button>
                ))}
            </div>

            {/* Control Buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
                <button
                    onClick={onPause}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#f59e0b',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title="Pause"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                    </svg>
                </button>
                <button
                    onClick={onStop}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#ef4444',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title="Stop"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="4" y="4" width="16" height="16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

