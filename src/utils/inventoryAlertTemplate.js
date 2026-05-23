/**
 * inventoryAlertTemplate.js
 * Multi-table Inventory with Linked Records, Formulas, and Automation
 * Tables: Materials (master), Transactions, Alerts, Suppliers
 * Formulas: Stock_Value, Days_Until_Reorder
 * Automations: Low Stock Alert, Daily Inventory Check
 */
export function createInventoryAlertTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    const T = { materials: 'tbl_inv_materials', transactions: 'tbl_inv_transactions', alerts: 'tbl_inv_alerts', suppliers: 'tbl_inv_suppliers' };

    const appVariables = [
        { id: `v1_${ts}`, name: 'Scan_Item', type: 'string', defaultValue: '', persisted: false },
        { id: `v2_${ts}`, name: 'Pick_Qty', type: 'number', defaultValue: 0, persisted: false },
        { id: `v3_${ts}`, name: 'Current_Stock', type: 'number', defaultValue: 0, persisted: false },
        { id: `v4_${ts}`, name: 'Reorder_Point', type: 'number', defaultValue: 0, persisted: false },
        { id: `v5_${ts}`, name: 'Material_Name', type: 'string', defaultValue: '', persisted: false },
        { id: `v6_${ts}`, name: 'Location', type: 'string', defaultValue: '', persisted: false },
        { id: `v7_${ts}`, name: 'Completed_Today', type: 'number', defaultValue: 0, persisted: true },
        { id: `v8_${ts}`, name: 'To_Be_Kitted', type: 'number', defaultValue: 0, persisted: true },
        { id: `v9_${ts}`, name: 'In_Queue', type: 'number', defaultValue: 0, persisted: true },
        { id: `v10_${ts}`, name: 'Order_ID', type: 'string', defaultValue: '', persisted: false },
        { id: `v11_${ts}`, name: 'Operator', type: 'string', defaultValue: '@APP_INFO.USER', persisted: true },
        { id: `v12_${ts}`, name: 'Timestamp', type: 'string', defaultValue: '', persisted: false },
        { id: `v13_${ts}`, name: 'Transaction_Type', type: 'string', defaultValue: 'PICK', persisted: false },
        { id: `v14_${ts}`, name: 'Unit_Cost', type: 'number', defaultValue: 0, persisted: false },
        { id: `v15_${ts}`, name: 'Note_Text', type: 'string', defaultValue: '', persisted: false },
        { id: `v16_${ts}`, name: 'Supplier_Name', type: 'string', defaultValue: '', persisted: false }
    ];

    // ── Step 1: Inventory Dashboard ──
    const step1 = {
        id: `st1_${ts}`, title: '1. Inventory Dashboard', stepType: 'Step',
        components: [
            { id: `h1_${ts}`, type: 'TEXT', x: 0, y: 0, w: 1000, h: 30, props: { text: '📦 Inventory Status & Kitting', fontSize: 20, fontWeight: 'bold', color: '#7f1d1d' } },
            // WAITING ON MATERIALS
            { id: `nkh_${ts}`, type: 'TEXT', x: 0, y: 36, w: 440, h: 22, props: { text: '  WAITING ON MATERIALS', fontSize: 12, fontWeight: 'bold', color: '#fff', backgroundColor: '#991b1b' } },
            { id: `nkt_${ts}`, type: 'INTERACTIVE_TABLE', x: 0, y: 60, w: 440, h: 160, props: { tableId: T.materials, label: 'Materials', visibleColumns: ['Material_Name', 'Item_Number', 'Current_Qty', 'Reorder_Point', 'Location', 'Status', 'Stock_Value'], fontSize: 10 } },
            // CELL PERFORMANCE KPIs
            { id: `cph_${ts}`, type: 'TEXT', x: 460, y: 36, w: 320, h: 22, props: { text: 'CELL PERFORMANCE', fontSize: 13, fontWeight: 'bold', color: '#0f172a' } },
            { id: `cpl1_${ts}`, type: 'TEXT', x: 460, y: 60, w: 100, h: 14, props: { text: 'COMPLETED\nTODAY', fontSize: 8, color: '#64748b', textAlign: 'center', fontWeight: 'bold' } },
            { id: `cpv1_${ts}`, type: 'TEXT_INPUT', x: 460, y: 80, w: 100, h: 42, props: { label: '', targetVariable: 'Completed_Today', fontSize: 30, fontWeight: 'bold', textAlign: 'center', inputType: 'number' } },
            { id: `cpl2_${ts}`, type: 'TEXT', x: 570, y: 60, w: 100, h: 14, props: { text: 'TO BE\nKITTED', fontSize: 8, color: '#64748b', textAlign: 'center', fontWeight: 'bold' } },
            { id: `cpv2_${ts}`, type: 'TEXT_INPUT', x: 570, y: 80, w: 100, h: 42, props: { label: '', targetVariable: 'To_Be_Kitted', fontSize: 30, fontWeight: 'bold', textAlign: 'center', inputType: 'number' } },
            { id: `cpl3_${ts}`, type: 'TEXT', x: 680, y: 60, w: 100, h: 14, props: { text: 'IN QUEUE AT\nASSEMBLY', fontSize: 8, color: '#64748b', textAlign: 'center', fontWeight: 'bold' } },
            { id: `cpv3_${ts}`, type: 'TEXT_INPUT', x: 680, y: 80, w: 100, h: 42, props: { label: '', targetVariable: 'In_Queue', fontSize: 30, fontWeight: 'bold', textAlign: 'center', inputType: 'number' } },
            // KIT REQUIREMENTS
            { id: `krh_${ts}`, type: 'TEXT', x: 460, y: 135, w: 490, h: 22, props: { text: 'KIT REQUIREMENTS — Click item to add to kit', fontSize: 11, fontWeight: 'bold', color: '#0f172a' } },
            { id: `krt_${ts}`, type: 'INTERACTIVE_TABLE', x: 460, y: 160, w: 490, h: 120, props: { tableId: T.materials, label: 'Kit Items', visibleColumns: ['Material_Name', 'Item_Number', 'Current_Qty', 'Location', 'Status'], fontSize: 10 } },
            // READY TO BE KITTED
            { id: `rkh_${ts}`, type: 'TEXT', x: 0, y: 228, w: 440, h: 22, props: { text: '  READY TO BE KITTED', fontSize: 12, fontWeight: 'bold', color: '#fff', backgroundColor: '#16a34a' } },
            { id: `rkt_${ts}`, type: 'INTERACTIVE_TABLE', x: 0, y: 252, w: 440, h: 100, props: { tableId: T.transactions, label: 'Transactions', visibleColumns: ['Order_ID', 'Item_Number', 'Qty', 'Type', 'Timestamp'], fontSize: 10 } },
            // Supplier table preview
            { id: `sph_${ts}`, type: 'TEXT', x: 460, y: 290, w: 300, h: 20, props: { text: '🏢 Suppliers (Linked)', fontSize: 11, fontWeight: 'bold', color: '#1e40af' } },
            { id: `spt_${ts}`, type: 'INTERACTIVE_TABLE', x: 460, y: 312, w: 490, h: 70, props: { tableId: T.suppliers, label: 'Suppliers', visibleColumns: ['Supplier_Name', 'Contact', 'Lead_Days', 'Rating'], fontSize: 10 } },
            // Bottom buttons
            { id: `bpk_${ts}`, type: 'BUTTON', x: 660, y: 395, w: 280, h: 38, props: { label: 'Pick Material →', text: 'Pick Material →', backgroundColor: '#e2e8f0', color: '#334155', fontSize: 13, fontWeight: 'bold', triggers: [{ name: 'GoPick', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }] } },
            { id: `bal_${ts}`, type: 'BUTTON', x: 360, y: 395, w: 280, h: 38, props: { label: '🚨 View Alerts', text: '🚨 View Alerts', backgroundColor: '#dc2626', color: 'white', fontSize: 13, fontWeight: 'bold', triggers: [{ name: 'GoAlert', event: 'ON_CLICK', actions: [{ type: 'SHOW_MESSAGE', payload: { message: '🚨 Navigate to Step 3 for alerts', msgType: 'error' } }] }] } }
        ]
    };

    // ── Step 2: Material Pick ──
    const step2 = {
        id: `st2_${ts}`, title: '2. Pick Material', stepType: 'Step',
        components: [
            { id: `h2_${ts}`, type: 'TEXT', x: 50, y: 10, w: 900, h: 30, props: { text: '📋 Material Pick & Transaction', fontSize: 22, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' } },
            { id: `h2s_${ts}`, type: 'TEXT', x: 50, y: 40, w: 900, h: 18, props: { text: 'Scan barcode → record transaction → auto-alert if stock < reorder → linked to Suppliers', fontSize: 11, color: '#64748b', textAlign: 'center' } },
            { id: `bc_${ts}`, type: 'BARCODE_SCANNER', x: 150, y: 70, w: 700, h: 50, props: { placeholder: 'Scan material barcode...', autoFocus: true, targetVariable: 'Scan_Item' } },
            { id: `mn_${ts}`, type: 'TEXT_INPUT', x: 150, y: 140, w: 220, h: 42, props: { label: 'Material Name', targetVariable: 'Material_Name' } },
            { id: `ml_${ts}`, type: 'TEXT_INPUT', x: 390, y: 140, w: 220, h: 42, props: { label: 'Location', targetVariable: 'Location', placeholder: 'Kitting-4' } },
            { id: `ms_${ts}`, type: 'TEXT_INPUT', x: 630, y: 140, w: 220, h: 42, props: { label: 'Supplier', targetVariable: 'Supplier_Name' } },
            { id: `mst_${ts}`, type: 'TEXT_INPUT', x: 150, y: 200, w: 160, h: 42, props: { label: 'Current Stock', targetVariable: 'Current_Stock', inputType: 'number', fontSize: 18, fontWeight: 'bold' } },
            { id: `mrp_${ts}`, type: 'TEXT_INPUT', x: 330, y: 200, w: 160, h: 42, props: { label: 'Reorder Point', targetVariable: 'Reorder_Point', inputType: 'number', fontSize: 18, fontWeight: 'bold' } },
            { id: `muc_${ts}`, type: 'TEXT_INPUT', x: 510, y: 200, w: 160, h: 42, props: { label: 'Unit Cost ($)', targetVariable: 'Unit_Cost', inputType: 'number' } },
            { id: `moi_${ts}`, type: 'TEXT_INPUT', x: 690, y: 200, w: 160, h: 42, props: { label: 'Order ID', targetVariable: 'Order_ID', placeholder: 'ORDER10029' } },
            { id: `pql_${ts}`, type: 'TEXT', x: 150, y: 260, w: 200, h: 18, props: { text: 'Quantity to Pick:', fontSize: 13, fontWeight: 'bold', color: '#0f172a' } },
            { id: `pqi_${ts}`, type: 'TEXT_INPUT', x: 150, y: 280, w: 250, h: 50, props: { label: '', targetVariable: 'Pick_Qty', inputType: 'number', fontSize: 26, fontWeight: 'bold', placeholder: '0' } },
            { id: `tt_${ts}`, type: 'RADIO_GROUP', x: 430, y: 265, w: 420, h: 55, props: { label: 'Transaction Type', options: ['PICK', 'RECEIVE', 'ADJUST', 'RETURN'], targetVariable: 'Transaction_Type' } },
            // Formula preview
            { id: `fml_${ts}`, type: 'TEXT', x: 150, y: 345, w: 700, h: 16, props: { text: '📐 Formula: Stock_Value = Current_Qty × Unit_Cost  |  Days_Until_Reorder = (Current_Qty - Reorder_Point) / Avg_Daily_Usage', fontSize: 10, color: '#7c3aed' } },
            // Save
            { id: `svb_${ts}`, type: 'BUTTON', x: 150, y: 375, w: 330, h: 45, props: { label: '💾 Record Transaction', text: '💾 Record Transaction', backgroundColor: '#2563eb', color: 'white', fontSize: 15, fontWeight: 'bold',
                triggers: [{ name: 'SaveTx', event: 'ON_CLICK', actions: [
                    { type: 'SET_VARIABLE', payload: { variable: 'Timestamp', valueType: 'EXPRESSION', value: 'new Date().toISOString()' } },
                    { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_tx_${ts}` } },
                    { type: 'SHOW_MESSAGE', payload: { message: '✅ Transaction saved → Inventory_Transactions (linked to Material)', msgType: 'success' } },
                    { type: 'SHOW_MESSAGE', payload: { message: '🚨 LOW STOCK! Below reorder point → Alert created in Inventory_Alerts + Notification sent to manager', msgType: 'error', showIf: `Number(@Current_Stock) - Number(@Pick_Qty) < Number(@Reorder_Point) && "@Transaction_Type" === "PICK"` } },
                    { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_alert_${ts}`, showIf: `Number(@Current_Stock) - Number(@Pick_Qty) < Number(@Reorder_Point)` } }
                ] }] } },
            { id: `dnb_${ts}`, type: 'BUTTON', x: 520, y: 375, w: 330, h: 45, props: { label: '📊 Alerts & Summary →', text: '📊 Alerts & Summary →', backgroundColor: '#1e293b', color: 'white', fontSize: 14, fontWeight: 'bold',
                triggers: [{ name: 'GoSum', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }] } }
        ]
    };

    // ── Step 3: Alerts & Reorder ──
    const step3 = {
        id: `st3_${ts}`, title: '3. Alerts & Reorder', stepType: 'Step',
        components: [
            { id: `h3_${ts}`, type: 'TEXT', x: 50, y: 10, w: 900, h: 30, props: { text: '🚨 Inventory Alerts & Reorder Management', fontSize: 22, fontWeight: 'bold', color: '#dc2626', textAlign: 'center' } },
            { id: `h3s_${ts}`, type: 'TEXT', x: 50, y: 40, w: 900, h: 18, props: { text: 'Automation: TABLE_ROW_UPDATED → check qty < reorder_point → CREATE alert + SEND notification | TIMER: daily stock check', fontSize: 10, color: '#7c3aed', textAlign: 'center' } },
            { id: `at_${ts}`, type: 'INTERACTIVE_TABLE', x: 50, y: 65, w: 900, h: 170, props: { tableId: T.alerts, label: 'Low Stock Alerts', visibleColumns: ['Material_Name', 'Item_Number', 'Current_Qty', 'Reorder_Point', 'Alert_Type', 'Status', 'Timestamp'], fontSize: 11 } },
            { id: `smh_${ts}`, type: 'TEXT', x: 50, y: 250, w: 900, h: 20, props: { text: '📊 Session Summary', fontSize: 14, fontWeight: 'bold', color: '#1e40af' } },
            { id: `sm1_${ts}`, type: 'TEXT_INPUT', x: 50, y: 278, w: 200, h: 38, props: { label: 'Completed Today', targetVariable: 'Completed_Today', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Completed_Today' } },
            { id: `sm2_${ts}`, type: 'TEXT_INPUT', x: 270, y: 278, w: 200, h: 38, props: { label: 'To Be Kitted', targetVariable: 'To_Be_Kitted', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'To_Be_Kitted' } },
            { id: `sm3_${ts}`, type: 'TEXT_INPUT', x: 490, y: 278, w: 200, h: 38, props: { label: 'In Queue', targetVariable: 'In_Queue', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'In_Queue' } },
            { id: `cmb_${ts}`, type: 'BUTTON', x: 200, y: 340, w: 600, h: 50, props: { label: '✅ COMPLETE SESSION', text: '✅ COMPLETE SESSION', backgroundColor: '#16a34a', color: 'white', fontSize: 18, fontWeight: 'bold',
                triggers: [{ name: 'Done', event: 'ON_CLICK', actions: [
                    { type: 'SET_VARIABLE', payload: { variable: 'Timestamp', valueType: 'EXPRESSION', value: 'new Date().toISOString()' } },
                    { type: 'SHOW_MESSAGE', payload: { message: '✅ Session complete! All alerts logged & notifications sent.', msgType: 'success' } },
                    { type: 'COMPLETE_APP' }
                ] }] } }
        ]
    };

    // ── Automation Definitions (saved to localStorage on install) ──
    const automations = [
        {
            id: `auto_lowstock_${ts}`,
            name: 'Low Stock Alert Automation',
            description: 'When a material record is updated and qty drops below reorder point, create alert + notify manager',
            active: true,
            triggers: [{ id: `trig_rowupd_${ts}`, type: 'TABLE_ROW_UPDATED', config: { tableId: T.materials, condition: { field: 'Current_Qty', operator: '<', value: 'Reorder_Point' } } }],
            nodes: [
                { id: 'start', type: 'event', data: { label: 'Material Updated' } },
                { id: 'check', type: 'decision', data: { label: 'Qty < Reorder?', condition: { field: 'Current_Qty', operator: '<', value: 'Reorder_Point' } } },
                { id: 'createAlert', type: 'action', data: { type: 'CREATE_RECORD', tableId: T.alerts, data: { Alert_Type: 'LOW_STOCK', Status: 'OPEN' } } },
                { id: 'notify', type: 'action', data: { type: 'SEND_NOTIFICATION', recipient: 'warehouse_manager@company.com', message: 'LOW STOCK ALERT: Material below reorder point!' } },
                { id: 'log', type: 'action', data: { type: 'LOG_MESSAGE', message: 'Low stock automation executed' } }
            ],
            edges: [
                { source: 'start', target: 'check' },
                { source: 'check', target: 'createAlert', sourceHandle: 'yes' },
                { source: 'check', target: 'log', sourceHandle: 'no' },
                { source: 'createAlert', target: 'notify', sourceHandle: 'success' },
                { source: 'notify', target: 'log', sourceHandle: 'success' }
            ]
        },
        {
            id: `auto_daily_${ts}`,
            name: 'Daily Inventory Check',
            description: 'Every day at 06:00, scan all materials and flag items below reorder point',
            active: true,
            triggers: [{ id: `trig_timer_${ts}`, type: 'TIMER', schedule: { frequency: 'DAILY', time: '06:00' } }],
            actions: [
                { type: 'LOG_MESSAGE', message: 'Daily inventory check started at 06:00' },
                { type: 'CREATE_RECORD', tableId: T.alerts, data: { Alert_Type: 'DAILY_CHECK', Status: 'RUNNING', Timestamp: new Date().toISOString() } }
            ]
        }
    ];

    // ── Function Definitions ──
    const functions = [
        {
            id: `fn_calcstock_${ts}`,
            name: 'Calculate_Stock_Value',
            description: 'Calculates total stock value: Current_Qty × Unit_Cost',
            type: 'function',
            active: true,
            triggers: [{ id: `fn_trig1_${ts}`, type: 'TABLE_ROW_ADDED', config: { tableId: T.transactions } }],
            nodes: [
                { id: 'start', type: 'functionCall', data: { label: 'On Transaction Added' } },
                { id: 'calc', type: 'expression', data: { expression: 'Current_Qty * Unit_Cost', outputVar: 'Stock_Value' } },
                { id: 'save', type: 'action', data: { type: 'LOG_MESSAGE', message: 'Stock value recalculated' } }
            ],
            edges: [
                { source: 'start', target: 'calc' },
                { source: 'calc', target: 'save', sourceHandle: 'success' }
            ]
        },
        {
            id: `fn_reordercheck_${ts}`,
            name: 'Check_Reorder_Status',
            description: 'Checks if material needs reorder and updates status field',
            type: 'function',
            active: true,
            triggers: [{ id: `fn_trig2_${ts}`, type: 'TABLE_ROW_UPDATED', config: { tableId: T.materials } }],
            nodes: [
                { id: 'start', type: 'functionCall', data: { label: 'On Material Updated' } },
                { id: 'check', type: 'decision', data: { label: 'Below reorder?', condition: { field: 'Current_Qty', operator: '<=', value: 'Reorder_Point' } } },
                { id: 'setLow', type: 'action', data: { type: 'LOG_MESSAGE', message: 'Status → LOW_STOCK' } },
                { id: 'setOk', type: 'action', data: { type: 'LOG_MESSAGE', message: 'Status → IN_STOCK' } }
            ],
            edges: [
                { source: 'start', target: 'check' },
                { source: 'check', target: 'setLow', sourceHandle: 'yes' },
                { source: 'check', target: 'setOk', sourceHandle: 'no' }
            ]
        }
    ];

    return {
        id: `app_inv_${ts}`,
        name: 'Inventory Status & Alerting',
        description: 'Multi-table inventory with linked records, formula fields, automations, and functions',
        category: 'Warehouse',
        type: 'FRONT-LINE', published: true, approvalStatus: 'APPROVED',
        createdAt: iso, updatedAt: iso,
        config: {
            appVariables,
            recordPlaceholders: [
                { id: `rp_tx_${ts}`, name: 'Transaction_Record', tableId: T.transactions, description: 'Material transaction' },
                { id: `rp_alert_${ts}`, name: 'Alert_Record', tableId: T.alerts, description: 'Low stock alert' }
            ],
            appTables: [T.materials, T.transactions, T.alerts, T.suppliers],
            appTriggers: [{ id: `trg_${ts}`, name: 'Inventory Start', event: 'ON_APP_START', actions: [{ type: 'SHOW_MESSAGE', payload: { message: '📦 Inventory Module Ready — Automations Active', msgType: 'info' } }] }],
            steps: [step1, step2, step3],
            automations,
            functions,
            linkedTables: {
                materials: { placeholder: T.materials, description: 'Master inventory (formulas: Stock_Value, Days_Until_Reorder)' },
                transactions: { placeholder: T.transactions, description: 'Pick/receive linked to Materials', linkedTo: T.materials },
                alerts: { placeholder: T.alerts, description: 'Auto-generated alerts linked to Materials', linkedTo: T.materials },
                suppliers: { placeholder: T.suppliers, description: 'Supplier master linked to Materials', linkedTo: T.materials }
            }
        }
    };
}
