export function createAndonManagementTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        stations: 'tbl_am_stations',
        actions: 'tbl_am_actions' // For alerts and andons
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_Station_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Selected_Action_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v3_${ts}`, name: 'Assignee', type: 'string', defaultValue: '', persisted: true },
        { id: `v4_${ts}`, name: 'New_Comment', type: 'string', defaultValue: '', persisted: true },
        { id: `v5_${ts}`, name: 'History_Filter_Type', type: 'string', defaultValue: 'ALL', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Current_Station', tableId: T.stations, type: 'single' },
        { id: `r2_${ts}`, name: 'Current_Action', tableId: T.actions, type: 'single' }
    ];

    // --- STEP 1: Station Status Table ---
    const stepStationTable = {
        id: `s_station_${ts}`,
        title: 'Station Status Table',
        stepType: 'Step',
        components: [
            // Header
            {
                id: `c1_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 920, h: 40,
                props: { text: 'Station Status Table', fontSize: 28, fontWeight: 'bold', color: '#0f172a' }
            },
            
            // Interactive Table (Stations)
            {
                id: `c2_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 920, h: 400,
                props: {
                    tableId: T.stations,
                    title: 'Station Statuses',
                    columns: ['ID', 'Status', 'Status_Color', 'Operator', 'Work_Order_ID'],
                    pageSize: 10
                },
                triggers: [
                    { 
                        event: 'ON_ROW_SELECT', 
                        type: 'DATA', 
                        action: 'TABLE_RECORD_LOAD',
                        tableId: T.stations,
                        recordPlaceholderId: `r1_${ts}`,
                        linkVariable: 'Selected_Station_ID'
                    },
                    {
                        event: 'ON_ROW_SELECT',
                        type: 'NAVIGATION',
                        action: 'GO_TO_STEP',
                        stepId: `s_andon_${ts}`
                    }
                ]
            },
            
            // Footer Navigation
            {
                id: `c3_${ts}`, type: 'BUTTON',
                x: 640, y: 490, w: 140, h: 40,
                props: { text: 'Open Alerts', backgroundColor: '#eab308', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_alerts_${ts}` }
                ]
            },
            {
                id: `c4_${ts}`, type: 'BUTTON',
                x: 800, y: 490, w: 140, h: 40,
                props: { text: 'View History', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_history_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 2: View Station Details - Andon ---
    const stepAndonDetails = {
        id: `s_andon_${ts}`,
        title: 'View station details - Andon',
        stepType: 'Step',
        components: [
            {
                id: `c5_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'View Station Details - Andon', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c6_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_station_${ts}` }
                ]
            },
            
            // Open Events Table (Filtered by Location and Type = ANDON)
            {
                id: `c7_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 440, h: 400,
                props: {
                    tableId: T.actions,
                    title: 'Open Andon Events',
                    columns: ['Location', 'Title', 'Work_Order_ID', 'Status']
                },
                triggers: [
                    { 
                        event: 'ON_ROW_SELECT', 
                        type: 'DATA', 
                        action: 'TABLE_RECORD_LOAD',
                        tableId: T.actions,
                        recordPlaceholderId: `r2_${ts}`,
                        linkVariable: 'Selected_Action_ID'
                    }
                ]
            },

            // Action Details & Assignment
            {
                id: `c8_${ts}`, type: 'RECORD_DISPLAY',
                x: 480, y: 70, w: 460, h: 180,
                props: { 
                    placeholderId: `r2_${ts}`,
                    fieldsToShow: ['ID', 'Location', 'Title', 'Reported_by', 'Owner', 'Status'] 
                }
            },
            {
                id: `c9_${ts}`, type: 'TEXT',
                x: 480, y: 270, w: 100, h: 30,
                props: { text: 'Assignee:', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c10_${ts}`, type: 'TEXT_INPUT',
                x: 590, y: 265, w: 350, h: 40,
                props: { targetVariable: 'Assignee', placeholder: 'Enter username...' }
            },
            {
                id: `c11_${ts}`, type: 'BUTTON',
                x: 480, y: 320, w: 460, h: 40,
                props: { text: 'Assign User & Notify', backgroundColor: '#3b82f6', color: 'white' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r2_${ts}`,
                        mapping: { 'Owner': '@Assignee', 'Status': 'In progress' }
                    }
                ]
            },
            {
                id: `c12_${ts}`, type: 'TEXT',
                x: 480, y: 380, w: 100, h: 30,
                props: { text: 'Add Comment:', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c13_${ts}`, type: 'TEXT_INPUT',
                x: 590, y: 375, w: 350, h: 40,
                props: { targetVariable: 'New_Comment', placeholder: 'Notes...' }
            },
            {
                id: `c14_${ts}`, type: 'BUTTON',
                x: 480, y: 430, w: 460, h: 40,
                props: { text: 'Save Comment', backgroundColor: '#10b981', color: 'white' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r2_${ts}`,
                        mapping: { 'Comments': '@New_Comment' }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'New_Comment' }
                ]
            }
        ]
    };

    // --- STEP 3: View Station Details - Alerts ---
    const stepAlertDetails = {
        id: `s_alerts_${ts}`,
        title: 'View station details - Alerts',
        stepType: 'Step',
        components: [
            {
                id: `c15_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'View Station Details - Alerts', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c16_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_station_${ts}` }
                ]
            },
            
            // Open Alerts Table
            {
                id: `c17_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 440, h: 400,
                props: {
                    tableId: T.actions,
                    title: 'Open Alerts',
                    columns: ['Location', 'Title', 'Work_Order_ID', 'Severity']
                },
                triggers: [
                    { 
                        event: 'ON_ROW_SELECT', 
                        type: 'DATA', 
                        action: 'TABLE_RECORD_LOAD',
                        tableId: T.actions,
                        recordPlaceholderId: `r2_${ts}`,
                        linkVariable: 'Selected_Action_ID'
                    }
                ]
            },

            // Action Details & Resolution
            {
                id: `c18_${ts}`, type: 'RECORD_DISPLAY',
                x: 480, y: 70, w: 460, h: 180,
                props: { 
                    placeholderId: `r2_${ts}`,
                    fieldsToShow: ['ID', 'Location', 'Title', 'Reported_by', 'Severity', 'Status'] 
                }
            },
            {
                id: `c19_${ts}`, type: 'TEXT',
                x: 480, y: 270, w: 100, h: 30,
                props: { text: 'Assignee:', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c20_${ts}`, type: 'TEXT_INPUT',
                x: 590, y: 265, w: 350, h: 40,
                props: { targetVariable: 'Assignee', placeholder: 'Enter username...' }
            },
            {
                id: `c21_${ts}`, type: 'BUTTON',
                x: 480, y: 320, w: 460, h: 40,
                props: { text: 'Assign User', backgroundColor: '#3b82f6', color: 'white' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r2_${ts}`,
                        mapping: { 'Owner': '@Assignee' }
                    }
                ]
            },
            {
                id: `c22_${ts}`, type: 'TEXT',
                x: 480, y: 380, w: 100, h: 30,
                props: { text: 'Resolution:', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c23_${ts}`, type: 'TEXT_INPUT',
                x: 590, y: 375, w: 350, h: 40,
                props: { targetVariable: 'New_Comment', placeholder: 'Actions taken...' }
            },
            {
                id: `c24_${ts}`, type: 'BUTTON',
                x: 480, y: 430, w: 460, h: 40,
                props: { text: 'Resolve Alert Event', backgroundColor: '#22c55e', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r2_${ts}`,
                        mapping: { 
                            'Actions_Taken': '@New_Comment',
                            'Status': 'Closed'
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'New_Comment' }
                ]
            }
        ]
    };

    // --- STEP 4: View History ---
    const stepHistory = {
        id: `s_history_${ts}`,
        title: 'View history',
        stepType: 'Step',
        components: [
            {
                id: `c25_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'History of Closed Events', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c26_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_station_${ts}` }
                ]
            },
            
            // Closed Events Table
            {
                id: `c27_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 600, h: 400,
                props: {
                    tableId: T.actions,
                    title: 'Closed Actions/Alerts',
                    columns: ['Type', 'Title', 'Location', 'Status', 'Work_Order_ID']
                },
                triggers: [
                    { 
                        event: 'ON_ROW_SELECT', 
                        type: 'DATA', 
                        action: 'TABLE_RECORD_LOAD',
                        tableId: T.actions,
                        recordPlaceholderId: `r2_${ts}`,
                        linkVariable: 'Selected_Action_ID'
                    }
                ]
            },

            // Event Details
            {
                id: `c28_${ts}`, type: 'RECORD_DISPLAY',
                x: 640, y: 70, w: 300, h: 400,
                props: { 
                    placeholderId: `r2_${ts}`,
                    fieldsToShow: ['Work_Order_ID', 'Location', 'Title', 'Reported_by', 'Owner', 'Status', 'Actions_Taken', 'Comments'] 
                }
            }
        ]
    };

    return {
        id: `app_am_${ts}`,
        name: 'Andon Management',
        description: 'Monitor station statuses in real time, view open Andon and alert events, assign users, and resolve issues.',
        category: 'MES Production Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.stations, T.actions],
            appTriggers: [],
            steps: [stepStationTable, stepAndonDetails, stepAlertDetails, stepHistory],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
