/**
 * mobileScanInspectionTemplate.js
 * Generates a Mobile-optimized Scan & Vision Camera template for MANDOR-MES
 */

export function createMobileScanInspectionTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const appVariables = [
        { id: `var_op_${ts}`, name: 'Operator_Name', type: 'string', defaultValue: '@APP_INFO.USER', persisted: false },
        { id: `var_barcode_${ts}`, name: 'Scanned_Barcode', type: 'string', defaultValue: '', persisted: false },
        { id: `var_timestamp_${ts}`, name: 'Timestamp', type: 'string', defaultValue: '', persisted: false }
    ];

    const step1 = {
        id: `step_scan_${ts}`,
        title: 'Barcode Scan Setup',
        stepType: 'Step',
        components: [
            {
                id: `s1_header_bg_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 320, h: 56,
                props: { backgroundColor: '#0f172a', borderRadius: 0 }
            },
            {
                id: `s1_header_title_${ts}`, type: 'TEXT',
                x: 10, y: 14, w: 300, h: 28,
                props: { text: '📲 Mobile Scanner MES', fontSize: 16, color: 'white', fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `s1_desc_${ts}`, type: 'TEXT',
                x: 16, y: 72, w: 288, h: 36,
                props: { text: 'Scan barcode barang untuk memverifikasi ID & lot sebelum melakukan pengecekan visual.', fontSize: 11, color: '#64748b' }
            },
            {
                id: `s1_op_input_${ts}`, type: 'TEXT_INPUT',
                x: 16, y: 120, w: 288, h: 48,
                props: { label: 'Nama Operator', placeholder: 'Input nama operator...', targetVariable: 'Operator_Name', required: true }
            },
            {
                id: `s1_barcode_scanner_${ts}`, type: 'BARCODE_SCANNER',
                x: 16, y: 180, w: 288, h: 160,
                props: { placeholder: 'Scan Barcode Barang...', targetVariable: 'Scanned_Barcode', autoFocus: true }
            },
            {
                id: `s1_barcode_val_${ts}`, type: 'VARIABLE_TEXT',
                x: 16, y: 350, w: 288, h: 32,
                props: { label: 'Hasil Scan', prefix: 'ID Barang: ', variableName: 'Scanned_Barcode', fontSize: 12, fontWeight: 'bold', color: '#1e293b' }
            },
            {
                id: `s1_next_btn_${ts}`, type: 'BUTTON',
                x: 16, y: 410, w: 288, h: 48,
                props: {
                    label: 'LANJUT KE VISION CAMERA ▶',
                    backgroundColor: '#3b82f6', color: 'white', fontSize: 12, fontWeight: 'bold',
                    triggers: [{ name: 'Goto Vision', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };

    const step2 = {
        id: `step_vision_${ts}`,
        title: 'Vision Camera QC',
        stepType: 'Step',
        components: [
            {
                id: `s2_header_bg_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 320, h: 56,
                props: { backgroundColor: '#0f172a', borderRadius: 0 }
            },
            {
                id: `s2_header_title_${ts}`, type: 'TEXT',
                x: 10, y: 14, w: 300, h: 28,
                props: { text: '👁️ Vision Inspection', fontSize: 16, color: 'white', fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `s2_desc_${ts}`, type: 'TEXT',
                x: 16, y: 72, w: 288, h: 36,
                props: { text: 'Posisikan barang di depan kamera. Sistem OpenCV akan mendeteksi cacat fisik otomatis.', fontSize: 11, color: '#64748b' }
            },
            {
                id: `s2_opencv_cam_${ts}`, type: 'OPENCV_CAMERA',
                x: 16, y: 120, w: 288, h: 200,
                props: { label: 'Kamera Inspeksi Barang', filterType: 'INSPECTION', thresholdValue: 100 }
            },
            {
                id: `s2_result_check_${ts}`, type: 'QUALITY_PASS_FAIL',
                x: 16, y: 330, w: 288, h: 60,
                props: { label: 'Hasil Inspeksi Visual' }
            },
            {
                id: `s2_next_btn_${ts}`, type: 'BUTTON',
                x: 16, y: 410, w: 288, h: 48,
                props: {
                    label: 'LANJUT KE RINGKASAN ▶',
                    backgroundColor: '#3b82f6', color: 'white', fontSize: 12, fontWeight: 'bold',
                    triggers: [{ name: 'Goto Summary', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };

    const step3 = {
        id: `step_summary_${ts}`,
        title: 'Review & Submit',
        stepType: 'Step',
        components: [
            {
                id: `s3_header_bg_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 320, h: 56,
                props: { backgroundColor: '#0f172a', borderRadius: 0 }
            },
            {
                id: `s3_header_title_${ts}`, type: 'TEXT',
                x: 10, y: 14, w: 300, h: 28,
                props: { text: '📋 Laporan Akhir', fontSize: 16, color: 'white', fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `s3_barcode_val_${ts}`, type: 'VARIABLE_TEXT',
                x: 16, y: 72, w: 288, h: 36,
                props: { label: 'Barang Terdaftar', prefix: 'ID Barang: ', variableName: 'Scanned_Barcode', fontSize: 13, fontWeight: 'bold', color: '#1e293b' }
            },
            {
                id: `s3_op_val_${ts}`, type: 'VARIABLE_TEXT',
                x: 16, y: 120, w: 288, h: 36,
                props: { label: 'Operator', prefix: 'Nama: ', variableName: 'Operator_Name', fontSize: 13, fontWeight: 'bold', color: '#1e293b' }
            },
            {
                id: `s3_confirm_txt_${ts}`, type: 'TEXT',
                x: 16, y: 170, w: 288, h: 60,
                props: { text: 'Harap verifikasi bahwa data di atas sudah benar sebelum menyimpan log inspeksi ke database utama.', fontSize: 11, color: '#64748b', lineHeight: '1.5' }
            },
            {
                id: `s3_submit_btn_${ts}`, type: 'BUTTON',
                x: 16, y: 410, w: 288, h: 48,
                props: {
                    label: '✓ SIMPAN DATA INSPEKSI',
                    backgroundColor: '#10b981', color: 'white', fontSize: 13, fontWeight: 'bold',
                    triggers: [
                        {
                            name: 'Save Inspection', event: 'ON_CLICK', actions: [
                                { type: 'TABLE_RECORD_SAVE', payload: { placeholderId: 'Mobile_Scan_Record' } },
                                { type: 'SHOW_MESSAGE', payload: { message: 'Data scan & vision berhasil disimpan! ✓', msgType: 'success' } },
                                { type: 'COMPLETE_APP' }
                            ]
                        }
                    ]
                }
            }
        ]
    };

    return {
        id: `app_mobile_scan_vision_${ts}`,
        name: 'Mobile Scan & Vision QC',
        description: 'Mobile-optimized barcode scanning and OpenCV camera inspection for quick stock routing and quality verification.',
        category: 'Quality',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,

        config: {
            devicePreset: 'PHONE_APP_INVENTOR',
            previewOrientation: 'PORTRAIT',
            scalingMode: 'FIT_SCREEN',
            appVariables,
            recordPlaceholders: [
                {
                    id: `rp_mobile_scan_${ts}`,
                    name: 'Mobile_Scan_Record',
                    tableId: 'mobile_scan_logs',
                    description: 'Mobile scan inspection log record'
                }
            ],
            appTables: ['mobile_scan_logs'],
            appTriggers: [
                {
                    id: `trig_start_mobile_scan_${ts}`,
                    name: 'Mobile Scan Module Start',
                    event: 'ON_APP_START',
                    actions: [
                        { type: 'SHOW_MESSAGE', payload: { message: '📲 Mobile Scan Module Active', msgType: 'info' } }
                    ]
                }
            ],
            steps: [
                step1,
                step2,
                step3
            ]
        }
    };
}
