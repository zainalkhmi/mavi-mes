import React, { useState } from 'react';
import {
  Play, Pause, Square, Volume2, VolumeX, Sparkles, Bot,
  MousePointer2, ChevronUp, ChevronDown, Activity, Zap
} from 'lucide-react';
import RobotArmCursor, { RobotArmHUD } from './RobotArmCursor';

/**
 * GhostPilotOverlay
 * High-tech visual overlay rendering the Ghost Cursor / Robot Arm and Floating HUD
 * when Ghost Pilot RPA is autonomously building apps in AppBuilder.
 *
 * Features:
 * - Robot Arm Cursor (industrial robot arm visual)
 * - Ghost Cursor (classic hologram cursor)
 * - RobotArmHUD (status panel)
 * - Toggle between robot arm and ghost cursor modes
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
  onStop,
  cursorMode = 'robot-arm' // 'robot-arm' | 'ghost' | 'both'
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [useRobotArm, setUseRobotArm] = useState(true); // Toggle between robot arm and ghost

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
      {/* ─── ROBOT ARM CURSOR (Industrial Robot Arm) ───────────────────────── */}
      {(useRobotArm || cursorMode === 'robot-arm' || cursorMode === 'both') && (
        <RobotArmCursor
          cursorPos={cursorPos}
          isRunning={isRunning && !isPaused}
          isGripping={isClicking}
          isHovering={false}
          currentAction={currentActionLabel}
          speed={speed}
        />
      )}

      {/* ─── GHOST CURSOR (Classic Hologram) ──────────────────────────── */}
      {(!useRobotArm || cursorMode === 'ghost' || cursorMode === 'both') && (
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
        </div>
      )}

      {/* ─── ROBOT ARM HUD (Top Status Panel) ──────────────────────────── */}
      {useRobotArm && (
        <RobotArmHUD
          isRunning={isRunning && !isPaused}
          isGripping={isClicking}
          currentAction={currentActionLabel}
          speed={speed}
          progress={currentStepIndex}
          total={totalSteps}
          onSpeedChange={setSpeed}
          onPause={isPaused ? onResume : onPause}
          onStop={onStop}
        />
      )}

      {/* ─── JARVIS HUD (Top Center - Classic) ────────────────────────── */}
      {!useRobotArm && (
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

                {/* Prominent Voice Status Indicator ("tampilkan voice") */}
                <div
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
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

          {/* Voice Waveform Animation Indicator when Speaking */}
          {isSpeaking && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                height: '20px',
                padding: '0 8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              <span style={{ fontSize: '11px', color: '#38bdf8', marginRight: '3px' }}>🎙️</span>
              {[0.4, 0.9, 0.5, 1.0, 0.6, 0.8].map((scale, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '3px',
                    height: '14px',
                    backgroundColor: '#38bdf8',
                    borderRadius: '2px',
                    transform: `scaleY(${scale})`,
                    animation: `soundWave 0.6s infinite ease-in-out ${idx * 0.1}s`
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
            {/* Live Narration with Voice Visualizer */}
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

        {/* Mode Toggle Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '8px',
          borderTop: '1px solid rgba(56, 189, 248, 0.2)',
          gap: '8px'
        }}>
          <button
            onClick={() => setUseRobotArm(!useRobotArm)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              background: useRobotArm ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
              color: '#00e5ff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '14px' }}>{useRobotArm ? '🦾' : '👻'}</span>
            {useRobotArm ? 'Robot Arm Mode' : 'Ghost Mode'}
          </button>
        </div>
      </div>
      )}

      {/* Minimize toggle */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        style={{
          position: 'fixed',
          top: useRobotArm ? '80px' : (isMinimized ? '20px' : '130px'),
          right: '20px',
          pointerEvents: 'auto',
          background: 'rgba(2, 12, 20, 0.9)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          borderRadius: '8px',
          padding: '8px',
          cursor: 'pointer',
          color: '#00e5ff',
          transition: 'all 0.2s',
          zIndex: 100002
        }}
        title={useRobotArm ? 'Minimize HUD' : (isMinimized ? 'Expand HUD' : 'Minimize HUD')}
      >
        {isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

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
