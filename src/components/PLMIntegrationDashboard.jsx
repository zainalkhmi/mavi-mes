/**
 * PLMIntegrationDashboard.jsx
 * =====================================================
 * Hub Integrasi PLM: Drawing Management ↔ Inspector Designer ↔ Digital Check Sheet
 * Premium Dark Theme UI dengan FAI Reporting, Balloon Links, dan Inspeksi Real-Time
 * =====================================================
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, FileText, Package, Circle, Square, Triangle, Diamond,
  Plus, Trash2, Edit2, Link2, Unlink, ExternalLink, Download,
  RefreshCw, Search, Check, X, AlertTriangle, Clock, User,
  GitBranch, ClipboardCheck, FileCode, BarChart3, Eye, Settings,
  Award, ShieldCheck, CheckCircle2, XCircle, ArrowRight, Printer,
  Sparkles, Hash, FolderArchive, Ruler, Target, SlidersHorizontal,
  FileSpreadsheet, Play, ChevronRight
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import {
  linkBalloonToInspector,
  linkBalloonToChecksheet,
  getInspectionLinksByRevision,
  getInspectionHistory,
  generateInspectorFromBalloons,
  generateCheckSheetFromBalloons,
  getRevisionInspectionStats,
  generateFAIReport,
  generateInspectionSummary,
  saveInspectionResult
} from '../utils/plmIntegration';

import {
  getDrawings,
  getDrawing,
  getDrawingRevisions,
  getDrawingBalloons,
  createDrawingBalloon,
  deleteDrawingBalloon,
  getDrawingRelations,
  updateDrawingBalloon
} from '../utils/mavicorePLM';

export default function PLMIntegrationDashboard() {
  const navigate = useNavigate();

  // ─── State ───
  const [drawings, setDrawings] = useState([]);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [balloons, setBalloons] = useState([]);
  const [inspectionLinks, setInspectionLinks] = useState([]);
  const [stats, setStats] = useState({ total: 0, ok: 0, ng: 0, pending: 0, completionRate: 0 });
  const [activeTab, setActiveTab] = useState('overview'); // overview | balloons | inspector | reports
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [FAIReport, setFAIReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Quick Inspection Modal
  const [inspectingBalloon, setInspectingBalloon] = useState(null);
  const [quickResultValue, setQuickResultValue] = useState('');
  const [quickResultStatus, setQuickResultStatus] = useState('OK');
  const [quickResultNotes, setQuickResultNotes] = useState('');

  // ─── Load Initial Drawings ───
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDrawings();
      setDrawings(data || []);
      if (data && data.length > 0 && !selectedDrawing) {
        selectDrawing(data[0]);
      }
    } catch (err) {
      console.error('Error loading PLM drawings:', err);
    }
    setLoading(false);
  }, [selectedDrawing]);

  useEffect(() => {
    loadData();
  }, []);

  // ─── Select Drawing ───
  const selectDrawing = async (drawing) => {
    setSelectedDrawing(drawing);
    try {
      const revs = await getDrawingRevisions(drawing.id);
      setRevisions(revs || []);
      if (revs && revs.length > 0) {
        setSelectedRevision(revs[0]);
      } else {
        setSelectedRevision(null);
        setBalloons([]);
        setInspectionLinks([]);
        setStats({ total: 0, ok: 0, ng: 0, pending: 0, completionRate: 0 });
      }
    } catch (err) {
      console.error('Error selecting drawing:', err);
    }
  };

  // ─── Load Revision Data ───
  const loadRevisionData = useCallback(async () => {
    if (!selectedRevision) return;

    try {
      const [bals, links, statsData] = await Promise.all([
        getDrawingBalloons(selectedRevision.id),
        getInspectionLinksByRevision(selectedRevision.id),
        getRevisionInspectionStats(selectedRevision.id)
      ]);

      setBalloons(bals || []);
      setInspectionLinks(links || []);
      setStats(statsData || { total: 0, ok: 0, ng: 0, pending: 0, completionRate: 0 });
    } catch (err) {
      console.error('Error loading revision PLM details:', err);
    }
  }, [selectedRevision]);

  useEffect(() => {
    if (selectedRevision) {
      loadRevisionData();
    }
  }, [selectedRevision, loadRevisionData]);

  // ─── Filtered Drawings ───
  const filteredDrawings = useMemo(() => {
    return drawings.filter(d =>
      (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [drawings, searchTerm]);

  // ─── Generate Inspector Template ───
  const handleGenerateInspector = async () => {
    if (!selectedRevision || !selectedDrawing) {
      toast.error('Pilih drawing dan revision terlebih dahulu');
      return;
    }

    try {
      const result = await generateInspectorFromBalloons(selectedRevision.id, {
        name: selectedDrawing.name,
        code: selectedDrawing.code,
        currentRevision: selectedRevision.revision_code,
      });

      if (result.success) {
        localStorage.setItem('mandor_inspector_from_drawing', JSON.stringify(result.data));
        toast.success('Template Inspector berhasil dibuat dari Drawing Balloons!');
        navigate('/inspector-designer?fromDrawing=true');
      } else {
        toast.error('Gagal generate: ' + (result.error || ''));
      }
    } catch (err) {
      toast.error('Error generating inspector: ' + err.message);
    }
  };

  // ─── Generate Digital Check Sheet ───
  const handleGenerateChecksheet = async () => {
    if (!selectedRevision || !selectedDrawing) {
      toast.error('Pilih drawing dan revision terlebih dahulu');
      return;
    }

    try {
      const result = await generateCheckSheetFromBalloons(selectedRevision.id, {
        name: selectedDrawing.name,
        code: selectedDrawing.code,
      });

      if (result.success) {
        localStorage.setItem('mandor_plm_checksheet_from_drawing', JSON.stringify(result.data));
        toast.success('Digital Check Sheet berhasil dibuat dari Drawing Balloons!');
        navigate(`/drawing-checksheet?fromDrawing=true&code=${encodeURIComponent(selectedDrawing.code)}`);
      } else {
        toast.error('Gagal generate: ' + (result.error || ''));
      }
    } catch (err) {
      toast.error('Error generating checksheet: ' + err.message);
    }
  };

  // ─── Generate FAI Report ───
  const handleGenerateFAIReport = async () => {
    if (!selectedRevision) {
      toast.error('Pilih revision terlebih dahulu');
      return;
    }

    setGeneratingReport(true);
    try {
      const result = await generateFAIReport(selectedRevision.id, {
        inspectorName: 'Quality Lead / PLM Hub'
      });
      if (result.success) {
        setFAIReport(result.data);
        setShowReportModal(true);
        toast.success('First Article Inspection (FAI) Report siap!');
      } else {
        toast.error('Gagal membuat FAI Report: ' + (result.error || ''));
      }
    } catch (err) {
      toast.error('Error FAI: ' + err.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  // ─── Quick Inspect Save ───
  const handleSaveQuickInspection = async () => {
    if (!inspectingBalloon) return;

    try {
      const payload = {
        balloonId: inspectingBalloon.id,
        featureId: inspectingBalloon.target_feature_id || null,
        templateId: inspectingBalloon.linked_inspector_id || null,
        checksheetId: inspectingBalloon.linked_checksheet_id || null,
        resultValue: quickResultValue,
        status: quickResultStatus,
        notes: quickResultNotes,
        inspectedBy: 'QA Inspector',
      };

      const res = await saveInspectionResult(payload);
      if (res.success) {
        toast.success(`Hasil inspeksi Balloon #${inspectingBalloon.balloon_number} tersimpan!`);
        setInspectingBalloon(null);
        setQuickResultValue('');
        setQuickResultNotes('');
        loadRevisionData();
      } else {
        toast.error('Gagal menyimpan hasil: ' + (res.error || ''));
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <Toaster position="top-right" />

      {/* ═══ 1. TOP HEADER BAR ═══ */}
      <div className="bg-slate-950/90 backdrop-blur border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
            <Layers size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-tight">PLM INTEGRATION DASHBOARD</h1>
              <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={11} /> Drawing ↔ Inspector ↔ Check Sheet
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pusat orkestrasi integrasi blueprint CAD/Drawing ke formulir inspeksi, template Designer, dan pelaporan FAI otomatis.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/drawing-management')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3 py-2 rounded-lg transition-all cursor-pointer"
          >
            <FolderArchive size={14} className="text-blue-400" /> Drawing Master
          </button>
          <button
            onClick={handleGenerateInspector}
            disabled={!selectedRevision}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-lg shadow-blue-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileCode size={14} /> Generate Inspector
          </button>
          <button
            onClick={handleGenerateChecksheet}
            disabled={!selectedRevision}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ClipboardCheck size={14} /> Generate Check Sheet
          </button>
          <button
            onClick={handleGenerateFAIReport}
            disabled={!selectedRevision || generatingReport}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-lg shadow-purple-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {generatingReport ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />} FAI Report
          </button>
        </div>
      </div>

      {/* ═══ 2. CONTROL STATS METRICS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-6 py-4 shrink-0">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Total Titik Ukur</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{stats.total}</div>
            <div className="text-[10px] text-slate-500">Balloons di revisi ini</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Target size={18} />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Status OK (Pass)</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{stats.ok}</div>
            <div className="text-[10px] text-slate-500">Sesuai toleransi</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">Status NG (Defect)</div>
            <div className="text-xl font-extrabold text-red-400 mt-0.5">{stats.ng}</div>
            <div className="text-[10px] text-slate-500">Melebihi toleransi</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
            <XCircle size={18} />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Pending Inspeksi</div>
            <div className="text-xl font-extrabold text-amber-400 mt-0.5">{stats.pending}</div>
            <div className="text-[10px] text-slate-500">Belum diukur</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Tingkat Penyelesaian</div>
            <div className="text-xl font-extrabold text-purple-400 mt-0.5">{stats.completionRate || 0}%</div>
            <div className="text-[10px] text-slate-500">Progres QA</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <BarChart3 size={18} />
          </div>
        </div>
      </div>

      {/* ═══ 3. MAIN WORKSPACE (Sidebar + Content) ═══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR: Drawing & Revisions ── */}
        <div className="w-72 bg-slate-850 border-r border-slate-800 flex flex-col shrink-0" style={{ backgroundColor: 'rgb(17 24 39 / 0.5)' }}>
          {/* Search bar */}
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari drawing..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-xs">Memuat data...</span>
              </div>
            ) : filteredDrawings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <FileText size={32} className="text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">Tidak ada drawing</p>
                <button
                  onClick={() => navigate('/drawing-management')}
                  className="mt-3 text-[11px] font-bold text-purple-400 hover:text-purple-300"
                >
                  Buat di Drawing Master →
                </button>
              </div>
            ) : (
              filteredDrawings.map(drawing => {
                const isSelected = selectedDrawing?.id === drawing.id;
                return (
                  <button
                    key={drawing.id}
                    onClick={() => selectDrawing(drawing)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all group ${isSelected
                      ? 'bg-purple-600/15 border border-purple-500/40'
                      : 'hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'}`}>
                        <FileText size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{drawing.code}</div>
                        <div className="text-[11px] text-slate-400 truncate">{drawing.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {drawing.drawing_type || 'DETAIL'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={14} className={`text-slate-600 shrink-0 mt-1 transition-transform ${isSelected ? 'text-purple-400' : 'group-hover:text-slate-400'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-slate-800">
            <button
              onClick={loadData}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* ── RIGHT MAIN PANEL ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedDrawing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <Layers size={40} className="text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-300">Pilih Drawing untuk Membuka Dashboard</h3>
              <p className="text-xs text-slate-500 mt-1">Pilih gambar teknik dari daftar di sebelah kiri.</p>
            </div>
          ) : (
            <>
              {/* Revision Selector Bar */}
              <div className="bg-slate-800/60 border-b border-slate-800 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drawing Terpilih:</span>
                    <div className="text-sm font-black text-white flex items-center gap-2">
                      {selectedDrawing.code} - {selectedDrawing.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">Revisi:</span>
                  <select
                    value={selectedRevision?.id || ''}
                    onChange={(e) => {
                      const r = revisions.find(x => x.id === e.target.value);
                      setSelectedRevision(r || null);
                    }}
                    className="bg-slate-900 border border-slate-700 text-xs font-bold text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    {revisions.map(r => (
                      <option key={r.id} value={r.id}>
                        Rev {r.revision_code} ({r.status || 'DRAFT'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabs Bar */}
              <div className="flex items-center gap-1 px-6 py-2 border-b border-slate-800 bg-slate-850 shrink-0" style={{ backgroundColor: 'rgb(17 24 39 / 0.3)' }}>
                {[
                  { key: 'overview', label: 'Overview', icon: Layers },
                  { key: 'balloons', label: `Balloons (${balloons.length})`, icon: Circle },
                  { key: 'inspector', label: `Inspector Links (${inspectionLinks.length})`, icon: FileCode },
                  { key: 'reports', label: 'Reports & FAI', icon: BarChart3 },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.key
                      ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">

                {/* ── 1. OVERVIEW TAB ── */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-white mb-3">Informasi Drawing PLM</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">Kode Dokumen</div>
                          <div className="text-sm font-bold text-white mt-0.5">{selectedDrawing.code}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">Nama Part/Drawing</div>
                          <div className="text-sm font-bold text-white mt-0.5">{selectedDrawing.name}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">Tipe</div>
                          <div className="text-sm font-bold text-white mt-0.5">{selectedDrawing.drawing_type || 'DETAIL'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">Total Revisi</div>
                          <div className="text-sm font-bold text-white mt-0.5">{revisions.length} Versi</div>
                        </div>
                      </div>
                    </div>

                    {selectedRevision && (
                      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase">Revisi Aktif</div>
                            <div className="text-base font-black text-white mt-0.5">
                              Revision {selectedRevision.revision_code}
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${selectedRevision.status === 'RELEASED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
                            {selectedRevision.status || 'DRAFT'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{selectedRevision.description || 'Tidak ada catatan revisi.'}</p>
                      </div>
                    )}

                    {/* Quick actions row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1">
                            <FileCode size={16} /> Inspector Designer
                          </div>
                          <p className="text-[11px] text-slate-400">Bangun inspection template visual dari balloon drawing ini.</p>
                        </div>
                        <button
                          onClick={handleGenerateInspector}
                          className="mt-3 w-full py-1.5 bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 font-bold text-xs rounded-lg border border-blue-500/30 transition-all"
                        >
                          Buka di Inspector →
                        </button>
                      </div>

                      <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                            <ClipboardCheck size={16} /> Digital Check Sheet
                          </div>
                          <p className="text-[11px] text-slate-400">Isi hasil pengukuran di workstation shopfloor secara digital.</p>
                        </div>
                        <button
                          onClick={handleGenerateChecksheet}
                          className="mt-3 w-full py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs rounded-lg border border-emerald-500/30 transition-all"
                        >
                          Buka di Check Sheet →
                        </button>
                      </div>

                      <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs mb-1">
                            <Download size={16} /> FAI Certificate
                          </div>
                          <p className="text-[11px] text-slate-400">Generate dokumen First Article Inspection berstandar industri.</p>
                        </div>
                        <button
                          onClick={handleGenerateFAIReport}
                          className="mt-3 w-full py-1.5 bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 font-bold text-xs rounded-lg border border-purple-500/30 transition-all"
                        >
                          Lihat Laporan FAI →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 2. BALLOONS TAB ── */}
                {activeTab === 'balloons' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-white">Daftar Balloon Titik Ukur</h3>
                      <button
                        onClick={() => navigate('/drawing-management')}
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        <Plus size={13} /> Tambah di Drawing Master
                      </button>
                    </div>

                    {balloons.length === 0 ? (
                      <div className="border border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                        <Circle size={32} className="text-slate-600 mb-2" />
                        <p className="text-xs text-slate-400">Belum ada balloon pada revisi ini.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {balloons.map(balloon => (
                          <div key={balloon.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-all">
                            <div className="flex items-center gap-3 mb-2.5">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shadow"
                                style={{ backgroundColor: balloon.color || '#3B82F6' }}
                              >
                                {balloon.balloon_number}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-white">
                                  {balloon.target_feature?.feature_name || `Point #${balloon.balloon_number}`}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {balloon.target_feature?.nominal_value != null ? (
                                    <span className="font-mono text-cyan-300 font-semibold">
                                      {balloon.target_feature.nominal_value} ±{balloon.target_feature.upper_tolerance || '0'} {balloon.target_feature.unit || 'mm'}
                                    </span>
                                  ) : 'Tanpa spesifikasi GD&T'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-[11px]">
                              <span className="text-slate-400">Posisi: ({balloon.position_x}, {balloon.position_y})</span>
                              <button
                                onClick={() => {
                                  setInspectingBalloon(balloon);
                                  setQuickResultValue(balloon.target_feature?.nominal_value ? String(balloon.target_feature.nominal_value) : '');
                                  setQuickResultStatus('OK');
                                  setQuickResultNotes('');
                                }}
                                className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold rounded-lg border border-purple-500/30 transition-all"
                              >
                                Input Hasil
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 3. INSPECTOR LINKS TAB ── */}
                {activeTab === 'inspector' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white mb-2">Hubungan Titik Ukur & Template Inspeksi</h3>
                    {inspectionLinks.length === 0 ? (
                      <div className="border border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                        <FileCode size={32} className="text-slate-600 mb-2" />
                        <p className="text-xs text-slate-400 mb-3">Belum ada inspection links yang tersimpan.</p>
                        <button
                          onClick={handleGenerateInspector}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-xs rounded-lg shadow"
                        >
                          Generate Template Sekarang
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {inspectionLinks.map(link => (
                          <div key={link.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center">
                                #{link.balloon?.balloon_number}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white">{link.feature?.feature_name || `Point ${link.balloon?.balloon_number}`}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Spec: {link.feature?.nominal_value || '-'} {link.feature?.unit || 'mm'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {link.inspector_template_id && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                  <Link2 size={10} /> Inspector Linked
                                </span>
                              )}
                              {link.checksheet_id && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                  <Link2 size={10} /> Check Sheet Linked
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 4. REPORTS TAB ── */}
                {activeTab === 'reports' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white mb-2">Quality & FAI Reports</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 flex flex-col justify-between">
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3">
                            <Award size={20} />
                          </div>
                          <h4 className="text-sm font-bold text-white">First Article Inspection (FAI) Report</h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Laporan resmi bukti kesesuaian sampel produk awal terhadap seluruh dimensi drawing & GD&T.
                          </p>
                        </div>
                        <button
                          onClick={handleGenerateFAIReport}
                          disabled={!selectedRevision || generatingReport}
                          className="mt-4 w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
                        >
                          Generate Laporan FAI
                        </button>
                      </div>

                      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 flex flex-col justify-between">
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-3">
                            <FileSpreadsheet size={20} />
                          </div>
                          <h4 className="text-sm font-bold text-white">Ringkasan Statistik Inspeksi</h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Analisis agregat status Pass/Fail seluruh titik ukur pada setiap revisi drawing.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            toast.success('Statistik ditampilkan pada kartu metrik di atas!');
                          }}
                          className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-lg transition-all cursor-pointer"
                        >
                          Refresh Metrik
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* ── FAI Report Modal ── */}
      {showReportModal && FAIReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-slate-850 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden" style={{ backgroundColor: '#0f172a' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">First Article Inspection Report (FAI)</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{FAIReport.reportNumber}</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Info Header Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Drawing Code:</span>
                  <div className="font-bold text-white">{FAIReport.drawingInfo?.code}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Nama Part:</span>
                  <div className="font-bold text-white">{FAIReport.drawingInfo?.name}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Revisi:</span>
                  <div className="font-bold text-cyan-400">Rev {FAIReport.drawingInfo?.revision}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Status FAI:</span>
                  <div className={`font-bold ${FAIReport.summary?.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {FAIReport.summary?.status} ({FAIReport.summary?.passRate}%)
                  </div>
                </div>
              </div>

              {/* Table of Measured Points */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60">
                      <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-400 uppercase">Balloon #</th>
                      <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-400 uppercase">Parameter</th>
                      <th className="text-right px-3 py-2 text-[10px] font-bold text-slate-400 uppercase">Nominal</th>
                      <th className="text-right px-3 py-2 text-[10px] font-bold text-slate-400 uppercase">Toleransi</th>
                      <th className="text-right px-3 py-2 text-[10px] font-bold text-slate-400 uppercase">Aktual</th>
                      <th className="text-center px-3 py-2 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(FAIReport.items || []).map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                        <td className="px-3 py-2 font-bold text-blue-400">#{item.balloonNumber}</td>
                        <td className="px-3 py-2 text-white">{item.featureName}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-200">{item.nominalValue} {item.unit}</td>
                        <td className="px-3 py-2 text-right font-mono text-amber-300">{item.tolerance}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-white">{item.actualValue}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === 'OK' ? 'bg-emerald-500/20 text-emerald-400' : item.status === 'NG' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-900">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all"
              >
                <Printer size={14} /> Cetak / PDF
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Inspect Modal ── */}
      {inspectingBalloon && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setInspectingBalloon(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h3 className="text-sm font-bold text-white">Input Pengukuran Balloon #{inspectingBalloon.balloon_number}</h3>
              <button onClick={() => setInspectingBalloon(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Nilai Ukur Aktual</label>
                <input
                  type="text"
                  value={quickResultValue}
                  onChange={e => setQuickResultValue(e.target.value)}
                  placeholder="Contoh: 25.04"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Status Penilaian</label>
                <div className="grid grid-cols-3 gap-2">
                  {['OK', 'NG', 'SKIP'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setQuickResultStatus(st)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${quickResultStatus === st
                        ? st === 'OK' ? 'bg-emerald-600 text-white' : st === 'NG' ? 'bg-red-600 text-white' : 'bg-slate-700 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Catatan</label>
                <input
                  type="text"
                  value={quickResultNotes}
                  onChange={e => setQuickResultNotes(e.target.value)}
                  placeholder="Opsional (misal: mikrometer nomor 02)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-700 bg-slate-850">
              <button onClick={() => setInspectingBalloon(null)} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Batal</button>
              <button
                onClick={handleSaveQuickInspection}
                className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow"
              >
                Simpan Hasil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
