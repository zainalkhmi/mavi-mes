export function createAndonTerminalTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        workOrders: 'tbl_at_work_orders',
        stationHistory: 'tbl_at_station_history',
        stations: 'tbl_at_stations',
        actions: 'tbl_at_actions'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_WO_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Selected_Alert_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v3_${ts}`, name: 'Station_ID', type: 'string', defaultValue: 'Assembly', persisted: true },
        { id: `v4_${ts}`, name: 'Event_Reason', type: 'string', defaultValue: 'Machine breakdown', persisted: true },
        { id: `v5_${ts}`, name: 'Event_Description', type: 'string', defaultValue: '', persisted: true },
        { id: `v6_${ts}`, name: 'Current_Andon_ID', type: 'string', defaultValue: '', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Current_Work_Order', tableId: T.workOrders, type: 'single' },
        { id: `r2_${ts}`, name: 'Current_Alert', tableId: T.actions, type: 'single' },
        { id: `r3_${ts}`, name: 'Current_Andon', tableId: T.actions, type: 'single' },
        { id: `r4_${ts}`, name: 'Current_Station', tableId: T.stations, type: 'single' }
    ];

    // --- STEP 1: Select Order ---
    const stepSelectOrder = {
        id: `s_select_${ts}`,
        title: 'Select order',
        stepType: 'Step',
        components: [
            {
                id: `c1_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 920, h: 40,
                props: { text: 'Select Order', fontSize: 28, fontWeight: 'bold' }
            },
            {
                id: `c2_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 600, h: 400,
                props: {
                    tableId: T.workOrders,
                    title: 'Select an order',
                    columns: ['ID', 'Material_Definition_ID', 'Location', 'Status', 'Due_Date']
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
                id: `c3_${ts}`, type: 'RECORD_DISPLAY',
                x: 640, y: 70, w: 300, h: 300,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Location', 'Status', 'Due_Date'] 
                }
            },
            {
                id: `c4_${ts}`, type: 'BUTTON',
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
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 2: Main Page ---
    const stepMain = {
        id: `s_main_${ts}`,
        title: 'Main page',
        stepType: 'Step',
        components: [
            {
                id: `c5_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'Main Page', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c6_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Open Alerts', backgroundColor: '#eab308', color: 'black' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_open_alerts_${ts}` }
                ]
            },
            {
                id: `c7_${ts}`, type: 'RECORD_DISPLAY',
                x: 20, y: 70, w: 440, h: 300,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Status', 'Location', 'Start_Date', 'Due_Date'] 
                }
            },
            {
                id: `c8_${ts}`, type: 'HEADING',
                x: 20, y: 390, w: 440, h: 40,
                props: { text: 'Station Status: RUNNING', fontSize: 20, color: '#16a34a' }
            },
            {
                id: `c9_${ts}`, type: 'BUTTON',
                x: 480, y: 70, w: 460, h: 140,
                props: { text: 'Create Alert', backgroundColor: '#eab308', color: 'black', fontSize: 24, fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_create_alert_${ts}` }
                ]
            },
            {
                id: `c10_${ts}`, type: 'BUTTON',
                x: 480, y: 230, w: 460, h: 140,
                props: { text: 'Create Andon (Log Downtime)', backgroundColor: '#dc2626', color: 'white', fontSize: 24, fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.stations,
                        mapping: { 'ID': '@Station_ID', 'Status': 'DOWN', 'Work_Order_ID': '@Selected_WO_ID' }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_andon_${ts}` }
                ]
            },
            {
                id: `c11_${ts}`, type: 'BUTTON',
                x: 740, y: 490, w: 200, h: 50,
                props: { text: 'Finish Production', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'COMPLETED', 'Complete_Date': '{{$GLOBAL_TIME}}' }
                    },
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.stations,
                        mapping: { 'ID': '@Station_ID', 'Status': 'IDLE', 'Work_Order_ID': '' }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_select_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 3: Create Alert Event ---
    const stepCreateAlert = {
        id: `s_create_alert_${ts}`,
        title: 'Create alert event',
        stepType: 'Step',
        components: [
            {
                id: `c12_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'Create Alert Event', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c13_${ts}`, type: 'TEXT',
                x: 260, y: 70, w: 400, h: 30,
                props: { text: 'Reason:', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c14_${ts}`, type: 'TEXT_INPUT',
                x: 260, y: 100, w: 400, h: 40,
                props: { targetVariable: 'Event_Reason', placeholder: 'e.g. Minor Quality Deviation' }
            },
            {
                id: `c15_${ts}`, type: 'TEXT',
                x: 260, y: 160, w: 400, h: 30,
                props: { text: 'Description:', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c16_${ts}`, type: 'TEXT_INPUT',
                x: 260, y: 190, w: 400, h: 100,
                props: { targetVariable: 'Event_Description', placeholder: 'Brief description...' }
            },
            {
                id: `c17_${ts}`, type: 'BUTTON',
                x: 260, y: 310, w: 190, h: 50,
                props: { text: 'Cancel', backgroundColor: '#e2e8f0', color: 'black', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            },
            {
                id: `c18_${ts}`, type: 'BUTTON',
                x: 470, y: 310, w: 190, h: 50,
                props: { text: 'Create Alert', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.actions,
                        mapping: { 
                            'Title': '@Event_Reason',
                            'Comments': '@Event_Description',
                            'Location': '@Station_ID',
                            'Status': 'New',
                            'Type': 'ALERT',
                            'Work_Order_ID': '@Selected_WO_ID',
                            'Reported_by': '{{$GLOBAL_USER}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Event_Description' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 4: Andon ---
    const stepAndon = {
        id: `s_andon_${ts}`,
        title: 'Andon',
        stepType: 'Step',
        components: [
            {
                id: `c19_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'Andon - Station Down', fontSize: 24, fontWeight: 'bold', color: '#dc2626' }
            },
            {
                id: `c20_${ts}`, type: 'TEXT',
                x: 480, y: 70, w: 400, h: 30,
                props: { text: 'Reason Code:', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c21_${ts}`, type: 'TEXT_INPUT',
                x: 480, y: 100, w: 460, h: 40,
                props: { targetVariable: 'Event_Reason', placeholder: 'Machine breakdown' }
            },
            {
                id: `c22_${ts}`, type: 'TEXT',
                x: 480, y: 160, w: 400, h: 30,
                props: { text: 'Add Comment:', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c23_${ts}`, type: 'TEXT_INPUT',
                x: 480, y: 190, w: 460, h: 100,
                props: { targetVariable: 'Event_Description', placeholder: 'Comments...' }
            },
            {
                id: `c24_${ts}`, type: 'BUTTON',
                x: 480, y: 310, w: 460, h: 50,
                props: { text: 'Log Andon', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.actions,
                        mapping: { 
                            'Title': '@Event_Reason',
                            'Comments': '@Event_Description',
                            'Location': '@Station_ID',
                            'Status': 'New',
                            'Type': 'ANDON',
                            'Work_Order_ID': '@Selected_WO_ID',
                            'Reported_by': '{{$GLOBAL_USER}}'
                        }
                    },
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.stationHistory,
                        mapping: {
                            'Station_ID': '@Station_ID',
                            'Status': 'DOWN',
                            'Downtime_reason': '@Event_Reason',
                            'Comments': '@Event_Description',
                            'Work_Order_ID': '@Selected_WO_ID'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Andon Logged', messageType: 'error' }
                ]
            },
            {
                id: `c25_${ts}`, type: 'BUTTON',
                x: 480, y: 400, w: 460, h: 50,
                props: { text: 'Resolve Andon Event', backgroundColor: '#22c55e', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.stations,
                        mapping: { 'ID': '@Station_ID', 'Status': 'RUNNING', 'Work_Order_ID': '@Selected_WO_ID' }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Event_Description' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            },
            {
                id: `c26_${ts}`, type: 'HEADING',
                x: 20, y: 150, w: 440, h: 200,
                props: { text: '⚠️ STATION DOWN ⚠️', fontSize: 36, fontWeight: 'bold', color: '#dc2626', textAlignment: 1 }
            }
        ]
    };

    // --- STEP 5: Open Alert Event ---
    const stepOpenAlerts = {
        id: `s_open_alerts_${ts}`,
        title: 'Open alert event',
        stepType: 'Step',
        components: [
            {
                id: `c27_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'Open Alert Events', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c28_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            },
            {
                id: `c29_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 440, h: 400,
                props: {
                    tableId: T.actions,
                    title: 'Open Alerts',
                    columns: ['Location', 'Title', 'Work_Order_ID', 'Comments']
                },
                triggers: [
                    { 
                        event: 'ON_ROW_SELECT', 
                        type: 'DATA', 
                        action: 'TABLE_RECORD_LOAD',
                        tableId: T.actions,
                        recordPlaceholderId: `r2_${ts}`,
                        linkVariable: 'Selected_Alert_ID'
                    }
                ]
            },
            {
                id: `c30_${ts}`, type: 'RECORD_DISPLAY',
                x: 480, y: 70, w: 460, h: 180,
                props: { 
                    placeholderId: `r2_${ts}`,
                    fieldsToShow: ['ID', 'Location', 'Title', 'Reported_by', 'Status', 'Comments'] 
                }
            },
            {
                id: `c31_${ts}`, type: 'TEXT',
                x: 480, y: 270, w: 100, h: 30,
                props: { text: 'Add Note:', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c32_${ts}`, type: 'TEXT_INPUT',
                x: 590, y: 265, w: 350, h: 60,
                props: { targetVariable: 'Event_Description', placeholder: 'Resolution details...' }
            },
            {
                id: `c33_${ts}`, type: 'BUTTON',
                x: 480, y: 350, w: 460, h: 50,
                props: { text: 'Resolve alert event', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r2_${ts}`,
                        mapping: { 
                            'Actions_Taken': '@Event_Description',
                            'Status': 'Closed'
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Event_Description' }
                ]
            }
        ]
    };

    return {
        id: `app_at_${ts}`,
        name: 'Andon Terminal',
        description: 'Enable end-users to report downtime events to the station supervisor and create alerts.',
        category: 'MES Production Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.workOrders, T.stationHistory, T.stations, T.actions],
            appTriggers: [],
            steps: [stepSelectOrder, stepMain, stepCreateAlert, stepAndon, stepOpenAlerts],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
