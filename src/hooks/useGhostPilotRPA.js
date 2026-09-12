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

  // Speak with Indonesian voice if available
  const speakJarvis = useCallback((text) => {
    return new Promise((resolve) => {
      if (!voiceEnabledRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return resolve();
      }

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const clean = cleanSpeechText(text);
        if (!clean) return resolve();

        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = speedRef.current === 2 ? 1.3 : speedRef.current === 4 ? 1.6 : 1.1;
        utterance.pitch = 1.0;

        // Try to pick an Indonesian voice
        const voices = window.speechSynthesis.getVoices();
        const idVoice = voices.find(v => v.lang && (v.lang.toLowerCase().includes('id') || v.lang.toLowerCase().includes('ind')));
        if (idVoice) {
          utterance.voice = idVoice;
        }

        setIsSpeaking(true);

        let finished = false;
        const complete = () => {
          if (!finished) {
            finished = true;
            setIsSpeaking(false);
            resolve();
          }
        };

        // Generous timeout watchdog: only fires if browser fails to trigger onend
        const safetyTimeoutMs = Math.max(6000, clean.length * 130 + 4000);
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

        window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
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
      case 'ADD_STEP':
      case 'GO_TO_STEP': {
        return { x: baseLeft + 200, y: baseTop - 40 };
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
      case 'ADD_WIDGET': {
        const name = p.displayName || p.type || 'komponen';
        return `${stepNum}: Menambahkan ${name}.`;
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
      case 'ADD_STEP': {
        return `${stepNum}: Membuat layar baru.`;
      }
      case 'GO_TO_STEP': {
        return `${stepNum}: Membuka layar tujuan.`;
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

        // Move Ghost Cursor smoothly towards target
        setCursorPos(targetPos);

        // Stage ghost preview
        if (onStageCommand) {
          setTimeout(() => {
            if (!isStoppedRef.current) onStageCommand(cmd);
          }, 150);
        }

        // Commit visual action precisely when cursor arrives at destination
        let actionExecuted = false;
        const executeVisualAction = async () => {
          if (actionExecuted || isStoppedRef.current) return;
          actionExecuted = true;

          setIsClicking(true);
          await waitAsync(200);
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
        };

        const actionTimer = setTimeout(executeVisualAction, Math.max(350, 600 / (speedRef.current || 1)));

        // Await speech narration to complete naturally
        await speakJarvis(narration);
        clearTimeout(actionTimer);

        // Ensure action execution is finished
        await executeVisualAction();

        // Rhythmic pause between steps
        await waitAsync(400);
      }

      // 3. CLOSING CONCLUSION: Ask user confirmation whether app is OK or needs review
      if (!isStoppedRef.current) {
        setCurrentStepIndex(commands.length);
        const outroNarration = 'Perakitan aplikasi telah selesai sepenuhnya. Apakah aplikasi yang saya buat sudah sesuai, atau ada bagian yang perlu direvisi?';
        setCurrentActionLabel('✅ Mandor App: Apakah aplikasi sudah sesuai atau ada revisi?');
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
    setShowReviewDialog(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
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
