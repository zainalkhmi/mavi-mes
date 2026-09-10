/**
 * proStarterCodes.js
 * Production-grade, high-density, visually stunning industrial templates
 * Inspired by Lovable.dev, Linear, and modern MES industrial software.
 */

export const PRO_OEE_DASHBOARD_CODE = `import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Gauge, AlertTriangle, CheckCircle2, Clock, 
  RotateCw, Plus, Search, Filter, ArrowUpRight, ArrowDownRight,
  Sliders, Cpu, Wrench, ShieldAlert, BarChart3, ChevronRight, X
} from 'lucide-react';

const INITIAL_LOGS = [
  { id: 'LOG-101', machine: 'CNC Milling 01', part: 'Gear Shaft A-44', status: 'Running', output: 1240, scrap: 14, target: 1400, downtime: 25, operator: 'Budi Santoso', shift: 'Shift 1' },
  { id: 'LOG-102', machine: 'Stamping Press 04', part: 'Bracket Cover B', status: 'Warning', output: 860, scrap: 28, target: 1100, downtime: 55, operator: 'Agus Pratama', shift: 'Shift 1' },
  { id: 'LOG-103', machine: 'Injection Mold 05', part: 'Housing Plug C', status: 'Down', output: 420, scrap: 45, target: 950, downtime: 110, operator: 'Hendra Wijaya', shift: 'Shift 1' },
  { id: 'LOG-104', machine: 'Assembly Cell 02', part: 'Sub-Assembly Motor', status: 'Running', output: 1510, scrap: 8, target: 1600, downtime: 15, operator: 'Siti Rahma', shift: 'Shift 1' },
];

const TELEMETRY_CARDS = [
  { id: 'CNC-01', name: 'CNC Milling 01', type: 'Machining Line', rpm: 4200, temp: 42.4, vibration: 0.18, status: 'Running', health: 98 },
  { id: 'STAMP-04', name: 'Stamping Press 04', type: 'Heavy Stamping', rpm: 65, temp: 58.1, vibration: 0.42, status: 'Warning', health: 84 },
  { id: 'INJ-05', name: 'Injection Mold 05', type: 'Plastics Molding', rpm: 0, temp: 185.0, vibration: 0.05, status: 'Down', health: 52 },
  { id: 'ASSY-02', name: 'Assembly Cell 02', type: 'Robotic Cell', rpm: 1200, temp: 34.2, vibration: 0.12, status: 'Running', health: 99 },
];

export default function App() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [telemetry, setTelemetry] = useState(TELEMETRY_CARDS);
  const [isLiveTelemetryActive, setIsLiveTelemetryActive] = useState(true);

  // New Log Form State
  const [newMachine, setNewMachine] = useState('CNC Milling 01');
  const [newPart, setNewPart] = useState('');
  const [newTarget, setNewTarget] = useState(1200);
  const [newOutput, setNewOutput] = useState(0);
  const [newScrap, setNewScrap] = useState(0);
  const [newDowntime, setNewDowntime] = useState(0);
  const [newStatus, setNewStatus] = useState('Running');
  const [newOperator, setNewOperator] = useState('Operator Shift');

  // Real-time telemetry oscillation simulation
  useEffect(() => {
    if (!isLiveTelemetryActive) return;
    const timer = setInterval(() => {
      setTelemetry(prev => prev.map(m => {
        if (m.status === 'Down') return m;
        const tempDelta = (Math.random() - 0.5) * 0.8;
        const vibDelta = (Math.random() - 0.5) * 0.04;
        return {
          ...m,
          temp: parseFloat((m.temp + tempDelta).toFixed(1)),
          vibration: Math.max(0.05, parseFloat((m.vibration + vibDelta).toFixed(2)))
        };
      }));
    }, 2500);
    return () => clearInterval(timer);
  }, [isLiveTelemetryActive]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalTarget = logs.reduce((sum, r) => sum + (Number(r.target) || 0), 0) || 1;
    const totalOutput = logs.reduce((sum, r) => sum + (Number(r.output) || 0), 0);
    const totalScrap = logs.reduce((sum, r) => sum + (Number(r.scrap) || 0), 0);
    const totalDowntime = logs.reduce((sum, r) => sum + (Number(r.downtime) || 0), 0);

    const availability = Math.min(100, Math.max(0, 100 - (totalDowntime / (logs.length * 480)) * 100));
    const performance = Math.min(100, (totalOutput / totalTarget) * 100);
    const quality = totalOutput > 0 ? Math.min(100, ((totalOutput - totalScrap) / totalOutput) * 100) : 100;
    const overallOee = (availability * performance * quality) / 10000;

    return {
      oee: overallOee.toFixed(1),
      availability: availability.toFixed(1),
      performance: performance.toFixed(1),
      quality: quality.toFixed(1),
      totalOutput,
      totalScrap,
      totalDowntime
    };
  }, [logs]);

  // Handle Save New Record
  const handleCreateRecord = (e) => {
    e.preventDefault();
    if (!newPart.trim()) return;

    const newRecord = {
      id: 'LOG-' + Math.floor(100 + Math.random() * 900),
      machine: newMachine,
      part: newPart.trim(),
      status: newStatus,
      target: Number(newTarget),
      output: Number(newOutput),
      scrap: Number(newScrap),
      downtime: Number(newDowntime),
      operator: newOperator,
      shift: 'Shift 1'
    };

    setLogs(prev => [newRecord, ...prev]);
    if (window.MaviCoreBridge?.save) {
      window.MaviCoreBridge.save('Production_OEE_Logs', newRecord);
    }

    // Reset Form
    setNewPart('');
    setNewOutput(0);
    setNewScrap(0);
    setNewDowntime(0);
    setIsModalOpen(false);
  };

  const handleDeleteRecord = (id) => {
    setLogs(prev => prev.filter(r => r.id !== id));
    if (window.MaviCoreBridge?.delete) {
      window.MaviCoreBridge.delete('Production_OEE_Logs', id);
    }
  };

  const filteredLogs = logs.filter(item => {
    const matchFilter = activeFilter === 'All' || item.status === activeFilter;
    const matchQuery = item.machine.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       item.part.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       item.operator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchQuery;
  });

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: '#090d16', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ─── TOP HEADER BAR ─── */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">MAVI MES INDUSTRIAL OS</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">Shop Floor Command Center</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Overall Equipment Effectiveness (OEE)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              Shift 1 • Line A
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setIsLiveTelemetryActive(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
          >
            <RotateCw size={12} className={isLiveTelemetryActive ? "animate-spin" : ""} />
            <span>{isLiveTelemetryActive ? 'Live Telemetry ON' : 'Telemetry Paused'}</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            <Plus size={14} />
            <span>+ Catat Produksi Baru</span>
          </button>
        </div>
      </header>

      {/* ─── 4 PRO OEE KPI CARDS ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Card 1: Overall OEE */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">OVERALL OEE</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Activity size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-white">{metrics.oee}%</span>
            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight size={12} /> +3.4%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: \`\${metrics.oee}%\` }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>World-Class Benchmark: 85%</span>
            <span className="font-semibold text-slate-300">Target: 75%</span>
          </div>
        </div>

        {/* Card 2: Availability */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AVAILABILITY</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-white">{metrics.availability}%</span>
            <span className="text-xs text-slate-400">Downtime: {metrics.totalDowntime}m</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-sky-400 h-full rounded-full transition-all duration-500" style={{ width: \`\${metrics.availability}%\` }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Uptime: {(480 - metrics.totalDowntime)} min</span>
            <span className="font-semibold text-sky-300">Shift Base: 480m</span>
          </div>
        </div>

        {/* Card 3: Performance */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">PERFORMANCE</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Gauge size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-white">{metrics.performance}%</span>
            <span className="text-xs text-slate-400">Total: {metrics.totalOutput.toLocaleString()} pcs</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: \`\${Math.min(100, metrics.performance)}%\` }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Cycle Speed: 42s/pc</span>
            <span className="font-semibold text-amber-300">Target Part: 5,050</span>
          </div>
        </div>

        {/* Card 4: Quality Rate */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">QUALITY RATE</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-white">{metrics.quality}%</span>
            <span className="flex items-center text-xs font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
              Scrap: {metrics.totalScrap} pcs
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: \`\${metrics.quality}%\` }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>PPM Defect: 240 PPM</span>
            <span className="font-semibold text-emerald-400">Pass Yield: High</span>
          </div>
        </div>

      </section>

      {/* ─── LIVE MACHINE TELEMETRY GRID ─── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-sky-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Live Machine Telemetry (IoT Gateways)</h2>
          </div>
          <span className="text-xs text-slate-500">Auto-refreshes every 2.5s</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {telemetry.map(m => (
            <div key={m.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">{m.name}</span>
                <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 \${
                  m.status === 'Running' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  m.status === 'Warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }\`}>
                  <span className={\`w-1.5 h-1.5 rounded-full \${
                    m.status === 'Running' ? 'bg-emerald-400 animate-ping' :
                    m.status === 'Warning' ? 'bg-amber-400' : 'bg-rose-500'
                  }\`} />
                  {m.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 py-2 my-1 border-y border-slate-800 text-center">
                <div>
                  <div className="text-[10px] text-slate-500">SPEED</div>
                  <div className="text-xs font-bold text-slate-300">{m.rpm} <span className="text-[9px] font-normal text-slate-500">rpm</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">TEMP</div>
                  <div className="text-xs font-bold text-slate-300">{m.temp}°C</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">VIBR</div>
                  <div className="text-xs font-bold text-slate-300">{m.vibration} <span className="text-[9px] font-normal text-slate-500">mm/s</span></div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                <span>Machine Health</span>
                <span className="font-bold text-indigo-400">{m.health}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRODUCTION LOG TABLE WITH TABS & CRUD ─── */}
      <section className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['All', 'Running', 'Warning', 'Down'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={\`px-3 py-1 rounded-lg text-xs font-bold transition \${
                  activeFilter === tab 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }\`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search machine, part, or operator..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* The Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">ID & Mesin</th>
                <th className="px-4 py-3">Part & Operator</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Output / Target</th>
                <th className="px-4 py-3">Scrap Rate</th>
                <th className="px-4 py-3">Downtime</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredLogs.map(item => {
                const percentage = Math.min(100, Math.round((item.output / item.target) * 100));
                const scrapPct = item.output > 0 ? ((item.scrap / item.output) * 100).toFixed(1) : 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{item.machine}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-200 font-semibold">{item.part}</div>
                      <div className="text-[10px] text-slate-400">{item.operator} • {item.shift}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={\`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 \${
                        item.status === 'Running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        item.status === 'Warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }\`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white">{item.output}</span>
                        <span className="text-[10px] text-slate-500">/ {item.target} ({percentage}%)</span>
                      </div>
                      <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: \`\${percentage}%\` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={\`font-semibold \${item.scrap > 20 ? 'text-rose-400' : 'text-slate-400'}\`}>
                        {item.scrap} pcs ({scrapPct}%)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300">{item.downtime} min</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        type="button"
                        onClick={() => handleDeleteRecord(item.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </section>

      {/* ─── MODAL ADD LOG (PRO DIALOG) ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">Catat Log Produksi & Downtime Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Pilih Mesin</label>
                <select 
                  value={newMachine} 
                  onChange={e => setNewMachine(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  <option>CNC Milling 01</option>
                  <option>Stamping Press 04</option>
                  <option>Injection Mold 05</option>
                  <option>Assembly Cell 02</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nama / Kode Part</label>
                <input 
                  type="text" 
                  value={newPart}
                  onChange={e => setNewPart(e.target.value)}
                  placeholder="e.g. Gear Pinion X-90"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Part</label>
                  <input 
                    type="number" 
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Hasil Aktual Output</label>
                  <input 
                    type="number" 
                    value={newOutput}
                    onChange={e => setNewOutput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Scrap / Cacat (pcs)</label>
                  <input 
                    type="number" 
                    value={newScrap}
                    onChange={e => setNewScrap(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Downtime (menit)</label>
                  <input 
                    type="number" 
                    value={newDowntime}
                    onChange={e => setNewDowntime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Status Mesin</label>
                <select 
                  value={newStatus} 
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Running">Running (Normal)</option>
                  <option value="Warning">Warning (Minor Stop / Setup)</option>
                  <option value="Down">Down (Breakdown)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Simpan & Sync Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
`;

