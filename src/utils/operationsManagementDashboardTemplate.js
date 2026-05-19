export function createOperationsManagementDashboardTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        stationHistory: 'tbl_omd_station_history',
        actions: 'tbl_omd_actions'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Action_Name', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Action_Owner', type: 'string', defaultValue: '', persisted: true },
        { id: `v3_${ts}`, name: 'Issue_Description', type: 'string', defaultValue: '', persisted: true },
        { id: `v4_${ts}`, name: 'Selected_Action_Type', type: 'string', defaultValue: 'SAFETY', persisted: true }
    ];

    // --- STEP 1: Main Dashboard ---
    const stepDashboard = {
        id: `s_dashboard_${ts}`,
        title: 'Dashboard',
        stepType: 'Step',
        components: [
            {
                id: `c1_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'Operations Management Dashboard', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c2_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'View Actions', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_actions_${ts}` }
                ]
            },
            
            // Safety Panel
            {
                id: `c3_${ts}`, type: 'BUTTON',
                x: 20, y: 70, w: 440, h: 220,
                props: { text: 'Safety\n\nNumber of incidents (24h)\n\n1', backgroundColor: '#dc2626', color: 'white', fontSize: 24, fontWeight: 'bold', textAlignment: 0 },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Selected_Action_Type', value: 'SAFETY' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_create_action_${ts}` }
                ]
            },
            
            // Performance Panel
            {
                id: `c4_${ts}`, type: 'BUTTON',
                x: 480, y: 70, w: 460, h: 220,
                props: { text: 'Performance\n\nPerformance %\n\n86.96%', backgroundColor: '#16a34a', color: 'white', fontSize: 24, fontWeight: 'bold', textAlignment: 0 },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Selected_Action_Type', value: 'PERFORMANCE' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_create_action_${ts}` }
                ]
            },
            
            // Quality Panel
            {
                id: `c5_${ts}`, type: 'BUTTON',
                x: 20, y: 310, w: 440, h: 220,
                props: { text: 'Quality\n\nProduction Yield %\n\n96.39%', backgroundColor: '#16a34a', color: 'white', fontSize: 24, fontWeight: 'bold', textAlignment: 0 },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Selected_Action_Type', value: 'QUALITY' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_create_action_${ts}` }
                ]
            },
            
            // Downtime Panel
            {
                id: `c6_${ts}`, type: 'BUTTON',
                x: 480, y: 310, w: 460, h: 220,
                props: { text: 'Downtime\n\nDowntime %\n\n0.03%', backgroundColor: '#16a34a', color: 'white', fontSize: 24, fontWeight: 'bold', textAlignment: 0 },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Selected_Action_Type', value: 'DOWNTIME' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_create_action_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 2: Create Action ---
    const stepCreateAction = {
        id: `s_create_action_${ts}`,
        title: 'Create Action',
        stepType: 'Step',
        components: [
            {
                id: `c7_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'Create new action', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c8_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_dashboard_${ts}` }
                ]
            },
            {
                id: `c9_${ts}`, type: 'TEXT',
                x: 200, y: 80, w: 250, h: 30,
                props: { text: 'Action Name', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c10_${ts}`, type: 'TEXT_INPUT',
                x: 200, y: 110, w: 250, h: 40,
                props: { targetVariable: 'Action_Name', placeholder: 'Enter name...' }
            },
            {
                id: `c11_${ts}`, type: 'TEXT',
                x: 480, y: 80, w: 250, h: 30,
                props: { text: 'Action type', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c12_${ts}`, type: 'TEXT',
                x: 480, y: 110, w: 250, h: 40,
                props: { text: '{{@Selected_Action_Type}}', fontSize: 20 }
            },
            {
                id: `c13_${ts}`, type: 'TEXT',
                x: 200, y: 180, w: 250, h: 30,
                props: { text: 'Action Owner', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c14_${ts}`, type: 'TEXT_INPUT',
                x: 200, y: 210, w: 250, h: 40,
                props: { targetVariable: 'Action_Owner', placeholder: 'Enter owner...' }
            },
            {
                id: `c15_${ts}`, type: 'TEXT',
                x: 200, y: 280, w: 530, h: 30,
                props: { text: 'Issue Description', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c16_${ts}`, type: 'TEXT_INPUT',
                x: 200, y: 310, w: 530, h: 100,
                props: { targetVariable: 'Issue_Description', placeholder: 'Detail the issue...' }
            },
            {
                id: `c17_${ts}`, type: 'BUTTON',
                x: 200, y: 430, w: 250, h: 50,
                props: { text: 'Cancel', backgroundColor: '#e2e8f0', color: 'black', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_dashboard_${ts}` }
                ]
            },
            {
                id: `c18_${ts}`, type: 'BUTTON',
                x: 480, y: 430, w: 250, h: 50,
                props: { text: 'Create record', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.actions,
                        mapping: { 
                            'Title': '@Action_Name',
                            'Comments': '@Issue_Description',
                            'Owner': '@Action_Owner',
                            'Status': 'New',
                            'Type': '@Selected_Action_Type',
                            'Reported_by': '{{$GLOBAL_USER}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Action_Name' },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Issue_Description' },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Action_Owner' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Action escalated.', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_dashboard_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 3: View Actions ---
    const stepViewActions = {
        id: `s_actions_${ts}`,
        title: 'View actions',
        stepType: 'Step',
        components: [
            {
                id: `c19_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'Open Actions', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c20_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Dashboard', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_dashboard_${ts}` }
                ]
            },
            {
                id: `c21_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 920, h: 460,
                props: {
                    tableId: T.actions,
                    title: 'Actions Required',
                    columns: ['Type', 'Title', 'Owner', 'Status', 'Reported_by', 'Comments'],
                    filter: "Status != 'Closed'"
                }
            }
        ]
    };

    return {
        id: `app_omd_${ts}`,
        name: 'Operations Management Dashboard',
        description: 'Dashboard showing the most important metrics for Safety, Quality, Performance, and Downtime.',
        category: 'MES Production Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: [],
            appTables: [T.stationHistory, T.actions],
            appTriggers: [],
            steps: [stepDashboard, stepCreateAction, stepViewActions],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
