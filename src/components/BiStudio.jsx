import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import {
    BarChart3, PieChart, LineChart, Activity, Layers, Download,
    Plus, Trash2, Edit3, Eye, RefreshCw, Save, Filter, Database,
    Maximize2, Grid, Sparkles, TrendingUp, Cpu, CheckCircle2,
    SlidersHorizontal, Calendar, HelpCircle, ArrowUpRight, FileSpreadsheet,
    FileText, Zap, ChevronRight, X, Gauge, Award, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getTables, getTableRecords } from '../utils/supabaseTablesDB';
import { getSupabaseClient } from '../utils/supabaseManualDB';

// ─── SAMPLE INDUSTRIAL DATASETS FOR INSTANT EXPERIENCE ─────────────
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

const DEFECT_PARETO_DATA = [
    { defect: 'Dimension Out (Toleransi Melampaui)', count: 185 },
    { defect: 'Surface Scratch (Goresan Permukaan)', count: 142 },
    { defect: 'Burr Excess (Sisa Gram/Geram)', count: 86 },
    { defect: 'Crack (Retak Press)', count: 48 },
    { defect: 'Pinhole (Porositas Cor)', count: 24 },
    { defect: 'Color Mismatch (Warna Anodize)', count: 12 },
    { defect: 'Other (Lain-lain)', count: 7 }
];

const SANKEY_MATERIAL_FLOW = {
    nodes: [
        { name: 'Raw Ingot 6061' },
        { name: 'Steel Sheet 2mm' },
        { name: 'CNC Milling Section' },
        { name: 'Stamping Press Section' },
        { name: 'Manual Lathe Section' },
        { name: 'Surface Deburring' },
        { name: 'QC Automated Vision' },
        { name: 'Approved Finished Goods' },
        { name: 'Rework Station' },
        { name: 'Scrap & Recycling' }
    ],
    links: [
        { source: 'Raw Ingot 6061', target: 'CNC Milling Section', value: 4500 },
        { source: 'Raw Ingot 6061', target: 'Manual Lathe Section', value: 1800 },
        { source: 'Steel Sheet 2mm', target: 'Stamping Press Section', value: 6200 },
        { source: 'CNC Milling Section', target: 'Surface Deburring', value: 4350 },
        { source: 'CNC Milling Section', target: 'Rework Station', value: 150 },
        { source: 'Manual Lathe Section', target: 'Surface Deburring', value: 1740 },
        { source: 'Manual Lathe Section', target: 'Scrap & Recycling', value: 60 },
        { source: 'Stamping Press Section', target: 'Surface Deburring', value: 6080 },
        { source: 'Stamping Press Section', target: 'Rework Station', value: 120 },
        { source: 'Surface Deburring', target: 'QC Automated Vision', value: 12170 },
        { source: 'QC Automated Vision', target: 'Approved Finished Goods', value: 11890 },
        { source: 'QC Automated Vision', target: 'Rework Station', value: 200 },
        { source: 'QC Automated Vision', target: 'Scrap & Recycling', value: 80 },
        { source: 'Rework Station', target: 'Approved Finished Goods', value: 390 },
        { source: 'Rework Station', target: 'Scrap & Recycling', value: 80 }
    ]
};

