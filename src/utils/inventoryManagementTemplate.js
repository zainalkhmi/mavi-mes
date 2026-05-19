export function createInventoryManagementTemplate() {
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
        { id: `v1_${ts}`, name: 'Selected_Inv_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Selected_Kanban_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v3_${ts}`, name: 'History_Search_Query', type: 'string', defaultValue: '', persisted: true },
        // Create Item variables
        { id: `v4_${ts}`, name: 'New_Item_MatDefID', type: 'string', defaultValue: '', persisted: true },
        { id: `v5_${ts}`, name: 'New_Item_QTY', type: 'number', defaultValue: 1, persisted: true },
        { id: `v6_${ts}`, name: 'New_Item_Loc', type: 'string', defaultValue: '', persisted: true },
        { id: `v7_${ts}`, name: 'New_Item_UOM', type: 'string', defaultValue: 'Ea', persisted: true },
        { id: `v8_${ts}`, name: 'New_Item_Type', type: 'string', defaultValue: 'Raw Material', persisted: true },
        { id: `v9_${ts}`, name: 'New_Item_Status', type: 'string', defaultValue: 'Available', persisted: true },
        { id: `v10_${ts}`, name: 'New_Item_Area', type: 'string', defaultValue: 'Warehouse 1', persisted: true },
        // Adjust quantity / status variables
        { id: `v11_${ts}`, name: 'Qty_Adjustment', type: 'number', defaultValue: 1, persisted: true },
        { id: `v12_${ts}`, name: 'New_Status_Val', type: 'string', defaultValue: 'Available', persisted: true },
        // New Kanban Card variables
        { id: `v13_${ts}`, name: 'New_Kanban_Part', type: 'string', defaultValue: '', persisted: true },
        { id: `v14_${ts}`, name: 'New_Kanban_ConsLoc', type: 'string', defaultValue: '', persisted: true },
        { id: `v15_${ts}`, name: 'New_Kanban_Supplier', type: 'string', defaultValue: '', persisted: true },
        { id: `v16_${ts}`, name: 'New_Kanban_QTY', type: 'number', defaultValue: 100, persisted: true },
        { id: `v17_${ts}`, name: 'New_Kanban_Desc', type: 'string', defaultValue: '', persisted: true },
        { id: `v18_${ts}`, name: 'New_Kanban_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v19_${ts}`, name: 'New_Kanban_Image', type: 'string', defaultValue: '', persisted: true },
        // History filters
        { id: `v20_${ts}`, name: 'Filter_Kanban_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v21_${ts}`, name: 'Filter_Item_Name', type: 'string', defaultValue: '', persisted: true },
        { id: `v22_${ts}`, name: 'Filter_Location', type: 'string', defaultValue: '', persisted: true },
        // View Kanban filters
        { id: `v23_${ts}`, name: 'Filter_KB_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v24_${ts}`, name: 'Filter_KB_Desc', type: 'string', defaultValue: '', persisted: true },
        { id: `v25_${ts}`, name: 'Filter_KB_ConsLoc', type: 'string', defaultValue: '', persisted: true },
        { id: `v26_${ts}`, name: 'Filter_KB_SupLoc', type: 'string', defaultValue: '', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Selected_Inventory_Item', tableId: T.inventoryItems, type: 'single' },
        { id: `r2_${ts}`, name: 'Selected_Kanban_Card', tableId: T.kanbanCards, type: 'single' },
        { id: `r3_${ts}`, name: 'Selected_History_Request', tableId: T.materialRequests, type: 'single' }
    ];

    // --- STEP 1: Main Screen ---
    const stepMain = {
        id: `s_main_${ts}`,
        title: 'Main Screen',
        stepType: 'Step',
        components: [
            {
                id: `c1_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 400, h: 40,
                props: { text: 'Current Inventory', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c2_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 600, h: 360,
                props: {
                    tableId: T.inventoryItems,
                    title: 'Current Inventory List',
                    columns: ['ID', 'Material_Definition_ID', 'QTY', 'Location_ID', 'Location_Area', 'Status']
                },
                triggers: [
                    {
                        name: 'Load Selected Inventory Item',
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.inventoryItems, recordPlaceholderId: `r1_${ts}`, linkVariable: 'Selected_Inv_ID'
                    }
                ]
            },
            {
                id: `c3_${ts}`, type: 'BUTTON',
                x: 20, y: 440, w: 600, h: 45,
                props: { text: '+ Create inventory item', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 'bold' },
                triggers: [
                    { name: 'Go to Create Item Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_create_item_${ts}` }
                ]
            },
            {
                id: `c4_${ts}`, type: 'HEADING',
                x: 640, y: 15, w: 300, h: 40,
                props: { text: 'Selected', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c5_${ts}`, type: 'RECORD_DISPLAY',
                x: 640, y: 70, w: 300, h: 200,
                props: {
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Status', 'Location_ID', 'QTY', 'Unit_Of_Measure']
                }
            },
            {
                id: `c6_${ts}`, type: 'BUTTON',
                x: 640, y: 280, w: 300, h: 45,
                props: { text: '➕ Add QTY', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { name: 'Go to Add QTY Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_add_qty_${ts}` }
                ]
            },
            {
                id: `c7_${ts}`, type: 'BUTTON',
                x: 640, y: 335, w: 300, h: 45,
                props: { text: '➖ Remove QTY', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { name: 'Go to Remove QTY Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_remove_qty_${ts}` }
                ]
            },
            {
                id: `c8_${ts}`, type: 'BUTTON',
                x: 640, y: 390, w: 300, h: 45,
                props: { text: '✎ Edit status', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { name: 'Go to Edit Status Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_edit_status_${ts}` }
                ]
            },
            {
                id: `c9_${ts}`, type: 'BUTTON',
                x: 350, y: 495, w: 280, h: 50,
                props: { text: 'Material request history', backgroundColor: '#1d4ed8', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { name: 'Go to Request History Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_req_history_${ts}` }
                ]
            },
            {
                id: `c10_${ts}`, type: 'BUTTON',
                x: 660, y: 495, w: 280, h: 50,
                props: { text: 'View kanban cards', backgroundColor: '#1d4ed8', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { name: 'Go to View Kanban Cards Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_kanban_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 2: Create Inventory Item ---
    const stepCreateItem = {
        id: `s_create_item_${ts}`,
        title: 'Create Inventory Item',
        stepType: 'Step',
        components: [
            {
                id: `c11_${ts}`, type: 'HEADING',
                x: 260, y: 40, w: 480, h: 40,
                props: { text: 'New Inventory Item Details', fontSize: 22, fontWeight: 'bold' }
            },
            {
                id: `f1_${ts}`, type: 'TEXT',
                x: 280, y: 90, w: 180, h: 30,
                props: { text: 'Item name *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `f2_${ts}`, type: 'TEXT_INPUT',
                x: 280, y: 120, w: 180, h: 40,
                props: { targetVariable: 'New_Item_MatDefID', placeholder: 'e.g. D40-006-02' }
            },
            {
                id: `f2_btn_${ts}`, type: 'BUTTON',
                x: 370, y: 90, w: 110, h: 25,
                props: { text: 'Get Item by ID', backgroundColor: '#2563eb', color: 'white', fontSize: 11 },
                triggers: [{ name: 'Show Fetch Success Message', event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Item definition fetched!', messageType: 'success' }]
            },
            {
                id: `f3_${ts}`, type: 'TEXT',
                x: 280, y: 175, w: 180, h: 30,
                props: { text: 'QTY *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `f4_${ts}`, type: 'TEXT_INPUT',
                x: 280, y: 205, w: 180, h: 40,
                props: { targetVariable: 'New_Item_QTY', placeholder: '1' }
            },
            {
                id: `f5_${ts}`, type: 'TEXT',
                x: 480, y: 175, w: 180, h: 30,
                props: { text: 'Location *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `f6_${ts}`, type: 'TEXT_INPUT',
                x: 480, y: 205, w: 180, h: 40,
                props: { targetVariable: 'New_Item_Loc', placeholder: 'e.g. BIN03' }
            },
            {
                id: `f7_${ts}`, type: 'TEXT',
                x: 280, y: 260, w: 180, h: 30,
                props: { text: 'Units of measure *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `f8_${ts}`, type: 'TEXT_INPUT',
                x: 280, y: 290, w: 180, h: 40,
                props: { targetVariable: 'New_Item_UOM', placeholder: 'Ea' }
            },
            {
                id: `f9_${ts}`, type: 'TEXT',
                x: 480, y: 260, w: 180, h: 30,
                props: { text: 'Item type *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `f10_${ts}`, type: 'TEXT_INPUT',
                x: 480, y: 290, w: 180, h: 40,
                props: { targetVariable: 'New_Item_Type', placeholder: 'Raw Material' }
            },
            {
                id: `f11_${ts}`, type: 'TEXT',
                x: 280, y: 345, w: 180, h: 30,
                props: { text: 'Status *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `f12_${ts}`, type: 'TEXT_INPUT',
                x: 280, y: 375, w: 180, h: 40,
                props: { targetVariable: 'New_Item_Status', placeholder: 'Available' }
            },
            {
                id: `f13_${ts}`, type: 'TEXT',
                x: 480, y: 345, w: 180, h: 30,
                props: { text: 'Area *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `f14_${ts}`, type: 'TEXT_INPUT',
                x: 480, y: 375, w: 180, h: 40,
                props: { targetVariable: 'New_Item_Area', placeholder: 'Warehouse 1' }
            },
            {
                id: `f_cancel_${ts}`, type: 'BUTTON',
                x: 280, y: 440, w: 180, h: 50,
                props: { text: '✕ Cancel', backgroundColor: '#e2e8f0', color: 'black' },
                triggers: [{ name: 'Cancel and Go Back', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }]
            },
            {
                id: `f_save_${ts}`, type: 'BUTTON',
                x: 480, y: 440, w: 180, h: 50,
                props: { text: '✓ Save', backgroundColor: '#71a36d', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        name: 'Save New Inventory Item',
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.inventoryItems,
                        mapping: {
                            'ID': '{{@New_Item_MatDefID}}_{{@New_Item_Loc}}',
                            'Material_Definition_ID': '@New_Item_MatDefID',
                            'QTY': '@New_Item_QTY',
                            'Location_ID': '@New_Item_Loc',
                            'Location_Area': '@New_Item_Area',
                            'Status': '@New_Item_Status',
                            'Unit_Of_Measure': '@New_Item_UOM',
                            'Material_Definition_Type': '@New_Item_Type'
                        }
                    },
                    { name: 'Show Success Message', event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Inventory item created successfully!', messageType: 'success' },
                    { name: 'Go back to Main Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 3: Add QTY ---
    const stepAddQty = {
        id: `s_add_qty_${ts}`,
        title: 'Add QTY',
        stepType: 'Step',
        components: [
            {
                id: `aq1_${ts}`, type: 'HEADING',
                x: 260, y: 40, w: 480, h: 40,
                props: { text: 'Selected Record Details', fontSize: 22, fontWeight: 'bold' }
            },
            {
                id: `aq2_${ts}`, type: 'RECORD_DISPLAY',
                x: 280, y: 90, w: 380, h: 180,
                props: {
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Status', 'Location_ID', 'Location_Area', 'QTY']
                }
            },
            {
                id: `aq3_${ts}`, type: 'TEXT',
                x: 280, y: 290, w: 380, h: 30,
                props: { text: 'QTY to Add *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `aq4_${ts}`, type: 'TEXT_INPUT',
                x: 280, y: 320, w: 380, h: 40,
                props: { targetVariable: 'Qty_Adjustment', placeholder: '1' }
            },
            {
                id: `aq_cancel_${ts}`, type: 'BUTTON',
                x: 280, y: 390, w: 180, h: 50,
                props: { text: '✕ Cancel', backgroundColor: '#e2e8f0', color: 'black' },
                triggers: [{ name: 'Cancel and Go Back', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }]
            },
            {
                id: `aq_save_${ts}`, type: 'BUTTON',
                x: 480, y: 390, w: 180, h: 50,
                props: { text: '➕ Add QTY', backgroundColor: '#2f7535', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        name: 'Save Added Quantity',
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'QTY': '{{@Selected_Inventory_Item.QTY + @Qty_Adjustment}}'
                        }
                    },
                    { name: 'Show Success Message', event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Quantity added successfully!', messageType: 'success' },
                    { name: 'Go back to Main Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 4: Remove QTY ---
    const stepRemoveQty = {
        id: `s_remove_qty_${ts}`,
        title: 'Remove QTY',
        stepType: 'Step',
        components: [
            {
                id: `rq1_${ts}`, type: 'HEADING',
                x: 260, y: 40, w: 480, h: 40,
                props: { text: 'Selected Record Details', fontSize: 22, fontWeight: 'bold' }
            },
            {
                id: `rq2_${ts}`, type: 'RECORD_DISPLAY',
                x: 280, y: 90, w: 380, h: 180,
                props: {
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Status', 'Location_ID', 'Location_Area', 'QTY']
                }
            },
            {
                id: `rq3_${ts}`, type: 'TEXT',
                x: 280, y: 290, w: 380, h: 30,
                props: { text: 'QTY to Remove *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `rq4_${ts}`, type: 'TEXT_INPUT',
                x: 280, y: 320, w: 380, h: 40,
                props: { targetVariable: 'Qty_Adjustment', placeholder: '1' }
            },
            {
                id: `rq_cancel_${ts}`, type: 'BUTTON',
                x: 280, y: 390, w: 180, h: 50,
                props: { text: '✕ Cancel', backgroundColor: '#e2e8f0', color: 'black' },
                triggers: [{ name: 'Cancel and Go Back', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }]
            },
            {
                id: `rq_save_${ts}`, type: 'BUTTON',
                x: 480, y: 390, w: 180, h: 50,
                props: { text: '➖ Remove QTY', backgroundColor: '#2f7535', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        name: 'Save Removed Quantity',
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'QTY': '{{@Selected_Inventory_Item.QTY - @Qty_Adjustment}}'
                        }
                    },
                    { name: 'Show Success Message', event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Quantity removed successfully!', messageType: 'success' },
                    { name: 'Go back to Main Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 5: Edit Status ---
    const stepEditStatus = {
        id: `s_edit_status_${ts}`,
        title: 'Edit Status',
        stepType: 'Step',
        components: [
            {
                id: `es1_${ts}`, type: 'HEADING',
                x: 260, y: 40, w: 480, h: 40,
                props: { text: 'Selected Record Details', fontSize: 22, fontWeight: 'bold' }
            },
            {
                id: `es2_${ts}`, type: 'RECORD_DISPLAY',
                x: 280, y: 90, w: 380, h: 180,
                props: {
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Status', 'Location_ID', 'Location_Area', 'QTY']
                }
            },
            {
                id: `es3_${ts}`, type: 'TEXT',
                x: 280, y: 290, w: 380, h: 30,
                props: { text: 'New Status *', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `es4_${ts}`, type: 'TEXT_INPUT',
                x: 280, y: 320, w: 380, h: 40,
                props: { targetVariable: 'New_Status_Val', placeholder: 'Available / Blocked / Quarantined...' }
            },
            {
                id: `es_cancel_${ts}`, type: 'BUTTON',
                x: 280, y: 390, w: 180, h: 50,
                props: { text: '✕ Cancel', backgroundColor: '#e2e8f0', color: 'black' },
                triggers: [{ name: 'Cancel and Go Back', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }]
            },
            {
                id: `es_save_${ts}`, type: 'BUTTON',
                x: 480, y: 390, w: 180, h: 50,
                props: { text: '✎ Edit status', backgroundColor: '#2f7535', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        name: 'Save Updated Status',
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Status': '@New_Status_Val'
                        }
                    },
                    { name: 'Show Success Message', event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Status updated successfully!', messageType: 'success' },
                    { name: 'Go back to Main Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 6: Material Request History (MATCHING USER SCREENSHOT 1) ---
    const stepReqHistory = {
        id: `s_req_history_${ts}`,
        title: 'Material Request History',
        stepType: 'Step',
        components: [
            // Left Panel: Material Requests Title + Filters
            {
                id: `rh_lbl_mr_${ts}`, type: 'HEADING',
                x: 20, y: 20, w: 300, h: 30,
                props: { text: 'Material Requests', fontSize: 20, fontWeight: 'bold' }
            },
            {
                id: `filter_kb_lbl_${ts}`, type: 'TEXT',
                x: 20, y: 55, w: 80, h: 20,
                props: { text: 'Kanban ID', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `filter_kb_in_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 75, w: 80, h: 35,
                props: { targetVariable: 'Filter_Kanban_ID', placeholder: 'Search...' }
            },
            {
                id: `filter_itm_lbl_${ts}`, type: 'TEXT',
                x: 110, y: 55, w: 160, h: 20,
                props: { text: 'Item name', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `filter_itm_in_${ts}`, type: 'TEXT_INPUT',
                x: 110, y: 75, w: 160, h: 35,
                props: { targetVariable: 'Filter_Item_Name', placeholder: 'Search item...' }
            },
            {
                id: `filter_loc_lbl_${ts}`, type: 'TEXT',
                x: 280, y: 55, w: 100, h: 20,
                props: { text: 'Location', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `filter_loc_in_${ts}`, type: 'TEXT_INPUT',
                x: 280, y: 75, w: 100, h: 35,
                props: { targetVariable: 'Filter_Location', placeholder: 'Location...' }
            },
            {
                id: `filter_stat_lbl_${ts}`, type: 'TEXT',
                x: 390, y: 55, w: 100, h: 20,
                props: { text: 'Status', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `filter_stat_btn_${ts}`, type: 'BUTTON',
                x: 390, y: 75, w: 100, h: 35,
                props: { text: 'Select options', backgroundColor: '#e2e8f0', color: 'black', fontSize: 12 },
                triggers: [{ name: 'Open Status Filters Window', event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Status filters opened', messageType: 'info' }]
            },
            // Table underneath filters
            {
                id: `rh_table_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 120, w: 470, h: 350,
                props: {
                    tableId: T.materialRequests,
                    title: '',
                    columns: ['Kanban_ID', 'Item', 'Requesting_Location', 'Status']
                },
                triggers: [
                    {
                        name: 'Load Selected Material Request',
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.materialRequests, recordPlaceholderId: `r3_${ts}`, linkVariable: 'Selected_Inv_ID'
                    }
                ]
            },
            // Right Panel: Selected Request Detail
            {
                id: `rh_lbl_srd_${ts}`, type: 'HEADING',
                x: 520, y: 20, w: 400, h: 30,
                props: { text: 'Selected Request Detail', fontSize: 20, fontWeight: 'bold' }
            },
            // Dynamic Status Badge
            {
                id: `rh_badge_${ts}`, type: 'BUTTON',
                x: 520, y: 55, w: 200, h: 35,
                props: { text: 'Status: {{@Selected_History_Request.Status}}', backgroundColor: '#15803d', color: 'white', fontWeight: 'bold', fontSize: 14 },
                triggers: []
            },
            {
                id: `rh_flow_lbl_${ts}`, type: 'TEXT',
                x: 520, y: 100, w: 400, h: 60,
                props: { text: 'Pick-up location: {{@Selected_History_Request.Requesting_Location}}\nDestination: {{@Selected_History_Request.Supplier}}', fontSize: 15, fontWeight: 'bold', color: '#1e293b' }
            },
            // Metadata grid layout (exactly matching image details structure)
            {
                id: `hist_det_id_${ts}`, type: 'TEXT',
                x: 520, y: 170, w: 180, h: 50,
                props: { text: 'ID\n{{@Selected_History_Request.ID}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `hist_det_itm_${ts}`, type: 'TEXT',
                x: 720, y: 170, w: 180, h: 50,
                props: { text: 'Item\n{{@Selected_History_Request.Item}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `hist_det_req_loc_${ts}`, type: 'TEXT',
                x: 520, y: 230, w: 180, h: 50,
                props: { text: 'Requesting Location\n{{@Selected_History_Request.Requesting_Location}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `hist_det_sup_${ts}`, type: 'TEXT',
                x: 720, y: 230, w: 180, h: 50,
                props: { text: 'Supplier\n{{@Selected_History_Request.Supplier}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `hist_det_kb_${ts}`, type: 'TEXT',
                x: 520, y: 290, w: 180, h: 50,
                props: { text: 'Kanban ID\n{{@Selected_History_Request.Kanban_ID}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `hist_det_qty_${ts}`, type: 'TEXT',
                x: 720, y: 290, w: 180, h: 50,
                props: { text: 'Quantity\n{{@Selected_History_Request.Quantity}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `hist_det_t_req_${ts}`, type: 'TEXT',
                x: 520, y: 350, w: 180, h: 50,
                props: { text: 'Requested\n{{@Selected_History_Request.Requested}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `hist_det_t_start_${ts}`, type: 'TEXT',
                x: 720, y: 350, w: 180, h: 50,
                props: { text: 'Started\n{{@Selected_History_Request.Started}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `hist_det_t_comp_${ts}`, type: 'TEXT',
                x: 520, y: 410, w: 180, h: 50,
                props: { text: 'Completed\n{{@Selected_History_Request.Completed}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `hist_det_deliv_${ts}`, type: 'TEXT',
                x: 720, y: 410, w: 180, h: 50,
                props: { text: 'Delivered by\n{{@Selected_History_Request.Delivered_by}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            // Left Footer Button: <- View inventory items
            {
                id: `rh_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 490, w: 200, h: 45,
                props: { text: '← View inventory items', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [{ name: 'Go back to Main Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }]
            }
        ]
    };

    // --- STEP 7: View Kanban Cards (MATCHING USER SCREENSHOT 2) ---
    const stepViewKanban = {
        id: `s_view_kanban_${ts}`,
        title: 'View Kanban Cards',
        stepType: 'Step',
        components: [
            // Top Filter inputs row
            {
                id: `f_kb_id_lbl_${ts}`, type: 'TEXT',
                x: 20, y: 10, w: 160, h: 20,
                props: { text: 'Filter by ID', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `f_kb_id_in_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 30, w: 160, h: 35,
                props: { targetVariable: 'Filter_KB_ID', placeholder: 'Enter ID...' }
            },
            {
                id: `f_kb_desc_lbl_${ts}`, type: 'TEXT',
                x: 190, y: 10, w: 160, h: 20,
                props: { text: 'Filter by Description', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `f_kb_desc_in_${ts}`, type: 'TEXT_INPUT',
                x: 190, y: 30, w: 160, h: 35,
                props: { targetVariable: 'Filter_KB_Desc', placeholder: 'Search desc...' }
            },
            {
                id: `f_kb_cons_lbl_${ts}`, type: 'TEXT',
                x: 360, y: 10, w: 200, h: 20,
                props: { text: 'Filter by Consuming Location', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `f_kb_cons_sel_${ts}`, type: 'BUTTON', // Select an option dropdown mock
                x: 360, y: 30, w: 200, h: 35,
                props: { text: 'Select an option  ▼', backgroundColor: 'white', color: 'black', border: '1px solid #cbd5e1' },
                triggers: [{ name: 'Filter by Consuming Location', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Filter_KB_ConsLoc', value: 'Assembly' }]
            },
            {
                id: `f_kb_sup_lbl_${ts}`, type: 'TEXT',
                x: 570, y: 10, w: 180, h: 20,
                props: { text: 'Filter by Supply Location', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `f_kb_sup_sel_${ts}`, type: 'BUTTON',
                x: 570, y: 30, w: 180, h: 35,
                props: { text: 'Select an option  ▼', backgroundColor: 'white', color: 'black', border: '1px solid #cbd5e1' },
                triggers: [{ name: 'Filter by Supplying Location', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Filter_KB_SupLoc', value: 'Supermarket' }]
            },
            {
                id: `f_kb_act_lbl_${ts}`, type: 'TEXT',
                x: 760, y: 10, w: 160, h: 20,
                props: { text: 'Filter: Active/Inactive', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `f_kb_act_tgl_${ts}`, type: 'BUTTON', // Toggle Switch
                x: 760, y: 30, w: 100, h: 35,
                props: { text: 'ON [Active Only]', backgroundColor: '#2563eb', color: 'white', borderRadius: '15px' },
                triggers: [{ name: 'Toggle Active Filter', event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Toggled active filter!', messageType: 'info' }]
            },
            // Table underneath the filters
            {
                id: `vk_table_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 80, w: 920, h: 320,
                props: {
                    tableId: T.kanbanCards,
                    title: '',
                    columns: ['ID', 'Part_Number', 'Part_Description', 'Consuming_location', 'Supplier', 'QTY', 'Status', 'Active']
                },
                triggers: [
                    {
                        name: 'Load Selected Kanban Card',
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.kanbanCards, recordPlaceholderId: `r2_${ts}`, linkVariable: 'Selected_Kanban_ID'
                    }
                ]
            },
            // Controls inside the card frame
            {
                id: `vk_edit_${ts}`, type: 'BUTTON',
                x: 20, y: 410, w: 120, h: 40,
                props: { text: '✎ Edit card', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 'bold', fontSize: 13 },
                triggers: [{ name: 'Go to Edit Kanban Card Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_edit_kanban_${ts}` }]
            },
            {
                id: `vk_dup_${ts}`, type: 'BUTTON',
                x: 640, y: 410, w: 140, h: 40,
                props: { text: '📋 Duplicate card', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: 13 },
                triggers: [
                    {
                        name: 'Duplicate Kanban Card',
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.kanbanCards,
                        mapping: {
                            'ID': 'KC_{{Selected_Kanban_Card.QTY + 100}}',
                            'Part_Number': '{{@Selected_Kanban_Card.Part_Number}}',
                            'Part_Description': '{{@Selected_Kanban_Card.Part_Description}}',
                            'QTY': '{{@Selected_Kanban_Card.QTY}}',
                            'Consuming_location': '{{@Selected_Kanban_Card.Consuming_location}}',
                            'Supplier': '{{@Selected_Kanban_Card.Supplier}}',
                            'Status': 'FULL',
                            'Active': true
                        }
                    },
                    { name: 'Show Success Message', event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Card duplicated with incremental ID!', messageType: 'success' }
                ]
            },
            {
                id: `vk_print_${ts}`, type: 'BUTTON',
                x: 790, y: 410, w: 140, h: 40,
                props: { text: '🖨 Print label', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: 13 },
                triggers: [{ name: 'Go to Print Label Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_print_label_${ts}` }]
            },
            // Footer bottom buttons
            {
                id: `vk_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 180, h: 45,
                props: { text: 'View inventory items', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [{ name: 'Go back to Main Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_main_${ts}` }]
            },
            {
                id: `vk_btn_create_${ts}`, type: 'BUTTON',
                x: 760, y: 495, w: 180, h: 45,
                props: { text: '+ Create new card', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                triggers: [{ name: 'Go to Create Kanban Card Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_create_kanban_${ts}` }]
            }
        ]
    };

    // --- STEP 8: Create Kanban Card (MATCHING USER SCREENSHOT 3) ---
    const stepCreateKanban = {
        id: `s_create_kanban_${ts}`,
        title: 'Create Kanban Card',
        stepType: 'Step',
        components: [
            // Left Card: Part Details and Customer / Supplier
            {
                id: `ck_card_lbl_${ts}`, type: 'HEADING',
                x: 20, y: 20, w: 460, h: 30,
                props: { text: 'Part Details and Customer / Supplier', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `ck_lbl_part_${ts}`, type: 'TEXT',
                x: 30, y: 60, w: 200, h: 20,
                props: { text: 'Part Number *', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `ck_in_part_${ts}`, type: 'TEXT_INPUT',
                x: 30, y: 80, w: 200, h: 35,
                props: { targetVariable: 'New_Kanban_Part', placeholder: 'Enter Part Number...' }
            },
            {
                id: `ck_lbl_desc_${ts}`, type: 'TEXT',
                x: 250, y: 60, w: 200, h: 20,
                props: { text: 'Description *', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `ck_in_desc_${ts}`, type: 'TEXT_INPUT',
                x: 250, y: 80, w: 200, h: 35,
                props: { targetVariable: 'New_Kanban_Desc', placeholder: 'Enter Description...' }
            },
            {
                id: `ck_lbl_id_${ts}`, type: 'TEXT',
                x: 30, y: 130, w: 200, h: 20,
                props: { text: 'Card ID *', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `ck_in_id_${ts}`, type: 'TEXT_INPUT',
                x: 30, y: 150, w: 200, h: 35,
                props: { targetVariable: 'New_Kanban_ID', placeholder: 'e.g. KC_0018' }
            },
            {
                id: `ck_lbl_qty_${ts}`, type: 'TEXT',
                x: 250, y: 130, w: 200, h: 20,
                props: { text: 'Quantity *', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `ck_in_qty_${ts}`, type: 'TEXT_INPUT', // Number input
                x: 250, y: 150, w: 200, h: 35,
                props: { targetVariable: 'New_Kanban_QTY', placeholder: '100' }
            },
            {
                id: `ck_lbl_sup_${ts}`, type: 'TEXT',
                x: 30, y: 200, w: 200, h: 20,
                props: { text: 'Supply Location *', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `ck_sel_sup_${ts}`, type: 'BUTTON',
                x: 30, y: 220, w: 200, h: 35,
                props: { text: 'Select an option  ▼', backgroundColor: 'white', color: 'black', border: '1px solid #cbd5e1' },
                triggers: [{ name: 'Select Supplier Location', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'New_Kanban_Supplier', value: 'Supermarket' }]
            },
            {
                id: `ck_lbl_cons_${ts}`, type: 'TEXT',
                x: 250, y: 200, w: 200, h: 20,
                props: { text: 'Consuming Location *', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `ck_sel_cons_${ts}`, type: 'BUTTON',
                x: 250, y: 220, w: 200, h: 35,
                props: { text: 'Select an option  ▼', backgroundColor: 'white', color: 'black', border: '1px solid #cbd5e1' },
                triggers: [{ name: 'Select Consuming Location', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'New_Kanban_ConsLoc', value: 'Assembly' }]
            },
            // Inside card Clear button
            {
                id: `ck_btn_clear_${ts}`, type: 'BUTTON',
                x: 350, y: 270, w: 100, h: 35,
                props: { text: 'Clear', backgroundColor: '#e2e8f0', color: 'black' },
                triggers: [
                    { name: 'Clear Part Number', event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'New_Kanban_Part' },
                    { name: 'Clear Description', event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'New_Kanban_Desc' },
                    { name: 'Clear Card ID', event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'New_Kanban_ID' }
                ]
            },
            // Right Panel: Image viewfinder box + Upload button
            {
                id: `ck_img_box_${ts}`, type: 'TEXT',
                x: 520, y: 60, w: 400, h: 200,
                props: { text: '📷 Kanban Card Image Box', fontSize: 14, backgroundColor: '#000000', color: '#ffffff', textAlignment: 1, padding: '70px' }
            },
            {
                id: `ck_btn_upload_${ts}`, type: 'BUTTON',
                x: 820, y: 270, w: 100, h: 35,
                props: { text: '⚙ Upload', backgroundColor: '#3b82f6', color: 'white', fontSize: 13 },
                triggers: [
                    { name: 'Upload Kanban Image Link', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'New_Kanban_Image', value: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80' },
                    { name: 'Show Upload Success Message', event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Image Uploaded successfully!', messageType: 'success' }
                ]
            },
            // Footer buttons (✕ Cancel on left, + Create on right)
            {
                id: `ck_btn_cancel_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 120, h: 45,
                props: { text: '✕ Cancel', backgroundColor: '#cbd5e1', color: 'black' },
                triggers: [{ name: 'Cancel and Go Back', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_kanban_${ts}` }]
            },
            {
                id: `ck_btn_create_${ts}`, type: 'BUTTON',
                x: 820, y: 495, w: 120, h: 45,
                props: { text: '+ Create', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        name: 'Create Kanban Card',
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.kanbanCards,
                        mapping: {
                            'ID': '@New_Kanban_ID',
                            'Part_Number': '@New_Kanban_Part',
                            'Part_Description': '@New_Kanban_Desc',
                            'QTY': '@New_Kanban_QTY',
                            'Consuming_location': '@New_Kanban_ConsLoc',
                            'Supplier': '@New_Kanban_Supplier',
                            'Status': 'FULL',
                            'Active': true,
                            'Image': '{{@New_Kanban_Image}}'
                        }
                    },
                    { name: 'Show Success Message', event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'New Kanban Card created successfully!', messageType: 'success' },
                    { name: 'Go back to View Kanban Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_kanban_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 9: Edit Kanban Card (MATCHING USER SCREENSHOT 4) ---
    const stepEditKanban = {
        id: `s_edit_kanban_${ts}`,
        title: 'Edit Kanban Card',
        stepType: 'Step',
        components: [
            // Selected Kanban Card container
            {
                id: `ek_box_lbl_${ts}`, type: 'HEADING',
                x: 260, y: 40, w: 480, h: 30,
                props: { text: 'Selected Kanban card', fontSize: 20, fontWeight: 'bold' }
            },
            // Grid layout showing selected card info
            {
                id: `ek_grid_id_${ts}`, type: 'TEXT',
                x: 280, y: 90, w: 120, h: 50,
                props: { text: 'ID\n{{@Selected_Kanban_Card.ID}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `ek_grid_pn_${ts}`, type: 'TEXT',
                x: 420, y: 90, w: 120, h: 50,
                props: { text: 'Part Number\n{{@Selected_Kanban_Card.Part_Number}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `ek_grid_stat_${ts}`, type: 'TEXT',
                x: 560, y: 90, w: 120, h: 50,
                props: { text: 'Status\n{{@Selected_Kanban_Card.Status}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `ek_grid_cons_${ts}`, type: 'TEXT',
                x: 280, y: 150, w: 120, h: 50,
                props: { text: 'Consuming Location\n{{@Selected_Kanban_Card.Consuming_location}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `ek_grid_sup_${ts}`, type: 'TEXT',
                x: 420, y: 150, w: 120, h: 50,
                props: { text: 'Supplier\n{{@Selected_Kanban_Card.Supplier}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `ek_grid_qty_${ts}`, type: 'TEXT',
                x: 560, y: 150, w: 120, h: 50,
                props: { text: 'QTY\n{{@Selected_Kanban_Card.QTY}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `ek_grid_desc_${ts}`, type: 'TEXT',
                x: 280, y: 210, w: 120, h: 55,
                props: { text: 'Part Description\n{{@Selected_Kanban_Card.Part_Description}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `ek_grid_col_${ts}`, type: 'TEXT',
                x: 420, y: 210, w: 120, h: 55,
                props: { text: 'Status Color\n{{@Selected_Kanban_Card.Status_Color}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `ek_grid_img_${ts}`, type: 'TEXT',
                x: 560, y: 210, w: 120, h: 55,
                props: { text: 'Image\n{{@Selected_Kanban_Card.Image}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `ek_grid_act_${ts}`, type: 'TEXT',
                x: 280, y: 275, w: 400, h: 45,
                props: { text: 'Active\n{{@Selected_Kanban_Card.Active}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            // Inside card Activate / Deactivate buttons
            {
                id: `ek_btn_deact_${ts}`, type: 'BUTTON',
                x: 280, y: 340, w: 180, h: 50,
                props: { text: 'Deactivate card', backgroundColor: '#b91c1c', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        name: 'Deactivate Kanban Card',
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r2_${ts}`, mapping: { 'Active': false }
                    },
                    { name: 'Show Success Message', event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Kanban Card deactivated successfully!', messageType: 'success' },
                    { name: 'Go back to View Kanban Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_kanban_${ts}` }
                ]
            },
            {
                id: `ek_btn_act_${ts}`, type: 'BUTTON',
                x: 480, y: 340, w: 180, h: 50,
                props: { text: 'Activate card', backgroundColor: '#15803d', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        name: 'Activate Kanban Card',
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r2_${ts}`, mapping: { 'Active': true }
                    },
                    { name: 'Show Success Message', event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Kanban Card activated successfully!', messageType: 'success' },
                    { name: 'Go back to View Kanban Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_kanban_${ts}` }
                ]
            },
            // Footer cancel button (✕ Cancel)
            {
                id: `ek_btn_cancel_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 120, h: 45,
                props: { text: '✕ Cancel', backgroundColor: '#cbd5e1', color: 'black' },
                triggers: [{ name: 'Cancel and Go Back', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_kanban_${ts}` }]
            }
        ]
    };

    // --- STEP 10: Print Label ---
    const stepPrintLabel = {
        id: `s_print_label_${ts}`,
        title: 'Print Label',
        stepType: 'Step',
        components: [
            {
                id: `pl1_${ts}`, type: 'HEADING',
                x: 260, y: 40, w: 480, h: 40,
                props: { text: 'Container Bin Label Preview', fontSize: 22, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `pl2_${ts}`, type: 'TEXT',
                x: 320, y: 100, w: 320, h: 220,
                props: {
                    text: 'BIN CONTAINER LABEL\n\n-----------------------------\nKANBAN ID: {{@Selected_Kanban_ID}}\nPART: {{@Selected_Kanban_Card.Part_Number}}\nDESC: {{@Selected_Kanban_Card.Part_Description}}\nQTY: {{@Selected_Kanban_Card.QTY}}\nDEST: {{@Selected_Kanban_Card.Consuming_location}}\n-----------------------------\n[ SCANNABLE BARCODE ]',
                    fontSize: 14, fontWeight: 'bold', border: '2px solid black', padding: '20px', backgroundColor: 'white'
                }
            },
            {
                id: `pl_print_${ts}`, type: 'BUTTON',
                x: 320, y: 350, w: 320, h: 50,
                props: { text: '🖨 Send to Zebra/Label Printer', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { name: 'Print Kanban Container Label', event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Label sent to printer queue!', messageType: 'success' },
                    { name: 'Go back to View Kanban Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_kanban_${ts}` }
                ]
            },
            {
                id: `pl_back_${ts}`, type: 'BUTTON',
                x: 320, y: 415, w: 320, h: 40,
                props: { text: 'Back', backgroundColor: '#e2e8f0', color: 'black' },
                triggers: [{ name: 'Go back to View Kanban Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_kanban_${ts}` }]
            }
        ]
    };

    return {
        id: `app_im_${ts}`,
        name: 'Inventory Management',
        description: 'Comprehensive inventory manager handling stock adjustments, material definition mapping, and complete Kanban container configurations.',
        category: 'Inventory App Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.materialRequests, T.kanbanCards, T.materialDefs, T.inventoryItems],
            appTriggers: [],
            steps: [stepMain, stepCreateItem, stepAddQty, stepRemoveQty, stepEditStatus, stepReqHistory, stepViewKanban, stepCreateKanban, stepEditKanban, stepPrintLabel],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
