/**
 * tuneUpTemplate.js
 * Generates a complete Pro Car Tune-Up application JSON structure for MAVI-MES.
 * Showcases the advanced triggers (OBD2 integration, AI Analysis, Formulas, and Scripts).
 */

export function createTuneUpTemplate() {
    const timestamp = Date.now();
    const currentIso = new Date().toISOString();

    return {
        id: `app_template_tuneup_${timestamp}`,
        name: "Pro Car Tune-Up Diagnostics",
        description: "Advanced vehicle inspection integrating live OBD2 telemetry, AI health analysis, and automated checklist validation.",
        category: "Maintenance",
        type: "FRONT-LINE",
        published: true,
        approvalStatus: "APPROVED",
        createdAt: currentIso,
        updatedAt: currentIso,
        
        config: {
            appVariables: [
                { id: `var_vin_${timestamp}`, name: "Vehicle_VIN", type: "string", defaultValue: "", persisted: true },
                { id: `var_health_score_${timestamp}`, name: "Engine_Health_Score", type: "number", defaultValue: 100, persisted: false },
                { id: `var_ai_insight_${timestamp}`, name: "AI_Insight", type: "string", defaultValue: "Awaiting analysis...", persisted: false },
                { id: `var_service_status_${timestamp}`, name: "Service_Status", type: "string", defaultValue: "IN_PROGRESS", persisted: true }
            ],
            appFunctions: [],
            recordPlaceholders: [
                {
                    id: `rp_tuneup_${timestamp}`,
                    name: "Active_TuneUp_Record",
                    tableId: "tuneup_logs_placeholder",
                    description: "Logs the tune-up data"
                }
            ],
            appTables: [],
            appTriggers: [
                {
                    id: `trig_welcome_${timestamp}`,
                    name: "Initialize Diagnostic Variables",
                    on: "APP_START",
                    actions: [
                        { type: "SHOW_MESSAGE", payload: { message: "Pro Diagnostic Mode Initiated.", msgType: "success" } },
                        { type: "SET_VARIABLE", payload: { varPath: "Engine_Health_Score", value: "100", valueType: "STATIC" } },
                        { type: "TABLE_RECORD_CREATE", payload: { placeholderId: `rp_tuneup_${timestamp}` } }
                    ]
                }
            ],
            baseComponents: [
                {
                    id: `bc_header_${timestamp}`,
                    type: "SHAPE",
                    x: 0, y: 0, w: 1024, h: 70,
                    props: { type: "rectangle", backgroundColor: "#0f172a", borderRadius: 0, strokeWidth: 0, triggers: [] }
                },
                {
                    id: `bc_title_${timestamp}`,
                    type: "TEXT",
                    x: 20, y: 20, w: 500, h: 30,
                    props: { text: "PRO TUNE-UP & AI DIAGNOSTICS", fontSize: 22, fontWeight: "900", color: "#38bdf8", triggers: [] }
                },
                {
                    id: `bc_vin_${timestamp}`,
                    type: "VARIABLE_TEXT",
                    x: 700, y: 20, w: 300, h: 30,
                    props: { 
                        varSource: "Vehicle_VIN", 
                        fontSize: 18, 
                        fontWeight: "bold", 
                        color: "#ffffff", 
                        textAlign: "right",
                        triggers: []
                    }
                }
            ],
            steps: [
                // STEP 1: OBD2 CONNECT & SCAN
                {
                    id: `step_obd_${timestamp}`,
                    title: "1. Connect Vehicle & Scan",
                    stepType: "Step",
                    cycleTimeSeconds: 120,
                    components: [
                        {
                            id: `c1_connect_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 40, y: 100, w: 300, h: 60,
                            props: { 
                                label: "CONNECT OBD2 (BLUETOOTH)", 
                                backgroundColor: "#3b82f6", 
                                color: "white", 
                                fontWeight: "bold",
                                triggers: [
                                    {
                                        id: `t_conn_${timestamp}`,
                                        on: "CLICK",
                                        actions: [
                                            { type: "OBD2_CONNECT", payload: { transport: "BLUETOOTH" } },
                                            { type: "SHOW_MESSAGE", payload: { message: "Connecting to vehicle...", msgType: "info" } }
                                        ]
                                    }
                                ] 
                            }
                        },
                        {
                            id: `c1_rpm_${timestamp}`,
                            type: "OBD2_RPM",
                            x: 40, y: 180, w: 460, h: 180,
                            props: { label: "Engine RPM", triggers: [] }
                        },
                        {
                            id: `c1_temp_${timestamp}`,
                            type: "OBD2_COOLANT_TEMP",
                            x: 520, y: 180, w: 464, h: 180,
                            props: { label: "Coolant Temp (C)", triggers: [] }
                        },
                        {
                            id: `c1_load_${timestamp}`,
                            type: "OBD2_ENGINE_LOAD",
                            x: 40, y: 380, w: 460, h: 180,
                            props: { label: "Engine Load %", triggers: [] }
                        },
                        {
                            id: `c1_scan_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 520, y: 380, w: 464, h: 80,
                            props: { 
                                label: "READ DTCs", 
                                backgroundColor: "#ef4444", 
                                color: "white", 
                                fontWeight: "bold",
                                triggers: [
                                    {
                                        id: `t_read_${timestamp}`,
                                        on: "CLICK",
                                        actions: [
                                            { type: "OBD2_QUERY", payload: { pid: "DTC" } },
                                            { type: "SHOW_MESSAGE", payload: { message: "Reading fault codes...", msgType: "warning" } }
                                        ]
                                    }
                                ] 
                            }
                        },
                        {
                            id: `c1_dtc_${timestamp}`,
                            type: "OBD2_DTC",
                            x: 520, y: 480, w: 464, h: 80,
                            props: { label: "Fault Codes Found", triggers: [] }
                        },
                        {
                            id: `c1_next_${timestamp}`,
                            type: "BUTTON",
                            x: 40, y: 600, w: 944, h: 60,
                            props: { label: "PROCEED TO INSPECTION", backgroundColor: "#10b981", color: "white", action: "NEXT_STEP", triggers: [] }
                        }
                    ]
                },

                // STEP 2: INSPECTION & AI ANALYSIS
                {
                    id: `step_inspect_${timestamp}`,
                    title: "2. Inspection & AI Analysis",
                    stepType: "Form Step",
                    cycleTimeSeconds: 300,
                    components: [
                        {
                            id: `c2_checklist_${timestamp}`,
                            type: "CHECKLIST",
                            x: 40, y: 100, w: 460, h: 400,
                            props: { 
                                title: "Multi-Point Inspection",
                                items: [
                                    "Oil Level Normal",
                                    "Brake Pads > 40%",
                                    "Tire Pressure Nominal",
                                    "Air Filter Clean"
                                ], 
                                showProgress: true, 
                                targetVariable: "Inspection_Progress",
                                triggers: [] 
                            }
                        },
                        {
                            id: `c2_cam_${timestamp}`,
                            type: "IMAGE",
                            x: 540, y: 100, w: 444, h: 250,
                            props: { label: "Engine Bay Photo", mode: "CAMERA", required: true, triggers: [] }
                        },
                        {
                            id: `c2_ai_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 540, y: 370, w: 444, h: 60,
                            props: { 
                                label: "ANALYZE ENGINE HEALTH", 
                                backgroundColor: "#8b5cf6", 
                                color: "white", 
                                fontWeight: "bold",
                                triggers: [
                                    {
                                        id: `t_ai_${timestamp}`,
                                        on: "CLICK",
                                        actions: [
                                            { 
                                                type: "AI_PROCESS", 
                                                payload: { 
                                                    promptType: "STATIC", 
                                                    prompt: "Based on standard car tune-up procedures, suggest immediate repairs if the coolant temp is above 95C and engine load is above 40% at idle.",
                                                    resultVar: "AI_Insight" 
                                                } 
                                            },
                                            {
                                                type: "CALCULATE_FORMULA",
                                                payload: {
                                                    formula: "100 - (5 * 2)", // Simulated deduction
                                                    resultVar: "Engine_Health_Score"
                                                }
                                            }
                                        ]
                                    }
                                ] 
                            }
                        },
                        {
                            id: `c2_ai_output_${timestamp}`,
                            type: "VARIABLE_TEXT",
                            x: 540, y: 450, w: 444, h: 100,
                            props: { 
                                varSource: "AI_Insight", 
                                fontSize: 14, 
                                color: "#f8fafc", 
                                backgroundColor: "#334155",
                                textAlign: "left",
                                triggers: []
                            }
                        },
                        {
                            id: `c2_next_${timestamp}`,
                            type: "BUTTON",
                            x: 40, y: 580, w: 944, h: 60,
                            props: { label: "PROCEED TO SIGN-OFF", backgroundColor: "#10b981", color: "white", action: "NEXT_STEP", triggers: [] }
                        }
                    ]
                },

                // STEP 3: REPAIR ACTIONS & SIGN-OFF
                {
                    id: `step_sign_${timestamp}`,
                    title: "3. Resolution & Sign-Off",
                    stepType: "Signature Form",
                    cycleTimeSeconds: 120,
                    components: [
                        {
                            id: `c3_health_score_${timestamp}`,
                            type: "VARIABLE_TEXT",
                            x: 40, y: 100, w: 460, h: 80,
                            props: { 
                                varSource: "Engine_Health_Score", 
                                fontSize: 48, 
                                fontWeight: "bold", 
                                color: "#10b981", 
                                textAlign: "center",
                                triggers: []
                            }
                        },
                        {
                            id: `c3_clear_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 540, y: 100, w: 444, h: 80,
                            props: { 
                                label: "CLEAR FAULT CODES (DTC)", 
                                backgroundColor: "#f59e0b", 
                                color: "white", 
                                fontWeight: "bold",
                                triggers: [
                                    {
                                        id: `t_clear_${timestamp}`,
                                        on: "CLICK",
                                        actions: [
                                            { type: "OBD2_CLEAR_DTC", payload: {} },
                                            { type: "SHOW_MESSAGE", payload: { message: "DTCs Cleared Successfully.", msgType: "success" } },
                                            { type: "CUSTOM_SCRIPT", payload: { script: "toast.success('ECU Resets completed.'); setVariable('Service_Status', 'COMPLETED');" } }
                                        ]
                                    }
                                ] 
                            }
                        },
                        {
                            id: `c3_sign_${timestamp}`,
                            type: "SIGNATURE",
                            x: 212, y: 220, w: 600, h: 250,
                            props: { label: "Mechanic Signature", required: true, triggers: [] }
                        },
                        {
                            id: `c3_done_${timestamp}`,
                            type: "COMPLETE_BUTTON",
                            x: 212, y: 500, w: 600, h: 80,
                            props: { 
                                label: "COMPLETE TUNE-UP", 
                                action: "COMPLETE", 
                                backgroundColor: "#0ea5e9", 
                                color: "white", 
                                fontSize: 20, 
                                fontWeight: "bold", 
                                triggers: [
                                    {
                                        id: `t_save_${timestamp}`,
                                        on: "CLICK",
                                        actions: [
                                            { type: "TABLE_RECORD_SAVE", payload: { placeholderId: `rp_tuneup_${timestamp}` } }
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
