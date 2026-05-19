export function createReplenishmentTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        materialRequests: 'tbl_rep_material_requests',
        kanbanCards: 'tbl_rep_kanban_cards'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_Kanban_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Selected_Request_ID', type: 'string', defaultValue: '', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Selected_Kanban_Card', tableId: T.kanbanCards, type: 'single' },
        { id: `r2_${ts}`, name: 'Selected_History_Request', tableId: T.materialRequests, type: 'single' }
    ];

    // --- STEP 1: View Open Material Requests (MATCHING USER SCREENSHOT 1) ---
    const stepViewOpenReqs = {
        id: `s_view_open_reqs_${ts}`,
        title: 'View Open Material Requests',
        stepType: 'Step',
        components: [
            // Left Side: Pending Requests
            {
                id: `rep_title_pend_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 460, h: 30,
                props: { text: 'Pending Requests', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `rep_tbl_pend_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 55, w: 460, h: 420,
                props: {
                    tableId: T.materialRequests,
                    title: '',
                    columns: ['Kanban_ID', 'Item', 'Status', 'Requesting_Location', 'Requested'],
                    filter: "Status = 'REQUESTED' OR Status = 'ACTIVE'"
                },
                triggers: [
                    {
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.materialRequests, recordPlaceholderId: `r2_${ts}`, linkVariable: 'Selected_Request_ID'
                    }
                ]
            },
            // Right Side: Selected Request Detail
            {
                id: `rep_title_srd_${ts}`, type: 'HEADING',
                x: 520, y: 15, w: 400, h: 30,
                props: { text: 'Selected Request Detail', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `rep_stat_lbl_${ts}`, type: 'TEXT',
                x: 520, y: 55, w: 70, h: 35,
                props: { text: 'Status:', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `rep_stat_badge_${ts}`, type: 'BUTTON', // Greyish black badge
                x: 600, y: 55, w: 160, h: 35,
                props: { text: 'REQUESTED', backgroundColor: '#475569', color: 'white', fontWeight: 'bold', fontSize: 14 },
                triggers: []
            },
            {
                id: `rep_flow_txt_${ts}`, type: 'TEXT',
                x: 520, y: 100, w: 400, h: 55,
                props: { text: 'Pick-up location: Assembly\nDestination: Supermarket', fontSize: 16, fontWeight: 'bold', color: '#1e293b' }
            },
            // Detail layout fields
            {
                id: `rep_det_pn_${ts}`, type: 'TEXT',
                x: 520, y: 165, w: 180, h: 45,
                props: { text: 'Part Number\n{{@Selected_History_Request.Item}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `rep_det_desc_${ts}`, type: 'TEXT',
                x: 720, y: 165, w: 180, h: 45,
                props: { text: 'Part Description\n{{@Selected_History_Request.Bin}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `rep_det_qty_${ts}`, type: 'TEXT',
                x: 520, y: 220, w: 180, h: 45,
                props: { text: 'QTY\n{{@Selected_History_Request.Quantity}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `rep_det_stat_${ts}`, type: 'TEXT',
                x: 720, y: 220, w: 180, h: 45,
                props: { text: 'Status\n{{@Selected_History_Request.Status}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            // Product image under grid
            {
                id: `rep_img_box_${ts}`, type: 'TEXT',
                x: 600, y: 280, w: 280, h: 180,
                props: { text: '📷 Product Image\n(e.g. Actuator Cylinder)', fontSize: 13, backgroundColor: '#f1f5f9', color: '#64748b', textAlignment: 1, padding: '60px' }
            },
            // Footer right aligned button
            {
                id: `rep_btn_req_${ts}`, type: 'BUTTON',
                x: 640, y: 495, w: 300, h: 45,
                props: { text: 'Request Material for a Kanban Card', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_select_kanban_${ts}` }]
            }
        ]
    };

    // --- STEP 2: Select Kanban Card (MATCHING USER SCREENSHOT 2) ---
    const stepSelectKanban = {
        id: `s_select_kanban_${ts}`,
        title: 'Select Kanban Card',
        stepType: 'Step',
        components: [
            // Left Side: Kanban Cards In Your Area
            {
                id: `sk_title_area_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 460, h: 30,
                props: { text: 'Kanban Cards In Your Area', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `sk_barcode_txt_${ts}`, type: 'TEXT',
                x: 20, y: 55, w: 460, h: 25,
                props: { text: '🔍 Scan or select kanban card', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `sk_tbl_cards_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 90, w: 460, h: 385,
                props: {
                    tableId: T.kanbanCards,
                    title: '',
                    columns: ['ID', 'Part_Number', 'Part_Description', 'Status'],
                    filter: "Active = true"
                },
                triggers: [
                    {
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.kanbanCards, recordPlaceholderId: `r1_${ts}`, linkVariable: 'Selected_Kanban_ID'
                    }
                ]
            },
            // Right Side: Selected Request Detail
            {
                id: `sk_title_srd_${ts}`, type: 'HEADING',
                x: 520, y: 15, w: 200, h: 30,
                props: { text: 'Selected Request Detail', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `sk_stat_lbl_${ts}`, type: 'TEXT',
                x: 730, y: 15, w: 70, h: 35,
                props: { text: 'Status:', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `sk_stat_badge_${ts}`, type: 'BUTTON', // Green badge
                x: 810, y: 15, w: 110, h: 35,
                props: { text: 'FULL', backgroundColor: '#15803d', color: 'white', fontWeight: 'bold', fontSize: 14 },
                triggers: []
            },
            // Details grid
            {
                id: `sk_det_id_${ts}`, type: 'TEXT',
                x: 520, y: 65, w: 180, h: 45,
                props: { text: 'ID\n{{@Selected_Kanban_Card.ID}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `sk_det_pn_${ts}`, type: 'TEXT',
                x: 720, y: 65, w: 180, h: 45,
                props: { text: 'Part Number\n{{@Selected_Kanban_Card.Part_Number}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `sk_det_desc_${ts}`, type: 'TEXT',
                x: 520, y: 120, w: 180, h: 45,
                props: { text: 'Part Description\n{{@Selected_Kanban_Card.Part_Description}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `sk_det_qty_${ts}`, type: 'TEXT',
                x: 720, y: 120, w: 180, h: 45,
                props: { text: 'QTY\n{{@Selected_Kanban_Card.QTY}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `sk_det_sup_${ts}`, type: 'TEXT',
                x: 520, y: 175, w: 380, h: 45,
                props: { text: 'Supplier\n{{@Selected_Kanban_Card.Supplier}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            // Product image under grid (screws/parts)
            {
                id: `sk_img_box_${ts}`, type: 'TEXT',
                x: 580, y: 230, w: 300, h: 220,
                props: { text: '📷 Kanban Product Image\n(e.g. Screws)', fontSize: 13, backgroundColor: '#f1f5f9', color: '#64748b', textAlignment: 1, padding: '75px' }
            },
            // Footer Left: ← Previous
            {
                id: `sk_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Previous', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_open_reqs_${ts}` }]
            },
            // Footer Right: + Create New Request
            {
                id: `sk_btn_create_${ts}`, type: 'BUTTON',
                x: 760, y: 495, w: 180, h: 45,
                props: { text: '+ Create New Request', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_confirm_${ts}` }]
            }
        ]
    };

    // --- STEP 3: Confirm Request ---
    const stepConfirm = {
        id: `s_confirm_${ts}`,
        title: 'Confirm',
        stepType: 'Step',
        components: [
            {
                id: `cf_title_${ts}`, type: 'HEADING',
                x: 280, y: 50, w: 400, h: 40,
                props: { text: 'Request details for {{@Selected_Kanban_ID}}', fontSize: 22, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `cf_display_${ts}`, type: 'RECORD_DISPLAY',
                x: 280, y: 110, w: 400, h: 180,
                props: {
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['Part_Number', 'Part_Description', 'QTY', 'Supplier', 'Status']
                }
            },
            {
                id: `cf_btn_cancel_${ts}`, type: 'BUTTON',
                x: 280, y: 320, w: 180, h: 50,
                props: { text: 'Cancel', backgroundColor: '#cbd5e1', color: 'black', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_select_kanban_${ts}` }]
            },
            {
                id: `cf_btn_save_${ts}`, type: 'BUTTON',
                x: 480, y: 320, w: 200, h: 50,
                props: { text: '✓ Create request', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.materialRequests,
                        mapping: {
                            'Kanban_ID': '{{@Selected_Kanban_ID}}',
                            'Item': '{{@Selected_Kanban_Card.Part_Number}}',
                            'Supplier': '{{@Selected_Kanban_Card.Supplier}}',
                            'Quantity': '{{@Selected_Kanban_Card.QTY}}',
                            'Status': 'REQUESTED',
                            'Requesting_Location': '{{@Selected_Kanban_Card.Consuming_location}}',
                            'Requestor': '{{$GLOBAL_USER}}',
                            'Requested': '{{$GLOBAL_TIME}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Replenishment order sent successfully!', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_open_reqs_${ts}` }
                ]
            }
        ]
    };

    return {
        id: `app_rep_${ts}`,
        name: 'Replenishment',
        description: 'Fulfill material requests and dispatch replenishment container orders to the front-line.',
        category: 'Inventory App Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.materialRequests, T.kanbanCards],
            appTriggers: [],
            steps: [stepViewOpenReqs, stepSelectKanban, stepConfirm],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
