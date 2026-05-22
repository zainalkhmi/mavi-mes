export function createMaterialRequestTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        materialRequests: 'tbl_mr_material_requests',
        kanbanCards: 'tbl_mr_kanban_cards'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_Kanban_ID', type: 'string', defaultValue: '', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Selected_Kanban_Card', tableId: T.kanbanCards, type: 'single' }
    ];

    // --- STEP 1: Request Material ---
    const stepRequestMaterial = {
        id: `s_req_mat_${ts}`,
        title: 'Request Material',
        stepType: 'Step',
        components: [
            {
                id: `c1_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 460, h: 40,
                props: { text: 'Kanban Cards In Your Area', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c2_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 460, h: 420,
                props: {
                    tableId: T.kanbanCards,
                    title: 'Scan or select kanban card',
                    columns: ['ID', 'Part_Number', 'Part_Description', 'Status', 'Status_Color'],
                    filter: "Active = true"
                },
                triggers: [
                    { 
                        event: 'ON_ROW_SELECT', 
                        type: 'DATA', 
                        action: 'TABLE_RECORD_LOAD',
                        tableId: T.kanbanCards,
                        recordPlaceholderId: `r1_${ts}`,
                        linkVariable: 'Selected_Kanban_ID'
                    }
                ]
            },
            {
                id: `c3_${ts}`, type: 'HEADING',
                x: 520, y: 10, w: 420, h: 40,
                props: { text: 'Selected Kanban Card', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c4_${ts}`, type: 'RECORD_DISPLAY',
                x: 520, y: 70, w: 420, h: 200,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Part_Number', 'Part_Description', 'QTY', 'Supplier', 'Status'] 
                }
            },
            {
                id: `c5_lbl_${ts}`, type: 'TEXT',
                x: 520, y: 290, w: 420, h: 20,
                props: { text: 'Card Image:', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c5_${ts}`, type: 'TEXT_INPUT',
                x: 520, y: 315, w: 420, h: 40,
                props: { targetVariable: 'Selected_Kanban_Card.Image', readOnly: true, backgroundColor: '#f8fafc' }
            },
            {
                id: `c6_${ts}`, type: 'BUTTON',
                x: 640, y: 490, w: 300, h: 50,
                props: { text: '+ Create New Request', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_confirm_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 2: Confirm ---
    const stepConfirm = {
        id: `s_confirm_${ts}`,
        title: 'Confirm',
        stepType: 'Step',
        components: [
            {
                id: `c7_${ts}`, type: 'HEADING',
                x: 280, y: 50, w: 400, h: 40,
                props: { text: 'Request details for {{@Selected_Kanban_ID}}', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c8_${ts}`, type: 'RECORD_DISPLAY',
                x: 280, y: 110, w: 400, h: 160,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['Part_Number', 'Part_Description', 'QTY', 'Status'] 
                }
            },
            {
                id: `c9_${ts}`, type: 'BUTTON',
                x: 280, y: 320, w: 180, h: 50,
                props: { text: 'Cancel', backgroundColor: '#e2e8f0', color: 'black', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_req_mat_${ts}` }
                ]
            },
            {
                id: `c10_${ts}`, type: 'BUTTON',
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
                            'Requestor': '{{$GLOBAL_USER}}',
                            'Requested': '{{$GLOBAL_TIME}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Material request created successfully!', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_req_mat_${ts}` }
                ]
            }
        ]
    };

    return {
        id: `app_mr_${ts}`,
        name: 'Material Request',
        description: 'Create material replenishment requests for kanban bins that are currently out of stock.',
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
            steps: [stepRequestMaterial, stepConfirm],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
