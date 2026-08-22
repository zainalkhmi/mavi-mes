/**
 * KonvaTerminalTemplate.js
 * High Performance Industrial Terminal Template using Konva.js
 */

export function createKonvaTerminalTemplate() {
    const ts = Date.now();

    return {
        id: `konva_hmi_${ts}`,
        name: 'Konva HMI Dashboard',
        category: 'Industrial HMI',
        description: 'High-performance industrial HMI dashboard with Konva.js canvas rendering (60fps)',
        thumbnail: null,

        // Design canvas dimensions
        designWidth: 1920,
        designHeight: 1080,

        // Konva-specific settings
        useKonva: true,
        engine: 'konva',

        // Variables
        variables: [
            // System
            { id: `sys_status_${ts}`, name: 'System Status', type: 'number', defaultValue: 1, min: 0, max: 1, unit: '' },
            { id: `sys_time_${ts}`, name: 'System Time', type: 'string', defaultValue: '' },

            // Motor/PLC
            { id: `motor_rpm_${ts}`, name: 'Motor RPM', type: 'number', defaultValue: 1500, min: 0, max: 3000, unit: 'RPM' },
            { id: `motor_current_${ts}`, name: 'Motor Current', type: 'number', defaultValue: 12.5, min: 0, max: 25, unit: 'A' },
            { id: `motor_status_${ts}`, name: 'Motor Status', type: 'number', defaultValue: 1, min: 0, max: 1 },
            { id: `motor_speed_sp_${ts}`, name: 'Speed Setpoint', type: 'number', defaultValue: 60, min: 0, max: 100, unit: '%' },

            // Sensors
            { id: `temp_${ts}`, name: 'Temperature', type: 'number', defaultValue: 45, min: 0, max: 100, unit: '°C' },
            { id: `pressure_${ts}`, name: 'Pressure', type: 'number', defaultValue: 120, min: 0, max: 200, unit: 'PSI' },
            { id: `flow_rate_${ts}`, name: 'Flow Rate', type: 'number', defaultValue: 85, min: 0, max: 150, unit: 'L/min' },
            { id: `level_${ts}`, name: 'Tank Level', type: 'number', defaultValue: 75, min: 0, max: 100, unit: '%' },

            // Production
            { id: `total_output_${ts}`, name: 'Total Output', type: 'number', defaultValue: 1247, min: 0, max: 9999, unit: 'pcs' },
            { id: `target_output_${ts}`, name: 'Target Output', type: 'number', defaultValue: 1500, min: 0, max: 9999, unit: 'pcs' },
            { id: `cycle_count_${ts}`, name: 'Cycle Count', type: 'number', defaultValue: 156, min: 0, max: 9999 },
            { id: `uptime_${ts}`, name: 'Uptime', type: 'number', defaultValue: 8.5, min: 0, max: 24, unit: 'hrs' },

            // OEE
            { id: `availability_${ts}`, name: 'Availability', type: 'number', defaultValue: 92, min: 0, max: 100, unit: '%' },
            { id: `performance_${ts}`, name: 'Performance', type: 'number', defaultValue: 87, min: 0, max: 100, unit: '%' },
            { id: `quality_${ts}`, name: 'Quality', type: 'number', defaultValue: 98, min: 0, max: 100, unit: '%' },

            // Status flags
            { id: `conveyor_status_${ts}`, name: 'Conveyor Status', type: 'number', defaultValue: 1, min: 0, max: 1 },
            { id: `sensor_status_${ts}`, name: 'Sensor Status', type: 'number', defaultValue: 1, min: 0, max: 1 },
            { id: `valve_status_${ts}`, name: 'Valve Status', type: 'number', defaultValue: 1, min: 0, max: 1 },
            { id: `alarm_count_${ts}`, name: 'Alarm Count', type: 'number', defaultValue: 0, min: 0, max: 99 },

            // Alarm messages
            { id: `alarm_1_${ts}`, name: 'Alarm 1', type: 'string', defaultValue: '' },
            { id: `alarm_2_${ts}`, name: 'Alarm 2', type: 'string', defaultValue: '' },
            { id: `alarm_3_${ts}`, name: 'Alarm 3', type: 'string', defaultValue: '' },
        ],

        // PLC Tags mapping
        plcTags: [
            { tagId: `motor_rpm_${ts}`, plcAddress: 'DB1.DBD0', protocol: 'modbus', dataType: 'REAL' },
            { tagId: `motor_current_${ts}`, plcAddress: 'DB1.DBD4', protocol: 'modbus', dataType: 'REAL' },
            { tagId: `motor_status_${ts}`, plcAddress: 'DB1.DBX8.0', protocol: 'modbus', dataType: 'BOOL' },
            { tagId: `temp_${ts}`, plcAddress: 'DB2.DBD0', protocol: 'modbus', dataType: 'REAL' },
            { tagId: `pressure_${ts}`, plcAddress: 'DB2.DBD4', protocol: 'modbus', dataType: 'REAL' },
            { id: `flow_rate_${ts}`, plcAddress: 'DB2.DBD8', protocol: 'modbus', dataType: 'REAL' },
            { tagId: `level_${ts}`, plcAddress: 'DB2.DBD12', protocol: 'modbus', dataType: 'REAL' },
        ],

        // Component configuration
        components: [
            {
                id: `header_${ts}`,
                type: 'KONVA_HEADER',
                x: 0, y: 0, w: 1920, h: 80,
                props: {
                    backgroundColor: '#1e293b',
                    title: '🏭 INDUSTRIAL HMI DASHBOARD',
                    showStatus: true,
                    showTime: true
                }
            },
            {
                id: `gauge_temp_${ts}`,
                type: 'KONVA_GAUGE',
                x: 100, y: 150, w: 400, h: 320,
                props: {
                    title: 'TEMPERATURE',
                    icon: '🌡️',
                    variable: `temp_${ts}`,
                    min: 0,
                    max: 100,
                    unit: '°C',
                    warningThreshold: 70,
                    criticalThreshold: 85,
                    gaugeColor: '#ef4444'
                }
            },
            {
                id: `gauge_pressure_${ts}`,
                type: 'KONVA_GAUGE',
                x: 550, y: 150, w: 400, h: 320,
                props: {
                    title: 'PRESSURE',
                    icon: '⚡',
                    variable: `pressure_${ts}`,
                    min: 0,
                    max: 200,
                    unit: 'PSI',
                    warningThreshold: 150,
                    criticalThreshold: 180,
                    gaugeColor: '#f59e0b'
                }
            },
            {
                id: `gauge_rpm_${ts}`,
                type: 'KONVA_GAUGE',
                x: 1000, y: 150, w: 400, h: 320,
                props: {
                    title: 'MOTOR SPEED',
                    icon: '🔄',
                    variable: `motor_rpm_${ts}`,
                    min: 0,
                    max: 3000,
                    unit: 'RPM',
                    warningThreshold: 2500,
                    criticalThreshold: 2800,
                    gaugeColor: '#22c55e'
                }
            },
            {
                id: `status_panel_${ts}`,
                type: 'KONVA_STATUS_PANEL',
                x: 1450, y: 150, w: 420, h: 320,
                props: {
                    title: 'SYSTEM STATUS',
                    items: [
                        { label: 'Motor', variable: `motor_status_${ts}` },
                        { label: 'Conveyor', variable: `conveyor_status_${ts}` },
                        { label: 'Sensor', variable: `sensor_status_${ts}` },
                        { label: 'Valve', variable: `valve_status_${ts}` },
                    ]
                }
            },
            {
                id: `production_counter_${ts}`,
                type: 'KONVA_COUNTER',
                x: 100, y: 520, w: 550, h: 200,
                props: {
                    title: 'PRODUCTION COUNTER',
                    currentVariable: `total_output_${ts}`,
                    targetVariable: `target_output_${ts}`,
                    unit: 'pcs'
                }
            },
            {
                id: `oee_panel_${ts}`,
                type: 'KONVA_OEE',
                x: 700, y: 520, w: 550, h: 200,
                props: {
                    title: 'OEE METRICS',
                    availabilityVariable: `availability_${ts}`,
                    performanceVariable: `performance_${ts}`,
                    qualityVariable: `quality_${ts}`
                }
            },
            {
                id: `alarm_panel_${ts}`,
                type: 'KONVA_ALARM_PANEL',
                x: 1300, y: 520, w: 570, h: 200,
                props: {
                    title: 'ACTIVE ALARMS',
                    maxAlarms: 5,
                    alarmVariables: [
                        `alarm_1_${ts}`,
                        `alarm_2_${ts}`,
                        `alarm_3_${ts}`
                    ]
                }
            },
            {
                id: `footer_${ts}`,
                type: 'KONVA_FOOTER',
                x: 0, y: 1030, w: 1920, h: 50,
                props: {
                    text: 'MANDOR Industrial HMI | Konva.js Canvas Engine',
                    showFps: true
                }
            }
        ],

        // Rendering settings
        renderSettings: {
            targetFps: 60,
            enableDirtyRect: true,
            enableWebGL: true,
            useOffscreenCanvas: true,
            batchUpdates: true,
            debounceMs: 16
        }
    };
}

