export function createQualityEventManagementTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    // Table references for replacement in AppStore
    const T = {
        qualityEvents: 'tbl_qem_events',
        qualityComments: 'tbl_qem_comments',
        operationalDefects: 'tbl_qem_defects',
        capas: 'tbl_qem_capas'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_Event_ID', type: 'string', defaultValue: 'QE-2026-001', persisted: true },
        { id: `v2_${ts}`, name: 'Selected_Status', type: 'string', defaultValue: 'SUBMITTED', persisted: true },
        { id: `v3_${ts}`, name: 'New_Description', type: 'string', defaultValue: '', persisted: true },
        { id: `v4_${ts}`, name: 'New_Location', type: 'string', defaultValue: 'Assembly Line 1', persisted: true },
        { id: `v5_${ts}`, name: 'New_Severity', type: 'string', defaultValue: 'Major', persisted: true },
        { id: `v6_${ts}`, name: 'New_Created_By', type: 'string', defaultValue: 'Adam Veres', persisted: true },
        { id: `v7_${ts}`, name: 'New_Actions_Taken', type: 'string', defaultValue: '', persisted: true },
        { id: `v8_${ts}`, name: 'New_Owner', type: 'string', defaultValue: 'Quality Manager', persisted: true },
        { id: `v9_${ts}`, name: 'New_Due_Date', type: 'string', defaultValue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], persisted: true },
        { id: `v10_${ts}`, name: 'Investigation_Summary', type: 'string', defaultValue: '', persisted: true },
        { id: `v11_${ts}`, name: 'Root_Cause', type: 'string', defaultValue: '', persisted: true },
        { id: `v12_${ts}`, name: 'New_Comment', type: 'string', defaultValue: '', persisted: true },
        { id: `v13_${ts}`, name: 'CAPA_Action_Plan', type: 'string', defaultValue: '', persisted: true },
        { id: `v14_${ts}`, name: 'Closure_Notes', type: 'string', defaultValue: '', persisted: true },
        { id: `v15_${ts}`, name: 'Linked_Defect_ID', type: 'string', defaultValue: 'DEF-4091', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Selected_Quality_Event', tableId: T.qualityEvents, type: 'single' },
        { id: `r2_${ts}`, name: 'Selected_Defect', tableId: T.operationalDefects, type: 'single' },
        { id: `r3_${ts}`, name: 'Selected_CAPA', tableId: T.capas, type: 'single' }
    ];

    // Step Group ID for 'Routing based on Status'
    const routingGroupId = `sg_routing_status_${ts}`;

    // --- STEP 1: Quality Event Dashboard (Home) ---
    const stepDashboard = {
        id: `s_qem_dashboard_${ts}`,
        title: 'Quality Event Dashboard',
        stepType: 'Step',
        components: [
            // Top Title Bar
            {
                id: `db_lbl_title_${ts}`, type: 'HEADING',
                x: 24, y: 16, w: 600, h: 36,
                props: { text: 'Quality Event Management (QEM)', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `db_lbl_sub_${ts}`, type: 'TEXT',
                x: 24, y: 52, w: 600, h: 22,
                props: { text: 'Frontline Quality Management System · Triage, Root Cause Investigation & CAPA Tracking', fontSize: 13, color: '#64748b' }
            },

            // KPI Summary Badges
            {
                id: `db_kpi_sub_${ts}`, type: 'TEXT',
                x: 640, y: 16, w: 100, h: 52,
                props: { text: 'SUBMITTED\n1 Active', fontSize: 12, fontWeight: 'bold', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '8px', borderRadius: '8px', textAlign: 'center' }
            },
            {
                id: `db_kpi_inv_${ts}`, type: 'TEXT',
                x: 750, y: 16, w: 110, h: 52,
                props: { text: 'INVESTIGATION\n1 Active', fontSize: 12, fontWeight: 'bold', color: '#d97706', backgroundColor: '#fef3c7', padding: '8px', borderRadius: '8px', textAlign: 'center' }
            },
            {
                id: `db_kpi_rev_${ts}`, type: 'TEXT',
                x: 870, y: 16, w: 100, h: 52,
                props: { text: 'IN REVIEW\n1 Pending', fontSize: 12, fontWeight: 'bold', color: '#6366f1', backgroundColor: '#e0e7ff', padding: '8px', borderRadius: '8px', textAlign: 'center' }
            },
            {
                id: `db_kpi_cls_${ts}`, type: 'TEXT',
                x: 980, y: 16, w: 90, h: 52,
                props: { text: 'CLOSED\n1 Archived', fontSize: 12, fontWeight: 'bold', color: '#16a34a', backgroundColor: '#dcfce7', padding: '8px', borderRadius: '8px', textAlign: 'center' }
            },

            // Embedded Table with Trigger matching user screenshot
            {
                id: `db_tbl_events_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 24, y: 84, w: 1046, h: 420,
                props: {
                    tableId: T.qualityEvents,
                    title: 'Active Quality Events Queue',
                    columns: ['ID', 'Description', 'Location', 'Severity', 'Created_By', 'Created_Date', 'Owner', 'Status']
                },
                triggers: [
                    {
                        name: 'Go to Event Details',
                        event: 'ON_ROW_SELECT',
                        type: 'COMPOSITE',
                        actions: [
                            {
                                type: 'TABLE_RECORD_LOAD',
                                tableId: T.qualityEvents,
                                recordPlaceholderId: `r1_${ts}`,
                                linkVariable: 'Selected_Event_ID'
                            },
                            {
                                type: 'SET_VARIABLE',
                                variableId: 'Selected_Status',
                                expression: '{{@Selected_Quality_Event.Status}}'
                            },
                            {
                                type: 'GO_TO_STEP_BY_NAME',
                                stepName: "Table Record.Quality Event.Status + ' Route Screen'"
                            }
                        ]
                    }
                ]
            },

            // Action Buttons
            {
                id: `db_btn_report_${ts}`, type: 'BUTTON',
                x: 24, y: 520, w: 240, h: 48,
                props: { text: '➕ Report Quality Event', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: 14 },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_report_event_${ts}` }
                ]
            },
            {
                id: `db_btn_route_${ts}`, type: 'BUTTON',
                x: 280, y: 520, w: 260, h: 48,
                props: { text: '🔍 Process Selected Event', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', fontSize: 14 },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        type: 'NAVIGATION',
                        action: 'GO_TO_STEP_BY_NAME',
                        stepName: "Table Record.Quality Event.Status + ' Route Screen'"
                    }
                ]
            },
            {
                id: `db_btn_edit_${ts}`, type: 'BUTTON',
                x: 556, y: 520, w: 190, h: 48,
                props: { text: '✏️ Edit Event Details', backgroundColor: '#f1f5f9', color: '#334155', fontWeight: '600', fontSize: 14 },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_edit_event_${ts}` }
                ]
            },
            {
                id: `db_btn_update_${ts}`, type: 'BUTTON',
                x: 760, y: 520, w: 190, h: 48,
                props: { text: '⚙️ Update Assignee / Status', backgroundColor: '#f1f5f9', color: '#334155', fontWeight: '600', fontSize: 14 },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_update_event_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 2: Report Quality Event ---
    const stepReportEvent = {
        id: `s_report_event_${ts}`,
        title: 'Report Quality Event',
        stepType: 'Step',
        components: [
            {
                id: `re_lbl_title_${ts}`, type: 'HEADING',
                x: 24, y: 20, w: 800, h: 36,
                props: { text: 'Report New Quality Event', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `re_lbl_sub_${ts}`, type: 'TEXT',
                x: 24, y: 56, w: 800, h: 22,
                props: { text: 'Log an anomaly, non-conformance, or quality departure for immediate investigation.', fontSize: 13, color: '#64748b' }
            },

            // Form Inputs - Left Column
            {
                id: `re_lbl_desc_${ts}`, type: 'TEXT',
                x: 24, y: 96, w: 480, h: 20,
                props: { text: 'Event Description *', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `re_in_desc_${ts}`, type: 'TEXT_INPUT',
                x: 24, y: 120, w: 480, h: 90,
                props: { targetVariable: 'New_Description', placeholder: 'Describe what happened, observed defect, symptoms, or deviations...' }
            },

            {
                id: `re_lbl_actions_${ts}`, type: 'TEXT',
                x: 24, y: 226, w: 480, h: 20,
                props: { text: 'Immediate Actions Taken (Containment) *', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `re_in_actions_${ts}`, type: 'TEXT_INPUT',
                x: 24, y: 250, w: 480, h: 90,
                props: { targetVariable: 'New_Actions_Taken', placeholder: 'Segregated parts, quarantined lot, paused station, alerted supervisor...' }
            },

            {
                id: `re_lbl_defect_${ts}`, type: 'TEXT',
                x: 24, y: 356, w: 480, h: 20,
                props: { text: 'Reference Operational Defect (Optional)', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `re_in_defect_${ts}`, type: 'TEXT_INPUT',
                x: 24, y: 380, w: 480, h: 42,
                props: { targetVariable: 'Linked_Defect_ID', placeholder: 'DEF-4091' }
            },

            // Form Inputs - Right Column
            {
                id: `re_lbl_loc_${ts}`, type: 'TEXT',
                x: 536, y: 96, w: 480, h: 20,
                props: { text: 'Location / Workstation *', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `re_in_loc_${ts}`, type: 'TEXT_INPUT',
                x: 536, y: 120, w: 480, h: 42,
                props: { targetVariable: 'New_Location', placeholder: 'e.g. Assembly Line 1, CNC Cell 3' }
            },

            {
                id: `re_lbl_sev_${ts}`, type: 'TEXT',
                x: 536, y: 178, w: 480, h: 20,
                props: { text: 'Severity Level *', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `re_in_sev_${ts}`, type: 'TEXT_INPUT',
                x: 536, y: 202, w: 480, h: 42,
                props: { targetVariable: 'New_Severity', placeholder: 'Critical / Major / Minor' }
            },

            {
                id: `re_lbl_by_${ts}`, type: 'TEXT',
                x: 536, y: 260, w: 480, h: 20,
                props: { text: 'Created By (Reporter) *', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `re_in_by_${ts}`, type: 'TEXT_INPUT',
                x: 536, y: 284, w: 480, h: 42,
                props: { targetVariable: 'New_Created_By', placeholder: 'Adam Veres' }
            },

            {
                id: `re_lbl_owner_${ts}`, type: 'TEXT',
                x: 536, y: 342, w: 480, h: 20,
                props: { text: 'Initial Assigned Owner *', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `re_in_owner_${ts}`, type: 'TEXT_INPUT',
                x: 536, y: 366, w: 480, h: 42,
                props: { targetVariable: 'New_Owner', placeholder: 'Quality Manager' }
            },

            // Footer Actions
            {
                id: `re_btn_cancel_${ts}`, type: 'BUTTON',
                x: 24, y: 500, w: 160, h: 48,
                props: { text: 'Cancel', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_qem_dashboard_${ts}` }
                ]
            },
            {
                id: `re_btn_submit_${ts}`, type: 'BUTTON',
                x: 756, y: 500, w: 260, h: 48,
                props: { text: '🚀 Report Event', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: 15 },
                triggers: [
                    {
                        name: 'Create Event Record & Navigate',
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'CREATE_RECORD',
                        payload: {
                            tableId: T.qualityEvents,
                            mappings: {
                                'ID': `QE-${Date.now().toString().slice(-6)}`,
                                'Description': { type: 'VARIABLE', value: 'New_Description' },
                                'Location': { type: 'VARIABLE', value: 'New_Location' },
                                'Severity': { type: 'VARIABLE', value: 'New_Severity' },
                                'Created_By': { type: 'VARIABLE', value: 'New_Created_By' },
                                'Created_Date': new Date().toISOString().split('T')[0],
                                'Actions_Taken': { type: 'VARIABLE', value: 'New_Actions_Taken' },
                                'Owner': { type: 'VARIABLE', value: 'New_Owner' },
                                'Due_Date': { type: 'VARIABLE', value: 'New_Due_Date' },
                                'Defect_ID': { type: 'VARIABLE', value: 'Linked_Defect_ID' },
                                'Status': 'SUBMITTED'
                            }
                        }
                    },
                    {
                        event: 'ON_CLICK',
                        type: 'NAVIGATION',
                        action: 'SHOW_MESSAGE',
                        message: 'Quality Event submitted! Routed to Quality Manager.',
                        messageType: 'success'
                    },
                    {
                        event: 'ON_CLICK',
                        type: 'NAVIGATION',
                        action: 'GO_TO_STEP',
                        stepId: `s_qem_dashboard_${ts}`
                    }
                ]
            }
        ]
    };

    // --- STEP GROUP: Routing based on Status ---

    // 1. SUBMITTED Route Screen (Assign Status)
    const stepSubmittedRoute = {
        id: `s_submitted_route_${ts}`,
        title: 'SUBMITTED Route Screen',
        stepType: 'Step',
        parentGroupId: routingGroupId,
        components: [
            // Status Header Banner
            {
                id: `sub_banner_${ts}`, type: 'TEXT',
                x: 24, y: 16, w: 1046, h: 48,
                props: {
                    text: '📌 Status: SUBMITTED · Triage & Assign Status',
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#0369a1',
                    backgroundColor: '#e0f2fe',
                    padding: '12px 18px',
                    borderRadius: '8px'
                }
            },

            // Left Box: Event Overview
            {
                id: `sub_box_left_${ts}`, type: 'CONTAINER',
                x: 24, y: 76, w: 510, h: 400,
                props: { backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px' }
            },
            {
                id: `sub_lbl_id_${ts}`, type: 'TEXT',
                x: 40, y: 92, w: 470, h: 30,
                props: { text: 'Event ID: {{@Selected_Quality_Event.ID}}', fontSize: 16, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `sub_lbl_desc_${ts}`, type: 'TEXT',
                x: 40, y: 130, w: 470, h: 80,
                props: { text: 'Description:\n{{@Selected_Quality_Event.Description}}', fontSize: 13, color: '#334155' }
            },
            {
                id: `sub_lbl_loc_${ts}`, type: 'TEXT',
                x: 40, y: 220, w: 220, h: 40,
                props: { text: 'Location:\n{{@Selected_Quality_Event.Location}}', fontSize: 13, color: '#475569', fontWeight: '600' }
            },
            {
                id: `sub_lbl_sev_${ts}`, type: 'TEXT',
                x: 270, y: 220, w: 220, h: 40,
                props: { text: 'Severity:\n{{@Selected_Quality_Event.Severity}}', fontSize: 13, color: '#dc2626', fontWeight: 'bold' }
            },
            {
                id: `sub_lbl_by_${ts}`, type: 'TEXT',
                x: 40, y: 270, w: 220, h: 40,
                props: { text: 'Reported By:\n{{@Selected_Quality_Event.Created_By}}', fontSize: 13, color: '#475569' }
            },
            {
                id: `sub_lbl_dt_${ts}`, type: 'TEXT',
                x: 270, y: 270, w: 220, h: 40,
                props: { text: 'Date:\n{{@Selected_Quality_Event.Created_Date}}', fontSize: 13, color: '#475569' }
            },
            {
                id: `sub_lbl_act_${ts}`, type: 'TEXT',
                x: 40, y: 320, w: 470, h: 140,
                props: { text: 'Immediate Actions Taken:\n{{@Selected_Quality_Event.Actions_Taken}}', fontSize: 13, color: '#334155', backgroundColor: '#ffffff', padding: '10px', borderRadius: '6px' }
            },

            // Right Box: Assign Status & Route Decision
            {
                id: `sub_box_right_${ts}`, type: 'CONTAINER',
                x: 550, y: 76, w: 520, h: 400,
                props: { backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '20px' }
            },
            {
                id: `sub_lbl_triage_${ts}`, type: 'HEADING',
                x: 570, y: 92, w: 480, h: 28,
                props: { text: 'Triage & Status Assignment', fontSize: 18, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `sub_lbl_owner_in_${ts}`, type: 'TEXT',
                x: 570, y: 130, w: 480, h: 20,
                props: { text: 'Assign Investigation Lead / Owner', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `sub_in_owner_${ts}`, type: 'TEXT_INPUT',
                x: 570, y: 154, w: 480, h: 40,
                props: { targetVariable: 'New_Owner', placeholder: 'Quality Manager' }
            },

            {
                id: `sub_lbl_due_in_${ts}`, type: 'TEXT',
                x: 570, y: 206, w: 480, h: 20,
                props: { text: 'Investigation Target Due Date', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `sub_in_due_${ts}`, type: 'TEXT_INPUT',
                x: 570, y: 230, w: 480, h: 40,
                props: { targetVariable: 'New_Due_Date', placeholder: 'YYYY-MM-DD' }
            },

            // Route Buttons (Assign Status -> UNDER INVESTIGATION, NEEDS MORE INFO, CANCEL)
            {
                id: `sub_btn_investigate_${ts}`, type: 'BUTTON',
                x: 570, y: 290, w: 480, h: 46,
                props: { text: '🔍 Move to UNDER INVESTIGATION', backgroundColor: '#d97706', color: 'white', fontWeight: 'bold', fontSize: 14 },
                triggers: [
                    {
                        name: 'Assign Status to UNDER INVESTIGATION',
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Status': 'UNDER INVESTIGATION',
                            'Owner': '{{@New_Owner}}',
                            'Due_Date': '{{@New_Due_Date}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Event status updated to UNDER INVESTIGATION.', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_investigation_route_${ts}` }
                ]
            },
            {
                id: `sub_btn_more_info_${ts}`, type: 'BUTTON',
                x: 570, y: 346, w: 480, h: 42,
                props: { text: '❓ Request More Information', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 'bold', fontSize: 13 },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'NEEDS MORE INFORMATION' }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_more_info_route_${ts}` }
                ]
            },
            {
                id: `sub_btn_cancel_${ts}`, type: 'BUTTON',
                x: 570, y: 398, w: 480, h: 42,
                props: { text: '🚫 Reject & Cancel Event', backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 'bold', fontSize: 13 },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'CANCEL' }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_cancel_route_${ts}` }
                ]
            },

            // Footer Navigation
            {
                id: `sub_btn_home_${ts}`, type: 'BUTTON',
                x: 24, y: 500, w: 200, h: 46,
                props: { text: '← Back to Dashboard', backgroundColor: '#f1f5f9', color: '#334155', fontWeight: '600' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_qem_dashboard_${ts}` }
                ]
            }
        ]
    };

    // 2. UNDER INVESTIGATION Route Screen
    const stepInvestigationRoute = {
        id: `s_investigation_route_${ts}`,
        title: 'UNDER INVESTIGATION Route Screen',
        stepType: 'Step',
        parentGroupId: routingGroupId,
        components: [
            // Status Header Banner
            {
                id: `inv_banner_${ts}`, type: 'TEXT',
                x: 24, y: 16, w: 1046, h: 48,
                props: {
                    text: '🔬 Status: UNDER INVESTIGATION · Root Cause Analysis & Containment',
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#b45309',
                    backgroundColor: '#fef3c7',
                    padding: '12px 18px',
                    borderRadius: '8px'
                }
            },

            // Left Side: Event Details & Findings Input
            {
                id: `inv_lbl_event_${ts}`, type: 'TEXT',
                x: 24, y: 76, w: 510, h: 50,
                props: {
                    text: 'Event: {{@Selected_Quality_Event.ID}} · {{@Selected_Quality_Event.Location}} ({{@Selected_Quality_Event.Severity}})\nDescription: {{@Selected_Quality_Event.Description}}',
                    fontSize: 13,
                    fontWeight: '600',
                    color: '#0f172a',
                    backgroundColor: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '6px'
                }
            },
            {
                id: `inv_lbl_rc_${ts}`, type: 'TEXT',
                x: 24, y: 136, w: 510, h: 20,
                props: { text: 'Root Cause Category / 5-Why Analysis *', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `inv_in_rc_${ts}`, type: 'TEXT_INPUT',
                x: 24, y: 160, w: 510, h: 70,
                props: { targetVariable: 'Root_Cause', placeholder: 'Machine feed rate jitter caused excessive friction on end-cap tooling...' }
            },

            {
                id: `inv_lbl_sum_${ts}`, type: 'TEXT',
                x: 24, y: 240, w: 510, h: 20,
                props: { text: 'Investigation Summary & Findings *', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `inv_in_sum_${ts}`, type: 'TEXT_INPUT',
                x: 24, y: 264, w: 510, h: 100,
                props: { targetVariable: 'Investigation_Summary', placeholder: 'Completed dimensional audit of 50 consecutive pieces. Found seal misalignment on fixture 2...' }
            },

            {
                id: `inv_lbl_capa_${ts}`, type: 'TEXT',
                x: 24, y: 374, w: 510, h: 20,
                props: { text: 'Proposed Corrective Action Plan (CAPA)', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `inv_in_capa_${ts}`, type: 'TEXT_INPUT',
                x: 24, y: 398, w: 510, h: 70,
                props: { targetVariable: 'CAPA_Action_Plan', placeholder: 'Recalibrate fixture clamping cylinders and update standard SOP daily check...' }
            },

            // Right Side: Embedded Comments & Investigation Actions
            {
                id: `inv_box_right_${ts}`, type: 'CONTAINER',
                x: 550, y: 76, w: 520, h: 392,
                props: { backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '16px' }
            },
            {
                id: `inv_lbl_comm_${ts}`, type: 'HEADING',
                x: 570, y: 92, w: 480, h: 26,
                props: { text: 'Quality Event Comments & Audit Trail', fontSize: 16, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `inv_tbl_comm_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 570, y: 122, w: 480, h: 170,
                props: {
                    tableId: T.qualityComments,
                    title: '',
                    columns: ['Author', 'Comment', 'Timestamp']
                }
            },
            {
                id: `inv_in_newcomm_${ts}`, type: 'TEXT_INPUT',
                x: 570, y: 302, w: 360, h: 42,
                props: { targetVariable: 'New_Comment', placeholder: 'Add investigation comment or finding...' }
            },
            {
                id: `inv_btn_addcomm_${ts}`, type: 'BUTTON',
                x: 940, y: 302, w: 110, h: 42,
                props: { text: '💬 Add', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'CREATE_RECORD',
                        payload: {
                            tableId: T.qualityComments,
                            mappings: {
                                'ID': `COMM-${Date.now().toString().slice(-6)}`,
                                'Event_ID': '{{@Selected_Quality_Event.ID}}',
                                'Author': 'Adam Veres',
                                'Comment': { type: 'VARIABLE', value: 'New_Comment' },
                                'Timestamp': new Date().toLocaleString()
                            }
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'New_Comment' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Comment added to event trail.', messageType: 'success' }
                ]
            },

            // Raise CAPA Link Button
            {
                id: `inv_btn_raisecapa_${ts}`, type: 'BUTTON',
                x: 570, y: 356, w: 480, h: 42,
                props: { text: '🛡️ Raise / Link Formal CAPA Ticket', backgroundColor: '#f3e8ff', color: '#6b21a8', fontWeight: 'bold', fontSize: 13 },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'CREATE_RECORD',
                        payload: {
                            tableId: T.capas,
                            mappings: {
                                'ID': `CAPA-${Date.now().toString().slice(-6)}`,
                                'Title': '{{@Root_Cause}}',
                                'Source_Event_ID': '{{@Selected_Quality_Event.ID}}',
                                'Owner': 'Quality Manager',
                                'Action_Plan': { type: 'VARIABLE', value: 'CAPA_Action_Plan' },
                                'Status': 'OPEN',
                                'Target_Date': new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                            }
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Formal CAPA ticket generated and linked.', messageType: 'success' }
                ]
            },

            // Footer Action Buttons
            {
                id: `inv_btn_home_${ts}`, type: 'BUTTON',
                x: 24, y: 500, w: 200, h: 48,
                props: { text: '← Back to Dashboard', backgroundColor: '#f1f5f9', color: '#334155', fontWeight: '600' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_qem_dashboard_${ts}` }
                ]
            },
            {
                id: `inv_btn_moreinfo_${ts}`, type: 'BUTTON',
                x: 550, y: 500, w: 230, h: 48,
                props: { text: '❓ Needs More Information', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'NEEDS MORE INFORMATION' }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_more_info_route_${ts}` }
                ]
            },
            {
                id: `inv_btn_submit_review_${ts}`, type: 'BUTTON',
                x: 800, y: 500, w: 270, h: 48,
                props: { text: '✓ Submit for Quality Review', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: 15 },
                triggers: [
                    {
                        name: 'Update Event Record & Navigate',
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Status': 'IN REVIEW',
                            'Root_Cause': '{{@Root_Cause}}',
                            'Investigation_Summary': '{{@Investigation_Summary}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Investigation findings submitted. Routed to IN REVIEW.', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_in_review_route_${ts}` }
                ]
            }
        ]
    };

    // 3. IN REVIEW Route Screen
    const stepInReviewRoute = {
        id: `s_in_review_route_${ts}`,
        title: 'IN REVIEW Route Screen',
        stepType: 'Step',
        parentGroupId: routingGroupId,
        components: [
            // Status Header Banner
            {
                id: `rev_banner_${ts}`, type: 'TEXT',
                x: 24, y: 16, w: 1046, h: 48,
                props: {
                    text: '📋 Status: IN REVIEW · Quality Manager Disposition & Closure Approval',
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#4338ca',
                    backgroundColor: '#e0e7ff',
                    padding: '12px 18px',
                    borderRadius: '8px'
                }
            },

            // Left Panel: Comprehensive Investigation Review
            {
                id: `rev_box_left_${ts}`, type: 'CONTAINER',
                x: 24, y: 76, w: 550, h: 400,
                props: { backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '16px' }
            },
            {
                id: `rev_lbl_head_${ts}`, type: 'TEXT',
                x: 40, y: 92, w: 510, h: 30,
                props: { text: 'Event: {{@Selected_Quality_Event.ID}} · {{@Selected_Quality_Event.Location}}', fontSize: 16, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `rev_lbl_desc_${ts}`, type: 'TEXT',
                x: 40, y: 126, w: 510, h: 60,
                props: { text: 'Description:\n{{@Selected_Quality_Event.Description}}', fontSize: 13, color: '#334155' }
            },
            {
                id: `rev_lbl_rc_${ts}`, type: 'TEXT',
                x: 40, y: 192, w: 510, h: 60,
                props: { text: 'Root Cause Analysis:\n{{@Selected_Quality_Event.Root_Cause}}', fontSize: 13, color: '#b45309', fontWeight: '600' }
            },
            {
                id: `rev_lbl_sum_${ts}`, type: 'TEXT',
                x: 40, y: 258, w: 510, h: 100,
                props: { text: 'Investigation Summary:\n{{@Selected_Quality_Event.Investigation_Summary}}', fontSize: 13, color: '#334155', backgroundColor: '#ffffff', padding: '10px', borderRadius: '6px' }
            },
            {
                id: `rev_lbl_meta_${ts}`, type: 'TEXT',
                x: 40, y: 368, w: 510, h: 30,
                props: { text: 'Owner: {{@Selected_Quality_Event.Owner}} · Target Due Date: {{@Selected_Quality_Event.Due_Date}}', fontSize: 12, color: '#64748b' }
            },

            // Right Panel: Decision & Disposition
            {
                id: `rev_box_right_${ts}`, type: 'CONTAINER',
                x: 590, y: 76, w: 480, h: 400,
                props: { backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '20px' }
            },
            {
                id: `rev_lbl_disp_${ts}`, type: 'HEADING',
                x: 610, y: 92, w: 440, h: 28,
                props: { text: 'Quality Manager Disposition', fontSize: 18, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `rev_lbl_closure_notes_${ts}`, type: 'TEXT',
                x: 610, y: 130, w: 440, h: 20,
                props: { text: 'Closure Notes / Verification Remarks *', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `rev_in_closure_notes_${ts}`, type: 'TEXT_INPUT',
                x: 610, y: 154, w: 440, h: 100,
                props: { targetVariable: 'Closure_Notes', placeholder: 'Corrective actions verified. Process resumed with 100% inspection for next 3 batches...' }
            },

            // Decision Buttons (Accept vs Reject)
            {
                id: `rev_btn_accept_${ts}`, type: 'BUTTON',
                x: 610, y: 270, w: 440, h: 54,
                props: { text: '✓ Accept & Close Event (CLOSED)', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold', fontSize: 15 },
                triggers: [
                    {
                        name: 'Additional Info - Accept',
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Status': 'CLOSED',
                            'Closure_Date': new Date().toISOString().split('T')[0],
                            'Closure_Notes': '{{@Closure_Notes}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Quality Event accepted and successfully CLOSED.', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_closed_route_${ts}` }
                ]
            },
            {
                id: `rev_btn_reject_${ts}`, type: 'BUTTON',
                x: 610, y: 336, w: 440, h: 50,
                props: { text: '↺ Reject & Return to Investigation', backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 'bold', fontSize: 14 },
                triggers: [
                    {
                        name: 'Additional Info - Reject',
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'UNDER INVESTIGATION' }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Event returned for deeper investigation.', messageType: 'warning' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_investigation_route_${ts}` }
                ]
            },

            // Footer Navigation
            {
                id: `rev_btn_home_${ts}`, type: 'BUTTON',
                x: 24, y: 500, w: 200, h: 46,
                props: { text: '← Back to Dashboard', backgroundColor: '#f1f5f9', color: '#334155', fontWeight: '600' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_qem_dashboard_${ts}` }
                ]
            }
        ]
    };

    // 4. CLOSED Route Screen
    const stepClosedRoute = {
        id: `s_closed_route_${ts}`,
        title: 'CLOSED Route Screen',
        stepType: 'Step',
        parentGroupId: routingGroupId,
        components: [
            // Status Header Banner
            {
                id: `cls_banner_${ts}`, type: 'TEXT',
                x: 24, y: 16, w: 1046, h: 48,
                props: {
                    text: '✅ Status: CLOSED · GxP Audit Trail Archive & Final Verification',
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#15803d',
                    backgroundColor: '#dcfce7',
                    padding: '12px 18px',
                    borderRadius: '8px'
                }
            },

            // Center Certificate Card
            {
                id: `cls_box_card_${ts}`, type: 'CONTAINER',
                x: 24, y: 76, w: 1046, h: 400,
                props: { backgroundColor: '#ffffff', borderRadius: '12px', border: '2px solid #bbf7d0', padding: '24px' }
            },
            {
                id: `cls_lbl_title_${ts}`, type: 'HEADING',
                x: 50, y: 100, w: 990, h: 32,
                props: { text: 'Quality Event Resolution Summary', fontSize: 20, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `cls_lbl_id_${ts}`, type: 'TEXT',
                x: 50, y: 140, w: 300, h: 30,
                props: { text: 'Event Record ID: {{@Selected_Quality_Event.ID}}', fontSize: 15, fontWeight: 'bold', color: '#15803d' }
            },
            {
                id: `cls_lbl_loc_${ts}`, type: 'TEXT',
                x: 370, y: 140, w: 300, h: 30,
                props: { text: 'Location: {{@Selected_Quality_Event.Location}}', fontSize: 14, color: '#334155' }
            },
            {
                id: `cls_lbl_dt_${ts}`, type: 'TEXT',
                x: 690, y: 140, w: 300, h: 30,
                props: { text: 'Closed Date: {{@Selected_Quality_Event.Closure_Date}}', fontSize: 14, color: '#334155' }
            },

            {
                id: `cls_lbl_rc_${ts}`, type: 'TEXT',
                x: 50, y: 180, w: 990, h: 50,
                props: { text: 'Verified Root Cause:\n{{@Selected_Quality_Event.Root_Cause}}', fontSize: 13, color: '#475569', fontWeight: '600' }
            },
            {
                id: `cls_lbl_sum_${ts}`, type: 'TEXT',
                x: 50, y: 240, w: 990, h: 70,
                props: { text: 'Investigation Findings:\n{{@Selected_Quality_Event.Investigation_Summary}}', fontSize: 13, color: '#334155' }
            },
            {
                id: `cls_lbl_notes_${ts}`, type: 'TEXT',
                x: 50, y: 320, w: 990, h: 60,
                props: { text: 'Manager Closure Remarks:\n{{@Selected_Quality_Event.Closure_Notes}}', fontSize: 13, color: '#166534', backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '6px' }
            },

            {
                id: `cls_badge_compliance_${ts}`, type: 'TEXT',
                x: 50, y: 395, w: 400, h: 45,
                props: { text: '🔒 Verified for ISO 9001 / IATF 16949 / GxP Compliance\nDigitally signed by Quality Lead', fontSize: 12, color: '#059669', fontWeight: 'bold' }
            },

            // Re-open Button (Emergency Override)
            {
                id: `cls_btn_reopen_${ts}`, type: 'BUTTON',
                x: 750, y: 395, w: 290, h: 45,
                props: { text: '↺ Re-open Event (Investigation)', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'UNDER INVESTIGATION' }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Event re-opened for further investigation.', messageType: 'warning' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_investigation_route_${ts}` }
                ]
            },

            // Footer Navigation
            {
                id: `cls_btn_home_${ts}`, type: 'BUTTON',
                x: 24, y: 500, w: 220, h: 48,
                props: { text: '← Back to Dashboard', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_qem_dashboard_${ts}` }
                ]
            }
        ]
    };

    // 5. NEEDS MORE INFORMATION Route Screen
    const stepNeedsMoreInfoRoute = {
        id: `s_more_info_route_${ts}`,
        title: 'NEEDS MORE INFORMATION Route Screen',
        stepType: 'Step',
        parentGroupId: routingGroupId,
        components: [
            {
                id: `nmi_banner_${ts}`, type: 'TEXT',
                x: 24, y: 16, w: 1046, h: 48,
                props: {
                    text: '⚠️ Status: NEEDS MORE INFORMATION · Supplementary Information Requested',
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#92400e',
                    backgroundColor: '#fef3c7',
                    padding: '12px 18px',
                    borderRadius: '8px'
                }
            },
            {
                id: `nmi_lbl_id_${ts}`, type: 'TEXT',
                x: 24, y: 80, w: 1046, h: 50,
                props: { text: 'Event {{@Selected_Quality_Event.ID}} requires supplementary data from reporter.\nOriginal Description: {{@Selected_Quality_Event.Description}}', fontSize: 14, color: '#334155' }
            },
            {
                id: `nmi_lbl_in_${ts}`, type: 'TEXT',
                x: 24, y: 140, w: 600, h: 20,
                props: { text: 'Supplementary Information / Additional Findings *', fontSize: 13, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `nmi_in_notes_${ts}`, type: 'TEXT_INPUT',
                x: 24, y: 164, w: 600, h: 140,
                props: { targetVariable: 'New_Description', placeholder: 'Provide detailed serial numbers, defect photos, or process logs requested...' }
            },
            {
                id: `nmi_btn_resubmit_${ts}`, type: 'BUTTON',
                x: 24, y: 320, w: 320, h: 48,
                props: { text: '✓ Resubmit for Investigation', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Status': 'UNDER INVESTIGATION',
                            'Description': '{{@Selected_Quality_Event.Description}}\n[UPDATE]: {{@New_Description}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Supplementary data attached. Resubmitted to investigation.', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_investigation_route_${ts}` }
                ]
            },
            {
                id: `nmi_btn_home_${ts}`, type: 'BUTTON',
                x: 24, y: 500, w: 200, h: 48,
                props: { text: '← Back to Dashboard', backgroundColor: '#f1f5f9', color: '#334155', fontWeight: '600' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_qem_dashboard_${ts}` }
                ]
            }
        ]
    };

    // 6. CANCEL Route Screen
    const stepCancelRoute = {
        id: `s_cancel_route_${ts}`,
        title: 'CANCEL Route Screen',
        stepType: 'Step',
        parentGroupId: routingGroupId,
        components: [
            {
                id: `can_banner_${ts}`, type: 'TEXT',
                x: 24, y: 16, w: 1046, h: 48,
                props: {
                    text: '🚫 Status: CANCEL · Event Voided / Not Applicable',
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#64748b',
                    backgroundColor: '#f1f5f9',
                    padding: '12px 18px',
                    borderRadius: '8px'
                }
            },
            {
                id: `can_lbl_info_${ts}`, type: 'TEXT',
                x: 24, y: 90, w: 800, h: 80,
                props: { text: 'Event Record ID: {{@Selected_Quality_Event.ID}}\nStatus has been marked as CANCELLED.\nNo further action required.', fontSize: 14, color: '#475569' }
            },
            {
                id: `can_btn_home_${ts}`, type: 'BUTTON',
                x: 24, y: 500, w: 220, h: 48,
                props: { text: '← Return to Dashboard', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_qem_dashboard_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 7: Edit Quality Event ---
    const stepEditEvent = {
        id: `s_edit_event_${ts}`,
        title: 'Edit Quality Event',
        stepType: 'Step',
        components: [
            {
                id: `ee_lbl_title_${ts}`, type: 'HEADING',
                x: 24, y: 20, w: 800, h: 36,
                props: { text: 'Edit Quality Event: {{@Selected_Quality_Event.ID}}', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `ee_lbl_desc_${ts}`, type: 'TEXT',
                x: 24, y: 80, w: 500, h: 20,
                props: { text: 'Event Description', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `ee_in_desc_${ts}`, type: 'TEXT_INPUT',
                x: 24, y: 104, w: 500, h: 100,
                props: { targetVariable: 'New_Description', placeholder: 'Update description...' }
            },
            {
                id: `ee_lbl_act_${ts}`, type: 'TEXT',
                x: 24, y: 220, w: 500, h: 20,
                props: { text: 'Immediate Actions Taken', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `ee_in_act_${ts}`, type: 'TEXT_INPUT',
                x: 24, y: 244, w: 500, h: 100,
                props: { targetVariable: 'New_Actions_Taken', placeholder: 'Update containment actions...' }
            },
            {
                id: `ee_btn_cancel_${ts}`, type: 'BUTTON',
                x: 24, y: 480, w: 160, h: 48,
                props: { text: 'Cancel', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_qem_dashboard_${ts}` }]
            },
            {
                id: `ee_btn_submit_${ts}`, type: 'BUTTON',
                x: 750, y: 480, w: 260, h: 48,
                props: { text: '✓ Submit Changes', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        name: 'Update Event Record & Navigate',
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Description': '{{@New_Description}}',
                            'Actions_Taken': '{{@New_Actions_Taken}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Quality Event details updated.', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_qem_dashboard_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 8: Update Quality Event ---
    const stepUpdateEvent = {
        id: `s_update_event_${ts}`,
        title: 'Update Quality Event',
        stepType: 'Step',
        components: [
            {
                id: `ue_lbl_title_${ts}`, type: 'HEADING',
                x: 24, y: 20, w: 800, h: 36,
                props: { text: 'Update Event Assignee & Due Date', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `ue_lbl_owner_${ts}`, type: 'TEXT',
                x: 24, y: 80, w: 480, h: 20,
                props: { text: 'Assigned Quality Lead / Owner', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `ue_in_owner_${ts}`, type: 'TEXT_INPUT',
                x: 24, y: 104, w: 480, h: 42,
                props: { targetVariable: 'New_Owner', placeholder: 'Quality Manager' }
            },
            {
                id: `ue_lbl_due_${ts}`, type: 'TEXT',
                x: 24, y: 160, w: 480, h: 20,
                props: { text: 'Target Investigation Due Date', fontSize: 13, fontWeight: 'bold', color: '#334155' }
            },
            {
                id: `ue_in_due_${ts}`, type: 'TEXT_INPUT',
                x: 24, y: 184, w: 480, h: 42,
                props: { targetVariable: 'New_Due_Date', placeholder: 'YYYY-MM-DD' }
            },
            {
                id: `ue_btn_cancel_${ts}`, type: 'BUTTON',
                x: 24, y: 480, w: 160, h: 48,
                props: { text: 'Cancel', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_qem_dashboard_${ts}` }]
            },
            {
                id: `ue_btn_submit_${ts}`, type: 'BUTTON',
                x: 750, y: 480, w: 260, h: 48,
                props: { text: '✓ Update Event', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        name: 'Update Event',
                        event: 'ON_CLICK',
                        type: 'DATA',
                        action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Owner': '{{@New_Owner}}',
                            'Due_Date': '{{@New_Due_Date}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Owner and due date updated.', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_qem_dashboard_${ts}` }
                ]
            }
        ]
    };

    return {
        id: `app_qem_${ts}`,
        name: 'Quality Event Management',
        description: 'Standardized digital Quality Event Management (QEM) to identify anomalies, evaluate root cause, route across approval states, and drive corrective actions (CAPAs).',
        category: 'Quality',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.qualityEvents, T.qualityComments, T.operationalDefects, T.capas],
            appTriggers: [],
            stepGroups: [
                {
                    id: routingGroupId,
                    name: 'Routing based on Status',
                    stepIds: [
                        stepSubmittedRoute.id,
                        stepInvestigationRoute.id,
                        stepInReviewRoute.id,
                        stepClosedRoute.id,
                        stepNeedsMoreInfoRoute.id,
                        stepCancelRoute.id
                    ]
                }
            ],
            steps: [
                stepDashboard,
                stepReportEvent,
                stepSubmittedRoute,
                stepInvestigationRoute,
                stepInReviewRoute,
                stepClosedRoute,
                stepNeedsMoreInfoRoute,
                stepCancelRoute,
                stepEditEvent,
                stepUpdateEvent
            ],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
