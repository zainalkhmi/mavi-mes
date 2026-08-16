import React from 'react';
import {
    Award, Sparkles, Activity, Search, ClipboardList, Package, Cpu,
    Boxes, Wrench, ArrowRight, FileText, Truck, PlayCircle, HeartPulse,
    Settings, Layout, Zap, Sliders, BarChart3, ShieldCheck, ShieldAlert, Tag
} from 'lucide-react';

export const categories = [
    'All',
    'App Management',
    'Quality',
    'Manufacturing',
    'Production',
    'MES Production Suite',
    'Inventory App Suite',
    'Warehouse',
    'Automotive',
    'Analytic',
    'SmartHome / IoT'
];

export const rawTemplates = [
    {
        id: 'production-plant-dashboard',
        name: 'Tulip Production Plant Dashboard & Cell Tracker',
        category: 'MES Production Suite',
        description: 'Complete Tulip-style plant production dashboard with 6-cell status tracking (Complete, Target, Defects), 4 Top KPIs, Cell Loading, Downtime Pareto analytics, Orders by Status, and WIP inventory tracking with live shopfloor input form.',
        longDescription: 'Comprehensive Tulip-style production plant operational dashboard and frontline terminal. Visualizes real-time performance across production cells (Rotor, Endbell, Housing, Motor Assembly, Final Inspection, Shipping), orders due today, backlog, and Pareto downtime analytics with an integrated Shopfloor Data Entry mode.',
        icon: <BarChart3 size={28} color="#3b82f6" />,
        bg: 'linear-gradient(135deg, #0a0f1d 0%, #1e293b 100%)',
        accent: '#38bdf8',
        rating: 5.0,
        installs: '1.8k',
        targetRoute: '/production-dashboard',
        features: [
            '6 Production Cells Complete vs Target vs Defects',
            '4 Key Plant KPIs (Orders Due, Backlog, Completed, Downtime)',
            'Cell Loading & WIP Distribution Charts',
            'Downtime Pareto Chart with Cumulative % Curve',
            'Frontline Shopfloor Data Input & Event Logger'
        ],
        guide: {
            operation: '1. Switch between Live Dashboard view and Shopfloor Data Input mode.\n2. In Shopfloor Data Input, log cell completion counts, target outputs, and defect quantities.\n3. Log station downtime events with root cause reasons and durations.\n4. Watch all 4 dashboard charts and KPI cards update in real-time.',
            widgets: ['Plant Dashboard Sidebar', '4x KPI Metrics Cards', 'Cell Loading Bar Chart', 'Downtime Pareto Chart', 'Order Status Breakdown', 'WIP Inventory Chart'],
            components: ['Live Plant Dashboard Screen', 'Shopfloor Production Data Entry', 'Downtime Detail Inspector'],
            tables: [
                { name: 'Production_Cells', description: 'Tracks cell name, target output, units completed, and defect counts.' },
                { name: 'Downtime_Events', description: 'Logs station downtime start/end, duration in minutes, and root-cause reasons.' },
                { name: 'Orders_Pipeline', description: 'Tracks daily order statuses (Released, In Progress, Delivered).' }
            ],
            triggers: [
                { event: 'ON_CELL_LOG_SUBMIT', function: 'Updates cell completion and recalculates overall target attainment.' },
                { event: 'ON_DOWNTIME_LOGGED', function: 'Re-sorts Pareto downtime rankings and recalculates cumulative curve.' },
                { event: 'ON_RESET_PRESET', function: 'Restores Tulip benchmark reference demo values.' }
            ],
            mechanism: 'Composes frontline telemetry, station logs, and ERP order tracking into an executive and shopfloor andon dashboard.',
            steps: [
                { name: 'Live Plant Dashboard', description: 'Comprehensive high-level operational overview for line managers.' },
                { name: 'Shopfloor Data Input', description: 'Operator-friendly interface for logging output, defects, and downtime.' }
            ]
        }
    },
    {
        id: 'skill-manager',
        name: 'Skill Manager (Tulip Standard)',
        category: 'MES Production Suite',
        description: 'Track, update, and assign operator skills on the shop floor with an interactive Skill Matrix heatmap, skill definition management, and automated matrix generation.',
        longDescription: 'The Skill Manager application enables supervisors to track, update, and assign operator skills on the shop floor. Features an interactive Skill Matrix heatmap with cell inspection, instant proficiency adjustment (Beginner, Intermediate, Advanced, Expert), skill definition archiving, and batch generation of matrix records for operators and stations/products.',
        icon: <Award size={28} color="#2563eb" />,
        bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        accent: '#2563eb',
        rating: 5.0,
        installs: 'New',
        features: ['Skill Matrix Heatmap', 'Interactive Proficiency Levels', 'Skill Definition Manager', 'Batch Matrix Generator'],
        guide: {
            operation: '1. View Skill Matrix to monitor shopfloor operator competencies.\n2. Click on any cell to inspect and adjust skill proficiency level.\n3. Navigate to Manage Skills to add, edit, or archive skill definitions.\n4. Use Generate Skill Matrix to batch-assign skills to operators.',
            widgets: ['Skill Matrix Heatmap', 'Level Selector', 'Filter Dropdowns', 'Batch Selection Lists'],
            components: ['View Skill Matrix HMI', 'Skill Definitions Manager', 'Matrix Batch Generator'],
            tables: [
                { name: 'Skills_Definitions', description: 'Stores skill definitions with name, description, context (Product/Station), and status.' },
                { name: 'Skill_Matrix', description: 'Stores operator skill assignments and proficiency levels (Beginner, Intermediate, Advanced, Expert).' }
            ],
            triggers: [
                { event: 'ON_CELL_CLICK', function: 'Loads operator and skill details in the inspection panel.' },
                { event: 'ON_LEVEL_CHANGE', function: 'Updates the operator skill proficiency level in the Skill_Matrix database.' },
                { event: 'ON_GENERATE_CLICK', function: 'Batch creates skill matrix records for selected operators and skills.' }
            ],
            mechanism: 'Implements Tulip Common Data Model for discrete manufacturing workforce training and shop floor competency management.',
            steps: [
                { name: 'View Skill Matrix', description: 'Interactive heatmap showing operators vs skills with instant level updating.' },
                { name: 'View Skills', description: 'Manage and archive skill definitions and their associated station/product contexts.' },
                { name: 'Generate Skill Matrix', description: '3-panel batch wizard to assign skills to operators.' }
            ]
        }
    },
    {
        id: 'quickstart-hello-world',
        name: 'Quick Start: Hello World',
        category: 'App Management',
        description: 'Tutorial 5 Menit: Membuat Aplikasi Pertama Anda. Panduan interaktif cara kerja widget Text, Button, dan Trigger di App Builder.',
        longDescription: 'Tutorial Hello World langkah-demi-langkah. Pelajari cara menambahkan widget Text dan Button, lalu menghubungkannya menggunakan Trigger On Click untuk memperbarui teks.',
        icon: <Sparkles size={28} color="#eab308" />,
        bg: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
        accent: '#eab308',
        rating: 5.0,
        installs: 'New',
        features: ['Text Widget', 'Button Trigger', 'Update Widget Property', 'Interactive Tutorial'],
        guide: {
            operation: '1. Buka App Builder\n2. Tarik widget Text ke tengah layar, ubah nilainya jadi "Status: Belum Ditekan"\n3. Tarik widget Button di bawahnya, ubah labelnya jadi "Tekan Saya"\n4. Tambahkan Trigger ON_CLICK pada Button untuk merubah teks properti dari widget Text tadi menjadi "Status: Tombol Ditekan!"',
            widgets: ['Text Widget', 'Button Widget'],
            components: ['Tutorial Canvas'],
            tables: [],
            triggers: [
                { event: 'ON_CLICK', function: 'Mengubah teks status saat tombol ditekan.' }
            ],
            mechanism: 'Mendemonstrasikan dasar interaksi widget dan trigger dalam 5 menit.',
            steps: [
                { name: 'Tutorial Step', description: 'Tarik text & button, kemudian hubungkan dengan trigger.' }
            ]
        }
    },
    {
        id: 'vision-inspection-suite',
        name: 'Cognitive Vision & QC Suite',
        category: 'Quality',
        description: 'Automated vision inspection system utilizing edge detection, dial gauge needles, digital calipers (OCR), part counting, and barcode scanning in real-time.',
        longDescription: 'Deploy computer vision algorithms to automate quality control checks. Features pre-configured steps for caliper OCR reading, dial gauge pointer angle analysis, part counting, laser scanner barcode verification, and green/red quality pass/fail overlays. Automatically commits inspection records to database logs.',
        icon: <Activity size={28} color="#7c3aed" />,
        bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
        accent: '#7c3aed',
        rating: 5.0,
        installs: 'New',
        features: ['Live OpenCV.js Wasms', 'Real-time OCR Caliper', 'Real-time Dial Needle', 'Auto-Save Database Logs'],
        guide: {
            operation: '1. Setup work order & batch lot id\n2. Perform automated visual quality check\n3. Capture digital caliper measurement via OCR\n4. Scan analog pressure dial pointer angle\n5. Submit inspection to database logs',
            widgets: ['OpenCV Camera (QC Inspection)', 'OpenCV Camera (Caliper OCR)', 'OpenCV Camera (Dial Gauge)', 'Trigger Action Buttons'],
            components: ['Multi-step inspection HMI', 'Auto-save database engine', 'Visual pass/fail guides'],
            tables: [
                { name: 'live_measurements', description: 'Primary database table storing all real-time vision measurements.' }
            ],
            triggers: [
                { event: 'ON_FRAME_CHANGE', function: 'Performs local pixel analysis and draws overlays.' },
                { event: 'ON_SAVE_CLICK', function: 'Inserts current readout directly to live_measurements database.' }
            ],
            mechanism: 'Integrates real-time OpenCV.js libraries directly inside the browser using webcams for zero-latency cognitive quality inspection.',
            steps: [
                { name: 'QC Work Order Setup', description: 'Configure active Lot/Batch and Work Order IDs.' },
                { name: 'Cognitive QC Inspection', description: 'Live vision check (PASS/FAIL) with automatic database logging.' },
                { name: 'Caliper & Pressure Verification', description: 'Combined view of caliper OCR and dial gauge needle reading.' }
            ]
        }
    },
    {
        id: 'mobile-scan-vision',
        name: 'Mobile Scan & Vision QC',
        category: 'Quality',
        description: 'Mobile-optimized barcode scanning and OpenCV camera inspection for quick stock routing and quality verification.',
        longDescription: 'Optimize scanning and QC workflows on mobile devices. Features pre-configured layouts for vertical stacking, custom mobile barcode reader widget, and live OpenCV camera PASS/FAIL overlays. Integrates with the mobile_scan_logs database.',
        icon: <Activity size={28} color="#059669" />,
        bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        accent: '#059669',
        rating: 5.0,
        installs: 'New',
        features: ['Mobile Barcode Scan', 'Real-time OpenCV Vision', 'Vertical Phone Layout', 'Auto-Save Logs'],
        guide: {
            operation: '1. Enter Operator Name\n2. Scan item barcode with mobile camera\n3. Hold item in front of vision camera for QC check\n4. Confirm readouts and submit log to database',
            widgets: ['Mobile Barcode Scanner', 'OpenCV Camera (QC Inspection)', 'Variable Text Displays'],
            components: ['Mobile HMI flow', 'Barcode parser', 'Quality verification engine'],
            tables: [
                { name: 'mobile_scan_logs', description: 'Primary database table storing all real-time scan and vision check records.' }
            ],
            triggers: [
                { event: 'ON_CLICK (Submit)', function: 'Saves Scanned_Barcode, Operator_Name, and result to mobile_scan_logs.' }
            ],
            mechanism: 'Integrates barcode scanner and real-time vision checks in a responsive vertically stacked HMI designed for handheld shopfloor terminals.',
            steps: [
                { name: 'Barcode Scan Setup', description: 'Enter operator info and scan item barcode.' },
                { name: 'Vision Camera QC', description: 'Live OpenCV visual quality check.' },
                { name: 'Review & Submit', description: 'Verify readings and submit record.' }
            ]
        }
    },
    {
        id: 'incoming-inspection',
        name: 'Incoming Quality Inspection',
        category: 'Quality',
        description: 'Professional incoming material inspection with dimensional checks, visual inspection, equipment tracking, and spec limit validation.',
        longDescription: 'Digitize your receiving inspection process. Each inspection step features a measurement guide image, calibrated equipment info, spec limits (LSL/USL), and real-time pass/fail judgment. Supports both dimensional and visual inspections.',
        icon: <Search size={28} color="#0284c7" />,
        bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        accent: '#0284c7',
        rating: 5.0,
        installs: 'New',
        features: ['Spec Limit Validation', 'Equipment Tracking', 'Auto Pass/Fail'],
        guide: {
            operation: '1. Scan part barcode & enter lot info\n2. Measure Overall Length with caliper\n3. Measure Outer Diameter with micrometer\n4. Check Shaft Extension\n5. Visual inspection for lead damage\n6. Review all results & sign-off',
            widgets: ['Barcode Scanner', 'Tolerance Input', 'Pass/Fail Widget', 'Equipment Info Card', 'Inspection Guide Image'],
            components: ['Multi-step Inspection Flow', 'Auto-judgment Engine', 'Equipment Tracker'],
            tables: [
                { name: 'IQC_Inspections', description: 'Primary log of incoming inspections with all measurements.' },
                { name: 'IQC_Equipment', description: 'Tracks calibration status and availability of inspection tools.' }
            ],
            triggers: [
                { event: 'MEASUREMENT_SUBMIT', function: 'Compares measurement against spec limits and auto-judges PASS/FAIL.' },
                { event: 'COMPLETE_INSPECTION', function: 'Saves all measurements and judgment to IQC_Inspections table.' }
            ],
            mechanism: 'Each inspection step validates measurements against configurable spec limits (LSL/USL) and calculates pass/fail automatically.',
            steps: [
                { name: 'Part Identification', description: 'User scans part barcode, enters lot number and supplier to begin the inspection process.' },
                { name: 'Dimensional Checks', description: 'Interactive steps to measure lengths and diameters using specified equipment, automatically verifying against LSL/USL.' },
                { name: 'Visual Inspection', description: 'Operator checks for visual defects like lead damage and logs the pass/fail result.' },
                { name: 'Review & Sign-off', description: 'Summary of all recorded measurements and overall pass/fail judgment with digital signature.' }
            ]
        }
    },
    {
        id: 'quickbuild-cad-vision',
        name: 'QuickBuild CAD & Vision QC',
        category: 'Quality',
        description: 'Advanced vision inspection system powered by QuickBuild sequential pipelines, dynamically linked to AutoCAD/CAD specifications.',
        longDescription: 'Deploy drawing-integrated caliper measurement pipelines. This template links CAD blueprints directly to the QuickBuild vision tools, enabling automatic spec limit checks, live canvas overlay displays, and database log syncs.',
        icon: <Activity size={28} color="#2563eb" />,
        bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        accent: '#2563eb',
        rating: 5.0,
        installs: 'New',
        features: ['QuickBuild Flowcharts', 'AutoCAD DXF Sync', 'Real-time Calipers', 'Yield Judge'],
        guide: {
            operation: '1. Setup work order & select active CAD drawing blueprint\n2. Run live camera inspection with the QuickBuild caliper node overlay\n3. System automatically compares specs from CAD features\n4. Confirm readouts and submit record to database logs',
            widgets: ['OpenCV Camera (QuickBuild Full Pipeline)', 'CAD Blueprint Card', 'Real-time Stats Display'],
            components: ['Integrated CAD HMI Flow', 'Sequential Tool Chain Parser', 'Live Overlays Renderer'],
            tables: [
                { name: 'live_measurements', description: 'Primary database table storing all real-time measurements.' }
            ],
            triggers: [
                { event: 'ON_CLICK (Submit)', function: 'Saves Meas_Bore, Meas_Length, and Yield_Result to database logs.' }
            ],
            mechanism: 'Binds measure nodes in QuickBuild to layers and dimensions extracted from the active CAD blueprint drawing.',
            steps: [
                { name: 'CAD & Info Setup', description: 'Operator validation and target blueprint selection.' },
                { name: 'QuickBuild Inspection', description: 'Live vision check (OK/NG) with dynamic CAD spec limit validation.' }
            ]
        }
    },
    {
        id: 'work-instructions',
        name: 'Work Instructions Example App',
        category: 'Production',
        description: 'Guided multi-step manufacturing instructions with checklists, serial verification, torque limits, and quality sign-off.',
        longDescription: 'Digitize shop floor instructions. Select active work orders, guide operators using visual references and task checklists, log serial numbers, check torque values against specification limits, and submit digital signatures to complete production runs.',
        icon: <ClipboardList size={28} color="#10b981" />,
        bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        accent: '#10b981',
        rating: 5.0,
        installs: 'New',
        features: ['Visual Step Guidance', 'Serial Number Scan', 'Torque Limit Check', 'Signature Pad'],
        guide: {
            operation: '1. Select a released Work Order\n2. Perform Base Plate Mounting and complete checklist\n3. Perform Wiring Assembly and scan PCB serial number\n4. Perform Torque Inspection and enter torque (2.5 - 3.0 Nm)\n5. Record visual quality and sign off\n6. Review summary and log run to database',
            widgets: ['Interactive WO Table', 'Task Checklist', 'Barcode Scanner', 'Torque Spec Field', 'Signature Widget'],
            components: ['Multi-step assembly flow', 'Digital dispatcher dashboard', 'Activity logging system'],
            tables: [
                { name: 'WI_Work_Orders', description: 'Tracks work orders dispatch, status, and completion quantities.' },
                { name: 'WI_Activity_Logs', description: 'Logs detailed activity for each assembly run, including operator, cycle time, serial numbers, measurements, and quality status.' }
            ],
            triggers: [
                { event: 'START_ASSEMBLY', function: 'Starts station timer and changes Work Order status to IN PROGRESS.' },
                { event: 'VERIFY_TORQUE', function: 'Compares torque value to LSL/USL limits.' },
                { event: 'COMPLETE_RUN', function: 'Saves run details to WI_Activity_Logs and increments completed qty in WI_Work_Orders.' }
            ],
            mechanism: 'Step-by-step guided run tracking cycle times, quality results, torque limits, and digital signature sign-offs.',
            steps: [
                { name: 'Work Order Select', description: 'Select a released work order and start assembly timer.' },
                { name: 'Base Plate Mount', description: 'Mount rubber feet and verify task checklist.' },
                { name: 'Wiring Assembly', description: 'Assemble wiring harness and scan PCB serial number.' },
                { name: 'Torque Inspection', description: 'Torque bolts and verify spec limits (2.5 - 3.0 Nm).' },
                { name: 'Quality Sign-Off', description: 'Perform quality visual check, log defects, and capture signature.' },
                { name: 'Review & Finalize', description: 'Review assembly run summary and log results.' }
            ]
        }
    },
    {
        id: 'weigh-dispense',
        name: 'Weigh and Dispense',
        category: 'Manufacturing',
        description: 'Pharmaceutical-grade weighing and dispensing workflow with barcode verification, scale integration, and batch tracking.',
        longDescription: 'Streamline your weighing and dispensing process. Each dose step shows selected material info, task instructions, barcode scanning, weight input with scale integration, and batch traceability.',
        icon: <Package size={28} color="#7c3aed" />,
        bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        accent: '#7c3aed',
        rating: 5.0,
        installs: 'New',
        features: ['Scale Integration', 'Barcode Verification', 'Batch Tracking'],
        guide: {
            operation: '1. Enter batch number & operator info\n2. For each material: scan barcode, transfer to scale, record weight\n3. Review all dispensed weights\n4. Complete and save batch record',
            widgets: ['Barcode Scanner', 'Weight Input', 'Scale Reader', 'Material Info Card'],
            components: ['Multi-dose Flow', 'Scale Integration', 'Batch Tracker'],
            tables: [
                { name: 'WD_Dispense_Logs', description: 'Primary log of weigh & dispense batch records.' }
            ],
            triggers: [
                { event: 'GET_FROM_SCALE', function: 'Reads weight value from connected scale device.' },
                { event: 'COMPLETE_DISPENSING', function: 'Saves all weights and batch info to WD_Dispense_Logs table.' }
            ],
            mechanism: 'Each dose step verifies material barcode and records dispensed weight with scale integration support.',
            steps: [
                { name: 'Batch Setup', description: 'Input batch number and operator name to initiate a new dispensing session.' },
                { name: 'Material Verification', description: 'Scan the material barcode to confirm the correct raw material is being used.' },
                { name: 'Scale Dispensing', description: 'Connects to a scale to capture live weight data. Ensures target weight tolerances are met.' },
                { name: 'Batch Summary', description: 'Review all dispensed materials and finalize the batch record.' }
            ]
        }
    },
    {
        id: 'assy-line-production',
        name: 'Assembly Line Production',
        category: 'Production',
        description: 'Machine Terminal for assembly line production tracking with OEE metrics, parts/defect counting, and downtime management.',
        longDescription: 'Full-featured production terminal inspired by Tulip Machine Terminal. Track work orders, count parts and defects in real-time, monitor Quality and Uptime KPIs, log downtime reasons, and submit production results.',
        icon: <Cpu size={28} color="#dc2626" />,
        bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        accent: '#dc2626',
        rating: 5.0,
        installs: 'New',
        features: ['Parts Counter', 'Defect Tracking', 'Downtime Log', 'OEE KPIs'],
        guide: {
            operation: '1. Enter work order & line info\n2. Count parts and defects in real-time\n3. Log downtime events with reasons\n4. Monitor Quality & Uptime KPIs\n5. Submit production results',
            widgets: ['Counter Buttons', 'KPI Display', 'Downtime Input', 'Status Selector'],
            components: ['Machine Terminal Dashboard', 'Production Summary'],
            tables: [{ name: 'Assy_Production_Logs', description: 'Production result records per work order.' }],
            triggers: [
                { event: 'ADD_PART', function: 'Increments parts made counter.' },
                { event: 'ADD_DEFECT', function: 'Increments defect counter and alerts operator.' },
                { event: 'FINISH_PRODUCTION', function: 'Calculates OEE and saves production record.' }
            ],
            mechanism: 'Real-time parts and defect counting with automatic Quality % calculation.',
            steps: [
                { name: 'Order Selection', description: 'Select the active work order and start the production timer.' },
                { name: 'Production Dashboard', description: 'Main terminal for operators to log good parts and defects in real-time, displaying OEE metrics.' },
                { name: 'Downtime Logging', description: 'If the machine stops, operators select a downtime reason code to pause production time.' },
                { name: 'Shift End', description: 'Closes the work order, calculates final Quality & Performance KPIs, and saves the record.' }
            ]
        }
    },
    {
        id: 'inventory-alert',
        name: 'Inventory Status & Alerting',
        category: 'Warehouse',
        description: 'Automated inventory monitoring with low-stock alerts, kitting dashboard, material picking, and reorder management.',
        longDescription: 'Monitor hundreds of materials 24/7. Automatic reorder alerts when stock drops below threshold. Kitting dashboard with cell performance KPIs, material transactions, and pick-to-light support.',
        icon: <Boxes size={28} color="#ea580c" />,
        bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        accent: '#ea580c',
        rating: 5.0,
        installs: 'New',
        features: ['Low Stock Alerts', 'Kitting Dashboard', 'Material Picking', 'Reorder Automation'],
        guide: {
            operation: '1. View kitting dashboard & cell performance\n2. Scan material barcode to pick\n3. Record transaction (pick/receive/adjust)\n4. Auto-alert if stock < reorder point\n5. Review alerts & manage reorders',
            widgets: ['Interactive Table', 'Barcode Scanner', 'KPI Counters', 'Alert System'],
            components: ['Kitting Dashboard', 'Material Picker', 'Alert Manager'],
            tables: [
                { name: 'Inventory_Materials', description: 'Master material data with qty and reorder points.' },
                { name: 'Inventory_Transactions', description: 'Pick/receive/adjust transactions linked to materials.' },
                { name: 'Inventory_Alerts', description: 'Auto-generated low stock alerts.' }
            ],
            triggers: [
                { event: 'PICK_MATERIAL', function: 'Decrements stock and checks reorder threshold.' },
                { event: 'LOW_STOCK_ALERT', function: 'Creates alert record when qty < reorder point.' }
            ],
            mechanism: 'Automated 24/7 inventory monitoring with threshold-based alerting and transaction logging.',
            steps: [
                { name: 'Kitting Dashboard', description: 'Overview of required materials for a cell and current stock levels.' },
                { name: 'Material Picking', description: 'Operator scans a barcode to pick parts. Stock is deducted dynamically.' },
                { name: 'Low Stock Alerting', description: 'If stock falls below the Reorder Point, an automated alert is generated for purchasing.' },
                { name: 'Alert Management', description: 'Supervisors view and close active material shortage alerts.' }
            ]
        }
    },
    {
        id: 'car-workshop',
        name: 'Car Workshop Pro',
        category: 'Automotive',
        description: 'Complete car workshop management — vehicle check-in, service tracking, multi-point inspection, parts & invoicing.',
        longDescription: '4-step workflow: Check-In → Service & Parts → Vehicle Inspection → Invoice & Close. Multi-table linked architecture with formula fields, automated notifications, and low-parts alerts.',
        icon: <Boxes size={28} color="#dc2626" />,
        bg: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
        accent: '#dc2626',
        rating: 5.0,
        installs: 'New',
        features: ['Vehicle Check-In', 'Multi-Point Inspection', 'Parts & Invoice', 'Job Notifications'],
        guide: {
            operation: '1. Scan license plate & create work order\n2. Add services & parts\n3. Multi-point vehicle inspection\n4. Generate invoice & close',
            widgets: ['Barcode', 'Radio Group', 'Interactive Table', 'Image Capture'],
            components: ['Check-In Form', 'Service Dashboard', 'Inspection Checklist', 'Invoice Summary'],
            tables: [
                { name: 'Workshop_Orders', description: 'Master work orders with vehicle & customer info' },
                { name: 'Service_Items', description: 'Services performed with labor cost formula' },
                { name: 'Vehicle_Inspections', description: '6-point inspection results' },
                { name: 'Parts_Used', description: 'Parts consumed with line total formula' }
            ],
            triggers: [
                { event: 'JOB_COMPLETE', function: 'Notifies customer when status = COMPLETED' },
                { event: 'LOW_PARTS', function: 'Alerts parts manager when stock < 5' }
            ],
            mechanism: 'Full workshop lifecycle with linked records, formulas (Labor_Cost, Line_Total), and automated notifications.',
            steps: [
                { name: 'Vehicle Check-In', description: 'Capture customer details, license plate, and assign a bay number.' },
                { name: 'Multi-Point Inspection', description: 'Technician performs a standard checklist on engine, brakes, tires, and logs issues.' },
                { name: 'Service & Parts Entry', description: 'Log labor hours and consumed parts, automatically calculating costs.' },
                { name: 'Invoice Generation', description: 'Summarizes all costs into a final printable view for the customer.' }
            ]
        }
    },
    {
        id: 'andon-system',
        name: 'Andon Alert System',
        category: 'Manufacturing',
        description: 'Empower operators to instantly raise issues, notify support teams, and track resolution metrics.',
        longDescription: 'A complete Andon system for manufacturing lines. Includes a large touch-friendly operator call board, a central dashboard for supervisors to acknowledge and track active issues, and a resolution form to capture root causes and downtime metrics.',
        icon: <Activity size={28} color="#f59e0b" />,
        bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        accent: '#f59e0b',
        rating: 5.0,
        installs: 'New',
        features: ['Operator Call Board', 'Active Issue Dashboard', 'Resolution Tracking', 'Automated Alerts'],
        guide: {
            operation: '1. Operator taps issue category (Material, Maintenance, Quality, Help)\n2. Supervisor sees alert on dashboard & acknowledges\n3. Responder resolves issue & logs root cause\n4. System tracks downtime metrics automatically',
            widgets: ['Large Action Buttons', 'Interactive Table', 'Form Inputs'],
            components: ['Andon Call Board', 'Supervisor Dashboard', 'Resolution Form'],
            tables: [
                { name: 'Andon_Events', description: 'Master log of all raised Andon alerts with timestamps.' },
                { name: 'Andon_Resolutions', description: 'Linked records detailing root causes and actions taken.' }
            ],
            triggers: [
                { event: 'ANDON_RAISED', function: 'Sends notification and logs start time.' },
                { event: 'ANDON_RESOLVED', function: 'Closes issue and logs resolution details.' }
            ],
            mechanism: 'Real-time issue escalation and tracking system to minimize production downtime.',
            steps: [
                { name: 'Operator Call Board', description: 'Simple touch interface for line workers to trigger an Andon alert (Material, Quality, Help).' },
                { name: 'Supervisor Dashboard', description: 'Central view showing all active alerts across the plant for quick response.' },
                { name: 'Issue Acknowledgement', description: 'Responder claims the issue and stops the initial response timer.' },
                { name: 'Resolution Form', description: 'Log the root cause and actions taken before closing out the Andon event.' }
            ]
        }
    },
    {
        id: 'picklist',
        name: 'Kitting Picklist',
        category: 'Warehouse',
        description: 'Facilitate the kitting process with a comprehensive list of all materials needed in an assembly line.',
        longDescription: 'A complete picklist template based on Tulip\'s standard picklist functionality. Includes a view requirements table, a view BOM (Bill of Materials) screen with interactive checklists, and a form to request new materials.',
        icon: <Package size={28} color="#059669" />,
        bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        accent: '#059669',
        rating: 5.0,
        installs: 'New',
        features: ['BOM Integration', 'Requirements Dashboard', 'Material Requisition'],
        guide: {
            operation: '1. Review requirements dashboard\n2. Select an order to view its BOM\n3. Pick components and check them off the list\n4. Request additional material if shortages occur',
            widgets: ['Interactive Table', 'Checklists', 'Images'],
            components: ['Requirements View', 'BOM View', 'Request View'],
            tables: [
                { name: 'Item_Master', description: 'Item definitions and types.' },
                { name: 'Order_Materials', description: 'Individual orders for products or materials.' },
                { name: 'Manufacturing_BOM', description: 'Parent-child item relationships.' }
            ],
            triggers: [
                { event: 'REQUEST_MATERIAL', function: 'Creates a new entry in Order_Materials.' }
            ],
            mechanism: 'Interactive BOM checklist system integrated with material orders.',
            steps: [
                { name: 'Requirements View', description: 'Displays all upcoming production orders and their statuses.' },
                { name: 'BOM Interactive View', description: 'Shows the Bill of Materials for a selected order with checkboxes to pick items.' },
                { name: 'Material Requisition', description: 'If parts are missing, operator can trigger a specific request to the warehouse.' }
            ]
        }
    },
    {
        id: 'defect-tracking',
        name: 'Defect Tracking',
        category: 'Quality',
        description: 'Report and monitor defect events effectively, organize defect events, and provide rework details.',
        longDescription: 'A complete defect tracking system inspired by standard manufacturing quality apps. Users can log defects, generate printable labels with barcodes, view defect details, and manage rework dispositions.',
        icon: <ShieldAlert size={28} color="#dc2626" />,
        bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        accent: '#dc2626',
        rating: 5.0,
        installs: 'New',
        features: ['Defect Logging Form', 'Barcode Label Generation', 'Disposition Management'],
        guide: {
            operation: '1. Select "Log Defect" to report an issue\n2. Print the defect label and attach it to the material\n3. Supervisor views details and assigns a disposition (Scrap/Rework/Use-as-Is)\n4. System tracks status and history',
            widgets: ['Interactive Table', 'Form Inputs', 'Barcode Generator'],
            components: ['Defect Dashboard', 'Defect Form', 'Label Generator', 'Disposition Control'],
            tables: [
                { name: 'Defect_Events', description: 'Master log of all reported defects and their statuses.' }
            ],
            triggers: [
                { event: 'LOG_DEFECT', function: 'Creates a new defect record with "New" status.' }
            ],
            mechanism: 'End-to-end defect management with label printing and disposition workflows.',
            steps: [
                { name: 'Defect Logging', description: 'Operator inputs defect details, severity, and quantity.' },
                { name: 'Label Printing', description: 'Automatically prints a barcode routing label to tag the defective part.' },
                { name: 'Disposition Dashboard', description: 'Quality team reviews the defect and assigns a disposition (Rework, Scrap, Return).' }
            ]
        }
    },
    {
        id: 'equipment-management',
        name: 'Equipment Management',
        category: 'Manufacturing',
        description: 'Create and update status, calibration data, set tare values, and record malfunction events.',
        longDescription: 'A complete equipment lifecycle management app. Users can add assets, view history logs, perform daily checks, calibrate scales, and report malfunctions. Integrates two relational tables for Assets and Status History.',
        icon: <Wrench size={28} color="#0284c7" />,
        bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        accent: '#0284c7',
        rating: 5.0,
        installs: 'New',
        features: ['Asset Registry', 'History Logging', 'Calibration Tracking', 'Malfunction Reporting'],
        guide: {
            operation: '1. Select or Add an equipment on the Overview page\n2. Click "Manage equipment" to view full details and history logs\n3. Execute specific actions (Clean, Daily Check, Calibrate, Tare)\n4. Report malfunctions instantly to update the asset status to "Out of Order"',
            widgets: ['Interactive Table', 'Form Inputs', 'Radio Checklists'],
            components: ['Overview Dashboard', 'History Log View', 'Calibration Form', 'Malfunction Report'],
            tables: [
                { name: 'Asset', description: 'Master registry of all equipment, including types, statuses, and tare weights.' },
                { name: 'Equipment_Status_History', description: 'Log of all activities, performed by whom, and when.' }
            ],
            triggers: [
                { event: 'UPDATE_STATUS', function: 'Creates a new entry in Equipment_Status_History.' }
            ],
            mechanism: 'Comprehensive asset tracking integrated with a persistent activity log.',
            steps: [
                { name: 'Asset Overview', description: 'List of all active machines/equipment and their current status.' },
                { name: 'Action Selection', description: 'Choose to perform a daily check, calibration, or log a malfunction.' },
                { name: 'History Tracking', description: 'Every action is logged in an immutable history table for audit compliance.' }
            ]
        }
    },
    {
        id: 'kanban-suite',
        name: 'Kanban App Suite',
        category: 'Manufacturing',
        description: 'Lean manufacturing kanban system with card manager, material consumption, water spider, and supplier flows.',
        longDescription: 'The Kanban app suite offers a lean and efficient framework tailored for material management, integrating the concept of "Kanban loops" to establish replenishment relationships between suppliers and consumers through customizable bins/cards. Includes Kanban Manager, Material Consumption, Water Spider, and Material Supplier modules seamlessly integrated.',
        icon: <ArrowRight size={28} color="#2563eb" />,
        bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        accent: '#2563eb',
        rating: 5.0,
        installs: 'New',
        features: ['Kanban Manager', 'Material Requests', 'Water Spider Flow', 'Label Printing'],
        guide: {
            operation: '1. Create and manage Kanban Cards in the Kanban Manager.\n2. Consumers request material when bins are empty.\n3. Water Spider picks up the request and moves the bin to the supplier.\n4. Supplier fills the bin and sends it back to the consuming location.',
            widgets: ['Interactive Table', 'Form Inputs', 'Process Buttons'],
            components: ['Kanban Manager View', 'Consumption Request', 'Water Spider Dashboard'],
            tables: [
                { name: 'Kanban_Cards', description: 'Repository for all Kanban card-related information.' },
                { name: 'Material_Requests', description: 'Stores all requests to supply the material represented by a specific Kanban card.' }
            ],
            triggers: [
                { event: 'CREATE_REQUEST', function: 'Updates card status to EMPTY and creates a Material Request.' },
                { event: 'PROCESS_REQUEST', function: 'Updates request status tracking the material movement loop.' }
            ],
            mechanism: 'Seamless integration of four apps utilizing shared tables for continuous material replenishment.',
            steps: [
                { name: 'Kanban Manager', description: 'Master dashboard to view, create, edit, duplicate, and print Kanban cards.' },
                { name: 'Material Consumption', description: 'Operators scan a Kanban card to signal an empty bin and create a material request.' },
                { name: 'Water Spider Dashboard', description: 'Material handlers view open requests, pick them up, and set status to In Transit.' },
                { name: 'Material Supplier', description: 'Suppliers fulfill the request and mark the bin as Ready for Pickup.' },
                { name: 'Open Requests Detail', description: 'Detailed view for operators to track the exact status and location of a specific request.' }
            ]
        }
    },
    {
        id: 'lean-dashboard',
        name: 'Lean Dashboard Widgets',
        category: 'Analytic',
        description: 'Visualize cell performance across 5 key KPIS (People, Safety, Quality, Delivery, and Cost).',
        longDescription: 'Replace traditional paper-based shift dashboards with the lean dashboard Widget. Use this Widget as a quick reference to visualize cell performance. Operators or supervisors can update the status for the day by clicking the widget, with green indicating a good result and red indicating a poor result.',
        icon: <Activity size={28} color="#059669" />,
        bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        accent: '#059669',
        rating: 5.0,
        installs: 'New',
        features: ['PSQDC Tracking', 'Interactive Letter Widgets', 'Real-time Updates'],
        guide: {
            operation: '1. Click on a day segment to toggle its status (Good/Bad).\n2. View the full month layout in real-time.\n3. Data is stored and updated dynamically.',
            widgets: ['Lean Dashboard Widget', 'Text'],
            components: ['Lean Dashboard'],
            tables: [
                { name: 'tbl_lean_data', description: 'Table for storing monthly incident strings for PSQDC.' }
            ],
            triggers: [
                { event: 'ON_CLICK', function: 'Toggles the day status and updates the underlying variable string.' }
            ],
            mechanism: 'Custom rendering of letter widgets split into up to 31 daily segments.',
            steps: [
                { name: 'Lean Dashboard', description: 'The main dashboard layout with 5 KPI letter widgets.' }
            ]
        }
    },
    {
        id: 'order-management',
        name: 'Order Management',
        category: 'MES Production Suite',
        description: 'Manage work order creation, release, and track production station history & inspections.',
        longDescription: 'The Order Management app is a part of the composable MES Production Management suite. Use it to view detailed information of work orders, streamline order flow, and synchronize components of the supply chain.',
        icon: <FileText size={28} color="#0369a1" />,
        bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
        accent: '#0369a1',
        rating: 5.0,
        installs: 'New',
        features: ['Work Order Creation', 'Release Management', 'Station History', 'Inspection Tracking'],
        guide: {
            operation: '1. View open work orders and filter by status.\n2. Create new work orders with required quantity and material.\n3. Open order details to manage release and print a traveler.',
            widgets: ['Interactive Table', 'Form Inputs', 'Record Display'],
            components: ['Order Dashboard', 'Order Details', 'Traveler'],
            tables: [
                { name: 'Work_Orders', description: 'Master table for all order artifacts.' },
                { name: 'Bill_Of_Materials', description: 'Genealogy records and parent-child dependencies.' },
                { name: 'Station_Activity_History', description: 'Log of historical activity across stations.' },
                { name: 'Notes_And_Comments', description: 'Log notes tied to work orders.' },
                { name: 'Inspection_Results', description: 'Log of inspection results against materials.' }
            ],
            triggers: [
                { event: 'CREATE_ORDER', function: 'Generates a new work order with CREATED status.' },
                { event: 'RELEASE_ORDER', function: 'Updates work order status to RELEASED.' }
            ],
            mechanism: 'Uses relational logic to display station history and notes linked to the selected parent work order.',
            steps: [
                { name: 'View Work Orders', description: 'Main dashboard to filter and select work orders.' },
                { name: 'Create Work Order', description: 'Form to input requirements and target dates for new orders.' },
                { name: 'View Details', description: 'Displays full order context, notes, and activity history.' },
                { name: 'Traveler', description: 'Printable view with order barcodes and routing details.' }
            ]
        }
    },
    {
        id: 'review-and-ship',
        name: 'Review and Ship',
        category: 'MES Production Suite',
        description: 'Review details of work orders before shipping them from the manufacturing area.',
        longDescription: 'This simple application is for reviewing the details of work orders before shipping them from the manufacturing area. This app helps with logging the completion of the work order for increased visibility and streamlined work order management.',
        icon: <Truck size={28} color="#f59e0b" />,
        bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        accent: '#f59e0b',
        rating: 4.9,
        installs: 'New',
        features: ['Order Review', 'Shipping Dispatch', 'Label Printing'],
        guide: {
            operation: '1. Select a completed work order from the list.\n2. Review quantities and mark as Shipped.\n3. Print the shipping label.',
            widgets: ['Interactive Table', 'Record Display', 'Checkbox'],
            components: ['Review Dashboard', 'Shipping Label'],
            tables: [
                { name: 'Work_Orders', description: 'Master table for all order artifacts. Shared with Order Management.' }
            ],
            triggers: [
                { event: 'MARK_AS_SHIPPED', function: 'Updates the Work Order status to SHIPPED.' }
            ],
            mechanism: 'Filters Work_Orders for COMPLETED status and allows status transition to SHIPPED.',
            steps: [
                { name: 'View Work Orders', description: 'Dashboard to find orders ready for shipping.' },
                { name: 'Review Details', description: 'Checklist and validation before shipping.' },
                { name: 'Packaging Label', description: 'Printable label with shipping barcode.' }
            ]
        }
    },
    {
        id: 'order-execution',
        name: 'Order Execution',
        category: 'MES Production Suite',
        description: 'Select a work order and execute assembly operations while logging production output.',
        longDescription: 'The Order Execution app is part of the composable MES Production Management suite. The main function of the application is to select a work order and execute the assembly operations. Users can log units and look at assembly instructions on the same screen.',
        icon: <PlayCircle size={28} color="#10b981" />,
        bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        accent: '#10b981',
        rating: 4.8,
        installs: 'New',
        features: ['Assembly Instructions', 'Production Logging', 'Performance Tracking'],
        guide: {
            operation: '1. Select a RELEASED work order.\n2. Follow assembly instructions on the screen.\n3. Log quantity produced to create units.\n4. Mark order as COMPLETED.',
            widgets: ['Interactive Table', 'Record Display', 'Form Inputs'],
            components: ['Order Dashboard', 'Assembly View', 'Label Printing'],
            tables: [
                { name: 'Work_Orders', description: 'Master table for all order artifacts.' },
                { name: 'Units', description: 'Table logging individual produced units/batches.' },
                { name: 'Station_Activity_History', description: 'Log of historical activity across stations.' },
                { name: 'Stations', description: 'Table tracking station states and operators.' }
            ],
            triggers: [
                { event: 'LOG_PRODUCTION', function: 'Creates a Unit record and logs station history.' }
            ],
            mechanism: 'Changes order status to IN PROGRESS and logs created units against the selected order.',
            steps: [
                { name: 'View Released Orders', description: 'Dashboard to find released orders.' },
                { name: 'In Progress', description: 'Execution interface with instructions and logging.' },
                { name: 'Label', description: 'Printable product label.' }
            ]
        }
    },
    {
        id: 'andon-management',
        name: 'Andon Management',
        category: 'MES Production Suite',
        description: 'Monitor station statuses in real time, assign users, and resolve open Andon and alert events.',
        longDescription: 'The Andon Management application helps users monitor station statuses in real time. It allows viewing of open Andon and alert events, ensuring that issues are not only identified but also actively addressed to enhance productivity and efficiency.',
        icon: <ShieldAlert size={28} color="#dc2626" />,
        bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        accent: '#dc2626',
        rating: 4.8,
        installs: 'New',
        features: ['Real-time Monitoring', 'Issue Resolution', 'Event History'],
        guide: {
            operation: '1. Monitor the Station Status Table for issues.\n2. Open an Andon event or Alert event to view details.\n3. Assign an owner, add comments, and resolve the alert.',
            widgets: ['Interactive Table', 'Record Display', 'Text Inputs'],
            components: ['Station Status', 'Alert Details', 'Event History'],
            tables: [
                { name: 'Stations', description: 'Tracks the current running/down status of stations.' },
                { name: 'Actions', description: 'Table logging open alerts and Andon events.' }
            ],
            triggers: [
                { event: 'ASSIGN_USER', function: 'Updates the Owner field on the action record.' },
                { event: 'RESOLVE_ALERT', function: 'Updates the Status to Closed.' }
            ],
            mechanism: 'Filters Actions by open status for immediate resolution, and by closed status for historical review.',
            steps: [
                { name: 'Station Status Table', description: 'Main view of all stations.' },
                { name: 'View Andon', description: 'Address Andon events causing downtime.' },
                { name: 'View Alerts', description: 'Resolve alerts that need attention.' },
                { name: 'View History', description: 'Browse closed events and actions taken.' }
            ]
        }
    },
    {
        id: 'andon-terminal',
        name: 'Andon Terminal',
        category: 'MES Production Suite',
        description: 'Report downtime events and create alerts directly from the factory floor.',
        longDescription: 'The Andon Terminal app enables end-users to report downtime events to the station supervisor and create alerts. This empowers operators to contextualize ongoing issues and provides the quickest path to understanding and acting upon downtime.',
        icon: <Activity size={28} color="#f97316" />,
        bg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
        accent: '#f97316',
        rating: 4.7,
        installs: 'New',
        features: ['Downtime Reporting', 'Alert Creation', 'Operator Empowerment'],
        guide: {
            operation: '1. Select a Work Order to start production.\n2. In the Main Page, use Create Alert for non-blocking issues.\n3. Use Create Andon for blocking downtime (this will stop production).\n4. Resolve Andon events to resume work.',
            widgets: ['Interactive Table', 'Form Inputs', 'Record Display'],
            components: ['Order Selection', 'Main Terminal', 'Event Logging'],
            tables: [
                { name: 'Work_Orders', description: 'Tracks the order being worked on.' },
                { name: 'Stations', description: 'Updates station running/down state.' },
                { name: 'Actions', description: 'Logs the created alerts and andon events.' },
                { name: 'Station_Activity_History', description: 'Records the downtime events and duration.' }
            ],
            triggers: [
                { event: 'CREATE_ANDON', function: 'Creates an Action record and updates Station Status to DOWN.' },
                { event: 'RESOLVE_ANDON', function: 'Updates Station Status back to RUNNING.' }
            ],
            mechanism: 'Acts as the input source for the Actions table, which is then managed by the Andon Management app.',
            steps: [
                { name: 'Select Order', description: 'Choose a work order and begin production.' },
                { name: 'Main Page', description: 'Central hub for the operator.' },
                { name: 'Create Alert', description: 'Log a warning without stopping work.' },
                { name: 'Andon', description: 'Log a blocking issue and halt work.' },
                { name: 'Open Alerts', description: 'Review and resolve pending alerts.' }
            ]
        }
    },
    {
        id: 'performance-visibility-dashboard',
        name: 'Performance Visibility',
        category: 'MES Production Suite',
        description: 'Visualize shop floor data, OEE metrics, uptime, and downtime reasons.',
        longDescription: 'The Performance Visibility Dashboard is part of the composable MES Production Management app suite. It visualizes data logged on the shop floor, containing crucial information about the production such as up and downtime events, and showcases OEE metrics: Availability, Performance, and Quality.',
        icon: <HeartPulse size={28} color="#8b5cf6" />,
        bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
        accent: '#8b5cf6',
        rating: 4.9,
        installs: 'New',
        features: ['OEE Calculation', 'Downtime Pareto', 'Live Status'],
        guide: {
            operation: '1. View the main dashboard for real-time station statuses and downtime reasons.\n2. Navigate to the OEE Metrics step to view Availability, Performance, and Quality breakdowns.',
            widgets: ['Bar Chart', 'Donut Chart', 'Interactive Table'],
            components: ['Performance Dashboard', 'OEE Metrics'],
            tables: [
                { name: 'Stations', description: 'Real-time statuses of the stations.' },
                { name: 'Station_Activity_History', description: 'Log of historical activity across stations.' }
            ],
            triggers: [],
            mechanism: 'Aggregates data from Station Activity History to compute running times, downtime counts, and OEE.',
            steps: [
                { name: 'Dashboard', description: 'Main analytics view for uptime and downtime.' },
                { name: 'OEE Metrics', description: 'Holistic OEE calculation view.' }
            ]
        }
    },
    {
        id: 'performance-visibility-terminal',
        name: 'Performance Terminal',
        category: 'MES Production Suite',
        description: 'Log running events, downtime reasons, good parts, and defects on the floor.',
        longDescription: 'The Performance Visibility Terminal application is an operator-friendly user interface designed to log events (running, downtime, changeovers), downtime reasons, and the number of good parts and defects. It operates in manual, low-volume assembly environments where tracking unit by unit is not a necessity.',
        icon: <Cpu size={28} color="#06b6d4" />,
        bg: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)',
        accent: '#06b6d4',
        rating: 4.8,
        installs: 'New',
        features: ['Status Logging', 'Defect Tracking', 'Operator View'],
        guide: {
            operation: '1. Select the current Work Order to begin logging.\n2. In the Main step, change machine statuses (Running, Down, Idle, Off, Setup) as appropriate.\n3. Log Good Parts or Defects continuously. If selecting DOWN, specify a downtime reason.',
            widgets: ['Interactive Table', 'Status Buttons', 'Number Input'],
            components: ['Status Controller', 'Part Logging', 'Downtime Selector'],
            tables: [
                { name: 'Work_Orders', description: 'Loads orders and increments completed quantities.' },
                { name: 'Stations', description: 'Current status state for the local station.' },
                { name: 'Station_Activity_History', description: 'Logs the granular history of all status changes and quantities.' },
                { name: 'Material_Definitions', description: 'Used to reference target cycle times.' }
            ],
            triggers: [
                { event: 'LOG_GOOD_PARTS', function: 'Creates an entry in Station_Activity_History and increments order completion.' },
                { event: 'CHANGE_STATUS_DOWN', function: 'Updates the variable Current_Status, requires reason, and saves to History.' }
            ],
            mechanism: 'Acts as the primary data collection point for the Performance Visibility Dashboard.',
            steps: [
                { name: 'Select Order', description: 'Choose the work order from the table.' },
                { name: 'Main', description: 'Status switching and quantity logging.' },
                { name: 'Change Status Down', description: 'Forces selection of a downtime reason.' },
                { name: 'Analytics', description: 'Quick view of recent performance.' }
            ]
        }
    },
    {
        id: 'machine-monitoring-terminal',
        name: 'Machine Monitoring',
        category: 'MES Production Suite',
        description: 'Track machine utilization, log downtime reasons, and monitor performance and OEE.',
        longDescription: 'The Machine Monitoring Terminal app is designed for operators and supervisors to track machine utilization and performance. By bolestering machine uptime and capturing operator input, this terminal aids in optimizing asset utilization and achieving a deeper understanding of performance.',
        icon: <Settings size={28} color="#eab308" />,
        bg: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
        accent: '#eab308',
        rating: 4.9,
        installs: 'New',
        features: ['Machine Timelines', 'Notes & Comments', 'OEE Tracking'],
        guide: {
            operation: '1. Select an order and bind the session to a Machine ID.\n2. Set an Ideal Run Rate for target tracking.\n3. Log Parts, Defects, and Station Notes during operation.\n4. If stopped, select a downtime reason to inform the root-cause analysis.',
            widgets: ['Machine Timeline', 'Form Inputs', 'Interactive Table'],
            components: ['Machine Monitor', 'Notes Log', 'Downtime Selector'],
            tables: [
                { name: 'Work_Orders', description: 'Tracks the order being fulfilled by the machine.' },
                { name: 'Notes_Comments', description: 'Logs free-text notes submitted by operators at the machine.' }
            ],
            triggers: [
                { event: 'ADD_NOTE', function: 'Creates a record in Notes_Comments tied to the Work Order.' },
                { event: 'FINISH_PRODUCTION', function: 'Updates WO Status to COMPLETED and unbinds the Machine.' }
            ],
            mechanism: 'Integrates natively with Machine Timeline widgets to visualize running states and captures contextual operator inputs.',
            steps: [
                { name: 'Select Order', description: 'Pick order and input Machine ID.' },
                { name: 'Change Over', description: 'Set target parameters.' },
                { name: 'Machine Terminal', description: 'Primary heads-up display and logging.' },
                { name: 'Downtime Reason', description: 'Categorize stoppage events.' },
                { name: 'Notes', description: 'Review and add station notes.' }
            ]
        }
    },
    {
        id: 'operations-management-dashboard',
        name: 'Operations Dashboard',
        category: 'MES Production Suite',
        description: 'Simple dashboard showing the most important metrics for Safety, Quality, Performance, and Downtime.',
        longDescription: 'The Operations Management Dashboard application features a simple dashboard that serves as a great starting point for daily standups to discuss high-level metrics. It connects seamlessly with the other Composable MES applications to visualize the real-time operational status of your factory.',
        icon: <Layout size={28} color="#0ea5e9" />,
        bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
        accent: '#0ea5e9',
        rating: 4.8,
        installs: 'New',
        features: ['High-level Metrics', 'Issue Escalation', 'Standup Ready'],
        guide: {
            operation: '1. Open the dashboard to see Safety, Performance, Quality, and Downtime status panels.\n2. If a metric indicates a problem (red), click on it to automatically prepopulate the Create Action step.\n3. Assign an action owner and describe the issue to escalate it.\n4. Use the View Actions screen to track open tasks.',
            widgets: ['Dynamic Panels', 'Text Inputs', 'Interactive Table'],
            components: ['Status Dashboard', 'Escalation Form', 'Action Tracker'],
            tables: [
                { name: 'Station_Activity_History', description: 'Data source for calculating the dashboard metrics.' },
                { name: 'Actions', description: 'Target table where escalated issues are stored.' }
            ],
            triggers: [
                { event: 'PANEL_CLICK', function: 'Sets the Selected_Action_Type variable and navigates to Create Action.' },
                { event: 'CREATE_ACTION', function: 'Saves the issue into the Actions table and alerts the supervisor.' }
            ],
            mechanism: 'Translates high-level analytic red flags into actionable tasks that route directly to the Andon management layer.',
            steps: [
                { name: 'Dashboard', description: 'Four-panel view for the daily standup.' },
                { name: 'Create Action', description: 'Pre-filled escalation form.' },
                { name: 'View actions', description: 'Interactive table of all pending tasks.' }
            ]
        }
    },
    {
        id: 'material-handling',
        name: 'Material Handling',
        category: 'Inventory App Suite',
        description: 'Process and deliver material replenishment requests created by shop floor stations.',
        longDescription: 'The Material Handling app is part of the composable MES Inventory app suite. It enables request selection and dynamic management of material movement by status—open, requested, or ready to deliver—helping users optimize material flow and reduce inventory surplus stocks.',
        icon: <Truck size={28} color="#f97316" />,
        bg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
        accent: '#f97316',
        rating: 4.8,
        installs: 'New',
        features: ['Replenishment Loop', 'Status Tracking', 'Kanban Management'],
        guide: {
            operation: '1. In Kanban Request, review all pending material requests from the shop floor.\n2. Select a request and click Process to open the Confirm step.\n3. Update the request status (e.g., Request Ready to Deliver or Delivered to location) based on physical handoff.\n4. Close the request once material is fully replenished.',
            widgets: ['Interactive Table', 'Record Display', 'Dynamic Action Buttons'],
            components: ['Kanban Table', 'Action Confirmation', 'Image Viewer'],
            tables: [
                { name: 'Material_Requests', description: 'Stores the state and routing of all material movement tasks.' },
                { name: 'Kanban_Cards', description: 'Identifies the containers and material data.' }
            ],
            triggers: [
                { event: 'UPDATE_STATUS', function: 'Modifies the current status of the Material_Requests record.' }
            ],
            mechanism: 'Acts as the execution node for the replenishment pull system by closing loops created by requesting stations.',
            steps: [
                { name: 'Kanban Request', description: 'List of all pending requests.' },
                { name: 'Confirm', description: 'Review location data and update delivery status.' }
            ]
        }
    },
    {
        id: 'material-request',
        name: 'Material Request',
        category: 'Inventory App Suite',
        description: 'Create material replenishment requests for kanban bins that are currently out of stock.',
        longDescription: 'The Material Request app is a part of the composable MES Inventory app suite. It enables operators to request materials efficiently, reducing downtime and ensuring smooth assembly line operations by streamlining material replenishment processes.',
        icon: <Boxes size={28} color="#eab308" />,
        bg: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
        accent: '#eab308',
        rating: 4.8,
        installs: 'New',
        features: ['Kanban Trigger', 'Barcode Scanning', 'Simple Confirm'],
        guide: {
            operation: '1. On the Request Material step, scan a barcode or select an empty Kanban Card from the table.\n2. Review the selected card details (Part Number, QTY).\n3. Click Create New Request and confirm the order on the next screen.\n4. Wait for Material Handling to deliver the parts.',
            widgets: ['Interactive Table', 'Record Display'],
            components: ['Kanban Browser', 'Request Confirm'],
            tables: [
                { name: 'Material_Requests', description: 'Destination table where new replenishment requests are generated.' },
                { name: 'Kanban_Cards', description: 'Source table mapping all physical bins to part numbers.' }
            ],
            triggers: [
                { event: 'CREATE_REQUEST', function: 'Inserts a new row in Material_Requests with status REQUESTED.' }
            ],
            mechanism: 'Initiates a digital pull signal that populates the backlog of the Material Handling application.',
            steps: [
                { name: 'Request Material', description: 'Select kanban bin to replenish.' },
                { name: 'Confirm', description: 'Double check details before submission.' }
            ]
        }
    },
    {
        id: 'material-loading-receiving',
        name: 'Loading & Receiving',
        category: 'Inventory App Suite',
        description: 'Track and handle newly received materials, setup gates, and maintain FIFO backlog sequences.',
        longDescription: 'The Material Loading and Receiving app is part of Tulip’s composable MES Inventory app suite. It facilitates real-time tracking of arrived trucks and materials, gate allocations, proof of unloading capture, and historical log lookups.',
        icon: <Truck size={28} color="#06b6d4" />,
        bg: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)',
        accent: '#06b6d4',
        rating: 4.9,
        installs: 'New',
        features: ['Truck Arrivals Log', 'FIFO Unloading Backlog', 'Dynamic Gate Setup'],
        guide: {
            operation: '1. On the Home Menu, choose Truck Arrival, FIFO Board, or History.\n2. In Truck Arrival, log details and assign an active gate (or create a new Gate).\n3. Use the FIFO Board to select arrived shipments in order and confirm unloading.\n4. In History, search and view past arrivals with proof photos.',
            widgets: ['Interactive Tables', 'Form Inputs', 'Proof Camera/Link'],
            components: ['Home Switcher', 'FIFO Queue Manager', 'Gate Registrar'],
            tables: [
                { name: 'Equipment_Assets', description: 'Primary table storing shipment states (Arrived, Unloading, Complete) and proof images.' },
                { name: 'Locations', description: 'Represents gates in the warehouse where trucks are assigned.' }
            ],
            triggers: [
                { event: 'CONFIRM_ARRIVAL', function: 'Creates record in Equipment_Assets with status Arrived.' },
                { event: 'COMPLETE_UNLOAD', function: 'Updates status to Complete and registers proof image.' }
            ],
            mechanism: 'Acts as the entry point of raw inventory into the facility, mapping physical assets to physical gates.',
            steps: [
                { name: 'Home', description: 'Main navigation interface.' },
                { name: 'Truck Arrival', description: 'Input carrier, manifest, and assign gate.' },
                { name: 'Add New Gate', description: 'Quick setup of a gate location.' },
                { name: 'Upload Image', description: 'Log container/manifest picture.' },
                { name: 'FIFO Board', description: 'Unload backlog queue.' },
                { name: 'Unload Confirmation', description: 'Close loop with unloading photo proof.' },
                { name: 'View History', description: 'Searchable historical archive.' }
            ]
        }
    },
    {
        id: 'inventory-management',
        name: 'Inventory Management',
        category: 'Inventory App Suite',
        description: 'Comprehensive inventory manager handling stock adjustments, material definitions, and Kanban configurations.',
        longDescription: 'The Inventory Management app is a part of Tulip’s composable MES Inventory app suite. It enables stock additions/removals, editing statuses, viewing complete Kanban loops, printing container labels, and auditing historical request logs.',
        icon: <Settings size={28} color="#10b981" />,
        bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
        accent: '#10b981',
        rating: 5.0,
        installs: 'New',
        features: ['Stock Adjustments (Add/Remove QTY)', 'Print Bin Labels', 'Kanban Loop Maintenance'],
        guide: {
            operation: '1. On the Main Screen, select an item to view details, then click Add QTY, Remove QTY, or Edit status.\n2. Click Create inventory item to define new stock registers.\n3. Navigate to View Kanban cards to duplicate cards, print Zebra labels, or toggle active status.\n4. Auditing is simplified via the Material request history step.',
            widgets: ['Interactive Table', 'Record Display', 'Dynamic Adjustment Modals'],
            components: ['Stock Adjustment Desk', 'Kanban Loop Registry', 'Label Printer Module'],
            tables: [
                { name: 'Inventory_Items', description: 'Primary inventory tracking logs (ID, QTY, Location, Status).' },
                { name: 'Kanban_Cards', description: 'Holds definitions of storage containers.' },
                { name: 'Material_Requests', description: 'Historical record of replenishment logs.' },
                { name: 'Material_Definitions', description: 'Standard blueprint data for raw/final parts.' }
            ],
            triggers: [
                { event: 'ADD_QTY', function: 'Increments QTY field in selected Inventory_Items record.' },
                { event: 'DUPLICATE_CARD', function: 'Creates new Kanban card record with incremented ID.' }
            ],
            mechanism: 'Serves as the single source of truth for stock levels and container layouts, coordinating supply signals between shop floor nodes.',
            steps: [
                { name: 'Main Screen', description: 'Control dashboard with stock tables.' },
                { name: 'Create Inventory Item', description: 'Registration of new raw parts.' },
                { name: 'Add QTY', description: 'Increment inventory quantities.' },
                { name: 'Remove QTY', description: 'Decrement inventory quantities.' },
                { name: 'Edit Status', description: 'Change item states (e.g. Quarantined, Available).' },
                { name: 'Material Request History', description: 'Searchable audit log.' },
                { name: 'View Kanban Cards', description: 'Container catalog list.' },
                { name: 'Create Kanban Card', description: 'Register a new container.' },
                { name: 'Edit Kanban Card', description: 'Activate/Deactivate toggle.' },
                { name: 'Print Label', description: 'Printer queue dispatch.' }
            ]
        }
    },
    {
        id: 'kanban-inventory-system',
        name: 'Kanban Inventory System',
        category: 'Inventory App Suite',
        description: 'End-to-End Kanban & Inventory Management covering Master Setup, Supply Receiving, Kanban BOM Explosion, Validation, and Production Picking.',
        longDescription: 'This app standardizes the discrete manufacturing material flow based on a Kanban-pull system. It covers Part Definition, Bill of Material (BOM) mapping, Supply Ingestion (receiving), Kanban Card generation, live Stock Validation, material Picking, and real-time dashboard KPIs.',
        icon: <Sliders size={28} color="#8b5cf6" />,
        bg: 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)',
        accent: '#8b5cf6',
        rating: 5.0,
        installs: 'New',
        features: ['BOM Mapping', 'Automatic Kanban Generation', 'Picking Stock Deductions', 'KPI Inventory Dashboards'],
        guide: {
            operation: '1. In Master Data Setup, define Parent and Child parts and establish BOM quantities.\n2. Use Supply & Receiving to ingest materials and increment stock levels.\n3. Generate Kanban cards based on Parent Parts.\n4. Check stock status in Stock Validation and click Complete Picking to deduct inventory.\n5. View real-time logs and alerts on the Inventory Monitoring dashboard.',
            widgets: ['Interactive Table', 'Text Input Form', 'Validation Status Indicator'],
            components: ['Parts Setup Module', 'BOM Linker', 'Supply Dock Desk', 'Kanban Pick Runner'],
            tables: [
                { name: 'Material_Definitions', description: 'Master catalog of all Parent and Child parts.' },
                { name: 'BOM_Relations', description: 'Mapping of child parts required to build parent parts.' },
                { name: 'Material_Supply', description: 'Logs of incoming supplier materials.' },
                { name: 'Inventory_Items', description: 'Real-time stock balance per location.' },
                { name: 'Kanban_Orders', description: 'Active kanban cards and required quantities.' },
                { name: 'Material_Picking', description: 'Audit trail of picked parts dispatched to the line.' }
            ],
            triggers: [
                { event: 'GENERATE_KANBAN', function: 'Creates multiple Kanban Card records based on BOM definition.' },
                { event: 'COMPLETE_PICKING', function: 'Logs picking history and decrements available inventory stock.' }
            ],
            mechanism: 'Implements a complete closed-loop manufacturing pull system, ensuring component availability check before picking is allowed.',
            steps: [
                { name: 'Master Data Setup', description: 'Define part blueprints and BOM relations.' },
                { name: 'Supply & Receiving', description: 'Log incoming materials and increment stocks.' },
                { name: 'Kanban Generation', description: 'Trigger kanban loops based on production requirements.' },
                { name: 'Validation & Picking', description: 'Verify stock levels and dispatch parts.' },
                { name: 'Inventory Monitoring', description: 'Real-time KPI tables and alerts.' }
            ]
        }
    },
    {
        id: 'inventory-dashboard',
        name: 'Inventory Dashboard',
        category: 'Inventory App Suite',
        description: 'Show and visualize material replenishment cycles, pending requests, and stock out patterns.',
        longDescription: 'The Inventory Dashboard is a part of Tulip’s composable MES Inventory app suite. It visualizes data from the shop floor, tracking cycle times, bottleneck areas, and current inventory requests.',
        icon: <BarChart3 size={28} color="#10b981" />,
        bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
        accent: '#10b981',
        rating: 4.8,
        installs: 'New',
        features: ['Live Cycle Time Gauges', 'Replenishment Schedule Tables', 'Automated Stock Out Warning Indicators'],
        guide: {
            operation: '1. Review Today\'s deliveries counters (Warehouse, Machine Shop, Supermarket) on the left panel.\n2. Monitor the current queue schedule tables in the middle column.\n3. Track cycle-time KPIs and review Frequent Empty Signals in the stock-outs table.',
            widgets: ['KPI Numbers', 'Filtered Schedule Tables', 'Dynamic Stock Out Grid'],
            components: ['Performance Summary Panel', 'Live Logistics Dispatch Board', 'Warehouse Analytics Module'],
            tables: [
                { name: 'Material_Requests', description: 'Stores status logs of replenishment loops.' }
            ],
            triggers: [
                { event: 'REFRESH', function: 'Pulls the latest status counts and updates average cycle time metrics.' }
            ],
            mechanism: 'Collects transactional timestamps from upstream frontline applications and maps them into real-time visual KPI tiles.',
            steps: [
                { name: 'Inventory Dashboard', description: 'Combined real-time analytics dashboard.' }
            ]
        }
    },
    {
        id: 'replenishment',
        name: 'Replenishment',
        category: 'Inventory App Suite',
        description: 'Act as a mini-inventory supermarket on the shop floor, fulfilling and creating replenishment signals.',
        longDescription: 'The Replenishment app is a part of Tulip’s composable MES Inventory app suite. It manages supermarket storage bins near production, enabling operators to fulfill pending material requests and trigger replenishment orders.',
        icon: <Zap size={28} color="#1d4ed8" />,
        bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        accent: '#1d4ed8',
        rating: 4.9,
        installs: 'New',
        features: ['Open Requests Monitor', 'Active Location Filters', 'Direct Supermarket Request Trigger'],
        guide: {
            operation: '1. Open "View Open Material Requests" step to check pending container fulfillments.\n2. Select "Request Material for a Kanban Card" to view active bins.\n3. Choose an empty container card and click "Create New Request" to notify the central warehouse.',
            widgets: ['Pending Requests Table', 'Location Kanban Cards Grid', 'Fulfillment Photo Proof Box'],
            components: ['Supermarket Control Board', 'Direct Warehouse Pull Signal', 'FIFO Dispatch Queue'],
            tables: [
                { name: 'Material_Requests', description: 'Tracks pending and completed replenishment events.' },
                { name: 'Kanban_Cards', description: 'Lists active supermarket bin cards.' }
            ],
            triggers: [
                { event: 'CREATE_REQUEST', function: 'Inserts a new replenishment signal with REQUESTED status.' }
            ],
            mechanism: 'Integrates supermarket inventory status changes directly with Material Handling logistics for rapid restocking.',
            steps: [
                { name: 'View Open Material Requests', description: 'Monitor pending shopfloor container fulfillments.' },
                { name: 'Select Kanban Card', description: 'Identify active supermarket bins to restock.' },
                { name: 'Confirm', description: 'Final order confirmation trigger.' }
            ]
        }
    },
    {
        id: 'material-warehouse',
        name: 'Material Warehouse',
        category: 'Inventory App Suite',
        description: 'Store newly arrived materials into the warehouse or coordinate item movements between bin locations.',
        longDescription: 'The Material Warehouse application enables warehouse operators to transact new stock or execute physical bin relocations with visual confirmation steps, optimizing logistics flow.',
        icon: <Truck size={28} color="#eab308" />,
        bg: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
        accent: '#eab308',
        rating: 4.8,
        installs: 'New',
        features: ['Relocation Backlog Grid', 'Interactive Quantity Modifiers', 'Location Scan Target Verification'],
        guide: {
            operation: '1. Select "Add Item to Inventory" or "Change Item Location" from the home menu.\n2. Scan the container barcode or manually input quantities using the dynamic modifier block.\n3. Validate the destination warehouse bin location on the Inventory table confirmation step.',
            widgets: ['Scan Simulation Viewport', 'Quantity Calculator Box', 'Inventory Items Detail Panel'],
            components: ['Warehouse Reception Deck', 'Stock Relocation Controller', 'Inventory Master Registry'],
            tables: [
                { name: 'Inventory_Items', description: 'Tracks live item levels and location areas.' },
                { name: 'Material_Definitions', description: 'References static part metadata profiles.' }
            ],
            triggers: [
                { event: 'TRANSACT_ITEM', function: 'Performs upserts on Inventory Items, recalculating quantity and changing locations.' }
            ],
            mechanism: 'Fosters real-time synchronization between reception gates, rack storage configurations, and material replenishment signals.',
            steps: [
                { name: 'Home', description: 'Flow selection hub.' },
                { name: 'Scan Item', description: 'Camera viewport mock scan.' },
                { name: 'Type item', description: 'Quantity modifiers and material details.' },
                { name: 'Scan Location', description: 'Location scan confirmation.' },
                { name: 'Inventory', description: 'Final records registry details.' }
            ]
        }
    },
    {
        id: 'quality-inspection-suite',
        name: 'Quality Inspection Suite',
        category: 'Quality',
        description: 'Compare dynamic testing apps vs composed quality inspection apps with guided visual instructions.',
        longDescription: 'Explore the two primary options when digitizing quality processes: generic Dynamic testing runs (configured via table-driven inspection plans) and highly customized Composed guided inspection apps with cylinder alignment reference instructions.',
        icon: <Sparkles size={28} color="#06b6d4" />,
        bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
        accent: '#06b6d4',
        rating: 4.9,
        installs: 'New',
        features: ['Dynamic Plan Reviewer', 'Numeric Test Entry Panel', 'Visual Assembly Instructions'],
        guide: {
            operation: '1. Open "Review plan" to inspect dynamic parameters loaded from database tables.\n2. Proceed to "Record numeric results" to enter and validate weight/dimensions against spec limits.\n3. Open "Inspect unit" to run a composed, guided checklist on cylinder end-caps with assembly photo assistance.',
            widgets: ['Dynamic Plan Backlog Grid', 'Numeric Spec Limits Board', 'Composed Checklist Viewport'],
            components: ['Quality Plan Architect', 'Test Execution Terminal', 'Visual Assembly Inspector'],
            tables: [
                { name: 'Inspection_Plans', description: 'Tracks target weight and tolerances.' },
                { name: 'Inspection_Results', description: 'Stores recorded measurements and checklist confirmations.' }
            ],
            triggers: [
                { event: 'CONFIRM_PLAN', function: 'Verifies planning parameters and progresses to numeric recording.' }
            ],
            mechanism: 'Contrast the rapid setup and low maintenance of dynamic testing apps with the extreme customizability of composed work instruction workflows.',
            steps: [
                { name: 'Review plan', description: 'Verify composed dynamic quality checklist rows.' },
                { name: 'Record numeric results', description: 'Input values against dynamic limits.' },
                { name: 'Inspect unit', description: 'Composed guided visual checklist.' }
            ]
        }
    },
    {
        id: 'quality-gate',
        name: 'Quality Gate',
        category: 'Quality',
        description: 'Checkpoint kualitas sebelum shipping: barcode scan, checklist visual, foto, pass/fail decision, dan tanda tangan digital inspector.',
        longDescription: 'Quality Gate adalah checkpoint terakhir sebelum produk dikirim. Operator melakukan identifikasi produk via barcode, inspeksi visual 4 kriteria (surface, dimension, functional, marking), foto dokumentasi, keputusan APPROVE/REJECT, dan tanda tangan digital. Semua data tersimpan ke database untuk audit trail.',
        icon: <ShieldCheck size={28} color="#16a34a" />,
        bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        accent: '#16a34a',
        rating: 4.8,
        installs: 'New',
        features: ['Barcode Scan', '4-Point Visual Checklist', 'Photo Capture', 'PASS/FAIL Decision', 'Digital Signature'],
        guide: {
            operation: '1. Scan barcode atau ketik serial number produk.\n2. Isi nama inspector.\n3. Periksa 4 kriteria visual: Surface, Dimension, Functional, Marking.\n4. Ambil foto produk (opsional).\n5. Putuskan APPROVE atau REJECT.\n6. Tanda tangan digital dan simpan.',
            widgets: ['Barcode Scanner', 'Button PASS/FAIL', 'Webcam Capture', 'Signature Pad', 'Text Display'],
            components: ['Product Identification', 'Visual Inspection Checklist', 'Decision Panel', 'Done Screen'],
            tables: [],
            triggers: [
                { event: 'APPROVE', function: 'Menyimpan hasil APPROVED ke database dan mengakhiri sesi inspeksi.' },
                { event: 'REJECT', function: 'Menyimpan hasil REJECTED ke database dan mencatat defect notes.' }
            ],
            mechanism: 'Quality Gate menggunakan pendekatan checklist visual 4 titik dengan keputusan binary PASS/FAIL. Setiap kriteria memiliki tombol aksi langsung. Hasil akhir ditandatangani secara digital untuk audit compliance.',
            steps: [
                { name: 'Identifikasi Produk', description: 'Scan barcode atau input serial number.' },
                { name: 'Inspeksi Visual', description: 'Checklist 4 kriteria: Surface, Dimension, Functional, Marking.' },
                { name: 'Keputusan & Sign-Off', description: 'Review hasil, APPROVE/REJECT, tanda tangan digital.' },
                { name: 'Selesai', description: 'Konfirmasi hasil dan restart untuk produk berikutnya.' }
            ]
        }
    },
    {
        id: 'hc-cylinder-inspection',
        name: 'HC Cylinder Inspection',
        category: 'Quality',
        description: 'Template inspeksi lengkap hydraulic cylinder: 2D/3D drawing dimensi, Function Test, Pressure Test, Visual Rod & Piston, Stroke Check dengan animasi.',
        longDescription: 'Standarisasi proses inspeksi quality control hydraulic cylinder di shopfloor. Operator dibimbing langkah demi langkah: identifikasi komponen, pengukuran 10 dimensi pada 2D blueprint interaktif, verifikasi GD&T 7 karakteristik pada view isometrik 3D, function test 8 pengujian fungsional, pressure test 4 fase (Proof/Burst/Working/Min), visual inspection rod & piston, hingga stroke measurement dengan diagram animasi. Hasil tersimpan ke database dan dapat dicetak sebagai laporan QC.',
        icon: <Wrench size={28} color="#2563eb" />,
        bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        accent: '#2563eb',
        rating: 5.0,
        installs: 'New',
        features: ['2D Blueprint Drawing Interaktif', '3D Isometric + GD&T Callout', 'Pressure Test 4 Fase', 'Visual Rod & Piston Check', 'Stroke Animation & Measurement'],
        guide: {
            operation: '1. Isi identifikasi part (Work Order, Part Number, Serial Number, Operator).\n2. Input pengukuran 10 dimensi pada 2D blueprint (Bore, Rod, Stroke, OAL, dll).\n3. Verifikasi 7 karakteristik GD&T (Cylindricity, Straightness, Runout, dll) pada view 3D.\n4. Catat hasil 8 pengujian fungsional (extend/retract, leakage, cushioning).\n5. Input tekanan aktual pada 4 fase pressure test (Proof 250 bar, Burst 350 bar, Working 160 bar, Min 20 bar).\n6. Inspeksi visual rod, piston, seal, dan weld.\n7. Ukur stroke aktual 3x pengukuran, hitung deviasi & drift.\n8. Finalisasi keputusan PASS/FAIL dan simpan laporan ke database.',
            widgets: ['SVG Blueprint 2D Viewer', 'SVG 3D Isometric Viewer', 'Dropdown Result Selector', 'Number Input Fields', 'Textarea Notes'],
            components: ['Header Identifikasi', '2D Dimensi Step', '3D GD&T Step', 'Function Test Step', 'Pressure Test Step', 'Visual Inspection Step', 'Stroke Check Step', 'Summary & Sign-Off Step'],
            tables: [
                { name: 'HC_Inspections', description: 'Menyimpan seluruh hasil inspeksi hydraulic cylinder termasuk dimensi, tekanan, visual, stroke, dan keputusan akhir PASS/FAIL.' }
            ],
            triggers: [
                { event: 'SIMPAN_LAPORAN', function: 'Menyimpan semua variabel inspeksi ke tabel HC_Inspections dan mengupdate status work order.' }
            ],
            mechanism: 'Multi-step guided inspection dengan SVG blueprint 2D interaktif dan view isometrik 3D. Setiap langkah memeriksa satu aspek cylinder secara sistematis mengikuti standar ISO 10100 untuk hydraulic cylinder.',
            steps: [
                { name: '1. Identifikasi Cylinder', description: 'Input Work Order, Part Number, Serial Number, Operator, Shift.' },
                { name: '2. 2D Drawing & Dimensi', description: 'Pengukuran 10 parameter dimensi (Bore, Rod, Stroke, OAL, dll) dengan blueprint SVG.' },
                { name: '3. 3D View & GD&T', description: 'Verifikasi 7 karakteristik GD&T pada tampilan isometrik 3D.' },
                { name: '4. Function Test', description: 'Pengujian 8 fungsi: extend/retract no/full load, leakage, cushioning.' },
                { name: '5. Pressure Test', description: 'Test 4 fase tekanan: Proof 250 bar, Burst 350 bar, Working 160 bar, Min 20 bar.' },
                { name: '6. Visual Rod & Piston', description: 'Inspeksi visual permukaan rod, piston, seal, weld, port, coating.' },
                { name: '7. Stroke Check', description: 'Pengukuran stroke aktual 3x, hitung rata-rata, deviasi, dan drift test.' },
                { name: '8. Ringkasan & Sign-Off', description: 'Keputusan akhir PASS/FAIL, catatan, tanda tangan digital, simpan database.' }
            ]
        }
    },
    {
        id: 'product-drawing-inspection',
        name: 'Product Drawing QC Terminal',
        category: 'Quality',
        description: 'Pengecekan kualitas presisi produk menggunakan blueprint 2D interaktif dan 3D CAD digital twin.',
        longDescription: 'Standardisasikan proses pengecekan kualitas produk manufaktur secara visual dan dimensional. Operator dapat mengklik bagian dimensi langsung pada blueprint teknik 2D untuk memasukkan nilai ukur aktual, serta memutar/zoom model 3D CAD untuk memverifikasi detail perakitan.',
        icon: <Sparkles size={28} color="#2563eb" />,
        bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        accent: '#2563eb',
        rating: 4.9,
        installs: 'New',
        features: ['Interactive 2D Blueprint Check', '3D CAD Orbit Viewer', 'Digital Signature Sign-Off'],
        guide: {
            operation: '1. Inisialisasi pengecekan dengan memilih atau mengetik nomor Work Order dan identitas operator.\n2. Klik titik-titik dimensi penting langsung di blueprint 2D (Panjang, Diameter, Bore) lalu masukkan nilai ukur aktual.\n3. Putar dan periksa model CAD 3D untuk memverifikasi sambungan las dan kelengkapan baut.\n4. Tinjau rangkuman laporan, bubuhkan tanda tangan digital operator, lalu kirimkan laporan ke database.',
            widgets: ['Interactive SVG blueprint', 'Canvas 3D CAD player', 'Signature Pad Widget'],
            components: ['CAD Flange Blueprint', '3D CAD digital twin viewer', 'Operator Sign-off Board'],
            tables: [
                { name: 'Inspection_Plans', description: 'Menyimpan target toleransi panjang dan diameter.' },
                { name: 'Inspection_Results', description: 'Menyimpan hasil ukur dimensi 2D, visual 3D, tanda tangan, dan status kelulusan.' }
            ],
            triggers: [
                { event: 'SUBMIT_QC', function: 'Menyimpan hasil pengecekan produk ke database dan memperbarui status work order.' }
            ],
            mechanism: 'Mengintegrasikan representasi file desain CAD (2D & 3D) langsung ke dalam alur kerja frontline operator di shopfloor untuk meminimalkan error interpretasi gambar teknik.',
            steps: [
                { name: 'Inisialisasi Pengecekan', description: 'Mencatat WO dan operator.' },
                { name: 'Dimensi 2D Drawing', description: 'Pengukuran fisik berbasis blueprint interaktif.' },
                { name: 'Visual 3D Assembly', description: 'Inspeksi model 3D CAD interaktif.' },
                { name: 'Ringkasan & Sign-Off', description: 'Rangkuman akhir dan tanda tangan.' }
            ]
        }
    },
    {
        id: 'frontline-qms',
        name: 'Frontline QMS',
        category: 'Quality',
        description: 'Manage shopfloor quality deviations, defects, and raise corrective actions (CAPA) inside the Frontline QMS suite.',
        longDescription: 'Standardize defect tracking, visual inspections, and CAPA logging directly on the shop floor. Features robust workflow actions for Material Review Boards (MRB) to scrap, rework, or approve deviations.',
        icon: <ShieldCheck size={28} color="#0d9488" />,
        bg: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
        accent: '#0d9488',
        rating: 5.0,
        installs: 'New',
        features: ['MRB Scrap/Rework Actions', 'Visual Defect Inspector', 'CAPA Root Cause Logger'],
        guide: {
            operation: '1. Select a defect from the active backlog on the Material Review Board.\n2. Tap "Manage Selected Defect" to choose a resolution: Scrap, Rework, or Use-as-is.\n3. Execute "Run Unit Inspection" for cylinder assembly quality verification.\n4. Complete the "Raise CAPA Event" forms with 5-Why analysis details for compliance.',
            widgets: ['MRB Defect backlog grid', 'Resolution command center', 'Visual inspection guide', 'CAPA submission block'],
            components: ['Defect Tracker Terminal', 'MRB Resolution deck', 'CAPA Incident Architect'],
            tables: [
                { name: 'Defect_Events', description: 'Primary registry for quality deviations.' },
                { name: 'CAPA_Incidents', description: 'Stores engineering investigations and preventive plans.' }
            ],
            triggers: [
                { event: 'RESOLVE_DEFECT', function: 'Performs state transitions (SCRAP / REWORK / USE_AS_IS) on the defect record.' }
            ],
            mechanism: 'Bridges shop floor quality execution directly with engineering CAPA control loops, improving response time and traceability.',
            steps: [
                { name: 'Material Review Board', description: 'Grid of all active quality incidents.' },
                { name: 'Manage defect - unit', description: 'Scrap, Rework, or Use-as-is options.' },
                { name: 'Inspect unit', description: 'Guided cylinder checklist.' },
                { name: 'CAPA Incident', description: 'Root cause and action plan entry.' }
            ]
        }
    },
    {
        id: 'material-review-board',
        name: 'Material Review Board',
        category: 'Quality',
        description: 'Review reported defective materials, modify details, and assign disposition decisions (Scrap, Rework, or Use-As-Is) with justifications and evidence.',
        longDescription: 'The Material Review Board (MRB) application is designed to help quality engineers or production supervisors review, track, and manage defective materials. It allows them to analyze defects, update defect records, and determine the appropriate disposition while documenting justifications and supporting evidence.',
        icon: <ShieldAlert size={28} color="#e11d48" />,
        bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
        accent: '#e11d48',
        rating: 5.0,
        installs: 'New',
        features: ['Select Disposition: Scrap/Rework/Use-As-Is', 'Record Justification', 'Upload Evidence Document/Image'],
        guide: {
            operation: '1. Select an active defect from the MRB Dashboard backlog.\n2. In Review Defect, modify defect reason or description if needed and click Save.\n3. In Select Disposition, choose Scrap, Rework, or Use-As-Is.\n4. Complete the chosen disposition details (e.g. assignee, instructions, justification, evidence capture).\n5. Submit to update the defect status.',
            widgets: ['MRB backlog table', 'Defect details panel', 'Capture evidence button', 'Disposition triggers'],
            components: ['MRB Backlog Dashboard', 'Defect Details Auditor', 'Disposition Assignment Cards'],
            tables: [
                { name: 'Defect_Events', description: 'Tracks all reported quality deviations and their dispositions.' },
                { name: 'Work_Orders', description: 'Provides reference order data for context.' }
            ],
            triggers: [
                { event: 'ON_ROW_SELECT', function: 'Loads the selected defect details into the app variables.' },
                { event: 'SUBMIT_DISPOSITION', function: 'Performs a status change to SCRAPPED, REWORK IN PROGRESS, or USE AS IS.' }
            ],
            mechanism: 'Performs TABLE_RECORD_SAVE actions to update the defect event record with disposition decision details.',
            steps: [
                { name: 'MRB Dashboard', description: 'Displays active defect logs requiring review.' },
                { name: 'Review Defect', description: 'Allows modifying and verifying defect details.' },
                { name: 'Select Disposition', description: 'Shows Scrap, Rework, and Use-As-Is choices.' },
                { name: 'Scrap Disposition', description: 'Log justification and upload evidence to scrap material.' },
                { name: 'Rework Disposition', description: 'Specify instructions, assignee, and rework station.' },
                { name: 'Use-As-Is Disposition', description: 'Input deviation justifications and engineering approval.' }
            ]
        }
    },
    {
        id: 'smarthome-iot',
        name: 'SmartHome Control Center',
        category: 'SmartHome / IoT',
        description: 'Command and monitor smart switches, lighting, thermostats, cameras, locks, and vacuums in real-time.',
        longDescription: 'A premium smart home dashboard template featuring full integrations with Tuya, Bardi, and Sonoff devices. Allows toggling power, setting temperature and brightness levels, monitoring sensors, and securing your home.',
        icon: <Cpu size={28} color="#ff5f00" />,
        bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        accent: '#ff5f00',
        rating: 4.9,
        installs: 'New',
        features: ['Multi-brand Compatibility', 'MQTT Real-time Sync', 'Security Arming'],
        guide: {
            operation: '1. View active device status\n2. Toggle smart switch power outlets\n3. Adjust lighting brightness/color\n4. Set AC temperature\n5. Arm/Disarm home security system',
            widgets: ['SmartHome Controller', 'Tuya Smart IoT Product', 'Interactive Gauge', 'Action Buttons'],
            components: ['Living Room Control Panel', 'Security & Sensors Panel', 'System Logs & Metrics Gauge'],
            tables: [],
            triggers: [
                { event: 'ARM_SECURITY', function: 'Sets Security_Status variable to ARMED and sends notification.' },
                { event: 'DISARM_SECURITY', function: 'Sets Security_Status variable to DISARMED and logs time.' }
            ],
            mechanism: 'Binds UI components to MQTT topics for real-time publishing and updates.',
            steps: [
                { name: 'SmartHome Panel', description: 'Consolidated dashboard for all active smart home and security IoT devices.' }
            ]
        }
    },
    {
        id: 'plc-hmi-terminal',
        name: 'PLC HMI Control Terminal',
        category: 'SmartHome / IoT',
        description: 'Interactive HMI dashboard for PLC monitoring and control, featuring gauges, speed setpoint slider, motor controls, and signal telemetry.',
        longDescription: 'A premium industrial HMI dashboard template designed for real-time PLC interaction. Includes dual analog gauges (level, pressure), speed setpoint control slider, start/stop action triggers, and telemetry status widgets.',
        icon: <Cpu size={28} color="#0284c7" />,
        bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        accent: '#0284c7',
        rating: 4.8,
        installs: 'New',
        features: ['Analog Gauge Readouts', 'Speed Setpoint Control', 'Industrial Signal Status'],
        guide: {
            operation: '1. Monitor fluid levels and system pressure in real-time\n2. Adjust conveyor speed setpoint via control slider\n3. Tap Start Motor to run systems\n4. Tap Stop Motor or Reset Alarm to handle system warnings',
            widgets: ['Analog Gauges', 'Setpoint Slider', 'Action Buttons', 'Variable Display Text'],
            components: ['Main HMI Dashboard', 'Motor Controls Panel', 'Telemetry Status Grid'],
            tables: [],
            triggers: [
                { event: 'ON_CLICK_START', function: 'Sets Motor_Status variable to RUNNING and broadcasts notification.' },
                { event: 'ON_CLICK_STOP', function: 'Sets Motor_Status variable to STOPPED and broadcasts warning.' },
                { event: 'ON_CLICK_RESET', function: 'Clears system alarm message.' }
            ],
            mechanism: 'Binds UI components to interactive variables simulating PLC inputs and outputs.',
            steps: [
                { name: 'HMI Dashboard', description: 'Consolidated dashboard for monitoring and managing active PLC components.' }
            ]
        }
    },
    {
        id: 'lot-generator',
        name: 'MES Lot Number Generator',
        category: 'Quality',
        description: 'Penataan & pembuatan nomor Lot produksi standar manufaktur dengan penomoran sequence otomatis per Part & Bulan.',
        longDescription: 'Aplikasi MES Lot Generator siap pakai untuk penomoran lot produksi manufaktur. Menyimpan master part, counter running number per bulan, dan history pembuatan lot secara persisten menggunakan Database Tables MAVI MES. Dilengkapi format tahun/bulan, sequence ganjil/genap/normal, copy lot, export CSV, serta preview & pencetakan label barcode thermal 50x30mm.',
        icon: <Tag size={28} color="#2563eb" />,
        bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        accent: '#2563eb',
        rating: 5.0,
        installs: 'New',
        features: ['Full DB Table Integration', 'Sequence Normal/Odd/Even', 'Running Number Reset Monthly', 'Export CSV & Thermal Print'],
        guide: {
            operation: '1. Pilih Part No dari MasterPart.\n2. Masukkan Prefix Mark dan nama Operator.\n3. Klik Generate Lot untuk menghasilkan Lot Number baru & otomatis tersimpan ke tabel database lot_history.\n4. Gunakan tombol Copy Lot atau Print Label Thermal.\n5. Filter dan Export log history ke format CSV.',
            widgets: ['Part No Dropdown', 'Mark Input', 'Generate Action Button', 'Thermal Label SVG Preview'],
            components: ['Generate Lot Form', 'Thermal Barcode Label', 'Lot History Log Table', 'Master Part Manager Modal'],
            tables: [
                { name: 'lot_master_parts', description: 'Menyimpan daftar Master Part, Customer, Mark, dan Sequence Type.' },
                { name: 'lot_counters', description: 'Menyimpan posisi running number terakhir per Part & Bulan.' },
                { name: 'lot_history', description: 'Menyimpan log history pembuatan lot number lengkap dengan timestamp.' }
            ],
            triggers: [
                { event: 'GENERATE_LOT', function: 'Menghitung sequence berikutnya dan menyimpan record ke tabel lot_history.' }
            ],
            mechanism: 'Membaca dan menyimpan data secara langsung ke tabel database system lot_master_parts, lot_counters, dan lot_history.',
            steps: [
                { name: '1. Inisialisasi Database', description: 'Menginisialisasi tabel database lot_master_parts, lot_counters, dan lot_history.' },
                { name: '2. Select Part & Generate', description: 'Memilih Part No dan menekan tombol Generate Lot.' },
                { name: '3. Copy & Thermal Print', description: 'Copy text lot number atau cetak label barcode thermal.' }
            ]
        }
    }
];
