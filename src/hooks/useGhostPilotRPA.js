import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useGhostPilotRPA
 * Autonomous RPA Controller for MaviCore AppBuilder.
 * Manages step-by-step visual execution, TTS voice narration (Jarvis),
 * ghost cursor gliding, and click/type simulation.
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

  const isPausedRef = useRef(false);
  const isStoppedRef = useRef(false);
  const isExecutingRef = useRef(false); // Prevents duplicate execution
  const speedRef = useRef(1);
  const voiceEnabledRef = useRef(true);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  // Web Audio Synthesizer Chime for instant audible feedback on every step
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
      // Audio context blocked or unavailable
    }
  };

  // Helper to get Indonesian voice with fallbacks
  const getIndonesianVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Indonesian voice
    const idVoice = voices.find(v => {
      const lang = (v.lang || '').toLowerCase();
      const name = (v.name || '').toLowerCase();
      return lang.includes('id') || lang.includes('ind') || name.includes('indonesia');
    });
    if (idVoice) return idVoice;

    // 2. Natural voice fallback
    const naturalVoice = voices.find(v => (v.name || '').toLowerCase().includes('natural'));
    if (naturalVoice) return naturalVoice;

    // 3. Google voice fallback
    const googleVoice = voices.find(v => (v.name || '').toLowerCase().includes('google'));
    if (googleVoice) return googleVoice;

    // 4. Default voice
    const defaultVoice = voices.find(v => v.default);
    return defaultVoice || voices[0] || null;
  };

  // Initialize voices cache
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

  // Speak with Indonesian voice & guarantee speech on every step
  const speakJarvis = useCallback((text) => {
    return new Promise((resolve) => {
      if (!voiceEnabledRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return resolve();
      }

      try {
        // Instant audio chime on every step for crisp feedback
        playJarvisStepChime('step');

        const clean = cleanSpeechText(text);
        if (!clean) return resolve();

        // Prevent Chromium GC bug: retain utterance in global Set
        if (!window._jarvisUtterancePool) {
          window._jarvisUtterancePool = new Set();
        }

        // Cancel previous speech cleanly
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

        // Chromium watchdog: keep speech alive if pause bug occurs
        resumeInterval = setInterval(() => {
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          }
        }, 1500);

        // Safety timeout so execution never hangs
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

        // Small timeout before speak to let cancel() settle in Chromium
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

  // Compute screen coordinates for a command
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
      case 'ADD_WIDGET': {
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
          ? `${stepNum}: Menambahkan ${name} ke ${targetStep}.`
          : `${stepNum}: Menambahkan ${name}.`;
      }
      case 'UPDATE_WIDGET': {
        return `${stepNum}: Mengatur konfigurasi ${p.widgetName || 'komponen'}.`;
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

  // Sleep utility with pause/stop checking
  const waitAsync = (ms) => {
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
          setTimeout(check, 50);
        }
      };

      setTimeout(check, Math.min(50, adjustedMs));
    });
  };

  // Main start sequence
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

    // Guard: Prevent duplicate overlapping execution
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

    // Initial snapshot if callback provided
    if (onSnapshot) {
      try {
        await onSnapshot();
      } catch (e) {
        console.warn('[GhostPilot] Snapshot error:', e);
      }
    }

    try {
      // 1. OPENING BRIEFING: Introduce Mandor App & explain what app is being built
      const cleanOverview = planDescription
        ? cleanSpeechText(planDescription).slice(0, 160)
        : `aplikasi dengan ${commands.length} komponen`;

      const openingNarration = `Halo, perkenalkan saya Mandor App, siap membantu Anda membuat aplikasi. Saya akan merancang ${cleanOverview}. Memulai perakitan dalam ${commands.length} langkah.`;
      setCurrentActionLabel(`Mandor App: Halo! Merancang ${cleanOverview}...`);
      await speakJarvis(openingNarration);
      await waitAsync(450);

      // 2. STEP BY STEP VISUAL & VOICE COORDINATION
      for (let i = 0; i < commands.length; i++) {
        if (isStoppedRef.current) break;

        while (isPausedRef.current) {
          await waitAsync(200);
          if (isStoppedRef.current) break;
        }

        if (isStoppedRef.current) break;

        const cmd = commands[i];
        setCurrentStepIndex(i + 1);

        const targetPos = getCommandScreenCoordinates(cmd);
        const narration = getNarrationForCommand(cmd, i, commands.length);
        setCurrentActionLabel(narration);

        // 1. Move Ghost Cursor smoothly towards target
        setCursorPos(targetPos);

        // 2. Stage ghost preview after cursor starts moving
        if (onStageCommand) {
          setTimeout(() => {
            if (!isStoppedRef.current) onStageCommand(cmd);
          }, 100);
        }

        // 3. Start speech narration in parallel non-blocking promise
        const speechPromise = speakJarvis(narration);

        // 4. Wait for cursor glide duration to arrive precisely at target
        const glideMs = Math.max(220, 450 / (speedRef.current || 1));
        await waitAsync(glideMs);
        if (isStoppedRef.current) break;

        // 5. Visual click simulation at target destination
        setIsClicking(true);
        const clickMs = Math.max(100, 160 / (speedRef.current || 1));
        await waitAsync(clickMs);
        setIsClicking(false);
        if (isStoppedRef.current) break;

        // 6. COMMIT VISUAL ACTION FULLY & AWAIT IT TO SETTLE STATE (Prevents race conditions / missed widgets)
        if (onApplyCommand) {
          try {
            await onApplyCommand(cmd);
          } catch (err) {
            console.error('[GhostPilot] Error executing command:', err);
          }
        }

        // 7. Clear ghost stage preview
        if (onClearStage) {
          onClearStage();
        }

        // 8. Wait for Jarvis speech narration to finish naturally before proceeding
        await speechPromise;

        // 9. Rhythmic pause between steps before advancing to the next command
        const pauseMs = Math.max(180, 350 / (speedRef.current || 1));
        await waitAsync(pauseMs);
      }

      // 3. CLOSING CONCLUSION: Ask user confirmation whether app is OK or needs review
      if (!isStoppedRef.current) {
        setCurrentStepIndex(commands.length);
        const outroNarration = 'Perakitan aplikasi telah selesai sepenuhnya. Apakah aplikasi yang saya buat sudah sesuai, atau ada bagian yang perlu direvisi?';
        setCurrentActionLabel('✅ Mandor App: Apakah aplikasi sudah sesuai atau ada revisi?');
        playJarvisStepChime('complete');
        await speakJarvis(outroNarration);
        setShowReviewDialog(true);
        await waitAsync(500);
      } else {
        setCurrentActionLabel('Ghost Pilot dihentikan oleh operator.');
      }
    } finally {
      // Cleanup
      isExecutingRef.current = false;
      setIsRunning(false);
      setIsPaused(false);
      setIsClicking(false);
      setIsSpeaking(false);
      if (onClearStage) onClearStage();
      if (onFinish) onFinish();
    }
  }, [speakJarvis]);

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
    speakJarvis,
    startRPA,
    pauseRPA,
    resumeRPA,
    stopRPA
  };
}
