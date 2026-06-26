// Categorized components and constant arrays extracted from AppBuilder.jsx
import {
    MousePointer2, Home, Activity, Database, BarChart2, Shapes, Music,
    Wifi, LayoutDashboard, Ruler, Factory, Car, Cpu
} from 'lucide-react';

export const CATEGORIZED_COMPONENTS = {
    // 1. All visible UI widgets - inputs, displays, pickers
    USER_INTERFACE: {
        label: 'Interface',
        icon: MousePointer2,
        color: '#3b82f6',
        types: [
            'BUTTON', 'TEXT', 'TEXT_INPUT', 'PASSWORD_TEXT', 'BOOLEAN_TOGGLE', 'CHECKBOX',
            'SLIDER', 'DROPDOWN', 'MULTI_SELECT', 'LIST_PICKER', 'LIST_VIEW',
            'DATE_PICKER', 'DATETIME_PICKER', 'IMAGE', 'EMBED_WEB', 'VIDEO_PLAYER',
            'FILE_PICKER', 'IMAGE_PICKER', 'SIGNATURE_PAD', 'SIGNATURE',
            'NOTIFIER', 'CUSTOM_WIDGET', 'PRINT_AREA', 'KEYBOARD_PRO', 'NUMPAD'
        ]
    },
    SMARTHOME: {
        label: 'Smart Home',
        icon: Home,
        color: '#10b981',
        types: ['SMARTHOME_DEVICE', 'TUYA_PRODUCT']
    },
    QUALITY: {
        label: 'Quality & Inspection',
        icon: Activity,
        color: '#f59e0b',
        types: [
            'CHECKLIST', 'QUALITY_TOLERANCE', 'QUALITY_PASS_FAIL', 'CAMERA_CAPTURE', 'OPENCV_CAMERA', 'RADIO_GROUP', 'VARIABLE_TEXT'
        ]
    },
    // 2. Tables, records, storage
    DATA: {
        label: 'Data',
        icon: Database,
        color: '#10b981',
        types: [
            'INTERACTIVE_TABLE', 'TABLE_AGGREGATION', 'RECORD_DISPLAY',
            'CLOUD_DB', 'TINY_DB', 'TINY_WEB_DB', 'DATA_FILE', 'FILE', 'SPREADSHEET'
        ]
    },
    // 3. Charts and Maps together
    CHARTS_MAPS: {
        label: 'Charts & Maps',
        icon: BarChart2,
        color: '#8b5cf6',
        types: [
            'CHART', 'CHART_DATA_2D', 'TRENDLINE', 'ANOMALY_DETECTION', 'REGRESSION',
            'MAP', 'MARKER', 'CIRCLE', 'POLYGON', 'RECTANGLE', 'LINE_STRING', 'FEATURE_COLLECTION', 'NAVIGATION'
        ]
    },
    // 4. Shapes via ShapePicker + Drawing
    SHAPES: {
        label: 'Shapes',
        icon: Shapes,
        color: '#f59e0b',
        types: ['CANVAS', 'BALL', 'IMAGE_SPRITE']
    },
    // 5. Camera, audio, media
    MEDIA: {
        label: 'Media',
        icon: Music,
        color: '#ec4899',
        types: ['CAMERA', 'CAMCORDER', 'PLAYER', 'SOUND', 'SOUND_RECORDER', 'SPEECH_RECOGNIZER', 'TEXT_TO_SPEECH', 'VIDEO_PLAYER']
    },
    // 6. Device sensors
    SENSORS: {
        label: 'Sensors',
        icon: Activity,
        color: '#ef4444',
        types: ['ACCELEROMETER', 'BARCODE_SCANNER', 'BAROMETER', 'CLOCK', 'GYROSCOPE_SENSOR', 'HYGROMETER', 'LIGHT_SENSOR', 'LOCATION_SENSOR', 'MAGNETIC_FIELD_SENSOR', 'NEAR_FIELD', 'ORIENTATION_SENSOR', 'PEDOMETER', 'PROXIMITY_SENSOR', 'THERMOMETER']
    },
    // 7. Network, social, Bluetooth
    CONNECTIVITY: {
        label: 'Connectivity',
        icon: Wifi,
        color: '#0ea5e9',
        types: [
            'ACTIVITY_STARTER', 'BLUETOOTH_CLIENT', 'BLUETOOTH_SERVER', 'SERIAL', 'WEB',
            'CONTACT_PICKER', 'EMAIL_PICKER', 'PHONE_CALL', 'PHONE_NUMBER_PICKER', 'SHARING', 'TEXTING'
        ]
    },
    // 8. Embedded Widgets
    EMBEDDED_WIDGETS: {
        label: 'Embedded',
        icon: LayoutDashboard,
        color: '#6366f1',
        types: [
            'ANALYTIC', 'VIDEO', 'DOCUMENT', 'AI_CHAT', 'CAD_VIEWER', 'WEBPAGE',
            'GRID', 'MACHINE_ATTRIBUTE', 'MACHINE_STATUS', 'MACHINE_TIMELINE',
            'BARCODE', 'STEP_TIME', 'PAYMENT_GATEWAY'
        ]
    },
    MEASUREMENT: {
        label: 'Measurement',
        icon: Ruler,
        color: '#f43f5e',
        types: ['VISION_MEASUREMENT', 'MEASUREMENT_WIDGET', 'GAUGE', 'DIAL_GAUGE', 'GAUGE_CIRCULAR', 'OUTSIDE_MICROMETER', 'INSIDE_MICROMETER', 'DIAL_HEIGHT_GAUGE', 'DEPTH_GAUGE', 'ROUGHNESS_TESTER', 'TORQUE_WRENCH', 'WEIGHING_SCALE']
    },
    SCADA: {
        label: 'SCADA HMI',
        icon: Activity,
        color: '#06b6d4',
        types: [
            // Process Equipment
            'SCADA_PIPE', 'SCADA_VALVE', 'SCADA_TANK', 'SCADA_PUMP',
            'SCADA_MOTOR', 'SCADA_CONVEYOR', 'SCADA_MIXER', 'SCADA_HEAT_EXCHANGER',
            'SCADA_BOILER', 'SCADA_COMPRESSOR', 'SCADA_CHILLER', 'SCADA_FURNACE', 'SCADA_SILO',
            // Instruments
            'SCADA_PRESSURE_GAUGE', 'SCADA_TEMP_INDICATOR', 'SCADA_FLOW_METER',
            'SCADA_LEVEL_INDICATOR', 'SCADA_PH_METER', 'SCADA_CURRENT_METER',
            'SCADA_VOLTAGE_METER', 'SCADA_POWER_METER',
            // Displays & Inputs
            'SCADA_DIGITAL_DISPLAY', 'SCADA_NUMERIC_INPUT', 'SCADA_SETPOINT_INPUT',
            'SCADA_TREND', 'SCADA_HISTORICAL_TREND', 'SCADA_BAR_GRAPH',
            'SCADA_CIRCULAR_GAUGE', 'SCADA_PROGRESS_BAR', 'SCADA_TANK_LEVEL',
            // Controls
            'SCADA_BTN_START', 'SCADA_BTN_STOP', 'SCADA_BTN_RESET',
            'SCADA_AUTO_MANUAL', 'SCADA_MODE_SELECTOR', 'SCADA_TOGGLE_SWITCH', 'SCADA_PLC_STATUS'
        ]
    },
    SCADA_MES: {
        label: 'MES & Alarms',
        icon: Factory,
        color: '#a855f7',
        types: [
            // Alarms & Logs
            'SCADA_ALARM_SUMMARY', 'SCADA_ALARM_BANNER', 'SCADA_ALARM_HISTORY', 'SCADA_EVENT_LOG', 'SCADA_ALARM_ACK',
            // MES Metrics
            'SCADA_OEE', 'SCADA_PROD_COUNTER', 'SCADA_DOWNTIME',
            'SCADA_MACHINE_STATUS', 'SCADA_SPC_CHART', 'SCADA_ENERGY_MONITOR', 'SCADA_BATCH_TRACKER'
        ]
    },
    ENGINE: {
        label: 'Engine',
        icon: Car,
        color: '#0ea5e9',
        types: [
            'OBD2_SCANNER', 'OBD2_RPM', 'OBD2_SPEED', 'OBD2_COOLANT_TEMP', 'OBD2_THROTTLE', 'OBD2_ENGINE_LOAD', 'OBD2_MAF', 'OBD2_IAT',
            'OBD2_FUEL_LEVEL', 'OBD2_FUEL_PRESSURE', 'OBD2_STFT', 'OBD2_LTFT', 'OBD2_AFR', 'OBD2_O2_SENSOR',
            'OBD2_IGNITION_TIMING', 'OBD2_KNOCK', 'OBD2_TORQUE_EST', 'OBD2_HP_EST',
            'OBD2_OIL_TEMP', 'OBD2_MAP', 'OBD2_BARO', 'OBD2_BOOST',
            'OBD2_BATTERY_VOLTAGE', 'OBD2_DTC', 'OBD2_MIL_STATUS', 'OBD2_FREEZE_FRAME', 'OBD2_CLEAR_DTC', 'OBD2_WARNING'
        ]
    },
    ARDUINO: {
        label: 'Arduino IoT',
        icon: Cpu,
        color: '#00979D',
        types: [
            'ARDUINO_BOARD', 'ARDUINO_PIN_MONITOR', 'ARDUINO_CONTROLLER', 'ARDUINO_GRAPH',
            'ARDUINO_CONSOLE', 'ARDUINO_GAUGE', 'ARDUINO_COLOR_PICKER', 'ARDUINO_MOTOR',
            'ARDUINO_RFID', 'ARDUINO_LCD', 'ARDUINO_JOYSTICK', 'ARDUINO_KEYPAD', 'ARDUINO_MATRIX', 'ARDUINO_RTC',
            'ARDUINO_RADAR', 'ARDUINO_TANK', 'ARDUINO_MODBUS', 'ARDUINO_STATUS_GRID', 'ARDUINO_OSCILLOSCOPE', 'ARDUINO_THERMAL', 'ARDUINO_THERMOMETER',
            'ARDUINO_SCADA_VALVE', 'ARDUINO_SCADA_PUMP', 'ARDUINO_SCADA_PIPE', 'ARDUINO_SCADA_ESTOP', 'ARDUINO_SCADA_ALARM_BANNER', 'ARDUINO_SCADA_PID'
        ]
    }
};


