/**
 * safetyTemplate.js
 * Generates an Enterprise-grade Safety & LOTO application JSON structure for MAVI-MES
 */

export function createSafetyTemplate() {
    const timestamp = Date.now();
    const currentIso = new Date().toISOString();

    return {
        id: `app_template_safety_${timestamp}`,
        name: "EHS Safety & LOTO Enterprise",
        description: "Zero-accident safety management with mandatory PPE checks, hazard mapping, and LOTO compliance.",
        category: "Safety",
        type: "FRONT-LINE",
        published: true,
        approvalStatus: "APPROVED",
        createdAt: currentIso,
        updatedAt: currentIso,
        
        config: {
            appVariables: [
                { id: `var_permit_${timestamp}`, name: "Permit_Number", type: "string", defaultValue: "P-2026-TEMP", persisted: true },
                { id: `var_hazard_count_${timestamp}`, name: "Hazards_Found", type: "number", defaultValue: 0, persisted: false },
                { id: `var_safety_status_${timestamp}`, name: "Compliance_Status", type: "string", defaultValue: "PENDING", persisted: false }
            ],
            appFunctions: [
                {
                    id: `func_risk_${timestamp}`,
                    name: "Calculate_Risk_Level",
                    description: "Assess risk level based on hazard count and severity",
                    inputs: [
                        { name: "count", type: "NUMBER" }
                    ],
                    steps: [
                        { type: "SET", variableName: "Risk", expression: "$count > 3 ? 'HIGH' : 'MEDIUM'" },
                        { type: "RETURN", expression: "$Risk" }
                    ]
                }
            ],
            recordPlaceholders: [
                {
                    id: `rp_safety_${timestamp}`,
                    name: "Active_Safety_Audit",
                    tableId: "safety_audits_placeholder",
                    description: "Main handle for the current safety audit session"
                }
            ],
            appTables: [],
            appTriggers: [
                {
                    id: `trig_alert_${timestamp}`,
                    name: "Compliance Monitor",
                    on: "STEP_ENTER",
                    actions: [
                        { type: "SHOW_MESSAGE", detail: { message: "Safety first! Please ensure all PPE is correctly worn before proceeding.", status: "INFO" } }
                    ]
                }
            ],
            baseComponents: [
                {
                    id: `bc_header_${timestamp}`,
                    type: "SHAPE",
                    x: 0, y: 0, w: 1024, h: 70,
                    props: { type: "rectangle", backgroundColor: "#ef4444", borderRadius: 0, strokeWidth: 0, triggers: [] }
                },
                {
                    id: `bc_title_${timestamp}`,
                    type: "TEXT",
                    x: 20, y: 20, w: 500, h: 30,
                    props: { text: "EHS COMPLIANCE: PERMIT TO WORK", fontSize: 22, fontWeight: "900", color: "#ffffff", triggers: [] }
                },
                {
                    id: `bc_permit_${timestamp}`,
                    type: "VARIABLE_TEXT",
                    x: 700, y: 20, w: 300, h: 30,
                    props: { 
                        varSource: "APP_INFO.PERMIT_NUMBER", 
                        fontSize: 18, 
                        fontWeight: "bold", 
                        color: "#ffffff", 
                        textAlign: "right",
                        triggers: []
                    }
                }
            ],
            steps: [
                // STEP 1: PERMIT INITIATION
                {
                    id: `step_init_${timestamp}`,
                    title: "1. Permit Initiation",
                    stepType: "Step",
                    cycleTimeSeconds: 30,
                    components: [
                        {
                            id: `c1_title_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 150, w: 400, h: 40,
                            props: { text: "Scan Work Area or Asset", fontSize: 26, fontWeight: "bold", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c1_scan_${timestamp}`,
                            type: "BARCODE",
                            x: 312, y: 220, w: 400, h: 60,
                            props: { 
                                placeholder: "Scan Tag...", 
                                autoFocus: true, 
                                triggers: [
                                    {
                                        id: `trig_scan_${timestamp}`,
                                        on: "BARCODE_SCANNED",
                                        actions: [
                                            { type: "DATA_MANIPULATION", detail: { target: "APP_INFO.PERMIT_NUMBER", operation: "SET", value: "PTW-{{EVENT.PAYLOAD}}" } },
                                            { type: "NAVIGATION", detail: { target: `step_ppe_${timestamp}` } }
                                        ]
                                    }
                                ] 
                            }
                        },
                        {
                            id: `c1_icon_${timestamp}`,
                            type: "SHAPE",
                            x: 462, y: 320, w: 100, h: 100,
                            props: { type: "circle", backgroundColor: "#fee2e2", triggers: [] }
                        }
                    ]
                },

                // STEP 2: PPE VERIFICATION
                {
                    id: `step_ppe_${timestamp}`,
                    title: "2. PPE Verification",
                    stepType: "Step",
                    cycleTimeSeconds: 90,
                    components: [
                        {
                            id: `c2_cam_${timestamp}`,
                            type: "IMAGE",
                            x: 40, y: 100, w: 460, h: 500,
                            props: { 
                                label: "Selfie for PPE Audit", 
                                mode: "CAMERA", 
                                required: true,
                                triggers: [] 
                            }
                        },
                        {
                            id: `c2_check_${timestamp}`,
                            type: "CHECKLIST",
                            x: 540, y: 100, w: 444, h: 400,
                            props: { 
                                title: "Confirm Mandatory Gear",
                                items: [
                                    "Safety Helmet (ANSI Z89.1)",
                                    "High-Visibility Vest",
                                    "Steel-Toed Boots",
                                    "Safety Glasses",
                                    "Cut-Resistant Gloves"
                                ], 
                                showProgress: true, 
                                triggers: [] 
                            }
                        },
                        {
                            id: `c2_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 540, y: 520, w: 444, h: 80,
                            props: { 
                                label: "PPE VERIFIED - PROCEED", 
                                backgroundColor: "#10b981", 
                                color: "#ffffff", 
                                action: "NEXT_STEP", 
                                targetStepId: `step_hazard_${timestamp}`,
                                triggers: [] 
                            }
                        }
                    ]
                },

                // STEP 3: HAZARD ASSESSMENT
                {
                    id: `step_hazard_${timestamp}`,
                    title: "3. Hazard Assessment",
                    stepType: "Form Step",
                    cycleTimeSeconds: 120,
                    components: [
                        {
                            id: `c3_title_${timestamp}`,
                            type: "TEXT",
                            x: 40, y: 100, w: 500, h: 40,
                            props: { text: "Identify Active Hazards", fontSize: 24, fontWeight: "bold", triggers: [] }
                        },
                        {
                            id: `c3_grid_${timestamp}`,
                            type: "CHECKLIST",
                            x: 40, y: 160, w: 944, h: 300,
                            props: { 
                                label: "Select all that apply in the immediate area:", 
                                options: [
                                    "⚡ Electrical Energy", 
                                    "🔥 Hot Work / Heat", 
                                    "🧪 Chemical Exposure", 
                                    "⚙️ Moving Parts", 
                                    "🌊 Slip/Trip Hazards", 
                                    "💨 Pressurized Gas", 
                                    "🏗️ Suspended Loads"
                                ],
                                triggers: [] 
                            }
                        },
                        {
                            id: `c3_notes_${timestamp}`,
                            type: "TEXT_INPUT",
                            x: 40, y: 480, w: 944, h: 100,
                            props: { label: "Mitigation Plan Notes", placeholder: "e.g. Using rubber mats, ventilation active...", triggers: [] }
                        },
                        {
                            id: `c3_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 744, y: 600, w: 240, h: 60,
                            props: { label: "CONFIRM HAZARDS", backgroundColor: "#ef4444", color: "white", action: "NEXT_STEP", targetStepId: `step_loto_${timestamp}`, triggers: [] }
                        }
                    ]
                },

                // STEP 4: LOTO EXECUTION
                {
                    id: `step_loto_${timestamp}`,
                    title: "4. LOTO Compliance",
                    stepType: "Step",
                    cycleTimeSeconds: 180,
                    components: [
                        {
                            id: `c4_info_${timestamp}`,
                            type: "SHAPE",
                            x: 40, y: 100, w: 944, h: 100,
                            props: { type: "rectangle", backgroundColor: "#fffbeb", borderRadius: 12, strokeWidth: 1, strokeColor: "#f59e0b", triggers: [] }
                        },
                        {
                            id: `c4_txt_${timestamp}`,
                            type: "TEXT",
                            x: 60, y: 125, w: 900, h: 50,
                            props: { text: "EXECUTE LOCK-OUT TAG-OUT: Scan each lock and provide photo evidence of the isolation point.", fontSize: 16, color: "#92400e", fontWeight: "bold", triggers: [] }
                        },
                        {
                            id: `c4_scan_${timestamp}`,
                            type: "BARCODE",
                            x: 40, y: 220, w: 460, h: 80,
                            props: { label: "Scan Lock ID", placeholder: "e.g. LOCK-99", triggers: [] }
                        },
                        {
                            id: `c4_img_${timestamp}`,
                            type: "IMAGE",
                            x: 40, y: 320, w: 460, h: 300,
                            props: { label: "Isolation Point Photo", mode: "CAMERA", triggers: [] }
                        },
                        {
                            id: `c4_checklist_${timestamp}`,
                            type: "CHECKLIST",
                            x: 540, y: 220, w: 444, h: 300,
                            props: { 
                                title: "Energy Verification",
                                items: [
                                    "Primary energy isolated",
                                    "Secondary energy bled/grounded",
                                    "Lock secured on energy source",
                                    "Tag attached with Name & Date",
                                    "Try-out successful (Nothing starts)"
                                ],
                                triggers: [] 
                            }
                        },
                        {
                            id: `c4_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 540, y: 540, w: 444, h: 80,
                            props: { 
                                label: "LOTO VERIFIED - FINALIZE", 
                                backgroundColor: "#b91c1c", 
                                color: "#ffffff", 
                                fontWeight: "bold",
                                action: "NEXT_STEP", 
                                targetStepId: `step_sign_${timestamp}`,
                                triggers: [] 
                            }
                        }
                    ]
                },

                // STEP 5: AUTHORIZATION
                {
                    id: `step_sign_${timestamp}`,
                    title: "5. Digital Authorization",
                    stepType: "Signature Form",
                    cycleTimeSeconds: 60,
                    components: [
                        {
                            id: `c5_title_${timestamp}`,
                            type: "TEXT",
                            x: 300, y: 100, w: 424, h: 40,
                            props: { text: "Digital Permit Authorization", fontSize: 24, fontWeight: "bold", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c5_desc_${timestamp}`,
                            type: "TEXT",
                            x: 300, y: 150, w: 424, h: 60,
                            props: { text: "I certify that all hazards have been assessed and all safety measures are in place as per ISO 45001 standards.", fontSize: 14, color: "#64748b", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c5_sign_${timestamp}`,
                            type: "SIGNATURE",
                            x: 300, y: 240, w: 424, h: 220,
                            props: { label: "Authorized Person Signature", required: true, triggers: [] }
                        },
                        {
                            id: `c5_done_${timestamp}`,
                            type: "COMPLETE_BUTTON",
                            x: 300, y: 500, w: 424, h: 80,
                            props: { 
                                label: "APPROVE & START WORK", 
                                action: "COMPLETE", 
                                backgroundColor: "#0f172a", 
                                color: "#ffffff", 
                                fontSize: 20, 
                                fontWeight: "bold", 
                                triggers: [
                                    {
                                        name: "Log Safety Permit",
                                        event: "ON_CLICK",
                                        actions: [
                                            {
                                                type: "CREATE_RECORD",
                                                payload: {
                                                    tableId: "safety_audits_placeholder",
                                                    mappings: {
                                                        "Permit_Number": { type: "VARIABLE", value: "Permit_Number" },
                                                        "Operator": { type: "VARIABLE", value: "APP_INFO.USER" },
                                                        "Compliance_Status": { type: "STATIC", value: "APPROVED" },
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
