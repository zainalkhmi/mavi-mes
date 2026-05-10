import React, { useState } from 'react';
import { 
    Layout, Sparkles, Settings2, Package, Wrench, ArrowRight, CheckCircle2, 
    Search, Filter, Star, Zap, Info, Rocket, Database, ShieldCheck, 
    ChevronRight, ShoppingBag, Plus, Award, Boxes, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createShopfloorTemplate } from '../utils/shopfloorTemplate';
import { createQCTemplate } from '../utils/qcTemplate';
import { saveFrontlineApp } from '../utils/supabaseFrontlineDB';
import { createTable, getTables } from '../utils/database';
import { toast, Toaster } from 'react-hot-toast';

const AppStore = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [installingId, setInstallingId] = useState(null);

    const categories = ['All', 'Quality', 'Production', 'Logistics', 'Maintenance', 'Safety'];

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
            features: ['Auto-Judgment', 'Photo Evidence', 'Cloud Storage']
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
            features: ['Cycle Timing', 'OEE Tracking', 'Station Sync']
        },
        {
            id: 'inventory',
            name: 'Material Requisition',
            category: 'Logistics',
            description: 'Streamline the flow of materials from warehouse to shop floor. Real-time stock alerts and barcode support.',
            longDescription: 'Minimize production downtime by ensuring materials are always where they need to be. Supports scan-to-request and pick-lists.',
            icon: <Boxes size={28} color="#0ea5e9" />,
            bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            accent: '#0ea5e9',
            rating: 4.7,
            installs: '950+',
            features: ['Barcode Ready', 'Live Stock', 'Urgent Alerts']
        },
        {
            id: 'maintenance',
            name: 'Preventive Maintenance',
            category: 'Maintenance',
            description: 'Routine machine checks and autonomous maintenance. Log meter readings and schedule repairs.',
            longDescription: 'Maximize equipment uptime with scheduled inspections. Operators can log issues directly and attach photos for technicians.',
            icon: <Wrench size={28} color="#f59e0b" />,
            bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            accent: '#f59e0b',
            rating: 4.6,
            installs: '1.2k',
            features: ['Meter Logging', 'Machine Health', 'Auto-Scheduler']
        },
        {
            id: 'safety',
            name: 'Safety Audit (LOTO)',
            category: 'Safety',
            description: 'Critical safety checklists and Lock-Out Tag-Out procedures to ensure zero accidents.',
            longDescription: 'Protect your workforce with mandatory safety verification steps. Logs every check for audit compliance.',
            icon: <ShieldAlert size={28} color="#ef4444" />,
            bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            accent: '#ef4444',
            rating: 5.0,
            installs: '800+',
            features: ['Compliance Logs', 'Photo Verification', 'Manager Alerts']
        }
    ];

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
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
                    const tables = await getTables();
                    let qvcTable = tables.find(t => t.name === 'QVC Inspection' || t.id === 'qvc');
                    if (!qvcTable) {
                        qvcTable = await createTable({
                            name: 'QVC Inspection',
                            fields: [
                                { name: 'part_id', type: 'text' },
                                { name: 'operator', type: 'text' },
                                { name: 'status', type: 'text' },
                                { name: 'measurement', type: 'number' },
                                { name: 'timestamp', type: 'datetime' }
                            ]
                        });
                    }
                    if (qvcTable && qvcTable.id) actualTableId = qvcTable.id;
                } catch (err) {
                    console.error('Error initializing QC table:', err);
                }
                const qcDataStr = JSON.stringify(qcData).replace(/"qvc"/g, `"${actualTableId}"`);
                templateApp = JSON.parse(qcDataStr);
            } else if (templateId === 'shopfloor') {
                templateApp = createShopfloorTemplate();
                try {
                    const newTable = await createTable({
                        name: `Shopfloor_Logs`,
                        description: 'Automated table for shop floor data collection',
                        fields: [
                            { name: 'Work_Order', type: 'text' },
                            { name: 'Operator', type: 'user' },
                            { name: 'Station', type: 'station' },
                            { name: 'Status', type: 'text' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });
                    if (newTable && newTable.id) {
                        if (templateApp.config.recordPlaceholders && templateApp.config.recordPlaceholders.length > 0) {
                            templateApp.config.recordPlaceholders[0].tableId = newTable.id;
                        }
                        templateApp.config.appTables = [newTable.id];
                    }
                } catch (tErr) {
                    console.warn('Could not create automated table:', tErr);
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
        </div>
    );
};

export default AppStore;
