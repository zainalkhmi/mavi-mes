/**
 * smartHomeTemplate.js
 * SmartHome IoT Control Center Template
 */
export function createSmartHomeTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Security_Status', type: 'string', defaultValue: 'DISARMED', persisted: true },
        { id: `v2_${ts}`, name: 'Smart_System_Logs', type: 'string', defaultValue: 'System active. No alerts.', persisted: false },
        { id: `v3_${ts}`, name: 'Power_Usage_KW', type: 'number', defaultValue: 1.45, persisted: false }
    ];

    // Record Placeholders
    const R = [];

    // --- STEP 1: Main Control Panel ---
    const stepMain = {
        id: `s_main_${ts}`,
        title: 'SmartHome Panel',
        stepType: 'Step',
        components: [
            // Dark Header rect
            {
                id: `c_header_rect_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 0, y: 0, w: 1000, h: 64,
                props: { backgroundColor: '#0f172a', borderRadius: 0 }
            },
            // Title text
            {
                id: `c_header_text_${ts}`, type: 'TEXT',
                x: 20, y: 16, w: 960, h: 32,
                props: { text: '🏠 SmartHome IoT Control Center', fontSize: 22, color: '#ffffff', fontWeight: 'bold', textAlignment: 1 }
            },

            // --- LEFT PANEL: Living Room Devices Card ---
            {
                id: `c_card_left_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 20, y: 80, w: 460, h: 480,
                props: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }
            },
            {
                id: `c_title_left_${ts}`, type: 'TEXT',
                x: 40, y: 100, w: 420, h: 30,
                props: { text: '🛋️ Living Room Devices', fontSize: 18, fontWeight: 'bold', color: '#1e293b' }
            },

            // SMARTHOME_DEVICE: Air Conditioner (BARDI)
            {
                id: `dev_ac_${ts}`, type: 'SMARTHOME_DEVICE',
                x: 40, y: 140, w: 200, h: 140,
                props: {
                    deviceName: 'Living Room AC',
                    deviceBrand: 'BARDI',
                    deviceType: 'AIR_CON',
                    on: true,
                    temperature: 22,
                    mqttTopic: 'bardi/living_room_ac/state',
                    mqttPublishTopic: 'bardi/living_room_ac/set'
                }
            },
            // SMARTHOME_DEVICE: Ceiling Bulb (TUYA)
            {
                id: `dev_bulb_${ts}`, type: 'SMARTHOME_DEVICE',
                x: 260, y: 140, w: 200, h: 140,
                props: {
                    deviceName: 'Ceiling Bulb',
                    deviceBrand: 'TUYA',
                    deviceType: 'BULB',
                    on: true,
                    brightness: 80,
                    mqttTopic: 'tuya/ceiling_bulb/state',
                    mqttPublishTopic: 'tuya/ceiling_bulb/set'
                }
            },
            // SMARTHOME_DEVICE: TV Plug Switch (SONOFF)
            {
                id: `dev_plug_${ts}`, type: 'SMARTHOME_DEVICE',
                x: 40, y: 300, w: 200, h: 140,
                props: {
                    deviceName: 'TV Power Outlet',
                    deviceBrand: 'SONOFF',
                    deviceType: 'SWITCH',
                    on: false,
                    mqttTopic: 'sonoff/tv_outlet/state',
                    mqttPublishTopic: 'sonoff/tv_outlet/set'
                }
            },
            // Button: All Lights Off
            {
                id: `btn_all_off_${ts}`, type: 'BUTTON',
                x: 260, y: 300, w: 200, h: 44,
                props: { text: '💡 All Lights Off', backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        actions: [
                            { type: 'SHOW_NOTIFICATION', payload: { message: 'Switching off all lights...', msgType: 'success' } }
                        ]
                    }
                ]
            },
            // Variable Text display for Status
            {
                id: `txt_logs_lbl_${ts}`, type: 'TEXT',
                x: 40, y: 460, w: 420, h: 20,
                props: { text: 'System Logs:', fontSize: 11, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `txt_logs_val_${ts}`, type: 'VARIABLE_TEXT',
                x: 40, y: 485, w: 420, h: 30,
                props: { variableName: 'Smart_System_Logs', fontSize: 12, color: '#0f172a' }
            },

            // --- RIGHT PANEL: Security & Sensors Card ---
            {
                id: `c_card_right_${ts}`, type: 'SHAPE_RECTANGLE',
                x: 500, y: 80, w: 480, h: 480,
                props: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }
            },
            {
                id: `c_title_right_${ts}`, type: 'TEXT',
                x: 520, y: 100, w: 440, h: 30,
                props: { text: '🛡️ Security & Sensors', fontSize: 18, fontWeight: 'bold', color: '#1e293b' }
            },

            // TUYA_PRODUCT: Door Lock
            {
                id: `dev_lock_${ts}`, type: 'TUYA_PRODUCT',
                x: 520, y: 140, w: 200, h: 200,
                props: {
                    deviceName: 'Front Door Lock',
                    productCase: 'LOCK',
                    locked: true,
                    mqttTopic: 'tuya/door_lock/state',
                    mqttPublishTopic: 'tuya/door_lock/set'
                }
            },
            // TUYA_PRODUCT: Motion Sensor
            {
                id: `dev_sensor_${ts}`, type: 'TUYA_PRODUCT',
                x: 740, y: 140, w: 220, h: 200,
                props: {
                    deviceName: 'Hallway Motion',
                    productCase: 'SENSOR',
                    mqttTopic: 'tuya/motion/state'
                }
            },

            // Button: Toggle Security
            {
                id: `btn_arm_sec_${ts}`, type: 'BUTTON',
                x: 520, y: 360, w: 200, h: 44,
                props: { text: '🔒 ARM SECURITY', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        actions: [
                            { type: 'SET_VARIABLE', payload: { variable: 'Security_Status', value: 'ARMED' } },
                            { type: 'SET_VARIABLE', payload: { variable: 'Smart_System_Logs', value: 'Security Armed at ' + iso } },
                            { type: 'SHOW_NOTIFICATION', payload: { message: 'Home security system is now ARMED!', msgType: 'success' } }
                        ]
                    }
                ]
            },
            // Button: Disarm Security
            {
                id: `btn_disarm_sec_${ts}`, type: 'BUTTON',
                x: 740, y: 360, w: 220, h: 44,
                props: { text: '🔓 DISARM', backgroundColor: '#e2e8f0', color: '#0f172a', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK',
                        actions: [
                            { type: 'SET_VARIABLE', payload: { variable: 'Security_Status', value: 'DISARMED' } },
                            { type: 'SET_VARIABLE', payload: { variable: 'Smart_System_Logs', value: 'Security Disarmed at ' + iso } },
                            { type: 'SHOW_NOTIFICATION', payload: { message: 'Security system is now DISARMED.', msgType: 'warning' } }
                        ]
                    }
                ]
            },

            // Power Gauge display
            {
                id: `lbl_gauge_${ts}`, type: 'TEXT',
                x: 520, y: 430, w: 200, h: 20,
                props: { text: 'Home Power Usage (kW)', fontSize: 11, color: '#64748b', fontWeight: 'bold' }
            },
            {
                id: `gauge_power_${ts}`, type: 'GAUGE',
                x: 520, y: 455, w: 440, h: 80,
                props: {
                    value: 1.45,
                    min: 0,
                    max: 10,
                    unit: ' kW',
                    color: '#eab308',
                    label: 'Grid Power Draw'
                }
            }
        ]
    };

    return {
        id: `app_smarthome_${ts}`,
        name: 'SmartHome Control Center',
        description: 'Command and monitor smart switches, lighting, thermostats, cameras, locks, and vacuums in real-time.',
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
            linkedTables: {}
        }
    };
}
