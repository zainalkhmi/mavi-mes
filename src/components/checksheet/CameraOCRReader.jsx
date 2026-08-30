import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Scan, RotateCcw, Check, Loader, ZoomIn, FlipHorizontal } from 'lucide-react';
import Tesseract from 'tesseract.js';
import toast from 'react-hot-toast';

/**
 * CameraOCRReader - Reads numeric values from measuring instrument LCD displays
 * using device camera + Tesseract.js OCR. Designed for 7-segment / digital displays
 * on calipers, micrometers, bore gauges, height gauges, etc.
 */
export default function CameraOCRReader({ onValueDetected, activePoint }) {
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedValue, setDetectedValue] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [capturedImage, setCapturedImage] = useState(null);
  const [history, setHistory] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const unit = activePoint?.unit || 'mm';

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsActive(true);
      setCapturedImage(null);
      setDetectedValue(null);
    } catch {
      toast.error('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.', { icon: '📷' });
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsActive(false);
    setCapturedImage(null);
    setDetectedValue(null);
  }, []);

  // Flip camera
  const flipCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, [stopCamera]);

  // Re-open camera after facingMode change
  useEffect(() => {
    if (isActive) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Capture frame & run OCR
  const captureAndProcess = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Pre-process: increase contrast for LCD digits
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // High contrast threshold for 7-segment displays
      const val = gray > 120 ? 255 : 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
    ctx.putImageData(imageData, 0, 0);

    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
    setIsProcessing(true);
    setDetectedValue(null);

    try {
      const result = await Tesseract.recognize(dataUrl, 'eng', {
        tessedit_char_whitelist: '0123456789.-+',
        tessedit_pageseg_mode: '7' // Single line
      });

      const rawText = result.data.text.trim();
      const conf = Math.round(result.data.confidence);

      // Extract numeric pattern (e.g. 12.345, -0.002, 150.00)
      const numMatch = rawText.match(/-?\d+\.?\d*/);

      if (numMatch) {
        const value = numMatch[0];
        setDetectedValue(value);
        setConfidence(conf);
        setHistory(prev => [
          { value, confidence: conf, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 4)
        ]);
        toast.success(`OCR: ${value} ${unit} (${conf}%)`, { icon: '🔍' });
      } else {
        setDetectedValue(null);
        setConfidence(0);
        toast.error('Nilai tidak terdeteksi. Arahkan kamera ke display LCD alat ukur.', { icon: '❌' });
      }
    } catch {
      toast.error('OCR gagal. Coba lagi.', { icon: '⚠️' });
    } finally {
      setIsProcessing(false);
    }
  }, [unit]);

  // Accept the detected value
  const acceptValue = useCallback(() => {
    if (detectedValue && onValueDetected) {
      onValueDetected(detectedValue);
      toast.success(`✅ Nilai ${detectedValue} ${unit} dikirim ke checksheet!`, { icon: '📋' });
      setDetectedValue(null);
      setCapturedImage(null);
      // Resume live feed
      if (streamRef.current && videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    }
  }, [detectedValue, onValueDetected, unit]);

  // Retake
  const retake = useCallback(() => {
    setCapturedImage(null);
    setDetectedValue(null);
    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>

      {/* ─── HEADER BAR ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          border: '1px solid #1e293b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Camera size={14} style={{ color: '#a78bfa' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.2px' }}>
            CAMERA OCR
          </span>
          <span style={{ fontSize: '0.54rem', color: '#94a3b8', fontWeight: 700 }}>
            LCD Reader
          </span>
        </div>

        {!isActive ? (
          <button
            onClick={startCamera}
            style={{
              backgroundColor: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: '0.62rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Camera size={11} />
            <span>Start</span>
          </button>
        ) : (
          <button
            onClick={stopCamera}
            style={{
              backgroundColor: '#1e293b',
              color: '#ef4444',
              border: '1px solid #ef444444',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '0.62rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <X size={11} />
            <span>Stop</span>
          </button>
        )}
      </div>

      {/* ─── CAMERA VIEWPORT ─── */}
      {isActive && (
        <div
          style={{
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1.5px solid #334155',
            backgroundColor: '#000',
            aspectRatio: '4 / 3'
          }}
        >
          {/* Live Video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: capturedImage ? 'none' : 'block'
            }}
          />

          {/* Captured Snapshot */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          )}

          {/* OCR Processing Canvas (hidden) */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Crosshair Overlay — guides user to aim at LCD */}
          {!capturedImage && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  width: '80%',
                  height: '36%',
                  border: '2px dashed #a78bfa88',
                  borderRadius: '6px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: '-18px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.54rem',
                  fontWeight: 800,
                  color: '#a78bfa',
                  backgroundColor: '#000000aa',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap'
                }}>
                  Arahkan ke Display LCD
                </span>
                {/* Corner brackets */}
                {[
                  { top: 0, left: 0, borderTop: '3px solid #a78bfa', borderLeft: '3px solid #a78bfa' },
                  { top: 0, right: 0, borderTop: '3px solid #a78bfa', borderRight: '3px solid #a78bfa' },
                  { bottom: 0, left: 0, borderBottom: '3px solid #a78bfa', borderLeft: '3px solid #a78bfa' },
                  { bottom: 0, right: 0, borderBottom: '3px solid #a78bfa', borderRight: '3px solid #a78bfa' }
                ].map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: '14px', height: '14px', ...s }} />
                ))}
              </div>
            </div>
          )}

          {/* Processing Overlay */}
          {isProcessing && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Loader size={24} style={{ color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.66rem', color: '#e2e8f0', fontWeight: 800 }}>
                Membaca LCD Display...
              </span>
            </div>
          )}

          {/* Camera Control Buttons (Bottom Bar) */}
          {!capturedImage && !isProcessing && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '6px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
              }}
            >
              <button
                onClick={flipCamera}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Flip Camera"
              >
                <FlipHorizontal size={14} />
              </button>

              <button
                onClick={captureAndProcess}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#7c3aed',
                  border: '3px solid #a78bfa',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(124, 58, 237, 0.5)'
                }}
                title="Capture & Read OCR"
              >
                <Scan size={18} />
              </button>

              <button
                onClick={() => {}} // placeholder for zoom
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.4
                }}
                title="Zoom (Coming Soon)"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── OCR RESULT CARD ─── */}
      {detectedValue && (
        <div
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            border: `1.5px solid ${confidence > 60 ? '#22c55e44' : '#f59e0b44'}`,
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          {/* Detected Value Display */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                fontFamily: 'monospace',
                color: '#f8fafc',
                letterSpacing: '1px'
              }}>
                {detectedValue}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>{unit}</span>
            </div>
            <span style={{
              fontSize: '0.56rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: confidence > 60 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
              color: confidence > 60 ? '#22c55e' : '#f59e0b',
              border: `1px solid ${confidence > 60 ? '#22c55e44' : '#f59e0b44'}`
            }}>
              {confidence}% OCR
            </span>
          </div>

          {/* Accept / Retake Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={retake}
              style={{
                flex: 1,
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '5px',
                fontSize: '0.64rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={12} />
              <span>Ulang</span>
            </button>
            <button
              onClick={acceptValue}
              style={{
                flex: 1,
                backgroundColor: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '5px',
                fontSize: '0.64rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(34,197,94,0.3)'
              }}
            >
              <Check size={12} />
              <span>Pakai Nilai</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── HISTORY (last 3) ─── */}
      {history.length > 0 && !isActive && (
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          border: '1px solid #1e293b',
          padding: '6px 8px',
          fontSize: '0.58rem'
        }}>
          <div style={{ color: '#64748b', fontWeight: 800, marginBottom: '3px' }}>OCR History</div>
          {history.slice(0, 3).map((h, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: '#94a3b8',
              padding: '1px 0',
              borderBottom: i < 2 ? '1px solid #1e293b22' : 'none'
            }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#e2e8f0' }}>{h.value} {unit}</span>
              <span>{h.confidence}% • {h.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Spin animation (inline) */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
