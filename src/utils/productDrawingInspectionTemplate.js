/**
 * productDrawingInspectionTemplate.js
 * Generates an advanced Quality Inspection application using interactive 2D blueprint engineering drawings
 * and interactive 3D CAD models, modeled after modern QMS manufacturing suites.
 * Integrates with drawings designed in the Inspector Designer via 'dwg_product_checking'.
 */

export function createProductDrawingInspectionTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    // Table references for replacement in AppStore
    const T = {
        inspectionPlans: 'tbl_qi_inspection_plans',
        inspectionResults: 'tbl_qi_inspection_results'
    };

    // Variables for the app
    const V = [
        { id: `v_wo_${ts}`, name: 'Work_Order_ID', type: 'string', defaultValue: 'WO-2026-FLG-08', persisted: true },
        { id: `v_pid_${ts}`, name: 'Product_ID', type: 'string', defaultValue: 'CAD-FLANGE-100', persisted: true },
        { id: `v_op_${ts}`, name: 'Operator_Name', type: 'string', defaultValue: 'QC-Operator-1', persisted: true },
        { id: `v_qc_${ts}`, name: 'QC_Check_Status', type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: `v_balloon_${ts}`, name: 'Balloon_Marker', type: 'number', defaultValue: 0, persisted: false },
        { id: `v_trige_${ts}`, name: 'Trigger_Output', type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: `v_gamra_${ts}`, name: 'Vision_Camera_Val', type: 'number', defaultValue: 0, persisted: false },
        { id: `v_2d_${ts}`, name: 'Linear_2D_Val', type: 'number', defaultValue: 0, persisted: false },
        { id: `v_pdf_${ts}`, name: 'PDF_Thickness_Val', type: 'number', defaultValue: 0, persisted: false },
        { id: `v_3d_${ts}`, name: 'CAD_Angle_Val', type: 'number', defaultValue: 0, persisted: false },
        { id: `v_active_dim_${ts}`, name: 'Active_Dimension_Key', type: 'string', defaultValue: 'Linear_2D_Val', persisted: false },
        { id: `v_notes_${ts}`, name: 'Notes', type: 'string', defaultValue: '', persisted: false },
        { id: `v_sig_${ts}`, name: 'Signature', type: 'string', defaultValue: '', persisted: false }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Selected_Plan', tableId: T.inspectionPlans, type: 'single' }
    ];

    // --- STEP 1: Inisialisasi Inspeksi (Setup & Info) ---
    const stepSetup = {
        id: `s_setup_${ts}`,
        title: '1. Inisialisasi Pengecekan',
        stepType: 'Step',
        components: [
            // Heading
            {
                id: `st_lbl_title_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 900, h: 35,
                props: { text: '⚙️ Inisialisasi Pengecekan Kualitas Produk (CAD/Blueprint)', fontSize: 22, fontWeight: 'bold' }
            },
            // Left Panel: Work Order & Product Info Card
            {
                id: `st_lbl_subtitle_${ts}`, type: 'TEXT',
                x: 20, y: 55, w: 900, h: 25,
                props: { text: 'Masukkan data Work Order dan identitas operator sebelum memulai inspeksi visual 2D/3D.', fontSize: 13, color: '#64748b' }
            },
            {
                id: `st_card_left_${ts}`, type: 'TEXT',
                x: 20, y: 100, w: 460, h: 360,
                props: { 
                    text: '📦 IDENTIFIKASI PRODUK & WORK ORDER\n\nNomor Work Order (WO):\n{{@Work_Order_ID}}\n\nKode Produk:\n{{@Product_ID}}\n\nNama Produk:\nIndustrial Flange Connector Type A\n\nVersi Desain CAD:\nREV. 2.1 (Released 2026)', 
                    fontSize: 15, 
                    fontWeight: 'bold',
                    backgroundColor: '#f8fafc',
                    color: '#1e293b',
                    padding: '24px',
                    borderRadius: '8px'
                }
            },
            // Right Panel: Form Inputs
            {
                id: `st_card_right_${ts}`, type: 'TEXT',
                x: 500, y: 100, w: 440, h: 360,
                props: { 
                    text: '📋 VALIDASI OPERATOR\n\nMasukkan nama operator yang bertugas melakukan pengecekan:',
                    fontSize: 14,
                    fontWeight: 'bold',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    padding: '24px',
                    borderRadius: '8px'
                }
            },
            {
                id: `st_in_op_${ts}`, type: 'TEXT_INPUT',
                x: 524, y: 220, w: 390, h: 42,
                props: { targetVariable: 'Operator_Name', placeholder: 'Nama Operator QC...' }
            },
            {
                id: `st_in_wo_${ts}`, type: 'TEXT_INPUT',
                x: 524, y: 300, w: 390, h: 42,
                props: { targetVariable: 'Work_Order_ID', placeholder: 'WO-2026-FLG-08' }
            },
            // Instructions Alert inside form
            {
                id: `st_alert_info_${ts}`, type: 'TEXT',
                x: 524, y: 370, w: 390, h: 60,
                props: { 
                    text: '💡 Aplikasi ini memuat model CAD 3D interaktif dan gambar blueprint 2D. Pastikan hardware grafis Anda berjalan dengan baik.', 
                    fontSize: 12, 
                    color: '#0369a1',
                    backgroundColor: '#f0f9ff',
                    padding: '10px',
                    borderRadius: '6px'
                }
            },
            // Footer Action
            {
                id: `st_btn_start_${ts}`, type: 'BUTTON',
                x: 740, y: 495, w: 200, h: 48,
                props: { text: 'Mulai Inspeksi 2D →', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_2d_drawing_${ts}` }]
            }
        ]
    };

    // --- STEP 2: Dimensi 2D Drawing ---
    const step2DDrawing = {
        id: `s_2d_drawing_${ts}`,
        title: '2. Dimensi 2D Drawing',
        stepType: 'Step',
        components: [
            // Title block
            {
                id: `d2_lbl_title_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 900, h: 30,
                props: { text: '📐 Pengecekan Dimensi pada Blueprint 2D', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `d2_lbl_desc_${ts}`, type: 'TEXT',
                x: 20, y: 45, w: 900, h: 20,
                props: { text: 'Klik pada label dimensi di blueprint untuk memasukkan hasil ukur aktual.', fontSize: 13, color: '#64748b' }
            },
            // Left Panel: CAD 2D Blueprint Viewer points to dwg_product_checking
            {
                id: `d2_cad_2d_${ts}`, type: 'CAD_VIEWER',
                x: 20, y: 75, w: 560, h: 400,
                props: { 
                    title: 'Product Blueprint (2D / PDF)',
                    fileUrl: 'dwg_product_checking',
                    showGrid: false
                }
            },
            // Right Panel: Input Panel based on active dimension
            {
                id: `d2_panel_input_${ts}`, type: 'TEXT',
                x: 600, y: 75, w: 340, h: 400,
                props: { 
                    text: '🔧 HASIL UKUR AKTUAL\n\nSilakan masukkan nilai pengukuran jangka sorong (caliper) & PDF backdrop:',
                    fontSize: 14,
                    fontWeight: 'bold',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    padding: '20px',
                    borderRadius: '8px'
                }
            },
            // Active Dimension Indicator Label (rendered dynamically based on Active_Dimension_Key)
            {
                id: `d2_active_indicator_${ts}`, type: 'TEXT',
                x: 620, y: 150, w: 300, h: 60,
                props: {
                    text: 'Dimensi Terpilih: {{@Active_Dimension_Key}}\nTarget Spec: Sesuai Gambar CAD',
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#2563eb',
                    backgroundColor: '#eff6ff',
                    padding: '12px',
                    borderRadius: '6px'
                }
            },
            // Numeric Input Boxes for the measured variables
            {
                id: `d2_lbl_len_${ts}`, type: 'TEXT',
                x: 620, y: 225, w: 180, h: 20,
                props: { text: '1. 2D Length Dimension [49.8 - 50.2]', fontSize: 12, fontWeight: 'bold' }
            },
            {
                id: `d2_in_len_${ts}`, type: 'TEXT_INPUT',
                x: 620, y: 245, w: 180, h: 36,
                props: { targetVariable: 'Linear_2D_Val', placeholder: '50.0' }
            },
            {
                id: `d2_unit_len_${ts}`, type: 'TEXT',
                x: 810, y: 245, w: 50, h: 36,
                props: { text: 'mm', fontSize: 14, fontWeight: 'bold', padding: '8px' }
            },

            {
                id: `d2_lbl_pdf_${ts}`, type: 'TEXT',
                x: 620, y: 295, w: 180, h: 20,
                props: { text: '2. PDF Thickness Check [11.8 - 12.2]', fontSize: 12, fontWeight: 'bold' }
            },
            {
                id: `d2_in_pdf_${ts}`, type: 'TEXT_INPUT',
                x: 620, y: 315, w: 180, h: 36,
                props: { targetVariable: 'PDF_Thickness_Val', placeholder: '12.0' }
            },
            {
                id: `d2_unit_pdf_${ts}`, type: 'TEXT',
                x: 810, y: 315, w: 50, h: 36,
                props: { text: 'mm', fontSize: 14, fontWeight: 'bold', padding: '8px' }
            },

            {
                id: `d2_lbl_balloon_${ts}`, type: 'TEXT',
                x: 620, y: 365, w: 180, h: 20,
                props: { text: '3. Balloon Marker [9.5 - 10.5]', fontSize: 12, fontWeight: 'bold' }
            },
            {
                id: `d2_in_balloon_${ts}`, type: 'TEXT_INPUT',
                x: 620, y: 385, w: 180, h: 36,
                props: { targetVariable: 'Balloon_Marker', placeholder: '10.0' }
            },
            {
                id: `d2_unit_balloon_${ts}`, type: 'TEXT',
                x: 810, y: 385, w: 50, h: 36,
                props: { text: 'mm', fontSize: 14, fontWeight: 'bold', padding: '8px' }
            },

            // Footer Navigation
            {
                id: `d2_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Kembali', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_setup_${ts}` }]
            },
            {
                id: `d2_btn_next_${ts}`, type: 'BUTTON',
                x: 790, y: 495, w: 150, h: 45,
                props: { text: 'Lanjut ke 3D →', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_3d_assembly_${ts}` }]
            }
        ]
    };

    // --- STEP 3: Visual 3D Assembly ---
    const step3DAssembly = {
        id: `s_3d_assembly_${ts}`,
        title: '3. Visual 3D Assembly & Parameter',
        stepType: 'Step',
        components: [
            // Title block
            {
                id: `d3_lbl_title_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 900, h: 30,
                props: { text: '📦 Inspeksi Model CAD 3D Twin & Parameter Lanjutan', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `d3_lbl_desc_${ts}`, type: 'TEXT',
                x: 20, y: 45, w: 900, h: 20,
                props: { text: 'Gunakan mouse untuk orbit/zoom model 3D. Catat nilai sudut 3D, status QC, trigger, dan kamera.', fontSize: 13, color: '#64748b' }
            },
            // Left Panel: CAD 3D Interactive Model Viewer points to dwg_product_checking
            {
                id: `d3_cad_3d_${ts}`, type: 'CAD_VIEWER',
                x: 20, y: 75, w: 560, h: 400,
                props: { 
                    title: 'Interactive 3D CAD Twin',
                    fileUrl: 'dwg_product_checking',
                    autoRotate: false,
                    showGrid: true
                }
            },
            // Right Panel: Visual Criteria & Additional Parameters
            {
                id: `d3_panel_crit_${ts}`, type: 'TEXT',
                x: 600, y: 75, w: 340, h: 400,
                props: { 
                    text: '🔍 PARAMETER INSPEKSI CAD\n\nIsi parameter kualitas 3D & QC berikut:',
                    fontSize: 14,
                    fontWeight: 'bold',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    padding: '20px',
                    borderRadius: '8px'
                }
            },
            // 3D Angle Input
            {
                id: `d3_lbl_angle_${ts}`, type: 'TEXT',
                x: 620, y: 140, w: 300, h: 18,
                props: { text: '1. 3D Included Angle [89.5 - 90.5] deg', fontSize: 11, fontWeight: 'bold' }
            },
            {
                id: `d3_in_angle_${ts}`, type: 'TEXT_INPUT',
                x: 620, y: 158, w: 140, h: 32,
                props: { targetVariable: 'CAD_Angle_Val', placeholder: '90.0' }
            },

            // QC Check Status buttons
            {
                id: `d3_lbl_qc_${ts}`, type: 'TEXT',
                x: 620, y: 200, w: 300, h: 18,
                props: { text: '2. QC Check Status (qc)', fontSize: 11, fontWeight: 'bold' }
            },
            {
                id: `d3_btn_qc_pass_${ts}`, type: 'BUTTON',
                x: 620, y: 218, w: 130, h: 32,
                props: { text: '✓ PASS', backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 'bold' },
                triggers: [{
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'QC_Check_Status', value: 'PASS' } },
                        { type: 'SHOW_MESSAGE', payload: { message: 'QC Status set to PASS', msgType: 'success' } }
                    ]
                }]
            },
            {
                id: `d3_btn_qc_fail_${ts}`, type: 'BUTTON',
                x: 760, y: 218, w: 130, h: 32,
                props: { text: '❌ FAIL', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold' },
                triggers: [{
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'QC_Check_Status', value: 'FAIL' } },
                        { type: 'SHOW_MESSAGE', payload: { message: 'QC Status set to FAIL!', msgType: 'error' } }
                    ]
                }]
            },

            // Trigger Output status buttons
            {
                id: `d3_lbl_trigger_${ts}`, type: 'TEXT',
                x: 620, y: 260, w: 300, h: 18,
                props: { text: '3. Trigger Output Status (trige)', fontSize: 11, fontWeight: 'bold' }
            },
            {
                id: `d3_btn_trig_pass_${ts}`, type: 'BUTTON',
                x: 620, y: 278, w: 130, h: 32,
                props: { text: '⚡ PASS', backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 'bold' },
                triggers: [{
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'Trigger_Output', value: 'PASS' } },
                        { type: 'SHOW_MESSAGE', payload: { message: 'Trigger status OK', msgType: 'success' } }
                    ]
                }]
            },
            {
                id: `d3_btn_trig_fail_${ts}`, type: 'BUTTON',
                x: 760, y: 278, w: 130, h: 32,
                props: { text: '⚡ FAIL', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold' },
                triggers: [{
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'Trigger_Output', value: 'FAIL' } },
                        { type: 'SHOW_MESSAGE', payload: { message: 'Trigger check FAILED! Stop machine triggered.', msgType: 'error' } }
                    ]
                }]
            },

            // Camera/Vision FPS check
            {
                id: `d3_lbl_cam_${ts}`, type: 'TEXT',
                x: 620, y: 320, w: 300, h: 18,
                props: { text: '4. Camera/Vision Check (gamra) [23.5 - 24.5] fps', fontSize: 11, fontWeight: 'bold' }
            },
            {
                id: `d3_in_cam_${ts}`, type: 'TEXT_INPUT',
                x: 620, y: 338, w: 140, h: 32,
                props: { targetVariable: 'Vision_Camera_Val', placeholder: '24.0' }
            },

            // Notes Text Input
            {
                id: `d3_in_notes_${ts}`, type: 'TEXT_INPUT',
                x: 620, y: 385, w: 280, h: 50,
                props: { targetVariable: 'Notes', placeholder: 'Ketik komentar di sini...' }
            },

            // Footer Navigation
            {
                id: `d3_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Kembali', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_2d_drawing_${ts}` }]
            },
            {
                id: `d3_btn_next_${ts}`, type: 'BUTTON',
                x: 790, y: 495, w: 150, h: 45,
                props: { text: 'Lanjut ke Hasil →', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_summary_${ts}` }]
            }
        ]
    };

    // --- STEP 4: Ringkasan Hasil & Sign-Off ---
    const stepSummary = {
        id: `s_summary_${ts}`,
        title: '4. Ringkasan & Sign-Off',
        stepType: 'Step',
        components: [
            // Title
            {
                id: `sm_lbl_title_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 900, h: 30,
                props: { text: '📊 Ringkasan Hasil Inspeksi & Otorisasi', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `sm_lbl_desc_${ts}`, type: 'TEXT',
                x: 20, y: 45, w: 900, h: 20,
                props: { text: 'Review semua data sebelum membubuhkan tanda tangan digital operator.', fontSize: 13, color: '#64748b' }
            },
            // Left Panel: Table of results
            {
                id: `sm_card_summary_${ts}`, type: 'TEXT',
                x: 20, y: 75, w: 460, h: 400,
                props: {
                    text: '📋 TABEL EVALUASI PENGECEKAN\n\n🔹 Hasil Pengukuran 2D & PDF:\n  - 2D Length (Spec 50 ±0.2): {{@Linear_2D_Val}} mm\n  - PDF Thickness (Spec 12 ±0.2): {{@PDF_Thickness_Val}} mm\n  - Balloon Marker (Spec 10 ±0.5): {{@Balloon_Marker}} mm\n\n🔹 Hasil Pengecekan 3D & QC:\n  - 3D Included Angle (Spec 90 ±0.5): {{@CAD_Angle_Val}} °\n  - QC Check Status: {{@QC_Check_Status}}\n  - Trigger Output Status: {{@Trigger_Output}}\n  - Camera/Vision Check (Spec 24 ±0.5): {{@Vision_Camera_Val}} fps\n\n🔹 Catatan Operator:\n{{@Notes}}',
                    fontSize: 13,
                    fontWeight: 'bold',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    padding: '24px',
                    borderRadius: '8px'
                }
            },
            // Right Panel: Signature Pad
            {
                id: `sm_panel_sig_${ts}`, type: 'TEXT',
                x: 500, y: 75, w: 440, h: 400,
                props: {
                    text: '✍️ TANDA TANGAN DIGITAL OPERATOR\n\nBubuhkan tanda tangan Anda di panel bawah ini:',
                    fontSize: 14,
                    fontWeight: 'bold',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    padding: '20px',
                    borderRadius: '8px'
                }
            },
            {
                id: `sm_sig_widget_${ts}`, type: 'SIGNATURE',
                x: 520, y: 155, w: 400, h: 200,
                props: {
                    targetVariable: 'Signature',
                    placeholder: 'Tanda tangan di sini...'
                }
            },
            // Button to clear signature
            {
                id: `sm_btn_clear_sig_${ts}`, type: 'BUTTON',
                x: 520, y: 365, w: 120, h: 36,
                props: { text: 'Hapus TTD', backgroundColor: '#f1f5f9', color: '#475569', fontSize: 12 },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Tanda tangan dibersihkan.', messageType: 'info' }]
            },
            // Submit Button
            {
                id: `sm_btn_submit_${ts}`, type: 'BUTTON',
                x: 740, y: 495, w: 200, h: 48,
                props: { text: '✓ Selesai & Kirim', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Hasil inspeksi QC berhasil disimpan ke database cloud!', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_setup_${ts}` }
                ]
            },
            // Footer Navigation Back
            {
                id: `sm_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Kembali', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_3d_assembly_${ts}` }]
            }
        ]
    };

    return {
        id: `app_pdi_${ts}`,
        name: 'Product Drawing QC Terminal',
        description: 'Lakukan pengecekan presisi dimensi & visual produk menggunakan blueprint 2D interaktif dan 3D CAD digital twin rakitan.',
        category: 'Quality',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.inspectionPlans, T.inspectionResults],
            appTriggers: [],
            steps: [stepSetup, step2DDrawing, step3DAssembly, stepSummary],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
