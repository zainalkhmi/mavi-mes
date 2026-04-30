import React, { useState, useEffect, useMemo } from 'react';
import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Activity, TrendingUp, Zap, Info, Clock } from 'lucide-react';
import { getAllSavedAnalyses } from '../utils/supabaseFrontlineDB';
import { getTableRecords } from '../utils/supabaseTablesDB';

const AnalysisWidget = ({ analysisId, globalFilters = {} }) => {
    const [config, setConfig] = useState(null);
    const [data, setData] = useState({ labels: [], values: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAnalysis = async () => {
            setLoading(true);
            try {
                const analyses = await getAllSavedAnalyses();
                const found = analyses.find(a => a.id === analysisId);
                if (!found) throw new Error('Analysis not found');
                setConfig(found.config);
                
                // Fetch data
                let records = [];
                if (found.config.tableId === 'SYSTEM:COMPLETIONS') {
                    const { getSupabaseClient } = await import('../utils/supabaseManualDB');
                    const supabase = getSupabaseClient();
                    const { data } = await supabase.from('completions').select('*').limit(1000);
                    records = data || [];
                } else {
                    records = await getTableRecords(found.config.tableId);
                }

                const processed = processData(records, found.config, globalFilters);
                setData(processed);
            } catch (err) {
                console.error('Widget Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (analysisId) loadAnalysis();
    }, [analysisId, globalFilters]);

    const processData = (records, config, globalFilters) => {
        if (!records || records.length === 0) return { labels: [], values: [] };

        // 1. Merge Local & Global Filters
        let filtered = records;
        const allFilters = [...(config.filters || [])];
        
        // Add global filters if applicable
        if (globalFilters.dateRange && (config.xAxisColumn === 'created_at' || config.xAxisColumn === 'timestamp')) {
            // Logic for date range filtering would go here
        }

        filtered = records.filter(r => {
            return allFilters.every(f => {
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

        // 2. Group & Aggregate
        const groups = {};
        filtered.forEach(r => {
            let xVal = r.data?.[config.xAxisColumn] || r[config.xAxisColumn] || 'Unknown';
            if (config.timeBucket && (config.xAxisColumn === 'created_at' || config.xAxisColumn === 'timestamp')) {
                const date = new Date(xVal);
                if (!isNaN(date.getTime())) {
                    if (config.timeBucket === 'HOURLY') xVal = date.getHours() + ':00';
                    else if (config.timeBucket === 'DAILY') xVal = date.toLocaleDateString();
                    else if (config.timeBucket === 'MONTHLY') xVal = date.toLocaleString('default', { month: 'short' });
                }
            }
            if (!groups[xVal]) groups[xVal] = [];
            groups[xVal].push(r);
        });

        let labels = Object.keys(groups);
        if (config.type === 'PARETO') labels.sort((a, b) => groups[b].length - groups[a].length);

        const values = labels.map(label => {
            const groupRecords = groups[label];
            const yVals = groupRecords.map(r => Number(r.data?.[config.yAxisColumn] || r[config.yAxisColumn] || 0));
            switch(config.aggregation) {
                case 'SUM': return yVals.reduce((a, b) => a + b, 0);
                case 'AVERAGE': return yVals.length > 0 ? yVals.reduce((a, b) => a + b, 0) / yVals.length : 0;
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

    const chartData = useMemo(() => {
        return data.labels.map((l, i) => ({
            name: l,
            value: Number(data.values[i].toFixed(2))
        }));
    }, [data]);

    if (loading) return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <Activity size={24} className="animate-spin" />
            <span style={{ fontSize: '0.75rem', marginTop: '10px' }}>Loading Data...</span>
        </div>
    );

    if (error) return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444', padding: '20px', textAlign: 'center' }}>
            <Info size={24} />
            <span style={{ fontSize: '0.75rem', marginTop: '10px' }}>{error}</span>
        </div>
    );

    if (config?.type === 'KPI') {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>{config.kpiLabel || 'Value'}</div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0ea5e9', letterSpacing: '-1px' }}>
                    {data.values[0]?.toLocaleString() || 0}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.85rem', fontWeight: 700, marginTop: '8px' }}>
                    <Zap size={14} /> LIVE
                </div>
            </div>
        );
    }

    const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    return (
        <div style={{ height: '100%', width: '100%', padding: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
                {config.type === 'PIE' ? (
                    <PieChart>
                        <Pie
                            data={chartData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconType="circle" />
                    </PieChart>
                ) : config.type === 'LINE' ? (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9' }} />
                    </LineChart>
                ) : (
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="value" fill={config.color || '#0ea5e9'} radius={[4, 4, 0, 0]} />
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
    );
};

export default AnalysisWidget;
