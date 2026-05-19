export function createFrontlineQmsTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        defectEvents: 'tbl_qms_defect_events',
        capaIncidents: 'tbl_qms_capa_incidents'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_Defect_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Notes', type: 'string', defaultValue: '', persisted: true },
        { id: `v3_${ts}`, name: 'Screw_Check', type: 'boolean', defaultValue: true, persisted: true },
        { id: `v4_${ts}`, name: 'Alignment_Check', type: 'boolean', defaultValue: true, persisted: true },
        { id: `v5_${ts}`, name: 'CAPA_Root_Cause', type: 'string', defaultValue: '', persisted: true },
        { id: `v6_${ts}`, name: 'CAPA_Action_Plan', type: 'string', defaultValue: '', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Selected_Defect', tableId: T.defectEvents, type: 'single' }
    ];

    // --- STEP 1: Defect Dashboard (MRB Grid) ---
    const stepDashboard = {
        id: `s_defect_dashboard_${ts}`,
        title: 'Material Review Board',
        stepType: 'Step',
        components: [
            {
                id: `db_lbl_title_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 900, h: 35,
                props: { text: 'Frontline Quality Management - Active Defect Backlog', fontSize: 22, fontWeight: 'bold' }
            },
            {
                id: `db_tbl_defects_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 65, w: 920, h: 400,
                props: {
                    tableId: T.defectEvents,
                    title: '',
                    columns: ['ID', 'Work_Order_ID', 'Unit_ID', 'Material_Definition_ID', 'Reason', 'Status']
                },
                triggers: [
                    {
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.defectEvents, recordPlaceholderId: `r1_${ts}`, linkVariable: 'Selected_Defect_ID'
                    }
                ]
            },
            // Actions
            {
                id: `db_btn_manage_${ts}`, type: 'BUTTON',
                x: 20, y: 485, w: 220, h: 50,
                props: { text: 'Manage Selected Defect', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_manage_defect_${ts}` }
                ]
            },
            {
                id: `db_btn_new_inspect_${ts}`, type: 'BUTTON',
                x: 260, y: 485, w: 220, h: 50,
                props: { text: '🔍 Run Unit Inspection', backgroundColor: '#0ea5e9', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_inspect_unit_${ts}` }
                ]
            },
            {
                id: `db_btn_capa_${ts}`, type: 'BUTTON',
                x: 720, y: 485, w: 220, h: 50,
                props: { text: '🛡️ Raise CAPA Event', backgroundColor: '#e2e8f0', color: '#1e293b', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_capa_incident_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 2: Manage Defect - Unit (MATCHING USER SCREENSHOT 1) ---
    const stepManageDefect = {
        id: `s_manage_defect_${ts}`,
        title: 'Manage defect - unit',
        stepType: 'Step',
        components: [
            // Left Panel: Details of defect event
            {
                id: `md_lbl_left_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 460, h: 30,
                props: { text: 'Details of defect event', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `md_det_id_${ts}`, type: 'TEXT',
                x: 280, y: 15, w: 200, h: 30,
                props: { text: '{{@Selected_Defect.ID}}', fontSize: 18, color: '#1e293b', fontWeight: 'bold' }
            },
            {
                id: `md_det_wo_${ts}`, type: 'TEXT',
                x: 20, y: 65, w: 210, h: 45,
                props: { text: 'Work Order ID\n{{@Selected_Defect.Work_Order_ID}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `md_det_unit_${ts}`, type: 'TEXT',
                x: 250, y: 65, w: 230, h: 45,
                props: { text: 'Unit ID\n{{@Selected_Defect.Unit_ID}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `md_det_mat_${ts}`, type: 'TEXT',
                x: 20, y: 130, w: 210, h: 45,
                props: { text: 'Material Definition ID\n{{@Selected_Defect.Material_Definition_ID}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `md_det_reason_${ts}`, type: 'TEXT',
                x: 250, y: 130, w: 230, h: 100,
                props: { text: 'Reason\n{{@Selected_Defect.Reason}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `md_det_desc_${ts}`, type: 'TEXT',
                x: 20, y: 240, w: 460, h: 220,
                props: { text: 'Description\n{{@Selected_Defect.Description}}', fontSize: 13, color: '#64748b', fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '16px' }
            },

            // Right Panel: 3 vertical action buttons
            {
                id: `md_btn_scrap_${ts}`, type: 'BUTTON',
                x: 510, y: 15, w: 430, h: 130,
                props: { text: '🗑️ Mark as scrap', backgroundColor: '#dc2626', color: 'white', fontSize: 18, fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Unit status updated to SCRAPPED.', messageType: 'error' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_defect_dashboard_${ts}` }
                ]
            },
            {
                id: `md_btn_rework_${ts}`, type: 'BUTTON',
                x: 510, y: 165, w: 430, h: 130,
                props: { text: '🔧 Send to rework', backgroundColor: '#fbbf24', color: '#78350f', fontSize: 18, fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Unit status updated to REWORK IN PROGRESS.', messageType: 'warning' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_defect_dashboard_${ts}` }
                ]
            },
            {
                id: `md_btn_use_${ts}`, type: 'BUTTON',
                x: 510, y: 315, w: 430, h: 130,
                props: { text: '✓ Use-as-is', backgroundColor: '#16a34a', color: 'white', fontSize: 18, fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Deviation approved! Unit status set to USE AS IS.', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_defect_dashboard_${ts}` }
                ]
            },

            // Footer Left button
            {
                id: `md_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Previous', backgroundColor: '#e2e8f0', color: '#1e40af', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_defect_dashboard_${ts}` }]
            }
        ]
    };

    // --- STEP 3: Inspect Unit (MATCHING USER SCREENSHOT 2) ---
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
                id: `iu_img_ref_${ts}`, type: 'TEXT',
                x: 20, y: 195, w: 460, h: 270,
                props: { text: '⚙️ Cylinder Assembly Reference\n[Marker 1: Alignment] [Marker 2: Screws]', fontSize: 14, backgroundColor: '#f8fafc', color: '#64748b', textAlignment: 1, padding: '100px' }
            },

            // Bottom Right Panel: Criteria Checklist
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
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Visual Inspection failed! Defect event logged.', messageType: 'error' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_defect_dashboard_${ts}` }
                ]
            },
            {
                id: `iu_btn_pass_${ts}`, type: 'BUTTON',
                x: 730, y: 385, w: 190, h: 50,
                props: { text: '✓ Pass', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Visual Inspection passed!', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_defect_dashboard_${ts}` }
                ]
            },

            // Footer Left actions
            {
                id: `iu_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Previous', backgroundColor: '#e2e8f0', color: '#1e40af', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_defect_dashboard_${ts}` }]
            },
            {
                id: `iu_btn_comment_${ts}`, type: 'BUTTON',
                x: 180, y: 495, w: 180, h: 45,
                props: { text: '⚠️ Report Comment', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Deviation comment reported!', messageType: 'warning' }
                ]
            }
        ]
    };

    // --- STEP 4: CAPA Incident Logging ---
    const stepCapaIncident = {
        id: `s_capa_incident_${ts}`,
        title: 'CAPA Incident',
        stepType: 'Step',
        components: [
            {
                id: `cp_lbl_title_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 900, h: 35,
                props: { text: 'Raise CAPA Event (Corrective and Preventive Action)', fontSize: 22, fontWeight: 'bold' }
            },
            {
                id: `cp_desc_${ts}`, type: 'TEXT',
                x: 20, y: 65, w: 920, h: 60,
                props: { text: 'Associate a quality defect or audit non-compliance with a rigorous engineering investigation. Log root cause analyses and draft corrective action items to prevent event recurrence.', fontSize: 14, color: '#475569' }
            },
            {
                id: `cp_lbl_assoc_${ts}`, type: 'TEXT',
                x: 20, y: 145, w: 440, h: 25,
                props: { text: 'Associated Defect Event ID\n{{@Selected_Defect.ID}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `cp_lbl_cause_${ts}`, type: 'TEXT',
                x: 20, y: 215, w: 440, h: 25,
                props: { text: 'Root Cause Analysis *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `cp_in_cause_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 245, w: 440, h: 200,
                props: { targetVariable: 'CAPA_Root_Cause', placeholder: 'Execute 5-Why analysis and describe the core process/mechanical failure...' }
            },
            {
                id: `cp_lbl_plan_${ts}`, type: 'TEXT',
                x: 500, y: 215, w: 440, h: 25,
                props: { text: 'Corrective / Preventive Action Plan *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `cp_in_plan_${ts}`, type: 'TEXT_INPUT',
                x: 500, y: 245, w: 440, h: 200,
                props: { targetVariable: 'CAPA_Action_Plan', placeholder: 'Detail the engineering modifications or training measures to prevent recurrence...' }
            },
            // Actions
            {
                id: `cp_btn_cancel_${ts}`, type: 'BUTTON',
                x: 20, y: 485, w: 150, h: 45,
                props: { text: 'Cancel', backgroundColor: '#e2e8f0', color: '#1e293b', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_defect_dashboard_${ts}` }]
            },
            {
                id: `cp_btn_submit_${ts}`, type: 'BUTTON',
                x: 740, y: 485, w: 200, h: 45,
                props: { text: '✓ Submit CAPA', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'CAPA event submitted successfully to Back-office QMS.', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_defect_dashboard_${ts}` }
                ]
            }
        ]
    };

    return {
        id: `app_qms_${ts}`,
        name: 'Frontline QMS',
        description: 'Manage shopfloor quality deviations, defects, and raise corrective actions (CAPA) inside the Frontline QMS suite.',
        category: 'Quality',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.defectEvents, T.capaIncidents],
            appTriggers: [],
            steps: [stepDashboard, stepManageDefect, stepInspectUnit, stepCapaIncident],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
