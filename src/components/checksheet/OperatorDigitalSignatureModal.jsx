import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  CheckCircle2,
  X,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  User,
  Clock,
  FileCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OperatorDigitalSignatureModal({
  isOpen,
  onClose,
  onSign,
  stats = { total: 0, ok: 0, ng: 0, pending: 0 },
  partInfo = { partNo: '', partName: '', workOrderNo: '', partSerial: '' },
  initialOperatorName = 'Budi Santoso',
  initialOperatorId = 'QC-OPR-2026-004'
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [operatorName, setOperatorName] = useState(initialOperatorName);
  const [operatorId, setOperatorId] = useState(initialOperatorId);
  const [statementAccepted, setStatementAccepted] = useState(true);
  const [signatureDate] = useState(() => new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }));

  // Setup Canvas when opened
  useEffect(() => {
    if (!isOpen) return;

    // Short timeout to ensure modal is rendered and dimensions are accurate
    const timer = setTimeout(() => {
      setHasDrawn(false);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Signature baseline guide
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(30, rect.height - 35);
      ctx.lineTo(rect.width - 30, rect.height - 35);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Sign here watermark guide
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText('✍️ Bubuhkan tanda tangan Anda di atas garis ini', 32, rect.height - 18);
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0f172a'; // Deep ink black/navy
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      if (e) e.preventDefault();
      setIsDrawing(false);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Signature baseline guide
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, rect.height - 35);
    ctx.lineTo(rect.width - 30, rect.height - 35);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('✍️ Bubuhkan tanda tangan Anda di atas garis ini', 32, rect.height - 18);

    setHasDrawn(false);
  };

  const handleConfirmSignature = () => {
    if (!hasDrawn) {
      toast.error('Silakan bubuhkan tanda tangan digital Anda terlebih dahulu pada kotak!');
      return;
    }
    if (!operatorName.trim()) {
      toast.error('Nama operator QC wajib diisi!');
      return;
    }
    if (!statementAccepted) {
      toast.error('Harap centang pernyataan verifikasi hasil inspeksi!');
      return;
    }

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : null;

    const signaturePayload = {
      signatureDataUrl,
      operatorName: operatorName.trim(),
      operatorId: operatorId.trim(),
      signedAt: new Date().toISOString(),
      signedAtFormatted: signatureDate,
      verificationHash: `SIG-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      disposition: stats.ng > 0 ? 'REJECTED (NG)' : 'APPROVED (OK)',
      totalPoints: stats.total || 0,
      passedPoints: stats.ok || 0,
      failedPoints: stats.ng || 0
    };

    onSign(signaturePayload);
  };

  const isAllPassed = stats.ng === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 md:p-4">
      <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-2xl w-full max-w-xl flex flex-col overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-white animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold shadow-md">
              <PenTool size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm md:text-base text-white">Tanda Tangan Digital Operator (E-Signature)</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ISO 9001: 8.5.1
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pengecekan titik ukur selesai. Bubuhkan tanda tangan untuk otorisasi lembar periksa.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup / Batal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[82vh]">
          {/* Quick Summary Strip */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="space-y-0.5">
              <div className="text-slate-400 font-medium">Nomor Part / WO:</div>
              <div className="font-mono font-bold text-cyan-300">
                {partInfo.partNo || 'PART-001'} {partInfo.workOrderNo ? `• ${partInfo.workOrderNo}` : ''}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold font-mono">
                OK: {stats.ok}
              </span>
              <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold font-mono">
                NG: {stats.ng}
              </span>
              <span className={`px-2.5 py-1 rounded-lg font-bold text-xs uppercase flex items-center gap-1 ${
                isAllPassed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}>
                {isAllPassed ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                <span>{isAllPassed ? 'PASS (LOLOS)' : 'REJECT (MRB)'}</span>
              </span>
            </div>
          </div>

          {/* Inspector Identification Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <User size={12} className="text-cyan-400" />
                <span>Nama Operator QC / Inspektur:</span>
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Nama Lengkap Operator"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock size={12} className="text-cyan-400" />
                <span>NIK / ID Operator:</span>
              </label>
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                placeholder="Contoh: QC-OPR-042"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono font-semibold text-cyan-300 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Digital Signature Canvas Pad */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <PenTool size={12} className="text-cyan-400" />
                <span>Area Tanda Tangan Digital:</span>
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-bold text-slate-400 hover:text-rose-400 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Bersihkan (Clear)</span>
              </button>
            </div>

            {/* Canvas Container */}
            <div className="relative w-full h-44 rounded-xl border-2 border-dashed border-cyan-500/50 bg-white overflow-hidden shadow-inner cursor-crosshair touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full block"
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
              <span>Gunakan stylus, sentuhan jari, atau mouse untuk menandatangani.</span>
              <span className="font-mono text-cyan-400">{signatureDate}</span>
            </div>
          </div>

          {/* Declaration Statement */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={statementAccepted}
              onChange={(e) => setStatementAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
            />
            <span className="text-[11px] text-slate-300 leading-relaxed">
              Saya menyatakan bahwa seluruh pengukuran, toleransi, dan inspeksi visual pada part ini telah dilakukan dengan benar sesuai instruksi kerja (SOP) dan standar kendali mutu ISO 9001 / IATF 16949.
            </span>
          </label>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <ShieldCheck size={14} />
            <span>Digital Signature Secured</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmSignature}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-black shadow-lg shadow-cyan-900/40 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <FileCheck size={15} />
              <span>Konfirmasi & Simpan Checksheet ➔</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
