export function createMaterialReviewBoardTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        defectEvents: 'tbl_mrb_defect_events',
        workOrders: 'tbl_mrb_work_orders'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_Defect_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'MRB_Justification', type: 'string', defaultValue: '', persisted: true },
        { id: `v3_${ts}`, name: 'Rework_Instructions', type: 'string', defaultValue: '', persisted: true },
        { id: `v4_${ts}`, name: 'Rework_Assignee', type: 'string', defaultValue: 'Adam Veres', persisted: true },
        { id: `v5_${ts}`, name: 'Rework_Station', type: 'string', defaultValue: 'Station 1', persisted: true },
        { id: `v6_${ts}`, name: 'Upload_Evidence', type: 'string', defaultValue: '', persisted: true },
        { id: `v7_${ts}`, name: 'Edit_Description', type: 'string', defaultValue: '', persisted: true },
        { id: `v8_${ts}`, name: 'Edit_Reason', type: 'string', defaultValue: '', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Selected_Defect', tableId: T.defectEvents, type: 'single' }
    ];

    // --- STEP 1: MRB Dashboard ---
    const stepDashboard = {
        id: `s_mrb_dashboard_${ts}`,
        title: 'MRB Dashboard',
        stepType: 'Step',
        components: [
            {
                id: `db_lbl_title_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 920, h: 35,
                props: { text: 'Material Review Board - Defect Backlog', fontSize: 22, fontWeight: 'bold' }
            },
            {
                id: `db_tbl_defects_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 65, w: 920, h: 400,
                props: {
                    tableId: T.defectEvents,
                    title: '',
                    columns: ['ID', 'Work_Order_ID', 'Unit_ID', 'Material_Definition_ID', 'Reason', 'Description', 'Status']
                },
                triggers: [
                    {
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.defectEvents, recordPlaceholderId: `r1_${ts}`, linkVariable: 'Selected_Defect_ID'
                    }
                ]
            },
            {
                id: `db_btn_review_${ts}`, type: 'BUTTON',
                x: 20, y: 485, w: 250, h: 50,
                props: { text: '🔍 Review Defect & Disposition', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_review_defect_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 2: Review Defect ---
    const stepReviewDefect = {
        id: `s_review_defect_${ts}`,
        title: 'Review Defect',
        stepType: 'Step',
        components: [
            {
                id: `rd_lbl_left_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 460, h: 30,
                props: { text: 'Defect Investigation & Verification', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `rd_det_id_${ts}`, type: 'TEXT',
                x: 380, y: 15, w: 100, h: 30,
                props: { text: 'ID: {{@Selected_Defect.ID}}', fontSize: 16, color: '#1e293b', fontWeight: 'bold' }
            },
            {
                id: `rd_det_wo_${ts}`, type: 'TEXT',
                x: 20, y: 65, w: 220, h: 45,
                props: { text: 'Work Order ID\n{{@Selected_Defect.Work_Order_ID}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `rd_det_unit_${ts}`, type: 'TEXT',
                x: 260, y: 65, w: 220, h: 45,
                props: { text: 'Unit ID\n{{@Selected_Defect.Unit_ID}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `rd_det_mat_${ts}`, type: 'TEXT',
                x: 20, y: 120, w: 220, h: 45,
                props: { text: 'Material Definition ID\n{{@Selected_Defect.Material_Definition_ID}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `rd_det_status_${ts}`, type: 'TEXT',
                x: 260, y: 120, w: 220, h: 45,
                props: { text: 'Current Status\n{{@Selected_Defect.Status}}', fontSize: 13, color: '#e11d48', fontWeight: 'bold' }
            },
            {
                id: `rd_det_reason_${ts}`, type: 'TEXT',
                x: 20, y: 180, w: 460, h: 60,
                props: { text: 'Reported Reason\n{{@Selected_Defect.Reason}}', fontSize: 13, color: '#475569', fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '10px' }
            },
            {
                id: `rd_det_desc_${ts}`, type: 'TEXT',
                x: 20, y: 255, w: 460, h: 100,
                props: { text: 'Reported Description\n{{@Selected_Defect.Description}}', fontSize: 13, color: '#475569', fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '10px' }
            },
            {
                id: `rd_in_desc_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 370, w: 460, h: 80,
                props: { label: 'Modify Description / Add Details', targetVariable: 'Edit_Description', multiline: true, placeholder: 'Enter engineering comments...' }
            },
            
            // Right Panel: Form controls
            {
                id: `rd_lbl_right_${ts}`, type: 'HEADING',
                x: 510, y: 15, w: 430, h: 30,
                props: { text: 'Verify & Modify Defect Details', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `rd_in_reason_${ts}`, type: 'TEXT_INPUT',
                x: 510, y: 65, w: 430, h: 45,
                props: { label: 'Verify Defect Reason', targetVariable: 'Edit_Reason', placeholder: 'Alignment check failed, material deviation, etc.' }
            },
            {
                id: `rd_lbl_hint_${ts}`, type: 'TEXT',
                x: 510, y: 130, w: 430, h: 120,
                props: { text: 'Engineering Instructions:\n\n1. Review the logged defect details on the left.\n2. Modify the Defect Reason or description details if needed.\n3. Click "Save Modification" to persist updates.\n4. Click "Proceed to Disposition" to scrap, rework, or approve.', fontSize: 13, color: '#475569', backgroundColor: '#eff6ff', padding: '15px' }
            },
            {
                id: `rd_btn_save_${ts}`, type: 'BUTTON',
                x: 510, y: 270, w: 430, h: 50,
                props: { text: '💾 Save Modifications', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Description': '{{@Edit_Description}}',
                            'Reason': '{{@Edit_Reason}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Defect details updated in database.', messageType: 'success' }
                ]
            },
            {
                id: `rd_btn_go_disp_${ts}`, type: 'BUTTON',
                x: 510, y: 340, w: 430, h: 110,
                props: { text: '⚡ Proceed to Disposition Selection', backgroundColor: '#3b82f6', color: 'white', fontSize: 16, fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_select_disposition_${ts}` }
                ]
            },

            // Footer navigation
            {
                id: `rd_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Back to List', backgroundColor: '#e2e8f0', color: 'black', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_mrb_dashboard_${ts}` }]
            }
        ]
    };

    // --- STEP 3: Select Disposition ---
    const stepSelectDisposition = {
        id: `s_select_disposition_${ts}`,
        title: 'Select Disposition',
        stepType: 'Step',
        components: [
            {
                id: `sd_lbl_title_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 920, h: 35,
                props: { text: 'Select Material Disposition Decision', fontSize: 22, fontWeight: 'bold' }
            },
            {
                id: `sd_card_left_${ts}`, type: 'TEXT',
                x: 20, y: 65, w: 460, h: 380,
                props: { text: 'Material Review Summary\n\nDefect ID: {{@Selected_Defect.ID}}\n\nWork Order: {{@Selected_Defect.Work_Order_ID}}\n\nUnit ID: {{@Selected_Defect.Unit_ID}}\n\nMaterial: {{@Selected_Defect.Material_Definition_ID}}\n\nStatus: {{@Selected_Defect.Status}}\n\nDescription:\n{{@Selected_Defect.Description}}', fontSize: 14, color: '#334155', backgroundColor: '#f8fafc', padding: '24px' }
            },
            
            // Actions
            {
                id: `sd_btn_scrap_${ts}`, type: 'BUTTON',
                x: 510, y: 65, w: 430, h: 110,
                props: { text: '🗑️ Mark as scrap', backgroundColor: '#dc2626', color: 'white', fontSize: 18, fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_disp_scrap_${ts}` }
                ]
            },
            {
                id: `sd_btn_rework_${ts}`, type: 'BUTTON',
                x: 510, y: 195, w: 430, h: 110,
                props: { text: '🔧 Send to rework', backgroundColor: '#fbbf24', color: '#78350f', fontSize: 18, fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_disp_rework_${ts}` }
                ]
            },
            {
                id: `sd_btn_use_${ts}`, type: 'BUTTON',
                x: 510, y: 325, w: 430, h: 110,
                props: { text: '✓ Use-as-is (Deviation)', backgroundColor: '#16a34a', color: 'white', fontSize: 18, fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_disp_use_as_is_${ts}` }
                ]
            },

            // Footer Left button
            {
                id: `sd_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Back to Review', backgroundColor: '#e2e8f0', color: 'black', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_review_defect_${ts}` }]
            }
        ]
    };

    // --- STEP 4: Scrap Disposition ---
    const stepDispScrap = {
        id: `s_disp_scrap_${ts}`,
        title: 'Scrap Disposition',
        stepType: 'Step',
        components: [
            {
                id: `sc_lbl_title_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 920, h: 35,
                props: { text: '🗑️ Scrap Material Disposition Form', fontSize: 22, fontWeight: 'bold' }
            },
            {
                id: `sc_desc_${ts}`, type: 'TEXT',
                x: 20, y: 65, w: 460, h: 110,
                props: { text: 'Deciding to scrap implies that the defective material cannot be salvaged through rework or engineering deviation. It will be decommissioned and recorded in the inventory system.\n\nMaterial Defect ID: {{@Selected_Defect.ID}}', fontSize: 14, color: '#64748b', backgroundColor: '#fff5f5', padding: '15px' }
            },
            {
                id: `sc_lbl_just_${ts}`, type: 'TEXT',
                x: 20, y: 195, w: 460, h: 25,
                props: { text: 'Scrap Justification / Rationale *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `sc_in_just_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 225, w: 460, h: 220,
                props: { targetVariable: 'MRB_Justification', multiline: true, placeholder: 'Specify justification details for scraping this component...' }
            },

            // Right Panel: Evidence upload
            {
                id: `sc_lbl_evidence_${ts}`, type: 'TEXT',
                x: 510, y: 65, w: 430, h: 30,
                props: { text: 'Supporting Evidence (Image URL / Doc Link)', fontSize: 15, fontWeight: 'bold' }
            },
            {
                id: `sc_in_evidence_${ts}`, type: 'TEXT_INPUT',
                x: 510, y: 100, w: 430, h: 45,
                props: { targetVariable: 'Upload_Evidence', placeholder: 'Paste image link or upload evidence URL...' }
            },
            {
                id: `sc_viewfinder_${ts}`, type: 'TEXT',
                x: 510, y: 165, w: 430, h: 215,
                props: { text: '📷 Evidence Viewfinder Mock\n[Click Capture to assign standard image]', fontSize: 13, backgroundColor: '#000000', color: '#ffffff', textAlignment: 1, padding: '75px' }
            },
            {
                id: `sc_btn_capture_${ts}`, type: 'BUTTON',
                x: 820, y: 335, w: 110, h: 35,
                props: { text: '⚙ Capture', backgroundColor: '#3b82f6', color: 'white', fontSize: 13 },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Upload_Evidence', value: 'https://images.unsplash.com/photo-1597430138224-22ccd8079f82?auto=format&fit=crop&w=400&q=80' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Evidence Captured!', messageType: 'success' }
                ]
            },

            // Footer actions
            {
                id: `sc_btn_cancel_${ts}`, type: 'BUTTON',
                x: 20, y: 485, w: 150, h: 45,
                props: { text: 'Cancel', backgroundColor: '#e2e8f0', color: '#1e293b', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_select_disposition_${ts}` }]
            },
            {
                id: `sc_btn_submit_${ts}`, type: 'BUTTON',
                x: 740, y: 485, w: 200, h: 45,
                props: { text: '🗑️ Submit Scrap Decision', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Status': 'SCRAPPED',
                            'Disposition': 'SCRAP',
                            'MRB_Justification': '{{@MRB_Justification}}',
                            'Upload_Evidence': '{{@Upload_Evidence}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'MRB_Justification' },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Upload_Evidence' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Material disposition set to SCRAP.', messageType: 'error' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_mrb_dashboard_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 5: Rework Disposition ---
    const stepDispRework = {
        id: `s_disp_rework_${ts}`,
        title: 'Rework Disposition',
        stepType: 'Step',
        components: [
            {
                id: `rw_lbl_title_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 920, h: 35,
                props: { text: '🔧 Assign Rework Disposition Form', fontSize: 22, fontWeight: 'bold' }
            },
            {
                id: `rw_lbl_inst_${ts}`, type: 'TEXT',
                x: 20, y: 65, w: 460, h: 25,
                props: { text: 'Rework Instructions *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `rw_in_inst_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 95, w: 460, h: 120,
                props: { targetVariable: 'Rework_Instructions', multiline: true, placeholder: 'Detail step-by-step instructions for the rework technician...' }
            },
            {
                id: `rw_lbl_assignee_${ts}`, type: 'TEXT',
                x: 20, y: 230, w: 460, h: 25,
                props: { text: 'Select Rework Assignee *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `rw_rad_assignee_${ts}`, type: 'RADIO_GROUP',
                x: 20, y: 260, w: 460, h: 60,
                props: { targetVariable: 'Rework_Assignee', options: ['Adam Veres', 'Lianna Churchill', 'Assembly Team A', 'Quality Tech B'] }
            },
            {
                id: `rw_lbl_station_${ts}`, type: 'TEXT',
                x: 20, y: 335, w: 460, h: 25,
                props: { text: 'Select Rework Station *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `rw_rad_station_${ts}`, type: 'RADIO_GROUP',
                x: 20, y: 365, w: 460, h: 60,
                props: { targetVariable: 'Rework_Station', options: ['Rework Station 1', 'Rework Station 2', 'Assembly Station 2'] }
            },

            // Right Panel: Evidence upload
            {
                id: `rw_lbl_evidence_${ts}`, type: 'TEXT',
                x: 510, y: 65, w: 430, h: 30,
                props: { text: 'Supporting Evidence (Image URL / Doc Link)', fontSize: 15, fontWeight: 'bold' }
            },
            {
                id: `rw_in_evidence_${ts}`, type: 'TEXT_INPUT',
                x: 510, y: 100, w: 430, h: 45,
                props: { targetVariable: 'Upload_Evidence', placeholder: 'Paste diagram link or upload reference URL...' }
            },
            {
                id: `rw_viewfinder_${ts}`, type: 'TEXT',
                x: 510, y: 165, w: 430, h: 215,
                props: { text: '📷 Reference Diagram Viewfinder\n[Click Capture to assign standard image]', fontSize: 13, backgroundColor: '#000000', color: '#ffffff', textAlignment: 1, padding: '75px' }
            },
            {
                id: `rw_btn_capture_${ts}`, type: 'BUTTON',
                x: 820, y: 335, w: 110, h: 35,
                props: { text: '⚙ Capture', backgroundColor: '#3b82f6', color: 'white', fontSize: 13 },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Upload_Evidence', value: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Reference captured!', messageType: 'success' }
                ]
            },

            // Footer actions
            {
                id: `rw_btn_cancel_${ts}`, type: 'BUTTON',
                x: 20, y: 485, w: 150, h: 45,
                props: { text: 'Cancel', backgroundColor: '#e2e8f0', color: '#1e293b', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_select_disposition_${ts}` }]
            },
            {
                id: `rw_btn_submit_${ts}`, type: 'BUTTON',
                x: 740, y: 485, w: 200, h: 45,
                props: { text: '🔧 Assign Rework Process', backgroundColor: '#fbbf24', color: '#78350f', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Status': 'REWORK IN PROGRESS',
                            'Disposition': 'REWORK',
                            'Rework_Instructions': '{{@Rework_Instructions}}',
                            'Rework_Assignee': '{{@Rework_Assignee}}',
                            'Rework_Station': '{{@Rework_Station}}',
                            'Upload_Evidence': '{{@Upload_Evidence}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Rework_Instructions' },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Upload_Evidence' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Material assigned for Rework.', messageType: 'warning' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_mrb_dashboard_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 6: Use-As-Is Disposition ---
    const stepDispUseAsIs = {
        id: `s_disp_use_as_is_${ts}`,
        title: 'Use-As-Is Disposition',
        stepType: 'Step',
        components: [
            {
                id: `ua_lbl_title_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 920, h: 35,
                props: { text: '🟢 Accept Use-As-Is Deviation Approval', fontSize: 22, fontWeight: 'bold' }
            },
            {
                id: `ua_desc_${ts}`, type: 'TEXT',
                x: 20, y: 65, w: 460, h: 110,
                props: { text: 'Use-As-Is allows utilizing minor quality deviations when engineering analysis verifies functionality, fit, and form remain acceptable. Proper justification must be recorded.\n\nMaterial Defect ID: {{@Selected_Defect.ID}}', fontSize: 14, color: '#64748b', backgroundColor: '#f0fdf4', padding: '15px' }
            },
            {
                id: `ua_lbl_just_${ts}`, type: 'TEXT',
                x: 20, y: 195, w: 460, h: 25,
                props: { text: 'Deviation Justification / Technical Rationale *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `ua_in_just_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 225, w: 460, h: 220,
                props: { targetVariable: 'MRB_Justification', multiline: true, placeholder: 'Detail technical validation reasons for accepting this deviation...' }
            },

            // Right Panel: Evidence upload
            {
                id: `ua_lbl_evidence_${ts}`, type: 'TEXT',
                x: 510, y: 65, w: 430, h: 30,
                props: { text: 'Supporting Approval Document (URL / Signature)', fontSize: 15, fontWeight: 'bold' }
            },
            {
                id: `ua_in_evidence_${ts}`, type: 'TEXT_INPUT',
                x: 510, y: 100, w: 430, h: 45,
                props: { targetVariable: 'Upload_Evidence', placeholder: 'Paste approval signature link or document URL...' }
            },
            {
                id: `ua_viewfinder_${ts}`, type: 'TEXT',
                x: 510, y: 165, w: 430, h: 215,
                props: { text: '📷 Approval Signature Viewfinder\n[Click Capture to assign standard image]', fontSize: 13, backgroundColor: '#000000', color: '#ffffff', textAlignment: 1, padding: '75px' }
            },
            {
                id: `ua_btn_capture_${ts}`, type: 'BUTTON',
                x: 820, y: 335, w: 110, h: 35,
                props: { text: '⚙ Capture', backgroundColor: '#3b82f6', color: 'white', fontSize: 13 },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Upload_Evidence', value: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=400&q=80' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Signature Captured!', messageType: 'success' }
                ]
            },

            // Footer actions
            {
                id: `ua_btn_cancel_${ts}`, type: 'BUTTON',
                x: 20, y: 485, w: 150, h: 45,
                props: { text: 'Cancel', backgroundColor: '#e2e8f0', color: '#1e293b', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_select_disposition_${ts}` }]
            },
            {
                id: `ua_btn_submit_${ts}`, type: 'BUTTON',
                x: 740, y: 485, w: 200, h: 45,
                props: { text: '✓ Approve Use-As-Is', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Status': 'USE AS IS',
                            'Disposition': 'USE_AS_IS',
                            'MRB_Justification': '{{@MRB_Justification}}',
                            'Upload_Evidence': '{{@Upload_Evidence}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'MRB_Justification' },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Upload_Evidence' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Material deviation approved.', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_mrb_dashboard_${ts}` }
                ]
            }
        ]
    };

    return {
        id: `app_mrb_${ts}`,
        name: 'Material Review Board',
        description: 'Review, modify, and assign dispositions (Scrap, Rework, Use-As-Is) to reported defective materials.',
        category: 'Quality',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.defectEvents, T.workOrders],
            appTriggers: [],
            steps: [stepDashboard, stepReviewDefect, stepSelectDisposition, stepDispScrap, stepDispRework, stepDispUseAsIs],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
