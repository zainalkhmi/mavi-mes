import React, { useState, useEffect, useRef } from 'react';
import {
    FileText, Download, Printer, Plus, Save, Trash2, Copy,
    Sparkles, RefreshCw, Eye, Edit3, CheckCircle2, ChevronRight,
    Layers, QrCode, Barcode, Table, Image, PenTool, Type, HelpCircle,
    Upload, FileDown, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Designer } from '@pdfme/ui';
import { generate } from '@pdfme/generator';
import {
    text,
    image,
    barcodes,
    table,
    line,
    rectangle,
    ellipse,
    signature,
    dateTime,
    checkbox,
    svg,
    multiVariableText
} from '@pdfme/schemas';

// PDF Plugins Bundle
const PDF_PLUGINS = {
    text,
    image,
    qrcode: barcodes.qrcode,
    code128: barcodes.code128,
    table,
    line,
    rectangle,
    ellipse,
    signature,
    dateTime,
    checkbox,
    svg,
    multiVariableText
};

// A4 page definition for basePdf (required for table support)
const A4_BASE = { width: 210, height: 297, padding: [10, 10, 10, 10] };

// Standard table style objects matching pdfme internal format
const STD_HEAD_STYLES = {
    alignment: 'center',
    verticalAlignment: 'middle',
    fontSize: 9,
    lineHeight: 1,
    characterSpacing: 0,
    fontColor: '#ffffff',
    backgroundColor: '#0f172a',
    borderColor: '',
    borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 3, right: 3, bottom: 3, left: 3 }
};

const STD_BODY_STYLES = {
    alignment: 'center',
    verticalAlignment: 'middle',
    fontSize: 8,
    lineHeight: 1,
    characterSpacing: 0,
    fontColor: '#000000',
    backgroundColor: '',
    borderColor: '#888888',
    borderWidth: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 },
    padding: { top: 3, right: 3, bottom: 3, left: 3 },
    alternateBackgroundColor: '#f5f5f5'
};

const STD_TABLE_STYLES = { borderColor: '#000000', borderWidth: 0.3 };

