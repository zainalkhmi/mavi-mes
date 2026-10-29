/**
 * aiVisionCopilotDashboardTemplate.js
 * 
 * MAVI MES App Builder Flagship Template:
 * "AI Vision Quality, Gemini Copilot & BigQuery Dashboard"
 * 
 * FULLY INTEGRATED WITH:
 * 1. VISION BUILDER (/vision, /vision/quickbuild, /vision/calibration)
 * 2. DIGITAL CHECKSHEET (/checksheets, /drawing-checksheet, /inspector-designer)
 * 3. GEMINI ON VERTEX AI COPILOT (Shopfloor reasoning, root cause analysis)
 * 4. EXECUTIVE OEE & BIGQUERY AUDIT TRAIL (Real-time telemetry and waste reduction)
 */

export function createAiVisionCopilotDashboardTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const appVariables = [
        { id: `var_wo_${ts}`, name: 'Work_Order', type: 'string', defaultValue: 'WO-2026-ENG-8840', persisted: true },
        { id: `var_lot_${ts}`, name: 'Lot_Number', type: 'string', defaultValue: 'LOT-A-941', persisted: true },
        { id: `var_sku_${ts}`, name: 'Part_SKU', type: 'string', defaultValue: 'EV-BAT-CASE-M4', persisted: true },
        { id: `var_part_name_${ts}`, name: 'Part_Name', type: 'string', defaultValue: 'EV Battery Module Enclosure', persisted: true },
        { id: `var_dwg_id_${ts}`, name: 'Drawing_ID', type: 'string', defaultValue: 'DWG-EV-2026-04', persisted: true },
        { id: `var_dwg_rev_${ts}`, name: 'Drawing_Rev', type: 'string', defaultValue: 'Rev C (Approved)', persisted: true },
        { id: `var_operator_${ts}`, name: 'Operator_Name', type: 'string', defaultValue: '@APP_INFO.USER', persisted: false },
        { id: `var_verdict_${ts}`, name: 'Inspection_Verdict', type: 'string', defaultValue: 'PASS', persisted: false },
        { id: `var_confidence_${ts}`, name: 'Confidence_Score', type: 'number', defaultValue: 98.7, persisted: false },
        { id: `var_defect_type_${ts}`, name: 'Defect_Type', type: 'string', defaultValue: 'None (Spec Compliant)', persisted: false },
        { id: `var_checksheet_pass_${ts}`, name: 'Checksheet_Points_Passed', type: 'number', defaultValue: 5, persisted: false },
        { id: `var_checksheet_total_${ts}`, name: 'Checksheet_Points_Total', type: 'number', defaultValue: 5, persisted: false },
        { id: `var_root_cause_${ts}`, name: 'Gemini_Root_Cause', type: 'string', defaultValue: 'All tolerances match CAD/PLM standard ISO-9001.', persisted: false },
        { id: `var_sop_action_${ts}`, name: 'SOP_Action', type: 'string', defaultValue: 'Continue to Cell-05 Battery Cell Insertion.', persisted: false },
        { id: `var_scrap_saved_${ts}`, name: 'Scrap_Saved_Kg', type: 'number', defaultValue: 12.5, persisted: false },
        { id: `var_fpy_${ts}`, name: 'Shift_FPY', type: 'number', defaultValue: 94.2, persisted: false },
        { id: `var_oee_${ts}`, name: 'Shift_OEE', type: 'number', defaultValue: 88.5, persisted: false }
    ];

    // =========================================================================
    // STEP 1: SETUP & IOT WORK ORDER DISPATCH
    // =========================================================================
    const step1 = {
        id: `step_setup_${ts}`,
        title: '1. Setup & IoT Work Order Dispatch',
        stepType: 'Step',
        backgroundColor: '#0a0f1d',
        components: [
            // Top Nav Banner
            {
                id: `s1_top_bar_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 1280, h: 64,
                props: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1 }
            },
            {
                id: `s1_badge_gc_${ts}`,
                type: 'TEXT',
                x: 24, y: 18, w: 550, h: 28,
                props: { 
                    text: '☁️ GOOGLE CLOUD VERTEX AI • VISION BUILDER & CHECKSHEET SUITE', 
                    fontSize: 12, 
                    fontWeight: 'bold', 
                    textColor: '#38bdf8', 
                    color: '#38bdf8' 
                }
            },
            {
                id: `s1_badge_status_${ts}`,
                type: 'TEXT',
                x: 880, y: 18, w: 370, h: 28,
                props: { 
                    text: '⚡ Connected: Vision Pipeline & BigQuery Stream', 
                    fontSize: 11, 
                    fontWeight: 'bold', 
                    textColor: '#10b981', 
                    color: '#10b981',
                    textAlign: 'right' 
                }
            },

            // Center Setup Card
            {
                id: `s1_card_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 180, y: 88, w: 920, h: 570,
                props: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 16 }
            },
            {
                id: `s1_card_h1_${ts}`,
                type: 'TEXT',
                x: 220, y: 115, w: 840, h: 36,
                props: { 
                    text: '🎯 MAVI Cognitive Vision & Checksheet Command Center', 
                    fontSize: 22, 
                    fontWeight: 'bold', 
                    textColor: '#f8fafc', 
                    color: '#f8fafc' 
                }
            },
            {
                id: `s1_card_desc_${ts}`,
                type: 'TEXT',
                x: 220, y: 155, w: 840, h: 28,
                props: { 
                    text: 'Alur kerja terpadu: Inspeksi kamera Vision AI, verifikasi Digital Checksheet, penalaran Gemini Copilot, dan analitik BigQuery.', 
                    fontSize: 13, 
                    textColor: '#94a3b8', 
                    color: '#94a3b8' 
                }
            },

            // Inputs Grid
            {
                id: `s1_lbl_wo_${ts}`,
                type: 'TEXT',
                x: 220, y: 200, w: 400, h: 20,
                props: { text: 'WORK ORDER NUMBER', fontSize: 11, fontWeight: 'bold', textColor: '#64748b', color: '#64748b' }
            },
            {
                id: `s1_input_wo_${ts}`,
                type: 'TEXT_INPUT',
                x: 220, y: 224, w: 400, h: 46,
                props: { defaultValue: 'WO-2026-ENG-8840', targetVariable: 'Work_Order', placeholder: 'WO-2026-...' }
            },

            {
                id: `s1_lbl_lot_${ts}`,
                type: 'TEXT',
                x: 660, y: 200, w: 400, h: 20,
                props: { text: 'BATCH LOT NUMBER', fontSize: 11, fontWeight: 'bold', textColor: '#64748b', color: '#64748b' }
            },
            {
                id: `s1_input_lot_${ts}`,
                type: 'TEXT_INPUT',
                x: 660, y: 224, w: 400, h: 46,
                props: { defaultValue: 'LOT-A-941', targetVariable: 'Lot_Number', placeholder: 'LOT-...' }
            },

            {
                id: `s1_lbl_sku_${ts}`,
                type: 'TEXT',
                x: 220, y: 290, w: 400, h: 20,
                props: { text: 'PART SKU & NAMA KOMPONEN', fontSize: 11, fontWeight: 'bold', textColor: '#64748b', color: '#64748b' }
            },
            {
                id: `s1_input_sku_${ts}`,
                type: 'TEXT_INPUT',
                x: 220, y: 314, w: 400, h: 46,
                props: { defaultValue: 'EV-BAT-CASE-M4', targetVariable: 'Part_SKU', placeholder: 'SKU...' }
            },

            {
                id: `s1_lbl_dwg_${ts}`,
                type: 'TEXT',
                x: 660, y: 290, w: 400, h: 20,
                props: { text: 'REFERENSI DRAWING & BLUEPRINT (PLM)', fontSize: 11, fontWeight: 'bold', textColor: '#64748b', color: '#64748b' }
            },
            {
                id: `s1_input_dwg_${ts}`,
                type: 'TEXT_INPUT',
                x: 660, y: 314, w: 400, h: 46,
                props: { defaultValue: 'DWG-EV-2026-04 (Rev C)', targetVariable: 'Drawing_ID', placeholder: 'Drawing ID...' }
            },

            // 3 Integration Feature Cards
            {
                id: `s1_pill_vision_${ts}`,
                type: 'TEXT',
                x: 220, y: 385, w: 270, h: 90,
                props: { 
                    text: '👁️ Vision Builder Integration\n• Pipeline: QuickBuild Vertex AI v2\n• Deteksi: Scratch, Missing Bolt, Porosity\n• Node Editor: 6 blocks connected', 
                    fontSize: 11, 
                    textColor: '#cbd5e1', 
                    color: '#cbd5e1',
                    backgroundColor: '#1e293b', 
                    borderRadius: '10px', 
                    padding: '12px' 
                }
            },
            {
                id: `s1_pill_checksheet_${ts}`,
                type: 'TEXT',
                x: 505, y: 385, w: 270, h: 90,
                props: { 
                    text: '📋 Digital Checksheet Suite\n• Standar: ISO 9001 / IATF 16949\n• Verifikasi: 5 Poin Dimensi & Visual\n• Integrasi: Drawing Hotspot & Signature', 
                    fontSize: 11, 
                    textColor: '#cbd5e1', 
                    color: '#cbd5e1',
                    backgroundColor: '#1e293b', 
                    borderRadius: '10px', 
                    padding: '12px' 
                }
            },
            {
                id: `s1_pill_gemini_${ts}`,
                type: 'TEXT',
                x: 790, y: 385, w: 270, h: 90,
                props: { 
                    text: '🧠 Gemini Copilot & BigQuery\n• Model: Gemini 1.5 Pro on Vertex AI\n• Reasoning: Root cause & SOP mitigasi\n• Telemetry: BigQuery Live Event Stream', 
                    fontSize: 11, 
                    textColor: '#cbd5e1', 
                    color: '#cbd5e1',
                    backgroundColor: '#1e293b', 
                    borderRadius: '10px', 
                    padding: '12px' 
                }
            },

            // Start Button
            {
                id: `s1_btn_start_${ts}`,
                type: 'BUTTON',
                x: 220, y: 500, w: 840, h: 56,
                props: {
                    label: 'MULAI INSPEKSI VISUAL & DIGITAL CHECK SHEET ▶',
                    text: 'MULAI INSPEKSI VISUAL & DIGITAL CHECK SHEET ▶',
                    backgroundColor: '#6366f1',
                    textColor: '#ffffff',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 'bold',
                    borderRadius: 12,
                    triggers: [
                        { 
                            name: 'Start Vision QC & Checksheet', 
                            event: 'ON_CLICK', 
                            actions: [
                                { type: 'SHOW_MESSAGE', payload: { message: 'Inisialisasi Vision Pipeline & Checksheet Module...', msgType: 'info' } },
                                { type: 'NEXT_STEP' }
                            ] 
                        }
                    ]
                }
            }
        ]
    };

    // =========================================================================
    // STEP 2: COGNITIVE VISION AI QUALITY STATION (VISION BUILDER INTEGRATED)
    // =========================================================================
    const step2 = {
        id: `step_vision_qc_${ts}`,
        title: '2. Cognitive Vision AI Station (Vision Builder)',
        stepType: 'Step',
        backgroundColor: '#0a0f1d',
        components: [
            // Top Nav
            {
                id: `s2_top_bar_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 1280, h: 56,
                props: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1 }
            },
            {
                id: `s2_top_title_${ts}`,
                type: 'TEXT',
                x: 24, y: 16, w: 600, h: 24,
                props: { text: '👁️ VISION BUILDER QC STATION — LIVE OPTICAL PIPELINE', fontSize: 16, fontWeight: 'bold', textColor: '#f8fafc', color: '#f8fafc' }
            },
            {
                id: `s2_top_pipeline_${ts}`,
                type: 'TEXT',
                x: 850, y: 16, w: 400, h: 24,
                props: { text: 'Pipeline: Google Vertex AI Zero-Shot QC (Active)', fontSize: 12, fontWeight: 'bold', textColor: '#38bdf8', color: '#38bdf8', textAlign: 'right' }
            },

            // Left: Camera Viewport / OpenCV Camera Component
            {
                id: `s2_cam_${ts}`,
                name: 'vision_inspection_cam',
                type: 'OPENCV_CAMERA',
                x: 24, y: 72, w: 760, h: 470,
                props: {
                    label: 'Vision AI Optical Camera (4K 60FPS)',
                    filterType: 'INSPECTION',
                    quickbuildPipelineName: 'Google Vertex AI Zero-Shot QC',
                    thresholdValue: 110,
                    targetVariable: 'Inspection_Verdict'
                }
            },

            // Vision Builder Pipeline Architecture Tracker
            {
                id: `s2_pipeline_hud_${ts}`,
                type: 'TEXT',
                x: 24, y: 550, w: 760, h: 54,
                props: {
                    text: '⚡ Vision Builder Pipeline Nodes: [GigE Camera Frame] ➔ [Gaussian Preprocess] ➔ [Contour ROI Extraction] ➔ [Vertex AI Zero-Shot Model] ➔ [PLC Relay Judge]\nStatus: Model Confidence 98.7% • Latensi Deteksi: 42ms • Auto-Save Database: Active',
                    fontSize: 11,
                    fontWeight: 'bold',
                    textColor: '#38bdf8',
                    color: '#38bdf8',
                    backgroundColor: '#0f172a',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    lineHeight: '1.5'
                }
            },

            // Right Top: Automated Verdict Card
            {
                id: `s2_card_verdict_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 808, y: 72, w: 448, h: 130,
                props: { backgroundColor: '#0f172a', borderColor: '#10b981', borderWidth: 2, borderRadius: 14 }
            },
            {
                id: `s2_lbl_verdict_${ts}`,
                type: 'TEXT',
                x: 828, y: 86, w: 300, h: 18,
                props: { text: 'AUTOMATED VISION VERDICT', fontSize: 11, fontWeight: 'bold', textColor: '#64748b', color: '#64748b' }
            },
            {
                id: `s2_val_verdict_${ts}`,
                type: 'TEXT',
                x: 828, y: 106, w: 200, h: 42,
                props: { text: 'PASS', fontSize: 34, fontWeight: 'bold', textColor: '#10b981', color: '#10b981' }
            },
            {
                id: `s2_sub_verdict_${ts}`,
                type: 'TEXT',
                x: 828, y: 154, w: 400, h: 22,
                props: { text: '✓ Seluruh dimensi & permukaan sesuai spesifikasi toleransi CAD/PLM ISO-9001.', fontSize: 11, textColor: '#94a3b8', color: '#94a3b8' }
            },

            // Right Middle: Direct Vision Builder Studio Integration Buttons
            {
                id: `s2_card_vb_tools_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 808, y: 216, w: 448, h: 170,
                props: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 14 }
            },
            {
                id: `s2_lbl_vb_tools_${ts}`,
                type: 'TEXT',
                x: 828, y: 232, w: 400, h: 20,
                props: { text: 'INTEGRASI LANGSUNG VISION BUILDER', fontSize: 11, fontWeight: 'bold', textColor: '#38bdf8', color: '#38bdf8' }
            },
            {
                id: `s2_btn_open_quickbuild_${ts}`,
                type: 'BUTTON',
                x: 828, y: 260, w: 408, h: 46,
                props: {
                    label: '⚡ EDIT PIPELINE DI VISION BUILDER (/vision/quickbuild) ↗',
                    text: '⚡ EDIT PIPELINE DI VISION BUILDER (/vision/quickbuild) ↗',
                    backgroundColor: '#1e293b',
                    textColor: '#38bdf8',
                    color: '#38bdf8',
                    fontSize: 12,
                    fontWeight: 'bold',
                    borderRadius: 8,
                    triggers: [
                        { 
                            name: 'Launch Vision Quickbuild', 
                            event: 'ON_CLICK', 
                            actions: [
                                { type: 'SHOW_MESSAGE', payload: { message: 'Membuka Vision Builder QuickBuild Pipeline Studio...', msgType: 'info' } }
                            ] 
                        }
                    ]
                }
            },
            {
                id: `s2_btn_open_calibration_${ts}`,
                type: 'BUTTON',
                x: 828, y: 318, w: 408, h: 46,
                props: {
                    label: '🎯 KALIBRASI DISTORSI KAMERA (/vision/calibration) ↗',
                    text: '🎯 KALIBRASI DISTORSI KAMERA (/vision/calibration) ↗',
                    backgroundColor: '#1e293b',
                    textColor: '#a855f7',
                    color: '#a855f7',
                    fontSize: 12,
                    fontWeight: 'bold',
                    borderRadius: 8,
                    triggers: [
                        { 
                            name: 'Launch Camera Calibration', 
                            event: 'ON_CLICK', 
                            actions: [
                                { type: 'SHOW_MESSAGE', payload: { message: 'Membuka Tool Kalibrasi Kamera Checkerboard...', msgType: 'info' } }
                            ] 
                        }
                    ]
                }
            },

            // Right Bottom: Action Buttons
            {
                id: `s2_btn_next_${ts}`,
                type: 'BUTTON',
                x: 808, y: 400, w: 448, h: 54,
                props: {
                    label: 'LANJUT KE DIGITAL CHECK SHEET (ISO 9001) ▶',
                    text: 'LANJUT KE DIGITAL CHECK SHEET (ISO 9001) ▶',
                    backgroundColor: '#6366f1',
                    textColor: '#ffffff',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 'bold',
                    borderRadius: 10,
                    triggers: [{ name: 'Go to Checksheet', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            },
            {
                id: `s2_btn_prev_${ts}`,
                type: 'BUTTON',
                x: 24, y: 616, w: 200, h: 42,
                props: {
                    label: '◀ KEMBALI KE SETUP',
                    text: '◀ KEMBALI KE SETUP',
                    backgroundColor: '#334155',
                    textColor: '#ffffff',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 'bold',
                    borderRadius: 8,
                    triggers: [{ name: 'Back to Setup', event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }]
                }
            }
        ]
    };

    // =========================================================================
    // STEP 3: DIGITAL QUALITY CHECKSHEET (CHECKSHEET SUITE INTEGRATED)
    // =========================================================================
    const step3 = {
        id: `step_checksheet_${ts}`,
        title: '3. Digital Checksheet & Dimension Specs (Checksheet Suite)',
        stepType: 'Step',
        backgroundColor: '#0a0f1d',
        components: [
            // Top Nav
            {
                id: `s3_top_bar_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 1280, h: 56,
                props: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1 }
            },
            {
                id: `s3_top_title_${ts}`,
                type: 'TEXT',
                x: 24, y: 16, w: 600, h: 24,
                props: { text: '📋 DIGITAL QUALITY CHECK SHEET — ISO 9001 / IATF 16949 VERIFICATION', fontSize: 16, fontWeight: 'bold', textColor: '#f8fafc', color: '#f8fafc' }
            },
            {
                id: `s3_top_dwg_${ts}`,
                type: 'TEXT',
                x: 850, y: 16, w: 400, h: 24,
                props: { text: 'Drawing: DWG-EV-2026-04 • Status: 5/5 PASS (100%)', fontSize: 12, fontWeight: 'bold', textColor: '#10b981', color: '#10b981', textAlign: 'right' }
            },

            // Left Side: 5 Checksheet Points Interactive Matrix
            {
                id: `s3_card_matrix_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 24, y: 72, w: 760, h: 520,
                props: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 14 }
            },
            {
                id: `s3_lbl_matrix_${ts}`,
                type: 'TEXT',
                x: 44, y: 88, w: 720, h: 22,
                props: { text: 'POIN-POIN PEMERIKSAAN KUALITAS RESMI (CHECK SHEET ITEMS)', fontSize: 12, fontWeight: 'bold', textColor: '#94a3b8', color: '#94a3b8' }
            },
            {
                id: `s3_txt_cp1_${ts}`,
                type: 'TEXT',
                x: 44, y: 120, w: 720, h: 72,
                props: {
                    text: 'Poin 1: Ketebalan & Dimensi Enclosure (Caliper OCR)\nStandar: 25.0 ± 0.1 mm • Aktual: 25.02 mm • Evaluasi: [PASS ✓]\nAlat Ukur: Digital Caliper Mitutoyo 150mm (Calibrated)',
                    fontSize: 12,
                    textColor: '#e2e8f0',
                    color: '#e2e8f0',
                    backgroundColor: '#1e293b',
                    padding: '10px 14px',
                    borderRadius: '8px'
                }
            },
            {
                id: `s3_txt_cp2_${ts}`,
                type: 'TEXT',
                x: 44, y: 202, w: 720, h: 72,
                props: {
                    text: 'Poin 2: Integritas Permukaan & Bebas Goresan (Vision Cam)\nStandar: Bebas scratch > 0.2 mm • Aktual: Clean Surface • Evaluasi: [PASS ✓]\nAlat Inspeksi: Vision AI Optical GigE Camera Station 04',
                    fontSize: 12,
                    textColor: '#e2e8f0',
                    color: '#e2e8f0',
                    backgroundColor: '#1e293b',
                    padding: '10px 14px',
                    borderRadius: '8px'
                }
            },
            {
                id: `s3_txt_cp3_${ts}`,
                type: 'TEXT',
                x: 44, y: 284, w: 720, h: 72,
                props: {
                    text: 'Poin 3: Kelengkapan Baut Pengunci M6 (Vision Bolt Counter)\nStandar: Terpasang lengkap 8 of 8 unit • Aktual: 8 Terpasang • Evaluasi: [PASS ✓]\nAlat Inspeksi: Vision AI Contour Bolt Feature Detection',
                    fontSize: 12,
                    textColor: '#e2e8f0',
                    color: '#e2e8f0',
                    backgroundColor: '#1e293b',
                    padding: '10px 14px',
                    borderRadius: '8px'
                }
            },
            {
                id: `s3_txt_cp4_${ts}`,
                type: 'TEXT',
                x: 44, y: 366, w: 720, h: 72,
                props: {
                    text: 'Poin 4: Kerapatan Sambungan Las & Tekanan Hidrolik (Dial Gauge)\nStandar: 45.0 - 55.0 PSI • Aktual: 52.4 PSI • Evaluasi: [PASS ✓]\nAlat Ukur: Pressure Dial Gauge Reader WIKA Analog OCR',
                    fontSize: 12,
                    textColor: '#e2e8f0',
                    color: '#e2e8f0',
                    backgroundColor: '#1e293b',
                    padding: '10px 14px',
                    borderRadius: '8px'
                }
            },
            {
                id: `s3_txt_cp5_${ts}`,
                type: 'TEXT',
                x: 44, y: 448, w: 720, h: 72,
                props: {
                    text: 'Poin 5: Verifikasi Barcode Part & Nomor Seri (OCR Scanner)\nStandar: Barcode terbaca valid • Aktual: EV-BAT-CASE-M4-0982 • Evaluasi: [PASS ✓]\nAlat Inspeksi: 2D Matrix Barcode Reader Module',
                    fontSize: 12,
                    textColor: '#e2e8f0',
                    color: '#e2e8f0',
                    backgroundColor: '#1e293b',
                    padding: '10px 14px',
                    borderRadius: '8px'
                }
            },

            // Right Side: Checksheet Integration Studio Tools & Signature
            {
                id: `s3_card_tools_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 808, y: 72, w: 448, h: 260,
                props: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 14 }
            },
            {
                id: `s3_lbl_tools_${ts}`,
                type: 'TEXT',
                x: 828, y: 88, w: 400, h: 20,
                props: { text: 'INTEGRASI DOKUMEN CHECKSHEET RESMI', fontSize: 11, fontWeight: 'bold', textColor: '#22c55e', color: '#22c55e' }
            },
            {
                id: `s3_btn_drawing_cs_${ts}`,
                type: 'BUTTON',
                x: 828, y: 116, w: 408, h: 46,
                props: {
                    label: '📐 BUKA 2D DRAWING CHECK SHEET (/drawing-checksheet) ↗',
                    text: '📐 BUKA 2D DRAWING CHECK SHEET (/drawing-checksheet) ↗',
                    backgroundColor: '#1e293b',
                    textColor: '#22c55e',
                    color: '#22c55e',
                    fontSize: 12,
                    fontWeight: 'bold',
                    borderRadius: 8,
                    triggers: [
                        { 
                            name: 'Launch Drawing Checksheet', 
                            event: 'ON_CLICK', 
                            actions: [
                                { type: 'SHOW_MESSAGE', payload: { message: 'Membuka Drawing Checksheet dengan Hotspot Inspection Pins...', msgType: 'info' } }
                            ] 
                        }
                    ]
                }
            },
            {
                id: `s3_btn_cs_manager_${ts}`,
                type: 'BUTTON',
                x: 828, y: 174, w: 408, h: 46,
                props: {
                    label: '📄 CHECKSHEET MANAGEMENT & APPROVAL (/checksheets) ↗',
                    text: '📄 CHECKSHEET MANAGEMENT & APPROVAL (/checksheets) ↗',
                    backgroundColor: '#1e293b',
                    textColor: '#8b5cf6',
                    color: '#8b5cf6',
                    fontSize: 12,
                    fontWeight: 'bold',
                    borderRadius: 8,
                    triggers: [
                        { 
                            name: 'Launch Checksheet Manager', 
                            event: 'ON_CLICK', 
                            actions: [
                                { type: 'SHOW_MESSAGE', payload: { message: 'Membuka Pusat Manajemen Dokumen Mutu Checksheet ISO 9001...', msgType: 'info' } }
                            ] 
                        }
                    ]
                }
            },
            {
                id: `s3_btn_inspector_des_${ts}`,
                type: 'BUTTON',
                x: 828, y: 232, w: 408, h: 46,
                props: {
                    label: '🛠️ EDIT PARAMETER QC DI INSPECTOR DESIGNER (/inspector) ↗',
                    text: '🛠️ EDIT PARAMETER QC DI INSPECTOR DESIGNER (/inspector) ↗',
                    backgroundColor: '#1e293b',
                    textColor: '#f59e0b',
                    color: '#f59e0b',
                    fontSize: 12,
                    fontWeight: 'bold',
                    borderRadius: 8,
                    triggers: [
                        { 
                            name: 'Launch Inspector Designer', 
                            event: 'ON_CLICK', 
                            actions: [
                                { type: 'SHOW_MESSAGE', payload: { message: 'Membuka Studio Inspector Designer Parameter Kualitas...', msgType: 'info' } }
                            ] 
                        }
                    ]
                }
            },

            // Right Bottom: Navigation
            {
                id: `s3_btn_to_copilot_${ts}`,
                type: 'BUTTON',
                x: 808, y: 350, w: 448, h: 54,
                props: {
                    label: 'LANJUT KE GEMINI OPERATIONAL COPILOT ▶',
                    text: 'LANJUT KE GEMINI OPERATIONAL COPILOT ▶',
                    backgroundColor: '#9333ea',
                    textColor: '#ffffff',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 'bold',
                    borderRadius: 10,
                    triggers: [{ name: 'Go to Copilot', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            },
            {
                id: `s3_btn_prev_${ts}`,
                type: 'BUTTON',
                x: 24, y: 610, w: 200, h: 42,
                props: {
                    label: '◀ KEMBALI KE KAMERA',
                    text: '◀ KEMBALI KE KAMERA',
                    backgroundColor: '#334155',
                    textColor: '#ffffff',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 'bold',
                    borderRadius: 8,
                    triggers: [{ name: 'Back to Vision', event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }]
                }
            }
        ]
    };

    // =========================================================================
    // STEP 4: GEMINI OPERATIONAL COPILOT & SOP GUIDANCE
    // =========================================================================
    const step4 = {
        id: `step_copilot_${ts}`,
        title: '4. Gemini Operational Copilot & SOP Guidance',
        stepType: 'Step',
        backgroundColor: '#0a0f1d',
        components: [
            // Top Nav
            {
                id: `s4_top_bar_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 1280, h: 56,
                props: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1 }
            },
            {
                id: `s4_top_title_${ts}`,
                type: 'TEXT',
                x: 24, y: 16, w: 600, h: 24,
                props: { text: '🧠 GEMINI ON VERTEX AI — OPERATIONAL COPILOT & SOP REASONING', fontSize: 16, fontWeight: 'bold', textColor: '#f8fafc', color: '#f8fafc' }
            },
            {
                id: `s4_top_model_${ts}`,
                type: 'TEXT',
                x: 950, y: 16, w: 300, h: 24,
                props: { text: 'Model: gemini-1.5-pro • Status: ONLINE', fontSize: 12, fontWeight: 'bold', textColor: '#a855f7', color: '#a855f7', textAlign: 'right' }
            },

            // Left Side: AI Copilot Chat Interface (Embedded AI_CHAT widget)
            {
                id: `s4_chat_${ts}`,
                name: 'gemini_operator_chat',
                type: 'AI_CHAT',
                x: 24, y: 72, w: 760, h: 520,
                props: {
                    title: 'Gemini Shopfloor Copilot',
                    systemPrompt: 'Anda adalah asisten cerdas Gemini on Vertex AI untuk operator manufaktur MAVI MES. Berikan rekomendasi SOP, diagnosa akar masalah kegagalan, analisis BigQuery, dan mitigasi scrap.',
                    initialMessage: 'Halo Operator! Saya Gemini Copilot. Saya menganalisis hasil inspeksi kamera Vision AI, verifikasi Digital Checksheet, dan korelasi sensor BigQuery secara langsung. Ada yang ingin Anda konsultasikan?'
                }
            },

            // Right Top: Automated Root Cause Diagnosis
            {
                id: `s4_card_diag_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 808, y: 72, w: 448, h: 240,
                props: { backgroundColor: '#0f172a', borderColor: '#9333ea', borderWidth: 1, borderRadius: 14 }
            },
            {
                id: `s4_lbl_diag_${ts}`,
                type: 'TEXT',
                x: 828, y: 88, w: 400, h: 20,
                props: { text: 'DIAGNOSA AKAR MASALAH (ROOT CAUSE ANALYSIS)', fontSize: 11, fontWeight: 'bold', textColor: '#c084fc', color: '#c084fc' }
            },
            {
                id: `s4_txt_diag_${ts}`,
                type: 'TEXT',
                x: 828, y: 115, w: 408, h: 180,
                props: {
                    text: 'Status Pemeriksaan: Vision & Checksheet LULUS (5/5 Points).\n\nHistoris Anomali Terkini (Stamping Press 04):\n• Terjadi kenaikan vibrasi bearing 14% pada jam 09:30.\n• Rekomendasi Predictive Maintenance: Periksa pelumasan guide roller sebelum shift 2 untuk mencegah timbulnya goresan permukaan (surface abrasion).\n\n⚡ Tindakan Proaktif: Menghemat estimasi 45 unit scrap.',
                    fontSize: 12,
                    textColor: '#e2e8f0',
                    color: '#e2e8f0',
                    backgroundColor: '#1e293b',
                    padding: '12px',
                    borderRadius: '8px',
                    lineHeight: '1.6'
                }
            },

            // Right Middle: Standard Operating Procedure (SOP) Quick Guide
            {
                id: `s4_card_sop_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 808, y: 326, w: 448, h: 190,
                props: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 14 }
            },
            {
                id: `s4_lbl_sop_${ts}`,
                type: 'TEXT',
                x: 828, y: 342, w: 400, h: 20,
                props: { text: 'ACTIONABLE OPERATIONAL PROCEDURE (SOP-QC-402)', fontSize: 11, fontWeight: 'bold', textColor: '#64748b', color: '#64748b' }
            },
            {
                id: `s4_txt_sop_${ts}`,
                type: 'TEXT',
                x: 828, y: 368, w: 408, h: 130,
                props: {
                    text: '1. Apabila terdeteksi cacat CRITICAL: Tekan tombol Andon Merah & karantina lot.\n2. Apabila terdeteksi cacat MINOR: Kirim ke Rework Bench 01 untuk polishing 5 menit.\n3. Apabila PASS: Loloskan part ke conveyor packaging otomatis.\n4. Seluruh event tersinkronisasi otomatis ke BigQuery & Checksheet Log.',
                    fontSize: 12,
                    textColor: '#cbd5e1',
                    color: '#cbd5e1',
                    backgroundColor: '#1e293b',
                    padding: '12px',
                    borderRadius: '8px',
                    lineHeight: '1.5'
                }
            },

            // Bottom Buttons
            {
                id: `s4_btn_prev_${ts}`,
                type: 'BUTTON',
                x: 24, y: 610, w: 220, h: 44,
                props: {
                    label: '◀ KEMBALI KE CHECK SHEET',
                    text: '◀ KEMBALI KE CHECK SHEET',
                    backgroundColor: '#334155',
                    textColor: '#ffffff',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 'bold',
                    borderRadius: 8,
                    triggers: [{ name: 'Back to Checksheet', event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }]
                }
            },
            {
                id: `s4_btn_next_${ts}`,
                type: 'BUTTON',
                x: 808, y: 530, w: 448, h: 54,
                props: {
                    label: 'LANJUT KE EXECUTIVE DASHBOARD ▶',
                    text: 'LANJUT KE EXECUTIVE DASHBOARD ▶',
                    backgroundColor: '#059669',
                    textColor: '#ffffff',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 'bold',
                    borderRadius: 10,
                    triggers: [{ name: 'Go to Dashboard', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };

    // =========================================================================
    // STEP 5: EXECUTIVE QUALITY, OEE & BIGQUERY AUDIT DASHBOARD
    // =========================================================================
    const step5 = {
        id: `step_dashboard_${ts}`,
        title: '5. Executive Quality, OEE & BigQuery Dashboard',
        stepType: 'Step',
        backgroundColor: '#0a0f1d',
        components: [
            // Top Nav
            {
                id: `s5_top_bar_${ts}`,
                type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 1280, h: 56,
                props: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1 }
            },
            {
                id: `s5_top_title_${ts}`,
                type: 'TEXT',
                x: 24, y: 16, w: 600, h: 24,
                props: { text: '📊 EXECUTIVE QUALITY, OEE & BIGQUERY AUDIT TRAIL', fontSize: 16, fontWeight: 'bold', textColor: '#f8fafc', color: '#f8fafc' }
            },
            {
                id: `s5_top_sync_${ts}`,
                type: 'TEXT',
                x: 950, y: 16, w: 300, h: 24,
                props: { text: '● BigQuery Dataset: mavi_telemetry (Synced)', fontSize: 12, fontWeight: 'bold', textColor: '#10b981', color: '#10b981', textAlign: 'right' }
            },

            // 4 Top KPI Cards
            {
                id: `s5_kpi1_${ts}`,
                type: 'TEXT',
                x: 24, y: 72, w: 295, h: 84,
                props: {
                    text: 'TOTAL DIINSPEKSI SHIFT INI\n1,248 Part Unit\nTarget: 1,400 Unit (89.1%)',
                    fontSize: 12,
                    fontWeight: 'bold',
                    textColor: '#38bdf8',
                    color: '#38bdf8',
                    backgroundColor: '#0f172a',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid #1e293b'
                }
            },
            {
                id: `s5_kpi2_${ts}`,
                type: 'TEXT',
                x: 335, y: 72, w: 295, h: 84,
                props: {
                    text: 'FIRST-PASS YIELD (FPY)\n97.8 %\nToleransi: > 95.0% [OPTIMAL]',
                    fontSize: 12,
                    fontWeight: 'bold',
                    textColor: '#10b981',
                    color: '#10b981',
                    backgroundColor: '#0f172a',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid #1e293b'
                }
            },
            {
                id: `s5_kpi3_${ts}`,
                type: 'TEXT',
                x: 646, y: 72, w: 295, h: 84,
                props: {
                    text: 'DEFECT & SCRAP RATE\n1.4 %\nTarget: < 2.0% [TERKENDALI]',
                    fontSize: 12,
                    fontWeight: 'bold',
                    textColor: '#f59e0b',
                    color: '#f59e0b',
                    backgroundColor: '#0f172a',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid #1e293b'
                }
            },
            {
                id: `s5_kpi4_${ts}`,
                type: 'TEXT',
                x: 957, y: 72, w: 299, h: 84,
                props: {
                    text: 'OVERALL EQUIPMENT EFF. (OEE)\n88.5 %\nWorld-Class Benchmark (>85%)',
                    fontSize: 12,
                    fontWeight: 'bold',
                    textColor: '#a855f7',
                    color: '#a855f7',
                    backgroundColor: '#0f172a',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid #1e293b'
                }
            },

            // Middle: Interactive BigQuery Inspection Event Table
            {
                id: `s5_table_${ts}`,
                type: 'INTERACTIVE_TABLE',
                x: 24, y: 172, w: 1232, h: 360,
                props: {
                    title: 'BigQuery Real-Time Quality & Checksheet Audit Stream',
                    columns: ['Event ID', 'Waktu', 'Work Order', 'Part SKU', 'Checksheet', 'Defect Type', 'Confidence', 'Verdict', 'Scrap Saved', 'BigQuery Sync'],
                    data: [
                        { 'Event ID': 'EV-901', 'Waktu': '10:42:15', 'Work Order': 'WO-2026-ENG-8840', 'Part SKU': 'EV-BAT-CASE-M4', 'Checksheet': '5/5 PASS', 'Defect Type': 'None (Compliant)', 'Confidence': '99.4%', 'Verdict': 'PASS', 'Scrap Saved': '—', 'BigQuery Sync': 'Synced ✓' },
                        { 'Event ID': 'EV-902', 'Waktu': '10:44:30', 'Work Order': 'WO-2026-ENG-8840', 'Part SKU': 'EV-BAT-CASE-M4', 'Checksheet': '5/5 PASS', 'Defect Type': 'None (Compliant)', 'Confidence': '98.7%', 'Verdict': 'PASS', 'Scrap Saved': '—', 'BigQuery Sync': 'Synced ✓' },
                        { 'Event ID': 'EV-903', 'Waktu': '10:46:12', 'Work Order': 'WO-2026-ENG-8840', 'Part SKU': 'BRK-STAMP-X9', 'Checksheet': '4/5 FAIL (Scratch)', 'Defect Type': 'Surface Scratch', 'Confidence': '97.8%', 'Verdict': 'FAIL', 'Scrap Saved': '12.5 kg', 'BigQuery Sync': 'Synced ✓' },
                        { 'Event ID': 'EV-904', 'Waktu': '10:48:05', 'Work Order': 'WO-2026-ENG-8840', 'Part SKU': 'EV-BAT-CASE-M4', 'Checksheet': '5/5 PASS', 'Defect Type': 'None (Compliant)', 'Confidence': '99.1%', 'Verdict': 'PASS', 'Scrap Saved': '—', 'BigQuery Sync': 'Synced ✓' },
                        { 'Event ID': 'EV-905', 'Waktu': '10:50:20', 'Work Order': 'WO-2026-ENG-8840', 'Part SKU': 'VLV-HYD-50', 'Checksheet': '4/5 REWORK', 'Defect Type': 'Weld Porosity', 'Confidence': '94.2%', 'Verdict': 'REWORK', 'Scrap Saved': '4.2 kg', 'BigQuery Sync': 'Synced ✓' }
                    ]
                }
            },

            // Bottom Sustainability Impact Banner
            {
                id: `s5_banner_sustainability_${ts}`,
                type: 'TEXT',
                x: 24, y: 546, w: 850, h: 56,
                props: {
                    text: '🌱 SUSTAINABILITY & EMISSION IMPACT: Berkat integrasi Vision Builder & Digital Checksheet, total 42.8 kg scrap logam paduan berhasil dicegah hari ini (Estimasi pengurangan jejak karbon: ~68.4 kg CO2e).',
                    fontSize: 12,
                    fontWeight: 'bold',
                    textColor: '#10b981',
                    color: '#10b981',
                    backgroundColor: '#064e3b',
                    padding: '14px 18px',
                    borderRadius: '10px'
                }
            },

            // Bottom Buttons
            {
                id: `s5_btn_prev_${ts}`,
                type: 'BUTTON',
                x: 890, y: 546, w: 160, h: 56,
                props: {
                    label: '◀ KE COPILOT',
                    text: '◀ KE COPILOT',
                    backgroundColor: '#334155',
                    textColor: '#ffffff',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 'bold',
                    borderRadius: 10,
                    triggers: [{ name: 'Back to Copilot', event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }]
                }
            },
            {
                id: `s5_btn_finish_${ts}`,
                type: 'BUTTON',
                x: 1060, y: 546, w: 196, h: 56,
                props: {
                    label: 'SELESAIKAN LOT ✓',
                    text: 'SELESAIKAN LOT ✓',
                    backgroundColor: '#10b981',
                    textColor: '#ffffff',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 'bold',
                    borderRadius: 10,
                    triggers: [
                        { 
                            name: 'Finish and Sync', 
                            event: 'ON_CLICK', 
                            actions: [
                                { type: 'SHOW_MESSAGE', payload: { message: 'Laporan Vision & Checksheet Berhasil Disinkronkan ke BigQuery & Cloud Storage!', msgType: 'success' } },
                                { type: 'COMPLETE_APP' }
                            ] 
                        }
                    ]
                }
            }
        ]
    };

    return {
        id: `app_ai_vision_copilot_${ts}`,
        name: 'AI Vision Quality, Gemini Copilot & BigQuery Dashboard',
        description: 'End-to-End AI-powered manufacturing solution: Visual Quality Inspection (Vision Builder), Digital Checksheet (ISO 9001), Operational Copilot (Gemini on Vertex AI), and Live BigQuery Telemetry Dashboard.',
        category: 'Quality',
        type: 'FRONT-LINE',
        builder_type: 'app_builder',
        published: true,
        approval_status: 'APPROVED',
        approvalStatus: 'APPROVED',
        created_at: iso,
        updated_at: iso,
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables,
            recordPlaceholders: [
                {
                    id: `rp_bq_events_${ts}`,
                    name: 'BigQuery_Quality_Log',
                    tableId: 'BigQuery_Vision_Quality_Events',
                    description: 'Audit log event inspeksi kualitas real-time'
                },
                {
                    id: `rp_qa_checksheet_${ts}`,
                    name: 'QA_Checksheet_Log',
                    tableId: 'tbl_qa_drawing_checksheets',
                    description: 'Log verifikasi checksheet mutu ISO 9001'
                }
            ],
            appTables: ['BigQuery_Vision_Quality_Events', 'tbl_qa_drawing_checksheets', 'tbl_qa_drawing_check_items'],
            steps: [
                step1,
                step2,
                step3,
                step4,
                step5
            ]
        }
    };
}
