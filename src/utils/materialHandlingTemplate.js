export function createMaterialHandlingTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        materialRequests: 'tbl_mh_material_requests',
        kanbanCards: 'tbl_mh_kanban_cards'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_Request_ID', type: 'string', defaultValue: '', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Selected_Request', tableId: T.materialRequests, type: 'single' }
    ];

    // --- STEP 1: Kanban Request ---
    const stepKanbanRequest = {
        id: `s_kb_req_${ts}`,
        title: 'Kanban Request',
        stepType: 'Step',
        components: [
            {
                id: `c1_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 460, h: 40,
                props: { text: 'Pending Material Requests', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c2_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 460, h: 410,
                props: {
                    tableId: T.materialRequests,
                    title: 'Select a request to process',
                    columns: ['ID', 'Item', 'Requesting_Location', 'Supplier', 'Quantity', 'Status'],
                    filter: "Status = 'REQUESTED'"
                },
                triggers: [
                    {
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.materialRequests, recordPlaceholderId: `r1_${ts}`, linkVariable: 'Selected_Request_ID'
                    }
                ]
            },
            {
                id: `c3_${ts}`, type: 'HEADING',
                x: 520, y: 15, w: 420, h: 40,
                props: { text: 'Request Details', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c4_${ts}`, type: 'RECORD_DISPLAY',
                x: 520, y: 70, w: 420, h: 220,
                props: {
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Item', 'Requesting_Location', 'Supplier', 'Quantity', 'Status', 'Requested']
                }
            },
            {
                id: `c5_${ts}`, type: 'BUTTON',
                x: 520, y: 430, w: 420, h: 50,
                props: { text: '⚡ Start Processing Request', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Status': 'ACTIVE',
                            'Assignee': '{{$GLOBAL_USER}}',
                            'Started': '{{$GLOBAL_TIME}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Request status set to ACTIVE!', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_confirm_deliv_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 2: Confirm Delivery ---
    const stepConfirmDelivery = {
        id: `s_confirm_deliv_${ts}`,
        title: 'Confirm',
        stepType: 'Step',
        components: [
            {
                id: `c6_${ts}`, type: 'HEADING',
                x: 280, y: 50, w: 400, h: 40,
                props: { text: 'Confirm Delivery', fontSize: 24, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `c7_${ts}`, type: 'RECORD_DISPLAY',
                x: 280, y: 110, w: 400, h: 200,
                props: {
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Item', 'Requesting_Location', 'Supplier', 'Quantity', 'Assignee']
                }
            },
            {
                id: `c8_${ts}`, type: 'BUTTON',
                x: 280, y: 340, w: 190, h: 50,
                props: { text: 'Ready to Deliver', backgroundColor: '#e2e8f0', color: 'black', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'READY_TO_DELIVER' }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Material is ready to be delivered!', messageType: 'info' }
                ]
            },
            {
                id: `c9_${ts}`, type: 'BUTTON',
                x: 490, y: 340, w: 190, h: 50,
                props: { text: '✓ Delivered', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Status': 'DELIVERED',
                            'Completed': '{{$GLOBAL_TIME}}',
                            'Delivered_by': '{{$GLOBAL_USER}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Material request marked as DELIVERED!', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_kb_req_${ts}` }
                ]
            },
            {
                id: `c10_${ts}`, type: 'BUTTON',
                x: 280, y: 410, w: 400, h: 40,
                props: { text: 'Cancel', backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'REQUESTED' }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_kb_req_${ts}` }
                ]
            }
        ]
    };

    return {
        id: `app_mh_${ts}`,
        name: 'Material Handling',
        description: 'Process and deliver material requests created by shop floor stations, optimizing material replenishment cycles.',
        category: 'Inventory App Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.materialRequests],
            appTriggers: [],
            steps: [stepKanbanRequest, stepConfirmDelivery],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
