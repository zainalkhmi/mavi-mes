/**
 * GlueStack Login Template
 * Mobile operator login screen with NIK & PIN authentication
 * Builder Type: gluestack
 */
export function createGluestackLoginTemplate() {
    return {
        id: 'gluestack_login_' + Date.now(),
        name: 'GlueStack — Mobile Login',
        description: 'Operator NIK & PIN login screen for shop floor mobile devices. GlueStack App.',
        builder_type: 'gluestack',
        category: 'GlueStack App',
        config: {
            screens: [
                {
                    id: 'screen_login',
                    title: 'Operator Login',
                    components: [
                        {
                            id: 'login_logo',
                            type: 'Text',
                            props: { text: '🏭', size: 'xl', bold: true, align: 'center' }
                        },
                        {
                            id: 'login_title',
                            type: 'Text',
                            props: { text: 'Mandor MES', size: 'xl', bold: true, align: 'center' }
                        },
                        {
                            id: 'login_subtitle',
                            type: 'Text',
                            props: { text: 'Sistem Pelaksana Pabrik & Stasiun Kerja', size: 'sm', align: 'center', color: '#64748b' }
                        },
                        {
                            id: 'login_badge',
                            type: 'Badge',
                            props: { text: 'SHIFT 1 • STATION CNC-04', action: 'info' }
                        },
                        {
                            id: 'login_nik_input',
                            type: 'Input',
                            props: {
                                label: 'ID Operator / NIK',
                                placeholder: 'Contoh: OP-4092',
                                icon: 'User',
                                variableId: 'v_nik'
                            }
                        },
                        {
                            id: 'login_pin_input',
                            type: 'Input',
                            props: {
                                label: 'PIN Keamanan Stasiun',
                                placeholder: 'PIN 4-6 digit',
                                type: 'password',
                                icon: 'Lock',
                                variableId: 'v_pin'
                            }
                        },
                        {
                            id: 'login_remember',
                            type: 'Checkbox',
                            props: { label: 'Ingat Stasiun Ini', checked: true }
                        },
                        {
                            id: 'login_btn',
                            type: 'Button',
                            props: {
                                text: 'Masuk ke Stasiun Kerja ➔',
                                variant: 'primary',
                                action: 'NEXT_SCREEN',
                                size: 'lg'
                            }
                        },
                        {
                            id: 'login_footer',
                            type: 'Text',
                            props: { text: 'MaviCore UI Engine v2.0 • Powered by GlueStack', size: 'xs', align: 'center', color: '#94a3b8' }
                        }
                    ],
                    triggers: []
                },
                {
                    id: 'screen_welcome',
                    title: 'Selamat Datang',
                    components: [
                        {
                            id: 'welcome_alert',
                            type: 'Alert',
                            props: { text: 'Login berhasil! Anda masuk sebagai Operator CNC-04', action: 'success' }
                        },
                        {
                            id: 'welcome_title',
                            type: 'Text',
                            props: { text: 'Selamat Datang, Operator', size: 'lg', bold: true }
                        },
                        {
                            id: 'welcome_shift',
                            type: 'Badge',
                            props: { text: 'SHIFT 1 • AKTIF', action: 'success' }
                        },
                        {
                            id: 'welcome_card',
                            type: 'Card',
                            props: { title: 'Ringkasan Tugas Hari Ini', content: '• 3 Work Order aktif\n• 2 Inspeksi QC tertunda\n• 0 Andon terbuka' }
                        },
                        {
                            id: 'welcome_progress',
                            type: 'Progress',
                            props: { value: 0, label: 'Progress Shift: 0%' }
                        },
                        {
                            id: 'welcome_start_btn',
                            type: 'Button',
                            props: { text: 'Mulai Bekerja ➔', variant: 'positive', action: 'COMPLETE_APP' }
                        }
                    ],
                    triggers: []
                }
            ],
            variables: [
                { id: 'v_nik', name: 'OPERATOR_NIK', type: 'string', value: '' },
                { id: 'v_pin', name: 'OPERATOR_PIN', type: 'string', value: '' },
                { id: 'v_station', name: 'STATION_ID', type: 'string', value: 'CNC-04' }
            ]
        }
    };
}
