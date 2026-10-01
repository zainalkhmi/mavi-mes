import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic, MicOff, Sparkles, Volume2, Bot, Play, Square, X,
  Send, ArrowRight, Zap, Layers, Activity, ChevronRight, MessageSquare,
  Camera, Monitor, Eye, ShieldAlert, Radio, RefreshCw, VolumeX, EyeOff
} from 'lucide-react';
import { getJarvisAstraEngine } from '../../services/jarvis/JarvisAstraEngine';

/**
 * JarvisFloatingOrb
 * Iconic J.A.R.V.I.S. Holographic Arc Reactor Floating Button & Interactive Command Center.
 * Upgraded with Project Astra & GPT-Omnimodal Multimodal Realtime Intelligence:
 * - Live Camera / Screen Vision Stream with Cyberpunk Viewfinder HUD
 * - Full-Duplex Voice with Instant Barge-In (Interruption)
 * - Multimodal Industrial & App Inspector (Gemini/GPT Vision)
 * - Proactive Environmental Sentinel Mode
 * - Classic Ghost Pilot RPA execution bridge
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
  const [activeTab, setActiveTab] = useState('astra'); // 'astra' | 'classic'
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const recognitionRef = useRef(null);
  const [canvasCenter, setCanvasCenter] = useState({ x: 400, y: 300 });

  // Astra Engine Integration
  const astraEngine = useMemo(() => getJarvisAstraEngine(), []);
  const videoRef = useRef(null);
  const [visionSource, setVisionSource] = useState('none'); // 'camera' | 'screen' | 'none'
  const [isAstraSpeaking, setIsAstraSpeaking] = useState(false);
  const [isAstraAnalyzing, setIsAstraAnalyzing] = useState(false);
  const [isProactiveActive, setIsProactiveActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [visionResult, setVisionResult] = useState('');
  const [snapshotThumb, setSnapshotThumb] = useState(null);

  // Hook into Astra Engine events
  useEffect(() => {
    const unsubAudio = astraEngine.on('audioLevel', (lvl) => setAudioLevel(lvl));
    const unsubSpeakStart = astraEngine.on('speechStarted', () => setIsAstraSpeaking(true));
    const unsubSpeakEnd = astraEngine.on('speechEnded', () => setIsAstraSpeaking(false));
    const unsubSpeakInterrupt = astraEngine.on('speechInterrupted', () => setIsAstraSpeaking(false));
    const unsubAnalyzeStart = astraEngine.on('analysisStarted', () => setIsAstraAnalyzing(true));
    const unsubAnalyzeComplete = astraEngine.on('analysisCompleted', ({ result, frameSnapshot }) => {
      setIsAstraAnalyzing(false);
      setVisionResult(result);
      if (frameSnapshot) setSnapshotThumb(frameSnapshot);
    });
    const unsubAnalyzeError = astraEngine.on('analysisError', () => setIsAstraAnalyzing(false));
    const unsubProactive = astraEngine.on('proactiveStateChanged', ({ running }) => setIsProactiveActive(running));
    const unsubVisionStopped = astraEngine.on('visionStopped', () => setVisionSource('none'));

    // Start background Voice Activity Detection listener for instant Barge-In
    astraEngine.startVoiceBargeInListener();

    return () => {
      unsubAudio();
      unsubSpeakStart();
      unsubSpeakEnd();
      unsubSpeakInterrupt();
      unsubAnalyzeStart();
      unsubAnalyzeComplete();
      unsubAnalyzeError();
      unsubProactive();
      unsubVisionStopped();
      astraEngine.stopVoiceBargeInListener();
    };
  }, [astraEngine]);

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
      astraEngine.speak('Saya sedang coding, tunggu sampai selesai.');
    }
  }, [isCoding, astraEngine]);

  // Handle Vision Sources
  const handleToggleVision = async (source) => {
    if (visionSource === source) {
      astraEngine.stopVisionStream();
      setVisionSource('none');
      return;
    }

    const success = await astraEngine.startVisionStream(source, videoRef.current);
    if (success) {
      setVisionSource(source);
    }
  };

  // Instant Scene Scan
  const handleScanScene = async (customPrompt = '') => {
    const res = await astraEngine.analyzeCurrentScene(customPrompt);
    if (res) {
      setVisionResult(res);
    }
  };

  // Toggle Sentinel
  const handleToggleSentinel = () => {
    const nextState = astraEngine.toggleProactiveMode();
    setIsProactiveActive(nextState);
  };

  // Barge-in speech cutoff
  const handleInterruptSpeech = () => {
    astraEngine.interruptSpeech('Manual cutoff');
  };

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

  // Astra Multimodal Industrial Chips
  const astraVisionPrompts = [
    {
      label: 'Inspeksi Mesin & Safety',
      icon: '🏭',
      prompt: 'Amati objek di layar atau kamera. Identifikasi status mesin, kesiapan operasional, dan kepatuhan keselamatan K3.'
    },
    {
      label: 'Audit UX & Layout Builder',
      icon: '📐',
      prompt: 'Periksa kanvas aplikasi saat ini: analisis keselarasan tata letak, kontras warna tombol, dan rekomendasikan perbaikan UX industri.'
    },
    {
      label: 'Deteksi Defect & Barcode',
      icon: '🔍',
      prompt: 'Periksa apakah ada komponen cacat/rusak, label barcode tidak terbaca, atau diskrepansi fisik.'
    },
    {
      label: 'Baca Indikator / Gauge',
      icon: '📊',
      prompt: 'Baca nilai jarum dial, layar digital sensor, atau grafik yang tertangkap dan sebutkan estimasi angkanya.'
    }
  ];

  // Speech recognition controller
  const toggleListening = () => {
    // If Jarvis is currently speaking, user tapping mic acts as instant barge-in!
    if (isAstraSpeaking || isSpeaking) {
      handleInterruptSpeech();
    }

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
          // If in Astra mode with active vision, analyze visual with spoken query!
          if (activeTab === 'astra' && visionSource !== 'none') {
            handleScanScene(currentTranscript);
          }
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

  // Audio reactive scale
  const audioPulseScale = 1 + Math.min(0.2, (audioLevel / 255) * 0.4);

  return (
    <>
      {/* Floating J.A.R.V.I.S. Arc Reactor Orb Button */}
      <div style={containerStyle}>
        <div
          onClick={handleOrbClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title={
            isCoding
              ? 'J.A.R.V.I.S. sedang coding — Mohon tunggu'
              : isRunning
              ? 'J.A.R.V.I.S. RPA sedang bekerja — Klik untuk hentikan'
              : 'Klik untuk membuka J.A.R.V.I.S. Astra Multimodal Voice & Vision'
          }
          style={{
            position: 'relative',
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            cursor: isCoding ? 'wait' : 'pointer',
            transform: `scale(${(isHovered || isModalOpen) && !isCoding ? 1.08 * audioPulseScale : audioPulseScale})`,
            transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isAstraSpeaking || isSpeaking
              ? '0 0 50px rgba(0, 229, 255, 0.95), 0 0 85px rgba(2, 132, 199, 0.85), inset 0 0 30px rgba(0, 229, 255, 0.7)'
              : isAstraAnalyzing
              ? '0 0 45px rgba(234, 179, 8, 0.9), 0 0 75px rgba(202, 138, 4, 0.6), inset 0 0 25px rgba(234, 179, 8, 0.5)'
              : isProactiveActive
              ? '0 0 40px rgba(16, 185, 129, 0.85), 0 0 70px rgba(5, 150, 105, 0.6)'
              : isRunning || isListening
              ? '0 0 35px rgba(0, 229, 255, 0.8), 0 0 70px rgba(2, 132, 199, 0.6)'
              : isHovered || isModalOpen
              ? '0 0 30px rgba(0, 229, 255, 0.6), 0 0 55px rgba(2, 132, 199, 0.45)'
              : '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 229, 255, 0.35)',
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
                : isRunning || isAstraAnalyzing
                ? 'jarvisSpinFast 3.5s linear infinite'
                : 'jarvisSpinSlow 18s linear infinite'
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={isProactiveActive ? '#10b981' : isAstraAnalyzing ? '#eab308' : '#00e5ff'}
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

          {/* Middle Arc Segments */}
          <svg
            width="56"
            height="56"
            viewBox="0 0 100 100"
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              animation: 'jarvisSpinRev 12s linear infinite'
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#f97316"
              strokeWidth="3"
              strokeDasharray="12 18 24 16"
              strokeLinecap="round"
              opacity="0.85"
            />
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke="#00e5ff"
              strokeWidth="1.5"
              strokeDasharray="6 10"
              opacity="0.7"
            />
          </svg>

          {/* Glowing Center Arc Reactor Core */}
          <div
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: isAstraSpeaking || isSpeaking
                ? 'radial-gradient(circle, #ffffff 0%, #00e5ff 40%, #0284c7 80%, #020c14 100%)'
                : isAstraAnalyzing
                ? 'radial-gradient(circle, #ffffff 0%, #eab308 40%, #ca8a04 80%, #020c14 100%)'
                : isProactiveActive
                ? 'radial-gradient(circle, #ffffff 0%, #10b981 40%, #059669 80%, #020c14 100%)'
                : 'radial-gradient(circle, #e0f2fe 0%, #00e5ff 40%, #0284c7 75%, #032b43 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.9), 0 0 18px rgba(0, 229, 255, 0.8)',
              border: '2px solid rgba(255, 255, 255, 0.85)'
            }}
          >
            {isAstraAnalyzing ? (
              <RefreshCw size={18} color="#020c14" style={{ animation: 'jarvisClockwiseSpin 1s linear infinite' }} />
            ) : visionSource !== 'none' ? (
              <Eye size={18} color="#020c14" />
            ) : isAstraSpeaking || isSpeaking ? (
              <Volume2 size={18} color="#020c14" />
            ) : isRunning ? (
              <Activity size={18} color="#020c14" />
            ) : (
              <Sparkles size={18} color="#020c14" />
            )}
          </div>

          {/* Astra Active Pill Badge */}
          <div
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-8px',
              backgroundColor: isProactiveActive ? '#10b981' : '#0284c7',
              color: '#ffffff',
              fontSize: '8px',
              fontWeight: 900,
              padding: '2px 5px',
              borderRadius: '9999px',
              border: '1.5px solid #00e5ff',
              boxShadow: '0 0 10px rgba(0, 229, 255, 0.8)',
              letterSpacing: '0.5px'
            }}
          >
            ASTRA
          </div>
        </div>

        {/* Status Label Pill */}
        <div
          style={{
            backgroundColor: 'rgba(2, 12, 20, 0.88)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 229, 255, 0.4)',
            borderRadius: '9999px',
            padding: '3px 10px',
            color: '#e0f2fe',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
            whiteSpace: 'nowrap'
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isAstraSpeaking ? '#38bdf8' : isAstraAnalyzing ? '#eab308' : isProactiveActive ? '#10b981' : '#00e5ff',
              boxShadow: '0 0 6px currentColor'
            }}
          />
          <span>
            {isCoding
              ? 'CODING...'
              : isAstraAnalyzing
              ? 'SCANNING...'
              : isAstraSpeaking
              ? 'SPEAKING'
              : isProactiveActive
              ? 'SENTINEL ON'
              : visionSource !== 'none'
              ? 'VISION LIVE'
              : 'JARVIS ASTRA'}
          </span>
        </div>
      </div>

      {/* Interactive Holographic HUD Command Center Popover */}
      {isModalOpen && (
        <>
          <div
            onClick={() => setIsModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 10001
            }}
          />

          <div
            style={{
              position: 'fixed',
              bottom: '106px',
              left: '24px',
              width: '430px',
              maxWidth: '94vw',
              maxHeight: '85vh',
              overflowY: 'auto',
              backgroundColor: 'rgba(2, 10, 19, 0.96)',
              backdropFilter: 'blur(25px)',
              border: '1.5px solid #00e5ff',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 229, 255, 0.35)',
              color: '#f8fafc',
              zIndex: 10003,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              animation: 'jarvisPopup 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header with Mode Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'radial-gradient(circle, #0284c7 0%, #032b43 100%)',
                    border: '1px solid #00e5ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(0, 229, 255, 0.5)'
                  }}
                >
                  <Bot size={18} color="#00e5ff" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '1px', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    J.A.R.V.I.S. ASTRA <span style={{ fontSize: '9px', background: '#0284c7', padding: '1px 5px', borderRadius: '4px', color: '#fff' }}>v6 OMNI</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Realtime Multimodal Vision, Full-Duplex Voice & Sentinel
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

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '3px', borderRadius: '10px' }}>
              <button
                onClick={() => setActiveTab('astra')}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: activeTab === 'astra' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                  color: activeTab === 'astra' ? '#ffffff' : '#94a3b8',
                  boxShadow: activeTab === 'astra' ? '0 0 10px rgba(2, 132, 199, 0.5)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Eye size={13} />
                <span>Astra Vision & Voice</span>
              </button>
              <button
                onClick={() => setActiveTab('classic')}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: activeTab === 'classic' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                  color: activeTab === 'classic' ? '#ffffff' : '#94a3b8',
                  boxShadow: activeTab === 'classic' ? '0 0 10px rgba(2, 132, 199, 0.5)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Zap size={13} />
                <span>Ghost Pilot RPA</span>
              </button>
            </div>

            {/* ══════════════ TAB 1: ASTRA MULTIMODAL ══════════════ */}
            {activeTab === 'astra' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Live Viewfinder / HUD Screen */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '190px',
                    borderRadius: '14px',
                    backgroundColor: '#030b15',
                    border: '1px solid rgba(0, 229, 255, 0.4)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Real Video Element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: visionSource !== 'none' ? 'block' : 'none'
                    }}
                  />

                  {/* Fallback Screen Graphics if camera is off */}
                  {visionSource === 'none' && (
                    <div style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                      <Camera size={36} color="#00e5ff" style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>Sensor Pandangan Standby</div>
                      <div style={{ fontSize: '10px', marginTop: '2px' }}>Pilih Kamera atau Layar di bawah untuk mengaktifkan mata Jarvis Astra</div>
                    </div>
                  )}

                  {/* Cyberpunk HUD Overlay Layer */}
                  {visionSource !== 'none' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '10px'
                      }}
                    >
                      {/* Top HUD Telemetry */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#00e5ff', fontFamily: 'monospace' }}>
                        <span>[ASTRA-LENS: {visionSource.toUpperCase()}]</span>
                        <span>[FPS: 30 / EXP: AUTO]</span>
                        <span>[AI-LOCK: ACTIVE]</span>
                      </div>

                      {/* Center Target Reticle */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '70px',
                          height: '70px',
                          border: '1.5px dashed rgba(0, 229, 255, 0.7)',
                          borderRadius: '12px'
                        }}
                      >
                        <div style={{ position: 'absolute', top: '-4px', left: '-4px', width: '8px', height: '8px', borderTop: '2px solid #00e5ff', borderLeft: '2px solid #00e5ff' }} />
                        <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', borderTop: '2px solid #00e5ff', borderRight: '2px solid #00e5ff' }} />
                        <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', width: '8px', height: '8px', borderBottom: '2px solid #00e5ff', borderLeft: '2px solid #00e5ff' }} />
                        <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '8px', height: '8px', borderBottom: '2px solid #00e5ff', borderRight: '2px solid #00e5ff' }} />
                      </div>

                      {/* Laser Sweep Animation */}
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          height: '2px',
                          background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)',
                          boxShadow: '0 0 10px #00e5ff',
                          animation: 'astraLaserSweep 2.2s ease-in-out infinite'
                        }}
                      />

                      {/* Bottom HUD State */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                        <span>REC: REALTIME STREAM</span>
                        {isProactiveActive && <span style={{ color: '#10b981' }}>● SENTINEL MONITORING</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Vision Controls Toolbar */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleToggleVision('camera')}
                    style={{
                      flex: 1,
                      padding: '7px 8px',
                      borderRadius: '8px',
                      border: `1px solid ${visionSource === 'camera' ? '#00e5ff' : 'rgba(255,255,255,0.1)'}`,
                      backgroundColor: visionSource === 'camera' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: visionSource === 'camera' ? '#00e5ff' : '#cbd5e1',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Camera size={13} />
                    <span>{visionSource === 'camera' ? 'Kamera Aktif' : 'Buka Kamera'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleVision('screen')}
                    style={{
                      flex: 1,
                      padding: '7px 8px',
                      borderRadius: '8px',
                      border: `1px solid ${visionSource === 'screen' ? '#00e5ff' : 'rgba(255,255,255,0.1)'}`,
                      backgroundColor: visionSource === 'screen' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: visionSource === 'screen' ? '#00e5ff' : '#cbd5e1',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Monitor size={13} />
                    <span>{visionSource === 'screen' ? 'Layar Aktif' : 'Share Layar'}</span>
                  </button>

                  <button
                    onClick={handleToggleSentinel}
                    title="Aktifkan pemantauan otomatis berkala"
                    style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${isProactiveActive ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                      backgroundColor: isProactiveActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: isProactiveActive ? '#10b981' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ShieldAlert size={13} />
                    <span>{isProactiveActive ? 'Sentinel ON' : 'Sentinel'}</span>
                  </button>
                </div>

                {/* Instant Scan Button */}
                <button
                  onClick={() => handleScanScene()}
                  disabled={isAstraAnalyzing}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    background: isAstraAnalyzing ? 'rgba(234, 179, 8, 0.2)' : 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
                    color: isAstraAnalyzing ? '#eab308' : '#020c14',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 900,
                    letterSpacing: '0.5px',
                    cursor: isAstraAnalyzing ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(0, 229, 255, 0.4)'
                  }}
                >
                  {isAstraAnalyzing ? (
                    <>
                      <RefreshCw size={15} style={{ animation: 'jarvisClockwiseSpin 1s linear infinite' }} />
                      <span>MENGANALISIS FRAME VISUAL...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={15} />
                      <span>⚡ ANALISIS PANDANGAN SEKARANG (SCAN SCENE)</span>
                    </>
                  )}
                </button>

                {/* Full-Duplex Voice & Interruption (Barge-In) Bar */}
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(0, 229, 255, 0.25)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isListening ? '#ef4444' : isAstraSpeaking ? '#0284c7' : 'rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                      onClick={toggleListening}
                    >
                      {isListening ? <Mic size={15} /> : <Volume2 size={15} />}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: isAstraSpeaking ? '#38bdf8' : '#f8fafc' }}>
                        {isAstraSpeaking ? 'Jarvis sedang bersuara...' : isListening ? 'Mendengarkan...' : 'Full-Duplex Voice Aktif'}
                      </span>
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                        🗣️ Interupsi Bebas (Bicara langsung untuk menyela)
                      </span>
                    </div>
                  </div>

                  {/* Cutoff / Barge In manual button if speaking */}
                  {isAstraSpeaking && (
                    <button
                      onClick={handleInterruptSpeech}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <VolumeX size={12} /> Hentikan
                    </button>
                  )}
                </div>

                {/* AI Visual Findings Result Card */}
                {visionResult && (
                  <div
                    style={{
                      backgroundColor: 'rgba(2, 132, 199, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      fontSize: '11px',
                      lineHeight: '1.5',
                      color: '#e0f2fe',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '4px' }}>
                      <span style={{ fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={12} /> Hasil Observasi Astra
                      </span>
                      <button
                        onClick={() => astraEngine.speak(visionResult)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#38bdf8',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Volume2 size={11} /> Ulangi Suara
                      </button>
                    </div>
                    <div>{visionResult}</div>
                  </div>
                )}

                {/* Quick Industrial Prompts Chips */}
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                    Skenario Uji Industri & Desain
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {astraVisionPrompts.map((p, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleScanScene(p.prompt)}
                        style={{
                          padding: '7px 9px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#cbd5e1',
                          transition: 'all 0.15s ease'
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
                        <span style={{ fontSize: '13px' }}>{p.icon}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ TAB 2: CLASSIC GHOST PILOT RPA ══════════════ */}
            {activeTab === 'classic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Voice Input Row */}
                <div
                  style={{
                    backgroundColor: isListening ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isListening ? '#00e5ff' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: isListening ? '#38bdf8' : '#cbd5e1' }}>
                      {isListening ? '🎙️ Mendengarkan Suara Anda...' : 'Bicara Langsung via Suara'}
                    </span>
                    <span style={{ fontSize: '10px', color: isListening ? '#f8fafc' : '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {transcript || 'Tekan mic untuk mulai bicara...'}
                    </span>
                  </div>

                  <button
                    onClick={toggleListening}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: isListening ? '#ef4444' : '#0284c7',
                      border: '2px solid #ffffff',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: isListening ? '0 0 14px #ef4444' : '0 0 14px rgba(2, 132, 199, 0.6)'
                    }}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                </div>

                {/* Text Input Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    padding: '3px 6px 3px 10px'
                  }}
                >
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleExecutePrompt();
                    }}
                    placeholder="Ketik instruksi aplikasi..."
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f8fafc',
                      fontSize: '11px'
                    }}
                  />
                  <button
                    onClick={() => handleExecutePrompt()}
                    disabled={!textInput.trim() && !transcript.trim()}
                    style={{
                      backgroundColor: textInput.trim() || transcript.trim() ? '#00e5ff' : 'rgba(255,255,255,0.1)',
                      color: textInput.trim() || transcript.trim() ? '#020c14' : '#64748b',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: textInput.trim() || transcript.trim() ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Kirim</span>
                    <ArrowRight size={12} />
                  </button>
                </div>

                {/* Quick Action Chips */}
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                    Perintah Instan (One-Click Ghost Pilot)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {quickActions.map((qa, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleExecutePrompt(qa.prompt)}
                        style={{
                          padding: '7px 9px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
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
                          <span style={{ fontSize: '13px' }}>{qa.icon}</span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>
                              {qa.title}
                            </span>
                            <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                              {qa.desc}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={12} color="#00e5ff" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Direct Link */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', color: '#64748b' }}>
                Mode: {activeTab === 'astra' ? 'Multimodal Live Vision' : 'Autonomous Ghost RPA'}
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
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <MessageSquare size={11} /> Buka Chat Copilot
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
        @keyframes astraLaserSweep {
          0% { top: 4%; opacity: 0.2; }
          50% { top: 92%; opacity: 0.9; }
          100% { top: 4%; opacity: 0.2; }
        }
        @keyframes jarvisPopup {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
