/**
 * inventoryTemplate.js
 * Generates a complete 5-step material requisition/picking application JSON structure
 */

export function createMaterialRequisitionTemplate() {
    const timestamp = Date.now();
    const currentIso = new Date().toISOString();

    return {
        id: `app_template_inv_${timestamp}`,
        name: "Material Requisition",
        description: "Standardized picking process for warehouse to shop floor transfers.",
        category: "Logistics",
        type: "FRONT-LINE",
        published: true,
        approvalStatus: "APPROVED",
        createdAt: currentIso,
        updatedAt: currentIso,
        
        config: {
            appVariables: [
                { id: `var_req_id_${timestamp}`, name: "Requisition_ID", type: "string", defaultValue: "REQ-000", persisted: true },
                { id: `var_part_no_${timestamp}`, name: "Part_Number", type: "string", defaultValue: "P-100", persisted: false },
                { id: `var_qty_requested_${timestamp}`, name: "Qty_Requested", type: "number", defaultValue: 0, persisted: false },
                { id: `var_qty_picked_${timestamp}`, name: "Qty_Picked", type: "number", defaultValue: 0, persisted: false },
                { id: `var_bin_loc_${timestamp}`, name: "Bin_Location", type: "string", defaultValue: "ZONE-A-01", persisted: false }
            ],
            appFunctions: [],
            recordPlaceholders: [
                {
                    id: `rp_inv_${timestamp}`,
                    name: "Active_Picking_Ticket",
                    tableId: "inventory_table_placeholder",
                    description: "Handle for the current picking request"
                }
            ],
            appTables: [],
            appTriggers: [
                {
                    id: `trig_start_${timestamp}`,
                    name: "Init Logistics App",
                    on: "APP_START",
                    actions: [
                        { type: "SHOW_MESSAGE", detail: { message: "Inventory Module Loaded. Ready for picking.", status: "INFO" } }
                    ]
                }
            ],
            baseComponents: [
                {
                    id: `bc_header_${timestamp}`,
                    type: "SHAPE",
                    x: 0, y: 0, w: 1024, h: 60,
                    props: { type: "rectangle", backgroundColor: "#0ea5e9", borderRadius: 0, strokeWidth: 0, triggers: [] }
                },
                {
                    id: `bc_title_${timestamp}`,
                    type: "TEXT",
                    x: 20, y: 15, w: 400, h: 30,
                    props: { text: "Warehouse Picking Workflow", fontSize: 22, fontWeight: "bold", color: "#ffffff", triggers: [] }
                },
                {
                    id: `bc_user_${timestamp}`,
                    type: "VARIABLE_TEXT",
                    x: 750, y: 15, w: 250, h: 30,
                    props: { 
                        varSource: "APP_INFO.OPERATOR", 
                        fontSize: 18, 
                        fontWeight: "600", 
                        color: "#e0f2fe", 
                        textAlign: "right",
                        triggers: []
                    }
                }
            ],
            steps: [
                // STEP 1: SCAN PICK LIST
                {
                    id: `step_scan_list_${timestamp}`,
                    title: "1. Scan Picking Ticket",
                    stepType: "Step",
                    cycleTimeSeconds: 20,
                    parentGroupId: null,
                    formSubmit: { buttonLabel: "Next", requireAll: false },
                    triggers: [],
                    components: [
                        {
                            id: `c1_icon_${timestamp}`,
                            type: "TEXT",
                            x: 480, y: 100, w: 60, h: 60,
                            props: { text: "📋", fontSize: 48, textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c1_title_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 180, w: 400, h: 40,
                            props: { text: "Scan Requisition QR", fontSize: 24, fontWeight: "800", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c1_scan_${timestamp}`,
                            type: "BARCODE",
                            x: 312, y: 240, w: 400, h: 60,
                            props: { 
                                placeholder: "Scan Ticket Barcode...", 
                                autoFocus: true, 
                                triggers: [
                                    {
                                        id: `trig_scan_req_${timestamp}`,
                                        on: "BARCODE_SCANNED",
                                        actions: [
                                            { type: "DATA_MANIPULATION", detail: { target: `var_req_id_${timestamp}`, operation: "SET", value: "{{EVENT.PAYLOAD}}" } },
                                            { type: "NAVIGATION", detail: { target: `step_locate_${timestamp}` } }
                                        ]
                                    }
                                ] 
                            }
                        },
                        {
                            id: `c1_hint_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 320, w: 400, h: 40,
                            props: { text: "Sample ID: REQ-2026-X1", fontSize: 14, color: "#94a3b8", textAlign: "center", triggers: [] }
                        }
                    ]
                },

                // STEP 2: LOCATE MATERIAL
                {
                    id: `step_locate_${timestamp}`,
                    title: "2. Locate Item",
                    stepType: "Step",
                    cycleTimeSeconds: 45,
                    parentGroupId: null,
                    formSubmit: { buttonLabel: "At Location", requireAll: false },
                    triggers: [],
                    components: [
                        {
                            id: `c2_bin_label_${timestamp}`,
                            type: "TEXT",
                            x: 50, y: 100, w: 400, h: 40,
                            props: { text: "Target Bin Location", fontSize: 18, color: "#64748b", fontWeight: "bold", triggers: [] }
                        },
                        {
                            id: `c2_bin_val_${timestamp}`,
                            type: "VARIABLE_TEXT",
                            x: 50, y: 140, w: 400, h: 80,
                            props: { varSource: `var_bin_loc_${timestamp}`, fontSize: 64, fontWeight: "900", color: "#0ea5e9", triggers: [] }
                        },
                        {
                            id: `c2_map_${timestamp}`,
                            type: "IMAGE",
                            x: 500, y: 100, w: 480, h: 400,
                            props: { src: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800", alt: "Warehouse Map", triggers: [] }
                        },
                        {
                            id: `c2_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 50, y: 440, w: 400, h: 60,
                            props: { 
                                label: "CONFIRM LOCATION", 
                                backgroundColor: "#0ea5e9", 
                                color: "#ffffff", 
                                fontSize: 18,
                                action: "NEXT_STEP", 
                                targetStepId: `step_scan_item_${timestamp}`,
                                triggers: [] 
                            }
                        }
                    ]
                },

                // STEP 3: SCAN ITEM
                {
                    id: `step_scan_item_${timestamp}`,
                    title: "3. Verify Part",
                    stepType: "Step",
                    cycleTimeSeconds: 30,
                    parentGroupId: null,
                    formSubmit: { buttonLabel: "Verify", requireAll: false },
                    triggers: [],
                    components: [
                        {
                            id: `c3_title_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 120, w: 400, h: 40,
                            props: { text: "Scan Item Barcode", fontSize: 24, fontWeight: "bold", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c3_scan_${timestamp}`,
                            type: "BARCODE",
                            x: 312, y: 180, w: 400, h: 60,
                            props: { 
                                placeholder: "Scan Part...", 
                                autoFocus: true, 
                                triggers: [
                                    {
                                        id: `trig_verify_${timestamp}`,
                                        on: "BARCODE_SCANNED",
                                        actions: [
                                            { type: "DATA_MANIPULATION", detail: { target: `var_part_no_${timestamp}`, operation: "SET", value: "{{EVENT.PAYLOAD}}" } },
                                            { type: "NAVIGATION", detail: { target: `step_qty_${timestamp}` } }
                                        ]
                                    }
                                ] 
                            }
                        },
                        {
                            id: `c3_info_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 260, w: 400, h: 100,
                            props: { 
                                text: "Ensure the label matches the picking ticket requirements.", 
                                fontSize: 16, 
                                color: "#475569", 
                                textAlign: "center",
                                backgroundColor: "#f8fafc",
                                borderRadius: 12,
                                padding: 20,
                                triggers: [] 
                            }
                        }
                    ]
                },

                // STEP 4: QUANTITY
                {
                    id: `step_qty_${timestamp}`,
                    title: "4. Pick Quantity",
                    stepType: "Form Step",
                    cycleTimeSeconds: 40,
                    parentGroupId: null,
                    formSubmit: { buttonLabel: "Confirm Pick", requireAll: true },
                    triggers: [],
                    components: [
                        {
                            id: `c4_req_label_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 120, w: 400, h: 30,
                            props: { text: "REQUIRED QUANTITY", fontSize: 14, fontWeight: "800", color: "#64748b", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c4_req_val_${timestamp}`,
                            type: "VARIABLE_TEXT",
                            x: 312, y: 150, w: 400, h: 60,
                            props: { varSource: `var_qty_requested_${timestamp}`, fontSize: 48, fontWeight: "900", color: "#0f172a", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c4_input_${timestamp}`,
                            type: "NUMBER_INPUT",
                            x: 312, y: 240, w: 400, h: 80,
                            props: { 
                                label: "Actual Picked Quantity", 
                                placeholder: "0", 
                                fontSize: 24,
                                triggers: [
                                    {
                                        id: `trig_qty_sync_${timestamp}`,
                                        on: "VALUE_CHANGED",
                                        actions: [
                                            { type: "DATA_MANIPULATION", detail: { target: `var_qty_picked_${timestamp}`, operation: "SET", value: "{{EVENT.PAYLOAD}}" } }
                                        ]
                                    }
                                ]
                            }
                        },
                        {
                            id: `c4_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 312, y: 350, w: 400, h: 60,
                            props: { 
                                label: "VALIDATE & CONTINUE", 
                                action: "NEXT_STEP",
                                targetStepId: `step_dispatch_${timestamp}`,
                                backgroundColor: "#10b981", 
                                color: "white", 
                                fontSize: 18, 
                                triggers: [] 
                            }
                        }
                    ]
                },

                // STEP 5: DISPATCH
                {
                    id: `step_dispatch_${timestamp}`,
                    title: "5. Dispatch to Production",
                    stepType: "Step",
                    cycleTimeSeconds: 30,
                    parentGroupId: null,
                    formSubmit: { buttonLabel: "Complete Transfer", requireAll: true },
                    triggers: [],
                    components: [
                        {
                            id: `c5_title_${timestamp}`,
                            type: "TEXT",
                            x: 300, y: 120, w: 424, h: 40,
                            props: { text: "Transfer Confirmation", fontSize: 24, fontWeight: "bold", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c5_summary_${timestamp}`,
                            type: "TEXT",
                            x: 300, y: 180, w: 424, h: 120,
                            props: { 
                                text: "Materials have been picked and are ready for delivery to the assembly line.", 
                                fontSize: 16, 
                                textAlign: "center",
                                color: "#64748b",
                                triggers: [] 
                            }
                        },
                        {
                            id: `c5_sign_${timestamp}`,
                            type: "SIGNATURE",
                            x: 300, y: 320, w: 424, h: 160,
                            props: { label: "Picker Signature", signatureMode: "DRAW", required: true, triggers: [] }
                        },
                        {
                            id: `c5_done_${timestamp}`,
                            type: "COMPLETE_BUTTON",
                            x: 300, y: 500, w: 424, h: 80,
                            props: { 
                                label: "COMPLETE REQUISITION", 
                                action: "COMPLETE", 
                                backgroundColor: "#0f172a", 
                                color: "#ffffff", 
                                fontSize: 20, 
                                fontWeight: "bold", 
                                textAlign: "center", 
                                triggers: [
                                    {
                                        name: "Save Requisition Record",
                                        event: "ON_CLICK",
                                        actions: [
                                            {
                                                type: "CREATE_RECORD",
                                                payload: {
                                                    tableId: "inventory_table_placeholder",
                                                    mappings: {
                                                        "Requisition_ID": { type: "VARIABLE", value: "Requisition_ID" },
                                                        "Part_Number": { type: "VARIABLE", value: "Part_Number" },
                                                        "Qty_Picked": { type: "VARIABLE", value: "Qty_Picked" },
                                                        "Operator": { type: "VARIABLE", value: "APP_INFO.USER" },
                                                        "Status": { type: "STATIC", value: "COMPLETED" },
                                                        "Timestamp": { type: "EXPRESSION", value: "NOW()" }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ] 
                            }
                        }
                    ]
                }
            ]
        }
    };
}
