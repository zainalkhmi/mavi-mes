/**
 * defectTrackingTemplate.js
 * Generates a comprehensive Defect Tracking application JSON structure for MAVI-MES,
 * based on the industry-standard Tulip Defect Tracking template.
 */

export function createDefectTrackingTemplate() {
    const timestamp = Date.now();
    const currentIso = new Date().toISOString();

    return {
        id: `app_template_defect_${timestamp}`,
        name: "Defect Tracking & Rework",
        description: "Professional defect management system to report, monitor, and dispose of manufacturing defects with rework workflows.",
        category: "Quality",
        type: "FRONT-LINE",
        published: true,
        approvalStatus: "APPROVED",
        createdAt: currentIso,
        updatedAt: currentIso,
        
        config: {
            appVariables: [
                { id: `var_def_id_${timestamp}`, name: "Defect_ID", type: "string", defaultValue: "AUTO-GEN", persisted: true },
                { id: `var_mat_id_${timestamp}`, name: "Material_ID", type: "string", defaultValue: "", persisted: false },
                { id: `var_desc_${timestamp}`, name: "Defect_Description", type: "string", defaultValue: "", persisted: false },
                { id: `var_qty_${timestamp}`, name: "Quantity", type: "number", defaultValue: 1, persisted: false },
                { id: `var_status_${timestamp}`, name: "Defect_Status", type: "string", defaultValue: "NEW", persisted: false }
            ],
            recordPlaceholders: [
                {
                    id: `rp_defect_${timestamp}`,
                    name: "Selected_Defect",
                    tableId: "defect_events_placeholder",
                    description: "Main handle for the selected defect event"
                }
            ],
            appTables: [],
            baseComponents: [
                {
                    id: `bc_header_${timestamp}`,
                    type: "SHAPE",
                    x: 0, y: 0, w: 1024, h: 60,
                    props: { type: "rectangle", backgroundColor: "#f8fafc", borderRadius: 0, strokeWidth: 1, strokeColor: "#e2e8f0", triggers: [] }
                },
                {
                    id: `bc_title_${timestamp}`,
                    type: "TEXT",
                    x: 20, y: 15, w: 400, h: 30,
                    props: { text: "DEFECT MANAGEMENT", fontSize: 24, fontWeight: "bold", color: "#0f172a", triggers: [] }
                }
            ],
            steps: [
                // STEP 1: VIEW DEFECTS
                {
                    id: `step_view_${timestamp}`,
                    title: "View Defects",
                    stepType: "Step",
                    components: [
                        {
                            id: `c1_table_${timestamp}`,
                            type: "INTERACTIVE_TABLE",
                            x: 20, y: 100, w: 600, h: 500,
                            props: { 
                                title: "Select Defect Event", 
                                dataSource: "TABLE", 
                                tableId: "defect_events_placeholder",
                                columns: ["ID", "Material_ID", "Status", "Reported_Date"],
                                triggers: [] 
                            }
                        },
                        {
                            id: `c1_scanner_${timestamp}`,
                            type: "BARCODE",
                            x: 640, y: 100, w: 360, h: 200,
                            props: { label: "Scan Defect Label", placeholder: "Scan...", triggers: [] }
                        },
                        {
                            id: `c1_log_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 450, y: 620, w: 260, h: 60,
                            props: { 
                                label: "Log Defect", 
                                backgroundColor: "#ef4444", 
                                color: "white", 
                                action: "NEXT_STEP", 
                                targetStepId: `step_log_${timestamp}`,
                                triggers: [] 
                            }
                        },
                        {
                            id: `c1_manage_btn_${timestamp}`,
                            type: "BUTTON",
                            x: 740, y: 620, w: 260, h: 60,
                            props: { 
                                label: "View / Manage", 
                                backgroundColor: "#3b82f6", 
                                color: "white", 
                                action: "NEXT_STEP", 
                                targetStepId: `step_manage_${timestamp}`,
                                triggers: [] 
                            }
                        }
                    ]
                },

                // STEP 2: LOG DEFECTS
                {
                    id: `step_log_${timestamp}`,
                    title: "Log Defects",
                    stepType: "Form Step",
                    components: [
                        {
                            id: `c2_form_bg_${timestamp}`,
                            type: "SHAPE",
                            x: 20, y: 80, w: 480, h: 520,
                            props: { type: "rectangle", backgroundColor: "white", borderRadius: 12, strokeWidth: 1, strokeColor: "#e2e8f0", triggers: [] }
                        },
                        {
                            id: `c2_mat_${timestamp}`,
                            type: "TEXT_INPUT",
                            x: 40, y: 120, w: 440, h: 80,
                            props: { label: "Defective Material ID", placeholder: "Enter ID...", required: true, targetVariable: "Material_ID", triggers: [] }
                        },
                        {
                            id: `c2_desc_${timestamp}`,
                            type: "TEXT_INPUT",
                            x: 40, y: 220, w: 440, h: 120,
                            props: { label: "Defect Description", placeholder: "What's wrong?", multiline: true, targetVariable: "Defect_Description", triggers: [] }
                        },
                        {
                            id: `c2_qty_${timestamp}`,
                            type: "NUMBER_INPUT",
                            x: 40, y: 360, w: 440, h: 80,
                            props: { label: "Quantity", defaultValue: 1, targetVariable: "Quantity", triggers: [] }
                        },
                        {
                            id: `c2_cam_${timestamp}`,
                            type: "IMAGE",
                            x: 520, y: 80, w: 484, h: 520,
                            props: { label: "Capture Image of Defect", mode: "CAMERA", triggers: [] }
                        },
                        {
                            id: `c2_submit_${timestamp}`,
                            type: "BUTTON",
                            x: 740, y: 620, w: 260, h: 60,
                            props: { 
                                label: "Log Defect and Print Label", 
                                backgroundColor: "#ef4444", 
                                color: "white", 
                                action: "NEXT_STEP", 
                                targetStepId: `step_label_${timestamp}`,
                                triggers: [
                                    {
                                        name: "Save Defect Record",
                                        event: "ON_CLICK",
                                        actions: [
                                            {
                                                type: "CREATE_RECORD",
                                                payload: {
                                                    tableId: "defect_events_placeholder",
                                                    mappings: {
                                                        "Material_ID": { type: "VARIABLE", value: "Material_ID" },
                                                        "Description": { type: "VARIABLE", value: "Defect_Description" },
                                                        "Quantity": { type: "VARIABLE", value: "Quantity" },
                                                        "Status": { type: "STATIC", value: "NEW" },
                                                        "Reported_By": { type: "VARIABLE", value: "APP_INFO.USER" },
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
                },

                // STEP 3: PRINT LABEL
                {
                    id: `step_label_${timestamp}`,
                    title: "Label Preview",
                    stepType: "Step",
                    components: [
                        {
                            id: `c3_label_bg_${timestamp}`,
                            type: "SHAPE",
                            x: 262, y: 100, w: 500, h: 400,
                            props: { type: "rectangle", backgroundColor: "white", borderRadius: 8, strokeWidth: 2, strokeColor: "#000000", triggers: [] }
                        },
                        {
                            id: `c3_title_${timestamp}`,
                            type: "TEXT",
                            x: 282, y: 120, w: 460, h: 40,
                            props: { text: "DEFECT LABEL", fontSize: 28, fontWeight: "900", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c3_barcode_${timestamp}`,
                            type: "IMAGE",
                            x: 312, y: 250, w: 400, h: 100,
                            props: { src: "https://api.qrserver.com/v1/create-qr-code/?size=400x100&data=DEF-12345", alt: "Barcode", triggers: [] }
                        },
                        {
                            id: `c3_print_${timestamp}`,
                            type: "BUTTON",
                            x: 844, y: 620, w: 160, h: 60,
                            props: { label: "Print", backgroundColor: "#3b82f6", color: "white", icon: "Printer", triggers: [] }
                        },
                        {
                            id: `c3_back_${timestamp}`,
                            type: "BUTTON",
                            x: 20, y: 620, w: 160, h: 60,
                            props: { label: "Done", backgroundColor: "#f1f5f9", color: "#0f172a", action: "NEXT_STEP", targetStepId: `step_view_${timestamp}`, triggers: [] }
                        }
                    ]
                },

                // STEP 4: VIEW / MANAGE
                {
                    id: `step_manage_${timestamp}`,
                    title: "Defect Event Details",
                    stepType: "Step",
                    components: [
                        {
                            id: `c4_info_${timestamp}`,
                            type: "SHAPE",
                            x: 20, y: 80, w: 480, h: 520,
                            props: { type: "rectangle", backgroundColor: "white", borderRadius: 12, strokeWidth: 1, strokeColor: "#e2e8f0", triggers: [] }
                        },
                        {
                            id: `c4_title_${timestamp}`,
                            type: "TEXT",
                            x: 40, y: 100, w: 440, h: 30,
                            props: { text: "Event Details", fontSize: 20, fontWeight: "bold", triggers: [] }
                        },
                        {
                            id: `c4_photo_${timestamp}`,
                            type: "IMAGE",
                            x: 520, y: 80, w: 484, h: 520,
                            props: { label: "Defect Photo", triggers: [] }
                        },
                        {
                            id: `c4_next_${timestamp}`,
                            type: "BUTTON",
                            x: 844, y: 620, w: 160, h: 60,
                            props: { label: "Manage Defect", backgroundColor: "#3b82f6", color: "white", action: "NEXT_STEP", targetStepId: `step_disp_${timestamp}`, triggers: [] }
                        }
                    ]
                },

                // STEP 5: DISPOSITION
                {
                    id: `step_disp_${timestamp}`,
                    title: "Defect Disposition",
                    stepType: "Step",
                    components: [
                        {
                            id: `c5_title_${timestamp}`,
                            type: "TEXT",
                            x: 312, y: 100, w: 400, h: 40,
                            props: { text: "Choose Disposition", fontSize: 24, fontWeight: "bold", textAlign: "center", triggers: [] }
                        },
                        {
                            id: `c5_scrap_${timestamp}`,
                            type: "BUTTON",
                            x: 312, y: 180, w: 400, h: 80,
                            props: { label: "Mark as Scrap", backgroundColor: "#ef4444", color: "white", action: "NEXT_STEP", targetStepId: `step_view_${timestamp}`, triggers: [] }
                        },
                        {
                            id: `c5_rework_${timestamp}`,
                            type: "BUTTON",
                            x: 312, y: 280, w: 400, h: 80,
                            props: { label: "Send to Rework", backgroundColor: "#f59e0b", color: "white", action: "NEXT_STEP", targetStepId: `step_rework_det_${timestamp}`, triggers: [] }
                        },
                        {
                            id: `c5_asis_${timestamp}`,
                            type: "BUTTON",
                            x: 312, y: 380, w: 400, h: 80,
                            props: { label: "Use As-Is", backgroundColor: "#10b981", color: "white", action: "NEXT_STEP", targetStepId: `step_view_${timestamp}`, triggers: [] }
                        }
                    ]
                },

                // STEP 6: REWORK DETAILS
                {
                    id: `step_rework_det_${timestamp}`,
                    title: "Rework Details",
                    stepType: "Form Step",
                    components: [
                        {
                            id: `c6_station_${timestamp}`,
                            type: "DROPDOWN",
                            x: 312, y: 150, w: 400, h: 80,
                            props: { label: "Rework Station", options: ["Station A", "Station B", "Quality Lab"], triggers: [] }
                        },
                        {
                            id: `c6_sev_${timestamp}`,
                            type: "RADIO_GROUP",
                            x: 312, y: 250, w: 400, h: 120,
                            props: { label: "Severity", options: ["Low", "Medium", "High"], triggers: [] }
                        },
                        {
                            id: `c6_submit_${timestamp}`,
                            type: "BUTTON",
                            x: 312, y: 450, w: 400, h: 80,
                            props: { label: "Assign to Rework", backgroundColor: "#3b82f6", color: "white", action: "NEXT_STEP", targetStepId: `step_view_${timestamp}`, triggers: [] }
                        }
                    ]
                },

                // STEP 7: REWORK EVENT DETAILS
                {
                    id: `step_rework_exec_${timestamp}`,
                    title: "Rework Execution",
                    stepType: "Form Step",
                    components: [
                        {
                            id: `c7_notes_${timestamp}`,
                            type: "TEXT_INPUT",
                            x: 312, y: 150, w: 400, h: 200,
                            props: { label: "Rework Notes", multiline: true, triggers: [] }
                        },
                        {
                            id: `c7_fail_${timestamp}`,
                            type: "BUTTON",
                            x: 312, y: 380, w: 190, h: 80,
                            props: { label: "Rework Failed", backgroundColor: "#ef4444", color: "white", action: "NEXT_STEP", targetStepId: `step_view_${timestamp}`, triggers: [] }
                        },
                        {
                            id: `c7_comp_${timestamp}`,
                            type: "BUTTON",
                            x: 522, y: 380, w: 190, h: 80,
                            props: { label: "Rework Complete", backgroundColor: "#10b981", color: "white", action: "NEXT_STEP", targetStepId: `step_view_${timestamp}`, triggers: [] }
                        }
                    ]
                }
            ]
        }
    };
}
