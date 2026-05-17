/**
 * weighDispenseTemplate.js
 * Generates a Weigh and Dispense application for MAVI-MES
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
                    x: 0, y: 10, w: 460, h: 30,
                    props: { text: 'Selected Material', fontSize: 16, fontWeight: 'bold', color: '#334155' }
                },
                // Product & Quantity row
                {
                    id: `s${sn}_prod_lbl_${ts}`, type: 'TEXT',
                    x: 0, y: 50, w: 100, h: 18,
                    props: { text: 'PRODUCT', fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_prod_val_${ts}`, type: 'TEXT',
                    x: 0, y: 68, w: 200, h: 28,
                    props: { text: mat.name, fontSize: 20, fontWeight: 'bold', color: '#0f172a' }
                },
                {
                    id: `s${sn}_qty_lbl_${ts}`, type: 'TEXT',
                    x: 220, y: 50, w: 100, h: 18,
                    props: { text: 'QUANTITY', fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_qty_val_${ts}`, type: 'TEXT',
                    x: 220, y: 68, w: 200, h: 28,
                    props: { text: mat.qty, fontSize: 20, fontWeight: 'bold', color: '#0f172a' }
                },
                // MFG Date & Line row
                {
                    id: `s${sn}_date_lbl_${ts}`, type: 'TEXT',
                    x: 0, y: 108, w: 100, h: 18,
                    props: { text: 'MFG DATE', fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_date_val_${ts}`, type: 'TEXT',
                    x: 0, y: 126, w: 200, h: 24,
                    props: { text: new Date().toLocaleDateString(), fontSize: 16, fontWeight: 'bold', color: '#0f172a' }
                },
                {
                    id: `s${sn}_line_lbl_${ts}`, type: 'TEXT',
                    x: 220, y: 108, w: 100, h: 18,
                    props: { text: 'LINE', fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_line_val_${ts}`, type: 'TEXT',
                    x: 220, y: 126, w: 200, h: 24,
                    props: { text: mat.line, fontSize: 16, fontWeight: 'bold', color: '#0f172a' }
                },
                // ── Left Panel: Instruction ──
                {
                    id: `s${sn}_instr_hdr_${ts}`, type: 'TEXT',
                    x: 0, y: 170, w: 460, h: 28,
                    props: { text: 'Instruction', fontSize: 16, fontWeight: 'bold', color: '#334155' }
                },
                {
                    id: `s${sn}_stage_lbl_${ts}`, type: 'TEXT',
                    x: 0, y: 200, w: 130, h: 16,
                    props: { text: 'CURRENT STAGE', fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_stage_val_${ts}`, type: 'TEXT',
                    x: 0, y: 216, w: 130, h: 22,
                    props: { text: `Dose ${idx + 1}`, fontSize: 14, fontWeight: 'bold', color: '#0f172a' }
                },
                {
                    id: `s${sn}_proc_lbl_${ts}`, type: 'TEXT',
                    x: 150, y: 200, w: 130, h: 16,
                    props: { text: 'CURRENT PROCEDURE', fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_proc_val_${ts}`, type: 'TEXT',
                    x: 150, y: 216, w: 130, h: 22,
                    props: { text: mat.procedure, fontSize: 14, fontWeight: 'bold', color: '#0f172a' }
                },
                {
                    id: `s${sn}_task_lbl_${ts}`, type: 'TEXT',
                    x: 310, y: 200, w: 150, h: 16,
                    props: { text: 'CURRENT TASK', fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_task_val_${ts}`, type: 'TEXT',
                    x: 310, y: 216, w: 150, h: 22,
                    props: { text: 'Weigh and Dispense', fontSize: 14, fontWeight: 'bold', color: '#0f172a' }
                },
                // Task Instructions
                {
                    id: `s${sn}_task_title_${ts}`, type: 'TEXT',
                    x: 0, y: 250, w: 460, h: 20,
                    props: { text: 'TASK INSTRUCTIONS', fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
                },
                {
                    id: `s${sn}_instr1_${ts}`, type: 'TEXT',
                    x: 0, y: 275, w: 460, h: 20,
                    props: { text: '1. Scan the ingredient bar code', fontSize: 13, color: '#334155' }
                },
                {
                    id: `s${sn}_instr2_${ts}`, type: 'TEXT',
                    x: 0, y: 298, w: 460, h: 20,
                    props: { text: '2. Transfer ingredient to bowl on the scale', fontSize: 13, color: '#334155' }
                },
                {
                    id: `s${sn}_instr3_${ts}`, type: 'TEXT',
                    x: 0, y: 321, w: 460, h: 20,
                    props: { text: '3. Click "Record" to capture weight', fontSize: 13, color: '#334155' }
                },

                // ── Right Panel: Material Dispense ──
                {
                    id: `s${sn}_disp_hdr_${ts}`, type: 'TEXT',
                    x: 500, y: 10, w: 440, h: 30,
                    props: { text: 'Material Dispense', fontSize: 16, fontWeight: 'bold', color: '#334155' }
                },
                // Material image
                {
                    id: `s${sn}_img_${ts}`, type: 'IMAGE',
                    x: 500, y: 50, w: 440, h: 180,
                    props: { src: mat.image, alt: mat.name, borderRadius: '8px', objectFit: 'cover' }
                },
                // Barcode scan
                {
                    id: `s${sn}_bc_lbl_${ts}`, type: 'TEXT',
                    x: 500, y: 240, w: 440, h: 20,
                    props: { text: 'Scan or enter the material barcode', fontSize: 12, color: '#64748b' }
                },
                {
                    id: `s${sn}_bc_input_${ts}`, type: 'BARCODE',
                    x: 500, y: 264, w: 440, h: 50,
                    props: { placeholder: 'WD-PW261...', autoFocus: false, targetVariable: barcodeVar }
                },
                // Dispense amount
                {
                    id: `s${sn}_amt_lbl_${ts}`, type: 'TEXT',
                    x: 500, y: 328, w: 440, h: 20,
                    props: { text: 'Enter amount to dispense:', fontSize: 12, color: '#64748b' }
                },
                {
                    id: `s${sn}_amt_input_${ts}`, type: 'TEXT_INPUT',
                    x: 500, y: 352, w: 340, h: 55,
                    props: {
                        label: '', placeholder: '0.00',
                        targetVariable: weightVar, inputType: 'number',
                        fontSize: 24, fontWeight: 'bold'
                    }
                },
                {
                    id: `s${sn}_unit_${ts}`, type: 'TEXT',
                    x: 850, y: 362, w: 60, h: 30,
                    props: { text: 'kg', fontSize: 18, fontWeight: 'bold', color: '#64748b' }
                },
                // Get From Scale button
                {
                    id: `s${sn}_scale_btn_${ts}`, type: 'BUTTON',
                    x: 500, y: 425, w: 200, h: 45,
                    props: {
                        label: 'Get From Scale', text: 'Get From Scale',
                        backgroundColor: '#f1f5f9', color: '#334155', fontSize: 14, fontWeight: 'bold',
                        borderColor: '#cbd5e1',
                        triggers: [{
                            name: 'Read Scale',
                            event: 'ON_CLICK',
                            actions: [
                                { type: 'SHOW_MESSAGE', payload: { message: '📡 Reading scale... (Simulated: 60.02 kg)', msgType: 'info' } },
                                { type: 'SET_VARIABLE', payload: { variable: weightVar, value: 60.02 } }
                            ]
                        }]
                    }
                },
                // Done button
                {
                    id: `s${sn}_done_btn_${ts}`, type: 'BUTTON',
                    x: 720, y: 425, w: 200, h: 45,
                    props: {
                        label: 'Done ✓', text: 'Done ✓',
                        backgroundColor: '#16a34a', color: 'white', fontSize: 16, fontWeight: 'bold',
                        triggers: [{
                            name: `Record ${mat.name}`,
                            event: 'ON_CLICK',
                            actions: [
                                {
                                    type: 'SHOW_MESSAGE',
                                    payload: { message: `⚠️ WARNING: No barcode scanned for ${mat.name}!`, msgType: 'error', showIf: `!@${barcodeVar} || @${barcodeVar} === ''` }
                                },
                                {
                                    type: 'SHOW_MESSAGE',
                                    payload: { message: `⚠️ WARNING: Weight is zero for ${mat.name}!`, msgType: 'error', showIf: `Number(@${weightVar}) <= 0` }
                                },
                                {
                                    type: 'SHOW_MESSAGE',
                                    payload: { message: `✅ ${mat.name}: ${mat.qty} dispensed and recorded`, msgType: 'success' }
                                },
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
        name: 'Weigh and Dispense',
        description: 'Pharmaceutical-grade weighing and dispensing workflow with barcode verification, scale integration, and batch tracking',
        category: 'Manufacturing',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
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
