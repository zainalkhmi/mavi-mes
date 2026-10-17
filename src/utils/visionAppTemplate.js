/**
 * visionAppTemplate.js
 * Utility to generate Frontline MES Quality Inspection Applications
 * powered by Vision Builder / QuickBuild cognitive pipelines.
 */

export function createVisionInspectionStep(workspace, activeCamera) {
    const ts = Date.now();
    const pipelineName = workspace?.name || 'Google Vertex AI Zero-Shot QC';
    const cameraName = activeCamera?.name || 'Basler GigE Vision - Station 1';
    const cameraId = activeCamera?.id || 'cam_gige_1';
    const activeJob = workspace?.jobs?.[0] || {};
    const nodeCount = activeJob.nodes?.length || 6;

    return {
        id: `step_vision_${ts}`,
        title: `Vision QC — ${pipelineName}`,
        stepType: 'Step',
        backgroundColor: '#0f172a',
        components: [
            // Top Nav bar
            {
                id: `c2_header_bg_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 1280, h: 64,
                props: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 }
            },
            {
                id: `c2_header_title_${ts}`,
                type: 'TEXT',
                x: 24, y: 18, w: 600, h: 28,
                props: { text: `INLINE QUALITY INSPECTION — LIVE STREAM`, fontSize: 18, fontBold: true, textColor: '#f8fafc' }
            },
            {
                id: `c2_header_pipe_${ts}`,
                type: 'TEXT',
                x: 950, y: 18, w: 300, h: 28,
                props: { text: `⚡ ${pipelineName}`, fontSize: 12, fontBold: true, textColor: '#38bdf8' }
            },
            // Main Vision Camera / Pipeline Component
            {
                id: `c2_vision_pipe_${ts}`,
                name: 'vision_pipeline_inspector',
                displayName: 'Vision Pipeline Inspector',
                type: 'VISION_PIPELINE',
                x: 24, y: 80, w: 780, h: 540,
                props: {
                    label: `${pipelineName} (Live)`,
                    filterType: 'FULL_PIPELINE',
                    quickbuildPipelineName: pipelineName,
                    cameraId: cameraId,
                    targetVariable: 'Inspection_Verdict',
                    zIndex: 10
                }
            },
            // Right Side: Verdict Card
            {
                id: `c2_verdict_card_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 824, y: 80, w: 432, h: 140,
                props: { backgroundColor: '#1e293b', borderColor: '#10b981', borderWidth: 2, borderRadius: 12 }
            },
            {
                id: `c2_verdict_lbl_${ts}`,
                type: 'TEXT',
                x: 844, y: 96, w: 300, h: 20,
                props: { text: 'AUTOMATED VERDICT', fontSize: 11, fontBold: true, textColor: '#94a3b8' }
            },
            {
                id: `c2_verdict_val_${ts}`,
                type: 'TEXT',
                x: 844, y: 120, w: 200, h: 48,
                props: { text: 'PASS', fontSize: 36, fontBold: true, textColor: '#10b981' }
            },
            {
                id: `c2_score_val_${ts}`,
                type: 'TEXT',
                x: 844, y: 175, w: 380, h: 24,
                props: { text: 'Confidence Score: 98.4% (Vertex AI / Teachable Machine)', fontSize: 12, fontBold: true, textColor: '#34d399' }
            },
            // Right Side: Model & Pipeline metadata card
            {
                id: `c2_meta_card_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 824, y: 236, w: 432, h: 160,
                props: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 12 }
            },
            {
                id: `c2_meta_lbl_${ts}`,
                type: 'TEXT',
                x: 844, y: 252, w: 300, h: 20,
                props: { text: 'VISION EXECUTION DETAILS', fontSize: 11, fontBold: true, textColor: '#64748b' }
            },
            {
                id: `c2_meta_text_${ts}`,
                type: 'TEXT',
                x: 844, y: 280, w: 390, h: 100,
                props: {
                    text: `Camera Feed: ${cameraName}\nPipeline: ${pipelineName} (${nodeCount} blocks)\nInspection Speed: 30 FPS / ~42ms latency\nPLC Yield Judge: Relay Q0.0 (PASS) / Q0.1 (REJECT)`,
                    fontSize: 12,
                    textColor: '#cbd5e1'
                }
            },
            // Right Side: Operator Controls
            {
                id: `c2_btn_pass_${ts}`,
                type: 'BUTTON',
                x: 824, y: 412, w: 208, h: 46,
                props: {
                    label: '✓ ACCEPT (PASS)',
                    text: '✓ ACCEPT (PASS)',
                    backgroundColor: '#059669',
                    textColor: '#ffffff',
                    borderRadius: 8,
                    fontWeight: 'bold',
                    fontSize: 13,
                    triggers: [{ name: 'Pass Action', event: 'ON_CLICK', actions: [{ type: 'SHOW_MESSAGE', payload: { message: 'Item recorded as PASS ✓', msgType: 'success' } }] }]
                }
            },
            {
                id: `c2_btn_reject_${ts}`,
                type: 'BUTTON',
                x: 1048, y: 412, w: 208, h: 46,
                props: {
                    label: '✕ REJECT (NG)',
                    text: '✕ REJECT (NG)',
                    backgroundColor: '#dc2626',
                    textColor: '#ffffff',
                    borderRadius: 8,
                    fontWeight: 'bold',
                    fontSize: 13,
                    triggers: [{ name: 'Reject Action', event: 'ON_CLICK', actions: [{ type: 'SHOW_MESSAGE', payload: { message: 'Item recorded as DEFECT/NG ✕', msgType: 'error' } }] }]
                }
            },
            // Nav buttons
            {
                id: `c2_btn_prev_${ts}`,
                type: 'BUTTON',
                x: 824, y: 474, w: 130, h: 46,
                props: {
                    label: '◀ SETUP',
                    text: '◀ SETUP',
                    backgroundColor: '#334155',
                    textColor: '#ffffff',
                    borderRadius: 8,
                    fontWeight: 'bold',
                    fontSize: 12,
                    triggers: [{ name: 'Back to Setup', event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }]
                }
            },
            {
                id: `c2_btn_next_${ts}`,
                type: 'BUTTON',
                x: 966, y: 474, w: 290, h: 46,
                props: {
                    label: 'LOG & LIHAT SUMMARY ▶',
                    text: 'LOG & LIHAT SUMMARY ▶',
                    backgroundColor: '#2563eb',
                    textColor: '#ffffff',
                    borderRadius: 8,
                    fontWeight: 'bold',
                    fontSize: 13,
                    triggers: [{ name: 'Go to Summary', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };
}

export function createVisionInspectionAppTemplate(workspace, activeCamera, customName) {
    const ts = Date.now();
    const iso = new Date().toISOString();
    const pipelineName = workspace?.name || 'Google Vertex AI Zero-Shot QC';
    const appTitle = customName?.trim() || `MES Quality App - ${pipelineName}`;
    const cameraName = activeCamera?.name || 'Basler GigE Vision - Station 1';
    const activeJob = workspace?.jobs?.[0] || {};
    const nodeCount = activeJob.nodes?.length || 6;

    const appVariables = [
        { id: `var_wo_${ts}`, name: 'Work_Order', type: 'string', defaultValue: 'WO-2026-0881', persisted: true },
        { id: `var_lot_${ts}`, name: 'Lot_Number', type: 'string', defaultValue: 'LOT-QC-9921', persisted: true },
        { id: `var_inspector_${ts}`, name: 'Operator_Name', type: 'string', defaultValue: 'Quality Operator', persisted: false },
        { id: `var_verdict_${ts}`, name: 'Inspection_Verdict', type: 'string', defaultValue: 'PASS', persisted: false },
        { id: `var_score_${ts}`, name: 'Inspection_Score', type: 'number', defaultValue: 98.4, persisted: false },
        { id: `var_defect_${ts}`, name: 'Defect_Notes', type: 'string', defaultValue: 'Clean surface, no defects detected', persisted: false },
    ];

    // Step 1: Work Order & Lot Setup
    const step1 = {
        id: `step_setup_${ts}`,
        title: '1. Setup & Lot Batch',
        stepType: 'Step',
        backgroundColor: '#0f172a',
        components: [
            // Header bar
            {
                id: `c_header_bg_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 1280, h: 64,
                props: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 }
            },
            {
                id: `c_header_title_${ts}`,
                type: 'TEXT',
                x: 24, y: 18, w: 600, h: 28,
                props: { text: `MAVI MES — AI VISION QUALITY INSPECTION`, fontSize: 18, fontBold: true, textColor: '#f8fafc' }
            },
            {
                id: `c_header_badge_${ts}`,
                type: 'TEXT',
                x: 980, y: 18, w: 260, h: 28,
                props: { text: `⚡ ${pipelineName}`, fontSize: 12, fontBold: true, textColor: '#38bdf8' }
            },
            // Card container
            {
                id: `c_setup_card_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 280, y: 100, w: 720, h: 500,
                props: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 12 }
            },
            {
                id: `c_setup_card_title_${ts}`,
                type: 'TEXT',
                x: 320, y: 130, w: 640, h: 32,
                props: { text: '📦 Batch & Station Inspection Setup', fontSize: 20, fontBold: true, textColor: '#ffffff' }
            },
            {
                id: `c_setup_card_sub_${ts}`,
                type: 'TEXT',
                x: 320, y: 165, w: 640, h: 24,
                props: { text: 'Confirm Work Order and active Vision Pipeline before scanning items.', fontSize: 13, textColor: '#94a3b8' }
            },
            // Field 1: Work Order
            {
                id: `c_lbl_wo_${ts}`,
                type: 'TEXT',
                x: 320, y: 205, w: 300, h: 20,
                props: { text: 'WORK ORDER NUMBER', fontSize: 11, fontBold: true, textColor: '#64748b' }
            },
            {
                id: `c_input_wo_${ts}`,
                type: 'TEXT_INPUT',
                x: 320, y: 230, w: 640, h: 42,
                props: { defaultValue: 'WO-2026-0881', targetVariable: 'Work_Order', placeholder: 'e.g. WO-2026-0881' }
            },
            // Field 2: Lot Number
            {
                id: `c_lbl_lot_${ts}`,
                type: 'TEXT',
                x: 320, y: 290, w: 300, h: 20,
                props: { text: 'LOT / BATCH ID', fontSize: 11, fontBold: true, textColor: '#64748b' }
            },
            {
                id: `c_input_lot_${ts}`,
                type: 'TEXT_INPUT',
                x: 320, y: 315, w: 640, h: 42,
                props: { defaultValue: 'LOT-QC-9921', targetVariable: 'Lot_Number', placeholder: 'e.g. LOT-QC-9921' }
            },
            // Info panel
            {
                id: `c_info_box_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 320, y: 380, w: 640, h: 70,
                props: { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)', borderWidth: 1, borderRadius: 8 }
            },
            {
                id: `c_info_text_${ts}`,
                type: 'TEXT',
                x: 340, y: 395, w: 600, h: 40,
                props: { text: `Connected Camera: ${cameraName}\nActive Pipeline: ${pipelineName} (${nodeCount} blocks connected)`, fontSize: 12, textColor: '#38bdf8' }
            },
            // Button start
            {
                id: `c_btn_start_${ts}`,
                type: 'BUTTON',
                x: 320, y: 475, w: 640, h: 48,
                props: {
                    label: 'MULAI INSPEKSI VISION ▶',
                    text: 'MULAI INSPEKSI VISION ▶',
                    backgroundColor: '#2563eb',
                    textColor: '#ffffff',
                    borderRadius: 8,
                    fontWeight: 'bold',
                    fontSize: 14,
                    triggers: [{ name: 'Start Inspection', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };

    // Step 2: Inline Vision Inspection
    const step2 = createVisionInspectionStep(workspace, activeCamera);

    // Step 3: MES Quality Log Table & Lot Completion
    const step3 = {
        id: `step_summary_${ts}`,
        title: '3. Quality Summary & MES Log',
        stepType: 'Step',
        backgroundColor: '#0f172a',
        components: [
            // Header bar
            {
                id: `c3_header_bg_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 1280, h: 64,
                props: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 }
            },
            {
                id: `c3_header_title_${ts}`,
                type: 'TEXT',
                x: 24, y: 18, w: 600, h: 28,
                props: { text: `BATCH INSPECTION AUDIT TRAIL & MES LOG`, fontSize: 18, fontBold: true, textColor: '#f8fafc' }
            },
            // Table
            {
                id: `c3_table_${ts}`,
                type: 'INTERACTIVE_TABLE',
                x: 24, y: 84, w: 1232, h: 440,
                props: {
                    title: 'Live Vision Inspection History',
                    columns: ['Item ID', 'Timestamp', 'Work Order', 'Lot Number', 'Pipeline', 'Score', 'Verdict', 'Status'],
                    data: [
                        { 'Item ID': 'QC-ITEM-001', 'Timestamp': '10:42:15', 'Work Order': 'WO-2026-0881', 'Lot Number': 'LOT-QC-9921', 'Pipeline': pipelineName, 'Score': '98.4%', 'Verdict': 'PASS', 'Status': 'APPROVED' },
                        { 'Item ID': 'QC-ITEM-002', 'Timestamp': '10:42:48', 'Work Order': 'WO-2026-0881', 'Lot Number': 'LOT-QC-9921', 'Pipeline': pipelineName, 'Score': '99.1%', 'Verdict': 'PASS', 'Status': 'APPROVED' },
                        { 'Item ID': 'QC-ITEM-003', 'Timestamp': '10:43:21', 'Work Order': 'WO-2026-0881', 'Lot Number': 'LOT-QC-9921', 'Pipeline': pipelineName, 'Score': '64.2%', 'Verdict': 'REJECT', 'Status': 'FLAGGED' },
                        { 'Item ID': 'QC-ITEM-004', 'Timestamp': '10:43:55', 'Work Order': 'WO-2026-0881', 'Lot Number': 'LOT-QC-9921', 'Pipeline': pipelineName, 'Score': '97.8%', 'Verdict': 'PASS', 'Status': 'APPROVED' }
                    ]
                }
            },
            // Buttons at bottom
            {
                id: `c3_btn_back_${ts}`,
                type: 'BUTTON',
                x: 24, y: 546, w: 200, h: 46,
                props: {
                    label: '◀ KEMBALI KE KAMERA',
                    text: '◀ KEMBALI KE KAMERA',
                    backgroundColor: '#334155',
                    textColor: '#ffffff',
                    borderRadius: 8,
                    fontWeight: 'bold',
                    fontSize: 12,
                    triggers: [{ name: 'Back to Vision', event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }]
                }
            },
            {
                id: `c3_btn_finish_${ts}`,
                type: 'BUTTON',
                x: 956, y: 546, w: 300, h: 46,
                props: {
                    label: 'SELESAIKAN & MULAI LOT BARU ✓',
                    text: 'SELESAIKAN & MULAI LOT BARU ✓',
                    backgroundColor: '#10b981',
                    textColor: '#ffffff',
                    borderRadius: 8,
                    fontWeight: 'bold',
                    fontSize: 13,
                    triggers: [{ name: 'Complete App', event: 'ON_CLICK', actions: [{ type: 'COMPLETE_APP' }] }]
                }
            }
        ]
    };

    return {
        id: `app_vision_qc_${ts}`,
        name: appTitle,
        description: `Automated visual inspection app generated from QuickBuild pipeline: ${pipelineName}`,
        category: 'Quality Control',
        type: 'FRONT-LINE',
        builder_type: 'app_builder',
        published: true,
        approval_status: 'APPROVED',
        created_at: iso,
        updated_at: iso,
        config: {
            appVariables,
            appTables: [],
            steps: [step1, step2, step3]
        }
    };
}