/**
 * Create a simple gauge template for quick testing
 */
export function createKonvaGaugeTemplate() {
    const ts = Date.now();

    return {
        id: `konva_gauge_${ts}`,
        name: 'Konva Single Gauge',
        category: 'Industrial HMI',
        description: 'Single gauge display with Konva.js',
        designWidth: 400,
        designHeight: 400,
        useKonva: true,

        variables: [
            { id: `value_${ts}`, name: 'Value', type: 'number', defaultValue: 50, min: 0, max: 100, unit: '%' }
        ],

        components: [
            {
                id: `gauge_${ts}`,
                type: 'KONVA_GAUGE',
                x: 0, y: 0, w: 400, h: 400,
                props: {
                    title: 'MEASUREMENT',
                    variable: `value_${ts}`,
                    min: 0,
                    max: 100,
                    unit: '%',
                    showTitle: true,
                    showValue: true,
                    showMinMax: true,
                    gaugeStyle: 'arc' // 'arc', 'bar', 'needle'
                }
            }
        ]
    };
}

/**
 * Create a multi-gauge template
 */
export function createKonvaMultiGaugeTemplate() {
    const ts = Date.now();

    return {
        id: `konva_multi_gauge_${ts}`,
        name: 'Konba Multi-Gauge (2x2)',
        category: 'Industrial HMI',
        description: '4 gauges in 2x2 grid layout',
        designWidth: 960,
        designHeight: 640,
        useKonva: true,

        variables: [
            { id: `temp_${ts}`, name: 'Temperature', type: 'number', defaultValue: 45, min: 0, max: 100, unit: '°C' },
            { id: `pressure_${ts}`, name: 'Pressure', type: 'number', defaultValue: 120, min: 0, max: 200, unit: 'PSI' },
            { id: `flow_${ts}`, name: 'Flow Rate', type: 'number', defaultValue: 85, min: 0, max: 150, unit: 'L/min' },
            { id: `level_${ts}`, name: 'Level', type: 'number', defaultValue: 75, min: 0, max: 100, unit: '%' },
        ],

        components: [
            {
                id: `g1_${ts}`,
                type: 'KONVA_GAUGE',
                x: 20, y: 20, w: 440, h: 280,
                props: { title: 'TEMPERATURE', variable: `temp_${ts}`, min: 0, max: 100, unit: '°C' }
            },
            {
                id: `g2_${ts}`,
                type: 'KONVA_GAUGE',
                x: 500, y: 20, w: 440, h: 280,
                props: { title: 'PRESSURE', variable: `pressure_${ts}`, min: 0, max: 200, unit: 'PSI' }
            },
            {
                id: `g3_${ts}`,
                type: 'KONVA_GAUGE',
                x: 20, y: 340, w: 440, h: 280,
                props: { title: 'FLOW RATE', variable: `flow_${ts}`, min: 0, max: 150, unit: 'L/min' }
            },
            {
                id: `g4_${ts}`,
                type: 'KONVA_GAUGE',
                x: 500, y: 340, w: 440, h: 280,
                props: { title: 'LEVEL', variable: `level_${ts}`, min: 0, max: 100, unit: '%' }
            }
        ]
    };
}

export default {
    createKonvaTerminalTemplate,
    createKonvaGaugeTemplate,
    createKonvaMultiGaugeTemplate
};
