export function createInventoryDashboardTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        materialRequests: 'tbl_im_material_requests',
        kanbanCards: 'tbl_im_kanban_cards',
        materialDefs: 'tbl_im_material_definitions',
        inventoryItems: 'tbl_im_inventory_items'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'CycleTime_KPI', type: 'string', defaultValue: '25:20:15', persisted: true },
        { id: `v2_${ts}`, name: 'Pending_Kanbans_Count', type: 'number', defaultValue: 3, persisted: true },
        { id: `v3_${ts}`, name: 'Wh_To_Sup_Count', type: 'number', defaultValue: 2, persisted: true },
        { id: `v4_${ts}`, name: 'Ms_To_Sup_Count', type: 'number', defaultValue: 1, persisted: true },
        { id: `v5_${ts}`, name: 'Sup_To_Asm_Count', type: 'number', defaultValue: 3, persisted: true }
    ];

    // Record Placeholders
    const R = [];

    // --- STEP 1: Inventory Dashboard ---
    const stepDashboard = {
        id: `s_dashboard_${ts}`,
        title: 'Inventory Dashboard',
        stepType: 'Step',
        components: [
            // Left Column Title: Today's deliveries
            {
                id: `c_title_deliv_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 200, h: 30,
                props: { text: "Today's deliveries", fontSize: 18, fontWeight: 'bold', textAlignment: 1 }
            },
            // Card 1: Warehouse to Supermarket
            {
                id: `card_wh_sup_lbl_${ts}`, type: 'TEXT',
                x: 20, y: 55, w: 200, h: 25,
                props: { text: 'Warehouse to Supermarket', fontSize: 13, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `card_wh_sup_val_${ts}`, type: 'TEXT',
                x: 20, y: 80, w: 200, h: 100,
                props: { text: '{{@Wh_To_Sup_Count}}', fontSize: 72, fontWeight: 'black', textAlignment: 1 }
            },
            // Card 2: Machine shop to Supermarket
            {
                id: `card_ms_sup_lbl_${ts}`, type: 'TEXT',
                x: 20, y: 195, w: 200, h: 25,
                props: { text: 'Machine shop to Supermarket', fontSize: 13, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `card_ms_sup_val_${ts}`, type: 'TEXT',
                x: 20, y: 220, w: 200, h: 100,
                props: { text: '{{@Ms_To_Sup_Count}}', fontSize: 72, fontWeight: 'black', textAlignment: 1 }
            },
            // Card 3: Supermarket to Assembly
            {
                id: `card_sup_asm_lbl_${ts}`, type: 'TEXT',
                x: 20, y: 335, w: 200, h: 25,
                props: { text: 'Supermarket to Assembly', fontSize: 13, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `card_sup_asm_val_${ts}`, type: 'TEXT',
                x: 20, y: 360, w: 200, h: 100,
                props: { text: '{{@Sup_To_Asm_Count}}', fontSize: 72, fontWeight: 'black', textAlignment: 1 }
            },

            // Middle Column Title: Today's schedule
            {
                id: `c_title_sched_${ts}`, type: 'HEADING',
                x: 240, y: 15, w: 320, h: 30,
                props: { text: "Today's schedule", fontSize: 18, fontWeight: 'bold', textAlignment: 1 }
            },
            // Table 1: Warehouse to Supermarket Schedule
            {
                id: `tbl_wh_sup_sched_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 240, y: 55, w: 320, h: 125,
                props: {
                    tableId: T.materialRequests,
                    title: 'Warehouse to Supermarket',
                    columns: ['Item', 'Requested', 'Started', 'Completed'],
                    filter: "Supplier = 'Warehouse' AND Requesting_Location = 'Supermarket'"
                }
            },
            // Table 2: Machine shop to Supermarket Schedule
            {
                id: `tbl_ms_sup_sched_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 240, y: 195, w: 320, h: 125,
                props: {
                    tableId: T.materialRequests,
                    title: 'Machine shop to Supermarket',
                    columns: ['Item', 'Requested', 'Started', 'Completed'],
                    filter: "Supplier = 'Machine Shop' AND Requesting_Location = 'Supermarket'"
                }
            },
            // Table 3: Supermarket to Assembly Schedule
            {
                id: `tbl_sup_asm_sched_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 240, y: 335, w: 320, h: 125,
                props: {
                    tableId: T.materialRequests,
                    title: 'Supermarket to Assembly',
                    columns: ['Item', 'Requested', 'Started', 'Completed'],
                    filter: "Supplier = 'Supermarket' AND Requesting_Location = 'Assembly'"
                }
            },

            // Right Column KPI 1: Average delivery cycle time
            {
                id: `kpi_cyc_lbl_${ts}`, type: 'TEXT',
                x: 580, y: 20, w: 170, h: 30,
                props: { text: 'Average delivery cycle time', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `kpi_cyc_val_${ts}`, type: 'TEXT',
                x: 580, y: 55, w: 170, h: 100,
                props: { text: '{{@CycleTime_KPI}}', fontSize: 32, fontWeight: 'bold', color: '#0f172a' }
            },

            // Right Column KPI 2: Pending Kanbans
            {
                id: `kpi_pend_lbl_${ts}`, type: 'TEXT',
                x: 770, y: 20, w: 170, h: 30,
                props: { text: 'Pending Kanbans', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `kpi_pend_val_${ts}`, type: 'TEXT',
                x: 770, y: 55, w: 170, h: 100,
                props: { text: '{{@Pending_Kanbans_Count}}', fontSize: 72, fontWeight: 'bold', textAlignment: 1, color: '#0f172a' }
            },

            // Right Column Card 3: This month's stock outs (Interactive table of parts with high requests)
            {
                id: `kpi_so_lbl_${ts}`, type: 'TEXT',
                x: 580, y: 195, w: 360, h: 30,
                props: { text: "This month's stock outs", fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `tbl_stock_outs_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 580, y: 235, w: 360, h: 225,
                props: {
                    tableId: T.materialRequests,
                    title: 'Frequent Empty Signals',
                    columns: ['Item', 'Quantity', 'Status'],
                    filter: "Status = 'REQUESTED' OR Status = 'ACTIVE'"
                }
            },

            // Home / Refresh buttons in footer
            {
                id: `btn_refresh_db_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 200, h: 45,
                props: { text: '🔄 Refresh Metrics', backgroundColor: '#e2e8f0', color: 'black', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Metrics updated to real-time state!', messageType: 'success' }
                ]
            }
        ]
    };

    return {
        id: `app_id_${ts}`,
        name: 'Inventory Dashboard',
        description: 'Visualize material replenishment cycles, pending requests, and identify the most frequent stock outs.',
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
            steps: [stepDashboard],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
