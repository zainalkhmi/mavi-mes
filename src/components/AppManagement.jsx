import React, { useState, useEffect } from 'react';
import { Layout, Trash2, Search, AppWindow, Calendar, ShieldCheck, Box, LayoutGrid, List, Edit3, Wrench, Smartphone, Sparkles, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllFrontlineApps, deleteFrontlineApp } from '../utils/supabaseFrontlineDB';
import toast from 'react-hot-toast';

const AppManagement = () => {
    const navigate = useNavigate();
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    useEffect(() => {
        loadApps();
    }, []);

    // Get builder type info for display
    const getBuilderType = (app) => {
        return app.builder_type || 'app_builder';
    };

    // Get builder type display info
    const getBuilderInfo = (builderType) => {
        switch (builderType) {
            case 'gluestack':
                return { label: 'GlueStack', icon: Smartphone, color: '#7c3aed', bgColor: '#f5f3ff' };
            case 'sandbox':
                return { label: 'Sandbox', icon: Sparkles, color: '#f59e0b', bgColor: '#fffbeb' };
            case 'app_builder':
            default:
                return { label: 'App Builder', icon: Wrench, color: '#2563eb', bgColor: '#eff6ff' };
        }
    };

    // Navigate to correct builder based on app's builder_type
    const handleEditApp = (app) => {
        const builderType = getBuilderType(app);
        const editUrl = `/ui-engine?appId=${app.id}`;
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

    const filteredApps = apps.filter(app => 
        (app.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAppCategory(app).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <AppWindow size={28} color="#2563eb" />
                        App Management
                    </h2>
                    <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>View and manage installed frontline applications</p>
                </div>
            </div>

            <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                        <input
                            type="text"
                            placeholder="Search apps by name or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 16px 14px 44px',
                                borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white',
                                fontSize: '0.95rem', color: '#1e293b', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
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
                    <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading applications...</div>
                ) : filteredApps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <Box size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>No apps found</h3>
                        <p style={{ color: '#64748b', margin: '8px 0 0 0' }}>Install applications from the App Store or build them in App Builder.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                        {filteredApps.map(app => {
                            const builderType = getBuilderType(app);
                            const builderInfo = getBuilderInfo(builderType);
                            const BuilderIcon = builderInfo.icon;
                            return (
                            <div key={app.id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                                            <Layout size={28} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>{app.name || 'Untitled App'}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                                <span style={{ padding: '4px 10px', borderRadius: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>
                                                    {getAppCategory(app)}
                                                </span>
                                                <span style={{ padding: '4px 10px', borderRadius: '20px', backgroundColor: builderInfo.bgColor, border: `1px solid ${builderInfo.color}30`, fontSize: '0.7rem', fontWeight: 700, color: builderInfo.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <BuilderIcon size={10} />
                                                    {builderInfo.label}
                                                </span>
                                                {app.version && (
                                                    <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontSize: '0.7rem' }}>v{app.version}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '20px 24px', flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {app.description || 'No description available for this application.'}
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                                            <Calendar size={14} />
                                            <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                                            <ShieldCheck size={14} />
                                            <span>Status: {app.approval_status || 'DRAFT'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button
                                        onClick={() => handleEditApp(app)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 20px', borderRadius: '8px', border: '1px solid #bfdbfe',
                                            backgroundColor: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
                                    >
                                        <Edit3 size={16} />
                                        Edit App
                                    </button>
                                    <button
                                        onClick={() => handleUninstall(app.id, app.name)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 20px', borderRadius: '8px', border: '1px solid #fecaca',
                                            backgroundColor: 'white', color: '#dc2626', fontWeight: 700, cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                                    >
                                        <Trash2 size={16} />
                                        Uninstall
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
                                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Application</th>
                                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Category</th>
                                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Builder</th>
                                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Created</th>
                                    <th style={{ padding: '12px 24px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApps.map(app => {
                                    const builderType = getBuilderType(app);
                                    const builderInfo = getBuilderInfo(builderType);
                                    const BuilderIcon = builderInfo.icon;
                                    return (
                                    <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                                                    <Layout size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>{app.name || 'Untitled App'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{app.version ? `v${app.version}` : 'v1.0'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                                                {getAppCategory(app)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '20px', backgroundColor: builderInfo.bgColor, border: `1px solid ${builderInfo.color}30`, fontSize: '0.75rem', fontWeight: 700, color: builderInfo.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <BuilderIcon size={12} />
                                                {builderInfo.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>{app.approval_status || 'DRAFT'}</td>
                                        <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>{new Date(app.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleEditApp(app)}
                                                style={{
                                                    padding: '8px 16px', borderRadius: '6px', border: '1px solid #bfdbfe',
                                                    backgroundColor: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
                                            >
                                                <Edit3 size={14} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleUninstall(app.id, app.name)}
                                                style={{
                                                    padding: '8px 16px', borderRadius: '6px', border: '1px solid #fecaca',
                                                    backgroundColor: 'white', color: '#dc2626', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                                            >
                                                <Trash2 size={14} />
                                                Uninstall
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
