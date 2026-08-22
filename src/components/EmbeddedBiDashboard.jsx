import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { BarChart3, PieChart, Activity, TrendingUp, Gauge, Layout, Hash, Type, RefreshCw, Maximize2, AlertCircle, Database } from 'lucide-react';

// ─── SAVED DASHBOARDS STORAGE KEY ────────────────────────────────────
const STORAGE_KEY = 'mandor_bi_saved_dashboards';
const CANVAS_KEY = 'mandor_bi_canvas_elements_v1';

// ─── SAMPLE DATA (fallback if no data source connected) ─────────────
const SAMPLE_PRODUCTION_DATA = [
    { date: '2026-08-12', shift: 'Shift 1', line: 'Line A', machine: 'CNC-01', operator: 'Budi Santoso', product: 'Gearbox Housing A', plannedQty: 1000, actualQty: 960, goodQty: 940, rejectQty: 20, cycleTime: 42, downtimeMin: 25, defectType: 'Dimension Out' },
    { date: '2026-08-12', shift: 'Shift 2', line: 'Line A', machine: 'CNC-01', operator: 'Siti Rahma', product: 'Gearbox Housing A', plannedQty: 1000, actualQty: 910, goodQty: 880, rejectQty: 30, cycleTime: 45, downtimeMin: 45, defectType: 'Surface Scratch' },
    { date: '2026-08-13', shift: 'Shift 1', line: 'Line A', machine: 'CNC-02', operator: 'Agus P.', product: 'Flange Joint 20mm', plannedQty: 1200, actualQty: 1180, goodQty: 1165, rejectQty: 15, cycleTime: 36, downtimeMin: 12, defectType: 'Burr Excess' },
    { date: '2026-08-13', shift: 'Shift 2', line: 'Line B', machine: 'Stamping-01', operator: 'Dewi Lestari', product: 'Bracket Motor B', plannedQty: 1500, actualQty: 1420, goodQty: 1390, rejectQty: 30, cycleTime: 22, downtimeMin: 35, defectType: 'Crack' },
    { date: '2026-08-14', shift: 'Shift 1', line: 'Line B', machine: 'Stamping-02', operator: 'Eko Prasetyo', product: 'Cover Plate Stamping', plannedQty: 1800, actualQty: 1790, goodQty: 1770, rejectQty: 20, cycleTime: 18, downtimeMin: 10, defectType: 'Pinhole' },
    { date: '2026-08-14', shift: 'Shift 2', line: 'Line C', machine: 'Lathe-01', operator: 'Rian H.', product: 'Main Shaft Rotor', plannedQty: 800, actualQty: 760, goodQty: 740, rejectQty: 20, cycleTime: 55, downtimeMin: 50, defectType: 'Dimension Out' },
    { date: '2026-08-15', shift: 'Shift 1', line: 'Line C', machine: 'Lathe-02', operator: 'Yudi K.', product: 'Main Shaft Rotor', plannedQty: 850, actualQty: 840, goodQty: 832, rejectQty: 8, cycleTime: 52, downtimeMin: 8, defectType: 'Surface Scratch' },
    { date: '2026-08-15', shift: 'Shift 2', line: 'Line A', machine: 'CNC-01', operator: 'Budi Santoso', product: 'Gearbox Housing A', plannedQty: 1000, actualQty: 990, goodQty: 982, rejectQty: 8, cycleTime: 40, downtimeMin: 5, defectType: 'Burr Excess' },
    { date: '2026-08-16', shift: 'Shift 1', line: 'Line B', machine: 'Stamping-01', operator: 'Dewi Lestari', product: 'Bracket Motor B', plannedQty: 1500, actualQty: 1480, goodQty: 1460, rejectQty: 20, cycleTime: 21, downtimeMin: 15, defectType: 'Crack' },
    { date: '2026-08-16', shift: 'Shift 2', line: 'Line B', machine: 'Stamping-02', operator: 'Eko Prasetyo', product: 'Cover Plate Stamping', plannedQty: 1800, actualQty: 1750, goodQty: 1720, rejectQty: 30, cycleTime: 19, downtimeMin: 28, defectType: 'Pinhole' },
    { date: '2026-08-17', shift: 'Shift 1', line: 'Line A', machine: 'CNC-02', operator: 'Agus P.', product: 'Flange Joint 20mm', plannedQty: 1200, actualQty: 1195, goodQty: 1188, rejectQty: 7, cycleTime: 35, downtimeMin: 4, defectType: 'Dimension Out' },
    { date: '2026-08-18', shift: 'Shift 1', line: 'Line A', machine: 'CNC-01', operator: 'Siti Rahma', product: 'Gearbox Housing A', plannedQty: 1000, actualQty: 985, goodQty: 975, rejectQty: 10, cycleTime: 41, downtimeMin: 12, defectType: 'Surface Scratch' }
];

