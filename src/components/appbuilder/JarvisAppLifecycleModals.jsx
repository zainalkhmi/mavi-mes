import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Bot, CheckCircle2, AlertTriangle, XCircle,
  Play, RotateCcw, Wrench, X, Mic, MicOff, Send, Check,
  Activity, ArrowRight, Layers, FileCode, ShieldAlert,
  Loader2, ThumbsUp, ChevronRight, Monitor, Smartphone, Tablet
} from 'lucide-react';

export const DEVICE_OPTIONS = [
  { id: 'LAPTOP_HD', label: 'Laptop (1280×720)', sub: '720p HD Standard', icon: Monitor },
  { id: 'DESKTOP_FHD', label: 'PC / Desktop (1920×1080)', sub: '1080p Full HD', icon: Monitor },
  { id: 'IPHONE_14', label: 'Mobile (393×852)', sub: 'Smartphone Portrait', icon: Smartphone },
  { id: 'IPAD_PRO', label: 'Tablet (1024×1366)', sub: 'iPad / Tablet Touch', icon: Tablet }
];

/**
 * 1. JarvisPreCodingModal
 * Holographic briefing displayed BEFORE coding starts.
 * Informs the user what app is being made, the step-by-step plan,
 * confirms the target device (Laptop, PC, Mobile),
 * and requests user approval ("OK" or "Review/Revisi").
 */
