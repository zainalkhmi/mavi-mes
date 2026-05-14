/**
 * assyLineProductionTemplate.js
 * Simple 1-step input form for production result in assembly line.
 */

export function createAssyLineProductionTemplate() {
    const timestamp = Date.now();
    const currentIso = new Date().toISOString();

    return {
        id: `app_assy_line_${timestamp}`,
        name: 'HASIL PRODUKSY DI ASSY LINE',
        description: 'Form input 1-step untuk pencatatan hasil produksi di assembly line',
        category: 'Production',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: currentIso,
        updatedAt: currentIso,
        config: {
            appVariables: [
                { id: `var_shift_${timestamp}`, name: 'Shift', type: 'string', defaultValue: '', persisted: false },
                { id: `var_line_${timestamp}`, name: 'Line_Assy', type: 'string', defaultValue: '', persisted: false },
                { id: `var_wo_${timestamp}`, name: 'Work_Order', type: 'string', defaultValue: '', persisted: false },
                { id: `var_model_${timestamp}`, name: 'Model_Part_Number', type: 'string', defaultValue: '', persisted: false },
                { id: `var_plan_${timestamp}`, name: 'Qty_Plan', type: 'number', defaultValue: 0, persisted: false },
                { id: `var_actual_${timestamp}`, name: 'Qty_Actual', type: 'number', defaultValue: 0, persisted: false },
                { id: `var_ng_${timestamp}`, name: 'Qty_NG', type: 'number', defaultValue: 0, persisted: false },
                { id: `var_down_${timestamp}`, name: 'Downtime_Minutes', type: 'number', defaultValue: 0, persisted: false },
                { id: `var_status_${timestamp}`, name: 'Status_Produksi', type: 'string', defaultValue: 'RUNNING', persisted: false },
                { id: `var_notes_${timestamp}`, name: 'Catatan', type: 'string', defaultValue: '', persisted: false }
            ],
            recordPlaceholders: [
                {
                    id: `rp_assy_${timestamp}`,
                    name: 'Assy_Production_Record',
                    tableId: 'assy_production_placeholder',
                    description: 'Main table handle untuk form hasil produksi assy line'
                }
            ],
            appTables: ['assy_production_placeholder'],
            appTriggers: [],
            steps: [
                {
                    id: `step_assy_input_${timestamp}`,
                    title: 'Input Hasil Produksi',
                    stepType: 'Form Step',
                    cycleTimeSeconds: 120,
                    parentGroupId: null,
                    formSubmit: { buttonLabel: 'Submit', requireAll: false },
                    triggers: [],
                    components: [
                        {
                            id: `title_${timestamp}`,
                            type: 'TEXT',
                            x: 50, y: 40, w: 920, h: 50,
                            props: { text: 'FORM INPUT HASIL PRODUKSY DI ASSY LINE', fontSize: 28, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' }
                        },
                        {
                            id: `shift_${timestamp}`,
                            type: 'RADIO_GROUP',
                            x: 50, y: 110, w: 450, h: 90,
                            props: { label: 'Shift', options: ['1', '2', '3'], required: true, targetVariable: 'Shift' }
                        },
                        {
                            id: `status_${timestamp}`,
                            type: 'RADIO_GROUP',
                            x: 520, y: 110, w: 450, h: 90,
                            props: { label: 'Status Produksi', options: ['RUNNING', 'STOP', 'COMPLETE'], required: true, targetVariable: 'Status_Produksi' }
                        },
                        {
                            id: `line_${timestamp}`,
                            type: 'TEXT_INPUT',
                            x: 50, y: 220, w: 450, h: 80,
                            props: { label: 'Line Assy', placeholder: 'Contoh: ASSY-LINE-01', required: true, targetVariable: 'Line_Assy' }
                        },
                        {
                            id: `wo_${timestamp}`,
                            type: 'BARCODE',
                            x: 520, y: 220, w: 450, h: 80,
                            props: { placeholder: 'Scan / Input Work Order', autoFocus: false, targetVariable: 'Work_Order' }
                        },
                        {
                            id: `model_${timestamp}`,
                            type: 'TEXT_INPUT',
                            x: 50, y: 320, w: 920, h: 80,
                            props: { label: 'Model / Part Number', placeholder: 'Contoh: PN-ABC-001', required: true, targetVariable: 'Model_Part_Number' }
                        },
                        {
                            id: `plan_${timestamp}`,
                            type: 'NUMBER_INPUT',
                            x: 50, y: 420, w: 220, h: 80,
                            props: { label: 'Qty Plan', required: true, min: 0, targetVariable: 'Qty_Plan' }
                        },
                        {
                            id: `actual_${timestamp}`,
                            type: 'NUMBER_INPUT',
                            x: 290, y: 420, w: 220, h: 80,
                            props: { label: 'Qty Actual', required: true, min: 0, targetVariable: 'Qty_Actual' }
                        },
                        {
                            id: `ng_${timestamp}`,
                            type: 'NUMBER_INPUT',
                            x: 530, y: 420, w: 220, h: 80,
                            props: { label: 'Qty NG', required: true, min: 0, targetVariable: 'Qty_NG' }
                        },
                        {
                            id: `down_${timestamp}`,
                            type: 'NUMBER_INPUT',
                            x: 770, y: 420, w: 200, h: 80,
                            props: { label: 'Downtime (menit)', required: true, min: 0, targetVariable: 'Downtime_Minutes' }
                        },
                        {
                            id: `notes_${timestamp}`,
                            type: 'TEXT_AREA',
                            x: 50, y: 520, w: 920, h: 110,
                            props: { label: 'Catatan', placeholder: 'Isi catatan tambahan jika ada...', targetVariable: 'Catatan' }
                        },
                        {
                            id: `submit_${timestamp}`,
                            type: 'BUTTON',
                            x: 50, y: 650, w: 920, h: 70,
                            props: {
                                label: 'SUBMIT HASIL PRODUKSI',
                                text: 'SUBMIT HASIL PRODUKSI',
                                backgroundColor: '#10b981',
                                color: 'white',
                                fontSize: 18,
                                fontWeight: 'bold',
                                triggers: [
                                    {
                                        name: 'Submit Assy Production Record',
                                        event: 'ON_CLICK',
                                        actions: [
                                            {
                                                type: 'CREATE_RECORD',
                                                payload: {
                                                    tableId: 'assy_production_placeholder',
                                                    mappings: {
                                                        Shift: { type: 'VARIABLE', value: 'Shift' },
                                                        Line_Assy: { type: 'VARIABLE', value: 'Line_Assy' },
                                                        Work_Order: { type: 'VARIABLE', value: 'Work_Order' },
                                                        Model_Part_Number: { type: 'VARIABLE', value: 'Model_Part_Number' },
                                                        Qty_Plan: { type: 'VARIABLE', value: 'Qty_Plan' },
                                                        Qty_Actual: { type: 'VARIABLE', value: 'Qty_Actual' },
                                                        Qty_NG: { type: 'VARIABLE', value: 'Qty_NG' },
                                                        Downtime_Minutes: { type: 'VARIABLE', value: 'Downtime_Minutes' },
                                                        Status_Produksi: { type: 'VARIABLE', value: 'Status_Produksi' },
                                                        Catatan: { type: 'VARIABLE', value: 'Catatan' },
                                                        Operator: { type: 'VARIABLE', value: 'APP_INFO.USER' },
                                                        Timestamp: { type: 'EXPRESSION', value: 'NOW()' }
                                                    }
                                                }
                                            },
                                            { type: 'SHOW_MESSAGE', payload: { message: 'Data hasil produksi berhasil disimpan', msgType: 'success' } },
                                            { type: 'COMPLETE_APP' }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        }
    };
}
