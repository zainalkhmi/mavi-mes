/**
 * quickbuildVisionDrawingTemplate.js
 * Generates an advanced Quality Control application template combining 
 * QuickBuild tool chains, dynamic CAD drawing specifications, and live vision detectors.
 */

export function createQuickBuildCadVisionTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const appVariables = [
        { id: `var_wo_${ts}`, name: 'Work_Order', type: 'string', defaultValue: 'WO-2026-CAD-09', persisted: true },
        { id: `var_lot_${ts}`, name: 'Lot_Number', type: 'string', defaultValue: 'LOT-FLG-88', persisted: true },
        { id: `var_operator_${ts}`, name: 'Operator_Name', type: 'string', defaultValue: 'Operator-1', persisted: false },
        { id: `var_cad_model_${ts}`, name: 'Active_CAD_Model', type: 'string', defaultValue: 'Flange Connector CAD Model', persisted: true },
        { id: `var_bore_reading_${ts}`, name: 'Meas_Bore', type: 'number', defaultValue: '25.02', persisted: false },
        { id: `var_length_reading_${ts}`, name: 'Meas_Length', type: 'number', defaultValue: '120.15', persisted: false },
        { id: `var_yield_score_${ts}`, name: 'Yield_Score', type: 'number', defaultValue: '94.5', persisted: false },
        { id: `var_yield_result_${ts}`, name: 'Yield_Result', type: 'string', defaultValue: 'PASS', persisted: false }
    ];

    const step1 = {
        id: `qb_step_setup_${ts}`,
        title: '1. Inisialisasi CAD & Setup',
        stepType: 'Step',
        components: [
            {
                id: `qb_s1_h1_${ts}`, type: 'HEADING',
                x: 40, y: 30, w: 900, h: 40,
                props: { text: '📐 Setup Inspeksi Terintegrasi CAD & Vision', fontSize: 24, fontWeight: 'bold', color: '#1e293b' }
            },
            {
                id: `qb_s1_sub_${ts}`, type: 'TEXT',
                x: 40, y: 75, w: 900, h: 30,
                props: { text: 'Pilih blueprint gambar teknik untuk menyinkronkan batas toleransi caliper otomatis ke stasiun inspeksi.', fontSize: 13, color: '#64748b' }
            },
            // Left Card - Setup Form
            {
                id: `qb_s1_form_${ts}`, type: 'TEXT',
                x: 40, y: 120, w: 460, h: 440,
                props: { 
                    text: '📋 INFORMASI OPERASIONAL\n\n\nOperator Name:\n\n\n\nWork Order ID:\n\n\n\nLot / Batch Number:',
                    fontSize: 14, 
                    fontWeight: 'bold',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                }
            },
            {
                id: `qb_s1_in_op_${ts}`, type: 'TEXT_INPUT',
                x: 64, y: 195, w: 410, h: 40,
                props: { targetVariable: 'Operator_Name', placeholder: 'Masukkan nama operator...' }
            },
            {
                id: `qb_s1_in_wo_${ts}`, type: 'TEXT_INPUT',
                x: 64, y: 280, w: 410, h: 40,
                props: { targetVariable: 'Work_Order', placeholder: 'WO-2026-...' }
            },
            {
                id: `qb_s1_in_lot_${ts}`, type: 'TEXT_INPUT',
                x: 64, y: 365, w: 410, h: 40,
                props: { targetVariable: 'Lot_Number', placeholder: 'LOT-...' }
            },
            // Right Card - CAD Drawing Selector
            {
                id: `qb_s1_cad_card_${ts}`, type: 'TEXT',
                x: 520, y: 120, w: 440, h: 440,
                props: { 
                    text: '📐 SYNC BLUEPRINT MODEL\n\nModel Gambar CAD Aktif:\n\n\n\n\nℹ️ Toleransi Caliper otomatis diimpor dari file DXF:\n- Center Bore (B): 25.0 mm (Tol: 24.9 - 25.1)\n- Overall Length (L): 120.0 mm (Tol: 119.5 - 120.5)\n- Flange Diameter (D): 80.0 mm (Tol: 79.8 - 80.2)',
                    fontSize: 14, 
                    fontWeight: 'bold',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1'
                }
            },
            {
                id: `qb_s1_cad_select_${ts}`, type: 'TEXT_INPUT', // acts as selector display
                x: 544, y: 195, w: 390, h: 40,
                props: { targetVariable: 'Active_CAD_Model', placeholder: 'Flange Connector CAD Model' }
            },
            // Next Step Button
            {
                id: `qb_s1_start_btn_${ts}`, type: 'BUTTON',
                x: 40, y: 580, w: 920, h: 50,
                props: {
                    label: 'MULAI COGNITIVE INSPEKSI (QUICKBUILD) ▶',
                    backgroundColor: '#2563eb', color: 'white', fontSize: 15, fontWeight: 'bold',
                    triggers: [{ name: 'Mulai QC', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };

    const step2 = {
        id: `qb_step_vision_${ts}`,
        title: '2. Live QuickBuild Vision Detector',
        stepType: 'Step',
        components: [
            {
                id: `qb_s2_h1_${ts}`, type: 'HEADING',
                x: 40, y: 15, w: 900, h: 30,
                props: { text: '👁️ Stasiun QC Kamera Terintegrasi CAD', fontSize: 20, fontWeight: 'bold', color: '#1e293b' }
            },
            // OPENCV CAMERA Widget
            {
                id: `qb_s2_cam_${ts}`, type: 'OPENCV_CAMERA',
                x: 40, y: 60, w: 460, h: 460,
                props: { 
                    label: 'Caliper & Edge Vision Camera', 
                    filterType: 'FULL_PIPELINE', 
                    quickbuildPipelineName: 'Flange Connector Check' 
                }
            },
            // CAD Blueprint Drawing Overlay / Display
            {
                id: `qb_s2_blueprint_bg_${ts}`, type: 'TEXT',
                x: 520, y: 60, w: 440, h: 260,
                props: { 
                    text: '📐 CAD BLUEPRINT REFERENCE (REV 2)\n\n\n\n\n\n\n\n\nSync Status: Active Caliper Linked to "Center Bore (B)"',
                    fontSize: 13, 
                    fontWeight: 'bold',
                    backgroundColor: '#0f172a',
                    color: '#38bdf8',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #1e293b'
                }
            },
            // Results Panel
            {
                id: `qb_s2_result_card_${ts}`, type: 'TEXT',
                x: 520, y: 340, w: 440, h: 180,
                props: { 
                    text: '📊 QC VISION READOUTS\n\nBore Caliper: {{Meas_Bore}} mm (Spec: 25.0 ± 0.1)\nLength Caliper: {{Meas_Length}} mm (Spec: 120.0 ± 0.5)\n\nYield Matching: {{Yield_Score}}%\nVerdict: {{Yield_Result}}',
                    fontSize: 14, 
                    fontWeight: 'bold',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                }
            },
            // Action Controls
            {
                id: `qb_s2_submit_btn_${ts}`, type: 'BUTTON',
                x: 40, y: 540, w: 920, h: 50,
                props: {
                    label: 'SIMPAN DATA INSPEKSI & SUBMIT LAPORAN ✓',
                    backgroundColor: '#10b981', color: 'white', fontSize: 14, fontWeight: 'bold',
                    triggers: [
                        { name: 'Finish QC', event: 'ON_CLICK', actions: [
                            { type: 'SHOW_MESSAGE', payload: { message: 'Data inspeksi disinkronkan ke database QC! ✓', msgType: 'success' } },
                            { type: 'COMPLETE_APP' }
                        ] }
                    ]
                }
            }
        ]
    };

    return {
        id: `app_quickbuild_cad_vision_${ts}`,
        name: 'QuickBuild CAD & Vision QC',
        description: 'Advanced vision inspection system powered by QuickBuild sequential pipelines, dynamically linked to AutoCAD/CAD specifications.',
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
                    id: `rp_qb_vision_${ts}`,
                    name: 'Inspection_Log',
                    tableId: 'live_measurements',
                    description: 'CAD vision inspection logs'
                }
            ],
            appTables: ['live_measurements'],
            appTriggers: [
                {
                    id: `trig_start_qb_${ts}`,
                    name: 'QuickBuild Module Init',
                    event: 'ON_APP_START',
                    actions: [
                        { type: 'SHOW_MESSAGE', payload: { message: '📐 QuickBuild CAD Template Loaded', msgType: 'success' } }
                    ]
                }
            ],
            steps: [
                step1,
                step2
            ]
        }
    };
}
