/**
 * kanbanAppSuiteTemplate.js
 * Generates a Kanban App Suite template for MAVI-MES
 */

export function createKanbanAppSuiteTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const appVariables = [
        { id: `var_card_id_${ts}`, name: 'Kanban_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `var_part_no_${ts}`, name: 'Part_Number', type: 'string', defaultValue: '', persisted: true },
        { id: `var_part_desc_${ts}`, name: 'Part_Description', type: 'string', defaultValue: '', persisted: true },
        { id: `var_consume_loc_${ts}`, name: 'Consuming_Location', type: 'string', defaultValue: '', persisted: true },
        { id: `var_supply_loc_${ts}`, name: 'Supply_Location', type: 'string', defaultValue: '', persisted: true },
        { id: `var_qty_${ts}`, name: 'QTY', type: 'number', defaultValue: 0, persisted: true },
        { id: `var_status_${ts}`, name: 'Status', type: 'string', defaultValue: 'FULL', persisted: true },
        { id: `var_active_${ts}`, name: 'Active', type: 'string', defaultValue: 'Yes', persisted: true },
        { id: `var_image_${ts}`, name: 'Image', type: 'string', defaultValue: '', persisted: true },
        { id: `var_req_status_${ts}`, name: 'Request_Status', type: 'string', defaultValue: 'OPEN', persisted: true }
    ];

    // Step 1: Kanban Manager (All Kanban Cards)
    const step1 = {
        id: `step_kanban_manager_${ts}`,
        title: 'Kanban Manager',
        stepType: 'Step',
        components: [
            {
                id: `sm_header_${ts}`, type: 'TEXT',
                x: 20, y: 20, w: 900, h: 40,
                props: { text: 'All Kanban Cards', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `sm_table_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 960, h: 400,
                props: { 
                    tableId: 'tbl_kanban_cards',
                    columns: ['Kanban_ID', 'Part_Number', 'Part_Description', 'Consuming_Location', 'Supply_Location', 'QTY', 'Status', 'Active'],
                    rowSelection: 'single',
                    targetVariable: 'Kanban_ID'
                }
            },
            {
                id: `sm_btn_edit_${ts}`, type: 'BUTTON',
                x: 20, y: 500, w: 120, h: 40,
                props: {
                    label: 'Edit card', text: 'Edit card',
                    backgroundColor: '#e2e8f0', color: '#1e293b', fontSize: 14, fontWeight: 'bold'
                }
            },
            {
                id: `sm_btn_dup_${ts}`, type: 'BUTTON',
                x: 600, y: 500, w: 160, h: 40,
                props: {
                    label: 'Duplicate card', text: 'Duplicate card',
                    backgroundColor: '#2563eb', color: 'white', fontSize: 14, fontWeight: 'bold'
                }
            },
            {
                id: `sm_btn_print_${ts}`, type: 'BUTTON',
                x: 780, y: 500, w: 160, h: 40,
                props: {
                    label: 'Print label', text: 'Print label',
                    backgroundColor: '#2563eb', color: 'white', fontSize: 14, fontWeight: 'bold'
                }
            },
            {
                id: `sm_btn_create_${ts}`, type: 'BUTTON',
                x: 780, y: 560, w: 160, h: 50,
                props: {
                    label: '+ Create new card', text: '+ Create new card',
                    backgroundColor: '#2563eb', color: 'white', fontSize: 14, fontWeight: 'bold',
                    triggers: [{ name: 'Go to create', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepName: 'Create Kanban Cards' } }] }]
                }
            }
        ]
    };

    // Step 2: Create Kanban Cards
    const step2 = {
        id: `step_create_card_${ts}`,
        title: 'Create Kanban Cards',
        stepType: 'Step',
        components: [
            {
                id: `sc_header_${ts}`, type: 'TEXT',
                x: 20, y: 20, w: 900, h: 40,
                props: { text: 'Create Kanban Cards', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `sc_part_no_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 80, w: 200, h: 50,
                props: { label: 'Part Number', targetVariable: 'Part_Number' }
            },
            {
                id: `sc_desc_${ts}`, type: 'TEXT_INPUT',
                x: 240, y: 80, w: 250, h: 50,
                props: { label: 'Description', targetVariable: 'Part_Description' }
            },
            {
                id: `sc_sup_loc_${ts}`, type: 'RADIO_GROUP',
                x: 20, y: 150, w: 200, h: 50,
                props: { label: 'Supply Location', targetVariable: 'Supply_Location', options: ['Warehouse A', 'Supplier 1'] }
            },
            {
                id: `sc_con_loc_${ts}`, type: 'RADIO_GROUP',
                x: 240, y: 150, w: 250, h: 50,
                props: { label: 'Consuming Location', targetVariable: 'Consuming_Location', options: ['Station 1', 'Station 2'] }
            },
            {
                id: `sc_qty_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 220, w: 200, h: 50,
                props: { label: 'Quantity', targetVariable: 'QTY', inputType: 'number' }
            },
            {
                id: `sc_image_upload_${ts}`, type: 'BUTTON',
                x: 550, y: 80, w: 300, h: 200,
                props: {
                    label: 'Upload Image', text: 'Upload Image',
                    backgroundColor: '#e2e8f0', color: '#1e293b', fontSize: 16
                }
            },
            {
                id: `sc_btn_clear_${ts}`, type: 'BUTTON',
                x: 400, y: 300, w: 100, h: 40,
                props: {
                    label: 'Clear', text: 'Clear', backgroundColor: '#e2e8f0', color: '#1e293b'
                }
            },
            {
                id: `sc_btn_cancel_${ts}`, type: 'BUTTON',
                x: 20, y: 400, w: 120, h: 50,
                props: {
                    label: 'X Cancel', text: 'X Cancel', backgroundColor: '#e2e8f0', color: '#1e293b',
                    triggers: [{ name: 'Cancel', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepName: 'Kanban Manager' } }] }]
                }
            },
            {
                id: `sc_btn_create_${ts}`, type: 'BUTTON',
                x: 800, y: 400, w: 150, h: 50,
                props: {
                    label: '+ Create', text: '+ Create', backgroundColor: '#2563eb', color: 'white',
                    triggers: [
                        { 
                            name: 'Create', 
                            event: 'ON_CLICK', 
                            actions: [
                                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_kanban_cards_${ts}` } },
                                { type: 'GO_TO_STEP', payload: { stepName: 'Kanban Manager' } }
                            ] 
                        }
                    ]
                }
            }
        ]
    };

    // Step 3: Material Consumption (Request Material)
    const step3 = {
        id: `step_request_mat_${ts}`,
        title: 'Request Material',
        stepType: 'Step',
        components: [
            {
                id: `rm_header_${ts}`, type: 'TEXT',
                x: 20, y: 20, w: 900, h: 40,
                props: { text: 'Request Material', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `rm_table_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 80, w: 450, h: 400,
                props: { 
                    tableId: 'tbl_kanban_cards',
                    columns: ['Kanban_ID', 'Part_Number', 'Part_Description', 'Status'],
                    rowSelection: 'single',
                    targetVariable: 'Kanban_ID'
                }
            },
            {
                id: `rm_detail_title_${ts}`, type: 'TEXT',
                x: 500, y: 80, w: 300, h: 30,
                props: { text: 'Selected Request Detail', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `rm_status_${ts}`, type: 'TEXT',
                x: 800, y: 80, w: 100, h: 30,
                props: { text: 'Status: FULL', fontSize: 16, fontWeight: 'bold', color: '#16a34a' }
            },
            {
                id: `rm_btn_create_req_${ts}`, type: 'BUTTON',
                x: 750, y: 550, w: 200, h: 50,
                props: {
                    label: '+ Create New Request', text: '+ Create New Request', backgroundColor: '#2563eb', color: 'white',
                    triggers: [{ name: 'Go to confirm', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepName: 'Confirm' } }] }]
                }
            }
        ]
    };

    // Step 4: Confirm Request
    const step4 = {
        id: `step_confirm_${ts}`,
        title: 'Confirm',
        stepType: 'Step',
        components: [
            {
                id: `cfm_header_${ts}`, type: 'TEXT',
                x: 20, y: 20, w: 900, h: 40,
                props: { text: 'Confirm', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `cfm_box_${ts}`, type: 'TEXT',
                x: 300, y: 100, w: 400, h: 300,
                props: { text: '', backgroundColor: 'white', border: '1px solid #e2e8f0' } // Placeholder for box
            },
            {
                id: `cfm_btn_cancel_${ts}`, type: 'BUTTON',
                x: 320, y: 350, w: 150, h: 40,
                props: {
                    label: 'X Cancel', text: 'X Cancel', backgroundColor: '#e2e8f0', color: '#1e293b',
                    triggers: [{ name: 'Cancel', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepName: 'Request Material' } }] }]
                }
            },
            {
                id: `cfm_btn_confirm_${ts}`, type: 'BUTTON',
                x: 520, y: 350, w: 150, h: 40,
                props: {
                    label: 'Confirm', text: 'Confirm', backgroundColor: '#2563eb', color: 'white',
                    triggers: [
                        { 
                            name: 'Confirm Req', 
                            event: 'ON_CLICK', 
                            actions: [
                                { type: 'SET_VARIABLE', payload: { variable: 'Status', value: 'EMPTY', valueType: 'STATIC' } },
                                { type: 'TABLE_RECORD_UPDATE', payload: { placeholderId: `rp_kanban_cards_${ts}` } },
                                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_mat_req_${ts}` } },
                                { type: 'GO_TO_STEP', payload: { stepName: 'Request Material' } }
                            ] 
                        }
                    ]
                }
            }
        ]
    };

    // Step 5: Water Spider (Kanban Request)
    const step5 = {
        id: `step_water_spider_${ts}`,
        title: 'Water Spider',
        stepType: 'Step',
        components: [
            {
                id: `ws_header_${ts}`, type: 'TEXT',
                x: 20, y: 20, w: 900, h: 40,
                props: { text: 'Kanban Request', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `ws_table_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 80, w: 450, h: 400,
                props: { 
                    tableId: 'tbl_material_requests',
                    columns: ['Kanban_ID', 'Part_Number', 'Status', 'Requested_Time'],
                    rowSelection: 'single',
                    targetVariable: 'Kanban_ID'
                }
            },
            {
                id: `ws_btn_process_${ts}`, type: 'BUTTON',
                x: 800, y: 550, w: 150, h: 50,
                props: {
                    label: 'Process request', text: 'Process request', backgroundColor: '#2563eb', color: 'white',
                    triggers: [
                        {
                            name: 'Process',
                            event: 'ON_CLICK',
                            actions: [
                                { type: 'SET_VARIABLE', payload: { variable: 'Request_Status', value: 'IN TRANSIT', valueType: 'STATIC' } },
                                { type: 'TABLE_RECORD_UPDATE', payload: { placeholderId: `rp_mat_req_${ts}` } },
                                { type: 'SHOW_MESSAGE', payload: { message: 'Request processed.', msgType: 'success' } }
                            ]
                        }
                    ]
                }
            }
        ]
    };

    // Step 6: Material Supplier
    const step6 = {
        id: `step_material_supplier_${ts}`,
        title: 'Material Supplier',
        stepType: 'Step',
        components: [
            {
                id: `ms_header_${ts}`, type: 'TEXT',
                x: 20, y: 20, w: 900, h: 40,
                props: { text: 'Material Supplier Fulfillment', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `ms_table_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 80, w: 600, h: 400,
                props: { 
                    tableId: 'tbl_material_requests',
                    columns: ['Kanban_ID', 'Part_Number', 'Status'],
                    rowSelection: 'single',
                    targetVariable: 'Kanban_ID'
                }
            },
            {
                id: `ms_btn_fulfill_${ts}`, type: 'BUTTON',
                x: 650, y: 400, w: 200, h: 50,
                props: {
                    label: 'Fulfill Request (Ready for Pickup)', text: 'Fulfill Request', backgroundColor: '#16a34a', color: 'white',
                    triggers: [
                        {
                            name: 'Fulfill',
                            event: 'ON_CLICK',
                            actions: [
                                { type: 'SET_VARIABLE', payload: { variable: 'Request_Status', value: 'READY FOR PICK UP', valueType: 'STATIC' } },
                                { type: 'TABLE_RECORD_UPDATE', payload: { placeholderId: `rp_mat_req_${ts}` } },
                                { type: 'SHOW_MESSAGE', payload: { message: 'Marked as ready for pick up.', msgType: 'success' } }
                            ]
                        }
                    ]
                }
            }
        ]
    };

    // Step 7: Open Requests
    const step7 = {
        id: `step_open_requests_${ts}`,
        title: 'Open Requests',
        stepType: 'Step',
        components: [
            {
                id: `or_header_${ts}`, type: 'TEXT',
                x: 20, y: 20, w: 900, h: 40,
                props: { text: 'Open Requests', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `or_barcode_icon_${ts}`, type: 'TEXT',
                x: 20, y: 80, w: 250, h: 30,
                props: { text: '🔍 Scan or select kanban card', fontSize: 14 }
            },
            {
                id: `or_btn_clear_${ts}`, type: 'BUTTON',
                x: 300, y: 70, w: 150, h: 40,
                props: { label: 'Clear Selection', text: 'Clear Selection', backgroundColor: '#e2e8f0', color: '#1e293b' }
            },
            {
                id: `or_table_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 120, w: 450, h: 360,
                props: { 
                    tableId: 'tbl_material_requests',
                    columns: ['Kanban_ID', 'Part_Number', 'Supplier', 'Status'],
                    rowSelection: 'single',
                    targetVariable: 'Kanban_ID'
                }
            },
            {
                id: `or_detail_title_${ts}`, type: 'TEXT',
                x: 500, y: 80, w: 300, h: 30,
                props: { text: 'Selected Request Detail', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `or_status_label_${ts}`, type: 'TEXT',
                x: 500, y: 120, w: 80, h: 30,
                props: { text: 'Status:', fontSize: 16 }
            },
            {
                id: `or_status_val_${ts}`, type: 'TEXT_INPUT',
                x: 580, y: 115, w: 150, h: 40,
                props: { label: '', targetVariable: 'Request_Status', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Request_Status', backgroundColor: '#475569', color: 'white' }
            },
            {
                id: `or_pn_label_${ts}`, type: 'TEXT',
                x: 500, y: 170, w: 100, h: 20,
                props: { text: 'Part Number', fontSize: 12, color: '#64748b' }
            },
            {
                id: `or_pn_val_${ts}`, type: 'TEXT_INPUT',
                x: 500, y: 190, w: 100, h: 40,
                props: { label: '', targetVariable: 'Part_Number', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Part_Number' }
            },
            {
                id: `or_desc_label_${ts}`, type: 'TEXT',
                x: 620, y: 170, w: 100, h: 20,
                props: { text: 'Part Description', fontSize: 12, color: '#64748b' }
            },
            {
                id: `or_desc_val_${ts}`, type: 'TEXT_INPUT',
                x: 620, y: 190, w: 150, h: 40,
                props: { label: '', targetVariable: 'Part_Description', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Part_Description' }
            },
            {
                id: `or_qty_label_${ts}`, type: 'TEXT',
                x: 790, y: 170, w: 100, h: 20,
                props: { text: 'QTY', fontSize: 12, color: '#64748b' }
            },
            {
                id: `or_qty_val_${ts}`, type: 'TEXT_INPUT',
                x: 790, y: 190, w: 100, h: 40,
                props: { label: '', targetVariable: 'QTY', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'QTY' }
            },
            {
                id: `or_img_label_${ts}`, type: 'TEXT',
                x: 500, y: 240, w: 100, h: 20,
                props: { text: 'Image', fontSize: 12, color: '#64748b' }
            },
            {
                id: `or_img_val_${ts}`, type: 'IMAGE',
                x: 500, y: 260, w: 200, h: 150,
                props: { src: '', alt: 'Part Image' }
            },
            {
                id: `or_loc_label_${ts}`, type: 'TEXT',
                x: 500, y: 430, w: 150, h: 20,
                props: { text: 'Requesting Location', fontSize: 12, color: '#64748b' }
            },
            {
                id: `or_loc_val_${ts}`, type: 'TEXT_INPUT',
                x: 500, y: 450, w: 150, h: 40,
                props: { label: '', targetVariable: 'Consuming_Location', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Consuming_Location' }
            },
            {
                id: `or_reqby_label_${ts}`, type: 'TEXT',
                x: 700, y: 430, w: 150, h: 20,
                props: { text: 'Requested by', fontSize: 12, color: '#64748b' }
            },
            {
                id: `or_reqby_val_${ts}`, type: 'TEXT',
                x: 700, y: 450, w: 150, h: 40,
                props: { text: 'John Smith', fontSize: 14 }
            },
            {
                id: `or_btn_process_${ts}`, type: 'BUTTON',
                x: 750, y: 550, w: 200, h: 50,
                props: {
                    label: '✓ Process Request', text: '✓ Process Request', backgroundColor: '#2563eb', color: 'white',
                    triggers: [
                        {
                            name: 'Process',
                            event: 'ON_CLICK',
                            actions: [
                                { type: 'SET_VARIABLE', payload: { variable: 'Request_Status', value: 'PROCESSED', valueType: 'STATIC' } },
                                { type: 'TABLE_RECORD_UPDATE', payload: { placeholderId: `rp_mat_req_${ts}` } },
                                { type: 'SHOW_MESSAGE', payload: { message: 'Request processed successfully.', msgType: 'success' } }
                            ]
                        }
                    ]
                }
            }
        ]
    };

    return {
        id: `app_kanban_${ts}`,
        name: 'Kanban App Suite',
        description: 'Lean manufacturing kanban system with card manager, material consumption, water spider, and supplier flows.',
        category: 'Manufacturing',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables,
            recordPlaceholders: [
                {
                    id: `rp_kanban_cards_${ts}`,
                    name: 'Kanban_Cards_Record',
                    tableId: 'tbl_kanban_cards',
                    description: 'Kanban Cards repository'
                },
                {
                    id: `rp_mat_req_${ts}`,
                    name: 'Material_Requests_Record',
                    tableId: 'tbl_material_requests',
                    description: 'Material Requests logs'
                }
            ],
            appTables: ['tbl_kanban_cards', 'tbl_material_requests'],
            appTriggers: [],
            steps: [
                step1, step2, step3, step4, step5, step6, step7
            ]
        }
    };
}
