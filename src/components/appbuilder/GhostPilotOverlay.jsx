import React, { useState } from 'react';
import {
  Play, Pause, Square, Volume2, VolumeX, Sparkles, Bot,
  MousePointer2, ChevronUp, ChevronDown, Activity, Zap
} from 'lucide-react';

/**
 * GhostPilotOverlay
 * High-tech visual overlay rendering the Ghost Cursor and Floating Jarvis HUD
 * when Ghost Pilot RPA is autonomously building apps in AppBuilder.
 */
export default function GhostPilotOverlay({
  isRunning,
  isPaused,
  currentStepIndex,
  totalSteps,
  currentActionLabel,
  cursorPos,
  isClicking,
  isSpeaking,
  speed,
  setSpeed,
  voiceEnabled,
  setVoiceEnabled,
  onPause,
  onResume,
  onStop
}) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isRunning) return null;

  const progressPercent = totalSteps > 0 ? Math.min(100, Math.round((currentStepIndex / totalSteps) * 100)) : 0;

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
      {/* ─── 1. GHOST CURSOR (Smooth Glide & Click Ripple) ───────────────── */}
      <div
        style={{
          position: 'absolute',
          left: cursorPos.x,
          top: cursorPos.y,
          transform: 'translate(-6px, -6px)',
          transition: 'left 0.45s cubic-bezier(0.25, 1, 0.5, 1), top 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
          pointerEvents: 'none',
          zIndex: 100000
        }}
      >
        {/* Glow halo */}
        <div
          style={{
            position: 'absolute',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.25)',
            boxShadow: '0 0 24px rgba(59, 130, 246, 0.8), 0 0 48px rgba(147, 51, 234, 0.4)',
            transform: 'translate(-50%, -50%)',
            left: '6px',
            top: '6px',
            animation: 'ghostPulse 1.8s infinite ease-in-out'
          }}
        />

        {/* Click Ripple Wave */}
        {isClicking && (
          <div
            style={{
              position: 'absolute',
              left: '6px',
              top: '6px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '2px solid #38bdf8',
              transform: 'translate(-50%, -50%) scale(1.6)',
              opacity: 0,
              transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
            }}
          />
        )}

        {/* Main Pointer Arrow */}
        <div
          style={{
            position: 'relative',
            transform: isClicking ? 'scale(0.85) translate(2px, 2px)' : 'scale(1)',
            transition: 'transform 0.15s ease'
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
          >
            <path
              d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Floating Holographic Label beside Cursor */}
        <div
          style={{
            position: 'absolute',
            left: '26px',
            top: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '8px',
            padding: '4px 10px',
            color: '#f8fafc',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <Sparkles size={11} color="#38bdf8" />
          <span>Jarvis RPA Pilot</span>
        </div>
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
          minWidth: isMinimized ? '280px' : '460px',
          maxWidth: '90vw',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 100001
        }}
      >
        {/* HUD Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Hologram Avatar / Waveform Icon */}
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
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Langkah {currentStepIndex} dari {totalSteps} ({progressPercent}%)
              </div>
            </div>
          </div>

          {/* Voice Waveform Animation Indicator */}
          {isSpeaking && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '18px' }}>
              {[0.6, 1, 0.4, 0.9, 0.5].map((scale, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '3px',
                    height: '100%',
                    backgroundColor: '#38bdf8',
                    borderRadius: '2px',
                    transform: `scaleY(${scale})`,
                    animation: `soundWave 0.8s infinite ease-in-out ${idx * 0.15}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Voice Mute/Unmute */}
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? 'Nonaktifkan Suara Jarvis' : 'Aktifkan Suara Jarvis'}
              style={{
                background: voiceEnabled ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: voiceEnabled ? '#38bdf8' : '#64748b',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            {/* Speed Multiplier */}
            <button
              onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
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
                color: '#cbd5e1',
                lineHeight: 1.4,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '6px 10px',
                borderRadius: '8px',
                borderLeft: '3px solid #38bdf8',
                minHeight: '28px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {currentActionLabel || 'Menyiapkan instruksi berikutnya...'}
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
        @keyframes soundWave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
