// Component type definitions extracted from AppBuilder.jsx
import {
    Blocks,
    Plus,
    Save,
    Share2,
    Type,
    Clock,
    Barcode,
    CheckSquare,
    Trash2,
    ChevronRight,
    Settings2,
    Eye,
    Layout,
    MousePointer2,
    ShieldCheck,
    Gauge,
    PlayCircle,
    FileText,
    Play,
    Hash,
    Zap,
    Video,
    ClipboardList,
    Image as ImageIcon,
    RectangleHorizontal,
    Database,
    Square,
    ChevronLeft,
    Variable,
    Calendar,
    ToggleLeft,
    CheckCircle2,
    Activity,
    BarChart3,
    X,
    FilePlus,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    FolderOpen,
    Loader2,
    Upload,
    Table,
    Filter,
    Camera,
    MapPin,
    Globe,
    Mic,
    SlidersHorizontal,
    LayoutGrid,
    Cpu,
    Wifi,
    Printer,
    Webcam,
    Thermometer,
    Bell,
    Weight,
    Edit3,
    Pencil,
    Code,
    Grid3X3,
    Magnet,
    Undo2,
    Redo2,
    Hexagon,
    BringToFront,
    SendToBack,
    ArrowUp,
    ArrowDown,
    Package,
    TrendingUp,
    LayoutDashboard,
    PieChart,
    BarChart,
    Copy,
    Scissors,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignStartVertical,
    AlignVerticalSpaceBetween,
    AlignEndVertical,
    MoveHorizontal,
    MoveVertical,
    Link,
    Send,
    Search,
    List,
    ArrowRight,
    ArrowLeft,
    PauseCircle,
    Download,
    Maximize,
    Minimize,
    Sparkles,
    Wand2,
    ShoppingBag,
    GripVertical,
    ToggleRight,
    Undo,
    Redo,
    Info,
    RotateCw,
    Smartphone,
    Tablet,
    Monitor,
    Lock,
    Unlock,
    Volume2,
    Mic2,
    Languages,
    Circle,
    PenTool,
    ScanLine,
    Timer,
    Cloud,
    FileInput,
    Bluetooth,
    Music,
    Paperclip,
    Fuel,
    BatteryCharging,
    ThermometerSun,
    Car,
    Bug,
    AlertTriangle,
    Settings,
    LogIn,
    RefreshCw,
    BarChart2,
    Menu,
    HelpCircle,
    Home,
    CloudRain,
    Compass,
    Droplets,
    Wind,
    Sun,
    Nfc,
    Footprints,
    FileJson,
    Map as MapIcon,
    Navigation,
    Route,
    Layers,
    LineChart,
    AreaChart,
    QrCode,
    Cast,
    ArrowUpRight,
    UserCircle,
    Mail,
    Phone,
    UserPlus,
    MessageSquare,
    Contact,
    Triangle,
    Server,
    Shapes,
    Sigma,
    TableProperties,
    Moon,
    Wrench,
    Ruler,
    Disc,
    Minus,
    Power,
    Terminal,
    Palette,
    CreditCard,
    Tv,
    Gamepad2,
    Flame,
    Box,
    Waves,
    Snowflake,
    Container,
    Factory,
    Radio,
    Crosshair,
    ArrowDownUp,
    Percent,
    Target,
    ListOrdered,
    ClockIcon,
    BarChartHorizontal,
    CircleDot,
    Cog,
    StopCircle,
    PlaySquare,
    RotateCcw,
    PanelTop,
    Binary,
    Wallet,
    Keyboard
} from 'lucide-react';

