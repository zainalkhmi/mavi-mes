import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Keyboard, AlertCircle, Gamepad } from 'lucide-react';

const GLOBAL_ROUTES = [
  '/', 
  '/tables', 
  '/stations', 
  '/vision', 
  '/plc-settings',
  '/help',
  '/voice-inspection'
];

const DEFAULT_MAPPINGS = [
  { action: 'nextStep', btnIdx: 0 },    // Cross ➔ Halaman Selanjutnya
  { action: 'prevStep', btnIdx: 2 },    // Square ➔ Halaman Sebelumnya
  { action: 'toggleMic', btnIdx: 3 },   // Triangle ➔ On/Off Mic
  { action: 'resetForm', btnIdx: 1 },   // Circle ➔ Kosongkan Input
  { action: 'passStatus', btnIdx: 6 },  // L2 ➔ Set PASS
  { action: 'failStatus', btnIdx: 7 },  // R2 ➔ Set FAIL
  { action: 'focusNext', btnIdx: 5 },   // R1 ➔ Sibling Input Kanan
  { action: 'focusPrev', btnIdx: 4 }    // L1 ➔ Sibling Input Kiri
];

export default function GlobalVoiceAssistant() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activeInputType, setActiveInputType] = useState(null);
  const [gamepadConnected, setGamepadConnected] = useState(false);
  
  const recognitionRef = useRef(null);
  const gamepadLastPressed = useRef({});

  // 1. Monitor active element focus
  useEffect(() => {
    const checkActiveElement = () => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
        setActiveInputType(el.placeholder || el.name || el.tagName.toLowerCase());
      } else {
        setActiveInputType(null);
      }
    };

    document.addEventListener('focusin', checkActiveElement);
    document.addEventListener('focusout', checkActiveElement);
    return () => {
      document.removeEventListener('focusin', checkActiveElement);
      document.removeEventListener('focusout', checkActiveElement);
    };
  }, []);

  // 2. Global Gamepad Polling Loop
  useEffect(() => {
    let animationFrameId = null;

    const handleConnect = () => setGamepadConnected(true);
    const handleDisconnect = () => setGamepadConnected(false);

    window.addEventListener("gamepadconnected", handleConnect);
    window.addEventListener("gamepaddisconnected", handleDisconnect);

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0] || gamepads.find(g => g !== null);

      if (gp) {
        if (!gamepadConnected) setGamepadConnected(true);

        // Load custom user mappings from localStorage
        let bindings = DEFAULT_MAPPINGS;
        try {
          const saved = localStorage.getItem('mandor_gamepad_bindings');
          if (saved) bindings = JSON.parse(saved);
        } catch(e) {}

        const buttons = gp.buttons;

        // Loop custom mappings list
        bindings.forEach(({ action, btnIdx }) => {
          const btn = buttons[btnIdx];
          if (btn && btn.pressed) {
            if (!gamepadLastPressed.current[action]) {
              executeGlobalGamepadAction(action);
            }
            gamepadLastPressed.current[action] = true;
          } else {
            gamepadLastPressed.current[action] = false;
          }
        });
      }

      animationFrameId = requestAnimationFrame(pollGamepad);
    };

    pollGamepad();

    return () => {
      window.removeEventListener("gamepadconnected", handleConnect);
      window.removeEventListener("gamepaddisconnected", handleDisconnect);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gamepadConnected, location]); // Rebind location change to execute route index calculations correctly

  // Execute global gamepad actions
  const executeGlobalGamepadAction = (action) => {
    const activeEl = document.activeElement;

    switch (action) {
      case 'toggleMic':
        setIsListening(prev => !prev);
        break;

      case 'focusNext':
        focusSiblingInput(1);
        break;

      case 'focusPrev':
        focusSiblingInput(-1);
        break;

      case 'resetForm':
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          updateInputElementValue(activeEl, '');
        }
        break;

      case 'passStatus':
        if (activeEl && (activeEl.tagName === 'SELECT' || activeEl.tagName === 'INPUT')) {
          const hasPass = activeEl.tagName === 'SELECT' 
            ? Array.from(activeEl.options).some(opt => opt.value === 'PASS')
            : true;
          if (hasPass) {
            updateInputElementValue(activeEl, 'PASS');
          }
        }
        break;

      case 'failStatus':
        if (activeEl && (activeEl.tagName === 'SELECT' || activeEl.tagName === 'INPUT')) {
          const hasFail = activeEl.tagName === 'SELECT' 
            ? Array.from(activeEl.options).some(opt => opt.value === 'FAIL')
            : true;
          if (hasFail) {
            updateInputElementValue(activeEl, 'FAIL');
          }
        }
        break;

      case 'nextStep': {
        // Actual Router navigation: cycle forward in GLOBAL_ROUTES
        const currentIdx = GLOBAL_ROUTES.indexOf(location.pathname);
        const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % GLOBAL_ROUTES.length;
        navigate(GLOBAL_ROUTES[nextIdx]);
        break;
      }

      case 'prevStep': {
        // Actual Router navigation: cycle backward in GLOBAL_ROUTES
        const currentIdx = GLOBAL_ROUTES.indexOf(location.pathname);
        const prevIdx = currentIdx === -1 ? 0 : (currentIdx - 1 < 0 ? GLOBAL_ROUTES.length - 1 : currentIdx - 1);
        navigate(GLOBAL_ROUTES[prevIdx]);
        break;
      }

      default:
        break;
    }
  };

  // Helper to focus next or previous input element in document
  const focusSiblingInput = (dir) => {
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'));
    if (inputs.length === 0) return;

    const activeEl = document.activeElement;
    const currentIndex = inputs.indexOf(activeEl);
    let nextIndex = currentIndex + dir;

    if (nextIndex >= inputs.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = inputs.length - 1;

    inputs[nextIndex].focus();
  };

  // 3. Global Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const savedLang = localStorage.getItem('mandor_voice_language') || 'id-ID';

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = savedLang;

    rec.onresult = (event) => {
      const resultIndex = event.results.length - 1;
      const text = event.results[resultIndex][0].transcript;
      setTranscript(text);

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        const textToInsert = text.trim();
        const lowerText = textToInsert.toLowerCase();

        if (lowerText === 'hapus semua' || lowerText === 'clear all') {
          updateInputElementValue(activeEl, '');
          return;
        }

        if (lowerText === 'enter' || lowerText === 'kirim') {
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
          });
          activeEl.dispatchEvent(enterEvent);
          return;
        }

        const start = activeEl.selectionStart || 0;
        const end = activeEl.selectionEnd || 0;
        const currentVal = activeEl.value;

        const spacing = (start > 0 && currentVal.charAt(start - 1) !== ' ') ? ' ' : '';
        const newVal = currentVal.substring(0, start) + spacing + textToInsert + currentVal.substring(end);
        
        updateInputElementValue(activeEl, newVal);

        setTimeout(() => {
          activeEl.selectionStart = activeEl.selectionEnd = start + spacing.length + textToInsert.length;
        }, 10);
      }
    };

    rec.onend = () => {
      if (isListening) {
        try { rec.start(); } catch(e) {}
      }
    };

    recognitionRef.current = rec;

    if (isListening) {
      try { rec.start(); } catch(e) {}
    } else {
      try { rec.stop(); } catch(e) {}
    }

    return () => {
      try { rec.stop(); } catch(e) {}
    };
  }, [isListening]);

  // Helper to trigger React state updates
  const updateInputElementValue = (element, value) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    const setter = element.tagName === 'TEXTAREA' ? nativeTextAreaValueSetter : nativeInputValueSetter;
    
    if (setter) {
      setter.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const toggleListening = () => {
    setIsListening(prev => !prev);
    if (!isListening) {
      setTranscript('Mendengarkan suara...');
    } else {
      setTranscript('');
    }
  };

  return null;
}

const styles = {
  floatingWrapper: {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    zIndex: 999999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '12px',
    fontFamily: 'system-ui, sans-serif',
  },
  fabContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  fab: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  },
  gamepadFabIndicator: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#0f172a',
    border: '2px solid #10b981',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
  },
  micIconContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waves: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    width: '38px',
    height: '38px',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '50%',
    animation: 'soundwave 1.5s infinite ease-in-out',
  },
  transcriptBubble: {
    background: 'rgba(15, 23, 42, 0.92)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '14px 18px',
    width: '260px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
    position: 'relative',
    color: '#f8fafc',
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: '-6px',
    left: '20px',
    width: '12px',
    height: '12px',
    background: 'rgba(15, 23, 42, 0.92)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    transform: 'rotate(45deg)',
  },
  bubbleHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '8px',
    marginBottom: '8px',
  },
  bubbleTitle: {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: '#60a5fa',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  activeFieldBadge: {
    fontSize: '0.65rem',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '2px 8px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    maxWidth: 'fit-content',
  },
  noFieldBadge: {
    fontSize: '0.65rem',
    color: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: '2px 8px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    maxWidth: 'fit-content',
  },
  bubbleText: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#cbd5e1',
    lineHeight: '1.4',
  }
};
