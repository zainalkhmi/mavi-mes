export function createOrderExecutionTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        workOrders: 'tbl_oe_work_orders',
        units: 'tbl_oe_units',
        stationHistory: 'tbl_oe_station_history',
        stations: 'tbl_oe_stations'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_WO_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Filter_Status', type: 'string', defaultValue: 'RELEASED', persisted: true },
        { id: `v3_${ts}`, name: 'Batch_Quantity', type: 'number', defaultValue: 1, persisted: true },
        { id: `v4_${ts}`, name: 'Station_ID', type: 'string', defaultValue: 'Station-1', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Current_Work_Order', tableId: T.workOrders, type: 'single' },
        { id: `r2_${ts}`, name: 'Current_Station', tableId: T.stations, type: 'single' }
    ];

    // --- STEP 1: View Released Work Orders ---
    const stepViewWorkOrders = {
        id: `s_view_${ts}`,
        title: 'View released work orders',
        stepType: 'Step',
        components: [
            // Header
            {
                id: `c1_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 920, h: 40,
                props: { text: 'Order Execution - Select Work Order', fontSize: 28, fontWeight: 'bold', color: '#0f172a' }
            },
            
            // Station and Filters
            {
                id: `c2_${ts}`, type: 'TEXT',
                x: 20, y: 70, w: 100, h: 30,
                props: { text: 'Station:', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `c3_${ts}`, type: 'TEXT_INPUT',
                x: 120, y: 60, w: 200, h: 40,
                props: { targetVariable: 'Station_ID', placeholder: 'Station ID...' }
            },
            
            // Interactive Table (Work Orders)
            {
                id: `c5_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 120, w: 920, h: 400,
                props: {
                    tableId: T.workOrders,
                    title: 'Released Work Orders',
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
                        type: 'DATA',
                        action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'IN PROGRESS' }
                    },
                    {
                        event: 'ON_ROW_SELECT',
                        type: 'NAVIGATION',
                        action: 'GO_TO_STEP',
                        stepId: `s_progress_${ts}`
                    }
                ]
            }
        ]
    };

    // --- STEP 2: Work Order In Progress ---
    const stepInProgress = {
        id: `s_progress_${ts}`,
        title: 'Work order in progress',
        stepType: 'Step',
        components: [
            {
                id: `c10_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'Assembly Instructions & Execution', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c11_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_${ts}` }
                ]
            },
            
            // Instructions Area
            {
                id: `c12_${ts}`, type: 'TEXT',
                x: 20, y: 70, w: 440, h: 300,
                props: { 
                    text: 'ASSEMBLY INSTRUCTIONS:\n\n1. Prepare the workspace.\n2. Fetch components listed in Bill of Materials.\n3. Assemble part according to standard operating procedure (SOP-001).\n4. Inspect output visually.\n5. Log completed quantity.', 
                    fontSize: 16, 
                    backgroundColor: '#f8fafc',
                    color: '#334155'
                }
            },

            // Production Logging
            {
                id: `c13_${ts}`, type: 'RECORD_DISPLAY',
                x: 480, y: 70, w: 460, h: 180,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'QTY_Required', 'QTY_Complete'] 
                }
            },
            {
                id: `c14_${ts}`, type: 'TEXT',
                x: 480, y: 270, w: 150, h: 30,
                props: { text: 'Produced Qty:', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c15_${ts}`, type: 'NUMBER_INPUT',
                x: 640, y: 260, w: 150, h: 40,
                props: { targetVariable: 'Batch_Quantity', min: 1 }
            },
            
            // Action Buttons
            {
                id: `c16_${ts}`, type: 'BUTTON',
                x: 480, y: 320, w: 200, h: 50,
                props: { text: 'LOG PRODUCTION', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.units,
                        mapping: { 
                            'Work_Order_ID': '@Selected_WO_ID',
                            'QTY': '@Batch_Quantity',
                            'Status': 'AVAILABLE',
                            'Location': '@Station_ID',
                            'Completed_Date': '{{$GLOBAL_TIME}}',
                            'Produced_By': '{{$GLOBAL_USER}}'
                        }
                    },
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.stationHistory,
                        mapping: { 
                            'Station_ID': '@Station_ID',
                            'Status': 'RUNNING',
                            'Actual_Quantity': '@Batch_Quantity',
                            'Work_Order_ID': '@Selected_WO_ID'
                        }
                    },
                    {
                        event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE',
                        message: 'Production Logged Successfully.', messageType: 'success'
                    }
                ]
            },
            {
                id: `c17_${ts}`, type: 'BUTTON',
                x: 690, y: 320, w: 200, h: 50,
                props: { text: 'COMPLETE ORDER', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'COMPLETED', 'Complete_Date': '{{$GLOBAL_TIME}}' }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_label_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 3: Label ---
    const stepLabel = {
        id: `s_label_${ts}`,
        title: 'Label',
        stepType: 'Step',
        components: [
            {
                id: `c20_${ts}`, type: 'BUTTON',
                x: 20, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_progress_${ts}` }
                ]
            },
            {
                id: `c21_${ts}`, type: 'BUTTON',
                x: 160, y: 10, w: 120, h: 40,
                props: { text: 'Print Label', backgroundColor: '#8b5cf6', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'PRINT_SCREEN' }
                ]
            },
            {
                id: `c22_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Finish', backgroundColor: '#10b981', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_${ts}` }
                ]
            },
            {
                id: `c23_${ts}`, type: 'HEADING',
                x: 20, y: 70, w: 560, h: 50,
                props: { text: 'PRODUCT LABEL', fontSize: 24, fontWeight: 'bold', textAlignment: 1, backgroundColor: '#000', color: '#fff', padding: '10px' }
            },
            {
                id: `c24_${ts}`, type: 'RECORD_DISPLAY',
                x: 20, y: 130, w: 560, h: 260,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Customer_ID', 'Location', 'Complete_Date'] 
                }
            },
            {
                id: `c25_${ts}`, type: 'BARCODE_SCANNER',
                x: 170, y: 400, w: 260, h: 100,
                props: { label: 'Unit Barcode' }
            }
        ]
    };

    return {
        id: `app_oe_${ts}`,
        name: 'Order Execution',
        description: 'Select work orders, execute assembly operations, log production units, and view assembly instructions.',
        category: 'MES Production Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.workOrders, T.units, T.stationHistory, T.stations],
            appTriggers: [],
            steps: [stepViewWorkOrders, stepInProgress, stepLabel],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
