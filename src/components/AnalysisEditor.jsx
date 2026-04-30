import React, { useState, useEffect } from 'react';
import { 
    Save, 
    ArrowLeft, 
    BarChart3, 
    TrendingUp, 
    PieChart, 
    Settings, 
    Database, 
    Layout,
    Activity,
    LineChart,
    Plus,
    Trash2,
    Filter,
    Calendar,
    Clock,
    Zap,
    Target,
    Play,
    Info,
    ChevronRight
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { saveAnalysis, getAllSavedAnalyses, getTables } from '../utils/supabaseFrontlineDB';
import { getTableRecords } from '../utils/supabaseTablesDB';
// Note: We would ideally use the same chart component as AppBuilder, 
// for now let's build the editor UI structure.

const AnalysisEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [tables, setTables] = useState([]);
    const [selectedTableFields, setSelectedTableFields] = useState([]);
    const [showDataTable, setShowDataTable] = useState(false);
    
    const [analysis, setAnalysis] = useState({
        name: 'New Analysis',
        description: '',
        config: {
            type: 'BAR',
            tableId: '',
            xAxisColumn: '',
            yAxisColumn: '',
            aggregation: 'COUNT',
            color: '#4f46e5',
            showArea: false,
            stacked: false,
            filters: [],
            dateRange: 'LAST_7_DAYS',
            timeBucket: 'DAILY',
            kpiLabel: 'Total Value',
            comparisonEnabled: false
        }
    });
    
    const [previewData, setPreviewData] = useState({ labels: [], values: [] });
    const [fetchingPreview, setFetchingPreview] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, [id]);

    useEffect(() => {
        if (analysis.config.tableId) {
            fetchPreviewData();
            const table = tables.find(t => t.id === analysis.config.tableId);
            if (table) {
                setSelectedTableFields(table.fields || []);
            } else if (analysis.config.tableId === 'SYSTEM:COMPLETIONS') {
                setSelectedTableFields([
                    { id: 'id', label: 'ID' },
                    { id: 'timestamp', label: 'Timestamp' },
                    { id: 'duration', label: 'Duration (s)' },
                    { id: 'status', label: 'Status' },
                    { id: 'operator_id', label: 'Operator ID' },
                    { id: 'station_id', label: 'Station ID' }
                ]);
            }
        }
    }, [
        analysis.config.tableId, 
        analysis.config.xAxisColumn, 
        analysis.config.yAxisColumn, 
        analysis.config.aggregation,
        analysis.config.filters,
        analysis.config.timeBucket,
        analysis.config.dateRange,
        tables
    ]);

    const loadInitialData = async () => {
        try {
            const tableData = await getTables();
            setTables(tableData);

            if (id) {
                const results = await getAllSavedAnalyses();
                const existing = results.find(a => a.id === id);
                if (existing) setAnalysis(existing);
            }
        } catch (err) {
            console.error('Error loading editor data:', err);
        }
    };

    const fetchPreviewData = async () => {
        if (!analysis.config.tableId) return;
        setFetchingPreview(true);
        try {
            let records = [];
            if (analysis.config.tableId === 'SYSTEM:COMPLETIONS') {
                // Fetch from completions table if it was a system source
                const { getSupabaseClient } = await import('../utils/supabaseManualDB');
                const supabase = getSupabaseClient();
                const { data } = await supabase.from('completions').select('*').limit(500);
                records = data || [];
            } else {
                records = await getTableRecords(analysis.config.tableId);
            }

            const processed = processData(records, analysis.config);
            setPreviewData(processed);
        } catch (err) {
            console.error('Error fetching preview data:', err);
        } finally {
            setFetchingPreview(false);
        }
    };

    const processData = (records, config) => {
        if (!records || records.length === 0) return { labels: [], values: [] };

        // 1. Filter
        let filtered = records;
        if (config.filters && config.filters.length > 0) {
            filtered = records.filter(r => {
                return config.filters.every(f => {
                    if (!f.field) return true;
                    const val = r.data?.[f.field] || r[f.field];
                    switch(f.operator) {
                        case 'eq': return String(val) === String(f.value);
                        case 'neq': return String(val) !== String(f.value);
                        case 'gt': return Number(val) > Number(f.value);
                        case 'lt': return Number(val) < Number(f.value);
                        case 'contains': return String(val || '').toLowerCase().includes(String(f.value).toLowerCase());
                        default: return true;
                    }
                });
            });
        }

        // 2. Group by X-Axis
        const groups = {};
        filtered.forEach(r => {
            let xVal = r.data?.[config.xAxisColumn] || r[config.xAxisColumn] || 'Unknown';
            
            // Handle time bucket
            if (config.timeBucket && (config.xAxisColumn === 'created_at' || config.xAxisColumn === 'updated_at' || config.xAxisColumn === 'timestamp')) {
                const date = new Date(xVal);
                if (!isNaN(date.getTime())) {
                    if (config.timeBucket === 'HOURLY') xVal = date.getHours() + ':00';
                    else if (config.timeBucket === 'DAILY') xVal = date.toLocaleDateString();
                    else if (config.timeBucket === 'WEEKLY') xVal = 'W' + Math.ceil(date.getDate() / 7);
                    else if (config.timeBucket === 'MONTHLY') xVal = date.toLocaleString('default', { month: 'short' });
                }
            }
            
            if (!groups[xVal]) groups[xVal] = [];
            groups[xVal].push(r);
        });

        // 3. Aggregate Y-Axis
        let labels = Object.keys(groups);
        
        // Sort Pareto if type is PARETO
        if (config.type === 'PARETO') {
            labels.sort((a, b) => groups[b].length - groups[a].length);
        }

        const values = labels.map(label => {
            const groupRecords = groups[label];
            const yVals = groupRecords.map(r => {
                const val = r.data?.[config.yAxisColumn] || r[config.yAxisColumn];
                return Number(val) || 0;
            });
            
            switch(config.aggregation) {
                case 'SUM': return yVals.reduce((a, b) => a + b, 0);
                case 'AVERAGE': return yVals.length > 0 ? yVals.reduce((a, b) => a + b, 0) / yVals.length : 0;
                case 'MIN': return Math.min(...yVals);
                case 'MAX': return Math.max(...yVals);
                case 'COUNT': return groupRecords.length;
                case 'PERCENT_SUCCESS': {
                    const successCount = groupRecords.filter(r => {
                        const val = String(r.data?.[config.yAxisColumn] || r[config.yAxisColumn] || '').toUpperCase();
                        return val === 'SUCCESS' || val === 'COMPLETED' || val === 'PASS';
                    }).length;
                    return (successCount / groupRecords.length) * 100;
                }
                default: return groupRecords.length;
            }
        });

        return { labels, values };
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await saveAnalysis(analysis);
            navigate('/analytics');
        } catch (err) {
            alert('Error saving analysis: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateConfig = (updates) => {
        setAnalysis(prev => ({
            ...prev,
            config: { ...prev.config, ...updates }
        }));
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
            {/* Top Bar */}
            <div style={{ 
                height: '64px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate('/analytics')} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }}></div>
                    <div>
                        <input 
                            value={analysis.name}
                            onChange={(e) => setAnalysis({ ...analysis, name: e.target.value })}
                            style={{ border: 'none', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', outline: 'none', background: 'transparent' }}
                        />
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Standalone Analysis Editor</div>
                    </div>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
                        backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', 
                        fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' 
                    }}
                >
                    <Save size={18} /> {loading ? 'Saving...' : 'Save Analysis'}
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Sidebar Configuration */}
                <div style={{ width: '380px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: '24px' }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Play size={14} /> System Shortcuts
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                                { id: 'throughput', label: 'Total Throughput', desc: 'Count of all completions over time', config: { tableId: 'SYSTEM:COMPLETIONS', xAxisColumn: 'timestamp', yAxisColumn: 'id', aggregation: 'COUNT', type: 'BAR' } },
                                { id: 'cycletime', label: 'Avg Cycle Time', desc: 'Average duration per completion', config: { tableId: 'SYSTEM:COMPLETIONS', xAxisColumn: 'timestamp', yAxisColumn: 'duration', aggregation: 'AVERAGE', type: 'LINE' } },
                                { id: 'yield', label: 'Operator Yield', desc: 'Percentage of successful completions', config: { tableId: 'SYSTEM:COMPLETIONS', xAxisColumn: 'timestamp', yAxisColumn: 'status', aggregation: 'PERCENT_SUCCESS', type: 'PIE' } }
                            ].map(s => (
                                <button 
                                    key={s.id}
                                    onClick={() => {
                                        setAnalysis(prev => ({
                                            ...prev,
                                            name: s.label,
                                            config: { ...prev.config, ...s.config }
                                        }));
                                    }}
                                    style={{ 
                                        textAlign: 'left', padding: '12px', border: '1px solid #e2e8f0', 
                                        borderRadius: '12px', backgroundColor: 'white', cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                >
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{s.label}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{s.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layout size={14} /> Analysis Type
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {[
                                { id: 'BAR', icon: BarChart3, label: 'Bar' },
                                { id: 'LINE', icon: TrendingUp, label: 'Line' },
                                { id: 'PIE', icon: PieChart, label: 'Pie' },
                                { id: 'KPI', icon: Zap, label: 'KPI' },
                                { id: 'PARETO', icon: Target, label: 'Pareto' }
                            ].map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => updateConfig({ type: t.id })}
                                    style={{ 
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', 
                                        padding: '12px', border: analysis.config.type === t.id ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                                        borderRadius: '12px', backgroundColor: analysis.config.type === t.id ? '#f5f3ff' : 'white',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    <t.icon size={20} color={analysis.config.type === t.id ? '#4f46e5' : '#64748b'} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: analysis.config.type === t.id ? '#4f46e5' : '#64748b' }}>{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Database size={14} /> Data Source
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Assign Table</label>
                            <select 
                                value={analysis.config.tableId}
                                onChange={(e) => updateConfig({ tableId: e.target.value })}
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}
                            >
                                <option value="">Select a source table...</option>
                                <optgroup label="System Sources">
                                    <option value="SYSTEM:COMPLETIONS">App Completions (History)</option>
                                </optgroup>
                                <optgroup label="Custom Tables">
                                    {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Settings size={14} /> Metrics & Aggregations
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Y-Axis (Value)</label>
                                <select 
                                    value={analysis.config.yAxisColumn}
                                    onChange={e => updateConfig({ yAxisColumn: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', marginBottom: '10px' }}
                                >
                                    <option value="">Select Y-Axis field...</option>
                                    <option value="id">Record ID (Count only)</option>
                                    {selectedTableFields.map(f => <option key={f.id} value={f.id}>{f.label || f.id}</option>)}
                                </select>
                                
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Aggregation</label>
                                <select 
                                    value={analysis.config.aggregation}
                                    onChange={(e) => updateConfig({ aggregation: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                >
                                    <option value="COUNT">COUNT (Rows)</option>
                                    <option value="SUM">SUM (Total)</option>
                                    <option value="AVERAGE">AVERAGE</option>
                                    <option value="MIN">MINIMUM</option>
                                    <option value="MAX">MAXIMUM</option>
                                    <option value="PERCENT_SUCCESS">PERCENT SUCCESS</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>X-Axis (Category / Time)</label>
                                <select 
                                    value={analysis.config.xAxisColumn}
                                    onChange={e => updateConfig({ xAxisColumn: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                >
                                    <option value="">Select X-Axis field...</option>
                                    <option value="id">Record ID</option>
                                    <option value="created_at">Created Date</option>
                                    <option value="updated_at">Updated Date</option>
                                    {selectedTableFields.map(f => <option key={f.id} value={f.id}>{f.label || f.id}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={14} /> Time & Bucketing
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Date Range</label>
                            <select 
                                value={analysis.config.dateRange}
                                onChange={(e) => updateConfig({ dateRange: e.target.value })}
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                            >
                                <option value="TODAY">Today</option>
                                <option value="LAST_24_HOURS">Last 24 Hours</option>
                                <option value="LAST_7_DAYS">Last 7 Days</option>
                                <option value="LAST_30_DAYS">Last 30 Days</option>
                                <option value="THIS_MONTH">This Month</option>
                                <option value="CUSTOM">Custom Range</option>
                            </select>

                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Time Bucket</label>
                            <select 
                                value={analysis.config.timeBucket}
                                onChange={(e) => updateConfig({ timeBucket: e.target.value })}
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                            >
                                <option value="HOURLY">Hourly</option>
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY">Monthly</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Filter size={14} /> Filters
                            </h4>
                            <button 
                                onClick={() => {
                                    const newFilter = { id: Date.now(), field: '', operator: 'eq', value: '' };
                                    updateConfig({ filters: [...(analysis.config.filters || []), newFilter] });
                                }}
                                style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 700 }}
                            >
                                <Plus size={12} /> Add Filter
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(analysis.config.filters || []).map((f, idx) => (
                                <div key={f.id} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', position: 'relative' }}>
                                    <button 
                                        onClick={() => updateConfig({ filters: analysis.config.filters.filter(item => item.id !== f.id) })}
                                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <input 
                                            placeholder="Field" 
                                            value={f.field} 
                                            onChange={e => {
                                                const next = [...analysis.config.filters];
                                                next[idx].field = e.target.value;
                                                updateConfig({ filters: next });
                                            }}
                                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }} 
                                        />
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <select 
                                                value={f.operator}
                                                onChange={e => {
                                                    const next = [...analysis.config.filters];
                                                    next[idx].operator = e.target.value;
                                                    updateConfig({ filters: next });
                                                }}
                                                style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}
                                            >
                                                <option value="eq">Equals</option>
                                                <option value="neq">Not Equals</option>
                                                <option value="gt">&gt;</option>
                                                <option value="lt">&lt;</option>
                                                <option value="contains">Contains</option>
                                            </select>
                                            <input 
                                                placeholder="Value" 
                                                value={f.value}
                                                onChange={e => {
                                                    const next = [...analysis.config.filters];
                                                    next[idx].value = e.target.value;
                                                    updateConfig({ filters: next });
                                                }}
                                                style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!analysis.config.filters || analysis.config.filters.length === 0) && (
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', padding: '12px', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                                    No filters applied.
                                </div>
                            )}
                        </div>

                        {/* Aggregated Data Table Section */}
                        <div style={{ marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Aggregated Data Summary</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => setShowDataTable(!showDataTable)}
                                        style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                                    >
                                        {showDataTable ? 'Hide Table' : 'Show Table'}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const csv = [
                                                ['Label', 'Value'],
                                                ...previewData.labels.map((l, i) => [l, previewData.values[i]])
                                            ].map(row => row.join(',')).join('\n');
                                            const blob = new Blob([csv], { type: 'text/csv' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `analysis_${analysis.name.toLowerCase().replace(/ /g, '_')}.csv`;
                                            a.click();
                                        }}
                                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                                    >
                                        Export CSV
                                    </button>
                                </div>
                            </div>

                            {showDataTable && (
                                <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                        <thead style={{ backgroundColor: '#f8fafc' }}>
                                            <tr>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>Label ({analysis.config.xAxisColumn})</th>
                                                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>{analysis.config.aggregation} of {analysis.config.yAxisColumn}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.labels.map((label, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px', color: '#1e293b', fontWeight: 500 }}>{label}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right', color: '#4f46e5', fontWeight: 700 }}>
                                                        {Number(previewData.values[idx] || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
                                            {previewData.labels.length === 0 && (
                                                <tr>
                                                    <td colSpan="2" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No aggregated data available.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot style={{ backgroundColor: '#f8fafc', fontWeight: 800 }}>
                                            <tr>
                                                <td style={{ padding: '12px' }}>GRAND TOTAL</td>
                                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                                    {previewData.values.reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview Area */}
                <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '40px', flex: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>Analysis Preview</h2>
                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Real-time visualization of your configuration.</p>
                            </div>
                            <div style={{ backgroundColor: '#f1f5f9', padding: '8px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Activity size={14} /> LIVE PREVIEW
                            </div>
                        </div>

                        {/* Dynamic Chart Preview Area */}
                        <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                            {fetchingPreview ? (
                                <div style={{ textAlign: 'center' }}>
                                    <Activity size={32} color="#4f46e5" className="animate-spin" style={{ marginBottom: '16px' }} />
                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Fetching live data...</div>
                                </div>
                            ) : !analysis.config.tableId ? (
                                <div style={{ textAlign: 'center' }}>
                                    <BarChart3 size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                        Select a data source to generate the preview.
                                    </div>
                                </div>
                            ) : previewData.labels.length === 0 ? (
                                <div style={{ textAlign: 'center' }}>
                                    <Info size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                        No data found matching your filters.
                                    </div>
                                </div>
                            ) : analysis.config.type === 'KPI' ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>{analysis.config.kpiLabel || 'Aggregate Value'}</div>
                                    <div style={{ fontSize: '5rem', fontWeight: 900, color: '#4f46e5', letterSpacing: '-2px' }}>
                                        {Number(previewData.values[0] || 0).toLocaleString()}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#10b981', fontWeight: 700, fontSize: '1rem' }}>
                                        <TrendingUp size={18} /> LIVE <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.85rem' }}>from {analysis.config.tableId}</span>
                                    </div>
                                </div>
                            ) : analysis.config.type === 'PIE' ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ 
                                        width: '200px', height: '200px', borderRadius: '50%', 
                                        background: `conic-gradient(#4f46e5 0% ${previewData.values[0] || 0}%, #8b5cf6 ${previewData.values[0] || 0}% ${previewData.values[0] + (previewData.values[1] || 0)}%, #c084fc ${previewData.values[0] + (previewData.values[1] || 0)}% 100%)`,
                                        margin: '0 auto 24px auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                    }}></div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', maxWidth: '400px' }}>
                                        {previewData.labels.slice(0, 5).map((cat, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: i === 0 ? '#4f46e5' : (i === 1 ? '#8b5cf6' : '#c084fc') }}></div>
                                                {cat}: {Math.round(previewData.values[i])}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', width: '100%', padding: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '12px', height: '200px', marginBottom: '40px', position: 'relative' }}>
                                        {/* Cumulative line for Pareto */}
                                        {analysis.config.type === 'PARETO' && (
                                            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', zIndex: 10 }}>
                                                <polyline
                                                    fill="none"
                                                    stroke="#ef4444"
                                                    strokeWidth="3"
                                                    points={previewData.values.map((v, i) => {
                                                        const x = 40 + (i * 52);
                                                        const cumulative = previewData.values.slice(0, i + 1).reduce((a, b) => a + b, 0);
                                                        const total = previewData.values.reduce((a, b) => a + b, 0);
                                                        const y = 200 - (cumulative / total * 180);
                                                        return `${x},${y}`;
                                                    }).join(' ')}
                                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))' }}
                                                />
                                            </svg>
                                        )}

                                        {/* Bar or Line visualization */}
                                        {previewData.values.slice(0, 10).map((v, i) => {
                                            const max = Math.max(...previewData.values);
                                            const h = max > 0 ? (v / max * 100) : 0;
                                            return (
                                                <div key={i} style={{ 
                                                    width: '40px', 
                                                    height: `${h}%`, 
                                                    backgroundColor: analysis.config.type === 'PARETO' ? (i < 3 ? '#4f46e5' : '#94a3b8') : analysis.config.color,
                                                    borderRadius: analysis.config.type === 'LINE' ? '50%' : '6px 6px 0 0',
                                                    opacity: analysis.config.type === 'LINE' ? 0 : 0.8,
                                                    position: 'relative',
                                                }}>
                                                    <div style={{ position: 'absolute', bottom: '-25px', left: '0', width: '100%', textAlign: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {previewData.labels[i]}
                                                    </div>
                                                    <div style={{ position: 'absolute', top: '-20px', left: '0', width: '100%', textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8' }}>
                                                        {Math.round(v)}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Line visualization overlay */}
                                        {analysis.config.type === 'LINE' && (
                                            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                                                <polyline
                                                    fill="none"
                                                    stroke={analysis.config.color}
                                                    strokeWidth="4"
                                                    points={previewData.values.slice(0, 10).map((v, i) => {
                                                        const x = 40 + (i * 52);
                                                        const max = Math.max(...previewData.values);
                                                        const y = 200 - (max > 0 ? (v / max * 200) : 0);
                                                        return `${x},${y}`;
                                                    }).join(' ')}
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, marginTop: '20px' }}>
                                        {analysis.config.type} Analysis for {analysis.config.xAxisColumn || 'X-Axis'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px' }}>
                                        Showing {previewData.labels.length} groups from {analysis.config.tableId}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata Panel */}
                    <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Description</label>
                        <textarea 
                            value={analysis.description}
                            onChange={(e) => setAnalysis({ ...analysis, description: e.target.value })}
                            placeholder="Add a description for this analysis..."
                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisEditor;
