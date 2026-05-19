export function createQualityInspectionSuiteTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        inspectionPlans: 'tbl_qi_inspection_plans',
        inspectionResults: 'tbl_qi_inspection_results'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_Plan_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Numeric_Result', type: 'number', defaultValue: 450, persisted: true },
        { id: `v3_${ts}`, name: 'Notes', type: 'string', defaultValue: '', persisted: true },
        { id: `v4_${ts}`, name: 'Screw_Check', type: 'boolean', defaultValue: true, persisted: true },
        { id: `v5_${ts}`, name: 'Alignment_Check', type: 'boolean', defaultValue: true, persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Selected_Plan', tableId: T.inspectionPlans, type: 'single' }
    ];

    // --- STEP 1: Review Plan (MATCHING USER SCREENSHOT 1) ---
    const stepReviewPlan = {
        id: `s_review_plan_${ts}`,
        title: 'Review plan',
        stepType: 'Step',
        components: [
            // Left Panel: Inspection plan created
            {
                id: `rp_lbl_left_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 600, h: 30,
                props: { text: 'Inspection plan created', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `rp_tbl_plans_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 55, w: 600, h: 420,
                props: {
                    tableId: T.inspectionPlans,
                    title: '',
                    columns: ['Product_ID', 'Inspection_Name', 'Inspection_Description', 'Target', 'UoM']
                },
                triggers: [
                    {
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.inspectionPlans, recordPlaceholderId: `r1_${ts}`, linkVariable: 'Selected_Plan_ID'
                    }
                ]
            },
            // Right Panel: Selected Plan Detail
            {
                id: `rp_lbl_right_${ts}`, type: 'HEADING',
                x: 640, y: 15, w: 300, h: 30,
                props: { text: 'Inspection plan created', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `rp_det_id_${ts}`, type: 'TEXT',
                x: 640, y: 55, w: 280, h: 45,
                props: { text: 'ID\n{{@Selected_Plan.ID}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `rp_det_pid_${ts}`, type: 'TEXT',
                x: 640, y: 110, w: 280, h: 45,
                props: { text: 'Product ID\n{{@Selected_Plan.Product_ID}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `rp_det_name_${ts}`, type: 'TEXT',
                x: 640, y: 165, w: 280, h: 45,
                props: { text: 'Inspection Name\n{{@Selected_Plan.Inspection_Name}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `rp_det_desc_${ts}`, type: 'TEXT',
                x: 640, y: 220, w: 280, h: 55,
                props: { text: 'Inspection Description\n{{@Selected_Plan.Inspection_Description}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `rp_det_target_${ts}`, type: 'TEXT',
                x: 640, y: 285, w: 130, h: 45,
                props: { text: 'Target\n{{@Selected_Plan.Target}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `rp_det_uom_${ts}`, type: 'TEXT',
                x: 780, y: 285, w: 130, h: 45,
                props: { text: 'Unit of Measure\n{{@Selected_Plan.UoM}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `rp_btn_remove_${ts}`, type: 'BUTTON',
                x: 640, y: 350, w: 280, h: 45,
                props: { text: '🗑️ Remove inspection', backgroundColor: '#fef2f2', color: '#b91c1c', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Inspection item removed from active plan.', messageType: 'info' }
                ]
            },
            // Footer bottom buttons
            {
                id: `rp_btn_add_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 200, h: 45,
                props: { text: '← Add more inspections', backgroundColor: '#f1f5f9', color: '#1e40af', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Ready to compose more parameters!', messageType: 'success' }
                ]
            },
            {
                id: `rp_btn_confirm_${ts}`, type: 'BUTTON',
                x: 760, y: 495, w: 180, h: 45,
                props: { text: '✓ Confirm', backgroundColor: '#15803d', color: 'white', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_record_numeric_${ts}` }]
            }
        ]
    };

    // --- STEP 2: Record Numeric Results (MATCHING USER SCREENSHOT 2) ---
    const stepRecordNumeric = {
        id: `s_record_numeric_${ts}`,
        title: 'Record numeric results',
        stepType: 'Step',
        components: [
            // Top horizontal info card
            {
                id: `rn_info_wo_${ts}`, type: 'TEXT',
                x: 20, y: 15, w: 280, h: 60,
                props: { text: 'WO info\nID: WO-53401025022025', fontSize: 13, color: '#1e293b', fontWeight: 'bold' }
            },
            {
                id: `rn_info_mat_${ts}`, type: 'TEXT',
                x: 320, y: 15, w: 280, h: 60,
                props: { text: 'Material Definition ID\nDEMO-CYL-A1', fontSize: 13, color: '#1e293b', fontWeight: 'bold' }
            },
            {
                id: `rn_info_loc_${ts}`, type: 'TEXT',
                x: 620, y: 15, w: 320, h: 60,
                props: { text: 'Location\nTest Station 1', fontSize: 13, color: '#1e293b', fontWeight: 'bold' }
            },

            // Bottom Left Panel: Instructions
            {
                id: `rn_lbl_inst_${ts}`, type: 'HEADING',
                x: 20, y: 95, w: 460, h: 30,
                props: { text: 'Instructions', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `rn_txt_inst_${ts}`, type: 'TEXT',
                x: 20, y: 135, w: 460, h: 330,
                props: { text: 'Place the assembled unit on the scale and enter the measured value in grams', fontSize: 18, fontWeight: 'bold', textAlignment: 1, padding: '100px' }
            },

            // Bottom Right Panel: Report test results
            {
                id: `rn_lbl_rep_${ts}`, type: 'HEADING',
                x: 500, y: 95, w: 440, h: 30,
                props: { text: 'Report test results', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `rn_lbl_res_${ts}`, type: 'TEXT',
                x: 520, y: 135, w: 100, h: 25,
                props: { text: 'Result *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `rn_in_res_${ts}`, type: 'TEXT_INPUT',
                x: 520, y: 165, w: 180, h: 40,
                props: { targetVariable: 'Numeric_Result', placeholder: '450' }
            },
            {
                id: `rn_uom_${ts}`, type: 'TEXT',
                x: 710, y: 165, w: 40, h: 40,
                props: { text: 'g', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `rn_lbl_limits_${ts}`, type: 'TEXT',
                x: 780, y: 135, w: 140, h: 70,
                props: { text: 'Upper Limit: 455\nLower Limit: 445', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `rn_lbl_notes_${ts}`, type: 'TEXT',
                x: 520, y: 220, w: 400, h: 25,
                props: { text: 'Inspection notes', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `rn_in_notes_${ts}`, type: 'TEXT_INPUT',
                x: 520, y: 250, w: 400, h: 100,
                props: { targetVariable: 'Notes', placeholder: 'Enter comments...' }
            },

            // Footer buttons (← Previous, Next →)
            {
                id: `rn_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Previous', backgroundColor: '#e2e8f0', color: '#1e40af', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_review_plan_${ts}` }]
            },
            {
                id: `rn_btn_next_${ts}`, type: 'BUTTON',
                x: 780, y: 495, w: 160, h: 45,
                props: { text: 'Next →', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_inspect_unit_${ts}` }]
            }
        ]
    };

    // --- STEP 3: Inspect Unit (MATCHING USER SCREENSHOT 3) ---
    const stepInspectUnit = {
        id: `s_inspect_unit_${ts}`,
        title: 'Inspect unit',
        stepType: 'Step',
        components: [
            // Top horizontal info card
            {
                id: `iu_info_pu_${ts}`, type: 'TEXT',
                x: 20, y: 15, w: 280, h: 60,
                props: { text: 'Unit info\nID: PU-55401025022025', fontSize: 13, color: '#1e293b', fontWeight: 'bold' }
            },
            {
                id: `iu_info_mat_${ts}`, type: 'TEXT',
                x: 320, y: 15, w: 280, h: 60,
                props: { text: 'Material Definition ID\nDEMO-CYL-A1', fontSize: 13, color: '#1e293b', fontWeight: 'bold' }
            },
            {
                id: `iu_info_stat_${ts}`, type: 'TEXT',
                x: 620, y: 15, w: 320, h: 60,
                props: { text: 'Status\nPENDING INSPECTION', fontSize: 13, color: '#1e293b', fontWeight: 'bold' }
            },

            // Bottom Left Panel: Instructions with Cylinder Graphic Reference
            {
                id: `iu_lbl_inst_${ts}`, type: 'HEADING',
                x: 20, y: 95, w: 460, h: 30,
                props: { text: 'Instructions', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `iu_txt_inst_${ts}`, type: 'TEXT',
                x: 20, y: 135, w: 460, h: 50,
                props: { text: 'Compare the assembled unit to the reference image', fontSize: 15, color: '#1e293b' }
            },
            {
                id: `iu_img_ref_${ts}`, type: 'TEXT', // Cylinder drawing box with markers
                x: 20, y: 195, w: 460, h: 270,
                props: { text: '⚙️ Cylinder Assembly Reference\n[Marker 1: Alignment] [Marker 2: Screws]', fontSize: 14, backgroundColor: '#f8fafc', color: '#64748b', textAlignment: 1, padding: '100px' }
            },

            // Bottom Right Panel: Criteria
            {
                id: `iu_lbl_crit_${ts}`, type: 'HEADING',
                x: 500, y: 95, w: 440, h: 30,
                props: { text: 'Criteria', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `iu_chk_screws_${ts}`, type: 'CHECKBOX',
                x: 520, y: 135, w: 400, h: 40,
                props: { label: '1. All four screws are tightly installed *', targetVariable: 'Screw_Check' }
            },
            {
                id: `iu_chk_align_${ts}`, type: 'CHECKBOX',
                x: 520, y: 185, w: 400, h: 40,
                props: { label: '2. End cap well aligned *', targetVariable: 'Alignment_Check' }
            },
            {
                id: `iu_lbl_notes_${ts}`, type: 'TEXT',
                x: 520, y: 235, w: 400, h: 25,
                props: { text: 'Inspection notes', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `iu_in_notes_${ts}`, type: 'TEXT_INPUT',
                x: 520, y: 265, w: 400, h: 100,
                props: { targetVariable: 'Notes', placeholder: 'Enter criteria comments...' }
            },
            // Row of Fail / Pass Buttons
            {
                id: `iu_btn_fail_${ts}`, type: 'BUTTON',
                x: 520, y: 385, w: 190, h: 50,
                props: { text: '❌ Fail', backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Inspection marked as FAILED!', messageType: 'error' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_review_plan_${ts}` }
                ]
            },
            {
                id: `iu_btn_pass_${ts}`, type: 'BUTTON',
                x: 730, y: 385, w: 190, h: 50,
                props: { text: '✓ Pass', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Inspection marked as PASSED!', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_review_plan_${ts}` }
                ]
            },

            // Footer Left actions
            {
                id: `iu_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Previous', backgroundColor: '#e2e8f0', color: '#1e40af', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_record_numeric_${ts}` }]
            },
            {
                id: `iu_btn_comment_${ts}`, type: 'BUTTON',
                x: 180, y: 495, w: 180, h: 45,
                props: { text: '⚠️ Report Comment', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Ad-hoc comment reported to quality engineering!', messageType: 'warning' }
                ]
            }
        ]
    };

    return {
        id: `app_qi_${ts}`,
        name: 'Quality Inspection Suite',
        description: 'Digitize inspection plans and execute either dynamic testing runs or composed guided quality inspections.',
        category: 'Composable MES for Discrete Manufacturing',
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
            steps: [stepReviewPlan, stepRecordNumeric, stepInspectUnit],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
