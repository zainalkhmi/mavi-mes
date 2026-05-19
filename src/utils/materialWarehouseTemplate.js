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
        { id: `v5_${ts}`, name: 'Selected_Inv_ID', type: 'string', defaultValue: '', persisted: true }
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
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Warehouse_Action', value: 'ADD' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_scan_item_${ts}` }
                ]
            },
            {
                id: `home_btn_change_${ts}`, type: 'BUTTON',
                x: 280, y: 260, w: 440, h: 140,
                props: { text: 'Change Item Location', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: 24 },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Warehouse_Action', value: 'MOVE' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_inventory_${ts}` }
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
            // Scanner viewport box
            {
                id: `scan_viewport_${ts}`, type: 'TEXT',
                x: 260, y: 100, w: 480, h: 260,
                props: { text: '📷 Barcode Scanner', fontSize: 16, backgroundColor: '#6b7280', color: 'white', textAlignment: 1, padding: '100px' }
            },
            {
                id: `scan_btn_sim_${ts}`, type: 'BUTTON',
                x: 580, y: 380, w: 160, h: 40,
                props: { text: 'Simulate scan', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Scanned_Part_ID', value: 'D25-006-01' },
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.materialDefs, recordPlaceholderId: `r1_${ts}`, linkVariable: 'Scanned_Part_ID'
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Part scanned successfully!', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_type_item_${ts}` }
                ]
            },
            // Footer previous button
            {
                id: `scan_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Previous', backgroundColor: '#e2e8f0', color: '#1e40af', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_home_${ts}` }]
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
                triggers: [{ event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Qty_To_Transact', value: '{{@Qty_To_Transact - 100}}' }]
            },
            {
                id: `type_mod_m10_${ts}`, type: 'BUTTON',
                x: 355, y: 65, w: 70, h: 40,
                props: { text: '-10', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Qty_To_Transact', value: '{{@Qty_To_Transact - 10}}' }]
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
                triggers: [{ event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Qty_To_Transact', value: '{{@Qty_To_Transact + 10}}' }]
            },
            {
                id: `type_mod_p100_${ts}`, type: 'BUTTON',
                x: 650, y: 65, w: 70, h: 40,
                props: { text: '+100', backgroundColor: '#15803d', color: 'white', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Qty_To_Transact', value: '{{@Qty_To_Transact + 100}}' }]
            },

            // Material Details Card
            {
                id: `type_mat_lbl_${ts}`, type: 'HEADING',
                x: 260, y: 135, w: 480, h: 30,
                props: { text: 'Material', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `type_grid_id_${ts}`, type: 'TEXT',
                x: 280, y: 175, w: 200, h: 50,
                props: { text: 'ID\n{{@Selected_Material_Def.ID}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `type_grid_name_${ts}`, type: 'TEXT',
                x: 500, y: 175, w: 200, h: 50,
                props: { text: 'Name\n{{@Selected_Material_Def.Name}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `type_grid_type_${ts}`, type: 'TEXT',
                x: 280, y: 235, w: 200, h: 50,
                props: { text: 'Type\n{{@Selected_Material_Def.Type}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `type_grid_desc_${ts}`, type: 'TEXT',
                x: 500, y: 235, w: 200, h: 50,
                props: { text: 'Description\n{{@Selected_Material_Def.Description}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `type_grid_uom_${ts}`, type: 'TEXT',
                x: 280, y: 295, w: 200, h: 50,
                props: { text: 'Unit of Measure\n{{@Selected_Material_Def.Unit_Of_Measure}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `type_grid_vendor_${ts}`, type: 'TEXT',
                x: 500, y: 295, w: 200, h: 50,
                props: { text: 'Vendor ID\n{{@Selected_Material_Def.Vendor_ID}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },

            // Footer buttons (← Previous, Proceed →)
            {
                id: `type_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Previous', backgroundColor: '#cbd5e1', color: '#1e40af', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_scan_item_${ts}` }]
            },
            {
                id: `type_btn_proc_${ts}`, type: 'BUTTON',
                x: 780, y: 495, w: 160, h: 45,
                props: { text: 'Proceed →', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_scan_loc_${ts}` }]
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
                id: `loc_viewport_${ts}`, type: 'TEXT',
                x: 260, y: 100, w: 480, h: 260,
                props: { text: '📷 Barcode Scanner [Target Bin Location]', fontSize: 16, backgroundColor: '#6b7280', color: 'white', textAlignment: 1, padding: '100px' }
            },
            {
                id: `loc_btn_sim_${ts}`, type: 'BUTTON',
                x: 580, y: 380, w: 160, h: 40,
                props: { text: 'Confirm Location', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'New_Bin_Location', value: 'BIN04' },
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
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
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Item successfully transacted to bin location!', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_inventory_${ts}` }
                ]
            },
            {
                id: `loc_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 150, h: 45,
                props: { text: '← Previous', backgroundColor: '#cbd5e1', color: '#1e40af', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_type_item_${ts}` }]
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
            {
                id: `inv_table_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 55, w: 920, h: 250,
                props: {
                    tableId: T.inventoryItems,
                    title: '',
                    columns: ['Material_Definition_ID', 'Location_ID', 'QTY', 'Status']
                },
                triggers: [
                    {
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.inventoryItems, recordPlaceholderId: `r2_${ts}`, linkVariable: 'Selected_Inv_ID'
                    }
                ]
            },
            // Detail layout of selected record
            {
                id: `inv_grid_id_${ts}`, type: 'TEXT',
                x: 40, y: 320, w: 380, h: 45,
                props: { text: 'ID\n{{@Selected_Inventory_Item.ID}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `inv_grid_type_${ts}`, type: 'TEXT',
                x: 460, y: 320, w: 380, h: 45,
                props: { text: 'Material Definition Type\n{{@Selected_Inventory_Item.Material_Definition_Type}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `inv_grid_stat_${ts}`, type: 'TEXT',
                x: 40, y: 380, w: 380, h: 45,
                props: { text: 'Status\n{{@Selected_Inventory_Item.Status}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `inv_grid_qty_${ts}`, type: 'TEXT',
                x: 460, y: 380, w: 380, h: 45,
                props: { text: 'QTY\n{{@Selected_Inventory_Item.QTY}}', fontSize: 13, color: '#64748b', fontWeight: 'bold' }
            },
            // Clear filter inside the card
            {
                id: `inv_btn_clear_${ts}`, type: 'BUTTON',
                x: 760, y: 440, w: 160, h: 40,
                props: { text: 'Clear filter', backgroundColor: '#eff6ff', color: '#1e40af', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Selected_Inv_ID' }]
            },
            // Footer bottom buttons
            {
                id: `inv_btn_home_${ts}`, type: 'BUTTON',
                x: 20, y: 495, w: 180, h: 45,
                props: { text: '🏠 Go Home', backgroundColor: '#e2e8f0', color: '#1e40af', fontWeight: 'bold' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_home_${ts}` }]
            },
            {
                id: `inv_btn_change_${ts}`, type: 'BUTTON',
                x: 760, y: 495, w: 180, h: 45,
                props: { text: 'Change location →', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_scan_loc_${ts}` }
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
            appTriggers: [],
            steps: [stepHome, stepScanItem, stepTypeItem, stepScanLocation, stepInventory],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
