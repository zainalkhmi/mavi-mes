/**
 * visionInspectionTemplate.js
 * Generates a Cognitive Vision HMI HML Quality Control template for MAVI-MES
 */

export function createVisionInspectionTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const appVariables = [
        { id: `var_wo_${ts}`, name: 'Work_Order', type: 'string', defaultValue: '', persisted: true },
        { id: `var_lot_${ts}`, name: 'Lot_Number', type: 'string', defaultValue: '', persisted: true },
        { id: `var_operator_${ts}`, name: 'Operator_Name', type: 'string', defaultValue: '@APP_INFO.USER', persisted: false },
        { id: `var_timestamp_${ts}`, name: 'Timestamp', type: 'string', defaultValue: '', persisted: false },
        { id: `var_caliper_lsl_${ts}`, name: 'Caliper_LSL', type: 'number', defaultValue: '25.38', persisted: true },
        { id: `var_caliper_usl_${ts}`, name: 'Caliper_USL', type: 'number', defaultValue: '25.42', persisted: true },
        { id: `var_gauge_lsl_${ts}`, name: 'Gauge_LSL', type: 'number', defaultValue: '0.0', persisted: true },
        { id: `var_gauge_usl_${ts}`, name: 'Gauge_USL', type: 'number', defaultValue: '55.0', persisted: true },
        { id: `var_target_parts_${ts}`, name: 'Target_Parts', type: 'number', defaultValue: '3', persisted: true }
    ];

    const step1 = {
        id: `step_setup_${ts}`,
        title: 'QC Work Order Setup',
        stepType: 'Step',
        components: [
            {
                id: `s1_h1_${ts}`, type: 'TEXT',
                x: 50, y: 30, w: 900, h: 50,
                props: { text: '👁️ Cognitive Vision & Quality Inspection', fontSize: 26, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' }
            },
            {
                id: `s1_s1_${ts}`, type: 'TEXT',
                x: 50, y: 80, w: 900, h: 30,
                props: { text: 'Konfigurasi stasiun kerja dan masukkan Work Order untuk memulai inspeksi otomatis', fontSize: 13, color: '#64748b', textAlign: 'center' }
            },
            {
                id: `s1_wo_input_${ts}`, type: 'TEXT_INPUT',
                x: 200, y: 150, w: 600, h: 50,
                props: { label: 'Work Order ID / Nomor Seri', placeholder: 'WO-2026-XYZ...', targetVariable: 'Work_Order', required: true }
            },
            {
                id: `s1_lot_input_${ts}`, type: 'TEXT_INPUT',
                x: 200, y: 230, w: 600, h: 50,
                props: { label: 'Lot Number / Batch', placeholder: 'LOT-A-982...', targetVariable: 'Lot_Number', required: true }
            },
            {
                id: `s1_start_btn_${ts}`, type: 'BUTTON',
                x: 200, y: 340, w: 600, h: 60,
                props: {
                    label: 'MULAI INSPEKSI OTOMATIS ▶',
                    backgroundColor: '#7c3aed', color: 'white', fontSize: 16, fontWeight: 'bold',
                    triggers: [{ name: 'Start QC Flow', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };

    const step2 = {
        id: `step_qc_vision_${ts}`,
        title: 'Cognitive QC Inspection',
        stepType: 'Step',
        components: [
            {
                id: `s2_h1_${ts}`, type: 'TEXT',
                x: 50, y: 20, w: 900, h: 40,
                props: { text: '🔍 Stasiun Quality Control Vision', fontSize: 22, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `s2_desc_${ts}`, type: 'TEXT',
                x: 50, y: 65, w: 900, h: 30,
                props: { text: 'Arahkan produk ke area kamera. Sistem akan menganalisis kesesuaian dimensi & kelayakan kualitas secara real-time.', fontSize: 12, color: '#64748b' }
            },
            {
                id: `s2_opencv_cam_${ts}`, type: 'OPENCV_CAMERA',
                x: 50, y: 110, w: 420, h: 480,
                props: { label: 'Kamera Inspeksi Kualitas', filterType: 'INSPECTION', thresholdValue: 100 }
            },
            {
                id: `s2_instructions_${ts}`, type: 'TEXT',
                x: 500, y: 110, w: 450, h: 280,
                props: { 
                    text: 'PETUNJUK INSPEKSI:\n\n1. Letakkan produk rata di bawah lingkaran pemandu LED.\n2. Pastikan sisi penutup menghadap ke atas.\n3. Periksa status hasil pada layar:\n   - OK - PASS (Hijau): Produk layak kirim.\n   - NG - REJECT (Merah): Pindahkan produk ke tempat defect.\n4. Aktifkan sakelar Auto-Save pada kamera untuk perekaman database otomatis.', 
                    fontSize: 12, 
                    color: '#334155',
                    backgroundColor: '#f8fafc',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    lineHeight: '1.6'
                }
            },
            {
                id: `s2_next_btn_${ts}`, type: 'BUTTON',
                x: 500, y: 410, w: 450, h: 50,
                props: {
                    label: 'LANJUT KE DIMENSIONAL VERIFICATION ▶',
                    backgroundColor: '#7c3aed', color: 'white', fontSize: 14, fontWeight: 'bold',
                    triggers: [{ name: 'Goto Step 3', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };

    const step3 = {
        id: `step_dimensional_${ts}`,
        title: 'Caliper & Pressure Verification',
        stepType: 'Step',
        components: [
            {
                id: `s3_h1_${ts}`, type: 'TEXT',
                x: 50, y: 20, w: 900, h: 40,
                props: { text: '📏 Verifikasi Dimensi & Tekanan Alat Ukur', fontSize: 22, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `s3_opencv_caliper_${ts}`, type: 'OPENCV_CAMERA',
                x: 50, y: 80, w: 420, h: 460,
                props: { label: 'OCR Digital Caliper Reader', filterType: 'CALIPER_OCR', thresholdValue: 100 }
            },
            {
                id: `s3_opencv_dial_${ts}`, type: 'OPENCV_CAMERA',
                x: 500, y: 80, w: 450, h: 460,
                props: { label: 'Analog Dial Gauge Reader', filterType: 'DIAL_GAUGE', thresholdValue: 100 }
            },
            {
                id: `s3_specs_info_${ts}`, type: 'TEXT',
                x: 50, y: 550, w: 900, h: 30,
                props: { 
                    text: '⚙️ Toleransi Spesifikasi Produk Aktif: Caliper LSL: 25.38 mm, Caliper USL: 25.42 mm | Gauge USL: 55.0 PSI', 
                    fontSize: 12, 
                    color: '#475569', 
                    textAlign: 'center',
                    fontWeight: 'bold'
                }
            },
            {
                id: `s3_finish_btn_${ts}`, type: 'BUTTON',
                x: 50, y: 590, w: 900, h: 50,
                props: {
                    label: 'SELESAIKAN INSPEKSI & SUBMIT LAPORAN ✓',
                    backgroundColor: '#10b981', color: 'white', fontSize: 14, fontWeight: 'bold',
                    triggers: [
                        { name: 'Finish QC Session', event: 'ON_CLICK', actions: [
                            { type: 'SHOW_MESSAGE', payload: { message: 'Inspeksi Kualitas Berhasil Disimpan ke Cloud! ✓', msgType: 'success' } },
                            { type: 'COMPLETE_APP' }
                        ] }
                    ]
                }
            }
        ]
    };

    return {
        id: `app_vision_inspection_${ts}`,
        name: 'Cognitive Vision & Quality Inspection',
        description: 'Automated vision inspection system utilizing edge detection, dial gauge needles, digital calipers (OCR), part counting, and barcode scanning in real-time.',
        category: 'Quality',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,

        config: {
            appVariables,
            recordPlaceholders: [
                {
                    id: `rp_vision_${ts}`,
                    name: 'Vision_Record',
                    tableId: 'live_measurements',
                    description: 'Vision inspection log record'
                }
            ],
            appTables: ['live_measurements'],
            appTriggers: [
                {
                    id: `trig_start_vision_${ts}`,
                    name: 'Vision Module Start',
                    event: 'ON_APP_START',
                    actions: [
                        { type: 'SHOW_MESSAGE', payload: { message: '👁️ Vision QC Module Ready', msgType: 'info' } }
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
