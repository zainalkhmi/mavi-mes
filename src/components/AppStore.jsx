import React, { useState } from 'react';
import {
    Layout, Sparkles, Settings2, Package, Wrench, ArrowRight, CheckCircle2,
    Search, Filter, Star, Zap, Info, Rocket, Database, ShieldCheck,
    ChevronRight, ShoppingBag, Plus, Award, Boxes, ShieldAlert, BookOpen, X, Trash2,
    List, Cpu, Settings, FileText, PlayCircle, Activity, HeartPulse,
    Image as ImageIcon
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { createIncomingInspectionTemplate } from '../utils/incomingInspectionTemplate';
import { createWeighDispenseTemplate } from '../utils/weighDispenseTemplate';
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
    const categories = ['All', 'Quality', 'Manufacturing', 'Production'];


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
                mechanism: 'Each inspection step validates measurements against configurable spec limits (LSL/USL) and calculates pass/fail automatically.'
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
                mechanism: 'Each dose step verifies material barcode and records dispensed weight with scale integration support.'
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
                mechanism: 'Real-time parts and defect counting with automatic Quality % calculation.'
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
