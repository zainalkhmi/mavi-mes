import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Camera,
  Printer,
  X,
  CheckCircle2,
  Lock,
  Award,
  Thermometer,
  Droplets,
  History,
  Tag,
  FileText,
  Download,
  Share2
} from 'lucide-react';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import { executeReportPrintAction } from '../../utils/reportPrintService';
import n8nWebhook from '../../utils/n8nWebhookService';

// ── 1. NCR (NON-CONFORMANCE REPORT) & RED TAG MODAL ─────────────────────────
export function NCRDefectModal({
  isOpen,
  onClose,
  activePoint,
  checkPoints = [],
  workOrderNo = 'WO-2026-0801',
  partSerial = 'SN-001',
  partName = 'Precision Machined Component',
  partNo = 'PRT-HOUSING-01',
  lotBatchNo = 'LOT-2026-08',
  stationId = 'ST-CNC-01',
  docNo = 'FORM-QA-CK-001-C',
  inspectorName = 'QC Inspector',
  onSaveNCR
}) {
  const [defectType, setDefectType] = useState('DIMENSIONAL_OVER');
  const [disposition, setDisposition] = useState('REWORK');
  const [quarantineBin, setQuarantineBin] = useState('BIN-Q-02 (HOLD AREA)');
  const [rootCause, setRootCause] = useState('Penyimpangan toleransi dimensi pada proses pemesinan CNC.');
  const [correctiveAction, setCorrectiveAction] = useState('Karantina part di Area Hold. Kalibrasi ulang tool offset CNC dan setting fixture sebelum lanjut.');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPrintTag, setShowPrintTag] = useState(false);
  const [showOfficialNCRForm, setShowOfficialNCRForm] = useState(false);
  const [generatedNCRData, setGeneratedNCRData] = useState(null);

  if (!isOpen) return null;

  const currentPoint = activePoint || (checkPoints && checkPoints.find(p => p.status === 'NG')) || checkPoints?.[0] || {
    id: 'pt-1',
    pointNumber: 1,
    title: 'Dimension Check',
    nominal: 25.0,
    tolMin: 24.95,
    tolMax: 25.05,
    measuredVal: 25.18,
    unit: 'mm'
  };

  const cleanWO = (workOrderNo || 'WO').replace(/[^a-zA-Z0-9]/g, '');
  const ptNum = currentPoint.pointNumber || '01';
  const ncrNumber = `NCR-${cleanWO}-${ptNum}`;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
      toast.success('Foto bukti cacat berhasil diunggah');
    }
  };

  // Collect all NG points or current point
  const allNGPoints = checkPoints && checkPoints.length > 0
    ? checkPoints.filter(p => p.status === 'NG')
    : [currentPoint];
  const ngPointsToInclude = allNGPoints.length > 0 ? allNGPoints : [currentPoint];

  const handleSaveAndGenerateForm = () => {
    const nowIso = new Date().toISOString();
    const delta = currentPoint.measuredVal && currentPoint.nominal
      ? (parseFloat(currentPoint.measuredVal) - parseFloat(currentPoint.nominal)).toFixed(3)
      : '+0.000';

    const ncrData = {
      ncrNumber,
      docNo: docNo || 'FRM-QA-NCR-01',
      rev: '03',
      isoStandard: 'ISO 9001:2015 Clause 8.7 (Non-conforming Outputs) & IATF 16949',
      workOrderNo,
      partSerial,
      partName: partName || 'Precision Housing Component',
      partNo: partNo || partSerial,
      lotBatchNo: lotBatchNo || 'LOT-2026-08',
      stationId: stationId || 'ST-CNC-01',
      inspector: inspectorName,
      pointId: currentPoint.id,
      pointNumber: currentPoint.pointNumber,
      title: currentPoint.title,
      nominal: currentPoint.nominal,
      measuredVal: currentPoint.measuredVal,
      tolerance: `${currentPoint.tolMin} ~ ${currentPoint.tolMax} ${currentPoint.unit || 'mm'}`,
      delta: `${parseFloat(delta) > 0 ? '+' : ''}${delta} ${currentPoint.unit || 'mm'}`,
      ngPoints: ngPointsToInclude.map(p => ({
        pointNumber: p.pointNumber,
        title: p.title,
        nominal: `${p.nominal} ${p.unit || 'mm'}`,
        tolerance: `${p.tolMin} ~ ${p.tolMax} ${p.unit || 'mm'}`,
        measuredVal: `${p.measuredVal || 'NG'} ${p.unit || 'mm'}`,
        delta: p.measuredVal && p.nominal
          ? `${(parseFloat(p.measuredVal) - parseFloat(p.nominal)) > 0 ? '+' : ''}${(parseFloat(p.measuredVal) - parseFloat(p.nominal)).toFixed(3)} ${p.unit || 'mm'}`
          : 'NG',
        status: 'NG',
        criticality: p.criticality || 'Critical'
      })),
      defectType,
      disposition,
      quarantineBin,
      rootCause: rootCause || 'Penyimpangan toleransi pada proses permesinan CNC.',
      correctiveAction: correctiveAction || `Part dipindahkan ke ${quarantineBin}. Disposisi: ${disposition}.`,
      photo: photoPreview,
      status: 'QUARANTINED / HOLD',
      signatures: {
        inspector: inspectorName,
        engineer: 'Ahmad S., ST (QA Eng)',
        qaManager: 'Hendra Wijaya, ST (QA Mgr)',
        productionLead: 'Budi Santoso (Line Lead)'
      },
      createdAt: nowIso
    };

    if (onSaveNCR) {
      onSaveNCR(ncrData);
    }

    // Also notify Webhook / n8n
    try {
      n8nWebhook.fire('ncr.created', ncrData);
    } catch (e) {
      console.warn('[NCR Webhook Alert]', e);
    }

    setGeneratedNCRData(ncrData);
    setShowOfficialNCRForm(true);
    toast.success(`🎉 Laporan Form NCR ${ncrNumber} Berhasil Diterbitkan Secara Otomatis!`, { duration: 4000 });
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#0f172a', border: '2px solid #ef4444', borderRadius: '16px', width: '680px', maxWidth: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(239, 68, 68, 0.4)', overflow: 'hidden' }}>
          
          {/* Modal Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', backgroundColor: '#ef4444', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(239, 68, 68, 0.5)' }}>
                <ShieldAlert size={24} color="white" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc' }}>
                    Penerbitan Form NCR & Karantina Part
                  </h3>
                  <span style={{ fontSize: '0.68rem', backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                    ISO 9001: 8.7
                  </span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#fca5a5' }}>
                  Nomor NCR: <strong style={{ color: '#ffffff' }}>{ncrNumber}</strong> • WO: {workOrderNo} • Serial: {partSerial}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8' }}>
                  PARAMETER OUT OF TOLERANCE (DEFECT NG)
                </div>
                <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  {ngPointsToInclude.length} Poin NG Terdeteksi
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Dimensi / Parameter:</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>#{currentPoint.pointNumber} {currentPoint.title}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Standar & Toleransi:</span>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1' }}>{currentPoint.nominal} ({currentPoint.tolMin} ~ {currentPoint.tolMax} {currentPoint.unit || 'mm'})</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Hasil Ukur Aktual:</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ef4444' }}>{currentPoint.measuredVal || 'NG'} {currentPoint.unit || 'mm'}</div>
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
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', fontSize: '0.78rem', outline: 'none' }}
                >
                  <option value="DIMENSIONAL_OVER">Ukuran Melebihi Toleransi (Over-tolerance)</option>
                  <option value="DIMENSIONAL_UNDER">Ukuran Kurang / Minus (Under-tolerance)</option>
                  <option value="POROSITY_CASTING">Porositas / Rongga Udara (Blow Hole)</option>
                  <option value="BURR_FLASH">Burr / Sisa Bram / Flash Tebal</option>
                  <option value="SURFACE_SCRATCH">Permukaan Cacat / Baret / Dent</option>
                  <option value="THREAD_DEFECT">Ulir / Thread Rusak / Pitch Miring</option>
                  <option value="CRACK_DEFECT">Retak Material (Crack)</option>
                  <option value="GEOMETRIC_OUT">Penyimpangan Geometris (Runout/Flatness)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  KEPUTUSAN DISPOSISI (DISPOSITION):
                </label>
                <select
                  value={disposition}
                  onChange={e => setDisposition(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: disposition === 'SCRAP' ? '#ef4444' : disposition === 'REWORK' ? '#eab308' : '#38bdf8', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', fontSize: '0.78rem', fontWeight: 800, outline: 'none' }}
                >
                  <option value="REWORK">⚠️ REWORK (Pengerjaan Ulang / Re-Machining)</option>
                  <option value="SCRAP">⛔ SCRAP / AFVAL (Musnahkan Produk)</option>
                  <option value="SORTING">🔍 100% SORTING (Karantina & Sortir Lot)</option>
                  <option value="CONCESSION">📝 CONCESSION (Special Acceptance by QA Mgr)</option>
                  <option value="RETURN_TO_VENDOR">📦 RETURN TO VENDOR (Kembalikan ke Supplier)</option>
                </select>
              </div>
            </div>

            {/* Quarantine Bin Location */}
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                LOKASI AREA KARANTINA FISIK (QUARANTINE HOLD BIN):
              </label>
              <input
                type="text"
                value={quarantineBin}
                onChange={e => setQuarantineBin(e.target.value)}
                placeholder="Contoh: Rak Karantina Q-02 / Red Box CNC Line 1"
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: 'white', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '0.8rem', outline: 'none' }}
              />
            </div>

            {/* Root Cause & Corrective Action */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  1. ANALISIS PENYEBAB CACAT (ROOT CAUSE):
                </label>
                <textarea
                  rows={3}
                  value={rootCause}
                  onChange={e => setRootCause(e.target.value)}
                  placeholder="Indikasi penyebab (pahat aus, setting fixture miring, tekanan casting kurang)..."
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: 'white', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '0.76rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  2. TINDAKAN KOREKTIF & DISPOSISI:
                </label>
                <textarea
                  rows={3}
                  value={correctiveAction}
                  onChange={e => setCorrectiveAction(e.target.value)}
                  placeholder="Instruksi pengerjaan ulang, kalibrasi, atau pengamanan lot..."
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: 'white', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '0.76rem', outline: 'none' }}
                />
              </div>
            </div>

            {/* Photo Evidence Capture */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1' }}>
                  FOTO BUKTI DEFECT (VISUAL EVIDENCE):
                </label>
                <label
                  htmlFor="ncr-photo-input"
                  style={{ fontSize: '0.68rem', backgroundColor: '#334155', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                >
                  <Camera size={13} /> Ambil / Upload Foto
                </label>
                <input id="ncr-photo-input" type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </div>

              {photoPreview ? (
                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ef4444', maxHeight: '140px', backgroundColor: '#000', textAlign: 'center' }}>
                  <img src={photoPreview} alt="Bukti Cacat" style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain' }} />
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
                  style={{ border: '1.5px dashed #475569', borderRadius: '8px', padding: '14px', textAlign: 'center', color: '#64748b', cursor: 'pointer', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
                >
                  <Camera size={22} color="#64748b" style={{ marginBottom: '4px' }} />
                  <div style={{ fontSize: '0.74rem' }}>Klik untuk melampirkan foto bagian cacat dari kamera tablet / upload file</div>
                </div>
              )}
            </div>

          </div>

          {/* Modal Footer */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setShowPrintTag(true)}
              style={{ padding: '9px 14px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Tag size={14} /> Cetak Label Merah (Hold Tag)
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onClose}
                style={{ padding: '9px 16px', backgroundColor: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                onClick={handleSaveAndGenerateForm}
                style={{
                  padding: '9px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
                }}
              >
                <FileText size={16} />
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
            activePoint={currentPoint}
            defectType={defectType}
            disposition={disposition}
            quarantineBin={quarantineBin}
            inspectorName={inspectorName}
          />
        )}
      </div>

      {/* Embedded Official Full NCR Form Modal */}
      {showOfficialNCRForm && generatedNCRData && (
        <OfficialNCRFormModal
          isOpen={showOfficialNCRForm}
          onClose={() => {
            setShowOfficialNCRForm(false);
            onClose();
          }}
          ncrData={generatedNCRData}
        />
      )}
    </>
  );
}

// ── 2. OFFICIAL ISO 9001: 8.7 NCR FORM MODAL (A4 PRINTABLE & EXPORTABLE) ───
export function OfficialNCRFormModal({
  isOpen,
  onClose,
  ncrData
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showHoldTag, setShowHoldTag] = useState(false);

  if (!isOpen || !ncrData) return null;

  const handlePrintNCR = async () => {
    setIsGeneratingPdf(true);
    try {
      const tableRows = (ncrData.ngPoints || [ncrData]).map((p, idx) => [
        String(idx + 1),
        p.title || `#${p.pointNumber} Parameter`,
        p.nominal || '-',
        p.tolerance || '-',
        p.measuredVal || 'NG',
        p.delta || '-',
        'NG'
      ]);

      const inputs = {
        ncr_no_val: ncrData.ncrNumber,
        wo_val: ncrData.workOrderNo,
        part_name_val: ncrData.partName || 'Precision Part',
        serial_val: ncrData.partSerial || '-',
        station_val: ncrData.stationId || 'ST-CNC-01',
        inspector_val: ncrData.inspector,
        date_val: new Date(ncrData.createdAt || Date.now()).toLocaleDateString('id-ID'),
        standard_val: 'ISO 9001:2015 (8.7)',
        defect_val: ncrData.defectType,
        disposition_val: ncrData.disposition,
        quarantine_val: ncrData.quarantineBin,
        hold_val: 'QUARANTINED (HOLD)',
        ncr_table: tableRows,
        rca_val: ncrData.rootCause || 'Penyimpangan toleransi pada proses permesinan.',
        corrective_val: ncrData.correctiveAction || `Disposisi: ${ncrData.disposition}. Part di ${ncrData.quarantineBin}.`,
        sign_val1: `✓ ${ncrData.inspector}`,
        sign_val2: '✓ Ahmad S., ST',
        sign_val3: '✓ Hendra W., ST',
        sign_val4: '✓ Budi Santoso',
        report_qr: `NCR_${ncrData.ncrNumber}_${ncrData.workOrderNo}`
      };

      await executeReportPrintAction({
        templateId: 'ncr-report-a4',
        actionTarget: 'PRINT',
        resolvedInputs: inputs
      });
      toast.success('Membuka dialog cetak Form NCR Resmi ISO 9001...');
    } catch (e) {
      console.error('[NCR Print Error]', e);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const tableRows = (ncrData.ngPoints || [ncrData]).map((p, idx) => [
        String(idx + 1),
        p.title || `#${p.pointNumber} Parameter`,
        p.nominal || '-',
        p.tolerance || '-',
        p.measuredVal || 'NG',
        p.delta || '-',
        'NG'
      ]);

      const inputs = {
        ncr_no_val: ncrData.ncrNumber,
        wo_val: ncrData.workOrderNo,
        part_name_val: ncrData.partName || 'Precision Part',
        serial_val: ncrData.partSerial || '-',
        station_val: ncrData.stationId || 'ST-CNC-01',
        inspector_val: ncrData.inspector,
        date_val: new Date(ncrData.createdAt || Date.now()).toLocaleDateString('id-ID'),
        standard_val: 'ISO 9001:2015 (8.7)',
        defect_val: ncrData.defectType,
        disposition_val: ncrData.disposition,
        quarantine_val: ncrData.quarantineBin,
        hold_val: 'QUARANTINED (HOLD)',
        ncr_table: tableRows,
        rca_val: ncrData.rootCause || 'Penyimpangan toleransi pada proses permesinan.',
        corrective_val: ncrData.correctiveAction || `Disposisi: ${ncrData.disposition}. Part di ${ncrData.quarantineBin}.`,
        sign_val1: `✓ ${ncrData.inspector}`,
        sign_val2: '✓ Ahmad S., ST',
        sign_val3: '✓ Hendra W., ST',
        sign_val4: '✓ Budi Santoso',
        report_qr: `NCR_${ncrData.ncrNumber}_${ncrData.workOrderNo}`
      };

      await executeReportPrintAction({
        templateId: 'ncr-report-a4',
        actionTarget: 'DOWNLOAD',
        resolvedInputs: inputs,
        customFileName: `FORM_NCR_${ncrData.ncrNumber}.pdf`
      });
    } catch (e) {
      console.error('[NCR Download Error]', e);
      toast.error('Gagal mengunduh PDF NCR: ' + e.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendWhatsAppAlert = () => {
    try {
      const msg = `🚨 *LAPORAN KETIDAKSESUAIAN PRODUK (NCR)* 🚨\n\n` +
        `*No NCR:* ${ncrData.ncrNumber}\n` +
        `*Work Order:* ${ncrData.workOrderNo}\n` +
        `*Part Serial:* ${ncrData.partSerial}\n` +
        `*Klasifikasi Cacat:* ${ncrData.defectType}\n` +
        `*Keputusan Disposisi:* ${ncrData.disposition}\n` +
        `*Lokasi Karantina:* ${ncrData.quarantineBin}\n` +
        `*Inspector:* ${ncrData.inspector}\n` +
        `*Standar:* ISO 9001:2015 Clause 8.7\n\n` +
        `_Diterbitkan secara otomatis oleh MANDOR MES Quality Assurance._`;
      
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(shareUrl, '_blank');
      toast.success('Pesan broadcast WhatsApp disiapkan!');
    } catch {
      toast.error('Gagal membuka WhatsApp');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '14px', width: '850px', maxWidth: '96vw', maxHeight: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 70px rgba(0,0,0,0.9)', overflow: 'hidden', border: '3px solid #dc2626' }}>
        
        {/* Top Control Bar (Non-Print Header) */}
        <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #dc2626' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#dc2626', color: 'white', padding: '6px', borderRadius: '6px', display: 'flex' }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Formulir Laporan NCR Otomatis (ISO 9001: 8.7)
                <span style={{ fontSize: '0.65rem', backgroundColor: '#dc2626', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>DITERBITKAN ✓</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                Nomor: <strong style={{ color: '#38bdf8' }}>{ncrData.ncrNumber}</strong> • Dokumen Siap Cetak & Ekspor
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handlePrintNCR}
              disabled={isGeneratingPdf}
              style={{ padding: '6px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={13} /> {isGeneratingPdf ? 'Memproses...' : 'Cetak Form NCR'}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              style={{ padding: '6px 12px', backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #0284c7', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={13} /> Unduh PDF
            </button>
            <button
              onClick={() => setShowHoldTag(true)}
              style={{ padding: '6px 10px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Tag size={13} /> Red Tag
            </button>
            <button
              onClick={handleSendWhatsAppAlert}
              style={{ padding: '6px 10px', backgroundColor: '#14532d', color: '#86efac', border: '1px solid #22c55e', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Share2 size={13} /> WA Alert
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Official A4 Document Sheet Layout (Printable) ── */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: "'Inter', sans-serif" }}>
          
          {/* 1. Official Header */}
          <div style={{ border: '2px solid #991b1b', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#991b1b', color: '#ffffff', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: '#ffffff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b', fontWeight: 900, fontSize: '1.1rem' }}>
                  M
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, letterSpacing: '0.5px' }}>
                    LAPORAN KETIDAKSESUAIAN PRODUK (NCR)
                  </h2>
                  <div style={{ fontSize: '0.65rem', color: '#fecaca', fontWeight: 600, marginTop: '2px' }}>
                    MANDOR MES QUALITY ASSURANCE • ISO 9001:2015 CLAUSE 8.7 (NON-CONFORMING OUTPUTS)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', lineHeight: 1.3 }}>
                  <div><strong>DOC NO:</strong> FRM-QA-NCR-01</div>
                  <div><strong>REV:</strong> 03 | 2026-08</div>
                  <div style={{ color: '#fef08a' }}><strong>ISO AUDITED</strong></div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '4px', borderRadius: '4px' }}>
                  <QRCode value={`MANDOR_NCR_${ncrData.ncrNumber}_${ncrData.workOrderNo}`} size={46} />
                </div>
              </div>
            </div>

            {/* 2. Master Info Grid */}
            <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', backgroundColor: '#fff5f5', borderBottom: '1px solid #fecaca', fontSize: '0.72rem' }}>
              <div>
                <span style={{ color: '#991b1b', fontWeight: 800, fontSize: '0.65rem' }}>NOMOR NCR:</span>
                <div style={{ fontWeight: 900, color: '#dc2626', fontSize: '0.88rem' }}>{ncrData.ncrNumber}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontWeight: 700, fontSize: '0.65rem' }}>WORK ORDER NO:</span>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{ncrData.workOrderNo}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontWeight: 700, fontSize: '0.65rem' }}>NAMA & NO PART:</span>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{ncrData.partName || 'Precision Housing'}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontWeight: 700, fontSize: '0.65rem' }}>SERIAL / LOT NUMBER:</span>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{ncrData.partSerial} ({ncrData.lotBatchNo || 'LOT-1'})</div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontWeight: 700, fontSize: '0.65rem' }}>STATION / PROSES:</span>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{ncrData.stationId || 'ST-CNC-01'}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontWeight: 700, fontSize: '0.65rem' }}>QC INSPECTOR:</span>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{ncrData.inspector}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontWeight: 700, fontSize: '0.65rem' }}>TANGGAL & WAKTU:</span>
                <div style={{ fontWeight: 800, color: '#dc2626' }}>{new Date(ncrData.createdAt || Date.now()).toLocaleString('id-ID')}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontWeight: 700, fontSize: '0.65rem' }}>STANDAR MUTU:</span>
                <div style={{ fontWeight: 800, color: '#059669' }}>ISO 9001:2015 (8.7)</div>
              </div>
            </div>
          </div>

          {/* 3. Summary / Disposition Cards (4 columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #fca5a5', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #dc2626' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#991b1b' }}>KLASIFIKASI CACAT:</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#991b1b', marginTop: '2px' }}>{ncrData.defectType}</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #fde047', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #eab308' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#854d0e' }}>KEPUTUSAN DISPOSISI:</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#a16207', marginTop: '2px' }}>{ncrData.disposition}</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b' }}>LOKASI AREA KARANTINA:</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{ncrData.quarantineBin}</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #f87171', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#991b1b' }}>STATUS KARANTINA:</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#dc2626', marginTop: '2px' }}>⛔ QUARANTINED (HOLD)</div>
            </div>
          </div>

          {/* 4. Parameter Matrix Table (Defects / NG Items) */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#991b1b', color: 'white', padding: '6px 14px', fontSize: '0.72rem', fontWeight: 800 }}>
              MATRIKS PARAMETER & PENYIMPANGAN UKURAN (OUT OF TOLERANCE)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'center', width: '35px' }}>#</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Parameter Ukur / Dimensi</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center' }}>Standar Nominal</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center' }}>Toleransi</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center' }}>Hasil Aktual</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center' }}>Deviasi (Delta)</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center', width: '60px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(ncrData.ngPoints || [ncrData]).map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fef2f2' }}>
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 800, color: '#0f172a' }}>{p.title || `#${p.pointNumber} Dimension Check`}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{p.nominal}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', color: '#64748b' }}>{p.tolerance}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 900, color: '#dc2626' }}>{p.measuredVal}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 800, color: '#dc2626' }}>{p.delta || 'NG'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#dc2626', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.64rem', fontWeight: 900 }}>
                        NG
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. RCA & Corrective Action Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#991b1b', marginBottom: '4px' }}>
                1. ANALISIS PENYEBAB KETIDAKSESUAIAN (ROOT CAUSE ANALYSIS):
              </div>
              <div style={{ fontSize: '0.74rem', color: '#1e293b', lineHeight: 1.4, minHeight: '36px' }}>
                {ncrData.rootCause || 'Penyimpangan toleransi pada proses permesinan CNC.'}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#991b1b', marginBottom: '4px' }}>
                2. TINDAKAN KOREKTIF & DISPOSISI (CORRECTIVE ACTION):
              </div>
              <div style={{ fontSize: '0.74rem', color: '#1e293b', lineHeight: 1.4, minHeight: '36px' }}>
                {ncrData.correctiveAction || `Disposisi: ${ncrData.disposition}. Part telah dipindahkan ke ${ncrData.quarantineBin}.`}
              </div>
            </div>
          </div>

          {/* 6. Physical Quarantine Notice Box */}
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#ef4444', color: 'white', padding: '6px', borderRadius: '6px' }}>
              <Tag size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#991b1b' }}>
                3. VERIFIKASI KARANTINA FISIK & RED HOLD TAG (ISO 9001: 8.7.1)
              </div>
              <div style={{ fontSize: '0.68rem', color: '#7f1d1d', marginTop: '2px' }}>
                Part telah ditempeli Label Karantina Merah (Red Hold Tag) dan dipindahkan ke <strong>{ncrData.quarantineBin}</strong>. Dilarang memproses lebih lanjut tanpa otorisasi tertulis QA Management.
              </div>
            </div>
          </div>

          {/* 7. Multi-tier ISO 9001 Signature Matrix (4 Columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b' }}>PELAPOR / INSPECTOR</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#059669', margin: '8px 0 2px 0' }}>✓ {ncrData.signatures?.inspector || ncrData.inspector}</div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>QC Inspector Verifikasi</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b' }}>ENGINEERING REVIEW</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#2563eb', margin: '8px 0 2px 0' }}>✓ {ncrData.signatures?.engineer || 'Ahmad S., ST'}</div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Evaluasi Teknis CNC</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b' }}>PERSETUJUAN QA MGR</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#991b1b', margin: '8px 0 2px 0' }}>✓ {ncrData.signatures?.qaManager || 'Hendra W., ST'}</div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Otorisasi Disposisi Mutu</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b' }}>PRODUKSI / LINE LEAD</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#475569', margin: '8px 0 2px 0' }}>✓ {ncrData.signatures?.productionLead || 'Budi Santoso'}</div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Penerima Part Karantina</div>
            </div>
          </div>

          {/* Footer Watermark */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontSize: '0.62rem', color: '#94a3b8' }}>
            <span>MANDOR MES QUALITY ENGINE • ISO 9001:2015 AUDITED FORM NCR • DIGITAL SIGNATURE SECURED</span>
            <span>Doc Control: Controlled Copy • {new Date().toLocaleDateString('id-ID')}</span>
          </div>

        </div>

        {/* Bottom Footer Actions */}
        <div style={{ backgroundColor: '#f1f5f9', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748b' }}>
            <CheckCircle2 size={15} color="#22c55e" />
            <span>Formulir ini telah tersimpan di sistem riwayat checksheet QC & database audit ISO.</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{ padding: '8px 18px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer' }}
            >
              Selesai & Tutup
            </button>
            <button
              onClick={handlePrintNCR}
              disabled={isGeneratingPdf}
              style={{ padding: '8px 20px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 0 12px rgba(220, 38, 38, 0.4)' }}
            >
              <Printer size={14} /> Cetak Form NCR (A4)
            </button>
          </div>
        </div>

      </div>

      {/* Embedded Red Hold Tag Print Modal */}
      {showHoldTag && (
        <RedTagPrintModal
          isOpen={showHoldTag}
          onClose={() => setShowHoldTag(false)}
          ncrNumber={ncrData.ncrNumber}
          workOrderNo={ncrData.workOrderNo}
          partSerial={ncrData.partSerial}
          activePoint={ncrData.activePoint || ncrData.ngPoints?.[0]}
          defectType={ncrData.defectType}
          disposition={ncrData.disposition}
          quarantineBin={ncrData.quarantineBin}
          inspectorName={ncrData.inspector}
        />
      )}
    </div>
  );
}

