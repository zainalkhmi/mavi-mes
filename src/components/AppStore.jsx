import React, { useState } from 'react';
import {
    Layout, Sparkles, Settings2, Package, Wrench, ArrowRight, CheckCircle2, ClipboardList,
    Search, Filter, Star, Zap, Info, Rocket, Database, ShieldCheck,
    ChevronRight, ShoppingBag, Plus, Award, Boxes, ShieldAlert, BookOpen, X, Trash2,
    List, Cpu, Settings, FileText, PlayCircle, Activity, HeartPulse, Truck,
    Image as ImageIcon, BarChart3, Sliders, Tag
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { createIncomingInspectionTemplate } from '../utils/incomingInspectionTemplate';
import { createWeighDispenseTemplate } from '../utils/weighDispenseTemplate';
import { createVisionInspectionTemplate } from '../utils/visionInspectionTemplate';
import { createQuickBuildCadVisionTemplate } from '../utils/quickbuildVisionDrawingTemplate';
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
import { createQualityGateTemplate } from '../utils/qualityGateTemplate';
import { createLotGeneratorTemplate } from '../utils/lotGeneratorTemplate';
import { createSkillManagerTemplate } from '../utils/skillManagerTemplate';
import { createMachineActivityYieldTrackerTemplate } from '../utils/machineActivityYieldTrackerTemplate';
import { createProductionPlantDashboardTemplate } from '../utils/productionPlantDashboardTemplate';
import { categories, rawTemplates } from '../utils/appStoreCatalog';

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

    // Imported from appStoreCatalog: categories, rawTemplates

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

            if (templateId === 'skill-manager') {
                templateApp = createSkillManagerTemplate();
                try {
                    const skillsDefTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'Skills_Definitions',
                        fields: [
                            { name: 'skill', type: 'text' },
                            { name: 'description', type: 'text' },
                            { name: 'context_type', type: 'text' },
                            { name: 'context', type: 'text' },
                            { name: 'status', type: 'text' }
                        ]
                    });

                    const matrixTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'Skill_Matrix',
                        fields: [
                            { name: 'user', type: 'text' },
                            { name: 'skill_name', type: 'text' },
                            { name: 'skill_id', type: 'text' },
                            { name: 'context', type: 'text' },
                            { name: 'level', type: 'text' }
                        ]
                    });

                    const tableIds = [skillsDefTable?.id, matrixTable?.id].filter(Boolean);
                    templateApp.config.appTables = tableIds;
                } catch (skErr) {
                    console.warn('Could not setup skill tables:', skErr);
                }
            } else if (templateId === 'quickstart-hello-world') {
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
            } else if (templateId === 'quickbuild-cad-vision') {
                templateApp = createQuickBuildCadVisionTemplate();
                try {
                    const visionTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'live_measurements',
                        fields: [
                            { name: 'Work_Order', type: 'text' },
                            { name: 'Lot_Number', type: 'text' },
                            { name: 'Operator', type: 'text' },
                            { name: 'Meas_Bore', type: 'number' },
                            { name: 'Meas_Length', type: 'number' },
                            { name: 'Yield_Score', type: 'number' },
                            { name: 'Yield_Result', type: 'text' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });
                    if (visionTable && visionTable.id) {
                        const appStr = JSON.stringify(templateApp).replace(/live_measurements/g, visionTable.id);
                        templateApp = JSON.parse(appStr);
                        templateApp.config.appTables = [visionTable.id];
                    }
                } catch (vErr) {
                    console.warn('Could not create live measurements table for quickbuild template:', vErr);
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
            } else if (templateId === 'quality-gate') {
                templateApp = createQualityGateTemplate();
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
            } else if (templateId === 'lot-generator') {
                templateApp = createLotGeneratorTemplate();
                try {
                    const partsTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'lot_master_parts',
                        fields: [
                            { name: 'customer', type: 'text' },
                            { name: 'part_no', type: 'text' },
                            { name: 'part_name', type: 'text' },
                            { name: 'mark', type: 'text' },
                            { name: 'sequence_type', type: 'text' }
                        ]
                    });
                    const countersTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'lot_counters',
                        fields: [
                            { name: 'part_no', type: 'text' },
                            { name: 'year', type: 'number' },
                            { name: 'month', type: 'number' },
                            { name: 'last_number', type: 'number' }
                        ]
                    });
                    const historyTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'lot_history',
                        fields: [
                            { name: 'date_time', type: 'text' },
                            { name: 'lot_number', type: 'text' },
                            { name: 'part_no', type: 'text' },
                            { name: 'part_name', type: 'text' },
                            { name: 'mark', type: 'text' },
                            { name: 'customer', type: 'text' },
                            { name: 'user', type: 'text' },
                            { name: 'format_lot', type: 'text' }
                        ]
                    });

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (partsTable?.id) { appStr = appStr.replace(/tbl_lot_master_parts/g, partsTable.id); tIds.push(partsTable.id); }
                    if (countersTable?.id) { appStr = appStr.replace(/tbl_lot_counters/g, countersTable.id); tIds.push(countersTable.id); }
                    if (historyTable?.id) { appStr = appStr.replace(/tbl_lot_history/g, historyTable.id); tIds.push(historyTable.id); }

                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (lotErr) {
                    console.warn('Could not create lot generator tables:', lotErr);
                }
            } else if (templateId === 'machine-activity-yield-tracker') {
                templateApp = createMachineActivityYieldTrackerTemplate();
                try {
                    const histTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'Station_Activity_History',
                        fields: [
                            { name: 'Order_ID', type: 'text' },
                            { name: 'Operation_Duration_Hr', type: 'number' },
                            { name: 'Product_Demand', type: 'number' },
                            { name: 'Planned_Takt_Time_Sec', type: 'number' },
                            { name: 'Machine_Status', type: 'text' },
                            { name: 'Downtime_Reason', type: 'text' },
                            { name: 'Actual_Good_Parts', type: 'number' },
                            { name: 'Defect_Parts', type: 'number' },
                            { name: 'Yield_Rate', type: 'number' },
                            { name: 'Cycle_Time_Sec', type: 'number' },
                            { name: 'Station_ID', type: 'text' },
                            { name: 'Operator', type: 'text' }
                        ]
                    });

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (histTable?.id) {
                        appStr = appStr.replace(/tbl_station_activity_history/g, histTable.id);
                        tIds.push(histTable.id);
                    }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (err) {
                    console.warn('Could not create Station_Activity_History table:', err);
                }
            } else if (templateId === 'production-plant-dashboard') {
                templateApp = createProductionPlantDashboardTemplate();
                try {
                    const cellsTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'Production_Cells',
                        fields: [
                            { name: 'Cell_Name', type: 'text' },
                            { name: 'Target_Units', type: 'number' },
                            { name: 'Complete_Units', type: 'number' },
                            { name: 'Defect_Units', type: 'number' }
                        ]
                    });
                    const dtTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'Downtime_Events',
                        fields: [
                            { name: 'Station_Name', type: 'text' },
                            { name: 'Reason', type: 'text' },
                            { name: 'Duration_Minutes', type: 'number' }
                        ]
                    });
                    const ordersTable = await getOrCreateTableAndSeed(allTables, {
                        name: 'Orders_Pipeline',
                        fields: [
                            { name: 'Order_ID', type: 'text' },
                            { name: 'Product', type: 'text' },
                            { name: 'Target_Quantity', type: 'number' },
                            { name: 'Completed_Quantity', type: 'number' },
                            { name: 'Status', type: 'text' }
                        ]
                    });

                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (cellsTable?.id) { appStr = appStr.replace(/tbl_production_cells/g, cellsTable.id); tIds.push(cellsTable.id); }
                    if (dtTable?.id) { appStr = appStr.replace(/tbl_downtime_events/g, dtTable.id); tIds.push(dtTable.id); }
                    if (ordersTable?.id) { appStr = appStr.replace(/tbl_orders_pipeline/g, ordersTable.id); tIds.push(ordersTable.id); }

                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (err) {
                    console.warn('Could not create production plant tables:', err);
                }
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

            <div style={{ maxWidth: '100%', margin: '0 auto' }}>

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
