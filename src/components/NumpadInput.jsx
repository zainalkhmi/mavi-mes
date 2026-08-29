import React, { useState, useCallback } from 'react';

// 1. In-Spec Crisp Tactile Click Sound Synthesizer
const playTactileKeypadSound = (key) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const isBack = key === 'back';
    const isDot = key === '.';

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isBack ? 1200 : isDot ? 2400 : 2200, now);
    filter.Q.setValueAtTime(3, now);

    const startFreq = isBack ? 520 : isDot ? 1450 : 1250;
    const endFreq = isBack ? 180 : isDot ? 650 : 450;
    const duration = isBack ? 0.04 : 0.03;

    osc.type = isBack ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  } catch (err) {}
};

// 2. Out-of-Spec Warning Buzzer / Alert Sound Synthesizer (NG Alarm)
const playWarningBuzzerSound = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Dual-tone abrasive warning buzzer
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    // Discordant alarm interval (280Hz & 350Hz)
    osc1.frequency.setValueAtTime(310, now);
    osc1.frequency.setValueAtTime(260, now + 0.06);
    osc2.frequency.setValueAtTime(370, now);
    osc2.frequency.setValueAtTime(320, now + 0.06);

    gainNode.gain.setValueAtTime(0.35, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.16);
    osc2.stop(now + 0.16);
  } catch (err) {}
};

/**
 * NumpadInput - Smart In-Spec (Green Click) & Out-of-Spec (Red Buzzer) Numpad
 */
export default function NumpadInput({
  value,
  onChange,
  onSubmit,
  tolMin,
  tolMax,
  isOutOfSpec = false
}) {
  const [pressedKey, setPressedKey] = useState(null);
  const [wasOutSpecOnPress, setWasOutSpecOnPress] = useState(false);

  const handleKey = useCallback((key) => {
    // 1. Calculate prospective value
    let nextVal = value;
    if (key === 'back') {
      nextVal = value.slice(0, -1);
    } else if (key === '.') {
      if (!value.includes('.')) nextVal = value + '.';
    } else {
      nextVal = value + key;
    }

    const nextNum = parseFloat(nextVal);
    const hasSpecLimits = tolMin !== undefined && tolMax !== undefined;
    const isNextOutOfSpec = !isNaN(nextNum) && hasSpecLimits && (nextNum < tolMin || nextNum > tolMax);

    setWasOutSpecOnPress(isNextOutOfSpec);
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 180);

    // 2. Play distinct audio & haptics based on tolerance specification
    if (isNextOutOfSpec) {
      playWarningBuzzerSound();
      if (navigator.vibrate) {
        navigator.vibrate([60, 40, 60]); // Warning double vibration
      }
    } else {
      playTactileKeypadSound(key);
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }
    }

    // 3. Commit state change
    onChange(nextVal);
  }, [value, onChange, tolMin, tolMax]);

  const getBtnStyle = (key, customBg = null, customBorder = null, customColor = null, customFontSize = null) => {
    const isPressed = pressedKey === key;
    const activeIsNG = wasOutSpecOnPress || isOutOfSpec;

    // Glowing Green when In-Spec, Glowing Crimson Red when Out-of-Spec
    const pressBg = activeIsNG ? '#ef4444' : '#22c55e';
    const pressBorder = activeIsNG ? '2px solid #fca5a5' : '2px solid #86efac';
    const pressColor = activeIsNG ? '#ffffff' : '#052e16';
    const pressShadow = activeIsNG
      ? '0 0 28px rgba(239, 68, 68, 0.95), inset 0 0 12px rgba(255, 255, 255, 0.6)'
      : '0 0 24px rgba(34, 197, 94, 0.95), inset 0 0 12px rgba(255, 255, 255, 0.6)';

    return {
      height: '100%',
      minHeight: '52px',
      backgroundColor: isPressed ? pressBg : (customBg || '#1e293b'),
      border: isPressed ? pressBorder : (customBorder || '1.5px solid #334155'),
      borderRadius: '10px',
      color: isPressed ? pressColor : (customColor || '#f8fafc'),
      fontSize: customFontSize || '2.4rem',
      fontWeight: 900,
      cursor: 'pointer',
      fontFamily: "'Orbitron', 'Share Tech Mono', monospace",
      boxShadow: isPressed ? pressShadow : '0 4px 10px rgba(0,0,0,0.35)',
      transform: isPressed ? 'scale(0.95)' : 'scale(1)',
      transition: 'all 0.08s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent'
    };
  };

  return (
    <div style={{
      backgroundColor: '#090d16',
      borderRadius: '12px',
      padding: '8px',
      border: `1.5px solid ${isOutOfSpec ? 'rgba(239, 68, 68, 0.5)' : '#1e293b'}`,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.2s'
    }}>
      {/* 4x3 Grid - Auto Height to Fill Available Space */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
        gap: '6px',
        flex: 1
      }}>
        {['7', '8', '9'].map(n => (
          <button
            key={n}
            onClick={() => handleKey(n)}
            onMouseDown={(e) => { e.preventDefault(); }}
            style={getBtnStyle(n)}
          >
            {n}
          </button>
        ))}

        {['4', '5', '6'].map(n => (
          <button
            key={n}
            onClick={() => handleKey(n)}
            onMouseDown={(e) => { e.preventDefault(); }}
            style={getBtnStyle(n)}
          >
            {n}
          </button>
        ))}

        {['1', '2', '3'].map(n => (
          <button
            key={n}
            onClick={() => handleKey(n)}
            onMouseDown={(e) => { e.preventDefault(); }}
            style={getBtnStyle(n)}
          >
            {n}
          </button>
        ))}

        {/* Bottom Row: . 0 Back */}
        <button
          onClick={() => handleKey('.')}
          onMouseDown={(e) => { e.preventDefault(); }}
          style={{
            ...getBtnStyle('.', '#334155', '1.5px solid #475569', '#f8fafc', '2.8rem'),
            lineHeight: 0.5,
            paddingBottom: '8px'
          }}
        >
          .
        </button>

        <button
          onClick={() => handleKey('0')}
          onMouseDown={(e) => { e.preventDefault(); }}
          style={getBtnStyle('0')}
        >
          0
        </button>

        <button
          onClick={() => handleKey('back')}
          onMouseDown={(e) => { e.preventDefault(); }}
          style={getBtnStyle('back', 'rgba(239, 68, 68, 0.2)', '1.5px solid #ef4444', '#ef4444', '1.85rem')}
          title="Hapus Digit Terakhir"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
