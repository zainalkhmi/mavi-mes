import { useState, useRef, useCallback, useEffect } from 'react';
import { animateHumanCursor, simulateHumanTyping } from '../vibe/humanizer/HumanMotionEngine';

/**
 * useGhostPilotRPA
 * Autonomous RPA Controller for MaviCore AppBuilder with Humanizer Motion Engine.
 * 
 * Features:
 * - Real Drag & Drop simulation (picks up widget from palette, drags with Bézier physics, drops onto canvas)
 * - Setting UI simulation (moves to inspector, types properties letter-by-letter)
 * - Organic Bézier curve mouse trajectory with Fitts's Law velocity & micro-jitter
 * - Audio chimes & TTS voice narration (Jarvis / Mandor)
 */
export function useGhostPilotRPA() {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentActionLabel, setCurrentActionLabel] = useState('');
  const [cursorPos, setCursorPos] = useState({ x: 400, y: 300 });
  const [isClicking, setIsClicking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speed, setSpeed] = useState(1); // 1 = 1x, 2 = 2x, 4 = Fast
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Humanizer Extended States
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [cursorMode, setCursorMode] = useState('pointer'); // 'pointer' | 'grab' | 'grabbing' | 'typing'
  const [typingText, setTypingText] = useState('');

  const isPausedRef = useRef(false);
  const isStoppedRef = useRef(false);
  const isExecutingRef = useRef(false);
  const speedRef = useRef(1);
  const voiceEnabledRef = useRef(true);
  const currentCursorPosRef = useRef({ x: 400, y: 300 });

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  // Web Audio Synthesizer Chime for instant audible feedback
  const playJarvisStepChime = (type = 'step') => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!window._jarvisAudioContext) {
        window._jarvisAudioContext = new AudioContextClass();
      }
      const ctx = window._jarvisAudioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'step') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'complete') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // C6
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch (e) {
      // Audio context blocked
    }
  };

  // Helper to get Indonesian voice with fallbacks
  const getIndonesianVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const idVoice = voices.find(v => {
      const lang = (v.lang || '').toLowerCase();
      const name = (v.name || '').toLowerCase();
      return lang.includes('id') || lang.includes('ind') || name.includes('indonesia');
    });
    if (idVoice) return idVoice;

    const naturalVoice = voices.find(v => (v.name || '').toLowerCase().includes('natural'));
    if (naturalVoice) return naturalVoice;

    const googleVoice = voices.find(v => (v.name || '').toLowerCase().includes('google'));
    if (googleVoice) return googleVoice;

    return voices.find(v => v.default) || voices[0] || null;
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const handleVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = handleVoices;
      handleVoices();
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // Clean text for speech synthesizer
  const cleanSpeechText = (text = '') => {
    return text
      .replace(/[*_#`~>]/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/ADD_WIDGET/g, 'tambah komponen')
      .replace(/UPDATE_WIDGET/g, 'atur komponen')
      .replace(/CREATE_TRIGGER/g, 'pasang pemicu')
      .replace(/CREATE_TABLE/g, 'buat tabel')
      .replace(/CREATE_VARIABLE/g, 'buat variabel')
      .replace(/ADD_STEP/g, 'layar baru')
      .replace(/GO_TO_STEP/g, 'buka layar')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Speak with Indonesian voice
  const speakJarvis = useCallback((text) => {
    return new Promise((resolve) => {
      if (!voiceEnabledRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return resolve();
      }

      try {
        playJarvisStepChime('step');

        const clean = cleanSpeechText(text);
        if (!clean) return resolve();

        if (!window._jarvisUtterancePool) {
          window._jarvisUtterancePool = new Set();
        }

        try {
          if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            window.speechSynthesis.cancel();
          }
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch (e) {}

        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = 'id-ID';
        utterance.rate = speedRef.current === 2 ? 1.25 : speedRef.current === 4 ? 1.5 : 1.05;
        utterance.pitch = 1.0;

        const bestVoice = getIndonesianVoice();
        if (bestVoice) {
          utterance.voice = bestVoice;
        }

        window._jarvisUtterancePool.add(utterance);
        setIsSpeaking(true);

        let finished = false;
        let resumeInterval = null;

        const complete = () => {
          if (!finished) {
            finished = true;
            if (resumeInterval) clearInterval(resumeInterval);
            window._jarvisUtterancePool.delete(utterance);
            setIsSpeaking(false);
            resolve();
          }
        };

        resumeInterval = setInterval(() => {
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          }
        }, 1500);

        const safetyTimeoutMs = Math.max(3500, Math.min(8000, clean.length * 80 + 2000));
        const timerId = setTimeout(complete, safetyTimeoutMs);

        utterance.onend = () => {
          clearTimeout(timerId);
          complete();
        };

        utterance.onerror = (e) => {
          console.warn('[GhostPilot] Speech error:', e);
          clearTimeout(timerId);
          complete();
        };

        setTimeout(() => {
          try {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
            window.speechSynthesis.speak(utterance);
          } catch (speakErr) {
            console.warn('[GhostPilot] speak() error:', speakErr);
            complete();
          }
        }, 30);
      } catch (err) {
        console.warn('[GhostPilot] Speech synthesis error:', err);
        setIsSpeaking(false);
        resolve();
      }
    });
  }, []);

  // Sleep utility with pause/stop checking
  const waitAsync = useCallback((ms) => {
    return new Promise((resolve) => {
      const adjustedMs = ms / (speedRef.current || 1);
      const startTime = Date.now();

      const check = () => {
        if (isStoppedRef.current) {
          resolve();
          return;
        }

        if (isPausedRef.current) {
          setTimeout(check, 100);
          return;
        }

        if (Date.now() - startTime >= adjustedMs) {
          resolve();
        } else {
          setTimeout(check, 40);
        }
      };

      setTimeout(check, Math.min(40, adjustedMs));
    });
  }, []);

  // Move cursor with Humanizer Bézier Curve Physics
  const moveCursorHuman = useCallback(async (targetPos, options = {}) => {
    const start = { ...currentCursorPosRef.current };
    await animateHumanCursor(
      start,
      targetPos,
      (point) => {
        currentCursorPosRef.current = { x: point.x, y: point.y };
        setCursorPos({ x: point.x, y: point.y });
      },
      {
        speed: speedRef.current || 1,
        isAborted: () => isStoppedRef.current,
        overshoot: options.overshoot !== false,
        arcDirection: options.arcDirection
      }
    );
  }, []);

  // Compute screen coordinates on canvas for target command
  const getCommandScreenCoordinates = (cmd) => {
    const canvasContainer = document.querySelector('.konvajs-content') ||
                            document.querySelector('#app-builder-canvas') ||
                            document.querySelector('[data-canvas-container="true"]') ||
                            document.querySelector('.canvas-workspace');

    let baseLeft = 350;
    let baseTop = 150;
    let scale = 1;

    if (canvasContainer) {
      const rect = canvasContainer.getBoundingClientRect();
      baseLeft = rect.left;
      baseTop = rect.top;
    }

    const p = cmd?.payload || {};

    switch (cmd?.type) {
      case 'ADD_WIDGET':
      case 'CREATE_WIDGET': {
        const rawX = typeof p.x === 'number' ? p.x : 200;
        const rawY = typeof p.y === 'number' ? p.y : 180;
        return {
          x: Math.min(window.innerWidth - 60, Math.max(40, baseLeft + (rawX * scale) + 40)),
          y: Math.min(window.innerHeight - 60, Math.max(60, baseTop + (rawY * scale) + 30))
        };
      }
      case 'UPDATE_WIDGET': {
        const rightPane = document.querySelector('[data-right-pane="true"]') || document.querySelector('.app-builder-right-pane');
        if (rightPane) {
          const rect = rightPane.getBoundingClientRect();
          return { x: rect.left + 120, y: rect.top + 180 };
        }
        return { x: window.innerWidth - 200, y: 250 };
      }
      case 'CREATE_TRIGGER': {
        return { x: window.innerWidth - 220, y: 380 };
      }
      case 'CREATE_TABLE':
      case 'CREATE_VARIABLE': {
        return { x: baseLeft + 150, y: window.innerHeight - 100 };
      }
      case 'CREATE_STEP':
      case 'ADD_STEP':
      case 'ADD_SCREEN':
      case 'CREATE_SCREEN':
      case 'NEW_SCREEN':
      case 'ADD_PAGE':
      case 'CREATE_PAGE':
      case 'NEW_PAGE':
      case 'GO_TO_STEP':
      case 'GO_TO_SCREEN':
      case 'SWITCH_SCREEN':
      case 'NAVIGATE_SCREEN':
      case 'GO_TO_PAGE': {
        const stepTabs = document.querySelector('[data-step-tabs="true"]') ||
                         document.querySelector('.step-tabs-container') ||
                         document.querySelector('.app-builder-step-list');
        if (stepTabs) {
          const rect = stepTabs.getBoundingClientRect();
          return { x: rect.left + 150, y: rect.top + 20 };
        }
        return { x: baseLeft + 200, y: Math.max(50, baseTop - 40) };
      }
      default:
        return {
          x: baseLeft + Math.floor(Math.random() * 200 + 100),
          y: baseTop + Math.floor(Math.random() * 200 + 100)
        };
    }
  };

  // Compute Left Pane / Component Palette source position for Drag & Drop
  const getPaletteSourceCoordinates = (cmd) => {
    const leftPane = document.querySelector('[data-left-pane="true"]') ||
                     document.querySelector('.app-builder-left-pane') ||
                     document.querySelector('.component-palette');
    if (leftPane) {
      const rect = leftPane.getBoundingClientRect();
      return {
        x: Math.max(25, rect.left + 65),
        y: Math.min(window.innerHeight - 100, Math.max(140, rect.top + 180 + (Math.random() * 60)))
      };
    }
    // Fallback: Left sidebar area
    return {
      x: 100,
      y: 220 + (Math.random() * 60)
    };
  };

  // Compute Right Pane / Property Inspector position for Setting UI
  const getRightPaneCoordinates = () => {
    const rightPane = document.querySelector('[data-right-pane="true"]') ||
                      document.querySelector('.app-builder-right-pane') ||
                      document.querySelector('[data-sidebar="right"]');
    if (rightPane) {
      const rect = rightPane.getBoundingClientRect();
      return {
        x: Math.min(window.innerWidth - 40, rect.left + 140),
        y: Math.min(window.innerHeight - 100, Math.max(160, rect.top + 220))
      };
    }
    return {
      x: window.innerWidth - 180,
      y: 280
    };
  };

  // Punchy, concise Indonesian voice narration for command
  const getNarrationForCommand = (cmd, index, total) => {
    const p = cmd?.payload || {};
    const type = cmd?.type || '';
    const stepNum = `Langkah ${index + 1}`;

    switch (type) {
      case 'CREATE_WIDGET':
      case 'ADD_WIDGET': {
        const name = p.displayName || p.type || 'komponen';
        const targetStep = p.stepTitle || p.screenTitle || '';
        return targetStep
          ? `${stepNum}: Mengambil dan memasang ${name} ke ${targetStep}.`
          : `${stepNum}: Mengambil dan memasang ${name}.`;
      }
      case 'UPDATE_WIDGET': {
        return `${stepNum}: Mengatur konfigurasi properti ${p.widgetName || 'komponen'}.`;
      }
      case 'CREATE_TRIGGER': {
        return `${stepNum}: Memasang trigger otomasi.`;
      }
      case 'CREATE_TABLE': {
        return `${stepNum}: Membuat tabel database ${p.name || ''}.`;
      }
      case 'CREATE_VARIABLE': {
        return `${stepNum}: Menambahkan variabel ${p.name || ''}.`;
      }
      case 'CREATE_STEP':
      case 'ADD_STEP':
      case 'ADD_SCREEN':
      case 'CREATE_SCREEN':
      case 'NEW_SCREEN':
      case 'ADD_PAGE':
      case 'CREATE_PAGE':
      case 'NEW_PAGE': {
        const title = (typeof p === 'string' ? p : (p.title || p.stepTitle || p.screenTitle || p.name || p.screen || p.page)) || 'layar baru';
        return `${stepNum}: Membuat layar baru "${title}".`;
      }
      case 'GO_TO_STEP':
      case 'GO_TO_SCREEN':
      case 'SWITCH_SCREEN':
      case 'NAVIGATE_SCREEN':
      case 'GO_TO_PAGE': {
        const title = (typeof p === 'string' ? p : (p.stepTitle || p.screenTitle || p.title || p.stepId || p.target || p.screen || p.page)) || 'tujuan';
        return `${stepNum}: Membuka layar "${title}".`;
      }
      default:
        return `${stepNum}: Menjalankan instruksi.`;
    }
  };

  // Main start sequence with Human-like Drag & Drop and UI Settings
  const startRPA = useCallback(async ({
    commands = [],
    planDescription = '',
    onApplyCommand,
    onStageCommand,
    onClearStage,
    onFinish,
    onSnapshot
  }) => {
    if (!commands || commands.length === 0) return;

    if (isExecutingRef.current) {
      console.warn('[GhostPilot] RPA already running, skipping duplicate invocation');
      return;
    }
    isExecutingRef.current = true;

    setIsRunning(true);
    setIsPaused(false);
    isPausedRef.current = false;
    isStoppedRef.current = false;
    setTotalSteps(commands.length);
    setCurrentStepIndex(0);
    setCursorMode('pointer');
    setIsDragging(false);
    setDraggedItem(null);
    setTypingText('');

    if (onSnapshot) {
      try {
        await onSnapshot();
      } catch (e) {
        console.warn('[GhostPilot] Snapshot error:', e);
      }
    }

    try {
      // 1. OPENING BRIEFING
      const cleanOverview = planDescription
        ? cleanSpeechText(planDescription).slice(0, 160)
        : `aplikasi dengan ${commands.length} komponen`;

      const openingNarration = `Halo, saya Mandor App dengan kecerdasan Jarvis. Saya akan merakit ${cleanOverview} secara otomatis dengan pergerakan presisi.`;
      setCurrentActionLabel(`Mandor App: Merancang ${cleanOverview}...`);
      await speakJarvis(openingNarration);
      await waitAsync(450);

      // 2. STEP BY STEP HUMAN EXECUTION
      for (let i = 0; i < commands.length; i++) {
        if (isStoppedRef.current) break;

        while (isPausedRef.current) {
          await waitAsync(200);
          if (isStoppedRef.current) break;
        }

        if (isStoppedRef.current) break;

        const cmd = commands[i];
        const p = cmd?.payload || {};
        setCurrentStepIndex(i + 1);

        const targetPos = getCommandScreenCoordinates(cmd);
        const narration = getNarrationForCommand(cmd, i, commands.length);
        setCurrentActionLabel(narration);

        // Start speech in parallel non-blocking
        const speechPromise = speakJarvis(narration);

        // ─── CASE A: REAL DRAG & DROP FOR WIDGETS ──────────────────────────────
        if (cmd.type === 'ADD_WIDGET' || cmd.type === 'CREATE_WIDGET') {
          const sourcePos = getPaletteSourceCoordinates(cmd);

          // 1. Move to component palette smoothly
          setCursorMode('pointer');
          await moveCursorHuman(sourcePos, { overshoot: true });
          if (isStoppedRef.current) break;

          // 2. Grab component from palette
          setCursorMode('grab');
          await waitAsync(80);
          setIsClicking(true);
          playJarvisStepChime('step');
          setCursorMode('grabbing');
          setIsDragging(true);
          setDraggedItem({
            label: p.displayName || p.name || p.type || 'Widget',
            type: p.type || 'BUTTON'
          });
          await waitAsync(120);
          setIsClicking(false);

          // Stage preview on canvas
          if (onStageCommand) {
            setTimeout(() => {
              if (!isStoppedRef.current) onStageCommand(cmd);
            }, 50);
          }

          // 3. Drag across canvas to target position with natural Bézier arc
          await moveCursorHuman(targetPos, { overshoot: false });
          if (isStoppedRef.current) break;

          // 4. Drop component at target position
          setIsClicking(true);
          playJarvisStepChime('step');
          await waitAsync(110);
          setIsDragging(false);
          setDraggedItem(null);
          setCursorMode('pointer');
          setIsClicking(false);

          // 5. Commit into canvas state
          if (onApplyCommand) {
            try {
              await onApplyCommand(cmd);
            } catch (err) {
              console.error('[GhostPilot] Error executing command:', err);
            }
          }

          if (onClearStage) {
            onClearStage();
          }

        // ─── CASE B: SETTING UI / INSPECTOR PROPS ──────────────────────────────
        } else if (cmd.type === 'UPDATE_WIDGET') {
          // 1. Click widget on canvas to select
          await moveCursorHuman(targetPos, { overshoot: true });
          setIsClicking(true);
          playJarvisStepChime('step');
          await waitAsync(100);
          setIsClicking(false);
          if (isStoppedRef.current) break;

          // 2. Move to Right Pane Inspector
          const rightPanePos = getRightPaneCoordinates();
          await moveCursorHuman(rightPanePos, { overshoot: true });
          setIsClicking(true);
          await waitAsync(90);
          setIsClicking(false);
          if (isStoppedRef.current) break;

          // 3. Simulate human typing of widget property
          setCursorMode('typing');
          const textToType = p.displayName || p.widgetName || p.title || (p.props && (p.props.label || p.props.text)) || 'Aktif';
          await simulateHumanTyping(String(textToType), (accumulated) => {
            setTypingText(accumulated);
          }, {
            speed: speedRef.current || 1,
            isAborted: () => isStoppedRef.current
          });

          await waitAsync(150);
          setCursorMode('pointer');
          setTypingText('');

          // 4. Commit update
          if (onApplyCommand) {
            try {
              await onApplyCommand(cmd);
            } catch (err) {
              console.error('[GhostPilot] Error executing command:', err);
            }
          }

        // ─── CASE C: GENERAL ACTIONS (TRIGGERS, SCREENS, TABLES) ──────────────
        } else {
          await moveCursorHuman(targetPos, { overshoot: true });
          if (isStoppedRef.current) break;

          setIsClicking(true);
          playJarvisStepChime('step');
          const clickMs = Math.max(90, 140 / (speedRef.current || 1));
          await waitAsync(clickMs);
          setIsClicking(false);

          if (onApplyCommand) {
            try {
              await onApplyCommand(cmd);
            } catch (err) {
              console.error('[GhostPilot] Error executing command:', err);
            }
          }

          if (onClearStage) {
            onClearStage();
          }
        }

        // Wait for speech narration to finish naturally
        await speechPromise;

        // Rhythmic human pause between steps
        const pauseMs = Math.max(160, 300 / (speedRef.current || 1));
        await waitAsync(pauseMs);
      }

      // 3. CLOSING CONCLUSION
      if (!isStoppedRef.current) {
        setCurrentStepIndex(commands.length);
        const outroNarration = 'Perakitan aplikasi selesai dengan sukses. Silakan periksa hasilnya di layar.';
        setCurrentActionLabel('✅ Mandor App: Perakitan selesai sepenuhnya.');
        playJarvisStepChime('complete');
        await speakJarvis(outroNarration);
        setShowReviewDialog(true);
        await waitAsync(450);
      } else {
        setCurrentActionLabel('Ghost Pilot dihentikan oleh operator.');
      }
    } finally {
      isExecutingRef.current = false;
      setIsRunning(false);
      setIsPaused(false);
      setIsClicking(false);
      setIsSpeaking(false);
      setIsDragging(false);
      setDraggedItem(null);
      setCursorMode('pointer');
      setTypingText('');
      if (onClearStage) onClearStage();
      if (onFinish) onFinish();
    }
  }, [speakJarvis, waitAsync, moveCursorHuman]);

  const pauseRPA = useCallback(() => {
    setIsPaused(true);
    isPausedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }, []);

  const resumeRPA = useCallback(() => {
    setIsPaused(false);
    isPausedRef.current = false;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, []);

  const stopRPA = useCallback(() => {
    isStoppedRef.current = true;
    isExecutingRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
    setIsSpeaking(false);
    setIsDragging(false);
    setDraggedItem(null);
    setCursorMode('pointer');
    setTypingText('');
    setShowReviewDialog(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && window._jarvisUtterancePool) {
      window._jarvisUtterancePool.clear();
    }
  }, []);

  return {
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
    showReviewDialog,
    setShowReviewDialog,
    isDragging,
    draggedItem,
    cursorMode,
    typingText,
    speakJarvis,
    startRPA,
    pauseRPA,
    resumeRPA,
    stopRPA
  };
}
