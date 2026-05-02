/**
 * qcTemplate.js
 * Generates a complete QC Inspection application JSON structure for MAVI-MES
 */

export function createQCTemplate() {
    const timestamp = Date.now();
    const currentIso = new Date().toISOString();

    return {
        id: `app_qc_${timestamp}`,
        name: "QC Inspection Part A",
        description: "Automated QC checklist with data logging",
        category: "Quality Control",
        type: "FRONT-LINE",
        published: true,
        approvalStatus: "APPROVED",
        createdAt: currentIso,
        updatedAt: currentIso,
        
        config: {
            appVariables: [
                { id: `var_part_id_${timestamp}`, name: "Part_ID", type: "string", defaultValue: "", persisted: true },
                { id: `var_measured_val_${timestamp}`, name: "Measured_Value", type: "number", defaultValue: 0, persisted: false },
                { id: `var_inspect_result_${timestamp}`, name: "Inspect_Result", type: "string", defaultValue: "PENDING", persisted: false }
            ],
            recordPlaceholders: [
                {
                    id: `rp_qc_${timestamp}`,
                    name: "Current_Inspection",
                    tableId: "qvc",
                    description: "Active QC record handle"
                }
            ],
            appTables: ["qvc"],
            appTriggers: [
                {
                    id: `trig_start_${timestamp}`,
                    event: "ON_APP_START",
                    actions: [
                        { type: "SHOW_MESSAGE", payload: { message: "Quality Control Module Initialized", msgType: "info" } }
                    ]
                }
            ],
            steps: [
                {
                    id: `step_scan_${timestamp}`,
                    title: "1. Identify Part",
                    stepType: "Step",
                    components: [
                        {
                            id: `c1_title_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 120, w: 400, h: 40,
                            props: { text: "Quality Control Center", fontSize: 28, fontWeight: "bold", textAlign: "center", color: "var(--odoo-teal)", triggers: [] }
                        },
                        {
                            id: `c1_sub_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 170, w: 400, h: 30,
                            props: { text: "Please scan the part barcode to begin", fontSize: 16, textAlign: "center", color: "var(--text-secondary)", triggers: [] }
                        },
                        {
                            id: `c1_scan_${timestamp}`,
                            type: "TEXT_INPUT",
                            x: 312, y: 220, w: 400, h: 60,
                            props: { 
                                placeholder: "Scan or Enter Part ID...",
                                autoFocus: true,
                                triggers: [
                                    {
                                        id: `trig_scan_${timestamp}`,
                                        event: "ON_CHANGE",
                                        actions: [
                                            { type: "SET_VARIABLE", payload: { varPath: "Part_ID", value: "@EVENT_VALUE", valueType: "STATIC" } },
                                            { type: "GO_TO_STEP", payload: { targetId: `step_inspect_${timestamp}` } }
                                        ]
                                    }
                                ] 
                            }
                        },
                        {
                            id: `c1_img_${timestamp}`,
                            type: "IMAGE",
                            x: 412, y: 320, w: 200, h: 200,
                            props: { src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400", alt: "QC Illustration", triggers: [] }
                        }
                    ]
                },
                {
                    id: `step_inspect_${timestamp}`,
                    title: "2. Perform Inspection",
                    stepType: "Step",
                    components: [
                        {
                            id: `c2_header_bg_${timestamp}`,
                            type: "SHAPE",
                            x: 0, y: 0, w: 1024, h: 60,
                            props: { type: "rectangle", backgroundColor: "var(--bg-secondary)", triggers: [] }
                        },
                        {
                            id: `c2_header_${timestamp}`,
                            type: "TEXT",
                            x: 20, y: 15, w: 400, h: 30,
                            props: { text: "Quality Inspection Form", fontSize: 22, fontWeight: "bold", color: "var(--text-primary)", triggers: [] }
                        },
                        {
                            id: `c2_part_info_${timestamp}`,
                            type: "TEXT",
                            x: 50, y: 80, w: 400, h: 30,
                            props: { text: "Inspecting Part: @Part_ID", fontSize: 16, color: "var(--odoo-teal)", fontWeight: "bold", triggers: [] }
                        },
                        {
                            id: `c2_num_${timestamp}`,
                            type: "NUMBER_INPUT",
                            x: 50, y: 130, w: 400, h: 80,
                            props: { label: "Measurement Value (mm)", fontSize: 16, triggers: [
                                {
                                    event: "ON_CHANGE",
                                    actions: [
                                        { type: "SET_VARIABLE", payload: { varPath: "Measured_Value", value: "@EVENT_VALUE", valueType: "STATIC" } }
                                    ]
                                }
                            ] }
                        },
                        {
                            id: `c2_rad_${timestamp}`,
                            type: "DROPDOWN",
                            x: 50, y: 230, w: 400, h: 80,
                            props: { label: "Visual Result", elements: ["PASS", "FAIL"], triggers: [
                                {
                                    event: "ON_CHANGE",
                                    actions: [
                                        { type: "SET_VARIABLE", payload: { varPath: "Inspect_Result", value: "@EVENT_VALUE", valueType: "STATIC" } }
                                    ]
                                }
                            ] }
                        },
                        {
                            id: `c2_btn_submit_${timestamp}`,
                            type: "BUTTON",
                            x: 50, y: 340, w: 400, h: 60,
                            props: { 
                                text: "SUBMIT INSPECTION", 
                                backgroundColor: "var(--odoo-teal)", 
                                color: "white",
                                fontWeight: "bold",
                                triggers: [
                                    {
                                        event: "ON_CLICK",
                                        actions: [
                                            { 
                                                type: "CREATE_RECORD", 
                                                payload: { 
                                                    tableId: "qvc",
                                                    mappings: {
                                                        "part_id": { type: "VARIABLE", value: "Part_ID" },
                                                        "status": { type: "VARIABLE", value: "Inspect_Result" },
                                                        "measurement": { type: "VARIABLE", value: "Measured_Value" },
                                                        "operator": { type: "VARIABLE", value: "APP_INFO.USER" },
                                                        "timestamp": { type: "EXPRESSION", value: "NOW()" }
                                                    }
                                                } 
                                            },
                                            { type: "SHOW_MESSAGE", payload: { message: "Inspection saved!", msgType: "success" } },
                                            { type: "GO_TO_STEP", payload: { targetId: `step_scan_${timestamp}` } }
                                        ]
                                    }
                                ] 
                            }
                        },
                        {
                            id: `c2_btn_back_${timestamp}`,
                            type: "BUTTON",
                            x: 50, y: 410, w: 400, h: 40,
                            props: { 
                                text: "← Back to Scan", 
                                backgroundColor: "transparent", 
                                color: "var(--text-secondary)",
                                border: "1px solid var(--border-primary)",
                                triggers: [
                                    {
                                        event: "ON_CLICK",
                                        actions: [
                                            { type: "GO_TO_STEP", payload: { targetId: `step_scan_${timestamp}` } }
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
