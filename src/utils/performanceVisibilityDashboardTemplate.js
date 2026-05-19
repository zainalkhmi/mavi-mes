export function createPerformanceVisibilityDashboardTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        stationHistory: 'tbl_pvd_station_history',
        stations: 'tbl_pvd_stations'
    };

    // Variables for the app (filtering, etc.)
    const V = [
        { id: `v1_${ts}`, name: 'Time_Range', type: 'string', defaultValue: 'This Week', persisted: true }
    ];

    // --- STEP 1: Main Dashboard ---
    const stepDashboard = {
        id: `s_dashboard_${ts}`,
        title: 'Production Visibility Dashboard',
        stepType: 'Step',
        components: [
            {
                id: `c1_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'Performance Visibility Dashboard', fontSize: 28, fontWeight: 'bold' }
            },
            {
                id: `c2_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'OEE Metrics', backgroundColor: '#3b82f6', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_oee_${ts}` }
                ]
            },
            // Station statuses table
            {
                id: `c3_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 450, h: 220,
                props: {
                    tableId: T.stations,
                    title: 'Current Station Statuses',
                    columns: ['ID', 'Status', 'Operator', 'Work_Order_ID']
                }
            },
            // Today's uptime percentage (represented as a text box for now, could be a GAUGE if supported)
            {
                id: `c4_${ts}`, type: 'TEXT',
                x: 490, y: 70, w: 450, h: 220,
                props: {
                    text: "Today's Uptime Percentage\n\n86.5%",
                    fontSize: 24,
                    fontWeight: 'bold',
                    textAlignment: 1,
                    backgroundColor: '#f0fdf4',
                    color: '#16a34a',
                    padding: '60px'
                }
            },
            // This week's downtime reasons Pareto
            {
                id: `c5_${ts}`, type: 'BAR_CHART',
                x: 20, y: 310, w: 450, h: 240,
                props: {
                    title: 'Downtime Reasons (This Week)',
                    xAxis: 'Downtime_reason',
                    yAxis: 'Count',
                    tableId: T.stationHistory,
                    filter: "Status = 'DOWN'"
                }
            },
            // This week's running time of stations
            {
                id: `c6_${ts}`, type: 'DONUT_CHART',
                x: 490, y: 310, w: 450, h: 240,
                props: {
                    title: 'Running Time by Station',
                    xAxis: 'Station_ID',
                    yAxis: 'Sum(Duration)',
                    tableId: T.stationHistory,
                    filter: "Status = 'RUNNING'"
                }
            }
        ]
    };

    // --- STEP 2: OEE Metrics ---
    const stepOEE = {
        id: `s_oee_${ts}`,
        title: 'OEE Metrics',
        stepType: 'Step',
        components: [
            {
                id: `c7_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'OEE Metrics (Overall Equipment Effectiveness)', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c8_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Dashboard', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_dashboard_${ts}` }
                ]
            },
            // Availability
            {
                id: `c9_${ts}`, type: 'TEXT',
                x: 20, y: 80, w: 220, h: 200,
                props: {
                    text: 'Availability\n\n86%',
                    fontSize: 22,
                    fontWeight: 'bold',
                    textAlignment: 1,
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    padding: '50px'
                }
            },
            // Performance
            {
                id: `c10_${ts}`, type: 'TEXT',
                x: 250, y: 80, w: 220, h: 200,
                props: {
                    text: 'Performance\n\n92%',
                    fontSize: 22,
                    fontWeight: 'bold',
                    textAlignment: 1,
                    backgroundColor: '#fef9c3',
                    color: '#ca8a04',
                    padding: '50px'
                }
            },
            // Quality
            {
                id: `c11_${ts}`, type: 'TEXT',
                x: 480, y: 80, w: 220, h: 200,
                props: {
                    text: 'Quality\n\n98%',
                    fontSize: 22,
                    fontWeight: 'bold',
                    textAlignment: 1,
                    backgroundColor: '#dcfce7',
                    color: '#16a34a',
                    padding: '50px'
                }
            },
            // OEE
            {
                id: `c12_${ts}`, type: 'TEXT',
                x: 710, y: 80, w: 230, h: 200,
                props: {
                    text: 'OEE\n\n77.5%',
                    fontSize: 28,
                    fontWeight: 'bold',
                    textAlignment: 1,
                    backgroundColor: '#ede9fe',
                    color: '#7c3aed',
                    padding: '45px'
                }
            },
            {
                id: `c13_${ts}`, type: 'TEXT',
                x: 20, y: 310, w: 920, h: 200,
                props: {
                    text: 'How OEE is Calculated:\n\n• Availability: % of time the station is running compared to total scheduled time.\n• Performance: % of products made compared to the goal number in a given time interval.\n• Quality: % of products that pass quality check as compared to all products made.\n\nOEE = Availability × Performance × Quality',
                    fontSize: 16,
                    backgroundColor: '#f8fafc',
                    color: '#334155',
                    padding: '20px'
                }
            }
        ]
    };

    return {
        id: `app_pvd_${ts}`,
        name: 'Performance Visibility Dashboard',
        description: 'Visualize data logged on the shop floor, including uptime, downtime reasons, and OEE metrics.',
        category: 'MES Production Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: [],
            appTables: [T.stationHistory, T.stations],
            appTriggers: [],
            steps: [stepDashboard, stepOEE],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
