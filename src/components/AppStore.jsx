import React, { useState } from 'react';
import {
    Layout, Sparkles, Settings2, Package, Wrench, ArrowRight, CheckCircle2,
    Search, Filter, Star, Zap, Info, Rocket, Database, ShieldCheck,
    ChevronRight, ShoppingBag, Plus, Award, Boxes, ShieldAlert, BookOpen, X, Trash2,
    List, Cpu, Settings, FileText, PlayCircle, Activity, HeartPulse,
    Image as ImageIcon
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { createShopfloorTemplate } from '../utils/shopfloorTemplate';
import { createQCTemplate } from '../utils/qcTemplate';
import { createMaterialRequisitionTemplate } from '../utils/inventoryTemplate';
import { createMaintenanceTemplate } from '../utils/maintenanceTemplate';
import { createSafetyTemplate } from '../utils/safetyTemplate';
import { createAutomotiveTuneUpTemplate } from '../utils/automotiveTemplate';
import { createDefectTrackingTemplate } from '../utils/defectTrackingTemplate';
import { createHospitalLabTemplate } from '../utils/hospitalLabTemplate';
import { createDiabetesManagementTemplate } from '../utils/diabetesManagementTemplate';
import { createAssyLineProductionTemplate } from '../utils/assyLineProductionTemplate';

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
    const categories = ['All', 'Quality', 'Production', 'Logistics', 'Maintenance', 'Safety', 'Healthcare'];


    const templates = [
        {
            id: 'qc',
            name: 'QC Inspection',
            category: 'Quality',
            description: 'Professional QVC inspection with measurement collection, photo evidence, and automated pass/fail judgment.',
            longDescription: 'Digitize your quality control process with this comprehensive template. Includes work order validation, measurement logging, and automated reporting.',
            icon: <Sparkles size={28} color="#8b5cf6" />,
            bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            accent: '#8b5cf6',
            rating: 4.9,
            installs: '2.4k',
            features: ['Auto-Judgment', 'Photo Evidence', 'Cloud Storage'],
            previewImage: '/assets/previews/qc_inspection_preview_1778510357626.png'
        },
        {
            id: 'defect',
            name: 'Defect Tracking & Rework',
            category: 'Quality',
            description: 'Report and monitor defect events with integrated rework workflows and disposition management.',
            longDescription: 'End-to-end defect management. Log defects with photos, print material labels, and manage dispositions (Scrap, Rework, Use As-Is). Track rework progress across specialized stations to ensure 100% quality compliance.',
            icon: <ShieldAlert size={28} color="#ef4444" />,
            bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            accent: '#ef4444',
            rating: 4.9,
            installs: '1.1k',
            features: ['Rework Workflow', 'Label Printing', 'Disposition Logic'],
            previewImage: '/assets/previews/defect_tracking_preview_1778510784639.png'
        },
        {
            id: 'shopfloor',
            name: 'Standard Work',
            category: 'Production',
            description: 'Standardized workflow for assembly lines. Tracks operator efficiency, cycle time, and production output.',
            longDescription: 'Ensure every operator follows the gold standard. This template provides step-by-step guidance and logs production data in real-time.',
            icon: <Settings2 size={28} color="#10b981" />,
            bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            accent: '#10b981',
            rating: 4.8,
            installs: '1.8k',
            features: ['Cycle Timing', 'OEE Tracking', 'Station Sync'],
            previewImage: '/assets/previews/standard_work_preview_1778510801489.png'
        },
        {
            id: 'inventory',
            name: 'Material Requisition',
            category: 'Logistics',
            description: 'Warehouse picking flow with shortage alerts, barcode scanning, and real-time inventory level sync.',
            longDescription: 'Minimize production downtime by ensuring materials are always where they need to be. This app synchronizes shop floor needs with warehouse picking tasks using a real-time pull system. Includes location mapping, shortage alerts, and scan-to-confirm picking workflows.',
            icon: <Boxes size={28} color="#0ea5e9" />,
            bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            accent: '#0ea5e9',
            rating: 4.9,
            installs: 'Enterprise',
            features: ['Shortage Alerts', 'Picking Flow', 'Inventory Sync'],
            previewImage: '/assets/previews/material_requisition_preview_1778510316063.png',
            guide: {
                operation: '1. View shortage alerts\n2. Request material via scan\n3. Warehouse picking flow\n4. Confirm delivery to station\n5. Update inventory levels',
                widgets: ['Alert Banner', 'Picking List', 'Scan-to-Confirm', 'Stock Level Gauge'],
                components: ['Requisition Flow', 'Warehouse Dashboard', 'Inventory Sync'],
                tables: [
                    { name: 'Parts_Catalog', description: 'Master list of parts with minimum stock thresholds for alerts.' },
                    { name: 'Inventory_Requisitions', description: 'Transactional log of material requests and their current fulfillment status.' },
                    { name: 'Storage_Locations', description: 'Maps parts to specific warehouse aisles and tracks live bin quantities.' }
                ],
                triggers: [
                    { event: 'STOCK_LOW', function: 'Automatically generates a red alert banner when inventory hits minimum thresholds.' },
                    { event: 'SCAN_TO_PICK', function: 'Verifies the correct part is being picked from the warehouse shelf.' },
                    { event: 'DELIVERY_CONFIRM', function: 'Updates the Storage_Locations table and completes the requisition loop.' }
                ],
                mechanism: 'Synchronizes shop floor needs with warehouse picking tasks using a real-time pull system.'
            }
        },
        {
            id: 'maintenance',
            name: 'Preventive Maintenance Pro',
            category: 'Maintenance',
            description: 'Enterprise-grade machine maintenance with LOTO safety protocols, meter logging, and health score analytics.',
            longDescription: 'Ensure maximum equipment uptime and operator safety. This professional template includes mandatory Lock-Out Tag-Out (LOTO) checklists, photo evidence for inspections, and automated health score calculations based on meter readings.',
            icon: <Wrench size={28} color="#f59e0b" />,
            bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            accent: '#f59e0b',
            rating: 4.9,
            installs: '1.5k',
            features: ['LOTO Safety Protocol', 'Meter & Part Tracking', 'Health Score AI'],
            previewImage: '/assets/previews/maintenance_pro_preview_1778510377454.png'
        },
        {
            id: 'safety',
            name: 'EHS Safety & LOTO Enterprise',
            category: 'Safety',
            description: 'Zero-accident safety management with mandatory PPE checks, hazard mapping, and LOTO compliance.',
            longDescription: 'Protect your workforce with a world-class safety management system. This template ensures 100% compliance with ISO 45001 by requiring photographic PPE verification, interactive hazard assessments, and step-by-step Lock-Out Tag-Out (LOTO) procedures with unique lock identification.',
            icon: <ShieldAlert size={28} color="#ef4444" />,
            bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            accent: '#ef4444',
            rating: 5.0,
            installs: '1.2k',
            features: ['PPE Camera Check', 'Isolation Tracking', 'ISO 45001 Ready'],
            previewImage: '/assets/previews/safety_loto_preview_1778510819340.png'
        },
        {
            id: 'automotive',
            name: 'Automotive Tune-Up',
            category: 'Maintenance',
            description: 'Standardized vehicle service with real-time OBD2 diagnostics, engine health monitoring, and multi-point inspection.',
            longDescription: 'Digitize your automotive workshop. This template integrates with ELM327 OBD2 scanners to read live RPM, Coolant Temp, and DTC codes. Includes step-by-step checklists for Spark Plugs, Filters, and Oil Service with photo evidence.',
            icon: <Zap size={28} color="#facc15" />,
            bg: 'linear-gradient(135deg, #fffcf0 0%, #fef9c3 100%)',
            accent: '#eab308',
            rating: 4.8,
            installs: '500+',
            features: ['OBD2 Live Data', 'DTC Error Scanner', 'Multi-point Check'],
            previewImage: '/assets/previews/automotive_tuneup_preview_1778510859296.png',
            guide: {
                operation: '1. Scan vehicle VIN\n2. Connect OBD2 sensor\n3. Run diagnostic scan\n4. Follow multi-point inspection steps\n5. Generate service report',
                widgets: ['OBD2 Connector', 'DTC Reader', 'Multi-step Checklist', 'Photo Evidence'],
                components: ['Diagnostic Dashboard', 'Vehicle History View', 'Inspection Flow'],
                tables: [
                    { name: 'Vehicle_Service_Logs', description: 'Primary log for all service events, including VIN and mileage.' },
                    { name: 'OBD_Diagnostics', description: 'Stores live sensor data snapshots and DTC error codes.' },
                    { name: 'Mechanic_Audit', description: 'Tracks which mechanic performed which inspection step for accountability.' }
                ],
                triggers: [
                    { event: 'VIN_SCAN', function: 'Automatically look up vehicle service history and previous DTC codes.' },
                    { event: 'OBD_CONNECTED', function: 'Starts live data polling for RPM, Temperature, and MIL status.' },
                    { event: 'DTC_DETECTED', function: 'Triggers a specialized inspection step for the specific error code found.' }
                ],
                mechanism: 'Integrates live ELM327 data into the app state for real-time monitoring and automated fault detection.'
            }
        },
        {
            id: 'assy-line-production',
            name: 'Hasil Produksy di Assy Line',
            category: 'Production',
            description: 'Form input 1-step untuk pencatatan hasil produksi assembly line secara cepat.',
            longDescription: 'Template sederhana untuk operator line dalam mencatat hasil produksi, NG, downtime, dan status produksi dalam satu halaman.',
            icon: <Package size={28} color="#2563eb" />,
            bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            accent: '#2563eb',
            rating: 4.8,
            installs: 'New',
            features: ['1-Step Form', 'Fast Input', 'Production Logging']
        },
        {
            id: 'hospital-lab',
            name: 'Hospital Lab Process',
            category: 'Healthcare',
            description: 'Enterprise 5-stage clinical lab workflow: patient registration, pre-analytical QC, hematology, chemistry panel, and pathologist-authorised HL7 reporting.',
            longDescription: 'A fully-featured Laboratory Information Workflow covering every stage from specimen receipt to HIS integration. Includes critical value alerting, delta-check analysis, eGFR calculation, HL7 report push, and mandatory pathologist digital sign-off.',
            icon: <Activity size={28} color="#06b6d4" />,
            bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
            accent: '#06b6d4',
            rating: 5.0,
            installs: 'Enterprise',
            features: ['Critical Value Alerting', 'Delta Check Analysis', 'HL7 HIS Integration'],
            previewImage: '/assets/previews/hospital_lab_preview_1778510393426.png',
            guide: {
                operation: '1. Register patient via wristband scan & select test panels\n2. Pre-Analytical QC: verify specimen integrity & acceptance criteria\n3. Hematology: enter FBC values with auto delta-check vs prior result\n4. Chemistry: enter metabolic panel — eGFR auto-calculated\n5. Pathologist review: consolidated result card, comments & digital sign-off\n6. Authorise & release: PDF generated and pushed to HIS via HL7',
                widgets: ['Barcode Scanner', 'Multi-Select Panel Chips', 'Form Grid (2-col)', 'Delta Check Panel', 'Critical Flag Widget', 'Calculated Field', 'Result Summary Card', 'Signature Pad'],
                components: ['Lab Workflow Engine', 'Specimen Router', 'Critical Value Monitor', 'HIS Integration Bridge'],
                tables: [
                    { name: 'Lab_Test_Master', description: 'Reference catalog of all test panels with normal ranges and critical thresholds.' },
                    { name: 'Lab_Samples', description: 'Per-patient sample log with receipt time, priority, and routing status.' },
                    { name: 'Lab_Results', description: 'Granular parameter values (Hgb, WBC, Creatinine, etc.) linked to each sample.' },
                    { name: 'Critical_Value_Log', description: 'Immutable audit of all critical value detections and physician callback confirmations.' }
                ],
                triggers: [
                    { event: 'PRINT_LABEL', function: 'Prints a barcode label with Sample ID, patient name, panels, and STAT/ROUTINE priority.' },
                    { event: 'ROUTE_SPECIMEN', function: 'Logs acceptance and routes the sample to the correct analyzer queue.' },
                    { event: 'NOTIFY_REJECTION', function: 'Sends an alert to the ward nurse station with rejection reason and recollection request.' },
                    { event: 'CRITICAL_VALUE_DETECTED', function: 'Sends SMS to attending physician, logs to Critical_Value_Log, and plays audio alert.' },
                    { event: 'RELEASE_REPORT', function: 'Marks sample RELEASED, generates a signed PDF, and pushes HL7 message to the HIS.' },
                    { event: 'NOTIFY_PHYSICIAN', function: 'Sends secure in-app notification to requesting physician that results are ready.' }
                ],
                mechanism: 'Integrates clinical decision support (critical thresholds, delta checks, eGFR formula) with a full HL7-compliant HIS push and mandatory pathologist audit trail.'
            }
        },
        {
            id: 'diabetes-care',
            name: 'Diabetes Care & Management',
            category: 'Healthcare',
            description: 'Advanced clinical management for chronic diabetes, featuring metabolic profiling, trending, and care plan orchestration.',
            longDescription: 'A professional-grade solution for endocrinology clinics. Manage complex patient journeys through vital assessments, glucose/A1C trending, insulin dosage calculation, and collaborative care planning. Built-in logic flags critical hyper/hypoglycemic events and automates specialist referrals.',
            icon: <HeartPulse size={28} color="#ec4899" />,
            bg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
            accent: '#ec4899',
            rating: 5.0,
            installs: 'Professional',
            features: ['Metabolic Trending', 'Insulin Logic Engine', 'Multi-disciplinary Care Plans'],
            previewImage: '/assets/previews/diabetes_care_preview_1778510837192.png',
            guide: {
                operation: '1. Patient Triage: Record BP, Weight, and BMI\n2. Metabolic Profiling: Enter Glucose and A1C lab values\n3. Medication Review: Adjust insulin dosage based on automated suggestions\n4. Nutrition & Activity: Define lifestyle goals and target weights\n5. Specialist Review: Final physician sign-off and Care Plan activation',
                widgets: ['Metabolic Chart', 'Dosage Calculator', 'Trend Analysis Gauge', 'Electronic Signature', 'Pro-Form Grid'],
                components: ['Clinical Decision Engine', 'Care Plan Orchestrator', 'Vitals Tracker'],
                tables: [
                    { name: 'Diabetes_Patient_Master', description: 'Patient bio-data, medical history, and chronic condition status.' },
                    { name: 'Glucose_Metabolic_Logs', description: 'Time-series data for blood sugar readings and A1C laboratory values.' },
                    { name: 'Clinical_Care_Plans', description: 'Active and historical care plans including prescriptions and dietary goals.' },
                    { name: 'Vital_Signs_History', description: 'Longitudinal record of physical check-up data (BP, BMI, Heart Rate).' }
                ],
                triggers: [
                    { event: 'CRITICAL_GLUCOSE', function: 'Triggers an immediate high-priority alert to the care team if glucose is <70 or >250.' },
                    { event: 'INSULIN_ADJUST', function: 'Calculates recommended insulin units based on carbohydrate-to-insulin ratios.' },
                    { event: 'A1C_STAGNATION', function: 'Flags patients for specialist referral if A1C does not improve by 0.5% within 90 days.' }
                ],
                mechanism: 'Leverages multi-dimensional clinical logic to correlate vital signs with metabolic trends, generating personalized medical interventions.'
            }
        }
    ];



    // Add guides to existing templates
    templates[0].guide = {
        operation: '1. Scan Work Order barcode\n2. Perform measurements\n3. Capture evidence photos\n4. System auto-judges pass/fail\n5. Sign-off and save',
        widgets: ['Barcode Scanner', 'Number Input', 'Camera Widget', 'Signature Pad'],
        components: ['Step Navigator', 'Data Entry Form', 'Validation Logic'],
        tables: [
            { name: 'QC_Standards', description: 'Master table for nominal values and tolerances per part.' },
            { name: 'QVC_Inspections', description: 'Transactional log of actual measurements and pass/fail results.' },
            { name: 'QC_Equipment', description: 'Tracks tool calibration status used during this specific inspection.' }
        ],
        triggers: [
            { event: 'ON_BARCODE_SCAN', function: 'Loads part-specific tolerances from QC_Standards into app variables.' },
            { event: 'VAL_CHANGE', function: 'Re-calculates pass/fail judgment instantly as measurements are entered.' },
            { event: 'ON_FINALIZE', function: 'Logs data to both Inspections and Equipment tables and clears the form.' }
        ],
        mechanism: 'Uses conditional logic to compare inputs against master tolerances and triggers alerts for OOT (Out of Tolerance) events.'
    };
    templates[1].guide = {
        operation: '1. Report defect with photo\n2. Print material tracking label\n3. Disposition logic (Scrap/Rework)\n4. Assign to rework station\n5. Quality sign-off',
        widgets: ['Material Selector', 'Label Printer', 'Image Annotator', 'Status Badge'],
        components: ['Disposition Manager', 'Station Assignment Flow', 'Audit Log'],
        tables: [
            { name: 'Materials_Master', description: 'Central catalog for all parts with descriptions and unit types.' },
            { name: 'Defect_Events', description: 'Records every defect incident, location, and initial disposition.' },
            { name: 'Defect_Resolution_History', description: 'Linked log of rework actions, notes, and final quality sign-off.' }
        ],
        triggers: [
            { event: 'ITEM_SELECTED', function: 'Populates material details and displays the master reference image.' },
            { event: 'STATUS_UPDATE', function: 'Prints a physical tracking label with a unique QR code for the defect.' },
            { event: 'STATION_ASSIGN', function: 'Sends a notification to the selected rework station dashboard.' }
        ],
        mechanism: 'Orchestrates rework workflows by routing defective parts through specialized repair stations based on defect category.'
    };
    templates[2].guide = {
        operation: '1. Operator login\n2. Select production line\n3. Follow step-by-step assembly instructions\n4. Log cycle times\n5. Record hourly output',
        widgets: ['Instruction Viewer', 'Cycle Timer', 'Counter Button', 'OEE Gauge'],
        components: ['Standard Work Flow', 'Performance Dashboard', 'Efficiency Chart'],
        tables: [
            { name: 'Production_Stations', description: 'Defines the available stations and their associated production areas.' },
            { name: 'Production_Logs', description: 'Captures operator activity, work orders, and completion timestamps.' },
            { name: 'Hourly_Performance', description: 'Aggregates production output per hour to track against targets.' }
        ],
        triggers: [
            { event: 'STEP_LOAD', function: 'Starts the internal cycle timer and displays specific assembly instructions.' },
            { event: 'UNIT_COMPLETE', function: 'Increments the hourly counter and updates the OEE gauge.' },
            { event: 'DOWNTIME_START', function: 'Pauses timers and prompts the operator for a downtime reason code.' }
        ],
        mechanism: 'Calculates OEE and Takt time in real-time based on step completion timestamps and target production rates.'
    };
    templates[3].guide = {
        operation: '1. View shortage alerts\n2. Request material via scan\n3. Warehouse picking flow\n4. Confirm delivery to station\n5. Update inventory levels',
        widgets: ['Alert Banner', 'Picking List', 'Scan-to-Confirm', 'Stock Level Gauge'],
        components: ['Requisition Flow', 'Warehouse Dashboard', 'Inventory Sync'],
        tables: [
            { name: 'Parts_Catalog', description: 'Master list of parts with minimum stock thresholds for alerts.' },
            { name: 'Inventory_Requisitions', description: 'Transactional log of material requests and their current fulfillment status.' },
            { name: 'Storage_Locations', description: 'Maps parts to specific warehouse aisles and tracks live bin quantities.' }
        ],
        triggers: [
            { event: 'STOCK_LOW', function: 'Automatically generates a red alert banner when inventory hits minimum thresholds.' },
            { event: 'SCAN_TO_PICK', function: 'Verifies the correct part is being picked from the warehouse shelf.' },
            { event: 'DELIVERY_CONFIRM', function: 'Updates the Storage_Locations table and completes the requisition loop.' }
        ],
        mechanism: 'Synchronizes shop floor needs with warehouse picking tasks using a real-time push-notification system.'
    };
    templates[4].guide = {
        operation: '1. Periodic maintenance alert\n2. LOTO (Lock-Out Tag-Out) safety check\n3. Perform task & log meter readings\n4. Verify machine health\n5. Close work order',
        widgets: ['LOTO Checklist', 'Meter Input', 'Safety Sign-off', 'Health Gauge'],
        components: ['Preventive Maintenance Flow', 'Machine Health History', 'Safety Protocol Manager'],
        tables: [
            { name: 'Maintenance_Assets', description: 'Master registry of all equipment, serial numbers, and locations.' },
            { name: 'Maintenance_Logs', description: 'Detailed records of every PM task performed and meter readings recorded.' },
            { name: 'Maintenance_Spare_Parts', description: 'Tracks part consumption (filters, oils, belts) per maintenance event.' }
        ],
        triggers: [
            { event: 'LOTO_VERIFIED', function: 'Unlocks the technical maintenance steps after safety photos are approved.' },
            { event: 'METER_READING', function: 'Calculates the next service date based on machine usage intervals.' },
            { event: 'TASK_FAIL', function: 'Automatically escalates the work order to "Urgent Repair" status.' }
        ],
        mechanism: 'Enforces safety compliance by blocking maintenance steps until mandatory LOTO procedures are photo-verified.'
    };
    templates[5].guide = {
        operation: '1. Daily safety walk-through\n2. PPE verification camera check\n3. Log hazard observations\n4. Interactive LOTO procedure\n5. EHS incident reporting',
        widgets: ['PPE Camera Widget', 'Hazard Map', 'LOTO Manager', 'Incident Form'],
        components: ['Safety Audit Flow', 'Hazard Visualization', 'Compliance Tracker'],
        tables: [
            { name: 'Safety_Categories', description: 'Defines safety hazard types and their associated severity levels.' },
            { name: 'Safety_Audits', description: 'Log of daily inspections, compliance scores, and photo evidence.' },
            { name: 'Safety_Corrective_Actions', description: 'Tracks mandatory follow-up tasks for identified safety hazards.' }
        ],
        triggers: [
            { event: 'PPE_MISSING', function: 'Uses Vision AI to trigger an audio alert if a helmet or vest is not detected.' },
            { event: 'HAZARD_LOGGED', function: 'Immediately creates a record in the Corrective_Actions table for follow-up.' },
            { event: 'ISOLATION_SET', function: 'Broadcasts a "Machine Locked" status to all operator terminals in the area.' }
        ],
        mechanism: 'Uses AI vision to detect mandatory PPE and ensures 100% adherence to ISO 45001 safety standards.'
    };



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

            if (templateId === 'qc') {
                let qcData = createQCTemplate();
                let actualTableId = 'qvc';
                try {
                    // 1. Create QC Standards Table
                    const standardsTable = await createTable({
                        name: 'QC_Standards',
                        fields: [
                            { name: 'part_name', type: 'text' },
                            { name: 'nominal_value', type: 'number' },
                            { name: 'tolerance_plus', type: 'number' },
                            { name: 'tolerance_minus', type: 'number' }
                        ]
                    });

                    // 2. Create QC Inspection Table
                    const qvcTable = await createTable({
                        name: 'QVC_Inspections',
                        fields: [
                            { name: 'standard_id', type: 'link', linkedTableId: standardsTable.id },
                            { name: 'operator', type: 'text' },
                            { name: 'status', type: 'text' },
                            { name: 'measurement', type: 'number' },
                            { name: 'timestamp', type: 'datetime' }
                        ]
                    });

                    // 3. Create QC Equipment Table
                    const equipTable = await createTable({
                        name: 'QC_Equipment',
                        fields: [
                            { name: 'equipment_name', type: 'text' },
                            { name: 'serial_number', type: 'text' },
                            { name: 'last_calibrated', type: 'datetime' },
                            { name: 'linked_inspection', type: 'link', linkedTableId: qvcTable.id }
                        ]
                    });

                    if (qvcTable && qvcTable.id) actualTableId = qvcTable.id;
                    templateApp.config.appTables = [standardsTable.id, qvcTable.id, equipTable.id];
                } catch (err) {
                    console.error('Error initializing QC tables:', err);
                }
                const qcDataStr = JSON.stringify(qcData).replace(/"qvc"/g, `"${actualTableId}"`);
                templateApp = JSON.parse(qcDataStr);

            } else if (templateId === 'shopfloor') {
                templateApp = createShopfloorTemplate();
                try {
                    // 1. Create Station Master
                    const stationTable = await createTable({
                        name: 'Production_Stations',
                        fields: [
                            { name: 'Station_Name', type: 'text' },
                            { name: 'Area', type: 'text' },
                            { name: 'Is_Active', type: 'boolean' }
                        ]
                    });

                    // 2. Create Production Logs
                    const logTable = await createTable({
                        name: `Production_Logs`,
                        fields: [
                            { name: 'Work_Order', type: 'text' },
                            { name: 'Operator', type: 'user' },
                            { name: 'Station_ID', type: 'link', linkedTableId: stationTable.id },
                            { name: 'Status', type: 'text' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });

                    // 3. Create Hourly Output
                    const outputTable = await createTable({
                        name: 'Hourly_Performance',
                        fields: [
                            { name: 'Log_ID', type: 'link', linkedTableId: logTable.id },
                            { name: 'Hour_Slot', type: 'text' },
                            { name: 'Target_Qty', type: 'number' },
                            { name: 'Actual_Qty', type: 'number' }
                        ]
                    });

                    if (logTable && logTable.id) {
                        const placeholderId = "orders_table_placeholder";
                        const appStr = JSON.stringify(templateApp).replace(new RegExp(placeholderId, 'g'), logTable.id);
                        templateApp = JSON.parse(appStr);
                        templateApp.config.appTables = [stationTable.id, logTable.id, outputTable.id];
                    }
                } catch (tErr) {
                    console.warn('Could not create shopfloor tables:', tErr);
                }

            } else if (templateId === 'inventory') {
                templateApp = createMaterialRequisitionTemplate();
                try {
                    // 1. Create Parts Catalog
                    const partsTable = await createTable({
                        name: 'Parts_Catalog',
                        fields: [
                            { name: 'Part_Number', type: 'text' },
                            { name: 'Description', type: 'text' },
                            { name: 'Minimum_Stock', type: 'number' }
                        ]
                    });

                    // 2. Create Requisitions
                    const reqTable = await createTable({
                        name: `Inventory_Requisitions`,
                        fields: [
                            { name: 'Part_ID', type: 'link', linkedTableId: partsTable.id },
                            { name: 'Qty_Requested', type: 'number' },
                            { name: 'Operator', type: 'user' },
                            { name: 'Status', type: 'text' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });

                    // 3. Create Storage Locations
                    const locTable = await createTable({
                        name: 'Storage_Locations',
                        fields: [
                            { name: 'Aisle_Rack', type: 'text' },
                            { name: 'Linked_Part', type: 'link', linkedTableId: partsTable.id },
                            { name: 'Current_Qty', type: 'number' }
                        ]
                    });

                    if (reqTable && reqTable.id) {
                        let appStr = JSON.stringify(templateApp);
                        appStr = appStr.replace(/PLACEHOLDER_TABLE_PARTS/g, partsTable.id);
                        appStr = appStr.replace(/PLACEHOLDER_TABLE_REQUISITIONS/g, reqTable.id);
                        appStr = appStr.replace(/PLACEHOLDER_TABLE_STORAGE/g, locTable.id);
                        // Also handle the legacy one just in case
                        appStr = appStr.replace(/inventory_table_placeholder/g, reqTable.id);

                        templateApp = JSON.parse(appStr);
                        templateApp.config.appTables = [partsTable.id, reqTable.id, locTable.id];

                        // Seed Dummy Data for Material Requisition
                        try {
                            if (partsTable && partsTable.id) {
                                await addTableRecord(partsTable.id, {
                                    recordId: 'PART-001',
                                    Part_Number: 'AL-6061',
                                    Description: 'Aluminum Extrusion Profile 2m',
                                    Minimum_Stock: 50
                                });
                                await addTableRecord(partsTable.id, {
                                    recordId: 'PART-002',
                                    Part_Number: 'CU-1010',
                                    Description: 'Copper Wire Spool 5kg',
                                    Minimum_Stock: 20
                                });
                                await addTableRecord(partsTable.id, {
                                    recordId: 'PART-003',
                                    Part_Number: 'PLA-BLK',
                                    Description: 'Black PLA 3D Printer Filament 1kg',
                                    Minimum_Stock: 15
                                });
                            }

                            if (locTable && locTable.id) {
                                await addTableRecord(locTable.id, {
                                    recordId: 'LOC-A1',
                                    Aisle_Rack: 'Aisle 1, Rack A',
                                    Linked_Part: 'PART-001',
                                    Current_Qty: 250
                                });
                                await addTableRecord(locTable.id, {
                                    recordId: 'LOC-B2',
                                    Aisle_Rack: 'Aisle 2, Rack B',
                                    Linked_Part: 'PART-002',
                                    Current_Qty: 45
                                });
                            }
                        } catch (dummyErr) {
                            console.warn('Failed to seed dummy data for inventory template:', dummyErr);
                        }
                    }
                } catch (invErr) {
                    console.warn('Could not create inventory tables:', invErr);
                }

            } else if (templateId === 'maintenance') {
                templateApp = createMaintenanceTemplate();
                try {
                    // 1. Create Assets Master
                    const assetsTable = await createTable({
                        name: 'Maintenance_Assets',
                        fields: [
                            { name: 'Machine_Name', type: 'text' },
                            { name: 'Serial_Number', type: 'text' },
                            { name: 'Location', type: 'text' }
                        ]
                    });

                    // 2. Create Maintenance Logs
                    const logTable = await createTable({
                        name: `Maintenance_Logs`,
                        fields: [
                            { name: 'Asset_ID', type: 'link', linkedTableId: assetsTable.id },
                            { name: 'Meter_Reading', type: 'number' },
                            { name: 'Operator', type: 'user' },
                            { name: 'Status', type: 'text' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });

                    // 3. Create Spare Parts Used
                    const sparesTable = await createTable({
                        name: 'Maintenance_Spare_Parts',
                        fields: [
                            { name: 'Part_Name', type: 'text' },
                            { name: 'Linked_Log', type: 'link', linkedTableId: logTable.id },
                            { name: 'Qty_Used', type: 'number' }
                        ]
                    });

                    if (logTable && logTable.id) {
                        const placeholderId = "maintenance_logs_placeholder";
                        const appStr = JSON.stringify(templateApp).replace(new RegExp(placeholderId, 'g'), logTable.id);
                        templateApp = JSON.parse(appStr);
                        templateApp.config.appTables = [assetsTable.id, logTable.id, sparesTable.id];
                    }
                } catch (maintErr) {
                    console.warn('Could not create maintenance tables:', maintErr);
                }

            } else if (templateId === 'safety') {
                templateApp = createSafetyTemplate();
                try {
                    // 1. Safety Categories
                    const catTable = await createTable({
                        name: 'Safety_Categories',
                        fields: [
                            { name: 'Category_Name', type: 'text' },
                            { name: 'Severity_Level', type: 'text' }
                        ]
                    });

                    // 2. Safety Audits
                    const auditTable = await createTable({
                        name: `Safety_Audits`,
                        fields: [
                            { name: 'Category_ID', type: 'link', linkedTableId: catTable.id },
                            { name: 'Operator', type: 'user' },
                            { name: 'Compliance_Status', type: 'text' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });

                    // 3. Corrective Actions
                    const actionTable = await createTable({
                        name: 'Safety_Corrective_Actions',
                        fields: [
                            { name: 'Audit_ID', type: 'link', linkedTableId: auditTable.id },
                            { name: 'Action_Description', type: 'text' },
                            { name: 'Due_Date', type: 'datetime' }
                        ]
                    });

                    if (auditTable && auditTable.id) {
                        const placeholderId = "safety_audits_placeholder";
                        const appStr = JSON.stringify(templateApp).replace(new RegExp(placeholderId, 'g'), auditTable.id);
                        templateApp = JSON.parse(appStr);
                        templateApp.config.appTables = [catTable.id, auditTable.id, actionTable.id];
                    }
                } catch (safeErr) {
                    console.warn('Could not create safety tables:', safeErr);
                }

            } else if (templateId === 'automotive') {
                templateApp = createAutomotiveTuneUpTemplate();
                try {
                    const newTable = await createTable({
                        name: `Vehicle_Service_Logs`,
                        description: 'Detailed records of car tune-ups and OBD2 diagnostics',
                        fields: [
                            { name: 'Vehicle_VIN', type: 'text' },
                            { name: 'Mileage', type: 'number' },
                            { name: 'OBD_Status', type: 'text' },
                            { name: 'DTC_Codes', type: 'text' },
                            { name: 'Mechanic', type: 'user' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });
                    if (newTable && newTable.id) {
                        if (templateApp.config.recordPlaceholders && templateApp.config.recordPlaceholders.length > 0) {
                            templateApp.config.recordPlaceholders[0].tableId = newTable.id;
                        }
                        templateApp.config.appTables = [newTable.id];
                    }
                } catch (autoErr) {
                    console.warn('Could not create automotive table:', autoErr);
                }
            } else if (templateId === 'defect') {
                templateApp = createDefectTrackingTemplate();
                try {
                    // 1. Create Master Materials Table
                    const masterTable = await createTable({
                        name: `Materials_Master`,
                        description: 'Master catalog of parts and materials',
                        fields: [
                            { name: 'Name', type: 'text' },
                            { name: 'Description', type: 'text' },
                            { name: 'Category', type: 'text' },
                            { name: 'Unit', type: 'text' },
                            { name: 'Image', type: 'text' }
                        ]
                    });

                    // Seed some master data
                    if (masterTable && masterTable.id) {
                        const { addTableRecord } = await import('../utils/supabaseTablesDB');
                        console.log(`[Seed] Seeding Materials_Master (${masterTable.id})...`);
                        await addTableRecord(masterTable.id, {
                            recordId: 'MAT-001',
                            Name: 'Engine Block',
                            Description: 'V6 Aluminum Block - High Precision Casting',
                            Category: 'Core Components',
                            Unit: 'pcs',
                            Image: '/assets/master/engine_block.png'
                        });
                        await addTableRecord(masterTable.id, {
                            recordId: 'MAT-002',
                            Name: 'Transmission Case',
                            Description: '6-Speed Housing - Die-cast Magnesium',
                            Category: 'Drivetrain',
                            Unit: 'pcs',
                            Image: '/assets/master/transmission.png'
                        });
                        await addTableRecord(masterTable.id, {
                            recordId: 'MAT-003',
                            Name: 'Cylinder Head',
                            Description: 'DOHC 24V Head - Performance Grade',
                            Category: 'Engine Parts',
                            Unit: 'pcs',
                            Image: '/assets/master/cylinder_head.png'
                        });
                        console.log(`[Seed] Seeding completed.`);
                    }

                    // 2. Create Defect Events Table
                    const eventTable = await createTable({
                        name: `Defect_Events`,
                        description: 'Log of manufacturing defects and their dispositions',
                        fields: [
                            { name: 'Material_ID', type: 'text' },
                            { name: 'Description', type: 'text' },
                            { name: 'Quantity', type: 'number' },
                            { name: 'Status', type: 'text' },
                            { name: 'Reported_By', type: 'user' },
                            { name: 'Location_Detected', type: 'text' },
                            { name: 'Rework_Station', type: 'text' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });

                    // 3. Rework History Table
                    const historyTable = await createTable({
                        name: `Defect_Resolution_History`,
                        fields: [
                            { name: 'Event_ID', type: 'link', linkedTableId: eventTable.id },
                            { name: 'Resolution_Notes', type: 'text' },
                            { name: 'Resolved_By', type: 'user' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });

                    if (masterTable && masterTable.id && eventTable && eventTable.id) {
                        const appStr = JSON.stringify(templateApp)
                            .replace(/materials_master_placeholder/g, masterTable.id)
                            .replace(/defect_events_placeholder/g, eventTable.id);
                        templateApp = JSON.parse(appStr);

                        // Update appTables config
                        templateApp.config.appTables = [masterTable.id, eventTable.id, historyTable.id];
                    }
                } catch (defErr) {
                    console.warn('Could not create defect tables:', defErr);
                }

            } else if (templateId === 'hospital-lab') {
                templateApp = createHospitalLabTemplate();
                try {
                    // 1. Lab Test Master
                    const testMaster = await createTable({
                        name: 'Lab_Test_Master',
                        fields: [
                            { name: 'Test_Name', type: 'text' },
                            { name: 'Normal_Range_Min', type: 'number' },
                            { name: 'Normal_Range_Max', type: 'number' },
                            { name: 'Unit', type: 'text' }
                        ]
                    });

                    // 2. Lab Samples
                    const sampleTable = await createTable({
                        name: 'Lab_Samples',
                        fields: [
                            { name: 'Patient_ID', type: 'text' },
                            { name: 'Test_ID', type: 'link', linkedTableId: testMaster.id },
                            { name: 'Received_At', type: 'datetime' },
                            { name: 'Status', type: 'text' }
                        ]
                    });

                    // 3. Lab Results
                    const resultTable = await createTable({
                        name: 'Lab_Results',
                        fields: [
                            { name: 'Sample_ID', type: 'link', linkedTableId: sampleTable.id },
                            { name: 'Parameter_Name', type: 'text' },
                            { name: 'Observed_Value', type: 'number' },
                            { name: 'Is_Abnormal', type: 'boolean' }
                        ]
                    });

                    if (resultTable && resultTable.id) {
                        let appStr = JSON.stringify(templateApp);
                        appStr = appStr.replace(/PLACEHOLDER_TABLE_TEST_MASTER/g, testMaster.id);
                        appStr = appStr.replace(/PLACEHOLDER_TABLE_LAB_SAMPLES/g, sampleTable.id);
                        appStr = appStr.replace(/PLACEHOLDER_TABLE_LAB_RESULTS/g, resultTable.id);
                        templateApp = JSON.parse(appStr);
                        templateApp.config.appTables = [testMaster.id, sampleTable.id, resultTable.id];

                        // Seed Lab Master Data
                        try {
                            await addTableRecord(testMaster.id, { recordId: 'TEST-HGB', Test_Name: 'Hemoglobin', Normal_Range_Min: 12.0, Normal_Range_Max: 16.0, Unit: 'g/dL' });
                            await addTableRecord(testMaster.id, { recordId: 'TEST-WBC', Test_Name: 'WBC', Normal_Range_Min: 4.0, Normal_Range_Max: 11.0, Unit: '10^3/uL' });
                        } catch (sErr) { console.warn('Lab seeding failed:', sErr); }
                    }
                } catch (labErr) {
                    console.warn('Could not create hospital lab tables:', labErr);
                }
            } else if (templateId === 'diabetes-care') {
                templateApp = createDiabetesManagementTemplate();
                try {
                    const patientTable = await createTable({
                        name: 'Diabetes_Patient_Master',
                        fields: [
                            { name: 'Full_Name', type: 'text' },
                            { name: 'Diagnosis_Date', type: 'datetime' },
                            { name: 'Risk_Category', type: 'text' }
                        ]
                    });
                    const glucoseTable = await createTable({
                        name: 'Glucose_Metabolic_Logs',
                        fields: [
                            { name: 'Patient_ID', type: 'link', linkedTableId: patientTable.id },
                            { name: 'Glucose_Value', type: 'number' },
                            { name: 'Reading_Type', type: 'text' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });
                    const careTable = await createTable({
                        name: 'Clinical_Care_Plans',
                        fields: [
                            { name: 'Patient_ID', type: 'link', linkedTableId: patientTable.id },
                            { name: 'Insulin_Dosage', type: 'text' },
                            { name: 'Nutrition_Goals', type: 'text' },
                            { name: 'Status', type: 'text' }
                        ]
                    });
                    const vitalsTable = await createTable({
                        name: 'Vital_Signs_History',
                        fields: [
                            { name: 'Patient_ID', type: 'link', linkedTableId: patientTable.id },
                            { name: 'BP_Reading', type: 'text' },
                            { name: 'BMI_Value', type: 'number' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });

                    let appStr = JSON.stringify(templateApp);
                    appStr = appStr.replace(/PLACEHOLDER_TABLE_DIABETES_PATIENT/g, patientTable.id);
                    appStr = appStr.replace(/PLACEHOLDER_TABLE_GLUCOSE_LOGS/g, glucoseTable.id);
                    appStr = appStr.replace(/PLACEHOLDER_TABLE_CARE_PLANS/g, careTable.id);
                    appStr = appStr.replace(/PLACEHOLDER_TABLE_VITALS_HISTORY/g, vitalsTable.id);
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = [patientTable.id, glucoseTable.id, careTable.id, vitalsTable.id];
                } catch (diabErr) {
                    console.warn('Could not create diabetes tables:', diabErr);
                }
            } else if (templateId === 'assy-line-production') {
                templateApp = createAssyLineProductionTemplate();
                try {
                    const assyTable = await createTable({
                        name: 'Assy_Production_Logs',
                        fields: [
                            { name: 'Shift', type: 'text' },
                            { name: 'Line_Assy', type: 'text' },
                            { name: 'Work_Order', type: 'text' },
                            { name: 'Model_Part_Number', type: 'text' },
                            { name: 'Qty_Plan', type: 'number' },
                            { name: 'Qty_Actual', type: 'number' },
                            { name: 'Qty_NG', type: 'number' },
                            { name: 'Downtime_Minutes', type: 'number' },
                            { name: 'Status_Produksi', type: 'text' },
                            { name: 'Catatan', type: 'text' },
                            { name: 'Operator', type: 'user' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });

                    if (assyTable && assyTable.id) {
                        const appStr = JSON.stringify(templateApp).replace(/assy_production_placeholder/g, assyTable.id);
                        templateApp = JSON.parse(appStr);
                        templateApp.config.appTables = [assyTable.id];
                    }
                } catch (assyErr) {
                    console.warn('Could not create assy production table:', assyErr);
                }
            } else {


                // For others, we just create a blank-ish app for now or use Shopfloor as base
                templateApp = createShopfloorTemplate();
                templateApp.name = templates.find(t => t.id === templateId)?.name || 'New App';
                templateApp.category = templates.find(t => t.id === templateId)?.category || 'Shop Floor';
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
                                padding: '10px 24px', borderRadius: '100px', border: 'none',
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
