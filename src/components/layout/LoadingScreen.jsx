import React from 'react';

const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    background: 'radial-gradient(circle at center, #0f1c3f 0%, #080f21 100%)',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  }}>
    <div style={{
      fontSize: '3rem',
      fontWeight: 800,
      letterSpacing: '0.15em',
      color: '#3b82f6',
      textShadow: '0 0 20px rgba(59, 130, 246, 0.6)',
      marginBottom: '5px',
      animation: 'logoPulse 2s ease-in-out infinite'
    }}>MAVI MES</div>
    <div style={{
      fontSize: '0.85rem',
      fontWeight: 600,
      color: '#94a3b8',
      letterSpacing: '0.3em',
      textTransform: 'uppercase',
      marginBottom: '40px'
    }}>Execution System</div>
    <div style={{
      position: 'relative',
      width: '60px',
      height: '60px',
      border: '3px solid rgba(59, 130, 246, 0.1)',
      borderTop: '3px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}>
      <div style={{
        position: 'absolute',
        top: '6px',
        left: '6px',
        right: '6px',
        bottom: '6px',
        border: '3px solid transparent',
        borderTop: '3px solid #00f2fe',
        borderRadius: '50%',
        animation: 'spin-reverse 1.5s linear infinite'
      }} />
    </div>
    <div style={{
      marginTop: '25px',
      fontSize: '0.8rem',
      fontWeight: 600,
      color: '#64748b',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      animation: 'fadeBlink 1.5s ease-in-out infinite'
    }}>Memuat Halaman...</div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes spin-reverse {
        0% { transform: rotate(360deg); }
        100% { transform: rotate(0deg); }
      }
      @keyframes logoPulse {
        0%, 100% { transform: scale(0.98); opacity: 0.8; text-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
        50% { transform: scale(1.02); opacity: 1; text-shadow: 0 0 30px rgba(59, 130, 246, 0.8); }
      }
      @keyframes fadeBlink {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
    `}</style>
  </div>
);

export default LoadingScreen;
