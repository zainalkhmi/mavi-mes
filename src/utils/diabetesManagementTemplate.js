/**
 * Diabetes Care & Management Template
 * Uses ONLY widget types supported by LiveTerminal renderer.
 */
export const createDiabetesManagementTemplate = () => {
    const timestamp = Date.now();
    return {
        id: `app_template_diabetes_${timestamp}`,
        name: "Diabetes Care & Management",
        category: "Healthcare",
        description: "Advanced clinical management for chronic diabetes: metabolic profiling, insulin adjustment, and multi-disciplinary care plan orchestration.",
        type: "FRONT-LINE",
        published: true,
        approvalStatus: "APPROVED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config: {
            appVariables: [
                { id: `v_patient_name_${timestamp}`, name: "Patient_Name", type: "text", defaultValue: "", persisted: true },
                { id: `v_patient_id_${timestamp}`, name: "Patient_ID", type: "text", defaultValue: "", persisted: true },
                { id: `v_diabetes_type_${timestamp}`, name: "Diabetes_Type", type: "text", defaultValue: "Type 2", persisted: true },
                { id: `v_hba1c_${timestamp}`, name: "HbA1c", type: "number", defaultValue: 0, persisted: true },
                { id: `v_bmi_${timestamp}`, name: "BMI", type: "number", defaultValue: 0, persisted: false },
                { id: `v_insulin_dose_${timestamp}`, name: "Insulin_Dose", type: "number", defaultValue: 0, persisted: false }
            ],
            appFunctions: [
                {
                    id: `f_calc_bmi_${timestamp}`,
                    name: "Calculate_BMI",
                    description: "Calculates Body Mass Index",
                    inputs: [
                        { name: "weight_kg", type: "NUMBER" },
                        { name: "height_cm", type: "NUMBER" }
                    ],
                    steps: [
                        { type: "SET", variableName: "Height_M", expression: "$height_cm / 100" },
                        { type: "SET", variableName: "BMI", expression: "$weight_kg / ($Height_M * $Height_M)" },
                        { type: "RETURN", expression: "ROUND($BMI, 1)" }
                    ]
                },
                {
                    id: `f_suggest_insulin_${timestamp}`,
                    name: "Suggest_Insulin_Adjustment",
                    description: "Calculates adjustment based on current A1c",
                    inputs: [{ name: "a1c", type: "NUMBER" }],
                    steps: [
                        { type: "SET", variableName: "Adjustment", expression: "IF($a1c > 9.0, 4, IF($a1c > 7.0, 2, 0))" },
                        { type: "RETURN", expression: "$Adjustment" }
                    ]
                }
            ],
            appTriggers: [
                {
                    id: `t_check_critical_${timestamp}`,
                    name: "Check Critical Glucose",
                    event: "VARIABLE_CHANGED",
                    variableName: "HbA1c",
                    actions: [
                        { type: "CONDITION", payload: { expression: "$HbA1c > 10.0" }, actions: [
                            { type: "SHOW_MESSAGE", payload: { message: "CRITICAL: Patient requires immediate endocrinology referral!", msgType: "error" } }
                        ]}
                    ]
                }
            ],
            recordPlaceholders: [
                {
                    id: `rp_diabetes_${timestamp}`,
                    name: "Active_Care_Plan",
                    tableId: "PLACEHOLDER_TABLE_CARE_PLANS",
                    description: "Handles the longitudinal care plan for the patient"
                }
            ],
            appTables: ["PLACEHOLDER_TABLE_DIABETES_PATIENT", "PLACEHOLDER_TABLE_GLUCOSE_LOGS", "PLACEHOLDER_TABLE_CARE_PLANS", "PLACEHOLDER_TABLE_VITALS_HISTORY"],
            steps: [
                {
                    id: "step_vitals",
                    title: "Patient Triage & Vitals",
                    components: [
                        { id: "hdr_vitals", type: "TEXT", x: 50, y: 50, w: 900, h: 100, props: { text: "💉 Patient Triage — Physical Assessment", fontSize: 22, fontWeight: 900, color: "#1e3a8a" } },
                        { id: "scan_patient", type: "BARCODE_SCANNER", x: 50, y: 290, w: 900, h: 100, props: { label: "Scan Patient ID / Wristband", placeholder: "PT-XXXXXXX" } },
                        { id: "input_patient_name", type: "TEXT_INPUT", x: 50, y: 410, w: 900, h: 100, props: { label: "Patient Full Name" } },
                        { id: "input_dob", type: "DATE_PICKER", x: 50, y: 530, w: 900, h: 100, props: { label: "Date of Birth" } },
                        { id: "select_diabetes_type", type: "RADIO_GROUP", x: 50, y: 650, w: 900, h: 100, props: { label: "Diabetes Classification", options: ["Type 1", "Type 2", "Gestational", "Pre-Diabetes"], defaultValue: "Type 2" } },
                        { id: "input_weight", type: "NUMBER_INPUT", x: 50, y: 770, w: 900, h: 100, props: { label: "Weight (kg)" } },
                        { id: "input_height", type: "NUMBER_INPUT", x: 50, y: 890, w: 900, h: 100, props: { label: "Height (cm)" } },
                        { id: "bmi_gauge", type: "GAUGE", x: 50, y: 1010, w: 900, h: 100, props: { label: "BMI Indicator", min: 15, max: 45, value: 27, unit: "kg/m²" } },
                        { id: "btn_vitals_next", type: "BUTTON", x: 50, y: 1130, w: 900, h: 100, props: { label: "✓ Save Vitals & Proceed", backgroundColor: "#1e3a8a", color: "#fff", action: "NEXT_STEP" } }
                    ]
                },
                {
                    id: "step_glucose",
                    title: "Metabolic Profiling",
                    components: [
                        { id: "hdr_glucose", type: "TEXT", x: 50, y: 50, w: 900, h: 100, props: { text: "📊 Blood Glucose & A1C Metabolic Data", fontSize: 22, fontWeight: 900, color: "#7c3aed" } },
                        { id: "input_fasting", type: "NUMBER_INPUT", x: 50, y: 290, w: 900, h: 100, props: { label: "Fasting Glucose (mg/dL)" } },
                        { id: "input_postprandial", type: "NUMBER_INPUT", x: 50, y: 410, w: 900, h: 100, props: { label: "Post-prandial Glucose 2hr (mg/dL)" } },
                        { id: "input_a1c", type: "NUMBER_INPUT", x: 50, y: 530, w: 900, h: 100, props: { label: "HbA1c (%)" } },
                        { id: "glucose_gauge", type: "GAUGE", x: 50, y: 650, w: 900, h: 100, props: { label: "HbA1c Control Level", min: 4, max: 14, value: 7, unit: "%" } },
                        { id: "glucose_assessment", type: "QUALITY_PASS_FAIL", x: 50, y: 770, w: 900, h: 100, props: { label: "Glycemic Control Assessment" } },
                        { id: "btn_glucose_next", type: "BUTTON", x: 50, y: 890, w: 900, h: 100, props: { label: "✓ Save Metabolic Data & Continue", backgroundColor: "#7c3aed", color: "#fff", action: "NEXT_STEP" } }
                    ]
                },
                {
                    id: "step_medication",
                    title: "Medication & Insulin Review",
                    components: [
                        { id: "hdr_meds", type: "TEXT", x: 50, y: 50, w: 900, h: 100, props: { text: "💊 Prescription & Insulin Therapy Review", fontSize: 22, fontWeight: 900, color: "#0891b2" } },
                        { id: "select_insulin_type", type: "DROPDOWN", x: 50, y: 290, w: 900, h: 100, props: { label: "Insulin Regimen", options: ["None", "Rapid-acting", "Long-acting", "Basal-Bolus", "Pump"] } },
                        { id: "input_basal_dose", type: "NUMBER_INPUT", x: 50, y: 410, w: 900, h: 100, props: { label: "Basal Insulin Dose (Units/day)" } },
                        { id: "input_bolus_dose", type: "NUMBER_INPUT", x: 50, y: 530, w: 900, h: 100, props: { label: "Bolus Insulin per meal (Units)" } },
                        { id: "select_adjustment_action", type: "RADIO_GROUP", x: 50, y: 650, w: 900, h: 100, props: { label: "Adjustment Action", options: ["No Change", "+2 Units", "+4 Units", "-2 Units", "Switch Regimen"] } },
                        { id: "btn_meds_next", type: "BUTTON", x: 50, y: 770, w: 900, h: 100, props: { label: "✓ Confirm Medication & Continue", backgroundColor: "#0891b2", color: "#fff", action: "NEXT_STEP" } }
                    ]
                },
                {
                    id: "step_complications",
                    title: "Complications Screening",
                    components: [
                        { id: "hdr_comp", type: "TEXT", x: 50, y: 50, w: 900, h: 100, props: { text: "🔎 Annual Complications Screening", fontSize: 22, fontWeight: 900, color: "#b45309" } },
                        { id: "checklist_complications", type: "CHECKLIST", x: 50, y: 290, w: 900, h: 100, props: { label: "Screening Items", items: ["Retinopathy", "Nephropathy", "Neuropathy", "Foot Exam", "Cardiovascular", "Mental Health"] } },
                        { id: "input_egfr", type: "NUMBER_INPUT", x: 50, y: 410, w: 900, h: 100, props: { label: "eGFR (mL/min/1.73m²)" } },
                        { id: "comp_assessment", type: "QUALITY_PASS_FAIL", x: 50, y: 530, w: 900, h: 100, props: { label: "Overall Screening Result" } },
                        { id: "btn_comp_next", type: "BUTTON", x: 50, y: 650, w: 900, h: 100, props: { label: "✓ Save Screening & Continue", backgroundColor: "#b45309", color: "#fff", action: "NEXT_STEP" } }
                    ]
                },
                {
                    id: "step_careplan",
                    title: "Care Plan & Physician Sign-off",
                    components: [
                        { id: "hdr_care", type: "TEXT", x: 50, y: 50, w: 900, h: 100, props: { text: "📋 3-Month Care Plan — Goals", fontSize: 22, fontWeight: 900, color: "#0f172a" } },
                        { id: "display_patient_ref", type: "VARIABLE_TEXT", x: 50, y: 170, w: 900, h: 100, props: { label: "Patient", template: "Patient: {{Patient_Name}} | Type: {{Diabetes_Type}}" } },
                        { id: "input_a1c_target", type: "NUMBER_INPUT", x: 50, y: 290, w: 900, h: 100, props: { label: "3-Month HbA1c Target (%)" } },
                        { id: "input_nutrition_plan", type: "TEXT_AREA", x: 50, y: 410, w: 900, h: 100, props: { label: "Nutrition & Diet Plan" } },
                        { id: "signature_doctor", type: "SIGNATURE", x: 50, y: 530, w: 900, h: 100, props: { label: "Physician Digital Signature", required: true } },
                        { id: "btn_activate", type: "BUTTON", x: 50, y: 650, w: 900, h: 100, props: { label: "✅ Activate Care Plan & Sync", backgroundColor: "#0f172a", color: "#fff", action: "COMPLETE" } }
                    ]
                }
            ]
        }
    };
};
