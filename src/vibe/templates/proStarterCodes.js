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
import { 
  KPICard, 
  Numpad, 
  ScadaProdCounter, 
  StatusBadge, 
  TelemetryGauge, 
  ScadaStartBtn, 
  ScadaStopBtn,
  QualityTolerance
} from './mavicore-ui';

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
              MAVICORE INDUSTRIAL OS
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

      {/* ─── 4 MAVICORE UI KPI CARDS ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="OVERALL OEE" value={metrics.oee + '%'} trend="+3.4%" color="indigo" icon={Activity} />
        <KPICard title="AVAILABILITY" value={metrics.availability + '%'} unit="Uptime" trend={'Downtime: ' + metrics.totalDowntime + 'm'} color="sky" icon={Clock} />
        <KPICard title="PERFORMANCE" value={metrics.performance + '%'} unit="Speed" trend={metrics.totalOutput.toLocaleString() + ' pcs'} color="amber" icon={Gauge} />
        <KPICard title="QUALITY RATE" value={metrics.quality + '%'} unit="Yield" trend={'Scrap: ' + metrics.totalScrap + ' pcs'} color="emerald" icon={CheckCircle2} />
      </section>

      {/* ─── MAVICORE SCADA PRODUCTION COUNTER & LIVE IOT GAUGES ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <ScadaProdCounter target={metrics.totalTarget || 5000} actual={metrics.totalOutput} defect={metrics.totalScrap} />
        </div>
        <div className="space-y-3">
          <TelemetryGauge title="Spindle Speed (CNC-01)" value={telemetry[0]?.rpm || 4200} unit="RPM" status={telemetry[0]?.status === 'Running' ? 'OPTIMAL' : 'WARN'} />
          <TelemetryGauge title="Stamping Temp (STAMP-04)" value={(telemetry[1]?.temp || 58.1) + '°C'} unit="" status={telemetry[1]?.status === 'Running' ? 'OPTIMAL' : 'WARN'} />
        </div>
      </section>

      {/* ─── 4 IOT SENSOR STATUS GAUGES ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {telemetry.map(m => (
          <TelemetryGauge 
            key={m.id} 
            title={m.name} 
            value={m.status === 'Down' ? 'OFFLINE' : m.rpm + ' RPM'} 
            unit={'• ' + m.temp + '°C'} 
            status={m.status === 'Running' ? 'OPTIMAL' : m.status === 'Warning' ? 'WARNING' : 'DOWNTIME'} 
          />
        ))}
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
                      <StatusBadge status={item.status === 'Running' ? 'OPTIMAL' : item.status === 'Warning' ? 'WARNING' : 'DOWNTIME'} />
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
                    onChange={e => setNewOutput(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Glove-friendly Touch Numpad */}
              <div className="flex justify-center py-1">
                <Numpad 
                  title="TOUCH NUMPAD OPERATOR" 
                  value={String(newOutput)} 
                  onChange={v => setNewOutput(Number(v) || 0)} 
                />
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
import { KPICard, StatusBadge, Numpad } from './mavicore-ui';

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

      {/* ─── 4 MAVICORE UI KPI CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="TOTAL WORK ORDERS" value={cards.length} unit="Lots" color="indigo" icon={Layers} />
        <KPICard title="IN MACHINING" value={cards.filter(c => c.stage === 'in_progress').length} unit="Lots" color="sky" icon={Sliders} />
        <KPICard title="QA REVIEW" value={cards.filter(c => c.stage === 'qa_review').length} unit="Lots" color="amber" icon={CheckCircle2} />
        <KPICard title="READY TO SHIP" value={cards.filter(c => c.stage === 'done').length} unit="Lots" color="emerald" icon={Sparkles} />
      </div>

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
                      <StatusBadge status={c.priority === 'Urgent' ? 'DOWNTIME' : c.priority === 'High' ? 'WARNING' : 'OPTIMAL'} />
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
                <input type="number" value={qty} onChange={e => setQty(Number(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900" />
              </div>

              {/* Touch Numpad */}
              <div className="flex justify-center py-1">
                <Numpad title="TARGET QTY TOUCH" value={String(qty)} onChange={v => setQty(Number(v) || 0)} />
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
import { KPICard, StatusBadge, SignaturePad } from './mavicore-ui';

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

      {/* ─── 3 MAVICORE UI KPI CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <KPICard title="TOTAL POIN INSPEKSI" value={items.length} unit="Poin" color="indigo" icon={ClipboardList} />
        <KPICard title="PASS (SESUAI)" value={passCount} unit="Poin" trend="Aman" color="emerald" icon={CheckCircle2} />
        <KPICard title="FAIL (DEFECT)" value={failCount} unit="Poin" trend={failCount > 0 ? 'Bahaya' : 'Clear'} color="rose" icon={AlertTriangle} />
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

      {/* ─── DIGITAL SIGNATURE VERIFICATION ─── */}
      <div className="mb-6 flex justify-center">
        <SignaturePad title="TANDA TANGAN DIGITAL VERIFIKASI OPERATOR" onSave={() => setOperator(prev => prev.includes('(Verified)') ? prev : prev + ' (Verified)')} />
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-md gap-3">
        <div className="flex items-center gap-3">
          <StatusBadge status={failCount === 0 ? 'OPTIMAL' : 'DOWNTIME'} />
          <div>
            <div className="text-[10px] text-slate-500 font-bold">Status Verifikasi:</div>
            <div className="font-black text-xs text-slate-900">
              {failCount === 0 ? 'Mesin Siap Produksi (All Safety Clear)' : 'Hold: Ada poin inspeksi FAIL!'}
            </div>
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

