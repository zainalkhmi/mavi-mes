import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Zap, ZapOff, Camera, RefreshCw } from 'lucide-react';

/**
 * UnifiedScanner
 * High-performance scanner component optimized for mobile devices.
 * Uses html5-qrcode for hardware-accelerated scanning.
 */
const UnifiedScanner = ({ onScan, onClose, label = "Scan Barcode" }) => {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize scanner
    const html5QrCode = new Html5Qrcode("scanner-video-region");
    html5QrCodeRef.current = html5QrCode;

    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    html5QrCode.start(
      { facingMode: "environment" }, 
      config,
      (decodedText) => {
        // Success
        onScan(decodedText);
        stopScanner();
      },
      (errorMessage) => {
        // Silently ignore scanning errors (they happen every frame)
      }
    ).then(() => {
      setIsReady(true);
    }).catch(err => {
      console.error("Scanner start error:", err);
      setError("Unable to access camera. Please check permissions.");
    });

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.warn("Stop error:", e);
      }
    }
  };

  const toggleTorch = async () => {
    if (html5QrCodeRef.current && isReady) {
      try {
        const newState = !isTorchOn;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: newState }]
        });
        setIsTorchOn(newState);
      } catch (e) {
        console.warn("Torch not supported on this device", e);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#000', zIndex: 9999,
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10
      }}>
        <div style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={20} /> {label}
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Video Region */}
      <div id="scanner-video-region" style={{ flex: 1, width: '100%' }} />

      {/* Controls Overlay */}
      <div style={{
        position: 'absolute', bottom: '40px', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: '30px', zIndex: 10
      }}>
        <button 
          onClick={toggleTorch}
          style={{
            width: '60px', height: '60px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)', border: 'none',
            color: 'white', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)'
          }}
        >
          {isTorchOn ? <Zap size={24} color="#facc15" /> : <ZapOff size={24} />}
        </button>
      </div>

      {error && (
        <div style={{
          position: 'absolute', top: '50%', left: '20px', right: '20px',
          backgroundColor: 'rgba(239, 68, 68, 0.9)', padding: '15px',
          borderRadius: '8px', color: 'white', textAlign: 'center', fontSize: '0.85rem'
        }}>
          {error}
          <button 
            onClick={() => window.location.reload()}
            style={{ display: 'block', margin: '10px auto 0', padding: '6px 12px', border: '1px solid white', background: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Targeting Overlay */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '250px', height: '250px',
        border: '2px solid rgba(255,255,255,0.5)',
        borderRadius: '16px', pointerEvents: 'none'
      }}>
        <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6', borderTopLeftRadius: '16px' }} />
        <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '4px solid #3b82f6', borderRight: '4px solid #3b82f6', borderTopRightRadius: '16px' }} />
        <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6', borderBottomLeftRadius: '16px' }} />
        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #3b82f6', borderRight: '4px solid #3b82f6', borderBottomRightRadius: '16px' }} />
        
        {/* Scanning line animation */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '2px', backgroundColor: '#3b82f6',
          boxShadow: '0 0 15px #3b82f6',
          animation: 'scanLine 2s linear infinite'
        }} />
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
};

export default UnifiedScanner;
