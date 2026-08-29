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

  // Pagination
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  // Debounce ref
  const searchTimeoutRef = React.useRef(null);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [FAIReport, setFAIReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Quick Inspection Modal
  const [inspectingBalloon, setInspectingBalloon] = useState(null);
  const [quickResultValue, setQuickResultValue] = useState('');
  const [quickResultStatus, setQuickResultStatus] = useState('OK');
  const [quickResultNotes, setQuickResultNotes] = useState('');

  // ─── Load Initial Drawings (with pagination & debounced search) ───
  const loadData = useCallback(async (search = '', pageNum = 0) => {
    setLoading(true);
    try {
      const result = await getDrawings({ page: pageNum, pageSize: PAGE_SIZE, search });
      // Handle both paginated {items, total} and legacy array response
      const items = Array.isArray(result) ? result : (result.items || []);
      const totalCount = Array.isArray(result) ? result.length : (result.total || 0);

      setDrawings(items || []);
      setTotal(totalCount);
      setPage(pageNum);

      if (items && items.length > 0 && !selectedDrawing) {
        selectDrawing(items[0]);
      } else if (items && items.length > 0 && selectedDrawing) {
        // Try to keep selection if still in list
        const stillExists = items.find(d => d.id === selectedDrawing.id);
        if (!stillExists) {
          selectDrawing(items[0]);
        }
      }
    } catch (err) {
      console.error('Error loading PLM drawings:', err);
    }
    setLoading(false);
  }, [selectedDrawing]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadData(searchTerm, 0);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm]);

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
    <div className="flex flex-col flex-1 h-full w-full bg-[#f8f9fa] text-gray-900 overflow-hidden font-sans">
      <Toaster position="top-right" />

      {/* ═══ 1. ODOO CONTROL PANEL / TOP HEADER BAR ═══ */}
      <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 z-20 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#714B67] flex items-center justify-center text-white shadow-sm">
            <Layers size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">PLM /</span>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">Integration Dashboard</h1>
              <span className="bg-[#714B67]/10 text-[#714B67] border border-[#714B67]/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={11} /> Drawing ↔ Inspector ↔ Check Sheet
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Pusat orkestrasi integrasi blueprint CAD/Drawing ke formulir inspeksi, template Designer, dan pelaporan FAI otomatis.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/drawing-management')}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold text-xs px-3.5 py-2 rounded-md shadow-xs transition-all cursor-pointer"
          >
            <FolderArchive size={14} className="text-[#00A09D]" /> Drawing Master
          </button>
          <button
            onClick={handleGenerateInspector}
            disabled={!selectedRevision}
            className="flex items-center gap-1.5 bg-[#00A09D] hover:bg-[#008784] text-white font-semibold text-xs px-3.5 py-2 rounded-md shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileCode size={14} /> Generate Inspector
          </button>
          <button
            onClick={handleGenerateChecksheet}
            disabled={!selectedRevision}
            className="flex items-center gap-1.5 bg-[#714B67] hover:bg-[#5C3D54] text-white font-semibold text-xs px-3.5 py-2 rounded-md shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ClipboardCheck size={14} /> Generate Check Sheet
          </button>
          <button
            onClick={handleGenerateFAIReport}
            disabled={!selectedRevision || generatingReport}
            className="flex items-center gap-1.5 bg-white hover:bg-[#714B67]/10 text-[#714B67] border border-[#714B67] font-semibold text-xs px-3.5 py-2 rounded-md shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {generatingReport ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />} FAI Report
          </button>
        </div>
      </div>

      {/* ═══ 2. ODOO SMART STAT BOXES (o_stat_info) ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-6 py-3.5 shrink-0 bg-[#f8f9fa]">
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center justify-between shadow-xs hover:border-gray-300 transition-all">
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Titik Ukur</div>
            <div className="text-2xl font-black text-gray-900 mt-0.5">{stats.total}</div>
            <div className="text-[10px] text-gray-400">Balloons di revisi ini</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#00A09D]/10 text-[#00A09D] flex items-center justify-center">
            <Target size={20} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center justify-between shadow-xs hover:border-gray-300 transition-all">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Status OK (Pass)</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{stats.ok}</div>
            <div className="text-[10px] text-gray-400">Sesuai toleransi</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center justify-between shadow-xs hover:border-gray-300 transition-all">
          <div>
            <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Status NG (Defect)</div>
            <div className="text-2xl font-black text-rose-600 mt-0.5">{stats.ng}</div>
            <div className="text-[10px] text-gray-400">Melebihi toleransi</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle size={20} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center justify-between shadow-xs hover:border-gray-300 transition-all">
          <div>
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Inspeksi</div>
            <div className="text-2xl font-black text-amber-600 mt-0.5">{stats.pending}</div>
            <div className="text-[10px] text-gray-400">Belum diukur</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center justify-between shadow-xs hover:border-gray-300 transition-all col-span-2 sm:col-span-1">
          <div>
            <div className="text-[11px] font-bold text-[#714B67] uppercase tracking-wider">Penyelesaian QA</div>
            <div className="text-2xl font-black text-[#714B67] mt-0.5">{stats.completionRate || 0}%</div>
            <div className="text-[10px] text-gray-400">Progres pengukuran</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#714B67]/10 text-[#714B67] flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
        </div>
      </div>

      {/* ═══ 3. MAIN WORKSPACE (Sidebar + Content) ═══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR: Drawing & Revisions ── */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
          {/* Search bar */}
          <div className="p-3 border-b border-gray-200 bg-[#f8f9fa]">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari drawing..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                <RefreshCw size={14} className="animate-spin text-[#714B67]" />
                <span className="text-xs">Memuat data...</span>
              </div>
            ) : filteredDrawings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <FileText size={32} className="text-gray-300 mb-2" />
                <p className="text-xs text-gray-500 font-medium">Tidak ada drawing</p>
                <button
                  onClick={() => navigate('/drawing-management')}
                  className="mt-3 text-[11px] font-bold text-[#714B67] hover:underline"
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
                    className={`w-full text-left p-2.5 rounded-md transition-all group ${isSelected
                      ? 'bg-[#714B67]/10 border-l-4 border-[#714B67] text-[#714B67]'
                      : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-[#714B67] text-white shadow-xs' : 'bg-gray-100 text-gray-500'}`}>
                        <FileText size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-[#714B67]' : 'text-gray-900'}`}>{drawing.code}</div>
                        <div className="text-[11px] text-gray-500 truncate">{drawing.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                            {drawing.drawing_type || 'DETAIL'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={14} className={`shrink-0 mt-1 transition-transform ${isSelected ? 'text-[#714B67]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-gray-200 bg-[#f8f9fa]">
            <button
              onClick={loadData}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-200/60 transition-all"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* ── RIGHT MAIN PANEL ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#f8f9fa]">
          {!selectedDrawing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4 text-[#714B67]">
                <Layers size={32} />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Pilih Drawing untuk Membuka Dashboard</h3>
              <p className="text-xs text-gray-500 mt-1">Pilih gambar teknik dari daftar di sebelah kiri.</p>
            </div>
          ) : (
            <>
              {/* Odoo Statusbar / Revision Selector Bar */}
              <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Drawing Terpilih:</span>
                    <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-[#714B67] font-extrabold">{selectedDrawing.code}</span>
                      <span className="text-gray-400">—</span>
                      <span>{selectedDrawing.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-600">Revisi Aktif:</span>
                  <select
                    value={selectedRevision?.id || ''}
                    onChange={(e) => {
                      const r = revisions.find(x => x.id === e.target.value);
                      setSelectedRevision(r || null);
                    }}
                    className="bg-white border border-gray-300 text-xs font-bold text-gray-800 px-3 py-1.5 rounded-md focus:outline-none focus:border-[#714B67] shadow-2xs"
                  >
                    {revisions.map(r => (
                      <option key={r.id} value={r.id}>
                        Rev {r.revision_code} ({r.status || 'DRAFT'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Odoo Notebook Tabs Bar */}
              <div className="flex items-center gap-2 px-6 border-b border-gray-200 bg-white shrink-0">
                {[
                  { key: 'overview', label: 'Overview', icon: Layers },
                  { key: 'balloons', label: `Balloons (${balloons.length})`, icon: Circle },
                  { key: 'inspector', label: `Inspector Links (${inspectionLinks.length})`, icon: FileCode },
                  { key: 'reports', label: 'Reports & FAI', icon: BarChart3 },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === tab.key
                      ? 'border-[#714B67] text-[#714B67]'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">

                {/* ── 1. OVERVIEW TAB ── */}
                {activeTab === 'overview' && (
                  <div className="space-y-4 max-w-6xl">
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Informasi Drawing PLM</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase">Kode Dokumen</div>
                          <div className="text-sm font-bold text-gray-900 mt-0.5">{selectedDrawing.code}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase">Nama Part/Drawing</div>
                          <div className="text-sm font-bold text-gray-900 mt-0.5">{selectedDrawing.name}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase">Tipe</div>
                          <div className="text-sm font-bold text-[#00A09D] mt-0.5">{selectedDrawing.drawing_type || 'DETAIL'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase">Total Revisi</div>
                          <div className="text-sm font-bold text-gray-900 mt-0.5">{revisions.length} Versi</div>
                        </div>
                      </div>
                    </div>

                    {selectedRevision && (
                      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">Detail Revisi</div>
                            <div className="text-base font-bold text-gray-900 mt-0.5">
                              Revision {selectedRevision.revision_code}
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${selectedRevision.status === 'RELEASED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {selectedRevision.status || 'DRAFT'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{selectedRevision.description || 'Tidak ada catatan revisi.'}</p>
                      </div>
                    )}

                    {/* Quick actions row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all">
                        <div>
                          <div className="flex items-center gap-2 text-[#00A09D] font-bold text-xs mb-1.5">
                            <FileCode size={16} /> Inspector Designer
                          </div>
                          <p className="text-xs text-gray-500">Bangun inspection template visual dari balloon drawing ini.</p>
                        </div>
                        <button
                          onClick={handleGenerateInspector}
                          className="mt-4 w-full py-2 bg-teal-50 hover:bg-teal-100 text-[#00A09D] border border-teal-200 font-bold text-xs rounded-md transition-all cursor-pointer"
                        >
                          Buka di Inspector →
                        </button>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all">
                        <div>
                          <div className="flex items-center gap-2 text-[#714B67] font-bold text-xs mb-1.5">
                            <ClipboardCheck size={16} /> Digital Check Sheet
                          </div>
                          <p className="text-xs text-gray-500">Isi hasil pengukuran di workstation shopfloor secara digital.</p>
                        </div>
                        <button
                          onClick={handleGenerateChecksheet}
                          className="mt-4 w-full py-2 bg-purple-50 hover:bg-purple-100 text-[#714B67] border border-purple-200 font-bold text-xs rounded-md transition-all cursor-pointer"
                        >
                          Buka di Check Sheet →
                        </button>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all">
                        <div>
                          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs mb-1.5">
                            <Download size={16} /> FAI Certificate
                          </div>
                          <p className="text-xs text-gray-500">Generate dokumen First Article Inspection berstandar industri.</p>
                        </div>
                        <button
                          onClick={handleGenerateFAIReport}
                          className="mt-4 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-md transition-all cursor-pointer"
                        >
                          Lihat Laporan FAI →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 2. BALLOONS TAB ── */}
                {activeTab === 'balloons' && (
                  <div className="space-y-4 max-w-6xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900">Daftar Balloon Titik Ukur</h3>
                      <button
                        onClick={() => navigate('/drawing-management')}
                        className="text-xs font-bold text-[#714B67] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} /> Tambah di Drawing Master
                      </button>
                    </div>

                    {balloons.length === 0 ? (
                      <div className="border border-dashed border-gray-300 bg-white rounded-lg p-10 flex flex-col items-center justify-center text-center">
                        <Circle size={32} className="text-gray-300 mb-2" />
                        <p className="text-xs text-gray-500 font-medium">Belum ada balloon pada revisi ini.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {balloons.map(balloon => (
                          <div key={balloon.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs hover:border-[#714B67]/40 transition-all">
                            <div className="flex items-center gap-3 mb-2.5">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shadow-xs"
                                style={{ backgroundColor: balloon.color || '#714B67' }}
                              >
                                {balloon.balloon_number}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-gray-900">
                                  {balloon.target_feature?.feature_name || `Point #${balloon.balloon_number}`}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                  {balloon.target_feature?.nominal_value != null ? (
                                    <span className="font-mono text-[#00A09D] font-bold">
                                      {balloon.target_feature.nominal_value} ±{balloon.target_feature.upper_tolerance || '0'} {balloon.target_feature.unit || 'mm'}
                                    </span>
                                  ) : 'Tanpa spesifikasi GD&T'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 text-[11px]">
                              <span className="text-gray-400">Posisi: ({balloon.position_x}, {balloon.position_y})</span>
                              <button
                                onClick={() => {
                                  setInspectingBalloon(balloon);
                                  setQuickResultValue(balloon.target_feature?.nominal_value ? String(balloon.target_feature.nominal_value) : '');
                                  setQuickResultStatus('OK');
                                  setQuickResultNotes('');
                                }}
                                className="px-2.5 py-1 bg-[#714B67]/10 hover:bg-[#714B67]/20 text-[#714B67] font-bold rounded border border-[#714B67]/20 transition-all cursor-pointer"
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
                  <div className="space-y-4 max-w-6xl">
                    <h3 className="text-sm font-bold text-gray-900">Hubungan Titik Ukur & Template Inspeksi</h3>
                    {inspectionLinks.length === 0 ? (
                      <div className="border border-dashed border-gray-300 bg-white rounded-lg p-10 flex flex-col items-center justify-center text-center">
                        <FileCode size={32} className="text-gray-300 mb-2" />
                        <p className="text-xs text-gray-500 font-medium mb-3">Belum ada inspection links yang tersimpan.</p>
                        <button
                          onClick={handleGenerateInspector}
                          className="px-4 py-2 bg-[#00A09D] hover:bg-[#008784] text-white font-bold text-xs rounded-md shadow-xs cursor-pointer"
                        >
                          Generate Template Sekarang
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
                        {inspectionLinks.map(link => (
                          <div key={link.id} className="border-b border-gray-100 last:border-0 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#714B67]/10 text-[#714B67] font-bold text-xs flex items-center justify-center">
                                #{link.balloon?.balloon_number}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-gray-900">{link.feature?.feature_name || `Point ${link.balloon?.balloon_number}`}</div>
                                <div className="text-[10px] text-gray-500 font-mono">
                                  Spec: {link.feature?.nominal_value || '-'} {link.feature?.unit || 'mm'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {link.inspector_template_id && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                  <Link2 size={10} /> Inspector Linked
                                </span>
                              )}
                              {link.checksheet_id && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
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
                  <div className="space-y-4 max-w-6xl">
                    <h3 className="text-sm font-bold text-gray-900">Quality & FAI Reports</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-xs">
                        <div>
                          <div className="w-10 h-10 rounded-lg bg-[#714B67]/10 text-[#714B67] flex items-center justify-center mb-3">
                            <Award size={22} />
                          </div>
                          <h4 className="text-sm font-bold text-gray-900">First Article Inspection (FAI) Report</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Laporan resmi bukti kesesuaian sampel produk awal terhadap seluruh dimensi drawing & GD&T.
                          </p>
                        </div>
                        <button
                          onClick={handleGenerateFAIReport}
                          disabled={!selectedRevision || generatingReport}
                          className="mt-4 w-full py-2 bg-[#714B67] hover:bg-[#5C3D54] text-white font-bold text-xs rounded-md shadow-xs transition-all cursor-pointer"
                        >
                          Generate Laporan FAI
                        </button>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-xs">
                        <div>
                          <div className="w-10 h-10 rounded-lg bg-[#00A09D]/10 text-[#00A09D] flex items-center justify-center mb-3">
                            <FileSpreadsheet size={22} />
                          </div>
                          <h4 className="text-sm font-bold text-gray-900">Ringkasan Statistik Inspeksi</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Analisis agregat status Pass/Fail seluruh titik ukur pada setiap revisi drawing.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            toast.success('Statistik ditampilkan pada kartu metrik di atas!');
                          }}
                          className="mt-4 w-full py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold text-xs rounded-md shadow-2xs transition-all cursor-pointer"
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

      {/* ═══ MODALS (ODOO STYLE DIALOGS) ═══ */}

      {/* ── FAI Report Modal ── */}
      {showReportModal && FAIReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-gray-900" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#f8f9fa] shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">First Article Inspection Report (FAI)</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{FAIReport.reportNumber}</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Info Header Box */}
              <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 font-semibold">Drawing Code:</span>
                  <div className="font-bold text-gray-900">{FAIReport.drawingInfo?.code}</div>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold">Nama Part:</span>
                  <div className="font-bold text-gray-900">{FAIReport.drawingInfo?.name}</div>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold">Revisi:</span>
                  <div className="font-bold text-[#00A09D]">Rev {FAIReport.drawingInfo?.revision}</div>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold">Status FAI:</span>
                  <div className={`font-bold ${FAIReport.summary?.status === 'ACCEPTED' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {FAIReport.summary?.status} ({FAIReport.summary?.passRate}%)
                  </div>
                </div>
              </div>

              {/* Table of Measured Points (Odoo Tree/List) */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-[#f8f9fa]">
                      <th className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Balloon #</th>
                      <th className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Parameter</th>
                      <th className="text-right px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Nominal</th>
                      <th className="text-right px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Toleransi</th>
                      <th className="text-right px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Aktual</th>
                      <th className="text-center px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(FAIReport.items || []).map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-2 font-bold text-[#714B67]">#{item.balloonNumber}</td>
                        <td className="px-3 py-2 text-gray-900 font-medium">{item.featureName}</td>
                        <td className="px-3 py-2 text-right font-mono text-gray-700">{item.nominalValue} {item.unit}</td>
                        <td className="px-3 py-2 text-right font-mono text-amber-700">{item.tolerance}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">{item.actualValue}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'OK' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : item.status === 'NG' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-gray-100 text-gray-600'}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-gray-200 shrink-0 bg-[#f8f9fa]">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold rounded-md shadow-2xs transition-all cursor-pointer"
              >
                <Printer size={14} /> Cetak / PDF
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-[#714B67] hover:bg-[#5C3D54] text-white text-xs font-semibold rounded-md shadow-xs transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Inspect Modal ── */}
      {inspectingBalloon && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4" onClick={() => setInspectingBalloon(null)}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-gray-900" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#f8f9fa]">
              <h3 className="text-sm font-bold text-gray-900">Input Pengukuran Balloon #{inspectingBalloon.balloon_number}</h3>
              <button onClick={() => setInspectingBalloon(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Nilai Ukur Aktual</label>
                <input
                  type="text"
                  value={quickResultValue}
                  onChange={e => setQuickResultValue(e.target.value)}
                  placeholder="Contoh: 25.04"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Status Penilaian</label>
                <div className="grid grid-cols-3 gap-2">
                  {['OK', 'NG', 'SKIP'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setQuickResultStatus(st)}
                      className={`py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${quickResultStatus === st
                        ? st === 'OK' ? 'bg-emerald-600 text-white shadow-xs' : st === 'NG' ? 'bg-rose-600 text-white shadow-xs' : 'bg-gray-700 text-white shadow-xs'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Catatan</label>
                <input
                  type="text"
                  value={quickResultNotes}
                  onChange={e => setQuickResultNotes(e.target.value)}
                  placeholder="Opsional (misal: mikrometer nomor 02)"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-gray-200 bg-[#f8f9fa]">
              <button onClick={() => setInspectingBalloon(null)} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer">Batal</button>
              <button
                onClick={handleSaveQuickInspection}
                className="px-5 py-2 text-xs font-bold bg-[#714B67] hover:bg-[#5C3D54] text-white rounded-md shadow-xs cursor-pointer"
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
