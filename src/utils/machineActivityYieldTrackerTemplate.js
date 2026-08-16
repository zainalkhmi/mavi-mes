/**
 * machineActivityYieldTrackerTemplate.js
 * Frontline Mobile App Template for Machine Activity & Yield Tracking
 */

export function createMachineActivityYieldTrackerTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const T = {
        stationHistory: 'tbl_station_activity_history'
    };

    const appVariables = [
        { id: `v1_${ts}`, name: 'Order_ID', type: 'string', defaultValue: 'WO-2026-081', persisted: true },
        { id: `v2_${ts}`, name: 'Operation_Duration_Hr', type: 'number', defaultValue: 8, persisted: true },
        { id: `v3_${ts}`, name: 'Product_Demand', type: 'number', defaultValue: 480, persisted: true },
        { id: `v4_${ts}`, name: 'Planned_Takt_Time', type: 'number', defaultValue: 60, persisted: true },
        { id: `v5_${ts}`, name: 'Machine_Status', type: 'string', defaultValue: 'RUNNING', persisted: true },
        { id: `v6_${ts}`, name: 'Downtime_Reason', type: 'string', defaultValue: '', persisted: true },
        { id: `v7_${ts}`, name: 'Good_Parts', type: 'number', defaultValue: 0, persisted: true },
        { id: `v8_${ts}`, name: 'Defect_Parts', type: 'number', defaultValue: 0, persisted: true },
        { id: `v9_${ts}`, name: 'Target_Parts', type: 'number', defaultValue: 0, persisted: true },
        { id: `v10_${ts}`, name: 'Yield_Pct', type: 'number', defaultValue: 100, persisted: true },
        { id: `v11_${ts}`, name: 'Cycle_Time', type: 'number', defaultValue: 58, persisted: true },
        { id: `v12_${ts}`, name: 'Station_ID', type: 'string', defaultValue: 'CELL-CNC-01', persisted: true },
        { id: `v13_${ts}`, name: 'Operator', type: 'string', defaultValue: '@APP_INFO.USER', persisted: true }
    ];

    // Step 1: Takt Setup & Order Init
    const step1 = {
        id: `step1_${ts}`,
        title: '1. Select Product & Takt Calculator',
        stepType: 'Step',
        components: [
            {
                id: `s1_bg_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 420, h: 64,
                props: { backgroundColor: '#1e3a8a', borderRadius: 0 }
            },
            {
                id: `s1_title_${ts}`, type: 'TEXT',
                x: 16, y: 18, w: 388, h: 28,
                props: { text: '📱 Machine Activity & Yield Tracker', fontSize: 16, color: 'white', fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: `s1_card_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 16, y: 80, w: 388, h: 480,
                props: { backgroundColor: '#ffffff', borderRadius: 12, borderColor: '#e2e8f0', borderWidth: 1 }
            },
            {
                id: `s1_inst_${ts}`, type: 'TEXT',
                x: 32, y: 96, w: 356, h: 40,
                props: { text: 'Konfigurasi target produksi dan kalkulasi Planned Takt Time sebelum memulai mesin.', fontSize: 12, color: '#64748b' }
            },
            {
                id: `s1_ord_${ts}`, type: 'TEXT_INPUT',
                x: 32, y: 145, w: 356, h: 48,
                props: { label: 'Order / Batch ID', placeholder: 'WO-2026-081', targetVariable: 'Order_ID', required: true }
            },
            {
                id: `s1_dur_${ts}`, type: 'TEXT_INPUT',
                x: 32, y: 210, w: 170, h: 48,
                props: { label: 'Shift Hours (hr)', placeholder: '8', inputType: 'number', targetVariable: 'Operation_Duration_Hr', required: true }
            },
            {
                id: `s1_dem_${ts}`, type: 'TEXT_INPUT',
                x: 218, y: 210, w: 170, h: 48,
                props: { label: 'Demand (pcs)', placeholder: '480', inputType: 'number', targetVariable: 'Product_Demand', required: true }
            },
            {
                id: `s1_takt_lbl_${ts}`, type: 'TEXT',
                x: 32, y: 280, w: 356, h: 20,
                props: { text: '⚡ Planned Takt Time: ~60 detik/part', fontSize: 13, fontWeight: 'bold', color: '#2563eb' }
            },
            {
                id: `s1_stn_${ts}`, type: 'TEXT_INPUT',
                x: 32, y: 320, w: 356, h: 48,
                props: { label: 'Station Name / ID', placeholder: 'CELL-CNC-01', targetVariable: 'Station_ID' }
            },
            {
                id: `s1_op_${ts}`, type: 'TEXT_INPUT',
                x: 32, y: 385, w: 356, h: 48,
                props: { label: 'Operator ID / Nama', placeholder: 'Operator', targetVariable: 'Operator' }
            },
            {
                id: `s1_start_btn_${ts}`, type: 'BUTTON',
                x: 32, y: 465, w: 356, h: 56,
                props: {
                    label: 'START PRODUCTION ▶',
                    text: 'START PRODUCTION ▶',
                    backgroundColor: '#2563eb', color: 'white', fontSize: 14, fontWeight: 'bold',
                    triggers: [
                        {
                            name: 'StartProd',
                            event: 'ON_CLICK',
                            actions: [
                                { type: 'SET_VARIABLE', payload: { variable: 'Machine_Status', value: 'RUNNING' } },
                                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_station_${ts}` } },
                                { type: 'SHOW_MESSAGE', payload: { message: '🚀 Sesi Produksi & Mesin Dimulai!', msgType: 'success' } },
                                { type: 'NEXT_STEP' }
                            ]
                        }
                    ]
                }
            }
        ]
    };

    // Step 2: Main Production & Status Logging
    const step2 = {
        id: `step2_${ts}`,
        title: '2. Main Production & Status Logging',
        stepType: 'Step',
        components: [
            {
                id: `s2_bg_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 420, h: 64,
                props: { backgroundColor: '#0f172a', borderRadius: 0 }
            },
            {
                id: `s2_hdr_${ts}`, type: 'TEXT',
                x: 16, y: 14, w: 388, h: 20,
                props: { text: '⚡ Live Machine Terminal', fontSize: 15, color: 'white', fontWeight: 'bold' }
            },
            {
                id: `s2_sub_${ts}`, type: 'VARIABLE_TEXT',
                x: 16, y: 36, w: 388, h: 18,
                props: { prefix: 'Order: ', variableName: 'Order_ID', fontSize: 11, color: '#94a3b8' }
            },
            // Status Switchers
            {
                id: `s2_run_btn_${ts}`, type: 'BUTTON',
                x: 16, y: 80, w: 72, h: 44,
                props: {
                    label: 'RUN', text: 'RUN', backgroundColor: '#16a34a', color: 'white', fontSize: 11, fontWeight: 'bold',
                    triggers: [{ name: 'SetRun', event: 'ON_CLICK', actions: [{ type: 'SET_VARIABLE', payload: { variable: 'Machine_Status', value: 'RUNNING' } }] }]
                }
            },
            {
                id: `s2_down_btn_${ts}`, type: 'BUTTON',
                x: 94, y: 80, w: 72, h: 44,
                props: {
                    label: 'DOWN', text: 'DOWN', backgroundColor: '#dc2626', color: 'white', fontSize: 11, fontWeight: 'bold',
                    triggers: [{ name: 'SetDown', event: 'ON_CLICK', actions: [{ type: 'SET_VARIABLE', payload: { variable: 'Machine_Status', value: 'DOWN' } }, { type: 'NEXT_STEP' }] }]
                }
            },
            {
                id: `s2_idle_btn_${ts}`, type: 'BUTTON',
                x: 172, y: 80, w: 72, h: 44,
                props: {
                    label: 'IDLE', text: 'IDLE', backgroundColor: '#eab308', color: '#0f172a', fontSize: 11, fontWeight: 'bold',
                    triggers: [{ name: 'SetIdle', event: 'ON_CLICK', actions: [{ type: 'SET_VARIABLE', payload: { variable: 'Machine_Status', value: 'IDLE' } }] }]
                }
            },
            {
                id: `s2_setup_btn_${ts}`, type: 'BUTTON',
                x: 250, y: 80, w: 72, h: 44,
                props: {
                    label: 'SETUP', text: 'SETUP', backgroundColor: '#6366f1', color: 'white', fontSize: 11, fontWeight: 'bold',
                    triggers: [{ name: 'SetSetup', event: 'ON_CLICK', actions: [{ type: 'SET_VARIABLE', payload: { variable: 'Machine_Status', value: 'SETUP' } }] }]
                }
            },
            {
                id: `s2_off_btn_${ts}`, type: 'BUTTON',
                x: 328, y: 80, w: 76, h: 44,
                props: {
                    label: 'OFF', text: 'OFF', backgroundColor: '#64748b', color: 'white', fontSize: 11, fontWeight: 'bold',
                    triggers: [{ name: 'SetOff', event: 'ON_CLICK', actions: [{ type: 'SET_VARIABLE', payload: { variable: 'Machine_Status', value: 'OFF' } }] }]
                }
            },
            // Live Status Card
            {
                id: `s2_stat_card_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 16, y: 135, w: 388, h: 60,
                props: { backgroundColor: '#f8fafc', borderRadius: 8, borderColor: '#cbd5e1', borderWidth: 1 }
            },
            {
                id: `s2_cur_stat_${ts}`, type: 'VARIABLE_TEXT',
                x: 28, y: 152, w: 360, h: 26,
                props: { prefix: 'CURRENT STATUS: ', variableName: 'Machine_Status', fontSize: 14, fontWeight: 'bold', color: '#0f172a' }
            },
            // Parts Counters
            {
                id: `s2_good_lbl_${ts}`, type: 'TEXT',
                x: 16, y: 210, w: 185, h: 20,
                props: { text: '✅ Good Parts (Actual)', fontSize: 12, fontWeight: 'bold', color: '#16a34a' }
            },
            {
                id: `s2_good_val_${ts}`, type: 'TEXT_INPUT',
                x: 16, y: 232, w: 185, h: 48,
                props: { label: '', targetVariable: 'Good_Parts', inputType: 'number', fontSize: 22, fontWeight: 'bold', textAlign: 'center' }
            },
            {
                id: `s2_good_btn_${ts}`, type: 'BUTTON',
                x: 16, y: 286, w: 185, h: 40,
                props: {
                    label: '+1 GOOD PART', text: '+1 GOOD PART', backgroundColor: '#16a34a', color: 'white', fontSize: 12, fontWeight: 'bold',
                    triggers: [{ name: 'AddGood', event: 'ON_CLICK', actions: [{ type: 'SET_VARIABLE', payload: { variable: 'Good_Parts', valueType: 'EXPRESSION', value: 'Number(@Good_Parts) + 1' } }] }]
                }
            },
            {
                id: `s2_def_lbl_${ts}`, type: 'TEXT',
                x: 219, y: 210, w: 185, h: 20,
                props: { text: '❌ Defect Parts', fontSize: 12, fontWeight: 'bold', color: '#dc2626' }
            },
            {
                id: `s2_def_val_${ts}`, type: 'TEXT_INPUT',
                x: 219, y: 232, w: 185, h: 48,
                props: { label: '', targetVariable: 'Defect_Parts', inputType: 'number', fontSize: 22, fontWeight: 'bold', textAlign: 'center' }
            },
            {
                id: `s2_def_btn_${ts}`, type: 'BUTTON',
                x: 219, y: 286, w: 185, h: 40,
                props: {
                    label: '+1 DEFECT', text: '+1 DEFECT', backgroundColor: '#dc2626', color: 'white', fontSize: 12, fontWeight: 'bold',
                    triggers: [{ name: 'AddDefect', event: 'ON_CLICK', actions: [{ type: 'SET_VARIABLE', payload: { variable: 'Defect_Parts', valueType: 'EXPRESSION', value: 'Number(@Defect_Parts) + 1' } }] }]
                }
            },
            // KPI Summary Row
            {
                id: `s2_yield_box_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 16, y: 345, w: 185, h: 70,
                props: { backgroundColor: '#eff6ff', borderRadius: 8, borderColor: '#bfdbfe', borderWidth: 1 }
            },
            {
                id: `s2_yield_txt_${ts}`, type: 'VARIABLE_TEXT',
                x: 24, y: 365, w: 170, h: 30,
                props: { prefix: 'Yield: ', suffix: '%', variableName: 'Yield_Pct', fontSize: 16, fontWeight: 'bold', color: '#1d4ed8' }
            },
            {
                id: `s2_cyc_box_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 219, y: 345, w: 185, h: 70,
                props: { backgroundColor: '#f0fdf4', borderRadius: 8, borderColor: '#bbf7d0', borderWidth: 1 }
            },
            {
                id: `s2_cyc_txt_${ts}`, type: 'VARIABLE_TEXT',
                x: 227, y: 365, w: 170, h: 30,
                props: { prefix: 'Cycle: ', suffix: ' s', variableName: 'Cycle_Time', fontSize: 16, fontWeight: 'bold', color: '#15803d' }
            },
            {
                id: `s2_next_btn_${ts}`, type: 'BUTTON',
                x: 16, y: 440, w: 388, h: 50,
                props: {
                    label: 'VIEW ANALYTICS & TIMELINE 📊',
                    text: 'VIEW ANALYTICS & TIMELINE 📊',
                    backgroundColor: '#3b82f6', color: 'white', fontSize: 13, fontWeight: 'bold',
                    triggers: [{ name: 'GotoAnalytics', event: 'ON_CLICK', actions: [{ type: 'GOTO_STEP', payload: { stepIndex: 3 } }] }]
                }
            }
        ]
    };

    // Step 3: Downtime Reason Picker
    const step3 = {
        id: `step3_${ts}`,
        title: '3. Select Downtime Reason',
        stepType: 'Step',
        components: [
            {
                id: `s3_bg_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 420, h: 64,
                props: { backgroundColor: '#991b1b', borderRadius: 0 }
            },
            {
                id: `s3_title_${ts}`, type: 'TEXT',
                x: 16, y: 18, w: 388, h: 28,
                props: { text: '⚠️ Machine Downtime Root Cause', fontSize: 15, color: 'white', fontWeight: 'bold' }
            },
            {
                id: `s3_inst_${ts}`, type: 'TEXT',
                x: 16, y: 80, w: 388, h: 30,
                props: { text: 'Pilih alasan downtime mesin saat ini untuk Pareto analysis:', fontSize: 12, color: '#64748b' }
            },
            {
                id: `s3_r1_btn_${ts}`, type: 'BUTTON',
                x: 16, y: 120, w: 388, h: 48,
                props: {
                    label: '🔧 Mechanical / Tool Breakdown', text: '🔧 Mechanical / Tool Breakdown', backgroundColor: '#ef4444', color: 'white', fontSize: 13, fontWeight: 'bold',
                    triggers: [{ name: 'R1', event: 'ON_CLICK', actions: [{ type: 'SET_VARIABLE', payload: { variable: 'Downtime_Reason', value: 'Tool Breakdown' } }, { type: 'GOTO_STEP', payload: { stepIndex: 1 } }] }]
                }
            },
            {
                id: `s3_r2_btn_${ts}`, type: 'BUTTON',
                x: 16, y: 180, w: 388, h: 48,
                props: {
                    label: '📦 Material Shortage / Part Missing', text: '📦 Material Shortage / Part Missing', backgroundColor: '#f97316', color: 'white', fontSize: 13, fontWeight: 'bold',
                    triggers: [{ name: 'R2', event: 'ON_CLICK', actions: [{ type: 'SET_VARIABLE', payload: { variable: 'Downtime_Reason', value: 'Material Shortage' } }, { type: 'GOTO_STEP', payload: { stepIndex: 1 } }] }]
                }
            },
            {
                id: `s3_r3_btn_${ts}`, type: 'BUTTON',
                x: 16, y: 240, w: 388, h: 48,
                props: {
                    label: '🔄 Setup & Changeover Delay', text: '🔄 Setup & Changeover Delay', backgroundColor: '#8b5cf6', color: 'white', fontSize: 13, fontWeight: 'bold',
                    triggers: [{ name: 'R3', event: 'ON_CLICK', actions: [{ type: 'SET_VARIABLE', payload: { variable: 'Downtime_Reason', value: 'Setup & Changeover' } }, { type: 'GOTO_STEP', payload: { stepIndex: 1 } }] }]
                }
            },
            {
                id: `s3_r4_btn_${ts}`, type: 'BUTTON',
                x: 16, y: 300, w: 388, h: 48,
                props: {
                    label: '⚙️ Operator Absence / Break', text: '⚙️ Operator Absence / Break', backgroundColor: '#64748b', color: 'white', fontSize: 13, fontWeight: 'bold',
                    triggers: [{ name: 'R4', event: 'ON_CLICK', actions: [{ type: 'SET_VARIABLE', payload: { variable: 'Downtime_Reason', value: 'Operator Break' } }, { type: 'GOTO_STEP', payload: { stepIndex: 1 } }] }]
                }
            },
            {
                id: `s3_back_btn_${ts}`, type: 'BUTTON',
                x: 16, y: 380, w: 388, h: 48,
                props: {
                    label: 'KEMBALI KE TERMINAL ◀', text: 'KEMBALI KE TERMINAL ◀', backgroundColor: '#334155', color: 'white', fontSize: 12, fontWeight: 'bold',
                    triggers: [{ name: 'Back', event: 'ON_CLICK', actions: [{ type: 'GOTO_STEP', payload: { stepIndex: 1 } }] }]
                }
            }
        ]
    };

    // Step 4: Analytics & Event History
    const step4 = {
        id: `step4_${ts}`,
        title: '4. Analytics & Event History',
        stepType: 'Step',
        components: [
            {
                id: `s4_bg_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 420, h: 64,
                props: { backgroundColor: '#0f172a', borderRadius: 0 }
            },
            {
                id: `s4_title_${ts}`, type: 'TEXT',
                x: 16, y: 18, w: 388, h: 28,
                props: { text: '📈 Machine Analytics & Event History', fontSize: 15, color: 'white', fontWeight: 'bold' }
            },
            {
                id: `s4_kpi1_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 16, y: 80, w: 185, h: 80,
                props: { backgroundColor: '#f0fdf4', borderRadius: 8, borderColor: '#86efac', borderWidth: 1 }
            },
            {
                id: `s4_kpi1_t_${ts}`, type: 'TEXT',
                x: 26, y: 92, w: 165, h: 20,
                props: { text: 'UPTIME: 84.5%', fontSize: 14, fontWeight: 'bold', color: '#16a34a' }
            },
            {
                id: `s4_kpi1_sub_${ts}`, type: 'TEXT',
                x: 26, y: 118, w: 165, h: 30,
                props: { text: 'Active Running: 6.76 hrs', fontSize: 10, color: '#64748b' }
            },
            {
                id: `s4_kpi2_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 219, y: 80, w: 185, h: 80,
                props: { backgroundColor: '#fef2f2', borderRadius: 8, borderColor: '#fca5a5', borderWidth: 1 }
            },
            {
                id: `s4_kpi2_t_${ts}`, type: 'TEXT',
                x: 229, y: 92, w: 165, h: 20,
                props: { text: 'DOWNTIME: 15.5%', fontSize: 14, fontWeight: 'bold', color: '#dc2626' }
            },
            {
                id: `s4_kpi2_sub_${ts}`, type: 'TEXT',
                x: 229, y: 118, w: 165, h: 30,
                props: { text: 'Total Lost: 1.24 hrs', fontSize: 10, color: '#64748b' }
            },
            {
                id: `s4_hist_lbl_${ts}`, type: 'TEXT',
                x: 16, y: 180, w: 388, h: 20,
                props: { text: '📋 Station Activity Event Logs:', fontSize: 13, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `s4_tbl_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 16, y: 210, w: 388, h: 180,
                props: { tableId: T.stationHistory, limit: 5 }
            },
            {
                id: `s4_back_btn_${ts}`, type: 'BUTTON',
                x: 16, y: 410, w: 388, h: 48,
                props: {
                    label: '◀ KEMBALI KE PRODUKSI', text: '◀ KEMBALI KE PRODUKSI', backgroundColor: '#2563eb', color: 'white', fontSize: 13, fontWeight: 'bold',
                    triggers: [{ name: 'BackMain', event: 'ON_CLICK', actions: [{ type: 'GOTO_STEP', payload: { stepIndex: 1 } }] }]
                }
            }
        ]
    };

    return {
        id: `app_machine_activity_${ts}`,
        name: 'Machine Activity & Yield Tracker (Mobile)',
        description: 'Frontline mobile app for manually logging machine activity (Running, Down, Idle, Off, Setup), tracking good/bad parts, and calculating real-time Yield, Planned Takt Time, and Cycle Time.',
        category: 'Mobile',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            devicePreset: 'PHONE_APP_INVENTOR',
            previewOrientation: 'PORTRAIT',
            scalingMode: 'FIT_SCREEN',
            appVariables,
            recordPlaceholders: [
                {
                    id: `rp_station_${ts}`,
                    name: 'Current Station Activity',
                    tableId: T.stationHistory,
                    fieldMappings: {
                        'Order_ID': 'Order_ID',
                        'Operation_Duration_Hr': 'Operation_Duration_Hr',
                        'Product_Demand': 'Product_Demand',
                        'Planned_Takt_Time_Sec': 'Planned_Takt_Time',
                        'Machine_Status': 'Machine_Status',
                        'Actual_Good_Parts': 'Good_Parts',
                        'Defect_Parts': 'Defect_Parts',
                        'Yield_Rate': 'Yield_Pct',
                        'Cycle_Time_Sec': 'Cycle_Time',
                        'Station_ID': 'Station_ID',
                        'Operator': 'Operator'
                    }
                }
            ],
            appTables: [T.stationHistory],
            appTriggers: [],
            steps: [step1, step2, step3, step4]
        }
    };
}
