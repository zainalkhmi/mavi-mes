/**
 * inventoryAlertTemplate.js
 * PRO Manufacturing Laptop Edition - 1280×720 Full Canvas
 * Multi-table Inventory with Linked Records, Formulas, and Automation
 * Tables: Materials (master), Transactions, Alerts, Suppliers
 * 3 Screens: Inventory Status & Kitting | Material Pick & Transaction | Inventory Alerts & Reorder Management
 */
export function createInventoryAlertTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    const T = {
        materials: 'tbl_inv_materials',
        transactions: 'tbl_inv_transactions',
        alerts: 'tbl_inv_alerts',
        suppliers: 'tbl_inv_suppliers'
    };

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

    // ─────────────────────────────────────────────────────────────────────────
    // SCREEN 1: Inventory Status & Kitting  (1280 × 720)
    // Layout:
    //   Top Bar (0,0→1280,56): App title + status chips
    //   Left Panel (0,56→540,664): Waiting on Materials table + Ready to Kit table
    //   Right Panel (540,56→1280,664):
    //     - Cell Performance KPIs (3 cards)
    //     - Kit Requirements table
    //     - Suppliers table
    //   Bottom Bar (0,664→1280,720): Action buttons
    // ─────────────────────────────────────────────────────────────────────────
    const step1 = {
        id: `st1_${ts}`,
        title: '1. Inventory Status & Kitting',
        stepType: 'Step',
        backgroundColor: '#0f172a',
        components: [
            // ── TOP HEADER BAR ──────────────────────────────────────────────
            {
                id: `s1_topbar_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 0, w: 1280, h: 52,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 0, borderRadius: 0, zIndex: 10 }
            },
            {
                id: `s1_logo_dot_${ts}`, type: 'SHAPE_RECTANGLE', x: 20, y: 14, w: 8, h: 24,
                props: { shapeVariant: 'rectangle', backgroundColor: '#f97316', borderRadius: 2, zIndex: 11 }
            },
            {
                id: `s1_title_${ts}`, type: 'TEXT', x: 36, y: 10, w: 520, h: 32,
                props: { text: 'Inventory Status & Kitting', fontSize: 20, fontBold: true, textColor: '#f8fafc', zIndex: 11 }
            },
            // Status chips
            {
                id: `s1_chip_live_${ts}`, type: 'SHAPE_RECTANGLE', x: 640, y: 12, w: 80, h: 28,
                props: { shapeVariant: 'rectangle', backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10b981', borderWidth: 1, borderRadius: 14, zIndex: 11 }
            },
            {
                id: `s1_chip_live_txt_${ts}`, type: 'TEXT', x: 641, y: 12, w: 78, h: 28,
                props: { text: '● LIVE', fontSize: 11, fontBold: true, textColor: '#34d399', textAlign: 'center', textAlignment: 1, zIndex: 12 }
            },
            {
                id: `s1_chip_shift_${ts}`, type: 'TEXT', x: 734, y: 14, w: 200, h: 24,
                props: { text: 'SHIFT A  |  CELL: Kitting-4', fontSize: 11, textColor: '#94a3b8', zIndex: 11 }
            },
            {
                id: `s1_nav_alert_btn_${ts}`, type: 'BUTTON', x: 950, y: 10, w: 150, h: 32,
                props: { label: '🚨 View Alerts', text: '🚨 View Alerts', backgroundColor: '#dc2626', textColor: '#ffffff', borderRadius: 6, fontSize: 12, fontBold: true, zIndex: 12,
                    triggers: [{ name: 'GoAlerts', event: 'ON_CLICK', actions: [{ type: 'SHOW_MESSAGE', payload: { message: 'Navigate to Step 3 for alerts', msgType: 'error' } }] }] }
            },
            {
                id: `s1_nav_pick_btn_${ts}`, type: 'BUTTON', x: 1114, y: 10, w: 150, h: 32,
                props: { label: 'Pick Material →', text: 'Pick Material →', backgroundColor: '#1d4ed8', textColor: '#ffffff', borderRadius: 6, fontSize: 12, fontBold: true, zIndex: 12,
                    triggers: [{ name: 'GoPick', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }] }
            },

            // ── LEFT PANEL BACKGROUND ────────────────────────────────────────
            {
                id: `s1_left_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 52, w: 540, h: 668,
                props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 }
            },
            // Divider
            {
                id: `s1_div_${ts}`, type: 'SHAPE_RECTANGLE', x: 540, y: 52, w: 1, h: 668,
                props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, borderRadius: 0, zIndex: 10 }
            },

            // ── WAITING ON MATERIALS ─────────────────────────────────────────
            {
                id: `s1_wm_header_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 8, y: 60, w: 524, h: 36,
                props: { shapeVariant: 'rectangle', backgroundColor: '#7f1d1d', borderRadius: 6, borderWidth: 0, zIndex: 11 }
            },
            {
                id: `s1_wm_dot_${ts}`, type: 'SHAPE_RECTANGLE', x: 20, y: 72, w: 10, h: 10,
                props: { shapeVariant: 'circle', backgroundColor: '#fca5a5', borderWidth: 0, zIndex: 13 }
            },
            {
                id: `s1_wm_header_${ts}`, type: 'TEXT', x: 36, y: 67, w: 490, h: 22,
                props: { text: 'WAITING ON MATERIALS', fontSize: 12, fontBold: true, textColor: '#fecaca', zIndex: 12 }
            },
            {
                id: `s1_wm_count_${ts}`, type: 'TEXT', x: 440, y: 67, w: 84, h: 22,
                props: { text: '3 items', fontSize: 11, textColor: '#f87171', textAlign: 'right', zIndex: 12 }
            },
            {
                id: `s1_wm_table_${ts}`, type: 'INTERACTIVE_TABLE', x: 8, y: 98, w: 524, h: 220,
                props: {
                    tableId: T.materials,
                    label: 'Materials Waiting',
                    visibleColumns: ['Material_Name', 'Item_Number', 'Unit', 'Status', 'Current_Qty', 'Location'],
                    fontSize: 12,
                    headerBg: '#1e293b',
                    headerTextColor: '#94a3b8',
                    rowBg: '#0f172a',
                    rowAltBg: '#1e293b',
                    rowTextColor: '#e2e8f0',
                    borderColor: '#334155',
                    zIndex: 11
                }
            },

            // ── READY TO BE KITTED ────────────────────────────────────────────
            {
                id: `s1_rk_header_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 8, y: 330, w: 524, h: 36,
                props: { shapeVariant: 'rectangle', backgroundColor: '#14532d', borderRadius: 6, borderWidth: 0, zIndex: 11 }
            },
            {
                id: `s1_rk_dot_${ts}`, type: 'SHAPE_RECTANGLE', x: 20, y: 342, w: 10, h: 10,
                props: { shapeVariant: 'circle', backgroundColor: '#86efac', borderWidth: 0, zIndex: 13 }
            },
            {
                id: `s1_rk_header_${ts}`, type: 'TEXT', x: 36, y: 337, w: 490, h: 22,
                props: { text: 'READY TO BE KITTED', fontSize: 12, fontBold: true, textColor: '#bbf7d0', zIndex: 12 }
            },
            {
                id: `s1_rk_count_${ts}`, type: 'TEXT', x: 440, y: 337, w: 84, h: 22,
                props: { text: '5 ready', fontSize: 11, textColor: '#4ade80', textAlign: 'right', zIndex: 12 }
            },
            {
                id: `s1_rk_table_${ts}`, type: 'INTERACTIVE_TABLE', x: 8, y: 368, w: 524, h: 200,
                props: {
                    tableId: T.transactions,
                    label: 'Kitted Transactions',
                    visibleColumns: ['Order_ID', 'Material_Name', 'Qty', 'Type', 'Timestamp'],
                    fontSize: 12,
                    headerBg: '#1e293b',
                    headerTextColor: '#94a3b8',
                    rowBg: '#0f172a',
                    rowAltBg: '#1e293b',
                    rowTextColor: '#e2e8f0',
                    borderColor: '#334155',
                    zIndex: 11
                }
            },

            // ── RIGHT PANEL BACKGROUND ────────────────────────────────────────
            {
                id: `s1_right_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 541, y: 52, w: 739, h: 668,
                props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, borderRadius: 0, zIndex: 10 }
            },

            // ── CELL PERFORMANCE KPI AREA ────────────────────────────────────
            {
                id: `s1_cp_title_${ts}`, type: 'TEXT', x: 557, y: 62, w: 300, h: 20,
                props: { text: 'CELL PERFORMANCE', fontSize: 13, fontBold: true, textColor: '#94a3b8', letterSpacing: 2, zIndex: 11 }
            },

            // KPI Card 1: Completed Today
            {
                id: `s1_kpi1_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 557, y: 88, w: 228, h: 100,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 }
            },
            {
                id: `s1_kpi1_accent_${ts}`, type: 'SHAPE_RECTANGLE', x: 557, y: 88, w: 4, h: 100,
                props: { shapeVariant: 'rectangle', backgroundColor: '#10b981', borderRadius: 10, borderWidth: 0, zIndex: 12 }
            },
            {
                id: `s1_kpi1_lbl_${ts}`, type: 'TEXT', x: 572, y: 100, w: 205, h: 16,
                props: { text: 'COMPLETED TODAY', fontSize: 10, fontBold: true, textColor: '#64748b', letterSpacing: 1, zIndex: 12 }
            },
            {
                id: `s1_kpi1_val_${ts}`, type: 'TEXT_INPUT', x: 572, y: 118, w: 205, h: 52,
                props: { label: '', targetVariable: 'Completed_Today', fontSize: 34, fontBold: true, textColor: '#f8fafc', backgroundColor: 'transparent', borderWidth: 0, inputType: 'number', textAlign: 'left', zIndex: 12 }
            },

            // KPI Card 2: To Be Kitted
            {
                id: `s1_kpi2_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 797, y: 88, w: 228, h: 100,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 }
            },
            {
                id: `s1_kpi2_accent_${ts}`, type: 'SHAPE_RECTANGLE', x: 797, y: 88, w: 4, h: 100,
                props: { shapeVariant: 'rectangle', backgroundColor: '#f59e0b', borderRadius: 10, borderWidth: 0, zIndex: 12 }
            },
            {
                id: `s1_kpi2_lbl_${ts}`, type: 'TEXT', x: 812, y: 100, w: 205, h: 16,
                props: { text: 'TO BE KITTED', fontSize: 10, fontBold: true, textColor: '#64748b', letterSpacing: 1, zIndex: 12 }
            },
            {
                id: `s1_kpi2_val_${ts}`, type: 'TEXT_INPUT', x: 812, y: 118, w: 205, h: 52,
                props: { label: '', targetVariable: 'To_Be_Kitted', fontSize: 34, fontBold: true, textColor: '#fbbf24', backgroundColor: 'transparent', borderWidth: 0, inputType: 'number', textAlign: 'left', zIndex: 12 }
            },

            // KPI Card 3: In Queue at Assembly
            {
                id: `s1_kpi3_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 1037, y: 88, w: 235, h: 100,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 }
            },
            {
                id: `s1_kpi3_accent_${ts}`, type: 'SHAPE_RECTANGLE', x: 1037, y: 88, w: 4, h: 100,
                props: { shapeVariant: 'rectangle', backgroundColor: '#6366f1', borderRadius: 10, borderWidth: 0, zIndex: 12 }
            },
            {
                id: `s1_kpi3_lbl_${ts}`, type: 'TEXT', x: 1052, y: 100, w: 212, h: 16,
                props: { text: 'IN QUEUE AT ASSEMBLY', fontSize: 10, fontBold: true, textColor: '#64748b', letterSpacing: 1, zIndex: 12 }
            },
            {
                id: `s1_kpi3_val_${ts}`, type: 'TEXT_INPUT', x: 1052, y: 118, w: 212, h: 52,
                props: { label: '', targetVariable: 'In_Queue', fontSize: 34, fontBold: true, textColor: '#818cf8', backgroundColor: 'transparent', borderWidth: 0, inputType: 'number', textAlign: 'left', zIndex: 12 }
            },

            // ── KIT REQUIREMENTS TABLE ────────────────────────────────────────
            {
                id: `s1_kr_divider_${ts}`, type: 'SHAPE_RECTANGLE', x: 557, y: 202, w: 715, h: 1,
                props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 11 }
            },
            {
                id: `s1_kr_title_${ts}`, type: 'TEXT', x: 557, y: 212, w: 600, h: 20,
                props: { text: 'KIT REQUIREMENTS', fontSize: 13, fontBold: true, textColor: '#94a3b8', letterSpacing: 2, zIndex: 11 }
            },
            {
                id: `s1_kr_sub_${ts}`, type: 'TEXT', x: 557, y: 212, w: 715, h: 20,
                props: { text: 'Click item to add to kit →', fontSize: 11, textColor: '#475569', textAlign: 'right', zIndex: 11 }
            },
            {
                id: `s1_kr_table_${ts}`, type: 'INTERACTIVE_TABLE', x: 557, y: 236, w: 715, h: 220,
                props: {
                    tableId: T.materials,
                    label: 'Kit Requirements',
                    visibleColumns: ['Material_Name', 'Item_Number', 'Unit', 'Status', 'Current_Qty', 'Location'],
                    fontSize: 12,
                    headerBg: '#1e293b',
                    headerTextColor: '#94a3b8',
                    rowBg: '#0f172a',
                    rowAltBg: '#1e293b',
                    rowTextColor: '#e2e8f0',
                    borderColor: '#334155',
                    zIndex: 11
                }
            },

            // ── SUPPLIERS TABLE ────────────────────────────────────────────────
            {
                id: `s1_sp_divider_${ts}`, type: 'SHAPE_RECTANGLE', x: 557, y: 468, w: 715, h: 1,
                props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 11 }
            },
            {
                id: `s1_sp_badge_${ts}`, type: 'SHAPE_RECTANGLE', x: 557, y: 478, w: 10, h: 10,
                props: { shapeVariant: 'circle', backgroundColor: '#3b82f6', borderWidth: 0, zIndex: 12 }
            },
            {
                id: `s1_sp_title_${ts}`, type: 'TEXT', x: 574, y: 475, w: 300, h: 18,
                props: { text: 'SUPPLIERS (LINKED)', fontSize: 11, fontBold: true, textColor: '#60a5fa', letterSpacing: 1, zIndex: 11 }
            },
            {
                id: `s1_sp_table_${ts}`, type: 'INTERACTIVE_TABLE', x: 557, y: 498, w: 715, h: 170,
                props: {
                    tableId: T.suppliers,
                    label: 'Suppliers',
                    visibleColumns: ['Supplier_Name', 'Contact', 'Lead_Days', 'Rating'],
                    fontSize: 12,
                    headerBg: '#1e293b',
                    headerTextColor: '#94a3b8',
                    rowBg: '#0f172a',
                    rowAltBg: '#1e293b',
                    rowTextColor: '#e2e8f0',
                    borderColor: '#334155',
                    zIndex: 11
                }
            },

            // ── FOOTER STATUS BAR ──────────────────────────────────────────────
            {
                id: `s1_footer_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 680, w: 1280, h: 40,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 0, borderRadius: 0, zIndex: 10 }
            },
            {
                id: `s1_footer_txt_${ts}`, type: 'TEXT', x: 20, y: 688, w: 600, h: 20,
                props: { text: 'Last Sync: Just now  |  Auto-refresh: 30s  |  Station: WH-01', fontSize: 11, textColor: '#475569', zIndex: 11 }
            },
            {
                id: `s1_footer_user_${ts}`, type: 'TEXT', x: 900, y: 688, w: 360, h: 20,
                props: { text: 'Operator: @APP_INFO.USER  |  v2.4.1', fontSize: 11, textColor: '#475569', textAlign: 'right', zIndex: 11 }
            }
        ]
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SCREEN 2: Material Pick & Transaction  (1280 × 720)
    // Layout:
    //   Top Header: dark, with step info + workflow breadcrumb
    //   Left (0→580): Barcode scan zone + material details form
    //   Right (600→1280): Stock summary card + transaction controls
    //   Bottom: action buttons + formula reference strip
    // ─────────────────────────────────────────────────────────────────────────
    const step2 = {
        id: `st2_${ts}`,
        title: '2. Pick Material',
        stepType: 'Step',
        backgroundColor: '#0f172a',
        components: [
            // ── TOP HEADER BAR ────────────────────────────────────────────────
            {
                id: `s2_topbar_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 0, w: 1280, h: 52,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 }
            },
            {
                id: `s2_logo_dot_${ts}`, type: 'SHAPE_RECTANGLE', x: 20, y: 14, w: 8, h: 24,
                props: { shapeVariant: 'rectangle', backgroundColor: '#f97316', borderRadius: 2, zIndex: 11 }
            },
            {
                id: `s2_title_${ts}`, type: 'TEXT', x: 36, y: 10, w: 680, h: 32,
                props: { text: 'Material Pick & Transaction', fontSize: 20, fontBold: true, textColor: '#f8fafc', zIndex: 11 }
            },
            {
                id: `s2_breadcrumb_${ts}`, type: 'TEXT', x: 36, y: 36, w: 800, h: 16,
                props: { text: 'Scan barcode  →  Record transaction  →  Auto-alert if stock < reorder  →  Linked to Suppliers', fontSize: 10, textColor: '#475569', zIndex: 11 }
            },
            {
                id: `s2_back_btn_${ts}`, type: 'BUTTON', x: 1114, y: 10, w: 150, h: 32,
                props: { label: '← Back to Dashboard', text: '← Back to Dashboard', backgroundColor: '#334155', textColor: '#94a3b8', borderRadius: 6, fontSize: 11, zIndex: 12,
                    triggers: [{ name: 'GoBack', event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }] }
            },

            // ── MAIN BACKGROUND PANELS ────────────────────────────────────────
            {
                id: `s2_left_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 52, w: 680, h: 628,
                props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, borderRadius: 0, zIndex: 10 }
            },
            {
                id: `s2_div_${ts}`, type: 'SHAPE_RECTANGLE', x: 680, y: 52, w: 1, h: 628,
                props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 10 }
            },
            {
                id: `s2_right_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 681, y: 52, w: 599, h: 628,
                props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, borderRadius: 0, zIndex: 10 }
            },

            // ── SCAN ZONE ─────────────────────────────────────────────────────
            {
                id: `s2_scan_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 16, y: 66, w: 648, h: 72,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 }
            },
            {
                id: `s2_scan_icon_${ts}`, type: 'TEXT', x: 28, y: 80, w: 30, h: 30,
                props: { text: '▣', fontSize: 24, textColor: '#6366f1', zIndex: 12 }
            },
            {
                id: `s2_scan_lbl_${ts}`, type: 'TEXT', x: 62, y: 74, w: 200, h: 18,
                props: { text: 'BARCODE / RFID SCAN', fontSize: 10, fontBold: true, textColor: '#64748b', letterSpacing: 1, zIndex: 12 }
            },
            {
                id: `s2_scan_input_${ts}`, type: 'BARCODE_SCANNER', x: 62, y: 92, w: 590, h: 38,
                props: { placeholder: 'Scan material barcode or type item number...', autoFocus: true, targetVariable: 'Scan_Item', zIndex: 12 }
            },

            // ── MATERIAL DETAILS FORM ─────────────────────────────────────────
            {
                id: `s2_form_title_${ts}`, type: 'TEXT', x: 16, y: 152, w: 400, h: 20,
                props: { text: 'MATERIAL DETAILS', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 }
            },

            // Row 1: Material Name | Location | Supplier
            {
                id: `s2_mn_${ts}`, type: 'TEXT_INPUT', x: 16, y: 176, w: 200, h: 60,
                props: { label: 'Material Name', targetVariable: 'Material_Name', labelFontSize: 10, labelColor: '#64748b', textColor: '#f8fafc', backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8, zIndex: 11 }
            },
            {
                id: `s2_ml_${ts}`, type: 'TEXT_INPUT', x: 228, y: 176, w: 200, h: 60,
                props: { label: 'Location', targetVariable: 'Location', placeholder: 'Kitting-4', labelFontSize: 10, labelColor: '#64748b', textColor: '#f8fafc', backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8, zIndex: 11 }
            },
            {
                id: `s2_ms_${ts}`, type: 'TEXT_INPUT', x: 440, y: 176, w: 224, h: 60,
                props: { label: 'Supplier', targetVariable: 'Supplier_Name', labelFontSize: 10, labelColor: '#64748b', textColor: '#f8fafc', backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8, zIndex: 11 }
            },

            // Row 2: Current Stock | Reorder Point | Unit Cost | Order ID
            {
                id: `s2_mst_${ts}`, type: 'TEXT_INPUT', x: 16, y: 250, w: 148, h: 60,
                props: { label: 'Current Stock', targetVariable: 'Current_Stock', inputType: 'number', fontSize: 22, fontBold: true, labelFontSize: 10, labelColor: '#64748b', textColor: '#10b981', backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8, zIndex: 11 }
            },
            {
                id: `s2_mrp_${ts}`, type: 'TEXT_INPUT', x: 176, y: 250, w: 148, h: 60,
                props: { label: 'Reorder Point', targetVariable: 'Reorder_Point', inputType: 'number', fontSize: 22, fontBold: true, labelFontSize: 10, labelColor: '#64748b', textColor: '#f59e0b', backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8, zIndex: 11 }
            },
            {
                id: `s2_muc_${ts}`, type: 'TEXT_INPUT', x: 336, y: 250, w: 148, h: 60,
                props: { label: 'Unit Cost ($)', targetVariable: 'Unit_Cost', inputType: 'number', labelFontSize: 10, labelColor: '#64748b', textColor: '#f8fafc', backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8, zIndex: 11 }
            },
            {
                id: `s2_moi_${ts}`, type: 'TEXT_INPUT', x: 496, y: 250, w: 168, h: 60,
                props: { label: 'Order ID', targetVariable: 'Order_ID', placeholder: 'ORDER10029', labelFontSize: 10, labelColor: '#64748b', textColor: '#f8fafc', backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8, zIndex: 11 }
            },

            // ── QUANTITY + TRANSACTION TYPE ───────────────────────────────────
            {
                id: `s2_qty_divider_${ts}`, type: 'SHAPE_RECTANGLE', x: 16, y: 324, w: 648, h: 1,
                props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 11 }
            },
            {
                id: `s2_qty_title_${ts}`, type: 'TEXT', x: 16, y: 334, w: 300, h: 20,
                props: { text: 'PICK QUANTITY', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 }
            },
            // Large quantity input
            {
                id: `s2_qty_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 16, y: 358, w: 280, h: 110,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#6366f1', borderWidth: 2, borderRadius: 12, zIndex: 11 }
            },
            {
                id: `s2_qty_val_${ts}`, type: 'TEXT_INPUT', x: 24, y: 362, w: 264, h: 100,
                props: { label: '', targetVariable: 'Pick_Qty', inputType: 'number', fontSize: 58, fontBold: true, textColor: '#818cf8', backgroundColor: 'transparent', borderWidth: 0, textAlign: 'center', placeholder: '0', zIndex: 12 }
            },

            // Transaction Type
            {
                id: `s2_tt_title_${ts}`, type: 'TEXT', x: 320, y: 334, w: 344, h: 20,
                props: { text: 'TRANSACTION TYPE', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 }
            },
            {
                id: `s2_tt_input_${ts}`, type: 'RADIO_GROUP', x: 320, y: 362, w: 344, h: 106,
                props: { label: '', options: ['PICK', 'RECEIVE', 'ADJUST', 'RETURN'], targetVariable: 'Transaction_Type', textColor: '#e2e8f0', labelColor: '#94a3b8', accentColor: '#6366f1', zIndex: 11 }
            },

            // ── FORMULA REFERENCE STRIP ───────────────────────────────────────
            {
                id: `s2_formula_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 16, y: 480, w: 648, h: 36,
                props: { shapeVariant: 'rectangle', backgroundColor: 'rgba(109,40,217,0.15)', borderColor: '#7c3aed', borderWidth: 1, borderRadius: 8, zIndex: 11 }
            },
            {
                id: `s2_formula_txt_${ts}`, type: 'TEXT', x: 26, y: 490, w: 628, h: 18,
                props: { text: 'Formula:  Stock_Value = Current_Qty × Unit_Cost  |  Days_Until_Reorder = (Current_Qty − Reorder_Point) ÷ Avg_Daily_Usage', fontSize: 11, textColor: '#a78bfa', zIndex: 12 }
            },

            // ── ACTION BUTTONS ─────────────────────────────────────────────────
            {
                id: `s2_svb_${ts}`, type: 'BUTTON', x: 16, y: 532, w: 320, h: 52,
                props: {
                    label: '💾  Record Transaction', text: '💾  Record Transaction',
                    backgroundColor: '#2563eb', textColor: '#ffffff', borderRadius: 10, fontSize: 16, fontBold: true, zIndex: 12,
                    triggers: [{ name: 'SaveTx', event: 'ON_CLICK', actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'Timestamp', valueType: 'EXPRESSION', value: 'new Date().toISOString()' } },
                        { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_tx_${ts}` } },
                        { type: 'SHOW_MESSAGE', payload: { message: 'Transaction saved → Inventory_Transactions', msgType: 'success' } },
                        { type: 'SHOW_MESSAGE', payload: { message: 'LOW STOCK — Below reorder point → Alert created', msgType: 'error', showIf: `Number(@Current_Stock) - Number(@Pick_Qty) < Number(@Reorder_Point) && "@Transaction_Type" === "PICK"` } }
                    ] }]
                }
            },
            {
                id: `s2_dnb_${ts}`, type: 'BUTTON', x: 352, y: 532, w: 312, h: 52,
                props: {
                    label: '📊  Alerts & Summary →', text: '📊  Alerts & Summary →',
                    backgroundColor: '#1e293b', textColor: '#94a3b8', borderColor: '#334155', borderWidth: 1, borderRadius: 10, fontSize: 15, fontBold: true, zIndex: 12,
                    triggers: [{ name: 'GoSum', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            },

            // ── RIGHT PANEL: STOCK SUMMARY CARD ──────────────────────────────
            {
                id: `s2_stock_title_${ts}`, type: 'TEXT', x: 700, y: 66, w: 562, h: 20,
                props: { text: 'CURRENT STOCK SUMMARY', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 }
            },
            // Stock Level Card
            {
                id: `s2_sl_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 700, y: 92, w: 562, h: 130,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 }
            },
            {
                id: `s2_sl_ok_dot_${ts}`, type: 'SHAPE_RECTANGLE', x: 712, y: 108, w: 12, h: 12,
                props: { shapeVariant: 'circle', backgroundColor: '#10b981', borderWidth: 0, zIndex: 12 }
            },
            {
                id: `s2_sl_label_${ts}`, type: 'TEXT', x: 732, y: 104, w: 300, h: 18,
                props: { text: 'Stock Level', fontSize: 13, fontBold: true, textColor: '#e2e8f0', zIndex: 12 }
            },
            {
                id: `s2_sl_stock_num_${ts}`, type: 'TEXT', x: 712, y: 128, w: 130, h: 50,
                props: { text: '@Current_Stock', fontSize: 42, fontBold: true, textColor: '#10b981', zIndex: 12 }
            },
            {
                id: `s2_sl_unit_${ts}`, type: 'TEXT', x: 712, y: 180, w: 250, h: 18,
                props: { text: 'units  ·  Reorder at @Reorder_Point', fontSize: 12, textColor: '#64748b', zIndex: 12 }
            },
            // Separator vertical
            {
                id: `s2_sl_sep_${ts}`, type: 'SHAPE_RECTANGLE', x: 868, y: 108, w: 1, h: 100,
                props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 12 }
            },
            {
                id: `s2_sl_val_lbl_${ts}`, type: 'TEXT', x: 886, y: 104, w: 200, h: 16,
                props: { text: 'STOCK VALUE', fontSize: 10, fontBold: true, textColor: '#64748b', letterSpacing: 1, zIndex: 12 }
            },
            {
                id: `s2_sl_val_${ts}`, type: 'TEXT', x: 886, y: 124, w: 200, h: 36,
                props: { text: '$@Unit_Cost × @Current_Stock', fontSize: 20, fontBold: true, textColor: '#f8fafc', zIndex: 12 }
            },
            {
                id: `s2_sl_uom_lbl_${ts}`, type: 'TEXT', x: 886, y: 162, w: 200, h: 16,
                props: { text: 'LOCATION', fontSize: 10, fontBold: true, textColor: '#64748b', letterSpacing: 1, zIndex: 12 }
            },
            {
                id: `s2_sl_loc_${ts}`, type: 'TEXT', x: 886, y: 180, w: 200, h: 18,
                props: { text: '@Location', fontSize: 14, fontBold: true, textColor: '#60a5fa', zIndex: 12 }
            },

            // Recent Transactions
            {
                id: `s2_rt_divider_${ts}`, type: 'SHAPE_RECTANGLE', x: 700, y: 234, w: 562, h: 1,
                props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 11 }
            },
            {
                id: `s2_rt_title_${ts}`, type: 'TEXT', x: 700, y: 244, w: 400, h: 20,
                props: { text: 'RECENT TRANSACTIONS', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 }
            },
            {
                id: `s2_rt_table_${ts}`, type: 'INTERACTIVE_TABLE', x: 700, y: 268, w: 562, h: 326,
                props: {
                    tableId: T.transactions,
                    label: 'Transactions',
                    visibleColumns: ['Order_ID', 'Material_Name', 'Qty', 'Type', 'Location', 'Timestamp'],
                    fontSize: 12,
                    headerBg: '#1e293b',
                    headerTextColor: '#94a3b8',
                    rowBg: '#0f172a',
                    rowAltBg: '#1e293b',
                    rowTextColor: '#e2e8f0',
                    borderColor: '#334155',
                    zIndex: 11
                }
            },

            // ── FOOTER ────────────────────────────────────────────────────────
            {
                id: `s2_footer_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 680, w: 1280, h: 40,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 }
            },
            {
                id: `s2_footer_txt_${ts}`, type: 'TEXT', x: 20, y: 688, w: 700, h: 20,
                props: { text: 'Screen 2 of 3  ·  Auto-save on every transaction  ·  Linked to Suppliers table', fontSize: 11, textColor: '#475569', zIndex: 11 }
            },
            {
                id: `s2_footer_user_${ts}`, type: 'TEXT', x: 900, y: 688, w: 360, h: 20,
                props: { text: 'Operator: @APP_INFO.USER  ·  Order: @Order_ID', fontSize: 11, textColor: '#475569', textAlign: 'right', zIndex: 11 }
            }
        ]
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SCREEN 3: Inventory Alerts & Reorder Management  (1280 × 720)
    // Layout:
    //   Top Header: dark, title + status
    //   Left (0→860): Active Alerts table with status badges
    //   Right (880→1280): Session summary KPI cards
    //   Bottom: Complete Session CTA button
    // ─────────────────────────────────────────────────────────────────────────
    const step3 = {
        id: `st3_${ts}`,
        title: '3. Alerts & Reorder',
        stepType: 'Step',
        backgroundColor: '#0f172a',
        components: [
            // ── TOP HEADER BAR ────────────────────────────────────────────────
            {
                id: `s3_topbar_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 0, w: 1280, h: 52,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 }
            },
            {
                id: `s3_logo_dot_${ts}`, type: 'SHAPE_RECTANGLE', x: 20, y: 14, w: 8, h: 24,
                props: { shapeVariant: 'rectangle', backgroundColor: '#dc2626', borderRadius: 2, zIndex: 11 }
            },
            {
                id: `s3_title_${ts}`, type: 'TEXT', x: 36, y: 10, w: 800, h: 32,
                props: { text: 'Inventory Alerts & Reorder Management', fontSize: 20, fontBold: true, textColor: '#f8fafc', zIndex: 11 }
            },
            {
                id: `s3_breadcrumb_${ts}`, type: 'TEXT', x: 36, y: 36, w: 900, h: 16,
                props: { text: 'Automation: TABLE_ROW_UPDATED → check qty < reorder_point → CREATE alert + SEND notification  |  TIMER: daily stock check', fontSize: 10, textColor: '#7c3aed', zIndex: 11 }
            },
            {
                id: `s3_alert_count_chip_${ts}`, type: 'SHAPE_RECTANGLE', x: 1050, y: 12, w: 80, h: 28,
                props: { shapeVariant: 'rectangle', backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444', borderWidth: 1, borderRadius: 14, zIndex: 11 }
            },
            {
                id: `s3_alert_count_txt_${ts}`, type: 'TEXT', x: 1051, y: 12, w: 78, h: 28,
                props: { text: '🚨 ACTIVE', fontSize: 11, fontBold: true, textColor: '#f87171', textAlign: 'center', textAlignment: 1, zIndex: 12 }
            },
            {
                id: `s3_back_btn_${ts}`, type: 'BUTTON', x: 1144, y: 10, w: 120, h: 32,
                props: { label: '← Back', text: '← Back', backgroundColor: '#334155', textColor: '#94a3b8', borderRadius: 6, fontSize: 11, zIndex: 12,
                    triggers: [{ name: 'GoBack', event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }] }
            },

            // ── ALERT TABLE PANEL ─────────────────────────────────────────────
            {
                id: `s3_left_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 52, w: 840, h: 628,
                props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, borderRadius: 0, zIndex: 10 }
            },

            {
                id: `s3_alerts_title_${ts}`, type: 'TEXT', x: 16, y: 64, w: 400, h: 20,
                props: { text: 'ACTIVE LOW STOCK ALERTS', fontSize: 11, fontBold: true, textColor: '#f87171', letterSpacing: 2, zIndex: 11 }
            },
            {
                id: `s3_alerts_sub_${ts}`, type: 'TEXT', x: 16, y: 64, w: 820, h: 20,
                props: { text: 'Auto-generated when qty drops below reorder threshold', fontSize: 11, textColor: '#475569', textAlign: 'right', zIndex: 11 }
            },
            {
                id: `s3_at_${ts}`, type: 'INTERACTIVE_TABLE', x: 16, y: 90, w: 820, h: 340,
                props: {
                    tableId: T.alerts,
                    label: 'Low Stock Alerts',
                    visibleColumns: ['Material_Name', 'Item_Number', 'Current_Qty', 'Reorder_Point', 'Alert_Type', 'Status', 'Timestamp'],
                    fontSize: 12,
                    headerBg: '#1e293b',
                    headerTextColor: '#94a3b8',
                    rowBg: '#0f172a',
                    rowAltBg: '#1e293b',
                    rowTextColor: '#e2e8f0',
                    borderColor: '#334155',
                    zIndex: 11
                }
            },

            // Automation Info Cards
            {
                id: `s3_auto_title_${ts}`, type: 'TEXT', x: 16, y: 442, w: 400, h: 20,
                props: { text: 'ACTIVE AUTOMATIONS', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 }
            },
            // Auto card 1
            {
                id: `s3_auto1_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 16, y: 468, w: 396, h: 88,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 }
            },
            {
                id: `s3_auto1_acc_${ts}`, type: 'SHAPE_RECTANGLE', x: 16, y: 468, w: 4, h: 88,
                props: { shapeVariant: 'rectangle', backgroundColor: '#ef4444', borderRadius: 10, borderWidth: 0, zIndex: 12 }
            },
            {
                id: `s3_auto1_icon_${ts}`, type: 'TEXT', x: 30, y: 476, w: 30, h: 24,
                props: { text: '⚡', fontSize: 18, zIndex: 12 }
            },
            {
                id: `s3_auto1_name_${ts}`, type: 'TEXT', x: 62, y: 476, w: 342, h: 18,
                props: { text: 'Low Stock Alert Automation', fontSize: 13, fontBold: true, textColor: '#f8fafc', zIndex: 12 }
            },
            {
                id: `s3_auto1_active_${ts}`, type: 'TEXT', x: 62, y: 494, w: 342, h: 14,
                props: { text: '● ACTIVE', fontSize: 10, fontBold: true, textColor: '#10b981', zIndex: 12 }
            },
            {
                id: `s3_auto1_desc_${ts}`, type: 'TEXT', x: 62, y: 510, w: 342, h: 36,
                props: { text: 'TABLE_ROW_UPDATED → qty < Reorder_Point → CREATE alert + NOTIFY manager', fontSize: 10, textColor: '#64748b', zIndex: 12 }
            },
            // Auto card 2
            {
                id: `s3_auto2_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 428, y: 468, w: 408, h: 88,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 }
            },
            {
                id: `s3_auto2_acc_${ts}`, type: 'SHAPE_RECTANGLE', x: 428, y: 468, w: 4, h: 88,
                props: { shapeVariant: 'rectangle', backgroundColor: '#6366f1', borderRadius: 10, borderWidth: 0, zIndex: 12 }
            },
            {
                id: `s3_auto2_icon_${ts}`, type: 'TEXT', x: 442, y: 476, w: 30, h: 24,
                props: { text: '⏱', fontSize: 18, zIndex: 12 }
            },
            {
                id: `s3_auto2_name_${ts}`, type: 'TEXT', x: 476, y: 476, w: 352, h: 18,
                props: { text: 'Daily Inventory Check', fontSize: 13, fontBold: true, textColor: '#f8fafc', zIndex: 12 }
            },
            {
                id: `s3_auto2_active_${ts}`, type: 'TEXT', x: 476, y: 494, w: 352, h: 14,
                props: { text: '● ACTIVE  ·  Runs daily @ 06:00', fontSize: 10, fontBold: true, textColor: '#10b981', zIndex: 12 }
            },
            {
                id: `s3_auto2_desc_${ts}`, type: 'TEXT', x: 476, y: 510, w: 352, h: 36,
                props: { text: 'TIMER → scan all materials → flag items below reorder point → log report', fontSize: 10, textColor: '#64748b', zIndex: 12 }
            },

            // ── RIGHT PANEL ────────────────────────────────────────────────────
            {
                id: `s3_div_${ts}`, type: 'SHAPE_RECTANGLE', x: 840, y: 52, w: 1, h: 628,
                props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 10 }
            },
            {
                id: `s3_right_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 841, y: 52, w: 439, h: 628,
                props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, borderRadius: 0, zIndex: 10 }
            },
            {
                id: `s3_sm_title_${ts}`, type: 'TEXT', x: 860, y: 64, w: 400, h: 20,
                props: { text: 'SESSION SUMMARY', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 }
            },

            // Summary KPI 1: Completed Today
            {
                id: `s3_sm1_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 860, y: 90, w: 402, h: 90,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 }
            },
            {
                id: `s3_sm1_acc_${ts}`, type: 'SHAPE_RECTANGLE', x: 860, y: 90, w: 4, h: 90,
                props: { shapeVariant: 'rectangle', backgroundColor: '#10b981', borderRadius: 10, borderWidth: 0, zIndex: 12 }
            },
            {
                id: `s3_sm1_lbl_${ts}`, type: 'TEXT', x: 876, y: 100, w: 378, h: 16,
                props: { text: 'COMPLETED TODAY', fontSize: 10, fontBold: true, textColor: '#64748b', letterSpacing: 1, zIndex: 12 }
            },
            {
                id: `s3_sm1_val_${ts}`, type: 'TEXT_INPUT', x: 876, y: 118, w: 378, h: 52,
                props: { label: '', targetVariable: 'Completed_Today', readOnly: true, fontSize: 34, fontBold: true, textColor: '#34d399', backgroundColor: 'transparent', borderWidth: 0, zIndex: 12 }
            },

            // Summary KPI 2: To Be Kitted
            {
                id: `s3_sm2_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 860, y: 192, w: 402, h: 90,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 }
            },
            {
                id: `s3_sm2_acc_${ts}`, type: 'SHAPE_RECTANGLE', x: 860, y: 192, w: 4, h: 90,
                props: { shapeVariant: 'rectangle', backgroundColor: '#f59e0b', borderRadius: 10, borderWidth: 0, zIndex: 12 }
            },
            {
                id: `s3_sm2_lbl_${ts}`, type: 'TEXT', x: 876, y: 202, w: 378, h: 16,
                props: { text: 'TO BE KITTED', fontSize: 10, fontBold: true, textColor: '#64748b', letterSpacing: 1, zIndex: 12 }
            },
            {
                id: `s3_sm2_val_${ts}`, type: 'TEXT_INPUT', x: 876, y: 220, w: 378, h: 52,
                props: { label: '', targetVariable: 'To_Be_Kitted', readOnly: true, fontSize: 34, fontBold: true, textColor: '#fbbf24', backgroundColor: 'transparent', borderWidth: 0, zIndex: 12 }
            },

            // Summary KPI 3: In Queue
            {
                id: `s3_sm3_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 860, y: 294, w: 402, h: 90,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 }
            },
            {
                id: `s3_sm3_acc_${ts}`, type: 'SHAPE_RECTANGLE', x: 860, y: 294, w: 4, h: 90,
                props: { shapeVariant: 'rectangle', backgroundColor: '#6366f1', borderRadius: 10, borderWidth: 0, zIndex: 12 }
            },
            {
                id: `s3_sm3_lbl_${ts}`, type: 'TEXT', x: 876, y: 304, w: 378, h: 16,
                props: { text: 'IN QUEUE AT ASSEMBLY', fontSize: 10, fontBold: true, textColor: '#64748b', letterSpacing: 1, zIndex: 12 }
            },
            {
                id: `s3_sm3_val_${ts}`, type: 'TEXT_INPUT', x: 876, y: 322, w: 378, h: 52,
                props: { label: '', targetVariable: 'In_Queue', readOnly: true, fontSize: 34, fontBold: true, textColor: '#818cf8', backgroundColor: 'transparent', borderWidth: 0, zIndex: 12 }
            },

            // Summary alert count
            {
                id: `s3_sm4_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 860, y: 396, w: 402, h: 90,
                props: { shapeVariant: 'rectangle', backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444', borderWidth: 1, borderRadius: 10, zIndex: 11 }
            },
            {
                id: `s3_sm4_acc_${ts}`, type: 'SHAPE_RECTANGLE', x: 860, y: 396, w: 4, h: 90,
                props: { shapeVariant: 'rectangle', backgroundColor: '#ef4444', borderRadius: 10, borderWidth: 0, zIndex: 12 }
            },
            {
                id: `s3_sm4_lbl_${ts}`, type: 'TEXT', x: 876, y: 406, w: 378, h: 16,
                props: { text: 'ACTIVE ALERTS', fontSize: 10, fontBold: true, textColor: '#64748b', letterSpacing: 1, zIndex: 12 }
            },
            {
                id: `s3_sm4_val_${ts}`, type: 'TEXT', x: 876, y: 424, w: 200, h: 52,
                props: { text: 'See table →', fontSize: 20, fontBold: true, textColor: '#f87171', zIndex: 12 }
            },

            // ── COMPLETE SESSION BUTTON ────────────────────────────────────────
            {
                id: `s3_cmb_${ts}`, type: 'BUTTON', x: 860, y: 508, w: 402, h: 60,
                props: {
                    label: '✅  COMPLETE SESSION', text: '✅  COMPLETE SESSION',
                    backgroundColor: '#15803d', textColor: '#ffffff', borderRadius: 12, fontSize: 18, fontBold: true, zIndex: 12,
                    triggers: [{ name: 'Done', event: 'ON_CLICK', actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'Timestamp', valueType: 'EXPRESSION', value: 'new Date().toISOString()' } },
                        { type: 'SHOW_MESSAGE', payload: { message: 'Session complete! All alerts logged & notifications sent.', msgType: 'success' } },
                        { type: 'COMPLETE_APP' }
                    ] }]
                }
            },
            {
                id: `s3_cmb_sub_${ts}`, type: 'TEXT', x: 860, y: 576, w: 402, h: 16,
                props: { text: 'Closes session & submits final inventory snapshot', fontSize: 11, textColor: '#475569', textAlign: 'center', zIndex: 12 }
            },

            // ── FOOTER ────────────────────────────────────────────────────────
            {
                id: `s3_footer_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 680, w: 1280, h: 40,
                props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 }
            },
            {
                id: `s3_footer_txt_${ts}`, type: 'TEXT', x: 20, y: 688, w: 700, h: 20,
                props: { text: 'Screen 3 of 3  ·  Alerts auto-generate via TABLE_ROW_UPDATED automation  ·  TIMER daily @ 06:00', fontSize: 11, textColor: '#475569', zIndex: 11 }
            },
            {
                id: `s3_footer_user_${ts}`, type: 'TEXT', x: 900, y: 688, w: 360, h: 20,
                props: { text: 'Operator: @APP_INFO.USER  ·  @Timestamp', fontSize: 11, textColor: '#475569', textAlign: 'right', zIndex: 11 }
            }
        ]
    };

    // ── Automation Definitions ──
    const automations = [
        {
            id: `auto_lowstock_${ts}`,
            name: 'Low Stock Alert Automation',
            description: 'When a material record is updated and qty drops below reorder point, create alert + notify manager',
            active: true,
            triggers: [{ id: `trig_rowupd_${ts}`, type: 'TABLE_ROW_UPDATED', config: { tableId: T.materials, condition: { field: 'Current_Qty', operator: '<', value: 'Reorder_Point' } } }],
            nodes: [
                { id: 'start', type: 'event', position: { x: 250, y: 50 }, data: { label: 'Material Updated' } },
                { id: 'check', type: 'decision', position: { x: 250, y: 180 }, data: { label: 'Qty < Reorder?', condition: { field: 'Current_Qty', operator: '<', value: 'Reorder_Point' } } },
                { id: 'createAlert', type: 'action', position: { x: 100, y: 320 }, data: { type: 'CREATE_RECORD', tableId: T.alerts, data: { Alert_Type: 'LOW_STOCK', Status: 'OPEN' } } },
                { id: 'notify', type: 'action', position: { x: 100, y: 440 }, data: { type: 'SEND_NOTIFICATION', recipient: 'warehouse_manager@company.com', message: 'LOW STOCK ALERT: Material below reorder point!' } },
                { id: 'log', type: 'action', position: { x: 400, y: 320 }, data: { type: 'LOG_MESSAGE', message: 'Low stock automation executed' } }
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
                { id: 'start', type: 'functionCall', position: { x: 250, y: 50 }, data: { label: 'On Transaction Added' } },
                { id: 'calc', type: 'expression', position: { x: 250, y: 180 }, data: { expression: 'Current_Qty * Unit_Cost', outputVar: 'Stock_Value' } },
                { id: 'save', type: 'action', position: { x: 250, y: 320 }, data: { type: 'LOG_MESSAGE', message: 'Stock value recalculated' } }
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
                { id: 'start', type: 'functionCall', position: { x: 250, y: 50 }, data: { label: 'On Material Updated' } },
                { id: 'check', type: 'decision', position: { x: 250, y: 180 }, data: { label: 'Below reorder?', condition: { field: 'Current_Qty', operator: '<=', value: 'Reorder_Point' } } },
                { id: 'setLow', type: 'action', position: { x: 100, y: 320 }, data: { type: 'LOG_MESSAGE', message: 'Status → LOW_STOCK' } },
                { id: 'setOk', type: 'action', position: { x: 400, y: 320 }, data: { type: 'LOG_MESSAGE', message: 'Status → IN_STOCK' } }
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
            previewDevice: 'RESPONSIVE',
            scalingMode: 'FIT_WIDTH',
            appBackgroundColor: '#0f172a',
            appVariables,
            recordPlaceholders: [
                { id: `rp_tx_${ts}`, name: 'Transaction_Record', tableId: T.transactions, description: 'Material transaction' },
                { id: `rp_alert_${ts}`, name: 'Alert_Record', tableId: T.alerts, description: 'Low stock alert' }
            ],
            appTables: [T.materials, T.transactions, T.alerts, T.suppliers],
            appTriggers: [{ id: `trg_${ts}`, name: 'Inventory Start', event: 'ON_APP_START', actions: [{ type: 'SHOW_MESSAGE', payload: { message: 'Inventory Module Ready — Automations Active', msgType: 'info' } }] }],
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
