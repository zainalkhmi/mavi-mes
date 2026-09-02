import React, { useState, useEffect } from 'react';
import NumpadInput from './NumpadInput';
import {
  Wifi,
  Mic,
  Camera,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  ShieldCheck,
  Maximize2,
  Upload,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

import { TOOL_DEFINITIONS, detectMeasuringToolType, getCalibrationStatus } from '../utils/metrologyToolUtils';

/**
 * CheckTabContent - Enterprise Inspection Studio
 * Features:
 * - Real-Time Dynamic Tolerance Bar (LSL, Nominal, USL Analog Deviation Scale)
 * - 3-Way Visual Limit Sample Comparator (Golden Sample, Limit Boundary, NG Defect)
 * - Live Camera Evidence Capture for Visual Defects (ISO 9001: 8.5.1 / 8.7)
 * - Direct IoT Bluetooth Gauge Sync Simulation
 * - Voice Input / Speech Recognition Dictation
 * - Piece & Cavity Sample Selector
 * - ISO 9001: 7.1.5 Tool Calibration Expiration Detection & Input Lockout
 */
export default function CheckTabContent({ activePt, onChange, onCommit, onToggleStatus, onOpenCalibration }) {
  const [inputValue, setInputValue] = useState(activePt.measuredVal || '');
  const [samplePiece, setSamplePiece] = useState(1);
  const [cavityNo, setCavityNo] = useState(1);
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  // ISO 9001: 7.1.5 Tool Calibration Expiration Check
  const detectedToolType = detectMeasuringToolType(activePt);
  const toolDef = TOOL_DEFINITIONS.find(t => t.name === activePt.toolId || t.id === detectedToolType) || TOOL_DEFINITIONS[0];
  const calStat = getCalibrationStatus(toolDef);
  const isToolExpired = calStat.status === 'EXPIRED';

  // Visual Limit Sample States
  const [selectedDefectCategory, setSelectedDefectCategory] = useState(activePt.defectTag || 'Scratch / Goresan');
  const [capturedEvidenceImg, setCapturedEvidenceImg] = useState(activePt.evidenceImg || null);
  const [zoomModalImg, setZoomModalImg] = useState(null);

  const isVisualPoint =
    activePt.category?.toLowerCase().includes('visual') ||
    activePt.category?.toLowerCase().includes('surface') ||
    activePt.shape === 'square' ||
    activePt.inspectionType === 'visual' ||
    activePt.isVisual;

  // Sync when activePt changes (next point)
  useEffect(() => {
    const t = setTimeout(() => {
      setInputValue(activePt.measuredVal || '');
      setCapturedEvidenceImg(activePt.evidenceImg || null);
      setSelectedDefectCategory(activePt.defectTag || 'Scratch / Goresan');
    }, 0);
    return () => clearTimeout(t);
  }, [activePt.id, activePt.measuredVal, activePt.evidenceImg, activePt.defectTag]);

  const handleInputChange = (val) => {
    if (!isVisualPoint && isToolExpired) {
      toast.error(`⛔ Input Ditolak: Alat ukur "${toolDef.name}" (${toolDef.code}) EXPIRED! Kalibrasi ulang terlebih dahulu (ISO 9001: 7.1.5).`, { icon: '🔴' });
      return;
    }
    setInputValue(val);
    onChange(activePt.id, val);
  };

  const handleSubmit = () => {
    if (!isVisualPoint && isToolExpired) {
      toast.error(`⛔ Gagal Simpan: Alat ukur "${toolDef.name}" EXPIRED (ISO 9001: 7.1.5)!`, { icon: '🔴' });
      return;
    }
    onCommit(activePt.id, inputValue);
    setInputValue('');
  };

  // ─── Visual Decision Handlers (Limit Sample Matching) ───
  const handleVisualDecision = (decision) => {
    if (decision === 'ACCEPT') {
      const val = 'PASS (Within Limit Sample)';
      setInputValue(val);
      onChange(activePt.id, val);
      onToggleStatus(activePt.id, 'OK');
      toast.success(`✓ Dimensi visual #${activePt.pointNumber} diterima (Sesuai Limit Sample)!`, { icon: '🟢' });
      setTimeout(() => onCommit(activePt.id, val), 200);
    } else if (decision === 'MARGINAL') {
      const val = 'MARGINAL (Limit Sample OK)';
      setInputValue(val);
      onChange(activePt.id, val);
      onToggleStatus(activePt.id, 'WARNING');
      toast(`⚠️ Dimensi visual #${activePt.pointNumber} mendekati batas toleransi (Marginal)!`, { icon: '🟡' });
      setTimeout(() => onCommit(activePt.id, val), 200);
    } else if (decision === 'REJECT') {
      const val = `FAIL (${selectedDefectCategory} Melebihi Limit Sample)`;
      setInputValue(val);
      onChange(activePt.id, val);
      onToggleStatus(activePt.id, 'NG');
      toast.error(`✕ Dimensi visual #${activePt.pointNumber} DITOLAK (Melebihi Limit Sample)!`, { icon: '🔴' });
      setTimeout(() => onCommit(activePt.id, val), 200);
    }
  };

  // ─── Camera Evidence Photo Capture ───
  const handleCaptureEvidence = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        setCapturedEvidenceImg(dataUrl);
        activePt.evidenceImg = dataUrl;
        toast.success('📸 Foto bukti aktual part berhasil dilampirkan!');
      };
      reader.readAsDataURL(file);
    }
  };

  // ─── Real-Time Tolerance Gauge Calculations (Dimensional Mode) ───
  const nominal = parseFloat(activePt.nominal) || 0;
  const tolMin = parseFloat(activePt.tolMin) !== undefined ? parseFloat(activePt.tolMin) : nominal - 0.1;
  const tolMax = parseFloat(activePt.tolMax) !== undefined ? parseFloat(activePt.tolMax) : nominal + 0.1;
  const tolRange = tolMax - tolMin || 0.2;

  const currentValNum = parseFloat(inputValue);
  const hasValidInput = !isNaN(currentValNum);

  const delta = hasValidInput ? currentValNum - nominal : 0;
  const deltaFormatted = (delta >= 0 ? '+' : '') + delta.toFixed(3);

  const barPercent = hasValidInput
    ? Math.max(0, Math.min(100, ((currentValNum - tolMin) / tolRange) * 100))
    : 50;

  const isOutOfSpec = hasValidInput && (currentValNum < tolMin || currentValNum > tolMax);
  const isNearLimit = hasValidInput && !isOutOfSpec && (barPercent < 20 || barPercent > 80);
  const isOptimal = hasValidInput && !isOutOfSpec && !isNearLimit;

  const computedStatus = isOutOfSpec ? 'NG' : (activePt.status === 'OK' || isOptimal ? 'OK' : activePt.status || 'PENDING');
  const inputColor = isOutOfSpec ? '#ef4444' : isNearLimit ? '#f59e0b' : computedStatus === 'OK' ? '#22c55e' : '#38bdf8';
  const borderColor = isOutOfSpec ? '#ef4444' : isNearLimit ? '#f59e0b' : '#38bdf8';

  // ─── Direct Bluetooth Gauge Trigger Simulation ───
  const handleSyncBluetoothGauge = () => {
    const randomOffset = (Math.random() - 0.48) * (tolRange * 0.4);
    const measured = (nominal + randomOffset).toFixed(3);
    handleInputChange(measured);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  // ─── Voice Recognition / Speech Input ───
  const handleToggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice Speech API tidak didukung di browser ini. Harap gunakan Chrome / Edge.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListeningVoice(true);
    recognition.onend = () => setIsListeningVoice(false);
    recognition.onerror = () => setIsListeningVoice(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      const cleanNum = transcript
        .replace(/koma|titik/g, '.')
        .replace(/[^0-9.]/g, '');
      if (cleanNum) {
        handleInputChange(cleanNum);
      }
    };
    recognition.start();
  };

  // Default Fallback Sample Images / Illustrations
  const goldenSampleImg = activePt.goldenSampleImg || null;
  const limitSampleImg = activePt.limitSampleImg || null;
  const rejectSampleImg = activePt.rejectSampleImg || null;

  return (
    <div style={{ flex: 1, height: '100%', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', backgroundColor: '#090d16' }}>
      
      {/* ── 1. ENTERPRISE SAMPLE & TOOL TRACKING HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: '6px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>SAMPLE:</span>
          <select
            value={samplePiece}
            onChange={(e) => setSamplePiece(Number(e.target.value))}
            style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '5px', padding: '2px 5px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
          >
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Piece #{n}</option>)}
          </select>
          <select
            value={cavityNo}
            onChange={(e) => setCavityNo(Number(e.target.value))}
            style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '5px', padding: '2px 5px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
          >
            {[1, 2, 3, 4].map(c => <option key={c} value={c}>Cavity #{c}</option>)}
          </select>
        </div>

        {/* Action icons / Tool Sync */}
        {!isVisualPoint ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button
              onClick={handleSyncBluetoothGauge}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid #22c55e',
                color: '#22c55e',
                padding: '2px 6px',
                borderRadius: '5px',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
              title="Ambil nilai terkini dari Bluetooth Caliper / Tool"
            >
              <Wifi size={11} />
              <span>Sync Tool</span>
            </button>
            <button
              onClick={handleToggleVoiceInput}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isListeningVoice ? '#ef4444' : '#1e293b',
                border: isListeningVoice ? '1px solid #ef4444' : '1px solid #334155',
                color: isListeningVoice ? 'white' : '#94a3b8',
                padding: '3px 5px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
              title="Hands-free Voice Dictation"
            >
              <Mic size={12} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.65rem', backgroundColor: '#10b981', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
              👁️ Visual Limit Sample
            </span>
          </div>
        )}
      </div>

      {/* ── 2. ACTIVE POINT METADATA & TOLERANCE BADGES ── */}
      <div style={{ backgroundColor: '#0f172a', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#38bdf8' }}>
              #{activePt.pointNumber} {activePt.title}
            </span>
            <span style={{
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '0.65rem',
              fontWeight: 900,
              backgroundColor: isOutOfSpec || activePt.status === 'NG' ? '#ef4444' : activePt.status === 'OK' ? '#22c55e' : activePt.status === 'WARNING' ? '#f59e0b' : '#334155',
              color: 'white'
            }}>
              {activePt.status || 'PENDING'}
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>
            {activePt.criticality || 'Visual Characteristic'}
          </span>
        </div>

        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Kategori: <strong style={{ color: '#10b981' }}>{activePt.category || 'Visual & Surface'}</strong></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            Metode: <strong style={{ color: '#38bdf8' }}>{isVisualPoint ? 'Visual Limit Comparator' : (activePt.toolId || toolDef.name)}</strong>
            {!isVisualPoint && (
              <button
                type="button"
                onClick={() => onOpenCalibration && onOpenCalibration(toolDef.id)}
                style={{
                  padding: '1px 6px',
                  borderRadius: '3px',
                  fontSize: '0.58rem',
                  fontWeight: 900,
                  backgroundColor: calStat.bg,
                  border: `1px solid ${calStat.border}`,
                  color: calStat.color,
                  cursor: onOpenCalibration ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title={`Status Kalibrasi: ${calStat.label}. Klik untuk lihat detail kalibrasi.`}
              >
                <span>{calStat.icon}</span>
                <span>{isToolExpired ? 'CAL EXPIRED' : calStat.status === 'VALID' ? 'CAL OK' : 'CAL DUE'}</span>
              </button>
            )}
          </span>
        </div>
      </div>

      {/* ⛔ TOOL CALIBRATION EXPIRED LOCKOUT BANNER (ISO 9001: 7.1.5) */}
      {!isVisualPoint && isToolExpired && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.16)',
          border: '1.5px solid #ef4444',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'pulse 1.8s infinite'
        }}>
          <span style={{ fontSize: '18px' }}>⛔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#ef4444' }}>
              KALIBRASI ALAT EXPIRED — INPUT DIBLOKIR (ISO 9001: 7.1.5)
            </div>
            <div style={{ fontSize: '0.62rem', color: '#fca5a5', lineHeight: 1.3 }}>
              Alat ukur <strong>{toolDef.name} ({toolDef.code})</strong> telah kedaluwarsa sejak {toolDef.calibrationDueDate}. Input hasil ukur dinonaktifkan hingga alat dikalibrasi ulang.
            </div>
          </div>
          {onOpenCalibration && (
            <button
              type="button"
              onClick={() => onOpenCalibration(toolDef.id)}
              style={{
                padding: '5px 10px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '0.65rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Kalibrasi Ulang
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODE A: VISUAL & SURFACE LIMIT SAMPLE COMPARATOR (ISO 9001: 8.5.1)
          ══════════════════════════════════════════════════════════════════ */}
      {isVisualPoint ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          
          {/* Defect Classification Pills */}
          <div style={{ backgroundColor: '#0f172a', padding: '6px 8px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
              Klasifikasi Cacat Visual (Defect Type):
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['Scratch / Goresan', 'Painting / Cat Belang', 'Burr / Ketajaman', 'Pinhole / Porosi', 'Dent / Penyok', 'Weld Bead'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedDefectCategory(cat)}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '4px',
                    fontSize: '0.64rem',
                    fontWeight: 700,
                    backgroundColor: selectedDefectCategory === cat ? '#0284c7' : '#1e293b',
                    color: selectedDefectCategory === cat ? '#ffffff' : '#94a3b8',
                    border: selectedDefectCategory === cat ? '1px solid #38bdf8' : '1px solid #334155',
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Way Limit Sample Photo Cards (Golden vs Limit Boundary vs NG Defect) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            
            {/* 1. Golden Sample (OK) */}
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1.5px solid #22c55e', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#22c55e', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <ShieldCheck size={11} /> GOLDEN (OK)
                </span>
              </div>
              <div
                onClick={() => setZoomModalImg(goldenSampleImg || 'golden')}
                style={{
                  height: '65px',
                  backgroundColor: '#020617',
                  borderRadius: '4px',
                  border: '1px solid #166534',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {goldenSampleImg ? (
                  <img src={goldenSampleImg} alt="Golden Sample" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#22c55e', fontSize: '0.6rem', padding: '4px' }}>
                    ✨ Permukaan Mulus Bebas Cacat (0 Defect)
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '1px 3px', borderRadius: '2px' }}>
                  <Maximize2 size={9} color="#fff" />
                </div>
              </div>
              <div style={{ fontSize: '0.58rem', color: '#86efac', lineHeight: 1.2 }}>
                {activePt.goldenSpec || 'Permukaan halus, cat rata, bebas gores & porosi.'}
              </div>
            </div>

            {/* 2. Limit Sample Boundary (Acceptable Limit) */}
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1.5px solid #f59e0b', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <AlertTriangle size={11} /> LIMIT SAMPLE
                </span>
              </div>
              <div
                onClick={() => setZoomModalImg(limitSampleImg || 'limit')}
                style={{
                  height: '65px',
                  backgroundColor: '#020617',
                  borderRadius: '4px',
                  border: '1px solid #854d0e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {limitSampleImg ? (
                  <img src={limitSampleImg} alt="Limit Boundary" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#f59e0b', fontSize: '0.6rem', padding: '4px' }}>
                    📏 Batas Scratch ≤ 2mm / Pinhole ≤ 0.3mm
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '1px 3px', borderRadius: '2px' }}>
                  <Maximize2 size={9} color="#fff" />
                </div>
              </div>
              <div style={{ fontSize: '0.58rem', color: '#fde047', lineHeight: 1.2 }}>
                {activePt.limitSpec || 'Batas maksimal cacat yang masih boleh diterima (Pass).'}
              </div>
            </div>

            {/* 3. NG Defect Sample (Reject) */}
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1.5px solid #ef4444', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <XCircle size={11} /> REJECT (NG)
                </span>
              </div>
              <div
                onClick={() => setZoomModalImg(rejectSampleImg || 'reject')}
                style={{
                  height: '65px',
                  backgroundColor: '#020617',
                  borderRadius: '4px',
                  border: '1px solid #991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {rejectSampleImg ? (
                  <img src={rejectSampleImg} alt="Reject Defect" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.6rem', padding: '4px' }}>
                    🚫 Scratch &gt; 2mm / Tembus Dasar Cat
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '1px 3px', borderRadius: '2px' }}>
                  <Maximize2 size={9} color="#fff" />
                </div>
              </div>
              <div style={{ fontSize: '0.58rem', color: '#fca5a5', lineHeight: 1.2 }}>
                {activePt.rejectSpec || 'Cacat melebihi batas limit sample wajib ditolak (Reject).'}
              </div>
            </div>
          </div>

          {/* Actual Camera Evidence Snapshot Attachment */}
          <div style={{ backgroundColor: '#0f172a', padding: '6px 8px', borderRadius: '8px', border: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={14} color="#38bdf8" />
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f8fafc' }}>
                Foto Bukti Aktual Produk:
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {capturedEvidenceImg ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <img
                    src={capturedEvidenceImg}
                    alt="Evidence"
                    onClick={() => setZoomModalImg(capturedEvidenceImg)}
                    style={{ width: '26px', height: '26px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #38bdf8' }}
                  />
                  <button
                    onClick={() => setCapturedEvidenceImg(null)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800 }}
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <label style={{
                  padding: '3px 8px',
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #0284c7',
                  borderRadius: '5px',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Upload size={11} />
                  <span>Ambil Foto</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleCaptureEvidence} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>

          {/* 1-Tap Visual Decision Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px', marginTop: 'auto' }}>
            
            {/* ACCEPT BUTTON */}
            <button
              onClick={() => handleVisualDecision('ACCEPT')}
              style={{
                padding: '12px 6px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                boxShadow: '0 2px 10px rgba(22, 163, 74, 0.4)'
              }}
            >
              <Check size={16} strokeWidth={3} />
              <span>✓ ACCEPT (OK)</span>
            </button>

            {/* MARGINAL BUTTON */}
            <button
              onClick={() => handleVisualDecision('MARGINAL')}
              style={{
                padding: '12px 6px',
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                boxShadow: '0 2px 10px rgba(217, 119, 6, 0.4)'
              }}
            >
              <AlertTriangle size={14} />
              <span>MARGINAL</span>
            </button>

            {/* REJECT BUTTON */}
            <button
              onClick={() => handleVisualDecision('REJECT')}
              style={{
                padding: '12px 6px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                boxShadow: '0 2px 10px rgba(220, 38, 38, 0.4)'
              }}
            >
              <X size={16} strokeWidth={3} />
              <span>✕ REJECT</span>
            </button>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
           MODE B: NUMERICAL DIMENSIONAL TOLERANCE & NUMPAD STUDIO
           ══════════════════════════════════════════════════════════════════ */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          opacity: isToolExpired ? 0.35 : 1,
          pointerEvents: isToolExpired ? 'none' : 'auto',
          filter: isToolExpired ? 'grayscale(0.7)' : 'none',
          transition: 'all 0.2s ease',
          userSelect: isToolExpired ? 'none' : 'auto'
        }}>
          {/* ── 3. 7-SEGMENT DIGITAL DISPLAY SCREEN ── */}
          <div style={{
            backgroundColor: '#020617',
            border: `2px solid ${borderColor}`,
            borderRadius: '10px',
            padding: '8px 12px',
            textAlign: 'center',
            animation: isOutOfSpec ? 'blink-red 0.8s ease-in-out infinite' : 'none',
            boxShadow: isOutOfSpec ? '0 0 16px rgba(239, 68, 68, 0.4), inset 0 2px 6px rgba(0,0,0,0.9)' : computedStatus === 'OK' ? '0 0 14px rgba(34, 197, 94, 0.3), inset 0 2px 6px rgba(0,0,0,0.9)' : 'inset 0 3px 6px rgba(0,0,0,0.95)'
          }}>
            <style>{`
              @keyframes blink-red {
                0%, 100% { border-color: #ef4444; }
                50% { border-color: #7f1d1d; }
              }
            `}</style>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '2.4rem',
                fontWeight: 900,
                fontFamily: "'Orbitron', 'Share Tech Mono', monospace",
                letterSpacing: '1px',
                color: inputColor,
                textShadow: `0 0 10px ${isOutOfSpec ? 'rgba(239, 68, 68, 0.7)' : computedStatus === 'OK' ? 'rgba(34, 197, 94, 0.7)' : 'rgba(56, 189, 248, 0.6)'}`,
                minWidth: '150px'
              }}>
                {inputValue || '0.000'}
              </span>
              <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 800, fontFamily: "'Orbitron', monospace" }}>
                {activePt.unit}
              </span>
            </div>
            {/* Real-Time Deviation Metric */}
            {hasValidInput && (
              <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.68rem', fontWeight: 800 }}>
                <span style={{ color: delta === 0 ? '#38bdf8' : isOutOfSpec ? '#ef4444' : '#22c55e' }}>
                  Δ Dev: {deltaFormatted} {activePt.unit}
                </span>
                <span style={{ color: '#64748b' }}>•</span>
                <span style={{ color: isOutOfSpec ? '#ef4444' : isNearLimit ? '#f59e0b' : '#22c55e' }}>
                  {isOutOfSpec ? '⚠️ DI LUAR TOLERANSI (NG)' : isNearLimit ? '⚠️ MENDEKATI BATAS' : '✓ OPTIMAL'}
                </span>
              </div>
            )}
            {isOutOfSpec && (
              <div style={{
                fontSize: '0.72rem',
                color: '#f87171',
                fontWeight: 800,
                marginTop: '2px',
                letterSpacing: '0.5px'
              }}>
                ⚠️ NILAI DI LUAR TOLERANSI (SPEC: {tolMin.toFixed(3)} ~ {tolMax.toFixed(3)})
              </div>
            )}
          </div>

          {/* ── 4. ANALOG TOLERANCE SCALE (LSL, NOMINAL, USL) ── */}
          <div style={{ backgroundColor: '#0f172a', padding: '6px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', marginBottom: '4px' }}>
              <span>LSL: <b style={{ color: '#f87171' }}>{tolMin.toFixed(3)}</b></span>
              <span>Nom: <b style={{ color: '#38bdf8' }}>{nominal.toFixed(3)}</b></span>
              <span>USL: <b style={{ color: '#f87171' }}>{tolMax.toFixed(3)}</b></span>
            </div>
            <div style={{ position: 'relative', height: '10px', backgroundColor: '#1e293b', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                left: '20%',
                right: '20%',
                top: 0,
                bottom: 0,
                backgroundColor: 'rgba(34, 197, 94, 0.3)',
                borderLeft: '2px solid #22c55e',
                borderRight: '2px solid #22c55e'
              }} />
              {hasValidInput && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: isOutOfSpec ? '#ef4444' : '#22c55e',
                    left: `${barPercent}%`,
                    transform: 'translateX(-50%)',
                    boxShadow: '0 0 6px white'
                  }}
                />
              )}
            </div>
          </div>

          {/* ── 5. COMPACT TOUCH KEYPAD WITH SMART SPEC TOLERANCE AUDIO & VISUAL FEEDBACK ── */}
          <NumpadInput
            value={inputValue}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            tolMin={tolMin}
            tolMax={tolMax}
            isOutOfSpec={isOutOfSpec}
          />

          {/* ── 6. ACTION BUTTONS: OK, SIMPAN, NG ── */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '1px' }}>
            <button
              onClick={() => {
                onToggleStatus(activePt.id, 'OK');
                handleInputChange(nominal.toString());
              }}
              style={{
                flex: 1,
                padding: '11px',
                backgroundColor: computedStatus === 'OK' && !isOutOfSpec ? '#22c55e' : '#1e293b',
                color: computedStatus === 'OK' && !isOutOfSpec ? '#0f172a' : '#94a3b8',
                border: computedStatus === 'OK' && !isOutOfSpec ? '1px solid #22c55e' : '1px solid #334155',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: computedStatus === 'OK' && !isOutOfSpec ? '0 0 12px rgba(34, 197, 94, 0.35)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              OK
            </button>
            <button
              onClick={handleSubmit}
              style={{
                flex: 2,
                padding: '11px',
                backgroundColor: isOutOfSpec ? '#ef4444' : '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: isOutOfSpec ? '0 0 12px rgba(239, 68, 68, 0.4)' : '0 0 12px rgba(2, 132, 199, 0.35)',
                letterSpacing: '0.5px',
                transition: 'all 0.15s'
              }}
            >
              {isOutOfSpec ? 'SIMPAN (NG) ⚠️' : 'SIMPAN ➔'}
            </button>
            <button
              onClick={() => onToggleStatus(activePt.id, 'NG')}
              style={{
                flex: 1,
                padding: '11px',
                backgroundColor: isOutOfSpec || computedStatus === 'NG' ? '#ef4444' : '#1e293b',
                color: 'white',
                border: isOutOfSpec || computedStatus === 'NG' ? '1px solid #ef4444' : '1px solid #334155',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: isOutOfSpec || computedStatus === 'NG' ? '0 0 12px rgba(239, 68, 68, 0.35)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              NG
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL ZOOM LIMIT SAMPLE PHOTO ─── */}
      {zoomModalImg && (
        <div
          onClick={() => setZoomModalImg(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '16px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.9)' }}>
            <h4 style={{ margin: '0 0 10px', color: '#f8fafc', fontSize: '0.9rem' }}>
              🔍 Inspeksi Limit Sample Resolusi Tinggi
            </h4>
            <div style={{ width: '100%', height: '260px', backgroundColor: '#020617', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {typeof zoomModalImg === 'string' && zoomModalImg.startsWith('data:') ? (
                <img src={zoomModalImg} alt="Zoomed Sample" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '20px' }}>
                  Standar Limit Sample Visual ISO 9001 Clause 8.5.1
                </div>
              )}
            </div>
            <button
              onClick={() => setZoomModalImg(null)}
              style={{ marginTop: '12px', padding: '8px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}
            >
              Tutup Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