export const COMPONENT_TYPES = {
    // 1. User Interface
    BUTTON: {
        id: 'BUTTON',
        label: 'Button',
        icon: Play,
        defaultSize: { w: 160, h: 40 },
        defaultProps: {
            // Content
            text: 'Button Text',
            label: 'Button Text', // for legacy compatibility
            image: '',

            // Interaction
            enabled: true,
            visible: true,
            showFeedback: true,

            // Appearance
            backgroundColor: '#3b82f6',
            textColor: '#ffffff',
            color: '#ffffff', // for legacy compatibility
            fontSize: 14,
            fontBold: true,
            fontWeight: 'bold', // for legacy compatibility
            fontItalic: false,
            fontTypeface: 'DEFAULT', // DEFAULT, SERIF, SANS_SERIF, MONOSPACE
            shape: 0, // 0: Default, 1: Rounded, 2: Rectangle, 3: Oval
            textAlignment: 1, // 0: Left, 1: Center, 2: Right
            textAlign: 'center', // for legacy compatibility

            // Layout (Position stored at top level, but properties can reflect)
            height: -1, // -1: automatic
            width: -1,  // -1: automatic
            heightPercent: -1,
            widthPercent: -1,

            triggers: [],
            visibilityCondition: null,
            rotation: 0,
            conditionalFormattingRules: []
        }
    },
    VARIABLE_TEXT: {
        id: 'VARIABLE_TEXT', label: 'Variable Text', icon: Type, defaultSize: { w: 200, h: 40 },
        defaultProps: { label: 'Variable Label', targetVariable: '', visible: true, triggers: [] }
    },
    RADIO_GROUP: {
        id: 'RADIO_GROUP', label: 'Radio Group', icon: CheckSquare, defaultSize: { w: 300, h: 80 },
        defaultProps: { label: 'Select Option', options: ['Option 1', 'Option 2'], visible: true, triggers: [] }
    },
    CHECKLIST: {
        id: 'CHECKLIST', label: 'Checklist', icon: CheckSquare, defaultSize: { w: 300, h: 120 },
        defaultProps: { title: 'Checklist', items: ['Item 1', 'Item 2'], visible: true, triggers: [] }
    },
    QUALITY_TOLERANCE: {
        id: 'QUALITY_TOLERANCE', label: 'Tolerance Check', icon: Activity, defaultSize: { w: 300, h: 80 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '', label: 'Measurement', min: 0, max: 10, unit: 'mm', visible: true, triggers: [] }
    },
    QUALITY_PASS_FAIL: {
        id: 'QUALITY_PASS_FAIL', label: 'Pass/Fail', icon: Activity, defaultSize: { w: 300, h: 80 },
        defaultProps: { label: 'Judgment', visible: true, triggers: [] }
    },
    CAMERA_CAPTURE: {
        id: 'CAMERA_CAPTURE', label: 'Camera Capture', icon: Camera, defaultSize: { w: 300, h: 200 },
        defaultProps: { label: 'Take Photo', visible: true, triggers: [] }
    },
    OPENCV_CAMERA: {
        id: 'OPENCV_CAMERA', label: 'OpenCV Vision', icon: Eye, defaultSize: { w: 300, h: 220 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '', 
            label: 'OpenCV Live Stream', 
            filterType: 'CANNY', 
            thresholdValue: 100, 
            changeThreshold: 25,
            caliperMin: 25.35,
            caliperMax: 25.45,
            gaugeMin: 0.0,
            gaugeMax: 60.0,
            targetCount: 3,
            visible: true, 
            triggers: [] 
        }
    },
    CHECKBOX: {
        id: 'CHECKBOX',
        label: 'Checkbox',
        icon: CheckSquare,
        defaultSize: { w: 120, h: 32 },
        defaultProps: {
            text: 'Check Box',
            label: 'Check Box', // legacy compatibility
            checked: false,
            defaultValue: false, // legacy compatibility
            enabled: true,
            visible: true,
            backgroundColor: 'transparent',
            textColor: '#000000',
            fontSize: 14,
            fontBold: false,
            fontItalic: false,
            fontTypeface: 'DEFAULT',
            height: -1,
            width: -1,
            heightPercent: -1,
            widthPercent: -1,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    DATE_PICKER: {
        id: 'DATE_PICKER',
        label: 'DatePicker',
        icon: Calendar,
        defaultSize: { w: 160, h: 40 },
        defaultProps: {
            text: 'Select Date',
            label: 'Select Date', // legacy
            enabled: true,
            visible: true,
            backgroundColor: 'var(--bg-panel)',
            textColor: '#000000',
            fontSize: 14,
            fontBold: false,
            fontItalic: false,
            fontTypeface: 'DEFAULT',
            textAlignment: 1, // 0: Normal, 1: Center, 2: Opposite
            shape: 0, // 0: Default, 1: Rounded, 2: Rect, 3: Oval
            image: '',
            showFeedback: true,
            height: -1,
            width: -1,
            heightPercent: -1,
            widthPercent: -1,
            // Derived properties (updated on selection)
            year: 0,
            month: 0,
            day: 0,
            monthInText: '',
            instant: null,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    IMAGE: {
        id: 'IMAGE',
        label: 'Image',
        icon: ImageIcon,
        defaultSize: { w: 100, h: 100 },
        defaultProps: {
            picture: '',
            src: '', // legacy mirrored with picture
            alternateText: 'Image',
            alt: 'Image', // legacy mirrored with alternateText
            clickable: false,
            scaling: 0, // 0: Proportional (contain), 1: To Fit (fill)
            scalePictureToFit: false,
            rotationAngle: 0,
            animation: 'None', // ScrollRightSlow, ScrollRight, etc.
            visible: true,
            height: -1,
            width: -1,
            heightPercent: -1,
            widthPercent: -1,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    MARKDOWN: {
        id: 'MARKDOWN',
        label: 'Markdown Text',
        icon: FileText,
        defaultSize: { w: 400, h: 300 },
        defaultProps: {
            text: '# Judul\n\nTeks markdown di sini.',
            backgroundColor: 'transparent',
            textColor: 'var(--text-primary)',
            visible: true,
            triggers: []
        }
    },
    TEXT: {
        id: 'TEXT',
        label: 'Label',
        icon: Type,
        defaultSize: { w: 120, h: 32 },
        defaultProps: {
            text: 'Label text',
            fontSize: 14,
            textcolor: 'var(--text-primary)',
            color: 'var(--text-primary)', // legacy
            backgroundColor: 'transparent',
            fontBold: false,
            fontWeight: 'normal', // legacy
            fontItalic: false,
            fontTypeface: 'DEFAULT',
            htmlFormat: false,
            hasMargins: true,
            textAlignment: 0, // 0: Normal, 1: Center, 2: Opposite
            visible: true,
            height: -1,
            width: -1,
            heightPercent: -1,
            widthPercent: -1,
            triggers: [],
            visibilityCondition: null,
            rotation: 0,
            conditionalFormattingRules: []
        }
    },
    LABEL: {
        id: 'LABEL',
        label: 'Label',
        icon: Type,
        defaultSize: { w: 120, h: 32 },
        defaultProps: {
            text: 'Label text',
            fontSize: 14,
            textcolor: 'var(--text-primary)',
            color: 'var(--text-primary)',
            backgroundColor: 'transparent',
            fontBold: false,
            fontWeight: 'normal',
            fontItalic: false,
            fontTypeface: 'DEFAULT',
            htmlFormat: false,
            hasMargins: true,
            textAlignment: 0,
            visible: true,
            height: -1,
            width: -1,
            heightPercent: -1,
            widthPercent: -1,
            triggers: [],
            visibilityCondition: null,
            rotation: 0,
            conditionalFormattingRules: []
        }
    },
    HEADING: {
        id: 'HEADING',
        label: 'Heading',
        icon: Type,
        defaultSize: { w: 200, h: 40 },
        defaultProps: {
            text: 'Heading Text',
            fontSize: 22,
            textcolor: 'var(--text-primary)',
            color: 'var(--text-primary)',
            backgroundColor: 'transparent',
            fontBold: true,
            fontWeight: 'bold',
            fontItalic: false,
            fontTypeface: 'DEFAULT',
            htmlFormat: false,
            hasMargins: true,
            textAlignment: 0,
            visible: true,
            height: -1,
            width: -1,
            heightPercent: -1,
            widthPercent: -1,
            triggers: [],
            visibilityCondition: null,
            rotation: 0,
            conditionalFormattingRules: []
        }
    },
    PARAGRAPH: {
        id: 'PARAGRAPH',
        label: 'Paragraph',
        icon: Type,
        defaultSize: { w: 300, h: 80 },
        defaultProps: {
            text: 'Paragraph text content...',
            fontSize: 14,
            textcolor: 'var(--text-primary)',
            color: 'var(--text-primary)',
            backgroundColor: 'transparent',
            fontBold: false,
            fontWeight: 'normal',
            fontItalic: false,
            fontTypeface: 'DEFAULT',
            htmlFormat: false,
            hasMargins: true,
            textAlignment: 0,
            visible: true,
            height: -1,
            width: -1,
            heightPercent: -1,
            widthPercent: -1,
            triggers: [],
            visibilityCondition: null,
            rotation: 0,
            conditionalFormattingRules: []
        }
    },
    LIST_PICKER: {
        id: 'LIST_PICKER',
        label: 'ListPicker',
        icon: List,
        defaultSize: { w: 160, h: 40 },
        defaultProps: {
            text: 'List Picker',
            label: 'List Picker', // legacy
            elements: ['Item 1', 'Item 2', 'Item 3'],
            options: ['Item 1', 'Item 2', 'Item 3'], // legacy
            elementsFromString: '',
            selection: '',
            selectionIndex: 0,
            itemBackgroundColor: 'var(--bg-panel)',
            itemTextColor: '#000000',
            showFilterBar: false,
            showFeedback: true,
            title: 'Select Item',
            backgroundColor: '#3b82f6',
            textColor: '#ffffff',
            color: '#ffffff', // legacy
            fontBold: false,
            fontItalic: false,
            fontSize: 14,
            shape: 0,
            textAlignment: 1, // 0: Left, 1: Center, 2: Right
            enabled: true,
            visible: true,
            height: -1,
            width: -1,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    LIST_VIEW: {
        id: 'LIST_VIEW',
        label: 'ListView',
        icon: ClipboardList,
        defaultSize: { w: 300, h: 200 },
        defaultProps: {
            // Content & Data
            elements: ['Item 1', 'Item 2', 'Item 3'],
            elementsFromString: 'Item 1, Item 2, Item 3',
            listData: [], // [{main: '', detail: '', image: ''}]
            listViewLayout: 0, // 0: MainText, 1: MainTextDetailText, 2: ImageMainText, 3: ImageMainTextDetailText

            // State
            selection: '',
            selectionIndex: 0,
            selectionDetailText: '',

            // Styling (General)
            backgroundColor: 'var(--bg-panel)',
            dividerColor: '#e2e8f0',
            dividerThickness: 1,
            orientation: 'Vertical', // Vertical, Horizontal

            // Styling (Element)
            elementColor: '#ffffff',
            elementCornerRadius: 0,
            elementMarginsWidth: 0,
            selectionColor: '#eff6ff',

            // Typography (Main)
            fontSize: 16,
            textcolor: 'var(--text-primary)',
            fontTypeface: 'DEFAULT',

            // Typography (Detail)
            fontSizeDetail: 12,
            textColorDetail: '#64748b',
            fontTypefaceDetail: 'DEFAULT',

            // Media
            imageHeight: 40,
            imageWidth: 40,

            // Filtering
            showFilterBar: false,
            hintText: 'Search items...',
            bounceEdgeEffect: true,

            // Layout
            height: -1,
            width: -1,
            heightPercent: -1,
            widthPercent: -1,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    NOTIFIER: {
        id: 'NOTIFIER',
        label: 'Notifier',
        icon: Bell,
        defaultSize: { w: 48, h: 48 },
        defaultProps: {
            backgroundcolor: 'var(--text-secondary)',
            textColor: '#ffffff',
            notifierLength: 1, // 0: Short, 1: Long
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    PASSWORD_TEXT: {
        id: 'PASSWORD_TEXT',
        label: 'PasswordTextBox',
        icon: Lock,
        defaultSize: { w: 160, h: 40 },
        defaultProps: {
            backgroundColor: 'var(--bg-panel)',
            enabled: true,
            fontBold: false,
            fontItalic: false,
            fontSize: 14,
            fontTypeface: 'SANS_SERIF',
            hint: 'Password...',
            hintcolor: 'var(--text-quaternary)',
            numbersOnly: false,
            passwordVisible: false,
            text: '',
            textAlignment: 0, // 0: Normal/Left, 1: Center, 2: Opposite/Right
            textcolor: 'var(--text-primary)',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SLIDER: {
        id: 'SLIDER',
        label: 'Slider',
        icon: SlidersHorizontal,
        defaultSize: { w: 160, h: 40 },
        defaultProps: {
            colorLeft: '#2563eb', // Standard Blue
            colorRight: '#e2e8f0', // Standard Grey
            defaultValue: 30,
            enabled: true,
            maxValue: 50,
            minValue: 10,
            numberOfSteps: 100,
            thumbColor: '#2563eb',
            thumbEnabled: true,
            thumbPosition: 30,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    DROPDOWN: {
        id: 'DROPDOWN',
        label: 'Spinner',
        icon: ChevronDown,
        defaultSize: { w: 160, h: 40 },
        defaultProps: {
            backgroundColor: 'var(--bg-panel)',
            elements: ['Item 1', 'Item 2'],
            elementsFromString: '',
            enabled: true,
            fontBold: false,
            fontItalic: false,
            fontSize: 14,
            fontTypeface: 'SANS_SERIF',
            image: '',
            prompt: 'Select item...',
            selection: '',
            selectionIndex: 0,
            showFeedback: true,
            textAlignment: 0, // 0: Normal, 1: Center, 2: Opposite
            textcolor: 'var(--text-primary)',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0,
            conditionalFormattingRules: []
        }
    },
    BOOLEAN_TOGGLE: {
        id: 'BOOLEAN_TOGGLE',
        label: 'Switch',
        icon: ToggleRight,
        defaultSize: { w: 120, h: 32 },
        defaultProps: {
            backgroundColor: 'transparent',
            enabled: true,
            fontBold: false,
            fontItalic: false,
            fontSize: 14,
            fontTypeface: 'SANS_SERIF',
            on: false,
            text: 'Switch',
            textcolor: 'var(--text-primary)',
            thumbColorActive: '#ffffff',
            thumbColorInactive: '#ffffff',
            trackColorActive: '#2563eb',
            trackColorInactive: '#e2e8f0',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SMARTHOME_DEVICE: {
        id: 'SMARTHOME_DEVICE',
        label: 'SmartHome Controller',
        icon: Home,
        defaultSize: { w: 220, h: 140 },
        defaultProps: {
            deviceName: 'Smart Switch',
            deviceBrand: 'TUYA', // 'TUYA', 'BARDI', 'SONOFF', 'CUSTOM'
            deviceType: 'SWITCH', // 'SWITCH', 'BULB', 'THERMOSTAT', 'AIR_CON'
            on: false,
            brightness: 100,
            temperature: 24,
            mqttTopic: 'tuya/device/state',
            mqttPublishTopic: 'tuya/device/set',
            visible: true,
            enabled: true,
            textColor: 'var(--text-primary)',
            backgroundColor: 'var(--bg-panel)',
            triggers: [],
            rotation: 0
        }
    },
    TUYA_PRODUCT: {
        id: 'TUYA_PRODUCT',
        label: 'Tuya Smart IoT Product',
        icon: Cpu,
        defaultSize: { w: 320, h: 420 },
        defaultProps: {
            deviceName: 'Tuya Smart Light',
            productCase: 'LIGHTING', // 'LIGHTING', 'CAMERA', 'THERMOSTAT', 'AIR_PURIFIER', 'ROBOT_VACUUM', 'LOCK', 'SENSOR', 'PLUG'
            on: false,
            brightness: 80,
            colorTemp: 50,
            colorHex: '#ff5f00',
            temperature: 24,
            targetTemperature: 22,
            fanSpeed: 'AUTO',
            mode: 'AUTO',
            batteryLevel: 85,
            aqiValue: 12,
            filterLife: 92,
            locked: true,
            usbOn: false,
            powerConsumption: 12.5,
            totalEnergy: 4.8,
            mqttTopic: 'tuya/iot/state',
            mqttPublishTopic: 'tuya/iot/set',
            visible: true,
            enabled: true,
            textColor: 'var(--text-primary)',
            backgroundColor: 'var(--bg-panel)',
            triggers: [],
            rotation: 0
        }
    },
    TEXT_INPUT: {
        id: 'TEXT_INPUT',
        label: 'TextBox',
        icon: Type,
        defaultSize: { w: 160, h: 40 },
        defaultProps: {
            backgroundColor: 'var(--bg-panel)',
            enabled: true,
            fontBold: false,
            fontItalic: false,
            fontSize: 14,
            fontTypeface: 'SANS_SERIF',
            hint: 'Hint...',
            hintcolor: 'var(--text-quaternary)',
            multiLine: false,
            numbersOnly: false,
            readOnly: false,
            text: '',
            textAlignment: 0,
            textcolor: 'var(--text-primary)',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0,
            conditionalFormattingRules: []
        }
    },
    TEXT_AREA: {
        id: 'TEXT_AREA',
        label: 'NotesArea',
        icon: AlignLeft,
        defaultSize: { w: 240, h: 120 },
        defaultProps: {
            backgroundColor: 'var(--bg-panel)',
            enabled: true,
            fontBold: false,
            fontItalic: false,
            fontSize: 14,
            fontTypeface: 'SANS_SERIF',
            hint: 'Describe...',
            hintcolor: 'var(--text-quaternary)',
            multiLine: true,
            numbersOnly: false,
            readOnly: false,
            text: '',
            textAlignment: 0,
            textcolor: 'var(--text-primary)',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    DATETIME_PICKER: {
        id: 'DATETIME_PICKER',
        label: 'DateTimePicker',
        icon: Calendar,
        defaultSize: { w: 160, h: 48 },
        defaultProps: {
            backgroundColor: 'var(--bg-panel)',
            enabled: true,
            fontBold: false,
            fontItalic: false,
            fontSize: 14,
            fontTypeface: 'SANS_SERIF',
            hour: 0,
            image: '',
            instant: '',
            minute: 0,
            shape: 0, // 0: Default, 1: Rounded, 2: Rectangle, 3: Oval
            showFeedback: true,
            text: 'Select Time',
            textAlignment: 1, // 1: Center
            textcolor: 'var(--text-primary)',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    EMBED_WEB: { id: 'EMBED_WEB', label: 'WebViewer', icon: Globe, defaultProps: { url: 'https://google.com', homeUrl: 'https://google.com', followLinks: true, ignoreSslErrors: false, promptForPermission: false, usesCamera: false, usesLocation: false, usesMicrophone: false, webViewString: '', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },



    // 3. Media
    CAMERA: { id: 'CAMERA', label: 'Camera', icon: Camera, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    CAMCORDER: { id: 'CAMCORDER', label: 'Camcorder', icon: Video, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    FILE_PICKER: { id: 'FILE_PICKER', label: 'FilePicker', icon: FileInput, defaultProps: { action: 'Pick Existing File', backgroundColor: '#e2e8f0', enabled: true, fontBold: false, fontItalic: false, fontSize: 14, fontTypeface: 'SANS_SERIF', height: 'automatic', heightPercent: 100, image: '', mimeType: '*/*', selection: '', shape: 0, showFeedback: true, text: 'Pick File', textAlignment: 1, textcolor: 'var(--text-primary)', visible: true, width: 'automatic', widthPercent: 100, triggers: [], visibilityCondition: null, rotation: 0 } },
    IMAGE_PICKER: { id: 'IMAGE_PICKER', label: 'ImagePicker', icon: ImageIcon, defaultProps: { backgroundColor: '#e2e8f0', enabled: true, fontBold: false, fontItalic: false, fontSize: 14, fontTypeface: 'SANS_SERIF', height: 'automatic', heightPercent: 100, image: '', selection: '', shape: 0, showFeedback: true, text: 'Pick Image', textAlignment: 1, textcolor: 'var(--text-primary)', visible: true, width: 'automatic', widthPercent: 100, triggers: [], visibilityCondition: null, rotation: 0 } },
    PLAYER: { id: 'PLAYER', label: 'Player', icon: PlayCircle, defaultProps: { isPlaying: false, loop: false, playOnlyInForeground: true, source: '', volume: 50, triggers: [], visibilityCondition: null, rotation: 0 } },
    SOUND: { id: 'SOUND', label: 'Sound', icon: Volume2, defaultProps: { minimumInterval: 500, source: '', triggers: [], visibilityCondition: null, rotation: 0 } },
    SOUND_RECORDER: { id: 'SOUND_RECORDER', label: 'SoundRecorder', icon: Mic, defaultProps: { savedRecording: '', triggers: [], visibilityCondition: null, rotation: 0 } },
    SPEECH_RECOGNIZER: { id: 'SPEECH_RECOGNIZER', label: 'SpeechRecognizer', icon: Mic2, defaultProps: { language: '', result: '', useLegacy: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    TEXT_TO_SPEECH: { id: 'TEXT_TO_SPEECH', label: 'TextToSpeech', icon: Languages, defaultProps: { availableCountries: ['USA', 'GBR'], availableLanguages: ['en', 'es', 'fr'], country: '', language: '', pitch: 1.0, result: false, speechRate: 1.0, triggers: [], visibilityCondition: null, rotation: 0 } },
    VIDEO_PLAYER: {
        id: 'VIDEO_PLAYER',
        label: 'VideoPlayer',
        icon: Video,
        defaultSize: { w: 240, h: 160 },
        defaultProps: { fullScreen: false, height: 'automatic', heightPercent: 100, source: '', visible: true, volume: 50, width: 'automatic', widthPercent: 100, triggers: [], visibilityCondition: null, rotation: 0 }
    },

    // 4. Shapes (Tulip style)
    SHAPE_CIRCLE: { id: 'SHAPE_CIRCLE', label: 'Circle', icon: Circle, defaultSize: { w: 100, h: 100 }, defaultProps: { backgroundColor: '#3b82f6', bordercolor: 'var(--text-primary)', borderWidth: 0, visible: true, rotation: 0, width: 100, height: 100, triggers: [], visibilityCondition: null } },
    SHAPE_RECTANGLE: { id: 'SHAPE_RECTANGLE', label: 'Rectangle', icon: RectangleHorizontal, defaultSize: { w: 160, h: 60 }, defaultProps: { backgroundColor: '#3b82f6', bordercolor: 'var(--text-primary)', borderWidth: 0, borderRadius: 0, visible: true, rotation: 0, width: 160, height: 60, triggers: [], visibilityCondition: null } },
    SHAPE_SQUARE: { id: 'SHAPE_SQUARE', label: 'Square', icon: Square, defaultSize: { w: 100, h: 100 }, defaultProps: { backgroundColor: '#3b82f6', bordercolor: 'var(--text-primary)', borderWidth: 0, borderRadius: 0, visible: true, rotation: 0, width: 100, height: 100, triggers: [], visibilityCondition: null } },
    SHAPE_TRIANGLE: { id: 'SHAPE_TRIANGLE', label: 'Triangle', icon: Triangle, defaultSize: { w: 100, h: 100 }, defaultProps: { backgroundColor: '#3b82f6', bordercolor: 'var(--text-primary)', borderWidth: 0, visible: true, rotation: 0, width: 100, height: 100, triggers: [], visibilityCondition: null } },
    SHAPE_LINE: { id: 'SHAPE_LINE', label: 'Line', icon: Minus, defaultSize: { w: 160, h: 20 }, defaultProps: { backgroundcolor: 'var(--text-primary)', strokeWidth: 2, visible: true, rotation: 0, width: 160, height: 2, triggers: [], visibilityCondition: null } },
    SHAPE_ARROW: { id: 'SHAPE_ARROW', label: 'Arrow', icon: ArrowRight, defaultSize: { w: 160, h: 60 }, defaultProps: { backgroundcolor: 'var(--text-primary)', strokeWidth: 2, visible: true, rotation: 0, width: 160, height: 20, triggers: [], visibilityCondition: null } },
    SHAPE_DOUBLE_ARROW: { id: 'SHAPE_DOUBLE_ARROW', label: 'Double Arrow', icon: MoveHorizontal, defaultSize: { w: 200, h: 60 }, defaultProps: { backgroundcolor: 'var(--text-primary)', borderWidth: 0, visible: true, rotation: 0, triggers: [], visibilityCondition: null } },

    // 5. Legacy Drawing and Animation
    BALL: { id: 'BALL', label: 'Ball', icon: Circle, defaultSize: { w: 40, h: 40 }, defaultProps: { x: 50, y: 50, radius: 5, paintColor: '#ef4444', speed: 0, heading: 0, interval: 100, enabled: true, visible: true, originAtCenter: true, z: 1, triggers: [], visibilityCondition: null, rotation: 0 } },
    CANVAS: { id: 'CANVAS', label: 'Canvas', icon: Square, defaultSize: { w: 300, h: 200 }, defaultProps: { width: 300, height: 200, backgroundColor: 'var(--bg-panel)', backgroundImage: '', fontSize: 14, lineWidth: 2, paintColor: '#000000', tapThreshold: 15, extendMovesOutsideCanvas: false, visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    IMAGE_SPRITE: { id: 'IMAGE_SPRITE', label: 'ImageSprite', icon: ImageIcon, defaultProps: { x: 50, y: 50, width: 40, height: 40, picture: '', speed: 0, heading: 0, interval: 100, enabled: true, visible: true, rotates: true, originX: 0.5, originY: 0.5, z: 1, triggers: [], visibilityCondition: null, rotation: 0 } },

    // 5. Sensors
    ACCELEROMETER: { id: 'ACCELEROMETER', label: 'AccelerometerSensor', icon: Activity, defaultProps: { enabled: true, sensitivity: 'MODERATE', minimumInterval: 400, legacyMode: false, triggers: [], visibilityCondition: null, rotation: 0 } },
    BARCODE_SCANNER: { id: 'BARCODE_SCANNER', label: 'BarcodeScanner', icon: ScanLine, defaultProps: { useExternalScanner: true, result: '', triggers: [], visibilityCondition: null, rotation: 0 } },
    BAROMETER: { id: 'BAROMETER', label: 'Barometer', icon: CloudRain, defaultProps: { enabled: true, refreshTime: 1000, triggers: [], visibilityCondition: null, rotation: 0 } },
    CLOCK: { id: 'CLOCK', label: 'Clock', icon: Timer, defaultSize: { w: 48, h: 48 }, defaultProps: { timeInterval: 1000, timerEnabled: true, timerAlwaysFires: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    GYROSCOPE_SENSOR: { id: 'GYROSCOPE_SENSOR', label: 'GyroscopeSensor', icon: Compass, defaultProps: { enabled: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    HYGROMETER: { id: 'HYGROMETER', label: 'Hygrometer', icon: Droplets, defaultProps: { enabled: true, refreshTime: 1000, triggers: [], visibilityCondition: null, rotation: 0 } },
    LIGHT_SENSOR: { id: 'LIGHT_SENSOR', label: 'LightSensor', icon: Sun, defaultProps: { enabled: true, refreshTime: 1000, triggers: [], visibilityCondition: null, rotation: 0 } },
    LOCATION_SENSOR: { id: 'LOCATION_SENSOR', label: 'LocationSensor', icon: MapPin, defaultProps: { enabled: true, distanceInterval: 0, timeInterval: 60000, providerLocked: false, triggers: [], visibilityCondition: null, rotation: 0 } },
    MAGNETIC_FIELD_SENSOR: { id: 'MAGNETIC_FIELD_SENSOR', label: 'MagneticFieldSensor', icon: Magnet, defaultProps: { enabled: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    NEAR_FIELD: { id: 'NEAR_FIELD', label: 'NearField', icon: Nfc, defaultProps: { readMode: true, textToWrite: '', writeType: 1, triggers: [], visibilityCondition: null, rotation: 0 } },
    ORIENTATION_SENSOR: { id: 'ORIENTATION_SENSOR', label: 'OrientationSensor', icon: Smartphone, defaultProps: { enabled: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    PEDOMETER: { id: 'PEDOMETER', label: 'Pedometer', icon: Footprints, defaultProps: { stopDetectionTimeout: 2000, strideLength: 0.73, triggers: [], visibilityCondition: null, rotation: 0 } },
    PROXIMITY_SENSOR: { id: 'PROXIMITY_SENSOR', label: 'ProximitySensor', icon: Activity, defaultProps: { enabled: true, keepRunningWhenOnPause: false, triggers: [], visibilityCondition: null, rotation: 0 } },
    THERMOMETER: { id: 'THERMOMETER', label: 'Thermometer', icon: Thermometer, defaultProps: { enabled: true, refreshTime: 1000, triggers: [], visibilityCondition: null, rotation: 0 } },

    // 6. Storage
    CLOUD_DB: { id: 'CLOUD_DB', label: 'CloudDB', icon: Cloud, defaultProps: { projectID: '', redisPort: 6381, redisServer: 'DEFAULT', token: '', useSSL: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    DATA_FILE: { id: 'DATA_FILE', label: 'DataFile', icon: FileJson, defaultProps: { defaultScope: 'App', sourceFile: '', triggers: [], visibilityCondition: null, rotation: 0 } },
    FILE: { id: 'FILE', label: 'File', icon: FileInput, defaultProps: { defaultScope: 'App', readPermission: false, scope: 'App', writePermission: false, triggers: [], visibilityCondition: null, rotation: 0 } },
    SPREADSHEET: { id: 'SPREADSHEET', label: 'Spreadsheet', icon: Table, defaultProps: { applicationName: '', credentialsJson: '', spreadsheetID: '', triggers: [], visibilityCondition: null, rotation: 0 } },
    TINY_DB: { id: 'TINY_DB', label: 'TinyDB', icon: Database, defaultProps: { namespace: 'Default', triggers: [], visibilityCondition: null, rotation: 0 } },
    TINY_WEB_DB: { id: 'TINY_WEB_DB', label: 'TinyWebDB', icon: Globe, defaultProps: { serviceURL: 'http://tinywebdb.appinventor.mit.edu', triggers: [], visibilityCondition: null, rotation: 0 } },

    // 8. Maps
    MAP: { id: 'MAP', label: 'Map', icon: MapIcon, defaultProps: { center: '42.359144, -71.093612', zoomLevel: 13, mapType: 'Roads', enablePan: true, enableRotation: false, enableZoom: true, showCompass: false, showScale: false, showUser: false, showZoom: false, scaleUnits: 1, triggers: [], visibilityCondition: null, rotation: 0, width: '100%', height: '300px' } },
    MARKER: { id: 'MARKER', label: 'Marker', icon: MapPin, defaultProps: { latitude: 0, longitude: 0, title: '', description: '', draggable: false, enableInfobox: false, fillColor: '#ff0000', fillOpacity: 1.0, strokeColor: '#000000', strokeOpacity: 1.0, strokeWidth: 1, visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    CIRCLE: { id: 'CIRCLE', label: 'Circle', icon: Circle, defaultProps: { latitude: 0, longitude: 0, radius: 100, title: '', description: '', draggable: false, enableInfobox: false, fillColor: '#ff0000', fillOpacity: 0.5, strokeColor: '#000000', strokeOpacity: 1.0, strokeWidth: 1, visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    POLYGON: { id: 'POLYGON', label: 'Polygon', icon: Hexagon, defaultProps: { points: [], title: '', description: '', draggable: false, enableInfobox: false, fillColor: '#ff0000', fillOpacity: 0.5, strokeColor: '#000000', strokeOpacity: 1.0, strokeWidth: 1, visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    RECTANGLE: { id: 'RECTANGLE', label: 'Rectangle', icon: Square, defaultProps: { northLatitude: 0, southLatitude: 0, eastLongitude: 0, westLongitude: 0, title: '', description: '', draggable: false, enableInfobox: false, fillColor: '#ff0000', fillOpacity: 0.5, strokeColor: '#000000', strokeOpacity: 1.0, strokeWidth: 1, visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    LINE_STRING: { id: 'LINE_STRING', label: 'LineString', icon: Route, defaultProps: { points: [], title: '', description: '', draggable: false, enableInfobox: false, strokeColor: '#000000', strokeOpacity: 1.0, strokeWidth: 1, visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    FEATURE_COLLECTION: { id: 'FEATURE_COLLECTION', label: 'FeatureCollection', icon: Layers, defaultProps: { source: '', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    NAVIGATION: { id: 'NAVIGATION', label: 'Navigation', icon: Navigation, defaultProps: { apiKey: '', transportationMethod: 'foot-walking', language: 'en', triggers: [], visibilityCondition: null, rotation: 0 } },

    // 9. Charts
    CHART: { id: 'CHART', label: 'Chart', icon: BarChart2, defaultProps: { type: 'Line', description: '', gridEnabled: true, legendEnabled: true, backgroundColor: 'var(--bg-panel)', axesTextcolor: 'var(--text-primary)', xFromZero: false, yFromZero: false, pieRadius: 100, triggers: [], visibilityCondition: null, rotation: 0, width: '100%', height: '250px' } },
    CHART_DATA_2D: { id: 'CHART_DATA_2D', label: 'ChartData2D', icon: TrendingUp, defaultProps: { label: 'Data Series', color: '#3b82f6', lineType: 'linear', pointShape: 'circle', dataSourceKey: '', triggers: [], visibilityCondition: null, rotation: 0 } },
    TRENDLINE: { id: 'TRENDLINE', label: 'Trendline', icon: ArrowUpRight, defaultProps: { model: 'Linear', color: 'var(--text-quaternary)', extend: false, strokeWidth: 2, strokeStyle: 'dashed', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },

    // 10. Connectivity
    ACTIVITY_STARTER: { id: 'ACTIVITY_STARTER', label: 'ActivityStarter', icon: ExternalLink, defaultProps: { action: '', activityClass: '', activityPackage: '', dataType: '', dataUri: '', extras: [], resultName: '', triggers: [], visibilityCondition: null, rotation: 0 } },
    BLUETOOTH_CLIENT: { id: 'BLUETOOTH_CLIENT', label: 'BluetoothClient', icon: Bluetooth, defaultProps: { characterEncoding: 'UTF-8', delimiterByte: 0, disconnectOnError: false, highByteFirst: false, pollingRate: 10, secure: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    BLUETOOTH_SERVER: { id: 'BLUETOOTH_SERVER', label: 'BluetoothServer', icon: Server, defaultProps: { characterEncoding: 'UTF-8', delimiterByte: 0, highByteFirst: false, secure: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    SERIAL: { id: 'SERIAL', label: 'Serial', icon: Cpu, defaultProps: { baudRate: 9600, bufferSize: 256, triggers: [], visibilityCondition: null, rotation: 0 } },
    WEB: { id: 'WEB', label: 'Web', icon: Globe, defaultProps: { url: '', allowCookies: false, timeout: 0, responseFileName: '', responseTextEncoding: 'UTF-8', saveResponse: false, triggers: [], visibilityCondition: null, rotation: 0 } },

    // Advanced & Specialized (Mavi-MES custom)
    VISION_DETECTOR: { id: 'VISION_DETECTOR', label: 'Vision AI OCR', icon: Eye, defaultProps: { label: 'Scanner', triggers: [], visibilityCondition: null, rotation: 0 } },
    VISION_MEASUREMENT: {
        id: 'VISION_MEASUREMENT',
        label: 'Vision Measurement',
        icon: Camera,
        defaultSize: { w: 320, h: 240 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '',
            label: 'Caliper Reading',
            unit: 'mm',
            precision: 3,
            required: false,
            targetVariable: '',
            min: null,
            max: null,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    IOT_DEVICE: { id: 'IOT_DEVICE', label: 'IoT Connector', icon: Cpu, defaultProps: { topic: '', triggers: [], visibilityCondition: null, rotation: 0 } },
    INTERACTIVE_TABLE: {
        id: 'INTERACTIVE_TABLE',
        label: 'Data Table',
        icon: Table,
        defaultProps: {
            tableId: '',
            title: 'Data Table',
            dataSourceMode: 'TABLE', // TABLE | TABLE_QUERY | VARIABLE
            dataSourceVar: '',
            columns: [], // { header, key, format }
            enableFilter: true,
            enableExport: false,
            pageSize: 10,
            density: 'comfortable', // compact | comfortable
            savedViews: [], // { id, name, filters, sort, hiddenColumns, pinnedColumns }
            defaultViewId: '',
            quickFilterChips: [], // { label, column, value }
            columnConfig: {}, // { [colKey]: { hidden, width, pinned } }
            sortRules: [], // { field, direction }
            rowActions: [
                { id: 'open', label: 'Open', event: 'ON_ROW_OPEN' },
                { id: 'complete', label: 'Complete', event: 'ON_ROW_COMPLETE' }
            ],
            bulkActions: [
                { id: 'mark_complete', label: 'Mark Complete', field: 'status', value: 'Completed' },
                { id: 'mark_hold', label: 'Mark Hold', field: 'status', value: 'On Hold' }
            ],
            linkedRecordPlaceholderId: '',
            triggers: [],
            visibilityCondition: null,
            rotation: 0,
            conditionalFormattingRules: []
        }
    },
    ANALYTIC: {
        id: 'ANALYTIC',
        label: 'Analytic',
        icon: BarChart3,
        defaultSize: { w: 320, h: 180 },
        defaultProps: { analysisId: '', title: 'Live Analysis', refreshSeconds: 10, visible: true, triggers: [], visibilityCondition: null, rotation: 0 }
    },
    LEAN_DASHBOARD_WIDGET: {
        id: 'LEAN_DASHBOARD_WIDGET',
        label: 'Lean Dashboard',
        icon: LayoutDashboard,
        defaultSize: { w: 260, h: 320 },
        defaultProps: {
            letter: 'P',
            incidents: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
            targetVariable: '',
            month: new Date().toISOString(),
            location: 'Boston',
            preventUpdates: false,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    VIDEO: {
        id: 'VIDEO',
        label: 'Video',
        icon: Video,
        defaultSize: { w: 320, h: 180 },
        defaultProps: { videoUrl: '', url: '', autoplay: false, controls: true, loop: false, muted: false, visible: true, triggers: [], visibilityCondition: null, rotation: 0 }
    },
    DOCUMENT: {
        id: 'DOCUMENT',
        label: 'Document',
        icon: FileText,
        defaultSize: { w: 320, h: 220 },
        defaultProps: { url: '', title: 'Document', page: 1, visible: true, triggers: [], visibilityCondition: null, rotation: 0 }
    },
    AI_CHAT: {
        id: 'AI_CHAT',
        label: 'AI Chat',
        icon: Sparkles,
        defaultSize: { w: 320, h: 260 },
        defaultProps: { title: 'AI Assistant', placeholder: 'Ask anything...', systemPrompt: '', model: 'gpt-5.2', visible: true, triggers: [], visibilityCondition: null, rotation: 0 }
    },
    CAD_VIEWER: {
        id: 'CAD_VIEWER',
        label: 'CAD',
        icon: Layers,
        defaultSize: { w: 320, h: 220 },
        defaultProps: { source: '', fileUrl: '', title: 'CAD Viewer', format: 'STL', backgroundcolor: 'var(--text-primary)', showGrid: true, autoRotate: false, visible: true, triggers: [], visibilityCondition: null, rotation: 0 }
    },
    WEBPAGE: {
        id: 'WEBPAGE',
        label: 'Webpage',
        icon: Globe,
        defaultSize: { w: 320, h: 220 },
        defaultProps: { url: '', followLinks: true, visible: true, triggers: [], visibilityCondition: null, rotation: 0 }
    },
    GRID: {
        id: 'GRID',
        label: 'Grid',
        icon: Grid3X3,
        defaultSize: { w: 320, h: 180 },
        defaultProps: { rows: 3, cols: 3, showLines: true, cellPadding: 8, visible: true, triggers: [], visibilityCondition: null, rotation: 0 }
    },
    MACHINE_ATTRIBUTE: {
        id: 'MACHINE_ATTRIBUTE',
        label: 'Machine Attribute',
        icon: Cpu,
        defaultSize: { w: 220, h: 90 },
        defaultProps: { machineId: '', attribute: 'Temperature', value: '--', unit: '', visible: true, triggers: [], visibilityCondition: null, rotation: 0 }
    },
    MACHINE_TIMELINE: {
        id: 'MACHINE_TIMELINE',
        label: 'Machine Timeline',
        icon: Activity,
        defaultSize: { w: 320, h: 120 },
        defaultProps: { machineId: '', timeRange: '8h', visible: true, triggers: [], visibilityCondition: null, rotation: 0 }
    },
    STEP_TIME: {
        id: 'STEP_TIME',
        label: 'Step Time',
        icon: Timer,
        defaultSize: { w: 180, h: 56 },
        defaultProps: { mode: 'ELAPSED', format: 'mm:ss', value: '00:00', visible: true, triggers: [], visibilityCondition: null, rotation: 0 }
    },
    GAUGE: {
        id: 'GAUGE',
        label: 'Gauge',
        icon: Gauge,
        defaultSize: { w: 240, h: 90 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '', value: 0, min: 0, max: 100, unit: '%', color: '#3b82f6', label: 'KPI', visible: true, triggers: [], visibilityCondition: null, rotation: 0, conditionalFormattingRules: [] }
    },

    // Industrial Embedded Widgets (Tulip Parity)
    MACHINE_STATUS: {
        id: 'MACHINE_STATUS',
        label: 'Machine Status',
        icon: Zap,
        defaultProps: {
            status: 'RUNNING',
            label: 'Machine 01',
            runningColor: '#22c55e',
            stoppedColor: '#ef4444',
            faultColor: '#f59e0b',
            showLabel: true,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    PDF_VIEWER: {
        id: 'PDF_VIEWER',
        label: 'PDF Viewer',
        icon: FileText,
        defaultProps: {
            url: '',
            title: 'SOP Document',
            page: 1,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    CAMERA_SCANNER: {
        id: 'CAMERA_SCANNER',
        label: 'Camera Scanner',
        icon: Webcam,
        defaultProps: {
            active: true,
            scanType: 'QR_CODE',
            lastResult: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    DIAL_GAUGE: {
        id: 'DIAL_GAUGE',
        label: 'Dial Gauge',
        icon: Disc,
        defaultSize: { w: 180, h: 200 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '',
            title: 'DIAL INDICATOR',
            value: 0,
            min: 0,
            max: 100,
            unit: 'mm',
            color: '#2563eb',
            showCaptureButton: true,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0,
            conditionalFormattingRules: []
        }
    },
    GAUGE_CIRCULAR: {
        id: 'GAUGE_CIRCULAR',
        label: 'Circular Gauge',
        icon: Disc,
        defaultSize: { w: 160, h: 120 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '',
            title: 'Circular Gauge',
            value: 45,
            min: 0,
            max: 100,
            unit: '%',
            color: '#3b82f6',
            showCaptureButton: true,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0,
            conditionalFormattingRules: []
        }
    },
    ANOMALY_DETECTION: { id: 'ANOMALY_DETECTION', label: 'AnomalyDetection', icon: AlertTriangle, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    REGRESSION: { id: 'REGRESSION', label: 'Regression', icon: LineChart, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },

    // 11. Social
    CONTACT_PICKER: { id: 'CONTACT_PICKER', label: 'ContactPicker', icon: UserCircle, defaultProps: { backgroundColor: 'var(--bg-panel)', textcolor: 'var(--text-primary)', text: 'Select Contact', fontSize: 14, fontBold: false, fontItalic: false, fontTypeface: 'SANS_SERIF', enabled: true, visible: true, shape: 0, showFeedback: true, contactName: '', emailAddress: '', phoneNumber: '', picture: '', triggers: [], visibilityCondition: null, rotation: 0, width: 'automatic', height: 'automatic' } },
    EMAIL_PICKER: { id: 'EMAIL_PICKER', label: 'EmailPicker', icon: Mail, defaultProps: { backgroundColor: 'var(--bg-panel)', textcolor: 'var(--text-primary)', text: '', hint: 'Email address...', fontSize: 14, fontBold: false, fontItalic: false, fontTypeface: 'SANS_SERIF', enabled: true, visible: true, triggers: [], visibilityCondition: null, rotation: 0, width: 'automatic', height: 'automatic' } },
    PHONE_CALL: { id: 'PHONE_CALL', label: 'PhoneCall', icon: Phone, defaultProps: { phoneNumber: '', triggers: [], visibilityCondition: null, rotation: 0 } },
    PHONE_NUMBER_PICKER: { id: 'PHONE_NUMBER_PICKER', label: 'PhoneNumberPicker', icon: UserPlus, defaultProps: { backgroundColor: 'var(--bg-panel)', textcolor: 'var(--text-primary)', text: 'Select Phone', fontSize: 14, fontBold: false, fontItalic: false, fontTypeface: 'SANS_SERIF', enabled: true, visible: true, shape: 0, showFeedback: true, contactName: '', phoneNumber: '', triggers: [], visibilityCondition: null, rotation: 0, width: 'automatic', height: 'automatic' } },
    SHARING: { id: 'SHARING', label: 'Sharing', icon: Share2, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    TEXTING: { id: 'TEXTING', label: 'Texting', icon: MessageSquare, defaultProps: { phoneNumber: '', message: '', receivingEnabled: 1, googleVoiceEnabled: false, triggers: [], visibilityCondition: null, rotation: 0 } },

    // Tulip Parity Custom Widgets
    SIGNATURE_PAD: {
        id: 'SIGNATURE_PAD',
        label: 'Signature Pad',
        icon: Edit3,
        defaultSize: { w: 300, h: 150 },
        defaultProps: {
            backgroundColor: 'var(--bg-panel)',
            pencolor: 'var(--text-primary)',
            thickness: 2,
            required: false,
            visible: true,
            enabled: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SIGNATURE: {
        id: 'SIGNATURE',
        label: 'Electronic Signature',
        icon: ShieldCheck,
        defaultSize: { w: 340, h: 180 },
        defaultProps: {
            signatureMode: 'AUTH', // AUTH | DRAW
            required: false,
            signeeType: 'ANY_OPERATOR', // ANY_OPERATOR | APP_EXECUTOR | NOT_APP_EXECUTOR | ALLOWED_USERS
            allowedUsersCsv: '',
            signatureMeaning: 'I confirm this data is accurate.',
            commentMandatory: false,
            dataToSignMode: 'VARIABLES', // VARIABLES | RECORD_PLACEHOLDER | BOTH
            dataToSignPlaceholderId: '',
            lockStepOnSign: true,
            visible: true,
            enabled: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    MEASUREMENT_WIDGET: {
        id: 'MEASUREMENT_WIDGET',
        label: 'Measurement',
        icon: Ruler,
        defaultSize: { w: 240, h: 120 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '',
            label: 'Caliper/Micrometer',
            connectionType: 'SERIAL',
            baudRate: 9600,
            unit: 'mm',
            precision: 3,
            min: 0,
            max: 100,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    OUTSIDE_MICROMETER: {
        id: 'OUTSIDE_MICROMETER',
        label: 'Outside Micrometer',
        icon: Maximize,
        defaultSize: { w: 260, h: 130 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '',
            label: 'Outside Micrometer',
            connectionType: 'SERIAL',
            baudRate: 9600,
            unit: 'mm',
            precision: 3,
            min: 0,
            max: 25,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    INSIDE_MICROMETER: {
        id: 'INSIDE_MICROMETER',
        label: 'Inside Micrometer',
        icon: Minimize,
        defaultSize: { w: 260, h: 130 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '',
            label: 'Inside Micrometer',
            connectionType: 'SERIAL',
            baudRate: 9600,
            unit: 'mm',
            precision: 3,
            min: 5,
            max: 30,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    DIAL_HEIGHT_GAUGE: {
        id: 'DIAL_HEIGHT_GAUGE',
        label: 'Dial Height Gauge',
        icon: ArrowUp,
        defaultSize: { w: 240, h: 150 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '',
            label: 'Height Gauge',
            connectionType: 'SERIAL',
            baudRate: 9600,
            unit: 'mm',
            precision: 3,
            min: 0,
            max: 300,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    DEPTH_GAUGE: {
        id: 'DEPTH_GAUGE',
        label: 'Depth Gauge',
        icon: ArrowDown,
        defaultSize: { w: 240, h: 120 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '',
            label: 'Depth Gauge',
            connectionType: 'SERIAL',
            baudRate: 9600,
            unit: 'mm',
            precision: 3,
            min: 0,
            max: 150,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ROUGHNESS_TESTER: {
        id: 'ROUGHNESS_TESTER',
        label: 'Roughness Tester',
        icon: Activity,
        defaultSize: { w: 260, h: 140 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '',
            label: 'Roughness Tester',
            connectionType: 'SERIAL',
            baudRate: 9600,
            unit: 'µm',
            precision: 3,
            min: 0,
            max: 10,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    TORQUE_WRENCH: {
        id: 'TORQUE_WRENCH',
        label: 'Torque Wrench',
        icon: Wrench || Ruler || Settings,
        defaultSize: { w: 280, h: 120 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '',
            label: 'Torque Wrench',
            connectionType: 'SERIAL',
            baudRate: 9600,
            unit: 'Nm',
            precision: 1,
            min: 0,
            max: 200,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    WEIGHING_SCALE: {
        id: 'WEIGHING_SCALE',
        label: 'Weighing Scale',
        icon: Weight,
        defaultSize: { w: 260, h: 140 },
        defaultProps: { selectedDrawingId: '', selectedDimensionId: '',
            label: 'Scale',
            connectionType: 'SERIAL',
            baudRate: 9600,
            unit: 'kg',
            precision: 2,
            min: 0,
            max: 500,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    CUSTOM_WIDGET: {
        id: 'CUSTOM_WIDGET',
        label: 'Custom Widget',
        icon: Code,
        defaultSize: { w: 320, h: 220 },
        defaultProps: {
            title: 'Custom Widget',
            htmlTemplate: '<div style="padding:12px;font-family:Arial,sans-serif;">Custom Widget</div>',
            cssTemplate: '',
            jsTemplate: '',
            inputVar: '',
            outputVar: '',
            visible: true,
            enabled: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_BOARD: {
        id: 'ARDUINO_BOARD',
        label: 'Arduino Board',
        icon: Cpu,
        defaultSize: { w: 320, h: 180 },
        defaultProps: {
            label: 'Arduino Uno',
            boardType: 'UNO',
            connectionType: 'SERIAL',
            baudRate: 9600,
            port: '',
            status: 'disconnected',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_PIN_MONITOR: {
        id: 'ARDUINO_PIN_MONITOR',
        label: 'Arduino Pin Monitor',
        icon: Activity,
        defaultSize: { w: 220, h: 120 },
        defaultProps: {
            label: 'Analog Pin A0',
            pin: 'A0',
            pinMode: 'ANALOG_INPUT',
            precision: 0,
            unit: '',
            multiplier: 1,
            offset: 0,
            targetVariable: '',
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/read/A0',
            wifiIpAddress: '192.168.1.100',
            wifiPollingInterval: 1000,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_CONTROLLER: {
        id: 'ARDUINO_CONTROLLER',
        label: 'Arduino Pin Controller',
        icon: ToggleLeft,
        defaultSize: { w: 220, h: 120 },
        defaultProps: {
            label: 'Digital Output D13',
            pin: '13',
            controlType: 'TOGGLE',
            min: 0,
            max: 255,
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttPublishTopic: 'arduino/write/13',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            enabled: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_GRAPH: {
        id: 'ARDUINO_GRAPH',
        label: 'Arduino Real-time Graph',
        icon: BarChart3,
        defaultSize: { w: 400, h: 220 },
        defaultProps: {
            label: 'Sensor Plotter',
            pin: 'A0',
            maxSamples: 50,
            color: '#00979d',
            multiplier: 1,
            offset: 0,
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/read/A0',
            wifiIpAddress: '192.168.1.100',
            wifiPollingInterval: 1000,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_CONSOLE: {
        id: 'ARDUINO_CONSOLE',
        label: 'Arduino Terminal Console',
        icon: Terminal,
        defaultSize: { w: 360, h: 240 },
        defaultProps: {
            label: 'Serial/MQTT Log',
            maxLines: 100,
            showTimestamp: true,
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/read/#',
            mqttPublishTopic: 'arduino/write/console',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_GAUGE: {
        id: 'ARDUINO_GAUGE',
        label: 'Arduino Circular Gauge',
        icon: Gauge,
        defaultSize: { w: 220, h: 220 },
        defaultProps: {
            label: 'Suhu / Tekanan',
            pin: 'A0',
            min: 0,
            max: 1023,
            multiplier: 1,
            offset: 0,
            color: '#00979d',
            unit: '°C',
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/read/A0',
            wifiIpAddress: '192.168.1.100',
            wifiPollingInterval: 1000,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_COLOR_PICKER: {
        id: 'ARDUINO_COLOR_PICKER',
        label: 'Arduino RGB Color Picker',
        icon: Palette,
        defaultSize: { w: 240, h: 240 },
        defaultProps: {
            label: 'LED RGB Control',
            pin: '6',
            format: 'RGB',
            color: '#ff0000',
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttPublishTopic: 'arduino/write/6',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_MOTOR: {
        id: 'ARDUINO_MOTOR',
        label: 'Arduino Motor Controller',
        icon: RotateCw,
        defaultSize: { w: 260, h: 200 },
        defaultProps: {
            label: 'Servo/DC Motor',
            pin: '9',
            motorType: 'SERVO',
            min: 0,
            max: 180,
            speed: 100,
            stepSize: 10,
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttPublishTopic: 'arduino/write/9',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_RFID: {
        id: 'ARDUINO_RFID',
        label: 'Arduino RFID Reader',
        icon: CreditCard,
        defaultSize: { w: 220, h: 180 },
        defaultProps: {
            label: 'RFID Reader',
            pin: '10',
            allowedCards: 'A1B2C3D4, E5F6G7H8',
            lastCardId: '',
            verified: null,
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/rfid/scan',
            wifiIpAddress: '192.168.1.100',
            targetVariable: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_LCD: {
        id: 'ARDUINO_LCD',
        label: 'Arduino 1602 LCD Display',
        icon: Tv,
        defaultSize: { w: 320, h: 140 },
        defaultProps: {
            label: 'LCD Display 1602',
            pin: 'I2C',
            line1: 'Mavi IoT System',
            line2: 'Status: Ready',
            backlightColor: '#00979d',
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/lcd/display',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_JOYSTICK: {
        id: 'ARDUINO_JOYSTICK',
        label: 'Arduino XY Joystick',
        icon: Gamepad2,
        defaultSize: { w: 220, h: 220 },
        defaultProps: {
            label: 'XY Joystick',
            pinX: 'A0',
            pinY: 'A1',
            pinSel: '2',
            xVal: 512,
            yVal: 512,
            zVal: 0,
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/joystick',
            wifiIpAddress: '192.168.1.100',
            wifiPollingInterval: 100,
            targetVariable: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_KEYPAD: {
        id: 'ARDUINO_KEYPAD',
        label: 'Arduino 4x4 Keypad',
        icon: Grid3X3,
        defaultSize: { w: 240, h: 260 },
        defaultProps: {
            label: '4x4 Keypad',
            lastKeyPressed: '',
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/keypad/key',
            wifiIpAddress: '192.168.1.100',
            targetVariable: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_MATRIX: {
        id: 'ARDUINO_MATRIX',
        label: 'Arduino 8x8 Dot Matrix',
        icon: Grid3X3,
        defaultSize: { w: 260, h: 300 },
        defaultProps: {
            label: '8x8 Dot Matrix',
            pin: '4',
            matrixData: ['00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000'],
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttPublishTopic: 'arduino/matrix/frame',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_RTC: {
        id: 'ARDUINO_RTC',
        label: 'Arduino RTC Sync Clock',
        icon: Clock,
        defaultSize: { w: 240, h: 160 },
        defaultProps: {
            label: 'RTC Sync Clock',
            pin: 'I2C',
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/rtc/time',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_RADAR: {
        id: 'ARDUINO_RADAR',
        label: 'Arduino Radar Sweep',
        icon: Compass,
        defaultSize: { w: 280, h: 300 },
        defaultProps: {
            label: 'Radar Sweep',
            pin: 'A0',
            maxDistance: 200,
            angleSweep: 180,
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/read/A0',
            wifiIpAddress: '192.168.1.100',
            wifiPollingInterval: 200,
            targetVariable: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_TANK: {
        id: 'ARDUINO_TANK',
        label: 'SCADA Liquid Tank',
        icon: Database,
        defaultSize: { w: 200, h: 300 },
        defaultProps: {
            label: 'Liquid Tank',
            pin: 'A0',
            liquidColor: '#3b82f6',
            capacity: 1000,
            warningThreshold: 80,
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/read/A0',
            wifiIpAddress: '192.168.1.100',
            wifiPollingInterval: 1000,
            targetVariable: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_MODBUS: {
        id: 'ARDUINO_MODBUS',
        label: 'Modbus Register Map',
        icon: Table,
        defaultSize: { w: 320, h: 260 },
        defaultProps: {
            label: 'Modbus Viewer',
            clientAddress: 1,
            baudRate: 9600,
            connectionType: 'SERIAL',
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'modbus/registers/#',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_STATUS_GRID: {
        id: 'ARDUINO_STATUS_GRID',
        label: 'Status Lights Grid',
        icon: LayoutGrid,
        defaultSize: { w: 300, h: 200 },
        defaultProps: {
            label: 'Relay Channels',
            pins: 'D2,D3,D4,D5',
            pinLabels: 'Relay 1,Relay 2,Motor Status,Limit Switch',
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/read/#',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_OSCILLOSCOPE: {
        id: 'ARDUINO_OSCILLOSCOPE',
        label: 'Mini Oscilloscope',
        icon: Activity,
        defaultSize: { w: 340, h: 220 },
        defaultProps: {
            label: 'Analog Oscilloscope',
            pin: 'A0',
            timebase: 50,
            amplitude: 5,
            connectionType: 'SERIAL',
            baudRate: 115200,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/read/A0',
            wifiIpAddress: '192.168.1.100',
            wifiPollingInterval: 100,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_THERMAL: {
        id: 'ARDUINO_THERMAL',
        label: 'Thermal Infra-Red Matrix',
        icon: Sun,
        defaultSize: { w: 260, h: 280 },
        defaultProps: {
            label: 'Thermal Camera AMG8833',
            pin: 'I2C',
            colorPalette: 'IRONBOW',
            maxTemp: 80,
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/thermal/frame',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_THERMOMETER: {
        id: 'ARDUINO_THERMOMETER',
        label: 'Linear Thermometer Bar',
        icon: Thermometer,
        defaultSize: { w: 180, h: 280 },
        defaultProps: {
            label: 'Temperature Level',
            pin: 'A0',
            minVal: 0,
            maxVal: 100,
            unit: '°C',
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/read/A0',
            wifiIpAddress: '192.168.1.100',
            wifiPollingInterval: 1000,
            targetVariable: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_SCADA_VALVE: {
        id: 'ARDUINO_SCADA_VALVE',
        label: 'SCADA Valve',
        icon: ToggleLeft,
        defaultSize: { w: 220, h: 150 },
        defaultProps: {
            label: 'Solenoid Valve',
            valveType: 'SOLENOID', // SOLENOID | CONTROL
            state: false, // boolean for solenoid (open/closed) or number (0-100) for control
            pin: 'D3',
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/valve/status',
            mqttPublishTopic: 'arduino/valve/control',
            wifiIpAddress: '192.168.1.100',
            targetVariable: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_SCADA_PUMP: {
        id: 'ARDUINO_SCADA_PUMP',
        label: 'SCADA Pump/Fan',
        icon: RotateCw,
        defaultSize: { w: 220, h: 160 },
        defaultProps: {
            label: 'Centrifugal Pump',
            pumpType: 'CENTRIFUGAL', // CENTRIFUGAL | VACUUM | FAN
            state: false,
            speed: 0, // 0-100% or RPM
            pin: 'D9',
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/pump/status',
            mqttPublishTopic: 'arduino/pump/control',
            wifiIpAddress: '192.168.1.100',
            targetVariable: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_SCADA_PIPE: {
        id: 'ARDUINO_SCADA_PIPE',
        label: 'SCADA Pipe Flow',
        icon: SlidersHorizontal,
        defaultSize: { w: 250, h: 70 },
        defaultProps: {
            label: 'Flow Pipeline',
            flowActive: true,
            flowSpeed: 2,
            flowColor: '#3b82f6',
            orientation: 'HORIZONTAL', // HORIZONTAL | VERTICAL
            pin: 'D2',
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/pipe/status',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_SCADA_ESTOP: {
        id: 'ARDUINO_SCADA_ESTOP',
        label: 'SCADA Emergency Stop',
        icon: Power,
        defaultSize: { w: 180, h: 180 },
        defaultProps: {
            label: 'EMERGENCY STOP',
            state: false, // true = tripped, false = normal/reset
            requireConfirmation: true,
            pin: 'D10',
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttPublishTopic: 'arduino/estop/trip',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_SCADA_ALARM_BANNER: {
        id: 'ARDUINO_SCADA_ALARM_BANNER',
        label: 'SCADA Alarm Annunciator',
        icon: Bell,
        defaultSize: { w: 450, h: 220 },
        defaultProps: {
            label: 'Active System Alarms',
            maxAlarms: 10,
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/alarms',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    ARDUINO_SCADA_PID: {
        id: 'ARDUINO_SCADA_PID',
        label: 'SCADA PID Faceplate',
        icon: BarChart3,
        defaultSize: { w: 300, h: 320 },
        defaultProps: {
            label: 'PID Controller',
            sp: 50,
            pv: 45,
            op: 30,
            kp: 1.5,
            ki: 0.2,
            kd: 0.1,
            mode: 'AUTO', // AUTO | MANUAL
            pinSP: 'A0',
            pinPV: 'A1',
            pinOP: 'D5',
            connectionType: 'SERIAL',
            baudRate: 9600,
            mqttBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            mqttSubscribeTopic: 'arduino/pid/status',
            mqttPublishTopic: 'arduino/pid/control',
            wifiIpAddress: '192.168.1.100',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    MULTI_SELECT: {
        id: 'MULTI_SELECT',
        label: 'MultiSelect Dropdown',
        icon: List,
        defaultSize: { w: 200, h: 45 },
        defaultProps: {
            options: ['Option A', 'Option B', 'Option C'],
            selection: [],
            placeholder: 'Select items...',
            maxSelections: 0, // 0 for unlimited
            backgroundColor: 'var(--bg-panel)',
            textcolor: 'var(--text-primary)',
            fontSize: 14,
            visible: true,
            enabled: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    TABLE_AGGREGATION: {
        id: 'TABLE_AGGREGATION',
        label: 'Table Aggregation',
        icon: BarChart3,
        defaultSize: { w: 160, h: 80 },
        defaultProps: {
            tableId: '',
            column: '',
            calculation: 'COUNT', // COUNT, SUM, AVG, MIN, MAX
            prefix: '',
            suffix: '',
            fontSize: 24,
            textcolor: 'var(--text-primary)',
            backgroundColor: 'var(--bg-secondary)',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    RECORD_DISPLAY: {
        id: 'RECORD_DISPLAY',
        label: 'Record Card',
        icon: TableProperties,
        defaultSize: { w: 300, h: 200 },
        defaultProps: {
            placeholderId: '',
            fieldsToShow: [], // Array of field names
            backgroundColor: 'var(--bg-panel)',
            borderColor: '#e2e8f0',
            textcolor: 'var(--text-primary)',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    OBD2_SCANNER: {
        id: 'OBD2_SCANNER',
        label: 'OBD2 Scanner',
        icon: Car,
        defaultSize: { w: 260, h: 140 },
        defaultProps: {
            label: 'OBD2 Live Data',
            transport: 'BLUETOOTH', // BLUETOOTH | SERIAL
            protocol: 'AUTO',
            pid: '010C', // Engine RPM
            unit: 'rpm',
            connected: false,
            lastValue: '--',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    OBD2_RPM: { id: 'OBD2_RPM', label: 'Engine RPM', icon: Gauge, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '010C', unit: 'rpm', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_SPEED: { id: 'OBD2_SPEED', label: 'Vehicle Speed', icon: TrendingUp, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '010D', unit: 'km/h', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_COOLANT_TEMP: { id: 'OBD2_COOLANT_TEMP', label: 'Coolant Temp', icon: Thermometer, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '0105', unit: '°C', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_THROTTLE: { id: 'OBD2_THROTTLE', label: 'Throttle Position', icon: SlidersHorizontal, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '0111', unit: '%', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_ENGINE_LOAD: { id: 'OBD2_ENGINE_LOAD', label: 'Engine Load', icon: Activity, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '0104', unit: '%', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_MAF: { id: 'OBD2_MAF', label: 'MAF', icon: Wind, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '0110', unit: 'g/s', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_IAT: { id: 'OBD2_IAT', label: 'Intake Air Temp', icon: ThermometerSun, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '010F', unit: '°C', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_FUEL_LEVEL: { id: 'OBD2_FUEL_LEVEL', label: 'Fuel Level', icon: Fuel, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '012F', unit: '%', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_FUEL_PRESSURE: { id: 'OBD2_FUEL_PRESSURE', label: 'Fuel Pressure', icon: Gauge, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '010A', unit: 'kPa', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_STFT: { id: 'OBD2_STFT', label: 'STFT', icon: LineChart, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '0106', unit: '%', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_LTFT: { id: 'OBD2_LTFT', label: 'LTFT', icon: LineChart, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '0107', unit: '%', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_AFR: { id: 'OBD2_AFR', label: 'Air-Fuel Ratio', icon: Sigma, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '0144', unit: 'AFR', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_O2_SENSOR: { id: 'OBD2_O2_SENSOR', label: 'O2 Sensor', icon: Activity, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '0114', unit: 'V', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_IGNITION_TIMING: { id: 'OBD2_IGNITION_TIMING', label: 'Ignition Timing', icon: Zap, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '010E', unit: '°', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_KNOCK: { id: 'OBD2_KNOCK', label: 'Knock Sensor', icon: AlertTriangle, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: 'KNOCK', unit: '', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_TORQUE_EST: { id: 'OBD2_TORQUE_EST', label: 'Torque (Est.)', icon: Wrench, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: 'TORQUE_EST', unit: 'Nm', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_HP_EST: { id: 'OBD2_HP_EST', label: 'Horsepower (Est.)', icon: TrendingUp, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: 'HP_EST', unit: 'HP', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_OIL_TEMP: { id: 'OBD2_OIL_TEMP', label: 'Oil Temperature', icon: Thermometer, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '015C', unit: '°C', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_MAP: { id: 'OBD2_MAP', label: 'MAP Pressure', icon: Cloud, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '010B', unit: 'kPa', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_BARO: { id: 'OBD2_BARO', label: 'Barometric Pressure', icon: CloudRain, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '0133', unit: 'kPa', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_BOOST: { id: 'OBD2_BOOST', label: 'Boost Pressure', icon: Gauge, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: 'BOOST_EST', unit: 'bar', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_BATTERY_VOLTAGE: { id: 'OBD2_BATTERY_VOLTAGE', label: 'Battery Voltage', icon: BatteryCharging, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '0142', unit: 'V', value: '--', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_DTC: { id: 'OBD2_DTC', label: 'DTC Codes', icon: Bug, defaultSize: { w: 260, h: 120 }, defaultProps: { pid: 'DTC', value: '[]', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_MIL_STATUS: { id: 'OBD2_MIL_STATUS', label: 'Check Engine (MIL)', icon: AlertTriangle, defaultSize: { w: 220, h: 110 }, defaultProps: { pid: '0101', value: 'OFF', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_FREEZE_FRAME: { id: 'OBD2_FREEZE_FRAME', label: 'Freeze Frame', icon: FileText, defaultSize: { w: 260, h: 120 }, defaultProps: { pid: 'FREEZE_FRAME', value: '{}', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_CLEAR_DTC: { id: 'OBD2_CLEAR_DTC', label: 'Clear DTC', icon: Trash2, defaultSize: { w: 180, h: 50 }, defaultProps: { action: 'CLEAR_DTC', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    OBD2_WARNING: { id: 'OBD2_WARNING', label: 'Engine Warnings', icon: AlertTriangle, defaultSize: { w: 260, h: 120 }, defaultProps: { label: 'Engine Warnings', speedLimit: 100, maxTemp: 98, minVoltage: 11.5, visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    PAYMENT_GATEWAY: {
        id: 'PAYMENT_GATEWAY',
        label: 'Payment / QRIS',
        icon: Wallet,
        defaultSize: { w: 320, h: 420 },
        defaultProps: {
            title: 'Scan to Pay',
            amount: 50000,
            amountVariable: '',
            provider: 'Midtrans',
            method: 'QRIS',
            orderIdVariable: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    KEYBOARD_PRO: {
        id: 'KEYBOARD_PRO',
        label: 'Keyboard UI/UX Pro',
        icon: Keyboard,
        defaultSize: { w: 360, h: 200 },
        defaultProps: {
            label: 'Keyboard Pro',
            theme: 'dark',
            targetVariable: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    NUMPAD: {
        id: 'NUMPAD',
        label: 'Numeric Numpad',
        icon: Grid3X3,
        defaultSize: { w: 200, h: 280 },
        defaultProps: {
            label: 'Numpad',
            targetVariable: '',
            allowDecimal: false,
            decimalPlaces: 3,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },

    // Additional & Chromeless Types (Defensive definitions to prevent crashes)
    IOT_CONNECTOR: { id: 'IOT_CONNECTOR', label: 'IoT Connector', icon: Cpu, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    DATABASE_CONNECTOR: { id: 'DATABASE_CONNECTOR', label: 'Database Connector', icon: Database, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    API_CONNECTOR: { id: 'API_CONNECTOR', label: 'API Connector', icon: Globe, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    LOGIC_NODE: { id: 'LOGIC_NODE', label: 'Logic Node', icon: Blocks, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    EVENT_TRIGGER: { id: 'EVENT_TRIGGER', label: 'Event Trigger', icon: Zap, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    BARCODE: { id: 'BARCODE', label: 'Barcode', icon: ScanLine, defaultSize: { w: 220, h: 90 }, defaultProps: { value: '1234567890', format: 'QR_CODE', showText: true, foregroundColor: '#111827', backgroundColor: 'var(--bg-panel)', triggers: [], visibilityCondition: null, rotation: 0 } },
    FILE_UPLOAD: { id: 'FILE_UPLOAD', label: 'File Upload', icon: Upload, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    MEDIA_RECORDER: { id: 'MEDIA_RECORDER', label: 'Media Recorder', icon: Mic, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    BARCODE_SCANNER_NON_VISIBLE: { id: 'BARCODE_SCANNER_NON_VISIBLE', label: 'Scanner (Non-visible)', icon: ScanLine, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    NUMBER_INPUT: { id: 'NUMBER_INPUT', label: 'Number Input', icon: Hash, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    MENU: { id: 'MENU', label: 'Menu', icon: Menu, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    TIMER: { id: 'TIMER', label: 'Timer', icon: Clock, defaultProps: { triggers: [], visibilityCondition: null, rotation: 0 } },
    PRINT_AREA: { id: 'PRINT_AREA', label: 'Print Area', icon: Square, defaultSize: { w: 200, h: 200 }, defaultProps: { border: '2px dashed #ef4444', backgroundColor: 'transparent', visible: true, triggers: [], visibilityCondition: null, rotation: 0 } },
    SCADA_PIPE: {
        id: 'SCADA_PIPE',
        label: 'SCADA Pipe',
        icon: MoveHorizontal,
        defaultSize: { w: 200, h: 24 },
        defaultProps: {
            direction: 'horizontal',
            fluidColor: '#06b6d4',
            flowSpeed: 2,
            isActive: true,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_VALVE: {
        id: 'SCADA_VALVE',
        label: 'SCADA Valve',
        icon: Settings2,
        defaultSize: { w: 60, h: 60 },
        defaultProps: {
            targetVariable: '',
            colorOpen: '#22c55e',
            colorClosed: '#ef4444',
            valveState: 'CLOSED',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_TANK: {
        id: 'SCADA_TANK',
        label: 'SCADA Tank',
        icon: Database,
        defaultSize: { w: 120, h: 200 },
        defaultProps: {
            targetVariable: '',
            capacity: 100,
            unit: 'L',
            fluidColor: '#3b82f6',
            showLabel: true,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_PUMP: {
        id: 'SCADA_PUMP',
        label: 'SCADA Pump',
        icon: Settings2,
        defaultSize: { w: 80, h: 80 },
        defaultProps: {
            targetVariable: '',
            colorRunning: '#22c55e',
            colorStopped: '#ef4444',
            colorFault: '#eab308',
            pumpState: 'STOPPED',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_ALARM_SUMMARY: {
        id: 'SCADA_ALARM_SUMMARY',
        label: 'Alarm Summary',
        icon: Bell,
        defaultSize: { w: 600, h: 220 },
        defaultProps: {
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    // ===== BATCH 1: PROCESS EQUIPMENT =====
    SCADA_MOTOR: {
        id: 'SCADA_MOTOR',
        label: 'Motor',
        icon: Cog,
        defaultSize: { w: 100, h: 100 },
        defaultProps: {
            targetVariable: '',
            label: 'M-101',
            motorState: 'STOPPED', // STOPPED | RUNNING | FAULT
            rpm: 0,
            current: 0,
            colorRunning: '#22c55e',
            colorStopped: '#64748b',
            colorFault: '#ef4444',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_CONVEYOR: {
        id: 'SCADA_CONVEYOR',
        label: 'Conveyor',
        icon: ArrowRight,
        defaultSize: { w: 300, h: 80 },
        defaultProps: {
            targetVariable: '',
            label: 'CONV-101',
            conveyorState: 'STOPPED',
            speed: 0,
            direction: 'RIGHT',
            beltColor: '#475569',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_MIXER: {
        id: 'SCADA_MIXER',
        label: 'Mixer / Agitator',
        icon: RotateCw,
        defaultSize: { w: 120, h: 160 },
        defaultProps: {
            targetVariable: '',
            label: 'MIX-101',
            mixerState: 'STOPPED',
            rpm: 0,
            colorRunning: '#22c55e',
            colorStopped: '#64748b',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_HEAT_EXCHANGER: {
        id: 'SCADA_HEAT_EXCHANGER',
        label: 'Heat Exchanger',
        icon: ArrowDownUp,
        defaultSize: { w: 140, h: 100 },
        defaultProps: {
            targetVariable: '',
            label: 'HX-101',
            tempIn: 25,
            tempOut: 60,
            unit: '°C',
            isActive: true,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_BOILER: {
        id: 'SCADA_BOILER',
        label: 'Boiler',
        icon: Flame,
        defaultSize: { w: 140, h: 180 },
        defaultProps: {
            targetVariable: '',
            label: 'BLR-101',
            boilerState: 'OFF',
            pressure: 0,
            temperature: 25,
            flameOn: false,
            unit: 'bar',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_COMPRESSOR: {
        id: 'SCADA_COMPRESSOR',
        label: 'Compressor',
        icon: Wind,
        defaultSize: { w: 120, h: 120 },
        defaultProps: {
            targetVariable: '',
            label: 'CMP-101',
            compressorState: 'STOPPED',
            pressureIn: 0,
            pressureOut: 0,
            unit: 'bar',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_CHILLER: {
        id: 'SCADA_CHILLER',
        label: 'Chiller',
        icon: Snowflake,
        defaultSize: { w: 160, h: 140 },
        defaultProps: {
            targetVariable: '',
            label: 'CHL-101',
            chillerState: 'OFF',
            tempSetpoint: 7,
            tempActual: 12,
            unit: '°C',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_FURNACE: {
        id: 'SCADA_FURNACE',
        label: 'Furnace',
        icon: Flame,
        defaultSize: { w: 160, h: 160 },
        defaultProps: {
            targetVariable: '',
            label: 'FUR-101',
            furnaceState: 'OFF',
            temperature: 25,
            setpoint: 800,
            unit: '°C',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_SILO: {
        id: 'SCADA_SILO',
        label: 'Silo / Hopper',
        icon: Container,
        defaultSize: { w: 100, h: 200 },
        defaultProps: {
            targetVariable: '',
            label: 'SILO-101',
            level: 65,
            capacity: 100,
            unit: 'ton',
            materialColor: '#d97706',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    // ===== BATCH 2: INSTRUMENTATION =====
    SCADA_PRESSURE_GAUGE: {
        id: 'SCADA_PRESSURE_GAUGE',
        label: 'Pressure Gauge',
        icon: Gauge,
        defaultSize: { w: 140, h: 140 },
        defaultProps: {
            targetVariable: '',
            label: 'PT-101',
            value: 0,
            min: 0,
            max: 10,
            unit: 'bar',
            alarmHigh: 8,
            alarmLow: 1,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_TEMP_INDICATOR: {
        id: 'SCADA_TEMP_INDICATOR',
        label: 'Temperature Indicator',
        icon: Thermometer,
        defaultSize: { w: 80, h: 200 },
        defaultProps: {
            targetVariable: '',
            label: 'TI-101',
            value: 25,
            min: 0,
            max: 200,
            unit: '°C',
            alarmHigh: 150,
            alarmLow: 5,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_FLOW_METER: {
        id: 'SCADA_FLOW_METER',
        label: 'Flow Meter',
        icon: Waves,
        defaultSize: { w: 140, h: 100 },
        defaultProps: {
            targetVariable: '',
            label: 'FT-101',
            value: 0,
            min: 0,
            max: 500,
            unit: 'L/min',
            totalFlow: 0,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_LEVEL_INDICATOR: {
        id: 'SCADA_LEVEL_INDICATOR',
        label: 'Level Indicator',
        icon: BarChart,
        defaultSize: { w: 80, h: 200 },
        defaultProps: {
            targetVariable: '',
            label: 'LI-101',
            value: 50,
            min: 0,
            max: 100,
            unit: '%',
            alarmHigh: 90,
            alarmLow: 10,
            fluidColor: '#3b82f6',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_PH_METER: {
        id: 'SCADA_PH_METER',
        label: 'pH Meter',
        icon: Droplets,
        defaultSize: { w: 140, h: 140 },
        defaultProps: {
            targetVariable: '',
            label: 'AE-101',
            value: 7.0,
            min: 0,
            max: 14,
            unit: 'pH',
            alarmHigh: 10,
            alarmLow: 4,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_CURRENT_METER: {
        id: 'SCADA_CURRENT_METER',
        label: 'Current Meter (A)',
        icon: Zap,
        defaultSize: { w: 140, h: 100 },
        defaultProps: {
            targetVariable: '',
            label: 'CT-101',
            value: 0,
            min: 0,
            max: 100,
            unit: 'A',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_VOLTAGE_METER: {
        id: 'SCADA_VOLTAGE_METER',
        label: 'Voltage Meter (V)',
        icon: Zap,
        defaultSize: { w: 140, h: 100 },
        defaultProps: {
            targetVariable: '',
            label: 'VT-101',
            value: 0,
            min: 0,
            max: 480,
            unit: 'V',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_POWER_METER: {
        id: 'SCADA_POWER_METER',
        label: 'Power Meter (kW)',
        icon: Activity,
        defaultSize: { w: 160, h: 120 },
        defaultProps: {
            targetVariable: '',
            label: 'PM-101',
            value: 0,
            min: 0,
            max: 500,
            unit: 'kW',
            voltage: 0,
            current: 0,
            powerFactor: 0.85,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    // ===== BATCH 3: DISPLAY =====
    SCADA_DIGITAL_DISPLAY: {
        id: 'SCADA_DIGITAL_DISPLAY',
        label: 'Digital Display',
        icon: Binary,
        defaultSize: { w: 200, h: 80 },
        defaultProps: {
            targetVariable: '',
            label: 'DI-101',
            value: '0000',
            decimals: 1,
            unit: '',
            color: '#22c55e',
            backgroundColor: '#0f172a',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_NUMERIC_INPUT: {
        id: 'SCADA_NUMERIC_INPUT',
        label: 'Numeric Input',
        icon: Hash,
        defaultSize: { w: 180, h: 70 },
        defaultProps: {
            targetVariable: '',
            label: 'Input',
            value: 0,
            min: 0,
            max: 100,
            step: 1,
            unit: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_SETPOINT_INPUT: {
        id: 'SCADA_SETPOINT_INPUT',
        label: 'Setpoint Input',
        icon: Target,
        defaultSize: { w: 200, h: 100 },
        defaultProps: {
            targetVariable: '',
            label: 'SP',
            value: 50,
            min: 0,
            max: 100,
            unit: '',
            hiLimit: 90,
            loLimit: 10,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_TREND: {
        id: 'SCADA_TREND',
        label: 'Trend Chart',
        icon: TrendingUp,
        defaultSize: { w: 400, h: 200 },
        defaultProps: {
            targetVariable: '',
            label: 'Real-Time Trend',
            lineColor: '#3b82f6',
            gridColor: '#334155',
            timeRange: 60,
            min: 0,
            max: 100,
            unit: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_HISTORICAL_TREND: {
        id: 'SCADA_HISTORICAL_TREND',
        label: 'Historical Trend',
        icon: AreaChart,
        defaultSize: { w: 500, h: 250 },
        defaultProps: {
            targetVariable: '',
            label: 'Historical Trend',
            lineColor: '#8b5cf6',
            gridColor: '#334155',
            timeRange: 3600,
            min: 0,
            max: 100,
            unit: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_BAR_GRAPH: {
        id: 'SCADA_BAR_GRAPH',
        label: 'Bar Graph',
        icon: BarChart,
        defaultSize: { w: 300, h: 200 },
        defaultProps: {
            targetVariable: '',
            label: 'Bar Graph',
            barColor: '#3b82f6',
            barCount: 5,
            max: 100,
            unit: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_CIRCULAR_GAUGE: {
        id: 'SCADA_CIRCULAR_GAUGE',
        label: 'Circular Gauge',
        icon: CircleDot,
        defaultSize: { w: 160, h: 160 },
        defaultProps: {
            targetVariable: '',
            label: 'CG-101',
            value: 0,
            min: 0,
            max: 100,
            unit: '%',
            arcColor: '#3b82f6',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_PROGRESS_BAR: {
        id: 'SCADA_PROGRESS_BAR',
        label: 'Progress Bar',
        icon: Minus,
        defaultSize: { w: 300, h: 50 },
        defaultProps: {
            targetVariable: '',
            label: 'Progress',
            value: 0,
            min: 0,
            max: 100,
            unit: '%',
            barColor: '#22c55e',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_TANK_LEVEL: {
        id: 'SCADA_TANK_LEVEL',
        label: 'Tank Level Gauge',
        icon: Database,
        defaultSize: { w: 100, h: 220 },
        defaultProps: {
            targetVariable: '',
            label: 'TK-101',
            level: 50,
            capacity: 100,
            unit: 'L',
            fluidColor: '#06b6d4',
            alarmHigh: 90,
            alarmLow: 10,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    // ===== BATCH 4: ALARM & EVENT =====
    SCADA_ALARM_BANNER: {
        id: 'SCADA_ALARM_BANNER',
        label: 'Alarm Banner',
        icon: Bell,
        defaultSize: { w: 500, h: 50 },
        defaultProps: {
            targetVariable: '',
            label: 'Alarm Banner',
            scrollSpeed: 2,
            backgroundColor: '#0f172a',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_ALARM_HISTORY: {
        id: 'SCADA_ALARM_HISTORY',
        label: 'Alarm History',
        icon: ListOrdered,
        defaultSize: { w: 600, h: 280 },
        defaultProps: {
            targetVariable: '',
            label: 'Alarm History Log',
            maxEntries: 100,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_EVENT_LOG: {
        id: 'SCADA_EVENT_LOG',
        label: 'Event Log',
        icon: FileText,
        defaultSize: { w: 500, h: 250 },
        defaultProps: {
            targetVariable: '',
            label: 'System Event Log',
            maxEntries: 200,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_ALARM_ACK: {
        id: 'SCADA_ALARM_ACK',
        label: 'Acknowledge Alarm',
        icon: CheckCircle2,
        defaultSize: { w: 180, h: 60 },
        defaultProps: {
            targetVariable: '',
            label: 'ACK ALARM',
            color: '#f59e0b',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    // ===== BATCH 5: CONTROL =====
    SCADA_BTN_START: {
        id: 'SCADA_BTN_START',
        label: 'Start Button',
        icon: PlaySquare,
        defaultSize: { w: 120, h: 60 },
        defaultProps: {
            targetVariable: '',
            label: 'START',
            color: '#22c55e',
            state: false,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_BTN_STOP: {
        id: 'SCADA_BTN_STOP',
        label: 'Stop Button',
        icon: StopCircle,
        defaultSize: { w: 120, h: 60 },
        defaultProps: {
            targetVariable: '',
            label: 'STOP',
            color: '#ef4444',
            state: false,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_BTN_RESET: {
        id: 'SCADA_BTN_RESET',
        label: 'Reset Button',
        icon: RotateCcw,
        defaultSize: { w: 120, h: 60 },
        defaultProps: {
            targetVariable: '',
            label: 'RESET',
            color: '#3b82f6',
            state: false,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_AUTO_MANUAL: {
        id: 'SCADA_AUTO_MANUAL',
        label: 'Auto/Manual Selector',
        icon: ToggleLeft,
        defaultSize: { w: 160, h: 70 },
        defaultProps: {
            targetVariable: '',
            label: 'Mode',
            mode: 'MANUAL',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_MODE_SELECTOR: {
        id: 'SCADA_MODE_SELECTOR',
        label: 'Mode Selector',
        icon: Settings,
        defaultSize: { w: 180, h: 80 },
        defaultProps: {
            targetVariable: '',
            label: 'Mode Select',
            modes: ['OFF', 'MANUAL', 'AUTO', 'SERVICE'],
            selectedMode: 'OFF',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_TOGGLE_SWITCH: {
        id: 'SCADA_TOGGLE_SWITCH',
        label: 'Toggle Switch',
        icon: ToggleRight,
        defaultSize: { w: 140, h: 60 },
        defaultProps: {
            targetVariable: '',
            label: 'Switch',
            state: false,
            onLabel: 'ON',
            offLabel: 'OFF',
            onColor: '#22c55e',
            offColor: '#64748b',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_PLC_STATUS: {
        id: 'SCADA_PLC_STATUS',
        label: 'PLC Status',
        icon: Cpu,
        defaultSize: { w: 200, h: 100 },
        defaultProps: {
            targetVariable: '',
            label: 'PLC-01',
            status: 'ONLINE',
            scanTime: 10,
            ipAddress: '192.168.1.1',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    // ===== BATCH 6: INDUSTRY 4.0 / MES =====
    SCADA_OEE: {
        id: 'SCADA_OEE',
        label: 'OEE Widget',
        icon: PieChart,
        defaultSize: { w: 300, h: 200 },
        defaultProps: {
            targetVariable: '',
            label: 'OEE Monitor',
            availability: 95,
            performance: 88,
            quality: 99,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_PROD_COUNTER: {
        id: 'SCADA_PROD_COUNTER',
        label: 'Production Counter',
        icon: Hash,
        defaultSize: { w: 220, h: 120 },
        defaultProps: {
            targetVariable: '',
            label: 'Production Count',
            count: 0,
            target: 1000,
            unit: 'pcs',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_DOWNTIME: {
        id: 'SCADA_DOWNTIME',
        label: 'Downtime Monitor',
        icon: Clock,
        defaultSize: { w: 280, h: 160 },
        defaultProps: {
            targetVariable: '',
            label: 'Downtime Tracker',
            totalDowntime: 0,
            plannedDowntime: 0,
            unplannedDowntime: 0,
            unit: 'min',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_MACHINE_STATUS: {
        id: 'SCADA_MACHINE_STATUS',
        label: 'Machine Status',
        icon: Factory,
        defaultSize: { w: 200, h: 120 },
        defaultProps: {
            targetVariable: '',
            label: 'Machine-01',
            status: 'IDLE',
            runTime: 0,
            idleTime: 0,
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_SPC_CHART: {
        id: 'SCADA_SPC_CHART',
        label: 'SPC Chart',
        icon: LineChart,
        defaultSize: { w: 450, h: 250 },
        defaultProps: {
            targetVariable: '',
            label: 'SPC X-Bar Chart',
            ucl: 75,
            lcl: 25,
            cl: 50,
            unit: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_ENERGY_MONITOR: {
        id: 'SCADA_ENERGY_MONITOR',
        label: 'Energy Monitor',
        icon: Zap,
        defaultSize: { w: 280, h: 180 },
        defaultProps: {
            targetVariable: '',
            label: 'Energy Consumption',
            currentPower: 0,
            dailyEnergy: 0,
            monthlyEnergy: 0,
            unit: 'kWh',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    },
    SCADA_BATCH_TRACKER: {
        id: 'SCADA_BATCH_TRACKER',
        label: 'Batch Tracker',
        icon: Package,
        defaultSize: { w: 350, h: 180 },
        defaultProps: {
            targetVariable: '',
            label: 'Batch Production',
            batchId: 'BATCH-001',
            product: 'Product A',
            targetQty: 1000,
            actualQty: 0,
            status: 'IN_PROGRESS',
            startTime: '',
            visible: true,
            triggers: [],
            visibilityCondition: null,
            rotation: 0
        }
    }
};

