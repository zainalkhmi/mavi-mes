import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  Layers,
  ArrowLeft,
  ChevronRight,
  Database,
  Sliders,
  Check,
  X,
  FileText,
  Eye,
  SlidersHorizontal,
  Info,
  Calendar,
  Sparkles,
  Download
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// Default initial state matching Tulip reference image 1:1
const INITIAL_CELLS = [
  { id: 'cell-1', name: 'ROTOR ASSEMBLY', complete: 582, target: 640, defects: 24, statusColor: '#84cc16' },
  { id: 'cell-2', name: 'ENDBELL ASSEMBLY', complete: 518, target: 640, defects: 22, statusColor: '#84cc16' },
  { id: 'cell-3', name: 'HOUSING ASSEMBLY', complete: 503, target: 640, defects: 9, statusColor: '#84cc16' },
  { id: 'cell-4', name: 'MOTOR ASSEMBLY', complete: 306, target: 512, defects: 0, statusColor: '#84cc16' },
  { id: 'cell-5', name: 'FINAL INSPECTION', complete: 253, target: 768, defects: 0, statusColor: '#ef4444' },
  { id: 'cell-6', name: 'SHIPPING', complete: 198, target: 768, defects: 0, statusColor: '#ef4444' }
];

const INITIAL_CELL_LOADING = [
  { cell: '0-Endbell Assembly', qty: 518 },
  { cell: '0-Housing Assembly', qty: 72 },
  { cell: '0-Housing Assembly (2)', qty: 503 },
  { cell: '2-Motor Assembly', qty: 612 },
  { cell: '2-Motor Assembly (2)', qty: 105 },
  { cell: 'Shipping', qty: 480 },
  { cell: 'Shipping (2)', qty: 65 }
];

const INITIAL_DOWNTIME = [
  { cell: 'Shipping', minutes: 666, formatted: '11:06:40', reason: 'Packaging machine jam & labeler error' },
  { cell: 'Motor Assembly', minutes: 166, formatted: '02:46:40', reason: 'Torque tool calibration timeout' },
  { cell: 'Endbell Assembly', minutes: 30, formatted: '00:30:00', reason: 'Material stockout at feeder' },
  { cell: 'Housing Assembly', minutes: 15, formatted: '00:15:00', reason: 'Station fixture adjustment' }
];

const INITIAL_ORDERS_STATUS = [
  { status: 'DELIVERED', count: 198, color: '#84cc16' },
  { status: 'IN PROGRESS', count: 370, color: '#0ea5e9' },
  { status: 'RELEASED', count: 460, color: '#6b7280' }
];

const INITIAL_WIP = [
  { part: 'EB1', qty: 95 },
  { part: 'Housing1', qty: 1000 },
  { part: 'HousingAsy1', qty: 85 },
  { part: 'MOT1', qty: 120 },
  { part: 'MOT2', qty: 190 },
  { part: 'ROT1', qty: 45 },
  { part: 'ROT2', qty: 80 }
];

