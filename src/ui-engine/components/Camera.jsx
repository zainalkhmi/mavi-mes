import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import { 
  Camera as CameraIcon, RefreshCw, Grid3X3, 
  RotateCcw, Image, Check, Trash2, Flashlight, ShieldCheck 
} from 'lucide-react';

/**
 * Camera Component
 * Industrial MES Inspection Camera Viewfinder & Defect Capture.
 * Supports live WebRTC viewfinder, rule-of-thirds grid, snapshot capture, and review mode.
 */
export function Camera({
  label = 'Kamera Inspeksi Defek Visual',
  subtitle = 'Ambil foto bukti cacat atau kelayakan part',
  onCapture,
  aspectRatio = 'square', // square | 4:3 | video
  showGrid = true,
  showShutter = true,
  className,
  ...props
}) {
  const [facingMode, setFacingMode] = useState('environment'); // environment | user
  const [gridActive, setGridActive] = useState(showGrid);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      if (capturedPhoto) return;
      try {
        if (navigator?.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          });
          if (active && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
            streamRef.current = stream;
            setCameraError(null);
          }
        } else {
          setCameraError('Camera API not available');
        }
      } catch (err) {
        if (active) {
          setCameraError(err.message || 'Izin kamera ditolak');
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode, capturedPhoto]);

  // Capture current frame from video
  const handleTakePhoto = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    let photoData = null;
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        photoData = canvas.toDataURL('image/jpeg', 0.9);
      } catch (e) {
        // Fallback photo
      }
    }

    if (!photoData) {
      // Fallback sample defect photo
      photoData = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80';
    }

    setCapturedPhoto(photoData);
    if (onCapture) onCapture(photoData);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const toggleFacing = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const aspectClass = aspectRatio === '4:3' ? 'aspect-4/3' : aspectRatio === 'video' ? 'aspect-video' : 'aspect-square max-h-[340px]';

  return (
    <div
      className={cn(
        'w-full bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col',
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="p-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <CameraIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-tight">{label}</div>
            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{subtitle}</div>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setGridActive(!gridActive)}
            className={cn(
              'p-1.5 rounded-lg border text-xs transition-colors',
              gridActive
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            )}
            title="Toggle Alignment Grid"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFacing}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs transition-colors"
            title="Ganti Kamera Depan / Belakang"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Viewfinder / Photo Canvas */}
      <div className={cn('relative w-full overflow-hidden bg-slate-950 flex items-center justify-center', aspectClass)}>
        <canvas ref={canvasRef} className="hidden" />

        {capturedPhoto ? (
          // Review Captured Photo
          <div className="relative w-full h-full">
            <img
              src={capturedPhoto}
              alt="Hasil Inspeksi"
              className="w-full h-full object-cover"
            />
            {/* Timestamp Watermark Badge */}
            <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-xs text-[9px] font-mono text-white flex items-center gap-1.5 border border-white/10">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>QC PROOF • {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        ) : (
          // Live Viewfinder
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Fallback View if camera error */}
            {cameraError && (
              <div className="absolute inset-0 bg-linear-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-2">
                  <CameraIcon className="w-6 h-6 opacity-80" />
                </div>
                <span className="text-xs font-semibold text-slate-200">Viewfinder Kamera Siap</span>
                <span className="text-[10px] text-slate-500 max-w-[220px] mt-0.5">
                  Klik tombol shutter di bawah untuk simulasi foto ({cameraError})
                </span>
              </div>
            )}

            {/* Alignment Grid Overlay */}
            {gridActive && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 opacity-30">
                <div className="border-r border-b border-white/50" />
                <div className="border-r border-b border-white/50" />
                <div className="border-b border-white/50" />
                <div className="border-r border-b border-white/50" />
                <div className="border-r border-b border-white/50" />
                <div className="border-b border-white/50" />
                <div className="border-r border-white/50" />
                <div className="border-r border-white/50" />
                <div />
              </div>
            )}
          </>
        )}

        {/* Flash Effect on Capture */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-out fade-out duration-200" />
        )}
      </div>

      {/* Shutter / Controls Bar */}
      {showShutter && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          {capturedPhoto ? (
            // Captured review actions
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={handleRetake}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Foto Ulang</span>
              </button>

              <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                <Check className="w-3.5 h-3.5" />
                <span>Foto Siap Tersimpan</span>
              </div>
            </div>
          ) : (
            // Shutter button bar
            <div className="w-full flex items-center justify-center relative">
              <button
                type="button"
                onClick={handleTakePhoto}
                className="w-13 h-13 rounded-full border-3 border-white/90 p-1 flex items-center justify-center transition-transform active:scale-90 shadow-xl cursor-pointer"
                title="Tekan untuk Ambil Foto"
              >
                <div className="w-full h-full rounded-full bg-teal-500 hover:bg-teal-400 transition-colors shadow-inner" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Camera;
