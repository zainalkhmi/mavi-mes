import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import {
    BarChart3, PieChart, LineChart, Activity, Layers, Download,
    Plus, Trash2, Edit3, Eye, RefreshCw, Save, Filter, Database,
    Maximize2, Grid, Sparkles, TrendingUp, Cpu, CheckCircle2,
    SlidersHorizontal, Calendar, HelpCircle, ArrowUpRight, FileSpreadsheet,
    FileText, Zap, ChevronRight, X, Gauge, Award, Search, Link2,
    Play, Upload, AlertCircle, ArrowDown, ArrowUp, Check, Move,
    Type, Palette, Layout, Copy, Settings2, Hash, AlignLeft,
    Square, Undo, Redo, ZoomIn, ZoomOut, CheckSquare, Code2,
    Terminal, Calculator, Sliders, Table, MousePointerClick,
    FileCode2, SplitSquareHorizontal, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getTables, getTableRecords } from '../utils/supabaseTablesDB';
import { getSupabaseClient } from '../utils/supabaseManualDB';
import { executeConnector } from '../utils/connectorHub';
import { DASHBOARD_TEMPLATES } from '../utils/dashboardTemplates';

// ─── SAMPLE INDUSTRIAL DATASETS ─────────────────────────────────────
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
        { name: 'Raw Material Stock' },
        { name: 'CNC Section' },
        { name: 'Stamping Press' },
        { name: 'Assembly Line' },
        { name: 'QC Automated Vision' },
        { name: 'Finished Good Warehouse' },
        { name: 'Rework Station' },
        { name: 'Scrap Yard' }
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

// ─── POWER BI VISUAL TYPES PALETTE ──────────────────────────────────
const VISUAL_TYPES = [
    { type: 'BAR', label: 'Clustered Bar', icon: BarChart3, desc: 'Grafik Batang Kolom' },
    { type: 'LINE', label: 'Line Chart', icon: LineChart, desc: 'Tren Garis Kontinu' },
    { type: 'PARETO', label: 'Pareto 80/20', icon: TrendingUp, desc: 'Analisis Cacat QC 80/20' },
    { type: 'DONUT', label: 'Donut Pie', icon: PieChart, desc: 'Proporsi & Persentase' },
    { type: 'OEE_GAUGE', label: 'Gauge Meter', icon: Gauge, desc: 'Indikator Target & OEE' },
    { type: 'RADAR', label: 'Radar Spider', icon: Award, desc: 'Analisis Multi-Sumbu' },
    { type: 'SANKEY', label: 'Sankey Flow', icon: Activity, desc: 'Alur Proses & Material' },
    { type: 'TREEMAP', label: 'Treemap Loss', icon: Layout, desc: 'Hierarki Kategori & Loss' },
    { type: 'HEATMAP', label: 'Heatmap Matrix', icon: Sparkles, desc: 'Kepadatan Shift x Hari' },
    { type: 'KPI_CARD', label: 'KPI Card', icon: Hash, desc: 'Angka Metrik Utama' },
    { type: 'SLICER', label: 'Filter Slicer', icon: Sliders, desc: 'Filter Dropdown Interaktif' },
    { type: 'DATE_RANGE', label: 'Date Slicer', icon: Calendar, desc: 'Filter Rentang Tanggal' },
    { type: 'TEXT', label: 'Text Box', icon: Type, desc: 'Label Judul / Catatan' }
];