export function JarvisPreCodingModal({
  isOpen,
  onClose,
  appName = 'Aplikasi MAVI MES',
  appCategory = 'General',
  planDescription = '',
  planDetails = {},
  initialDevice = 'LAPTOP_HD',
  onApproveOk,
  onRequestReview,
  speak
}) {
  const [mode, setMode] = useState('BRIEFING'); // 'BRIEFING' | 'REVISE_INPUT'
  const [revisionText, setRevisionText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(initialDevice || 'LAPTOP_HD');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setMode('BRIEFING');
      setRevisionText('');
      setIsListening(false);
      setSelectedDevice(initialDevice || 'LAPTOP_HD');

      // Jarvis Voice Narration before coding with device confirmation inquiry
      if (speak) {
        const screensCount = planDetails?.screens?.length || 1;
        const widgetsCount = planDetails?.widgetsCount || planDetails?.commandsCount || 0;
        const speechText = `Halo! Saya telah menyiapkan rencana pembuatan aplikasi ${appName}. Rencana ini mencakup ${screensCount} layar dan sekitar ${widgetsCount} komponen. Sebelum mulai coding, mohon konfirmasi target device yang akan digunakan: Laptop, PC, atau Mobile?`;
        speak(speechText);
      }
    }
  }, [isOpen, appName, initialDevice]);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (!SpeechRecognition) {
      alert('Fitur input suara tidak didukung browser ini. Silakan ketik revisi Anda.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'id-ID';
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => setIsListening(true);
      rec.onresult = (event) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setRevisionText(text);
        if (event.results[0].isFinal) setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const handleConfirm = () => {
    if (speak) {
      const devObj = DEVICE_OPTIONS.find(d => d.id === selectedDevice);
      const devLabel = devObj ? devObj.label.split(' ')[0] : 'Device';
      speak(`Baik, target device disetel ke ${devLabel}. Rencana disetujui! Saya sedang coding dengan tata letak presisi.`);
    }
    if (onApproveOk) onApproveOk(selectedDevice);
    onClose();
  };

  const handleSubmitRevision = () => {
    const text = revisionText.trim();
    if (!text) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (onRequestReview) onRequestReview(text);
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 100010,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '520px',
          maxWidth: '92vw',
          backgroundColor: 'rgba(3, 14, 26, 0.96)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid #00e5ff',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 229, 255, 0.35)',
          color: '#f8fafc',
          zIndex: 100011,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 229, 255, 0.5)'
            }}>
              <Bot size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.08em' }}>
                JARVIS • PRE-CODING BRIEFING
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                Rencana Pembuatan Aplikasi
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {mode === 'BRIEFING' ? (
          <>
            {/* App Info Box */}
            <div style={{
              padding: '14px 16px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>NAMA APLIKASI:</span>
                <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '9999px', fontWeight: 800 }}>
                  {appCategory}
                </span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                {appName}
              </div>
              {planDescription && (
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.4', marginTop: '4px' }}>
                  {planDescription}
                </div>
              )}
            </div>

            {/* Plan Overview Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.66rem', color: '#94a3b8', fontWeight: 600 }}>JUMLAH SCREEN</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>
                  {planDetails?.screens?.length || 1} Layar
                </div>
              </div>
              <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.66rem', color: '#94a3b8', fontWeight: 600 }}>KOMPONEN</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                  ~{planDetails?.widgetsCount || planDetails?.commandsCount || 5} Widget
                </div>
              </div>
              <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.66rem', color: '#94a3b8', fontWeight: 600 }}>LOGIKA & TRIGGER</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>
                  {planDetails?.triggersCount || 'Otomatis'}
                </div>
              </div>
            </div>

            {/* Planned Screens Pill List */}
            {planDetails?.screens && planDetails.screens.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>ALUR LAYAR (SCREENS):</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {planDetails.screens.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        color: '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ color: '#38bdf8', fontWeight: 800 }}>{idx + 1}.</span>
                      {typeof s === 'string' ? s : (s.title || s.name || `Screen ${idx + 1}`)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Target Device Confirmation (Presisi sesuai Device) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>
                  TARGET DEVICE (KONFIRMASI DISPLAY PRESISI):
                </span>
                <span style={{ fontSize: '0.68rem', color: '#00e5ff', fontWeight: 800 }}>
                  {DEVICE_OPTIONS.find(d => d.id === selectedDevice)?.label || selectedDevice}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {DEVICE_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = selectedDevice === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedDevice(opt.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.16)' : 'rgba(15, 23, 42, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 14px rgba(0, 229, 255, 0.35)' : 'none'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? '#00e5ff' : 'rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={16} color={isSelected ? '#020617' : '#94a3b8'} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: isSelected ? '#ffffff' : '#cbd5e1',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}>
                          {opt.label.split(' ')[0]}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: isSelected ? '#7dd3fc' : '#64748b' }}>
                          {opt.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Jarvis Question Box */}
            <div style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(2, 132, 199, 0.1)',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Sparkles size={18} color="#38bdf8" />
              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                Target device terpasang presisi. Klik <strong>OK</strong> untuk mulai koding, atau <strong>Review</strong> untuk merevisi rencana terlebih dahulu.
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setMode('REVISE_INPUT')}
                style={{
                  flex: 1,
                  padding: '11px',
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.18s'
                }}
              >
                Review / Revisi Plan
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  flex: 1.4,
                  padding: '11px',
                  background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
                  color: '#020617',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(0, 229, 255, 0.4)'
                }}
              >
                <CheckCircle2 size={16} /> OK, Jalankan Coding
              </button>
            </div>
          </>
        ) : (
          /* REVISE INPUT MODE */
          <>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Jelaskan bagian rencana yang ingin disesuaikan atau diubah:
            </div>

            <div style={{ position: 'relative' }}>
              <textarea
                rows={4}
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
                placeholder="Contoh: Tambahkan tombol back di screen 2, dan ganti field operator menjadi dropdown..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(2, 6, 23, 0.8)',
                  border: '1.5px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#f8fafc',
                  fontSize: '0.84rem',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <button
                type="button"
                onClick={toggleListening}
                style={{
                  position: 'absolute',
                  right: '10px',
                  bottom: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isListening ? '#ef4444' : 'rgba(56, 189, 248, 0.2)',
                  border: isListening ? 'none' : '1px solid rgba(56, 189, 248, 0.5)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setMode('BRIEFING')}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#1e293b',
                  color: '#cbd5e1',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Kembali ke Rencana
              </button>
              <button
                type="button"
                onClick={handleSubmitRevision}
                disabled={!revisionText.trim()}
                style={{
                  flex: 1.4,
                  padding: '10px',
                  background: revisionText.trim() ? 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)' : '#334155',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: revisionText.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Send size={14} /> Kirim Revisi ke Copilot
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/**
 * 2. JarvisTestSimulatorModal
 * Real-time floating simulation HUD displayed during App Registry testing.
 */
export function JarvisTestSimulatorModal({
  isOpen,
  appName = 'Aplikasi',
  currentStep = '',
  progress = 0,
  total = 0,
  passed = 0,
  failed = 0,
  onAbort
}) {
  if (!isOpen) return null;

  const percent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100020,
        width: '480px',
        maxWidth: '92vw',
        backgroundColor: 'rgba(3, 14, 26, 0.94)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid #38bdf8',
        borderRadius: '18px',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.3)',
        color: '#f8fafc',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0284c7, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.05em' }}>
              JARVIS • APP REGISTRY TEST SIMULATOR
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>
              Menguji {appName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>
            {passed} Lulus
          </span>
          {failed > 0 && (
            <span style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 700 }}>
              {failed} Gagal
            </span>
          )}
          {onAbort && (
            <button
              type="button"
              onClick={onAbort}
              style={{
                padding: '4px 10px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '6px',
                color: '#f87171',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Hentikan
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '9999px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: 'linear-gradient(90deg, #38bdf8, #10b981)',
          transition: 'width 0.3s ease'
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#cbd5e1' }}>
        <Loader2 size={13} className="animate-spin" color="#38bdf8" />
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {currentStep || 'Memverifikasi arsitektur & komponen...'}
        </span>
        <span style={{ color: '#94a3b8', fontWeight: 600 }}>
          {progress}/{total}
        </span>
      </div>
    </div>
  );
}

/**
 * 3. JarvisTestResultModal
 * Displayed after test simulation finishes.
 * If PASSED: Celebrates completion.
 * If FAILED: Displays diagnosed errors & asks user approval:
 * "Apakah Anda ingin saya merevisinya secara otomatis atau tidak?"
 */
export function JarvisTestResultModal({
  isOpen,
  onClose,
  testResults = {},
  appName = 'Aplikasi',
  onApplyAutoFix,
  onSkipRevision,
  onOpenTestStudio,
  speak
}) {
  const { total = 0, passed = 0, failed = 0, durationMs = 0, bugs = [] } = testResults;
  const isAllPassed = failed === 0 && total > 0;

  useEffect(() => {
    if (isOpen && speak) {
      if (isAllPassed) {
        speak(`Luar biasa! Seluruh ${passed} pengujian App Registry berhasil seratus persen. Aplikasi Anda sehat dan siap digunakan.`);
      } else {
        speak(`Perhatian. Ditemukan ${failed} kegagalan dalam pengujian App Registry. Apakah Anda ingin saya merevisinya secara otomatis atau tidak?`);
      }
    }
  }, [isOpen, isAllPassed, passed, failed]);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 100030,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '520px',
          maxWidth: '92vw',
          backgroundColor: 'rgba(3, 14, 26, 0.96)',
          backdropFilter: 'blur(20px)',
          border: isAllPassed ? '1.5px solid #10b981' : '1.5px solid #ef4444',
          borderRadius: '24px',
          boxShadow: isAllPassed
            ? '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(16, 185, 129, 0.35)'
            : '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(239, 68, 68, 0.35)',
          color: '#f8fafc',
          zIndex: 100031,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: isAllPassed
                ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                : 'linear-gradient(135deg, #dc2626 0%, #f43f5e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isAllPassed ? '0 0 16px rgba(16, 185, 129, 0.5)' : '0 0 16px rgba(239, 68, 68, 0.5)'
            }}>
              {isAllPassed ? <CheckCircle2 size={24} color="#ffffff" /> : <ShieldAlert size={24} color="#ffffff" />}
            </div>
            <div>
              <div style={{
                fontSize: '0.7rem',
                color: isAllPassed ? '#34d399' : '#f87171',
                fontWeight: 800,
                letterSpacing: '0.08em'
              }}>
                JARVIS • HASIL PENGUJIAN APP REGISTRY
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                {isAllPassed ? 'Pengujian 100% Berhasil!' : `${failed} Isu Terdeteksi Pada Pengujian`}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Metrics Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>TOTAL TEST</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{total}</div>
          </div>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.64rem', color: '#6ee7b7' }}>LULUS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{passed}</div>
          </div>
          <div style={{ backgroundColor: failed > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(15, 23, 42, 0.7)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.64rem', color: failed > 0 ? '#fca5a5' : '#94a3b8' }}>GAGAL</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: failed > 0 ? '#ef4444' : '#94a3b8' }}>{failed}</div>
          </div>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>DURASI</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>{durationMs}ms</div>
          </div>
        </div>

        {isAllPassed ? (
          /* SUCCESS CASE */
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '0.84rem', color: '#f8fafc', fontWeight: 700 }}>
              Semua rute, selector widget, data binding, dan trigger terverifikasi valid!
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Aplikasi {appName} telah lulus uji coba simulator otomatis berdasarkan kontrak spesifikasi 13 file App Registry.
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              {onOpenTestStudio && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenTestStudio(); }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Buka App Test Studio
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1.2,
                  padding: '10px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Selesai & Gunakan App
              </button>
            </div>
          </div>
        ) : (
          /* FAILURE CASE: Ask for revision approval */
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.74rem', color: '#f87171', fontWeight: 700 }}>
                DAFTAR KEGAGALAN TEST REGISTRY:
              </div>
              {bugs.map((bug, idx) => (
                <div
                  key={bug.id || idx}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: '0.76rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fca5a5', fontWeight: 700 }}>
                    <span>[{bug.category || bug.type}] {bug.component || 'Test Step'}</span>
                    <span style={{ fontSize: '0.66rem' }}>{bug.severity}</span>
                  </div>
                  <div style={{ color: '#94a3b8' }}>{bug.actual || bug.message}</div>
                </div>
              ))}
            </div>

            {/* Jarvis Decision Prompt Box */}
            <div style={{
              padding: '14px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#f43f5e" />
                Apakah Anda ingin saya merevisinya secara otomatis?
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                Jarvis & AI Bug Analyzer dapat merumuskan patch perbaikan (membuat variabel yang hilang, membetulkan data binding, atau menyesuaikan trigger) lalu menjalankan ulang pengujian.
              </div>
            </div>

            {/* Decision Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  if (speak) speak('Baik, revisi dilewati.');
                  if (onSkipRevision) onSkipRevision();
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: '11px',
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Tidak / Lewati
              </button>
              <button
                type="button"
                onClick={() => {
                  if (speak) speak('Memulai proses revisi dan perbaikan otomatis oleh AI...');
                  if (onApplyAutoFix) onApplyAutoFix(bugs);
                  onClose();
                }}
                style={{
                  flex: 1.4,
                  padding: '11px',
                  background: 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(220, 38, 38, 0.4)'
                }}
              >
                <Wrench size={16} /> Ya, Revisi Otomatis (AI Fix)
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
