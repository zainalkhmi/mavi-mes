import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import { 
  QrCode, Flashlight, RefreshCw, CheckCircle2, 
  AlertCircle, Sparkles, X, ScanLine, Camera as CameraIcon 
} from 'lucide-react';

/**
 * QRCodeScanner Component
 * Shop floor / MES QR code and barcode scanner with live camera preview,
 * interactive HUD scanning frame, torch toggle, and simulation fallback.
 */
export function QRCodeScanner({
  label = 'Pindai QR / Barcode Part',
  subtitle = 'Arahkan kamera ke QR Code label lot atau travel sheet',
  onScan,
  aspectRatio = 'square', // square | video
  showControls = true,
  autoScan = true,
  className,
  ...props
}) {
  const [isScanning, setIsScanning] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // environment | user
  const [scannedCode, setScannedCode] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize camera stream if available
  useEffect(() => {
    let active = true;

    async function startCamera() {
      if (!isScanning) return;
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
          setCameraError('Camera API not supported in this environment');
        }
      } catch (err) {
        if (active) {
          // Graceful fallback for environments without camera access or permissions
          setCameraError(err.message || 'Kamera tidak dapat diakses');
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
  }, [facingMode, isScanning]);

  const handleSimulateScan = (code = 'LOT-2026-X994B') => {
    setScannedCode(code);
    setIsScanning(false);
    if (onScan) onScan(code);
  };

  const handleReset = () => {
    setScannedCode(null);
    setIsScanning(true);
  };

  const toggleFacing = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && typeof track.applyConstraints === 'function') {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torchOn }]
          });
          setTorchOn(!torchOn);
          return;
        } catch (e) {
          // torch might not be supported on this track
        }
      }
    }
    setTorchOn(!torchOn);
  };

  const aspectClass = aspectRatio === 'video' ? 'aspect-video' : 'aspect-square max-h-[320px]';

  return (
    <div
      className={cn(
        'w-full bg-slate-900 text-white rounded-2xl overflow-hidden shadow-lg border border-slate-800 flex flex-col',
        className
      )}
      {...props}
    >
      {/* Scanner Header */}
      <div className="p-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-tight">{label}</div>
            <div className="text-[10px] text-slate-400 truncate max-w-[220px]">{subtitle}</div>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{isScanning ? 'SCANNING' : 'DONE'}</span>
        </div>
      </div>

      {/* Viewfinder Viewport */}
      <div className={cn('relative w-full overflow-hidden bg-slate-950 flex items-center justify-center', aspectClass)}>
        {/* Real Video or Simulated Background */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Backdrop overlay if camera error or preview placeholder */}
        {cameraError && (
          <div className="absolute inset-0 bg-linear-to-b from-slate-950/80 via-slate-900/90 to-slate-950 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-2">
              <CameraIcon className="w-6 h-6 opacity-70" />
            </div>
            <span className="text-xs font-semibold text-slate-300">Live Camera Stream</span>
            <span className="text-[10px] text-slate-500 max-w-[200px] mt-0.5">
              Simulasi HUD Aktif ({cameraError})
            </span>
          </div>
        )}

        {/* HUD Viewfinder Reticle */}
        <div className="relative z-10 w-52 h-52 sm:w-60 sm:h-60 border-2 border-teal-500/40 rounded-2xl flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
          {/* Corner Brackets */}
          <div className="flex justify-between">
            <div className="w-5 h-5 border-t-3 border-l-3 border-teal-400 rounded-tl-lg" />
            <div className="w-5 h-5 border-t-3 border-r-3 border-teal-400 rounded-tr-lg" />
          </div>

          {/* Animated Laser Scanning Line */}
          {isScanning && (
            <div className="relative w-full h-0.5">
              <div className="absolute inset-x-0 h-0.5 bg-linear-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_rgba(45,212,191,0.8)] animate-bounce" />
            </div>
          )}

          <div className="flex justify-between">
            <div className="w-5 h-5 border-b-3 border-l-3 border-teal-400 rounded-bl-lg" />
            <div className="w-5 h-5 border-b-3 border-r-3 border-teal-400 rounded-br-lg" />
          </div>

          {/* Center Target Icon */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <ScanLine className="w-10 h-10 text-teal-400 animate-pulse" />
          </div>
        </div>

        {/* Scanned Result Banner Overlay */}
        {scannedCode && (
          <div className="absolute inset-x-3 bottom-3 z-20 p-3 rounded-xl bg-emerald-950/95 border border-emerald-500/60 backdrop-blur-md shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Hasil Scan Terverifikasi</div>
                <div className="text-xs font-mono font-bold text-white tracking-wide">{scannedCode}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="p-1 rounded-lg hover:bg-emerald-800/40 text-emerald-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Action Controls Bar */}
      {showControls && (
        <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {/* Torch Light Toggle */}
            <button
              type="button"
              onClick={toggleTorch}
              className={cn(
                'p-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5',
                torchOn
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-400 hover:text-white'
              )}
              title="Toggle Flash / Senter"
            >
              <Flashlight className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">{torchOn ? 'Senter ON' : 'Senter'}</span>
            </button>

            {/* Flip Camera */}
            <button
              type="button"
              onClick={toggleFacing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
              title="Ganti Kamera Depan / Belakang"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Flip</span>
            </button>
          </div>

          {/* Test Scan Simulation button (Handy for Canvas & Testing) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSimulateScan(`PART-8890-${Math.floor(100 + Math.random() * 900)}`)}
              className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-teal-200" />
              <span>Test Scan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QRCodeScanner;
