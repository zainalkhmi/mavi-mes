/**
 * workInstructionsTemplate.js
 * Generates a professional, Tulip-style Work Instructions / Work Order Execution application for MANDOR-MES
 */

export function createWorkInstructionsTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    // Table references for replacement in AppStore
    const T = {
        workOrders: 'tbl_wi_work_orders',
        activityLogs: 'tbl_wi_activity_logs'
    };

    // Variables for the app
    const appVariables = [
        { id: `var_wo_id_${ts}`, name: 'Selected_WO_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `var_operator_${ts}`, name: 'Operator_Name', type: 'string', defaultValue: '@APP_INFO.USER', persisted: false },
        { id: `var_station_${ts}`, name: 'Station_ID', type: 'string', defaultValue: 'Station-01', persisted: true },
        { id: `var_pcb_serial_${ts}`, name: 'PCB_Serial', type: 'string', defaultValue: '', persisted: false },
        { id: `var_torque_val_${ts}`, name: 'Torque_Val', type: 'number', defaultValue: 0, persisted: false },
        { id: `var_torque_res_${ts}`, name: 'Torque_Result', type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: `var_quality_${ts}`, name: 'Quality_Status', type: 'string', defaultValue: 'PASS', persisted: false },
        { id: `var_defect_${ts}`, name: 'Defect_Reason', type: 'string', defaultValue: 'None', persisted: false },
        { id: `var_notes_${ts}`, name: 'Inspection_Notes', type: 'string', defaultValue: '', persisted: false },
        { id: `var_sign_${ts}`, name: 'Operator_Signature', type: 'string', defaultValue: '', persisted: false },
        { id: `var_start_time_${ts}`, name: 'Start_Time', type: 'string', defaultValue: '', persisted: false },
        { id: `var_end_time_${ts}`, name: 'End_Time', type: 'string', defaultValue: '', persisted: false },
        { id: `var_cycle_time_${ts}`, name: 'Cycle_Time_Sec', type: 'number', defaultValue: 0, persisted: false }
    ];

    // Record Placeholders
    const recordPlaceholders = [
        {
            id: `rp_wo_${ts}`,
            name: 'Current_Work_Order',
            tableId: T.workOrders,
            description: 'The active work order being processed'
        }
    ];

    // --- STEP 1: Select Work Order ---
    const stepSelectWorkOrder = {
        id: `step_select_wo_${ts}`,
        title: 'Select Work Order',
        stepType: 'Step',
        components: [
            {
                id: `s1_hdr_${ts}`, type: 'TEXT',
                x: 30, y: 20, w: 940, h: 40,
                props: { text: '📋 Work Order Dispatch & Selection', fontSize: 26, fontWeight: 'bold', color: '#1e3a8a' }
            },
            {
                id: `s1_inst_${ts}`, type: 'TEXT',
                x: 30, y: 70, w: 940, h: 30,
                props: { text: 'Select a released work order from the dispatcher board to begin guided assembly.', fontSize: 14, color: '#64748b' }
            },
            {
                id: `s1_table_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 30, y: 110, w: 600, h: 360,
                props: {
                    tableId: T.workOrders,
                    title: 'Active Dispatch Queue',
                    columns: ['Work_Order_ID', 'Material_ID', 'QTY_Required', 'QTY_Complete', 'Status'],
                    pageSize: 6
                },
                triggers: [
                    {
                        event: 'ON_ROW_SELECT',
                        type: 'DATA',
                        action: 'TABLE_RECORD_LOAD',
                        tableId: T.workOrders,
                        recordPlaceholderId: `rp_wo_${ts}`,
                        linkVariable: 'Selected_WO_ID'
                    }
                ]
            },
            {
                id: `s1_detail_card_${ts}`, type: 'RECORD_DISPLAY',
                x: 650, y: 110, w: 320, h: 250,
                props: {
                    title: 'Work Order Details',
                    placeholderId: `rp_wo_${ts}`,
                    fieldsToShow: ['Work_Order_ID', 'Material_ID', 'Description', 'QTY_Required', 'QTY_Complete', 'Status']
                }
            },
            {
                id: `s1_start_btn_${ts}`, type: 'BUTTON',
                x: 650, y: 380, w: 320, h: 90,
                props: {
                    label: 'START ASSEMBLY ▶', text: 'START ASSEMBLY ▶',
                    backgroundColor: '#10b981', color: 'white', fontSize: 20, fontWeight: 'bold',
                    triggers: [
                        {
                            event: 'ON_CLICK',
                            actions: [
                                {
                                    type: 'SET_VARIABLE',
                                    payload: {
                                        variable: 'Start_Time',
                                        valueType: 'EXPRESSION',
                                        value: 'new Date().toISOString()'
                                    }
                                },
                                {
                                    type: 'TABLE_RECORD_SAVE',
                                    payload: {
                                        placeholderId: `rp_wo_${ts}`,
                                        mapping: { 'Status': 'IN PROGRESS' }
                                    }
                                },
                                {
                                    type: 'SHOW_MESSAGE',
                                    payload: {
                                        message: 'Assembly Started - Station Timer Running',
                                        msgType: 'success'
                                    }
                                },
                                { type: 'NEXT_STEP' }
                            ]
                        }
                    ]
                }
            }
        ]
    };

    // --- STEP 2: Base Plate Mounting ---
    const stepBaseMounting = {
        id: `step_assembly_1_${ts}`,
        title: '1. Base Plate Mounting',
        stepType: 'Step',
        components: [
            {
                id: `s2_hdr_${ts}`, type: 'TEXT',
                x: 30, y: 20, w: 940, h: 40,
                props: { text: 'Step 1 of 4: Base Plate Mounting', fontSize: 22, fontWeight: 'bold', color: '#1e293b' }
            },
            {
                id: `s2_sidebar_${ts}`, type: 'TEXT',
                x: 30, y: 80, w: 200, h: 360,
                props: {
                    text: '▶ 1. Base Mounting\n   2. Wiring Assembly\n   3. Torque Inspection\n   4. Quality Sign-Off',
                    fontSize: 14,
                    lineHeight: 2.2,
                    color: '#1e293b',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px'
                }
            },
            {
                id: `s2_img_${ts}`, type: 'IMAGE',
                x: 250, y: 80, w: 420, h: 260,
                props: {
                    src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600',
                    alt: 'Base Plate Guide',
                    borderRadius: '8px'
                }
            },
            {
                id: `s2_inst_${ts}`, type: 'TEXT',
                x: 250, y: 360, w: 420, h: 100,
                props: {
                    text: 'INSTRUCTIONS:\n1. Retrieve the base plate (Part #BP-109) and 4 rubber feet.\n2. Align the rubber feet with the corner mounting holes.\n3. Insert screws from underneath and tighten until flush.\n4. Place base plate on ESD mat.',
                    fontSize: 13,
                    color: '#334155'
                }
            },
            {
                id: `s2_chk_${ts}`, type: 'CHECKLIST',
                x: 690, y: 80, w: 280, h: 180,
                props: {
                    label: 'Task Checklist',
                    items: [
                        'Rubber feet mounted securely',
                        'Screws are flush with the bottom',
                        'Base plate clean and free of debris'
                    ],
                    required: true
                }
            },
            {
                id: `s2_wo_info_${ts}`, type: 'RECORD_DISPLAY',
                x: 690, y: 280, w: 280, h: 160,
                props: {
                    title: 'Active Order',
                    placeholderId: `rp_wo_${ts}`,
                    fieldsToShow: ['Work_Order_ID', 'Material_ID']
                }
            },
            {
                id: `s2_prev_btn_${ts}`, type: 'BUTTON',
                x: 250, y: 480, w: 150, h: 50,
                props: {
                    label: '◀ PREVIOUS', text: '◀ PREVIOUS',
                    backgroundColor: '#64748b', color: 'white',
                    triggers: [{ event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }]
                }
            },
            {
                id: `s2_next_btn_${ts}`, type: 'BUTTON',
                x: 820, y: 480, w: 150, h: 50,
                props: {
                    label: 'NEXT ▶', text: 'NEXT ▶',
                    backgroundColor: '#2563eb', color: 'white',
                    triggers: [{ event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };

    // --- STEP 3: Wiring Sub-Assembly ---
    const stepWiringAssembly = {
        id: `step_assembly_2_${ts}`,
        title: '2. Wiring Sub-Assembly',
        stepType: 'Step',
        components: [
            {
                id: `s3_hdr_${ts}`, type: 'TEXT',
                x: 30, y: 20, w: 940, h: 40,
                props: { text: 'Step 2 of 4: Wiring Sub-Assembly', fontSize: 22, fontWeight: 'bold', color: '#1e293b' }
            },
            {
                id: `s3_sidebar_${ts}`, type: 'TEXT',
                x: 30, y: 80, w: 200, h: 360,
                props: {
                    text: '   1. Base Mounting\n▶ 2. Wiring Assembly\n   3. Torque Inspection\n   4. Quality Sign-Off',
                    fontSize: 14,
                    lineHeight: 2.2,
                    color: '#1e293b',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px'
                }
            },
            {
                id: `s3_img_${ts}`, type: 'IMAGE',
                x: 250, y: 80, w: 420, h: 260,
                props: {
                    src: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600',
                    alt: 'Wiring Guide',
                    borderRadius: '8px'
                }
            },
            {
                id: `s3_inst_${ts}`, type: 'TEXT',
                x: 250, y: 360, w: 420, h: 100,
                props: {
                    text: 'INSTRUCTIONS:\n1. Retrieve wiring harness (Part #WH-204) and PCB.\n2. Connect J1 (4-pin power) and J2 (10-pin ribbon connector).\n3. Route cables cleanly through cable management clips.',
                    fontSize: 13,
                    color: '#334155'
                }
            },
            {
                id: `s3_barcode_${ts}`, type: 'BARCODE_SCANNER',
                x: 690, y: 80, w: 280, h: 90,
                props: {
                    label: 'Scan PCB Serial Number',
                    placeholder: 'Scan PCB Barcode...',
                    targetVariable: 'PCB_Serial',
                    required: true
                }
            },
            {
                id: `s3_text_serial_${ts}`, type: 'TEXT_INPUT',
                x: 690, y: 190, w: 280, h: 50,
                props: {
                    label: 'PCB Serial (Manual Entry)',
                    placeholder: 'Enter PCB serial...',
                    targetVariable: 'PCB_Serial',
                    required: true
                }
            },
            {
                id: `s3_wo_info_${ts}`, type: 'RECORD_DISPLAY',
                x: 690, y: 280, w: 280, h: 160,
                props: {
                    title: 'Active Order',
                    placeholderId: `rp_wo_${ts}`,
                    fieldsToShow: ['Work_Order_ID', 'Material_ID']
                }
            },
            {
                id: `s3_prev_btn_${ts}`, type: 'BUTTON',
                x: 250, y: 480, w: 150, h: 50,
                props: {
                    label: '◀ PREVIOUS', text: '◀ PREVIOUS',
                    backgroundColor: '#64748b', color: 'white',
                    triggers: [{ event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }]
                }
            },
            {
                id: `s3_next_btn_${ts}`, type: 'BUTTON',
                x: 820, y: 480, w: 150, h: 50,
                props: {
                    label: 'NEXT ▶', text: 'NEXT ▶',
                    backgroundColor: '#2563eb', color: 'white',
                    triggers: [{ event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };

    // --- STEP 4: Torque Inspection ---
    const stepTorqueInspection = {
        id: `step_assembly_3_${ts}`,
        title: '3. Torque Inspection',
        stepType: 'Step',
        components: [
            {
                id: `s4_hdr_${ts}`, type: 'TEXT',
                x: 30, y: 20, w: 940, h: 40,
                props: { text: 'Step 3 of 4: Torque Inspection & Spec Check', fontSize: 22, fontWeight: 'bold', color: '#1e293b' }
            },
            {
                id: `s4_sidebar_${ts}`, type: 'TEXT',
                x: 30, y: 80, w: 200, h: 360,
                props: {
                    text: '   1. Base Mounting\n   2. Wiring Assembly\n▶ 3. Torque Inspection\n   4. Quality Sign-Off',
                    fontSize: 14,
                    lineHeight: 2.2,
                    color: '#1e293b',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px'
                }
            },
            {
                id: `s4_img_${ts}`, type: 'IMAGE',
                x: 250, y: 80, w: 420, h: 260,
                props: {
                    src: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600',
                    alt: 'Torque Tool Guide',
                    borderRadius: '8px'
                }
            },
            {
                id: `s4_inst_${ts}`, type: 'TEXT',
                x: 250, y: 360, w: 420, h: 100,
                props: {
                    text: 'INSTRUCTIONS:\n1. Fasten the PCB case cover with 4 hex bolts.\n2. Use Digital Torque Driver (TD-07) to torque bolts in cross pattern.\n3. Input the final torque value below (Spec: 2.5 - 3.0 Nm).',
                    fontSize: 13,
                    color: '#334155'
                }
            },
            {
                id: `s4_spec_lsl_lbl_${ts}`, type: 'TEXT',
                x: 690, y: 80, w: 130, h: 20,
                props: { text: 'LSL (Lower)', fontSize: 11, color: '#64748b' }
            },
            {
                id: `s4_spec_lsl_${ts}`, type: 'TEXT',
                x: 690, y: 100, w: 130, h: 30,
                props: { text: '2.5 Nm', fontSize: 18, fontWeight: 'bold', color: '#b91c1c' }
            },
            {
                id: `s4_spec_usl_lbl_${ts}`, type: 'TEXT',
                x: 840, y: 80, w: 130, h: 20,
                props: { text: 'USL (Upper)', fontSize: 11, color: '#64748b' }
            },
            {
                id: `s4_spec_usl_${ts}`, type: 'TEXT',
                x: 840, y: 100, w: 130, h: 30,
                props: { text: '3.0 Nm', fontSize: 18, fontWeight: 'bold', color: '#b91c1c' }
            },
            {
                id: `s4_torque_input_${ts}`, type: 'NUMBER_INPUT',
                x: 690, y: 140, w: 280, h: 55,
                props: {
                    label: 'Torque Value (Nm)',
                    placeholder: 'Enter torque value...',
                    targetVariable: 'Torque_Val',
                    required: true
                }
            },
            {
                id: `s4_torque_submit_${ts}`, type: 'BUTTON',
                x: 690, y: 210, w: 280, h: 45,
                props: {
                    label: 'VERIFY TORQUE', text: 'VERIFY TORQUE',
                    backgroundColor: '#1e40af', color: 'white', fontWeight: 'bold',
                    triggers: [
                        {
                            event: 'ON_CLICK',
                            actions: [
                                {
                                    type: 'SET_VARIABLE',
                                    payload: {
                                        variable: 'Torque_Result',
                                        valueType: 'EXPRESSION',
                                        value: 'Number(@Torque_Val) >= 2.5 && Number(@Torque_Val) <= 3.0 ? "PASS" : "FAIL"'
                                    }
                                },
                                {
                                    type: 'SHOW_MESSAGE',
                                    payload: {
                                        message: 'Torque verification PASSED ✓',
                                        msgType: 'success',
                                        showIf: 'Number(@Torque_Val) >= 2.5 && Number(@Torque_Val) <= 3.0'
                                    }
                                },
                                {
                                    type: 'SHOW_MESSAGE',
                                    payload: {
                                        message: '⚠️ Torque out of spec! (2.5 - 3.0 Nm required)',
                                        msgType: 'error',
                                        showIf: 'Number(@Torque_Val) < 2.5 || Number(@Torque_Val) > 3.0'
                                    }
                                }
                            ]
                        }
                    ]
                }
            },
            {
                id: `s4_wo_info_${ts}`, type: 'RECORD_DISPLAY',
                x: 690, y: 280, w: 280, h: 160,
                props: {
                    title: 'Active Order',
                    placeholderId: `rp_wo_${ts}`,
                    fieldsToShow: ['Work_Order_ID', 'Material_ID']
                }
            },
            {
                id: `s4_prev_btn_${ts}`, type: 'BUTTON',
                x: 250, y: 480, w: 150, h: 50,
                props: {
                    label: '◀ PREVIOUS', text: '◀ PREVIOUS',
                    backgroundColor: '#64748b', color: 'white',
                    triggers: [{ event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }]
                }
            },
            {
                id: `s4_next_btn_${ts}`, type: 'BUTTON',
                x: 820, y: 480, w: 150, h: 50,
                props: {
                    label: 'NEXT ▶', text: 'NEXT ▶',
                    backgroundColor: '#2563eb', color: 'white',
                    triggers: [{ event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };

    // --- STEP 5: Quality Sign-Off ---
    const stepQualitySignOff = {
        id: `step_assembly_4_${ts}`,
        title: '4. Quality Sign-Off',
        stepType: 'Step',
        components: [
            {
                id: `s5_hdr_${ts}`, type: 'TEXT',
                x: 30, y: 20, w: 940, h: 40,
                props: { text: 'Step 4 of 4: Quality Sign-Off & Defect Logging', fontSize: 22, fontWeight: 'bold', color: '#1e293b' }
            },
            {
                id: `s5_sidebar_${ts}`, type: 'TEXT',
                x: 30, y: 80, w: 200, h: 360,
                props: {
                    text: '   1. Base Mounting\n   2. Wiring Assembly\n   3. Torque Inspection\n▶ 4. Quality Sign-Off',
                    fontSize: 14,
                    lineHeight: 2.2,
                    color: '#1e293b',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px'
                }
            },
            {
                id: `s5_pf_widget_${ts}`, type: 'QUALITY_PASS_FAIL',
                x: 250, y: 80, w: 420, h: 80,
                props: {
                    label: 'Final Visual Quality Status',
                    targetVariable: 'Quality_Status',
                    required: true
                }
            },
            {
                id: `s5_defect_reason_${ts}`, type: 'DROPDOWN',
                x: 250, y: 180, w: 420, h: 50,
                props: {
                    label: 'Defect Reason (Select if Reject)',
                    options: ['None', 'Scratch/Dent', 'Loose Wiring Connection', 'Torque Out of Limit', 'PCB Faulty / No Power'],
                    targetVariable: 'Defect_Reason',
                    defaultValue: 'None'
                }
            },
            {
                id: `s5_notes_${ts}`, type: 'TEXT_AREA',
                x: 250, y: 250, w: 420, h: 90,
                props: {
                    label: 'Additional Inspection Notes',
                    placeholder: 'Write any observations here...',
                    targetVariable: 'Inspection_Notes'
                }
            },
            {
                id: `s5_sign_${ts}`, type: 'SIGNATURE',
                x: 690, y: 80, w: 280, h: 220,
                props: {
                    label: 'Operator Signature Sign-Off',
                    targetVariable: 'Operator_Signature',
                    required: true
                }
            },
            {
                id: `s5_wo_info_${ts}`, type: 'RECORD_DISPLAY',
                x: 690, y: 310, w: 280, h: 130,
                props: {
                    title: 'Active Order',
                    placeholderId: `rp_wo_${ts}`,
                    fieldsToShow: ['Work_Order_ID', 'Material_ID']
                }
            },
            {
                id: `s5_prev_btn_${ts}`, type: 'BUTTON',
                x: 250, y: 480, w: 150, h: 50,
                props: {
                    label: '◀ PREVIOUS', text: '◀ PREVIOUS',
                    backgroundColor: '#64748b', color: 'white',
                    triggers: [{ event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }]
                }
            },
            {
                id: `s5_next_btn_${ts}`, type: 'BUTTON',
                x: 820, y: 480, w: 150, h: 50,
                props: {
                    label: 'NEXT ▶', text: 'NEXT ▶',
                    backgroundColor: '#2563eb', color: 'white',
                    triggers: [{ event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };

    // --- STEP 6: Review & Finalize ---
    const stepReviewAndFinalize = {
        id: `step_review_${ts}`,
        title: 'Review & Finalize',
        stepType: 'Step',
        components: [
            {
                id: `s6_hdr_${ts}`, type: 'TEXT',
                x: 30, y: 20, w: 940, h: 40,
                props: { text: '📋 Production Assembly Run Summary', fontSize: 24, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center' }
            },
            {
                id: `s6_wo_id_view_${ts}`, type: 'TEXT_INPUT',
                x: 50, y: 80, w: 400, h: 50,
                props: { label: 'Work Order ID', targetVariable: 'Selected_WO_ID', readOnly: true }
            },
            {
                id: `s6_serial_view_${ts}`, type: 'TEXT_INPUT',
                x: 50, y: 150, w: 400, h: 50,
                props: { label: 'PCB Serial Number', targetVariable: 'PCB_Serial', readOnly: true }
            },
            {
                id: `s6_torque_view_${ts}`, type: 'TEXT_INPUT',
                x: 50, y: 220, w: 400, h: 50,
                props: { label: 'Torque Value (Nm)', targetVariable: 'Torque_Val', readOnly: true }
            },
            {
                id: `s6_torque_res_view_${ts}`, type: 'TEXT_INPUT',
                x: 50, y: 290, w: 400, h: 50,
                props: { label: 'Torque Spec Verdict', targetVariable: 'Torque_Result', readOnly: true }
            },
            {
                id: `s6_quality_view_${ts}`, type: 'TEXT_INPUT',
                x: 520, y: 80, w: 430, h: 50,
                props: { label: 'Overall Quality Status', targetVariable: 'Quality_Status', readOnly: true }
            },
            {
                id: `s6_defect_view_${ts}`, type: 'TEXT_INPUT',
                x: 520, y: 150, w: 430, h: 50,
                props: { label: 'Defect Reason (if any)', targetVariable: 'Defect_Reason', readOnly: true }
            },
            {
                id: `s6_sign_view_${ts}`, type: 'IMAGE',
                x: 520, y: 220, w: 430, h: 120,
                props: { label: 'Digital Signature Captured', src: '@Operator_Signature', alt: 'Operator Signature' }
            },
            {
                id: `s6_prev_btn_${ts}`, type: 'BUTTON',
                x: 50, y: 480, w: 150, h: 50,
                props: {
                    label: '◀ PREVIOUS', text: '◀ PREVIOUS',
                    backgroundColor: '#64748b', color: 'white',
                    triggers: [{ event: 'ON_CLICK', actions: [{ type: 'PREV_STEP' }] }]
                }
            },
            {
                id: `s6_complete_btn_${ts}`, type: 'BUTTON',
                x: 250, y: 375, w: 500, h: 75,
                props: {
                    label: '✅ COMPLETE & LOG RUN', text: '✅ COMPLETE & LOG RUN',
                    backgroundColor: '#10b981', color: 'white', fontSize: 18, fontWeight: 'bold',
                    triggers: [
                        {
                            event: 'ON_CLICK',
                            actions: [
                                {
                                    type: 'SET_VARIABLE',
                                    payload: {
                                        variable: 'End_Time',
                                        valueType: 'EXPRESSION',
                                        value: 'new Date().toISOString()'
                                    }
                                },
                                {
                                    type: 'SET_VARIABLE',
                                    payload: {
                                        variable: 'Cycle_Time_Sec',
                                        valueType: 'EXPRESSION',
                                        value: 'Math.max(1, Math.floor((new Date(@End_Time) - new Date(@Start_Time)) / 1000))'
                                    }
                                },
                                {
                                    type: 'TABLE_RECORD_CREATE',
                                    payload: {
                                        tableId: T.activityLogs,
                                        mapping: {
                                            'Work_Order_ID': '@Selected_WO_ID',
                                            'Operator': '{{$GLOBAL_USER}}',
                                            'Station_ID': '@Station_ID',
                                            'PCB_Serial': '@PCB_Serial',
                                            'Torque_Value': '@Torque_Val',
                                            'Quality_Status': '@Quality_Status',
                                            'Defect_Reason': '@Defect_Reason',
                                            'Cycle_Time_Sec': '@Cycle_Time_Sec',
                                            'Timestamp': '@End_Time'
                                        }
                                    }
                                },
                                {
                                    type: 'TABLE_RECORD_SAVE',
                                    payload: {
                                        placeholderId: `rp_wo_${ts}`,
                                        mapping: {
                                            'QTY_Complete': '{{Number(@Current_Work_Order.QTY_Complete || 0) + 1}}',
                                            'Status': '{{Number(@Current_Work_Order.QTY_Complete || 0) + 1 >= Number(@Current_Work_Order.QTY_Required) ? "COMPLETED" : "IN PROGRESS"}}'
                                        }
                                    }
                                },
                                {
                                    type: 'SHOW_MESSAGE',
                                    payload: {
                                        message: 'Production Run Logged & Work Order Updated ✓',
                                        msgType: 'success'
                                    }
                                },
                                // Reset variables for next run
                                {
                                    type: 'SET_VARIABLE',
                                    payload: { variable: 'PCB_Serial', valueType: 'STATIC', value: '' }
                                },
                                {
                                    type: 'SET_VARIABLE',
                                    payload: { variable: 'Torque_Val', valueType: 'STATIC', value: 0 }
                                },
                                {
                                    type: 'SET_VARIABLE',
                                    payload: { variable: 'Torque_Result', valueType: 'STATIC', value: 'PENDING' }
                                },
                                {
                                    type: 'SET_VARIABLE',
                                    payload: { variable: 'Quality_Status', valueType: 'STATIC', value: 'PASS' }
                                },
                                {
                                    type: 'SET_VARIABLE',
                                    payload: { variable: 'Defect_Reason', valueType: 'STATIC', value: 'None' }
                                },
                                {
                                    type: 'SET_VARIABLE',
                                    payload: { variable: 'Operator_Signature', valueType: 'STATIC', value: '' }
                                },
                                // Redirect to select step
                                {
                                    type: 'GO_TO_STEP',
                                    stepId: `step_select_wo_${ts}`,
                                    payload: { stepId: `step_select_wo_${ts}` }
                                }
                            ]
                        }
                    ]
                }
            }
        ]
    };

    return {
        id: `app_wi_${ts}`,
        name: 'Work Instructions Example App',
        description: 'Guided multi-step manufacturing instructions with checklist, barcode verification, torque limits, and digital signature sign-off.',
        category: 'Production Control',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,

        config: {
            appVariables,
            recordPlaceholders,
            appTables: [T.workOrders, T.activityLogs],
            appTriggers: [
                {
                    id: `trig_start_wi_${ts}`,
                    name: 'WI Module Start',
                    event: 'ON_APP_START',
                    actions: [
                        { type: 'SHOW_MESSAGE', payload: { message: '🔧 Assembly Work Instructions Loaded', msgType: 'info' } }
                    ]
                }
            ],
            steps: [
                stepSelectWorkOrder,
                stepBaseMounting,
                stepWiringAssembly,
                stepTorqueInspection,
                stepQualitySignOff,
                stepReviewAndFinalize
            ]
        }
    };
}
