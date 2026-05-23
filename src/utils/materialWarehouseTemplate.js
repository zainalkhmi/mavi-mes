export function createMaterialWarehouseTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        inventoryItems: 'tbl_mw_inventory_items',
        materialDefs: 'tbl_mw_material_definitions'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Warehouse_Action', type: 'string', defaultValue: 'ADD', persisted: true },
        { id: `v2_${ts}`, name: 'Scanned_Part_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v3_${ts}`, name: 'Qty_To_Transact', type: 'number', defaultValue: 1, persisted: true },
        { id: `v4_${ts}`, name: 'New_Bin_Location', type: 'string', defaultValue: '', persisted: true },
        { id: `v5_${ts}`, name: 'Selected_Inv_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v6_${ts}`, name: 'Inventory_Filter', type: 'string', defaultValue: '', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Selected_Material_Def', tableId: T.materialDefs, type: 'single' },
        { id: `r2_${ts}`, name: 'Selected_Inventory_Item', tableId: T.inventoryItems, type: 'single' }
    ];

    // --- STEP 1: Home (MATCHING USER SCREENSHOT 1) ---
    const stepHome = {
        id: `s_home_${ts}`,
        title: 'Home',
        stepType: 'Step',
        components: [
            // Centered Stack of 2 Large Action Buttons
            {
                id: `home_btn_add_${ts}`, type: 'BUTTON',
                x: 280, y: 100, w: 440, h: 140,
                props: { text: 'Add Item to Inventory', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: 24 },
                triggers: [
                    { id: `trg_home_add_set_${ts}`, name: 'Set Action to ADD', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Warehouse_Action', value: 'ADD' },
                    { id: `trg_home_add_nav_${ts}`, name: 'Go to Scan Item Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_scan_item_${ts}` }
                ]
            },
            {
                id: `home_btn_change_${ts}`, type: 'BUTTON',
                x: 280, y: 260, w: 440, h: 140,
                props: { text: 'Change Item Location', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: 24 },
                triggers: [
                    { id: `trg_home_change_set_${ts}`, name: 'Set Action to MOVE', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Warehouse_Action', value: 'MOVE' },
                    { id: `trg_home_change_nav_${ts}`, name: 'Go to Inventory Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_inventory_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 2: Scan Item (MATCHING USER SCREENSHOT 2) ---
    const stepScanItem = {
        id: `s_scan_item_${ts}`,
        title: 'Scan Item',
        stepType: 'Step',
        components: [
            {
                id: `scan_card_lbl_${ts}`, type: 'HEADING',
                x: 240, y: 50, w: 520, h: 35,
                props: { text: 'Scan item part number', fontSize: 22, fontWeight: 'bold', textAlignment: 1 }
            },
            // Scanner component instead of viewport & simulation button
            {
                id: `scan_real_scanner_${ts}`, type: 'BARCODE_SCANNER',
                x: 260, y: 150, w: 480, h: 55,
                props: { label: 'Part Number Barcode', placeholder: 'Scan or type part number...', targetVariable: 'Scanned_Part_ID' },
                triggers: [
                    {
                        id: `trg_scan_load_def_${ts}`, name: 'Load Material Definition',
                        event: 'ON_SCAN', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.materialDefs, recordPlaceholderId: `r1_${ts}`, linkVariable: 'Scanned_Part_ID'
                    },
                    { id: `trg_scan_success_msg_${ts}`, name: 'Show Scan Success Message', event: 'ON_SCAN', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Part scanned successfully!', messageType: 'success' },
                    { id: `trg_scan_go_type_${ts}`, name: 'Go to Type Quantity Step', event: 'ON_SCAN', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_type_item_${ts}` }
                ]
            },
            // Footer previous button
            {
                id: `scan_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Previous', backgroundColor: '#e2e8f0', color: '#1e40af', fontWeight: 'bold' },
                triggers: [{ id: `trg_scan_prev_go_${ts}`, name: 'Go back to Home', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_home_${ts}` }]
            }
        ]
    };

    // --- STEP 3: Type Item (MATCHING USER SCREENSHOT 3) ---
    const stepTypeItem = {
        id: `s_type_item_${ts}`,
        title: 'Type item',
        stepType: 'Step',
        components: [
            // Quantity input card with quick action modifiers
            {
                id: `type_qty_lbl_${ts}`, type: 'HEADING',
                x: 260, y: 25, w: 480, h: 30,
                props: { text: 'Quantity to store', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `type_mod_m100_${ts}`, type: 'BUTTON',
                x: 280, y: 65, w: 70, h: 40,
                props: { text: '-100', backgroundColor: '#b91c1c', color: 'white', fontWeight: 'bold' },
                triggers: [{ id: `trg_type_dec100_${ts}`, name: 'Decrease Quantity by 100', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Qty_To_Transact', value: '{{@Qty_To_Transact - 100}}' }]
            },
            {
                id: `type_mod_m10_${ts}`, type: 'BUTTON',
                x: 355, y: 65, w: 70, h: 40,
                props: { text: '-10', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 'bold' },
                triggers: [{ id: `trg_type_dec10_${ts}`, name: 'Decrease Quantity by 10', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Qty_To_Transact', value: '{{@Qty_To_Transact - 10}}' }]
            },
            {
                id: `type_qty_in_${ts}`, type: 'TEXT_INPUT', // Value field with spin control
                x: 430, y: 65, w: 140, h: 40,
                props: { targetVariable: 'Qty_To_Transact', placeholder: '1' }
            },
            {
                id: `type_mod_p10_${ts}`, type: 'BUTTON',
                x: 575, y: 65, w: 70, h: 40,
                props: { text: '+10', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 'bold' },
                triggers: [{ id: `trg_type_inc10_${ts}`, name: 'Increase Quantity by 10', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Qty_To_Transact', value: '{{@Qty_To_Transact + 10}}' }]
            },
            {
                id: `type_mod_p100_${ts}`, type: 'BUTTON',
                x: 650, y: 65, w: 70, h: 40,
                props: { text: '+100', backgroundColor: '#15803d', color: 'white', fontWeight: 'bold' },
                triggers: [{ id: `trg_type_inc100_${ts}`, name: 'Increase Quantity by 100', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Qty_To_Transact', value: '{{@Qty_To_Transact + 100}}' }]
            },

            // Material Details Card
            {
                id: `type_mat_lbl_${ts}`, type: 'HEADING',
                x: 260, y: 135, w: 480, h: 30,
                props: { text: 'Material', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `type_grid_id_${ts}`, type: 'TEXT_INPUT',
                x: 260, y: 175, w: 220, h: 55,
                props: { 
                    label: 'ID', 
                    value: '{{@Selected_Material_Def.ID}}',
                    targetVariable: '@Selected_Material_Def.ID'
                }
            },
            {
                id: `type_grid_name_${ts}`, type: 'TEXT_INPUT',
                x: 510, y: 175, w: 220, h: 55,
                props: { 
                    label: 'Name', 
                    value: '{{@Selected_Material_Def.Name}}',
                    targetVariable: '@Selected_Material_Def.Name'
                }
            },
            {
                id: `type_grid_type_${ts}`, type: 'TEXT_INPUT',
                x: 260, y: 245, w: 220, h: 55,
                props: { 
                    label: 'Type', 
                    value: '{{@Selected_Material_Def.Type}}',
                    targetVariable: '@Selected_Material_Def.Type'
                }
            },
            {
                id: `type_grid_desc_${ts}`, type: 'TEXT_INPUT',
                x: 510, y: 245, w: 220, h: 55,
                props: { 
                    label: 'Description', 
                    value: '{{@Selected_Material_Def.Description}}',
                    targetVariable: '@Selected_Material_Def.Description'
                }
            },
            {
                id: `type_grid_uom_${ts}`, type: 'TEXT_INPUT',
                x: 260, y: 315, w: 220, h: 55,
                props: { 
                    label: 'Unit of Measure', 
                    value: '{{@Selected_Material_Def.Unit_Of_Measure}}',
                    targetVariable: '@Selected_Material_Def.Unit_Of_Measure'
                }
            },
            {
                id: `type_grid_vendor_${ts}`, type: 'TEXT_INPUT',
                x: 510, y: 315, w: 220, h: 55,
                props: { 
                    label: 'Vendor ID', 
                    value: '{{@Selected_Material_Def.Vendor_ID}}',
                    targetVariable: '@Selected_Material_Def.Vendor_ID'
                }
            },

            // Footer buttons (← Previous, Proceed →)
            {
                id: `type_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Previous', backgroundColor: '#cbd5e1', color: '#1e40af', fontWeight: 'bold' },
                triggers: [{ id: `trg_type_prev_go_${ts}`, name: 'Go back to Scan Item', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_scan_item_${ts}` }]
            },
            {
                id: `type_btn_proc_${ts}`, type: 'BUTTON',
                x: 780, y: 495, w: 160, h: 45,
                props: { text: 'Proceed →', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [{ id: `trg_type_proc_go_${ts}`, name: 'Proceed to Scan Location', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_scan_loc_${ts}` }]
            }
        ]
    };

    // --- STEP 4: Scan Location (Virtual Intermediate step for Scanning New Bin) ---
    const stepScanLocation = {
        id: `s_scan_loc_${ts}`,
        title: 'Scan Location',
        stepType: 'Step',
        components: [
            {
                id: `loc_title_${ts}`, type: 'HEADING',
                x: 240, y: 50, w: 520, h: 35,
                props: { text: 'Scan target bin location', fontSize: 22, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `loc_real_scanner_${ts}`, type: 'BARCODE_SCANNER',
                x: 260, y: 150, w: 480, h: 55,
                props: { label: 'Bin Location Barcode', placeholder: 'Scan or type target bin...', targetVariable: 'New_Bin_Location' },
                triggers: [
                    {
                        id: `trg_loc_scan_action_${ts}`,
                        name: 'Handle Scanned Bin Location',
                        event: 'ON_SCAN',
                        clauses: [
                            // Clause 1: If Warehouse_Action == 'ADD'
                            {
                                match: 'ALL',
                                conditions: [
                                    { leftSource: 'VARIABLE', leftValue: 'Warehouse_Action', operator: '==', rightSource: 'STATIC', rightValue: 'ADD' }
                                ],
                                actions: [
                                    {
                                        type: 'TABLE_RECORD_CREATE',
                                        tableId: T.inventoryItems,
                                        mapping: {
                                            'ID': '{{@Scanned_Part_ID}}_{{@New_Bin_Location}}',
                                            'Material_Definition_ID': '@Scanned_Part_ID',
                                            'QTY': '@Qty_To_Transact',
                                            'Location_ID': '@New_Bin_Location',
                                            'Location_Area': 'Warehouse 1',
                                            'Status': 'Available',
                                            'Unit_Of_Measure': '{{@Selected_Material_Def.Unit_Of_Measure}}',
                                            'Material_Definition_Type': '{{@Selected_Material_Def.Type}}'
                                        }
                                    },
                                    { type: 'SHOW_NOTIFICATION', message: 'Item successfully transacted to bin location!', messageType: 'success' },
                                    { type: 'GO_TO_STEP', stepId: `s_inventory_${ts}` }
                                ]
                            },
                            // Clause 2: If Warehouse_Action == 'MOVE'
                            {
                                match: 'ALL',
                                conditions: [
                                    { leftSource: 'VARIABLE', leftValue: 'Warehouse_Action', operator: '==', rightSource: 'STATIC', rightValue: 'MOVE' }
                                ],
                                actions: [
                                    {
                                        type: 'TABLE_RECORD_SAVE',
                                        recordPlaceholderId: `r2_${ts}`,
                                        tableId: T.inventoryItems,
                                        mapping: {
                                            'Location_ID': '@New_Bin_Location',
                                            'QTY': '{{@Selected_Inventory_Item.QTY}}',
                                            'Status': '{{@Selected_Inventory_Item.Status}}'
                                        }
                                    },
                                    { type: 'SHOW_NOTIFICATION', message: 'Item location updated successfully!', messageType: 'success' },
                                    { type: 'GO_TO_STEP', stepId: `s_inventory_${ts}` }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: `loc_btn_confirm_${ts}`, type: 'BUTTON',
                x: 390, y: 380, w: 220, h: 45,
                props: { text: 'Confirm Location', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        id: `trg_loc_confirm_action_${ts}`,
                        name: 'Confirm Bin Location',
                        event: 'ON_CLICK',
                        clauses: [
                            // Clause 1: If Warehouse_Action == 'ADD'
                            {
                                match: 'ALL',
                                conditions: [
                                    { leftSource: 'VARIABLE', leftValue: 'Warehouse_Action', operator: '==', rightSource: 'STATIC', rightValue: 'ADD' }
                                ],
                                actions: [
                                    {
                                        type: 'TABLE_RECORD_CREATE',
                                        tableId: T.inventoryItems,
                                        mapping: {
                                            'ID': '{{@Scanned_Part_ID}}_{{@New_Bin_Location}}',
                                            'Material_Definition_ID': '@Scanned_Part_ID',
                                            'QTY': '@Qty_To_Transact',
                                            'Location_ID': '@New_Bin_Location',
                                            'Location_Area': 'Warehouse 1',
                                            'Status': 'Available',
                                            'Unit_Of_Measure': '{{@Selected_Material_Def.Unit_Of_Measure}}',
                                            'Material_Definition_Type': '{{@Selected_Material_Def.Type}}'
                                        }
                                    },
                                    { type: 'SHOW_NOTIFICATION', message: 'Item successfully transacted to bin location!', messageType: 'success' },
                                    { type: 'GO_TO_STEP', stepId: `s_inventory_${ts}` }
                                ]
                            },
                            // Clause 2: If Warehouse_Action == 'MOVE'
                            {
                                match: 'ALL',
                                conditions: [
                                    { leftSource: 'VARIABLE', leftValue: 'Warehouse_Action', operator: '==', rightSource: 'STATIC', rightValue: 'MOVE' }
                                ],
                                actions: [
                                    {
                                        type: 'TABLE_RECORD_SAVE',
                                        recordPlaceholderId: `r2_${ts}`,
                                        tableId: T.inventoryItems,
                                        mapping: {
                                            'Location_ID': '@New_Bin_Location',
                                            'QTY': '{{@Selected_Inventory_Item.QTY}}',
                                            'Status': '{{@Selected_Inventory_Item.Status}}'
                                        }
                                    },
                                    { type: 'SHOW_NOTIFICATION', message: 'Item location updated successfully!', messageType: 'success' },
                                    { type: 'GO_TO_STEP', stepId: `s_inventory_${ts}` }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: `loc_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Previous', backgroundColor: '#cbd5e1', color: '#1e40af', fontWeight: 'bold' },
                triggers: [
                    {
                        id: `trg_loc_prev_action_${ts}`,
                        name: 'Go back to Previous Step',
                        event: 'ON_CLICK',
                        clauses: [
                            {
                                match: 'ALL',
                                conditions: [
                                    { leftSource: 'VARIABLE', leftValue: 'Warehouse_Action', operator: '==', rightSource: 'STATIC', rightValue: 'ADD' }
                                ],
                                actions: [
                                    { type: 'GO_TO_STEP', stepId: `s_type_item_${ts}` }
                                ]
                            },
                            {
                                match: 'ALL',
                                conditions: [
                                    { leftSource: 'VARIABLE', leftValue: 'Warehouse_Action', operator: '==', rightSource: 'STATIC', rightValue: 'MOVE' }
                                ],
                                actions: [
                                    { type: 'GO_TO_STEP', stepId: `s_inventory_${ts}` }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    };

    // --- STEP 5: Inventory (MATCHING USER SCREENSHOT 4) ---
    const stepInventory = {
        id: `s_inventory_${ts}`,
        title: 'Inventory',
        stepType: 'Step',
        components: [
            // Center Table Panel: Select a record to edit location
            {
                id: `inv_title_rec_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 920, h: 30,
                props: { text: 'Select a record to edit location', fontSize: 20, fontWeight: 'bold' }
            },
            // Search Input box for table filtering
            {
                id: `inv_search_input_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 55, w: 550, h: 45,
                props: { targetVariable: 'Inventory_Filter', placeholder: 'Search by Part ID, Location, or Status...' }
            },
            // Filter Button
            {
                id: `inv_btn_filter_${ts}`, type: 'BUTTON',
                x: 580, y: 55, w: 160, h: 45,
                props: { text: '🔍 Filter Table', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { id: `trg_inv_filter_${ts}`, name: 'Filter Inventory Table', event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_LOAD', tableId: T.inventoryItems }
                ]
            },
            {
                id: `inv_table_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 115, w: 920, h: 190,
                props: {
                    tableId: T.inventoryItems,
                    title: '',
                    columns: ['Material_Definition_ID', 'Location_ID', 'QTY', 'Status'],
                    variableFilters: [{ variableName: 'Inventory_Filter' }],
                    linkedRecordPlaceholderId: `r2_${ts}`
                },
                triggers: [
                    {
                        id: `trg_inv_row_select_inv_${ts}`, name: 'Load Selected Inventory Item',
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.inventoryItems, recordPlaceholderId: `r2_${ts}`, linkVariable: 'Selected_Inv_ID'
                    },
                    {
                        id: `trg_inv_row_select_def_${ts}`, name: 'Load Linked Material Definition',
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.materialDefs, recordPlaceholderId: `r1_${ts}`, 
                        idType: 'EXPRESSION', idValue: '@Material_Definition_ID'
                    }
                ]
            },
            // Detail layout of selected record (GORGEOUS Premium Grid Layout)
            {
                id: `inv_grid_id_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 320, w: 280, h: 55,
                props: { 
                    label: 'ID', 
                    value: '{{@Selected_Inventory_Item.ID}}',
                    targetVariable: '@Selected_Inventory_Item.ID'
                }
            },
            {
                id: `inv_grid_type_${ts}`, type: 'TEXT_INPUT',
                x: 320, y: 320, w: 280, h: 55,
                props: { 
                    label: 'Material Definition Type', 
                    value: '{{@Selected_Inventory_Item.Material_Definition_Type}}',
                    targetVariable: '@Selected_Inventory_Item.Material_Definition_Type'
                }
            },
            {
                id: `inv_grid_qty_${ts}`, type: 'TEXT_INPUT',
                x: 620, y: 320, w: 320, h: 55,
                props: { 
                    label: 'QTY', 
                    value: '{{@Selected_Inventory_Item.QTY}}',
                    targetVariable: '@Selected_Inventory_Item.QTY'
                }
            },
            {
                id: `inv_grid_stat_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 385, w: 280, h: 55,
                props: { 
                    label: 'Status', 
                    value: '{{@Selected_Inventory_Item.Status}}',
                    targetVariable: '@Selected_Inventory_Item.Status'
                }
            },
            {
                id: `inv_grid_desc_${ts}`, type: 'TEXT_INPUT',
                x: 320, y: 385, w: 620, h: 55,
                props: { 
                    label: 'Description (Linked from Material Definitions)', 
                    value: '{{@Selected_Material_Def.Description}}',
                    targetVariable: '@Selected_Material_Def.Description'
                }
            },
            // Clear filter inside the card
            {
                id: `inv_btn_clear_${ts}`, type: 'BUTTON',
                x: 780, y: 445, w: 160, h: 40,
                props: { text: 'Clear filter', backgroundColor: '#eff6ff', color: '#1e40af', fontWeight: 'bold' },
                triggers: [
                    { id: `trg_inv_clear_filter_var_${ts}`, name: 'Reset Inventory Filter Variable', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Inventory_Filter', value: '' },
                    { id: `trg_inv_clear_sel_var_${ts}`, name: 'Reset Selected Inventory ID Variable', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Selected_Inv_ID', value: '' },
                    { id: `trg_inv_clear_inv_placeholder_${ts}`, name: 'Clear Selected Inventory Placeholder', event: 'ON_CLICK', type: 'DATA', action: 'CLEAR_RECORD_PLACEHOLDER', placeholderId: `r2_${ts}` },
                    { id: `trg_inv_clear_def_placeholder_${ts}`, name: 'Clear Selected Material Definition Placeholder', event: 'ON_CLICK', type: 'DATA', action: 'CLEAR_RECORD_PLACEHOLDER', placeholderId: `r1_${ts}` }
                ]
            },
            // Footer bottom buttons
            {
                id: `inv_btn_home_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 180, h: 45,
                props: { text: '🏠 Go Home', backgroundColor: '#e2e8f0', color: '#1e40af', fontWeight: 'bold' },
                triggers: [{ id: `trg_inv_home_go_${ts}`, name: 'Go to Home Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_home_${ts}` }]
            },
            {
                id: `inv_btn_change_${ts}`, type: 'BUTTON',
                x: 760, y: 495, w: 180, h: 45,
                props: { text: 'Change location →', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { id: `trg_inv_change_set_${ts}`, name: 'Set Action to MOVE', event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Warehouse_Action', value: 'MOVE' },
                    { id: `trg_inv_change_go_${ts}`, name: 'Go to Scan Location Step', event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_scan_loc_${ts}` }
                ]
            }
        ]
    };

    return {
        id: `app_mw_${ts}`,
        name: 'Material Warehouse',
        description: 'Receive newly arrived materials and coordinate item movements from one warehouse bin location to another.',
        category: 'Inventory App Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.inventoryItems, T.materialDefs],
            appTriggers: [
                {
                    id: `trg_init_${ts}`,
                    name: 'App Initialization',
                    event: 'ON_APP_START',
                    actions: [
                        { type: 'SHOW_NOTIFICATION', message: '📦 Warehouse Management App Loaded — Ready', messageType: 'info' }
                    ]
                }
            ],
            steps: [stepHome, stepScanItem, stepTypeItem, stepScanLocation, stepInventory],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
