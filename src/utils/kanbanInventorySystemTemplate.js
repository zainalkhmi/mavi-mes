/**
 * kanbanInventorySystemTemplate.js
 * Generates an End-to-End Kanban & Inventory System template for MAVI-MES
 */

export function createKanbanInventorySystemTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const T = {
        parts: 'tbl_kis_parts',
        bom: 'tbl_kis_bom',
        supply: 'tbl_kis_supply',
        stock: 'tbl_kis_stock',
        kanban: 'tbl_kis_kanban',
        picking: 'tbl_kis_picking'
    };

    const appVariables = [
        // Master Data variables
        { id: `var_part_id_${ts}`, name: 'Selected_Part_Record.ID', type: 'string', defaultValue: '', persisted: true },
        { id: `var_part_name_${ts}`, name: 'Selected_Part_Record.Name', type: 'string', defaultValue: '', persisted: true },
        { id: `var_part_type_${ts}`, name: 'Selected_Part_Record.Type', type: 'string', defaultValue: 'Child Part', persisted: true },
        { id: `var_part_desc_${ts}`, name: 'Selected_Part_Record.Description', type: 'string', defaultValue: 'MES Master Part', persisted: true },
        { id: `var_part_status_${ts}`, name: 'Selected_Part_Record.Status', type: 'string', defaultValue: 'APPROVED', persisted: true },

        { id: `var_bom_parent_${ts}`, name: 'Selected_BOM_Record.Parent_Part', type: 'string', defaultValue: '', persisted: true },
        { id: `var_bom_child_${ts}`, name: 'Selected_BOM_Record.Child_Part', type: 'string', defaultValue: '', persisted: true },
        { id: `var_bom_qty_${ts}`, name: 'Selected_BOM_Record.BOM_Qty', type: 'number', defaultValue: 4, persisted: true },
        { id: `var_bom_id_${ts}`, name: 'Selected_BOM_Record.ID', type: 'string', defaultValue: '', persisted: true },

        // Supply variables
        { id: `var_supply_id_${ts}`, name: 'Selected_Supply_Record.ID', type: 'string', defaultValue: '', persisted: true },
        { id: `var_supply_part_${ts}`, name: 'Selected_Supply_Record.Part_No', type: 'string', defaultValue: '', persisted: true },
        { id: `var_supply_name_${ts}`, name: 'Selected_Supply_Record.Part_Name', type: 'string', defaultValue: 'Child Material Inflow', persisted: true },
        { id: `var_supply_loc_${ts}`, name: 'Selected_Supply_Record.Location_No', type: 'string', defaultValue: 'WH-BIN-01', persisted: true },
        { id: `var_supply_qty_${ts}`, name: 'Selected_Supply_Record.Qty', type: 'number', defaultValue: 100, persisted: true },
        { id: `var_supply_dt_${ts}`, name: 'Selected_Supply_Record.Datetime', type: 'string', defaultValue: '', persisted: true },

        // Verification scan variables for Supply
        { id: `var_scanned_label_${ts}`, name: 'Scanned_Label', type: 'string', defaultValue: '', persisted: false },
        { id: `var_scanned_location_${ts}`, name: 'Scanned_Location', type: 'string', defaultValue: '', persisted: false },

        // Verification scan variables for Picking
        { id: `var_scanned_pick_location_${ts}`, name: 'Scanned_Pick_Location', type: 'string', defaultValue: '', persisted: false },
        { id: `var_scanned_pick_label_${ts}`, name: 'Scanned_Pick_Label', type: 'string', defaultValue: '', persisted: false },
        { id: `var_scanned_pick_qty_${ts}`, name: 'Scanned_Pick_Qty', type: 'number', defaultValue: 0, persisted: false },

        // Stock variables
        { id: `var_stock_id_${ts}`, name: 'Selected_Stock_Record.ID', type: 'string', defaultValue: '', persisted: true },
        { id: `var_stock_def_id_${ts}`, name: 'Selected_Stock_Record.Material_Definition_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `var_stock_def_type_${ts}`, name: 'Selected_Stock_Record.Material_Definition_Type', type: 'string', defaultValue: '', persisted: true },
        { id: `var_stock_status_${ts}`, name: 'Selected_Stock_Record.Status', type: 'string', defaultValue: 'AVAILABLE', persisted: true },
        { id: `var_stock_loc_${ts}`, name: 'Selected_Stock_Record.Location_ID', type: 'string', defaultValue: 'WH-BIN-01', persisted: true },
        { id: `var_stock_area_${ts}`, name: 'Selected_Stock_Record.Location_Area', type: 'string', defaultValue: 'Warehouse 1', persisted: true },
        { id: `var_stock_qty_${ts}`, name: 'Selected_Stock_Record.QTY', type: 'number', defaultValue: 0, persisted: true },
        { id: `var_stock_uom_${ts}`, name: 'Selected_Stock_Record.Unit_Of_Measure', type: 'string', defaultValue: 'pcs', persisted: true },

        // Kanban variables
        { id: `var_kb_id_field_${ts}`, name: 'Selected_Kanban_Record.ID', type: 'string', defaultValue: '', persisted: true },
        { id: `var_kb_card_id_${ts}`, name: 'Selected_Kanban_Record.Kanban_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `var_kb_parent_${ts}`, name: 'Selected_Kanban_Record.Parent_Part', type: 'string', defaultValue: '', persisted: true },
        { id: `var_kb_seq_${ts}`, name: 'Selected_Kanban_Record.Sequence_No', type: 'number', defaultValue: 1, persisted: true },
        { id: `var_kb_child_${ts}`, name: 'Selected_Kanban_Record.Child_Part', type: 'string', defaultValue: '', persisted: true },
        { id: `var_kb_qty_${ts}`, name: 'Selected_Kanban_Record.BOM_Qty', type: 'number', defaultValue: 4, persisted: true },
        { id: `var_kb_status_${ts}`, name: 'Selected_Kanban_Record.Status', type: 'string', defaultValue: 'WAITING_PICKING', persisted: true },
        { id: `var_kb_stock_id_${ts}`, name: 'Selected_Kanban_Record.Child_Part_Stock_ID', type: 'string', defaultValue: '', persisted: false },

        // Picking variables
        { id: `var_pick_id_${ts}`, name: 'Selected_Picking_Record.ID', type: 'string', defaultValue: '', persisted: true },
        { id: `var_pick_kb_${ts}`, name: 'Selected_Picking_Record.Kanban_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `var_pick_part_${ts}`, name: 'Selected_Picking_Record.Part_No', type: 'string', defaultValue: '', persisted: true },
        { id: `var_pick_name_${ts}`, name: 'Selected_Picking_Record.Part_Name', type: 'string', defaultValue: 'Material Dispatched', persisted: true },
        { id: `var_pick_qty_${ts}`, name: 'Selected_Picking_Record.Qty', type: 'number', defaultValue: 4, persisted: true },
        { id: `var_pick_dt_${ts}`, name: 'Selected_Picking_Record.Datetime', type: 'string', defaultValue: '', persisted: true },

        // Helper parameters
        { id: `var_load_stock_id_${ts}`, name: 'Load_Stock_ID', type: 'string', defaultValue: '', persisted: false },
        { id: `var_pick_kb_id_input_${ts}`, name: 'Pick_Kanban_ID', type: 'string', defaultValue: '', persisted: false }
    ];

    const recordPlaceholders = [
        { id: `r_part_${ts}`, name: 'Selected_Part_Record', tableId: T.parts, type: 'single' },
        { id: `r_bom_${ts}`, name: 'Selected_BOM_Record', tableId: T.bom, type: 'single' },
        { id: `r_supply_${ts}`, name: 'Selected_Supply_Record', tableId: T.supply, type: 'single' },
        { id: `r_stock_${ts}`, name: 'Selected_Stock_Record', tableId: T.stock, type: 'single' },
        { id: `r_kanban_${ts}`, name: 'Selected_Kanban_Record', tableId: T.kanban, type: 'single' },
        { id: `r_picking_${ts}`, name: 'Selected_Picking_Record', tableId: T.picking, type: 'single' }
    ];

    // --- STEP 1: Master Data Setup ---
    const stepMasterData = {
        id: `step_master_data_${ts}`,
        title: '1. Master Data Setup',
        stepType: 'Step',
        components: [
            {
                id: `md_header_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 960, h: 40,
                props: { text: '1. Master Data Setup (Parts & BOM)', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            // Left Panel: Master Part
            {
                id: `md_p1_title_${ts}`, type: 'TEXT',
                x: 20, y: 65, w: 460, h: 30,
                props: { text: 'Register Master Part', fontSize: 18, fontWeight: 'bold', color: '#1e293b' }
            },
            {
                id: `md_in_part_no_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 105, w: 140, h: 40,
                props: { label: 'Part No *', targetVariable: 'Selected_Part_Record.ID', placeholder: 'e.g. C001' }
            },
            {
                id: `md_in_part_name_${ts}`, type: 'TEXT_INPUT',
                x: 175, y: 105, w: 160, h: 40,
                props: { label: 'Part Name *', targetVariable: 'Selected_Part_Record.Name', placeholder: 'e.g. Bolt M10' }
            },
            {
                id: `md_sel_part_type_${ts}`, type: 'DROPDOWN',
                x: 350, y: 105, w: 130, h: 40,
                props: { label: 'Part Type *', targetVariable: 'Selected_Part_Record.Type', options: ['Parent Part', 'Child Part'] }
            },
            {
                id: `md_btn_save_part_${ts}`, type: 'BUTTON',
                x: 20, y: 155, w: 460, h: 40,
                props: {
                    text: 'Save Part Definition', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold',
                    triggers: [
                        {
                            name: 'Save Part and Stock',
                            event: 'ON_CLICK',
                            actions: [
                                // 1. Create the Part Record
                                {
                                    type: 'TABLE_RECORD_CREATE',
                                    payload: {
                                        placeholderId: `r_part_${ts}`,
                                        idType: 'VARIABLE',
                                        idValue: 'Selected_Part_Record.ID'
                                    }
                                },
                                // 2. Set Up and Create Initial Stock record
                                { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Stock_Record.ID', value: '{{@Selected_Part_Record.ID}}_WH-BIN-01' } },
                                { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Stock_Record.Material_Definition_ID', value: '{{@Selected_Part_Record.ID}}' } },
                                { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Stock_Record.Material_Definition_Type', value: '{{@Selected_Part_Record.Type}}' } },
                                { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Stock_Record.Status', value: 'AVAILABLE' } },
                                { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Stock_Record.Location_ID', value: 'WH-BIN-01' } },
                                { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Stock_Record.Location_Area', value: 'Warehouse 1' } },
                                { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Stock_Record.QTY', value: 0 } },
                                { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Stock_Record.Unit_Of_Measure', value: 'pcs' } },
                                {
                                    type: 'TABLE_RECORD_CREATE',
                                    payload: {
                                        placeholderId: `r_stock_${ts}`,
                                        idType: 'VARIABLE',
                                        idValue: 'Selected_Stock_Record.ID'
                                    }
                                },
                                {
                                    type: 'SHOW_MESSAGE',
                                    payload: { message: 'Part Master and Initial Stock record registered!', msgType: 'success' }
                                }
                            ]
                        }
                    ]
                }
            },
            {
                id: `md_tbl_parts_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 210, w: 460, h: 260,
                props: {
                    tableId: T.parts,
                    title: 'Existed Part Master List',
                    columns: ['ID', 'Name', 'Type'],
                    rowSelection: 'single',
                    linkedRecordPlaceholderId: `r_part_${ts}`
                }
            },

            // Right Panel: BOM Relations
            {
                id: `md_p2_title_${ts}`, type: 'TEXT',
                x: 520, y: 65, w: 460, h: 30,
                props: { text: 'Configure Bill of Material (BOM)', fontSize: 18, fontWeight: 'bold', color: '#1e293b' }
            },
            {
                id: `md_in_bom_parent_${ts}`, type: 'TEXT_INPUT',
                x: 520, y: 105, w: 140, h: 40,
                props: { label: 'Parent Part No *', targetVariable: 'Selected_BOM_Record.Parent_Part', placeholder: 'e.g. P001' }
            },
            {
                id: `md_in_bom_child_${ts}`, type: 'TEXT_INPUT',
                x: 675, y: 105, w: 140, h: 40,
                props: { label: 'Child Part No *', targetVariable: 'Selected_BOM_Record.Child_Part', placeholder: 'e.g. C001' }
            },
            {
                id: `md_in_bom_qty_${ts}`, type: 'TEXT_INPUT',
                x: 830, y: 105, w: 120, h: 40,
                props: { label: 'BOM Qty *', targetVariable: 'Selected_BOM_Record.BOM_Qty', inputType: 'number' }
            },
            {
                id: `md_btn_save_bom_${ts}`, type: 'BUTTON',
                x: 520, y: 155, w: 460, h: 40,
                props: {
                    text: 'Link BOM Relationship', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold',
                    triggers: [{
                        name: 'Save BOM',
                        event: 'ON_CLICK',
                        actions: [
                            { type: 'SET_VARIABLE', payload: { variableName: 'Selected_BOM_Record.ID', value: '{{@Selected_BOM_Record.Parent_Part}}_{{@Selected_BOM_Record.Child_Part}}' } },
                            {
                                type: 'TABLE_RECORD_CREATE',
                                payload: {
                                    placeholderId: `r_bom_${ts}`,
                                    idType: 'VARIABLE',
                                    idValue: 'Selected_BOM_Record.ID'
                                }
                            },
                            {
                                type: 'SHOW_MESSAGE',
                                payload: { message: 'BOM Link established successfully!', msgType: 'success' }
                            }
                        ]
                    }]
                }
            },
            {
                id: `md_tbl_bom_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 520, y: 210, w: 460, h: 260,
                props: {
                    tableId: T.bom,
                    title: 'Bill of Material List',
                    columns: ['Parent_Part', 'Child_Part', 'BOM_Qty'],
                    rowSelection: 'single',
                    linkedRecordPlaceholderId: `r_bom_${ts}`
                }
            },

            // Footer Navigation
            {
                id: `md_btn_next_${ts}`, type: 'BUTTON',
                x: 820, y: 485, w: 160, h: 45,
                props: {
                    text: '2. Supply Ingest ➔', backgroundColor: '#1e293b', color: 'white', fontWeight: 'bold',
                    triggers: [{
                        name: 'Go to Supply',
                        event: 'ON_CLICK',
                        actions: [{ type: 'GO_TO_STEP', payload: { stepId: `step_supply_receiving_${ts}` } }]
                    }]
                }
            }
        ]
    };

    // --- STEP 2: Supply / Receiving Process ---
    const stepSupply = {
        id: `step_supply_receiving_${ts}`,
        title: '2. Supply & Receiving',
        stepType: 'Step',
        components: [
            {
                id: `sup_header_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 960, h: 40,
                props: { text: '2. Supply & Receiving (Material Ingestion)', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `sup_desc_${ts}`, type: 'TEXT',
                x: 20, y: 65, w: 960, h: 40,
                props: { text: 'Masukkan data material yang datang untuk menambah persediaan stock. Operator WAJIB melakukan verifikasi dengan scan QR code label material & lokasi rack.', fontSize: 14, color: '#475569' }
            },
            // Row 1: Expected Ingestion Entry Details
            {
                id: `sup_in_part_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 110, w: 200, h: 45,
                props: { label: 'Part No *', targetVariable: 'Selected_Supply_Record.Part_No', placeholder: 'e.g. C001' }
            },
            {
                id: `sup_in_qty_${ts}`, type: 'TEXT_INPUT',
                x: 240, y: 110, w: 200, h: 45,
                props: { label: 'Ingested Qty *', targetVariable: 'Selected_Supply_Record.Qty', inputType: 'number' }
            },
            {
                id: `sup_in_loc_${ts}`, type: 'TEXT_INPUT',
                x: 460, y: 110, w: 200, h: 45,
                props: { label: 'Target Location ID *', targetVariable: 'Selected_Supply_Record.Location_No', placeholder: 'e.g. WH-BIN-01' }
            },
            {
                id: `sup_btn_load_stock_${ts}`, type: 'BUTTON',
                x: 680, y: 110, w: 100, h: 45,
                props: {
                    text: 'Load Stock', backgroundColor: '#e2e8f0', color: '#0f172a',
                    triggers: [{
                        name: 'Load Stock Record',
                        event: 'ON_CLICK',
                        actions: [
                            { type: 'SET_VARIABLE', payload: { variableName: 'Load_Stock_ID', value: '{{@Selected_Supply_Record.Part_No}}_{{@Selected_Supply_Record.Location_No}}' } },
                            {
                                type: 'TABLE_RECORD_LOAD',
                                payload: {
                                    placeholderId: `r_stock_${ts}`,
                                    idType: 'VARIABLE',
                                    idValue: 'Load_Stock_ID'
                                }
                            }
                        ]
                    }]
                }
            },

            // Row 2: Verification Scanners & Tips
            {
                id: `sup_verify_label_${ts}`, type: 'BARCODE_SCANNER',
                x: 20, y: 175, w: 230, h: 55,
                props: { label: 'Scan Label Part (QR Code) *', placeholder: 'Scan label...', targetVariable: 'Scanned_Label', autoFocus: false }
            },
            {
                id: `sup_verify_rack_${ts}`, type: 'BARCODE_SCANNER',
                x: 270, y: 175, w: 230, h: 55,
                props: { label: 'Scan Lokasi Rack (QR Code) *', placeholder: 'Scan lokasi rack...', targetVariable: 'Scanned_Location', autoFocus: false }
            },
            {
                id: `sup_verify_tip_${ts}`, type: 'TEXT',
                x: 520, y: 175, w: 250, h: 55,
                props: {
                    text: '💡 VERIFIKASI QR CODE:\nScan Label harus = {{@Selected_Supply_Record.Part_No || "[Part No]"}}\nScan Rack harus = {{@Selected_Supply_Record.Location_No || "[Lokasi]"}}',
                    fontSize: 10, color: '#f59e0b', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px'
                }
            },
            {
                id: `sup_btn_submit_${ts}`, type: 'BUTTON',
                x: 795, y: 175, w: 185, h: 55,
                props: {
                    text: '✓ Submit Incoming Material', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold',
                    triggers: [{
                        name: 'Submit Ingest',
                        event: 'ON_CLICK',
                        clauses: [
                            // Clause 1: Verification Successful
                            {
                                id: `cl_ok_${ts}`,
                                match: 'ALL',
                                conditions: [
                                    {
                                        leftSource: 'VARIABLE',
                                        leftValue: 'Scanned_Label',
                                        operator: '==',
                                        rightSource: 'VARIABLE',
                                        rightValue: 'Selected_Supply_Record.Part_No'
                                    },
                                    {
                                        leftSource: 'VARIABLE',
                                        leftValue: 'Scanned_Location',
                                        operator: '==',
                                        rightSource: 'VARIABLE',
                                        rightValue: 'Selected_Supply_Record.Location_No'
                                    }
                                ],
                                actions: [
                                    // Create supply record log
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Supply_Record.ID', value: '{{ "SUP_" + Date.now() }}' } },
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Supply_Record.Part_Name', value: 'Child Material Inflow' } },
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Supply_Record.Datetime', value: '{{$GLOBAL_TIME}}' } },
                                    {
                                        type: 'TABLE_RECORD_CREATE',
                                        payload: {
                                            placeholderId: `r_supply_${ts}`,
                                            idType: 'VARIABLE',
                                            idValue: 'Selected_Supply_Record.ID'
                                        }
                                    },
                                    // Increment stock levels
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Stock_Record.QTY', value: '{{Number(@Selected_Stock_Record.QTY || 0) + Number(@Selected_Supply_Record.Qty || 0)}}' } },
                                    {
                                        type: 'TABLE_RECORD_SAVE',
                                        payload: {
                                            placeholderId: `r_stock_${ts}`
                                        }
                                    },
                                    // Reset scan values for next iteration
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Scanned_Label', value: '' } },
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Scanned_Location', value: '' } },
                                    {
                                        type: 'SHOW_MESSAGE',
                                        payload: { message: '✓ Sukses: Data disupply ke rack dan stock di-update!', msgType: 'success' }
                                    }
                                ]
                            },
                            // Clause 2: Verification Failed (Mismatch or Empty)
                            {
                                id: `cl_err_${ts}`,
                                match: 'ALL',
                                conditions: [],
                                actions: [
                                    {
                                        type: 'SHOW_MESSAGE',
                                        payload: { message: '❌ Salah supply barang! Hasil scan label material atau QR lokasi rack tidak cocok dengan target.', msgType: 'error' }
                                    }
                                ]
                            }
                        ]
                    }]
                }
            },

            // Table showing current stock levels (shifted down slightly)
            {
                id: `sup_tbl_stock_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 250, w: 960, h: 210,
                props: {
                    tableId: T.stock,
                    title: 'Current Inventory Stock Balance',
                    columns: ['Material_Definition_ID', 'Location_ID', 'Location_Area', 'QTY', 'Status'],
                    rowSelection: 'single',
                    linkedRecordPlaceholderId: `r_stock_${ts}`
                }
            },
            // Footer Navigation
            {
                id: `sup_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 485, w: 160, h: 45,
                props: {
                    text: '❮ 1. Master Data', backgroundColor: '#e2e8f0', color: '#1e293b', fontWeight: 'bold',
                    triggers: [{
                        name: 'Go to Master Data',
                        event: 'ON_CLICK',
                        actions: [{ type: 'GO_TO_STEP', payload: { stepId: `step_master_data_${ts}` } }]
                    }]
                }
            },
            {
                id: `sup_btn_next_${ts}`, type: 'BUTTON',
                x: 820, y: 485, w: 160, h: 45,
                props: {
                    text: '3. Gen Kanban ➔', backgroundColor: '#1e293b', color: 'white', fontWeight: 'bold',
                    triggers: [{
                        name: 'Go to Kanban Gen',
                        event: 'ON_CLICK',
                        actions: [{ type: 'GO_TO_STEP', payload: { stepId: `step_kanban_gen_${ts}` } }]
                    }]
                }
            }
        ]
    };

    // --- STEP 3: Kanban Generation ---
    const stepKanbanGen = {
        id: `step_kanban_gen_${ts}`,
        title: '3. Kanban Generation',
        stepType: 'Step',
        components: [
            {
                id: `kb_header_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 960, h: 40,
                props: { text: '3. Kanban Generation Process', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `kb_desc_${ts}`, type: 'TEXT',
                x: 20, y: 65, w: 960, h: 45,
                props: { text: 'Buat kartu/order Kanban baru untuk memproduksi Parent Part. Sistem otomatis mengekstrak komponen penyusun (BOM) yang harus diambil.', fontSize: 14, color: '#475569' }
            },
            {
                id: `kb_in_parent_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 120, w: 300, h: 45,
                props: { label: 'Parent Part No *', targetVariable: 'Selected_Kanban_Record.Parent_Part', placeholder: 'e.g. P001' }
            },
            {
                id: `kb_in_seq_${ts}`, type: 'TEXT_INPUT',
                x: 340, y: 120, w: 300, h: 45,
                props: { label: 'Sequence Order / Lot No *', targetVariable: 'Selected_Kanban_Record.Sequence_No', inputType: 'number' }
            },
            {
                id: `kb_btn_gen_${ts}`, type: 'BUTTON',
                x: 660, y: 120, w: 320, h: 45,
                props: {
                    text: '⚙ Generate Kanban Cards', backgroundColor: '#8b5cf6', color: 'white', fontWeight: 'bold',
                    triggers: [{
                        name: 'Generate Cards',
                        event: 'ON_CLICK',
                        actions: [
                            // 1. Setup variables for C001
                            { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Kanban_Record.ID', value: '{{ "KNB_" + @Selected_Kanban_Record.Parent_Part + "_" + @Selected_Kanban_Record.Sequence_No + "_C001" }}' } },
                            { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Kanban_Record.Kanban_ID', value: '{{ "KNB_" + @Selected_Kanban_Record.Parent_Part + "_" + @Selected_Kanban_Record.Sequence_No }}' } },
                            { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Kanban_Record.Child_Part', value: 'C001' } },
                            { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Kanban_Record.BOM_Qty', value: 4 } },
                            { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Kanban_Record.Status', value: 'WAITING_PICKING' } },
                            {
                                type: 'TABLE_RECORD_CREATE',
                                payload: {
                                    placeholderId: `r_kanban_${ts}`,
                                    idType: 'VARIABLE',
                                    idValue: 'Selected_Kanban_Record.ID'
                                }
                            },
                            // 2. Setup variables for C002
                            { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Kanban_Record.ID', value: '{{ "KNB_" + @Selected_Kanban_Record.Parent_Part + "_" + @Selected_Kanban_Record.Sequence_No + "_C002" }}' } },
                            { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Kanban_Record.Child_Part', value: 'C002' } },
                            {
                                type: 'TABLE_RECORD_CREATE',
                                payload: {
                                    placeholderId: `r_kanban_${ts}`,
                                    idType: 'VARIABLE',
                                    idValue: 'Selected_Kanban_Record.ID'
                                }
                            },
                            {
                                type: 'SHOW_MESSAGE',
                                payload: { message: 'Kanban sequence compiled! Required components mapped.', msgType: 'success' }
                            }
                        ]
                    }]
                }
            },
            {
                id: `kb_tbl_kanban_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 185, w: 960, h: 280,
                props: {
                    tableId: T.kanban,
                    title: 'Active Kanban Orders & Components Needed',
                    columns: ['Kanban_ID', 'Parent_Part', 'Sequence_No', 'Child_Part', 'BOM_Qty', 'Status'],
                    rowSelection: 'single',
                    linkedRecordPlaceholderId: `r_kanban_${ts}`
                }
            },
            // Footer Navigation
            {
                id: `kb_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 485, w: 160, h: 45,
                props: {
                    text: '❮ 2. Supply Ingest', backgroundColor: '#e2e8f0', color: '#1e293b', fontWeight: 'bold',
                    triggers: [{
                        name: 'Go to Supply',
                        event: 'ON_CLICK',
                        actions: [{ type: 'GO_TO_STEP', payload: { stepId: `step_supply_receiving_${ts}` } }]
                    }]
                }
            },
            {
                id: `kb_btn_next_${ts}`, type: 'BUTTON',
                x: 820, y: 485, w: 160, h: 45,
                props: {
                    text: '4. Validate & Pick ➔', backgroundColor: '#1e293b', color: 'white', fontWeight: 'bold',
                    triggers: [{
                        name: 'Go to Validate Pick',
                        event: 'ON_CLICK',
                        actions: [{ type: 'GO_TO_STEP', payload: { stepId: `step_validate_picking_${ts}` } }]
                    }]
                }
            }
        ]
    };

    // --- STEP 4: Stock Validation & Picking ---
    const stepValidatePicking = {
        id: `step_validate_picking_${ts}`,
        title: '4. Validation & Picking',
        stepType: 'Step',
        components: [
            {
                id: `val_header_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 960, h: 40,
                props: { text: '4. Kanban Stock Validation & Picking Process', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `val_desc_${ts}`, type: 'TEXT',
                x: 20, y: 60, w: 460, h: 45,
                props: { text: 'Pilih antrean Kanban di bawah. Lakukan proses picking berurutan sesuai sequence Kanban.', fontSize: 13, color: '#475569' }
            },
            // Left Panel: Select Kanban & Validate Stock
            {
                id: `val_tbl_kanban_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 110, w: 460, h: 220,
                props: {
                    tableId: T.kanban,
                    title: 'Select Active Kanban Card (Antrean Urut)',
                    columns: ['Sequence_No', 'Kanban_ID', 'Child_Part', 'BOM_Qty', 'Status'],
                    rowSelection: 'single',
                    linkedRecordPlaceholderId: `r_kanban_${ts}`,
                    triggers: [
                        {
                            name: 'Auto Load Stock Location',
                            event: 'ON_ROW_SELECT',
                            actions: [
                                // Auto-assemble stock lookup key based on component code
                                { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Kanban_Record.Child_Part_Stock_ID', value: '{{@Selected_Kanban_Record.Child_Part}}_{{"WH-BIN-01"}}' } },
                                {
                                    type: 'TABLE_RECORD_LOAD',
                                    payload: {
                                        placeholderId: `r_stock_${ts}`,
                                        idType: 'VARIABLE',
                                        idValue: 'Selected_Kanban_Record.Child_Part_Stock_ID'
                                    }
                                }
                            ]
                        }
                    ]
                }
            },
            {
                id: `val_panel_verify_${ts}`, type: 'TEXT',
                x: 20, y: 345, w: 460, h: 120,
                props: {
                    text: 'Sequence: {{@Selected_Kanban_Record.Sequence_No}} | Kanban ID: {{@Selected_Kanban_Record.Kanban_ID}}\nComponent: {{@Selected_Kanban_Record.Child_Part}} | Required BOM: {{@Selected_Kanban_Record.BOM_Qty}} pcs\n\nStock Lokasi: {{@Selected_Stock_Record.Location_ID}} | QTY Tersedia: {{@Selected_Stock_Record.QTY}} pcs',
                    fontSize: 13, color: '#0f172a', backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px'
                }
            },

            // Right Panel: Picking Action with Verification Scans
            {
                id: `pk_title_${ts}`, type: 'TEXT',
                x: 500, y: 60, w: 480, h: 30,
                props: { text: 'Execute Material Picking', fontSize: 18, fontWeight: 'bold', color: '#1e293b' }
            },
            // Step 1: Scan Location
            {
                id: `pk_scan_loc_${ts}`, type: 'BARCODE_SCANNER',
                x: 500, y: 95, w: 230, h: 55,
                props: { label: '1. Scan Lokasi Rack (QR Code) *', placeholder: 'Scan rack...', targetVariable: 'Scanned_Pick_Location', autoFocus: false }
            },
            // Step 2: Scan Label
            {
                id: `pk_scan_label_${ts}`, type: 'BARCODE_SCANNER',
                x: 750, y: 95, w: 230, h: 55,
                props: { label: '2. Scan Label Part (QR Code) *', placeholder: 'Scan label...', targetVariable: 'Scanned_Pick_Label', autoFocus: false }
            },
            // Step 3: Input Qty
            {
                id: `pk_in_qty_${ts}`, type: 'TEXT_INPUT',
                x: 500, y: 160, w: 230, h: 55,
                props: { label: '3. Masukkan Qty Picking *', targetVariable: 'Scanned_Pick_Qty', inputType: 'number', placeholder: 'e.g. 4' }
            },
            {
                id: `pk_verify_tip_${ts}`, type: 'TEXT',
                x: 750, y: 160, w: 230, h: 55,
                props: {
                    text: '💡 DATA PICKING TARGET:\nRack: {{@Selected_Stock_Record.Location_ID || "[Lokasi]"}}\nPart: {{@Selected_Kanban_Record.Child_Part || "[Part]"}}\nQty: {{@Selected_Kanban_Record.BOM_Qty || "[Qty]"}} pcs',
                    fontSize: 10, color: '#ff5f00', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '6px'
                }
            },
            {
                id: `pk_btn_submit_${ts}`, type: 'BUTTON',
                x: 500, y: 225, w: 480, h: 45,
                props: {
                    text: '✓ Complete Picking (Deduct Stock)', backgroundColor: '#ea580c', color: 'white', fontWeight: 'bold',
                    triggers: [{
                        name: 'Complete Picking',
                        event: 'ON_CLICK',
                        clauses: [
                            // Clause 1: Verification Successful
                            {
                                id: `cl_pick_ok_${ts}`,
                                match: 'ALL',
                                conditions: [
                                    {
                                        leftSource: 'VARIABLE',
                                        leftValue: 'Scanned_Pick_Location',
                                        operator: '==',
                                        rightSource: 'VARIABLE',
                                        rightValue: 'Selected_Stock_Record.Location_ID'
                                    },
                                    {
                                        leftSource: 'VARIABLE',
                                        leftValue: 'Scanned_Pick_Label',
                                        operator: '==',
                                        rightSource: 'VARIABLE',
                                        rightValue: 'Selected_Kanban_Record.Child_Part'
                                    },
                                    {
                                        leftSource: 'VARIABLE',
                                        leftValue: 'Scanned_Pick_Qty',
                                        operator: '==',
                                        rightSource: 'VARIABLE',
                                        rightValue: 'Selected_Kanban_Record.BOM_Qty'
                                    }
                                ],
                                actions: [
                                    // 1. Prepare Picking Log record
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Picking_Record.ID', value: '{{ "PICK_" + Date.now() }}' } },
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Picking_Record.Kanban_ID', value: '{{@Selected_Kanban_Record.Kanban_ID}}' } },
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Picking_Record.Part_No', value: '{{@Selected_Kanban_Record.Child_Part}}' } },
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Picking_Record.Part_Name', value: 'Material Dispatched' } },
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Picking_Record.Qty', value: '{{@Selected_Kanban_Record.BOM_Qty}}' } },
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Picking_Record.Datetime', value: '{{$GLOBAL_TIME}}' } },
                                    {
                                        type: 'TABLE_RECORD_CREATE',
                                        payload: {
                                            placeholderId: `r_picking_${ts}`,
                                            idType: 'VARIABLE',
                                            idValue: 'Selected_Picking_Record.ID'
                                        }
                                    },
                                    // 2. Set Kanban status to COMPLETED
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Kanban_Record.Status', value: 'COMPLETED' } },
                                    {
                                        type: 'TABLE_RECORD_SAVE',
                                        payload: {
                                            placeholderId: `r_kanban_${ts}`
                                        }
                                    },
                                    // 3. Deduct Stock QTY
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Selected_Stock_Record.QTY', value: '{{Number(@Selected_Stock_Record.QTY || 0) - Number(@Selected_Kanban_Record.BOM_Qty || 0)}}' } },
                                    {
                                        type: 'TABLE_RECORD_SAVE',
                                        payload: {
                                            placeholderId: `r_stock_${ts}`
                                        }
                                    },
                                    // 4. Reset scan variables for next operation
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Scanned_Pick_Location', value: '' } },
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Scanned_Pick_Label', value: '' } },
                                    { type: 'SET_VARIABLE', payload: { variableName: 'Scanned_Pick_Qty', value: 0 } },
                                    {
                                        type: 'SHOW_MESSAGE',
                                        payload: { message: '✓ picking berhasil dicatat dan stock didebet!', msgType: 'success' }
                                    }
                                ]
                            },
                            // Clause 2: Verification Failed
                            {
                                id: `cl_pick_err_${ts}`,
                                match: 'ALL',
                                conditions: [],
                                actions: [
                                    {
                                        type: 'SHOW_MESSAGE',
                                        payload: { message: '❌ Salah picking barang! Hasil scan rack lokasi, label part, atau quantity tidak sesuai target.', msgType: 'error' }
                                    }
                                ]
                            }
                        ]
                    }]
                }
            },
            {
                id: `pk_tbl_history_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 500, y: 280, w: 480, h: 180,
                props: {
                    tableId: T.picking,
                    title: 'Recent Material Picking Logs',
                    columns: ['Kanban_ID', 'Part_No', 'Qty', 'Datetime'],
                    rowSelection: 'single',
                    linkedRecordPlaceholderId: `r_picking_${ts}`
                }
            },

            // Footer Navigation
            {
                id: `val_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 485, w: 160, h: 45,
                props: {
                    text: '❮ 3. Gen Kanban', backgroundColor: '#e2e8f0', color: '#1e293b', fontWeight: 'bold',
                    triggers: [{
                        name: 'Go to Kanban Gen',
                        event: 'ON_CLICK',
                        actions: [{ type: 'GO_TO_STEP', payload: { stepId: `step_kanban_gen_${ts}` } }]
                    }]
                }
            },
            {
                id: `val_btn_next_${ts}`, type: 'BUTTON',
                x: 820, y: 485, w: 160, h: 45,
                props: {
                    text: '5. Monitoring ➔', backgroundColor: '#1e293b', color: 'white', fontWeight: 'bold',
                    triggers: [{
                        name: 'Go to Monitoring',
                        event: 'ON_CLICK',
                        actions: [{ type: 'GO_TO_STEP', payload: { stepId: `step_monitoring_${ts}` } }]
                    }]
                }
            }
        ]
    };

    // --- STEP 5: Inventory Monitoring Dashboard ---
    const stepMonitoring = {
        id: `step_monitoring_${ts}`,
        title: '5. Inventory Monitoring',
        stepType: 'Step',
        components: [
            {
                id: `mon_header_${ts}`, type: 'HEADING',
                x: 20, y: 15, w: 960, h: 40,
                props: { text: '5. Inventory Monitoring & KPI Dashboard', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            
            // Stock On Hand Table View
            {
                id: `mon_tbl_stock_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 460, h: 180,
                props: {
                    tableId: T.stock,
                    title: 'Current Stock On Hand balance',
                    columns: ['Material_Definition_ID', 'Location_ID', 'QTY', 'Status'],
                    rowSelection: 'single',
                    linkedRecordPlaceholderId: `r_stock_${ts}`
                }
            },
            // Low Stock list (e.g. QTY <= 10 items)
            {
                id: `mon_tbl_low_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 265, w: 460, h: 180,
                props: {
                    tableId: T.stock,
                    title: '⚠️ Low Stock Alerts (Reorder Triggered)',
                    columns: ['Material_Definition_ID', 'Location_ID', 'QTY'],
                    rowSelection: 'single',
                    linkedRecordPlaceholderId: `r_stock_${ts}`
                }
            },

            // History logs views
            {
                id: `mon_tbl_supply_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 500, y: 70, w: 480, h: 180,
                props: {
                    tableId: T.supply,
                    title: 'Receiving Supply History (Raw Materials In)',
                    columns: ['Part_No', 'Qty', 'Location_No', 'Datetime'],
                    rowSelection: 'single',
                    linkedRecordPlaceholderId: `r_supply_${ts}`
                }
            },
            {
                id: `mon_tbl_picking_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 500, y: 265, w: 480, h: 180,
                props: {
                    tableId: T.picking,
                    title: 'Dispatch Picking History (Line Consumed Out)',
                    columns: ['Kanban_ID', 'Part_No', 'Qty', 'Datetime'],
                    rowSelection: 'single',
                    linkedRecordPlaceholderId: `r_picking_${ts}`
                }
            },

            // Footer Navigation
            {
                id: `mon_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 465, w: 160, h: 45,
                props: {
                    text: '❮ 4. Validate & Pick', backgroundColor: '#e2e8f0', color: '#1e293b', fontWeight: 'bold',
                    triggers: [{
                        name: 'Go to Pick',
                        event: 'ON_CLICK',
                        actions: [{ type: 'GO_TO_STEP', payload: { stepId: `step_validate_picking_${ts}` } }]
                    }]
                }
            },
            {
                id: `mon_btn_back_home_${ts}`, type: 'BUTTON',
                x: 770, y: 465, w: 210, h: 45,
                props: {
                    text: 'Return to Master Setup', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold',
                    triggers: [{
                        name: 'Go to Master Data',
                        event: 'ON_CLICK',
                        actions: [{ type: 'GO_TO_STEP', payload: { stepId: `step_master_data_${ts}` } }]
                    }]
                }
            }
        ]
    };

    return {
        id: `app_kanban_inventory_system_${ts}`,
        name: 'Kanban Inventory System',
        description: 'End-to-End Kanban & Inventory Management covering Master Setup, Supply Receiving, Kanban BOM Explosion, Validation, and Production Picking.',
        category: 'Inventory App Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables,
            recordPlaceholders,
            appTables: [T.parts, T.bom, T.supply, T.stock, T.kanban, T.picking],
            appTriggers: [],
            steps: [
                stepMasterData,
                stepSupply,
                stepKanbanGen,
                stepValidatePicking,
                stepMonitoring
            ]
        }
    };
}
