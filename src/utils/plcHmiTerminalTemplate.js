/**
 * plcHmiTerminalTemplate.js
 * PLC HMI Control Terminal Template
 */
export function createPlcHmiTerminalTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Motor_Status', type: 'string', defaultValue: 'STOPPED', persisted: false },
        { id: `v2_${ts}`, name: 'Conveyor_Speed_Setpoint', type: 'number', defaultValue: 60, persisted: false },
        { id: `v3_${ts}`, name: 'Tank_Level_Sensor', type: 'number', defaultValue: 4.5, persisted: false },
        { id: `v4_${ts}`, name: 'Pressure_Psi', type: 'number', defaultValue: 120, persisted: false },
        { id: `v5_${ts}`, name: 'Alarm_Message', type: 'string', defaultValue: 'No active alarms', persisted: false }
    ];

    // Record Placeholders
    const R = [];

    // --- STEP 1: Main Control Panel ---
    const stepMain = {
        id: `s_main_${ts}`,
        title: 'HMI Dashboard',
        stepType: 'Step',
        components: [
            // Dark Header rect
            {
                id: `c_header_rect_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 1000, h: 64,
                props: { backgroundColor: '#1e293b', borderRadius: 0 }
            },
            // Title text
            {
                id: `c_header_text_${ts}`, type: 'TEXT',
                x: 20, y: 16, w: 960, h: 32,
                props: { text: '🏭 PLC HMI Control Terminal', fontSize: 22, color: '#ffffff', fontWeight: 'bold', textAlignment: 1 }
            },

            // --- LEFT PANEL: Motor Control & Speed Setpoint Card ---
            {
                id: `c_card_left_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 20, y: 80, w: 460, h: 480,
                props: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }
            },
            {
                id: `c_title_left_${ts}`, type: 'TEXT',
                x: 40, y: 100, w: 420, h: 30,
                props: { text: '⚡ Motor Control & Speed Setpoint', fontSize: 18, fontWeight: 'bold', color: '#1e293b' }
            },

            // Motor Status Displays
            {
                id: `lbl_motor_status_${ts}`, type: 'TEXT',
                x: 40, y: 150, w: 200, h: 20,
                props: { text: 'Motor Status:', fontSize: 12, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `val_motor_status_${ts}`, type: 'VARIABLE_TEXT',
                x: 40, y: 175, w: 200, h: 30,
                props: { varSource: 'Motor_Status', fontSize: 24, fontWeight: 'bold', color: '#1e293b', iotTopicId: 'motor_status_topic' }
            },

            // Start Button
            {
                id: `btn_start_motor_${ts}`, type: 'BUTTON',
                x: 40, y: 220, w: 190, h: 50,
                props: { text: '▶ START MOTOR', backgroundColor: '#10b981', color: '#ffffff', fontWeight: 'bold', mqttPublishTopic: 'plc/conveyor/motor_status', mqttPublishPayload: 'RUNNING' },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        actions: [
                            { type: 'SET_VARIABLE', payload: { variable: 'Motor_Status', value: 'RUNNING' } },
                            { type: 'SHOW_NOTIFICATION', payload: { message: 'PLC Command Sent: Motor running.', msgType: 'success' } }
                        ]
                    }
                ]
            },
            // Stop Button
            {
                id: `btn_stop_motor_${ts}`, type: 'BUTTON',
                x: 250, y: 220, w: 210, h: 50,
                props: { text: '⏹ STOP MOTOR', backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 'bold', mqttPublishTopic: 'plc/conveyor/motor_status', mqttPublishPayload: 'STOPPED' },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        actions: [
                            { type: 'SET_VARIABLE', payload: { variable: 'Motor_Status', value: 'STOPPED' } },
                            { type: 'SHOW_NOTIFICATION', payload: { message: 'PLC Command Sent: Motor stopped.', msgType: 'warning' } }
                        ]
                    }
                ]
            },

            // Speed Setpoint Slider
            {
                id: `lbl_speed_setpoint_${ts}`, type: 'TEXT',
                x: 40, y: 300, w: 420, h: 20,
                props: { text: 'Conveyor Speed Setpoint (RPM):', fontSize: 12, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `slider_speed_${ts}`, type: 'SLIDER',
                x: 40, y: 330, w: 420, h: 50,
                props: { minValue: 0, maxValue: 100, defaultValue: 60, targetVariable: 'Conveyor_Speed_Setpoint', colorLeft: '#3b82f6', colorRight: '#cbd5e1', label: 'Speed Setpoint', mqttPublishTopic: 'plc/conveyor/speed_setpoint' }
            },

            // Speed Setpoint Displays
            {
                id: `lbl_speed_val_${ts}`, type: 'TEXT',
                x: 40, y: 400, w: 200, h: 20,
                props: { text: 'Current Speed Setpoint:', fontSize: 12, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `val_speed_${ts}`, type: 'VARIABLE_TEXT',
                x: 40, y: 425, w: 200, h: 30,
                props: { varSource: 'Conveyor_Speed_Setpoint', fontSize: 24, fontWeight: 'bold', color: '#3b82f6', iotTopicId: 'speed_setpoint_topic' }
            },

            // --- RIGHT PANEL: Telemetry & Alarm Status Card ---
            {
                id: `c_card_right_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 500, y: 80, w: 480, h: 480,
                props: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }
            },
            {
                id: `c_title_right_${ts}`, type: 'TEXT',
                x: 520, y: 100, w: 440, h: 30,
                props: { text: '📈 Telemetry & Alarm Status', fontSize: 18, fontWeight: 'bold', color: '#1e293b' }
            },

            // Tank Level Sensor Gauge
            {
                id: `lbl_tank_gauge_${ts}`, type: 'TEXT',
                x: 520, y: 140, w: 440, h: 20,
                props: { text: 'Tank level sensor (m):', fontSize: 11, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `gauge_tank_${ts}`, type: 'GAUGE',
                x: 520, y: 165, w: 440, h: 90,
                props: {
                    value: '@Tank_Level_Sensor',
                    min: 0,
                    max: 10,
                    unit: ' m',
                    color: '#10b981',
                    label: 'Liquid Level',
                    iotTopicId: 'tank_level_topic'
                }
            },

            // Pressure Gauge Sensor
            {
                id: `lbl_pressure_gauge_${ts}`, type: 'TEXT',
                x: 520, y: 270, w: 440, h: 20,
                props: { text: 'System pressure (PSI):', fontSize: 11, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `gauge_pressure_${ts}`, type: 'GAUGE',
                x: 520, y: 295, w: 440, h: 90,
                props: {
                    value: '@Pressure_Psi',
                    min: 0,
                    max: 200,
                    unit: ' PSI',
                    color: '#ef4444',
                    label: 'Pressure',
                    iotTopicId: 'pressure_topic'
                }
            },

            // Alarm Message Displays
            {
                id: `lbl_alarm_msg_${ts}`, type: 'TEXT',
                x: 520, y: 400, w: 440, h: 20,
                props: { text: 'Active Alarm Status:', fontSize: 11, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `val_alarm_msg_${ts}`, type: 'VARIABLE_TEXT',
                x: 520, y: 425, w: 440, h: 30,
                props: { varSource: 'Alarm_Message', fontSize: 16, fontWeight: 'bold', color: '#ef4444', iotTopicId: 'alarm_topic' }
            },

            // Reset Alarm Button
            {
                id: `btn_reset_alarm_${ts}`, type: 'BUTTON',
                x: 520, y: 470, w: 440, h: 50,
                props: { text: '🚨 RESET SYSTEM ALARMS', backgroundColor: '#f97316', color: '#ffffff', fontWeight: 'bold', mqttPublishTopic: 'plc/conveyor/alarm', mqttPublishPayload: 'No active alarms' },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        actions: [
                            { type: 'SET_VARIABLE', payload: { variable: 'Alarm_Message', value: 'No active alarms' } },
                            { type: 'SHOW_NOTIFICATION', payload: { message: 'Alarms cleared and reset successfully.', msgType: 'success' } }
                        ]
                    }
                ]
            }
        ]
    };

    return {
        id: `app_plc_hmi_${ts}`,
        name: 'PLC HMI Control Terminal',
        description: 'Interactive HMI dashboard for PLC monitoring and control, featuring gauges, speed setpoint slider, motor controls, and signal telemetry.',
        category: 'SmartHome / IoT',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [],
            appTriggers: [],
            steps: [stepMain],
            automations: [],
            functions: [],
            linkedTables: {},
            iotConfig: {
                brokerUrl: 'wss://broker.emqx.io:8084/mqtt',
                topics: [
                    { id: 'motor_status_topic', topic: 'plc/conveyor/motor_status' },
                    { id: 'speed_setpoint_topic', topic: 'plc/conveyor/speed_setpoint' },
                    { id: 'tank_level_topic', topic: 'plc/conveyor/tank_level' },
                    { id: 'pressure_topic', topic: 'plc/conveyor/pressure' },
                    { id: 'alarm_topic', topic: 'plc/conveyor/alarm' }
                ]
            }
        }
    };
}
