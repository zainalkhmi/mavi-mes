// QC Check Sheet App Template
// Integrated with Drawing, Inspector Designer, and Report Designer
export function createQCCheckSheetTemplate() {
    const ts = Date.now();

    const T = {
        qaRecords: 'tbl_qa_drawing_checksheets',
        qaItems: 'tbl_qa_drawing_check_items'
    };

    const V = [
        { id: 'v_wo_' + ts, name: 'Work_Order_No', type: 'string', defaultValue: '', persisted: true },
        { id: 'v_part_' + ts, name: 'Part_Number', type: 'string', defaultValue: '', persisted: true },
        { id: 'v_serial_' + ts, name: 'Serial_Number', type: 'string', defaultValue: '', persisted: true },
        { id: 'v_rev_' + ts, name: 'Drawing_Revision', type: 'string', defaultValue: 'Rev A', persisted: true },
        { id: 'v_dwg_id_' + ts, name: 'Selected_Drawing_ID', type: 'string', defaultValue: 'dwg_cast_housing_01', persisted: true },
        { id: 'v_dwg_name_' + ts, name: 'Drawing_Name', type: 'string', defaultValue: 'Casting Housing Assembly', persisted: true },
        { id: 'v_inspector_' + ts, name: 'Inspector_Name', type: 'string', defaultValue: '@APP_INFO.USER', persisted: false },
        { id: 'v_pic_' + ts, name: 'PIC_Name', type: 'string', defaultValue: '', persisted: true },
        { id: 'v_date_' + ts, name: 'Inspection_Date', type: 'string', defaultValue: '@DATETIME.NOW', persisted: false },
        { id: 'v_status_' + ts, name: 'Overall_Inspection_Status', type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: 'v_total_' + ts, name: 'Total_Check_Points', type: 'number', defaultValue: 5, persisted: false },
        { id: 'v_passed_' + ts, name: 'Passed_Check_Points', type: 'number', defaultValue: 0, persisted: false },
        { id: 'v_failed_' + ts, name: 'Failed_Check_Points', type: 'number', defaultValue: 0, persisted: false },
        { id: 'v_notes_' + ts, name: 'Inspection_Notes', type: 'string', defaultValue: '', persisted: false },
        { id: 'v_cp1_' + ts, name: 'CP1_Result', type: 'string', defaultValue: '', persisted: true },
        { id: 'v_cp1_st_' + ts, name: 'CP1_Status', type: 'string', defaultValue: 'PENDING', persisted: true },
        { id: 'v_cp2_' + ts, name: 'CP2_Result', type: 'string', defaultValue: '', persisted: true },
        { id: 'v_cp2_st_' + ts, name: 'CP2_Status', type: 'string', defaultValue: 'PENDING', persisted: true },
        { id: 'v_cp3_' + ts, name: 'CP3_Result', type: 'string', defaultValue: '', persisted: true },
        { id: 'v_cp3_st_' + ts, name: 'CP3_Status', type: 'string', defaultValue: 'PENDING', persisted: true },
        { id: 'v_cp4_' + ts, name: 'CP4_Result', type: 'string', defaultValue: '', persisted: true },
        { id: 'v_cp4_st_' + ts, name: 'CP4_Status', type: 'string', defaultValue: 'PENDING', persisted: true },
        { id: 'v_cp5_' + ts, name: 'CP5_Result', type: 'string', defaultValue: '', persisted: true },
        { id: 'v_cp5_st_' + ts, name: 'CP5_Status', type: 'string', defaultValue: 'PENDING', persisted: true }
    ];

    const R = [
        { id: 'r_qa_' + ts, name: 'QA_Record', tableId: T.qaRecords, type: 'single' }
    ];

    // STEP 1: PRODUCT IDENTIFICATION
    const step1 = {
        id: 's1_product_' + ts,
        title: '1. Product ID',
        stepType: 'Step',
        components: [
            { id: 's1_h_bg_' + ts, type: 'SHAPE', x: 0, y: 0, w: 1000, h: 80, props: { shapeType: 'rect', fill: '#714B67' } },
            { id: 's1_title_' + ts, type: 'TEXT', x: 20, y: 10, w: 600, h: 35, props: { text: 'QC INSPECTION CHECK SHEET', fontSize: 22, fontWeight: 'bold', color: '#ffffff' } },
            { id: 's1_sub_' + ts, type: 'TEXT', x: 20, y: 45, w: 400, h: 20, props: { text: 'MANDOR MES - Quality Assurance System', fontSize: 11, color: '#e2cfe0' } },
            { id: 's1_sec1_' + ts, type: 'TEXT', x: 30, y: 100, w: 400, h: 30, props: { text: 'PRODUCT IDENTIFICATION', fontSize: 14, fontWeight: 'bold', color: '#714B67' } },
            { id: 's1_lbl_wo_' + ts, type: 'TEXT', x: 30, y: 140, w: 150, h: 25, props: { text: 'Work Order No', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's1_inp_wo_' + ts, type: 'TEXT_INPUT', x: 30, y: 165, w: 280, h: 45, props: { label: '', placeholder: 'Enter WO Number...', targetVariable: 'Work_Order_No', required: true } },
            { id: 's1_lbl_part_' + ts, type: 'TEXT', x: 340, y: 140, w: 150, h: 25, props: { text: 'Part Number', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's1_inp_part_' + ts, type: 'TEXT_INPUT', x: 340, y: 165, w: 280, h: 45, props: { label: '', placeholder: 'Enter Part Number...', targetVariable: 'Part_Number', required: true } },
            { id: 's1_lbl_serial_' + ts, type: 'TEXT', x: 650, y: 140, w: 150, h: 25, props: { text: 'Serial / Lot', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's1_inp_serial_' + ts, type: 'TEXT_INPUT', x: 650, y: 165, w: 280, h: 45, props: { label: '', placeholder: 'Scan or enter...', targetVariable: 'Serial_Number' } },
            { id: 's1_sec2_' + ts, type: 'TEXT', x: 30, y: 240, w: 400, h: 30, props: { text: 'DRAWING REFERENCE', fontSize: 14, fontWeight: 'bold', color: '#714B67' } },
            { id: 's1_lbl_dwg_' + ts, type: 'TEXT', x: 30, y: 280, w: 150, h: 25, props: { text: 'Drawing ID', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's1_inp_dwg_' + ts, type: 'TEXT_INPUT', x: 30, y: 305, w: 280, h: 45, props: { label: '', placeholder: 'dwg_xxx_01', targetVariable: 'Selected_Drawing_ID' } },
            { id: 's1_lbl_name_' + ts, type: 'TEXT', x: 340, y: 280, w: 200, h: 25, props: { text: 'Drawing Name', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's1_inp_name_' + ts, type: 'TEXT_INPUT', x: 340, y: 305, w: 280, h: 45, props: { label: '', placeholder: 'Assembly Name...', targetVariable: 'Drawing_Name' } },
            { id: 's1_lbl_rev_' + ts, type: 'TEXT', x: 650, y: 280, w: 150, h: 25, props: { text: 'Revision', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's1_inp_rev_' + ts, type: 'TEXT_INPUT', x: 650, y: 305, w: 280, h: 45, props: { label: '', placeholder: 'Rev A', targetVariable: 'Drawing_Revision' } },
            { id: 's1_sec3_' + ts, type: 'TEXT', x: 30, y: 380, w: 400, h: 30, props: { text: 'QC INSPECTOR', fontSize: 14, fontWeight: 'bold', color: '#714B67' } },
            { id: 's1_lbl_insp_' + ts, type: 'TEXT', x: 30, y: 420, w: 200, h: 25, props: { text: 'Inspector Name', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's1_inp_insp_' + ts, type: 'TEXT_INPUT', x: 30, y: 445, w: 280, h: 45, props: { label: '', placeholder: 'Your name...', targetVariable: 'Inspector_Name', required: true } },
            { id: 's1_lbl_pic_' + ts, type: 'TEXT', x: 340, y: 420, w: 200, h: 25, props: { text: 'PIC Name', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's1_inp_pic_' + ts, type: 'TEXT_INPUT', x: 340, y: 445, w: 280, h: 45, props: { label: '', placeholder: 'PIC name...', targetVariable: 'PIC_Name' } },
            { id: 's1_lbl_date_' + ts, type: 'TEXT', x: 650, y: 420, w: 150, h: 25, props: { text: 'Inspection Date', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's1_inp_date_' + ts, type: 'DATE_PICKER', x: 650, y: 445, w: 280, h: 45, props: { label: '', targetVariable: 'Inspection_Date' } },
            { id: 's1_btn_next_' + ts, type: 'BUTTON', x: 750, y: 520, w: 200, h: 55, props: { text: 'Next: View Drawing', backgroundColor: '#714B67', color: '#ffffff', fontSize: 14, fontWeight: 'bold' } }
        ]
    };

    // STEP 2: DRAWING VIEW
    const step2 = {
        id: 's2_drawing_' + ts,
        title: '2. Drawing View',
        stepType: 'Step',
        components: [
            { id: 's2_header_' + ts, type: 'SHAPE', x: 0, y: 0, w: 1000, h: 60, props: { shapeType: 'rect', fill: '#0f172a' } },
            { id: 's2_title_' + ts, type: 'TEXT', x: 20, y: 18, w: 400, h: 28, props: { text: 'DRAWING VIEW - {{@Drawing_Name}}', fontSize: 16, fontWeight: 'bold', color: '#22c55e' } },
            { id: 's2_cad_' + ts, type: 'CAD_VIEWER', x: 10, y: 70, w: 980, h: 480, props: { title: '{{@Drawing_Name}} ({{@Drawing_Revision}})', fileUrl: '{{@Selected_Drawing_ID}}', showGrid: true } },
            { id: 's2_info_bg_' + ts, type: 'SHAPE', x: 0, y: 560, w: 1000, h: 80, props: { shapeType: 'rect', fill: '#1e293b' } },
            { id: 's2_info_' + ts, type: 'TEXT', x: 20, y: 575, w: 500, h: 50, props: { text: 'Drawing ID: {{@Selected_Drawing_ID}}', fontSize: 11, color: '#94a3b8' } },
            { id: 's2_btn_prev_' + ts, type: 'BUTTON', x: 600, y: 575, w: 150, h: 50, props: { text: 'Back', backgroundColor: '#334155', color: '#ffffff', fontSize: 13, fontWeight: 'bold' } },
            { id: 's2_btn_next_' + ts, type: 'BUTTON', x: 770, y: 575, w: 200, h: 50, props: { text: 'Next: Input', backgroundColor: '#3b82f6', color: '#ffffff', fontSize: 13, fontWeight: 'bold' } }
        ]
    };

    // STEP 3: INPUT MEASUREMENTS
    const step3 = {
        id: 's3_measure_' + ts,
        title: '3. Input Measurements',
        stepType: 'Step',
        components: [
            { id: 's3_header_' + ts, type: 'SHAPE', x: 0, y: 0, w: 1000, h: 70, props: { shapeType: 'rect', fill: '#714B67' } },
            { id: 's3_title_' + ts, type: 'TEXT', x: 20, y: 15, w: 500, h: 30, props: { text: 'DIMENSION MEASUREMENT INPUT', fontSize: 18, fontWeight: 'bold', color: '#ffffff' } },
            { id: 's3_cp1_title_' + ts, type: 'TEXT', x: 30, y: 90, w: 300, h: 25, props: { text: 'CP1: Internal Bore Diameter', fontSize: 13, fontWeight: 'bold', color: '#1e2937' } },
            { id: 's3_cp1_spec_' + ts, type: 'TEXT', x: 30, y: 115, w: 300, h: 20, props: { text: 'Spec: Nominal: 25.000mm | Tolerance: 24.900-25.100mm', fontSize: 10, color: '#64748b' } },
            { id: 's3_cp1_lbl_' + ts, type: 'TEXT', x: 30, y: 140, w: 80, h: 25, props: { text: 'Actual:', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's3_cp1_inp_' + ts, type: 'NUMBER_INPUT', x: 110, y: 140, w: 150, h: 40, props: { label: '', placeholder: '0.000', targetVariable: 'CP1_Result', unit: 'mm' } },
            { id: 's3_cp1_st_' + ts, type: 'TEXT', x: 280, y: 140, w: 100, h: 40, props: { text: '{{@CP1_Status}}', fontSize: 14, fontWeight: 'bold', color: '#d97706' } },
            { id: 's3_cp2_title_' + ts, type: 'TEXT', x: 420, y: 90, w: 300, h: 25, props: { text: 'CP2: Outer Flange Diameter', fontSize: 13, fontWeight: 'bold', color: '#1e2937' } },
            { id: 's3_cp2_spec_' + ts, type: 'TEXT', x: 420, y: 115, w: 300, h: 20, props: { text: 'Spec: Nominal: 45.000mm | Tolerance: 44.950-45.100mm', fontSize: 10, color: '#64748b' } },
            { id: 's3_cp2_lbl_' + ts, type: 'TEXT', x: 420, y: 140, w: 80, h: 25, props: { text: 'Actual:', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's3_cp2_inp_' + ts, type: 'NUMBER_INPUT', x: 500, y: 140, w: 150, h: 40, props: { label: '', placeholder: '0.000', targetVariable: 'CP2_Result', unit: 'mm' } },
            { id: 's3_cp2_st_' + ts, type: 'TEXT', x: 670, y: 140, w: 100, h: 40, props: { text: '{{@CP2_Status}}', fontSize: 14, fontWeight: 'bold', color: '#d97706' } },
            { id: 's3_div1_' + ts, type: 'SHAPE', x: 30, y: 200, w: 940, h: 1, props: { shapeType: 'rect', fill: '#e2e8f0' } },
            { id: 's3_cp3_title_' + ts, type: 'TEXT', x: 30, y: 220, w: 300, h: 25, props: { text: 'CP3: Total Height', fontSize: 13, fontWeight: 'bold', color: '#1e2937' } },
            { id: 's3_cp3_spec_' + ts, type: 'TEXT', x: 30, y: 245, w: 300, h: 20, props: { text: 'Spec: Nominal: 32.500mm | Tolerance: 32.400-32.600mm', fontSize: 10, color: '#64748b' } },
            { id: 's3_cp3_lbl_' + ts, type: 'TEXT', x: 30, y: 270, w: 80, h: 25, props: { text: 'Actual:', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's3_cp3_inp_' + ts, type: 'NUMBER_INPUT', x: 110, y: 270, w: 150, h: 40, props: { label: '', placeholder: '0.000', targetVariable: 'CP3_Result', unit: 'mm' } },
            { id: 's3_cp3_st_' + ts, type: 'TEXT', x: 280, y: 270, w: 100, h: 40, props: { text: '{{@CP3_Status}}', fontSize: 14, fontWeight: 'bold', color: '#d97706' } },
            { id: 's3_cp4_title_' + ts, type: 'TEXT', x: 420, y: 220, w: 300, h: 25, props: { text: 'CP4: Bolt Hole PCD', fontSize: 13, fontWeight: 'bold', color: '#1e2937' } },
            { id: 's3_cp4_spec_' + ts, type: 'TEXT', x: 420, y: 245, w: 300, h: 20, props: { text: 'Spec: Nominal: 65.000mm | Tolerance: 64.950-65.100mm', fontSize: 10, color: '#64748b' } },
            { id: 's3_cp4_lbl_' + ts, type: 'TEXT', x: 420, y: 270, w: 80, h: 25, props: { text: 'Actual:', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's3_cp4_inp_' + ts, type: 'NUMBER_INPUT', x: 500, y: 270, w: 150, h: 40, props: { label: '', placeholder: '0.000', targetVariable: 'CP4_Result', unit: 'mm' } },
            { id: 's3_cp4_st_' + ts, type: 'TEXT', x: 670, y: 270, w: 100, h: 40, props: { text: '{{@CP4_Status}}', fontSize: 14, fontWeight: 'bold', color: '#d97706' } },
            { id: 's3_div2_' + ts, type: 'SHAPE', x: 30, y: 330, w: 940, h: 1, props: { shapeType: 'rect', fill: '#e2e8f0' } },
            { id: 's3_cp5_title_' + ts, type: 'TEXT', x: 30, y: 350, w: 300, h: 25, props: { text: 'CP5: Pilot Bore Diameter', fontSize: 13, fontWeight: 'bold', color: '#1e2937' } },
            { id: 's3_cp5_spec_' + ts, type: 'TEXT', x: 30, y: 375, w: 300, h: 20, props: { text: 'Spec: Nominal: 20.000mm | Tolerance: 19.980-20.050mm', fontSize: 10, color: '#64748b' } },
            { id: 's3_cp5_lbl_' + ts, type: 'TEXT', x: 30, y: 400, w: 80, h: 25, props: { text: 'Actual:', fontSize: 12, fontWeight: '600', color: '#374151' } },
            { id: 's3_cp5_inp_' + ts, type: 'NUMBER_INPUT', x: 110, y: 400, w: 150, h: 40, props: { label: '', placeholder: '0.000', targetVariable: 'CP5_Result', unit: 'mm' } },
            { id: 's3_cp5_st_' + ts, type: 'TEXT', x: 280, y: 400, w: 100, h: 40, props: { text: '{{@CP5_Status}}', fontSize: 14, fontWeight: 'bold', color: '#d97706' } },
            { id: 's3_notes_lbl_' + ts, type: 'TEXT', x: 420, y: 350, w: 200, h: 25, props: { text: 'Inspection Notes', fontSize: 13, fontWeight: 'bold', color: '#1e2937' } },
            { id: 's3_notes_inp_' + ts, type: 'TEXT_INPUT', x: 420, y: 380, w: 550, h: 80, props: { label: '', placeholder: 'Enter additional notes...', targetVariable: 'Inspection_Notes', multiline: true } },
            { id: 's3_btn_prev_' + ts, type: 'BUTTON', x: 30, y: 520, w: 150, h: 50, props: { text: 'Back', backgroundColor: '#334155', color: '#ffffff', fontSize: 12, fontWeight: 'bold' } },
            { id: 's3_btn_next_' + ts, type: 'BUTTON', x: 770, y: 520, w: 200, h: 50, props: { text: 'Next: Summary', backgroundColor: '#3b82f6', color: '#ffffff', fontSize: 13, fontWeight: 'bold' } }
        ]
    };

    // STEP 4: SUMMARY & DECISION
    const step4 = {
        id: 's4_summary_' + ts,
        title: '4. Summary',
        stepType: 'Step',
        components: [
            { id: 's4_header_' + ts, type: 'SHAPE', x: 0, y: 0, w: 1000, h: 70, props: { shapeType: 'rect', fill: '#714B67' } },
            { id: 's4_title_' + ts, type: 'TEXT', x: 20, y: 15, w: 500, h: 30, props: { text: 'INSPECTION SUMMARY', fontSize: 18, fontWeight: 'bold', color: '#ffffff' } },
            { id: 's4_info_' + ts, type: 'TEXT', x: 20, y: 45, w: 600, h: 20, props: { text: 'WO: {{@Work_Order_No}} | Inspector: {{@Inspector_Name}}', fontSize: 11, color: '#e2cfe0' } },
            { id: 's4_sum_box_' + ts, type: 'SHAPE', x: 30, y: 90, w: 940, h: 120, props: { shapeType: 'rect', fill: '#faf5f9', stroke: '#714B67', strokeWidth: 1 } },
            { id: 's4_total_l_' + ts, type: 'TEXT', x: 60, y: 110, w: 100, h: 25, props: { text: 'Total Checks:', fontSize: 14, color: '#64748b' } },
            { id: 's4_total_v_' + ts, type: 'TEXT', x: 160, y: 105, w: 60, h: 35, props: { text: '{{@Total_Check_Points}}', fontSize: 28, fontWeight: 'bold', color: '#1e2937' } },
            { id: 's4_pass_l_' + ts, type: 'TEXT', x: 260, y: 110, w: 100, h: 25, props: { text: 'Passed:', fontSize: 14, color: '#64748b' } },
            { id: 's4_pass_v_' + ts, type: 'TEXT', x: 360, y: 105, w: 60, h: 35, props: { text: '{{@Passed_Check_Points}}', fontSize: 28, fontWeight: 'bold', color: '#16a34a' } },
            { id: 's4_fail_l_' + ts, type: 'TEXT', x: 460, y: 110, w: 100, h: 25, props: { text: 'Failed:', fontSize: 14, color: '#64748b' } },
            { id: 's4_fail_v_' + ts, type: 'TEXT', x: 560, y: 105, w: 60, h: 35, props: { text: '{{@Failed_Check_Points}}', fontSize: 28, fontWeight: 'bold', color: '#dc2626' } },
            { id: 's4_notes_l_' + ts, type: 'TEXT', x: 60, y: 160, w: 200, h: 25, props: { text: 'Notes: {{@Inspection_Notes}}', fontSize: 11, color: '#64748b' } },
            { id: 's4_jdg_l_' + ts, type: 'TEXT', x: 30, y: 240, w: 300, h: 30, props: { text: 'FINAL JUDGMENT', fontSize: 14, fontWeight: 'bold', color: '#714B67' } },
            { id: 's4_btn_pass_' + ts, type: 'BUTTON', x: 100, y: 290, w: 180, h: 70, props: { text: 'PASS', backgroundColor: '#16a34a', color: '#ffffff', fontSize: 24, fontWeight: 'bold' } },
            { id: 's4_btn_fail_' + ts, type: 'BUTTON', x: 320, y: 290, w: 180, h: 70, props: { text: 'FAIL', backgroundColor: '#dc2626', color: '#ffffff', fontSize: 24, fontWeight: 'bold' } },
            { id: 's4_btn_prev_' + ts, type: 'BUTTON', x: 30, y: 520, w: 150, h: 50, props: { text: 'Back', backgroundColor: '#334155', color: '#ffffff', fontSize: 12, fontWeight: 'bold' } },
            { id: 's4_btn_print_' + ts, type: 'BUTTON', x: 770, y: 520, w: 200, h: 50, props: { text: 'Print Report', backgroundColor: '#714B67', color: '#ffffff', fontSize: 13, fontWeight: 'bold' } }
        ]
    };

    // RETURN APP OBJECT - WRAPPED IN CONFIG FOR APPSTORE COMPATIBILITY
    return {
        id: 'app_qc_checksheet_' + ts,
        name: 'QC Inspection Check Sheet',
        description: 'App QC Inspection dengan Drawing, Inspector Designer, dan Report Designer integration',
        category: 'Drawing/Check Sheet',
        icon: 'FileCode',
        version: '1.0.0',
        author: 'MANDOR Engineering',
        tags: ['QC', 'Inspection', 'Check Sheet', 'Drawing', 'Report'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config: {
            variables: V,
            tables: [
                {
                    id: T.qaRecords,
                    name: 'QA_Drawing_Checksheets',
                    columns: ['work_order_no', 'part_number', 'serial_number', 'drawing_id', 'drawing_name', 'inspector_name', 'pic_name', 'overall_status', 'inspection_date', 'notes', 'pass_rate']
                },
                {
                    id: T.qaItems,
                    name: 'QA_Check_Items',
                    columns: ['point_number', 'title', 'nominal', 'tolerance_min', 'tolerance_max', 'actual_value', 'status']
                }
            ],
            recordPlaceholders: R,
            steps: [step1, step2, step3, step4],
            appTables: [T.qaRecords, T.qaItems]
        }
    };
}