// ── Built-in Manufacturing Report Templates ──
const DEFAULT_TEMPLATES = [
    {
        id: 'qc-checksheet',
        name: 'QC Inspection Checksheet',
        category: 'Quality Control',
        description: 'Standard shop floor QC dimension check report with part details, measurement table, QR code & signature.',
        template: {
            basePdf: A4_BASE,
            schemas: [
                [
                    // Header background
                    {
                        name: 'header_bg',
                        type: 'rectangle',
                        position: { x: 15, y: 12 },
                        width: 180,
                        height: 24,
                        color: '#0f172a',
                        borderWidth: 0
                    },
                    // Header Title
                    {
                        name: 'company_title',
                        type: 'text',
                        position: { x: 20, y: 16 },
                        width: 110,
                        height: 8,
                        fontSize: 16,
                        fontColor: '#ffffff',
                        content: 'MAVI MANUFACTURING — QC CHECKSHEET'
                    },
                    {
                        name: 'company_subtitle',
                        type: 'text',
                        position: { x: 20, y: 24 },
                        width: 110,
                        height: 6,
                        fontSize: 8,
                        fontColor: '#94a3b8',
                        content: 'Digital Quality Management & Dimensional Verification Report'
                    },
                    // QR Code top right
                    {
                        name: 'report_qr',
                        type: 'qrcode',
                        position: { x: 172, y: 14 },
                        width: 20,
                        height: 20
                    },
                    // Info section
                    {
                        name: 'info_border',
                        type: 'rectangle',
                        position: { x: 15, y: 40 },
                        width: 180,
                        height: 32,
                        borderColor: '#cbd5e1',
                        borderWidth: 0.5,
                        color: '#f8fafc'
                    },
                    {
                        name: 'wo_number',
                        type: 'text',
                        position: { x: 20, y: 44 },
                        width: 40,
                        height: 8,
                        fontSize: 10,
                        fontColor: '#0f172a'
                    },
                    {
                        name: 'part_name',
                        type: 'text',
                        position: { x: 65, y: 44 },
                        width: 50,
                        height: 8,
                        fontSize: 10,
                        fontColor: '#0f172a'
                    },
                    {
                        name: 'lot_no',
                        type: 'text',
                        position: { x: 120, y: 44 },
                        width: 40,
                        height: 8,
                        fontSize: 10,
                        fontColor: '#0f172a'
                    },
                    {
                        name: 'inspector_name',
                        type: 'text',
                        position: { x: 20, y: 57 },
                        width: 40,
                        height: 8,
                        fontSize: 10,
                        fontColor: '#0f172a'
                    },
                    {
                        name: 'inspection_date',
                        type: 'text',
                        position: { x: 65, y: 57 },
                        width: 50,
                        height: 8,
                        fontSize: 10,
                        fontColor: '#0f172a'
                    },
                    {
                        name: 'overall_status',
                        type: 'text',
                        position: { x: 120, y: 57 },
                        width: 40,
                        height: 8,
                        fontSize: 11,
                        fontColor: '#16a34a'
                    },
                    // Table Header Label
                    {
                        name: 'table_title',
                        type: 'text',
                        position: { x: 15, y: 77 },
                        width: 180,
                        height: 6,
                        fontSize: 10,
                        fontColor: '#0f172a',
                        content: 'DIMENSION & MEASUREMENT RESULTS'
                    },
                    // QC Measurement Table (pdfme v5 correct format)
                    {
                        name: 'qc_measurement_table',
                        type: 'table',
                        position: { x: 15, y: 85 },
                        width: 180,
                        height: 80,
                        showHead: true,
                        head: ['Item #', 'Parameter', 'Nominal', 'Tolerance', 'Actual', 'Status'],
                        headWidthPercentages: [10, 30, 15, 15, 15, 15],
                        tableStyles: STD_TABLE_STYLES,
                        headStyles: { ...STD_HEAD_STYLES },
                        bodyStyles: { ...STD_BODY_STYLES },
                        columnStyles: {}
                    },
                    // Notes
                    {
                        name: 'remarks',
                        type: 'text',
                        position: { x: 15, y: 196 },
                        width: 110,
                        height: 25,
                        fontSize: 9,
                        fontColor: '#0f172a'
                    },
                    // Signature
                    {
                        name: 'sign_box',
                        type: 'rectangle',
                        position: { x: 135, y: 190 },
                        width: 60,
                        height: 35,
                        borderColor: '#cbd5e1',
                        borderWidth: 0.5,
                        color: '#f8fafc'
                    },
                    {
                        name: 'sign_lbl',
                        type: 'text',
                        position: { x: 138, y: 193 },
                        width: 54,
                        height: 5,
                        fontSize: 8,
                        fontColor: '#64748b',
                        content: 'AUTHORIZED SIGNATURE'
                    },
                    {
                        name: 'sign_date',
                        type: 'text',
                        position: { x: 138, y: 220 },
                        width: 54,
                        height: 4,
                        fontSize: 7,
                        fontColor: '#94a3b8'
                    }
                ]
            ]
        },
        sampleInputs: [
            {
                report_qr: 'https://mavi-core.online/wo/WO-2026-0819',
                wo_number: 'WO: WO-2026-0819',
                part_name: 'Part: FLANGE HOUSING 45MM',
                lot_no: 'Lot: LOT-A-9902',
                inspector_name: 'Inspector: Budi Santoso',
                inspection_date: 'Date: 2026-08-18',
                overall_status: 'PASSED (100% OK)',
                remarks: 'All 5 critical dimensions within ±0.05mm tolerance. Surface finish clean.',
                sign_date: 'Approved 2026-08-18 16:45',
                qc_measurement_table: JSON.stringify([
                    ['1', 'Outer Diameter A', '45.00 mm', '± 0.05', '45.02 mm', 'PASS'],
                    ['2', 'Inner Bore Dia', '20.00 mm', '+0.03/-0.00', '20.01 mm', 'PASS'],
                    ['3', 'Total Height', '32.50 mm', '± 0.10', '32.48 mm', 'PASS'],
                    ['4', 'Bolt Hole PCD', '65.00 mm', '± 0.05', '65.00 mm', 'PASS'],
                    ['5', 'Perpendicularity', '0.02 mm', 'Max 0.03', '0.015 mm', 'PASS']
                ])
            }
        ]
    },
    {
        id: 'daily-oee-report',
        name: 'Daily Production & OEE Summary',
        category: 'Production',
        description: 'Executive shift summary with target vs actual quantity, availability, performance, quality breakdown.',
        template: {
            basePdf: A4_BASE,
            schemas: [
                [
                    {
                        name: 'header_banner',
                        type: 'rectangle',
                        position: { x: 15, y: 12 },
                        width: 180,
                        height: 22,
                        color: '#1e293b'
                    },
                    {
                        name: 'title',
                        type: 'text',
                        position: { x: 20, y: 16 },
                        width: 120,
                        height: 8,
                        fontSize: 15,
                        fontColor: '#ffffff',
                        content: 'DAILY PRODUCTION & OEE REPORT'
                    },
                    {
                        name: 'subtitle',
                        type: 'text',
                        position: { x: 20, y: 24 },
                        width: 120,
                        height: 5,
                        fontSize: 8,
                        fontColor: '#38bdf8',
                        content: 'MAVI MES — Shift Performance & Plant Health Index'
                    },
                    {
                        name: 'barcode_top',
                        type: 'code128',
                        position: { x: 145, y: 14 },
                        width: 45,
                        height: 14
                    },
                    // KPI Values as text
                    {
                        name: 'val_oee',
                        type: 'text',
                        position: { x: 20, y: 40 },
                        width: 40,
                        height: 10,
                        fontSize: 14,
                        fontColor: '#15803d'
                    },
                    {
                        name: 'val_availability',
                        type: 'text',
                        position: { x: 65, y: 40 },
                        width: 40,
                        height: 10,
                        fontSize: 14,
                        fontColor: '#1d4ed8'
                    },
                    {
                        name: 'val_performance',
                        type: 'text',
                        position: { x: 110, y: 40 },
                        width: 40,
                        height: 10,
                        fontSize: 14,
                        fontColor: '#7e22ce'
                    },
                    {
                        name: 'val_quality',
                        type: 'text',
                        position: { x: 155, y: 40 },
                        width: 40,
                        height: 10,
                        fontSize: 14,
                        fontColor: '#c2410c'
                    },
                    // Production Table
                    {
                        name: 'tbl_label',
                        type: 'text',
                        position: { x: 15, y: 56 },
                        width: 100,
                        height: 5,
                        fontSize: 9,
                        fontColor: '#0f172a',
                        content: 'WORK CENTER & MACHINE STATUS BREAKDOWN'
                    },
                    {
                        name: 'production_table',
                        type: 'table',
                        position: { x: 15, y: 64 },
                        width: 180,
                        height: 80,
                        showHead: true,
                        head: ['Machine Line', 'Target Qty', 'Actual', 'Good Parts', 'Scrap', 'Yield %', 'OEE %'],
                        headWidthPercentages: [22, 13, 13, 13, 10, 14, 15],
                        tableStyles: STD_TABLE_STYLES,
                        headStyles: { ...STD_HEAD_STYLES, backgroundColor: '#1e293b' },
                        bodyStyles: { ...STD_BODY_STYLES },
                        columnStyles: {}
                    }
                ]
            ]
        },
        sampleInputs: [
            {
                barcode_top: 'OEE-20260818-S1',
                val_oee: 'OEE: 87.4%',
                val_availability: 'Avail: 92.1%',
                val_performance: 'Perf: 96.5%',
                val_quality: 'Qual: 98.3%',
                production_table: JSON.stringify([
                    ['Line 01 - CNC', '1,200', '1,180', '1,165', '15', '98.7%', '89.2%'],
                    ['Line 02 - Stamping', '2,500', '2,490', '2,450', '40', '98.4%', '88.1%'],
                    ['Line 03 - Welding', '800', '785', '778', '7', '99.1%', '85.4%'],
                    ['Line 04 - Assembly', '1,000', '995', '990', '5', '99.5%', '86.9%']
                ])
            }
        ]
    }
];

