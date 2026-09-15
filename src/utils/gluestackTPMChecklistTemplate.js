/**
 * GlueStack TPM Checklist Template
 * Mobile Total Productive Maintenance daily checklist for machine verification
 * Builder Type: gluestack
 */
export function createGluestackTPMChecklistTemplate() {
    return {
        id: 'gluestack_tpm_' + Date.now(),
        name: 'GlueStack — TPM Daily Checklist',
        description: 'Checklist harian TPM (Total Productive Maintenance) untuk verifikasi kondisi mesin sebelum produksi. GlueStack App.',
        builder_type: 'gluestack',
        category: 'GlueStack App',
        config: {
            screens: [
                {
                    id: 'screen_tpm_start',
                    title: 'Mulai TPM Check',
                    components: [
                        {
                            id: 'tpm_title',
                            type: 'Text',
                            props: { text: '🔧 TPM Daily Checklist', size: 'xl', bold: true }
                        },
                        {
                            id: 'tpm_subtitle',
                            type: 'Text',
                            props: { text: 'Verifikasi Mesin Sebelum Produksi', size: 'sm', color: '#64748b' }
                        },
                        {
                            id: 'tpm_machine_select',
                            type: 'Select',
                            props: {
                                label: 'Pilih Mesin / Stasiun',
                                options: ['CNC-01', 'CNC-02', 'CNC-03', 'CNC-04', 'Lathe-01', 'Lathe-02', 'Press-01'],
                                variableId: 'v_machine'
                            }
                        },
                        {
                            id: 'tpm_operator_input',
                            type: 'Input',
                            props: { label: 'Nama Operator', placeholder: 'Nama Anda...', variableId: 'v_operator' }
                        },
                        {
                            id: 'tpm_shift_select',
                            type: 'Select',
                            props: {
                                label: 'Shift',
                                options: ['Shift 1 (06:00-14:00)', 'Shift 2 (14:00-22:00)', 'Shift 3 (22:00-06:00)'],
                                variableId: 'v_shift'
                            }
                        },
                        {
                            id: 'tpm_progress',
                            type: 'Progress',
                            props: { value: 0, label: 'Progress Check: 0/15 items' }
                        },
                        {
                            id: 'tpm_start_btn',
                            type: 'Button',
                            props: { text: 'Mulai Pengecekan ➔', variant: 'primary', action: 'NEXT_SCREEN', size: 'lg' }
                        }
                    ],
                    triggers: []
                },
                {
                    id: 'screen_tpm_safety',
                    title: 'Safety & Kebersihan',
                    components: [
                        {
                            id: 'safety_title',
                            type: 'Text',
                            props: { text: '🛡️ Safety & Kebersihan', size: 'lg', bold: true }
                        },
                        {
                            id: 'safety_badge',
                            type: 'Badge',
                            props: { text: 'STEP 1 / 3', action: 'info' }
                        },
                        {
                            id: 'safety_1',
                            type: 'Checkbox',
                            props: { label: 'Area kerja bersih dari chip / serbuk', checked: false }
                        },
                        {
                            id: 'safety_2',
                            type: 'Checkbox',
                            props: { label: 'Guard / pelindung mesin terpasang', checked: false }
                        },
                        {
                            id: 'safety_3',
                            type: 'Checkbox',
                            props: { label: 'Emergency stop button berfungsi', checked: false }
                        },
                        {
                            id: 'safety_4',
                            type: 'Checkbox',
                            props: { label: 'APD (sarung tangan, kacamata) tersedia', checked: false }
                        },
                        {
                            id: 'safety_5',
                            type: 'Checkbox',
                            props: { label: 'Lantai bersih & tidak licin', checked: false }
                        },
                        {
                            id: 'safety_progress',
                            type: 'Progress',
                            props: { value: 33, label: 'Progress Check: 5/15 items' }
                        },
                        {
                            id: 'safety_next_btn',
                            type: 'Button',
                            props: { text: 'Lanjut → Pelumasan & Fluida', variant: 'primary', action: 'NEXT_SCREEN' }
                        }
                    ],
                    triggers: []
                },
                {
                    id: 'screen_tpm_fluid',
                    title: 'Pelumasan & Fluida',
                    components: [
                        {
                            id: 'fluid_title',
                            type: 'Text',
                            props: { text: '🛢️ Pelumasan & Fluida', size: 'lg', bold: true }
                        },
                        {
                            id: 'fluid_badge',
                            type: 'Badge',
                            props: { text: 'STEP 2 / 3', action: 'info' }
                        },
                        {
                            id: 'fluid_1',
                            type: 'Checkbox',
                            props: { label: 'Level oli pelumas cukup (di atas batas minimum)', checked: false }
                        },
                        {
                            id: 'fluid_2',
                            type: 'Checkbox',
                            props: { label: 'Coolant / cairan pendingin cukup', checked: false }
                        },
                        {
                            id: 'fluid_3',
                            type: 'Checkbox',
                            props: { label: 'Tidak ada kebocoran oli / cairan', checked: false }
                        },
                        {
                            id: 'fluid_4',
                            type: 'Checkbox',
                            props: { label: 'Filter udara bersih', checked: false }
                        },
                        {
                            id: 'fluid_5',
                            type: 'Checkbox',
                            props: { label: 'Sistem pneumatik / hidrolik normal', checked: false }
                        },
                        {
                            id: 'fluid_level_input',
                            type: 'NumberInput',
                            props: { label: 'Level Oli (%)', min: 0, max: 100, step: 1, unit: '%', variableId: 'v_oil_level' }
                        },
                        {
                            id: 'fluid_progress',
                            type: 'Progress',
                            props: { value: 66, label: 'Progress Check: 10/15 items' }
                        },
                        {
                            id: 'fluid_next_btn',
                            type: 'Button',
                            props: { text: 'Lanjut → Operasional', variant: 'primary', action: 'NEXT_SCREEN' }
                        }
                    ],
                    triggers: []
                },
                {
                    id: 'screen_tpm_operational',
                    title: 'Operasional Mesin',
                    components: [
                        {
                            id: 'ops_title',
                            type: 'Text',
                            props: { text: '⚙️ Operasional Mesin', size: 'lg', bold: true }
                        },
                        {
                            id: 'ops_badge',
                            type: 'Badge',
                            props: { text: 'STEP 3 / 3', action: 'info' }
                        },
                        {
                            id: 'ops_1',
                            type: 'Checkbox',
                            props: { label: 'Mesin dapat dinyalakan normal', checked: false }
                        },
                        {
                            id: 'ops_2',
                            type: 'Checkbox',
                            props: { label: 'Spindle berputar tanpa getaran abnormal', checked: false }
                        },
                        {
                            id: 'ops_3',
                            type: 'Checkbox',
                            props: { label: 'Axis X/Y/Z bergerak bebas & presisi', checked: false }
                        },
                        {
                            id: 'ops_4',
                            type: 'Checkbox',
                            props: { label: 'Panel kontrol / HMI responsif', checked: false }
                        },
                        {
                            id: 'ops_5',
                            type: 'Checkbox',
                            props: { label: 'Tidak ada alarm / error aktif di mesin', checked: false }
                        },
                        {
                            id: 'ops_notes',
                            type: 'Textarea',
                            props: { label: 'Catatan Temuan', placeholder: 'Deskripsikan temuan abnormal jika ada...' }
                        },
                        {
                            id: 'ops_progress',
                            type: 'Progress',
                            props: { value: 100, label: 'Progress Check: 15/15 items ✅' }
                        },
                        {
                            id: 'ops_alert',
                            type: 'Alert',
                            props: { text: 'Semua item pengecekan telah selesai. Silakan review dan kirim.', action: 'success' }
                        },
                        {
                            id: 'ops_submit_btn',
                            type: 'Button',
                            props: { text: '📤 Kirim Hasil TPM Check', variant: 'positive', action: 'COMPLETE_APP', size: 'lg' }
                        }
                    ],
                    triggers: [
                        {
                            id: 'trig_save_tpm',
                            event: 'ON_CLICK',
                            componentId: 'ops_submit_btn',
                            actions: [
                                { type: 'TABLE_RECORD_SAVE', tableId: 'tbl_gs_tpm_checks' }
                            ]
                        }
                    ]
                }
            ],
            variables: [
                { id: 'v_machine', name: 'MACHINE_ID', type: 'string', value: 'CNC-04' },
                { id: 'v_operator', name: 'OPERATOR', type: 'string', value: '' },
                { id: 'v_shift', name: 'SHIFT', type: 'string', value: 'Shift 1 (06:00-14:00)' },
                { id: 'v_oil_level', name: 'OIL_LEVEL_PCT', type: 'number', value: '' },
                { id: 'v_tpm_result', name: 'TPM_RESULT', type: 'string', value: '' }
            ],
            appTables: []
        }
    };
}
