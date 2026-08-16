/**
 * digitalDrawingCheckSheetTemplate.js
 * =====================================
 * Generates an interactive Digital Drawing Check Sheet Frontline App Template
 * that dynamically pulls drawings and dimension inspection points from the Drawing Menu.
 */

export function createDigitalDrawingCheckSheetTemplate() {
    const ts = Date.now();

    const T = {
        inspectionRecords: 'tbl_qa_drawing_checksheets',
        inspectionItems: 'tbl_qa_drawing_check_items'
    };

    const V = [
        { id: `v_wo_${ts}`, name: 'Work_Order_No', type: 'string', defaultValue: 'WO-2026-CAST-042', persisted: true },
        { id: `v_part_${ts}`, name: 'Part_Number', type: 'string', defaultValue: 'HOUSING-CAST-REV2', persisted: true },
        { id: `v_operator_${ts}`, name: 'Inspector_Name', type: 'string', defaultValue: 'QC Inspector 1', persisted: true },
        { id: `v_dwg_id_${ts}`, name: 'Selected_Drawing_ID', type: 'string', defaultValue: 'dwg_cast_housing_01', persisted: true },
        { id: `v_status_${ts}`, name: 'Overall_Inspection_Status', type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: `v_total_points_${ts}`, name: 'Total_Check_Points', type: 'number', defaultValue: 8, persisted: false },
        { id: `v_passed_points_${ts}`, name: 'Passed_Check_Points', type: 'number', defaultValue: 0, persisted: false },
        { id: `v_failed_points_${ts}`, name: 'Failed_Check_Points', type: 'number', defaultValue: 0, persisted: false },
        { id: `v_notes_${ts}`, name: 'Inspection_Notes', type: 'string', defaultValue: '', persisted: false }
    ];

    const R = [
        { id: `r1_${ts}`, name: 'Active_Checksheet', tableId: T.inspectionRecords, type: 'single' }
    ];

    const step1 = {
        id: `s_checksheet_${ts}`,
        title: '1. Digital Drawing Check Sheet',
        stepType: 'Step',
        components: [
            // Top App Bar
            {
                id: `cs_topbar_${ts}`, type: 'CONTAINER',
                x: 0, y: 0, w: 1000, h: 50,
                props: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderBottom: '1px solid #334155' }
            },
            {
                id: `cs_logo_${ts}`, type: 'HEADING',
                x: 16, y: 10, w: 300, h: 30,
                props: { text: 'Mavi-Core® QA Check Sheet', fontSize: 16, fontWeight: 'bold', color: '#22c55e' }
            },
            {
                id: `cs_info_${ts}`, type: 'TEXT',
                x: 350, y: 14, w: 400, h: 25,
                props: { text: 'WO: {{@Work_Order_No}} | Part: {{@Part_Number}} | Inspector: {{@Inspector_Name}}', fontSize: 12, color: '#94a3b8' }
            },

            // Center: Interactive Check Sheet Container
            {
                id: `cs_interactive_viewer_${ts}`, type: 'CONTAINER',
                x: 10, y: 60, w: 980, h: 545,
                props: {
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    borderColor: '#cbd5e1',
                    border: '1px solid #cbd5e1',
                    overflow: 'hidden'
                }
            }
        ]
    };

    return {
        id: `app_digital_checksheet_${ts}`,
        name: 'Digital Drawing Check Sheet (QA Interactive)',
        description: 'Digital QA Check Sheet linked to 2D engineering drawings and CAD blueprints from Menu Drawing with interactive hotspot inspection pins and real-time tolerance validation.',
        category: 'Quality Management',
        icon: 'FileCode',
        version: '2.0.0',
        author: 'MAVI Engineering',
        tags: ['QA', 'Drawing', 'Check Sheet', 'Blueprint', 'Tolerance', 'CAD'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        variables: V,
        tables: [
            {
                id: T.inspectionRecords,
                name: 'QA Drawing Check Sheet Records',
                fields: [
                    { id: 'f_id', name: 'id', type: 'string' },
                    { id: 'f_wo', name: 'work_order_no', type: 'string' },
                    { id: 'f_part', name: 'part_number', type: 'string' },
                    { id: 'f_inspector', name: 'inspector_name', type: 'string' },
                    { id: 'f_dwg', name: 'drawing_id', type: 'string' },
                    { id: 'f_status', name: 'overall_status', type: 'string' },
                    { id: 'f_score', name: 'pass_rate', type: 'number' },
                    { id: 'f_created', name: 'created_at', type: 'datetime' }
                ]
            }
        ],
        recordPlaceholders: R,
        steps: [step1]
    };
}
