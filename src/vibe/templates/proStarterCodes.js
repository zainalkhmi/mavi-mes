/**
 * proStarterCodes.js
 * Production-grade, colorful, high-density industrial templates
 * Inspired by modern MES frontlines, Linear, and vibrant Lovable.dev designs.
 */

export const PRO_OEE_DASHBOARD_CODE = `import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Gauge, AlertTriangle, CheckCircle2, Clock, 
  RotateCw, Plus, Search, Filter, ArrowUpRight, ArrowDownRight,
  Sliders, Cpu, Wrench, ShieldAlert, BarChart3, ChevronRight, X, Sparkles
} from 'lucide-react';

const INITIAL_LOGS = [
  { id: 'LOG-101', machine: 'CNC Milling 01', part: 'Gear Shaft A-44', status: 'Running', output: 1240, scrap: 14, target: 1400, downtime: 25, operator: 'Budi Santoso', shift: 'Shift 1' },
  { id: 'LOG-102', machine: 'Stamping Press 04', part: 'Bracket Cover B', status: 'Warning', output: 860, scrap: 28, target: 1100, downtime: 55, operator: 'Agus Pratama', shift: 'Shift 1' },
  { id: 'LOG-103', machine: 'Injection Mold 05', part: 'Housing Plug C', status: 'Down', output: 420, scrap: 45, target: 950, downtime: 110, operator: 'Hendra Wijaya', shift: 'Shift 1' },
  { id: 'LOG-104', machine: 'Assembly Cell 02', part: 'Sub-Assembly Motor', status: 'Running', output: 1510, scrap: 8, target: 1600, downtime: 15, operator: 'Siti Rahma', shift: 'Shift 1' },
];

const TELEMETRY_CARDS = [
  { id: 'CNC-01', name: 'CNC Milling 01', type: 'Machining Line', rpm: 4200, temp: 42.4, vibration: 0.18, status: 'Running', health: 98, color: 'blue' },
  { id: 'STAMP-04', name: 'Stamping Press 04', type: 'Heavy Stamping', rpm: 65, temp: 58.1, vibration: 0.42, status: 'Warning', health: 84, color: 'amber' },
  { id: 'INJ-05', name: 'Injection Mold 05', type: 'Plastics Molding', rpm: 0, temp: 185.0, vibration: 0.05, status: 'Down', health: 52, color: 'rose' },
  { id: 'ASSY-02', name: 'Assembly Cell 02', type: 'Robotic Cell', rpm: 1200, temp: 34.2, vibration: 0.12, status: 'Running', health: 99, color: 'emerald' },
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

  // Sync to window.MaviCoreBridge
  useEffect(() => {
    if (window.MaviCoreBridge?.onRecord) {
      const unsub = window.MaviCoreBridge.onRecord('Production_OEE_Logs', (newRec) => {
        setLogs(prev => [newRec, ...prev]);
      });
      return () => { if (unsub) unsub(); };
    }
  }, []);

  // Compute live KPI metrics
  const metrics = useMemo(() => {
    const totalOutput = logs.reduce((acc, r) => acc + Number(r.output || 0), 0);
    const totalTarget = logs.reduce((acc, r) => acc + Number(r.target || 0), 0);
    const totalScrap = logs.reduce((acc, r) => acc + Number(r.scrap || 0), 0);
    const totalDowntime = logs.reduce((acc, r) => acc + Number(r.downtime || 0), 0);

    const plannedTime = 480 * logs.length; // 480 mins per shift
    const operatingTime = Math.max(1, plannedTime - totalDowntime);
    const availability = Math.min(100, Math.round((operatingTime / plannedTime) * 100)) || 88;
    const performance = totalTarget > 0 ? Math.min(100, Math.round((totalOutput / totalTarget) * 100)) : 85;
    const quality = totalOutput > 0 ? Math.max(0, Math.round(((totalOutput - totalScrap) / totalOutput) * 100)) : 98;
    const oee = Math.round((availability * performance * quality) / 10000);

    return { totalOutput, totalTarget, totalScrap, totalDowntime, availability, performance, quality, oee };
  }, [logs]);

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
    <div className="min-h-screen p-4 sm:p-6" style={{ 
      background: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.12) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(14, 165, 233, 0.12) 0px, transparent 50%), #f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      
      {/* ─── TOP HEADER BAR ─── */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black tracking-wider text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              MAVI MES INDUSTRIAL OS
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Shop Floor Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <span>Overall Equipment Effectiveness</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-sm">
              Shift 1 • Line A
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            type="button"
            onClick={() => setIsLiveTelemetryActive(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition"
          >
            <RotateCw size={13} className={isLiveTelemetryActive ? "animate-spin text-blue-600" : "text-slate-400"} />
            <span>{isLiveTelemetryActive ? 'Live IoT Active' : 'IoT Paused'}</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition active:scale-95"
          >
            <Plus size={15} />
            <span>+ Catat Produksi Baru</span>
          </button>
        </div>
      </header>

      {/* ─── 4 PRO OEE KPI CARDS (COLOURFUL & VIBRANT) ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Card 1: Overall OEE - VIBRANT INDIGO */}
        <div className="p-5 rounded-2xl bg-white border-t-4 border-t-indigo-600 border border-slate-200 shadow-lg shadow-indigo-500/5 relative overflow-hidden transition hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">OVERALL OEE</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
              <Activity size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-indigo-600">{metrics.oee}%</span>
            <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={13} /> +3.4%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: \`\${metrics.oee}%\` }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Benchmark: 85%</span>
            <span className="font-bold text-indigo-600">Target: 75%</span>
          </div>
        </div>

        {/* Card 2: Availability - VIBRANT SKY BLUE */}
        <div className="p-5 rounded-2xl bg-white border-t-4 border-t-sky-500 border border-slate-200 shadow-lg shadow-sky-500/5 relative overflow-hidden transition hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">AVAILABILITY</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/30">
              <Clock size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-sky-600">{metrics.availability}%</span>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              Downtime: {metrics.totalDowntime}m
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full transition-all duration-500" style={{ width: \`\${metrics.availability}%\` }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Uptime: {(480 - metrics.totalDowntime)} min</span>
            <span className="font-bold text-sky-600">Shift Base: 480m</span>
          </div>
        </div>

        {/* Card 3: Performance - VIBRANT AMBER */}
        <div className="p-5 rounded-2xl bg-white border-t-4 border-t-amber-500 border border-slate-200 shadow-lg shadow-amber-500/5 relative overflow-hidden transition hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">PERFORMANCE</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
              <Gauge size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-amber-600">{metrics.performance}%</span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {metrics.totalOutput.toLocaleString()} pcs
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500" style={{ width: \`\${Math.min(100, metrics.performance)}%\` }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Cycle Speed: 42s/pc</span>
            <span className="font-bold text-amber-600">Target: 5,050 pcs</span>
          </div>
        </div>

        {/* Card 4: Quality Rate - VIBRANT EMERALD */}
        <div className="p-5 rounded-2xl bg-white border-t-4 border-t-emerald-500 border border-slate-200 shadow-lg shadow-emerald-500/5 relative overflow-hidden transition hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">QUALITY RATE</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-emerald-600">{metrics.quality}%</span>
            <span className="flex items-center text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
              Scrap: {metrics.totalScrap} pcs
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: \`\${metrics.quality}%\` }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>PPM Defect: 240 PPM</span>
            <span className="font-bold text-emerald-600">Pass Yield: High</span>
          </div>
        </div>

      </section>

      {/* ─── LIVE MACHINE TELEMETRY GRID (COLOURFUL CARDS) ─── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-blue-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Live IoT Gateway Telemetry</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            Realtime 2.5s Sync
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {telemetry.map(m => (
            <div key={m.id} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-md hover:shadow-lg transition flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-black text-slate-900">{m.name}</div>
                  <div className="text-[10px] text-slate-500">{m.type}</div>
                </div>
                <span className={\`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider \${
                  m.status === 'Running' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  m.status === 'Warning' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  'bg-rose-100 text-rose-800 border border-rose-300'
                }\`}>
                  {m.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 my-1 bg-slate-50 rounded-xl px-2.5 border border-slate-100 text-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-400">RPM</div>
                  <div className="text-xs font-black text-blue-600">{m.rpm}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400">SUHU</div>
                  <div className="text-xs font-black text-orange-600">{m.temp}°C</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400">VIBRASI</div>
                  <div className="text-xs font-black text-purple-600">{m.vibration}</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] pt-1">
                <span className="text-slate-500 font-medium">Health Index</span>
                <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{m.health}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRODUCTION LOG TABLE (COLOURFUL BADGES & CRUD) ─── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden mb-6">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {['All', 'Running', 'Warning', 'Down'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={\`px-3.5 py-1.5 rounded-lg text-xs font-black transition \${
                  activeFilter === tab 
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }\`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari mesin, part, atau operator..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* The Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-600 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">ID & Mesin</th>
                <th className="px-4 py-3.5">Part & Operator</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Output / Target</th>
                <th className="px-4 py-3.5">Scrap Rate</th>
                <th className="px-4 py-3.5">Downtime</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.map(item => {
                const percentage = Math.min(100, Math.round((item.output / item.target) * 100));
                const scrapPct = item.output > 0 ? ((item.scrap / item.output) * 100).toFixed(1) : 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-black text-slate-900">{item.machine}</div>
                      <div className="text-[10px] text-indigo-600 font-mono font-bold">{item.id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-800 font-bold">{item.part}</div>
                      <div className="text-[10px] text-slate-500">{item.operator} • {item.shift}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={\`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 \${
                        item.status === 'Running' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        item.status === 'Warning' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-rose-100 text-rose-800 border border-rose-300'
                      }\`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-slate-900">{item.output}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">/ {item.target} ({percentage}%)</span>
                      </div>
                      <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full" style={{ width: \`\${percentage}%\` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={\`font-bold \${item.scrap > 20 ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-600'}\`}>
                        {item.scrap} pcs ({scrapPct}%)
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800">{item.downtime} min</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button 
                        type="button"
                        onClick={() => handleDeleteRecord(item.id)}
                        className="text-rose-600 hover:text-white text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 border border-rose-200 transition"
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

      {/* ─── MODAL ADD LOG (COLOURFUL PRO DIALOG) ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                <h3 className="font-black text-sm">Catat Log Produksi & Downtime</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Mesin</label>
                <select 
                  value={newMachine} 
                  onChange={e => setNewMachine(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>CNC Milling 01</option>
                  <option>Stamping Press 04</option>
                  <option>Injection Mold 05</option>
                  <option>Assembly Cell 02</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Part / Komponen</label>
                <input 
                  type="text" 
                  value={newPart} 
                  onChange={e => setNewPart(e.target.value)}
                  placeholder="Contoh: Shaft Pinion B-12"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Shift (pcs)</label>
                  <input 
                    type="number" 
                    value={newTarget} 
                    onChange={e => setNewTarget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Output Aktual (pcs)</label>
                  <input 
                    type="number" 
                    value={newOutput} 
                    onChange={e => setNewOutput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Scrap / NG (pcs)</label>
                  <input 
                    type="number" 
                    value={newScrap} 
                    onChange={e => setNewScrap(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Downtime (menit)</label>
                  <input 
                    type="number" 
                    value={newDowntime} 
                    onChange={e => setNewDowntime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black shadow-lg shadow-indigo-500/25 transition active:scale-95"
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
import { Sliders, Plus, CheckCircle2, Clock, AlertCircle, ArrowRight, User, Tag, Layers, X, Sparkles } from 'lucide-react';

const INITIAL_CARDS = [
  { id: 'KB-401', title: 'Stamping Bracket Chassis A', lot: 'LOT-202609-01', priority: 'Urgent', stage: 'todo', qty: 1500, operator: 'Budi S.' },
  { id: 'KB-402', title: 'CNC Milling Shaft 25mm', lot: 'LOT-202609-04', priority: 'High', stage: 'in_progress', qty: 850, operator: 'Agus P.' },
  { id: 'KB-403', title: 'Gear Pinion Heat Treatment', lot: 'LOT-202609-08', priority: 'Normal', stage: 'in_progress', qty: 2200, operator: 'Hendra W.' },
  { id: 'KB-404', title: 'Quality CMM Dimension Audit', lot: 'LOT-202609-03', priority: 'High', stage: 'qa_review', qty: 500, operator: 'Siti R.' },
  { id: 'KB-405', title: 'Assembly Motor Housing V8', lot: 'LOT-202609-02', priority: 'Normal', stage: 'done', qty: 1200, operator: 'Rian K.' }
];

const COLUMNS = [
  { id: 'todo', label: 'To Do / Backlog', color: '#6366f1', headerBg: 'from-indigo-500 to-blue-600' },
  { id: 'in_progress', label: 'In Machining', color: '#0ea5e9', headerBg: 'from-sky-500 to-cyan-600' },
  { id: 'qa_review', label: 'QA Review', color: '#f59e0b', headerBg: 'from-amber-500 to-orange-600' },
  { id: 'done', label: 'Done / Ready Ship', color: '#10b981', headerBg: 'from-emerald-500 to-teal-600' }
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
    <div className="min-h-screen p-4 sm:p-6" style={{ 
      background: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.12) 0px, transparent 50%), #f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              SHOP FLOOR DISPATCH
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Electronic Kanban (e-Kanban)</h1>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25 transition active:scale-95"
        >
          + Tambah Work Order
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colCards = cards.filter(c => c.stage === col.id);
          return (
            <div key={col.id} className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 flex flex-col">
              <div className={'p-2.5 rounded-xl bg-gradient-to-r ' + col.headerBg + ' text-white font-black text-xs flex justify-between items-center mb-3 shadow-sm'}>
                <span>{col.label}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{colCards.length}</span>
              </div>

              <div className="space-y-3 flex-1">
                {colCards.map(c => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-indigo-600">{c.id}</span>
                      <span className={'px-2 py-0.5 rounded-full text-[10px] font-black ' + (
                        c.priority === 'Urgent' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        c.priority === 'High' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-blue-100 text-blue-700 border border-blue-200'
                      )}>
                        {c.priority}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs mb-1">{c.title}</div>
                    <div className="text-[10px] text-slate-500 mb-2">Lot: {c.lot} • Qty: <strong className="text-slate-800">{c.qty} pcs</strong></div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-[10px]">
                      {c.stage !== 'todo' && (
                        <button onClick={() => moveCard(c.id, 'prev')} className="text-slate-500 hover:text-slate-900 font-bold">← Back</button>
                      )}
                      {c.stage !== 'done' && (
                        <button onClick={() => moveCard(c.id, 'next')} className="ml-auto text-indigo-600 hover:text-indigo-800 font-black">Next →</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-black text-sm text-slate-900 mb-3">Buat Kartu Kanban Baru</h3>
            <form onSubmit={handleAddCard} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Part / Task</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900" required />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Qty</label>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prioritas</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-bold">
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 rounded-xl bg-slate-100 font-bold">Batal</button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black">Simpan</button>
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
    <div className="min-h-screen p-4 sm:p-6" style={{ 
      background: 'radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.12) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%), #f8fafc', 
      color: '#0f172a', 
      fontFamily: 'Inter, system-ui, sans-serif' 
    }}>
      
      {/* Header */}
      <header className="mb-6 pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
              PRE-FLIGHT SHIFT VERIFICATION
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Digital Checksheet & Machine Inspection</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
          <User size={13} className="text-slate-400" />
          <span>Operator: <strong className="text-slate-900">{operator}</strong></span>
        </div>
      </header>

      {/* Summary Banner */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-black text-slate-400 uppercase mb-1">TOTAL POIN</div>
          <div className="text-2xl font-black text-slate-900">{items.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-sm">
          <div className="text-xs font-black text-emerald-800 uppercase mb-1">PASS (SESUAI)</div>
          <div className="text-2xl font-black text-emerald-600">{passCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 shadow-sm">
          <div className="text-xs font-black text-rose-800 uppercase mb-1">FAIL (CACAT/BAHAYA)</div>
          <div className="text-2xl font-black text-rose-600">{failCount}</div>
        </div>
      </div>

      {/* Checksheet List */}
      <div className="space-y-3 mb-6">
        {items.map(item => (
          <div key={item.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-0.5 block">{item.category}</span>
              <div className="font-black text-slate-900 text-sm mb-1">{item.text}</div>
              <div className="text-xs text-slate-500">Standar: <span className="text-slate-700 font-bold">{item.standard}</span></div>
            </div>

            {/* Toggle Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleStatus(item.id, 'pass')}
                className={'px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ' + (
                  item.status === 'pass' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <Check size={13} />
                <span>PASS</span>
              </button>

              <button
                type="button"
                onClick={() => toggleStatus(item.id, 'fail')}
                className={'px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ' + (
                  item.status === 'fail' 
                    ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <XCircle size={13} />
                <span>FAIL</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-md gap-3">
        <div>
          <div className="text-xs text-slate-500">Status Verifikasi:</div>
          <div className="font-black text-sm text-slate-900">
            {failCount === 0 ? '✅ Mesin Siap Produksi (All Safety Clear)' : '⚠️ Hold: Ada poin inspeksi FAIL!'}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="px-6 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white shadow-xl shadow-emerald-600/30 transition active:scale-95"
        >
          {submitted ? '✓ Tersimpan ke Database MaviCore' : 'Konfirmasi & Kirim Checksheet'}
        </button>
      </div>

    </div>
  );
}
`;
