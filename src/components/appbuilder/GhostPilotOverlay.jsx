import React, { useState } from 'react';
import {
  Play, Pause, Square, Volume2, VolumeX, Sparkles, Bot,
  MousePointer2, Hand, Grab, ChevronUp, ChevronDown, Activity, Zap, Layers, Edit3
} from 'lucide-react';

/**
 * GhostPilotOverlay
 * High-tech visual overlay rendering the Humanizer Ghost Cursor and Floating Jarvis HUD
 * when Ghost Pilot RPA is autonomously building apps in AppBuilder.
 */
export default function GhostPilotOverlay({
  isRunning,
  isPaused,
  currentStepIndex,
  totalSteps,
  currentActionLabel,
  cursorPos = { x: 400, y: 300 },
  isClicking = false,
  isSpeaking = false,
  speed = 1,
  setSpeed,
  voiceEnabled = true,
  setVoiceEnabled,
  isDragging = false,
  draggedItem = null,
  cursorMode = 'pointer', // 'pointer' | 'grab' | 'grabbing' | 'typing'
  typingText = '',
  onPause,
  onResume,
  onStop
}) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isRunning) return null;

  const progressPercent = totalSteps > 0 ? Math.min(100, Math.round((currentStepIndex / totalSteps) * 100)) : 0;

  // Shorten action label for mini floating tag near cursor
  const getShortActionText = (label = '') => {
    if (!label) return 'Bergerak...';
    const clean = label.replace(/Langkah \d+:\s*/i, '').replace(/Mandor App:\s*/i, '');
    return clean.length > 28 ? clean.slice(0, 26) + '...' : clean;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        overflow: 'hidden'
      }}
    >
      {/* ─── 1. HUMANIZER GHOST CURSOR (Real Pointer, Drag Ghost, Typing Pill) ── */}
      <div
        style={{
          position: 'absolute',
          left: cursorPos.x,
          top: cursorPos.y,
          transform: 'translate(-4px, -4px)',
          pointerEvents: 'none',
          zIndex: 100000,
          willChange: 'left, top'
        }}
      >
        {/* Glow halo around cursor point */}
        <div
          style={{
            position: 'absolute',
            width: isDragging ? '48px' : '36px',
            height: isDragging ? '48px' : '36px',
            borderRadius: '50%',
            backgroundColor: isDragging ? 'rgba(56, 189, 248, 0.35)' : 'rgba(59, 130, 246, 0.22)',
            boxShadow: isDragging
              ? '0 0 28px rgba(56, 189, 248, 0.9), 0 0 50px rgba(147, 51, 234, 0.5)'
              : '0 0 20px rgba(59, 130, 246, 0.7)',
            transform: 'translate(-50%, -50%)',
            left: '4px',
            top: '4px',
            animation: 'ghostPulse 1.6s infinite ease-in-out',
            transition: 'width 0.2s, height 0.2s, background-color 0.2s'
          }}
        />

        {/* Dynamic Cursor Icon (Pointer / Grabbing / Typing) */}
        <div
          style={{
            position: 'relative',
            transform: isClicking ? 'scale(0.85) translate(1px, 1px)' : isDragging ? 'rotate(-6deg)' : 'scale(1)',
            transition: 'transform 0.12s ease-out'
          }}
        >
          {cursorMode === 'grabbing' || isDragging ? (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.9), rgba(147, 51, 234, 0.9))',
                border: '1.5px solid #38bdf8',
                boxShadow: '0 4px 16px rgba(56, 189, 248, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Grab size={18} color="#ffffff" />
            </div>
          ) : cursorMode === 'grab' ? (
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid #38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Hand size={17} color="#38bdf8" />
            </div>
          ) : cursorMode === 'typing' ? (
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(236, 72, 153, 0.9))',
                border: '1.5px solid #c084fc',
                boxShadow: '0 4px 16px rgba(168, 85, 247, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Edit3 size={16} color="#ffffff" />
            </div>
          ) : (
            /* Sleek Cyber Human Pointer Arrow */
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                filter: 'drop-shadow(0 3px 10px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 8px rgba(56, 189, 248, 0.7))'
              }}
            >
              <path
                d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                fill="url(#jarvisCursorGrad)"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="jarvisCursorGrad" x1="3" y1="3" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#0284c7" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>

        {/* ─── REAL DRAG & DROP GHOST CARD ─── */}
        {isDragging && draggedItem && (
          <div
            style={{
              position: 'absolute',
              top: '28px',
              left: '18px',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid #38bdf8',
              borderRadius: '10px',
              padding: '6px 12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              whiteSpace: 'nowrap',
              animation: 'dragFloat 1.2s infinite ease-in-out'
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Layers size={13} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>
                {draggedItem.label || draggedItem.type}
              </div>
              <div style={{ fontSize: '9px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>DRAGGING</span>
                <span>•</span>
                <span>X: {Math.round(cursorPos.x)} Y: {Math.round(cursorPos.y)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── SETTING UI / TYPING LIVE BUBBLE ─── */}
        {cursorMode === 'typing' && (
          <div
            style={{
              position: 'absolute',
              top: '26px',
              left: '18px',
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid #c084fc',
              borderRadius: '8px',
              padding: '6px 10px',
              boxShadow: '0 8px 24px rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: '10px', color: '#c084fc', fontWeight: 700 }}>SETTING:</span>
            <span style={{ fontSize: '11px', color: '#f8fafc', fontFamily: 'monospace', fontWeight: 600 }}>
              "{typingText}"
            </span>
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '13px',
                background: '#c084fc',
                animation: 'blink 0.75s infinite'
              }}
            />
          </div>
        )}

        {/* ─── SUBTLE ACTION TAG (When not dragging/typing) ─── */}
        {!isDragging && cursorMode !== 'typing' && (
          <div
            style={{
              position: 'absolute',
              top: '22px',
              left: '22px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 600,
              color: '#38bdf8',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sparkles size={10} color="#38bdf8" />
            <span>{getShortActionText(currentActionLabel)}</span>
          </div>
        )}

        {/* Click Ripple Wave */}
        {isClicking && (
          <div
            style={{
              position: 'absolute',
              left: '4px',
              top: '4px',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid #38bdf8',
              transform: 'translate(-50%, -50%) scale(1.6)',
              opacity: 0,
              animation: 'rippleExpand 0.35s ease-out'
            }}
          />
        )}
      </div>

      {/* ─── 2. FLOATING JARVIS HUD (Top Center) ───────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'auto',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.2)',
          color: '#f8fafc',
          padding: isMinimized ? '8px 16px' : '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: isMinimized ? '300px' : '480px',
          maxWidth: '90vw',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 100001
        }}
      >
        {/* HUD Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Hologram Avatar */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #9333ea)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSpeaking ? '0 0 14px #38bdf8' : 'none',
                transition: 'box-shadow 0.2s'
              }}
            >
              <Bot size={18} color="#ffffff" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em', color: '#f8fafc' }}>
                  GHOST PILOT RPA
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.35)'
                  }}
                >
                  HUMAN DYNAMICS
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: isPaused ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: isPaused ? '#fbbf24' : '#34d399',
                    border: `1px solid ${isPaused ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                  }}
                >
                  {isPaused ? 'PAUSED' : 'AUTONOMOUS'}
                </span>

                {/* Voice Status Indicator */}
                <div
                  onClick={() => setVoiceEnabled && setVoiceEnabled(!voiceEnabled)}
                  title={voiceEnabled ? 'Suara Jarvis Aktif (Klik untuk mute)' : 'Suara Jarvis Nonaktif (Klik untuk aktifkan)'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: voiceEnabled
                      ? (isSpeaking ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.12)')
                      : 'rgba(239, 68, 68, 0.15)',
                    border: voiceEnabled
                      ? (isSpeaking ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.35)')
                      : '1px solid rgba(239, 68, 68, 0.35)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSpeaking ? '0 0 10px rgba(56, 189, 248, 0.5)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '10px' }}>🎙️</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.03em',
                      color: voiceEnabled ? (isSpeaking ? '#38bdf8' : '#7dd3fc') : '#f87171'
                    }}
                  >
                    {voiceEnabled ? (isSpeaking ? 'VOICE AKTIF' : 'VOICE ON') : 'VOICE OFF'}
                  </span>
                  {isSpeaking && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '10px', marginLeft: '2px' }}>
                      {[0.5, 1, 0.6, 1, 0.4].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            width: '2px',
                            height: '100%',
                            backgroundColor: '#38bdf8',
                            borderRadius: '1px',
                            transform: `scaleY(${h})`,
                            animation: `soundWave 0.5s infinite ease-in-out ${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Langkah {currentStepIndex} dari {totalSteps} ({progressPercent}%)
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Voice Mute/Unmute */}
            <button
              onClick={() => setVoiceEnabled && setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? 'Nonaktifkan Suara Jarvis' : 'Aktifkan Suara Jarvis'}
              style={{
                background: voiceEnabled ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: voiceEnabled ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: voiceEnabled ? '#38bdf8' : '#64748b',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isSpeaking ? '0 0 8px rgba(56, 189, 248, 0.4)' : 'none'
              }}
            >
              {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            {/* Speed Multiplier */}
            <button
              onClick={() => setSpeed && setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
              title="Kecepatan Eksekusi"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: '#e2e8f0',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {speed}x
            </button>

            {/* Pause / Resume */}
            <button
              onClick={isPaused ? onResume : onPause}
              title={isPaused ? 'Lanjutkan' : 'Jeda'}
              style={{
                background: isPaused ? '#10b981' : '#f59e0b',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isPaused ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'
              }}
            >
              {isPaused ? <Play size={14} fill="#ffffff" /> : <Pause size={14} fill="#ffffff" />}
            </button>

            {/* Stop / Abort */}
            <button
              onClick={onStop}
              title="Hentikan Ghost Pilot"
              style={{
                background: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Square size={13} fill="#ffffff" />
            </button>

            {/* Minimize toggle */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              {isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {/* Expanded Details & Progress Bar */}
        {!isMinimized && (
          <>
            {/* Live Narration */}
            <div
              style={{
                fontSize: '12px',
                color: '#f8fafc',
                lineHeight: 1.4,
                backgroundColor: isSpeaking ? 'rgba(2, 132, 199, 0.22)' : 'rgba(0, 0, 0, 0.35)',
                padding: '8px 12px',
                borderRadius: '8px',
                borderLeft: isSpeaking ? '3px solid #38bdf8' : '3px solid rgba(56, 189, 248, 0.4)',
                border: isSpeaking ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                boxShadow: isSpeaking ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none',
                minHeight: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: isSpeaking ? '#38bdf8' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                <span>🎙️</span>
                <span>JARVIS:</span>
              </div>
              <span style={{ flex: 1, fontWeight: isSpeaking ? 600 : 400 }}>
                {currentActionLabel || 'Menyiapkan instruksi berikutnya...'}
              </span>
              {isSpeaking && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '12px', flexShrink: 0 }}>
                  {[0.4, 0.9, 0.6, 1.0, 0.5].map((scale, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '2px',
                        height: '100%',
                        backgroundColor: '#38bdf8',
                        borderRadius: '1px',
                        transform: `scaleY(${scale})`,
                        animation: `soundWave 0.6s infinite ease-in-out ${idx * 0.12}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Step Progress Line */}
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                  transition: 'width 0.4s ease-out'
                }}
              />
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes ghostPulse {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
        }
        @keyframes dragFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes rippleExpand {
          0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes soundWave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
