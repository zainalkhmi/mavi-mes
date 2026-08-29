import React, { useState, useEffect } from 'react';
import NumpadInput from './NumpadInput';

/**
 * CheckTabContent - Handles input state sync between display and numpad
 */
export default function CheckTabContent({ activePt, onChange, onCommit, onToggleStatus }) {
  const [inputValue, setInputValue] = useState(activePt.measuredVal || '');

  // Sync when activePt changes (next point)
  useEffect(() => {
    setInputValue(activePt.measuredVal || '');
  }, [activePt.id, activePt.measuredVal]);

  const handleInputChange = (val) => {
    setInputValue(val);
    onChange(activePt.id, val);
  };

  const handleSubmit = () => {
    onCommit(activePt.id, inputValue);
    // Move to next point
    setInputValue('');
  };

  // Determine color based on status
  const inputColor = activePt.status === 'NG' ? '#ef4444' : activePt.status === 'OK' ? '#22c55e' : '#38bdf8';
  const borderColor = activePt.status === 'NG' ? '#ef4444' : '#38bdf8';

  return (
    <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
      {/* Title & Point Info Header */}
      <div style={{ textAlign: 'center', backgroundColor: '#090d16', padding: '12px 16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8' }}>
            #{activePt.pointNumber} {activePt.title}
          </span>
          <span style={{
            padding: '3px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 800,
            backgroundColor: activePt.status === 'NG' ? '#ef4444' : activePt.status === 'OK' ? '#22c55e' : '#334155',
            color: 'white'
          }}>
            {activePt.status}
          </span>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <span>🛠️ <strong>{activePt.toolId}</strong></span>
          <span>•</span>
          <span>Tol: <strong style={{ color: '#cbd5e1' }}>{activePt.tolMin} ~ {activePt.tolMax} {activePt.unit}</strong></span>
          <span>•</span>
          <span>Nom: <strong style={{ color: '#38bdf8' }}>{activePt.nominal}</strong></span>
        </div>

        {activePt.status === 'NG' && (
          <div style={{ marginTop: '8px', fontSize: '0.74rem', fontWeight: 800, color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.25)', border: '1px solid #ef4444', padding: '4px 12px', borderRadius: '6px', display: 'inline-block' }}>
            ⚠️ ISO 8.7 Non-Conformance Terdeteksi (Di luar batas toleransi)
          </div>
        )}
      </div>

      {/* 7-Segment LCD Digital Display Screen */}
      <div style={{
        backgroundColor: '#020617',
        border: `2.5px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '16px 20px',
        textAlign: 'center',
        animation: activePt.status === 'NG' ? 'blink-red 0.8s ease-in-out infinite' : 'none',
        boxShadow: activePt.status === 'NG' ? '0 0 24px rgba(239, 68, 68, 0.4), inset 0 2px 6px rgba(0,0,0,0.9)' : activePt.status === 'OK' ? '0 0 24px rgba(34, 197, 94, 0.35), inset 0 2px 6px rgba(0,0,0,0.9)' : 'inset 0 3px 8px rgba(0,0,0,0.95)'
      }}>
        <style>{`
          @keyframes blink-red {
            0%, 100% { border-color: #ef4444; }
            50% { border-color: #7f1d1d; }
          }
        `}</style>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: '10px'
        }}>
          <span style={{
            fontSize: '3.2rem',
            fontWeight: 900,
            fontFamily: "'Orbitron', 'Share Tech Mono', monospace",
            letterSpacing: '2px',
            color: inputColor,
            textShadow: `0 0 14px ${activePt.status === 'NG' ? 'rgba(239, 68, 68, 0.7)' : activePt.status === 'OK' ? 'rgba(34, 197, 94, 0.7)' : 'rgba(56, 189, 248, 0.6)'}`,
            minWidth: '200px'
          }}>
            {inputValue || '0.000'}
          </span>
          <span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 800, fontFamily: "'Orbitron', monospace" }}>
            {activePt.unit}
          </span>
        </div>
      </div>

      {/* Spacious Touch Keypad */}
      <NumpadInput
        value={inputValue}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
      />

      {/* Action Buttons: OK, SIMPAN, NG */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
        <button
          onClick={() => {
            onToggleStatus(activePt.id, 'OK');
            handleInputChange(activePt.nominal?.toString() || inputValue);
          }}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: activePt.status === 'OK' ? '#22c55e' : '#1e293b',
            color: activePt.status === 'OK' ? '#0f172a' : '#94a3b8',
            border: activePt.status === 'OK' ? '1px solid #22c55e' : '1px solid #334155',
            borderRadius: '10px',
            fontWeight: 900,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: activePt.status === 'OK' ? '0 0 16px rgba(34, 197, 94, 0.4)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          OK
        </button>
        <button
          onClick={handleSubmit}
          style={{
            flex: 2,
            padding: '14px',
            backgroundColor: '#0284c7',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 900,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 0 16px rgba(2, 132, 199, 0.45)',
            letterSpacing: '1px',
            transition: 'all 0.15s'
          }}
        >
          SIMPAN ➔
        </button>
        <button
          onClick={() => onToggleStatus(activePt.id, 'NG')}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: activePt.status === 'NG' ? '#ef4444' : '#1e293b',
            color: 'white',
            border: activePt.status === 'NG' ? '1px solid #ef4444' : '1px solid #334155',
            borderRadius: '10px',
            fontWeight: 900,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: activePt.status === 'NG' ? '0 0 16px rgba(239, 68, 68, 0.45)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          NG
        </button>
      </div>
    </div>
  );
}
