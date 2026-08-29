import React, { useCallback } from 'react';

/**
 * NumpadInput - Numbers only, clean interface
 */
export default function NumpadInput({
  value,
  onChange,
  onSubmit,
}) {
  const handleKey = useCallback((key) => {
    if (key === 'back') {
      onChange(value.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.')) {
        onChange(value + '.');
      }
    } else {
      onChange(value + key);
    }
  }, [value, onChange]);

  const numBtnStyle = {
    padding: '20px 0',
    minHeight: '66px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    color: '#f8fafc',
    fontSize: '2.1rem',
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: "'Orbitron', 'Inter', monospace",
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
    transition: 'all 0.1s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div style={{
      backgroundColor: '#090d16',
      borderRadius: '14px',
      padding: '12px',
      border: '1px solid #1e293b'
    }}>
      {/* 4x3 Grid - Numbers Only */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {['7', '8', '9'].map(n => (
          <button
            key={n}
            onClick={() => handleKey(n)}
            onMouseDown={(e) => e.preventDefault()}
            style={numBtnStyle}
          >
            {n}
          </button>
        ))}

        {['4', '5', '6'].map(n => (
          <button
            key={n}
            onClick={() => handleKey(n)}
            onMouseDown={(e) => e.preventDefault()}
            style={numBtnStyle}
          >
            {n}
          </button>
        ))}

        {['1', '2', '3'].map(n => (
          <button
            key={n}
            onClick={() => handleKey(n)}
            onMouseDown={(e) => e.preventDefault()}
            style={numBtnStyle}
          >
            {n}
          </button>
        ))}

        {/* Bottom Row: . 0 Back */}
        <button
          onClick={() => handleKey('.')}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            ...numBtnStyle,
            backgroundColor: '#334155',
            borderColor: '#475569',
            fontSize: '2.4rem'
          }}
        >
          .
        </button>
        <button
          onClick={() => handleKey('0')}
          onMouseDown={(e) => e.preventDefault()}
          style={numBtnStyle}
        >
          0
        </button>
        <button
          onClick={() => handleKey('back')}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            ...numBtnStyle,
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: '#ef4444',
            color: '#ef4444',
            fontSize: '1.6rem'
          }}
          title="Hapus Digit Terakhir"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
