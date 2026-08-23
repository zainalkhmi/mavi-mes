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
                        headStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 7.5, fontColor: '#ffffff', backgroundColor: '#4c1d95', borderColor: '', borderWidth: { top: 0, right: 0, bottom: 0, left: 0 }, padding: { top: 2.5, right: 2, bottom: 2.5, left: 2 } },
                        bodyStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 7, fontColor: '#000000', backgroundColor: '', borderColor: '#888888', borderWidth: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 }, padding: { top: 2.5, right: 2, bottom: 2.5, left: 2 }, alternateBackgroundColor: '#fdfbfd' },
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
        }
    }
];

/**
 * Get all available report templates
 */
export function getSavedReportTemplates() {
    try {
        const saved = localStorage.getItem('mandor_pdf_templates_v5') ||
                      localStorage.getItem('mandor_pdf_templates_v4') ||
                      localStorage.getItem('mandor_pdf_templates_v3');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
    actionTarget = 'PRINT', // 'PRINT' | 'DOWNLOAD' | 'PREVIEW'
    resolvedInputs = {},
    customFileName = null
}) {
    try {
        const allTemplates = getSavedReportTemplates();
        const targetTemplate = allTemplates.find(t => t.id === templateId) || allTemplates[0];

        if (!targetTemplate) {
            throw new Error(`Template dengan ID "${templateId}" tidak ditemukan.`);
        }

        const inputData = Array.isArray(resolvedInputs) ? resolvedInputs : [resolvedInputs];

        // Format any table fields if passed as arrays or objects
        const formattedInputs = inputData.map(row => {
            const cleanRow = { ...row };
            Object.keys(cleanRow).forEach(k => {
                if (typeof cleanRow[k] === 'object' && cleanRow[k] !== null) {
                    cleanRow[k] = JSON.stringify(cleanRow[k]);
                } else if (cleanRow[k] != null) {
                    cleanRow[k] = String(cleanRow[k]);
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
