import React, { useState, useEffect } from 'react';
import { Layout, Trash2, Search, AppWindow, Calendar, ShieldCheck, Box, LayoutGrid, List, Edit3, Smartphone, Sparkles, Monitor, Filter } from 'lucide-react';
import { getAllFrontlineApps, deleteFrontlineApp } from '../utils/supabaseFrontlineDB';
import { getAppBuilderType, getBuilderInfo, BUILDER_TYPES, BUILDER_METADATA } from '../utils/builderType';
import toast from 'react-hot-toast';

const AppManagement = () => {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [selectedBuilderFilter, setSelectedBuilderFilter] = useState('all'); // 'all' | 'app_builder' | 'gluestack' | 'sandbox'

    useEffect(() => {
        loadApps();
    }, []);

    // Get icon component based on builder type
    const getBuilderIconComponent = (builderType) => {
        switch (builderType) {
            case BUILDER_TYPES.GLUESTACK:
                return Smartphone;
            case BUILDER_TYPES.SANDBOX:
                return Sparkles;
            case BUILDER_TYPES.MAVI:
            default:
                return Monitor;
        }
    };

    // Navigate to correct builder based on app's builder_type
    const handleEditApp = (app) => {
        const builderType = getAppBuilderType(app);
        const info = getBuilderInfo(builderType);
        const editUrl = info.getEditUrl(app.id);
        window.open(editUrl, '_blank');
    };

    const loadApps = async () => {
        setLoading(true);
        try {
            const data = await getAllFrontlineApps();
            setApps(data || []);
        } catch (error) {
            console.error('Failed to load apps:', error);
            toast.error('Failed to load applications.');
        } finally {
            setLoading(false);
        }
    };

    const handleUninstall = async (appId, appName) => {
        if (window.confirm(`Are you sure you want to uninstall and permanently delete "${appName}"? This will also delete any associated tables and data.`)) {
            const loadingToast = toast.loading('Uninstalling application...');
            try {
                await deleteFrontlineApp(appId);
                
                // If it was a template from AppStore, remove it from localStorage
                try {
                    const raw = localStorage.getItem('installedAppStoreTemplates');
                    if (raw) {
                        const installed = JSON.parse(raw);
                        const newInstalled = {};
                        let changed = false;
                        for (const [tplId, installedAppId] of Object.entries(installed)) {
                            if (installedAppId === appId) {
                                changed = true;
                            } else {
                                newInstalled[tplId] = installedAppId;
                            }
                        }
                        if (changed) {
                            localStorage.setItem('installedAppStoreTemplates', JSON.stringify(newInstalled));
                        }
                    }
                } catch (e) {
                    console.warn('Failed to clean up localStorage:', e);
                }

                toast.success('Application uninstalled successfully!', { id: loadingToast });
                loadApps();
            } catch (error) {
                console.error('Failed to uninstall app:', error);
                toast.error('Failed to uninstall application.', { id: loadingToast });
            }
        }
    };

    const getAppCategory = (app) => {
        if (!app.config) return 'Custom App';
        if (app.config.templateCategory) return app.config.templateCategory;
        if (app.description && app.description.includes('Template')) return 'Template App';
        return 'Custom App';
    };

    // Count apps per builder
    const builderCounts = {
        all: apps.length,
        [BUILDER_TYPES.MAVI]: apps.filter(a => getAppBuilderType(a) === BUILDER_TYPES.MAVI).length,
        [BUILDER_TYPES.GLUESTACK]: apps.filter(a => getAppBuilderType(a) === BUILDER_TYPES.GLUESTACK).length,
        [BUILDER_TYPES.SANDBOX]: apps.filter(a => getAppBuilderType(a) === BUILDER_TYPES.SANDBOX).length
    };

    const filteredApps = apps.filter(app => {
        const matchesSearch = 
            (app.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            getAppCategory(app).toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;

        if (selectedBuilderFilter === 'all') return true;
        return getAppBuilderType(app) === selectedBuilderFilter;
    });

    const filterTabs = [
        { key: 'all', label: 'All Builders', count: builderCounts.all, icon: Filter, color: '#475569', bgColor: '#f1f5f9' },
        { key: BUILDER_TYPES.MAVI, label: 'Mavi Builder', badge: 'PC', count: builderCounts[BUILDER_TYPES.MAVI], icon: Monitor, color: '#2563eb', bgColor: '#eff6ff' },
        { key: BUILDER_TYPES.GLUESTACK, label: 'Gluestack', badge: 'Mobile', count: builderCounts[BUILDER_TYPES.GLUESTACK], icon: Smartphone, color: '#7c3aed', bgColor: '#f5f3ff' },
        { key: BUILDER_TYPES.SANDBOX, label: 'Sandbox', badge: 'AI Code', count: builderCounts[BUILDER_TYPES.SANDBOX], icon: Sparkles, color: '#d97706', bgColor: '#fffbeb' }
    ];

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
            {/* Top Header */}
            <div style={{ padding: '20px 32px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <AppWindow size={28} color="#2563eb" />
                        App Management
                    </h2>
                    <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                        Kelola aplikasi terinstal berdasarkan builder asalnya (Mavi Builder PC, Gluestack Mobile, Sandbox AI)
                    </p>
                </div>
            </div>

            <div style={{ padding: '24px 32px', flex: 1, overflowY: 'auto' }}>
                {/* Builder Filter Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Filter size={14} /> Filter Builder:
                    </span>
                    {filterTabs.map(tab => {
                        const TabIcon = tab.icon;
                        const isSelected = selectedBuilderFilter === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setSelectedBuilderFilter(tab.key)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    borderRadius: '9999px',
                                    fontSize: '0.82rem',
                                    fontWeight: isSelected ? 800 : 600,
                                    border: isSelected ? `1.5px solid ${tab.color}` : '1px solid #e2e8f0',
                                    backgroundColor: isSelected ? tab.bgColor : 'white',
                                    color: isSelected ? tab.color : '#475569',
                                    cursor: 'pointer',
                                    boxShadow: isSelected ? `0 2px 8px -2px ${tab.color}30` : '0 1px 2px rgba(0,0,0,0.03)',
                                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <TabIcon size={15} color={isSelected ? tab.color : '#64748b'} />
                                <span>{tab.label}</span>
                                {tab.badge && (
                                    <span style={{
                                        fontSize: '0.65rem',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: isSelected ? `${tab.color}20` : '#f1f5f9',
                                        color: isSelected ? tab.color : '#64748b',
                                        fontWeight: 700
                                    }}>
                                        {tab.badge}
                                    </span>
                                )}
                                <span style={{
                                    marginLeft: '2px',
                                    padding: '2px 7px',
                                    borderRadius: '9999px',
                                    backgroundColor: isSelected ? tab.color : '#f1f5f9',
                                    color: isSelected ? 'white' : '#64748b',
                                    fontSize: '0.72rem',
                                    fontWeight: 700
                                }}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search and View Mode Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                        <input
                            type="text"
                            placeholder="Cari aplikasi berdasarkan nama atau kategori..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 16px 12px 44px',
                                borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white',
                                fontSize: '0.92rem', color: '#1e293b', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '4px' }}>
                        <button 
                            onClick={() => setViewMode('grid')}
                            style={{ padding: '8px', border: 'none', backgroundColor: viewMode === 'grid' ? '#f1f5f9' : 'transparent', borderRadius: '4px', cursor: 'pointer', color: viewMode === 'grid' ? '#0f172a' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            style={{ padding: '8px', border: 'none', backgroundColor: viewMode === 'list' ? '#f1f5f9' : 'transparent', borderRadius: '4px', cursor: 'pointer', color: viewMode === 'list' ? '#0f172a' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Memuat daftar aplikasi...</div>
                ) : filteredApps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <Box size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Tidak ada aplikasi ditemukan</h3>
                        <p style={{ color: '#64748b', margin: '8px 0 0 0' }}>
                            {selectedBuilderFilter !== 'all' 
                                ? `Belum ada aplikasi yang dibuat dengan ${BUILDER_METADATA[selectedBuilderFilter]?.label || 'builder ini'}.`
                                : 'Pasang aplikasi dari App Store atau buat baru melalui salah satu Builder.'}
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                        {filteredApps.map(app => {
                            const builderType = getAppBuilderType(app);
                            const builderInfo = getBuilderInfo(builderType);
                            const BuilderIcon = getBuilderIconComponent(builderType);
                            return (
                            <div key={app.id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: builderInfo.bgColor, border: `1px solid ${builderInfo.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: builderInfo.color }}>
                                            <BuilderIcon size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{app.name || 'Untitled App'}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                                {/* Category tag */}
                                                <span style={{ padding: '3px 8px', borderRadius: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.68rem', fontWeight: 600, color: '#475569' }}>
                                                    {getAppCategory(app)}
                                                </span>
                                                {/* Distinct Builder Badge */}
                                                <span style={{
                                                    padding: '3px 10px',
                                                    borderRadius: '20px',
                                                    backgroundColor: builderInfo.bgColor,
                                                    border: `1px solid ${builderInfo.borderColor}`,
                                                    fontSize: '0.7rem',
                                                    fontWeight: 800,
                                                    color: builderInfo.color,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <BuilderIcon size={11} />
                                                    {builderInfo.label} ({builderInfo.badge})
                                                </span>
                                                {app.version && (
                                                    <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>v{app.version}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '16px 24px', flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {app.description || 'Tidak ada deskripsi untuk aplikasi ini.'}
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
                                            <Calendar size={13} />
                                            <span>Dibuat: {new Date(app.created_at || Date.now()).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
                                            <ShieldCheck size={13} />
                                            <span>Status: {app.approval_status || 'DRAFT'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '14px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button
                                        onClick={() => handleEditApp(app)}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            padding: '8px 16px', borderRadius: '8px', border: `1px solid ${builderInfo.borderColor}`,
                                            backgroundColor: builderInfo.color, color: 'white', fontWeight: 700, cursor: 'pointer',
                                            fontSize: '0.84rem', transition: 'all 0.2s', boxShadow: `0 2px 4px ${builderInfo.color}30`
                                        }}
                                        title={`Buka di ${builderInfo.label}`}
                                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.9)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                                    >
                                        <Edit3 size={14} />
                                        Buka di {builderInfo.label}
                                    </button>
                                    <button
                                        onClick={() => handleUninstall(app.id, app.name)}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            padding: '8px 14px', borderRadius: '8px', border: '1px solid #fecaca',
                                            backgroundColor: 'white', color: '#dc2626', fontWeight: 700, cursor: 'pointer',
                                            fontSize: '0.84rem', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                                    >
                                        <Trash2 size={14} />
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                ) : (
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Aplikasi</th>
                                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Kategori</th>
                                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Builder Asal</th>
                                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Tanggal Buat</th>
                                    <th style={{ padding: '12px 24px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApps.map(app => {
                                    const builderType = getAppBuilderType(app);
                                    const builderInfo = getBuilderInfo(builderType);
                                    const BuilderIcon = getBuilderIconComponent(builderType);
                                    return (
                                    <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: builderInfo.bgColor, border: `1px solid ${builderInfo.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: builderInfo.color }}>
                                                    <BuilderIcon size={18} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e293b' }}>{app.name || 'Untitled App'}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{app.version ? `v${app.version}` : 'v1.0'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ padding: '3px 8px', borderRadius: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>
                                                {getAppCategory(app)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                backgroundColor: builderInfo.bgColor,
                                                border: `1px solid ${builderInfo.borderColor}`,
                                                fontSize: '0.72rem',
                                                fontWeight: 800,
                                                color: builderInfo.color,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}>
                                                <BuilderIcon size={12} />
                                                {builderInfo.label} ({builderInfo.badge})
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '0.82rem', color: '#475569', fontWeight: 500 }}>{app.approval_status || 'DRAFT'}</td>
                                        <td style={{ padding: '16px 24px', fontSize: '0.82rem', color: '#475569', fontWeight: 500 }}>{new Date(app.created_at || Date.now()).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleEditApp(app)}
                                                style={{
                                                    padding: '6px 14px', borderRadius: '6px', border: `1px solid ${builderInfo.borderColor}`,
                                                    backgroundColor: builderInfo.color, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem',
                                                    display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s'
                                                }}
                                                title={`Buka di ${builderInfo.label}`}
                                                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.9)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                                            >
                                                <Edit3 size={13} />
                                                Buka di {builderInfo.label}
                                            </button>
                                            <button
                                                onClick={() => handleUninstall(app.id, app.name)}
                                                style={{
                                                    padding: '6px 12px', borderRadius: '6px', border: '1px solid #fecaca',
                                                    backgroundColor: 'white', color: '#dc2626', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem',
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                                            >
                                                <Trash2 size={13} />
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppManagement;
