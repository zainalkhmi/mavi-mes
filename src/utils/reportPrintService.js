/**
 * reportPrintService.js
 * Universal service for executing Report & Label Designer templates
 * from AppBuilder Triggers, LiveTerminal Player, and Automation Engine.
 */
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
import toast from 'react-hot-toast';

export const PDF_PLUGINS = {
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
                    { name: 'sign_val3', type: 'text', position: { x: 107, y: 198 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#991b1b', content: '✓ Hendra Wijaya, ST (QA Mgr)', alignment: 'center' },
                    { name: 'sign_sub3', type: 'text', position: { x: 107, y: 207 }, width: 42, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Otorisasi Disposisi Mutu', alignment: 'center' },

                    { name: 'sign_box4', type: 'rectangle', position: { x: 153, y: 191 }, width: 45, height: 24, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'sign_lbl4', type: 'text', position: { x: 154, y: 193 }, width: 43, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PRODUKSI / LINE LEAD', alignment: 'center' },
                    { name: 'sign_val4', type: 'text', position: { x: 154, y: 198 }, width: 43, height: 5, fontSize: 7.5, fontColor: '#475569', content: '✓ Budi Santoso (Line Lead)', alignment: 'center' },
                    { name: 'sign_sub4', type: 'text', position: { x: 154, y: 207 }, width: 43, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Penerima Part Karantina', alignment: 'center' },

                    // 8. Footer Watermark
                    { name: 'footer_line', type: 'line', position: { x: 12, y: 218 }, width: 186, height: 0.2, color: '#cbd5e1' },
                    { name: 'footer_text', type: 'text', position: { x: 12, y: 220 }, width: 130, height: 4, fontSize: 5, fontColor: '#94a3b8', content: 'MANDOR MES QUALITY ENGINE • ISO 9001:2015 AUDITED FORM NCR • DIGITAL SIGNATURE SECURED' },
                    { name: 'footer_page', type: 'text', position: { x: 145, y: 220 }, width: 53, height: 4, fontSize: 5, fontColor: '#94a3b8', content: 'Doc Control: Controlled Copy • 30/8/2026', alignment: 'right' }
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
                hold_val: '⛔ QUARANTINED (HOLD)',
                rca_val: 'Penyimpangan toleransi dimensi pada proses pemesinan CNC.',
                corrective_val: 'Karantina part di Area Hold. Kalibrasi ulang tool offset CNC dan setting fixture sebelum lanjut.',
                sign_val1: '✓ admin',
                sign_val2: '✓ Ahmad S., ST (QA Eng)',
                sign_val3: '✓ Hendra Wijaya, ST (QA Mgr)',
                sign_val4: '✓ Budi Santoso (Line Lead)',
                ncr_table: JSON.stringify([
                    ['1', 'Internal Bore Diameter', '25.000 mm', '24.950 ~ 25.050 mm', '25.180 mm', '+0.130 mm', 'NG'],
                    ['2', 'Flange Thickness', '15.000 mm', '14.900 ~ 15.100 mm', '15.220 mm', '+0.120 mm', 'NG']
                ])
            }
        ]
    },
    {
        id: 'qc-checksheet',
        name: 'QC Inspection Checksheet (A4)',
        category: 'Quality Control',
        template: {
            basePdf: { width: 210, height: 297, padding: [10, 10, 10, 10] },
            schemas: [
                [
                    { name: 'header_bg', type: 'rectangle', position: { x: 15, y: 12 }, width: 180, height: 24, color: '#714B67', borderWidth: 0 },
                    { name: 'company_title', type: 'text', position: { x: 20, y: 16 }, width: 110, height: 8, fontSize: 15, fontColor: '#ffffff', content: 'MANDOR MES — QC INSPECTION CHECKSHEET' },
                    { name: 'report_qr', type: 'qrcode', position: { x: 172, y: 14 }, width: 20, height: 20 },
                    { name: 'wo_number', type: 'text', position: { x: 20, y: 44 }, width: 40, height: 8, fontSize: 10, fontColor: '#212529' },
                    { name: 'part_name', type: 'text', position: { x: 65, y: 44 }, width: 50, height: 8, fontSize: 10, fontColor: '#212529' },
                    { name: 'lot_no', type: 'text', position: { x: 120, y: 44 }, width: 40, height: 8, fontSize: 10, fontColor: '#212529' },
                    { name: 'inspector_name', type: 'text', position: { x: 20, y: 57 }, width: 40, height: 8, fontSize: 10, fontColor: '#212529' },
                    { name: 'overall_status', type: 'text', position: { x: 120, y: 57 }, width: 40, height: 8, fontSize: 11, fontColor: '#16a34a' },
                    {
                        name: 'qc_measurement_table',
                        type: 'table',
                        position: { x: 15, y: 85 },
                        width: 180,
                        height: 80,
                        showHead: true,
                        head: ['Item #', 'Parameter', 'Nominal', 'Tolerance', 'Actual', 'Status'],
                        headWidthPercentages: [10, 30, 15, 15, 15, 15],
                        tableStyles: { borderColor: '#714B67', borderWidth: 0.3 },
                        headStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 9, lineHeight: 1, characterSpacing: 0, fontColor: '#ffffff', backgroundColor: '#714B67', borderColor: '', borderWidth: { top: 0, right: 0, bottom: 0, left: 0 }, padding: { top: 3, right: 3, bottom: 3, left: 3 } },
                        bodyStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 8, lineHeight: 1, characterSpacing: 0, fontColor: '#000000', backgroundColor: '', borderColor: '#888888', borderWidth: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 }, padding: { top: 3, right: 3, bottom: 3, left: 3 }, alternateBackgroundColor: '#fdfbfd' },
                        columnStyles: {}
                    },
                    { name: 'remarks', type: 'text', position: { x: 15, y: 196 }, width: 110, height: 25, fontSize: 9, fontColor: '#212529' }
                ]
            ]
        }
    },
    {
        id: 'shipping-label-100x150',
        name: 'Resi Pengiriman / Shipping Label (100 × 150 mm)',
        category: 'Pengiriman & Logistik',
        template: {
            basePdf: { width: 100, height: 150, padding: [4, 4, 4, 4] },
            schemas: [
                [
                    { name: 'courier_header', type: 'rectangle', position: { x: 5, y: 5 }, width: 90, height: 14, color: '#000000' },
                    { name: 'courier_name', type: 'text', position: { x: 8, y: 8 }, width: 45, height: 8, fontSize: 16, fontColor: '#ffffff', content: 'MANDOR EXPRESS' },
                    { name: 'tracking_barcode', type: 'code128', position: { x: 8, y: 22 }, width: 58, height: 18 },
                    { name: 'sorting_qr', type: 'qrcode', position: { x: 70, y: 21 }, width: 20, height: 20 },
                    { name: 'tracking_no', type: 'text', position: { x: 8, y: 42 }, width: 84, height: 6, fontSize: 11, fontColor: '#000000' },
                    { name: 'nama_penerima', type: 'text', position: { x: 6, y: 56 }, width: 44, height: 6, fontSize: 10, fontColor: '#000000' },
                    { name: 'telp_penerima', type: 'text', position: { x: 6, y: 62 }, width: 44, height: 5, fontSize: 9, fontColor: '#000000' },
                    { name: 'alamat_penerima', type: 'text', position: { x: 6, y: 68 }, width: 44, height: 24, fontSize: 8, fontColor: '#000000' },
                    { name: 'nama_pengirim', type: 'text', position: { x: 52, y: 56 }, width: 43, height: 6, fontSize: 9, fontColor: '#000000' },
                    { name: 'cod_val', type: 'text', position: { x: 7, y: 104 }, width: 40, height: 6, fontSize: 11, fontColor: '#000000' },
                    { name: 'weight_val', type: 'text', position: { x: 53, y: 104 }, width: 40, height: 6, fontSize: 11, fontColor: '#000000' }
                ]
            ]
        }
    },
    {
        id: 'retail-price-tag-50x30',
        name: 'Label Harga & Barcode Retail (50 × 30 mm)',
        category: 'Produk & Retail',
        template: {
            basePdf: { width: 50, height: 30, padding: [2, 2, 2, 2] },
            schemas: [
                [
                    { name: 'store_name', type: 'text', position: { x: 3, y: 2 }, width: 44, height: 4, fontSize: 7, fontColor: '#444444', content: 'MANDOR STORE' },
                    { name: 'item_name', type: 'text', position: { x: 3, y: 6 }, width: 44, height: 5, fontSize: 9, fontColor: '#000000' },
                    { name: 'item_sku', type: 'text', position: { x: 3, y: 11 }, width: 44, height: 3.5, fontSize: 6, fontColor: '#666666' },
                    { name: 'product_barcode', type: 'code128', position: { x: 3, y: 15 }, width: 44, height: 8 },
                    { name: 'price_display', type: 'text', position: { x: 3, y: 24 }, width: 44, height: 5, fontSize: 11, fontColor: '#000000' }
                ]
            ]
        }
    },
    // ─────────────────────────────────────────────────────────────────────
    // SHIFT HANDOFF REPORT TEMPLATE (for automation access)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'shift-handoff-report-a4',
        name: 'Shift Handoff Report (A4)',
        category: 'Shift Reports',
        template: {
            basePdf: { width: 210, height: 297, padding: [10, 10, 10, 10] },
            schemas: [
                [
                    // Header
                    { name: 'header_bg', type: 'rectangle', position: { x: 15, y: 12 }, width: 180, height: 22, color: '#714B67', borderWidth: 0 },
                    { name: 'report_title', type: 'text', position: { x: 20, y: 16 }, width: 100, height: 7, fontSize: 14, fontColor: '#ffffff', content: 'SHIFT HANDOFF REPORT' },
                    { name: 'company_name', type: 'text', position: { x: 20, y: 24 }, width: 80, height: 5, fontSize: 7, fontColor: '#e2cfe0', content: 'MANDOR MES — Manufacturing Execution System' },
                    { name: 'report_qr', type: 'qrcode', position: { x: 172, y: 14 }, width: 18, height: 18 },
                    { name: 'doc_id', type: 'text', position: { x: 172, y: 34 }, width: 23, height: 4, fontSize: 6, fontColor: '#64748b' },
                    // Shift Info
                    { name: 'info_border', type: 'rectangle', position: { x: 15, y: 40 }, width: 180, height: 28, borderColor: '#dee2e6', borderWidth: 0.5, color: '#faf5f9' },
                    { name: 'shift_value', type: 'text', position: { x: 20, y: 49 }, width: 40, height: 6, fontSize: 11, fontColor: '#1f2937' },
                    { name: 'date_value', type: 'text', position: { x: 65, y: 49 }, width: 45, height: 6, fontSize: 11, fontColor: '#1f2937' },
                    { name: 'time_value', type: 'text', position: { x: 115, y: 49 }, width: 40, height: 6, fontSize: 11, fontColor: '#1f2937' },
                    { name: 'operator_value', type: 'text', position: { x: 160, y: 49 }, width: 32, height: 6, fontSize: 10, fontColor: '#1f2937' },
                    // Production Summary
                    { name: 'prod_bg', type: 'rectangle', position: { x: 15, y: 82 }, width: 85, height: 40, borderColor: '#e2e8f0', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'target_value', type: 'text', position: { x: 20, y: 91 }, width: 35, height: 8, fontSize: 18, fontColor: '#1f2937' },
                    { name: 'actual_value', type: 'text', position: { x: 20, y: 107 }, width: 35, height: 8, fontSize: 18, fontColor: '#1f2937' },
                    { name: 'completion_value', type: 'text', position: { x: 55, y: 91 }, width: 40, height: 8, fontSize: 18, fontColor: '#16a34a' },
                    // Quality Summary
                    { name: 'quality_bg', type: 'rectangle', position: { x: 110, y: 82 }, width: 85, height: 40, borderColor: '#e2e8f0', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'good_value', type: 'text', position: { x: 115, y: 91 }, width: 35, height: 8, fontSize: 18, fontColor: '#16a34a' },
                    { name: 'reject_value', type: 'text', position: { x: 115, y: 107 }, width: 35, height: 8, fontSize: 18, fontColor: '#dc2626' },
                    { name: 'fpy_value', type: 'text', position: { x: 155, y: 91 }, width: 35, height: 8, fontSize: 18, fontColor: '#16a34a' },
                    // OEE Metrics
                    { name: 'oee_bg', type: 'rectangle', position: { x: 15, y: 136 }, width: 180, height: 28, borderColor: '#e2e8f0', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'avail_value', type: 'text', position: { x: 20, y: 146 }, width: 35, height: 8, fontSize: 16, fontColor: '#2563eb' },
                    { name: 'perf_value', type: 'text', position: { x: 62, y: 146 }, width: 35, height: 8, fontSize: 16, fontColor: '#2563eb' },
                    { name: 'qual_value', type: 'text', position: { x: 104, y: 146 }, width: 35, height: 8, fontSize: 16, fontColor: '#2563eb' },
                    { name: 'oee_value', type: 'text', position: { x: 146, y: 146 }, width: 44, height: 12, fontSize: 24, fontColor: '#714B67' },
                    // Downtime Table
                    {
                        name: 'downtime_table',
                        type: 'table',
                        position: { x: 15, y: 178 },
                        width: 180,
                        height: 30,
                        showHead: true,
                        head: ['#', 'Station', 'Start', 'End', 'Duration', 'Reason'],
                        headWidthPercentages: [5, 20, 15, 15, 15, 30],
                        tableStyles: { borderColor: '#714B67', borderWidth: 0.3 },
                        headStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 9, fontColor: '#ffffff', backgroundColor: '#714B67', borderColor: '', borderWidth: { top: 0, right: 0, bottom: 0, left: 0 }, padding: { top: 3, right: 3, bottom: 3, left: 3 } },
                        bodyStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 8, fontColor: '#000000', backgroundColor: '', borderColor: '#888888', borderWidth: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 }, padding: { top: 3, right: 3, bottom: 3, left: 3 }, alternateBackgroundColor: '#fdfbfd' },
                        columnStyles: {}
                    },
                    // Defects Table
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
                        headStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 9, fontColor: '#ffffff', backgroundColor: '#714B67', borderColor: '', borderWidth: { top: 0, right: 0, bottom: 0, left: 0 }, padding: { top: 3, right: 3, bottom: 3, left: 3 } },
                        bodyStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 8, fontColor: '#000000', backgroundColor: '', borderColor: '#888888', borderWidth: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 }, padding: { top: 3, right: 3, bottom: 3, left: 3 }, alternateBackgroundColor: '#fdfbfd' },
                        columnStyles: {}
                    },
                    // Notes
                    { name: 'notes_bg', type: 'rectangle', position: { x: 15, y: 258 }, width: 120, height: 25, borderColor: '#e2e8f0', borderWidth: 0.5, color: '#ffffff' },
                    { name: 'notes_value', type: 'text', position: { x: 18, y: 261 }, width: 115, height: 20, fontSize: 8, fontColor: '#374151' },
                    // Signatures
                    { name: 'sign_box', type: 'rectangle', position: { x: 140, y: 258 }, width: 55, height: 25, borderColor: '#dee2e6', borderWidth: 0.5, color: '#faf5f9' },
                    { name: 'sign_lbl', type: 'text', position: { x: 143, y: 260 }, width: 49, height: 4, fontSize: 7, fontColor: '#714B67', content: 'OUTGOING OPERATOR' },
                    { name: 'sign_out', type: 'text', position: { x: 143, y: 278 }, width: 49, height: 4, fontSize: 7, fontColor: '#94a3b8', content: 'Date: ________________' },
                    { name: 'sign_box2', type: 'rectangle', position: { x: 140, y: 285 }, width: 55, height: 8, borderColor: '#dee2e6', borderWidth: 0.5, color: '#faf5f9' },
                    { name: 'sign_lbl2', type: 'text', position: { x: 143, y: 286 }, width: 49, height: 4, fontSize: 7, fontColor: '#714B67', content: 'INCOMING OPERATOR' },
                    // Footer
                    { name: 'footer_line', type: 'line', position: { x: 15, y: 295 }, width: 180, height: 0.3, color: '#714B67' },
                    { name: 'footer_text', type: 'text', position: { x: 15, y: 296 }, width: 120, height: 4, fontSize: 6, fontColor: '#94a3b8', content: 'Generated by MANDOR MES • Shift Handoff System' },
                    { name: 'footer_timestamp', type: 'text', position: { x: 150, y: 296 }, width: 45, height: 4, fontSize: 6, fontColor: '#94a3b8' }
                ]
            ]
        }
    },
    // ─────────────────────────────────────────────────────────────────────
    // QC INSPECTION CHECKSHEET (Integrated with Drawing/Inspector Designer)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'qc-inspection-checksheet-a4',
        name: 'QC Inspection Checksheet (A4)',
        category: 'Quality Control',
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
                    { name: 'stat_lbl_3', type: 'text', position: { x: 107, y: 66 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#6d28d9', content: 'TARGET CPK' },
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
        }
    }
];

