/**
 * inventoryTemplate.js
 * Generates a complete 5-step material requisition/picking application JSON structure
 * Uses ONLY LiveTerminal-supported widgets and includes explicit x, y, w, h coordinates for AppBuilder design mode.
 */

export function createMaterialRequisitionTemplate() {
    const timestamp = Date.now();
    const currentIso = new Date().toISOString();

    return {
        id: `app_template_inv_${timestamp}`,
        name: "Material Requisition",
        description: "Warehouse picking flow with shortage alerts, barcode scanning, and real-time inventory level sync.",
        category: "Logistics",
        type: "FRONT-LINE",
        published: true,
        approvalStatus: "APPROVED",
        createdAt: currentIso,
        updatedAt: currentIso,
        
        config: {
            appVariables: [
                { id: `var_part_id_${timestamp}`, name: "Part_ID", type: "string", defaultValue: "", persisted: true },
                { id: `var_req_qty_${timestamp}`, name: "Qty_Requested", type: "number", defaultValue: 0, persisted: true },
                { id: `var_pick_qty_${timestamp}`, name: "Qty_Picked", type: "number", defaultValue: 0, persisted: true },
                { id: `var_bin_loc_${timestamp}`, name: "Bin_Location", type: "string", defaultValue: "A-12-04", persisted: false },
                { id: `var_stock_level_${timestamp}`, name: "Current_Stock", type: "number", defaultValue: 500, persisted: false }
            ],
            recordPlaceholders: [
                {
                    id: `rp_inv_${timestamp}`,
                    name: "Active_Requisition",
                    tableId: "PLACEHOLDER_TABLE_REQUISITIONS",
                    description: "Handle for the current picking request"
                }
            ],
            appTables: ["PLACEHOLDER_TABLE_PARTS", "PLACEHOLDER_TABLE_REQUISITIONS", "PLACEHOLDER_TABLE_STORAGE"],
            appFunctions: [
                {
                    id: `func_calc_restock_${timestamp}`,
                    name: "Calculate_Restock_Need",
                    description: "Calculates how much stock to order to reach the minimum threshold",
                    inputs: [
                        { name: "current_qty", type: "NUMBER" },
                        { name: "min_stock", type: "NUMBER" }
                    ],
                    steps: [
                        { type: "SET", variableName: "RestockAmount", expression: "MAX(0, $min_stock - $current_qty)" },
                        { type: "RETURN", expression: "$RestockAmount" }
                    ]
                }
            ],
            appAutomations: [
                {
                    id: `auto_low_stock_${timestamp}`,
                    name: "Trigger Restock Requisition",
                    triggerEvent: "STOCK_LOW",
                    description: "Automatically generates a red alert banner when inventory hits minimum thresholds.",
                    actions: [
                        { type: "CREATE_RECORD", targetTable: "Inventory_Requisitions", payload: { "Status": "URGENT_RESTOCK" } }
                    ]
                }
            ],
            appTriggers: [
                {
                    id: `trig_start_${timestamp}`,
                    name: "Check Shortages",
                    event: "ON_APP_START",
                    actions: [
                        { type: "SHOW_MESSAGE", payload: { message: "Syncing real-time inventory levels...", msgType: "info" } }
                    ]
                }
            ],
            steps: [
                // ─── STEP 1: View Shortage Alerts ─────────────────────────────
                {
                    id: `step_alerts_${timestamp}`,
                    title: "1. View Shortage Alerts",
                    stepType: "Step",
                    components: [
                        {
                            id: `c1_head_${timestamp}`, type: "TEXT",
                            x: 50, y: 50, w: 900, h: 80,
                            props: { text: "⚠️ Active Inventory Alerts", fontSize: 28, fontWeight: "900", color: "#ef4444" }
                        },
                        {
                            id: `c1_banner_${timestamp}`, type: "TEXT",
                            x: 50, y: 150, w: 900, h: 100,
                            props: { 
                                text: "STOCK_LOW ALERT: Part 'AL-6061' has dropped below the minimum threshold of 50 units.", 
                                fontSize: 18, 
                                fontWeight: "bold",
                                color: "#7f1d1d",
                                backgroundColor: "#fef2f2",
                                textAlign: "center"
                            }
                        },
                        {
                            id: `c1_list_${timestamp}`, type: "CHECKLIST",
                            x: 50, y: 270, w: 900, h: 200,
                            props: {
                                label: "Required Restocking Actions",
                                items: [
                                    "Acknowledge shortage alert for AL-6061",
                                    "Verify physical stock level matches system",
                                    "Generate replenishment requisition"
                                ],
                                required: true
                            }
                        },
                        {
                            id: `c1_btn_${timestamp}`, type: "BUTTON",
                            x: 50, y: 490, w: 900, h: 80,
                            props: {
                                label: "Acknowledge & Proceed to Request",
                                backgroundColor: "#ef4444",
                                color: "white",
                                fontSize: 18,
                                fontWeight: "bold",
                                action: "NEXT_STEP"
                            }
                        }
                    ]
                },

                // ─── STEP 2: Request Material via Scan ────────────────────────
                {
                    id: `step_request_${timestamp}`,
                    title: "2. Request Material",
                    stepType: "Step",
                    components: [
                        {
                            id: `c2_head_${timestamp}`, type: "TEXT",
                            x: 50, y: 50, w: 900, h: 80,
                            props: { text: "📦 Create Requisition", fontSize: 28, fontWeight: "900", color: "#0ea5e9" }
                        },
                        {
                            id: `c2_scan_${timestamp}`, type: "BARCODE_SCANNER",
                            x: 50, y: 150, w: 900, h: 100,
                            props: {
                                label: "Scan Part ID / Bin Barcode",
                                placeholder: "e.g. PART-XXXX",
                                targetVariable: "Part_ID",
                                autoFocus: true
                            }
                        },
                        {
                            id: `c2_qty_${timestamp}`, type: "NUMBER_INPUT",
                            x: 50, y: 270, w: 900, h: 100,
                            props: {
                                label: "Quantity Needed at Station",
                                placeholder: "Enter quantity...",
                                targetVariable: "Qty_Requested"
                            }
                        },
                        {
                            id: `c2_priority_${timestamp}`, type: "RADIO_GROUP",
                            x: 50, y: 390, w: 900, h: 120,
                            props: {
                                label: "Delivery Priority",
                                options: ["Standard (2 hours)", "Urgent (30 mins)", "Line-Down (Immediate)"],
                                defaultValue: "Standard (2 hours)",
                                layout: "horizontal"
                            }
                        },
                        {
                            id: `c2_btn_${timestamp}`, type: "BUTTON",
                            x: 50, y: 530, w: 900, h: 80,
                            props: {
                                label: "Submit Request to Warehouse",
                                backgroundColor: "#0ea5e9",
                                color: "white",
                                fontSize: 18,
                                fontWeight: "bold",
                                action: "NEXT_STEP"
                            }
                        }
                    ]
                },

                // ─── STEP 3: Warehouse Picking Flow ───────────────────────────
                {
                    id: `step_picking_${timestamp}`,
                    title: "3. Warehouse Picking Flow",
                    stepType: "Step",
                    components: [
                        {
                            id: `c3_head_${timestamp}`, type: "TEXT",
                            x: 50, y: 50, w: 900, h: 80,
                            props: { text: "🛒 Picking Dashboard", fontSize: 28, fontWeight: "900", color: "#8b5cf6" }
                        },
                        {
                            id: `c3_info_${timestamp}`, type: "VARIABLE_TEXT",
                            x: 50, y: 150, w: 900, h: 100,
                            props: {
                                label: "Active Picking List",
                                template: "Part Needed: {{Part_ID}} \nTarget Location: {{Bin_Location}}",
                                fontSize: 18
                            }
                        },
                        {
                            id: `c3_scan_confirm_${timestamp}`, type: "BARCODE_SCANNER",
                            x: 50, y: 270, w: 900, h: 100,
                            props: {
                                label: "SCAN-TO-CONFIRM: Scan item picked from shelf",
                                placeholder: "Verify part matches request..."
                            }
                        },
                        {
                            id: `c3_qty_picked_${timestamp}`, type: "NUMBER_INPUT",
                            x: 50, y: 390, w: 900, h: 100,
                            props: {
                                label: "Actual Quantity Picked",
                                placeholder: "Enter confirmed count...",
                                targetVariable: "Qty_Picked"
                            }
                        },
                        {
                            id: `c3_btn_${timestamp}`, type: "BUTTON",
                            x: 50, y: 510, w: 900, h: 80,
                            props: {
                                label: "Confirm Pick & Dispatch",
                                backgroundColor: "#8b5cf6",
                                color: "white",
                                fontSize: 18,
                                fontWeight: "bold",
                                action: "NEXT_STEP"
                            }
                        }
                    ]
                },

                // ─── STEP 4: Confirm Delivery to Station ──────────────────────
                {
                    id: `step_delivery_${timestamp}`,
                    title: "4. Confirm Delivery",
                    stepType: "Step",
                    components: [
                        {
                            id: `c4_head_${timestamp}`, type: "TEXT",
                            x: 50, y: 50, w: 900, h: 80,
                            props: { text: "📍 Station Delivery Confirmation", fontSize: 28, fontWeight: "900", color: "#10b981" }
                        },
                        {
                            id: `c4_condition_${timestamp}`, type: "QUALITY_PASS_FAIL",
                            x: 50, y: 150, w: 900, h: 120,
                            props: {
                                label: "Material Condition Verification",
                                passLabel: "Undamaged / Correct",
                                failLabel: "Damaged / Incorrect Part"
                            }
                        },
                        {
                            id: `c4_notes_${timestamp}`, type: "TEXT_AREA",
                            x: 50, y: 290, w: 900, h: 120,
                            props: {
                                label: "Delivery Exception Notes (Optional)",
                                placeholder: "If partial delivery or damaged, please specify..."
                            }
                        },
                        {
                            id: `c4_sig_${timestamp}`, type: "SIGNATURE",
                            x: 50, y: 430, w: 900, h: 150,
                            props: {
                                label: "Receiver Signature",
                                required: true
                            }
                        },
                        {
                            id: `c4_btn_${timestamp}`, type: "BUTTON",
                            x: 50, y: 600, w: 900, h: 80,
                            props: {
                                label: "Sign for Delivery",
                                backgroundColor: "#10b981",
                                color: "white",
                                fontSize: 18,
                                fontWeight: "bold",
                                action: "NEXT_STEP"
                            }
                        }
                    ]
                },

                // ─── STEP 5: Update Inventory Levels ──────────────────────────
                {
                    id: `step_sync_${timestamp}`,
                    title: "5. Inventory Sync",
                    stepType: "Step",
                    components: [
                        {
                            id: `c5_head_${timestamp}`, type: "TEXT",
                            x: 50, y: 50, w: 900, h: 80,
                            props: { text: "🔄 Live Stock Synchronization", fontSize: 28, fontWeight: "900", color: "#0f172a" }
                        },
                        {
                            id: `c5_gauge_${timestamp}`, type: "GAUGE",
                            x: 50, y: 150, w: 900, h: 250,
                            props: {
                                label: "Remaining Stock Level (Post-Pick)",
                                min: 0,
                                max: 1000,
                                value: 350,
                                unit: " units",
                                thresholds: [
                                    { value: 100, color: "#ef4444" },
                                    { value: 300, color: "#f59e0b" },
                                    { value: 1000, color: "#10b981" }
                                ]
                            }
                        },
                        {
                            id: `c5_summary_${timestamp}`, type: "TEXT",
                            x: 50, y: 420, w: 900, h: 80,
                            props: {
                                text: "The requisition loop is complete. Storage_Locations and Inventory_Requisitions tables will be updated automatically.",
                                fontSize: 16,
                                color: "#64748b",
                                textAlign: "center"
                            }
                        },
                        {
                            id: `c5_done_${timestamp}`, type: "BUTTON",
                            x: 50, y: 520, w: 900, h: 80,
                            props: {
                                label: "UPDATE INVENTORY & COMPLETE",
                                backgroundColor: "#0f172a",
                                color: "white",
                                action: "COMPLETE"
                            }
                        }
                    ]
                }
            ]
        }
    };
}
