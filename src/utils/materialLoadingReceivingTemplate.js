export function createMaterialLoadingReceivingTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        assets: 'tbl_mlr_assets',
        locations: 'tbl_mlr_locations'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'New_Truck_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'New_Truck_Name', type: 'string', defaultValue: '', persisted: true },
        { id: `v3_${ts}`, name: 'New_Truck_Desc', type: 'string', defaultValue: '', persisted: true },
        { id: `v4_${ts}`, name: 'Selected_Gate_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v5_${ts}`, name: 'New_Gate_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v6_${ts}`, name: 'New_Gate_Area', type: 'string', defaultValue: 'Warehouse Gate', persisted: true },
        { id: `v7_${ts}`, name: 'Arrived_Asset_Image', type: 'string', defaultValue: '', persisted: true },
        { id: `v8_${ts}`, name: 'Unloaded_Asset_Image', type: 'string', defaultValue: '', persisted: true },
        { id: `v9_${ts}`, name: 'Selected_Asset_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v10_${ts}`, name: 'History_Search_Query', type: 'string', defaultValue: '', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Selected_Asset', tableId: T.assets, type: 'single' }
    ];

    // --- STEP 1: Home Menu ---
    const stepHome = {
        id: `s_home_${ts}`,
        title: 'Home',
        stepType: 'Step',
        components: [
            {
                id: `c1_${ts}`, type: 'HEADING',
                x: 20, y: 30, w: 920, h: 50,
                props: { text: 'Material Loading & Receiving', fontSize: 32, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `c2_${ts}`, type: 'BUTTON',
                x: 100, y: 150, w: 220, h: 200,
                props: { text: '🚚\n\nTruck Arrival\n\nLog new shipments', backgroundColor: '#3b82f6', color: 'white', fontSize: 20, fontWeight: 'bold', textAlignment: 1 },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_truck_arrival_${ts}` }
                ]
            },
            {
                id: `c3_${ts}`, type: 'BUTTON',
                x: 370, y: 150, w: 220, h: 200,
                props: { text: '📋\n\nFIFO Board\n\nUnloading backlog', backgroundColor: '#10b981', color: 'white', fontSize: 20, fontWeight: 'bold', textAlignment: 1 },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_fifo_board_${ts}` }
                ]
            },
            {
                id: `c4_${ts}`, type: 'BUTTON',
                x: 640, y: 150, w: 220, h: 200,
                props: { text: '⏳\n\nHistory\n\nPast arrivals log', backgroundColor: '#64748b', color: 'white', fontSize: 20, fontWeight: 'bold', textAlignment: 1 },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_history_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 2: Truck Arrival ---
    const stepTruckArrival = {
        id: `s_truck_arrival_${ts}`,
        title: 'Truck Arrival',
        stepType: 'Step',
        components: [
            {
                id: `c5_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'Log Arrived Truck', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c6_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Home', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_home_${ts}` }
                ]
            },
            {
                id: `c7_${ts}`, type: 'TEXT',
                x: 20, y: 70, w: 400, h: 30,
                props: { text: 'Truck / Container ID *', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c8_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 100, w: 400, h: 40,
                props: { targetVariable: 'New_Truck_ID', placeholder: 'e.g. TRUCK-7742' }
            },
            {
                id: `c9_${ts}`, type: 'TEXT',
                x: 20, y: 160, w: 400, h: 30,
                props: { text: 'Carrier Name / Supplier *', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c10_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 190, w: 400, h: 40,
                props: { targetVariable: 'New_Truck_Name', placeholder: 'e.g. DHL Express' }
            },
            {
                id: `c11_${ts}`, type: 'TEXT',
                x: 20, y: 250, w: 400, h: 30,
                props: { text: 'Description of Assets / Manifest', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c12_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 280, w: 400, h: 80,
                props: { targetVariable: 'New_Truck_Desc', placeholder: 'e.g. 5 Pallets of D25 Motors...' }
            },
            {
                id: `c13_${ts}`, type: 'TEXT',
                x: 480, y: 70, w: 320, h: 30,
                props: { text: 'Assign Gate / Unloading Location *', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c14_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 480, y: 100, w: 460, h: 200,
                props: {
                    tableId: T.locations,
                    title: 'Select Arrival Gate',
                    columns: ['ID', 'Location_Area', 'Status']
                },
                triggers: [
                    { event: 'ON_ROW_SELECT', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Selected_Gate_ID', value: '{{SelectedRow.ID}}' }
                ]
            },
            {
                id: `c15_${ts}`, type: 'BUTTON',
                x: 480, y: 310, w: 460, h: 40,
                props: { text: '+ Add New Gate', backgroundColor: '#e2e8f0', color: 'black' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_add_gate_${ts}` }
                ]
            },
            {
                id: `c16_${ts}`, type: 'BUTTON',
                x: 20, y: 460, w: 920, h: 60,
                props: { text: 'Confirm Arrival & Next', backgroundColor: '#3b82f6', color: 'white', fontSize: 18, fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.assets,
                        mapping: {
                            'ID': '@New_Truck_ID',
                            'Name': '@New_Truck_Name',
                            'Description': '@New_Truck_Desc',
                            'Location': '@Selected_Gate_ID',
                            'Status': 'Arrived',
                            'Type': 'Truck'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_upload_image_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 3: Add New Gate ---
    const stepAddGate = {
        id: `s_add_gate_${ts}`,
        title: 'Add New Gate',
        stepType: 'Step',
        components: [
            {
                id: `c17_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'Create Gate Location', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c18_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_truck_arrival_${ts}` }
                ]
            },
            {
                id: `c19_${ts}`, type: 'TEXT',
                x: 20, y: 80, w: 400, h: 30,
                props: { text: 'Gate ID *', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c20_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 110, w: 400, h: 40,
                props: { targetVariable: 'New_Gate_ID', placeholder: 'e.g. GATE-05' }
            },
            {
                id: `c21_${ts}`, type: 'TEXT',
                x: 20, y: 180, w: 400, h: 30,
                props: { text: 'Location Area', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c22_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 210, w: 400, h: 40,
                props: { targetVariable: 'New_Gate_Area', placeholder: 'Warehouse West Wing' }
            },
            {
                id: `c23_${ts}`, type: 'BUTTON',
                x: 20, y: 280, w: 400, h: 50,
                props: { text: 'Submit Gate', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE',
                        tableId: T.locations,
                        mapping: {
                            'ID': '@New_Gate_ID',
                            'Location_Area': '@New_Gate_Area',
                            'Status': 'Active',
                            'Type': 'Gate'
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'New_Gate_ID' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_truck_arrival_${ts}` }
                ]
            },
            {
                id: `c24_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 480, y: 80, w: 460, h: 400,
                props: {
                    tableId: T.locations,
                    title: 'Current Gate List',
                    columns: ['ID', 'Location_Area', 'Status']
                }
            }
        ]
    };

    // --- STEP 4: Upload Image ---
    const stepUploadImage = {
        id: `s_upload_image_${ts}`,
        title: 'Upload Image',
        stepType: 'Step',
        components: [
            {
                id: `c25_${ts}`, type: 'HEADING',
                x: 20, y: 50, w: 920, h: 40,
                props: { text: 'Upload Manifest or Container Image', fontSize: 24, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `c26_${ts}`, type: 'TEXT',
                x: 280, y: 110, w: 400, h: 30,
                props: { text: 'Container / Asset Image Link', fontSize: 16, fontWeight: 'bold' }
            },
            {
                id: `c27_${ts}`, type: 'TEXT_INPUT',
                x: 280, y: 140, w: 400, h: 40,
                props: { targetVariable: 'Arrived_Asset_Image', placeholder: 'Paste image link or scan camera...' }
            },
            {
                id: `c28_${ts}`, type: 'BUTTON',
                x: 280, y: 210, w: 400, h: 50,
                props: { text: 'Submit Image & Set Unloading', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Container_image': '@Arrived_Asset_Image',
                            'Status': 'Unloading'
                        }
                    },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'New_Truck_ID' },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'New_Truck_Name' },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'New_Truck_Desc' },
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'CLEAR_VARIABLE', variableId: 'Arrived_Asset_Image' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Truck arrival logged successfully.', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_home_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 5: FIFO Board ---
    const stepFIFOBoard = {
        id: `s_fifo_board_${ts}`,
        title: 'FIFO Board',
        stepType: 'Step',
        components: [
            {
                id: `c29_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 600, h: 40,
                props: { text: 'FIFO Backlog (Unloading Queue)', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c30_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Home', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_home_${ts}` }
                ]
            },
            {
                id: `c31_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 70, w: 920, h: 360,
                props: {
                    tableId: T.assets,
                    title: 'Arrived Backlog Sequence',
                    columns: ['ID', 'Name', 'Description', 'Location', 'Status'],
                    filter: "Status != 'Complete'"
                },
                triggers: [
                    {
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.assets, recordPlaceholderId: `r1_${ts}`, linkVariable: 'Selected_Asset_ID'
                    }
                ]
            },
            {
                id: `c32_${ts}`, type: 'BUTTON',
                x: 20, y: 460, w: 920, h: 50,
                props: { text: 'Confirm Unloading Process', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', fontSize: 18 },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_unload_confirm_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 6: Unload Confirmation (MATCHING USER SCREENSHOT 1) ---
    const stepUnloadConfirm = {
        id: `s_unload_confirm_${ts}`,
        title: 'Unload Confirmation',
        stepType: 'Step',
        components: [
            // Header buttons matching screenshot (Home, Complete/Finish, Menu)
            {
                id: `h_home_${ts}`, type: 'BUTTON',
                x: 410, y: 15, w: 90, h: 35,
                props: { text: '🏠 Home', backgroundColor: '#e2e8f0', color: 'black' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_home_${ts}` }]
            },
            {
                id: `h_complete_${ts}`, type: 'BUTTON',
                x: 520, y: 15, w: 100, h: 35,
                props: { text: '⏱ Complete', backgroundColor: '#e2e8f0', color: 'black' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_fifo_board_${ts}` }]
            },
            // Card container: "Upload image of the unloaded"
            {
                id: `c33_${ts}`, type: 'HEADING',
                x: 260, y: 70, w: 480, h: 35,
                props: { text: 'Upload image of the unloaded', fontSize: 20, fontWeight: 'bold', textAlignment: 0 }
            },
            // Side-by-side Metadata (Name, Status, Location)
            {
                id: `meta_name_${ts}`, type: 'TEXT',
                x: 280, y: 110, w: 120, h: 50,
                props: { text: 'Name\n{{@Selected_Asset.Name}}', fontSize: 14, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `meta_status_${ts}`, type: 'TEXT',
                x: 420, y: 110, w: 120, h: 50,
                props: { text: 'Status\n{{@Selected_Asset.Status}}', fontSize: 14, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `meta_loc_${ts}`, type: 'TEXT',
                x: 560, y: 110, w: 120, h: 50,
                props: { text: 'Location\n{{@Selected_Asset.Location}}', fontSize: 14, color: '#475569', fontWeight: 'bold' }
            },
            // Interactive camera/image mock block (Black viewfinder block with photo icon & Capture button)
            {
                id: `cam_frame_${ts}`, type: 'TEXT',
                x: 320, y: 170, w: 320, h: 180,
                props: { text: '📷 Viewfinder Mock', fontSize: 14, backgroundColor: '#000000', color: '#ffffff', textAlignment: 1, padding: '60px' }
            },
            {
                id: `cam_capture_${ts}`, type: 'BUTTON',
                x: 520, y: 310, w: 110, h: 35,
                props: { text: '⚙ Capture', backgroundColor: '#3b82f6', color: 'white', fontSize: 13 },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'SET_VARIABLE', variableId: 'Unloaded_Asset_Image', value: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Photo Captured!', messageType: 'success' }
                ]
            },
            // Bottom Action: Complete Unload (Wide centered blue button)
            {
                id: `c37_${ts}`, type: 'BUTTON',
                x: 380, y: 460, w: 220, h: 55,
                props: { text: 'Complete Unload', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: 16 },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: {
                            'Asset_Image': '{{@Unloaded_Asset_Image}}',
                            'Status': 'Complete'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Unload completed. Inventory updated!', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_fifo_board_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 7: View History (MATCHING USER SCREENSHOT 2) ---
    const stepHistory = {
        id: `s_history_${ts}`,
        title: 'View History',
        stepType: 'Step',
        components: [
            // Header buttons matching screenshot (Home, Complete/Finish, Menu)
            {
                id: `hist_h_home_${ts}`, type: 'BUTTON',
                x: 410, y: 15, w: 90, h: 35,
                props: { text: '🏠 Home', backgroundColor: '#e2e8f0', color: 'black' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_home_${ts}` }]
            },
            {
                id: `hist_h_complete_${ts}`, type: 'BUTTON',
                x: 520, y: 15, w: 100, h: 35,
                props: { text: '⏱ Complete', backgroundColor: '#e2e8f0', color: 'black' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_home_${ts}` }]
            },
            // Left Panel: Search
            {
                id: `hist_lbl_search_${ts}`, type: 'TEXT',
                x: 20, y: 70, w: 260, h: 30,
                props: { text: 'Search', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `c41_${ts}`, type: 'TEXT_INPUT',
                x: 20, y: 110, w: 260, h: 40,
                props: { targetVariable: 'History_Search_Query', placeholder: 'Enter search text...' }
            },
            // Right Panel: Table showing Location, Name, Status, Entry Time
            {
                id: `c42_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 320, y: 70, w: 620, h: 220,
                props: {
                    tableId: T.assets,
                    title: 'Past Deliveries (FIFO Archive)',
                    columns: ['Location', 'Name', 'Status', 'ID'],
                    filter: "Status = 'Complete'"
                },
                triggers: [
                    {
                        event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                        tableId: T.assets, recordPlaceholderId: `r1_${ts}`, linkVariable: 'Selected_Asset_ID'
                    }
                ]
            },
            // Under Table panel:
            // Left section: Name, Description, Status, Location, Type side-by-side/grid
            {
                id: `hist_lbl_name_${ts}`, type: 'TEXT',
                x: 20, y: 350, w: 120, h: 50,
                props: { text: 'Name\n{{@Selected_Asset.Name}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `hist_lbl_desc_${ts}`, type: 'TEXT',
                x: 160, y: 350, w: 120, h: 50,
                props: { text: 'Description\n{{@Selected_Asset.Description}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `hist_lbl_status_${ts}`, type: 'TEXT',
                x: 300, y: 350, w: 120, h: 50,
                props: { text: 'Status\n{{@Selected_Asset.Status}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `hist_lbl_loc_${ts}`, type: 'TEXT',
                x: 20, y: 410, w: 120, h: 50,
                props: { text: 'Location\n{{@Selected_Asset.Location}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            {
                id: `hist_lbl_type_${ts}`, type: 'TEXT',
                x: 160, y: 410, w: 120, h: 50,
                props: { text: 'Type\n{{@Selected_Asset.Type}}', fontSize: 13, color: '#475569', fontWeight: 'bold' }
            },
            // Right section: Arrival Image & Unloaded Image side-by-side
            {
                id: `hist_lbl_arr_img_${ts}`, type: 'TEXT',
                x: 520, y: 320, w: 180, h: 30,
                props: { text: 'Arrival Image', fontSize: 14, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `hist_arr_img_${ts}`, type: 'TEXT',
                x: 520, y: 355, w: 180, h: 120,
                props: { text: '🖼 Photo Link:\n{{@Selected_Asset.Container_image}}', fontSize: 12, backgroundColor: '#f1f5f9', padding: '10px' }
            },
            {
                id: `hist_lbl_unl_img_${ts}`, type: 'TEXT',
                x: 740, y: 320, w: 180, h: 30,
                props: { text: 'Unloaded Image', fontSize: 14, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `hist_unl_img_${ts}`, type: 'TEXT',
                x: 740, y: 355, w: 180, h: 120,
                props: { text: '🖼 Photo Link:\n{{@Selected_Asset.Asset_Image}}', fontSize: 12, backgroundColor: '#f1f5f9', padding: '10px' }
            },
            // Footer <- Previous button
            {
                id: `hist_btn_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 490, w: 120, h: 40,
                props: { text: '← Previous', backgroundColor: '#e2e8f0', color: 'black' },
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_home_${ts}` }]
            }
        ]
    };

    return {
        id: `app_mlr_${ts}`,
        name: 'Material Loading and Receiving',
        description: 'Facilitate gates setup, arrivals scheduling, and real-time unloading tracking inside the warehouse.',
        category: 'Inventory App Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.assets, T.locations],
            appTriggers: [],
            steps: [stepHome, stepTruckArrival, stepAddGate, stepUploadImage, stepFIFOBoard, stepUnloadConfirm, stepHistory],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