export default function ReportDesigner() {
    const [templates, setTemplates] = useState(() => {
        const saved = localStorage.getItem('mavi_pdf_templates_v2');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) { /* ignore */ }
        }
        return DEFAULT_TEMPLATES;
    });

    const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATES[0].id);
    const [activeTab, setActiveTab] = useState('designer'); // 'designer' | 'preview'
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

    const currentTemplateObj = templates.find(t => t.id === selectedTemplateId) || templates[0];
    const [templateSchema, setTemplateSchema] = useState(currentTemplateObj.template);
    const [sampleInputData, setSampleInputData] = useState(currentTemplateObj.sampleInputs || [{}]);

    const designerRef = useRef(null);
    const designerInstance = useRef(null);

    // Save templates to localStorage on changes
    useEffect(() => {
        localStorage.setItem('mavi_pdf_templates_v2', JSON.stringify(templates));
    }, [templates]);

    // When switching template, update schema and sample data
    useEffect(() => {
        const t = templates.find(item => item.id === selectedTemplateId);
        if (t) {
            setTemplateSchema(t.template);
            setSampleInputData(t.sampleInputs || [{}]);
        }
    }, [selectedTemplateId]);

    // Initialize / Update pdfme Designer
    useEffect(() => {
        if (activeTab !== 'designer' || !designerRef.current) return;

        // Cleanup old instance
        if (designerInstance.current) {
            try { designerInstance.current.destroy(); } catch (e) { /* ignore */ }
            designerInstance.current = null;
        }

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            try {
                const designer = new Designer({
                    domContainer: designerRef.current,
                    template: templateSchema,
                    plugins: PDF_PLUGINS
                });

                designer.onChangeTemplate((updatedTemplate) => {
                    setTemplateSchema(updatedTemplate);
                    setTemplates(prev => prev.map(t => t.id === selectedTemplateId ? { ...t, template: updatedTemplate } : t));
                });

                designerInstance.current = designer;
            } catch (err) {
                console.error('Failed to initialize pdfme designer:', err);
                toast.error('Gagal memuat designer: ' + err.message);
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            if (designerInstance.current) {
                try { designerInstance.current.destroy(); } catch (e) { /* ignore */ }
                designerInstance.current = null;
            }
        };
    }, [activeTab, selectedTemplateId]);

    // Generate PDF Preview Blob
    const handleGeneratePdf = async (action = 'preview') => {
        setIsGeneratingPdf(true);
        try {
            const pdfUint8 = await generate({
                template: templateSchema,
                inputs: sampleInputData,
                plugins: PDF_PLUGINS
            });

            const blob = new Blob([pdfUint8.buffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            if (action === 'download') {
                const a = document.createElement('a');
                a.href = url;
                a.download = `${currentTemplateObj.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast.success('🎉 PDF Berhasil diunduh!');
            } else if (action === 'print') {
                const printWindow = window.open(url);
                if (printWindow) {
                    printWindow.onload = () => printWindow.print();
                }
            } else {
                setPdfPreviewUrl(url);
                setActiveTab('preview');
                toast.success('✨ Preview PDF siap!');
            }
        } catch (err) {
            console.error('PDF Generation Error:', err);
            toast.error('Gagal generate PDF: ' + err.message);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Add New Blank Template
    const handleCreateTemplate = () => {
        const name = prompt('Masukkan nama template laporan baru:', 'Custom Manufacturing Report');
        if (!name) return;

        const newId = 'tpl-' + Date.now();
        const newTemplate = {
            id: newId,
            name: name.trim(),
            category: 'Custom',
            description: 'Custom printable manufacturing report template.',
            template: {
                basePdf: A4_BASE,
                schemas: [
                    [
                        {
                            name: 'title',
                            type: 'text',
                            position: { x: 20, y: 20 },
                            width: 170,
                            height: 10,
                            fontSize: 16,
                            fontColor: '#0f172a',
                            content: name.toUpperCase()
                        }
                    ]
                ]
            },
            sampleInputs: [{}]
        };

        setTemplates(prev => [...prev, newTemplate]);
        setSelectedTemplateId(newId);
        toast.success(`Template "${name}" berhasil dibuat!`);
    };

    // Duplicate Template
    const handleDuplicateTemplate = () => {
        const newId = 'tpl-' + Date.now();
        const duplicated = {
            ...JSON.parse(JSON.stringify(currentTemplateObj)),
            id: newId,
            name: `${currentTemplateObj.name} (Copy)`
        };
        setTemplates(prev => [...prev, duplicated]);
        setSelectedTemplateId(newId);
        toast.success(`Template diduplikasi!`);
    };

    // Delete Template
    const handleDeleteTemplate = () => {
        if (templates.length <= 1) {
            toast.error('Minimal harus ada 1 template laporan di sistem.');
            return;
        }
        if (!confirm(`Hapus template "${currentTemplateObj.name}"?`)) return;

        const remaining = templates.filter(t => t.id !== selectedTemplateId);
        setTemplates(remaining);
        setSelectedTemplateId(remaining[0].id);
        toast.success('Template berhasil dihapus.');
    };

    // Export Template JSON
    const handleExportJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentTemplateObj, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = `${currentTemplateObj.name.toLowerCase().replace(/\s+/g, '_')}_template.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Template JSON berhasil diekspor!');
    };

    // Import Template JSON
    const handleImportJson = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (!parsed.template || !parsed.name) {
                    throw new Error('Format template JSON tidak valid');
                }
                const newId = 'tpl-' + Date.now();
                const imported = { ...parsed, id: newId };
                setTemplates(prev => [...prev, imported]);
                setSelectedTemplateId(newId);
                toast.success(`Template "${imported.name}" berhasil diimpor!`);
            } catch (err) {
                toast.error('Gagal mengimpor file: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col h-screen w-full bg-[#080f21] text-slate-100 font-sans overflow-hidden">
            {/* Top App Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-[#0d152a] border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <FileText size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-bold text-slate-100 tracking-wide">MAVI Report Designer</h1>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Powered by pdfme
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">Desain & Cetak Laporan QC, SPK, dan OEE Standar Industri Manufaktur</p>
                    </div>
                </div>

                {/* Center Tabs */}
                <div className="flex items-center bg-[#131d38] p-1 rounded-xl border border-slate-700/60">
                    <button
                        onClick={() => setActiveTab('designer')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === 'designer'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Edit3 size={14} /> Visual Designer
                    </button>
                    <button
                        onClick={() => handleGeneratePdf('preview')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === 'preview'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Eye size={14} /> Preview & Export PDF
                    </button>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => handleGeneratePdf('print')}
                        disabled={isGeneratingPdf}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                    >
                        <Printer size={14} /> Cetak Langsung
                    </button>
                    <button
                        onClick={() => handleGeneratePdf('download')}
                        disabled={isGeneratingPdf}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition"
                    >
                        <Download size={14} /> Download PDF
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Templates & MAVI Placeholders */}
                <div className="w-72 bg-[#0c1326] border-r border-slate-800 flex flex-col shrink-0">
                    <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Template Laporan</span>
                        <div className="flex items-center gap-1">
                            <label className="cursor-pointer p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded" title="Import JSON">
                                <Upload size={14} />
                                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                            </label>
                            <button
                                onClick={handleCreateTemplate}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition"
                            >
                                <Plus size={13} /> Baru
                            </button>
                        </div>
                    </div>

                    {/* Template List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {templates.map(tpl => {
                            const isSelected = tpl.id === selectedTemplateId;
                            return (
                                <div
                                    key={tpl.id}
                                    onClick={() => setSelectedTemplateId(tpl.id)}
                                    className={`p-3 rounded-xl cursor-pointer border transition-all ${
                                        isSelected
                                            ? 'bg-blue-600/10 border-blue-500/60 shadow-lg shadow-blue-950/40'
                                            : 'bg-[#121b33]/60 border-slate-800 hover:border-slate-700 hover:bg-[#121b33]'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                                            <FileText size={14} className={isSelected ? 'text-blue-400' : 'text-slate-400'} />
                                            {tpl.name}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                        {tpl.description}
                                    </p>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                            {tpl.category || 'Custom'}
                                        </span>
                                        {isSelected && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDuplicateTemplate(); }}
                                                    title="Duplikasi"
                                                    className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"
                                                >
                                                    <Copy size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleExportJson(); }}
                                                    title="Export JSON"
                                                    className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"
                                                >
                                                    <FileDown size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(); }}
                                                    title="Hapus"
                                                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* MAVI Dynamic Tag Helper */}
                    <div className="p-3 bg-[#0a0f1d] border-t border-slate-800">
                        <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                            <Sparkles size={13} className="text-amber-400" /> Tag Data Dinamis MAVI
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                            {['wo_number', 'part_name', 'lot_no', 'inspector_name', 'overall_status', 'qc_measurement_table', 'val_oee', 'val_quality'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        navigator.clipboard.writeText(tag);
                                        toast.success(`Disalin: ${tag}`);
                                    }}
                                    className="px-2 py-1 rounded bg-[#131d36] hover:bg-blue-600/30 hover:text-blue-300 text-slate-400 border border-slate-800 text-left font-mono truncate transition"
                                    title={`Klik untuk menyalin nama field: ${tag}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center Canvas Area */}
                <div className="flex-1 flex flex-col bg-[#0f172a] overflow-hidden relative">
                    {activeTab === 'designer' ? (
                        <div className="w-full h-full flex flex-col">
                            {/* Toolbar Banner */}
                            <div className="px-4 py-2 bg-[#131d36] border-b border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-100">{currentTemplateObj.name}</span>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-slate-400">Drag & drop komponen teks, barcode, tabel, foto ke atas kertas A4</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 size={13} /> Autosaved to Local
                                    </span>
                                </div>
                            </div>

                            {/* pdfme Designer Container */}
                            <div
                                ref={designerRef}
                                className="flex-1 w-full h-full overflow-auto"
                                style={{ minHeight: '500px', backgroundColor: '#e2e8f0' }}
                            />
                        </div>
                    ) : (
                        /* PDF Preview Tab */
                        <div className="w-full h-full flex flex-col">
                            <div className="px-4 py-2 bg-[#131d36] border-b border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                                <span className="font-semibold text-slate-100">Live Render Preview (A4 High Resolution)</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleGeneratePdf('preview')}
                                        disabled={isGeneratingPdf}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
                                    >
                                        <RefreshCw size={13} className={isGeneratingPdf ? 'animate-spin' : ''} /> Refresh Render
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 w-full h-full p-4 bg-[#0a0f1d] flex items-center justify-center">
                                {pdfPreviewUrl ? (
                                    <iframe
                                        src={pdfPreviewUrl}
                                        title="PDF Preview"
                                        className="w-full h-full max-w-4xl rounded-xl shadow-2xl border border-slate-700 bg-white"
                                    />
                                ) : (
                                    <div className="text-center text-slate-500">
                                        <FileText size={48} className="mx-auto mb-2 text-slate-600" />
                                        <p className="text-sm">Klik "Preview & Export PDF" atau "Refresh Render" untuk menghasilkan dokumen PDF</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
