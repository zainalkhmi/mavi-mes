/**
 * productDrawingInspectionTemplate.js
 * Generates an advanced Quality Inspection application using interactive 2D blueprint engineering drawings
 * and interactive 3D CAD models, modeled after modern QMS manufacturing suites.
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
        { id: `v_len_${ts}`, name: 'Meas_Length', type: 'number', defaultValue: 0, persisted: false },
        { id: `v_diam_${ts}`, name: 'Meas_Diameter', type: 'number', defaultValue: 0, persisted: false },
        { id: `v_bore_${ts}`, name: 'Meas_Bore', type: 'number', defaultValue: 0, persisted: false },
        { id: `v_weld_${ts}`, name: 'Visual_Weld', type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: `v_screws_${ts}`, name: 'Visual_Screws', type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: `v_active_dim_${ts}`, name: 'Active_Dimension_Key', type: 'string', defaultValue: 'length', persisted: false },
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
                props: { text: 'Klik pada label dimensi berkedip di blueprint untuk memasukkan hasil ukur aktual.', fontSize: 13, color: '#64748b' }
            },
            // Left Panel: CAD 2D Blueprint Viewer
            {
                id: `d2_cad_2d_${ts}`, type: 'CAD_VIEWER',
                x: 20, y: 75, w: 560, h: 400,
                props: { 
                    title: 'Engineering Blueprint (REV 2.1)',
                    fileUrl: 'interactive-2d-blueprint',
                    showGrid: false
                }
            },
            // Right Panel: Input Panel based on active dimension
            {
                id: `d2_panel_input_${ts}`, type: 'TEXT',
                x: 600, y: 75, w: 340, h: 400,
                props: { 
                    text: '🔧 HASIL UKUR AKTUAL\n\nSilakan masukkan nilai pengukuran jangka sorong (caliper):',
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
                    text: 'Dimensi Terpilih: {{@Active_Dimension_Key}}\nTarget Spec: 120.00 mm ± 0.50',
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#2563eb',
                    backgroundColor: '#eff6ff',
                    padding: '12px',
                    borderRadius: '6px'
                }
            },
            // Numeric Input Boxes for the 3 measured variables
            {
                id: `d2_lbl_len_${ts}`, type: 'TEXT',
                x: 620, y: 225, w: 180, h: 20,
                props: { text: '1. Overall Length (L) [119.5 - 120.5]', fontSize: 12, fontWeight: 'bold' }
            },
            {
                id: `d2_in_len_${ts}`, type: 'TEXT_INPUT',
                x: 620, y: 245, w: 180, h: 36,
                props: { targetVariable: 'Meas_Length', placeholder: '120.0' }
            },
            {
                id: `d2_unit_len_${ts}`, type: 'TEXT',
                x: 810, y: 245, w: 50, h: 36,
                props: { text: 'mm', fontSize: 14, fontWeight: 'bold', padding: '8px' }
            },

            {
                id: `d2_lbl_diam_${ts}`, type: 'TEXT',
                x: 620, y: 295, w: 180, h: 20,
                props: { text: '2. Flange Diameter (D) [79.8 - 80.2]', fontSize: 12, fontWeight: 'bold' }
            },
            {
                id: `d2_in_diam_${ts}`, type: 'TEXT_INPUT',
                x: 620, y: 315, w: 180, h: 36,
                props: { targetVariable: 'Meas_Diameter', placeholder: '80.0' }
            },
            {
                id: `d2_unit_diam_${ts}`, type: 'TEXT',
                x: 810, y: 315, w: 50, h: 36,
                props: { text: 'mm', fontSize: 14, fontWeight: 'bold', padding: '8px' }
            },

            {
                id: `d2_lbl_bore_${ts}`, type: 'TEXT',
                x: 620, y: 365, w: 180, h: 20,
                props: { text: '3. Center Bore (B) [24.9 - 25.1]', fontSize: 12, fontWeight: 'bold' }
            },
            {
                id: `d2_in_bore_${ts}`, type: 'TEXT_INPUT',
                x: 620, y: 385, w: 180, h: 36,
                props: { targetVariable: 'Meas_Bore', placeholder: '25.0' }
            },
            {
                id: `d2_unit_bore_${ts}`, type: 'TEXT',
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
        title: '3. Visual 3D Assembly',
        stepType: 'Step',
        components: [
            // Title block
            {
                id: `d3_lbl_title_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 900, h: 30,
                props: { text: '📦 Inspeksi Visual Model CAD 3D', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `d3_lbl_desc_${ts}`, type: 'TEXT',
                x: 20, y: 45, w: 900, h: 20,
                props: { text: 'Gunakan mouse untuk memutar/zoom model 3D. Periksa titik pengelasan (weld) dan kelengkapan baut (screw).', fontSize: 13, color: '#64748b' }
            },
            // Left Panel: CAD 3D Interactive Model Viewer
            {
                id: `d3_cad_3d_${ts}`, type: 'CAD_VIEWER',
                x: 20, y: 75, w: 560, h: 400,
                props: { 
                    title: 'Interactive 3D CAD Twin',
                    fileUrl: 'interactive-3d-cad',
                    autoRotate: false,
                    showGrid: true
                }
            },
            // Right Panel: Visual Criteria
            {
                id: `d3_panel_crit_${ts}`, type: 'TEXT',
                x: 600, y: 75, w: 340, h: 400,
                props: { 
                    text: '🔍 KELENGKAPAN & KUALITAS RAKITAN\n\nKonfirmasikan status inspeksi visual:',
                    fontSize: 14,
                    fontWeight: 'bold',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    padding: '20px',
                    borderRadius: '8px'
                }
            },
            // Checkpoint 1: Weld Seam Quality
            {
                id: `d3_lbl_weld_${ts}`, type: 'TEXT',
                x: 620, y: 145, w: 300, h: 20,
                props: { text: '1. Sambungan Las / Weld Seam (Hotspot 3D: Merah)', fontSize: 12, fontWeight: 'bold' }
            },
            {
                id: `d3_btn_weld_pass_${ts}`, type: 'BUTTON',
                x: 620, y: 170, w: 140, h: 40,
                props: { text: '✓ PASS (OK)', backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 'bold' },
                triggers: [{
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'Visual_Weld', value: 'PASS' } },
                        { type: 'SHOW_MESSAGE', payload: { message: 'Visual Weld Seam disetujui.', msgType: 'success' } }
                    ]
                }]
            },
            {
                id: `d3_btn_weld_fail_${ts}`, type: 'BUTTON',
                x: 770, y: 170, w: 140, h: 40,
                props: { text: '❌ FAIL (Reject)', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold' },
                triggers: [{
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'Visual_Weld', value: 'FAIL' } },
                        { type: 'SHOW_MESSAGE', payload: { message: 'Defect Las dicatat!', msgType: 'error' } }
                    ]
                }]
            },

            // Checkpoint 2: Screws Assembly Check
            {
                id: `d3_lbl_screws_${ts}`, type: 'TEXT',
                x: 620, y: 235, w: 300, h: 20,
                props: { text: '2. Kelengkapan 8 Baut Pengikat (Hotspot 3D: Biru)', fontSize: 12, fontWeight: 'bold' }
            },
            {
                id: `d3_btn_screws_pass_${ts}`, type: 'BUTTON',
                x: 620, y: 260, w: 140, h: 40,
                props: { text: '✓ Lengkap', backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 'bold' },
                triggers: [{
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'Visual_Screws', value: 'PASS' } },
                        { type: 'SHOW_MESSAGE', payload: { message: 'Jumlah baut lengkap.', msgType: 'success' } }
                    ]
                }]
            },
            {
                id: `d3_btn_screws_fail_${ts}`, type: 'BUTTON',
                x: 770, y: 260, w: 140, h: 40,
                props: { text: '❌ Hilang/Kurang', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold' },
                triggers: [{
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'Visual_Screws', value: 'FAIL' } },
                        { type: 'SHOW_MESSAGE', payload: { message: 'Baut kurang dicatat!', msgType: 'error' } }
                    ]
                }]
            },

            // Notes Text Input
            {
                id: `d3_lbl_notes_${ts}`, type: 'TEXT',
                x: 620, y: 325, w: 300, h: 20,
                props: { text: 'Catatan tambahan terkait inspeksi:', fontSize: 12, fontWeight: 'bold' }
            },
            {
                id: `d3_in_notes_${ts}`, type: 'TEXT_INPUT',
                x: 620, y: 345, w: 290, h: 80,
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
                    text: '📋 TABEL EVALUASI PENGECEKAN\n\n🔹 Dimensi Jangka Sorong:\n  - Length (Spec 120 ±0.5): {{@Meas_Length}} mm\n  - Diameter (Spec 80 ±0.2): {{@Meas_Diameter}} mm\n  - Center Bore (Spec 25 ±0.1): {{@Meas_Bore}} mm\n\n🔹 Pemeriksaan Visual CAD:\n  - Weld Connection: {{@Visual_Weld}}\n  - Baut / Screws: {{@Visual_Screws}}\n\n🔹 Catatan Operator:\n{{@Notes}}',
                    fontSize: 14,
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