export const PRO_KANBAN_BOARD_CODE = `import React, { useState } from 'react';
import { Sliders, Plus, CheckCircle2, Clock, AlertCircle, ArrowRight, User, Tag, Layers, X } from 'lucide-react';

const INITIAL_CARDS = [
  { id: 'KB-401', title: 'Stamping Bracket Chassis A', lot: 'LOT-202609-01', priority: 'Urgent', stage: 'todo', qty: 1500, operator: 'Budi S.' },
  { id: 'KB-402', title: 'CNC Milling Shaft 25mm', lot: 'LOT-202609-04', priority: 'High', stage: 'in_progress', qty: 850, operator: 'Agus P.' },
  { id: 'KB-403', title: 'Gear Pinion Heat Treatment', lot: 'LOT-202609-08', priority: 'Normal', stage: 'in_progress', qty: 2200, operator: 'Hendra W.' },
  { id: 'KB-404', title: 'Quality CMM Dimension Audit', lot: 'LOT-202609-03', priority: 'High', stage: 'qa_review', qty: 500, operator: 'Siti R.' },
  { id: 'KB-405', title: 'Assembly Motor Housing V8', lot: 'LOT-202609-02', priority: 'Normal', stage: 'done', qty: 1200, operator: 'Rian K.' }
];

const COLUMNS = [
  { id: 'todo', label: 'To Do / Backlog', color: '#64748b' },
  { id: 'in_progress', label: 'In Machining', color: '#38bdf8' },
  { id: 'qa_review', label: 'QA Inspection', color: '#f59e0b' },
  { id: 'done', label: 'Done / Ready Ship', color: '#10b981' }
];

export default function App() {
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [qty, setQty] = useState(1000);
  const [priority, setPriority] = useState('High');

  const moveCard = (id, direction) => {
    setCards(prev => prev.map(c => {
      if (c.id !== id) return c;
      const order = ['todo', 'in_progress', 'qa_review', 'done'];
      const curIdx = order.indexOf(c.stage);
      const nextIdx = direction === 'next' ? Math.min(order.length - 1, curIdx + 1) : Math.max(0, curIdx - 1);
      const updated = { ...c, stage: order[nextIdx] };
      if (window.MaviCoreBridge?.save) {
        window.MaviCoreBridge.save('Kanban_Work_Orders', updated);
      }
      return updated;
    }));
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newCard = {
      id: 'KB-' + Math.floor(100 + Math.random() * 900),
      title: title.trim(),
      lot: 'LOT-202609-' + Math.floor(10 + Math.random() * 90),
      priority,
      qty: Number(qty),
      stage: 'todo',
      operator: 'Operator Shift'
    };
    setCards(prev => [newCard, ...prev]);
    if (window.MaviCoreBridge?.save) {
      window.MaviCoreBridge.save('Kanban_Work_Orders', newCard);
    }
    setTitle('');
    setIsAddOpen(false);
  };

  return (
    <div className="min-h-screen p-5" style={{ backgroundColor: '#090d16', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header className="mb-6 flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={14} className="text-indigo-400" />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">MAVI SMART KANBAN</span>
          </div>
          <h1 className="text-2xl font-black text-white">Electronic Kanban Work Order Dispatch</h1>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          <Plus size={14} /> Tambah Kartu Kanban
        </button>
      </header>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colCards = cards.filter(c => c.stage === col.id);
          return (
            <div key={col.id} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3.5 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <span className="font-bold text-xs text-white uppercase tracking-wider">{col.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 font-bold text-slate-400">
                  {colCards.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {colCards.map(c => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-slate-500">{c.id}</span>
                      <span className={\`text-[9px] font-bold px-2 py-0.5 rounded-full \${
                        c.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        c.priority === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }\`}>
                        {c.priority}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mb-2">{c.title}</h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 mb-2">
                      <span>{c.lot}</span>
                      <span className="font-bold text-slate-300">{c.qty} pcs</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500">{c.operator}</span>
                      <div className="flex gap-1">
                        {c.stage !== 'todo' && (
                          <button onClick={() => moveCard(c.id, 'prev')} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px]">
                            ←
                          </button>
                        )}
                        {c.stage !== 'done' && (
                          <button onClick={() => moveCard(c.id, 'next')} className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold">
                            Lanjut →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Buat Kartu Kanban Baru</h3>
              <button onClick={() => setIsAddOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddCard} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Part / Job</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Target Qty</label>
                  <input 
                    type="number" 
                    value={qty} 
                    onChange={e => setQty(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Prioritas</label>
                  <select 
                    value={priority} 
                    onChange={e => setPriority(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 rounded-lg bg-slate-800">Batal</button>
                <button type="submit" className="px-3 py-1.5 rounded-lg bg-indigo-600 font-bold text-white">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;

export const PRO_CHECK_SHEET_CODE = `import React, { useState } from 'react';
import { ClipboardList, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, User, Clock, Check, RotateCcw } from 'lucide-react';

