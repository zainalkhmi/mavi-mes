/**
 * Measuring Tools Management - ISO 17025 & ISO 9001: 7.1.5 Compliant
 * Calibration, Verification & Measurement Management System
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ruler, Calendar, FileCheck, AlertTriangle, Plus, Search, Filter,
  Clock, CheckCircle, XCircle, Edit2, Trash2, Download, Upload,
  Shield, Activity, Gauge, Scale, Thermometer, BarChart3,
  ChevronRight, ChevronDown, Eye, History, Bell, Settings, Printer,
  Sparkles, Check, X, Sliders, FileText, ArrowUpRight, Award, RefreshCw, Cloud, Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMeasuringTools,
  saveMeasuringTool as saveMeasuringToolDB,
  deleteMeasuringTool as deleteMeasuringToolDB,
  logCalibrationRecord as logCalibrationRecordDB,
  getReferenceStandards,
  DEFAULT_MEASURING_TOOLS,
  DEFAULT_STANDARDS
} from '../utils/supabaseMeasuringToolsDB';

// =====================================================
// INSTRUMENT TYPES
// =====================================================

const INSTRUMENT_TYPES = [
  { id: 'caliper', name: 'Digital Caliper', icon: Ruler, category: 'dimensional' },
  { id: 'micrometer', name: 'Outside Micrometer', icon: Gauge, category: 'dimensional' },
  { id: 'dial_indicator', name: 'Dial Indicator', icon: Activity, category: 'dimensional' },
  { id: 'bore_gauge', name: 'Bore Gauge', icon: Activity, category: 'dimensional' },
  { id: 'height_gauge', name: 'Height Gauge', icon: Activity, category: 'dimensional' },
  { id: 'cmm', name: '3D CMM Machine', icon: Activity, category: 'dimensional' },
  { id: 'thermometer', name: 'Digital Thermometer', icon: Thermometer, category: 'temperature' },
  { id: 'scale', name: 'Weighing Scale', icon: Scale, category: 'mass' },
  { id: 'gauge_block', name: 'Gauge Block Set', icon: Award, category: 'reference' },
  { id: 'ring_gauge', name: 'Ring/Plug Gauge', icon: CheckCircle, category: 'dimensional' },
  { id: 'torque_wrench', name: 'Torque Wrench', icon: Settings, category: 'torque' }
];

// =====================================================
// CALIBRATION STATUS
// =====================================================

const CALIBRATION_STATUS = {
  VALID: { label: 'Valid', color: '#10b981', bg: '#d1fae5', border: '#10b981' },
  DUE_SOON: { label: 'Due Soon', color: '#f59e0b', bg: '#fef3c7', border: '#f59e0b' },
  OVERDUE: { label: 'Overdue', color: '#ef4444', bg: '#fee2e2', border: '#ef4444' },
  IN_CALIBRATION: { label: 'In Calibration', color: '#3b82f6', bg: '#dbeafe', border: '#3b82f6' },
  RETIRED: { label: 'Retired', color: '#6b7280', bg: '#f3f4f6', border: '#6b7280' }
};

// =====================================================
// INITIAL SAMPLE DATA
// =====================================================

const INITIAL_INSTRUMENTS = [
  {
    id: 'CAL-003',
    name: 'Digital Caliper 150mm',
    type: 'caliper',
    manufacturer: 'Mitutoyo',
    model: 'CD-15APX',
    serial_number: 'MT-2024-881',
    range: '0-150mm',
    resolution: '0.01mm',
    accuracy: '±0.02mm',
    location: 'QC Lab Line 1',
    responsible: 'Budi (QA Metrology)',
    calibration_interval: 6,
    last_calibration: '2026-06-15',
    next_calibration: '2026-12-15',
    status: 'VALID',
    certificate_number: 'CAL-CERT-2025-881',
    calibrated_by: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)',
    uncertainty: '0.02mm (k=2)',
    traceable: true,
    notes: 'Primary digital caliper for machining dimensional checks'
  },
  {
    id: 'MIC-102',
    name: 'Outside Micrometer 0-25mm',
    type: 'micrometer',
    manufacturer: 'Mitutoyo',
    model: 'MDC-25MX',
    serial_number: 'MT-2024-102',
    range: '0-25mm',
    resolution: '0.001mm',
    accuracy: '±0.003mm',
    location: 'QC Lab Station 2',
    responsible: 'Rian (QC Lead)',
    calibration_interval: 6,
    last_calibration: '2026-07-01',
    next_calibration: '2027-01-01',
    status: 'VALID',
    certificate_number: 'CAL-CERT-2026-102',
    calibrated_by: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)',
    uncertainty: '0.003mm (k=2)',
    traceable: true,
    notes: 'High precision shaft diameter measurement standard'
  },
  {
    id: 'DI-007',
    name: 'Dial Indicator 0.001mm',
    type: 'dial_indicator',
    manufacturer: 'Mitutoyo',
    model: '543-390B',
    serial_number: 'MT-2023-007',
    range: '0-12.7mm',
    resolution: '0.001mm',
    accuracy: '±0.005mm',
    location: 'Assembly QC Area',
    responsible: 'Ahmad (QC Inspector)',
    calibration_interval: 6,
    last_calibration: '2025-11-20',
    next_calibration: '2026-05-20',
    status: 'OVERDUE',
    certificate_number: 'CAL-CERT-2025-007',
    calibrated_by: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)',
    uncertainty: '0.005mm (k=2)',
    traceable: true,
    notes: 'Runout and flatness measurement indicator'
  },
  {
    id: 'BG-014',
    name: 'Digital Bore Gauge 18-35mm',
    type: 'bore_gauge',
    manufacturer: 'Mitutoyo',
    model: '511-701',
    serial_number: 'BG-2024-014',
    range: '18-35mm',
    resolution: '0.001mm',
    accuracy: '±0.008mm',
    location: 'Machining Station 4',
    responsible: 'Budi (QA Metrology)',
    calibration_interval: 6,
    last_calibration: '2026-03-10',
    next_calibration: '2026-09-10',
    status: 'DUE_SOON',
    certificate_number: 'CAL-CERT-2025-014',
    calibrated_by: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)',
    uncertainty: '0.008mm (k=2)',
    traceable: true,
    notes: 'Internal cylinder bore diameter inspector'
  },
  {
    id: 'HG-002',
    name: 'Digital Height Gauge 300mm',
    type: 'height_gauge',
    manufacturer: 'Mitutoyo',
    model: '192-663-10',
    serial_number: 'HG-2024-002',
    range: '0-300mm',
    resolution: '0.01mm',
    accuracy: '±0.015mm',
    location: 'Granite Surface Table',
    responsible: 'Siti (QA Technician)',
    calibration_interval: 6,
    last_calibration: '2026-05-25',
    next_calibration: '2026-11-25',
    status: 'VALID',
    certificate_number: 'CAL-CERT-2025-002',
    calibrated_by: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)',
    uncertainty: '0.015mm (k=2)',
    traceable: true,
    notes: 'Step height & surface plate reference tool'
  },
  {
    id: 'CMM-001',
    name: 'Zeiss Contura 3D CMM',
    type: 'cmm',
    manufacturer: 'Carl Zeiss',
    model: 'Contura G2 7/10/6',
    serial_number: 'ZEISS-2024-001',
    range: '700x1000x600mm',
    resolution: '0.0005mm',
    accuracy: '±0.0018mm',
    location: 'Clean Metrology Lab',
    responsible: 'Dr. Hendra (Metrology Lead)',
    calibration_interval: 12,
    last_calibration: '2026-08-01',
    next_calibration: '2027-08-01',
    status: 'VALID',
    certificate_number: 'CAL-CERT-2026-001',
    calibrated_by: 'Carl Zeiss SEA Service (ISO 17025 Accredited)',
    uncertainty: '0.0018mm (k=2)',
    traceable: true,
    notes: 'Master 3D Coordinate Measuring Machine'
  }
];

const REFERENCE_STANDARDS = [
  { id: 'REF-01', name: 'Master Gauge Block Set (Grade 0)', code: 'GB-SET-001', range: '1.005 - 100mm (87 pcs)', cert: 'KAN-STD-2026-01', dueDate: '2027-04-10', lab: 'BSML Jakarta', traceability: 'PTB Germany → BIPM SI Meter' },
  { id: 'REF-02', name: 'Master Setting Ring Set Ø25.000 & Ø50.000', code: 'RING-SET-01', range: 'Ø25.000, Ø50.000mm', cert: 'KAN-STD-2026-02', dueDate: '2027-06-15', lab: 'BSML Jakarta', traceability: 'BSML Jakarta → SI Meter' },
  { id: 'REF-03', name: 'Optical Flat Grade 00 (Flatness Reference)', code: 'OPT-FLAT-01', range: 'Ø60mm (λ/10 accuracy)', cert: 'KAN-STD-2025-99', dueDate: '2027-01-20', lab: 'NIST USA', traceability: 'NIST Laser Wavelength Standard' },
  { id: 'REF-04', name: 'Calibrated Fluke Thermal Reference Probe', code: 'TEMP-STD-01', range: '-50 to +250°C (±0.01°C)', cert: 'KAN-STD-2026-04', dueDate: '2026-12-05', lab: 'BSML Jakarta', traceability: 'ITS-90 Temperature Standard' }
];

// =====================================================
// MAIN COMPONENT
// =====================================================

export const MeasuringToolsManager = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('instruments'); // 'instruments' | 'schedule' | 'certificates' | 'standards' | 'reports'
  const [instruments, setInstruments] = useState(DEFAULT_MEASURING_TOOLS);
  const [standards, setStandards] = useState(DEFAULT_STANDARDS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState(null);
  const [showLogCalibrationModal, setShowLogCalibrationModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [showEmailReminderModal, setShowEmailReminderModal] = useState(false);
  const [showUploadCertModal, setShowUploadCertModal] = useState(false);
  const [showAddStandardModal, setShowAddStandardModal] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Load from Supabase Cloud on mount
  useEffect(() => {
    loadCloudData();
  }, []);

  const loadCloudData = async (showToast = false) => {
    setIsSyncing(true);
    try {
      const [cloudTools, cloudStandards] = await Promise.all([
        getMeasuringTools(),
        getReferenceStandards()
      ]);
      if (cloudTools && cloudTools.length > 0) setInstruments(cloudTools);
      if (cloudStandards && cloudStandards.length > 0) setStandards(cloudStandards);
      if (showToast) toast.success('✓ Data Alat Ukur tersinkronisasi dengan Supabase Cloud!');
    } catch (e) {
      console.warn('[MeasuringTools] Cloud sync fallback:', e);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Filter instruments
  const filteredInstruments = instruments.filter(inst => {
    const matchesSearch = inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        inst.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        inst.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (inst.certificate_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || inst.status === filterStatus;
    const matchesType = filterType === 'all' || inst.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Dynamic Statistics
  const stats = {
    total: instruments.length,
    valid: instruments.filter(i => i.status === 'VALID').length,
    dueSoon: instruments.filter(i => i.status === 'DUE_SOON').length,
    overdue: instruments.filter(i => i.status === 'OVERDUE').length,
    inCalibration: instruments.filter(i => i.status === 'IN_CALIBRATION').length
  };

  const getStatusConfig = (status) => CALIBRATION_STATUS[status] || CALIBRATION_STATUS.VALID;

  const getInstrumentIcon = (type) => {
    const instType = INSTRUMENT_TYPES.find(t => t.id === type);
    const Icon = instType?.icon || Gauge;
    return <Icon size={18} />;
  };

  // Actions
  const handleOpenAdd = () => {
    setEditingInstrument(null);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (inst, e) => {
    if (e) e.stopPropagation();
    setEditingInstrument(inst);
    setShowAddEditModal(true);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Yakin ingin menghapus alat ukur ${id} dari inventaris?`)) {
      setInstruments(prev => prev.filter(i => i.id !== id));
      await deleteMeasuringToolDB(id);
      toast.success(`Alat ukur ${id} berhasil dihapus dari database.`);
    }
  };

  const handleViewDetail = (inst) => {
    setSelectedInstrument(inst);
    setShowDetailModal(true);
  };

  const handleOpenCalibrate = (inst, e) => {
    if (e) e.stopPropagation();
    setSelectedInstrument(inst);
    setShowLogCalibrationModal(true);
  };

  const handleOpenSticker = (inst, e) => {
    if (e) e.stopPropagation();
    setSelectedInstrument(inst);
    setShowStickerModal(true);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Nama Alat', 'Tipe', 'Merk/Model', 'No Serial', 'Rentang', 'Resolusi', 'Akurasi', 'Lokasi', 'Status', 'Tgl Kalibrasi', 'Jatuh Tempo', 'No Sertifikat', 'Lab Kalibrasi'];
    const rows = instruments.map(i => [
      i.id,
      `"${i.name}"`,
      i.type,
      `"${i.manufacturer} ${i.model}"`,
      i.serial_number,
      `"${i.range}"`,
      i.resolution,
      `"${i.accuracy}"`,
      `"${i.location}"`,
      i.status,
      i.last_calibration,
      i.next_calibration,
      i.certificate_number,
      `"${i.calibrated_by || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ISO17025_Master_Measuring_Tools_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Daftar Alat Ukur berhasil diekspor ke CSV!');
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b' }}>
      
      {/* ─── 1. TOP HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', padding: '8px', borderRadius: '10px', color: '#6366f1' }}>
              <Ruler size={26} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Master Alat Ukur & Kalibrasi
                <span style={{ fontSize: '0.72rem', backgroundColor: '#6366f118', color: '#6366f1', padding: '2px 8px', borderRadius: '6px', border: '1px solid #6366f130' }}>
                  ISO 17025 & ISO 9001: 7.1.5
                </span>
              </h1>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
                Sistem Manajemen Inventaris Alat Ukur Metrologi, Riwayat Kalibrasi, & Standar Ketertelusuran
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        {/* Header Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Supabase Cloud Connection Status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px', padding: '6px 12px', fontSize: '0.76rem', color: '#059669', fontWeight: 700
          }}>
            <Cloud size={14} />
            <span>Supabase Cloud Sync</span>
          </div>

          <button
            onClick={() => loadCloudData(true)}
            disabled={isSyncing}
            style={{
              padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px',
              background: 'white', color: '#334155', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            title="Refresh & Sinkronisasi Ulang Data dari Supabase"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin text-blue-500" : ""} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '8px',
              background: 'white', color: '#334155', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Download size={15} /> Export CSV
          </button>

          <button
            onClick={() => navigate('/drawing-checksheet')}
            style={{
              padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '8px',
              background: 'white', color: '#0284c7', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <FileCheck size={15} /> Digital Check Sheet
          </button>

          <button
            onClick={handleOpenAdd}
            style={{
              padding: '9px 18px', border: 'none', borderRadius: '8px',
              background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            <Plus size={16} /> Tambah Alat Ukur
          </button>
        </div>
      </div>

      {/* ─── 2. STATS CARDS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard title="Total Alat Terdaftar" value={stats.total} icon={Ruler} color="#6366f1" bgColor="#e0e7ff" />
        <StatCard title="Kalibrasi Valid" value={stats.valid} icon={CheckCircle} color="#10b981" bgColor="#d1fae5" />
        <StatCard title="Mendekati Jatuh Tempo" value={stats.dueSoon} icon={Clock} color="#f59e0b" bgColor="#fef3c7" />
        <StatCard title="Kedaluwarsa (Overdue)" value={stats.overdue} icon={AlertTriangle} color="#ef4444" bgColor="#fee2e2" />
        <StatCard title="Sedang Dikalibrasi" value={stats.inCalibration} icon={Activity} color="#3b82f6" bgColor="#dbeafe" />
      </div>

      {/* ─── 3. NAVIGATION TABS ─── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', overflowX: 'auto' }}>
        {[
          { id: 'instruments', label: `Daftar Alat Ukur (${instruments.length})`, icon: Ruler },
          { id: 'schedule', label: 'Jadwal Kalibrasi & Timeline', icon: Calendar },
          { id: 'certificates', label: 'Sertifikat Kalibrasi (KAN)', icon: FileCheck },
          { id: 'standards', label: 'Master Reference Standards', icon: Award },
          { id: 'reports', label: 'Laporan & Kepatuhan ISO', icon: BarChart3 }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '9px 16px', border: 'none', borderRadius: '8px',
                background: isActive ? '#6366f1' : 'transparent',
                color: isActive ? 'white' : '#64748b',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.15s ease', whiteSpace: 'nowrap'
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: INSTRUMENTS REGISTRY
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'instruments' && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Cari nama alat, kode ID, serial number, atau no sertifikat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px 9px 36px',
                  border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem',
                  backgroundColor: 'white', outline: 'none'
                }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', backgroundColor: 'white', cursor: 'pointer' }}
            >
              <option value="all">Semua Status</option>
              <option value="VALID">🟢 Valid</option>
              <option value="DUE_SOON">⚠️ Due Soon (&lt;30 Hari)</option>
              <option value="OVERDUE">🔴 Overdue (Kedaluwarsa)</option>
              <option value="IN_CALIBRATION">🔵 In Calibration</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', backgroundColor: 'white', cursor: 'pointer' }}
            >
              <option value="all">Semua Jenis Alat</option>
              {INSTRUMENT_TYPES.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Kode ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Nama Alat Ukur</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Rentang & Akurasi</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Lokasi / Stasiun</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Jatuh Tempo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstruments.map(inst => {
                    const statusConfig = getStatusConfig(inst.status);
                    return (
                      <tr
                        key={inst.id}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.1s' }}
                        onClick={() => handleViewDetail(inst)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#6366f1' }}>
                          {inst.id}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px', height: '34px', borderRadius: '8px',
                              backgroundColor: '#f1f5f9', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', color: '#475569'
                            }}>
                              {getInstrumentIcon(inst.type)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{inst.name}</div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{inst.manufacturer} {inst.model} • SN: {inst.serial_number}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{inst.range}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Res: {inst.resolution} | Tol: {inst.accuracy}</div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>
                          <div>{inst.location}</div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>PIC: {inst.responsible}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: inst.status === 'OVERDUE' ? '#ef4444' : '#334155' }}>
                          {inst.next_calibration}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800,
                            backgroundColor: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}`
                          }}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={(e) => handleOpenCalibrate(inst, e)}
                              style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#0284c7', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                              title="Catat Hasil Kalibrasi Ulang"
                            >
                              Kalibrasi
                            </button>
                            <button
                              onClick={(e) => handleOpenSticker(inst, e)}
                              style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#d97706', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                              title="Cetak Stiker Kalibrasi"
                            >
                              <Printer size={13} />
                            </button>
                            <button
                              onClick={(e) => handleOpenEdit(inst, e)}
                              style={{ padding: '5px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', cursor: 'pointer' }}
                              title="Edit Data Alat"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(inst.id, e)}
                              style={{ padding: '5px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}
                              title="Hapus Alat"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredInstruments.length === 0 && (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                <Ruler size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <div style={{ fontWeight: 600 }}>Tidak ada alat ukur yang cocok dengan filter</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: CALIBRATION SCHEDULE & TIMELINE
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Jadwal Kalibrasi Mendatang (6 Bulan ke Depan)</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Rencana pengiriman alat ukur ke Laboratorium Akreditasi KAN / Kalibrasi In-House</p>
            </div>
            <button
              onClick={() => setShowEmailReminderModal(true)}
              style={{ padding: '8px 14px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Bell size={14} /> Kirim Pengingat Email
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {instruments.map(inst => {
              const statusConfig = getStatusConfig(inst.status);
              return (
                <div
                  key={inst.id}
                  style={{
                    backgroundColor: 'white', padding: '16px', borderRadius: '12px',
                    border: inst.status === 'OVERDUE' ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: '#6366f1' }}>{inst.id}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800,
                        backgroundColor: statusConfig.bg, color: statusConfig.color
                      }}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{inst.name}</h4>
                    <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: '#64748b' }}>Lokasi: {inst.location} • PIC: {inst.responsible}</p>

                    <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.78rem', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#64748b' }}>Kalibrasi Terakhir:</span>
                        <span style={{ fontWeight: 600 }}>{inst.last_calibration}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Jatuh Tempo:</span>
                        <strong style={{ color: inst.status === 'OVERDUE' ? '#ef4444' : '#0f172a' }}>{inst.next_calibration}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <button
                      onClick={() => handleOpenCalibrate(inst)}
                      style={{ flex: 1, padding: '7px 10px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Catat Kalibrasi
                    </button>
                    <button
                      onClick={() => handleViewDetail(inst)}
                      style={{ padding: '7px 12px', backgroundColor: 'white', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 3: CERTIFICATES & KAN ACCREDITATIONS
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'certificates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Repositori Sertifikat Kalibrasi ISO 17025</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Dokumen resmi sertifikat kalibrasi terakreditasi KAN (Komite Akreditasi Nasional)</p>
            </div>
            <button
              onClick={() => setShowUploadCertModal(true)}
              style={{ padding: '8px 14px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Upload size={14} /> Upload Sertifikat PDF
            </button>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>No. Sertifikat</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Alat Ukur Target</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Laboratorium Penerbit</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Ketidakpastian (U)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Masa Berlaku</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {instruments.map(inst => (
                  <tr key={inst.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                      {inst.certificate_number}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{inst.name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>ID: {inst.id} • SN: {inst.serial_number}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {inst.calibrated_by || 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)'}
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>
                      {inst.uncertainty}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {inst.last_calibration} s.d. <strong>{inst.next_calibration}</strong>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setViewingCertificate(inst)}
                        style={{ padding: '5px 10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FileText size={13} /> Lihat PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 4: MASTER REFERENCE STANDARDS
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'standards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Standar Rujukan Utama (Primary Reference Standards)</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Master Gauge Block & Standar Kalibrator internal pabrik dengan ketertelusuran ke SI Meter Internasional</p>
            </div>
            <button
              onClick={() => setShowAddStandardModal(true)}
              style={{ padding: '8px 14px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Tambah Standar Master
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {standards.map(ref => (
              <div key={ref.id || ref.code} style={{ backgroundColor: 'white', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                    {ref.code}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800 }}>✓ KAN Valid</span>
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>{ref.name}</h4>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px' }}>Rentang: <strong>{ref.range}</strong></div>

                <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>No. Sertifikat: <strong style={{ color: '#0284c7' }}>{ref.cert}</strong></div>
                  <div>Lab Kalibrasi: <strong>{ref.lab}</strong></div>
                  <div>Rantai Ketertelusuran: <strong style={{ color: '#10b981' }}>{ref.traceability}</strong></div>
                  <div>Jatuh Tempo: <strong>{ref.dueDate || ref.due_date}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 5: REPORTS & AUDIT COMPLIANCE
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Ringkasan Kepatuhan Audit Kalibrasi (ISO 17025 / IATF 16949)</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Metrik kesiapan audit metrologi dan performa kepatuhan kalibrasi pabrik</p>
            </div>
            <button
              onClick={() => {
                window.print();
              }}
              style={{ padding: '8px 14px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={14} /> Cetak Laporan Audit
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>Persentase Kepatuhan Kalibrasi</h4>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981', marginBottom: '8px' }}>
                {((stats.valid / (stats.total || 1)) * 100).toFixed(1)}%
              </div>
              <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ width: `${(stats.valid / (stats.total || 1)) * 100}%`, height: '100%', backgroundColor: '#10b981' }} />
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>{stats.valid} dari {stats.total} alat memenuhi standar ISO 17025.</p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>Peringatan Dini (Early Warning)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#ef4444', fontWeight: 700 }}>
                  <span>Overdue (Wajib Ditarik):</span>
                  <span>{stats.overdue} Alat</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
                  <span>Jatuh Tempo &lt; 30 Hari:</span>
                  <span>{stats.dueSoon} Alat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. ISO STANDARDS INFO FOOTER ─── */}
      <div style={{
        marginTop: '24px', padding: '18px', borderRadius: '12px',
        backgroundColor: '#0f172a', color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Shield size={18} color="#38bdf8" />
          <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Ketertelusuran Metrologi & Kepatuhan ISO 17025</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.8rem' }}>
          <div>
            <div style={{ color: '#94a3b8', marginBottom: '2px', fontWeight: 700 }}>Ketertelusuran Nasional</div>
            <div style={{ color: '#cbd5e1' }}>Terkalibrasi laboratorium KAN terakreditasi menuju standar SI Meter BIPM.</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', marginBottom: '2px', fontWeight: 700 }}>Ketidakpastian (Uncertainty)</div>
            <div style={{ color: '#cbd5e1' }}>Setiap alat mencantumkan estimasi ketidakpastian pengukuran $U$ (k=2).</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', marginBottom: '2px', fontWeight: 700 }}>Retensi Arsip Data</div>
            <div style={{ color: '#cbd5e1' }}>Data riwayat kalibrasi disimpan aman minimal 10 tahun untuk audit trail.</div>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: INSTRUMENT DETAIL MODAL ─── */}
      {showDetailModal && selectedInstrument && (
        <InstrumentDetailModal
          instrument={selectedInstrument}
          onClose={() => { setShowDetailModal(false); setSelectedInstrument(null); }}
          onCalibrate={() => {
            setShowDetailModal(false);
            setShowLogCalibrationModal(true);
          }}
          onPrintSticker={() => {
            setShowDetailModal(false);
            setShowStickerModal(true);
          }}
        />
      )}

      {/* ─── MODAL 2: ADD / EDIT INSTRUMENT MODAL ─── */}
      {showAddEditModal && (
        <AddEditInstrumentModal
          instrument={editingInstrument}
          onClose={() => { setShowAddEditModal(false); setEditingInstrument(null); }}
          onSave={async (savedInst) => {
            const saved = await saveMeasuringToolDB(savedInst);
            if (editingInstrument) {
              setInstruments(prev => prev.map(i => i.id === saved.id ? saved : i));
              toast.success(`Alat ukur ${saved.name} berhasil diperbarui di Supabase Cloud!`);
            } else {
              setInstruments(prev => [saved, ...prev]);
              toast.success(`Alat ukur baru ${saved.name} berhasil ditambahkan ke Supabase Cloud!`);
            }
            setShowAddEditModal(false);
            setEditingInstrument(null);
          }}
        />
      )}

      {/* ─── MODAL 3: LOG CALIBRATION MODAL ─── */}
      {showLogCalibrationModal && selectedInstrument && (
        <LogCalibrationModal
          instrument={selectedInstrument}
          onClose={() => { setShowLogCalibrationModal(false); setSelectedInstrument(null); }}
          onSave={async (updatedInst) => {
            await logCalibrationRecordDB(updatedInst);
            setInstruments(prev => prev.map(i => i.id === updatedInst.id ? { ...updatedInst, status: 'VALID' } : i));
            toast.success(`✓ Kalibrasi ${updatedInst.id} berhasil dicatat & disinkronkan ke Supabase! Status: VALID`);
            setShowLogCalibrationModal(false);
            setSelectedInstrument(null);
          }}
        />
      )}

      {/* ─── MODAL 4: PRINT CALIBRATION STICKER MODAL ─── */}
      {showStickerModal && selectedInstrument && (
        <PrintStickerModal
          instrument={selectedInstrument}
          onClose={() => { setShowStickerModal(false); setSelectedInstrument(null); }}
        />
      )}

      {/* ─── MODAL 5: EMAIL & DISPATCH REMINDER MODAL ─── */}
      {showEmailReminderModal && (
        <EmailReminderModal
          instruments={instruments}
          onClose={() => setShowEmailReminderModal(false)}
        />
      )}

      {/* ─── MODAL 6: UPLOAD CERTIFICATE MODAL ─── */}
      {showUploadCertModal && (
        <UploadCertificateModal
          instruments={instruments}
          onClose={() => setShowUploadCertModal(false)}
          onSave={async (updatedTool) => {
            const saved = await saveMeasuringToolDB(updatedTool);
            setInstruments(prev => prev.map(i => i.id === saved.id ? saved : i));
            toast.success(`Sertifikat ${saved.certificate_number} berhasil diarsipkan ke Supabase!`);
            setShowUploadCertModal(false);
          }}
        />
      )}

      {/* ─── MODAL 7: ADD REFERENCE STANDARD MODAL ─── */}
      {showAddStandardModal && (
        <AddStandardModal
          onClose={() => setShowAddStandardModal(false)}
          onSave={(newStd) => {
            setStandards(prev => [newStd, ...prev]);
            toast.success(`Master standar ${newStd.name} berhasil ditambahkan!`);
            setShowAddStandardModal(false);
          }}
        />
      )}

      {/* ─── MODAL 8: VIEW CERTIFICATE MODAL ─── */}
      {viewingCertificate && (
        <ViewCertificateModal
          instrument={viewingCertificate}
          onClose={() => setViewingCertificate(null)}
        />
      )}

    </div>
  );
};

