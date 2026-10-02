import React, { useState, useRef } from 'react';
import {
  Play, Pause, Square, Volume2, VolumeX, Sparkles, Bot,
  MousePointer2, Hand, Grab, ChevronUp, ChevronDown, Activity, Zap, Layers, Edit3,
  Move, Eye, EyeOff
} from 'lucide-react';

/**
 * GhostPilotOverlay
 * High-tech visual overlay rendering the Humanizer Ghost Cursor and Floating Jarvis HUD
 * when Ghost Pilot RPA is autonomously building apps in AppBuilder.
 * 
 * Features:
 * - Ultra-compact, low-profile bottom dock layout (never obstructs the canvas or top builder menu)
 * - Complete Hide / Show toggle to leave the canvas 100% visible
 * - Free drag & drop positioning anywhere on the screen
 * - Mini / Expanded view modes
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
  const [isMinimized, setIsMinimized] = useState(true); // Compact by default so canvas is never blocked!
  const [isHudHidden, setIsHudHidden] = useState(false); // Can be completely hidden into a tiny chip
  const [dockPreset, setDockPreset] = useState('bottom-center'); // 'bottom-center' | 'bottom-right' | 'top-right'
  const [dragOffset, setDragOffset] = useState(null); // { x, y }
  const isDraggingHudRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });
  const hudRef = useRef(null);

  if (!isRunning) return null;

  const progressPercent = totalSteps > 0 ? Math.min(100, Math.round((currentStepIndex / totalSteps) * 100)) : 0;

  // Shorten action label for mini floating tag near cursor
  const getShortActionText = (label = '') => {
    if (!label) return 'Bergerak...';
    const clean = label.replace(/Langkah \d+:\s*/i, '').replace(/Mandor App:\s*/i, '').replace(/Mandor Robot:\s*/i, '');
    return clean.length > 28 ? clean.slice(0, 26) + '...' : clean;
  };

  const handleMouseDownHeader = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    const hudEl = hudRef.current;
    if (!hudEl) return;
    e.preventDefault();
    isDraggingHudRef.current = true;
    const rect = hudEl.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top
    };

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingHudRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;
      const newLeft = Math.max(10, Math.min(window.innerWidth - rect.width - 10, dragStartRef.current.initialLeft + dx));
      const newTop = Math.max(10, Math.min(window.innerHeight - rect.height - 10, dragStartRef.current.initialTop + dy));
      setDragOffset({ x: newLeft, y: newTop });
    };

    const handleMouseUp = () => {
      isDraggingHudRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const getHudPositionStyle = () => {
    if (dragOffset) {
      return {
        position: 'fixed',
        left: `${dragOffset.x}px`,
        top: `${dragOffset.y}px`,
        transform: 'none'
      };
    }

    if (dockPreset === 'bottom-right') {
      return {
        position: 'fixed',
        bottom: '18px',
        right: '280px',
        transform: 'none'
      };
    }

    if (dockPreset === 'top-right') {
      return {
        position: 'fixed',
        top: '65px',
        right: '280px',
        transform: 'none'
      };
    }

    // Default: Docked at bottom-center — totally out of the canvas & top menu!
    return {
      position: 'fixed',
      bottom: '18px',
      left: '50%',
      transform: 'translateX(-50%)'
    };
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

      {/* ─── 2. FLOATING HUD (Ultra-Compact Dock or Full Hidden Pill) ─────── */}
      {isHudHidden ? (
        /* TINY FLOATING BADGE WHEN HIDDEN — 0% Canvas Obstruction */
        <div
          onClick={() => setIsHudHidden(false)}
          style={{
            position: 'fixed',
            bottom: '18px',
            right: '280px',
            pointerEvents: 'auto',
            backgroundColor: 'rgba(15, 23, 42, 0.90)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            borderRadius: '9999px',
            padding: '5px 12px',
            color: '#38bdf8',
            fontSize: '11px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.5), 0 0 12px rgba(56, 189, 248, 0.3)',
            zIndex: 100001,
            animation: 'fadeIn 0.2s ease-out'
          }}
          title="Klik untuk menampilkan kembali HUD RPA"
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span>RPA: {progressPercent}%</span>
          <Eye size={13} color="#38bdf8" />
        </div>
      ) : (
        /* COMPACT / EXPANDED SLIM FLOATING HUD */
        <div
          ref={hudRef}
          style={{
            ...getHudPositionStyle(),
            pointerEvents: 'auto',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: isMinimized ? '9999px' : '14px',
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.55), 0 0 20px rgba(56, 189, 248, 0.2)',
            color: '#f8fafc',
            padding: isMinimized ? '5px 10px 5px 12px' : '8px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: isMinimized ? '0px' : '6px',
            minWidth: isMinimized ? '320px' : '440px',
            maxWidth: '92vw',
            transition: dragOffset ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 100001,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Main Single-Row Control Bar (Draggable) */}
          <div
            onMouseDown={handleMouseDownHeader}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              cursor: 'grab',
              userSelect: 'none'
            }}
            title="Tahan & geser untuk memindahkan HUD ke mana saja"
          >
            {/* Left Status & Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  background: 'linear-gradient(135deg, #0284c7, #9333ea)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSpeaking ? '0 0 10px #38bdf8' : 'none',
                  flexShrink: 0
                }}
              >
                <Bot size={15} color="#ffffff" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                  Langkah {currentStepIndex}/{totalSteps}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: isPaused ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    color: isPaused ? '#fbbf24' : '#38bdf8',
                    border: `1px solid ${isPaused ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isPaused ? 'PAUSED' : `${progressPercent}%`}
                </span>

                {/* Compact Speaking Waveform */}
                {isSpeaking && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '10px', marginLeft: '2px' }}>
                    {[0.4, 0.9, 0.5, 1, 0.4].map((h, i) => (
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

            {/* Right Compact Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              {/* Voice Mute/Unmute */}
              <button
                onClick={() => setVoiceEnabled && setVoiceEnabled(!voiceEnabled)}
                title={voiceEnabled ? 'Suara Aktif (Klik untuk mute)' : 'Suara Nonaktif (Klik untuk aktifkan)'}
                style={{
                  background: voiceEnabled ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: voiceEnabled ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: voiceEnabled ? '#38bdf8' : '#64748b',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {voiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>

              {/* Speed Multiplier */}
              <button
                onClick={() => setSpeed && setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
                title="Kecepatan Eksekusi"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  padding: '3px 6px',
                  fontSize: '10px',
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
                  borderRadius: '6px',
                  color: '#ffffff',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {isPaused ? <Play size={12} fill="#ffffff" /> : <Pause size={12} fill="#ffffff" />}
              </button>

              {/* Stop / Abort */}
              <button
                onClick={onStop}
                title="Hentikan Ghost Pilot"
                style={{
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Square size={11} fill="#ffffff" />
              </button>

              {/* Move / Dock Position Switcher */}
              <button
                onClick={() => {
                  setDragOffset(null);
                  setDockPreset(prev => prev === 'bottom-center' ? 'bottom-right' : prev === 'bottom-right' ? 'top-right' : 'bottom-center');
                }}
                title={
                  dockPreset === 'bottom-center'
                    ? 'Posisi: Bawah Tengah (Klik untuk pindah ke Kanan Bawah)'
                    : dockPreset === 'bottom-right'
                    ? 'Posisi: Kanan Bawah (Klik untuk pindah ke Atas Kanan)'
                    : 'Posisi: Atas Kanan (Klik untuk pindah ke Bawah Tengah)'
                }
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  color: '#38bdf8',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Move size={12} />
              </button>

              {/* Hide completely toggle */}
              <button
                onClick={() => setIsHudHidden(true)}
                title="Sembunyikan HUD (Biar tidak menutupi canvas sama sekali)"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <EyeOff size={12} />
              </button>

              {/* Expand / Minimize Details toggle */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Tampilkan Narasi Lengkap' : 'Kecilkan HUD'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '3px'
                }}
              >
                {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Optional Expanded Narration Details */}
          {!isMinimized && (
            <div
              style={{
                fontSize: '11px',
                color: '#f8fafc',
                lineHeight: 1.4,
                backgroundColor: isSpeaking ? 'rgba(2, 132, 199, 0.22)' : 'rgba(0, 0, 0, 0.35)',
                padding: '6px 10px',
                borderRadius: '8px',
                borderLeft: isSpeaking ? '3px solid #38bdf8' : '3px solid rgba(56, 189, 248, 0.4)',
                border: isSpeaking ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '10px' }}>ASISTEN:</span>
              <span style={{ flex: 1, fontWeight: isSpeaking ? 600 : 400 }}>
                {currentActionLabel || 'Menyiapkan instruksi berikutnya...'}
              </span>
            </div>
          )}

          {/* Slim Glowing Progress Line at bottom border */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2.5px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
        </div>
      )}

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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
