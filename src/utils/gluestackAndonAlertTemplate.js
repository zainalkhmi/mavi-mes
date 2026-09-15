/**
 * GlueStack Andon Alert Template
 * Mobile Andon alert app for raising shop floor escalation alerts
 * Builder Type: gluestack
 */
export function createGluestackAndonAlertTemplate() {
    return {
        id: 'gluestack_andon_' + Date.now(),
        name: 'GlueStack — Andon Alert Mobile',
        description: 'Aplikasi Andon mobile untuk melaporkan masalah di shop floor secara real-time: Quality, Machine Down, Material, Safety. GlueStack App.',
        builder_type: 'gluestack',
        category: 'GlueStack App',
        config: {
            screens: [
                {
                    id: 'screen_andon_home',
                    title: 'Andon Dashboard',
                    components: [
                        {
                            id: 'andon_title',
                            type: 'Text',
                            props: { text: '🚨 Andon Alert System', size: 'xl', bold: true }
                        },
                        {
                            id: 'andon_status',
                            type: 'Badge',
                            props: { text: 'LINE 2 • NO ACTIVE ALERTS', action: 'success' }
                        },
                        {
                            id: 'andon_alert_info',
                            type: 'Alert',
                            props: { text: 'Tekan tombol di bawah untuk mengirimkan alert ke supervisor dan maintenance team.', action: 'info' }
                        },
                        {
                            id: 'andon_quality_btn',
                            type: 'Button',
                            props: {
                                text: '🔴 Quality Issue',
                                variant: 'negative',
                                action: 'GO_TO_SCREEN',
                                targetScreenId: 'screen_andon_form',
                                size: 'lg'
                            }
                        },
                        {
                            id: 'andon_machine_btn',
                            type: 'Button',
                            props: {
                                text: '🟡 Machine Down',
                                variant: 'secondary',
                                action: 'GO_TO_SCREEN',
                                targetScreenId: 'screen_andon_form',
                                size: 'lg'
                            }
                        },
                        {
                            id: 'andon_material_btn',
                            type: 'Button',
                            props: {
                                text: '🟠 Material Shortage',
                                variant: 'secondary',
                                action: 'GO_TO_SCREEN',
                                targetScreenId: 'screen_andon_form',
                                size: 'lg'
                            }
                        },
                        {
                            id: 'andon_safety_btn',
                            type: 'Button',
                            props: {
                                text: '⚠️ Safety Concern',
                                variant: 'negative',
                                action: 'GO_TO_SCREEN',
                                targetScreenId: 'screen_andon_form',
                                size: 'lg'
                            }
                        },
                        {
                            id: 'andon_history_title',
                            type: 'Text',
                            props: { text: '── Riwayat Alert Hari Ini ──', size: 'sm', align: 'center', color: '#94a3b8' }
                        },
                        {
                            id: 'andon_history_1',
                            type: 'Card',
                            props: { title: '🟡 Machine Down — CNC-02', content: '09:30 — Motor overheat, menunggu maintenance\nStatus: RESOLVED (10:15)' }
                        },
                        {
                            id: 'andon_history_2',
                            type: 'Card',
                            props: { title: '🟠 Material Shortage — Station 3', content: '08:45 — Fastener M6 habis, membutuhkan replenishment\nStatus: RESOLVED (09:10)' }
                        }
                    ],
                    triggers: []
                },
                {
                    id: 'screen_andon_form',
                    title: 'Lapor Andon',
                    components: [
                        {
                            id: 'form_title',
                            type: 'Text',
                            props: { text: '📝 Detail Laporan Andon', size: 'lg', bold: true }
                        },
                        {
                            id: 'form_category',
                            type: 'Select',
                            props: {
                                label: 'Kategori Alert',
                                options: ['Quality Issue', 'Machine Down', 'Material Shortage', 'Safety Concern', 'Other'],
                                variableId: 'v_category'
                            }
                        },
                        {
                            id: 'form_station',
                            type: 'Select',
                            props: {
                                label: 'Stasiun / Lokasi',
                                options: ['CNC-01', 'CNC-02', 'CNC-03', 'CNC-04', 'Lathe-01', 'Lathe-02', 'Press-01', 'Assembly Line 1', 'Assembly Line 2'],
                                variableId: 'v_station'
                            }
                        },
                        {
                            id: 'form_severity',
                            type: 'Select',
                            props: {
                                label: 'Tingkat Urgensi',
                                options: ['🔴 Critical — Produksi Berhenti', '🟡 Major — Butuh Tindakan Segera', '🟢 Minor — Dapat Ditangani Nanti'],
                                variableId: 'v_severity'
                            }
                        },
                        {
                            id: 'form_description',
                            type: 'Textarea',
                            props: { label: 'Deskripsi Masalah', placeholder: 'Jelaskan detail masalah yang terjadi...', variableId: 'v_description' }
                        },
                        {
                            id: 'form_operator',
                            type: 'Input',
                            props: { label: 'Dilaporkan Oleh', placeholder: 'Nama operator...', variableId: 'v_reporter' }
                        },
                        {
                            id: 'form_line_stop',
                            type: 'Switch',
                            props: { label: 'Produksi dihentikan (line stop)', value: false, variableId: 'v_line_stop' }
                        },
                        {
                            id: 'form_submit_btn',
                            type: 'Button',
                            props: { text: '🚨 Kirim Alert Andon', variant: 'negative', action: 'NEXT_SCREEN', size: 'lg' }
                        },
                        {
                            id: 'form_cancel_btn',
                            type: 'Button',
                            props: { text: '← Batal', variant: 'default', action: 'PREV_SCREEN' }
                        }
                    ],
                    triggers: [
                        {
                            id: 'trig_save_andon',
                            event: 'ON_CLICK',
                            componentId: 'form_submit_btn',
                            actions: [
                                { type: 'TABLE_RECORD_SAVE', tableId: 'tbl_gs_andon_events' }
                            ]
                        }
                    ]
                },
                {
                    id: 'screen_andon_sent',
                    title: 'Alert Terkirim',
                    components: [
                        {
                            id: 'sent_alert',
                            type: 'Alert',
                            props: { text: '🚨 Andon Alert berhasil dikirim! Supervisor dan maintenance team telah diberitahu.', action: 'warning' }
                        },
                        {
                            id: 'sent_title',
                            type: 'Text',
                            props: { text: 'Alert Terkirim!', size: 'xl', bold: true, align: 'center' }
                        },
                        {
                            id: 'sent_badge',
                            type: 'Badge',
                            props: { text: 'MENUNGGU RESPONS', action: 'warning' }
                        },
                        {
                            id: 'sent_card',
                            type: 'Card',
                            props: {
                                title: 'Detail Alert',
                                content: '• Kategori: Quality Issue\n• Stasiun: CNC-04\n• Urgensi: Critical\n• Status: OPEN — Menunggu Respons\n• Notifikasi: Dikirim ke Supervisor & Maintenance'
                            }
                        },
                        {
                            id: 'sent_timer',
                            type: 'Timer',
                            props: { label: 'Waktu Tunggu Respons', mode: 'countup' }
                        },
                        {
                            id: 'sent_new_btn',
                            type: 'Button',
                            props: { text: '🚨 Kirim Alert Baru', variant: 'secondary', action: 'GO_TO_SCREEN', targetScreenId: 'screen_andon_home' }
                        },
                        {
                            id: 'sent_done_btn',
                            type: 'Button',
                            props: { text: '✅ Selesai', variant: 'positive', action: 'COMPLETE_APP' }
                        }
                    ],
                    triggers: []
                }
            ],
            variables: [
                { id: 'v_category', name: 'ALERT_CATEGORY', type: 'string', value: '' },
                { id: 'v_station', name: 'STATION_ID', type: 'string', value: '' },
                { id: 'v_severity', name: 'SEVERITY', type: 'string', value: '' },
                { id: 'v_description', name: 'DESCRIPTION', type: 'string', value: '' },
                { id: 'v_reporter', name: 'REPORTER', type: 'string', value: '' },
                { id: 'v_line_stop', name: 'LINE_STOP', type: 'boolean', value: false }
            ],
            appTables: []
        }
    };
}
