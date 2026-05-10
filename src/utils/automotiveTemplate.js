/**
 * automotiveTemplate.js
 * Generates a professional Automotive Tune-Up application JSON structure for MAVI-MES
 * Includes OBD2 integration, physical service checklists, and performance validation.
 */

export function createAutomotiveTuneUpTemplate() {
    const timestamp = Date.now();
    const currentIso = new Date().toISOString();

    return {
        id: `app_template_auto_${timestamp}`,
        name: "Professional Car Tune-Up",
        description: "Standardized automotive service with OBD2 diagnostics, engine health monitoring, and multi-point inspection.",
        category: "Maintenance",
        type: "FRONT-LINE",
        published: true,
        approvalStatus: "APPROVED",
        createdAt: currentIso,
        updatedAt: currentIso,
        
        config: {
            appVariables: [
                { id: `var_vin_${timestamp}`, name: "Vehicle_VIN", type: "string", defaultValue: "SCAN-VIN", persisted: true },
                { id: `var_mileage_${timestamp}`, name: "Mileage", type: "number", defaultValue: 0, persisted: false },
                { id: `var_eng_status_${timestamp}`, name: "Engine_Status", type: "string", defaultValue: "WAITING_DIAG", persisted: false }
            ],
            appFunctions: [
                {
                    id: `func_idle_${timestamp}`,
                    name: "Check_Idle_Stability",
                    description: "Analyzes RPM variance for idle stability",
                    inputs: [
                        { name: "rpm_val", type: "NUMBER" }
                    ],
                    steps: [
                        { type: "SET", variableName: "Status", expression: "$rpm_val > 650 && $rpm_val < 850 ? 'STABLE' : 'UNSTABLE'" },
                        { type: "RETURN", expression: "$Status" }
                    ]
                }
            ],
            recordPlaceholders: [
                {
                    id: `rp_service_${timestamp}`,
                    name: "Active_Service_Record",
                    tableId: "automotive_logs_placeholder",
                    description: "Main record handle for the vehicle service"
                }
            ],
            appTables: [],
            appTriggers: [
                {
                    id: `trig_welcome_${timestamp}`,
                    name: "Service Start",
                    on: "APP_START",
                    actions: [
                        { type: "SHOW_MESSAGE", detail: { message: "Mechanic Mode Active. Connect OBD2 Scanner to begin diagnostics.", status: "INFO" } }
                    ]
                }
            ],
            baseComponents: [
                {
                    id: `bc_header_${timestamp}`,
                    type: "SHAPE",
                    x: 0, y: 0, w: 1024, h: 70,
                    props: { type: "rectangle", backgroundColor: "#1e293b", borderRadius: 0, strokeWidth: 0, triggers: [] }
                },
                {
                    id: `bc_title_${timestamp}`,
                    type: "TEXT",
                    x: 20, y: 20, w: 500, h: 30,
                    props: { text: "CAR TUNE-UP & DIAGNOSTICS", fontSize: 22, fontWeight: "900", color: "#facc15", triggers: [] }
                },
                {
                    id: `bc_vin_${timestamp}`,
                    type: "VARIABLE_TEXT",
                    x: 700, y: 20, w: 300, h: 30,
                    props: { 
                        varSource: "APP_INFO.VEHICLE_VIN", 
                        fontSize: 18, 
                        fontWeight: "bold", 
                        color: "#ffffff", 
                        textAlign: "right",
                        triggers: []
                    }
                }
            ],
            steps: [
                // STEP 1: VEHICLE ID
                {
                    id: `step_id_${timestamp}`,
                    title: "1. Vehicle Identification",
                    stepType: "Step",
                    cycleTimeSeconds: 45,
                    components: [
                        {
                            id: `c1_title_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 150, w: 400, h: 40,
                            props: { text: "Scan VIN / Plat Nomor", fontSize: 26, fontWeight: "bold", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c1_scan_${timestamp}`,
                            type: "BARCODE",
                            x: 312, y: 220, w: 400, h: 60,
                            props: { 
                                placeholder: "Scan Barcode...", 
                                autoFocus: true, 
                                triggers: [
                                    {
                                        id: `trig_vin_${timestamp}`,
                                        on: "BARCODE_SCANNED",
                                        actions: [
                                            { type: "DATA_MANIPULATION", detail: { target: "APP_INFO.VEHICLE_VIN", operation: "SET", value: "{{EVENT.PAYLOAD}}" } },
                                            { type: "NAVIGATION", detail: { target: `step_obd_${timestamp}` } }
                                        ]
                                    }
                                ] 
                            }
                        },
                        {
                            id: `c1_img_${timestamp}`,
                            type: "IMAGE",
                            x: 312, y: 320, w: 400, h: 250,
                            props: { src: "https://images.unsplash.com/photo-1517524008410-b4a16904a80b?auto=format&fit=crop&q=80&w=600", alt: "Mechanic Scanning", triggers: [] }
                        }
                    ]
                },

                // STEP 2: OBD2 DIAGNOSTICS
                {
                    id: `step_obd_${timestamp}`,
                    title: "2. OBD2 Diagnostics",
                    stepType: "Step",
                    cycleTimeSeconds: 120,
                    components: [
                        {
                            id: `c2_scanner_${timestamp}`,
                            type: "OBD2_SCANNER",
                            x: 40, y: 100, w: 300, h: 80,
                            props: { label: "Connect ELM327", triggers: [] }
                        },
                        {
                            id: `c2_rpm_${timestamp}`,
                            type: "OBD2_RPM",
                            x: 40, y: 200, w: 460, h: 180,
                            props: { label: "Engine RPM", triggers: [] }
                        },
                        {
                            id: `c2_temp_${timestamp}`,
                            type: "OBD2_COOLANT_TEMP",
                            x: 540, y: 200, w: 444, h: 180,
                            props: { label: "Coolant Temp", triggers: [] }
                        },
                        {
                            id: `c2_dtc_${timestamp}`,
                            type: "OBD2_DTC",
                            x: 40, y: 400, w: 944, h: 150,
                            props: { label: "Diagnostic Trouble Codes (DTC)", triggers: [] }
                        },
                        {
                            id: `c2_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 744, y: 580, w: 240, h: 60,
                            props: { label: "START SERVICE", backgroundColor: "#3b82f6", color: "white", action: "NEXT_STEP", targetStepId: `step_service_${timestamp}`, triggers: [] }
                        }
                    ]
                },

                // STEP 3: PHYSICAL SERVICE
                {
                    id: `step_service_${timestamp}`,
                    title: "3. Service & Inspection",
                    stepType: "Form Step",
                    cycleTimeSeconds: 300,
                    components: [
                        {
                            id: `c3_check_${timestamp}`,
                            type: "CHECKLIST",
                            x: 40, y: 100, w: 460, h: 500,
                            props: { 
                                title: "Tune-Up Checklist",
                                items: [
                                    "Spark Plugs (Busi) Inspected/Replaced",
                                    "Air Filter Cleaned/Replaced",
                                    "Throttle Body Cleaned",
                                    "Ignition Coils Inspected",
                                    "Fuel Injectors Checked",
                                    "Drive Belt Condition"
                                ], 
                                showProgress: true, 
                                triggers: [] 
                            }
                        },
                        {
                            id: `c3_cam_${timestamp}`,
                            type: "IMAGE",
                            x: 540, y: 100, w: 444, h: 300,
                            props: { label: "Evidence: Throttle Body Condition", mode: "CAMERA", required: true, triggers: [] }
                        },
                        {
                            id: `c3_radio_${timestamp}`,
                            type: "RADIO_GROUP",
                            x: 540, y: 420, w: 444, h: 120,
                            props: { 
                                label: "Engine Oil Condition", 
                                options: ["Golden / Clean", "Dark / Dirty", "SLUDGE - Requires Flush"], 
                                required: true,
                                triggers: [] 
                            }
                        },
                        {
                            id: `c3_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 540, y: 560, w: 444, h: 60,
                            props: { label: "GO TO PERFORMANCE TEST", backgroundColor: "#10b981", color: "white", action: "NEXT_STEP", targetStepId: `step_perf_${timestamp}`, triggers: [] }
                        }
                    ]
                },

                // STEP 4: PERFORMANCE TEST
                {
                    id: `step_perf_${timestamp}`,
                    title: "4. Performance Test",
                    stepType: "Step",
                    cycleTimeSeconds: 120,
                    components: [
                        {
                            id: `c4_load_${timestamp}`,
                            type: "OBD2_ENGINE_LOAD",
                            x: 40, y: 100, w: 460, h: 180,
                            props: { label: "Engine Load (Idle)", triggers: [] }
                        },
                        {
                            id: `c4_volt_${timestamp}`,
                            type: "OBD2_BATTERY_VOLTAGE",
                            x: 540, y: 100, w: 444, h: 180,
                            props: { label: "Alternator / Battery Voltage", triggers: [] }
                        },
                        {
                            id: `c4_clear_${timestamp}`,
                            type: "OBD2_CLEAR_DTC",
                            x: 40, y: 320, w: 460, h: 80,
                            props: { label: "Reset Trouble Codes", triggers: [] }
                        },
                        {
                            id: `c4_desc_${timestamp}`,
                            type: "TEXT",
                            x: 540, y: 320, w: 444, h: 80,
                            props: { text: "Ensure engine is running smoothly before clearing codes and finishing.", fontSize: 14, color: "#64748b", fontWeight: "bold", triggers: [] }
                        },
                        {
                            id: `c4_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 744, y: 500, w: 240, h: 80,
                            props: { label: "FINISH SERVICE", backgroundColor: "#0f172a", color: "white", fontWeight: "bold", action: "NEXT_STEP", targetStepId: `step_sign_${timestamp}`, triggers: [] }
                        }
                    ]
                },

                // STEP 5: SIGN-OFF
                {
                    id: `step_sign_${timestamp}`,
                    title: "5. Completion & Sign-off",
                    stepType: "Signature Form",
                    cycleTimeSeconds: 60,
                    components: [
                        {
                            id: `c5_title_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 100, w: 400, h: 40,
                            props: { text: "Service Report Ready", fontSize: 24, fontWeight: "bold", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c5_sign_${timestamp}`,
                            type: "SIGNATURE",
                            x: 312, y: 180, w: 400, h: 250,
                            props: { label: "Lead Mechanic Signature", required: true, triggers: [] }
                        },
                        {
                            id: `c5_done_${timestamp}`,
                            type: "COMPLETE_BUTTON",
                            x: 312, y: 480, w: 400, h: 80,
                            props: { label: "COMPLETE WORK ORDER", action: "COMPLETE", backgroundColor: "#facc15", color: "#1e293b", fontSize: 20, fontWeight: "bold", triggers: [] }
                        }
                    ]
                }
            ]
        }
    };
}
