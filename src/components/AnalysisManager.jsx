import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart3, Plus, Search, Trash2, Edit3, ExternalLink, Copy,
    LayoutGrid, List, MoreVertical, Activity, TrendingUp, PieChart,
    Clock, Star, StarOff, ChevronDown, Zap, Target, FolderOpen,
    Filter, SortAsc, SortDesc, ArrowUpDown, Sparkles, Eye
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllSavedAnalyses, deleteAnalysis, saveAnalysis } from '../utils/supabaseFrontlineDB';
import { toast } from 'react-hot-toast';

const CHART_TYPES = [
    { id: 'BAR', icon: BarChart3, label: 'Bar Chart', color: '#4f46e5' },
    { id: 'LINE', icon: TrendingUp, label: 'Line Chart', color: '#0ea5e9' },
    { id: 'PIE', icon: PieChart, label: 'Pie Chart', color: '#8b5cf6' },
    { id: 'KPI', icon: Zap, label: 'KPI / Scorecard', color: '#f59e0b' },
    { id: 'PARETO', icon: Target, label: 'Pareto Chart', color: '#ef4444' },
];

const ANALYTICS_TEMPLATES = [
    {
        id: 'oee_status',
        name: 'OEE & Status Produksi',
        description: 'Menganalisis rasio penyelesaian tugas berdasarkan status (COMPLETED, CANCELED, SAVED).',
        icon: PieChart,
        color: '#8b5cf6',
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
        id: 'defect_pareto',
        name: 'Pareto Cacat & Downtime',
        description: 'Membantu identifikasi defect atau masalah operasional utama yang sering terjadi.',
        icon: Target,
        color: '#ef4444',
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
        id: 'station_cycle',
        name: 'Waktu Siklus Stasiun (Cycle Time)',
        description: 'Memantau rata-rata durasi pengerjaan (cycle time) dalam ms untuk setiap stasiun.',
        icon: TrendingUp,
        color: '#0ea5e9',
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
        id: 'shift_output',
        name: 'Output Produksi per Jam',
        description: 'Tren volume output produksi yang diselesaikan per stasiun secara hourly.',
        icon: BarChart3,
        color: '#10b981',
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
        id: 'operator_leaderboard',
        name: 'Leaderboard Operator',
        description: 'Perbandingan produktivitas berdasarkan jumlah penyelesaian unit oleh masing-masing operator.',
        icon: Zap,
        color: '#f59e0b',
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
];

const AnalysisManager = () => {
    const navigate = useNavigate();
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('updated');
    const [sortDir, setSortDir] = useState('desc');
    const [filterType, setFilterType] = useState('All');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [modalTab, setModalTab] = useState('types'); // 'types' | 'templates'
    const [favorites, setFavorites] = useState(() => {
        try { return JSON.parse(localStorage.getItem('mes_analysis_favorites') || '[]'); } catch { return []; }
    });
    const [contextMenu, setContextMenu] = useState(null);

    const handleCreateFromTemplate = async (tmpl) => {
        const loadToast = toast.loading(`Membuat template "${tmpl.name}"...`);
        try {
            const newAnalysis = {
                name: tmpl.name,
                description: tmpl.description,
                config: { ...tmpl.config }
            };
            await saveAnalysis(newAnalysis);
            setShowCreateModal(false);
            toast.success(`Template "${tmpl.name}" berhasil dibuat!`, { id: loadToast });
            loadData();
        } catch (err) {
            toast.error('Gagal membuat template: ' + err.message, { id: loadToast });
        }
    };


    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try { setAnalyses(await getAllSavedAnalyses()); }
        catch (err) { console.error('Failed to load analyses:', err); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this analysis permanently?')) return;
        try { await deleteAnalysis(id); loadData(); } catch (err) { alert('Error: ' + err.message); }
    };

    const handleDuplicate = async (analysis) => {
        try {
            const copy = { ...analysis, id: undefined, name: `${analysis.name} (Copy)` };
            await saveAnalysis(copy);
            loadData();
        } catch (err) { alert('Error duplicating: ' + err.message); }
    };

    const toggleFavorite = (id) => {
        const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
        setFavorites(next);
        localStorage.setItem('mes_analysis_favorites', JSON.stringify(next));
    };

    const sortedFiltered = useMemo(() => {
        let list = analyses.filter(a =>
            a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filterType !== 'All') list = list.filter(a => a.config?.type === filterType);
        list.sort((a, b) => {
            if (sortBy === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            if (sortBy === 'updated') return sortDir === 'asc' ? new Date(a.updated_at) - new Date(b.updated_at) : new Date(b.updated_at) - new Date(a.updated_at);
            if (sortBy === 'favorite') {
                const aFav = favorites.includes(a.id) ? 1 : 0;
                const bFav = favorites.includes(b.id) ? 1 : 0;
                return bFav - aFav;
            }
            return 0;
        });
        return list;
    }, [analyses, searchTerm, filterType, sortBy, sortDir, favorites]);

    const stats = useMemo(() => ({
        total: analyses.length,
        bar: analyses.filter(a => a.config?.type === 'BAR').length,
        line: analyses.filter(a => a.config?.type === 'LINE').length,
        pie: analyses.filter(a => a.config?.type === 'PIE').length,
        kpi: analyses.filter(a => a.config?.type === 'KPI').length,
    }), [analyses]);

    const getTypeInfo = (type) => CHART_TYPES.find(t => t.id === type) || CHART_TYPES[0];

    const AnalysisCard = ({ analysis }) => {
        const typeInfo = getTypeInfo(analysis.config?.type);
        const Icon = typeInfo.icon;
        const isFav = favorites.includes(analysis.id);

        if (viewMode === 'list') {
            return (
                <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'14px 20px', backgroundColor:'white', borderRadius:'12px', border:'1px solid #e2e8f0', cursor:'pointer', transition:'all 0.15s' }}
                     onMouseEnter={e => { e.currentTarget.style.borderColor = typeInfo.color; e.currentTarget.style.boxShadow = `0 0 0 1px ${typeInfo.color}20`; }}
                     onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                     onClick={() => navigate(`/analytics/edit/${analysis.id}`)}>
                    <div style={{ width:36, height:36, borderRadius:'10px', backgroundColor:`${typeInfo.color}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Icon size={18} color={typeInfo.color} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'0.95rem', fontWeight:700, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{analysis.name}</div>
                        <div style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{analysis.description || 'No description'}</div>
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'#94a3b8', whiteSpace:'nowrap' }}>{new Date(analysis.updated_at).toLocaleDateString()}</div>
                    <div style={{ display:'flex', gap:'4px' }}>
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(analysis.id); }} style={{ padding:'6px', background:'none', border:'none', cursor:'pointer', color: isFav ? '#f59e0b' : '#cbd5e1' }}>
                            {isFav ? <Star size={16} fill="#f59e0b" /> : <StarOff size={16} />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(analysis.id); }} style={{ padding:'6px', background:'none', border:'none', cursor:'pointer', color:'#ef4444' }}><Trash2 size={16} /></button>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ backgroundColor:'white', borderRadius:'16px', border:'1px solid #e2e8f0', overflow:'hidden', transition:'all 0.2s', cursor:'pointer', position:'relative' }}
                 onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0,0,0,0.08)'; }}
                 onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                 onClick={() => navigate(`/analytics/edit/${analysis.id}`)}>
                {/* Color bar */}
                <div style={{ height:'4px', background:`linear-gradient(90deg, ${typeInfo.color}, ${typeInfo.color}88)` }} />
                <div style={{ padding:'20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                        <div style={{ width:42, height:42, borderRadius:'12px', backgroundColor:`${typeInfo.color}10`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Icon size={22} color={typeInfo.color} />
                        </div>
                        <div style={{ display:'flex', gap:'2px', alignItems:'center' }}>
                            <button onClick={e => { e.stopPropagation(); toggleFavorite(analysis.id); }} style={{ padding:'6px', background:'none', border:'none', cursor:'pointer', color: isFav ? '#f59e0b' : '#cbd5e1', borderRadius:'8px' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                {isFav ? <Star size={16} fill="#f59e0b" /> : <StarOff size={16} />}
                            </button>
                            <button onClick={e => { e.stopPropagation(); setContextMenu(contextMenu === analysis.id ? null : analysis.id); }} style={{ padding:'6px', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', borderRadius:'8px' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <MoreVertical size={16} />
                            </button>
                        </div>
                    </div>
                    {/* Context menu */}
                    {contextMenu === analysis.id && (
                        <div style={{ position:'absolute', top:70, right:16, backgroundColor:'white', borderRadius:'10px', boxShadow:'0 10px 40px rgba(0,0,0,0.12)', border:'1px solid #e2e8f0', zIndex:100, minWidth:160 }}>
                            <button onClick={e => { e.stopPropagation(); navigate(`/analytics/edit/${analysis.id}`); setContextMenu(null); }}
                                    style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 16px', width:'100%', border:'none', background:'none', cursor:'pointer', fontSize:'0.85rem', color:'#334155' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <Edit3 size={14} /> Edit
                            </button>
                            <button onClick={e => { e.stopPropagation(); handleDuplicate(analysis); setContextMenu(null); }}
                                    style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 16px', width:'100%', border:'none', background:'none', cursor:'pointer', fontSize:'0.85rem', color:'#334155' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <Copy size={14} /> Duplicate
                            </button>
                            <div style={{ height:'1px', backgroundColor:'#f1f5f9', margin:'4px 0' }} />
                            <button onClick={e => { e.stopPropagation(); handleDelete(analysis.id); setContextMenu(null); }}
                                    style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 16px', width:'100%', border:'none', background:'none', cursor:'pointer', fontSize:'0.85rem', color:'#ef4444' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}
                    <h3 style={{ margin:'0 0 6px', fontSize:'1.05rem', fontWeight:800, color:'#0f172a', lineHeight:1.3 }}>{analysis.name}</h3>
                    <p style={{ color:'#64748b', fontSize:'0.8rem', marginBottom:'16px', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        {analysis.description || 'No description provided.'}
                    </p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'14px', borderTop:'1px solid #f1f5f9' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                            <span style={{ fontSize:'0.65rem', fontWeight:700, color:typeInfo.color, backgroundColor:`${typeInfo.color}12`, padding:'3px 8px', borderRadius:'6px', textTransform:'uppercase' }}>{typeInfo.label}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'0.7rem', color:'#94a3b8' }}>
                            <Clock size={12} /> {new Date(analysis.updated_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ height:'100%', display:'flex', backgroundColor:'#f8fafc' }} onClick={() => setContextMenu(null)}>
            {/* Left sidebar */}
            <div style={{ width:'260px', backgroundColor:'white', borderRight:'1px solid #e2e8f0', padding:'24px 16px', display:'flex', flexDirection:'column', gap:'6px', flexShrink:0 }}>
                <div style={{ padding:'12px 14px', marginBottom:'12px' }}>
                    <h2 style={{ fontSize:'1.1rem', fontWeight:900, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:'10px' }}>
                        <BarChart3 size={20} color="#4f46e5" /> Analytics
                    </h2>
                    <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'6px 0 0' }}>Create & manage analyses</p>
                </div>

                <button onClick={() => setShowCreateModal(true)}
                        style={{ display:'flex', alignItems:'center', gap:'10px', padding:'11px 14px', backgroundColor:'#4f46e5', color:'white', border:'none', borderRadius:'10px', fontWeight:700, cursor:'pointer', fontSize:'0.85rem', transition:'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4338ca'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#4f46e5'}>
                    <Plus size={18} /> New Analysis
                </button>

                <div style={{ marginTop:'16px', borderTop:'1px solid #f1f5f9', paddingTop:'16px' }}>
                    <div style={{ fontSize:'0.65rem', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', padding:'0 14px', marginBottom:'8px' }}>Filter by Type</div>
                    {[{ id:'All', label:'All Analyses', icon: FolderOpen, count: stats.total }, ...CHART_TYPES.map(t => ({ id: t.id, label: t.label, icon: t.icon, color: t.color, count: analyses.filter(a => a.config?.type === t.id).length }))].map(item => (
                        <button key={item.id} onClick={() => setFilterType(item.id)}
                                style={{ display:'flex', alignItems:'center', gap:'10px', width:'100%', padding:'9px 14px', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'0.85rem', fontWeight: filterType === item.id ? 700 : 500,
                                         backgroundColor: filterType === item.id ? '#f0f0ff' : 'transparent', color: filterType === item.id ? '#4f46e5' : '#475569', transition:'all 0.15s' }}
                                onMouseEnter={e => { if (filterType !== item.id) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                onMouseLeave={e => { if (filterType !== item.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <item.icon size={16} color={item.color || (filterType === item.id ? '#4f46e5' : '#94a3b8')} />
                            <span style={{ flex:1, textAlign:'left' }}>{item.label}</span>
                            <span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:600 }}>{item.count}</span>
                        </button>
                    ))}
                </div>

                <div style={{ marginTop:'auto', borderTop:'1px solid #f1f5f9', paddingTop:'16px' }}>
                    <div style={{ fontSize:'0.65rem', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', padding:'0 14px', marginBottom:'8px' }}>Quick Stats</div>
                    <div style={{ padding:'12px 14px', backgroundColor:'#f8fafc', borderRadius:'10px' }}>
                        <div style={{ fontSize:'2rem', fontWeight:900, color:'#4f46e5' }}>{stats.total}</div>
                        <div style={{ fontSize:'0.75rem', color:'#64748b' }}>Total Analyses</div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div style={{ flex:1, padding:'24px 32px', overflowY:'auto' }}>
                {/* Toolbar */}
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
                    <div style={{ flex:1, position:'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)' }} />
                        <input type="text" placeholder="Search analyses by name or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                               style={{ width:'100%', padding:'11px 14px 11px 42px', borderRadius:'10px', border:'1px solid #e2e8f0', fontSize:'0.9rem', outline:'none', transition:'border 0.15s' }}
                               onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                            style={{ padding:'11px 14px', borderRadius:'10px', border:'1px solid #e2e8f0', fontSize:'0.85rem', color:'#475569', cursor:'pointer', backgroundColor:'white' }}>
                        <option value="updated">Last Modified</option>
                        <option value="name">Name</option>
                        <option value="favorite">Favorites First</option>
                    </select>
                    <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                            style={{ padding:'10px', border:'1px solid #e2e8f0', borderRadius:'10px', backgroundColor:'white', cursor:'pointer', color:'#64748b', display:'flex' }}>
                        {sortDir === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                    </button>
                    <div style={{ width:'1px', height:'28px', backgroundColor:'#e2e8f0' }} />
                    <button onClick={() => setViewMode('grid')} style={{ padding:'10px', border:'1px solid', borderColor: viewMode === 'grid' ? '#4f46e5' : '#e2e8f0', borderRadius:'10px', backgroundColor: viewMode === 'grid' ? '#f0f0ff' : 'white', cursor:'pointer', color: viewMode === 'grid' ? '#4f46e5' : '#94a3b8', display:'flex' }}>
                        <LayoutGrid size={18} />
                    </button>
                    <button onClick={() => setViewMode('list')} style={{ padding:'10px', border:'1px solid', borderColor: viewMode === 'list' ? '#4f46e5' : '#e2e8f0', borderRadius:'10px', backgroundColor: viewMode === 'list' ? '#f0f0ff' : 'white', cursor:'pointer', color: viewMode === 'list' ? '#4f46e5' : '#94a3b8', display:'flex' }}>
                        <List size={18} />
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign:'center', padding:'80px', color:'#64748b' }}>
                        <Activity size={32} color="#4f46e5" style={{ marginBottom:'16px', animation:'spin 1s linear infinite' }} />
                        <div>Loading analyses...</div>
                    </div>
                ) : sortedFiltered.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'80px 40px', backgroundColor:'white', borderRadius:'20px', border:'1px solid #e2e8f0' }}>
                        <div style={{ width:80, height:80, borderRadius:'20px', backgroundColor:'#f0f0ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                            <BarChart3 size={36} color="#c7d2fe" />
                        </div>
                        <h2 style={{ color:'#1e293b', marginBottom:'8px', fontSize:'1.25rem' }}>
                            {searchTerm ? 'No matching analyses' : 'No analyses yet'}
                        </h2>
                        <p style={{ color:'#94a3b8', fontSize:'0.9rem', marginBottom:'24px' }}>
                            {searchTerm ? `No results for "${searchTerm}"` : 'Create your first analysis to start visualizing shop floor data.'}
                        </p>
                        {!searchTerm && (
                            <button onClick={() => setShowCreateModal(true)}
                                    style={{ padding:'12px 24px', backgroundColor:'#4f46e5', color:'white', border:'none', borderRadius:'10px', fontWeight:700, cursor:'pointer', fontSize:'0.9rem', display:'inline-flex', alignItems:'center', gap:'8px' }}>
                                <Plus size={18} /> Create First Analysis
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px' }}>
                        {sortedFiltered.map(a => <AnalysisCard key={a.id} analysis={a} />)}
                    </div>
                ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                        {sortedFiltered.map(a => <AnalysisCard key={a.id} analysis={a} />)}
                    </div>
                )}
            </div>

            {/* New Analysis Modal */}
            {showCreateModal && (
                <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)' }}
                     onClick={() => setShowCreateModal(false)}>
                    <div style={{ backgroundColor:'white', borderRadius:'20px', width:'580px', maxHeight:'85vh', overflow:'hidden', boxShadow:'0 25px 50px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}
                         onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div style={{ padding:'24px 28px 16px', borderBottom: '1px solid #f1f5f9' }}>
                            <h2 style={{ fontSize:'1.3rem', fontWeight:900, color:'#0f172a', margin:'0 0 12px' }}>Buat Analisis Baru</h2>
                            
                            {/* Tab Switcher */}
                            <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                                <button 
                                    onClick={() => setModalTab('types')}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                                        backgroundColor: modalTab === 'types' ? 'white' : 'transparent',
                                        color: modalTab === 'types' ? '#4f46e5' : '#64748b',
                                        boxShadow: modalTab === 'types' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    Tipe Chart Kosong
                                </button>
                                <button 
                                    onClick={() => setModalTab('templates')}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                                        backgroundColor: modalTab === 'templates' ? 'white' : 'transparent',
                                        color: modalTab === 'templates' ? '#4f46e5' : '#64748b',
                                        boxShadow: modalTab === 'templates' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    Template MES Ready
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding:'24px 28px 28px', overflowY:'auto', flex: 1 }}>
                            {modalTab === 'types' ? (
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                                    {CHART_TYPES.map(ct => (
                                        <button key={ct.id} onClick={() => {
                                            setShowCreateModal(false);
                                            navigate('/analytics/new', { state: { defaultType: ct.id } });
                                        }}
                                                style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px', border:'1px solid #e2e8f0', borderRadius:'14px', backgroundColor:'white', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = ct.color; e.currentTarget.style.backgroundColor = `${ct.color}08`; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = 'white'; }}>
                                            <div style={{ width:44, height:44, borderRadius:'12px', backgroundColor:`${ct.color}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                <ct.icon size={22} color={ct.color} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#0f172a' }}>{ct.label}</div>
                                                <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>Mulai dengan {ct.label.toLowerCase()} kosong</div>
                                            </div>
                                        </button>
                                    ))}
                                    <button onClick={() => { setShowCreateModal(false); navigate('/analytics/new'); }}
                                            style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px', border:'1px dashed #cbd5e1', borderRadius:'14px', backgroundColor:'#f8fafc', cursor:'pointer', textAlign:'left', gridColumn:'1/3', transition:'all 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'} onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}>
                                        <div style={{ width:44, height:44, borderRadius:'12px', backgroundColor:'#f0f0ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                            <Sparkles size={22} color="#4f46e5" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#0f172a' }}>Analisis Kosong</div>
                                            <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>Konfigurasi manual dari awal</div>
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                                    {ANALYTICS_TEMPLATES.map(tmpl => {
                                        const TmplIcon = tmpl.icon;
                                        return (
                                            <button key={tmpl.id} onClick={() => handleCreateFromTemplate(tmpl)}
                                                    style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px', border:'1px solid #e2e8f0', borderRadius:'14px', backgroundColor:'white', cursor:'pointer', textAlign:'left', transition:'all 0.15s', width: '100%' }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = tmpl.color; e.currentTarget.style.backgroundColor = `${tmpl.color}08`; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = 'white'; }}>
                                                <div style={{ width:48, height:48, borderRadius:'12px', backgroundColor:`${tmpl.color}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                    <TmplIcon size={24} color={tmpl.color} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize:'0.95rem', fontWeight:850, color:'#0f172a', marginBottom: '2px' }}>{tmpl.name}</div>
                                                    <div style={{ fontSize:'0.75rem', color:'#64748b', lineHeight: 1.3 }}>{tmpl.description}</div>
                                                </div>
                                                <div style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    Pasang
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalysisManager;
