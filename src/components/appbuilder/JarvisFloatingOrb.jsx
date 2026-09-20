import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Sparkles, Volume2, Bot, Play, Square, X,
  Send, ArrowRight, Zap, Layers, Activity, ChevronRight, MessageSquare
} from 'lucide-react';

/**
 * JarvisFloatingOrb
 * Iconic J.A.R.V.I.S. Holographic Arc Reactor Floating Button & Interactive Command Center.
 * Provides complete visual and voice interaction:
 * - One-click voice listening with speech-to-text
 * - Holographic Command HUD Popover with quick actions & text prompt input
 * - Direct execution bridge into BuilderCopilot & Ghost Pilot RPA
 */
export default function JarvisFloatingOrb({
  isRunning = false,
  isSpeaking = false,
  isCoding = false,
  isCopilotOpen = false,
  cursorPos = null,
  currentActionLabel = '',
  onOpenCopilot,
  onStopRPA,
  onTriggerPrompt
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const recognitionRef = useRef(null);
  const [canvasCenter, setCanvasCenter] = useState({ x: 400, y: 300 });

  // Calculate canvas center coordinates
  useEffect(() => {
    const updateCanvasCenter = () => {
      const canvasContainer = document.querySelector('.konvajs-content') ||
                              document.querySelector('#app-builder-canvas') ||
                              document.querySelector('[data-canvas-container="true"]') ||
                              document.querySelector('.canvas-workspace');
      if (canvasContainer) {
        const rect = canvasContainer.getBoundingClientRect();
        setCanvasCenter({
          x: Math.round(rect.left + rect.width / 2 - 37),
          y: Math.round(rect.top + rect.height / 2 - 37)
        });
      } else {
        setCanvasCenter({
          x: Math.round(window.innerWidth / 2 - 37),
          y: Math.round(window.innerHeight / 2 - 37)
        });
      }
    };
    updateCanvasCenter();
    window.addEventListener('resize', updateCanvasCenter);
    return () => window.removeEventListener('resize', updateCanvasCenter);
  }, [isCoding]);

  // Voice narration: "Saya sedang coding, tunggu sampai selesai."
  useEffect(() => {
    if (isCoding) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          if (!window._jarvisUtterancePool) window._jarvisUtterancePool = new Set();
          window.speechSynthesis.cancel();
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          const utterance = new SpeechSynthesisUtterance('Saya sedang coding, tunggu sampai selesai.');
          utterance.lang = 'id-ID';
          utterance.rate = 1.05;
          utterance.pitch = 1.0;
          const voices = window.speechSynthesis.getVoices();
          const idVoice = voices.find(v => {
            const lang = (v.lang || '').toLowerCase();
            const name = (v.name || '').toLowerCase();
            return lang.includes('id') || lang.includes('ind') || name.includes('indonesia');
          });
          if (idVoice) utterance.voice = idVoice;

          window._jarvisUtterancePool.add(utterance);
          utterance.onend = () => {
            window._jarvisUtterancePool.delete(utterance);
          };
          utterance.onerror = () => {
            window._jarvisUtterancePool.delete(utterance);
          };

          setTimeout(() => {
            try {
              if (window.speechSynthesis.paused) window.speechSynthesis.resume();
              window.speechSynthesis.speak(utterance);
            } catch (err) {}
          }, 30);
        } catch (e) {
          console.warn('[Jarvis] Speech error:', e);
        }
      }
    }
  }, [isCoding]);

  // Quick Action templates
  const quickActions = [
    {
      title: 'Form QC & Inspeksi',
      desc: 'Form checklist kualitas dengan pass/fail dan signature',
      prompt: 'Buatkan formulir Quality Control dengan checklist inspeksi pass fail dan tombol submit simpan data',
      icon: '🛡️'
    },
    {
      title: 'Dashboard Produksi OEE',
      desc: '4 KPI card, chart tren, dan tabel status produksi',
      prompt: 'Buatkan dashboard monitoring produksi dengan 4 KPI card efisiensi OEE, chart trend, dan tabel status mesin',
      icon: '📊'
    },
    {
      title: 'Inventory & Barcode',
      desc: 'Input stok, scanner barcode, dan tabel inventaris',
      prompt: 'Buatkan aplikasi inventory stok barang front-line dengan barcode scanner dan tabel barang',
      icon: '📦'
    },
    {
      title: 'Work Order Maintenance',
      desc: 'Form tiket perbaikan mesin dengan prioritas kerusakan',
      prompt: 'Buatkan form work order perbaikan mesin dengan pilihan prioritas, deskripsi masalah, dan approval supervisor',
      icon: '🔧'
    }
  ];

  // Speech recognition controller
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (err) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (!SpeechRecognition) {
      alert('Browser Anda tidak mendukung Web Speech Recognition. Silakan ketik perintah Anda di kolom teks.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'id-ID';
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => {
        setIsListening(true);
        setTranscript('Mendengarkan suara...');
      };

      rec.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        setTextInput(currentTranscript);

        if (event.results[0].isFinal && currentTranscript.trim()) {
          setIsListening(false);
        }
      };

      rec.onerror = (err) => {
        console.warn('[JarvisOrb] Voice error:', err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('[JarvisOrb] Failed to start voice:', err);
      setIsListening(false);
    }
  };

  // Submit action to Copilot & Ghost Pilot RPA
  const handleExecutePrompt = (promptToSend) => {
    const finalPrompt = (promptToSend || textInput || transcript).trim();
    if (!finalPrompt) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    setIsListening(false);
    setIsModalOpen(false);

    if (onOpenCopilot) onOpenCopilot();
    if (onTriggerPrompt) {
      onTriggerPrompt(finalPrompt);
    }
  };

  const handleOrbClick = (e) => {
    e.stopPropagation();

    if (isRunning) {
      if (onStopRPA) onStopRPA();
      return;
    }

    setIsModalOpen(prev => !prev);
  };

  const hasTarget = isRunning && cursorPos && typeof cursorPos.x === 'number' && typeof cursorPos.y === 'number';

  let containerStyle;
  if (isCoding) {
    // Center of canvas while coding
    containerStyle = {
      position: 'fixed',
      left: `${canvasCenter.x}px`,
      top: `${canvasCenter.y}px`,
      zIndex: 10002,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      transition: 'left 0.6s cubic-bezier(0.25, 1, 0.5, 1), top 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
      userSelect: 'none',
      pointerEvents: 'auto'
    };
  } else if (hasTarget) {
    // Following component on canvas when Ghost Pilot RPA is assembling
    containerStyle = {
      position: 'fixed',
      left: `${Math.min(window.innerWidth - 90, Math.max(16, cursorPos.x + 24))}px`,
      top: `${Math.min(window.innerHeight - 90, Math.max(70, cursorPos.y - 45))}px`,
      zIndex: 10002,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      transition: 'left 0.45s cubic-bezier(0.25, 1, 0.5, 1), top 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
      userSelect: 'none',
      pointerEvents: 'auto'
    };
  } else {
    // Docked at bottom-left in idle state
    containerStyle = {
      position: 'fixed',
      bottom: '24px',
      left: '24px',
      zIndex: 10002,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      transition: 'left 0.45s cubic-bezier(0.25, 1, 0.5, 1), bottom 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
      userSelect: 'none',
      pointerEvents: 'auto'
    };
  }

  return (
    <>
      {/* Floating J.A.R.V.I.S. Arc Reactor Orb Button (Left side, Canvas Center when coding, follows component on Canvas when building) */}
      <div style={containerStyle}>
        {isCoding && (
          <div
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(2, 12, 20, 0.95)',
              border: '1.5px solid #00e5ff',
              borderRadius: '16px',
              color: '#00e5ff',
              fontSize: '11px',
              fontFamily: '"Orbitron", "Inter", sans-serif',
              fontWeight: 700,
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 24px rgba(0, 229, 255, 0.6), 0 4px 16px rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 10003,
              animation: 'pulse 1.5s infinite',
              backdropFilter: 'blur(8px)'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00e5ff', boxShadow: '0 0 10px #00e5ff' }} />
            <span>Saya sedang coding, tunggu sampai selesai...</span>
          </div>
        )}


        <div
          onClick={handleOrbClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title={
            isCoding
              ? 'J.A.R.V.I.S. sedang coding — Mohon tunggu'
              : isRunning
              ? 'J.A.R.V.I.S. RPA sedang bekerja — Klik untuk hentikan'
              : 'Klik untuk membuka J.A.R.V.I.S. Voice & Autonomous Builder'
          }
          style={{
            position: 'relative',
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            cursor: isCoding ? 'wait' : 'pointer',
            transform: (isHovered || isModalOpen) && !isCoding ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isCoding
              ? '0 0 45px rgba(0, 229, 255, 0.9), 0 0 80px rgba(2, 132, 199, 0.7), inset 0 0 25px rgba(0, 229, 255, 0.6)'
              : isSpeaking
              ? '0 0 45px rgba(0, 229, 255, 0.95), 0 0 80px rgba(2, 132, 199, 0.8), inset 0 0 25px rgba(0, 229, 255, 0.7)'
              : isRunning || isListening
              ? '0 0 35px rgba(0, 229, 255, 0.8), 0 0 70px rgba(2, 132, 199, 0.6), inset 0 0 20px rgba(0, 229, 255, 0.4)'
              : isHovered || isModalOpen
              ? '0 0 28px rgba(0, 229, 255, 0.6), 0 0 50px rgba(2, 132, 199, 0.4)'
              : '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 18px rgba(0, 229, 255, 0.3)',
            backgroundColor: '#020c14',
            animation: isCoding ? 'jarvisClockwiseSpin 2s linear infinite' : undefined
          }}
        >
          {/* Outer Rotating Arc Ring */}
          <svg
            width="74"
            height="74"
            viewBox="0 0 100 100"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              animation: isCoding
                ? 'jarvisSpinClockwiseFast 1.5s linear infinite'
                : isRunning
                ? 'jarvisSpinFast 4s linear infinite'
                : 'jarvisSpinSlow 18s linear infinite'
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#00e5ff"
              strokeWidth="2.5"
              strokeDasharray="4 8 16 6 30 10 8 12"
              strokeLinecap="round"
              opacity="0.85"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeDasharray="2 4"
              opacity="0.6"
            />
          </svg>

          {/* Middle Counter-Rotating Arc Segments (Orange & Cyan) */}
          <svg
            width="74"
            height="74"
            viewBox="0 0 100 100"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              animation: isRunning
                ? 'jarvisSpinRevFast 3s linear infinite'
                : 'jarvisSpinRev 12s linear infinite'
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="none"
              stroke="#00e5ff"
              strokeWidth="4"
              strokeDasharray="55 120"
              strokeLinecap="round"
              opacity="0.9"
            />
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3.5"
              strokeDasharray="25 150"
              strokeDashoffset="75"
              strokeLinecap="round"
              opacity="0.95"
            />
            <circle cx="28" cy="24" r="2" fill="#fbbf24" />
            <circle cx="34" cy="20" r="2" fill="#fbbf24" />
            <circle cx="42" cy="18" r="2" fill="#fbbf24" />
          </svg>

          {/* Inner Reactor Core Circle */}
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at center, #0369a1 0%, #082f49 50%, #020c14 100%)',
              border: '1.5px solid #00e5ff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: 'inset 0 0 12px rgba(0, 229, 255, 0.7)',
              zIndex: 2
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '1px',
                backgroundColor: 'rgba(0, 229, 255, 0.25)',
                pointerEvents: 'none'
              }}
            />
            <div
              style={{
                position: 'absolute',
                height: '100%',
                width: '1px',
                backgroundColor: 'rgba(0, 229, 255, 0.25)',
                pointerEvents: 'none'
              }}
            />

            {isRunning ? (
              <Square size={16} color="#ef4444" fill="#ef4444" />
            ) : isListening ? (
              <Mic size={18} color="#00e5ff" className="animate-pulse" />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span
                  style={{
                    fontFamily: '"Orbitron", "Inter", -apple-system, sans-serif',
                    fontSize: '8px',
                    fontWeight: 900,
                    letterSpacing: '1.2px',
                    color: '#00e5ff',
                    textShadow: '0 0 8px #00e5ff, 0 0 16px #38bdf8',
                    lineHeight: 1
                  }}
                >
                  J.A.R.V.I.S.
                </span>
                <span
                  style={{
                    fontSize: '6px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    letterSpacing: '0.5px',
                    marginTop: '2px',
                    opacity: 0.85
                  }}
                >
                  RPA
                </span>
              </div>
            )}
          </div>

          {/* Beacon dot */}
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isRunning ? '#ef4444' : isListening ? '#10b981' : '#00e5ff',
              boxShadow: `0 0 8px ${isRunning ? '#ef4444' : isListening ? '#10b981' : '#00e5ff'}`,
              border: '1.5px solid #020c14',
              zIndex: 3
            }}
          />
        </div>
      </div>

      {/* ─── HOLOGRAPHIC J.A.R.V.I.S. COMMAND CENTER MODAL ─── */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 10001
            }}
          />

          {/* Interactive HUD Card */}
          <div
            style={{
              position: 'fixed',
              bottom: '106px',
              left: '24px',
              width: '390px',
              maxWidth: '92vw',
              backgroundColor: 'rgba(3, 14, 26, 0.94)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid #00e5ff',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 229, 255, 0.35)',
              color: '#f8fafc',
              zIndex: 10003,
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              animation: 'jarvisPopup 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              transition: 'left 0.3s ease'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'radial-gradient(circle, #0284c7 0%, #032b43 100%)',
                    border: '1px solid #00e5ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(0, 229, 255, 0.5)'
                  }}
                >
                  <Bot size={20} color="#00e5ff" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '1px', color: '#00e5ff' }}>
                    J.A.R.V.I.S. SYSTEM
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Autonomous Voice & Ghost Pilot RPA
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Voice Waveform & Microphone Button */}
            <div
              style={{
                backgroundColor: isListening ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isListening ? '#00e5ff' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: isListening ? '#38bdf8' : '#cbd5e1' }}>
                  {isListening ? '🎙️ Mendengarkan Suara Anda...' : 'Bicara Langsung via Suara'}
                </span>
                <span style={{ fontSize: '11px', color: isListening ? '#f8fafc' : '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {transcript || 'Tekan mic untuk mulai bicara...'}
                </span>
              </div>

              <button
                onClick={toggleListening}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: isListening ? '#ef4444' : '#0284c7',
                  border: '2px solid #ffffff',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isListening ? '0 0 16px #ef4444' : '0 0 16px rgba(2, 132, 199, 0.6)',
                  transition: 'all 0.2s'
                }}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>

            {/* Text Input Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '4px 6px 4px 12px'
              }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExecutePrompt();
                }}
                placeholder="Atau ketik instruksi di sini..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
              />
              <button
                onClick={() => handleExecutePrompt()}
                disabled={!textInput.trim() && !transcript.trim()}
                style={{
                  backgroundColor: textInput.trim() || transcript.trim() ? '#00e5ff' : 'rgba(255,255,255,0.1)',
                  color: textInput.trim() || transcript.trim() ? '#020c14' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: textInput.trim() || transcript.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s'
                }}
              >
                <span>Kirim</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Quick Action Chips */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                Perintah Instan (One-Click Ghost Pilot)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {quickActions.map((qa, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleExecutePrompt(qa.prompt)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.18s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 229, 255, 0.12)';
                      e.currentTarget.style.borderColor = '#00e5ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{qa.icon}</span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>
                          {qa.title}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {qa.desc}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={13} color="#00e5ff" />
                  </div>
                ))}
              </div>
            </div>

            {/* Open Builder Copilot Direct Link */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>
                Mode Ghost Pilot: Otonom (TTS + Kursor)
              </span>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onOpenCopilot) onOpenCopilot();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <MessageSquare size={12} /> Buka Chat Copilot
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes jarvisClockwiseSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes jarvisSpinClockwiseFast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes jarvisSpinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes jarvisSpinRev {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes jarvisSpinFast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes jarvisSpinRevFast {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes jarvisPopup {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes soundWave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </>
  );
}
