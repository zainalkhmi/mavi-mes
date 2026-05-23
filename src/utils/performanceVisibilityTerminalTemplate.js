export function createPerformanceVisibilityTerminalTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        workOrders: 'tbl_pvt_work_orders',
        stationHistory: 'tbl_pvt_station_history',
        stations: 'tbl_pvt_stations',
        materialDefinitions: 'tbl_pvt_material_definitions'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_WO_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Station_ID', type: 'string', defaultValue: 'Terminal-1', persisted: true },
        { id: `v3_${ts}`, name: 'Good_Parts_Qty', type: 'number', defaultValue: 0, persisted: true },
        { id: `v4_${ts}`, name: 'Defect_Parts_Qty', type: 'number', defaultValue: 0, persisted: true },
        { id: `v5_${ts}`, name: 'Downtime_Reason', type: 'string', defaultValue: '', persisted: true },
        { id: `v6_${ts}`, name: 'Current_Status', type: 'string', defaultValue: 'OFF', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Current_Work_Order', tableId: T.workOrders, type: 'single' },
        { id: `r2_${ts}`, name: 'Current_Station', tableId: T.stations, type: 'single' }
    ];

    // --- STEP 1: Select Order ---
    const stepSelectOrder = {
        id: `s_select_${ts}`,
        title: 'Select order',
        stepType: 'Step',
        components: [
            {
                id: `c1_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'Select Order', fontSize: 28, fontWeight: 'bold' }
            },
            {
                id: `c2_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'View Analytics', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_analytics_${ts}` }
                ]
            },
            {
                id: `c3_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 600, h: 400,
                props: {
                    tableId: T.workOrders,
                    title: 'Select an order',
                    columns: ['ID', 'Material_Definition_ID', 'Location', 'Status', 'QTY_Required']
                },
                triggers: [
                    { 
                        event: 'ON_ROW_SELECT', 
                        type: 'DATA', 
                        action: 'TABLE_RECORD_LOAD',
                        tableId: T.workOrders,
                        recordPlaceholderId: `r1_${ts}`,
                        linkVariable: 'Selected_WO_ID'
                    }
                ]
            },
            {
                id: `c4_${ts}`, type: 'RECORD_DISPLAY',
                x: 640, y: 70, w: 300, h: 300,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Status', 'Location', 'QTY_Required', 'Due_Date'] 
                }
            },
            {
                id: `c5_${ts}`, type: 'BUTTON',
                x: 640, y: 420, w: 300, h: 50,
                props: { text: 'Start Production', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'IN PROGRESS' }
                    },
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.stations,
                        mapping: { 'ID': '@Station_ID', 'Status': 'RUNNING', 'Work_Order_ID': '@Selected_WO_ID' }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Current_Status', value: 'RUNNING' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 2: Main ---
    const stepMain = {
        id: `s_main_${ts}`,
        title: 'Main',
        stepType: 'Step',
        components: [
            {
                id: `c6_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 400, h: 40,
                props: { text: 'Main Control', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c7_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'View Analytics', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_analytics_${ts}` }
                ]
            },
            
            // Left Panel: Status Control
            {
                id: `c8_${ts}`, type: 'TEXT',
                x: 20, y: 70, w: 400, h: 40,
                props: { text: 'Station Status:', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `c9_${ts}`, type: 'TEXT',
                x: 180, y: 70, w: 240, h: 40,
                props: { text: '{{@Current_Status}}', fontSize: 24, fontWeight: 'bold', color: '#16a34a' }
            },
            {
                id: `c10_${ts}`, type: 'TEXT',
                x: 20, y: 130, w: 400, h: 30,
                props: { text: 'Change station status:', fontSize: 18 }
            },
            {
                id: `c11_${ts}`, type: 'BUTTON',
                x: 20, y: 170, w: 380, h: 50,
                props: { text: 'RUNNING', backgroundColor: '#65a30d', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Current_Status', value: 'RUNNING' },
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE', tableId: T.stations, mapping: { 'ID': '@Station_ID', 'Status': 'RUNNING', 'Work_Order_ID': '@Selected_WO_ID' } }
                ]
            },
            {
                id: `c12_${ts}`, type: 'BUTTON',
                x: 20, y: 230, w: 380, h: 50,
                props: { text: 'DOWN', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_down_${ts}` }
                ]
            },
            {
                id: `c13_${ts}`, type: 'BUTTON',
                x: 20, y: 290, w: 380, h: 50,
                props: { text: 'IDLE', backgroundColor: '#eab308', color: 'black', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Current_Status', value: 'IDLE' },
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE', tableId: T.stations, mapping: { 'ID': '@Station_ID', 'Status': 'IDLE', 'Work_Order_ID': '@Selected_WO_ID' } }
                ]
            },
            {
                id: `c14_${ts}`, type: 'BUTTON',
                x: 20, y: 350, w: 380, h: 50,
                props: { text: 'OFF / BREAK', backgroundColor: '#94a3b8', color: 'black', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Current_Status', value: 'OFF' },
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE', tableId: T.stations, mapping: { 'ID': '@Station_ID', 'Status': 'OFF', 'Work_Order_ID': '@Selected_WO_ID' } }
                ]
            },
            {
                id: `c15_${ts}`, type: 'BUTTON',
                x: 20, y: 410, w: 380, h: 50,
                props: { text: 'SETUP / CHANGEOVER', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Current_Status', value: 'SETUP' },
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE', tableId: T.stations, mapping: { 'ID': '@Station_ID', 'Status': 'SETUP', 'Work_Order_ID': '@Selected_WO_ID' } }
                ]
            },

            // Right Panel: Logging Parts
            {
                id: `c16_${ts}`, type: 'RECORD_DISPLAY',
                x: 440, y: 70, w: 500, h: 140,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['Material_Definition_ID', 'QTY_Required', 'QTY_Complete', 'QTY_Scrap'] 
                }
            },
            {
                id: `c17_${ts}`, type: 'TEXT',
                x: 440, y: 230, w: 200, h: 30,
                props: { text: 'Add Good QTY:', fontSize: 16 }
            },
            {
                id: `c18_${ts}`, type: 'NUMBER_INPUT',
                x: 440, y: 260, w: 240, h: 40,
                props: { targetVariable: 'Good_Parts_Qty', min: 0 }
            },
            {
                id: `c19_${ts}`, type: 'BUTTON',
                x: 700, y: 260, w: 240, h: 40,
                props: { text: 'Log good parts', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.stationHistory,
                        mapping: {
                            'Station_ID': '@Station_ID',
                            'Status': '@Current_Status',
                            'Actual_Quantity': '@Good_Parts_Qty',
                            'Work_Order_ID': '@Selected_WO_ID'
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Good_Parts_Qty' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Good parts logged.', messageType: 'success' }
                ]
            },
            {
                id: `c20_${ts}`, type: 'TEXT',
                x: 440, y: 330, w: 200, h: 30,
                props: { text: 'Add Defects QTY:', fontSize: 16 }
            },
            {
                id: `c21_${ts}`, type: 'NUMBER_INPUT',
                x: 440, y: 360, w: 240, h: 40,
                props: { targetVariable: 'Defect_Parts_Qty', min: 0 }
            },
            {
                id: `c22_${ts}`, type: 'BUTTON',
                x: 700, y: 360, w: 240, h: 40,
                props: { text: 'Log defects', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.stationHistory,
                        mapping: {
                            'Station_ID': '@Station_ID',
                            'Status': '@Current_Status',
                            'Defects': '@Defect_Parts_Qty',
                            'Work_Order_ID': '@Selected_WO_ID'
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Defect_Parts_Qty' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Defects logged.', messageType: 'error' }
                ]
            },
            {
                id: `c23_${ts}`, type: 'BUTTON',
                x: 740, y: 490, w: 200, h: 50,
                props: { text: 'Finish Production', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'COMPLETED', 'Complete_Date': '{{$GLOBAL_TIME}}' }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_select_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 3: Change status to down ---
    const stepDown = {
        id: `s_down_${ts}`,
        title: 'Change status to down',
        stepType: 'Step',
        components: [
            {
                id: `c24_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 400, h: 40,
                props: { text: 'Change status to down', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c25_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            },
            {
                id: `c26_${ts}`, type: 'HEADING',
                x: 280, y: 80, w: 400, h: 40,
                props: { text: 'Select downtime reason', fontSize: 20, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `c27_${ts}`, type: 'BUTTON',
                x: 280, y: 150, w: 400, h: 60,
                props: { text: 'Machine error', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold', fontSize: 18 },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Downtime_Reason', value: 'Machine error' },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Current_Status', value: 'DOWN' },
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE', tableId: T.stations, mapping: { 'ID': '@Station_ID', 'Status': 'DOWN', 'Status_Detail': 'Machine error', 'Work_Order_ID': '@Selected_WO_ID' } },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            },
            {
                id: `c28_${ts}`, type: 'BUTTON',
                x: 280, y: 240, w: 400, h: 60,
                props: { text: 'Maintenance', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold', fontSize: 18 },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Downtime_Reason', value: 'Maintenance' },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Current_Status', value: 'DOWN' },
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE', tableId: T.stations, mapping: { 'ID': '@Station_ID', 'Status': 'DOWN', 'Status_Detail': 'Maintenance', 'Work_Order_ID': '@Selected_WO_ID' } },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            },
            {
                id: `c29_${ts}`, type: 'BUTTON',
                x: 280, y: 330, w: 400, h: 60,
                props: { text: 'Employee shortage', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold', fontSize: 18 },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Downtime_Reason', value: 'Employee shortage' },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Current_Status', value: 'DOWN' },
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE', tableId: T.stations, mapping: { 'ID': '@Station_ID', 'Status': 'DOWN', 'Status_Detail': 'Employee shortage', 'Work_Order_ID': '@Selected_WO_ID' } },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 4: Analytics ---
    const stepAnalytics = {
        id: `s_analytics_${ts}`,
        title: 'Analytics',
        stepType: 'Step',
        components: [
            {
                id: `c30_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 400, h: 40,
                props: { text: 'Production Analytics', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c31_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_select_${ts}` }
                ]
            },
            {
                id: `c32_${ts}`, type: 'BAR_CHART',
                x: 20, y: 70, w: 920, h: 400,
                props: {
                    title: 'Downtime Events per Reason',
                    xAxis: 'Downtime_reason',
                    yAxis: 'Count',
                    tableId: T.stationHistory,
                    filter: "Status = 'DOWN'"
                }
            }
        ]
    };

    return {
        id: `app_pvt_${ts}`,
        name: 'Performance Visibility Terminal',
        description: 'Operator-friendly solution for logging running, downtime events, reasons, and produced parts.',
        category: 'MES Production Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.workOrders, T.stationHistory, T.stations, T.materialDefinitions],
            appTriggers: [],
            steps: [stepSelectOrder, stepMain, stepDown, stepAnalytics],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
