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
    }
];

/**
 * Get all available report templates
 */
export function getSavedReportTemplates() {
    try {
        const saved = localStorage.getItem('mandor_pdf_templates_v4') || localStorage.getItem('mandor_pdf_templates_v3');
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
