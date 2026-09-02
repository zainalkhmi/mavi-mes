import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, CheckCircle, XCircle, ShieldAlert, AlertTriangle, CheckCircle2,
  X, Maximize2, Minimize2, Crosshair, Download, Monitor
} from 'lucide-react';

// Check instrument calibration status from Measuring Tools
const checkInstrumentCalibration = (instrumentId) => {
  const instruments = JSON.parse(localStorage.getItem('mandor_instruments') || '[]');
  const inst = instruments.find(i => i.id === instrumentId);
  if (!inst) return { valid: false, message: 'Instrument not found' };

  const today = new Date();
  const dueDate = new Date(inst.next_calibration);
  if (today > dueDate) {
    return { valid: false, message: 'CALIBRATION EXPIRED on ' + dueDate.toLocaleDateString() };
  }

  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  const status = daysUntilDue < 30 ? 'WARNING' : 'VALID';

  return {
    valid: true,
    status,
    instrument: inst,
    nextCalibration: inst.next_calibration,
    daysUntilDue
  };
};

// Sample limit data (OK vs NG)
const SAMPLE_LIMITS = {
  ok: {
    code: 'LM-OK-001',
    title: 'Sample OK - Acceptable Limit',
    photo: 'https://picsum.photos/seed/ok/600/400',
    criteria: 'No visible scratches, dents, paint defects, or discoloration. Surface finish meets spec.',
    effective: '2024-01-01',
    expiry: '2026-12-31'
  },
  ng: {
    code: 'LM-NG-001',
    title: 'Sample NG - Reject Limit',
    photo: 'https://picsum.photos/seed/ng/600/400',
    criteria: 'Visible scratches >0.2mm, dents, paint chips, or dimensional deviations.',
    effective: '2024-01-01',
    expiry: '2026-12-31'
  }
};

