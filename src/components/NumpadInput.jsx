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

  return (
    <div style={{
      backgroundColor: '#0f172a',
      borderRadius: '12px',
      padding: '10px',
      border: '1px solid #1e293b'
    }}>
      {/* 4x3 Grid - Numbers Only */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {['7', '8', '9'].map(n => (
          <button
            key={n}
            onClick={() => handleKey(n)}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '20px 0',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '10px',
              color: '#f8fafc',
              fontSize: '1.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            {n}
          </button>
        ))}

        {['4', '5', '6'].map(n => (
          <button
            key={n}
            onClick={() => handleKey(n)}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '20px 0',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '10px',
              color: '#f8fafc',
              fontSize: '1.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            {n}
          </button>
        ))}

        {['1', '2', '3'].map(n => (
          <button
            key={n}
            onClick={() => handleKey(n)}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '20px 0',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '10px',
              color: '#f8fafc',
              fontSize: '1.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            {n}
          </button>
        ))}

        {/* Bottom Row: . 0 Back */}
        <button
          onClick={() => handleKey('.')}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            padding: '20px 0',
            backgroundColor: '#475569',
            border: '1px solid #64748b',
            borderRadius: '10px',
            color: '#f8fafc',
            fontSize: '1.8rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          .
        </button>
        <button
          onClick={() => handleKey('0')}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            padding: '20px 0',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '10px',
            color: '#f8fafc',
            fontSize: '1.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'monospace'
          }}
        >
          0
        </button>
        <button
          onClick={() => handleKey('back')}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            padding: '20px 0',
            backgroundColor: '#dc2626',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            color: '#ffffff',
            fontSize: '1.4rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
