import React, { useState } from 'react';
import {
  Wrench,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Printer,
  Calendar,
  Award,
  Sparkles,
  Sliders,
  CheckSquare,
  FileText,
  FileCheck,
  Clock,
  RefreshCw,
  Search,
  Zap,
  Info,
  ExternalLink,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TOOL_DEFINITIONS, getCalibrationStatus } from '../../utils/metrologyToolUtils';
import { getMeasuringTools } from '../../utils/supabaseMeasuringToolsDB';

// Standard Master Gauge Blocks for Verification (Grade 0 / Grade K)
const GAUGE_BLOCK_STANDARDS = [
  { id: 'gb_10', nominal: 10.000, grade: 'Grade 0 (DIN EN ISO 3650)', certNo: 'BLOCK-KAN-2026-01' },
  { id: 'gb_25', nominal: 25.000, grade: 'Grade 0 (DIN EN ISO 3650)', certNo: 'BLOCK-KAN-2026-02' },
  { id: 'gb_50', nominal: 50.000, grade: 'Grade 0 (DIN EN ISO 3650)', certNo: 'BLOCK-KAN-2026-03' },
  { id: 'gb_100', nominal: 100.000, grade: 'Grade 0 (DIN EN ISO 3650)', certNo: 'BLOCK-KAN-2026-04' }
];

