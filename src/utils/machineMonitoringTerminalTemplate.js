export function createMachineMonitoringTerminalTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        workOrders: 'tbl_mmt_work_orders',
        notes: 'tbl_mmt_notes'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_WO_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Selected_Machine_ID', type: 'string', defaultValue: 'Machine-01', persisted: true },
        { id: `v3_${ts}`, name: 'Ideal_Run_Rate', type: 'number', defaultValue: 100, persisted: true },
        { id: `v4_${ts}`, name: 'Good_Parts_Qty', type: 'number', defaultValue: 0, persisted: true },
        { id: `v5_${ts}`, name: 'Defect_Parts_Qty', type: 'number', defaultValue: 0, persisted: true },
        { id: `v6_${ts}`, name: 'Downtime_Reason', type: 'string', defaultValue: '', persisted: true },
        { id: `v7_${ts}`, name: 'New_Note_Text', type: 'string', defaultValue: '', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Current_Work_Order', tableId: T.workOrders, type: 'single' }
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
                props: { text: 'Select Order & Machine', fontSize: 28, fontWeight: 'bold' }
            },
            {
                id: `c2_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 600, h: 260,
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
                id: `c3_${ts}`, type: 'TEXT',
                x: 20, y: 350, w: 200, h: 30,
                props: { text: 'Select a Machine:', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c4_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 380, w: 600, h: 40,
                props: { targetVariable: 'Selected_Machine_ID', placeholder: 'Enter Machine ID (e.g. CNC-01)' }
            },
            {
                id: `c5_${ts}`, type: 'RECORD_DISPLAY',
                x: 640, y: 70, w: 300, h: 260,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Status', 'Location', 'QTY_Required', 'Due_Date'] 
                }
            },
            {
                id: `c6_${ts}`, type: 'BUTTON',
                x: 640, y: 380, w: 300, h: 50,
                props: { text: 'Start Production', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'IN PROGRESS' }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_changeover_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 2: Change Over ---
    const stepChangeOver = {
        id: `s_changeover_${ts}`,
        title: 'Change over',
        stepType: 'Step',
        components: [
            {
                id: `c7_${ts}`, type: 'HEADING',
                x: 280, y: 50, w: 400, h: 40,
                props: { text: 'Set ideal run rate for:', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c8_${ts}`, type: 'RECORD_DISPLAY',
                x: 280, y: 100, w: 400, h: 100,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Location'] 
                }
            },
            {
                id: `c9_${ts}`, type: 'TEXT',
                x: 280, y: 220, w: 200, h: 30,
                props: { text: 'Ideal run rate *', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c10_${ts}`, type: 'NUMBER_INPUT',
                x: 280, y: 250, w: 400, h: 40,
                props: { targetVariable: 'Ideal_Run_Rate', min: 1 }
            },
            {
                id: `c11_${ts}`, type: 'BUTTON',
                x: 280, y: 320, w: 400, h: 50,
                props: { text: 'Save & Continue', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_terminal_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 3: Machine Terminal ---
    const stepTerminal = {
        id: `s_terminal_${ts}`,
        title: 'Machine Terminal',
        stepType: 'Step',
        components: [
            // Top Metrics row
            {
                id: `c12_${ts}`, type: 'RECORD_DISPLAY',
                x: 20, y: 20, w: 420, h: 80,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'QTY_Required', 'QTY_Complete'] 
                }
            },
            {
                id: `c13_${ts}`, type: 'TEXT',
                x: 460, y: 20, w: 140, h: 80,
                props: { text: 'Parts made\n\n{{@Good_Parts_Qty}}', fontSize: 14, fontWeight: 'bold', textAlignment: 1, backgroundColor: '#f8fafc' }
            },
            {
                id: `c14_${ts}`, type: 'BUTTON',
                x: 460, y: 100, w: 140, h: 30,
                props: { text: 'Add', backgroundColor: '#16a34a', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Good_Parts_Qty', value: '{{@Good_Parts_Qty}} + 1' },
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE', recordPlaceholderId: `r1_${ts}`, mapping: { 'QTY_Complete': '{{@Good_Parts_Qty}}' } }
                ]
            },
            {
                id: `c15_${ts}`, type: 'TEXT',
                x: 620, y: 20, w: 140, h: 80,
                props: { text: 'Defects\n\n{{@Defect_Parts_Qty}}', fontSize: 14, fontWeight: 'bold', textAlignment: 1, backgroundColor: '#f8fafc' }
            },
            {
                id: `c16_${ts}`, type: 'BUTTON',
                x: 620, y: 100, w: 140, h: 30,
                props: { text: 'Add', backgroundColor: '#dc2626', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Defect_Parts_Qty', value: '{{@Defect_Parts_Qty}} + 1' },
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE', recordPlaceholderId: `r1_${ts}`, mapping: { 'QTY_Scrap': '{{@Defect_Parts_Qty}}' } }
                ]
            },
            {
                id: `c17_${ts}`, type: 'TEXT',
                x: 780, y: 20, w: 160, h: 110,
                props: { text: 'Ideal run rate\n\n{{@Ideal_Run_Rate}}', fontSize: 16, fontWeight: 'bold', textAlignment: 1, backgroundColor: '#f8fafc' }
            },

            // Middle Left: Machine Status
            {
                id: `c18_${ts}`, type: 'TEXT',
                x: 20, y: 150, w: 280, h: 220,
                props: { 
                    text: 'Machine: {{@Selected_Machine_ID}}\nStatus: Stopped\n\nDowntime Reason:\n{{@Downtime_Reason}}\n\nQuality: 98%\nUptime: 76%',
                    fontSize: 16, fontWeight: 'bold', backgroundColor: '#d0a273', color: 'white', padding: '15px'
                }
            },

            // Middle Right: Timeline & Notes
            {
                id: `c19_${ts}`, type: 'MACHINE_TIMELINE',
                x: 320, y: 150, w: 620, h: 100,
                props: {
                    machineId: '{{@Selected_Machine_ID}}',
                    title: 'Machine Timeline'
                }
            },
            {
                id: `c20_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 320, y: 260, w: 620, h: 110,
                props: {
                    tableId: T.notes,
                    title: 'Last Notes',
                    columns: ['Date_Created', 'Sender', 'Location', 'Notes'],
                    filter: "Reference_ID = '{{@Selected_WO_ID}}'"
                }
            },

            // Bottom Actions
            {
                id: `c21_${ts}`, type: 'BUTTON',
                x: 20, y: 490, w: 200, h: 50,
                props: { text: 'View/Add Notes', backgroundColor: '#e2e8f0', color: 'black', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_notes_${ts}` }
                ]
            },
            {
                id: `c22_${ts}`, type: 'BUTTON',
                x: 280, y: 490, w: 220, h: 50,
                props: { text: '⚠️ Select Downtime Reason', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_downtime_${ts}` }
                ]
            },
            {
                id: `c23_${ts}`, type: 'BUTTON',
                x: 520, y: 490, w: 180, h: 50,
                props: { text: 'View Analytics', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_analytics_${ts}` }
                ]
            },
            {
                id: `c24_${ts}`, type: 'BUTTON',
                x: 720, y: 490, w: 220, h: 50,
                props: { text: 'Finish Production', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 'Status': 'COMPLETED', 'Complete_Date': '{{$GLOBAL_TIME}}' }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Selected_Machine_ID' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_select_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 4: Select Downtime Reason ---
    const stepDowntime = {
        id: `s_downtime_${ts}`,
        title: 'Select Downtime Reason',
        stepType: 'Step',
        components: [
            {
                id: `c25_${ts}`, type: 'RECORD_DISPLAY',
                x: 20, y: 10, w: 920, h: 80,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'QTY_Required'] 
                }
            },
            {
                id: `c26_${ts}`, type: 'TEXT',
                x: 20, y: 110, w: 260, h: 260,
                props: { 
                    text: 'Machine: {{@Selected_Machine_ID}}\nStatus: Stopped\n\nPart Count: {{@Good_Parts_Qty}}\nDefect Count: {{@Defect_Parts_Qty}}',
                    fontSize: 16, backgroundColor: '#c57878', color: 'white', padding: '15px', fontWeight: 'bold'
                }
            },
            {
                id: `c27_${ts}`, type: 'HEADING',
                x: 300, y: 110, w: 640, h: 40,
                props: { text: 'Select a Reason', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `c28_${ts}`, type: 'BUTTON',
                x: 300, y: 170, w: 300, h: 50,
                props: { text: 'IDLE', backgroundColor: '#eab308', color: 'black', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Downtime_Reason', value: 'IDLE' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_terminal_${ts}` }
                ]
            },
            {
                id: `c29_${ts}`, type: 'BUTTON',
                x: 620, y: 170, w: 300, h: 50,
                props: { text: 'DOWN - MACHINE ERROR', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Downtime_Reason', value: 'MACHINE ERROR' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_terminal_${ts}` }
                ]
            },
            {
                id: `c30_${ts}`, type: 'BUTTON',
                x: 300, y: 240, w: 300, h: 50,
                props: { text: 'OFF / BREAK', backgroundColor: '#94a3b8', color: 'black', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Downtime_Reason', value: 'OFF / BREAK' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_terminal_${ts}` }
                ]
            },
            {
                id: `c31_${ts}`, type: 'BUTTON',
                x: 620, y: 240, w: 300, h: 50,
                props: { text: 'DOWN - MATERIAL SHORTAGE', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Downtime_Reason', value: 'MATERIAL SHORTAGE' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_terminal_${ts}` }
                ]
            },
            {
                id: `c32_${ts}`, type: 'BUTTON',
                x: 300, y: 310, w: 300, h: 50,
                props: { text: 'SETUP / CHANGEOVER', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Downtime_Reason', value: 'SETUP' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_terminal_${ts}` }
                ]
            },
            {
                id: `c33_${ts}`, type: 'BUTTON',
                x: 620, y: 310, w: 300, h: 50,
                props: { text: 'DOWN - MACHINE MAINTENANCE', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Downtime_Reason', value: 'MAINTENANCE' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_terminal_${ts}` }
                ]
            },
            {
                id: `c34_${ts}`, type: 'BUTTON',
                x: 20, y: 490, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_terminal_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 5: View/Add Notes ---
    const stepNotes = {
        id: `s_notes_${ts}`,
        title: 'View/Add Station Notes',
        stepType: 'Step',
        components: [
            {
                id: `c35_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'Station Notes', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c36_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_terminal_${ts}` }
                ]
            },
            {
                id: `c37_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 600, h: 300,
                props: {
                    tableId: T.notes,
                    title: 'Current Notes for Order',
                    columns: ['Date_Created', 'Location', 'Sender', 'Notes'],
                    filter: "Reference_ID = '{{@Selected_WO_ID}}'"
                }
            },
            {
                id: `c38_${ts}`, type: 'TEXT',
                x: 640, y: 70, w: 300, h: 30,
                props: { text: 'Add a new note:', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c39_${ts}`, type: 'TEXT_INPUT',
                x: 640, y: 100, w: 300, h: 120,
                props: { targetVariable: 'New_Note_Text', placeholder: 'Enter note description here...' }
            },
            {
                id: `c40_${ts}`, type: 'BUTTON',
                x: 640, y: 240, w: 300, h: 50,
                props: { text: 'Save Note', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.notes,
                        mapping: { 
                            'Reference_ID': '@Selected_WO_ID',
                            'Location': '@Selected_Machine_ID',
                            'Notes': '@New_Note_Text',
                            'Sender': '{{$GLOBAL_USER}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'New_Note_Text' }
                ]
            }
        ]
    };

    // --- STEP 6: Analytics ---
    const stepAnalytics = {
        id: `s_analytics_${ts}`,
        title: 'Machine Analytics',
        stepType: 'Step',
        components: [
            {
                id: `c41_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'OEE & Machine Analytics', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c42_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_terminal_${ts}` }
                ]
            },
            {
                id: `c43_${ts}`, type: 'TEXT',
                x: 20, y: 70, w: 220, h: 200,
                props: { text: 'OEE\n\n78.4%', fontSize: 24, fontWeight: 'bold', textAlignment: 1, backgroundColor: '#ede9fe', color: '#7c3aed', padding: '50px' }
            },
            {
                id: `c44_${ts}`, type: 'TEXT',
                x: 250, y: 70, w: 220, h: 200,
                props: { text: 'Performance\n\n82%', fontSize: 24, fontWeight: 'bold', textAlignment: 1, backgroundColor: '#fef9c3', color: '#ca8a04', padding: '50px' }
            },
            {
                id: `c45_${ts}`, type: 'TEXT',
                x: 480, y: 70, w: 220, h: 200,
                props: { text: 'Availability\n\n95%', fontSize: 24, fontWeight: 'bold', textAlignment: 1, backgroundColor: '#e0f2fe', color: '#0284c7', padding: '50px' }
            },
            {
                id: `c46_${ts}`, type: 'TEXT',
                x: 710, y: 70, w: 230, h: 200,
                props: { text: 'Quality\n\n99%', fontSize: 24, fontWeight: 'bold', textAlignment: 1, backgroundColor: '#dcfce7', color: '#16a34a', padding: '50px' }
            },
            {
                id: `c47_${ts}`, type: 'TEXT',
                x: 20, y: 290, w: 920, h: 100,
                props: { 
                    text: 'Analytics data is mocked for preview. In production, these tiles calculate in real-time based on Machine Timeline and Event History associated with Machine ID: {{@Selected_Machine_ID}}', 
                    fontSize: 16, backgroundColor: '#f8fafc', padding: '20px'
                }
            }
        ]
    };

    return {
        id: `app_mmt_${ts}`,
        name: 'Machine Monitoring Terminal',
        description: 'Track machine utilization, log downtime reasons, and monitor performance and OEE directly from the machine interface.',
        category: 'MES Production Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.workOrders, T.notes],
            appTriggers: [],
            steps: [stepSelectOrder, stepChangeOver, stepTerminal, stepDowntime, stepNotes, stepAnalytics],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
