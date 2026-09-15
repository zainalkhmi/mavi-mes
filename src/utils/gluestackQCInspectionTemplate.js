/**
 * GlueStack QC Inspection Template
 * Mobile quality control inspection form with visual check, measurements, and pass/fail
 * Builder Type: gluestack
 */
export function createGluestackQCInspectionTemplate() {
    return {
        id: 'gluestack_qc_' + Date.now(),
        name: 'GlueStack — QC Inspection Form',
        description: 'Formulir inspeksi QC mobile dengan input pengukuran, toleransi otomatis, foto bukti, dan tanda tangan digital. GlueStack App.',
        builder_type: 'gluestack',
        category: 'GlueStack App',
        config: {
            screens: [
                {
                    id: 'screen_wo_select',
                    title: 'Pilih Work Order',
                    components: [
                        {
                            id: 'qc_title',
                            type: 'Text',
                            props: { text: '🔍 QC Inspection', size: 'xl', bold: true }
                        },
                        {
                            id: 'qc_subtitle',
                            type: 'Text',
                            props: { text: 'Identifikasi Part & Work Order', size: 'sm', color: '#64748b' }
                        },
                        {
                            id: 'qc_wo_input',
                            type: 'Input',
                            props: { label: 'Work Order No', placeholder: 'WO-2026-001', variableId: 'v_wo' }
                        },
                        {
                            id: 'qc_part_input',
                            type: 'Input',
                            props: { label: 'Part Number', placeholder: 'HC-2024-001', variableId: 'v_part' }
                        },
                        {
                            id: 'qc_serial_input',
                            type: 'Input',
                            props: { label: 'Serial Number', placeholder: 'SN-20260915-001', variableId: 'v_serial' }
                        },
                        {
                            id: 'qc_shift_select',
                            type: 'Select',
                            props: {
                                label: 'Shift Kerja',
                                options: ['Shift 1 (Pagi)', 'Shift 2 (Siang)', 'Shift 3 (Malam)'],
                                variableId: 'v_shift'
                            }
                        },
                        {
                            id: 'qc_inspector_input',
                            type: 'Input',
                            props: { label: 'Nama Inspector', placeholder: 'Ahmad Fauzi', variableId: 'v_inspector' }
                        },
                        {
                            id: 'qc_next_btn',
                            type: 'Button',
                            props: { text: 'Mulai Inspeksi ➔', variant: 'primary', action: 'NEXT_SCREEN', size: 'lg' }
                        }
                    ],
                    triggers: []
                },
                {
                    id: 'screen_visual',
                    title: 'Pemeriksaan Visual',
                    components: [
                        {
                            id: 'vis_title',
                            type: 'Text',
                            props: { text: '👁️ Pemeriksaan Visual', size: 'lg', bold: true }
                        },
                        {
                            id: 'vis_alert',
                            type: 'Alert',
                            props: { text: 'Periksa setiap item di bawah ini secara visual sebelum melanjutkan ke pengukuran dimensi.', action: 'info' }
                        },
                        {
                            id: 'vis_surface',
                            type: 'Checkbox',
                            props: { label: 'Permukaan part bersih & bebas goresan', checked: false }
                        },
                        {
                            id: 'vis_burr',
                            type: 'Checkbox',
                            props: { label: 'Tidak ada burr atau sisa machining', checked: false }
                        },
                        {
                            id: 'vis_coating',
                            type: 'Checkbox',
                            props: { label: 'Coating / plating merata', checked: false }
                        },
                        {
                            id: 'vis_crack',
                            type: 'Checkbox',
                            props: { label: 'Tidak ada crack / retak visual', checked: false }
                        },
                        {
                            id: 'vis_marking',
                            type: 'Checkbox',
                            props: { label: 'Part marking / label sesuai spesifikasi', checked: false }
                        },
                        {
                            id: 'vis_notes',
                            type: 'Textarea',
                            props: { label: 'Catatan Visual', placeholder: 'Tuliskan temuan jika ada...' }
                        },
                        {
                            id: 'vis_next_btn',
                            type: 'Button',
                            props: { text: 'Lanjut ke Pengukuran ➔', variant: 'primary', action: 'NEXT_SCREEN' }
                        }
                    ],
                    triggers: []
                },
                {
                    id: 'screen_measurement',
                    title: 'Pengukuran Dimensi',
                    components: [
                        {
                            id: 'meas_title',
                            type: 'Text',
                            props: { text: '📏 Pengukuran Dimensi', size: 'lg', bold: true }
                        },
                        {
                            id: 'meas_bore',
                            type: 'NumberInput',
                            props: {
                                label: 'Bore Diameter (mm)',
                                min: 79.5,
                                max: 80.5,
                                step: 0.001,
                                nominal: 80.0,
                                unit: 'mm',
                                variableId: 'v_bore'
                            }
                        },
                        {
                            id: 'meas_rod',
                            type: 'NumberInput',
                            props: {
                                label: 'Rod Diameter (mm)',
                                min: 55.5,
                                max: 56.5,
                                step: 0.001,
                                nominal: 56.0,
                                unit: 'mm',
                                variableId: 'v_rod'
                            }
                        },
                        {
                            id: 'meas_stroke',
                            type: 'NumberInput',
                            props: {
                                label: 'Stroke Length (mm)',
                                min: 499.0,
                                max: 501.0,
                                step: 0.1,
                                nominal: 500.0,
                                unit: 'mm',
                                variableId: 'v_stroke'
                            }
                        },
                        {
                            id: 'meas_pressure',
                            type: 'NumberInput',
                            props: {
                                label: 'Proof Pressure (bar)',
                                min: 240,
                                max: 300,
                                step: 0.5,
                                nominal: 250,
                                unit: 'bar',
                                variableId: 'v_pressure'
                            }
                        },
                        {
                            id: 'meas_tolerance_check',
                            type: 'Switch',
                            props: { label: 'Semua dimensi dalam toleransi', value: false }
                        },
                        {
                            id: 'meas_next_btn',
                            type: 'Button',
                            props: { text: 'Lanjut ke Summary ➔', variant: 'primary', action: 'NEXT_SCREEN' }
                        }
                    ],
                    triggers: []
                },
                {
                    id: 'screen_summary',
                    title: 'Summary & Tanda Tangan',
                    components: [
                        {
                            id: 'sum_title',
                            type: 'Text',
                            props: { text: '✅ Summary Inspeksi', size: 'lg', bold: true }
                        },
                        {
                            id: 'sum_result',
                            type: 'Badge',
                            props: { text: 'PASS — Sesuai Spesifikasi', action: 'success' }
                        },
                        {
                            id: 'sum_card',
                            type: 'Card',
                            props: {
                                title: 'Ringkasan Hasil',
                                content: '• Visual Check: 5/5 OK\n• Bore Diameter: Dalam toleransi\n• Rod Diameter: Dalam toleransi\n• Stroke Length: Dalam toleransi\n• Proof Pressure: Dalam toleransi'
                            }
                        },
                        {
                            id: 'sum_overall_select',
                            type: 'Select',
                            props: {
                                label: 'Keputusan Akhir',
                                options: ['PASS — Sesuai Spesifikasi', 'FAIL — Tidak Sesuai', 'CONDITIONAL — Perlu Review MRB'],
                                variableId: 'v_decision'
                            }
                        },
                        {
                            id: 'sum_notes',
                            type: 'Textarea',
                            props: { label: 'Catatan Akhir Inspector', placeholder: 'Catatan tambahan...' }
                        },
                        {
                            id: 'sum_signature',
                            type: 'Signature',
                            props: { label: 'Tanda Tangan Inspector', variableId: 'v_signature' }
                        },
                        {
                            id: 'sum_submit_btn',
                            type: 'Button',
                            props: { text: '📤 Simpan & Kirim Hasil Inspeksi', variant: 'positive', action: 'COMPLETE_APP', size: 'lg' }
                        }
                    ],
                    triggers: [
                        {
                            id: 'trig_save',
                            event: 'ON_CLICK',
                            componentId: 'sum_submit_btn',
                            actions: [
                                { type: 'TABLE_RECORD_SAVE', tableId: 'tbl_gs_qc_inspections' }
                            ]
                        }
                    ]
                }
            ],
            variables: [
                { id: 'v_wo', name: 'WORK_ORDER', type: 'string', value: '' },
                { id: 'v_part', name: 'PART_NUMBER', type: 'string', value: '' },
                { id: 'v_serial', name: 'SERIAL_NUMBER', type: 'string', value: '' },
                { id: 'v_shift', name: 'SHIFT', type: 'string', value: 'Shift 1 (Pagi)' },
                { id: 'v_inspector', name: 'INSPECTOR', type: 'string', value: '' },
                { id: 'v_bore', name: 'BORE_DIAMETER', type: 'number', value: '' },
                { id: 'v_rod', name: 'ROD_DIAMETER', type: 'number', value: '' },
                { id: 'v_stroke', name: 'STROKE_LENGTH', type: 'number', value: '' },
                { id: 'v_pressure', name: 'PROOF_PRESSURE', type: 'number', value: '' },
                { id: 'v_decision', name: 'DECISION', type: 'string', value: 'PASS — Sesuai Spesifikasi' },
                { id: 'v_signature', name: 'SIGNATURE', type: 'string', value: '' }
            ],
            appTables: []
        }
    };
}
