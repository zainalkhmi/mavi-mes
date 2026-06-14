/**
 * quickStartHelloWorldTemplate.js
 * Quick Start template demonstrating basic widget, variable, and trigger logic.
 */
export function createQuickStartHelloWorldTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const appVariables = [
        { id: `var_status_${ts}`, name: 'Status', type: 'string', defaultValue: 'Belum Ditekan', persisted: false }
    ];

    const step1 = {
        id: `st1_${ts}`,
        title: '1. Hello World Screen',
        stepType: 'Step',
        components: [
            // Title
            {
                id: `title_${ts}`,
                type: 'TEXT',
                x: 50, y: 40, w: 900, h: 40,
                props: {
                    text: 'Quick Start: Hello World',
                    fontSize: 28,
                    fontWeight: 'bold',
                    textAlignment: 1,
                    textColor: '#1e3a8a'
                }
            },
            // Subtitle
            {
                id: `sub_${ts}`,
                type: 'TEXT',
                x: 50, y: 90, w: 900, h: 30,
                props: {
                    text: 'Tutorial 5 Menit: Membuat Aplikasi Pertama Anda',
                    fontSize: 16,
                    textAlignment: 1,
                    textColor: '#475569'
                }
            },
            // Status Text Display
            {
                id: `status_txt_${ts}`,
                type: 'TEXT',
                x: 100, y: 180, w: 800, h: 50,
                props: {
                    text: 'Status: {{@Status}}',
                    fontSize: 24,
                    fontWeight: 'bold',
                    textAlignment: 1,
                    textColor: '#0f172a'
                }
            },
            // Interactive Button
            {
                id: `btn_press_${ts}`,
                type: 'BUTTON',
                x: 350, y: 270, w: 300, h: 50,
                props: {
                    text: 'Tekan Saya',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontWeight: 'bold',
                    triggers: [
                        {
                            name: 'Update Status Text',
                            event: 'ON_CLICK',
                            actions: [
                                {
                                    type: 'SET_VARIABLE',
                                    payload: {
                                        variable: 'Status',
                                        value: 'Tombol Ditekan!'
                                    }
                                },
                                {
                                    type: 'SHOW_MESSAGE',
                                    payload: {
                                        message: 'Status berhasil diperbarui!',
                                        msgType: 'success'
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        ]
    };

    return {
        id: `app_hello_world_${ts}`,
        name: 'Quick Start: Hello World',
        description: 'Tutorial 5 Menit: Membuat Aplikasi Pertama Anda',
        category: 'App Management',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables,
            recordPlaceholders: [],
            appTables: [],
            appTriggers: [],
            steps: [step1]
        }
    };
}