export const CHROMELESS_COMPONENT_TYPES = [
    'TIMER', 'DATABASE_CONNECTOR', 'API_CONNECTOR', 'IOT_CONNECTOR', 'LOGIC_NODE', 'EVENT_TRIGGER',
    'CLOCK', 'TINY_DB', 'CLOUD_DB', 'NOTIFIER', 'SOUND', 'SOUND_RECORDER',
    'TEXT_TO_SPEECH', 'ACCELEROMETER', 'LOCATION_SENSOR', 'FILE', 'DATA_FILE', 'SPREADSHEET', 'TINY_WEB_DB', 'WEB_API', 'BLUETOOTH_LE',
    'BARCODE_SCANNER', 'BARCODE_SCANNER_NON_VISIBLE', 'CAMERA', 'CAMCORDER', 'PLAYER', 'BAROMETER',
    'GYROSCOPE_SENSOR', 'HYGROMETER', 'LIGHT_SENSOR', 'MAGNETIC_FIELD_SENSOR', 'NEAR_FIELD',
    'ORIENTATION_SENSOR', 'PEDOMETER', 'PROXIMITY_SENSOR', 'THERMOMETER',
    'MARKER', 'CIRCLE', 'POLYGON', 'RECTANGLE', 'LINE_STRING', 'FEATURE_COLLECTION', 'NAVIGATION',
    'CHART_DATA_2D', 'TRENDLINE', 'ANOMALY_DETECTION', 'REGRESSION',
    'PHONE_CALL', 'SHARING', 'TEXTING',
    'ACTIVITY_STARTER', 'BLUETOOTH_CLIENT', 'BLUETOOTH_SERVER', 'SERIAL', 'WEB'
];
export const DEVICE_TRIGGER_COMPONENT_TYPES = [
    'BARCODE', 'CAMERA_SCANNER', 'VISION_DETECTOR', 'VISION_MEASUREMENT', 'CAMERA', 'CAMCORDER', 'FILE_UPLOAD', 'MEDIA_RECORDER',
    'IOT_DEVICE', 'MACHINE_STATUS', 'ACCELEROMETER', 'LOCATION_SENSOR', 'BARCODE_SCANNER_NON_VISIBLE', 'CLOCK', 'OBD2_SCANNER',
    'ARDUINO_BOARD', 'ARDUINO_PIN_MONITOR', 'ARDUINO_CONTROLLER', 'ARDUINO_GRAPH', 'ARDUINO_GAUGE',
    'ARDUINO_RFID', 'ARDUINO_LCD', 'ARDUINO_JOYSTICK', 'ARDUINO_KEYPAD', 'ARDUINO_MATRIX', 'ARDUINO_RTC',
    'ARDUINO_RADAR', 'ARDUINO_TANK', 'ARDUINO_MODBUS', 'ARDUINO_STATUS_GRID', 'ARDUINO_OSCILLOSCOPE', 'ARDUINO_THERMAL', 'ARDUINO_THERMOMETER',
    'ARDUINO_SCADA_VALVE', 'ARDUINO_SCADA_PUMP', 'ARDUINO_SCADA_PIPE', 'ARDUINO_SCADA_ESTOP', 'ARDUINO_SCADA_ALARM_BANNER', 'ARDUINO_SCADA_PID'
];
export const FORM_BINDABLE_COMPONENT_TYPES = [
    'TEXT_INPUT', 'TEXT_AREA', 'DROPDOWN', 'RADIO_GROUP', 'MULTI_SELECT', 'NUMBER_INPUT', 'DATE_PICKER',
    'DATETIME_PICKER', 'BOOLEAN_TOGGLE', 'BARCODE', 'CAMERA_SCANNER', 'VISION_DETECTOR', 'VISION_MEASUREMENT', 'MENU',
    'SLIDER', 'CHECKBOX', 'LIST_PICKER', 'LIST_VIEW', 'PASSWORD_TEXT', 'SPEECH_RECOGNIZER', 'SMARTHOME_DEVICE', 'TUYA_PRODUCT',
    'ARDUINO_PIN_MONITOR', 'ARDUINO_GAUGE', 'ARDUINO_RFID', 'ARDUINO_JOYSTICK', 'ARDUINO_KEYPAD', 'ARDUINO_RTC',
    'ARDUINO_TANK', 'ARDUINO_THERMOMETER',
    'ARDUINO_SCADA_VALVE', 'ARDUINO_SCADA_PUMP', 'ARDUINO_SCADA_PIPE', 'ARDUINO_SCADA_ESTOP', 'ARDUINO_SCADA_ALARM_BANNER', 'ARDUINO_SCADA_PID',
    'KEYBOARD_PRO', 'NUMPAD',
    'SCADA_PIPE', 'SCADA_VALVE', 'SCADA_TANK', 'SCADA_PUMP',
    'SCADA_MOTOR', 'SCADA_CONVEYOR', 'SCADA_MIXER', 'SCADA_HEAT_EXCHANGER',
    'SCADA_BOILER', 'SCADA_COMPRESSOR', 'SCADA_CHILLER', 'SCADA_FURNACE', 'SCADA_SILO',
    'SCADA_PRESSURE_GAUGE', 'SCADA_TEMP_INDICATOR', 'SCADA_FLOW_METER',
    'SCADA_LEVEL_INDICATOR', 'SCADA_PH_METER', 'SCADA_CURRENT_METER',
    'SCADA_VOLTAGE_METER', 'SCADA_POWER_METER',
    'SCADA_DIGITAL_DISPLAY', 'SCADA_NUMERIC_INPUT', 'SCADA_SETPOINT_INPUT',
    'SCADA_TREND', 'SCADA_HISTORICAL_TREND', 'SCADA_BAR_GRAPH',
    'SCADA_CIRCULAR_GAUGE', 'SCADA_PROGRESS_BAR', 'SCADA_TANK_LEVEL',
    'SCADA_BTN_START', 'SCADA_BTN_STOP', 'SCADA_BTN_RESET',
    'SCADA_AUTO_MANUAL', 'SCADA_MODE_SELECTOR', 'SCADA_TOGGLE_SWITCH', 'SCADA_PLC_STATUS',
    'SCADA_ALARM_SUMMARY', 'SCADA_ALARM_BANNER', 'SCADA_ALARM_HISTORY', 'SCADA_EVENT_LOG', 'SCADA_ALARM_ACK',
    'SCADA_OEE', 'SCADA_PROD_COUNTER', 'SCADA_DOWNTIME',
    'SCADA_MACHINE_STATUS', 'SCADA_SPC_CHART', 'SCADA_ENERGY_MONITOR', 'SCADA_BATCH_TRACKER',
    // QC & Measurement Widgets
    'QUALITY_TOLERANCE', 'OPENCV_CAMERA', 'MEASUREMENT_WIDGET', 'GAUGE', 'DIAL_GAUGE',
    'GAUGE_CIRCULAR', 'OUTSIDE_MICROMETER', 'INSIDE_MICROMETER', 'DIAL_HEIGHT_GAUGE',
    'DEPTH_GAUGE', 'ROUGHNESS_TESTER', 'TORQUE_WRENCH', 'WEIGHING_SCALE'
];
export const INPUT_WIDGET_TYPES_WITH_DATASOURCE = [
    'TEXT_INPUT', 'TEXT_AREA', 'NUMBER_INPUT', 'DATE_PICKER', 'DATETIME_PICKER', 'BOOLEAN_TOGGLE',
    'DROPDOWN', 'MULTI_SELECT', 'CHECKBOX', 'PASSWORD_TEXT', 'LIST_PICKER', 'LIST_VIEW', 'SPEECH_RECOGNIZER', 'SMARTHOME_DEVICE', 'TUYA_PRODUCT',
    'ARDUINO_PIN_MONITOR', 'ARDUINO_GAUGE', 'ARDUINO_RFID', 'ARDUINO_JOYSTICK', 'ARDUINO_KEYPAD', 'ARDUINO_RTC',
    'ARDUINO_TANK', 'ARDUINO_THERMOMETER',
    'ARDUINO_SCADA_VALVE', 'ARDUINO_SCADA_PUMP', 'ARDUINO_SCADA_PIPE', 'ARDUINO_SCADA_ESTOP', 'ARDUINO_SCADA_ALARM_BANNER', 'ARDUINO_SCADA_PID',
    'KEYBOARD_PRO', 'NUMPAD',
    'SCADA_PIPE', 'SCADA_VALVE', 'SCADA_TANK', 'SCADA_PUMP',
    'SCADA_MOTOR', 'SCADA_CONVEYOR', 'SCADA_MIXER', 'SCADA_HEAT_EXCHANGER',
    'SCADA_BOILER', 'SCADA_COMPRESSOR', 'SCADA_CHILLER', 'SCADA_FURNACE', 'SCADA_SILO',
    'SCADA_PRESSURE_GAUGE', 'SCADA_TEMP_INDICATOR', 'SCADA_FLOW_METER',
    'SCADA_LEVEL_INDICATOR', 'SCADA_PH_METER', 'SCADA_CURRENT_METER',
    'SCADA_VOLTAGE_METER', 'SCADA_POWER_METER',
    'SCADA_DIGITAL_DISPLAY', 'SCADA_NUMERIC_INPUT', 'SCADA_SETPOINT_INPUT',
    'SCADA_TREND', 'SCADA_HISTORICAL_TREND', 'SCADA_BAR_GRAPH',
    'SCADA_CIRCULAR_GAUGE', 'SCADA_PROGRESS_BAR', 'SCADA_TANK_LEVEL',
    'SCADA_BTN_START', 'SCADA_BTN_STOP', 'SCADA_BTN_RESET',
    'SCADA_AUTO_MANUAL', 'SCADA_MODE_SELECTOR', 'SCADA_TOGGLE_SWITCH', 'SCADA_PLC_STATUS',
    'SCADA_ALARM_SUMMARY', 'SCADA_ALARM_BANNER', 'SCADA_ALARM_HISTORY', 'SCADA_EVENT_LOG', 'SCADA_ALARM_ACK',
    'SCADA_OEE', 'SCADA_PROD_COUNTER', 'SCADA_DOWNTIME',
    'SCADA_MACHINE_STATUS', 'SCADA_SPC_CHART', 'SCADA_ENERGY_MONITOR', 'SCADA_BATCH_TRACKER',
    // QC & Measurement Widgets
    'QUALITY_TOLERANCE', 'OPENCV_CAMERA', 'VISION_MEASUREMENT', 'MEASUREMENT_WIDGET', 'GAUGE', 'DIAL_GAUGE',
    'GAUGE_CIRCULAR', 'OUTSIDE_MICROMETER', 'INSIDE_MICROMETER', 'DIAL_HEIGHT_GAUGE',
    'DEPTH_GAUGE', 'ROUGHNESS_TESTER', 'TORQUE_WRENCH', 'WEIGHING_SCALE'
];
export const FORM_STEP_TYPES = ['Form Step', 'Signature Form'];

