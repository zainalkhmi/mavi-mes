export function createOrderManagementTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        workOrders: 'tbl_om_work_orders',
        bom: 'tbl_om_bom',
        stationHistory: 'tbl_om_station_history',
        notes: 'tbl_om_notes',
        inspectionResults: 'tbl_om_inspection_results'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_WO_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Filter_Status', type: 'string', defaultValue: 'All', persisted: true },
        { id: `v3_${ts}`, name: 'New_WO_Material', type: 'string', defaultValue: 'Widget-A', persisted: true },
        { id: `v4_${ts}`, name: 'New_WO_Qty', type: 'number', defaultValue: 100, persisted: true },
        { id: `v5_${ts}`, name: 'New_WO_DueDate', type: 'string', defaultValue: iso, persisted: true },
        { id: `v6_${ts}`, name: 'New_Note_Text', type: 'string', defaultValue: '', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Current_Work_Order', tableId: T.workOrders, type: 'single' }
    ];

    // --- STEP 1: View Work Orders ---
    const stepViewWorkOrders = {
        id: `s_view_${ts}`,
        title: 'View Work Orders',
        stepType: 'Step',
        components: [
            // Header
            {
                id: `c1_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 920, h: 40,
                props: { text: 'Order Management Dashboard', fontSize: 28, fontWeight: 'bold', color: '#0f172a' }
            },
            
            // Filters
            {
                id: `c2_${ts}`, type: 'TEXT',
                x: 20, y: 70, w: 100, h: 30,
                props: { text: 'Filter Status:', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `c3_${ts}`, type: 'RADIO_GROUP',
                x: 120, y: 60, w: 400, h: 40,
                props: { 
                    label: '', 
                    targetVariable: 'Filter_Status', 
                    options: ['All', 'CREATED', 'RELEASED', 'IN PROGRESS', 'COMPLETED'] 
                }
            },
            
            // Action Buttons
            {
                id: `c4_${ts}`, type: 'BUTTON',
                x: 740, y: 60, w: 200, h: 40,
                props: { text: '+ Create New Order', backgroundColor: '#2563eb', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_create_${ts}` }
                ]
            },

            // Interactive Table (Work Orders)
            {
                id: `c5_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 120, w: 920, h: 360,
                props: {
                    tableId: T.workOrders,
                    title: 'Work Orders',
                    columns: ['ID', 'Material_Definition_ID', 'Status', 'QTY_Required', 'QTY_Complete', 'Due_Date'],
                    pageSize: 10
                },
                triggers: [
                    { 
                        event: 'ON_ROW_SELECT', 
                        type: 'DATA', 
                        action: 'TABLE_RECORD_LOAD',
                        tableId: T.workOrders,
                        recordPlaceholderId: `r1_${ts}`,
                        linkVariable: 'Selected_WO_ID'
                    },
                    {
                        event: 'ON_ROW_SELECT',
                        type: 'NAVIGATION',
                        action: 'GO_TO_STEP',
                        stepId: `s_details_${ts}`
                    }
                ]
            }
        ]
    };

    // --- STEP 2: Create Work Order ---
    const stepCreateWorkOrder = {
        id: `s_create_${ts}`,
        title: 'Create Work Order',
        stepType: 'Step',
        components: [
            {
                id: `c6_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 920, h: 40,
                props: { text: 'Create New Work Order', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c7_${ts}`, type: 'TEXT',
                x: 20, y: 80, w: 150, h: 30,
                props: { text: 'Material / Part:', fontSize: 16 }
            },
            {
                id: `c8_${ts}`, type: 'TEXT_INPUT',
                x: 180, y: 70, w: 300, h: 40,
                props: { targetVariable: 'New_WO_Material', placeholder: 'Enter Part Number...' }
            },
            {
                id: `c9_${ts}`, type: 'TEXT',
                x: 20, y: 130, w: 150, h: 30,
                props: { text: 'Target Qty:', fontSize: 16 }
            },
            {
                id: `c10_${ts}`, type: 'NUMBER_INPUT',
                x: 180, y: 120, w: 300, h: 40,
                props: { targetVariable: 'New_WO_Qty', min: 1 }
            },
            {
                id: `c11_${ts}`, type: 'TEXT',
                x: 20, y: 180, w: 150, h: 30,
                props: { text: 'Due Date:', fontSize: 16 }
            },
            {
                id: `c12_${ts}`, type: 'DATE_PICKER',
                x: 180, y: 170, w: 300, h: 40,
                props: { targetVariable: 'New_WO_DueDate' }
            },
            {
                id: `c13_${ts}`, type: 'BUTTON',
                x: 180, y: 240, w: 140, h: 45,
                props: { text: 'Save Order', backgroundColor: '#16a34a', color: 'white' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.workOrders,
                        mapping: {
                            'Material_Definition_ID': '@New_WO_Material',
                            'QTY_Required': '@New_WO_Qty',
                            'Due_Date': '@New_WO_DueDate',
                            'Status': 'CREATED',
                            'Start_Date': '{{$GLOBAL_TIME}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_${ts}` }
                ]
            },
            {
                id: `c14_${ts}`, type: 'BUTTON',
                x: 340, y: 240, w: 140, h: 45,
                props: { text: 'Cancel', backgroundColor: '#ef4444', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 3: View Work Order Details ---
    const stepWorkOrderDetails = {
        id: `s_details_${ts}`,
        title: 'Work Order Details',
        stepType: 'Step',
        components: [
            {
                id: `c15_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 400, h: 40,
                props: { text: 'Work Order Details', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c16_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_${ts}` }
                ]
            },
            {
                id: `c17_${ts}`, type: 'BUTTON',
                x: 680, y: 10, w: 120, h: 40,
                props: { text: 'Print Traveler', backgroundColor: '#f59e0b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_traveler_${ts}` }
                ]
            },
            
            // Record Display Widget
            {
                id: `c18_${ts}`, type: 'RECORD_DISPLAY',
                x: 20, y: 70, w: 440, h: 220,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Status', 'QTY_Required', 'QTY_Complete', 'Due_Date'] 
                }
            },

            // Action to update Status
            {
                id: `c19_${ts}`, type: 'BUTTON',
                x: 20, y: 310, w: 140, h: 40,
                props: { text: 'Release Order', backgroundColor: '#3b82f6', color: 'white' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'RELEASED' }
                    }
                ]
            },

            // Notes Section
            {
                id: `c20_${ts}`, type: 'HEADING',
                x: 480, y: 70, w: 400, h: 30,
                props: { text: 'Notes & Comments', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c21_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 480, y: 110, w: 460, h: 180,
                props: {
                    tableId: T.notes,
                    columns: ['Notes', 'Sender', 'Timestamp']
                }
            },
            {
                id: `c22_${ts}`, type: 'TEXT_INPUT',
                x: 480, y: 310, w: 320, h: 40,
                props: { targetVariable: 'New_Note_Text', placeholder: 'Add a note...' }
            },
            {
                id: `c23_${ts}`, type: 'BUTTON',
                x: 810, y: 310, w: 130, h: 40,
                props: { text: 'Add Note', backgroundColor: '#10b981', color: 'white' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.notes,
                        mapping: {
                            'Reference_ID': '@Selected_WO_ID',
                            'Notes': '@New_Note_Text',
                            'Sender': '{{$GLOBAL_USER}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'New_Note_Text' }
                ]
            },

            // Station History & Inspections
            {
                id: `c24_${ts}`, type: 'HEADING',
                x: 20, y: 370, w: 400, h: 30,
                props: { text: 'Station Activity History', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c25_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 410, w: 440, h: 140,
                props: {
                    tableId: T.stationHistory,
                    columns: ['Station_ID', 'Status', 'Actual_Quantity', 'Defects', 'Duration']
                }
            },

            {
                id: `c26_${ts}`, type: 'HEADING',
                x: 480, y: 370, w: 400, h: 30,
                props: { text: 'Inspection Results', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c27_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 480, y: 410, w: 460, h: 140,
                props: {
                    tableId: T.inspectionResults,
                    columns: ['Type', 'Passed', 'Measured', 'Operator']
                }
            }
        ]
    };

    // --- STEP 4: Traveler ---
    const stepTraveler = {
        id: `s_traveler_${ts}`,
        title: 'Traveler',
        stepType: 'Step',
        components: [
            {
                id: `c28_${ts}`, type: 'BUTTON',
                x: 20, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_details_${ts}` }
                ]
            },
            {
                id: `c29_${ts}`, type: 'BUTTON',
                x: 160, y: 10, w: 120, h: 40,
                props: { text: 'Print', backgroundColor: '#8b5cf6', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'PRINT_SCREEN' }
                ]
            },
            {
                id: `c30_${ts}`, type: 'HEADING',
                x: 20, y: 70, w: 920, h: 50,
                props: { text: 'PRODUCTION TRAVELER', fontSize: 32, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `c31_${ts}`, type: 'RECORD_DISPLAY',
                x: 200, y: 140, w: 560, h: 260,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Status', 'QTY_Required', 'Due_Date'] 
                }
            },
            {
                id: `c32_${ts}`, type: 'BARCODE_SCANNER',
                x: 350, y: 420, w: 260, h: 100,
                props: { label: 'Traveler Barcode' }
            }
        ]
    };

    return {
        id: `app_om_${ts}`,
        name: 'Order Management',
        description: 'Manage work order creation, release, and track production station history & inspections.',
        category: 'MES Production Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.workOrders, T.bom, T.stationHistory, T.notes, T.inspectionResults],
            appTriggers: [],
            steps: [stepViewWorkOrders, stepCreateWorkOrder, stepWorkOrderDetails, stepTraveler],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