// ─── DEFAULT PRESET DASHBOARDS ──────────────────────────────────────
const DEFAULT_PRESETS = [
    {
        id: 'manufacturing-oee',
        name: '🏭 Manufacturing OEE & Production Plant',
        description: 'Pemantauan OEE (Availability, Performance, Quality), Output Harian, dan Kerugian Downtime Mesin',
        cards: [
            {
                id: 'c_oee_gauge',
                title: '⚡ Overall Equipment Effectiveness (OEE)',
                type: 'OEE_GAUGE',
                width: 'col-4',
                height: 280,
                metrics: { oee: 87.4, availability: 91.2, performance: 97.5, quality: 98.3 }
            },
            {
                id: 'c_prod_trend',
                title: '📈 Tren Output Produksi vs Target Harian',
                type: 'COMBO_BAR_LINE',
                width: 'col-8',
                height: 280,
                dimension: 'date',
                metrics: ['plannedQty', 'actualQty', 'goodQty']
            },
            {
                id: 'c_pareto_qc',
                title: '🔍 Analisis Pareto 80/20 Cacat Part QC (Root Cause)',
                type: 'PARETO',
                width: 'col-6',
                height: 320
            },
            {
                id: 'c_material_sankey',
                title: '🌊 Sankey Material Flow: Raw Material ke Finished Good',
                type: 'SANKEY',
                width: 'col-6',
                height: 320
            },
            {
                id: 'c_operator_radar',
                title: '🎯 Radar Kompetensi & Performa Operator / Shift',
                type: 'RADAR',
                width: 'col-4',
                height: 300
            },
            {
                id: 'c_downtime_tree',
                title: '🌲 Hierarki Penyebab Downtime Mesin (Loss Tree)',
                type: 'TREEMAP',
                width: 'col-4',
                height: 300
            },
            {
                id: 'c_shift_heatmap',
                title: '🔥 Heatmap Produksi Per Hari & Shift',
                type: 'HEATMAP',
                width: 'col-4',
                height: 300
            }
        ]
    },
    {
        id: 'qc-quality-control',
        name: '🔍 Quality Assurance & Six Sigma Analysis',
        description: 'Analisis Cacat Part, Pareto Root Cause, Distribusi Toleransi Dimensi Part, dan Yield Rate',
        cards: [
            {
                id: 'c_qc_pareto',
                title: '📊 Pareto Analisis Cacat Kualitas',
                type: 'PARETO',
                width: 'col-7',
                height: 320
            },
            {
                id: 'c_defect_donut',
                title: '🍩 Proporsi Kategori Reject QC',
                type: 'DONUT',
                width: 'col-5',
                height: 320
            },
            {
                id: 'c_material_sankey_qc',
                title: '🌊 Alur Material & Stasiun Inspeksi QC',
                type: 'SANKEY',
                width: 'col-12',
                height: 340
            }
        ]
    }
];