const SANKEY_MATERIAL_FLOW = {
    nodes: [
        { name: 'Raw Material Stock' }, { name: 'CNC Section' }, { name: 'Stamping Press' },
        { name: 'Assembly Line' }, { name: 'QC Automated Vision' }, { name: 'Finished Good Warehouse' },
        { name: 'Rework Station' }, { name: 'Scrap Yard' }
    ],
    links: [
        { source: 'Raw Material Stock', target: 'CNC Section', value: 4500 },
        { source: 'Raw Material Stock', target: 'Stamping Press', value: 6200 },
        { source: 'CNC Section', target: 'Assembly Line', value: 4350 },
        { source: 'CNC Section', target: 'Rework Station', value: 150 },
        { source: 'Stamping Press', target: 'Assembly Line', value: 6080 },
        { source: 'Stamping Press', target: 'Rework Station', value: 120 },
        { source: 'Assembly Line', target: 'QC Automated Vision', value: 10430 },
        { source: 'QC Automated Vision', target: 'Finished Good Warehouse', value: 10150 },
        { source: 'QC Automated Vision', target: 'Rework Station', value: 200 },
        { source: 'QC Automated Vision', target: 'Scrap Yard', value: 80 },
        { source: 'Rework Station', target: 'Finished Good Warehouse', value: 390 },
        { source: 'Rework Station', target: 'Scrap Yard', value: 80 }
    ]
};

// ─── HELPER: Get saved dashboards list ───────────────────────────────
export function getSavedBiDashboards() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
}

export function saveBiDashboard(dashboard) {
    const list = getSavedBiDashboards();
    const idx = list.findIndex(d => d.id === dashboard.id);
    if (idx >= 0) list[idx] = dashboard;
    else list.push(dashboard);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list;
}

export function deleteBiDashboard(id) {
    const list = getSavedBiDashboards().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list;
}

// Auto-create default dashboard from canvas if none saved
function getDefaultDashboard() {
    try {
        const canvasElements = JSON.parse(localStorage.getItem(CANVAS_KEY) || '[]');
        if (canvasElements.length > 0) {
            return {
                id: 'default_canvas',
                name: 'Plant Production Dashboard',
                elements: canvasElements,
                createdAt: new Date().toISOString()
            };
        }
    } catch { }
    return null;
}

// ─── AGGREGATOR ──────────────────────────────────────────────────────
function aggregateData(dataset, dimensionCol, metricCol, aggType = 'SUM') {
    if (!dimensionCol || !dataset.length) return { labels: [], values: [] };
    const groups = {};
    dataset.forEach(row => {
        const dimVal = String(row[dimensionCol] ?? 'N/A');
        const numVal = Number(row[metricCol]) || (aggType === 'COUNT' ? 1 : 0);
        if (!groups[dimVal]) groups[dimVal] = { sum: 0, count: 0, min: numVal, max: numVal };
        groups[dimVal].sum += numVal;
        groups[dimVal].count += 1;
        groups[dimVal].min = Math.min(groups[dimVal].min, numVal);
        groups[dimVal].max = Math.max(groups[dimVal].max, numVal);
    });
    const labels = Object.keys(groups);
    const values = labels.map(lbl => {
        const g = groups[lbl];
        if (aggType === 'COUNT') return g.count;
        if (aggType === 'AVG') return g.count > 0 ? Number((g.sum / g.count).toFixed(2)) : 0;
        if (aggType === 'MIN') return g.min;
        if (aggType === 'MAX') return g.max;
        return g.sum;
    });
    return { labels, values };
}

