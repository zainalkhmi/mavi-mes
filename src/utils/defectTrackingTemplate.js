/**
 * defectTrackingTemplate.js
 * Defect Tracking Template based on Tulip
 * Tables: Defect_Events
 */
export function createDefectTrackingTemplate() {
    const ts = Date.now(), iso = new Date().toISOString();
    const T = { events: 'tbl_defect_events' };

    const V = [
        { id: `v1_${ts}`, name: 'Selected_Event_ID', type: 'string', defaultValue: '', persisted: false },
        { id: `v2_${ts}`, name: 'Input_Material_ID', type: 'string', defaultValue: '', persisted: false },
        { id: `v3_${ts}`, name: 'Input_Reason', type: 'string', defaultValue: '', persisted: false },
        { id: `v4_${ts}`, name: 'Input_Status', type: 'string', defaultValue: '', persisted: false },
        { id: `v5_${ts}`, name: 'Log_Material', type: 'string', defaultValue: 'Material 1', persisted: false },
        { id: `v6_${ts}`, name: 'Log_Description', type: 'string', defaultValue: '', persisted: false },
        { id: `v7_${ts}`, name: 'Log_Reason', type: 'string', defaultValue: 'Reason 1', persisted: false },
        { id: `v8_${ts}`, name: 'Log_Qty', type: 'number', defaultValue: 1, persisted: false },
        { id: `v9_${ts}`, name: 'Current_User', type: 'string', defaultValue: '@APP_INFO.USER', persisted: true },
        { id: `v10_${ts}`, name: 'Current_Station', type: 'string', defaultValue: '@APP_INFO.STATION', persisted: true },
        { id: `v11_${ts}`, name: 'Rework_Station', type: 'string', defaultValue: 'Station 2', persisted: false },
        { id: `v12_${ts}`, name: 'Rework_Severity', type: 'string', defaultValue: 'p0', persisted: false },
        { id: `v13_${ts}`, name: 'Rework_Notes', type: 'string', defaultValue: '', persisted: false },
        { id: `v14_${ts}`, name: 'Rework_Desc', type: 'string', defaultValue: '', persisted: false }
    ];

    // Step 1: View Defects
    const step1 = { id: `s1_${ts}`, title: '1. View Defects', stepType: 'Step', components: [
        { id: `s1h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'View Defects', fontSize: 28, fontWeight: 'bold', color: '#0f172a' } },
        
        // Left pane: Filter and Table
        { id: `s1lbl_sel_${ts}`, type: 'TEXT', x: 30, y: 60, w: 300, h: 30, props: { text: 'Select defect event', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        
        // Filters
        { id: `s1f1_${ts}`, type: 'TEXT_INPUT', x: 30, y: 100, w: 150, h: 40, props: { label: 'Material ID', targetVariable: 'Input_Material_ID', fontSize: 12 } },
        { id: `s1f2_${ts}`, type: 'TEXT_INPUT', x: 190, y: 100, w: 150, h: 40, props: { label: 'Defect reason', targetVariable: 'Input_Reason', fontSize: 12 } },
        { id: `s1f3_${ts}`, type: 'TEXT_INPUT', x: 350, y: 100, w: 140, h: 40, props: { label: 'Status', targetVariable: 'Input_Status', fontSize: 12 } },
        
        // Table
        { id: `s1tbl_${ts}`, type: 'INTERACTIVE_TABLE', x: 30, y: 160, w: 460, h: 300, props: {
            tableId: T.events, label: '', visibleColumns: ['Material_ID', 'Reported_Date', 'Reason', 'Status'], fontSize: 12
        }},
        
        { id: `s1or_${ts}`, type: 'TEXT', x: 500, y: 260, w: 40, h: 40, props: { text: 'OR', fontSize: 18, fontWeight: 'bold', color: '#94a3b8', textAlign: 'center' } },

        // Right pane: Scan and details
        { id: `s1lbl_scan_${ts}`, type: 'TEXT', x: 550, y: 60, w: 300, h: 30, props: { text: 'Scan defect event', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s1img_${ts}`, type: 'IMAGE', x: 550, y: 100, w: 380, h: 180, props: { url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80', objectFit: 'cover' } },
        
        // Detail grid
        { id: `s1d1_${ts}`, type: 'TEXT', x: 550, y: 300, w: 180, h: 40, props: { text: 'Reported date\n2023-05-15 10:08', fontSize: 12, color: '#1e293b' } },
        { id: `s1d2_${ts}`, type: 'TEXT', x: 740, y: 300, w: 180, h: 40, props: { text: 'Reported By\nUser Name', fontSize: 12, color: '#1e293b' } },
        { id: `s1d3_${ts}`, type: 'TEXT', x: 550, y: 350, w: 180, h: 40, props: { text: 'Material ID\n46376', fontSize: 12, color: '#1e293b' } },
        { id: `s1d4_${ts}`, type: 'TEXT', x: 740, y: 350, w: 180, h: 40, props: { text: 'Reason\nReason 2', fontSize: 12, color: '#1e293b' } },
        { id: `s1d5_${ts}`, type: 'TEXT', x: 550, y: 400, w: 180, h: 40, props: { text: 'Location Detected\nAssembly Station 1', fontSize: 12, color: '#1e293b' } },
        { id: `s1d6_${ts}`, type: 'TEXT', x: 740, y: 400, w: 180, h: 40, props: { text: 'Quantity\n3', fontSize: 12, color: '#1e293b' } },
        
        // Bottom Action Bar
        { id: `s1actbox_${ts}`, type: 'SHAPE', x: 0, y: 480, w: 960, h: 60, props: { shapeType: 'rect', fill: '#ffffff', stroke: '#e2e8f0', strokeWidth: 1 } },
        { id: `s1btn_log_${ts}`, type: 'BUTTON', x: 450, y: 490, w: 240, h: 40, props: {
            label: '⚠️ Log Defect', text: '⚠️ Log Defect', backgroundColor: '#dc2626', color: 'white', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'GoLog', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s2_${ts}` } }] }]
        }},
        { id: `s1btn_view_${ts}`, type: 'BUTTON', x: 580, y: 490, w: 180, h: 40, props: {
            label: '↗ View / Manage', text: '↗ View / Manage', backgroundColor: '#3b82f6', color: 'white', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'GoManage', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s4_${ts}` } }] }]
        }},
        { id: `s1btn_rwk_${ts}`, type: 'BUTTON', x: 770, y: 490, w: 170, h: 40, props: {
            label: '🛠️ Process Rework', text: '🛠️ Process Rework', backgroundColor: '#10b981', color: 'white', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'GoRework', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s7_${ts}` } }] }]
        }}
    ]};

    // Step 2: Log Defects
    const step2 = { id: `s2_${ts}`, title: '2. Log Defects', stepType: 'Step', components: [
        { id: `s2h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Log Defects', fontSize: 28, fontWeight: 'bold', color: '#0f172a' } },
        
        { id: `s2box_${ts}`, type: 'SHAPE', x: 20, y: 60, w: 920, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        
        // Left pane: Form
        { id: `s2fh_${ts}`, type: 'TEXT', x: 40, y: 80, w: 300, h: 30, props: { text: 'Fill defect form', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        
        { id: `s2f1_${ts}`, type: 'TEXT_INPUT', x: 40, y: 130, w: 400, h: 45, props: { label: 'Defective material', targetVariable: 'Log_Material', fontSize: 14 } },
        { id: `s2f2_${ts}`, type: 'TEXT_INPUT', x: 40, y: 200, w: 400, h: 45, props: { label: 'Description', targetVariable: 'Log_Description', fontSize: 14 } },
        { id: `s2f3_${ts}`, type: 'TEXT_INPUT', x: 40, y: 270, w: 400, h: 45, props: { label: 'Defect reason', targetVariable: 'Log_Reason', fontSize: 14 } },
        { id: `s2f4_${ts}`, type: 'TEXT_INPUT', x: 40, y: 340, w: 400, h: 45, props: { label: 'QTY', targetVariable: 'Log_Qty', inputType: 'number', fontSize: 14 } },

        // Right pane: Image
        { id: `s2imgh_${ts}`, type: 'TEXT', x: 480, y: 80, w: 400, h: 30, props: { text: 'Capture or upload image of the defect', fontSize: 18, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s2img_${ts}`, type: 'IMAGE', x: 480, y: 130, w: 420, h: 260, props: { url: 'https://images.unsplash.com/photo-1606575647565-d91ab2d5bbfa?auto=format&fit=crop&w=600&q=80', objectFit: 'contain' } },
        
        // Bottom Action Bar
        { id: `s2actbox_${ts}`, type: 'SHAPE', x: 0, y: 480, w: 960, h: 60, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1 } },
        { id: `s2btn_prev_${ts}`, type: 'BUTTON', x: 20, y: 490, w: 120, h: 40, props: {
            label: '← Previous', text: '← Previous', backgroundColor: 'transparent', color: '#3b82f6', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'Prev', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }] }]
        }},
        { id: `s2btn_log_${ts}`, type: 'BUTTON', x: 680, y: 490, w: 260, h: 40, props: {
            label: '⚠️ Log defect and Print Label', text: '⚠️ Log defect and Print Label', backgroundColor: '#dc2626', color: 'white', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'SaveDefect', event: 'ON_CLICK', actions: [
                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_defect_${ts}` } },
                { type: 'GO_TO_STEP', payload: { stepId: `s3_${ts}` } }
            ] }]
        }}
    ]};

    // Step 3: Label
    const step3 = { id: `s3_${ts}`, title: '3. Label', stepType: 'Step', components: [
        { id: `s3h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Label', fontSize: 28, fontWeight: 'bold', color: '#0f172a' } },
        
        // Label Box
        { id: `s3lblbox_${ts}`, type: 'SHAPE', x: 280, y: 80, w: 400, h: 300, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 2, cornerRadius: 8 } },
        { id: `s3lblh_${ts}`, type: 'TEXT', x: 300, y: 100, w: 360, h: 30, props: { text: 'Defect ID-982374', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        
        { id: `s3d1_${ts}`, type: 'TEXT', x: 300, y: 150, w: 120, h: 40, props: { text: 'Reported date\n2023-09-17', fontSize: 12, color: '#1e293b' } },
        { id: `s3d2_${ts}`, type: 'TEXT', x: 430, y: 150, w: 120, h: 40, props: { text: 'Reported By\nUser', fontSize: 12, color: '#1e293b' } },
        { id: `s3d3_${ts}`, type: 'TEXT', x: 560, y: 150, w: 100, h: 40, props: { text: 'Material ID\nMaterial 2', fontSize: 12, color: '#1e293b' } },
        
        { id: `s3d4_${ts}`, type: 'TEXT', x: 300, y: 200, w: 120, h: 40, props: { text: 'Reason\nReason 1', fontSize: 12, color: '#1e293b' } },
        { id: `s3d5_${ts}`, type: 'TEXT', x: 430, y: 200, w: 120, h: 40, props: { text: 'Location Detected\nTest Station', fontSize: 12, color: '#1e293b' } },
        { id: `s3d6_${ts}`, type: 'TEXT', x: 560, y: 200, w: 100, h: 40, props: { text: 'Quantity\n1', fontSize: 12, color: '#1e293b' } },
        
        { id: `s3barcode_${ts}`, type: 'IMAGE', x: 300, y: 260, w: 360, h: 80, props: { url: 'https://cdn.pixabay.com/photo/2014/04/02/16/19/barcode-306926_960_720.png', objectFit: 'contain' } },
        
        // Bottom Action Bar
        { id: `s3actbox_${ts}`, type: 'SHAPE', x: 0, y: 480, w: 960, h: 60, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1 } },
        { id: `s3btn_print_${ts}`, type: 'BUTTON', x: 800, y: 490, w: 140, h: 40, props: {
            label: '🖨️ Print', text: '🖨️ Print', backgroundColor: '#3b82f6', color: 'white', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'PrintLabel', event: 'ON_CLICK', actions: [
                { type: 'SHOW_MESSAGE', payload: { message: 'Label sent to printer.', msgType: 'info' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }
            ] }]
        }}
    ]};

    // Step 4: Defect Event Details
    const step4 = { id: `s4_${ts}`, title: '4. Defect Event Details', stepType: 'Step', components: [
        { id: `s4h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Defect Event Details', fontSize: 28, fontWeight: 'bold', color: '#0f172a' } },
        
        // Left Box: Details
        { id: `s4boxl_${ts}`, type: 'SHAPE', x: 20, y: 60, w: 440, h: 400, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `s4fh_${ts}`, type: 'TEXT', x: 40, y: 80, w: 400, h: 30, props: { text: 'Details of selected defect event', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        
        { id: `s4d1_${ts}`, type: 'TEXT', x: 40, y: 130, w: 200, h: 40, props: { text: 'ID\nDFCT-001', fontSize: 12, color: '#1e293b' } },
        { id: `s4d2_${ts}`, type: 'TEXT', x: 250, y: 130, w: 200, h: 40, props: { text: 'Reported date\n2023-05-15', fontSize: 12, color: '#1e293b' } },
        { id: `s4d3_${ts}`, type: 'TEXT', x: 40, y: 180, w: 200, h: 40, props: { text: 'Reported By\nUser', fontSize: 12, color: '#1e293b' } },
        { id: `s4d4_${ts}`, type: 'TEXT', x: 250, y: 180, w: 200, h: 40, props: { text: 'Material ID\n46376', fontSize: 12, color: '#1e293b' } },
        { id: `s4d5_${ts}`, type: 'TEXT', x: 40, y: 230, w: 200, h: 40, props: { text: 'Description\ntext here', fontSize: 12, color: '#1e293b' } },
        { id: `s4d6_${ts}`, type: 'TEXT', x: 250, y: 230, w: 200, h: 40, props: { text: 'Quantity\n3', fontSize: 12, color: '#1e293b' } },
        { id: `s4d7_${ts}`, type: 'TEXT', x: 40, y: 280, w: 200, h: 40, props: { text: 'Reason\nReason 2', fontSize: 12, color: '#1e293b' } },
        { id: `s4d8_${ts}`, type: 'TEXT', x: 250, y: 280, w: 200, h: 40, props: { text: 'Status\nNew', fontSize: 12, color: '#1e293b' } },
        { id: `s4d9_${ts}`, type: 'TEXT', x: 40, y: 330, w: 200, h: 40, props: { text: 'Location Detected\nStation', fontSize: 12, color: '#1e293b' } },
        
        // Right Box: Photo
        { id: `s4boxr_${ts}`, type: 'SHAPE', x: 480, y: 60, w: 460, h: 400, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `s4ph_${ts}`, type: 'TEXT', x: 500, y: 80, w: 400, h: 30, props: { text: 'Defect photo', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s4noph_${ts}`, type: 'TEXT', x: 500, y: 220, w: 420, h: 30, props: { text: 'NO PHOTO FOR SELECTED ITEM', fontSize: 14, fontWeight: 'bold', color: '#64748b', textAlign: 'center' } },

        // Bottom Action Bar
        { id: `s4actbox_${ts}`, type: 'SHAPE', x: 0, y: 480, w: 960, h: 60, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1 } },
        { id: `s4btn_prev_${ts}`, type: 'BUTTON', x: 20, y: 490, w: 120, h: 40, props: {
            label: '← Previous', text: '← Previous', backgroundColor: 'transparent', color: '#3b82f6', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'Prev', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }] }]
        }},
        { id: `s4btn_manage_${ts}`, type: 'BUTTON', x: 740, y: 490, w: 200, h: 40, props: {
            label: 'Manage Defect', text: 'Manage Defect', backgroundColor: '#3b82f6', color: 'white', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'GoManage', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s5_${ts}` } }] }]
        }}
    ]};

    // Step 5: Manage Defect
    const step5 = { id: `s5_${ts}`, title: '5. Manage Defect', stepType: 'Step', components: [
        { id: `s5h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Manage Defect', fontSize: 28, fontWeight: 'bold', color: '#0f172a' } },
        
        // Left Box: Details (Same as Step 4)
        { id: `s5boxl_${ts}`, type: 'SHAPE', x: 20, y: 60, w: 440, h: 400, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `s5fh_${ts}`, type: 'TEXT', x: 40, y: 80, w: 400, h: 30, props: { text: 'Details of selected defect event', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s5d1_${ts}`, type: 'TEXT', x: 40, y: 130, w: 200, h: 40, props: { text: 'ID\nDFCT-001', fontSize: 12, color: '#1e293b' } },
        { id: `s5d2_${ts}`, type: 'TEXT', x: 250, y: 130, w: 200, h: 40, props: { text: 'Reported date\n2023-05-15', fontSize: 12, color: '#1e293b' } },
        { id: `s5d3_${ts}`, type: 'TEXT', x: 40, y: 180, w: 200, h: 40, props: { text: 'Reported By\nUser', fontSize: 12, color: '#1e293b' } },
        { id: `s5d4_${ts}`, type: 'TEXT', x: 250, y: 180, w: 200, h: 40, props: { text: 'Material ID\n46376', fontSize: 12, color: '#1e293b' } },
        
        // Right Box: Actions
        { id: `s5boxr_${ts}`, type: 'SHAPE', x: 480, y: 60, w: 460, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        
        { id: `s5btn_scrap_${ts}`, type: 'BUTTON', x: 510, y: 120, w: 400, h: 50, props: {
            label: '🗑️ Mark as scrap', text: '🗑️ Mark as scrap', backgroundColor: '#3b82f6', color: 'white', fontSize: 16, fontWeight: 'bold',
            triggers: [{ name: 'Scrap', event: 'ON_CLICK', actions: [
                { type: 'SHOW_MESSAGE', payload: { message: 'Defect marked as Scrap. Status updated.', msgType: 'error' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }
            ] }]
        }},
        { id: `s5btn_rework_${ts}`, type: 'BUTTON', x: 510, y: 190, w: 400, h: 50, props: {
            label: '🔧 Send to rework', text: '🔧 Send to rework', backgroundColor: '#3b82f6', color: 'white', fontSize: 16, fontWeight: 'bold',
            triggers: [{ name: 'Rework', event: 'ON_CLICK', actions: [
                { type: 'GO_TO_STEP', payload: { stepId: `s6_${ts}` } }
            ] }]
        }},
        { id: `s5btn_use_${ts}`, type: 'BUTTON', x: 510, y: 260, w: 400, h: 50, props: {
            label: '✓ Use-as-Is', text: '✓ Use-as-Is', backgroundColor: '#3b82f6', color: 'white', fontSize: 16, fontWeight: 'bold',
            triggers: [{ name: 'UseAsIs', event: 'ON_CLICK', actions: [
                { type: 'SHOW_MESSAGE', payload: { message: 'Defect marked as Use-as-Is. Status updated.', msgType: 'success' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }
            ] }]
        }},

        // Bottom Action Bar
        { id: `s5actbox_${ts}`, type: 'SHAPE', x: 0, y: 480, w: 960, h: 60, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1 } },
        { id: `s5btn_prev_${ts}`, type: 'BUTTON', x: 20, y: 490, w: 120, h: 40, props: {
            label: '← Previous', text: '← Previous', backgroundColor: 'transparent', color: '#3b82f6', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'Prev', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s4_${ts}` } }] }]
        }}
    ]};

    // Step 6: Rework Details
    const step6 = { id: `s6_${ts}`, title: '6. Rework Details', stepType: 'Step', components: [
        { id: `s6h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Rework Details', fontSize: 28, fontWeight: 'bold', color: '#0f172a' } },
        
        // Left Box: Details
        { id: `s6boxl_${ts}`, type: 'SHAPE', x: 20, y: 60, w: 440, h: 400, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `s6fh_${ts}`, type: 'TEXT', x: 40, y: 80, w: 400, h: 30, props: { text: 'Details of selected defect event', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s6d1_${ts}`, type: 'TEXT', x: 40, y: 130, w: 200, h: 40, props: { text: 'ID\nDFCT-001', fontSize: 12, color: '#1e293b' } },
        { id: `s6d2_${ts}`, type: 'TEXT', x: 250, y: 130, w: 200, h: 40, props: { text: 'Reported date\n2023-05-15', fontSize: 12, color: '#1e293b' } },
        { id: `s6d3_${ts}`, type: 'TEXT', x: 40, y: 180, w: 200, h: 40, props: { text: 'Reported By\nUser', fontSize: 12, color: '#1e293b' } },
        { id: `s6d4_${ts}`, type: 'TEXT', x: 250, y: 180, w: 200, h: 40, props: { text: 'Material ID\n46376', fontSize: 12, color: '#1e293b' } },
        
        // Right Box: Form
        { id: `s6boxr_${ts}`, type: 'SHAPE', x: 480, y: 60, w: 460, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `s6f1_${ts}`, type: 'TEXT_INPUT', x: 500, y: 100, w: 420, h: 45, props: { label: 'Defect description', targetVariable: 'Rework_Desc', fontSize: 14 } },
        { id: `s6f2_${ts}`, type: 'RADIO_GROUP', x: 500, y: 180, w: 420, h: 60, props: { label: 'Rework Station', targetVariable: 'Rework_Station', options: ['Station 1', 'Station 2', 'Station 3'] } },
        { id: `s6f3_${ts}`, type: 'RADIO_GROUP', x: 500, y: 260, w: 420, h: 60, props: { label: 'Rework Severity', targetVariable: 'Rework_Severity', options: ['p0', 'p1', 'p2'] } },
        
        { id: `s6btn_submit_${ts}`, type: 'BUTTON', x: 500, y: 350, w: 420, h: 50, props: {
            label: '🔧 Send to rework', text: '🔧 Send to rework', backgroundColor: '#3b82f6', color: 'white', fontSize: 16, fontWeight: 'bold',
            triggers: [{ name: 'SendRework', event: 'ON_CLICK', actions: [
                { type: 'SHOW_MESSAGE', payload: { message: 'Part sent to rework successfully.', msgType: 'info' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }
            ] }]
        }},

        // Bottom Action Bar
        { id: `s6actbox_${ts}`, type: 'SHAPE', x: 0, y: 480, w: 960, h: 60, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1 } },
        { id: `s6btn_prev_${ts}`, type: 'BUTTON', x: 20, y: 490, w: 120, h: 40, props: {
            label: '← Previous', text: '← Previous', backgroundColor: 'transparent', color: '#3b82f6', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'Prev', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s5_${ts}` } }] }]
        }}
    ]};

    // Step 7: Rework Event Details
    const step7 = { id: `s7_${ts}`, title: '7. Rework Event Details', stepType: 'Step', components: [
        { id: `s7h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Rework Event Details', fontSize: 28, fontWeight: 'bold', color: '#0f172a' } },
        
        // Left Box: Details
        { id: `s7boxl_${ts}`, type: 'SHAPE', x: 20, y: 60, w: 440, h: 400, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `s7fh_${ts}`, type: 'TEXT', x: 40, y: 80, w: 400, h: 30, props: { text: 'Details of selected defect event', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s7d1_${ts}`, type: 'TEXT', x: 40, y: 130, w: 200, h: 40, props: { text: 'ID\nDFCT-001', fontSize: 12, color: '#1e293b' } },
        { id: `s7d2_${ts}`, type: 'TEXT', x: 250, y: 130, w: 200, h: 40, props: { text: 'Reported date\n2023-05-15', fontSize: 12, color: '#1e293b' } },
        { id: `s7d3_${ts}`, type: 'TEXT', x: 40, y: 180, w: 200, h: 40, props: { text: 'Reported By\nUser', fontSize: 12, color: '#1e293b' } },
        { id: `s7d4_${ts}`, type: 'TEXT', x: 250, y: 180, w: 200, h: 40, props: { text: 'Material ID\n46376', fontSize: 12, color: '#1e293b' } },
        { id: `s7d5_${ts}`, type: 'TEXT', x: 40, y: 230, w: 200, h: 40, props: { text: 'Quantity\n1', fontSize: 12, color: '#1e293b' } },
        { id: `s7d6_${ts}`, type: 'TEXT', x: 250, y: 230, w: 200, h: 40, props: { text: 'Reason\nReason 2', fontSize: 12, color: '#1e293b' } },
        { id: `s7d7_${ts}`, type: 'TEXT', x: 40, y: 280, w: 200, h: 40, props: { text: 'Status\nRework in Progress', fontSize: 12, color: '#1e293b' } },
        
        // Right Top Box: Description
        { id: `s7boxrt_${ts}`, type: 'SHAPE', x: 480, y: 60, w: 460, h: 160, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `s7dt_${ts}`, type: 'TEXT', x: 500, y: 80, w: 400, h: 25, props: { text: 'Defect Description', fontSize: 18, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s7dd_${ts}`, type: 'TEXT', x: 500, y: 110, w: 400, h: 100, props: { text: 'my defect description', fontSize: 14, color: '#334155' } },

        // Right Bottom Box: Rework Notes
        { id: `s7boxrb_${ts}`, type: 'SHAPE', x: 480, y: 240, w: 460, h: 220, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `s7rn_${ts}`, type: 'TEXT_INPUT', x: 500, y: 260, w: 420, h: 180, props: { label: 'Rework Notes', targetVariable: 'Rework_Notes', multiline: true, fontSize: 14 } },

        // Bottom Action Bar
        { id: `s7actbox_${ts}`, type: 'SHAPE', x: 0, y: 480, w: 960, h: 60, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1 } },
        { id: `s7btn_prev_${ts}`, type: 'BUTTON', x: 20, y: 490, w: 120, h: 40, props: {
            label: '← Previous', text: '← Previous', backgroundColor: 'transparent', color: '#3b82f6', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'Prev', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }] }]
        }},
        { id: `s7btn_fail_${ts}`, type: 'BUTTON', x: 630, y: 490, w: 150, h: 40, props: {
            label: 'Rework Failed', text: 'Rework Failed', backgroundColor: '#dc2626', color: 'white', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'Fail', event: 'ON_CLICK', actions: [
                { type: 'SHOW_MESSAGE', payload: { message: 'Rework marked as failed.', msgType: 'error' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }
            ] }]
        }},
        { id: `s7btn_comp_${ts}`, type: 'BUTTON', x: 790, y: 490, w: 150, h: 40, props: {
            label: 'Rework Complete', text: 'Rework Complete', backgroundColor: '#10b981', color: 'white', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'Comp', event: 'ON_CLICK', actions: [
                { type: 'SHOW_MESSAGE', payload: { message: 'Rework marked as complete!', msgType: 'success' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }
            ] }]
        }}
    ]};

    return {
        id: `app_defect_${ts}`,
        name: 'Defect Tracking',
        description: 'Report and monitor defect events effectively, organize defect events, and provide rework details.',
        category: 'Quality',
        type: 'FRONT-LINE', published: true, approvalStatus: 'APPROVED',
        createdAt: iso, updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: [
                { id: `rp_defect_${ts}`, name: 'New_Defect_Event', tableId: T.events, description: 'New defect record' }
            ],
            appTables: [T.events],
            appTriggers: [],
            steps: [step1, step2, step3, step4, step5, step6, step7],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
