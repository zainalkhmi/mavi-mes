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
    <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8' }}>
          #{activePt.pointNumber} {activePt.title}
          <span style={{
            marginLeft: '8px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            backgroundColor: activePt.status === 'NG' ? '#ef4444' : activePt.status === 'OK' ? '#22c55e' : '#64748b',
            color: 'white'
          }}>
            {activePt.status}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
          {activePt.toolId} • Tol: {activePt.tolMin} ~ {activePt.tolMax} {activePt.unit}
        </div>
      </div>

      {/* Display */}
      <div style={{
        backgroundColor: '#020617',
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '16px',
        textAlign: 'center',
        animation: activePt.status === 'NG' ? 'blink-red 0.8s ease-in-out infinite' : 'none',
        boxShadow: activePt.status === 'NG' ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none'
      }}>
        <style>{`
          @keyframes blink-red {
            0%, 100% { border-color: #ef4444; }
            50% { border-color: #7f1d1d; }
          }
        `}</style>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            fontFamily: "'Orbitron', monospace",
            color: inputColor,
            textShadow: `0 0 10px ${activePt.status === 'NG' ? 'rgba(239, 68, 68, 0.6)' : 'none'}`,
            minWidth: '160px',
            animation: activePt.status === 'NG' ? 'blink-text 0.8s ease-in-out infinite' : 'none'
          }}>
            {inputValue || '0.000'}
          </span>
          <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 700 }}>
            {activePt.unit}
          </span>
        </div>
      </div>

      {/* Numpad */}
      <NumpadInput
        value={inputValue}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
      />

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => {
            onToggleStatus(activePt.id, 'OK');
            handleInputChange(activePt.nominal?.toString() || inputValue);
          }}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activePt.status === 'OK' ? '#22c55e' : '#1e293b',
            color: activePt.status === 'OK' ? '#0f172a' : '#94a3b8',
            border: '1px solid #334155',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          OK
        </button>
        <button
          onClick={handleSubmit}
          style={{
            flex: 2,
            padding: '12px',
            backgroundColor: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          SIMPAN
        </button>
        <button
          onClick={() => onToggleStatus(activePt.id, 'NG')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activePt.status === 'NG' ? '#ef4444' : '#1e293b',
            color: 'white',
            border: '1px solid #334155',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          NG
        </button>
      </div>
    </div>
  );
}
