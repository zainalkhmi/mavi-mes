import React, { useState, useEffect } from 'react';
import {
  X, HelpCircle, Info, RotateCcw, Menu, ExternalLink, ShieldCheck,
  Activity, Wifi, Monitor, CheckCircle2, AlertTriangle, Play, Sparkles,
  ArrowRight, KeyRound, Lock, RefreshCw, Smartphone, Tablet
} from 'lucide-react';

/**
 * 1. TulipHelpModal
 * SOP, work instructions, and guidance for active step
 */
export function TulipHelpModal({ isOpen, onClose, appName, currentStep, helpGuide }) {
  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 100050
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '560px',
          maxWidth: '92vw',
          maxHeight: '85vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.2)',
          color: '#f8fafc',
          zIndex: 100051,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={18} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em' }}>
                PANDUAN KERJA (SOP) & BANTUAN
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>
                {currentStep?.title || appName}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.86rem', color: '#cbd5e1', lineHeight: '1.6' }}>
          {helpGuide ? (
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              {helpGuide}
            </div>
          ) : (
            <div style={{ padding: '16px', backgroundColor: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '12px' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#f8fafc' }}>
                📌 Standar Operasional Langkah:
              </p>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#cbd5e1' }}>
                <li>Pastikan part diletakkan pada dudukan jig sebelum menekan tombol trigger.</li>
                <li>Pindai barcode lot komponen menggunakan barcode scanner atau kamera.</li>
                <li>Bila hasil inspeksi memenuhi toleransi, klik <strong>PASS</strong> untuk melanjutkan ke step berikutnya.</li>
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', color: '#fbbf24', fontSize: '0.8rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>Butuh eskalasi kendala mesin atau supervisor? Silakan gunakan tombol Andon Call di terminal stasiun.</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * 2. TulipInfoModal
 * App metadata, version number, release status, station assignment
 */
export function TulipInfoModal({ isOpen, onClose, app, stationName, operator }) {
  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 100050
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          maxWidth: '92vw',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          color: '#f8fafc',
          zIndex: 100051,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Info size={18} color="#94a3b8" />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em' }}>
                INFORMASI APLIKASI & TERMINAL
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>
                {app?.name || 'Aplikasi Frontline'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Table */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', padding: '8px 12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
            <span style={{ color: '#94a3b8' }}>App ID:</span>
            <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{app?.id || '-'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', padding: '8px 12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Status Publikasi:</span>
            <span style={{ color: app?.approval_status === 'PUBLISHED' ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
              {app?.approval_status || 'DRAFT'} (v{app?.config?.version || '1.0.0'})
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', padding: '8px 12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Assigned Station:</span>
            <span style={{ fontWeight: 700, color: '#ffffff' }}>{stationName || 'Default Station'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', padding: '8px 12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Operator Aktif:</span>
            <span style={{ fontWeight: 700, color: '#ffffff' }}>{operator || 'Operator'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', padding: '8px 12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Target Cycle Time:</span>
            <span style={{ color: '#cbd5e1' }}>{app?.config?.targetCycleTimeSeconds ? `${app.config.targetCycleTimeSeconds} detik` : 'Otomatis'}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * 3. TulipRestartModal
 * Confirmation dialog before resetting an app session
 */
export function TulipRestartModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 100050
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '420px',
          maxWidth: '92vw',
          backgroundColor: '#0f172a',
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(245, 158, 11, 0.25)',
          color: '#f8fafc',
          zIndex: 100051,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RotateCcw size={22} color="#f59e0b" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Restart Sesi Aplikasi?</h3>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Mulai ulang alur pengerjaan dari step pertama</span>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.5' }}>
          Sesi pengerjaan saat ini akan di-reset. Data variabel sementara akan kembali ke nilai awal dan alur kembali ke layar pertama.
        </p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              flex: 1.4,
              padding: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#020617',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            Ya, Restart Sesi
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * 4. TulipShopFloorMenuModal
 * Platform menu: Fullscreen kiosk, Network diagnostics, Change station, Switch app
 */
export function TulipShopFloorMenuModal({
  isOpen,
  onClose,
  onSwitchApp,
  onToggleFullscreen,
  isFullscreen,
  onBackToBuilder,
  onLogout
}) {
  const [networkPing, setNetworkPing] = useState(18);

  useEffect(() => {
    if (isOpen) {
      setNetworkPing(Math.floor(12 + Math.random() * 14));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 100050
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '460px',
          maxWidth: '92vw',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          color: '#f8fafc',
          zIndex: 100051,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Menu size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em' }}>
                TULIP PLAYER MENU
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>
                Pengaturan Frontline
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Options List */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Fullscreen Kiosk */}
          <button
            type="button"
            onClick={() => {
              if (onToggleFullscreen) onToggleFullscreen();
              onClose();
            }}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Monitor size={18} color="#38bdf8" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                  {isFullscreen ? 'Keluar dari Fullscreen Kiosk' : 'Masuk ke Fullscreen Kiosk'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Kunci tampilan layar penuh untuk operator</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>{isFullscreen ? 'EXIT' : 'ENTER'}</span>
          </button>

          {/* Switch App */}
          <button
            type="button"
            onClick={() => {
              if (onSwitchApp) onSwitchApp();
              onClose();
            }}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RefreshCw size={18} color="#10b981" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>Ganti Aplikasi Lain</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Buka daftar aplikasi stasiun kerja</div>
              </div>
            </div>
            <ArrowRight size={16} color="#94a3b8" />
          </button>

          {/* Back to App Builder */}
          {onBackToBuilder && (
            <button
              type="button"
              onClick={() => {
                onBackToBuilder();
                onClose();
              }}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ExternalLink size={18} color="#a855f7" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>Kembali ke App Builder</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Buka editor untuk mengedit aplikasi ini</div>
                </div>
              </div>
              <ArrowRight size={16} color="#94a3b8" />
            </button>
          )}

          {/* Network Check Widget */}
          <div style={{ padding: '12px 14px', backgroundColor: 'rgba(2, 6, 23, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wifi size={16} color="#10b981" />
              <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>Latensi Gateway IoT:</span>
            </div>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
              {networkPing} ms (Sangat Bagus)
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Tulip Player Engine v2.4</span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </>
  );
}