export default function BiStudio() {
    const [activeTab, setActiveTab] = useState('CANVAS'); // 'CANVAS' | 'QUERY_STUDIO' | 'CONNECTOR_HUB' | 'DATA_PREVIEW'

    // ─── DATA SOURCE STATE ──────────────────────────────────────────
    const [sourceName, setSourceName] = useState('Manufacturing Telemetry (Live)');
    const [interactiveTables, setInteractiveTables] = useState([]);
    const [selectedTableId, setSelectedTableId] = useState('');
    const [availableConnectors, setAvailableConnectors] = useState([]);
    const [selectedConnectorId, setSelectedConnectorId] = useState('');
    const [selectedFunctionId, setSelectedFunctionId] = useState('');
    const [connectorLoading, setConnectorLoading] = useState(false);

    // Active Raw Records
    const [activeDataset, setActiveDataset] = useState(SAMPLE_PRODUCTION_DATA);

    // ─── DATA SOURCE SELECTOR STATE ──────────────────────────────────
    const [dataSourceType, setDataSourceType] = useState('SAMPLE'); // 'SAMPLE' | 'APP_TABLE' | 'MES_TABLE' | 'CONNECTOR' | 'CUSTOM_QUERY'
    const [dataSourceLoading, setDataSourceLoading] = useState(false);
    const [dataSourceLabel, setDataSourceLabel] = useState('Manufacturing Telemetry (Sample)');
    const [selectedMesTable, setSelectedMesTable] = useState('');
    const [showDataSourcePanel, setShowDataSourcePanel] = useState(false);

    // ─── POWER BI FEATURE 1: INTERACTIVE CROSS-FILTERING ─────────────
    const [crossFilter, setCrossFilter] = useState(null); // { field: 'machine', value: 'CNC-01', sourceVisual: 'Bar' }

    // ─── POWER BI FEATURE 2: CANVAS SLICERS STATE ────────────────────
    const [canvasSlicers, setCanvasSlicers] = useState({}); // { machine: 'ALL', shift: 'ALL' }

    // ─── POWER BI FEATURE 3: CALCULATED COLUMNS / DAX MEASURES ───────
    const [calculatedColumns, setCalculatedColumns] = useState([
        { name: 'scrapCost', label: 'Scrap Cost (IDR)', expression: 'rejectQty * 25000', isCurrency: true },
        { name: 'yieldPercent', label: 'Yield (%)', expression: '(goodQty / actualQty) * 100', isPercent: true }
    ]);
    const [showMeasureModal, setShowMeasureModal] = useState(false);
    const [newMeasureName, setNewMeasureName] = useState('');
    const [newMeasureExpr, setNewMeasureExpr] = useState('');

    // ─── POWER BI FEATURE 4: MULTI-PAGE CANVAS PAGES ─────────────────
    const [pages, setPages] = useState(() => {
        return [
            { id: 'page_1', name: 'Page 1: Plant Overview' },
            { id: 'page_2', name: 'Page 2: Defect Deep-Dive' }
        ];
    });
    const [activePageId, setActivePageId] = useState('page_1');

    // ─── POWER BI FEATURE 5: SQL & QUERY STUDIO STATE ────────────────
    const [sqlQuery, setSqlQuery] = useState(
        'SELECT machine, SUM(actualQty) as total_actual, SUM(goodQty) as total_good, SUM(rejectQty) as total_scrap, AVG(cycleTime) as avg_cycle\nFROM dataset\nGROUP BY machine\nORDER BY total_actual DESC'
    );
    const [queryResult, setQueryResult] = useState(null);

    // ─── DASHBOARD MANAGEMENT STATE ──────────────────────────────────
    const [currentDashboardId, setCurrentDashboardId] = useState(null);
    const [currentDashboardName, setCurrentDashboardName] = useState('Industrial Plant Telemetry BI');
    const [currentDashboardDesc, setCurrentDashboardDesc] = useState('');
    const [dashboardList, setDashboardList] = useState([]);
    const [dashboardSaving, setDashboardSaving] = useState(false);
    const [showDashboardManager, setShowDashboardManager] = useState(false);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [isPublished, setIsPublished] = useState(false);

    // Global Filters / Slicers
    const filterShift = 'ALL';
    const filterLine = 'ALL';
    const searchQuery = '';

    // ─── CANVAS STUDIO STATE (POWER BI STYLE) ───────────────────────
    const [canvasElements, setCanvasElements] = useState(() => {
        try {
            const saved = localStorage.getItem('mandor_bi_canvas_elements_v2');
            if (saved) return JSON.parse(saved);
        } catch {
            // fallback to default
        }
        return [
            { id: 'el_title', type: 'TEXT', x: 20, y: 20, width: 420, height: 60, title: '🏭 PLANT PRODUCTION & QUALITY BI DASHBOARD', textContent: 'Live Shopfloor Telemetry & Defect Pareto Analysis', fontSize: 16, color: '#714B67', bgColor: '#ffffff' },
            { id: 'el_kpi_out', type: 'KPI_CARD', x: 460, y: 20, width: 220, height: 90, title: 'Actual Output', metric: 'actualQty', aggregation: 'SUM', prefix: '', suffix: ' pcs', color: '#714B67' },
            { id: 'el_kpi_yield', type: 'KPI_CARD', x: 700, y: 20, width: 220, height: 90, title: 'Quality Yield Rate', metric: 'goodQty', aggregation: 'PERCENT', prefix: '', suffix: '%', color: '#16a34a' },
            { id: 'el_kpi_dt', type: 'KPI_CARD', x: 940, y: 20, width: 220, height: 90, title: 'Total Downtime', metric: 'downtimeMin', aggregation: 'SUM', prefix: '', suffix: ' Min', color: '#ea580c' },
            { id: 'el_slicer_line', type: 'SLICER', x: 1180, y: 20, width: 200, height: 90, title: 'Filter Line', dimension: 'line' },
            { id: 'el_oee', type: 'OEE_GAUGE', x: 20, y: 130, width: 340, height: 280, title: '⚡ Plant Overall OEE', metrics: { oee: 88.4 } },
            { id: 'el_bar', type: 'BAR', x: 380, y: 130, width: 440, height: 280, title: '📊 Output Per Mesin', dimension: 'machine', metric: 'actualQty', aggregation: 'SUM' },
            { id: 'el_pareto', type: 'PARETO', x: 840, y: 130, width: 540, height: 280, title: '🔍 Pareto 80/20 QC Defect Analysis', dimension: 'defectType', metric: 'rejectQty' },
            { id: 'el_sankey', type: 'SANKEY', x: 20, y: 430, width: 620, height: 300, title: '🌊 Material Flow: Raw Material ke Finished Good' },
            { id: 'el_donut', type: 'DONUT', x: 660, y: 430, width: 340, height: 300, title: '🍩 Rejection Breakdown', dimension: 'defectType', metric: 'rejectQty' },
            { id: 'el_radar', type: 'RADAR', x: 1020, y: 430, width: 360, height: 300, title: '🎯 Operator & Machine Radar' }
        ];
    });

    const [selectedElementId, setSelectedElementId] = useState(null);
    const [canvasScale, setCanvasScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);

    // Save Canvas Elements
    useEffect(() => {
        try {
            localStorage.setItem('mandor_bi_canvas_elements_v2', JSON.stringify(canvasElements));
        } catch {
            console.warn('[BI Studio] Failed to cache canvas elements');
        }
    }, [canvasElements]);

    // Load tables and connectors
    useEffect(() => {
        const init = async () => {
            try {
                const tbls = await getTables();
                if (Array.isArray(tbls)) setInteractiveTables(tbls);
                const conns = JSON.parse(localStorage.getItem('mandor_integration_connectors') || '[]');
                setAvailableConnectors(conns);
                if (conns.length > 0) {
                    setSelectedConnectorId(conns[0].id);
                    if (conns[0].functions?.length > 0) {
                        setSelectedFunctionId(conns[0].functions[0].id || conns[0].functions[0].name);
                    }
                }
            } catch {
                console.warn('[BI Studio] Failed to init tables/connectors');
            }
        };
        init();
    }, []);

    // ─── FILTERED & CALCULATED DATASET (POWER BI ENGINE) ─────────────
    const filteredDataset = useMemo(() => {
        let list = [...activeDataset];

        // 1. Evaluate Calculated Columns (DAX)
        if (calculatedColumns.length > 0) {
            list = list.map(row => {
                const ext = { ...row };
                calculatedColumns.forEach(calc => {
                    try {
                        const fn = new Function(...Object.keys(row), `return Number(${calc.expression});`);
                        const res = fn(...Object.values(row));
                        ext[calc.name] = isNaN(res) ? 0 : Number(res.toFixed(2));
                    } catch {
                        ext[calc.name] = 0;
                    }
                });
                return ext;
            });
        }

        // 2. Apply Interactive Cross-Filter from Charts
        if (crossFilter && crossFilter.field && crossFilter.value !== undefined) {
            list = list.filter(r => String(r[crossFilter.field]) === String(crossFilter.value));
        }

        // 3. Apply Canvas Slicers
        if (canvasSlicers && Object.keys(canvasSlicers).length > 0) {
            Object.entries(canvasSlicers).forEach(([f, val]) => {
                if (val && val !== 'ALL') {
                    list = list.filter(r => String(r[f]) === String(val));
                }
            });
        }

        // 4. Global Header Slicers
        if (filterShift !== 'ALL' && list.some(r => r.shift)) list = list.filter(r => r.shift === filterShift);
        if (filterLine !== 'ALL' && list.some(r => r.line)) list = list.filter(r => r.line === filterLine);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
        }
        return list;
    }, [activeDataset, calculatedColumns, crossFilter, canvasSlicers, filterShift, filterLine, searchQuery]);

    const availableColumns = useMemo(() => {
        if (!filteredDataset || filteredDataset.length === 0) return [];
        return Object.keys(filteredDataset[0]);
    }, [filteredDataset]);

    const numericColumns = useMemo(() => {
        if (!filteredDataset || filteredDataset.length === 0) return [];
        const first = filteredDataset[0];
        return Object.keys(first).filter(k => typeof first[k] === 'number' || (!isNaN(Number(first[k])) && first[k] !== '' && typeof first[k] !== 'boolean'));
    }, [filteredDataset]);

    // Selected Element Object
    const selectedElement = useMemo(() => {
        return canvasElements.find(el => el.id === selectedElementId) || null;
    }, [canvasElements, selectedElementId]);

    // ─── AGGREGATOR FUNCTION ──────────────────────────────────────────
    const aggregateData = (dimensionCol, metricCol, aggType = 'SUM') => {
        if (!dimensionCol || !filteredDataset.length) return { labels: [], values: [] };
        const groups = {};

        filteredDataset.forEach(row => {
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
    };

    // Calculate Single KPI metric
    const calculateKpiValue = (el) => {
        const met = el.metric || numericColumns[0];
        if (!met || !filteredDataset.length) return 0;

        if (el.aggregation === 'PERCENT') {
            const totalGood = filteredDataset.reduce((s, r) => s + (Number(r.goodQty) || 0), 0);
            const totalActual = filteredDataset.reduce((s, r) => s + (Number(r.actualQty) || 0), 0);
            return totalActual > 0 ? ((totalGood / totalActual) * 100).toFixed(1) : '98.5';
        }

        const sum = filteredDataset.reduce((s, r) => s + (Number(r[met]) || 0), 0);
        if (el.aggregation === 'AVG') return (sum / filteredDataset.length).toFixed(1);
        if (el.aggregation === 'COUNT') return filteredDataset.length;
        return sum.toLocaleString();
    };

    // ─── POWER BI CROSS-FILTER CHART EVENT LISTENER ───────────────────
    const handleChartClick = (params, el) => {
        if (!params || !params.name) return;
        const dim = el.dimension || 'machine';
        const clickedVal = params.name;

        if (crossFilter?.field === dim && crossFilter?.value === clickedVal) {
            setCrossFilter(null);
            toast('Cross-filter cleared', { icon: '🔄' });
        } else {
            setCrossFilter({ field: dim, value: clickedVal, sourceVisual: el.title || el.type });
            toast.success(`Cross-Filtered by ${dim} = "${clickedVal}"`, { icon: '⚡' });
        }
    };

    // ─── ECHARTS OPTIONS BUILDERS ──────────────────────────────────────
    const getChartOption = (el) => {
        const dim = el.dimension || availableColumns[0] || 'machine';
        const met = el.metric || numericColumns[0] || 'actualQty';

        if (el.type === 'OEE_GAUGE') {
            return {
                series: [{
                    name: 'OEE',
                    type: 'gauge',
                    center: ['50%', '55%'],
                    radius: '90%',
                    startAngle: 190,
                    endAngle: -10,
                    min: 0,
                    max: 100,
                    splitNumber: 5,
                    itemStyle: { color: el.color || '#714B67' },
                    progress: { show: true, width: 12, roundCap: true, itemStyle: { color: el.color || '#714B67' } },
                    pointer: { show: false },
                    axisLine: { lineStyle: { width: 12, color: [[1, '#e2e8f0']] } },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    detail: { valueAnimation: true, offsetCenter: [0, '-10%'], fontSize: 24, fontWeight: 'bolder', formatter: '{value}%', color: '#1e293b' },
                    data: [{ value: 88.4, name: 'Overall OEE' }]
                }]
            };
        }

        if (el.type === 'SANKEY') {
            return {
                tooltip: { trigger: 'item', triggerOn: 'mousemove' },
                series: [{
                    type: 'sankey',
                    layout: 'none',
                    emphasis: { focus: 'adjacency' },
                    data: SANKEY_MATERIAL_FLOW.nodes,
                    links: SANKEY_MATERIAL_FLOW.links,
                    lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.35 },
                    itemStyle: { borderWidth: 0, borderRadius: 2 },
                    label: { color: '#334155', fontSize: 10, fontWeight: 600 }
                }]
            };
        }

        if (el.type === 'RADAR') {
            return {
                tooltip: {},
                radar: {
                    indicator: [
                        { name: 'Availability', max: 100 },
                        { name: 'Quality', max: 100 },
                        { name: 'Speed', max: 100 },
                        { name: 'Safety', max: 100 },
                        { name: '5S', max: 100 }
                    ],
                    radius: '65%',
                    axisName: { color: '#64748b', fontSize: 10 }
                },
                series: [{
                    type: 'radar',
                    data: [
                        { value: [92, 98, 85, 96, 90], name: 'Shift 1 Target', itemStyle: { color: '#3b82f6' }, areaStyle: { opacity: 0.15 } },
                        { value: [88, 94, 78, 92, 85], name: 'Shift 2 Actual', itemStyle: { color: '#714B67' }, areaStyle: { opacity: 0.2 } }
                    ]
                }]
            };
        }

        const { labels, values } = aggregateData(dim, met, el.aggregation);

        if (el.type === 'DONUT') {
            return {
                tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                legend: { bottom: 0, textStyle: { fontSize: 10, color: '#64748b' } },
                series: [{
                    name: el.title,
                    type: 'pie',
                    radius: ['45%', '70%'],
                    center: ['50%', '42%'],
                    avoidLabelOverlap: false,
                    itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
                    label: { show: false },
                    data: labels.map((l, i) => ({ name: l, value: values[i] }))
                }]
            };
        }

        if (el.type === 'PARETO') {
            let total = values.reduce((a, b) => a + b, 0);
            let runningSum = 0;
            const cumPercent = values.map(v => {
                runningSum += v;
                return total > 0 ? Number(((runningSum / total) * 100).toFixed(1)) : 0;
            });

            return {
                tooltip: { trigger: 'axis' },
                grid: { top: 30, right: 40, bottom: 40, left: 40 },
                xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 9, rotate: 25, color: '#64748b' } },
                yAxis: [
                    { type: 'value', name: 'Reject Qty', axisLabel: { fontSize: 9 } },
                    { type: 'value', name: 'Cum %', max: 100, axisLabel: { formatter: '{value}%', fontSize: 9 }, splitLine: { show: false } }
                ],
                series: [
                    { name: 'Rejects', type: 'bar', data: values, itemStyle: { color: '#e11d48', borderRadius: [3, 3, 0, 0] } },
                    { name: 'Cumulative %', type: 'line', yAxisIndex: 1, data: cumPercent, itemStyle: { color: '#f59e0b' }, lineStyle: { width: 2 } }
                ]
            };
        }

        if (el.type === 'LINE') {
            return {
                tooltip: { trigger: 'axis' },
                grid: { top: 20, right: 20, bottom: 40, left: 40 },
                xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 9, rotate: 25, color: '#64748b' } },
                yAxis: { type: 'value', axisLabel: { fontSize: 9 } },
                series: [{
                    name: el.title,
                    type: 'line',
                    smooth: true,
                    data: values,
                    itemStyle: { color: el.color || '#714B67' },
                    areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: el.color ? `${el.color}66` : '#714B6766' }, { offset: 1, color: 'transparent' }] } }
                }]
            };
        }

        // Default: CLUSTERED BAR
        return {
            tooltip: { trigger: 'axis' },
            grid: { top: 20, right: 20, bottom: 40, left: 40 },
            xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 9, rotate: 20, color: '#64748b' } },
            yAxis: { type: 'value', axisLabel: { fontSize: 9 } },
            series: [{
                name: el.title,
                type: 'bar',
                data: values,
                itemStyle: {
                    color: (params) => {
                        // Highlight if crossFilter is matching
                        if (crossFilter && crossFilter.value === params.name) return '#f59e0b';
                        return el.color || '#714B67';
                    },
                    borderRadius: [4, 4, 0, 0]
                }
            }]
        };
    };

    // Add Canvas Element
    const handleAddCanvasElement = (type) => {
        const newEl = {
            id: `el_${Date.now()}`,
            type,
            x: 50 + (canvasElements.length % 5) * 40,
            y: 50 + (canvasElements.length % 5) * 40,
            width: type === 'KPI_CARD' || type === 'SLICER' ? 220 : type === 'DATE_RANGE' ? 300 : type === 'TEXT' ? 400 : 380,
            height: type === 'KPI_CARD' || type === 'SLICER' || type === 'DATE_RANGE' ? 90 : type === 'TEXT' ? 70 : 280,
            title: `Grafik ${type}`,
            dimension: availableColumns[0] || 'machine',
            metric: numericColumns[0] || 'actualQty',
            aggregation: 'SUM',
            color: '#714B67',
            textContent: type === 'TEXT' ? 'Tulis teks catatan di sini...' : '',
            fontSize: 14,
            prefix: '',
            suffix: ''
        };
        setCanvasElements([...canvasElements, newEl]);
        setSelectedElementId(newEl.id);
        toast.success(`Visual ${type} ditambahkan!`);
    };

    const handleDeleteElement = (id) => {
        setCanvasElements(canvasElements.filter(el => el.id !== id));
        if (selectedElementId === id) setSelectedElementId(null);
    };

    const handleUpdateSelectedElement = (updates) => {
        if (!selectedElementId) return;
        setCanvasElements(canvasElements.map(el => el.id === selectedElementId ? { ...el, ...updates } : el));
    };

    // Load sample data
    const loadSampleData = () => {
        setDataSourceType('SAMPLE');
        setActiveDataset(SAMPLE_PRODUCTION_DATA);
        setDataSourceLabel('Manufacturing Telemetry (Sample)');
        setSourceName('Manufacturing Telemetry (Sample)');
        toast.success('Loaded sample dataset');
    };

    // Load App Table Data
    const loadAppTableData = async (tableId) => {
        if (!tableId) return;
        setDataSourceLoading(true);
        try {
            const recs = await getTableRecords(tableId);
            if (recs?.length > 0) {
                setDataSourceType('APP_TABLE');
                setActiveDataset(recs);
                const tbl = interactiveTables.find(t => t.id === tableId);
                const label = `App Table: ${tbl?.name || tableId}`;
                setDataSourceLabel(label);
                setSourceName(label);
                setSelectedTableId(tableId);
                toast.success(`Loaded ${recs.length} rows from ${tbl?.name}`);
            } else {
                toast.error('Table is empty');
            }
        } catch (e) {
            toast.error(e.message);
        } finally {
            setDataSourceLoading(false);
        }
    };

    // Load MES Table Data
    const loadMESTableData = async (tableId) => {
        if (!tableId) return;
        setDataSourceLoading(true);
        try {
            const { readMESTable, getMESTables } = await import('../utils/supabaseMESDB');
            const recs = await readMESTable(tableId, { limit: 500 });
            if (recs?.length > 0) {
                setDataSourceType('MES_TABLE');
                setActiveDataset(recs);
                const tbl = getMESTables().find(t => t.id === tableId);
                const label = `MES: ${tbl?.name || tableId}`;
                setDataSourceLabel(label);
                setSourceName(label);
                setSelectedMesTable(tableId);
                toast.success(`Loaded ${recs.length} rows from ${tbl?.name}`);
            } else {
                toast.error('Table is empty or not accessible');
            }
        } catch (e) {
            toast.error(e.message);
        } finally {
            setDataSourceLoading(false);
        }
    };

    // Load Connector Data
    const loadConnectorData = async () => {
        if (!selectedConnectorId || !selectedFunctionId) {
            toast.error('Select connector and function first');
            return;
        }
        setDataSourceLoading(true);
        try {
            const res = await executeConnector(selectedConnectorId, selectedFunctionId, {});
            const rows = Array.isArray(res) ? res : res?.rows || res?.data || [];
            if (rows.length > 0) {
                setDataSourceType('CONNECTOR');
                setActiveDataset(rows);
                const conn = availableConnectors.find(c => c.id === selectedConnectorId);
                const label = `Connector: ${conn?.name || selectedConnectorId}`;
                setDataSourceLabel(label);
                setSourceName(label);
                toast.success(`Loaded ${rows.length} rows from connector`);
            } else {
                toast.error('No data returned from connector');
            }
        } catch (e) {
            toast.error(e.message);
        } finally {
            setDataSourceLoading(false);
        }
    };

    // ─── POWER BI FEATURE: SQL & QUERY RUNNER ────────────────────────
    const executeSqlQuery = () => {
        try {
            // Simulated SQL Engine over in-memory dataset
            const lowerSql = sqlQuery.toLowerCase();
            let result = [...activeDataset];

            // Filter
            if (lowerSql.includes('where')) {
                const match = sqlQuery.match(/where\s+([^group|order]+)/i);
                if (match && match[1]) {
                    const cond = match[1].trim();
                    // Basic keyword filtering
                    result = result.filter(r => {
                        try {
                            const fn = new Function(...Object.keys(r), `return (${cond});`);
                            return fn(...Object.values(r));
                        } catch {
                            return true;
                        }
                    });
                }
            }

            // Group By
            if (lowerSql.includes('group by')) {
                const groupMatch = sqlQuery.match(/group\s+by\s+([^\s,;]+)/i);
                if (groupMatch && groupMatch[1]) {
                    const groupCol = groupMatch[1].trim();
                    const groups = {};
                    result.forEach(r => {
                        const key = r[groupCol] || 'N/A';
                        if (!groups[key]) groups[key] = { [groupCol]: key, count: 0, sum_actual: 0, sum_good: 0, sum_reject: 0 };
                        groups[key].count += 1;
                        groups[key].sum_actual += Number(r.actualQty) || 0;
                        groups[key].sum_good += Number(r.goodQty) || 0;
                        groups[key].sum_reject += Number(r.rejectQty) || 0;
                    });
                    result = Object.values(groups);
                }
            }

            setQueryResult(result);
            toast.success(`Query executed: ${result.length} rows returned!`, { icon: '⚡' });
        } catch (e) {
            toast.error(`Query Error: ${e.message}`);
        }
    };

    // Set Query Result as Active Dataset
    const applyQueryResultToCanvas = () => {
        if (!queryResult || queryResult.length === 0) {
            toast.error('Run query first to produce records');
            return;
        }
        setActiveDataset(queryResult);
        setDataSourceType('CUSTOM_QUERY');
        setDataSourceLabel(`SQL Query Output (${queryResult.length} rows)`);
        setSourceName(`SQL Query (${queryResult.length} rows)`);
        setActiveTab('CANVAS');
        toast.success('Query dataset linked to Canvas visuals!', { icon: '🎯' });
    };

    // Add Calculated DAX Measure
    const handleAddMeasure = () => {
        if (!newMeasureName.trim() || !newMeasureExpr.trim()) {
            toast.error('Name and formula are required');
            return;
        }
        const col = {
            name: newMeasureName.trim(),
            label: newMeasureName.trim(),
            expression: newMeasureExpr.trim()
        };
        setCalculatedColumns([...calculatedColumns, col]);
        setNewMeasureName('');
        setNewMeasureExpr('');
        setShowMeasureModal(false);
        toast.success(`Calculated Column [${col.name}] created!`, { icon: '🧮' });
    };

    // ─── DASHBOARD MANAGEMENT FUNCTIONS ───────────────────────────────
    const loadDashboardList = async () => {
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('dashboards')
                .select('id, name, description, layout, created_at, updated_at')
                .order('updated_at', { ascending: false });
            if (error) throw error;
            setDashboardList(data || []);
        } catch (e) {
            console.error('[BI Studio] Failed to load dashboards:', e);
        }
    };

    useEffect(() => {
        loadDashboardList();
    }, []);

    const saveDashboard = async (publish = false) => {
        if (!currentDashboardName.trim()) {
            toast.error('Dashboard name is required');
            return;
        }
        setDashboardSaving(true);
        try {
            const supabase = getSupabaseClient();
            const layoutData = canvasElements.map(el => ({
                id: el.id,
                type: el.type,
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
                title: el.title,
                dimension: el.dimension,
                metric: el.metric,
                aggregation: el.aggregation,
                color: el.color,
                textContent: el.textContent,
                fontSize: el.fontSize,
                bgColor: el.bgColor,
                prefix: el.prefix,
                suffix: el.suffix,
                metrics: el.metrics
            }));

            const payload = {
                name: currentDashboardName,
                description: currentDashboardDesc,
                layout: layoutData,
                updated_at: new Date().toISOString()
            };

            if (currentDashboardId) {
                const { error } = await supabase
                    .from('dashboards')
                    .update(payload)
                    .eq('id', currentDashboardId);
                if (error) throw error;
            } else {
                payload.created_at = new Date().toISOString();
                const { data, error } = await supabase
                    .from('dashboards')
                    .insert(payload)
                    .select('id')
                    .single();
                if (error) throw error;
                setCurrentDashboardId(data.id);
            }

            setIsPublished(publish);
            toast.success(publish ? 'Dashboard published!' : 'Dashboard saved!');
            loadDashboardList();
        } catch (e) {
            toast.error(`Save failed: ${e.message}`);
        } finally {
            setDashboardSaving(false);
        }
    };

    const loadDashboard = async (dashboardId) => {
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('dashboards')
                .select('*')
                .eq('id', dashboardId)
                .single();
            if (error) throw error;

            setCurrentDashboardId(data.id);
            setCurrentDashboardName(data.name || 'Untitled');
            setCurrentDashboardDesc(data.description || '');
            setIsPublished(false);

            if (data.layout && Array.isArray(data.layout) && data.layout.length > 0) {
                const restored = data.layout.map(el => ({
                    ...el,
                    id: el.id || `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
                }));
                setCanvasElements(restored);
            }

            setShowDashboardManager(false);
            setActiveTab('CANVAS');
            toast.success(`Loaded: ${data.name}`);
        } catch (e) {
            toast.error(`Load failed: ${e.message}`);
        }
    };

    const deleteDashboard = async (dashboardId) => {
        if (!confirm('Delete this dashboard?')) return;
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase
                .from('dashboards')
                .delete()
                .eq('id', dashboardId);
            if (error) throw error;
            if (currentDashboardId === dashboardId) {
                setCurrentDashboardId(null);
                setCurrentDashboardName('Untitled Dashboard');
            }
            toast.success('Dashboard deleted');
            loadDashboardList();
        } catch (e) {
            toast.error(`Delete failed: ${e.message}`);
        }
    };

    const createNewDashboard = () => {
        setCurrentDashboardId(null);
        setCurrentDashboardName('New Dashboard');
        setCurrentDashboardDesc('');
        setIsPublished(false);
        setCanvasElements([
            { id: `el_${Date.now()}`, type: 'TEXT', x: 20, y: 20, width: 500, height: 60, title: 'Dashboard Title', textContent: 'My New Dashboard', fontSize: 18, color: '#714B67', bgColor: '#ffffff' }
        ]);
        setActiveTab('CANVAS');
        toast.success('New dashboard created');
    };

    const handleApplyTemplate = (tpl) => {
        setActiveDataset(tpl.dataset);
        setCalculatedColumns(tpl.calculatedColumns || []);
        setCanvasElements(tpl.elements);
        setCurrentDashboardName(tpl.name);
        setCurrentDashboardDesc(tpl.description);
        setSourceName(tpl.name);
        setDataSourceLabel(tpl.name);
        setCrossFilter(null);
        setCanvasSlicers({});
        setShowTemplatesModal(false);
        setActiveTab('CANVAS');
        toast.success(`Template "${tpl.name}" berhasil dimuat!`, { icon: '🎯' });
    };

    // ─── DRAG HANDLERS ────────────────────────────────────────────────
    const handleElementMouseDown = (e, el) => {
        e.stopPropagation();
        setSelectedElementId(el.id);
        setIsDragging(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / canvasScale;
        const mouseY = (e.clientY - rect.top) / canvasScale;
        setDragOffset({ x: mouseX - el.x, y: mouseY - el.y });
    };

    const handleCanvasMouseMove = (e) => {
        if (!isDragging || !selectedElementId) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / canvasScale;
        const mouseY = (e.clientY - rect.top) / canvasScale;

        // Snap to 10px grid
        const rawX = mouseX - dragOffset.x;
        const rawY = mouseY - dragOffset.y;
        const snappedX = Math.max(0, Math.round(rawX / 10) * 10);
        const snappedY = Math.max(0, Math.round(rawY / 10) * 10);

        setCanvasElements(canvasElements.map(el => el.id === selectedElementId ? { ...el, x: snappedX, y: snappedY } : el));
    };

    const handleCanvasMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: '#f1f5f9', fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#1e293b', overflow: 'hidden' }}>

            {/* ─── 1. TOP HEADER (MANDOR & POWER BI STYLE) ────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', backgroundColor: '#714B67', color: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#ffffff', color: '#714B67', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            M
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '0.98rem', letterSpacing: '0.3px' }}>MANDOR BI Studio</span>
                    </div>

                    {/* Mode Switcher Tabs */}
                    <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '6px', gap: '2px' }}>
                        <button
                            onClick={() => setActiveTab('CANVAS')}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '4px', border: 'none', backgroundColor: activeTab === 'CANVAS' ? '#ffffff' : 'transparent', color: activeTab === 'CANVAS' ? '#714B67' : '#e2e8f0', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            <Layout size={13} /> Visual Canvas Studio
                        </button>
                        <button
                            onClick={() => setActiveTab('QUERY_STUDIO')}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '4px', border: 'none', backgroundColor: activeTab === 'QUERY_STUDIO' ? '#ffffff' : 'transparent', color: activeTab === 'QUERY_STUDIO' ? '#714B67' : '#e2e8f0', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            <Terminal size={13} /> SQL & Query Studio
                        </button>
                        <button
                            onClick={() => setActiveTab('CONNECTOR_HUB')}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '4px', border: 'none', backgroundColor: activeTab === 'CONNECTOR_HUB' ? '#ffffff' : 'transparent', color: activeTab === 'CONNECTOR_HUB' ? '#714B67' : '#e2e8f0', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            <Link2 size={13} /> Data Source & ERP
                        </button>
                        <button
                            onClick={() => setActiveTab('DATA_PREVIEW')}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '4px', border: 'none', backgroundColor: activeTab === 'DATA_PREVIEW' ? '#ffffff' : 'transparent', color: activeTab === 'DATA_PREVIEW' ? '#714B67' : '#e2e8f0', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            <Database size={13} /> Data Grid ({filteredDataset.length})
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4ade80' }}></span>
                        {sourceName}
                    </div>

                    {/* Dashboard Name Input */}
                    <input
                        value={currentDashboardName}
                        onChange={(e) => setCurrentDashboardName(e.target.value)}
                        placeholder="Dashboard name..."
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '0.78rem', fontWeight: 600, width: '160px' }}
                    />

                    {/* New Dashboard */}
                    <button
                        onClick={createNewDashboard}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                        <Plus size={12} /> New
                    </button>

                    {/* Templates Button */}
                    <button
                        onClick={() => setShowTemplatesModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: '#f59e0b', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)' }}
                    >
                        <Sparkles size={12} /> Templates (4)
                    </button>

                    {/* Save */}
                    <button
                        onClick={() => saveDashboard(false)}
                        disabled={dashboardSaving}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: '#ffffff', color: '#714B67', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', opacity: dashboardSaving ? 0.6 : 1 }}
                    >
                        <Save size={12} /> {dashboardSaving ? 'Saving...' : 'Save'}
                    </button>

                    {/* Publish */}
                    <button
                        onClick={() => saveDashboard(true)}
                        disabled={dashboardSaving}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: isPublished ? '#16a34a' : '#f59e0b', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', opacity: dashboardSaving ? 0.6 : 1 }}
                    >
                        <Play size={12} /> {isPublished ? 'Published' : 'Publish'}
                    </button>

                    {/* My Dashboards */}
                    <button
                        onClick={() => { setShowDashboardManager(!showDashboardManager); loadDashboardList(); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: showDashboardManager ? '#ffffff' : 'rgba(255,255,255,0.15)', color: showDashboardManager ? '#714B67' : '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                        <Layers size={12} /> My Dashboards
                    </button>

                    <button
                        onClick={() => window.print()}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', backgroundColor: '#ffffff', color: '#714B67', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                        <Download size={13} /> Export PDF
                    </button>
                </div>
            </div>

            {/* ─── DASHBOARD MANAGER DROPDOWN ─────────────────────────── */}
            {showDashboardManager && (
                <div style={{ position: 'absolute', top: '52px', right: '16px', width: '380px', maxHeight: '480px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', backgroundColor: '#714B67', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Layers size={14} /> My Dashboards ({dashboardList.length})
                        </span>
                        <button onClick={() => setShowDashboardManager(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={14} /></button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                        {dashboardList.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                                <Layout size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                <div>Belum ada dashboard tersimpan.</div>
                                <button onClick={createNewDashboard} style={{ marginTop: '10px', padding: '6px 14px', borderRadius: '6px', backgroundColor: '#714B67', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                                    <Plus size={12} style={{ marginRight: '4px' }} /> Buat Dashboard Baru
                                </button>
                            </div>
                        ) : (
                            dashboardList.map(d => (
                                <div key={d.id} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '6px', cursor: 'pointer', backgroundColor: d.id === currentDashboardId ? '#f0fdf4' : '#fff', transition: 'all 0.15s' }}
                                    onClick={() => loadDashboard(d.id)}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#714B67'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>{d.name}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteDashboard(d.id); }}
                                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px' }}
                                            title="Delete"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    {d.description && (
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{d.description}</div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.65rem', color: '#94a3b8' }}>
                                        <span>{Array.isArray(d.layout) ? d.layout.length : 0} visuals</span>
                                        <span>{d.updated_at ? new Date(d.updated_at).toLocaleDateString() : '-'}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ─── 2. POWER BI STYLE CANVAS WORKSPACE ────────────────────── */}
            {activeTab === 'CANVAS' && (
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

                    {/* ── LEFT PANEL: VISUALIZATIONS PALETTE & FIELDS (POWER BI STYLE) ── */}
                    <div style={{ width: '270px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', zIndex: 10 }}>

                        {/* Visuals Palette */}
                        <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                📊 Visualizations Pane
                            </span>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', marginTop: '6px' }}>
                                {VISUAL_TYPES.map(vt => {
                                    const Icon = vt.icon;
                                    return (
                                        <button
                                            key={vt.type}
                                            onClick={() => handleAddCanvasElement(vt.type)}
                                            style={{
                                                padding: '6px 3px',
                                                borderRadius: '5px',
                                                border: '1px solid #e2e8f0',
                                                backgroundColor: '#f8fafc',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '3px',
                                                cursor: 'pointer',
                                                color: '#714B67',
                                                transition: 'all 0.15s ease'
                                            }}
                                            title={`Tambah ${vt.label}: ${vt.desc}`}
                                        >
                                            <Icon size={14} />
                                            <span style={{ fontSize: '0.58rem', fontWeight: 600, color: '#475569', textAlign: 'center', lineHeight: 1.1 }}>{vt.label.split(' ')[0]}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── DATA SOURCE SELECTOR ── */}
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                            <button
                                onClick={() => setShowDataSourcePanel(!showDataSourcePanel)}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#f0fdf4', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, color: '#166534' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Database size={12} /> Data Source
                                </span>
                                <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 500 }}>{dataSourceType}</span>
                            </button>

                            {showDataSourcePanel && (
                                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {/* Current Source */}
                                    <div style={{ fontSize: '0.65rem', color: '#64748b', padding: '3px 6px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                        {dataSourceLabel}
                                    </div>

                                    {/* Sample Data */}
                                    <button
                                        onClick={loadSampleData}
                                        style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: dataSourceType === 'SAMPLE' ? '#dcfce7' : '#fff', cursor: 'pointer', fontSize: '0.68rem', textAlign: 'left', fontWeight: 600, color: '#334155' }}
                                    >
                                        Demo / Sample Data
                                    </button>

                                    {/* App Tables */}
                                    <select
                                        value={selectedTableId}
                                        onChange={(e) => loadAppTableData(e.target.value)}
                                        style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.68rem', backgroundColor: '#fff', cursor: 'pointer' }}
                                    >
                                        <option value="">App Tables...</option>
                                        {interactiveTables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>

                                    {/* MES Tables */}
                                    <select
                                        value={selectedMesTable}
                                        onChange={(e) => loadMESTableData(e.target.value)}
                                        style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.68rem', backgroundColor: '#fff', cursor: 'pointer' }}
                                    >
                                        <option value="">MES Tables...</option>
                                        {[
                                            { id: 'machines', name: 'Machines' },
                                            { id: 'stations', name: 'Stations' },
                                            { id: 'completions', name: 'Completions' },
                                            { id: 'measurements', name: 'Measurements' },
                                            { id: 'production_queue', name: 'Production Queue' },
                                            { id: 'audit_logs', name: 'Audit Logs' },
                                            { id: 'player_sessions', name: 'Player Sessions' },
                                            { id: 'plc_tags', name: 'PLC Tags' },
                                        ].map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>

                                    {/* Connector Hub */}
                                    {availableConnectors.length > 0 && (
                                        <>
                                            <select
                                                value={selectedConnectorId}
                                                onChange={(e) => setSelectedConnectorId(e.target.value)}
                                                style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.68rem', backgroundColor: '#fff', cursor: 'pointer' }}
                                            >
                                                <option value="">Connector Hub...</option>
                                                {availableConnectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            {selectedConnectorId && (
                                                <button
                                                    onClick={loadConnectorData}
                                                    disabled={dataSourceLoading}
                                                    style={{ padding: '5px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#714B67', color: '#fff', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600, opacity: dataSourceLoading ? 0.6 : 1 }}
                                                >
                                                    {dataSourceLoading ? 'Loading...' : 'Pull Data'}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── POWER BI CALCULATED MEASURES / DAX SECTION ── */}
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                🧮 DAX Measures ({calculatedColumns.length})
                            </span>
                            <button
                                onClick={() => setShowMeasureModal(true)}
                                style={{ background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: '4px', color: '#714B67', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                                title="Buat Formula / Calculated Measure Baru"
                            >
                                <Plus size={10} /> Add fx
                            </button>
                        </div>

                        {/* Fields & Dataset Columns */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Data Fields ({availableColumns.length})
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {availableColumns.map(col => {
                                    const isNumeric = numericColumns.includes(col);
                                    const isCalc = calculatedColumns.some(c => c.name === col);

                                    return (
                                        <div
                                            key={col}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '4px 6px',
                                                borderRadius: '4px',
                                                backgroundColor: isCalc ? '#ecfdf5' : isNumeric ? '#f3e8ff' : '#f8fafc',
                                                border: '1px solid',
                                                borderColor: isCalc ? '#a7f3d0' : isNumeric ? '#e9d5ff' : '#e2e8f0',
                                                fontSize: '0.72rem',
                                                color: isCalc ? '#047857' : isNumeric ? '#714B67' : '#334155',
                                                fontWeight: isCalc || isNumeric ? 700 : 500
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {isCalc ? (
                                                    <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#059669', fontFamily: 'monospace' }}>fx</span>
                                                ) : isNumeric ? (
                                                    <Hash size={11} color="#714B67" />
                                                ) : (
                                                    <AlignLeft size={11} color="#64748b" />
                                                )}
                                                <span>{col}</span>
                                            </div>
                                            {isCalc && (
                                                <button
                                                    onClick={() => setCalculatedColumns(calculatedColumns.filter(c => c.name !== col))}
                                                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '1px' }}
                                                    title="Hapus Calculated Column"
                                                >
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── CENTER WORKSPACE: SLICING BAR & CANVAS ── */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

                        {/* ── POWER BI ACTIVE CROSS-FILTER BANNER ── */}
                        {crossFilter && (
                            <div style={{ backgroundColor: '#fef3c7', borderBottom: '1px solid #fde68a', padding: '6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 15, animation: 'fadeIn 0.2s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#92400e', fontWeight: 700 }}>
                                    <MousePointerClick size={14} className="animate-pulse" />
                                    <span>⚡ Active Cross-Filter:</span>
                                    <span style={{ backgroundColor: '#fde68a', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', color: '#78350f' }}>
                                        {crossFilter.field} = "{crossFilter.value}"
                                    </span>
                                    <span style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 500 }}>
                                        (Filtered from {crossFilter.sourceVisual})
                                    </span>
                                </div>
                                <button
                                    onClick={() => setCrossFilter(null)}
                                    style={{ background: '#d97706', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                                >
                                    <X size={11} /> Clear Slicing
                                </button>
                            </div>
                        )}

                        {/* Main Canvas Scroll Area */}
                        <div
                            style={{
                                flex: 1,
                                overflow: 'auto',
                                backgroundColor: '#e2e8f0',
                                position: 'relative',
                                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                                backgroundSize: '20px 20px',
                                cursor: isDragging ? 'grabbing' : 'default'
                            }}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onClick={() => setSelectedElementId(null)}
                        >
                            <div
                                ref={canvasRef}
                                style={{
                                    width: '1420px',
                                    minHeight: '920px',
                                    margin: '20px auto',
                                    backgroundColor: '#ffffff',
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                    borderRadius: '8px',
                                    position: 'relative',
                                    transform: `scale(${canvasScale})`,
                                    transformOrigin: 'top center',
                                    transition: isDragging ? 'none' : 'transform 0.1s ease'
                                }}
                            >
                                {canvasElements.map(el => {
                                    const isSelected = el.id === selectedElementId;

                                    return (
                                        <div
                                            key={el.id}
                                            onMouseDown={(e) => handleElementMouseDown(e, el)}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                position: 'absolute',
                                                left: `${el.x}px`,
                                                top: `${el.y}px`,
                                                width: `${el.width}px`,
                                                height: `${el.height}px`,
                                                backgroundColor: el.bgColor || '#ffffff',
                                                border: isSelected ? '2px solid #714B67' : '1px solid #e2e8f0',
                                                borderRadius: '6px',
                                                boxShadow: isSelected ? '0 8px 20px rgba(113,75,103,0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                                                cursor: 'move',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden',
                                                userSelect: 'none',
                                                zIndex: isSelected ? 20 : 5
                                            }}
                                        >
                                            {/* Element Header */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', backgroundColor: isSelected ? '#714B67' : '#fafbfc', color: isSelected ? '#ffffff' : '#334155', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {el.title || el.type}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteElement(el.id); }}
                                                        style={{ background: 'none', border: 'none', color: isSelected ? '#ffffff' : '#94a3b8', cursor: 'pointer', padding: '1px' }}
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Element Body */}
                                            <div style={{ flex: 1, padding: '6px', overflow: 'hidden', position: 'relative' }}>
                                                {el.type === 'TEXT' ? (
                                                    <div style={{ fontSize: `${el.fontSize || 14}px`, color: el.color || '#1e293b', fontWeight: 600 }}>
                                                        {el.textContent || el.title}
                                                    </div>
                                                ) : el.type === 'KPI_CARD' ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: el.color || '#714B67' }}>
                                                            {el.prefix || ''}{calculateKpiValue(el)}{el.suffix || ''}
                                                        </div>
                                                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                                                            {el.aggregation || 'SUM'} of {el.metric || 'Data'}
                                                        </div>
                                                    </div>
                                                ) : el.type === 'SLICER' ? (
                                                    /* INTERACTIVE SLICER */
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', height: '100%', justifyContent: 'center' }}>
                                                        <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700 }}>PILIH {el.dimension?.toUpperCase()}:</span>
                                                        <select
                                                            value={canvasSlicers[el.dimension] || 'ALL'}
                                                            onChange={(e) => setCanvasSlicers({ ...canvasSlicers, [el.dimension]: e.target.value })}
                                                            style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1.5px solid #714B67', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#f8fafc', color: '#714B67' }}
                                                        >
                                                            <option value="ALL">-- SEMUA ({el.dimension}) --</option>
                                                            {Array.from(new Set(activeDataset.map(r => r[el.dimension]).filter(Boolean))).map(val => (
                                                                <option key={val} value={val}>{val}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <ReactECharts
                                                        option={getChartOption(el)}
                                                        style={{ height: '100%', width: '100%' }}
                                                        notMerge={true}
                                                        lazyUpdate={true}
                                                        onEvents={{
                                                            click: (params) => handleChartClick(params, el)
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── POWER BI MULTI-PAGE TAB BAR (BOTTOM) ── */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', zIndex: 15 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {pages.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setActivePageId(p.id)}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '4px 4px 0 0',
                                            border: '1px solid #e2e8f0',
                                            borderBottom: p.id === activePageId ? '2px solid #714B67' : '1px solid #e2e8f0',
                                            backgroundColor: p.id === activePageId ? '#f3e8ff' : '#f8fafc',
                                            color: p.id === activePageId ? '#714B67' : '#64748b',
                                            fontWeight: p.id === activePageId ? 800 : 500,
                                            fontSize: '0.72rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        const newPage = { id: `page_${Date.now()}`, name: `Page ${pages.length + 1}` };
                                        setPages([...pages, newPage]);
                                        setActivePageId(newPage.id);
                                        toast.success(`Halaman baru ${newPage.name} dibuat!`);
                                    }}
                                    style={{ padding: '3px 8px', borderRadius: '4px', border: '1px dashed #cbd5e1', backgroundColor: 'transparent', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                                >
                                    <Plus size={11} /> Page
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: '#64748b' }}>
                                <span>Zoom:</span>
                                <button onClick={() => setCanvasScale(Math.max(0.6, canvasScale - 0.1))} style={{ padding: '2px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', background: '#fff', cursor: 'pointer' }}>-</button>
                                <span>{Math.round(canvasScale * 100)}%</span>
                                <button onClick={() => setCanvasScale(Math.min(1.4, canvasScale + 0.1))} style={{ padding: '2px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', background: '#fff', cursor: 'pointer' }}>+</button>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT PANEL: VISUAL FORMATTING & BINDINGS (POWER BI STYLE) ── */}
                    {selectedElement ? (
                        <div style={{ width: '280px', backgroundColor: '#ffffff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                            <div style={{ padding: '10px 14px', backgroundColor: '#714B67', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>⚙️ Visual Settings</span>
                                <button onClick={() => setSelectedElementId(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={14} /></button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Judul Visual</label>
                                    <input
                                        type="text"
                                        value={selectedElement.title || ''}
                                        onChange={(e) => handleUpdateSelectedElement({ title: e.target.value })}
                                        style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '3px' }}
                                    />
                                </div>

                                {selectedElement.type !== 'TEXT' && (
                                    <>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Category / Dimension (X-Axis)</label>
                                            <select
                                                value={selectedElement.dimension || ''}
                                                onChange={(e) => handleUpdateSelectedElement({ dimension: e.target.value })}
                                                style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '3px' }}
                                            >
                                                {availableColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>

                                        {selectedElement.type !== 'SLICER' && (
                                            <>
                                                <div>
                                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Values / Metric (Y-Axis)</label>
                                                    <select
                                                        value={selectedElement.metric || ''}
                                                        onChange={(e) => handleUpdateSelectedElement({ metric: e.target.value })}
                                                        style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '3px' }}
                                                    >
                                                        {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Aggregation Function</label>
                                                    <select
                                                        value={selectedElement.aggregation || 'SUM'}
                                                        onChange={(e) => handleUpdateSelectedElement({ aggregation: e.target.value })}
                                                        style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '3px' }}
                                                    >
                                                        <option value="SUM">SUM (Penjumlahan)</option>
                                                        <option value="AVG">AVG (Rata-Rata)</option>
                                                        <option value="COUNT">COUNT (Hitung Baris)</option>
                                                        <option value="PERCENT">PERCENT Yield (%)</option>
                                                        <option value="MAX">MAX (Maksimal)</option>
                                                        <option value="MIN">MIN (Minimal)</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}

                                {selectedElement.type === 'TEXT' && (
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Isi Teks</label>
                                        <textarea
                                            value={selectedElement.textContent || ''}
                                            onChange={(e) => handleUpdateSelectedElement({ textContent: e.target.value })}
                                            rows={3}
                                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '3px' }}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Lebar (px)</label>
                                        <input
                                            type="number"
                                            value={selectedElement.width || 300}
                                            onChange={(e) => handleUpdateSelectedElement({ width: Number(e.target.value) || 200 })}
                                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '3px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Tinggi (px)</label>
                                        <input
                                            type="number"
                                            value={selectedElement.height || 200}
                                            onChange={(e) => handleUpdateSelectedElement({ height: Number(e.target.value) || 150 })}
                                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '3px' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Warna Aksen</label>
                                    <input
                                        type="color"
                                        value={selectedElement.color || '#714B67'}
                                        onChange={(e) => handleUpdateSelectedElement({ color: e.target.value })}
                                        style={{ width: '100%', height: '32px', padding: '2px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', marginTop: '3px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ width: '260px', backgroundColor: '#ffffff', borderLeft: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#94a3b8' }}>
                            <Layout size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Klik elemen di Canvas untuk mengedit konfigurasi visual.</span>
                        </div>
                    )}
                </div>
            )}

            {/* ─── 3. POWER BI SQL & QUERY STUDIO TAB ───────────────────────── */}
            {activeTab === 'QUERY_STUDIO' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc' }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ backgroundColor: '#f3e8ff', padding: '6px', borderRadius: '6px', color: '#714B67' }}><Terminal size={18} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>SQL Query & Data Modeling Studio</h4>
                                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Tulis query agregasi atau gabungkan (JOIN) tabel database untuk menghasilkan dataset BI</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={executeSqlQuery}
                                    style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#714B67', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                    <Play size={13} /> Run SQL Query
                                </button>
                                {queryResult && (
                                    <button
                                        onClick={applyQueryResultToCanvas}
                                        style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#16a34a', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <CheckCircle size={13} /> Set as Canvas Dataset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* SQL Editor Area */}
                        <div style={{ position: 'relative' }}>
                            <textarea
                                value={sqlQuery}
                                onChange={(e) => setSqlQuery(e.target.value)}
                                rows={6}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: '1.5px solid #cbd5e1',
                                    backgroundColor: '#0f172a',
                                    color: '#38bdf8',
                                    fontFamily: 'monospace',
                                    fontSize: '0.82rem',
                                    lineHeight: 1.4
                                }}
                            />
                        </div>

                        {/* Pre-built SQL Templates */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>Templates:</span>
                            {[
                                { label: 'Output per Machine', q: 'SELECT machine, SUM(actualQty) as total_actual, SUM(goodQty) as total_good FROM dataset GROUP BY machine' },
                                { label: 'Defect Analysis', q: 'SELECT defectType, SUM(rejectQty) as rejects FROM dataset GROUP BY defectType ORDER BY rejects DESC' },
                                { label: 'Shift Performance', q: 'SELECT shift, SUM(actualQty) as output, AVG(cycleTime) as avg_ct FROM dataset GROUP BY shift' }
                            ].map((tpl, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSqlQuery(tpl.q)}
                                    style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontSize: '0.68rem', color: '#334155', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    {tpl.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Query Execution Result Grid */}
                    {queryResult && (
                        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>
                                    ⚡ Query Result ({queryResult.length} rows)
                                </span>
                            </div>

                            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '350px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#714B67', color: '#ffffff' }}>
                                            {Object.keys(queryResult[0] || {}).map(k => <th key={k} style={{ padding: '6px 10px', textAlign: 'left' }}>{k}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {queryResult.map((row, idx) => (
                                            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                                {Object.values(row).map((val, i) => <td key={i} style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9' }}>{String(val)}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── 4. CONNECTOR HUB TAB ─────────────────────────────────── */}
            {activeTab === 'CONNECTOR_HUB' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ backgroundColor: '#eff6ff', padding: '6px', borderRadius: '6px', color: '#3b82f6' }}><Database size={18} /></div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Interactive App Tables (MANDOR Core)</h4>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Tabel data dinamis dari AppBuilder</span>
                            </div>
                        </div>
                        <select
                            value={selectedTableId}
                            onChange={(e) => setSelectedTableId(e.target.value)}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                        >
                            <option value="">-- Pilih Tabel Interaktif --</option>
                            {interactiveTables.map(t => <option key={t.id} value={t.id}>{t.name} ({t.id})</option>)}
                        </select>
                        <button
                            onClick={async () => {
                                if (!selectedTableId) return;
                                try {
                                    const recs = await getTableRecords(selectedTableId);
                                    if (recs?.length > 0) {
                                        setActiveDataset(recs);
                                        const tbl = interactiveTables.find(t => t.id === selectedTableId);
                                        setSourceName(`App Table: ${tbl?.name}`);
                                        toast.success(`Berhasil load ${recs.length} baris!`);
                                    }
                                } catch (e) { toast.error(e.message); }
                            }}
                            style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                        >
                            ⚡ Hubungkan & Tarik Data Tabel
                        </button>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ backgroundColor: '#f3e8ff', padding: '6px', borderRadius: '6px', color: '#714B67' }}><Link2 size={18} /></div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Connector Hub (ERP / SAP / SQL / REST)</h4>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Tarik data dari ERP external</span>
                            </div>
                        </div>
                        <select
                            value={selectedConnectorId}
                            onChange={(e) => setSelectedConnectorId(e.target.value)}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                        >
                            <option value="">-- Pilih Connector ERP --</option>
                            {availableConnectors.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                        </select>
                        <button
                            onClick={async () => {
                                if (!selectedConnectorId || !selectedFunctionId) return;
                                try {
                                    setConnectorLoading(true);
                                    const res = await executeConnector(selectedConnectorId, selectedFunctionId, {});
                                    setConnectorLoading(false);
                                    const rows = Array.isArray(res) ? res : res?.rows || res?.data || [];
                                    if (rows.length > 0) {
                                        setActiveDataset(rows);
                                        setSourceName(`Connector: ${selectedConnectorId}`);
                                        toast.success(`Berhasil menarik ${rows.length} data ERP!`);
                                    }
                                } catch (e) { setConnectorLoading(false); toast.error(e.message); }
                            }}
                            style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#714B67', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                        >
                            {connectorLoading ? '⏳ Mengambil Data ERP...' : '⚡ Eksekusi Connector & Sinkronkan ke Canvas'}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── 5. RAW DATA GRID TAB ─────────────────────────────────── */}
            {activeTab === 'DATA_PREVIEW' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: '#ffffff', margin: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Data Grid ({filteredDataset.length} rows)</h3>
                    </div>
                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '500px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#714B67', color: '#ffffff' }}>
                                    {availableColumns.map(k => <th key={k} style={{ padding: '8px 12px' }}>{k}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDataset.slice(0, 50).map((row, idx) => (
                                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                        {availableColumns.map((c, i) => <td key={i} style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>{String(row[c] ?? '')}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── DAX / CALCULATED MEASURE MODAL ────────────────────────── */}
            {showMeasureModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', width: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#714B67', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calculator size={16} /> New DAX Calculated Measure
                            </span>
                            <button onClick={() => setShowMeasureModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Column / Measure Name</label>
                            <input
                                value={newMeasureName}
                                onChange={(e) => setNewMeasureName(e.target.value)}
                                placeholder="e.g. scrapCost, defectRate"
                                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', marginTop: '3px' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Formula Expression (JS / Math)</label>
                            <input
                                value={newMeasureExpr}
                                onChange={(e) => setNewMeasureExpr(e.target.value)}
                                placeholder="e.g. (rejectQty / actualQty) * 100"
                                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontFamily: 'monospace', marginTop: '3px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Quick Fields:</span>
                            {numericColumns.map(nc => (
                                <button
                                    key={nc}
                                    onClick={() => setNewMeasureExpr(prev => `${prev} ${nc}`)}
                                    style={{ padding: '2px 5px', fontSize: '0.62rem', borderRadius: '3px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                                >
                                    +{nc}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                            <button onClick={() => setShowMeasureModal(false)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleAddMeasure} style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', background: '#714B67', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Save Measure</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── INDUSTRIAL TEMPLATES MODAL ─────────────────────────── */}
            {showTemplatesModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '900px', maxWidth: '95vw', maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '16px 20px', backgroundColor: '#714B67', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Sparkles size={18} style={{ color: '#fde047' }} />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Pilih Template Dashboard Industri</h3>
                                    <span style={{ fontSize: '0.72rem', color: '#f3e8ff' }}>Template Power BI-grade siap pakai lengkap dengan dataset, KPIs, dan visualisasi</span>
                                </div>
                            </div>
                            <button onClick={() => setShowTemplatesModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
                        </div>

                        {/* Templates Grid */}
                        <div style={{ padding: '20px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px', backgroundColor: '#f8fafc' }}>
                            {DASHBOARD_TEMPLATES.map(tpl => (
                                <div
                                    key={tpl.id}
                                    style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '10px',
                                        border: `1.5px solid ${tpl.color}33`,
                                        padding: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.62rem', fontWeight: 900, padding: '2px 8px', borderRadius: '20px', backgroundColor: `${tpl.color}15`, color: tpl.color, border: `1px solid ${tpl.color}44` }}>
                                                {tpl.badge}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{tpl.category}</span>
                                        </div>

                                        <h4 style={{ margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                                            {tpl.name}
                                        </h4>

                                        <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b', lineHeight: 1.4 }}>
                                            {tpl.description}
                                        </p>

                                        {/* Previews / Features */}
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                            {tpl.elements.slice(1, 6).map(el => (
                                                <span key={el.id} style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                                                    {el.type}: {el.title.slice(0, 18)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleApplyTemplate(tpl)}
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            backgroundColor: tpl.color,
                                            color: '#ffffff',
                                            fontWeight: 800,
                                            fontSize: '0.78rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            boxShadow: `0 2px 8px ${tpl.color}44`
                                        }}
                                    >
                                        <Zap size={13} /> Gunakan Template Ini
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
