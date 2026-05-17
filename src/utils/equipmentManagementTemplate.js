/**
 * equipmentManagementTemplate.js
 * Equipment Management Template based on Tulip
 * Tables: Asset, Equipment_Status_History
 */
export function createEquipmentManagementTemplate() {
    const ts = Date.now(), iso = new Date().toISOString();
    const T = { asset: 'tbl_asset', history: 'tbl_eq_history' };

    const V = [
        { id: `v1_${ts}`, name: 'Selected_Equipment_ID', type: 'string', defaultValue: '', persisted: false },
        { id: `v2_${ts}`, name: 'Filter_ID', type: 'string', defaultValue: '', persisted: false },
        { id: `v3_${ts}`, name: 'Filter_Name', type: 'string', defaultValue: '', persisted: false },
        
        { id: `v4_${ts}`, name: 'New_Name', type: 'string', defaultValue: '', persisted: false },
        { id: `v5_${ts}`, name: 'New_ID', type: 'string', defaultValue: '', persisted: false },
        { id: `v6_${ts}`, name: 'New_Type', type: 'string', defaultValue: 'Scale', persisted: false },
        { id: `v7_${ts}`, name: 'New_Description', type: 'string', defaultValue: '', persisted: false },
        
        { id: `v8_${ts}`, name: 'Change_Status', type: 'string', defaultValue: 'Clean', persisted: false },
        { id: `v9_${ts}`, name: 'Daily_Comment', type: 'string', defaultValue: '', persisted: false },
        { id: `v10_${ts}`, name: 'Calibration_Status', type: 'string', defaultValue: 'Calibrated', persisted: false },
        { id: `v11_${ts}`, name: 'Measured_Tare', type: 'number', defaultValue: 0, persisted: false },
        { id: `v12_${ts}`, name: 'Malfunction_Comment', type: 'string', defaultValue: '', persisted: false }
    ];

    // Common component blocks to reuse
    const eqDetailsBlock = (x, y, bg = 'transparent') => [
        { id: `d_box_${y}_${ts}`, type: 'SHAPE', x, y, w: 400, h: 220, props: { shapeType: 'rect', fill: bg, stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `d_t_${y}_${ts}`, type: 'TEXT', x: x + 20, y: y + 20, w: 300, h: 30, props: { text: 'Selected equipment', fontSize: 18, fontWeight: 'bold', color: '#1e293b' } },
        { id: `d_id_${y}_${ts}`, type: 'TEXT', x: x + 20, y: y + 60, w: 180, h: 40, props: { text: 'ID\nTMS001', fontSize: 12, color: '#475569' } },
        { id: `d_nm_${y}_${ts}`, type: 'TEXT', x: x + 200, y: y + 60, w: 180, h: 40, props: { text: 'Name\nMettler Toledo', fontSize: 12, color: '#475569' } },
        { id: `d_st_${y}_${ts}`, type: 'TEXT', x: x + 20, y: y + 110, w: 180, h: 40, props: { text: 'Status\nClean', fontSize: 12, color: '#475569' } },
        { id: `d_ty_${y}_${ts}`, type: 'TEXT', x: x + 200, y: y + 110, w: 180, h: 40, props: { text: 'Type\nScale', fontSize: 12, color: '#475569' } },
        { id: `d_lc_${y}_${ts}`, type: 'TEXT', x: x + 20, y: y + 160, w: 180, h: 40, props: { text: 'Last Calibration\n2023-10-16', fontSize: 12, color: '#475569' } },
        { id: `d_wg_${y}_${ts}`, type: 'TEXT', x: x + 200, y: y + 160, w: 180, h: 40, props: { text: 'Weight [kg]\n15', fontSize: 12, color: '#475569' } }
    ];

    // Step 1: Equipment Overview
    const step1 = { id: `s1_${ts}`, title: 'Equipment Overview', stepType: 'Step', components: [
        { id: `s1h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Equipment Overview', fontSize: 24, fontWeight: 'bold', color: '#0f172a' } },
        
        // Left Pane
        { id: `s1bl_${ts}`, type: 'SHAPE', x: 20, y: 60, w: 500, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1 } },
        { id: `s1fh_${ts}`, type: 'TEXT', x: 40, y: 80, w: 300, h: 30, props: { text: 'Scan or select an equipment', fontSize: 16, fontWeight: 'bold' } },
        
        { id: `s1f1_${ts}`, type: 'TEXT_INPUT', x: 40, y: 120, w: 140, h: 40, props: { label: 'Filter by ID', targetVariable: 'Filter_ID', fontSize: 12 } },
        { id: `s1f2_${ts}`, type: 'TEXT_INPUT', x: 190, y: 120, w: 140, h: 40, props: { label: 'Filter by Name', targetVariable: 'Filter_Name', fontSize: 12 } },
        
        { id: `s1btn_add_${ts}`, type: 'BUTTON', x: 350, y: 130, w: 150, h: 35, props: {
            label: '+ Add new equipment', text: '+ Add new equipment', backgroundColor: '#ecfdf5', color: '#059669', fontSize: 12, fontWeight: 'bold',
            triggers: [{ name: 'GoAdd', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s2_${ts}` } }] }]
        }},
        
        { id: `s1tbl_${ts}`, type: 'INTERACTIVE_TABLE', x: 40, y: 180, w: 460, h: 260, props: {
            tableId: T.asset, label: '', visibleColumns: ['ID', 'Name', 'Type', 'Status'], fontSize: 12
        }},

        // Right Pane
        { id: `s1br_${ts}`, type: 'SHAPE', x: 540, y: 60, w: 400, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1 } },
        ...eqDetailsBlock(540, 60),
        { id: `s1btn_print_${ts}`, type: 'BUTTON', x: 690, y: 400, w: 120, h: 40, props: {
            label: '🖨️ Print label', text: '🖨️ Print label', backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: 13, fontWeight: 'bold'
        }},

        // Bottom Action Bar
        { id: `s1ab_${ts}`, type: 'SHAPE', x: 0, y: 480, w: 960, h: 60, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1 } },
        { id: `s1btn_malf_${ts}`, type: 'BUTTON', x: 540, y: 490, w: 180, h: 40, props: {
            label: '⚠️ Report malfunction', text: '⚠️ Report malfunction', backgroundColor: '#dc2626', color: 'white', fontSize: 13, fontWeight: 'bold',
            triggers: [{ name: 'GoMalf', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s8_${ts}` } }] }]
        }},
        { id: `s1btn_manage_${ts}`, type: 'BUTTON', x: 740, y: 490, w: 180, h: 40, props: {
            label: 'Manage equipment ➔', text: 'Manage equipment ➔', backgroundColor: '#3b82f6', color: 'white', fontSize: 13, fontWeight: 'bold',
            triggers: [{ name: 'GoManage', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s3_${ts}` } }] }]
        }}
    ]};

    // Step 2: Add New Equipment
    const step2 = { id: `s2_${ts}`, title: 'Add New Equipment', stepType: 'Step', components: [
        { id: `s2h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Add New Equipment', fontSize: 24, fontWeight: 'bold', color: '#0f172a' } },
        
        { id: `s2box_${ts}`, type: 'SHAPE', x: 280, y: 60, w: 400, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `s2fh_${ts}`, type: 'TEXT', x: 300, y: 80, w: 300, h: 30, props: { text: 'Add New Equipment', fontSize: 18, fontWeight: 'bold' } },
        
        { id: `s2i1_${ts}`, type: 'TEXT_INPUT', x: 300, y: 120, w: 170, h: 45, props: { label: 'Name (Required)', targetVariable: 'New_Name', fontSize: 13 } },
        { id: `s2i2_${ts}`, type: 'TEXT_INPUT', x: 490, y: 120, w: 170, h: 45, props: { label: 'ID (Required)', targetVariable: 'New_ID', fontSize: 13 } },
        { id: `s2i3_${ts}`, type: 'RADIO_GROUP', x: 300, y: 180, w: 360, h: 60, props: { label: 'Type (Required)', targetVariable: 'New_Type', options: ['Scale', 'Container', 'Measuring'] } },
        { id: `s2i4_${ts}`, type: 'TEXT_INPUT', x: 300, y: 260, w: 360, h: 90, props: { label: 'Description', targetVariable: 'New_Description', multiline: true, fontSize: 13 } },

        { id: `s2btn_can_${ts}`, type: 'BUTTON', x: 300, y: 390, w: 150, h: 40, props: {
            label: '⊘ Cancel', text: '⊘ Cancel', backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Cancel', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }] }]
        }},
        { id: `s2btn_sav_${ts}`, type: 'BUTTON', x: 510, y: 390, w: 150, h: 40, props: {
            label: '✓ Save', text: '✓ Save', backgroundColor: '#3b82f6', color: 'white', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Save', event: 'ON_CLICK', actions: [
                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_asset_${ts}` } },
                { type: 'SHOW_MESSAGE', payload: { message: 'Equipment added successfully', msgType: 'success' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }
            ] }]
        }}
    ]};

    // Step 3: Selected Equipment
    const step3 = { id: `s3_${ts}`, title: 'Selected Equipment', stepType: 'Step', components: [
        { id: `s3h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Selected Equipment', fontSize: 24, fontWeight: 'bold', color: '#0f172a' } },
        
        // Left Pane: History
        { id: `s3bl_${ts}`, type: 'SHAPE', x: 20, y: 60, w: 550, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1 } },
        { id: `s3hh_${ts}`, type: 'TEXT', x: 40, y: 80, w: 300, h: 30, props: { text: 'Equipment history logs', fontSize: 18, fontWeight: 'bold' } },
        
        { id: `s3tbl_${ts}`, type: 'INTERACTIVE_TABLE', x: 40, y: 120, w: 510, h: 320, props: {
            tableId: T.history, label: '', visibleColumns: ['Activity_performed_by', 'Performed_Activity', 'Status', 'Date'], fontSize: 11
        }},

        // Right Pane: Details
        { id: `s3br_${ts}`, type: 'SHAPE', x: 590, y: 60, w: 350, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1 } },
        ...eqDetailsBlock(590, 60),

        // Bottom Action Bar
        { id: `s3ab_${ts}`, type: 'SHAPE', x: 0, y: 480, w: 960, h: 60, props: { shapeType: 'rect', fill: '#1e3a8a', stroke: '#1e3a8a', strokeWidth: 1 } },
        
        { id: `s3btn_sel_${ts}`, type: 'BUTTON', x: 20, y: 490, w: 180, h: 40, props: {
            label: '← Select new equipment', text: '← Select new equipment', backgroundColor: 'transparent', color: 'white', fontSize: 12, fontWeight: 'bold',
            triggers: [{ name: 'Back', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }] }]
        }},
        { id: `s3btn_malf_${ts}`, type: 'BUTTON', x: 220, y: 490, w: 140, h: 40, props: {
            label: '⚠️ Report malfunction', text: '⚠️ Malfunction', backgroundColor: '#dc2626', color: 'white', fontSize: 12, fontWeight: 'bold',
            triggers: [{ name: 'GoMalf', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s8_${ts}` } }] }]
        }},
        { id: `s3btn_cln_${ts}`, type: 'BUTTON', x: 370, y: 490, w: 100, h: 40, props: {
            label: '💧 Clean', text: '💧 Clean', backgroundColor: '#3b82f6', color: 'white', fontSize: 12, fontWeight: 'bold',
            triggers: [{ name: 'GoClean', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s4_${ts}` } }] }]
        }},
        { id: `s3btn_chk_${ts}`, type: 'BUTTON', x: 480, y: 490, w: 120, h: 40, props: {
            label: '📋 Daily Check', text: '📋 Daily Check', backgroundColor: '#3b82f6', color: 'white', fontSize: 12, fontWeight: 'bold',
            triggers: [{ name: 'GoCheck', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s5_${ts}` } }] }]
        }},
        { id: `s3btn_alc_${ts}`, type: 'BUTTON', x: 610, y: 490, w: 100, h: 40, props: {
            label: '🔄 Allocate', text: '🔄 Allocate', backgroundColor: '#3b82f6', color: 'white', fontSize: 12, fontWeight: 'bold'
        }},
        { id: `s3btn_cal_${ts}`, type: 'BUTTON', x: 720, y: 490, w: 100, h: 40, props: {
            label: '⚖️ Calibrate', text: '⚖️ Calibrate', backgroundColor: '#3b82f6', color: 'white', fontSize: 12, fontWeight: 'bold',
            triggers: [{ name: 'GoCal', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s6_${ts}` } }] }]
        }},
        { id: `s3btn_tar_${ts}`, type: 'BUTTON', x: 830, y: 490, w: 100, h: 40, props: {
            label: '⚖️ Set tare', text: '⚖️ Set tare', backgroundColor: '#3b82f6', color: 'white', fontSize: 12, fontWeight: 'bold',
            triggers: [{ name: 'GoTare', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s7_${ts}` } }] }]
        }}
    ]};

    // Step 4: Change Cleanliness Status
    const step4 = { id: `s4_${ts}`, title: 'Change Cleanliness', stepType: 'Step', components: [
        { id: `s4h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Change Cleanliness Status', fontSize: 24, fontWeight: 'bold', color: '#0f172a' } },
        { id: `s4box_${ts}`, type: 'SHAPE', x: 280, y: 60, w: 400, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        ...eqDetailsBlock(280, 60),
        { id: `s4drp_${ts}`, type: 'RADIO_GROUP', x: 300, y: 260, w: 360, h: 60, props: { label: 'Select an option', targetVariable: 'Change_Status', options: ['Clean', 'Dirty'] } },
        { id: `s4btn_can_${ts}`, type: 'BUTTON', x: 300, y: 380, w: 160, h: 40, props: {
            label: '⊘ Cancel', text: '⊘ Cancel', backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Cancel', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s3_${ts}` } }] }]
        }},
        { id: `s4btn_sav_${ts}`, type: 'BUTTON', x: 500, y: 380, w: 160, h: 40, props: {
            label: '✓ Save', text: '✓ Save', backgroundColor: '#3b82f6', color: 'white', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Save', event: 'ON_CLICK', actions: [
                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_hist_${ts}` } },
                { type: 'SHOW_MESSAGE', payload: { message: 'Cleanliness updated', msgType: 'success' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s3_${ts}` } }
            ] }]
        }}
    ]};

    // Step 5: Daily Check
    const step5 = { id: `s5_${ts}`, title: 'Daily Check', stepType: 'Step', components: [
        { id: `s5h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Daily Check', fontSize: 24, fontWeight: 'bold', color: '#0f172a' } },
        
        { id: `s5bl_${ts}`, type: 'SHAPE', x: 20, y: 60, w: 600, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `s5stepsh_${ts}`, type: 'TEXT', x: 40, y: 80, w: 200, h: 30, props: { text: 'Steps:', fontSize: 18, fontWeight: 'bold' } },
        { id: `s5ck1_${ts}`, type: 'TEXT', x: 40, y: 120, w: 560, h: 30, props: { text: '☐  1. Make sure the plate of the scale is empty and clean.', fontSize: 14, fontWeight: 'bold' } },
        { id: `s5ck2_${ts}`, type: 'TEXT', x: 40, y: 160, w: 560, h: 30, props: { text: '☐  2. Make sure that the scale is level.', fontSize: 14, fontWeight: 'bold' } },
        { id: `s5ck3_${ts}`, type: 'TEXT', x: 40, y: 200, w: 560, h: 30, props: { text: '☐  3. Zero the scale and run autocalibration, if it applicable.', fontSize: 14, fontWeight: 'bold' } },
        { id: `s5ck4_${ts}`, type: 'TEXT', x: 40, y: 240, w: 560, h: 50, props: { text: '☐  4. Place the appropriate calibration weight on the scale.\n      Check if the displayed value on the scale is within the specified range.', fontSize: 14, fontWeight: 'bold' } },
        
        { id: `s5i1_${ts}`, type: 'TEXT_INPUT', x: 40, y: 310, w: 560, h: 60, props: { label: 'Comments', targetVariable: 'Daily_Comment', multiline: true, fontSize: 13 } },
        
        { id: `s5btn_can_${ts}`, type: 'BUTTON', x: 40, y: 390, w: 150, h: 40, props: {
            label: '⊘ Cancel', text: '⊘ Cancel', backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Cancel', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s3_${ts}` } }] }]
        }},
        { id: `s5btn_done_${ts}`, type: 'BUTTON', x: 450, y: 390, w: 150, h: 40, props: {
            label: '📋 Daily check done', text: '📋 Daily check done', backgroundColor: '#059669', color: 'white', fontSize: 13, fontWeight: 'bold',
            triggers: [{ name: 'Done', event: 'ON_CLICK', actions: [
                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_hist_${ts}` } },
                { type: 'SHOW_MESSAGE', payload: { message: 'Daily check completed', msgType: 'success' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s3_${ts}` } }
            ] }]
        }},

        { id: `s5br_${ts}`, type: 'SHAPE', x: 640, y: 60, w: 300, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `s5r_id_${ts}`, type: 'TEXT', x: 660, y: 80, w: 260, h: 30, props: { text: 'Equipment ID:\nTMS001', fontSize: 16, fontWeight: 'bold' } },
        { id: `s5r_nm_${ts}`, type: 'TEXT', x: 660, y: 140, w: 120, h: 40, props: { text: 'Name\nMettler Toledo', fontSize: 12, color: '#475569' } },
        { id: `s5r_ds_${ts}`, type: 'TEXT', x: 800, y: 140, w: 120, h: 40, props: { text: 'Description\n15 kg scale', fontSize: 12, color: '#475569' } },
        { id: `s5r_st_${ts}`, type: 'TEXT', x: 660, y: 200, w: 120, h: 40, props: { text: 'Status\nClean', fontSize: 12, color: '#475569' } },
        { id: `s5r_cs_${ts}`, type: 'TEXT', x: 800, y: 200, w: 120, h: 40, props: { text: 'Calibration Status\nCalibrated', fontSize: 12, color: '#475569' } },
        { id: `s5r_ty_${ts}`, type: 'TEXT', x: 660, y: 260, w: 120, h: 40, props: { text: 'Type\nScale', fontSize: 12, color: '#475569' } },
        { id: `s5r_lc_${ts}`, type: 'TEXT', x: 800, y: 260, w: 120, h: 40, props: { text: 'Last Calibration\n2023-10-16', fontSize: 12, color: '#475569' } }
    ]};

    // Step 6: Calibration
    const step6 = { id: `s6_${ts}`, title: 'Calibration', stepType: 'Step', components: [
        { id: `s6h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Calibration', fontSize: 24, fontWeight: 'bold', color: '#0f172a' } },
        { id: `s6box_${ts}`, type: 'SHAPE', x: 280, y: 60, w: 400, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        
        { id: `s6dh_${ts}`, type: 'TEXT', x: 300, y: 80, w: 300, h: 30, props: { text: 'Selected Equipment', fontSize: 18, fontWeight: 'bold' } },
        { id: `s6di_${ts}`, type: 'TEXT', x: 300, y: 120, w: 100, h: 40, props: { text: 'ID\nTMS001', fontSize: 12, color: '#475569' } },
        { id: `s6dn_${ts}`, type: 'TEXT', x: 420, y: 120, w: 100, h: 40, props: { text: 'Name\nToledo', fontSize: 12, color: '#475569' } },
        { id: `s6ds_${ts}`, type: 'TEXT', x: 540, y: 120, w: 100, h: 40, props: { text: 'Status\nClean', fontSize: 12, color: '#475569' } },
        { id: `s6dc_${ts}`, type: 'TEXT', x: 300, y: 170, w: 300, h: 40, props: { text: 'Current Calibration Status\nCalibrated', fontSize: 13, color: '#64748b' } },
        
        { id: `s6drp_${ts}`, type: 'RADIO_GROUP', x: 300, y: 230, w: 360, h: 60, props: { label: 'New status (Required)', targetVariable: 'Calibration_Status', options: ['Calibrated', 'Not calibrated'] } },
        
        { id: `s6btn_can_${ts}`, type: 'BUTTON', x: 300, y: 380, w: 160, h: 40, props: {
            label: '⊘ Cancel', text: '⊘ Cancel', backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Cancel', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s3_${ts}` } }] }]
        }},
        { id: `s6btn_sav_${ts}`, type: 'BUTTON', x: 500, y: 380, w: 160, h: 40, props: {
            label: '✓ Save', text: '✓ Save', backgroundColor: '#3b82f6', color: 'white', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Save', event: 'ON_CLICK', actions: [
                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_hist_${ts}` } },
                { type: 'SHOW_MESSAGE', payload: { message: 'Calibration updated', msgType: 'success' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s3_${ts}` } }
            ] }]
        }}
    ]};

    // Step 7: Setting the Tare Weight
    const step7 = { id: `s7_${ts}`, title: 'Setting Tare', stepType: 'Step', components: [
        { id: `s7h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Setting the Tare Weight of the Equipment', fontSize: 24, fontWeight: 'bold', color: '#0f172a' } },
        { id: `s7box_${ts}`, type: 'SHAPE', x: 280, y: 60, w: 400, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        
        { id: `s7dh_${ts}`, type: 'TEXT', x: 300, y: 80, w: 300, h: 30, props: { text: 'Selected Equipment', fontSize: 18, fontWeight: 'bold' } },
        { id: `s7di_${ts}`, type: 'TEXT', x: 300, y: 120, w: 150, h: 40, props: { text: 'ID\nCONT1', fontSize: 12, color: '#475569' } },
        { id: `s7dn_${ts}`, type: 'TEXT', x: 470, y: 120, w: 150, h: 40, props: { text: 'Name\nContainer 800 kg', fontSize: 12, color: '#475569' } },
        { id: `s7ds_${ts}`, type: 'TEXT', x: 300, y: 170, w: 150, h: 40, props: { text: 'Status\nClean', fontSize: 12, color: '#475569' } },
        { id: `s7dt_${ts}`, type: 'TEXT', x: 470, y: 170, w: 150, h: 40, props: { text: 'Type\nContainer', fontSize: 12, color: '#475569' } },
        { id: `s7dw_${ts}`, type: 'TEXT', x: 300, y: 220, w: 300, h: 40, props: { text: 'Weight [kg]\n12', fontSize: 13, fontWeight: 'bold' } },
        
        { id: `s7i1_${ts}`, type: 'TEXT_INPUT', x: 300, y: 280, w: 360, h: 45, props: { label: 'Measured tare (Required)', targetVariable: 'Measured_Tare', inputType: 'number', fontSize: 13 } },
        
        { id: `s7btn_can_${ts}`, type: 'BUTTON', x: 300, y: 380, w: 160, h: 40, props: {
            label: '⊘ Cancel', text: '⊘ Cancel', backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Cancel', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s3_${ts}` } }] }]
        }},
        { id: `s7btn_sav_${ts}`, type: 'BUTTON', x: 500, y: 380, w: 160, h: 40, props: {
            label: '✓ Save', text: '✓ Save', backgroundColor: '#3b82f6', color: 'white', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Save', event: 'ON_CLICK', actions: [
                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_hist_${ts}` } },
                { type: 'SHOW_MESSAGE', payload: { message: 'Tare weight updated', msgType: 'success' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s3_${ts}` } }
            ] }]
        }}
    ]};

    // Step 8: Report Malfunction
    const step8 = { id: `s8_${ts}`, title: 'Report Malfunction', stepType: 'Step', components: [
        { id: `s8h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Report Malfunction', fontSize: 24, fontWeight: 'bold', color: '#0f172a' } },
        { id: `s8box_${ts}`, type: 'SHAPE', x: 240, y: 60, w: 480, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        
        { id: `s8dh_${ts}`, type: 'TEXT', x: 260, y: 80, w: 300, h: 30, props: { text: 'Selected Equipment', fontSize: 18, fontWeight: 'bold' } },
        { id: `s8di_${ts}`, type: 'TEXT', x: 260, y: 120, w: 150, h: 40, props: { text: 'ID\nTMS001', fontSize: 12, color: '#475569' } },
        { id: `s8dn_${ts}`, type: 'TEXT', x: 450, y: 120, w: 150, h: 40, props: { text: 'Name\nMettler Toledo', fontSize: 12, color: '#475569' } },
        { id: `s8ds_${ts}`, type: 'TEXT', x: 260, y: 170, w: 150, h: 40, props: { text: 'Status\nClean', fontSize: 12, color: '#475569' } },
        { id: `s8dt_${ts}`, type: 'TEXT', x: 450, y: 170, w: 150, h: 40, props: { text: 'Type\nScale', fontSize: 12, color: '#475569' } },
        
        { id: `s8i1_${ts}`, type: 'TEXT_INPUT', x: 260, y: 230, w: 440, h: 100, props: { label: 'Comment (Required)', targetVariable: 'Malfunction_Comment', multiline: true, fontSize: 13 } },
        
        { id: `s8btn_can_${ts}`, type: 'BUTTON', x: 260, y: 380, w: 150, h: 40, props: {
            label: '⊘ Cancel', text: '⊘ Cancel', backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Cancel', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }] }]
        }},
        { id: `s8btn_sav_${ts}`, type: 'BUTTON', x: 430, y: 380, w: 270, h: 40, props: {
            label: '+ Set out of order status', text: '+ Set out of order status', backgroundColor: '#dc2626', color: 'white', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Save', event: 'ON_CLICK', actions: [
                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_hist_${ts}` } },
                { type: 'SHOW_MESSAGE', payload: { message: 'Malfunction reported. Equipment is Out of Order.', msgType: 'error' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }
            ] }]
        }}
    ]};

    return {
        id: `app_eqm_${ts}`,
        name: 'Equipment Management',
        description: 'Create and update status, calibration data, set tare values, and record malfunction events.',
        category: 'Manufacturing',
        type: 'FRONT-LINE', published: true, approvalStatus: 'APPROVED',
        createdAt: iso, updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: [
                { id: `rp_asset_${ts}`, name: 'New_Asset', tableId: T.asset, description: 'New equipment record' },
                { id: `rp_hist_${ts}`, name: 'New_History_Log', tableId: T.history, description: 'New equipment history log' }
            ],
            appTables: [T.asset, T.history],
            appTriggers: [],
            steps: [step1, step2, step3, step4, step5, step6, step7, step8],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
