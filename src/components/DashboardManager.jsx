import React, { useState, useEffect } from 'react';
import { 
    Layout, 
    Plus, 
    Search, 
    Trash2, 
    Edit3, 
    ExternalLink,
    Clock,
    LayoutGrid,
    MoreVertical,
    Activity,
    LayoutDashboard,
    ShieldAlert,
    Award
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllDashboards, deleteDashboard, saveDashboard, saveAnalysis } from '../utils/supabaseFrontlineDB';
import { toast } from 'react-hot-toast';

const DASHBOARD_TEMPLATES = [
    {
        id: 'tmpl_shop_floor_productivity',
        name: 'Dashboard Produktivitas Pabrik',
        description: 'Visualisasi throughput per stasiun, waktu siklus (cycle time) rata-rata stasiun, dan leaderboard operator.',
        color: '#0ea5e9',
        icon: Activity,
        analyses: [
            {
                suffix: 'shift_output',
                name: 'Output Produksi per Jam (Template)',
                description: 'Tren volume output produksi yang diselesaikan per stasiun secara hourly.',
                config: {
                    type: 'LINE',
                    tableId: 'SYSTEM:COMPLETIONS',
                    xAxisColumn: 'created_at',
                    yAxisColumn: 'id',
                    aggregation: 'COUNT',
                    timeBucket: 'HOURLY',
                    color: '#10b981',
                    kpiLabel: 'Hourly Throughput'
                }
            },
            {
                suffix: 'station_cycle',
                name: 'Waktu Siklus Stasiun (Template)',
                description: 'Memantau rata-rata durasi pengerjaan (cycle time) dalam ms untuk setiap stasiun.',
                config: {
                    type: 'BAR',
                    tableId: 'SYSTEM:COMPLETIONS',
                    xAxisColumn: 'station_name',
                    yAxisColumn: 'duration_ms',
                    aggregation: 'AVERAGE',
                    color: '#0ea5e9',
                    kpiLabel: 'Rata-rata Waktu Siklus (ms)'
                }
            },
            {
                suffix: 'operator_leaderboard',
                name: 'Leaderboard Operator (Template)',
                description: 'Perbandingan produktivitas berdasarkan jumlah penyelesaian unit oleh masing-masing operator.',
                config: {
                    type: 'BAR',
                    tableId: 'SYSTEM:COMPLETIONS',
                    xAxisColumn: 'user_id',
                    yAxisColumn: 'id',
                    aggregation: 'COUNT',
                    color: '#f59e0b',
                    kpiLabel: 'Leaderboard Output'
                }
            }
        ],
        layout: (analyses) => [
            { i: analyses[0].id, x: 0, y: 0, w: 12, h: 4, type: 'ANALYSIS', analysisId: analyses[0].id, name: analyses[0].name },
            { i: analyses[1].id, x: 0, y: 4, w: 6, h: 4, type: 'ANALYSIS', analysisId: analyses[1].id, name: analyses[1].name },
            { i: analyses[2].id, x: 6, y: 4, w: 6, h: 4, type: 'ANALYSIS', analysisId: analyses[2].id, name: analyses[2].name }
        ]
    },
    {
        id: 'tmpl_quality_yield',
        name: 'Dashboard Kualitas & Yield',
        description: 'Menganalisis rasio cacat (defect rate), status kelulusan (Yield), dan visualisasi Pareto cacat utama.',
        color: '#8b5cf6',
        icon: ShieldAlert,
        analyses: [
            {
                suffix: 'defect_pareto',
                name: 'Pareto Cacat & Downtime (Template)',
                description: 'Membantu identifikasi defect atau masalah operasional utama yang sering terjadi.',
                config: {
                    type: 'PARETO',
                    tableId: 'SYSTEM:COMPLETIONS',
                    xAxisColumn: 'status',
                    yAxisColumn: 'id',
                    aggregation: 'COUNT',
                    color: '#ef4444',
                    kpiLabel: 'Defect Terbanyak'
                }
            },
            {
                suffix: 'oee_status',
                name: 'OEE & Status Produksi (Template)',
                description: 'Menganalisis rasio penyelesaian tugas berdasarkan status (COMPLETED, CANCELED, SAVED).',
                config: {
                    type: 'PIE',
                    tableId: 'SYSTEM:COMPLETIONS',
                    xAxisColumn: 'status',
                    yAxisColumn: 'id',
                    aggregation: 'COUNT',
                    color: '#8b5cf6',
                    kpiLabel: 'Total Status'
                }
            }
        ],
        layout: (analyses) => [
            { i: analyses[0].id, x: 0, y: 0, w: 8, h: 4, type: 'ANALYSIS', analysisId: analyses[0].id, name: analyses[0].name },
            { i: analyses[1].id, x: 8, y: 0, w: 4, h: 4, type: 'ANALYSIS', analysisId: analyses[1].id, name: analyses[1].name }
        ]
    },
    {
        id: 'tmpl_oee_equipment',
        name: 'Dashboard Efektivitas OEE',
        description: 'Gambaran komprehensif mengenai total output produksi (KPI), stasiun teraktif, dan status OEE.',
        color: '#f59e0b',
        icon: Award,
        analyses: [
            {
                suffix: 'total_kpi',
                name: 'Total Output Produksi KPI (Template)',
                description: 'Menampilkan total unit yang diselesaikan dari tabel completions.',
                config: {
                    type: 'KPI',
                    tableId: 'SYSTEM:COMPLETIONS',
                    xAxisColumn: 'status',
                    yAxisColumn: 'id',
                    aggregation: 'COUNT',
                    color: '#0ea5e9',
                    kpiLabel: 'Total Unit Selesai'
                }
            },
            {
                suffix: 'oee_status',
                name: 'OEE & Status Produksi (Template)',
                description: 'Menganalisis rasio penyelesaian tugas berdasarkan status (COMPLETED, CANCELED, SAVED).',
                config: {
                    type: 'PIE',
                    tableId: 'SYSTEM:COMPLETIONS',
                    xAxisColumn: 'status',
                    yAxisColumn: 'id',
                    aggregation: 'COUNT',
                    color: '#8b5cf6',
                    kpiLabel: 'Total Status'
                }
            },
            {
                suffix: 'station_cycle',
                name: 'Waktu Siklus Stasiun (Template)',
                description: 'Memantau rata-rata durasi pengerjaan (cycle time) dalam ms untuk setiap stasiun.',
                config: {
                    type: 'BAR',
                    tableId: 'SYSTEM:COMPLETIONS',
                    xAxisColumn: 'station_name',
                    yAxisColumn: 'duration_ms',
                    aggregation: 'AVERAGE',
                    color: '#0ea5e9',
                    kpiLabel: 'Rata-rata Waktu Siklus (ms)'
                }
            }
        ],
        layout: (analyses) => [
            { i: analyses[0].id, x: 0, y: 0, w: 4, h: 4, type: 'ANALYSIS', analysisId: analyses[0].id, name: analyses[0].name },
            { i: analyses[1].id, x: 4, y: 0, w: 8, h: 4, type: 'ANALYSIS', analysisId: analyses[1].id, name: analyses[1].name },
            { i: analyses[2].id, x: 0, y: 4, w: 12, h: 4, type: 'ANALYSIS', analysisId: analyses[2].id, name: analyses[2].name }
        ]
    }
];