export const ICON_BUTTON_ICONS = {
    ChevronRight: { label: 'Next →', component: null }, // resolved at render
    ChevronLeft: { label: 'Previous ←', component: null },
    Trash2: { label: 'Delete', component: null },
    Languages: { label: 'Translate', component: null },
    Link: { label: 'Link', component: null },
    Paperclip: { label: 'Attach', component: null },
    AlertTriangle: { label: 'Log Defect', component: null },
    Settings: { label: 'Settings', component: null },
    Printer: { label: 'Print', component: null },
    LogIn: { label: 'Log in/out', component: null },
    Play: { label: 'Play', component: null },
    X: { label: 'Reject', component: null },
    LayoutDashboard: { label: 'Details', component: null },
    Edit3: { label: 'Edit', component: null },
    Send: { label: 'Send', component: null },
    Download: { label: 'Download', component: null },
    PauseCircle: { label: 'Pause', component: null },
    CheckCircle2: { label: 'Accept', component: null },
    List: { label: 'List', component: null },
    Plus: { label: 'Add', component: null },
    Search: { label: 'Search', component: null },
    ScanLine: { label: 'Scan', component: null },
    Eye: { label: 'View', component: null },
    Save: { label: 'Save', component: null },
    Upload: { label: 'Upload', component: null },
    RefreshCw: { label: 'Refresh', component: null },
    ArrowRight: { label: 'Arrow Right', component: null },
    ArrowLeft: { label: 'Arrow Left', component: null },
    Home: { label: 'Home', component: null },
    BarChart2: { label: 'Analytics', component: null },
    Menu: { label: 'Menu', component: null },
    HelpCircle: { label: 'Help', component: null },
};

// Variant colors for ICON_BUTTON
export const ICON_BUTTON_VARIANTS = {
    blue: { bg: '#2563eb', hover: '#1d4ed8', text: '#ffffff', border: '#2563eb' },
    red: { bg: '#dc2626', hover: '#b91c1c', text: '#ffffff', border: '#dc2626' },
    green: { bg: '#16a34a', hover: '#15803d', text: '#ffffff', border: '#16a34a' },
    gray: { bg: '#f1f5f9', hover: '#e2e8f0', text: '#374151', border: '#cbd5e1' },
    outline: { bg: 'transparent', hover: '#f1f5f9', text: '#374151', border: '#cbd5e1' },
};