export const VisualInspectionModal = ({ isOpen, onClose, onDecision, inspectionItem }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [calibrationStatus, setCalibrationStatus] = useState(null);
  const [showGuide, setShowGuide] = useState(true);

  // Get available instruments
  const [instruments, setInstruments] = useState([]);
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('mandor_instruments') || '[]');
    setInstruments(stored.length > 0 ? stored : [
      { id: 'INS-001', name: 'Digital Caliper', type: 'caliper', serial_number: 'MT-2024-001', next_calibration: '2026-12-31', status: 'VALID' },
      { id: 'INS-002', name: 'Micrometer', type: 'micrometer', serial_number: 'MT-2024-002', next_calibration: '2026-01-15', status: 'VALID' },
      { id: 'INS-003', name: 'Thermometer', type: 'thermometer', serial_number: 'FL-2023-015', next_calibration: '2024-09-20', status: 'OVERDUE' }
    ]);
  }, []);

  // Check calibration when instrument changes
  useEffect(() => {
    if (selectedInstrument) {
      const result = checkInstrumentCalibration(selectedInstrument.id);
      setCalibrationStatus(result);
    }
  }, [selectedInstrument]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setCameraError(null);
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera permission.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Auto-start camera
  useEffect(() => {
    if (isOpen) startCamera();
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  // Capture & save
  const handleDecision = useCallback((decision) => {
    let capturedImage = null;
    if (canvasRef.current && videoRef.current?.srcObject) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      capturedImage = canvasRef.current.toDataURL('image/jpeg');
    }

    const record = {
      id: 'VIS-' + Date.now(),
      decision,
      timestamp: new Date().toISOString(),
      instrumentId: selectedInstrument?.id,
      instrumentName: selectedInstrument?.name,
      calibrationStatus: calibrationStatus?.status,
      image: capturedImage,
      inspectionItem: inspectionItem?.label
    };

    const existing = JSON.parse(localStorage.getItem('visual_inspections') || '[]');
    localStorage.setItem('visual_inspections', JSON.stringify([record, ...existing]));

    stopCamera();
    onDecision?.(decision, record);
    onClose?.();
  }, [selectedInstrument, calibrationStatus, inspectionItem, onDecision, onClose, stopCamera]);

  if (!isOpen) return null;

  const okData = inspectionItem?.okSample || SAMPLE_LIMITS.ok;
  const ngData = inspectionItem?.ngSample || SAMPLE_LIMITS.ng;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/95 ${isFullscreen ? 'p-0' : 'p-4'}`}>
      {/* Hidden canvas capture */}
      <canvas ref={canvasRef} width="1920" height="1080" className="hidden" />

      {/* Main Modal */}
      <div className={`bg-slate-900 border-2 border-slate-600 rounded-2xl text-white overflow-hidden flex flex-col ${isFullscreen ? 'w-screen h-screen' : 'w-full max-w-7xl h-[92vh]'}`}>

        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg">Visual Inspection + Master Limit Sample</h2>
              <p className="text-xs text-slate-400">{inspectionItem?.label || 'Visual QC Parameter'} • Camera + Reference Comparison</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Instrument Selector */}
            <select
              value={selectedInstrument?.id || ''}
              onChange={e => {
                const inst = instruments.find(i => i.id === e.target.value);
                setSelectedInstrument(inst);
              }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
            >
              <option value="">Pilih Instrument...</option>
              {instruments.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.serial_number}) - {inst.status}
                </option>
              ))}
            </select>

            {/* Guide Toggle */}
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={`px-3 py-2 rounded-lg text-sm font-bold border ${showGuide ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-800 border-slate-700'}`}
            >
              {showGuide ? 'Hide Guide' : 'Show Guide'}
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {/* Close */}
            <button
              onClick={() => { stopCamera(); onClose?.(); }}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Calibration Warning Banner */}
        {calibrationStatus && (
          <div className={`px-6 py-2 text-sm font-bold flex items-center gap-2 ${
            calibrationStatus.valid
              ? 'bg-emerald-900/50 text-emerald-400 border-b border-emerald-800'
              : 'bg-rose-900/50 text-rose-400 border-b border-rose-800 animate-pulse'
          }`}>
            {calibrationStatus.valid ? (
              <>
                <CheckCircle2 size={14} />
                <span>Instrument: <strong>{selectedInstrument?.name}</strong> — Valid until {new Date(calibrationStatus.nextCalibration).toLocaleDateString()} ({calibrationStatus.daysUntilDue} days remaining)</span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} />
                <span className="font-extrabold">{calibrationStatus.message} — CANNOT MEASURE!</span>
              </>
            )}
          </div>
        )}

        {/* Body: Camera + Reference */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Live Camera Feed */}
          <div className="flex-1 bg-black relative">
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera size={64} className="mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400 mb-4">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500"
                  >
                    Retry Camera
                  </button>
                </div>
              </div>
            ) : stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center animate-pulse">
                  <Camera size={64} className="mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">Memulai kamera...</p>
                </div>
              </div>
            )}

            {/* Overlay: Crosshair */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <Crosshair size={64} className="text-white/20" />
            </div>

            {/* Overlay: Instructions */}
            <div className="absolute bottom-4 left-4 bg-black/70 rounded-lg p-3 text-xs">
              <p className="text-emerald-400 font-bold mb-1">📷 Posisi produk di frame kamera</p>
              <p className="text-slate-400">Bandingkan dengan referensi di kanan</p>
            </div>

            {/* Overlay: Decision Buttons */}
            <div className="absolute bottom-4 right-4 flex gap-3">
              <button
                onClick={() => handleDecision('NG')}
                disabled={!calibrationStatus?.valid}
                className={`px-8 py-4 rounded-xl text-xl font-extrabold flex items-center gap-2 ${
                  calibrationStatus?.valid
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-slate-700 cursor-not-allowed opacity-50'
                }`}
              >
                <XCircle size={24} /> NG - TOLAK
              </button>
              <button
                onClick={() => handleDecision('OK')}
                disabled={!calibrationStatus?.valid}
                className={`px-8 py-4 rounded-xl text-xl font-extrabold flex items-center gap-2 ${
                  calibrationStatus?.valid
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-slate-700 cursor-not-allowed opacity-50'
                }`}
              >
                <CheckCircle size={24} /> OK - TERIMA
              </button>
            </div>
          </div>

          {/* RIGHT: Master Limit Sample Reference (Side-by-Side OK vs NG) */}
          {showGuide && (
            <div className="w-[480px] bg-slate-950 border-l border-slate-800 overflow-y-auto">
              {/* Header */}
              <div className="p-4 bg-slate-900 border-b border-slate-800">
                <h3 className="font-bold text-sm text-slate-300 mb-1">Master Limit Sample / Pedoman Batas Mutu</h3>
                <p className="text-xs text-slate-500">
                  Standar OK vs NG untuk inspeksi visual
                </p>
              </div>

              {/* OK Card */}
              <div className="p-4 border-b border-emerald-900/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle size={14} /> BATAS MAKSIMAL DITERIMA (OK)
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                    PASS
                  </span>
                </div>
                <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-3 mb-3">
                  <img
                    src={okData.photo}
                    alt="OK Sample"
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="p-3 bg-slate-900 rounded-lg text-xs text-emerald-200 leading-relaxed">
                  <strong className="text-emerald-400 block mb-1">Kriteria Penerimaan:</strong>
                  {okData.criteria}
                </div>
                <div className="mt-2 text-[10px] text-slate-500">
                  Kode: {okData.code} • Exp: {okData.expiry}
                </div>
              </div>

              {/* NG Card */}
              <div className="p-4 bg-rose-950/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle size={14} /> BATAS MINIMAL DITOLAK (NG)
                  </span>
                  <span className="bg-rose-500/20 text-rose-300 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                    REJECT
                  </span>
                </div>
                <div className="bg-rose-900/30 border border-rose-700 rounded-xl p-3 mb-3">
                  <img
                    src={ngData.photo}
                    alt="NG Sample"
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="p-3 bg-slate-900 rounded-lg text-xs text-rose-200 leading-relaxed">
                  <strong className="text-rose-400 block mb-1">Kriteria Penolakan:</strong>
                  {ngData.criteria}
                </div>
                <div className="mt-2 text-[10px] text-slate-500">
                  Kode: {ngData.code} • Exp: {ngData.expiry}
                </div>
              </div>

              {/* Footer Info */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>QA Lead: <strong className="text-emerald-400">Approved</strong></span>
                <span>Lokasi: Rak Metrologi</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Status */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            Instrument: <strong className={calibrationStatus?.valid ? 'text-emerald-400' : 'text-rose-400'}>
              {selectedInstrument?.name || 'Belum dipilih'}
            </strong>
          </span>
          <span>Waktu: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default VisualInspectionModal;
