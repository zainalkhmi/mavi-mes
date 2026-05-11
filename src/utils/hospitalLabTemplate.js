/**
 * Hospital Laboratory Process Template
 */
export const createHospitalLabTemplate = () => {
    const timestamp = Date.now();
    return {
        id: `app_template_lab_${timestamp}`,
        name: "Hospital Lab Process",
        category: "Healthcare",
        description: "Enterprise clinical laboratory workflow: patient registration, specimen QC, hematology, chemistry panel, and pathologist-authorised HL7 reporting.",
        type: "FRONT-LINE",
        published: true,
        approvalStatus: "APPROVED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config: {
            appVariables: [
                { id: `v_patient_name_${timestamp}`, name: "Patient_Name", type: "text", defaultValue: "", persisted: true },
                { id: `v_mrn_${timestamp}`, name: "MRN", type: "text", defaultValue: "", persisted: true },
                { id: `v_sample_id_${timestamp}`, name: "Sample_ID", type: "text", defaultValue: "", persisted: true },
                { id: `v_is_critical_${timestamp}`, name: "Is_Critical", type: "boolean", defaultValue: false, persisted: false }
            ],
            appFunctions: [
                {
                    id: `f_validate_hgb_${timestamp}`,
                    name: "Validate_Hemoglobin",
                    description: "Checks if HGB is within normal range (12.0 - 16.0)",
                    inputs: [{ name: "hgb_value", type: "NUMBER" }],
                    steps: [
                        { type: "SET", variableName: "Is_Critical", expression: "($hgb_value < 7.0) || ($hgb_value > 20.0)" },
                        { type: "RETURN", expression: "$Is_Critical" }
                    ]
                }
            ],
            appTriggers: [
                {
                    id: `t_start_${timestamp}`,
                    name: "Initialize Lab Session",
                    event: "ON_APP_START",
                    actions: [{ type: "SHOW_MESSAGE", payload: { message: "Clinical Lab Module Ready", msgType: "success" } }]
                }
            ],
            recordPlaceholders: [
                {
                    id: `rp_lab_${timestamp}`,
                    name: "Active_Sample",
                    tableId: "PLACEHOLDER_TABLE_LAB_SAMPLES",
                    description: "Handle for the current clinical sample"
                }
            ],
            appTables: ["PLACEHOLDER_TABLE_TEST_MASTER", "PLACEHOLDER_TABLE_LAB_SAMPLES", "PLACEHOLDER_TABLE_LAB_RESULTS"],
            steps: [
                {
                    id: "step_registration",
                    title: "Patient & Sample Registration",
                    components: [
                        { id: "hdr_reg", type: "TEXT", x: 50, y: 50, w: 900, h: 100, props: { text: "🏥  Patient & Sample Registration", fontSize: 22, fontWeight: 900, color: "#0284c7" } },
                        { id: "scan_mrn", type: "BARCODE_SCANNER", x: 50, y: 290, w: 900, h: 100, props: { label: "Scan Patient Wristband / MRN", placeholder: "MRN-XXXXXXX" } },
                        { id: "input_patient_name", type: "TEXT_INPUT", x: 50, y: 410, w: 900, h: 100, props: { label: "Patient Full Name" } },
                        { id: "scan_sample", type: "BARCODE_SCANNER", x: 50, y: 770, w: 900, h: 100, props: { label: "Scan Sample Tube Barcode" } },
                        { id: "select_panel", type: "CHECKLIST", x: 50, y: 890, w: 900, h: 100, props: { label: "Requested Test Panels", items: ["FBC", "Metabolic Panel", "Lipid Profile", "Thyroid", "LFT", "RFT"] } },
                        { id: "btn_register", type: "BUTTON", x: 50, y: 1250, w: 900, h: 100, props: { label: "✓ Register & Proceed", backgroundColor: "#0284c7", color: "#fff", action: "NEXT_STEP" } }
                    ]
                },
                {
                    id: "step_preanalytical",
                    title: "Pre-Analytical Quality Check",
                    components: [
                        { id: "hdr_pre", type: "TEXT", x: 50, y: 50, w: 900, h: 100, props: { text: "🔬 Specimen Integrity", fontSize: 22, fontWeight: 900, color: "#7c3aed" } },
                        { id: "checklist_specimen", type: "CHECKLIST", x: 50, y: 290, w: 900, h: 100, props: { label: "Criteria", items: ["Correct tube", "Label matches", "Volume OK", "No hemolysis"], required: true } },
                        { id: "btn_accept", type: "BUTTON", x: 50, y: 770, w: 900, h: 100, props: { label: "✓ Accept Specimen", backgroundColor: "#059669", color: "#fff", action: "NEXT_STEP" } }
                    ]
                },
                {
                    id: "step_hematology",
                    title: "Hematology — Full Blood Count",
                    components: [
                        { id: "hdr_hema", type: "TEXT", x: 50, y: 50, w: 900, h: 100, props: { text: "🩸 Full Blood Count (FBC)", fontSize: 22, fontWeight: 900, color: "#dc2626" } },
                        { id: "val_hgb", type: "NUMBER_INPUT", x: 50, y: 290, w: 900, h: 100, props: { label: "Hemoglobin (g/dL)" } },
                        { id: "hema_pass_fail", type: "QUALITY_PASS_FAIL", x: 50, y: 890, w: 900, h: 100, props: { label: "Assessment" } },
                        { id: "btn_hema_next", type: "BUTTON", x: 50, y: 1010, w: 900, h: 100, props: { label: "✓ Save & Continue", backgroundColor: "#dc2626", color: "#fff", action: "NEXT_STEP" } }
                    ]
                },
                {
                    id: "step_validation",
                    title: "Pathologist Validation",
                    components: [
                        { id: "hdr_val", type: "TEXT", x: 50, y: 50, w: 900, h: 100, props: { text: "✅ Result Review", fontSize: 22, fontWeight: 900, color: "#0f172a" } },
                        { id: "signature_pathologist", type: "SIGNATURE", x: 50, y: 530, w: 900, h: 100, props: { label: "Digital Signature", required: true } },
                        { id: "btn_release", type: "BUTTON", x: 50, y: 650, w: 900, h: 100, props: { label: "🔒 Authorise & Release", backgroundColor: "#0f172a", color: "#fff", action: "COMPLETE" } }
                    ]
                }
            ]
        }
    };
};