export const PRO_AI_VISION_QUALITY_DASHBOARD_CODE = `import React, { useState, useEffect, useMemo } from 'react';
import { 
  Camera, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Sparkles, 
  RefreshCw, Eye, Search, Filter, ArrowRight, Zap, Play, Pause, 
  BarChart3, TrendingUp, TrendingDown, Cpu, Database, Wrench, 
  FileText, Check, AlertCircle, Info, ChevronRight, Send, User, 
  Clock, Layers, ShieldAlert, Sliders, ExternalLink
} from 'lucide-react';
import { 
  KPICard, 
  StatusBadge, 
  TelemetryGauge, 
  QualityTolerance
} from './mavicore-ui';

// Industrial Sample Test Parts with Vision Bounding Boxes
const INSPECTION_SAMPLES = [
  {
    id: 'PART-001',
    sku: 'EV-BAT-CASE-M4',
    name: 'EV Battery Module Enclosure',
    defectType: 'None (Spec Compliant)',
    status: 'PASS',
    confidence: 99.4,
    aqlSeverity: 'Clear',
    dimensions: { length: 320.0, width: 180.2, tolerance: 0.5 },
    boundingBox: null,
    copilotAnalysis: {
      headline: 'Kondisi Komponen Sempurna & Sesuai Toleransi ISO-9001',
      rootCause: 'Semua dimensi dan integritas permukaan memenuhi standar kualitas. Tidak ada anomali terdeteksi.',
      recommendation: 'Lanjutkan perakitan otomatis ke Stasiun Cell-05 (Battery Cell Insertion).',
      wasteImpact: 'Kualitas optimal, scrap rate shift ini terjaga di bawah target 1.2%.'
    }
  },
  {
    id: 'PART-002',
    sku: 'BRK-STAMP-X9',
    name: 'High-Tensile Stamped Bracket',
    defectType: 'Surface Scratch (Deep Abrasion)',
    status: 'FAIL',
    confidence: 97.8,
    aqlSeverity: 'Major (AQL 1.0)',
    dimensions: { length: 145.4, width: 85.0, tolerance: 0.3 },
    boundingBox: { x: 34, y: 42, w: 28, h: 22, label: 'Scratch > 0.8mm' },
    copilotAnalysis: {
      headline: 'Terdeteksi Goresan Permukaan Melebihi Batas Toleransi AQL',
      rootCause: 'Indikasi keausan pada guide roller conveyor di Stasiun Stamping 04 menyebabkan gesekan mekanik.',
      recommendation: 'Pisahkan part ke Bin Karantina Q-02. Jalankan inspeksi visual pada guide roller Stamping 04.',
      wasteImpact: 'Deteksi dini mencegah batch cacat 45 pcs ($1,850 potensi scrap terhindar).'
    }
  },
  {
    id: 'PART-003',
    sku: 'MTR-HSG-C2',
    name: 'Servo Motor Outer Housing',
    defectType: 'Missing Fastener (Bolt M6 Missing)',
    status: 'FAIL',
    confidence: 98.9,
    aqlSeverity: 'Critical (AQL 0.4)',
    dimensions: { length: 210.1, width: 140.0, tolerance: 0.4 },
    boundingBox: { x: 68, y: 25, w: 18, h: 20, label: 'Missing Bolt Hole #3' },
    copilotAnalysis: {
      headline: 'Komponen Kritis Tidak Terpasang: Baut Pengunci M6 Hilang',
      rootCause: 'Feeder pneumatic baut pada Robotic Screwdriver B mengalami misfeed atau kehabisan stok feeder.',
      recommendation: 'Tahan lini otomatis. Lakukan manual replenishment pada hopper baut dan verifikasi sensor optical feeder.',
      wasteImpact: 'Mencegah kegagalan fatal saat uji fungsi vibro-akustik tahap akhir.'
    }
  },
  {
    id: 'PART-004',
    sku: 'VLV-HYD-50',
    name: 'Hydraulic Spool Valve Body',
    defectType: 'Micro-Porosity on Weld Seam',
    status: 'REWORK',
    confidence: 94.2,
    aqlSeverity: 'Minor (AQL 2.5)',
    dimensions: { length: 95.8, width: 45.2, tolerance: 0.2 },
    boundingBox: { x: 48, y: 60, w: 20, h: 18, label: 'Porosity 0.3mm' },
    copilotAnalysis: {
      headline: 'Pori-pori Mikro Terdeteksi pada Sambungan Las Tekan',
      rootCause: 'Fluktuasi aliran gas pelindung argon pada nozzle pengelasan TIG Cell-02.',
      recommendation: 'Part dapat diperbaiki melalui touch-up deburring & polishing di Rework Bench 01.',
      wasteImpact: 'Dapat diselamatkan dengan rework 5 menit tanpa membuang bahan baku mentah.'
    }
  }
];

const INITIAL_LOGS = [
  { id: 'LOG-9001', partId: 'PART-001', sku: 'EV-BAT-CASE-M4', result: 'PASS', defect: 'None', conf: 99.4, time: '10:42:15', operator: 'Jarvis Op-01', synced: true },
  { id: 'LOG-9002', partId: 'PART-001', sku: 'EV-BAT-CASE-M4', result: 'PASS', defect: 'None', conf: 98.7, time: '10:44:30', operator: 'Jarvis Op-01', synced: true },
  { id: 'LOG-9003', partId: 'PART-002', sku: 'BRK-STAMP-X9', result: 'FAIL', defect: 'Surface Scratch', conf: 97.8, time: '10:46:12', operator: 'Jarvis Op-01', synced: true },
  { id: 'LOG-9004', partId: 'PART-001', sku: 'EV-BAT-CASE-M4', result: 'PASS', defect: 'None', conf: 99.1, time: '10:48:05', operator: 'Jarvis Op-01', synced: true },
  { id: 'LOG-9005', partId: 'PART-004', sku: 'VLV-HYD-50', result: 'REWORK', defect: 'Weld Porosity', conf: 94.2, time: '10:50:20', operator: 'Jarvis Op-01', synced: true },
];

export default function App() {
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('inspection');
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [filterResult, setFilterResult] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Interactive Gemini Copilot Chat
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'gemini',
      text: 'Halo Operator! Saya Gemini Operational Copilot. Saya memantau data inspeksi kamera Vision AI, sensor lini produksi, dan analisis BigQuery secara real-time. Ada yang bisa saya bantu analisa?'
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');

  const currentSample = INSPECTION_SAMPLES[selectedSampleIndex];

  // Trigger simulated camera scanning
  const handleTriggerInspection = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const newEntry = {
        id: 'LOG-' + Math.floor(1000 + Math.random() * 9000),
        partId: currentSample.id,
        sku: currentSample.sku,
        result: currentSample.status,
        defect: currentSample.defectType,
        conf: currentSample.confidence,
        time: new Date().toLocaleTimeString('id-ID'),
        operator: 'Jarvis Operator',
        synced: true
      };
      setLogs(prev => [newEntry, ...prev]);

      if (currentSample.status !== 'PASS') {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'gemini',
            text: '⚠️ PERINGATAN VISION AI: ' + currentSample.name + ' terdeteksi ' + currentSample.defectType + ' (Confidence ' + currentSample.confidence + '%). ' + currentSample.copilotAnalysis.rootCause + ' Saran: ' + currentSample.copilotAnalysis.recommendation
          }
        ]);
      }
    }, 1100);
  };

  // Chat Submission
  const handleSendChat = (e) => {
    if (e) e.preventDefault();
    if (!inputQuestion.trim()) return;

    const userText = inputQuestion;
    setInputQuestion('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);

    setTimeout(() => {
      let aiResponse = '';
      const q = userText.toLowerCase();
      if (q.includes('sop') || q.includes('prosedur')) {
        aiResponse = 'SOP Terkait (SOP-QC-402): Saat terdeteksi cacat Major/Critical, operator wajib: 1) Karantina part ke Bin Merah, 2) Ambil foto makro resolusi tinggi, 3) Informasikan foreman jika ada 3 part cacat berturut-turut.';
      } else if (q.includes('akar') || q.includes('penyebab') || q.includes('kenapa')) {
        aiResponse = 'Analisis BigQuery Correlation: Anomali ' + currentSample.defectType + ' berkorelasi 89% dengan kenaikan vibrasi pada motor spindle stasiun sebelumnya. Disarankan kalibrasi toleransi.';
      } else if (q.includes('scrap') || q.includes('limbah') || q.includes('hemat')) {
        aiResponse = 'Estimasi Keberlanjutan: Dengan memutus produksi cacat sebelum batch berlanjut, Anda menghemat 12.5 kg aluminium paduan dan mengurangi jejak karbon ~18 kg CO2e hari ini.';
      } else {
        aiResponse = 'Berdasarkan data Vertex AI dan model inspeksi terkini: Part ' + currentSample.sku + ' berstatus ' + currentSample.status + '. Rekomendasi tindakan: ' + currentSample.copilotAnalysis.recommendation;
      }
      setChatMessages(prev => [...prev, { sender: 'gemini', text: aiResponse }]);
    }, 600);
  };

  // Live KPI Calculations
  const metrics = useMemo(() => {
    const total = logs.length;
    const passes = logs.filter(l => l.result === 'PASS').length;
    const reworks = logs.filter(l => l.result === 'REWORK').length;
    const fails = logs.filter(l => l.result === 'FAIL').length;
    const fpy = total > 0 ? Math.round((passes / total) * 100) : 100;
    const scrapRate = total > 0 ? ((fails / total) * 100).toFixed(1) : '0.0';
    const oee = Math.min(96, Math.max(78, Math.round(fpy * 0.92)));

    return { total, passes, reworks, fails, fpy, scrapRate, oee };
  }, [logs]);

  const filteredLogs = logs.filter(l => {
    if (filterResult !== 'ALL' && l.result !== filterResult) return false;
    if (searchTerm) {
      const matchSku = l.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDefect = l.defect.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSku || matchDefect;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 font-sans">
      
      {/* ─── TOP INDUSTRIAL APP HEADER ─── */}
      <header className="mb-6 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
              <Camera size={13} className="text-indigo-400" />
              VISION AI QUALITY INSPECTION
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
              <Sparkles size={13} className="text-purple-400" />
              GEMINI ON VERTEX AI COPILOT
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              <Database size={13} className="text-emerald-400" />
              BIGQUERY LIVE SYNC
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            MAVI Cognitive Vision & Operations Command
          </h1>
          <p className="text-xs text-slate-400">
            Work Order: <strong className="text-white">WO-2026-ENG-8840</strong> • Lini: <strong className="text-white">Assembly Cell 04</strong> • Shift: <strong className="text-white">Shift 1 (Day)</strong>
          </p>
        </div>

        {/* Quick Mode Nav & Operator Badge */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('inspection')}
              className={'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ' + (
                activeTab === 'inspection' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              )}
            >
              <Eye size={14} />
              <span>Vision Station</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('copilot')}
              className={'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ' + (
                activeTab === 'copilot' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              )}
            >
              <Sparkles size={14} />
              <span>Gemini Copilot</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ' + (
                activeTab === 'analytics' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              )}
            >
              <BarChart3 size={14} />
              <span>Plant Analytics</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <User size={14} className="text-indigo-400" />
            <span className="font-semibold">Operator: Hendra (Op-01)</span>
          </div>
        </div>
      </header>

      {/* ─── 4 TOP KPI METRICS CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KPICard 
          title="TOTAL DIINSPEKSI" 
          value={metrics.total} 
          unit="Part Unit" 
          trend="Target 120/jam" 
          color="indigo" 
          icon={CheckCircle2} 
        />
        <KPICard 
          title="FIRST-PASS YIELD (FPY)" 
          value={metrics.fpy + '%'} 
          unit="Yield Kualitas" 
          trend={metrics.fpy >= 90 ? 'Optimal' : 'Waspada'} 
          color="emerald" 
          icon={ShieldCheck} 
        />
        <KPICard 
          title="DEFECT & SCRAP RATE" 
          value={metrics.scrapRate + '%'} 
          unit="Toleransi < 2.0%" 
          trend={Number(metrics.scrapRate) > 2 ? 'Melebihi Target' : 'Terkendali'} 
          color={Number(metrics.scrapRate) > 2 ? 'rose' : 'amber'} 
          icon={AlertTriangle} 
        />
        <KPICard 
          title="OPERATIONAL OEE" 
          value={metrics.oee + '%'} 
          unit="Overall Eff." 
          trend="World Class" 
          color="cyan" 
          icon={Cpu} 
        />
      </div>

      {/* ─── TAB 1: VISION INSPECTION STATION ─── */}
      {activeTab === 'inspection' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT 7 COLS: CAMERA HUD & BOUNDING BOX DETECTOR */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">LIVE INDUSTRIAL OPTICAL CAM #04</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                    60 FPS • 4K RES • HDR
                  </span>
                </div>
              </div>

              {/* Camera Simulated Viewport with Laser & Bounding Box */}
              <div className="relative w-full aspect-video bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center select-none">
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-25" />

                {/* Simulated Part Graphic */}
                <div className="relative z-10 w-3/4 max-w-sm h-40 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-2xl border-2 border-slate-600 shadow-2xl flex flex-col items-center justify-center p-4">
                  <div className="text-[10px] font-mono text-slate-400 tracking-wider uppercase mb-1">
                    {currentSample.sku}
                  </div>
                  <div className="text-sm font-black text-white text-center">
                    {currentSample.name}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-300 font-mono">
                    <span>L: {currentSample.dimensions.length}mm</span>
                    <span>W: {currentSample.dimensions.width}mm</span>
                    <span className="text-indigo-400">±{currentSample.dimensions.tolerance}mm</span>
                  </div>

                  {/* Visual Bounding Box if Defect Exists */}
                  {currentSample.boundingBox && !isScanning && (
                    <div 
                      className="absolute border-2 border-rose-500 bg-rose-500/20 rounded animate-pulse"
                      style={{
                        left: currentSample.boundingBox.x + '%',
                        top: currentSample.boundingBox.y + '%',
                        width: currentSample.boundingBox.w + '%',
                        height: currentSample.boundingBox.h + '%'
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                        ⚠️ {currentSample.boundingBox.label} ({currentSample.confidence}%)
                      </div>
                    </div>
                  )}

                  {/* Clean Spec Badge if PASS */}
                  {!currentSample.boundingBox && !isScanning && (
                    <div className="absolute inset-x-4 bottom-3 flex items-center justify-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold py-1 rounded-lg">
                      <CheckCircle2 size={12} />
                      DIMENSI & PERMUKAAN MEMENUHI STANDAR
                    </div>
                  )}
                </div>

                {/* Crosshair HUD */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-16 h-16 border-t-2 border-b-2 border-indigo-500/50" />
                  <div className="absolute w-16 h-16 border-l-2 border-r-2 border-indigo-500/50" />
                  <div className="absolute w-2 h-2 rounded-full bg-indigo-400" />
                </div>

                {/* Laser Sweep Animation when Scanning */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce top-1/2" />
                )}
              </div>

              {/* Part Test Sample Selector */}
              <div className="mt-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Pilih Contoh Part Simulasi Inspeksi:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {INSPECTION_SAMPLES.map((sample, idx) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => setSelectedSampleIndex(idx)}
                      className={'p-2.5 rounded-xl border text-left transition ' + (
                        selectedSampleIndex === idx 
                          ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-500/20' 
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      )}
                    >
                      <div className="text-[10px] font-mono text-slate-400">{sample.id}</div>
                      <div className="text-xs font-bold text-white truncate">{sample.name}</div>
                      <div className={'text-[10px] font-black mt-1 ' + (
                        sample.status === 'PASS' ? 'text-emerald-400' :
                        sample.status === 'REWORK' ? 'text-amber-400' : 'text-rose-400'
                      )}>
                        ● {sample.status}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Trigger Button & Status Verdict */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={'px-3.5 py-2 rounded-xl text-xs font-black tracking-wider flex items-center gap-2 ' + (
                  currentSample.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  currentSample.status === 'REWORK' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                )}>
                  {currentSample.status === 'PASS' && <CheckCircle2 size={16} />}
                  {currentSample.status === 'REWORK' && <Wrench size={16} />}
                  {currentSample.status === 'FAIL' && <XCircle size={16} />}
                  <span>VERDICT: {currentSample.status}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Confidence: <strong className="text-white">{currentSample.confidence}%</strong>
                </span>
              </div>

              <button
                type="button"
                disabled={isScanning}
                onClick={handleTriggerInspection}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-400 hover:to-pink-500 text-white shadow-xl shadow-purple-600/30 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Menganalisis dengan Vision AI...</span>
                  </>
                ) : (
                  <>
                    <Camera size={14} />
                    <span>Ambil Foto & Inspeksi Part</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT 5 COLS: GEMINI REASONING & ROOT CAUSE ACTION */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Real-Time Gemini Copilot Reasoning Card */}
            <div className="bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-500/30 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Gemini Operational Intelligence</h3>
                    <p className="text-[10px] text-purple-300 font-mono">Vertex AI Model: Gemini-1.5-Pro</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40">
                  REAL-TIME
                </span>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-purple-900/40 mb-3">
                <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                  Diagnosa Kualitas:
                </div>
                <div className="text-xs font-black text-white mb-2">
                  {currentSample.copilotAnalysis.headline}
                </div>
                <div className="text-xs text-slate-300 leading-relaxed mb-3">
                  <strong className="text-slate-100">Akar Masalah (Root Cause):</strong> {currentSample.copilotAnalysis.rootCause}
                </div>
                <div className="p-2.5 rounded-lg bg-purple-950/50 border border-purple-500/30 text-xs text-purple-200">
                  <strong className="text-white block mb-0.5">⚡ Tindakan Koreksi (Actionable SOP):</strong>
                  {currentSample.copilotAnalysis.recommendation}
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-300">
                <TrendingDown size={14} className="text-emerald-400 shrink-0" />
                <span>
                  <strong className="text-emerald-400">Efisiensi & Scrap:</strong> {currentSample.copilotAnalysis.wasteImpact}
                </span>
              </div>
            </div>

            {/* Quick Copilot Interactive Prompts */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sliders size={13} className="text-indigo-400" />
                <span>Quick Actions Operator</span>
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setInputQuestion('Bagaimana SOP penanganan defect ' + currentSample.defectType + '?');
                    setActiveTab('copilot');
                  }}
                  className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition flex items-center justify-between"
                >
                  <span>Lihat SOP Penanganan Defect ({currentSample.defectType})</span>
                  <ChevronRight size={14} className="text-slate-500" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputQuestion('Berapa estimasi penghematan scrap jika part ini di-rework?');
                    setActiveTab('copilot');
                  }}
                  className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition flex items-center justify-between"
                >
                  <span>Analisis Pengurangan Limbah & Scrap (Sustainability)</span>
                  <ChevronRight size={14} className="text-slate-500" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputQuestion('Kirim sinyal peringatan pemeliharaan ke teknisi maintenance');
                    setActiveTab('copilot');
                  }}
                  className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition flex items-center justify-between"
                >
                  <span>Kirim Alert Maintenance via Google Cloud Pub/Sub</span>
                  <ChevronRight size={14} className="text-slate-500" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 2: GEMINI OPERATIONAL COPILOT CHAT ─── */}
      {activeTab === 'copilot' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl max-w-4xl mx-auto flex flex-col h-[580px]">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-black text-white text-sm">Gemini Industrial Assistant</h3>
                <p className="text-[11px] text-slate-400">Tanyakan rekomendasi SOP, analisis sensor BigQuery, atau panduan perbaikan</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              ● Google Vertex AI Connected
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {chatMessages.map((msg, index) => (
              <div 
                key={index} 
                className={'flex ' + (msg.sender === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div className={'max-w-xl rounded-2xl p-3.5 text-xs leading-relaxed ' + (
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none'
                )}>
                  {msg.sender === 'gemini' && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400 mb-1">
                      <Sparkles size={11} />
                      GEMINI REASONING ENGINE
                    </div>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Tanyakan ke Gemini: misal 'Bagaimana cara mencegah defect goresan di Stamping Press?'..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
            >
              <span>Kirim</span>
              <Send size={13} />
            </button>
          </form>
        </div>
      )}

      {/* ─── TAB 3: PLANT ANALYTICS & BIGQUERY LOG ─── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Pareto Defect Breakdown & Sustainability Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Defect Distribution</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Surface Scratch</span>
                    <span className="font-bold text-rose-400">55%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '55%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Missing Fasteners</span>
                    <span className="font-bold text-amber-400">25%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Weld Porosity</span>
                    <span className="font-bold text-cyan-400">20%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sustainability & Waste Impact</h4>
              <div className="text-2xl font-black text-emerald-400 mb-1">42.8 kg</div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Material scrap berhasil dicegah hari ini berkat pendeteksian dini Vision AI sebelum proses coating/painting lanjutan.
              </p>
              <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
                🌱 Est. Pengurangan Emisi: ~68.4 kg CO2e
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Google Cloud Pipeline</h4>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Ingestion:</span>
                  <span className="font-mono text-indigo-400">Cloud Pub/Sub (12 msg/s)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">ETL Pipeline:</span>
                  <span className="font-mono text-purple-400">Google Cloud Dataflow</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Data Warehouse:</span>
                  <span className="font-mono text-emerald-400">BigQuery: mavi_telemetry</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filterable BigQuery Inspection Event Log Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <Database size={15} className="text-emerald-400" />
                  <span>BigQuery Real-Time Inspection Event Stream</span>
                </h3>
                <p className="text-xs text-slate-400">Audit trail lengkap seluruh rekaman inspeksi visual dan keputusan otomatis</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari SKU atau defect..."
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PASS">PASS Saja</option>
                  <option value="FAIL">FAIL Saja</option>
                  <option value="REWORK">REWORK Saja</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                  <tr>
                    <th className="p-3">Log ID</th>
                    <th className="p-3">SKU & Part</th>
                    <th className="p-3">Defect Detected</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">BigQuery Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-slate-400">{log.id}</td>
                      <td className="p-3 font-sans font-bold text-white">{log.sku}</td>
                      <td className="p-3 font-sans text-slate-300">{log.defect}</td>
                      <td className="p-3">
                        <span className={'px-2 py-0.5 rounded text-[10px] font-black ' + (
                          log.result === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' :
                          log.result === 'REWORK' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-rose-500/20 text-rose-300'
                        )}>
                          {log.result}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{log.conf}%</td>
                      <td className="p-3 text-slate-400">{log.time}</td>
                      <td className="p-3 font-sans">
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <Check size={12} />
                          Synced
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ─── BOTTOM STATUS TICKER ─── */}
      <footer className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Google Cloud Vertex AI & BigQuery Service Health: <strong>100% OPERATIONAL</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Latensi Vision AI: <strong>42ms</strong></span>
          <span>Gemini Reasoning Token Latency: <strong>120ms</strong></span>
        </div>
      </footer>

    </div>
  );
}
`;
