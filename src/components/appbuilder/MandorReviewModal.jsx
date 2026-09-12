import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2, Edit3, X, Mic, MicOff, Send, Sparkles, Bot,
  ArrowRight, MessageSquare, ThumbsUp, RotateCcw
} from 'lucide-react';

/**
 * MandorReviewModal
 * Interactive confirmation dialog displayed when Mandor App / Ghost Pilot
 * completes building the application.
 * Allows user to confirm "Sudah Sesuai (OK)" or request "Revisi (Review)"
 * with voice speech & prompt execution.
 */
export default function MandorReviewModal({
  isOpen,
  onClose,
  onOk,
  onSubmitRevision,
  speak
}) {
  const [mode, setMode] = useState('CONFIRM'); // 'CONFIRM' | 'REVIEW_INPUT'
  const [revisionText, setRevisionText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setMode('CONFIRM');
      setRevisionText('');
      setIsListening(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Speech Recognition for dictating revision
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
      alert('Fitur suara tidak didukung browser ini. Silakan ketik revisi Anda.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'id-ID';
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setRevisionText(text);
        if (event.results[0].isFinal) {
          setIsListening(false);
        }
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('[MandorReviewModal] Mic error:', err);
      setIsListening(false);
    }
  };

  // User confirms app is OK
  const handleConfirmOk = () => {
    if (speak) {
      speak('Baik, terima kasih! Selamat menggunakan aplikasi buatan Anda.');
    }
    if (onOk) onOk();
    onClose();
  };

  // User wants to review / revise
  const handleStartReview = () => {
    setMode('REVIEW_INPUT');
    if (speak) {
      speak('Apa yang perlu saya revisi atau sesuaikan? Silakan jelaskan.');
    }
  };

  // Submit revision prompt
  const handleSubmitRevision = () => {
    const text = revisionText.trim();
    if (!text) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    if (onSubmitRevision) {
      onSubmitRevision(text);
    }
    onClose();
  };

  const quickRevisionChips = [
    'Ubah warna tema dan tombol',
    'Tambahkan tombol navigasi kembali',
    'Perbaiki ukuran tata letak widget',
    'Tambahkan kolom tanggal dan waktu'
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(3, 11, 20, 0.65)',
          backdropFilter: 'blur(8px)',
          zIndex: 100005,
          animation: 'fadeInModal 0.2s ease-out'
        }}
      />

      {/* Holographic Modal Container */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '460px',
          maxWidth: '92vw',
          backgroundColor: 'rgba(3, 14, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid #00e5ff',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 229, 255, 0.35)',
          color: '#f8fafc',
          zIndex: 100006,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          animation: 'scaleInModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header with Mandor App Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'radial-gradient(circle at center, #0284c7 0%, #032b43 100%)',
                border: '1.5px solid #00e5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0, 229, 255, 0.6)'
              }}
            >
              <Bot size={24} color="#00e5ff" />
            </div>

            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.8px', color: '#00e5ff' }}>
                MANDOR APP
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Konfirmasi Perakitan Aplikasi
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* MODE 1: Initial Question (Ok / Review) */}
        {mode === 'CONFIRM' && (
          <>
            <div
              style={{
                backgroundColor: 'rgba(0, 229, 255, 0.06)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#00e5ff" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                  Aplikasi Berhasil Dirakit!
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                Semua komponen kanvas, tabel, dan trigger telah selesai dipasang. Apakah aplikasi yang saya buat sudah sesuai, atau ada bagian yang perlu direvisi?
              </p>
            </div>

            {/* Confirmation Buttons: OK vs Review */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleConfirmOk}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <ThumbsUp size={16} />
                <span>Sudah Sesuai (OK)</span>
              </button>

              <button
                onClick={handleStartReview}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Edit3 size={16} />
                <span>Ada Revisi (Review)</span>
              </button>
            </div>
          </>
        )}

        {/* MODE 2: Revision Input Dialog */}
        {mode === 'REVIEW_INPUT' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
                  Apa yang perlu saya sesuaikan?
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Bisa diketik atau via suara
                </span>
              </div>

              {/* Textarea Input with Voice Mic button */}
              <div
                style={{
                  position: 'relative',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: `1.5px solid ${isListening ? '#00e5ff' : 'rgba(255, 255, 255, 0.15)'}`,
                  borderRadius: '14px',
                  padding: '12px',
                  transition: 'border-color 0.2s'
                }}
              >
                <textarea
                  rows={3}
                  value={revisionText}
                  onChange={(e) => setRevisionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitRevision();
                    }
                  }}
                  placeholder="Contoh: Ganti warna tombol simpan jadi hijau, atau tambahkan 1 input nomor telepon..."
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#f8fafc',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    resize: 'none'
                  }}
                  autoFocus
                />

                {/* Voice Dictation Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    onClick={toggleListening}
                    style={{
                      background: isListening ? '#ef4444' : 'rgba(0, 229, 255, 0.15)',
                      border: '1px solid rgba(0, 229, 255, 0.3)',
                      borderRadius: '8px',
                      color: isListening ? '#ffffff' : '#00e5ff',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                    <span>{isListening ? 'Berhenti Bicara' : 'Dikte Suara'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                Saran Cepat:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {quickRevisionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => setRevisionText(chip)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#cbd5e1',
                      fontSize: '10px',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: Cancel vs Submit Revision */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setMode('CONFIRM')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Kembali
              </button>

              <button
                onClick={handleSubmitRevision}
                disabled={!revisionText.trim()}
                style={{
                  flex: 1,
                  padding: '10px 18px',
                  background: revisionText.trim()
                    ? 'linear-gradient(135deg, #0284c7 0%, #00e5ff 100%)'
                    : '#475569',
                  color: revisionText.trim() ? '#020c14' : '#94a3b8',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: revisionText.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: revisionText.trim() ? '0 4px 15px rgba(0, 229, 255, 0.4)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Eksekusi Revisi Sekarang</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleInModal {
          from { opacity: 0; transform: translate(-50%, -46%) scale(0.92); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