const INSPECTION_ITEMS = [
  { id: 1, category: 'Keselamatan Kerja (Safety)', text: 'Emergency stop switch berfungsi normal & tidak terhalang', standard: 'Mati seketika saat ditekan', status: 'pass' },
  { id: 2, category: 'Keselamatan Kerja (Safety)', text: 'Light curtain sensor aktif & memutus siklus saat terhalang tangan', standard: 'Interlock 100% aktif', status: 'pass' },
  { id: 3, category: 'Mekanikal & Tekanan', text: 'Tekanan oli hidrolik utama stabil di rentang standar', standard: '140 - 160 Bar', status: 'pass' },
  { id: 4, category: 'Mekanikal & Tekanan', text: 'Level pelumasan otomatis (lubrication tank) di atas garis MIN', standard: 'Level > 70%', status: 'pass' },
  { id: 5, category: 'Elektrikal & Suhu', text: 'Suhu bearing spindle dan main motor normal', standard: 'Maksimal 65°C', status: 'pass' }
];

export default function App() {
  const [items, setItems] = useState(INSPECTION_ITEMS);
  const [machineId, setMachineId] = useState('STAMP-04 (500 Ton)');
  const [operator, setOperator] = useState('Ahmad Fauzi');
  const [submitted, setSubmitted] = useState(false);

  const toggleStatus = (id, newStatus) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const passCount = items.filter(i => i.status === 'pass').length;
  const failCount = items.filter(i => i.status === 'fail').length;

  const handleSubmit = () => {
    setSubmitted(true);
    if (window.MaviCoreBridge?.save) {
      window.MaviCoreBridge.save('Digital_Checksheets', {
        machineId,
        operator,
        passCount,
        failCount,
        verdict: failCount === 0 ? 'READY TO RUN' : 'HOLD - DO NOT RUN',
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: '#090d16', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <header className="mb-6 pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">PRE-FLIGHT SHIFT VERIFICATION</span>
          </div>
          <h1 className="text-2xl font-black text-white">Digital Checksheet & Machine Inspection</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
          <User size={13} className="text-slate-500" />
          <span>Operator: <strong className="text-white">{operator}</strong></span>
        </div>
      </header>

      {/* Summary Banner */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">TOTAL POIN</div>
          <div className="text-2xl font-black text-white">{items.length}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="text-xs text-emerald-400 font-bold mb-1">PASS (SESUAI)</div>
          <div className="text-2xl font-black text-emerald-400">{passCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
          <div className="text-xs text-rose-400 font-bold mb-1">FAIL (CACAT/BAHAYA)</div>
          <div className="text-2xl font-black text-rose-400">{failCount}</div>
        </div>
      </div>

      {/* Checksheet List */}
      <div className="space-y-3 mb-6">
        {items.map(item => (
          <div key={item.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5 block">{item.category}</span>
              <div className="font-bold text-white text-sm mb-1">{item.text}</div>
              <div className="text-xs text-slate-400">Standar: <span className="text-slate-300 font-medium">{item.standard}</span></div>
            </div>

            {/* Toggle Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleStatus(item.id, 'pass')}
                className={\`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 \${
                  item.status === 'pass' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }\`}
              >
                <Check size={13} />
                <span>PASS</span>
              </button>

              <button
                type="button"
                onClick={() => toggleStatus(item.id, 'fail')}
                className={\`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 \${
                  item.status === 'fail' 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }\`}
              >
                <XCircle size={13} />
                <span>FAIL</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="text-xs text-slate-400">Status Verifikasi:</div>
          <div className="font-bold text-sm text-white">
            {failCount === 0 ? '✅ Mesin Siap Produksi (All Safety Clear)' : '⚠️ Hold: Ada poin inspeksi FAIL!'}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="px-6 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/30 transition active:scale-95"
        >
          {submitted ? '✓ Tersimpan ke Database MaviCore' : 'Konfirmasi & Kirim Checksheet'}
        </button>
      </div>

    </div>
  );
}
`;
