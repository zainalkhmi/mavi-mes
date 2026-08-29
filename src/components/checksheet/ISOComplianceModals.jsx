import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Camera,
  Upload,
  Printer,
  X,
  CheckCircle2,
  Lock,
  Award,
  Thermometer,
  Droplets,
  History,
  QrCode,
  FileWarning,
  FileCheck,
  Tag,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';

// ── 1. NCR (NON-CONFORMANCE REPORT) & RED TAG MODAL ─────────────────────────
export function NCRDefectModal({
  isOpen,
  onClose,
  activePoint,
  workOrderNo,
  partSerial,
  inspectorName,
  onSaveNCR
}) {
  if (!isOpen || !activePoint) return null;

  const [defectType, setDefectType] = useState('DIMENSIONAL_OUT');
  const [disposition, setDisposition] = useState('REWORK');
  const [quarantineBin, setQuarantineBin] = useState('BIN-Q-02 (HOLD AREA)');
  const [rootCause, setRootCause] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPrintTag, setShowPrintTag] = useState(false);

  const ncrNumber = `NCR-${workOrderNo.replace(/[^a-zA-Z0-9]/g, '')}-${activePoint.pointNumber || '01'}`;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
      toast.success('Foto bukti cacat berhasil diunggah');
    }
  };

  const handleSave = () => {
    const ncrData = {
      ncrNumber,
      pointId: activePoint.id,
      pointNumber: activePoint.pointNumber,
      title: activePoint.title,
      nominal: activePoint.nominal,
      measuredVal: activePoint.measuredVal,
      tolerance: `${activePoint.tolMin} ~ ${activePoint.tolMax} ${activePoint.unit}`,
      defectType,
      disposition,
      quarantineBin,
      rootCause: rootCause || 'Penyimpangan toleransi pada proses permesinan.',
      photo: photoPreview,
      inspector: inspectorName,
      createdAt: new Date().toISOString()
    };

    onSaveNCR(ncrData);
    toast.success(`✓ Laporan NCR ${ncrNumber} berhasil diterbitkan (ISO 9001: 8.7)!`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#0f172a', border: '2px solid #ef4444', borderRadius: '16px', width: '640px', maxWidth: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(239, 68, 68, 0.35)', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(239, 68, 68, 0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#ef4444', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={22} color="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc' }}>
                  Laporan Ketidaksesuaian Produk (NCR)
                </h3>
                <span style={{ fontSize: '0.68rem', backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                  ISO 9001: 8.7
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#fca5a5' }}>
                Nomor: <strong style={{ color: '#ffffff' }}>{ncrNumber}</strong> • Serial: {partSerial}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Defect Point Card */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
              PARAMETER OUT OF TOLERANCE (NG)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Dimensi:</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>#{activePoint.pointNumber} {activePoint.title}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Standar & Tol:</span>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1' }}>{activePoint.nominal} ({activePoint.tolMin} ~ {activePoint.tolMax} {activePoint.unit})</div>
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Hasil Ukur Aktual:</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ef4444' }}>{activePoint.measuredVal || 'NG'} {activePoint.unit}</div>
              </div>
            </div>
          </div>

          {/* Defect Classification & Disposition Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                KLASIFIKASI CACAT (DEFECT TYPE):
              </label>
              <select
                value={defectType}
                onChange={e => setDefectType(e.target.value)}
                style={{ width: '100%', backgroundColor: '#090d16', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', fontSize: '0.78rem', outline: 'none' }}
              >
                <option value="DIMENSIONAL_OVER">Ukuran Melebihi Toleransi (Over-tolerance)</option>
                <option value="DIMENSIONAL_UNDER">Ukuran Kurang / Minus (Under-tolerance)</option>
                <option value="POROSITY_CASTING">Porositas / Rongga Udara (Blow Hole)</option>
                <option value="BURR_FLASH">Burr / Sisa Bram / Flash Tebal</option>
                <option value="SURFACE_SCRATCH">Permukaan Cacat / Baret / Dent</option>
                <option value="THREAD_DEFECT">Ulir / Thread Rusak / Pitch Miring</option>
                <option value="CRACK_DEFECT">Retak Material (Crack)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                KEPUTUSAN DISPOSISI (DISPOSITION):
              </label>
              <select
                value={disposition}
                onChange={e => setDisposition(e.target.value)}
                style={{ width: '100%', backgroundColor: '#090d16', color: disposition === 'SCRAP' ? '#ef4444' : disposition === 'REWORK' ? '#eab308' : '#38bdf8', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', fontSize: '0.78rem', fontWeight: 800, outline: 'none' }}
              >
                <option value="REWORK">⚠️ REWORK (Pengerjaan Ulang / Re-Machining)</option>
                <option value="SCRAP">⛔ SCRAP / AFVAL (Musnahkan Produk)</option>
                <option value="SORTING">🔍 100% SORTING (Karantina & Sortir Lot)</option>
                <option value="CONCESSION">📝 CONCESSION (Special Acceptance by QA Mgr)</option>
              </select>
            </div>
          </div>

          {/* Quarantine Bin Location */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              LOKASI AREA KARANTINA (QUARANTINE HOLD BIN):
            </label>
            <input
              type="text"
              value={quarantineBin}
              onChange={e => setQuarantineBin(e.target.value)}
              placeholder="Contoh: Rak Karantina Q-02 / Red Box CNC"
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: 'white', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '0.8rem', outline: 'none' }}
            />
          </div>

          {/* Root Cause / Analysis */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              ANALISIS PENYEBAB & TINDAKAN KOREKTIF AWAL:
            </label>
            <textarea
              rows={2}
              value={rootCause}
              onChange={e => setRootCause(e.target.value)}
              placeholder="Tuliskan indikasi penyebab (misal: pahat aus, setting fixture miring, tekanan casting kurang)..."
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: 'white', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', outline: 'none' }}
            />
          </div>

          {/* Photo Evidence Capture */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1' }}>
                FOTO BUKTI DEFECT (VISUAL EVIDENCE):
              </label>
              <label
                htmlFor="ncr-photo-input"
                style={{ fontSize: '0.68rem', backgroundColor: '#334155', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Camera size={12} /> Ambil / Upload Foto
              </label>
              <input id="ncr-photo-input" type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </div>

            {photoPreview ? (
              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ef4444', maxHeight: '160px', backgroundColor: '#000', textAlign: 'center' }}>
                <img src={photoPreview} alt="Bukti Cacat" style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain' }} />
                <button
                  onClick={() => setPhotoPreview(null)}
                  style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: 'rgba(239,68,68,0.85)', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 800 }}
                >
                  ✕ Hapus
                </button>
              </div>
            ) : (
              <div
                onClick={() => document.getElementById('ncr-photo-input')?.click()}
                style={{ border: '1.5px dashed #475569', borderRadius: '8px', padding: '16px', textAlign: 'center', color: '#64748b', cursor: 'pointer', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
              >
                <Camera size={24} color="#64748b" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '0.74rem' }}>Klik untuk melampirkan foto bagian yang cacat dari kamera tablet / file</div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setShowPrintTag(true)}
            style={{ padding: '8px 14px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Tag size={14} /> Cetak Label Merah (Hold Tag)
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{ padding: '8px 16px', backgroundColor: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              style={{ padding: '8px 18px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)' }}
            >
              Terbitkan NCR & Karantina Part
            </button>
          </div>
        </div>

      </div>

      {/* Embedded Red Hold Tag Print Modal */}
      {showPrintTag && (
        <RedTagPrintModal
          isOpen={showPrintTag}
          onClose={() => setShowPrintTag(false)}
          ncrNumber={ncrNumber}
          workOrderNo={workOrderNo}
          partSerial={partSerial}
          activePoint={activePoint}
          defectType={defectType}
          disposition={disposition}
          quarantineBin={quarantineBin}
          inspectorName={inspectorName}
        />
      )}
    </div>
  );
}

// ── 2. PRINTABLE RED QUARANTINE HOLD TAG ────────────────────────────────────
export function RedTagPrintModal({
  isOpen,
  onClose,
  ncrNumber,
  workOrderNo,
  partSerial,
  activePoint,
  defectType,
  disposition,
  quarantineBin,
  inspectorName
}) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#ffffff', color: '#000000', borderRadius: '12px', width: '440px', maxWidth: '92vw', border: '4px solid #dc2626', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.9)' }}>
        
        {/* Red Tag Header */}
        <div style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
            ⛔ REJECTED / HOLD ⛔
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px' }}>
            NON-CONFORMING MATERIAL TAG (ISO 9001: 8.7)
          </div>
        </div>

        {/* Tag Body */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>NCR NUMBER:</div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#dc2626' }}>{ncrNumber}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>TANGGAL:</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{new Date().toLocaleDateString('id-ID')}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
            <div><strong>Work Order:</strong> {workOrderNo}</div>
            <div><strong>Serial No:</strong> {partSerial}</div>
            <div><strong>Dimensi NG:</strong> #{activePoint?.pointNumber} {activePoint?.title}</div>
            <div><strong>Nilai Aktual:</strong> <span style={{ color: '#dc2626', fontWeight: 800 }}>{activePoint?.measuredVal} {activePoint?.unit}</span></div>
          </div>

          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #f87171', padding: '8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.68rem', color: '#991b1b', fontWeight: 800 }}>DISPOSISI PRODUK:</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#b91c1c' }}>{disposition}</div>
            <div style={{ fontSize: '0.7rem', color: '#7f1d1d', marginTop: '2px' }}>Area: {quarantineBin}</div>
          </div>

          {/* QR Code Identification */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '8px 0' }}>
            <QRCode value={`MANDOR_HOLD_${ncrNumber}_${partSerial}`} size={84} level="M" />
            <div style={{ fontSize: '0.68rem', color: '#475569', lineHeight: 1.4 }}>
              <div><strong>Inspector:</strong> {inspectorName}</div>
              <div><strong>Status:</strong> QUARANTINED</div>
              <div style={{ color: '#dc2626', fontWeight: 800, marginTop: '4px' }}>DILARANG MEMINDAHKAN TANPA OTORISASI QA</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ backgroundColor: '#f1f5f9', padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '6px 14px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>
            Tutup
          </button>
          <button
            onClick={() => {
              window.print();
              toast.success('Mencetak Red Tag...');
            }}
            style={{ padding: '6px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={14} /> Cetak Label Sekarang
          </button>
        </div>

      </div>
    </div>
  );
}

// ── 3. AUDIT TRAIL LOG MODAL (ISO 9001: 7.5.3 / FDA 21 CFR PART 11) ────────
export function AuditTrailModal({ isOpen, onClose, auditTrail, workOrderNo }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#0f172a', border: '1px solid #38bdf8', borderRadius: '16px', width: '740px', maxWidth: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(56, 189, 248, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', backgroundColor: '#0284c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <History size={18} color="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
                  ISO Audit Trail & Revision History
                </h3>
                <span style={{ fontSize: '0.65rem', backgroundColor: '#0284c7', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                  Clause 7.5.3
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>
                Catatan integritas data dan riwayat modifikasi nilai pengukuran (Anti-Tampering Log)
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Table Body */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          {auditTrail.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <History size={36} color="#334155" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>Belum ada riwayat perubahan nilai ukur</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Setiap kali nilai diinput atau direvisi, sistem akan otomatis mencatatnya di sini.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', color: '#cbd5e1' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', color: '#38bdf8' }}>Timestamp</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8' }}>Operator / QC</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8' }}>Poin Dimensi</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8' }}>Sebelum ➔ Sesudah</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8' }}>Status</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8' }}>Alasan Modifikasi</th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.map((log, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #1e293b', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.4)' }}>
                    <td style={{ padding: '8px 10px', color: '#94a3b8', fontFamily: 'monospace' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700 }}>{log.user}</td>
                    <td style={{ padding: '8px 10px', color: '#f8fafc' }}>#{log.pointNumber} {log.param}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>{log.oldVal || '0.000'}</span>
                      {' ➔ '}
                      <strong style={{ color: log.newVal > 0 ? '#22c55e' : '#38bdf8' }}>{log.newVal}</strong>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, backgroundColor: log.status === 'OK' ? 'rgba(34,197,94,0.2)' : log.status === 'NG' ? 'rgba(239,68,68,0.2)' : '#334155', color: log.status === 'OK' ? '#22c55e' : log.status === 'NG' ? '#ef4444' : '#94a3b8' }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{log.reason || 'Input rutin inspeksi'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Total Catatan Audit: {auditTrail.length} Entri</span>
          <button onClick={onClose} style={{ padding: '6px 16px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}>
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}

// ── 4. TWO-TIER SUPERVISOR APPROVAL MODAL (ISO 9001: 8.6) ───────────────────
export function SupervisorApprovalModal({
  isOpen,
  onClose,
  stats,
  workOrderNo,
  partSerial,
  onApprove
}) {
  if (!isOpen) return null;

  const [supervisorName, setSupervisorName] = useState('Hendra Wijaya, ST (QA Manager)');
  const [pin, setPin] = useState('');
  const [approvalDecision, setApprovalDecision] = useState('APPROVED');
  const [comments, setComments] = useState('');

  const handleAuthorize = () => {
    if (!pin) {
      toast.error('Masukkan PIN / Password Supervisor untuk verifikasi digital');
      return;
    }

    const certHash = `ISO-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const approvalPayload = {
      isApproved: true,
      supervisorName,
      decision: approvalDecision,
      comments: comments || 'Dimensi diverifikasi sesuai drawing teknik ISO 2768-mK.',
      timestamp: new Date().toISOString(),
      hash: certHash
    };

    onApprove(approvalPayload);
    toast.success(`✓ Inspeksi Resmi Di-Approve oleh ${supervisorName}! Hash: ${certHash}`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#0f172a', border: '2px solid #22c55e', borderRadius: '16px', width: '520px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(34, 197, 94, 0.25)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', backgroundColor: '#22c55e', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={22} color="#0f172a" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#f8fafc' }}>
                  Otorisasi Approval Supervisor QA (Tier 2)
                </h3>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#86efac' }}>
                ISO 9001:2015 Clause 8.6 Release of Products and Services
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Summary Status */}
          <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
            <div>Work Order: <strong style={{ color: '#38bdf8' }}>{workOrderNo}</strong></div>
            <div>Serial: <strong style={{ color: '#f8fafc' }}>{partSerial}</strong></div>
            <div>Hasil Ukur: <strong style={{ color: stats?.failed > 0 ? '#ef4444' : '#22c55e' }}>{stats?.passed}/{stats?.total} Lulus ({Math.round(((stats?.passed || 0)/(stats?.total || 1))*100)}%)</strong></div>
            <div>Status Estimasi: <strong style={{ color: stats?.failed > 0 ? '#ef4444' : '#22c55e' }}>{stats?.overallStatus || 'APPROVED'}</strong></div>
          </div>

          {/* Supervisor Name */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              NAMA SUPERVISOR / QA MANAGER:
            </label>
            <input
              type="text"
              value={supervisorName}
              onChange={e => setSupervisorName(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: 'white', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '0.82rem', outline: 'none' }}
            />
          </div>

          {/* Security PIN */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              PIN OTORISASI / E-SIGNATURE KEY:
            </label>
            <input
              type="password"
              placeholder="Masukkan 4-6 digit PIN Supervisor..."
              value={pin}
              onChange={e => setPin(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px 12px', fontSize: '0.9rem', fontWeight: 900, letterSpacing: '3px', outline: 'none' }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              CATATAN REVIEW MUTU:
            </label>
            <textarea
              rows={2}
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Catatan persetujuan rilis produk..."
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: 'white', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', outline: 'none' }}
            />
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', backgroundColor: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>
            Batal
          </button>
          <button
            onClick={handleAuthorize}
            style={{ padding: '8px 20px', backgroundColor: '#22c55e', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 0 16px rgba(34, 197, 94, 0.4)' }}
          >
            <Lock size={14} /> Beri Cap Otorisasi Resmi
          </button>
        </div>

      </div>
    </div>
  );
}

// ── 5. ENVIRONMENTAL CONDITIONS MODAL (ISO 9001: 7.1.5 / ISO 1) ─────────────
export function EnvironmentSettingsModal({
  isOpen,
  onClose,
  temperature,
  humidity,
  onSave
}) {
  if (!isOpen) return null;

  const [temp, setTemp] = useState(temperature || '20.0');
  const [hum, setHum] = useState(humidity || '52');

  const isTempStandard = parseFloat(temp) >= 18.0 && parseFloat(temp) <= 22.0;

  const handleSave = () => {
    onSave(temp, hum);
    toast.success('Kondisi lingkungan ruang inspeksi diperbarui');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#0f172a', border: '1px solid #38bdf8', borderRadius: '16px', width: '460px', maxWidth: '92vw', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(56, 189, 248, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Thermometer size={20} color="#38bdf8" />
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                Kondisi Lingkungan Ruang Ukur
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: '#94a3b8' }}>
                ISO 1 Standard Reference Temperature (20 °C ± 2 °C)
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Thermometer size={14} color="#38bdf8" /> SUHU RUANGAN (°C):
            </label>
            <input
              type="number"
              step="0.1"
              value={temp}
              onChange={e => setTemp(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: isTempStandard ? '#22c55e' : '#eab308', border: `1px solid ${isTempStandard ? '#22c55e' : '#eab308'}`, borderRadius: '8px', padding: '10px 12px', fontSize: '1.1rem', fontWeight: 900, outline: 'none' }}
            />
            <div style={{ fontSize: '0.68rem', color: isTempStandard ? '#22c55e' : '#eab308', marginTop: '4px' }}>
              {isTempStandard ? '✓ Sesuai Standar Metrologi Presisi (20.0 ± 2.0 °C)' : '⚠️ Suhu di luar standar ideal metrologi (20 °C)'}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Droplets size={14} color="#38bdf8" /> KELEMBABAN UDARA (% RH):
            </label>
            <input
              type="number"
              value={hum}
              onChange={e => setHum(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: 'white', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', fontSize: '1.1rem', fontWeight: 900, outline: 'none' }}
            />
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>
              Standar kelembaban laboratorium QC: 45% - 60% RH
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', backgroundColor: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>
            Batal
          </button>
          <button onClick={handleSave} style={{ padding: '8px 18px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}>
            Simpan Parameter Lingkungan
          </button>
        </div>

      </div>
    </div>
  );
}