export default function ProductionPlantDashboard({ embedded = false }) {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState('dashboard'); // 'dashboard' | 'input'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDowntimeModal, setShowDowntimeModal] = useState(false);

  // Core Data States
  const [cells, setCells] = useState(INITIAL_CELLS);
  const [ordersDueToday, setOrdersDueToday] = useState(56);
  const [backlogDueToday, setBacklogDueToday] = useState(839);
  const [completedToday, setCompletedToday] = useState(198);
  const [cellLoadingData, setCellLoadingData] = useState(INITIAL_CELL_LOADING);
  const [downtimeData, setDowntimeData] = useState(INITIAL_DOWNTIME);
  const [orderStatusData, setOrderStatusData] = useState(INITIAL_ORDERS_STATUS);
  const [wipData, setWipData] = useState(INITIAL_WIP);

  // Form Input States (Shopfloor Entry)
  const [selectedCellId, setSelectedCellId] = useState(INITIAL_CELLS[0].id);
  const [inputComplete, setInputComplete] = useState(INITIAL_CELLS[0].complete);
  const [inputTarget, setInputTarget] = useState(INITIAL_CELLS[0].target);
  const [inputDefects, setInputDefects] = useState(INITIAL_CELLS[0].defects);

  const [downtimeCell, setDowntimeCell] = useState('Shipping');
  const [downtimeMinutesInput, setDowntimeMinutesInput] = useState(45);
  const [downtimeReasonInput, setDowntimeReasonInput] = useState('Material feeder jam');

  const [newWipPart, setNewWipPart] = useState('');
  const [newWipQty, setNewWipQty] = useState('');

  // Total Downtime formatted computation
  const totalDowntimeFormatted = useMemo(() => {
    const totalMins = downtimeData.reduce((acc, curr) => acc + curr.minutes, 0);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const secs = 50; // Reference aesthetic seconds
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [downtimeData]);

  // Pareto Cumulative Percent Calculation
  const paretoData = useMemo(() => {
    const sorted = [...downtimeData].sort((a, b) => b.minutes - a.minutes);
    const totalMinutes = sorted.reduce((sum, item) => sum + item.minutes, 0) || 1;
    let runningSum = 0;
    return sorted.map(item => {
      runningSum += item.minutes;
      return {
        ...item,
        cumPct: Math.min(100, Math.round((runningSum / totalMinutes) * 100))
      };
    });
  }, [downtimeData]);

  // Synchronize input fields when cell selection changes
  useEffect(() => {
    const cell = cells.find(c => c.id === selectedCellId);
    if (cell) {
      setInputComplete(cell.complete);
      setInputTarget(cell.target);
      setInputDefects(cell.defects);
    }
  }, [selectedCellId, cells]);

  // Handlers for Data Input
  const handleUpdateCell = (e) => {
    e.preventDefault();
    setCells(prev => prev.map(c => {
      if (c.id === selectedCellId) {
        const comp = parseInt(inputComplete, 10) || 0;
        const targ = parseInt(inputTarget, 10) || 1;
        const def = parseInt(inputDefects, 10) || 0;
        const statusColor = (comp / targ) >= 0.5 ? '#84cc16' : '#ef4444';
        return { ...c, complete: comp, target: targ, defects: def, statusColor };
      }
      return c;
    }));
    toast.success('Cell metrics updated successfully!');
  };

  const handleAddDowntimeEvent = (e) => {
    e.preventDefault();
    const mins = parseInt(downtimeMinutesInput, 10) || 0;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    const formatted = `${String(hrs).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:00`;

    setDowntimeData(prev => {
      const idx = prev.findIndex(item => item.cell.toLowerCase() === downtimeCell.toLowerCase());
      if (idx >= 0) {
        const updated = [...prev];
        const newTotalMins = updated[idx].minutes + mins;
        const nHrs = Math.floor(newTotalMins / 60);
        const nMins = newTotalMins % 60;
        updated[idx] = {
          ...updated[idx],
          minutes: newTotalMins,
          formatted: `${String(nHrs).padStart(2, '0')}:${String(nMins).padStart(2, '0')}:00`,
          reason: downtimeReasonInput
        };
        return updated;
      }
      return [...prev, { cell: downtimeCell, minutes: mins, formatted, reason: downtimeReasonInput }];
    });

    toast.success(`Downtime added to ${downtimeCell}`);
  };

  const handleResetToDefaults = () => {
    setCells(INITIAL_CELLS);
    setOrdersDueToday(56);
    setBacklogDueToday(839);
    setCompletedToday(198);
    setCellLoadingData(INITIAL_CELL_LOADING);
    setDowntimeData(INITIAL_DOWNTIME);
    setOrderStatusData(INITIAL_ORDERS_STATUS);
    setWipData(INITIAL_WIP);
    toast.success('Reset to Tulip reference preset data!');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0f1d',
      color: '#0f172a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      <Toaster position="top-right" />

      {/* TOP APPLICATION BAR */}
      <header style={{
        backgroundColor: '#070b14',
        borderBottom: '1px solid #1e293b',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left: Branding & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              backgroundColor: '#ffffff',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              color: '#0a0f1d',
              fontSize: '0.85rem'
            }}>
              🌷
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.04em', color: '#ffffff' }}>
              TULIP <span style={{ color: '#38bdf8', fontWeight: 400, fontSize: '0.9rem' }}>| MAVI MES</span>
            </span>
          </div>

          <div style={{ height: '24px', width: '1px', backgroundColor: '#334155' }} />

          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc' }}>
            Production Dashboard
          </h1>
        </div>

        {/* Right: Controls & Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Mode Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={() => setActiveMode('dashboard')}
              style={{
                background: activeMode === 'dashboard' ? '#3b82f6' : 'transparent',
                color: activeMode === 'dashboard' ? 'white' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '7px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <BarChart3 size={14} /> Live Dashboard
            </button>

            <button
              onClick={() => setActiveMode('input')}
              style={{
                background: activeMode === 'input' ? '#10b981' : 'transparent',
                color: activeMode === 'input' ? 'white' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '7px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <Edit3 size={14} /> Shopfloor Data Input
            </button>
          </div>

          <button
            onClick={handleResetToDefaults}
            title="Reset to Tulip Reference Preset"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} /> Reset Reference
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* ========================================================================= */}
        {/* VIEW 1: LIVE TULIP PRODUCTION DASHBOARD (1:1 PIXEL MATCH) */}
        {/* ========================================================================= */}
        {activeMode === 'dashboard' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '260px 1fr',
            gap: '16px',
            flex: 1,
            alignItems: 'start'
          }} className="plant-grid-responsive">
            
            {/* ── LEFT SIDEBAR: PLANT DASHBOARD & PRODUCTION CELLS ── */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Plant Dashboard Button Tab */}
              <div style={{
                border: '2px solid #0f172a',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: '#0f172a',
                cursor: 'pointer'
              }}>
                <BarChart3 size={18} color="#0f172a" />
                <span>Plant Dashboard</span>
              </div>

              {/* Production Cells Header */}
              <div>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '0.04em',
                  marginBottom: '8px'
                }}>
                  PRODUCTION CELLS
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.8fr',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: '#64748b',
                  textAlign: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{ textAlign: 'left' }}></div>
                  <div>COMPLETE</div>
                  <div>TARGET</div>
                  <div>DEFECTS</div>
                </div>

                {/* Cells List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cells.map(cell => (
                    <div
                      key={cell.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.8fr',
                        alignItems: 'center',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '4px',
                        gap: '4px'
                      }}
                    >
                      {/* Cell Name Badge */}
                      <div style={{
                        backgroundColor: cell.statusColor,
                        color: '#ffffff',
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        padding: '6px 4px',
                        borderRadius: '4px',
                        textAlign: 'center',
                        lineHeight: 1.1,
                        textTransform: 'uppercase',
                        minHeight: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {cell.name}
                      </div>

                      {/* Complete */}
                      <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                        {cell.complete}
                      </div>

                      {/* Target */}
                      <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                        {cell.target}
                      </div>

                      {/* Defects */}
                      <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: cell.defects > 0 ? '#0f172a' : '#94a3b8' }}>
                        {cell.defects}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT MAIN DASHBOARD WORKSPACE ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* TOP ROW: 4 KPI CARDS */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px'
              }} className="kpi-grid-responsive">
                
                {/* KPI 1: Orders Due Today */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em', marginBottom: '8px' }}>
                    ORDERS DUE TODAY
                  </div>
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                    {ordersDueToday}
                  </div>
                </div>

                {/* KPI 2: Backlog Due Today */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em', marginBottom: '8px' }}>
                    BACKLOG DUE TODAY
                  </div>
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                    {backlogDueToday}
                  </div>
                </div>

                {/* KPI 3: Completed Today */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em', marginBottom: '8px' }}>
                    COMPLETED TODAY
                  </div>
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                    {completedToday}
                  </div>
                </div>

                {/* KPI 4: Total Downtime */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em', marginBottom: '8px' }}>
                    TOTAL DOWNTIME
                  </div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                    {totalDowntimeFormatted}
                  </div>
                </div>

              </div>

              {/* MIDDLE ROW: 2 CHARTS (Cell Loading & Downtime Pareto) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }} className="chart-grid-responsive">
                
                {/* Chart 1: Cell Loading */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  minHeight: '260px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      Cell Loading
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>
                      <span style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', display: 'inline-block' }} />
                      QTY Required - Sum
                    </div>
                  </div>

                  {/* SVG Bar Chart for Cell Loading */}
                  <div style={{ height: '180px', width: '100%', position: 'relative' }}>
                    <svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      {[0, 40, 80, 120, 160].map((y, i) => (
                        <line key={i} x1="30" y1={y} x2="390" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      ))}
                      
                      {/* Y-Axis Labels */}
                      <text x="22" y="10" fontSize="8" fill="#94a3b8" textAnchor="end">700</text>
                      <text x="22" y="50" fontSize="8" fill="#94a3b8" textAnchor="end">500</text>
                      <text x="22" y="90" fontSize="8" fill="#94a3b8" textAnchor="end">300</text>
                      <text x="22" y="130" fontSize="8" fill="#94a3b8" textAnchor="end">100</text>
                      <text x="22" y="155" fontSize="8" fill="#94a3b8" textAnchor="end">0</text>

                      {/* Bars */}
                      {cellLoadingData.map((item, idx) => {
                        const maxVal = 700;
                        const barWidth = 32;
                        const spacing = (360 - (cellLoadingData.length * barWidth)) / (cellLoadingData.length + 1);
                        const x = 35 + spacing + idx * (barWidth + spacing);
                        const height = (item.qty / maxVal) * 140;
                        const y = 150 - height;

                        return (
                          <g key={idx}>
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={height}
                              fill="#4f81bd"
                              rx="1"
                            >
                              <title>{`${item.cell}: ${item.qty} units`}</title>
                            </rect>
                            <text
                              x={x + barWidth / 2}
                              y="158"
                              fontSize="6.5"
                              fill="#64748b"
                              textAnchor="middle"
                              style={{ transform: `rotate(0deg)`, overflow: 'hidden' }}
                            >
                              {item.cell.length > 10 ? item.cell.substring(0, 8) + '..' : item.cell}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                      Expression
                    </div>
                  </div>
                </div>

                {/* Chart 2: Downtime by Cell (Pareto Chart) */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  minHeight: '260px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      Downtime by Cell
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: '#475569' }}>
                        <span style={{ width: '8px', height: '8px', backgroundColor: '#d9381e', display: 'inline-block' }} /> Downtime
                        <span style={{ width: '8px', height: '2px', backgroundColor: '#eab308', display: 'inline-block', marginLeft: '4px' }} /> Porcentaje acumulado
                      </div>
                      <button
                        onClick={() => setShowDowntimeModal(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0f172a',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        Click to see detail <Search size={12} />
                      </button>
                    </div>
                  </div>

                  {/* SVG Pareto Combo Chart */}
                  <div style={{ height: '180px', width: '100%', position: 'relative' }}>
                    <svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      {[0, 35, 70, 105, 140].map((y, i) => (
                        <line key={i} x1="45" y1={y} x2="365" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      ))}

                      {/* Left Y-Axis (Time) */}
                      <text x="40" y="10" fontSize="7" fill="#94a3b8" textAnchor="end">11:06:40</text>
                      <text x="40" y="45" fontSize="7" fill="#94a3b8" textAnchor="end">08:20:00</text>
                      <text x="40" y="80" fontSize="7" fill="#94a3b8" textAnchor="end">05:33:20</text>
                      <text x="40" y="115" fontSize="7" fill="#94a3b8" textAnchor="end">02:46:40</text>
                      <text x="40" y="145" fontSize="7" fill="#94a3b8" textAnchor="end">00:00:00</text>

                      {/* Right Y-Axis (Percentage) */}
                      <text x="372" y="10" fontSize="7" fill="#94a3b8" textAnchor="start">100%</text>
                      <text x="372" y="45" fontSize="7" fill="#94a3b8" textAnchor="start">80%</text>
                      <text x="372" y="80" fontSize="7" fill="#94a3b8" textAnchor="start">60%</text>
                      <text x="372" y="115" fontSize="7" fill="#94a3b8" textAnchor="start">40%</text>
                      <text x="372" y="145" fontSize="7" fill="#94a3b8" textAnchor="start">0%</text>

                      {/* Bars */}
                      {paretoData.map((item, idx) => {
                        const maxMinutes = 700;
                        const barWidth = 36;
                        const x = 55 + idx * 75;
                        const height = (item.minutes / maxMinutes) * 135;
                        const y = 145 - height;

                        return (
                          <g key={idx}>
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={height}
                              fill="#d9381e"
                              rx="1"
                            >
                              <title>{`${item.cell}: ${item.formatted} (${item.cumPct}%)`}</title>
                            </rect>
                            <text
                              x={x + barWidth / 2}
                              y="155"
                              fontSize="7"
                              fill="#475569"
                              textAnchor="middle"
                            >
                              {item.cell.length > 10 ? item.cell.substring(0, 8) + '..' : item.cell}
                            </text>
                          </g>
                        );
                      })}

                      {/* Pareto Cumulative Line */}
                      <path
                        d={paretoData.reduce((acc, curr, idx) => {
                          const x = 55 + idx * 75 + 18;
                          const y = 145 - (curr.cumPct / 100) * 135;
                          return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }, '')}
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="2"
                      />

                      {/* Dots on line */}
                      {paretoData.map((item, idx) => {
                        const x = 55 + idx * 75 + 18;
                        const y = 145 - (item.cumPct / 100) * 135;
                        return (
                          <circle key={idx} cx={x} cy={y} r="3" fill="#ffffff" stroke="#eab308" strokeWidth="2" />
                        );
                      })}
                    </svg>
                    <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                      Station
                    </div>
                  </div>
                </div>

              </div>

              {/* BOTTOM ROW: 2 CHARTS (Today's Orders by Status & Work In Progress) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }} className="chart-grid-responsive">
                
                {/* Chart 3: Today's Orders by Status */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  minHeight: '260px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      Today's Orders by Status
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.68rem', color: '#475569', fontWeight: 700 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ width: '8px', height: '8px', backgroundColor: '#84cc16' }} /> DELIVERED
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ width: '8px', height: '8px', backgroundColor: '#0ea5e9' }} /> IN PROGRESS
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ width: '8px', height: '8px', backgroundColor: '#6b7280' }} /> RELEASED
                      </span>
                    </div>
                  </div>

                  {/* SVG Bar Chart for Orders Status */}
                  <div style={{ height: '180px', width: '100%', position: 'relative' }}>
                    <svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      {[0, 35, 70, 105, 140].map((y, i) => (
                        <line key={i} x1="30" y1={y} x2="390" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      ))}

                      {/* Y-Axis */}
                      <text x="22" y="10" fontSize="7" fill="#94a3b8" textAnchor="end">500</text>
                      <text x="22" y="45" fontSize="7" fill="#94a3b8" textAnchor="end">400</text>
                      <text x="22" y="80" fontSize="7" fill="#94a3b8" textAnchor="end">300</text>
                      <text x="22" y="115" fontSize="7" fill="#94a3b8" textAnchor="end">200</text>
                      <text x="22" y="145" fontSize="7" fill="#94a3b8" textAnchor="end">0</text>

                      {/* 3 Status Bars */}
                      {orderStatusData.map((item, idx) => {
                        const maxVal = 500;
                        const barWidth = 70;
                        const spacing = (360 - (3 * barWidth)) / 4;
                        const x = 30 + spacing + idx * (barWidth + spacing);
                        const height = (item.count / maxVal) * 135;
                        const y = 145 - height;

                        return (
                          <g key={idx}>
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={height}
                              fill={item.color}
                              rx="1"
                            >
                              <title>{`${item.status}: ${item.count} orders`}</title>
                            </rect>
                            <text
                              x={x + barWidth / 2}
                              y="155"
                              fontSize="7"
                              fill="#475569"
                              textAnchor="middle"
                              fontWeight="700"
                            >
                              {item.status}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                      Status
                    </div>
                  </div>
                </div>

                {/* Chart 4: Work In Progress (WIP) */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  minHeight: '260px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      Work In Progress
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>
                      <span style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', display: 'inline-block' }} />
                      QTY Avail - Sum
                    </div>
                  </div>

                  {/* SVG Bar Chart for WIP */}
                  <div style={{ height: '180px', width: '100%', position: 'relative' }}>
                    <svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      {[0, 30, 60, 90, 120, 145].map((y, i) => (
                        <line key={i} x1="30" y1={y} x2="390" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      ))}

                      {/* Y-Axis */}
                      <text x="22" y="10" fontSize="7" fill="#94a3b8" textAnchor="end">1000</text>
                      <text x="22" y="40" fontSize="7" fill="#94a3b8" textAnchor="end">800</text>
                      <text x="22" y="70" fontSize="7" fill="#94a3b8" textAnchor="end">600</text>
                      <text x="22" y="100" fontSize="7" fill="#94a3b8" textAnchor="end">400</text>
                      <text x="22" y="125" fontSize="7" fill="#94a3b8" textAnchor="end">200</text>
                      <text x="22" y="150" fontSize="7" fill="#94a3b8" textAnchor="end">0</text>

                      {/* Bars */}
                      {wipData.map((item, idx) => {
                        const maxVal = 1000;
                        const barWidth = 28;
                        const spacing = (360 - (wipData.length * barWidth)) / (wipData.length + 1);
                        const x = 30 + spacing + idx * (barWidth + spacing);
                        const height = (item.qty / maxVal) * 140;
                        const y = 145 - height;

                        return (
                          <g key={idx}>
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={height}
                              fill="#4f81bd"
                              rx="1"
                            >
                              <title>{`${item.part}: ${item.qty} units`}</title>
                            </rect>
                            <text
                              x={x + barWidth / 2}
                              y="155"
                              fontSize="6.5"
                              fill="#64748b"
                              textAnchor="middle"
                            >
                              {item.part}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                      Item Master ID
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: SHOPFLOOR DATA ENTRY & TERMINAL LOGGER (INTERACTIVE INPUT FORM) */
          /* ========================================================================= */
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                  Shopfloor Production & Cell Data Entry
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Input updates here to immediately drive and reflect on the Tulip Live Production Dashboard.
                </p>
              </div>
              <button
                onClick={() => setActiveMode('dashboard')}
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Eye size={16} /> Buka Tampilan Dashboard
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              
              {/* SECTION A: UPDATE CELL OUTPUT & DEFECTS */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#3b82f6" /> 1. Log Cell Progress & Defects
                </h3>

                <form onSubmit={handleUpdateCell} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Pilih Stasiun / Sel Produksi:
                    </label>
                    <select
                      value={selectedCellId}
                      onChange={e => setSelectedCellId(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                    >
                      {cells.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Complete:</label>
                      <input
                        type="number"
                        value={inputComplete}
                        onChange={e => setInputComplete(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Target:</label>
                      <input
                        type="number"
                        value={inputTarget}
                        onChange={e => setInputTarget(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>Defects:</label>
                      <input
                        type="number"
                        value={inputDefects}
                        onChange={e => setInputDefects(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    Simpan Output Sel
                  </button>
                </form>
              </div>

              {/* SECTION B: LOG DOWNTIME EVENT */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="#ef4444" /> 2. Log Downtime Event
                </h3>

                <form onSubmit={handleAddDowntimeEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Stasiun Yang Mengalami Downtime:
                    </label>
                    <select
                      value={downtimeCell}
                      onChange={e => setDowntimeCell(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                    >
                      <option value="Shipping">Shipping</option>
                      <option value="Motor Assembly">Motor Assembly</option>
                      <option value="Endbell Assembly">Endbell Assembly</option>
                      <option value="Housing Assembly">Housing Assembly</option>
                      <option value="Rotor Assembly">Rotor Assembly</option>
                      <option value="Final Inspection">Final Inspection</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Menit:</label>
                      <input
                        type="number"
                        value={downtimeMinutesInput}
                        onChange={e => setDowntimeMinutesInput(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Alasan / Root Cause:</label>
                      <input
                        type="text"
                        value={downtimeReasonInput}
                        onChange={e => setDowntimeReasonInput(e.target.value)}
                        placeholder="Contoh: Sensor feeder error"
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 500 }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    Tambah Log Downtime
                  </button>
                </form>
              </div>

              {/* SECTION C: KPI & ORDERS ADJUSTER */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={18} color="#10b981" /> 3. Adjust Plant KPIs & Orders
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Orders Due Today:</label>
                      <input
                        type="number"
                        value={ordersDueToday}
                        onChange={e => setOrdersDueToday(parseInt(e.target.value, 10) || 0)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Backlog Due Today:</label>
                      <input
                        type="number"
                        value={backlogDueToday}
                        onChange={e => setBacklogDueToday(parseInt(e.target.value, 10) || 0)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Completed Today:</label>
                    <input
                      type="number"
                      value={completedToday}
                      onChange={e => setCompletedToday(parseInt(e.target.value, 10) || 0)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                    />
                  </div>

                  <div style={{ background: '#e2e8f0', padding: '10px 12px', borderRadius: '8px', fontSize: '0.78rem', color: '#334155' }}>
                    💡 Setiap angka yang diubah otomatis terhubung dan menghitung ulang seluruh metrik di layar dashboard utama.
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* DOWNTIME DETAIL MODAL */}
      {showDowntimeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '650px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                  Downtime Log Details per Stasiun
                </h3>
              </div>
              <button
                onClick={() => setShowDowntimeModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
              {downtimeData.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>{item.cell}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.reason}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ef4444' }}>{item.formatted}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.minutes} menit</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={() => setShowDowntimeModal(false)}
                style={{
                  background: '#0f172a',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for responsive scaling */}
      <style>{`
        @media (max-width: 1024px) {
          .plant-grid-responsive {
            grid-template-columns: 1fr !important;
          }
          .kpi-grid-responsive {
            grid-template-columns: 1fr 1fr !important;
          }
          .chart-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