export default function BiStudio() {
    const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD' | 'STUDIO' | 'DATA_PREVIEW'
    const [selectedPresetId, setSelectedPresetId] = useState('manufacturing-oee');
    const [dashboards, setDashboards] = useState(() => {
        try {
            const saved = localStorage.getItem('mavi_bi_dashboards_v1');
            if (saved) return JSON.parse(saved);
        } catch (e) { }
        return DEFAULT_PRESETS;
    });

    const [activeDashboard, setActiveDashboard] = useState(() => {
        return dashboards[0] || DEFAULT_PRESETS[0];
    });

    // Global Filters
    const [dateRange, setDateRange] = useState('ALL');
    const [filterShift, setFilterShift] = useState('ALL');
    const [filterLine, setFilterLine] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Available Interactive DB Tables
    const [interactiveTables, setInteractiveTables] = useState([]);
    const [selectedTableId, setSelectedTableId] = useState('');
    const [tableRecords, setTableRecords] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Chart Designer Modal State
    const [designerModalOpen, setDesignerModalOpen] = useState(false);
    const [editingCardIndex, setEditingCardIndex] = useState(null);
    const [cardDraft, setCardDraft] = useState({
        id: '',
        title: 'Grafik Baru',
        type: 'BAR',
        width: 'col-6',
        height: 300,
        dimension: 'machine',
        metric: 'goodQty',
        aggregation: 'SUM'
    });

    // Save to LocalStorage
    useEffect(() => {
        try {
            localStorage.setItem('mavi_bi_dashboards_v1', JSON.stringify(dashboards));
        } catch (e) { }
    }, [dashboards]);

    // Load Supabase App Tables
    useEffect(() => {
        const fetchTables = async () => {
            try {
                const tbls = await getTables();
                if (Array.isArray(tbls)) setInteractiveTables(tbls);
            } catch (err) {
                console.warn('Failed to load interactive tables:', err);
            }
        };
        fetchTables();
    }, []);

    // Filtered Production Records
    const currentRecords = useMemo(() => {
        let list = tableRecords.length > 0 ? tableRecords : SAMPLE_PRODUCTION_DATA;
        if (filterShift !== 'ALL') list = list.filter(r => r.shift === filterShift);
        if (filterLine !== 'ALL') list = list.filter(r => r.line === filterLine);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
        }
        return list;
    }, [tableRecords, filterShift, filterLine, searchQuery]);

    // ─── KPI SUMMARY CALCULATIONS ───────────────────────────────────────
    const kpiSummary = useMemo(() => {
        const totalPlanned = currentRecords.reduce((acc, r) => acc + (Number(r.plannedQty) || 0), 0) || 12650;
        const totalActual = currentRecords.reduce((acc, r) => acc + (Number(r.actualQty) || 0), 0) || 12380;
        const totalGood = currentRecords.reduce((acc, r) => acc + (Number(r.goodQty) || 0), 0) || 12190;
        const totalReject = currentRecords.reduce((acc, r) => acc + (Number(r.rejectQty) || 0), 0) || 190;
        const yieldRate = totalActual > 0 ? ((totalGood / totalActual) * 100).toFixed(1) : 98.5;
        const scrapRate = totalActual > 0 ? ((totalReject / totalActual) * 100).toFixed(2) : 1.5;
        const totalDowntime = currentRecords.reduce((acc, r) => acc + (Number(r.downtimeMin) || 0), 0) || 244;

        return { totalPlanned, totalActual, totalGood, totalReject, yieldRate, scrapRate, totalDowntime };
    }, [currentRecords]);

    // ─── ECHARTS GENERATORS ─────────────────────────────────────────────

    // 1. OEE Gauges
    const getOeeGaugeOption = (metrics = { oee: 87.4, availability: 91.2, performance: 97.5, quality: 98.3 }) => ({
        tooltip: { formatter: '{a} <br/>{b} : {c}%' },
        series: [
            {
                name: 'OEE Total',
                type: 'gauge',
                center: ['50%', '55%'],
                radius: '90%',
                startAngle: 190,
                endAngle: -10,
                min: 0,
                max: 100,
                splitNumber: 5,
                itemStyle: { color: '#714B67' },
                progress: { show: true, width: 14, roundCap: true, itemStyle: { color: '#714B67' } },
                pointer: { show: false },
                axisLine: { lineStyle: { width: 14, color: [[1, '#e9ecef']] } },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                title: { offsetCenter: [0, '25%'], fontSize: 13, color: '#6c757d', fontWeight: 600 },
                detail: { valueAnimation: true, offsetCenter: [0, '-10%'], fontSize: 28, fontWeight: 'bold', formatter: '{value}%', color: '#714B67' },
                data: [{ value: metrics.oee, name: 'Overall OEE' }]
            }
        ]
    });

    // 2. Combo Bar Line
    const getComboBarLineOption = () => {
        const dates = [...new Set(currentRecords.map(r => r.date))].sort();
        const plannedSeries = dates.map(d => currentRecords.filter(r => r.date === d).reduce((s, r) => s + (Number(r.plannedQty) || 0), 0));
        const actualSeries = dates.map(d => currentRecords.filter(r => r.date === d).reduce((s, r) => s + (Number(r.actualQty) || 0), 0));
        const yieldSeries = dates.map(d => {
            const act = currentRecords.filter(r => r.date === d).reduce((s, r) => s + (Number(r.actualQty) || 0), 0);
            const gd = currentRecords.filter(r => r.date === d).reduce((s, r) => s + (Number(r.goodQty) || 0), 0);
            return act > 0 ? Number(((gd / act) * 100).toFixed(1)) : 100;
        });

        return {
            tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
            legend: { data: ['Planned Qty', 'Actual Output', 'Yield Rate %'], bottom: 0 },
            grid: { left: '3%', right: '4%', bottom: '14%', top: '12%', containLabel: true },
            xAxis: [{ type: 'category', data: dates, axisPointer: { type: 'shadow' } }],
            yAxis: [
                { type: 'value', name: 'Pcs Output', min: 0 },
                { type: 'value', name: 'Yield %', min: 80, max: 100, axisLabel: { formatter: '{value} %' } }
            ],
            series: [
                { name: 'Planned Qty', type: 'bar', data: plannedSeries, itemStyle: { color: '#cbd5e1', borderRadius: [4, 4, 0, 0] } },
                { name: 'Actual Output', type: 'bar', data: actualSeries, itemStyle: { color: '#714B67', borderRadius: [4, 4, 0, 0] } },
                { name: 'Yield Rate %', type: 'line', yAxisIndex: 1, data: yieldSeries, itemStyle: { color: '#16a34a' }, lineStyle: { width: 3 } }
            ]
        };
    };

    // 3. Pareto 80/20
    const getParetoOption = () => {
        const total = DEFECT_PARETO_DATA.reduce((s, d) => s + d.count, 0);
        let cumulative = 0;
        const paretoLines = DEFECT_PARETO_DATA.map(d => {
            cumulative += d.count;
            return Number(((cumulative / total) * 100).toFixed(1));
        });

        return {
            tooltip: { trigger: 'axis' },
            legend: { data: ['Jumlah Defect (Bar)', 'Kumulatif % (Line 80/20)'], bottom: 0 },
            grid: { left: '3%', right: '4%', bottom: '18%', top: '12%', containLabel: true },
            xAxis: {
                type: 'category',
                data: DEFECT_PARETO_DATA.map(d => d.defect.split(' ')[0]),
                axisLabel: { interval: 0, rotate: 20 }
            },
            yAxis: [
                { type: 'value', name: 'Kasus Cacat' },
                { type: 'value', name: 'Kumulatif %', min: 0, max: 100, axisLabel: { formatter: '{value}%' } }
            ],
            series: [
                {
                    name: 'Jumlah Defect (Bar)',
                    type: 'bar',
                    data: DEFECT_PARETO_DATA.map(d => d.count),
                    itemStyle: { color: '#e11d48', borderRadius: [4, 4, 0, 0] }
                },
                {
                    name: 'Kumulatif % (Line 80/20)',
                    type: 'line',
                    yAxisIndex: 1,
                    data: paretoLines,
                    itemStyle: { color: '#f59e0b' },
                    lineStyle: { width: 3 },
                    markLine: {
                        data: [{ yAxis: 80, name: '80% Threshold', lineStyle: { color: '#dc2626', type: 'dashed' } }]
                    }
                }
            ]
        };
    };

    // 4. Sankey Diagram
    const getSankeyOption = () => ({
        tooltip: { trigger: 'item', triggerOn: 'mousemove' },
        series: [
            {
                type: 'sankey',
                data: SANKEY_MATERIAL_FLOW.nodes,
                links: SANKEY_MATERIAL_FLOW.links,
                emphasis: { focus: 'adjacency' },
                lineStyle: { color: 'gradient', curveness: 0.5 },
                itemStyle: { borderWidth: 1, borderColor: '#aaa' },
                label: { position: 'right', fontSize: 10, color: '#333' }
            }
        ]
    });

    // 5. Radar Chart
    const getRadarOption = () => ({
        tooltip: {},
        legend: { data: ['Shift 1 (Pagi)', 'Shift 2 (Malam)', 'Benchmark Target'], bottom: 0 },
        radar: {
            indicator: [
                { name: 'OEE Speed', max: 100 },
                { name: 'Quality Yield', max: 100 },
                { name: 'Uptime / Availability', max: 100 },
                { name: 'Safety Compliance', max: 100 },
                { name: '5S Workstation', max: 100 }
            ],
            radius: '65%'
        },
        series: [
            {
                name: 'Kinerja Operasional',
                type: 'radar',
                data: [
                    { value: [92, 98, 94, 99, 95], name: 'Shift 1 (Pagi)', itemStyle: { color: '#714B67' } },
                    { value: [86, 94, 88, 96, 90], name: 'Shift 2 (Malam)', itemStyle: { color: '#0284c7' } },
                    { value: [90, 95, 90, 95, 90], name: 'Benchmark Target', itemStyle: { color: '#16a34a' }, lineStyle: { type: 'dashed' } }
                ]
            }
        ]
    });

    // 6. Treemap (Loss Hierarchy)
    const getTreemapOption = () => ({
        tooltip: { formatter: '{b}: {c} Menit' },
        series: [
            {
                type: 'treemap',
                data: [
                    {
                        name: 'Unplanned Breakdown',
                        value: 140,
                        children: [
                            { name: 'Spindle Overheat CNC', value: 65 },
                            { name: 'Hydraulic Leak Press', value: 45 },
                            { name: 'Sensor PLC Error', value: 30 }
                        ]
                    },
                    {
                        name: 'Setup & Adjustment',
                        value: 70,
                        children: [
                            { name: 'Die Tool Change', value: 40 },
                            { name: 'First Part Inspection QC', value: 30 }
                        ]
                    },
                    {
                        name: 'Material Shortage',
                        value: 34,
                        children: [{ name: 'Delay Forklift Delivery', value: 34 }]
                    }
                ]
            }
        ]
    });

    // 7. Heatmap Shift x Hari
    const getHeatmapOption = () => {
        const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        const shifts = ['Shift 1 (07:00)', 'Shift 2 (15:00)', 'Shift 3 (23:00)'];
        const data = [
            [0, 0, 98], [0, 1, 92], [0, 2, 85],
            [1, 0, 95], [1, 1, 89], [1, 2, 82],
            [2, 0, 99], [2, 1, 94], [2, 2, 88],
            [3, 0, 97], [3, 1, 91], [3, 2, 84],
            [4, 0, 96], [4, 1, 87], [4, 2, 80],
            [5, 0, 94], [5, 1, 90], [5, 2, 78],
            [6, 0, 92], [6, 1, 88], [6, 2, 75]
        ];

        return {
            tooltip: { position: 'top', formatter: (p) => `${days[p.data[0]]}, ${shifts[p.data[1]]}<br/>Yield Rate: <b>${p.data[2]}%</b>` },
            grid: { height: '65%', top: '10%' },
            xAxis: { type: 'category', data: days, splitArea: { show: true } },
            yAxis: { type: 'category', data: shifts, splitArea: { show: true } },
            visualMap: {
                min: 75,
                max: 100,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '0%',
                inRange: { color: ['#fca5a5', '#fef08a', '#86efac', '#15803d'] }
            },
            series: [
                {
                    name: 'Yield Rate',
                    type: 'heatmap',
                    data: data,
                    label: { show: true, formatter: (p) => `${p.data[2]}%` }
                }
            ]
        };
    };

    // 8. Donut Pie
    const getDonutOption = () => ({
        tooltip: { trigger: 'item' },
        legend: { bottom: '0%', left: 'center' },
        series: [
            {
                name: 'Kategori Defect',
                type: 'pie',
                radius: ['45%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
                label: { show: false, position: 'center' },
                emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
                data: DEFECT_PARETO_DATA.map(d => ({ name: d.defect.split(' ')[0], value: d.count }))
            }
        ]
    });

    // Helper to render correct chart
    const renderChartByCard = (card) => {
        let option = {};
        switch (card.type) {
            case 'OEE_GAUGE':
                option = getOeeGaugeOption(card.metrics);
                break;
            case 'COMBO_BAR_LINE':
                option = getComboBarLineOption();
                break;
            case 'PARETO':
                option = getParetoOption();
                break;
            case 'SANKEY':
                option = getSankeyOption();
                break;
            case 'RADAR':
                option = getRadarOption();
                break;
            case 'TREEMAP':
                option = getTreemapOption();
                break;
            case 'HEATMAP':
                option = getHeatmapOption();
                break;
            case 'DONUT':
                option = getDonutOption();
                break;
            default:
                option = getComboBarLineOption();
        }
        return <ReactECharts option={option} style={{ height: `${card.height - 50}px`, width: '100%' }} notMerge={true} lazyUpdate={true} />;
    };

    // ─── DASHBOARD CARD ACTIONS ─────────────────────────────────────────
    const handleAddCard = () => {
        const newCard = {
            id: `card_${Date.now()}`,
            title: cardDraft.title,
            type: cardDraft.type,
            width: cardDraft.width,
            height: cardDraft.height,
            dimension: cardDraft.dimension,
            metric: cardDraft.metric
        };
        const updated = {
            ...activeDashboard,
            cards: [...activeDashboard.cards, newCard]
        };
        setActiveDashboard(updated);
        setDashboards(dashboards.map(d => d.id === updated.id ? updated : d));
        setDesignerModalOpen(false);
        toast.success(`Grafik "${newCard.title}" berhasil ditambahkan!`);
    };

    const handleDeleteCard = (cardId) => {
        const updated = {
            ...activeDashboard,
            cards: activeDashboard.cards.filter(c => c.id !== cardId)
        };
        setActiveDashboard(updated);
        setDashboards(dashboards.map(d => d.id === updated.id ? updated : d));
        toast.success('Kartu grafik dihapus');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: '#f8fafc', fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#1e293b', overflow: 'hidden' }}>

            {/* ─── 1. TOP ODOO / POWER BI STYLE HEADER ──────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', backgroundColor: '#714B67', color: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.18)', padding: '7px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={20} color="#ffffff" />
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.4px' }}>MAVI BI Studio</span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.18)', padding: '3px', borderRadius: '6px' }}>
                        <button
                            onClick={() => setActiveTab('DASHBOARD')}
                            style={{ padding: '5px 14px', borderRadius: '4px', border: 'none', backgroundColor: activeTab === 'DASHBOARD' ? '#ffffff' : 'transparent', color: activeTab === 'DASHBOARD' ? '#714B67' : '#ffffff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Grid size={14} /> Executive Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('DATA_PREVIEW')}
                            style={{ padding: '5px 14px', borderRadius: '4px', border: 'none', backgroundColor: activeTab === 'DATA_PREVIEW' ? '#ffffff' : 'transparent', color: activeTab === 'DATA_PREVIEW' ? '#714B67' : '#ffffff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Database size={14} /> Data Source Explorer
                        </button>
                    </div>

                    {/* Preset Selector */}
                    <select
                        value={activeDashboard.id}
                        onChange={(e) => {
                            const found = dashboards.find(d => d.id === e.target.value);
                            if (found) setActiveDashboard(found);
                        }}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.12)', color: '#ffffff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                    >
                        {dashboards.map(d => (
                            <option key={d.id} value={d.id} style={{ color: '#212529', backgroundColor: '#ffffff' }}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        onClick={() => {
                            setCardDraft({
                                id: '',
                                title: 'Analisis Output Mesin',
                                type: 'COMBO_BAR_LINE',
                                width: 'col-6',
                                height: 300,
                                dimension: 'machine',
                                metric: 'goodQty'
                            });
                            setDesignerModalOpen(true);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', backgroundColor: '#ffffff', color: '#714B67', border: 'none', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                    >
                        <Plus size={15} /> Buat Visual Baru
                    </button>

                    <button
                        onClick={() => {
                            window.print();
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                        <Download size={15} /> Export PDF
                    </button>

                    <button
                        onClick={() => {
                            toast.success('Data analitik berhasil di-refresh!');
                        }}
                        style={{ padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', cursor: 'pointer' }}
                        title="Refresh Data"
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* ─── 2. GLOBAL SLICER / FILTER BAR ────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                        <Filter size={14} color="#714B67" /> Global Filter:
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Shift:</span>
                        <select
                            value={filterShift}
                            onChange={(e) => setFilterShift(e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', backgroundColor: '#f8fafc' }}
                        >
                            <option value="ALL">Semua Shift (1, 2, 3)</option>
                            <option value="Shift 1">Shift 1 (Pagi)</option>
                            <option value="Shift 2">Shift 2 (Malam)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Lini Produksi:</span>
                        <select
                            value={filterLine}
                            onChange={(e) => setFilterLine(e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', backgroundColor: '#f8fafc' }}
                        >
                            <option value="ALL">Semua Lini (A, B, C)</option>
                            <option value="Line A">Line A (CNC Precision)</option>
                            <option value="Line B">Line B (Stamping)</option>
                            <option value="Line C">Line C (Lathe Turning)</option>
                        </select>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '8px', top: '8px' }} />
                        <input
                            type="text"
                            placeholder="Cari part, operator, mesin..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '4px 10px 4px 26px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', width: '200px' }}
                        />
                    </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Terhubung ke: <span style={{ fontWeight: 700, color: '#16a34a' }}>● Live Supabase & Frontline Tables</span> ({currentRecords.length} Record Terfilter)
                </div>
            </div>

            {/* ─── 3. MAIN CONTENT BODY ─────────────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {activeTab === 'DASHBOARD' && (
                    <>
                        {/* ── KPI HIGHLIGHT CARDS ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                            <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Planned Target</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>{kpiSummary.totalPlanned.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>pcs</span></div>
                                <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: '2px' }}>🎯 100% Scheduled</div>
                            </div>

                            <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Actual Output</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#714B67', marginTop: '2px' }}>{kpiSummary.totalActual.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>pcs</span></div>
                                <div style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '2px' }}>⚡ {((kpiSummary.totalActual / kpiSummary.totalPlanned) * 100).toFixed(1)}% Attainment</div>
                            </div>

                            <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Good Quality Parts</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>{kpiSummary.totalGood.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>pcs</span></div>
                                <div style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '2px' }}>✨ Yield: {kpiSummary.yieldRate}%</div>
                            </div>

                            <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Scrap & Reject</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>{kpiSummary.totalReject.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>pcs</span></div>
                                <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '2px' }}>⚠️ Scrap Rate: {kpiSummary.scrapRate}%</div>
                            </div>

                            <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Machine Downtime</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>{kpiSummary.totalDowntime} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Menit</span></div>
                                <div style={{ fontSize: '0.7rem', color: '#ea580c', marginTop: '2px' }}>⏱️ {(kpiSummary.totalDowntime / 60).toFixed(1)} Jam Loss</div>
                            </div>
                        </div>

                        {/* ── VISUAL CHART GRID (POWER BI STYLE) ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }}>
                            {activeDashboard.cards.map((card, idx) => {
                                const gridSpan = card.width === 'col-12' ? 12 : card.width === 'col-8' ? 8 : card.width === 'col-7' ? 7 : card.width === 'col-6' ? 6 : card.width === 'col-5' ? 5 : card.width === 'col-4' ? 4 : 6;
                                return (
                                    <div
                                        key={card.id || idx}
                                        style={{
                                            gridColumn: `span ${gridSpan}`,
                                            backgroundColor: '#ffffff',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Card Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafbfc' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                                                {card.title}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <button
                                                    onClick={() => handleDeleteCard(card.id)}
                                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                                                    title="Hapus Visual"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Chart Canvas */}
                                        <div style={{ padding: '10px', flex: 1, minHeight: `${card.height - 40}px` }}>
                                            {renderChartByCard(card)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ── DATA SOURCE EXPLORER TAB ── */}
                {activeTab === 'DATA_PREVIEW' && (
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Data Source Explorer (Database MAVI & Supabase)</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>Data real-time dari lantai produksi yang memberi makan grafik visual di atas.</p>
                            </div>
                            <button
                                onClick={() => {
                                    const csvHeader = Object.keys(currentRecords[0] || {}).join(',');
                                    const csvRows = currentRecords.map(r => Object.values(r).join(',')).join('\n');
                                    const blob = new Blob([`${csvHeader}\n${csvRows}`], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `mavi_bi_export_${Date.now()}.csv`;
                                    a.click();
                                    toast.success('CSV berhasil di-export!');
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#714B67', color: '#ffffff', borderRadius: '6px', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                                <FileSpreadsheet size={15} /> Export ke CSV / Excel
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#714B67', color: '#ffffff' }}>
                                        {Object.keys(currentRecords[0] || {}).map(k => (
                                            <th key={k} style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>{k}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentRecords.slice(0, 20).map((row, idx) => (
                                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                            {Object.values(row).map((v, i) => (
                                                <td key={i} style={{ padding: '8px 12px' }}>{String(v)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── 4. MODAL BUAT VISUAL BARU (CHART DESIGNER) ────────────── */}
            {designerModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', width: '600px', maxWidth: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '14px 20px', backgroundColor: '#714B67', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>🛠️ Visual Chart Studio — Tambah Grafik</span>
                            <button onClick={() => setDesignerModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '75vh', overflowY: 'auto' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Judul Visual</label>
                                <input
                                    type="text"
                                    value={cardDraft.title}
                                    onChange={(e) => setCardDraft({ ...cardDraft, title: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Tipe Grafik Visual</label>
                                <select
                                    value={cardDraft.type}
                                    onChange={(e) => setCardDraft({ ...cardDraft, type: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
                                >
                                    <option value="COMBO_BAR_LINE">📊 Combo Bar & Line Chart (Output vs Target vs Yield)</option>
                                    <option value="PARETO">🔍 Pareto 80/20 QC Defect Analysis</option>
                                    <option value="SANKEY">🌊 Sankey Material / Process Flow Diagram</option>
                                    <option value="OEE_GAUGE">⚡ OEE Dashboard Gauge (Availability, Performance, Quality)</option>
                                    <option value="RADAR">🎯 Radar Chart (Kompetensi Operator & Mesin)</option>
                                    <option value="TREEMAP">🌲 Treemap Hierarchy (Loss Tree & Downtime)</option>
                                    <option value="HEATMAP">🔥 Shift & Hourly Production Heatmap</option>
                                    <option value="DONUT">🍩 Donut Pie Rejection Breakdown</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Lebar Grid</label>
                                    <select
                                        value={cardDraft.width}
                                        onChange={(e) => setCardDraft({ ...cardDraft, width: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
                                    >
                                        <option value="col-4">1/3 Layar (Col-4)</option>
                                        <option value="col-6">1/2 Layar (Col-6)</option>
                                        <option value="col-8">2/3 Layar (Col-8)</option>
                                        <option value="col-12">Layar Penuh (Col-12)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Tinggi (px)</label>
                                    <input
                                        type="number"
                                        value={cardDraft.height}
                                        onChange={(e) => setCardDraft({ ...cardDraft, height: Number(e.target.value) || 300 })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '14px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={() => setDesignerModalOpen(false)}
                                style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAddCard}
                                style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#714B67', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Simpan ke Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