function calculateKpiValue(el, dataset) {
    const met = el.metric || 'actualQty';
    if (!met || !dataset.length) return 0;
    if (el.aggregation === 'PERCENT') {
        const totalGood = dataset.reduce((s, r) => s + (Number(r.goodQty) || 0), 0);
        const totalActual = dataset.reduce((s, r) => s + (Number(r.actualQty) || 0), 0);
        return totalActual > 0 ? ((totalGood / totalActual) * 100).toFixed(1) : '98.5';
    }
    const sum = dataset.reduce((s, r) => s + (Number(r[met]) || 0), 0);
    if (el.aggregation === 'AVG') return (sum / dataset.length).toFixed(1);
    if (el.aggregation === 'COUNT') return dataset.length;
    return sum.toLocaleString();
}

function getChartOption(el, dataset) {
    const dim = el.dimension || 'machine';
    const met = el.metric || 'actualQty';

    if (el.type === 'OEE_GAUGE') {
        return {
            series: [{
                name: 'OEE', type: 'gauge', center: ['50%', '55%'], radius: '90%',
                startAngle: 190, endAngle: -10, min: 0, max: 100, splitNumber: 5,
                itemStyle: { color: el.color || '#714B67' },
                progress: { show: true, width: 12, roundCap: true, itemStyle: { color: el.color || '#714B67' } },
                pointer: { show: false },
                axisLine: { lineStyle: { width: 12, color: [[1, '#e2e8f0']] } },
                axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
                title: { offsetCenter: [0, '25%'], fontSize: 11, color: '#64748b', fontWeight: 600 },
                detail: { offsetCenter: [0, '-10%'], fontSize: 24, fontWeight: 'bold', formatter: '{value}%', color: el.color || '#714B67' },
                data: [{ value: el.metrics?.oee || 88.4, name: 'Overall OEE' }]
            }]
        };
    }

    if (el.type === 'PARETO') {
        const { labels, values } = aggregateData(dataset, dim, met, 'SUM');
        const combined = labels.map((l, i) => ({ label: l, val: values[i] })).sort((a, b) => b.val - a.val);
        const sortedLabels = combined.map(c => c.label);
        const sortedVals = combined.map(c => c.val);
        const total = sortedVals.reduce((a, b) => a + b, 0) || 1;
        let cum = 0;
        const cumLines = sortedVals.map(v => { cum += v; return Number(((cum / total) * 100).toFixed(1)); });
        return {
            tooltip: { trigger: 'axis' },
            grid: { left: '3%', right: '4%', bottom: '18%', top: '12%', containLabel: true },
            xAxis: { type: 'category', data: sortedLabels, axisLabel: { interval: 0, rotate: 20, fontSize: 10 } },
            yAxis: [{ type: 'value' }, { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } }],
            series: [
                { name: 'Defects', type: 'bar', data: sortedVals, itemStyle: { color: '#e11d48', borderRadius: [3, 3, 0, 0] } },
                { name: 'Kumulatif %', type: 'line', yAxisIndex: 1, data: cumLines, itemStyle: { color: '#f59e0b' }, lineStyle: { width: 2 }, markLine: { data: [{ yAxis: 80, lineStyle: { color: '#dc2626', type: 'dashed' } }] } }
            ]
        };
    }

    if (el.type === 'DONUT') {
        const { labels, values } = aggregateData(dataset, dim, met, 'SUM');
        return {
            tooltip: { trigger: 'item' },
            legend: { bottom: '0%', left: 'center', textStyle: { fontSize: 10 } },
            series: [{
                type: 'pie', radius: ['45%', '70%'], avoidLabelOverlap: false,
                itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
                label: { show: false },
                data: labels.map((l, i) => ({ name: l, value: values[i] }))
            }]
        };
    }

    if (el.type === 'SANKEY') {
        return {
            tooltip: { trigger: 'item' },
            series: [{
                type: 'sankey', data: SANKEY_MATERIAL_FLOW.nodes, links: SANKEY_MATERIAL_FLOW.links,
                lineStyle: { color: 'gradient', curveness: 0.5 }, label: { fontSize: 9 }
            }]
        };
    }

    if (el.type === 'RADAR') {
        return {
            radar: { indicator: [{ name: 'Speed', max: 100 }, { name: 'Quality', max: 100 }, { name: 'Availability', max: 100 }, { name: 'Safety', max: 100 }, { name: '5S', max: 100 }], radius: '60%' },
            series: [{
                type: 'radar',
                data: [
                    { value: [92, 98, 94, 99, 95], name: 'Shift 1', itemStyle: { color: '#714B67' } },
                    { value: [86, 94, 88, 96, 90], name: 'Shift 2', itemStyle: { color: '#0284c7' } }
                ]
            }]
        };
    }

    if (el.type === 'HEATMAP') {
        return {
            tooltip: { position: 'top' },
            grid: { height: '70%', top: '10%' },
            xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], splitArea: { show: true } },
            yAxis: { type: 'category', data: ['Shift 1', 'Shift 2', 'Shift 3'], splitArea: { show: true } },
            visualMap: { min: 0, max: 100, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%' },
            series: [{ name: 'Output', type: 'heatmap', data: [[0, 0, 85], [1, 0, 92], [2, 0, 78], [3, 0, 95], [4, 0, 88], [0, 1, 80], [1, 1, 75], [2, 1, 70], [3, 1, 82], [4, 1, 90], [0, 2, 65], [1, 2, 72], [2, 2, 68], [3, 2, 71], [4, 2, 74]], label: { show: true }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } } }]
        };
    }

    if (el.type === 'TREEMAP') {
        return {
            series: [{
                type: 'treemap', data: [
                    { name: 'Dimension Out', value: 47 }, { name: 'Surface Scratch', value: 40 },
                    { name: 'Burr Excess', value: 15 }, { name: 'Crack', value: 50 }, { name: 'Pinhole', value: 50 }
                ]
            }]
        };
    }

    // Standard Bar / Line
    const { labels, values } = aggregateData(dataset, dim, met, el.aggregation || 'SUM');
    return {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '12%', containLabel: true },
        xAxis: { type: 'category', data: labels, axisLabel: { interval: 0, rotate: labels.length > 5 ? 20 : 0, fontSize: 10 } },
        yAxis: { type: 'value' },
        series: [{
            name: met, type: el.type === 'LINE' ? 'line' : 'bar',
            data: values, itemStyle: { color: el.color || '#714B67', borderRadius: [3, 3, 0, 0] },
            lineStyle: { width: 3, color: el.color || '#714B67' }, smooth: true
        }]
    };
}

