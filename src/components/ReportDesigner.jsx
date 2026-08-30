import React, { useState, useEffect, useRef } from 'react';
import {
    FileText, Download, Printer, Plus, Save, Trash2, Copy,
    Sparkles, RefreshCw, Eye, Edit3, CheckCircle2, ChevronRight,
    Layers, QrCode, Barcode, Table, Image, PenTool, Type, HelpCircle,
    Upload, FileDown, ArrowLeft, Sliders, Settings2, X, Maximize2,
    Check, Tag, ShoppingBag, Truck, Shirt, Mail, Box, LayoutGrid,
    Database, Filter, Play, PlayCircle, CheckSquare, Search, FileSpreadsheet,
    ArrowRight, ChevronLeft, ListFilter, Cpu, HardDrive, ClipboardList
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

// MANDOR Database Utilities
import { getTables, getTableRecords } from '../utils/supabaseTablesDB';
import { getSupabaseClient } from '../utils/supabaseManualDB';

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

// ── Standard Table Styles for pdfme v5 ──
const STD_HEAD_STYLES = {
    alignment: 'center',
    verticalAlignment: 'middle',
    fontSize: 9,
    lineHeight: 1,
    characterSpacing: 0,
    fontColor: '#ffffff',
    backgroundColor: '#714B67',
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
    alternateBackgroundColor: '#fdfbfd'
};

const STD_TABLE_STYLES = { borderColor: '#714B67', borderWidth: 0.3 };

// ── Standard & Thermal Paper / Label Presets ──
export const PAPER_PRESETS = [
    // 1. Dokumen Standar
    { category: 'Dokumen Standar', id: 'A4', name: 'A4 (210 × 297 mm)', width: 210, height: 297, padding: [10, 10, 10, 10], icon: FileText, desc: 'Standar Kantor, Laporan QC, SPK, dan Dokumen Resmi' },
    { category: 'Dokumen Standar', id: 'A5', name: 'A5 (148 × 210 mm)', width: 148, height: 210, padding: [8, 8, 8, 8], icon: FileText, desc: 'Setengah A4, Surat Jalan Ringkas, Invoice Kompak' },
    { category: 'Dokumen Standar', id: 'A3', name: 'A3 (297 × 420 mm)', width: 297, height: 420, padding: [12, 12, 12, 12], icon: FileText, desc: 'Format Besar, Diagram Mesin / CAD Blueprint' },
    { category: 'Dokumen Standar', id: 'Letter', name: 'US Letter (215.9 × 279.4 mm)', width: 215.9, height: 279.4, padding: [10, 10, 10, 10], icon: FileText, desc: 'Standar Dokumen Internasional (US)' },
    { category: 'Dokumen Standar', id: 'Legal', name: 'US Legal (215.9 × 355.6 mm)', width: 215.9, height: 355.6, padding: [10, 10, 10, 10], icon: FileText, desc: 'Dokumen Panjang / Kontrak' },

    // 2. Label Pengiriman & Logistik (Thermal Resi)
    { category: 'Pengiriman & Logistik', id: 'SH-100x150', name: '100 × 150 mm (4 × 6 inci)', width: 100, height: 150, padding: [4, 4, 4, 4], icon: Truck, desc: 'Standar Resi Kurir / Marketplace (Tokopedia, Shopee, TikTok, J&T, JNE)' },
    { category: 'Pengiriman & Logistik', id: 'SH-100x100', name: '100 × 100 mm (Resi Ringkas)', width: 100, height: 100, padding: [4, 4, 4, 4], icon: Truck, desc: 'Resi Pengiriman Ringkas / Label Kargo Sedang' },
    { category: 'Pengiriman & Logistik', id: 'SH-75x100', name: '75 × 100 mm (Label Paket)', width: 75, height: 100, padding: [3, 3, 3, 3], icon: Box, desc: 'Label Paket Kecil / Cargo Box Tag' },

    // 3. Label Produk & Retail (Barcode & Price Tag)
    { category: 'Produk & Retail', id: 'RT-50x30', name: '50 × 30 mm (Price Tag Minimarket)', width: 50, height: 30, padding: [2, 2, 2, 2], icon: Tag, desc: 'Barcode Harga Barang Toko / Minimarket Standar' },
    { category: 'Produk & Retail', id: 'RT-50x20', name: '50 × 20 mm (Barcode Retail Ringkas)', width: 50, height: 20, padding: [2, 2, 2, 2], icon: Barcode, desc: 'Barcode Harga Barang Retail Ringkas' },
    { category: 'Produk & Retail', id: 'RT-40x30', name: '40 × 30 mm (Kemasan Mungil)', width: 40, height: 30, padding: [2, 2, 2, 2], icon: Tag, desc: 'Label Harga / Barcode Kemasan Mungil' },
    { category: 'Produk & Retail', id: 'RT-30x20', name: '30 × 20 mm (Micro Price Tag)', width: 30, height: 20, padding: [2, 2, 2, 2], icon: Tag, desc: 'Label Barcode Mini / Aksesoris / Perhiasan' },
    { category: 'Produk & Retail', id: 'RT-50x50', name: '50 × 50 mm (Stiker Logo Brand)', width: 50, height: 50, padding: [3, 3, 3, 3], icon: ShoppingBag, desc: 'Stiker Brand Produk / Pouch / Botol' },

    // 4. Label Baju & Garment (Care Label / Size Woven)
    { category: 'Baju & Garment', id: 'GM-12x40', name: '12 × 40 mm (Label Ukuran Lipat)', width: 12, height: 40, padding: [1, 1, 1, 1], icon: Shirt, desc: 'Label Ukuran Baju (S, M, L, XL) Lipat Dua' },
    { category: 'Baju & Garment', id: 'GM-15x50', name: '15 × 50 mm (Size Label Standar)', width: 15, height: 50, padding: [1.5, 1.5, 1.5, 1.5], icon: Shirt, desc: 'Label Ukuran & Kode Produksi Garment' },
    { category: 'Baju & Garment', id: 'GM-25x70', name: '25 × 70 mm (Care Label Ringkas)', width: 25, height: 70, padding: [2, 2, 2, 2], icon: Shirt, desc: 'Label Merek & Petunjuk Cuci' },
    { category: 'Baju & Garment', id: 'GM-30x80', name: '30 × 80 mm (Care Label Lengkap)', width: 30, height: 80, padding: [2, 2, 2, 2], icon: Shirt, desc: 'Label Merek / Care Label Leher atau Pinggang' },

    // 5. Label Undangan (Stiker Tom & Jerry / Fox)
    { category: 'Label Undangan / Stiker', id: 'TJ-103', name: 'Tom & Jerry No. 103 (64 × 32 mm)', width: 64, height: 32, padding: [2, 2, 2, 2], icon: Mail, desc: 'Stiker Nama Tamu Undangan Pernikahan / Acara' },
    { category: 'Label Undangan / Stiker', id: 'TJ-121', name: 'Tom & Jerry No. 121 (75 × 38 mm)', width: 75, height: 38, padding: [2, 2, 2, 2], icon: Mail, desc: 'Stiker Tamu Undangan + Alamat Lengkap' },

    // 6. Custom Ukuran
    { category: 'Custom', id: 'CUSTOM', name: 'Custom Ukuran (mm)', width: 100, height: 100, padding: [5, 5, 5, 5], icon: Settings2, desc: 'Bebas tentukan lebar & tinggi kertas sesuai printer Anda' }
];

const getPresetById = (id) => PAPER_PRESETS.find(p => p.id === id) || PAPER_PRESETS[0];

// ── Built-in Default Templates ──
const DEFAULT_TEMPLATES = [
    {
        id: 'ncr-report-a4',
        name: 'Laporan Ketidaksesuaian Produk / Form NCR (A4)',
        category: 'Quality Control',
        paperPresetId: 'A4',
        description: 'Formulir Resmi Laporan Ketidaksesuaian Produk (Non-Conformance Report) berstandar ISO 9001:2015 Clause 8.7 & IATF 16949 lengkap dengan Header Banner, Master Info Grid, Klasifikasi & Disposisi Cacat, Matriks Parameter Deviasi NG, Root Cause Analysis, Instruksi Karantina Red Tag, 4 Tanda Tangan Otorisasi, dan QR Code.',
        template: {
            basePdf: { width: 210, height: 297, padding: [10, 10, 10, 10] },
            schemas: [
                [
                    // 1. Header Banner
                    { name: 'header_bg', type: 'rectangle', position: { x: 12, y: 10 }, width: 186, height: 22, color: '#991b1b', borderWidth: 0 },
                    { name: 'logo_bg', type: 'rectangle', position: { x: 16, y: 13 }, width: 15, height: 15, color: '#ffffff', borderWidth: 0 },
                    { name: 'logo_text', type: 'text', position: { x: 16, y: 14.5 }, width: 15, height: 12, fontSize: 18, fontColor: '#991b1b', content: 'M', alignment: 'center' },
                    { name: 'report_title', type: 'text', position: { x: 35, y: 13 }, width: 102, height: 7, fontSize: 11.5, fontColor: '#ffffff', content: 'LAPORAN KETIDAKSESUAIAN PRODUK (NCR)' },
                    { name: 'company_subtitle', type: 'text', position: { x: 35, y: 21 }, width: 102, height: 5, fontSize: 5.5, fontColor: '#fecaca', content: 'MANDOR MES QUALITY ASSURANCE • ISO 9001:2015 CLAUSE 8.7 (NON-CONFORMING OUTPUTS)' },
                    { name: 'doc_info', type: 'text', position: { x: 138, y: 12.5 }, width: 36, height: 9.5, fontSize: 5.5, fontColor: '#ffffff', content: 'DOC NO: FRM-QA-NCR-01\nREV: 03 | 2026-08\nISO AUDITED' },
                    { name: 'report_qr', type: 'qrcode', position: { x: 176, y: 11 }, width: 18, height: 18 },

                    // 2. Master Info Grid (4 columns)
                    { name: 'info_bg', type: 'rectangle', position: { x: 12, y: 34 }, width: 186, height: 24, borderColor: '#fca5a5', borderWidth: 0.5, color: '#fff5f5' },
                    
                    { name: 'ncr_no_lbl', type: 'text', position: { x: 15, y: 36 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#991b1b', content: 'NOMOR NCR:' },
                    { name: 'ncr_no_val', type: 'text', position: { x: 15, y: 40 }, width: 42, height: 5, fontSize: 8.5, fontColor: '#dc2626' },
                    { name: 'station_lbl', type: 'text', position: { x: 15, y: 46 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'STATION / PROSES:' },
                    { name: 'station_val', type: 'text', position: { x: 15, y: 50 }, width: 42, height: 5, fontSize: 7, fontColor: '#0f172a' },

                    { name: 'wo_lbl', type: 'text', position: { x: 60, y: 36 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'WORK ORDER NO:' },
                    { name: 'wo_val', type: 'text', position: { x: 60, y: 40 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#0f172a' },
                    { name: 'inspector_lbl', type: 'text', position: { x: 60, y: 46 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'QC INSPECTOR:' },
                    { name: 'inspector_val', type: 'text', position: { x: 60, y: 50 }, width: 42, height: 5, fontSize: 7, fontColor: '#0f172a' },

                    { name: 'part_name_lbl', type: 'text', position: { x: 105, y: 36 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'NAMA & NO PART:' },
                    { name: 'part_name_val', type: 'text', position: { x: 105, y: 40 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#0f172a' },
                    { name: 'date_lbl', type: 'text', position: { x: 105, y: 46 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'TANGGAL & WAKTU:' },
                    { name: 'date_val', type: 'text', position: { x: 105, y: 50 }, width: 42, height: 5, fontSize: 7, fontColor: '#dc2626' },

                    { name: 'serial_lbl', type: 'text', position: { x: 150, y: 36 }, width: 45, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'SERIAL / LOT NUMBER:' },
                    { name: 'serial_val', type: 'text', position: { x: 150, y: 40 }, width: 45, height: 5, fontSize: 7, fontColor: '#0f172a' },
                    { name: 'standard_lbl', type: 'text', position: { x: 150, y: 46 }, width: 45, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'STANDAR MUTU:' },
                    { name: 'standard_val', type: 'text', position: { x: 150, y: 50 }, width: 45, height: 5, fontSize: 7, fontColor: '#059669', content: 'ISO 9001:2015 (8.7)' },

                    // 3. Summary / Disposition Cards
                    { name: 'defect_box', type: 'rectangle', position: { x: 12, y: 60 }, width: 44, height: 16, borderColor: '#fca5a5', borderWidth: 0.8, color: '#ffffff' },
                    { name: 'defect_bar', type: 'rectangle', position: { x: 12, y: 60 }, width: 2, height: 16, color: '#dc2626', borderWidth: 0 },
                    { name: 'defect_lbl', type: 'text', position: { x: 16, y: 62 }, width: 38, height: 3, fontSize: 5.5, fontColor: '#991b1b', content: 'KLASIFIKASI CACAT:' },
                    { name: 'defect_val', type: 'text', position: { x: 16, y: 67 }, width: 38, height: 6, fontSize: 7.5, fontColor: '#991b1b' },

                    { name: 'disposition_box', type: 'rectangle', position: { x: 59, y: 60 }, width: 44, height: 16, borderColor: '#fde047', borderWidth: 0.8, color: '#ffffff' },
                    { name: 'disposition_bar', type: 'rectangle', position: { x: 59, y: 60 }, width: 2, height: 16, color: '#eab308', borderWidth: 0 },
                    { name: 'disposition_lbl', type: 'text', position: { x: 63, y: 62 }, width: 38, height: 3, fontSize: 5.5, fontColor: '#854d0e', content: 'KEPUTUSAN DISPOSISI:' },
                    { name: 'disposition_val', type: 'text', position: { x: 63, y: 67 }, width: 38, height: 6, fontSize: 8, fontColor: '#a16207' },

                    { name: 'quarantine_box', type: 'rectangle', position: { x: 106, y: 60 }, width: 44, height: 16, borderColor: '#cbd5e1', borderWidth: 0.8, color: '#ffffff' },
                    { name: 'quarantine_bar', type: 'rectangle', position: { x: 106, y: 60 }, width: 2, height: 16, color: '#0284c7', borderWidth: 0 },
                    { name: 'quarantine_lbl', type: 'text', position: { x: 110, y: 62 }, width: 38, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'LOKASI AREA KARANTINA:' },
                    { name: 'quarantine_val', type: 'text', position: { x: 110, y: 67 }, width: 38, height: 6, fontSize: 7.5, fontColor: '#0f172a' },

                    { name: 'hold_box', type: 'rectangle', position: { x: 153, y: 60 }, width: 45, height: 16, borderColor: '#f87171', borderWidth: 0.8, color: '#ffffff' },
                    { name: 'hold_bar', type: 'rectangle', position: { x: 153, y: 60 }, width: 2, height: 16, color: '#ef4444', borderWidth: 0 },
                    { name: 'hold_lbl', type: 'text', position: { x: 157, y: 62 }, width: 39, height: 3, fontSize: 5.5, fontColor: '#991b1b', content: 'STATUS KARANTINA:' },
                    { name: 'hold_val', type: 'text', position: { x: 157, y: 67 }, width: 39, height: 6, fontSize: 7.5, fontColor: '#dc2626', content: '[HOLD] QUARANTINED' },

                    // 4. Parameter Matrix Table (Defects / NG Items)
                    { name: 'ncr_table_title_bg', type: 'rectangle', position: { x: 12, y: 78 }, width: 186, height: 6, color: '#991b1b', borderWidth: 0 },
                    { name: 'ncr_table_title', type: 'text', position: { x: 14, y: 79 }, width: 180, height: 4, fontSize: 6.5, fontColor: '#ffffff', content: 'MATRIKS PARAMETER & PENYIMPANGAN UKURAN (OUT OF TOLERANCE)' },
                    {
                        name: 'ncr_table',
                        type: 'table',
                        position: { x: 12, y: 84 },
                        width: 186,
                        height: 50,
                        showHead: true,
                        head: ['#', 'Parameter Ukur / Dimensi', 'Standar Nominal', 'Toleransi', 'Hasil Aktual', 'Deviasi (Delta)', 'Status'],
                        headWidthPercentages: [5, 33, 15, 17, 14, 10, 6],
                        tableStyles: { borderColor: '#991b1b', borderWidth: 0.3 },
                        headStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 6.5, fontColor: '#ffffff', backgroundColor: '#991b1b', padding: { top: 2, right: 2, bottom: 2, left: 2 } },
                        bodyStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 6.5, fontColor: '#0f172a', padding: { top: 2, right: 2, bottom: 2, left: 2 }, alternateBackgroundColor: '#fef2f2' },
                        columnStyles: {}
                    },

                    // 5. RCA & Corrective Action
                    { name: 'rca_border', type: 'rectangle', position: { x: 12, y: 136 }, width: 91, height: 32, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'rca_hdr', type: 'text', position: { x: 14, y: 138 }, width: 87, height: 4, fontSize: 6, fontColor: '#991b1b', content: '1. ANALISIS PENYEBAB KETIDAKSESUAIAN (ROOT CAUSE ANALYSIS):' },
                    { name: 'rca_val', type: 'text', position: { x: 14, y: 143 }, width: 87, height: 23, fontSize: 6.5, fontColor: '#1e293b' },

                    { name: 'corrective_border', type: 'rectangle', position: { x: 107, y: 136 }, width: 91, height: 32, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'corrective_hdr', type: 'text', position: { x: 109, y: 138 }, width: 87, height: 4, fontSize: 6, fontColor: '#991b1b', content: '2. TINDAKAN KOREKTIF & DISPOSISI (CORRECTIVE ACTION):' },
                    { name: 'corrective_val', type: 'text', position: { x: 109, y: 143 }, width: 87, height: 23, fontSize: 6.5, fontColor: '#1e293b' },

                    // 6. Physical Quarantine Notice Box
                    { name: 'quarantine_notice', type: 'rectangle', position: { x: 12, y: 170 }, width: 186, height: 18, borderColor: '#ef4444', borderWidth: 0.6, color: '#fef2f2' },
                    { name: 'quarantine_tag_badge', type: 'rectangle', position: { x: 15, y: 173 }, width: 16, height: 6, color: '#ef4444', borderWidth: 0 },
                    { name: 'quarantine_tag_text', type: 'text', position: { x: 15, y: 174 }, width: 16, height: 4, fontSize: 5, fontColor: '#ffffff', content: 'RED TAG', alignment: 'center' },
                    { name: 'quarantine_notice_title', type: 'text', position: { x: 34, y: 172 }, width: 162, height: 3.5, fontSize: 6.5, fontColor: '#991b1b', content: '3. VERIFIKASI KARANTINA FISIK & RED HOLD TAG (ISO 9001: 8.7.1)' },
                    { name: 'quarantine_notice_text', type: 'text', position: { x: 34, y: 177 }, width: 162, height: 9, fontSize: 6, fontColor: '#7f1d1d', content: 'Part telah ditempeli Label Karantina Merah (Red Hold Tag) dan dipindahkan ke BIN-Q-02 (HOLD AREA). Dilarang memproses lebih lanjut tanpa otorisasi tertulis QA Management.' },

                    // 7. Multi-tier ISO 9001 Signature Matrix (4 columns)
                    { name: 'sign_box1', type: 'rectangle', position: { x: 12, y: 191 }, width: 44, height: 24, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'sign_lbl1', type: 'text', position: { x: 13, y: 193 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PELAPOR / INSPECTOR', alignment: 'center' },
                    { name: 'sign_val1', type: 'text', position: { x: 13, y: 198 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#059669', content: '[OK] admin', alignment: 'center' },
                    { name: 'sign_sub1', type: 'text', position: { x: 13, y: 207 }, width: 42, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'QC Inspector Verifikasi', alignment: 'center' },

                    { name: 'sign_box2', type: 'rectangle', position: { x: 59, y: 191 }, width: 44, height: 24, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'sign_lbl2', type: 'text', position: { x: 60, y: 193 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'ENGINEERING REVIEW', alignment: 'center' },
                    { name: 'sign_val2', type: 'text', position: { x: 60, y: 198 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#2563eb', content: '[OK] Ahmad S., ST (QA Eng)', alignment: 'center' },
                    { name: 'sign_sub2', type: 'text', position: { x: 60, y: 207 }, width: 42, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Evaluasi Teknis CNC', alignment: 'center' },

                    { name: 'sign_box3', type: 'rectangle', position: { x: 106, y: 191 }, width: 44, height: 24, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'sign_lbl3', type: 'text', position: { x: 107, y: 193 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PERSETUJUAN QA MGR', alignment: 'center' },
                    { name: 'sign_val3', type: 'text', position: { x: 107, y: 198 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#991b1b', content: '[OK] Hendra Wijaya, ST (QA Mgr)', alignment: 'center' },
                    { name: 'sign_sub3', type: 'text', position: { x: 107, y: 207 }, width: 42, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Otorisasi Disposisi Mutu', alignment: 'center' },

                    { name: 'sign_box4', type: 'rectangle', position: { x: 153, y: 191 }, width: 45, height: 24, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'sign_lbl4', type: 'text', position: { x: 154, y: 193 }, width: 43, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PRODUKSI / LINE LEAD', alignment: 'center' },
                    { name: 'sign_val4', type: 'text', position: { x: 154, y: 198 }, width: 43, height: 5, fontSize: 7.5, fontColor: '#475569', content: '[OK] Budi Santoso (Line Lead)', alignment: 'center' },
                    { name: 'sign_sub4', type: 'text', position: { x: 154, y: 207 }, width: 43, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Penerima Part Karantina', alignment: 'center' },

                    // 8. Footer Watermark
                    { name: 'footer_line', type: 'line', position: { x: 12, y: 218 }, width: 186, height: 0.2, color: '#cbd5e1' },
                    { name: 'footer_text', type: 'text', position: { x: 12, y: 220 }, width: 130, height: 4, fontSize: 5, fontColor: '#94a3b8', content: 'MANDOR MES QUALITY ENGINE - ISO 9001:2015 AUDITED FORM NCR - DIGITAL SIGNATURE SECURED' },
                    { name: 'footer_page', type: 'text', position: { x: 145, y: 220 }, width: 53, height: 4, fontSize: 5, fontColor: '#94a3b8', content: 'Doc Control: Controlled Copy - 30/8/2026', alignment: 'right' }
                ]
            ]
        },
        sampleInputs: [
            {
                report_qr: 'NCR_WO-2026-CAST-01_SN-0042-A',
                ncr_no_val: 'NCR-WO-2026-CAST-01',
                wo_val: 'WO-2026-CAST-018',
                part_name_val: 'Precision Housing Component',
                serial_val: 'SN-0042-A (LOT-202608-01)',
                station_val: 'ST-CNC-01 (Milling)',
                inspector_val: 'admin (QC Inspector)',
                date_val: '30/8/2026, 06:05:00',
                standard_val: 'ISO 9001:2015 (8.7)',
                defect_val: 'DIMENSIONAL_OVER',
                disposition_val: 'REWORK',
                quarantine_val: 'BIN-Q-02 (HOLD AREA)',
                hold_val: '[HOLD] QUARANTINED',
                rca_val: 'Penyimpangan toleransi dimensi pada proses pemesinan CNC.',
                corrective_val: 'Karantina part di Area Hold. Kalibrasi ulang tool offset CNC dan setting fixture sebelum lanjut.',
                sign_val1: '[OK] admin',
                sign_val2: '[OK] Ahmad S., ST (QA Eng)',
                sign_val3: '[OK] Hendra Wijaya, ST (QA Mgr)',
                sign_val4: '[OK] Budi Santoso (Line Lead)',
                ncr_table: JSON.stringify([
                    ['1', 'Internal Bore Diameter', '25.000 mm', '24.950 ~ 25.050 mm', '25.180 mm', '+0.130 mm', 'NG'],
                    ['2', 'Flange Thickness', '15.000 mm', '14.900 ~ 15.100 mm', '15.220 mm', '+0.120 mm', 'NG']
                ])
            }
        ]
    },
    {
        id: 'qc-checksheet-a4-basic',
        name: 'QC Checksheet Basic (A4)',
        category: 'Quality Control',
        paperPresetId: 'A4',
        description: 'Laporan inspeksi QC ISO 9001 terintegrasi penuh dengan Drawing & Inspector Designer — memuat Document Control, Header Part, GD&T Matrix, Hasil Ukur, Status, dan Digital Signature.',
        template: {
            basePdf: { width: 210, height: 297, padding: [10, 10, 10, 10] },
            schemas: [
                [
                    // 1. Header Banner
                    { name: 'header_bg', type: 'rectangle', position: { x: 12, y: 10 }, width: 186, height: 22, color: '#4c1d95', borderWidth: 0 },
                    { name: 'report_title', type: 'text', position: { x: 16, y: 13 }, width: 120, height: 7, fontSize: 12.5, fontColor: '#ffffff', content: 'QC INSPECTION CHECKSHEET' },
                    { name: 'company_subtitle', type: 'text', position: { x: 16, y: 21 }, width: 120, height: 4, fontSize: 6, fontColor: '#ddd6fe', content: 'MANDOR MES — ISO 9001:2015 QUALITY ASSURANCE VERIFICATION' },
                    { name: 'doc_id', type: 'text', position: { x: 135, y: 13 }, width: 38, height: 4, fontSize: 6, fontColor: '#ffffff', content: 'DOC: QA-CS-2026-08' },
                    { name: 'doc_control_val', type: 'text', position: { x: 135, y: 18 }, width: 38, height: 6, fontSize: 5.5, fontColor: '#ffffff', content: 'REV: A | 2026-08-23' },
                    { name: 'report_qr', type: 'qrcode', position: { x: 176, y: 11 }, width: 18, height: 18 },

                    // 2. Master Info Grid (4 columns)
                    { name: 'info_border', type: 'rectangle', position: { x: 12, y: 35 }, width: 186, height: 26, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#f8fafc' },
                    
                    { name: 'part_no_label', type: 'text', position: { x: 15, y: 37 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PART NUMBER' },
                    { name: 'part_no_value', type: 'text', position: { x: 15, y: 41 }, width: 42, height: 5, fontSize: 8.5, fontColor: '#0f172a' },
                    { name: 'station_label', type: 'text', position: { x: 15, y: 47 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'STATION / PROCESS' },
                    { name: 'station_value', type: 'text', position: { x: 15, y: 51 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#0f172a' },

                    { name: 'part_name_label', type: 'text', position: { x: 60, y: 37 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PART NAME' },
                    { name: 'part_name_value', type: 'text', position: { x: 60, y: 41 }, width: 42, height: 5, fontSize: 8, fontColor: '#0f172a' },
                    { name: 'inspector_label', type: 'text', position: { x: 60, y: 47 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'QC INSPECTOR' },
                    { name: 'inspector_value', type: 'text', position: { x: 60, y: 51 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#0f172a' },

                    { name: 'customer_label', type: 'text', position: { x: 105, y: 37 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'CUSTOMER' },
                    { name: 'customer_value', type: 'text', position: { x: 105, y: 41 }, width: 42, height: 5, fontSize: 8, fontColor: '#0f172a' },
                    { name: 'approver_label', type: 'text', position: { x: 105, y: 47 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'APPROVAL LEAD' },
                    { name: 'approver_value', type: 'text', position: { x: 105, y: 51 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#0f172a' },

                    { name: 'date_time_label', type: 'text', position: { x: 150, y: 37 }, width: 45, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'TANGGAL PENGUKURAN' },
                    { name: 'date_time_value', type: 'text', position: { x: 150, y: 41 }, width: 45, height: 5, fontSize: 7, fontColor: '#0284c7' },
                    { name: 'standard_label', type: 'text', position: { x: 150, y: 47 }, width: 45, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'STANDAR MUTU' },
                    { name: 'standard_value', type: 'text', position: { x: 150, y: 51 }, width: 45, height: 5, fontSize: 7.5, fontColor: '#059669', content: 'ISO 9001:2015' },

                    // 3. Summary Statistics Bar (4 Cards)
                    { name: 'stat_box_1', type: 'rectangle', position: { x: 12, y: 64 }, width: 44, height: 15, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#f1f5f9' },
                    { name: 'stat_lbl_1', type: 'text', position: { x: 13, y: 66 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'TOTAL TITIK UKUR' },
                    { name: 'total_value', type: 'text', position: { x: 13, y: 70 }, width: 42, height: 6, fontSize: 9.5, fontColor: '#0f172a' },

                    { name: 'stat_box_2', type: 'rectangle', position: { x: 59, y: 64 }, width: 44, height: 15, borderColor: '#a7f3d0', borderWidth: 0.5, color: '#ecfdf5' },
                    { name: 'stat_lbl_2', type: 'text', position: { x: 60, y: 66 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#047857', content: 'STATUS DISPOSISI' },
                    { name: 'status_value', type: 'text', position: { x: 60, y: 70 }, width: 42, height: 6, fontSize: 9, fontColor: '#059669' },

                    { name: 'stat_box_3', type: 'rectangle', position: { x: 106, y: 64 }, width: 44, height: 15, borderColor: '#ddd6fe', borderWidth: 0.5, color: '#f5f3ff' },
                    { name: 'stat_lbl_3', type: 'text', position: { x: 107, y: 66 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'TARGET CPK' },
                    { name: 'cpk_value', type: 'text', position: { x: 107, y: 70 }, width: 42, height: 6, fontSize: 9.5, fontColor: '#7c3aed' },

                    { name: 'stat_box_4', type: 'rectangle', position: { x: 153, y: 64 }, width: 45, height: 15, borderColor: '#bae6fd', borderWidth: 0.5, color: '#f0f9ff' },
                    { name: 'stat_lbl_4', type: 'text', position: { x: 154, y: 66 }, width: 43, height: 3, fontSize: 5.5, fontColor: '#0369a1', content: 'PASS RATE' },
                    { name: 'rate_value', type: 'text', position: { x: 154, y: 70 }, width: 43, height: 6, fontSize: 9.5, fontColor: '#0284c7' },

                    // 4. Parameter Matrix Table
                    {
                        name: 'inspection_table',
                        type: 'table',
                        position: { x: 12, y: 82 },
                        width: 186,
                        height: 138,
                        showHead: true,
                        head: ['#', 'PARAMETER UKUR', 'KATEGORI', 'NOMINAL', 'TOLERANSI (MIN / MAX)', 'HASIL UKUR', 'CRITICALITY', 'STATUS'],
                        headWidthPercentages: [5, 26, 14, 12, 16, 12, 9, 6],
                        tableStyles: { borderColor: '#4c1d95', borderWidth: 0.3 },
                        headStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 7, fontColor: '#ffffff', backgroundColor: '#4c1d95', padding: { top: 2.5, right: 2, bottom: 2.5, left: 2 } },
                        bodyStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 6.5, fontColor: '#0f172a', padding: { top: 2.5, right: 2, bottom: 2.5, left: 2 }, alternateBackgroundColor: '#f8fafc' },
                        columnStyles: {}
                    },

                    // 5. ISO Signature Blocks (3 Columns)
                    { name: 'sign_box1', type: 'rectangle', position: { x: 12, y: 225 }, width: 59, height: 26, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'sign_lbl1', type: 'text', position: { x: 14, y: 227 }, width: 55, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'INSPECTOR (OPERATOR)' },
                    { name: 'sign_val1', type: 'text', position: { x: 14, y: 233 }, width: 55, height: 6, fontSize: 8, fontColor: '#059669', content: '✓ admin' },
                    { name: 'sign_sub1', type: 'text', position: { x: 14, y: 243 }, width: 55, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Tanda Tangan & Tanggal' },

                    { name: 'sign_box2', type: 'rectangle', position: { x: 75, y: 225 }, width: 59, height: 26, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'sign_lbl2', type: 'text', position: { x: 77, y: 227 }, width: 55, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'QA / QC SUPERVISOR' },
                    { name: 'sign_val2', type: 'text', position: { x: 77, y: 233 }, width: 55, height: 6, fontSize: 8, fontColor: '#4338ca', content: '✓ Ahmad Setiawan' },
                    { name: 'sign_sub2', type: 'text', position: { x: 77, y: 243 }, width: 55, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Disetujui QA Management' },

                    { name: 'sign_box3', type: 'rectangle', position: { x: 139, y: 225 }, width: 59, height: 26, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'sign_lbl3', type: 'text', position: { x: 141, y: 227 }, width: 55, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PRODUCTION LEADER' },
                    { name: 'sign_val3', type: 'text', position: { x: 141, y: 233 }, width: 55, height: 6, fontSize: 8, fontColor: '#64748b', content: '✓ Handover Verified' },
                    { name: 'sign_sub3', type: 'text', position: { x: 141, y: 243 }, width: 55, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Diterima Line Produksi' },

                    // 6. ISO Watermark Footer
                    { name: 'footer_line', type: 'line', position: { x: 12, y: 255 }, width: 186, height: 0.2, color: '#cbd5e1' },
                    { name: 'footer_text', type: 'text', position: { x: 12, y: 257 }, width: 186, height: 4, fontSize: 5.5, fontColor: '#94a3b8', content: 'MANDOR MES QUALITY REPORT ENGINE • ISO 9001:2015 AUDITED CHECKSHEET • DIGITAL GENERATED' }
                ]
            ]
        },
        sampleInputs: [
            {
                report_qr: 'https://mandor-core.online/doc/PRT-FLG-450X',
                doc_id: 'DOC: QA-CS-2026-08',
                doc_control_val: 'REV: A | 2026-08-23',
                part_no_value: 'PRT-FLG-450X',
                part_name_value: 'Hydraulic Flange',
                customer_value: 'AeroTech Dynamics Ltd.',
                station_value: 'ST-01 (CNC Line 2)',
                inspector_value: 'admin',
                approver_value: 'Ahmad Setiawan',
                date_time_value: '2026-08-23 22:15:00',
                standard_value: 'ISO 9001:2015',
                total_value: '10 Poin',
                status_value: 'APPROVED (PASS)',
                cpk_value: '1.67 (Min 1.33)',
                rate_value: '100.0%',
                inspection_table: JSON.stringify([
                    ['1', 'Internal Bore Diameter', 'Linear Dimension', '25.00 mm', '24.95 - 25.05', '25.01 mm', 'Critical', 'OK'],
                    ['2', 'Outer Flange Diameter', 'Linear Dimension', '45.00 mm', '44.95 - 45.05', '45.02 mm', 'Major', 'OK'],
                    ['3', 'Seal Face Flatness', 'Flatness (GD&T)', '0.02 mm', 'Max 0.03', '0.018 mm', 'Major', 'OK'],
                    ['4', 'Bolt Hole PCD', 'Position (GD&T)', '65.00 mm', '64.95 - 65.05', '65.00 mm', 'Minor', 'OK'],
                    ['5', 'Perpendicularity Datum A', 'Perpendicularity', '0.015 mm', 'Max 0.025', '0.012 mm', 'Critical', 'OK']
                ])
            }
        ]
    },
    {
        id: 'shipping-label-100x150',
        name: 'Resi Pengiriman / Shipping Label (100 × 150 mm)',
        category: 'Pengiriman & Logistik',
        paperPresetId: 'SH-100x150',
        description: 'Label resi thermal 4x6 inci standar kurir & marketplace (Shopee, Tokopedia, J&T, JNE, SiCepat).',
        template: {
            basePdf: { width: 100, height: 150, padding: [4, 4, 4, 4] },
            schemas: [
                [
                    { name: 'courier_header', type: 'rectangle', position: { x: 5, y: 5 }, width: 90, height: 14, color: '#000000' },
                    { name: 'courier_name', type: 'text', position: { x: 8, y: 8 }, width: 45, height: 8, fontSize: 16, fontColor: '#ffffff', content: 'MANDOR EXPRESS' },
                    { name: 'service_type', type: 'text', position: { x: 55, y: 9 }, width: 38, height: 6, fontSize: 11, fontColor: '#ffffff', content: 'REGULER (STD)' },
                    { name: 'tracking_barcode', type: 'code128', position: { x: 8, y: 22 }, width: 58, height: 18 },
                    { name: 'sorting_qr', type: 'qrcode', position: { x: 70, y: 21 }, width: 20, height: 20 },
                    { name: 'tracking_no', type: 'text', position: { x: 8, y: 42 }, width: 84, height: 6, fontSize: 11, fontColor: '#000000' },
                    { name: 'div_1', type: 'line', position: { x: 5, y: 49 }, width: 90, height: 1, color: '#000000' },
                    { name: 'lbl_penerima', type: 'text', position: { x: 6, y: 51 }, width: 42, height: 4, fontSize: 8, fontColor: '#666666', content: 'PENERIMA (DESTINATION):' },
                    { name: 'nama_penerima', type: 'text', position: { x: 6, y: 56 }, width: 44, height: 6, fontSize: 10, fontColor: '#000000' },
                    { name: 'telp_penerima', type: 'text', position: { x: 6, y: 62 }, width: 44, height: 5, fontSize: 9, fontColor: '#000000' },
                    { name: 'alamat_penerima', type: 'text', position: { x: 6, y: 68 }, width: 44, height: 24, fontSize: 8, fontColor: '#000000' },
                    { name: 'lbl_pengirim', type: 'text', position: { x: 52, y: 51 }, width: 42, height: 4, fontSize: 8, fontColor: '#666666', content: 'PENGIRIM (ORIGIN):' },
                    { name: 'nama_pengirim', type: 'text', position: { x: 52, y: 56 }, width: 43, height: 6, fontSize: 9, fontColor: '#000000' },
                    { name: 'telp_pengirim', type: 'text', position: { x: 52, y: 62 }, width: 43, height: 5, fontSize: 8, fontColor: '#000000' },
                    { name: 'kota_pengirim', type: 'text', position: { x: 52, y: 68 }, width: 43, height: 12, fontSize: 8, fontColor: '#000000' },
                    { name: 'div_2', type: 'line', position: { x: 5, y: 94 }, width: 90, height: 1, color: '#000000' },
                    { name: 'cod_box', type: 'rectangle', position: { x: 5, y: 97 }, width: 44, height: 14, borderColor: '#000000', borderWidth: 0.5 },
                    { name: 'cod_lbl', type: 'text', position: { x: 7, y: 99 }, width: 40, height: 4, fontSize: 7, fontColor: '#444444', content: 'METODE PEMBAYARAN' },
                    { name: 'cod_val', type: 'text', position: { x: 7, y: 104 }, width: 40, height: 6, fontSize: 11, fontColor: '#000000' },
                    { name: 'weight_box', type: 'rectangle', position: { x: 51, y: 97 }, width: 44, height: 14, borderColor: '#000000', borderWidth: 0.5 },
                    { name: 'weight_lbl', type: 'text', position: { x: 53, y: 99 }, width: 40, height: 4, fontSize: 7, fontColor: '#444444', content: 'BERAT PAKET' },
                    { name: 'weight_val', type: 'text', position: { x: 53, y: 104 }, width: 40, height: 6, fontSize: 11, fontColor: '#000000' },
                    {
                        name: 'package_items_table',
                        type: 'table',
                        position: { x: 5, y: 114 },
                        width: 90,
                        height: 30,
                        showHead: true,
                        head: ['SKU / Item', 'Qty', 'Catatan'],
                        headWidthPercentages: [55, 15, 30],
                        tableStyles: { borderColor: '#000000', borderWidth: 0.2 },
                        headStyles: { ...STD_HEAD_STYLES, backgroundColor: '#000000', fontSize: 7, padding: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 } },
                        bodyStyles: { ...STD_BODY_STYLES, fontSize: 7, padding: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 } },
                        columnStyles: {}
                    }
                ]
            ]
        },
        sampleInputs: [
            {
                tracking_barcode: 'MV-88392019482ID',
                sorting_qr: 'https://track.mandor.io/MV-88392019482ID',
                tracking_no: 'No. Resi: MV-88392019482ID',
                nama_penerima: 'Bpk. Hendra Gunawan',
                telp_penerima: '0812-3456-7890',
                alamat_penerima: 'Jl. Merdeka No. 45 RT 02/05, Kel. Gambir, Kec. Gambir, Kota Jakarta Pusat, DKI Jakarta 10110',
                nama_pengirim: 'PT MANDOR CORE FACTORY',
                telp_pengirim: '021-88997766',
                kota_pengirim: 'Kawasan Industri GIIC Cikarang, Bekasi, Jawa Barat',
                cod_val: 'NON-COD (LUNAS)',
                weight_val: '1.25 Kg',
                package_items_table: JSON.stringify([
                    ['Bearing 6204-2RS High Speed', '4 pcs', 'Fragile'],
                    ['Flange Gasket Silicone 45mm', '2 pcs', 'Ori Pack']
                ])
            }
        ]
    },
    {
        id: 'retail-price-tag-50x30',
        name: 'Label Harga & Barcode Retail (50 × 30 mm)',
        category: 'Produk & Retail',
        paperPresetId: 'RT-50x30',
        description: 'Stiker label harga toko & minimarket standar 50x30mm dengan barcode EAN-13/Code128 dan harga rupiah tebal.',
        template: {
            basePdf: { width: 50, height: 30, padding: [2, 2, 2, 2] },
            schemas: [
                [
                    { name: 'store_name', type: 'text', position: { x: 3, y: 2 }, width: 44, height: 4, fontSize: 7, fontColor: '#444444', content: 'MANDOR INDUSTRIAL STORE' },
                    { name: 'item_name', type: 'text', position: { x: 3, y: 6 }, width: 44, height: 5, fontSize: 9, fontColor: '#000000' },
                    { name: 'item_sku', type: 'text', position: { x: 3, y: 11 }, width: 44, height: 3.5, fontSize: 6, fontColor: '#666666' },
                    { name: 'product_barcode', type: 'code128', position: { x: 3, y: 15 }, width: 44, height: 8 },
                    { name: 'price_display', type: 'text', position: { x: 3, y: 24 }, width: 44, height: 5, fontSize: 11, fontColor: '#000000' }
                ]
            ]
        },
        sampleInputs: [
            {
                item_name: 'Baut Hex M8 x 25mm SS304',
                item_sku: 'SKU: FAST-HEX-M8-SS | Rak A-12',
                product_barcode: '899304820194',
                price_display: 'Rp 4.500 / pcs'
            }
        ]
    },
    {
        id: 'invitation-label-tj103',
        name: 'Label Undangan Tom & Jerry No. 103 (64 × 32 mm)',
        category: 'Label Undangan / Stiker',
        paperPresetId: 'TJ-103',
        description: 'Stiker label undangan pernikahan / event (Tom & Jerry 103) dengan format "Kepada Yth." dan nama tamu elegan.',
        template: {
            basePdf: { width: 64, height: 32, padding: [2, 2, 2, 2] },
            schemas: [
                [
                    { name: 'salutation', type: 'text', position: { x: 4, y: 4 }, width: 56, height: 4, fontSize: 7.5, fontColor: '#555555', content: 'Kepada Yth. Bapak / Ibu / Saudara/i:' },
                    { name: 'guest_name', type: 'text', position: { x: 4, y: 11 }, width: 56, height: 8, fontSize: 11, fontColor: '#111111' },
                    { name: 'guest_location', type: 'text', position: { x: 4, y: 21 }, width: 56, height: 5, fontSize: 8, fontColor: '#444444' }
                ]
            ]
        },
        sampleInputs: [
            {
                guest_name: 'Dr. Ir. Bambang Wicaksono, M.T. & Partner',
                guest_location: 'di Tempat'
            }
        ]
    },
    // ─────────────────────────────────────────────────────────────────────
    // KANBAN TEMPLATES
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'kanban-picking',
        name: 'Kanban Picking (100 × 150 mm)',
        category: 'Kanban & Manufacturing',
        paperPresetId: 'SH-100x150',
        description: 'Label Kanban Picking untuk warehouse - berisi part number, quantity, location, barcode QR code untuk scan.',
        template: {
            basePdf: { width: 100, height: 150, padding: [4, 4, 4, 4] },
            schemas: [
                [
                    // Header - Company & Kanban Type
                    { name: 'header_bg', type: 'rectangle', position: { x: 5, y: 5 }, width: 90, height: 16, color: '#1e40af' },
                    { name: 'kanban_type', type: 'text', position: { x: 7, y: 7 }, width: 35, height: 6, fontSize: 10, fontColor: '#ffffff', content: '📦 KANBAN PICKING' },
                    { name: 'priority_badge', type: 'rectangle', position: { x: 70, y: 7 }, width: 22, height: 8, color: '#dc2626' },
                    { name: 'priority_text', type: 'text', position: { x: 72, y: 9 }, width: 18, height: 5, fontSize: 8, fontColor: '#ffffff', content: 'URGENT' },
                    { name: 'company_name', type: 'text', position: { x: 7, y: 16 }, width: 50, height: 4, fontSize: 7, fontColor: '#93c5fd', content: 'PT MANDOR INDUSTRIAL MANUFACTURING' },

                    // Part Information Section
                    { name: 'part_label', type: 'text', position: { x: 6, y: 26 }, width: 40, height: 4, fontSize: 7, fontColor: '#64748b', content: 'PART NUMBER' },
                    { name: 'part_number', type: 'text', position: { x: 6, y: 30 }, width: 55, height: 8, fontSize: 14, fontColor: '#000000', content: 'BRG-6204-SS-2RS' },
                    { name: 'part_name', type: 'text', position: { x: 6, y: 39 }, width: 60, height: 5, fontSize: 9, fontColor: '#1f2937', content: 'Deep Groove Ball Bearing SS304' },

                    // QR Code - Right Side
                    { name: 'part_qr', type: 'qrcode', position: { x: 72, y: 26 }, width: 22, height: 22 },
                    { name: 'qr_label', type: 'text', position: { x: 72, y: 49 }, width: 22, height: 3, fontSize: 5, fontColor: '#64748b', content: 'SCAN QR' },

                    // Divider
                    { name: 'divider_1', type: 'line', position: { x: 5, y: 55 }, width: 90, height: 0.5, color: '#374151' },

                    // Quantity Section
                    { name: 'qty_label', type: 'text', position: { x: 6, y: 58 }, width: 25, height: 3, fontSize: 6, fontColor: '#64748b', content: 'QUANTITY' },
                    { name: 'qty_box', type: 'rectangle', position: { x: 6, y: 62 }, width: 28, height: 14, borderColor: '#000000', borderWidth: 1, color: '#fef3c7' },
                    { name: 'qty_value', type: 'text', position: { x: 8, y: 64 }, width: 24, height: 10, fontSize: 18, fontColor: '#000000', content: '50' },
                    { name: 'qty_unit', type: 'text', position: { x: 8, y: 74 }, width: 24, height: 3, fontSize: 6, fontColor: '#64748b', content: 'PCS' },

                    // Location Section
                    { name: 'loc_label', type: 'text', position: { x: 38, y: 58 }, width: 25, height: 3, fontSize: 6, fontColor: '#64748b', content: 'LOCATION' },
                    { name: 'loc_box', type: 'rectangle', position: { x: 38, y: 62 }, width: 30, height: 14, borderColor: '#000000', borderWidth: 1, color: '#dbeafe' },
                    { name: 'loc_value', type: 'text', position: { x: 40, y: 65 }, width: 26, height: 9, fontSize: 14, fontColor: '#000000', content: 'A-12-03' },

                    // Barcode - Bottom
                    { name: 'barcode', type: 'code128', position: { x: 6, y: 82 }, width: 55, height: 14 },
                    { name: 'barcode_num', type: 'text', position: { x: 6, y: 97 }, width: 55, height: 4, fontSize: 7, fontColor: '#000000', content: 'BRG-6204-SS-2RS-50PCS-A12' },

                    // Additional Info Box
                    { name: 'info_bg', type: 'rectangle', position: { x: 65, y: 78 }, width: 30, height: 24, borderColor: '#374151', borderWidth: 0.5, color: '#f9fafb' },
                    { name: 'wo_label', type: 'text', position: { x: 67, y: 80 }, width: 26, height: 3, fontSize: 6, fontColor: '#64748b', content: 'WO #' },
                    { name: 'wo_value', type: 'text', position: { x: 67, y: 83 }, width: 26, height: 4, fontSize: 7, fontColor: '#000000', content: 'WO-2026-0819' },
                    { name: 'date_label', type: 'text', position: { x: 67, y: 89 }, width: 26, height: 3, fontSize: 6, fontColor: '#64748b', content: 'DUE DATE' },
                    { name: 'date_value', type: 'text', position: { x: 67, y: 92 }, width: 26, height: 4, fontSize: 7, fontColor: '#000000', content: '2026-08-22' },
                    { name: 'shift_label', type: 'text', position: { x: 67, y: 97 }, width: 26, height: 3, fontSize: 6, fontColor: '#64748b', content: 'SHIFT' },
                    { name: 'shift_value', type: 'text', position: { x: 67, y: 100 }, width: 26, height: 3, fontSize: 7, fontColor: '#000000', content: 'ALL SHIFT' },

                    // Footer
                    { name: 'footer_bg', type: 'rectangle', position: { x: 5, y: 105 }, width: 90, height: 8, color: '#1e40af' },
                    { name: 'footer_text', type: 'text', position: { x: 7, y: 107 }, width: 60, height: 4, fontSize: 6, fontColor: '#ffffff', content: 'PICKING INSTRUCTION: Scan barcode → Collect parts → Deliver to station' },
                    { name: 'pic_label', type: 'text', position: { x: 70, y: 107 }, width: 23, height: 4, fontSize: 6, fontColor: '#ffffff', content: 'PIC: Warehouse' }
                ]
            ]
        },
        sampleInputs: [
            {
                kanban_type: '📦 KANBAN PICKING',
                priority_text: 'URGENT',
                company_name: 'PT MANDOR INDUSTRIAL MANUFACTURING',
                part_number: 'BRG-6204-SS-2RS',
                part_name: 'Deep Groove Ball Bearing SS304',
                part_qr: 'https://mandor.io/part/BRG-6204-SS-2RS',
                qty_value: '50',
                loc_value: 'A-12-03',
                barcode: 'BRG-6204-SS-2RS-50PCS-A12',
                barcode_num: 'BRG-6204-SS-2RS-50PCS-A12',
                wo_value: 'WO-2026-0819',
                date_value: '2026-08-22',
                shift_value: 'ALL SHIFT'
            }
        ]
    },
    {
        id: 'kanban-wip',
        name: 'Kanban WIP - Work In Process (100 × 150 mm)',
        category: 'Kanban & Manufacturing',
        paperPresetId: 'SH-100x150',
        description: 'Label Kanban WIP untuk proses produksi - tracking flow, process step, quantity, dan real-time status barcode.',
        template: {
            basePdf: { width: 100, height: 150, padding: [4, 4, 4, 4] },
            schemas: [
                [
                    // Header - Process Flow Badge
                    { name: 'header_bg', type: 'rectangle', position: { x: 5, y: 5 }, width: 90, height: 18, color: '#7c3aed' },
                    { name: 'kanban_type', type: 'text', position: { x: 7, y: 7 }, width: 50, height: 6, fontSize: 11, fontColor: '#ffffff', content: '⚙️ KANBAN WIP' },
                    { name: 'process_step', type: 'text', position: { x: 7, y: 14 }, width: 60, height: 5, fontSize: 8, fontColor: '#ddd6fe', content: 'WORK IN PROCESS - ASSEMBLY LINE B' },
                    { name: 'status_badge', type: 'rectangle', position: { x: 70, y: 9 }, width: 22, height: 10, color: '#22c55e' },
                    { name: 'status_text', type: 'text', position: { x: 72, y: 12 }, width: 18, height: 5, fontSize: 8, fontColor: '#ffffff', content: 'IN PROGRESS' },

                    // Process Flow Indicator
                    { name: 'flow_bg', type: 'rectangle', position: { x: 5, y: 26 }, width: 90, height: 12, color: '#f3f4f6' },
                    { name: 'step_1', type: 'rectangle', position: { x: 8, y: 28 }, width: 20, height: 8, color: '#22c55e' },
                    { name: 'step_1_text', type: 'text', position: { x: 10, y: 30 }, width: 16, height: 5, fontSize: 6, fontColor: '#ffffff', content: 'CUTTING ✓' },
                    { name: 'arrow_1', type: 'text', position: { x: 30, y: 30 }, width: 8, height: 5, fontSize: 8, fontColor: '#374151', content: '→' },
                    { name: 'step_2', type: 'rectangle', position: { x: 40, y: 28 }, width: 20, height: 8, color: '#22c55e' },
                    { name: 'step_2_text', type: 'text', position: { x: 42, y: 30 }, width: 16, height: 5, fontSize: 6, fontColor: '#ffffff', content: 'WELDING ✓' },
                    { name: 'arrow_2', type: 'text', position: { x: 62, y: 30 }, width: 8, height: 5, fontSize: 8, fontColor: '#374151', content: '→' },
                    { name: 'step_3', type: 'rectangle', position: { x: 72, y: 28 }, width: 20, height: 8, color: '#f59e0b' },
                    { name: 'step_3_text', type: 'text', position: { x: 74, y: 30 }, width: 16, height: 5, fontSize: 6, fontColor: '#ffffff', content: 'ASSEMBLY' },

                    // Part & Operation Info
                    { name: 'part_label', type: 'text', position: { x: 6, y: 42 }, width: 35, height: 3, fontSize: 6, fontColor: '#64748b', content: 'PART NUMBER' },
                    { name: 'part_value', type: 'text', position: { x: 6, y: 45 }, width: 55, height: 6, fontSize: 11, fontColor: '#000000', content: 'ASY-HYD-CYL-125' },
                    { name: 'op_label', type: 'text', position: { x: 6, y: 53 }, width: 35, height: 3, fontSize: 6, fontColor: '#64748b', content: 'OPERATION' },
                    { name: 'op_value', type: 'text', position: { x: 6, y: 56 }, width: 55, height: 4, fontSize: 9, fontColor: '#000000', content: 'Hydraulic Cylinder Assembly - Step 3 of 5' },

                    // QR Code
                    { name: 'wip_qr', type: 'qrcode', position: { x: 72, y: 40 }, width: 22, height: 22 },
                    { name: 'qr_label', type: 'text', position: { x: 72, y: 63 }, width: 22, height: 3, fontSize: 5, fontColor: '#64748b', content: 'TRACK ID' },

                    // Divider
                    { name: 'divider_1', type: 'line', position: { x: 5, y: 68 }, width: 90, height: 0.5, color: '#7c3aed' },

                    // Quantity & Cycle Info
                    { name: 'qty_box', type: 'rectangle', position: { x: 6, y: 72 }, width: 28, height: 18, borderColor: '#7c3aed', borderWidth: 1, color: '#ede9fe' },
                    { name: 'qty_label', type: 'text', position: { x: 8, y: 74 }, width: 24, height: 3, fontSize: 6, fontColor: '#7c3aed', content: 'BATCH QTY' },
                    { name: 'qty_value', type: 'text', position: { x: 8, y: 78 }, width: 24, height: 10, fontSize: 16, fontColor: '#7c3aed', content: '25' },

                    { name: 'cycle_box', type: 'rectangle', position: { x: 38, y: 72 }, width: 28, height: 18, borderColor: '#374151', borderWidth: 0.5, color: '#f9fafb' },
                    { name: 'cycle_label', type: 'text', position: { x: 40, y: 74 }, width: 24, height: 3, fontSize: 6, fontColor: '#64748b', content: 'CYCLE TIME' },
                    { name: 'cycle_value', type: 'text', position: { x: 40, y: 78 }, width: 24, height: 10, fontSize: 14, fontColor: '#000000', content: '45 min' },

                    // Progress Bar
                    { name: 'progress_label', type: 'text', position: { x: 70, y: 74 }, width: 26, height: 3, fontSize: 6, fontColor: '#64748b', content: 'PROGRESS' },
                    { name: 'progress_bar_bg', type: 'rectangle', position: { x: 70, y: 78 }, width: 26, height: 6, color: '#e5e7eb' },
                    { name: 'progress_bar_fill', type: 'rectangle', position: { x: 70, y: 78 }, width: 18, height: 6, color: '#22c55e' },
                    { name: 'progress_pct', type: 'text', position: { x: 70, y: 85 }, width: 26, height: 4, fontSize: 8, fontColor: '#22c55e', content: '68% COMPLETE' },

                    // Barcode
                    { name: 'wip_barcode', type: 'code128', position: { x: 6, y: 95 }, width: 88, height: 14 },
                    { name: 'wip_barcode_num', type: 'text', position: { x: 6, y: 110 }, width: 88, height: 4, fontSize: 7, fontColor: '#000000', content: 'WIP-ASY-HYD-125-B25-2026-08-22-ASSY3' },

                    // Footer
                    { name: 'footer_bg', type: 'rectangle', position: { x: 5, y: 118 }, width: 90, height: 8, color: '#7c3aed' },
                    { name: 'footer_text', type: 'text', position: { x: 7, y: 120 }, width: 60, height: 4, fontSize: 6, fontColor: '#ffffff', content: 'Scan to track WIP status. Move to next station when complete.' },
                    { name: 'operator_label', type: 'text', position: { x: 70, y: 120 }, width: 23, height: 4, fontSize: 6, fontColor: '#ffffff', content: 'OP: Operator-07' }
                ]
            ]
        },
        sampleInputs: [
            {
                kanban_type: '⚙️ KANBAN WIP',
                process_step: 'WORK IN PROCESS - ASSEMBLY LINE B',
                status_text: 'IN PROGRESS',
                part_value: 'ASY-HYD-CYL-125',
                op_value: 'Hydraulic Cylinder Assembly - Step 3 of 5',
                wip_qr: 'https://mandor.io/wip/ASY-HYD-CYL-125-B25',
                qty_value: '25',
                cycle_value: '45 min',
                wip_barcode: 'WIP-ASY-HYD-125-B25-2026-08-22-ASSY3',
                wip_barcode_num: 'WIP-ASY-HYD-125-B25-2026-08-22-ASSY3'
            }
        ]
    },
    {
        id: 'kanban-manufacture',
        name: 'Kanban Manufacture (100 × 150 mm)',
        category: 'Kanban & Manufacturing',
        paperPresetId: 'SH-100x150',
        description: 'Label Kanban Manufacture untuk production order - detail produk, routing, quantity, dan QR code untuk tracking.',
        template: {
            basePdf: { width: 100, height: 150, padding: [4, 4, 4, 4] },
            schemas: [
                [
                    // Header - Production Badge
                    { name: 'header_bg', type: 'rectangle', position: { x: 5, y: 5 }, width: 90, height: 20, color: '#dc2626' },
                    { name: 'kanban_type', type: 'text', position: { x: 7, y: 7 }, width: 50, height: 7, fontSize: 12, fontColor: '#ffffff', content: '🏭 KANBAN MANUFACTURE' },
                    { name: 'production_no', type: 'text', position: { x: 7, y: 15 }, width: 55, height: 5, fontSize: 8, fontColor: '#fecaca', content: 'PRODUCTION ORDER: MFG-2026-08-0042' },
                    { name: 'priority_badge', type: 'rectangle', position: { x: 72, y: 7 }, width: 20, height: 8, color: '#fbbf24' },
                    { name: 'priority_text', type: 'text', position: { x: 74, y: 9 }, width: 16, height: 5, fontSize: 7, fontColor: '#000000', content: 'HIGH PRIORITY' },

                    // Product Information
                    { name: 'product_label', type: 'text', position: { x: 6, y: 28 }, width: 30, height: 3, fontSize: 6, fontColor: '#64748b', content: 'PRODUCT / PART' },
                    { name: 'product_name', type: 'text', position: { x: 6, y: 31 }, width: 60, height: 6, fontSize: 12, fontColor: '#000000', content: 'Pneumatic Valve Assembly Kit' },
                    { name: 'product_code', type: 'text', position: { x: 6, y: 38 }, width: 50, height: 4, fontSize: 8, fontColor: '#374151', content: 'Code: PVAK-450X-N5 | Rev.03' },

                    // QR Code
                    { name: 'product_qr', type: 'qrcode', position: { x: 72, y: 26 }, width: 22, height: 22 },
                    { name: 'qr_label', type: 'text', position: { x: 72, y: 49 }, width: 22, height: 3, fontSize: 5, fontColor: '#64748b', content: 'PRODUCT ID' },

                    // Divider
                    { name: 'divider_1', type: 'line', position: { x: 5, y: 55 }, width: 90, height: 0.5, color: '#dc2626' },

                    // Production Info Grid
                    { name: 'grid_bg', type: 'rectangle', position: { x: 5, y: 58 }, width: 90, height: 28, color: '#fef2f2' },

                    // Row 1
                    { name: 'qty_label', type: 'text', position: { x: 7, y: 60 }, width: 25, height: 3, fontSize: 6, fontColor: '#dc2626', content: 'ORDER QTY' },
                    { name: 'qty_value', type: 'text', position: { x: 7, y: 63 }, width: 25, height: 6, fontSize: 14, fontColor: '#000000', content: '100 pcs' },

                    { name: 'due_label', type: 'text', position: { x: 35, y: 60 }, width: 25, height: 3, fontSize: 6, fontColor: '#dc2626', content: 'DUE DATE' },
                    { name: 'due_value', type: 'text', position: { x: 35, y: 63 }, width: 25, height: 6, fontSize: 11, fontColor: '#000000', content: '2026-08-25' },

                    { name: 'shift_label', type: 'text', position: { x: 63, y: 60 }, width: 30, height: 3, fontSize: 6, fontColor: '#dc2626', content: 'TARGET SHIFT' },
                    { name: 'shift_value', type: 'text', position: { x: 63, y: 63 }, width: 30, height: 6, fontSize: 10, fontColor: '#000000', content: 'SHIFT 1 & 2' },

                    // Row 2
                    { name: 'routing_label', type: 'text', position: { x: 7, y: 72 }, width: 25, height: 3, fontSize: 6, fontColor: '#64748b', content: 'ROUTING' },
                    { name: 'routing_value', type: 'text', position: { x: 7, y: 75 }, width: 40, height: 5, fontSize: 8, fontColor: '#000000', content: 'ST100 → ST200 → ST300 → PK' },

                    { name: 'station_label', type: 'text', position: { x: 63, y: 72 }, width: 30, height: 3, fontSize: 6, fontColor: '#64748b', content: 'CURRENT STATION' },
                    { name: 'station_value', type: 'text', position: { x: 63, y: 75 }, width: 30, height: 5, fontSize: 10, fontColor: '#22c55e', content: 'ST200 - ASSY' },

                    // BOM Reference
                    { name: 'bom_label', type: 'text', position: { x: 7, y: 83 }, width: 40, height: 3, fontSize: 6, fontColor: '#64748b', content: 'BOM REF' },
                    { name: 'bom_value', type: 'text', position: { x: 7, y: 86 }, width: 55, height: 4, fontSize: 8, fontColor: '#000000', content: 'BOM-PVAK-450X-R03 | 12 Components' },

                    // Barcode
                    { name: 'mfg_barcode', type: 'code128', position: { x: 6, y: 93 }, width: 88, height: 14 },
                    { name: 'mfg_barcode_num', type: 'text', position: { x: 6, y: 108 }, width: 88, height: 4, fontSize: 7, fontColor: '#000000', content: 'MFG-PVAK-450X-N5-100PCS-20260825' },

                    // Footer - Instructions
                    { name: 'footer_bg', type: 'rectangle', position: { x: 5, y: 116 }, width: 90, height: 8, color: '#dc2626' },
                    { name: 'footer_text', type: 'text', position: { x: 7, y: 118 }, width: 55, height: 4, fontSize: 6, fontColor: '#ffffff', content: '🔧 Assemble per BOM. QC check each unit. Pack in box of 10.' },
                    { name: 'qc_label', type: 'text', position: { x: 65, y: 118 }, width: 28, height: 4, fontSize: 6, fontColor: '#ffffff', content: 'QC: 100% inspection' }
                ]
            ]
        },
        sampleInputs: [
            {
                kanban_type: '🏭 KANBAN MANUFACTURE',
                production_no: 'PRODUCTION ORDER: MFG-2026-08-0042',
                priority_text: 'HIGH PRIORITY',
                product_name: 'Pneumatic Valve Assembly Kit',
                product_code: 'Code: PVAK-450X-N5 | Rev.03',
                product_qr: 'https://mandor.io/product/PVAK-450X-N5',
                qty_value: '100 pcs',
                due_value: '2026-08-25',
                shift_value: 'SHIFT 1 & 2',
                routing_value: 'ST100 → ST200 → ST300 → PK',
                station_value: 'ST200 - ASSY',
                bom_value: 'BOM-PVAK-450X-R03 | 12 Components',
                mfg_barcode: 'MFG-PVAK-450X-N5-100PCS-20260825',
                mfg_barcode_num: 'MFG-PVAK-450X-N5-100PCS-20260825'
            }
        ]
    },
    {
        id: 'kanban-picking-small',
        name: 'Kanban Picking Mini (75 × 50 mm)',
        category: 'Kanban & Manufacturing',
        paperPresetId: 'SH-75x100',
        description: 'Label Kanban Picking ukuran kecil untuk rak atau container bin - barcode QR dan info penting.',
        template: {
            basePdf: { width: 75, height: 100, padding: [3, 3, 3, 3] },
            schemas: [
                [
                    // Header
                    { name: 'header_bg', type: 'rectangle', position: { x: 4, y: 4 }, width: 67, height: 10, color: '#1e40af' },
                    { name: 'kanban_type', type: 'text', position: { x: 5, y: 6 }, width: 35, height: 5, fontSize: 8, fontColor: '#ffffff', content: '📦 PICKING' },
                    { name: 'priority', type: 'text', position: { x: 45, y: 6 }, width: 24, height: 5, fontSize: 7, fontColor: '#fbbf24', content: '⚡ RUSH' },

                    // Part Info
                    { name: 'part_num', type: 'text', position: { x: 5, y: 17 }, width: 65, height: 5, fontSize: 10, fontColor: '#000000', content: 'BRG-6204-SS' },
                    { name: 'part_name', type: 'text', position: { x: 5, y: 23 }, width: 65, height: 4, fontSize: 7, fontColor: '#374151', content: 'Ball Bearing SS304' },

                    // QR Code
                    { name: 'qr', type: 'qrcode', position: { x: 5, y: 30 }, width: 18, height: 18 },

                    // Quantity & Location
                    { name: 'qty_label', type: 'text', position: { x: 26, y: 30 }, width: 20, height: 3, fontSize: 5, fontColor: '#64748b', content: 'QTY' },
                    { name: 'qty_val', type: 'text', position: { x: 26, y: 33 }, width: 20, height: 8, fontSize: 14, fontColor: '#1e40af', content: '50' },
                    { name: 'loc_label', type: 'text', position: { x: 48, y: 30 }, width: 22, height: 3, fontSize: 5, fontColor: '#64748b', content: 'LOCATION' },
                    { name: 'loc_val', type: 'text', position: { x: 48, y: 33 }, width: 22, height: 8, fontSize: 12, fontColor: '#000000', content: 'A-12' },

                    // Barcode
                    { name: 'barcode', type: 'code128', position: { x: 5, y: 52 }, width: 65, height: 10 },
                    { name: 'barcode_num', type: 'text', position: { x: 5, y: 63 }, width: 65, height: 3, fontSize: 6, fontColor: '#000000', content: 'BRG-6204-50A12' },

                    // WO & Date
                    { name: 'wo_label', type: 'text', position: { x: 5, y: 68 }, width: 30, height: 3, fontSize: 5, fontColor: '#64748b', content: 'WO' },
                    { name: 'wo_val', type: 'text', position: { x: 5, y: 71 }, width: 30, height: 3, fontSize: 6, fontColor: '#000000', content: 'WO-2026-0819' },
                    { name: 'date_label', type: 'text', position: { x: 40, y: 68 }, width: 30, height: 3, fontSize: 5, fontColor: '#64748b', content: 'DATE' },
                    { name: 'date_val', type: 'text', position: { x: 40, y: 71 }, width: 30, height: 3, fontSize: 6, fontColor: '#000000', content: '2026-08-22' },

                    // Footer
                    { name: 'footer_bg', type: 'rectangle', position: { x: 4, y: 80 }, width: 67, height: 6, color: '#1e40af' },
                    { name: 'footer', type: 'text', position: { x: 5, y: 82 }, width: 65, height: 4, fontSize: 5, fontColor: '#ffffff', content: 'MANDOR WAREHOUSE' }
                ]
            ]
        },
        sampleInputs: [
            {
                kanban_type: '📦 PICKING',
                priority: '⚡ RUSH',
                part_num: 'BRG-6204-SS',
                part_name: 'Ball Bearing SS304',
                qr: 'https://mandor.io/part/BRG-6204-SS',
                qty_val: '50',
                loc_val: 'A-12',
                barcode: 'BRG-6204-50A12',
                barcode_num: 'BRG-6204-50A12',
                wo_val: 'WO-2026-0819',
                date_val: '2026-08-22'
            }
        ]
    },
    // ─────────────────────────────────────────────────────────────────────
    // SHIFT HANDOFF REPORT TEMPLATE
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'shift-handoff-report-a4',
        name: 'Shift Handoff Report (A4)',
        category: 'Shift Reports',
        paperPresetId: 'A4',
        description: 'Laporan handover shift produksi A4 - berisi ringkasan produksi, OEE, downtime, defect, dan tanda tangan operator.',
        template: {
            basePdf: { width: 210, height: 297, padding: [10, 10, 10, 10] },
            schemas: [
                [
                    // ── HEADER ──
                    { name: 'header_bg', type: 'rectangle', position: { x: 15, y: 12 }, width: 180, height: 22, color: '#714B67', borderWidth: 0 },
                    { name: 'report_title', type: 'text', position: { x: 20, y: 16 }, width: 100, height: 7, fontSize: 14, fontColor: '#ffffff', content: 'SHIFT HANDOFF REPORT' },
                    { name: 'company_name', type: 'text', position: { x: 20, y: 24 }, width: 80, height: 5, fontSize: 7, fontColor: '#e2cfe0', content: 'MANDOR MES — Manufacturing Execution System' },
                    { name: 'report_qr', type: 'qrcode', position: { x: 172, y: 14 }, width: 18, height: 18 },
                    { name: 'doc_id', type: 'text', position: { x: 172, y: 34 }, width: 23, height: 4, fontSize: 6, fontColor: '#64748b' },

                    // ── SHIFT INFO BOX ──
                    { name: 'info_border', type: 'rectangle', position: { x: 15, y: 40 }, width: 180, height: 28, borderColor: '#dee2e6', borderWidth: 0.5, color: '#faf5f9' },
                    { name: 'shift_label', type: 'text', position: { x: 20, y: 44 }, width: 30, height: 5, fontSize: 7, fontColor: '#64748b', content: 'SHIFT' },
                    { name: 'shift_value', type: 'text', position: { x: 20, y: 49 }, width: 40, height: 6, fontSize: 11, fontColor: '#1f2937' },
                    { name: 'date_label', type: 'text', position: { x: 65, y: 44 }, width: 30, height: 5, fontSize: 7, fontColor: '#64748b', content: 'DATE' },
                    { name: 'date_value', type: 'text', position: { x: 65, y: 49 }, width: 45, height: 6, fontSize: 11, fontColor: '#1f2937' },
                    { name: 'time_label', type: 'text', position: { x: 115, y: 44 }, width: 30, height: 5, fontSize: 7, fontColor: '#64748b', content: 'TIME RANGE' },
                    { name: 'time_value', type: 'text', position: { x: 115, y: 49 }, width: 40, height: 6, fontSize: 11, fontColor: '#1f2937' },
                    { name: 'operator_label', type: 'text', position: { x: 160, y: 44 }, width: 30, height: 5, fontSize: 7, fontColor: '#64748b', content: 'OPERATOR' },
                    { name: 'operator_value', type: 'text', position: { x: 160, y: 49 }, width: 32, height: 6, fontSize: 10, fontColor: '#1f2937' },

                    // ── PRODUCTION SUMMARY ──
                    { name: 'section1_title', type: 'text', position: { x: 15, y: 74 }, width: 85, height: 6, fontSize: 9, fontColor: '#714B67', content: '📦 PRODUCTION SUMMARY' },
                    { name: 'prod_bg', type: 'rectangle', position: { x: 15, y: 82 }, width: 85, height: 40, borderColor: '#e2e8f0', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'target_label', type: 'text', position: { x: 20, y: 86 }, width: 30, height: 4, fontSize: 7, fontColor: '#64748b', content: 'TARGET' },
                    { name: 'target_value', type: 'text', position: { x: 20, y: 91 }, width: 35, height: 8, fontSize: 18, fontColor: '#1f2937' },
                    { name: 'actual_label', type: 'text', position: { x: 20, y: 102 }, width: 30, height: 4, fontSize: 7, fontColor: '#64748b', content: 'ACTUAL' },
                    { name: 'actual_value', type: 'text', position: { x: 20, y: 107 }, width: 35, height: 8, fontSize: 18, fontColor: '#1f2937' },
                    { name: 'completion_label', type: 'text', position: { x: 55, y: 86 }, width: 40, height: 4, fontSize: 7, fontColor: '#64748b', content: 'COMPLETION RATE' },
                    { name: 'completion_value', type: 'text', position: { x: 55, y: 91 }, width: 40, height: 8, fontSize: 18, fontColor: '#16a34a' },

                    // ── QUALITY SUMMARY ──
                    { name: 'section2_title', type: 'text', position: { x: 110, y: 74 }, width: 85, height: 6, fontSize: 9, fontColor: '#714B67', content: '✓ QUALITY SUMMARY' },
                    { name: 'quality_bg', type: 'rectangle', position: { x: 110, y: 82 }, width: 85, height: 40, borderColor: '#e2e8f0', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'good_label', type: 'text', position: { x: 115, y: 86 }, width: 30, height: 4, fontSize: 7, fontColor: '#64748b', content: 'GOOD (PASS)' },
                    { name: 'good_value', type: 'text', position: { x: 115, y: 91 }, width: 35, height: 8, fontSize: 18, fontColor: '#16a34a' },
                    { name: 'reject_label', type: 'text', position: { x: 115, y: 102 }, width: 30, height: 4, fontSize: 7, fontColor: '#64748b', content: 'REJECT' },
                    { name: 'reject_value', type: 'text', position: { x: 115, y: 107 }, width: 35, height: 8, fontSize: 18, fontColor: '#dc2626' },
                    { name: 'fpy_label', type: 'text', position: { x: 155, y: 86 }, width: 35, height: 4, fontSize: 7, fontColor: '#64748b', content: 'FIRST PASS YIELD' },
                    { name: 'fpy_value', type: 'text', position: { x: 155, y: 91 }, width: 35, height: 8, fontSize: 18, fontColor: '#16a34a' },

                    // ── OEE METRICS ──
                    { name: 'section3_title', type: 'text', position: { x: 15, y: 128 }, width: 180, height: 6, fontSize: 9, fontColor: '#714B67', content: '📊 OEE METRICS' },
                    { name: 'oee_bg', type: 'rectangle', position: { x: 15, y: 136 }, width: 180, height: 28, borderColor: '#e2e8f0', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'avail_label', type: 'text', position: { x: 20, y: 140 }, width: 35, height: 4, fontSize: 7, fontColor: '#64748b', content: 'AVAILABILITY' },
                    { name: 'avail_value', type: 'text', position: { x: 20, y: 146 }, width: 35, height: 8, fontSize: 16, fontColor: '#2563eb' },
                    { name: 'perf_label', type: 'text', position: { x: 62, y: 140 }, width: 35, height: 4, fontSize: 7, fontColor: '#64748b', content: 'PERFORMANCE' },
                    { name: 'perf_value', type: 'text', position: { x: 62, y: 146 }, width: 35, height: 8, fontSize: 16, fontColor: '#2563eb' },
                    { name: 'qual_label', type: 'text', position: { x: 104, y: 140 }, width: 35, height: 4, fontSize: 7, fontColor: '#64748b', content: 'QUALITY' },
                    { name: 'qual_value', type: 'text', position: { x: 104, y: 146 }, width: 35, height: 8, fontSize: 16, fontColor: '#2563eb' },
                    { name: 'oee_label', type: 'text', position: { x: 146, y: 140 }, width: 30, height: 4, fontSize: 7, fontColor: '#64748b', content: 'OEE' },
                    { name: 'oee_value', type: 'text', position: { x: 146, y: 146 }, width: 44, height: 12, fontSize: 24, fontColor: '#714B67' },

                    // ── DOWNTIME TABLE ──
                    { name: 'section4_title', type: 'text', position: { x: 15, y: 170 }, width: 85, height: 6, fontSize: 9, fontColor: '#714B67', content: '⏱️ DOWNTIME LOG' },
                    {
                        name: 'downtime_table',
                        type: 'table',
                        position: { x: 15, y: 178 },
                        width: 180,
                        height: 30,
                        showHead: true,
                        head: ['#', 'Station', 'Start Time', 'End Time', 'Duration', 'Reason'],
                        headWidthPercentages: [5, 20, 15, 15, 15, 30],
                        tableStyles: { borderColor: '#714B67', borderWidth: 0.3 },
                        headStyles: { ...STD_HEAD_STYLES },
                        bodyStyles: { ...STD_BODY_STYLES },
                        columnStyles: {}
                    },

                    // ── DEFECTS TABLE ──
                    { name: 'section5_title', type: 'text', position: { x: 15, y: 213 }, width: 85, height: 6, fontSize: 9, fontColor: '#714B67', content: '⚠️ DEFECTS & ISSUES' },
                    {
                        name: 'defects_table',
                        type: 'table',
                        position: { x: 15, y: 221 },
                        width: 180,
                        height: 24,
                        showHead: true,
                        head: ['#', 'Type', 'Severity', 'Location', 'Status'],
                        headWidthPercentages: [5, 30, 15, 25, 25],
                        tableStyles: { borderColor: '#714B67', borderWidth: 0.3 },
                        headStyles: { ...STD_HEAD_STYLES },
                        bodyStyles: { ...STD_BODY_STYLES },
                        columnStyles: {}
                    },

                    // ── NOTES ──
                    { name: 'section6_title', type: 'text', position: { x: 15, y: 250 }, width: 85, height: 6, fontSize: 9, fontColor: '#714B67', content: '📝 HANDOFF NOTES' },
                    { name: 'notes_bg', type: 'rectangle', position: { x: 15, y: 258 }, width: 120, height: 25, borderColor: '#e2e8f0', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'notes_value', type: 'text', position: { x: 18, y: 261 }, width: 115, height: 20, fontSize: 8, fontColor: '#374151' },

                    // ── SIGNATURES ──
                    { name: 'sign_box', type: 'rectangle', position: { x: 140, y: 258 }, width: 55, height: 25, borderColor: '#dee2e6', borderWidth: 0.5, color: '#faf5f9' },
                    { name: 'sign_lbl', type: 'text', position: { x: 143, y: 260 }, width: 49, height: 4, fontSize: 7, fontColor: '#714B67', content: 'OUTGOING OPERATOR' },
                    { name: 'sign_out', type: 'text', position: { x: 143, y: 278 }, width: 49, height: 4, fontSize: 7, fontColor: '#94a3b8', content: 'Date: ________________' },
                    { name: 'sign_box2', type: 'rectangle', position: { x: 140, y: 285 }, width: 55, height: 8, borderColor: '#dee2e6', borderWidth: 0.5, color: '#faf5f9' },
                    { name: 'sign_lbl2', type: 'text', position: { x: 143, y: 286 }, width: 49, height: 4, fontSize: 7, fontColor: '#714B67', content: 'INCOMING OPERATOR' },

                    // ── FOOTER ──
                    { name: 'footer_line', type: 'line', position: { x: 15, y: 295 }, width: 180, height: 0.3, color: '#714B67' },
                    { name: 'footer_text', type: 'text', position: { x: 15, y: 296 }, width: 120, height: 4, fontSize: 6, fontColor: '#94a3b8', content: 'Generated by MANDOR MES • Shift Handoff System' },
                    { name: 'footer_timestamp', type: 'text', position: { x: 150, y: 296 }, width: 45, height: 4, fontSize: 6, fontColor: '#94a3b8' }
                ]
            ]
        },
        sampleInputs: [
            {
                report_qr: 'https://mandor-core.online/shift-handoff',
                doc_id: 'SHR-2026-0823-M01',
                shift_value: 'Morning Shift',
                date_value: '2026-08-23',
                time_value: '06:00 - 14:00',
                operator_value: 'Budi Santoso',
                target_value: '400 units',
                actual_value: '385 units',
                completion_value: '96.3%',
                good_value: '380 units',
                reject_value: '5 units',
                fpy_value: '98.7%',
                avail_value: '92.5%',
                perf_value: '88.3%',
                qual_value: '98.7%',
                oee_value: '80.8%',
                notes_value: 'All targets achieved. Minor station 3 downtime (15 min). Materials replenished. Station 2 preventive maintenance scheduled for next shift.',
                footer_timestamp: 'Generated: 2026-08-23 13:55',
                downtime_table: JSON.stringify([
                    ['1', 'Station 3 - CNC Lathe', '08:30', '08:45', '15 min', 'Tool change required'],
                    ['2', 'Station 1 - Assembly', '10:15', '10:22', '7 min', 'Material jam'],
                    ['3', 'Station 2 - QC', '12:00', '12:05', '5 min', 'Calibration check']
                ]),
                defects_table: JSON.stringify([
                    ['1', 'Surface scratch', 'MINOR', 'Station 3', 'OPEN'],
                    ['2', 'Dimensional out of tolerance', 'MAJOR', 'Station 2', 'RESOLVED'],
                    ['3', 'Missing component', 'MINOR', 'Station 1', 'OPEN']
                ])
            }
        ]
    },
    // ─────────────────────────────────────────────────────────────────────
    // QC INSPECTION CHECKSHEET REPORT (Integrated with Drawing/Inspector Designer)
    // ─────────────────────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────────────────
    // QC INSPECTION CHECKSHEET REPORT (Integrated with Drawing/Inspector Designer)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'qc-inspection-checksheet-a4',
        name: 'QC Inspection Checksheet (A4)',
        category: 'Quality Control',
        paperPresetId: 'A4',
        description: 'Laporan inspeksi QC ISO 9001 terintegrasi penuh dengan Drawing & Inspector Designer — memuat Document Control, Header Part, GD&T Matrix, Hasil Ukur, Status, dan Digital Signature.',
        template: {
            basePdf: { width: 210, height: 297, padding: [10, 10, 10, 10] },
            schemas: [
                [
                    // ── HEADER & ISO 9001 DOCUMENT CONTROL ──
                    { name: 'header_bg', type: 'rectangle', position: { x: 15, y: 10 }, width: 180, height: 24, color: '#4c1d95', borderWidth: 0 },
                    { name: 'report_title', type: 'text', position: { x: 20, y: 14 }, width: 110, height: 7, fontSize: 13, fontColor: '#ffffff', content: 'QC INSPECTION CHECKSHEET' },
                    { name: 'company_subtitle', type: 'text', position: { x: 20, y: 22 }, width: 115, height: 4, fontSize: 6.5, fontColor: '#ddd6fe', content: 'MANDOR MES — ISO 9001:2015 / IATF 16949 Quality Assurance' },
                    { name: 'report_qr', type: 'qrcode', position: { x: 172, y: 12 }, width: 20, height: 20 },
                    { name: 'doc_id', type: 'text', position: { x: 142, y: 13 }, width: 28, height: 4, fontSize: 6, fontColor: '#f5d0fe', content: 'ISO 9001 CONTROL' },
                    { name: 'doc_control_val', type: 'text', position: { x: 140, y: 18 }, width: 30, height: 7, fontSize: 5.5, fontColor: '#ffffff', content: 'Doc: QA-CS-2026\nRev: 2.1 | Std: ISO' },

                    // ── MASTER DATA & PART ATTRIBUTES GRID ──
                    { name: 'info_border', type: 'rectangle', position: { x: 15, y: 36 }, width: 180, height: 42, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#f8fafc' },
                    
                    // Row 1: WO, Part No, Part Name
                    { name: 'wo_label', type: 'text', position: { x: 18, y: 39 }, width: 40, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'WORK ORDER NO' },
                    { name: 'wo_value', type: 'text', position: { x: 18, y: 43 }, width: 50, height: 5, fontSize: 9.5, fontColor: '#0f172a' },
                    { name: 'part_no_label', type: 'text', position: { x: 74, y: 39 }, width: 40, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PART NUMBER' },
                    { name: 'part_no_value', type: 'text', position: { x: 74, y: 43 }, width: 55, height: 5, fontSize: 9.5, fontColor: '#0f172a' },
                    { name: 'part_name_label', type: 'text', position: { x: 134, y: 39 }, width: 40, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PART NAME / DESC' },
                    { name: 'part_name_value', type: 'text', position: { x: 134, y: 43 }, width: 58, height: 5, fontSize: 9, fontColor: '#0f172a' },

                    // Row 2: Customer, Process, Station
                    { name: 'customer_label', type: 'text', position: { x: 18, y: 50 }, width: 40, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'CUSTOMER' },
                    { name: 'customer_value', type: 'text', position: { x: 18, y: 54 }, width: 50, height: 5, fontSize: 8.5, fontColor: '#334155' },
                    { name: 'process_label', type: 'text', position: { x: 74, y: 50 }, width: 40, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PROCESS / OPERATION' },
                    { name: 'process_value', type: 'text', position: { x: 74, y: 54 }, width: 55, height: 5, fontSize: 8.5, fontColor: '#334155' },
                    { name: 'station_label', type: 'text', position: { x: 134, y: 50 }, width: 40, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'STATION ID' },
                    { name: 'station_value', type: 'text', position: { x: 134, y: 54 }, width: 58, height: 5, fontSize: 8.5, fontColor: '#334155' },

                    // Row 3: Inspector, Approver, Date Time, Status
                    { name: 'inspector_label', type: 'text', position: { x: 18, y: 61 }, width: 35, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'INSPECTOR' },
                    { name: 'inspector_value', type: 'text', position: { x: 18, y: 65 }, width: 35, height: 5, fontSize: 8, fontColor: '#0f172a' },
                    { name: 'approver_label', type: 'text', position: { x: 58, y: 61 }, width: 35, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'QC APPROVER' },
                    { name: 'approver_value', type: 'text', position: { x: 58, y: 65 }, width: 35, height: 5, fontSize: 8, fontColor: '#0f172a' },
                    { name: 'date_time_label', type: 'text', position: { x: 98, y: 61 }, width: 45, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'DATE & TIME (WAKTU)' },
                    { name: 'date_time_value', type: 'text', position: { x: 98, y: 65 }, width: 45, height: 5, fontSize: 7.5, fontColor: '#0f172a' },
                    { name: 'status_label', type: 'text', position: { x: 148, y: 61 }, width: 35, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'OVERALL RESULT' },
                    { name: 'status_value', type: 'text', position: { x: 148, y: 65 }, width: 44, height: 6, fontSize: 9.5, fontColor: '#16a34a' },

                    // ── SUMMARY STATS BAR ──
                    { name: 'summary_bg', type: 'rectangle', position: { x: 15, y: 80 }, width: 180, height: 18, borderColor: '#8b5cf6', borderWidth: 0.5, color: '#f5f3ff' },
                    { name: 'total_label', type: 'text', position: { x: 18, y: 82 }, width: 22, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'TOTAL CHECKS' },
                    { name: 'total_value', type: 'text', position: { x: 18, y: 86 }, width: 20, height: 8, fontSize: 13, fontColor: '#1f2937' },
                    { name: 'passed_label', type: 'text', position: { x: 46, y: 82 }, width: 22, height: 3, fontSize: 5.5, fontColor: '#16a34a', content: 'PASSED (OK)' },
                    { name: 'passed_value', type: 'text', position: { x: 46, y: 86 }, width: 20, height: 8, fontSize: 13, fontColor: '#16a34a' },
                    { name: 'failed_label', type: 'text', position: { x: 74, y: 82 }, width: 22, height: 3, fontSize: 5.5, fontColor: '#dc2626', content: 'FAILED (NG)' },
                    { name: 'failed_value', type: 'text', position: { x: 74, y: 86 }, width: 20, height: 8, fontSize: 13, fontColor: '#dc2626' },
                    { name: 'pending_label', type: 'text', position: { x: 102, y: 82 }, width: 22, height: 3, fontSize: 5.5, fontColor: '#d97706', content: 'PENDING' },
                    { name: 'pending_value', type: 'text', position: { x: 102, y: 86 }, width: 20, height: 8, fontSize: 13, fontColor: '#d97706' },
                    { name: 'cpk_label', type: 'text', position: { x: 130, y: 82 }, width: 22, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'CPK INDEX' },
                    { name: 'cpk_value', type: 'text', position: { x: 130, y: 86 }, width: 22, height: 8, fontSize: 12, fontColor: '#4338ca' },
                    { name: 'rate_label', type: 'text', position: { x: 158, y: 82 }, width: 30, height: 3, fontSize: 5.5, fontColor: '#4c1d95', content: 'PASS RATE' },
                    { name: 'rate_value', type: 'text', position: { x: 158, y: 86 }, width: 34, height: 8, fontSize: 14, fontColor: '#4c1d95' },

                    // ── INSPECTION RESULTS TABLE ──
                    { name: 'table_title', type: 'text', position: { x: 15, y: 101 }, width: 180, height: 4, fontSize: 7.5, fontColor: '#4c1d95', content: '📐 PARAMETER & GD&T DIMENSIONAL INSPECTION MATRIX' },
                    {
                        name: 'inspection_table',
                        type: 'table',
                        position: { x: 15, y: 107 },
                        width: 180,
                        height: 112,
                        showHead: true,
                        head: ['#', 'Parameter / Dimension Title', 'Category', 'Nominal', 'Tolerance', 'Measured', 'Criticality', 'Status'],
                        headWidthPercentages: [5, 27, 14, 12, 14, 12, 10, 6],
                        tableStyles: { borderColor: '#4c1d95', borderWidth: 0.3 },
                        headStyles: { ...STD_HEAD_STYLES, backgroundColor: '#4c1d95', fontSize: 7.5, padding: { top: 2.5, right: 2, bottom: 2.5, left: 2 } },
                        bodyStyles: { ...STD_BODY_STYLES, fontSize: 7, padding: { top: 2.5, right: 2, bottom: 2.5, left: 2 } },
                        columnStyles: {}
                    },

                    // ── NOTES & SIGNATURES ──
                    { name: 'notes_title', type: 'text', position: { x: 15, y: 224 }, width: 60, height: 4, fontSize: 7, fontColor: '#4c1d95', content: '📝 QC INSPECTION NOTES' },
                    { name: 'notes_bg', type: 'rectangle', position: { x: 15, y: 229 }, width: 110, height: 28, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'notes_value', type: 'text', position: { x: 18, y: 232 }, width: 104, height: 23, fontSize: 7.5, fontColor: '#334155' },

                    // Signatures
                    { name: 'sign_box', type: 'rectangle', position: { x: 130, y: 229 }, width: 65, height: 13, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#f8fafc' },
                    { name: 'sign_lbl1', type: 'text', position: { x: 133, y: 231 }, width: 59, height: 3, fontSize: 5.5, fontColor: '#4c1d95', content: 'QC INSPECTOR (OPERATOR)' },
                    { name: 'sign_line1', type: 'text', position: { x: 133, y: 238 }, width: 59, height: 3, fontSize: 5.5, fontColor: '#94a3b8', content: 'Sign & Date: ________________' },
                    { name: 'sign_box2', type: 'rectangle', position: { x: 130, y: 244 }, width: 65, height: 13, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#f8fafc' },
                    { name: 'sign_lbl2', type: 'text', position: { x: 133, y: 246 }, width: 59, height: 3, fontSize: 5.5, fontColor: '#4c1d95', content: 'QC SUPERVISOR / APPROVER' },
                    { name: 'sign_line2', type: 'text', position: { x: 133, y: 253 }, width: 59, height: 3, fontSize: 5.5, fontColor: '#94a3b8', content: 'Sign & Stamp: _______________' },

                    // ── FOOTER ──
                    { name: 'footer_line', type: 'line', position: { x: 15, y: 261 }, width: 180, height: 0.3, color: '#4c1d95' },
                    { name: 'footer_text', type: 'text', position: { x: 15, y: 263 }, width: 120, height: 3.5, fontSize: 5.5, fontColor: '#64748b', content: 'MANDOR MES • Digital Quality Assurance • Generated from Drawing Inspector Designer' },
                    { name: 'footer_timestamp', type: 'text', position: { x: 140, y: 263 }, width: 55, height: 3.5, fontSize: 5.5, fontColor: '#64748b' }
                ]
            ]
        },
        sampleInputs: [
            {
                report_qr: 'https://mandor-core.online/inspection/WO-2026-CAST-042',
                doc_id: 'ISO 9001:2015',
                doc_control_val: 'Doc: QA-CS-2026\nRev: 2.1 | Std: ISO 9001',
                wo_value: 'WO-2026-CAST-042',
                part_no_value: 'PRT-FLG-450X',
                part_name_value: 'Precision Hydraulic Flange Housing',
                customer_value: 'AeroTech Dynamics Ltd.',
                process_value: 'CNC Turning & Milling Line 2',
                station_value: 'ST-QC-04',
                inspector_value: 'Budi Santoso',
                approver_value: 'Ahmad Setiawan (QA Lead)',
                date_time_value: '2026-08-23 14:30:00 WIB',
                status_value: 'APPROVED (PASS)',
                total_value: '10',
                passed_value: '10',
                failed_value: '0',
                pending_value: '0',
                cpk_value: '1.67',
                rate_value: '100%',
                notes_value: 'Semua dimensi kritis (CC) dan GD&T berada dalam rentang batas toleransi ISO 9001. Hasil visual dan surface roughness memenuhi standar IATF 16949.',
                footer_timestamp: 'Generated: 2026-08-23 21:35 WIB',
                inspection_table: JSON.stringify([
                    ['1', 'Internal Bore Diameter', 'Linear Dimension', '25.000 mm', '24.900 - 25.100', '24.980 mm', 'Critical (CC)', 'OK'],
                    ['2', 'Outer Flange Diameter', 'Linear Dimension', '45.000 mm', '44.950 - 45.100', '45.020 mm', 'Major', 'OK'],
                    ['3', 'Seal Face Flatness', 'Flatness (GD&T)', '0.020 mm', 'Max 0.030', '0.018 mm', 'Major', 'OK'],
                    ['4', 'Bolt Hole PCD', 'Position (GD&T)', '65.000 mm', '64.950 - 65.100', '65.000 mm', 'Minor', 'OK'],
                    ['5', 'Perpendicularity Datum A', 'Perpendicularity', '0.015 mm', 'Max 0.025', '0.012 mm', 'Critical (CC)', 'OK'],
                    ['6', 'Counter Bore Depth', 'Depth', '12.000 mm', '11.900 - 12.100', '12.040 mm', 'Minor', 'OK'],
                    ['7', 'Surface Roughness Ra', 'Surface Finish', '1.600 μm', 'Max 3.200', '1.420 μm', 'Major', 'OK'],
                    ['8', 'Keyway Width', 'Slot Dimension', '10.000 mm', '9.970 - 10.060', '10.020 mm', 'Major', 'OK'],
                    ['9', 'Keyway Depth', 'Depth', '5.000 mm', '4.950 - 5.100', '5.030 mm', 'Major', 'OK'],
                    ['10', 'Pilot Bore Diameter', 'Diameter', '20.000 mm', '19.980 - 20.050', '20.010 mm', 'Critical (CC)', 'OK']
                ])
            }
        ]
    }
];

export default function ReportDesigner() {
    // Merge saved templates with DEFAULT_TEMPLATES to ensure new templates are added
    const getMergedTemplates = () => {
        const saved = localStorage.getItem('mandor_pdf_templates_v6');
        let savedTemplates = [];
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    savedTemplates = parsed;
                }
            } catch (e) { /* ignore */ }
        }

        // Add any missing DEFAULT_TEMPLATES or update existing built-ins
        const updatedList = DEFAULT_TEMPLATES.map(dt => {
            const existing = savedTemplates.find(st => st.id === dt.id);
            // If it's a default template, make sure it has latest schema
            return dt;
        });

        // Add user custom templates (not in DEFAULT_TEMPLATES) at the top so newest ones are immediately visible
        const customTemplates = savedTemplates.filter(st => !DEFAULT_TEMPLATES.some(dt => dt.id === st.id));
        const finalMerged = [...customTemplates, ...updatedList];
        localStorage.setItem('mandor_pdf_templates_v6', JSON.stringify(finalMerged));
        return finalMerged;
    };

    const initialMergedTemplates = getMergedTemplates();
    const activeStoredId = localStorage.getItem('mandor_active_report_template_id');
    const initialSelectedId = (activeStoredId && initialMergedTemplates.some(t => t.id === activeStoredId))
        ? activeStoredId
        : (initialMergedTemplates[0]?.id || DEFAULT_TEMPLATES[0].id);

    const [templates, setTemplates] = useState(initialMergedTemplates);
    const [selectedTemplateId, setSelectedTemplateId] = useState(initialSelectedId);
    const [activeTab, setActiveTab] = useState('designer'); // 'designer' | 'preview' | 'datasource'
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

    // Modal state
    const [showNewModal, setShowNewModal] = useState(false);
    const [showPageSettingsModal, setShowPageSettingsModal] = useState(false);

    // ── DATA SOURCE & QUERY STATE ──
    const [dbTables, setDbTables] = useState([]);
    const [selectedSourceType, setSelectedSourceType] = useState('app_table'); // 'app_table' | 'supabase_table' | 'csv' | 'sample'
    const [selectedAppTableId, setSelectedAppTableId] = useState('');
    const [customTableName, setCustomTableName] = useState('measurements');
    const [customFilterQuery, setCustomFilterQuery] = useState('');
    const [checksheetSearch, setCheckSheetSearch] = useState('');
    const [customLimit, setCustomLimit] = useState(50);
    const [csvInputText, setCsvInputText] = useState('');

    // Loaded Data Records from Database/Query
    const [loadedRecords, setLoadedRecords] = useState([]);
    const [availableColumns, setAvailableColumns] = useState([]);
    const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [batchMode, setBatchMode] = useState(false); // If true, generates multi-page PDF for all rows

    // Forms
    const [newForm, setNewForm] = useState({
        name: '',
        category: 'Quality Control',
        presetId: 'A4',
        customWidth: 210,
        customHeight: 297,
        orientation: 'portrait',
        padding: 5
    });

    const [pageEditForm, setPageEditForm] = useState({
        presetId: 'A4',
        width: 210,
        height: 297,
        paddingTop: 10,
        paddingRight: 10,
        paddingBottom: 10,
        paddingLeft: 10
    });

    const currentTemplateObj = templates.find(t => t.id === selectedTemplateId) || templates[0] || DEFAULT_TEMPLATES[0];
    const [templateSchema, setTemplateSchema] = useState(currentTemplateObj.template);
    const [sampleInputData, setSampleInputData] = useState(currentTemplateObj.sampleInputs || [{}]);

    const designerRef = useRef(null);
    const designerInstance = useRef(null);

    // Check for active template id on mount
    useEffect(() => {
        const activeId = localStorage.getItem('mandor_active_report_template_id');
        if (activeId && templates.some(t => t.id === activeId) && selectedTemplateId !== activeId) {
            setSelectedTemplateId(activeId);
        }
    }, []);

    // Save templates to localStorage
    useEffect(() => {
        localStorage.setItem('mandor_pdf_templates_v6', JSON.stringify(templates));
    }, [templates]);

    // When switching template, update schema and sample data
    useEffect(() => {
        const t = templates.find(item => item.id === selectedTemplateId);
        if (t) {
            setTemplateSchema(t.template);
            setSampleInputData(t.sampleInputs || [{}]);

            const base = t.template.basePdf || { width: 210, height: 297, padding: [10, 10, 10, 10] };
            const pad = Array.isArray(base.padding) ? base.padding : [5, 5, 5, 5];
            setPageEditForm({
                presetId: t.paperPresetId || 'CUSTOM',
                width: base.width || 210,
                height: base.height || 297,
                paddingTop: pad[0] ?? 5,
                paddingRight: pad[1] ?? 5,
                paddingBottom: pad[2] ?? 5,
                paddingLeft: pad[3] ?? 5
            });
        }
    }, [selectedTemplateId]);

    // Initialize pdfme Designer
    useEffect(() => {
        if (activeTab !== 'designer' || !designerRef.current) return;

        if (designerInstance.current) {
            try { designerInstance.current.destroy(); } catch (e) { /* ignore */ }
            designerInstance.current = null;
        }

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
    }, [activeTab, selectedTemplateId, templateSchema.basePdf?.width, templateSchema.basePdf?.height]);

    // Auto-generate preview when switching to preview tab or template
    useEffect(() => {
        if (activeTab === 'preview' && !isGeneratingPdf) {
            handleGeneratePdf('preview');
        }
    }, [activeTab, selectedTemplateId]);

    // ── QUERY & FETCH DATA FROM SELECTED SOURCE ──
    const handleFetchDataSource = async () => {
        setIsLoadingData(true);
        try {
            let records = [];
            let cols = [];

            if (selectedSourceType === 'app_table') {
                if (!selectedAppTableId) {
                    toast.error('Pilih interactive table terlebih dahulu.');
                    setIsLoadingData(false);
                    return;
                }
                const rawRows = await getTableRecords(selectedAppTableId);
                const targetTable = dbTables.find(t => t.id === selectedAppTableId);
                if (targetTable?.fields) {
                    cols = targetTable.fields.map(f => f.name || f.label || f.id);
                }
                records = rawRows || [];
            } else if (selectedSourceType === 'supabase_table') {
                const supabase = getSupabaseClient();
                let query = supabase.from(customTableName.trim()).select('*').limit(Number(customLimit) || 50);

                if (customFilterQuery) {
                    // example: status=eq.PASS or simple column:value
                    const parts = customFilterQuery.split(':');
                    if (parts.length === 2) {
                        query = query.eq(parts[0].trim(), parts[1].trim());
                    }
                }

                const { data, error } = await query;
                if (error) throw error;
                records = data || [];
            } else if (selectedSourceType === 'csv') {
                // Parse CSV Text
                if (!csvInputText.trim()) {
                    toast.error('Masukkan data CSV atau upload file.');
                    setIsLoadingData(false);
                    return;
                }
                const lines = csvInputText.trim().split('\n');
                if (lines.length > 0) {
                    cols = lines[0].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                    records = lines.slice(1).map(line => {
                        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                        const obj = {};
                        cols.forEach((col, idx) => { obj[col] = vals[idx] || ''; });
                        return obj;
                    });
                }
            } else if (selectedSourceType === 'checksheet') {
                // Fetch from drawing checksheet logs / inspector designer templates
                const rawChecksheets = JSON.parse(localStorage.getItem('mandor_qa_checksheets') || '[]');
                const savedTemplates = JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');

                // ── Apply search filter ──
                const filterChecksheet = (records) => {
                    if (!checksheetSearch) return records;
                    const q = checksheetSearch.toLowerCase();
                    return records.filter(cs =>
                        (cs.workOrderNo || '').toLowerCase().includes(q) ||
                        (cs.partSerial || cs.partNo || '').toLowerCase().includes(q) ||
                        (cs.partName || '').toLowerCase().includes(q) ||
                        (cs.inspectorName || '').toLowerCase().includes(q) ||
                        (cs.customer || '').toLowerCase().includes(q) ||
                        (cs.docNo || '').toLowerCase().includes(q)
                    );
                };

                const filteredChecksheets = filterChecksheet(rawChecksheets);
                let combined = [];

                if (filteredChecksheets.length > 0) {
                    filteredChecksheets.forEach((cs) => {
                        const pts = cs.details || cs.checkPoints || [];
                        const rows = pts.map((p, idx) => [
                            String(p.pointNumber || idx + 1),
                            p.title || `Point #${idx + 1}`,
                            p.category || 'Linear Dimension',
                            `${p.nominal || '0'} ${p.unit || 'mm'}`,
                            `±${p.tolMin || '0.1'} - ${p.tolMax || '0.1'}`,
                            p.measuredValue !== undefined && p.measuredValue !== '' ? `${p.measuredValue} ${p.unit || 'mm'}` : '-',
                            p.criticality || 'Major',
                            p.status || 'OK'
                        ]);

                        combined.push({
                            report_qr: `https://mandor-core.online/inspection/${cs.workOrderNo || 'WO-LIVE'}`,
                            doc_id: 'ISO 9001:2015',
                            doc_control_val: `Doc: ${cs.docNo || 'QA-CS-2026'}\nRev: ${cs.revNo || '2.1'} | Std: ISO 9001`,
                            wo_value: cs.workOrderNo || 'WO-2026-0819',
                            part_no_value: cs.partSerial || cs.partNo || 'PRT-FLG-450X',
                            part_name_value: cs.partName || 'Precision Part',
                            customer_value: cs.customer || 'General Customer',
                            process_value: cs.process || 'Final Inspection',
                            station_value: cs.stationId || 'ST-QC-01',
                            inspector_value: cs.inspectorName || 'Inspector QA',
                            approver_value: cs.approver || 'QC Lead',
                            date_time_value: cs.timestamp || new Date().toLocaleString(),
                            status_value: cs.overallStatus || 'APPROVED (PASS)',
                            total_value: String(pts.length || cs.totalPoints || 0),
                            passed_value: String(cs.passedPoints || pts.filter(p => p.status === 'OK' || p.status === 'PASSED').length),
                            failed_value: String(cs.failedPoints || pts.filter(p => p.status === 'NG' || p.status === 'FAILED').length),
                            pending_value: String(pts.filter(p => !p.status || p.status === 'PENDING').length),
                            cpk_value: String(cs.cpkEstimate || '1.67'),
                            rate_value: cs.passRate || '100%',
                            notes_value: cs.notes || 'Pemeriksaan checksheet dimensi ISO 9001 drawing inspeksi selesai dan terverifikasi.',
                            footer_timestamp: `Generated: ${new Date().toLocaleString()}`,
                            inspection_table: JSON.stringify(rows)
                        });
                    });
                }

                if (savedTemplates.length > 0) {
                    savedTemplates.forEach((tpl) => {
                        const pts = tpl.checkPoints || [];
                        const rows = pts.map((p, idx) => [
                            String(p.pointNumber || idx + 1),
                            p.title || `Point #${idx + 1}`,
                            p.category || 'Dimension',
                            `${p.nominal || '0'} ${p.unit || 'mm'}`,
                            `±${p.tolMin || '0.1'} - ${p.tolMax || '0.1'}`,
                            p.nominal ? `${p.nominal} ${p.unit || 'mm'}` : '-',
                            p.criticality || 'Major',
                            'OK'
                        ]);

                        combined.push({
                            report_qr: `https://mandor-core.online/inspection/${tpl.partNo || 'TEMPLATE'}`,
                            doc_id: 'ISO 9001:2015',
                            doc_control_val: `Doc: ${tpl.docNo || 'QA-CS-2026'}\nRev: ${tpl.revisionNo || '1.0'} | Std: ISO 9001`,
                            wo_value: tpl.woPrefix ? `${tpl.woPrefix}-001` : 'WO-TEMPLATE-001',
                            part_no_value: tpl.partNo || 'PRT-TEMPLATE',
                            part_name_value: tpl.partName || tpl.name || 'Checksheet Template',
                            customer_value: tpl.customer || 'General Customer',
                            process_value: tpl.process || 'Machining',
                            station_value: tpl.stationId || 'ST-QC-01',
                            inspector_value: tpl.inspectorName || 'Operator QC',
                            approver_value: tpl.approverName || 'QC Lead',
                            date_time_value: new Date().toLocaleString(),
                            status_value: 'TEMPLATE (READY)',
                            total_value: String(pts.length),
                            passed_value: String(pts.length),
                            failed_value: '0',
                            pending_value: '0',
                            cpk_value: '1.67',
                            rate_value: '100%',
                            notes_value: `Template Checksheet: ${tpl.name || 'Drawing Inspection'}. Parameter & GD&T bounds loaded.`,
                            footer_timestamp: `Generated: ${new Date().toLocaleString()}`,
                            inspection_table: JSON.stringify(rows)
                        });
                    });
                }

                // Also fetch NCRs from mandor_checksheet_ncrs
                const rawNCRs = JSON.parse(localStorage.getItem('mandor_checksheet_ncrs') || '[]');
                if (rawNCRs.length > 0) {
                    rawNCRs.forEach(ncr => {
                        const tableRows = (ncr.ngPoints || [ncr]).map((p, idx) => [
                            String(idx + 1),
                            p.title || `#${p.pointNumber} Parameter`,
                            p.nominal || '-',
                            p.tolerance || '-',
                            p.measuredVal || 'NG',
                            p.delta || '-',
                            'NG'
                        ]);
                        combined.push({
                            report_qr: `NCR_${ncr.ncrNumber}_${ncr.workOrderNo}`,
                            ncr_no_val: ncr.ncrNumber,
                            wo_val: ncr.workOrderNo,
                            part_name_val: ncr.partName || 'Precision Housing Component',
                            serial_val: ncr.partSerial || '-',
                            station_val: ncr.stationId || 'ST-CNC-01',
                            inspector_val: ncr.inspector || 'QC Inspector',
                            date_val: new Date(ncr.createdAt || Date.now()).toLocaleDateString('id-ID'),
                            standard_val: 'ISO 9001:2015 (8.7)',
                            defect_val: ncr.defectType,
                            disposition_val: ncr.disposition,
                            quarantine_val: ncr.quarantineBin,
                            hold_val: '⛔ QUARANTINED (HOLD)',
                            rca_val: ncr.rootCause || 'Penyimpangan toleransi pada proses permesinan CNC.',
                            corrective_val: ncr.correctiveAction || `Disposisi: ${ncr.disposition}. Part di ${ncr.quarantineBin}.`,
                            sign_val1: `✓ ${ncr.inspector || 'admin'}`,
                            sign_val2: '✓ Ahmad S., ST (QA Eng)',
                            sign_val3: '✓ Hendra Wijaya, ST (QA Mgr)',
                            sign_val4: '✓ Budi Santoso (Line Lead)',
                            ncr_table: JSON.stringify(tableRows)
                        });
                    });
                }

                if (combined.length === 0) {
                    records = currentTemplateObj.sampleInputs || [{}];
                } else {
                    records = combined;
                }
            } else if (selectedSourceType === 'sample') {
                records = currentTemplateObj.sampleInputs || [{}];
            }

            // Detect Columns from first record if not already defined
            if (cols.length === 0 && records.length > 0) {
                cols = Object.keys(records[0]);
            }

            setLoadedRecords(records);
            setAvailableColumns(cols);
            setSelectedRecordIndex(0);

            if (records.length > 0) {
                toast.success(`✅ Berhasil mengambil ${records.length} data baris!`);
            } else {
                toast.warn('Data kosong / tidak ditemukan baris yang cocok.');
            }
        } catch (err) {
            console.error('Error fetching data source:', err);
            toast.error('Gagal mengambil data: ' + err.message);
        } finally {
            setIsLoadingData(false);
        }
    };

    // Apply active record(s) to sample inputs and switch to Designer/Preview
    const handleApplyLoadedDataToTemplate = (targetMode = 'single') => {
        if (loadedRecords.length === 0) {
            toast.error('Belum ada data yang dimuat. Klik "Jalankan Query" terlebih dahulu.');
            return;
        }

        if (targetMode === 'batch') {
            // Apply all rows (Multi-page PDF batch)
            setSampleInputData(loadedRecords);
            setBatchMode(true);
            toast.success(`Mode Cetak Massal (${loadedRecords.length} Halaman) diaktifkan!`);
        } else {
            // Apply single selected row
            const activeRow = loadedRecords[selectedRecordIndex] || loadedRecords[0];
            setSampleInputData([activeRow]);
            setBatchMode(false);
            toast.success(`Data baris #${selectedRecordIndex + 1} diterapkan ke kanvas!`);
        }
    };

    // CSV File Reader
    const handleCsvFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            setCsvInputText(text);
            setSelectedSourceType('csv');
            toast.success(`File CSV "${file.name}" berhasil dibaca!`);
        };
        reader.readAsText(file);
    };

    // Generate PDF Preview / Download / Print
    const handleGeneratePdf = async (action = 'preview') => {
        setIsGeneratingPdf(true);
        if (action === 'preview') {
            setActiveTab('preview');
        }
        try {
            // ── Validasi: template schema harus ada ──
            if (!templateSchema || !templateSchema.schemas || !Array.isArray(templateSchema.schemas) || templateSchema.schemas.length === 0) {
                throw new Error('Template schema belum dimuat. Pilih template terlebih dahulu.');
            }
            
            // Text sanitizer for WinAnsi PDF compatibility (strips emojis and special symbols)
            const cleanWinAnsiText = (val) => {
                if (typeof val !== 'string') return val;
                return val
                    .replace(/⛔/g, '[HOLD]')
                    .replace(/🏷️/g, '[TAG]')
                    .replace(/✓/g, '[OK]')
                    .replace(/⚙️/g, '[WIP]')
                    .replace(/📦/g, '[PKG]')
                    .replace(/🏭/g, '[MFG]')
                    .replace(/🔧/g, '[TOOL]')
                    .replace(/⚡/g, '[SYS]')
                    .replace(/🔍/g, '[QC]')
                    .replace(/📋/g, '[DOC]')
                    .replace(/→/g, '->')
                    .replace(/—/g, '-')
                    .replace(/–/g, '-')
                    .replace(/[^\x00-\x7F\xA0-\xFF]/g, '');
            };

            // ── Deep sanitize template schemas ──
            const sanitizedTemplate = JSON.parse(JSON.stringify(templateSchema));
            if (sanitizedTemplate.schemas) {
                sanitizedTemplate.schemas.forEach(page => {
                    if (Array.isArray(page)) {
                        page.forEach(item => {
                            if (item && item.content && typeof item.content === 'string') {
                                item.content = cleanWinAnsiText(item.content);
                            }
                        });
                    }
                });
            }

            // ── Validasi & fallback sample input data ──
            const rawInputs = (sampleInputData && Array.isArray(sampleInputData) && sampleInputData.length > 0)
                ? sampleInputData
                : (currentTemplateObj.sampleInputs || [{}]);

            // ── Transformasi: parse JSON strings & sanitize all text fields ──
            const sanitizeRow = (row) => {
                const clean = {};
                Object.entries(row).forEach(([key, value]) => {
                    if (value === undefined || value === null) {
                        clean[key] = '';
                    } else if (Array.isArray(value)) {
                        clean[key] = value.map(r => Array.isArray(r) ? r.map(c => cleanWinAnsiText(String(c ?? ''))) : cleanWinAnsiText(String(r ?? '')));
                    } else if (typeof value === 'string') {
                        const trimmed = value.trim();
                        try {
                            if ((trimmed.startsWith('[') || trimmed.startsWith('{')) && trimmed.includes('"')) {
                                const parsed = JSON.parse(trimmed);
                                if (Array.isArray(parsed)) {
                                    clean[key] = parsed.map(r => Array.isArray(r) ? r.map(c => cleanWinAnsiText(String(c ?? ''))) : cleanWinAnsiText(String(r ?? '')));
                                } else {
                                    clean[key] = parsed;
                                }
                            } else {
                                clean[key] = cleanWinAnsiText(trimmed);
                            }
                        } catch {
                            clean[key] = cleanWinAnsiText(trimmed);
                        }
                    } else {
                        clean[key] = cleanWinAnsiText(String(value));
                    }
                });
                return clean;
            };

            const sanitizedInputs = rawInputs.map(sanitizeRow);

            const pdfUint8 = await generate({
                template: sanitizedTemplate,
                inputs: sanitizedInputs,
                plugins: PDF_PLUGINS
            });

            const blob = new Blob([pdfUint8.buffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            if (action === 'download') {
                const a = document.createElement('a');
                a.href = url;
                a.download = `${currentTemplateObj.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast.success(`🎉 PDF (${sanitizedInputs.length} Halaman) Berhasil diunduh!`);
            } else if (action === 'print') {
                const printWindow = window.open(url);
                if (printWindow) {
                    printWindow.onload = () => printWindow.print();
                }
            } else {
                setPdfPreviewUrl(url);
                setActiveTab('preview');
                toast.success(`✨ Preview PDF (${sanitizedInputs.length} Halaman) siap!`);
            }
        } catch (err) {
            console.error('PDF Generation Error:', err);
            toast.error('Gagal generate PDF: ' + err.message);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Apply New Template from Modal
    const handleConfirmCreateTemplate = (e) => {
        e.preventDefault();
        const name = newForm.name.trim();
        if (!name) {
            toast.error('Mohon isi nama template.');
            return;
        }

        const preset = getPresetById(newForm.presetId);
        let finalWidth = newForm.presetId === 'CUSTOM' ? Number(newForm.customWidth) : preset.width;
        let finalHeight = newForm.presetId === 'CUSTOM' ? Number(newForm.customHeight) : preset.height;

        if (newForm.orientation === 'landscape' && finalWidth < finalHeight) {
            const tmp = finalWidth;
            finalWidth = finalHeight;
            finalHeight = tmp;
        }

        const pad = Number(newForm.padding) || 5;
        const newId = 'tpl-' + Date.now();

        const newTemplate = {
            id: newId,
            name: name,
            category: newForm.category,
            paperPresetId: newForm.presetId,
            description: `${preset.name} — ${preset.desc}`,
            template: {
                basePdf: { width: finalWidth, height: finalHeight, padding: [pad, pad, pad, pad] },
                schemas: [
                    [
                        {
                            name: 'title',
                            type: 'text',
                            position: { x: Math.min(pad + 2, 10), y: Math.min(pad + 2, 10) },
                            width: Math.max(finalWidth - (pad * 2) - 4, 30),
                            height: Math.min(finalHeight * 0.15, 8),
                            fontSize: Math.min(finalWidth * 0.12, 12),
                            fontColor: '#714B67',
                            content: name.toUpperCase()
                        }
                    ]
                ]
            },
            sampleInputs: [{}]
        };

        setTemplates(prev => [...prev, newTemplate]);
        setSelectedTemplateId(newId);
        setShowNewModal(false);
        toast.success(`Template "${name}" berhasil dibuat!`);
    };

    // Apply Page Size Changes to Current Template
    const handleApplyPageSettings = () => {
        const w = Number(pageEditForm.width) || 100;
        const h = Number(pageEditForm.height) || 100;
        const pad = [
            Number(pageEditForm.paddingTop) || 0,
            Number(pageEditForm.paddingRight) || 0,
            Number(pageEditForm.paddingBottom) || 0,
            Number(pageEditForm.paddingLeft) || 0
        ];

        const updatedBasePdf = { width: w, height: h, padding: pad };
        const updatedTemplate = { ...templateSchema, basePdf: updatedBasePdf };

        setTemplateSchema(updatedTemplate);
        setTemplates(prev => prev.map(t => t.id === selectedTemplateId ? {
            ...t,
            paperPresetId: pageEditForm.presetId,
            template: updatedTemplate
        } : t));

        setShowPageSettingsModal(false);
        toast.success(`Ukuran kertas diperbarui: ${w} × ${h} mm`);
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

    const currentBasePdf = templateSchema.basePdf || { width: 210, height: 297 };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: '#f0f0f0', fontFamily: "'Roboto', 'Noto Sans', sans-serif", color: '#212529', overflow: 'hidden' }}>
            {/* ── Odoo-style Top Navbar ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px', height: '46px', backgroundColor: '#714B67',
                borderBottom: '1px solid #5a3a54', flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={20} color="#fff" />
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.3px' }}>Report & Label Designer</span>
                    </div>
                    <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(255,255,255,0.25)' }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Database size={13} /> Live Database & Query Binding
                    </span>
                </div>

                {/* Center Tabs: Designer | Data Source | Preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '3px' }}>
                    <button
                        onClick={() => setActiveTab('designer')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            backgroundColor: activeTab === 'designer' ? '#fff' : 'transparent',
                            color: activeTab === 'designer' ? '#714B67' : 'rgba(255,255,255,0.85)'
                        }}
                    >
                        <Edit3 size={14} /> Designer
                    </button>
                    <button
                        onClick={() => setActiveTab('datasource')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            backgroundColor: activeTab === 'datasource' ? '#fff' : 'transparent',
                            color: activeTab === 'datasource' ? '#714B67' : 'rgba(255,255,255,0.85)'
                        }}
                    >
                        <Database size={14} /> Data Source & Query
                        {loadedRecords.length > 0 && (
                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', backgroundColor: '#714B67', color: '#fff' }}>
                                {loadedRecords.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => handleGeneratePdf('preview')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            backgroundColor: activeTab === 'preview' ? '#fff' : 'transparent',
                            color: activeTab === 'preview' ? '#714B67' : 'rgba(255,255,255,0.85)'
                        }}
                    >
                        <Eye size={14} /> Preview PDF
                        {sampleInputData.length > 1 && (
                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', backgroundColor: '#28a745', color: '#fff' }}>
                                {sampleInputData.length} Hal
                            </span>
                        )}
                    </button>
                </div>

                {/* Right Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => handleGeneratePdf('print')}
                        disabled={isGeneratingPdf}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                            border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                            backgroundColor: 'transparent', color: '#fff', transition: 'all 0.2s'
                        }}
                    >
                        <Printer size={14} /> Cetak Langsung
                    </button>
                    <button
                        onClick={() => handleGeneratePdf('download')}
                        disabled={isGeneratingPdf}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '5px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                            border: 'none', cursor: 'pointer',
                            backgroundColor: '#fff', color: '#714B67',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'all 0.2s'
                        }}
                    >
                        <Download size={14} /> Download PDF
                    </button>
                </div>
            </div>

            {/* ── Main Content Area ── */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* ── Left Sidebar (Odoo white sidebar) ── */}
                <div style={{
                    width: '300px', backgroundColor: '#fff', borderRight: '1px solid #dee2e6',
                    display: 'flex', flexDirection: 'column', flexShrink: 0
                }}>
                    {/* Sidebar Header */}
                    <div style={{
                        padding: '12px 16px', borderBottom: '1px solid #dee2e6',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#212529', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Templates ({templates.length})
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <label style={{
                                cursor: 'pointer', padding: '5px', color: '#6c757d',
                                borderRadius: '4px', display: 'flex', alignItems: 'center'
                            }} title="Import JSON">
                                <Upload size={14} />
                                <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
                            </label>
                            <button
                                onClick={() => {
                                    setNewForm({
                                        name: '',
                                        category: 'Pengiriman & Logistik',
                                        presetId: 'SH-100x150',
                                        customWidth: 100,
                                        customHeight: 150,
                                        orientation: 'portrait',
                                        padding: 4
                                    });
                                    setShowNewModal(true);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                    border: 'none', cursor: 'pointer',
                                    backgroundColor: '#714B67', color: '#fff'
                                }}
                            >
                                <Plus size={13} /> Baru
                            </button>
                        </div>
                    </div>

                    {/* Template List */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                        {templates.map(tpl => {
                            const isSelected = tpl.id === selectedTemplateId;
                            const tplBase = tpl.template?.basePdf || { width: 210, height: 297 };
                            return (
                                <div
                                    key={tpl.id}
                                    onClick={() => setSelectedTemplateId(tpl.id)}
                                    style={{
                                        padding: '10px 12px', marginBottom: '6px', borderRadius: '8px', cursor: 'pointer',
                                        border: isSelected ? '2px solid #714B67' : '1px solid #e9ecef',
                                        backgroundColor: isSelected ? '#faf5f9' : '#fff',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#fff'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <FileText size={14} color={isSelected ? '#714B67' : '#adb5bd'} style={{ flexShrink: 0 }} />
                                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: isSelected ? '#714B67' : '#212529', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {tpl.name}
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {tpl.description}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f1f3f5' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{
                                                fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px',
                                                backgroundColor: isSelected ? '#714B67' : '#e9ecef',
                                                color: isSelected ? '#fff' : '#495057'
                                            }}>
                                                {tpl.category || 'Custom'}
                                            </span>
                                            <span style={{ fontSize: '10px', color: '#6c757d', fontFamily: 'monospace' }}>
                                                {tplBase.width}×{tplBase.height}mm
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                <button onClick={e => { e.stopPropagation(); handleDuplicateTemplate(); }} title="Duplikasi"
                                                    style={{ padding: '3px', border: 'none', background: 'none', cursor: 'pointer', color: '#6c757d', borderRadius: '4px' }}>
                                                    <Copy size={13} />
                                                </button>
                                                <button onClick={e => { e.stopPropagation(); handleExportJson(); }} title="Export JSON"
                                                    style={{ padding: '3px', border: 'none', background: 'none', cursor: 'pointer', color: '#6c757d', borderRadius: '4px' }}>
                                                    <FileDown size={13} />
                                                </button>
                                                <button onClick={e => { e.stopPropagation(); handleDeleteTemplate(); }} title="Hapus"
                                                    style={{ padding: '3px', border: 'none', background: 'none', cursor: 'pointer', color: '#dc3545', borderRadius: '4px' }}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Dynamic Tags Footer */}
                    <div style={{ padding: '10px 12px', borderTop: '1px solid #dee2e6', backgroundColor: '#f8f9fa' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#495057', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Sparkles size={13} color="#714B67" /> Tag Kolom Data
                            </span>
                            <button
                                onClick={() => setActiveTab('datasource')}
                                style={{ fontSize: '10px', color: '#714B67', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                            >
                                Kelola Sumber Data →
                            </button>
                        </div>

                        {/* List of active columns */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', maxHeight: '110px', overflowY: 'auto' }}>
                            {(availableColumns.length > 0 ? availableColumns : [
                                'tracking_barcode', 'tracking_no', 'nama_penerima', 'alamat_penerima',
                                'item_name', 'price_display', 'size_text', 'guest_name',
                                'wo_number', 'qc_measurement_table'
                            ]).map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => { navigator.clipboard.writeText(tag); toast.success(`Disalin: ${tag}`); }}
                                    style={{
                                        padding: '3px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace',
                                        border: '1px solid #dee2e6', backgroundColor: '#fff', color: '#714B67',
                                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                    }}
                                    title={`Klik untuk menyalin nama field: ${tag}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Center Content Area (Tabs) ── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

                    {/* TAB 1: VISUAL DESIGNER */}
                    {activeTab === 'designer' && (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {/* Sub-toolbar with Page Size & Active Row Controller */}
                            <div style={{
                                padding: '6px 16px', backgroundColor: '#fff', borderBottom: '1px solid #dee2e6',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontWeight: 700, color: '#212529' }}>{currentTemplateObj.name}</span>
                                    <span style={{ color: '#adb5bd' }}>—</span>

                                    {/* Paper Size Button */}
                                    <button
                                        onClick={() => setShowPageSettingsModal(true)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '3px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 600,
                                            border: '1px solid #714B67', backgroundColor: '#faf5f9', color: '#714B67',
                                            cursor: 'pointer', transition: 'all 0.15s'
                                        }}
                                        title="Ubah Ukuran Kertas / Margin"
                                    >
                                        <Sliders size={12} />
                                        <span>Kertas: {currentBasePdf.width} × {currentBasePdf.height} mm</span>
                                    </button>

                                    {/* Record Navigator if records exist */}
                                    {loadedRecords.length > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px', padding: '2px 8px', borderRadius: '5px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                                            <span style={{ fontSize: '11px', color: '#6c757d' }}>Baris Data:</span>
                                            <button
                                                onClick={() => {
                                                    const nextIdx = Math.max(0, selectedRecordIndex - 1);
                                                    setSelectedRecordIndex(nextIdx);
                                                    setSampleInputData([loadedRecords[nextIdx]]);
                                                    toast.success(`Baris #${nextIdx + 1} aktif`);
                                                }}
                                                disabled={selectedRecordIndex <= 0}
                                                style={{ padding: '2px 4px', border: 'none', background: 'none', cursor: 'pointer', color: '#714B67' }}
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#714B67' }}>
                                                {selectedRecordIndex + 1} / {loadedRecords.length}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const nextIdx = Math.min(loadedRecords.length - 1, selectedRecordIndex + 1);
                                                    setSelectedRecordIndex(nextIdx);
                                                    setSampleInputData([loadedRecords[nextIdx]]);
                                                    toast.success(`Baris #${nextIdx + 1} aktif`);
                                                }}
                                                disabled={selectedRecordIndex >= loadedRecords.length - 1}
                                                style={{ padding: '2px 4px', border: 'none', background: 'none', cursor: 'pointer', color: '#714B67' }}
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {batchMode ? (
                                        <span style={{ fontSize: '11px', color: '#28a745', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckSquare size={13} /> Cetak Massal: {sampleInputData.length} Halaman Aktif
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: '11px', color: '#28a745', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle2 size={13} /> Autosaved ke Local
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* pdfme Designer Container */}
                            <div
                                ref={designerRef}
                                style={{ flex: 1, width: '100%', height: '100%', overflow: 'auto', backgroundColor: '#e9ecef', minHeight: '500px' }}
                            />
                        </div>
                    )}

                    {/* TAB 2: DATA SOURCE & QUERY CONNECTOR */}
                    {activeTab === 'datasource' && (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa' }}>
                            {/* Toolbar Banner */}
                            <div style={{
                                padding: '10px 20px', backgroundColor: '#fff', borderBottom: '1px solid #dee2e6',
                                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexDirection: 'column', gap: '10px'
                            }}>
                                {/* Step Indicator */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#714B67', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>1</div>
                                        <span style={{ fontSize: '11px', color: '#495057', fontWeight: 600 }}>Pilih Sumber</span>
                                    </div>
                                    <span style={{ color: '#adb5bd', fontSize: '11px' }}>→</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: isLoadingData || (loadedRecords.length > 0) ? '#22c55e' : '#e9ecef', color: isLoadingData || (loadedRecords.length > 0) ? '#fff' : '#adb5bd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>2</div>
                                        <span style={{ fontSize: '11px', color: isLoadingData || (loadedRecords.length > 0) ? '#22c55e' : '#adb5bd', fontWeight: 600 }}>Ambil Data</span>
                                    </div>
                                    <span style={{ color: '#adb5bd', fontSize: '11px' }}>→</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#e9ecef', color: '#adb5bd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>3</div>
                                        <span style={{ fontSize: '11px', color: '#adb5bd', fontWeight: 600 }}>Terapkan ke Template</span>
                                    </div>
                                </div>

                                {/* Source Description */}
                                {selectedSourceType === 'checksheet' && (
                                    <div style={{ padding: '8px 12px', backgroundColor: '#f5f3ff', border: '1.5px solid #8b5cf6', borderRadius: '8px', fontSize: '11px', color: '#4c1d95', lineHeight: 1.5 }}>
                                        <strong>📋 Checksheet: </strong> Data diambil dari hasil inspeksi di <strong>Digital Check Sheet</strong> dan template dari <strong>Inspector Designer</strong>.
                                        <strong>Setelah klik "Ambil Data", pilih record lalu "Terapkan ke Template".</strong>
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        onClick={handleFetchDataSource}
                                        disabled={isLoadingData}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                                            border: 'none',
                                            backgroundColor: isLoadingData ? '#6c757d' : '#714B67',
                                            color: '#fff', cursor: isLoadingData ? 'not-allowed' : 'pointer',
                                            boxShadow: isLoadingData ? 'none' : '0 2px 8px rgba(113,75,103,0.4)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {isLoadingData ? (
                                            <><RefreshCw size={14} className="animate-spin" /> Memuat...</>
                                        ) : loadedRecords.length > 0 ? (
                                            <><CheckCircle2 size={14} /> Data Loaded ({loadedRecords.length})</>
                                        ) : (
                                            <><PlayCircle size={14} /> Ambil Data Checksheet</>
                                        )}
                                    </button>
                                    {loadedRecords.length > 0 && (
                                        <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>
                                            ✓ {loadedRecords.length} records siap diterapkan ke template
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Main Data Source Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, overflow: 'hidden' }}>

                                {/* Left Query Config Panel */}
                                <div style={{ padding: '16px', backgroundColor: '#fff', borderRight: '1px solid #dee2e6', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {/* Source Type Selector */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#212529', marginBottom: '6px' }}>
                                            Pilih Tipe Sumber Data:
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {[
                                                { id: 'checksheet', label: 'Drawing & QC Checksheet', icon: ClipboardList, desc: 'Ambil data checksheet & attribute drawing otomatis' },
                                                { id: 'app_table', label: 'Interactive App Table', icon: LayoutGrid, desc: 'Tabel interaktif dari AppBuilder' },
                                                { id: 'supabase_table', label: 'Supabase Database Table', icon: HardDrive, desc: 'Tabel sistem (measurements, work_orders)' },
                                                { id: 'csv', label: 'Import File CSV / Excel', icon: FileSpreadsheet, desc: 'Upload file spreadsheet atau paste teks CSV' },
                                                { id: 'sample', label: 'Sample Mock Data', icon: Sparkles, desc: 'Data simulasi bawaan template' }
                                            ].map(opt => {
                                                const isSel = selectedSourceType === opt.id;
                                                const IconC = opt.icon;
                                                return (
                                                    <div
                                                        key={opt.id}
                                                        onClick={() => setSelectedSourceType(opt.id)}
                                                        style={{
                                                            padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                                                            border: isSel ? '2px solid #714B67' : '1px solid #dee2e6',
                                                            backgroundColor: isSel ? '#faf5f9' : '#fff',
                                                            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s'
                                                        }}
                                                    >
                                                        <IconC size={16} color={isSel ? '#714B67' : '#6c757d'} />
                                                        <div>
                                                            <div style={{ fontSize: '12px', fontWeight: 600, color: isSel ? '#714B67' : '#212529' }}>{opt.label}</div>
                                                            <div style={{ fontSize: '10px', color: '#6c757d' }}>{opt.desc}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Config Options based on Source Type */}
                                    {selectedSourceType === 'checksheet' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ padding: '10px', backgroundColor: '#f5f3ff', border: '1px solid #8b5cf6', borderRadius: '6px', fontSize: '11px', color: '#4c1d95', lineHeight: 1.5 }}>
                                                <strong>⚡ Terhubung ke Inspector Designer & Checksheet:</strong><br />
                                                Menarik parameter ISO 9001 (Doc No, Part No, Customer, Process, Inspector, Date/Time, Status) dan seluruh matriks titik ukur drawing langsung ke template laporan QC.
                                            </div>
                                            {/* Search/Filter for checksheet records */}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="text"
                                                        value={checksheetSearch}
                                                        onChange={e => setCheckSheetSearch(e.target.value)}
                                                        placeholder="🔍 Filter: WO, Part No, Serial, Inspector, Customer..."
                                                        style={{
                                                            flex: 1,
                                                            padding: '7px 10px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #c4b5fd',
                                                            fontSize: '11px',
                                                            backgroundColor: '#fff',
                                                            color: '#1e1b4b'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {selectedSourceType === 'app_table' && (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#212529', marginBottom: '6px' }}>
                                                Pilih Interactive Table:
                                            </label>
                                            {dbTables.length > 0 ? (
                                                <select
                                                    value={selectedAppTableId}
                                                    onChange={e => setSelectedAppTableId(e.target.value)}
                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '12px', backgroundColor: '#fff' }}
                                                >
                                                    {dbTables.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name} ({t.fields?.length || 0} Kolom)</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div style={{ padding: '8px', backgroundColor: '#fff3cd', borderRadius: '6px', fontSize: '11px', color: '#856404' }}>
                                                    Belum ada interactive table di AppBuilder. Anda bisa memilih tabel sistem Supabase atau import CSV.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedSourceType === 'supabase_table' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#212529', marginBottom: '4px' }}>
                                                    Nama Tabel Database:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={customTableName}
                                                    onChange={e => setCustomTableName(e.target.value)}
                                                    placeholder="contoh: measurements, work_orders, products"
                                                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '12px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#212529', marginBottom: '4px' }}>
                                                    Filter Query (Opsional - format kolom:nilai):
                                                </label>
                                                <input
                                                    type="text"
                                                    value={customFilterQuery}
                                                    onChange={e => setCustomFilterQuery(e.target.value)}
                                                    placeholder="contoh: status:PASS atau part_id:45"
                                                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '12px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#212529', marginBottom: '4px' }}>
                                                    Limit Jumlah Baris:
                                                </label>
                                                <input
                                                    type="number"
                                                    value={customLimit}
                                                    onChange={e => setCustomLimit(e.target.value)}
                                                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '12px' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedSourceType === 'csv' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#212529', marginBottom: '4px' }}>
                                                    Upload File CSV:
                                                </label>
                                                <input
                                                    type="file"
                                                    accept=".csv"
                                                    onChange={handleCsvFileUpload}
                                                    style={{ fontSize: '12px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#212529', marginBottom: '4px' }}>
                                                    Atau Paste Teks CSV (Baris 1 = Header):
                                                </label>
                                                <textarea
                                                    rows={6}
                                                    value={csvInputText}
                                                    onChange={e => setCsvInputText(e.target.value)}
                                                    placeholder="nama_penerima,alamat_penerima,tracking_no&#10;Budi Santoso,Jl. Merdeka No 1,MV-1001&#10;Siti Rahma,Jl. Sudirman No 5,MV-1002"
                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '11px', fontFamily: 'monospace' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons for Binding */}
                                    {loadedRecords.length > 0 && (
                                        <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '2px solid #714B67', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {/* Step 3 indicator */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', backgroundColor: '#f5f3ff', borderRadius: '6px', border: '1px solid #c4b5fd' }}>
                                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>3</div>
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#4c1d95' }}>Terapkan ke Template</span>
                                            </div>

                                            <button
                                                onClick={() => { handleApplyLoadedDataToTemplate('single'); setActiveTab('designer'); }}
                                                style={{
                                                    padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                                                    border: 'none', backgroundColor: '#22c55e', color: '#fff', cursor: 'pointer',
                                                    boxShadow: '0 2px 8px rgba(34,197,94,0.4)'
                                                }}
                                            >
                                                ✅ Terapkan Baris #{selectedRecordIndex + 1} ke Template
                                            </button>
                                            <div style={{ fontSize: '10px', color: '#6c757d', textAlign: 'center' }}>
                                                atau gunakan navigasi ◀ ▶ untuk memilih record lain
                                            </div>
                                            <button
                                                onClick={() => { handleApplyLoadedDataToTemplate('batch'); handleGeneratePdf('preview'); }}
                                                style={{
                                                    padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                                    border: '1.5px solid #714B67', backgroundColor: '#fff', color: '#714B67', cursor: 'pointer'
                                                }}
                                            >
                                                📋 Cetak Massal ({loadedRecords.length} Halaman)
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Right Data Preview Table & Column Tags */}
                                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    {/* Detected Column Tags Bar */}
                                    <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '14px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#212529', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Tag size={14} color="#714B67" />
                                            Kolom Terdeteksi (Klik untuk salin / gunakan pada template):
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {availableColumns.map(col => (
                                                <button
                                                    key={col}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(col);
                                                        toast.success(`Disalin: ${col}`);
                                                    }}
                                                    style={{
                                                        padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace',
                                                        backgroundColor: '#faf5f9', border: '1px solid #e2cfe0', color: '#714B67',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                                    }}
                                                    title="Klik untuk menyalin nama field"
                                                >
                                                    <span>{col}</span>
                                                    <Copy size={10} />
                                                </button>
                                            ))}
                                            {availableColumns.length === 0 && (
                                                <span style={{ fontSize: '11px', color: '#6c757d' }}>Belum ada kolom terdeteksi. Klik "Jalankan Query & Ambil Data".</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Records Table View */}
                                    <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #dee2e6', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <div style={{
                                            padding: '10px 16px', borderBottom: '1px solid #dee2e6',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fdfbfd'
                                        }}>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#212529' }}>
                                                Hasil Query ({loadedRecords.length} Baris Data Ditemukan)
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#6c757d' }}>
                                                Pilih baris untuk melihat preview
                                            </span>
                                        </div>

                                        <div style={{ flex: 1, overflow: 'auto' }}>
                                            {loadedRecords.length > 0 ? (
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                                            <th style={{ padding: '8px 12px', width: '50px' }}>#</th>
                                                            {availableColumns.map(col => (
                                                                <th key={col} style={{ padding: '8px 12px', fontWeight: 700, color: '#495057' }}>{col}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {loadedRecords.map((row, rIdx) => {
                                                            const isSel = rIdx === selectedRecordIndex;
                                                            return (
                                                                <tr
                                                                    key={rIdx}
                                                                    onClick={() => setSelectedRecordIndex(rIdx)}
                                                                    style={{
                                                                        borderBottom: '1px solid #f1f3f5', cursor: 'pointer',
                                                                        backgroundColor: isSel ? '#faf5f9' : '#fff'
                                                                    }}
                                                                >
                                                                    <td style={{ padding: '8px 12px', fontWeight: 700, color: isSel ? '#714B67' : '#adb5bd' }}>
                                                                        {rIdx + 1}
                                                                    </td>
                                                                    {availableColumns.map(col => (
                                                                        <td key={col} style={{ padding: '8px 12px', color: '#212529', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#adb5bd' }}>
                                                    <Database size={40} style={{ marginBottom: '12px' }} />
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#495057', marginBottom: '4px' }}>Belum ada data checksheet</span>
                                                    <span style={{ fontSize: '12px', color: '#6c757d' }}>
                                                        {selectedSourceType === 'checksheet'
                                                            ? 'Klik tombol "Ambil Data Checksheet" untuk memuat data inspeksi.'
                                                            : 'Klik tombol "Ambil Data" untuk memuat data dari database.'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: PDF PREVIEW & EXPORT */}
                    {activeTab === 'preview' && (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{
                                padding: '6px 16px', backgroundColor: '#fff', borderBottom: '1px solid #dee2e6',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px'
                            }}>
                                <span style={{ fontWeight: 700, color: '#212529' }}>
                                    PDF Preview — {currentBasePdf.width} × {currentBasePdf.height} mm ({sampleInputData.length} Halaman)
                                </span>
                                <button
                                    onClick={() => handleGeneratePdf('preview')}
                                    disabled={isGeneratingPdf}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '4px 12px', borderRadius: '6px', fontSize: '12px',
                                        border: '1px solid #dee2e6', cursor: 'pointer',
                                        backgroundColor: '#fff', color: '#495057'
                                    }}
                                >
                                    <RefreshCw size={13} className={isGeneratingPdf ? 'animate-spin' : ''} /> Refresh
                                </button>
                            </div>
                            <div style={{ flex: 1, padding: '20px', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {pdfPreviewUrl ? (
                                    <iframe
                                        src={pdfPreviewUrl}
                                        title="PDF Preview"
                                        style={{
                                            width: '100%', height: '100%', maxWidth: `${Math.max(currentBasePdf.width * 3.5, 450)}px`,
                                            borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                                            border: '1px solid #dee2e6', backgroundColor: '#fff'
                                        }}
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#6c757d' }}>
                                        <FileText size={48} color="#adb5bd" style={{ marginBottom: '8px' }} />
                                        <p style={{ fontSize: '14px' }}>Klik "Preview PDF" atau "Refresh" untuk merender dokumen</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Odoo-style Modal: New Template & Paper Size Selector ── */}
            {showNewModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(2px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        width: '100%', maxWidth: '680px', backgroundColor: '#fff',
                        borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '14px 20px', backgroundColor: '#714B67', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Plus size={18} />
                                <span style={{ fontSize: '15px', fontWeight: 700 }}>Buat Template Laporan / Label Baru</span>
                            </div>
                            <button
                                onClick={() => setShowNewModal(false)}
                                style={{ border: 'none', background: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleConfirmCreateTemplate} style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#212529', marginBottom: '6px' }}>
                                    Nama Template *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Resi Kurir J&T 100x150, Label Harga Toko 50x30..."
                                    value={newForm.name}
                                    onChange={e => setNewForm({ ...newForm, name: e.target.value })}
                                    style={{
                                        width: '100%', padding: '8px 12px', borderRadius: '6px',
                                        border: '1px solid #ced4da', fontSize: '13px', outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#212529', marginBottom: '6px' }}>
                                        Kategori Template
                                    </label>
                                    <select
                                        value={newForm.category}
                                        onChange={e => setNewForm({ ...newForm, category: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px 12px', borderRadius: '6px',
                                            border: '1px solid #ced4da', fontSize: '13px', backgroundColor: '#fff'
                                        }}
                                    >
                                        <option value="Quality Control">Quality Control (QC)</option>
                                        <option value="Pengiriman & Logistik">Pengiriman & Logistik (Resi Kurir)</option>
                                        <option value="Produk & Retail">Produk & Retail (Barcode & Price Tag)</option>
                                        <option value="Baju & Garment">Baju & Garment (Care & Size Label)</option>
                                        <option value="Label Undangan / Stiker">Label Undangan & Stiker (Tom & Jerry)</option>
                                        <option value="Production">Produksi & SPK</option>
                                        <option value="Custom">Custom / Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#212529', marginBottom: '6px' }}>
                                        Orientasi Kertas
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setNewForm({ ...newForm, orientation: 'portrait' })}
                                            style={{
                                                flex: 1, padding: '7px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                                border: newForm.orientation === 'portrait' ? '2px solid #714B67' : '1px solid #dee2e6',
                                                backgroundColor: newForm.orientation === 'portrait' ? '#faf5f9' : '#fff',
                                                color: newForm.orientation === 'portrait' ? '#714B67' : '#495057', cursor: 'pointer'
                                            }}
                                        >
                                            Portrait (Tegak)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewForm({ ...newForm, orientation: 'landscape' })}
                                            style={{
                                                flex: 1, padding: '7px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                                border: newForm.orientation === 'landscape' ? '2px solid #714B67' : '1px solid #dee2e6',
                                                backgroundColor: newForm.orientation === 'landscape' ? '#faf5f9' : '#fff',
                                                color: newForm.orientation === 'landscape' ? '#714B67' : '#495057', cursor: 'pointer'
                                            }}
                                        >
                                            Landscape (Mendatar)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#212529', marginBottom: '8px' }}>
                                    Pilih Ukuran Kertas / Thermal Label
                                </label>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '240px', overflowY: 'auto',
                                    padding: '4px', border: '1px solid #e9ecef', borderRadius: '8px', backgroundColor: '#fdfbfd'
                                }}>
                                    {PAPER_PRESETS.map(preset => {
                                        const isSel = newForm.presetId === preset.id;
                                        const IconComp = preset.icon || FileText;
                                        return (
                                            <div
                                                key={preset.id}
                                                onClick={() => setNewForm({ ...newForm, presetId: preset.id })}
                                                style={{
                                                    padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                                                    border: isSel ? '2px solid #714B67' : '1px solid #dee2e6',
                                                    backgroundColor: isSel ? '#faf5f9' : '#fff',
                                                    display: 'flex', flexDirection: 'column', gap: '2px', transition: 'all 0.15s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <IconComp size={14} color={isSel ? '#714B67' : '#6c757d'} />
                                                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: isSel ? '#714B67' : '#212529' }}>
                                                            {preset.name}
                                                        </span>
                                                    </div>
                                                    {isSel && <Check size={14} color="#714B67" />}
                                                </div>
                                                <span style={{ fontSize: '10px', color: '#6c757d', lineHeight: '1.3' }}>
                                                    {preset.desc}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {newForm.presetId === 'CUSTOM' && (
                                <div style={{
                                    padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6',
                                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px'
                                }}>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#495057' }}>Lebar (mm):</label>
                                        <input
                                            type="number"
                                            value={newForm.customWidth}
                                            onChange={e => setNewForm({ ...newForm, customWidth: e.target.value })}
                                            style={{ width: '100%', padding: '6px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '12px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#495057' }}>Tinggi (mm):</label>
                                        <input
                                            type="number"
                                            value={newForm.customHeight}
                                            onChange={e => setNewForm({ ...newForm, customHeight: e.target.value })}
                                            style={{ width: '100%', padding: '6px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '12px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#495057' }}>Margin/Padding (mm):</label>
                                        <input
                                            type="number"
                                            value={newForm.padding}
                                            onChange={e => setNewForm({ ...newForm, padding: e.target.value })}
                                            style={{ width: '100%', padding: '6px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '12px' }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowNewModal(false)}
                                    style={{
                                        padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                        border: '1px solid #dee2e6', backgroundColor: '#fff', color: '#495057', cursor: 'pointer'
                                    }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '7px 20px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                        border: 'none', backgroundColor: '#714B67', color: '#fff', cursor: 'pointer'
                                    }}
                                >
                                    Buat Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Odoo-style Modal: Page Size & Margin Settings ── */}
            {showPageSettingsModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(2px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        width: '100%', maxWidth: '520px', backgroundColor: '#fff',
                        borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        overflow: 'hidden', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '14px 20px', backgroundColor: '#714B67', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Sliders size={18} />
                                <span style={{ fontSize: '15px', fontWeight: 700 }}>Pengaturan Ukuran Kertas & Margin</span>
                            </div>
                            <button
                                onClick={() => setShowPageSettingsModal(false)}
                                style={{ border: 'none', background: 'none', color: '#fff', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#212529', marginBottom: '6px' }}>
                                    Pilih Ukuran Standar Kertas / Label:
                                </label>
                                <select
                                    value={pageEditForm.presetId}
                                    onChange={e => {
                                        const pid = e.target.value;
                                        const p = getPresetById(pid);
                                        setPageEditForm({
                                            ...pageEditForm,
                                            presetId: pid,
                                            width: p.width,
                                            height: p.height,
                                            paddingTop: p.padding?.[0] ?? 5,
                                            paddingRight: p.padding?.[1] ?? 5,
                                            paddingBottom: p.padding?.[2] ?? 5,
                                            paddingLeft: p.padding?.[3] ?? 5
                                        });
                                    }}
                                    style={{
                                        width: '100%', padding: '8px 12px', borderRadius: '6px',
                                        border: '1px solid #ced4da', fontSize: '13px', backgroundColor: '#fff'
                                    }}
                                >
                                    {PAPER_PRESETS.map(p => (
                                        <option key={p.id} value={p.id}>{p.category} — {p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#495057', marginBottom: '4px' }}>
                                        Lebar (Width mm)
                                    </label>
                                    <input
                                        type="number"
                                        value={pageEditForm.width}
                                        onChange={e => setPageEditForm({ ...pageEditForm, width: e.target.value, presetId: 'CUSTOM' })}
                                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#495057', marginBottom: '4px' }}>
                                        Tinggi (Height mm)
                                    </label>
                                    <input
                                        type="number"
                                        value={pageEditForm.height}
                                        onChange={e => setPageEditForm({ ...pageEditForm, height: e.target.value, presetId: 'CUSTOM' })}
                                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#212529', marginBottom: '6px' }}>
                                    Margin Kertas (Top, Right, Bottom, Left mm)
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: '#6c757d' }}>Top:</span>
                                        <input
                                            type="number"
                                            value={pageEditForm.paddingTop}
                                            onChange={e => setPageEditForm({ ...pageEditForm, paddingTop: e.target.value })}
                                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '12px' }}
                                        />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '10px', color: '#6c757d' }}>Right:</span>
                                        <input
                                            type="number"
                                            value={pageEditForm.paddingRight}
                                            onChange={e => setPageEditForm({ ...pageEditForm, paddingRight: e.target.value })}
                                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '12px' }}
                                        />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '10px', color: '#6c757d' }}>Bottom:</span>
                                        <input
                                            type="number"
                                            value={pageEditForm.paddingBottom}
                                            onChange={e => setPageEditForm({ ...pageEditForm, paddingBottom: e.target.value })}
                                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '12px' }}
                                        />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '10px', color: '#6c757d' }}>Left:</span>
                                        <input
                                            type="number"
                                            value={pageEditForm.paddingLeft}
                                            onChange={e => setPageEditForm({ ...pageEditForm, paddingLeft: e.target.value })}
                                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '12px' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                    onClick={() => setShowPageSettingsModal(false)}
                                    style={{
                                        padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                        border: '1px solid #dee2e6', backgroundColor: '#fff', color: '#495057', cursor: 'pointer'
                                    }}
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleApplyPageSettings}
                                    style={{
                                        padding: '7px 20px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                        border: 'none', backgroundColor: '#714B67', color: '#fff', cursor: 'pointer'
                                    }}
                                >
                                    Terapkan Ukuran Kertas
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