/**
 * Get all available report templates (default + user-created from ReportDesigner)
 */
export function getSavedReportTemplates() {
    try {
        // Check all localStorage versions (v6 = ReportDesigner, v5/v4/v3 = legacy)
        const v6 = localStorage.getItem('mandor_pdf_templates_v6');
        const v5 = localStorage.getItem('mandor_pdf_templates_v5');
        const v4 = localStorage.getItem('mandor_pdf_templates_v4');
        const v3 = localStorage.getItem('mandor_pdf_templates_v3');
        const savedRaw = v6 || v5 || v4 || v3;
        if (savedRaw) {
            const parsed = JSON.parse(savedRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Merge saved user templates with defaults — saved templates win on duplicate ID
                const defaultIds = new Set(DEFAULT_TEMPLATES.map(t => t.id));
                const merged = [...DEFAULT_TEMPLATES];
                parsed.forEach(userT => {
                    const idx = merged.findIndex(m => m.id === userT.id);
                    if (idx >= 0) {
                        merged[idx] = userT; // user template overwrites default
                    } else {
                        merged.push(userT);    // new user template
                    }
                });
                return merged;
            }
        }
    } catch (e) {
        console.warn('[ReportPrintService] Failed to read saved templates:', e);
    }
    return DEFAULT_TEMPLATES;
}

