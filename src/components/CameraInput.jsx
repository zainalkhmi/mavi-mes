import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import toast from 'react-hot-toast';

/**
 * CameraInput - Standalone camera capture button with modal
 */
export default function CameraInput({
  onCapture,
}) {
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef(null);

  const captureFromCamera = useCallback(() => {
    if (webcamRef.current) {
      try {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          if (onCapture) {
            onCapture(imageSrc);
          }
          toast.success('📷 Foto berhasil diambil!');
        } else {
          toast.error('Gagal mengambil foto. Coba lagi.');
        }
        setShowCamera(false);
      } catch (err) {
        toast.error('Error kamera: ' + err.message);
      }
    }
  }, [onCapture]);

  return (
    <>
      {/* Camera Button */}
      <button
        onClick={() => setShowCamera(true)}
        style={{
          padding: '14px',
          backgroundColor: '#7c3aed',
          border: '1px solid #8b5cf6',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '1.3rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
        title="Ambil foto dari kamera"
      >
        📷
      </button>

      {/* Camera Modal */}
      {showCamera && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '16px',
            padding: '20px',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 700 }}>📷 Ambil Foto</span>
              <button
                onClick={() => setShowCamera(false)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              backgroundColor: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '12px',
              border: '2px solid #3b82f6'
            }}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
                videoConstraints={{
                  facingMode: 'environment',
                  width: 640,
                  height: 480
                }}
              />
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center', marginBottom: '12px' }}>
              Arahkan kamera ke gauge/display untuk mengambil nilai pengukuran
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowCamera(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                Batal
              </button>
              <button
                onClick={captureFromCamera}
                style={{
                  flex: 2,
                  padding: '12px',
                  backgroundColor: '#22c55e',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
              >
                📷 AMBIL FOTO
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
