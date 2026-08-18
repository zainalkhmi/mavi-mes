import React, { useState, useEffect, useRef } from 'react';
import {
    FileText, Download, Printer, Plus, Save, Trash2, Copy,
    Sparkles, RefreshCw, Eye, Edit3, CheckCircle2, ChevronRight,
    Layers, QrCode, Barcode, Table, Image, PenTool, Type, HelpCircle,
    Upload, FileDown, ArrowLeft, Sliders, Settings2, X, Maximize2,
    Check, Tag, ShoppingBag, Truck, Shirt, Mail, Box, LayoutGrid
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

// Helper to find preset
const getPresetById = (id) => PAPER_PRESETS.find(p => p.id === id) || PAPER_PRESETS[0];

// ── Built-in Templates Covering All Industry Use Cases ──
const DEFAULT_TEMPLATES = [
    // 1. QC Checksheet (A4)
    {
        id: 'qc-checksheet',
        name: 'QC Inspection Checksheet',
        category: 'Quality Control',
        paperPresetId: 'A4',
        description: 'Laporan dimensi QC pabrik standar A4 dengan detail part, tabel toleransi, QR code & tanda tangan.',
        template: {
            basePdf: { width: 210, height: 297, padding: [10, 10, 10, 10] },
            schemas: [
                [
                    {
                        name: 'header_bg',
                        type: 'rectangle',
                        position: { x: 15, y: 12 },
                        width: 180,
                        height: 24,
                        color: '#714B67',
                        borderWidth: 0
                    },
                    {
                        name: 'company_title',
                        type: 'text',
                        position: { x: 20, y: 16 },
                        width: 110,
                        height: 8,
                        fontSize: 15,
                        fontColor: '#ffffff',
                        content: 'MAVI MES — QC INSPECTION CHECKSHEET'
                    },
                    {
                        name: 'company_subtitle',
                        type: 'text',
                        position: { x: 20, y: 24 },
                        width: 110,
                        height: 6,
                        fontSize: 8,
                        fontColor: '#e2cfe0',
                        content: 'Digital Quality Assurance & Dimensional Verification Report'
                    },
                    {
                        name: 'report_qr',
                        type: 'qrcode',
                        position: { x: 172, y: 14 },
                        width: 20,
                        height: 20
                    },
                    {
                        name: 'info_border',
                        type: 'rectangle',
                        position: { x: 15, y: 40 },
                        width: 180,
                        height: 32,
                        borderColor: '#dee2e6',
                        borderWidth: 0.5,
                        color: '#faf5f9'
                    },
                    {
                        name: 'wo_number',
                        type: 'text',
                        position: { x: 20, y: 44 },
                        width: 40,
                        height: 8,
                        fontSize: 10,
                        fontColor: '#212529'
                    },
                    {
                        name: 'part_name',
                        type: 'text',
                        position: { x: 65, y: 44 },
                        width: 50,
                        height: 8,
                        fontSize: 10,
                        fontColor: '#212529'
                    },
                    {
                        name: 'lot_no',
                        type: 'text',
                        position: { x: 120, y: 44 },
                        width: 40,
                        height: 8,
                        fontSize: 10,
                        fontColor: '#212529'
                    },
                    {
                        name: 'inspector_name',
                        type: 'text',
                        position: { x: 20, y: 57 },
                        width: 40,
                        height: 8,
                        fontSize: 10,
                        fontColor: '#212529'
                    },
                    {
                        name: 'inspection_date',
                        type: 'text',
                        position: { x: 65, y: 57 },
                        width: 50,
                        height: 8,
                        fontSize: 10,
                        fontColor: '#212529'
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
                    {
                        name: 'table_title',
                        type: 'text',
                        position: { x: 15, y: 77 },
                        width: 180,
                        height: 6,
                        fontSize: 10,
                        fontColor: '#714B67',
                        content: 'DIMENSION & MEASUREMENT RESULTS'
                    },
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
                    {
                        name: 'remarks',
                        type: 'text',
                        position: { x: 15, y: 196 },
                        width: 110,
                        height: 25,
                        fontSize: 9,
                        fontColor: '#212529'
                    },
                    {
                        name: 'sign_box',
                        type: 'rectangle',
                        position: { x: 135, y: 190 },
                        width: 60,
                        height: 35,
                        borderColor: '#dee2e6',
                        borderWidth: 0.5,
                        color: '#faf5f9'
                    },
                    {
                        name: 'sign_lbl',
                        type: 'text',
                        position: { x: 138, y: 193 },
                        width: 54,
                        height: 5,
                        fontSize: 8,
                        fontColor: '#714B67',
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

    // 2. Shipping Label / Resi Kurir (100 × 150 mm Thermal)
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
                    // Courier Banner
                    {
                        name: 'courier_header',
                        type: 'rectangle',
                        position: { x: 5, y: 5 },
                        width: 90,
                        height: 14,
                        color: '#000000'
                    },
                    {
                        name: 'courier_name',
                        type: 'text',
                        position: { x: 8, y: 8 },
                        width: 45,
                        height: 8,
                        fontSize: 16,
                        fontColor: '#ffffff',
                        content: 'MAVI EXPRESS'
                    },
                    {
                        name: 'service_type',
                        type: 'text',
                        position: { x: 55, y: 9 },
                        width: 38,
                        height: 6,
                        fontSize: 11,
                        fontColor: '#ffffff',
                        content: 'REGULER (STD)'
                    },
                    // Resi Barcode 128
                    {
                        name: 'tracking_barcode',
                        type: 'code128',
                        position: { x: 8, y: 22 },
                        width: 58,
                        height: 18
                    },
                    // QR Code for Sorting
                    {
                        name: 'sorting_qr',
                        type: 'qrcode',
                        position: { x: 70, y: 21 },
                        width: 20,
                        height: 20
                    },
                    // Resi Number Text
                    {
                        name: 'tracking_no',
                        type: 'text',
                        position: { x: 8, y: 42 },
                        width: 84,
                        height: 6,
                        fontSize: 11,
                        fontColor: '#000000'
                    },
                    // Divider Line
                    {
                        name: 'div_1',
                        type: 'line',
                        position: { x: 5, y: 49 },
                        width: 90,
                        height: 1,
                        color: '#000000'
                    },
                    // Recipient Section
                    {
                        name: 'lbl_penerima',
                        type: 'text',
                        position: { x: 6, y: 51 },
                        width: 42,
                        height: 4,
                        fontSize: 8,
                        fontColor: '#666666',
                        content: 'PENERIMA (DESTINATION):'
                    },
                    {
                        name: 'nama_penerima',
                        type: 'text',
                        position: { x: 6, y: 56 },
                        width: 44,
                        height: 6,
                        fontSize: 10,
                        fontColor: '#000000'
                    },
                    {
                        name: 'telp_penerima',
                        type: 'text',
                        position: { x: 6, y: 62 },
                        width: 44,
                        height: 5,
                        fontSize: 9,
                        fontColor: '#000000'
                    },
                    {
                        name: 'alamat_penerima',
                        type: 'text',
                        position: { x: 6, y: 68 },
                        width: 44,
                        height: 24,
                        fontSize: 8,
                        fontColor: '#000000'
                    },
                    // Sender Section
                    {
                        name: 'lbl_pengirim',
                        type: 'text',
                        position: { x: 52, y: 51 },
                        width: 42,
                        height: 4,
                        fontSize: 8,
                        fontColor: '#666666',
                        content: 'PENGIRIM (ORIGIN):'
                    },
                    {
                        name: 'nama_pengirim',
                        type: 'text',
                        position: { x: 52, y: 56 },
                        width: 43,
                        height: 6,
                        fontSize: 9,
                        fontColor: '#000000'
                    },
                    {
                        name: 'telp_pengirim',
                        type: 'text',
                        position: { x: 52, y: 62 },
                        width: 43,
                        height: 5,
                        fontSize: 8,
                        fontColor: '#000000'
                    },
                    {
                        name: 'kota_pengirim',
                        type: 'text',
                        position: { x: 52, y: 68 },
                        width: 43,
                        height: 12,
                        fontSize: 8,
                        fontColor: '#000000'
                    },
                    // Divider Line 2
                    {
                        name: 'div_2',
                        type: 'line',
                        position: { x: 5, y: 94 },
                        width: 90,
                        height: 1,
                        color: '#000000'
                    },
                    // COD & Weight Info Box
                    {
                        name: 'cod_box',
                        type: 'rectangle',
                        position: { x: 5, y: 97 },
                        width: 44,
                        height: 14,
                        borderColor: '#000000',
                        borderWidth: 0.5
                    },
                    {
                        name: 'cod_lbl',
                        type: 'text',
                        position: { x: 7, y: 99 },
                        width: 40,
                        height: 4,
                        fontSize: 7,
                        fontColor: '#444444',
                        content: 'METODE PEMBAYARAN'
                    },
                    {
                        name: 'cod_val',
                        type: 'text',
                        position: { x: 7, y: 104 },
                        width: 40,
                        height: 6,
                        fontSize: 11,
                        fontColor: '#000000'
                    },
                    {
                        name: 'weight_box',
                        type: 'rectangle',
                        position: { x: 51, y: 97 },
                        width: 44,
                        height: 14,
                        borderColor: '#000000',
                        borderWidth: 0.5
                    },
                    {
                        name: 'weight_lbl',
                        type: 'text',
                        position: { x: 53, y: 99 },
                        width: 40,
                        height: 4,
                        fontSize: 7,
                        fontColor: '#444444',
                        content: 'BERAT PAKET'
                    },
                    {
                        name: 'weight_val',
                        type: 'text',
                        position: { x: 53, y: 104 },
                        width: 40,
                        height: 6,
                        fontSize: 11,
                        fontColor: '#000000'
                    },
                    // Package Contents Table
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
                sorting_qr: 'https://track.mavi.io/MV-88392019482ID',
                tracking_no: 'No. Resi: MV-88392019482ID',
                nama_penerima: 'Bpk. Hendra Gunawan',
                telp_penerima: '0812-3456-7890',
                alamat_penerima: 'Jl. Merdeka No. 45 RT 02/05, Kel. Gambir, Kec. Gambir, Kota Jakarta Pusat, DKI Jakarta 10110',
                nama_pengirim: 'PT MAVI CORE FACTORY',
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

    // 3. Label Barcode & Price Tag Retail (50 × 30 mm)
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
                    // Store Name
                    {
                        name: 'store_name',
                        type: 'text',
                        position: { x: 3, y: 2 },
                        width: 44,
                        height: 4,
                        fontSize: 7,
                        fontColor: '#444444',
                        content: 'MAVI INDUSTRIAL STORE'
                    },
                    // Product Name
                    {
                        name: 'item_name',
                        type: 'text',
                        position: { x: 3, y: 6 },
                        width: 44,
                        height: 5,
                        fontSize: 9,
                        fontColor: '#000000'
                    },
                    // SKU / Specs
                    {
                        name: 'item_sku',
                        type: 'text',
                        position: { x: 3, y: 11 },
                        width: 44,
                        height: 3.5,
                        fontSize: 6,
                        fontColor: '#666666'
                    },
                    // Barcode
                    {
                        name: 'product_barcode',
                        type: 'code128',
                        position: { x: 3, y: 15 },
                        width: 44,
                        height: 8
                    },
                    // Price IDR
                    {
                        name: 'price_display',
                        type: 'text',
                        position: { x: 3, y: 24 },
                        width: 44,
                        height: 5,
                        fontSize: 11,
                        fontColor: '#000000'
                    }
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

    // 4. Care Label & Garment Size (30 × 80 mm)
    {
        id: 'garment-care-label-30x80',
        name: 'Care Label Baju & Garment (30 × 80 mm)',
        category: 'Baju & Garment',
        paperPresetId: 'GM-30x80',
        description: 'Label baju satin / woven 30x80mm dengan logo brand, ukuran baju (S/M/L/XL), komposisi bahan & instruksi cuci.',
        template: {
            basePdf: { width: 30, height: 80, padding: [2, 2, 2, 2] },
            schemas: [
                [
                    // Brand Name
                    {
                        name: 'brand_title',
                        type: 'text',
                        position: { x: 2, y: 4 },
                        width: 26,
                        height: 5,
                        fontSize: 9,
                        fontColor: '#000000',
                        content: 'MAVI APPAREL'
                    },
                    // Size Badge Circle Box
                    {
                        name: 'size_box',
                        type: 'rectangle',
                        position: { x: 9, y: 10 },
                        width: 12,
                        height: 10,
                        borderColor: '#000000',
                        borderWidth: 0.5
                    },
                    {
                        name: 'size_text',
                        type: 'text',
                        position: { x: 10, y: 12 },
                        width: 10,
                        height: 6,
                        fontSize: 12,
                        fontColor: '#000000'
                    },
                    // Material Composition
                    {
                        name: 'mat_1',
                        type: 'text',
                        position: { x: 2, y: 22 },
                        width: 26,
                        height: 4,
                        fontSize: 6,
                        fontColor: '#000000',
                        content: '100% COMBED COTTON'
                    },
                    {
                        name: 'mat_2',
                        type: 'text',
                        position: { x: 2, y: 26 },
                        width: 26,
                        height: 4,
                        fontSize: 5.5,
                        fontColor: '#555555',
                        content: 'MADE IN INDONESIA'
                    },
                    // Care Instructions
                    {
                        name: 'care_header',
                        type: 'text',
                        position: { x: 2, y: 32 },
                        width: 26,
                        height: 4,
                        fontSize: 6,
                        fontColor: '#000000',
                        content: 'PETUNJUK PERAWATAN:'
                    },
                    {
                        name: 'care_1',
                        type: 'text',
                        position: { x: 2, y: 37 },
                        width: 26,
                        height: 3.5,
                        fontSize: 5,
                        fontColor: '#444444',
                        content: '• Cuci dengan air dingin (<30°C)'
                    },
                    {
                        name: 'care_2',
                        type: 'text',
                        position: { x: 2, y: 41 },
                        width: 26,
                        height: 3.5,
                        fontSize: 5,
                        fontColor: '#444444',
                        content: '• Jangan gunakan pemutih'
                    },
                    {
                        name: 'care_3',
                        type: 'text',
                        position: { x: 2, y: 45 },
                        width: 26,
                        height: 3.5,
                        fontSize: 5,
                        fontColor: '#444444',
                        content: '• Setrika suhu sedang'
                    },
                    {
                        name: 'care_4',
                        type: 'text',
                        position: { x: 2, y: 49 },
                        width: 26,
                        height: 3.5,
                        fontSize: 5,
                        fontColor: '#444444',
                        content: '• Jangan cuci kering'
                    },
                    // Garment Barcode
                    {
                        name: 'garment_code',
                        type: 'code128',
                        position: { x: 2, y: 55 },
                        width: 26,
                        height: 12
                    },
                    {
                        name: 'article_no',
                        type: 'text',
                        position: { x: 2, y: 69 },
                        width: 26,
                        height: 4,
                        fontSize: 6,
                        fontColor: '#000000'
                    }
                ]
            ]
        },
        sampleInputs: [
            {
                size_text: 'XL',
                garment_code: 'ART-TS-092-XL',
                article_no: 'Art: TS-POLO-NAVY-XL'
            }
        ]
    },

    // 5. Stiker Undangan Tom & Jerry No. 103 (64 × 32 mm)
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
                    {
                        name: 'salutation',
                        type: 'text',
                        position: { x: 4, y: 4 },
                        width: 56,
                        height: 4,
                        fontSize: 7.5,
                        fontColor: '#555555',
                        content: 'Kepada Yth. Bapak / Ibu / Saudara/i:'
                    },
                    {
                        name: 'guest_name',
                        type: 'text',
                        position: { x: 4, y: 11 },
                        width: 56,
                        height: 8,
                        fontSize: 11,
                        fontColor: '#111111'
                    },
                    {
                        name: 'guest_location',
                        type: 'text',
                        position: { x: 4, y: 21 },
                        width: 56,
                        height: 5,
                        fontSize: 8,
                        fontColor: '#444444'
                    }
                ]
            ]
        },
        sampleInputs: [
            {
                guest_name: 'Dr. Ir. Bambang Wicaksono, M.T. & Partner',
                guest_location: 'di Tempat'
            }
        ]
    }
];

export default function ReportDesigner() {
    const [templates, setTemplates] = useState(() => {
        const saved = localStorage.getItem('mavi_pdf_templates_v3');
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

    // Modal state for New Template / Page Settings
    const [showNewModal, setShowNewModal] = useState(false);
    const [showPageSettingsModal, setShowPageSettingsModal] = useState(false);

    // New Template Form State
    const [newForm, setNewForm] = useState({
        name: '',
        category: 'Quality Control',
        presetId: 'A4',
        customWidth: 210,
        customHeight: 297,
        orientation: 'portrait', // 'portrait' | 'landscape'
        padding: 5
    });

    // Page Settings Edit Form
    const [pageEditForm, setPageEditForm] = useState({
        presetId: 'A4',
        width: 210,
        height: 297,
        paddingTop: 10,
        paddingRight: 10,
        paddingBottom: 10,
        paddingLeft: 10
    });

    const currentTemplateObj = templates.find(t => t.id === selectedTemplateId) || templates[0];
    const [templateSchema, setTemplateSchema] = useState(currentTemplateObj.template);
    const [sampleInputData, setSampleInputData] = useState(currentTemplateObj.sampleInputs || [{}]);

    const designerRef = useRef(null);
    const designerInstance = useRef(null);

    // Save templates to localStorage on changes
    useEffect(() => {
        localStorage.setItem('mavi_pdf_templates_v3', JSON.stringify(templates));
    }, [templates]);

    // When switching template, update schema and sample data
    useEffect(() => {
        const t = templates.find(item => item.id === selectedTemplateId);
        if (t) {
            setTemplateSchema(t.template);
            setSampleInputData(t.sampleInputs || [{}]);

            // Sync page settings state
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

    // Initialize / Update pdfme Designer
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

    // Generate PDF Preview / Download / Print
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
                a.download = `${currentTemplateObj.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.pdf`;
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

        // Switch if landscape
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

    // Get current paper size display label
    const currentBasePdf = templateSchema.basePdf || { width: 210, height: 297 };
    const currentPreset = PAPER_PRESETS.find(p => p.id === currentTemplateObj.paperPresetId) || { name: `${currentBasePdf.width} × ${currentBasePdf.height} mm` };

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
                        <Tag size={12} /> Thermal Resi, Barcode, Stiker & A4
                    </span>
                </div>

                {/* Center Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '3px' }}>
                    <button
                        onClick={() => setActiveTab('designer')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '5px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            backgroundColor: activeTab === 'designer' ? '#fff' : 'transparent',
                            color: activeTab === 'designer' ? '#714B67' : 'rgba(255,255,255,0.85)'
                        }}
                    >
                        <Edit3 size={14} /> Designer
                    </button>
                    <button
                        onClick={() => handleGeneratePdf('preview')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '5px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            backgroundColor: activeTab === 'preview' ? '#fff' : 'transparent',
                            color: activeTab === 'preview' ? '#714B67' : 'rgba(255,255,255,0.85)'
                        }}
                    >
                        <Eye size={14} /> Preview PDF
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
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#495057', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <Sparkles size={13} color="#714B67" /> Tag Data Dinamis (Klik untuk Salin)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
                            {[
                                'tracking_barcode', 'tracking_no', 'nama_penerima', 'alamat_penerima',
                                'item_name', 'price_display', 'size_text', 'guest_name',
                                'wo_number', 'qc_measurement_table'
                            ].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => { navigator.clipboard.writeText(tag); toast.success(`Disalin: ${tag}`); }}
                                    style={{
                                        padding: '3px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace',
                                        border: '1px solid #dee2e6', backgroundColor: '#fff', color: '#714B67',
                                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                    }}
                                    title={`Klik untuk menyalin: ${tag}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Center Canvas Area ── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                    {activeTab === 'designer' ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {/* Sub-toolbar with Page Size Controller */}
                            <div style={{
                                padding: '6px 16px', backgroundColor: '#fff', borderBottom: '1px solid #dee2e6',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontWeight: 700, color: '#212529' }}>{currentTemplateObj.name}</span>
                                    <span style={{ color: '#adb5bd' }}>—</span>

                                    {/* Paper Size Indicator & Switcher Button */}
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
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#28a745', fontSize: '11px' }}>
                                    <CheckCircle2 size={13} /> Autosaved ke Local
                                </div>
                            </div>

                            {/* pdfme Designer Container */}
                            <div
                                ref={designerRef}
                                style={{ flex: 1, width: '100%', height: '100%', overflow: 'auto', backgroundColor: '#e9ecef', minHeight: '500px' }}
                            />
                        </div>
                    ) : (
                        /* PDF Preview Tab */
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{
                                padding: '6px 16px', backgroundColor: '#fff', borderBottom: '1px solid #dee2e6',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px'
                            }}>
                                <span style={{ fontWeight: 700, color: '#212529' }}>
                                    PDF Preview — {currentBasePdf.width} × {currentBasePdf.height} mm (Resolusi Cetak Tinggi)
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
                            {/* Template Name */}
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

                            {/* Category & Orientation */}
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

                            {/* Paper Size Preset Grid */}
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

                            {/* Custom Dimensions if CUSTOM selected */}
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

                            {/* Modal Footer */}
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
                        {/* Header */}
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

                        {/* Body */}
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

                            {/* Dimension Inputs */}
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

                            {/* Margin / Padding Inputs */}
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

                            {/* Footer */}
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
