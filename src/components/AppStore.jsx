import React, { useState } from 'react';
import {
    Layout, Sparkles, Settings2, Package, Wrench, ArrowRight, CheckCircle2, ClipboardList,
    Search, Filter, Star, Zap, Info, Rocket, Database, ShieldCheck,
    ChevronRight, ShoppingBag, Plus, Award, Boxes, ShieldAlert, BookOpen, X, Trash2,
    List, Cpu, Settings, FileText, PlayCircle, Activity, HeartPulse, Truck,
    Image as ImageIcon, BarChart3, Sliders
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { createIncomingInspectionTemplate } from '../utils/incomingInspectionTemplate';
import { createWeighDispenseTemplate } from '../utils/weighDispenseTemplate';
import { createVisionInspectionTemplate } from '../utils/visionInspectionTemplate';
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
import { createPerformanceVisibilityTerminalTemplate } from '../utils/performanceVisibilityTerminalTemplate';
import { createMachineMonitoringTerminalTemplate } from '../utils/machineMonitoringTerminalTemplate';
import { createOperationsManagementDashboardTemplate } from '../utils/operationsManagementDashboardTemplate';
import { createMaterialHandlingTemplate } from '../utils/materialHandlingTemplate';
import { createMaterialRequestTemplate } from '../utils/materialRequestTemplate';
import { createMaterialLoadingReceivingTemplate } from '../utils/materialLoadingReceivingTemplate';
import { createInventoryManagementTemplate } from '../utils/inventoryManagementTemplate';
import { createInventoryDashboardTemplate } from '../utils/inventoryDashboardTemplate';
import { createReplenishmentTemplate } from '../utils/replenishmentTemplate';
import { createKanbanInventorySystemTemplate } from '../utils/kanbanInventorySystemTemplate';
import { createMaterialWarehouseTemplate } from '../utils/materialWarehouseTemplate';
import { createQualityInspectionSuiteTemplate } from '../utils/qualityInspectionSuiteTemplate';
import { createFrontlineQmsTemplate } from '../utils/frontlineQmsTemplate';
import { createMaterialReviewBoardTemplate } from '../utils/materialReviewBoardTemplate';
import { createSmartHomeTemplate } from '../utils/smartHomeTemplate';
import { createPlcHmiTerminalTemplate } from '../utils/plcHmiTerminalTemplate';
import { createWorkInstructionsTemplate } from '../utils/workInstructionsTemplate';
import { createProductDrawingInspectionTemplate } from '../utils/productDrawingInspectionTemplate';
import { createHydraulicCylinderInspectionTemplate } from '../utils/hydraulicCylinderInspectionTemplate';
import { createMobileScanInspectionTemplate } from '../utils/mobileScanInspectionTemplate';
import { createQuickStartHelloWorldTemplate } from '../utils/quickStartHelloWorldTemplate';

import { saveFrontlineApp, deleteFrontlineApp, getAllFrontlineApps } from '../utils/supabaseFrontlineDB';
import {
    createTable, getTables, addTableRecord,
    getTableById, updateTable, linkRecords, getTableRecords, updateTableRecord
} from '../utils/database';
import { getCurrentUser } from '../utils/auth';
import toast, { Toaster } from 'react-hot-toast';



const generateSmartDummyData = (fields, count = 3) => {
    const records = [];
    for (let i = 1; i <= count; i++) {
        const record = {};
        fields.forEach(f => {
            const name = f.name.toLowerCase();
            if (name === 'id' || name.includes('_id')) {
                record[f.name] = `REC-${Math.floor(Math.random()*10000)}-${i}`;
            } else if (f.type === 'number' || f.type === 'integer') {
                if (name.includes('qty')) record[f.name] = Math.floor(Math.random() * 100) + 10;
                else record[f.name] = Math.floor(Math.random() * 100);
            } else if (f.type === 'datetime') {
                record[f.name] = new Date(Date.now() - Math.random() * 1000000000).toISOString();
            } else if (f.type === 'boolean') {
                record[f.name] = Math.random() > 0.5;
            } else if (name.includes('status')) {
                record[f.name] = ['PENDING', 'ACTIVE', 'COMPLETED', 'RUNNING'][i % 4];
            } else if (name.includes('operator') || name.includes('inspector') || name.includes('user')) {
                record[f.name] = ['Adam Veres', 'Lianna Churchill', 'David Miller', 'Sarah Jenkins'][i % 4];
            } else if (name.includes('location') || name.includes('station')) {
                record[f.name] = ['Station 1', 'Line 1', 'Warehouse A', 'Station 2'][i % 4];
            } else if (name.includes('reason') || name.includes('desc')) {
                record[f.name] = `Sample description for ${f.name} ${i}`;
            } else if (f.type === 'linked_record') {
                record[f.name] = []; // Initialize to empty array
            } else {
                record[f.name] = `Sample ${f.name} ${i}`;
            }
        });
        records.push(record);
    }
    return records;
};

const getOrCreateTableAndSeed = async (allTables, tableDef, skipSeed = false) => {
    const existingTable = allTables.find(t => t.name === tableDef.name);
    let targetTable = existingTable;
    let isNew = false;
    if (!existingTable) {
        targetTable = await createTable(tableDef);
        isNew = true;
    }

    if (!skipSeed && targetTable) {
        try {
            const existingRecords = await getTableRecords(targetTable.id);
            if (isNew || !existingRecords || existingRecords.length === 0) {
                const fields = tableDef.fields || [];
                const dummyRecords = generateSmartDummyData(fields, 3);
                for (const record of dummyRecords) {
                    const cleanRecord = { ...record };
                    fields.forEach(f => {
                        if (f.type === 'linked_record') {
                            cleanRecord[f.name] = []; // Ensure empty array initially
                        }
                    });
                    await addTableRecord({ tableId: targetTable.id, fields: cleanRecord });
                }
            }
        } catch (e) {
            console.warn('Failed to insert dummy data for', targetTable.name, e);
        }
    }
    return targetTable;
};

const connectAppTablesAndSeedLinks = async (appTableIds) => {
    if (!appTableIds || appTableIds.length === 0) return;
    
    console.log('[AppStore] Running connectAppTablesAndSeedLinks for:', appTableIds);
    try {
        // 1. Fetch full definitions of all tables in the app
        const tables = await Promise.all(appTableIds.map(id => getTableById(id)));
        
        // Define common field patterns and their corresponding candidate target tables
        const linkMap = [
            {
                pattern: ['work_order_id', 'work_order', 'parent_wo', 'parent_order_id', 'order_id'],
                targets: ['Work_Orders', 'Production_Orders', 'Workshop_Orders'],
                reversePrefix: 'Linked_Orders'
            },
            {
                pattern: ['station_id', 'station'],
                targets: ['Stations'],
                reversePrefix: 'Linked_History'
            },
            {
                pattern: ['material_definition_id', 'material_id', 'parent_material_id', 'parent_material'],
                targets: ['Material_Definitions', 'Inventory_Materials'],
                reversePrefix: 'Linked_Items'
            },
            {
                pattern: ['supplier_id', 'supplier'],
                targets: ['Inventory_Suppliers'],
                reversePrefix: 'Linked_Materials'
            },
            {
                pattern: ['defect_id', 'defect'],
                targets: ['Defect_Events'],
                reversePrefix: 'Linked_Deviations'
            },
            {
                pattern: ['kanban_card_id', 'kanban_card'],
                targets: ['Kanban_Cards'],
                reversePrefix: 'Linked_Requests'
            },
            {
                pattern: ['inventory_item_id', 'inventory_item'],
                targets: ['Inventory_Items'],
                reversePrefix: 'Linked_Transactions'
            },
            {
                pattern: ['parent_event_id', 'parent_event'],
                targets: ['Andon_Events'],
                reversePrefix: 'Linked_Resolutions'
            }
        ];
        
        // 2. Scan and update schemas to convert text reference fields to linked_record fields
        const updatedTables = [];
        for (const tableA of tables) {
            let fieldsChanged = false;
            const updatedFields = tableA.fields.map(field => {
                if (field.type === 'linked_record') return field;
                
                const fieldNameLower = field.name.toLowerCase();
                const rule = linkMap.find(m => m.pattern.includes(fieldNameLower));
                if (rule) {
                    const targetTable = tables.find(t => rule.targets.includes(t.name));
                    if (targetTable && targetTable.id !== tableA.id) {
                        console.log(`[AppStore] Converting field "${field.name}" in table "${tableA.name}" to linked_record pointing to "${targetTable.name}"`);
                        fieldsChanged = true;
                        return {
                            ...field,
                            type: 'linked_record',
                            link_table_id: targetTable.id,
                            link_type: 'many_to_one',
                            reverse_link_name: `${rule.reversePrefix}_${tableA.name.replace(/[^a-zA-Z0-9]/g, '_')}`
                        };
                    }
                }
                return field;
            });
            
            if (fieldsChanged) {
                try {
                    await updateTable(tableA.id, { fields: updatedFields });
                    const freshTable = await getTableById(tableA.id);
                    updatedTables.push(freshTable);
                } catch (schemaErr) {
                    console.warn(`Failed to update schema for table ${tableA.name}:`, schemaErr);
                    updatedTables.push(tableA);
                }
            } else {
                updatedTables.push(tableA);
            }
        }
        
        // 3. Populate links between records
        for (const tableA of updatedTables) {
            const linkedFields = (tableA.fields || []).filter(f => f.type === 'linked_record' && f.link_table_id && f.link_type === 'many_to_one');
            if (linkedFields.length === 0) continue;
            
            const recordsA = await getTableRecords(tableA.id);
            if (!recordsA || recordsA.length === 0) continue;
            
            for (const lf of linkedFields) {
                const recordsB = await getTableRecords(lf.link_table_id);
                if (!recordsB || recordsB.length === 0) continue;
                
                console.log(`[AppStore] Linking records of "${tableA.name}" (field: "${lf.name}") with "${lf.link_table_id}"`);
                
                for (const recA of recordsA) {
                    const originalValue = recA.data[lf.name];
                    let matchedRec = null;
                    if (originalValue) {
                        const valStr = String(originalValue).toLowerCase().trim();
                        matchedRec = recordsB.find(recB => 
                            String(recB.recordId).toLowerCase().trim() === valStr ||
                            (recB.data && String(Object.values(recB.data).find(v => typeof v === 'string' && v.toLowerCase().trim() === valStr)).length > 0)
                        );
                    }
                    
                    if (!matchedRec) {
                        matchedRec = recordsB[Math.floor(Math.random() * recordsB.length)];
                    }
                    
                    if (matchedRec) {
                        try {
                            const sourceRecId = recA.recordId || recA.record_id;
                            const targetRecId = matchedRec.recordId || matchedRec.record_id;
                            if (sourceRecId && targetRecId) {
                                // Clear field first to avoid string pollution
                                const cleanData = { ...recA.data, [lf.name]: [] };
                                await updateTableRecord(tableA.id, sourceRecId, cleanData);
                                
                                await linkRecords(
                                    tableA.id,
                                    sourceRecId,
                                    lf.name,
                                    lf.link_table_id,
                                    targetRecId,
                                    lf.reverse_link_name
                                );
                            }
                        } catch (linkErr) {
                            console.warn(`Failed to link record ${recA.recordId} with ${matchedRec.recordId}:`, linkErr);
                        }
                    }
                }
            }
        }
        console.log('[AppStore] Completed connectAppTablesAndSeedLinks successfully');
    } catch (err) {
        console.error('[AppStore] Failed in connectAppTablesAndSeedLinks:', err);
    }
};

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
    // Track which templates have been installed (templateId -> appId mapping)
    const [installedTemplates, setInstalledTemplates] = useState(() => {
        try { return JSON.parse(localStorage.getItem('installedAppStoreTemplates')) || {}; } catch { return {}; }
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [dbApps, setDbApps] = useState([]);
    
    React.useEffect(() => {
        const user = getCurrentUser();
        if (user?.role?.toUpperCase().includes('ADMIN')) setIsAdmin(true);

        const fetchDbApps = async () => {
            try {
                const apps = await getAllFrontlineApps();
                setDbApps(apps || []);
            } catch (err) {
                console.error('[AppStore] Failed to fetch db apps:', err);
            }
        };
        fetchDbApps();
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

    const handleUninstall = async (e, templateId) => {
        e.stopPropagation();
        const appId = installedTemplates[templateId];
        if (!appId) return;

        if (window.confirm("Are you sure you want to uninstall this app? This will permanently delete the app from your builder.")) {
            try {
                await deleteFrontlineApp(appId);
                
                // Remove from installed templates
                setInstalledTemplates(prev => {
                    const next = { ...prev };
                    delete next[templateId];
                    localStorage.setItem('installedAppStoreTemplates', JSON.stringify(next));
                    return next;
                });
                toast.success('App uninstalled successfully');
            } catch (err) {
                console.error('Failed to uninstall app:', err);
                toast.error('Failed to uninstall app: ' + err.message);
            }
        }
    };

    const categories = ['All', 'App Management', 'Quality', 'Manufacturing', 'Production', 'MES Production Suite', 'Inventory App Suite', 'Warehouse', 'Automotive', 'Analytic', 'SmartHome / IoT'];


    const rawTemplates = [
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
        }
    ];

    const templates = rawTemplates.map(t => ({
        ...t,
        version: ['incoming-inspection', 'weigh-dispense', 'assy-line-production'].includes(t.id) ? 2 : 1
    }));

    const filteredTemplates = templates.filter(t => {
        if (deletedTemplates.includes(t.id)) return false;
        
        if (activeCategory === 'App Management') {
            return !!installedTemplates[t.id];
        }

        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
        const isArchived = archivedTemplates.includes(t.id);
        if (!isAdmin && isArchived) return false;
        return matchesSearch && matchesCategory;
    });

    const handleInstall = async (templateId, existingAppId = null) => {
        const allTables = await getTables();
        setInstallingId(templateId);
        const loadingToast = toast.loading(existingAppId ? 'Updating template...' : 'Installing template...');
        const iso = new Date().toISOString();

        try {
            let templateApp;

            if (templateId === 'quickstart-hello-world') {
                templateApp = createQuickStartHelloWorldTemplate();
            } else if (templateId === 'vision-inspection-suite') {
                templateApp = createVisionInspectionTemplate();
                try {
                    const visionTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'live_measurements',
                        fields: [
                            { name: 'video_name', type: 'text' },
                            { name: 'timestamp', type: 'datetime' },
                            { name: 'measurements', type: 'json' },
                            { name: 'cycle_data', type: 'json' },
                            { name: 'quality_data', type: 'json' },
                            { name: 'work_order', type: 'text' },
                            { name: 'narration', type: 'text' }
                        ]
                    });
                    if (visionTable && visionTable.id) {
                        const appStr = JSON.stringify(templateApp).replace(/live_measurements/g, visionTable.id);
                        templateApp = JSON.parse(appStr);
                        templateApp.config.appTables = [visionTable.id];
                    }
                } catch (visionErr) {
                    console.warn('Could not create vision measurements table:', visionErr);
                }
            } else if (templateId === 'mobile-scan-vision') {
                templateApp = createMobileScanInspectionTemplate();
                try {
                    const mobileScanTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'mobile_scan_logs',
                        fields: [
                            { name: 'operator', type: 'text' },
                            { name: 'scanned_barcode', type: 'text' },
                            { name: 'timestamp', type: 'datetime' }
                        ]
                    });
                    if (mobileScanTable && mobileScanTable.id) {
                        const appStr = JSON.stringify(templateApp).replace(/mobile_scan_logs/g, mobileScanTable.id);
                        templateApp = JSON.parse(appStr);
                        templateApp.config.appTables = [mobileScanTable.id];
                    }
                } catch (msErr) {
                    console.warn('Could not create mobile scan logs table:', msErr);
                }
            } else if (templateId === 'incoming-inspection') {
                templateApp = createIncomingInspectionTemplate();
                try {
                    const iqcTable = await getOrCreateTableAndSeed(allTables, {
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
            } else if (templateId === 'work-instructions') {
                templateApp = createWorkInstructionsTemplate();
                try {
                    const woTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'WI_Work_Orders',
                        fields: [
                            { name: 'Work_Order_ID', type: 'text' },
                            { name: 'Material_ID', type: 'text' },
                            { name: 'Description', type: 'text' },
                            { name: 'QTY_Required', type: 'number' },
                            { name: 'QTY_Complete', type: 'number' },
                            { name: 'Status', type: 'text' },
                            { name: 'Due_Date', type: 'datetime' }
                        ]
                    }, true); // skip generic seed, we do custom seeding next

                    // Seed specific work order data if table is new or empty
                    if (woTable) {
                        try {
                            const { getTableRecords, addTableRecord } = await import('../utils/supabaseTablesDB');
                            const existingRecords = await getTableRecords(woTable.id);
                            if (!existingRecords || existingRecords.length === 0) {
                                const initialWorkOrders = [
                                    {
                                        'Work_Order_ID': 'WO-2026-001',
                                        'Material_ID': 'PCB-A-901',
                                        'Description': 'Smart PCB Main Assembly',
                                        'QTY_Required': 10,
                                        'QTY_Complete': 0,
                                        'Status': 'RELEASED',
                                        'Due_Date': new Date(Date.now() + 5*24*3600*1000).toISOString()
                                    },
                                    {
                                        'Work_Order_ID': 'WO-2026-002',
                                        'Material_ID': 'BP-M-102',
                                        'Description': 'Heavy Baseplate Mechanical Unit',
                                        'QTY_Required': 25,
                                        'QTY_Complete': 2,
                                        'Status': 'IN PROGRESS',
                                        'Due_Date': new Date(Date.now() + 2*24*3600*1000).toISOString()
                                    },
                                    {
                                        'Work_Order_ID': 'WO-2026-003',
                                        'Material_ID': 'SEN-S-404',
                                        'Description': 'Optical Sensor Mounting Unit',
                                        'QTY_Required': 5,
                                        'QTY_Complete': 0,
                                        'Status': 'RELEASED',
                                        'Due_Date': new Date(Date.now() + 8*24*3600*1000).toISOString()
                                    }
                                ];
                                for (const wo of initialWorkOrders) {
                                    await addTableRecord({ tableId: woTable.id, fields: wo });
                                }
                            }
                        } catch (seedErr) {
                            console.warn('Could not seed initial Work Orders:', seedErr);
                        }
                    }

                    const logsTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'WI_Activity_Logs',
                        fields: [
                            { name: 'Work_Order_ID', type: 'text' },
                            { name: 'Operator', type: 'text' },
                            { name: 'Station_ID', type: 'text' },
                            { name: 'PCB_Serial', type: 'text' },
                            { name: 'Torque_Value', type: 'number' },
                            { name: 'Quality_Status', type: 'text' },
                            { name: 'Defect_Reason', type: 'text' },
                            { name: 'Cycle_Time_Sec', type: 'number' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    }, true); // skip automatic seeding

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (woTable?.id) {
                        appStr = appStr.replace(/tbl_wi_work_orders/g, woTable.id);
                        tIds.push(woTable.id);
                    }
                    if (logsTable?.id) {
                        appStr = appStr.replace(/tbl_wi_activity_logs/g, logsTable.id);
                        tIds.push(logsTable.id);
                    }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (wiErr) {
                    console.warn('Could not create WI tables:', wiErr);
                }
            } else if (templateId === 'weigh-dispense') {
                templateApp = createWeighDispenseTemplate();
                try {
                    const wdTable = await getOrCreateTableAndSeed(allTables, {
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
                    const ordersTable = await getOrCreateTableAndSeed(allTables, { name: 'Production_Orders', fields: [
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
                    const countsTable = await getOrCreateTableAndSeed(allTables, { name: 'Production_Counts', fields: [
                        { name: 'Work_Order_ID', type: 'text' }, { name: 'Count_Interval', type: 'text' },
                        { name: 'Interval_Parts', type: 'number' }, { name: 'Interval_Defects', type: 'number' },
                        { name: 'Operator', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_Order', type: 'linked_record', link_table_id: ordersTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Counts' }
                    ] });
                    const downtimeTable = await getOrCreateTableAndSeed(allTables, { name: 'Downtime_Events', fields: [
                        { name: 'Work_Order_ID', type: 'text' }, { name: 'Downtime_Reason', type: 'text' },
                        { name: 'Downtime_Minutes', type: 'number' }, { name: 'Fault_Code', type: 'text' },
                        { name: 'Machine_ID', type: 'text' }, { name: 'Operator', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_Order', type: 'linked_record', link_table_id: ordersTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Downtime' }
                    ] });
                    const notesTable = await getOrCreateTableAndSeed(allTables, { name: 'Production_Notes', fields: [
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
                    const supTable = await getOrCreateTableAndSeed(allTables, { name: 'Inventory_Suppliers', fields: [
                        { name: 'Supplier_Name', type: 'text' }, { name: 'Contact', type: 'text' },
                        { name: 'Lead_Days', type: 'number' }, { name: 'Rating', type: 'text' },
                        { name: 'Linked_Materials', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Supplier' }
                    ] });
                    // 2. Materials table with formula fields
                    const matTable = await getOrCreateTableAndSeed(allTables, { name: 'Inventory_Materials', fields: [
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
                    const txTable = await getOrCreateTableAndSeed(allTables, { name: 'Inventory_Transactions', fields: [
                        { name: 'Order_ID', type: 'text' }, { name: 'Item_Number', type: 'text' },
                        { name: 'Material_Name', type: 'text' }, { name: 'Qty', type: 'number' },
                        { name: 'Type', type: 'text' }, { name: 'Unit_Cost', type: 'number' },
                        { name: 'Line_Value', type: 'formula', formulaExpression: 'Qty * Unit_Cost' },
                        { name: 'Operator', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_Material', type: 'linked_record', link_table_id: matTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Transactions' }
                    ] });
                    // 4. Alerts table
                    const alertTable = await getOrCreateTableAndSeed(allTables, { name: 'Inventory_Alerts', fields: [
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
                    const woTable = await getOrCreateTableAndSeed(allTables, { name: 'Workshop_Orders', fields: [
                        { name: 'License_Plate', type: 'text' }, { name: 'Vehicle_Make', type: 'text' },
                        { name: 'Vehicle_Model', type: 'text' }, { name: 'Vehicle_Year', type: 'text' },
                        { name: 'Mileage', type: 'number' }, { name: 'Customer_Name', type: 'text' },
                        { name: 'Customer_Phone', type: 'text' }, { name: 'Technician', type: 'text' },
                        { name: 'Bay_Number', type: 'text' }, { name: 'Priority', type: 'text' },
                        { name: 'WO_Status', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'VIN', type: 'text' }, { name: 'Engine_Number', type: 'text' },
                        { name: 'DTC_Codes', type: 'text' }, { name: 'DTC_Status', type: 'text' },
                        { name: 'Linked_Services', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_WO' },
                        { name: 'Linked_Inspections', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_WO' },
                        { name: 'Linked_Parts', type: 'linked_record', link_type: 'one_to_many', reverse_link_name: 'Parent_WO' }
                    ] });
                    const svcTable = await getOrCreateTableAndSeed(allTables, { name: 'Service_Items', fields: [
                        { name: 'Service_Type', type: 'text' }, { name: 'Description', type: 'text' },
                        { name: 'Labor_Hours', type: 'number' }, { name: 'Labor_Rate', type: 'number' },
                        { name: 'Labor_Cost', type: 'formula', formulaExpression: 'Labor_Hours * Labor_Rate' },
                        { name: 'Technician', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_WO', type: 'linked_record', link_table_id: woTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Services' }
                    ] });
                    const inspTable = await getOrCreateTableAndSeed(allTables, { name: 'Vehicle_Inspections', fields: [
                        { name: 'Engine', type: 'text' }, { name: 'Brakes', type: 'text' },
                        { name: 'Tires', type: 'text' }, { name: 'Fluids', type: 'text' },
                        { name: 'Lights', type: 'text' }, { name: 'Suspension', type: 'text' },
                        { name: 'Notes', type: 'text' }, { name: 'Timestamp', type: 'datetime' },
                        { name: 'Parent_WO', type: 'linked_record', link_table_id: woTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Inspections' }
                    ] });
                    const partsTable = await getOrCreateTableAndSeed(allTables, { name: 'Parts_Used', fields: [
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
                    const eventTable = await getOrCreateTableAndSeed(allTables, { name: 'Andon_Events', fields: [
                        { name: 'Station_ID', type: 'text' }, { name: 'Alert_Category', type: 'text' },
                        { name: 'Description', type: 'text' }, { name: 'Severity', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Raised_By', type: 'text' },
                        { name: 'Timestamp', type: 'datetime' },
                        { name: 'Linked_Resolutions', type: 'linked_record', link_type: 'one_to_one', reverse_link_name: 'Parent_Event' }
                    ] });
                    const resTable = await getOrCreateTableAndSeed(allTables, { name: 'Andon_Resolutions', fields: [
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
                    const itemMasterTable = await getOrCreateTableAndSeed(allTables, { name: 'Item_Master', fields: [
                        { name: 'Item_Name', type: 'text' }, { name: 'Description', type: 'text' },
                        { name: 'UOM', type: 'text' }, { name: 'Type', type: 'text' }
                    ] });
                    const orderMatTable = await getOrCreateTableAndSeed(allTables, { name: 'Order_Materials', fields: [
                        { name: 'Product_Name', type: 'text' }, { name: 'Type', type: 'text' },
                        { name: 'QTY_Required', type: 'number' }, { name: 'QTY_Complete', type: 'number' },
                        { name: 'Due_Date', type: 'datetime' }, { name: 'Status', type: 'text' },
                        { name: 'Location', type: 'text' }
                    ] });
                    const bomTable = await getOrCreateTableAndSeed(allTables, { name: 'Manufacturing_BOM', fields: [
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
                    const defectTable = await getOrCreateTableAndSeed(allTables, { name: 'Defect_Events', fields: [
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
                    const assetTable = await getOrCreateTableAndSeed(allTables, { name: 'Asset', fields: [
                        { name: 'ID', type: 'text' }, { name: 'Name', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Type', type: 'text' },
                        { name: 'Tare_Weight', type: 'number' }, { name: 'Last_Calibration', type: 'datetime' },
                        { name: 'Description', type: 'text' }
                    ] });
                    const historyTable = await getOrCreateTableAndSeed(allTables, { name: 'Equipment_Status_History', fields: [
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
                    const kanbanCardsTable = await getOrCreateTableAndSeed(allTables, { name: 'Kanban_Cards', fields: [
                        { name: 'Kanban_ID', type: 'text' }, { name: 'Part_Number', type: 'text' },
                        { name: 'Part_Description', type: 'text' }, { name: 'Consuming_Location', type: 'text' },
                        { name: 'Supply_Location', type: 'text' }, { name: 'QTY', type: 'number' },
                        { name: 'Status', type: 'text' }, { name: 'Active', type: 'text' },
                        { name: 'Image', type: 'text' }
                    ] });
                    const matReqTable = await getOrCreateTableAndSeed(allTables, { name: 'Material_Requests', fields: [
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
                    const leanTable = await getOrCreateTableAndSeed(allTables, { name: 'tbl_lean_data', fields: [
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
                    const woTable = await getOrCreateTableAndSeed(allTables, { name: 'Work_Orders', fields: [
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
                    const bomTable = await getOrCreateTableAndSeed(allTables, { name: 'Bill_Of_Materials', fields: [
                        { name: 'Parent_Material_Definition_ID', type: 'text' }, { name: 'Parent_Material_Description', type: 'text' },
                        { name: 'Component_Material_Definition_ID', type: 'text' }, { name: 'Component_Material_Description', type: 'text' },
                        { name: 'Component_Quantity', type: 'number' }, { name: 'Component_UoM', type: 'text' },
                        { name: 'Point_of_Use', type: 'text' }
                    ]});
                    const shTable = await getOrCreateTableAndSeed(allTables, { name: 'Station_Activity_History', fields: [
                        { name: 'Station_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Start_Date_Time', type: 'datetime' }, { name: 'End_Date_Time', type: 'datetime' },
                        { name: 'Duration', type: 'number' }, { name: 'Material_Definition_ID', type: 'text' },
                        { name: 'Target_Quantity', type: 'number' }, { name: 'Actual_Quantity', type: 'number' },
                        { name: 'Defects', type: 'number' }, { name: 'Downtime_reason', type: 'text' },
                        { name: 'Comments', type: 'text' }, { name: 'Unit_ID', type: 'text' },
                        { name: 'Parent_WO', type: 'linked_record', link_table_id: woTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_History' }
                    ]});
                    const notesTable = await getOrCreateTableAndSeed(allTables, { name: 'Notes_And_Comments', fields: [
                        { name: 'Reference_ID', type: 'text' }, { name: 'Location', type: 'text' },
                        { name: 'Notes', type: 'text' }, { name: 'Sender', type: 'text' },
                        { name: 'Updated_by', type: 'text' }, { name: 'Recipient', type: 'text' },
                        { name: 'Notes_Photo', type: 'text' },
                        { name: 'Parent_WO', type: 'linked_record', link_table_id: woTable?.id, link_type: 'many_to_one', reverse_link_name: 'Linked_Notes' }
                    ]});
                    const irTable = await getOrCreateTableAndSeed(allTables, { name: 'Inspection_Results', fields: [
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
                    const woTable = await getOrCreateTableAndSeed(allTables, { name: 'Work_Orders', fields: [
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
                    const woTable = await getOrCreateTableAndSeed(allTables, { name: 'Work_Orders', fields: [
                        { name: 'Operator', type: 'text' }, { name: 'Parent_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Location', type: 'text' }, { name: 'QTY_Required', type: 'number' },
                        { name: 'QTY_Complete', type: 'number' }, { name: 'QTY_Scrap', type: 'number' },
                        { name: 'Due_Date', type: 'datetime' }, { name: 'Start_Date', type: 'datetime' },
                        { name: 'Complete_Date', type: 'datetime' }, { name: 'Customer_ID', type: 'text' }
                    ]});
                    const unitsTable = await getOrCreateTableAndSeed(allTables, { name: 'Units', fields: [
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Material_Definition_Type', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Location', type: 'text' },
                        { name: 'QTY', type: 'number' }, { name: 'Unit_of_Measure', type: 'text' },
                        { name: 'Work_Order_ID', type: 'text' }, { name: 'Completed_Date', type: 'datetime' },
                        { name: 'Produced_By', type: 'text' }, { name: 'Parent_Unit_ID', type: 'text' }
                    ]});
                    const shTable = await getOrCreateTableAndSeed(allTables, { name: 'Station_Activity_History', fields: [
                        { name: 'Station_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Start_Date_Time', type: 'datetime' }, { name: 'End_Date_Time', type: 'datetime' },
                        { name: 'Duration', type: 'number' }, { name: 'Material_Definition_ID', type: 'text' },
                        { name: 'Target_Quantity', type: 'number' }, { name: 'Actual_Quantity', type: 'number' },
                        { name: 'Defects', type: 'number' }, { name: 'Downtime_reason', type: 'text' },
                        { name: 'Comments', type: 'text' }, { name: 'Unit_ID', type: 'text' }, { name: 'Work_Order_ID', type: 'text' }
                    ]});
                    const stationsTable = await getOrCreateTableAndSeed(allTables, { name: 'Stations', fields: [
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
                    const stationsTable = await getOrCreateTableAndSeed(allTables, { name: 'Stations', fields: [
                        { name: 'Status', type: 'text' }, { name: 'Status_Color', type: 'text' },
                        { name: 'Status_Detail', type: 'text' }, { name: 'Process_Cell', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Work_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }
                    ]});
                    const actionsTable = await getOrCreateTableAndSeed(allTables, { name: 'Actions', fields: [
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
                    const woTable = await getOrCreateTableAndSeed(allTables, { name: 'Work_Orders', fields: [
                        { name: 'Operator', type: 'text' }, { name: 'Parent_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Location', type: 'text' }, { name: 'QTY_Required', type: 'number' },
                        { name: 'QTY_Complete', type: 'number' }, { name: 'QTY_Scrap', type: 'number' },
                        { name: 'Due_Date', type: 'datetime' }, { name: 'Start_Date', type: 'datetime' },
                        { name: 'Complete_Date', type: 'datetime' }, { name: 'Customer_ID', type: 'text' }
                    ]});
                    const stationsTable = await getOrCreateTableAndSeed(allTables, { name: 'Stations', fields: [
                        { name: 'Status', type: 'text' }, { name: 'Status_Color', type: 'text' },
                        { name: 'Status_Detail', type: 'text' }, { name: 'Process_Cell', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Work_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }
                    ]});
                    const actionsTable = await getOrCreateTableAndSeed(allTables, { name: 'Actions', fields: [
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Title', type: 'text' },
                        { name: 'Location', type: 'text' }, { name: 'Severity', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Work_Order_ID', type: 'text' },
                        { name: 'Unit_ID', type: 'text' }, { name: 'Comments', type: 'text' },
                        { name: 'Photo', type: 'text' }, { name: 'Reported_by', type: 'text' },
                        { name: 'Owner', type: 'text' }, { name: 'Type', type: 'text' },
                        { name: 'Actions_Taken', type: 'text' }, { name: 'Due_date', type: 'datetime' }
                    ]});
                    const shTable = await getOrCreateTableAndSeed(allTables, { name: 'Station_Activity_History', fields: [
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
                    const stationsTable = await getOrCreateTableAndSeed(allTables, { name: 'Stations', fields: [
                        { name: 'Status', type: 'text' }, { name: 'Status_Color', type: 'text' },
                        { name: 'Status_Detail', type: 'text' }, { name: 'Process_Cell', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Work_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }
                    ]});
                    const shTable = await getOrCreateTableAndSeed(allTables, { name: 'Station_Activity_History', fields: [
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
            } else if (templateId === 'performance-visibility-terminal') {
                templateApp = createPerformanceVisibilityTerminalTemplate();
                try {
                    const woTable = await getOrCreateTableAndSeed(allTables, { name: 'Work_Orders', fields: [
                        { name: 'Operator', type: 'text' }, { name: 'Parent_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Location', type: 'text' }, { name: 'QTY_Required', type: 'number' },
                        { name: 'QTY_Complete', type: 'number' }, { name: 'QTY_Scrap', type: 'number' },
                        { name: 'Due_Date', type: 'datetime' }, { name: 'Start_Date', type: 'datetime' },
                        { name: 'Complete_Date', type: 'datetime' }, { name: 'Customer_ID', type: 'text' }
                    ]});
                    const stationsTable = await getOrCreateTableAndSeed(allTables, { name: 'Stations', fields: [
                        { name: 'Status', type: 'text' }, { name: 'Status_Color', type: 'text' },
                        { name: 'Status_Detail', type: 'text' }, { name: 'Process_Cell', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Work_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }
                    ]});
                    const shTable = await getOrCreateTableAndSeed(allTables, { name: 'Station_Activity_History', fields: [
                        { name: 'Station_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Start_Date_Time', type: 'datetime' }, { name: 'End_Date_Time', type: 'datetime' },
                        { name: 'Duration', type: 'number' }, { name: 'Material_Definition_ID', type: 'text' },
                        { name: 'Target_Quantity', type: 'number' }, { name: 'Actual_Quantity', type: 'number' },
                        { name: 'Defects', type: 'number' }, { name: 'Downtime_reason', type: 'text' },
                        { name: 'Comments', type: 'text' }, { name: 'Unit_ID', type: 'text' }, { name: 'Work_Order_ID', type: 'text' }
                    ]});
                    const mdTable = await getOrCreateTableAndSeed(allTables, { name: 'Material_Definitions', fields: [
                        { name: 'Name', type: 'text' }, { name: 'Type', type: 'text' },
                        { name: 'Description', type: 'text' }, { name: 'Image', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Unit_of_Measure', type: 'text' },
                        { name: 'Version_Revision', type: 'text' }, { name: 'Vendor_ID', type: 'text' },
                        { name: 'Target_Cycle_Time', type: 'number' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (woTable?.id) { appStr = appStr.replace(/tbl_pvt_work_orders/g, woTable.id); tIds.push(woTable.id); }
                    if (stationsTable?.id) { appStr = appStr.replace(/tbl_pvt_stations/g, stationsTable.id); tIds.push(stationsTable.id); }
                    if (shTable?.id) { appStr = appStr.replace(/tbl_pvt_station_history/g, shTable.id); tIds.push(shTable.id); }
                    if (mdTable?.id) { appStr = appStr.replace(/tbl_pvt_material_definitions/g, mdTable.id); tIds.push(mdTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (pvtErr) {
                    console.warn('Could not create PVT tables:', pvtErr);
                }
            } else if (templateId === 'machine-monitoring-terminal') {
                templateApp = createMachineMonitoringTerminalTemplate();
                try {
                    const woTable = await getOrCreateTableAndSeed(allTables, { name: 'Work_Orders', fields: [
                        { name: 'Operator', type: 'text' }, { name: 'Parent_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Location', type: 'text' }, { name: 'QTY_Required', type: 'number' },
                        { name: 'QTY_Complete', type: 'number' }, { name: 'QTY_Scrap', type: 'number' },
                        { name: 'Due_Date', type: 'datetime' }, { name: 'Start_Date', type: 'datetime' },
                        { name: 'Complete_Date', type: 'datetime' }, { name: 'Customer_ID', type: 'text' }
                    ]});
                    const ncTable = await getOrCreateTableAndSeed(allTables, { name: 'Notes_Comments', fields: [
                        { name: 'Reference_ID', type: 'text' }, { name: 'Location', type: 'text' },
                        { name: 'Notes', type: 'text' }, { name: 'Sender', type: 'text' },
                        { name: 'Updated_by', type: 'text' }, { name: 'Recipient', type: 'text' },
                        { name: 'Notes_Photo', type: 'text' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (woTable?.id) { appStr = appStr.replace(/tbl_mmt_work_orders/g, woTable.id); tIds.push(woTable.id); }
                    if (ncTable?.id) { appStr = appStr.replace(/tbl_mmt_notes/g, ncTable.id); tIds.push(ncTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (mmtErr) {
                    console.warn('Could not create MMT tables:', mmtErr);
                }
            } else if (templateId === 'operations-management-dashboard') {
                templateApp = createOperationsManagementDashboardTemplate();
                try {
                    const shTable = await getOrCreateTableAndSeed(allTables, { name: 'Station_Activity_History', fields: [
                        { name: 'Station_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Start_Date_Time', type: 'datetime' }, { name: 'End_Date_Time', type: 'datetime' },
                        { name: 'Duration', type: 'number' }, { name: 'Material_Definition_ID', type: 'text' },
                        { name: 'Target_Quantity', type: 'number' }, { name: 'Actual_Quantity', type: 'number' },
                        { name: 'Defects', type: 'number' }, { name: 'Downtime_reason', type: 'text' },
                        { name: 'Comments', type: 'text' }, { name: 'Unit_ID', type: 'text' }, { name: 'Work_Order_ID', type: 'text' }
                    ]});
                    const actionsTable = await getOrCreateTableAndSeed(allTables, { name: 'Actions', fields: [
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
                    if (shTable?.id) { appStr = appStr.replace(/tbl_omd_station_history/g, shTable.id); tIds.push(shTable.id); }
                    if (actionsTable?.id) { appStr = appStr.replace(/tbl_omd_actions/g, actionsTable.id); tIds.push(actionsTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (omdErr) {
                    console.warn('Could not create OMD tables:', omdErr);
                }
            } else if (templateId === 'material-handling') {
                templateApp = createMaterialHandlingTemplate();
                try {
                    const mrTable = await getOrCreateTableAndSeed(allTables, { name: 'Material_Requests', fields: [
                        { name: 'Item', type: 'text' }, { name: 'Requesting_Location', type: 'text' },
                        { name: 'Supplier', type: 'text' }, { name: 'Kanban_ID', type: 'text' },
                        { name: 'Quantity', type: 'number' }, { name: 'Status', type: 'text' },
                        { name: 'Status_Color', type: 'text' }, { name: 'Requestor', type: 'text' },
                        { name: 'Assignee', type: 'text' }, { name: 'Requested', type: 'datetime' },
                        { name: 'Started', type: 'datetime' }, { name: 'Completed', type: 'datetime' },
                        { name: 'Bin', type: 'text' }, { name: 'Compiled_by', type: 'text' },
                        { name: 'Ready_for_pick_time', type: 'datetime' }, { name: 'Delivered_by', type: 'text' }
                    ]});
                    const kcTable = await getOrCreateTableAndSeed(allTables, { name: 'Kanban_Cards', fields: [
                        { name: 'Part_Number', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Consuming_location', type: 'text' }, { name: 'Supplier', type: 'text' },
                        { name: 'QTY', type: 'number' }, { name: 'Part_Description', type: 'text' },
                        { name: 'Status_Color', type: 'text' }, { name: 'Image', type: 'text' },
                        { name: 'Active', type: 'boolean' }, { name: 'Lead_Time', type: 'number' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (mrTable?.id) { appStr = appStr.replace(/tbl_mh_material_requests/g, mrTable.id); tIds.push(mrTable.id); }
                    if (kcTable?.id) { appStr = appStr.replace(/tbl_mh_kanban_cards/g, kcTable.id); tIds.push(kcTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;

                    // Seed dummy data
                    if (mrTable?.id) {
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'DEMO-CYL-A1', 'Requesting_Location': 'Station 1',
                                'Supplier': 'Supplier A', 'Kanban_ID': 'KB-001',
                                'Quantity': 10, 'Status': 'REQUESTED',
                                'Status_Color': '#facc15', 'Requestor': 'Adam Veres',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'FASTENER-M6', 'Requesting_Location': 'Station 2',
                                'Supplier': 'Fastener Inc', 'Kanban_ID': 'KB-002',
                                'Quantity': 200, 'Status': 'ACTIVE',
                                'Status_Color': '#3b82f6', 'Requestor': 'Lianna Churchill',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'solenoid-valve-v2', 'Requesting_Location': 'Station 3',
                                'Supplier': 'SMC Pneumatics', 'Kanban_ID': 'KB-003',
                                'Quantity': 15, 'Status': 'ACTIVE',
                                'Status_Color': '#3b82f6', 'Requestor': 'Adam Veres',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'M4-MACHINE-SCREW', 'Requesting_Location': 'Station 4',
                                'Supplier': 'Fastener Inc', 'Kanban_ID': 'KB-004',
                                'Quantity': 500, 'Status': 'COMPLETED',
                                'Status_Color': '#22c55e', 'Requestor': 'David Miller',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'steel-bracket-b1', 'Requesting_Location': 'Station 5',
                                'Supplier': 'Apex Metalworks', 'Kanban_ID': 'KB-005',
                                'Quantity': 30, 'Status': 'CANCELLED',
                                'Status_Color': '#ef4444', 'Requestor': 'Sarah Jenkins',
                                'Requested': iso
                            }
                        });
                    }
                    if (kcTable?.id) {
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Kanban_ID': 'KB-001',
                                'Part_Number': 'DEMO-CYL-A1', 'Status': 'EMPTY',
                                'Consuming_location': 'Station 1', 'Supplier': 'Supplier A',
                                'QTY': 10, 'Part_Description': 'Double-acting pneumatic cylinder',
                                'Status_Color': '#ef4444', 'Active': true, 'Lead_Time': 4
                            }
                        });
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Kanban_ID': 'KB-002',
                                'Part_Number': 'FASTENER-M6', 'Status': 'FULL',
                                'Consuming_location': 'Station 2', 'Supplier': 'Fastener Inc',
                                'QTY': 200, 'Part_Description': 'M6 Socket Head Cap Screw',
                                'Status_Color': '#22c55e', 'Active': true, 'Lead_Time': 1
                            }
                        });
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Kanban_ID': 'KB-003',
                                'Part_Number': 'solenoid-valve-v2', 'Status': 'EMPTY',
                                'Consuming_location': 'Station 3', 'Supplier': 'SMC Pneumatics',
                                'QTY': 15, 'Part_Description': '5/2 Way Solenoid Valve',
                                'Status_Color': '#ef4444', 'Active': true, 'Lead_Time': 3
                            }
                        });
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Kanban_ID': 'KB-004',
                                'Part_Number': 'M4-MACHINE-SCREW', 'Status': 'FULL',
                                'Consuming_location': 'Station 4', 'Supplier': 'Fastener Inc',
                                'QTY': 500, 'Part_Description': 'M4 Machine Screw 12mm',
                                'Status_Color': '#22c55e', 'Active': true, 'Lead_Time': 2
                            }
                        });
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Kanban_ID': 'KB-005',
                                'Part_Number': 'steel-bracket-b1', 'Status': 'TRANSIT',
                                'Consuming_location': 'Station 5', 'Supplier': 'Apex Metalworks',
                                'QTY': 30, 'Part_Description': 'Heavy Duty Right-Angle Bracket',
                                'Status_Color': '#3b82f6', 'Active': true, 'Lead_Time': 5
                            }
                        });
                    }
                } catch (mhErr) {
                    console.warn('Could not create Material Handling tables:', mhErr);
                }
            } else if (templateId === 'material-request') {
                templateApp = createMaterialRequestTemplate();
                try {
                    const mrTable = await getOrCreateTableAndSeed(allTables, { name: 'Material_Requests', fields: [
                        { name: 'Item', type: 'text' }, { name: 'Requesting_Location', type: 'text' },
                        { name: 'Supplier', type: 'text' }, { name: 'Kanban_ID', type: 'text' },
                        { name: 'Quantity', type: 'number' }, { name: 'Status', type: 'text' },
                        { name: 'Status_Color', type: 'text' }, { name: 'Requestor', type: 'text' },
                        { name: 'Assignee', type: 'text' }, { name: 'Requested', type: 'datetime' },
                        { name: 'Started', type: 'datetime' }, { name: 'Completed', type: 'datetime' },
                        { name: 'Bin', type: 'text' }, { name: 'Compiled_by', type: 'text' },
                        { name: 'Ready_for_pick_time', type: 'datetime' }, { name: 'Delivered_by', type: 'text' }
                    ]});
                    const kcTable = await getOrCreateTableAndSeed(allTables, { name: 'Kanban_Cards', fields: [
                        { name: 'Part_Number', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Consuming_location', type: 'text' }, { name: 'Supplier', type: 'text' },
                        { name: 'QTY', type: 'number' }, { name: 'Part_Description', type: 'text' },
                        { name: 'Status_Color', type: 'text' }, { name: 'Image', type: 'text' },
                        { name: 'Active', type: 'boolean' }, { name: 'Lead_Time', type: 'number' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (mrTable?.id) { appStr = appStr.replace(/tbl_mr_material_requests/g, mrTable.id); tIds.push(mrTable.id); }
                    if (kcTable?.id) { appStr = appStr.replace(/tbl_mr_kanban_cards/g, kcTable.id); tIds.push(kcTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;

                    // Seed dummy data
                    if (mrTable?.id) {
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'DEMO-CYL-A1', 'Requesting_Location': 'Station 1',
                                'Supplier': 'Supplier A', 'Kanban_ID': 'KB-001',
                                'Quantity': 10, 'Status': 'REQUESTED',
                                'Status_Color': '#facc15', 'Requestor': 'Adam Veres',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'FASTENER-M6', 'Requesting_Location': 'Station 2',
                                'Supplier': 'Fastener Inc', 'Kanban_ID': 'KB-002',
                                'Quantity': 200, 'Status': 'ACTIVE',
                                'Status_Color': '#3b82f6', 'Requestor': 'Lianna Churchill',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'solenoid-valve-v2', 'Requesting_Location': 'Station 3',
                                'Supplier': 'SMC Pneumatics', 'Kanban_ID': 'KB-003',
                                'Quantity': 15, 'Status': 'ACTIVE',
                                'Status_Color': '#3b82f6', 'Requestor': 'Adam Veres',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'M4-MACHINE-SCREW', 'Requesting_Location': 'Station 4',
                                'Supplier': 'Fastener Inc', 'Kanban_ID': 'KB-004',
                                'Quantity': 500, 'Status': 'COMPLETED',
                                'Status_Color': '#22c55e', 'Requestor': 'David Miller',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'steel-bracket-b1', 'Requesting_Location': 'Station 5',
                                'Supplier': 'Apex Metalworks', 'Kanban_ID': 'KB-005',
                                'Quantity': 30, 'Status': 'CANCELLED',
                                'Status_Color': '#ef4444', 'Requestor': 'Sarah Jenkins',
                                'Requested': iso
                            }
                        });
                    }
                    if (kcTable?.id) {
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Part_Number': 'DEMO-CYL-A1', 'Status': 'EMPTY',
                                'Consuming_location': 'Station 1', 'Supplier': 'Supplier A',
                                'QTY': 10, 'Part_Description': 'Double-acting pneumatic cylinder',
                                'Status_Color': '#ef4444', 'Active': true, 'Lead_Time': 4
                            }
                        });
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Part_Number': 'FASTENER-M6', 'Status': 'FULL',
                                'Consuming_location': 'Station 2', 'Supplier': 'Fastener Inc',
                                'QTY': 200, 'Part_Description': 'M6 Socket Head Cap Screw',
                                'Status_Color': '#22c55e', 'Active': true, 'Lead_Time': 1
                            }
                        });
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Part_Number': 'solenoid-valve-v2', 'Status': 'EMPTY',
                                'Consuming_location': 'Station 3', 'Supplier': 'SMC Pneumatics',
                                'QTY': 15, 'Part_Description': '5/2 Way Solenoid Valve',
                                'Status_Color': '#ef4444', 'Active': true, 'Lead_Time': 3
                            }
                        });
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Part_Number': 'M4-MACHINE-SCREW', 'Status': 'FULL',
                                'Consuming_location': 'Station 4', 'Supplier': 'Fastener Inc',
                                'QTY': 500, 'Part_Description': 'M4 Machine Screw 12mm',
                                'Status_Color': '#22c55e', 'Active': true, 'Lead_Time': 2
                            }
                        });
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Part_Number': 'steel-bracket-b1', 'Status': 'TRANSIT',
                                'Consuming_location': 'Station 5', 'Supplier': 'Apex Metalworks',
                                'QTY': 30, 'Part_Description': 'Heavy Duty Right-Angle Bracket',
                                'Status_Color': '#3b82f6', 'Active': true, 'Lead_Time': 5
                            }
                        });
                    }
                } catch (mrErr) {
                    console.warn('Could not create Material Request tables:', mrErr);
                }
            } else if (templateId === 'material-loading-receiving') {
                templateApp = createMaterialLoadingReceivingTemplate();
                try {
                    const assetsTable = await getOrCreateTableAndSeed(allTables, { name: 'Equipment_Assets', fields: [
                        { name: 'Name', type: 'text' }, { name: 'Description', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Location', type: 'text' },
                        { name: 'Type', type: 'text' }, { name: 'Last_Calibration', type: 'datetime' },
                        { name: 'Calibration_Cadence', type: 'number' }, { name: 'Container_image', type: 'text' },
                        { name: 'Asset_Image', type: 'text' }, { name: 'User', type: 'text' }
                    ]});
                    const locationsTable = await getOrCreateTableAndSeed(allTables, { name: 'Locations', fields: [
                        { name: 'Location_Area', type: 'text' }, { name: 'Bin_Number', type: 'text' },
                        { name: 'Light_Kit_Number', type: 'number' }, { name: 'Type', type: 'text' },
                        { name: 'Status', type: 'text' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (assetsTable?.id) { appStr = appStr.replace(/tbl_mlr_assets/g, assetsTable.id); tIds.push(assetsTable.id); }
                    if (locationsTable?.id) { appStr = appStr.replace(/tbl_mlr_locations/g, locationsTable.id); tIds.push(locationsTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;

                    // Seed dummy data
                    if (assetsTable?.id) {
                        await addTableRecord({
                            tableId: assetsTable.id,
                            fields: {
                                'Name': 'Forklift #1', 'Description': 'Toyota electric forklift',
                                'Status': 'AVAILABLE', 'Location': 'Bay A',
                                'Type': 'Forklift', 'Calibration_Cadence': 365,
                                'User': 'Adam Veres'
                            }
                        });
                        await addTableRecord({
                            tableId: assetsTable.id,
                            fields: {
                                'Name': 'Pallet Jack #2', 'Description': 'Crown manual pallet jack',
                                'Status': 'AVAILABLE', 'Location': 'Receiving Dock',
                                'Type': 'Pallet Jack', 'Calibration_Cadence': 180,
                                'User': 'Lianna Churchill'
                            }
                        });
                        await addTableRecord({
                            tableId: assetsTable.id,
                            fields: {
                                'Name': 'Scales Station 1', 'Description': 'Mettler Toledo industrial platform scale',
                                'Status': 'IN_USE', 'Location': 'Station 1',
                                'Type': 'Weighing Scale', 'Calibration_Cadence': 90,
                                'User': 'Adam Veres'
                            }
                        });
                        await addTableRecord({
                            tableId: assetsTable.id,
                            fields: {
                                'Name': 'Overhead Crane A', 'Description': 'Demag 5-ton overhead hoist crane',
                                'Status': 'MAINTENANCE', 'Location': 'Bay B',
                                'Type': 'Crane', 'Calibration_Cadence': 365,
                                'User': 'David Miller'
                            }
                        });
                        await addTableRecord({
                            tableId: assetsTable.id,
                            fields: {
                                'Name': 'Barcode Scanner #5', 'Description': 'Zebra rugged industrial scanner gun',
                                'Status': 'AVAILABLE', 'Location': 'Tool Crib',
                                'Type': 'Barcode Gun', 'Calibration_Cadence': 180,
                                'User': 'Sarah Jenkins'
                            }
                        });
                    }
                    if (locationsTable?.id) {
                        await addTableRecord({
                            tableId: locationsTable.id,
                            fields: {
                                'Location_Area': 'Supermarket', 'Bin_Number': 'SUP-01',
                                'Light_Kit_Number': 1, 'Type': 'Supermarket', 'Status': 'ACTIVE'
                            }
                        });
                        await addTableRecord({
                            tableId: locationsTable.id,
                            fields: {
                                'Location_Area': 'Warehouse Area A', 'Bin_Number': 'BIN-04',
                                'Light_Kit_Number': 2, 'Type': 'Rack', 'Status': 'ACTIVE'
                            }
                        });
                        await addTableRecord({
                            tableId: locationsTable.id,
                            fields: {
                                'Location_Area': 'Receiving Dock', 'Bin_Number': 'REC-01',
                                'Light_Kit_Number': 3, 'Type': 'Dock', 'Status': 'ACTIVE'
                            }
                        });
                        await addTableRecord({
                            tableId: locationsTable.id,
                            fields: {
                                'Location_Area': 'Assembly Line 1', 'Bin_Number': 'ASSY-02',
                                'Light_Kit_Number': 4, 'Type': 'Workstation', 'Status': 'ACTIVE'
                            }
                        });
                        await addTableRecord({
                            tableId: locationsTable.id,
                            fields: {
                                'Location_Area': 'Quality Station', 'Bin_Number': 'QA-05',
                                'Light_Kit_Number': 5, 'Type': 'QA-Bin', 'Status': 'ACTIVE'
                            }
                        });
                    }
                } catch (mlrErr) {
                    console.warn('Could not create Material Loading tables:', mlrErr);
                }
            } else if (templateId === 'inventory-management') {
                templateApp = createInventoryManagementTemplate();
                try {
                    const mrTable = await getOrCreateTableAndSeed(allTables, { name: 'Material_Requests', fields: [
                        { name: 'Item', type: 'text' }, { name: 'Requesting_Location', type: 'text' },
                        { name: 'Supplier', type: 'text' }, { name: 'Kanban_ID', type: 'text' },
                        { name: 'Quantity', type: 'number' }, { name: 'Status', type: 'text' },
                        { name: 'Status_Color', type: 'text' }, { name: 'Requestor', type: 'text' },
                        { name: 'Assignee', type: 'text' }, { name: 'Requested', type: 'datetime' },
                        { name: 'Started', type: 'datetime' }, { name: 'Completed', type: 'datetime' },
                        { name: 'Bin', type: 'text' }, { name: 'Compiled_by', type: 'text' },
                        { name: 'Ready_for_pick_time', type: 'datetime' }, { name: 'Delivered_by', type: 'text' }
                    ]});
                    const kcTable = await getOrCreateTableAndSeed(allTables, { name: 'Kanban_Cards', fields: [
                        { name: 'Kanban_ID', type: 'text' },
                        { name: 'Part_Number', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Consuming_location', type: 'text' }, { name: 'Supplier', type: 'text' },
                        { name: 'QTY', type: 'number' }, { name: 'Part_Description', type: 'text' },
                        { name: 'Status_Color', type: 'text' }, { name: 'Image', type: 'text' },
                        { name: 'Active', type: 'boolean' }, { name: 'Lead_Time', type: 'number' }
                    ]});
                    const mdTable = await getOrCreateTableAndSeed(allTables, { name: 'Material_Definitions', fields: [
                        { name: 'ID', type: 'text' },
                        { name: 'Name', type: 'text' }, { name: 'Type', type: 'text' },
                        { name: 'Description', type: 'text' }, { name: 'Image', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Unit_Of_Measure', type: 'text' },
                        { name: 'Version_Revision', type: 'text' }, { name: 'Vendor_ID', type: 'text' },
                        { name: 'Target_Cycle_Time', type: 'number' }
                    ]});
                    const iiTable = await getOrCreateTableAndSeed(allTables, { name: 'Inventory_Items', fields: [
                        { name: 'ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Material_Definition_Type', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Location_ID', type: 'text' },
                        { name: 'Location_Area', type: 'text' }, { name: 'QTY', type: 'number' },
                        { name: 'Unit_Of_Measure', type: 'text' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (mrTable?.id) { appStr = appStr.replace(/tbl_im_material_requests/g, mrTable.id); tIds.push(mrTable.id); }
                    if (kcTable?.id) { appStr = appStr.replace(/tbl_im_kanban_cards/g, kcTable.id); tIds.push(kcTable.id); }
                    if (mdTable?.id) { appStr = appStr.replace(/tbl_im_material_definitions/g, mdTable.id); tIds.push(mdTable.id); }
                    if (iiTable?.id) { appStr = appStr.replace(/tbl_im_inventory_items/g, iiTable.id); tIds.push(iiTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;

                    // Seed dummy data
                    if (mrTable?.id) {
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'DEMO-CYL-A1', 'Requesting_Location': 'Station 1',
                                'Supplier': 'Supplier A', 'Kanban_ID': 'KB-001',
                                'Quantity': 10, 'Status': 'REQUESTED',
                                'Status_Color': '#facc15', 'Requestor': 'Adam Veres',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'FASTENER-M6', 'Requesting_Location': 'Station 2',
                                'Supplier': 'Fastener Inc', 'Kanban_ID': 'KB-002',
                                'Quantity': 200, 'Status': 'ACTIVE',
                                'Status_Color': '#3b82f6', 'Requestor': 'Lianna Churchill',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'solenoid-valve-v2', 'Requesting_Location': 'Station 3',
                                'Supplier': 'SMC Pneumatics', 'Kanban_ID': 'KB-003',
                                'Quantity': 15, 'Status': 'ACTIVE',
                                'Status_Color': '#3b82f6', 'Requestor': 'Adam Veres',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'M4-MACHINE-SCREW', 'Requesting_Location': 'Station 4',
                                'Supplier': 'Fastener Inc', 'Kanban_ID': 'KB-004',
                                'Quantity': 500, 'Status': 'COMPLETED',
                                'Status_Color': '#22c55e', 'Requestor': 'David Miller',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'steel-bracket-b1', 'Requesting_Location': 'Station 5',
                                'Supplier': 'Apex Metalworks', 'Kanban_ID': 'KB-005',
                                'Quantity': 30, 'Status': 'CANCELLED',
                                'Status_Color': '#ef4444', 'Requestor': 'Sarah Jenkins',
                                'Requested': iso
                            }
                        });
                    }
                    if (kcTable?.id) {
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Part_Number': 'DEMO-CYL-A1', 'Status': 'EMPTY',
                                'Consuming_location': 'Station 1', 'Supplier': 'Supplier A',
                                'QTY': 10, 'Part_Description': 'Double-acting pneumatic cylinder',
                                'Status_Color': '#ef4444', 'Active': true, 'Lead_Time': 4
                            }
                        });
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Part_Number': 'FASTENER-M6', 'Status': 'FULL',
                                'Consuming_location': 'Station 2', 'Supplier': 'Fastener Inc',
                                'QTY': 200, 'Part_Description': 'M6 Socket Head Cap Screw',
                                'Status_Color': '#22c55e', 'Active': true, 'Lead_Time': 1
                            }
                        });
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Part_Number': 'solenoid-valve-v2', 'Status': 'EMPTY',
                                'Consuming_location': 'Station 3', 'Supplier': 'SMC Pneumatics',
                                'QTY': 15, 'Part_Description': '5/2 Way Solenoid Valve',
                                'Status_Color': '#ef4444', 'Active': true, 'Lead_Time': 3
                            }
                        });
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Part_Number': 'M4-MACHINE-SCREW', 'Status': 'FULL',
                                'Consuming_location': 'Station 4', 'Supplier': 'Fastener Inc',
                                'QTY': 500, 'Part_Description': 'M4 Machine Screw 12mm',
                                'Status_Color': '#22c55e', 'Active': true, 'Lead_Time': 2
                            }
                        });
                        await addTableRecord({
                            tableId: kcTable.id,
                            fields: {
                                'Part_Number': 'steel-bracket-b1', 'Status': 'TRANSIT',
                                'Consuming_location': 'Station 5', 'Supplier': 'Apex Metalworks',
                                'QTY': 30, 'Part_Description': 'Heavy Duty Right-Angle Bracket',
                                'Status_Color': '#3b82f6', 'Active': true, 'Lead_Time': 5
                            }
                        });
                    }
                    if (mdTable?.id) {
                        await addTableRecord({
                            tableId: mdTable.id,
                            fields: {
                                'ID': 'DEMO-CYL-A1',
                                'Name': 'Double-acting cylinder', 'Type': 'Pneumatic',
                                'Description': 'DEMO-CYL-A1 assembly', 'Status': 'APPROVED',
                                'Unit_Of_Measure': 'pcs', 'Version_Revision': 'A',
                                'Vendor_ID': 'VEND-998', 'Target_Cycle_Time': 45
                            }
                        });
                        await addTableRecord({
                            tableId: mdTable.id,
                            fields: {
                                'ID': 'FASTENER-M6',
                                'Name': 'Socket Head Cap Screw', 'Type': 'Fastener',
                                'Description': 'FASTENER-M6 standard screw', 'Status': 'APPROVED',
                                'Unit_Of_Measure': 'pcs', 'Version_Revision': 'B',
                                'Vendor_ID': 'VEND-881', 'Target_Cycle_Time': 5
                            }
                        });
                        await addTableRecord({
                            tableId: mdTable.id,
                            fields: {
                                'ID': 'solenoid-valve-v2',
                                'Name': 'Solenoid Valve', 'Type': 'Pneumatic',
                                'Description': 'solenoid-valve-v2 24VDC', 'Status': 'APPROVED',
                                'Unit_Of_Measure': 'pcs', 'Version_Revision': 'A',
                                'Vendor_ID': 'VEND-202', 'Target_Cycle_Time': 30
                            }
                        });
                        await addTableRecord({
                            tableId: mdTable.id,
                            fields: {
                                'ID': 'M4-MACHINE-SCREW',
                                'Name': 'Machine Screw', 'Type': 'Fastener',
                                'Description': 'M4-MACHINE-SCREW 12mm steel', 'Status': 'APPROVED',
                                'Unit_Of_Measure': 'pcs', 'Version_Revision': 'C',
                                'Vendor_ID': 'VEND-881', 'Target_Cycle_Time': 3
                            }
                        });
                        await addTableRecord({
                            tableId: mdTable.id,
                            fields: {
                                'ID': 'steel-bracket-b1',
                                'Name': 'Steel Bracket', 'Type': 'Structure',
                                'Description': 'steel-bracket-b1 heavy duty bracket', 'Status': 'APPROVED',
                                'Unit_Of_Measure': 'pcs', 'Version_Revision': 'A',
                                'Vendor_ID': 'VEND-404', 'Target_Cycle_Time': 15
                            }
                        });
                    }
                    if (iiTable?.id) {
                        await addTableRecord({
                            tableId: iiTable.id,
                            fields: {
                                'ID': 'DEMO-CYL-A1_BIN-12',
                                'Material_Definition_ID': 'DEMO-CYL-A1', 'Material_Definition_Type': 'Pneumatic',
                                'Status': 'AVAILABLE', 'Location_ID': 'BIN-12',
                                'Location_Area': 'Rack A', 'QTY': 45, 'Unit_Of_Measure': 'pcs'
                            }
                        });
                        await addTableRecord({
                            tableId: iiTable.id,
                            fields: {
                                'ID': 'FASTENER-M6_BIN-04',
                                'Material_Definition_ID': 'FASTENER-M6', 'Material_Definition_Type': 'Fastener',
                                'Status': 'AVAILABLE', 'Location_ID': 'BIN-04',
                                'Location_Area': 'Rack B', 'QTY': 1200, 'Unit_Of_Measure': 'pcs'
                            }
                        });
                        await addTableRecord({
                            tableId: iiTable.id,
                            fields: {
                                'ID': 'solenoid-valve-v2_BIN-08',
                                'Material_Definition_ID': 'solenoid-valve-v2', 'Material_Definition_Type': 'Pneumatic',
                                'Status': 'RESTRICTED', 'Location_ID': 'BIN-08',
                                'Location_Area': 'QA Hold', 'QTY': 15, 'Unit_Of_Measure': 'pcs'
                            }
                        });
                        await addTableRecord({
                            tableId: iiTable.id,
                            fields: {
                                'ID': 'M4-MACHINE-SCREW_BIN-15',
                                'Material_Definition_ID': 'M4-MACHINE-SCREW', 'Material_Definition_Type': 'Fastener',
                                'Status': 'AVAILABLE', 'Location_ID': 'BIN-15',
                                'Location_Area': 'Rack C', 'QTY': 3500, 'Unit_Of_Measure': 'pcs'
                            }
                        });
                        await addTableRecord({
                            tableId: iiTable.id,
                            fields: {
                                'ID': 'steel-bracket-b1_BIN-22',
                                'Material_Definition_ID': 'steel-bracket-b1', 'Material_Definition_Type': 'Structure',
                                'Status': 'AVAILABLE', 'Location_ID': 'BIN-22',
                                'Location_Area': 'Rack D', 'QTY': 180, 'Unit_Of_Measure': 'pcs'
                            }
                        });
                    }
                } catch (imErr) {
                    console.warn('Could not create Inventory Management tables:', imErr);
                }
            } else if (templateId === 'kanban-inventory-system') {
                templateApp = createKanbanInventorySystemTemplate();
                try {
                    const partsTable = await getOrCreateTableAndSeed(allTables, { name: 'Material_Definitions', fields: [
                        { name: 'ID', type: 'text' },
                        { name: 'Name', type: 'text' }, { name: 'Type', type: 'text' },
                        { name: 'Description', type: 'text' }, { name: 'Status', type: 'text' }
                    ]});
                    const bomTable = await getOrCreateTableAndSeed(allTables, { name: 'BOM_Relations', fields: [
                        { name: 'Parent_Part', type: 'text' },
                        { name: 'Child_Part', type: 'text' },
                        { name: 'BOM_Qty', type: 'number' }
                    ]});
                    const supplyTable = await getOrCreateTableAndSeed(allTables, { name: 'Material_Supply', fields: [
                        { name: 'Part_No', type: 'text' },
                        { name: 'Part_Name', type: 'text' },
                        { name: 'Location_No', type: 'text' },
                        { name: 'Qty', type: 'number' },
                        { name: 'Datetime', type: 'datetime' }
                    ]});
                    const stockTable = await getOrCreateTableAndSeed(allTables, { name: 'Inventory_Items', fields: [
                        { name: 'ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' },
                        { name: 'Material_Definition_Type', type: 'text' },
                        { name: 'Status', type: 'text' },
                        { name: 'Location_ID', type: 'text' },
                        { name: 'Location_Area', type: 'text' },
                        { name: 'QTY', type: 'number' },
                        { name: 'Unit_Of_Measure', type: 'text' }
                    ]});
                    const kanbanTable = await getOrCreateTableAndSeed(allTables, { name: 'Kanban_Orders', fields: [
                        { name: 'Kanban_ID', type: 'text' },
                        { name: 'Parent_Part', type: 'text' },
                        { name: 'Sequence_No', type: 'number' },
                        { name: 'Child_Part', type: 'text' },
                        { name: 'BOM_Qty', type: 'number' },
                        { name: 'Status', type: 'text' }
                    ]});
                    const pickingTable = await getOrCreateTableAndSeed(allTables, { name: 'Material_Picking', fields: [
                        { name: 'Kanban_ID', type: 'text' },
                        { name: 'Part_No', type: 'text' },
                        { name: 'Part_Name', type: 'text' },
                        { name: 'Qty', type: 'number' },
                        { name: 'Datetime', type: 'datetime' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (partsTable?.id) { appStr = appStr.replace(/tbl_kis_parts/g, partsTable.id); tIds.push(partsTable.id); }
                    if (bomTable?.id) { appStr = appStr.replace(/tbl_kis_bom/g, bomTable.id); tIds.push(bomTable.id); }
                    if (supplyTable?.id) { appStr = appStr.replace(/tbl_kis_supply/g, supplyTable.id); tIds.push(supplyTable.id); }
                    if (stockTable?.id) { appStr = appStr.replace(/tbl_kis_stock/g, stockTable.id); tIds.push(stockTable.id); }
                    if (kanbanTable?.id) { appStr = appStr.replace(/tbl_kis_kanban/g, kanbanTable.id); tIds.push(kanbanTable.id); }
                    if (pickingTable?.id) { appStr = appStr.replace(/tbl_kis_picking/g, pickingTable.id); tIds.push(pickingTable.id); }

                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;

                    // Seed demo data matching user request
                    if (partsTable?.id) {
                        await addTableRecord({ tableId: partsTable.id, fields: { 'ID': 'P001', 'Name': 'Assy Engine', 'Type': 'Parent Part', 'Description': 'Engine Assembly Product', 'Status': 'APPROVED' } });
                        await addTableRecord({ tableId: partsTable.id, fields: { 'ID': 'C001', 'Name': 'Bolt M10', 'Type': 'Child Part', 'Description': 'Child Part Fasteners', 'Status': 'APPROVED' } });
                        await addTableRecord({ tableId: partsTable.id, fields: { 'ID': 'C002', 'Name': 'Nut M10', 'Type': 'Child Part', 'Description': 'Child Part Fasteners', 'Status': 'APPROVED' } });
                    }
                    if (bomTable?.id) {
                        await addTableRecord({ tableId: bomTable.id, fields: { 'Parent_Part': 'P001', 'Child_Part': 'C001', 'BOM_Qty': 4 } });
                        await addTableRecord({ tableId: bomTable.id, fields: { 'Parent_Part': 'P001', 'Child_Part': 'C002', 'BOM_Qty': 4 } });
                    }
                    if (stockTable?.id) {
                        await addTableRecord({ tableId: stockTable.id, fields: { 'ID': 'C001_WH-BIN-01', 'Material_Definition_ID': 'C001', 'Material_Definition_Type': 'Child Part', 'Status': 'AVAILABLE', 'Location_ID': 'WH-BIN-01', 'Location_Area': 'Warehouse 1', 'QTY': 100, 'Unit_Of_Measure': 'pcs' } });
                        await addTableRecord({ tableId: stockTable.id, fields: { 'ID': 'C002_WH-BIN-01', 'Material_Definition_ID': 'C002', 'Material_Definition_Type': 'Child Part', 'Status': 'AVAILABLE', 'Location_ID': 'WH-BIN-01', 'Location_Area': 'Warehouse 1', 'QTY': 80, 'Unit_Of_Measure': 'pcs' } });
                        await addTableRecord({ tableId: stockTable.id, fields: { 'ID': 'P001_WH-BIN-01', 'Material_Definition_ID': 'P001', 'Material_Definition_Type': 'Parent Part', 'Status': 'AVAILABLE', 'Location_ID': 'WH-BIN-01', 'Location_Area': 'Warehouse 1', 'QTY': 10, 'Unit_Of_Measure': 'pcs' } });
                    }
                } catch (kisErr) {
                    console.warn('Could not seed Kanban Inventory System tables:', kisErr);
                }
            } else if (templateId === 'inventory-dashboard') {
                templateApp = createInventoryDashboardTemplate();
                try {
                    const mrTable = await getOrCreateTableAndSeed(allTables, { name: 'Material_Requests', fields: [
                        { name: 'Item', type: 'text' }, { name: 'Requesting_Location', type: 'text' },
                        { name: 'Supplier', type: 'text' }, { name: 'Kanban_ID', type: 'text' },
                        { name: 'Quantity', type: 'number' }, { name: 'Status', type: 'text' },
                        { name: 'Status_Color', type: 'text' }, { name: 'Requestor', type: 'text' },
                        { name: 'Assignee', type: 'text' }, { name: 'Requested', type: 'datetime' },
                        { name: 'Started', type: 'datetime' }, { name: 'Completed', type: 'datetime' },
                        { name: 'Bin', type: 'text' }, { name: 'Compiled_by', type: 'text' },
                        { name: 'Ready_for_pick_time', type: 'datetime' }, { name: 'Delivered_by', type: 'text' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (mrTable?.id) { appStr = appStr.replace(/tbl_im_material_requests/g, mrTable.id); tIds.push(mrTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;

                    // Seed dummy data
                    if (mrTable?.id) {
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'DEMO-CYL-A1', 'Requesting_Location': 'Station 1',
                                'Supplier': 'Supplier A', 'Kanban_ID': 'KB-001',
                                'Quantity': 10, 'Status': 'REQUESTED',
                                'Status_Color': '#facc15', 'Requestor': 'Adam Veres',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'FASTENER-M6', 'Requesting_Location': 'Station 2',
                                'Supplier': 'Fastener Inc', 'Kanban_ID': 'KB-002',
                                'Quantity': 200, 'Status': 'ACTIVE',
                                'Status_Color': '#3b82f6', 'Requestor': 'Lianna Churchill',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'solenoid-valve-v2', 'Requesting_Location': 'Station 3',
                                'Supplier': 'SMC Pneumatics', 'Kanban_ID': 'KB-003',
                                'Quantity': 15, 'Status': 'ACTIVE',
                                'Status_Color': '#3b82f6', 'Requestor': 'Adam Veres',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'M4-MACHINE-SCREW', 'Requesting_Location': 'Station 4',
                                'Supplier': 'Fastener Inc', 'Kanban_ID': 'KB-004',
                                'Quantity': 500, 'Status': 'COMPLETED',
                                'Status_Color': '#22c55e', 'Requestor': 'David Miller',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'steel-bracket-b1', 'Requesting_Location': 'Station 5',
                                'Supplier': 'Apex Metalworks', 'Kanban_ID': 'KB-005',
                                'Quantity': 30, 'Status': 'CANCELLED',
                                'Status_Color': '#ef4444', 'Requestor': 'Sarah Jenkins',
                                'Requested': iso
                            }
                        });
                    }
                } catch (dbErr) {
                    console.warn('Could not create Inventory Dashboard tables:', dbErr);
                }
            } else if (templateId === 'replenishment') {
                templateApp = createReplenishmentTemplate();
                try {
                    const mrTable = await getOrCreateTableAndSeed(allTables, { name: 'Material_Requests', fields: [
                        { name: 'Item', type: 'text' }, { name: 'Requesting_Location', type: 'text' },
                        { name: 'Supplier', type: 'text' }, { name: 'Kanban_ID', type: 'text' },
                        { name: 'Quantity', type: 'number' }, { name: 'Status', type: 'text' },
                        { name: 'Status_Color', type: 'text' }, { name: 'Requestor', type: 'text' },
                        { name: 'Assignee', type: 'text' }, { name: 'Requested', type: 'datetime' },
                        { name: 'Started', type: 'datetime' }, { name: 'Completed', type: 'datetime' },
                        { name: 'Bin', type: 'text' }, { name: 'Compiled_by', type: 'text' },
                        { name: 'Ready_for_pick_time', type: 'datetime' }, { name: 'Delivered_by', type: 'text' }
                    ]});

                    const kbTable = await getOrCreateTableAndSeed(allTables, { name: 'Kanban_Cards', fields: [
                        { name: 'Part_Number', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Consuming_location', type: 'text' }, { name: 'Supplier', type: 'text' },
                        { name: 'QTY', type: 'number' }, { name: 'Part_Description', type: 'text' },
                        { name: 'Status_Color', type: 'text' }, { name: 'Image', type: 'text' },
                        { name: 'Active', type: 'boolean' }, { name: 'Lead_Time', type: 'number' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (mrTable?.id) { appStr = appStr.replace(/tbl_rep_material_requests/g, mrTable.id); tIds.push(mrTable.id); }
                    if (kbTable?.id) { appStr = appStr.replace(/tbl_rep_kanban_cards/g, kbTable.id); tIds.push(kbTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;

                    // Seed dummy data
                    if (mrTable?.id) {
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'DEMO-CYL-A1', 'Requesting_Location': 'Station 1',
                                'Supplier': 'Supplier A', 'Kanban_ID': 'KB-001',
                                'Quantity': 10, 'Status': 'REQUESTED',
                                'Status_Color': '#facc15', 'Requestor': 'Adam Veres',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'FASTENER-M6', 'Requesting_Location': 'Station 2',
                                'Supplier': 'Fastener Inc', 'Kanban_ID': 'KB-002',
                                'Quantity': 200, 'Status': 'ACTIVE',
                                'Status_Color': '#3b82f6', 'Requestor': 'Lianna Churchill',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'solenoid-valve-v2', 'Requesting_Location': 'Station 3',
                                'Supplier': 'SMC Pneumatics', 'Kanban_ID': 'KB-003',
                                'Quantity': 15, 'Status': 'ACTIVE',
                                'Status_Color': '#3b82f6', 'Requestor': 'Adam Veres',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'M4-MACHINE-SCREW', 'Requesting_Location': 'Station 4',
                                'Supplier': 'Fastener Inc', 'Kanban_ID': 'KB-004',
                                'Quantity': 500, 'Status': 'COMPLETED',
                                'Status_Color': '#22c55e', 'Requestor': 'David Miller',
                                'Requested': iso
                            }
                        });
                        await addTableRecord({
                            tableId: mrTable.id,
                            fields: {
                                'Item': 'steel-bracket-b1', 'Requesting_Location': 'Station 5',
                                'Supplier': 'Apex Metalworks', 'Kanban_ID': 'KB-005',
                                'Quantity': 30, 'Status': 'CANCELLED',
                                'Status_Color': '#ef4444', 'Requestor': 'Sarah Jenkins',
                                'Requested': iso
                            }
                        });
                    }
                    if (kbTable?.id) {
                        await addTableRecord({
                            tableId: kbTable.id,
                            fields: {
                                'Part_Number': 'DEMO-CYL-A1', 'Status': 'EMPTY',
                                'Consuming_location': 'Station 1', 'Supplier': 'Supplier A',
                                'QTY': 10, 'Part_Description': 'Double-acting pneumatic cylinder',
                                'Status_Color': '#ef4444', 'Active': true, 'Lead_Time': 4
                            }
                        });
                        await addTableRecord({
                            tableId: kbTable.id,
                            fields: {
                                'Part_Number': 'FASTENER-M6', 'Status': 'FULL',
                                'Consuming_location': 'Station 2', 'Supplier': 'Fastener Inc',
                                'QTY': 200, 'Part_Description': 'M6 Socket Head Cap Screw',
                                'Status_Color': '#22c55e', 'Active': true, 'Lead_Time': 1
                            }
                        });
                        await addTableRecord({
                            tableId: kbTable.id,
                            fields: {
                                'Part_Number': 'solenoid-valve-v2', 'Status': 'EMPTY',
                                'Consuming_location': 'Station 3', 'Supplier': 'SMC Pneumatics',
                                'QTY': 15, 'Part_Description': '5/2 Way Solenoid Valve',
                                'Status_Color': '#ef4444', 'Active': true, 'Lead_Time': 3
                            }
                        });
                        await addTableRecord({
                            tableId: kbTable.id,
                            fields: {
                                'Part_Number': 'M4-MACHINE-SCREW', 'Status': 'FULL',
                                'Consuming_location': 'Station 4', 'Supplier': 'Fastener Inc',
                                'QTY': 500, 'Part_Description': 'M4 Machine Screw 12mm',
                                'Status_Color': '#22c55e', 'Active': true, 'Lead_Time': 2
                            }
                        });
                        await addTableRecord({
                            tableId: kbTable.id,
                            fields: {
                                'Part_Number': 'steel-bracket-b1', 'Status': 'TRANSIT',
                                'Consuming_location': 'Station 5', 'Supplier': 'Apex Metalworks',
                                'QTY': 30, 'Part_Description': 'Heavy Duty Right-Angle Bracket',
                                'Status_Color': '#3b82f6', 'Active': true, 'Lead_Time': 5
                            }
                        });
                    }
                } catch (repErr) {
                    console.warn('Could not create Replenishment tables:', repErr);
                }
            } else if (templateId === 'material-warehouse') {
                templateApp = createMaterialWarehouseTemplate();
                try {
                    const invTable = await getOrCreateTableAndSeed(allTables, { name: 'Inventory_Items', fields: [
                        { name: 'ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Location_ID', type: 'text' },
                        { name: 'Location_Area', type: 'text' }, { name: 'QTY', type: 'number' },
                        { name: 'Unit_Of_Measure', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Material_Definition_Type', type: 'text' }
                    ]});

                    const mdTable = await getOrCreateTableAndSeed(allTables, { name: 'Material_Definitions', fields: [
                        { name: 'ID', type: 'text' },
                        { name: 'Name', type: 'text' }, { name: 'Type', type: 'text' },
                        { name: 'Description', type: 'text' }, { name: 'Image', type: 'text' },
                        { name: 'Status', type: 'text' }, { name: 'Unit_Of_Measure', type: 'text' },
                        { name: 'Version_Revision', type: 'text' }, { name: 'Vendor_ID', type: 'text' },
                        { name: 'Target_Cycle_Time', type: 'number' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (invTable?.id) { appStr = appStr.replace(/tbl_mw_inventory_items/g, invTable.id); tIds.push(invTable.id); }
                    if (mdTable?.id) { appStr = appStr.replace(/tbl_mw_material_definitions/g, mdTable.id); tIds.push(mdTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;

                    // Seed dummy data
                    if (invTable?.id) {
                        await addTableRecord({
                            tableId: invTable.id,
                            fields: {
                                'ID': 'DEMO-CYL-A1_BIN-12',
                                'Material_Definition_ID': 'DEMO-CYL-A1', 'Location_ID': 'BIN-12',
                                'Location_Area': 'Rack A', 'QTY': 45, 'Unit_Of_Measure': 'pcs',
                                'Status': 'AVAILABLE', 'Material_Definition_Type': 'Pneumatic'
                            }
                        });
                        await addTableRecord({
                            tableId: invTable.id,
                            fields: {
                                'ID': 'FASTENER-M6_BIN-04',
                                'Material_Definition_ID': 'FASTENER-M6', 'Location_ID': 'BIN-04',
                                'Location_Area': 'Rack B', 'QTY': 1200, 'Unit_Of_Measure': 'pcs',
                                'Status': 'AVAILABLE', 'Material_Definition_Type': 'Fastener'
                            }
                        });
                        await addTableRecord({
                            tableId: invTable.id,
                            fields: {
                                'ID': 'solenoid-valve-v2_BIN-08',
                                'Material_Definition_ID': 'solenoid-valve-v2', 'Location_ID': 'BIN-08',
                                'Location_Area': 'QA Hold', 'QTY': 15, 'Unit_Of_Measure': 'pcs',
                                'Status': 'RESTRICTED', 'Material_Definition_Type': 'Pneumatic'
                            }
                        });
                        await addTableRecord({
                            tableId: invTable.id,
                            fields: {
                                'ID': 'M4-MACHINE-SCREW_BIN-15',
                                'Material_Definition_ID': 'M4-MACHINE-SCREW', 'Location_ID': 'BIN-15',
                                'Location_Area': 'Rack C', 'QTY': 3500, 'Unit_Of_Measure': 'pcs',
                                'Status': 'AVAILABLE', 'Material_Definition_Type': 'Fastener'
                            }
                        });
                        await addTableRecord({
                            tableId: invTable.id,
                            fields: {
                                'ID': 'steel-bracket-b1_BIN-22',
                                'Material_Definition_ID': 'steel-bracket-b1', 'Location_ID': 'BIN-22',
                                'Location_Area': 'Rack D', 'QTY': 180, 'Unit_Of_Measure': 'pcs',
                                'Status': 'AVAILABLE', 'Material_Definition_Type': 'Structure'
                            }
                        });
                    }
                    if (mdTable?.id) {
                        await addTableRecord({
                            tableId: mdTable.id,
                            fields: {
                                'ID': 'DEMO-CYL-A1',
                                'Name': 'Double-acting cylinder', 'Type': 'Pneumatic',
                                'Description': 'DEMO-CYL-A1 assembly', 'Status': 'APPROVED',
                                'Unit_Of_Measure': 'pcs', 'Version_Revision': 'A',
                                'Vendor_ID': 'VEND-998', 'Target_Cycle_Time': 45
                            }
                        });
                        await addTableRecord({
                            tableId: mdTable.id,
                            fields: {
                                'ID': 'FASTENER-M6',
                                'Name': 'Socket Head Cap Screw', 'Type': 'Fastener',
                                'Description': 'FASTENER-M6 standard screw', 'Status': 'APPROVED',
                                'Unit_Of_Measure': 'pcs', 'Version_Revision': 'B',
                                'Vendor_ID': 'VEND-881', 'Target_Cycle_Time': 5
                            }
                        });
                        await addTableRecord({
                            tableId: mdTable.id,
                            fields: {
                                'ID': 'solenoid-valve-v2',
                                'Name': 'Solenoid Valve', 'Type': 'Pneumatic',
                                'Description': 'solenoid-valve-v2 24VDC', 'Status': 'APPROVED',
                                'Unit_Of_Measure': 'pcs', 'Version_Revision': 'A',
                                'Vendor_ID': 'VEND-202', 'Target_Cycle_Time': 30
                            }
                        });
                        await addTableRecord({
                            tableId: mdTable.id,
                            fields: {
                                'ID': 'M4-MACHINE-SCREW',
                                'Name': 'Machine Screw', 'Type': 'Fastener',
                                'Description': 'M4-MACHINE-SCREW 12mm steel', 'Status': 'APPROVED',
                                'Unit_Of_Measure': 'pcs', 'Version_Revision': 'C',
                                'Vendor_ID': 'VEND-881', 'Target_Cycle_Time': 3
                            }
                        });
                        await addTableRecord({
                            tableId: mdTable.id,
                            fields: {
                                'ID': 'steel-bracket-b1',
                                'Name': 'Steel Bracket', 'Type': 'Structure',
                                'Description': 'steel-bracket-b1 heavy duty bracket', 'Status': 'APPROVED',
                                'Unit_Of_Measure': 'pcs', 'Version_Revision': 'A',
                                'Vendor_ID': 'VEND-404', 'Target_Cycle_Time': 15
                            }
                        });
                    }
                } catch (mwErr) {
                    console.warn('Could not create Material Warehouse tables:', mwErr);
                }
            } else if (templateId === 'quality-inspection-suite') {
                templateApp = createQualityInspectionSuiteTemplate();
                try {
                    const plTable = await getOrCreateTableAndSeed(allTables, { name: 'Inspection_Plans', fields: [
                        { name: 'Product_ID', type: 'text' }, { name: 'Inspection_Name', type: 'text' },
                        { name: 'Inspection_Description', type: 'text' }, { name: 'Target', type: 'number' },
                        { name: 'UoM', type: 'text' }
                    ]});

                    const rsTable = await getOrCreateTableAndSeed(allTables, { name: 'Inspection_Results', fields: [
                        { name: 'Work_Order_ID', type: 'text' }, { name: 'Inspection_Plan_ID', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Recorded_Value', type: 'number' },
                        { name: 'Status', type: 'text' }, { name: 'Comments', type: 'text' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (plTable?.id) { appStr = appStr.replace(/tbl_qi_inspection_plans/g, plTable.id); tIds.push(plTable.id); }
                    if (rsTable?.id) { appStr = appStr.replace(/tbl_qi_inspection_results/g, rsTable.id); tIds.push(rsTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;

                    // Pre-populate with sample dynamic inspection plans
                    if (plTable?.id) {
                        await addTableRecord({
                            tableId: plTable.id,
                            fields: {
                                'Product_ID': 'DEMO-CYL-B1',
                                'Inspection_Name': 'Weight check',
                                'Inspection_Description': 'Weigh the unit',
                                'Target': 200,
                                'UoM': 'g'
                            }
                        });
                        await addTableRecord({
                            tableId: plTable.id,
                            fields: {
                                'Product_ID': 'DEMO-CYL-B1',
                                'Inspection_Name': 'Functional test',
                                'Inspection_Description': 'Applying the recommended pressure...',
                                'Target': 5,
                                'UoM': 'bar'
                            }
                        });
                        await addTableRecord({
                            tableId: plTable.id,
                            fields: {
                                'Product_ID': 'DEMO-CYL-A1',
                                'Inspection_Name': 'Dimensional validation',
                                'Inspection_Description': 'Measure the cylinder outer diameter',
                                'Target': 25,
                                'UoM': 'mm'
                            }
                        });
                        await addTableRecord({
                            tableId: plTable.id,
                            fields: {
                                'Product_ID': 'solenoid-valve-v2',
                                'Inspection_Name': 'Voltage check',
                                'Inspection_Description': 'Ensure solenoid actuation voltage matches spec',
                                'Target': 24,
                                'UoM': 'V'
                            }
                        });
                        await addTableRecord({
                            tableId: plTable.id,
                            fields: {
                                'Product_ID': 'steel-bracket-b1',
                                'Inspection_Name': 'Deflection load test',
                                'Inspection_Description': 'Apply 50kg force and measure bending deflection',
                                'Target': 0.1,
                                'UoM': 'mm'
                            }
                        });
                    }
                    if (rsTable?.id) {
                        await addTableRecord({
                            tableId: rsTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-51130425022025',
                                'Inspection_Plan_ID': 'Weight check',
                                'Operator': 'Adam Veres',
                                'Recorded_Value': 200.5,
                                'Status': 'PASS',
                                'Comments': 'Perfectly within variance limit.'
                            }
                        });
                        await addTableRecord({
                            tableId: rsTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-51130425022025',
                                'Inspection_Plan_ID': 'Functional test',
                                'Operator': 'Adam Veres',
                                'Recorded_Value': 4.2,
                                'Status': 'FAIL',
                                'Comments': 'Pressure did not sustain. Seal leakage detected.'
                            }
                        });
                        await addTableRecord({
                            tableId: rsTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-8874102941',
                                'Inspection_Plan_ID': 'Dimensional validation',
                                'Operator': 'Lianna Churchill',
                                'Recorded_Value': 25.02,
                                'Status': 'PASS',
                                'Comments': 'Within tolerance.'
                            }
                        });
                        await addTableRecord({
                            tableId: rsTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-8874102942',
                                'Inspection_Plan_ID': 'Voltage check',
                                'Operator': 'David Miller',
                                'Recorded_Value': 24.1,
                                'Status': 'PASS',
                                'Comments': 'Actuated instantly.'
                            }
                        });
                        await addTableRecord({
                            tableId: rsTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-8874102943',
                                'Inspection_Plan_ID': 'Deflection load test',
                                'Operator': 'Sarah Jenkins',
                                'Recorded_Value': 0.08,
                                'Status': 'PASS',
                                'Comments': 'High rigidity confirmed.'
                            }
                        });
                    }
                } catch (qiErr) {
                    console.warn('Could not create Quality Inspection tables:', qiErr);
                }
            } else if (templateId === 'hc-cylinder-inspection') {
                templateApp = createHydraulicCylinderInspectionTemplate();
                try {
                    const hcTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'HC_Inspections',
                        fields: [
                            { name: 'Work_Order',      type: 'text' },
                            { name: 'Part_Number',     type: 'text' },
                            { name: 'Serial_Number',   type: 'text' },
                            { name: 'Operator',        type: 'text' },
                            { name: 'Bore_Diameter',   type: 'number' },
                            { name: 'Rod_Diameter',    type: 'number' },
                            { name: 'Stroke_Length',   type: 'number' },
                            { name: 'Press_Proof',     type: 'number' },
                            { name: 'Press_Working',   type: 'number' },
                            { name: 'Visual_Rod',      type: 'text' },
                            { name: 'Visual_Piston',   type: 'text' },
                            { name: 'Overall_Result',  type: 'text' },
                            { name: 'Notes',           type: 'text' },
                            { name: 'Signature',       type: 'text' },
                        ]
                    });
                    let appStr = JSON.stringify(templateApp);
                    if (hcTable?.id) { appStr = appStr.replace(/tbl_hc_inspections/g, hcTable.id); }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = hcTable?.id ? [hcTable.id] : [];

                    // Seed sample data
                    if (hcTable?.id) {
                        await addTableRecord({ tableId: hcTable.id, fields: {
                            'Work_Order': 'WO-HC-2026-001', 'Part_Number': 'HC-2024-001',
                            'Serial_Number': 'SN-20260528-001', 'Operator': 'Ahmad Fauzi',
                            'Bore_Diameter': 80.012, 'Rod_Diameter': 56.008,
                            'Stroke_Length': 500.3, 'Press_Proof': 252.0,
                            'Press_Working': 161.5, 'Visual_Rod': 'PASS — Bersih, mulus',
                            'Visual_Piston': 'PASS — Bersih, mulus',
                            'Overall_Result': 'PASS — Sesuai Spesifikasi',
                            'Notes': 'Semua parameter dalam batas toleransi. Cylinder siap digunakan.',
                            'Signature': 'Ahmad Fauzi'
                        }});
                    }
                } catch (hcErr) {
                    console.warn('Could not create HC Inspection table:', hcErr);
                }
            } else if (templateId === 'product-drawing-inspection') {
                templateApp = createProductDrawingInspectionTemplate();
                try {
                    const plTable = await getOrCreateTableAndSeed(allTables, { name: 'Inspection_Plans', fields: [
                        { name: 'Product_ID', type: 'text' }, { name: 'Inspection_Name', type: 'text' },
                        { name: 'Inspection_Description', type: 'text' }, { name: 'Target', type: 'number' },
                        { name: 'UoM', type: 'text' }
                    ]});

                    const rsTable = await getOrCreateTableAndSeed(allTables, { name: 'Inspection_Results', fields: [
                        { name: 'Work_Order_ID', type: 'text' }, { name: 'Inspection_Plan_ID', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Recorded_Value', type: 'number' },
                        { name: 'Status', type: 'text' }, { name: 'Comments', type: 'text' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (plTable?.id) { appStr = appStr.replace(/tbl_qi_inspection_plans/g, plTable.id); tIds.push(plTable.id); }
                    if (rsTable?.id) { appStr = appStr.replace(/tbl_qi_inspection_results/g, rsTable.id); tIds.push(rsTable.id); }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (qiErr) {
                    console.warn('Could not create Quality Inspection tables for product drawing inspection:', qiErr);
                }
            } else if (templateId === 'frontline-qms') {
                templateApp = createFrontlineQmsTemplate();
                try {
                    const dfTable = await getOrCreateTableAndSeed(allTables, { name: 'Defect_Events', fields: [
                        { name: 'Work_Order_ID', type: 'text' }, { name: 'Unit_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Reason', type: 'text' },
                        { name: 'Description', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Operator', type: 'text' }
                    ]});

                    const cpTable = await getOrCreateTableAndSeed(allTables, { name: 'CAPA_Incidents', fields: [
                        { name: 'Defect_Event_ID', type: 'text' }, { name: 'Root_Cause', type: 'text' },
                        { name: 'Action_Plan', type: 'text' }, { name: 'Assigned_To', type: 'text' },
                        { name: 'Status', type: 'text' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (dfTable?.id) { appStr = appStr.replace(/tbl_qms_defect_events/g, dfTable.id); tIds.push(dfTable.id); }
                    if (cpTable?.id) { appStr = appStr.replace(/tbl_qms_capa_incidents/g, cpTable.id); tIds.push(cpTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;

                    // Pre-populate with a sample active defect event matching Screenshot 1
                    if (dfTable?.id) {
                        await addTableRecord({
                            tableId: dfTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-51130425022025',
                                'Unit_ID': 'PU-58130425022025',
                                'Material_Definition_ID': 'DEMO-CYL-A1',
                                'Reason': "Inspection with ID 'INSP_PU-581304250220258757' failed.",
                                'Description': 'Visual inspection failed due to cylinder misalignment at alignment reference point 1.',
                                'Status': 'PENDING MRB REVIEW',
                                'Operator': 'Adam Veres'
                            }
                        });
                        await addTableRecord({
                            tableId: dfTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-51130425022026',
                                'Unit_ID': 'PU-58130425022029',
                                'Material_Definition_ID': 'FASTENER-M6',
                                'Reason': 'Thread pitch out of tolerance',
                                'Description': 'Thread pitch checker rejected screw due to tight mating fit.',
                                'Status': 'SCRAP',
                                'Operator': 'Lianna Churchill'
                            }
                        });
                        await addTableRecord({
                            tableId: dfTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-8874102941',
                                'Unit_ID': 'PU-98210398',
                                'Material_Definition_ID': 'solenoid-valve-v2',
                                'Reason': 'Coil short-circuit',
                                'Description': 'Actuation test failed during high-temperature run. Internal coil shorted.',
                                'Status': 'UNDER REWORK',
                                'Operator': 'David Miller'
                            }
                        });
                        await addTableRecord({
                            tableId: dfTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-8874102942',
                                'Unit_ID': 'PU-98210405',
                                'Material_Definition_ID': 'steel-bracket-b1',
                                'Reason': 'Surface finish scratches',
                                'Description': 'Zinc coating scratched off during transfer from stamping die.',
                                'Status': 'APPROVED AS IS',
                                'Operator': 'Sarah Jenkins'
                            }
                        });
                        await addTableRecord({
                            tableId: dfTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-8874102943',
                                'Unit_ID': 'PU-98210412',
                                'Material_Definition_ID': 'DEMO-CYL-A1',
                                'Reason': 'End-cap seal leak',
                                'Description': 'Air pressure bubbled at end cap under 6 bar static load.',
                                'Status': 'PENDING MRB REVIEW',
                                'Operator': 'David Miller'
                            }
                        });
                    }
                    if (cpTable?.id) {
                        await addTableRecord({
                            tableId: cpTable.id,
                            fields: {
                                'Defect_Event_ID': 'PU-58130425022025',
                                'Root_Cause': 'Die wear on alignment press',
                                'Action_Plan': 'Regrind and re-align die 4 on the alignment press.',
                                'Assigned_To': 'Maintenance Group A',
                                'Status': 'OPEN'
                            }
                        });
                        await addTableRecord({
                            tableId: cpTable.id,
                            fields: {
                                'Defect_Event_ID': 'PU-58130425022029',
                                'Root_Cause': 'Vendor incoming quality control failure',
                                'Action_Plan': 'Issue formal CAR to Fastener Inc. Audit incoming batch 88A.',
                                'Assigned_To': 'Supplier Quality Engineering',
                                'Status': 'OPEN'
                            }
                        });
                        await addTableRecord({
                            tableId: cpTable.id,
                            fields: {
                                'Defect_Event_ID': 'PU-98210398',
                                'Root_Cause': 'Excessive heat at testing station',
                                'Action_Plan': 'Install cooling duct to testing station 2.',
                                'Assigned_To': 'Facilities Team',
                                'Status': 'CLOSED'
                            }
                        });
                        await addTableRecord({
                            tableId: cpTable.id,
                            fields: {
                                'Defect_Event_ID': 'PU-98210405',
                                'Root_Cause': 'Chute friction on stamping press',
                                'Action_Plan': 'Add Teflon lining to discharge chute.',
                                'Assigned_To': 'Stamping Operator Team',
                                'Status': 'CLOSED'
                            }
                        });
                        await addTableRecord({
                            tableId: cpTable.id,
                            fields: {
                                'Defect_Event_ID': 'PU-98210412',
                                'Root_Cause': 'O-ring seal pinch during assembly',
                                'Action_Plan': 'Lubricate seal groove prior to end-cap press.',
                                'Assigned_To': 'Assembly Line 1 Supervisor',
                                'Status': 'OPEN'
                            }
                        });
                    }
                } catch (qmsErr) {
                    console.warn('Could not create Frontline QMS tables:', qmsErr);
                }
            } else if (templateId === 'material-review-board') {
                templateApp = createMaterialReviewBoardTemplate();
                try {
                    const dfTable = await getOrCreateTableAndSeed(allTables, { name: 'Defect_Events', fields: [
                        { name: 'Work_Order_ID', type: 'text' }, { name: 'Unit_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Reason', type: 'text' },
                        { name: 'Description', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Operator', type: 'text' }, { name: 'Disposition', type: 'text' },
                        { name: 'MRB_Justification', type: 'text' }, { name: 'Rework_Instructions', type: 'text' },
                        { name: 'Rework_Assignee', type: 'text' }, { name: 'Rework_Station', type: 'text' },
                        { name: 'Upload_Evidence', type: 'text' }
                    ]});

                    const woTable = await getOrCreateTableAndSeed(allTables, { name: 'Work_Orders', fields: [
                        { name: 'Operator', type: 'text' }, { name: 'Parent_Order_ID', type: 'text' },
                        { name: 'Material_Definition_ID', type: 'text' }, { name: 'Status', type: 'text' },
                        { name: 'Location', type: 'text' }, { name: 'QTY_Required', type: 'number' },
                        { name: 'QTY_Complete', type: 'number' }, { name: 'QTY_Scrap', type: 'number' },
                        { name: 'Due_Date', type: 'datetime' }, { name: 'Start_Date', type: 'datetime' },
                        { name: 'Complete_Date', type: 'datetime' }, { name: 'Customer_ID', type: 'text' }
                    ]});

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (dfTable?.id) { appStr = appStr.replace(/tbl_mrb_defect_events/g, dfTable.id); tIds.push(dfTable.id); }
                    if (woTable?.id) { appStr = appStr.replace(/tbl_mrb_work_orders/g, woTable.id); tIds.push(woTable.id); }
                    
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;

                    // Pre-populate with sample defect records
                    if (dfTable?.id) {
                        await addTableRecord({
                            tableId: dfTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-8874102941',
                                'Unit_ID': 'PU-98210398',
                                'Material_Definition_ID': 'DEMO-CYL-B1',
                                'Reason': 'Visual check misalignment',
                                'Description': 'Cylinder rod off-center by 1.2mm during high-pressure validation.',
                                'Status': 'PENDING MRB REVIEW',
                                'Operator': 'Lianna Churchill'
                            }
                        });

                        await addTableRecord({
                            tableId: dfTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-8874102941',
                                'Unit_ID': 'PU-98210399',
                                'Material_Definition_ID': 'DEMO-CYL-B1',
                                'Reason': 'Pressure leak on seal',
                                'Description': 'Seal pressure drop exceeded 0.5 bar/min during end-cap testing.',
                                'Status': 'PENDING MRB REVIEW',
                                'Operator': 'Adam Veres'
                            }
                        });

                        await addTableRecord({
                            tableId: dfTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-51130425022026',
                                'Unit_ID': 'PU-58130425022029',
                                'Material_Definition_ID': 'FASTENER-M6',
                                'Reason': 'Thread pitch out of tolerance',
                                'Description': 'Thread pitch checker rejected screw due to tight mating fit.',
                                'Status': 'SCRAP',
                                'Operator': 'Lianna Churchill',
                                'Disposition': 'SCRAP',
                                'MRB_Justification': 'Fasteners cannot be cost-effectively reworked.'
                            }
                        });

                        await addTableRecord({
                            tableId: dfTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-8874102941',
                                'Unit_ID': 'PU-98210405',
                                'Material_Definition_ID': 'steel-bracket-b1',
                                'Reason': 'Surface finish scratches',
                                'Description': 'Zinc coating scratched off during transfer from stamping die.',
                                'Status': 'APPROVED AS IS',
                                'Operator': 'Sarah Jenkins',
                                'Disposition': 'USE AS IS',
                                'MRB_Justification': 'Structural integrity unaffected. Cosmetics acceptable for hidden internal chassis location.'
                            }
                        });

                        await addTableRecord({
                            tableId: dfTable.id,
                            fields: {
                                'Work_Order_ID': 'WO-8874102941',
                                'Unit_ID': 'PU-98210412',
                                'Material_Definition_ID': 'solenoid-valve-v2',
                                'Reason': 'Coil short-circuit',
                                'Description': 'Actuation test failed during high-temperature run. Internal coil shorted.',
                                'Status': 'REWORKED',
                                'Operator': 'David Miller',
                                'Disposition': 'REWORK',
                                'MRB_Justification': 'Solenoid assembly coil block swapped and re-potted.',
                                'Rework_Instructions': 'Swap solenoid coil block with a certified QA stock unit, re-pot, and cycle-test 20 times.',
                                'Rework_Assignee': 'David Miller',
                                'Rework_Station': 'Rework Station 1'
                            }
                        });
                    }
                    if (woTable?.id) {
                        await addTableRecord({
                            tableId: woTable.id,
                            fields: {
                                'Operator': 'Adam Veres',
                                'Parent_Order_ID': 'WO-8874102941',
                                'Material_Definition_ID': 'DEMO-CYL-B1',
                                'Status': 'RUNNING',
                                'Location': 'Assembly Line 1',
                                'QTY_Required': 100,
                                'QTY_Complete': 45,
                                'QTY_Scrap': 2,
                                'Due_Date': iso,
                                'Start_Date': iso,
                                'Customer_ID': 'CUST-HONDA'
                            }
                        });
                        await addTableRecord({
                            tableId: woTable.id,
                            fields: {
                                'Operator': 'Lianna Churchill',
                                'Parent_Order_ID': 'WO-51130425022026',
                                'Material_Definition_ID': 'FASTENER-M6',
                                'Status': 'COMPLETED',
                                'Location': 'Stamping Station 2',
                                'QTY_Required': 5000,
                                'QTY_Complete': 5000,
                                'QTY_Scrap': 12,
                                'Due_Date': iso,
                                'Start_Date': iso,
                                'Complete_Date': iso,
                                'Customer_ID': 'CUST-TOYOTA'
                            }
                        });
                        await addTableRecord({
                            tableId: woTable.id,
                            fields: {
                                'Operator': 'David Miller',
                                'Parent_Order_ID': 'WO-8874102942',
                                'Material_Definition_ID': 'solenoid-valve-v2',
                                'Status': 'PLANNED',
                                'Location': 'Sub-assembly 3',
                                'QTY_Required': 250,
                                'QTY_Complete': 0,
                                'QTY_Scrap': 0,
                                'Due_Date': iso,
                                'Customer_ID': 'CUST-FORD'
                            }
                        });
                        await addTableRecord({
                            tableId: woTable.id,
                            fields: {
                                'Operator': 'Sarah Jenkins',
                                'Parent_Order_ID': 'WO-8874102943',
                                'Material_Definition_ID': 'steel-bracket-b1',
                                'Status': 'RUNNING',
                                'Location': 'Stamping Area 1',
                                'QTY_Required': 1500,
                                'QTY_Complete': 980,
                                'QTY_Scrap': 8,
                                'Due_Date': iso,
                                'Start_Date': iso,
                                'Customer_ID': 'CUST-TESLA'
                            }
                        });
                        await addTableRecord({
                            tableId: woTable.id,
                            fields: {
                                'Operator': 'Adam Veres',
                                'Parent_Order_ID': 'WO-8874102944',
                                'Material_Definition_ID': 'DEMO-CYL-A1',
                                'Status': 'COMPLETED',
                                'Location': 'Assembly Line 1',
                                'QTY_Required': 80,
                                'QTY_Complete': 80,
                                'QTY_Scrap': 1,
                                'Due_Date': iso,
                                'Start_Date': iso,
                                'Complete_Date': iso,
                                'Customer_ID': 'CUST-GM'
                            }
                        });
                    }
                } catch (mrbErr) {
                    console.warn('Could not create Material Review Board tables:', mrbErr);
                }
            } else if (templateId === 'smarthome-iot') {
                templateApp = createSmartHomeTemplate();
            } else if (templateId === 'plc-hmi-terminal') {
                templateApp = createPlcHmiTerminalTemplate();
            } else {
                toast.error('Template not found', { id: loadingToast });
                return;
            }

            const { id, ...templateData } = templateApp;
            const templateObj = templates.find(t => t.id === templateId);
            const templateVersion = templateObj?.version || 1;

            const appPayload = {
                ...templateData,
                config: {
                    ...(templateData.config || {}),
                    isLocked: true
                },
                version: templateVersion,
                updated_at: new Date().toISOString()
            };

            if (existingAppId) {
                appPayload.id = existingAppId;
                const existingDbApp = dbApps.find(a => a.id === existingAppId);
                if (existingDbApp) {
                    appPayload.name = existingDbApp.name;
                    appPayload.is_published = existingDbApp.is_published;
                    appPayload.approval_status = existingDbApp.approval_status;
                }
            } else {
                appPayload.is_published = false;
                appPayload.approval_status = 'DRAFT';
            }

            const savedApp = await saveFrontlineApp(appPayload);

            // Connect same-named/similar tables using linked record fields and seed their links
            if (savedApp && savedApp.config && savedApp.config.appTables) {
                try {
                    await connectAppTablesAndSeedLinks(savedApp.config.appTables);
                } catch (linkErr) {
                    console.error('Error connecting app tables:', linkErr);
                }
            }

            if (existingAppId) {
                toast.success(`${templateApp.name} updated successfully!`, { id: loadingToast });
            } else {
                toast.success(`${templateApp.name} installed successfully!`, { id: loadingToast });
            }

            if (existingAppId) {
                try {
                    const apps = await getAllFrontlineApps();
                    setDbApps(apps || []);
                } catch (refreshErr) {
                    console.error('[AppStore] Failed to refresh apps after update:', refreshErr);
                }
            } else {
                // Mark template as used (installed) and persist mapping
                setInstalledTemplates(prev => {
                    const next = { ...prev, [templateId]: savedApp.id };
                    localStorage.setItem('installedAppStoreTemplates', JSON.stringify(next));
                    return next;
                });

                // Navigate to builder for the new app
                setTimeout(() => {
                    navigate(`/builder?id=${savedApp.id}`);
                }, 1000);
            }

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
                                    {(() => {
                                        const appId = installedTemplates[t.id];
                                        if (!appId) {
                                            return (
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
                                            );
                                        }

                                        const dbApp = dbApps.find(app => app.id === appId);
                                        const installedVersion = dbApp ? (dbApp.version || 1) : 1;
                                        const templateVersion = t.version || 1;
                                        const hasUpdate = dbApp && (templateVersion > installedVersion);

                                        if (hasUpdate) {
                                            return (
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <div
                                                        style={{
                                                            padding: '8px 12px', borderRadius: '12px', border: '1px solid #f97316',
                                                            backgroundColor: '#fff7ed', color: '#ea580c', fontWeight: 700,
                                                            fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px',
                                                            cursor: 'default', animation: 'pulse 2s infinite'
                                                        }}
                                                        title={`Version ${installedVersion} installed. Version ${templateVersion} available.`}
                                                    >
                                                        <Sparkles size={12} /> Update Available (v{templateVersion})
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleInstall(t.id, appId);
                                                        }}
                                                        disabled={installingId !== null}
                                                        style={{
                                                            padding: '10px 16px', borderRadius: '12px', border: 'none',
                                                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                                            color: 'white', fontWeight: 800,
                                                            fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                                            transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
                                                            opacity: installingId !== null ? 0.7 : 1
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                                                        onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                                                    >
                                                        {installingId === t.id ? 'Updating...' : 'Update'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleUninstall(e, t.id)}
                                                        style={{
                                                            padding: '10px 12px', borderRadius: '12px', border: 'none',
                                                            backgroundColor: '#ef4444', color: 'white', fontWeight: 800,
                                                            fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                                            transition: 'all 0.2s', boxShadow: `0 4px 12px rgba(239, 68, 68, 0.4)`
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                                                        onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div
                                                    style={{
                                                        padding: '10px 20px', borderRadius: '12px', border: '2px solid #22c55e',
                                                        backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 800,
                                                        fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
                                                        cursor: 'default'
                                                    }}
                                                >
                                                    <CheckCircle2 size={14} /> Used
                                                </div>
                                                <button
                                                    onClick={(e) => handleUninstall(e, t.id)}
                                                    style={{
                                                        padding: '10px 16px', borderRadius: '12px', border: 'none',
                                                        backgroundColor: '#ef4444', color: 'white', fontWeight: 800,
                                                        fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                                        transition: 'all 0.2s', boxShadow: `0 4px 12px rgba(239, 68, 68, 0.4)`
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                                                    onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                                                >
                                                    <Trash2 size={14} /> Uninstall
                                                </button>
                                            </div>
                                        );
                                    })()}
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
                            {(() => {
                                const appId = installedTemplates[selectedGuide.id];
                                if (appId) {
                                    const dbApp = dbApps.find(app => app.id === appId);
                                    const installedVersion = dbApp ? (dbApp.version || 1) : 1;
                                    const templateVersion = selectedGuide.version || 1;
                                    const hasUpdate = dbApp && (templateVersion > installedVersion);

                                    if (hasUpdate) {
                                        return (
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div
                                                    style={{
                                                        padding: '10px 18px', borderRadius: '12px', border: '1px solid #f97316',
                                                        backgroundColor: '#fff7ed', color: '#ea580c', fontWeight: 800,
                                                        fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
                                                        cursor: 'default'
                                                    }}
                                                >
                                                    <Sparkles size={14} /> Update Available (v{installedVersion} → v{templateVersion})
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        handleInstall(selectedGuide.id, appId);
                                                        setSelectedGuide(null);
                                                    }}
                                                    disabled={installingId !== null}
                                                    style={{
                                                        padding: '12px 32px', borderRadius: '14px', border: 'none',
                                                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                                        color: 'white', fontWeight: 800,
                                                        fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
                                                        opacity: installingId !== null ? 0.7 : 1
                                                    }}
                                                >
                                                    {installingId === selectedGuide.id ? 'Updating...' : 'Update App Now'} <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            style={{
                                                padding: '12px 32px', borderRadius: '14px', border: '2px solid #22c55e',
                                                backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 800,
                                                fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px',
                                                cursor: 'default'
                                            }}
                                        >
                                            <CheckCircle2 size={18} /> Already Installed
                                        </div>
                                    );
                                }

                                return (
                                    <button
                                        onClick={() => { handleInstall(selectedGuide.id); setSelectedGuide(null); }}
                                        disabled={installingId !== null}
                                        style={{
                                            padding: '12px 32px', borderRadius: '14px', border: 'none',
                                            backgroundColor: selectedGuide.accent, color: 'white', fontWeight: 800,
                                            fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                            opacity: installingId !== null ? 0.7 : 1
                                        }}
                                    >
                                        {installingId === selectedGuide.id ? 'Installing...' : 'Install Template Now'} <ArrowRight size={18} />
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes modalSlideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(0.96); opacity: 0.9; }
                }
            `}</style>
        </div>

    );
};

export default AppStore;