const DashboardManager = () => {
    const navigate = useNavigate();
    const [dashboards, setDashboards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getAllDashboards();
            setDashboards(data || []);
        } catch (err) {
            console.error('Failed to load dashboards:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this dashboard?')) return;
        try {
            await deleteDashboard(id);
            loadData();
        } catch (err) {
            alert('Error deleting dashboard: ' + err.message);
        }
    };

    const generateDefaultPerformanceDashboard = async () => {
        setLoading(true);
        try {
            // 1. Create Throughput Analysis
            const throughputAnalysis = {
                name: 'Total Throughput (By App)',
                description: 'Historical completion counts aggregated by Application',
                config: {
                    type: 'BAR',
                    tableId: 'SYSTEM:COMPLETIONS',
                    xAxisColumn: 'app_id',
                    yAxisColumn: 'id',
                    aggregation: 'COUNT',
                    color: '#0ea5e9'
                }
            };

            // 2. Create Cycle Time Analysis
            const cycleTimeAnalysis = {
                name: 'Avg Cycle Time (By Operator)',
                description: 'Average duration of completed cycles per Operator',
                config: {
                    type: 'LINE',
                    tableId: 'SYSTEM:COMPLETIONS',
                    xAxisColumn: 'operator_id',
                    yAxisColumn: 'duration',
                    aggregation: 'AVERAGE',
                    color: '#8b5cf6'
                }
            };

            const savedThroughput = await saveAnalysis(throughputAnalysis);
            const savedCycleTime = await saveAnalysis(cycleTimeAnalysis);

            // 3. Create Dashboard
            const newDashboard = {
                name: 'App Performance Dashboard',
                description: 'Automatically generated overview of production throughput and cycle efficiency.',
                layout: [
                    { i: savedThroughput.id, x: 0, y: 0, w: 6, h: 4, type: 'ANALYSIS', analysisId: savedThroughput.id },
                    { i: savedCycleTime.id, x: 6, y: 0, w: 6, h: 4, type: 'ANALYSIS', analysisId: savedCycleTime.id }
                ]
            };

            await saveDashboard(newDashboard);
            alert('App Performance Dashboard generated successfully!');
            loadData();
        } catch (err) {
            console.error('Failed to generate dashboard:', err);
            alert('Error generating dashboard: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInstallDashboardTemplate = async (tmpl) => {
        const loadToast = toast.loading(`Memasang template "${tmpl.name}"...`);
        try {
            const createdAnalyses = [];
            for (const analysisData of tmpl.analyses) {
                const newAnalysis = {
                    name: analysisData.name,
                    description: analysisData.description,
                    config: analysisData.config
                };
                const saved = await saveAnalysis(newAnalysis);
                createdAnalyses.push(saved);
            }

            const dashboardLayout = tmpl.layout(createdAnalyses);

            const newDashboard = {
                name: tmpl.name,
                description: tmpl.description,
                layout: dashboardLayout
            };
            await saveDashboard(newDashboard);

            toast.success(`Dashboard "${tmpl.name}" berhasil dipasang!`, { id: loadToast });
            loadData();
        } catch (err) {
            console.error('Error installing dashboard template:', err);
            toast.error('Gagal memasang dashboard template: ' + err.message, { id: loadToast });
        }
    };


    const filteredDashboards = dashboards.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ height: '100%', backgroundColor: '#f8fafc', padding: '24px 28px', overflowY: 'auto' }}>
            <div style={{ width: '100%', maxWidth: 'none', margin: 0 }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ color: '#0f172a', fontSize: '2.2rem', fontWeight: 900, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ backgroundColor: '#0ea5e9', padding: '10px', borderRadius: '12px' }}>
                                <Layout size={32} color="white" />
                            </div>
                            Dashboards
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Combine multiple analyses into a single real-time operational overview.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <button 
                            onClick={generateDefaultPerformanceDashboard}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', backgroundColor: 'white', color: '#0ea5e9', border: '2px solid #0ea5e9', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.1)' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                        >
                            <Activity size={20} /> Auto-Generate Performance Dashboard
                        </button>
                        <button 
                            onClick={() => navigate('/dashboards/new')}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', textDecoration: 'none', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)', transition: 'transform 0.2s' }}
                        >
                            <Plus size={20} /> Create New Dashboard
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '30px', position: 'relative' }}>
                    <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="text"
                        placeholder="Search dashboards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '16px 16px 16px 50px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    />
                </div>

                {/* Dashboard Templates Quick Start */}
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LayoutDashboard size={20} color="#0ea5e9" /> Mulai Cepat dengan Template Dashboard MES
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {DASHBOARD_TEMPLATES.map(tmpl => {
                            const TmplIcon = tmpl.icon;
                            return (
                                <div 
                                    key={tmpl.id} 
                                    style={{ 
                                        backgroundColor: 'white', 
                                        borderRadius: '16px', 
                                        border: '1px solid #e2e8f0', 
                                        padding: '24px', 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                                        transition: 'all 0.2s',
                                        cursor: 'default'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0,0,0,0.08)';
                                        e.currentTarget.style.borderColor = tmpl.color;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${tmpl.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <TmplIcon size={20} color={tmpl.color} />
                                            </div>
                                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{tmpl.name}</h3>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4, marginBottom: '16px' }}>{tmpl.description}</p>
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Termasuk Visualisasi:</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {tmpl.analyses.map((a, idx) => (
                                                    <span key={idx} style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                                                        {a.name.replace(' (Template)', '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleInstallDashboardTemplate(tmpl)}
                                        style={{ 
                                            width: '100%',
                                            padding: '10px 16px',
                                            backgroundColor: tmpl.color,
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'opacity 0.15s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        Pasang Template
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px', color: '#64748b' }}>Loading dashboards...</div>
                ) : filteredDashboards.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px', backgroundColor: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                        <LayoutGrid size={64} color="#e2e8f0" style={{ marginBottom: '20px' }} />
                        <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>No dashboards found</h2>
                        <p style={{ color: '#64748b' }}>Design your first operational dashboard to visualize your data efficiently.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                        {filteredDashboards.map(dashboard => (
                            <div key={dashboard.id} style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <div style={{ backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '10px' }}>
                                            <LayoutGrid size={20} color="#0ea5e9" />
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button onClick={() => navigate(`/dashboards/edit/${dashboard.id}`)} style={{ padding: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: '6px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}><Edit3 size={18} /></button>
                                            <button onClick={() => handleDelete(dashboard.id)} style={{ padding: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '6px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{dashboard.name}</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>{dashboard.description || 'No description provided.'}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Updated {new Date(dashboard.updated_at).toLocaleDateString()}</div>
                                        <Link to={`/dashboards/edit/${dashboard.id}`} style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0ea5e9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>View Dashboard <ExternalLink size={14} /></Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardManager;