export default function CalibrationManagerModal({
  isOpen,
  onClose,
  selectedToolId,
  onSelectTool,
  initialTab = 'inventory'
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'inventory' | 'verifier' | 'daily_check' | 'sticker' | 'certificates'
  const [tools, setTools] = useState(TOOL_DEFINITIONS);
  const [activeToolId, setActiveToolId] = useState(selectedToolId || tools[0]?.id || 'caliper');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCertTool, setSelectedCertTool] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);

  // Fetch Cloud Tools on modal open
  React.useEffect(() => {
    if (isOpen) {
      getMeasuringTools().then(data => {
        if (data && data.length > 0) {
          // Format icons and mapping if needed
          const formatted = data.map(t => ({
            ...t,
            icon: t.type === 'micrometer' ? '🔍' : t.type === 'dial_indicator' ? '⏲️' : t.type === 'bore_gauge' ? '🕳️' : t.type === 'height_gauge' ? '📐' : t.type === 'cmm' ? '🤖' : '📏',
            code: t.id,
            cert: t.certificate_number || 'CAL-CERT-2026',
            calibrationDueDate: t.next_calibration || '2026-12-31',
            lastCalibrated: t.last_calibration || '2026-06-01',
            calibratedBy: t.calibrated_by || 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)',
            uncertainty: parseFloat(t.uncertainty) || 0.02
          }));
          setTools(formatted);
        }
      });
    }
  }, [isOpen]);

  // Gauge Block Verifier State
  const [selectedBlock, setSelectedBlock] = useState(GAUGE_BLOCK_STANDARDS[1]); // 25.000mm
  const [measuredReading, setMeasuredReading] = useState('25.002');
  const [verificationHistory, setVerificationHistory] = useState([
    {
      id: 'vh_1',
      date: new Date().toISOString().split('T')[0],
      toolCode: 'CAL-003',
      toolName: 'Digital Caliper 150mm',
      blockNominal: 25.000,
      reading: 25.001,
      deviation: 0.001,
      maxAllowedError: 0.020,
      result: 'PASS',
      inspector: 'Budi (QA Metrology)'
    },
    {
      id: 'vh_2',
      date: new Date().toISOString().split('T')[0],
      toolCode: 'MIC-102',
      toolName: 'Outside Micrometer 25mm',
      blockNominal: 25.000,
      reading: 25.000,
      deviation: 0.000,
      maxAllowedError: 0.003,
      result: 'PASS',
      inspector: 'Budi (QA Metrology)'
    }
  ]);

  // Daily Checklist state
  const [checklist, setChecklist] = useState({
    zeroCheck: true,
    visualAnvilCheck: true,
    smoothMovement: true,
    batteryCheck: true,
    stickerIntact: true
  });
  const [checklistSigned, setChecklistSigned] = useState(false);

  if (!isOpen) return null;

  const currentTool = tools.find(t => t.id === activeToolId) || tools[0];

  // Verification calculation
  const readingNum = parseFloat(measuredReading) || selectedBlock.nominal;
  const deviation = readingNum - selectedBlock.nominal;
  const isPass = Math.abs(deviation) <= (currentTool.uncertainty || 0.02);

  const handleSaveVerification = () => {
    const newRecord = {
      id: `vh_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      toolCode: currentTool.code,
      toolName: currentTool.name,
      blockNominal: selectedBlock.nominal,
      reading: readingNum,
      deviation: parseFloat(deviation.toFixed(4)),
      maxAllowedError: currentTool.uncertainty,
      result: isPass ? 'PASS' : 'FAIL (Exceeds MPE)',
      inspector: 'Operator Metrologi'
    };

    setVerificationHistory(prev => [newRecord, ...prev]);
    if (isPass) {
      toast.success(`✓ Verifikasi ${currentTool.code} Lolos! Deviasi: ${deviation >= 0 ? '+' : ''}${deviation.toFixed(3)} mm`);
    } else {
      toast.error(`⚠️ Deviasi (${deviation.toFixed(3)} mm) melebihi batas toleransi alat (${currentTool.uncertainty} mm)!`);
    }
  };

  const handleCompleteDailyCheck = () => {
    setChecklistSigned(true);
    toast.success(`✓ Cek Harian Alat Ukur ${currentTool.code} Tervalidasi (ISO 9001: 7.1.5)!`);
  };

  const filteredTools = tools.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.cert.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white">
        
        {/* ─── MODAL HEADER ─── */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Wrench size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  Pusat Kalibrasi & Manajemen Alat Ukur Metrologi
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  ISO 17025 & ISO 9001: 7.1.5
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Verifikasi Standar Master Gauge Block, Pelacakan Sertifikat Kalibrasi, dan Cek Harian Presisi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── NAVIGATION TABS ─── */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-950/60 shrink-0">
          {[
            { key: 'inventory', label: `Daftar Alat Ukur (${tools.length})`, icon: Wrench },
            { key: 'verifier', label: 'Verifikasi Master Gauge Block', icon: Sliders },
            { key: 'daily_check', label: 'Cek Harian Pra-Kerja', icon: CheckSquare },
            { key: 'sticker', label: 'Cetak Stiker Kalibrasi ISO', icon: Printer },
            { key: 'certificates', label: 'Sertifikat Kalibrasi (ISO 17025)', icon: FileCheck },
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── MAIN CONTENT BODY ─── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ═══ TAB 1: INVENTORY & STATUS KALIBRASI ═══ */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              {/* Search and Summary */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama alat, ID, atau No Sertifikat..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    🟢 {tools.filter(t => getCalibrationStatus(t).status === 'VALID').length} Valid
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    ⚠️ {tools.filter(t => getCalibrationStatus(t).status === 'DUE_SOON').length} Due Soon
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    🔴 {tools.filter(t => getCalibrationStatus(t).status === 'EXPIRED').length} Expired
                  </span>
                </div>
              </div>

              {/* Grid of Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTools.map(tool => {
                  const status = getCalibrationStatus(tool);
                  const isSelected = activeToolId === tool.id;

                  return (
                    <div
                      key={tool.id}
                      onClick={() => {
                        setActiveToolId(tool.id);
                        if (onSelectTool) onSelectTool(tool.id);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/20 shadow-lg'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl">{tool.icon}</span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
                            style={{ backgroundColor: status.bg, borderColor: status.border, color: status.color }}
                          >
                            {status.icon} {status.status}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-white mb-0.5">{tool.name}</h4>
                        <div className="text-[11px] font-mono text-slate-400 mb-2">ID: <strong className="text-amber-300">{tool.code}</strong></div>

                        <div className="space-y-1 text-[10px] text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                          <div className="flex justify-between">
                            <span className="text-slate-400">No. Sertifikat:</span>
                            <span className="font-mono text-slate-200">{tool.cert}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ketidakpastian (U):</span>
                            <span className="text-emerald-400 font-bold">±{tool.uncertainty} {tool.uncertaintyUnit || 'mm'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Tgl Kalibrasi Terakhir:</span>
                            <span className="text-slate-200">{tool.lastCalibrated}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Jatuh Tempo (Due):</span>
                            <span className="font-bold text-amber-300">{tool.calibrationDueDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 truncate max-w-[170px]" title={tool.calibratedBy}>
                          🏛️ {tool.calibratedBy}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCertTool(tool);
                              setShowCertModal(true);
                            }}
                            className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 rounded font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Buka Salinan Digital Sertifikat Resmi ISO 17025"
                          >
                            <FileCheck size={11} /> Sertifikat
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveToolId(tool.id);
                              setActiveTab('verifier');
                            }}
                            className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-200 rounded font-bold transition-colors cursor-pointer"
                          >
                            Verifikasi
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ TAB 2: VERIFIKASI MASTER GAUGE BLOCK ═══ */}
          {activeTab === 'verifier' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{currentTool.icon}</span>
                  <div>
                    <h4 className="font-bold text-sm text-white">{currentTool.name} ({currentTool.code})</h4>
                    <p className="text-[11px] text-slate-400">
                      MPE Toleransi: <strong className="text-amber-400">±{currentTool.uncertainty} mm</strong> • Resolusi: <strong>{currentTool.resolution} mm</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Ganti Alat:</span>
                  <select
                    value={activeToolId}
                    onChange={e => setActiveToolId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                  >
                    {tools.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Master Gauge Block Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  1. Pilih Master Gauge Block Standar (Kalibrator):
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {GAUGE_BLOCK_STANDARDS.map(block => (
                    <button
                      key={block.id}
                      onClick={() => {
                        setSelectedBlock(block);
                        setMeasuredReading(block.nominal.toFixed(3));
                      }}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        selectedBlock.id === block.id
                          ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="font-mono text-sm font-black text-amber-400 mb-0.5">
                        {block.nominal.toFixed(3)} mm
                      </div>
                      <div className="text-[10px] text-slate-400">{block.grade}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Reading Input & Calculation */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    2. Masukkan Pembacaan Alat ({currentTool.code}):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      value={measuredReading}
                      onChange={e => setMeasuredReading(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-base font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                      mm
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Jepit master block pada rahang alat ukur, lalu masukkan angka display.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-400 block mb-1">Deviasi / Bias Pengukuran (&Delta;):</span>
                  <div className={`font-mono text-xl font-black ${isPass ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {deviation >= 0 ? `+${deviation.toFixed(3)}` : deviation.toFixed(3)} mm
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Maks. Diizinkan: &plusmn;{currentTool.uncertainty} mm
                  </span>
                </div>

                <div className="flex flex-col justify-between">
                  <div className={`p-3 rounded-lg border text-center font-bold text-xs flex items-center justify-center gap-2 ${
                    isPass
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  }`}>
                    {isPass ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    <span>{isPass ? 'VERIFIKASI LOLOS (PASS)' : 'DITOLAK (FAIL / RE-CALIBRATE)'}</span>
                  </div>

                  <button
                    onClick={handleSaveVerification}
                    className="w-full mt-2 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileText size={14} /> Simpan Log Verifikasi
                  </button>
                </div>
              </div>

              {/* Historical Log */}
              <div>
                <h5 className="font-bold text-xs text-slate-300 mb-2">Riwayat Verifikasi Standar Gauge Block:</h5>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Tanggal</th>
                        <th className="p-2.5">Alat Ukur</th>
                        <th className="p-2.5">Master Block</th>
                        <th className="p-2.5">Hasil Ukur</th>
                        <th className="p-2.5">Deviasi (&Delta;)</th>
                        <th className="p-2.5">Hasil</th>
                        <th className="p-2.5">Inspector</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                      {verificationHistory.map(item => (
                        <tr key={item.id} className="hover:bg-slate-850">
                          <td className="p-2.5 text-slate-400 font-mono">{item.date}</td>
                          <td className="p-2.5 font-bold text-white">{item.toolCode}</td>
                          <td className="p-2.5 font-mono text-amber-300">{item.blockNominal.toFixed(3)} mm</td>
                          <td className="p-2.5 font-mono text-slate-200">{item.reading.toFixed(3)} mm</td>
                          <td className="p-2.5 font-mono font-bold text-emerald-400">
                            {item.deviation >= 0 ? `+${item.deviation.toFixed(3)}` : item.deviation.toFixed(3)} mm
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {item.result}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400">{item.inspector}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB 3: DAILY PRE-INSPECTION CHECKLIST ═══ */}
          {activeTab === 'daily_check' && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">Lembar Pemeriksaan Harian Pra-Kerja Alat Ukur</h4>
                    <p className="text-[11px] text-slate-400">Alat Target: <strong className="text-amber-300">{currentTool.name} ({currentTool.code})</strong></p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    Shift: {new Date().getHours() < 15 ? 'Shift 1' : 'Shift 2'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 bg-slate-950 p-5 rounded-xl border border-slate-800">
                {[
                  { key: 'zeroCheck', title: '1. Titik Nol (Zero Datum Check)', desc: 'Rahang ukur dirapatkan, display LCD harus menunjukkan tepat 0.000 mm tanpa celah cahaya.' },
                  { key: 'visualAnvilCheck', title: '2. Kebersihan & Bebas Cacat Permukaan Kontak', desc: 'Permukaan ukur carbide bersih dari gram/debu, tidak berkarat, dan tidak gompal.' },
                  { key: 'smoothMovement', title: '3. Kelancaran Gesekan Slider / Thimble', desc: 'Gerakan rahang / thimble ratchet lancar tanpa tersendat atau oblak.' },
                  { key: 'batteryCheck', title: '4. Kondisi Baterai & Kontras Display LCD', desc: 'Angka digital jelas, tidak berkedip redup (indikator baterai penuh).' },
                  { key: 'stickerIntact', title: '5. Keberadaan & Keabsahan Stiker Kalibrasi', desc: 'Stiker kalibrasi tertempel utuh pada bodi alat dan tanggal belum kedaluwarsa.' },
                ].map(item => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 hover:bg-slate-900/80 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checklist[item.key]}
                      onChange={e => setChecklist(p => ({ ...p, [item.key]: e.target.checked }))}
                      className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400 h-4 w-4 bg-slate-900"
                    />
                    <div>
                      <div className="font-bold text-xs text-white">{item.title}</div>
                      <div className="text-[11px] text-slate-400">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  {Object.values(checklist).filter(Boolean).length} dari 5 poin tervalidasi
                </span>

                <button
                  onClick={handleCompleteDailyCheck}
                  disabled={!Object.values(checklist).every(Boolean)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck size={15} /> {checklistSigned ? '✓ Cek Harian Tervalidasi' : 'Validasi Cek Harian'}
                </button>
              </div>
            </div>
          )}

          {/* ═══ TAB 4: CETAK STIKER KALIBRASI ISO ═══ */}
          {activeTab === 'sticker' && (
            <div className="space-y-6 flex flex-col items-center">
              <div className="w-full max-w-md bg-white text-black p-5 rounded-lg border-2 border-black shadow-xl font-sans">
                {/* Calibration Sticker Header */}
                <div className="bg-emerald-600 text-white font-black text-center py-1 rounded text-xs tracking-wider uppercase mb-3">
                  CALIBRATED / TERCALIBRASI
                </div>

                <div className="space-y-1.5 text-[11px] border-b pb-2 mb-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-600">ID Alat:</span>
                    <span className="font-black font-mono">{currentTool.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-600">Nama Alat:</span>
                    <span className="font-bold">{currentTool.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-600">No. Sertifikat:</span>
                    <span className="font-mono">{currentTool.cert}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] bg-gray-100 p-2 rounded mb-2 font-mono">
                  <div>
                    <span className="block text-gray-500 font-bold">TGL KALIBRASI:</span>
                    <strong className="text-black">{currentTool.lastCalibrated}</strong>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-bold">JATUH TEMPO (DUE):</span>
                    <strong className="text-rose-600 font-black">{currentTool.calibrationDueDate}</strong>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] text-gray-600 italic">
                  <span>Accredited Lab: LP-123 (KAN)</span>
                  <span>QC Sign: ___________</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Printer size={15} /> Cetak Stiker Kalibrasi
                </button>
                <button
                  onClick={() => {
                    setSelectedCertTool(currentTool);
                    setShowCertModal(true);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FileCheck size={15} /> Lihat Salinan Sertifikat ISO 17025
                </button>
              </div>
            </div>
          )}

          {/* ═══ TAB 5: REPOSITORI SERTIFIKAT KALIBRASI ISO 17025 ═══ */}
          {activeTab === 'certificates' && (
            <div className="space-y-4">
              {/* Header & Subtitle */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📜</span>
                    <h3 className="font-bold text-sm text-white">Repositori Sertifikat Kalibrasi ISO 17025</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      KAN ACCREDITED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Dokumen resmi sertifikat kalibrasi terakreditasi KAN (Komite Akreditasi Nasional) & Traceable to SI BIPM.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono font-bold">
                    Total: <strong className="text-amber-400">{tools.length} Sertifikat</strong>
                  </span>
                </div>
              </div>

              {/* Certificate Repository Table */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">No. Sertifikat</th>
                        <th className="py-3 px-4">Alat Ukur Target</th>
                        <th className="py-3 px-4">Laboratorium Penguji (KAN)</th>
                        <th className="py-3 px-4">Ketidakpastian (U)</th>
                        <th className="py-3 px-4">Masa Berlaku</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {tools.map((t) => {
                        const status = getCalibrationStatus(t);
                        const isExpired = status.status === 'EXPIRED';

                        return (
                          <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-sky-400">
                              {t.cert}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{t.icon}</span>
                                <span>{t.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ID: <strong className="text-slate-300">{t.code}</strong> • SN: {t.serial_number || 'MT-2024-881'}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-300 text-[11px]">
                              <div className="font-medium">{t.calibratedBy}</div>
                              <div className="text-[10px] text-slate-500 font-mono">Metode: ISO/IEC 17025:2017</div>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                              ±{t.uncertainty} {t.uncertaintyUnit || 'mm'} ({t.confidenceLevel || 'k=2'})
                            </td>
                            <td className="py-3 px-4 text-[11px]">
                              <div className="text-slate-300">{t.lastCalibrated} s.d.</div>
                              <div className={`font-bold ${isExpired ? 'text-rose-400 font-mono' : 'text-slate-200 font-mono'}`}>
                                {t.calibrationDueDate}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 border"
                                style={{ backgroundColor: status.bg, borderColor: status.border, color: status.color }}
                              >
                                {status.icon} {status.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedCertTool(t);
                                  setShowCertModal(true);
                                }}
                                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg font-bold text-[11px] border border-blue-500/30 hover:border-blue-500 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                              >
                                <FileCheck size={13} />
                                <span>Lihat PDF</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ─── MODAL FOOTER ─── */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div>
            <span>Alat Aktif: <strong className="text-white">{currentTool.name}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* ─── SALINAN DIGITAL SERTIFIKAT KALIBRASI ISO 17025 (POPUP MODAL) ─── */}
      {showCertModal && selectedCertTool && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setShowCertModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '680px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Salinan Digital Sertifikat Kalibrasi ISO 17025</span>
              </h3>
              <button
                onClick={() => setShowCertModal(false)}
                style={{
                  padding: '6px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  color: '#64748b'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Certificate Paper Style */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{
                border: '3px double #0284c7',
                borderRadius: '8px',
                padding: '24px',
                backgroundColor: '#fafbfc',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {/* Certificate Letterhead */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0284c7', paddingBottom: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.7rem', letterSpacing: '2px', color: '#0284c7', fontWeight: 900 }}>
                    KOMITE AKREDITASI NASIONAL (KAN)
                  </div>
                  <h2 style={{ margin: '4px 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                    CERTIFICATE OF CALIBRATION
                  </h2>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.88rem', color: '#6366f1' }}>
                    No: {selectedCertTool.cert}
                  </div>
                </div>

                {/* 2-Column Specs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.8rem', marginBottom: '16px' }}>
                  <div style={{ lineHeight: 1.5 }}>
                    <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, marginBottom: '2px' }}>
                      IDENTITAS ALAT (INSTRUMENT)
                    </div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{selectedCertTool.name}</div>
                    <div style={{ color: '#334155' }}>Merk / Model: <strong>{selectedCertTool.manufacturer || 'Mitutoyo'} {selectedCertTool.model || 'CD-15APX'}</strong></div>
                    <div style={{ color: '#334155' }}>Serial Number: <strong>{selectedCertTool.serial_number || 'MT-2024-881'}</strong></div>
                    <div style={{ color: '#334155' }}>Kode ID Pabrik: <strong style={{ color: '#0284c7' }}>{selectedCertTool.code}</strong></div>
                  </div>
                  <div style={{ lineHeight: 1.5 }}>
                    <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, marginBottom: '2px' }}>
                      LABORATORIUM PENGUJI (ACCREDITED LAB)
                    </div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{selectedCertTool.calibratedBy || 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)'}</div>
                    <div style={{ color: '#334155' }}>Akreditasi: <strong>KAN LP-123-IDN</strong></div>
                    <div style={{ color: '#334155' }}>Metode Standar: <strong>ISO/IEC 17025:2017</strong></div>
                  </div>
                </div>

                {/* Calibration Results and Uncertainty Box */}
                <div style={{ backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#475569' }}>Tanggal Kalibrasi: <strong style={{ color: '#0f172a' }}>{selectedCertTool.lastCalibrated}</strong></span>
                    <span style={{ color: '#475569' }}>
                      Jatuh Tempo: <strong style={{ color: getCalibrationStatus(selectedCertTool).status === 'EXPIRED' ? '#dc2626' : '#059669' }}>{selectedCertTool.calibrationDueDate}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>
                      Ketidakpastian (U): <strong style={{ color: '#6366f1' }}>{selectedCertTool.uncertainty} {selectedCertTool.uncertaintyUnit || 'mm'} ({selectedCertTool.confidenceLevel || 'k=2'})</strong>
                    </span>
                    <span style={{ color: '#475569' }}>Tingkat Kepercayaan: <strong style={{ color: '#0f172a' }}>{selectedCertTool.confidenceLevel || '95% (k=2)'}</strong></span>
                  </div>
                </div>

                {/* Traceability & Accreditation Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '12px', borderTop: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.4 }}>
                    <div>✓ Traceable to SI Meter BIPM ({selectedCertTool.traceability || 'PTB Germany'})</div>
                    <div>Verified by Head of Metrology & Quality Assurance</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.74rem', fontWeight: 900, color: getCalibrationStatus(selectedCertTool).status === 'EXPIRED' ? '#dc2626' : '#059669', letterSpacing: '0.5px' }}>
                    {getCalibrationStatus(selectedCertTool).status === 'EXPIRED' ? '[ ⚠️ EXPIRED - RE-CALIBRATION REQUIRED ]' : '[ VERIFIED & ACCREDITED ]'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8fafc' }}>
              <button
                onClick={() => setShowCertModal(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: '#475569'
                }}
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '8px 18px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#0284c7',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Printer size={14} /> Cetak Sertifikat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
