/**
 * qcTemplate.js
 * Generates a complete QC Inspection application JSON structure for MAVI-MES
 * Includes 7 professional steps: Identification, Specification, Dimensional, Visual, Functional, Verification, and Sign-off.
 */

export function createQCTemplate() {
    const timestamp = Date.now();
    const currentIso = new Date().toISOString();

    return {
        id: `app_qc_${timestamp}`,
        name: "Professional QC Inspection",
        description: "Comprehensive 7-step QC checklist with auto-judgment and data logging",
        category: "Quality Control",
        type: "FRONT-LINE",
        published: true,
        approvalStatus: "APPROVED",
        createdAt: currentIso,
        updatedAt: currentIso,
        
        config: {
            appVariables: [
                { id: `var_part_id_${timestamp}`, name: "Part_ID", type: "string", defaultValue: "", persisted: true },
                { id: `var_dim_od_${timestamp}`, name: "Dim_OD", type: "number", defaultValue: 0, persisted: false },
                { id: `var_dim_len_${timestamp}`, name: "Dim_Length", type: "number", defaultValue: 0, persisted: false },
                { id: `var_dim_rough_${timestamp}`, name: "Dim_Roughness", type: "number", defaultValue: 0, persisted: false },
                { id: `var_vis_res_${timestamp}`, name: "Visual_Result", type: "string", defaultValue: "", persisted: false },
                { id: `var_func_val_${timestamp}`, name: "Func_Test_Value", type: "number", defaultValue: 0, persisted: false },
                { id: `var_func_res_${timestamp}`, name: "Func_Test_Result", type: "string", defaultValue: "", persisted: false },
                { id: `var_overall_res_${timestamp}`, name: "Overall_Judgment", type: "string", defaultValue: "PENDING", persisted: false },
                { id: `var_inspector_${timestamp}`, name: "Inspector_Name", type: "string", defaultValue: "@APP_INFO.USER", persisted: false },
                { id: `var_notes_${timestamp}`, name: "Inspection_Notes", type: "string", defaultValue: "", persisted: false }
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
                        { type: "SHOW_MESSAGE", payload: { message: "QC Inspection Module Initialized", msgType: "info" } }
                    ]
                }
            ],
            steps: [
                {
                    id: `step1_${timestamp}`,
                    title: "1. Part Identification",
                    stepType: "Step",
                    components: [
                        {
                            id: `s1_head_${timestamp}`, type: "TEXT",
                            x: 50, y: 50, w: 900, h: 40,
                            props: { text: "Quality Control - Part Entry", fontSize: 28, fontWeight: "bold", color: "#0f172a", textAlign: "center" }
                        },
                        {
                            id: `s1_barcode_${timestamp}`, type: "BARCODE",
                            x: 250, y: 150, w: 500, h: 80,
                            props: { 
                                placeholder: "Scan Part Barcode...", 
                                autoFocus: true,
                                targetVariable: "Part_ID",
                                triggers: [
                                    {
                                        name: "Submit Barcode & Auto Next",
                                        event: "ON_CHANGE",
                                        actions: [
                                            { type: "NEXT_STEP" }
                                        ]
                                    }
                                ]
                            }
                        },
                        {
                            id: `s1_img_${timestamp}`, type: "IMAGE",
                            x: 350, y: 280, w: 300, h: 300,
                            props: { src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400", alt: "Part Reference" }
                        }
                    ]
                },
                {
                    id: `step2_${timestamp}`,
                    title: "2. Specification Review",
                    stepType: "Step",
                    components: [
                        {
                            id: `s2_head_${timestamp}`, type: "TEXT",
                            x: 50, y: 50, w: 900, h: 40,
                            props: { text: "Review Specifications", fontSize: 24, fontWeight: "bold" }
                        },
                        {
                            id: `s2_info_${timestamp}`, type: "TEXT",
                            x: 50, y: 120, w: 900, h: 100,
                            props: { text: "Part ID: @Part_ID\nDrawing Rev: B\nMaterial: AL-6061\nOD Nom: 45.00 ±0.05 mm\nLen Nom: 120.00 ±0.10 mm", fontSize: 18, color: "#334155" }
                        },
                        {
                            id: `s2_chk_${timestamp}`, type: "CHECKLIST",
                            x: 50, y: 250, w: 900, h: 200,
                            props: { 
                                title: "Pre-Inspection Checks", 
                                items: ["Confirmed correct drawing revision", "Verified material certificate", "Gauges calibrated"],
                                required: true 
                            }
                        },
                        {
                            id: `s2_btn_${timestamp}`, type: "BUTTON",
                            x: 50, y: 500, w: 900, h: 60,
                            props: {
                                label: "CONTINUE", text: "CONTINUE", backgroundColor: "#3b82f6", color: "white", fontSize: 16, fontWeight: "bold",
                                triggers: [{ name: "Confirm Specs & Next", event: "ON_CLICK", actions: [{ type: "NEXT_STEP" }] }]
                            }
                        }
                    ]
                },
                {
                    id: `step3_${timestamp}`,
                    title: "3. Dimensional Inspection",
                    stepType: "Step",
                    components: [
                        {
                            id: `s3_head_${timestamp}`, type: "TEXT",
                            x: 50, y: 50, w: 900, h: 40,
                            props: { text: "Dimensional Checks", fontSize: 24, fontWeight: "bold" }
                        },
                        {
                            id: `s3_od_${timestamp}`, type: "QUALITY_TOLERANCE",
                            x: 50, y: 120, w: 900, h: 100,
                            props: { 
                                label: "Outer Diameter", min: 44.95, max: 45.05, unit: "mm",
                                targetVariable: "Dim_OD", required: true
                            }
                        },
                        {
                            id: `s3_len_${timestamp}`, type: "QUALITY_TOLERANCE",
                            x: 50, y: 240, w: 900, h: 100,
                            props: { 
                                label: "Total Length", min: 119.90, max: 120.10, unit: "mm",
                                targetVariable: "Dim_Length", required: true
                            }
                        },
                        {
                            id: `s3_rough_${timestamp}`, type: "QUALITY_TOLERANCE",
                            x: 50, y: 360, w: 900, h: 100,
                            props: { 
                                label: "Surface Roughness (Ra)", min: 0.4, max: 1.6, unit: "µm",
                                targetVariable: "Dim_Roughness", required: true
                            }
                        },
                        {
                            id: `s3_btn_${timestamp}`, type: "BUTTON",
                            x: 50, y: 500, w: 900, h: 60,
                            props: {
                                label: "CONTINUE", text: "CONTINUE", backgroundColor: "#3b82f6", color: "white", fontSize: 16, fontWeight: "bold",
                                triggers: [{ name: "Dimensional Complete & Next", event: "ON_CLICK", actions: [{ type: "NEXT_STEP" }] }]
                            }
                        }
                    ]
                },
                {
                    id: `step4_${timestamp}`,
                    title: "4. Visual Inspection",
                    stepType: "Step",
                    components: [
                        {
                            id: `s4_head_${timestamp}`, type: "TEXT",
                            x: 50, y: 50, w: 900, h: 40,
                            props: { text: "Visual Verification", fontSize: 24, fontWeight: "bold" }
                        },
                        {
                            id: `s4_chk_${timestamp}`, type: "CHECKLIST",
                            x: 50, y: 120, w: 900, h: 150,
                            props: { 
                                title: "Visual Defects to Check", 
                                items: ["No surface scratches", "No burrs or flash", "Consistent anodized color", "No contamination"]
                            }
                        },
                        {
                            id: `s4_cam_${timestamp}`, type: "CAMERA_CAPTURE",
                            x: 50, y: 290, w: 900, h: 300,
                            props: { label: "Capture Evidence Photo (if defect found)", required: false }
                        },
                        {
                            id: `s4_res_${timestamp}`, type: "QUALITY_PASS_FAIL",
                            x: 50, y: 610, w: 900, h: 100,
                            props: { 
                                label: "Overall Visual Judgment", required: true,
                                targetVariable: "Visual_Result"
                            }
                        },
                        {
                            id: `s4_btn_${timestamp}`, type: "BUTTON",
                            x: 50, y: 730, w: 900, h: 60,
                            props: {
                                label: "CONTINUE", text: "CONTINUE", backgroundColor: "#3b82f6", color: "white", fontSize: 16, fontWeight: "bold",
                                triggers: [{ name: "Visual Complete & Next", event: "ON_CLICK", actions: [{ type: "NEXT_STEP" }] }]
                            }
                        }
                    ]
                },
                {
                    id: `step5_${timestamp}`,
                    title: "5. Functional Test",
                    stepType: "Step",
                    components: [
                        {
                            id: `s5_head_${timestamp}`, type: "TEXT",
                            x: 50, y: 50, w: 900, h: 40,
                            props: { text: "Functional Test (Pressure)", fontSize: 24, fontWeight: "bold" }
                        },
                        {
                            id: `s5_desc_${timestamp}`, type: "TEXT",
                            x: 50, y: 110, w: 900, h: 50,
                            props: { text: "Connect part to the pneumatic rig and apply 5.0 MPa. Record the final steady pressure.", fontSize: 16 }
                        },
                        {
                            id: `s5_val_${timestamp}`, type: "QUALITY_TOLERANCE",
                            x: 50, y: 180, w: 900, h: 100,
                            props: { 
                                label: "Measured Pressure", min: 4.8, max: 5.2, unit: "MPa",
                                targetVariable: "Func_Test_Value", required: true
                            }
                        },
                        {
                            id: `s5_res_${timestamp}`, type: "QUALITY_PASS_FAIL",
                            x: 50, y: 300, w: 900, h: 100,
                            props: { 
                                label: "Functional Pass/Fail Decision", required: true,
                                targetVariable: "Func_Test_Result"
                            }
                        },
                        {
                            id: `s5_btn_${timestamp}`, type: "BUTTON",
                            x: 50, y: 420, w: 900, h: 60,
                            props: {
                                label: "CONTINUE", text: "CONTINUE", backgroundColor: "#3b82f6", color: "white", fontSize: 16, fontWeight: "bold",
                                triggers: [{ name: "Functional Complete & Next", event: "ON_CLICK", actions: [{ type: "NEXT_STEP" }] }]
                            }
                        }
                    ]
                },
                {
                    id: `step6_${timestamp}`,
                    title: "6. Data Verification",
                    stepType: "Step",
                    components: [
                        {
                            id: `s6_head_${timestamp}`, type: "TEXT",
                            x: 50, y: 50, w: 900, h: 40,
                            props: { text: "Review Inspection Data", fontSize: 24, fontWeight: "bold" }
                        },
                        {
                            id: `s6_id_${timestamp}`, type: "VARIABLE_TEXT",
                            x: 50, y: 110, w: 400, h: 40,
                            props: { label: "Part ID", targetVariable: "Part_ID" }
                        },
                        {
                            id: `s6_od_${timestamp}`, type: "VARIABLE_TEXT",
                            x: 50, y: 160, w: 400, h: 40,
                            props: { label: "Outer Diameter", targetVariable: "Dim_OD" }
                        },
                        {
                            id: `s6_len_${timestamp}`, type: "VARIABLE_TEXT",
                            x: 50, y: 210, w: 400, h: 40,
                            props: { label: "Total Length", targetVariable: "Dim_Length" }
                        },
                        {
                            id: `s6_rough_${timestamp}`, type: "VARIABLE_TEXT",
                            x: 500, y: 110, w: 400, h: 40,
                            props: { label: "Surface Roughness", targetVariable: "Dim_Roughness" }
                        },
                        {
                            id: `s6_vis_${timestamp}`, type: "VARIABLE_TEXT",
                            x: 500, y: 160, w: 400, h: 40,
                            props: { label: "Visual Result", targetVariable: "Visual_Result" }
                        },
                        {
                            id: `s6_func_${timestamp}`, type: "VARIABLE_TEXT",
                            x: 500, y: 210, w: 400, h: 40,
                            props: { label: "Functional Result", targetVariable: "Func_Test_Result" }
                        },
                        {
                            id: `s6_radio_${timestamp}`, type: "RADIO_GROUP",
                            x: 50, y: 280, w: 900, h: 100,
                            props: {
                                label: "Final Overall Judgment", options: ["OK", "NG"], required: true,
                                targetVariable: "Overall_Judgment"
                            }
                        },
                        {
                            id: `s6_btn_${timestamp}`, type: "BUTTON",
                            x: 50, y: 400, w: 900, h: 60,
                            props: {
                                label: "CONTINUE TO SIGN-OFF", text: "CONTINUE TO SIGN-OFF", backgroundColor: "#3b82f6", color: "white", fontSize: 16, fontWeight: "bold",
                                triggers: [{ name: "Confirm Specs & Next", event: "ON_CLICK", actions: [{ type: "NEXT_STEP" }] }]
                            }
                        }
                    ]
                },
                {
                    id: `step7_${timestamp}`,
                    title: "7. Sign-off",
                    stepType: "Step",
                    components: [
                        {
                            id: `s7_head_${timestamp}`, type: "TEXT",
                            x: 50, y: 50, w: 900, h: 40,
                            props: { text: "Submit Inspection", fontSize: 24, fontWeight: "bold" }
                        },
                        {
                            id: `s7_notes_${timestamp}`, type: "TEXT_AREA",
                            x: 50, y: 110, w: 900, h: 100,
                            props: { label: "Inspection Notes (Optional)", placeholder: "Add any comments...", targetVariable: "Inspection_Notes" }
                        },
                        {
                            id: `s7_btn_${timestamp}`, type: "BUTTON",
                            x: 50, y: 240, w: 900, h: 60,
                            props: {
                                label: "SUBMIT QC RECORD", text: "SUBMIT QC RECORD", backgroundColor: "#10b981", color: "white", fontSize: 18, fontWeight: "bold",
                                triggers: [
                                    {
                                        name: "Submit Inspection Record",
                                        event: "ON_CLICK",
                                        actions: [
                                            { 
                                                type: "CREATE_RECORD", 
                                                payload: { 
                                                    tableId: "qvc",
                                                    mappings: {
                                                        "part_id": { type: "VARIABLE", value: "Part_ID" },
                                                        "status": { type: "VARIABLE", value: "Overall_Judgment" },
                                                        "measurement": { type: "VARIABLE", value: "Dim_OD" },
                                                        "operator": { type: "VARIABLE", value: "APP_INFO.USER" },
                                                        "timestamp": { type: "EXPRESSION", value: "NOW()" }
                                                    }
                                                } 
                                            },
                                            { type: "SHOW_MESSAGE", payload: { message: "Quality inspection submitted successfully!", msgType: "success" } },
                                            { type: "COMPLETE_APP" }
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
