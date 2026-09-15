/**
 * GlueStack Dashboard Template
 * Mobile production dashboard with shift KPIs, OEE, machine status
 * Builder Type: gluestack
 */
export function createGluestackDashboardTemplate() {
    return {
        id: 'gluestack_dashboard_' + Date.now(),
        name: 'GlueStack — Production Dashboard',
        description: 'Real-time mobile production dashboard with shift KPI, OEE target, dan machine telemetry. GlueStack App.',
        builder_type: 'gluestack',
        category: 'GlueStack App',
        config: {
            screens: [
                {
                    id: 'screen_dashboard',
                    title: 'Production Dashboard',
                    components: [
                        {
                            id: 'dash_header',
                            type: 'Text',
                            props: { text: '📊 Production & QC Dashboard', size: 'lg', bold: true }
                        },
                        {
                            id: 'dash_status',
                            type: 'Badge',
                            props: { text: 'LINE 2 • AKTIF • SHIFT 1', action: 'success' }
                        },
                        {
                            id: 'dash_oee_card',
                            type: 'Card',
                            props: { title: 'OEE Target', content: '88.5% (Target: 85.0%)' }
                        },
                        {
                            id: 'dash_progress',
                            type: 'Progress',
                            props: { value: 82, label: 'Shift Output: 984 / 1,200 pcs (82%)' }
                        },
                        {
                            id: 'dash_kpi_target',
                            type: 'Card',
                            props: { title: '🎯 Target Shift', content: '1,200 pcs' }
                        },
                        {
                            id: 'dash_kpi_actual',
                            type: 'Card',
                            props: { title: '✅ Aktual', content: '984 pcs' }
                        },
                        {
                            id: 'dash_kpi_defect',
                            type: 'Card',
                            props: { title: '⚠️ Defect Rate', content: '0.8% (8 unit)' }
                        },
                        {
                            id: 'dash_kpi_cycle',
                            type: 'Card',
                            props: { title: '⏱️ Cycle Time', content: '12.5 detik / unit' }
                        },
                        {
                            id: 'dash_machine_title',
                            type: 'Text',
                            props: { text: 'Status Stasiun CNC-04', size: 'md', bold: true }
                        },
                        {
                            id: 'dash_machine_status',
                            type: 'Badge',
                            props: { text: 'RUNNING', action: 'success' }
                        },
                        {
                            id: 'dash_temp',
                            type: 'Gauge',
                            props: { label: 'Suhu Spindle', value: 42.8, min: 0, max: 100, unit: '°C', thresholds: [{ value: 70, color: '#ef4444' }, { value: 50, color: '#f59e0b' }] }
                        },
                        {
                            id: 'dash_pressure',
                            type: 'Gauge',
                            props: { label: 'Tekanan Oli', value: 145, min: 0, max: 250, unit: 'Bar', thresholds: [{ value: 200, color: '#ef4444' }, { value: 160, color: '#f59e0b' }] }
                        },
                        {
                            id: 'dash_btn_qc',
                            type: 'Button',
                            props: { text: 'Mulai Pemeriksaan QC ➔', variant: 'primary', action: 'NEXT_SCREEN' }
                        }
                    ],
                    triggers: []
                },
                {
                    id: 'screen_quick_actions',
                    title: 'Quick Actions',
                    components: [
                        {
                            id: 'qa_title',
                            type: 'Text',
                            props: { text: '⚡ Quick Actions', size: 'lg', bold: true }
                        },
                        {
                            id: 'qa_scan_btn',
                            type: 'Button',
                            props: { text: '📷 Scan QR Part', variant: 'primary', action: 'NEXT_SCREEN' }
                        },
                        {
                            id: 'qa_checksheet_btn',
                            type: 'Button',
                            props: { text: '📋 Checksheet QC', variant: 'secondary' }
                        },
                        {
                            id: 'qa_andon_btn',
                            type: 'Button',
                            props: { text: '🚨 Report Andon', variant: 'negative' }
                        },
                        {
                            id: 'qa_log_btn',
                            type: 'Button',
                            props: { text: '📝 Log Downtime', variant: 'secondary' }
                        },
                        {
                            id: 'qa_alert',
                            type: 'Alert',
                            props: { text: '2 item inspeksi QC menunggu penyelesaian', action: 'warning' }
                        },
                        {
                            id: 'qa_back_btn',
                            type: 'Button',
                            props: { text: '← Kembali ke Dashboard', variant: 'default', action: 'PREV_SCREEN' }
                        }
                    ],
                    triggers: []
                },
                {
                    id: 'screen_analytics',
                    title: 'Analytics',
                    components: [
                        {
                            id: 'analytics_title',
                            type: 'Text',
                            props: { text: '📈 Analitik Shift', size: 'lg', bold: true }
                        },
                        {
                            id: 'analytics_chart',
                            type: 'Chart',
                            props: {
                                chartType: 'bar',
                                title: 'Output per Jam',
                                data: [
                                    { label: '07:00', value: 120 },
                                    { label: '08:00', value: 145 },
                                    { label: '09:00', value: 138 },
                                    { label: '10:00', value: 152 },
                                    { label: '11:00', value: 140 },
                                    { label: '12:00', value: 98 },
                                    { label: '13:00', value: 132 },
                                    { label: '14:00', value: 59 }
                                ]
                            }
                        },
                        {
                            id: 'analytics_uptime',
                            type: 'Progress',
                            props: { value: 94, label: 'Machine Uptime: 94%' }
                        },
                        {
                            id: 'analytics_yield',
                            type: 'Progress',
                            props: { value: 99, label: 'First Pass Yield: 99.2%' }
                        },
                        {
                            id: 'analytics_complete_btn',
                            type: 'Button',
                            props: { text: '✅ Akhiri Shift', variant: 'positive', action: 'COMPLETE_APP' }
                        }
                    ],
                    triggers: []
                }
            ],
            variables: [
                { id: 'v_shift', name: 'CURRENT_SHIFT', type: 'string', value: 'Shift 1' },
                { id: 'v_line', name: 'LINE_ID', type: 'string', value: 'Line 2' },
                { id: 'v_target', name: 'SHIFT_TARGET', type: 'number', value: '1200' },
                { id: 'v_actual', name: 'SHIFT_ACTUAL', type: 'number', value: '984' },
                { id: 'v_defects', name: 'DEFECT_COUNT', type: 'number', value: '8' }
            ]
        }
    };
}