// ─── EMBEDDED BI DASHBOARD COMPONENT ─────────────────────────────────
// Used inside AppBuilder (design preview) and LiveTerminal (runtime)
export default function EmbeddedBiDashboard({ dashboardId, title, refreshSeconds = 30, isDark = false, isDesignMode = false, externalData = null }) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [dataset, setDataset] = useState(externalData || SAMPLE_PRODUCTION_DATA);
    const [fullscreen, setFullscreen] = useState(false);

    // Auto-refresh
    useEffect(() => {
        if (isDesignMode) return;
        const interval = setInterval(() => setRefreshKey(prev => prev + 1), (refreshSeconds || 30) * 1000);
        return () => clearInterval(interval);
    }, [refreshSeconds, isDesignMode]);

    // Update dataset if external data changes
    useEffect(() => {
        if (externalData && Array.isArray(externalData) && externalData.length > 0) {
            setDataset(externalData);
        }
    }, [externalData]);

    // Load dashboard elements
    const dashboardElements = useMemo(() => {
        // Priority 1: Load specific dashboard by ID
        if (dashboardId) {
            const dashboards = getSavedBiDashboards();
            const found = dashboards.find(d => d.id === dashboardId);
            if (found?.elements) return found.elements;
        }
        // Priority 2: Load from main canvas
        const defaultDash = getDefaultDashboard();
        if (defaultDash?.elements) return defaultDash.elements;
        // Priority 3: Empty
        return [];
    }, [dashboardId, refreshKey]);

    // Calculate bounding box for scaling
    const { scaleX, scaleY, canvasW, canvasH } = useMemo(() => {
        if (!dashboardElements.length) return { scaleX: 1, scaleY: 1, canvasW: 1400, canvasH: 800 };
        let maxX = 0, maxY = 0;
        dashboardElements.forEach(el => {
            maxX = Math.max(maxX, (el.x || 0) + (el.width || 300));
            maxY = Math.max(maxY, (el.y || 0) + (el.height || 200));
        });
        return { scaleX: 1, scaleY: 1, canvasW: Math.max(maxX + 20, 800), canvasH: Math.max(maxY + 20, 400) };
    }, [dashboardElements]);

    if (dashboardElements.length === 0) {
        return (
            <div style={{
                width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '10px',
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '8px', color: isDark ? '#94a3b8' : '#64748b'
            }}>
                <BarChart3 size={36} style={{ opacity: 0.3 }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {dashboardId ? 'Dashboard Belum Ditemukan' : 'Tidak Ada Dashboard'}
                </div>
                <div style={{ fontSize: '0.72rem', opacity: 0.7, textAlign: 'center', maxWidth: '80%' }}>
                    {isDesignMode
                        ? 'Buka BI Studio untuk membuat dashboard, lalu pilih di Properties Panel.'
                        : 'Pilih dashboard dari BI Studio Canvas.'
                    }
                </div>
            </div>
        );
    }

    const renderContent = () => (
        <div
            key={refreshKey}
            style={{
                position: 'relative',
                width: `${canvasW}px`,
                height: `${canvasH}px`,
                transformOrigin: 'top left',
                overflow: 'hidden'
            }}
        >
            {dashboardElements.map(el => (
                <div
                    key={el.id}
                    style={{
                        position: 'absolute',
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                        backgroundColor: el.bgColor || (isDark ? '#1e293b' : '#ffffff'),
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    {/* Element Header */}
                    <div style={{
                        padding: '5px 8px',
                        backgroundColor: isDark ? '#1e293b' : '#fafbfc',
                        borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: isDark ? '#cbd5e1' : '#334155',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {el.title || el.type}
                    </div>

                    {/* Element Body */}
                    <div style={{ flex: 1, padding: el.type === 'KPI_CARD' ? '6px 10px' : '4px', overflow: 'hidden' }}>
                        {el.type === 'TEXT' ? (
                            <div style={{ fontSize: `${el.fontSize || 14}px`, color: el.color || (isDark ? '#e2e8f0' : '#1e293b'), fontWeight: 600 }}>
                                {el.textContent || el.title}
                            </div>
                        ) : el.type === 'KPI_CARD' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: el.color || '#714B67' }}>
                                    {el.prefix || ''}{calculateKpiValue(el, dataset)}{el.suffix || ''}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                                    {el.aggregation || 'SUM'} of {el.metric || 'Data'}
                                </div>
                            </div>
                        ) : (
                            <ReactECharts
                                option={getChartOption(el, dataset)}
                                style={{ height: '100%', width: '100%' }}
                                notMerge={true}
                                lazyUpdate={true}
                                theme={isDark ? 'dark' : undefined}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    // Fullscreen overlay
    if (fullscreen) {
        return (
            <div
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                    zIndex: 9999, display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}
                onClick={(e) => { if (e.target === e.currentTarget) setFullscreen(false); }}
            >
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 16px', backgroundColor: '#714B67', color: '#fff'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={16} />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{title || 'BI Dashboard'}</span>
                    </div>
                    <button onClick={() => setFullscreen(false)} style={{
                        padding: '4px 12px', backgroundColor: '#fff', color: '#714B67',
                        border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem'
                    }}>
                        ✕ Tutup Fullscreen
                    </button>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                    {renderContent()}
                </div>
            </div>
        );
    }

    return (
        <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            borderRadius: '8px', overflow: 'hidden', boxSizing: 'border-box'
        }}>
            {/* Dashboard Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px',
                backgroundColor: isDark ? '#1e293b' : '#fafbfc',
                borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart3 size={13} color="#714B67" />
                    <span style={{
                        fontSize: '0.75rem', fontWeight: 800,
                        color: isDark ? '#f8fafc' : '#334155',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%'
                    }}>
                        {title || 'BI Dashboard'}
                    </span>
                    <span style={{
                        fontSize: '0.58rem', padding: '1px 6px', backgroundColor: '#714B67',
                        color: '#fff', borderRadius: '4px', fontWeight: 700
                    }}>
                        LIVE
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {!isDesignMode && (
                        <>
                            <button
                                onClick={() => setRefreshKey(prev => prev + 1)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b', padding: '2px' }}
                                title="Refresh"
                            >
                                <RefreshCw size={12} />
                            </button>
                            <button
                                onClick={() => setFullscreen(true)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b', padding: '2px' }}
                                title="Fullscreen"
                            >
                                <Maximize2 size={12} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Dashboard Content — scaled to fit */}
            <div style={{
                flex: 1, overflow: 'auto', position: 'relative',
                backgroundColor: isDark ? '#0f172a' : '#ffffff'
            }}>
                <div style={{
                    transform: `scale(${Math.min(1, 1)})`,
                    transformOrigin: 'top left',
                    minHeight: '100%'
                }}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
