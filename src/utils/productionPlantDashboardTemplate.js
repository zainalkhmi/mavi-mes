/**
 * productionPlantDashboardTemplate.js
 * Tulip-style Production Plant Dashboard & Cell Tracker Template
 */

export function createProductionPlantDashboardTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const T = {
        cells: 'tbl_production_cells',
        downtime: 'tbl_downtime_events',
        orders: 'tbl_orders_pipeline'
    };

    const appVariables = [
        { id: `v1_${ts}`, name: 'Cell_Selected', type: 'string', defaultValue: 'Rotor Assembly', persisted: true },
        { id: `v2_${ts}`, name: 'Cell_Target', type: 'number', defaultValue: 120, persisted: true },
        { id: `v3_${ts}`, name: 'Cell_Completed', type: 'number', defaultValue: 114, persisted: true },
        { id: `v4_${ts}`, name: 'Cell_Defects', type: 'number', defaultValue: 2, persisted: true },
        { id: `v5_${ts}`, name: 'Downtime_Station', type: 'string', defaultValue: 'Housing Line', persisted: true },
        { id: `v6_${ts}`, name: 'Downtime_Reason', type: 'string', defaultValue: 'Tool Breakdown', persisted: true },
        { id: `v7_${ts}`, name: 'Downtime_Minutes', type: 'number', defaultValue: 45, persisted: true },
        { id: `v8_${ts}`, name: 'Operator', type: 'string', defaultValue: '@APP_INFO.USER', persisted: true }
    ];

    // Step 1: Live Plant Dashboard Screen
    const step1 = {
        id: `s1_${ts}`,
        title: '1. Plant Dashboard Overview',
        stepType: 'Step',
        components: [
            {
                id: `s1_bg_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 1000, h: 64,
                props: { backgroundColor: '#0f172a', borderRadius: 0 }
            },
            {
                id: `s1_hdr_${ts}`, type: 'TEXT',
                x: 20, y: 16, w: 600, h: 32,
                props: { text: '🏭 Production Plant Dashboard & Cell Tracker', fontSize: 20, fontWeight: 'bold', color: 'white' }
            },
            {
                id: `s1_btn_input_${ts}`, type: 'BUTTON',
                x: 750, y: 14, w: 230, h: 38,
                props: {
                    label: 'SHOPFLOOR DATA ENTRY ✏️', text: 'SHOPFLOOR DATA ENTRY ✏️', backgroundColor: '#38bdf8', color: '#0f172a', fontSize: 12, fontWeight: 'bold',
                    triggers: [{ name: 'GotoEntry', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            },
            // 4 Top KPIs
            {
                id: `s1_kpi1_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 20, y: 80, w: 230, h: 80,
                props: { backgroundColor: '#ffffff', borderRadius: 8, borderColor: '#e2e8f0', borderWidth: 1 }
            },
            {
                id: `s1_kpi1_l_${ts}`, type: 'TEXT',
                x: 35, y: 92, w: 200, h: 18,
                props: { text: 'ORDERS DUE TODAY', fontSize: 11, fontWeight: 'bold', color: '#64748b' }
            },
            {
                id: `s1_kpi1_v_${ts}`, type: 'TEXT',
                x: 35, y: 112, w: 200, h: 36,
                props: { text: '18 Orders', fontSize: 22, fontWeight: 'bold', color: '#2563eb' }
            },
            {
                id: `s1_kpi2_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 270, y: 80, w: 230, h: 80,
                props: { backgroundColor: '#ffffff', borderRadius: 8, borderColor: '#e2e8f0', borderWidth: 1 }
            },
            {
                id: `s1_kpi2_l_${ts}`, type: 'TEXT',
                x: 285, y: 92, w: 200, h: 18,
                props: { text: 'TOTAL COMPLETED', fontSize: 11, fontWeight: 'bold', color: '#64748b' }
            },
            {
                id: `s1_kpi2_v_${ts}`, type: 'TEXT',
                x: 285, y: 112, w: 200, h: 36,
                props: { text: '682 Units', fontSize: 22, fontWeight: 'bold', color: '#16a34a' }
            },
            {
                id: `s1_kpi3_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 520, y: 80, w: 230, h: 80,
                props: { backgroundColor: '#ffffff', borderRadius: 8, borderColor: '#e2e8f0', borderWidth: 1 }
            },
            {
                id: `s1_kpi3_l_${ts}`, type: 'TEXT',
                x: 535, y: 92, w: 200, h: 18,
                props: { text: 'ACTIVE BACKLOG', fontSize: 11, fontWeight: 'bold', color: '#64748b' }
            },
            {
                id: `s1_kpi3_v_${ts}`, type: 'TEXT',
                x: 535, y: 112, w: 200, h: 36,
                props: { text: '42 Units', fontSize: 22, fontWeight: 'bold', color: '#ea580c' }
            },
            {
                id: `s1_kpi4_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 770, y: 80, w: 210, h: 80,
                props: { backgroundColor: '#ffffff', borderRadius: 8, borderColor: '#e2e8f0', borderWidth: 1 }
            },
            {
                id: `s1_kpi4_l_${ts}`, type: 'TEXT',
                x: 785, y: 92, w: 180, h: 18,
                props: { text: 'PLANT DOWNTIME', fontSize: 11, fontWeight: 'bold', color: '#64748b' }
            },
            {
                id: `s1_kpi4_v_${ts}`, type: 'TEXT',
                x: 785, y: 112, w: 180, h: 36,
                props: { text: '2.4 Hours', fontSize: 22, fontWeight: 'bold', color: '#dc2626' }
            },
            // Cell Status Table
            {
                id: `s1_tbl_lbl_${ts}`, type: 'TEXT',
                x: 20, y: 180, w: 460, h: 24,
                props: { text: '📊 Production Cell Performance', fontSize: 14, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `s1_cells_tbl_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 210, w: 460, h: 280,
                props: { tableId: T.cells, limit: 6 }
            },
            // Downtime & Orders Table
            {
                id: `s1_dt_lbl_${ts}`, type: 'TEXT',
                x: 510, y: 180, w: 470, h: 24,
                props: { text: '⚠️ Recent Downtime Events & Pareto', fontSize: 14, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `s1_dt_tbl_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 510, y: 210, w: 470, h: 280,
                props: { tableId: T.downtime, limit: 6 }
            }
        ]
    };

    // Step 2: Shopfloor Data Entry Mode
    const step2 = {
        id: `s2_${ts}`,
        title: '2. Shopfloor Data Entry',
        stepType: 'Step',
        components: [
            {
                id: `s2_bg_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 1000, h: 64,
                props: { backgroundColor: '#1e293b', borderRadius: 0 }
            },
            {
                id: `s2_hdr_${ts}`, type: 'TEXT',
                x: 20, y: 16, w: 600, h: 32,
                props: { text: '📝 Shopfloor Production & Downtime Data Entry', fontSize: 20, fontWeight: 'bold', color: 'white' }
            },
            {
                id: `s2_btn_back_${ts}`, type: 'BUTTON',
                x: 780, y: 14, w: 200, h: 38,
                props: {
                    label: '◀ BACK TO DASHBOARD', text: '◀ BACK TO DASHBOARD', backgroundColor: '#475569', color: 'white', fontSize: 12, fontWeight: 'bold',
                    triggers: [{ name: 'GotoDash', event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }]
                }
            },
            // Left Card: Log Cell Output
            {
                id: `s2_c1_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 40, y: 85, w: 440, h: 420,
                props: { backgroundColor: '#ffffff', borderRadius: 12, borderColor: '#cbd5e1', borderWidth: 1 }
            },
            {
                id: `s2_c1_t_${ts}`, type: 'TEXT',
                x: 60, y: 105, w: 400, h: 26,
                props: { text: '📦 Update Cell Production Count', fontSize: 16, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `s2_cell_inp_${ts}`, type: 'TEXT_INPUT',
                x: 60, y: 145, w: 400, h: 48,
                props: { label: 'Production Cell Name', placeholder: 'Rotor Assembly', targetVariable: 'Cell_Selected', required: true }
            },
            {
                id: `s2_tgt_inp_${ts}`, type: 'TEXT_INPUT',
                x: 60, y: 205, w: 190, h: 48,
                props: { label: 'Target Units', placeholder: '120', inputType: 'number', targetVariable: 'Cell_Target' }
            },
            {
                id: `s2_cmp_inp_${ts}`, type: 'TEXT_INPUT',
                x: 270, y: 205, w: 190, h: 48,
                props: { label: 'Completed Units', placeholder: '114', inputType: 'number', targetVariable: 'Cell_Completed' }
            },
            {
                id: `s2_def_inp_${ts}`, type: 'TEXT_INPUT',
                x: 60, y: 265, w: 400, h: 48,
                props: { label: 'Defect Units', placeholder: '2', inputType: 'number', targetVariable: 'Cell_Defects' }
            },
            {
                id: `s2_save_cell_btn_${ts}`, type: 'BUTTON',
                x: 60, y: 340, w: 400, h: 50,
                props: {
                    label: 'SUBMIT CELL RECORD ✅', text: 'SUBMIT CELL RECORD ✅', backgroundColor: '#16a34a', color: 'white', fontSize: 13, fontWeight: 'bold',
                    triggers: [
                        {
                            name: 'SaveCell',
                            event: 'ON_CLICK',
                            actions: [
                                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_cell_${ts}` } },
                                { type: 'SHOW_MESSAGE', payload: { message: '✅ Data Cell berhasil disimpan!', msgType: 'success' } }
                            ]
                        }
                    ]
                }
            },
            // Right Card: Log Downtime Event
            {
                id: `s2_c2_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 520, y: 85, w: 440, h: 420,
                props: { backgroundColor: '#ffffff', borderRadius: 12, borderColor: '#cbd5e1', borderWidth: 1 }
            },
            {
                id: `s2_c2_t_${ts}`, type: 'TEXT',
                x: 540, y: 105, w: 400, h: 26,
                props: { text: '⚠️ Log Station Downtime Event', fontSize: 16, fontWeight: 'bold', color: '#991b1b' }
            },
            {
                id: `s2_dt_stn_${ts}`, type: 'TEXT_INPUT',
                x: 540, y: 145, w: 400, h: 48,
                props: { label: 'Station / Line Name', placeholder: 'Housing Line', targetVariable: 'Downtime_Station', required: true }
            },
            {
                id: `s2_dt_rsn_${ts}`, type: 'TEXT_INPUT',
                x: 540, y: 205, w: 400, h: 48,
                props: { label: 'Downtime Root Cause Reason', placeholder: 'Tool Breakdown', targetVariable: 'Downtime_Reason', required: true }
            },
            {
                id: `s2_dt_min_${ts}`, type: 'TEXT_INPUT',
                x: 540, y: 265, w: 400, h: 48,
                props: { label: 'Duration (Minutes)', placeholder: '45', inputType: 'number', targetVariable: 'Downtime_Minutes', required: true }
            },
            {
                id: `s2_save_dt_btn_${ts}`, type: 'BUTTON',
                x: 540, y: 340, w: 400, h: 50,
                props: {
                    label: 'LOG DOWNTIME EVENT ⚠️', text: 'LOG DOWNTIME EVENT ⚠️', backgroundColor: '#dc2626', color: 'white', fontSize: 13, fontWeight: 'bold',
                    triggers: [
                        {
                            name: 'SaveDt',
                            event: 'ON_CLICK',
                            actions: [
                                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_dt_${ts}` } },
                                { type: 'SHOW_MESSAGE', payload: { message: '⚠️ Event Downtime dicatat!', msgType: 'warning' } }
                            ]
                        }
                    ]
                }
            }
        ]
    };

    return {
        id: `app_plant_dashboard_${ts}`,
        name: 'Tulip Production Plant Dashboard & Cell Tracker',
        description: 'Complete Tulip-style plant production dashboard with 6-cell status tracking, Top KPIs, Cell Loading, Downtime Pareto analytics, and live shopfloor input form.',
        category: 'MES Production Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables,
            recordPlaceholders: [
                {
                    id: `rp_cell_${ts}`,
                    name: 'Production Cell Record',
                    tableId: T.cells,
                    fieldMappings: {
                        'Cell_Name': 'Cell_Selected',
                        'Target_Units': 'Cell_Target',
                        'Complete_Units': 'Cell_Completed',
                        'Defect_Units': 'Cell_Defects'
                    }
                },
                {
                    id: `rp_dt_${ts}`,
                    name: 'Downtime Event Record',
                    tableId: T.downtime,
                    fieldMappings: {
                        'Station_Name': 'Downtime_Station',
                        'Reason': 'Downtime_Reason',
                        'Duration_Minutes': 'Downtime_Minutes'
                    }
                }
            ],
            appTables: [T.cells, T.downtime, T.orders],
            appTriggers: [],
            steps: [step1, step2]
        }
    };
}
