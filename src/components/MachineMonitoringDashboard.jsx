/**
 * MachineMonitoringDashboard.jsx
 * =========================================================================
 * Industrial 4.0 Real-time Machine Monitoring & SCADA OEE Dashboard Template
 * 
 * Features:
 * 1. Live Shopfloor Status Overview (Running, Idle, Alarm, Offline, Maintenance)
 * 2. Plant-wide & Per-Machine OEE Metrics (Availability, Performance, Quality)
 * 3. Real-time Telemetry Gauges (Spindle RPM, Temperature °C, Vibration mm/s, Power kW)
 * 4. Interactive Grid & Sequential Production Line Flow View
 * 5. Deep-Dive Machine Inspector Drawer with Live Charts & PLC Tag Monitor
 * 6. Automated Shift Reports, Alarm Acknowledgment, & Live Stream / Sim Mode
 * =========================================================================
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, BarChart2, Bell, CheckCircle2,
  Clock, Cpu, Download, Eye, Filter, Flame, Gauge, Grid, HardDrive,
  Layers, Maximize2, Pause, Play, Power, RefreshCw, RotateCcw,
  Search, Settings, ShieldAlert, ShieldCheck, Sparkles, StopCircle,
  Thermometer, Tv, User, Users, Wrench, X, Zap, ArrowUpRight,
  TrendingUp, Sliders, FileSpreadsheet, Check
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// ─── Initial Production Machines Dataset ───
const INITIAL_MACHINES = [
  {
    id: 'MCH-CNC-01',
    name: '5-Axis CNC Milling Center 01',
    type: 'CNC Mill',
    line: 'Line 1 - Precision Machining',
    location: 'Bay A-1',
    status: 'RUNNING', // RUNNING | IDLE | ALARM | OFFLINE | MAINTENANCE
    oee: 88.5,
    availability: 94.2,
    performance: 94.8,
    quality: 99.1,
    currentPart: 'PRT-FLG-450X (Flange Housing)',
    operator: 'Budi Santoso',
    shiftOutput: 342,
    shiftTarget: 380,
    cycleTime: 42.5,
    stdCycleTime: 40.0,
    spindleRpm: 12450,
    maxRpm: 15000,
    temperature: 46.8,
    vibration: 1.45,
    powerKw: 18.4,
    healthScore: 94,
    nextMaintenance: '14 Days',
    plcAddress: 'opc.tcp://192.168.1.101:4840',
    tags: [
      { tag: 'Spindle_Speed_RPM', address: 'DB1.DBD10', value: 12450, unit: 'RPM', quality: 'GOOD' },
      { tag: 'Spindle_Temp_C', address: 'DB1.DBD14', value: 46.8, unit: '°C', quality: 'GOOD' },
      { tag: 'Vibration_RMS', address: 'DB1.DBD18', value: 1.45, unit: 'mm/s', quality: 'GOOD' },
      { tag: 'Feed_Rate_Actual', address: 'DB1.DBD22', value: 1200, unit: 'mm/min', quality: 'GOOD' },
      { tag: 'Coolant_Pressure', address: 'DB1.DBD26', value: 6.2, unit: 'Bar', quality: 'GOOD' }
    ]
  },
  {
    id: 'MCH-CNC-02',
    name: 'High-Torque CNC Lathe 02',
    type: 'CNC Lathe',
    line: 'Line 1 - Precision Machining',
    location: 'Bay A-2',
    status: 'RUNNING',
    oee: 84.1,
    availability: 91.0,
    performance: 93.2,
    quality: 99.2,
    currentPart: 'PRT-SFT-120A (Stepper Shaft)',
    operator: 'Ahmad Fauzi',
    shiftOutput: 510,
    shiftTarget: 550,
    cycleTime: 28.0,
    stdCycleTime: 26.5,
    spindleRpm: 3450,
    maxRpm: 4500,
    temperature: 52.4,
    vibration: 2.10,
    powerKw: 14.2,
    healthScore: 89,
    nextMaintenance: '8 Days',
    plcAddress: 'opc.tcp://192.168.1.102:4840',
    tags: [
      { tag: 'Chuckle_Speed_RPM', address: 'DB2.DBD10', value: 3450, unit: 'RPM', quality: 'GOOD' },
      { tag: 'Main_Motor_Temp', address: 'DB2.DBD14', value: 52.4, unit: '°C', quality: 'GOOD' },
      { tag: 'Turret_Position', address: 'DB2.DBW20', value: 4, unit: 'Pos', quality: 'GOOD' }
    ]
  },
  {
    id: 'MCH-PRS-03',
    name: '200T Hydraulic Stamping Press',
    type: 'Stamping Press',
    line: 'Line 2 - Metal Stamping',
    location: 'Bay B-1',
    status: 'ALARM',
    oee: 52.3,
    availability: 60.5,
    performance: 88.0,
    quality: 98.2,
    currentPart: 'PRT-SHT-BASE (Panel Chassis)',
    operator: 'Rian Hidayat',
    shiftOutput: 890,
    shiftTarget: 1400,
    cycleTime: 4.8,
    stdCycleTime: 3.5,
    spindleRpm: 0,
    maxRpm: 120,
    temperature: 68.2,
    vibration: 4.80,
    powerKw: 32.5,
    healthScore: 61,
    nextMaintenance: 'URGENT (Overheat)',
    alarmCode: 'ALM-HYD-402: Hydraulic Oil Temperature Exceeded 65°C Limit',
    plcAddress: 'opc.tcp://192.168.1.103:4840',
    tags: [
      { tag: 'Hydraulic_Pressure', address: 'MW100', value: 185.4, unit: 'Bar', quality: 'GOOD' },
      { tag: 'Oil_Temp_Alarm', address: 'M20.1', value: 1, unit: 'BOOL', quality: 'ALARM' },
      { tag: 'Stroke_Counter', address: 'MD110', value: 890, unit: 'Strokes', quality: 'GOOD' }
    ]
  },
  {
    id: 'MCH-INJ-04',
    name: 'All-Electric Injection Molding 350T',
    type: 'Plastic Injection',
    line: 'Line 3 - Polymer Molding',
    location: 'Bay C-1',
    status: 'RUNNING',
    oee: 92.4,
    availability: 96.5,
    performance: 96.0,
    quality: 99.7,
    currentPart: 'PRT-HOU-PLAST (Sensor Enclosure)',
    operator: 'Dewi Lestari',
    shiftOutput: 1240,
    shiftTarget: 1300,
    cycleTime: 18.2,
    stdCycleTime: 18.0,
    spindleRpm: 480,
    maxRpm: 600,
    temperature: 215.0,
    vibration: 0.85,
    powerKw: 24.8,
    healthScore: 97,
    nextMaintenance: '28 Days',
    plcAddress: 'opc.tcp://192.168.1.104:4840',
    tags: [
      { tag: 'Barrel_Zone1_Temp', address: 'DB4.DBD10', value: 215.0, unit: '°C', quality: 'GOOD' },
      { tag: 'Injection_Pressure', address: 'DB4.DBD14', value: 142.5, unit: 'Bar', quality: 'GOOD' },
      { tag: 'Clamping_Force', address: 'DB4.DBD18', value: 350.0, unit: 'Ton', quality: 'GOOD' }
    ]
  },
  {
    id: 'MCH-WLD-05',
    name: '6-Axis Robotic TIG Welding Cell',
    type: 'Robotic Welder',
    line: 'Line 4 - Welding & Assembly',
    location: 'Bay D-1',
    status: 'IDLE',
    oee: 74.0,
    availability: 80.0,
    performance: 93.0,
    quality: 99.5,
    currentPart: 'ASM-EXH-01 (Exhaust Manifold)',
    operator: 'Eko Prasetyo',
    shiftOutput: 180,
    shiftTarget: 220,
    cycleTime: 65.0,
    stdCycleTime: 62.0,
    spindleRpm: 0,
    maxRpm: 0,
    temperature: 38.0,
    vibration: 0.42,
    powerKw: 6.2,
    healthScore: 92,
    nextMaintenance: '19 Days',
    plcAddress: 'opc.tcp://192.168.1.105:4840',
    tags: [
      { tag: 'Arc_Voltage', address: 'DB5.DBD10', value: 0.0, unit: 'V', quality: 'IDLE' },
      { tag: 'Gas_Flow_Rate', address: 'DB5.DBD14', value: 0.0, unit: 'L/min', quality: 'IDLE' },
      { tag: 'Robot_State', address: 'DB5.DBW0', value: 'WAIT_FIXTURE', unit: 'STR', quality: 'GOOD' }
    ]
  },
  {
    id: 'MCH-CMM-06',
    name: 'Bridge CMM Quality Metrology',
    type: 'CMM Inspection',
    line: 'Line 4 - Welding & Assembly',
    location: 'Bay Q-1 (Metrology Room)',
    status: 'RUNNING',
    oee: 94.8,
    availability: 98.0,
    performance: 97.0,
    quality: 99.8,
    currentPart: 'QC Verification Station',
    operator: 'Inspector QC-01',
    shiftOutput: 95,
    shiftTarget: 100,
    cycleTime: 145.0,
    stdCycleTime: 140.0,
    spindleRpm: 0,
    maxRpm: 0,
    temperature: 20.1,
    vibration: 0.12,
    powerKw: 2.1,
    healthScore: 99,
    nextMaintenance: '45 Days',
    plcAddress: 'opc.tcp://192.168.1.106:4840',
    tags: [
      { tag: 'Probe_Calibrated', address: 'DB6.DBX0.0', value: 1, unit: 'BOOL', quality: 'GOOD' },
      { tag: 'Room_Temp_Metrology', address: 'DB6.DBD10', value: 20.1, unit: '°C', quality: 'GOOD' },
      { tag: 'Position_X_Abs', address: 'DB6.DBD20', value: 245.124, unit: 'mm', quality: 'GOOD' }
    ]
  }
];

export default function MachineMonitoringDashboard() {
  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [activeFilterLine, setActiveFilterLine] = useState('ALL');
  const [activeFilterStatus, setActiveFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewLayout, setViewLayout] = useState('grid'); // grid | flow | table
  const [isLiveStream, setIsLiveStream] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(2);
  const [selectedShift, setSelectedShift] = useState('Shift 1 (07:00 - 15:30)');

  // Telemetry Sparkline History
  const [telemetryHistory, setTelemetryHistory] = useState(() => {
    return INITIAL_MACHINES.reduce((acc, m) => {
      acc[m.id] = Array.from({ length: 15 }, () => m.temperature + (Math.random() * 4 - 2));
      return acc;
    }, {});
  });

  // ─── Real-time Live Simulation Engine ───
  useEffect(() => {
    if (!isLiveStream) return;

    const interval = setInterval(() => {
      setMachines(prev => prev.map(m => {
        if (m.status === 'RUNNING') {
          // Jitter RPM, Temp, Vibration, Output
          const rpmDelta = Math.floor(Math.random() * 80 - 40);
          const tempDelta = Number((Math.random() * 0.4 - 0.2).toFixed(1));
          const vibDelta = Number((Math.random() * 0.1 - 0.05).toFixed(2));
          const newTemp = Math.max(20, Math.min(95, m.temperature + tempDelta));
          const newRpm = Math.max(0, Math.min(m.maxRpm, m.spindleRpm + rpmDelta));
          const newVib = Math.max(0.1, Math.min(8.0, m.vibration + vibDelta));
          const addOutput = Math.random() > 0.85 ? 1 : 0;

          // Update sparkline history
          setTelemetryHistory(hist => {
            const arr = hist[m.id] || [];
            return {
              ...hist,
              [m.id]: [...arr.slice(1), newTemp]
            };
          });

          return {
            ...m,
            temperature: Number(newTemp.toFixed(1)),
            spindleRpm: newRpm,
            vibration: Number(newVib.toFixed(2)),
            shiftOutput: m.shiftOutput + addOutput
          };
        }
        return m;
      }));
    }, refreshIntervalSec * 1000);

    return () => clearInterval(interval);
  }, [isLiveStream, refreshIntervalSec]);

  // ─── Filtered Machines ───
  const filteredMachines = useMemo(() => {
    return machines.filter(m => {
      const matchLine = activeFilterLine === 'ALL' || m.line === activeFilterLine;
      const matchStatus = activeFilterStatus === 'ALL' || m.status === activeFilterStatus;
      const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.type.toLowerCase().includes(searchTerm.toLowerCase());
      return matchLine && matchStatus && matchSearch;
    });
  }, [machines, activeFilterLine, activeFilterStatus, searchTerm]);

  // ─── Plant Summary KPIs ───
  const summaryKpis = useMemo(() => {
    const total = machines.length;
    const running = machines.filter(m => m.status === 'RUNNING').length;
    const idle = machines.filter(m => m.status === 'IDLE').length;
    const alarm = machines.filter(m => m.status === 'ALARM').length;
    const offline = machines.filter(m => m.status === 'OFFLINE').length;

    const avgOee = (machines.reduce((s, m) => s + m.oee, 0) / total).toFixed(1);
    const avgAvailability = (machines.reduce((s, m) => s + m.availability, 0) / total).toFixed(1);
    const avgPerformance = (machines.reduce((s, m) => s + m.performance, 0) / total).toFixed(1);
    const avgQuality = (machines.reduce((s, m) => s + m.quality, 0) / total).toFixed(1);

    const totalOutput = machines.reduce((s, m) => s + m.shiftOutput, 0);
    const totalTarget = machines.reduce((s, m) => s + m.shiftTarget, 0);
    const totalPower = machines.reduce((s, m) => s + m.powerKw, 0).toFixed(1);

    return { total, running, idle, alarm, offline, avgOee, avgAvailability, avgPerformance, avgQuality, totalOutput, totalTarget, totalPower };
  }, [machines]);

  // Acknowledge Alarm Handler
  const handleAcknowledgeAlarm = (machineId) => {
    setMachines(prev => prev.map(m => {
      if (m.id === machineId) {
        toast.success(`Alarm pada mesin ${m.name} berhasil di-acknowledge. Status dialihkan ke IDLE.`, { icon: '🛡️' });
        return {
          ...m,
          status: 'IDLE',
          temperature: 55.0,
          alarmCode: null
        };
      }
      return m;
    }));
    if (selectedMachine?.id === machineId) {
      setSelectedMachine(prev => ({ ...prev, status: 'IDLE', alarmCode: null }));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b1120] text-slate-100 font-sans select-none overflow-hidden h-full">
      <Toaster position="top-right" />

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & SHIFT SUMMARY KPI BANNER                   */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-[#0f172a] border-b border-slate-800 px-6 py-3.5 flex flex-col gap-3 shrink-0 shadow-lg">
        
        {/* Row 1: Title, Shift, Live Telemetry Status, Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md border border-blue-400/30">
              <Activity size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight uppercase">
                  Machine Monitoring Dashboard
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  SCADA & IoT 4.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time Plant Floor Telemetry, OEE Metrics & Health Diagnostics
              </p>
            </div>
          </div>

          {/* Controls: Shift, Interval, Live Stream Switch */}
          <div className="flex items-center gap-2.5">
            {/* Shift Picker */}
            <select
              value={selectedShift}
              onChange={e => setSelectedShift(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Shift 1 (07:00 - 15:30)">🌅 Shift 1 (07:00 - 15:30)</option>
              <option value="Shift 2 (15:30 - 23:00)">🌇 Shift 2 (15:30 - 23:00)</option>
              <option value="Shift 3 (23:00 - 07:00)">🌙 Shift 3 (23:00 - 07:00)</option>
            </select>

            {/* Live Toggle */}
            <button
              onClick={() => setIsLiveStream(!isLiveStream)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                isLiveStream
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-xs'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveStream ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              {isLiveStream ? 'Live Stream 2s' : 'Paused'}
            </button>

            {/* Export Shift Report */}
            <button
              onClick={() => toast.success('Laporan Shift Mesin berhasil diekspor ke format Excel/CSV.', { icon: '📊' })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              Export Laporan
            </button>
          </div>
        </div>

        {/* Row 2: Plant-Wide Summary KPIs Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
          
          {/* Status Breakdown Mini Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Machine Status</span>
            <div className="flex items-center justify-between mt-1 text-xs font-bold">
              <span className="flex items-center gap-1 text-emerald-400">🟢 {summaryKpis.running}</span>
              <span className="flex items-center gap-1 text-amber-400">🟡 {summaryKpis.idle}</span>
              <span className="flex items-center gap-1 text-rose-400">🔴 {summaryKpis.alarm}</span>
              <span className="flex items-center gap-1 text-slate-400">⚪ {summaryKpis.offline}</span>
            </div>
          </div>

          {/* Plant Overall OEE Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              Overall Plant OEE
              <span className="text-[10px] text-blue-400 font-mono">World-Class &gt;85%</span>
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-black text-blue-400 font-mono">{summaryKpis.avgOee}%</span>
              <span className="text-[10px] text-slate-400">
                A:{summaryKpis.avgAvailability}% P:{summaryKpis.avgPerformance}% Q:{summaryKpis.avgQuality}%
              </span>
            </div>
          </div>

          {/* Total Shift Output vs Target */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Production</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-black text-emerald-400 font-mono">
                {summaryKpis.totalOutput.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 font-bold">
                / {summaryKpis.totalTarget.toLocaleString()} pcs ({((summaryKpis.totalOutput / summaryKpis.totalTarget) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Total Active Energy Power */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Power Demand</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-black text-amber-400 font-mono">{summaryKpis.totalPower} kW</span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Zap size={11} className="text-amber-400" /> 3-Phase Grid
              </span>
            </div>
          </div>

          {/* Average Health Score */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Health Index</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-black text-emerald-400 font-mono">92.6%</span>
              <span className="text-[10px] text-emerald-400 font-bold">Nominal</span>
            </div>
          </div>

          {/* Active Alarms Indicator */}
          <div className={`rounded-xl p-2.5 flex flex-col justify-between border transition-all ${
            summaryKpis.alarm > 0
              ? 'bg-rose-950/40 border-rose-600/60 shadow-lg shadow-rose-950/50'
              : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-between text-slate-400">
              Active Faults
              {summaryKpis.alarm > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-lg font-black font-mono ${summaryKpis.alarm > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                {summaryKpis.alarm} Alarm
              </span>
              <span className="text-[10px] text-slate-400">
                {summaryKpis.alarm > 0 ? 'Action Required' : 'All Clear'}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. FILTER TOOLBAR & LAYOUT SWITCHER                        */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between px-6 py-2.5 bg-[#090d16] border-b border-slate-800 gap-3 shrink-0">
        
        {/* Left: Line / Area Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'Line 1 - Precision Machining', 'Line 2 - Metal Stamping', 'Line 3 - Polymer Molding', 'Line 4 - Welding & Assembly'].map(line => (
            <button
              key={line}
              onClick={() => setActiveFilterLine(line)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeFilterLine === line
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {line === 'ALL' ? 'Semua Jalur (All Lines)' : line.split(' - ')[0]}
            </button>
          ))}
        </div>

        {/* Right: Search, Status Filter & View Switcher */}
        <div className="flex items-center gap-2.5">
          
          {/* Status Filter */}
          <select
            value={activeFilterStatus}
            onChange={e => setActiveFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="RUNNING">🟢 RUNNING (Aktif)</option>
            <option value="IDLE">🟡 IDLE (Standby)</option>
            <option value="ALARM">🔴 ALARM (Fault)</option>
            <option value="OFFLINE">⚪ OFFLINE</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID / Nama Mesin..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 w-48"
            />
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded cursor-pointer transition ${viewLayout === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Grid Card View"
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewLayout('flow')}
              className={`p-1.5 rounded cursor-pointer transition ${viewLayout === 'flow' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Sequential Production Line Flow View"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. MAIN MACHINE GRID & FLOW VIEWPORT                       */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* GRID VIEW */}
        {viewLayout === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMachines.map(machine => {
              const isAlarm = machine.status === 'ALARM';
              const isRunning = machine.status === 'RUNNING';
              const isIdle = machine.status === 'IDLE';

              return (
                <div
                  key={machine.id}
                  onClick={() => setSelectedMachine(machine)}
                  className={`bg-[#0f172a] rounded-2xl p-5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group hover:shadow-2xl hover:scale-[1.01] ${
                    isAlarm
                      ? 'border-rose-500/80 shadow-rose-950/40'
                      : isRunning
                      ? 'border-slate-800 hover:border-blue-500/50'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Top Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                            {machine.id}
                          </span>
                          <span className="text-[11px] text-slate-400">{machine.location}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1.5 group-hover:text-blue-300 transition-colors">
                          {machine.name}
                        </h3>
                      </div>

                      {/* Status Badge Beacon */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border flex items-center gap-1.5 shrink-0 ${
                        isRunning
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                          : isIdle
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : isAlarm
                          ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : isAlarm ? 'bg-white' : 'bg-amber-400'}`} />
                        {machine.status}
                      </span>
                    </div>

                    {/* Active Work Order & Part */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Part:</span>
                        <span className="font-bold text-slate-200 truncate max-w-[190px]">{machine.currentPart}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Operator:</span>
                        <span className="font-semibold text-slate-300">{machine.operator}</span>
                      </div>
                    </div>

                    {/* Live Telemetry Gauges Matrix */}
                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      {/* RPM / Speed */}
                      <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Spindle</span>
                        <span className="text-xs font-mono font-extrabold text-cyan-400">{machine.spindleRpm} RPM</span>
                      </div>
                      {/* Temp */}
                      <div className={`p-2 rounded-xl border ${
                        machine.temperature > 65
                          ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 font-bold'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300'
                      }`}>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Temp</span>
                        <span className="text-xs font-mono font-extrabold">{machine.temperature}°C</span>
                      </div>
                      {/* Vibration */}
                      <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Vibration</span>
                        <span className="text-xs font-mono font-extrabold text-amber-400">{machine.vibration} mm/s</span>
                      </div>
                    </div>

                    {/* Progress: Output vs Target */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Shift Output</span>
                        <span className="font-bold font-mono text-white">
                          {machine.shiftOutput} / {machine.shiftTarget} pcs
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isAlarm ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, (machine.shiftOutput / machine.shiftTarget) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer: OEE & Quick Inspect Button */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Machine OEE</span>
                      <span className="text-sm font-black font-mono text-blue-400">{machine.oee}%</span>
                    </div>

                    {isAlarm ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledgeAlarm(machine.id);
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md transition cursor-pointer"
                      >
                        Reset Alarm
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Detail Telemetri ➔
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FLOW VIEW (Sequential Production Line) */}
        {viewLayout === 'flow' && (
          <div className="flex flex-col gap-6 overflow-x-auto pb-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Sequential Process Flow (Raw Material ➔ Machining ➔ Stamping ➔ Assembly ➔ QC)
            </div>

            <div className="flex items-center gap-4 min-w-[900px]">
              {filteredMachines.map((machine, idx) => (
                <React.Fragment key={machine.id}>
                  <div
                    onClick={() => setSelectedMachine(machine)}
                    className="w-64 bg-[#0f172a] rounded-2xl p-4 border border-slate-800 hover:border-blue-500 transition-all cursor-pointer shrink-0 shadow-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                        Step {idx + 1}
                      </span>
                      <span className={`w-2.5 h-2.5 rounded-full ${machine.status === 'RUNNING' ? 'bg-emerald-400 animate-ping' : machine.status === 'ALARM' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white truncate">{machine.name}</h4>
                      <p className="text-[10px] text-slate-400">{machine.type}</p>
                    </div>

                    <div className="text-xs font-mono font-bold text-emerald-400">
                      OEE: {machine.oee}% | {machine.shiftOutput} pcs
                    </div>
                  </div>

                  {idx < filteredMachines.length - 1 && (
                    <div className="flex items-center justify-center text-slate-600 shrink-0">
                      <ArrowRight size={20} className="text-blue-500 animate-pulse" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. DEEP-DIVE MACHINE INSPECTION DRAWER                     */}
      {/* ────────────────────────────────────────────────────────── */}
      {selectedMachine && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-[#0f172a] border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-mono font-black text-sm">
                  {selectedMachine.id.slice(-2)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedMachine.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{selectedMachine.line}</span>
                    <span>•</span>
                    <span className="font-mono text-cyan-400">{selectedMachine.plcAddress}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMachine(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Alarm Banner if Active */}
              {selectedMachine.status === 'ALARM' && (
                <div className="bg-rose-950/60 border border-rose-600 rounded-xl p-4 flex items-start justify-between gap-3 shadow-lg">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert size={20} className="text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-300">ACTIVE CRITICAL ALARM</h4>
                      <p className="text-xs text-rose-200 mt-0.5">{selectedMachine.alarmCode}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcknowledgeAlarm(selectedMachine.id)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shrink-0 transition cursor-pointer"
                  >
                    Acknowledge
                  </button>
                </div>
              )}

              {/* OEE 3-Pillar Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  OEE Pillars & Availability Breakdown
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">Overall OEE</span>
                    <span className="text-base font-black font-mono text-blue-400">{selectedMachine.oee}%</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">Availability</span>
                    <span className="text-base font-black font-mono text-emerald-400">{selectedMachine.availability}%</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">Performance</span>
                    <span className="text-base font-black font-mono text-cyan-400">{selectedMachine.performance}%</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">Quality</span>
                    <span className="text-base font-black font-mono text-indigo-400">{selectedMachine.quality}%</span>
                  </div>
                </div>
              </div>

              {/* Real-time Temperature Telemetry Trend Graph */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Live Thermal Telemetry Stream (°C)</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Sampling: 2s Interval</span>
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-36 flex items-end gap-1.5">
                  {(telemetryHistory[selectedMachine.id] || []).map((val, idx) => {
                    const heightPercent = Math.min(100, Math.max(10, ((val - 20) / 70) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div
                          className={`w-full rounded-t transition-all duration-300 ${
                            val > 65 ? 'bg-rose-500' : 'bg-gradient-to-t from-blue-600 to-cyan-400'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                          title={`Sample #${idx + 1}: ${val.toFixed(1)}°C`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PLC / Modbus Tags Live Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Live PLC Tags & Modbus Registers ({selectedMachine.tags?.length || 0})
                </h4>
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Tag Name</th>
                        <th className="p-2.5">PLC Address</th>
                        <th className="p-2.5 text-right">Live Value</th>
                        <th className="p-2.5 text-center">Quality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {selectedMachine.tags?.map((t, i) => (
                        <tr key={i} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-sans font-medium text-slate-200">{t.tag}</td>
                          <td className="p-2.5 text-slate-400">{t.address}</td>
                          <td className="p-2.5 text-right text-cyan-400 font-bold">{t.value} {t.unit}</td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                              {t.quality}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Predictive Maintenance & Asset Health */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Predictive Asset Health</span>
                  <div className="text-sm font-bold text-white mt-0.5">
                    Health Score: <span className="text-emerald-400 font-mono">{selectedMachine.healthScore}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Next PM Schedule</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{selectedMachine.nextMaintenance}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
