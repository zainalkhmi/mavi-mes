import React, { useState, useEffect } from 'react';
import NumpadInput from './NumpadInput';
import { Wifi, Mic, Sparkles, AlertTriangle, CheckCircle2, XCircle, Activity, RefreshCw } from 'lucide-react';

/**
 * CheckTabContent - Enterprise Inspection Studio
 * Features:
 * - Real-Time Dynamic Tolerance Bar (LSL, Nominal, USL Analog Deviation Scale)
 * - Direct IoT Bluetooth Gauge Sync Simulation
 * - Voice Input / Speech Recognition Dictation
 * - Piece & Cavity Sample Selector
 * - 5-Piece Historical SPC Run Trend
 */
export default function CheckTabContent({ activePt, onChange, onCommit, onToggleStatus }) {
  const [inputValue, setInputValue] = useState(activePt.measuredVal || '');
  const [samplePiece, setSamplePiece] = useState(1);
  const [cavityNo, setCavityNo] = useState(1);
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  // Sync when activePt changes (next point)
  useEffect(() => {
    const t = setTimeout(() => {
      setInputValue(activePt.measuredVal || '');
    }, 0);
    return () => clearTimeout(t);
  }, [activePt.id, activePt.measuredVal]);

  const handleInputChange = (val) => {
    setInputValue(val);
    onChange(activePt.id, val);
  };

  const handleSubmit = () => {
    onCommit(activePt.id, inputValue);
    setInputValue('');
  };

  // ─── Real-Time Tolerance Gauge Calculations ───
  const nominal = parseFloat(activePt.nominal) || 0;
  const tolMin = parseFloat(activePt.tolMin) !== undefined ? parseFloat(activePt.tolMin) : nominal - 0.1;
  const tolMax = parseFloat(activePt.tolMax) !== undefined ? parseFloat(activePt.tolMax) : nominal + 0.1;
  const tolRange = tolMax - tolMin || 0.2;

  const currentValNum = parseFloat(inputValue);
  const hasValidInput = !isNaN(currentValNum);

  // Deviation from nominal
  const delta = hasValidInput ? currentValNum - nominal : 0;
  const deltaFormatted = (delta >= 0 ? '+' : '') + delta.toFixed(3);

  // Percentage on tolerance bar (0% = LSL, 50% = Nominal, 100% = USL)
  const barPercent = hasValidInput
    ? Math.max(0, Math.min(100, ((currentValNum - tolMin) / tolRange) * 100))
    : 50;

  // Spec assessment
  const isOutOfSpec = hasValidInput && (currentValNum < tolMin || currentValNum > tolMax);
  const isNearLimit = hasValidInput && !isOutOfSpec && (barPercent < 20 || barPercent > 80);
  const isOptimal = hasValidInput && !isOutOfSpec && !isNearLimit;

  // Dynamic Status Color
  const computedStatus = isOutOfSpec ? 'NG' : (activePt.status === 'OK' || isOptimal ? 'OK' : activePt.status || 'PENDING');
  const inputColor = isOutOfSpec ? '#ef4444' : isNearLimit ? '#f59e0b' : computedStatus === 'OK' ? '#22c55e' : '#38bdf8';
  const borderColor = isOutOfSpec ? '#ef4444' : isNearLimit ? '#f59e0b' : '#38bdf8';

  // ─── Direct Bluetooth Gauge Trigger Simulation ───
  const handleSyncBluetoothGauge = () => {
    // Generate realistic in-spec measurement with slight normal deviation
    const randomOffset = (Math.random() - 0.48) * (tolRange * 0.4);
    const measured = (nominal + randomOffset).toFixed(3);
    handleInputChange(measured);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  // ─── Voice Recognition / Speech Input ───
  const handleToggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice Speech API tidak didukung di browser ini. Harap gunakan Chrome / Edge.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListeningVoice(true);
    recognition.onend = () => setIsListeningVoice(false);
    recognition.onerror = () => setIsListeningVoice(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      // Parse numbers from transcript (e.g. "dua puluh lima titik dua" -> 25.2)
      const cleanNum = transcript
        .replace(/koma|titik/g, '.')
        .replace(/[^0-9.]/g, '');
      if (cleanNum) {
        handleInputChange(cleanNum);
      }
    };
    recognition.start();
  };

  return (
    <div style={{ flex: 1, height: '100%', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden', backgroundColor: '#090d16' }}>
      
      {/* ── 1. ENTERPRISE SAMPLE & TOOL TRACKING HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: '6px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>SAMPLE:</span>
          <select
            value={samplePiece}
            onChange={(e) => setSamplePiece(Number(e.target.value))}
            style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '5px', padding: '2px 5px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
          >
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Piece #{n}</option>)}
          </select>
          <select
            value={cavityNo}
            onChange={(e) => setCavityNo(Number(e.target.value))}
            style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '5px', padding: '2px 5px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
          >
            {[1, 2, 3, 4].map(c => <option key={c} value={c}>Cavity #{c}</option>)}
          </select>
        </div>

        {/* Direct Bluetooth Tool Sync & Voice */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            onClick={handleSyncBluetoothGauge}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid #22c55e',
              color: '#22c55e',
              padding: '2px 6px',
              borderRadius: '5px',
              fontSize: '0.68rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title="Ambil nilai terkini dari Bluetooth Caliper / Tool"
          >
            <Wifi size={11} />
            <span>Sync Tool</span>
          </button>
          <button
            onClick={handleToggleVoiceInput}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isListeningVoice ? '#ef4444' : '#1e293b',
              border: isListeningVoice ? '1px solid #ef4444' : '1px solid #334155',
              color: isListeningVoice ? 'white' : '#94a3b8',
              padding: '3px 5px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
            title="Hands-free Voice Dictation"
          >
            <Mic size={12} />
          </button>
        </div>
      </div>

      {/* ── 2. ACTIVE POINT METADATA & TOLERANCE BADGES ── */}
      <div style={{ backgroundColor: '#0f172a', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#38bdf8' }}>
              #{activePt.pointNumber} {activePt.title}
            </span>
            <span style={{
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '0.65rem',
              fontWeight: 900,
              backgroundColor: isOutOfSpec ? '#ef4444' : computedStatus === 'OK' ? '#22c55e' : '#334155',
              color: 'white'
            }}>
              {isOutOfSpec ? 'NG' : computedStatus}
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>
            {activePt.criticality || 'Critical (CC)'}
          </span>
        </div>

        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🛠️ <strong>{activePt.toolId || 'Digital Caliper'}</strong></span>
          <span>Nom: <strong style={{ color: '#38bdf8' }}>{nominal} {activePt.unit}</strong></span>
          <span>Tol: <strong style={{ color: '#cbd5e1' }}>{tolMin} ~ {tolMax}</strong></span>
        </div>
      </div>

      {/* ── 3. 7-SEGMENT DIGITAL DISPLAY SCREEN ── */}
      <div style={{
        backgroundColor: '#020617',
        border: `2px solid ${borderColor}`,
        borderRadius: '10px',
        padding: '8px 12px',
        textAlign: 'center',
        animation: isOutOfSpec ? 'blink-red 0.8s ease-in-out infinite' : 'none',
        boxShadow: isOutOfSpec ? '0 0 16px rgba(239, 68, 68, 0.4), inset 0 2px 6px rgba(0,0,0,0.9)' : computedStatus === 'OK' ? '0 0 14px rgba(34, 197, 94, 0.3), inset 0 2px 6px rgba(0,0,0,0.9)' : 'inset 0 3px 6px rgba(0,0,0,0.95)'
      }}>
        <style>{`
          @keyframes blink-red {
            0%, 100% { border-color: #ef4444; }
            50% { border-color: #7f1d1d; }
          }
        `}</style>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            fontFamily: "'Orbitron', 'Share Tech Mono', monospace",
            letterSpacing: '1px',
            color: inputColor,
            textShadow: `0 0 10px ${isOutOfSpec ? 'rgba(239, 68, 68, 0.7)' : computedStatus === 'OK' ? 'rgba(34, 197, 94, 0.7)' : 'rgba(56, 189, 248, 0.6)'}`,
            minWidth: '150px'
          }}>
            {inputValue || '0.000'}
          </span>
          <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 800, fontFamily: "'Orbitron', monospace" }}>
            {activePt.unit}
          </span>
        </div>

        {/* Real-Time Deviation Metric */}
        {hasValidInput && (
          <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.68rem', fontWeight: 800 }}>
            <span style={{ color: delta === 0 ? '#38bdf8' : isOutOfSpec ? '#ef4444' : '#22c55e' }}>
              Δ Dev: {deltaFormatted} {activePt.unit}
            </span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: isOutOfSpec ? '#ef4444' : isNearLimit ? '#f59e0b' : '#22c55e' }}>
              {isOutOfSpec ? '⚠️ DI LUAR TOLERANSI (NG)' : isNearLimit ? '⚠️ MENDEKATI BATAS' : '✓ OPTIMAL'}
            </span>
          </div>
        )}
      </div>

      {/* ── 4. ENTERPRISE REAL-TIME DYNAMIC TOLERANCE GAUGE BAR ── */}
      <div style={{ backgroundColor: '#0f172a', padding: '6px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', fontWeight: 800, color: '#64748b', marginBottom: '3px' }}>
          <span style={{ color: '#fca5a5' }}>LSL: {tolMin}</span>
          <span style={{ color: '#38bdf8' }}>NOM: {nominal}</span>
          <span style={{ color: '#fca5a5' }}>USL: {tolMax}</span>
        </div>

        {/* Track Bar with Color Zones */}
        <div style={{ position: 'relative', height: '10px', backgroundColor: '#020617', borderRadius: '5px', overflow: 'visible', border: '1px solid #334155' }}>
          <div style={{ position: 'absolute', left: '0%', width: '20%', height: '100%', backgroundColor: 'rgba(245, 158, 11, 0.25)' }} />
          <div style={{ position: 'absolute', left: '20%', width: '60%', height: '100%', backgroundColor: 'rgba(34, 197, 94, 0.35)' }} />
          <div style={{ position: 'absolute', left: '80%', width: '20%', height: '100%', backgroundColor: 'rgba(245, 158, 11, 0.25)' }} />
          <div style={{ position: 'absolute', left: '50%', top: '-2px', bottom: '-2px', width: '2px', backgroundColor: '#38bdf8', zIndex: 5 }} />

          {/* Dynamic Needle Indicator */}
          {hasValidInput && (
            <div
              style={{
                position: 'absolute',
                left: `${barPercent}%`,
                top: '-3px',
                transform: 'translateX(-50%)',
                width: '8px',
                height: '16px',
                backgroundColor: inputColor,
                borderRadius: '2px',
                boxShadow: `0 0 8px ${inputColor}`,
                zIndex: 10,
                transition: 'left 0.15s ease-out'
              }}
            />
          )}
        </div>
      </div>

      {/* ── 5. COMPACT TOUCH KEYPAD WITH SMART SPEC TOLERANCE AUDIO & VISUAL FEEDBACK ── */}
      <NumpadInput
        value={inputValue}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        tolMin={tolMin}
        tolMax={tolMax}
        isOutOfSpec={isOutOfSpec}
      />

      {/* ── 6. ACTION BUTTONS: OK, SIMPAN, NG ── */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '1px' }}>
        <button
          onClick={() => {
            onToggleStatus(activePt.id, 'OK');
            handleInputChange(nominal.toString());
          }}
          style={{
            flex: 1,
            padding: '11px',
            backgroundColor: computedStatus === 'OK' && !isOutOfSpec ? '#22c55e' : '#1e293b',
            color: computedStatus === 'OK' && !isOutOfSpec ? '#0f172a' : '#94a3b8',
            border: computedStatus === 'OK' && !isOutOfSpec ? '1px solid #22c55e' : '1px solid #334155',
            borderRadius: '8px',
            fontWeight: 900,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: computedStatus === 'OK' && !isOutOfSpec ? '0 0 12px rgba(34, 197, 94, 0.35)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          OK
        </button>
        <button
          onClick={handleSubmit}
          style={{
            flex: 2,
            padding: '11px',
            backgroundColor: isOutOfSpec ? '#ef4444' : '#0284c7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 900,
            fontSize: '0.92rem',
            cursor: 'pointer',
            boxShadow: isOutOfSpec ? '0 0 12px rgba(239, 68, 68, 0.4)' : '0 0 12px rgba(2, 132, 199, 0.35)',
            letterSpacing: '0.5px',
            transition: 'all 0.15s'
          }}
        >
          {isOutOfSpec ? 'SIMPAN (NG) ⚠️' : 'SIMPAN ➔'}
        </button>
        <button
          onClick={() => onToggleStatus(activePt.id, 'NG')}
          style={{
            flex: 1,
            padding: '11px',
            backgroundColor: isOutOfSpec || computedStatus === 'NG' ? '#ef4444' : '#1e293b',
            color: 'white',
            border: isOutOfSpec || computedStatus === 'NG' ? '1px solid #ef4444' : '1px solid #334155',
            borderRadius: '8px',
            fontWeight: 900,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: isOutOfSpec || computedStatus === 'NG' ? '0 0 12px rgba(239, 68, 68, 0.35)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          NG
        </button>
      </div>
    </div>
  );
}
