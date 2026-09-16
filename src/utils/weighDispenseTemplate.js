/**
 * weighDispenseTemplate.js
 * Generates a Weigh and Dispense application for MANDOR-MES
 * Modeled after Tulip's pharma weighing UI:
 *  - Left panel: Selected Material info + Instruction panel
 *  - Right panel: Material Dispense with barcode scan, weight input, scale button
 *  - Bottom: Previous / Done navigation
 */

export function createWeighDispenseTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    // Materials to dispense in this batch
    const materials = [
        { id: 'mat_plain_white', name: 'Plain White', qty: '50 lbs', line: 'Line 2', procedure: 'Hand Add', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=400' },
        { id: 'mat_calcium_ite', name: 'CalciumIte', qty: '25 lbs', line: 'Line 2', procedure: 'Scoop Add', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=400' },
        { id: 'mat_titanium_ox', name: 'Titanium Oxide', qty: '10 lbs', line: 'Line 1', procedure: 'Hand Add', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=400' }
    ];

    const appVariables = [
        { id: `var_batch_${ts}`, name: 'Batch_Number', type: 'string', defaultValue: '', persisted: true },
        { id: `var_version_${ts}`, name: 'Batch_Version', type: 'string', defaultValue: '1', persisted: false },
        { id: `var_operator_${ts}`, name: 'Operator_Name', type: 'string', defaultValue: '@APP_INFO.USER', persisted: true },
        { id: `var_station_${ts}`, name: 'Station_ID', type: 'string', defaultValue: '@APP_INFO.STATION', persisted: false },
        { id: `var_barcode_${ts}`, name: 'Material_Barcode', type: 'string', defaultValue: '', persisted: false },
        { id: `var_dispense_amt_${ts}`, name: 'Dispense_Amount', type: 'number', defaultValue: 0, persisted: false },
        { id: `var_tare_${ts}`, name: 'Tare_Weight', type: 'number', defaultValue: 0, persisted: false },
        { id: `var_net_${ts}`, name: 'Net_Weight', type: 'number', defaultValue: 0, persisted: false },
        { id: `var_unit_${ts}`, name: 'Weight_Unit', type: 'string', defaultValue: 'kg', persisted: false },
        { id: `var_total_dispensed_${ts}`, name: 'Total_Dispensed', type: 'number', defaultValue: 0, persisted: true },
        { id: `var_dispense_status_${ts}`, name: 'Dispense_Status', type: 'string', defaultValue: 'PENDING', persisted: true },
        { id: `var_timestamp_${ts}`, name: 'Timestamp', type: 'string', defaultValue: '', persisted: false },
        ...materials.map((m, i) => ({
            id: `var_mat_wt_${i}_${ts}`, name: `Weight_${m.id}`, type: 'number', defaultValue: 0, persisted: true
        })),
        ...materials.map((m, i) => ({
            id: `var_mat_bc_${i}_${ts}`, name: `Barcode_${m.id}`, type: 'string', defaultValue: '', persisted: false
        }))
    ];

    // ─── Step 1: Batch Identification ────────────────────────────────────
    const step1 = {
        id: `step_batch_${ts}`,
        title: '1. Batch Identification',
        stepType: 'Step',
        components: [
            {
                id: `s1_hdr_${ts}`, type: 'TEXT',
                x: 50, y: 20, w: 900, h: 50,
                props: { text: '⚖️ Weigh and Dispense', fontSize: 28, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' }
            },
            {
                id: `s1_sub_${ts}`, type: 'TEXT',
                x: 50, y: 70, w: 900, h: 30,
                props: { text: 'Enter batch information to begin dispensing process', fontSize: 14, color: '#64748b', textAlign: 'center' }
            },
            {
                id: `s1_batch_${ts}`, type: 'TEXT_INPUT',
                x: 200, y: 130, w: 600, h: 50,
                props: { label: 'Batch Number', placeholder: 'Enter batch number (e.g. B-0831-89)', targetVariable: 'Batch_Number', required: true }
            },
            {
                id: `s1_ver_${ts}`, type: 'TEXT_INPUT',
                x: 200, y: 210, w: 600, h: 50,
                props: { label: 'Version', placeholder: '1', targetVariable: 'Batch_Version' }
            },
            {
                id: `s1_op_${ts}`, type: 'TEXT_INPUT',
                x: 200, y: 290, w: 600, h: 50,
                props: { label: 'Operator Name', placeholder: 'Scan badge or enter name...', targetVariable: 'Operator_Name', required: true }
            },
            {
                id: `s1_btn_${ts}`, type: 'BUTTON',
                x: 200, y: 400, w: 600, h: 60,
                props: {
                    label: 'START DISPENSING ▶', text: 'START DISPENSING ▶',
                    backgroundColor: '#2563eb', color: 'white', fontSize: 18, fontWeight: 'bold',
                    triggers: [{ name: 'Begin Dispense', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };

    // ─── Steps 2-4: Material Dispense Steps ──────────────────────────────
    const dispenseSteps = materials.map((mat, idx) => {
        const sn = idx + 2;
        const barcodeVar = `Barcode_${mat.id}`;
        const weightVar = `Weight_${mat.id}`;

        return {
            id: `step_disp_${idx}_${ts}`,
            title: `${sn}. Dose ${idx + 1} – ${mat.name}`,
            stepType: 'Step',
            components: [
                // ── Left Panel: Selected Material ──
                {
                    id: `s${sn}_sel_hdr_${ts}`, type: 'TEXT',
                    x: 20, y: 15, w: 460, h: 28,
                    props: { text: 'Selected Material', fontSize: 16, fontWeight: 'bold', color: '#1e293b' }
                },
                // Product & Quantity row
                {
                    id: `s${sn}_prod_lbl_${ts}`, type: 'TEXT',
                    x: 20, y: 55, w: 140, h: 16,
                    props: { text: 'PRODUCT', fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_prod_val_${ts}`, type: 'TEXT',
                    x: 20, y: 73, w: 160, h: 32,
                    props: { text: mat.name, fontSize: 22, fontWeight: 'bold', color: '#0f172a' }
                },
                {
                    id: `s${sn}_qty_lbl_${ts}`, type: 'TEXT',
                    x: 190, y: 55, w: 140, h: 16,
                    props: { text: 'QUANTITY', fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_qty_val_${ts}`, type: 'TEXT',
                    x: 190, y: 73, w: 160, h: 32,
                    props: { text: mat.qty, fontSize: 22, fontWeight: 'bold', color: '#0f172a' }
                },
                // DUE DATE & Line row
                {
                    id: `s${sn}_date_lbl_${ts}`, type: 'TEXT',
                    x: 20, y: 120, w: 140, h: 16,
                    props: { text: 'DUE  DATE', fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_date_val_${ts}`, type: 'TEXT',
                    x: 20, y: 138, w: 160, h: 28,
                    props: { text: '8/20/21', fontSize: 20, fontWeight: 'bold', color: '#0f172a' }
                },
                {
                    id: `s${sn}_line_lbl_${ts}`, type: 'TEXT',
                    x: 190, y: 120, w: 140, h: 16,
                    props: { text: 'LINE', fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_line_val_${ts}`, type: 'TEXT',
                    x: 190, y: 138, w: 160, h: 28,
                    props: { text: mat.line, fontSize: 20, fontWeight: 'bold', color: '#0f172a' }
                },
                // Powder Mound Image on Right of Left Panel
                {
                    id: `s${sn}_powder_img_${ts}`, type: 'IMAGE',
                    x: 350, y: 35, w: 210, h: 145,
                    props: { 
                        src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=400', 
                        alt: 'Material Powder', 
                        objectFit: 'contain' 
                    }
                },
                // Divider Line
                {
                    id: `s${sn}_div_${ts}`, type: 'BOX',
                    x: 20, y: 195, w: 540, h: 2,
                    props: { backgroundColor: '#cbd5e1', border: 'none' }
                },

                // ── Left Panel: Instruction ──
                {
                    id: `s${sn}_instr_hdr_${ts}`, type: 'TEXT',
                    x: 20, y: 215, w: 460, h: 26,
                    props: { text: 'Instruction', fontSize: 16, fontWeight: 'bold', color: '#1e293b' }
                },
                {
                    id: `s${sn}_stage_lbl_${ts}`, type: 'TEXT',
                    x: 20, y: 248, w: 150, h: 16,
                    props: { text: 'CURRENT  STAGE', fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_stage_val_${ts}`, type: 'TEXT',
                    x: 20, y: 264, w: 150, h: 22,
                    props: { text: `Dose ${idx === 0 ? 'One' : idx === 1 ? 'Two' : 'Three'}`, fontSize: 15, fontWeight: 'bold', color: '#0f172a' }
                },
                {
                    id: `s${sn}_proc_lbl_${ts}`, type: 'TEXT',
                    x: 190, y: 248, w: 160, h: 16,
                    props: { text: 'CURRENT  PROCEDURE', fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_proc_val_${ts}`, type: 'TEXT',
                    x: 190, y: 264, w: 160, h: 22,
                    props: { text: mat.procedure, fontSize: 15, fontWeight: 'bold', color: '#0f172a' }
                },
                {
                    id: `s${sn}_task_lbl_${ts}`, type: 'TEXT',
                    x: 370, y: 248, w: 180, h: 16,
                    props: { text: 'CURRENT  TASK', fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_task_val_${ts}`, type: 'TEXT',
                    x: 370, y: 264, w: 180, h: 22,
                    props: { text: 'Weigh and Dispense', fontSize: 15, fontWeight: 'bold', color: '#0f172a' }
                },
                // Task Instructions
                {
                    id: `s${sn}_task_title_${ts}`, type: 'TEXT',
                    x: 20, y: 305, w: 460, h: 18,
                    props: { text: 'TASK  INSTRUCTIONS', fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_instr1_${ts}`, type: 'TEXT',
                    x: 20, y: 330, w: 520, h: 20,
                    props: { text: '1. Scan the ingredient bar code', fontSize: 13, color: '#334155', fontWeight: 600 }
                },
                {
                    id: `s${sn}_instr2_${ts}`, type: 'TEXT',
                    x: 20, y: 355, w: 520, h: 20,
                    props: { text: '2. Transfer ingredient to bowl on the scale', fontSize: 13, color: '#334155', fontWeight: 600 }
                },
                {
                    id: `s${sn}_instr3_${ts}`, type: 'TEXT',
                    x: 20, y: 380, w: 520, h: 20,
                    props: { text: '3. Click "Record" to capture weight', fontSize: 13, color: '#334155', fontWeight: 600 }
                },

                // ── Right Panel: Scale Dispense Bench ──
                // Top: Cleanroom Operator on Bench Scale Image
                {
                    id: `s${sn}_cleanroom_img_${ts}`, type: 'IMAGE',
                    x: 580, y: 0, w: 380, h: 175,
                    props: { 
                        src: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=600', 
                        alt: 'Cleanroom Scale Dispense', 
                        objectFit: 'cover' 
                    }
                },
                {
                    id: `s${sn}_disp_hdr_${ts}`, type: 'TEXT',
                    x: 580, y: 190, w: 380, h: 26,
                    props: { text: 'Material Dispense', fontSize: 16, fontWeight: 'bold', color: '#1e293b' }
                },
                // Barcode Scan
                {
                    id: `s${sn}_bc_lbl_${ts}`, type: 'TEXT',
                    x: 580, y: 220, w: 380, h: 18,
                    props: { text: 'Scan or enter the material barcode:', fontSize: 13, color: '#334155', fontWeight: 600 }
                },
                {
                    id: `s${sn}_bc_input_${ts}`, type: 'TEXT_INPUT',
                    x: 580, y: 242, w: 380, h: 42,
                    props: { 
                        placeholder: 'WO-PW2X1', 
                        value: 'WO-PW2X1',
                        targetVariable: barcodeVar,
                        fontSize: 14,
                        fontWeight: 600
                    }
                },
                // Amount to dispense
                {
                    id: `s${sn}_amt_lbl_${ts}`, type: 'TEXT',
                    x: 580, y: 295, w: 380, h: 18,
                    props: { text: 'Enter amount to dispense:', fontSize: 13, color: '#334155', fontWeight: 600 }
                },
                // Progress Bar (70% Green fill)
                {
                    id: `s${sn}_prog_${ts}`, type: 'PROGRESS_BAR',
                    x: 580, y: 318, w: 380, h: 18,
                    props: { value: 70, max: 100, color: '#10b981', backgroundColor: '#f1f5f9' }
                },
                // Weight input with kg unit
                {
                    id: `s${sn}_amt_input_${ts}`, type: 'TEXT_INPUT',
                    x: 580, y: 344, w: 380, h: 44,
                    props: {
                        label: '', 
                        placeholder: '50.5', 
                        value: '50.5',
                        targetVariable: weightVar, 
                        inputType: 'number',
                        fontSize: 18, 
                        fontWeight: 'bold',
                        unit: 'kg'
                    }
                },
                // Minus and Plus stepper buttons
                {
                    id: `s${sn}_minus_btn_${ts}`, type: 'BUTTON',
                    x: 580, y: 396, w: 185, h: 36,
                    props: {
                        label: '−', text: '−',
                        backgroundColor: '#475569', color: 'white', fontSize: 18, fontWeight: 'bold'
                    }
                },
                {
                    id: `s${sn}_plus_btn_${ts}`, type: 'BUTTON',
                    x: 775, y: 396, w: 185, h: 36,
                    props: {
                        label: '+', text: '+',
                        backgroundColor: '#475569', color: 'white', fontSize: 18, fontWeight: 'bold'
                    }
                },
                // Action Buttons: Get From Scale and Done
                {
                    id: `s${sn}_scale_btn_${ts}`, type: 'BUTTON',
                    x: 580, y: 448, w: 185, h: 48,
                    props: {
                        label: 'Get From Scale', text: 'Get From Scale',
                        backgroundColor: '#5b6b82', color: 'white', fontSize: 14, fontWeight: 'bold',
                        triggers: [{
                            name: 'Read Scale',
                            event: 'ON_CLICK',
                            actions: [
                                { type: 'SHOW_MESSAGE', payload: { message: '📡 Reading scale... (Simulated: 50.5 kg)', msgType: 'info' } },
                                { type: 'SET_VARIABLE', payload: { variable: weightVar, value: 50.5 } }
                            ]
                        }]
                    }
                },
                {
                    id: `s${sn}_done_btn_${ts}`, type: 'BUTTON',
                    x: 775, y: 448, w: 185, h: 48,
                    props: {
                        label: 'Done', text: 'Done',
                        backgroundColor: '#10b981', color: 'white', fontSize: 15, fontWeight: 'bold',
                        triggers: [{
                            name: `Record ${mat.name}`,
                            event: 'ON_CLICK',
                            actions: [
                                { type: 'SHOW_MESSAGE', payload: { message: `✅ ${mat.name}: 50.5 kg dispensed`, msgType: 'success' } },
                                { type: 'NEXT_STEP' }
                            ]
                        }]
                    }
                }
            ]
        };
    });

    // ─── Final Review Step ────────────────────────────────────────────────
    const reviewStep = {
        id: `step_review_${ts}`,
        title: `${materials.length + 2}. Review & Complete`,
        stepType: 'Step',
        components: [
            {
                id: `sr_hdr_${ts}`, type: 'TEXT',
                x: 50, y: 20, w: 900, h: 45,
                props: { text: '📋 Dispense Summary', fontSize: 26, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' }
            },
            {
                id: `sr_batch_${ts}`, type: 'TEXT_INPUT',
                x: 50, y: 80, w: 400, h: 50,
                props: { label: 'Batch Number', targetVariable: 'Batch_Number', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Batch_Number' }
            },
            {
                id: `sr_op_${ts}`, type: 'TEXT_INPUT',
                x: 500, y: 80, w: 400, h: 50,
                props: { label: 'Operator', targetVariable: 'Operator_Name', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Operator_Name' }
            },
            {
                id: `sr_weights_title_${ts}`, type: 'TEXT',
                x: 50, y: 155, w: 900, h: 25,
                props: { text: '⚖️ Dispensed Weights', fontSize: 16, fontWeight: 'bold', color: '#1e40af' }
            },
            ...materials.map((mat, i) => ({
                id: `sr_wt_${i}_${ts}`, type: 'TEXT_INPUT',
                x: 50 + (i % 3) * 300, y: 195 + Math.floor(i / 3) * 70, w: 280, h: 50,
                props: {
                    label: `${mat.name} (kg)`,
                    targetVariable: `Weight_${mat.id}`, readOnly: true,
                    dataSourceType: 'VARIABLE', varSource: `Weight_${mat.id}`
                }
            })),
            ...materials.map((mat, i) => ({
                id: `sr_bc_${i}_${ts}`, type: 'TEXT_INPUT',
                x: 50 + (i % 3) * 300, y: 255 + Math.floor(i / 3) * 70, w: 280, h: 40,
                props: {
                    label: `${mat.name} Barcode`,
                    targetVariable: `Barcode_${mat.id}`, readOnly: true,
                    dataSourceType: 'VARIABLE', varSource: `Barcode_${mat.id}`
                }
            })),
            {
                id: `sr_status_${ts}`, type: 'RADIO_GROUP',
                x: 50, y: 400, w: 900, h: 70,
                props: {
                    label: 'Dispense Status',
                    options: ['COMPLETE', 'PARTIAL', 'REJECTED'],
                    required: true,
                    targetVariable: 'Dispense_Status'
                }
            },
            {
                id: `sr_notes_${ts}`, type: 'TEXT_AREA',
                x: 50, y: 490, w: 900, h: 70,
                props: { label: 'Notes (Optional)', placeholder: 'Any observations...', targetVariable: 'Dispense_Notes' }
            },
            {
                id: `sr_submit_${ts}`, type: 'BUTTON',
                x: 200, y: 590, w: 600, h: 65,
                props: {
                    label: '✅ COMPLETE DISPENSING', text: '✅ COMPLETE DISPENSING',
                    backgroundColor: '#16a34a', color: 'white', fontSize: 20, fontWeight: 'bold',
                    triggers: [{
                        name: 'Submit Dispense Record',
                        event: 'ON_CLICK',
                        actions: [
                            { type: 'SET_VARIABLE', payload: { variable: 'Timestamp', valueType: 'EXPRESSION', value: 'new Date().toISOString()' } },
                            { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_wd_${ts}` } },
                            { type: 'SHOW_MESSAGE', payload: { message: 'Weigh & Dispense completed and saved! ✓', msgType: 'success' } },
                            { type: 'COMPLETE_APP' }
                        ]
                    }]
                }
            }
        ]
    };

    return {
        id: `app_wd_${ts}`,
        name: 'Demo Weigh and Dispense',
        description: 'Pharmaceutical-grade weighing and dispensing workflow with barcode verification, scale integration, and batch tracking',
        category: 'Manufacturing',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            batchNumber: 'C-0001-95',
            versionLabel: 'Development Version',
            appVariables,
            recordPlaceholders: [{
                id: `rp_wd_${ts}`,
                name: 'WD_Record',
                tableId: 'wd_dispense_logs',
                description: 'Weigh and dispense batch record'
            }],
            appTables: ['wd_dispense_logs'],
            appTriggers: [{
                id: `trig_start_wd_${ts}`,
                name: 'WD Module Start',
                event: 'ON_APP_START',
                actions: [{ type: 'SHOW_MESSAGE', payload: { message: '⚖️ Weigh & Dispense Module Ready', msgType: 'info' } }]
            }],
            steps: [step1, ...dispenseSteps, reviewStep]
        }
    };
}