// =====================================================
// STAT CARD COMPONENT
// =====================================================

const StatCard = ({ title, value, icon: Icon, color, bgColor = '#f1f5f9' }) => (
  <div style={{
    padding: '16px', borderRadius: '12px', backgroundColor: 'white',
    border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>{title}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: color }}>{value}</div>
      </div>
      <div style={{
        width: '38px', height: '38px', borderRadius: '10px',
        backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={18} color={color} />
      </div>
    </div>
  </div>
);

// =====================================================
// MODAL: INSTRUMENT DETAIL MODAL
// =====================================================

const InstrumentDetailModal = ({ instrument, onClose, onCalibrate, onPrintSticker }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '800px', maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{instrument.name}</h2>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#6366f118', color: '#6366f1', padding: '2px 8px', borderRadius: '4px' }}>
                {instrument.id}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
              {instrument.manufacturer} {instrument.model} • SN: {instrument.serial_number}
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          {[
            { id: 'overview', label: 'Spesifikasi Teknis' },
            { id: 'calibration', label: 'Status & Sertifikat Kalibrasi' },
            { id: 'traceability', label: 'Ketertelusuran Standar' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                background: 'transparent', color: activeTab === tab.id ? '#6366f1' : '#64748b',
                borderBottom: activeTab === tab.id ? '2.5px solid #6366f1' : '2.5px solid transparent'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>Spesifikasi Dimensi & Presisi</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <InfoRow label="Rentang Ukur (Range)" value={instrument.range} />
                  <InfoRow label="Resolusi Display" value={instrument.resolution} />
                  <InfoRow label="Batas Toleransi (MPE)" value={instrument.accuracy} />
                  <InfoRow label="Lokasi Penyimpanan" value={instrument.location} />
                  <InfoRow label="Penanggung Jawab (PIC)" value={instrument.responsible} />
                </div>
              </div>
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>Data Pabrikan & Perangkat</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <InfoRow label="Manufaktur / Merk" value={instrument.manufacturer} />
                  <InfoRow label="Model / Tipe" value={instrument.model} />
                  <InfoRow label="Nomor Serial (SN)" value={instrument.serial_number} />
                  <InfoRow label="Interval Kalibrasi" value={`${instrument.calibration_interval} Bulan`} />
                  <InfoRow label="Catatan Operasional" value={instrument.notes || '-'} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calibration' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <InfoRow label="No. Sertifikat KAN" value={instrument.certificate_number} />
                <InfoRow label="Laboratorium Penguji" value={instrument.calibrated_by || 'PT. Kalibrasi Presisi Indonesia'} />
                <InfoRow label="Tanggal Kalibrasi Terakhir" value={instrument.last_calibration} />
                <InfoRow label="Jatuh Tempo Kalibrasi" value={instrument.next_calibration} />
                <InfoRow label="Estimasi Ketidakpastian (U)" value={instrument.uncertainty} />
                <InfoRow label="Status Keabsahan" value={instrument.status} />
              </div>
            </div>
          )}

          {activeTab === 'traceability' && (
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 800 }}>Hierarki Ketertelusuran (Traceability Chain)</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>
                BIPM (International Bureau of Weights and Measures - SI Meter) <br />
                ↓ <br />
                PTB Germany / BSML Jakarta (National Metrology Institute) <br />
                ↓ <br />
                Laboratorium Kalibrasi Terakreditasi KAN (LP-123) <br />
                ↓ <br />
                <strong>{instrument.name} ({instrument.id})</strong>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc'
        }}>
          <button
            onClick={onPrintSticker}
            style={{
              padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '8px',
              background: 'white', color: '#b45309', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Printer size={14} /> Cetak Stiker Kalibrasi
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '9px 16px', border: '1px solid #cbd5e1', borderRadius: '8px',
                background: 'white', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
              }}
            >
              Tutup
            </button>
            <button
              onClick={onCalibrate}
              style={{
                padding: '9px 18px', border: 'none', borderRadius: '8px',
                background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem'
              }}
            >
              Catat Kalibrasi Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// MODAL: ADD / EDIT INSTRUMENT MODAL
// =====================================================

const AddEditInstrumentModal = ({ instrument, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: instrument?.id || `INS-${Math.floor(100 + Math.random() * 900)}`,
    name: instrument?.name || '',
    type: instrument?.type || 'caliper',
    manufacturer: instrument?.manufacturer || 'Mitutoyo',
    model: instrument?.model || '',
    serial_number: instrument?.serial_number || '',
    range: instrument?.range || '0-150mm',
    resolution: instrument?.resolution || '0.01mm',
    accuracy: instrument?.accuracy || '±0.02mm',
    location: instrument?.location || 'QC Lab Line 1',
    responsible: instrument?.responsible || 'Budi (QA Metrology)',
    calibration_interval: instrument?.calibration_interval || 6,
    last_calibration: instrument?.last_calibration || new Date().toISOString().split('T')[0],
    next_calibration: instrument?.next_calibration || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    status: instrument?.status || 'VALID',
    certificate_number: instrument?.certificate_number || `CAL-CERT-${new Date().getFullYear()}-001`,
    calibrated_by: instrument?.calibrated_by || 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)',
    uncertainty: instrument?.uncertainty || '0.02mm (k=2)',
    traceable: true,
    notes: instrument?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Nama alat ukur wajib diisi!');
      return;
    }
    onSave(formData);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '700px', maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            {instrument ? 'Edit Data Alat Ukur' : 'Tambah Alat Ukur Baru'}
          </h3>
          <button onClick={onClose} style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Kode ID Alat</label>
              <input
                type="text"
                value={formData.id}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
                required
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Nama Alat Ukur</label>
              <input
                type="text"
                placeholder="misal: Digital Caliper 150mm"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Kategori Alat</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', backgroundColor: 'white' }}
              >
                {INSTRUMENT_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Manufaktur / Merk</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Model & SN</label>
              <input
                type="text"
                placeholder="Model / Serial No"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Rentang Ukur (Range)</label>
              <input
                type="text"
                value={formData.range}
                onChange={e => setFormData({ ...formData, range: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Resolusi</label>
              <input
                type="text"
                value={formData.resolution}
                onChange={e => setFormData({ ...formData, resolution: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Akurasi / Toleransi MPE</label>
              <input
                type="text"
                value={formData.accuracy}
                onChange={e => setFormData({ ...formData, accuracy: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Lokasi Penempatan</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>PIC Penanggung Jawab</label>
              <input
                type="text"
                value={formData.responsible}
                onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Tgl Kalibrasi Terakhir</label>
              <input
                type="date"
                value={formData.last_calibration}
                onChange={e => setFormData({ ...formData, last_calibration: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Jatuh Tempo (Due Date)</label>
              <input
                type="date"
                value={formData.next_calibration}
                onChange={e => setFormData({ ...formData, next_calibration: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
            >
              Batal
            </button>
            <button
              type="submit"
              style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
            >
              Simpan Data Alat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =====================================================
// MODAL: LOG CALIBRATION RECORD
// =====================================================

const LogCalibrationModal = ({ instrument, onClose, onSave }) => {
  const [certNo, setCertNo] = useState(`CAL-CERT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [calDate, setCalDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDate, setNextDate] = useState(new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]);
  const [calLab, setCalLab] = useState('PT. Kalibrasi Presisi Indonesia (KAN LP-123)');
  const [uncertainty, setUncertainty] = useState(instrument.uncertainty || '0.002mm (k=2)');
  const [inspector, setInspector] = useState('Budi (QA Metrology)');

  const handleSave = () => {
    const updated = {
      ...instrument,
      last_calibration: calDate,
      next_calibration: nextDate,
      certificate_number: certNo,
      calibrated_by: calLab,
      uncertainty: uncertainty,
      status: 'VALID'
    };
    onSave(updated);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '560px',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Catat Hasil Kalibrasi Ulang</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Target: {instrument.name} ({instrument.id})</p>
          </div>
          <button onClick={onClose} style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Nomor Sertifikat Baru</label>
            <input
              type="text"
              value={certNo}
              onChange={e => setCertNo(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Tanggal Pelaksanaan</label>
              <input
                type="date"
                value={calDate}
                onChange={e => setCalDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Jatuh Tempo Berikutnya</label>
              <input
                type="date"
                value={nextDate}
                onChange={e => setNextDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Laboratorium Akreditasi / Kalibrator</label>
            <input
              type="text"
              value={calLab}
              onChange={e => setCalLab(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Estimasi Ketidakpastian Pengukuran (U)</label>
            <input
              type="text"
              value={uncertainty}
              onChange={e => setUncertainty(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
            />
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8fafc' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
            Batal
          </button>
          <button onClick={handleSave} style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
            Validasi & Simpan Kalibrasi
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// MODAL: PRINT CALIBRATION STICKER
// =====================================================

const PrintStickerModal = ({ instrument, onClose }) => {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '480px',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Stiker Kalibrasi Siap Cetak (ISO 17025)</h3>
          <button onClick={onClose} style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Visual Sticker Card */}
          <div style={{ width: '100%', maxWidth: '340px', border: '2px solid black', borderRadius: '6px', padding: '14px', backgroundColor: 'white', color: 'black', fontFamily: 'sans-serif' }}>
            <div style={{ backgroundColor: '#10b981', color: 'white', fontWeight: 900, textAlign: 'center', padding: '4px', borderRadius: '3px', fontSize: '0.78rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
              CALIBRATED / TERCALIBRASI
            </div>

            <div style={{ fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>ID ALAT:</span>
                <strong style={{ fontFamily: 'monospace' }}>{instrument.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>NAMA ALAT:</span>
                <strong>{instrument.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>NO. SERTIFIKAT:</span>
                <span style={{ fontFamily: 'monospace' }}>{instrument.certificate_number}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', fontSize: '0.68rem', marginBottom: '8px', fontFamily: 'monospace' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontWeight: 700 }}>TGL KALIBRASI:</span>
                <strong>{instrument.last_calibration}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontWeight: 700 }}>JATUH TEMPO:</span>
                <strong style={{ color: '#ef4444' }}>{instrument.next_calibration}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#64748b', fontStyle: 'italic' }}>
              <span>Accredited Lab: KAN LP-123</span>
              <span>QC Sign: ___________</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8fafc' }}>
          <button onClick={onClose} style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
            Tutup
          </button>
          <button
            onClick={() => window.print()}
            style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', background: '#d97706', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={14} /> Cetak Stiker
          </button>
        </div>
      </div>
    </div>
  );
};

// Info Row Helper
const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{label}</span>
    <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#0f172a' }}>{value}</span>
  </div>
);

// =====================================================
// MODAL: EMAIL & NOTIFICATION DISPATCH REMINDER
// =====================================================

const EmailReminderModal = ({ instruments, onClose }) => {
  const overdueTools = instruments.filter(i => i.status === 'OVERDUE');
  const dueSoonTools = instruments.filter(i => i.status === 'DUE_SOON');
  const [recipients, setRecipients] = useState(['qa.metrology@company.com', 'qc.supervisor@plant1.com', 'maintenance.lead@factory.com']);
  const [newRecipient, setNewRecipient] = useState('');
  const [channel, setChannel] = useState('email'); // 'email' | 'whatsapp' | 'push'
  const [subject, setSubject] = useState(`[PERINGATAN METROLOGI] Jadwal Kalibrasi Alat Ukur ISO 17025 - ${new Date().toLocaleDateString('id-ID')}`);
  const [isSending, setIsSending] = useState(false);

  const handleAddRecipient = () => {
    if (newRecipient.trim() && !recipients.includes(newRecipient.trim())) {
      setRecipients([...recipients, newRecipient.trim()]);
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (email) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleSend = () => {
    if (recipients.length === 0) {
      toast.error('Minimal masukkan 1 alamat email penerima!');
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast.success(`✓ Pengingat kalibrasi berhasil dikirim ke ${recipients.length} penerima via ${channel.toUpperCase()}!`);
      onClose();
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '650px', maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', padding: '6px', borderRadius: '8px', color: '#6366f1' }}>
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Kirim Pengingat Jadwal Kalibrasi</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>Notifikasi otomatis untuk alat ukur yang Overdue dan Mendekati Jatuh Tempo</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Target Summary Alert */}
          <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>Ringkasan Alat Ukur Perlu Ditindaklanjuti:</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#ef4444', fontWeight: 700, fontSize: '0.74rem' }}>
                🔴 {overdueTools.length} Alat Overdue (Wajib Ditarik)
              </span>
              <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.74rem' }}>
                ⚠️ {dueSoonTools.length} Alat Jatuh Tempo &lt;30 Hari
              </span>
            </div>
          </div>

          {/* Channel Selector */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Saluran Notifikasi (Channel)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { id: 'email', label: '✉️ Email SMTP', desc: 'Laporan HTML Lengkap' },
                { id: 'whatsapp', label: '💬 WhatsApp API', desc: 'Pesan Ringkas Operator' },
                { id: 'push', label: '🔔 In-App System', desc: 'Push Alert Mandor' }
              ].map(c => (
                <div
                  key={c.id}
                  onClick={() => setChannel(c.id)}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                    border: channel === c.id ? '2px solid #6366f1' : '1px solid #cbd5e1',
                    backgroundColor: channel === c.id ? '#e0e7ff' : 'white'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: channel === c.id ? '#4338ca' : '#1e293b' }}>{c.label}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recipients Chips */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Daftar Penerima Notifikasi</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {recipients.map(r => (
                <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                  {r}
                  <button onClick={() => handleRemoveRecipient(r)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94a3b8' }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="email"
                placeholder="Tambahkan email penerima..."
                value={newRecipient}
                onChange={e => setNewRecipient(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddRecipient())}
                style={{ flex: 1, padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem' }}
              />
              <button
                type="button"
                onClick={handleAddRecipient}
                style={{ padding: '7px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f8fafc', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Tambah
              </button>
            </div>
          </div>

          {/* Subject & Preview */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Subjek Pesan</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}
            />
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8fafc' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
            Batal
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isSending ? <RefreshCw size={14} className="animate-spin" /> : <Bell size={14} />}
            <span>{isSending ? 'Mengirim...' : 'Kirim Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// MODAL: UPLOAD CERTIFICATE MODAL
// =====================================================

const UploadCertificateModal = ({ instruments, onClose, onSave }) => {
  const [selectedToolId, setSelectedToolId] = useState(instruments[0]?.id || '');
  const [certNumber, setCertNumber] = useState(`CAL-CERT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [labName, setLabName] = useState('PT. Kalibrasi Presisi Indonesia (KAN LP-123)');
  const [calDate, setCalDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDate, setNextDate] = useState(new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]);
  const [fileName, setFileName] = useState('');

  const targetTool = instruments.find(i => i.id === selectedToolId) || instruments[0];

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!targetTool) return;
    const updated = {
      ...targetTool,
      certificate_number: certNumber,
      calibrated_by: labName,
      last_calibration: calDate,
      next_calibration: nextDate,
      status: 'VALID'
    };
    onSave(updated);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '580px', maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Upload Sertifikat Kalibrasi PDF</h3>
          <button onClick={onClose} style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleUploadSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Pilih Alat Ukur</label>
            <select
              value={selectedToolId}
              onChange={e => setSelectedToolId(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', backgroundColor: 'white' }}
            >
              {instruments.map(i => (
                <option key={i.id} value={i.id}>{i.id} - {i.name} ({i.serial_number})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Nomor Sertifikat KAN</label>
            <input
              type="text"
              value={certNumber}
              onChange={e => setCertNumber(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Laboratorium Penerbit</label>
            <input
              type="text"
              value={labName}
              onChange={e => setLabName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Tgl Kalibrasi</label>
              <input
                type="date"
                value={calDate}
                onChange={e => setCalDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Jatuh Tempo</label>
              <input
                type="date"
                value={nextDate}
                onChange={e => setNextDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          {/* File Picker Dropzone */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>File Dokumen PDF</label>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '16px', textAlign: 'center', backgroundColor: '#f8fafc', cursor: 'pointer' }}>
              <input
                type="file"
                accept=".pdf,.png,.jpg"
                onChange={e => setFileName(e.target.files[0]?.name || '')}
                style={{ display: 'none' }}
                id="cert-file-picker"
              />
              <label htmlFor="cert-file-picker" style={{ cursor: 'pointer' }}>
                <Upload size={24} style={{ color: '#0284c7', margin: '0 auto 6px', display: 'block' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7' }}>
                  {fileName ? `File Terpilih: ${fileName}` : 'Klik untuk Pilih File PDF Sertifikat'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Format: PDF, PNG, JPG (Maks. 10MB)</div>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
              Batal
            </button>
            <button type="submit" style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#0284c7', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
              Arsipkan Sertifikat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =====================================================
// MODAL: ADD REFERENCE STANDARD MODAL
// =====================================================

const AddStandardModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: `REF-${Math.floor(10 + Math.random() * 90)}`,
    name: '',
    code: `GB-SET-${Math.floor(100 + Math.random() * 900)}`,
    range: '1.005 - 100mm (Grade 0)',
    cert: `KAN-STD-${new Date().getFullYear()}-01`,
    dueDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    lab: 'BSML Jakarta (Balai Standarisasi Metrologi Legal)',
    traceability: 'BSML Jakarta → BIPM SI Meter'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Nama master standar wajib diisi!');
      return;
    }
    onSave(formData);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '560px',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Tambah Standar Rujukan Master</h3>
          <button onClick={onClose} style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Kode Standar</label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                required
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Nama Standar Rujukan</label>
              <input
                type="text"
                placeholder="misal: Master Gauge Block Set (Grade 0)"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Rentang Ukur / Spesifikasi</label>
            <input
              type="text"
              value={formData.range}
              onChange={e => setFormData({ ...formData, range: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>No. Sertifikat</label>
              <input
                type="text"
                value={formData.cert}
                onChange={e => setFormData({ ...formData, cert: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Jatuh Tempo</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Rantai Ketertelusuran (Traceability Chain)</label>
            <input
              type="text"
              value={formData.traceability}
              onChange={e => setFormData({ ...formData, traceability: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
              Batal
            </button>
            <button type="submit" style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#d97706', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
              Simpan Standar Master
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =====================================================
// MODAL: VIEW CERTIFICATE MODAL
// =====================================================

const ViewCertificateModal = ({ instrument, onClose }) => {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '680px', maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Salinan Digital Sertifikat Kalibrasi ISO 17025</h3>
          <button onClick={onClose} style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Certificate Paper Style */}
          <div style={{ border: '3px double #0284c7', borderRadius: '8px', padding: '24px', backgroundColor: '#fafbfc' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0284c7', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.7rem', letterSpacing: '2px', color: '#0284c7', fontWeight: 900 }}>KOMITE AKREDITASI NASIONAL (KAN)</div>
              <h2 style={{ margin: '4px 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>CERTIFICATE OF CALIBRATION</h2>
              <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: '#6366f1' }}>No: {instrument.certificate_number}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.8rem', marginBottom: '16px' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>IDENTITAS ALAT (INSTRUMENT)</div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{instrument.name}</div>
                <div>Merk / Model: {instrument.manufacturer} {instrument.model}</div>
                <div>Serial Number: <strong>{instrument.serial_number}</strong></div>
                <div>Kode ID Pabrik: <strong>{instrument.id}</strong></div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>LABORATORIUM PENGUJI (ACCREDITED LAB)</div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{instrument.calibrated_by || 'PT. Kalibrasi Presisi Indonesia'}</div>
                <div>Akreditasi: <strong>KAN LP-123-IDN</strong></div>
                <div>Metode Standar: ISO/IEC 17025:2017</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Tanggal Kalibrasi: <strong>{instrument.last_calibration}</strong></span>
                <span>Jatuh Tempo: <strong style={{ color: '#059669' }}>{instrument.next_calibration}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ketidakpastian (U): <strong style={{ color: '#6366f1' }}>{instrument.uncertainty}</strong></span>
                <span>Tingkat Kepercayaan: <strong>95% (k=2)</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px', borderTop: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                <div>✓ Traceable to SI Meter BIPM</div>
                <div>Verified by Head of Metrology</div>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#059669' }}>
                [ VERIFIED & ACCREDITED ]
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8fafc' }}>
          <button onClick={onClose} style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
            Tutup
          </button>
          <button
            onClick={() => window.print()}
            style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', background: '#0284c7', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={14} /> Cetak Sertifikat
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeasuringToolsManager;

