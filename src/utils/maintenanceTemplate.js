/**
 * maintenanceTemplate.js
 * Generates a professional 5-step Preventive Maintenance application JSON structure for MAVI-MES
 */

export function createMaintenanceTemplate() {
    const timestamp = Date.now();
    const currentIso = new Date().toISOString();

    return {
        id: `app_template_maint_${timestamp}`,
        name: "Preventive Maintenance Pro",
        description: "Enterprise-grade machine maintenance with LOTO, meter logging, and health score analytics.",
        category: "Maintenance",
        type: "FRONT-LINE",
        published: true,
        approvalStatus: "APPROVED",
        createdAt: currentIso,
        updatedAt: currentIso,
        
        config: {
            appVariables: [
                { id: `var_mch_${timestamp}`, name: "Machine_ID", type: "string", defaultValue: "SCAN-MACHINE", persisted: true },
                { id: `var_meter_${timestamp}`, name: "Meter_Reading", type: "number", defaultValue: 0, persisted: false },
                { id: `var_health_${timestamp}`, name: "Health_Score", type: "number", defaultValue: 100, persisted: false },
                { id: `var_status_${timestamp}`, name: "Maint_Status", type: "string", defaultValue: "PENDING", persisted: false }
            ],
            appFunctions: [
                {
                    id: `func_health_${timestamp}`,
                    name: "Calculate_Machine_Health",
                    description: "Calculates health score based on meter deviation and inspection results",
                    inputs: [
                        { name: "meter_val", type: "NUMBER" },
                        { name: "threshold", type: "NUMBER" }
                    ],
                    steps: [
                        { type: "SET", variableName: "Score", expression: "100 - (($meter_val / $threshold) * 10)" },
                        { type: "RETURN", expression: "$Score" }
                    ]
                }
            ],
            recordPlaceholders: [
                {
                    id: `rp_maint_${timestamp}`,
                    name: "Active_Maintenance_Log",
                    tableId: "maintenance_logs_placeholder",
                    description: "Reference to the current maintenance record"
                }
            ],
            appTables: [],
            appTriggers: [
                {
                    id: `trig_start_${timestamp}`,
                    name: "Security Protocol Init",
                    on: "APP_START",
                    actions: [
                        { type: "SHOW_MESSAGE", detail: { message: "Maintenance Mode Activated. Ensure all safety gear is worn.", status: "WARNING" } }
                    ]
                }
            ],
            baseComponents: [
                {
                    id: `bc_header_${timestamp}`,
                    type: "SHAPE",
                    x: 0, y: 0, w: 1024, h: 70,
                    props: { type: "rectangle", backgroundColor: "#f59e0b", borderRadius: 0, strokeWidth: 0, triggers: [] }
                },
                {
                    id: `bc_title_${timestamp}`,
                    type: "TEXT",
                    x: 20, y: 20, w: 400, h: 30,
                    props: { text: "PREVENTIVE MAINTENANCE (PRO)", fontSize: 22, fontWeight: "900", color: "#ffffff", triggers: [] }
                },
                {
                    id: `bc_mch_${timestamp}`,
                    type: "VARIABLE_TEXT",
                    x: 700, y: 20, w: 300, h: 30,
                    props: { 
                        varSource: "APP_INFO.MACHINE_ID", 
                        fontSize: 18, 
                        fontWeight: "bold", 
                        color: "#000000", 
                        textAlign: "right",
                        triggers: []
                    }
                }
            ],
            steps: [
                // STEP 1: SCAN MACHINE
                {
                    id: `step_scan_${timestamp}`,
                    title: "1. Asset Identification",
                    stepType: "Step",
                    cycleTimeSeconds: 20,
                    components: [
                        {
                            id: `c1_title_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 150, w: 400, h: 40,
                            props: { text: "Scan Machine QR Code", fontSize: 26, fontWeight: "bold", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c1_scan_${timestamp}`,
                            type: "BARCODE",
                            x: 312, y: 220, w: 400, h: 60,
                            props: { 
                                placeholder: "Waiting for scan...", 
                                autoFocus: true, 
                                triggers: [
                                    {
                                        id: `trig_scan_${timestamp}`,
                                        name: "On Machine Scan",
                                        on: "BARCODE_SCANNED",
                                        actions: [
                                            { type: "DATA_MANIPULATION", detail: { target: "APP_INFO.MACHINE_ID", operation: "SET", value: "{{EVENT.PAYLOAD}}" } },
                                            { type: "NAVIGATION", detail: { target: `step_safety_${timestamp}` } }
                                        ]
                                    }
                                ] 
                            }
                        },
                        {
                            id: `c1_hint_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 300, w: 400, h: 60,
                            props: { text: "Position the QR code inside the frame to identify the asset automatically.", fontSize: 14, color: "#64748b", textAlign: "center", triggers: [] }
                        }
                    ]
                },

                // STEP 2: SAFETY & LOTO
                {
                    id: `step_safety_${timestamp}`,
                    title: "2. Safety Compliance (LOTO)",
                    stepType: "Step",
                    cycleTimeSeconds: 60,
                    components: [
                        {
                            id: `c2_alert_${timestamp}`,
                            type: "SHAPE",
                            x: 40, y: 100, w: 944, h: 80,
                            props: { type: "rectangle", backgroundColor: "#fee2e2", borderRadius: 12, strokeWidth: 1, strokeColor: "#ef4444", triggers: [] }
                        },
                        {
                            id: `c2_atxt_${timestamp}`,
                            type: "TEXT",
                            x: 60, y: 125, w: 900, h: 30,
                            props: { text: "DANGER: HIGH VOLTAGE AREA. MANDATORY LOCK-OUT TAG-OUT REQUIRED.", fontSize: 18, fontWeight: "bold", color: "#991b1b", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c2_check_${timestamp}`,
                            type: "CHECKLIST",
                            x: 40, y: 220, w: 500, h: 400,
                            props: { 
                                title: "Mandatory Safety Checklist",
                                items: [
                                    "Power Supply Disconnected",
                                    "Lock-Out Tag-Out (LOTO) Applied",
                                    "Hydraulic Pressure Released",
                                    "Personal Protective Equipment (PPE) Worn",
                                    "Area Cordoned Off"
                                ], 
                                showProgress: true, 
                                triggers: [] 
                            }
                        },
                        {
                            id: `c2_img_${timestamp}`,
                            type: "IMAGE",
                            x: 580, y: 220, w: 404, h: 300,
                            props: { src: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=600", alt: "LOTO Procedure", triggers: [] }
                        },
                        {
                            id: `c2_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 580, y: 540, w: 404, h: 80,
                            props: { 
                                label: "CONFIRM SAFETY PROTOCOL", 
                                backgroundColor: "#10b981", 
                                color: "#ffffff", 
                                fontSize: 18,
                                fontWeight: "bold",
                                action: "NEXT_STEP", 
                                targetStepId: `step_insp_${timestamp}`,
                                triggers: [] 
                            }
                        }
                    ]
                },

                // STEP 3: INSPECTION & EVIDENCE
                {
                    id: `step_insp_${timestamp}`,
                    title: "3. Visual Inspection",
                    stepType: "Form Step",
                    cycleTimeSeconds: 180,
                    components: [
                        {
                            id: `c3_title_${timestamp}`,
                            type: "TEXT",
                            x: 40, y: 100, w: 400, h: 40,
                            props: { text: "Condition Assessment", fontSize: 24, fontWeight: "bold", triggers: [] }
                        },
                        {
                            id: `c3_cam_${timestamp}`,
                            type: "IMAGE",
                            x: 40, y: 160, w: 460, h: 340,
                            props: { 
                                label: "Capture Current Condition", 
                                mode: "CAMERA", 
                                required: true,
                                triggers: [] 
                            }
                        },
                        {
                            id: `c3_radio_${timestamp}`,
                            type: "RADIO_GROUP",
                            x: 540, y: 160, w: 440, h: 150,
                            props: { 
                                label: "Belt Tension Status", 
                                options: ["Normal", "Slight Wear", "CRITICAL - Replace Immediately"], 
                                required: true,
                                triggers: [] 
                            }
                        },
                        {
                            id: `c3_text_${timestamp}`,
                            type: "TEXT_INPUT",
                            x: 540, y: 340, w: 440, h: 160,
                            props: { 
                                label: "Observation Notes", 
                                placeholder: "Describe any anomalies...", 
                                multiline: true,
                                triggers: [] 
                            }
                        },
                        {
                            id: `c3_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 540, y: 520, w: 440, h: 70,
                            props: { 
                                label: "LOG INSPECTION DATA", 
                                backgroundColor: "#3b82f6", 
                                color: "#ffffff", 
                                action: "NEXT_STEP", 
                                targetStepId: `step_meter_${timestamp}`,
                                triggers: [] 
                            }
                        }
                    ]
                },

                // STEP 4: METER LOGGING & PARTS
                {
                    id: `step_meter_${timestamp}`,
                    title: "4. Measurement & Parts",
                    stepType: "Form Step",
                    cycleTimeSeconds: 120,
                    components: [
                        {
                            id: `c4_num_${timestamp}`,
                            type: "NUMBER_INPUT",
                            x: 40, y: 120, w: 460, h: 100,
                            props: { 
                                label: "Current Meter Reading (Hours)", 
                                placeholder: "e.g. 12500", 
                                required: true,
                                triggers: [
                                    {
                                        id: `trig_val_${timestamp}`,
                                        on: "VALUE_CHANGED",
                                        actions: [
                                            { type: "DATA_MANIPULATION", detail: { target: "APP_INFO.METER_READING", operation: "SET", value: "{{EVENT.PAYLOAD}}" } }
                                        ]
                                    }
                                ]
                            }
                        },
                        {
                            id: `c4_tol_${timestamp}`,
                            type: "QUALITY_TOLERANCE",
                            x: 40, y: 260, w: 460, h: 200,
                            props: { 
                                label: "Hydraulic Pressure (PSI)", 
                                min: 1800, 
                                max: 2200, 
                                unit: "PSI",
                                triggers: [] 
                            }
                        },
                        {
                            id: `c4_list_${timestamp}`,
                            type: "MULTI_SELECT",
                            x: 540, y: 120, w: 440, h: 340,
                            props: { 
                                label: "Consumables Replaced", 
                                options: ["Oil Filter", "Air Filter", "Lube Oil", "Sealing Ring", "Drive Belt"],
                                triggers: [] 
                            }
                        },
                        {
                            id: `c4_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 540, y: 480, w: 440, h: 80,
                            props: { 
                                label: "FINALIZE MAINTENANCE", 
                                backgroundColor: "#f59e0b", 
                                color: "#ffffff", 
                                fontWeight: "bold",
                                action: "NEXT_STEP", 
                                targetStepId: `step_sign_${timestamp}`,
                                triggers: [] 
                            }
                        }
                    ]
                },

                // STEP 5: VALIDATION & SIGN-OFF
                {
                    id: `step_sign_${timestamp}`,
                    title: "5. Validation & Approval",
                    stepType: "Signature Form",
                    cycleTimeSeconds: 45,
                    components: [
                        {
                            id: `c5_score_${timestamp}`,
                            type: "SHAPE",
                            x: 312, y: 100, w: 400, h: 120,
                            props: { type: "rectangle", backgroundColor: "#f8fafc", borderRadius: 20, strokeWidth: 1, strokeColor: "#e2e8f0", triggers: [] }
                        },
                        {
                            id: `c5_stxt_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 130, w: 400, h: 30,
                            props: { text: "CALCULATED HEALTH SCORE", fontSize: 14, color: "#64748b", textAlign: "center", fontWeight: "800", triggers: [] }
                        },
                        {
                            id: `c5_sval_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 160, w: 400, h: 40,
                            props: { text: "98.5%", fontSize: 32, color: "#10b981", textAlign: "center", fontWeight: "900", triggers: [] }
                        },
                        {
                            id: `c5_sign_${timestamp}`,
                            type: "SIGNATURE",
                            x: 312, y: 260, w: 400, h: 220,
                            props: { label: "Operator Digital Signature", signatureMode: "DRAW", required: true, triggers: [] }
                        },
                        {
                            id: `c5_done_${timestamp}`,
                            type: "COMPLETE_BUTTON",
                            x: 312, y: 520, w: 400, h: 80,
                            props: { 
                                label: "SUBMIT MAINTENANCE REPORT", 
                                action: "COMPLETE", 
                                backgroundColor: "#0f172a", 
                                color: "#ffffff", 
                                fontSize: 18, 
                                fontWeight: "bold",
                                triggers: [] 
                            }
                        }
                    ]
                }
            ]
        }
    };
}