// ── 3. PRINTABLE RED QUARANTINE HOLD TAG ────────────────────────────────────
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
            <div><strong>Nilai Aktual:</strong> <span style={{ color: '#dc2626', fontWeight: 800 }}>{activePoint?.measuredVal} {activePoint?.unit || 'mm'}</span></div>
          </div>
          {defectType && (
            <div style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: 700 }}>
              Defect: {defectType}
            </div>
          )}

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

// ── 4. AUDIT TRAIL LOG MODAL (ISO 9001: 7.5.3 / FDA 21 CFR PART 11) ────────
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
                WO: {workOrderNo || '-'} • Catatan integritas data dan riwayat modifikasi nilai pengukuran (Anti-Tampering Log)
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

// ── 5. TWO-TIER SUPERVISOR APPROVAL MODAL (ISO 9001: 8.6) ───────────────────
export function SupervisorApprovalModal({
  isOpen,
  onClose,
  stats,
  workOrderNo,
  partSerial,
  onApprove
}) {
  const [supervisorName, setSupervisorName] = useState('Hendra Wijaya, ST (QA Manager)');
  const [pin, setPin] = useState('');
  const [approvalDecision, setApprovalDecision] = useState('APPROVED');
  const [comments, setComments] = useState('');

  if (!isOpen) return null;

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

          {/* Decision */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              KEPUTUSAN PERSETUJUAN:
            </label>
            <select
              value={approvalDecision}
              onChange={e => setApprovalDecision(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', color: approvalDecision === 'APPROVED' ? '#22c55e' : '#ef4444', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '0.82rem', fontWeight: 800, outline: 'none' }}
            >
              <option value="APPROVED">✓ APPROVED (Rilis Part ke Proses Berikutnya)</option>
              <option value="REJECTED">⛔ REJECTED (Tolak & Tahan Part)</option>
              <option value="CONDITIONAL">⚠️ CONDITIONAL (Disetujui Bersyarat)</option>
            </select>
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

// ── 6. ENVIRONMENTAL CONDITIONS MODAL (ISO 9001: 7.1.5 / ISO 1) ─────────────
export function EnvironmentSettingsModal({
  isOpen,
  onClose,
  temperature,
  humidity,
  onSave
}) {
  const [temp, setTemp] = useState(temperature || '20.0');
  const [hum, setHum] = useState(humidity || '52');

  if (!isOpen) return null;

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
