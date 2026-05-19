import React, { useState } from 'react';
import {
    Layout, Sparkles, Settings2, Package, Wrench, ArrowRight, CheckCircle2,
    Search, Filter, Star, Zap, Info, Rocket, Database, ShieldCheck,
    ChevronRight, ShoppingBag, Plus, Award, Boxes, ShieldAlert, BookOpen, X, Trash2,
    List, Cpu, Settings, FileText, PlayCircle, Activity, HeartPulse, Truck,
    Image as ImageIcon
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { createIncomingInspectionTemplate } from '../utils/incomingInspectionTemplate';
import { createWeighDispenseTemplate } from '../utils/weighDispenseTemplate';
import { createAssyLineProductionTemplate } from '../utils/assyLineProductionTemplate';
import { createInventoryAlertTemplate } from '../utils/inventoryAlertTemplate';
import { createCarWorkshopTemplate } from '../utils/carWorkshopTemplate';
import { createAndonSystemTemplate } from '../utils/andonSystemTemplate';
import { createPicklistTemplate } from '../utils/picklistTemplate';
import { createDefectTrackingTemplate } from '../utils/defectTrackingTemplate';
import { createEquipmentManagementTemplate } from '../utils/equipmentManagementTemplate';
import { createKanbanAppSuiteTemplate } from '../utils/kanbanAppSuiteTemplate';
import { createLeanDashboardTemplate } from '../utils/leanDashboardTemplate';
import { createOrderManagementTemplate } from '../utils/orderManagementTemplate';
import { createReviewAndShipTemplate } from '../utils/reviewAndShipTemplate';
import { createOrderExecutionTemplate } from '../utils/orderExecutionTemplate';
import { createAndonManagementTemplate } from '../utils/andonManagementTemplate';
import { createAndonTerminalTemplate } from '../utils/andonTerminalTemplate';
import { createPerformanceVisibilityDashboardTemplate } from '../utils/performanceVisibilityDashboardTemplate';

import { saveFrontlineApp } from '../utils/supabaseFrontlineDB';
import { createTable, getTables, addTableRecord } from '../utils/database';
import { getCurrentUser } from '../utils/auth';
import toast, { Toaster } from 'react-hot-toast';

const AppStore = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [installingId, setInstallingId] = useState(null);
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [modalTab, setModalTab] = useState('guide'); // 'guide' | 'preview'

    const [archivedTemplates, setArchivedTemplates] = useState(() => {
        try { return JSON.parse(localStorage.getItem('archivedTemplates')) || []; } catch { return []; }
    });
    const [deletedTemplates, setDeletedTemplates] = useState(() => {
        try { return JSON.parse(localStorage.getItem('deletedAppStoreTemplates')) || []; } catch { return []; }
    });
    const [isAdmin, setIsAdmin] = useState(false);
    
    React.useEffect(() => {
        const user = getCurrentUser();
        if (user?.role?.toUpperCase().includes('ADMIN')) setIsAdmin(true);
    }, []);

    const toggleArchive = (e, templateId) => {
        e.stopPropagation();
        setArchivedTemplates(prev => {
            const next = prev.includes(templateId) ? prev.filter(id => id !== templateId) : [...prev, templateId];
            localStorage.setItem('archivedTemplates', JSON.stringify(next));
            toast.success(prev.includes(templateId) ? 'Template Restored' : 'Template Archived');
            return next;
        });
    };

    const handleDelete = (e, templateId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to permanently delete this template?")) {
            setDeletedTemplates(prev => {
                const next = [...prev, templateId];
                localStorage.setItem('deletedAppStoreTemplates', JSON.stringify(next));
                toast.success('Template Deleted');
                return next;
            });
        }
    };
    const categories = ['All', 'Quality', 'Manufacturing', 'Production', 'MES Production Suite', 'Warehouse', 'Automotive', 'Analytic'];


    const templates = [
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
        }
    ];



    const filteredTemplates = templates.filter(t => {
        if (deletedTemplates.includes(t.id)) return false;
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
        const isArchived = archivedTemplates.includes(t.id);
        if (!isAdmin && isArchived) return false;
        return matchesSearch && matchesCategory;
    });

    const handleInstall = async (templateId) => {
        setInstallingId(templateId);
        const loadingToast = toast.loading('Installing template...');

        try {
            let templateApp;

            if (templateId === 'incoming-inspection') {
                templateApp = createIncomingInspectionTemplate();
                try {
                    const iqcTable = await createTable({
                        name: 'IQC_Inspections',
                        fields: [
                            { name: 'Part_Number', type: 'text' },
                            { name: 'Lot_Number', type: 'text' },
                            { name: 'Supplier', type: 'text' },
                            { name: 'Received_Qty', type: 'number' },
                            { name: 'Meas_Overall_Length', type: 'number' },
                            { name: 'Meas_Outer_Diameter', type: 'number' },
                            { name: 'Meas_Shaft_Extension', type: 'number' },
                            { name: 'Check_Lead_Damage', type: 'text' },
                            { name: 'Overall_Result', type: 'text' },
                            { name: 'Inspector_Name', type: 'text' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });
                    if (iqcTable && iqcTable.id) {
                        const appStr = JSON.stringify(templateApp).replace(/iqc_inspections/g, iqcTable.id);
                        templateApp = JSON.parse(appStr);
                        templateApp.config.appTables = [iqcTable.id];
                    }
                } catch (iqcErr) {
                    console.warn('Could not create IQC table:', iqcErr);
                }
            } else if (templateId === 'weigh-dispense') {
                templateApp = createWeighDispenseTemplate();
                try {
                    const wdTable = await createTable({
                        name: 'WD_Dispense_Logs',
                        fields: [
                            { name: 'Batch_Number', type: 'text' },
                            { name: 'Operator_Name', type: 'text' },
                            { name: 'Weight_mat_plain_white', type: 'number' },
                            { name: 'Weight_mat_calcium_ite', type: 'number' },
                            { name: 'Weight_mat_titanium_ox', type: 'number' },
                            { name: 'Dispense_Status', type: 'text' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });
                    if (wdTable && wdTable.id) {
                        const appStr = JSON.stringify(templateApp).replace(/wd_dispense_logs/g, wdTable.id);
                        templateApp = JSON.parse(appStr);
                        templateApp.config.appTables = [wdTable.id];
                    }
                } catch (wdErr) {
                    console.warn('Could not create WD table:', wdErr);
                }
            } else if (templateId === 'assy-line-production') {
                templateApp = createAssyLineProductionTemplate();
                try {
                    const ordersTable = await createTable({ name: 'Production_Orders', fields: [
                        { name: 'Work_Order_ID', type: 'text' }, { name: 'Line_Assy', type: 'text' },
                        { name: 'Shift', type: 'text' }, { name: 'Machine_ID', type: 'text' },
                        { name: 'Article', type: 'text' }, { name: 'Target_Qty', type: 'number' },
                        { name: 'Parts_Made', type: 'number' }, { name: 'Defects', type: 'number' },
                        { name: 'Quality_Pct', type: 'number' }, { name: 'Status_Produksi', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'Linked_Counts', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_Order' },
                        { name: 'Linked_Downtime', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_Order' },
                        { name: 'Linked_Notes', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_Order' }
                    ] });
                    const countsTable = await createTable({ name: 'Production_Counts', fields: [
                        { name: 'Work_Order_ID', type: 'text' }, { name: 'Count_Interval', type: 'text' },
                        { name: 'Interval_Parts', type: 'number' }, { name: 'Interval_Defects', type: 'number' },
                        { name: 'Operator', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_Order', type: 'linked_record', link_table_id: ordersTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Counts' }
                    ] });
                    const downtimeTable = await createTable({ name: 'Downtime_Events', fields: [
                        { name: 'Work_Order_ID', type: 'text' }, { name: 'Downtime_Reason', type: 'text' },
                        { name: 'Downtime_Minutes', type: 'number' }, { name: 'Fault_Code', type: 'text' },
                        { name: 'Machine_ID', type: 'text' }, { name: 'Operator', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_Order', type: 'linked_record', link_table_id: ordersTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Downtime' }
                    ] });
                    const notesTable = await createTable({ name: 'Production_Notes', fields: [
                        { name: 'Work_Order_ID', type: 'text' }, { name: 'Note_Text', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_Order', type: 'linked_record', link_table_id: ordersTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Notes' }
                    ] });
                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (ordersTable?.id) { appStr = appStr.replace(/tbl_prod_orders/g, ordersTable.id); tIds.push(ordersTable.id); }
                    if (countsTable?.id) { appStr = appStr.replace(/tbl_prod_counts/g, countsTable.id); tIds.push(countsTable.id); }
                    if (downtimeTable?.id) { appStr = appStr.replace(/tbl_prod_downtime/g, downtimeTable.id); tIds.push(downtimeTable.id); }
                    if (notesTable?.id) { appStr = appStr.replace(/tbl_prod_notes/g, notesTable.id); tIds.push(notesTable.id); }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (prodErr) {
                    console.warn('Could not create production tables:', prodErr);
                }
            } else if (templateId === 'inventory-alert') {
                templateApp = createInventoryAlertTemplate();
                try {
                    // 1. Suppliers table
                    const supTable = await createTable({ name: 'Inventory_Suppliers', fields: [
                        { name: 'Supplier_Name', type: 'text' }, { name: 'Contact', type: 'text' },
                        { name: 'Lead_Days', type: 'number' }, { name: 'Rating', type: 'text' },
                        { name: 'Linked_Materials', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Supplier' }
                    ] });
                    // 2. Materials table with formula fields
                    const matTable = await createTable({ name: 'Inventory_Materials', fields: [
                        { name: 'Material_Name', type: 'text' }, { name: 'Item_Number', type: 'text' },
                        { name: 'Current_Qty', type: 'number' }, { name: 'Reorder_Point', type: 'number' },
                        { name: 'Unit_Cost', type: 'number' }, { name: 'Location', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Unit', type: 'text' },
                        { name: 'Stock_Value', type: 'formula', formulaExpression: 'Current_Qty * Unit_Cost' },
                        { name: 'Reorder_Gap', type: 'formula', formulaExpression: 'Current_Qty - Reorder_Point' },
                        { name: 'Supplier', type: 'linked_record', link_table_id: supTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Materials' },
                        { name: 'Linked_Transactions', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_Material' },
                        { name: 'Linked_Alerts', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_Material' }
                    ] });
                    // 3. Transactions table
                    const txTable = await createTable({ name: 'Inventory_Transactions', fields: [
                        { name: 'Order_ID', type: 'text' }, { name: 'Item_Number', type: 'text' },
                        { name: 'Material_Name', type: 'text' }, { name: 'Qty', type: 'number' },
                        { name: 'Type', type: 'text' }, { name: 'Unit_Cost', type: 'number' },
                        { name: 'Line_Value', type: 'formula', formulaExpression: 'Qty * Unit_Cost' },
                        { name: 'Operator', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_Material', type: 'linked_record', link_table_id: matTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Transactions' }
                    ] });
                    // 4. Alerts table
                    const alertTable = await createTable({ name: 'Inventory_Alerts', fields: [
                        { name: 'Material_Name', type: 'text' }, { name: 'Item_Number', type: 'text' },
                        { name: 'Current_Qty', type: 'number' }, { name: 'Reorder_Point', type: 'number' },
                        { name: 'Alert_Type', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_Material', type: 'linked_record', link_table_id: matTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Alerts' }
                    ] });
                    // Replace placeholders with real UUIDs
                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (matTable?.id) { appStr = appStr.replace(/tbl_inv_materials/g, matTable.id); tIds.push(matTable.id); }
                    if (txTable?.id) { appStr = appStr.replace(/tbl_inv_transactions/g, txTable.id); tIds.push(txTable.id); }
                    if (alertTable?.id) { appStr = appStr.replace(/tbl_inv_alerts/g, alertTable.id); tIds.push(alertTable.id); }
                    if (supTable?.id) { appStr = appStr.replace(/tbl_inv_suppliers/g, supTable.id); tIds.push(supTable.id); }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                    // Register Automations & Functions in localStorage
                    try {
                        const existingAutos = JSON.parse(localStorage.getItem('mes_automations') || '[]');
                        const existingFns = JSON.parse(localStorage.getItem('mes_functions') || '[]');
                        const newAutos = (templateApp.config.automations || []).map(a => ({ ...a, active: true }));
                        const newFns = (templateApp.config.functions || []).map(f => ({ ...f, active: true }));
                        localStorage.setItem('mes_automations', JSON.stringify([...existingAutos, ...newAutos]));
                        localStorage.setItem('mes_functions', JSON.stringify([...existingFns, ...newFns]));
                        console.log('[AppStore] Registered', newAutos.length, 'automations and', newFns.length, 'functions');
                    } catch (regErr) { console.warn('Could not register automations:', regErr); }
                } catch (invErr) {
                    console.warn('Could not create inventory tables:', invErr);
                }
            } else if (templateId === 'car-workshop') {
                templateApp = createCarWorkshopTemplate();
                try {
                    const woTable = await createTable({ name: 'Workshop_Orders', fields: [
                        { name: 'License_Plate', type: 'text' }, { name: 'Vehicle_Make', type: 'text' },
                        { name: 'Vehicle_Model', type: 'text' }, { name: 'Vehicle_Year', type: 'text' },
                        { name: 'Mileage', type: 'number' }, { name: 'Customer_Name', type: 'text' },
                        { name: 'Customer_Phone', type: 'text' }, { name: 'Technician', type: 'text' },
                        { name: 'Bay_Number', type: 'text' }, { name: 'Priority', type: 'text' },
                        { name: 'WO_Status', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'Linked_Services', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_WO' },
                        { name: 'Linked_Inspections', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_WO' },
                        { name: 'Linked_Parts', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_WO' }
                    ] });
                    const svcTable = await createTable({ name: 'Service_Items', fields: [
                        { name: 'Service_Type', type: 'text' }, { name: 'Description', type: 'text' },
                        { name: 'Labor_Hours', type: 'number' }, { name: 'Labor_Rate', type: 'number' },
                        { name: 'Labor_Cost', type: 'formula', formulaExpression: 'Labor_Hours * Labor_Rate' },
                        { name: 'Technician', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_WO', type: 'linked_record', link_table_id: woTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Services' }
                    ] });
                    const inspTable = await createTable({ name: 'Vehicle_Inspections', fields: [
                        { name: 'Engine', type: 'text' }, { name: 'Brakes', type: 'text' },
                        { name: 'Tires', type: 'text' }, { name: 'Fluids', type: 'text' },
                        { name: 'Lights', type: 'text' }, { name: 'Suspension', type: 'text' },
                        { name: 'Notes', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_WO', type: 'linked_record', link_table_id: woTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Inspections' }
                    ] });
                    const partsTable = await createTable({ name: 'Parts_Used', fields: [
                        { name: 'Part_Name', type: 'text' }, { name: 'Qty', type: 'number' },
                        { name: 'Unit_Price', type: 'number' },
                        { name: 'Line_Total', type: 'formula', formulaExpression: 'Qty * Unit_Price' },
                        { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_WO', type: 'linked_record', link_table_id: woTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Parts' }
                    ] });
                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (woTable?.id) { appStr = appStr.replace(/tbl_ws_orders/g, woTable.id); tIds.push(woTable.id); }
                    if (svcTable?.id) { appStr = appStr.replace(/tbl_ws_services/g, svcTable.id); tIds.push(svcTable.id); }
                    if (inspTable?.id) { appStr = appStr.replace(/tbl_ws_inspections/g, inspTable.id); tIds.push(inspTable.id); }
                    if (partsTable?.id) { appStr = appStr.replace(/tbl_ws_parts/g, partsTable.id); tIds.push(partsTable.id); }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                    try {
                        const ea = JSON.parse(localStorage.getItem('mes_automations') || '[]');
                        const ef = JSON.parse(localStorage.getItem('mes_functions') || '[]');
                        localStorage.setItem('mes_automations', JSON.stringify([...ea, ...(templateApp.config.automations||[]).map(a=>({...a,active:true}))]));
                        localStorage.setItem('mes_functions', JSON.stringify([...ef, ...(templateApp.config.functions||[]).map(f=>({...f,active:true}))]));
                    } catch(e) {}
                } catch (wsErr) {
                    console.warn('Could not create workshop tables:', wsErr);
                }
            } else if (templateId === 'andon-system') {
                templateApp = createAndonSystemTemplate();
                try {
                    const eventTable = await createTable({ name: 'Andon_Events', fields: [
                        { name: 'Station_ID', type: 'text' }, { name: 'Alert_Category', type: 'text' },
                        { name: 'Description', type: 'text' }, { name: 'Severity', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Raised_By', type: 'text' },
                        { name: 'Timestamp', type: 'datetime' },
                        { name: 'Linked_Resolutions', type: 'linked_record', link_type: 'one_to_one', reverse_link_name: 'Parent_Event' }
                    ] });
                    const resTable = await createTable({ name: 'Andon_Resolutions', fields: [
                        { name: 'Root_Cause', type: 'text' }, { name: 'Action_Taken', type: 'text' },
                        { name: 'Downtime_Mins', type: 'number' }, { name: 'Responder', type: 'text' },
                        { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_Event', type: 'linked_record', link_table_id: eventTable?.id, link_type: 'one_to_one', reverse_link_name: 'Linked_Resolutions' }
                    ] });
                    
                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (eventTable?.id) { appStr = appStr.replace(/tbl_andon_events/g, eventTable.id); tIds.push(eventTable.id); }
                    if (resTable?.id) { appStr = appStr.replace(/tbl_andon_resolutions/g, resTable.id); tIds.push(resTable.id); }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                    
                    try {
                        const ea = JSON.parse(localStorage.getItem('mes_automations') || '[]');
                        localStorage.setItem('mes_automations', JSON.stringify([...ea, ...(templateApp.config.automations||[]).map(a=>({...a,active:true}))]));
                    } catch(e) {}
                } catch (andonErr) {
                    console.warn('Could not create andon tables:', andonErr);
                }
            } else if (templateId === 'picklist') {
                templateApp = createPicklistTemplate();
                try {
                    const itemMasterTable = await createTable({ name: 'Item_Master', fields: [
                        { name: 'Item_Name', type: 'text' }, { name: 'Description', type: 'text' },
                        { name: 'UOM', type: 'text' }, { name: 'Type', type: 'text' }
                    ] });
                    const orderMatTable = await createTable({ name: 'Order_Materials', fields: [
                        { name: 'Product_Name', type: 'text' }, { name: 'Type', type: 'text' },
                        { name: 'QTY_Required', type: 'number' }, { name: 'QTY_Complete', type: 'number' },
                        { name: 'Due_Date', type: 'datetime' }, { name: 'Status', type: 'text' },
                        { name: 'Location', type: 'text' }
                    ] });
                    const bomTable = await createTable({ name: 'Manufacturing_BOM', fields: [
                        { name: 'Parent_Item', type: 'text' }, { name: 'Child_Item', type: 'text' },
                        { name: 'Child_Item_QTY', type: 'number' }
                    ] });

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (itemMasterTable?.id) { appStr = appStr.replace(/tbl_item_master/g, itemMasterTable.id); tIds.push(itemMasterTable.id); }
                    if (orderMatTable?.id) { appStr = appStr.replace(/tbl_order_materials/g, orderMatTable.id); tIds.push(orderMatTable.id); }
                    if (bomTable?.id) { appStr = appStr.replace(/tbl_manufacturing_bom/g, bomTable.id); tIds.push(bomTable.id); }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (pickErr) {
                    console.warn('Could not create picklist tables:', pickErr);
                }
            } else if (templateId === 'defect-tracking') {
                templateApp = createDefectTrackingTemplate();
                try {
                    const defectTable = await createTable({ name: 'Defect_Events', fields: [
                        { name: 'Material_ID', type: 'text' }, { name: 'Reported_Date', type: 'datetime' },
                        { name: 'Reason', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Description', type: 'text' }, { name: 'Quantity', type: 'number' },
                        { name: 'Location_Detected', type: 'text' }, { name: 'Reported_By', type: 'text' },
                        { name: 'Severity', type: 'text' }, { name: 'Rework_Station', type: 'text' }
                    ] });

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (defectTable?.id) { appStr = appStr.replace(/tbl_defect_events/g, defectTable.id); tIds.push(defectTable.id); }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (defectErr) {
                    console.warn('Could not create defect tables:', defectErr);
                }
            } else if (templateId === 'equipment-management') {
                templateApp = createEquipmentManagementTemplate();
                try {
                    const assetTable = await createTable({ name: 'Asset', fields: [
                        { name: 'ID', type: 'text' }, { name: 'Name', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Type', type: 'text' },
                        { name: 'Tare_Weight', type: 'number' }, { name: 'Last_Calibration', type: 'datetime' },
                        { name: 'Description', type: 'text' }
                    ] });
                    const historyTable = await createTable({ name: 'Equipment_Status_History', fields: [
                        { name: 'Equipment_ID', type: 'text' }, { name: 'Activity_performed_by', type: 'text' },
                        { name: 'Performed_Activity', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Batch_ID', type: 'text' }, { name: 'Comment', type: 'text' },
                        { name: 'Date', type: 'datetime' }
                    ] });

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (assetTable?.id) { appStr = appStr.replace(/tbl_asset/g, assetTable.id); tIds.push(assetTable.id); }
                    if (historyTable?.id) { appStr = appStr.replace(/tbl_eq_history/g, historyTable.id); tIds.push(historyTable.id); }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (eqmErr) {
                    console.warn('Could not create equipment tables:', eqmErr);
                }
            } else if (templateId === 'kanban-suite') {
                templateApp = createKanbanAppSuiteTemplate();
                try {
                    const kanbanCardsTable = await createTable({ name: 'Kanban_Cards', fields: [
                        { name: 'Kanban_ID', type: 'text' }, { name: 'Part_Number', type: 'text' },
                        { name: 'Part_Description', type: 'text' }, { name: 'Consuming_Location', type: 'text' },
                        { name: 'Supply_Location', type: 'text' }, { name: 'QTY', type: 'number' },
                        { name: 'Status', type: 'text' }, { name: 'Active', type: 'text' },
                        { name: 'Image', type: 'text' }
                    ] });
                    const matReqTable = await createTable({ name: 'Material_Requests', fields: [
                        { name: 'Kanban_ID', type: 'text' }, { name: 'Part_Number', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Requested_Time', type: 'datetime' }
                    ] });

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (kanbanCardsTable?.id) { appStr = appStr.replace(/tbl_kanban_cards/g, kanbanCardsTable.id); tIds.push(kanbanCardsTable.id); }
                    if (matReqTable?.id) { appStr = appStr.replace(/tbl_material_requests/g, matReqTable.id); tIds.push(matReqTable.id); }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (kanbanErr) {
                    console.warn('Could not create kanban tables:', kanbanErr);
                }
            } else if (templateId === 'lean-dashboard') {
                templateApp = createLeanDashboardTemplate();
                try {
                    const leanTable = await createTable({ name: 'tbl_lean_data', fields: [
                        { name: 'Month', type: 'datetime' },
                        { name: 'Location', type: 'text' },
                        { name: 'Incidents_P', type: 'text' },
                        { name: 'Incidents_S', type: 'text' },
                        { name: 'Incidents_Q', type: 'text' },
                        { name: 'Incidents_D', type: 'text' },
                        { name: 'Incidents_C', type: 'text' }
                    ]});
                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (leanTable?.id) { appStr = appStr.replace(/tbl_lean_data/g, leanTable.id); tIds.push(leanTable.id); }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (leanErr) {
                    console.warn('Could not create lean table:', leanErr);
                }
            } else if (templateId === 'order-management') {
                templateApp = createOrderManagementTemplate();
                try {
                    const woTable = await createTable({ name: 'Work_Orders', fields: [
                        { name: 'Operator', type: 'text' }, { name: 'Parent_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Location', type: 'text' }, { name: 'QTY_Required', type: 'number' },
                        { name: 'QTY_Complete', type: 'number' }, { name: 'QTY_Scrap', type: 'number' },
                        { name: 'Due_Date', type: 'datetime' }, { name: 'Start_Date', type: 'datetime' },
                        { name: 'Complete_Date', type: 'datetime' }, { name: 'Customer_ID', type: 'text' },
                        { name: 'Linked_History', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_WO' },
                        { name: 'Linked_Notes', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_WO' },
                        { name: 'Linked_Inspections', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_WO' }
                    ]});
                    const bomTable = await createTable({ name: 'Bill_Of_Materials', fields: [
                        { name: 'Parent_Material_Definition_ID', type: 'text' }, { name: 'Parent_Material_Description', type: 'text' },
                        { name: 'Component_Material_Definition_ID', type: 'text' }, { name: 'Component_Material_Description', type: 'text' },
                        { name: 'Component_Quantity', type: 'number' }, { name: 'Component_UoM', type: 'text' },
                        { name: 'Point_of_Use', type: 'text' }
                    ]});
                    const shTable = await createTable({ name: 'Station_Activity_History', fields: [
                        { name: 'Station_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Start_Date_Time', type: 'datetime' }, { name: 'End_Date_Time', type: 'datetime' },
                        { name: 'Duration', type: 'number' }, { name: 'Material_Definition_ID', type: 'text' },
                        { name: 'Target_Quantity', type: 'number' }, { name: 'Actual_Quantity', type: 'number' },
                        { name: 'Defects', type: 'number' }, { name: 'Downtime_reason', type: 'text' },
                        { name: 'Comments', type: 'text' }, { name: 'Unit_ID', type: 'text' },
                        { name: 'Parent_WO', type: 'linked_record', link_table_id: woTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_History' }
                    ]});
                    const notesTable = await createTable({ name: 'Notes_And_Comments', fields: [
                        { name: 'Reference_ID', type: 'text' }, { name: 'Location', type: 'text' },
                        { name: 'Notes', type: 'text' }, { name: 'Sender', type: 'text' },
                        { name: 'Updated_by', type: 'text' }, { name: 'Recipient', type: 'text' },
                        { name: 'Notes_Photo', type: 'text' },
                        { name: 'Parent_WO', type: 'linked_record', link_table_id: woTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Notes' }
                    ]});
                    const irTable = await createTable({ name: 'Inspection_Results', fields: [
                        { name: 'Unit_ID', type: 'text' }, { name: 'Material_Definition_ID', type: 'text' },
                        { name: 'Type', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Procedure', type: 'text' }, { name: 'Location', type: 'text' },
                        { name: 'Photo', type: 'text' }, { name: 'Passed', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Text_Value', type: 'text' },
                        { name: 'Measured', type: 'number' }, { name: 'Target', type: 'number' },
                        { name: 'LSL', type: 'number' }, { name: 'USL', type: 'number' },
                        { name: 'Parent_WO', type: 'linked_record', link_table_id: woTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Inspections' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (woTable?.id) { appStr = appStr.replace(/tbl_om_work_orders/g, woTable.id); tIds.push(woTable.id); }
                    if (bomTable?.id) { appStr = appStr.replace(/tbl_om_bom/g, bomTable.id); tIds.push(bomTable.id); }
                    if (shTable?.id) { appStr = appStr.replace(/tbl_om_station_history/g, shTable.id); tIds.push(shTable.id); }
                    if (notesTable?.id) { appStr = appStr.replace(/tbl_om_notes/g, notesTable.id); tIds.push(notesTable.id); }
                    if (irTable?.id) { appStr = appStr.replace(/tbl_om_inspection_results/g, irTable.id); tIds.push(irTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (omErr) {
                    console.warn('Could not create order management tables:', omErr);
                }
            } else if (templateId === 'review-and-ship') {
                templateApp = createReviewAndShipTemplate();
                try {
                    const woTable = await createTable({ name: 'Work_Orders', fields: [
                        { name: 'Operator', type: 'text' }, { name: 'Parent_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Location', type: 'text' }, { name: 'QTY_Required', type: 'number' },
                        { name: 'QTY_Complete', type: 'number' }, { name: 'QTY_Scrap', type: 'number' },
                        { name: 'Due_Date', type: 'datetime' }, { name: 'Start_Date', type: 'datetime' },
                        { name: 'Complete_Date', type: 'datetime' }, { name: 'Customer_ID', type: 'text' },
                        { name: 'Linked_History', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_WO' },
                        { name: 'Linked_Notes', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_WO' },
                        { name: 'Linked_Inspections', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_WO' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (woTable?.id) { appStr = appStr.replace(/tbl_rs_work_orders/g, woTable.id); tIds.push(woTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (rsErr) {
                    console.warn('Could not create review and ship tables:', rsErr);
                }
            } else if (templateId === 'order-execution') {
                templateApp = createOrderExecutionTemplate();
                try {
                    const woTable = await createTable({ name: 'Work_Orders', fields: [
                        { name: 'Operator', type: 'text' }, { name: 'Parent_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Location', type: 'text' }, { name: 'QTY_Required', type: 'number' },
                        { name: 'QTY_Complete', type: 'number' }, { name: 'QTY_Scrap', type: 'number' },
                        { name: 'Due_Date', type: 'datetime' }, { name: 'Start_Date', type: 'datetime' },
                        { name: 'Complete_Date', type: 'datetime' }, { name: 'Customer_ID', type: 'text' }
                    ]});
                    const unitsTable = await createTable({ name: 'Units', fields: [
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Material_Definition_Type', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Location', type: 'text' },
                        { name: 'QTY', type: 'number' }, { name: 'Unit_of_Measure', type: 'text' },
                        { name: 'Work_Order_ID', type: 'text' }, { name: 'Completed_Date', type: 'datetime' },
                        { name: 'Produced_By', type: 'text' }, { name: 'Parent_Unit_ID', type: 'text' }
                    ]});
                    const shTable = await createTable({ name: 'Station_Activity_History', fields: [
                        { name: 'Station_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Start_Date_Time', type: 'datetime' }, { name: 'End_Date_Time', type: 'datetime' },
                        { name: 'Duration', type: 'number' }, { name: 'Material_Definition_ID', type: 'text' },
                        { name: 'Target_Quantity', type: 'number' }, { name: 'Actual_Quantity', type: 'number' },
                        { name: 'Defects', type: 'number' }, { name: 'Downtime_reason', type: 'text' },
                        { name: 'Comments', type: 'text' }, { name: 'Unit_ID', type: 'text' }, { name: 'Work_Order_ID', type: 'text' }
                    ]});
                    const stationsTable = await createTable({ name: 'Stations', fields: [
                        { name: 'Status', type: 'text' }, { name: 'Status_Color', type: 'text' },
                        { name: 'Status_Detail', type: 'text' }, { name: 'Process_Cell', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Work_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (woTable?.id) { appStr = appStr.replace(/tbl_oe_work_orders/g, woTable.id); tIds.push(woTable.id); }
                    if (unitsTable?.id) { appStr = appStr.replace(/tbl_oe_units/g, unitsTable.id); tIds.push(unitsTable.id); }
                    if (shTable?.id) { appStr = appStr.replace(/tbl_oe_station_history/g, shTable.id); tIds.push(shTable.id); }
                    if (stationsTable?.id) { appStr = appStr.replace(/tbl_oe_stations/g, stationsTable.id); tIds.push(stationsTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (oeErr) {
                    console.warn('Could not create order execution tables:', oeErr);
                }
            } else if (templateId === 'andon-management') {
                templateApp = createAndonManagementTemplate();
                try {
                    const stationsTable = await createTable({ name: 'Stations', fields: [
                        { name: 'Status', type: 'text' }, { name: 'Status_Color', type: 'text' },
                        { name: 'Status_Detail', type: 'text' }, { name: 'Process_Cell', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Work_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }
                    ]});
                    const actionsTable = await createTable({ name: 'Actions', fields: [
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Title', type: 'text' },
                        { name: 'Location', type: 'text' }, { name: 'Severity', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Work_Order_ID', type: 'text' },
                        { name: 'Unit_ID', type: 'text' }, { name: 'Comments', type: 'text' },
                        { name: 'Photo', type: 'text' }, { name: 'Reported_by', type: 'text' },
                        { name: 'Owner', type: 'text' }, { name: 'Type', type: 'text' },
                        { name: 'Actions_Taken', type: 'text' }, { name: 'Due_date', type: 'datetime' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (stationsTable?.id) { appStr = appStr.replace(/tbl_am_stations/g, stationsTable.id); tIds.push(stationsTable.id); }
                    if (actionsTable?.id) { appStr = appStr.replace(/tbl_am_actions/g, actionsTable.id); tIds.push(actionsTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (amErr) {
                    console.warn('Could not create andon management tables:', amErr);
                }
            } else if (templateId === 'andon-terminal') {
                templateApp = createAndonTerminalTemplate();
                try {
                    const woTable = await createTable({ name: 'Work_Orders', fields: [
                        { name: 'Operator', type: 'text' }, { name: 'Parent_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Location', type: 'text' }, { name: 'QTY_Required', type: 'number' },
                        { name: 'QTY_Complete', type: 'number' }, { name: 'QTY_Scrap', type: 'number' },
                        { name: 'Due_Date', type: 'datetime' }, { name: 'Start_Date', type: 'datetime' },
                        { name: 'Complete_Date', type: 'datetime' }, { name: 'Customer_ID', type: 'text' }
                    ]});
                    const stationsTable = await createTable({ name: 'Stations', fields: [
                        { name: 'Status', type: 'text' }, { name: 'Status_Color', type: 'text' },
                        { name: 'Status_Detail', type: 'text' }, { name: 'Process_Cell', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Work_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }
                    ]});
                    const actionsTable = await createTable({ name: 'Actions', fields: [
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Title', type: 'text' },
                        { name: 'Location', type: 'text' }, { name: 'Severity', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Work_Order_ID', type: 'text' },
                        { name: 'Unit_ID', type: 'text' }, { name: 'Comments', type: 'text' },
                        { name: 'Photo', type: 'text' }, { name: 'Reported_by', type: 'text' },
                        { name: 'Owner', type: 'text' }, { name: 'Type', type: 'text' },
                        { name: 'Actions_Taken', type: 'text' }, { name: 'Due_date', type: 'datetime' }
                    ]});
                    const shTable = await createTable({ name: 'Station_Activity_History', fields: [
                        { name: 'Station_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Start_Date_Time', type: 'datetime' }, { name: 'End_Date_Time', type: 'datetime' },
                        { name: 'Duration', type: 'number' }, { name: 'Material_Definition_ID', type: 'text' },
                        { name: 'Target_Quantity', type: 'number' }, { name: 'Actual_Quantity', type: 'number' },
                        { name: 'Defects', type: 'number' }, { name: 'Downtime_reason', type: 'text' },
                        { name: 'Comments', type: 'text' }, { name: 'Unit_ID', type: 'text' }, { name: 'Work_Order_ID', type: 'text' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (woTable?.id) { appStr = appStr.replace(/tbl_at_work_orders/g, woTable.id); tIds.push(woTable.id); }
                    if (stationsTable?.id) { appStr = appStr.replace(/tbl_at_stations/g, stationsTable.id); tIds.push(stationsTable.id); }
                    if (actionsTable?.id) { appStr = appStr.replace(/tbl_at_actions/g, actionsTable.id); tIds.push(actionsTable.id); }
                    if (shTable?.id) { appStr = appStr.replace(/tbl_at_station_history/g, shTable.id); tIds.push(shTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (atErr) {
                    console.warn('Could not create andon terminal tables:', atErr);
                }
            } else if (templateId === 'performance-visibility-dashboard') {
                templateApp = createPerformanceVisibilityDashboardTemplate();
                try {
                    const stationsTable = await createTable({ name: 'Stations', fields: [
                        { name: 'Status', type: 'text' }, { name: 'Status_Color', type: 'text' },
                        { name: 'Status_Detail', type: 'text' }, { name: 'Process_Cell', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Work_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }
                    ]});
                    const shTable = await createTable({ name: 'Station_Activity_History', fields: [
                        { name: 'Station_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Start_Date_Time', type: 'datetime' }, { name: 'End_Date_Time', type: 'datetime' },
                        { name: 'Duration', type: 'number' }, { name: 'Material_Definition_ID', type: 'text' },
                        { name: 'Target_Quantity', type: 'number' }, { name: 'Actual_Quantity', type: 'number' },
                        { name: 'Defects', type: 'number' }, { name: 'Downtime_reason', type: 'text' },
                        { name: 'Comments', type: 'text' }, { name: 'Unit_ID', type: 'text' }, { name: 'Work_Order_ID', type: 'text' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (stationsTable?.id) { appStr = appStr.replace(/tbl_pvd_stations/g, stationsTable.id); tIds.push(stationsTable.id); }
                    if (shTable?.id) { appStr = appStr.replace(/tbl_pvd_station_history/g, shTable.id); tIds.push(shTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (pvdErr) {
                    console.warn('Could not create PVD tables:', pvdErr);
                }
            } else {
                toast.error('Template not found', { id: loadingToast });
                return;
            }

            const { id, ...templateData } = templateApp;
            const savedApp = await saveFrontlineApp({
                ...templateData,
                is_published: false,
                approval_status: 'DRAFT',
                updated_at: new Date().toISOString()
            });

            toast.success(`${templateApp.name} installed successfully!`, { id: loadingToast });

            // Navigate to builder for the new app
            setTimeout(() => {
                navigate(`/builder?id=${savedApp.id}`);
            }, 1000);

        } catch (err) {
            console.error('Installation failed:', err);
            toast.error('Installation failed: ' + err.message, { id: loadingToast });
        } finally {
            setInstallingId(null);
        }
    };

    return (
        <div style={{ height: '100%', backgroundColor: '#f8fafc', overflowY: 'auto', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
            <Toaster position="top-right" />

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* HEADER SECTION */}
                <div style={{ marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '8px' }}>
                            <ShoppingBag size={16} /> Mavi App Store
                        </div>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>Template Gallery</h1>
                        <p style={{ marginTop: '10px', fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', lineHeight: 1.6 }}>
                            Instantly deploy enterprise-ready applications for your shop floor. Built-in logic, tables, and analytics.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                    </div>
                </div>

                {/* CATEGORIES */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '10px 24px', borderRadius: '100px',
                                backgroundColor: activeCategory === cat ? '#0f172a' : 'white',
                                color: activeCategory === cat ? 'white' : '#64748b',
                                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                                transition: 'all 0.2s', boxShadow: activeCategory === cat ? '0 4px 12px rgba(15,23,42,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                                whiteSpace: 'nowrap', border: activeCategory === cat ? 'none' : '1px solid #e2e8f0'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* TEMPLATE GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '32px' }}>
                    {filteredTemplates.map(t => (
                        <div
                            key={t.id}
                            style={{
                                backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0',
                                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                cursor: 'default'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                            }}
                        >
                            {/* Card Top: Gradient & Icon */}
                            <div style={{ height: '140px', background: t.bg, padding: '24px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '18px', backgroundColor: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.08)'
                                }}>
                                    {t.icon}
                                </div>
                                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '6px' }}>
                                    {isAdmin && (
                                        <>
                                            <button 
                                                onClick={(e) => toggleArchive(e, t.id)}
                                                style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: archivedTemplates.includes(t.id) ? '#ef4444' : 'rgba(255,255,255,0.4)', border: 'none', backdropFilter: 'blur(8px)', fontSize: '0.65rem', fontWeight: 800, color: archivedTemplates.includes(t.id) ? 'white' : '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <X size={12} /> {archivedTemplates.includes(t.id) ? 'RESTORE' : 'ARCHIVE'}
                                            </button>
                                            <button 
                                                onClick={(e) => handleDelete(e, t.id)}
                                                style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#ef4444', border: 'none', backdropFilter: 'blur(8px)', fontSize: '0.65rem', fontWeight: 800, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Trash2 size={12} /> DELETE
                                            </button>
                                        </>
                                    )}
                                    <div style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', fontSize: '0.65rem', fontWeight: 800, color: '#0f172a' }}>
                                        {t.category.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{t.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>
                                        <Star size={14} fill="#f59e0b" /> {t.rating}
                                    </div>
                                </div>

                                <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, height: '42px', overflow: 'hidden' }}>
                                    {t.description}
                                </p>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                                    {t.features.map(f => (
                                        <div key={f} style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle2 size={12} color="#10b981" /> {f}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => { setSelectedGuide(t); setModalTab('guide'); }}
                                    style={{
                                        width: '100%', marginBottom: '20px', padding: '10px', borderRadius: '12px',
                                        border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569',
                                        fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                >
                                    <BookOpen size={14} /> View Template Guide
                                </button>


                                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                                        {t.installs} installs
                                    </div>
                                    <button
                                        onClick={() => handleInstall(t.id)}
                                        disabled={installingId !== null}
                                        style={{
                                            padding: '10px 20px', borderRadius: '12px', border: 'none',
                                            backgroundColor: t.accent, color: 'white', fontWeight: 800,
                                            fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                            transition: 'all 0.2s', boxShadow: `0 4px 12px ${t.accent}40`,
                                            opacity: installingId !== null ? 0.7 : 1
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                                        onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                                    >
                                        {installingId === t.id ? (
                                            <>Installing...</>
                                        ) : (
                                            <>Install <Rocket size={14} /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* EMPTY STATE */}
                {filteredTemplates.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>No templates found</h3>
                        <p style={{ color: '#64748b' }}>Try adjusting your search or category filters.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                            style={{ marginTop: '20px', padding: '10px 24px', backgroundColor: 'transparent', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Reset Filters
                        </button>
                    </div>
                )}

                {/* BOTTOM CTA */}
                <div style={{ marginTop: '80px', padding: '60px', borderRadius: '32px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' }} />
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                        <Award size={48} color="#f59e0b" style={{ marginBottom: '20px' }} />
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '16px' }}>Need a custom solution?</h2>
                        <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '32px' }}>
                            Our experts can help you build specialized workflows tailored to your unique manufacturing processes.
                        </p>
                        <button
                            onClick={() => navigate('/builder')}
                            style={{ padding: '14px 32px', borderRadius: '14px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)' }}
                        >
                            Open App Builder
                        </button>
                    </div>
                </div>
            </div>

            {/* GUIDE MODAL */}
            {selectedGuide && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '700px', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'modalSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selectedGuide.bg }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                    {selectedGuide.icon}
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{selectedGuide.name} Guide</h2>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{selectedGuide.category} Template</div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedGuide(null)} style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.8)', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                            <button
                                onClick={() => setModalTab('guide')}
                                style={{
                                    flex: 1, padding: '16px', border: 'none',
                                    backgroundColor: modalTab === 'guide' ? 'white' : 'transparent',
                                    borderBottom: modalTab === 'guide' ? `3px solid ${selectedGuide.accent}` : 'none',
                                    color: modalTab === 'guide' ? selectedGuide.accent : '#64748b',
                                    fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <BookOpen size={18} /> Technical Guide
                            </button>
                            {selectedGuide.previewImage && (
                                <button
                                    onClick={() => setModalTab('preview')}
                                    style={{
                                        flex: 1, padding: '16px', border: 'none',
                                        backgroundColor: modalTab === 'preview' ? 'white' : 'transparent',
                                        borderBottom: modalTab === 'preview' ? `3px solid ${selectedGuide.accent}` : 'none',
                                        color: modalTab === 'preview' ? selectedGuide.accent : '#64748b',
                                        fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <ImageIcon size={18} /> Visual Preview
                                </button>
                            )}
                        </div>

                        <div style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
                            {modalTab === 'guide' ? (
                                <div style={{ display: 'grid', gap: '28px' }}>

                                    <section>
                                        <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <PlayCircle size={18} color="#2563eb" /> Operation Workflow
                                        </h3>
                                        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                                            {selectedGuide.guide?.operation}
                                        </div>
                                    </section>

                                    <section>
                                        <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <List size={18} color="#10b981" /> Step-by-Step Workflow
                                        </h3>
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                            {selectedGuide.guide?.steps?.map((step, index) => (
                                                <div key={step.name} style={{ display: 'flex', gap: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{step.name}</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>{step.description}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <section>
                                            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Cpu size={18} color="#8b5cf6" /> Key Widgets
                                            </h3>
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', display: 'grid', gap: '6px' }}>
                                                {selectedGuide.guide?.widgets.map(w => <li key={w}>{w}</li>)}
                                            </ul>
                                        </section>
                                        <section>
                                            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <List size={18} color="#10b981" /> App Components
                                            </h3>
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', display: 'grid', gap: '6px' }}>
                                                {selectedGuide.guide?.components.map(c => <li key={c}>{c}</li>)}
                                            </ul>
                                        </section>
                                    </div>

                                    <section>
                                        <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Database size={18} color="#0ea5e9" /> Database Architecture
                                        </h3>
                                        <div style={{ display: 'grid', gap: '10px' }}>
                                            {selectedGuide.guide?.tables.map(table => (
                                                <div key={table.name} style={{ backgroundColor: '#f0f9ff', border: '1px solid #e0f2fe', padding: '12px 16px', borderRadius: '12px' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0369a1', fontFamily: 'monospace', marginBottom: '4px' }}>{table.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#0369a1', opacity: 0.8 }}>{table.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section>
                                        <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Zap size={18} color="#facc15" /> Automation Triggers
                                        </h3>
                                        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '16px', borderRadius: '16px' }}>
                                            <div style={{ display: 'grid', gap: '12px' }}>
                                                {selectedGuide.guide?.triggers.map(trigger => (
                                                    <div key={trigger.event} style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
                                                        <div style={{ fontWeight: 800, color: '#92400e', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '4px', height: 'fit-content', whiteSpace: 'nowrap' }}>
                                                            {trigger.event}
                                                        </div>
                                                        <div style={{ color: '#92400e', lineHeight: 1.4 }}>{trigger.function}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>


                                    <section>
                                        <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Settings size={18} color="#f59e0b" /> Underlying Mechanism
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                                            {selectedGuide.guide?.mechanism}
                                        </p>
                                    </section>
                                </div>
                            ) : (
                                <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Live Interface Preview</h3>
                                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>
                                            This is a visual representation of how the {selectedGuide.name} application looks in production.
                                            The template includes all widgets and layouts shown below.
                                        </p>
                                    </div>
                                    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '4px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                                        <img
                                            src={selectedGuide.previewImage}
                                            alt={`${selectedGuide.name} Preview`}
                                            style={{ width: '100%', display: 'block', borderRadius: '12px' }}
                                        />
                                    </div>
                                    <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '16px', border: '1px solid #dcfce7', display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <Sparkles size={24} color="#16a34a" />
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#166534' }}>Ready to Deploy</div>
                                            <div style={{ fontSize: '0.8rem', color: '#166534', opacity: 0.8 }}>All UI components, logic blocks, and database tables are pre-configured.</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '24px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
                            <button
                                onClick={() => { handleInstall(selectedGuide.id); setSelectedGuide(null); }}
                                style={{
                                    padding: '12px 32px', borderRadius: '14px', border: 'none',
                                    backgroundColor: selectedGuide.accent, color: 'white', fontWeight: 800,
                                    fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'
                                }}
                            >
                                Install Template Now <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes modalSlideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>

    );
};

export default AppStore;