/**
 * Extract all dynamic field tags from a template
 */
export function extractTemplateFieldTags(templateObj) {
    if (!templateObj?.template?.schemas) return [];
    const tags = new Set();
    templateObj.template.schemas.forEach(page => {
        if (Array.isArray(page)) {
            page.forEach(item => {
                if (item && item.name) {
                    tags.add(item.name);
                }
            });
        }
    });
    return Array.from(tags);
}

/**
 * Generate and execute PDF report printing / downloading / viewing
 */
export async function executeReportPrintAction({
    templateId,
    reportId,
    actionTarget = 'PRINT', // 'PRINT' | 'DOWNLOAD' | 'PREVIEW'
    resolvedInputs,
    data,
    customFileName = null
}) {
    try {
        const targetId = templateId || reportId || 'qc-checksheet';
        const rawInputs = resolvedInputs || data || {};
        const allTemplates = getSavedReportTemplates();
        const targetTemplate = allTemplates.find(t => t.id === targetId) || allTemplates[0];

        if (!targetTemplate) {
            throw new Error(`Template dengan ID "${targetId}" tidak ditemukan.`);
        }

        const inputData = Array.isArray(rawInputs) ? rawInputs : [rawInputs];

        // ── Format inputs: keep arrays as-is (table data), parse JSON strings ──
        const formattedInputs = inputData.map(row => {
            const cleanRow = {};
            Object.entries(row).forEach(([key, value]) => {
                if (value === undefined || value === null) {
                    cleanRow[key] = '';
                } else if (Array.isArray(value)) {
                    // Table data (inspection_table etc.) — keep as array for pdfme
                    cleanRow[key] = value;
                } else if (typeof value === 'object') {
                    // Objects → deep clone to avoid mutation
                    try { cleanRow[key] = JSON.parse(JSON.stringify(value)); } catch { cleanRow[key] = String(value); }
                } else if (typeof value === 'string') {
                    const trimmed = value.trim();
                    if ((trimmed.startsWith('[') || trimmed.startsWith('{')) && trimmed.includes('"')) {
                        try { cleanRow[key] = JSON.parse(trimmed); } catch { cleanRow[key] = trimmed; }
                    } else {
                        cleanRow[key] = trimmed;
                    }
                } else {
                    cleanRow[key] = String(value);
                }
            });
            return cleanRow;
        });

        console.log('[ReportPrintService] Generating PDF for template:', targetTemplate.name, formattedInputs);

        const pdfUint8 = await generate({
            template: targetTemplate.template,
            inputs: formattedInputs,
            plugins: PDF_PLUGINS
        });

        const blob = new Blob([pdfUint8.buffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const fileName = customFileName || `${targetTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.pdf`;

        if (actionTarget === 'DOWNLOAD') {
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success(`🎉 PDF "${targetTemplate.name}" berhasil diunduh!`);
        } else if (actionTarget === 'PREVIEW') {
            window.open(url, '_blank');
            toast.success(`✨ Preview PDF "${targetTemplate.name}" dibuka!`);
        } else {
            // Default: PRINT
            const printIframe = document.createElement('iframe');
            printIframe.style.position = 'fixed';
            printIframe.style.top = '-9999px';
            printIframe.style.left = '-9999px';
            printIframe.src = url;
            document.body.appendChild(printIframe);

            printIframe.onload = () => {
                setTimeout(() => {
                    printIframe.contentWindow?.focus();
                    printIframe.contentWindow?.print();
                    toast.success(`🖨️ Dokumen "${targetTemplate.name}" dikirim ke Printer!`);
                }, 300);
            };
        }

        return { ok: true, url, blob, template: targetTemplate };
    } catch (err) {
        console.error('[ReportPrintService] Execution error:', err);
        toast.error(`❌ Gagal mencetak laporan: ${err.message}`);
        return { ok: false, error: err.message };
    }
}
