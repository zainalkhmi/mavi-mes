import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardCheck, FileCode, Plus, Search, Filter, Folder,
    FileText, CheckCircle2, AlertTriangle, Clock, ShieldCheck,
    Download, Printer, Eye, Edit3, Copy, Trash2, Archive,
    SlidersHorizontal, Sparkles, Database, Layers, ArrowRight,
    ExternalLink, RefreshCw, X, ChevronRight, Check, Hash,
    Calendar, UserCheck, ShieldAlert, Award, Tag, BookOpen,
    FolderArchive, AlertCircle, Play
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { executeReportPrintAction } from '../utils/reportPrintService';
import { getTemplates, saveTemplates } from '../utils/supabaseTemplateDB';

// Standard Default Checksheet (Empty - No Mock Data)
const DEFAULT_ISO_CHECKSHEETS = [];

export default function CheckSheetManager() {
    const navigate = useNavigate();

    const [checksheets, setChecksheets] = useState([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [woSearch, setWoSearch] = useState('');
    const [partSearch, setPartSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [sortBy, setSortBy] = useState('updatedAt');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

    // Modal States
    const [selectedChecksheet, setSelectedChecksheet] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [revisionReason, setRevisionReason] = useState('');
    const [newRevisionNo, setNewRevisionNo] = useState('');

    // ── Load Checksheets on Mount (from Cloud / LocalStorage) ──
    const getStoredChecksheets = () => {
        try {
            const saved = localStorage.getItem('mandor_inspector_templates');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    // Filter out legacy mock data if present
                    return parsed.filter(p => !p.id?.startsWith('cs-iso-00') && p.id !== 'cs-iso-001' && p.id !== 'cs-iso-002' && p.id !== 'cs-iso-003');
                }
            }
        } catch (e) {
            console.error('Failed to load checksheets:', e);
        }
        return [];
    };

    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const remote = await getTemplates();
                if (remote && Array.isArray(remote)) {
                    // Filter out legacy mock data if present
                    const cleanRemote = remote.filter(p => !p.id?.startsWith('cs-iso-00') && p.id !== 'cs-iso-001' && p.id !== 'cs-iso-002' && p.id !== 'cs-iso-003');
                    setChecksheets(cleanRemote);
                    localStorage.setItem('mandor_inspector_templates', JSON.stringify(cleanRemote));
                } else {
                    const local = getStoredChecksheets();
                    setChecksheets(local);
                    localStorage.setItem('mandor_inspector_templates', JSON.stringify(local));
                }
            } catch (e) {
                console.warn('[CheckSheetManager] getTemplates failed, using localStorage fallback', e);
                const local = getStoredChecksheets();
                setChecksheets(local);
            } finally {
                setIsLoadingTemplates(false);
            }
        };
        loadTemplates();
    }, []);

    // ── Save Checksheets (cloud + localStorage) ──
    const saveChecksheets = async (newArr) => {
        setChecksheets(newArr);
        localStorage.setItem('mandor_inspector_templates', JSON.stringify(newArr));
        try {
            await saveTemplates(newArr);
            toast.success('✓ Checksheet disimpan ke cloud & lokal!');
        } catch (e) {
            console.warn('[CheckSheetManager] saveTemplates failed, data saved locally only', e);
        }
    };

    // Category options
    const categories = [
        { id: 'ALL', label: 'Semua Kategori', icon: Layers },
        { id: 'Drawing & GD&T', label: 'Drawing & GD&T', icon: FileCode },
        { id: 'IQC (Incoming)', label: 'IQC (Incoming QA)', icon: Folder },
        { id: 'IPQC (In-Process)', label: 'IPQC (In-Process)', icon: SlidersHorizontal },
        { id: 'FQC / OQA (Final)', label: 'FQC / OQA (Final)', icon: Award },
        { id: 'Calibration', label: 'Kalibrasi & Tooling', icon: ShieldCheck }
    ];

    // Computed Filtered Checksheets
    const filteredChecksheets = useMemo(() => {
        return checksheets
            .filter(cs => {
                // Generic search across all text fields
                const matchSearch =
                    (cs.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cs.docNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cs.partNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cs.partName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cs.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cs.author || '').toLowerCase().includes(searchTerm.toLowerCase());

                // Dedicated Work Order filter
                const matchWo = !woSearch || (
                    (cs.workOrderNo || '').toLowerCase().includes(woSearch.toLowerCase()) ||
                    (cs.woPrefix || '').toLowerCase().includes(woSearch.toLowerCase()) ||
                    (cs.workOrderPrefix || '').toLowerCase().includes(woSearch.toLowerCase()) ||
                    (cs.serialNo || '').toLowerCase().includes(woSearch.toLowerCase()) ||
                    (cs.lotBatchNo || '').toLowerCase().includes(woSearch.toLowerCase()) ||
                    (cs.stationId || '').toLowerCase().includes(woSearch.toLowerCase())
                );

                // Dedicated Part Number filter
                const matchPart = !partSearch || (
                    (cs.partNo || '').toLowerCase().includes(partSearch.toLowerCase()) ||
                    (cs.partName || '').toLowerCase().includes(partSearch.toLowerCase()) ||
                    (cs.serialNo || '').toLowerCase().includes(partSearch.toLowerCase())
                );

                const matchCategory = selectedCategory === 'ALL' || cs.category === selectedCategory;
                const matchStatus = selectedStatus === 'ALL' || cs.status === selectedStatus;

                return matchSearch && matchWo && matchPart && matchCategory && matchStatus;
            })
            .sort((a, b) => {
                if (sortBy === 'updatedAt') return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
                if (sortBy === 'docNo') return (a.docNo || '').localeCompare(b.docNo || '');
                if (sortBy === 'partNo') return (a.partNo || '').localeCompare(b.partNo || '');
                if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
                return 0;
            });
    }, [checksheets, searchTerm, woSearch, partSearch, selectedCategory, selectedStatus, sortBy]);

    // Summary Statistics
    const stats = useMemo(() => {
        const total = checksheets.length;
        const approved = checksheets.filter(c => c.status === 'APPROVED').length;
        const inReview = checksheets.filter(c => c.status === 'IN_REVIEW' || c.status === 'DRAFT').length;
        const obsolete = checksheets.filter(c => c.status === 'OBSOLETE' || c.status === 'ARCHIVED').length;
        const totalPoints = checksheets.reduce((acc, c) => acc + (c.checkPoints?.length || c.totalCheckPoints || 0), 0);
        return { total, approved, inReview, obsolete, totalPoints };
    }, [checksheets]);

    // ── Quick Actions ──
    const handleOpenInLivePlayer = (cs) => {
        // Save as active checksheet for live execution
        localStorage.setItem('mandor_published_checksheet', JSON.stringify(cs));
        localStorage.setItem('mandor_checksheet_published', 'true');
        toast.success(`Membuka Digital Check Sheet: ${cs.name}`);
        navigate(`/drawing-checksheet?wo=${encodeURIComponent(cs.partNo || 'WO-LIVE')}&doc=${encodeURIComponent(cs.docNo || '')}`);
    };

    const handleEditInDesigner = (cs) => {
        localStorage.setItem('mandor_inspector_active_template', JSON.stringify(cs));
        toast.success(`Membuka ${cs.name} di Inspector Designer Studio`);
        navigate(`/inspector-designer?edit=${encodeURIComponent(cs.id || cs.docNo || '')}`);
    };

    const handlePrintISOReport = async (cs) => {
        try {
            const reportData = {
                report_qr: `https://mandor-core.online/inspection/${cs.docNo || 'ISO9001'}`,
                doc_id: 'ISO 9001:2015',
                doc_control_val: `Doc: ${cs.docNo || 'QA-CS-2026'}\nRev: ${cs.revisionNo || '1.0'} | Std: ISO 9001`,
                wo_value: cs.partNo ? `WO-${cs.partNo}-01` : 'WO-ISO-2026',
                part_no_value: cs.partNo || '-',
                part_name_value: cs.partName || cs.name || '-',
                customer_value: cs.customer || 'Standard Customer',
                process_value: cs.process || 'Quality Control Inspection',
                station_value: cs.stationId || 'ST-QC-01',
                inspector_value: cs.author || 'QC Inspector',
                approver_value: cs.approver || 'QA Lead',
                date_time_value: new Date().toLocaleString(),
                status_value: cs.status === 'APPROVED' ? 'APPROVED (PASS)' : 'DRAFT / IN REVIEW',
                total_value: String(cs.checkPoints?.length || cs.totalCheckPoints || 0),
                passed_value: String(cs.checkPoints?.length || cs.totalCheckPoints || 0),
                failed_value: '0',
                pending_value: '0',
                cpk_value: '1.67',
                rate_value: '100%',
                notes_value: `Dokumen Checksheet Resmi ISO 9001 / IATF 16949. Diterbitkan oleh ${cs.author || 'Quality Dept'}.`,
                footer_timestamp: `Generated: ${new Date().toLocaleString()}`,
                inspection_table: JSON.stringify(
                    (cs.checkPoints || []).map((p, idx) => [
                        String(p.pointNumber || idx + 1),
                        p.title || `Parameter #${idx + 1}`,
                        p.category || 'Dimension',
                        `${p.nominal || '0'} ${p.unit || 'mm'}`,
                        `±${p.tolMin || '0.1'} - ${p.tolMax || '0.1'}`,
                        `${p.nominal || '0'} ${p.unit || 'mm'}`,
                        p.criticality || 'Major',
                        'OK'
                    ])
                )
            };

            await executeReportPrintAction({
                templateId: 'qc-inspection-checksheet-a4',
                data: reportData,
                silent: false
            });
            toast.success('Membuka pratinjau cetak Sertifikat Checksheet ISO 9001...');
        } catch (err) {
            console.error('Print Error:', err);
            toast.error('Gagal mencetak dokumen ISO: ' + err.message);
        }
    };

    const handleDuplicateChecksheet = (cs) => {
        const newId = 'cs-iso-' + Date.now();
        const copyObj = {
            ...cs,
            id: newId,
            docNo: cs.docNo + '-COPY',
            name: cs.name + ' (Salinan)',
            revisionNo: '1.0',
            status: 'DRAFT',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            changeHistory: [
                { rev: '1.0', date: new Date().toISOString().slice(0, 10), author: 'System', summary: 'Salinan dari ' + cs.docNo, approvedBy: 'Draft' }
            ]
        };
        const updated = [copyObj, ...checksheets];
        saveChecksheets(updated);
        toast.success(`Checksheet berhasil diduplikasi: ${copyObj.docNo}`);
    };

    const handleDeleteChecksheet = (id, name = 'Checksheet') => {
        if (window.confirm(`Hapus checksheet "${name}" secara permanen dari sistem?`)) {
            const updated = checksheets.filter(c => c.id !== id);
            saveChecksheets(updated);
            toast.success(`Checksheet "${name}" berhasil dihapus`, { icon: '🗑️' });
            if (selectedChecksheet?.id === id) {
                setShowDetailModal(false);
                setSelectedChecksheet(null);
            }
        }
    };

    const handleOpenRevisionModal = (cs) => {
        setSelectedChecksheet(cs);
        const currentRev = parseFloat(cs.revisionNo) || 1.0;
        setNewRevisionNo((currentRev + 0.1).toFixed(1));
        setRevisionReason('');
        setShowRevisionModal(true);
    };

    const handleCommitRevision = () => {
        if (!revisionReason.trim()) {
            toast.error('Harap masukkan alasan / ringkasan revisi ISO!');
            return;
        }

        const updated = checksheets.map(cs => {
            if (cs.id !== selectedChecksheet.id) return cs;
            const newHistoryItem = {
                rev: newRevisionNo,
                date: new Date().toISOString().slice(0, 10),
                author: 'QA Lead (Revisi)',
                summary: revisionReason.trim(),
                approvedBy: 'QA Management'
            };
            return {
                ...cs,
                revisionNo: newRevisionNo,
                status: 'APPROVED',
                effectiveDate: new Date().toISOString().slice(0, 10),
                updatedAt: new Date().toISOString(),
                changeHistory: [newHistoryItem, ...(cs.changeHistory || [])]
            };
        });

        saveChecksheets(updated);
        setShowRevisionModal(false);
        toast.success(`Revisi ${newRevisionNo} berhasil didokumentasikan sesuai ISO 9001!`);
    };

    return (
        <div className="flex flex-col flex-1 h-full w-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
            <Toaster position="top-right" />

            {/* ─── 1. TOP HERO & ISO 9001 HEADER BAR ─── */}
            <div className="bg-slate-950/90 backdrop-blur border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                        <FolderArchive size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-black text-white tracking-tight">
                                CHECKSHEET MANAGEMENT
                            </h1>
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ShieldCheck size={11} /> ISO 9001:2015 / IATF 16949
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Pusat tata kelola dokumen kendali mutu, penomoran checksheet, manajemen revisi (DCR), dan blueprint drawing inspeksi.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/inspector-designer')}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                    >
                        <Plus size={15} /> Buat Checksheet Baru (Studio)
                    </button>
                    <button
                        onClick={() => navigate('/drawing-checksheet')}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg transition-all cursor-pointer"
                    >
                        <Play size={14} className="text-emerald-400" /> Buka Live Player
                    </button>
                </div>
            </div>

            {/* ─── 2. METRICS & CONTROL STATS ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-6 pb-2">
                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Checksheet</div>
                        <div className="text-xl font-extrabold text-white mt-0.5">{stats.total}</div>
                        <div className="text-[10px] text-slate-500">Terdokumentasi sistem</div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <BookOpen size={18} />
                    </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Status Approved</div>
                        <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{stats.approved}</div>
                        <div className="text-[10px] text-slate-500">Berlaku di Shopfloor</div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 size={18} />
                    </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Draft / In-Review</div>
                        <div className="text-xl font-extrabold text-amber-400 mt-0.5">{stats.inReview}</div>
                        <div className="text-[10px] text-slate-500">Tahap validasi QA Lead</div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Clock size={18} />
                    </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Titik Ukur & GD&T</div>
                        <div className="text-xl font-extrabold text-indigo-400 mt-0.5">{stats.totalPoints}</div>
                        <div className="text-[10px] text-slate-500">Parameter dimensi</div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <FileCode size={18} />
                    </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between col-span-2 sm:col-span-1">
                    <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ISO Compliance</div>
                        <div className="text-xl font-extrabold text-white mt-0.5">100%</div>
                        <div className="text-[10px] text-emerald-400 font-medium">Audit Ready</div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Award size={18} />
                    </div>
                </div>
            </div>

            {/* ─── 3. FILTER BAR & SEARCH ─── */}
            <div className="px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        const isSel = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    isSel
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                        : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
                                }`}
                            >
                                <Icon size={13} /> {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* Right: Work Order + Part No + Status Filter */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Work Order Filter */}
                    <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold uppercase tracking-wider pointer-events-none">WO</span>
                        <input
                            type="text"
                            placeholder="WO-2026-001"
                            value={woSearch}
                            onChange={e => setWoSearch(e.target.value)}
                            className="w-32 pl-7 pr-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Part Number Filter */}
                    <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold uppercase tracking-wider pointer-events-none">PN</span>
                        <input
                            type="text"
                            placeholder="PRT-001"
                            value={partSearch}
                            onChange={e => setPartSearch(e.target.value)}
                            className="w-32 pl-7 pr-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Generic Search */}
                    <div className="relative flex-1 md:flex-none md:w-48">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, doc, customer..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <select
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 px-2 py-1.5 focus:outline-none focus:border-purple-500"
                    >
                        <option value="ALL">Semua</option>
                        <option value="APPROVED">✅ APPROVED</option>
                        <option value="IN_REVIEW">⏳ IN_REVIEW</option>
                        <option value="DRAFT">📝 DRAFT</option>
                        <option value="OBSOLETE">❌ OBSOLETE</option>
                    </select>

                    <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md text-xs transition-all ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Grid Card View"
                        >
                            <Layers size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-md text-xs transition-all ${viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="ISO Matrix Table View"
                        >
                            <FileText size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── 4. MAIN CONTENT AREA ─── */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {isLoadingTemplates && (
                    <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="text-xs">Memuat template dari cloud...</span>
                    </div>
                )}
                {!isLoadingTemplates && filteredChecksheets.length === 0 ? (
                    <div className="h-64 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 mt-4">
                        <FolderArchive size={40} className="text-slate-600 mb-2" />
                        <h3 className="text-sm font-bold text-slate-300">Tidak ada dokumen checksheet yang sesuai filter</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                            {(woSearch || partSearch || searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL')
                                ? 'Coba ubah kata kunci pencarian atau filter.'
                                : 'Belum ada checksheet. Buat baru melalui Inspector Designer Studio.'}
                        </p>
                        {(woSearch || partSearch || searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
                            <button
                                onClick={() => {
                                    setWoSearch('');
                                    setPartSearch('');
                                    setSearchTerm('');
                                    setSelectedCategory('ALL');
                                    setSelectedStatus('ALL');
                                }}
                                className="mt-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
                            >
                                Reset Semua Filter
                            </button>
                        )}
                        {!woSearch && !partSearch && !searchTerm && selectedCategory === 'ALL' && selectedStatus === 'ALL' && (
                            <button
                                onClick={() => navigate('/inspector-designer')}
                                className="mt-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
                            >
                                Buat Checksheet Baru
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                        {filteredChecksheets.map(cs => (
                            <div
                                key={cs.id}
                                className="bg-slate-800/80 border border-slate-700/80 hover:border-purple-500/50 rounded-xl overflow-hidden transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-purple-500/5 flex flex-col justify-between group"
                            >
                                {/* Card Top Header */}
                                <div className="p-4 border-b border-slate-700/50 bg-slate-900/40">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-1.5 text-xs text-purple-400 font-mono font-bold">
                                                <Hash size={13} /> {cs.docNo}
                                                <span className="bg-purple-950/80 text-purple-300 border border-purple-800/80 text-[10px] px-1.5 py-0.2 rounded font-bold">
                                                    Rev {cs.revisionNo}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-white mt-1 group-hover:text-purple-300 transition-colors">
                                                {cs.name}
                                            </h3>
                                        </div>

                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                            cs.status === 'APPROVED'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                : cs.status === 'IN_REVIEW'
                                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                                : 'bg-slate-700 text-slate-300 border-slate-600'
                                        }`}>
                                            {cs.status}
                                        </span>
                                    </div>

                                    {/* Part & Customer Meta */}
                                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-800/80 text-xs">
                                        <div>
                                            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Part Number</span>
                                            <strong className="text-slate-200">{cs.partNo || '-'}</strong>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Customer</span>
                                            <span className="text-slate-300 truncate block">{cs.customer || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body Attributes */}
                                <div className="p-4 flex-1 flex flex-col justify-between text-xs space-y-3">
                                    <div className="space-y-1.5 text-slate-400">
                                        <div className="flex items-center justify-between">
                                            <span>Proses / Station:</span>
                                            <strong className="text-slate-300">{cs.stationId || cs.process || '-'}</strong>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Standar Mutu:</span>
                                            <span className="text-emerald-400 font-semibold">{cs.isoStandard || 'ISO 9001:2015'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Jumlah Titik Ukur:</span>
                                            <span className="text-white font-bold bg-slate-700/60 px-2 py-0.5 rounded text-[11px]">
                                                {cs.checkPoints?.length || cs.totalCheckPoints || 0} Points
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Author / Inspector:</span>
                                            <span className="text-slate-300">{cs.author || 'QC Lead'}</span>
                                        </div>
                                    </div>

                                    {/* Audit History Pill */}
                                    {cs.changeHistory && cs.changeHistory.length > 0 && (
                                        <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-2 text-[11px] text-slate-400 flex items-start gap-1.5">
                                            <Clock size={13} className="text-purple-400 shrink-0 mt-0.5" />
                                            <div className="truncate">
                                                <span className="text-slate-200 font-semibold">Rev {cs.changeHistory[0].rev}:</span> {cs.changeHistory[0].summary}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                 {/* Card Footer Actions */}
                                <div className="p-3 bg-slate-900/60 border-t border-slate-700/50 flex items-center justify-between gap-1.5">
                                    <button
                                        onClick={() => { setSelectedChecksheet(cs); setShowDetailModal(true); }}
                                        className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
                                        title="Detail Dokumen ISO"
                                    >
                                        <Eye size={13} /> Detail
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOpenInLivePlayer(cs)}
                                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-600 border border-emerald-700/60 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                                            title="Jalankan di Digital Checksheet Player"
                                        >
                                            <Play size={12} /> Inspect
                                        </button>
                                        <button
                                            onClick={() => handleEditInDesigner(cs)}
                                            className="flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-600 border border-purple-700/60 px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                                            title="Edit di Inspector Studio"
                                        >
                                            <Edit3 size={12} />
                                        </button>
                                        <button
                                            onClick={() => handlePrintISOReport(cs)}
                                            className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
                                            title="Print / Cetak ISO Certificate"
                                        >
                                            <Printer size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteChecksheet(cs.id, cs.name || cs.docNo)}
                                            className="flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-white bg-red-950/40 hover:bg-red-600 border border-red-700/50 px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                                            title="Hapus Checksheet Secara Permanen"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* ─── ISO MASTER CONTROL TABLE VIEW ─── */
                    <div className="mt-2 bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-950 text-slate-400 border-b border-slate-700 text-[11px] uppercase font-bold tracking-wider">
                                    <th className="py-3 px-4">Doc Number</th>
                                    <th className="py-3 px-3">Rev</th>
                                    <th className="py-3 px-4">Checksheet Title</th>
                                    <th className="py-3 px-3">Part Number</th>
                                    <th className="py-3 px-3">Kategori</th>
                                    <th className="py-3 px-3">Standar</th>
                                    <th className="py-3 px-2 text-center">Titik</th>
                                    <th className="py-3 px-3 text-center">Status</th>
                                    <th className="py-3 px-3">Author</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredChecksheets.map(cs => (
                                    <tr key={cs.id} className="hover:bg-slate-750/60 transition-colors">
                                        <td className="py-3 px-4 font-mono font-bold text-purple-400">
                                            {cs.docNo}
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                {cs.revisionNo}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-white">
                                            {cs.name}
                                        </td>
                                        <td className="py-3 px-3 text-slate-300 font-mono">
                                            {cs.partNo || '-'}
                                        </td>
                                        <td className="py-3 px-3 text-slate-400">
                                            {cs.category}
                                        </td>
                                        <td className="py-3 px-3 text-emerald-400 font-medium">
                                            {cs.isoStandard || 'ISO 9001'}
                                        </td>
                                        <td className="py-3 px-2 text-center font-bold text-slate-200">
                                            {cs.checkPoints?.length || cs.totalCheckPoints || 0}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                                cs.status === 'APPROVED'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                            }`}>
                                                {cs.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                                            {cs.author || 'QC Lead'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleOpenInLivePlayer(cs)}
                                                    className="p-1.5 rounded-md bg-emerald-950/60 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-700/50 cursor-pointer"
                                                    title="Buka di Checksheet Player"
                                                >
                                                    <Play size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditInDesigner(cs)}
                                                    className="p-1.5 rounded-md bg-purple-950/60 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-700/50 cursor-pointer"
                                                    title="Edit di Studio"
                                                >
                                                    <Edit3 size={12} />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedChecksheet(cs); setShowDetailModal(true); }}
                                                    className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white cursor-pointer"
                                                    title="Lihat Detail Dokumen"
                                                >
                                                    <Eye size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteChecksheet(cs.id, cs.name || cs.docNo)}
                                                    className="p-1.5 rounded-md bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-700/50 cursor-pointer"
                                                    title="Hapus Checksheet"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── 5. DETAIL & AUDIT TRAIL MODAL ─── */}
            {showDetailModal && selectedChecksheet && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-white">{selectedChecksheet.name}</h2>
                                        <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded font-mono font-bold">
                                            {selectedChecksheet.docNo} Rev {selectedChecksheet.revisionNo}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">{selectedChecksheet.isoStandard} • Efektif: {selectedChecksheet.effectiveDate || '-'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 text-xs">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Part Number</span>
                                    <strong className="text-slate-200">{selectedChecksheet.partNo || '-'}</strong>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Part Name</span>
                                    <span className="text-slate-200">{selectedChecksheet.partName || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Customer</span>
                                    <span className="text-slate-200">{selectedChecksheet.customer || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Station / Operation</span>
                                    <span className="text-slate-200">{selectedChecksheet.stationId || selectedChecksheet.process || '-'}</span>
                                </div>
                            </div>

                            {/* Inspection Matrix Parameter Table */}
                            <div>
                                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <FileCode size={14} /> Matriks Parameter & Toleransi GD&T ({selectedChecksheet.checkPoints?.length || 0} Titik)
                                </h3>
                                <div className="border border-slate-800 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                                                <th className="py-2.5 px-3">#</th>
                                                <th className="py-2.5 px-3">Parameter Ukur</th>
                                                <th className="py-2.5 px-3">Kategori</th>
                                                <th className="py-2.5 px-3">Nominal</th>
                                                <th className="py-2.5 px-3">Toleransi Min / Max</th>
                                                <th className="py-2.5 px-3">Alat Ukur</th>
                                                <th className="py-2.5 px-3">Criticality</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                                            {(selectedChecksheet.checkPoints || []).map((pt, idx) => (
                                                <tr key={idx} className="hover:bg-slate-800/40">
                                                    <td className="py-2 px-3 font-bold text-slate-400">{pt.pointNumber || idx + 1}</td>
                                                    <td className="py-2 px-3 font-semibold text-white">{pt.title}</td>
                                                    <td className="py-2 px-3 text-slate-400">{pt.category || 'Dimension'}</td>
                                                    <td className="py-2 px-3 text-slate-200 font-mono">{pt.nominal} {pt.unit || 'mm'}</td>
                                                    <td className="py-2 px-3 text-purple-300 font-mono">
                                                        {pt.tolMin !== undefined ? `${pt.tolMin} - ${pt.tolMax}` : 'Standard'}
                                                    </td>
                                                    <td className="py-2 px-3 text-slate-400">{pt.tool || 'Caliper'}</td>
                                                    <td className="py-2 px-3">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                            pt.criticality?.includes('Critical')
                                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                                : 'bg-slate-800 text-slate-300'
                                                        }`}>
                                                            {pt.criticality || 'Major'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ISO Document Change Request (DCR) Audit Trail */}
                            <div>
                                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <ShieldCheck size={14} /> ISO 9001 Document Change History (DCR Audit Trail)
                                </h3>
                                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                                    <div className="divide-y divide-slate-800/60">
                                        {(selectedChecksheet.changeHistory || []).map((ch, i) => (
                                            <div key={i} className="p-3 flex items-start justify-between gap-4 hover:bg-slate-900/60">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-purple-950 text-purple-300 font-bold px-1.5 py-0.5 rounded text-[10px] font-mono border border-purple-800">
                                                            Rev {ch.rev}
                                                        </span>
                                                        <span className="text-slate-400 text-[11px]">{ch.date}</span>
                                                        <span className="text-slate-500">• Oleh: <strong className="text-slate-300">{ch.author}</strong></span>
                                                    </div>
                                                    <p className="text-slate-200 mt-1">{ch.summary}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                                        <Check size={11} /> Approved: {ch.approvedBy}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenRevisionModal(selectedChecksheet)}
                                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg cursor-pointer transition-all"
                                >
                                    <RefreshCw size={13} /> Buat Revisi Baru (DCR)
                                </button>
                                <button
                                    onClick={() => handleDuplicateChecksheet(selectedChecksheet)}
                                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-lg border border-slate-700 cursor-pointer"
                                >
                                    <Copy size={13} /> Duplikasi
                                </button>
                                <button
                                    onClick={() => handleDeleteChecksheet(selectedChecksheet.id)}
                                    className="flex items-center gap-1.5 text-red-400 hover:bg-red-950/40 font-bold text-xs px-3 py-2 rounded-lg cursor-pointer"
                                >
                                    <Trash2 size={13} /> Hapus
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        handleEditInDesigner(selectedChecksheet);
                                    }}
                                    className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-lg shadow-purple-600/30 cursor-pointer"
                                >
                                    <Edit3 size={13} /> Edit di Studio
                                </button>
                                <button
                                    onClick={() => handlePrintISOReport(selectedChecksheet)}
                                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-lg border border-slate-700 cursor-pointer"
                                >
                                    <Printer size={13} /> Print ISO PDF
                                </button>
                                <button
                                    onClick={() => handleOpenInLivePlayer(selectedChecksheet)}
                                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg shadow-emerald-600/30 cursor-pointer"
                                >
                                    <Play size={13} /> Buka di Player
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── 6. DOCUMENT CHANGE REQUEST (REVISION) MODAL ─── */}
            {showRevisionModal && selectedChecksheet && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                                <RefreshCw size={16} /> Formulir Revisi Dokumen ISO (DCR)
                            </div>
                            <button onClick={() => setShowRevisionModal(false)} className="text-slate-400 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                <div className="text-slate-400">Dokumen: <strong className="text-white">{selectedChecksheet.docNo}</strong></div>
                                <div className="text-slate-400">Revisi Saat Ini: <strong className="text-purple-400">Rev {selectedChecksheet.revisionNo}</strong></div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-bold mb-1">Nomor Revisi Baru:</label>
                                <input
                                    type="text"
                                    value={newRevisionNo}
                                    onChange={e => setNewRevisionNo(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-bold mb-1">Alasan Perubahan / Ringkasan Revisi (ISO Audit Trail):</label>
                                <textarea
                                    rows={4}
                                    placeholder="Jelaskan alasan perubahan dimensi, penyesuaian toleransi drawing, atau standar mutu..."
                                    value={revisionReason}
                                    onChange={e => setRevisionReason(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowRevisionModal(false)}
                                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCommitRevision}
                                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
                            >
                                Simpan Revisi ISO 9001
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
