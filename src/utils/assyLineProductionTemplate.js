/**
 * assyLineProductionTemplate.js
 * Assembly Line Production with MULTI-TABLE linked records:
 *   1. Production_Orders (master) → linked to Counts, Downtime, Notes
 *   2. Production_Counts (parts/defects per interval)
 *   3. Downtime_Events (each downtime logged)
 *   4. Production_Notes (operator notes)
 */
export function createAssyLineProductionTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    // Table placeholder IDs (replaced with real UUIDs on install)
    const T = {
        orders: 'tbl_prod_orders',
        counts: 'tbl_prod_counts',
        downtime: 'tbl_prod_downtime',
        notes: 'tbl_prod_notes'
    };

    const appVariables = [
        { id: `v1_${ts}`, name: 'Work_Order_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Target_Qty', type: 'number', defaultValue: 0, persisted: true },
        { id: `v3_${ts}`, name: 'Parts_Made', type: 'number', defaultValue: 0, persisted: true },
        { id: `v4_${ts}`, name: 'Defects', type: 'number', defaultValue: 0, persisted: true },
        { id: `v5_${ts}`, name: 'Ideal_Run_Rate', type: 'number', defaultValue: 50, persisted: false },
        { id: `v6_${ts}`, name: 'Machine_ID', type: 'string', defaultValue: 'CT-MACHINE-1', persisted: false },
        { id: `v7_${ts}`, name: 'Machine_Status', type: 'string', defaultValue: 'Running', persisted: false },
        { id: `v8_${ts}`, name: 'Downtime_Reason', type: 'string', defaultValue: '', persisted: true },
        { id: `v9_${ts}`, name: 'Fault_Code', type: 'string', defaultValue: '', persisted: false },
        { id: `v10_${ts}`, name: 'Waste_Code', type: 'string', defaultValue: '', persisted: false },
        { id: `v11_${ts}`, name: 'Article', type: 'string', defaultValue: '', persisted: false },
        { id: `v12_${ts}`, name: 'Quality_Pct', type: 'number', defaultValue: 0, persisted: false },
        { id: `v13_${ts}`, name: 'Uptime_Pct', type: 'number', defaultValue: 0, persisted: false },
        { id: `v14_${ts}`, name: 'Shift', type: 'string', defaultValue: 'Day', persisted: true },
        { id: `v15_${ts}`, name: 'Line_Assy', type: 'string', defaultValue: '', persisted: true },
        { id: `v16_${ts}`, name: 'Operator', type: 'string', defaultValue: '@APP_INFO.USER', persisted: true },
        { id: `v17_${ts}`, name: 'Timestamp', type: 'string', defaultValue: '', persisted: false },
        { id: `v18_${ts}`, name: 'Downtime_Minutes', type: 'number', defaultValue: 0, persisted: true },
        { id: `v19_${ts}`, name: 'Status_Produksi', type: 'string', defaultValue: 'IN_PROGRESS', persisted: true },
        { id: `v20_${ts}`, name: 'Note_Text', type: 'string', defaultValue: '', persisted: false },
        { id: `v21_${ts}`, name: 'Count_Interval', type: 'string', defaultValue: '', persisted: false },
        { id: `v22_${ts}`, name: 'Interval_Parts', type: 'number', defaultValue: 0, persisted: false },
        { id: `v23_${ts}`, name: 'Interval_Defects', type: 'number', defaultValue: 0, persisted: false }
    ];

    // Step 1: Work Order Setup
    const step1 = {
        id: `st1_${ts}`, title: '1. Work Order Setup', stepType: 'Step',
        components: [
            { id: `s1h_${ts}`, type: 'TEXT', x: 50, y: 20, w: 900, h: 50, props: { text: '🏭 Assembly Line Production', fontSize: 28, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' } },
            { id: `s1s_${ts}`, type: 'TEXT', x: 50, y: 70, w: 900, h: 25, props: { text: 'Multi-table production tracking with linked records', fontSize: 14, color: '#64748b', textAlign: 'center' } },
            { id: `s1bc_${ts}`, type: 'BARCODE_SCANNER', x: 200, y: 120, w: 600, h: 60, props: { placeholder: 'Scan Work Order barcode...', autoFocus: true, targetVariable: 'Work_Order_ID' } },
            { id: `s1l_${ts}`, type: 'TEXT_INPUT', x: 200, y: 200, w: 280, h: 50, props: { label: 'Assembly Line', placeholder: 'LINE-A1', targetVariable: 'Line_Assy', required: true } },
            { id: `s1sh_${ts}`, type: 'TEXT_INPUT', x: 520, y: 200, w: 280, h: 50, props: { label: 'Shift', placeholder: 'Day / Night', targetVariable: 'Shift' } },
            { id: `s1t_${ts}`, type: 'TEXT_INPUT', x: 200, y: 280, w: 280, h: 50, props: { label: 'Target Quantity', placeholder: '670', targetVariable: 'Target_Qty', inputType: 'number', required: true } },
            { id: `s1r_${ts}`, type: 'TEXT_INPUT', x: 520, y: 280, w: 280, h: 50, props: { label: 'Ideal Run Rate', placeholder: '50', targetVariable: 'Ideal_Run_Rate', inputType: 'number' } },
            { id: `s1m_${ts}`, type: 'TEXT_INPUT', x: 200, y: 360, w: 280, h: 50, props: { label: 'Machine ID', placeholder: 'CT-MACHINE-1', targetVariable: 'Machine_ID' } },
            { id: `s1a_${ts}`, type: 'TEXT_INPUT', x: 520, y: 360, w: 280, h: 50, props: { label: 'Article', placeholder: 'ARTICLE1', targetVariable: 'Article' } },
            { id: `s1b_${ts}`, type: 'BUTTON', x: 200, y: 450, w: 600, h: 60, props: {
                label: 'START PRODUCTION ▶', text: 'START PRODUCTION ▶',
                backgroundColor: '#dc2626', color: 'white', fontSize: 18, fontWeight: 'bold',
                triggers: [{ name: 'Start', event: 'ON_CLICK', actions: [
                    { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_order_${ts}` } },
                    { type: 'SHOW_MESSAGE', payload: { message: '📋 Work Order created in Production_Orders table', msgType: 'success' } },
                    { type: 'NEXT_STEP' }
                ] }]
            } }
        ]
    };

    // Step 2: Machine Terminal Dashboard
    const step2 = {
        id: `st2_${ts}`, title: '2. Machine Terminal', stepType: 'Step',
        components: [
            { id: `s2h_${ts}`, type: 'TEXT', x: 0, y: 0, w: 1000, h: 32, props: { text: '🏭 Machine Terminal', fontSize: 20, fontWeight: 'bold', color: '#dc2626' } },
            // Work Order info
            { id: `s2wl_${ts}`, type: 'TEXT', x: 0, y: 38, w: 160, h: 18, props: { text: 'Work Order ID:', fontSize: 12, fontWeight: 'bold', color: '#0f172a' } },
            { id: `s2wv_${ts}`, type: 'TEXT_INPUT', x: 160, y: 34, w: 280, h: 28, props: { label: '', targetVariable: 'Work_Order_ID', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Work_Order_ID', fontSize: 13, fontWeight: 'bold' } },
            { id: `s2tl_${ts}`, type: 'TEXT', x: 0, y: 66, w: 160, h: 18, props: { text: 'Target qty:', fontSize: 12, fontWeight: 'bold', color: '#0f172a' } },
            { id: `s2tv_${ts}`, type: 'TEXT_INPUT', x: 160, y: 62, w: 280, h: 28, props: { label: '', targetVariable: 'Target_Qty', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Target_Qty', fontSize: 16, fontWeight: 'bold' } },
            // Counters
            { id: `s2pl_${ts}`, type: 'TEXT', x: 490, y: 34, w: 130, h: 16, props: { text: 'Parts made', fontSize: 11, fontWeight: 'bold', color: '#334155', textAlign: 'center' } },
            { id: `s2pv_${ts}`, type: 'TEXT_INPUT', x: 490, y: 50, w: 130, h: 38, props: { label: '', targetVariable: 'Parts_Made', inputType: 'number', fontSize: 26, fontWeight: 'bold', textAlign: 'center' } },
            { id: `s2pb_${ts}`, type: 'BUTTON', x: 500, y: 90, w: 110, h: 26, props: { label: 'Add', text: 'Add', backgroundColor: '#16a34a', color: 'white', fontSize: 11, fontWeight: 'bold',
                triggers: [{ name: 'AddPart', event: 'ON_CLICK', actions: [{ type: 'SET_VARIABLE', payload: { variable: 'Parts_Made', valueType: 'EXPRESSION', value: 'Number(@Parts_Made) + 1' } }] }] } },
            { id: `s2dl_${ts}`, type: 'TEXT', x: 650, y: 34, w: 130, h: 16, props: { text: 'Defects', fontSize: 11, fontWeight: 'bold', color: '#334155', textAlign: 'center' } },
            { id: `s2dv_${ts}`, type: 'TEXT_INPUT', x: 650, y: 50, w: 130, h: 38, props: { label: '', targetVariable: 'Defects', inputType: 'number', fontSize: 26, fontWeight: 'bold', textAlign: 'center' } },
            { id: `s2db_${ts}`, type: 'BUTTON', x: 660, y: 90, w: 110, h: 26, props: { label: 'Add', text: 'Add', backgroundColor: '#dc2626', color: 'white', fontSize: 11, fontWeight: 'bold',
                triggers: [{ name: 'AddDefect', event: 'ON_CLICK', actions: [{ type: 'SET_VARIABLE', payload: { variable: 'Defects', valueType: 'EXPRESSION', value: 'Number(@Defects) + 1' } }] }] } },
            { id: `s2rl_${ts}`, type: 'TEXT', x: 810, y: 34, w: 120, h: 16, props: { text: 'Run rate', fontSize: 11, fontWeight: 'bold', color: '#334155', textAlign: 'center' } },
            { id: `s2rv_${ts}`, type: 'TEXT_INPUT', x: 810, y: 50, w: 120, h: 38, props: { label: '', targetVariable: 'Ideal_Run_Rate', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Ideal_Run_Rate', fontSize: 22, fontWeight: 'bold', textAlign: 'center' } },

            // Machine Info
            { id: `s2mh_${ts}`, type: 'TEXT', x: 0, y: 128, w: 300, h: 20, props: { text: '🖥️ Machine Info', fontSize: 13, fontWeight: 'bold', color: '#1e293b' } },
            { id: `s2mi_${ts}`, type: 'TEXT_INPUT', x: 0, y: 150, w: 140, h: 28, props: { label: 'Machine', targetVariable: 'Machine_ID', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Machine_ID', fontSize: 12 } },
            { id: `s2ms_${ts}`, type: 'TEXT_INPUT', x: 150, y: 150, w: 140, h: 28, props: { label: 'Status', targetVariable: 'Machine_Status', fontSize: 12 } },
            { id: `s2fc_${ts}`, type: 'TEXT_INPUT', x: 0, y: 185, w: 140, h: 28, props: { label: 'Fault Code', targetVariable: 'Fault_Code', placeholder: 'FCODE1', fontSize: 12 } },
            { id: `s2wc_${ts}`, type: 'TEXT_INPUT', x: 150, y: 185, w: 140, h: 28, props: { label: 'Waste Code', targetVariable: 'Waste_Code', placeholder: 'WCODE1', fontSize: 12 } },

            // Quality & Uptime KPIs
            { id: `s2ql_${ts}`, type: 'TEXT', x: 0, y: 225, w: 140, h: 14, props: { text: 'Quality', fontSize: 12, fontWeight: 'bold', color: '#334155', textAlign: 'center' } },
            { id: `s2qv_${ts}`, type: 'TEXT_INPUT', x: 0, y: 240, w: 140, h: 45, props: { label: '', targetVariable: 'Quality_Pct', inputType: 'number', placeholder: '79.7%', fontSize: 28, fontWeight: 'bold', textAlign: 'center' } },
            { id: `s2ul_${ts}`, type: 'TEXT', x: 150, y: 225, w: 140, h: 14, props: { text: 'Uptime', fontSize: 12, fontWeight: 'bold', color: '#334155', textAlign: 'center' } },
            { id: `s2uv_${ts}`, type: 'TEXT_INPUT', x: 150, y: 240, w: 140, h: 45, props: { label: '', targetVariable: 'Uptime_Pct', inputType: 'number', placeholder: '88.2%', fontSize: 28, fontWeight: 'bold', textAlign: 'center' } },

            // ── Right: Log Count Interval (→ Production_Counts table) ──
            { id: `s2ch_${ts}`, type: 'TEXT', x: 320, y: 128, w: 350, h: 20, props: { text: '📊 Log Count Interval → Production_Counts', fontSize: 12, fontWeight: 'bold', color: '#1e40af' } },
            { id: `s2ci_${ts}`, type: 'TEXT_INPUT', x: 320, y: 152, w: 200, h: 35, props: { label: 'Interval (e.g. 09:00-10:00)', targetVariable: 'Count_Interval', fontSize: 12 } },
            { id: `s2cp_${ts}`, type: 'TEXT_INPUT', x: 530, y: 152, w: 100, h: 35, props: { label: 'Parts', targetVariable: 'Interval_Parts', inputType: 'number', fontSize: 12 } },
            { id: `s2cd_${ts}`, type: 'TEXT_INPUT', x: 640, y: 152, w: 100, h: 35, props: { label: 'Defects', targetVariable: 'Interval_Defects', inputType: 'number', fontSize: 12 } },
            { id: `s2cb_${ts}`, type: 'BUTTON', x: 760, y: 157, w: 170, h: 30, props: { label: '💾 Save Count', text: '💾 Save Count', backgroundColor: '#2563eb', color: 'white', fontSize: 12, fontWeight: 'bold',
                triggers: [{ name: 'SaveCount', event: 'ON_CLICK', actions: [
                    { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_count_${ts}` } },
                    { type: 'SHOW_MESSAGE', payload: { message: '📊 Count interval saved to Production_Counts', msgType: 'success' } }
                ] }] } },

            // ── Right: Log Downtime (→ Downtime_Events table) ──
            { id: `s2dh_${ts}`, type: 'TEXT', x: 320, y: 200, w: 350, h: 20, props: { text: '⏱️ Log Downtime → Downtime_Events', fontSize: 12, fontWeight: 'bold', color: '#dc2626' } },
            { id: `s2dr_${ts}`, type: 'TEXT_INPUT', x: 320, y: 224, w: 260, h: 35, props: { label: 'Reason', targetVariable: 'Downtime_Reason', placeholder: 'Machine maintenance', fontSize: 12 } },
            { id: `s2dm_${ts}`, type: 'TEXT_INPUT', x: 590, y: 224, w: 100, h: 35, props: { label: 'Minutes', targetVariable: 'Downtime_Minutes', inputType: 'number', fontSize: 12 } },
            { id: `s2dsb_${ts}`, type: 'BUTTON', x: 700, y: 229, w: 230, h: 30, props: { label: '🔴 Save Downtime', text: '🔴 Save Downtime', backgroundColor: '#dc2626', color: 'white', fontSize: 12, fontWeight: 'bold',
                triggers: [{ name: 'SaveDT', event: 'ON_CLICK', actions: [
                    { type: 'SET_VARIABLE', payload: { variable: 'Machine_Status', value: 'Stopped' } },
                    { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_downtime_${ts}` } },
                    { type: 'SHOW_MESSAGE', payload: { message: '⏱️ Downtime event saved to Downtime_Events', msgType: 'error' } }
                ] }] } },

            // ── Right: Add Note (→ Production_Notes table) ──
            { id: `s2nh_${ts}`, type: 'TEXT', x: 320, y: 275, w: 350, h: 20, props: { text: '📝 Add Note → Production_Notes', fontSize: 12, fontWeight: 'bold', color: '#334155' } },
            { id: `s2nt_${ts}`, type: 'TEXT_INPUT', x: 320, y: 298, w: 420, h: 35, props: { label: 'Note', targetVariable: 'Note_Text', placeholder: 'Enter note...', fontSize: 12 } },
            { id: `s2nb_${ts}`, type: 'BUTTON', x: 750, y: 303, w: 180, h: 30, props: { label: '📝 Save Note', text: '📝 Save Note', backgroundColor: '#475569', color: 'white', fontSize: 12, fontWeight: 'bold',
                triggers: [{ name: 'SaveNote', event: 'ON_CLICK', actions: [
                    { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_note_${ts}` } },
                    { type: 'SHOW_MESSAGE', payload: { message: '📝 Note saved to Production_Notes', msgType: 'success' } },
                    { type: 'SET_VARIABLE', payload: { variable: 'Note_Text', value: '' } }
                ] }] } },

            // Bottom action buttons
            { id: `s2bm_${ts}`, type: 'BUTTON', x: 0, y: 355, w: 230, h: 45, props: { label: '📈 Calc Quality', text: '📈 Calc Quality', backgroundColor: '#2563eb', color: 'white', fontSize: 13, fontWeight: 'bold',
                triggers: [{ name: 'CalcQ', event: 'ON_CLICK', actions: [
                    { type: 'SET_VARIABLE', payload: { variable: 'Quality_Pct', valueType: 'EXPRESSION', value: 'Number(@Parts_Made) > 0 ? Number(((Number(@Parts_Made) - Number(@Defects)) / Number(@Parts_Made) * 100).toFixed(1)) : 0' } },
                    { type: 'SHOW_MESSAGE', payload: { message: '📊 Quality KPI updated', msgType: 'success' } }
                ] }] } },
            { id: `s2bf_${ts}`, type: 'BUTTON', x: 740, y: 355, w: 200, h: 45, props: { label: 'Finish Production →', text: 'Finish Production →', backgroundColor: '#1e293b', color: 'white', fontSize: 13, fontWeight: 'bold',
                triggers: [{ name: 'Finish', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }] } }
        ]
    };

    // Step 3: Review & Submit
    const step3 = {
        id: `st3_${ts}`, title: '3. Production Summary', stepType: 'Step',
        components: [
            { id: `s3h_${ts}`, type: 'TEXT', x: 50, y: 15, w: 900, h: 40, props: { text: '📋 Production Summary', fontSize: 26, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' } },
            { id: `s3i_${ts}`, type: 'TEXT', x: 50, y: 55, w: 900, h: 20, props: { text: 'Data saved across 4 linked tables: Orders ↔ Counts ↔ Downtime ↔ Notes', fontSize: 12, color: '#64748b', textAlign: 'center' } },
            { id: `s3wo_${ts}`, type: 'TEXT_INPUT', x: 50, y: 90, w: 280, h: 42, props: { label: 'Work Order', targetVariable: 'Work_Order_ID', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Work_Order_ID' } },
            { id: `s3ln_${ts}`, type: 'TEXT_INPUT', x: 350, y: 90, w: 280, h: 42, props: { label: 'Line', targetVariable: 'Line_Assy', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Line_Assy' } },
            { id: `s3sf_${ts}`, type: 'TEXT_INPUT', x: 650, y: 90, w: 250, h: 42, props: { label: 'Shift', targetVariable: 'Shift', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Shift' } },
            { id: `s3rt_${ts}`, type: 'TEXT', x: 50, y: 150, w: 900, h: 20, props: { text: '📊 Results', fontSize: 14, fontWeight: 'bold', color: '#1e40af' } },
            { id: `s3tq_${ts}`, type: 'TEXT_INPUT', x: 50, y: 175, w: 200, h: 42, props: { label: 'Target', targetVariable: 'Target_Qty', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Target_Qty' } },
            { id: `s3pm_${ts}`, type: 'TEXT_INPUT', x: 270, y: 175, w: 200, h: 42, props: { label: 'Parts Made', targetVariable: 'Parts_Made', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Parts_Made' } },
            { id: `s3df_${ts}`, type: 'TEXT_INPUT', x: 490, y: 175, w: 200, h: 42, props: { label: 'Defects', targetVariable: 'Defects', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Defects' } },
            { id: `s3qp_${ts}`, type: 'TEXT_INPUT', x: 710, y: 175, w: 190, h: 42, props: { label: 'Quality %', targetVariable: 'Quality_Pct', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Quality_Pct' } },
            { id: `s3st_${ts}`, type: 'RADIO_GROUP', x: 50, y: 240, w: 850, h: 60, props: { label: 'Status', options: ['COMPLETED', 'PARTIAL', 'STOPPED'], required: true, targetVariable: 'Status_Produksi' } },
            { id: `s3sb_${ts}`, type: 'BUTTON', x: 200, y: 330, w: 600, h: 60, props: {
                label: '✅ SUBMIT PRODUCTION', text: '✅ SUBMIT PRODUCTION',
                backgroundColor: '#16a34a', color: 'white', fontSize: 20, fontWeight: 'bold',
                triggers: [{ name: 'Submit', event: 'ON_CLICK', actions: [
                    { type: 'SET_VARIABLE', payload: { variable: 'Timestamp', valueType: 'EXPRESSION', value: 'new Date().toISOString()' } },
                    { type: 'SET_VARIABLE', payload: { variable: 'Quality_Pct', valueType: 'EXPRESSION', value: 'Number(@Parts_Made) > 0 ? Number(((Number(@Parts_Made) - Number(@Defects)) / Number(@Parts_Made) * 100).toFixed(1)) : 0' } },
                    { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_order_final_${ts}` } },
                    { type: 'SHOW_MESSAGE', payload: { message: '✅ Production result saved across all linked tables!', msgType: 'success' } },
                    { type: 'COMPLETE_APP' }
                ] }]
            } }
        ]
    };

    return {
        id: `app_prod_${ts}`,
        name: 'Assembly Line Production',
        description: 'Multi-table Machine Terminal with linked records: Production Orders ↔ Counts ↔ Downtime Events ↔ Notes',
        category: 'Production',
        type: 'FRONT-LINE',
        published: true, approvalStatus: 'APPROVED',
        createdAt: iso, updatedAt: iso,
        config: {
            appVariables,
            recordPlaceholders: [
                { id: `rp_order_${ts}`, name: 'Order_Record', tableId: T.orders, description: 'Production order master record' },
                { id: `rp_count_${ts}`, name: 'Count_Record', tableId: T.counts, description: 'Hourly count interval' },
                { id: `rp_downtime_${ts}`, name: 'Downtime_Record', tableId: T.downtime, description: 'Downtime event' },
                { id: `rp_note_${ts}`, name: 'Note_Record', tableId: T.notes, description: 'Operator note' },
                { id: `rp_order_final_${ts}`, name: 'Order_Final', tableId: T.orders, description: 'Final order update' }
            ],
            appTables: [T.orders, T.counts, T.downtime, T.notes],
            appTriggers: [{ id: `trg_${ts}`, name: 'Production Start', event: 'ON_APP_START', actions: [{ type: 'SHOW_MESSAGE', payload: { message: '🏭 Multi-Table Production Terminal Ready', msgType: 'info' } }] }],
            steps: [step1, step2, step3],
            // Multi-table schema metadata for reference
            linkedTables: {
                orders: { placeholder: T.orders, description: 'Master work order' },
                counts: { placeholder: T.counts, description: 'Count intervals linked to order', linkedTo: T.orders },
                downtime: { placeholder: T.downtime, description: 'Downtime events linked to order', linkedTo: T.orders },
                notes: { placeholder: T.notes, description: 'Production notes linked to order', linkedTo: T.orders }
            }
        }
    };
}
